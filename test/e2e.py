"""End-to-end and unit runs on dist/test.html with a mocked runtime. Usage: python3 test/e2e.py [--shots]
Every check prints PASS/FAIL; the last line is 'N passed, M failed'. --shots also saves screenshots to test/shots/."""
import os, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import new_context, open_page, DEVICES, launch
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
    # v1.3.0: on the phone Intake, Event and Oefeningen sit under "Meer"
    if not page.locator(f'.tab[data-v="{v}"]:visible').count(): page.click('details.more > summary'); page.wait_for_timeout(60)
    page.click(f'.tab[data-v="{v}"]:visible'); page.wait_for_timeout(120)
SWIPE = """(dx) => { const g = document.querySelector('#gym .gym-title'); const t = (x) => new Touch({ identifier: 1, target: g, clientX: x, clientY: 300 });
  g.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [t(300)], changedTouches: [t(300)] }));
  g.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t(300 + dx)] })); }"""

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
        ('block (Ides 07/11): small block 2,75 always + 10 x 5,5 + 2,3 = 60,05', "a.setKg({blocks: 10, extra: 2.3}, 'pulldown-chin-up-toestel')", 60.05),
        ('old method name mapped', "a.normMethod('Straight sets')", 'Standard Sets'),
        ('old phase Ontlasting = Herstel', "a.phaseOf('Ontlasting')", 'Herstel'),
        ('rest Intensificatie A = 180 s', "a.restFor('Intensificatie', 'A')", 180),
        ('weekdays Wo/Za become T1/T2', "JSON.stringify(a.legacyMap(a.S.blocks['acc-old']))", '{"Wo":"T1","Za":"T2"}'),
        ('warm-up A, 5 reps (Stijn): 6x50%, 4x70%, 2x90%', "JSON.stringify(a.warmupPlan({exId:'bench-press-plat-bb',code:'A1',setPlan:[{kg:60,reps:5}]}))", '[{"kg":30,"reps":6},{"kg":42.5,"reps":4},{"kg":55,"reps":2}]'),
        ('warm-up A, 8 reps (Stijn): 6x50%, 4x75%', "JSON.stringify(a.warmupPlan({exId:'bench-press-plat-bb',code:'A1',setPlan:[{kg:60,reps:8}]}))", '[{"kg":30,"reps":6},{"kg":45,"reps":4}]'),
        ('no warm-up for C-series', "a.warmupPlan({exId:'bench-press-plat-bb',code:'C1',setPlan:[{kg:60,reps:8}]}).length", 0),
        ('block: 60,05 kg is blok 10 + 2,3', "JSON.stringify(a.splitBlocks(60.05))", '{"blocks":10,"extra":2.3}'),
        ('block: 63,25 kg is blok 11 without extra', "JSON.stringify(a.splitBlocks(63.25))", '{"blocks":11,"extra":""}'),
        # v1.4.1 rest suggestion (Stijn, blog Rust): type of exercise, reps and phase
        ('rest suggestion: basic exercise 5-7 reps = 150 s', "a.restSuggest('bench-press-plat-bb', {code: 'A1', repsMin: 5, repsMax: 7}, 'Intensificatie').sec", 150),
        ('rest suggestion: 1-5 reps = 180 s', "a.restSuggest('bench-press-plat-bb', {code: 'A1', repsMin: 3, repsMax: 5}, 'Intensificatie').sec", 180),
        ('rest suggestion: C-series 8-10 reps = 60 s', "a.restSuggest('bench-press-plat-bb', {code: 'C1', repsMin: 8, repsMax: 10}, 'Accumulatie').sec", 60),
        ('rest suggestion: finisher none', "a.restSuggest('sled-push', {code: 'F1'}, 'Accumulatie')", None),
        # v1.4.0 impossible values (Ides 07/11: 567 kg typed instead of 57)
        ('567 kg on bench is refused', "a.weightIssue({exId: 'bench-press-plat-bb', target: {setPlan: [{kg: 60}]}, sets: []}, {kg: 567, reps: 7}).hard", True),
        ('dumbbell 32 where 16 per hand is planned: asks 2 x 16', "a.weightIssue({exId: 'db-shoulder-press-zittend', target: {setPlan: [{kg: 16}]}, sets: []}, {kg: 32, reps: 7}).fix", 16),
        ('block 19 does not exist (18 blocks)', "a.weightIssue({exId: 'pulldown-chin-up-toestel', target: {}, sets: []}, {blocks: 19, reps: 7}).hard", True),
        ('a set is only done with reps', "a.setDone({kg: 60}) + '|' + a.setDone({kg: 60, reps: 7}) + '|' + a.setDone({kg: 140, ok: true})", 'false|true|true'),
        ('schema Int 25 has 2 trainings', "a.slotsOf(a.S.blocks['int-25']).join(',')", 'T1,T2'),
        # v1.3.0 rest timer (Stijn: rest from the schema, the 10 s to confirm are already gone)
        ('rest 2 min starts at 1:50', 'a.mmss(a.restLeft(120))', '1:50'),
        ('rest 90 s starts at 80 s', 'a.restLeft(90)', 80),
        ('rest never below 5 s', 'a.restLeft(12)', 5),
        ('rest from the schema row', "a.restOf({code: 'B1', rest: 90}, 'Intensificatie')", 90),
        ('rest without schema value: phase default (Intensificatie A = 180 s)', "a.restOf({code: 'A1'}, 'Intensificatie')", 180),
        ('finisher: no rest timer', "a.restOf({code: 'F1', rest: 60}, 'Accumulatie')", None),
        ('timer at 11 s left: rest, no signal', "JSON.stringify((({phase, signal}) => [phase, signal])(a.restState({end: 11000, warned: false, rang: false}, 0)))", '["rest",0]'),
        ('timer at 10 s left: first signal', "JSON.stringify((({phase, signal}) => [phase, signal])(a.restState({end: 10000, warned: false, rang: false}, 0)))", '["soon",1]'),
        ('first signal only once', "a.restState({end: 10000, warned: true, rang: false}, 0).signal", 0),
        ('timer at 0: second signal', "JSON.stringify((({phase, signal}) => [phase, signal])(a.restState({end: 10000, warned: true, rang: false}, 10000)))", '["over",2]'),
        ('timer stops itself after 5 min over time', "a.restState({end: 0, warned: true, rang: true}, 301000).expired", True),
        ('plan line bodyweight without extra kg: LG', "a.kgPlanTxt('bw', null) + '|' + a.kgPlanTxt('bw', 0) + '|' + a.kgPlanTxt('kg', null)", 'LG|LG|?'),
    ]
    for name, js, want in cases:
        got = T(js); ok = (abs(got - want) < 1e-9) if isinstance(want, float) else got == want
        check('unit: ' + name, ok, f'got {got!r}')
    clean(p, 'unit'); ctx.close()

def flows(b):
    # 1. home, coach filter
    ctx = new_context(b); p = open_page(ctx)
    check('home lists both clients', p.locator('#client-sel option').count() == 3)
    ver = open(os.path.join(os.path.dirname(__file__), '..', 'VERSION')).read().strip()
    check('U17 version visible under the app', p.locator('.ver').inner_text().strip() == 'EnCORE Coach v' + ver, p.locator('.ver').inner_text())
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
    p.fill('#s-1-0-reps', '7'); p.dispatch_event('#s-1-0-reps', 'change'); p.wait_for_timeout(100)
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
    # 4b. v1.2.0 suggestion is not a value: grey until confirmed, one tap per set, RPE never assumed
    ctx = new_context(b, 'ipad-landscape'); p = open_page(ctx, 'test-klant', 'training')
    p.select_option('#nt-block', 'int-25'); p.click('[data-act="start-slot"][data-slot="T1"]'); p.wait_for_timeout(150)
    bench = '.ex-card >> nth=1'
    check('v1.2 suggestion shown grey, field still empty', p.input_value('#s-1-0-kg') == '' and p.get_attribute('#s-1-0-kg', 'placeholder') == '52')
    check('v1.2 progress starts at 0 of 4', '0 van 4 sets' in p.locator(bench + ' >> .setprog').inner_text())
    p.click('[data-act="confirm-set"][data-ei="1"][data-si="0"]'); p.wait_for_timeout(120)
    check('v1.2 one tap confirms set 1: kg and reps become values', p.input_value('#s-1-0-kg') == '52' and p.input_value('#s-1-0-reps') == '7', p.input_value('#s-1-0-kg') + '/' + p.input_value('#s-1-0-reps'))
    check('v1.4 no RPE per set any more (evaluation per exercise)', p.locator('#s-1-0-rpe').count() == 0)
    check('v1.2 confirmed set shows a check, progress 1 of 4', p.locator('#s-1-0-kg').locator('xpath=ancestor::tr').locator('.setok').count() == 1 and '1 van 4 sets' in p.locator(bench + ' >> .setprog').inner_text())
    check('v1.2 focus moves to the next set to confirm', p.evaluate("document.activeElement && document.activeElement.dataset.si") == '1')
    check('v1.4.1 ✓ starts the rest timer at the suggestion minus 10 s (basic 5-7 reps: 2,5 min = 2:20)', p.is_visible('#rest') and p.inner_text('#rest .t') in ('2:20', '2:19'), p.is_visible('#rest') and p.inner_text('#rest .t'))
    p.click('[data-act="rest-stop"]'); p.wait_for_timeout(60)
    check('v1.4.1 "Ik start nu" stops the timer, the timer bar stays (idle)', p.locator('#rest.idle').count() == 1)
    p.fill('#s-1-1-kg', '54'); p.fill('#s-1-1-reps', '6'); p.dispatch_event('#s-1-1-reps', 'change'); p.wait_for_timeout(100)
    check('v1.2 typing a deviation counts as confirmed', '2 van 4 sets' in p.locator(bench + ' >> .setprog').inner_text())
    p.click('[data-act="copy-plan"][data-ei="0"]'); p.wait_for_timeout(120)
    pd = p.locator('.ex-card >> nth=0 >> .setprog').inner_text()
    check('v1.2 "Alles zoals gepland" confirms every set of the exercise', '4 van 4 sets' in pd, pd)
    check('v1.2 block machine: suggestion confirmed as blok 10 + 2,3', p.input_value('#s-0-0-blocks') == '10' and p.input_value('#s-0-0-extra').replace(',', '.') == '2.3', p.input_value('#s-0-0-blocks') + '+' + p.input_value('#s-0-0-extra'))
    p.click('[data-act="done-training"]'); p.wait_for_timeout(400)
    data = p.evaluate('window.__mock.data()')
    s = [v for k, v in data.items() if '/sessions/' in k and k.split('/')[-1] not in ('s-1', 's-2')][0]
    bp = next(e for e in s['entries'] if e['exId'] == 'bench-press-plat-bb')
    check('v1.2 only confirmed sets are saved (2 of 4 bench sets)', len(bp['sets']) == 2, str(len(bp['sets'])))
    check('v1.2 the deviation is saved as typed', str(bp['sets'][1]['kg']) in ('54', '54.0') and str(bp['sets'][1]['reps']) == '6', json.dumps(bp['sets'][1]))
    ph = p.evaluate("""(() => { const i = document.createElement('input'); i.placeholder = 'x'; document.querySelector('.app').appendChild(i); const s = getComputedStyle(i, '::placeholder'); const r = [s.color, s.fontStyle]; i.remove(); return r; })()""")
    check('v1.2 suggestion style: muted colour and italic', ph[1] == 'italic' and ph[0] in ('rgb(110, 105, 99)',), str(ph))
    clean(p, 'v1.2 confirm'); ctx.close()
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
    # 10. v1.3.0 phone: gym mode, ± buttons, rest timer, swipe, warm-up ✓, LG, summary, 7 tabs
    ctx = new_context(b, 'phone'); p = open_page(ctx, 'test-klant', 'training')
    tabs = p.locator('nav.tabs > .tab:visible, nav.tabs > details > summary:visible').count()
    check('v1.3 phone shows at most 7 tabs (rest under Meer)', tabs == 7, str(tabs))
    p.select_option('#nt-block', 'int-25'); p.click('[data-act="start-slot"][data-slot="T1"]'); p.wait_for_timeout(150)
    check('v1.3 phone opens in gym mode, one exercise per screen', p.locator('#gym').count() == 1 and 'A1' in p.inner_text('.gym-title .code'))
    check('v1.3 gym: suggestion grey in the big field (blok 10)', p.input_value('#s-0-0-blocks') == '' and p.get_attribute('#s-0-0-blocks', 'placeholder') == '10')
    p.click('[data-act="step"][data-f="blocks"][data-d="1"]'); p.wait_for_timeout(60)
    check('v1.3 + button starts from the suggestion (10 + 1 = 11)', p.input_value('#s-0-0-blocks') == '11', p.input_value('#s-0-0-blocks'))
    check('v1.5 big set number: SET 1 van 4', 'set 1 van 4' in p.inner_text('.setno-big').lower(), p.inner_text('.setno-big'))
    cbh = p.evaluate("Math.min(...[...document.querySelectorAll('.codebar .cb')].map(b => b.getBoundingClientRect().height))")
    check('v1.5 code bar: every button at least 68 px high', cbh >= 68, str(cbh))
    p.click('.gym-ok[data-act="confirm-set"]'); p.wait_for_timeout(150)
    check('v1.5 two tracks: A1 set 1 done goes to A2', 'A2' in p.inner_text('.gym-title .code') and 'A2' in p.inner_text('.cb.cur'))
    check('v1.5 rest timer 2:20 (suggestion) and next = A2', p.inner_text('#rest .t') in ('2:20', '2:19') and 'A2' in p.inner_text('#rest'), p.inner_text('#rest'))
    p.click('[data-act="undo"]'); p.wait_for_timeout(150)
    check('v1.5 Terug: A1 set 1 open again, timer stopped', 'A1' in p.inner_text('.cb.cur') and '0/4' in p.inner_text('.cb[data-i="0"]') and p.locator('#rest.idle').count() == 1, p.inner_text('.codebar'))
    check('v1.5 Terug keeps what was typed before the tap (blok 11)', p.input_value('#s-0-0-blocks') == '11', p.input_value('#s-0-0-blocks'))
    p.click('.gym-ok[data-act="confirm-set"]'); p.wait_for_timeout(150)
    p.click('[data-act="rest-add"][data-d="15"]'); p.wait_for_timeout(60)
    check('v1.3 +15 s', p.inner_text('#rest .t') in ('2:35', '2:34'), p.inner_text('#rest .t'))
    p.click('[data-act="wset-ok"][data-ei="1"][data-wi="0"]'); p.wait_for_timeout(80)
    check('v1.3 warm-up set confirmed with ✓', p.get_attribute('[data-act="wset-ok"][data-ei="1"][data-wi="0"]', 'aria-pressed') == 'true')
    p.click('.gym-ok[data-act="confirm-set"]'); p.wait_for_timeout(120)
    check('v1.5 two tracks: A2 set done goes back to A1', 'A1' in p.inner_text('.cb.cur'))
    p.evaluate(SWIPE, -160); p.wait_for_timeout(150)
    check('v1.3 swipe left = next exercise (A2)', 'A2' in p.inner_text('.gym-title .code'))
    p.click('.cb[data-i="2"]'); p.wait_for_timeout(120)
    p.click('.gym-det > summary'); p.wait_for_timeout(60)
    check('v1.3 bodyweight plan line shows LG × 8', 'LG × 8' in p.inner_text('.gym-det'), p.inner_text('.gym-det')[:200])
    p.evaluate(SWIPE, 160); p.wait_for_timeout(150)
    check('v1.3 swipe right = previous exercise', 'A2' in p.inner_text('.gym-title .code'))
    shot(p, 'phone_gym')
    p.click('[data-act="done-training"]'); p.wait_for_timeout(400)
    sm = p.inner_text('#sum-modal') if p.locator('#sum-modal').count() else ''
    check('v1.3 Klaar shows the summary: plan versus done', 'Plan tegenover gedaan' in sm.title() or 'PLAN TEGENOVER GEDAAN' in sm.upper(), sm[:120])
    check('v1.3 summary: A1 1 of 4 sets, skipped exercise marked', '1 van 4 sets' in sm and 'Niet gedaan' in sm, sm[:400])
    check('v1.3 summary can go to client and coach', p.locator('#sum-modal [data-f="toClient"]').count() == 1 and p.locator('#sum-modal [data-f="toCoach"]').count() == 1)
    shot(p, 'phone_summary')
    data = p.evaluate('window.__mock.data()')
    s = [v for k, v in data.items() if '/sessions/' in k and k.split('/')[-1] not in ('s-1', 's-2')][0]
    pd = next(e for e in s['entries'] if e['exId'] == 'pulldown-chin-up-toestel'); bp = next(e for e in s['entries'] if e['exId'] == 'bench-press-plat-bb')
    check('v1.3 saved: + button value and the rest of the suggestion (blok 11 + 2,3 × 7)', pd['sets'][0]['blocks'] == 11 and abs((pd['sets'][0]['extra'] or 0) - 2.3) < 1e-9 and pd['sets'][0]['reps'] == 7, json.dumps(pd['sets'][0]))
    check('v1.4 saved: no RPE, RIR from the plan marked as plan, warm-up ✓', bp['sets'][0].get('rpe') is None and bp['sets'][0].get('rirSrc') == 'plan' and bp['warmup'][0].get('done') is True and bp['warmup'][1].get('done') is False, json.dumps([bp['sets'][0], bp['warmup']]))
    p.click('[data-act="sum-close"]'); p.wait_for_timeout(80)
    check('v1.3 summary closes', p.locator('#sum-modal .confirm').count() == 0)
    goto(p, 'intake'); check('v1.3 Meer > Intake opens the intake', p.evaluate('document.querySelector(".tab[aria-current=page], summary[aria-current=page]")?.textContent || ""').startswith('Intake'))
    clean(p, 'v1.3 phone gym'); ctx.close()
    # 11. v1.5.0 two tracks (Ides 07/11): A1 > B1 > C1 and A2 > B2 > C2, switch after every set; A1 done early: B1 alternates with A2
    ctx = new_context(b, 'phone'); p = open_page(ctx, 'test-klant', 'training')
    p.select_option('#nt-block', 'int-25'); p.click('[data-act="start-slot"][data-slot="T1"]'); p.wait_for_timeout(150)
    p.click('.gym-sets [data-act="del-set"]'); p.wait_for_timeout(80)
    seq = []
    for _ in range(7):
        c = p.inner_text('.cb.cur b'); p.click('.gym-ok[data-act="confirm-set"]'); p.wait_for_timeout(100); seq.append(c + '>' + p.inner_text('.cb.cur b'))
    check('v1.5 track order with A1 3 sets and A2 4 sets', seq == ['A1>A2', 'A2>A1', 'A1>A2', 'A2>A1', 'A1>A2', 'A2>B1', 'B1>A2'], ' '.join(seq))
    over = p.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    check('v1.5 phone: no sideways scroll during rest', over <= 1, str(over))
    ok = p.evaluate("""(() => { const hit = (el) => { const r = el.getBoundingClientRect(), e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!e && el.contains(e); }; window.scrollTo(0, 0); return hit(document.querySelector('.cb')) && hit(document.querySelector('[data-act=undo]')); })()""")
    check('v1.5 code bar and Terug reachable during the rest timer', ok)
    p.click('.cb[data-i="0"]'); p.wait_for_timeout(100)
    p.click('.sc[data-v="8"]'); p.wait_for_timeout(60); a = p.get_attribute('.sc[data-v="8"]', 'aria-pressed')
    p.click('.sc[data-v="8"]'); p.wait_for_timeout(60); b2 = p.get_attribute('.sc[data-v="8"]', 'aria-pressed')
    check('v1.5 score buttons: tap sets, tap again clears', a == 'true' and b2 == 'false', a + b2)
    shot(p, 'phone_gym_v15')
    clean(p, 'v1.5 tracks'); ctx.close()
    # 9. dark mode renders
    ctx = new_context(b, 'phone', dark=True); p = open_page(ctx, 'test-klant', 'training'); shot(p, 'phone_training_dark'); clean(p, 'dark'); ctx.close()

with sync_playwright() as pw:
    b = launch(pw)
    unit(b); flows(b)
    b.close()
print('UX touch targets under 40 px (device, tab, count):', ' '.join(f'{d}/{v}={n}' for d, v, n in UX if n))
print(f"{R['pass']} passed, {R['fail']} failed")
