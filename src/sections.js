import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CRISIS, PROCESS } from './data.js';
import { makeHeapBanner, makeAdulteratedBanner } from './textures.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);

const ICONS = {
  route: '<path d="M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 17h6a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h6" />',
  drop: '<path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3Z" /><path d="M9.5 14a2.6 2.6 0 0 0 2.5 2.6" />',
  flask: '<path d="M9 3h6M10 3v6L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 9V3" /><path d="M7.5 15h9" />',
  pack: '<path d="M4 8l8-4 8 4v9l-8 4-8-4V8Z" /><path d="M4 8l8 4 8-4M12 12v9" />',
};

/** Section 2 (the problem) and section 5 (the process). */
export function buildSections({ sprites, gradeA }) {
  // contrast visuals
  $('#vsBad').src = makeAdulteratedBanner(sprites).toDataURL('image/png');
  $('#vsGood').src = makeHeapBanner(sprites, gradeA).toDataURL('image/png');

  $('#crisisList').innerHTML = CRISIS.map(
    (c) => `
    <article class="crisis-card">
      <span class="c-n">${c.n}</span>
      <h3>${c.title}</h3>
      <p>${c.text}</p>
      <span class="c-stat">${c.stat}</span>
    </article>`
  ).join('');

  $('#processGrid').innerHTML = PROCESS.map(
    (p, i) => `
    <article class="process-card">
      <div class="p-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[p.icon]}</svg></div>
      <span class="p-n">0${i + 1}</span>
      <h3>${p.title}</h3>
      <p>${p.text}</p>
    </article>`
  ).join('');

  // scroll reveals
  const rise = (targets, trigger, start = 'top 82%') =>
    gsap.from(targets, { y: 44, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger, start, once: true } });
  rise('#problem .sec-head > *', '#problem .sec-head', 'top 78%');
  rise('.vs', '.versus', 'top 82%');
  rise('.crisis-card', '#crisisList', 'top 85%');
  rise('.pledge > *', '.pledge', 'top 88%');
  rise('#grades .sec-head > *', '#grades .sec-head', 'top 80%');
  rise('.gcard', '#gradeGrid', 'top 85%');
  rise('#process .sec-head > *', '#process .sec-head', 'top 80%');
  rise('.process-card', '#processGrid', 'top 88%');

  // slow drift on the contrast images
  gsap.fromTo('.vs img', { scale: 0.94 }, { scale: 1.04, ease: 'none', scrollTrigger: { trigger: '.versus', start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
}
