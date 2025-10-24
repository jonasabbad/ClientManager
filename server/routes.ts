import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, updateClientSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
