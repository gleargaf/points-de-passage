import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three-stdlib";
import { useTrajectoryStore, type BodyTransform } from "@/lib/trajectoryStore";

interface RobotArmProps {
  position?: [number, number, number];
}

const MODEL_PATH = "/models/so101/";

const YELLOW_MAT = { color: "#ffd11e", roughness: 0.4, metalness: 0.3 };
const DARK_MAT = { color: "#1a1a1a", roughness: 0.5, metalness: 0.6 };

function mquat(w: number, x: number, y: number, z: number): THREE.Quaternion {
  const q = new THREE.Quaternion(x, y, z, w);
  q.normalize();
  return q;
}

function quatToArray(q: THREE.Quaternion): [number, number, number, number] {
  return [q.x, q.y, q.z, q.w];
}

function rotMatToQuat(rot: number[][]): [number, number, number, number] {
  const m = new THREE.Matrix4();
  m.set(
    rot[0][0], rot[0][1], rot[0][2], 0,
    rot[1][0], rot[1][1], rot[1][2], 0,
    rot[2][0], rot[2][1], rot[2][2], 0,
    0, 0, 0, 1
  );
  const q = new THREE.Quaternion();
  q.setFromRotationMatrix(m);
  return [q.x, q.y, q.z, q.w];
}

function STLMesh({
  file,
  position,
  quaternion,
  material,
}: {
  file: string;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  material: { color: string; roughness: number; metalness: number };
}) {
  const geometry = useLoader(STLLoader, MODEL_PATH + file);

  const geo = useMemo(() => {
    const g = geometry.clone();
    g.computeVertexNormals();
    return g;
  }, [geometry]);

  return (
    <mesh
      geometry={geo}
      position={position}
      quaternion={quaternion}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={material.color}
        roughness={material.roughness}
        metalness={material.metalness}
      />
    </mesh>
  );
}

interface BodyMeshesProps {
  bodyName: string;
  meshes: Array<{
    file: string;
    position: [number, number, number];
    quaternion: [number, number, number, number];
    material: typeof YELLOW_MAT;
  }>;
  fkBodies: Record<string, BodyTransform> | null;
  defaultPosition: [number, number, number];
  defaultQuaternion: [number, number, number, number];
  children?: React.ReactNode;
}

function FKBody({
  bodyName,
  meshes,
  fkBodies,
  defaultPosition,
  defaultQuaternion,
  children,
}: BodyMeshesProps) {
  const pos: [number, number, number] = fkBodies?.[bodyName]
    ? (fkBodies[bodyName].position as [number, number, number])
    : defaultPosition;

  const quat: [number, number, number, number] = fkBodies?.[bodyName]
    ? rotMatToQuat(fkBodies[bodyName].rotation)
    : defaultQuaternion;

  return (
    <group position={pos} quaternion={quat}>
      {meshes.map((m, i) => (
        <STLMesh
          key={i}
          file={m.file}
          position={m.position}
          quaternion={m.quaternion}
          material={m.material}
        />
      ))}
      {children}
    </group>
  );
}

const BASE_POS: [number, number, number] = [0, 0, 0];
const BASE_QUAT = quatToArray(mquat(1, 0, 0, 0));

const BASE_MESHES = [
  { file: "base_motor_holder_so101_v1.stl", position: [-0.006365, -9.9e-05, -0.0024] as [number, number, number], quaternion: quatToArray(mquat(1, 1, 1, 1)), material: YELLOW_MAT },
  { file: "base_so101_v2.stl", position: [-0.006365, 0, -0.0024] as [number, number, number], quaternion: quatToArray(mquat(1, 1, 1, 1)), material: YELLOW_MAT },
  { file: "sts3215_03a_v1.stl", position: [0.0263353, 0, 0.0437] as [number, number, number], quaternion: quatToArray(mquat(1, 0, 0, 0)), material: DARK_MAT },
  { file: "waveshare_mounting_plate_so101_v2.stl", position: [-0.0309827, -0.000199, 0.0474] as [number, number, number], quaternion: quatToArray(mquat(1, 1, 1, 1)), material: YELLOW_MAT },
];

const SHOULDER_MESHES = [
  { file: "sts3215_03a_v1.stl", position: [-0.030399, 0.000422, -0.0417] as [number, number, number], quaternion: quatToArray(mquat(1, 1, 1, -1)), material: DARK_MAT },
  { file: "motor_holder_so101_base_v1.stl", position: [-0.067599, -0.0001778, 0.01585] as [number, number, number], quaternion: quatToArray(mquat(1, 1, -1, 1)), material: YELLOW_MAT },
  { file: "rotation_pitch_so101_v1.stl", position: [0.012201, 2.2e-05, 0.0464] as [number, number, number], quaternion: quatToArray(mquat(1, -1, 0, 0)), material: YELLOW_MAT },
];

const UPPER_ARM_MESHES = [
  { file: "sts3215_03a_v1.stl", position: [-0.11257, -0.0155, 0.0187] as [number, number, number], quaternion: quatToArray(mquat(0, -1, 1, 0)), material: DARK_MAT },
  { file: "upper_arm_so101_v1.stl", position: [-0.065085, 0.012, 0.0182] as [number, number, number], quaternion: quatToArray(mquat(0, 1, 0, 0)), material: YELLOW_MAT },
];

const LOWER_ARM_MESHES = [
  { file: "under_arm_so101_v1.stl", position: [-0.06485, -0.032, 0.0182] as [number, number, number], quaternion: quatToArray(mquat(0, 1, 0, 0)), material: YELLOW_MAT },
  { file: "motor_holder_so101_wrist_v1.stl", position: [-0.06485, -0.032, 0.018] as [number, number, number], quaternion: quatToArray(mquat(0, -1, 0, 0)), material: YELLOW_MAT },
  { file: "sts3215_03a_v1.stl", position: [-0.1224, 0.0052, 0.0187] as [number, number, number], quaternion: quatToArray(mquat(0, 0, 1, 0)), material: DARK_MAT },
];

const WRIST_MESHES = [
  { file: "sts3215_03a_no_horn_v1.stl", position: [0, -0.0424, 0.0306] as [number, number, number], quaternion: quatToArray(mquat(1, 1, 1, -1)), material: DARK_MAT },
  { file: "wrist_roll_pitch_so101_v2.stl", position: [0, -0.028, 0.0181] as [number, number, number], quaternion: quatToArray(mquat(1, -1, -1, -1)), material: YELLOW_MAT },
];

const GRIPPER_MESHES = [
  { file: "sts3215_03a_v1.stl", position: [0.0077, 0.0001, -0.0234] as [number, number, number], quaternion: quatToArray(mquat(1, -1, 0, 0)), material: DARK_MAT },
  { file: "wrist_roll_follower_so101_v1.stl", position: [0, -0.000218, 0.00095] as [number, number, number], quaternion: quatToArray(mquat(0, 1, 0, 0)), material: YELLOW_MAT },
];

const CAMERA_MOUNT_MESHES = [
  { file: "wrist_roll_follower_so101_camera_mount.stl", position: [0, -0.000218, 0.00095] as [number, number, number], quaternion: quatToArray(mquat(0, 1, 0, 0)), material: YELLOW_MAT },
];

const MOVING_JAW_MESHES = [
  { file: "moving_jaw_so101_v1.stl", position: [0, 0, 0.0189] as [number, number, number], quaternion: quatToArray(mquat(1, 0, 0, 0)), material: YELLOW_MAT },
];

function computeDefaultWorldTransform(chain: Array<{ pos: [number, number, number]; quat: THREE.Quaternion }>) {
  let worldPos = new THREE.Vector3(0, 0, 0);
  let worldQuat = new THREE.Quaternion(0, 0, 0, 1);
  for (const link of chain) {
    const localPos = new THREE.Vector3(...link.pos);
    localPos.applyQuaternion(worldQuat);
    worldPos.add(localPos);
    worldQuat.multiply(link.quat);
  }
  return {
    position: [worldPos.x, worldPos.y, worldPos.z] as [number, number, number],
    quaternion: [worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w] as [number, number, number, number],
  };
}

const shoulderDefault = computeDefaultWorldTransform([
  { pos: [0, 0, 0], quat: mquat(1, 0, 0, 0) },
  { pos: [0.0388353, 0, 0.0624], quat: mquat(0, 0, -1, 0) },
]);
const upperArmDefault = computeDefaultWorldTransform([
  { pos: [0, 0, 0], quat: mquat(1, 0, 0, 0) },
  { pos: [0.0388353, 0, 0.0624], quat: mquat(0, 0, -1, 0) },
  { pos: [-0.0303992, -0.0182778, -0.0542], quat: mquat(1, -1, -1, -1) },
]);
const lowerArmDefault = computeDefaultWorldTransform([
  { pos: [0, 0, 0], quat: mquat(1, 0, 0, 0) },
  { pos: [0.0388353, 0, 0.0624], quat: mquat(0, 0, -1, 0) },
  { pos: [-0.0303992, -0.0182778, -0.0542], quat: mquat(1, -1, -1, -1) },
  { pos: [-0.11257, -0.028, 0], quat: mquat(1, 0, 0, 1) },
]);
const wristDefault = computeDefaultWorldTransform([
  { pos: [0, 0, 0], quat: mquat(1, 0, 0, 0) },
  { pos: [0.0388353, 0, 0.0624], quat: mquat(0, 0, -1, 0) },
  { pos: [-0.0303992, -0.0182778, -0.0542], quat: mquat(1, -1, -1, -1) },
  { pos: [-0.11257, -0.028, 0], quat: mquat(1, 0, 0, 1) },
  { pos: [-0.1349, 0.0052, 0], quat: mquat(1, 0, 0, -1) },
]);
const gripperDefault = computeDefaultWorldTransform([
  { pos: [0, 0, 0], quat: mquat(1, 0, 0, 0) },
  { pos: [0.0388353, 0, 0.0624], quat: mquat(0, 0, -1, 0) },
  { pos: [-0.0303992, -0.0182778, -0.0542], quat: mquat(1, -1, -1, -1) },
  { pos: [-0.11257, -0.028, 0], quat: mquat(1, 0, 0, 1) },
  { pos: [-0.1349, 0.0052, 0], quat: mquat(1, 0, 0, -1) },
  { pos: [5.55112e-17, -0.0611, 0.0181], quat: mquat(0.0172091, -0.0172091, 0.706897, 0.706897) },
]);
const cameraMountDefault = computeDefaultWorldTransform([
  { pos: [0, 0, 0], quat: mquat(1, 0, 0, 0) },
  { pos: [0.0388353, 0, 0.0624], quat: mquat(0, 0, -1, 0) },
  { pos: [-0.0303992, -0.0182778, -0.0542], quat: mquat(1, -1, -1, -1) },
  { pos: [-0.11257, -0.028, 0], quat: mquat(1, 0, 0, 1) },
  { pos: [-0.1349, 0.0052, 0], quat: mquat(1, 0, 0, -1) },
  { pos: [5.55112e-17, -0.0611, 0.0181], quat: mquat(0.0172091, -0.0172091, 0.706897, 0.706897) },
]);
const movingJawDefault = computeDefaultWorldTransform([
  { pos: [0, 0, 0], quat: mquat(1, 0, 0, 0) },
  { pos: [0.0388353, 0, 0.0624], quat: mquat(0, 0, -1, 0) },
  { pos: [-0.0303992, -0.0182778, -0.0542], quat: mquat(1, -1, -1, -1) },
  { pos: [-0.11257, -0.028, 0], quat: mquat(1, 0, 0, 1) },
  { pos: [-0.1349, 0.0052, 0], quat: mquat(1, 0, 0, -1) },
  { pos: [5.55112e-17, -0.0611, 0.0181], quat: mquat(0.0172091, -0.0172091, 0.706897, 0.706897) },
  { pos: [0.0202, 0.0188, -0.0234], quat: mquat(1, 1, 0, 0) },
]);

function SO101Model() {
  const ikResult = useTrajectoryStore((s) => s.ikResult);
  const simulationFrames = useTrajectoryStore((s) => s.simulationFrames);
  const simulationFrameIndex = useTrajectoryStore((s) => s.simulationFrameIndex);
  const isPlaying = useTrajectoryStore((s) => s.isPlaying);

  const simFrame = (isPlaying || simulationFrames.length > 0) && simulationFrameIndex < simulationFrames.length
    ? simulationFrames[simulationFrameIndex]
    : null;
  const fkBodies = simFrame?.bodies ?? ikResult?.bodies ?? null;

  return (
    <group>
      <FKBody bodyName="base" meshes={BASE_MESHES} fkBodies={fkBodies} defaultPosition={BASE_POS} defaultQuaternion={BASE_QUAT} />
      <FKBody bodyName="shoulder" meshes={SHOULDER_MESHES} fkBodies={fkBodies} defaultPosition={shoulderDefault.position} defaultQuaternion={shoulderDefault.quaternion} />
      <FKBody bodyName="upper_arm" meshes={UPPER_ARM_MESHES} fkBodies={fkBodies} defaultPosition={upperArmDefault.position} defaultQuaternion={upperArmDefault.quaternion} />
      <FKBody bodyName="lower_arm" meshes={LOWER_ARM_MESHES} fkBodies={fkBodies} defaultPosition={lowerArmDefault.position} defaultQuaternion={lowerArmDefault.quaternion} />
      <FKBody bodyName="wrist" meshes={WRIST_MESHES} fkBodies={fkBodies} defaultPosition={wristDefault.position} defaultQuaternion={wristDefault.quaternion} />
      <FKBody bodyName="gripper" meshes={GRIPPER_MESHES} fkBodies={fkBodies} defaultPosition={gripperDefault.position} defaultQuaternion={gripperDefault.quaternion} />
      <FKBody bodyName="camera_mount" meshes={CAMERA_MOUNT_MESHES} fkBodies={fkBodies} defaultPosition={cameraMountDefault.position} defaultQuaternion={cameraMountDefault.quaternion} />
      <FKBody bodyName="moving_jaw_so101_v1" meshes={MOVING_JAW_MESHES} fkBodies={fkBodies} defaultPosition={movingJawDefault.position} defaultQuaternion={movingJawDefault.quaternion} />
    </group>
  );
}

function LoadingPlaceholder() {
  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.038, 0.06, 24]} />
        <meshStandardMaterial color="#ffd11e" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

export function RobotArm({ position = [-0.12, 0.02, 0] }: RobotArmProps) {
  const groupRef = useRef<THREE.Group>(null);

  const zUpToYUp = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    return [q.x, q.y, q.z, q.w] as [number, number, number, number];
  }, []);

  return (
    <group ref={groupRef} position={position}>
      <group quaternion={zUpToYUp}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <SO101Model />
        </Suspense>
      </group>
    </group>
  );
}
