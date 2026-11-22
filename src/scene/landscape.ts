import * as THREE from "three";
export function groundHeight(x: number, z: number) {
  return (
    0.16 +
    2.5 / (1 + Math.exp((z + 3) * 0.5)) +
    0.38 * Math.sin(x * 0.3 + z * 0.15)
  );
}
const controls = [
  [0.7, 12.7],
  [3.2, 11.2],
  [4.1, 8.5],
  [1.3, 7],
  [-2, 8],
  [-4, 6],
  [-3.3, 3.9],
  [-0.2, 3],
  [3.4, 1.5],
  [3.8, -1.2],
  [1.4, -3.6],
  [-2.5, -4.5],
  [-3.1, -7.2],
  [-0.7, -8.7],
  [2, -10.1],
  [0.4, -12.1],
];
export const trail = new THREE.CatmullRomCurve3(
  controls.map(([x, z]) => new THREE.Vector3(x, groundHeight(x, z) + 0.12, z)),
  false,
  "catmullrom",
  0.34,
);
export function pointAt(t: number) {
  return trail.getPointAt(THREE.MathUtils.clamp(t, 0, 1));
}
export function tangentAt(t: number) {
  return trail.getTangentAt(THREE.MathUtils.clamp(t, 0, 1));
}
export function ribbon(width: number, offset = 0) {
  const points: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= 450; i++) {
    const t = i / 450,
      p = pointAt(t),
      dir = tangentAt(t);
    const normal = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    for (const side of [-1, 1]) {
      const v = p.clone().addScaledVector(normal, (side * width) / 2);
      points.push(v.x, v.y + offset, v.z);
      uv.push((side + 1) / 2, t * 40);
    }
    if (i < 450) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function boundary(theta: number, r: number) {
  const shape = 1 + 0.035 * Math.sin(theta * 7) + 0.035 * Math.cos(theta * 5);
  return [Math.cos(theta) * 6.3 * r * shape, Math.sin(theta) * 14 * r * shape];
}
export function islandGeometry() {
  const p: number[] = [],
    colors: number[] = [],
    idx: number[] = [];
  const rings = 30,
    segments = 144;
  const col = new THREE.Color();
  for (let j = 0; j <= rings; j++) {
    for (let i = 0; i <= segments; i++) {
      const [x, z] = boundary((i / segments) * Math.PI * 2, j / rings);
      p.push(x, groundHeight(x, z), z);
      col
        .set("#e1ded0")
        .lerp(new THREE.Color("#eef0e7"), 0.5 + 0.2 * Math.sin(x + z));
      colors.push(col.r, col.g, col.b);
      if (j < rings && i < segments) {
        const a = j * (segments + 1) + i;
        idx.push(
          a,
          a + 1,
          a + segments + 1,
          a + 1,
          a + segments + 2,
          a + segments + 1,
        );
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function cliffGeometry() {
  const p: number[] = [],
    c: number[] = [],
    idx: number[] = [];
  const segments = 144;
  const shades = ["#e9e7d8", "#dfc8ac", "#bca487", "#a48c73", "#c4ad89"];
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const [x, z] = boundary(
        theta,
        j === 4 ? 0.96 : 1 + (j === 2 ? 0.012 : 0),
      );
      const y =
        j === 0
          ? groundHeight(x, z)
          : j === 1
            ? groundHeight(x, z) - 0.25
            : j === 2
              ? groundHeight(x, z) - 0.75
              : j === 3
                ? -1.45
                : -1.8;
      p.push(x, y, z);
      const color = new THREE.Color(shades[j]).multiplyScalar(
        0.96 + 0.07 * Math.sin(theta * 19),
      );
      c.push(color.r, color.g, color.b);
      if (j < 4 && i < segments) {
        const a = j * (segments + 1) + i;
        idx.push(
          a,
          a + 1,
          a + segments + 1,
          a + 1,
          a + segments + 2,
          a + segments + 1,
        );
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function distanceFromTrail(x: number, z: number) {
  let min = 100;
  for (let i = 0; i <= 110; i++) {
    const p = pointAt(i / 110);
    min = Math.min(min, Math.hypot(p.x - x, p.z - z));
  }
  return min;
}
