  // ---------- rusttimer (scherm, geluid, trilling, scherm aan) ----------
  // De regels staan in 21-rustregels. Hier alleen wat de gebruiker ziet en hoort.
  const soundOn = () => store.get('ec.sound') !== 'off';
  let AC = null, WL = null;
  // geluid mag pas na een tik van de gebruiker: elke ✓ ontgrendelt het
  // iPad/iPhone: Web Audio zwijgt in de stille modus. audioSession 'playback' (iOS 17+) en een html-audio-element als reserve lossen dat op.
  const wavBeep = (tones) => { const sr = 22050, seg = tones.map(([f, d, g]) => [f, Math.round(d * sr), Math.round((g || 0) * sr)]), n = seg.reduce((a, [, l, g]) => a + l + g, 0), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0))); w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    let o = 44; seg.forEach(([f, l, g]) => { for (let i = 0; i < l; i++) { const env = Math.min(1, i / 200, (l - i) / 400); v.setInt16(o, Math.sin((2 * Math.PI * f * i) / sr) * 0.6 * env * 32767, true); o += 2; } for (let i = 0; i < g; i++) { v.setInt16(o, 0, true); o += 2; } });
    let b = ''; new Uint8Array(buf).forEach((x) => { b += String.fromCharCode(x); }); return 'data:audio/wav;base64,' + btoa(b); };
  let BEEPS = null;
  const audioUnlock = () => {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch {}
    try { if (!BEEPS) { BEEPS = [new Audio(wavBeep([[880, 0.18]])), new Audio(wavBeep([[990, 0.2, 0.08], [990, 0.2, 0.08], [1320, 0.3]]))]; BEEPS.forEach((a) => { a.preload = 'auto'; a.muted = true; a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => { a.muted = false; }); }); } } catch {}
  };
  const beep = (t0, f, dur) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + dur + 0.03); };
  // signaal 1: één korte toon en trilling; signaal 2: drie tonen en een lange trilling. iPhone kent geen trilling.
  function signal(n, test) {
    if (!test) try { navigator.vibrate?.(n === 1 ? 200 : [400, 150, 400, 150, 400]); } catch {}
    if (!soundOn()) return;
    const el = BEEPS?.[n === 1 ? 0 : 1];
    if (el) { try { el.currentTime = 0; const pr = el.play(); if (pr) pr.catch(() => webBeep(n)); return; } catch {} }
    webBeep(n);
  }
  function webBeep(n) { if (!AC) return; try { if (AC.state === 'suspended') AC.resume(); const t = AC.currentTime + 0.02; if (n === 1) beep(t, 880, 0.18); else [0, 0.28, 0.56].forEach((dl, k) => beep(t + dl, k === 2 ? 1320 : 990, 0.2)); } catch {} }
  function restStart(sec, label) {
    const left = restLeft(sec);
    S.rest = { end: Date.now() + left * 1000, t0: Date.now(), total: sec, label, warned: left <= REST_WARN, rang: false };
    const el0 = $('#rest'); if (el0) el0.innerHTML = '';
    clearInterval(restStart.iv); restStart.iv = setInterval(restTick, 250); restTick();
  }
  function restStop() { S.rest = null; clearInterval(restStart.iv); const el = $('#rest'); if (el) el.innerHTML = ''; restShow(); }
  // zonder rust: de timerbalk blijft staan (rustig, grijs) met de geluidschakelaar
  function restShow() {
    const on = S.view === 'training' && !!S.draft; document.body.classList.toggle('training-on', on);
    const el = restEl(); if (!on) { if (!S.rest) { el.hidden = true; el.innerHTML = ''; } return; }
    el.hidden = false; if (S.rest) return;
    el.className = 'rest idle'; el.innerHTML = `<div class="rest-main"><span class="t" aria-hidden="true">0:00</span><div class="info"><b>Rusttimer</b><br><span class="muted">Start vanzelf na ✓ Set klaar. Rusttijd volgens oefening, reps en fase.</span></div></div><div class="row" style="gap:8px">${soundSwitch()}</div>`;
  }
  // de timer staat los van het scherm (vast bovenaan), zodat hij zichtbaar blijft bij het wisselen van oefening
  const restEl = () => { let el = $('#rest'); if (!el) { el = document.createElement('div'); el.id = 'rest'; el.className = 'rest'; el.setAttribute('role', 'timer'); el.hidden = true; document.body.appendChild(el); } return el; };
  const REST_OPTS = [45, 60, 90, 120, 150, 180, 240];
  function restTick() {
    const r = S.rest; if (!r) return;
    if (!(S.view === 'training' && S.draft)) { S.rest = null; clearInterval(restStart.iv); restShow(); return; }
    const st = restState(r, Date.now());
    if (st.signal === 1) { r.warned = true; signal(1); }
    if (st.signal === 2) { r.warned = r.rang = true; signal(2); }
    if (st.expired) { restStop(); return; }
    const el = restEl();
    if (!el.firstChild) el.innerHTML = restInner();
    el.hidden = false; el.className = 'rest ' + st.phase;
    const ro = el.querySelector('.rest-opts'), pr = ro && ro.querySelector('[aria-pressed="true"]'); if (pr && !ro._c) { ro._c = 1; ro.scrollLeft = Math.max(0, pr.offsetLeft - ro.offsetLeft - ro.clientWidth / 2 + pr.offsetWidth / 2); }
    el.querySelector('.t').textContent = st.ms > 0 ? mmss(st.s) : '+' + mmss(Math.floor(-st.ms / 1000));
    el.querySelector('.st').textContent = st.phase === 'over' ? 'Start!' : st.phase === 'soon' ? 'Klaarmaken' : 'Rust';
  }
  const soundSwitch = () => `<button type="button" class="switch" role="switch" aria-checked="${soundOn()}" data-act="rest-sound"><span class="track"><span class="knob"></span></span><span class="sw-l">Geluid <b>${soundOn() ? 'AAN' : 'UIT'}</b></span></button>`;
  const restInner = () => { const r = S.rest, opts = [...new Set([...REST_OPTS, r.sugg || r.total, ...(r.schema ? [r.schema] : [])])].sort((a, z) => a - z), go = r.next != null && r.next >= 0 && r.next !== S.gymIdx && S.gym;
    return `<div class="rest-main"><span class="t" aria-hidden="true"></span><div class="info"><b class="st">Rust</b><br><span>Volgende: <b>${esc(r.label)}</b></span></div>${go ? `<button class="btn primary" data-act="rest-go">Naar ${esc(S.draft.entries[r.next]?.target?.code || 'volgende')} ›</button>` : ''}</div>
      <div class="rest-opts"><span class="lab">Rusttijd</span>${opts.map((v) => `<button type="button" class="chipbtn" data-act="rest-set" data-v="${v}" aria-pressed="${v === r.total}">${restTxt(v)}${v === r.sugg ? ' ★' : ''}${v === r.schema && v !== r.sugg ? ' (schema)' : ''}</button>`).join('')}</div>${r.why ? `<div class="small muted why">★ voorstel: ${esc(r.why)}</div>` : ''}
      <div class="row" style="gap:8px"><button class="btn" data-act="rest-add" data-d="-15">−15 s</button><button class="btn" data-act="rest-add" data-d="15">+15 s</button>${soundSwitch()}<button class="btn" data-act="rest-stop">Ik start nu</button></div>`; };
  const restHTML = () => '';
  // volgende set: eerst de open sets van dezelfde oefening, dan de volgende oefening met open sets
  // twee sporen: spoor 1 = A1, B1, C1; spoor 2 = A2, B2, C2. Actief in een spoor = eerste oefening met open sets.
  // Na een set: naar het actieve van het andere spoor als dat nog open sets heeft, anders in het eigen spoor verder.
  // F-oefeningen en oefeningen zonder nummer komen op het einde.
  const trackOf = (en) => { const c = String(en?.target?.code || ''), m = c.match(/^([A-EG-Z])(\d+)$/i); return m ? +m[2] : null; };
  const entryOpen = (x) => !!x.exId && x.sets.some((y) => !setDone(y));
  function trackActive(t) { const es = S.draft.entries; const ids = es.map((x, k) => k).filter((k) => trackOf(es[k]) === t).sort((a, z) => codeSort(es[a].target?.code, es[z].target?.code)); return ids.find((k) => entryOpen(es[k])) ?? -1; }
  function nextOf(ei) {
    const es = S.draft.entries, en = es[ei], t = trackOf(en);
    const tracks = [...new Set(es.map(trackOf).filter((x) => x != null))].sort((a, z) => a - z);
    if (t != null) {
      const others = [...tracks.filter((x) => x > t), ...tracks.filter((x) => x < t)];
      for (const o of others) { const k = trackActive(o); if (k >= 0) return k; }
      const own = trackActive(t); if (own >= 0) return own;
    } else if (entryOpen(en)) return ei;
    for (const o of tracks) { const k = trackActive(o); if (k >= 0) return k; }
    const tail = es.map((x, k) => k).filter((k) => trackOf(es[k]) == null && entryOpen(es[k]));
    return tail.length ? tail[0] : -1;
  }
  function nextLabel(ei) {
    const k = nextOf(ei); if (k < 0) return null; const x = S.draft.entries[k], si = x.sets.findIndex((y) => !setDone(y));
    return `${x.target?.code ? x.target.code + ' ' : ''}${exName(x.exId)}${si >= 0 ? ' · set ' + (si + 1) : ''}`;
  }
  // start de rust na een bevestigde set; na de laatste set van de training geen timer
  function restAfter(ei) {
    const en = S.draft.entries[ei], nxt = nextLabel(ei), phase = S.blocks[S.draft.blockId]?.phase, sg = restSuggest(en.exId, en.target, phase);
    // gekozen rust voor deze oefening (tik in de timer) gaat voor; anders het voorstel
    const sec = num(en.target?.restPick) || sg?.sec || restOf(en.target, phase);
    if (nxt && sec) { restStart(sec, nxt); Object.assign(S.rest, { ei, next: nextOf(ei), sugg: sg?.sec || sec, why: sg?.why || '', schema: num(en.target?.rest) || null }); const el = $('#rest'); if (el) el.innerHTML = restInner(); restTick(); } else if (!nxt) { restStop(); toastMsg('Alle sets gedaan: tik op Training afronden'); }
  }
  // scherm aan houden in gymmodus (Wake Lock); stil falen waar de browser het niet kent
  async function wake(on) {
    try {
      if (on && !WL && 'wakeLock' in navigator && document.visibilityState === 'visible') { WL = await navigator.wakeLock.request('screen'); WL.addEventListener('release', () => { WL = null; }); }
      else if (!on && WL) { const w = WL; WL = null; await w.release(); }
    } catch {}
  }
