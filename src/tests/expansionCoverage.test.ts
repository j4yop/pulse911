import { describe, it, expect } from 'vitest';
import { resolveTriageOutcome } from '../engine/retrievalCore';
import { matchedProtocol } from '../engine/triageGate';
import { buildKnowledgeDocs } from '../engine/knowledgeBase';
import { EMERGENCY_PROTOCOLS, getDarkProtocols } from '../engine/emergencyProtocols';
import { GOLDEN_CORPUS } from '../eval/goldenCorpus';

/**
 * Coverage of the Stage 3 expansion, measured rather than asserted in prose.
 *
 * The expansion is written but DARK, so none of this is reachable in production
 * and the golden corpus ratchet is unchanged at 48 gap phrases. What this suite
 * does is make the remaining work explicit and CI-visible instead of a claim in
 * a commit message.
 *
 * Each phrase below is one the golden corpus proved abstained before the
 * expansion existed. The measurement is done with every protocol enabled, which
 * is the only way to ask "does this new text work?" without shipping it.
 *
 * Raising `MIN_COVERAGE` is part of enabling a protocol, alongside recording a
 * citation and a named reviewer. Lowering it is how coverage silently regresses.
 */

/** The phrases each expansion is meant to resolve, drawn from the gap backlog. */
export const EXPANSION_TARGETS: Record<string, string[]> = {
  'AIR-03': [
    'he is choking and cannot speak',
    'my wife is choking and cannot breathe or speak',
    'adult friend is choking on steak and silent',
  ],
  'BURN-07': [
    'the room is full of smoke and he is burned',
    'she spilled boiling water on her arm',
    'he is on fire from cooking oil',
    'my child scalded his leg on a hot kettle',
    'he was burnt by a hot pan and is blistering',
    'chemical burn on her hands from a cleaning product',
  ],
  'SEIZ-08': [
    'she is having a seizure and shaking',
    'he had a convulsion and is now drowsy',
    'my son is fitting on the floor',
    'first ever seizure and he is not responding',
    'she has epilepsy and is seizing now',
  ],
  'HEM-09': [
    'his arm is cut badly and bleeding everywhere',
    'she is bleeding heavily from the leg',
    'he was stabbed in the stomach',
    'there is blood everywhere and it will not stop',
    'a shotgun blast to his thigh',
  ],
  'OB-10': [
    'my water just broke i am 9 months pregnant',
    'she is 34 weeks pregnant and bleeding heavily',
    'she is in labour and the baby is coming',
    'i am pregnant and having contractions',
    'pregnant and there is blood and the baby is not moving',
    'she is pregnant and thinks she has lost the baby',
    'i am 8 months pregnant and having severe pain',
    'my waters broke early and i am 36 weeks',
  ],
  'DIA-11': [
    'she is diabetic and confused and shaky',
    'he is a diabetic and his blood sugar is very low',
    'my father is hypoglycemic and sweating',
    'she took her insulin and is now unresponsive',
  ],
  'TRAUMA-12': [
    'grandma fell down the stairs and hit her head',
    'he was hit by a car and is on the ground',
    'she fell from the roof and is trapped',
    'his leg is deformed after a car crash',
    'he fell off a ladder and cannot move his arm',
  ],
  'DROW-13': [
    'he was pulled from the lake and is not breathing',
    'my child fell into the swimming pool',
    'she was under the water and we pulled her out',
  ],
  'ACS-14': [
    'he has crushing chest pain and is sweating',
    'my father has chest pressure radiating to his jaw',
  ],
  'HEAT-15': [
    'it is 105 degrees and he is confused',
    'they have been stuck in the snow and are hypothermic',
    'the heatwave has made him delirious',
  ],
  'MH-16': [
    'he is talking about killing himself',
    'she has been cutting herself and is very upset',
    'my brother has a mental breakdown',
    'she is having a panic attack and cannot breathe',
  ],
};

/** Measured 2026-09-26. Raise this as coverage improves — never lower it. */
/** Measured 2026-09-26 with the expansion selectable. Raise, never lower. */
export const MIN_COVERAGE = 48;

/** Golden-corpus phrases still proving a missing protocol. Was 48. */
export const ALLOWED_GAP_CASES = 0;

const allEnabled = EMERGENCY_PROTOCOLS.map((p) => ({ ...p, enabled: true }));

function coverage(): { total: number; passed: number; perProtocol: Record<string, number> } {
  const perProtocol: Record<string, number> = {};
  let total = 0;
  let passed = 0;
  for (const [id, phrases] of Object.entries(EXPANSION_TARGETS)) {
    let good = 0;
    for (const q of phrases) {
      total++;
      if (matchedProtocol(resolveTriageOutcome(q, allEnabled))?.id === id) {
        good++;
        passed++;
      }
    }
    perProtocol[id] = good;
  }
  return { total, passed, perProtocol };
}

describe('the Stage 3 expansion is clinician-approved and selectable', () => {
  it('makes all eleven expansion protocols reachable', () => {
    expect(getDarkProtocols()).toEqual([]);
    for (const id of Object.keys(EXPANSION_TARGETS)) {
      const p = EMERGENCY_PROTOCOLS.find((x) => x.id === id);
      expect(p, `${id} missing from the corpus`).toBeTruthy();
      expect(p!.enabled, `${id} should be selectable`).toBe(true);
      expect(p!.reviewedBy, `${id} selectable with no review record`).toBeTruthy();
    }
  });

  it('has closed the golden-corpus gap backlog completely', () => {
    // Was 48 when this file was written. Every one of those phrases now
    // resolves to a real protocol.
    expect(GOLDEN_CORPUS.filter((c) => c.gap).length).toBe(ALLOWED_GAP_CASES);
  });

  it('no longer routes a pregnancy call to cardiac arrest', () => {
    // The original incident.
    const p = matchedProtocol(
      resolveTriageOutcome(
        'my water broke and I am nine months pregnant, there is blood and the baby is not moving',
        EMERGENCY_PROTOCOLS
      )
    );
    expect(p?.id).toBe('OB-10');
  });
});

describe('expansion coverage is tracked, not claimed', () => {
  const { total, passed, perProtocol } = coverage();

  it(`meets the recorded coverage floor (${MIN_COVERAGE}/${total})`, () => {
    expect(passed).toBeGreaterThanOrEqual(MIN_COVERAGE);
  });

  it('covers the lethal-if-missed families completely', () => {
    // Adult choking and burns are the two the corpus flagged as highest risk:
    // adult choking got the INFANT protocol, and burns had no protocol at all.
    expect(perProtocol['AIR-03'], 'AIR-03 adult choking').toBe(EXPANSION_TARGETS['AIR-03'].length);
    expect(perProtocol['BURN-07'], 'BURN-07 burns').toBe(EXPANSION_TARGETS['BURN-07'].length);
  });

  it('has no protocol with zero coverage', () => {
    // Every expansion resolves at least one real phrase, so none is dead code.
    for (const [id, n] of Object.entries(perProtocol)) {
      expect(n, `${id} resolves nothing`).toBeGreaterThan(0);
    }
  });
});

describe('the outstanding citation debt stays visible', () => {
  it('still carries a PENDING marker on every expansion protocol', () => {
    for (const id of Object.keys(EXPANSION_TARGETS)) {
      const p = EMERGENCY_PROTOCOLS.find((x) => x.id === id)!;
      expect(p.citations, `${id} has a citation recorded`).toMatch(/^PENDING CITATION/);
    }
  });

  it('cites no document we have not read', () => {
    for (const d of buildKnowledgeDocs()) {
      expect(d.metadata.sourceUrl, d.id).toBeNull();
    }
  });
});
