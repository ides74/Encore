  // ---------- krachtbalans bovenlichaam ----------
  function balanceCard(c) {
    if (!S.exercises[RATIO_REF]) return '';
    const na = c.anchorsNA || [];
    const rows = RATIOS.filter(([id]) => S.exercises[id] && !na.includes(id)).map(([id, pct]) => ({ id, pct, rm: curRM(id) }));
    const ref = curRM(RATIO_REF);
    const missing = RATIOS.filter(([id]) => !S.exercises[id]).map(([id]) => id);
    let body;
    if (!ref) body = '<p class="notice">Nog geen 1RM voor Flat BB bench press: de referentie (100%) ontbreekt. Log een zware set of vul de intake aan.</p>';
    else {
      rows.forEach((r) => { if (r.rm != null && r.id !== RATIO_REF) { r.act = (r.rm / ref) * 100; r.diff = r.act - r.pct; } });
      const sig = (r) => r.id === RATIO_REF ? ['Referentie', 'neutral'] : r.rm == null ? ['Geen data', 'neutral'] : r.diff <= -10 ? ['Achterstand', 'bad'] : r.diff < -5 ? ['Licht achter', 'warn'] : r.diff > 5 ? ['Voor op bench', 'acc'] : ['In balans', 'ok'];
      const weak = rows.filter((r) => r.diff != null && r.diff < -5).sort((a, b) => a.diff - b.diff)[0];
      const ahead = rows.filter((r) => r.diff != null && r.diff > 5);
      body = `<div class="tablewrap"><table><thead><tr><th>Oefening</th><th class="num">Optimaal</th><th class="num">Doel 1RM</th><th class="num">Huidig e1RM</th><th class="num">Huidig %</th><th class="num">Verschil</th><th>Signaal</th></tr></thead><tbody>${rows.map((r) => { const s = sig(r); return `<tr><td><b style="font-weight:600">${esc(exName(r.id))}</b>${unitOf(r.id) === 'bw' ? ' <span class="small muted">(LG + extra)</span>' : ''}</td><td class="num">${r.pct}%</td><td class="num">${nl(Math.round(ref * r.pct / 100), 0)} kg</td><td class="num">${r.rm != null ? nl(r.rm, 0) + ' kg' : ''}</td><td class="num">${r.act != null ? nl(r.act, 0) + '%' : r.id === RATIO_REF ? '100%' : ''}</td><td class="num">${r.diff != null ? (r.diff >= 0 ? '+' : '-') + nl(Math.abs(r.diff), 0) + ' pt' : ''}</td><td><span class="pill ${s[1]}">${s[0]}</span></td></tr>`; }).join('')}</tbody></table></div>
        ${weak ? `<p class="notice" style="margin-top:10px">Zwakste schakel: <b>${esc(exName(weak.id))}</b> (${nl(Math.abs(weak.diff), 0)} procentpunt onder optimaal, doel ${nl(Math.round(ref * weak.pct / 100), 0)} kg). Geef deze oefening voorrang in de A-reeks.</p>` : rows.some((r) => r.diff != null) ? '<p class="hint" style="margin-top:10px">Geen achterstand t.o.v. de bench press.</p>' : ''}
        ${ahead.length >= 2 ? '<p class="small muted" style="margin:8px 0 0">Meerdere oefeningen liggen voor op de bench press: dan is de bench zelf de achterblijver.</p>' : ''}`;
    }
    return `<section class="card"><div class="card-h"><div><h2>Krachtbalans bovenlichaam</h2><p class="sub">Optimale verhouding t.o.v. Flat BB bench press (= 100%), op basis van e1RM. Signaal: tot 5 procentpunt eronder = in balans, vanaf 10 = achterstand. Zonder eigen meting gebruikt de planning deze ratio als 1RM-basis.</p></div></div>${body}${missing.length ? `<p class="small muted" style="margin:8px 0 0">Niet in de bibliotheek: ${esc(missing.join(', '))}.</p>` : ''}</section>`;
  }

