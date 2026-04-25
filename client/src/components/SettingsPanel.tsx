import { useTrajectoryStore } from "@/lib/trajectoryStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Settings, Move, Maximize2 } from "lucide-react";

export function SettingsPanel() {
  const {
    baseX,
    baseY,
    setBaseX,
    setBaseY,
    xRange,
    yRange,
    zRange,
    setXRange,
    setYRange,
    setZRange,
  } = useTrajectoryStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Settings
        </span>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Move className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground">
            Base Position (on table)
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-mono font-bold w-12">Base X</Label>
            <Slider
              value={[baseX]}
              onValueChange={([v]) => setBaseX(v)}
              min={-0.4}
              max={0.4}
              step={0.01}
              className="flex-1"
              data-testid="slider-base-x"
            />
            <Input
              type="number"
              value={baseX}
              onChange={(e) => setBaseX(parseFloat(e.target.value) || 0)}
              step={0.01}
              className="w-20 h-7 text-xs font-mono text-right"
              data-testid="input-base-x"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-mono font-bold w-12">Base Y</Label>
            <Slider
              value={[baseY]}
              onValueChange={([v]) => setBaseY(v)}
              min={-0.4}
              max={0.4}
              step={0.01}
              className="flex-1"
              data-testid="slider-base-y"
            />
            <Input
              type="number"
              value={baseY}
              onChange={(e) => setBaseY(parseFloat(e.target.value) || 0)}
              step={0.01}
              className="w-20 h-7 text-xs font-mono text-right"
              data-testid="input-base-y"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Maximize2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground">
            Axis Ranges (meters)
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] font-mono text-muted-foreground mb-1 block">
              X range (forward)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={xRange.min}
                onChange={(e) =>
                  setXRange({ ...xRange, min: parseFloat(e.target.value) || 0 })
                }
                step={0.05}
                className="w-20 h-7 text-xs font-mono text-right"
                data-testid="input-x-range-min"
              />
              <span className="text-[10px] text-muted-foreground">to</span>
              <Input
                type="number"
                value={xRange.max}
                onChange={(e) =>
                  setXRange({ ...xRange, max: parseFloat(e.target.value) || 0 })
                }
                step={0.05}
                className="w-20 h-7 text-xs font-mono text-right"
                data-testid="input-x-range-max"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] font-mono text-muted-foreground mb-1 block">
              Y range (lateral)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={yRange.min}
                onChange={(e) =>
                  setYRange({ ...yRange, min: parseFloat(e.target.value) || 0 })
                }
                step={0.05}
                className="w-20 h-7 text-xs font-mono text-right"
                data-testid="input-y-range-min"
              />
              <span className="text-[10px] text-muted-foreground">to</span>
              <Input
                type="number"
                value={yRange.max}
                onChange={(e) =>
                  setYRange({ ...yRange, max: parseFloat(e.target.value) || 0 })
                }
                step={0.05}
                className="w-20 h-7 text-xs font-mono text-right"
                data-testid="input-y-range-max"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] font-mono text-muted-foreground mb-1 block">
              Z range (height)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={zRange.min}
                onChange={(e) =>
                  setZRange({ ...zRange, min: parseFloat(e.target.value) || 0 })
                }
                step={0.05}
                className="w-20 h-7 text-xs font-mono text-right"
                data-testid="input-z-range-min"
              />
              <span className="text-[10px] text-muted-foreground">to</span>
              <Input
                type="number"
                value={zRange.max}
                onChange={(e) =>
                  setZRange({ ...zRange, max: parseFloat(e.target.value) || 0 })
                }
                step={0.05}
                className="w-20 h-7 text-xs font-mono text-right"
                data-testid="input-z-range-max"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground pt-1 space-y-0.5">
        <div>Coordinate frame: origin at robot base</div>
        <div>
          <span className="text-red-500 font-mono font-bold">X</span> forward,{" "}
          <span className="text-green-500 font-mono font-bold">Y</span> lateral,{" "}
          <span className="text-blue-500 font-mono font-bold">Z</span> up
        </div>
      </div>
    </div>
  );
}
