// Resources tab: free learning links grouped by area, your own Done marks, and an offline PDF for each resource.
// A PDF can be attached on the phone (kept in IndexedDB on this device) or bundled in the repo (set "pdf" in data/free-resources.json).
(function () {
  'use strict';
  var S = window.Store, h = U.h, root = document.getElementById('resources-root');
  var items = [], state = {}, hasFile = {}, q = '', area = 'All', filter = 'all', blobUrl = null;
  var AREA_ICON = { 'Git/GitHub': 'branch', Java: 'cup', DSA: 'sitemap', SQL: 'database', JDBC: 'database', DBMS: 'database', Spring: 'link', Testing: 'task', Web: 'globe', JavaScript: 'globe', React: 'monitor', TypeScript: 'code',
    C: 'cpu', Python: 'code', OS: 'cpu', Networks: 'link', 'Software Engineering': 'layers', 'Design Patterns': 'layers', Security: 'shield', DevOps: 'cloud', Cloud: 'cloud', 'System Design': 'sitemap', 'Distributed Systems': 'sitemap', 'Data/ML': 'chart', Android: 'phone' };
  function ic(n) { return window.Icons.make(n); }
  function iconOf(a) { return AREA_ICON[a] || 'book'; }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } }
  function areas() { var a = []; items.forEach(function (x) { if (a.indexOf(x.area) === -1) { a.push(x.area); } }); return a; }
  function isDone(id) { return !!(state[id] && state[id].done); }
  function say(t) { var s = document.getElementById('res-status'); if (s) { s.textContent = t; } }

  function toggleDone(it) { var rec = state[it.id] || { id: it.id }; rec.done = !rec.done; rec.updatedAt = new Date().toISOString(); state[it.id] = rec; return S.put('resourceState', rec).then(render); }
  function attach(it, file) {
    if (!file) { return; }
    if (file.type && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) { say('Please choose a PDF file.'); return; }
    S.put('resourceFiles', { id: it.id, name: file.name, size: file.size, savedAt: new Date().toISOString(), blob: file }).then(function () { hasFile[it.id] = { name: file.name, size: file.size }; render(); say('Saved "' + file.name + '" for offline use on this device.'); })
      .catch(function (e) { say('Could not save the PDF: ' + (e && e.message || e)); });
  }
  function openFile(it) {
    S.one('resourceFiles', it.id).then(function (r) {
      if (!r || !r.blob) { say('No PDF found for this resource.'); return; }
      if (blobUrl) { URL.revokeObjectURL(blobUrl); } blobUrl = URL.createObjectURL(r.blob);
      var w = window.open(blobUrl, '_blank'); if (!w) { location.href = blobUrl; }
    }).catch(function (e) { say('Could not open the PDF: ' + (e && e.message || e)); });
  }
  function removeFile(it) { if (!confirm('Remove the offline PDF for "' + it.name + '" from this device?')) { return; } S.del('resourceFiles', it.id).then(function () { delete hasFile[it.id]; render(); }); }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }

  function card(it) {
    var pdf = hasFile[it.id], done = isDone(it.id), input = h('input', { type: 'file', accept: 'application/pdf,.pdf', hidden: true, onchange: function () { attach(it, this.files[0]); this.value = ''; } });
    var bundled = it.pdf ? h('a', { class: 'btn ghost sm', href: it.pdf, target: '_blank', rel: 'noopener' }, ic('file'), ' Open bundled PDF') : null;
    return h('article', { class: 'rs-card' + (done ? ' is-done' : '') },
      h('div', { class: 'rs-top' }, h('span', { class: 'rs-ic' }, ic(iconOf(it.area))),
        h('div', { class: 'rs-main' }, h('h3', { class: 'rs-name', text: it.name }), h('p', { class: 'rs-meta' }, h('span', { class: 'rs-area', text: it.area }), ' · ' + host(it.url))),
        h('button', { type: 'button', class: 'rs-check', 'aria-pressed': done ? 'true' : 'false', 'aria-label': (done ? 'Unmark ' : 'Mark ') + it.name + ' as done', onclick: function () { toggleDone(it); } }, ic('check'))),
      h('div', { class: 'rs-actions' },
        h('a', { class: 'btn primary sm', href: it.url, target: '_blank', rel: 'noopener' }, 'Open ', ic('external')),
        bundled,
        pdf ? h('button', { type: 'button', class: 'btn ghost sm', onclick: function () { openFile(it); } }, ic('file'), ' Offline PDF') : null,
        h('label', { class: 'btn ghost sm' }, ic(pdf ? 'refresh' : 'plus'), pdf ? ' Replace' : ' Attach PDF', input),
        pdf ? h('button', { type: 'button', class: 'btn ghost sm danger', 'aria-label': 'Remove offline PDF', onclick: function () { removeFile(it); } }, ic('trash')) : null),
      pdf ? h('p', { class: 'rs-file', text: pdf.name + ' · ' + size(pdf.size) }) : null);
  }

  function render() {
    root.textContent = '';
    var total = items.length, done = items.filter(function (x) { return isDone(x.id); }).length, withPdf = Object.keys(hasFile).length + items.filter(function (x) { return x.pdf && !hasFile[x.id]; }).length;
    root.appendChild(h('section', { class: 'rs-hero' }, h('div', {}, h('h2', { text: 'Free resources' }), h('p', { text: total + ' hand-picked free sources across ' + areas().length + ' areas.' })),
      h('div', { class: 'rs-stats' }, h('span', {}, h('strong', { text: done + '/' + total }), ' done'), h('span', {}, h('strong', { text: String(withPdf) }), ' offline PDFs'))));
    var search = h('input', { type: 'search', class: 'rs-search', placeholder: 'Search resources…', 'aria-label': 'Search resources', value: q });
    search.addEventListener('input', function () { q = search.value; list(); });
    root.appendChild(search);
    var chips = h('div', { class: 'rs-chips', role: 'group', 'aria-label': 'Filter by area' });
    ['All'].concat(areas()).forEach(function (a) { chips.appendChild(h('button', { type: 'button', class: 'rs-chip', 'aria-pressed': a === area ? 'true' : 'false', text: a, onclick: function () { area = a; render(); } })); });
    root.appendChild(chips);
    var seg = h('div', { class: 'rs-seg', role: 'group', 'aria-label': 'Show' });
    [['all', 'All'], ['todo', 'Not done'], ['done', 'Done'], ['pdf', 'Has PDF']].forEach(function (f) { seg.appendChild(h('button', { type: 'button', 'aria-pressed': filter === f[0] ? 'true' : 'false', text: f[1], onclick: function () { filter = f[0]; render(); } })); });
    root.appendChild(seg);
    root.appendChild(h('p', { id: 'res-status', class: 'muted small', role: 'status' }));
    root.appendChild(h('div', { id: 'res-list', class: 'rs-list' }));
    root.appendChild(h('p', { class: 'muted small rs-foot', text: 'Attached PDFs stay on this device only (they are too large for the JSON backup). Keep the original files too.' }));
    list();
  }
  function list() {
    var box = document.getElementById('res-list'); if (!box) { return; } box.textContent = '';
    var t = q.trim().toLowerCase(), shown = items.filter(function (x) {
      if (area !== 'All' && x.area !== area) { return false; }
      if (filter === 'done' && !isDone(x.id)) { return false; } if (filter === 'todo' && isDone(x.id)) { return false; } if (filter === 'pdf' && !(hasFile[x.id] || x.pdf)) { return false; }
      return !t || (x.name + ' ' + x.area + ' ' + x.url).toLowerCase().indexOf(t) !== -1; });
    if (!shown.length) { box.appendChild(h('p', { class: 'empty', text: 'Nothing matches.' })); return; }
    shown.forEach(function (x) { box.appendChild(card(x)); });
  }

  Promise.all([fetch('data/free-resources.json').then(function (r) { return r.json(); }), S.all('resourceState').catch(function () { return []; }), S.all('resourceFiles').catch(function () { return []; })]).then(function (r) {
    items = r[0].items || []; r[1].forEach(function (x) { state[x.id] = x; }); r[2].forEach(function (x) { hasFile[x.id] = { name: x.name, size: x.size }; }); render();
  }).catch(function (e) { root.textContent = 'Could not load resources: ' + e.message; });
})();
