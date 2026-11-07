  // ---------- sessierapport (PDF + e-mail) ----------
  const sessOf = (sid) => (S.draft && S.draft.id === sid ? { id: sid, ...trainingBody(S.draft) } : S.sessions[sid]);
  function nextFor(s) {
    const b = S.blocks[s.blockId]; if (!b) return null;
    const slots = slotsOf(b), i = slots.indexOf(sessSlot(s));
    const wk = num(s.week) || 1;
    if (i >= 0 && i < slots.length - 1) return { b, slot: slots[i + 1], week: wk };
    const nb = sortedBlocks().find((x) => x.start > b.start && (x.exercises || []).length);
    if (wk >= blockWeeks(b) && nb) return { b: nb, slot: slotsOf(nb)[0], week: 1 };
    return { b, slot: slots[0], week: Math.min(wk + 1, blockWeeks(b)) };
  }
  const kgTxt = (exId, kg) => (kg == null || kg === '' ? '' : unitOf(exId) === 'bw' ? bwFmt(num(kg)) : unitOf(exId) === 'kg per hand' ? `2 × ${nl(kg)} kg` : unitOf(exId) === 'blok' ? blokTxt(splitBlocks(kg)) : `${nl(kg)} kg`);
  const doneTxt = (exId, sets) => {
    if (!isStrength(exId)) return sets.map((x) => setLabel(exId, x)).join(', ');
    const g = []; sets.forEach((x) => { const lab = setLabel(exId, x), l = g[g.length - 1]; if (l && l.lab === lab) l.xs.push(x); else g.push({ lab, xs: [x] }); });
    return g.map((q) => `${q.lab} × ${q.xs.map((x) => (nl(x.reps, 0) || '?') + effTxt(x)).join(', ')}`).join(' | ');
  };
  const schemeTxt = (r) => { const rk = reeksOf(r.code); if (rk === 'F' || !isStrength(r.exId)) return `${nl(r.sets) || '?'} ${rk === 'F' ? 'rondes' : 'sets'}`; const a = num(r.repsMin), z = num(r.repsMax); return `${nl(r.sets) || '?'} × ${a != null && z != null && a !== z ? a + '-' + z : z ?? a ?? '?'}${num(r.rir) != null ? ' @ RIR ' + nl(r.rir, 0) : ''}`; };
  function reportModel(sid, note) {
    const s = sessOf(sid), c = client(), b = S.blocks[s.blockId], phase = phaseOf(b?.phase), first = String(c.name || '').trim().split(' ')[0];
    let sets = 0, ton = 0, rec = 0, up = 0; const vol = {};
    const rows = (s.entries || []).map((en) => {
      const tg = en.target || {}, st = (en.sets || []).filter((x) => num(x.reps) != null || num(x.value) != null || x.ok === true), str = isStrength(en.exId);
      sets += st.length; addVol(vol, en.exId, st.length);
      let sig = ['Gedaan', 'muted'];
      if (str) {
        st.forEach((x) => { const kg = setKg(x, en.exId), r = num(x.reps); if (kg && r) ton += kg * r * (unitOf(en.exId) === 'kg per hand' ? 2 : 1); });
        const best = Math.max(0, ...st.map((x) => e1p(x, en.exId) || 0)), prior = history(en.exId, s.date).filter((p) => p.bestP != null).map((p) => p.bestP), pb = prior.length ? Math.max(...prior) : null, rm = num(tg.repsMax);
        const isRec = pb != null && best > pb * 1.005; if (isRec) rec++;
        if (rm && st.some((x) => num(x.reps) > rm)) { sig = ['Volgende keer zwaarder', 'ok']; up++; }
        else if (isRec) sig = ['Record', 'ok'];
        else if (num(tg.rir) >= 1 && st.some((x) => num(x.rir) != null && num(x.rir) < 1)) sig = ['Zwaar: gewicht houden', 'warn'];
        else sig = ['Op schema', 'muted'];
      }
      const sub = [wuTxt(en.warmup) && 'Opwarming ' + wuTxt(en.warmup), tg.filler && 'Filler ' + tg.filler, en.variant && 'Variant ' + en.variant].filter(Boolean).join(' · ');
      return { code: tg.code || '', rk: reeksOf(tg.code), name: exName(en.exId), did: doneTxt(en.exId, st) || 'niet gelogd', target: tg.sets ? schemeTxt({ ...tg, exId: en.exId }) : '', sig, sub };
    });
    const ids = [...new Set((s.entries || []).map((e) => e.exId).filter((id) => isStrength(id)))], anc = clientAnchors(c);
    ids.sort((a, z) => (anc.includes(a) ? 0 : 1) - (anc.includes(z) ? 0 : 1));
    const charts = [];
    ids.forEach((id) => {
      if (charts.length >= 4) return;
      const rkNow = roleOf({ rk: reeksOf((s.entries || []).find((e) => e.exId === id)?.target?.code) });
      const h = history(id).filter((p) => p.bestP != null && p.date <= s.date && roleOf(p) === rkNow), rel = h.filter((p) => p.reliable), base = rel.length >= 2 ? rel : h; if (base.length < 2) return;
      const pts = base.map((p) => ({ d: toDate(p.date).getTime(), v: p.bestP })), f = pts[0].v, l = pts[pts.length - 1].v, dl = (l - f) / f;
      charts.push({ name: exName(id), pts, unit: 'kg', delta: dl, deltaTxt: `${dl >= 0 ? '+' : '-'}${nl(Math.abs(dl * 100), 0)}%`, sub: `e1RM ${rkNow}-reeks · ${base.length} metingen · beste ${nl(Math.max(...pts.map((p) => p.v)), 0)} kg`, d0: fmtDate(base[0].date, false), d1: fmtDate(base[base.length - 1].date, false) });
    });
    let block = null;
    if (b) {
      const wks = blockWeeks(b), slots = slotsOf(b), bl = sortedBlocks(), bi = bl.findIndex((x) => x.id === b.id);
      const si0 = Math.max(0, slots.indexOf(sessSlot(s))), doneN = Math.min(slots.length * wks, (Math.min(num(s.week) || 1, wks) - 1) * slots.length + si0 + 1);
      block = { code: b.code, phase, week: Math.min(num(s.week) || 1, wks), weeks: wks, done: doneN, total: slots.length * wks, phaseTxt: PHASE_TXT[phase] || '', goal: b.goal || '', timeline: bl.slice(Math.max(0, bi - 4), bi + 2).map((x, i, arr) => ({ code: x.code, cur: x.id === b.id, future: i > arr.findIndex((y) => y.id === b.id) })) };
    }
    const nx = nextFor(s); let next = null;
    if (nx) {
      const nb = nx.b, rr = (nb.exercises || []).filter((r) => r.exId && normDay(nb, r.day) === nx.slot).sort((x, y) => codeSort(x.code, y.code));
      next = { title: `${slotLabel(nx.slot)} · week ${nx.week} · ${nb.code} ${phaseOf(nb.phase)}`, sub: nb.id === b?.id ? 'Volgende training in dit blok. Gewichten zijn het plan van je coach.' : 'Eerste training van het nieuwe blok. Gewichten zijn het plan van je coach.', rows: rr.map((r) => {
        const kgs = [...new Set(rowPlan(r).map((p) => num(p.kg)).filter((v) => v != null))];
        const upNow = (s.entries || []).some((en) => en.exId === r.exId && num(en.target?.repsMax) && (en.sets || []).some((x) => num(x.reps) > num(en.target.repsMax)));
        const sub = [wuTxt(r.warmup) && 'Opwarming ' + wuTxt(r.warmup), r.filler && 'Filler ' + r.filler, r.method && normMethod(r.method) !== DEF_METHOD && normMethod(r.method), r.variant && 'Variant ' + r.variant, r.note, upNow && 'Vandaag boven je bereik: zwaarder mag'].filter(Boolean).join(' · ');
        return { code: r.code || '', rk: reeksOf(r.code), name: exName(r.exId), scheme: schemeTxt(r), kg: kgs.map((k) => kgTxt(r.exId, k)).join(' / '), rest: restTxt(restSuggest(r.exId, r, nb.phase)?.sec || r.rest), tempo: r.tempo || '', sub };
      }) };
    }
    if (s.genWarm?.done && s.genWarm.txt) rows.unshift({ code: '', rk: 'X', name: 'Opwarming', did: s.genWarm.txt, target: '', sig: ['Gedaan', 'muted'], sub: '' });
    (s.fins || []).forEach((f) => rows.push({ code: 'F', rk: 'F', name: f.name || 'Finisher', did: f.result || 'gedaan', target: '', sig: ['Finisher', 'muted'], sub: '' }));
    const fb = s.feedback || {}, fbTxt = [num(fb.energy) != null && 'energie ' + nl(fb.energy, 0) + ' op 5', num(fb.bodyweight) != null && 'lichaamsgewicht ' + nl(fb.bodyweight) + ' kg', fb.note].filter(Boolean).join(' · ');
    return {
      client: c.name, first, coach: c.coach || '', note: (note || '').trim(),
      dateLong: toDate(s.date).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), dateShort: fmtDate(s.date, false), fileDate: s.date,
      praise: praiseFor(s), title: praiseFor(s).title, subtitle: [`${slotLabel(sessSlot(s))} van week ${block ? block.week : num(s.week) || 1}`, fmtDate(s.date), block && `${block.code} ${phase} · week ${block.week} van ${block.weeks}`, c.coach && 'coach ' + c.coach].filter(Boolean).join(' · '),
      kpis: [['Werksets', String(sets), 'zonder opwarming'], ['Volume', `${Math.round(ton).toLocaleString('nl-BE')} kg`, 'totaal getild'], (() => { const pr = praiseFor(s).recs || [], ever = pr.filter((q) => q.kind === 4).length; return ['Records', String(pr.length), pr.length ? (ever ? `${ever} ooit, ${pr.length - ever} periode` : 'beste in 3 tot 12 maanden') : 'zwaarste gewicht per aantal reps']; })(), ['Klaar voor meer', String(up), up ? 'oefeningen boven bereik' : 'boven je repsbereik']],
      rows, fbTxt, vol: MUSCLES.filter((m) => vol[m]).map((m) => [m, vol[m]]).sort((a, z) => z[1] - a[1]), block, charts, next,
    };
  }

  // disclaimers onderaan het rapport en de mail
  const DISC_COM = 'Dit rapport werd opgemaakt door Business Markers in samenwerking met I-Ticket BV, met de EnCORE Coach app, voor EnCORE Coaching. Business Markers is een boutique strategie- en leiderschapsbureau uit België en Nederland: wij helpen organisaties hun ambitie om te zetten in concrete uitvoering, met strategie, leiderschap en commerciële groei. Interesse in de app of in onze begeleiding? Neem contact op via ides@businessmarkers.com.';
  const DISC_LEGAL = 'Dit rapport is enkel informatief en vervangt geen medisch, kinesitherapeutisch of ander professioneel advies. Geschatte waarden (zoals het e1RM), voorstellen voor gewichten en rusttijden zijn berekeningen op basis van de ingevoerde gegevens en kunnen afwijken; volg altijd de aanwijzingen van je coach en luister naar je lichaam. Trainen gebeurt op eigen verantwoordelijkheid: raadpleeg een arts bij pijn, blessures of gezondheidsklachten. Business Markers, I-Ticket BV en EnCORE Coaching zijn niet aansprakelijk voor schade of letsel door het gebruik van dit rapport of de app, behalve bij opzet of zware fout. Dit rapport is vertrouwelijk en bestemd voor de geadresseerde. Persoonsgegevens worden enkel gebruikt voor de begeleiding, verwerkt volgens de AVG (GDPR) en niet aan derden doorgegeven; je kan inzage, correctie of verwijdering vragen bij je coach.';
  // tekent het rapport met jsPDF (vector, standaardfont Helvetica)
  function drawReport(J, m) {
    const doc = new J({ unit: 'mm', format: 'a4' }), W = 210, H = 297, M = 14, CW = W - 2 * M;
    const C = { ink: [29, 27, 25], muted: [110, 105, 99], line: [228, 224, 218], acc: [226, 95, 35], soft: [252, 232, 221], blue: [61, 110, 158], ok: [44, 122, 75], warn: [168, 100, 0], bg: [245, 244, 241], white: [255, 255, 255] };
    const RK = { A: C.acc, B: C.blue, C: C.ok, F: [138, 127, 116] };
    const T = (x) => String(x ?? '').replace(/[−–—]/g, '-').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/…/g, '...').replace(/[  ]/g, ' ').replace(/[^\x00-\xff]/g, '');
    let y = 0;
    const fill = (c) => doc.setFillColor(...c), stroke = (c) => doc.setDrawColor(...c), col = (c) => doc.setTextColor(...c);
    const font = (st, sz) => { doc.setFont('helvetica', st); doc.setFontSize(sz); };
    const text = (x, xx, yy, o) => doc.text(T(x), xx, yy, o);
    const header = (first) => {
      const hh = first ? 30 : 13; fill(C.ink); doc.rect(0, 0, W, hh, 'F'); fill(C.acc); doc.rect(0, hh, W, 1.2, 'F');
      font('bold', first ? 21 : 11); col(C.acc); text('EnCORE', M, first ? 15 : 8.5); const w = doc.getTextWidth('EnCORE '); col(C.white); text('COACHING', M + w, first ? 15 : 8.5);
      if (first) { font('normal', 8.5); col([200, 195, 190]); text('Personal coaching · sessierapport', M, 22.5); }
      font('normal', first ? 9.5 : 8); col(C.white); text(m.dateLong, W - M, first ? 15 : 8.5, { align: 'right' }); if (first) { col([200, 195, 190]); text(m.client, W - M, 22.5, { align: 'right' }); }
      y = first ? 42 : 24;
    };
    const newPage = () => { doc.addPage(); header(false); };
    const need = (h) => { if (y + h > H - 16) newPage(); };
    const h2 = (x) => { need(16); y += 2; font('bold', 12.5); col(C.ink); text(x.toUpperCase(), M, y); fill(C.acc); doc.rect(M, y + 1.8, 14, 0.9, 'F'); y += 8; };
    const para = (x, size = 9, c = C.muted) => { if (!x) return; font('normal', size); col(c); const lines = doc.splitTextToSize(T(x), CW); need(lines.length * size * 0.42 + 2); doc.text(lines, M, y); y += lines.length * size * 0.42 + 2.5; };
    const kpis = (arr) => { need(24); const gap = 3, w = (CW - gap * (arr.length - 1)) / arr.length; arr.forEach(([l, v, sb], i) => { const x = M + i * (w + gap); fill(C.bg); doc.roundedRect(x, y, w, 20, 2, 2, 'F'); font('normal', 7); col(C.muted); text(l.toUpperCase(), x + 3.5, y + 5.5); font('bold', 16); col(i === 3 && v !== '0' ? C.ok : C.ink); text(v, x + 3.5, y + 13); if (sb) { font('normal', 6.8); col(C.muted); text(sb, x + 3.5, y + 17.4); } }); y += 26; };
    const table = (cols, rows) => {
      const lh = 3.9, headH = 7;
      const drawHead = () => { fill(C.bg); doc.rect(M, y, CW, headH, 'F'); font('bold', 7); col(C.muted); let x = M; cols.forEach((c) => { text(c.h.toUpperCase(), c.align === 'right' ? x + c.w - 2 : x + 2, y + 4.6, c.align === 'right' ? { align: 'right' } : undefined); x += c.w; }); y += headH; };
      need(headH + 10); drawHead();
      rows.forEach((r) => {
        const cells = r.cells.map((cv, i) => { const c = cv && typeof cv === 'object' ? cv : { t: cv }; font(c.bold ? 'bold' : 'normal', c.size || 8.6); return { ...c, lines: doc.splitTextToSize(T(c.t ?? ''), cols[i].w - 4) }; });
        font('italic', 7.4); const subLines = r.sub ? doc.splitTextToSize(T(r.sub), CW - cols[0].w - 4) : [];
        const nl0 = Math.max(1, ...cells.map((c) => c.lines.length)), hgt = nl0 * lh + 3.2 + (subLines.length ? subLines.length * 3.3 + 0.6 : 0);
        if (y + hgt > H - 16) { newPage(); drawHead(); }
        if (r.band) { fill(r.band); doc.rect(M, y + 0.6, 1.3, hgt - 1.2, 'F'); }
        let x = M; cells.forEach((c, i) => { font(c.bold ? 'bold' : 'normal', c.size || 8.6); col(c.color || C.ink); const right = cols[i].align === 'right'; doc.text(c.lines, right ? x + cols[i].w - 2 : x + 2.5 + (i === 0 ? 0.8 : 0), y + 4.6, right ? { align: 'right' } : undefined); x += cols[i].w; });
        if (subLines.length) { font('italic', 7.4); col(C.muted); doc.text(subLines, M + cols[0].w + 2.5, y + 4.6 + nl0 * lh); }
        y += hgt; stroke(C.line); doc.setLineWidth(0.2); doc.line(M, y, W - M, y);
      });
      y += 5;
    };
    const hbars = (items) => { const max = Math.max(1, ...items.map((x) => x[1])), lw = 30, bw = CW - lw - 14; items.forEach(([l, v]) => { need(6); font('normal', 8.4); col(C.ink); text(l, M, y + 3.2); fill(C.line); doc.roundedRect(M + lw, y, bw, 4, 1, 1, 'F'); fill(C.acc); doc.roundedRect(M + lw, y, Math.max(1.6, (bw * v) / max), 4, 1, 1, 'F'); font('bold', 8.4); text(String(Math.round(v * 10) / 10).replace('.', ','), W - M, y + 3.2, { align: 'right' }); y += 6; }); y += 3; };
    const progress = (b) => {
      need(30); let x = M; font('bold', 8);
      b.timeline.forEach((t) => { const w = doc.getTextWidth(T(t.code)) + 8; if (x + w > W - M) return; fill(t.cur ? C.acc : t.future ? C.white : C.bg); stroke(t.cur ? C.acc : C.line); doc.setLineWidth(0.3); doc.roundedRect(x, y, w, 6.5, 1.5, 1.5, 'FD'); col(t.cur ? C.white : t.future ? C.muted : C.ink); text(t.code, x + 4, y + 4.4); x += w + 2; });
      y += 13.5; font('bold', 9); col(C.ink); text(`Week ${b.week} van ${b.weeks}`, M, y); font('normal', 8.5); col(C.muted); text(`training ${b.done} van ${b.total} in ${b.code}`, W - M, y, { align: 'right' }); y += 2.5;
      fill(C.line); doc.roundedRect(M, y, CW, 3.2, 1.6, 1.6, 'F'); fill(C.acc); doc.roundedRect(M, y, Math.max(3.2, CW * Math.min(1, b.done / Math.max(1, b.total))), 3.2, 1.6, 1.6, 'F'); y += 9;
      if (b.goal) para('Doel van dit blok: ' + b.goal, 8.6, C.ink);
    };
    const lineChart = (x, yy, w, h, ch) => {
      stroke(C.line); doc.setLineWidth(0.3); doc.roundedRect(x, yy, w, h, 2, 2, 'S');
      font('bold', 8.8); col(C.ink); const nm = doc.splitTextToSize(T(ch.name), w - 22)[0]; text(nm, x + 3, yy + 5.5);
      col(ch.delta >= 0 ? C.ok : C.warn); text(ch.deltaTxt, x + w - 3, yy + 5.5, { align: 'right' });
      font('normal', 6.6); col(C.muted); text(ch.sub, x + 3, yy + 9.5);
      const px = x + 11, py = yy + 14, pw = w - 22, ph = h - 21, pts = ch.pts, xs = pts.map((p) => p.d), ys = pts.map((p) => p.v);
      let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= 864e5; x1 += 864e5; }
      const pd = Math.max(1, (Math.max(...ys) - Math.min(...ys)) * 0.18), y0 = Math.min(...ys) - pd, y1 = Math.max(...ys) + pd;
      const X = (v) => px + ((v - x0) / (x1 - x0)) * pw, Y = (v) => py + ph - ((v - y0) / (y1 - y0)) * ph;
      [0, 0.5, 1].forEach((f) => { const v = y0 + (y1 - y0) * f; stroke(C.line); doc.setLineWidth(0.15); doc.line(px, Y(v), px + pw, Y(v)); font('normal', 6); col(C.muted); text(String(Math.round(v)), px - 1.5, Y(v) + 1, { align: 'right' }); });
      stroke(C.acc); doc.setLineWidth(0.6); for (let i = 1; i < pts.length; i++) doc.line(X(xs[i - 1]), Y(ys[i - 1]), X(xs[i]), Y(ys[i]));
      pts.forEach((p, i) => { const last = i === pts.length - 1; fill(last ? C.acc : C.white); stroke(C.acc); doc.setLineWidth(0.4); doc.circle(X(p.d), Y(p.v), last ? 1.2 : 0.8, 'FD'); });
      const l = pts[pts.length - 1], lx = X(l.d); font('bold', 7.6); col(C.ink); text(`${Math.round(l.v)} ${ch.unit}`, lx - 2, Y(l.v) - 2.2, { align: 'right' });
      font('normal', 6); col(C.muted); text(ch.d0, px, py + ph + 4); text(ch.d1, px + pw, py + ph + 4, { align: 'right' });
    };

    header(true);
    font('bold', 19); col(C.ink); text(m.title, M, y); y += 7;
    para(m.subtitle, 9.5, C.muted); y += 2;
    if (m.praise && m.praise.lines.length) { font('normal', 9.5); const lines = doc.splitTextToSize(T([...m.praise.lines, m.praise.close].join('\n')), CW - 10), hh = lines.length * 4.2 + 7; need(hh + 4); fill([226, 241, 231]); doc.roundedRect(M, y, CW, hh, 2, 2, 'F'); fill(C.ok); doc.rect(M, y, 1.4, hh, 'F'); col(C.ink); doc.text(lines, M + 6, y + 6); y += hh + 6; }
    if (m.note) { font('normal', 9.5); const lines = doc.splitTextToSize(T(m.note), CW - 10), hh = lines.length * 4.2 + 7; need(hh + 4); fill(C.soft); doc.roundedRect(M, y, CW, hh, 2, 2, 'F'); fill(C.acc); doc.rect(M, y, 1.4, hh, 'F'); col(C.ink); doc.text(lines, M + 6, y + 6); y += hh + 6; }
    kpis(m.kpis);
    h2('Jouw sessie');
    const sigCol = (k) => (k === 'ok' ? C.ok : k === 'warn' ? C.warn : C.muted);
    table([{ h: '', w: 11 }, { h: 'Oefening', w: 44 }, { h: 'Wat je deed (kg × reps)', w: 61 }, { h: 'Schema', w: 34 }, { h: 'Signaal', w: 32 }],
      m.rows.map((r) => ({ band: RK[r.rk], sub: r.sub, cells: [{ t: r.code, bold: true, color: RK[r.rk] || C.muted }, { t: r.name, bold: true }, r.did, { t: r.target, color: C.muted }, { t: r.sig[0], bold: r.sig[1] !== 'muted', color: sigCol(r.sig[1]) }] })));
    if (m.fbTxt) para('Jouw feedback: ' + m.fbTxt, 8.6, C.ink);
    if (m.vol.length) { h2('Volume per spiergroep'); para('Werksets in deze training. De hoofdspier telt 1 set, een meewerkende spier telt een halve set.', 8.4); hbars(m.vol); }
    if (m.block) { need(48); h2('Waar sta je in het programma'); para(m.block.phaseTxt, 9, C.ink); progress(m.block); }
    if (m.charts.length) {
      need(70); h2('Jouw progressie'); para('Geschat 1RM (e1RM): het gewicht dat je theoretisch één keer zou kunnen tillen, berekend uit je sets en reps. Zo zijn een set van 3 en een set van 8 vergelijkbaar. Een oefening in de B-reeks doe je lichter of met meer reps: die vergelijken we enkel met andere B-metingen.', 8.4);
      const cw = (CW - 4) / 2, chh = 50; for (let i = 0; i < m.charts.length; i += 2) { need(chh + 4); lineChart(M, y, cw, chh, m.charts[i]); if (m.charts[i + 1]) lineChart(M + cw + 4, y, cw, chh, m.charts[i + 1]); y += chh + 4; } y += 3;
    }
    if (m.next && m.next.rows.length) {
      h2('Volgende training'); font('bold', 10); col(C.ink); need(10); text(m.next.title, M, y); y += 5; para(m.next.sub, 8.4);
      table([{ h: '', w: 11 }, { h: 'Oefening', w: 52 }, { h: 'Schema', w: 30 }, { h: 'Gewicht', w: 43 }, { h: 'Rust', w: 22 }, { h: 'Tempo', w: 24 }],
        m.next.rows.map((r) => ({ band: RK[r.rk], sub: r.sub, cells: [{ t: r.code, bold: true, color: RK[r.rk] || C.muted }, { t: r.name, bold: true }, r.scheme, r.kg, r.rest, r.tempo] })));
    }
    { font('normal', 7.2); const dl = doc.splitTextToSize(T(DISC_COM), CW).length + doc.splitTextToSize(T(DISC_LEGAL), CW).length; need(dl * 3.1 + 24); y += 4; stroke(C.line); doc.setLineWidth(0.2); doc.line(M, y, W - M, y); y += 5;
      font('bold', 7.6); col(C.ink); text('Over dit rapport', M, y); y += 3.8; para(DISC_COM, 7.2);
      font('bold', 7.6); col(C.ink); need(8); text('Disclaimer', M, y); y += 3.8; para(DISC_LEGAL, 7.2); }
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) { doc.setPage(i); stroke(C.line); doc.setLineWidth(0.2); doc.line(M, H - 11, W - M, H - 11); font('normal', 7.5); col(C.muted); text(`EnCORE Coaching · ${m.client}${m.coach ? ' · coach ' + m.coach : ''}`, M, H - 7); text(`${i} / ${n}`, W - M, H - 7, { align: 'right' }); }
    return doc;
  }

  const useCap = (n) => (window.claude?.use ? window.claude.use(n).catch(() => null) : Promise.resolve(null));
  let jsPdfP = null;
  const loadPdf = () => jsPdfP || (jsPdfP = new Promise((res, rej) => {
    if (window.jspdf?.jsPDF) { res(window.jspdf.jsPDF); return; }
    const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    sc.onload = () => (window.jspdf?.jsPDF ? res(window.jspdf.jsPDF) : rej(new Error('jsPDF ontbreekt')));
    sc.onerror = () => { jsPdfP = null; rej(new Error('PDF-bibliotheek laden mislukt')); };
    document.head.appendChild(sc);
  }));
  const reportFile = (m) => `EnCORE ${m.first} ${m.fileDate}.pdf`;
  function reportMail(m) {
    const coach = m.coach || 'je coach';
    const pr = m.praise && m.praise.lines.length ? m.praise : null;
    const html = `<p>Hoi ${esc(m.first)},</p>${pr ? `<p><b>${esc(pr.title)}</b></p><ul>${pr.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}<p>Hierbij het verslag van je training van ${esc(m.dateShort)}. In de bijlage vind je wat je deed, waar je staat in je programma, je progressie en wat er volgende keer op het programma staat.</p>${m.note ? `<p>${esc(m.note).replace(/\n/g, '<br>')}</p>` : ''}<p>Sportieve groet,<br>${esc(coach)}<br>EnCORE Coaching</p><p style="font-size:11px;color:#777">${esc(DISC_COM)}<br><br>${esc(DISC_LEGAL)}</p>`;
    const text = `Hoi ${m.first},\n\n${pr ? praiseText(pr) + '\n\n' : ''}Hierbij het verslag van je training van ${m.dateShort}. In de bijlage vind je wat je deed, waar je staat in je programma, je progressie en wat er volgende keer op het programma staat.\n\n${m.note ? m.note + '\n\n' : ''}Sportieve groet,\n${coach}\nEnCORE Coaching\n\n--\n${DISC_COM}\n\n${DISC_LEGAL}`;
    return { subject: `Je training van ${m.dateShort} · EnCORE Coaching`, html, text };
  }
  function openReport(sid) { const c = client(); S.report = { sid, to: c.email || '', note: '', busy: false }; renderReport(); $('#rep-note')?.focus(); }
  function renderReport() {
    let el = $('#report-modal'); if (!el) { el = document.createElement('div'); el.id = 'report-modal'; document.body.appendChild(el); }
    const r = S.report; if (!r) { el.innerHTML = ''; return; }
    const c = client(), s = sessOf(r.sid);
    el.innerHTML = `<div class="confirm" role="dialog" aria-modal="true" aria-labelledby="rep-h"><div class="card" style="max-width:34rem">
      <h3 id="rep-h">Rapport naar ${esc(c.name)}</h3><p class="sub">PDF van de training van ${esc(fmtDate(s?.date))}: wat ${esc(String(c.name).split(' ')[0])} deed, waar die staat in het programma, de progressie en de volgende training.</p>
      <div class="form" style="margin-top:12px"><label class="field wide"><span>E-mail klant</span><input type="email" id="rep-to" data-bind="rep" data-f="to" value="${esc(r.to)}" placeholder="naam@voorbeeld.be"></label>
      <label class="field wide"><span>Persoonlijke boodschap (bovenaan de PDF en in de mail)</span><textarea id="rep-note" data-bind="rep" data-f="note" placeholder="bv. Sterke sessie! Volgende keer gaan we op de trap bar 2,5 kg zwaarder.">${esc(r.note)}</textarea></label></div>
      <p class="small muted" id="rep-status" role="status" style="margin:10px 0 0">${s?.report?.at ? 'Eerder rapport: ' + esc(fmtDate(s.report.at.slice(0, 10))) + (s.report.to ? ' naar ' + esc(s.report.to) : '') : 'Verstuur nu: de mail met PDF vertrekt meteen via Gmail.'}</p>
      <div class="row" style="justify-content:flex-end;margin-top:12px;gap:8px"><button class="btn" data-act="rep-close">Sluiten</button><button class="btn" data-act="rep-dl">PDF downloaden</button><button class="btn" data-act="rep-gmail">Concept in Gmail</button><button class="btn primary" data-act="rep-send">Verstuur nu</button></div></div></div>`;
  }
  const repStatus = (h) => { const el = $('#rep-status'); if (el) el.innerHTML = h; };
  const repBusy = (on) => { if (S.report) S.report.busy = on; document.querySelectorAll('#report-modal [data-act^="rep-"]').forEach((x) => { if (x.dataset.act !== 'rep-close') x.disabled = on; }); };
  async function reportPdf() { const J = await loadPdf(); const m = reportModel(S.report.sid, S.report.note); return { m, doc: drawReport(J, m) }; }
  async function reportDownload() {
    if (!S.report || S.report.busy) return; repBusy(true); repStatus('PDF wordt gemaakt…');
    try {
      const { m, doc } = await reportPdf(), blob = doc.output('blob'), dl = await useCap('downloads');
      if (dl) { try { await dl.save({ filename: reportFile(m), data: blob }); repStatus('PDF opgeslagen.'); } catch (e) { repStatus(e?.code === 'declined' ? 'Download geannuleerd.' : 'Downloaden lukte niet hier. Gebruik "Concept in Gmail".'); } }
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = reportFile(m); document.body.appendChild(a); a.click(); a.remove(); repStatus('PDF gedownload.'); }
    } catch (e) { repStatus(esc(e?.message || 'PDF maken lukte niet.')); }
    repBusy(false);
  }
  async function reportGmail(send) {
    const r = S.report; if (!r || r.busy) return;
    const to = String(r.to || '').trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { repStatus('<span class="sig-bad">Vul een geldig e-mailadres in.</span>'); $('#rep-to')?.focus(); return; }
    repBusy(true); repStatus('PDF wordt gemaakt…');
    try {
      if (to !== (client().email || '') && S.canWrite) await write(`clients/${S.cid}`, { email: to }, true);
      const { m, doc } = await reportPdf(), mail = reportMail(m), b64 = doc.output('datauristring').split(',')[1];
      const mcp = await useCap('mcp');
      if (!mcp) { repStatus('Gmail is niet bereikbaar in deze weergave. Download de PDF en voeg hem toe aan een mail.'); repBusy(false); return; }
      repStatus(send ? 'Mail wordt verstuurd…' : 'Concept wordt aangemaakt in Gmail…');
      const res = await mcp.callTool('Gmail', send ? 'send_message' : 'create_draft', { to: [to], subject: mail.subject, body: mail.text, htmlBody: mail.html, attachments: [{ content: b64, filename: reportFile(m), mimeType: 'application/pdf' }] });
      const url = res?.payload?.viewUrl || res?.structuredContent?.viewUrl || '';
      const at = new Date().toISOString(), rep = { at, to, type: send ? 'gmail-sent' : 'gmail-concept' };
      if (S.draft && S.draft.id === r.sid) { S.draft.report = rep; S.draft._dirty = true; await saveTraining(); } else if (S.canWrite) await write(`clients/${S.cid}/sessions/${r.sid}`, { report: rep }, true);
      if (send) { repStatus(`<span class="sig-up">✓ Verstuurd naar ${esc(to)}.</span>`); repBusy(false); return; }
      repStatus(`<span class="sig-up">Concept staat klaar in Gmail.</span> ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Open het concept</a>, kijk het na en verstuur.` : 'Open Gmail, kijk het concept na en verstuur.'}`);
    } catch (e) {
      const msg = gmailErr(e);
      repStatus(`<span class="sig-bad">${esc(msg)}</span>`);
    }
    repBusy(false);
  }


  // foutmelding van de Gmail-connector in gewone taal (rapport en samenvatting)
  const gmailErr = (e) => ({
        needs_reauth: 'Gmail moet opnieuw verbonden worden: claude.ai, Instellingen, Connectors.',
        server_not_connected: 'Gmail is niet verbonden. Voeg Gmail toe via claude.ai, Instellingen, Connectors.',
        selection_required: 'Kies eerst welk Gmail-account deze pagina gebruikt (melding bovenaan).',
        not_in_manifest: 'Gmail is niet toegestaan voor deze pagina. Sta het toe via het menu Rechten van de app.',
        approval_required: 'Gmail vraagt je goedkeuring. Klik opnieuw en sta het toe.',
        blocked_by_policy: 'Je organisatie blokkeert Gmail voor deze pagina.',
        tool_error: 'Gmail weigerde de mail: ' + (e?.message || ''),
        server_unavailable: 'Gmail reageert niet. Kijk eerst in Gmail (Verzonden of Concepten) of de mail toch vertrok voor je opnieuw probeert.',
      }[e?.code] || 'Mailen lukte niet' + (e?.message ? ': ' + e.message : '') + '. Download de PDF en mail hem zelf.');
  // ---------- motivatie: records per aantal reps, alles afgewerkt, meer volume, event in zicht ----------
  // Record = zwaarste gewicht ooit voor minstens dat aantal reps; anders "beste in 12 maanden".
  function praiseFor(s) {
    const c = client(), first = String(c?.name || '').trim().split(' ')[0], out = [], recs = [];
    let planN = 0, doneN = 0, ton = 0, over = [], allDone = true;
    const PERIODS = [[365, '12 maanden'], [182, '6 maanden'], [91, '3 maanden']];
    (s.entries || []).forEach((en) => {
      if (!en.exId) return; const tg = en.target || {}, st = (en.sets || []).filter((x) => num(x.reps) != null || num(x.value) != null || x.ok === true);
      planN += num(tg.sets) || st.length; doneN += st.length; if (st.length < (num(tg.sets) || 0)) allDone = false;
      if (!isStrength(en.exId)) return;
      const per = unitOf(en.exId) === 'kg per hand' ? 2 : 1;
      st.forEach((x) => { const kg = setKg(x, en.exId), r = num(x.reps); if (kg && r) ton += kg * r * per; });
      if (num(tg.repsMax) && st.some((x) => num(x.reps) > num(tg.repsMax))) over.push(exName(en.exId));
      const prior = history(en.exId, s.date).flatMap((h) => h.sets.map((x) => ({ d: h.date, kg: setKg(x, en.exId), r: num(x.reps) }))).filter((x) => x.kg && x.r);
      if (!prior.length) return;
      let best = null;
      st.forEach((x) => {
        const kg = setKg(x, en.exId), r = num(x.reps); if (!kg || !r) return;
        const atLeast = prior.filter((q) => q.r >= r), mx = (arr) => (arr.length ? Math.max(...arr.map((q) => q.kg)) : 0);
        // kind: 4 = ooit, 3 = 12 maanden, 2 = 6 maanden, 1 = 3 maanden (telt enkel als er in die periode eerdere metingen zijn)
        let kind = 0, per = '';
        if (kg > mx(atLeast)) kind = 4;
        else for (let pi = 0; pi < PERIODS.length; pi++) { const inP = atLeast.filter((q) => q.d >= addDays(s.date, -PERIODS[pi][0])); if (inP.length && kg > mx(inP)) { kind = 3 - pi; per = PERIODS[pi][1]; break; } }
        if (kind && (!best || kind > best.kind || (kind === best.kind && kg > best.kg))) best = { kind, kg, r, x, per };
      });
      if (best) recs.push({ name: exName(en.exId), txt: `${setLabel(en.exId, best.x)} × ${best.r}`, kind: best.kind, r: best.r, per: best.per });
    });
    recs.sort((a, z) => z.kind - a.kind);
    recs.forEach((q) => out.push(q.kind === 4 ? `Record op ${q.name}: ${q.txt}, je zwaarste ooit voor ${q.r} reps. Daar mag je trots op zijn!` : `Sterk op ${q.name}: ${q.txt}, je beste van de voorbije ${q.per} voor ${q.r} reps.`));
    if (doneN && allDone) out.push(`Alle oefeningen volledig afgewerkt (${doneN} sets): proficiat, goed gedaan!`); else if (doneN) out.push(`${doneN} werksets afgewerkt: goed gedaan, elke set telt!`);
    const prev = sortedSessions().filter((x) => x.id !== s.id && x.date < s.date && !x.historical && x.blockId === s.blockId && sessSlot(x) === sessSlot(s)).pop();
    if (prev && ton) { let pt = 0; (prev.entries || []).forEach((en) => { if (!isStrength(en.exId)) return; const per = unitOf(en.exId) === 'kg per hand' ? 2 : 1; (en.sets || []).forEach((x) => { const kg = setKg(x, en.exId), r = num(x.reps); if (kg && r) pt += kg * r * per; }); }); if (pt && ton > pt * 1.02) out.push(`${nl(Math.round((ton / pt - 1) * 100), 0)}% meer volume dan vorige keer: je wordt sterker.`); }
    const fn = (s.fins || []).filter((f) => f.result || f.done); if (fn.length) out.push(`Finisher afgewerkt: ${fn.map((f) => `${f.name}${f.result ? ' ' + f.result : ''}`).join(', ')}. Sterk afgesloten!`);
    if (over.length) out.push(`Op ${over.join(' en ')} zat je boven je repsbereik: volgende keer mag het zwaarder.`);
    const ev = c?.event; if (ev?.date) { const dd = daysBetween(s.date, ev.date); if (dd > 0 && dd <= 60) out.push(`Nog ${dd} ${dd === 1 ? 'dag' : 'dagen'} tot ${ev.name || 'je event'}: je bent goed op weg.`); }
    return { recs, title: recs.some((q) => q.kind === 4) ? `Proficiat ${first}, nieuw record!` : `Goed bezig, ${first}!`, lines: out, close: 'Blijf zo doorgaan, je coach is trots op je.' };
  }
  const praiseHTML = (pr) => (pr && pr.lines.length ? `<div class="praise"><b>${esc(pr.title)}</b>${pr.lines.map((l) => `<span>${esc(l)}</span>`).join('')}<span class="muted">${esc(pr.close)}</span></div>` : '');
  const praiseText = (pr) => (pr && pr.lines.length ? [pr.title, ...pr.lines, pr.close].join('\n') : '');
