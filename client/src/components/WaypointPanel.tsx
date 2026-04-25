import { useEffect, useRef, useCallback } from "react";
import { useTrajectoryStore, generateId } from "@/lib/trajectoryStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Target,
  RotateCcw,
  Hand,
  Play,
  Pause,
  Square,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Waypoint } from "@shared/schema";

function WaypointItem({
  waypoint,
  index,
  total,
}: {
  waypoint: Waypoint;
  index: number;
  total: number;
}) {
  const {
    selectedWaypointId,
    setSelectedWaypoint,
    removeWaypoint,
    reorderWaypoints,
    updateWaypoint,
  } = useTrajectoryStore();
  const isSelected = selectedWaypointId === waypoint.id;

  return (
    <div
      className={`p-3 rounded-md border cursor-pointer transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card"
      }`}
      onClick={() => setSelectedWaypoint(isSelected ? null : waypoint.id)}
      data-testid={`waypoint-item-${index}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-mono text-sm font-semibold truncate">
            {waypoint.label || `W${index + 1}`}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${
              waypoint.gripperState > 0.5
                ? "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400 dark:border-amber-500/20"
                : "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-400 dark:border-violet-500/20"
            }`}
            data-testid={`badge-gripper-${index}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${waypoint.gripperState > 0.5 ? "bg-amber-500" : "bg-violet-500"}`} />
            {Math.round(waypoint.gripperState * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation();
              reorderWaypoints(index, index - 1);
            }}
            data-testid={`waypoint-move-up-${index}`}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={index === total - 1}
            onClick={(e) => {
              e.stopPropagation();
              reorderWaypoints(index, index + 1);
            }}
            data-testid={`waypoint-move-down-${index}`}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              removeWaypoint(waypoint.id);
            }}
            data-testid={`waypoint-delete-${index}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground font-mono">
        X{waypoint.x.toFixed(3)} Y{waypoint.y.toFixed(3)} Z{waypoint.z.toFixed(3)}
        &middot; R{waypoint.roll.toFixed(0)} P{waypoint.pitch.toFixed(0)} Y{waypoint.yaw.toFixed(0)}
      </div>
    </div>
  );
}

const axisDescriptions: Record<string, string> = {
  x: "fwd",
  y: "lat",
  z: "up",
};

function WaypointEditor() {
  const { waypoints, selectedWaypointId, updateWaypoint, xRange, yRange, zRange } =
    useTrajectoryStore();
  const wp = waypoints.find((w) => w.id === selectedWaypointId);

  if (!wp) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Target className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Select a waypoint to edit its properties</p>
      </div>
    );
  }

  const idx = waypoints.indexOf(wp);
  const ranges = { x: xRange, y: yRange, z: zRange };

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground w-12">Label</Label>
        <Input
          value={wp.label || ""}
          onChange={(e) => updateWaypoint(wp.id, { label: e.target.value })}
          placeholder={`W${idx + 1}`}
          className="h-8 text-sm font-mono"
          data-testid="input-waypoint-label"
        />
      </div>

      <Separator />

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Position (robot frame)
          </span>
        </div>
        <div className="space-y-2">
          {(["x", "y", "z"] as const).map((axis) => (
            <div key={axis} className="flex items-center gap-2">
              <Label className="text-xs font-mono font-bold w-8 uppercase" title={axisDescriptions[axis]}>
                {axis}
                <span className="text-[9px] text-muted-foreground font-normal ml-0.5">
                  {axisDescriptions[axis]}
                </span>
              </Label>
              <Slider
                value={[wp[axis]]}
                onValueChange={([v]) => updateWaypoint(wp.id, { [axis]: v })}
                min={ranges[axis].min}
                max={ranges[axis].max}
                step={0.001}
                className="flex-1"
                data-testid={`slider-position-${axis}`}
              />
              <Input
                type="number"
                value={wp[axis]}
                onChange={(e) =>
                  updateWaypoint(wp.id, { [axis]: parseFloat(e.target.value) || 0 })
                }
                step={0.005}
                className="w-20 h-7 text-xs font-mono text-right"
                data-testid={`input-position-${axis}`}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Orientation (degrees)
          </span>
        </div>
        <div className="space-y-2">
          {(["roll", "pitch", "yaw"] as const).map((angle) => (
            <div key={angle} className="flex items-center gap-2">
              <Label className="text-xs font-mono font-bold w-8 capitalize">
                {angle.charAt(0).toUpperCase()}
              </Label>
              <Slider
                value={[wp[angle]]}
                onValueChange={([v]) => updateWaypoint(wp.id, { [angle]: v })}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
                data-testid={`slider-orientation-${angle}`}
              />
              <Input
                type="number"
                value={wp[angle]}
                onChange={(e) =>
                  updateWaypoint(wp.id, { [angle]: parseFloat(e.target.value) || 0 })
                }
                step={5}
                className="w-20 h-7 text-xs font-mono text-right"
                data-testid={`input-orientation-${angle}`}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Hand className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Gripper
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-mono font-bold w-8">
            Grip
          </Label>
          <Slider
            value={[wp.gripperState]}
            onValueChange={([v]) => updateWaypoint(wp.id, { gripperState: v })}
            min={0}
            max={1}
            step={0.01}
            className="flex-1"
            data-testid="slider-gripper"
          />
          <Input
            type="number"
            value={wp.gripperState}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) updateWaypoint(wp.id, { gripperState: Math.max(0, Math.min(1, v)) });
            }}
            step={0.05}
            className="w-20 h-7 text-xs font-mono text-right"
            data-testid="input-gripper"
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground font-mono">
          <span>Closed</span>
          <span>{Math.round(wp.gripperState * 100)}% open</span>
          <span>Open</span>
        </div>
      </div>
    </div>
  );
}

function SimulationControls() {
  const {
    waypoints,
    isPlaying,
    setIsPlaying,
    simulationFrames,
    simulationFrameIndex,
    setSimulationFrameIndex,
    isSimulating,
    simulationError,
    setSimulationFrames,
    setIsSimulating,
    setSimulationError,
    clearSimulation,
    setSelectedWaypoint,
  } = useTrajectoryStore();

  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const handleSimulate = useCallback(async () => {
    if (waypoints.length === 0) return;
    setIsSimulating(true);
    setSimulationError(null);
    clearSimulation();
    setSelectedWaypoint(null);

    try {
      const resp = await fetch("/api/ik/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waypoints: waypoints.map((wp) => ({
            x: wp.x,
            y: -wp.y,
            z: wp.z,
            gripper_state: wp.gripperState,
          })),
          time_per_waypoint: 2.0,
          record_interval: 2,
        }),
      });

      if (!resp.ok) {
        setSimulationError("Simulation server error");
        return;
      }

      const data = await resp.json();
      if (data.error) {
        setSimulationError(data.error);
        return;
      }

      setSimulationFrames(data.frames);
    } catch {
      setSimulationError("Simulation unavailable");
    } finally {
      setIsSimulating(false);
    }
  }, [waypoints, setIsSimulating, setSimulationError, clearSimulation, setSelectedWaypoint, setSimulationFrames]);

  useEffect(() => {
    if (!isPlaying || simulationFrames.length === 0) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const fps = 20;
    const frameInterval = 1000 / fps;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimeRef.current >= frameInterval) {
        lastTimeRef.current = timestamp;
        const store = useTrajectoryStore.getState();
        const nextIdx = store.simulationFrameIndex + 1;
        if (nextIdx >= store.simulationFrames.length) {
          setIsPlaying(false);
          return;
        }
        setSimulationFrameIndex(nextIdx);
      }
      animRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, simulationFrames.length, setIsPlaying, setSimulationFrameIndex]);

  const hasFrames = simulationFrames.length > 0;
  const progress = hasFrames
    ? Math.round((simulationFrameIndex / (simulationFrames.length - 1)) * 100)
    : 0;

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Simulation
        </span>
        {isSimulating && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Computing...</span>
          </div>
        )}
      </div>

      {simulationError && (
        <div className="flex items-center gap-1.5 text-xs text-red-500" data-testid="text-simulation-error">
          <AlertCircle className="h-3 w-3" />
          <span>{simulationError}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          onClick={handleSimulate}
          disabled={waypoints.length === 0 || isSimulating}
          data-testid="button-simulate"
        >
          {isSimulating ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Play className="h-3 w-3 mr-1" />
          )}
          Simulate
        </Button>

        {hasFrames && (
          <>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                if (isPlaying) {
                  setIsPlaying(false);
                } else {
                  if (simulationFrameIndex >= simulationFrames.length - 1) {
                    setSimulationFrameIndex(0);
                  }
                  setIsPlaying(true);
                }
              }}
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>

            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                setIsPlaying(false);
                clearSimulation();
              }}
              data-testid="button-stop-simulation"
            >
              <Square className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      {hasFrames && (
        <div className="space-y-1">
          <Slider
            value={[simulationFrameIndex]}
            onValueChange={([v]) => {
              setIsPlaying(false);
              setSimulationFrameIndex(v);
            }}
            min={0}
            max={simulationFrames.length - 1}
            step={1}
            data-testid="slider-simulation-progress"
          />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span>
              Frame {simulationFrameIndex + 1}/{simulationFrames.length}
            </span>
            <span>{progress}%</span>
            <span>
              t={simulationFrames[simulationFrameIndex]?.time.toFixed(2)}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function WaypointPanel() {
  const {
    waypoints,
    addWaypoint,
    trajectoryName,
    setTrajectoryName,
    xRange,
    zRange,
  } = useTrajectoryStore();

  const GRIPPER_TIP_X = 0.3914;
  const GRIPPER_TIP_Y = -0.001;
  const GRIPPER_TIP_Z = 0.2463;

  const handleAddWaypoint = () => {
    const lastWp = waypoints[waypoints.length - 1];
    const newWp: Waypoint = {
      id: generateId(),
      x: lastWp ? lastWp.x : GRIPPER_TIP_X,
      y: lastWp ? lastWp.y : GRIPPER_TIP_Y,
      z: lastWp ? lastWp.z : GRIPPER_TIP_Z,
      roll: 0,
      pitch: 0,
      yaw: 0,
      gripperState: 1,
    };
    addWaypoint(newWp);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Input
          value={trajectoryName}
          onChange={(e) => setTrajectoryName(e.target.value)}
          className="font-semibold text-base h-9"
          data-testid="input-trajectory-name"
        />
      </div>

      <div className="p-3 border-b">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Waypoints ({waypoints.length})
          </span>
          <Button size="sm" onClick={handleAddWaypoint} data-testid="button-add-waypoint">
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-2">
          {waypoints.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No waypoints yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Add" to create your first waypoint
              </p>
            </div>
          ) : (
            waypoints.map((wp, i) => (
              <WaypointItem
                key={wp.id}
                waypoint={wp}
                index={i}
                total={waypoints.length}
              />
            ))
          )}
        </div>

        <Separator />

        <div className="p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Edit Waypoint
          </div>
          <WaypointEditor />
        </div>
      </ScrollArea>

      <Separator />

      <SimulationControls />
    </div>
  );
}
