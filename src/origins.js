import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROFILE_KEYS, MONTHS } from './data.js';
import { makeHeapBanner } from './textures.js';
import { toast } from './shop.js';

gsap.registerPlugin(ScrollTrigger);
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Builds the storytelling chapter for each origin (farm, story, facts, taste, calendar, pairings). */
export function buildOrigins({ flavors, cutouts, sprites, shop }) {
  const list = document.getElementById('originList');
  list.innerHTML = flavors
    .map((f, i) => {
      const heap = makeHeapBanner(sprites, f).toDataURL('image/png');
      const bars = PROFILE_KEYS.map(
        (k) => `<li><span>${k}</span><div class="bar"><i data-v="${f.profile[k]}"></i></div><b>${f.profile[k]}</b></li>`
      ).join('');
      const cal = MONTHS.map((m, k) => `<li class="${f.harvest.includes(k + 1) ? 'on' : ''}" title="${f.harvest.includes(k + 1) ? 'Harvest' : ''}">${m}</li>`).join('');
      const facts = f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      return `
      <article class="origin ${i % 2 ? 'flip' : ''}" id="origin-${i}" style="--oc:${f.color};--od:${f.deep};--oi:${f.ink};--og:${f.glow}">
        <div class="o-top">
          <div class="o-media">
            <span class="o-num">0${i + 1}</span>
            <img class="o-heap" src="${heap}" alt="" draggable="false" />
            <img class="o-bag" src="${cutouts[i]}" alt="${f.name} pouch" draggable="false" />
            <div class="o-badge"><b>${f.farm}</b><span>${f.coords} &middot; ${f.elevation} elevation</span></div>
          </div>
          <div class="o-copy">
            <p class="kicker">Origin 0${i + 1} &mdash; ${f.origin}</p>
            <h3>${f.name}<em>${f.line}</em></h3>
            <p class="o-lede">${f.lede}</p>
            <div class="o-story">${f.story.map((p) => `<p>${p}</p>`).join('')}</div>
            <blockquote><p>${f.quote}</p><cite>${f.farmer}</cite></blockquote>
          </div>
        </div>
        <div class="o-data">
          <div class="o-box"><h4>In numbers</h4><dl class="o-facts">${facts}</dl></div>
          <div class="o-box"><h4>Taste profile</h4><ul class="o-bars">${bars}</ul></div>
          <div class="o-box"><h4>Harvest season</h4><ul class="o-cal">${cal}</ul>
            <p class="o-note">Harvest: ${f.harvest.map((m) => MONTH_NAMES[m - 1]).join(' \u00b7 ')}. Hand-picked and sun-dried by ${f.farmer}.</p></div>
          <div class="o-box"><h4>Pairs with</h4><ul class="o-pair">${f.pair.map((p) => `<li>${p}</li>`).join('')}</ul>
            <p class="o-tip"><b>How to use</b>${f.tip}</p></div>
        </div>
        <div class="o-cta"><button class="cta" data-i="${i}">Add ${f.name} to box &mdash; $${f.price}</button></div>
      </article>`;
    })
    .join('');

  list.querySelectorAll('.o-cta .cta').forEach((btn) =>
    btn.addEventListener('click', () => {
      const i = +btn.dataset.i;
      const bag = btn.closest('.origin').querySelector('.o-bag').getBoundingClientRect();
      const ok = shop.add(i, { left: bag.left + bag.width * 0.2, top: bag.top + bag.height * 0.1, width: bag.width * 0.6, height: bag.height * 0.8 });
      if (ok) toast(`${flavors[i].name} added to your box`);
    })
  );

  // scroll storytelling
  list.querySelectorAll('.origin').forEach((el) => {
    const bag = el.querySelector('.o-bag');
    const heap = el.querySelector('.o-heap');
    gsap.fromTo(bag, { yPercent: 14, rotate: -4 }, { yPercent: -8, rotate: 3, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    gsap.fromTo(heap, { scale: 0.85, yPercent: 8 }, { scale: 1.05, yPercent: -4, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });

    const reveal = (targets, vars = {}) =>
      gsap.from(targets, { y: 36, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', ...vars, scrollTrigger: { trigger: vars.trigger || el, start: vars.start || 'top 70%', once: true } });
    reveal(el.querySelectorAll('.o-copy > *'), { start: 'top 65%' });
    el.querySelectorAll('.o-box').forEach((box) => {
      gsap.from(box, { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: box, start: 'top 88%', once: true } });
    });
    el.querySelectorAll('.bar i').forEach((bar) => {
      const v = +bar.dataset.v;
      gsap.fromTo(bar, { scaleX: 0 }, { scaleX: v / 5, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: bar, start: 'top 92%', once: true } });
    });
    gsap.from(el.querySelectorAll('.o-cal li.on'), { scale: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(3)', scrollTrigger: { trigger: el.querySelector('.o-cal'), start: 'top 92%', once: true } });
  });
}
