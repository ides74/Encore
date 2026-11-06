# Architecture: what happens where

One self-contained HTML page on claude.ai. The data does not live in the page but in the artifact's database, so the same data shows on phone, iPad and PC, for every coach.

## Layers
| Layer | Where | What happens there |
|---|---|---|
| Presentation | `src/index.template.html`, `src/styles.css` | page frame, layout, components |
| UX standard | `src/tokens.css` | BuMa UX rules as variables: text colours (AA contrast), 44 px touch targets, 16 px inputs, 12 px minimum. Loaded last, so it wins over styles.css |
| Rules (domain) | `16-domain`, `18-volume…`, `20-opwarmsets`, `21-rustregels`, `34-krachtbalans…` | Stijn's rules: % 1RM table, RPE/RIR, warm-up, rest timer (rest minus 10 s, signals at 10 s and 0), strength ratios, volume per muscle group, TUT. Pure functions: tested one by one |
| Data access | `22-db` | the only place that writes to the database (`write`, `remove`); errors become a message for the user |
| State | `14-state` | `S`: what is loaded, which client, which screen, unsaved drafts |
| Screens (views) | `26-view-home` … `50-view-exercises` | one file per tab; they read `S` and return HTML, they never write. `30-view-training` holds the list view and the shared building blocks of the training screen; `31-gymmodus` the phone view (one exercise per screen) |
| Rest timer | `41-rusttimer` | display, sound, vibration and screen wake lock; the rules come from `21-rustregels` |
| Summary | `43-samenvatting` | after "Klaar": plan versus done, records, too hard; one Gmail draft to client, coach or both |
| Actions | `52-actions` | what a button does (`data-act`) |
| Bindings | `54-bindings` | typing in fields, autosave of training and schema |
| Report | `42-sessierapport…` | PDF/Excel download and Gmail draft to the client |
| Boot | `56-boot` | connects to the database and listens for changes |
| Test hook | `55-testhook` | only in `dist/test.html`; gives the tests access to the rules |

The modules are pieces of one script (one closure), in file order. `tools/build.py` glues them together.

## Data model (database)
- `exercises/<id>`: library shared by all coaches (name, category, secondary muscles, unit: kg, kg per hand, blok, bw, meter, kcal…)
- `config/app`: coaches, anchor lifts, kg per block, pull/push target, `coachEmails` (coach name to e-mail, filled from the summary)
- `clients/<id>`: profile, coach, goal, constraints, event, stats
- `clients/<id>/blocks/<id>`: a period (schema): code, phase, start, weeks, trainings per week, exercises with set plan and warm-up
- `clients/<id>/sessions/<id>`: a logged training: date, block, training (T1…), week, sets (kg or blocks, reps, RPE), warm-up sets (kg, reps, `done` since v1.3.0), feedback. A set counts as done when it holds a value (v1.2.0 rule "voorstel is geen waarde")

## Runtime capabilities
`db` + `user` (data and rights), `downloads` (report files), `mcp` Gmail `create_draft` (report mail as draft).

## Tools
- `tools/build.py`: source to `dist/index.html` (publish) and `dist/test.html` (tests)
- `tools/import_live.py`: pull the live page back into `src/` and prove the build equals live
- `tools/check_all.sh`: the gate before every publish

## Permanent quality gates (run by `tools/check_all.sh`, in this order)
| Gate | File | Blocks a release when |
|---|---|---|
| Build + syntax | `tools/build.py --check --test` | the script does not parse |
| Changelog | `check_all.sh` | `VERSION` has no line in `CHANGELOG.md` |
| UX lint (static) | `tools/lint_ux.py` | a hard-coded colour appears in `src/js`, or `tokens.css` is missing from the build |
| Unit + end to end | `test/e2e.py` | a rule, a flow, a device or the version check (U17) fails |
| UX audit (live render) | `test/ux_audit.py --strict` | a MUST rule fails on any of 72 screens: sideways scroll, contrast AA, unlabeled field, focus ring. SHOULD rules (44 px, 16 px inputs, 12 px text, one primary button) are reported |

The rules themselves live in the shared doc "BuMa UX-standaarden en checklist" (see `docs/UX-STANDARDS.md`). A new rule there gets a check in `ux_audit.py` or `lint_ux.py`, or a line in the manual list of `docs/RELEASE.md`.
