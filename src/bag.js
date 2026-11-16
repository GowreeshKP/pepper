import * as THREE from 'three';

export const BAG_W = 1.5;
export const BAG_H = 2.3;

let geo;

function sstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Pillow-shaped bag half with flat crimped seals at top and bottom. */
function getBagGeometry() {
  if (geo) return geo;
  const g = new THREE.PlaneGeometry(BAG_W, BAG_H, 64, 96);
  const p = g.attributes.position;
  const seal = 0.1;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i);
    const x = px / (BAG_W / 2);
    const y = p.getY(i) / (BAG_H / 2);
    const ay = Math.abs(y);
    const body = sstep(1 - seal, 1 - seal * 2.6, ay);
    const side = Math.pow(Math.max(0, 1 - x * x), 0.55);
    const belly = 1 + 0.18 * Math.cos(y * Math.PI * 0.5);
    const crimp = (1 - body) * 0.035 * (0.5 + 0.5 * Math.sin(px * 75));
    const wave = 0.014 * Math.sin(y * 9 + x * 3) * body;
    p.setZ(i, 0.34 * body * side * belly + crimp + wave);
  }
  g.computeVertexNormals();
  geo = g;
  return g;
}

export function makeBag(map, crinkle) {
  const mat = new THREE.MeshPhysicalMaterial({
    map,
    roughness: 0.62,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.5,
    bumpMap: crinkle,
    bumpScale: 0.5,
    envMapIntensity: 0.32,
  });
  const g = getBagGeometry();
  const group = new THREE.Group();
  const front = new THREE.Mesh(g, mat);
  const back = new THREE.Mesh(g, mat);
  back.rotation.y = Math.PI;
  group.add(front, back);
  group.userData.material = mat;
  return group;
}
