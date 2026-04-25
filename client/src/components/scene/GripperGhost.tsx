import { useMemo } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/lib/trajectoryStore";
import { robotToThreeJS, robotOrientationToThreeJS } from "@/lib/coordinates";

function OrientationAxes() {
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0.02, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0.02, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" linewidth={2} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, 0.02])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
    </group>
  );
}

export function GripperGhost() {
  const { waypoints, selectedWaypointId, baseX, baseY, tableHeight } =
    useTrajectoryStore();

  const selectedWp = useMemo(
    () => waypoints.find((w) => w.id === selectedWaypointId),
    [waypoints, selectedWaypointId]
  );

  if (!selectedWp) return null;

  const pos = robotToThreeJS(selectedWp.x, selectedWp.y, selectedWp.z, {
    baseX,
    baseY,
    tableHeight,
  });
  const euler = robotOrientationToThreeJS(
    selectedWp.roll,
    selectedWp.pitch,
    selectedWp.yaw
  );

  const fingerGap = 0.004 + selectedWp.gripperState * 0.008;
  const isOpen = selectedWp.gripperState > 0.5;
  const color = isOpen ? "#f59e0b" : "#8b5cf6";

  return (
    <group position={pos} rotation={euler}>
      <OrientationAxes />

      <mesh>
        <boxGeometry args={[0.02, 0.006, 0.014]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <mesh position={[-fingerGap, 0.008, 0]}>
        <boxGeometry args={[0.003, 0.015, 0.012]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <mesh position={[fingerGap, 0.008, 0]}>
        <boxGeometry args={[0.003, 0.015, 0.012]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
