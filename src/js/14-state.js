  // ---------- state ----------
  const S = {
    db: null, user: null, canWrite: true, offline: false,
    loaded: { ex: false, cl: false, bl: false, se: false },
    clients: {}, exercises: {}, blocks: {}, sessions: {},
    cid: store.get('ec.cid') || null, view: ({ schema: 'planning' })[store.get('ec.view')] || store.get('ec.view') || 'home', gen: null, slotFilter: '', trainBlock: null, trainDate: '',
    unsub: [], draft: null, schemaDraft: null, schemaDirty: false, blockSel: null,
    progEx: null, profileDraft: null, newClient: null, eventDraft: null, eventDirty: false,
    exEdit: null, exNew: null, confirm: null, toast: '', pending: false,
    config: { anchors: DEFAULT_ANCHORS, coaches: [], bigBlock: 5.5, smallBlock: 2.75, pullPushTarget: 2, pullPushConfirmed: false, coachEmails: {} }, statBlock: null, report: null, lastSelf: 0, saveTimer: null, planTimer: null, saveState: '', coachFilter: store.get('ec.coach') || '', intakeDraft: null, settingsDraft: null,
    // v1.3.0 gymmodus (standaard op de gsm), rusttimer, samenvatting na Klaar
    gym: store.get('ec.gym') != null ? store.get('ec.gym') === '1' : !!window.matchMedia?.('(max-width: 700px)').matches, gymIdx: 0, gymSet: null, gymAnim: '', rest: null, summary: null, lastSess: null,
  };
  const client = () => (S.cid ? S.clients[S.cid] : null);
  const kgPerBlock = () => num(S.config.bigBlock) ?? 5.5;
  const smallKg = () => num(S.config.smallBlock) ?? 2.75; // kleine blok: til je altijd mee
  const BLOK_EXTRAS = [0, 2.3, 4.6], BLOK_MAX = 18;
  // toestel: aantal grote blokken + aantal kleine blokken (geen exacte kg: de katrol verandert de echte weerstand)
  const splitBlocks = (kg) => { const k = num(kg); if (k == null) return { blocks: '', extra: '' }; const rest = Math.max(0, k - smallKg()), big = Math.min(BLOK_MAX, Math.floor((rest + 0.01) / kgPerBlock())), r = rest - big * kgPerBlock(); const ex = BLOK_EXTRAS.reduce((a, z) => (Math.abs(z - r) < Math.abs(a - r) ? z : a), 0); return { blocks: big, extra: ex || '' }; };
  const blokTxt = (src) => `blok ${nl(src.blocks)}${num(src.extra) ? ' + ' + nl(src.extra) + ' kg' : ''}`;
  // dumbbells: 'kg per hand' = 2 dumbbells, oefeningen met DB of KB in de naam en eenheid kg = 1 dumbbell
  const dbCount = (exId) => { const u = unitOf(exId); if (u === 'kg per hand') return 2; if (u === 'kg' && /\b(DB|KB|dumbbell|kettlebell)\b/i.test(S.exercises[exId]?.name || '')) return 1; return 0; };
  const kgLabel = (exId) => { const n = dbCount(exId); return n === 2 ? 'Kg per dumbbell (2 ×)' : n === 1 ? 'Kg (1 dumbbell)' : 'Kg'; };
  const bwNow = () => num(client()?.stats?.lastBodyweight) ?? num(client()?.bodyweight);
  const clientAnchors = (c = client()) => (S.config.anchors || []).filter((id) => S.exercises[id] && !(c?.anchorsNA || []).includes(id));
  const unitOf = (id) => S.exercises[id]?.unit || 'kg';
  // optionele scores per klant: expliciet aan/uit, anders aan zodra er al gegevens zijn
  const tracks = (c, k) => { const f = k === 'whoop' ? 'trackWhoop' : 'trackAttention'; if (c && typeof c[f] === 'boolean') return c[f]; const fk = k === 'whoop' ? 'whoop' : 'pain'; return Object.values(S.sessions).some((s) => num(s.feedback?.[fk]) != null) || (k === 'attention' && !!c?.painLabel); };
  const ATT = 'Aandacht';

