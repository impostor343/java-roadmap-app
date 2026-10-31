// Calendar tab. "Curriculum" = day-based navigator in blocks of 30 (not a date calendar). "History" lives in history.js.
// Routes: #calendar (block containing the next session) | #calendar/<block index> | #calendar/day/<n> | #calendar/history[/<yyyy-mm-dd>]
(function () {
  'use strict';
  var C = window.Curriculum, A = window.State, V = window.SessionView, h = U.h, root = document.getElementById('calendar');
  var tabs = function (active) { return h('div', { class: 'seg' }, h('a', { class: active === 'cur' ? 'on' : '', href: '#calendar', text: 'Curriculum' }), h('a', { class: active === 'hist' ? 'on' : '', href: '#calendar/history', text: 'Completion history' })); };

  function sessionRow(d) {
    var s = C.session(d), st = A.status(d), c = A.completion(d), proj = s.projectId ? C.project(s.projectId) : null;
    var a = h('a', { class: 'srow st-' + st, href: '#calendar/day/' + d });
    a.appendChild(h('span', { class: 'dnum', text: 'Day ' + d }));
    a.appendChild(h('span', { class: 'sbody' }, h('strong', { text: s.title }), h('span', { class: 'muted small', text: s.module }),
      h('span', { class: 'muted small clamp', text: s.outcome }),
      proj ? h('span', { class: 'tag', text: 'Project: ' + proj.name }) : null, s.practiceType && s.practice ? h('span', { class: 'tag', text: 'Practice' }) : null,
      c ? h('span', { class: 'muted small', text: 'Completed ' + U.stamp(c.completedAt) }) : null));
    a.appendChild(V.chip(d)); return a;
  }

  function block(i) {
    var gs = C.groups(); if (i < 0 || i >= gs.length || isNaN(i)) { i = 0; }
    var g = gs[i], w = h('div');
    var pick = h('select', { class: 'sel', 'aria-label': 'Choose a block of sessions', onchange: function () { U.go('#calendar/' + this.value); } });
    gs.forEach(function (x) { var done = 0; for (var d = x.from; d <= x.to; d++) { if (A.isDone(d)) { done++; } } var o = h('option', { value: x.index, text: 'Days ' + x.from + '–' + x.to + ' (' + done + '/' + (x.to - x.from + 1) + ')' }); if (x.index === i) { o.selected = true; } pick.appendChild(o); });
    var jump = h('input', { class: 'sel', type: 'number', min: 1, max: C.total, placeholder: 'Go to day…', 'aria-label': 'Go to a curriculum day', onchange: function () { var n = parseInt(this.value, 10); if (n >= 1 && n <= C.total) { U.go('#calendar/day/' + n); } } });
    w.appendChild(h('div', { class: 'btnrow' }, h('a', { class: 'btn ghost', href: '#calendar/' + (i - 1), 'aria-disabled': i === 0 ? 'true' : null, text: '←' }), pick, h('a', { class: 'btn ghost', href: '#calendar/' + (i + 1), 'aria-disabled': i === gs.length - 1 ? 'true' : null, text: '→' })));
    w.appendChild(jump);
    var chips = h('div', { class: 'chips' }); gs.forEach(function (x) { chips.appendChild(h('a', { class: 'gchip' + (x.index === i ? ' on' : ''), href: '#calendar/' + x.index, text: x.from + '–' + x.to })); }); w.appendChild(chips);
    var list = h('div', { class: 'slist' }); for (var d = g.from; d <= g.to; d++) { list.appendChild(sessionRow(d)); } w.appendChild(list); return w;
  }

  function render() {
    var r = U.route('calendar'); if (r === null) { return; }
    root.textContent = '';
    if (r[0] === 'day') { var d = parseInt(r[1], 10); if (!(d >= 1 && d <= C.total)) { U.go('#calendar'); return; }
      root.appendChild(h('a', { class: 'btn ghost back', href: '#calendar/' + C.groupOf(d), text: '← Days ' + C.groups()[C.groupOf(d)].from + '–' + C.groups()[C.groupOf(d)].to })); root.appendChild(V.detail(d)); return; }
    if (r[0] === 'history') { root.appendChild(tabs('hist')); root.appendChild(window.History.render(r[1])); return; }
    root.appendChild(tabs('cur'));
    var i = r[0] !== undefined ? parseInt(r[0], 10) : null;
    if (i === null || isNaN(i)) { var nx = A.nextIncomplete(); i = C.groupOf(nx || 1); }
    root.appendChild(block(i));
  }
  Promise.all([C.ready, A.ready]).then(function () { render(); window.addEventListener('hashchange', render); window.addEventListener('cur-changed', function () { if (U.route('calendar') !== null) { render(); } }); })
    .catch(function (e) { root.textContent = 'Could not load: ' + e.message; });
})();
