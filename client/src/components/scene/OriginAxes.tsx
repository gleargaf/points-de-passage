import { Html, Billboard } from "@react-three/drei";
import { useTrajectoryStore } from "@/lib/trajectoryStore";

export function OriginAxes() {
  const { baseX, baseY, tableHeight } = useTrajectoryStore();

  const axisLen = 0.08;
  const origin: [number, number, number] = [baseX, tableHeight, baseY];

  return (
    <group position={origin}>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, axisLen, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={3} />
      </line>
      <Billboard position={[axisLen + 0.01, 0, 0]}>
        <Html center style={{ pointerEvents: "none" }}>
          <span className="text-[9px] font-mono font-bold text-red-500">X</span>
        </Html>
      </Billboard>

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, axisLen])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" linewidth={3} />
      </line>
      <Billboard position={[0, 0, axisLen + 0.01]}>
        <Html center style={{ pointerEvents: "none" }}>
          <span className="text-[9px] font-mono font-bold text-green-500">Y</span>
        </Html>
      </Billboard>

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, axisLen, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={3} />
      </line>
      <Billboard position={[0, axisLen + 0.01, 0]}>
        <Html center style={{ pointerEvents: "none" }}>
          <span className="text-[9px] font-mono font-bold text-blue-500">Z</span>
        </Html>
      </Billboard>

      <mesh>
        <sphereGeometry args={[0.005, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
