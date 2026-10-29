// Local storage in the browser (IndexedDB). Notes are saved per roadmap day.
// Nothing leaves the phone. window.RoadmapStore: getNote, saveNote, deleteNote, allNotes.

(function () {
  'use strict';

  var DB_NAME = 'java-roadmap';
  var VERSION = 1;
  var NOTES = 'dayNotes';
  var dbPromise = null;

  function open() {
    if (dbPromise) { return dbPromise; }
    dbPromise = new Promise(function (resolve, reject) {
      var req;
      try { req = indexedDB.open(DB_NAME, VERSION); } catch (e) { reject(e); return; }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(NOTES)) { db.createObjectStore(NOTES, { keyPath: 'day' }); }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  function run(mode, action) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(NOTES, mode);
        var request = action(t.objectStore(NOTES));
        t.oncomplete = function () { resolve(request ? request.result : undefined); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  if (navigator.storage && navigator.storage.persist) { navigator.storage.persist(); }

  window.RoadmapStore = {
    getNote: function (day) { return run('readonly', function (s) { return s.get(day); }).then(function (r) { return r || null; }); },
    saveNote: function (note) { return run('readwrite', function (s) { return s.put(note); }); },
    deleteNote: function (day) { return run('readwrite', function (s) { return s.delete(day); }); },
    allNotes: function () { return run('readonly', function (s) { return s.getAll(); }).then(function (r) { return r || []; }); }
  };
})();
