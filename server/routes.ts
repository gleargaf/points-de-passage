import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTrajectorySchema } from "@shared/schema";

const IK_PORT = process.env.IK_PORT || "5001";
const IK_BASE_URL = `http://127.0.0.1:${IK_PORT}`;

async function proxyToIK(path: string, body: unknown) {
  const resp = await fetch(`${IK_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/trajectories", async (_req, res) => {
    const trajectories = await storage.getTrajectories();
    res.json(trajectories);
  });

  app.get("/api/trajectories/:id", async (req, res) => {
    const trajectory = await storage.getTrajectory(req.params.id);
    if (!trajectory) {
      return res.status(404).json({ message: "Trajectory not found" });
    }
    res.json(trajectory);
  });

  app.post("/api/trajectories", async (req, res) => {
    const parsed = insertTrajectorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid trajectory data", errors: parsed.error.errors });
    }
    const trajectory = await storage.createTrajectory(parsed.data);
    res.status(201).json(trajectory);
  });

  app.patch("/api/trajectories/:id", async (req, res) => {
    const parsed = insertTrajectorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid trajectory data", errors: parsed.error.errors });
    }
    const trajectory = await storage.updateTrajectory(req.params.id, parsed.data);
    if (!trajectory) {
      return res.status(404).json({ message: "Trajectory not found" });
    }
    res.json(trajectory);
  });

  app.delete("/api/trajectories/:id", async (req, res) => {
    const deleted = await storage.deleteTrajectory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Trajectory not found" });
    }
    res.status(204).send();
  });

  app.post("/api/ik/solve", async (req, res) => {
    try {
      const result = await proxyToIK("/solve", req.body);
      res.json(result);
    } catch (e: any) {
      res.status(503).json({ error: "IK solver unavailable", details: e.message });
    }
  });

  app.post("/api/ik/solve_batch", async (req, res) => {
    try {
      const result = await proxyToIK("/solve_batch", req.body);
      res.json(result);
    } catch (e: any) {
      res.status(503).json({ error: "IK solver unavailable", details: e.message });
    }
  });

  app.get("/api/ik/scene", async (_req, res) => {
    try {
      const resp = await fetch(`${IK_BASE_URL}/scene`);
      const data = await resp.json();
      res.status(resp.status).json(data);
    } catch (e: any) {
      res.status(503).json({ error: "IK solver unavailable", details: e.message });
    }
  });

  app.post("/api/ik/fk", async (req, res) => {
    try {
      const result = await proxyToIK("/fk", req.body);
      res.json(result);
    } catch (e: any) {
      res.status(503).json({ error: "IK solver unavailable", details: e.message });
    }
  });

  app.post("/api/ik/simulate", async (req, res) => {
    try {
      const result = await proxyToIK("/simulate", req.body);
      res.json(result);
    } catch (e: any) {
      res.status(503).json({ error: "IK solver unavailable", details: e.message });
    }
  });

  return httpServer;
}
