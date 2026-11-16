import * as THREE from 'three';

export function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixc(a, b, t) {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}
function rgba(c, a) {
  const [r, g, b] = hex(c);
  return `rgba(${r},${g},${b},${a})`;
}

/** Draws one wrinkled peppercorn on a 2D canvas. */
export function drawCorn(ctx, x, y, r, rot, rand) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.08, 0, 0, r * 1.05);
  g.addColorStop(0, '#76624f');
  g.addColorStop(0.35, '#33261d');
  g.addColorStop(1, '#0a0605');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineWidth = Math.max(1, r * 0.035);
  for (let i = 0; i < 10; i++) {
    const a = rand() * Math.PI * 2;
    const rr = r * (0.25 + rand() * 0.75);
    const cx = Math.cos(a) * rr * 0.4;
    const cy = Math.sin(a) * rr * 0.4;
    const len = 1 + rand() * 1.6;
    ctx.strokeStyle = `rgba(0,0,0,${0.35 + rand() * 0.3})`;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, a, a + len);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,235,210,.08)';
    ctx.beginPath();
    ctx.arc(cx + r * 0.03, cy + r * 0.03, rr, a, a + len);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

/** One rendered corn sprite, rotated, with a soft contact shadow. */
export function drawSprite(ctx, sprites, x, y, size, rot, rand, shadow = true) {
  const s = sprites[Math.floor(rand() * sprites.length)];
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,.5)';
    ctx.shadowBlur = size * 0.28;
    ctx.shadowOffsetY = size * 0.1;
  }
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.drawImage(s, -size / 2, -size / 2, size, size);
  ctx.restore();
}

/** A dome-shaped heap of peppercorns. Higher corns are drawn first so lower ones overlap them. */
export function drawHeap(ctx, sprites, cx, cy, rx, ry, count, rand, sizeRange = [70, 120]) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() * 2 - 1) * rx;
    const dome = Math.sqrt(Math.max(0, 1 - (x / rx) * (x / rx)));
    const top = ry * dome;
    const y = ry * 0.45 - Math.pow(rand(), 0.8) * top * 1.05; // 0 = base, negative = up
    pts.push({ x: cx + x, y: cy + y, s: sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0]), r: rand() * 6.28 });
  }
  pts.sort((a, b) => a.y - b.y);
  for (const p of pts) drawSprite(ctx, sprites, p.x, p.y, p.s, p.r, rand);
}

/** Wide banner: glowing heap of peppercorns for the origin stories. */
export function makeHeapBanner(sprites, f, w = 1100, h = 620) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const rand = rng(f.id.charCodeAt(0) * 31 + 7);
  const g = ctx.createRadialGradient(w / 2, h * 0.6, 20, w / 2, h * 0.6, w * 0.6);
  g.addColorStop(0, rgba(f.color, 0.55));
  g.addColorStop(1, rgba(f.deep, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // ground shadow
  ctx.save();
  ctx.translate(w / 2, h * 0.86);
  ctx.scale(1, 0.16);
  const sg = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.46);
  sg.addColorStop(0, 'rgba(0,0,0,.6)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawHeap(ctx, sprites, w / 2, h * 0.6, w * 0.4, h * 0.46, 150, rand, [90, 150]);
  // a few loose corns rolling out
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1;
    drawSprite(ctx, sprites, w / 2 + side * (w * 0.4 + rand() * w * 0.08), h * (0.72 + rand() * 0.16), 56 + rand() * 40, rand() * 6.28, rand);
  }
  return c;
}

/** Washed-out, lighter copies of the corn sprites: stand-ins for hollow, low-density berries. */
export function makeFadedSprites(sprites) {
  return sprites.map((s) => {
    const c = document.createElement('canvas');
    c.width = s.width;
    c.height = s.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(s, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(196,184,160,.55)';
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  });
}

function drawSeed(ctx, x, y, size, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = size * 0.25;
  ctx.shadowOffsetY = size * 0.08;
  const g = ctx.createRadialGradient(-size * 0.15, -size * 0.2, 1, 0, 0, size * 0.6);
  g.addColorStop(0, '#6a4a30');
  g.addColorStop(0.5, '#2c1a10');
  g.addColorStop(1, '#0d0704');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.34, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; // the glossy "mineral oil" shine
  ctx.beginPath();
  ctx.ellipse(-size * 0.1, -size * 0.18, size * 0.07, size * 0.14, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A sparse, uneven mass-market mix: faded hollow berries, shiny papaya seeds and dust. */
export function makeAdulteratedBanner(sprites, w = 1100, h = 620) {
  const faded = makeFadedSprites(sprites);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const rand = rng(99);
  const g = ctx.createRadialGradient(w / 2, h * 0.62, 20, w / 2, h * 0.62, w * 0.6);
  g.addColorStop(0, 'rgba(170,160,140,.28)');
  g.addColorStop(1, 'rgba(20,16,12,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // dust
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(${150 + rand() * 60},${135 + rand() * 50},${110 + rand() * 40},${0.08 + rand() * 0.18})`;
    const r = 1 + rand() * 2.6;
    const x = w / 2 + (rand() * 2 - 1) * w * 0.42;
    const y = h * 0.82 - Math.pow(rand(), 1.4) * h * 0.4;
    ctx.fillRect(x, y, r, r);
  }
  const items = [];
  const rx = w * 0.4;
  const ry = h * 0.4;
  for (let i = 0; i < 140; i++) {
    const x = (rand() * 2 - 1) * rx;
    const dome = Math.sqrt(Math.max(0, 1 - (x / rx) * (x / rx)));
    const y = ry * 0.45 - Math.pow(rand(), 0.9) * ry * dome * 0.95;
    const kind = rand();
    items.push({ x: w / 2 + x, y: h * 0.62 + y, kind, s: kind < 0.28 ? 40 + rand() * 30 : 62 + rand() * 50, r: rand() * 6.28 });
  }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    if (it.kind < 0.28) drawSeed(ctx, it.x, it.y, it.s, it.r); // papaya seeds
    else drawSprite(ctx, it.kind < 0.62 ? faded : sprites, it.x, it.y, it.s * (it.kind < 0.62 ? 0.8 : 1), it.r, rand);
  }
  return c;
}

export function makeCornSprite(size = 96, seed = 7) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  drawCorn(ctx, size / 2, size / 2, size * 0.46, 0, rng(seed));
  return c;
}

/** 1024x1536 flat pack art for one flavor. */
export function makePackTexture(f, renderer, sprites) {
  const W = 1024;
  const H = 1536;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const rand = rng(f.id.length * 977 + f.id.charCodeAt(0));
  const base = mixc(f.color, f.deep, 0.55);

  // base + glow
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(W / 2, H * 0.52, 20, W / 2, H * 0.52, H * 0.62);
  rg.addColorStop(0, rgba(f.color, 0.95));
  rg.addColorStop(0.55, rgba(f.color, 0.55));
  rg.addColorStop(1, rgba(f.deep, 0.0));
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  // concentric rings
  ctx.save();
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.52, 110 + i * 62, 0, Math.PI * 2);
    ctx.lineWidth = 26;
    ctx.strokeStyle = i % 2 ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.07)';
    ctx.stroke();
  }
  ctx.restore();

  // loose corns scattered around the edges + a real heap behind the name
  if (sprites && sprites.length) {
    // edge vignette so the centre art pops
    const vg = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.25, W / 2, H * 0.5, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(20,6,0,.42)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // richer, punchier corns (the raw sprites read pale against the warm colour)
    const punch = 'contrast(1.28) saturate(1.25) brightness(0.86)';
    const hasFilter = 'filter' in ctx;

    // a few loose corns near the edges, kept clear of the text
    if (hasFilter) ctx.filter = punch;
    const loose = [
      [0.13, 0.27, 84], [0.87, 0.23, 96], [0.9, 0.46, 70], [0.1, 0.5, 78],
      [0.16, 0.7, 64], [0.86, 0.68, 80],
    ];
    for (const [fx, fy, s] of loose) drawSprite(ctx, sprites, W * fx, H * fy, s, rand() * 6.28, rand);

    // dark pool under the heap: ambient occlusion so it sits on the pack, not floats
    ctx.save();
    ctx.filter = 'none';
    ctx.translate(W * 0.5, H * 0.445);
    ctx.scale(1, 0.34);
    const pool = ctx.createRadialGradient(0, 0, 20, 0, 0, 400);
    pool.addColorStop(0, 'rgba(25,8,0,.55)');
    pool.addColorStop(1, 'rgba(25,8,0,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(0, 0, 400, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (hasFilter) ctx.filter = punch;
    drawHeap(ctx, sprites, W * 0.5, H * 0.4, 345, 210, 90, rand, [96, 160]);
    if (hasFilter) ctx.filter = 'none';
  } else {
    drawCorn(ctx, W * 0.5, H * 0.34, 150, 0.4, rand);
    drawCorn(ctx, W * 0.34, H * 0.4, 96, 1.2, rand);
    drawCorn(ctx, W * 0.67, H * 0.41, 112, 2.1, rand);
  }

  const ink = f.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // brand
  ctx.fillStyle = ink;
  ctx.font = '900 112px "Archivo Variable", Arial Black, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '18px';
  ctx.fillText('NOIR', W / 2 + 9, H * 0.17);
  ctx.font = '700 34px "JetBrains Mono Variable", monospace';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '12px';
  ctx.fillText('PEPPER CO.', W / 2 + 6, H * 0.17 + 52);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // name (fit to width)
  const name = (f.short || f.name).toUpperCase();
  let size = 190;
  ctx.font = `900 ${size}px "Archivo Variable", Arial Black, sans-serif`;
  while (ctx.measureText(name).width > 840 && size > 60) {
    size -= 6;
    ctx.font = `900 ${size}px "Archivo Variable", Arial Black, sans-serif`;
  }
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 16;
  ctx.strokeStyle = 'rgba(18,6,2,.55)';
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.strokeText(name, W / 2, H * 0.6);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fff7ee';
  ctx.fillText(name, W / 2, H * 0.6);
  ctx.restore();

  // line pill
  const pill = f.line.toUpperCase();
  ctx.font = '800 40px "Archivo Variable", Arial, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
  const pw = ctx.measureText(pill).width + 80;
  ctx.fillStyle = '#0b0605';
  const px = W / 2 - pw / 2;
  const py = H * 0.6 + 36;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, 76, 38);
  ctx.fill();
  ctx.fillStyle = f.color;
  ctx.fillText(pill, W / 2 + 3, py + 53);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // bottom info panel (dark, for legibility)
  const bx = 96;
  const by = H * 0.775;
  const bw = W - 192;
  const bh = H * 0.115;
  ctx.fillStyle = 'rgba(12,4,1,.82)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 22);
  ctx.fill();
  ctx.strokeStyle = rgba(f.color, 0.6);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff3e4';
  ctx.font = '900 52px "Archivo Variable", Arial, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  ctx.fillText('WHOLE BLACK PEPPERCORNS', W / 2, by + 68);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.fillStyle = f.color;
  ctx.font = '800 36px "JetBrains Mono Variable", monospace';
  ctx.fillText(`${f.origin.split(',')[0].toUpperCase()}  \u00b7  NET 100 g`, W / 2, by + 124);

  // top label + thin inner frame
  ctx.fillStyle = ink;
  ctx.globalAlpha = 1;
  ctx.font = '700 30px "JetBrains Mono Variable", monospace';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
  ctx.fillText('SINGLE ORIGIN \u00b7 ESTATE DIRECT', W / 2 + 3, H * 0.17 + 110);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,245,230,.28)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(46, H * 0.1 + 24, W - 92, H * 0.8 - 56, 34);
  ctx.stroke();

  // soft foil sheen across the pack
  const sheen = ctx.createLinearGradient(0, 0, W, H);
  sheen.addColorStop(0.25, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.42, 'rgba(255,255,255,.10)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  // seals: top and bottom bands
  const sealH = H * 0.1;
  for (const y0 of [0, H - sealH]) {
    const sg = ctx.createLinearGradient(0, y0, 0, y0 + sealH);
    sg.addColorStop(0, y0 === 0 ? 'rgba(255,255,255,.34)' : 'rgba(0,0,0,.22)');
    sg.addColorStop(1, y0 === 0 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.3)');
    ctx.fillStyle = mixc(f.color, '#111111', 0.35);
    ctx.fillRect(0, y0, W, sealH);
    ctx.fillStyle = sg;
    ctx.fillRect(0, y0, W, sealH);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    for (let x = 0; x < W; x += 12) ctx.fillRect(x, y0, 3, sealH);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (let x = 5; x < W; x += 12) ctx.fillRect(x, y0, 2, sealH);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  tex.needsUpdate = true;
  return tex;
}

/** Soft crinkle bump map shared by every bag. */
export function makeCrinkle() {
  const W = 512;
  const H = 768;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, W, H);
  const rand = rng(42);
  for (let i = 0; i < 700; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const a = -0.9 + rand() * 1.8 + (rand() > 0.5 ? Math.PI / 2 : 0);
    const l = 30 + rand() * 120;
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.10)';
    ctx.lineWidth = 1 + rand() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
