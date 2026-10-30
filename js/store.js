// Local storage in the browser (IndexedDB). Notes belong to calendar DATES.
// Nothing leaves the phone. window.RoadmapStore: notes (getNote, saveNote, deleteNote, allNotes) and progress (allProgress, saveProgress, deleteProgress).

(function () {
  'use strict';

  var DB_NAME = 'java-roadmap';
  var VERSION = 3;
  var OLD_NOTES = 'dayNotes';     // version 1 store (keyed by day number), copied once
  var NOTES = 'dateNotes';
  var PROGRESS = 'progress';     // Done / Skipped / catch-up, keyed by the fixed roadmap day id
  var dbPromise = null;

  function open() {
    if (dbPromise) { return dbPromise; }
    dbPromise = new Promise(function (resolve, reject) {
      var req;
      try { req = indexedDB.open(DB_NAME, VERSION); } catch (e) { reject(e); return; }
      req.onupgradeneeded = function (ev) {
        var db = req.result;
        var tx = req.transaction;
        if (!db.objectStoreNames.contains(NOTES)) { db.createObjectStore(NOTES, { keyPath: 'date' }); }
        if (!db.objectStoreNames.contains(PROGRESS)) { db.createObjectStore(PROGRESS, { keyPath: 'day' }); }
        if (ev.oldVersion < 2 && db.objectStoreNames.contains(OLD_NOTES)) {
          var all = tx.objectStore(OLD_NOTES).getAll();
          all.onsuccess = function () {
            var dest = tx.objectStore(NOTES);
            (all.result || []).forEach(function (n) { if (n && n.date) { dest.put(n); } });
          };
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  function run(mode, action, storeName) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var name = storeName || NOTES;
        var t = db.transaction(name, mode);
        var request = action(t.objectStore(name));
        t.oncomplete = function () { resolve(request ? request.result : undefined); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  if (navigator.storage && navigator.storage.persist) { navigator.storage.persist(); }

  window.RoadmapStore = {
    getNote: function (date) { return run('readonly', function (s) { return s.get(date); }).then(function (r) { return r || null; }); },
    saveNote: function (note) { return run('readwrite', function (s) { return s.put(note); }); },
    deleteNote: function (date) { return run('readwrite', function (s) { return s.delete(date); }); },
    allNotes: function () { return run('readonly', function (s) { return s.getAll(); }).then(function (r) { return r || []; }); },
    allProgress: function () { return run('readonly', function (s) { return s.getAll(); }, PROGRESS).then(function (r) { return r || []; }); },
    saveProgress: function (rec) { return run('readwrite', function (s) { return s.put(rec); }, PROGRESS); },
    deleteProgress: function (day) { return run('readwrite', function (s) { return s.delete(day); }, PROGRESS); }
  };
})();
