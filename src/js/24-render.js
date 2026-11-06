  // ---------- render ----------
  const root = $('#app');
  function render() {
    S.pending = false;
    root.innerHTML = `<div class="top">${headerHTML()}</div><main id="main">${mainHTML()}</main>`;
    afterRender();
  }
  function renderHeader() { const t = $('.top', root); if (t) t.innerHTML = headerHTML(); }
  function renderMain() { const m = $('#main'); if (m) { m.innerHTML = mainHTML(); afterRender(); } }
  function renderOverlay() {
    const o = $('#overlay'); let h = '';
    if (S.confirm) h += `<div class="confirm" role="dialog" aria-modal="true"><div class="card"><h3>${esc(S.confirm.title)}</h3><p class="sub">${esc(S.confirm.text)}</p><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-act="confirm-no">Annuleren</button><button class="btn danger" data-act="confirm-yes">${esc(S.confirm.yes || 'Verwijderen')}</button></div></div></div>`;
    if (S.toast) h += `<div class="toast" role="status">${esc(S.toast)}</div>`;
    o.innerHTML = h;
  }
  function headerHTML() {
    const cl = visibleClients();
    const tabs = [['overview', 'Overzicht'], ['planning', 'Planning'], ['training', 'Training loggen'], ['progress', 'Progressie'], ['stats', 'Statistiek'], ['history', 'Historiek'], ['intake', 'Intake'], ['event', 'Event'], ['exercises', 'Oefeningen']];
    return `<div class="top-row"><div class="brand"><b>EnCORE</b> Coach<small>Personal coaching logboek</small></div>
      <div class="client-pick"><label for="client-sel">Klant</label><select id="client-sel" data-change="client"><option value="">${S.coachFilter ? 'Klanten van ' + esc(S.coachFilter) : 'Alle klanten'}</option>${cl.map((c) => `<option value="${esc(c.id)}"${c.id === S.cid ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div></div>
      <nav class="tabs" aria-label="Onderdelen">${S.cid ? tabs.map(([v, l]) => `<button class="tab" data-act="view" data-v="${v}"${S.view === v ? ' aria-current="page"' : ''}>${l}</button>`).join('') : [['home', 'Klanten'], ['exercises', 'Oefeningen'], ['settings', 'Instellingen']].map(([v, l]) => `<button class="tab" data-act="view" data-v="${v}"${S.view === v ? ' aria-current="page"' : ''}>${l}</button>`).join('')}</nav>`;
  }
  function mainHTML() {
    if (S.offline) return `<div class="empty">Deze weergave kan de gedeelde database niet openen. Open de app via claude.ai terwijl je aangemeld bent.</div>`;
    if (!S.loaded.cl || !S.loaded.ex) return `<div class="empty">De app laadt de klanten en oefeningen…</div>`;
    let h = S.canWrite ? '' : `<div class="notice">Alleen lezen: je kan gegevens bekijken maar niet wijzigen.</div>`;
    if (S.pending) h += `<div class="notice">Er zijn nieuwe gegevens binnengekomen. Ze verschijnen na opslaan of annuleren.</div>`;
    if (!S.cid || S.view === 'home') return h + (S.view === 'exercises' ? viewExercises() : S.view === 'settings' ? viewSettings() : viewHome());
    if (!S.loaded.bl || !S.loaded.se) return h + `<div class="empty">Trainingen van ${esc(client()?.name)} laden…</div>`;
    const v = { overview: viewOverview, intake: viewIntake, training: viewTraining, planning: viewPlanning, schema: viewPlanning, history: viewHistory, progress: viewProgress, stats: viewStats, event: viewEvent, exercises: viewExercises }[S.view] || viewOverview;
    return h + v();
  }

