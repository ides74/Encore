#!/usr/bin/env python3
"""Assemble dist/index.html (the file that is published) from src/.
Usage: python3 tools/build.py [--check] [--test] [--compare upstream/live.html]
  --check    syntax check of the assembled script with node
  --test     also build dist/test.html with the test hook (src/js/55-testhook.js); never published
  --compare  check that the production build equals a live page (lossless import / no drift)"""
import os, re, sys, glob, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION = open(os.path.join(ROOT, 'VERSION')).read().strip()
SKELETON = None  # first line of a live page; only used by --compare

def assemble(test):
    tpl = open(os.path.join(ROOT, 'src/index.template.html'), encoding='utf-8').read()
    css = open(os.path.join(ROOT, 'src/styles.css'), encoding='utf-8').read()
    tok = os.path.join(ROOT, 'src/tokens.css')   # BuMa UX standard, loaded last so it wins
    if os.path.exists(tok): css += open(tok, encoding='utf-8').read()
    files = sorted(glob.glob(os.path.join(ROOT, 'src/js/[0-9][0-9]-*.js')))
    if not test: files = [f for f in files if 'testhook' not in os.path.basename(f)]
    js = ''.join(open(f, encoding='utf-8').read() for f in files)
    out = tpl.replace('/*@@CSS@@*/', css).replace('/*@@JS@@*/', js).replace('@@VERSION@@', 'v' + VERSION)
    assert '@@' not in out, 'unreplaced placeholder'
    return out, len(files)

def syntax(out):
    tmp = os.path.join(ROOT, 'dist/.check.js')
    open(tmp, 'w', encoding='utf-8').write('\n;\n'.join(re.findall(r'<script>(.*?)</script>', out, re.S)))
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True); os.remove(tmp)
    if r.returncode: print(r.stderr); sys.exit(1)

def main():
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    out, n = assemble(False)
    open(os.path.join(ROOT, 'dist/index.html'), 'w', encoding='utf-8').write(out)
    print(f'built dist/index.html v{VERSION}: {len(out) // 1024} KB, {n} modules')
    if '--check' in sys.argv: syntax(out); print('syntax ok')
    if '--test' in sys.argv:
        t, _ = assemble(True); open(os.path.join(ROOT, 'dist/test.html'), 'w', encoding='utf-8').write(t); syntax(t); print('built dist/test.html (test hook)')
    if '--compare' in sys.argv:
        live = open(sys.argv[sys.argv.index('--compare') + 1], encoding='utf-8').read()
        body = live[live.index('<body>\n') + 7:-len('\n</body></html>')]
        if body != out:
            a, b = body, out; k = next(i for i in range(min(len(a), len(b)) + 1) if i == min(len(a), len(b)) or a[i] != b[i])
            print('DIFF at char', k, repr(a[k - 40:k + 40]), '!=', repr(b[k - 40:k + 40])); sys.exit(1)
        print('compare ok: build equals the live page')

if __name__ == '__main__':
    main()
