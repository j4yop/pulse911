#!/usr/bin/env node
/**
 * One-command real-microphone voice test — `npm run verify:voice`
 *
 * Wraps `verify-voice-e2e` so there is nothing to get wrong:
 *   - builds the app
 *   - starts the preview server
 *   - waits until it actually serves
 *   - runs the real-microphone test against it
 *   - tears the server down, even on failure or Ctrl-C
 *
 * This exists because the two-terminal version was attempted from the home
 * directory twice, which produced `npm error Missing script: "build"` and left
 * the impression that the test had run when it had not.
 *
 * Still requires a human to speak — see scripts/verify-voice-e2e.mjs.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const PORT = Number(process.env.PORT ?? 4180);
const BASE = `http://localhost:${PORT}`;
const URL_UNDER_TEST = `${BASE}/?tab=console`;

let server = null;
const shutdown = () => {
  if (server && !server.killed) server.kill('SIGTERM');
};
process.on('exit', shutdown);
process.on('SIGINT', () => {
  shutdown();
  process.exit(130);
});

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
}

function waitForServer(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  return (async () => {
    while (Date.now() < deadline) {
      try {
        const res = await fetch(BASE, { method: 'GET' });
        if (res.ok) return true;
      } catch {
        /* not up yet */
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return false;
  })();
}

console.log('▸ building…');
const build = run('npm', ['run', 'build']);
const [buildCode] = await once(build, 'exit');
if (buildCode !== 0) {
  console.error('\nBuild failed. Stopping.\n');
  process.exit(buildCode ?? 1);
}

console.log(`▸ starting preview server on ${BASE}…`);
server = run('npm', ['run', 'preview', '--', '--port', String(PORT)], { detached: false });

if (!(await waitForServer())) {
  console.error(`\nPreview server never came up on ${BASE}. Stopping.\n`);
  shutdown();
  process.exit(1);
}
console.log('▸ server is up\n');

const test = run('node', ['scripts/verify-voice-e2e.mjs'], {
  env: { ...process.env, CONSOLE_URL: URL_UNDER_TEST },
});
const [testCode] = await once(test, 'exit');

shutdown();
// Give the child a moment to release the port.
await new Promise((r) => setTimeout(r, 300));
process.exit(testCode ?? 0);
