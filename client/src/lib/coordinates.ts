import * as THREE from "three";

export interface BaseConfig {
  baseX: number;
  baseY: number;
  tableHeight: number;
}

export function robotToThreeJS(
  rx: number,
  ry: number,
  rz: number,
  base: BaseConfig
): [number, number, number] {
  return [
    base.baseX + rx,
    base.tableHeight + rz,
    base.baseY + ry,
  ];
}

export function robotToThreeJSVec3(
  rx: number,
  ry: number,
  rz: number,
  base: BaseConfig
): THREE.Vector3 {
  const [x, y, z] = robotToThreeJS(rx, ry, rz, base);
  return new THREE.Vector3(x, y, z);
}

export function robotOrientationToThreeJS(
  rollDeg: number,
  pitchDeg: number,
  yawDeg: number
): THREE.Euler {
  const r = rollDeg * (Math.PI / 180);
  const p = pitchDeg * (Math.PI / 180);
  const y = yawDeg * (Math.PI / 180);
  return new THREE.Euler(r, y, p, "XYZ");
}
