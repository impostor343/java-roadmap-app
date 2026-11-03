// Entrance animations. CSS in css/refresh.css only runs while <body> has .anim-on, which is switched on for a moment
// after each screen change (and on first load), so re-renders (ticking Done, typing in search) never flash or replay.
(function () {
  'use strict';
  var body = document.body, timer = null;
  function countUp(el) {
    var m = /^(\d+)(.*)$/.exec(el.textContent || ''); if (!m) { return; }
    var to = parseInt(m[1], 10), tail = m[2], t0 = null, ms = 800;
    if (!to) { return; }
    function step(t) { if (t0 === null) { t0 = t; } var p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e) + tail; if (p < 1) { requestAnimationFrame(step); } }
    el.textContent = '0' + tail; requestAnimationFrame(step);
  }
  function pulse() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
    body.classList.remove('anim-on'); void body.offsetWidth; body.classList.add('anim-on');
    clearTimeout(timer); timer = setTimeout(function () { body.classList.remove('anim-on'); }, 2000);
    setTimeout(function () { var el = document.querySelector('.screen:not([hidden]) .pg-ring-text'); if (el) { countUp(el); } }, 120);
  }
  window.addEventListener('hashchange', function () { requestAnimationFrame(pulse); });
  window.addEventListener('pageshow', pulse);
  pulse();
})();
