import { pgTable, text, serial, timestamp, jsonb, integer, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  codes: jsonb("codes").notNull().$type<{ 
    service: string; 
    code: string;
    accountHolderName?: string;
    address?: string;
    phoneNumber?: string;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  action: text("action").notNull(), // 'created', 'updated', 'deleted', 'code_added', 'service_added', 'service_updated', 'service_deleted'
  description: text("description").notNull(),
  clientName: text("client_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceCodes = pgTable("service_codes", {
  id: serial("id").primaryKey(),
  serviceId: text("service_id").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session storage table - Required for Replit Auth (from blueprint:javascript_log_in_with_replit)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth (from blueprint:javascript_log_in_with_replit)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients, {
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  codes: z.array(z.object({
    service: z.string().min(1, "Service type is required"),
    code: z.string().min(1, "Code is required"),
    accountHolderName: z.string().optional(), // Made optional for backward compatibility
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
  })),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateClientSchema = insertClientSchema.partial().extend({
  id: z.number(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertServiceCodeSchema = createInsertSchema(serviceCodes, {
  serviceId: z.string().min(1, "Service ID is required"),
  name: z.string().min(1, "Service name is required"),
  category: z.string().min(1, "Category is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateServiceCodeSchema = insertServiceCodeSchema.partial().extend({
  id: z.number(),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type Client = typeof clients.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertServiceCode = z.infer<typeof insertServiceCodeSchema>;
export type UpdateServiceCode = z.infer<typeof updateServiceCodeSchema>;
export type ServiceCodeConfig = typeof serviceCodes.$inferSelect;
export type ServiceCode = {
  service: string;
  code: string;
  accountHolderName?: string;
  address?: string;
  phoneNumber?: string;
};

// User types - Required for Replit Auth (from blueprint:javascript_log_in_with_replit)
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
