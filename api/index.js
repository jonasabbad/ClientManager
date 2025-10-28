import express from "express";
import cors from "cors";
import { initializeFirebase, getDb } from "./firebase.js";
import { firebaseStorage } from "./firebaseStorage.js";

// Initialize Firebase once
try {
  initializeFirebase();
  console.log('Firebase initialized for Vercel API');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

const app = express();

// Enable CORS for Vercel frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5000',
    /\.vercel\.app$/,
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await firebaseStorage.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

app.get('/api/clients/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const clients = await firebaseStorage.searchClients(query);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const client = await firebaseStorage.getClient(id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = await firebaseStorage.createClient(req.body);
    
    // Create activity
    await firebaseStorage.createActivity({
      action: 'created',
      clientId: client.id,
      clientName: client.name,
      description: `Created client ${client.name}`,
    });
    
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: error.message || 'Failed to create client' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const client = await firebaseStorage.updateClient(id, req.body);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Create activity
    await firebaseStorage.createActivity({
      action: 'updated',
      clientId: client.id,
      clientName: client.name,
      description: `Updated client ${client.name}`,
    });
    
    res.json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    // Get client before deleting for activity log
    const client = await firebaseStorage.getClient(id);
    
    const deleted = await firebaseStorage.deleteClient(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Create activity
    if (client) {
      await firebaseStorage.createActivity({
        action: 'deleted',
        clientId: id,
        clientName: client.name,
        description: `Deleted client ${client.name}`,
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/statistics', async (req, res) => {
  try {
    const stats = await firebaseStorage.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const activities = await firebaseStorage.getAllActivities();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/service-codes', async (req, res) => {
  try {
    const serviceCodes = await firebaseStorage.getAllServiceCodes();
    res.json(serviceCodes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'API is running on Vercel', status: 'ok' });
});

// Test Firebase connection
app.get('/api/test-firebase', async (req, res) => {
  try {
    const db = getDb();
    
    // Try to get collections list
    const collections = await db.listCollections();
    
    // Try a simple read operation
    const testSnapshot = await db.collection('clients').limit(1).get();
    
    res.json({
      status: 'success',
      message: 'Firebase connection successful',
      details: {
        connected: true,
        collectionsCount: collections.length,
        canRead: true,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Firebase connection failed',
      error: error.message,
      details: {
        connected: false,
        timestamp: new Date().toISOString(),
      }
    });
  }
});

// Export for Vercel serverless function
export default app;
