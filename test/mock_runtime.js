// Mock of the claude.ai artifact runtime: db (nested paths, onSnapshot, set/update/delete), user, downloads, mcp.
// State lives in localStorage under __mockdb so a reload sees the same data, like the real server.
(function () {
  var cfg = window.__MOCK || {};
  window.__EC_TEST__ = {};
  if (cfg.noRuntime) return;
  var KEY = '__mockdb';
  function load() { try { var v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  var data = load() || JSON.parse(JSON.stringify(cfg.seed || {}));
  function save() { localStorage.setItem(KEY, JSON.stringify(data)); }
  save();
  var subs = [];   // {coll, fn}
  window.__writes = []; window.__mock = { data: function () { return data; } };
  function parentOf(p) { return p.split('/').slice(0, -1).join('/'); }
  function snapFor(coll) {
    var docs = Object.keys(data).filter(function (p) { return parentOf(p) === coll; }).map(function (p) {
      var v = data[p]; return { id: p.split('/').pop(), exists: true, data: function () { return JSON.parse(JSON.stringify(v)); } };
    });
    return { docs: docs, size: docs.length, empty: !docs.length };
  }
  function notify(path) { var c = parentOf(path); subs.forEach(function (s) { if (s.coll === c) setTimeout(function () { s.fn(snapFor(c)); }, 5); }); }
  function err(code) { var e = new Error(code); e.code = code; return e; }
  function merge(a, b) { Object.keys(b).forEach(function (k) { var v = b[k]; if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], v); else a[k] = v; }); return a; }
  function guard() { if (cfg.readOnly) throw err('invalid_argument'); if (cfg.failWrites) throw err('unavailable'); }
  var db = {
    doc: function (path) {
      return {
        id: path.split('/').pop(), path: path,
        get: async function () { var v = data[path]; return { id: this.id, exists: v != null, data: function () { return v; } }; },
        set: async function (v) { guard(); data[path] = JSON.parse(JSON.stringify(v)); save(); window.__writes.push(['set', path]); notify(path); },
        update: async function (v) { guard(); if (data[path] == null) throw err('not_found'); merge(data[path], JSON.parse(JSON.stringify(v))); save(); window.__writes.push(['update', path]); notify(path); },
        delete: async function () { guard(); delete data[path]; save(); window.__writes.push(['delete', path]); notify(path); }
      };
    },
    collection: function (coll) {
      return {
        path: coll,
        doc: function (id) { return db.doc(coll + '/' + id); },
        get: async function () { return snapFor(coll); },
        onSnapshot: function (fn) { var s = { coll: coll, fn: fn }; subs.push(s); setTimeout(function () { fn(snapFor(coll)); }, 10); return function () { subs = subs.filter(function (x) { return x !== s; }); }; }
      };
    }
  };
  // simulate a write from another device (coach on the iPad while the client logs on the phone)
  window.__remoteSet = function (path, v) { data[path] = v; save(); notify(path); };
  window.__saved = [];
  var downloads = { save: async function (r) { window.__saved.push({ filename: r.filename, size: (r.data && r.data.length) || 0 }); return { status: 'saved' }; } };
  var user = { id: async function () { return 'u-test'; }, can: async function () { return !cfg.readOnly; } };
  var mcp = { call: async function () { window.__mcpCalls = (window.__mcpCalls || 0) + 1; return { ok: true }; } };
  window.claude = { use: async function (n) { await new Promise(function (r) { setTimeout(r, 30); }); if (n === 'db') return cfg.noDb ? null : db; if (n === 'user') return user; if (n === 'downloads') return downloads; if (n === 'mcp') return mcp; return null; } };
})();
