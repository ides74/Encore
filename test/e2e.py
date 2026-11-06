"""End-to-end and unit runs on dist/test.html with a mocked runtime. Usage: python3 test/e2e.py [--shots]
Every check prints PASS/FAIL; the last line is 'N passed, M failed'. --shots also saves screenshots to test/shots/."""
import os, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import new_context, open_page, DEVICES
SHOTS = os.path.join(os.path.dirname(__file__), 'shots'); os.makedirs(SHOTS, exist_ok=True)
TABS = ['overview', 'planning', 'training', 'progress', 'stats', 'history', 'intake', 'event', 'exercises']
R = {'pass': 0, 'fail': 0}; UX = []
def check(name, ok, info=''):
    R['pass' if ok else 'fail'] += 1; print(('PASS ' if ok else 'FAIL ') + name + (f'  [{info}]' if info and not ok else ''))
def clean(page, name):
    check(name + ': no errors', not page._errs, '; '.join(page._errs[:3])); page._errs.clear()
def shot(page, name):
    if '--shots' in sys.argv: page.screenshot(path=os.path.join(SHOTS, name + '.png'), full_page=True)
def goto(page, v):
    page.click(f'.tab[data-v="{v}"]'); page.wait_for_timeout(120)

def unit(b):
    ctx = new_context(b); p = open_page(ctx, 'test-klant', 'planning')
    T = lambda js: p.evaluate('(() => { const a = window.__EC_TEST__.api; return ' + js + '; })()')
    cases = [
        ('% 1RM table: 5 reps = 85%', 'a.pctTable(5)', 0.85),
        ('% 1RM table: 10 reps = 74%', 'a.pctTable(10)', 0.74),
        ('RPE 8 = RIR 2', 'a.rpeToRir(8)', 2), ('RIR 1 = RPE 9', 'a.rirToRpe(1)', 9), ('RPE 10 = RIR 0', 'a.rpeToRir(10)', 0),
        ('6 reps = functionele hypertrofie', 'a.adaptOf(6)[2]', 'Functionele hypertrofie'),
        ('tempo 30X0 = 4 s per rep', "a.tempoSec('30X0')", 4), ('tempo invalid = null', "a.tempoSec('Max.')", None),
        ('Herstel: 4 sets -50% = 2', 'a.cutSets(4, 50)', 2), ('deload never below 1 set', 'a.cutSets(1, 67)', 1),
        ('bodyweight: LG 80 + 10 = 90', 'a.bwTotal(10, 80)', 90), ('bodyweight auto: 50 kg at 80 bw = total', "a.bwIsTotal(50, 80, 'auto')", True),
        ('block: 10 + 2,3 kg at 6,4 = 66,3', "a.setKg({blocks: 10, extra: 2.3}, 'pulldown-chin-up-toestel')", 66.3),
        ('old method name mapped', "a.normMethod('Straight sets')", 'Standard Sets'),
        ('old phase Ontlasting = Herstel', "a.phaseOf('Ontlasting')", 'Herstel'),
        ('rest Intensificatie A = 180 s', "a.restFor('Intensificatie', 'A')", 180),
        ('weekdays Wo/Za become T1/T2', "JSON.stringify(a.legacyMap(a.S.blocks['acc-old']))", '{"Wo":"T1","Za":"T2"}'),
        ('warm-up A, 5 reps (Stijn): 6x50%, 4x70%, 2x90%', "JSON.stringify(a.warmupPlan({exId:'bench-press-plat-bb',code:'A1',setPlan:[{kg:60,reps:5}]}))", '[{"kg":30,"reps":6},{"kg":42.5,"reps":4},{"kg":55,"reps":2}]'),
        ('warm-up A, 8 reps (Stijn): 6x50%, 4x75%', "JSON.stringify(a.warmupPlan({exId:'bench-press-plat-bb',code:'A1',setPlan:[{kg:60,reps:8}]}))", '[{"kg":30,"reps":6},{"kg":45,"reps":4}]'),
        ('no warm-up for C-series', "a.warmupPlan({exId:'bench-press-plat-bb',code:'C1',setPlan:[{kg:60,reps:8}]}).length", 0),
        ('block 10 + 2,3 kg: 66,3 kg shows as blok 10 + 2,3', "(() => { const k = 66.3, b = Math.floor(k / a.kgPerBlock()); return b + ' + ' + Math.round((k - b * a.kgPerBlock()) * 10) / 10; })()", '10 + 2.3'),
        ('schema Int 25 has 2 trainings', "a.slotsOf(a.S.blocks['int-25']).join(',')", 'T1,T2'),
    ]
    for name, js, want in cases:
        got = T(js); ok = (abs(got - want) < 1e-9) if isinstance(want, float) else got == want
        check('unit: ' + name, ok, f'got {got!r}')
    clean(p, 'unit'); ctx.close()

def flows(b):
    # 1. home, coach filter
    ctx = new_context(b); p = open_page(ctx)
    check('home lists both clients', p.locator('#client-sel option').count() == 3)
    clean(p, 'home'); shot(p, '00_home_desktop'); ctx.close()
    # 2. every tab on every device: renders, no errors, no sideways scroll
    for dev in DEVICES:
        ctx = new_context(b, dev); p = open_page(ctx, 'test-klant', 'overview')
        for v in TABS:
            goto(p, v)
            check(f'{dev} {v}: renders', p.locator('#main').inner_text().strip() != '')
            over = p.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            check(f'{dev} {v}: no sideways scroll', over <= 1, f'{over}px too wide')
            if DEVICES[dev][1]:
                small = p.evaluate("[...document.querySelectorAll('#main button:not([hidden]),#main input,#main select')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.height<40}).length")
                UX.append((dev, v, small))
            shot(p, f'{dev}_{v}')
        clean(p, dev); ctx.close()
    # 3. planning: schema 25 and the legacy conversions
    ctx = new_context(b); p = open_page(ctx, 'test-klant', 'planning')
    txt = p.locator('#main').inner_text()
    check('planning shows Int 25', 'Int 25' in txt)
    check('legacy block: Ontlasting shown as Herstel', 'Ontlasting' not in txt)
    clean(p, 'planning'); ctx.close()
    # 4. log a training: plan in, reps, save, client stats updated, survives reload
    ctx = new_context(b, 'ipad-landscape'); p = open_page(ctx, 'test-klant', 'training')
    p.select_option('#nt-block', 'int-25'); p.wait_for_timeout(100)
    p.click('[data-act="start-slot"][data-slot="T1"]'); p.wait_for_timeout(150)
    n_ex = p.locator('.ex-card').count(); check('T1 opens with 6 exercises', n_ex == 6, str(n_ex))
    p.click('.ex-card >> nth=1 >> [data-act="copy-plan"]'); p.wait_for_timeout(100)
    p.fill('#s-1-0-reps', '7'); p.fill('#s-1-0-rpe', '9'); p.dispatch_event('#s-1-0-rpe', 'change'); p.wait_for_timeout(100)
    p.click('[data-act="done-training"]'); p.wait_for_timeout(400)
    data = p.evaluate('window.__mock.data()')
    new = [k for k in data if k.startswith('clients/test-klant/sessions/') and k not in ('clients/test-klant/sessions/s-1', 'clients/test-klant/sessions/s-2')]
    check('training saved as a session', len(new) == 1, str(new))
    if new:
        s = data[new[0]]; e = next((x for x in s['entries'] if x['exId'] == 'bench-press-plat-bb'), None)
        check('saved set has plan kg and logged reps/RPE', bool(e) and str(e['sets'][0].get('kg')) in ('52', '52.0') and str(e['sets'][0].get('reps')) == '7', json.dumps(e and e['sets'][0]))
    check('client stats updated (3 sessions)', data['clients/test-klant']['stats']['sessionCount'] == 3, json.dumps(data['clients/test-klant']['stats']))
    clean(p, 'log training'); p.reload(); p.wait_for_timeout(600)
    check('after reload the training is in history', len([k for k in p.evaluate('window.__mock.data()') if '/sessions/' in k]) == 3)
    ctx.close()
    # 5. read-only viewer: notice, no start buttons, no writes
    ctx = new_context(b, mock={'readOnly': True}); p = open_page(ctx, 'test-klant', 'training')
    check('read-only: notice shown', 'Alleen lezen' in p.locator('#main').inner_text())
    check('read-only: start disabled', p.locator('[data-act="start-slot"][disabled]').count() >= 1)
    check('read-only: nothing written', p.evaluate('window.__writes.length') == 0)
    clean(p, 'read-only'); ctx.close()
    # 6. no database (opened outside claude.ai)
    ctx = new_context(b, mock={'noDb': True}); p = open_page(ctx)
    check('no db: clear message', 'claude.ai' in p.locator('#main').inner_text()); ctx.close()
    # 7. write failure: user is told, nothing silently lost
    ctx = new_context(b, mock={'failWrites': True}); p = open_page(ctx, 'test-klant', 'training')
    p.select_option('#nt-block', 'int-25'); p.click('[data-act="start-slot"][data-slot="T1"]'); p.wait_for_timeout(120)
    p.fill('#s-1-0-reps', '7'); p.dispatch_event('#s-1-0-reps', 'change'); p.click('[data-act="done-training"]'); p.wait_for_timeout(300)
    body = p.locator('body').inner_text()
    check('write failure: shown to user', 'lukte niet' in body or 'Niet opgeslagen' in body)
    check('write failure: draft kept on screen', p.locator('.ex-card').count() == 6)
    p._errs = [e for e in p._errs if 'unavailable' not in e]; clean(p, 'write failure'); ctx.close()
    # 8. coach edits on another device while the client is logging: draft is not thrown away
    ctx = new_context(b); p = open_page(ctx, 'test-klant', 'training')
    p.select_option('#nt-block', 'int-25'); p.click('[data-act="start-slot"][data-slot="T1"]'); p.wait_for_timeout(120)
    p.fill('#s-1-0-reps', '6'); p.dispatch_event('#s-1-0-reps', 'change')
    p.evaluate("window.__remoteSet('clients/test-klant/blocks/int-25', Object.assign({}, window.__mock.data()['clients/test-klant/blocks/int-25'], {goal: 'Gewijzigd'}))"); p.wait_for_timeout(300)
    check('remote change: logged reps still there', p.input_value('#s-1-0-reps') == '6')
    clean(p, 'remote change'); ctx.close()
    # 9. dark mode renders
    ctx = new_context(b, 'phone', dark=True); p = open_page(ctx, 'test-klant', 'training'); shot(p, 'phone_training_dark'); clean(p, 'dark'); ctx.close()

with sync_playwright() as pw:
    b = pw.chromium.launch()
    unit(b); flows(b)
    b.close()
print('UX touch targets under 40 px (device, tab, count):', ' '.join(f'{d}/{v}={n}' for d, v, n in UX if n))
print(f"{R['pass']} passed, {R['fail']} failed")
