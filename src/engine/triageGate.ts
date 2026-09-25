import type { TriageOutcome, EmergencyProtocol } from '../types';

/**
 * The one predicate that decides whether the app is allowed to SAY a clinical
 * instruction or DISPATCH a unit. Every call site must go through here.
 *
 * Rationale: the previous code spoke `protocol.verbalResponseText` and
 * auto-dispatched MEDIC-14 unconditionally. A misrouted protocol therefore
 * became *spoken aloud to a distressed caller* and *a cardiac rig sent to a
 * woman in labour*. Gating both actions behind a single test makes the
 * unsafe path unrepresentable rather than merely discouraged.
 */

/**
 * Universal, zero-risk safety floor. Permitted on the DEFER path.
 *
 * This is the one action that remains correct in the worst case: if the
 * caller is describing an unresponsive person who is not breathing normally,
 * compressions are indicated. We deliberately do NOT go silent on DEFER,
 * because a cardiac caller hearing nothing may conclude no one is coming.
 */
export const UNIVERSAL_SAFETY_FLOOR =
  'If they are unresponsive and not breathing normally, start chest compressions right now.';

/** Actions that are never wrong regardless of the presentation. */
export const UNIVERSAL_PREARRIVAL_STEPS: string[] = [
  'Call 911 now, or tell someone nearby to call 911.',
  'Put your phone on speaker so you can keep both hands free.',
  'Unlock the door so responders can reach you.',
  'Do not hang up. Stay on the line with the dispatcher.',
  'Note the time the symptoms started.',
];

/** Clarifying questions, asked in order. Used when the app cannot decide. */
export const CLARIFYING_QUESTIONS: string[] = [
  'Are they breathing normally right now?',
  'Are they conscious and responding to you?',
  'Are they bleeding heavily right now?',
  'How old is the person?',
  'Is the patient pregnant?',
];

export const ABSTAIN_COPY: Record<string, string> = {
  'empty-transcript': 'No speech was detected, so no guidance can be given.',
  'no-anchor-match': 'I could not identify this emergency, so I will not guess a protocol.',
  'low-confidence': 'I am not confident enough in a match to give clinical instructions.',
  'low-margin': 'Two different emergencies matched equally well, so I stopped rather than guess.',
  'incomplete-transcript': 'I need a little more detail before giving any instructions.',
};

export function abstainMessage(outcome: Extract<TriageOutcome, { kind: 'abstain' }>): string {
  return ABSTAIN_COPY[outcome.reason] ?? ABSTAIN_COPY['no-anchor-match'];
}

/** True only when we have a matched, non-abstained protocol. */
export function isMatched(outcome: TriageOutcome | null | undefined): outcome is Extract<TriageOutcome, { kind: 'matched' }> {
  return Boolean(outcome) && outcome!.kind === 'matched';
}

/** The single source of truth for "may we speak / may we dispatch". */
export function canDispatch(outcome: TriageOutcome | null | undefined): boolean {
  return isMatched(outcome);
}

/** The protocol to display/speak, or null. Narrowed so callers cannot guess. */
export function matchedProtocol(outcome: TriageOutcome | null | undefined): EmergencyProtocol | null {
  return isMatched(outcome) ? outcome.protocol : null;
}

/** Confidence for display. Abstain reports 0. */
export function confidenceOf(outcome: TriageOutcome | null | undefined): number {
  return outcome ? outcome.confidence : 0;
}

/** Exhaustive switch so a new outcome kind becomes a compile error. */
export function assertNever(x: never): never {
  throw new Error(`Unhandled triage outcome: ${JSON.stringify(x)}`);
}
