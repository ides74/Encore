  // ---------- view: home ----------
  function visibleClients() {
    const f = S.coachFilter;
    return Object.values(S.clients).filter((c) => !f || (f === '-' ? !c.coach : c.coach === f)).sort((a, b) => a.name.localeCompare(b.name));
  }
  function viewHome() {
    const cl = visibleClients();
    const t = todayStr();
    const coaches = S.config.coaches || [];
    const cnt = (f) => Object.values(S.clients).filter((c) => (f === '-' ? !c.coach : c.coach === f)).length;
    const filt = `<div class="chips" style="margin-bottom:14px"><button class="chipbtn" data-act="coach-filter" data-v="" aria-pressed="${!S.coachFilter}">Alle coaches · ${Object.keys(S.clients).length}</button>${coaches.map((c) => `<button class="chipbtn" data-act="coach-filter" data-v="${esc(c)}" aria-pressed="${S.coachFilter === c}">${esc(c)} · ${cnt(c)}</button>`).join('')}${cnt('-') ? `<button class="chipbtn" data-act="coach-filter" data-v="-" aria-pressed="${S.coachFilter === '-'}">Zonder coach · ${cnt('-')}</button>` : ''}</div>`;
    const cards = cl.map((c) => {
      const st = c.stats || {};
      const ev = c.event ? `<span class="pill acc">${esc(c.event.name)} · nog ${daysBetween(t, c.event.date)} d</span>` : '';
      return `<button class="card client-card" data-act="open-client" data-id="${esc(c.id)}">
        <div class="row" style="justify-content:space-between;width:100%"><span class="name">${esc(c.name)}</span>${ev}</div>
        <div class="small muted">${esc(c.goal || '')}</div>
        <div class="stats"><span>Coach <b>${esc(c.coach || 'nog niet toegewezen')}</b></span><span>Laatste training <b>${st.lastSession ? esc(fmtDate(st.lastSession)) : 'nog geen'}</b></span><span>Trainingen <b>${st.sessionCount ?? 0}</b></span><span>Intake <b>${c.intake?.date ? esc(fmtDate(c.intake.date, false)) : 'nog niet'}</b></span>${st.lastBodyweight ? `<span>Gewicht <b>${nl(st.lastBodyweight)} kg</b></span>` : ''}</div>
      </button>`;
    }).join('');
    return `<section><div class="card-h"><div><h1>Klanten</h1><p class="sub">Kies een klant om de intake te doen, schema's op te stellen, trainingen te loggen en progressie te volgen.</p></div>
      <button class="btn primary" data-act="new-client"${S.canWrite ? '' : ' disabled'}>+ Nieuwe klant</button></div>
      ${coaches.length ? filt : `<p class="notice" style="margin-bottom:14px">Nog geen coaches. Voeg ze toe via Instellingen om klanten toe te wijzen.</p>`}
      ${S.newClient ? clientForm(S.newClient, true) : ''}
      ${cl.length ? `<div class="grid">${cards}</div>` : `<div class="empty">${S.coachFilter ? 'Geen klanten voor deze coach.' : 'Nog geen klanten. Voeg je eerste klant toe met "Nieuwe klant".'}</div>`}</section>`;
  }
  function clientForm(d, isNew) {
    const anchors = (S.config.anchors || []).filter((id) => S.exercises[id]);
    const coaches = S.config.coaches || [];
    return `<div class="card" style="margin-bottom:16px"><h2 style="margin-bottom:12px">${isNew ? 'Nieuwe klant' : 'Profiel bewerken'}</h2>
      <div class="form">
        <label class="field"><span>Naam</span><input id="cf-name" data-bind="cf" data-f="name" value="${esc(d.name)}"></label>
        <label class="field"><span>Coach</span><select id="cf-coach" data-bind="cf" data-f="coach"><option value="">Nog niet toegewezen</option>${[...new Set([...coaches, d.coach].filter(Boolean))].map((c) => `<option${c === d.coach ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label class="field"><span>Trainingen per week</span><select id="cf-pw" data-bind="cf" data-f="perWeek">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}"${String(n) === String(d.perWeek ?? '') ? ' selected' : ''}>${n} × per week</option>`).join('')}</select></label>
        <label class="field"><span>Voorkeursdagen (optioneel)</span><input id="cf-days" data-bind="cf" data-f="trainingDays" value="${esc(d.trainingDays)}" placeholder="bv. wo en za"></label>
        <label class="field wide"><span>Doel</span><input id="cf-goal" data-bind="cf" data-f="goal" value="${esc(d.goal)}"></label>
        <label class="field wide"><span>Aandacht (medisch, persoonlijk)</span><input id="cf-con" data-bind="cf" data-f="constraints" value="${esc(d.constraints)}" placeholder="bv. knieën: geen schokbelasting"></label>
        <label class="field"><span>Lichaamsgewicht (kg)</span><input id="cf-bw" type="number" step="0.1" data-bind="cf" data-f="bodyweight" value="${esc(d.bodyweight)}"></label>
        <label class="field"><span>E-mail (voor rapporten)</span><input id="cf-email" type="email" data-bind="cf" data-f="email" value="${esc(d.email ?? '')}" placeholder="naam@voorbeeld.be"></label>
        <div class="field wide"><span>Optioneel per training</span><div class="checklist"><label><input type="checkbox" data-bind="cf-flag" value="trackAttention"${d.trackAttention ? ' checked' : ''}> Aandachtscore 0-10 (bv. pijn, vermoeidheid)</label><label><input type="checkbox" data-bind="cf-flag" value="trackWhoop"${d.trackWhoop ? ' checked' : ''}> Whoop recovery</label></div></div>
        <div class="field wide"><span>Ankeroefeningen die niet van toepassing zijn</span><p class="small muted" style="margin:0 0 4px">De ankers gelden voor alle klanten. Vink aan wat deze klant niet kan doen; die oefening verdwijnt uit intake en progressie.</p><div class="checklist">${anchors.map((id) => `<label><input type="checkbox" data-bind="cf-na" value="${esc(id)}"${(d.anchorsNA || []).includes(id) ? ' checked' : ''}> ${esc(exName(id))}</label>`).join('')}</div></div>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-act="cf-cancel">Annuleren</button><button class="btn primary" data-act="cf-save">${isNew ? 'Klant aanmaken' : 'Profiel opslaan'}</button></div></div>`;
  }

