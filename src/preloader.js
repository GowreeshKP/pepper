import gsap from 'gsap';
import { makeCornSprite, rng } from './textures.js';

/** Chip-storm style loader: peppercorns rain, the hero corn spins, gets seasoned, then bursts. */
export class Preloader {
  constructor() {
    this.root = document.getElementById('preloader');
    this.canvas = document.getElementById('storm');
    this.ctx = this.canvas.getContext('2d');
    this.pct = document.getElementById('plPct');
    this.corn = this.root.querySelector('.pl-corn');
    this.sprites = [makeCornSprite(96, 3), makeCornSprite(96, 11), makeCornSprite(96, 29)];
    this.mode = 'rain';
    this.value = 0;
    this.shown = 0;
    this.parts = [];
    this.flecks = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    const r = rng(5);
    for (let i = 0; i < 70; i++) {
      this.parts.push({
        x: r() * this.w,
        y: r() * this.h,
        s: 8 + r() * 26,
        v: 120 + r() * 260,
        rot: r() * 6,
        vr: (r() - 0.5) * 3,
        sp: Math.floor(r() * 3),
        a: 0.25 + r() * 0.6,
        vx: 0,
        vy: 0,
      });
    }
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  /** Swap in the realistic 3D-rendered corns for the rain and the hero corn. */
  useSprites(canvases) {
    this.sprites = canvases;
    const img = new Image();
    img.src = canvases[1].toDataURL('image/png');
    img.alt = '';
    img.className = 'pl-corn-img';
    this.corn.classList.add('real');
    this.corn.prepend(img);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  set(v) {
    this.value = Math.max(this.value, Math.min(100, v));
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    // ease displayed percentage
    this.shown += (this.value - this.shown) * (1 - Math.exp(-dt * 6));
    this.pct.textContent = Math.round(this.shown);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const cx = this.w / 2;
    const cy = this.h / 2 - 20;
    for (const p of this.parts) {
      if (this.mode === 'rain') {
        p.y += p.v * dt;
        p.rot += p.vr * dt;
        if (p.y > this.h + 40) {
          p.y = -40;
          p.x = Math.random() * this.w;
        }
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt * 2;
      }
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(this.sprites[p.sp], -p.s / 2, -p.s / 2, p.s, p.s);
      ctx.restore();
    }
    // seasoning flecks
    for (const f of this.flecks) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vy += 500 * dt;
      f.life -= dt;
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = '#f2e6d6';
      ctx.fillRect(f.x, f.y, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
    this.flecks = this.flecks.filter((f) => f.life > 0);
    this._cx = cx;
    this._cy = cy;
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  season() {
    const r = this.corn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < 60; i++) {
      this.flecks.push({
        x: cx + (Math.random() - 0.5) * r.width * 0.8,
        y: cy - r.height * 0.9 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 80,
        vy: 40 + Math.random() * 120,
        life: 0.8 + Math.random() * 0.6,
      });
    }
  }

  burst() {
    const r = this.corn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    this.mode = 'burst';
    for (const p of this.parts) {
      const a = Math.atan2(p.y - cy, p.x - cx) + (Math.random() - 0.5) * 0.4;
      const sp = 500 + Math.random() * 900;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.a = 1;
    }
  }

  finish() {
    this.set(100);
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to({}, { duration: 0.45 }) // let % reach 100
        .to(this.corn, { rotate: 360, duration: 0.9, ease: 'power2.inOut' }, 0.3)
        .add(() => this.season(), 0.5)
        .to(this.corn, { scale: 1.18, duration: 0.35, ease: 'back.out(3)' }, 1.0)
        .add(() => this.burst(), 1.25)
        .to(this.corn, { scale: 7, opacity: 0, duration: 0.55, ease: 'power3.in' }, 1.25)
        .to('.pl-pct, .pl-label', { opacity: 0, y: -20, duration: 0.3 }, 1.2)
        .add(() => resolve(), 1.55) // reveal page while overlay lifts
        .to(this.root, { yPercent: -100, duration: 0.85, ease: 'power4.inOut' }, 1.55)
        .add(() => {
          cancelAnimationFrame(this.raf);
          this.root.remove();
        });
    });
  }
}
