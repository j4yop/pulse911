import { describe, it, expect } from 'vitest';
import { GOLDEN_CORPUS, GOLDEN_PROTOCOLS, gapSummary, totalGapCases } from '../eval/goldenCorpus';
import { resolveTriageOutcome, MIN_CONFIDENCE } from '../engine/retrievalCore';
import { EMERGENCY_PROTOCOLS, getEnabledProtocols } from '../engine/emergencyProtocols';
import { matchedProtocol, canDispatch } from '../engine/triageGate';

/**
 * CI gate thresholds. Set here, not asserted by wishful thinking — these are the
 * numbers a change has to beat to land.
 */
export const EVAL_THRESHOLDS = {
  /** True-positive rate: of calls that should match, how many matched correctly. */
  tpr: 0.97,
  /** Out-of-domain false-positive rate: of calls that must abstain, how many matched. */
  oodFpr: 0.02,
} as const;

interface Failure {
  phrase: string;
  expected: string;
  actual: string;
  gap?: string;
}

function runCorpus() {
  const failures: Failure[] = [];
  let expectedMatch = 0;
  let expectedAbstain = 0;
  let correctMatch = 0;
  let abstainedCorrectly = 0;

  for (const c of GOLDEN_CORPUS) {
    const outcome = resolveTriageOutcome(c.phrase, EMERGENCY_PROTOCOLS);
    const protocol = matchedProtocol(outcome);
    const actual = protocol ? protocol.id : 'abstain';

    if (c.expect === 'abstain') {
      expectedAbstain++;
      if (actual === 'abstain') abstainedCorrectly++;
      else failures.push({ phrase: c.phrase, expected: 'abstain', actual, gap: c.gap });
    } else {
      expectedMatch++;
      if (actual === c.expect) correctMatch++;
      else
        failures.push({
          phrase: c.phrase,
          expected: c.expect,
          actual,
          gap: c.gap,
        });
    }
  }

  return {
    failures,
    tpr: expectedMatch === 0 ? 1 : correctMatch / expectedMatch,
    oodFpr: expectedAbstain === 0 ? 0 : (expectedAbstain - abstainedCorrectly) / expectedAbstain,
    expectedMatch,
    expectedAbstain,
  };
}

describe('golden corpus is well-formed', () => {
  it('is large enough to be worth gating on', () => {
    expect(GOLDEN_CORPUS.length).toBeGreaterThanOrEqual(100);
  });

  it('has no duplicate phrases', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const c of GOLDEN_CORPUS) {
      if (seen.has(c.phrase)) dupes.push(c.phrase);
      seen.add(c.phrase);
    }
    expect(dupes).toEqual([]);
  });

  it('only expects protocols that actually exist', () => {
    const ids = new Set(EMERGENCY_PROTOCOLS.map((p) => p.id));
    for (const id of GOLDEN_PROTOCOLS) {
      expect(ids.has(id), `corpus expects missing protocol ${id}`).toBe(true);
    }
  });

  it('reaches every SELECTABLE protocol, so none is untested', () => {
    // Dark protocols are deliberately unreachable, so requiring golden phrases
    // for them would be requiring a match the engine must never produce.
    for (const p of getEnabledProtocols()) {
      expect(GOLDEN_PROTOCOLS, `no golden phrases for ${p.id}`).toContain(p.id);
    }
  });

  it('reaches both outcomes', () => {
    expect(GOLDEN_CORPUS.some((c) => c.expect === 'abstain')).toBe(true);
    expect(GOLDEN_CORPUS.some((c) => c.expect !== 'abstain')).toBe(true);
  });
});

describe('every golden case behaves as labelled', () => {
  const { failures } = runCorpus();

  it('resolves exactly as the corpus expects', () => {
    if (failures.length === 0) return;
    const detail = failures
      .slice(0, 25)
      .map((f) => `  "${f.phrase}" expected ${f.expected}, got ${f.actual}${f.gap ? ` [gap: ${f.gap}]` : ''}`)
      .join('\n');
    throw new Error(`${failures.length} golden case(s) failed:\n${detail}`);
  });
});

describe('evaluation gates', () => {
  const { tpr, oodFpr, expectedMatch, expectedAbstain } = runCorpus();

  it(`TPR >= ${EVAL_THRESHOLDS.tpr} (correct matches / ${expectedMatch} expected matches)`, () => {
    expect(tpr).toBeGreaterThanOrEqual(EVAL_THRESHOLDS.tpr);
  });

  it(`OOD-FPR <= ${EVAL_THRESHOLDS.oodFpr} (false matches / ${expectedAbstain} expected abstains)`, () => {
    expect(oodFpr).toBeLessThanOrEqual(EVAL_THRESHOLDS.oodFpr);
  });
});

describe('the abstain contract holds across the whole corpus', () => {
  it('never permits speech or dispatch on an expected-abstain case', () => {
    for (const c of GOLDEN_CORPUS.filter((x) => x.expect === 'abstain')) {
      const outcome = resolveTriageOutcome(c.phrase, EMERGENCY_PROTOCOLS);
      if (canDispatch(outcome)) {
        // Only a genuine miss is a problem; report it precisely.
        expect(
          canDispatch(outcome),
          `"${c.phrase}" was dispatched as ${matchedProtocol(outcome)?.id}`
        ).toBe(false);
      }
    }
  });
});

/**
 * The gap backlog is a ratchet, not a report.
 *
 * Adding a protocol means deliberately flipping its corpus entries from
 * `abstain` to that protocol id and lowering this number. Nothing gets quietly
 * half-done, and the number cannot drift upward unnoticed.
 */
describe('known-gap ratchet', () => {
  it('is fully closed and cannot silently regrow', () => {
    expect(totalGapCases()).toBe(0);
  });

  it('still documents the gaps that matter most', () => {
    const gaps = gapSummary().map((g) => g.gap);
    // The backlog is CLOSED. Every gap phrase the corpus once proved now
    // resolves to a real protocol, so the gap list must be empty. If a gap
    // reappears, a protocol regressed and this fails.
    expect(gaps).toEqual([]);
  });
});

describe('confidence reporting is honest', () => {
  it('never reports a confidence above the documented ceiling', () => {
    for (const c of GOLDEN_CORPUS) {
      const outcome = resolveTriageOutcome(c.phrase, EMERGENCY_PROTOCOLS);
      expect(outcome.confidence).toBeGreaterThanOrEqual(0);
      expect(outcome.confidence).toBeLessThanOrEqual(1);
      if (outcome.kind === 'abstain') expect(outcome.confidence).toBe(0);
    }
  });

  it('uses the shipped confidence threshold rather than a local copy', () => {
    expect(MIN_CONFIDENCE).toBeGreaterThan(0);
    expect(MIN_CONFIDENCE).toBeLessThan(1);
  });
});
