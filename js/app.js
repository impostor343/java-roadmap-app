// Router shell: the five tabs (Home, Calendar, Questions, Projects, Progress) plus Settings, chosen by the URL hash.
(function () {
  'use strict';
  var SCREENS = ['today', 'calendar', 'questions', 'projects', 'progress', 'settings'];
  var titleEl = document.getElementById('screen-title'), tabLinks = document.querySelectorAll('.tabbar a'), mainEl = document.getElementById('main');
  function showScreen() {
    var id = location.hash.replace('#', '').split('/')[0];
    if (SCREENS.indexOf(id) === -1) { id = 'today'; }
    var sections = document.querySelectorAll('.screen');
    for (var i = 0; i < sections.length; i++) { sections[i].hidden = (sections[i].id !== 'screen-' + id); }
    for (var j = 0; j < tabLinks.length; j++) {
      if (tabLinks[j].getAttribute('href') === '#' + id) { tabLinks[j].setAttribute('aria-current', 'page'); } else { tabLinks[j].removeAttribute('aria-current'); }
    }
    var title = document.getElementById('screen-' + id).getAttribute('data-title');
    document.body.setAttribute('data-screen', id);
    titleEl.textContent = title; document.title = title + ' | CSE Roadmap';
    window.scrollTo(0, 0); mainEl.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', showScreen); showScreen();
})();
