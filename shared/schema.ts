import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
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
  action: text("action").notNull(), // 'created', 'updated', 'deleted', 'code_added'
  description: text("description").notNull(),
  clientName: text("client_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients, {
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  codes: z.array(z.object({
    service: z.enum(["inwi", "orange", "maroc-telecom", "water", "gas", "electricity"]),
    code: z.string().min(1, "Code is required"),
    accountHolderName: z.string().min(1, "Account holder name is required"),
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

export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type Client = typeof clients.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ServiceCode = {
  service: "inwi" | "orange" | "maroc-telecom" | "water" | "gas" | "electricity";
  code: string;
  accountHolderName?: string;
  address?: string;
  phoneNumber?: string;
};
