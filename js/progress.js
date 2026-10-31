// Progress tab: dashboard, topics list and topic detail pages, skipped list.
// Routes: #progress | #progress/topics | #progress/topic/<M01..> | #progress/skipped
(function () {
  'use strict';
  var C = window.Curriculum, A = window.State, V = window.SessionView, h = U.h, root = document.getElementById('progress-root');
  var TOPIC_STATUSES = ['not-started', 'in-progress', 'completed', 'needs-revision'];

  function card(t) { return h('section', { class: 'card' }, h('h3', { text: t }), [].slice.call(arguments, 1)); }
  function row(a, b) { return b ? h('div', { class: 'row' }, h('span', { class: 'lab', text: a }), h('span', { class: 'val', text: String(b) })) : null; }
  function back(href, text) { return h('a', { class: 'btn ghost back', href: href, text: text }); }

  function dashboard() {
    var w = h('div'), n = A.doneCount(), pq = A.practiceStats(), ml = A.milestoneTotals();
    w.appendChild(card('Curriculum sessions', h('p', { class: 'bigday', text: n + ' / ' + U.num(C.total) + ' completed' }), U.bar(U.pct(n, C.total)),
      h('p', { class: 'muted', text: U.num(C.total - n) + ' remaining. This counts completed sessions, not calendar days.' })));
    var ph = {}; C.sessions.forEach(function (s) { var p = ph[s.phase] = ph[s.phase] || { t: 0, d: 0 }; p.t++; if (A.isDone(s.day)) { p.d++; } });
    w.appendChild(card('By phase', Object.keys(ph).map(function (k) { return h('div', { class: 'item' }, h('strong', { text: k }), h('span', { class: 'muted small', text: ph[k].d + ' / ' + ph[k].t }), U.bar(U.pct(ph[k].d, ph[k].t))); })));
    w.appendChild(card('Other categories',
      row('Topics completed', A.topicsDone() + ' / ' + C.modules.length), row('Projects finished', A.projectsDone() + ' / ' + C.projects.length),
      row('Project versions completed', ml.done + ' / ' + ml.total), row('Practice questions solved', pq.solved + ' / ' + pq.total + (pq.inProgress ? ' (' + pq.inProgress + ' in progress)' : '')),
      row('Sessions skipped', String(A.skippedCount()))));
    w.appendChild(h('div', { class: 'btnrow' }, h('a', { class: 'btn primary', href: '#progress/topics', text: 'All topics' }), h('a', { class: 'btn ghost', href: '#progress/skipped', text: 'Skipped sessions' }), h('a', { class: 'btn ghost', href: '#progress/more', text: 'Guides' })));
    return w;
  }

  function topics() {
    var w = h('div'); w.appendChild(back('#progress', '← Progress'));
    var phase = null;
    C.modules.forEach(function (m) {
      if (m.phase !== phase) { phase = m.phase; w.appendChild(h('h3', { class: 'ph', text: phase })); }
      var t = A.topicStats(m), st = A.topicStatus(m);
      w.appendChild(h('a', { class: 'item', href: '#progress/topic/' + m.id }, h('strong', { text: m.name }), h('span', { class: 'muted small', text: U.STATUS[st] + ' · ' + t.done + ' / ' + t.total + ' sessions · Days ' + m.startDay + '–' + m.endDay }), U.bar(t.percent)));
    });
    return w;
  }

  function topicPage(id) {
    var m = C.module(id); if (!m) { return h('p', { text: 'Topic not found.' }); }
    var w = h('div'), t = A.topicStats(m), ts = A.topicState(id);
    w.appendChild(back('#progress/topics', '← Topics'));
    w.appendChild(h('p', { class: 'eyebrow', text: m.id + ' · ' + m.phase }));
    w.appendChild(h('h2', { text: m.name }));
    var sel = h('select', { class: 'sel', 'aria-label': 'Topic status', onchange: function () { A.saveTopic(id, { status: this.value }).then(V.refresh); } });
    TOPIC_STATUSES.forEach(function (s) { var o = h('option', { value: s, text: U.STATUS[s] }); if (s === A.topicStatus(m)) { o.selected = true; } sel.appendChild(o); });
    w.appendChild(card('Status', sel, h('p', { class: 'muted small', text: 'Your topic status is separate from session completion. Changing it never completes or reopens sessions.' }), ts.completedAt ? row('Marked completed', U.stamp(ts.completedAt)) : null));
    w.appendChild(card('Learning progress', h('p', { class: 'bigday', text: t.done + ' / ' + t.total + ' sessions completed' }), U.bar(t.percent), h('p', { class: 'muted', text: t.remaining + ' remaining' + (t.skipped ? ' · ' + t.skipped + ' skipped' : '') })));
    w.appendChild(card('About', row('Domain', m.domain), row('Semester target', m.semester), row('Sessions', 'Days ' + m.startDay + '–' + m.endDay + ' (' + m.days + ')'), row('Expected outcome', m.outcome), row('Extension rule', m.extensionRule)));
    var prev = C.modules[C.modules.indexOf(m) - 1];
    w.appendChild(card('Prerequisites', h('p', { text: prev ? 'Follows: ' + prev.name + ' (Days ' + prev.startDay + '–' + prev.endDay + '). The workbook states no other topic-level prerequisites.' : 'First module in the curriculum.' })));
    w.appendChild(card('Resources', row('Free resource', m.resource), m.resourceLinks.length ? h('div', { class: 'links' }, m.resourceLinks.map(function (u) { return h('a', { href: u, target: '_blank', rel: 'noopener', text: u }); })) : null));
    var projs = C.projects.filter(function (p) { return p.relatedDays.some(function (d) { return d >= m.startDay && d <= m.endDay; }); });
    w.appendChild(card('Related projects (by version target day)', projs.length ? projs.map(function (p) { return h('a', { class: 'item', href: '#projects/' + p.id }, h('strong', { text: p.name }), h('span', { class: 'muted small', text: 'Target days: ' + p.relatedDays.filter(function (d) { return d >= m.startDay && d <= m.endDay; }).join(', ') })); }) : h('p', { class: 'muted', text: 'No project version targets fall inside this module.' })));
    var sl = h('div', { class: 'slist' });
    for (var d = m.startDay; d <= m.endDay; d++) { (function (d) { var s = C.session(d);
      sl.appendChild(h('a', { class: 'srow st-' + A.status(d), href: '#calendar/day/' + d }, h('span', { class: 'dnum', text: 'Day ' + d }), h('span', { class: 'sbody' }, h('strong', { text: s.title }), s.practice ? h('span', { class: 'muted small clamp', text: 'Practice: ' + s.practice }) : null), V.chip(d))); })(d); }
    w.appendChild(card('Related sessions')); w.lastChild.appendChild(sl);
    var ex = h('textarea', { class: 'notes', rows: 4, placeholder: 'Your notes about this topic…' }); ex.value = ts.notes || '';
    ex.addEventListener('blur', function () { A.saveTopic(id, { notes: ex.value }); });
    w.appendChild(card('My notes', ex));
    w.appendChild(card('Practice questions', h('p', { class: 'muted', text: 'The workbook Practice Bank lists its own topic IDs and does not link questions to modules, so they are not attached here. See the Questions tab.' })));
    return w;
  }

  function skipped() {
    var w = h('div'); w.appendChild(back('#progress', '← Progress')); w.appendChild(h('h2', { text: 'Skipped sessions' }));
    var list = h('div', { class: 'slist' }), n = 0;
    for (var d = 1; d <= C.total; d++) { if (A.status(d) === 'skipped') { n++; var s = C.session(d); list.appendChild(h('a', { class: 'srow st-skipped', href: '#calendar/day/' + d }, h('span', { class: 'dnum', text: 'Day ' + d }), h('span', { class: 'sbody' }, h('strong', { text: s.title }), h('span', { class: 'muted small', text: s.module })), V.chip(d))); } }
    w.appendChild(n ? list : h('p', { class: 'muted', text: 'No skipped sessions.' })); return w;
  }

  function more() {   // supporting workbook sheets, shown as imported
    var w = h('div'), X = C.extras; w.appendChild(back('#progress', '← Progress')); w.appendChild(h('h2', { text: 'Guides from the workbook' }));
    w.appendChild(card('GitHub publishing checkpoints', X.github.map(function (g) { return h('div', { class: 'item' }, h('strong', { text: g.Sequence + '. ' + g.Checkpoint }), h('span', { class: 'small', text: g['What to do'] }), h('span', { class: 'muted small', text: g['Publish / commit guidance'] }), h('span', { class: 'muted small', text: 'Done when: ' + g['Definition of done'] })); })));
    w.appendChild(card('Interview preparation', X.interview.map(function (g) { return h('div', { class: 'item' }, h('strong', { text: g.Track + ' · ' + g['Skill area'] }), h('span', { class: 'small', text: g['Preparation task'] }), h('span', { class: 'muted small', text: g['Evidence / checkpoint'] + ' — ' + g['When to revisit'] })); })));
    w.appendChild(card('Language strategy', X.languages.map(function (g) { return h('div', { class: 'item' }, h('strong', { text: g.Language + ' · ' + g.Priority }), h('span', { class: 'small', text: g.When + ' — ' + g['Why learn it'] }), h('span', { class: 'muted small', text: 'Depth: ' + g['Depth target'] + ' · Avoid: ' + g['Do not do'] })); })));
    w.appendChild(card('Android side track', X.android.map(function (g) { return h('div', { class: 'item' }, h('strong', { text: 'App day ' + g['App Day'] + ': ' + g.Lesson }), h('span', { class: 'small', text: g['Practice / build task'] }), h('span', { class: 'muted small', text: 'After: ' + g.Prerequisite + ' · ' + g['Suggested time'] })); })));
    w.appendChild(card('All free resources', X.resources.map(function (g) { return h('div', { class: 'item' }, h('strong', { text: g.Resource + ' (' + g.Area + ')' }), h('span', { class: 'muted small', text: g['Use it for'] + ' · ' + g['Access note'] }), g.URL ? h('a', { class: 'small', href: g.URL, target: '_blank', rel: 'noopener', text: g.URL }) : null); })));
    w.appendChild(card('Academic pause planner', X.pause.map(function (g) { return h('div', { class: 'item' }, h('strong', { text: g.Entry + ' · ' + g['Academic period'] }), h('span', { class: 'small', text: g['What to do'] }), h('span', { class: 'muted small', text: g.Mode })); })));
    return w;
  }

  function render() {
    var r = U.route('progress'); if (r === null) { return; }
    root.textContent = '';
    if (r[0] === 'topics') { root.appendChild(topics()); } else if (r[0] === 'topic') { root.appendChild(topicPage(r[1])); }
    else if (r[0] === 'skipped') { root.appendChild(skipped()); } else if (r[0] === 'more') { root.appendChild(more()); } else { root.appendChild(dashboard()); }
  }
  Promise.all([C.ready, A.ready]).then(function () { render(); window.addEventListener('hashchange', render); window.addEventListener('cur-changed', function () { if (U.route('progress') !== null) { render(); } }); })
    .catch(function (e) { root.textContent = 'Could not load: ' + e.message; });
})();
