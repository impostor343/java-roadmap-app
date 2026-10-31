// Settings: backup / restore (covers ALL stores, including your earlier-version records) and a read-only view of those earlier records.
(function () {
  'use strict';
  var S = window.Store, h = U.h, root = document.getElementById('settings-root'), FORMAT = 'cse-roadmap-backup', msg = h('p', { class: 'muted', role: 'status' });
  function say(t, bad) { msg.textContent = t; msg.className = bad ? 'err' : 'muted'; }
  function card(t) { return h('section', { class: 'card' }, h('h3', { text: t }), [].slice.call(arguments, 1)); }

  function exportBackup() {
    S.dump().then(function (data) {
      var blob = new Blob([JSON.stringify({ format: FORMAT, version: 5, exportedAt: new Date().toISOString(), stores: data }, null, 1)], { type: 'application/json' });
      var a = h('a', { href: URL.createObjectURL(blob), download: 'cse-roadmap-backup-' + U.todayKey() + '.json' }); document.body.appendChild(a); a.click(); a.remove();
      return S.put('meta', { key: 'lastBackupAt', value: new Date().toISOString() }).then(function () { say('Backup saved to your downloads. It contains every record, including earlier-version records.'); });
    }).catch(function (e) { say('Backup failed: ' + e.message, true); });
  }
  function restore(file) {
    var r = new FileReader();
    r.onload = function () {
      var j; try { j = JSON.parse(r.result); } catch (e) { say('That file is not valid JSON.', true); return; }
      if (!j || j.format !== FORMAT || !j.stores || typeof j.stores !== 'object') { say('That is not a backup made by this app.', true); return; }
      var names = Object.keys(j.stores).filter(function (n) { return S.LEGACY.concat(S.NEW).indexOf(n) !== -1 && Array.isArray(j.stores[n]); });
      if (!names.length) { say('The backup contains no usable data.', true); return; }
      var summary = names.map(function (n) { return n + ': ' + j.stores[n].length; }).join(', ');
      if (!confirm('Replace the data on this device with this backup (' + (j.exportedAt || 'unknown date') + ')?\n\n' + summary + '\n\nTip: export a backup of the current data first.')) { return; }
      S.names().then(function (have) { return Promise.all(names.filter(function (n) { return have.indexOf(n) !== -1; }).map(function (n) { return S.replace(n, j.stores[n]); })); }).then(function () { say('Backup restored. Reloading…'); setTimeout(function () { location.reload(); }, 800); }).catch(function (e) { say('Restore failed: ' + e.message, true); });
    };
    r.readAsText(file);
  }

  function legacy() {
    var box = card('Earlier records (kept, read-only)'); var info = h('p', { class: 'muted small', text: 'Loading…' }); box.appendChild(info);
    Promise.all([S.all('progress').catch(function () { return []; }), S.all('dateNotes').catch(function () { return []; }), S.all('questionState').catch(function () { return []; }), fetch('data/roadmap.json').then(function (r) { return r.json(); }).catch(function () { return { entries: [] }; })]).then(function (res) {
      var prog = res[0], notes = res[1], qs = res[2], old = {}; res[3].entries.forEach(function (e) { old[e.day] = e; });
      if (!prog.length && !notes.length && !qs.length) { info.textContent = 'No records from the earlier date-based version were found on this device.'; return; }
      info.textContent = 'These came from the earlier 253-day, date-based roadmap. They use that version\'s own day numbers, which do not match the new Day 1–1,029 sessions, so they were NOT converted into new completions. They stay safe here and are included in backups.';
      var list = h('div'); prog.sort(function (a, b) { return a.day - b.day; }).forEach(function (p) { var e = old[p.day];
        list.appendChild(h('div', { class: 'item' }, h('strong', { text: 'Earlier day ' + p.day + (e ? ': ' + e.title + ' (' + e.group + ')' : '') }), h('span', { class: 'muted small', text: (p.scheduled || '') + (p.catchup ? ' · catch-up ' + p.catchup : '') + (p.scheduledAt ? ' · ' + U.stamp(p.scheduledAt) : '') }))); });
      notes.sort(function (a, b) { return a.date < b.date ? 1 : -1; }).forEach(function (n) { list.appendChild(h('div', { class: 'item' }, h('strong', { text: 'Note for ' + n.date }), h('span', { class: 'small', text: [n.did, n.review, n.remarks].filter(Boolean).join(' · ') }))); });
      qs.forEach(function (x) { list.appendChild(h('div', { class: 'item' }, h('strong', { text: 'Earlier question ' + x.id + ': ' + x.status }), x.notes ? h('span', { class: 'small', text: x.notes }) : null)); });
      box.appendChild(h('p', { class: 'small', text: prog.length + ' progress records · ' + notes.length + ' notes · ' + qs.length + ' question records' })); box.appendChild(list);
    }).catch(function (e) { info.textContent = 'Could not read earlier records: ' + e.message; });
    return box;
  }
  function render() {
    root.textContent = '';
    root.appendChild(card('Backup and restore', h('p', { class: 'muted small', text: 'Your data lives only on this device. Clearing browser data deletes it, so export a backup regularly.' }),
      h('div', { class: 'btnrow' }, h('button', { type: 'button', class: 'btn primary', onclick: exportBackup, text: 'Export backup' }),
        h('label', { class: 'btn ghost' }, 'Restore backup', h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: function () { if (this.files[0]) { restore(this.files[0]); } this.value = ''; } }))), msg));
    root.appendChild(legacy());
    S.all('meta').then(function (m) { var b = m.filter(function (x) { return x.key === 'lastBackupAt'; })[0]; root.appendChild(h('p', { class: 'muted small', text: b ? 'Last backup exported: ' + U.stamp(b.value) : 'No backup exported yet from this version.' })); }).catch(function () {});
  }
  render();
  window.addEventListener('hashchange', function () { if (U.route('settings') !== null) { render(); } });
})();
