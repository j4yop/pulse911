/**
 * Multi-turn conversation corpus.
 *
 * ## Why this exists separately from the golden corpus
 *
 * `goldenCorpus.ts` is `{ phrase, expect }` — one utterance, one outcome. That is
 * the right shape for testing a ranker and the wrong shape for testing a
 * *conversation*.
 *
 * Stage 7 changed what the app matches on: not the latest utterance, but
 * everything the caller said minus what they have since taken back. That change
 * shipped with no corpus able to see it, because no case had more than one turn.
 * A feature that alters the decision input, tested only on single turns, is a
 * feature nobody has actually tested.
 *
 * ## The rule for writing cases here
 *
 * **Label what is clinically correct, not what the engine currently does.**
 * If a case fails, that is a finding to report and fix — never a label to adjust
 * until green. A corpus written to match the implementation protects the
 * implementation, including its bugs.
 *
 * ## What is deliberately NOT here
 *
 * Two-overlapping-speakers ("he is fine — she is not breathing") is a known
 * unsolved gap, tracked in `docs/CALL_TIMELINE_WORKFLOW.md`. There is no case
 * pretending it works.
 */

import type { ExpectedOutcome } from './goldenCorpus';

export interface ConversationCase {
  id: string;
  /** What the caller said, in order. */
  turns: string[];
  /** The protocol this conversation must resolve to, or 'abstain'. */
  expect: ExpectedOutcome;
  /**
   * Text that must NOT survive into what gets matched. A withdrawn finding that
   * is still in the matched transcript is a live safety defect, so it is
   * asserted separately from the protocol outcome.
   */
  mustNotSurvive?: string;
  note: string;
}

// ── A withdrawn critical finding must stop driving the outcome ───────────────

const WITHDRAWAL: ConversationCase[] = [
  {
    id: 'retract-not-breathing',
    turns: [
      'he collapsed and is not breathing',
      'actually he is breathing normally i was wrong',
    ],
    expect: 'abstain',
    mustNotSurvive: 'not breathing',
    note:
      'The caller took back the most important finding in the call. Showing cardiac ' +
      'arrest on withdrawn evidence is confidently wrong, which is worse than showing nothing.',
  },
  {
    id: 'retract-then-reassert',
    turns: [
      'he is not breathing',
      'actually he is breathing normally i was wrong',
      'no wait he has stopped breathing again',
    ],
    expect: 'CARD-01',
    note:
      'Withdrawal then re-assertion. The newest statement wins, so a genuine ' +
      'recurrence of the critical finding must still be caught.',
  },
  {
    id: 'retract-everything',
    turns: [
      'he collapsed and is not breathing',
      'actually i was wrong about all of that',
    ],
    expect: 'abstain',
    mustNotSurvive: 'not breathing',
    note:
      'Everything is withdrawn. What is left is a retraction, which is not an ' +
      'emergency, so the correct answer is to have no protocol.',
  },
  {
    id: 'retraction-chain-reaches-the-claim',
    turns: [
      'my father collapsed and is not breathing',
      'sorry i misspoke that is my mother not my father',
      'actually that was my cat he is fine',
    ],
    expect: 'abstain',
    mustNotSurvive: 'not breathing',
    note:
      'The three-turn chain that a two-turn corpus cannot see. The subject ' +
      'correction changed nothing clinical, so the later "that was my cat" refers ' +
      'past it to the original claim. Withdrawing only the immediately preceding ' +
      'turn left "not breathing" alive and cardiac arrest on screen for a cat.',
  },
  {
    id: 'retract-unresponsive',
    turns: [
      'he is completely unresponsive',
      'sorry that was my cat he is fine',
    ],
    expect: 'abstain',
    mustNotSurvive: 'unresponsive',
    note: 'Not a person. A withdrawn critical finding must not leave a protocol up.',
  },
];

// ── A correction that changes nothing important must not lose the finding ────

const CORRECTION: ConversationCase[] = [
  {
    id: 'correct-subject-keep-critical',
    turns: [
      'my father collapsed and is not breathing',
      'sorry i misspoke that is my mother not my father',
    ],
    expect: 'CARD-01',
    note:
      'The subject was corrected, NOT the emergency. An earlier version reopened the ' +
      'breathing question for a "who" correction, which is nonsense. The critical ' +
      'finding stands and the protocol must survive the correction.',
  },
  {
    id: 'correct-after-clarify-does-not-lose-finding',
    turns: [
      'my dad collapsed in the kitchen',
      'he is not breathing and he is turning blue',
    ],
    expect: 'CARD-01',
    note:
      'Escalation mid-call. The second turn is new information, not a reply to any ' +
      'question, and must be triaged rather than consumed as an answer.',
  },
  {
    id: 'escalation-then-retract-unrelated',
    turns: [
      'he collapsed in the kitchen',
      'he is not breathing and turning blue',
      'actually i meant the kettle that was boiling over',
    ],
    expect: 'abstain',
    mustNotSurvive: 'not breathing',
    note: 'A mistaken emergency. Withdrawing the real turns must clear the protocol.',
  },
];

// ── A flipped finding is a real change in the picture ───────────────────────

const CONTRADICTION: ConversationCase[] = [
  {
    id: 'consciousness-flipped-negative-stands',
    turns: ['he is unresponsive and not breathing', 'actually he is talking to me'],
    expect: 'CARD-01',
    note:
      'Consciousness was taken back but breathing was not. One finding changing must ' +
      'not discard the others, and the remaining critical finding must still be caught.',
  },
  {
    id: 'consciousness-flipped-back',
    turns: [
      'he is unresponsive and not breathing',
      'actually he is talking to me normally',
      'no he has stopped responding again',
    ],
    expect: 'CARD-01',
    note: 'Flip, then flip back. The newest statement is what counts.',
  },
];

// ── Ordinary calls must not accumulate their way into a match ───────────────

const NON_URGENT: ConversationCase[] = [
  {
    id: 'chatter-stays-abstain',
    turns: ['hello is anyone there', 'yes i can hear you', 'thank you so much'],
    expect: 'abstain',
    note:
      'Nothing here is an emergency. Accumulating turns must never let a conversation ' +
      'drift into a match that no single turn justifies.',
  },
  {
    id: 'repeat-concern-no-drift',
    turns: [
      'i am really worried about my chest',
      'i am really worried about my chest',
      'i am really worried about my chest',
    ],
    expect: 'abstain',
    note:
      'Repeating a non-emergency complaint three times must not raise confidence. ' +
      'Repetition is not evidence.',
  },
  {
    id: 'retraction-then-chatter',
    turns: [
      'he collapsed and is not breathing',
      'actually i was wrong, he is fine',
      'ok bye',
    ],
    expect: 'abstain',
    mustNotSurvive: 'not breathing',
    note: 'Withdrawn, then the call winds down. Nothing should be left standing.',
  },
];

export const MULTI_TURN_CORPUS: ConversationCase[] = [
  ...WITHDRAWAL,
  ...CORRECTION,
  ...CONTRADICTION,
  ...NON_URGENT,
];

export function conversationSummary() {
  const byExpect = new Map<string, number>();
  for (const c of MULTI_TURN_CORPUS) {
    byExpect.set(c.expect, (byExpect.get(c.expect) ?? 0) + 1);
  }
  return { total: MULTI_TURN_CORPUS.length, byExpect: [...byExpect.entries()] };
}
