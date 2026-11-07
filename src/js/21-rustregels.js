  // ---------- rustregels (pure functies, getest in test/e2e.py) ----------
  // De rust telt vanaf het einde van de set. Het bevestigen kost al zowat 10 s, dus de timer start op rust min 10 s.
  // Signaal 1 bij nog 10 s (klaarmaken), signaal 2 op 0 (starten). Na 5 min overtijd stopt de timer vanzelf.
  const REST_CONFIRM = 10, REST_WARN = 10, REST_MAX_OVER = 300, REST_MIN = 5;
  const restLeft = (sec) => Math.max(REST_MIN, (num(sec) || 0) - REST_CONFIRM);
  // rust voor een oefening: eigen rust uit het schema, anders de standaard van de fase. Finisher: geen timer.
  // voorstel rusttijd (Stijn, blog Rust): kracht 3 à 5 min, hypertrofie 2 à 2,5 min, accessoire of isolatie 30 à 60 s.
  // Bepaald door type oefening (basis of isolatie), reps en fase. Coach-rust uit het schema blijft een keuze in de timer.
  const ISO_PAT = ['iso', 'core', 'carry'];
  function restSuggest(exId, tg, phase) {
    const rk = reeksOf(tg?.code), ph = phaseOf(phase); if (rk === 'F') return null;
    if (!isStrength(exId)) return { sec: 60, why: 'conditie' };
    const r = num(tg?.repsMax) ?? num(tg?.repsMin) ?? 10, iso = rk === 'C' || ISO_PAT.includes(patOf(exId));
    let sec = iso ? (r <= 8 ? 90 : 60) : r <= 5 ? 180 : r <= 8 ? 150 : r <= 12 ? 120 : 90;
    if (ph === 'Test') sec += 60; else if (ph === 'Herstel') sec -= 30;
    sec = Math.max(45, sec);
    return { sec, why: `${iso ? 'isolatie' : 'basisoefening'}, ${tg?.repsMin && tg?.repsMax && tg.repsMin !== tg.repsMax ? tg.repsMin + '-' + tg.repsMax : r} reps, ${ph.toLowerCase()}` };
  }
  const restOf = (target, phase, exId) => { const tg = target || {}, rk = reeksOf(tg.code); if (rk === 'F') return null; const sg = exId ? restSuggest(exId, tg, phase) : null; return sg?.sec || num(tg.rest) || restFor(phase, rk); };
  // toestand van de timer op een moment: 'rest', 'soon' (laatste 10 s) of 'over'; signal = welk signaal nu af moet gaan (0 = geen)
  function restState(r, now) {
    const ms = r.end - now, s = Math.ceil(ms / 1000);
    const phase = ms <= 0 ? 'over' : s <= REST_WARN ? 'soon' : 'rest';
    const signal = ms <= 0 && !r.rang ? 2 : phase === 'soon' && !r.warned ? 1 : 0;
    return { ms, s, phase, signal, expired: ms < -REST_MAX_OVER * 1000 };
  }
  const mmss = (s) => `${Math.floor(s / 60)}:${pad(Math.max(0, s) % 60)}`;
