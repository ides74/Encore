  // ---------- actions ----------
  const setView = (v) => { if (!S.intakeDraft?.dirty) S.intakeDraft = null; if (!S.settingsDraft?.dirty) S.settingsDraft = null; S.view = v; store.set('ec.view', v); render(); window.scrollTo({ top: 0 }); };
  const ACT = {
    view: async (b) => { if (blocking()) { confirmLeave(); return; } await flushAll(); restStop(); S.draft = null; S.schemaDraft = null; S.schemaDirty = false; setView(b.dataset.v); },
    'open-client': (b) => selectClient(b.dataset.id, 'overview'),
    'new-client': () => { S.newClient = { name: '', coach: S.coachFilter && S.coachFilter !== '-' ? S.coachFilter : '', goal: '', constraints: '', trainingDays: '', perWeek: 2, bodyweight: '', trackAttention: false, trackWhoop: false, anchorsNA: [] }; renderMain(); $('#cf-name')?.focus(); },
    'edit-profile': () => { const c = client(); S.profileDraft = clone({ name: c.name, email: c.email || '', coach: c.coach || '', goal: c.goal, constraints: c.constraints, trainingDays: c.trainingDays, perWeek: c.perWeek ?? 2, bodyweight: c.bodyweight, trackAttention: tracks(c, 'attention'), trackWhoop: tracks(c, 'whoop'), anchorsNA: c.anchorsNA || [] }); renderMain(); },
    'coach-filter': (b) => { S.coachFilter = b.dataset.v; store.set('ec.coach', S.coachFilter || null); render(); },
    'it-add': () => { const id = $('#it-add').value; if (!id) return; S.intakeDraft.rows.push(intakeRow(id)); S.intakeDraft.dirty = true; renderMain(); },
    'it-del': (b) => { S.intakeDraft.rows.splice(+b.dataset.i, 1); S.intakeDraft.dirty = true; renderMain(); },
    'it-reset': () => { S.intakeDraft = null; render(); },
    'it-save': async () => {
      const d = S.intakeDraft, tests = {};
      d.rows.forEach((r) => { const rm = intakeCalc(r); if (rm != null) tests[r.exId] = { kg: num(r.kg), reps: num(r.reps), rir: num(r.rir) ?? 0, rm, ...(unitOf(r.exId) === 'bw' ? bwSave({ kg: r.kg, mode: r.mode || 'auto' }) : {}) }; });
      if (!Object.keys(tests).length) { toastMsg('Vul minstens één oefening volledig in (gewicht en reps).'); return; }
      if (await write(`clients/${S.cid}`, { intake: { date: d.date || todayStr(), note: d.note || '', tests, order: d.rows.map((r) => r.exId) } }, true)) { S.intakeDraft = null; toastMsg('Intake opgeslagen: de 1RM-basis staat klaar voor de schema\'s'); render(); }
    },
    'co-add': () => { S.settingsDraft.coaches.push(''); S.settingsDraft.dirty = true; renderMain(); $(`#co-${S.settingsDraft.coaches.length - 1}`)?.focus(); },
    'co-del': (b) => { S.settingsDraft.coaches.splice(+b.dataset.i, 1); S.settingsDraft.dirty = true; renderMain(); },
    'set-reset': () => { S.settingsDraft = null; render(); },
    'set-save': async () => {
      const d = S.settingsDraft; const coaches = [...new Set(d.coaches.map((c) => c.trim()).filter(Boolean))];
      const kpb = num(d.bigBlock) ?? 5.5, kps = num(d.smallBlock) ?? 2.75, ppt = num(d.pullPushTarget) ?? 2, ppc = !!d.pullPushConfirmed;
      if (await write('config/app', { coaches, anchors: d.anchors, bigBlock: kpb, smallBlock: kps, pullPushTarget: ppt, pullPushConfirmed: ppc, coachEmails: S.config.coachEmails || {} })) { S.settingsDraft = null; S.config = { coaches, anchors: d.anchors, bigBlock: kpb, smallBlock: kps, pullPushTarget: ppt, pullPushConfirmed: ppc, coachEmails: S.config.coachEmails || {} }; toastMsg('Instellingen opgeslagen'); render(); }
    },
    'cf-cancel': () => { S.newClient = null; S.profileDraft = null; render(); },
    'cf-save': async () => {
      const d = S.newClient || S.profileDraft; if (!d.name?.trim()) { toastMsg('Geef de klant een naam.'); return; }
      const body = { name: d.name.trim(), email: (d.email || '').trim(), coach: d.coach || '', goal: d.goal || '', constraints: d.constraints || '', trainingDays: d.trainingDays || '', perWeek: num(d.perWeek) ?? 2, bodyweight: num(d.bodyweight), trackAttention: !!d.trackAttention, trackWhoop: !!d.trackWhoop, anchorsNA: d.anchorsNA || [] };
      if (S.newClient) {
        let id = slug(body.name); if (S.clients[id]) id = id + '-' + Math.random().toString(36).slice(2, 5);
        if (await write(`clients/${id}`, { ...body, event: null, stats: { sessionCount: 0 }, createdAt: todayStr() })) { S.newClient = null; toastMsg('Klant aangemaakt'); selectClient(id, 'overview'); }
      } else if (await write(`clients/${S.cid}`, body, true)) { S.profileDraft = null; toastMsg('Profiel opgeslagen'); render(); }
    },
    'goto-progress': (b) => { S.progEx = b.dataset.id; setView('progress'); },
    'open-session': async (b) => { const s = S.sessions[b.dataset.id]; if (!s) return; S.undo = []; await savePlan(); S.saveState = ''; S.draft = clone({ ...s, day: sessSlot(s), feedback: s.feedback || {} }); S.draft.entries.forEach((en) => (en.sets || []).forEach((x) => { if (num(x.rpe) == null && num(x.rir) != null && x.rirSrc !== 'plan') x.rpe = rirToRpe(x.rir); })); S.draft.entries.forEach((en) => { if (unitOf(en.exId) === 'bw') { en.bwMode = 'extra'; en.sets.forEach((x) => { x.mode = 'extra'; }); } }); S.gymIdx = 0; S.gymSet = null; S.view = 'training'; store.set('ec.view', 'training'); render(); window.scrollTo({ top: 0 }); },
    'start-slot': (b) => { S.undo = []; const date = $('#nt-date')?.value || todayStr(); S.trainDate = ''; S.saveState = ''; S.draft = newDraft(date, S.trainBlock, b.dataset.slot); S.gymIdx = 0; S.gymSet = null; renderMain(); window.scrollTo({ top: 0 }); },
    'open-block': (b) => { S.blockSel = b.dataset.id; S.schemaDraft = null; S.schemaDirty = false; S.slotFilter = ''; setView('planning'); },
    'slot-filter': (b) => { S.slotFilter = b.dataset.v; renderMain(); },
    'gen-open': async () => { await savePlan(); S.gen = genDefaults(); renderMain(); },
    'cycle-model': (b) => { store.set('ec.cycle', b.dataset.v); renderMain(); },
    'cycle-build': async (b) => { await savePlan(); const g = genDefaults(); g.start = b.dataset.start; g.phase = b.dataset.phase; applyPhase(g, g.phase); S.gen = g; renderMain(); toastMsg(`Voorstel ${g.phase} vanaf ${fmtDate(g.start, false)}: kies de oefeningen en tik Maak`); },
    'gen-cancel': () => { S.gen = null; renderMain(); },
    'gen-mode': (b) => { S.gen.mode = b.dataset.v; renderMain(); },
    'gen-make': () => {
      const g = S.gen; if (!g.start) { toastMsg('Kies een startdatum.'); return; }
      const exercises = g.mode === 'copy' ? genCopy(g) : genProposal(g);
      const id = uid('b');
      S.schemaDraft = { id, code: nextCode(g.phase), phase: g.phase, start: g.start, weeks: num(g.weeks) || 3, perWeek: num(g.perWeek) || 1, intensity: '', reps: `${g.repsMin}-${g.repsMax}`, goal: g.goal || '', exercises };
      S.blocks[id] = { ...clone(S.schemaDraft), _unsaved: true }; S.blockSel = id; S.gen = null; S.slotFilter = '';
      markSchemaDirty(); savePlan(); renderMain(); toastMsg('Voorstel klaar en bewaard: pas het aan waar nodig');
    },
    // v1.3.0: na Klaar de samenvatting (plan tegenover gedaan, records, te moeilijk), klaar om te mailen
    'done-training': async (b) => {
      const part = S.draft.entries.flatMap((en) => en.sets.map((x, k) => (setPartial(x) ? `${en.target?.code ? en.target.code + ' ' : ''}${exName(en.exId)} set ${k + 1}` : null)).filter(Boolean));
      if (part.length && !b?.dataset?.force) { ask('Onvolledige sets', `Gewicht ingevuld maar geen reps: ${part.join(', ')}. Deze sets tellen niet mee. Toch afronden?`, () => ACT['done-training']({ dataset: { force: '1' } }), 'Toch afronden', true); return; }
      if (!(await saveTraining())) return; const d = S.draft, had = !!d?.id, m = had ? summaryModel(d) : null;
      if (had) S.lastSess = { id: d.id, ...trainingBody(d) };
      restStop(); S.draft = null; S.saveState = ''; render(); toastMsg('✓ Training opgeslagen in je historiek'); if (m) openSummary(m);
    },
    'add-set': (b) => { pushUndo(false); const en = S.draft.entries[+b.dataset.ei]; en.sets.push({ mode: en.bwMode || 'auto' }); renderMain(); scheduleTraining(); },
    'del-set': (b) => { pushUndo(false); const en = S.draft.entries[+b.dataset.ei]; en.sets.splice(+b.dataset.si, 1); if (!en.sets.length) en.sets.push({}); S.gymSet = null; renderMain(); scheduleTraining(); },
    'del-entry': (b) => { pushUndo(false); S.draft.entries.splice(+b.dataset.ei, 1); S.gymSet = null; renderMain(); scheduleTraining(); },
    'add-entry': () => { const id = $('#add-ex').value; if (!id) return; S.draft.entries.push({ exId: id, variant: '', target: {}, bwMode: 'auto', sets: [{ mode: 'auto' }, { mode: 'auto' }, { mode: 'auto' }] }); if (S.gym) { S.gymIdx = S.draft.entries.length - 1; S.gymSet = null; } renderMain(); scheduleTraining(); },
    'copy-prev': (b) => {
      const ei = +b.dataset.ei, en = S.draft.entries[ei], prev = prevSummary(en.exId, S.draft.date); if (!prev) return;
      en.sets = prev.sets.map((x) => ({ kg: x.blocks != null && x.blocks !== '' ? '' : (unitOf(en.exId) === 'bw' ? x.kg ?? '' : setKg(x, en.exId) ?? x.kg ?? ''), blocks: x.blocks ?? '', extra: x.extra ?? '', reps: x.reps ?? '', value: x.value ?? '', time: x.time ?? '', mode: 'extra' }));
      if (unitOf(en.exId) === 'bw') en.bwMode = 'extra';
      renderMain(); scheduleTraining();
    },
    // ✓ bevestigt een set: lege velden krijgen het voorstel (plan, anders vorige keer), RPE nooit; daarna start de rust
    'confirm-set': (b) => {
      const ei = +b.dataset.ei, si = +b.dataset.si, en = S.draft.entries[ei], st = en.sets[si]; if (!st) return;
      audioUnlock(); const snap = snapNow();
      const sg = setSuggest(en, si) || {};
      Object.entries(sg).forEach(([f, v]) => { if (f !== 'rpe' && (st[f] == null || st[f] === '') && v !== '' && v != null) st[f] = v; });
      if (!setDone(st) && num((en.target?.setPlan || [])[si]?.reps) == null && num(en.target?.repsMax) == null && (num(st.kg) != null || num(st.blocks) != null)) st.ok = true;
      if (!setDone(st)) { toastMsg('Vul eerst de herhalingen in.'); return; }
      const wi = weightIssue(en, st);
      if (wi && wi.hard) { toastMsg(wi.msg); S.gymSet = si; renderMain(); return; }
      if (wi && wi.double) { ask('Gewicht per dumbbell?', wi.msg, async () => { pushUndo(true, snap); st.kg = wi.fix; st._rest = true; S.gymSet = null; restAfter(ei); gymAuto(ei); renderMain(); scheduleTraining(); }, `Ja: 2 × ${nl(wi.fix)} kg`, true); return; }
      pushUndo(true, snap); st._rest = true; S.gymSet = null; restAfter(ei); if (gymAuto(ei)) { scheduleTraining(); return; }
      renderMain(); scheduleTraining(); const next = document.querySelector(`[data-act="confirm-set"][data-ei="${ei}"]`); if (next && !S.gym) next.focus();
    },
    'gw-toggle': () => { pushUndo(false); const g = S.draft.genWarm || { txt: client()?.warmupDefault || 'Roeien 2 min (±500 m)' }; g.done = !g.done; S.draft.genWarm = g; audioUnlock(); renderMain(); scheduleTraining(); },
    'fin-add': (b) => { S.draft.fins = S.draft.fins || []; S.draft.fins.push({ name: b.dataset.v || '', result: '', done: false }); renderMain(); const k = S.draft.fins.length - 1; $(`#fin-${k}-${b.dataset.v ? 'result' : 'name'}`)?.focus(); },
    'fin-del': (b) => { S.draft.fins.splice(+b.dataset.i, 1); renderMain(); scheduleTraining(); },
    'fin-ok': (b) => { const f = S.draft.fins[+b.dataset.i]; if (!String(f.result || '').trim() && !f.done) { toastMsg('Vul eerst het resultaat in.'); $(`#fin-${b.dataset.i}-result`)?.focus(); return; } pushUndo(false); f.done = !f.done; renderMain(); scheduleTraining(); },
    'blok-extra': (b) => { pushUndo(false); const st = S.draft.entries[+b.dataset.ei].sets[+b.dataset.si]; st.extra = Number(b.dataset.v) || 0; S.gymSet = +b.dataset.si; renderMain(); scheduleTraining(); },
    'set-clear': (b) => { const en = S.draft.entries[+b.dataset.ei], si = +b.dataset.si; en.sets[si] = { mode: en.bwMode || 'auto' }; S.gymSet = si; renderMain(); scheduleTraining(); },
    'wset-ok': (b) => {
      const ei = +b.dataset.ei, wi = +b.dataset.wi, en = S.draft.entries[ei], w = en.warmup[wi]; audioUnlock(); const snap = snapNow();
      if (!w.done) {
        const kg = num(w.kg), ref = refKg(en), first = num((en.target?.setPlan || [])[0]?.kg);
        if (kg != null && ref && kg > Math.max(ref * 1.6, ref + 40)) { toastMsg(`${nl(kg)} kg is onmogelijk hoog voor een opwarmset. Typfout?`); return; }
        if (kg != null && first && kg >= first * 0.97 && num(w.reps) >= (num(en.target?.repsMin) || 99)) {
          ask('Is dit een werkset?', `${nl(kg)} kg × ${nl(w.reps, 0)} is even zwaar als je werksets. Werksets tellen mee voor je progressie en records, opwarmsets niet.`, async () => { pushUndo(false, snap); en.warmup.splice(wi, 1); const ns = { kg: w.kg, reps: w.reps, mode: en.bwMode || 'auto' }, fe = en.sets.findIndex((x) => !setDone(x) && !setPartial(x)); if (fe >= 0) en.sets[fe] = ns; else en.sets.push(ns); renderMain(); scheduleTraining(); toastMsg('Verplaatst naar de werksets'); }, 'Ja, verplaats naar werksets', true);
          return;
        }
      }
      pushUndo(false, snap); w.done = !w.done; renderMain(); scheduleTraining();
    },
    // ± knoppen: vertrekt van de ingevulde waarde, anders van het grijze voorstel
    step: (b) => {
      const { ei, si, f } = b.dataset, inp = $(`#s-${ei}-${si}-${f}`); if (!inp) return;
      const cur = num(inp.value) ?? num(inp.placeholder) ?? 0, v = Math.max(0, Math.round((cur + Number(b.dataset.d)) * 2) / 2);
      inp.value = nl(v); onInput({ target: inp, type: 'input' });
    },
    'rpe-set': (b) => { const st = S.draft.entries[+b.dataset.ei].sets[+b.dataset.si], v = Number(b.dataset.v); if (num(st.rpe) === v) { st.rpe = ''; st.rir = ''; } else { st.rpe = v; st.rir = rpeToRir(v); } S.gymSet = +b.dataset.si; renderMain(); scheduleTraining(); },
    'gym-toggle': () => { S.gym = !S.gym; store.set('ec.gym', S.gym ? '1' : '0'); S.gymSet = null; renderMain(); window.scrollTo({ top: 0 }); },
    'gym-go': (b) => gymGo(+b.dataset.i, true),
    undo: () => undo(),
    'score-set': (b) => { const en = S.draft.entries[+b.dataset.ei], v = Number(b.dataset.v); pushUndo(false); en.score = num(en.score) === v ? null : v; renderMain(); scheduleTraining(); },
    'gym-set': (b) => { S.gymSet = +b.dataset.si; renderMain(); },
    'rest-stop': () => restStop(),
    'rest-go': () => { const r = S.rest; if (r && r.next >= 0) { gymGo(r.next); const el = restEl(); el.innerHTML = restInner(); restTick(); } },
    // rusttijd kiezen: herstart vanaf het einde van de set; de keuze geldt ook voor de volgende sets van die oefening
    'rest-set': (b) => { const r = S.rest; if (!r) return; const v = Number(b.dataset.v); r.total = v; r.end = r.t0 + restLeft(v) * 1000; r.warned = r.end - Date.now() <= REST_WARN * 1000; r.rang = r.end <= Date.now(); const en = S.draft?.entries[r.ei]; if (en) { en.target = { ...(en.target || {}), restPick: v }; scheduleTraining(); } const el = restEl(); el.innerHTML = restInner(); restTick(); },
    'rest-add': (b) => { const r = S.rest; if (!r) return; r.end = Math.max(Date.now() + 1000, r.end + Number(b.dataset.d) * 1000); const left = r.end - Date.now(); if (left > REST_WARN * 1000) r.warned = false; if (left > 0) r.rang = false; restTick(); },
    'rest-sound': () => { store.set('ec.sound', soundOn() ? 'off' : null); audioUnlock(); if (soundOn()) signal(1, true); const el = $('#rest'); if (el && S.rest) { el.innerHTML = restInner(); restTick(); } else restShow(); document.querySelectorAll('.switch[data-act="rest-sound"]').forEach((x) => { x.outerHTML = soundSwitch(); }); toastMsg(soundOn() ? 'Geluid staat aan: je hoorde een testtoon' : 'Geluid staat uit'); },
    'sum-close': () => { S.summary = null; renderSummary(); },
    'sum-copy': () => summaryCopy(),
    'sum-gmail': () => summaryGmail(false),
    'sum-send': () => summaryGmail(true),
    'sum-report': () => { const sid = S.summary?.m.sid; S.summary = null; renderSummary(); if (sid) openReport(sid); },
    'copy-plan': (b) => {
      const en = S.draft.entries[+b.dataset.ei], plan = en.target?.setPlan || [], kpb = kgPerBlock();
      en.sets = plan.map((p) => { const kg = num(p.kg); if (unitOf(en.exId) === 'blok' && kg != null) return { ...splitBlocks(kg), reps: p.reps ?? '' }; return { kg: kg ?? '', reps: p.reps ?? '', mode: en.bwMode || 'auto' }; });
      if (!en.sets.length) en.sets = [{ mode: en.bwMode || 'auto' }];
      renderMain(); scheduleTraining();
    },
    'del-session': () => ask('Training verwijderen?', `De training van ${fmtDate(S.draft.date)} en alle sets verdwijnen definitief.`, async () => { clearTimeout(S.saveTimer); if (S.draft.id && await remove(`clients/${S.cid}/sessions/${S.draft.id}`)) { S.draft = null; toastMsg('Training verwijderd'); render(); } }),
    'sel-block': async (b) => { await savePlan(); S.blockSel = b.dataset.id; S.schemaDraft = null; S.schemaDirty = false; S.slotFilter = ''; renderMain(); },
    'add-brow': (b) => {
      const d = S.schemaDraft; d.exercises = d.exercises || []; const ex = d.exercises;
      const day = b.dataset.slot || 'T1', rk = b.dataset.rk || 'A', used = ex.filter((r) => r.day === day).map((r) => r.code);
      let i = 1; while (used.includes(rk + i)) i++;
      const pd = PHASE_DEF[phaseOf(d.phase)] || PHASE_DEF.Accumulatie, [rmin, rmax] = String(d.reps || '').split('-').map(num);
      const ref = ex.find((r) => reeksOf(r.code) === rk) || {};
      const isF = rk === 'F', isC = rk === 'C';
      const row = { day, code: rk + i, exId: '', variant: '', method: isF ? '' : DEF_METHOD, sets: ref.sets ?? (isF ? 1 : rk === 'A' ? 5 : rk === 'B' ? 4 : 3), repsMin: isF ? null : ref.repsMin ?? (rmin ?? pd.repsMin) + (isC ? 2 : 0), repsMax: isF ? null : ref.repsMax ?? (rmax ?? pd.repsMax) + (isC ? 2 : 0), tempo: isF ? '' : ref.tempo ?? pd.tempo, rest: isF ? null : ref.rest ?? restFor(d.phase, rk), rir: isF ? null : ref.rir ?? pd.rir, note: '', filler: '', warmup: [] };
      row.setPlan = methodPlan(row); ex.push(row); markSchemaDirty(); renderMain();
    },
    'gen-slot': (b) => {
      const d = S.schemaDraft, slot = b.dataset.slot, idx = SLOTS.indexOf(slot), pd = PHASE_DEF[phaseOf(d.phase)] || PHASE_DEF.Accumulatie, [rmin, rmax] = String(d.reps || '').split('-').map(num);
      const ref = slotsOf(d).find((sl) => sl !== slot && d.exercises.some((r) => r.day === sl));
      const cnt = (rk) => (ref ? d.exercises.filter((r) => r.day === ref && reeksOf(r.code) === rk).length : rk === 'F' ? 1 : 2);
      const setsOf = (rk, def) => (ref ? num(d.exercises.find((r) => r.day === ref && reeksOf(r.code) === rk)?.sets) : null) || def;
      const g = { phase: phaseOf(d.phase), perWeek: idx + 1, repsMin: rmin ?? pd.repsMin, repsMax: rmax ?? pd.repsMax, rir: pd.rir, nA: cnt('A'), nB: cnt('B'), nC: cnt('C'), nF: cnt('F'), setsA: setsOf('A', 5), setsB: setsOf('B', 4), setsC: setsOf('C', 3) };
      d.exercises.push(...genProposal(g, [idx], d.exercises.map((r) => r.exId)));
      markSchemaDirty(); renderMain(); toastMsg(`Voorstel voor ${slotLabel(slot)} toegevoegd`);
    },
    'fill-plan': (b) => { const r = S.schemaDraft.exercises[+b.dataset.ri]; r.setPlan = methodPlan(r); if (r.warmupAuto !== false) r.warmup = warmupPlan(r); markSchemaDirty(); renderMain(); toastMsg('Sets herberekend volgens methode en 1RM-basis'); },
    'del-brow': (b) => { S.schemaDraft.exercises.splice(+b.dataset.ri, 1); S.schemaDirty = true; renderMain(); },
    'del-block': () => {
      const d = S.schemaDraft; if (!d) return;
      const n = Object.values(S.sessions).filter((s) => s.blockId === d.id).length;
      if (n) { toastMsg(`Deze periode heeft ${n} trainingen: verwijder die eerst.`); return; }
      ask('Periode verwijderen?', `${d.code} wordt definitief verwijderd.`, async () => { if (S.blocks[d.id]?._unsaved) delete S.blocks[d.id]; else if (!(await remove(`clients/${S.cid}/blocks/${d.id}`))) return; S.schemaDraft = null; S.schemaDirty = false; S.blockSel = null; toastMsg('Periode verwijderd'); render(); });
    },
    'sel-prog': (b) => { S.progEx = b.dataset.id; renderMain(); },
    'stat-block': (b) => { S.statBlock = b.dataset.id; renderMain(); },
    'bwu-add': (b) => { const r = S.schemaDraft.exercises[+b.dataset.ri]; r.warmup = r.warmup || []; const l = r.warmup[r.warmup.length - 1]; r.warmup.push({ kg: '', reps: l ? Math.max(1, Math.round((num(l.reps) || 2) / 2)) : '' }); r.warmupAuto = false; markSchemaDirty(); renderMain(); },
    'bwu-del': (b) => { const r = S.schemaDraft.exercises[+b.dataset.ri]; r.warmup.splice(+b.dataset.wi, 1); r.warmupAuto = false; markSchemaDirty(); renderMain(); },
    'bwu-auto': (b) => { const r = S.schemaDraft.exercises[+b.dataset.ri]; const w = warmupPlan(r); if (!w.length) { toastMsg(['A', 'B'].includes(reeksOf(r.code)) ? 'Vul eerst het gewicht per set in.' : 'Opwarmsets worden voorgesteld voor de A- en B-reeks.'); return; } r.warmup = w; r.warmupAuto = true; markSchemaDirty(); renderMain(); },
    'wset-add': (b) => { const en = S.draft.entries[+b.dataset.ei]; en.warmup = en.warmup || []; en.warmup.push({ kg: '', reps: '' }); renderMain(); },
    'wset-del': (b) => { const en = S.draft.entries[+b.dataset.ei]; en.warmup.splice(+b.dataset.wi, 1); renderMain(); scheduleTraining(); },
    'rep-open': async () => { if (!(await saveTraining()) || !S.draft?.id) { toastMsg('Log eerst minstens één set.'); return; } openReport(S.draft.id); },
    'rep-close': () => { S.report = null; renderReport(); },
    'rep-dl': () => reportDownload(),
    'rep-gmail': () => reportGmail(false),
    'rep-send': () => reportGmail(true),
    'new-event': () => { S.eventDraft = { name: '', date: '', division: '', place: '', stations: [] }; S.eventDirty = true; renderMain(); },
    'add-station': () => { S.eventDraft.stations = S.eventDraft.stations || []; S.eventDraft.stations.push({ name: '', req: '', status: 'Nieuw' }); S.eventDirty = true; renderMain(); },
    'del-station': (b) => { S.eventDraft.stations.splice(+b.dataset.i, 1); S.eventDirty = true; renderMain(); },
    'reset-event': () => { S.eventDraft = null; S.eventDirty = false; render(); },
    'save-event': async () => { const d = clone(S.eventDraft); if (!d.name || !d.date) { toastMsg('Geef het event een naam en datum.'); return; } (d.stations || []).forEach((s) => { s.raceKg = num(s.raceKg); s.trainKg = num(s.trainKg); }); if (await write(`clients/${S.cid}`, { event: d }, true)) { S.eventDirty = false; S.eventDraft = null; toastMsg('Event opgeslagen'); render(); } },
    'close-event': () => ask('Event afsluiten?', 'Het event en de stations verdwijnen uit het profiel. Trainingen en progressie blijven bewaard.', async () => { if (await write(`clients/${S.cid}`, { event: null }, true)) { S.eventDraft = null; S.eventDirty = false; toastMsg('Event afgesloten'); render(); } }, 'Afsluiten'),
    'ex-new': () => { S.exNew = { name: '', type: 'kracht', category: 'Borst', secondary: [], unit: 'kg', note: '' }; renderMain(); $('#ex-name')?.focus(); },
    'ex-edit': (b) => { S.exEdit = clone(S.exercises[b.dataset.id]); renderMain(); },
    'ex-cancel': () => { S.exNew = null; S.exEdit = null; render(); },
    'ex-save': async () => {
      const d = S.exNew || S.exEdit; if (!d.name?.trim()) { toastMsg('Geef de oefening een naam.'); return; }
      const units = (d.type || exType(d)) === 'conditie' ? UNITS_C : UNITS_K; const unit = units.some((u) => u[0] === d.unit) ? d.unit : units[0][0];
      const body = { name: d.name.trim(), type: (d.type || exType(d)), category: d.category, secondary: [...new Set((d.secondary || []).filter((x) => x && x !== d.category))], unit, pattern: d.pattern || '', note: d.note || '' };
      if (S.exNew) { if (Object.values(S.exercises).some((e) => e.name.toLowerCase() === body.name.toLowerCase())) { toastMsg('Deze oefening bestaat al.'); return; } let id = slug(body.name); if (S.exercises[id]) id += '-' + Math.random().toString(36).slice(2, 5); if (await write(`exercises/${id}`, body)) { S.exNew = null; toastMsg('Oefening toegevoegd'); render(); } }
      else if (await write(`exercises/${d.id}`, body, true)) { S.exEdit = null; toastMsg('Oefening opgeslagen'); render(); }
    },
    'confirm-no': () => { S.confirm = null; renderOverlay(); },
    'confirm-yes': async () => { const fn = S.confirm?.fn; S.confirm = null; renderOverlay(); if (fn) await fn(); },
  };
  function ask(title, text, fn, yes, safe) { S.confirm = { title, text, fn, yes, safe }; renderOverlay(); }
  function blocking() { return S.profileDraft || S.newClient || (S.view === 'event' && S.eventDirty) || S.exEdit || S.exNew || (S.view === 'intake' && S.intakeDraft?.dirty) || (S.view === 'settings' && S.settingsDraft?.dirty); }
  function confirmLeave() { toastMsg('Sla eerst op of annuleer je wijzigingen.'); return false; }
  async function selectClient(id, view) {
    if (blocking()) { confirmLeave(); renderHeader(); return; }
    await flushAll();
    S.cid = id || null; store.set('ec.cid', S.cid); S.draft = null; S.schemaDraft = null; S.blockSel = null; S.gen = null; S.trainBlock = null; S.slotFilter = ''; S.progEx = null; S.eventDraft = null; S.intakeDraft = null;
    S.view = id ? (view || (S.view === 'home' ? 'overview' : S.view)) : 'home'; store.set('ec.view', S.view);
    subscribeClient(S.cid); render();
  }

