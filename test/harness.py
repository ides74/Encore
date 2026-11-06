"""Opens dist/test.html the way the artifact viewer does: wrapped in the viewer skeleton, fonts stubbed,
every other network request blocked (like the real CSP), runtime mocked (mock_runtime.js) with the seed data."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SKELETON = ('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
            'body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n{BODY}\n</body></html>')
SEED = json.load(open(os.path.join(HERE, 'fixtures/seed.json'), encoding='utf-8'))
DEVICES = {  # name: viewport, touch
    'desktop': ({'width': 1366, 'height': 900}, False),
    'ipad-landscape': ({'width': 1180, 'height': 820}, True),
    'ipad-portrait': ({'width': 820, 'height': 1180}, True),
    'phone': ({'width': 390, 'height': 844}, True),
}

def launch(pw):
    """Playwright's own Chromium when installed, otherwise the system Chrome (CI or a machine without the download)."""
    try: return pw.chromium.launch()
    except Exception: return pw.chromium.launch(channel='chrome')

def route(r):
    u = r.request.url
    if u.startswith('https://encore.local/'):
        body = open(os.path.join(ROOT, 'dist/test.html'), encoding='utf-8').read()
        return r.fulfill(body=SKELETON.replace('{BODY}', body), content_type='text/html; charset=utf-8')
    if 'fonts.g' in u: return r.fulfill(body='', content_type='text/css')
    return r.abort()

def new_context(browser, device='desktop', mock=None, dark=False):
    vp, touch = DEVICES[device]
    m = dict(mock or {}); m.setdefault('seed', SEED)
    ctx = browser.new_context(viewport=vp, has_touch=touch, is_mobile=touch and vp['width'] < 600, color_scheme='dark' if dark else 'light', locale='nl-BE')
    ctx.add_init_script('window.__MOCK=' + json.dumps(m) + ';')
    ctx.add_init_script(path=os.path.join(HERE, 'mock_runtime.js'))
    ctx.route('**/*', route)
    return ctx

def open_page(ctx, client=None, view=None):
    page = ctx.new_page(); page._errs = []
    page.on('pageerror', lambda e: page._errs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: page._errs.append('console: ' + m.text) if m.type == 'error' else None)
    if client: page.add_init_script(f"try{{localStorage.setItem('ec.cid','{client}');localStorage.setItem('ec.view','{view or 'overview'}')}}catch(e){{}}")
    page.goto('https://encore.local/')
    page.wait_for_function("!document.querySelector('#main .empty') || !/laadt|laden/.test(document.querySelector('#main .empty').textContent)", timeout=15000)
    page.wait_for_timeout(150)
    return page
