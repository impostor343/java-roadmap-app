// Stage 4: month calendar. Shows the original schedule; saves nothing yet.

(function () {
  'use strict';

  var D = window.RoadmapData;
  var root = document.getElementById('calendar');
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var LEGEND_ORDER = ['guessing-game', 'banking', 'smart-library', 'inventory', 'task-api', 'semester-planner'];
  var CHEVRON_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  var CHEVRON_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

  var byDate = {};
  var firstKey, lastKey;     // 'YYYY-MM' of the first and last roadmap month
  var viewKey;               // month being shown
  var selected;              // selected ISO date

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }

  function shiftMonth(key, step) {
    var y = Number(key.slice(0, 4));
    var m = Number(key.slice(5, 7)) - 1 + step;
    y += Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    return y + '-' + D.two(m + 1);
  }

  function iconButton(svg, label, disabled, onClick) {
    var b = el('button', 'icon-btn');
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.innerHTML = svg;          // fixed icon markup only, no user data
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  function draw() {
    var year = Number(viewKey.slice(0, 4));
    var month = Number(viewKey.slice(5, 7)) - 1;
    var today = D.todayIso();
    root.textContent = '';

    var head = el('div', 'cal-head');
    head.appendChild(iconButton(CHEVRON_L, 'Previous month', viewKey === firstKey, function () { viewKey = shiftMonth(viewKey, -1); draw(); }));
    head.appendChild(el('h2', '', MONTHS[month] + ' ' + year));
    head.appendChild(iconButton(CHEVRON_R, 'Next month', viewKey === lastKey, function () { viewKey = shiftMonth(viewKey, 1); draw(); }));
    root.appendChild(head);

    var week = el('div', 'cal-week');
    WEEK.forEach(function (w) { week.appendChild(el('span', '', w)); });
    root.appendChild(week);

    var grid = el('div', 'cal-grid');
    var offset = new Date(year, month, 1).getDay();
    var count = new Date(year, month + 1, 0).getDate();
    for (var b = 0; b < offset; b++) { grid.appendChild(el('div', 'cell blank')); }

    for (var d = 1; d <= count; d++) {
      var iso = viewKey + '-' + D.two(d);
      var e = byDate[iso];
      if (!e) {
        var none = el('div', 'cell none');
        none.appendChild(el('span', 'cell-num', String(d)));
        grid.appendChild(none);
        continue;
      }
      grid.appendChild(makeCell(e, d, iso === today, iso === selected));
    }
    root.appendChild(grid);

    if (byDate[selected]) { root.appendChild(makePreview(byDate[selected], selected === today)); }
    root.appendChild(makeLegend());
  }

  function makeCell(e, d, isToday, isSelected) {
    var b = el('button', 'cell' + (isSelected ? ' selected' : ''));
    b.type = 'button';
    b.setAttribute('aria-label', D.formatDate(e.date) + ', ' + D.titleOf(e) +
      (isToday ? ', today' : '') + (isSelected ? ', selected' : ''));
    if (isSelected) { b.setAttribute('aria-pressed', 'true'); }
    if (e.projectKey) { b.style.background = 'var(--proj-' + e.projectKey + ')'; }
    b.appendChild(el('span', 'cell-num' + (isToday ? ' today' : ''), String(d)));
    var sym = el('span', 'cell-sym', e.symbol);
    sym.setAttribute('aria-hidden', 'true');
    b.appendChild(sym);
    b.appendChild(el('span', 'cell-name', D.plainTitle(e)));
    b.addEventListener('click', function () { selected = e.date; draw(); });
    return b;
  }

  function line(parent, label, value) {
    if (!value) { return; }
    var p = el('p');
    p.appendChild(el('b', '', label + ': '));
    p.appendChild(document.createTextNode(value));
    parent.appendChild(p);
  }

  function makePreview(e, isToday) {
    var box = el('section', 'preview');
    box.setAttribute('aria-label', 'Selected day');
    box.appendChild(el('p', 'card-meta', D.formatDate(e.date) + (isToday ? ' (today)' : '')));
    box.appendChild(el('h3', 'preview-title', e.symbol + ' ' + D.titleOf(e)));
    line(box, 'Day', e.day + ' of ' + D.entries.length + ', ' + e.group);
    line(box, 'Project', e.projectKey ? D.projectNames[e.projectKey] : null);
    line(box, 'Time', e.time);
    line(box, 'Topics', e.topics);
    var open = el('button', 'btn primary', 'Open card');
    open.type = 'button';
    open.addEventListener('click', function () {
      if (window.TodayView) { window.TodayView.showDay(e.day); }
      window.location.hash = '#today';
    });
    box.appendChild(open);
    return box;
  }

  function makeLegend() {
    var present = {};
    D.entries.forEach(function (e) { if (e.projectKey) { present[e.projectKey] = true; } });
    var wrap = el('section', 'legend');
    wrap.appendChild(el('p', 'legend-title', 'Project days'));
    var list = el('ul', 'swatches');
    list.setAttribute('aria-label', 'Project colours');
    LEGEND_ORDER.forEach(function (k) {
      if (!present[k]) { return; }
      var li = el('li');
      li.appendChild(el('span', 'swatch sw-' + k));
      li.appendChild(document.createTextNode(D.projectNames[k]));
      list.appendChild(li);
    });
    wrap.appendChild(list);
    wrap.appendChild(el('p', 'note', 'Plain days are learning or revision days.'));
    return wrap;
  }

  D.ready.then(function () {
    D.entries.forEach(function (e) { byDate[e.date] = e; });
    firstKey = D.entries[0].date.slice(0, 7);
    lastKey = D.entries[D.entries.length - 1].date.slice(0, 7);
    var today = D.todayIso();
    selected = byDate[today] ? today : (today < D.entries[0].date ? D.entries[0].date : D.entries[D.entries.length - 1].date);
    viewKey = selected.slice(0, 7);
    draw();
  }).catch(function (err) {
    root.textContent = '';
    root.appendChild(el('p', 'empty', 'Could not load the calendar: ' + err.message));
  });
})();
