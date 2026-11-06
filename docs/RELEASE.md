# Release: how an upgrade goes live

1. **Pull live first.** Download the live page to `upstream/` and run `python3 tools/build.py --compare upstream/live-<version>.html`. If it differs, someone changed the live page outside the repo: import it first (`tools/import_live.py`), commit, then start your change.
2. **Branch.** `git checkout -b fix/<what>` or `feat/<what>`.
3. **Change `src/`** and add or adapt a test for it.
4. **Gate.** `./tools/check_all.sh --shots`, look at the screenshots of the screens you touched (phone and iPad).
5. **Version.** `VERSION` up (fix 1.0.x, feature 1.x.0, data model change x.0.0) and a line in `CHANGELOG.md`.
6. **Merge and tag.** `git merge`, `git tag v<version>`, push to GitHub.
7. **Publish** `dist/index.html` to the existing artifact (same link, data stays). Never `dist/test.html`.
8. **Smoke test live** on iPad and phone: open client, Planning, log one set, delete it.
9. **Data model changes** (new field, renamed phase): the page must still read the old form (see `phaseOf`, `normMethod`, `legacyMap`) and the fixture gets an old-form example.
