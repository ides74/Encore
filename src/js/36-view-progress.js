  // ---------- view: progress ----------
  function viewProgress() {
    const c = client(), anchors = clientAnchors(c);
    const others = Object.values(S.exercises).filter((e) => !anchors.includes(e.id) && isStrength(e.id) && history(e.id).some((p) => p.bestP != null)).sort((a, b) => a.name.localeCompare(b.name));
    if (!S.progEx || !(anchors.includes(S.progEx) || others.some((e) => e.id === S.progEx))) S.progEx = anchors.find((id) => anchorStats(id)) || anchors[0] || null;
    const st = S.progEx ? anchorStats(S.progEx) : null;
    const hist = S.progEx ? history(S.progEx).filter((p) => p.bestP != null).reverse() : [];
    const table = anchors.map((id) => { const a = anchorStats(id); return `<tr class="click" data-act="sel-prog" data-id="${esc(id)}"><td><b style="font-weight:600">${esc(exName(id))}</b></td><td class="num">${intakeRM(id) ? nl(intakeRM(id), 0) : ''}</td><td class="num">${a ? nl(a.first, 0) : ''}</td><td class="num">${a ? nl(a.lastStrength, 0) : ''}</td><td class="small">${a ? esc(fmtDate(a.lastDate, false)) : ''}</td><td class="num">${a ? nl(a.best, 0) : ''}</td><td class="num ${a && a.rel.length > 1 && a.delta >= 0.03 ? 'sig-up' : a && a.rel.length > 1 && a.delta <= -0.03 ? 'sig-bad' : ''}">${a && a.rel.length > 1 ? (a.delta >= 0 ? '+' : '−') + nl(Math.abs(a.delta * 100), 0) + '%' : ''}</td><td>${a ? `<span class="pill ${a.signal[1]}">${a.signal[0]}</span>` : '<span class="muted small">nog nooit gelogd</span>'}</td></tr>`; }).join('');
    return `<section class="card"><div class="card-h"><div><h2>Ankeroefeningen</h2><p class="sub">Alles in <b>geschat 1RM (e1RM)</b>, niet het gewicht op de stang: zo zijn een set van 3 en een set van 8 vergelijkbaar. Formule: %-tabel van Stijn, reps + RIR. Trend en signaal tellen enkel <b>zware sets</b> (reps + RIR tot 10). Volumesets zonder RIR onderschatten het 1RM en staan als open bolletje.</p></div></div>
      ${anchors.length ? `<div class="tablewrap"><table><thead><tr><th>Oefening</th><th class="num">Intake</th><th class="num">Eerste</th><th class="num">Laatste</th><th>Gemeten</th><th class="num">Beste</th><th class="num">Verschil</th><th>Signaal</th></tr></thead><tbody>${table}</tbody></table></div>` : '<div class="empty">Geen ankeroefeningen van toepassing voor deze klant.</div>'}</section>
      ${balanceCard(c)}
      <section class="card"><div class="card-h"><div style="display:flex;flex-direction:column;gap:8px"><div class="chips">${anchors.map((id) => `<button class="chipbtn" data-act="sel-prog" data-id="${esc(id)}" aria-pressed="${id === S.progEx}">${esc(exName(id))}${anchorStats(id) ? '' : ' · geen data'}</button>`).join('')}</div>${others.length ? `<div class="chips"><span class="small muted" style="align-self:center">Andere gelogde oefeningen:</span>${others.map((e) => `<button class="chipbtn" data-act="sel-prog" data-id="${esc(e.id)}" aria-pressed="${e.id === S.progEx}" style="font-weight:500">${esc(e.name)}</button>`).join('')}</div>` : ''}</div></div>
        ${st ? `<div class="row" style="justify-content:space-between;margin-bottom:6px"><h3>${esc(exName(S.progEx))} · e1RM</h3><div class="legend"><span><i class="dot" style="background:var(--int)"></i>Intensificatie</span><span><i class="dot" style="background:var(--acc)"></i>Accumulatie</span><span><i class="dot" style="background:var(--ok)"></i>Herstel</span><span><i class="dot" style="background:var(--warn)"></i>Test</span><span><i class="dot" style="background:transparent;border:1.5px solid var(--muted)"></i>Volumeset (indicatief)</span><span><i style="display:inline-block;width:14px;border-top:1px dashed var(--muted)"></i>Eerste zware meting</span></div></div>
          ${st.onlyIndicative ? '<p class="notice">Nog geen zware set gelogd: de lijn toont voorlopig volumesets en onderschat het 1RM.</p>' : ''}<div class="chart" id="prog-chart"></div>` : '<div class="empty">Nog geen gegevens voor deze ankeroefening.</div>'}</section>
      ${hist.length ? `<details class="card"><summary>Alle metingen ${esc(exName(S.progEx))}</summary><div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Datum</th><th>Periode</th><th>Variant</th><th>Sets</th><th class="num">e1RM</th><th>Soort</th></tr></thead><tbody>${hist.map((p) => `<tr><td>${esc(fmtDate(p.date))}</td><td>${esc(S.blocks[p.blockId]?.code || '')}</td><td class="small">${esc(p.variant)}</td><td class="small">${esc(p.sets.map((x) => setLabel(S.progEx, x) + ' × ' + (nl(x.reps, 0) || '?') + effTxt(x)).join('  ·  '))}</td><td class="num">${nl(p.bestP)}</td><td class="small">${p.reliable ? 'zwaar' : '<span class="muted">volume</span>'}</td></tr>`).join('')}</tbody></table></div></details>` : ''}`;
  }
  function drawProgress() {
    const el = $('#prog-chart'); if (!el || !S.progEx) return;
    const st = anchorStats(S.progEx); if (!st) return;
    const pts = st.pts, line = st.rel, W = Math.max(300, el.clientWidth), H = 260, m = { t: 22, r: 60, b: 26, l: 40 };
    const xs = pts.map((p) => toDate(p.date).getTime()), ys = pts.map((p) => p.bestP);
    let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= 864e5 * 15; x1 += 864e5 * 15; }
    const pad = Math.max(2, (Math.max(...ys) - Math.min(...ys)) * 0.15); const y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
    const X = (v) => m.l + ((v - x0) / (x1 - x0)) * (W - m.l - m.r), Y = (v) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
    const step = (y1 - y0) / 4; const ticks = [0, 1, 2, 3, 4].map((i) => y0 + i * step);
    const months = []; const dd = new Date(x0); dd.setDate(1); dd.setMonth(dd.getMonth() + 1);
    const every = W < 520 ? 4 : 2; let k = 0;
    while (dd.getTime() <= x1) { if (k % every === 0) months.push(new Date(dd)); dd.setMonth(dd.getMonth() + 1); k++; }
    const TX = (p) => X(toDate(p.date).getTime());
    const path = line.map((p, i) => `${i ? 'L' : 'M'}${TX(p).toFixed(1)},${Y(p.bestP).toFixed(1)}`).join('');
    const last = line[line.length - 1];
    const tip = (p) => { const x = p.topP || {}; return `${fmtDate(p.date)}|${(S.blocks[p.blockId]?.code || '') + ' · ' + setLabel(S.progEx, x) + ' × ' + (nl(x.reps, 0) || '?') + effTxt(x)}|e1RM ${nl(p.bestP)} kg · ${p.reliable ? 'zware set' : 'volumeset, indicatief'}`; };
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Geschat 1RM over tijd">
      <text x="${m.l - 6}" y="10" text-anchor="end">kg</text>
      ${ticks.map((t) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)"/><text x="${m.l - 6}" y="${Y(t)}" dy="0.32em" text-anchor="end">${nl(t, 0)}</text>`).join('')}
      ${months.map((d) => `<text x="${X(d.getTime())}" y="${H - 6}" text-anchor="middle">${esc(d.toLocaleDateString('nl-BE', { month: 'short', year: '2-digit' }))}</text>`).join('')}
      <line x1="${m.l}" x2="${W - m.r}" y1="${Y(st.first)}" y2="${Y(st.first)}" stroke="var(--muted)" stroke-dasharray="3 4"/>
      <path d="${path}" fill="none" stroke="var(--ink)" stroke-opacity=".55" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p) => { const col = phaseCol(p.phase); return p.reliable || st.onlyIndicative ? `<circle cx="${TX(p)}" cy="${Y(p.bestP)}" r="5.5" fill="${col}" stroke="var(--panel)" stroke-width="1.5" data-tip="${esc(tip(p))}" style="cursor:pointer"/>` : `<circle cx="${TX(p)}" cy="${Y(p.bestP)}" r="4.5" fill="var(--panel)" stroke="${col}" stroke-width="1.8" opacity=".8" data-tip="${esc(tip(p))}" style="cursor:pointer"/>`; }).join('')}
      <text x="${TX(last) + 9}" y="${Y(last.bestP)}" dy="0.32em" style="fill:var(--ink);font-weight:600">${nl(last.bestP, 0)} kg</text></svg><div class="tip" hidden></div>`;
  }
