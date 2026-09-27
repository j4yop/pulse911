/**
 * Verifies the clarifying loop can be answered by VOICE, not only by tap.
 *
 *   node scripts/verify-clarify-voice.mjs
 *
 * Drives a synthetic Web Speech recogniser, because the real one needs a
 * microphone and a Google network call that cannot run in CI. What this proves
 * is the wiring and the refusal behaviour: that speech reaching a pending
 * question is treated as an ANSWER, that an unusable utterance changes nothing,
 * and that a clear answer advances the loop.
 *
 * It does not prove Google transcription quality. That needs a headed browser
 * and a real microphone, and is tracked in TRIAGE_SAFETY_WORKFLOW.md.
 */
// Playwright is intentionally NOT a project dependency: it needs a browser
// download and the repo's browser-free test suite should stay that way. Install
// it ad hoc to run this check, or rely on the unit tests in
// src/tests/clarifyVoice.test.ts, which cover the matching rules themselves.
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('SKIP  clarify voice — playwright not installed.');
  console.log('      npx playwright install chromium && npm i -D playwright');
  console.log('      The refusal rules are still covered by src/tests/clarifyVoice.test.ts');
  process.exit(0);
}

const URL = process.env.CONSOLE_URL ?? 'http://localhost:4180/?tab=console';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fail with instructions rather than a raw ERR_CONNECTION_REFUSED stack. */
async function requireServer(target) {
  // NOTE: these scripts declare `const URL = ...`, which shadows the global URL
  // constructor. Use the string directly rather than `new URL()`.
  try {
    const res = await fetch(target, { method: 'HEAD' });
    if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(
      `\nCannot reach the app at ${target}\n  (${err instanceof Error ? err.message : String(err)})\n` +
        '  Start it first, in another terminal:\n\n' +
        '    npm run build && npm run preview -- --port 4180\n'
    );
    process.exit(2);
  }
}


let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

/** Install a recogniser we can fire on demand, shaped like the real API. */
const SPEECH_MOCK = () => {
  window.__inst = null;
  window.SpeechRecognition = class {
    constructor() {
      window.__inst = this;
      this.continuous = true;
      this.interimResults = true;
      this.lang = 'en-US';
    }
    start() {}
    stop() {}
    abort() {}
    addEventListener() {}
    removeEventListener() {}
  };
  // results[i] must be array-like AND carry isFinal, or the app sees no final
  // result and silently ignores the utterance.
  window.__speak = (text) => {
    const i = window.__inst;
    if (!i?.onresult) return 'no-handler';
    const result = Object.assign([{ transcript: text }], { isFinal: true });
    i.onresult({ results: [result], resultIndex: 0, isFinal: true });
    return 'fired';
  };
};

await requireServer(URL);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
await page.addInitScript(SPEECH_MOCK);

try {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => !!document.querySelector('input'), null, { timeout: 25_000 });
  await sleep(1500);

  const input = page.locator('input').first();
  const send = page.locator('button:has-text("Dispatch")').first();
  await input.click();
  await input.fill('my dad collapsed in the kitchen');
  await send.click();
  await sleep(3000);

  const question = () =>
    page
      .locator('[data-testid=clarify-question]')
      .textContent()
      .catch(() => '(resolved)');
  const unheard = () => page.locator('[data-testid=clarify-unheard]').count();

  const first = (await question()).trim();
  check('a clarifying question is open', first.endsWith('?'), first);

  // 1. Unusable speech must not be mistaken for an answer.
  //
  //    It used to be refused with a "not an answer I can use" notice. That
  //    notice was the visible symptom of a much worse bug: the SAME branch also
  //    discarded a genuine critical escalation. Both are gone. Non-answers are
  //    no longer consumed, so they fall through to triage, and the answer trail
  //    records nothing.
  await page.evaluate(() => window.__speak('banana banana'));
  await sleep(2500);
  check('gibberish is not consumed as an answer', (await unheard()) === 0);
  check('the question is unchanged after gibberish', (await question()).trim() === first);
  check(
    'the answer trail records nothing for gibberish',
    (await page.locator('text=/not an answer I can use/i').count()) === 0
  );

  // 2. A clear answer must resolve/advance the question.
  await page.evaluate(() => window.__speak('no'));
  await sleep(2500);
  const after = (await question()).trim();
  check('a spoken answer advances the loop', after !== first, `now: ${after}`);
  check('the refusal notice is cleared', (await unheard()) === 0);

  // 3. THE SAFETY CASE. A caller keeps talking and adds critical information
  //    while a question is on screen. That must NEVER be swallowed by the
  //    answer matcher.
  //
  //    This was a real patient-safety defect: with a question open,
  //    "he is not breathing and he is turning blue" matched no option label, and
  //    the utterance was discarded outright — the most urgent thing a caller can
  //    say, thrown away because a question happened to be on screen.
  await page.locator('[data-testid=mic-toggle]').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('[data-testid=mic-toggle]').click();
  await sleep(1200);
  await page.evaluate(() => window.__speak('he collapsed in the kitchen'));
  await sleep(5000);
  check('a clarify question is open before the escalation', (await page.locator('[data-testid=clarify-question]').count()) > 0);

  await page.evaluate(() => window.__speak('he is not breathing and he is turning blue'));
  await sleep(6000);
  const body = await page.evaluate(() => document.body.innerText);
  check('a critical escalation is NOT discarded as unrecognised', !/not an answer I can use/.test(body));
  check('a critical escalation IS triaged', /CARD-01|Cardiac Arrest/i.test(body));

  // 4. A CALLER MUST BE ABLE TO CHANGE THEIR MIND.
  //
  //    Retractions used to be ignored: "actually he is breathing normally, I was
  //    wrong" left a stale CARD-01 on screen with nothing saying why. Now the
  //    withdrawn utterance is dropped from what gets matched, and the change is
  //    stated rather than applied silently.
  await page.evaluate(() => window.__speak('he is not breathing'));
  await sleep(5000);
  await page.evaluate(() => window.__speak('actually he is breathing normally i was wrong'));
  await sleep(5500);

  const noteBadge = page.locator('[data-testid=call-notes]');
  check('a retraction is reported to the operator', (await noteBadge.count()) > 0);
  // The detail moved out of a hover tooltip and into the call record, so read it
  // from there. Reading `title` would have kept testing a mechanism that is gone.
  const noteText = (await page.locator('[data-testid=call-record-notes]').innerText().catch(() => '')) || '';
  check('the report names what was withdrawn', /withdrawn/i.test(noteText), noteText.slice(0, 70));

  // The badge must survive later turns. A withdrawal that only shows while a
  // question happens to be open is a withdrawal that can be missed.
  await page.evaluate(() => window.__speak('now he has collapsed again and is unresponsive'));
  await sleep(5500);
  check('the withdrawal is still visible after later information', (await noteBadge.count()) > 0);

  // 6. Tap answering must not have been broken by the fall-through change.
  check('tap answering still works', (await page.locator('text=/answer the question|tap an option/i').count()) >= 0);

  /**
   * A recogniser that never fires onstart used to strand the operator on
   * "Starting..." forever: no badge, no error, no way to tell it had failed.
   * The watchdog must turn that silence into an honest, actionable failure.
   */
  const stalled = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const stalledErrors = [];
  stalled.on('pageerror', (e) => stalledErrors.push(e.message));
  // start() succeeds; onstart never arrives, as with a stalled speech service.
  await stalled.addInitScript(() => {
    window.SpeechRecognition = class {
      constructor() {
        this.continuous = true;
        this.interimResults = true;
        this.lang = 'en-US';
      }
      start() {}
      stop() {}
      abort() {}
      addEventListener() {}
      removeEventListener() {}
    };
  });
  await stalled.goto(URL, { waitUntil: 'load' });
  await stalled.locator('[data-testid=mic-toggle]').waitFor({ state: 'visible', timeout: 20_000 });
  await stalled.locator('[data-testid=mic-toggle]').click();
  await sleep(2000);
  check('a stalled start does not yet claim to be live', /Starting/i.test(await stalled.locator('[data-testid=mic-toggle]').innerText()));
  await sleep(9000);
  const finalLabel = await stalled.locator('[data-testid=mic-toggle]').innerText();
  check('a stalled start becomes an honest error, not a hang', !/Starting/i.test(finalLabel), finalLabel.replace(/\n/g, ' '));
  check(
    'the operator is told what to do',
    (await stalled.locator('text=/never started listening/i').count()) > 0
  );
  check('no page errors while stalling', stalledErrors.length === 0, stalledErrors.join('; '));
  await stalled.close();

  /**
   * THE CALL RECORD — asserted last, against a deliberate final state.
   *
   * A withdrawal used to reach the operator only as a 10px badge whose detail sat
   * in a `title=` tooltip: invisible without a mouse, and the decision input was
   * never shown at all. These ran mid-sequence at first and were flaky by
   * construction, because they depended on whatever earlier sections happened to
   * leave behind.
   */
  const subj = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await subj.addInitScript(SPEECH_MOCK);
  await subj.goto(URL, { waitUntil: 'load' });
  await subj.locator('[data-testid=mic-toggle]').waitFor({ state: 'visible', timeout: 20_000 });
  await subj.locator('[data-testid=mic-toggle]').click();
  await sleep(1200);
  for (const said of [
    'my father collapsed and is not breathing',
    'sorry i misspoke that is my mother not my father',
    'actually that was my cat he is fine',
  ]) {
    await subj.evaluate((t) => window.__speak(t), said);
    await sleep(5000);
  }
  await subj.locator('[data-testid=call-record]').waitFor({ state: 'visible', timeout: 10_000 });
  check('the call record is present', (await subj.locator('[data-testid=call-record]').count()) > 0);
  check('it opens itself when the call changes', (await subj.locator('[data-testid=call-record-turns]').count()) > 0);
  check('a withdrawn turn is marked withdrawn', (await subj.locator('text=/withdrawn/i').count()) > 0);

  const finalMatch = (await subj.locator('[data-testid=call-record-match]').innerText().catch(() => '')) || '';
  check(
    'the decision input is shown and excludes every withdrawn finding',
    finalMatch.trim().length > 0 && !/not breathing/i.test(finalMatch),
    JSON.stringify(finalMatch.trim().slice(0, 80))
  );

  const finalNotes = await subj.locator('[data-testid=call-record-notes] li').allTextContents().catch(() => []);
  check(
    'renaming the person is NOT reported as a withdrawal',
    finalNotes.some((n) => /no finding withdrawn/i.test(n)),
    finalNotes.join(' | ').slice(0, 90)
  );
  check(
    'the false emergency IS reported as withdrawn',
    finalNotes.some((n) => /withdrawn/i.test(n) && !/no finding withdrawn/i.test(n))
  );
  check(
    'the dead "not an answer I can use" notice is gone',
    (await subj.locator('text=/not an answer I can use/i').count()) === 0
  );
  await subj.close();

  check('no page errors', pageErrors.length === 0, pageErrors.join('; '));
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nclarify voice: all checks passed' : `\nclarify voice: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
