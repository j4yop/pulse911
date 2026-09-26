import { describe, it, expect } from 'vitest';
import { mossEngine } from '../engine/mossEngine';
import { matchedProtocol, canDispatch } from '../engine/triageGate';
import { buildKnowledgeDocs } from '../engine/knowledgeBase';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';

describe('mossEngine integration', () => {
  it('returns a well-formed result for an emergency scenario', async () => {
    const res = await mossEngine.query('adult collapsed not breathing cardiac arrest');
    expect(res).toBeDefined();
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);
    expect(res.tokensEvaluated).toBeGreaterThan(0);
    expect(res.engine).toBeDefined();
    expect(['matched', 'abstain']).toContain(res.outcome.kind);
  });

  it('ABSTAINS on out-of-domain input instead of returning cardiac arrest', async () => {
    const res = await mossEngine.query('my parcel never arrived and I want to complain');
    expect(res.outcome.kind).toBe('abstain');
    expect(matchedProtocol(res.outcome)).toBeNull();
    expect(canDispatch(res.outcome)).toBe(false);
  });

  it('resolves obstetric calls now that OB-10 exists', async () => {
    // The original incident. This used to be cardiac arrest.
    const res = await mossEngine.query(
      'my water broke and I am nine months pregnant, there is blood and the baby is not moving'
    );
    expect(res.outcome.kind).toBe('matched');
    expect(matchedProtocol(res.outcome)?.id).toBe('OB-10');
  });

  it('ABSTAINS on an empty transcript', async () => {
    const res = await mossEngine.query('');
    expect(res.outcome.kind).toBe('abstain');
  });

  it('indexes a real corpus rather than six protocol documents', () => {
    // The index used to hold one document per protocol. Six documents is not a
    // corpus, and it made a 28MB semantic runtime pointless.
    expect(buildKnowledgeDocs().length).toBeGreaterThan(150);
  });

  it('reports operational statistics', () => {
    const stats = mossEngine.getStats();
    expect(stats.protocolsCount).toBe(EMERGENCY_PROTOCOLS.length);
    expect(stats.indexName).toBe('pulse911-kb-v2');
    expect(stats.totalQueries).toBeGreaterThan(0);
  });
});

describe('mossEngine.refineWithMoss is enrichment, never a decision', () => {
  it('returns null when the WASM runtime is not warm', async () => {
    // The browser calls this in the background. It has no network in the test
    // environment, so the runtime stays cold — which is exactly the case the
    // caller must survive by keeping the local result.
    const refined = await mossEngine.refineWithMoss('adult collapsed not breathing');
    expect(refined).toBeNull();
  });

  it('never blocks or rejects on the caller hot path', async () => {
    const local = await mossEngine.query('adult collapsed not breathing cardiac arrest');
    expect(local.outcome.kind).toBe('matched');

    // Fire-and-forget must settle rather than hang, even with no runtime.
    const settled = await Promise.race([
      mossEngine.refineWithMoss('adult collapsed not breathing').then(() => 'settled'),
      new Promise((r) => setTimeout(() => r('hung'), 6000)),
    ]);
    expect(settled).toBe('settled');
  });

  it('leaves the local decision intact when refinement is unavailable', async () => {
    const res = await mossEngine.query('my parcel never arrived');
    expect(res.outcome.kind).toBe('abstain');
    expect(canDispatch(res.outcome)).toBe(false);
  });
});
