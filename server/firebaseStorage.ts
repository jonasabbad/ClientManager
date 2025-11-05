import { getDb } from './firebase';
import type { 
  Client, 
  InsertClient, 
  Activity, 
  InsertActivity,
  ServiceCodeConfig,
  InsertServiceCode,
  UpdateServiceCode
} from '@shared/schema';
import { Timestamp } from 'firebase-admin/firestore';

const db = getDb();

export const firebaseStorage = {
  // Client operations
  async getAllClients(): Promise<Client[]> {
    const snapshot = await db.collection('clients').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: parseInt(doc.id),
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as Client));
  },

  async getClient(id: number): Promise<Client | null> {
    const doc = await db.collection('clients').doc(id.toString()).get();
    if (!doc.exists) return null;
    
    return {
      id: parseInt(doc.id),
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as Client;
  },

  async createClient(data: InsertClient): Promise<Client> {
    const clientRef = db.collection('clients').doc();
    const id = parseInt(clientRef.id.substring(0, 8), 16); // Generate numeric ID from doc ID
    
    const now = Timestamp.now();
    const clientData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    
    await clientRef.set(clientData);
    
    return {
      id,
      ...clientData,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    } as Client;
  },

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | null> {
    const clientRef = db.collection('clients').doc(id.toString());
    const doc = await clientRef.get();
    
    if (!doc.exists) return null;
    
    const now = Timestamp.now();
    await clientRef.update({
      ...data,
      updatedAt: now,
    });
    
    const updated = await clientRef.get();
    return {
      id: parseInt(updated.id),
      ...updated.data(),
      createdAt: updated.data()?.createdAt?.toDate(),
      updatedAt: updated.data()?.updatedAt?.toDate(),
    } as Client;
  },

  async deleteClient(id: number): Promise<boolean> {
    const clientRef = db.collection('clients').doc(id.toString());
    const doc = await clientRef.get();
    
    if (!doc.exists) return false;
    
    await clientRef.delete();
    return true;
  },

  async searchClients(query: string): Promise<Client[]> {
    // Firestore doesn't support full-text search natively
    // We'll fetch all clients and filter in memory
    // For production, consider using Algolia or similar
    const allClients = await this.getAllClients();
    const lowerQuery = query.toLowerCase();
    
    return allClients.filter(client => 
      client.name.toLowerCase().includes(lowerQuery) ||
      (client.phone?.toLowerCase().includes(lowerQuery) || false) ||
      client.codes.some(code =>
        code.code.toLowerCase().includes(lowerQuery) ||
        code.service.toLowerCase().includes(lowerQuery)
      )
    );
  },

  // Statistics
  async getStatistics() {
    const clientsSnapshot = await db.collection('clients').get();
    const clients = clientsSnapshot.docs.map(doc => doc.data());
    
    const totalClients = clients.length;
    const totalCodes = clients.reduce((sum, client) => sum + (client.codes?.length || 0), 0);
    
    // Get clients added this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const clientsThisMonth = clients.filter(client => {
      const createdAt = client.createdAt?.toDate();
      return createdAt && createdAt >= firstDayOfMonth;
    }).length;
    
    // Get recent activities count
    const activitiesSnapshot = await db.collection('activities')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const recentActivities = activitiesSnapshot.size;
    
    return {
      totalClients,
      totalCodes,
      clientsThisMonth,
      recentActivities,
    };
  },

  // Activity operations
  async getAllActivities(): Promise<Activity[]> {
    const snapshot = await db.collection('activities')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: parseInt(doc.id),
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    } as Activity));
  },

  async getActivitiesByDate(date: Date): Promise<Activity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const snapshot = await db.collection('activities')
      .where('createdAt', '>=', Timestamp.fromDate(startOfDay))
      .where('createdAt', '<=', Timestamp.fromDate(endOfDay))
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: parseInt(doc.id),
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    } as Activity));
  },

  async createActivity(data: InsertActivity): Promise<Activity> {
    const activityRef = db.collection('activities').doc();
    const id = parseInt(activityRef.id.substring(0, 8), 16);
    
    const activityData = {
      ...data,
      createdAt: Timestamp.now(),
    };
    
    await activityRef.set(activityData);
    
    return {
      id,
      ...activityData,
      createdAt: activityData.createdAt.toDate(),
    } as Activity;
  },

  // Service Code operations
  async getAllServiceCodes(): Promise<ServiceCodeConfig[]> {
    const snapshot = await db.collection('serviceCodes')
      .where('isActive', '==', 1)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: parseInt(doc.id),
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as ServiceCodeConfig));
  },

  async getServiceCode(id: number): Promise<ServiceCodeConfig | null> {
    const doc = await db.collection('serviceCodes').doc(id.toString()).get();
    if (!doc.exists) return null;
    
    return {
      id: parseInt(doc.id),
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as ServiceCodeConfig;
  },

  async createServiceCode(data: InsertServiceCode): Promise<ServiceCodeConfig> {
    const serviceCodeRef = db.collection('serviceCodes').doc();
    const id = parseInt(serviceCodeRef.id.substring(0, 8), 16);
    
    const now = Timestamp.now();
    const serviceCodeData = {
      ...data,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    };
    
    await serviceCodeRef.set(serviceCodeData);
    
    return {
      id,
      ...serviceCodeData,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    } as ServiceCodeConfig;
  },

  async updateServiceCode(id: number, data: Partial<UpdateServiceCode>): Promise<ServiceCodeConfig | null> {
    const serviceCodeRef = db.collection('serviceCodes').doc(id.toString());
    const doc = await serviceCodeRef.get();
    
    if (!doc.exists) return null;
    
    const now = Timestamp.now();
    await serviceCodeRef.update({
      ...data,
      updatedAt: now,
    });
    
    const updated = await serviceCodeRef.get();
    return {
      id: parseInt(updated.id),
      ...updated.data(),
      createdAt: updated.data()?.createdAt?.toDate(),
      updatedAt: updated.data()?.updatedAt?.toDate(),
    } as ServiceCodeConfig;
  },

  async deleteServiceCode(id: number): Promise<boolean> {
    const serviceCodeRef = db.collection('serviceCodes').doc(id.toString());
    const doc = await serviceCodeRef.get();
    
    if (!doc.exists) return false;
    
    // Soft delete
    await serviceCodeRef.update({
      isActive: 0,
      updatedAt: Timestamp.now(),
    });
    
    return true;
  },
};
