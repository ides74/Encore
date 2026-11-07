  // ---------- view: settings ----------
  function viewSettings() {
    if (!S.settingsDraft) S.settingsDraft = { coaches: [...(S.config.coaches || [])], anchors: [...(S.config.anchors || [])], bigBlock: S.config.bigBlock ?? 5.5, smallBlock: S.config.smallBlock ?? 2.75, pullPushTarget: S.config.pullPushTarget ?? 2, pullPushConfirmed: !!S.config.pullPushConfirmed, dirty: false };
    const d = S.settingsDraft;
    const strength = Object.values(S.exercises).filter((e) => STRENGTH.includes(e.unit)).sort((a, b) => a.name.localeCompare(b.name));
    return `<section class="card"><div class="card-h"><div><h2>Coaches</h2><p class="sub">Wijs klanten toe via "Profiel bewerken". Op de klantenpagina filter je per coach.</p></div></div>
        <div style="display:flex;flex-direction:column;gap:8px;max-width:28rem">${d.coaches.map((c, i) => `<div class="row" style="flex-wrap:nowrap"><input style="flex:1" id="co-${i}" data-bind="coach" data-i="${i}" value="${esc(c)}" placeholder="Naam coach"><button class="btn ghost small" data-act="co-del" data-i="${i}" aria-label="Coach verwijderen">×</button></div>`).join('') || '<span class="muted">Nog geen coaches.</span>'}</div>
        <div class="row" style="margin-top:10px"><button class="btn" data-act="co-add">+ Coach</button></div></section>
      <section class="card"><div class="card-h"><div><h2>Toestellen</h2><p class="sub">Geldt voor alle klanten. Trainingen op een toestel worden bewaard als aantal blokken + extra kg; het totaal in kg wordt telkens met dit gewicht berekend.</p></div></div>
        <div class="row"><label class="field" style="max-width:16rem"><span>Kg per groot blok</span><input id="set-kpb" inputmode="decimal" data-bind="set-kpb" value="${esc(d.bigBlock)}"></label>
        <label class="field" style="max-width:16rem"><span>Kg kleine blok (altijd mee)</span><input id="set-kps" inputmode="decimal" data-bind="set-kps" value="${esc(d.smallBlock)}"></label></div>
        <p class="small muted" style="margin:6px 0 0">Gelogd wordt blok + extra gewichtje (2,3 of 4,6 kg), niet de kg: door de katrol is de echte weerstand anders dan het getal. Blok 10 + 2,3 = ${esc(nl((num(d.smallBlock) || 0) + (num(d.bigBlock) || 0) * 10 + 2.3))} kg (enkel voor de berekening).</p></section>
      <section class="card"><div class="card-h"><div><h2>Patroonbalans</h2><p class="sub">Verhouding trekken tegenover duwen in sets per week. De blog van Stijn noemt 2 : 1; bevestig of pas aan.</p></div></div>
        <div class="row" style="align-items:flex-end;gap:16px"><label class="field" style="max-width:12rem"><span>Doel pull : push</span><input id="set-ppt" inputmode="decimal" data-bind="set-ppt" value="${esc(d.pullPushTarget)}"></label>
        <label class="row small" style="gap:8px;padding-bottom:8px"><input type="checkbox" data-bind="set-ppc"${d.pullPushConfirmed ? ' checked' : ''}> Bevestigd door Stijn</label></div></section>
      <section class="card"><div class="card-h"><div><h2>Ankeroefeningen</h2><p class="sub">Gelden voor alle klanten: intake, overzicht en progressie. Per klant zet je een anker op "niet van toepassing" in het profiel.</p></div></div>
        <div class="checklist">${strength.map((e) => `<label><input type="checkbox" data-bind="set-anchor" value="${esc(e.id)}"${d.anchors.includes(e.id) ? ' checked' : ''}> ${esc(e.name)}</label>`).join('')}</div></section>
      <div class="sticky-actions"><button class="btn" data-act="set-reset"${d.dirty ? '' : ' disabled'}>Annuleren</button><button class="btn primary" data-act="set-save"${S.canWrite ? '' : ' disabled'}>Instellingen opslaan</button></div>`;
  }

