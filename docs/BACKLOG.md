# Backlog

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

## v1.1.0 "touch en contrast" (from the UX audit, see docs/UX-STANDARDS.md)
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
