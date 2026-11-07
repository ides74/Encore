# Backlog

## After v1.5.0 (07/11/2026)
- Excel export for Stijn (Ides 07/11): (1) at the start of a period an Excel with the planning, (2) after the 3-week cycle an Excel with the results, both as close as possible to Stijn's own Excel layout, so he trusts no data is lost. A tick box in the app ("Excel bij opmaak" / "Excel na de cyclus"). Needs one of Stijn's Excel files as template.
- Apple Watch and Whoop data per training (heart rate, strain, recovery). Whoop first (official API), Apple via an iPhone export app or Shortcut.
- Rest table (v1.4.1 suggestion by type, reps and phase) to confirm by Stijn.
- Split squat: one or two dumbbells (app shows "Kg (1 dumbbell)").
- Legal and commercial disclaimers in the report: check the text with a lawyer.
- Sound of the rest timer on a real iPad (silent mode, screen locked) to verify.

## After v1.3.0 (06/11/2026)
- Real rest per set: store the time of each ✓ so Stijn sees the rest that was really taken.
- Coach e-mail addresses in Instellingen (today they are filled in once from the summary).
- Supersets and trisets: rest only after the last exercise of the group.
- Timer while the phone is locked: browsers pause the page; only possible with a native app or a notification service.
- UI copy rule (no "—" or "–" as punctuation, no comma before "en" or "of"): add a lint for prose strings. The "–" used as empty value in KPI tiles is allowed.

## Found in the test runs (06/11/2026)
- Fixed in v1.0.1: Planning on a phone scrolled sideways (pills did not wrap).
- iPad and phone: the Planning editor has about 350 fields and buttons under 40 px high; fine with a mouse, tight with a finger. Coach edits schemas best on PC or iPad landscape.
- Training log: "Neem plan over" works per exercise. Wish: one button "Alles zoals gepland" for the whole training, then only change what differs.
- Plate weight of the pulldown tower: app 6,4 kg, coach sheet implies 6,45 kg. One value to choose (Settings).

## Open questions for Stijn
- Older schemas with outcomes (what was really done), at least the last 4 cycles.
- 12-week and year logic: order of phases, deloads, test moments, peaks (events).
- Progression rule: when does the load go up.
- Split squat and back extension: one or two dumbbells. Trap bar starting load Int 25.
- "Step loading": which method in his list.
- Who fills in what: coach the schema, client the log, coach the review.

## Done in v1.1.0 "touch en contrast" (from the UX audit, see docs/UX-STANDARDS.md)
- U2: text and primary buttons to #B8461B (brand orange #E25F23 stays for lines and surfaces); warning text #8F5500.
- U3: aria-labels on code and exercise fields per row in Planning.
- U7/U8: on touch devices (pointer: coarse) fields and buttons 44 px high and 16 px text, so iPhone and iPad stop zooming.
- U9: nothing under 12 px. U10: one primary button on Overzicht.
- Then: tokens.css as the single place for colours and sizes; ux_audit --strict in check_all.

## Decided by Ides (06/11/2026), after the first test with Stijn
- Roles: the coach manages schemas and exercises; the client OR the coach logs trainings (per agreement). Rights model later, after testing.
  Note: today every signed-in viewer sees all clients. Clients logging themselves needs per-client access (own space or own app per client).
- Save safety: autosave already runs 1,2 s after each change. Add: a clearly visible save status (bar, not grey text), automatic retry every 30 s after a failure, and a local copy of an unsaved training until the save succeeds (also when the page is closed).
- Weak network in the gym: once the page is open, keep logging and sync when the network is back. Opening the app without network is not possible (it loads from claude.ai).
- Conflict warning: when two people edit the same schema, warn before overwriting ("Stijn changed this schema at 10:42: load his version or keep yours"). Optional: show who is editing now.
