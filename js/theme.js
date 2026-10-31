// Appearance: colour palette, font, light/dark mode and text size. Stored in localStorage and applied as attributes on <html>.
// The same rules run in a small inline script in index.html so the saved look is applied before first paint.
(function () {
  'use strict';
  var KEY = 'cse-roadmap-appearance';
  var PALETTES = [
    { id: 'default', name: 'Emerald', color: '#4CAF82' }, { id: 'ocean', name: 'Ocean', color: '#4C8FD6' }, { id: 'violet', name: 'Violet', color: '#8A6FD6' },
    { id: 'sunset', name: 'Sunset', color: '#E08A3C' }, { id: 'rose', name: 'Rose', color: '#D9669B' }, { id: 'teal', name: 'Teal', color: '#2FA89B' }, { id: 'slate', name: 'Graphite', color: '#6B7A90' }
  ];
  var FONTS = [
    { id: 'default', name: 'Default', note: 'System sans + serif headings' }, { id: 'inter', name: 'Inter', note: 'Clean and neutral' }, { id: 'poppins', name: 'Poppins', note: 'Rounded and friendly' },
    { id: 'lora', name: 'Lora', note: 'Bookish serif' }, { id: 'classic', name: 'Classic serif', note: 'Georgia style' }, { id: 'mono', name: 'Monospace', note: 'Code look' }
  ];
  var MODES = [{ id: 'auto', name: 'Match phone' }, { id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }];
  var SIZES = [{ id: 'small', name: 'Small' }, { id: 'normal', name: 'Normal' }, { id: 'large', name: 'Large' }, { id: 'xlarge', name: 'Extra large' }];
  var DEFAULTS = { palette: 'default', font: 'default', mode: 'auto', size: 'normal' };
  function ids(list) { return list.map(function (x) { return x.id; }); }
  function load() { var s = {}; try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {} return { palette: ids(PALETTES).indexOf(s.palette) !== -1 ? s.palette : DEFAULTS.palette, font: ids(FONTS).indexOf(s.font) !== -1 ? s.font : DEFAULTS.font, mode: ids(MODES).indexOf(s.mode) !== -1 ? s.mode : DEFAULTS.mode, size: ids(SIZES).indexOf(s.size) !== -1 ? s.size : DEFAULTS.size }; }
  function apply(s) {
    var r = document.documentElement;
    function set(a, v, d) { if (v === d) { r.removeAttribute(a); } else { r.setAttribute(a, v); } }
    set('data-palette', s.palette, 'default'); set('data-font', s.font, 'default'); set('data-mode', s.mode, 'auto'); set('data-size', s.size, 'normal');
    var m = document.querySelector('meta[name="theme-color"]:not([media])') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));
    var cs = getComputedStyle(r).getPropertyValue('--bg').trim(); if (cs) { m.setAttribute('content', cs); }
  }
  var cur = load();
  window.Theme = {
    PALETTES: PALETTES, FONTS: FONTS, MODES: MODES, SIZES: SIZES, DEFAULTS: DEFAULTS,
    get: function () { return { palette: cur.palette, font: cur.font, mode: cur.mode, size: cur.size }; },
    set: function (patch) { Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; }); try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {} apply(cur); },
    reset: function () { cur = { palette: 'default', font: 'default', mode: 'auto', size: 'normal' }; try { localStorage.removeItem(KEY); } catch (e) {} apply(cur); }
  };
  apply(cur);
})();
