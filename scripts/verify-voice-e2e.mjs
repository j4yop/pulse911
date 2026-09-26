#!/usr/bin/env node
/**
 * Real-microphone end-to-end voice test — `npm run verify:voice-e2e`
 *
 * ## Why this exists
 *
 * Every voice test in this repo so far used a SIMULATED recogniser. That proved
 * the wiring, the state machine, the error handling and the answer matching — and
 * proved nothing about whether Google actually transcribes a distressed caller.
 * The caller's voice is this product's primary input, so that gap is the largest
 * one left.
 *
 * ## What makes this different
 *
 * It does NOT mock `SpeechRecognition`. It WRAPS the native constructor to tee
 * transcripts into a buffer while passing every call, event and property through
 * untouched. So the transcripts scored here are Google's, produced by the real
 * engine, going through the real app.
 *
 * ## You have to be a human for this
 *
 * There is no way to synthesise a human voice that Google will treat as a caller.
 * This script therefore drives the browser and WAITS FOR YOU TO SPEAK. It cannot
 * pass on its own, and it will not mark silence as a pass.
 *
 * ## Requirements
 *
 * - A real microphone
 * - Chrome or Edge (Firefox has no `SpeechRecognition`; the preflight refuses)
 * - Network access, because Google transcription is a network service
 * - `npm run build && npm run preview -- --port 4180` in another terminal
 *
 * ## Usage
 *
 *   npm run verify:voice-e2e
 *   npm run verify:voice-e2e -- --threshold 0.5      # looser fuzzy matching
 *   npm run verify:voice-e2e -- --only breathing     # one phrase
 *   npm run verify:voice-e2e -- --timeout 20         # longer speak window
 */

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const THRESHOLD = Number(arg('threshold', 0.6));
const TIMEOUT_S = Number(arg('timeout', 12));
const ONLY = arg('only', null);
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


/**
 * The phrases worth testing.
 *
 * Deliberately weighted towards CLINICALLY CRITICAL VOCABULARY rather than easy
 * common speech. "he is not breathing" will almost certainly transcribe fine.
 * "tracheostomy" and "agonal gasping" are where a speech engine actually breaks,
 * and those are exactly the words that select a protocol for a real person.
 * `critical: true` phrases are the ones that matter most if they fail.
 */
const PHRASES = [
  { id: 'breathing', say: 'he is not breathing', critical: true },
  { id: 'unresponsive', say: 'she is completely unresponsive', critical: true },
  { id: 'seizing', say: 'he is seizing right now', critical: true },
  { id: 'agonal', say: 'he has agonal gasping', critical: true, hard: true },
  { id: 'tracheostomy', say: 'she has a tracheostomy', critical: true, hard: true },
  { id: 'anaphylaxis', say: 'severe anaphylaxis after a bee sting', critical: true, hard: true },
  { id: 'choking', say: 'he is choking on food', critical: true },
  { id: 'bleeding', say: 'there is severe bleeding from his leg', critical: true },
  { id: 'stroke', say: 'her face is drooping and her speech is slurred', critical: true },
  { id: 'heat', say: 'he is confused and burning up in the heat', critical: false },
  { id: 'overdose', say: 'she took too many pills', critical: true },
  { id: 'answer-no', say: 'no', critical: true, clarify: true },
  { id: 'answer-yes', say: 'yes', critical: true, clarify: true },
  { id: 'answer-unsure', say: 'not sure', critical: true, clarify: true },
];

// ---------------------------------------------------------------- scoring

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Token F1 with greedy matching. Robust to filler words and word order. */
function tokenF1(expected, actual) {
  const e = norm(expected).split(' ').filter(Boolean);
  const pool = norm(actual).split(' ').filter(Boolean);
  if (!e.length || !pool.length) return 0;
  let hits = 0;
  for (const t of e) {
    const i = pool.indexOf(t);
    if (i !== -1) {
      hits++;
      pool.splice(i, 1);
    }
  }
  if (!hits) return 0;
  const precision = hits / norm(actual).split(' ').filter(Boolean).length;
  const recall = hits / e.length;
  return (2 * precision * recall) / (precision + recall);
}

const score = (expected, actual) => {
  const a = norm(actual);
  const e = norm(expected);
  if (a === e) return { verdict: 'exact', f1: 1 };
  const f1 = tokenF1(e, a);
  return { verdict: f1 >= THRESHOLD ? 'fuzzy' : 'wrong', f1 };
};

// ------------------------------------------------- in-page native wrapper

/**
 * Wraps the REAL SpeechRecognition so we can read Google's transcripts.
 *
 * This deliberately does not stub anything: the native class is subclassed, its
 * onresult is chained (not replaced), and start/stop/abort are passed straight
 * through. If the engine is broken or the network is down, this harness fails
 * exactly as the app would.
 */
const WRAP_RECOGNITION = () => {
  window.__captured = [];
  window.__errors = [];
  const Native = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Native) return;
  window.__SpeechRecognitionAvailable = true;

  class Wrapped extends Native {
    constructor(...args) {
      super(...args);
      const nativeStart = this.onresult?.bind(this);
      this.addEventListener('result', (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          const text = r[0]?.transcript ?? '';
          if (text.trim()) {
            window.__captured.push({ text: text.trim(), final: !!r.isFinal });
          }
        }
      });
      this.addEventListener('error', (e) => {
        window.__errors.push(e.error ?? 'unknown');
      });
      // Keep the app's own handler working exactly as before.
      if (nativeStart) this.addEventListener('result', nativeStart);
    }
  }
  window.SpeechRecognition = Wrapped;
  window.webkitSpeechRecognition = Wrapped;
};

// ------------------------------------------------------------------- run

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('playwright is not installed.');
  console.error('  npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const selected = ONLY ? PHRASES.filter((p) => p.id === ONLY) : PHRASES;
if (!selected.length) {
  console.error(`no phrase with id "${ONLY}". ids: ${PHRASES.map((p) => p.id).join(', ')}`);
  process.exit(2);
}

await requireServer(URL);

const browser = await chromium.launch({
  headless: false,
  args: ['--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});
const context = await browser.newContext({ permissions: ['microphone'] });
const page = await context.newPage();
await page.addInitScript(WRAP_RECOGNITION);
await page.goto(URL, { waitUntil: 'load' });

// ------------------------------------------------------------- preflight

const preflight = await page.evaluate(() => ({
  recognition: !!window.__SpeechRecognitionAvailable,
  secure: window.isSecureContext,
  errors: window.__errors ?? [],
}));

let fatal = null;
if (!preflight.recognition) {
  fatal =
    'window.SpeechRecognition is unavailable. Chrome or Edge is required — ' +
    'Firefox has no implementation. This is a real gap, not a test problem.';
} else if (!preflight.secure) {
  fatal = 'not a secure context; the browser blocks microphone access';
}
if (fatal) {
  console.error(`\nPREFLIGHT FAILED: ${fatal}\n`);
  await browser.close();
  process.exit(2);
}

// ConsoleView is a lazy chunk, so an immediate count() check races the render
// and reports a missing button on a perfectly healthy page.
const micButton = page.locator('[data-testid=mic-toggle]').first();
try {
  await micButton.waitFor({ state: 'visible', timeout: 20_000 });
} catch {
  console.error(
    '\nPREFLIGHT FAILED: the microphone button never appeared.\n' +
      '  Is the app built and served? `npm run build && npm run preview -- --port 4180`\n' +
      `  Open ${URL} and check the console renders.\n`
  );
  await browser.close();
  process.exit(2);
}
await micButton.click();
await sleep(1200);

console.log(`
=========================================================================
 REAL-MICROPHONE VOICE TEST
 You have to speak. The script cannot synthesise a human voice.
 Speak each phrase WHEN IT APPEARS, in a normal speaking voice.
 Silence is recorded as "no speech" and never as a pass.
=========================================================================
`);

const results = [];
for (const [i, phrase] of selected.entries()) {
  const mark = await page.evaluate(() => window.__captured.length);
  const t0 = Date.now();
  process.stdout.write(
    `  ${String(i + 1).padStart(2)}/${selected.length}  "${phrase.say}"` +
      `${phrase.critical ? '  [clinical]' : ''}${phrase.hard ? ' [hard term]' : ''}\n` +
      `      speak now (${TIMEOUT_S}s window) ... `
  );

  let heard = '';
  while (Date.now() - t0 < TIMEOUT_S * 1000) {
    await sleep(250);
    const chunk = await page.evaluate((from) => window.__captured.slice(from), mark);
    const fin = chunk.filter((c) => c.final).map((c) => c.text);
    if (fin.length) {
      heard = fin.join(' ');
      break;
    }
  }

  if (!heard) {
    process.stdout.write('NO SPEECH\n');
    results.push({ ...phrase, heard: '', verdict: 'no-speech', f1: 0 });
    continue;
  }

  const { verdict, f1 } = score(phrase.say, heard);
  const mark2 = { exact: 'PASS', fuzzy: 'PASS', wrong: 'FAIL', 'no-speech': 'FAIL' }[verdict];
  process.stdout.write(`${mark2}  heard: "${heard}"  (f1 ${f1.toFixed(2)})\n`);
  results.push({ ...phrase, heard, verdict, f1 });
}

const engineErrors = await page.evaluate(() => window.__errors);
await browser.close();

// --------------------------------------------------------------- report

const failed = results.filter((r) => r.verdict === 'wrong' || r.verdict === 'no-speech');
const criticalFailed = failed.filter((r) => r.critical);
const noSpeech = results.filter((r) => r.verdict === 'no-speech');

console.log(`\n=========================================================================`);
console.log(` ${results.length - failed.length}/${results.length} transcribed correctly`);
console.log(` critical phrases: ${results.filter((r) => r.critical).length - criticalFailed.length}/${results.filter((r) => r.critical).length}`);
if (engineErrors.length) console.log(` engine errors: ${engineErrors.join(', ')}`);

if (noSpeech.length) {
  console.log(`\n ${noSpeech.length} phrase(s) heard nothing at all:`);
  for (const r of noSpeech) console.log(`   - "${r.say}"`);
  console.log(`   Check the mic is the system default, unmuted, and not in use elsewhere.`);
}
if (criticalFailed.length) {
  console.log(`\n CRITICAL clinical vocabulary failed:`);
  for (const r of criticalFailed) {
    console.log(`   - said "${r.say}"`);
    console.log(`     heard "${r.heard}"  (f1 ${r.f1.toFixed(2)})`);
  }
  console.log(`\n   These are the words that select a protocol for a real caller.`);
  console.log(`   A failure here is a patient-safety finding, not a test failure.`);
}

const verdict = criticalFailed.length || noSpeech.length === results.length ? 'FAIL' : failed.length ? 'PARTIAL' : 'PASS';
console.log(`\n VERDICT: ${verdict}`);
console.log(` Google transcription is ${verdict === 'PASS' ? 'VERIFIED' : 'NOT verified — do not record Stage 2.4 as fully closed'}.`);
console.log(`=========================================================================\n`);

process.exit(verdict === 'PASS' ? 0 : 1);
