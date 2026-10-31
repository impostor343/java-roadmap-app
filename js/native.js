// Android app (Capacitor) helpers. In a normal browser these do nothing special.
// Inside the app, blob downloads and blob PDFs do not work in the WebView, so files are written to the app cache and handed to the Android share sheet.
(function () {
  'use strict';
  var C = window.Capacitor;
  function native() { return !!(C && C.isNativePlatform && C.isNativePlatform()); }
  function plugin(n) { return C && C.Plugins && C.Plugins[n]; }
  function toBase64(blob) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = function () { rej(r.error); }; r.readAsDataURL(blob); }); }
  // data: a Blob. Returns a promise. In the app it opens the share sheet (Save to Drive / Files, or open with a viewer).
  function shareFile(name, blob, title) {
    var FS = plugin('Filesystem'), SH = plugin('Share');
    if (!FS || !SH) { return Promise.reject(new Error('File sharing is not available in this app build.')); }
    return toBase64(blob).then(function (b64) { return FS.writeFile({ path: name, data: b64, directory: 'CACHE' }); })
      .then(function (r) { return SH.share({ title: title || name, url: r.uri, dialogTitle: title || name }); });
  }
  window.NativeFiles = { isNative: native, shareFile: shareFile };
})();
