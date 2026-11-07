# Changelog

## v1.5.0 · 07/11/2026 · gymscherm dummy proof
- Gymscherm: groot setnummer ("SET 2 van 4", 44 px) met de planregel eronder (20 px).
- Knop "↶ Terug" links in de vaste balk: maakt de laatste tik ongedaan (set bevestigd, opwarmset, set toegevoegd of weg, score, sprong naar andere oefening, opwarming, finisher, extra gewichtje). Kopie van training en scherm, max 30 stappen; stopt de rusttimer bij een ongedane set. "Set leegmaken" is weg.
- Codebalk met grote knoppen (A1 A2 B1 … ✓ klaar, minstens 68 px, sets gedaan/gepland) in plaats van bolletjes en ‹ ›. Vegen blijft.
- Evaluatie na de laatste set: groot tekstvak (dicteren via het toetsenbord) en scores 1 tot 10 als knoppen; opnieuw tikken maakt leeg.
- Twee sporen (A1 > B1 > C1 en A2 > B2 > C2): na elke set naar het actieve van het andere spoor; F en codes zonder nummer op het einde. Na "Set klaar" springt de gymmodus meteen naar de volgende oefening; zelfde logica voor "Volgende" in de timer.
- Groter in gymmodus: velden 88 px (cijfers 64 px), ± 88 px, "Set klaar" 28 px, setlijst 20 px, opwarming 22 px met ✓ van 52 px.
- Records per periode: zwaarste ooit, of beste van 12, 6 of 3 maanden voor dat aantal reps; KPI "Records" in rapport en samenvatting telt dezelfde records.
- Rapport: positie in het blok volgens het schema ("training 4 van 8"), volgende training met week, rust volgens het voorstel; disclaimers "Over dit rapport" (Business Markers ism I-Ticket BV) en juridische disclaimer in PDF en mail.
- Sets zonder reps in het plan (sled push 3 × 20 m): gewicht volstaat om te bevestigen (veld `ok`).
- Fix gsm: lange knoptekst maakte de pagina breder (uitzoomen); meldingsballon bedekte Terug; timer en vaste balk compacter op de gsm.

## v1.4.2 · 07/11/2026 · opwarming, finisher, grafieken per reeks
- Algemene opwarming per training (standaard "Roeien 2 min (±500 m)", aanvinken), nieuw optioneel veld `genWarm`.
- Finisher na de training (roeisprint, sled push, …) met resultaat, nieuw optioneel veld `fins`; in samenvatting, rapport en motivatietekst.
- Grafieken: trendlijn en signaal enkel op de A-reeks (en oude topsets); B/C-metingen als ◇ apart. Rapportgrafieken vergelijken binnen dezelfde reeks. Historiek krijgt `rk` per meting.
- Burpees (eenheid reps) tonen het aantal reps in het rapport.

## v1.4.1 · 07/11/2026 · toestel en rusttimer
- Toestel (pulldown): kleine blok 2,75 kg altijd mee + grote blokken × 5,5 kg + extra gewichtje 2,3 of 4,6 kg. Invoer: bloknummer (max 18) + extra als knoppen. Config `bigBlock`, `smallBlock`.
- Rusttimer vast bovenaan zolang je traint (ook zonder rust), inhoud schuift eronder. Voorstel rusttijd volgens type oefening, reps en fase (★ met uitleg), schema-rust blijft kiesbaar; gekozen rust geldt voor de volgende sets (`restPick`).
- Fix: reps typen en meteen "Set klaar" tikken startte de rust bij het verlaten van het veld, waardoor het scherm versprong en de tik verloren ging. In de gymmodus start enkel "Set klaar" de rust.

## v1.4.0 · 07/11/2026 · na de eerste training
- RPE per set weg; evaluatie per oefening (score en wat te moeilijk). Zonder RPE rekent de app met de RIR uit het plan (`rirSrc: 'plan'`).
- Groter: basistekst 17 px, niets onder 13 px; "+ Extra set" groot; "Training afronden" i.p.v. "Klaar"; oefening klaar duidelijk in beeld.
- Controle: onmogelijk gewicht of reps geweigerd; dumbbells: "Kg per dumbbell (2 ×)" of "Kg (1 dumbbell)", 32 waar 16 gepland vraagt "2 × 16?"; opwarmset zo zwaar als een werkset: voorstel om te verplaatsen; onvolledige sets bij afronden. Een set is pas klaar met reps.
- Rusttimer: rusttijd kiezen met knoppen, superset-volgorde, geluidschakelaar AAN/UIT met testtoon, geluid ook in stille modus (audioSession, html-audio).
- Motiverend verslag (records per aantal reps, alles afgewerkt, meer volume, event); "Verstuur nu" via Gmail `send_message` naast "Concept in Gmail" (op vraag van Ides).
- Planning: 12-wekenplan (4 fases van 3 weken, golvend of lineair) met jaarlijn en event.
- Data (geen code): testsessies 6/11 verwijderd, sessie 7/11 gecorrigeerd.

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
