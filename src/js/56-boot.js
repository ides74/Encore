  // ---------- boot ----------
  async function boot() {
    const use = window.claude?.use;
    const db = use ? await window.claude.use('db') : null;
    if (!db) { S.offline = true; render(); return; }
    S.db = db;
    try { S.user = await window.claude.use('user'); const w = S.user ? await S.user.can('data.write') : null; if (w === false) S.canWrite = false; } catch {}
    db.collection('exercises').onSnapshot((snap) => { S.exercises = {}; snap.docs.forEach((d) => { S.exercises[d.id] = { id: d.id, ...d.data() }; }); S.loaded.ex = true; soft(); }, dbErr);
    db.collection('config').onSnapshot((snap) => {
      const d = snap.docs.find((x) => x.id === 'app')?.data() || {};
      S.config = { anchors: Array.isArray(d.anchors) ? d.anchors : DEFAULT_ANCHORS, coaches: Array.isArray(d.coaches) ? d.coaches : [], kgPerBlock: num(d.kgPerBlock) ?? 6.4, pullPushTarget: num(d.pullPushTarget) ?? 2, pullPushConfirmed: !!d.pullPushConfirmed, coachEmails: d.coachEmails && typeof d.coachEmails === 'object' ? d.coachEmails : {} }; soft();
    }, dbErr);
    db.collection('clients').onSnapshot((snap) => {
      S.clients = {}; snap.docs.forEach((d) => { S.clients[d.id] = { id: d.id, ...d.data() }; }); S.loaded.cl = true;
      if (S.cid && !S.clients[S.cid]) { S.cid = null; S.view = 'home'; subscribeClient(null); }
      soft();
    }, dbErr);
    if (S.cid) subscribeClient(S.cid); else S.view = ['exercises', 'settings'].includes(S.view) ? S.view : 'home';
  }
  boot();
})();
