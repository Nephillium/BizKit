import {
  users,
  generations,
  type User,
  type UpsertUser,
  type Generation,
  type InsertGeneration,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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
