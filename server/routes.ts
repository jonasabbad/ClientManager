import type { Express } from "express";
import { createServer, type Server } from "http";
import { firebaseStorage as storage } from "./firebaseStorage";
import { initializeFirebase, getDb } from "./firebase";
import { insertClientSchema, updateClientSchema, insertServiceCodeSchema, updateServiceCodeSchema } from "@shared/schema";
import { z } from "zod";
// Authentication disabled for deployment
// import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Firebase
  initializeFirebase();
  
  // Auth middleware disabled for deployment
  // await setupAuth(app);

  // Auth routes disabled for Hostinger deployment
  // app.get('/api/auth/user', async (req: any, res) => {
  //   try {
  //     const userId = req.user.claims.sub;
  //     const user = await storage.getUser(userId);
  //     res.json(user);
  //   } catch (error) {
  //     console.error("Error fetching user:", error);
  //     res.status(500).json({ message: "Failed to fetch user" });
  //   }
  // });

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

      // Check if codes were added
      const oldCodesLength = existingClient.codes.length;
      const newCodesLength = updatedClient.codes.length;
      const action = newCodesLength > oldCodesLength ? "code_added" : "updated";
      const description = newCodesLength > oldCodesLength
        ? `Added ${newCodesLength - oldCodesLength} new service code(s)`
        : "Updated client information";

      // Log activity
      await storage.createActivity({
        clientId: updatedClient.id,
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

      // Log activity before deletion
      await storage.createActivity({
        clientId: null,
        action: "deleted",
        description: `Deleted client with ${client.codes.length} service code(s)`,
        clientName: client.name,
      });

      const deleted = await storage.deleteClient(id);
      if (!deleted) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Get statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Get all activities
  app.get("/api/activities", async (req, res) => {
    try {
      const dateParam = req.query.date;
      let activities;
      
      if (dateParam && typeof dateParam === 'string') {
        const date = new Date(dateParam);
        activities = await storage.getActivitiesByDate(date);
      } else {
        activities = await storage.getAllActivities();
      }
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Get all service codes
  app.get("/api/service-codes", async (req, res) => {
    try {
      const serviceCodes = await storage.getAllServiceCodes();
      res.json(serviceCodes);
    } catch (error) {
      console.error("Error fetching service codes:", error);
      res.status(500).json({ error: "Failed to fetch service codes" });
    }
  });

  // Get service code by ID
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

  // Create service code
  app.post("/api/service-codes", async (req, res) => {
    try {
      const validatedData = insertServiceCodeSchema.parse(req.body);
      const newServiceCode = await storage.createServiceCode(validatedData);
      
      // Log activity
      await storage.createActivity({
        clientId: null,
        action: "service_added",
        description: `Added new service: ${newServiceCode.name} (${newServiceCode.category})`,
        clientName: "System",
      });
      
      res.status(201).json(newServiceCode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating service code:", error);
      res.status(500).json({ error: "Failed to create service code" });
    }
  });

  // Update service code
  app.patch("/api/service-codes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service code ID" });
      }

      const existingServiceCode = await storage.getServiceCode(id);
      if (!existingServiceCode) {
        return res.status(404).json({ error: "Service code not found" });
      }

      const validatedData = updateServiceCodeSchema.parse({ ...req.body, id });
      const { id: _id, ...updateData } = validatedData;
      
      const updatedServiceCode = await storage.updateServiceCode(id, updateData);
      if (!updatedServiceCode) {
        return res.status(404).json({ error: "Service code not found" });
      }

      // Log activity
      await storage.createActivity({
        clientId: null,
        action: "service_updated",
        description: `Updated service: ${updatedServiceCode.name}`,
        clientName: "System",
      });

      res.json(updatedServiceCode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating service code:", error);
      res.status(500).json({ error: "Failed to update service code" });
    }
  });

  // Delete service code
  app.delete("/api/service-codes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service code ID" });
      }

      const serviceCode = await storage.getServiceCode(id);
      if (!serviceCode) {
        return res.status(404).json({ error: "Service code not found" });
      }

      // Log activity before deletion
      await storage.createActivity({
        clientId: null,
        action: "service_deleted",
        description: `Deleted service: ${serviceCode.name}`,
        clientName: "System",
      });

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

  // Test Firebase connection
  app.get("/api/test-firebase", async (req, res) => {
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
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
