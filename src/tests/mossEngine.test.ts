import { describe, it, expect } from 'vitest';
import { mossEngine } from '../engine/mossEngine';
import { matchedProtocol, canDispatch } from '../engine/triageGate';

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
    const res = await mossEngine.query(
      'my water broke and I am nine months pregnant, there is blood and the baby is not moving'
    );
    expect(res.outcome.kind).toBe('abstain');
    expect(matchedProtocol(res.outcome)).toBeNull();
    expect(canDispatch(res.outcome)).toBe(false);
  });

  it('ABSTAINS on an empty transcript', async () => {
    const res = await mossEngine.query('');
    expect(res.outcome.kind).toBe('abstain');
  });

  it('reports operational statistics', () => {
    const stats = mossEngine.getStats();
    expect(stats.protocolsCount).toBe(6);
    expect(stats.indexName).toBe('pulse911-protocols-v1');
    expect(stats.totalQueries).toBeGreaterThan(0);
  });
});
