# Changelog

## v1.3.0 · 06/11/2026 · gymmodus en rusttimer
- Gymmodus (standaard op de gsm, knop "Gymmodus" of "Lijst"): één oefening per scherm, grote cijfers met ± knoppen, RPE als knoppen, één hoofdknop "Set klaar". Vegen of ‹ › gaat naar de vorige of volgende oefening. Planning, tempo en TUT staan achter "Details". Het scherm blijft aan.
- Rusttimer na elke ✓, en na een getypte afwijking (reps ingevuld, veld verlaten). Start op de rust uit het schema min 10 s (bevestigen), 2 min wordt 1:50. Signaal bij nog 10 s en op 0 (toon en trilling; iPhone enkel toon). Daarna telt hij op ("+0:12"). Knoppen: −15 s, +15 s, geluid aan of uit, "Ik start nu". Finisher: geen timer. Laatste set: geen timer.
- ± knoppen naast kg, blok en reps, ook in de lijst. Ze vertrekken van het grijze voorstel.
- ✓ vult alleen lege velden met het voorstel; wat al getypt is blijft staan. RPE wordt nog altijd nooit voor je ingevuld.
- Opwarmsets bevestigen met ✓ (nieuw optioneel veld `done` per opwarmset).
- Planregel: lichaamsgewicht zonder extra gewicht toont "LG × 8" in plaats van "?×8".
- Samenvatting bij "Klaar": plan tegenover gedaan per oefening, nieuwe records, wat te moeilijk was. Eén Gmail-concept naar klant, coach of beide (met PDF-rapport als de klant meeleest). Het e-mailadres van de coach wordt bewaard in `config/app.coachEmails`.
- Gsm: hoogstens 7 tabs; Intake, Event en Oefeningen staan onder "Meer". iPad en pc tonen alle tabs.
- Code: nieuwe modules `21-rustregels` (pure regels, getest), `31-gymmodus`, `41-rusttimer`, `43-samenvatting`; trainingsscherm opgesplitst in herbruikbare bouwstenen; Gmail-foutmeldingen op één plaats (`gmailErr`).
- Tests: 33 nieuwe checks (rustregels, LG, gymmodus op de gsm, timer, vegen, opwarming, samenvatting, Meer-menu). De tests vallen terug op de systeem-Chrome als Playwright's Chromium ontbreekt.
- Proces: `CLAUDE.md` met de regels voor elke AI-sessie. Deze release vervangt de handmatige live-aanpassing van 06/11 (artifact-versie 1793967674-6087), die buiten de repo gebeurde.

## v1.2.0 · 06/11/2026 · voorstel is geen waarde
- Logging: grey italic = suggestion (plan, else last time); black = confirmed or typed. Only confirmed sets are saved as done.
- One tap per set (✓) confirms the suggestion; focus jumps to the next set. Typing a deviation confirms that set.
- "Neem plan over" is now "Alles zoals gepland". RPE is never filled in for you.
- Progress per exercise: "2 van 4 sets".
- Fix: extra plates on the block machine were rounded to 0,5 kg (blok 10 + 2,3 showed as 2,5); now 0,1 kg.
- UX audit: suggestion text must meet contrast AA (new MUST rule).

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
