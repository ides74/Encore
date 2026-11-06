# Changelog

## v1.1.0 · 06/11/2026 · touch en contrast
- New `src/tokens.css` (BuMa UX standard): colours and sizes as variables, loaded after styles.css.
- Contrast AA everywhere: primary buttons, exercise codes, series headers, pills and notices; dark heat map in Statistiek.
- iPad and phone: buttons, chips and fields at least 44 px, input text 16 px (no more zoom on every tap).
- No text under 12 px. Labels on the code and exercise fields in Planning. One primary button on Overzicht.
- Permanent tests: UX audit (U1 to U10) blocks a release on MUST rules; static lint forbids hard-coded colours in the scripts; version check (U17).

## v1.0.1 · 06/11/2026
- Phone: info pills in Planning wrap; the page no longer scrolls sideways (found by the new device tests).
- Version shown under the app.
- Data (no code): schema Int 25 added for Ides; 3 new exercises (inverted row, split squat feet elevated DB, back extension incline DB).

## v1.0.0 · 06/11/2026
- Baseline: the live app (version 1792320964-f0ed) imported into this repository without changes (build equals live, checked byte for byte).
- Test suite: 22 unit checks on the rules, end-to-end runs on desktop, iPad landscape, iPad portrait and phone, read-only, offline, write failure and remote change.
