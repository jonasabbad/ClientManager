import { db } from "./db";
import { clients, type Client, type InsertClient, type UpdateClient } from "@shared/schema";
import { eq, or, ilike, sql } from "drizzle-orm";

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
          ilike(clients.phone, searchPattern),
          ilike(clients.email, searchPattern),
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
}

export const storage = new DatabaseStorage();
