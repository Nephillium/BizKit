import {
  users,
  generations,
  anonymousUsage,
  type User,
  type UpsertUser,
  type Generation,
  type InsertGeneration,
  type AnonymousUsage,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  incrementUserUsage(id: string): Promise<number>;
  updateUserSubscription(id: string, isSubscribed: boolean, stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<User>;
  // Anonymous usage operations
  getAnonymousUsage(fingerprint: string): Promise<AnonymousUsage | undefined>;
  incrementAnonymousUsage(fingerprint: string): Promise<number>;
  // Generation operations
  createGeneration(generation: InsertGeneration): Promise<Generation>;
  getGenerations(userId: string): Promise<Generation[]>;
  getGeneration(id: number): Promise<Generation | undefined>;
  deleteGeneration(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async incrementUserUsage(id: string): Promise<number> {
    const [updated] = await db
      .update(users)
      .set({ 
        usageCount: sql`${users.usageCount} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return updated?.usageCount ?? 0;
  }

  async updateUserSubscription(
    id: string, 
    isSubscribed: boolean, 
    stripeCustomerId?: string, 
    stripeSubscriptionId?: string
  ): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        isSubscribed,
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Anonymous usage operations
  async getAnonymousUsage(fingerprint: string): Promise<AnonymousUsage | undefined> {
    const [usage] = await db
      .select()
      .from(anonymousUsage)
      .where(eq(anonymousUsage.fingerprint, fingerprint));
    return usage;
  }

  async incrementAnonymousUsage(fingerprint: string): Promise<number> {
    const [result] = await db
      .insert(anonymousUsage)
      .values({ fingerprint, usageCount: 1 })
      .onConflictDoUpdate({
        target: anonymousUsage.fingerprint,
        set: { usageCount: sql`${anonymousUsage.usageCount} + 1` },
      })
      .returning();
    return result?.usageCount ?? 0;
  }

  // Generation operations
  async createGeneration(generation: InsertGeneration): Promise<Generation> {
    const [created] = await db.insert(generations).values(generation).returning();
    return created;
  }

  async getGenerations(userId: string): Promise<Generation[]> {
    return await db
      .select()
      .from(generations)
      .where(eq(generations.userId, userId))
      .orderBy(desc(generations.createdAt));
  }

  async getGeneration(id: number): Promise<Generation | undefined> {
    const [generation] = await db
      .select()
      .from(generations)
      .where(eq(generations.id, id));
    return generation;
  }

  async deleteGeneration(id: number): Promise<void> {
    await db.delete(generations).where(eq(generations.id, id));
  }
}

export const storage = new DatabaseStorage();
