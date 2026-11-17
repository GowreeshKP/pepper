// Scroll-linked animation layer.
// Everything here reacts continuously to scroll position (not just one-shot reveals).
// Skipped entirely when reduced motion is active (html.reduce-motion, set in <head>).
(function () {
  if (document.documentElement.classList.contains('reduce-motion')) return;

  var vh = window.innerHeight;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* ------------------------------------------------------------
     1 · Headlines: each word slides up out of a mask
  ------------------------------------------------------------ */
  $all('h2.reveal').forEach(function (h) {
    var text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    h.innerHTML = text.split(/\s+/).map(function (w, i) {
      return '<span class="hw" aria-hidden="true"><span style="--i:' + i + '">' + esc(w) + '</span></span>';
    }).join(' ');
    h.classList.add('split');
  });

  /* ------------------------------------------------------------
     2 · Scrubbed text: words light up as you scroll through a paragraph
  ------------------------------------------------------------ */
  function splitWords(el) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'sw'; s.textContent = part;
            frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    })(el);
    return words;
  }
  var scrubs = $all('#crisis > .wrap > .section-lede, .pledge p, .origin-grid > div:last-child > p, #grades .section-lede, .final .section-lede, .final-ask')
    .map(function (el) { return { el: el, words: splitWords(el), lit: 0 }; });

  function updateScrub() {
    scrubs.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      var p = r.top > vh ? 0 : r.bottom < 0 ? 1 : clamp((vh * 0.88 - r.top) / (vh * 0.5), 0, 1);
      var target = Math.round(p * s.words.length);
      if (target === s.lit) return;
      var a = Math.min(target, s.lit), b = Math.max(target, s.lit);
      for (var i = a; i < b; i++) s.words[i].classList.toggle('lit', target > s.lit);
      s.lit = target;
    });
  }

  /* ------------------------------------------------------------
     3 · Hero scrolls away: content lifts + fades, photo darkens
  ------------------------------------------------------------ */
  var hero = document.querySelector('.hero');
  var heroGrid = hero && hero.querySelector('.hero-grid');
  function updateHero(y) {
    if (!hero) return;
    var hp = clamp(y / (hero.offsetHeight * 0.85), 0, 1);
    hero.style.setProperty('--hp', hp.toFixed(3));
    if (heroGrid) {
      heroGrid.style.opacity = clamp(1 - hp * 1.25, 0, 1).toFixed(3);
      heroGrid.style.transform = 'translate3d(0,' + (-hp * 80).toFixed(1) + 'px,0)';
    }
  }

  /* ------------------------------------------------------------
     4 · Origin: the step you are reading lights up, photo pans
  ------------------------------------------------------------ */
  var steps = $all('.origin-grid .steps li');
  var originGrid = document.querySelector('.origin-grid');
  var vines = document.querySelector('.illus.vines');
  function updateOrigin() {
    if (steps.length) {
      var line = vh * 0.5, best = null, bestD = 1e9;
      steps.forEach(function (li) {
        var r = li.getBoundingClientRect();
        var d = Math.abs((r.top + r.height / 2) - line);
        if (r.bottom > 0 && r.top < vh && d < bestD) { best = li; bestD = d; }
      });
      if (bestD > vh * 0.45) best = null;
      steps.forEach(function (li) { li.classList.toggle('active', li === best); });
    }
    if (originGrid && vines) {
      var g = originGrid.getBoundingClientRect();
      vines.style.setProperty('--op', clamp((vh - g.top) / (vh + g.height), 0, 1).toFixed(3));
    }
  }

  /* ------------------------------------------------------------
     5 · Depth: grade-card ghost letters + closing photo drift
  ------------------------------------------------------------ */
  var cards = $all('.grade-card');
  var finalSec = document.querySelector('.final');
  function updateDepth() {
    cards.forEach(function (c) {
      var r = c.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      c.style.setProperty('--gp', (((r.top + r.height / 2) - vh / 2) * 0.16).toFixed(1));
    });
    if (finalSec) {
      var f = finalSec.getBoundingClientRect();
      if (f.bottom > 0 && f.top < vh)
        finalSec.style.setProperty('--fp', clamp((0.5 - (f.top + f.height / 2) / vh) * 60, -30, 30).toFixed(1));
    }
  }

  /* ------------------------------------------------------------
     6 · Side rail: section dots + page progress line
  ------------------------------------------------------------ */
  var railDefs = [['top', 'Top'], ['crisis', 'The Problem'], ['origin', 'Origin'],
                  ['grades', 'Grades'], ['process', 'Our Process'], ['inquire', 'Inquire']];
  var rail = document.createElement('div');
  rail.className = 'rail';
  rail.setAttribute('role', 'navigation');
  rail.setAttribute('aria-label', 'Page sections');
  var railItems = [];
  railDefs.forEach(function (d) {
    var sec = document.getElementById(d[0]);
    if (!sec) return;
    var a = document.createElement('a');
    a.href = '#' + d[0];
    a.innerHTML = '<span class="rl">' + d[1] + '</span><i></i>';
    rail.appendChild(a);
    railItems.push({ a: a, s: sec });
  });
  document.body.appendChild(rail);
  function updateRail(y) {
    var max = document.documentElement.scrollHeight - vh;
    rail.style.setProperty('--rp', (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4));
    var line = vh * 0.4, active = railItems[0];
    railItems.forEach(function (it) {
      if (it.s.getBoundingClientRect().top <= line) active = it;
    });
    railItems.forEach(function (it) { it.a.classList.toggle('on', it === active); });
  }

  /* ------------------------------------------------------------
     7 · Marquee: speed and skew follow scroll velocity + direction
  ------------------------------------------------------------ */
  var mq = document.querySelector('.marquee');
  var track = mq && mq.querySelector('.marquee-track');
  if (track) {
    document.documentElement.classList.add('js-marquee');
    var x = 0, half = 0, vel = 0, dir = 1, lastY = window.scrollY, lastT = performance.now();
    var hovering = false, visible = true, raf;
    var measure = function () { half = track.scrollWidth / 2; };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    mq.addEventListener('mouseenter', function () { hovering = true; });
    mq.addEventListener('mouseleave', function () { hovering = false; });
    var tick = function (t) {
      var dt = Math.min(t - lastT, 50); lastT = t;
      var y = window.scrollY, d = clamp(y - lastY, -80, 80); lastY = y;
      vel += (d - vel) * 0.12;
      if (Math.abs(vel) > 0.4) dir = vel > 0 ? 1 : -1;
      x -= dir * ((hovering ? 0 : 0.04 * dt) + Math.abs(vel) * 0.55);
      if (half) { if (x <= -half) x += half; if (x > 0) x -= half; }
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0) skewX(' + clamp(-vel * 0.35, -10, 10).toFixed(2) + 'deg)';
      raf = requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var v = en[0].isIntersecting;
        if (v && !visible) { lastY = window.scrollY; lastT = performance.now(); raf = requestAnimationFrame(tick); }
        if (!v && visible) cancelAnimationFrame(raf);
        visible = v;
      }).observe(mq);
    }
    raf = requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------
     one rAF-throttled scroll loop drives everything above
  ------------------------------------------------------------ */
  var ticking = false;
  function update() {
    var y = window.scrollY || window.pageYOffset;
    updateScrub(); updateHero(y); updateOrigin(); updateDepth(); updateRail(y);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; update(); });
  update();
})();
