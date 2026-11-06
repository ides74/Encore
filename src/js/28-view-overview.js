  // ---------- view: overview ----------
  function sparkSVG(pts) {
    if (!pts || pts.length < 2) return '<svg class="spark" viewBox="0 0 120 38"></svg>';
    const W = 120, H = 38, xs = pts.map((p) => toDate(p.date).getTime()), ys = pts.map((p) => p.bestP);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const X = (v) => 3 + ((v - x0) / (x1 - x0 || 1)) * (W - 6), Y = (v) => H - 4 - ((v - y0) / (y1 - y0 || 1)) * (H - 8);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.bestP).toFixed(1)}`).join('');
    const l = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="var(--line-strong)" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/><circle cx="${X(xs[xs.length - 1]).toFixed(1)}" cy="${Y(l.bestP).toFixed(1)}" r="2.6" fill="var(--accent)"/></svg>`;
  }
  function viewOverview() {
    const c = client(); if (!c) return '';
    if (S.profileDraft) return clientForm(S.profileDraft, false);
    const ss = sortedSessions(), real = ss.filter((s) => !s.historical), t = todayStr();
    const last30 = real.filter((s) => daysBetween(s.date, t) <= 30 && s.date <= t).length;
    const fb = real.filter((s) => s.feedback);
    const lastBw = [...fb].reverse().find((s) => num(s.feedback.bodyweight) != null)?.feedback.bodyweight ?? c.bodyweight;
    const pains = fb.map((s) => num(s.feedback.pain)).filter((v) => v != null).slice(-4);
    const whoops = fb.map((s) => num(s.feedback.whoop)).filter((v) => v != null).slice(-4);
    const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const cur = blockFor(t);
    const anchors = clientAnchors(c).map((id) => ({ id, st: anchorStats(id) }));
    const alerts = [];
    anchors.forEach((a) => { if (a.st && a.st.signal[1] !== 'ok') alerts.push(`<li><span class="pill ${a.st.signal[1]}">${a.st.signal[0]}</span> ${esc(exName(a.id))}: laatste zware meting e1RM ${nl(a.st.lastStrength, 0)} kg, beste ooit ${nl(a.st.best, 0)} kg.</li>`); });
    const lastS = real[real.length - 1];
    if (lastS) (lastS.entries || []).forEach((en) => { const rm = num(en.target?.repsMax); if (rm && (en.sets || []).some((x) => num(x.reps) > rm)) alerts.push(`<li><span class="pill ok">Verhoog</span> ${esc(exName(en.exId))}: boven het repsbereik op ${esc(fmtDate(lastS.date, false))}.</li>`); });
    if (cur) [...new Set((cur.exercises || []).map((r) => r.exId).filter(Boolean))].forEach((id) => { if (!history(id).length) alerts.push(`<li><span class="pill neutral">Nieuw</span> ${esc(exName(id))} staat in ${esc(cur.code)} maar is nog nooit gelogd.</li>`); });
    if (!c.intake?.date) alerts.unshift(`<li><span class="pill neutral">Intake</span> Nog geen eerste training gelogd: de 1RM-basis voor de schema's ontbreekt.</li>`);
    if (tracks(c, 'attention') && avg(pains) != null && avg(pains) >= 4) alerts.unshift(`<li><span class="pill bad">${ATT}</span> gemiddeld ${nl(avg(pains))} op 10 de laatste trainingen.</li>`);
    const ev = c.event;
    return `<section class="card-h" style="margin:0"><div><h1>${esc(c.name)}</h1><p class="sub">${esc(c.goal || '')}</p>
        <div class="chips" style="margin-top:8px">${c.coach ? `<span class="pill neutral">Coach ${esc(c.coach)}</span>` : ''}${c.constraints ? `<span class="pill warn">${ATT}: ${esc(c.constraints)}</span>` : ''}<span class="pill neutral">${esc(c.perWeek || slotsOf(cur).length)} × per week${c.trainingDays ? ' · ' + esc(c.trainingDays) : ''}</span>${cur ? `<span class="pill acc">Nu: ${esc(cur.code)} · ${esc(phaseOf(cur.phase))} · week ${Math.min(weekFor(cur, t), blockWeeks(cur))} van ${blockWeeks(cur)}</span>` : ''}</div></div>
        <div class="row"><button class="btn" data-act="edit-profile"${S.canWrite ? '' : ' disabled'}>Profiel bewerken</button><button class="btn primary" data-act="view" data-v="training">+ Training loggen</button></div></section>
      <section class="grid-tight">
        <div class="kpi"><span class="l">Trainingen 30 dagen</span><span class="v">${last30}</span><span class="d">${real.length} gelogd in totaal</span></div>
        <div class="kpi"><span class="l">Laatste training</span><span class="v" style="font-size:24px">${lastS ? esc(fmtDate(lastS.date, false)) : '–'}</span><span class="d">${lastS ? esc((S.blocks[lastS.blockId]?.code || '') + ' · ' + slotLabel(sessSlot(lastS))) : 'nog geen'}</span></div>
        <div class="kpi"><span class="l">Lichaamsgewicht</span><span class="v">${lastBw != null ? nl(lastBw) : '–'}<small>kg</small></span><span class="d">laatst gemeten</span></div>
        ${tracks(c, 'attention') ? `<div class="kpi"><span class="l">${ATT} (0-10)</span><span class="v">${avg(pains) != null ? nl(avg(pains)) : '–'}</span><span class="d">gemiddelde laatste 4</span></div>` : ''}
        ${tracks(c, 'whoop') ? `<div class="kpi"><span class="l">Whoop recovery</span><span class="v">${avg(whoops) != null ? nl(avg(whoops), 0) : '–'}<small>%</small></span><span class="d">gemiddelde laatste 4</span></div>` : ''}
        ${ev ? `<div class="kpi"><span class="l">${esc(ev.name)}</span><span class="v">${daysBetween(t, ev.date)}<small>dagen</small></span><span class="d">${esc(fmtDate(ev.date))}</span></div>` : ''}
      </section>
      <section class="card"><div class="card-h"><h2>Ankeroefeningen</h2><span class="small muted">geschat 1RM (e1RM) uit zware sets · signaal t.o.v. beste ooit</span></div>
        ${anchors.length ? `<div class="grid">${anchors.map((a) => a.st ? `<button class="card anchor" style="text-align:left;font:inherit;color:inherit;cursor:pointer" data-act="goto-progress" data-id="${esc(a.id)}"><div class="top2"><span class="nm">${esc(exName(a.id))}</span><span class="pill ${a.st.signal[1]}">${a.st.signal[0]}</span></div><div class="top2"><span class="val">${nl(a.st.lastStrength, 0)} <small class="muted" style="font-size:14px">kg e1RM</small></span><span class="small ${a.st.rel.length > 1 && a.st.delta >= 0.03 ? 'sig-up' : a.st.rel.length > 1 && a.st.delta <= -0.03 ? 'sig-bad' : 'muted'}">${a.st.rel.length > 1 ? (a.st.delta >= 0 ? '+' : '−') + nl(Math.abs(a.st.delta * 100), 0) + '% sinds start' : 'pas 1 zware meting'}</span></div>${sparkSVG(a.st.rel)}</button>` : `<div class="card anchor"><span class="nm">${esc(exName(a.id))}</span><span class="small muted">Nog nooit gelogd. Test bij de intake of plan in een A-reeks.</span></div>`).join('')}</div>` : `<div class="empty">Geen ankeroefeningen van toepassing. Stel ze in via Instellingen of "Profiel bewerken".</div>`}
      </section>
      <section class="grid">
        <div class="card"><div class="card-h"><h2>Aandachtspunten</h2></div>${alerts.length ? `<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px">${alerts.slice(0, 8).join('')}</ul>` : '<p class="muted">Geen signalen. Alles loopt volgens plan.</p>'}</div>
        ${periodCard(cur, real, t)}
      </section>`;
  }

  function periodCard(cur, real, t) {
    if (!cur) return `<div class="card"><div class="card-h"><h2>Huidige periode</h2></div><p class="muted">Nog geen periode gepland.</p><button class="btn primary" data-act="view" data-v="planning">Periode opbouwen</button></div>`;
    const inCur = real.filter((s) => s.blockId === cur.id), slots = slotsOf(cur), wk = weekFor(cur, t), wks = blockWeeks(cur);
    const nextStart = addDays(cur.start, 7 * wks), upcoming = sortedBlocks().some((b) => b.start > cur.start);
    return `<div class="card"><div class="card-h"><div><h2>Huidige periode</h2><p class="sub">${esc(cur.code)} · ${esc(phaseOf(cur.phase))} · week ${Math.min(wk, wks)} van ${wks}${cur.reps ? ' · ' + esc(cur.reps) + ' reps' : ''}</p></div><button class="btn ghost small" data-act="view" data-v="planning">Planning</button></div>
      <div class="tablewrap"><table><thead><tr><th>Training</th><th class="num">Oef.</th><th class="num">Gedaan</th><th>Laatst</th></tr></thead><tbody>${slots.map((sl) => { const done = inCur.filter((s) => sessSlot(s) === sl); return `<tr><td><b style="font-weight:600">${slotLabel(sl)}</b></td><td class="num">${(cur.exercises || []).filter((r) => normDay(cur, r.day) === sl).length}</td><td class="num">${done.length} / ${wks}</td><td class="small">${done.length ? esc(fmtDate(done[done.length - 1].date, false)) : '<span class="muted">nog niet</span>'}</td></tr>`; }).join('')}</tbody></table></div>
      ${wk >= wks && !upcoming ? `<p class="notice" style="margin-top:10px">Laatste week van deze periode. Bouw de volgende periode op (start ${esc(fmtDate(nextStart, false))}).</p>` : ''}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="view" data-v="training">+ Training loggen</button></div></div>`;
  }

