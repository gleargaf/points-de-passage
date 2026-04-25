import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Billboard } from "@react-three/drei";
import { useTrajectoryStore } from "@/lib/trajectoryStore";
import { robotToThreeJS } from "@/lib/coordinates";

function WaypointSphere({
  waypoint,
  index,
}: {
  waypoint: { id: string; x: number; y: number; z: number; gripperState: number; label?: string };
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { selectedWaypointId, setSelectedWaypoint, baseX, baseY, tableHeight } =
    useTrajectoryStore();
  const isSelected = selectedWaypointId === waypoint.id;

  useFrame((_, delta) => {
    if (meshRef.current) {
      const scale = isSelected ? 1.3 : hovered ? 1.15 : 1.0;
      meshRef.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        delta * 10
      );
    }
  });

  const baseColor = waypoint.gripperState > 0.5 ? "#f59e0b" : "#8b5cf6";
  const pos = robotToThreeJS(waypoint.x, waypoint.y, waypoint.z, {
    baseX,
    baseY,
    tableHeight,
  });

  return (
    <group position={pos}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedWaypoint(isSelected ? null : waypoint.id);
        }}
        castShadow
      >
        <sphereGeometry args={[0.008, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? "#ef4444" : baseColor}
          emissive={isSelected ? "#ef4444" : hovered ? baseColor : "#000000"}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {isSelected && (
        <mesh>
          <sphereGeometry args={[0.012, 16, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}

      <Billboard>
        <Html
          center
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
          position={[0, 0.02, 0]}
        >
          <div
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap"
            style={{
              background: isSelected
                ? "rgba(239, 68, 68, 0.9)"
                : "rgba(0,0,0,0.75)",
              color: "white",
              transform: "translateX(-50%)",
            }}
          >
            {waypoint.label || `W${index + 1}`}
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

export function WaypointMarkers() {
  const { waypoints } = useTrajectoryStore();

  return (
    <group>
      {waypoints.map((wp, i) => (
        <WaypointSphere key={wp.id} waypoint={wp} index={i} />
      ))}
    </group>
  );
}
