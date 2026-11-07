  // ---------- samenvatting bij "Klaar" ----------
  // Plan tegenover gedaan, nieuwe records en wat te moeilijk was. Eén Gmail-concept naar klant, coach of beide.
  // "Te moeilijk" = wat de klant noteerde, een score van 5 of lager, minder reps dan gepland of een RPE duidelijk boven het plan.
  function summaryModel(d) {
    const c = client(), b = S.blocks[d.blockId], first = String(c.name || '').trim().split(' ')[0];
    let setsPlan = 0, setsDone = 0; const rows = [], recs = [], hard = [];
    d.entries.forEach((en) => {
      if (!en.exId) return;
      const tg = en.target || {}, name = exName(en.exId), code = tg.code || '', rk = reeksOf(code), str = isStrength(en.exId), bw = unitOf(en.exId) === 'bw';
      const st = (en.sets || []).filter(setDone), planN = num(tg.sets) || 0;
      const rMin = num(tg.repsMin), rMax = num(tg.repsMax) ?? rMin, tRpe = tg.rir != null && tg.rir !== '' ? rirToRpe(tg.rir) : null;
      const planKgs = (tg.setPlan || []).map((p) => num(p.kg)).filter((v) => v != null), topPlan = planKgs.length ? Math.max(...planKgs) : null;
      const blok = unitOf(en.exId) === 'blok' && topPlan != null ? splitBlocks(topPlan) : null;
      const kgPart = topPlan != null || bw ? ' · ' + (bw ? kgPlanTxt('bw', topPlan) : blok ? setLabel(en.exId, blok) : kgTxt(en.exId, topPlan)) : '';
      const plan = !planN ? '' : rk === 'F' || !str ? `${planN} ${rk === 'F' ? (planN === 1 ? 'ronde' : 'rondes') : 'sets'}` : `${planN} × ${rMin != null && rMax != null && rMin !== rMax ? rMin + '-' + rMax : rMax ?? '?'}${tRpe != null ? ' @ RPE ' + nl(tRpe) : ''}${kgPart}`;
      setsPlan += planN || st.length; setsDone += st.length;
      if (!st.length) { rows.push({ code, rk, name, plan, did: 'niet gedaan', status: ['Niet gedaan', 'bad'], score: null }); return; }
      const under = rMin != null && st.some((x) => num(x.reps) != null && num(x.reps) < rMin);
      const over = rMax != null && st.some((x) => num(x.reps) > rMax);
      const maxRpe = Math.max(0, ...st.map((x) => num(x.rpe) || 0)), heavy = tRpe != null && maxRpe >= Math.max(9.5, tRpe + 1.5);
      let status = ['Volgens plan', 'ok'];
      if (planN && st.length < planN) status = [`${st.length} van ${planN} sets`, 'warn'];
      else if (under) status = ['Onder het repbereik', 'warn'];
      else if (over) status = ['Boven bereik: zwaarder', 'ok'];
      else if (heavy) status = ['Zwaarder dan gepland', 'warn'];
      if (str) {
        const best = Math.max(0, ...st.map((x) => e1p(x, en.exId) || 0)), prior = history(en.exId, d.date).filter((p) => p.bestP != null).map((p) => p.bestP);
        const pb = prior.length ? Math.max(...prior) : null;
        if (pb != null && best > pb * 1.005) { recs.push({ name, best, pb }); if (status[0] === 'Volgens plan') status = ['Record', 'ok']; }
      }
      const why = [String(en.hard || '').trim(), num(en.score) != null && num(en.score) <= 5 && `score ${nl(en.score, 0)}/10`, under && `minder dan ${rMin} reps`, heavy && `RPE ${nl(maxRpe)} (plan ${nl(tRpe)})`].filter(Boolean);
      if (why.length) hard.push({ name, why: why.join(', ') });
      rows.push({ code, rk, name, plan, did: doneTxt(en.exId, st), status, score: num(en.score) });
    });
    const fb = d.feedback || {}, fbTxt = [num(fb.energy) != null && 'energie ' + nl(fb.energy, 0) + ' op 5', num(fb.bodyweight) != null && 'lichaamsgewicht ' + nl(fb.bodyweight) + ' kg', num(fb.pain) != null && ATT.toLowerCase() + ' ' + nl(fb.pain, 0) + ' op 10', fb.note].filter(Boolean).join(' · ');
    const extras = { warm: d.genWarm?.done ? d.genWarm.txt : '', fins: (d.fins || []).filter((f) => f.name || f.result).map((f) => `${f.name}${f.result ? ': ' + f.result : ''}`) };
    return { extras, praise: praiseFor(d), sid: d.id, client: c.name, first, coach: c.coach || '', title: slotLabel(d.day), dateTxt: fmtDate(d.date), dateShort: fmtDate(d.date, false), block: b ? `${b.code} ${phaseOf(b.phase)} · week ${d.week}` : '', setsPlan, setsDone, rows, recs, hard, fbTxt };
  }
  const summaryText = (m) => [
    ...(praiseText(m.praise) ? [praiseText(m.praise), ''] : []),
    `${m.title} · ${m.client} · ${m.dateTxt}${m.block ? ' · ' + m.block : ''}`,
    `Sets gedaan: ${m.setsDone} van ${m.setsPlan} gepland`, '',
    ...(m.extras?.warm ? ['OPWARMING', m.extras.warm, ''] : []),
    'PLAN TEGENOVER GEDAAN', ...m.rows.map((r) => `- ${r.code ? r.code + ' ' : ''}${r.name}: ${r.did}${r.plan ? ' (plan ' + r.plan + ')' : ''} · ${r.status[0]}${r.score != null ? ' · score ' + r.score + '/10' : ''}`), '',
    ...(m.extras?.fins?.length ? ['FINISHER', ...m.extras.fins.map((x) => '- ' + x), ''] : []),
    'NIEUWE RECORDS', ...(m.recs.length ? m.recs.map((r) => `- ${r.name}: e1RM ${nl(r.best)} kg (was ${nl(r.pb)} kg)`) : ['- geen']), '',
    'TE MOEILIJK', ...(m.hard.length ? m.hard.map((h) => `- ${h.name}: ${h.why}`) : ['- niets gemeld']),
    ...(m.fbTxt ? ['', 'FEEDBACK', m.fbTxt] : []),
  ].join('\n');
  function summaryMail(m, toClient, toCoach) {
    const coach = m.coach || 'coach', hi = toClient && toCoach ? `Hoi ${m.first} en ${coach}` : toClient ? `Hoi ${m.first}` : `Hoi ${coach}`;
    const intro = toClient ? `Hierbij de samenvatting van je training van ${m.dateShort}. Het volledige rapport zit als PDF in bijlage.` : `Hierbij de samenvatting van de training van ${m.client} op ${m.dateShort}.`;
    const txt = summaryText({ ...m, praise: null });
    const pr = m.praise && m.praise.lines.length ? m.praise : null;
    return { subject: `${pr && toClient ? pr.title + ' · ' : ''}Training ${m.dateShort} · ${m.client} · EnCORE Coaching`, text: `${hi},\n\n${intro}\n\n${txt}\n\nSportieve groet,\nEnCORE Coaching\n\n--\n${DISC_COM}\n\n${DISC_LEGAL}`, html: `<p>${esc(hi)},</p>${pr ? `<p><b>${esc(pr.title)}</b></p><ul>${pr.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><p>${esc(pr.close)}</p>` : ''}<p>${esc(intro)}</p><pre style="font-family:inherit;white-space:pre-wrap">${esc(txt)}</pre><p>Sportieve groet,<br>EnCORE Coaching</p><p style="font-size:11px;color:#777">${esc(DISC_COM)}<br><br>${esc(DISC_LEGAL)}</p>` };
  }
  const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function openSummary(m) { const c = client(); S.summary = { m, toClient: !!c?.email, toCoach: !!(S.config.coachEmails || {})[c?.coach || ''], clientMail: c?.email || '', coachMail: (S.config.coachEmails || {})[c?.coach || ''] || '', busy: false }; renderSummary(); }
  function renderSummary() {
    let el = $('#sum-modal'); if (!el) { el = document.createElement('div'); el.id = 'sum-modal'; document.body.appendChild(el); }
    const s = S.summary; if (!s) { el.innerHTML = ''; return; }
    const m = s.m, kpi = (l, v, dd) => `<div class="kpi"><span class="l">${l}</span><span class="v">${v}</span><span class="d">${dd}</span></div>`;
    el.innerHTML = `<div class="confirm" role="dialog" aria-modal="true" aria-labelledby="sum-h"><div class="card sum">
      <h3 id="sum-h">Samenvatting · ${esc(m.title)}</h3><p class="sub">${esc(m.client)} · ${esc(m.dateTxt)}${m.block ? ' · ' + esc(m.block) : ''}</p><p class="hint" style="margin:8px 0 0">✓ Opgeslagen in de historiek van ${esc(m.client)}</p>${praiseHTML(m.praise)}
      <div class="sum-kpis">${kpi('Sets', `${m.setsDone}<small>/ ${m.setsPlan}</small>`, 'gedaan tegenover plan')}${kpi('Records', (m.praise?.recs || []).length, 'zwaarste gewicht per aantal reps')}${kpi('Te moeilijk', m.hard.length, 'oefeningen met signaal')}</div>
      ${m.extras?.warm ? `<p class="small" style="margin:10px 0 0">Opwarming: <b>${esc(m.extras.warm)}</b></p>` : ''}
      <h4>Plan tegenover gedaan</h4><div class="sum-rows">${m.rows.map((r) => `<div class="sr" data-rk="${r.rk || 'X'}"><div class="sr-h"><b class="rkc">${esc(r.code)}</b> <b>${esc(r.name)}</b>${r.score != null ? ` <span class="small muted">${r.score}/10</span>` : ''}<span class="pill ${r.status[1]}">${esc(r.status[0])}</span></div><div class="small">Gedaan: <b>${esc(r.did)}</b></div><div class="small muted">Plan: ${esc(r.plan || 'vrij')}</div></div>`).join('')}</div>
      ${m.extras?.fins?.length ? `<h4>Finisher</h4><ul class="sum-l">${m.extras.fins.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${m.recs.length ? `<h4>Nieuwe records</h4><ul class="sum-l">${m.recs.map((r) => `<li><b>${esc(r.name)}</b>: e1RM ${nl(r.best)} kg <span class="muted">(was ${nl(r.pb)} kg)</span></li>`).join('')}</ul>` : ''}
      <h4>Te moeilijk</h4>${m.hard.length ? `<ul class="sum-l">${m.hard.map((h) => `<li><b>${esc(h.name)}</b>: ${esc(h.why)}</li>`).join('')}</ul>` : '<p class="small muted" style="margin:0">Niets gemeld.</p>'}
      ${m.fbTxt ? `<p class="small" style="margin:8px 0 0">Feedback: ${esc(m.fbTxt)}</p>` : ''}
      <h4>Versturen</h4>
      <div class="sendto"><label><input type="checkbox" data-bind="sum" data-f="toClient"${s.toClient ? ' checked' : ''}> Klant</label><input type="email" data-bind="sum" data-f="clientMail" value="${esc(s.clientMail)}" placeholder="klant@voorbeeld.be" aria-label="E-mail klant"></div>
      <div class="sendto"><label><input type="checkbox" data-bind="sum" data-f="toCoach"${s.toCoach ? ' checked' : ''}> Coach${m.coach ? ' ' + esc(m.coach) : ''}</label><input type="email" data-bind="sum" data-f="coachMail" value="${esc(s.coachMail)}" placeholder="coach@encore.be" aria-label="E-mail coach"></div>
      <p class="small muted" id="sum-status" role="status" style="margin:8px 0 0">Verstuur nu: de mail met samenvatting (en voor de klant het PDF-rapport) vertrekt meteen via Gmail.</p>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn" data-act="sum-close">Sluiten</button><button class="btn" data-act="sum-copy">Kopieer tekst</button><button class="btn" data-act="sum-report">Alleen PDF-rapport</button><button class="btn" data-act="sum-gmail">Concept in Gmail</button><button class="btn primary" data-act="sum-send">Verstuur nu</button></div></div></div>`;
  }
  const sumStatus = (h) => { const el = $('#sum-status'); if (el) el.innerHTML = h; };
  const sumBusy = (on) => { if (S.summary) S.summary.busy = on; document.querySelectorAll('#sum-modal [data-act^="sum-"]').forEach((x) => { if (x.dataset.act !== 'sum-close') x.disabled = on; }); };
  async function summaryGmail(send) {
    const s = S.summary; if (!s || s.busy) return; const m = s.m, c = client(), to = [];
    const cm = String(s.clientMail || '').trim(), co = String(s.coachMail || '').trim();
    if (s.toClient) { if (!MAIL_RE.test(cm)) { sumStatus('<span class="sig-bad">Vul een geldig e-mailadres voor de klant in.</span>'); return; } to.push(cm); }
    if (s.toCoach) { if (!MAIL_RE.test(co)) { sumStatus('<span class="sig-bad">Vul een geldig e-mailadres voor de coach in.</span>'); return; } to.push(co); }
    if (!to.length) { sumStatus('<span class="sig-bad">Kies klant, coach of beide.</span>'); return; }
    sumBusy(true); sumStatus(send ? 'Mail wordt klaargemaakt…' : 'Concept wordt gemaakt…');
    try {
      if (S.canWrite && s.toClient && cm !== (c.email || '')) await write(`clients/${S.cid}`, { email: cm }, true);
      if (S.canWrite && s.toCoach && c.coach && co !== (S.config.coachEmails || {})[c.coach]) { const ce = { ...(S.config.coachEmails || {}), [c.coach]: co }; if (await write('config/app', { coachEmails: ce }, true)) S.config.coachEmails = ce; }
      const mail = summaryMail(m, s.toClient, s.toCoach), args = { to, subject: mail.subject, body: mail.text, htmlBody: mail.html };
      if (s.toClient) { sumStatus('PDF-rapport wordt gemaakt…'); const J = await loadPdf(), rm = reportModel(m.sid, ''), doc = drawReport(J, rm); args.attachments = [{ content: doc.output('datauristring').split(',')[1], filename: reportFile(rm), mimeType: 'application/pdf' }]; }
      const mcp = await useCap('mcp');
      if (!mcp) { sumStatus('Gmail is niet bereikbaar in deze weergave. Gebruik "Kopieer tekst".'); sumBusy(false); return; }
      sumStatus(send ? 'Mail wordt verstuurd…' : 'Concept wordt aangemaakt in Gmail…');
      const res = await mcp.callTool('Gmail', send ? 'send_message' : 'create_draft', args), url = res?.payload?.viewUrl || res?.structuredContent?.viewUrl || '';
      if (S.canWrite) await write(`clients/${S.cid}/sessions/${m.sid}`, { report: { at: new Date().toISOString(), to: to.join(', '), type: send ? 'gmail-sent' : 'gmail-concept' } }, true);
      sumStatus(send ? `<span class="sig-up">✓ Verstuurd naar ${esc(to.join(', '))}.</span>` : `<span class="sig-up">Concept staat klaar in Gmail.</span> ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Open het concept</a>, kijk het na en verstuur.` : 'Open Gmail, kijk het concept na en verstuur.'}`);
    } catch (e) { sumStatus(`<span class="sig-bad">${esc(gmailErr(e))}</span>`); }
    sumBusy(false);
  }
  async function summaryCopy() {
    const txt = summaryText(S.summary.m);
    try { await navigator.clipboard.writeText(txt); sumStatus('Tekst gekopieerd.'); return; } catch {}
    try { const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); sumStatus(ok ? 'Tekst gekopieerd.' : 'Kopiëren lukte niet hier.'); } catch { sumStatus('Kopiëren lukte niet hier.'); }
  }
