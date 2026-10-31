// Home: one focused learning-session card, with full details behind Info.
(function () {
  'use strict';
  var C = window.Curriculum, A = window.State, V = window.SessionView, h = U.h;
  var root = document.getElementById('today-card');
  var selectedDay = null, enterDir = null;   // enterDir: which side the next card slides in from

  function currentDay() {
    var r = U.route('today');
    var requested = r && r[0] ? parseInt(r[0], 10) : NaN;
    if (requested >= 1 && requested <= C.total) { return requested; }
    return A.nextIncomplete() || C.total || 1;
  }

  function statusLabel(d) {
    var s = A.status(d);
    if (s === 'completed') { return '✓ Completed'; }
    if (s === 'skipped') { return '↪ Skipped'; }
    if (s === 'in-progress') { return '◷ In progress'; }
    return '○ Pending';
  }

  function saveNotes(d, fields, status) {
    var patch = {};
    Object.keys(fields).forEach(function (k) { patch[k] = fields[k].value; });
    A.saveSession(d, patch).then(function () {
      status.textContent = 'Saved on this device';
    }).catch(function (e) {
      status.textContent = 'Could not save: ' + ((e && e.message) || e);
    });
  }

  function notesSection(d) {
    var saved = A.sessionState(d);
    var section = h('section', { class: 'home-notes' });
    section.appendChild(h('h3', { class: 'home-section-title' }, '▤ ', 'My notes'));
    var fields = {};
    [
      ['whatDid', 'What I did today', 'Write your notes here…'],
      ['review', 'Review: what I learned, what was hard', 'What did you learn? What needs another look?'],
      ['remarks', 'Remarks or blockers', 'Anything that blocked or delayed you?']
    ].forEach(function (item) {
      var label = h('label', { class: 'home-note-label' }, item[1]);
      var area = h('textarea', { class: 'home-note-input', rows: 3, placeholder: item[2], 'aria-label': item[1] });
      area.value = saved[item[0]] || (item[0] === 'whatDid' ? (saved.notes || '') : '');
      label.appendChild(area);
      section.appendChild(label);
      fields[item[0]] = area;
    });
    var state = h('p', { class: 'home-note-status', 'aria-live': 'polite' });
    var save = h('button', { class: 'home-btn primary home-save', type: 'button', text: '▣  Save notes' });
    save.addEventListener('click', function () { saveNotes(d, fields, state); });
    // Save automatically after the user leaves a field, with an explicit Save button as backup.
    Object.keys(fields).forEach(function (k) {
      fields[k].addEventListener('change', function () { saveNotes(d, fields, state); });
    });
    section.appendChild(save);
    section.appendChild(state);
    return section;
  }

  function infoDialog(d) {
    var s = C.session(d), mod = C.module(s.moduleId);
    var dialog = h('dialog', { class: 'home-info-dialog', 'aria-label': 'Session information' });
    var inner = h('div', { class: 'home-info-inner' });
    inner.appendChild(h('div', { class: 'sheet-handle', 'aria-hidden': 'true' }));
    var top = h('div', { class: 'home-info-top' });
    top.appendChild(h('span', { class: 'home-module-pill' }, '‹/› ', s.module));
    var close = h('button', { class: 'home-close', type: 'button', 'aria-label': 'Close information', text: '×' });
    close.addEventListener('click', function () { dialog.close(); });
    top.appendChild(close);
    inner.appendChild(top);
    inner.appendChild(h('h2', { class: 'home-info-title' }, s.title));
    inner.appendChild(h('p', { class: 'home-info-meta' }, 'Day ' + d + ' of ' + U.num(C.total) + '  ·  ' + (s.time || 'Time not specified')));
    if (s.outcome) { inner.appendChild(infoSection('▤', 'Overview', [['Learning objective', s.outcome], ['Overall day', d + ' of ' + U.num(C.total)], ['Topic day', s.moduleDay + ' of ' + s.moduleTotal], ['Topic group', s.module], ['Phase', s.phase], ['Semester', s.semester], ['Domain', s.domain], ['Time', s.time]])); }
    if (s.practice || s.task) { inner.appendChild(infoSection('▣', 'Task', [['What to do', s.task], ['Practice', s.practice], ['Practice type', s.practiceType], ['Platform guidance', s.platform]])); }
    inner.appendChild(infoSection('▣', 'Learning', [['Module', s.module], ['Topic', s.topic], ['Learning objective', s.outcome], ['Exit check', s.mastery], ['Revision', s.revision]]));
    var resources = [];
    if (s.resource) { resources.push(['Resource', s.resource]); }
    if (s.resourceLinks && s.resourceLinks.length) {
      var links = h('div', { class: 'home-info-links' });
      s.resourceLinks.forEach(function (url) {
        var a = h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: url });
        links.appendChild(a);
      });
      resources.push(['Links', links]);
    }
    if (resources.length) { inner.appendChild(infoSection('↗', 'Resource', resources)); }
    var qrows = (s.questionIds || []).map(function (id) { var q = C.question(id); return q ? [id, q.title] : null; }).filter(Boolean);
    if (qrows.length || (s.problemLinks && s.problemLinks.length)) {
      var plinks = h('div', { class: 'home-info-links' });
      (s.problemLinks || []).forEach(function (url) { plinks.appendChild(h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: url })); });
      inner.appendChild(infoSection('▣', 'Practice questions', qrows.concat(plinks.childNodes.length ? [['Problem links', plinks]] : [])));
    }
    var project = s.projectId ? C.project(s.projectId) : null;
    var projectRows = [];
    if (project) { projectRows.push(['Project', project.name]); }
    projectRows.push(['Checkpoint', s.checkpoint], ['Project action', s.projectAction], ['Folder / file', s.folder], ['GitHub action', s.github]);
    inner.appendChild(infoSection('▰', project ? 'Project' : 'Practice and workflow', projectRows));
    inner.appendChild(infoSection('▱', 'Revision and mastery', [['Revision instruction', s.revision], ['Mastery check', s.mastery]]));
    if (s.workbookStatus || s.workbookRemarks) {
      inner.appendChild(infoSection('ⓘ', 'Workbook notes', [['Workbook status', s.workbookStatus], ['Workbook remarks', s.workbookRemarks]]));
    }
    dialog.appendChild(inner);
    dialog.addEventListener('click', function (ev) {
      if (ev.target === dialog) { dialog.close(); }
    });
    document.body.appendChild(dialog);
    dialog.addEventListener('close', function () { dialog.remove(); });
    Gestures.dragDismiss(dialog, inner, function () { dialog.close(); });   // swipe down to dismiss
    return dialog;
  }

  function infoSection(icon, title, rows) {
    var section = h('section', { class: 'home-info-section' });
    section.appendChild(h('h3', { class: 'home-info-heading' }, h('span', { class: 'home-info-icon' }, icon), title));
    rows.forEach(function (pair) {
      var value = pair[1];
      if (value === null || value === undefined || value === '') { return; }
      var row = h('div', { class: 'home-info-row' });
      row.appendChild(h('span', { class: 'home-info-label' }, pair[0]));
      row.appendChild(h('div', { class: 'home-info-value' }, value));
      section.appendChild(row);
    });
    return section;
  }

  function render() {
    if (U.route('today') === null) { return; }
    root.textContent = '';
    var d = currentDay(), s = C.session(d);
    if (!s) { root.appendChild(h('p', { class: 'empty' }, 'No session data found.')); return; }
    selectedDay = d;

    var page = h('div', { class: 'home-page' });
    var card = h('section', { class: 'home-day-card' });
    card.appendChild(h('p', { class: 'home-date-label' }, s.phase));
    card.appendChild(h('div', { class: 'home-module-pill' }, '‹/› ', s.module));
    card.appendChild(h('div', { class: 'home-symbol' }, '✦'));
    card.appendChild(h('h2', { class: 'home-day-title' }, s.title));
    card.appendChild(h('p', { class: 'home-day-count' }, 'Day ' + d + ' of ' + U.num(C.total)));
    card.appendChild(h('p', { class: 'home-day-time' }, '◷  ', s.time || 'Time not specified'));
    card.appendChild(h('span', { class: 'home-status' }, statusLabel(d)));
    if (enterDir) { card.classList.add('enter-' + enterDir); enterDir = null; }
    // Swipe the card: left = following session, right = previous session (never changes completion status)
    Gestures.swipeX(card, {
      enabled: function () { return !document.querySelector('dialog[open]'); },
      onLeft: function () { if (d < C.total) { enterDir = 'right'; U.go('#today/' + (d + 1)); } },
      onRight: function () { if (d > 1) { enterDir = 'left'; U.go('#today/' + (d - 1)); } }
    });
    card.appendChild(h('p', { class: 'home-swipe-hint', 'aria-hidden': 'true' }, '‹  swipe for previous / next  ›'));
    page.appendChild(card);

    var actions = h('div', { class: 'home-action-row' });
    var done = h('button', { class: 'home-btn primary', type: 'button', text: A.status(d) === 'completed' ? '✓  Completed' : '✓  Done' });
    done.disabled = A.status(d) === 'completed';
    done.addEventListener('click', function () {
      done.disabled = true;
      // Stay on this session after Done so the Undo button stays within reach (use Next to continue).
      A.markDone(d).then(function () { U.go('#today/' + d); V.refresh(); }, function (e) {
        done.disabled = false; alert('Could not save: ' + ((e && e.message) || e));
      });
    });
    actions.appendChild(done);
    if (A.status(d) === 'completed') {   // undo "Done": reopens the session (the old completion record is kept, marked reopened)
      actions.classList.add('two');
      var undo = h('button', { class: 'home-btn undo', type: 'button', text: '↺  Undo done' });
      undo.addEventListener('click', function () {
        undo.disabled = true;
        A.reopen(d).then(function () { render(); V.refresh(); }, function (e) {
          undo.disabled = false; alert('Could not undo: ' + ((e && e.message) || e));
        });
      });
      actions.appendChild(undo);
    }
    page.appendChild(actions);

    var nav = h('div', { class: 'home-nav-row' });
    var prev = h('button', { class: 'home-btn secondary', type: 'button', text: '‹  Previous' });
    prev.disabled = d === 1;
    prev.addEventListener('click', function () { if (d > 1) { enterDir = 'left'; U.go('#today/' + (d - 1)); } });
    var info = h('button', { class: 'home-btn info', type: 'button', text: 'ⓘ  Info' });
    info.addEventListener('click', function () { var dlg = infoDialog(d); dlg.showModal(); });
    var next = h('button', { class: 'home-btn secondary', type: 'button', text: 'Next  ›' });
    next.disabled = d === C.total;
    next.addEventListener('click', function () { if (d < C.total) { enterDir = 'right'; U.go('#today/' + (d + 1)); } });
    nav.appendChild(prev); nav.appendChild(info); nav.appendChild(next);
    page.appendChild(nav);
    page.appendChild(notesSection(d));
    root.appendChild(page);
  }

  Promise.all([C.ready, A.ready]).then(render).catch(function (e) {
    root.textContent = 'Could not load: ' + e.message;
  });
  window.addEventListener('hashchange', function () {
    if (U.route('today') !== null) { Promise.all([C.ready, A.ready]).then(render); }
  });
  window.addEventListener('cur-changed', function () {
    if (U.route('today') !== null) { render(); }
  });
})();
