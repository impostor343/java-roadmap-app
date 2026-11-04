// Entrance animations. CSS in css/refresh.css only runs while <body> has .anim-on.
// The class is enabled briefly after a genuine screen change and on initial load.
// It is deliberately NOT replayed on pageshow: browsers can fire pageshow when
// restoring a page from the back-forward cache, which made the whole screen flash.
(function () {
  'use strict';

  function pulse() {
    if (window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    document.body.classList.remove('anim-on');

    // Force the browser to register the class removal before adding it again.
    void document.body.offsetWidth;

    document.body.classList.add('anim-on');

    window.setTimeout(function () {
      document.body.classList.remove('anim-on');
    }, 2000);
  }

  function countUp() {
    var counters = document.querySelectorAll('[data-count-up]');

    counters.forEach(function (counter) {
      var target = Number(counter.getAttribute('data-count-up'));

      if (!Number.isFinite(target)) return;

      var duration = 900;
      var startTime = null;

      function update(timestamp) {
        if (startTime === null) startTime = timestamp;

        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);

        counter.textContent = Math.round(target * eased);

        if (progress < 1) {
          window.requestAnimationFrame(update);
        }
      }

      window.requestAnimationFrame(update);
    });
  }

  function runScreenEffects() {
    pulse();
    countUp();
  }

  window.addEventListener('hashchange', runScreenEffects);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runScreenEffects, {
      once: true
    });
  } else {
    runScreenEffects();
  }
})();
