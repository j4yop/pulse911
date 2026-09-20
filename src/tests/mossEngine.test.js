import test from 'node:test';
import assert from 'node:assert';
import { mossEngine } from '../engine/mossEngine.js';

test('Moss Engine initialization', () => {
  const stats = mossEngine.getStats();
  assert.strictEqual(stats.isLoaded, true);
  assert.ok(stats.protocolsCount >= 5);
});

test('Sub-10ms semantic retrieval for Cardiac Arrest', async () => {
  const res = await mossEngine.query('patient has collapsed and is not breathing no pulse');
  assert.strictEqual(res.protocol.id, 'CARD-01');
  assert.ok(res.latencyMs < 10.0, `Expected latency < 10ms, got ${res.latencyMs}ms`);
  assert.strictEqual(res.protocol.category, 'cardiac');
});

test('Sub-10ms semantic retrieval for Infant Choking', async () => {
  const res = await mossEngine.query('baby is choking turned blue cannot cry airway blocked');
  assert.strictEqual(res.protocol.id, 'AIR-02');
  assert.ok(res.latencyMs < 10.0, `Expected latency < 10ms, got ${res.latencyMs}ms`);
  assert.strictEqual(res.protocol.category, 'airway');
});

test('Sub-10ms semantic retrieval for Stroke FAST protocol', async () => {
  const res = await mossEngine.query('facial droop arm weakness slurred speech stroke');
  assert.strictEqual(res.protocol.id, 'NEURO-03');
  assert.ok(res.latencyMs < 10.0, `Expected latency < 10ms, got ${res.latencyMs}ms`);
});

test('Sub-10ms semantic retrieval for Anaphylaxis EpiPen', async () => {
  const res = await mossEngine.query('allergic reaction peanut throat closing hives epipen');
  assert.strictEqual(res.protocol.id, 'IMMUNO-04');
  assert.ok(res.latencyMs < 10.0, `Expected latency < 10ms, got ${res.latencyMs}ms`);
});
