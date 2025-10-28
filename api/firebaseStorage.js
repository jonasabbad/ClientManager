import { getDb } from './firebase.js';

export const firebaseStorage = {
  async getAllClients() {
    const db = getDb();
    const snapshot = await db.collection('clients').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getClient(id) {
    const db = getDb();
    const snapshot = await db.collection('clients').where('id', '==', id).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  async createClient(data) {
    const db = getDb();
    const clientsSnapshot = await db.collection('clients').orderBy('id', 'desc').limit(1).get();
    const nextId = clientsSnapshot.empty ? 1 : clientsSnapshot.docs[0].data().id + 1;
    
    const clientData = {
      ...data,
      id: nextId,
      createdAt: new Date().toISOString(),
    };
    
    await db.collection('clients').add(clientData);
    return clientData;
  },

  async updateClient(id, data) {
    const db = getDb();
    const snapshot = await db.collection('clients').where('id', '==', id).limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const updatedData = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    await doc.ref.update(updatedData);
    return { id: doc.id, ...updatedData };
  },

  async deleteClient(id) {
    const db = getDb();
    const snapshot = await db.collection('clients').where('id', '==', id).limit(1).get();
    if (snapshot.empty) return false;
    
    await snapshot.docs[0].ref.delete();
    return true;
  },

  async searchClients(query) {
    const db = getDb();
    const allClients = await this.getAllClients();
    const lowerQuery = query.toLowerCase();
    
    return allClients.filter(client =>
      client.name?.toLowerCase().includes(lowerQuery) ||
      client.phone?.toLowerCase().includes(lowerQuery) ||
      client.email?.toLowerCase().includes(lowerQuery) ||
      client.address?.toLowerCase().includes(lowerQuery)
    );
  },

  async getStatistics() {
    const db = getDb();
    const [clientsSnapshot, activitiesSnapshot, serviceCodesSnapshot] = await Promise.all([
      db.collection('clients').get(),
      db.collection('activities').get(),
      db.collection('serviceCodes').get(),
    ]);

    return {
      totalClients: clientsSnapshot.size,
      recentActivities: activitiesSnapshot.size,
      activeServices: serviceCodesSnapshot.size,
    };
  },

  async createActivity(data) {
    const db = getDb();
    const activitiesSnapshot = await db.collection('activities').orderBy('id', 'desc').limit(1).get();
    const nextId = activitiesSnapshot.empty ? 1 : activitiesSnapshot.docs[0].data().id + 1;
    
    const activityData = {
      ...data,
      id: nextId,
      timestamp: new Date().toISOString(),
    };
    
    await db.collection('activities').add(activityData);
    return activityData;
  },

  async getAllActivities() {
    const db = getDb();
    const snapshot = await db.collection('activities').orderBy('timestamp', 'desc').limit(20).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getAllServiceCodes() {
    const db = getDb();
    const snapshot = await db.collection('serviceCodes').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};
