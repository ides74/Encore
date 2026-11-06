  // ---------- opwarmsets ----------
  // blog Stijn (Opwarmingssets): eerste set licht en explosief met dubbel zoveel reps als de werksets, daarna stijgend gewicht en dalende reps.
  // Meer sets bij zware of complexe oefeningen (A-reeks), minimum bij accessoires.
  // A-reeks (Stijn, specifieke opwarming): opwarmen met dezelfde oefening, in % van het gewicht van de EERSTE werkset.
  // 7 reps of meer (80% 1RM of lager): 6 × 50%, 4 × 75%. 6 reps of minder (83% 1RM of meer): 6 × 50%, 4 × 70%, 2 × 90%.
  const WU_A = { light: [[0.5, 6], [0.75, 4]], heavy: [[0.5, 6], [0.7, 4], [0.9, 2]] };
  const r25 = (v) => Math.round(v / 2.5) * 2.5;
  function warmupPlan(r) {
    const unit = unitOf(r.exId), rk = reeksOf(r.code);
    if (!r.exId || !['kg', 'kg per hand', 'blok'].includes(unit) || !['A', 'B'].includes(rk)) return [];
    const plan = r.setPlan || [];
    const kpb = kgPerBlock(), rnd = (v) => (unit === 'kg' ? r25(v) : unit === 'kg per hand' ? Math.round(v / 2) * 2 : Math.round((Math.round(v / kpb) * kpb) * 10) / 10);
    const out = [];
    if (rk === 'A') {
      const first = plan.find((p) => num(p.kg)); const work = num(first?.kg); if (!work) return [];
      const reps = num(first.reps) ?? num(r.repsMin) ?? num(r.repsMax) ?? 8;
      (reps <= 6 ? WU_A.heavy : WU_A.light).forEach(([p, rp]) => { const kg = rnd(work * p); if (kg > 0 && kg < work && !out.some((w) => w.kg === kg)) out.push({ kg, reps: rp }); });
      return out;
    }
    const work = Math.max(0, ...plan.map((p) => num(p.kg) || 0)); if (!work) return [];
    const reps = num(r.repsMax) || num(plan[0]?.reps) || 8;
    [[0.5, 1.5], [0.75, 0.5]].forEach(([p, f]) => { const kg = rnd(work * p), rp = Math.max(1, Math.min(12, Math.round(reps * f))); if (kg > 0 && kg < work && !out.some((w) => w.kg === kg)) out.push({ kg, reps: rp }); });
    return out;
  }
  const wuTxt = (wu) => (wu || []).filter((w) => num(w.kg) != null || num(w.reps) != null).map((w) => `${num(w.kg) != null ? nl(w.kg) : '?'} × ${nl(w.reps, 0) || '?'}`).join(', ');

