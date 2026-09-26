/**
 * The clarifying loop — ask instead of guess.
 *
 * ## The problem this solves
 *
 * A six-protocol corpus abstains on most real calls. Stage 3 fixed the dead end
 * by giving generic guidance anyway, but generic guidance cannot use facts only
 * the caller knows. "Are they breathing?" is the single most decisive question
 * in first aid, and we were never asking it.
 *
 * So on an abstention we now ask, one question at a time, and re-triage on each
 * answer. The loop terminates the moment the accumulated answers resolve to a
 * protocol, so we never ask a fifth question we no longer need.
 *
 * ## Why negative answers are excluded from matching
 *
 * This is the most important decision in the file, and it is a safety one.
 *
 * Answers are re-fed into the ranker as text. If "No, not bleeding" were fed
 * verbatim it would contribute the anchor `bleeding` — and a caller who says
 * "there is NO bleeding" could push the engine *towards* a bleeding protocol.
 * The ranker cannot tell assertion from denial; it only sees words.
 *
 * So negative and unknown answers are recorded (the dispatcher needs to see
 * them) but contribute nothing to matching. Only affirmative findings become
 * text. "No bleeding" must never be evidence of bleeding.
 *
 * ## This is a supervised path
 *
 * A dispatcher chooses to ask these questions and reads the answers aloud. The
 * loop never invents an answer, and it can still end in abstention.
 */

import { resolveTriageOutcome } from './retrievalCore';
import type { EmergencyProtocol, TriageOutcome } from '../types';

export interface ClarifyOption {
  label: string;
  /**
   * Text folded into the matching transcript. `null` for negative, unknown, or
   * otherwise non-diagnostic answers — see the file header. An answer with no
   * `matchText` still appears in the transcript and the UI.
   */
  matchText: string | null;
}

export interface ClarifyQuestion {
  id: string;
  text: string;
  /** Why we are asking — shown to the dispatcher, never spoken. */
  rationale: string;
  options: ClarifyOption[];
}

const UNSURE: ClarifyOption = { label: 'Not sure', matchText: null };

/**
 * Order is deliberate and fixed: airway and breathing first because they are
 * immediately lethal and every later answer is worthless if the patient is not
 * breathing. Pregnancy is last because it changes *interpretation*, not
 * immediate action.
 */
export const CLARIFY_QUESTIONS: ClarifyQuestion[] = [
  {
    id: 'breathing',
    text: 'Are they breathing normally right now?',
    rationale: 'Breathing is the fastest way to tell a time-critical call from a routine one.',
    options: [
      { label: 'Yes, breathing normally', matchText: 'breathing normally' },
      { label: 'No, not breathing normally', matchText: 'not breathing normally, gasping, agonal' },
      { label: 'Breathing but struggling', matchText: 'struggling to breathe, wheezing, gasping' },
      UNSURE,
    ],
  },
  {
    id: 'consciousness',
    text: 'Are they conscious and responding to you?',
    rationale: 'Unresponsiveness changes what is safe to give, especially anything by mouth.',
    options: [
      { label: 'Yes, awake and talking', matchText: 'conscious and responding' },
      { label: 'No, unresponsive', matchText: 'unconscious, unresponsive, not responding' },
      { label: 'Confused or drowsy', matchText: 'confused, drowsy, altered mental status' },
      UNSURE,
    ],
  },
  {
    id: 'bleeding',
    text: 'Are they bleeding heavily right now?',
    rationale: 'Heavy bleeding is one of the few things that must be acted on before anything else.',
    options: [
      { label: 'Yes, bleeding heavily', matchText: 'bleeding heavily, spurting blood' },
      { label: 'A little bleeding', matchText: 'minor bleeding' },
      { label: 'No bleeding', matchText: null },
      UNSURE,
    ],
  },
  {
    id: 'age',
    text: 'How old is the person?',
    rationale: 'A baby choking and an adult choking need different techniques.',
    options: [
      { label: 'Under 1 year', matchText: 'infant, baby' },
      { label: 'Child, 1 to 12', matchText: 'child, toddler' },
      { label: 'Adult', matchText: 'adult' },
      { label: 'Older adult', matchText: 'older adult, elderly, geriatric' },
      UNSURE,
    ],
  },
  {
    id: 'pregnancy',
    text: 'Is the patient pregnant?',
    rationale: 'Changes interpretation and technique. Asked last because it is not immediately lethal.',
    options: [
      { label: 'Yes, pregnant', matchText: 'pregnant, pregnancy' },
      { label: 'No', matchText: null },
      UNSURE,
    ],
  },
];

export interface ClarifyAnswer {
  questionId: string;
  question: string;
  optionLabel: string;
  /** True when this answer contributed text to matching. */
  contributed: boolean;
}

export interface ClarifyState {
  /** Original caller speech. Never modified. */
  transcript: string;
  answers: ClarifyAnswer[];
  /** Set once the loop resolves; the loop then stops asking. */
  resolvedProtocolId: string | null;
  stoppedByDispatcher: boolean;
}

export function emptyClarifyState(transcript: string): ClarifyState {
  return { transcript, answers: [], resolvedProtocolId: null, stoppedByDispatcher: false };
}

export function questionById(id: string): ClarifyQuestion | undefined {
  return CLARIFY_QUESTIONS.find((q) => q.id === id);
}

/** The next unanswered question, or null when the set is exhausted. */
export function nextQuestion(state: ClarifyState): ClarifyQuestion | null {
  const answered = new Set(state.answers.map((a) => a.questionId));
  return CLARIFY_QUESTIONS.find((q) => !answered.has(q.id)) ?? null;
}

/**
 * The text used for matching: the caller's own words, plus only the answers
 * that assert something. See the file header for why negatives are excluded.
 */
export function matchingTranscript(state: ClarifyState): string {
  const contributed = state.answers
    .map((a) => {
      const q = questionById(a.questionId);
      const opt = q?.options.find((o) => o.label === a.optionLabel);
      return opt?.matchText ?? null;
    })
    .filter((t): t is string => Boolean(t));

  return [state.transcript, ...contributed].filter(Boolean).join('. ');
}

/** Re-run triage on the caller's words plus affirmative answers. */
export function evaluateClarify(
  state: ClarifyState,
  protocols: EmergencyProtocol[]
): TriageOutcome {
  return resolveTriageOutcome(matchingTranscript(state), protocols);
}

/**
 * Advance the loop by one answer and report what should happen next.
 *
 * Ordering matters: resolve BEFORE choosing the next question, so a match
 * reached by the final answer ends the loop rather than asking one more
 * question we no longer need.
 */
export function advanceClarify(
  state: ClarifyState,
  questionId: string,
  optionLabel: string,
  protocols: EmergencyProtocol[]
): {
  state: ClarifyState;
  outcome: TriageOutcome;
  /** Question to ask next, or null when resolved, exhausted, or stopped. */
  next: ClarifyQuestion | null;
  status: 'resolved' | 'exhausted' | 'asking' | 'stopped';
} {
  const question = questionById(questionId);
  if (!question) {
    return { state, outcome: evaluateClarify(state, protocols), next: null, status: 'stopped' };
  }
  if (state.resolvedProtocolId) {
    return { state, outcome: evaluateClarify(state, protocols), next: null, status: 'resolved' };
  }

  const option = question.options.find((o) => o.label === optionLabel);
  const answers: ClarifyAnswer[] = [
    ...state.answers,
    {
      questionId,
      question: question.text,
      optionLabel,
      contributed: Boolean(option?.matchText),
    },
  ];
  const next: ClarifyState = { ...state, answers };

  const outcome = evaluateClarify(next, protocols);
  if (outcome.kind === 'matched') {
    return {
      state: { ...next, resolvedProtocolId: outcome.protocol.id },
      outcome,
      next: null,
      status: 'resolved',
    };
  }

  const upcoming = nextQuestion(next);
  if (!upcoming) {
    return { state: next, outcome, next: null, status: 'exhausted' };
  }
  return { state: next, outcome, next: upcoming, status: 'asking' };
}

/** A dispatcher may stop asking at any time. The abstention stands. */
export function stopClarify(state: ClarifyState): ClarifyState {
  return { ...state, stoppedByDispatcher: true };
}
