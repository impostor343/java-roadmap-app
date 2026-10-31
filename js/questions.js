// Questions tab: the workbook Practice Bank (31 entries). Your own status and notes per question; no record = Not Started.
(function () {
  'use strict';
  var C = window.Curriculum, A = window.State, V = window.SessionView, h = U.h, root = document.getElementById('questions-root');
  var QS = ['not-started', 'in-progress', 'solved'], filter = 'all', q = '', open = {}, limit = 50;
  function render() {
    root.textContent = '';
    var ps = A.practiceStats();
    root.appendChild(h('section', { class: 'card' }, h('h3', { text: 'Practice questions' }), h('p', { class: 'bigday', text: ps.solved + ' / ' + ps.total + ' solved' }), U.bar(ps.percent), ps.inProgress ? h('p', { class: 'muted', text: ps.inProgress + ' in progress' }) : null));
    var search = h('input', { class: 'sel', type: 'search', placeholder: 'Search questions…', value: q, 'aria-label': 'Search questions', oninput: function () { q = this.value; limit = 50; renderList(); } });
    var seg = h('div', { class: 'chips' }); [['all', 'All']].concat(QS.map(function (s) { return [s, U.STATUS[s]]; })).forEach(function (f) { seg.appendChild(h('button', { type: 'button', class: 'gchip' + (filter === f[0] ? ' on' : ''), onclick: function () { filter = f[0]; limit = 50; render(); }, text: f[1] })); });
    root.appendChild(search); root.appendChild(seg);
    var box = h('div', { id: 'qlist' }); root.appendChild(box); renderList();
  }
  function renderList() {
    var box = document.getElementById('qlist'); if (!box) { return; } box.textContent = '';
    var shown = C.practice.filter(function (p) { var st = A.practiceRec(p.id).status; return (filter === 'all' || st === filter) && (!q || (p.title + ' ' + p.topic + ' ' + p.platform + ' ' + p.id).toLowerCase().indexOf(q.toLowerCase()) !== -1); });
    if (!shown.length) { box.appendChild(h('p', { class: 'muted', text: 'No questions match.' })); return; }
    var total = shown.length; box.appendChild(h('p', { class: 'muted small', text: U.num(total) + ' questions' + (total > limit ? ', showing the first ' + limit : '') })); shown = shown.slice(0, limit);
    shown.forEach(function (p) {
      var rec = A.practiceRec(p.id), el = h('section', { class: 'card q st-' + rec.status });
      el.appendChild(h('div', { class: 'vhead' }, h('div', {}, h('strong', { text: p.id + ' · ' + p.title }), h('div', { class: 'muted small', text: p.topicId + ' ' + p.topic + ' · ' + p.platform + ' · ' + p.difficulty })), h('button', { type: 'button', class: 'link', onclick: function () { open[p.id] = !open[p.id]; renderList(); }, text: open[p.id] ? 'Hide' : 'Open' })));
      if (open[p.id]) {
        [['Prerequisites', p.prerequisites], ['How to practise', p.how]].forEach(function (r) { if (r[1]) { el.appendChild(h('div', { class: 'row' }, h('span', { class: 'lab', text: r[0] }), h('span', { class: 'val', text: r[1] }))); } });
        if (p.url) { el.appendChild(h('a', { href: p.url, target: '_blank', rel: 'noopener', text: p.url })); }
        var sel = h('select', { class: 'sel', 'aria-label': 'Status', onchange: function () { A.savePractice(p.id, { status: this.value }).then(function () { render(); V.refresh(); }); } });
        QS.forEach(function (s) { var o = h('option', { value: s, text: U.STATUS[s] }); if (s === rec.status) { o.selected = true; } sel.appendChild(o); }); el.appendChild(sel);
        if (rec.solvedAt) { el.appendChild(h('p', { class: 'muted small', text: 'Solved: ' + U.stamp(rec.solvedAt) })); }
        var n = h('textarea', { class: 'notes', rows: 3, placeholder: 'Mistakes and insights…' }); n.value = rec.notes || ''; n.addEventListener('blur', function () { A.savePractice(p.id, { notes: n.value }); }); el.appendChild(n);
      }
      box.appendChild(el); });
    if (total > limit) { box.appendChild(h('button', { type: 'button', class: 'btn ghost', text: 'Show more', onclick: function () { limit += 50; renderList(); } })); }
  }
  Promise.all([C.ready, A.ready]).then(render).catch(function (e) { root.textContent = 'Could not load: ' + e.message; });
  window.addEventListener('cur-changed', function () { if (U.route('questions') !== null && !document.activeElement.matches('textarea,input')) { render(); } });
})();
