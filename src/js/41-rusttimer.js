  // ---------- rusttimer (scherm, geluid, trilling, scherm aan) ----------
  // De regels staan in 21-rustregels. Hier alleen wat de gebruiker ziet en hoort.
  const soundOn = () => store.get('ec.sound') !== 'off';
  let AC = null, WL = null;
  // geluid mag pas na een tik van de gebruiker: elke ✓ ontgrendelt het
  const audioUnlock = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch {} };
  const beep = (t0, f, dur) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + dur + 0.03); };
  // signaal 1: één korte toon en trilling; signaal 2: drie tonen en een lange trilling. iPhone kent geen trilling.
  function signal(n) {
    try { navigator.vibrate?.(n === 1 ? 200 : [400, 150, 400, 150, 400]); } catch {}
    if (!soundOn() || !AC) return;
    try { const t = AC.currentTime; if (n === 1) beep(t, 880, 0.18); else [0, 0.28, 0.56].forEach((dl, k) => beep(t + dl, k === 2 ? 1320 : 990, 0.2)); } catch {}
  }
  function restStart(sec, label) {
    const left = restLeft(sec);
    S.rest = { end: Date.now() + left * 1000, total: sec, label, warned: left <= REST_WARN, rang: false };
    clearInterval(restStart.iv); restStart.iv = setInterval(restTick, 250); restTick();
  }
  function restStop() { S.rest = null; clearInterval(restStart.iv); const el = $('#rest'); if (el) { el.hidden = true; el.innerHTML = ''; } }
  function restTick() {
    const r = S.rest; if (!r) return;
    if (!(S.view === 'training' && S.draft)) { restStop(); return; }
    const st = restState(r, Date.now());
    if (st.signal === 1) { r.warned = true; signal(1); }
    if (st.signal === 2) { r.warned = r.rang = true; signal(2); }
    if (st.expired) { restStop(); return; }
    const el = $('#rest'); if (!el) return;
    if (!el.firstChild) el.innerHTML = restInner();
    el.hidden = false; el.className = 'rest ' + st.phase;
    el.querySelector('.t').textContent = st.ms > 0 ? mmss(st.s) : '+' + mmss(Math.floor(-st.ms / 1000));
    el.querySelector('.st').textContent = st.phase === 'over' ? 'Start!' : st.phase === 'soon' ? 'Klaarmaken' : 'Rust';
  }
  const restInner = () => { const r = S.rest; return `<span class="t" aria-hidden="true"></span><div class="info"><b class="st">Rust</b> <span class="muted">${esc(restTxt(r.total))}, ${REST_CONFIRM} s al verrekend</span><br><span>Volgende: <b>${esc(r.label)}</b></span></div><div class="row" style="gap:6px"><button class="btn small" data-act="rest-add" data-d="-15">−15 s</button><button class="btn small" data-act="rest-add" data-d="15">+15 s</button><button class="btn small" data-act="rest-sound" aria-pressed="${soundOn()}" aria-label="Geluid ${soundOn() ? 'uit' : 'aan'} zetten">${soundOn() ? 'Geluid aan' : 'Geluid uit'}</button><button class="btn small" data-act="rest-stop">Ik start nu</button></div>`; };
  const restHTML = () => `<div id="rest" class="rest" role="timer"${S.rest ? '' : ' hidden'}>${S.rest ? restInner() : ''}</div>`;
  // volgende set: eerst de open sets van dezelfde oefening, dan de volgende oefening met open sets
  function nextLabel(ei) {
    const es = S.draft.entries, en = es[ei], k = en.sets.findIndex((x) => !setDone(x));
    if (k >= 0) return `${en.target?.code ? en.target.code + ' ' : ''}set ${k + 1}`;
    for (let j = 1; j < es.length; j++) { const x = es[(ei + j) % es.length]; if (x.exId && !entryDone(x)) return `${x.target?.code ? x.target.code + ' ' : ''}${exName(x.exId)}`; }
    return null;
  }
  // start de rust na een bevestigde set; na de laatste set van de training geen timer
  function restAfter(ei) {
    const en = S.draft.entries[ei], nxt = nextLabel(ei), sec = restOf(en.target, S.blocks[S.draft.blockId]?.phase);
    if (nxt && sec) restStart(sec, nxt); else if (!nxt) { restStop(); toastMsg('Alle sets gedaan: tik op Klaar'); }
  }
  // scherm aan houden in gymmodus (Wake Lock); stil falen waar de browser het niet kent
  async function wake(on) {
    try {
      if (on && !WL && 'wakeLock' in navigator && document.visibilityState === 'visible') { WL = await navigator.wakeLock.request('screen'); WL.addEventListener('release', () => { WL = null; }); }
      else if (!on && WL) { const w = WL; WL = null; await w.release(); }
    } catch {}
  }
