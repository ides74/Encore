#!/usr/bin/env python3
"""Import the published page into src/ (one-time, or to pull a hotfix made outside the repo).
Usage: python3 tools/import_live.py upstream/live-<version>.html
Splits: the viewer skeleton (line 1) is dropped, <style> goes to src/styles.css, the script is split
at its '// ---------- name ----------' markers into src/js/NN-name.js, the rest is the template.
Then rebuilds and checks the build reproduces the live page byte for byte (lossless import)."""
import os, re, sys, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKEL_END = '<body>\n'
TAIL = '\n</body></html>'

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:32] or 'part'

def main(path):
    live = open(path, encoding='utf-8').read()
    i = live.index(SKEL_END) + len(SKEL_END)
    assert live.endswith(TAIL), 'unexpected page end'
    body = live[i:-len(TAIL)]
    s0 = body.index('<style>\n') + len('<style>\n'); s1 = body.index('</style>', s0)
    j0 = body.index('<script>\n') + len('<script>\n'); j1 = body.rindex('</script>')
    css, js = body[s0:s1], body[j0:j1]
    tpl = body[:s0] + '/*@@CSS@@*/' + body[s1:j0] + '/*@@JS@@*/' + body[j1:]
    open(os.path.join(ROOT, 'src/styles.css'), 'w', encoding='utf-8').write(css)
    open(os.path.join(ROOT, 'src/index.template.html'), 'w', encoding='utf-8').write(tpl)
    jsdir = os.path.join(ROOT, 'src/js')
    for f in os.listdir(jsdir):
        if re.match(r'^\d\d-.*\.js$', f) and "testhook" not in f: os.remove(os.path.join(jsdir, f))
    parts = re.split(r'(?m)^(?=  // ---------- .+ ----------$)', js)
    names = ['start'] + [slug(re.match(r'  // ---------- (.+) ----------', p).group(1)) for p in parts[1:]]
    for n, (name, part) in enumerate(zip(names, parts)):
        open(os.path.join(jsdir, f'{n * 2 + 10:02d}-{name}.js'), 'w', encoding='utf-8').write(part)
    print(f'imported {len(parts)} script modules')
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools/build.py'), '--compare', path], check=True)

if __name__ == '__main__':
    main(sys.argv[1])
