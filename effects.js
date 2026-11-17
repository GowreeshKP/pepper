// Interactive effects: scroll progress, nav state, parallax, tilt, spotlight,
// counters and hero particles. All motion is skipped for prefers-reduced-motion.
(function () {
  var reduce = document.documentElement.classList.contains('reduce-motion');
  var nav = document.querySelector('nav');
  var bar = document.getElementById('progress');
  var heroFigure = document.querySelector('.hero-figure');
  var wides = Array.prototype.slice.call(document.querySelectorAll('.illus.wide'));
  var heroBg = document.querySelector('.hero-bg');
  var ticking = false;

  /* ---- nav scroll-spy: mark the section currently in view ---- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]:not(.btn)'));
  var spyMap = spyLinks.map(function (a) {
    return { a: a, s: document.querySelector(a.getAttribute('href')) };
  }).filter(function (m) { return m.s; });
  function updateSpy() {
    var line = window.innerHeight * 0.35, active = null;
    spyMap.forEach(function (m) {
      var r = m.s.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) active = m.a;
    });
    spyMap.forEach(function (m) { m.a.classList.toggle('current', m.a === active); });
  }

  /* ---- scroll: progress bar, nav, parallax ---- */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (nav) nav.classList.toggle('scrolled', y > 10);
    if (reduce) return;
    if (heroFigure && y < 1000) heroFigure.style.setProperty('--sy', (-y * 0.07).toFixed(1));
    if (heroBg && y < 1400) heroBg.style.setProperty('--hy', (y * 0.28).toFixed(1));
    updateSpy();
    wides.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var p = (r.top + r.height / 2) / window.innerHeight;     // 1 (bottom) → 0 (top)
      p = Math.max(0, Math.min(1, p));
      el.style.setProperty('--py', (25 + (1 - p) * 50).toFixed(1) + '%');
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if (reduce) return;

  /* ---- cursor spotlight on cards ---- */
  document.querySelectorAll('.card, .honest-col, .spot').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---- hero photo 3D tilt ---- */
  var wrap = document.querySelector('.photo-wrap');
  if (wrap && heroFigure && window.matchMedia('(hover: hover)').matches) {
    heroFigure.addEventListener('mousemove', function (e) {
      var r = wrap.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / r.width;    // -0.5 … 0.5
      var y = (e.clientY - (r.top + r.height / 2)) / r.height;
      wrap.style.setProperty('--ry', (x * 18).toFixed(1) + 'deg');
      wrap.style.setProperty('--rx', (-y * 18).toFixed(1) + 'deg');
    });
    heroFigure.addEventListener('mouseleave', function () {
      wrap.style.setProperty('--rx', '0deg');
      wrap.style.setProperty('--ry', '0deg');
    });
  }

  /* ---- count-up numbers ---- */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        var el = e.target;
        var end = parseFloat(el.getAttribute('data-count'));
        var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
        var start = null, dur = 1600;
        function step(t) {
          if (start === null) start = t;
          var p = Math.min((t - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (end * eased).toFixed(dec);
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = (0).toFixed(dec);
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---- drifting peppercorn dust in the hero ---- */
  var canvas = document.getElementById('dust');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var hero = canvas.parentElement;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, motes = [], running = false, raf;

  function size() {
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(46, W / 28));
    motes = [];
    for (var i = 0; i < n; i++) motes.push(make(true));
  }
  function make(anywhere) {
    var brass = Math.random() < 0.55;
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: 0.8 + Math.random() * 2.6,
      vy: 0.12 + Math.random() * 0.4,
      vx: (Math.random() - 0.5) * 0.18,
      ph: Math.random() * Math.PI * 2,
      a: 0.12 + Math.random() * 0.4,
      c: brass ? '200,155,75' : '179,163,140'
    };
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.y -= m.vy;
      m.x += m.vx + Math.sin(t / 1600 + m.ph) * 0.18;
      if (m.y < -10) motes[i] = make(false);
      var fade = Math.min(1, m.y / (H * 0.25), (H - m.y) / (H * 0.15) + 0.3);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + m.c + ',' + (m.a * Math.max(0, Math.min(1, fade))).toFixed(3) + ')';
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  size();
  window.addEventListener('resize', size);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !running) { running = true; raf = requestAnimationFrame(draw); }
      else if (!entries[0].isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(hero);
  } else { raf = requestAnimationFrame(draw); }
})();
