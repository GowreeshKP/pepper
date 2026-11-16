import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ---- 3D cellular (Worley) noise: ridges along cell borders look just like the
        reticulated wrinkle network on a dried peppercorn ---- */
function hash(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967295;
}

/** Returns F2 - F1: ~0 on cell borders, grows toward the cell centre. */
function worleyEdge(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  let f1 = 9;
  let f2 = 9;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const cx = xi + dx;
        const cy = yi + dy;
        const cz = zi + dz;
        const px = cx + hash(cx, cy, cz) - x;
        const py = cy + hash(cx + 17, cy + 31, cz + 7) - y;
        const pz = cz + hash(cx + 53, cy + 11, cz + 29) - z;
        const d = px * px + py * py + pz * pz;
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) f2 = d;
      }
    }
  }
  return Math.sqrt(f2) - Math.sqrt(f1);
}
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Matches real dried pepper: dark grooves, lighter warm grey-brown ridges that catch the light.
const GROOVE = new THREE.Color().setRGB(0.008, 0.006, 0.005);
const RIDGE_HI = new THREE.Color().setRGB(0.072, 0.05, 0.036);

/** Per-corn tone multipliers: charcoal, warm brown, tan (a few lighter ones, as in a real pile). */
export const CORN_TINTS = [
  new THREE.Color(0.85, 0.82, 0.85),
  new THREE.Color(1.25, 1.1, 0.95),
  new THREE.Color(0.7, 0.66, 0.68),
  new THREE.Color(1.9, 1.5, 1.05),
  new THREE.Color(1.05, 0.95, 0.88),
];

/** Wrinkled peppercorn. detail >= 4 = hero quality, otherwise a light instanced version. */
export function makeCornGeometry(detail = 4) {
  const hi = detail >= 4;
  let g = new THREE.SphereGeometry(1, hi ? 200 : 40, hi ? 140 : 28);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    // slightly warped coordinates so the cell network is not axis aligned
    const wx = v.x + 0.18 * Math.sin(v.y * 3.1 + 1.7);
    const wy = v.y + 0.18 * Math.sin(v.z * 3.3 + 0.4);
    const wz = v.z + 0.18 * Math.sin(v.x * 2.9 + 2.2);
    const e1 = worleyEdge(wx * 3.4 + 5, wy * 3.4 + 9, wz * 3.4 + 2);
    const e2 = worleyEdge(wx * 8.0 + 1, wy * 8.0 + 4, wz * 8.0 + 7);
    const ridge = Math.min(1, (1 - sstep(0.0, 0.42, e1)) * 0.85 + (1 - sstep(0.0, 0.3, e2)) * 0.3);

    // smooth, non axis-aligned lumpiness
    const lump = 0.03 * Math.sin(v.x * 2.1 + 1.3) * Math.sin(v.y * 1.7 + 0.4) + 0.02 * Math.sin(v.z * 2.6 + 2.0) + 0.015 * Math.sin(v.x * 3.7 + v.z * 2.3);
    let rad = 1 + lump + 0.085 * ridge - 0.03;
    // stem dimple and a softer one at the tip
    const stem = Math.max(0, v.y - 0.8) / 0.2;
    rad -= 0.1 * stem * stem * (3 - 2 * Math.min(1, stem));
    const tip = Math.max(0, -v.y - 0.88) / 0.12;
    rad -= 0.04 * Math.min(1, tip);
    v.multiplyScalar(rad);
    v.y *= 0.95;
    p.setXYZ(i, v.x, v.y, v.z);

    c.copy(GROOVE).lerp(RIDGE_HI, Math.pow(ridge, 1.3));
    const sp = 0.88 + hash(Math.floor(v.x * 60), Math.floor(v.y * 60), Math.floor(v.z * 60)) * 0.24; // dusty speckle
    colors[i * 3] = c.r * sp;
    colors[i * 3 + 1] = c.g * sp;
    colors[i * 3 + 2] = c.b * sp;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export function makeCornMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.0,
    envMapIntensity: 1.3,
  });
}
