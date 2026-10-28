// Stage 3: the Today card, Previous/Next, and the Info sheet.
// Reads data/roadmap.json and data/display-titles.json. Saves nothing yet.

(function () {
  'use strict';

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var box = document.getElementById('today-card');
  var sheet = document.getElementById('info-sheet');
  var sheetTitle = document.getElementById('info-title');
  var sheetBody = document.getElementById('info-body');

  var entries = [];
  var titles = {};
  var index = 0;

  function two(n) { return n < 10 ? '0' + n : String(n); }

  function formatDate(iso) {
    var p = iso.split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function titleOf(e) {
    var o = titles[e.day];
    if (!o) { return e.title; }
    return o.showNumber ? o.title + ' ' + two(e.topicDay) : o.title;
  }

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
    var n = new Date();
    var iso = n.getFullYear() + '-' + two(n.getMonth() + 1) + '-' + two(n.getDate());
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].date === iso) { return i; }
    }
    return iso < entries[0].date ? 0 : entries.length - 1;
  }

  function render() {
    var e = entries[index];
    box.textContent = '';

    var card = el('article', 'day-card');
    card.appendChild(el('p', 'card-date', formatDate(e.date)));
    card.appendChild(el('h2', 'card-group', e.group));
    var sym = el('p', 'card-symbol', e.symbol);
    sym.setAttribute('aria-hidden', 'true');
    card.appendChild(sym);
    card.appendChild(el('p', 'card-title', titleOf(e)));
    card.appendChild(el('p', 'card-meta', 'Day ' + e.day + ' of ' + entries.length));
    if (e.time) { card.appendChild(el('p', 'card-meta', e.time)); }
    var st = el('p', 'status');
    st.appendChild(el('span', '', '○'));
    st.lastChild.setAttribute('aria-hidden', 'true');
    st.appendChild(document.createTextNode(' Pending'));
    card.appendChild(st);
    box.appendChild(card);

    var row = el('div', 'actions');
    row.appendChild(button('Previous', '', function () { go(-1); }, index === 0));
    row.appendChild(button('Info', 'primary', openInfo));
    row.appendChild(button('Next', '', function () { go(1); }, index === entries.length - 1));
    box.appendChild(row);
  }

  function go(step) {
    var next = index + step;
    if (next < 0 || next >= entries.length) { return; }
    index = next;
    render();
    window.scrollTo(0, 0);
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
    var e = entries[index];
    sheetTitle.textContent = titleOf(e);
    sheetBody.textContent = '';
    addLine('Overall day', e.day + ' of ' + entries.length);
    addLine('Topic day', two(e.topicDay));
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

  function load(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) { throw new Error(path + ' (' + r.status + ')'); }
      return r.json();
    });
  }

  Promise.all([load('data/roadmap.json'), load('data/display-titles.json')])
    .then(function (res) {
      entries = res[0].entries;
      titles = res[1];
      index = todayIndex();
      render();
    })
    .catch(function (err) {
      box.textContent = '';
      box.appendChild(el('p', 'empty', 'Could not load the roadmap: ' + err.message));
    });
})();
