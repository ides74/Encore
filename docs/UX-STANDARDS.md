# UX standards

The full standard and the release checklist (U1 to U17) live in the shared doc "BuMa UX-standaarden en checklist":
https://claude.ai/artifact/2njWgZdWfmw4pBqdpzcSQy

- Automatic rules U1 to U10: `python3 test/ux_audit.py --strict` in `tools/check_all.sh`: MUST rules block a release.
- Static rule (no hard-coded colours, tokens.css in the build): `tools/lint_ux.py`.
- U17 version visible: `test/e2e.py`.
- Manual rules U11 to U16: 10 minutes on iPad and phone before every publish (see `docs/RELEASE.md`, step 8).

Baseline audit v1.0.1 (06/11/2026): U2 contrast FAIL 36/72 screens, U3 labels FAIL 8/72, U7 touch targets, U8 input 16 px, U9 text 12 px and U10 one primary button as warnings.

v1.1.0 (06/11/2026): all automatic rules green on 72 screens.
