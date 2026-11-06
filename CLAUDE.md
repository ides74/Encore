# CLAUDE.md: rules for every AI session on EnCORE Coach

EnCORE Coach is the coaching logbook of EnCORE Coaching (Stijn Aps and coaches). Owner: Ides Ticket (Business Markers).
It runs as one claude.ai artifact with a shared database:
- live page: https://claude.ai/artifact/9WEUj62mTHbVJTjkAp8vsM (slug `44ddfc17-e9bf-40e9-9a3a-2ece7e101d44`)
- source of truth: this repository. The live page is the output of the build, never the other way round.

## 1. Never break these
1. **The live page is never edited by hand.** Change `src/`, run the gate, publish `dist/publish.html` (the build in the viewer skeleton). Never publish `dist/test.html`.
2. **Before any change, pull live first** (`docs/RELEASE.md`, step 1). If live differs from the build, import it (`tools/import_live.py`) and commit before you start.
3. **No publish without `./tools/check_all.sh` ending in `ALL GREEN`.** A MUST rule of the UX audit blocks the release.
4. **Every release:** new number in `VERSION` (fix 1.x.y, feature 1.x.0, data model x.0.0), a line in `CHANGELOG.md`, the version visible under the app.
5. **A fixed bug gets a test** so it cannot come back. A new rule of Stijn gets a unit check with his numbers.
6. **No real client data in the repository.** Tests run on `test/fixtures/seed.json`.
7. **A schema is data, not code.** It goes into the database, never into the source.
8. **The page must still read old data.** New fields are optional; old names are mapped (`phaseOf`, `normMethod`, `legacyMap`). Add an old-form example to the fixture.

## 2. Architecture (details in `docs/ARCHITECTURE.md`)
- `src/js/NN-name.js` are pieces of one script, glued in file order by `tools/build.py`. One module per topic.
- **Layers:** rules (pure functions, no `S`, no DOM) → data access (`22-db`, the only place that writes) → state (`14-state`) → screens (return HTML, never write) → actions (`52-actions`, `data-act`) → bindings (`54-bindings`).
- **Rules are pure and tested.** Put a new calculation in a rules module (`16-domain`, `20-opwarmsets`, `21-rustregels` …), expose it in `55-testhook.js` and add cases to `unit()` in `test/e2e.py`.
- **Keep functions small and readable.** Prefer a named helper over a long inline template. Reuse the building blocks of `30-view-training` (`entryInfo`, `stepWrap`, `wuRowHTML`, `stickyHTML` …) instead of copying HTML.
- **Colours and sizes come from variables** in `styles.css` and `tokens.css` (`--accent-text` for orange text). No `#rrggbb` or `rgb()` in `src/js`: `tools/lint_ux.py` blocks it.

## 3. Domain rules that are decided (do not change without Ides or Stijn)
- Log in **RPE**, calculate in RIR (RIR = 10 − RPE). RPE is **never** filled in for the user.
- **Grey italic = suggestion** (plan, else last time). **Black = confirmed or typed.** Only sets with a value are saved and counted.
- ✓ fills only empty fields with the suggestion; typed values stay.
- Warm-up A-series (Stijn), in % of the first working set: 7+ reps: 6 × 50%, 4 × 75%; 6 reps or fewer: 6 × 50%, 4 × 70%, 2 × 90%.
- Rest timer: rest from the schema minus 10 s (time spent confirming); signal at 10 s left and at 0; no timer for a finisher or after the last set.
- Strength ratios vs flat BB bench (100%): incline 91%, standing OHP 72%, dip 117%, chin-up 87%.
- Training method is chosen per phase of 3 weeks and applied to the A-exercises. Olympic variants are Fullbody, not classic strength.
- Roles: the coach manages schemas and exercises; the client or the coach logs trainings. Mails are always a Gmail draft, never sent automatically.

## 4. UX (BuMa UX standard, `docs/BuMa-UX-standaard.md`, `docs/UX-STANDARDS.md`)
- Touch targets at least 44 px, input text 16 px, no text under 12 px, contrast AA, every field labelled, one primary button per screen.
- At most 7 tabs on the phone; the rest under "Meer".
- The phone is used in the gym: big numbers, ± buttons, one main action at the bottom within thumb reach.

## 5. Text in the app and in documents (Dutch, Belgian)
- Short, direct, concrete. No vague management language.
- Never "—" or "–" as punctuation in sentences: use a colon, comma or semicolon. (A "–" as empty value in a KPI tile is allowed.)
- No comma before "en" or "of".
- Code comments and docs in this repository may be English or Dutch; UI text is Dutch.

## 6. How to work
```
./tools/check_all.sh            # build, syntax, changelog, UX lint, unit + end-to-end on 4 devices, UX audit
./tools/check_all.sh --shots    # same, plus screenshots in test/shots/
```
- Playwright's Chromium is used when installed, otherwise the system Chrome (`test/harness.py`).
- Branch per change (`feat/…`, `fix/…`), then merge to `main`, tag `v<version>`, push, publish, smoke test on iPad and phone (`docs/RELEASE.md`).
- Look at the screenshots of every screen you touched, on phone and iPad, before you publish.
- Open questions for Stijn and wishes go to `docs/BACKLOG.md`, not into code comments.
