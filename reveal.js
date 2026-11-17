// Scroll reveal with staggered children — respects prefers-reduced-motion
(function () {
  var prefersReduced = document.documentElement.classList.contains('reduce-motion');

  // Stagger groups: give siblings an increasing delay
  function stagger(selector, step) {
    document.querySelectorAll(selector).forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--d', (i * step) + 'ms');
      });
    });
  }
  stagger('.cards', 110);
  stagger('.honest', 160);
  stagger('.cta-pair', 120);
  stagger('.grades', 140);
  stagger('.features', 110);
  stagger('.stats', 110);
  stagger('.versus', 120);
  stagger('.origin-grid .steps', 140);

  // Honest-list items slide in one by one
  document.querySelectorAll('.honest-col ul').forEach(function (ul) {
    Array.prototype.forEach.call(ul.children, function (li, i) {
      li.classList.add('reveal');
      li.style.setProperty('--d', (i * 90) + 'ms');
    });
  });

  var targets = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  function show(el) {
    var d = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
    el.style.transitionDelay = d + 'ms';
    el.classList.add('in');
    // clear the delay afterwards so hover transitions stay instant
    setTimeout(function () { el.style.transitionDelay = ''; }, d + 1000);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(function (el) { io.observe(el); });
})();
