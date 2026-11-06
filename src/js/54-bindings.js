  // ---------- bindings ----------
  function onInput(e) {
    const t = e.target, b = t.dataset.bind; if (!b) return;
    if (['set', 'entry', 'bwmode', 'fb', 'meta', 'wset'].includes(b) && S.draft) setTimeout(scheduleTraining, 0);
    const v = t.type === 'checkbox' ? t.checked : t.value;
    if (b === 'set') {
      const ei = +t.dataset.ei, si = +t.dataset.si, en = S.draft.entries[ei]; en.sets[si][t.dataset.f] = v; if (t.dataset.f === 'rpe') en.sets[si].rir = rpeToRir(v) ?? '';
      if (unitOf(en.exId) === 'bw') { en.sets[si].mode = en.bwMode || 'auto'; const tc = $(`#tot-${ei}-${si}`), tot = setKg(en.sets[si], en.exId); if (tc) tc.textContent = tot != null ? nl(tot) + ' kg' : ''; }
      const c1 = $(`#e1-${ei}-${si}`), c2 = $(`#sg-${ei}-${si}`);
      if (c1) c1.textContent = isStrength(en.exId) ? nl(e1(en.sets[si], en.exId, en.target?.code)) : ''; if (c2) c2.innerHTML = sigHTML(en.sets[si], en.target);
    } else if (b === 'entry') S.draft.entries[+t.dataset.ei][t.dataset.f] = v;
    else if (b === 'bwmode') { const en = S.draft.entries[+t.dataset.ei]; en.bwMode = v; en.sets.forEach((x) => { x.mode = v; }); if (e.type === 'change') renderMain(); }
    else if (b === 'fb') S.draft.feedback[t.dataset.f] = v;
    else if (b === 'meta') { S.draft[t.dataset.f] = v; if (t.dataset.f === 'date' || t.dataset.f === 'blockId') { S.draft.week = weekFor(S.blocks[S.draft.blockId], S.draft.date); const w = $('#d-week'); if (w) w.value = S.draft.week; } }
    else if (b === 'cf') (S.newClient || S.profileDraft)[t.dataset.f] = v;
    else if (b === 'cf-flag') (S.newClient || S.profileDraft)[t.value] = t.checked;
    else if (b === 'cf-na') { const d = S.newClient || S.profileDraft; d.anchorsNA = d.anchorsNA || []; d.anchorsNA = t.checked ? [...new Set([...d.anchorsNA, t.value])] : d.anchorsNA.filter((x) => x !== t.value); }
    else if (b === 'intake') {
      const i = +t.dataset.i, r = S.intakeDraft.rows[i]; r[t.dataset.f] = v; S.intakeDraft.dirty = true;
      const rm = intakeCalc(r), c1 = $(`#it-${i}-rm`), c2 = $(`#it-${i}-pct`);
      if (c1) c1.innerHTML = rm != null ? `<b>${nl(rm)} kg</b>` : ''; if (c2) c2.textContent = num(r.reps) ? nl((pctTable(num(r.reps) + (num(r.rir) || 0)) || 0) * 100, 0) + '%' : '';
    }
    else if (b === 'intake-meta') { S.intakeDraft[t.dataset.f] = v; S.intakeDraft.dirty = true; }
    else if (b === 'set-kpb') { S.settingsDraft.kgPerBlock = v; markSettingsDirty(); }
    else if (b === 'coach') { S.settingsDraft.coaches[+t.dataset.i] = v; markSettingsDirty(); }
    else if (b === 'set-anchor') { const d = S.settingsDraft; d.anchors = t.checked ? [...new Set([...d.anchors, t.value])] : d.anchors.filter((x) => x !== t.value); markSettingsDirty(); }
    else if (b === 'exf-sec') { const d = S.exNew || S.exEdit; d.secondary = [...(d.secondary || [])]; d.secondary[+t.dataset.i] = v; }
    else if (b === 'bmeta') {
      const d = S.schemaDraft;
      if (t.dataset.f === 'perWeek' && e.type === 'change') {
        const n = num(v) || 1, drop = (d.exercises || []).filter((r) => SLOTS.indexOf(r.day) >= n);
        if (drop.length) { const names = [...new Set(drop.map((r) => slotLabel(r.day)))].join(', '); t.value = String(slotsOf(d).length); ask(`${names} schrappen?`, `${drop.length} oefeningen in ${names} verdwijnen uit deze periode.`, () => { d.perWeek = n; d.exercises = d.exercises.filter((r) => SLOTS.indexOf(r.day) < n); markSchemaDirty(); renderMain(); }, 'Schrappen'); return; }
        d.perWeek = n; markSchemaDirty(); renderMain(); return;
      }
      d[t.dataset.f] = v; markSchemaDirty();
    }
    else if (b === 'gen') { S.gen[t.dataset.f] = v; if (e.type === 'change' && t.dataset.f === 'phase') { applyPhase(S.gen, v); renderMain(); } else if (e.type === 'change' && t.dataset.f === 'volCut') { Object.assign(S.gen, { setsA: cutSets(5, v), setsB: cutSets(4, v), setsC: cutSets(3, v) }); renderMain(); } else if (e.type === 'change' && ['weeks', 'perWeek', 'repsMin', 'repsMax', 'methodA'].includes(t.dataset.f)) renderMain(); }
    else if (b === 'brow') {
      const r = S.schemaDraft.exercises[+t.dataset.ri]; r[t.dataset.f] = v; markSchemaDirty();
      if (e.type === 'change' && ['exId', 'code', 'sets', 'repsMin', 'repsMax', 'rir', 'method'].includes(t.dataset.f)) { if (t.dataset.f === 'method' && v === 'Tempo' && !r.tempo) r.tempo = '4010'; r.setPlan = methodPlan(r); if (r.warmupAuto !== false) r.warmup = warmupPlan(r); }
      if (e.type === 'change' && ['exId', 'code', 'day', 'sets', 'repsMin', 'repsMax', 'rir', 'method', 'tempo', 'rest'].includes(t.dataset.f)) renderMain();
    }
    else if (b === 'bwu') { const r = S.schemaDraft.exercises[+t.dataset.ri]; r.warmup[+t.dataset.wi][t.dataset.f] = v; r.warmupAuto = false; markSchemaDirty(); }
    else if (b === 'wset') { S.draft.entries[+t.dataset.ei].warmup[+t.dataset.wi][t.dataset.f] = v; }
    else if (b === 'rep') { if (S.report) S.report[t.dataset.f] = v; }
    else if (b === 'set-ppt') { S.settingsDraft.pullPushTarget = v; markSettingsDirty(); }
    else if (b === 'set-ppc') { S.settingsDraft.pullPushConfirmed = t.checked; markSettingsDirty(); }
    else if (b === 'splan') { const r = S.schemaDraft.exercises[+t.dataset.ri]; r.setPlan[+t.dataset.si][t.dataset.f] = v; markSchemaDirty(); }
    else if (b === 'ev') { S.eventDraft[t.dataset.f] = v; markEventDirty(); }
    else if (b === 'station') { S.eventDraft.stations[+t.dataset.i][t.dataset.f] = v; markEventDirty(); if (e.type === 'change') renderMain(); }
    else if (b === 'exf') { const d = S.exNew || S.exEdit; d[t.dataset.f] = v; if (t.dataset.f === 'type' && e.type === 'change') { d.unit = (v === 'conditie' ? UNITS_C : UNITS_K)[0][0]; renderMain(); } else if (e.type === 'change' && ['category', 'name', 'unit'].includes(t.dataset.f)) { const sel = $('#ex-pat'); if (sel && sel.options[0]) sel.options[0].textContent = 'Auto: ' + PAT_LABEL[autoPattern(d)]; } }
  }
  function markSchemaDirty() { S.schemaDirty = true; S.lastEdit = Date.now(); setSaveState('Wijzigingen worden bewaard…'); clearTimeout(S.planTimer); S.planTimer = setTimeout(savePlan, 1200); }
  function setSaveState(txt) { S.saveState = txt; const el = $('#save-state'); if (el) el.textContent = txt; }
  const hhmm = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  async function savePlan() {
    clearTimeout(S.planTimer); const d = S.schemaDraft; if (!d || !S.schemaDirty) return true;
    const { _unsaved, ...body } = clone(d); delete body.id; delete body.method;
    body.exercises = (body.exercises || []).map((r) => { const setPlan = (r.setPlan || []).map((p) => ({ kg: num(p.kg), reps: num(p.reps), note: p.note || '' })); return { ...r, warmup: (r.warmup || []).map((w) => ({ kg: num(w.kg), reps: num(w.reps) })).filter((w) => w.kg != null || w.reps != null), filler: r.filler || '', method: r.method || '', sets: num(r.sets), repsMin: num(r.repsMin), repsMax: num(r.repsMax), rest: num(r.rest), rir: num(r.rir), setPlan, startKg: setPlan[0]?.kg ?? null }; });
    body.intensity = num(body.intensity); body.weeks = num(body.weeks) || 3; body.perWeek = num(body.perWeek) || slotsOf(d).length;
    S.lastSelf = Date.now();
    if (await write(`clients/${S.cid}/blocks/${d.id}`, body)) { if (S.blocks[d.id]) delete S.blocks[d.id]._unsaved; if (S.schemaDraft === d) S.schemaDirty = false; setSaveState('Opgeslagen om ' + hhmm()); return true; }
    setSaveState('Niet opgeslagen: probeer opnieuw'); return false;
  }
  function trainingBody(d) {
    const entries = d.entries.filter((e) => e.exId).map((e) => ({ exId: e.exId, variant: e.variant || '', hard: String(e.hard || '').trim(), score: num(e.score) != null ? Math.min(10, Math.max(1, Math.round(num(e.score)))) : null, target: e.target || {}, warmup: (e.warmup || []).map((w) => ({ kg: num(w.kg), reps: num(w.reps) })).filter((w) => w.kg != null || w.reps != null), sets: e.sets.filter((x) => ['kg', 'blocks', 'reps', 'value', 'time'].some((f) => x[f] !== '' && x[f] != null)).map((x) => ({ kg: num(x.kg), blocks: num(x.blocks), extra: num(x.extra), reps: num(x.reps), rpe: num(x.rpe), rir: num(x.rpe) != null ? rpeToRir(x.rpe) : num(x.rir), value: num(x.value), time: x.time || '', ...(unitOf(e.exId) === 'bw' ? bwSave(x) : {}) })) })).filter((e) => e.sets.length);
    const fb = d.feedback || {};
    return { date: d.date, blockId: d.blockId, week: num(d.week) ?? 1, day: d.day || '', done: true, historical: !!d.historical, note: d.note || '', entries, feedback: { bodyweight: num(fb.bodyweight), whoop: num(fb.whoop), pain: num(fb.pain), energy: num(fb.energy), note: fb.note || '' }, report: d.report || null, updatedAt: new Date().toISOString() };
  }
  function scheduleTraining() { if (!S.draft) return; S.draft._dirty = true; setSaveState('Wordt bewaard…'); clearTimeout(S.saveTimer); S.saveTimer = setTimeout(saveTraining, 1200); }
  async function saveTraining() {
    clearTimeout(S.saveTimer); const d = S.draft; if (!d || !d._dirty) return true;
    const body = trainingBody(d); if (!body.entries.length && !d.id) { setSaveState('Nog niets ingevuld'); return true; }
    if (!d.id) d.id = uid('s');
    S.lastSelf = Date.now(); d._dirty = false;
    if (!(await write(`clients/${S.cid}/sessions/${d.id}`, body))) { d._dirty = true; setSaveState('Niet opgeslagen: probeer opnieuw'); return false; }
    const all = { ...S.sessions, [d.id]: { id: d.id, ...body } }, real = Object.values(all).filter((x) => !x.historical);
    const bwS = real.filter((x) => x.feedback?.bodyweight != null).sort((a, b) => (a.date < b.date ? -1 : 1)).pop();
    S.lastSelf = Date.now();
    await write(`clients/${S.cid}`, { stats: { sessionCount: real.length, lastSession: real.map((x) => x.date).sort().pop() || null, lastBodyweight: bwS?.feedback.bodyweight ?? null } }, true);
    setSaveState('Opgeslagen om ' + hhmm()); const del = $('[data-act="del-session"]'); if (del) del.hidden = false; const rb = $('[data-act="rep-open"]'); if (rb) rb.disabled = false; return true;
  }
  async function flushAll() { await saveTraining(); await savePlan(); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });
  window.addEventListener('pagehide', () => { flushAll(); });
  function markSettingsDirty() { if (!S.settingsDraft.dirty) { S.settingsDraft.dirty = true; const x = $('[data-act="set-reset"]'); if (x) x.disabled = false; } }
  function markEventDirty() { if (!S.eventDirty) { S.eventDirty = true; document.querySelectorAll('[data-act="save-event"],[data-act="reset-event"]').forEach((x) => (x.disabled = x.dataset.act === 'save-event' && !S.canWrite)); } }

  document.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const fn = ACT[b.dataset.act]; if (fn) { e.preventDefault(); fn(b, e); } });
  document.addEventListener('input', onInput);
  document.addEventListener('change', (e) => {
    if (e.target.dataset.change === 'client') return selectClient(e.target.value);
    if (e.target.id === 'nt-block') { S.trainBlock = e.target.value; S.trainDate = $('#nt-date')?.value || ''; renderMain(); return; }
    if (e.target.id === 'nt-date') { S.trainDate = e.target.value; return; }
    if (e.target.dataset.bind) onInput(e);
  });
  document.addEventListener('mousemove', (e) => {
    const tip = $('#prog-chart .tip'); if (!tip) return;
    const c = e.target.closest('[data-tip]');
    if (!c) { tip.hidden = true; return; }
    const [a, b, d] = c.dataset.tip.split('|'); tip.innerHTML = `<div class="t">${esc(a)}</div><div>${esc(b)}</div><div><b>${esc(d)}</b></div>`; tip.hidden = false;
    const box = $('#prog-chart').getBoundingClientRect(); let x = e.clientX - box.left + 12; const y = e.clientY - box.top + 12;
    if (x + tip.offsetWidth > box.width - 6) x = e.clientX - box.left - tip.offsetWidth - 12;
    tip.style.left = Math.max(4, x) + 'px'; tip.style.top = Math.min(y, box.height - tip.offsetHeight - 4) + 'px';
  });
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawProgress, 150); });

