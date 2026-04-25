import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTrajectoryStore } from "@/lib/trajectoryStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, FolderOpen, Trash2, Save, Download } from "lucide-react";
import type { Trajectory } from "@shared/schema";

export function TrajectoryList() {
  const { toast } = useToast();
  const {
    waypoints,
    trajectoryName,
    activeTrajectoryId,
    setActiveTrajectory,
    setWaypoints,
    setTrajectoryName,
    setSelectedWaypoint,
    resetEditor,
  } = useTrajectoryStore();

  const { data: trajectories = [], isLoading } = useQuery<Trajectory[]>({
    queryKey: ["/api/trajectories"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (activeTrajectoryId) {
        return apiRequest("PATCH", `/api/trajectories/${activeTrajectoryId}`, {
          name: trajectoryName,
          waypoints,
        });
      } else {
        return apiRequest("POST", "/api/trajectories", {
          name: trajectoryName,
          waypoints,
        });
      }
    },
    onSuccess: async (res) => {
      const data = await res.json();
      setActiveTrajectory(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/trajectories"] });
      toast({ title: "Saved", description: "Trajectory saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save trajectory", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/trajectories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trajectories"] });
      resetEditor();
      toast({ title: "Deleted", description: "Trajectory deleted" });
    },
  });

  const loadTrajectory = (t: Trajectory) => {
    setActiveTrajectory(t.id);
    setTrajectoryName(t.name);
    setWaypoints(t.waypoints);
    setSelectedWaypoint(null);
  };

  const exportTrajectory = () => {
    const data = {
      name: trajectoryName,
      waypoints: waypoints.map((wp) => ({
        x: wp.x,
        y: wp.y,
        z: wp.z,
        roll: wp.roll,
        pitch: wp.pitch,
        yaw: wp.yaw,
        gripperState: wp.gripperState,
        label: wp.label,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trajectoryName.replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || waypoints.length === 0}
          data-testid="button-save-trajectory"
        >
          <Save className="h-3 w-3 mr-1" />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="secondary" onClick={resetEditor} data-testid="button-new-trajectory">
          <FilePlus className="h-3 w-3 mr-1" />
          New
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={exportTrajectory}
          disabled={waypoints.length === 0}
          data-testid="button-export-trajectory"
        >
          <Download className="h-3 w-3 mr-1" />
          Export
        </Button>
      </div>

      {trajectories.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Saved Trajectories
          </div>
          <ScrollArea className="max-h-[160px]">
            <div className="space-y-1.5">
              {trajectories.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                    activeTrajectoryId === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => loadTrajectory(t)}
                  data-testid={`trajectory-item-${t.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{t.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {t.waypoints.length}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(t.id);
                    }}
                    data-testid={`button-delete-trajectory-${t.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {isLoading && (
        <div className="text-xs text-muted-foreground text-center py-2">
          Loading...
        </div>
      )}
    </div>
  );
}
