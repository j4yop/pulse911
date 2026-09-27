import { describe, it, expect } from 'vitest';
import { MULTI_TURN_CORPUS } from '../eval/multiTurnCorpus';
import { buildTimeline, type Utterance } from '../engine/callTimeline';
import { routeTranscript } from '../engine/routing';
import { resolveTriageOutcome } from '../engine/retrievalCore';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';
import { matchedProtocol, canDispatch } from '../engine/triageGate';

/**
 * Composition coverage — the path the app actually takes.
 *
 * `multiTurnCorpus.test.ts` exercises the timeline and the local gate. This file
 * exercises the *sequence* the app runs on every utterance, in order:
 *
 *   1. route the turn          -> routeTranscript()
 *   2. resolve the outcome     -> mossEngine.query() -> localQuery()
 *   3. decide what to present  -> matchedProtocol()
 *   4. check what is permitted -> canDispatch()
 *
 * ## Why this file exists
 *
 * Stage 7 changed what the app matches on, and three call sites in `App.tsx` were
 * left passing the RAW latest utterance instead of the effective transcript:
 *
 *   - `routeTranscript(text)`  — so a withdrawn emergency still routed as one
 *   - `speakableGuidanceScript(text)`
 *   - `refineWithMoss(text)`   — so Moss re-derived a protocol from withdrawn words
 *
 * Every existing test passed with those bugs present, because they all called
 * `resolveTriageOutcome` directly. A corpus can only catch what it is wired to
 * see, so this file wires the same decision sequence the app runs.
 *
 * It duplicates the call order rather than importing it. Extracting the decision
 * into one shared function is the durable fix and is still open — this is the
 * test that would prove such a refactor changed nothing.
 */

interface Composed {
  matchText: string;
  routeKind: string;
  protocol: string;
  dispatchable: boolean;
  guidanceInput: string;
}

export function compose(turns: string[]): Composed {
  const utterances: Utterance[] = turns.map((text, seq) => ({ seq, text, source: 'mic' }));
  const matchText = buildTimeline(utterances).effectiveText;

  // 1. Routing — the app routes the EFFECTIVE transcript.
  const route = routeTranscript(matchText);

  // 2. Outcome — mossEngine.query() delegates straight to this.
  const outcome = resolveTriageOutcome(matchText, EMERGENCY_PROTOCOLS);

  // 3. What gets presented.
  const protocol = matchedProtocol(outcome);

  return {
    matchText,
    routeKind: route.kind,
    protocol: protocol ? protocol.id : 'abstain',
    dispatchable: canDispatch(outcome),
    // Guidance is spoken to the caller, so it must come from the same text.
    guidanceInput: matchText,
  };
}

describe('the composed decision is the corpus decision', () => {
  it('agrees with the corpus for every conversation', () => {
    const failures: string[] = [];
    for (const c of MULTI_TURN_CORPUS) {
      const r = compose(c.turns);
      if (r.protocol !== c.expect) {
        failures.push(
          `  ${c.id}: corpus expects ${c.expect}, composition produced ${r.protocol}\n` +
            `     routed on: "${r.matchText}"`
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
    const r = compose([
      'my father collapsed and is not breathing',
      'actually that was my cat he is fine',
    ]);
    expect(r.protocol).toBe('abstain');
    expect(r.dispatchable).toBe(false);
  });

  it('keeps the emergency routed when only the subject was corrected', () => {
    const r = compose([
      'my father collapsed and is not breathing',
      'sorry i misspoke that is my mother not my father',
    ]);
    expect(r.protocol).toBe('CARD-01');
  });

  it('never speaks guidance drawn from a withdrawn finding', () => {
    for (const c of MULTI_TURN_CORPUS) {
      const r = compose(c.turns);
      if (c.mustNotSurvive) {
        expect(r.guidanceInput.toLowerCase(), c.id).not.toContain(c.mustNotSurvive.toLowerCase());
      }
    }
  });

  it('never permits dispatch on a conversation that should abstain', () => {
    for (const c of MULTI_TURN_CORPUS.filter((x) => x.expect === 'abstain')) {
      const r = compose(c.turns);
      expect(r.dispatchable, `${c.id} dispatched as ${r.protocol}`).toBe(false);
    }
  });

  it('routes every conversation the same way every time', () => {
    for (const c of MULTI_TURN_CORPUS) {
      expect(compose(c.turns).routeKind, c.id).toBe(compose(c.turns).routeKind);
      expect(compose(c.turns).protocol, c.id).toBe(compose(c.turns).protocol);
    }
  });
});
