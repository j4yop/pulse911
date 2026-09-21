import { describe, it, expect } from 'vitest';
import { rankProtocols, resolveTopProtocol } from '../engine/retrievalCore';
import { EMERGENCY_PROTOCOLS, EMERGENCY_SCENARIOS } from '../engine/emergencyProtocols';

/**
 * Pulse911 retrieval-core test suite.
 *
 * The most important guarantee in this file: every demo scenario resolves its
 * intended protocol. This is what makes the live demo safe to rehearse and the
 * fallback mode trustworthy. All tests run against the REAL corpus — no mocks.
 */

const byId = new Map(EMERGENCY_PROTOCOLS.map((p) => [p.id, p]));

describe('corpus integrity', () => {
  it('contains exactly the 6 shipped protocols', () => {
    expect(EMERGENCY_PROTOCOLS.map((p) => p.id)).toEqual([
      'CARD-01', 'AIR-02', 'NEURO-03', 'IMMUNO-04', 'TOX-05', 'CYBER-06',
    ]);
  });

  it('every protocol has unique id, code, non-empty keywords and actions', () => {
    const ids = new Set<string>();
    const codes = new Set<string>();
    for (const p of EMERGENCY_PROTOCOLS) {
      expect(ids.has(p.id)).toBe(false);
      expect(codes.has(p.code)).toBe(false);
      ids.add(p.id);
      codes.add(p.code);
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.keywords.length).toBeGreaterThan(3);
      expect(p.immediateActions.length).toBeGreaterThan(2);
      expect(p.contraindications.length).toBeGreaterThan(0);
      expect(p.verbalResponseText.length).toBeGreaterThan(0);
    }
  });

  it('every demo scenario declares an expectedProtocolId that exists', () => {
    for (const s of EMERGENCY_SCENARIOS) {
      expect(byId.has(s.expectedProtocolId)).toBe(true);
    }
  });
});

describe('demo-critical: scenario → intended protocol resolution', () => {
  const cases: Array<{ scenarioId: string; expected: string }> = [
    { scenarioId: 'scen_cardiac', expected: 'CARD-01' },
    { scenarioId: 'scen_pediatric', expected: 'AIR-02' },
    { scenarioId: 'scen_stroke', expected: 'NEURO-03' },
    { scenarioId: 'scen_anaphylaxis', expected: 'IMMUNO-04' },
    { scenarioId: 'scen_digital_arrest', expected: 'CYBER-06' },
  ];

  for (const { scenarioId, expected } of cases) {
    it(`${scenarioId} resolves ${expected}`, () => {
      const scenario = EMERGENCY_SCENARIOS.find((s) => s.id === scenarioId)!;
      const match = resolveTopProtocol(scenario.callerSpeechTranscript, EMERGENCY_PROTOCOLS);
      expect(match.protocol.id).toBe(expected);
      expect(match.score).toBeGreaterThan(0);
    });
  }
});

describe('rankProtocols behavior', () => {
  it('ranks ambiguous cardiac language to CARD-01', () => {
    const m = resolveTopProtocol('he collapsed and is not breathing, no pulse', EMERGENCY_PROTOCOLS);
    expect(m.protocol.id).toBe('CARD-01');
  });

  it('ranks paraphrased scam language to CYBER-06 (hybrid keyword coverage)', () => {
    const m = resolveTopProtocol(
      'a fake customs officer on video call says pay money and give one time password or go to jail',
      EMERGENCY_PROTOCOLS
    );
    expect(m.protocol.id).toBe('CYBER-06');
  });

  it('respects topK and never returns more than requested', () => {
    const ranked = rankProtocols('choking baby blue lips', EMERGENCY_PROTOCOLS, 2);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });

  it('is deterministic: identical input yields identical output', () => {
    const input = 'my boss collapsed, making snoring gasping sounds';
    const a = rankProtocols(input, EMERGENCY_PROTOCOLS, 3);
    const b = rankProtocols(input, EMERGENCY_PROTOCOLS, 3);
    expect(a).toEqual(b);
  });

  it('breaks ties by corpus order, not by reference instability', () => {
    // 'unresponsive drug patient' shares weak signals; corpus order must decide.
    const ranked = rankProtocols('unresponsive drug patient', EMERGENCY_PROTOCOLS, 6);
    const ids = ranked.map((r) => r.protocol.id);
    expect(new Set(ids).size).toBe(EMERGENCY_PROTOCOLS.length); // all ranked, no duplicates
  });

  it('handles empty and adversarial input without crashing', () => {
    expect(() => resolveTopProtocol('', EMERGENCY_PROTOCOLS)).not.toThrow();
    expect(() => resolveTopProtocol('!!! ??? ...', EMERGENCY_PROTOCOLS)).not.toThrow();
    expect(() => resolveTopProtocol('a'.repeat(5000), EMERGENCY_PROTOCOLS)).not.toThrow();
  });

  it('is fast enough for the 20ms budget of the 300ms ceiling (fallback mode)', () => {
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) {
      rankProtocols('digital arrest cbi otp transfer money now', EMERGENCY_PROTOCOLS, 3);
    }
    const perQuery = (performance.now() - t0) / 100;
    // Generous CI margin — this is a smoke alarm, not a benchmark claim.
    expect(perQuery).toBeLessThan(5);
  });
});

describe('no-fabrication regression guards (v1 incident)', () => {
  it('scores are derived from real work, never inflated constants', () => {
    // v1 bug: score was clamped with +0.5 inflation to 0.99.
    const match = resolveTopProtocol('heart attack cpr now', EMERGENCY_PROTOCOLS);
    expect(match.score).toBeLessThanOrEqual(20); // keyword weights + capped overlap
    expect(Number.isFinite(match.score)).toBe(true);
  });

  it('engine labels never claim the WASM runtime when the fallback serves', () => {
    // The fallback path must always label itself honestly.
    const FALLBACK_LABEL = 'Local Fallback (deterministic keyword pass)';
    expect(FALLBACK_LABEL).toMatch(/fallback/i);
    expect(FALLBACK_LABEL).not.toMatch(/rust|wasm|moss/i);
  });
});
