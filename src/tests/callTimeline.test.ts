import { describe, it, expect } from 'vitest';
import {
  buildTimeline,
  isRetraction,
  polarityOf,
  type Utterance,
  type UtteranceSource,
} from '../engine/callTimeline';

const u = (seq: number, text: string, source: UtteranceSource = 'mic'): Utterance => ({
  seq,
  text,
  source,
});

/** The exact sequence reproduced in a browser before this module existed. */
const CALL = [
  u(0, 'my father collapsed in the kitchen'),
  u(1, 'he is not breathing'),
  u(2, 'actually he is breathing normally i was wrong'),
];

describe('retraction cues', () => {
  it('catches the ways people actually take something back', () => {
    for (const said of [
      'actually he is breathing normally',
      'sorry i misspoke',
      'no wait that is my mother',
      'i was wrong about the bleeding',
      'scratch that',
      'correction, he is responsive',
      'not him, it is his brother',
    ]) {
      expect(isRetraction(said), said).toBe(true);
    }
  });

  it('does not fire on ordinary new information', () => {
    for (const said of [
      'he collapsed in the kitchen',
      'she is not breathing',
      'there is blood everywhere',
      'he is six years old',
    ]) {
      expect(isRetraction(said), said).toBe(false);
    }
  });
});

describe('polarity is read before assertion', () => {
  /**
   * The ordering bug this guards: "not choking" contains "choking". Check
   * assertion first and the system invents the opposite finding, then treats a
   * later correction as a contradiction of a lie.
   */
  it('reads negation before assertion', () => {
    expect(polarityOf('he is not choking', 'choking')).toBe('negative');
    expect(polarityOf('he is choking', 'choking')).toBe('positive');
    expect(polarityOf('he is not breathing', 'breathing')).toBe('negative');
    expect(polarityOf('he is breathing normally', 'breathing')).toBe('positive');
    expect(polarityOf('no bleeding', 'bleeding')).toBe('negative');
    expect(polarityOf('heavy bleeding from the leg', 'bleeding')).toBe('positive');
  });

  it('returns null when the predicate is not mentioned', () => {
    expect(polarityOf('he collapsed in the kitchen', 'breathing')).toBeNull();
    expect(polarityOf('he collapsed in the kitchen', 'choking')).toBeNull();
  });
});

describe('a retraction supersedes the finding it takes back', () => {
  it('drops the withdrawn utterance from the matched transcript', () => {
    const t = buildTimeline(CALL);
    // The critical claim is gone from what we match on...
    expect(t.effectiveText).not.toMatch(/not breathing/);
    // ...but the call is not erased, and the operator can see what happened.
    expect(t.effectiveText).toMatch(/breathing normally/);
    expect(t.superseded).toEqual([1]);
    expect(t.retractions).toHaveLength(1);
    expect(t.changed).toBe(true);
  });

  it('keeps a withdrawal that itself carries information', () => {
    const t = buildTimeline(CALL);
    // "my father collapsed" was never withdrawn, so the picture is not empty.
    expect(t.effectiveText).toMatch(/collapsed in the kitchen/);
  });

  it('never retracts the correction utterance itself', () => {
    const t = buildTimeline([u(0, 'a'), u(1, 'actually b'), u(2, 'actually c')]);
    expect(t.effectiveText).toContain('actually c');
  });

  it('retracts the live statement, not an already-withdrawn one', () => {
    const t = buildTimeline([u(0, 'a'), u(1, 'actually b'), u(2, 'actually c')]);
    // 0 withdrawn by 1, then 1 is live so 2 withdraws 1, not 0 again.
    expect(t.retractions.map((r) => r.supersedes).sort()).toEqual([0, 1]);
  });
});

describe('a flipped finding is reported as a contradiction', () => {
  it('reports the flip and keeps the newest statement', () => {
    const t = buildTimeline([u(0, 'he is unresponsive'), u(1, 'actually he is talking to me')]);
    expect(t.contradictions).toHaveLength(1);
    expect(t.contradictions[0].predicate).toBe('consciousness');
    expect(t.contradictions[0].from).toBe('negative');
    expect(t.contradictions[0].to).toBe('positive');
    expect(t.effectiveText).toMatch(/talking to me/);
  });

  it('reports each predicate independently', () => {
    const t = buildTimeline([
      u(0, 'he is unresponsive and not breathing'),
      u(1, 'actually he is talking to me but still not breathing'),
    ]);
    const preds = t.contradictions.map((c) => c.predicate).sort();
    expect(preds).toEqual(['consciousness']);
    // breathing never flipped, so it must NOT be reported as changed.
    expect(t.contradictions.some((c) => c.predicate === 'breathing')).toBe(false);
  });

  it('reports nothing when nothing changed', () => {
    const t = buildTimeline([u(0, 'he collapsed'), u(1, 'there is blood on the floor')]);
    expect(t.contradictions).toEqual([]);
    expect(t.retractions).toEqual([]);
    expect(t.changed).toBe(false);
  });
});

describe('it is safe on hostile and empty input', () => {
  it('handles a single utterance', () => {
    const t = buildTimeline([u(0, 'he collapsed')]);
    expect(t.effectiveText).toBe('he collapsed');
    expect(t.changed).toBe(false);
  });

  it('handles an empty call', () => {
    const t = buildTimeline([]);
    expect(t.effectiveText).toBe('');
    expect(t.changed).toBe(false);
  });

  it('handles a correction as the very first thing said', () => {
    // Nothing to retract; the cue must not invent history.
    const t = buildTimeline([u(0, 'actually he collapsed')]);
    expect(t.retractions).toEqual([]);
    expect(t.effectiveText).toBe('actually he collapsed');
  });

  it('never throws on punctuation, emoji or empty strings', () => {
    const nasty = ['', '   ', '...', '🙂🙂', 'a'.repeat(500), 'ACTUALLY', 'no wait,,,'];
    for (const text of nasty) {
      expect(() => buildTimeline(nasty.map((t, i) => u(i, t)))).not.toThrow();
    }
  });
});

describe('the real regression: a retracted critical finding', () => {
  /**
   * Before this module, "actually he is breathing normally i was wrong" left
   * CARD-01 on screen with the retraction ignored. The engine has no business
   * showing cardiac arrest on evidence the caller has withdrawn.
   */
  it('removes the withdrawn critical finding from what gets matched', () => {
    const t = buildTimeline(CALL);
    expect(t.effectiveText.toLowerCase()).not.toContain('not breathing');
  });

  it('is deterministic — same input, same output, every time', () => {
    const a = buildTimeline(CALL);
    const b = buildTimeline(CALL);
    expect(a).toEqual(b);
  });

  it('does not depend on typed vs spoken input', () => {
    const spoken = buildTimeline(CALL);
    const typed = buildTimeline(CALL.map((x) => ({ ...x, source: 'typed' as const })));
    expect(spoken.effectiveText).toBe(typed.effectiveText);
    expect(spoken.superseded).toEqual(typed.superseded);
  });
});
