// Shared line icons (inline SVG, work offline). window.Icons.make(name) returns an <svg>.

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var PATHS = {
    calendar: ['M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M16 2v4M8 2v4M3 10h18'],
    clock: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6v6l4 2'],
    info: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 16v-4M12 8h.01'],
    check: ['M20 6L9 17l-5-5'],
    skip: ['M5 4l10 8-10 8z', 'M19 5v14'],
    left: ['M15 18l-6-6 6-6'],
    right: ['M9 18l6-6-6-6'],
    close: ['M18 6L6 18M6 6l12 12'],
    code: ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
    copy: ['M10 9h10a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1z', 'M5 15H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1'],
    external: ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14L21 3'],
    folder: ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'],
    book: ['M2 4h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 4h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
    task: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
    notes: ['M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M9 2h6v4H9z'],
    save: ['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z', 'M17 21v-8H7v8', 'M7 3v5h8'],
    search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M21 21l-4.3-4.3'],
    undo: ['M3 7v6h6', 'M21 17a9 9 0 0 0-15-6.7L3 13'],
    list: ['M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'],
    layers: ['M12 2l10 5-10 5L2 7z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5']
  };

  window.Icons = {
    make: function (name, cls) {
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
      (PATHS[name] || []).forEach(function (d) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        svg.appendChild(p);
      });
      return svg;
    }
  };
})();
