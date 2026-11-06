  // ---------- view: event ----------
  function viewEvent() {
    const c = client(), ev = c.event;
    if (!ev && !S.eventDraft) return `<section class="card"><div class="card-h"><div><h2>Event</h2><p class="sub">Tijdelijke voorbereiding op een wedstrijd, trektocht of test. Na het event sluit je het af.</p></div><button class="btn primary" data-act="new-event"${S.canWrite ? '' : ' disabled'}>+ Event toevoegen</button></div><div class="empty">Geen event gepland voor ${esc(c.name)}.</div></section>`;
    if (!S.eventDraft) S.eventDraft = clone(ev);
    const d = S.eventDraft, t = todayStr();
    const left = d.date ? daysBetween(t, d.date) : null;
    const secs = (s) => { if (s == null || s === '') return null; const p = String(s).split(':').map(Number); return p.length === 2 ? p[0] * 60 + p[1] : Number(s); };
    const mmss = (v) => v == null ? '' : `${Math.floor(v / 60)}:${pad(Math.round(v % 60))}`;
    const tot = (f) => { const a = (d.stations || []).map((s) => secs(s[f])).filter((v) => v != null && !isNaN(v)); return a.length ? mmss(a.reduce((x, y) => x + y, 0)) : ''; };
    const rows = (d.stations || []).map((s, i) => {
      const gap = num(s.raceKg) != null && num(s.trainKg) != null ? num(s.raceKg) - num(s.trainKg) : null;
      const inp = (f, cls = 'xs') => `<td><input class="${cls}" id="st-${i}-${f}" data-bind="station" data-i="${i}" data-f="${f}" value="${esc(s[f] ?? '')}"></td>`;
      return `<tr class="${/lopen|run/i.test(s.name) ? 'station-run' : ''}"><td class="muted">${i + 1}</td>${inp('name', '')}${inp('req', '')}${inp('raceKg')}${inp('trainKg')}<td class="num ${gap > 0 ? 'sig-bad' : ''}">${gap != null ? nl(gap) : ''}</td>
        <td><select id="st-${i}-status" data-bind="station" data-i="${i}" data-f="status">${STATUS.map(([sv]) => `<option${sv === s.status ? ' selected' : ''}>${sv}</option>`).join('')}</select></td>${inp('test1')}${inp('test2')}${inp('target')}<td><button class="btn ghost small" data-act="del-station" data-i="${i}" aria-label="Station verwijderen">×</button></td></tr>`;
    }).join('');
    const cnt = (stt) => (d.stations || []).filter((s) => s.status === stt).length;
    return `<section class="card"><div class="row" style="justify-content:space-between;align-items:flex-end">
        <div><h2>${esc(d.name || 'Nieuw event')}</h2><p class="sub">${esc(fmtDate(d.date))}${d.place ? ' · ' + esc(d.place) : ''}${d.division ? ' · divisie ' + esc(d.division) : ''}</p></div>
        ${left != null ? `<div style="text-align:right"><div class="countdown">${left}</div><div class="small muted">dagen te gaan</div></div>` : ''}</div>
        <div class="chips" style="margin-top:10px">${STATUS.map(([sv, cl]) => cnt(sv) ? `<span class="pill ${cl}">${sv}: ${cnt(sv)}</span>` : '').join('')}</div>
        <div class="form" style="margin-top:14px"><label class="field"><span>Naam</span><input id="ev-name" data-bind="ev" data-f="name" value="${esc(d.name ?? '')}"></label>
          <label class="field"><span>Datum</span><input type="date" id="ev-date" data-bind="ev" data-f="date" value="${esc(d.date ?? '')}"></label>
          <label class="field"><span>Divisie</span><input id="ev-div" data-bind="ev" data-f="division" value="${esc(d.division ?? '')}"></label>
          <label class="field"><span>Locatie</span><input id="ev-place" data-bind="ev" data-f="place" value="${esc(d.place ?? '')}"></label></div></section>
      <section class="card"><div class="card-h"><h2>Stations</h2><span class="small muted">tijden als mm:ss · gat = racegewicht min trainingsgewicht</span></div>
        <div class="tablewrap"><table><thead><tr><th>#</th><th>Onderdeel</th><th>Eis</th><th class="num">Race kg</th><th class="num">Training kg</th><th class="num">Gat</th><th>Status</th><th>Test 1</th><th>Test 2</th><th>Doel</th><th></th></tr></thead>
        <tbody>${rows}</tbody><tfoot><tr><td></td><td colspan="6"><b>Totale tijd</b></td><td class="num"><b>${tot('test1')}</b></td><td class="num"><b>${tot('test2')}</b></td><td class="num"><b>${tot('target')}</b></td><td></td></tr></tfoot></table></div>
        <div class="row" style="margin-top:10px"><button class="btn" data-act="add-station">+ Station</button></div></section>
      <div class="sticky-actions"><button class="btn danger" data-act="close-event" style="margin-right:auto">Event afsluiten</button><button class="btn" data-act="reset-event"${S.eventDirty ? '' : ' disabled'}>Annuleren</button><button class="btn primary" data-act="save-event"${S.canWrite && S.eventDirty ? '' : ' disabled'}>Event opslaan</button></div>`;
  }

