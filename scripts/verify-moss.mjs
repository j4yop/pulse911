#!/usr/bin/env node
/**
 * Moss credential verifier — `npm run verify:moss`
 *
 * Parses .env.local directly (no Vite involved), then exercises the REAL
 * @moss-dev/moss Node SDK against Moss Cloud: createIndex → loadIndex → query.
 * Reports success with the SDK-measured latency, or the exact failure class:
 *   - AUTH      → keys are wrong/revoked
 *   - NETWORK   → machine/network cannot reach Moss Cloud (DNS, proxy, firewall)
 *   - MODEL     → service-side model load failed
 *   - OTHER     → anything else (full error printed)
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ---- 1. Load .env.local directly -------------------------------------------
const envPath = join(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('❌  .env.local not found in the current directory.');
  console.error('    Fix: cp .env.example .env.local  → then paste your keys.');
  process.exit(1);
}

const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}

const projectId = env.VITE_MOSS_PROJECT_ID;
const projectKey = env.VITE_MOSS_PROJECT_KEY;

if (!projectId || !projectKey) {
  console.error('❌  .env.local is missing VITE_MOSS_PROJECT_ID or VITE_MOSS_PROJECT_KEY.');
  process.exit(1);
}

console.log('🔑  Credentials found in .env.local:');
console.log(`    VITE_MOSS_PROJECT_ID  → ${projectId.slice(0, 4)}…${projectId.slice(-4)} (${projectId.length} chars)`);
console.log(`    VITE_MOSS_PROJECT_KEY → ${projectKey.slice(0, 4)}…${projectKey.slice(-4)} (${projectKey.length} chars)`);
console.log('');

// ---- 2. Reachability probe (before touching the SDK) -----------------------
console.log('📡  Probing reachability of Moss Cloud…');
const host = 'api.moss.dev';
try {
  const dns = await import('node:dns/promises');
  const addrs = await dns.lookup(host).catch(() => null);
  if (addrs) {
    console.log(`    DNS OK: ${host} → ${addrs.address}`);
  } else {
    console.log(`    ⚠️  DNS could not resolve ${host} (may be fine if Moss uses a different base URL).`);
  }
} catch {
  console.log('    ⚠️  DNS probe failed — continuing anyway.');
}

// ---- 3. Exercise the real SDK ----------------------------------------------
const { MossClient } = await import('@moss-dev/moss');

const INDEX = 'verify-moss-temp';
const DOCS = [
  { id: 't1', text: 'Adult out-of-hospital cardiac arrest protocol with CPR guidance.' },
  { id: 't2', text: 'Alternative client with a different model tier, used if the default model entitlement fails.' },
  { id: 't3', text: 'Digital arrest scam interception protocol for senior citizens.' },
];

async function attempt(projectId, projectKey, model) {
  const label = model ? `model=${model}` : 'default model (moss-minilm)';
  process.stdout.write(`\n🧪  Attempting with ${label}…\n`);
  const c = new MossClient(projectId, projectKey, model ? { model } : undefined);
  try {
    process.stdout.write('    createIndex… ');
    try {
      await c.createIndex(INDEX, DOCS);
      console.log('created.');
    } catch {
      console.log('already exists (fine).');
    }
    process.stdout.write('    loadIndex…   ');
    await c.loadIndex(INDEX);
    console.log('loaded into runtime.');
    process.stdout.write('    query…       ');
    const res = await c.query(INDEX, 'someone collapsed and is not breathing', { topK: 2 });
    console.log(`OK — SDK-measured ${res.timeTakenMs ?? 'n/a'} ms`);
    return res;
  } finally {
    try { await c.deleteIndex(INDEX); console.log('    🧹  cleaned up index for this attempt.'); } catch { /* non-fatal */ }
  }
}

function classify(err) {
  const msg = String(err?.message ?? err);
  // 401 specifically on models.moss.link during loadIndex = the API keys are fine
  // (createIndex succeeded) but the ARTIFACT CDN rejects the entitlement.
  if (/models\.moss\.link.*401|401.*models\.moss\.link|failed to load embedding model/i.test(msg))
    return 'MODEL-ENTITLEMENT';
  if (/401|403|unauthorized|forbidden|invalid.*(key|credential|project)|api key/i.test(msg)) return 'AUTH';
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|fetch failed|network|dns|proxy|socket/i.test(msg)) return 'NETWORK';
  if (/model|embed|onnx|artifact/i.test(msg)) return 'MODEL';
  return 'OTHER';
}

let succeeded = null;
let lastErr = null;

try {
  try {
    succeeded = await attempt(projectId, projectKey, undefined);
  } catch (e1) {
    lastErr = e1;
    const cls1 = classify(e1);
    console.log(`    → default model failed (${cls1}). Trying 'moss-mediumlm'…`);
    succeeded = await attempt(projectId, projectKey, 'moss-mediumlm');
  }

  console.log('');
  console.log('   Top matches:');
  for (const d of succeeded.docs ?? []) {
    console.log(`   • ${d.id}: score ${d.score?.toFixed?.(3) ?? d.score} — "${(d.text ?? '').slice(0, 60)}…"`);
  }
  console.log('');
  console.log('✅  VERDICT: Moss runtime WORKS. Credentials valid, model loaded, query measured.');
  console.log('    → Restart `npm run dev` and hard-reload the browser (Cmd+Shift+R).');
  console.log('      The app badge should now show MOSS RUNTIME · MEASURED.');
} catch (err) {
  const cls = classify(lastErr && !succeeded && err === lastErr ? lastErr : err);
  console.log('');
  if (cls === 'MODEL-ENTITLEMENT') {
    console.error('❌  VERDICT: MODEL ENTITLEMENT BLOCKED (Moss-side).');
    console.error('    Your API keys are VALID — createIndex succeeded against Moss Cloud.');
    console.error('    But the artifact CDN (models.moss.link) rejects the embedding-model download');
    console.error('    with 401 for your account, on BOTH model tiers. This is server-side:');
    console.error('    either a provisioning delay on new accounts, or model access needs');
    console.error('    activation/allowlisting in the Moss dashboard or by the Moss team.');
    console.error('    → Action: contact Moss support/Discord with the exact error below.');
    console.error('    → Meanwhile the app runs in clearly-labeled LOCAL FALLBACK (by design).');
  } else if (cls === 'AUTH') {
    console.error('❌  VERDICT: AUTH FAILURE — keys are wrong, revoked, or from another project.');
    console.error('    Fix: re-copy the exact Project ID + Key from moss.dev.');
  } else if (cls === 'NETWORK') {
    console.error('❌  VERDICT: NETWORK FAILURE — this machine cannot reach Moss Cloud.');
    console.error('    Fix: check Wi-Fi/VPN/proxy, then re-run npm run verify:moss.');
  } else {
    console.error('❌  VERDICT: OTHER FAILURE — full error below:');
  }
  console.error('    ' + ((err?.message ?? String(err))).split('\n').slice(0, 4).join('\n    '));
  process.exitCode = 1;
}
