  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v) => { if (v === '' || v == null) return null; const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
  const nl = (v, d = 1) => (v == null || v === '' || !Number.isFinite(Number(v))) ? '' : Number(v).toLocaleString('nl-BE', { maximumFractionDigits: d });
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const toDate = (s) => new Date(s + 'T00:00:00');
  const fmtDate = (s, y = true) => s ? toDate(s).toLocaleDateString('nl-BE', y ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }) : '';
  const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
  const uid = (p) => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';
  const clone = (o) => JSON.parse(JSON.stringify(o ?? null));
  const STRENGTH = ['kg', 'kg per hand', 'blok', 'bw'];
  const UNITS_K = [['kg', 'kg'], ['kg per hand', 'kg per hand'], ['blok', 'toestel: blok + extra kg'], ['bw', 'lichaamsgewicht + extra kg']];
  const UNITS_C = [['meter', 'afstand (meter)'], ['sec', 'tijd (seconden)'], ['kcal', 'kcal'], ['watt', 'watt'], ['reps', 'herhalingen']];
  const UNITS = [...UNITS_K, ...UNITS_C];
  const CATS = ['Quadriceps', 'Hamstrings', 'Gluteus', 'Adductoren', 'Kuiten', 'Borst', 'Schouders', 'Bovenrug', 'Onderrug', 'Trapezius', 'Biceps', 'Triceps', 'Voorarmen', 'Core', 'Fullbody', 'Conditie'];
  // Fullbody = Olympische varianten (snatch, clean & jerk): geen klassieke krachttraining, telt niet mee in volume per spiergroep
  const NON_MUSCLE = ['Conditie', 'Fullbody'];
  // trainingsmethodes (lijst Stijn). Normaal per fase van 3 weken gekozen en toegepast op de A-oefeningen
  const METHOD_GROUPS = [
    ['Standard Sets', ['Standard Sets', 'Standard Sets: pre-exhaustion', 'Standard Sets: post-exhaustion', 'Standard Sets: trisets', 'Standard Sets: giant sets', 'Standard Sets: heavy-light']],
    ['Reps per set', ['Descending Reps', 'Ascending Reps', 'Back-Off Set', 'Broad Pyramid']],
    ['Stage en Paler', ['Stage System Descending', 'Stage System Ascending', 'Paler System Descending', 'Paler System Ascending']],
    ['Golven en clusters', ['Wave Loading', 'Cluster']]];
  const METHODS = METHOD_GROUPS.flatMap((g) => g[1]);
  const METHOD_LEGACY = ['Rest-pause', 'Drop set', 'Tempo'];
  const DEF_METHOD = 'Standard Sets';
  const normMethod = (m) => ({ 'Straight sets': DEF_METHOD, 'Wave loading': 'Wave Loading' }[m] || m || '');
  const methodOpts = (cur) => { const c = normMethod(cur) || DEF_METHOD; const extra = c && !METHODS.includes(c) ? `<optgroup label="Oud"><option selected>${esc(c)}</option></optgroup>` : ''; return METHOD_GROUPS.map(([l, ms]) => `<optgroup label="${esc(l)}">${ms.map((m) => `<option${m === c ? ' selected' : ''}>${esc(m)}</option>`).join('')}</optgroup>`).join('') + extra; };
  // voornaamste trainingsadaptatie volgens rep range en intensiteit (Stijn)
  const ADAPT = [[1, 5, 'Relatieve kracht', '85-100% 1RM'], [6, 8, 'Functionele hypertrofie', '78-83% 1RM'], [9, 12, 'Hypertrofie', '70-76% 1RM'], [13, 20, 'Krachtuithouding', '60-68% 1RM']];
  const adaptOf = (reps) => { const n = Math.round(reps); if (!(n >= 1)) return null; return ADAPT.find((a) => n >= a[0] && n <= a[1]) || (n > 20 ? ADAPT[3] : null); };
  const adaptInfo = (rMin, rMax) => { const a = num(rMin) ?? num(rMax), b = num(rMax) ?? a; if (a == null) return null; const za = adaptOf(Math.min(a, b)), zb = adaptOf(Math.max(a, b)); if (!za || !zb) return null; return za === zb ? { txt: za[2], sub: `${za[0]}-${za[1]} reps · ${za[3]}` } : { txt: `${za[2]} → ${zb[2]}`, sub: `${za[3]} tot ${zb[3]}` }; };
  const adaptPill = (r) => { const a = adaptInfo(r?.repsMin, r?.repsMax); return a ? `<span class="pill acc" title="Voornaamste trainingsadaptatie volgens rep range en intensiteit">${esc(a.txt)} · ${esc(a.sub)}</span>` : ''; };
  // % van 1RM per aantal herhalingen (tabel Stijn, A-reeks). Reps + RIR = effectieve rep max.
  const PCT = [100, 94, 90, 88, 85, 83, 80, 78, 76, 74, 72, 70, 68, 67, 66, 65, 63, 62, 61, 60];
  const CODES = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'F1', 'F2', 'F3'];
  const REEKS_LABEL = { A: 'A-reeks', B: 'B-reeks', C: 'C-reeks', F: 'Finisher', '': 'Overig' };
  const DEFAULT_ANCHORS = ['standing-overhead-press-bb', 'bench-press-45-incline-bb', 'bench-press-plat-bb', 'bench-press-decline-bb', 'pull-up-chin-up', 'conventional-deadlift', 'trap-bar-deadlift'];
  const reeksOf = (code) => { const c = String(code || '').trim().toUpperCase().charAt(0); return ['A', 'B', 'C', 'F'].includes(c) ? c : ''; };
  const codeSort = (a, b) => { const o = (c) => { const r = reeksOf(c); return (r ? 'ABCF'.indexOf(r) : 9) * 100 + (parseInt(String(c || '').slice(1), 10) || 0); }; return o(a) - o(b); };
  const pctTable = (rm) => { const r = Math.round(rm); if (!(r >= 1)) return null; return r <= 20 ? PCT[r - 1] / 100 : 1 / (1 + r / 30); };
  const pctEpley = (rm) => (rm >= 1 ? 1 / (1 + rm / 30) : null);
  const pctFor = (rm, code) => (reeksOf(code) === 'A' ? pctTable(rm) : pctEpley(rm));
  const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
  const PHASES = ['Accumulatie', 'Intensificatie', 'Herstel', 'Test'];
  // oude naam "Ontlasting" heet nu "Herstel" (deload)
  const phaseOf = (p) => (p === 'Ontlasting' ? 'Herstel' : p || '');
  const PHASE_COL = { Accumulatie: 'var(--acc)', Intensificatie: 'var(--int)', Herstel: 'var(--ok)', Test: 'var(--warn)' };
  const phaseCol = (p) => PHASE_COL[phaseOf(p)] || 'var(--acc)';
  const PHASE_TXT = { Accumulatie: 'Accumulatie: volume opbouwen. Meer sets en herhalingen ontwikkelen spiermassa en werkcapaciteit.', Intensificatie: 'Intensificatie: zwaarder met minder herhalingen. Je zet de opgebouwde basis om in kracht.', Herstel: 'Herstel: minder sets, zelfde gewicht. Je lichaam herstelt en je behoudt je kracht.', Test: 'Test: nieuwe maxima vastleggen. Die vormen de basis voor het volgende blok.' };
  // trainingen per week zijn genummerd (Training 1, 2, 3...) in plaats van vaste weekdagen
  const SLOTS = ['T1', 'T2', 'T3', 'T4', 'T5'];
  const slotLabel = (d) => (SLOTS.includes(d) ? 'Training ' + d.slice(1) : d || 'Vrije training');
  const slotShort = (d) => (SLOTS.includes(d) ? 'T' + d.slice(1) : d || 'Vrij');
  // rust volgens Stijn (blog Rust): kracht 3 à 5 min, hypertrofie 2 à 2,5 min, accessoire/isolatie 30 à 60 s
  // Herstel (deload, blog Basisprincipes): volume tot 2/3 omlaag, gewicht en intensiteit blijven, frequentie hooguit 20% minder
  const PHASE_DEF = { Accumulatie: { repsMin: 8, repsMax: 10, rir: 2, tempo: '3010', rest: 120, restC: 60 }, Intensificatie: { repsMin: 3, repsMax: 5, rir: 1, tempo: '20X0', rest: 180, restC: 90 }, Herstel: { repsMin: 8, repsMax: 10, rir: 2, tempo: '3010', rest: 120, restC: 60, volCut: 50 }, Test: { repsMin: 1, repsMax: 3, rir: 0, tempo: '', rest: 240, restC: 120 } };
  PHASE_DEF.Ontlasting = PHASE_DEF.Herstel;
  const restFor = (phase, rk) => { const d = PHASE_DEF[phaseOf(phase)] || PHASE_DEF.Accumulatie; return rk === 'F' ? null : rk === 'C' ? d.restC : d.rest; };
  const restTxt = (s) => { const v = num(s); if (!v) return ''; return v >= 60 && v % 30 === 0 ? `${nl(v / 60)} min` : `${v} s`; };
  const cutSets = (n, cut) => Math.max(1, Math.round((num(n) || 1) * (1 - Math.min(67, Math.max(0, num(cut) ?? 50)) / 100)));
  // TUT (time under tension) per set = tempo per herhaling × reps. X = explosief, telt als 1 s
  const tempoSec = (t) => { const x = String(t || '').trim().toUpperCase(); if (!/^[0-9X]{4}$/.test(x)) return null; return [...x].reduce((a, ch) => a + (ch === 'X' ? 1 : +ch), 0); };
  const TUT_ZONES = [['kracht', 0, 20], ['hypertrofie', 40, 60], ['uithouding', 70, 999]];
  const tutInfo = (r) => { const sp = tempoSec(r?.tempo), a = num(r?.repsMin) ?? num(r?.repsMax), b = num(r?.repsMax) ?? a; if (!sp || !b) return null; const lo = sp * a, hi = sp * b, z = b <= 6 ? TUT_ZONES[0] : b <= 15 ? TUT_ZONES[1] : TUT_ZONES[2]; return { lo, hi, zone: z[0], zmin: z[1], zmax: z[2], ok: hi >= z[1] && lo <= z[2], txt: lo === hi ? `${lo} s` : `${lo} à ${hi} s` }; };
  const tutGoal = (t) => (t.zmax >= 999 ? `minstens ${t.zmin} s` : t.zmin ? `${t.zmin} à ${t.zmax} s` : `max ${t.zmax} s`);
  const tutPill = (r) => { const t = tutInfo(r); if (!t) return ''; return `<span class="pill ${t.ok ? 'ok' : 'warn'}" title="TUT per set. Doel ${t.zone}: ${tutGoal(t)} (blog Stijn, Tempo)">TUT ${t.txt}${t.ok ? ' · ' + t.zone : ' · doel ' + t.zone + ' ' + tutGoal(t)}</span>`; };
  const FILLERS = ['Band pull-apart 3 × 12', 'Face pull 3 × 15', 'RKC plank 3 × 10 s', 'Dead bug 3 × 6 per kant', 'Pallof press 3 × 8 per kant', 'Heupmobiliteit 90/90 3 × 5 per kant', 'Thoracale rotatie 3 × 6 per kant', 'Enkelmobiliteit 3 × 8 per kant'];
  const patternOf = (e) => { const c = e?.category; if (['Borst', 'Schouders', 'Triceps'].includes(c)) return 'push'; if (['Bovenrug', 'Biceps', 'Trapezius'].includes(c)) return 'pull'; if (['Quadriceps', 'Gluteus', 'Hamstrings', 'Onderrug', 'Adductoren', 'Kuiten'].includes(c)) return 'lower'; if (c === 'Conditie' || c === 'Fullbody') return 'cond'; return 'core'; };
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const STATUS = [['Klaar', 'ok'], ['Bijna', 'warn'], ['Aandacht', 'warn'], ['Nieuw', 'bad'], ['Gat', 'bad']];
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };

