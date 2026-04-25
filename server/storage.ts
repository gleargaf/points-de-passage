import { type Trajectory, type InsertTrajectory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getTrajectories(): Promise<Trajectory[]>;
  getTrajectory(id: string): Promise<Trajectory | undefined>;
  createTrajectory(data: InsertTrajectory): Promise<Trajectory>;
  updateTrajectory(id: string, data: InsertTrajectory): Promise<Trajectory | undefined>;
  deleteTrajectory(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private trajectories: Map<string, Trajectory>;

  constructor() {
    this.trajectories = new Map();
  }

  async getTrajectories(): Promise<Trajectory[]> {
    return Array.from(this.trajectories.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTrajectory(id: string): Promise<Trajectory | undefined> {
    return this.trajectories.get(id);
  }

  async createTrajectory(data: InsertTrajectory): Promise<Trajectory> {
    const id = randomUUID();
    const trajectory: Trajectory = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.trajectories.set(id, trajectory);
    return trajectory;
  }

  async updateTrajectory(id: string, data: InsertTrajectory): Promise<Trajectory | undefined> {
    const existing = this.trajectories.get(id);
    if (!existing) return undefined;
    const updated: Trajectory = {
      ...existing,
      ...data,
      id,
    };
    this.trajectories.set(id, updated);
    return updated;
  }

  async deleteTrajectory(id: string): Promise<boolean> {
    return this.trajectories.delete(id);
  }
}

export const storage = new MemStorage();
