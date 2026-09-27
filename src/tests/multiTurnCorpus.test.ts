import { describe, it, expect } from 'vitest';
import { MULTI_TURN_CORPUS, type ConversationCase } from '../eval/multiTurnCorpus';
import { buildTimeline, type Utterance } from '../engine/callTimeline';
import { resolveTriageOutcome } from '../engine/retrievalCore';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';
import { matchedProtocol, canDispatch } from '../engine/triageGate';

/**
 * CI gate for conversations. A conversation is harder to get right than a
 * phrase, so the bar is a perfect score: there is no "mostly fine" when the
 * failure mode is a stale critical protocol.
 */
export const MULTI_TURN_THRESHOLD = 1.0;

/**
 * Replays a conversation through the SAME path the app uses.
 *
 * This is the point of the file. Stage 7 changed the app to match on the
 * effective transcript rather than the latest turn, so the harness must do the
 * same or it is testing a different system than the one that ships.
 */
export function replay(turns: string[]) {
  const utterances: Utterance[] = turns.map((text, seq) => ({ seq, text, source: 'mic' }));
  const timeline = buildTimeline(utterances);
  const effectiveText = timeline.effectiveText;
  const outcome = resolveTriageOutcome(effectiveText, EMERGENCY_PROTOCOLS);
  const protocol = matchedProtocol(outcome);
  return {
    effectiveText,
    outcome,
    protocol,
    actual: protocol ? protocol.id : 'abstain',
    timeline,
  };
}

interface Failure extends ConversationCase {
  actual: string;
  effectiveText: string;
  retractions: number;
}

function runCorpus() {
  const failures: Failure[] = [];
  for (const c of MULTI_TURN_CORPUS) {
    const r = replay(c.turns);
    if (r.actual !== c.expect) {
      failures.push({ ...c, actual: r.actual, effectiveText: r.effectiveText, retractions: r.timeline.retractions.length });
    }
  }
  return { failures, total: MULTI_TURN_CORPUS.length };
}

describe('the multi-turn corpus is well-formed', () => {
  it('actually has multiple turns, or it is testing nothing new', () => {
    // A single-turn case here would be a duplicate of goldenCorpus and would
    // make the whole file look like coverage it is not.
    for (const c of MULTI_TURN_CORPUS) {
      expect(c.turns.length, c.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('only expects protocols that exist', () => {
    const ids = new Set(EMERGENCY_PROTOCOLS.map((p) => p.id));
    for (const c of MULTI_TURN_CORPUS) {
      if (c.expect !== 'abstain') {
        expect(ids.has(c.expect), `${c.id} expects missing ${c.expect}`).toBe(true);
      }
    }
  });

  it('covers both outcomes', () => {
    expect(MULTI_TURN_CORPUS.some((c) => c.expect === 'abstain')).toBe(true);
    expect(MULTI_TURN_CORPUS.some((c) => c.expect !== 'abstain')).toBe(true);
  });

  it('has unique ids', () => {
    const ids = MULTI_TURN_CORPUS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('documents why every case exists', () => {
    for (const c of MULTI_TURN_CORPUS) {
      expect(c.note.length, c.id).toBeGreaterThan(20);
    }
  });
});

describe('every conversation resolves as labelled', () => {
  const { failures } = runCorpus();

  it('resolves exactly as the corpus expects', () => {
    if (failures.length === 0) return;
    const detail = failures
      .map((f) => {
        return (
          `  ${f.id}: expected ${f.expect}, got ${f.actual}\n` +
          `     matched on: "${f.effectiveText}"\n` +
          `     retractions detected: ${f.retractions}`
        );
      })
      .join('\n');
    throw new Error(`${failures.length} conversation(s) failed:\n${detail}`);
  });

  it(`meets the conversation gate (${MULTI_TURN_THRESHOLD})`, () => {
    const { failures, total } = runCorpus();
    expect(1 - failures.length / total).toBeGreaterThanOrEqual(MULTI_TURN_THRESHOLD);
  });
});

/**
 * The invariant that matters most, asserted separately from the outcome.
 *
 * A withdrawn finding that is still in the matched transcript is a live safety
 * defect even when the final protocol happens to be right — because the next
 * case to move could turn it wrong.
 */
describe('withdrawn information never survives into what gets matched', () => {
  for (const c of MULTI_TURN_CORPUS.filter((x) => x.mustNotSurvive)) {
    it(`${c.id}: "${c.mustNotSurvive}" is gone from the matched text`, () => {
      const { effectiveText } = replay(c.turns);
      expect(effectiveText.toLowerCase()).not.toContain(c.mustNotSurvive!.toLowerCase());
    });
  }
});

describe('the abstain contract holds across conversations', () => {
  it('never permits dispatch on a conversation that should abstain', () => {
    for (const c of MULTI_TURN_CORPUS.filter((x) => x.expect === 'abstain')) {
      const { outcome, actual } = replay(c.turns);
      expect(canDispatch(outcome), `${c.id} dispatched as ${actual}`).toBe(false);
    }
  });
});

describe('conversations are deterministic', () => {
  it('replays identically every time', () => {
    for (const c of MULTI_TURN_CORPUS) {
      const a = replay(c.turns);
      const b = replay(c.turns);
      expect(a.actual, c.id).toBe(b.actual);
      expect(a.effectiveText, c.id).toBe(b.effectiveText);
    }
  });

  it('does not depend on typed vs spoken input', () => {
    for (const c of MULTI_TURN_CORPUS) {
      const spoken = replay(c.turns);
      const typed = (() => {
        const utterances: Utterance[] = c.turns.map((text, seq) => ({ seq, text, source: 'typed' }));
        const t = buildTimeline(utterances);
        const outcome = resolveTriageOutcome(t.effectiveText, EMERGENCY_PROTOCOLS);
        const p = matchedProtocol(outcome);
        return { actual: p ? p.id : 'abstain' };
      })();
      expect(typed.actual, c.id).toBe(spoken.actual);
    }
  });
});
