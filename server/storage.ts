import { db } from "./db";
import { clients, activities, serviceCodes, users, type Client, type InsertClient, type UpdateClient, type Activity, type InsertActivity, type ServiceCodeConfig, type InsertServiceCode, type UpdateServiceCode, type User, type UpsertUser } from "@shared/schema";
import { eq, or, ilike, sql, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  getAllClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  searchClients(query: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  getStatistics(): Promise<{
    totalClients: number;
    totalCodes: number;
    clientsThisMonth: number;
    serviceBreakdown: Record<string, number>;
  }>;
  // Activity methods
  getAllActivities(): Promise<Activity[]>;
  getActivitiesByDate(date: Date): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  // Service Code methods
  getAllServiceCodes(): Promise<ServiceCodeConfig[]>;
  getServiceCode(id: number): Promise<ServiceCodeConfig | undefined>;
  createServiceCode(serviceCode: InsertServiceCode): Promise<ServiceCodeConfig>;
  updateServiceCode(id: number, serviceCode: Partial<UpdateServiceCode>): Promise<ServiceCodeConfig | undefined>;
  deleteServiceCode(id: number): Promise<boolean>;
  // User operations - Required for Replit Auth (from blueprint:javascript_log_in_with_replit)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(sql`${clients.updatedAt} DESC`);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async searchClients(query: string): Promise<Client[]> {
    if (!query.trim()) {
      return this.getAllClients();
    }

    const searchPattern = `%${query}%`;
    
    return await db
      .select()
      .from(clients)
      .where(
        or(
          ilike(clients.name, searchPattern),
          sql`coalesce(${clients.phone}, '') ILIKE ${searchPattern}`,
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${clients.codes}) AS code_elem
            WHERE code_elem->>'code' ILIKE ${searchPattern}
          )`
        )
      )
      .orderBy(sql`${clients.updatedAt} DESC`);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values({
      ...client,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db
      .update(clients)
      .set({
        ...clientData,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  async getStatistics() {
    const allClients = await this.getAllClients();
    
    const totalClients = allClients.length;
    const totalCodes = allClients.reduce((sum, client) => sum + client.codes.length, 0);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const clientsThisMonth = allClients.filter(
      client => new Date(client.createdAt) >= startOfMonth
    ).length;

    const serviceBreakdown: Record<string, number> = {};
    allClients.forEach(client => {
      client.codes.forEach(codeItem => {
        serviceBreakdown[codeItem.service] = (serviceBreakdown[codeItem.service] || 0) + 1;
      });
    });

    return {
      totalClients,
      totalCodes,
      clientsThisMonth,
      serviceBreakdown,
    };
  }

  async getAllActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(100);
  }

  async getActivitiesByDate(date: Date): Promise<Activity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(activities)
      .where(
        sql`${activities.createdAt} >= ${startOfDay} AND ${activities.createdAt} <= ${endOfDay}`
      )
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values({
      ...activity,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async getAllServiceCodes(): Promise<ServiceCodeConfig[]> {
    return await db.select().from(serviceCodes).orderBy(serviceCodes.name);
  }

  async getServiceCode(id: number): Promise<ServiceCodeConfig | undefined> {
    const result = await db.select().from(serviceCodes).where(eq(serviceCodes.id, id)).limit(1);
    return result[0];
  }

  async createServiceCode(serviceCode: InsertServiceCode): Promise<ServiceCodeConfig> {
    const result = await db.insert(serviceCodes).values({
      ...serviceCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateServiceCode(id: number, serviceCodeData: Partial<UpdateServiceCode>): Promise<ServiceCodeConfig | undefined> {
    const result = await db
      .update(serviceCodes)
      .set({
        ...serviceCodeData,
        updatedAt: new Date(),
      })
      .where(eq(serviceCodes.id, id))
      .returning();
    return result[0];
  }

  async deleteServiceCode(id: number): Promise<boolean> {
    const result = await db.delete(serviceCodes).where(eq(serviceCodes.id, id)).returning();
    return result.length > 0;
  }

  // User operations - Required for Replit Auth (from blueprint:javascript_log_in_with_replit)
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
}

export const storage = new DatabaseStorage();
