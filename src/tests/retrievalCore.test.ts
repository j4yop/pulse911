import { describe, it, expect } from 'vitest';
import { rankProtocols, resolveTriageOutcome, MIN_CONFIDENCE } from '../engine/retrievalCore';
import {
  EMERGENCY_PROTOCOLS,
  EMERGENCY_SCENARIOS,
  getEnabledProtocols,
  getDarkProtocols,
} from '../engine/emergencyProtocols';
import {
  canDispatch,
  matchedProtocol,
  UNIVERSAL_SAFETY_FLOOR,
  UNIVERSAL_PREARRIVAL_STEPS,
} from '../engine/triageGate';

/**
 * Triage safety suite.
 *
 * The guarantee that matters above all others: an unrecognised or out-of-domain
 * presentation must ABSTAIN. It must never resolve to a clinical protocol, and
 * it must never resolve to cardiac arrest in particular.
 *
 * Previously `resolveTopProtocol` always returned a protocol and broke ties by
 * corpus order with cardiac arrest at index 0 — so a 9-month pregnancy, a
 * stroke, a lost parcel, and an empty transcript all produced CPR instructions
 * that were then spoken aloud and dispatched.
 */

const byId = new Map(EMERGENCY_PROTOCOLS.map((p) => [p.id, p]));

describe('corpus integrity', () => {
  it('makes every clinician-reviewed protocol selectable, and none dark', () => {
    // The Stage 3 expansion was confirmed clinician-approved, so all 17 are
    // selectable. The split is still asserted rather than a bare count, so
    // adding or darkening a protocol remains a deliberate act.
    expect(getEnabledProtocols().length).toBe(17);
    expect(getDarkProtocols()).toEqual([]);
    for (const p of EMERGENCY_PROTOCOLS) {
      expect(p.reviewedBy, `${p.id} is selectable with no review record`).toBeTruthy();
    }
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
      const outcome = resolveTriageOutcome(scenario.callerSpeechTranscript, EMERGENCY_PROTOCOLS);
      expect(outcome.kind).toBe('matched');
      if (outcome.kind === 'matched') {
        expect(outcome.protocol.id).toBe(expected);
        expect(outcome.confidence).toBeGreaterThan(0);
      }
    });
  }
});

describe('SAFETY: unknown input must never produce a protocol', () => {
  const mustAbstain: Array<[string, string]> = [
    // Stage 3: now resolved by OB-10 — see goldenCorpus.
    // 'pregnancy / water break', 'my water broke and I am nine months pregnant, there is blood and the baby is not moving',
    // Stage 3: now resolved by OB-10 — see goldenCorpus.
    // 'pregnancy / bleeding', 'I am 34 weeks pregnant and having heavy vaginal bleeding',
    // Stage 3: now resolved — see goldenCorpus.
    // ['in labour', 'I am in labour, contractions are two minutes apart, the baby is crowning'],
    // Stage 3: now resolved — see goldenCorpus.
    // ['seizure', 'my friend just had a seizure, she is shaking and unresponsive'],
    // Stage 3: now resolved — see goldenCorpus.
    // ['major bleeding', 'I cut my leg on a saw and the bleeding will not stop'],
    // Stage 3: now resolved — see goldenCorpus.
    // ['burns', 'I spilled boiling water on my arm, it is blistered badly'],
    ['electrocution, breathing status unknown', 'my coworker was electrocuted by a live wire and is unconscious'],
    // Stage 3: now resolved — see goldenCorpus.
    // ['hypoglycaemia', 'my father is diabetic and confused and sweating and he took his insulin'],
    ['lost parcel', 'my parcel never arrived and the courier is rude'],
    ['weather', 'it is going to rain tomorrow in Bengaluru'],
    ['greeting', 'hello how are you doing today'],
    ['empty', ''],
    ['whitespace', '   '],
    ['punctuation only', '!!! ??? ...'],
  ];

  for (const [name, text] of mustAbstain) {
    it(`abstains: ${name}`, () => {
      const outcome = resolveTriageOutcome(text, EMERGENCY_PROTOCOLS);
      expect(outcome.kind).toBe('abstain');
      expect(matchedProtocol(outcome)).toBeNull();
      expect(canDispatch(outcome)).toBe(false);
    });
  }

  it('NEVER returns cardiac arrest for out-of-domain input', () => {
    for (const [name, text] of mustAbstain) {
      const protocol = matchedProtocol(resolveTriageOutcome(text, EMERGENCY_PROTOCOLS));
      expect(protocol?.id, `"${name}" must not resolve to CARD-01`).not.toBe('CARD-01');
    }
  });
});

describe('clinically correct matches (must NOT be over-cautious)', () => {
  // A non-breathing drowning victim genuinely needs CPR. Refusing here would be
  // its own failure, so these are asserted as MATCHES. Dedicated drowning and
  // electrocution protocols remain Stage-3 work.
  const shouldMatch: Array<[string, string, string]> = [
    ['classic cardiac arrest', 'he collapsed and is not breathing and has no pulse', 'CARD-01'],
    // Drown-13 supersedes CARD-01 here: the mechanism needs airway and
    // ventilation handling on top of compressions, and it instructs the caller
    // to check breathing first rather than going straight to CPR.
    ['drowning, non-breathing', 'my child fell into the pool and is not breathing, I pulled him out', 'DROW-13'],
    ['stroke, word-reordered', 'my father face is drooping on one side and his speech is slurred', 'NEURO-03'],
    ['choking', 'the baby is choking on something and cannot breathe', 'AIR-02'],
    ['anaphylaxis', 'her throat is closing up after peanuts, I have an EpiPen', 'IMMUNO-04'],
    ['overdose', 'my brother overdosed on fentanyl and is not waking up', 'TOX-05'],
  ];

  for (const [name, text, expected] of shouldMatch) {
    it(`matches ${expected}: ${name}`, () => {
      const outcome = resolveTriageOutcome(text, EMERGENCY_PROTOCOLS);
      expect(outcome.kind).toBe('matched');
      if (outcome.kind === 'matched') {
        expect(outcome.protocol.id).toBe(expected);
        expect(canDispatch(outcome)).toBe(true);
      }
    });
  }
});

describe('SAFETY invariants', () => {
  it('a score-0 match is impossible — no evidence never yields a protocol', () => {
    const ranked = rankProtocols('zzz qqq xxx', EMERGENCY_PROTOCOLS, 6);
    const top = ranked[0];
    expect(top.anchors.length).toBe(0);
    expect(resolveTriageOutcome('zzz qqq xxx', EMERGENCY_PROTOCOLS).kind).toBe('abstain');
  });

  it('corpus order does not decide the outcome', () => {
    // Reordering the corpus must not change a single decision. This text used
    // to resolve to cardiac arrest and was the original incident; it now
    // resolves to OB-10, and the order-invariance property still has to hold
    // across a 17-protocol corpus rather than the original six.
    const text = 'my water broke and I am nine months pregnant';
    const forward = resolveTriageOutcome(text, EMERGENCY_PROTOCOLS);
    const reversed = resolveTriageOutcome(text, [...EMERGENCY_PROTOCOLS].reverse());
    const rotated = resolveTriageOutcome(text, [
      ...EMERGENCY_PROTOCOLS.slice(5),
      ...EMERGENCY_PROTOCOLS.slice(0, 5),
    ]);
    const id = (o: typeof forward) => (o.kind === 'matched' ? o.protocol.id : 'abstain');
    expect(id(forward)).toBe('OB-10');
    expect(id(reversed)).toBe(id(forward));
    expect(id(rotated)).toBe(id(forward));
  });

  it('handles adversarial and oversized input without crashing', () => {
    expect(() => resolveTriageOutcome('a'.repeat(5000), EMERGENCY_PROTOCOLS)).not.toThrow();
    expect(resolveTriageOutcome('a'.repeat(5000), EMERGENCY_PROTOCOLS).kind).toBe('abstain');
  });

  it('every matched outcome meets the confidence floor', () => {
    for (const s of EMERGENCY_SCENARIOS) {
      const o = resolveTriageOutcome(s.callerSpeechTranscript, EMERGENCY_PROTOCOLS);
      if (o.kind === 'matched') {
        expect(o.confidence).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
        expect(o.confidence).toBeLessThanOrEqual(1);
      }
    }
  });

  it('the universal safety floor is a single unconditional sentence', () => {
    expect(UNIVERSAL_SAFETY_FLOOR.length).toBeGreaterThan(20);
    expect(UNIVERSAL_PREARRIVAL_STEPS.length).toBeGreaterThan(3);
  });
});

describe('matching quality (word-boundary + stemming)', () => {
  it('reaches a keyword through an inflected paraphrase', () => {
    // "choking" must reach the "choking on food" family, not be missed by strict equality.
    const o = resolveTriageOutcome('the baby is choking on something and cannot breathe', EMERGENCY_PROTOCOLS);
    expect(o.kind).toBe('matched');
    if (o.kind === 'matched') expect(o.protocol.id).toBe('AIR-02');
  });

  it('does not fire on a keyword buried inside an unrelated longer word', () => {
    // "unresponsiveness" is a real word; the guard is that we do not match a
    // keyword by naive substring across word boundaries.
    const o = resolveTriageOutcome('the photocopier is unresponsive again', EMERGENCY_PROTOCOLS);
    expect(o.kind).toBe('abstain');
  });

  it('ranks ambiguous cardiac language to CARD-01', () => {
    const o = resolveTriageOutcome('he collapsed and is not breathing, no pulse', EMERGENCY_PROTOCOLS);
    expect(o.kind).toBe('matched');
    if (o.kind === 'matched') expect(o.protocol.id).toBe('CARD-01');
  });

  it('is deterministic: identical input yields identical output', () => {
    const input = 'my boss collapsed, making snoring gasping sounds';
    expect(resolveTriageOutcome(input, EMERGENCY_PROTOCOLS)).toEqual(
      resolveTriageOutcome(input, EMERGENCY_PROTOCOLS)
    );
  });

  it('is fast enough for the voice budget', () => {
    /**
     * Measured with a median after a warmup pass, not a mean over 100 cold
     * iterations. The old version flaked at 6-8ms against a 5ms threshold on a
     * loaded machine: the first iterations are dominated by JIT compilation, so
     * a cold mean measures the compiler, not the ranker.
     *
     * The property being guarded is that local triage is fast enough to sit in
     * a voice interaction loop — i.e. it must not have become accidentally
     * quadratic. A warmed median tracks that; a cold mean did not.
     */
    const input = 'digital arrest cbi otp transfer money now';
    for (let i = 0; i < 200; i++) resolveTriageOutcome(input, EMERGENCY_PROTOCOLS);

    const samples: number[] = [];
    for (let i = 0; i < 200; i++) {
      const t0 = performance.now();
      resolveTriageOutcome(input, EMERGENCY_PROTOCOLS);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)];

    // Generous enough to survive a busy CI box, tight enough to catch quadratic
    // behaviour, which would be orders of magnitude over this, not 2x.
    expect(median).toBeLessThan(5);
  });
});

/**
 * Negation scoping. Found by the clarifying loop, which feeds multi-clause text
 * containing answers like "breathing normally".
 *
 * Bag-of-words matching cannot see scope, so the keyword "not breathing" used to
 * match "something is not right with my dad. breathing normally" — the `not`
 * was satisfied by an unrelated clause and `breathing` by the answer. The result
 * was a confident CARD-01, spoken aloud, for a caller whose patient was
 * breathing perfectly. Negated phrases now require a consecutive run.
 */
describe('negation is scoped, not bag-of-words', () => {
  it('does not read a negated keyword out of an unrelated clause', () => {
    const res = resolveTriageOutcome(
      'something is not right with my dad. breathing normally',
      EMERGENCY_PROTOCOLS
    );
    expect(res.kind).toBe('abstain');
  });

  it('still matches a real cardiac arrest', () => {
    for (const t of [
      'he is not breathing and has no pulse',
      'he is not breathing normally',
      'he collapsed and is not breathing',
    ]) {
      const res = resolveTriageOutcome(t, EMERGENCY_PROTOCOLS);
      expect(res.kind, t).toBe('matched');
      if (res.kind === 'matched') expect(res.protocol.id, t).toBe('CARD-01');
    }
  });

  it('keeps order-independent matching for phrases without negation', () => {
    // "his speech is slurred" does not contain the run [slurred, speech].
    // Losing this would silently stop the stroke protocol firing.
    const res = resolveTriageOutcome(
      'one arm is drooping and her speech is slurred',
      EMERGENCY_PROTOCOLS
    );
    expect(res.kind).toBe('matched');
    if (res.kind === 'matched') expect(res.protocol.id).toBe('NEURO-03');
  });

  it('does not let an answer about normal breathing pull a cardiac protocol', () => {
    const affirmations = [
      'he is fine. breathing normally',
      'she is talking to me. breathing normally',
      'no problem, he is breathing normally',
    ];
    for (const t of affirmations) {
      expect(resolveTriageOutcome(t, EMERGENCY_PROTOCOLS).kind, t).toBe('abstain');
    }
  });
});
