// Done / Skipped / catch-up status for learning entries, saved on this phone.
// One record per roadmap day id: { day, scheduled: 'done'|'skipped', scheduledAt,
// catchup: null|'queued'|'done', catchupAt, updatedAt }. Scheduled completion and
// catch-up completion are separate fields, so they can never be confused.

(function () {
  'use strict';

  var S = window.RoadmapStore;
  var D = window.RoadmapData;
  var map = {};
  var api = { unavailable: false };

  function now() { return new Date().toISOString(); }

  // Learning entries = the real study days. Pause days and exam-buffer days are excluded.
  api.isLearning = function (e) { return !e.added && e.title.indexOf('Exam Buffer') !== 0; };

  // 'pending' | 'done' | 'skipped' (waiting in the catch-up queue) | 'caughtup'
  api.state = function (day) {
    var r = map[day];
    if (!r || !r.scheduled) { return 'pending'; }
    if (r.scheduled === 'done') { return 'done'; }
    return r.catchup === 'done' ? 'caughtup' : 'skipped';
  };
  api.record = function (day) { return map[day] || null; };

  function save(rec) {
    rec.updatedAt = now();
    return S.saveProgress(rec).then(function () { map[rec.day] = rec; return rec; });
  }

  api.markDone = function (day) {
    return save({ day: day, scheduled: 'done', scheduledAt: now(), catchup: null, catchupAt: null });
  };
  api.markSkipped = function (day) {
    if (map[day] && map[day].scheduled === 'skipped') { return Promise.resolve(map[day]); }   // no duplicate queue entry
    return save({ day: day, scheduled: 'skipped', scheduledAt: now(), catchup: 'queued', catchupAt: null });
  };
  api.markCaughtUp = function (day) {
    var r = map[day];
    if (!r || r.scheduled !== 'skipped') { return Promise.resolve(r || null); }
    return save({ day: day, scheduled: 'skipped', scheduledAt: r.scheduledAt, catchup: 'done', catchupAt: now() });
  };
  api.reset = function (day) {
    return S.deleteProgress(day).then(function () { delete map[day]; });
  };

  api.load = function () {
    return S.allProgress().then(function (all) {
      map = {};
      all.forEach(function (r) { map[r.day] = r; });
    }).catch(function () { map = {}; api.unavailable = true; });
  };

  // Counts for any list of entries (only learning entries are counted).
  api.tally = function (entries) {
    var t = { total: 0, done: 0, skipped: 0, queued: 0, caughtup: 0, pending: 0 };
    entries.forEach(function (e) {
      if (!api.isLearning(e)) { return; }
      t.total++;
      var s = api.state(e.day);
      if (s === 'done') { t.done++; }
      else if (s === 'skipped') { t.skipped++; t.queued++; }
      else if (s === 'caughtup') { t.skipped++; t.caughtup++; }
      else { t.pending++; }
    });
    t.completed = t.done + t.caughtup;
    t.percent = t.total ? Math.round(t.completed / t.total * 100) : 0;
    return t;
  };

  api.ready = D.ready.then(api.load);
  window.RoadmapStatus = api;
})();
