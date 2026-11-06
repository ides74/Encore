  // ---------- gymmodus: één oefening per scherm (gsm) ----------
  // Grote cijfers met ± knoppen, RPE als knoppen, één hoofdknop "Set klaar". Vegen of ‹ › = vorige of volgende oefening.
  // Planning, tempo en TUT staan achter "Details". Zelfde regels als de lijst: grijs = voorstel, zwart = bevestigd.
  const RPE_CHIPS = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];
  const bigStep = (ei, si, f, lab, val, phv, stp, dg) => `<div class="bigstep"><span class="lab">${esc(lab)}</span><div class="ctl">${stp ? stepBtn(ei, si, f, -stp, lab) : ''}<input id="s-${ei}-${si}-${f}" inputmode="decimal" data-bind="set" data-ei="${ei}" data-si="${si}" data-f="${f}" value="${esc(val ?? '')}" placeholder="${esc(phv != null && phv !== '' ? nl(phv, dg) : '')}" aria-label="${esc(lab)}">${stp ? stepBtn(ei, si, f, stp, lab) : ''}</div></div>`;
  // korte weergave van een set in de lijst onder de huidige set: bevestigde waarde, anders "plan …"
  function setShort(exId, x, sg) {
    const has = setDone(x), src = has ? x : sg || {}, u = unitOf(exId);
    let w;
    if (u === 'blok') w = num(src.blocks) != null ? `blok ${nl(src.blocks)}${num(src.extra) ? ' + ' + nl(src.extra) : ''}` : '?';
    else if (u === 'bw') w = num(src.kg) ? bwFmt(num(src.kg), src.mode || 'auto') : 'LG';
    else if (STRENGTH.includes(u)) w = num(src.kg) != null ? nl(src.kg) + ' kg' : '?';
    else w = num(src.value) != null ? `${nl(src.value)} ${u}` : '?';
    return `${has ? '' : 'plan '}${w}${num(src.reps) != null ? ' × ' + nl(src.reps, 0) : ''}${has && num(x.rpe) != null ? ' @ RPE ' + nl(x.rpe) : ''}`;
  }
  function viewGym(d, b) {
    const c = client(), n = d.entries.length; S.gymIdx = Math.max(0, Math.min(S.gymIdx || 0, n)); const i = S.gymIdx;
    // voortgang: één bolletje per oefening (vol = alle sets bevestigd); navigeren gaat met ‹ › of vegen
    const dots = d.entries.map((en, k) => `<span data-rk="${reeksOf(en.target?.code) || 'X'}" class="${entryDone(en) ? 'full' : ''}"${k === i ? ' aria-current="true"' : ''}></span>`).join('') + `<span class="fin"${i === n ? ' aria-current="true"' : ''}></span>`;
    return `<section class="gym" id="gym">
      <div class="gym-top"><div class="small"><b>${esc(slotLabel(d.day))}</b> <span class="muted">· ${esc(c.name)} · ${esc(b?.code || '')} week ${esc(d.week)}</span></div><button class="btn small" data-act="gym-toggle">Lijst</button></div>
      <div class="gym-nav"><button class="btn navb" data-act="gym-go" data-i="${i - 1}"${i === 0 ? ' disabled' : ''} aria-label="Vorige oefening">‹</button><div class="gym-dots" role="img" aria-label="Oefening ${Math.min(i + 1, n)} van ${n}${i === n ? ', afronden' : ''}">${dots}</div><button class="btn navb" data-act="gym-go" data-i="${i + 1}"${i >= n ? ' disabled' : ''} aria-label="Volgende oefening">›</button></div>
      ${i < n ? gymEntry(d, i) : gymFinish(d)}
    </section>${stickyHTML(d, true)}`;
  }
  function gymEntry(d, ei) {
    const en = d.entries[ei], I = entryInfo(en, d.date), { ex, unit, tg, strength, rk } = I, n = d.entries.length;
    const sel = S.gymSet != null && en.sets[S.gymSet] ? S.gymSet : en.sets.findIndex((x) => !setDone(x));
    const sub = [REEKS_LABEL[rk], tg.sets && `${tg.sets} sets`, (tg.repsMin || tg.repsMax) && `${tg.repsMin ?? ''}${tg.repsMax && tg.repsMax !== tg.repsMin ? '-' + tg.repsMax : ''} reps`, tg.rest && `${restTxt(tg.rest)} rust`].filter(Boolean).join(' · ');
    const title = `<div class="gym-title" data-rk="${rk || 'X'}"><span class="code">${esc(tg.code || '+')}</span><div style="min-width:0"><div class="nm">${esc(ex.name || 'Oefening')}${en.variant ? ` <span class="muted small">(${esc(en.variant)})</span>` : ''}</div><div class="small muted">${esc(sub)}</div></div></div>`;
    let cur;
    if (sel < 0) cur = `<div class="gym-cur gym-done" data-rk="${rk || 'X'}"><div class="gym-donemsg">✓ Alle ${en.sets.length} sets gedaan</div>${exfbHTML(en, ei)}<button class="btn primary gym-ok" data-act="gym-go" data-i="${ei + 1}">${ei + 1 < n ? 'Volgende oefening ›' : 'Afronden ›'}</button></div>`;
    else {
      const st = en.sets[sel], sg = setSuggest(en, sel) || {}, pv = I.prev?.sets?.[sel], pl = I.plan[sel];
      const kgLab = unit === 'kg per hand' ? 'Kg per hand' : unit === 'bw' ? 'Extra kg' : 'Kg';
      const fields = unit === 'blok' ? [['blocks', 'Blok', 1, 0], ['extra', '+ kg', 1, 1]] : strength ? [['kg', kgLab, 1, 1]] : [['value', (UNITS.find((u) => u[0] === unit) || [, unit])[1], 0, 1]];
      fields.push(['reps', 'Reps', 1, 0]);
      const tot = unit === 'bw' ? setKg(st, en.exId) : null, rpe = num(st.rpe), tRpe = tg.rir != null && tg.rir !== '' ? rirToRpe(tg.rir) : null;
      const planLine = [pl && (num(pl.kg) != null || num(pl.reps) != null) && `Plan ${kgPlanTxt(unit, num(pl.kg))} × ${nl(pl.reps, 0) || '?'}`, pv && `vorige ${setLabel(en.exId, pv)} × ${nl(pv.reps, 0) || '?'}`].filter(Boolean).join(' · ');
      cur = `<div class="gym-cur" data-rk="${rk || 'X'}"><div class="row" style="justify-content:space-between"><span class="lab">Set ${sel + 1} van ${en.sets.length}</span><span class="small muted">${esc(planLine)}</span></div>
        <div class="gym-big">${fields.map(([f, l, stp, dg]) => bigStep(ei, sel, f, l, st[f], sg[f], stp, dg)).join('')}${!strength ? `<div class="bigstep"><span class="lab">Tijd</span><div class="ctl"><input id="s-${ei}-${sel}-time" data-bind="set" data-ei="${ei}" data-si="${sel}" data-f="time" value="${esc(st.time ?? '')}" placeholder="${esc(sg.time || 'mm:ss')}" aria-label="Tijd"></div></div>` : ''}</div>
        ${unit === 'bw' ? `<div class="small muted" style="text-align:center">Totaal <span id="tot-${ei}-${sel}">${tot != null && setDone(st) ? nl(tot) + ' kg' : 'LG'}</span> · lichaamsgewicht ${esc(nl(bwNow()))} kg</div>` : ''}
        <div class="rpe-row"><span class="lab">RPE${tRpe != null ? ' · plan ' + esc(nl(tRpe)) : ''}</span><div class="chips">${RPE_CHIPS.map((v) => `<button type="button" class="chipbtn" data-act="rpe-set" data-ei="${ei}" data-si="${sel}" data-v="${v}" aria-pressed="${rpe === v}">${nl(v)}</button>`).join('')}</div></div>
        <button class="btn primary gym-ok" data-act="confirm-set" data-ei="${ei}" data-si="${sel}">${S.gymSet === sel && setDone(st) ? '✓ Bewaren' : `✓ Set ${sel + 1} klaar`}</button>
        ${setDone(st) ? `<button class="btn ghost small" data-act="set-clear" data-ei="${ei}" data-si="${sel}">Set leegmaken</button>` : ''}</div>`;
    }
    const list = `<div class="gym-sets">${en.sets.map((x, k) => `<div class="gs${k === sel ? ' cur' : ''}${setDone(x) ? ' done' : ''}"><button type="button" class="gs-main" data-act="gym-set" data-si="${k}"><span class="muted">Set ${k + 1}</span> <b>${esc(setShort(en.exId, x, setSuggest(en, k)))}</b></button>${setDone(x) ? '<span class="setok" title="Bevestigd">✓</span>' : `<button type="button" class="btn small setconfirm" data-act="confirm-set" data-ei="${ei}" data-si="${k}" aria-label="Set ${k + 1} bevestigen zoals voorgesteld">✓</button>`}</div>`).join('')}
      <div class="row" style="gap:6px"><button class="btn ghost small" data-act="add-set" data-ei="${ei}">+ set</button>${en.sets.length > 1 ? `<button class="btn ghost small" data-act="del-set" data-ei="${ei}" data-si="${sel < 0 ? en.sets.length - 1 : sel}">− set</button>` : ''}</div></div>`;
    const tut = tutPill(tg);
    const det = `<details class="gym-det"><summary>Details</summary><div class="gym-det-b">
      ${I.tgt ? `<div class="target">Schema: ${esc(I.tgt)}${tg.note ? ' · ' + esc(tg.note) : ''}</div>` : ''}${tut ? `<div>${tut}</div>` : ''}
      ${planLineHTML(I, ei)}${prevLineHTML(I, ei)}
      ${unit === 'bw' ? bwModeHTML(en, ei) : ''}
      <div class="row" style="gap:6px"><input style="flex:1;min-width:10rem" id="var-${ei}" data-bind="entry" data-ei="${ei}" data-f="variant" value="${esc(en.variant)}" placeholder="variant: grip, hoek…" aria-label="Variant"><button class="btn ghost small" data-act="del-entry" data-ei="${ei}">Oefening verwijderen</button></div></div></details>`;
    return `<div class="gym-page${S.gymAnim ? ' ' + S.gymAnim : ''}">${title}${strength ? wuRowHTML(en, ei) : ''}${tg.filler ? `<div class="small">Filler tijdens de rust: <b>${esc(tg.filler)}</b></div>` : ''}${cur}${list}${sel >= 0 ? exfbHTML(en, ei) : ''}${det}</div>`;
  }
  function gymFinish(d) {
    const all = d.entries.reduce((a, en) => a + en.sets.length, 0), done = d.entries.reduce((a, en) => a + en.sets.filter(setDone).length, 0);
    const open = d.entries.map((en, k) => (en.exId && !entryDone(en) ? `<button class="btn small" data-act="gym-go" data-i="${k}">${esc(en.target?.code || '+')} ${esc(exName(en.exId))}: ${en.sets.filter(setDone).length}/${en.sets.length}</button>` : '')).join('');
    return `<div class="gym-page${S.gymAnim ? ' ' + S.gymAnim : ''}"><div class="gym-title" data-rk="X"><span class="code">✓</span><div><div class="nm">Afronden</div><div class="small muted">${done} van ${all} sets bevestigd</div></div></div>
      ${open ? `<div class="notice">Nog open: <div class="row" style="gap:6px;margin-top:6px">${open}</div></div>` : ''}
      ${fbHTML(d)}${addExHTML()}
      <details class="gym-det"><summary>Datum, blok en week</summary><div class="gym-det-b">${metaFormHTML(d)}</div></details>
      <div class="row">${delRepHTML(d)}</div>
      <p class="small muted">Tik op Klaar: je krijgt de samenvatting en kan ze meteen naar ${esc(client().coach || 'de coach')} en de klant sturen.</p></div>`;
  }
  function gymGo(i) {
    const n = S.draft?.entries.length ?? 0; if (i < 0 || i > n || i === S.gymIdx) return;
    S.gymAnim = i > S.gymIdx ? 'in-r' : 'in-l'; S.gymIdx = i; S.gymSet = null; renderMain(); S.gymAnim = ''; window.scrollTo({ top: 0 });
  }
