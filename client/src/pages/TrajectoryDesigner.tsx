import { useState } from "react";
import { Scene3D } from "@/components/Scene3D";
import { WaypointPanel } from "@/components/WaypointPanel";
import { TrajectoryList } from "@/components/TrajectoryList";
import { SettingsPanel } from "@/components/SettingsPanel";
import { BlockEditorPanel } from "@/components/BlockEditorPanel";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Bot, Wrench, Settings, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useIKSolver } from "@/hooks/useIKSolver";
import { useTrajectoryStore } from "@/lib/trajectoryStore";

export default function TrajectoryDesigner() {
  const [showSettings, setShowSettings] = useState(false);
  useIKSolver();
  const ikSolving = useTrajectoryStore((s) => s.ikSolving);
  const ikError = useTrajectoryStore((s) => s.ikError);
  const ikResult = useTrajectoryStore((s) => s.ikResult);
  const selectedWaypointId = useTrajectoryStore((s) => s.selectedWaypointId);

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <header className="h-12 border-b flex items-center justify-between gap-2 px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none">
              LeRobot SO-101 Trajectory Designer
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Design and visualize manipulator trajectories
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={showSettings ? "default" : "ghost"}
            onClick={() => setShowSettings(!showSettings)}
            data-testid="button-toggle-settings"
          >
            {showSettings ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">6-DOF Arm + Gripper</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative min-w-0">
          <Scene3D />

          {selectedWaypointId && (
            <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border rounded-md px-2.5 py-1.5 flex items-center gap-1.5 pointer-events-none" data-testid="ik-status">
              {ikSolving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  <span className="text-[11px] text-muted-foreground">Solving IK...</span>
                </>
              ) : ikError ? (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-[11px] text-red-500">{ikError}</span>
                </>
              ) : ikResult ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-[11px] text-muted-foreground">IK solved (err: {(ikResult.position_error ?? 0).toFixed(4)}m)</span>
                </>
              ) : null}
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm border rounded-md p-2.5 text-[11px] text-muted-foreground space-y-0.5 pointer-events-none" data-testid="legend-panel">
            <div className="font-semibold text-foreground text-xs mb-1">Legend</div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Gripper open</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              <span>Gripper closed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-400 rounded" />
              <span>Trajectory path</span>
            </div>
          </div>

          <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm border rounded-md p-2.5 pointer-events-none" data-testid="blocks-info">
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <div className="font-semibold text-foreground text-xs mb-1">Coordinate Frame</div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-500 font-mono font-bold text-xs">X</span>
                <span>Forward</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-500 font-mono font-bold text-xs">Y</span>
                <span>Lateral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-500 font-mono font-bold text-xs">Z</span>
                <span>Up</span>
              </div>
              <Separator className="my-1.5" />
              <div className="font-semibold text-foreground text-xs mb-0.5">Blocks</div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: "#e74c3c" }} />
                <span>Red</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: "#2ecc71" }} />
                <span>Green</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded-sm" style={{ background: "#3498db" }} />
                <span>Blue</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[340px] border-l bg-card/50 flex flex-col shrink-0">
          {showSettings ? (
            <div className="p-4 overflow-auto">
              <SettingsPanel />
            </div>
          ) : (
            <>
              <BlockEditorPanel />
              <div className="flex-1 min-h-0 overflow-auto">
                <WaypointPanel />
              </div>

              <Separator />

              <div className="p-3 border-t">
                <TrajectoryList />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
