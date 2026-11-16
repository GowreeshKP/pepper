import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { GRADES, CHAPTERS } from './data.js';
import { Experience } from './scene.js';
import { Preloader } from './preloader.js';
import { initGrades } from './grades.js';
import { buildSections } from './sections.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = (s, r = document) => r.querySelector(s);
const root = document.documentElement;
const N = GRADES.length;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- smooth scroll (kept stopped until the loader ends) ----------
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
lenis.stop();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const t = document.querySelector(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  lenis.scrollTo(t, { offset: 0, duration: 1.6 });
});

// ---------- boot ----------
const loader = new Preloader();
const exp = new Experience($('#gl'), GRADES);
if (import.meta.env.DEV) window.__exp = exp;

let done = 0;
const total = exp.steps + 2; // + cutouts + build
const step = () => loader.set((++done / total) * 100);

boot().catch((err) => {
  console.error(err);
  loader.finish();
});

async function boot() {
  const started = performance.now();
  loader.useSprites(exp.makeCornSprites());
  await exp.init(step);

  const cutouts = [];
  for (let i = 0; i < N; i++) cutouts.push(exp.cutoutBag(i));
  const cornImg = exp.cutoutCorn();
  step();

  initGrades({ grades: GRADES, cutouts, lenis });
  buildSections({ sprites: exp.cornSprites, gradeA: GRADES[0] });
  buildHero();
  buildStory();
  buildStorm(cornImg);
  buildCanvasRide();
  step();

  const wait = Math.max(0, 2200 - (performance.now() - started));
  await new Promise((r) => setTimeout(r, wait));

  gsap.ticker.add((time, dt) => exp.frame(dt / 1000));
  ScrollTrigger.refresh();
  await loader.finish();
  intro();
}

// ---------- hero: headline + grade carousel ----------
function buildHero() {
  const dots = $('#dots');
  dots.innerHTML = GRADES.map((g, i) => `<button aria-label="${g.tier}" data-i="${i}"></button>`).join('');

  let busy = false;
  const apply = (i, first = false) => {
    const g = GRADES[i];
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    gsap.to(root, { '--c': g.color, '--deep': g.deep, '--glow': g.glow, '--ink': g.ink, duration: first ? 0 : 0.9, ease: 'power2.out' });
    const swap = () => {
      $('#gTier').textContent = g.tier;
      $('#gName').textContent = g.name;
    };
    if (first) return swap();
    gsap
      .timeline()
      .to('.grade-now b, .grade-now span', { y: -10, opacity: 0, duration: 0.22, stagger: 0.04 })
      .add(swap)
      .fromTo('.grade-now b, .grade-now span', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
  };
  apply(0, true);

  const go = (dir) => {
    if (busy || exp.state.toStory > 0.05) return;
    busy = true;
    apply(exp.step(dir));
    setTimeout(() => (busy = false), 600);
    resetAuto();
  };
  const goTo = (i) => {
    if (busy || i === exp.state.idx) return;
    busy = true;
    exp.goTo(i);
    apply(i);
    setTimeout(() => (busy = false), 700);
    resetAuto();
  };
  $('#next').addEventListener('click', () => go(1));
  $('#prev').addEventListener('click', () => go(-1));
  dots.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) goTo(+b.dataset.i);
  });
  window.addEventListener('keydown', (e) => {
    if (window.scrollY > window.innerHeight * 0.6) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });

  // drag / swipe
  let sx = null;
  let sy = 0;
  $('#hero').addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return;
    sx = e.clientX;
    sy = e.clientY;
  });
  window.addEventListener('pointerup', (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  });

  let auto;
  function resetAuto() {
    clearInterval(auto);
    auto = setInterval(() => {
      if (window.scrollY < window.innerHeight * 0.3 && !document.hidden) go(1);
    }, 5200);
  }
  resetAuto();
}

// ---------- genesis: pinned scroll chapters ----------
function buildStory() {
  const wrap = $('#chapters');
  wrap.innerHTML = CHAPTERS.map(
    (c, i) => `
    <article class="chapter ${i % 2 ? 'right' : 'left'}${i === 0 ? ' on' : ''}">
      <div class="copy"><span class="num">0${i + 1} / 04</span><h2>${c.title}</h2><p>${c.text}</p></div>
      <div class="hotspot"><i></i><span>${c.spot}</span></div>
    </article>`
  ).join('');
  const chapters = [...wrap.children];
  $('#cbTicks').innerHTML = CHAPTERS.map((_, i) => `<li class="${i === 0 ? 'on' : ''}">0${i + 1}</li>`).join('');
  const ticks = [...$('#cbTicks').children];
  let cur = 0;

  ScrollTrigger.create({
    trigger: '#story',
    start: 'top top',
    end: '+=420%',
    pin: true,
    scrub: 0.6,
    onUpdate: (s) => {
      exp.state.story = s.progress;
      const i = Math.min(CHAPTERS.length - 1, Math.floor(s.progress * CHAPTERS.length));
      gsap.set('#cbFill', { scaleX: s.progress });
      if (i !== cur) {
        cur = i;
        chapters.forEach((c, k) => c.classList.toggle('on', k === i));
        ticks.forEach((t, k) => t.classList.toggle('on', k === i));
        $('#storyWord').textContent = CHAPTERS[i].word;
        $('#cbLabel').textContent = `0${i + 1} \u2014 ${CHAPTERS[i].title}`;
        gsap.fromTo('#storyWord', { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 0.4, duration: 0.7, ease: 'power3.out' });
      }
    },
  });
}

/**
 * The one WebGL canvas is fixed behind the page. The opaque "crisis" section slides over it, then the
 * canvas slides back up with the genesis section, then rides away under the grades section.
 */
function buildCanvasRide() {
  const gl = $('#gl');
  const problem = $('#problem');
  const story = $('#story');
  const grades = $('#grades');
  const layout = () => {
    const vh = window.innerHeight;
    const pTop = problem.getBoundingClientRect().top;
    const sTop = story.getBoundingClientRect().top;
    const gTop = grades.getBoundingClientRect().top;
    const toStory = clamp((vh - pTop) / vh, 0, 1);
    exp.state.toStory = Math.max(toStory, sTop < vh ? 1 : 0);
    let y = 0;
    let visible = true;
    if (gTop < vh) {
      // leaving: ride up with the grades section
      const p = clamp((vh - gTop) / vh, 0, 1);
      y = -p * vh;
      visible = p < 0.999;
    } else if (sTop < vh) {
      // genesis arriving from below (or pinned)
      y = Math.max(0, sTop);
    } else if (pTop <= 0) {
      visible = false; // fully covered by the crisis section
    } else {
      y = -toStory * vh; // hero scrolling away
    }
    exp.running = visible;
    gsap.set(gl, { y });
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: layout, onRefresh: layout });
  window.addEventListener('resize', layout);
  layout();
}

// ---------- closing storm ----------
function buildStorm(cornImg) {
  const field = $('#stormField');
  const COUNT = window.innerWidth < 760 ? 26 : 44;
  const items = [];
  for (let i = 0; i < COUNT; i++) {
    const img = document.createElement('img');
    img.src = cornImg;
    img.alt = '';
    const s = 24 + Math.random() * 110;
    img.style.width = s + 'px';
    img.style.left = Math.random() * 100 + '%';
    img.style.top = Math.random() * 100 + '%';
    field.appendChild(img);
    items.push({ img, s });
  }
  items.forEach(({ img, s }) => {
    const depth = s / 134;
    gsap.fromTo(
      img,
      { x: () => -window.innerWidth * 0.3 * (0.4 + depth), y: () => window.innerHeight * 0.4 * (0.5 + depth), rotate: Math.random() * 180 },
      {
        x: () => window.innerWidth * 0.4 * (0.4 + depth),
        y: () => -window.innerHeight * 0.5 * (0.5 + depth),
        rotate: `+=${200 + Math.random() * 300}`,
        ease: 'none',
        scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'bottom top', scrub: 0.5 + depth },
      }
    );
  });
  gsap.from('.cta-inner > *', {
    y: 50,
    opacity: 0,
    stagger: 0.12,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#cta', start: 'top 55%', once: true },
  });
}

// ---------- intro ----------
function intro() {
  lenis.start();
  const tl = gsap.timeline();
  tl.to('#nav', { opacity: 1, duration: 0.8 }, 0)
    .to(exp.state, { intro: 1, duration: 1.8, ease: 'power3.out' }, 0)
    .fromTo('#heroTitle .in', { yPercent: 115 }, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out' }, 0.2)
    .from('.hero-head .kicker, #heroBlurb, #heroCta, .hero-ctrl', { y: 22, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0.5);
}
