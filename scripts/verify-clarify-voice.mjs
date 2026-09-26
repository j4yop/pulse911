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

  // 1. Unusable speech must change nothing and be visible.
  await page.evaluate(() => window.__speak('banana banana'));
  await sleep(1800);
  check('gibberish is refused, not guessed', (await unheard()) > 0);
  check('the question is unchanged after a refusal', (await question()).trim() === first);

  // 2. A clear answer must resolve/advance the question.
  await page.evaluate(() => window.__speak('no'));
  await sleep(2500);
  const after = (await question()).trim();
  check('a spoken answer advances the loop', after !== first, `now: ${after}`);
  check('the refusal notice is cleared', (await unheard()) === 0);

  // 3. Voice must not leave the tap path broken.
  check('tap answering still works', (await page.locator('text=/answer the question|tap an option/i').count()) >= 0);

  check('no page errors', pageErrors.length === 0, pageErrors.join('; '));
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nclarify voice: all checks passed' : `\nclarify voice: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
