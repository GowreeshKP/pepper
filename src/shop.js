import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { GRINDS } from './data.js';

gsap.registerPlugin(Draggable, InertiaPlugin);

const $ = (s, r = document) => r.querySelector(s);
const BOX_SIZE = 3;
const BOX_PRICE = 24;

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  gsap.killTweensOf(t);
  gsap.fromTo(t, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
  gsap.to(t, { y: 20, opacity: 0, duration: 0.3, delay: 2, ease: 'power2.in' });
}

function heatPips(n) {
  return Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
}

export function initShop({ flavors, cutouts, cornImg }) {
  const box = []; // flavor indices
  const slots = [...document.querySelectorAll('.slot')];
  const countEl = $('#basketCount');
  const dots = $('#boxDots');
  const priceEl = $('#boxPrice');
  const checkout = $('#checkout');
  const tray = $('#tray');
  const basketBtn = $('#basketBtn');

  dots.innerHTML = Array.from({ length: BOX_SIZE }, () => '<i></i>').join('');

  function renderBox(animateIdx = -1) {
    slots.forEach((s, i) => {
      const f = box[i] != null ? flavors[box[i]] : null;
      s.classList.toggle('full', !!f);
      s.style.setProperty('--sc', f ? f.color : 'transparent');
      s.innerHTML = f
        ? `<img src="${cutouts[box[i]]}" alt="${f.name}"/><span class="slot-name">${f.name}</span><span class="slot-x" aria-hidden="true">\u00d7</span>`
        : `<span class="slot-n">${i + 1}</span>`;
      if (i === animateIdx) {
        gsap.fromTo(s.querySelector('img'), { scale: 0.6, y: -30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2.2)' });
      }
    });
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i < box.length));
    countEl.textContent = box.length;
    const full = box.length === BOX_SIZE;
    checkout.disabled = !full;
    checkout.textContent = full ? `Checkout \u2014 $${BOX_PRICE}` : `Pick ${BOX_SIZE - box.length} more`;
    priceEl.textContent = box.length ? `$${full ? BOX_PRICE : box.reduce((a, i) => a + flavors[i].price, 0)}` : '$0';
    basketBtn.classList.toggle('full', full);
  }

  function fly(src, from, to, done) {
    const el = document.createElement('img');
    el.src = src;
    el.className = 'fly';
    document.body.appendChild(el);
    const w = from.width || 80;
    gsap.set(el, { left: from.left, top: from.top, width: w, height: from.height || w * 1.5, opacity: 1 });
    gsap.to(el, {
      left: to.left + to.width / 2 - (to.width * 0.7) / 2,
      top: to.top + to.height / 2 - (to.height * 0.7) / 2,
      width: to.width * 0.7,
      height: to.height * 0.7,
      rotate: 12,
      duration: 0.75,
      ease: 'power3.inOut',
      onComplete: () => {
        el.remove();
        done?.();
      },
    });
  }

  function add(i, fromRect) {
    if (box.length >= BOX_SIZE) {
      toast('Your box is full. Tap a slot to swap one out.');
      gsap.fromTo(tray, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2,0.3)' });
      return false;
    }
    const slotIdx = box.length;
    const slot = slots[slotIdx];
    const inView = (() => {
      const r = slot.getBoundingClientRect();
      return r.top > 0 && r.bottom < window.innerHeight;
    })();
    const target = inView ? slot.getBoundingClientRect() : basketBtn.getBoundingClientRect();
    box.push(i);
    if (fromRect) {
      fly(cutouts[i], fromRect, target, () => {
        renderBox(slotIdx);
        gsap.fromTo(basketBtn, { scale: 1.18 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      });
      // count/dots update at once so the UI feels responsive
      countEl.textContent = box.length;
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k < box.length));
    } else {
      renderBox(slotIdx);
    }
    return true;
  }

  function remove(slotIdx) {
    if (box[slotIdx] == null) return;
    box.splice(slotIdx, 1);
    renderBox();
  }

  slots.forEach((s, i) => s.addEventListener('click', () => remove(i)));

  // WALL
  const wall = $('#wallGrid');
  wall.innerHTML = flavors
    .map(
      (f, i) => `
    <article class="card" data-i="${i}" style="--cc:${f.color};--ci:${f.ink};--cg:${f.glow}">
      <div class="card-stage">
        <span class="card-num">0${i + 1}</span>
        <img class="card-corn c1" src="${cornImg}" alt="" />
        <img class="card-corn c2" src="${cornImg}" alt="" />
        <img class="card-corn c3" src="${cornImg}" alt="" />
        <img class="card-bag" src="${cutouts[i]}" alt="${f.name} pepper pouch" draggable="false" />
      </div>
      <div class="card-body">
        <div><h3>${f.name}</h3><p>${f.origin}</p></div>
        <div class="heat sm">${heatPips(f.heat)}</div>
      </div>
      <p class="card-lede">${f.lede}</p>
      <div class="card-foot"><div class="price-col"><span class="price">$${f.price}</span><a class="story-link" href="#origin-${i}">Read story &rarr;</a></div><button class="add" data-i="${i}">+ Add</button></div>
    </article>`
    )
    .join('');

  wall.querySelectorAll('.card').forEach((card) => {
    const corns = card.querySelectorAll('.card-corn');
    const bag = card.querySelector('.card-bag');
    card.addEventListener('pointerenter', () => {
      gsap.to(corns, { y: (i) => [-34, -52, -26][i], x: (i) => [-34, 28, 4][i], rotate: (i) => [-30, 40, 12][i], scale: 1, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'back.out(2)' });
      gsap.to(bag, { y: -8, rotate: -2, duration: 0.5, ease: 'power3.out' });
    });
    card.addEventListener('pointerleave', () => {
      gsap.to(corns, { y: 20, x: 0, scale: 0.4, opacity: 0, duration: 0.35, ease: 'power2.in' });
      gsap.to(bag, { y: 0, rotate: 0, duration: 0.5, ease: 'power3.out' });
    });
    gsap.set(corns, { y: 20, scale: 0.4, opacity: 0 });
    card.querySelector('.add').addEventListener('click', (e) => {
      const r = bag.getBoundingClientRect();
      add(+e.currentTarget.dataset.i, { left: r.left + r.width * 0.2, top: r.top + r.height * 0.1, width: r.width * 0.6, height: r.height * 0.8 });
    });
  });

  // CHECKOUT
  const modal = $('#modal');
  checkout.addEventListener('click', () => {
    if (box.length < BOX_SIZE) return;
    $('#modalList').innerHTML = box.map((i) => `<li><img src="${cutouts[i]}" alt=""/><span>${flavors[i].name}<small>${flavors[i].line}</small></span></li>`).join('');
    modal.classList.add('open');
    gsap.fromTo('.modal-card', { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
  });
  const closeModal = () => {
    modal.classList.remove('open');
    box.length = 0;
    renderBox();
  };
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // RACK
  const track = $('#rackTrack');
  track.innerHTML = flavors
    .map(
      (f, i) => `
    <article class="jar" style="--cc:${f.color};--ci:${f.ink}" data-i="${i}">
      <header><span>0${i + 1}</span><span>${f.origin}</span></header>
      <div class="jar-art"><img src="${cutouts[i]}" alt="" draggable="false"/></div>
      <h3>${f.name}</h3>
      <p class="jar-notes">${f.notes.join(' \u00b7 ')}</p>
      <div class="seg" role="radiogroup" aria-label="Grind">
        <i class="seg-thumb"></i>
        ${GRINDS.map((g, k) => `<button role="radio" aria-checked="${k === 0}" data-k="${k}" class="${k === 0 ? 'on' : ''}">${g}</button>`).join('')}
      </div>
      <div class="grind-vis" data-k="0">${Array.from({ length: 24 }, () => '<b></b>').join('')}</div>
      <footer><div class="heat sm">${heatPips(f.heat)}</div><button class="add" data-i="${i}">+ Add</button></footer>
    </article>`
    )
    .join('');

  track.querySelectorAll('.jar').forEach((jar) => {
    const thumb = jar.querySelector('.seg-thumb');
    const btns = [...jar.querySelectorAll('.seg button')];
    const vis = jar.querySelector('.grind-vis');
    const setGrind = (k) => {
      btns.forEach((b, j) => {
        b.classList.toggle('on', j === k);
        b.setAttribute('aria-checked', j === k);
      });
      const b = btns[k];
      gsap.to(thumb, { xPercent: k * 100, duration: 0.5, ease: 'elastic.out(1,0.7)' });
      vis.dataset.k = k;
      const sizes = [14, 8, 3];
      gsap.to(vis.children, { width: sizes[k], height: sizes[k], duration: 0.5, ease: 'back.out(2)', stagger: { each: 0.008, from: 'random' } });
    };
    btns.forEach((b, k) => b.addEventListener('click', () => setGrind(k)));
    setGrind(0);
    jar.addEventListener('pointerenter', () => gsap.to(jar.querySelector('.jar-art img'), { y: -8, rotate: -3, duration: 0.5, ease: 'power3.out' }));
    jar.addEventListener('pointerleave', () => gsap.to(jar.querySelector('.jar-art img'), { y: 0, rotate: 0, duration: 0.5, ease: 'power3.out' }));
    jar.querySelector('.add').addEventListener('click', (e) => {
      const img = jar.querySelector('.jar-art img').getBoundingClientRect();
      add(+e.currentTarget.dataset.i, { left: img.left + img.width * 0.2, top: img.top + img.height * 0.1, width: img.width * 0.6, height: img.height * 0.8 });
    });
  });

  const vp = $('#rackVp');
  const bar = $('#rackBar');
  const getMin = () => Math.min(0, vp.clientWidth - track.scrollWidth - 0);
  const drag = Draggable.create(track, {
    type: 'x',
    bounds: { minX: getMin(), maxX: 0 },
    inertia: true,
    edgeResistance: 0.8,
    onDrag: updateBar,
    onThrowUpdate: updateBar,
    cursor: 'grab',
    activeCursor: 'grabbing',
  })[0];
  function updateBar() {
    const min = getMin();
    const p = min === 0 ? 0 : gsap.getProperty(track, 'x') / min;
    gsap.set(bar, { scaleX: 0.15 + Math.min(1, Math.max(0, p)) * 0.85 });
  }
  window.addEventListener('resize', () => {
    drag.applyBounds({ minX: getMin(), maxX: 0 });
    updateBar();
  });
  updateBar();

  renderBox();

  return { add, flavors };
}
