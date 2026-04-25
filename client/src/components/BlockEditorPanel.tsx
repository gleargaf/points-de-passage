import { useTrajectoryStore } from "@/lib/trajectoryStore";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Box, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BlockEditorPanel() {
  const { sceneBlocks, selectedBlockId, setSelectedBlockId, updateSceneBlock } =
    useTrajectoryStore();

  const block = sceneBlocks.find((b) => b.id === selectedBlockId);

  if (!block) return null;

  const robotX = block.position[0];
  const robotY = -block.position[1];

  return (
    <div className="border-b bg-card/80">
      <div className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-3 rounded-sm border"
              style={{ background: block.color }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {block.id} block
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setSelectedBlockId(null)}
            data-testid="button-deselect-block"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Box className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Position (robot frame)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-mono font-bold w-8">
            X
            <span className="text-[9px] text-muted-foreground font-normal ml-0.5">
              fwd
            </span>
          </Label>
          <Slider
            value={[robotX]}
            onValueChange={([v]) => updateSceneBlock(block.id, { x: v })}
            min={0}
            max={0.4}
            step={0.001}
            className="flex-1"
            data-testid="slider-block-x"
          />
          <Input
            type="number"
            value={robotX.toFixed(3)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) updateSceneBlock(block.id, { x: v });
            }}
            step={0.005}
            className="w-20 h-7 text-xs font-mono text-right"
            data-testid="input-block-x"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-mono font-bold w-8">
            Y
            <span className="text-[9px] text-muted-foreground font-normal ml-0.5">
              lat
            </span>
          </Label>
          <Slider
            value={[robotY]}
            onValueChange={([v]) => updateSceneBlock(block.id, { y: v })}
            min={-0.3}
            max={0.3}
            step={0.001}
            className="flex-1"
            data-testid="slider-block-y"
          />
          <Input
            type="number"
            value={robotY.toFixed(3)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) updateSceneBlock(block.id, { y: v });
            }}
            step={0.005}
            className="w-20 h-7 text-xs font-mono text-right"
            data-testid="input-block-y"
          />
        </div>

        {block.position[2] > 0.0095 + 0.001 && (
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-1">
            Stacked (Z = {block.position[2].toFixed(4)}m)
          </div>
        )}
      </div>

      <Separator />
    </div>
  );
}
