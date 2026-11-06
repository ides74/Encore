"""Automated UX audit against docs/UX-STANDARDS.md. Usage: python3 test/ux_audit.py [--strict]
Measures every tab on every device, light and dark: touch targets, font sizes, input font (iOS zoom),
text contrast (WCAG AA), sideways scroll, unlabeled fields, primary buttons per screen, focus ring.
Prints one line per rule with the worst cases. --strict exits 1 when a MUST rule fails (for check_all)."""
import os, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import new_context, open_page, DEVICES
TABS = ['overview', 'planning', 'training', 'progress', 'stats', 'history', 'intake', 'event', 'exercises']
JS = r"""() => {
  const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const rgb = c => { const v = (c.match(/[\d.]+/g) || [0,0,0,0]).map(Number); return c.startsWith('color(') ? v.map((x, i) => i < 3 ? x * 255 : x) : v; };
  const lum = ([r,g,b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126*f(r) + .7152*f(g) + .0722*f(b); };
  const bgOf = e => { for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length < 4 || c[3] > .5) return c; } return [255,255,255]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x,y) + .05) / (Math.min(x,y) + .05); };
  const main = document.querySelector('.app') || document.body;
  const ctrls = [...main.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,summary')].filter(vis);
  const small = ctrls.filter(e => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).map(e => (e.dataset.act || e.id || e.tagName.toLowerCase()) + ' ' + Math.round(e.getBoundingClientRect().height));
  const inputs = [...main.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea')].filter(vis);
  const zoom = inputs.filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).length;
  const unlabeled = inputs.filter(e => !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).map(e => e.id || e.dataset.f || 'input');
  const texts = [...main.querySelectorAll('*')].filter(e => vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  const tiny = texts.filter(e => parseFloat(getComputedStyle(e).fontSize) < 12).map(e => e.className || e.tagName);
  const lowc = texts.map(e => { const s = getComputedStyle(e), fs = parseFloat(s.fontSize), bold = +s.fontWeight >= 700; const need = (fs >= 24 || (bold && fs >= 18.5)) ? 3 : 4.5; const r = ratio(rgb(s.color), bgOf(e)); return r < need ? `${(e.className || e.tagName).toString().slice(0,24)} ${r.toFixed(1)}` : null; }).filter(Boolean);
  const primaries = [...main.querySelectorAll('.btn.primary')].filter(vis).length;
  return { ctrls: ctrls.length, small, zoom, inputs: inputs.length, unlabeled, tiny, lowc, primaries,
           over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
}"""
res = []
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for dark in (False, True):
        for dev in DEVICES:
            ctx = new_context(b, dev, dark=dark); p = open_page(ctx, 'test-klant', 'overview')
            for v in TABS:
                p.click(f'.tab[data-v="{v}"]'); p.wait_for_timeout(100)
                if v == 'training':  # audit the logging screen itself, not the picker
                    p.select_option('#nt-block', 'int-25'); p.click('[data-act="start-slot"][data-slot="T1"]'); p.wait_for_timeout(150)
                r = p.evaluate(JS); r.update(dev=dev, tab=v, dark=dark); res.append(r)
                if v == 'training': p.click('[data-act="done-training"]'); p.wait_for_timeout(100)
            # focus ring: tab to the first control and check an outline is drawn
            p.keyboard.press('Tab'); ring = p.evaluate("(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; })()")
            res.append({'dev': dev, 'tab': '_focus', 'dark': dark, 'ring': ring}); ctx.close()
    b.close()
json.dump(res, open(os.path.join(os.path.dirname(__file__), 'ux_audit.json'), 'w'), indent=1)
pages = [r for r in res if r['tab'] != '_focus']; touch = [r for r in pages if DEVICES[r['dev']][1]]
def line(rule, level, bad, total, worst):
    print(f"{'OK  ' if not bad else ('FAIL' if level == 'MUST' else 'WARN')} [{level}] {rule}: {bad}/{total} screens" + (f"  e.g. {worst}" if worst else ''))
    return level == 'MUST' and bad
fails = 0
fails += line('no sideways scroll', 'MUST', sum(r['over'] > 1 for r in pages), len(pages), ', '.join(f"{r['dev']}/{r['tab']}" for r in pages if r['over'] > 1)[:120])
fails += line('text contrast >= 4.5:1 (AA)', 'MUST', sum(bool(r['lowc']) for r in pages), len(pages), '; '.join(sorted({x for r in pages for x in r['lowc']}))[:200])
fails += line('every field has a label', 'MUST', sum(bool(r['unlabeled']) for r in pages), len(pages), ', '.join(sorted({f"{r['tab']}:{x}" for r in pages for x in r['unlabeled']}))[:200])
fails += line('focus ring visible (keyboard)', 'MUST', sum(not r['ring'] for r in res if r['tab'] == '_focus'), len(DEVICES) * 2, '')
line('touch targets >= 44 px (iPad, phone)', 'SHOULD', sum(bool(r['small']) for r in touch), len(touch), ', '.join(f"{r['tab']}={len(r['small'])}/{r['ctrls']}" for r in touch if r['dev'] == 'ipad-landscape' and not r['dark']))
line('input text >= 16 px (no iOS zoom)', 'SHOULD', sum(r['zoom'] > 0 for r in touch), len(touch), ', '.join(f"{r['tab']}={r['zoom']}/{r['inputs']}" for r in touch if r['dev'] == 'phone' and not r['dark'] and r['zoom']))
line('no text under 12 px', 'SHOULD', sum(bool(r['tiny']) for r in pages), len(pages), ', '.join(sorted({str(x)[:20] for r in pages for x in r['tiny']}))[:160])
line('max 1 primary button per screen', 'SHOULD', sum(r['primaries'] > 1 for r in pages), len(pages), ', '.join(sorted({f"{r['tab']}={r['primaries']}" for r in pages if r['primaries'] > 1})))
if '--strict' in sys.argv and fails: sys.exit(1)
