// Today card, Previous/Next, and the Info sheet. Saves nothing yet.

(function () {
  'use strict';

  var D = window.RoadmapData;
  var box = document.getElementById('today-card');
  var sheet = document.getElementById('info-sheet');
  var sheetTitle = document.getElementById('info-title');
  var sheetBody = document.getElementById('info-body');
  var index = 0;

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

    var card = el('article', 'day-card');
    card.appendChild(el('p', 'card-date', D.formatDate(e.date)));
    card.appendChild(el('h2', 'card-group', e.group));
    var sym = el('p', 'card-symbol', e.symbol);
    sym.setAttribute('aria-hidden', 'true');
    card.appendChild(sym);
    card.appendChild(el('p', 'card-title', D.titleOf(e)));
    card.appendChild(el('p', 'card-meta', 'Day ' + e.day + ' of ' + D.entries.length));
    if (e.time) { card.appendChild(el('p', 'card-meta', e.time)); }
    var st = el('p', 'status');
    var mark = el('span', '', '○');
    mark.setAttribute('aria-hidden', 'true');
    st.appendChild(mark);
    st.appendChild(document.createTextNode(' Pending'));
    card.appendChild(st);
    box.appendChild(card);

    var row = el('div', 'actions');
    row.appendChild(button('Previous', '', function () { go(-1); }, index === 0));
    row.appendChild(button('Info', 'primary', openInfo));
    row.appendChild(button('Next', '', function () { go(1); }, index === D.entries.length - 1));
    box.appendChild(row);
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
    addLine('Overall day', e.day + ' of ' + D.entries.length);
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

  D.ready.then(function () {
    index = todayIndex();
    render();
  }).catch(function (err) {
    box.textContent = '';
    box.appendChild(el('p', 'empty', 'Could not load the roadmap: ' + err.message));
  });
})();
