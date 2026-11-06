  // ---------- view: statistiek ----------
  function heat(v, max) { if (!v) return ''; const a = Math.round(10 + 55 * Math.min(1, v / (max || 1))); return ` style="background:color-mix(in srgb,var(--accent) ${a}%,transparent)"`; }
  function viewStats() {
    const t = todayStr(), cur = blockFor(t), withEx = sortedBlocks().filter((b) => (b.exercises || []).length);
    if (!S.statBlock || !S.blocks[S.statBlock]) S.statBlock = (cur && (cur.exercises || []).length ? cur.id : withEx[withEx.length - 1]?.id) || null;
    const b = S.blocks[S.statBlock], slots = b ? slotsOf(b) : [], pv = b ? planVol(b) : null;
    const real = sortedSessions().filter((s) => !s.historical);
    const w0 = weekStart(t), weeks = Array.from({ length: 8 }, (_, i) => addDays(w0, -7 * (7 - i)));
    const wk = {}, wkPat = {}, wkN = {}; weeks.forEach((w) => { wk[w] = {}; wkPat[w] = {}; wkN[w] = 0; });
    real.forEach((s) => { const w = weekStart(s.date); if (!wk[w]) return; wkN[w]++; const sv = sessVol(s); Object.entries(sv.v).forEach(([k, v]) => { wk[w][k] = (wk[w][k] || 0) + v; }); Object.entries(sv.p).forEach(([k, v]) => { wkPat[w][k] = (wkPat[w][k] || 0) + v; }); });
    const musc = MUSCLES.filter((m) => (pv?.tot[m] || 0) || weeks.some((w) => wk[w][m]));
    const maxPlan = Math.max(1, ...musc.flatMap((m) => slots.map((sl) => pv?.per[sl]?.[m] || 0)));
    const maxWk = Math.max(1, ...musc.flatMap((m) => [...weeks.map((w) => wk[w][m] || 0), pv?.tot[m] || 0]));
    const chips = withEx.slice(-6).map((x) => `<button class="chipbtn" data-act="stat-block" data-id="${esc(x.id)}" aria-pressed="${x.id === S.statBlock}">${esc(x.code)}${cur && x.id === cur.id ? ' · nu' : ''}</button>`).join('');
    const perTraining = b ? `<div class="tablewrap"><table><thead><tr><th>Spiergroep</th>${slots.map((sl) => `<th class="num">${slotShort(sl)}</th>`).join('')}<th class="num">Per week</th><th class="num">Direct</th></tr></thead><tbody>${musc.map((m) => `<tr><td>${esc(m)}</td>${slots.map((sl) => { const v = pv.per[sl][m] || 0; return `<td class="num"${heat(v, maxPlan)}>${v ? nl(v) : ''}</td>`; }).join('')}<td class="num"><b>${pv.tot[m] ? nl(pv.tot[m]) : ''}</b></td><td class="num muted">${pv.dir[m] ? nl(pv.dir[m]) : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nog geen schema.</div>';
    const perWeek = `<div class="tablewrap"><table><thead><tr><th>Spiergroep</th>${weeks.map((w) => `<th class="num">${esc(fmtDate(w, false))}</th>`).join('')}<th class="num">Plan p/w</th></tr></thead><tbody>${musc.map((m) => `<tr><td>${esc(m)}</td>${weeks.map((w) => { const v = wk[w][m] || 0; return `<td class="num"${heat(v, maxWk)}>${v ? nl(v) : ''}</td>`; }).join('')}<td class="num muted">${pv?.tot[m] ? nl(pv.tot[m]) : ''}</td></tr>`).join('')}<tr><td class="muted">Trainingen</td>${weeks.map((w) => `<td class="num muted">${wkN[w] || ''}</td>`).join('')}<td class="num muted">${slots.length || ''}</td></tr></tbody></table></div>`;
    // patroonbalans: gepland per week (blok) en gedaan (gemiddelde van de laatste 4 weken met trainingen)
    const last4 = weeks.slice(-4).filter((w) => wkN[w]), done = {};
    last4.forEach((w) => Object.entries(wkPat[w]).forEach(([k, v]) => { done[k] = (done[k] || 0) + v / last4.length; }));
    const pats = PATTERNS.filter(([k]) => (pv?.totPat[k] || 0) || done[k]);
    const maxP = Math.max(1, ...pats.flatMap(([k]) => [pv?.totPat[k] || 0, done[k] || 0]));
    const bar = (v, cls = '') => `<div class="barwrap"><div class="bar ${cls}" style="width:${Math.round((100 * (v || 0)) / maxP)}%"></div></div>`;
    const tgt = num(S.config.pullPushTarget) ?? 2, conf = !!S.config.pullPushConfirmed;
    const rP = pv ? ratio(pv.totPat) : null, rD = last4.length ? ratio(done) : null;
    const rTxt = (x) => (x && x.r != null ? `${nl(x.r, 1)} : 1` : '–');
    const rPill = (x) => { if (!x || x.r == null) return '<span class="pill neutral">geen duwwerk</span>'; if (!conf) return `<span class="pill neutral">doel ${esc(nl(tgt, 1))} : 1 te bevestigen</span>`; return x.r >= tgt * 0.9 ? '<span class="pill ok">in balans</span>' : '<span class="pill warn">te weinig trekwerk</span>'; };
    const hv = (p) => { const h = p['pull-h'] || 0, v = p['pull-v'] || 0; return h + v ? `${nl(h)} hor. · ${nl(v)} vert.` : ''; };
    const COVER = [['squat', 'Squat'], ['hinge', 'Hinge'], ['lunge', 'Lunge'], ['push', 'Duwen'], ['pull', 'Trekken'], ['carry', 'Carry'], ['core', 'Core']];
    const has = (p, k) => (k === 'push' ? PUSH.some((x) => p[x]) : k === 'pull' ? PULL.some((x) => p[x]) : !!p[k]);
    const cover = b ? `<div class="tablewrap"><table><thead><tr><th>Training</th>${COVER.map(([, l]) => `<th class="num">${l}</th>`).join('')}</tr></thead><tbody>${slots.map((sl) => `<tr><td><b style="font-weight:600">${slotLabel(sl)}</b></td>${COVER.map(([k]) => `<td class="num">${has(pv.pat[sl], k) ? '<span class="sig-up">✓</span>' : '<span class="muted">·</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    return `<section class="card"><div class="card-h"><div><h2>Volume per spiergroep</h2><p class="sub">Werksets, zonder opwarming. Hoofdspiergroep telt 1 set, secundaire spiergroep een halve. "Direct" telt enkel de hoofdspiergroep.</p></div></div>
        ${chips ? `<div class="chips" style="margin-bottom:10px">${chips}</div>` : ''}
        <h3 style="margin:6px 0 8px">Per training · ${esc(b?.code || '')} gepland</h3>${perTraining}
        <h3 style="margin:18px 0 8px">Per week · gedaan</h3>${perWeek}
        <p class="small muted" style="margin:8px 0 0">Ingeladen historiek (enkel topsets) telt niet mee.</p></section>
      <section class="card"><div class="card-h"><div><h2>Patroonbalans</h2><p class="sub">Sets per bewegingspatroon. Uit de blog van Stijn: alle patronen trainen, trekwerk vóór duwwerk in een fullbody training.</p></div></div>
        <div class="grid-tight" style="margin-bottom:14px">
          <div class="kpi"><span class="l">Pull : push gepland</span><span class="v">${rTxt(rP)}</span><span class="d">${rP ? `${nl(rP.pull)} trek- tegen ${nl(rP.push)} duwsets per week` : ''}</span>${rPill(rP)}</div>
          <div class="kpi"><span class="l">Pull : push gedaan</span><span class="v">${rTxt(rD)}</span><span class="d">${rD ? `gemiddelde per week, laatste ${last4.length} wk` : 'nog geen trainingen'}</span>${rD ? rPill(rD) : ''}</div>
          <div class="kpi"><span class="l">Trekwerk gepland</span><span class="v" style="font-size:22px">${pv ? hv(pv.totPat) || '–' : '–'}</span><span class="d">sets per week: horizontaal mag meer volume dragen</span></div>
        </div>
        ${conf ? '' : `<p class="notice" style="margin-bottom:12px">Doel ${esc(nl(tgt, 1))} : 1 komt uit de blog van Stijn (Postuur: verhouding trek- en duwbewegingen). Nog te bevestigen: pas aan of bevestig in Instellingen.</p>`}
        <div class="tablewrap"><table><thead><tr><th>Patroon</th><th>Gepland per week</th><th class="num"></th><th>Gedaan per week</th><th class="num"></th></tr></thead><tbody>${pats.map(([k, l]) => `<tr><td>${l}</td><td style="width:30%">${bar(pv?.totPat[k])}</td><td class="num">${pv?.totPat[k] ? nl(pv.totPat[k]) : ''}</td><td style="width:30%">${bar(done[k], 'done')}</td><td class="num">${done[k] ? nl(done[k]) : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Nog geen gegevens.</td></tr>'}</tbody></table></div>
        ${b ? `<h3 style="margin:18px 0 8px">Patronen per training · ${esc(b.code)}</h3><p class="small muted" style="margin:0 0 8px">Bij 2 à 3 trainingen per week komt elk patroon in elke training terug (blog Stijn, De 5 fundamentele bewegingspatronen).</p>${cover}` : ''}
        <p class="small muted" style="margin:10px 0 0">Het patroon per oefening staat in Oefeningen: automatisch herkend, aan te passen.</p></section>`;
  }

