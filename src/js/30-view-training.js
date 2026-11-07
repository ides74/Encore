  // ---------- view: training ----------
  // v1.2.0 "voorstel is geen waarde": grey = suggestion (plan, else last time), black = confirmed or typed. Only black is saved as done.
  const setDone = (st) => st?.ok === true || ['reps', 'value', 'time'].some((f) => st?.[f] !== '' && st?.[f] != null);
  // onvolledig: gewicht ingevuld maar geen reps
  const setPartial = (st) => !setDone(st) && ['kg', 'blocks'].some((f) => st?.[f] !== '' && st?.[f] != null);
  // suggestion for one set, without RPE (how heavy it felt is never assumed)
  function setSuggest(en, si) {
    const pl = (en.target?.setPlan || [])[si], kpb = kgPerBlock(), unit = unitOf(en.exId);
    if (pl && (num(pl.kg) != null || num(pl.reps) != null)) {
      const kg = num(pl.kg);
      if (unit === 'blok' && kg != null) return { ...splitBlocks(kg), reps: pl.reps ?? '' };
      return { kg: kg ?? '', reps: pl.reps ?? '', mode: en.bwMode || 'auto' };
    }
    const prev = prevSummary(en.exId, S.draft?.date), ph = prev?.sets?.[si] || prev?.sets?.[prev?.sets?.length - 1];
    if (!ph) return null;
    return { kg: ph.blocks != null && ph.blocks !== '' ? '' : (unit === 'bw' ? ph.kg ?? '' : setKg(ph, en.exId) ?? ph.kg ?? ''), blocks: ph.blocks ?? '', extra: ph.extra ?? '', reps: ph.reps ?? '', value: ph.value ?? '', time: ph.time ?? '', mode: 'extra' };
  }
  const rowPlan = (r) => {
    const n = Math.max(1, num(r.sets) || 0);
    const src = Array.isArray(r.setPlan) && r.setPlan.length ? r.setPlan : null;
    return Array.from({ length: n }, (_, i) => {
      const x = src ? (src[i] || src[src.length - 1] || {}) : {};
      return { kg: src ? x.kg ?? '' : r.startKg ?? '', reps: src ? x.reps ?? '' : r.repsMax ?? '', note: src ? x.note || '' : '' };
    });
  };
  function newDraft(date, blockId, day) {
    const b = S.blocks[blockId];
    const rows = day ? (b?.exercises || []).filter((r) => r.exId && normDay(b, r.day) === day).sort((x, y) => codeSort(x.code, y.code)) : [];
    return {
      id: null, date, blockId, day, week: weekFor(b, date), feedback: {}, genWarm: { done: false, txt: client()?.warmupDefault || 'Roeien 2 min (±500 m)' }, fins: [],
      entries: rows.map((r) => { const plan = rowPlan(r); if (reeksOf(r.code) === 'A' && r.warmupAuto !== false) { const w = warmupPlan({ ...r, setPlan: plan }); if (w.length) r = { ...r, warmup: w }; } return { exId: r.exId, variant: r.variant || '', target: { sets: r.sets, repsMin: r.repsMin, repsMax: r.repsMax, tempo: r.tempo, rest: r.rest, rir: r.rir, method: r.method || b?.method || '', setPlan: plan, code: r.code, note: r.note, warmup: clone(r.warmup || []), filler: r.filler || '' }, warmup: (r.warmup || []).map((w) => ({ kg: w.kg ?? '', reps: w.reps ?? '' })), bwMode: 'auto', sets: plan.map(() => ({ mode: 'auto' })) }; }),
    };
  }
  function viewTraining() {
    const c = client();
    if (!S.draft) {
      const bl = sortedBlocks(), t = todayStr(), cur = blockFor(t);
      if (!S.trainBlock || !S.blocks[S.trainBlock]) S.trainBlock = cur?.id || bl[bl.length - 1]?.id || null;
      const b = S.blocks[S.trainBlock], slots = b ? slotsOf(b) : [];
      const inBlock = sortedSessions().filter((s) => b && s.blockId === b.id && !s.historical);
      const lastOf = (sl) => inBlock.filter((s) => sessSlot(s) === sl).pop();
      const lastDone = inBlock[inBlock.length - 1], li = lastDone ? slots.indexOf(sessSlot(lastDone)) : -1;
      const next = slots.length ? slots[(li + 1) % slots.length] : null;
      const date = S.trainDate || t;
      const btns = slots.map((sl) => {
        const rows = (b.exercises || []).filter((r) => r.exId && normDay(b, r.day) === sl).sort((x, y) => codeSort(x.code, y.code));
        const aRows = rows.filter((r) => reeksOf(r.code) === 'A');
        const ld = lastOf(sl);
        return `<button class="slotbtn${sl === next ? ' next' : ''}" data-act="start-slot" data-slot="${sl}"${S.canWrite ? '' : ' disabled'}>
          <span class="nm">${slotLabel(sl)}${sl === next ? '<span class="pill acc">volgende</span>' : ''}</span>
          <span class="small">${rows.length} oefeningen${aRows.length ? ' · A: ' + esc(aRows.map((r) => exName(r.exId)).join(', ')) : ''}</span>
          <span class="small muted">${ld ? 'Laatst ' + esc(fmtDate(ld.date, false)) + ' (week ' + esc(ld.week) + ')' : 'Nog niet gedaan in deze periode'}</span></button>`;
      }).join('');
      return `<section class="card"><div class="card-h"><div><h2>Training loggen</h2><p class="sub">Kies de training van vandaag. Het schema en wat ${esc(c.name)} vorige keer deed, staan meteen klaar per set.</p></div></div>
        <div class="form" style="margin-bottom:14px"><label class="field"><span>Datum</span><input type="date" id="nt-date" value="${esc(date)}"></label>
        <label class="field"><span>Periode</span><select id="nt-block">${bl.slice().reverse().map((x) => `<option value="${esc(x.id)}"${x.id === S.trainBlock ? ' selected' : ''}>${esc(x.code)} · ${esc(phaseOf(x.phase))}${cur && x.id === cur.id ? ' (nu)' : ''}</option>`).join('')}</select></label></div>
        ${b ? `<div class="slotgrid">${btns}</div><div class="row" style="margin-top:10px"><button class="btn ghost small" data-act="start-slot" data-slot=""${S.canWrite ? '' : ' disabled'}>+ Vrije training zonder schema</button></div>` : '<p class="notice">Bouw eerst een periode op in Planning.</p>'}</section>
        ${inBlock.length ? `<section class="card"><div class="card-h"><h2>Gelogd in ${esc(b.code)}</h2><button class="btn ghost small" data-act="view" data-v="history">Volledige historiek</button></div>
        <div class="tablewrap"><table><thead><tr><th>Datum</th><th>Training</th><th class="num">Week</th><th class="num">Oef.</th>${tracks(c, 'attention') ? `<th class="num">${ATT}</th>` : ''}</tr></thead><tbody>${inBlock.slice().reverse().map((s) => `<tr class="click" data-act="open-session" data-id="${esc(s.id)}"><td>${esc(fmtDate(s.date))}</td><td>${esc(slotLabel(sessSlot(s)))}</td><td class="num">${esc(s.week)}</td><td class="num">${(s.entries || []).length}</td>${tracks(c, 'attention') ? `<td class="num">${nl(s.feedback?.pain, 0)}</td>` : ''}</tr>`).join('')}</tbody></table></div></section>` : ''}`;
    }
    const d = S.draft, b = S.blocks[d.blockId];
    if (S.gym) return viewGym(d, b);
    let lastReeks = null;
    const entries = d.entries.map((en, ei) => {
      const I = entryInfo(en, d.date), { ex, unit, tg, strength, prev, plan, rk } = I;
      const heading = rk !== lastReeks ? `<div class="reeks-h" data-rk="${rk || 'X'}">${REEKS_LABEL[rk]}</div>` : ''; lastReeks = rk;
      const head = unit === 'blok' ? '<th class="num">Blok</th><th class="num">+ extra kg</th>' : unit === 'bw' ? '<th class="num">Kg</th><th class="num">Totaal</th>' : strength ? `<th class="num">${esc(kgLabel(en.exId))}</th>` : `<th class="num">${esc((UNITS.find((u) => u[0] === unit) || [, unit])[1])}</th><th class="num">Tijd</th>`;
      const rows = en.sets.map((st, si) => {
        const ph = prev?.sets?.[si] || prev?.sets?.[prev.sets.length - 1] || {}, pl = plan[si] || {};
        const plKg = num(pl.kg);
        const inp = (f, cls, phv, stp) => { const el = `<input class="${cls}" inputmode="decimal" id="s-${ei}-${si}-${f}" data-bind="set" data-ei="${ei}" data-si="${si}" data-f="${f}" value="${esc(st[f] ?? '')}" placeholder="${esc(phv ?? '')}" aria-label="${f} set ${si + 1}">`; return `<td class="num">${stp ? stepWrap(el, ei, si, f, stp) : el}</td>`; };
        let cells;
        if (unit === 'blok') { const sp = plKg != null ? splitBlocks(plKg) : ph; cells = inp('blocks', 'xs', nl(sp.blocks, 0), 1) + inp('extra', 'xs', nl(sp.extra) || '0'); }
        else if (unit === 'bw') { const tot = setKg(st, en.exId); cells = inp('kg', 'xs', plKg != null ? nl(plKg) : nl(ph.kg), 1) + `<td class="num muted" id="tot-${ei}-${si}">${tot != null && (num(st.kg) != null || num(st.reps) != null) ? nl(tot) + ' kg' : ''}</td>`; }
        else if (strength) cells = inp('kg', 'xs', plKg != null ? nl(plKg) : nl(setKg(ph, en.exId)), 1);
        else cells = inp('value', 'n', nl(ph.value)) + `<td class="num"><input class="xs" id="s-${ei}-${si}-time" data-bind="set" data-ei="${ei}" data-si="${si}" data-f="time" value="${esc(st.time ?? '')}" placeholder="${esc(ph.time || 'mm:ss')}" aria-label="tijd set ${si + 1}"></td>`;
        return `<tr><td class="setno">${setNoHTML(en, ei, si)}</td>${cells}${inp('reps', 'xs', nl(num(pl.reps) ?? ph.reps, 0), 1)}<td class="num" id="e1-${ei}-${si}">${strength ? nl(e1(st, en.exId, tg.code)) : ''}</td><td id="sg-${ei}-${si}">${sigHTML(st, tg)}</td><td><button class="btn ghost small" data-act="del-set" data-ei="${ei}" data-si="${si}" aria-label="Set verwijderen">×</button></td></tr>`;
      }).join('');
      return `${heading}<div class="ex-card" data-rk="${rk || 'X'}"><div class="head"><div class="row" style="gap:10px"><span class="code">${esc(tg.code || '+')}</span><span class="title">${esc(ex.name || 'Kies oefening')}</span>${en.sets.length ? `<span class="pill ${en.sets.filter(setDone).length === en.sets.length ? 'ok' : 'neutral'} setprog">${en.sets.filter(setDone).length === en.sets.length ? '✓ Klaar: ' : ''}${en.sets.filter(setDone).length} van ${en.sets.length} sets</span>` : ''}</div>
        <div class="row" style="gap:6px"><input style="width:14rem" id="var-${ei}" data-bind="entry" data-ei="${ei}" data-f="variant" value="${esc(en.variant)}" placeholder="variant: grip, hoek…" aria-label="Variant"><button class="btn ghost small" data-act="del-entry" data-ei="${ei}">Verwijder</button></div></div>
        ${I.tgt ? `<div class="target">Schema: ${esc(I.tgt)}${tg.note ? ' · ' + esc(tg.note) : ''}</div>` : ''}
        ${planLineHTML(I, ei)}
        ${prevLineHTML(I, ei)}
        ${strength ? wuRowHTML(en, ei) : ''}
        ${tg.filler ? `<div class="small">Filler tijdens de rust: <b>${esc(tg.filler)}</b></div>` : ''}
        ${unit === 'bw' ? bwModeHTML(en, ei) : ''}
        <div class="tablewrap"><table><thead><tr><th>Set</th>${head}<th class="num">Reps</th><th class="num">e1RM</th><th>Signaal</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
        <div><button class="btn gym-extra" data-act="add-set" data-ei="${ei}">+ Extra set</button></div>
        ${exfbHTML(en, ei)}</div>`;
    }).join('');
    return `<section class="card"><div class="card-h"><div><h2>${esc(slotLabel(d.day))}${d.id ? ' bewerken' : ''}</h2><p class="sub">${esc(client().name)} · ${esc(b?.code || '')} ${esc(phaseOf(b?.phase))} · week ${esc(d.week)}</p></div><button class="btn small" data-act="gym-toggle">Gymmodus</button></div>
      ${metaFormHTML(d)}${genWarmHTML(d)}</section>
      ${entries ? `<div class="ex-list">${entries}</div>` : '<div class="empty">Geen oefeningen voor deze training in het schema. Voeg er hieronder een toe.</div>'}
      ${addExHTML()}
      ${finHTML(d)}
      ${fbHTML(d)}
      ${stickyHTML(d, false)}`;
  }

  // ---------- training: gedeelde bouwstenen (lijst en gymmodus) ----------
  const entryDone = (en) => (en.sets || []).length > 0 && en.sets.every(setDone);
  // alles wat een oefening in het logboek toont: schema, plan per set, vorige keer
  function entryInfo(en, date) {
    const ex = S.exercises[en.exId] || {}, unit = ex.unit || 'kg', tg = en.target || {}, strength = STRENGTH.includes(unit);
    const prev = prevSummary(en.exId, date), plan = Array.isArray(tg.setPlan) ? tg.setPlan : [], rk = reeksOf(tg.code);
    const planTxt = plan.some((p) => num(p.kg) != null || num(p.reps) != null) ? plan.map((p) => `${kgPlanTxt(unit, num(p.kg))} × ${nl(p.reps, 0) || '?'}${p.note ? ' (' + p.note + ')' : ''}`).join(' · ') : '';
    const ad = rk !== 'F' ? adaptInfo(tg.repsMin, tg.repsMax) : null;
    const tgt = [normMethod(tg.method), ad && ad.txt, tg.sets && `${tg.sets} sets`, (tg.repsMin || tg.repsMax) && `${tg.repsMin ?? ''}${tg.repsMax && tg.repsMax !== tg.repsMin ? '-' + tg.repsMax : ''} reps`, tg.rir != null && tg.rir !== '' && `RPE ${nl(rirToRpe(tg.rir))}`, tg.tempo && `tempo ${tg.tempo}`, tutInfo(tg) && `TUT ${tutInfo(tg).txt}`, tg.rest && `${restTxt(tg.rest)} rust`].filter(Boolean).join(' · ');
    return { ex, unit, tg, strength, prev, plan, rk, planTxt, tgt };
  }
  // referentiegewicht van een oefening: hoogste uit plan, opwarming uit plan en de historiek
  const refKg = (en) => { const v = [...(en.target?.setPlan || []).map((p) => num(p.kg)), ...history(en.exId, S.draft?.date).flatMap((h) => h.sets.map((x) => setKg(x, en.exId)))].filter((x) => x != null && x > 0); return v.length ? Math.max(...v) : null; };
  // onmogelijk of verdacht gewicht: geeft null of { hard, msg, fix }
  function weightIssue(en, st) {
    const u = unitOf(en.exId);
    if (u === 'blok' && num(st.blocks) != null && (num(st.blocks) > BLOK_MAX || num(st.blocks) < 0)) return { hard: true, msg: `Blok ${nl(st.blocks)} bestaat niet: het toestel heeft ${BLOK_MAX} grote blokken.` };
    if (!['kg', 'kg per hand'].includes(u)) return null;
    const kg = num(st.kg), r = num(st.reps); if (r != null && r > 60) return { hard: true, msg: `${nl(r, 0)} reps is onmogelijk veel. Typfout?` };
    if (kg == null) return null;
    const ref = refKg(en), cap = u === 'kg per hand' ? 80 : 400;
    if (u === 'kg per hand' && ref && kg >= ref * 1.7 && Math.abs(kg / 2 - ref) <= ref * 0.3) return { hard: false, double: true, fix: kg / 2, msg: `${nl(kg)} kg per dumbbell? Dat lijkt het totaal van 2 dumbbells (2 × ${nl(kg / 2)} kg).` };
    if (kg > cap || (ref && kg > Math.max(ref * 1.6, ref + 40))) return { hard: true, msg: `${nl(kg)} kg is onmogelijk hoog${ref ? ` (plan of beste tot nu ${nl(ref)} kg)` : ''}. Typfout?` };
    return null;
  }
  // ✓ in de lijst: knop zolang het voorstel niet bevestigd is, vinkje zodra de set een waarde heeft
  const setNoHTML = (en, ei, si) => (setDone(en.sets[si]) ? '<span class="setok" title="Bevestigd">✓</span>' : (setSuggest(en, si) ? `<button class="btn small setconfirm" data-act="confirm-set" data-ei="${ei}" data-si="${si}" aria-label="Set ${si + 1} bevestigen zoals voorgesteld">✓</button>` : '')) + `<span class="muted">${si + 1}</span>`;
  // ± knoppen naast een veld: sneller dan het toetsenbord op de gsm
  const stepBtn = (ei, si, f, dlt, lab) => `<button type="button" class="stepb" data-act="step" data-ei="${ei}" data-si="${si}" data-f="${f}" data-d="${dlt}" aria-label="${esc(lab)} ${dlt > 0 ? 'plus' : 'min'} ${Math.abs(dlt)}">${dlt > 0 ? '+' : '−'}</button>`;
  const stepWrap = (el, ei, si, f, stp) => `<div class="step">${stepBtn(ei, si, f, -stp, f)}${el}${stepBtn(ei, si, f, stp, f)}</div>`;
  const planLineHTML = (I, ei) => (I.planTxt ? `<div class="prev"><span>Plan per set: <b>${esc(I.planTxt)}</b>${I.unit === 'bw' ? ' <span class="muted">(LG = lichaamsgewicht ' + esc(nl(bwNow())) + ' kg)</span>' : ''}</span><button class="btn small" data-act="copy-plan" data-ei="${ei}">Alles zoals gepland</button></div>` : '');
  const prevLineHTML = (I, ei) => { const p = I.prev; return `<div class="prev">${p ? `<span>Vorige keer <b>${esc(fmtDate(p.date, false))}</b>: ${esc(p.text)}${p.best ? ` · beste e1RM <b>${nl(p.best)} kg</b>` : ''}${p.score != null ? ` · score <b>${nl(p.score, 0)}/10</b>` : ''}${p.hard ? ` · te moeilijk: <b>${esc(p.hard)}</b>` : ''}</span><button class="btn small" data-act="copy-prev" data-ei="${ei}">Neem vorige over</button>` : '<span class="muted">Nog niet eerder gelogd.</span>'}</div>`; };
  // opwarmsets met ✓: een opwarmset staat al ingevuld uit het schema, dus "gedaan" is een aparte vlag (done)
  const wuRowHTML = (en, ei) => `<div class="wu-row"><span class="lab">Opwarming</span>${(en.warmup || []).map((w, wi) => `<span class="wucell${w.done ? ' done' : ''}"><input class="xs" inputmode="decimal" id="w-${ei}-${wi}-kg" data-bind="wset" data-ei="${ei}" data-wi="${wi}" data-f="kg" value="${esc(w.kg ?? '')}" placeholder="kg" aria-label="kg opwarmset ${wi + 1}">${unitOf(en.exId) === 'blok' && num(w.kg) != null ? `<span class="small muted">= ${esc(blokTxt(splitBlocks(w.kg)))}</span>` : ''}<span class="muted">×</span><input class="xs" inputmode="numeric" id="w-${ei}-${wi}-reps" data-bind="wset" data-ei="${ei}" data-wi="${wi}" data-f="reps" value="${esc(w.reps ?? '')}" placeholder="reps" aria-label="reps opwarmset ${wi + 1}"><button type="button" class="btn small wuok" data-act="wset-ok" data-ei="${ei}" data-wi="${wi}" aria-pressed="${!!w.done}" aria-label="Opwarmset ${wi + 1} ${w.done ? 'gedaan' : 'bevestigen'}">✓</button><button class="btn ghost small" style="padding:0 4px" data-act="wset-del" data-ei="${ei}" data-wi="${wi}" aria-label="Opwarmset verwijderen">×</button></span>`).join('') || '<span class="small muted">geen gepland</span>'}<button class="btn ghost small" data-act="wset-add" data-ei="${ei}">+ opwarmset</button></div>`;
  const bwModeHTML = (en, ei) => `<div class="row small" style="gap:8px"><label for="bwm-${ei}" class="muted">Ingevuld gewicht is</label><select id="bwm-${ei}" data-bind="bwmode" data-ei="${ei}">${BW_MODES.map(([v, l]) => `<option value="${v}"${v === (en.bwMode || 'auto') ? ' selected' : ''}>${l}</option>`).join('')}</select><span class="muted">${(en.bwMode || 'auto') === 'auto' ? `Auto: onder ${esc(nl(round05((bwNow() || 0) * 0.5)))} kg = extra bovenop het lichaamsgewicht (${esc(nl(bwNow()))} kg), vanaf dan = totaal.` : (en.bwMode === 'total' ? 'Totaal gewicht, lichaamsgewicht inbegrepen.' : 'Extra gewicht bovenop het lichaamsgewicht.')}</span></div>`;
  // gymmodus: groot tekstvak (dicteren via het toetsenbord) en scores 1-10 als knoppen
  const bigEvalHTML = (en, ei) => `<div class="bigeval"><label for="hard-${ei}" class="lab">Hoe ging het? Wat was te moeilijk?</label><textarea id="hard-${ei}" data-bind="entry" data-ei="${ei}" data-f="hard" rows="3" placeholder="Tik hier, druk op 🎤 op je toetsenbord en spreek in">${esc(en.hard ?? '')}</textarea>
      <div class="lab">Score op 10</div><div class="scores">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => `<button type="button" class="sc" data-act="score-set" data-ei="${ei}" data-v="${v}" aria-pressed="${num(en.score) === v}">${v}</button>`).join('')}</div></div>`;
  const exfbHTML = (en, ei) => `<div class="exfb"><label class="field"><span>Wat was te moeilijk?</span><input id="hard-${ei}" data-bind="entry" data-ei="${ei}" data-f="hard" value="${esc(en.hard ?? '')}" placeholder="bv. laatste reps, lockout, grip, techniek"></label><label class="field"><span>Score op 10</span><input id="score-${ei}" type="number" min="1" max="10" inputmode="numeric" data-bind="entry" data-ei="${ei}" data-f="score" value="${esc(en.score ?? '')}" placeholder="optioneel"></label></div>`;
  // algemene opwarming (bv. roeien) en finisher: los van de oefeningen in het schema
  const FIN_LIST = ['Roeisprint', 'Sled push', 'SkiErg sprint', 'Echo bike', 'Burpees', "Farmer's carry", 'KB swings'];
  const genWarmHTML = (d) => { const g = d.genWarm || { done: false, txt: client()?.warmupDefault || 'Roeien 2 min (±500 m)' }; return `<div class="genwarm${g.done ? ' done' : ''}"><button type="button" class="btn gw-ok" data-act="gw-toggle" aria-pressed="${!!g.done}">${g.done ? '✓' : ''}</button><span class="lab">Algemene opwarming</span><input id="gw-txt" data-bind="gw" value="${esc(g.txt || '')}" placeholder="bv. Roeien 2 min (±500 m)" aria-label="Algemene opwarming"></div>`; };
  const finHTML = (d) => `<section class="card fincard"><div class="card-h"><div><h3>Finisher</h3><p class="sub">Na de training: roeisprint, sled push… Vul het resultaat in (afstand, tijd, gewicht).</p></div></div>
      ${(d.fins || []).map((f, i) => `<div class="finrow${f.done ? ' done' : ''}"><input list="fin-list" id="fin-${i}-name" data-bind="fin" data-i="${i}" data-f="name" value="${esc(f.name || '')}" placeholder="Oefening" aria-label="Finisher oefening"><input id="fin-${i}-result" data-bind="fin" data-i="${i}" data-f="result" value="${esc(f.result || '')}" placeholder="bv. 250 m in 0:48" aria-label="Resultaat"><button type="button" class="btn gw-ok" data-act="fin-ok" data-i="${i}" aria-pressed="${!!f.done}">${f.done ? '✓' : '✓'}</button><button class="btn ghost small" data-act="fin-del" data-i="${i}" aria-label="Finisher verwijderen">×</button></div>`).join('')}
      <div class="row" style="gap:8px">${FIN_LIST.slice(0, 3).map((x) => `<button class="btn" data-act="fin-add" data-v="${esc(x)}">+ ${esc(x)}</button>`).join('')}<button class="btn" data-act="fin-add" data-v="">+ Andere</button></div>
      <datalist id="fin-list">${FIN_LIST.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></section>`;
  const metaFormHTML = (d) => { const b = S.blocks[d.blockId]; return `<div class="form"><label class="field"><span>Datum</span><input type="date" id="d-date" data-bind="meta" data-f="date" value="${esc(d.date)}"></label>
      <label class="field"><span>Blok</span><select id="d-block" data-bind="meta" data-f="blockId">${sortedBlocks().map((x) => `<option value="${esc(x.id)}"${x.id === d.blockId ? ' selected' : ''}>${esc(x.code)}</option>`).join('')}</select></label>
      <label class="field"><span>Week</span><input id="d-week" type="number" min="1" data-bind="meta" data-f="week" value="${esc(d.week)}"></label>
      <label class="field"><span>Training</span><select id="d-day" data-bind="meta" data-f="day"><option value="">Vrije training</option>${[...new Set([...slotsOf(b), d.day].filter(Boolean))].map((x) => `<option value="${esc(x)}"${x === d.day ? ' selected' : ''}>${esc(slotLabel(x))}</option>`).join('')}</select></label></div>`; };
  const addExHTML = () => `<div class="row"><select id="add-ex" aria-label="Oefening toevoegen"><option value="">Oefening toevoegen…</option>${Object.values(S.exercises).sort((a, z) => a.name.localeCompare(z.name)).map((e) => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('')}</select><button class="btn" data-act="add-entry">+ Toevoegen</button></div>`;
  const fbHTML = (d) => { const c = client(), fbv = d.feedback || {}; return `<details class="card" open><summary>Feedback van de klant <span class="small muted" style="text-transform:none;letter-spacing:0;font-family:var(--f-body)">optioneel</span></summary>
        <div class="form" style="margin-top:12px">
          <label class="field"><span>Lichaamsgewicht (kg)</span><input id="fb-bw" inputmode="decimal" data-bind="fb" data-f="bodyweight" value="${esc(fbv.bodyweight ?? '')}" placeholder="${esc(nl(c.stats?.lastBodyweight ?? c.bodyweight))}"></label>
          ${tracks(c, 'whoop') ? `<label class="field"><span>Whoop recovery (%)</span><input id="fb-whoop" inputmode="numeric" data-bind="fb" data-f="whoop" value="${esc(fbv.whoop ?? '')}"></label>` : ''}
          ${tracks(c, 'attention') ? `<label class="field"><span>${ATT} (0-10)</span><input id="fb-pain" type="number" min="0" max="10" data-bind="fb" data-f="pain" value="${esc(fbv.pain ?? '')}" placeholder="${esc(c.constraints || '')}"></label>` : ''}
          <label class="field"><span>Energie (1-5)</span><input id="fb-energy" type="number" min="1" max="5" data-bind="fb" data-f="energy" value="${esc(fbv.energy ?? '')}"></label>
          <label class="field wide"><span>Notitie</span><textarea id="fb-note" data-bind="fb" data-f="note">${esc(fbv.note ?? '')}</textarea></label>
        </div></details>`; };
  const delRepHTML = (d) => `<button class="btn danger" data-act="del-session"${d.id ? '' : ' hidden'}>Verwijderen</button>${d.report?.at ? `<span class="pill ok" style="align-self:center">Rapport ${esc(fmtDate(d.report.at.slice(0, 10), false))}</span>` : ''}<button class="btn" data-act="rep-open"${d.id ? '' : ' disabled'}>Rapport naar klant</button>`;
  // onderste balk: rusttimer, bewaarstatus, Klaar. In gymmodus is "Set klaar" de hoofdknop, dus Klaar is daar gewoon.
  const stickyHTML = (d, gym) => `<div class="sticky-actions">${restHTML()}${gym ? `<button class="btn undo" data-act="undo"${(S.undo || []).length ? '' : ' disabled'} aria-label="Laatste stap ongedaan maken">↶ Terug</button>` : ''}<span class="small muted" id="save-state" style="margin-right:auto;align-self:center">${esc(S.saveState || 'Wordt automatisch bewaard')}</span>${gym ? '' : delRepHTML(d)}<button class="btn primary" data-act="done-training">Training afronden</button></div>`;

  function sigHTML(st, tg) {
    const r = num(st.reps), rm = num(tg?.repsMax), rir = num(st.rir);
    if (r != null && rm != null && r > rm) return '<span class="sig-up">↑ verhoog</span>';
    if (rir != null && rir < 1) return '<span class="sig-bad">te zwaar</span>';
    return '';
  }

  // per methode een setopbouw: reps, gewicht (vanuit de 1RM-basis) en een korte uitleg per set
  function methodPlan(r) {
    const n = Math.max(1, Math.min(12, num(r.sets) || 1)), rMax = num(r.repsMax) ?? num(r.repsMin), rir = num(r.rir), m = normMethod(r.method) || DEF_METHOD, rMin0 = num(r.repsMin) ?? rMax;
    const strong = r.exId && isStrength(r.exId);
    const kg = (reps, f = 1) => { if (!strong || !reps) return ''; const k = planKg(r.exId, reps, rir, r.code); return k == null ? '' : round05(k * f); };
    const A = (fn) => Array.from({ length: n }, (_, i) => fn(i));
    if (!strong) return A(() => ({ kg: '', reps: rMax ?? '', note: '' }));
    const lo = Math.min(rMin0 ?? rMax, rMax ?? rMin0), hi = Math.max(rMin0 ?? rMax, rMax ?? rMin0);
    const lerp = (t) => Math.round(hi - (hi - lo) * t);
    const byReps = (reps, note = '') => ({ reps, kg: kg(reps), note });
    if (m === 'Standard Sets: heavy-light') return A((i) => (i % 2 === 0 ? byReps(lo, 'zwaar') : byReps(hi, 'licht')));
    if (m === 'Descending Reps' || m === 'Paler System Descending') return A((i) => byReps(lerp(n > 1 ? i / (n - 1) : 0)));
    if (m === 'Ascending Reps' || m === 'Paler System Ascending') return A((i) => byReps(lerp(n > 1 ? 1 - i / (n - 1) : 0)));
    if (m === 'Back-Off Set') return A((i) => (i < n - 1 || n === 1 ? byReps(lo, 'werkset') : byReps(hi, 'back-off')));
    if (m === 'Broad Pyramid') { const half = (n - 1) / 2; return A((i) => byReps(lerp(half ? 1 - Math.abs(i - half) / half : 0))); }
    if (m === 'Stage System Descending' || m === 'Stage System Ascending') { const st = n <= 4 ? Math.min(2, n) : 3, per = Math.ceil(n / st); return A((i) => { const k = Math.min(st - 1, Math.floor(i / per)), t = st > 1 ? k / (st - 1) : 0; return byReps(lerp(m.endsWith('Descending') ? t : 1 - t), `stage ${k + 1}`); }); }
    if (m === 'Wave Loading') { const w = rMax <= 6 ? [rMax, Math.max(1, rMax - 1), Math.max(1, rMax - 2)] : [rMax, Math.max(1, rMax - 2), Math.max(1, rMax - 4)]; return A((i) => { const reps = w[i % 3], g = Math.floor(i / 3); return { reps, kg: kg(reps, 1 + 0.025 * g), note: `golf ${g + 1}` }; }); }
    if (m === 'Cluster') { const mini = rMax <= 5 ? 1 : rMax <= 8 ? 2 : 3; return A(() => ({ reps: rMax, kg: kg(rMax, 1.05), note: `${Math.ceil(rMax / mini)} × ${mini}, 15-20 s pauze` })); }
    if (m === 'Rest-pause') return A((i) => (i === 0 ? { reps: rMax, kg: kg(rMax), note: 'hoofdset tot RIR 0-1' } : { reps: Math.max(1, Math.round(rMax / 3)), kg: kg(rMax), note: 'mini-set na 15 s' }));
    if (m === 'Drop set') { const top = kg(rMax); return A((i) => ({ reps: rMax, kg: i === 0 || top === '' ? top : round05(top * Math.pow(0.8, i)), note: i === 0 ? 'topset' : `drop ${i}, meteen door` })); }
    if (m === 'Tempo') return A(() => ({ reps: rMax, kg: kg(rMax, 0.9), note: 'traag excentrisch' }));
    return A(() => ({ reps: rMax, kg: kg(rMax), note: '' }));
  }
  const METHOD_HINT = { 'Standard Sets': 'Alle sets zelfde gewicht en reps.', 'Standard Sets: pre-exhaustion': 'Isolatieoefening voor dezelfde spiergroep vlak vóór deze oefening; sets zelfde gewicht en reps.', 'Standard Sets: post-exhaustion': 'Isolatieoefening voor dezelfde spiergroep vlak ná deze oefening; sets zelfde gewicht en reps.', 'Standard Sets: trisets': 'Drie oefeningen na elkaar zonder rust, daarna de volledige rust.', 'Standard Sets: giant sets': 'Vier of meer oefeningen na elkaar zonder rust, daarna de volledige rust.', 'Standard Sets: heavy-light': 'Afwisselend een zware set (laag in de rep range) en een lichte set (hoog in de rep range).', 'Descending Reps': 'Elke set minder reps en zwaarder, van reps max naar reps min.', 'Ascending Reps': 'Elke set meer reps en lichter, van reps min naar reps max.', 'Back-Off Set': 'Werksets zwaar op reps min, laatste set lichter op reps max.', 'Broad Pyramid': 'Reps dalen naar reps min en stijgen terug; gewicht volgt mee.', 'Stage System Descending': 'Sets in 2 of 3 stages; per stage minder reps en zwaarder.', 'Stage System Ascending': 'Sets in 2 of 3 stages; per stage meer reps en lichter.', 'Paler System Descending': 'Voorstel: reps dalen per set. Setopbouw nog te bevestigen door Stijn.', 'Paler System Ascending': 'Voorstel: reps stijgen per set. Setopbouw nog te bevestigen door Stijn.', 'Wave Loading': 'Golven van dalende reps met stijgend gewicht; tweede golf +2,5%.', 'Cluster': 'Zwaardere set opgesplitst in mini-reeksen met korte pauze.', 'Rest-pause': 'Eén zware hoofdset, daarna korte mini-sets met hetzelfde gewicht.', 'Drop set': 'Topset, daarna telkens ongeveer 20% lichter zonder rust.', 'Tempo': 'Trager tempo, daarom ongeveer 10% lichter.' };

