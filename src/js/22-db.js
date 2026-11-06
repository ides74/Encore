  // ---------- db ----------
  const toastMsg = (m) => { S.toast = m; renderOverlay(); clearTimeout(toastMsg.t); toastMsg.t = setTimeout(() => { S.toast = ''; renderOverlay(); }, 2600); };
  const dbErr = (e) => { console.warn(e); if (e?.code === 'invalid_argument' && !S.canWrite) return; toastMsg(e?.code === 'quota_exceeded' ? 'De database is vol: verwijder oude gegevens.' : 'Opslaan lukte niet. Probeer opnieuw.'); };
  const write = async (path, data, merge) => {
    if (!S.db || !S.canWrite) { toastMsg('Je hebt geen schrijfrechten op deze app.'); return false; }
    try { const ref = S.db.doc(path); merge ? await ref.update(data) : await ref.set(data); return true; }
    catch (e) { if (e?.code === 'invalid_argument') { S.canWrite = false; render(); } dbErr(e); return false; }
  };
  const remove = async (path) => { if (!S.db || !S.canWrite) return false; try { await S.db.doc(path).delete(); return true; } catch (e) { dbErr(e); return false; } };

  function subscribeClient(cid) {
    S.unsub.forEach((u) => u()); S.unsub = [];
    S.blocks = {}; S.sessions = {}; S.loaded.bl = S.loaded.se = false;
    if (!S.db || !cid) return;
    S.unsub.push(S.db.collection(`clients/${cid}/blocks`).onSnapshot((snap) => {
      const keep = Object.values(S.blocks).filter((b) => b._unsaved); S.blocks = {}; snap.docs.forEach((d) => { S.blocks[d.id] = { id: d.id, ...d.data() }; }); keep.forEach((b) => { if (!S.blocks[b.id]) S.blocks[b.id] = b; }); S.loaded.bl = true; if (!S.schemaDirty && Date.now() - (S.lastEdit || 0) > 8000) S.schemaDraft = null; soft();
    }, dbErr));
    S.unsub.push(S.db.collection(`clients/${cid}/sessions`).onSnapshot((snap) => {
      S.sessions = {}; snap.docs.forEach((d) => { S.sessions[d.id] = { id: d.id, ...d.data() }; }); S.loaded.se = true; soft();
    }, dbErr));
  }
  const editing = () => (S.view === 'training' && S.draft) || (S.view === 'planning' && S.schemaDraft && (S.schemaDirty || Date.now() - (S.lastEdit || 0) < 8000)) || S.profileDraft || S.newClient || (S.view === 'event' && S.eventDirty) || S.exEdit || S.exNew || (S.view === 'intake' && S.intakeDraft?.dirty) || (S.view === 'settings' && S.settingsDraft?.dirty);
  function soft() { if (editing()) { if (Date.now() - S.lastSelf > 4000) S.pending = true; renderHeader(); return; } render(); }

