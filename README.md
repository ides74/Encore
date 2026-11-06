# EnCORE Coach

Coaching logbook for EnCORE Coaching (Stijn Aps and coaches): clients, periods (schemas), training log, progress, statistics, intake, event preparation, exercise library.
Published as a claude.ai artifact with a shared database. This repository holds the source, the tests and the release history.

## Golden rules (same as PVS and the OGSM cockpit)
1. No publish without `./tools/check_all.sh` ending in `ALL GREEN`.
2. Every release: new number in `VERSION`, a line in `CHANGELOG.md`, the version visible under the app.
3. A fixed bug gets a test, so it cannot come back.
4. A new schema is data, not code: it goes into the database, never into the source.
5. The live page is never edited by hand. Change `src/`, test, publish `dist/index.html`.
6. No real client data in this repository: tests run on `test/fixtures/seed.json` (fake clients).

## Run
```
pip install playwright && playwright install chromium     # once
./tools/check_all.sh            # build + syntax + unit + end-to-end on 4 devices
./tools/check_all.sh --shots    # same, plus screenshots in test/shots/ for the UX review
```
Working with an AI assistant: `CLAUDE.md` holds the rules it must follow. See `docs/ARCHITECTURE.md` (what happens where), `docs/RELEASE.md` (how an upgrade goes live), `docs/TESTPLAN.md`, `docs/BACKLOG.md`.
