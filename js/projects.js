// Projects tab: all 25 workbook projects. Routes: #projects | #projects/<PR01..>
// Progress % = completed versions / versions (the workbook's own milestones). Target days are planning references, never proof of completion.
(function () {
  'use strict';
  var C = window.Curriculum, A = window.State, V = window.SessionView, I = window.Icons, h = U.h, root = document.getElementById('projects-root');
  var PROJECT_ICONS = {
    PR01: 'game', PR02: 'calculator', PR03: 'quiz', PR04: 'contacts', PR05: 'wallet',
    PR06: 'bank', PR07: 'book', PR08: 'box', PR09: 'chart', PR10: 'users',
    PR11: 'monitor', PR12: 'folder', PR13: 'file', PR14: 'link', PR15: 'task',
    PR16: 'wallet', PR17: 'cart', PR18: 'calendar', PR19: 'message', PR20: 'briefcase',
    PR21: 'phone', PR22: 'network', PR23: 'search', PR24: 'server', PR25: 'chart'
  };
  var PSTAT = ['not-started', 'planning', 'development', 'testing', 'completed', 'needs-improvement', 'published'];
  var MSTAT = ['not-started', 'in-progress', 'completed'];
  var EVENTS = [['note', 'Note'], ['started', 'Project started'], ['folders', 'Folder structure created'], ['feature', 'Feature implemented'], ['bug-found', 'Bug discovered'], ['bug-fixed', 'Bug fixed'],
    ['version-started', 'Version started'], ['version-completed', 'Version completed'], ['testing', 'Testing completed'], ['github', 'GitHub published'], ['deployed', 'Deployment completed']];
  function card(t) { return h('section', { class: 'card' }, h('h3', { text: t }), [].slice.call(arguments, 1)); }
  function row(a, b) { return b !== null && b !== undefined && b !== '' ? h('div', { class: 'row' }, h('span', { class: 'lab', text: a }), h('span', { class: 'val', text: String(b) })) : null; }
  function select(opts, cur, onchange, label) { var s = h('select', { class: 'sel', 'aria-label': label, onchange: function () { onchange(this.value); } }); opts.forEach(function (o) { var op = h('option', { value: o, text: U.STATUS[o] }); if (o === cur) { op.selected = true; } s.appendChild(op); }); return s; }

  function list() {
    var w = h('div'), cat = null, order = ['Small', 'Medium', 'Large', 'Advanced'];
    var groups = {}; C.projects.forEach(function (p) { (groups[p.category] = groups[p.category] || []).push(p); });
    Object.keys(groups).sort(function (a, b) { return (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99; }).forEach(function (k) {
      w.appendChild(h('h3', { class: 'ph', text: k })); groups[k].forEach(function (p) { var s = A.projectStats(p), ps = A.projectState(p.id);
        var ic = h('span', { class: 'project-icon project-icon-' + p.id.toLowerCase(), 'aria-hidden': 'true' });
        ic.appendChild(I.make(PROJECT_ICONS[p.id] || 'code'));
        w.appendChild(h('a', { class: 'item project-item', href: '#projects/' + p.id },
          ic,
          h('span', { class: 'project-item-main' },
            h('strong', { text: p.name }),
            h('span', { class: 'muted small', text: U.STATUS[ps.status] + ' · ' + s.done + ' / ' + s.total + ' versions · ' + p.coreSkills }),
            U.bar(s.percent)
          ),
          h('span', { class: 'project-item-arrow', text: '›', 'aria-hidden': 'true' })
        )); }); });
    return w;
  }

  function page(id) {
    var p = C.project(id); if (!p) { return h('p', { text: 'Project not found.' }); }
    var w = h('div'), ps = A.projectState(id), s = A.projectStats(p);
    w.appendChild(h('a', { class: 'btn ghost back', href: '#projects', text: '← Projects' }));
    var heroIcon = h('div', { class: 'project-detail-icon project-icon-' + p.id.toLowerCase(), 'aria-hidden': 'true' });
    heroIcon.appendChild(I.make(PROJECT_ICONS[p.id] || 'code'));
    w.appendChild(h('div', { class: 'project-detail-heading' }, heroIcon,
      h('div', {}, h('p', { class: 'eyebrow', text: p.id + ' · ' + p.category }), h('h2', { text: p.name }))));

    w.appendChild(card('Status and progress', select(PSTAT, ps.status, function (v) { A.saveProject(id, { status: v }).then(V.refresh); }, 'Project status'),
      h('p', { class: 'bigday', text: s.percent + '% · ' + s.done + ' / ' + s.total + ' versions completed' }), U.bar(s.percent),
      h('p', { class: 'muted small', text: 'Status is yours to set. Learning sessions never complete a project or a version automatically.' })));
    w.appendChild(card('Overview', row('Core skills', p.coreSkills), row('Portfolio priority', p.priority), row('Prerequisite / introduction', p.prerequisite),
      row('First planned milestone', typeof p.firstMilestoneDay === 'number' ? 'Day ' + p.firstMilestoneDay + ' (planning reference)' : p.firstMilestoneDay), row('Version roadmap', p.versionRoadmap), row('Notes', p.notes)));
    w.appendChild(card('Folder and publishing', row('Canonical folder', p.folder), row('Publishable milestone', p.publishableDefinition), row('Continuity rule', p.continuityRule)));
    var vc = card('Versions and milestones');
    p.versions.forEach(function (v) {
      var m = A.milestone(v.id), box = h('div', { class: 'ver st-' + m.status });
      box.appendChild(h('div', { class: 'vhead' }, h('strong', { text: v.name }), select(MSTAT, m.status, function (val) { A.saveMilestone(p, v, { status: val }).then(V.refresh); }, v.name + ' status')));
      box.appendChild(row('Target', v.targetDay ? 'Day ' + v.targetDay + ' (planning reference only)' : v.targetText));
      box.appendChild(row('Unlocks after', v.unlocksAfter)); box.appendChild(row('What changes', v.changes)); box.appendChild(row('Acceptance checks', v.acceptance));
      if (m.completedAt) { box.appendChild(row('Completed', U.stamp(m.completedAt))); }
      var n = h('textarea', { class: 'notes', rows: 2, placeholder: 'Notes for ' + v.name + '…' }); n.value = m.notes || ''; n.addEventListener('blur', function () { A.saveMilestone(p, v, { notes: n.value }); }); box.appendChild(n);
      if (v.targetDay) { box.appendChild(h('a', { class: 'small', href: '#calendar/day/' + v.targetDay, text: 'Open Day ' + v.targetDay + ' →' })); }
      vc.appendChild(box); });
    w.appendChild(vc);
    var rel = h('div', { class: 'chips' }); p.relatedDays.forEach(function (d) { rel.appendChild(h('a', { class: 'gchip', href: '#calendar/day/' + d, text: 'Day ' + d })); });
    var mods = []; C.modules.forEach(function (m) { if (p.relatedDays.some(function (d) { return d >= m.startDay && d <= m.endDay; })) { mods.push(h('a', { class: 'gchip', href: '#progress/topic/' + m.id, text: m.name })); } });
    w.appendChild(card('Related sessions and topics (derived from version target days)', rel, h('div', { class: 'chips' }, mods)));
    // development history
    var hist = card('Development history'), type = h('select', { class: 'sel', 'aria-label': 'Event type' }), txt = h('input', { class: 'sel', type: 'text', placeholder: 'Details (optional)' }), dt = h('input', { class: 'sel', type: 'date', max: U.todayKey(), value: U.todayKey(), 'aria-label': 'Event date' });
    EVENTS.forEach(function (e) { type.appendChild(h('option', { value: e[0], text: e[1] })); });
    hist.appendChild(h('div', { class: 'form' }, type, txt, dt, V.btn('Add event', 'primary', function () {
      var label = type.options[type.selectedIndex].text + (txt.value.trim() ? ': ' + txt.value.trim() : ''), at = dt.value ? new Date(dt.value + 'T' + new Date().toTimeString().slice(0, 8)).toISOString() : undefined;
      A.projectEvent(id, type.value, label, null, at).then(V.refresh); })));
    var evs = A.projectEvents(id); if (!evs.length) { hist.appendChild(h('p', { class: 'muted', text: 'No events yet. Status and version changes are recorded here automatically.' })); }
    evs.forEach(function (e) { hist.appendChild(h('div', { class: 'item' }, h('strong', { text: e.label }), h('span', { class: 'muted small', text: U.stamp(e.at) }),
      h('button', { type: 'button', class: 'link', onclick: function () { if (confirm('Delete this event?')) { A.deleteEvent(e.id).then(V.refresh); } }, text: 'Delete' }))); });
    w.appendChild(hist);
    var n2 = h('textarea', { class: 'notes', rows: 4, placeholder: 'Project notes…' }); n2.value = ps.notes || ''; n2.addEventListener('blur', function () { A.saveProject(id, { notes: n2.value }); });
    w.appendChild(card('My notes', n2)); return w;
  }

  function render() {
    var r = U.route('projects'); if (r === null) { return; } root.textContent = '';
    root.appendChild(r[0] ? page(r[0]) : list());
  }
  Promise.all([C.ready, A.ready]).then(function () { render(); window.addEventListener('hashchange', render); window.addEventListener('cur-changed', function () { if (U.route('projects') !== null) { render(); } }); })
    .catch(function (e) { root.textContent = 'Could not load: ' + e.message; });
})();
