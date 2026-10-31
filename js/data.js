// Loads the curriculum (generated from the workbook by tools/build_data.py). Day numbers are permanent IDs, not dates.
(function () {
  'use strict';
  var C = { ready: null, total: 0, sessions: [], modules: [], projects: [], practice: [], extras: {} };
  C.session = function (d) { return C.sessions[d - 1] || null; };
  C.module = function (id) { return C.modules.filter(function (m) { return m.id === id; })[0] || null; };
  C.project = function (id) { return C.projects.filter(function (p) { return p.id === id; })[0] || null; };
  C.groups = function () {   // blocks of 30, computed from the total
    var g = [], n = C.meta.groupSize;
    for (var s = 1; s <= C.total; s += n) { g.push({ index: g.length, from: s, to: Math.min(s + n - 1, C.total) }); }
    return g;
  };
  C.groupOf = function (day) { return Math.floor((day - 1) / C.meta.groupSize); };
  C.ready = fetch('data/curriculum.json').then(function (r) { if (!r.ok) { throw new Error('curriculum.json (' + r.status + ')'); } return r.json(); })
    .then(function (j) { C.meta = j.meta; C.sessions = j.sessions; C.modules = j.modules; C.projects = j.projects; C.practice = j.practice; C.extras = j.extras; C.total = j.sessions.length; return C; });
  window.Curriculum = C;
})();
