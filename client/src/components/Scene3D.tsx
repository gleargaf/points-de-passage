import { Component, type ReactNode, type ErrorInfo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import { Table } from "./scene/Table";
import { RobotArm } from "./scene/RobotArm";
import { LegoBlock } from "./scene/LegoBlock";
import { WaypointMarkers } from "./scene/WaypointMarkers";
import { TrajectoryPath } from "./scene/TrajectoryPath";
import { GripperGhost } from "./scene/GripperGhost";
import { OriginAxes } from "./scene/OriginAxes";
import { useTrajectoryStore } from "@/lib/trajectoryStore";
import { Bot } from "lucide-react";

function FallbackView({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/30" data-testid="scene-3d-container">
      <div className="text-center text-muted-foreground">
        <Bot className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs mt-1">WebGL is required for 3D rendering</p>
      </div>
    </div>
  );
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("3D Canvas error:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackView message="3D view unavailable" />;
    }
    return this.props.children;
  }
}

function mujocoToThreeJs(
  mujoco: [number, number, number],
  baseX: number,
  baseY: number,
  tableHeight: number
): [number, number, number] {
  return [
    baseX + mujoco[0],
    tableHeight + mujoco[2],
    baseY + -mujoco[1],
  ];
}

function SceneCanvas() {
  const { baseX, baseY, tableHeight, sceneBlocks, sceneLoaded, setSceneBlocks, setSceneLoaded, setSelectedBlockId } = useTrajectoryStore();

  useEffect(() => {
    if (sceneLoaded) return;
    fetch("/api/ik/scene")
      .then((res) => {
        if (!res.ok) throw new Error(`Scene fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.blocks && data.blocks.length > 0) {
          setSceneBlocks(data.blocks);
        }
        setSceneLoaded(true);
      })
      .catch((err) => {
        console.warn("Failed to load scene config:", err);
        setSceneLoaded(true);
      });
  }, [sceneLoaded, setSceneBlocks, setSceneLoaded]);

  return (
    <div className="w-full h-full" data-testid="scene-3d-container">
      <Canvas
        shadows
        fallback={<FallbackView message="Loading 3D scene..." />}
        onPointerMissed={() => setSelectedBlockId(null)}
      >
        <PerspectiveCamera makeDefault position={[0.6, 0.5, 0.6]} fov={50} />
        <OrbitControls
          target={[baseX, tableHeight + 0.1, baseY]}
          minDistance={0.3}
          maxDistance={2}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[3, 5, 2]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={10}
          shadow-camera-left={-1}
          shadow-camera-right={1}
          shadow-camera-top={1}
          shadow-camera-bottom={-1}
        />
        <pointLight position={[-2, 3, -1]} intensity={0.3} />
        <Environment preset="studio" />

        <Table />
        <RobotArm position={[baseX, tableHeight, baseY]} />
        <OriginAxes />

        {sceneBlocks.map((block) => (
          <LegoBlock
            key={block.id}
            position={mujocoToThreeJs(block.position, baseX, baseY, tableHeight)}
            color={block.color}
            id={block.id}
          />
        ))}

        <WaypointMarkers />
        <TrajectoryPath />
        <GripperGhost />

        <Grid
          position={[0, -0.001, 0]}
          args={[2, 2]}
          cellSize={0.05}
          cellThickness={0.5}
          cellColor="#888888"
          sectionSize={0.25}
          sectionThickness={1}
          sectionColor="#aaaaaa"
          fadeDistance={3}
          fadeStrength={1}
          infiniteGrid
        />
      </Canvas>
    </div>
  );
}

export function Scene3D() {
  return (
    <CanvasErrorBoundary>
      <SceneCanvas />
    </CanvasErrorBoundary>
  );
}
