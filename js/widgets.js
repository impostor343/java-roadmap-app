// Home-screen widgets (Android app only). The saved progress lives in this WebView, so after every change we send a small summary
// to the native side, which stores it and redraws both widgets. Nothing is estimated: the numbers come from State (the same records as the app).
(function () {
  'use strict';
  var C = window.Curriculum, A = window.State, timer = null;
  function bridge() { var P = window.Capacitor && Capacitor.Plugins; return P && P.WidgetBridge; }
  function native() { return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()); }
  if (!native()) { return; }

  function snapshot() {
    var d = A.nextIncomplete(), s = d ? C.session(d) : null;
    return { total: C.total, done: A.doneCount(), skipped: A.skippedCount(), nextDay: d || 0, title: s ? s.title : '', module: s ? s.module : '', time: s ? (s.time || '') : '', status: d ? A.status(d) : '' };
  }
  function push() { var b = bridge(); if (!b || !b.update) { return; } try { Promise.resolve(b.update(snapshot())).catch(function () {}); } catch (e) {} }
  function soon() { clearTimeout(timer); timer = setTimeout(push, 300); }

  // widget tap: open the right screen (only these exact routes are accepted)
  function route(r) { if (/^#(today(\/\d{1,4})?|progress|calendar)$/.test(r || '')) { location.hash = r; } }
  function pullRoute() { var b = bridge(); if (b && b.getLaunchRoute) { Promise.resolve(b.getLaunchRoute()).then(function (x) { route(x && x.route); }, function () {}); } }

  Promise.all([C.ready, A.ready]).then(function () { push(); pullRoute(); }).catch(function () {});
  window.addEventListener('cur-changed', soon);
  window.addEventListener('cse-native-route', pullRoute);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') { push(); } else { pullRoute(); } });
  window.WidgetSync = { push: push, snapshot: snapshot };
})();
