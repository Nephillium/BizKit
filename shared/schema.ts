import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  isSubscribed: boolean("is_subscribed").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Anonymous usage tracking (by fingerprint/IP)
export const anonymousUsage = pgTable("anonymous_usage", {
  id: serial("id").primaryKey(),
  fingerprint: varchar("fingerprint").notNull().unique(),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AnonymousUsage = typeof anonymousUsage.$inferSelect;

// Generation history table for storing user's past generations
export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  toolType: varchar("tool_type", { length: 50 }).notNull(),
  inputs: jsonb("inputs").notNull(),
  output: text("output").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGenerationSchema = createInsertSchema(generations).omit({
  id: true,
  createdAt: true,
});
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;
export type Generation = typeof generations.$inferSelect;
