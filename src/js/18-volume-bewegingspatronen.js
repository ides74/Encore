  // ---------- volume & bewegingspatronen ----------
  const MUSCLES = CATS.filter((c) => !NON_MUSCLE.includes(c));
  const PATTERNS = [['squat', 'Squat'], ['hinge', 'Hinge'], ['lunge', 'Lunge'], ['push-h', 'Duwen horizontaal'], ['push-v', 'Duwen verticaal'], ['pull-h', 'Trekken horizontaal'], ['pull-v', 'Trekken verticaal'], ['carry', 'Carry'], ['core', 'Core'], ['iso', 'Isolatie'], ['olympic', 'Olympisch'], ['cond', 'Conditie']];
  const PAT_LABEL = Object.fromEntries(PATTERNS);
  const PAT_CAT = { Borst: 'push-h', Schouders: 'push-v', Triceps: 'iso', Bovenrug: 'pull-h', Biceps: 'iso', Trapezius: 'iso', Voorarmen: 'iso', Quadriceps: 'squat', Hamstrings: 'hinge', Gluteus: 'hinge', Onderrug: 'hinge', Fullbody: 'olympic', Adductoren: 'iso', Kuiten: 'iso', Core: 'core', Conditie: 'cond' };
  const PAT_RULES = [[/lunge|split squat|step.?up|bulgar/, 'lunge'], [/carry|farmer|suitcase|yoke/, 'carry'], [/snatch|clean|deadlift|\brdl\b|romanian|hip thrust|swing|good ?morning|back extension|hyperext|bridge|pull.?through/, 'hinge'], [/squat|leg press|hack/, 'squat'], [/pull.?up|\bchin|pull.?down|\blats?\b/, 'pull-v'], [/\brow\b|rowing|roei|face pull|pull.?apart|reverse fly|rear delt/, 'pull-h'], [/overhead|shoulder press|military|push press|landmine press|arnold/, 'push-v'], [/bench|push.?up|\bdips?\b|chest press|\bpress\b/, 'push-h'], [/curl|extension|pushdown|raise|\bfly|flye|kickback|shrug|calf/, 'iso']];
  const autoPattern = (e) => {
    if (!e) return 'iso'; const n = String(e.name || '').toLowerCase();
    if (e.category === 'Conditie' || !STRENGTH.includes(e.unit || 'kg')) return 'cond';
    if (e.category === 'Core') return 'core';
    if (e.category === 'Fullbody') return 'olympic';
    for (const [re, p] of PAT_RULES) if (re.test(n)) return p;
    return PAT_CAT[e.category] || 'iso';
  };
  const patOf = (id) => { const e = S.exercises[id]; return e?.pattern || autoPattern(e); };
  const PUSH = ['push-h', 'push-v'], PULL = ['pull-h', 'pull-v'];
  // sets per spiergroep: hoofdspiergroep telt 1, secundaire spiergroep een halve set
  const addVol = (acc, exId, sets) => { const e = S.exercises[exId]; if (!e || !sets || !isStrength(exId) || NON_MUSCLE.includes(e.category)) return; acc[e.category] = (acc[e.category] || 0) + sets; (e.secondary || []).forEach((m) => { if (m && !NON_MUSCLE.includes(m) && m !== e.category) acc[m] = (acc[m] || 0) + sets / 2; }); };
  const addPat = (acc, exId, sets) => { if (!sets || !S.exercises[exId]) return; const k = patOf(exId); acc[k] = (acc[k] || 0) + sets; };
  const doneSets = (en) => (en.sets || []).filter((x) => num(x.reps) != null || num(x.value) != null).length;
  const planVol = (b) => {
    const per = {}, pat = {}, tot = {}, dir = {}, totPat = {}; slotsOf(b).forEach((sl) => { per[sl] = {}; pat[sl] = {}; });
    (b?.exercises || []).forEach((r) => { if (!r.exId) return; const sl = normDay(b, r.day), n = num(r.sets) || 0; if (per[sl]) { addVol(per[sl], r.exId, n); addPat(pat[sl], r.exId, n); } addVol(tot, r.exId, n); addPat(totPat, r.exId, n); const e = S.exercises[r.exId]; if (e && isStrength(r.exId) && !NON_MUSCLE.includes(e.category)) dir[e.category] = (dir[e.category] || 0) + n; });
    return { per, pat, tot, dir, totPat };
  };
  const sessVol = (s) => { const v = {}, p = {}; (s.entries || []).forEach((en) => { const n = doneSets(en); addVol(v, en.exId, n); addPat(p, en.exId, n); }); return { v, p }; };
  const weekStart = (ds) => { const d = toDate(ds), wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const ratio = (p) => { const pu = PUSH.reduce((a, k) => a + (p[k] || 0), 0), pl = PULL.reduce((a, k) => a + (p[k] || 0), 0); return { push: pu, pull: pl, r: pu ? pl / pu : null }; };

