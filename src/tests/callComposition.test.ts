import { describe, it, expect } from 'vitest';
import { MULTI_TURN_CORPUS } from '../eval/multiTurnCorpus';
import { decideCall } from '../engine/callDecision';
import type { Utterance } from '../engine/callTimeline';

/**
 * Composition coverage — the app's decision, not a copy of it.
 *
 * ## The history, because it explains the file
 *
 * Three bugs shipped where the app judged the raw latest utterance while the
 * tests judged the effective transcript (`routeTranscript(text)`,
 * `speakableGuidanceScript(text)`, `refineWithMoss(text)`). Every test passed,
 * because every test called `resolveTriageOutcome` directly and the app ran a
 * longer sequence.
 *
 * The first attempt at closing that was a duplicated copy of the app's decision
 * order. Better than nothing, still wrong: a duplicated sequence drifts silently
 * and proves little.
 *
 * So this file now calls `decideCall()` — **the same function `App.tsx` calls**.
 * There is no second copy. If the app's decision order changes, these assertions
 * change with it, which is the only version of this test that means anything.
 *
 * `multiTurnCorpus.test.ts` still exercises the timeline and the local gate
 * directly; this file checks the composition the operator actually sees.
 */

const asUtterances = (turns: string[]): Utterance[] =>
  turns.map((text, seq) => ({ seq, text, source: 'mic' }));

describe('the composed decision is the corpus decision', () => {
  it('agrees with the corpus for every conversation', () => {
    const failures: string[] = [];
    for (const c of MULTI_TURN_CORPUS) {
      const d = decideCall(asUtterances(c.turns));
      if (d.verdict !== c.expect) {
        failures.push(
          `  ${c.id}: corpus expects ${c.expect}, decision produced ${d.verdict}\n` +
            `     decided on: "${d.matchText}"`
        );
      }
    }
    if (failures.length) {
      throw new Error(`${failures.length} conversation(s) failed in composition:\n${failures.join('\n')}`);
    }
  });

  it('routes a withdrawn emergency out of the emergency path', () => {
    // The specific bug this file was written for. "Actually that was my cat"
    // carries no clinical words of its own, so routing on the raw turn found an
    // emergency where the effective transcript has none.
    const d = decideCall(
      asUtterances(['my father collapsed and is not breathing', 'actually that was my cat he is fine'])
    );
    expect(d.verdict).toBe('abstain');
    expect(d.canDispatch).toBe(false);
  });

  it('keeps the emergency routed when only the subject was corrected', () => {
    const d = decideCall(
      asUtterances([
        'my father collapsed and is not breathing',
        'sorry i misspoke that is my mother not my father',
      ])
    );
    expect(d.verdict).toBe('CARD-01');
  });

  it('never decides on a withdrawn finding', () => {
    /**
     * The invariant is about the DECISION INPUT, not about spoken strings.
     *
     * This first asserted that no spoken line may contain the withdrawn words,
     * which was wrong: the safety floor says "If they are unresponsive and not
     * breathing normally, start chest compressions right now" — a conditional, not
     * a claim about this patient. Failing that would have meant deleting the
     * zero-risk floor, which is the one thing that must never be removed.
     */
    for (const c of MULTI_TURN_CORPUS) {
      if (!c.mustNotSurvive) continue;
      const d = decideCall(asUtterances(c.turns));
      expect(d.matchText.toLowerCase(), c.id).not.toContain(c.mustNotSurvive.toLowerCase());
      for (const g of d.guidance) {
        expect(
          `${g.category} ${g.anchors.join(' ')}`.toLowerCase(),
          c.id
        ).not.toContain(c.mustNotSurvive.toLowerCase());
      }
    }
  });

  it('never permits dispatch on a conversation that should abstain', () => {
    for (const c of MULTI_TURN_CORPUS.filter((x) => x.expect === 'abstain')) {
      const d = decideCall(asUtterances(c.turns));
      expect(d.canDispatch, `${c.id} dispatched as ${d.verdict}`).toBe(false);
    }
  });

  it('presents exactly one protocol, and only when there is one', () => {
    for (const c of MULTI_TURN_CORPUS) {
      const d = decideCall(asUtterances(c.turns));
      expect(d.protocol === null, c.id).toBe(d.verdict === 'abstain');
    }
  });

  it('reports the same withdrawal notes the console shows', () => {
    // The console used to compute notes in its own useMemo, so the audit line
    // and the decision could disagree. Both now come from decideCall().
    const d = decideCall(
      asUtterances(['my father collapsed and is not breathing', 'actually he is breathing normally i was wrong'])
    );
    expect(d.notes.length).toBeGreaterThan(0);
    expect(d.notes.join(' ')).toMatch(/withdrawn|corrected|changed/i);
  });

  it('is deterministic across repeated calls', () => {
    for (const c of MULTI_TURN_CORPUS) {
      const a = decideCall(asUtterances(c.turns));
      const b = decideCall(asUtterances(c.turns));
      expect(a.verdict, c.id).toBe(b.verdict);
      expect(a.matchText, c.id).toBe(b.matchText);
      expect(a.route.kind, c.id).toBe(b.route.kind);
    }
  });

  it('does not depend on typed vs spoken input', () => {
    for (const c of MULTI_TURN_CORPUS) {
      const spoken = decideCall(c.turns.map((text, seq) => ({ seq, text, source: 'mic' as const })));
      const typed = decideCall(c.turns.map((text, seq) => ({ seq, text, source: 'typed' as const })));
      expect(typed.verdict, c.id).toBe(spoken.verdict);
    }
  });
});
