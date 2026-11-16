import gsap from 'gsap';
import { WEIGHTS } from './data.js';

const $ = (s, r = document) => r.querySelector(s);

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  gsap.killTweensOf(t);
  gsap.fromTo(t, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
  gsap.to(t, { y: 20, opacity: 0, duration: 0.3, delay: 2.2, ease: 'power2.in' });
}

const fmt = (g) => (g >= 1000 && g % 1000 === 0 ? `${g / 1000} kg` : `${g} g`);

/** Grade cards with per-card gram selector, plus the inquiry modal that every CTA opens. */
export function initGrades({ grades, cutouts, lenis }) {
  const grid = $('#gradeGrid');
  const state = grades.map(() => ({ grams: 250 }));

  grid.innerHTML = grades
    .map(
      (g, i) => `
    <article class="gcard" data-i="${i}" style="--gc:${g.color};--gi:${g.ink};--gg:${g.glow}">
      <div class="g-stage">
        <span class="g-tier">${g.tier}</span>
        <img class="g-bag" src="${cutouts[i]}" alt="${g.name} pouch" draggable="false" />
      </div>
      <div class="g-body">
        <h3>${g.name}</h3>
        <p class="g-tag">${g.tag}</p>
        <p class="g-profile">${g.profile}</p>
        <ul class="g-points">${g.points.map((p) => `<li>${p}</li>`).join('')}</ul>
        <div class="g-best"><b>Best suited for</b><p>${g.best}</p></div>
        <div class="g-weights" role="radiogroup" aria-label="Quantity">
          ${WEIGHTS.map((w) => `<button role="radio" data-g="${w}" aria-checked="${w === 250}" class="${w === 250 ? 'on' : ''}">${fmt(w)}</button>`).join('')}
          <label class="g-custom"><input type="number" min="50" step="50" placeholder="Custom g" aria-label="Custom grams" /></label>
        </div>
        <button class="cta g-cta" data-i="${i}">Inquire &middot; <span class="g-sel">250 g</span></button>
      </div>
    </article>`
    )
    .join('');

  grid.querySelectorAll('.gcard').forEach((card) => {
    const i = +card.dataset.i;
    const sel = $('.g-sel', card);
    const chips = [...card.querySelectorAll('.g-weights button')];
    const custom = $('.g-custom input', card);
    const set = (grams, fromChip) => {
      state[i].grams = grams;
      sel.textContent = fmt(grams);
      chips.forEach((c) => {
        const on = fromChip && +c.dataset.g === grams;
        c.classList.toggle('on', on);
        c.setAttribute('aria-checked', on);
      });
      if (fromChip) custom.value = '';
    };
    chips.forEach((c) =>
      c.addEventListener('click', () => {
        set(+c.dataset.g, true);
        gsap.fromTo(c, { scale: 0.92 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
      })
    );
    custom.addEventListener('input', () => {
      const v = Math.max(0, Math.round(+custom.value));
      if (v >= 50) set(v, false);
      if (v >= 50) chips.forEach((c) => (c.classList.remove('on'), c.setAttribute('aria-checked', false)));
    });
    $('.g-cta', card).addEventListener('click', () => open(i, state[i].grams));

    // tactile hover on the pouch
    const bag = $('.g-bag', card);
    card.addEventListener('pointerenter', () => gsap.to(bag, { y: -10, rotate: -2.5, duration: 0.5, ease: 'power3.out' }));
    card.addEventListener('pointerleave', () => gsap.to(bag, { y: 0, rotate: 0, duration: 0.6, ease: 'power3.out' }));
  });

  // inquiry modal
  const modal = $('#modal');
  const form = $('#inquiryForm');
  const done = $('#modalDone');
  const err = $('#fErr');
  const gradeSel = $('#fGrade');
  const gramsIn = $('#fGrams');
  gradeSel.innerHTML = grades.map((g, i) => `<option value="${i}">${g.tier} \u2014 ${g.name}</option>`).join('');

  function open(i = 0, grams = 250) {
    gradeSel.value = i;
    gramsIn.value = grams;
    form.hidden = false;
    done.hidden = true;
    err.hidden = true;
    modal.classList.add('open');
    lenis?.stop();
    gsap.fromTo('.modal-card', { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
    setTimeout(() => form.elements.name.focus(), 350);
  }
  function close() {
    modal.classList.remove('open');
    lenis?.start();
  }
  $('#modalClose').addEventListener('click', close);
  $('#doneClose').addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const contact = form.elements.contact.value.trim();
    if (!name || !contact) {
      err.hidden = false;
      return;
    }
    const g = grades[+gradeSel.value];
    const grams2 = Math.max(50, Math.round(+gramsIn.value || 250));
    $('#doneText').textContent = `Thanks, ${name}. We have noted ${fmt(grams2)} of ${g.tier} (${g.name}). Nothing was actually sent: this is a demo, but in the live site this is where your batch would be reserved.`;
    form.hidden = true;
    done.hidden = false;
    gsap.from(done.children, { y: 20, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' });
    form.reset();
  });

  ['#navInquire', '#ctaInquire'].forEach((s) => $(s).addEventListener('click', () => open(0, 250)));

  return { open };
}
