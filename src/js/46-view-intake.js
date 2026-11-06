  // ---------- view: intake ----------
  const intakeRow = (exId, x = {}) => ({ exId, kg: x.kg ?? '', reps: x.reps ?? '', rir: x.rir ?? '', mode: x.kg != null ? 'extra' : 'auto' });
  function startIntake() {
    const c = client(), it = c.intake || {}, tests = it.tests || {};
    const ids = [...new Set([...clientAnchors(c), ...(it.order || Object.keys(tests))])].filter((id) => S.exercises[id] && !(c.anchorsNA || []).includes(id));
    S.intakeDraft = { date: it.date || todayStr(), note: it.note || '', rows: ids.map((id) => intakeRow(id, tests[id])) };
  }
  const intakeCalc = (r) => { const kg = setKg({ kg: r.kg, reps: r.reps, mode: r.mode || 'auto' }, r.exId), reps = num(r.reps); if (kg == null || !reps) return null; const p = pctTable(reps + (num(r.rir) || 0)); return p ? Math.round((kg / p) * 10) / 10 : null; };
  function viewIntake() {
    const c = client();
    if (!S.intakeDraft) startIntake();
    const d = S.intakeDraft, anchors = clientAnchors(c);
    const rows = d.rows.map((r, i) => {
      const unit = unitOf(r.exId), rm = intakeCalc(r), isA = anchors.includes(r.exId);
      const kgHead = unit === 'bw' ? `<select id="it-${i}-mode" data-bind="intake" data-i="${i}" data-f="mode" style="margin-top:4px" aria-label="Ingevuld gewicht">${BW_MODES.map(([v, l]) => `<option value="${v}"${v === (r.mode || 'auto') ? ' selected' : ''}>${l}</option>`).join('')}</select> <span class="muted">LG ${esc(nl(bwNow()) || '?')} kg</span>` : unit === 'blok' ? 'kg totaal' : unit === 'kg per hand' ? 'kg/hand' : 'kg';
      return `<tr><td><b style="font-weight:600">${esc(exName(r.exId))}</b>${isA ? ' <span class="pill acc" style="margin-left:4px">anker</span>' : ''}<div class="small muted">${kgHead}</div></td>
        <td class="num"><input class="n" inputmode="decimal" id="it-${i}-kg" data-bind="intake" data-i="${i}" data-f="kg" value="${esc(r.kg)}" aria-label="kg"></td>
        <td class="num"><input class="xs" inputmode="numeric" id="it-${i}-reps" data-bind="intake" data-i="${i}" data-f="reps" value="${esc(r.reps)}" aria-label="reps"></td>
        <td class="num"><input class="xs" inputmode="numeric" id="it-${i}-rir" data-bind="intake" data-i="${i}" data-f="rir" value="${esc(r.rir)}" placeholder="0" aria-label="RIR"></td>
        <td class="num" id="it-${i}-pct">${num(r.reps) ? nl((pctTable(num(r.reps) + (num(r.rir) || 0)) || 0) * 100, 0) + '%' : ''}</td>
        <td class="num" id="it-${i}-rm"><b>${rm != null ? nl(rm) + ' kg' : ''}</b></td>
        <td>${isA ? '' : `<button class="btn ghost small" data-act="it-del" data-i="${i}" aria-label="Verwijderen">×</button>`}</td></tr>`;
    }).join('');
    const strength = Object.values(S.exercises).filter((e) => STRENGTH.includes(e.unit) && !d.rows.some((r) => r.exId === e.id)).sort((a, b) => a.name.localeCompare(b.name));
    return `<section class="card"><div class="card-h"><div><h2>Eerste training (intake)</h2><p class="sub">Eenmalige rep-max test bij de start. Per oefening: gewicht × reps (en RIR als de set niet tot falen ging). De app rekent het 1RM uit via de %-tabel. Dat 1RM is de basis voor de voorgestelde gewichten in elk schema.</p></div>
        ${c.intake?.date ? `<span class="pill ok">Opgeslagen op ${esc(fmtDate(c.intake.date))}</span>` : '<span class="pill warn">Nog niet gedaan</span>'}</div>
        <div class="form" style="margin-bottom:12px"><label class="field"><span>Datum test</span><input type="date" id="it-date" data-bind="intake-meta" data-f="date" value="${esc(d.date)}"></label>
        <label class="field wide"><span>Notitie</span><input id="it-note" data-bind="intake-meta" data-f="note" value="${esc(d.note)}" placeholder="Opwarming, grip, bijzonderheden"></label></div>
        <div class="tablewrap"><table><thead><tr><th>Oefening</th><th class="num">Gewicht</th><th class="num">Reps</th><th class="num">RIR</th><th class="num">% 1RM</th><th class="num">1RM</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="row" style="margin-top:10px"><select id="it-add" aria-label="Oefening toevoegen"><option value="">Extra oefening testen…</option>${strength.map((e) => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('')}</select><button class="btn" data-act="it-add">+ Toevoegen</button></div></section>
      <details class="card"><summary>%-tabel 1RM</summary><div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Reps (+ RIR)</th>${PCT.map((_, i) => `<th class="num">${i + 1}</th>`).join('')}</tr></thead><tbody><tr><td>% van 1RM</td>${PCT.map((v) => `<td class="num">${v}</td>`).join('')}</tr></tbody></table></div><p class="small muted">Voorbeeld: 8 reps met 2 in reserve telt als 10 reps = 74%. Boven 20 reps rekent de app met Epley.</p></details>
      <div class="sticky-actions"><button class="btn" data-act="it-reset">Annuleren</button><button class="btn primary" data-act="it-save"${S.canWrite ? '' : ' disabled'}>Intake opslaan</button></div>`;
  }

