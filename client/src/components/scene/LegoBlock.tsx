import { useRef } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/lib/trajectoryStore";
import { ThreeEvent } from "@react-three/fiber";

interface LegoBlockProps {
  position: [number, number, number];
  color: string;
  id: string;
}

export function LegoBlock({ position, color, id }: LegoBlockProps) {
  const meshRef = useRef<THREE.Group>(null);
  const { selectedBlockId, setSelectedBlockId } = useTrajectoryStore();
  const isSelected = selectedBlockId === id;

  const width = 0.032;
  const height = 0.019;
  const depth = 0.016;
  const studRadius = 0.004;
  const studHeight = 0.004;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedBlockId(isSelected ? null : id);
  };

  return (
    <group
      ref={meshRef}
      position={position}
      userData={{ type: "lego", id }}
      onClick={handleClick}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.1}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.4 : 0}
        />
      </mesh>

      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width + 0.002, height + 0.002, depth + 0.002)]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
      )}

      {[
        [-width / 4, height / 2 + studHeight / 2, -depth / 4],
        [width / 4, height / 2 + studHeight / 2, -depth / 4],
        [-width / 4, height / 2 + studHeight / 2, depth / 4],
        [width / 4, height / 2 + studHeight / 2, depth / 4],
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          castShadow
        >
          <cylinderGeometry args={[studRadius, studRadius, studHeight, 12]} />
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.1}
            emissive={isSelected ? color : "#000000"}
            emissiveIntensity={isSelected ? 0.4 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}
