import { type Waypoint, type Trajectory } from "@shared/schema";
import { create } from "zustand";

export interface AxisRange {
  min: number;
  max: number;
}

export interface SceneBlock {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  rotation: number[][] | null;
}

export interface BodyTransform {
  position: [number, number, number];
  rotation: number[][];
}

export interface IKResult {
  joint_angles: Record<string, number>;
  bodies: Record<string, BodyTransform>;
  gripper_tip: [number, number, number];
  position_error?: number;
}

export interface SimulationFrame {
  time: number;
  bodies: Record<string, BodyTransform>;
  gripper_tip: [number, number, number];
  gripper_state: number;
  waypoint_idx: number;
}

interface TrajectoryState {
  trajectories: Trajectory[];
  activeTrajectoryId: string | null;
  selectedWaypointId: string | null;
  waypoints: Waypoint[];
  trajectoryName: string;
  isPlaying: boolean;
  playProgress: number;

  simulationFrames: SimulationFrame[];
  simulationFrameIndex: number;
  isSimulating: boolean;
  simulationError: string | null;

  baseX: number;
  baseY: number;
  tableHeight: number;
  xRange: AxisRange;
  yRange: AxisRange;
  zRange: AxisRange;

  sceneBlocks: SceneBlock[];
  sceneLoaded: boolean;
  selectedBlockId: string | null;

  ikResult: IKResult | null;
  ikSolving: boolean;
  ikError: string | null;

  setTrajectories: (t: Trajectory[]) => void;
  setActiveTrajectory: (id: string | null) => void;
  setSelectedWaypoint: (id: string | null) => void;
  setWaypoints: (w: Waypoint[]) => void;
  addWaypoint: (w: Waypoint) => void;
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  removeWaypoint: (id: string) => void;
  reorderWaypoints: (fromIndex: number, toIndex: number) => void;
  setTrajectoryName: (name: string) => void;
  setIsPlaying: (v: boolean) => void;
  setPlayProgress: (v: number) => void;
  setSimulationFrames: (f: SimulationFrame[]) => void;
  setSimulationFrameIndex: (i: number) => void;
  setIsSimulating: (v: boolean) => void;
  setSimulationError: (e: string | null) => void;
  clearSimulation: () => void;
  resetEditor: () => void;

  setBaseX: (v: number) => void;
  setBaseY: (v: number) => void;
  setTableHeight: (v: number) => void;
  setXRange: (r: AxisRange) => void;
  setYRange: (r: AxisRange) => void;
  setZRange: (r: AxisRange) => void;

  setSceneBlocks: (blocks: SceneBlock[]) => void;
  setSceneLoaded: (v: boolean) => void;
  setSelectedBlockId: (id: string | null) => void;
  updateSceneBlock: (id: string, updates: { x?: number; y?: number }) => void;

  setIKResult: (r: IKResult | null) => void;
  setIKSolving: (v: boolean) => void;
  setIKError: (e: string | null) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export const useTrajectoryStore = create<TrajectoryState>((set) => ({
  trajectories: [],
  activeTrajectoryId: null,
  selectedWaypointId: null,
  waypoints: [],
  trajectoryName: "New Trajectory",
  isPlaying: false,
  playProgress: 0,

  simulationFrames: [],
  simulationFrameIndex: 0,
  isSimulating: false,
  simulationError: null,

  baseX: -0.12,
  baseY: 0,
  tableHeight: 0.02,
  xRange: { min: -0.3, max: 0.3 },
  yRange: { min: -0.3, max: 0.3 },
  zRange: { min: 0, max: 0.4 },

  sceneBlocks: [],
  sceneLoaded: false,
  selectedBlockId: null,

  ikResult: null,
  ikSolving: false,
  ikError: null,

  setTrajectories: (trajectories) => set({ trajectories }),
  setActiveTrajectory: (id) => set({ activeTrajectoryId: id }),
  setSelectedWaypoint: (id) => set({ selectedWaypointId: id }),
  setWaypoints: (waypoints) => set({ waypoints }),

  addWaypoint: (w) => {
    const id = w.id || generateId();
    set((state) => ({
      waypoints: [...state.waypoints, { ...w, id }],
      selectedWaypointId: id,
    }));
  },

  updateWaypoint: (id, updates) =>
    set((state) => ({
      waypoints: state.waypoints.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

  removeWaypoint: (id) =>
    set((state) => ({
      waypoints: state.waypoints.filter((w) => w.id !== id),
      selectedWaypointId:
        state.selectedWaypointId === id ? null : state.selectedWaypointId,
    })),

  reorderWaypoints: (fromIndex, toIndex) =>
    set((state) => {
      const newWaypoints = [...state.waypoints];
      const [moved] = newWaypoints.splice(fromIndex, 1);
      newWaypoints.splice(toIndex, 0, moved);
      return { waypoints: newWaypoints };
    }),

  setTrajectoryName: (name) => set({ trajectoryName: name }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setPlayProgress: (v) => set({ playProgress: v }),
  setSimulationFrames: (f) => set({ simulationFrames: f, simulationFrameIndex: 0 }),
  setSimulationFrameIndex: (i) => set({ simulationFrameIndex: i }),
  setIsSimulating: (v) => set({ isSimulating: v }),
  setSimulationError: (e) => set({ simulationError: e }),
  clearSimulation: () => set({ simulationFrames: [], simulationFrameIndex: 0, isPlaying: false, playProgress: 0 }),

  resetEditor: () =>
    set({
      activeTrajectoryId: null,
      selectedWaypointId: null,
      waypoints: [],
      trajectoryName: "New Trajectory",
      isPlaying: false,
      playProgress: 0,
      simulationFrames: [],
      simulationFrameIndex: 0,
      simulationError: null,
    }),

  setBaseX: (v) => set({ baseX: v }),
  setBaseY: (v) => set({ baseY: v }),
  setTableHeight: (v) => set({ tableHeight: v }),
  setXRange: (r) => set({ xRange: r }),
  setYRange: (r) => set({ yRange: r }),
  setZRange: (r) => set({ zRange: r }),

  setSceneBlocks: (blocks) => set({ sceneBlocks: blocks }),
  setSceneLoaded: (v) => set({ sceneLoaded: v }),
  setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  updateSceneBlock: (id, updates) =>
    set((state) => {
      const BLOCK_W = 0.032;
      const BLOCK_D = 0.016;
      const BLOCK_H = 0.019;
      const BASE_Z = BLOCK_H / 2;

      const newBlocks = state.sceneBlocks.map((b) => {
        if (b.id !== id) return b;
        const newX = updates.x !== undefined ? updates.x : b.position[0];
        const newY = updates.y !== undefined ? -updates.y : b.position[1];
        return { ...b, position: [newX, newY, b.position[2]] as [number, number, number] };
      });

      const target = newBlocks.find((b) => b.id === id);
      if (!target) return { sceneBlocks: newBlocks };

      const others = newBlocks.filter((b) => b.id !== id);
      let stackCount = 0;
      for (const other of others) {
        const dx = Math.abs(target.position[0] - other.position[0]);
        const dy = Math.abs(target.position[1] - other.position[1]);
        if (dx < BLOCK_W && dy < BLOCK_D) {
          stackCount++;
        }
      }
      target.position[2] = BASE_Z + stackCount * BLOCK_H;

      return { sceneBlocks: newBlocks };
    }),

  setIKResult: (r) => set({ ikResult: r }),
  setIKSolving: (v) => set({ ikSolving: v }),
  setIKError: (e) => set({ ikError: e }),
}));

export { generateId };
