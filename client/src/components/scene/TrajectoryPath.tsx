import { useMemo } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/lib/trajectoryStore";
import { robotToThreeJSVec3 } from "@/lib/coordinates";

export function TrajectoryPath() {
  const { waypoints, baseX, baseY, tableHeight } = useTrajectoryStore();
  const base = { baseX, baseY, tableHeight };

  const curve = useMemo(() => {
    if (waypoints.length < 2) return null;
    const points = waypoints.map((wp) =>
      robotToThreeJSVec3(wp.x, wp.y, wp.z, base)
    );
    if (points.length === 2) {
      return new THREE.LineCurve3(points[0], points[1]);
    }
    return new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
  }, [waypoints, baseX, baseY, tableHeight]);

  const linePoints = useMemo(() => {
    if (!curve) return [];
    return curve.getPoints(64);
  }, [curve]);

  if (linePoints.length < 2) return null;

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePoints.length}
            array={new Float32Array(linePoints.flatMap((p) => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#60a5fa" linewidth={2} transparent opacity={0.8} />
      </line>

      {waypoints.length >= 2 && (
        <>
          {waypoints.slice(0, -1).map((wp, i) => {
            const next = waypoints[i + 1];
            const start = robotToThreeJSVec3(wp.x, wp.y, wp.z, base);
            const end = robotToThreeJSVec3(next.x, next.y, next.z, base);
            const mid = start.clone().lerp(end, 0.5);
            const dir = end.clone().sub(start);
            const len = dir.length();
            if (len < 0.001) return null;

            const arrowDir = dir.normalize();
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              arrowDir
            );

            return (
              <mesh
                key={`arrow-${i}`}
                position={[mid.x, mid.y, mid.z]}
                quaternion={quaternion}
              >
                <coneGeometry args={[0.004, 0.012, 8]} />
                <meshStandardMaterial
                  color="#60a5fa"
                  transparent
                  opacity={0.7}
                />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
}
