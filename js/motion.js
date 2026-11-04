// Optional one-time count-up effects. Do not replay entrance animations on route changes:
// repeated transform animations on long mobile pages can look like scroll-position jumps.
(function () {
  'use strict';
  function countUp() {
    var counters = document.querySelectorAll('[data-count-up]');
    counters.forEach(function (counter) {
      var target = Number(counter.getAttribute('data-count-up'));
      if (!Number.isFinite(target)) return;
      var duration = 900, startTime = null;
      function update(timestamp) {
        if (startTime === null) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.round(target * eased);
        if (progress < 1) { window.requestAnimationFrame(update); }
      }
      window.requestAnimationFrame(update);
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', countUp, { once: true }); }
  else { countUp(); }
})();
