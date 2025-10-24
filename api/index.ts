import express from 'express';
import { initializeFirebase } from '../server/firebase';
import { firebaseStorage as storage } from '../server/firebaseStorage';
import { insertClientSchema, updateClientSchema, insertServiceCodeSchema, updateServiceCodeSchema } from '../shared/schema';
import { z } from 'zod';

const app = express();

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Get all clients
app.get("/api/clients", async (req, res) => {
  try {
    const clients = await storage.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// Get client by ID
app.get("/api/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const client = await storage.getClient(id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

// Search clients
app.get("/api/clients/search/:query", async (req, res) => {
  try {
    const query = req.params.query;
    const clients = await storage.searchClients(query);
    res.json(clients);
  } catch (error) {
    console.error("Error searching clients:", error);
    res.status(500).json({ error: "Failed to search clients" });
  }
});

// Create client
app.post("/api/clients", async (req, res) => {
  try {
    const validatedData = insertClientSchema.parse(req.body);
    const newClient = await storage.createClient(validatedData);
    
    // Log activity
    await storage.createActivity({
      clientId: newClient.id,
      action: "created",
      description: `Created new client with ${newClient.codes.length} service code(s)`,
      clientName: newClient.name,
    });
    
    res.status(201).json(newClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// Update client
app.patch("/api/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const existingClient = await storage.getClient(id);
    if (!existingClient) {
      return res.status(404).json({ error: "Client not found" });
    }

    const validatedData = updateClientSchema.parse({ ...req.body, id });
    const { id: _id, ...updateData } = validatedData;
    
    const updatedClient = await storage.updateClient(id, updateData);
    if (!updatedClient) {
      return res.status(404).json({ error: "Client not found" });
    }

    const oldCodesLength = existingClient.codes.length;
    const newCodesLength = updatedClient.codes.length;
    const action = newCodesLength > oldCodesLength ? "code_added" : "updated";
    const description = newCodesLength > oldCodesLength
      ? `Added ${newCodesLength - oldCodesLength} new service code(s)`
      : "Updated client information";

    await storage.createActivity({
      clientId: id,
      action,
      description,
      clientName: updatedClient.name,
    });

    res.json(updatedClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Delete client
app.delete("/api/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const client = await storage.getClient(id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const deleted = await storage.deleteClient(id);
    if (!deleted) {
      return res.status(404).json({ error: "Client not found" });
    }

    await storage.createActivity({
      clientId: id,
      action: "deleted",
      description: "Deleted client",
      clientName: client.name,
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// Get statistics
app.get("/api/statistics", async (req, res) => {
  try {
    const statistics = await storage.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get all activities
app.get("/api/activities", async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    
    const activities = date 
      ? await storage.getActivitiesByDate(date)
      : await storage.getAllActivities();
    
    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// Service codes endpoints
app.get("/api/service-codes", async (req, res) => {
  try {
    const serviceCodes = await storage.getAllServiceCodes();
    res.json(serviceCodes);
  } catch (error) {
    console.error("Error fetching service codes:", error);
    res.status(500).json({ error: "Failed to fetch service codes" });
  }
});

app.get("/api/service-codes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid service code ID" });
    }

    const serviceCode = await storage.getServiceCode(id);
    if (!serviceCode) {
      return res.status(404).json({ error: "Service code not found" });
    }

    res.json(serviceCode);
  } catch (error) {
    console.error("Error fetching service code:", error);
    res.status(500).json({ error: "Failed to fetch service code" });
  }
});

app.post("/api/service-codes", async (req, res) => {
  try {
    const validatedData = insertServiceCodeSchema.parse(req.body);
    const newServiceCode = await storage.createServiceCode(validatedData);
    
    res.status(201).json(newServiceCode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating service code:", error);
    res.status(500).json({ error: "Failed to create service code" });
  }
});

app.patch("/api/service-codes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid service code ID" });
    }

    const validatedData = updateServiceCodeSchema.parse({ ...req.body, id });
    const { id: _id, ...updateData } = validatedData;
    
    const updatedServiceCode = await storage.updateServiceCode(id, updateData);
    if (!updatedServiceCode) {
      return res.status(404).json({ error: "Service code not found" });
    }

    res.json(updatedServiceCode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating service code:", error);
    res.status(500).json({ error: "Failed to update service code" });
  }
});

app.delete("/api/service-codes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid service code ID" });
    }

    const deleted = await storage.deleteServiceCode(id);
    if (!deleted) {
      return res.status(404).json({ error: "Service code not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting service code:", error);
    res.status(500).json({ error: "Failed to delete service code" });
  }
});

export default app;
