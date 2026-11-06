#!/usr/bin/env bash
# The gate before every publish. Ends in ALL GREEN or exits 1.
#   1 build + syntax   2 changelog line   3 static UX lint   4 unit + end-to-end on 4 devices   5 UX audit (MUST rules block)
set -e
cd "$(dirname "$0")/.."
python3 tools/build.py --check --test
grep -q "v$(cat VERSION)" CHANGELOG.md || { echo "CHANGELOG.md has no line for v$(cat VERSION)"; exit 1; }
python3 tools/lint_ux.py
python3 test/e2e.py "$@" | tee /tmp/encore_coach_e2e.log | grep -E '^FAIL|passed'
grep -q ', 0 failed' /tmp/encore_coach_e2e.log || exit 1
python3 test/ux_audit.py --strict | tee /tmp/encore_coach_ux.log
echo "ALL GREEN: v$(cat VERSION) ready to publish"
