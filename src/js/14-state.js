  // ---------- state ----------
  const S = {
    db: null, user: null, canWrite: true, offline: false,
    loaded: { ex: false, cl: false, bl: false, se: false },
    clients: {}, exercises: {}, blocks: {}, sessions: {},
    cid: store.get('ec.cid') || null, view: ({ schema: 'planning' })[store.get('ec.view')] || store.get('ec.view') || 'home', gen: null, slotFilter: '', trainBlock: null, trainDate: '',
    unsub: [], draft: null, schemaDraft: null, schemaDirty: false, blockSel: null,
    progEx: null, profileDraft: null, newClient: null, eventDraft: null, eventDirty: false,
    exEdit: null, exNew: null, confirm: null, toast: '', pending: false,
    config: { anchors: DEFAULT_ANCHORS, coaches: [], kgPerBlock: 6.4, pullPushTarget: 2, pullPushConfirmed: false, coachEmails: {} }, statBlock: null, report: null, lastSelf: 0, saveTimer: null, planTimer: null, saveState: '', coachFilter: store.get('ec.coach') || '', intakeDraft: null, settingsDraft: null,
    // v1.3.0 gymmodus (standaard op de gsm), rusttimer, samenvatting na Klaar
    gym: store.get('ec.gym') != null ? store.get('ec.gym') === '1' : !!window.matchMedia?.('(max-width: 700px)').matches, gymIdx: 0, gymSet: null, gymAnim: '', rest: null, summary: null, lastSess: null,
  };
  const client = () => (S.cid ? S.clients[S.cid] : null);
  const kgPerBlock = () => num(S.config.kgPerBlock) ?? 6.4;
  const bwNow = () => num(client()?.stats?.lastBodyweight) ?? num(client()?.bodyweight);
  const clientAnchors = (c = client()) => (S.config.anchors || []).filter((id) => S.exercises[id] && !(c?.anchorsNA || []).includes(id));
  const unitOf = (id) => S.exercises[id]?.unit || 'kg';
  // optionele scores per klant: expliciet aan/uit, anders aan zodra er al gegevens zijn
  const tracks = (c, k) => { const f = k === 'whoop' ? 'trackWhoop' : 'trackAttention'; if (c && typeof c[f] === 'boolean') return c[f]; const fk = k === 'whoop' ? 'whoop' : 'pain'; return Object.values(S.sessions).some((s) => num(s.feedback?.[fk]) != null) || (k === 'attention' && !!c?.painLabel); };
  const ATT = 'Aandacht';

