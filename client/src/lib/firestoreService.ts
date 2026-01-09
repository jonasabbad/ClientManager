import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  deleteField,
} from 'firebase/firestore';
import type { Client, ServiceCodeConfig, Activity, InsertActivity } from '@shared/schema';

// Extended client type for Firebase (includes all data fields)
export type FirestoreClient = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  codes: Array<{
    service: string;
    code: string;
    accountHolderName?: string;
    address?: string;
    phoneNumber?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
};

export const firestoreService = {
  normalizeServiceCode(code: {
    service: string;
    code: string;
    accountHolderName?: string;
    address?: string;
    phoneNumber?: string;
  }) {
    const normalizedCode: {
      service: string;
      code: string;
      accountHolderName?: string;
      address?: string;
      phoneNumber?: string;
    } = {
      ...code,
      code: typeof code.code === "string" ? code.code.trim() : code.code,
    };

    const accountHolderName = code.accountHolderName?.trim();
    const address = code.address?.trim();
    const phoneNumber = code.phoneNumber?.trim();

    if (accountHolderName) {
      normalizedCode.accountHolderName = accountHolderName;
    } else {
      delete normalizedCode.accountHolderName;
    }

    if (address) {
      normalizedCode.address = address;
    } else {
      delete normalizedCode.address;
    }

    if (phoneNumber) {
      normalizedCode.phoneNumber = phoneNumber;
    } else {
      delete normalizedCode.phoneNumber;
    }

    return normalizedCode;
  },
  // Clients
  async getAllClients(): Promise<FirestoreClient[]> {
    const querySnapshot = await getDocs(collection(db, 'clients'));
    return querySnapshot.docs.map(doc => doc.data() as FirestoreClient);
  },

  async getClient(id: number): Promise<FirestoreClient | null> {
    const q = query(collection(db, 'clients'), where('id', '==', id), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return querySnapshot.docs[0].data() as FirestoreClient;
  },

  async createClient(data: { name: string; phone?: string; email?: string; address?: string; codes: any[] }): Promise<FirestoreClient> {
    // Get the next ID
    const clientsSnapshot = await getDocs(
      query(collection(db, 'clients'), orderBy('id', 'desc'), limit(1))
    );
    const nextId = clientsSnapshot.empty ? 1 : (clientsSnapshot.docs[0].data().id + 1);
    const sanitizedName = data.name.trim();
    const sanitizedPhone = data.phone?.trim();
    const clientData: FirestoreClient = {
      ...data,
      name: sanitizedName,
      id: nextId,
      createdAt: new Date().toISOString(),
      codes: (data.codes || []).map((code) => this.normalizeServiceCode(code)),
    };
    if (sanitizedPhone) {
      clientData.phone = sanitizedPhone;
    } else {
      delete (clientData as Partial<FirestoreClient>).phone;
    }

    await addDoc(collection(db, 'clients'), clientData);

    // Create activity log
    await this.createActivity({
      action: 'created',
      clientId: nextId,
      clientName: data.name,
      description: `Created client ${data.name}`,
      createdAt: new Date().toISOString(),
    });

    return clientData;
  },

  async updateClient(id: number, data: Partial<FirestoreClient>): Promise<FirestoreClient | null> {
    const q = query(collection(db, 'clients'), where('id', '==', id), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const docRef = querySnapshot.docs[0].ref;
    const existingData = querySnapshot.docs[0].data() as FirestoreClient;
    const sanitizedPhone = data.phone?.trim();
    const sanitizedCodes = data.codes?.map((code) => this.normalizeServiceCode(code));

    const updatedData: Record<string, any> = {
      ...data,
      codes: sanitizedCodes ?? data.codes,
      updatedAt: new Date().toISOString(),
    };
    if (updatedData.codes === undefined) {
      delete updatedData.codes;
    }

    if (data.phone !== undefined) {
      if (sanitizedPhone) {
        updatedData.phone = sanitizedPhone;
      } else {
        updatedData.phone = deleteField();
      }
    }

    if (data.phone === undefined && updatedData.phone === undefined) {
      delete updatedData.phone;
    }

    await updateDoc(docRef, updatedData);
    const refreshedSnapshot = await getDoc(docRef);
    const refreshedData = refreshedSnapshot.data() as FirestoreClient | undefined;

    // Create activity log - use existing client name if name not in update
    const clientName = data.name || existingData.name;
    await this.createActivity({
      action: 'updated',
      clientId: id,
      clientName: clientName,
      description: `Updated client ${clientName}`,
      createdAt: new Date().toISOString(),
    });
    

    if (!refreshedData) {
      return null;
    }

    return { ...refreshedData, id } as FirestoreClient;
  },

  async deleteClient(id: number): Promise<boolean> {
    const q = query(collection(db, 'clients'), where('id', '==', id), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return false;

    const docData = querySnapshot.docs[0].data() as FirestoreClient;
    await deleteDoc(querySnapshot.docs[0].ref);

    // Create activity log
    await this.createActivity({
      action: 'deleted',
      clientId: id,
      clientName: docData.name,
      description: `Deleted client ${docData.name}`,
      createdAt: new Date().toISOString(),
    });

    return true;
  },

  async searchClients(searchQuery: string): Promise<FirestoreClient[]> {
    const allClients = await this.getAllClients();
    const lowerQuery = searchQuery.toLowerCase();

    return allClients.filter(client =>
      client.name?.toLowerCase().includes(lowerQuery) ||
      client.phone?.toLowerCase().includes(lowerQuery) ||
      client.email?.toLowerCase().includes(lowerQuery) ||
      client.address?.toLowerCase().includes(lowerQuery)
    );
  },

  // Service Codes
  async getAllServiceCodes(): Promise<ServiceCodeConfig[]> {
    const querySnapshot = await getDocs(collection(db, 'serviceCodes'));
    const codes = querySnapshot.docs.map(doc => doc.data() as ServiceCodeConfig);
    
    // Seed default service codes if none exist
    if (codes.length === 0) {
      await this.seedDefaultServiceCodes();
      const newSnapshot = await getDocs(collection(db, 'serviceCodes'));
      return newSnapshot.docs.map(doc => doc.data() as ServiceCodeConfig);
    }
    
    return codes;
  },

  async seedDefaultServiceCodes(): Promise<void> {
    const defaultCodes = [
      { serviceId: 'inwi', name: 'Inwi', category: 'telecom', isActive: 1 },
      { serviceId: 'orange', name: 'Orange', category: 'telecom', isActive: 1 },
      { serviceId: 'maroc-telecom', name: 'Maroc Telecom', category: 'telecom', isActive: 1 },
      { serviceId: 'water', name: 'Water', category: 'utility', isActive: 1 },
      { serviceId: 'gas', name: 'Gas', category: 'utility', isActive: 1 },
      { serviceId: 'electricity', name: 'Electricity', category: 'utility', isActive: 1 },
    ];

    for (const code of defaultCodes) {
      await this.createServiceCode(code);
    }
  },

  async createServiceCode(data: { serviceId: string; name: string; category: string; isActive: number }): Promise<ServiceCodeConfig> {
    // Get the next ID
    const codesSnapshot = await getDocs(
      query(collection(db, 'serviceCodes'), orderBy('id', 'desc'), limit(1))
    );
    const nextId = codesSnapshot.empty ? 1 : (codesSnapshot.docs[0].data().id + 1);

    const serviceData: any = {
      ...data,
      id: nextId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'serviceCodes'), serviceData);
    return serviceData as ServiceCodeConfig;
  },

  async updateServiceCode(id: number, data: Partial<ServiceCodeConfig>): Promise<ServiceCodeConfig | null> {
    const q = query(collection(db, 'serviceCodes'), where('id', '==', id), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const docRef = querySnapshot.docs[0].ref;
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, updatedData);

    return { ...querySnapshot.docs[0].data(), ...updatedData, id } as any as ServiceCodeConfig;
  },

  async deleteServiceCode(id: number): Promise<boolean> {
    const q = query(collection(db, 'serviceCodes'), where('id', '==', id), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return false;

    await deleteDoc(querySnapshot.docs[0].ref);
    return true;
  },

  // Activities
  async getAllActivities(): Promise<any[]> {
    // Fetch all activities without limit for full history
    const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      firestoreDocId: doc.id, // Keep Firestore doc ID for reference
    }));
  },

  async createActivity(data: { action: string; clientId: number; clientName: string; description: string; createdAt: string }): Promise<any> {
    // Get the next ID
    const activitiesSnapshot = await getDocs(
      query(collection(db, 'activities'), orderBy('id', 'desc'), limit(1))
    );
    const nextId = activitiesSnapshot.empty ? 1 : (activitiesSnapshot.docs[0].data().id + 1);

    const activityData = {
      ...data,
      id: nextId,
    };

    await addDoc(collection(db, 'activities'), activityData);
    return activityData;
  },

  // Statistics
  async getStatistics() {
    const [clientsSnapshot, activitiesSnapshot] = await Promise.all([
      getDocs(collection(db, 'clients')),
      getDocs(collection(db, 'activities')),
    ]);

    const clients = clientsSnapshot.docs.map(doc => doc.data());
    
    // Calculate total codes
    let totalCodes = 0;
    const serviceBreakdown: Record<string, number> = {};
    
    clients.forEach((client: any) => {
      if (client.codes && Array.isArray(client.codes)) {
        totalCodes += client.codes.length;
        client.codes.forEach((code: any) => {
          const service = code.service;
          serviceBreakdown[service] = (serviceBreakdown[service] || 0) + 1;
        });
      }
    });
    
    // Calculate clients this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const clientsThisMonth = clients.filter((client: any) => {
      const createdAt = new Date(client.createdAt);
      return createdAt >= startOfMonth;
    }).length;

    return {
      totalClients: clientsSnapshot.size,
      totalCodes,
      clientsThisMonth,
      serviceBreakdown,
    };
  },

  // Test connection
  async testConnection() {
    try {
      const testQuery = await getDocs(query(collection(db, 'clients'), limit(1)));
      const result = {
        status: 'success' as const,
        message: 'Firebase connection successful',
        details: {
          connected: true,
          canRead: true,
          timestamp: new Date().toISOString(),
        }
      };
      
      // Save the test result to settings
      await this.saveSettings({
        firebaseTestResult: result,
      });
      
      return result;
    } catch (error: any) {
      const result = {
        status: 'error' as const,
        message: 'Firebase connection failed',
        error: error.message,
        details: {
          connected: false,
          timestamp: new Date().toISOString(),
        }
      };
      
      // Save the test result to settings
      await this.saveSettings({
        firebaseTestResult: result,
      });
      
      return result;
    }
  },


  async getRecentActivities(limitCount: number = 5): Promise<any[]> {
    try {
      const activitiesRef = collection(db, 'activities');
      const q = query(activitiesRef, orderBy('createdAt', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        firestoreDocId: doc.id, // Keep Firestore doc ID for reference
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  },

  // Settings Management
  async getSettings(): Promise<any> {
    try {
      const settingsRef = doc(db, 'settings', 'app-settings');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return settingsDoc.data();
      }
      
      // Return default settings if none exist
      return {
        companyName: 'Customer Management System',
        defaultCountryCode: '+212',
        recordsPerPage: 10,
        firebaseTestResult: null,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {
        companyName: 'Customer Management System',
        defaultCountryCode: '+212',
        recordsPerPage: 10,
        firebaseTestResult: null,
      };
    }
  },

  async saveSettings(settings: any): Promise<void> {
    try {
      const settingsRef = doc(db, 'settings', 'app-settings');
      const existingSettings = await this.getSettings();
      
      await updateDoc(settingsRef, {
        ...existingSettings,
        ...settings,
        lastUpdated: new Date().toISOString(),
      }).catch(async () => {
        // If document doesn't exist, create it using setDoc
        const { setDoc } = await import('firebase/firestore');
        await setDoc(settingsRef, {
          ...existingSettings,
          ...settings,
          lastUpdated: new Date().toISOString(),
        });
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },
};
