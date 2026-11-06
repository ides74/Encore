  // ---------- test hook (only in dist/test.html, never published) ----------
  // Gives the tests access to the pure rules and the state. tools/build.py leaves this file out of dist/index.html.
  if (window.__EC_TEST__) window.__EC_TEST__.api = { S, pctTable, pctEpley, rpeToRir, rirToRpe, adaptOf, adaptInfo, tempoSec, tutInfo, cutSets, bwTotal, bwIsTotal, setKg, e1, planKg, warmupPlan, ratioRM, restFor, weekFor, legacyMap, normDay, slotsOf, planVol, codeSort, normMethod, phaseOf, trainingBody, kgPerBlock };
