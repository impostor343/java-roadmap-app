// Router shell: screen changes keep each tab's last reading position.
(function () {
  'use strict';
  var SCREENS = ['today', 'modules', 'manual', 'calendar', 'questions', 'projects', 'progress', 'resources', 'settings'];
  var titleEl = document.getElementById('screen-title'), tabLinks = document.querySelectorAll('.tabbar a'), mainEl = document.getElementById('main');
  var lastId = null, scrollByScreen = Object.create(null);
  function screenId() {
    var id = (location.hash.replace('#', '').split('/')[0] || 'today');
    if (id === 'modules' || id === 'manual' || id === 'projects') { id = 'today'; }
    return SCREENS.indexOf(id) === -1 ? 'today' : id;
  }
  function showScreen() {
    var id = screenId();
    var sections = document.querySelectorAll('.screen');
    for (var i = 0; i < sections.length; i++) { sections[i].hidden = (sections[i].id !== 'screen-' + id); }
    for (var j = 0; j < tabLinks.length; j++) {
      if (tabLinks[j].getAttribute('href') === '#' + id) { tabLinks[j].setAttribute('aria-current', 'page'); } else { tabLinks[j].removeAttribute('aria-current'); }
    }
    var title = document.getElementById('screen-' + id).getAttribute('data-title');
    document.body.setAttribute('data-screen', id);
    titleEl.textContent = title; document.title = title + ' | Bytewise';
    if (id !== lastId) {
      if (lastId !== null) { scrollByScreen[lastId] = window.scrollY || window.pageYOffset || 0; }
      lastId = id;
      var raf = window.requestAnimationFrame || function (fn) { return window.setTimeout(fn, 16); };
      raf(function () {
        var target = scrollByScreen[id] || 0;
        window.scrollTo(0, target);
        mainEl.focus({ preventScroll: true });
      });
    }
  }
  window.addEventListener('hashchange', showScreen);
  showScreen();
})();

// Offline support: the service worker caches the app and data after the first visit.
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform())) { window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); }); }
