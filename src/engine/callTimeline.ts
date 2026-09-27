/**
 * The call timeline — what the caller has actually said, over time.
 *
 * ## Why this exists
 *
 * The engine used to treat every utterance as the complete picture. Each one was
 * triaged in isolation and the result replaced the last, so a caller could not
 * change their mind. Reproduced in a browser:
 *
 *   "my father collapsed in the kitchen"   -> CARD-01, asks about breathing
 *   "he is not breathing"                  -> CARD-01
 *   "actually he is breathing normally"    -> **CARD-01**  ← retraction ignored
 *
 * A retraction of the single most important finding left a stale cardiac arrest
 * on screen with nothing indicating it was stale. In a tool whose whole premise
 * is that the operator trusts the screen, a stale critical match is worse than
 * no match: it is confidently wrong.
 *
 * Real callers backtrack, correct themselves, change who they are talking about,
 * and contradict earlier statements. That is normal, not an error to be
 * discarded. This module makes those cases first-class.
 *
 * ## The rule this module follows
 *
 * **Later information supersedes earlier information, and the supersession is
 * always visible.** It never silently edits history — `retractions` and
 * `contradictions` are returned so the console can show what was withdrawn and
 * what flipped. An operator must be able to see that "he is not breathing" was
 * taken back, because that decision is clinical.
 *
 * ## Deliberate limits
 *
 * - Deterministic and side-effect free, so it can be tested without a browser.
 * - It does NOT decide a protocol. It produces the transcript that should be
 *   matched on, plus the changes an operator needs to see. Deciding remains the
 *   triage gate's job.
 * - Polarity tracking covers a small set of high-consequence predicates
 *   (breathing, pulse, consciousness, bleeding, choking). It is a safety net for
 *   the findings that change the protocol, not a clinical parser.
 */

export type UtteranceSource = 'mic' | 'typed';

export interface Utterance {
  /** Monotonic sequence. Deliberately not a clock: tests must be deterministic. */
  seq: number;
  text: string;
  source: UtteranceSource;
}

export interface Retraction {
  /** The utterance this one takes back. */
  supersedes: number;
  by: number;
  kind: 'retraction' | 'correction';
}

export interface Contradiction {
  /** The utterance that flipped it. */
  seq: number;
  /** The utterance it contradicts. */
  previous: number;
  predicate: string;
  from: 'positive' | 'negative';
  to: 'positive' | 'negative';
}

export interface CallTimeline {
  utterances: Utterance[];
  /** Sequences withdrawn by a later utterance. */
  superseded: number[];
  retractions: Retraction[];
  contradictions: Contradiction[];
  /** What should actually be matched on: withdrawn utterances removed. */
  effectiveText: string;
  /** True when a withdrawal or flip happened, so the console can say so. */
  changed: boolean;
}

// ---------------------------------------------------------------- cues

/**
 * Phrases that mean "take back what I just said".
 *
 * Kept explicit rather than clever. A missed cue means a stale critical finding
 * stays on screen, so this list errs toward catching ordinary speech.
 */
const RETACTION_CUES: RegExp[] = [
  /\bsorry\b/i,
  /\bi misspoke\b/i,
  /\bi was wrong\b/i,
  /\bactually\b/i,
  /\bno wait\b/i,
  /\bcorrection\b/i,
  /\bscratch that\b/i,
  /\bignore (that|what i said)\b/i,
  /\bthat'?s wrong\b/i,
  /\bnot (him|her|them)\b/i,
  /\bi meant\b/i,
  /\bnever ?mind\b/i,
  /\bthat was (wrong|my (sister|brother|wife|husband|mother|father))\b/i,
];

/** Withdraws the immediately preceding utterance. */
export function isRetraction(text: string): boolean {
  return RETACTION_CUES.some((re: RegExp) => re.test(text));
}

// ------------------------------------------------------------ polarity

type Polarity = 'positive' | 'negative';

interface Predicate {
  key: string;
  label: string;
  /** Checked FIRST: "not choking" also contains "choking". */
  negative: RegExp[];
  positive: RegExp[];
}

/**
 * Only findings that change the protocol are tracked.
 *
 * Kept small and blunt on purpose. A wide, clever predicate grammar would be
 * easier to fool, and every false positive here tells the operator that a real
 * finding was withdrawn.
 */
const PREDICATES: Predicate[] = [
  {
    key: 'breathing',
    label: 'breathing',
    negative: [
      /\bnot breathing\b/i,
      /\bisn'?t breathing\b/i,
      /\bno breathing\b/i,
      /\bnot breathing normally\b/i,
      /\bcan'?t breathe\b/i,
      /\bapneic\b/i,
      /\bagonal\b/i,
      /\bgasping\b/i,
    ],
    positive: [/\bbreathing (normally|fine|ok|okay|well)\b/i, /\bbreathing\b/i],
  },
  {
    key: 'pulse',
    label: 'pulse',
    negative: [/\bno pulse\b/i, /\bpulseless\b/i, /\bno heartbeat\b/i],
    positive: [/\bhas a pulse\b/i, /\bcan feel a pulse\b/i],
  },
  {
    key: 'consciousness',
    label: 'responsive',
    negative: [
      /\bunresponsive\b/i,
      /\bunconscious\b/i,
      /\bnot responding\b/i,
      /\bnot responding to\b/i,
      /\bpassed out\b/i,
      /\bnot waking\b/i,
    ],
    positive: [/\bawake\b/i, /\bconscious\b/i, /\bresponsive\b/i, /\btalking to me\b/i],
  },
  {
    key: 'bleeding',
    label: 'bleeding',
    negative: [/\bno bleeding\b/i, /\bnot bleeding\b/i, /\bbleeding (has stopped|stopped)\b/i],
    positive: [/\bbleeding\b/i, /\bblood\b/i],
  },
  {
    key: 'choking',
    label: 'choking',
    negative: [/\bnot choking\b/i, /\bno longer choking\b/i],
    positive: [/\bchoking\b/i],
  },
];

/**
 * Polarity of a predicate in one utterance, or null if it is not mentioned.
 *
 * Negation is always tested first. "not choking" and "he is breathing" are the
 * two cases where testing in the wrong order invents the opposite finding.
 */
export function polarityOf(text: string, key: string): Polarity | null {
  const p = PREDICATES.find((x) => x.key === key);
  if (!p) return null;
  if (p.negative.some((re) => re.test(text))) return 'negative';
  if (p.positive.some((re) => re.test(text))) return 'positive';
  return null;
}

// ------------------------------------------------------------ timeline

/**
 * Fold utterances into a call timeline.
 *
 * Two things are detected:
 *
 * 1. **Retraction** — a cue phrase withdraws the immediately preceding
 *    utterance, which is then excluded from `effectiveText`.
 * 2. **Contradiction** — the same predicate flips polarity between the latest
 *    live utterance and an earlier one. Reported, not resolved: the newest
 *    statement wins for matching, but the operator sees that it changed.
 */
export function buildTimeline(utterances: Utterance[]): CallTimeline {
  const superseded = new Set<number>();
  const retractions: Retraction[] = [];

  for (let i = 1; i < utterances.length; i++) {
    if (!isRetraction(utterances[i].text)) continue;
    const prev = utterances[i - 1];
    // Never retract the correction itself, and never retract an already-dead
    // utterance (the operator is correcting the live statement, not an old one).
    if (superseded.has(prev.seq)) continue;
    superseded.add(prev.seq);
    retractions.push({ supersedes: prev.seq, by: utterances[i].seq, kind: 'retraction' });
  }

  // Contradictions are detected across the WHOLE call, including utterances that
  // were later withdrawn.
  //
  // This matters: "actually he is breathing normally" both retracts "he is not
  // breathing" AND contradicts it. Skipping withdrawn utterances deleted the
  // evidence of the flip, so the single most important change in the call went
  // unreported. A flip that happened is a historical fact whether or not we
  // still act on it — and the operator must see that it happened.
  const contradictions: Contradiction[] = [];
  const lastSeen = new Map<string, { seq: number; polarity: Polarity }>();
  for (const u of utterances) {
    for (const p of PREDICATES) {
      const now = polarityOf(u.text, p.key);
      if (!now) continue;
      const before = lastSeen.get(p.key);
      if (before && before.polarity !== now) {
        contradictions.push({
          seq: u.seq,
          previous: before.seq,
          predicate: p.key,
          from: before.polarity,
          to: now,
        });
      }
      lastSeen.set(p.key, { seq: u.seq, polarity: now });
    }
  }

  const live = utterances.filter((u) => !superseded.has(u.seq));

  return {
    utterances,
    superseded: [...superseded],
    retractions,
    contradictions,
    effectiveText: live.map((u) => u.text).join('. ').trim(),
    changed: retractions.length > 0 || contradictions.length > 0,
  };
}

/** Human-readable note for a retraction, for the operator. */
export function describeRetraction(r: Retraction, by: Utterance, was: Utterance): string {
  return `"${was.text}" was withdrawn — "${by.text}"`;
}

/** Human-readable note for a contradiction, for the operator. */
export function describeContradiction(
  c: Contradiction,
  previous: Utterance,
  current: Utterance
): string {
  const label = PREDICATES.find((p) => p.key === c.predicate)?.label ?? c.predicate;
  const was = c.from === 'positive' ? 'present' : 'absent';
  const now = c.to === 'positive' ? 'present' : 'absent';
  return `${label} changed from ${was} to ${now}`;
}
