#!/usr/bin/env bash
# The gate before every publish: build, syntax, unit + end-to-end runs on 4 devices. Ends in ALL GREEN or exits 1.
set -e
cd "$(dirname "$0")/.."
python3 tools/build.py --check --test
grep -q "v$(cat VERSION)" CHANGELOG.md || { echo "CHANGELOG.md has no line for v$(cat VERSION)"; exit 1; }
python3 test/e2e.py "$@" | tee /tmp/encore_coach_e2e.log | grep -E '^FAIL|passed'
grep -q ', 0 failed' /tmp/encore_coach_e2e.log && echo "ALL GREEN: v$(cat VERSION) ready to publish"
