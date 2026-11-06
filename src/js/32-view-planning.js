  // ---------- view: planning ----------
  const lastRealBlock = () => sortedBlocks().filter((b) => !b._unsaved && (b.exercises || []).length).pop() || null;
  const nextCode = (phase) => { const n = Math.max(0, ...sortedBlocks().map((b) => parseInt((String(b.code).match(/(\d+)/) || [])[1], 10) || 0)); return `${phase.slice(0, 3)} ${n + 1}`; };
  function genDefaults() {
    const c = client(), last = sortedBlocks().filter((b) => !b._unsaved).pop(), prev = lastRealBlock();
    const phase = last?.phase === 'Accumulatie' ? 'Intensificatie' : 'Accumulatie', d = PHASE_DEF[phase];
    const cnt = (rk) => { if (!prev) return rk === 'F' ? 1 : 2; const per = slotsOf(prev).map((sl) => (prev.exercises || []).filter((r) => normDay(prev, r.day) === sl && reeksOf(r.code) === rk).length); return per.length ? Math.max(...per) : 0; };
    const start = last ? addDays(last.start, 7 * blockWeeks(last)) : todayStr();
    return { start: start < todayStr() ? todayStr() : start, weeks: 3, perWeek: num(c.perWeek) || (prev ? slotsOf(prev).length : 2), phase, repsMin: d.repsMin, repsMax: d.repsMax, rir: d.rir, goal: prev?.goal || c.goal || '', nA: cnt('A') || 2, nB: cnt('B') || 2, nC: cnt('C'), nF: cnt('F'), setsA: 5, setsB: 4, setsC: 3, volCut: 50, mode: 'new', methodA: normMethod((prev?.exercises || []).find((r) => reeksOf(r.code) === 'A')?.method) || DEF_METHOD };
  }
  // fase kiezen in de generator: Herstel neemt reps en gewicht van het vorige blok over en snijdt enkel in het aantal sets
  function applyPhase(g, v) {
    const pd = PHASE_DEF[v]; if (!pd) return;
    Object.assign(g, { repsMin: pd.repsMin, repsMax: pd.repsMax, rir: pd.rir, setsA: 5, setsB: 4, setsC: 3 });
    if (v === 'Herstel') {
      const prev = lastRealBlock(), [a, z] = String(prev?.reps || '').split('-').map(num);
      if (a) Object.assign(g, { repsMin: a, repsMax: z ?? a });
      g.volCut = num(g.volCut) ?? pd.volCut; Object.assign(g, { setsA: cutSets(5, g.volCut), setsB: cutSets(4, g.volCut), setsC: cutSets(3, g.volCut) });
      if (prev) g.mode = 'copy';
    }
  }
  // voorstel: per training A (zware basisoefening, ankers eerst), B (tweede basisoefening), C (accessoire), F (finisher/conditie)
  // bewegingspatronen roteren over de trainingen zodat onder-, duw- en trekwerk gespreid wordt
  function genProposal(g, only, preUsed) {
    const c = client(), prev = lastRealBlock(), anchors = clientAnchors(c), na = c.anchorsNA || [];
    const lib = Object.values(S.exercises).filter((e) => !na.includes(e.id));
    const lastUsed = (id) => { const h = history(id); return h.length ? h[h.length - 1].date : ''; };
    const inPrev = (id) => (prev?.exercises || []).some((r) => r.exId === id);
    const used = new Set((preUsed || []).filter(Boolean));
    const sorter = (rk) => (x, y) => {
      if (rk === 'A') { const ax = anchors.includes(x.id) ? 0 : 1, ay = anchors.includes(y.id) ? 0 : 1; if (ax !== ay) return ax - ay; return lastUsed(x.id) < lastUsed(y.id) ? -1 : lastUsed(x.id) > lastUsed(y.id) ? 1 : 0; }
      const px = inPrev(x.id) ? 0 : 1, py = inPrev(y.id) ? 0 : 1; if (px !== py) return px - py; return x.name.localeCompare(y.name);
    };
    let inSlot = new Set();
    const pick = (pool, rk) => { const free = pool.filter((e) => !used.has(e.id)), notHere = pool.filter((e) => !inSlot.has(e.id)); const e = (free.length ? free : notHere.length ? notHere : pool).slice().sort(sorter(rk))[0]; if (e) { used.add(e.id); inSlot.add(e.id); } return e; };
    const SEQ = { A: ['lower', 'push', 'pull'], B: ['pull', 'lower', 'push'], C: ['push', 'pull', 'lower', 'core'], F: ['cond'] };
    const isK = (e) => STRENGTH.includes(e.unit);
    const pool = (rk, pat) => {
      if (rk === 'F') { const f = lib.filter((e) => patternOf(e) === 'cond' || (inPrev(e.id) && (prev.exercises || []).some((r) => r.exId === e.id && reeksOf(r.code) === 'F'))); return f; }
      if (rk === 'A') return lib.filter((e) => isK(e) && patternOf(e) === pat && e.unit !== 'kg per hand');
      const p = lib.filter((e) => isK(e) && patternOf(e) === pat && !anchors.includes(e.id));
      return p.length ? p : lib.filter((e) => isK(e) && patternOf(e) === pat);
    };
    const d = PHASE_DEF[g.phase] || PHASE_DEF.Accumulatie, rows = [];
    SLOTS.slice(0, Math.max(1, Math.min(5, num(g.perWeek) || 1))).forEach((slot, t) => {
      if (only && !only.includes(t)) return;
      inSlot = new Set();
      ['A', 'B', 'C', 'F'].forEach((rk) => {
        const n = Math.max(0, Math.min(3, num(g['n' + rk]) || 0));
        for (let i = 0; i < n; i++) {
          const seq = SEQ[rk], pat = seq[(i + t * n) % seq.length];
          let pl = pool(rk, pat); if (!pl.length && rk !== 'F') pl = lib.filter((e) => isK(e));
          const e = pick(pl, rk), code = rk + (i + 1), isC = rk === 'C', isF = rk === 'F';
          const rMin = num(g.repsMin), rMax = num(g.repsMax);
          const repsMin = isF ? null : isC ? (rMin ?? 8) + 2 : rMin, repsMax = isF ? null : isC ? (rMax ?? 10) + 2 : rMax;
          const sets = isF ? 1 : num(g['sets' + rk]) || 3, prevRow = (prev?.exercises || []).find((r) => r.exId === e?.id);
          const row = { day: slot, code, exId: e?.id || '', variant: prevRow?.variant || '', method: isF ? '' : g.phase === 'Herstel' || rk !== 'A' ? DEF_METHOD : g.methodA || DEF_METHOD, sets, repsMin, repsMax, rir: isF ? null : num(g.rir), tempo: isF ? '' : d.tempo, rest: restFor(g.phase, rk), note: '', filler: prevRow?.filler || '' };
          row.setPlan = methodPlan(row); row.warmup = warmupPlan(row);
          rows.push(row);
        }
      });
    });
    return rows;
  }
  function genCopy(g) {
    const prev = lastRealBlock(); if (!prev) return [];
    return clone(prev.exercises).map((r) => {
      const rk = reeksOf(r.code), isC = rk === 'C', isF = rk === 'F';
      const out = { ...r, day: normDay(prev, r.day) };
      if (g.phase === 'Herstel') {
        // deload: zelfde gewicht en reps als het vorige blok, minder sets
        const plan = rowPlan(r); let top = plan.reduce((a, x) => (num(x.kg) != null && (a == null || num(x.kg) > num(a.kg)) ? x : a), null) || plan[0] || {};
        if (num(top.kg) == null && r.exId && ['kg', 'kg per hand', 'blok'].includes(unitOf(r.exId))) { const h = history(r.exId).filter((x) => !x.historical).pop() || history(r.exId).pop(); const kg = h ? setKg(h.top, r.exId) : null; if (kg != null) top = { kg, reps: num(r.repsMax) ?? num(h.top?.reps) ?? top.reps }; }
        out.sets = cutSets(r.sets, g.volCut); if (!isF) out.method = DEF_METHOD;
        out.setPlan = Array.from({ length: out.sets }, () => ({ kg: isF ? '' : top.kg ?? '', reps: isF ? '' : top.reps ?? r.repsMax ?? '', note: '' }));
        if (isF) out.setPlan = methodPlan(out);
        out.rest = isF ? out.rest ?? null : restFor('Herstel', rk); out.warmup = warmupPlan(out);
        return out;
      }
      if (!isF) { out.repsMin = isC ? num(g.repsMin) + 2 : num(g.repsMin); out.repsMax = isC ? num(g.repsMax) + 2 : num(g.repsMax); out.rir = num(g.rir); out.rest = restFor(g.phase, rk); }
      if (!isF) out.method = rk === 'A' ? g.methodA || DEF_METHOD : normMethod(out.method) || DEF_METHOD;
      out.setPlan = methodPlan(out); out.warmup = warmupPlan(out);
      return out;
    });
  }
  function genCard() {
    const g = S.gen, prev = lastRealBlock();
    const f = (k, label, cls = 'xs', mode = 'numeric') => `<label class="field"><span>${label}</span><input class="${cls}" id="g-${k}" inputmode="${mode}" data-bind="gen" data-f="${k}" value="${esc(g[k] ?? '')}"></label>`;
    return `<section class="card gen"><div class="card-h"><div><h2>Nieuwe periode opbouwen</h2><p class="sub">Vul de variabelen in. De app stelt per training de oefeningen voor (A = zwaar met ankers, B = tweede basis, C = accessoire, F = finisher) met gewichten vanuit de 1RM-basis. Daarna past de coach alles aan.</p></div></div>
      <div class="form" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))">
        <label class="field"><span>Start</span><input type="date" id="g-start" data-bind="gen" data-f="start" value="${esc(g.start)}"></label>
        <label class="field"><span>Aantal weken</span><select id="g-weeks" data-bind="gen" data-f="weeks">${[2, 3, 4, 5, 6].map((n) => `<option${String(n) === String(g.weeks) ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field"><span>Trainingen per week</span><select id="g-pw" data-bind="gen" data-f="perWeek">${[1, 2, 3, 4, 5].map((n) => `<option${String(n) === String(g.perWeek) ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field"><span>Fase</span><select id="g-phase" data-bind="gen" data-f="phase">${PHASES.map((p) => `<option${p === g.phase ? ' selected' : ''}>${p}</option>`).join('')}</select></label>
        ${f('repsMin', 'Reps min')}${f('repsMax', 'Reps max')}${f('rir', 'RIR')}
        ${g.phase === 'Herstel' ? '' : `<label class="field" style="grid-column:span 2"><span>Methode A-oefeningen</span><select id="g-methodA" data-bind="gen" data-f="methodA">${methodOpts(g.methodA)}</select></label>`}
        <div class="wide">${adaptPill(g) || '<span class="small muted">Vul reps in voor de trainingsadaptatie.</span>'}${g.phase === 'Herstel' ? '' : ` <span class="small muted">B-, C- en finisheroefeningen: Standard Sets.</span>`}</div>
        ${g.phase === 'Herstel' ? f('volCut', 'Volume omlaag (%)') : ''}
        <label class="field wide"><span>Doel van de periode</span><input id="g-goal" data-bind="gen" data-f="goal" value="${esc(g.goal)}"></label>
      </div>
      ${g.phase === 'Herstel' ? `<p class="hint" style="margin-top:12px">Herstel (deload): het aantal sets gaat omlaag (hier ${esc(nl(num(g.volCut) ?? 50, 0))}%, maximaal 67%). Gewicht en intensiteit blijven gelijk aan het vorige blok en het aantal trainingen per week blijft (hooguit 20% minder). Zo behoud je de kracht en herstelt het lichaam. Bron: blog Stijn, Basisprincipes krachttraining.</p>` : ''}
      <h3 style="margin:16px 0 8px">Opbouw per training</h3>
      <div class="form" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,7rem),1fr))">${f('nA', 'A-oefeningen')}${f('setsA', 'Sets A')}${f('nB', 'B-oefeningen')}${f('setsB', 'Sets B')}${f('nC', 'C-oefeningen')}${f('setsC', 'Sets C')}${f('nF', 'Finishers')}</div>
      <div class="chips" style="margin-top:14px"><button class="chipbtn" data-act="gen-mode" data-v="new" aria-pressed="${g.mode === 'new'}">Nieuw voorstel</button>${prev ? `<button class="chipbtn" data-act="gen-mode" data-v="copy" aria-pressed="${g.mode === 'copy'}">Oefeningen van ${esc(prev.code)} hergebruiken</button>` : ''}</div>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-act="gen-cancel">Annuleren</button><button class="btn primary" data-act="gen-make">Maak voorstel voor ${esc(g.weeks)} weken</button></div></section>`;
  }
  function planCard(r, ri, d) {
    const unit = unitOf(r.exId), strength = STRENGTH.includes(unit), base = r.exId && strength ? baseRM(r.exId) : null;
    const prev = r.exId ? prevSummary(r.exId) : null, rk = reeksOf(r.code);
    const exOpts = (sel) => `<option value="">Kies oefening…</option>` + Object.values(S.exercises).sort((a, z) => a.name.localeCompare(z.name)).map((e) => `<option value="${esc(e.id)}"${e.id === sel ? ' selected' : ''}>${esc(e.name)}</option>`).join('');
    const sel = (f, opts, cur, style = '') => `<select id="br-${ri}-${f}" aria-label="${esc(({ code: 'Code', day: 'Training', method: 'Methode' })[f] || f)} rij ${ri + 1}" data-bind="brow" data-ri="${ri}" data-f="${f}"${style ? ` style="${style}"` : ''}>${opts.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur ?? '') ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    const fld = (f, label, val, cls = 'xs', mode = 'decimal') => `<label class="field"><span>${label}</span><input class="${cls}" id="br-${ri}-${f}" inputmode="${mode}" data-bind="brow" data-ri="${ri}" data-f="${f}" value="${esc(val ?? '')}"></label>`;
    const kgLabel = unit === 'bw' ? 'extra of totaal kg' : unit === 'blok' ? 'kg totaal' : strength ? 'kg' : esc(unit);
    const isF = rk === 'F';
    const setGrid = (r.setPlan || []).map((p, si) => {
      const pct = num(p.reps) && strength ? pctFor(num(p.reps) + (num(r.rir) || 0), r.code) : null;
      return `<div class="setcell"><span class="small muted">Set ${si + 1}${pct ? ` · ${nl(pct * 100, 0)}%` : ''}</span><div class="row" style="gap:4px;flex-wrap:nowrap"><input class="xs" inputmode="decimal" id="sp-${ri}-${si}-kg" data-bind="splan" data-ri="${ri}" data-si="${si}" data-f="kg" value="${esc(p.kg ?? '')}" placeholder="${kgLabel}" aria-label="${kgLabel} set ${si + 1}"><span class="small muted">×</span><input class="xs" inputmode="numeric" id="sp-${ri}-${si}-reps" data-bind="splan" data-ri="${ri}" data-si="${si}" data-f="reps" value="${esc(p.reps ?? '')}" placeholder="reps" aria-label="reps set ${si + 1}"></div>${p.note ? `<span class="small" style="color:var(--rk)">${esc(p.note)}</span>` : ''}</div>`;
    }).join('');
    const slotOpts = [...new Set([...slotsOf(d), r.day].filter(Boolean))].map((x) => [x, slotShort(x)]);
    return `<div class="ex-card" data-rk="${rk || 'X'}">
      <div class="head"><div class="row" style="gap:8px;flex:1;min-width:0">${sel('code', [['', 'Code'], ...[...new Set([...CODES, r.code].filter(Boolean))].map((c) => [c, c])], r.code, 'width:5rem;font-weight:700')}<select id="br-${ri}-ex" aria-label="Oefening rij ${ri + 1}" data-bind="brow" data-ri="${ri}" data-f="exId" style="flex:1;min-width:12rem;font-weight:600">${exOpts(r.exId)}</select></div>
        <div class="row" style="gap:6px"><label class="small muted" for="br-${ri}-day">Training</label>${sel('day', slotOpts, r.day, 'width:4.6rem')}<button class="btn ghost small" data-act="del-brow" data-ri="${ri}" aria-label="Oefening verwijderen">Verwijder</button></div></div>
      ${isF ? '' : `<div class="row" style="gap:10px;align-items:flex-end"><label class="field" style="min-width:12rem"><span>1. Methode</span><select id="br-${ri}-method" data-bind="brow" data-ri="${ri}" data-f="method">${methodOpts(r.method)}</select></label><span class="small muted" style="flex:1;min-width:12rem;padding-bottom:8px">${esc(METHOD_HINT[normMethod(r.method) || DEF_METHOD] || '')}${rk === 'A' ? '' : ' Methode geldt normaal enkel voor de A-oefeningen.'}</span></div>`}
      <div class="form" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,6.5rem),1fr));gap:10px">
        ${fld('sets', isF ? 'Rondes' : '2. Sets', r.sets)}${isF ? '' : fld('repsMin', 'Reps min', r.repsMin) + fld('repsMax', 'Reps max', r.repsMax) + fld('rir', 'RIR', r.rir)}${isF ? '' : fld('tempo', 'Tempo', r.tempo, 'xs', 'text')}${fld('rest', 'Rust (s)', r.rest)}
        <label class="field" style="grid-column:span 2"><span>Variant</span><input id="br-${ri}-variant" data-bind="brow" data-ri="${ri}" data-f="variant" value="${esc(r.variant ?? '')}"></label>
        <label class="field" style="grid-column:span 2"><span>Notitie</span><input id="br-${ri}-note" data-bind="brow" data-ri="${ri}" data-f="note" value="${esc(r.note ?? '')}"></label>
      </div>
      ${isF ? '' : `<div class="row" style="gap:6px">${adaptPill(r)}${tutPill(r)}${num(r.rest) ? `<span class="pill neutral">Rust ${esc(restTxt(r.rest))}</span>` : ''}</div>`}
      <div><div class="row" style="justify-content:space-between"><span class="small muted" style="text-transform:uppercase;letter-spacing:.05em">${isF ? 'Per ronde' : '3. Per set'}: ${kgLabel} × reps${strength && r.exId ? ` · 1RM-basis ${base ? `<b style="color:var(--ink)">${nl(base.rm)} kg</b> (${esc(base.src)})` : 'ontbreekt: doe de intake'}` : ''}</span>${strength && r.exId && base ? `<button class="btn ghost small" data-act="fill-plan" data-ri="${ri}">Herbereken sets</button>` : ''}</div><div class="setgrid">${setGrid}</div></div>
      ${isF ? '' : `<div class="wu-row"><span class="lab">4. Opwarming</span>${(r.warmup || []).map((w, wi) => `<span class="wucell"><input class="xs" inputmode="decimal" id="bw-${ri}-${wi}-kg" data-bind="bwu" data-ri="${ri}" data-wi="${wi}" data-f="kg" value="${esc(w.kg ?? '')}" placeholder="kg" aria-label="kg opwarmset ${wi + 1}"><span class="muted">×</span><input class="xs" inputmode="numeric" id="bw-${ri}-${wi}-reps" data-bind="bwu" data-ri="${ri}" data-wi="${wi}" data-f="reps" value="${esc(w.reps ?? '')}" placeholder="reps" aria-label="reps opwarmset ${wi + 1}"><button class="btn ghost small" style="padding:0 4px" data-act="bwu-del" data-ri="${ri}" data-wi="${wi}" aria-label="Opwarmset verwijderen">×</button></span>`).join('') || '<span class="small muted">geen</span>'}<button class="btn ghost small" data-act="bwu-add" data-ri="${ri}">+ set</button>${strength && r.exId ? `<button class="btn ghost small" data-act="bwu-auto" data-ri="${ri}">Voorstel</button>` : ''}</div>
      <label class="field"><span>5. Filler tijdens de rust (optioneel)</span><input id="br-${ri}-filler" list="filler-list" data-bind="brow" data-ri="${ri}" data-f="filler" value="${esc(r.filler ?? '')}" placeholder="bv. band pull-apart 3 × 12"></label>`}
      <div class="small">${prev ? `Vorige keer <b>${esc(fmtDate(prev.date, false))}</b>: ${esc(prev.text)}` : '<span class="muted">Nog niet eerder gelogd.</span>'}</div>
    </div>`;
  }
  function viewPlanning() {
    const t = todayStr(), cur = blockFor(t), all = sortedBlocks();
    const shown = all.filter((b) => b._unsaved || !cur || b.start >= cur.start);
    if (!S.blockSel || !S.blocks[S.blockSel]) S.blockSel = cur?.id || all[all.length - 1]?.id || null;
    if (S.blockSel && (!S.schemaDraft || S.schemaDraft.id !== S.blockSel) && !S.schemaDirty) {
      const src = S.blocks[S.blockSel]; S.schemaDraft = clone(src);
      if (S.schemaDraft) (S.schemaDraft.exercises || []).forEach((r) => { r.day = normDay(src, r.day); r.setPlan = rowPlan(r); });
    }
    const old = S.blockSel && !shown.some((b) => b.id === S.blockSel) ? S.blocks[S.blockSel] : null;
    const chips = [...shown, ...(old ? [old] : [])].map((b) => `<button class="blockchip" data-act="sel-block" data-id="${esc(b.id)}" aria-pressed="${b.id === S.blockSel}"><span class="c"><i class="dot" style="background:${phaseCol(b.phase)}"></i>${esc(b.code)}${cur && b.id === cur.id ? ' <span class="pill acc" style="font-family:var(--f-body)">nu</span>' : ''}</span><span class="dd">${esc(fmtDate(b.start, false))} · ${blockWeeks(b)} weken · ${slotsOf(b).length}× p/w</span></button>`).join('');
    const d = S.schemaDraft;
    let body = '';
    if (d) {
      const slots = slotsOf(d), rows = (d.exercises || []).map((r, ri) => ({ r, ri }));
      const section = (slot, items, title) => {
        const groups = ['A', 'B', 'C', 'F', ''].map((rk) => {
          const its = items.filter((x) => reeksOf(x.r.code) === rk).sort((x, y) => codeSort(x.r.code, y.r.code));
          if (!rk && !its.length) return '';
          const cards = its.map(({ r, ri }) => planCard(r, ri, d)).join('');
          return `<div class="reeks-h" data-rk="${rk || 'X'}">${REEKS_LABEL[rk]}</div>${cards}${slot && rk ? `<div><button class="btn small" data-act="add-brow" data-slot="${slot}" data-rk="${rk}">+ ${rk === 'F' ? 'Finisher' : rk + '-oefening'}</button></div>` : ''}`;
        }).join('');
        return `<section class="slot"><div class="slot-h"><h2>${esc(title)}</h2><span class="small">${items.length} oefeningen</span></div>
          ${slot && !items.length ? `<div class="empty">Nog leeg. <button class="btn primary small" data-act="gen-slot" data-slot="${slot}">Maak voorstel voor ${esc(slotLabel(slot))}</button></div>` : ''}
          <div class="ex-list">${groups}</div></section>`;
      };
      const sections = slots.filter((sl) => !S.slotFilter || S.slotFilter === sl).map((sl) => section(sl, rows.filter((x) => x.r.day === sl), slotLabel(sl))).join('');
      const orphan = rows.filter((x) => !slots.includes(x.r.day));
      const isOld = cur && d.start < cur.start && !S.blocks[d.id]?._unsaved;
      body = `${isOld ? `<div class="notice">Dit is een afgesloten periode uit de historiek.</div>` : ''}
        <section class="card"><div class="form" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))">
          <label class="field"><span>Code</span><input id="bm-code" data-bind="bmeta" data-f="code" value="${esc(d.code)}"></label>
          <label class="field"><span>Fase</span><select id="bm-phase" data-bind="bmeta" data-f="phase">${PHASES.map((p) => `<option${p === phaseOf(d.phase) ? ' selected' : ''}>${p}</option>`).join('')}</select></label>
          <label class="field"><span>Start</span><input type="date" id="bm-start" data-bind="bmeta" data-f="start" value="${esc(d.start)}"></label>
          <label class="field"><span>Weken</span><input id="bm-weeks" class="xs" inputmode="numeric" data-bind="bmeta" data-f="weeks" value="${esc(d.weeks ?? 3)}"></label>
          <label class="field"><span>Trainingen per week</span><select id="bm-pw" data-bind="bmeta" data-f="perWeek">${[1, 2, 3, 4, 5].map((n) => `<option${n === slots.length ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="field"><span>Rep range</span><input id="bm-reps" data-bind="bmeta" data-f="reps" value="${esc(d.reps ?? '')}" placeholder="8-10"></label>
          <label class="field"><span>Intensiteit (%)</span><input id="bm-int" inputmode="numeric" data-bind="bmeta" data-f="intensity" value="${esc(d.intensity ?? '')}"></label>
          <label class="field wide"><span>Doel</span><input id="bm-goal" data-bind="bmeta" data-f="goal" value="${esc(d.goal ?? '')}"></label></div></section>
        ${slots.length > 1 ? `<div class="chips"><button class="chipbtn" data-act="slot-filter" data-v="" aria-pressed="${!S.slotFilter}">Alle trainingen</button>${slots.map((sl) => `<button class="chipbtn" data-act="slot-filter" data-v="${sl}" aria-pressed="${S.slotFilter === sl}">${slotLabel(sl)}</button>`).join('')}</div>` : ''}
        ${sections}${orphan.length ? section('', orphan, 'Niet ingedeeld') : ''}
        <div class="sticky-actions"><span class="small muted" id="save-state" style="margin-right:auto;align-self:center">${esc(S.saveState || 'Wijzigingen worden automatisch bewaard')}</span><button class="btn danger" data-act="del-block">Periode verwijderen</button></div>`;
    }
    return `<section class="card"><div class="card-h"><div><h2>Planning</h2><p class="sub">Lopende en komende periodes. Oudere periodes staan in Historiek.</p></div>
        <button class="btn primary" data-act="gen-open"${S.canWrite && !S.gen ? '' : ' disabled'}>+ Nieuwe periode opbouwen</button></div>
        <div class="blocks">${chips || '<span class="muted">Nog geen periodes.</span>'}</div></section>
      ${S.gen ? genCard() : ''}${body}<datalist id="filler-list">${FILLERS.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`;
  }

