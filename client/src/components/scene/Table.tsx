import { useRef } from "react";
import * as THREE from "three";

export function Table() {
  const tableRef = useRef<THREE.Group>(null);

  const tableWidth = 0.6;
  const tableDepth = 0.5;
  const tableHeight = 0.02;
  const legHeight = 0.0;

  return (
    <group ref={tableRef} position={[0.05, 0, 0.05]}>
      <mesh position={[0, legHeight + tableHeight / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[tableWidth, tableHeight, tableDepth]} />
        <meshStandardMaterial color="#8B7355" roughness={0.6} metalness={0.1} />
      </mesh>

      <mesh position={[0, legHeight + tableHeight + 0.0005, 0]} receiveShadow>
        <boxGeometry args={[tableWidth - 0.01, 0.001, tableDepth - 0.01]} />
        <meshStandardMaterial color="#A0876A" roughness={0.4} metalness={0.05} />
      </mesh>
    </group>
  );
}
