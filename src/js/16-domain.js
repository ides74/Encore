  // ---------- domain ----------
  const exName = (id) => S.exercises[id]?.name || id || 'Onbekende oefening';
  const isStrength = (id) => STRENGTH.includes(S.exercises[id]?.unit || 'kg');
  // totaal gewicht van een set; bij lichaamsgewicht-oefeningen is het ingevulde kg het extra gewicht
  const setKg = (st, exId) => {
    if (!st) return null;
    if (exId && unitOf(exId) === 'bw') { const bw = num(st.bw) ?? bwNow(); if (bw == null) return null; if (num(st.kg) == null && num(st.reps) == null) return null; return bwTotal(num(st.kg), bw, st.mode); }
    const b = num(st.blocks);
    if (b != null) return Math.round((smallKg() + b * kgPerBlock() + (num(st.extra) || 0)) * 100) / 100;
    return num(st.kg);
  };
  // lichaamsgewicht-oefeningen: ingevuld gewicht = extra of totaal. Auto: onder de helft van het lichaamsgewicht = extra, anders totaal
  const BW_MODES = [['auto', 'Auto'], ['extra', 'Extra kg'], ['total', 'Totaal kg']];
  const bwIsTotal = (kg, bw, mode) => mode === 'total' || (mode === 'auto' && kg != null && bw != null && kg >= bw * 0.5);
  const bwTotal = (kg, bw, mode = 'extra') => Math.round((bwIsTotal(kg, bw, mode) ? kg : bw + (kg || 0)) * 10) / 10;
  const bwFmt = (kg, mode = 'auto') => { const bw = bwNow(); if (kg == null) return '?'; if (kg === 0) return 'LG'; return bwIsTotal(kg, bw, mode) ? `${nl(kg)} totaal` : `LG+${nl(kg)}`; };
  // gewicht in een planregel: lichaamsgewicht zonder extra gewicht toont "LG" (LG × 8), niet "?"
  const kgPlanTxt = (unit, kg) => (unit === 'bw' ? (kg ? bwFmt(kg) : 'LG') : kg == null ? '?' : unit === 'blok' ? blokTxt(splitBlocks(kg)) : unit === 'kg per hand' ? `2 × ${nl(kg)}` : nl(kg));
  // geschat 1RM: A-reeks via %-tabel, anders Epley; RIR telt mee (8 reps + 2 RIR = 10RM)
  const e1 = (st, exId, code) => { const kg = setKg(st, exId), r = num(st?.reps); if (!kg || !r) return null; const p = pctFor(r + (num(st?.rir) || 0), code); return p ? Math.round((kg / p) * 10) / 10 : null; };
  const intakeRM = (exId) => num(client()?.intake?.tests?.[exId]?.rm);
  // basis voor schema-voorstellen: laatste test (intake), anders laatste schatting uit het logboek
  const baseRM = (exId) => directRM(exId) || ratioRM(exId);
  const directRM = (exId) => {
    const t = intakeRM(exId); if (t) return { rm: t, src: 'intake ' + fmtDate(client().intake.date, false) };
    const p = history(exId).filter((x) => x.best != null).pop(); return p ? { rm: p.best, src: 'schatting ' + fmtDate(p.date, false) } : null;
  };
  // optimale krachtratio's bovenlichaam t.o.v. Flat BB bench press (Stijn). Dip en chin-up in totaalgewicht (lichaamsgewicht + extra).
  const RATIOS = [['bench-press-plat-bb', 100], ['bench-press-45-incline-bb', 91], ['standing-overhead-press-bb', 72], ['dip', 117], ['pull-up-chin-up', 87]];
  const RATIO_REF = 'bench-press-plat-bb';
  const ratioPct = (id) => RATIOS.find((x) => x[0] === id)?.[1] ?? null;
  // zonder eigen test of logboek: 1RM-basis afgeleid via de ratio van een oefening die wel gemeten is (bench eerst)
  const ratioRM = (exId) => {
    const pct = ratioPct(exId); if (!pct) return null;
    for (const [id, p] of RATIOS) { if (id === exId || !S.exercises[id]) continue; const d = directRM(id); if (d) return { rm: Math.round((d.rm / p) * pct * 10) / 10, src: `ratio ${pct}% via ${exName(id)}`, ratio: true }; }
    return null;
  };
  // huidig niveau voor de krachtbalans: laatste zware meting, anders intake
  const curRM = (id) => anchorStats(id)?.lastStrength ?? intakeRM(id) ?? null;
  // geen RPE per set meer: zonder ingevulde RPE rekent de app met de RIR uit het plan (gemarkeerd als rirSrc 'plan')
  const rirFor = (x, tg) => { if (num(x.rpe) != null) return { rir: rpeToRir(x.rpe) }; const own = x.rirSrc === 'plan' ? null : num(x.rir); if (own != null) return { rir: own }; const pr = num(tg?.rir); return pr != null && num(x.reps) != null ? { rir: pr, rirSrc: 'plan' } : { rir: null }; };
  // logboek in RPE (1-10, ervaren inspanning). Berekeningen blijven op RIR: RIR = 10 - RPE (RPE 10 = 0 in reserve)
  const rpeToRir = (v) => { const r = num(v); return r == null ? null : Math.max(0, Math.round((10 - r) * 2) / 2); };
  const rirToRpe = (v) => { const r = num(v); return r == null ? null : Math.max(1, 10 - r); };
  const effTxt = (x) => (num(x.rpe) != null ? ' @ RPE ' + nl(x.rpe) : num(x.rir) != null ? ' @ RIR ' + nl(x.rir, 0) : '');
  const round05 = (v) => Math.round(v * 2) / 2;
  // bewaar altijd als extra kg + lichaamsgewicht van dat moment, zodat de historiek eenduidig blijft
  const bwSave = (x) => { const bw = num(x.bw) ?? bwNow(), kg = num(x.kg); if (bw == null) return { kg, mode: x.mode || 'extra' }; const tot = bwTotal(kg, bw, x.mode || 'extra'); return { kg: Math.round((tot - bw) * 10) / 10, bw, mode: 'extra', ...(bwIsTotal(kg, bw, x.mode || 'extra') ? { kgInput: kg } : {}) }; };
  // gepland gewicht (zoals in te vullen) voor reps + RIR
  const planKg = (exId, reps, rir, code) => {
    const b = baseRM(exId), r = num(reps); if (!b || !r) return null;
    const p = pctFor(r + (num(rir) || 0), code); if (!p) return null;
    let kg = b.rm * p; if (unitOf(exId) === 'bw') { const bw = bwNow(); if (bw == null) return null; kg -= bw; }
    return Math.max(0, round05(kg));
  };
  // oude schema's gebruikten weekdagen (Wo, Za): die worden in volgorde Training 1, 2...
  const legacyMap = (b) => { const ds = [...new Set((b?.exercises || []).map((r) => r.day).filter((d) => DAYS.includes(d)))].sort((x, y) => DAYS.indexOf(x) - DAYS.indexOf(y)); const m = {}; ds.forEach((d, i) => { m[d] = SLOTS[i]; }); return m; };
  const normDay = (b, d) => (DAYS.includes(d) ? legacyMap(b)[d] || d : d || '');
  const slotsOf = (b) => { const used = (b?.exercises || []).map((r) => SLOTS.indexOf(normDay(b, r.day))).filter((i) => i >= 0); const n = Math.max(num(b?.perWeek) || 0, used.length ? Math.max(...used) + 1 : 0, 1); return SLOTS.slice(0, Math.min(n, SLOTS.length)); };
  const sessSlot = (s) => normDay(S.blocks[s.blockId], s.day);
  const blockWeeks = (b) => num(b?.weeks) || 3;
  // progressie: één formule voor alle reeksen (%-tabel, reps + RIR), zodat A- en B-reeks dezelfde schaal hebben
  const e1p = (st, exId) => { const kg = setKg(st, exId), r = num(st?.reps); if (!kg || !r) return null; const p = pctTable(r + (num(st?.rir) || 0)); return p ? Math.round((kg / p) * 10) / 10 : null; };
  // betrouwbaar = zware set: reps + RIR tot 10. Zonder RIR enkel in kracht-/testblokken; volumesets onderschatten het 1RM
  const isReliable = (st, phase) => { const r = num(st?.reps), rir = num(st?.rir); if (!r) return false; if (rir != null) return r + rir <= 10; return !['Accumulatie', 'Herstel'].includes(phaseOf(phase)) && r <= 10; };
  const sortedBlocks = () => Object.values(S.blocks).sort((a, b) => (a.start < b.start ? -1 : 1));
  const sortedSessions = () => Object.values(S.sessions).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const blockFor = (date) => { let f = null; sortedBlocks().forEach((b) => { if (b.start <= date) f = b; }); return f || sortedBlocks()[0] || null; };
  const weekFor = (b, date) => (b && date ? Math.max(1, Math.floor(daysBetween(b.start, date) / 7) + 1) : 1);
  const setLabel = (exId, st) => {
    const u = S.exercises[exId]?.unit || 'kg';
    if (u === 'blok' && num(st.blocks) != null) return blokTxt(st);
    if (u === 'kg per hand') return `2 × ${nl(st.kg)} kg`;
    if (u === 'bw') return num(st.kg) ? `LG + ${nl(st.kg)} kg` : 'LG';
    if (!STRENGTH.includes(u)) return `${nl(st.value ?? (u === 'reps' ? st.reps : null)) || '?'} ${u === 'reps' ? 'reps' : u}${st.time ? ' in ' + st.time : ''}`;
    return `${nl(setKg(st, exId))} kg`;
  };
  // history per exercise: [{date, sid, blockId, phase, sets, best, topSet}]
  const history = (exId, beforeDate) => {
    const out = [];
    sortedSessions().forEach((s) => {
      if (beforeDate && s.date >= beforeDate) return;
      (s.entries || []).forEach((en) => {
        if (en.exId !== exId) return;
        const sets = (en.sets || []).filter((x) => num(x.reps) != null || num(x.value) != null || x.ok === true);
        if (!sets.length) return;
        let best = null, top = null, bestP = null, topP = null, rel = false;
        const phase = phaseOf(S.blocks[s.blockId]?.phase);
        sets.forEach((x) => {
          const v = e1(x, exId, en.target?.code); if (v != null && (best == null || v > best)) { best = v; top = x; }
          const vp = e1p(x, exId); if (vp == null) return; const ok = isReliable(x, phase);
          if ((ok && !rel) || (ok === rel && (bestP == null || vp > bestP))) { bestP = vp; topP = x; rel = ok; }
        });
        out.push({ rk: reeksOf(en.target?.code) || '', date: s.date, sid: s.id, blockId: s.blockId, phase, sets, best, top: top || sets[0], bestP, topP: topP || sets[0], reliable: rel, historical: !!s.historical, variant: en.variant || '', hard: en.hard || '', score: num(en.score) });
      });
    });
    return out;
  };
  const prevSummary = (exId, beforeDate) => {
    const h = history(exId, beforeDate); const p = h[h.length - 1];
    if (!p) return null;
    const groups = []; p.sets.forEach((x) => { const lab = setLabel(exId, x); const g = groups[groups.length - 1]; if (g && g.lab === lab) g.reps.push(x.reps); else groups.push({ lab, reps: [x.reps] }); });
    return { date: p.date, text: groups.map((g) => `${g.lab} × ${g.reps.map((r) => nl(r, 0) || '?').join('·')}`).join('  |  '), best: p.best, sets: p.sets, historical: p.historical, hard: p.hard, score: p.score };
  };
  // rol van een meting: B- en C-reeks zijn lichter of hebben meer reps; de trendlijn volgt enkel de A-reeks (en oude topsets)
  const roleOf = (p) => (['B', 'C'].includes(p?.rk) ? p.rk : 'A');
  const anchorStats = (exId) => {
    const all = history(exId).filter((p) => p.bestP != null);
    if (!all.length) return null;
    const mainA = all.filter((p) => roleOf(p) === 'A'), main = mainA.length ? mainA : all;
    const rel = main.filter((p) => p.reliable), base = rel.length ? rel : main;
    const first = base[0].bestP, best = Math.max(...base.map((p) => p.bestP));
    const lastP = base[base.length - 1], lastStrength = lastP.bestP;
    const delta = (lastStrength - first) / first;
    const signal = base.length < 2 ? ['1 meting', 'neutral'] : lastStrength >= best * 0.99 ? ['Op record', 'ok'] : lastStrength < best * 0.93 ? ['Daling', 'bad'] : ['Plateau', 'warn'];
    return { pts: all, rel: base, first, best, last: lastStrength, lastStrength, lastDate: lastP.date, delta, signal, onlyIndicative: !rel.length, side: all.filter((p) => roleOf(p) !== roleOf(base[0])) };
  };

