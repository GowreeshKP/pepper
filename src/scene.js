import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { makeBag } from './bag.js';
import { makePackTexture, makeCrinkle } from './textures.js';
import { makeCornGeometry, makeCornMaterial, CORN_TINTS } from './corn.js';

const tick = () => new Promise((r) => setTimeout(r, 0));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const wrap = (v, n) => ((((v + n / 2) % n) + n) % n) - n / 2;

function sample(arr, p) {
  const n = arr.length - 1;
  const t = clamp(p, 0, 1) * n;
  const i = Math.min(n - 1, Math.floor(t));
  const f = smooth(t - i);
  const a = arr[i];
  const b = arr[i + 1];
  return Array.isArray(a) ? a.map((v, k) => v + (b[k] - v) * f) : a + (b - a) * f;
}

const STORY_CAM = [
  [0, 0, 7.6],
  [0.45, 0.5, 5.6],
  [-0.4, -0.25, 5.3],
  [0, 0, 7.8],
];
const STORY_ROT = [-0.25, 3.2, 6.0, 6.283];
const STORY_ROT_X = [0.0, -0.18, 0.12, 0.0];

const RING_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const RING_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uDeepA; uniform vec3 uDeepB;
uniform float uMix; uniform float uTime; uniform float uAspect;
void main(){
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float d = length(p);
  float front = uMix * 1.9;
  float m = 1.0 - smoothstep(front - 0.35, front, d);
  vec3 col = mix(uA, uB, m);
  vec3 deep = mix(uDeepA, uDeepB, m);
  float r = 0.5 + 0.5 * sin(d * 30.0 - uTime * 0.7);
  r = smoothstep(0.6, 0.98, r);
  float vig = smoothstep(1.15, 0.05, d);
  vec3 c = deep + col * (r * 0.20 * vig + exp(-d * 2.6) * 0.34);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export class Experience {
  constructor(canvas, flavors) {
    this.canvas = canvas;
    this.flavors = flavors;
    this.n = flavors.length;
    this.running = true;
    this.time = 0;
    this.state = {
      cur: 0,
      target: 0,
      idx: 0,
      intro: 0,
      toStory: 0,
      story: 0,
      mouse: { x: 0, y: 0, sx: 0, sy: 0 },
    };
    this.bags = [];
    this.textures = [];
    this.size = { w: 1, h: 1 };

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0x0a0605, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, 7);
    this.scene.add(this.camera);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.85;

    this.key = new THREE.DirectionalLight(0xffffff, 1.5);
    this.key.position.set(3, 4, 5);
    this.rim = new THREE.PointLight(0xff9f1c, 25, 24);
    this.rim.position.set(-4, 2.5, -2);
    this.scene.add(this.key, this.rim);

    this.hero = new THREE.Group();
    this.scene.add(this.hero);

    this.cornGeo = makeCornGeometry(5);
    this.cornGeoLow = makeCornGeometry(3);
    this.cornMat = makeCornMaterial();

    this._buildRings();
    this._buildField();
    this._buildOrbit();
    this.resize(true);
    window.addEventListener('resize', () => this.resize());
    window.addEventListener(
      'pointermove',
      (e) => {
        this.state.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
        this.state.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true }
    );
  }

  _buildRings() {
    const f = this.flavors[0];
    const col = (h) => new THREE.Color(h);
    this.ringUniforms = {
      uA: { value: col(f.glow) },
      uB: { value: col(f.glow) },
      uDeepA: { value: col(f.deep) },
      uDeepB: { value: col(f.deep) },
      uMix: { value: 1 },
      uTime: { value: 0 },
      uAspect: { value: 1.6 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.ringUniforms,
      vertexShader: RING_VERT,
      fragmentShader: RING_FRAG,
      depthWrite: false,
      depthTest: false,
    });
    this.rings = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    this.rings.renderOrder = -10;
    this.rings.position.z = -16;
    this.camera.add(this.rings);
  }

  /** Radial blend from the previous flavor colors to the new ones. */
  setTheme(i, instant = false) {
    const f = this.flavors[i];
    const u = this.ringUniforms;
    if (instant) {
      u.uA.value.set(f.glow);
      u.uB.value.set(f.glow);
      u.uDeepA.value.set(f.deep);
      u.uDeepB.value.set(f.deep);
      u.uMix.value = 1;
    } else {
      // current blended look becomes "A" so interrupted transitions stay smooth
      const m = u.uMix.value;
      u.uA.value.lerp(u.uB.value, m >= 1 ? 1 : 0.0);
      u.uDeepA.value.lerp(u.uDeepB.value, m >= 1 ? 1 : 0.0);
      u.uB.value.set(f.glow);
      u.uDeepB.value.set(f.deep);
      u.uMix.value = 0;
      this._mixTween = { t: 0 };
    }
    this.rim.color.set(f.glow);
  }

  _buildField() {
    const COUNT = 120;
    this.field = new THREE.InstancedMesh(this.cornGeoLow, this.cornMat, COUNT);
    this.fieldData = [];
    const rand = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < COUNT; i++) {
      this.fieldData.push({
        p: new THREE.Vector3(rand(-10, 10), rand(-6, 6), rand(-8, -1.2)),
        s: rand(0.05, 0.22),
        r: new THREE.Vector3(rand(0, 6), rand(0, 6), rand(0, 6)),
        v: new THREE.Vector3(rand(-0.4, 0.4), rand(-0.4, 0.4), rand(-0.3, 0.3)),
        ph: rand(0, 6.28),
      });
    }
    for (let i = 0; i < COUNT; i++) this.field.setColorAt(i, CORN_TINTS[Math.floor(Math.random() * CORN_TINTS.length)]);
    this.field.instanceColor.needsUpdate = true;
    this.field.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.field.frustumCulled = false;
    this.fieldGroup = new THREE.Group();
    this.fieldGroup.add(this.field);
    this.scene.add(this.fieldGroup);
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._s = new THREE.Vector3();
  }

  _buildOrbit() {
    this.orbit = new THREE.Group();
    this.orbitCorns = [];
    for (let i = 0; i < 6; i++) {
      const mat = this.cornMat.clone();
      mat.color.copy(CORN_TINTS[i % CORN_TINTS.length]);
      const m = new THREE.Mesh(this.cornGeo, mat);
      const s = 0.08 + (i % 3) * 0.04;
      m.scale.setScalar(s);
      m.userData = { a: (i / 6) * Math.PI * 2, rad: 1.9 + (i % 2) * 0.4, sp: 0.25 + i * 0.03, y: (i - 2.5) * 0.35 };
      this.orbit.add(m);
      this.orbitCorns.push(m);
    }
    this.scene.add(this.orbit);
  }

  async init(onStep) {
    if (document.fonts) {
      try {
        await Promise.all([
          document.fonts.load('900 80px "Archivo Variable"'),
          document.fonts.load('800 40px "Archivo Variable"'),
          document.fonts.load('500 28px "JetBrains Mono Variable"'),
        ]);
      } catch (e) {
        /* fall back to system fonts */
      }
    }
    onStep?.();
    await tick();
    this.crinkle = makeCrinkle();
    if (!this.cornSprites) this.makeCornSprites(); // realistic 3D corns, reused as 2D art on the pouches
    onStep?.();
    await tick();
    for (let i = 0; i < this.n; i++) {
      const tex = makePackTexture(this.flavors[i], this.renderer, this.cornSprites);
      this.textures.push(tex);
      const bag = makeBag(tex, this.crinkle);
      this.bags.push(bag);
      this.hero.add(bag);
      await tick();
      onStep?.();
    }
    this.setTheme(0, true);
    this.update(0.016);
    this.renderer.compile(this.scene, this.camera);
    onStep?.();
    await tick();
  }

  /** Total init steps, for the preloader percentage. */
  get steps() {
    return this.n + 4;
  }

  step(dir) {
    const s = this.state;
    s.target += dir;
    s.idx = (((s.idx + dir) % this.n) + this.n) % this.n;
    this.setTheme(s.idx);
    return s.idx;
  }

  goTo(i) {
    const s = this.state;
    if (i === s.idx) return;
    const d = wrap(i - s.idx, this.n);
    s.target += d;
    s.idx = i;
    this.setTheme(i);
  }

  resize(force) {
    const w = window.innerWidth;
    const h = Math.max(window.innerHeight, document.documentElement.clientHeight);
    // ignore small height changes (mobile URL bar)
    if (!force && Math.abs(w - this.size.w) < 2 && Math.abs(h - this.size.h) < 140) return;
    this.size = { w, h };
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const dist = 16;
    const hh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.rings.scale.set(hh * this.camera.aspect * 1.05, hh * 1.05, 1);
    this.ringUniforms.uAspect.value = this.camera.aspect;
    this.camera.updateProjectionMatrix();
    this.fit = clamp(this.camera.aspect / 1.4, 0.62, 1);
  }

  update(dt) {
    const s = this.state;
    this.time += dt;
    s.cur += (s.target - s.cur) * (1 - Math.exp(-dt * 5));
    s.mouse.sx += (s.mouse.x - s.mouse.sx) * (1 - Math.exp(-dt * 3));
    s.mouse.sy += (s.mouse.y - s.mouse.sy) * (1 - Math.exp(-dt * 3));

    // rings
    if (this._mixTween) {
      this._mixTween.t = Math.min(1, this._mixTween.t + dt / 1.1);
      this.ringUniforms.uMix.value = smooth(this._mixTween.t);
      if (this._mixTween.t >= 1) {
        this.ringUniforms.uA.value.copy(this.ringUniforms.uB.value);
        this.ringUniforms.uDeepA.value.copy(this.ringUniforms.uDeepB.value);
        this._mixTween = null;
      }
    }
    this.ringUniforms.uTime.value = this.time;

    const ts = s.toStory;
    const intro = smooth(clamp(s.intro, 0, 1));
    const fit = this.fit || 1;
    const portrait = this.camera.aspect < 0.9;
    this.hero.scale.setScalar(fit);
    this.hero.position.y = -0.12 * (1 - ts);

    for (let i = 0; i < this.bags.length; i++) {
      const bag = this.bags[i];
      const off = wrap(i - s.cur, this.n);
      const a = Math.abs(off);
      const fade = 1 - smooth(clamp((a - (this.n / 2 - 0.5)) / 0.5, 0, 1));
      const isActive = i === s.idx;
      const act = 1 - Math.min(a, 1);

      // arc layout
      let x = off * 1.9;
      let y = -a * a * 0.07 - a * 0.1;
      let z = -a * 1.25;
      let ry = -off * 0.34 + Math.sin(this.time * 0.7 + i) * 0.08 * act;
      let rx = s.mouse.sy * 0.1 * act;
      let rz = -off * 0.04;
      let sc = (1 - a * 0.2) * fade;
      y += Math.sin(this.time * 1.1 + i * 1.7) * 0.06 * (0.4 + act);
      ry += s.mouse.sx * 0.18 * act;

      // intro: bags rise in
      sc *= intro;
      y -= (1 - intro) * 1.2;

      if (isActive) {
        // story pose
        const sp = s.story;
        const stz = [0, 0, 0];
        const sry = sample(STORY_ROT, sp);
        const srx = sample(STORY_ROT_X, sp);
        const k = smooth(ts);
        x += (stz[0] - x) * k;
        y += (stz[1] + (portrait ? -1.15 : -0.2) - y) * k;
        z += (stz[2] - z) * k;
        ry += (sry - ry) * k;
        rx += (srx - rx) * k;
        rz += (0 - rz) * k;
        sc += ((portrait ? 0.8 : 1.05) * intro - sc) * k;
      } else {
        sc *= 1 - smooth(clamp(ts * 1.6, 0, 1));
        x *= 1 + ts * 0.8;
      }
      bag.position.set(x, y, z);
      bag.rotation.set(rx, ry, rz);
      bag.scale.setScalar(Math.max(0.0001, sc));
      bag.visible = sc > 0.002;
    }

    // camera
    const cam = sample(STORY_CAM, s.story);
    const k = smooth(ts);
    const cx = (cam[0] - 0) * k + s.mouse.sx * 0.15;
    const cy = cam[1] * k - s.mouse.sy * 0.08;
    const cz = 7 + (cam[2] * (portrait ? 1.12 : 1) - 7) * k;
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(cx * 0.2, cy * 0.2, 0);

    // orbiting corns around the active bag
    const ob = this.bags[s.idx];
    this.orbit.visible = !!ob;
    if (ob) {
      this.orbit.position.set(0, this.hero.position.y * fit, 0);
      this.orbit.scale.setScalar(fit * (1 + ts * 0.4) * intro);
      for (const m of this.orbitCorns) {
        const d = m.userData;
        const ang = d.a + this.time * d.sp;
        m.position.set(Math.cos(ang) * (d.rad + 0.3) * 1.05, d.y + Math.sin(this.time + d.a) * 0.12, Math.sin(ang) * d.rad * 0.9 + 0.2);
        m.rotation.set(this.time * 0.6 + d.a, this.time * 0.4, 0);
      }
    }

    // field
    const mt = this._m;
    for (let i = 0; i < this.fieldData.length; i++) {
      const d = this.fieldData[i];
      const px = d.p.x + Math.sin(this.time * 0.3 + d.ph) * 0.35;
      const py = d.p.y + Math.cos(this.time * 0.25 + d.ph) * 0.35;
      this._e.set(d.r.x + this.time * d.v.x, d.r.y + this.time * d.v.y, d.r.z + this.time * d.v.z);
      this._q.setFromEuler(this._e);
      this._s.setScalar(d.s * (0.25 + 0.75 * intro));
      mt.compose(new THREE.Vector3(px, py, d.p.z), this._q, this._s);
      this.field.setMatrixAt(i, mt);
    }
    this.field.instanceMatrix.needsUpdate = true;
    this.fieldGroup.rotation.y = s.mouse.sx * 0.05;
    this.fieldGroup.rotation.x = s.mouse.sy * 0.03;
  }

  render() {
    if (!this.running) return;
    this.renderer.render(this.scene, this.camera);
  }

  frame(dt) {
    if (!this.running) return;
    this.update(Math.min(dt, 0.05));
    this.render();
  }

  _readTarget(rt, w, h, defringe = false) {
    const buf = new Uint8Array(w * h * 4);
    this.renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const src = (h - 1 - y) * w * 4;
      const dst = y * w * 4;
      for (let x = 0; x < w * 4; x += 4) {
        let a = buf[src + x + 3];
        // defringe: keep edge colour premultiplied (darker) instead of un-premultiplying,
        // which leaves a pale halo of "smoke" around every corn
        if (defringe && a < 48) a = 0;
        const k = defringe ? 1 : a > 0 ? 255 / a : 0;
        img.data[dst + x] = Math.min(255, buf[src + x] * k);
        img.data[dst + x + 1] = Math.min(255, buf[src + x + 1] * k);
        img.data[dst + x + 2] = Math.min(255, buf[src + x + 2] * k);
        img.data[dst + x + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  _renderCutout(build, camZ, fov, w, h, lightColor, boost = 1, defringe = false) {
    const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.UnsignedByteType });
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene();
    sc.environment = this.scene.environment;
    sc.environmentIntensity = 1.0;
    const key = new THREE.DirectionalLight(0xffffff, 2.6 * boost);
    key.position.set(3, 4, 5);
    const rim = new THREE.PointLight(lightColor || 0xffffff, 30 * boost, 24);
    rim.position.set(-4, 2.5, -2);
    sc.add(key, rim);
    const obj = build();
    sc.add(obj);
    const cam = new THREE.PerspectiveCamera(fov, w / h, 0.1, 50);
    cam.position.set(0, 0, camZ);
    this.renderer.setRenderTarget(rt);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(sc, cam);
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(0x0a0605, 1);
    const canvas = this._readTarget(rt, w, h, defringe);
    rt.dispose();
    return canvas;
  }

  /** Transparent PNG of the real 3D bag. */
  cutoutBag(i, w = 900, h = 1350) {
    return this._cutoutBagCanvas(i, w, h).toDataURL('image/png');
  }

  /** Several differently-rotated, realistically lit peppercorn sprites (canvases). */
  makeCornSprites(count = 5, size = 320) {
    const rots = [
      [0.5, 0.8, 0.1],
      [1.9, 2.4, 0.5],
      [-0.7, 4.0, 1.1],
      [2.8, 1.1, 2.0],
      [0.1, 5.2, 0.4],
    ];
    const out = [];
    for (let i = 0; i < count; i++) {
      const r = rots[i % rots.length];
      out.push(
        this._renderCutout(
          () => {
            const mat = this.cornMat.clone();
            mat.color.copy(CORN_TINTS[i % CORN_TINTS.length]);
            const m = new THREE.Mesh(this.cornGeo, mat);
            m.rotation.set(r[0], r[1], r[2]);
            return m;
          },
          5.4,
          30,
          size,
          size,
          0xffd9a8,
          1.0,
          true
        )
      );
    }
    this.cornSprites = out;
    return out;
  }

  _cutoutBagCanvas(i, w, h) {
    return this._renderCutout(
      () => {
        const bag = makeBag(this.textures[i], this.crinkle);
        bag.rotation.set(0.02, -0.34, 0.03);
        return bag;
      },
      6.5,
      28,
      w,
      h,
      this.flavors[i].glow
    );
  }

  cutoutCorn() {
    return (this.cornSprites?.[0] || this.makeCornSprites()[0]).toDataURL('image/png');
  }
}
