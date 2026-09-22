import { describe, it, expect } from 'vitest';
import { mossEngine } from '../engine/mossEngine';

describe('mossEngine integration', () => {
  it('returns valid query results for emergency scenarios', async () => {
    const res = await mossEngine.query('adult collapsed not breathing cardiac arrest');
    expect(res).toBeDefined();
    expect(res.protocol).toBeDefined();
    expect(res.protocol.id).toBe('CARD-01');
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);
    expect(res.tokensEvaluated).toBeGreaterThan(0);
    expect(res.engine).toBeDefined();
  });

  it('reports operational statistics', () => {
    const stats = mossEngine.getStats();
    expect(stats.protocolsCount).toBe(6);
    expect(stats.indexName).toBe('pulse911-protocols-v1');
    expect(stats.totalQueries).toBeGreaterThan(0);
  });
});
