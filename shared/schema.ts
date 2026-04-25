import { z } from "zod";

export const waypointSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  roll: z.number(),
  pitch: z.number(),
  yaw: z.number(),
  gripperState: z.number().min(0).max(1),
  label: z.string().optional(),
});

export const trajectorySchema = z.object({
  id: z.string(),
  name: z.string(),
  waypoints: z.array(waypointSchema),
  createdAt: z.string(),
});

export const insertTrajectorySchema = z.object({
  name: z.string().min(1),
  waypoints: z.array(waypointSchema),
});

export type Waypoint = z.infer<typeof waypointSchema>;
export type Trajectory = z.infer<typeof trajectorySchema>;
export type InsertTrajectory = z.infer<typeof insertTrajectorySchema>;

export type InsertUser = { username: string; password: string };
export type User = { id: string; username: string; password: string };
