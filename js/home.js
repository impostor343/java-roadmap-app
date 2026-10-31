// Home: curriculum dashboard. Never reads today's date to decide what to learn.
(function () {
  'use strict';
  var C = window.Curriculum, A = window.State, V = window.SessionView, h = U.h, root = document.getElementById('today-card');

  function card(title) { return h('section', { class: 'card' }, h('h3', { text: title }), [].slice.call(arguments, 1)); }
  function line(a, b) { return h('div', { class: 'row' }, h('span', { class: 'lab', text: a }), h('span', { class: 'val', text: b })); }

  function nextCard() {
    var d = A.nextIncomplete();
    if (!d) { return card('Next learning session', h('p', { text: A.skippedCount() ? 'Every remaining session is skipped. Open the Calendar to return to one.' : 'All ' + U.num(C.total) + ' sessions are completed.' })); }
    var s = C.session(d), c = h('section', { class: 'card hero' });
    c.appendChild(h('p', { class: 'eyebrow', text: 'NEXT LEARNING SESSION' }));
    c.appendChild(h('p', { class: 'bigday', text: U.dayLabel(d, C.total) }));
    c.appendChild(h('h2', { text: s.title })); c.appendChild(h('p', { class: 'muted' }, V.chip(d), ' ', s.module));
    var row = h('div', { class: 'btnrow' });
    function go(fn, hash) { return function () { fn().then(function () { if (hash) { U.go(hash); } else { render(); } }); }; }
    row.appendChild(V.btn('Start Learning', 'ghost', go(function () { return A.start(d); }, '#calendar/day/' + d)));
    row.appendChild(V.btn('Mark Done', 'primary', go(function () { return A.markDone(d); })));
    row.appendChild(h('a', { class: 'btn ghost', href: '#calendar/day/' + d, text: 'View Details' }));
    c.appendChild(row);
    c.appendChild(line('Objective', s.outcome)); c.appendChild(line('Session', s.task));
    c.appendChild(line('Exercise', s.practice)); if (s.resource) { c.appendChild(line('Resource', s.resource)); }
    if (s.projectId) { c.appendChild(line('Project', C.project(s.projectId).name + ' — ' + s.checkpoint)); }
    c.appendChild(line('Estimated time', s.time)); c.appendChild(line('Phase', s.phase));
    var up = A.upcoming(3).slice(1);
    if (up.length) { c.appendChild(h('p', { class: 'muted small', text: 'Following sessions: ' + up.map(function (x) { return 'Day ' + x + ' ' + C.session(x).title; }).join(' · ') })); }
    return c;
  }

  function progressCard() {
    var n = A.doneCount(), sk = A.skippedCount(), d = A.nextIncomplete(), s = d ? C.session(d) : null, ps = A.inProgressDays();
    var c = card('Curriculum progress', h('p', { class: 'bigday', text: n + ' / ' + U.num(C.total) + ' sessions completed' }), U.bar(U.pct(n, C.total)),
      h('p', { class: 'muted', text: U.num(C.total - n) + ' remaining · ' + (C.total ? (n / C.total * 100).toFixed(1) : '0') + '% complete' + (sk ? ' · ' + sk + ' skipped' : '') }));
    if (s) { c.appendChild(line('Current phase', s.phase)); c.appendChild(line('Current module', s.module)); c.appendChild(line('Current curriculum day', U.dayLabel(d, C.total))); }
    return c;
  }

  function categories() {
    var ts = A.topicsDone(), pj = A.projectsDone(), pq = A.practiceStats(), ml = A.milestoneTotals(), n = A.doneCount();
    function cell(l, a, b) { return h('div', { class: 'cell' }, h('strong', { text: a + ' / ' + b }), h('span', { text: l }), U.bar(U.pct(a, b))); }
    return h('section', { class: 'card' }, h('h3', { text: 'Separate progress' }),
      h('div', { class: 'grid2' }, cell('Sessions', n, C.total), cell('Topics completed', ts, C.modules.length), cell('Projects finished', pj, C.projects.length),
        cell('Practice solved', pq.solved, pq.total), cell('Project versions', ml.done, ml.total)));
  }

  function running() {
    var c = card('Currently running'), any = false;
    var learning = C.modules.filter(function (m) { return A.topicStatus(m) === 'in-progress'; });
    learning.forEach(function (m) { any = true; var t = A.topicStats(m);
      c.appendChild(h('a', { class: 'item', href: '#progress/topic/' + m.id }, h('strong', { text: 'Learning: ' + m.name }), h('span', { class: 'muted small', text: t.done + ' / ' + t.total + ' sessions (' + t.percent + '%)' }), U.bar(t.percent))); });
    A.inProgressDays().forEach(function (d) { any = true; c.appendChild(h('a', { class: 'item', href: '#calendar/day/' + d }, h('strong', { text: U.dayLabel(d, C.total) + ': ' + C.session(d).title }), h('span', { class: 'muted small', text: 'Session in progress' }))); });
    A.projectsStarted().forEach(function (p) { var ps = A.projectState(p.id); if (ps.status === 'completed' || ps.status === 'published') { return; } any = true;
      var s = A.projectStats(p), cur = p.versions.filter(function (v) { return A.milestone(v.id).status === 'in-progress'; })[0] || p.versions.filter(function (v) { return A.milestone(v.id).status !== 'completed'; })[0];
      c.appendChild(h('a', { class: 'item', href: '#projects/' + p.id }, h('strong', { text: 'Building: ' + p.name }),
        h('span', { class: 'muted small', text: U.STATUS[ps.status] + ' · ' + s.done + ' / ' + s.total + ' versions' + (cur ? ' · next: ' + cur.name : '') }), U.bar(s.percent))); });
    if (!any) { c.appendChild(h('p', { class: 'muted', text: 'Nothing is in progress yet. Start a session, topic or project and it will appear here.' })); }
    return c;
  }

  function recent() {
    var c = card('Recent activity'), items = A.recent(8);
    if (!items.length) { c.appendChild(h('p', { class: 'muted', text: 'No activity recorded yet.' })); return c; }
    items.forEach(function (it) {
      var label = it.kind === 'session' ? U.dayLabel(it.day, C.total) + ': ' + it.text : it.text;
      var href = it.kind === 'session' ? '#calendar/day/' + it.day : it.projectId ? '#projects/' + it.projectId : null;
      c.appendChild(h(href ? 'a' : 'div', { class: 'item', href: href }, h('strong', { text: label }), h('span', { class: 'muted small', text: (it.kind === 'session' ? 'Completed' : it.kind === 'topic' ? 'Topic' : it.kind === 'practice' ? 'Practice' : 'Project') + ' · ' + U.stamp(it.at) })));
    });
    return c;
  }

  function banner() {
    var b = h('div', { class: 'card note-card' }); var st = A.error();
    if (st) { b.appendChild(h('p', { text: st })); return b; }
    return null;
  }

  function render() {
    if (U.route('today') === null && location.hash.replace('#', '') !== '') { return; }
    root.textContent = '';
    [banner(), nextCard(), progressCard(), categories(), running(), recent()].forEach(function (n) { if (n) { root.appendChild(n); } });
  }
  Promise.all([C.ready, A.ready]).then(render).catch(function (e) { root.textContent = 'Could not load: ' + e.message; });
  window.addEventListener('hashchange', function () { if (U.route('today') !== null) { Promise.all([C.ready, A.ready]).then(render); } });
  window.addEventListener('cur-changed', function () { if (U.route('today') !== null) { render(); } });
})();
