// Today card, Previous/Next, and the Info sheet. Saves nothing yet.

(function () {
  'use strict';

  var D = window.RoadmapData;
  var box = document.getElementById('today-card');
  var sheet = document.getElementById('info-sheet');
  var sheetTitle = document.getElementById('info-title');
  var sheetBody = document.getElementById('info-body');
  var ST = window.RoadmapStatus;
  var index = 0;
  var LABELS = { pending: ['○', 'Pending'], done: ['✓', 'Done'], skipped: ['→', 'Skipped, catch-up waiting'], caughtup: ['↻', 'Caught up'] };

  window.TodayView = { showDay: showDay };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }

  function button(label, cls, onClick, disabled) {
    var b = el('button', 'btn ' + cls, label);
    b.type = 'button';
    b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  function todayIndex() {
    var iso = D.todayIso();
    for (var i = 0; i < D.entries.length; i++) {
      if (D.entries[i].date === iso) { return i; }
    }
    return iso < D.entries[0].date ? 0 : D.entries.length - 1;
  }

  function render() {
    var e = D.entries[index];
    box.textContent = '';
    if (ST.error) { box.appendChild(el('p', 'warn', 'Your saved progress could not be loaded. ' + ST.error)); }

    box.appendChild(makeStrip());

    var card = el('article', 'day-card');
    card.appendChild(el('p', 'card-date', D.formatDate(e.date) + (e.date === D.todayIso() ? ' (today)' : '')));
    card.appendChild(el('h2', 'card-group', e.group));
    var sym = el('p', 'card-symbol', e.symbol);
    sym.setAttribute('aria-hidden', 'true');
    card.appendChild(sym);
    card.appendChild(el('p', 'card-title', D.titleOf(e)));
    card.appendChild(el('p', 'card-meta', 'Day ' + e.seq + ' of ' + D.entries.length));
    if (e.time) { card.appendChild(el('p', 'card-meta', e.time)); }
    card.appendChild(statusChip(e));
    box.appendChild(card);
    var controls = makeStatusControls(e);
    if (controls) { box.appendChild(controls); }

    var row = el('div', 'actions');
    row.appendChild(button('Previous', '', function () { go(-1); }, index === 0));
    row.appendChild(button('Info', 'primary', openInfo));
    row.appendChild(button('Next', '', function () { go(1); }, index === D.entries.length - 1));
    box.appendChild(row);
    box.appendChild(makeJump(e));

    var notesHost = el('div');
    box.appendChild(notesHost);
    window.DayNotes.mount(notesHost, e, 'today');
  }

  function statusChip(e) {
    var st = el('p', 'status');
    if (!ST.isLearning(e)) { st.textContent = e.added ? 'Pause day' : 'Exam buffer'; return st; }
    var s = ST.state(e.day);
    st.setAttribute('data-state', s);
    var mark = el('span', '', LABELS[s][0]);
    mark.setAttribute('aria-hidden', 'true');
    st.appendChild(mark);
    st.appendChild(document.createTextNode(' ' + LABELS[s][1]));
    return st;
  }

  function makeStatusControls(e) {
    if (!ST.isLearning(e)) { return null; }
    var s = ST.state(e.day);
    var wrap = el('div', 'status-controls');
    function act(fn) { return function () { fn(e.day).then(render, render); }; }
    var row = el('div', 'actions two');
    if (s === 'pending') {
      row.appendChild(button('Done', 'primary', act(ST.markDone)));
      row.appendChild(button('Skipped', '', act(ST.markSkipped)));
    } else if (s === 'skipped') {
      row.appendChild(button('Mark caught up', 'primary', act(ST.markCaughtUp)));
      row.appendChild(button('Undo', '', act(ST.reset)));
    } else {
      row.appendChild(button('Undo', '', act(ST.reset)));
    }
    wrap.appendChild(row);
    if (s === 'done') {
      var link = button('Add a remark', 'link', function () {
        var ta = box.querySelector('textarea[id$="-remarks"]');
        if (ta) { ta.focus(); }
      });
      wrap.appendChild(link);
    }
    return wrap;
  }

  function makeStrip() {
    var strip = el('div', 'day-strip');
    strip.setAttribute('role', 'group');
    strip.setAttribute('aria-label', 'Yesterday, today and tomorrow');
    var names = ['Yesterday', 'Today', 'Tomorrow'];
    [-1, 0, 1].forEach(function (off, k) {
      var iso = D.shiftIso(D.todayIso(), off);
      var i = D.indexOfDate(iso);
      var b = el('button', 'strip-btn');
      b.type = 'button';
      b.appendChild(el('span', '', names[k]));
      b.appendChild(el('small', '', D.shortDate(iso)));
      b.disabled = i < 0;
      if (i === index) { b.setAttribute('aria-current', 'true'); }
      b.addEventListener('click', function () { index = i; render(); window.scrollTo(0, 0); });
      strip.appendChild(b);
    });
    return strip;
  }

  function makeJump(e) {
    var row = el('div', 'jump');
    var label = el('label', '', 'Jump to date');
    label.htmlFor = 'jump-date';
    var input = el('input');
    input.type = 'date';
    input.id = 'jump-date';
    input.min = D.entries[0].date;
    input.max = D.entries[D.entries.length - 1].date;
    input.value = e.date;
    input.addEventListener('change', function () {
      var i = D.indexOfDate(input.value);
      if (i >= 0) { index = i; render(); window.scrollTo(0, 0); }
    });
    row.appendChild(label);
    row.appendChild(input);
    return row;
  }

  function go(step) {
    var next = index + step;
    if (next < 0 || next >= D.entries.length) { return; }
    index = next;
    render();
    window.scrollTo(0, 0);
  }

  function showDay(day) {
    for (var i = 0; i < D.entries.length; i++) {
      if (D.entries[i].day === day) { index = i; render(); return; }
    }
  }

  function addLine(label, value) {
    if (!value) { return; }
    var p = el('p', 'info-line');
    p.appendChild(el('b', '', label + ': '));
    if (typeof value === 'string') { p.appendChild(document.createTextNode(value)); }
    else { p.appendChild(value); }
    sheetBody.appendChild(p);
  }

  function resourceNode(r) {
    if (!r || !r.text) { return null; }
    if (!r.url) { return document.createTextNode(r.text); }
    var a = el('a', '', r.name || r.url);
    a.href = r.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  function openInfo() {
    var e = D.entries[index];
    sheetTitle.textContent = D.titleOf(e);
    sheetBody.textContent = '';
    addLine('Overall day', e.seq + ' of ' + D.entries.length);
    addLine('Topic day', D.two(e.topicDay));
    addLine('Topic group', e.group);
    addLine('Phase', e.phase);
    addLine('Time', e.time);
    addLine('Topics', e.topics);
    addLine('Task', e.task);
    addLine('Resource', resourceNode(e.resource));
    addLine('Practice', e.practice);
    addLine('Project', e.project);
    addLine('Folder', e.folder);
    addLine('Publish', e.publish);
    addLine('Notes', e.projectNotes);
    sheet.showModal();
  }

  document.getElementById('info-close').addEventListener('click', function () { sheet.close(); });
  sheet.addEventListener('click', function (ev) { if (ev.target === sheet) { sheet.close(); } });

  Promise.all([D.ready, ST.ready]).then(function () {
    index = todayIndex();
    render();
  }).catch(function (err) {
    box.textContent = '';
    box.appendChild(el('p', 'empty', 'Could not load the roadmap: ' + err.message));
  });
})();
