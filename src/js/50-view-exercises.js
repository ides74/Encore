  // ---------- view: exercises ----------
  const exType = (e) => (STRENGTH.includes(e?.unit || 'kg') ? 'kracht' : 'conditie');
  function viewExercises() {
    const list = Object.values(S.exercises).sort((a, b) => (CATS.indexOf(a.category) - CATS.indexOf(b.category)) || a.name.localeCompare(b.name));
    const used = (id) => (S.cid ? history(id).length : null);
    const catOpts = (cur, empty) => `${empty ? `<option value="">${empty}</option>` : ''}${CATS.map((c) => `<option${c === cur ? ' selected' : ''}>${c}</option>`).join('')}`;
    const form = (d, isNew) => {
      const type = d.type || exType(d), units = type === 'conditie' ? UNITS_C : UNITS_K, sec = d.secondary || [];
      return `<tr><td><input id="ex-name" data-bind="exf" data-f="name" value="${esc(d.name)}" placeholder="Naam"></td>
        <td><select id="ex-type" data-bind="exf" data-f="type"><option value="kracht"${type === 'kracht' ? ' selected' : ''}>Kracht</option><option value="conditie"${type === 'conditie' ? ' selected' : ''}>Conditie</option></select></td>
        <td><select id="ex-cat" data-bind="exf" data-f="category">${catOpts(d.category)}</select></td>
        <td><div style="display:flex;flex-direction:column;gap:4px"><select id="ex-sec0" data-bind="exf-sec" data-i="0">${catOpts(sec[0], 'geen')}</select><select id="ex-sec1" data-bind="exf-sec" data-i="1">${catOpts(sec[1], 'geen')}</select></div></td>
        <td><select id="ex-pat" data-bind="exf" data-f="pattern"><option value="">Auto: ${esc(PAT_LABEL[autoPattern({ ...d, type: undefined })])}</option>${PATTERNS.map(([k, l]) => `<option value="${k}"${k === d.pattern ? ' selected' : ''}>${l}</option>`).join('')}</select></td>
        <td><select id="ex-unit" data-bind="exf" data-f="unit">${units.map(([v, l]) => `<option value="${v}"${v === d.unit ? ' selected' : ''}>${l}</option>`).join('')}</select></td>
        <td><input id="ex-note" data-bind="exf" data-f="note" value="${esc(d.note ?? '')}" placeholder="Uitvoering, aandachtspunt"></td>${S.cid ? '<td></td>' : ''}
        <td style="white-space:nowrap"><button class="btn small" data-act="ex-cancel">Annuleren</button> <button class="btn primary small" data-act="ex-save">${isNew ? 'Toevoegen' : 'Opslaan'}</button></td></tr>`;
    };
    return `<section class="card"><div class="card-h"><div><h2>Oefeningen</h2><p class="sub">Eén keer invullen, voor alle klanten. Type "Conditie" logt afstand, tijd, kcal of watt in plaats van kg × reps. Secundaire spiergroepen maken het volume per spiergroep zichtbaar. Het bewegingspatroon (squat, hinge, duwen, trekken...) wordt herkend uit naam en categorie; pas het aan waar nodig.</p></div>
      <button class="btn primary" data-act="ex-new"${S.canWrite && !S.exNew ? '' : ' disabled'}>+ Oefening</button></div>
      <div class="tablewrap"><table><thead><tr><th>Naam</th><th>Type</th><th>Categorie</th><th>Secundair</th><th>Patroon</th><th>Eenheid</th><th>Notitie</th>${S.cid ? `<th class="num">Gelogd bij ${esc(client()?.name.split(' ')[0])}</th>` : ''}<th></th></tr></thead><tbody>
      ${S.exNew ? form(S.exNew, true) : ''}
      ${list.map((e) => S.exEdit && S.exEdit.id === e.id ? form(S.exEdit, false) : `<tr><td><b style="font-weight:600">${esc(e.name)}</b>${(S.config.anchors || []).includes(e.id) ? ' <span class="pill acc">anker</span>' : ''}</td><td class="small">${exType(e) === 'kracht' ? 'Kracht' : 'Conditie'}</td><td>${esc(e.category)}</td><td class="small">${esc((e.secondary || []).join(', '))}</td><td class="small">${esc(PAT_LABEL[patOf(e.id)] || '')}${e.pattern ? '' : ' <span class="muted">(auto)</span>'}</td><td class="small">${esc((UNITS.find((u) => u[0] === e.unit) || [, e.unit])[1])}</td><td class="small muted">${esc(e.note || '')}</td>${S.cid ? `<td class="num">${used(e.id) || ''}</td>` : ''}<td><button class="btn ghost small" data-act="ex-edit" data-id="${esc(e.id)}"${S.canWrite ? '' : ' disabled'}>Bewerken</button></td></tr>`).join('')}
      </tbody></table></div></section>`;
  }

