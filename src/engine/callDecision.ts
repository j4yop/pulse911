/**
 * The call decision — one function, used by the app and by the tests.
 *
 * ## Why this exists
 *
 * Three bugs shipped where the app judged the raw latest utterance while the
 * tests judged the effective transcript (`routeTranscript(text)`,
 * `speakableGuidanceScript(text)`, `refineWithMoss(text)`). Every test passed,
 * because every test called `resolveTriageOutcome` directly and the app ran a
 * longer sequence. The tests were not wrong; they were wired to a different
 * system than the one that ships.
 *
 * The first attempt at closing that was `callComposition.test.ts`, which
 * *duplicated* the app's decision order. That was better than nothing and still
 * wrong: a duplicated sequence can drift from the real one silently, and a test
 * that reimplements the thing it is testing proves very little.
 *
 * So the decision lives here, once. The app calls it and renders the result. The
 * corpus calls the same function. There is no second copy to drift.
 *
 * ## The rule this enforces
 *
 * **Everything downstream of "what has the caller said" reads the effective
 * transcript.** There is no second source of truth, so a new call site cannot
 * accidentally reach for the raw utterance — the reason the original three bugs
 * existed.
 *
 * This function decides nothing clinical. It assembles what the triage gate,
 * routing and guidance already decided. It never selects a protocol on its own.
 */

import { routeTranscript, type RouteVerdict } from './routing';
import { resolveTriageOutcome } from './retrievalCore';
import { guidanceFor, speakableGuidanceScript, canDispatch, matchedProtocol } from './triageGate';
import { EMERGENCY_PROTOCOLS } from './emergencyProtocols';
import type { EmergencyProtocol, TriageOutcome } from '../types';
import type { CategoryMatch } from './guidanceCategories';
import {
  buildTimeline,
  describeContradiction,
  describeRetraction,
  type CallTimeline,
  type Utterance,
} from './callTimeline';

export interface CallDecision {
  /** Everything the caller said, minus what they have taken back. */
  matchText: string;
  timeline: CallTimeline;
  route: RouteVerdict;
  outcome: TriageOutcome;
  /** The protocol to present, or null. The single place this is decided. */
  protocol: EmergencyProtocol | null;
  canDispatch: boolean;
  guidance: CategoryMatch[];
  /** Guidance as spoken lines. Derived from `matchText`, never the raw turn. */
  speakable: string[];
  /** Withdrawals and changed findings, for the operator. */
  notes: string[];
  /** 'abstain' or a protocol id — convenient for assertions. */
  verdict: string;
}

/** Append a turn and decide, in one step. The app's only entry point. */
export function decideCall(utterances: Utterance[]): CallDecision {
  const timeline = buildTimeline(utterances);
  const matchText = timeline.effectiveText;

  const route = routeTranscript(matchText);
  const outcome = resolveTriageOutcome(matchText, EMERGENCY_PROTOCOLS);
  const protocol = matchedProtocol(outcome);

  return {
    matchText,
    timeline,
    route,
    outcome,
    protocol,
    canDispatch: canDispatch(outcome),
    guidance: guidanceFor(matchText),
    speakable: speakableGuidanceScript(matchText),
    notes: describeCall(timeline),
    verdict: protocol ? protocol.id : 'abstain',
  };
}

/** Operator-facing notes. Kept here so tests and the console cannot disagree. */
function describeCall(timeline: CallTimeline): string[] {
  const notes: string[] = [];
  for (const r of timeline.retractions) {
    const was = timeline.utterances.find((x) => x.seq === r.supersedes);
    const by = timeline.utterances.find((x) => x.seq === r.by);
    if (was && by) notes.push(describeRetraction(r, by, was));
  }
  for (const c of timeline.contradictions) {
    const prev = timeline.utterances.find((x) => x.seq === c.previous);
    const cur = timeline.utterances.find((x) => x.seq === c.seq);
    if (prev && cur) notes.push(`Changed: ${describeContradiction(c, prev, cur)} ("${prev.text}" -> "${cur.text}")`);
  }
  return notes;
}
