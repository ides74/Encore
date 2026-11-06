#!/usr/bin/env python3
"""Static UX checks on the source (BuMa UX standard). Exit 1 on a violation.
- No hard-coded colours (#rrggbb, rgb()) in src/js: screens use the CSS variables from styles.css/tokens.css.
- tokens.css is present and part of the build."""
import os, re, sys, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bad = []
for f in sorted(glob.glob(os.path.join(ROOT, 'src/js/*.js'))):
    for n, line in enumerate(open(f, encoding='utf-8'), 1):
        for m in re.finditer(r'#[0-9A-Fa-f]{6}\b|\brgba?\(\s*\d', line):
            bad.append(f'{os.path.basename(f)}:{n}: hard-coded colour {m.group(0)}: use a var(--token)')
if not os.path.exists(os.path.join(ROOT, 'src/tokens.css')): bad.append('src/tokens.css missing')
built = open(os.path.join(ROOT, 'dist/index.html'), encoding='utf-8').read()
if '--accent-text' not in built: bad.append('dist/index.html does not contain tokens.css')
print('\n'.join(bad) if bad else 'lint ux ok: no hard-coded colours, tokens.css in the build')
sys.exit(1 if bad else 0)
