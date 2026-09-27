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
  /**
   * Which findings were withdrawn.
   *
   * Empty means the correction was NOT clinical — "that is my mother, not my
   * father" corrects who, not what. Those are recorded for the operator but
   * withdraw no clinical claim, because withdrawing the whole turn would throw
   * away unrelated critical findings the caller never took back.
   */
  predicates: string[];
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
  /** Sequences withdrawn entirely by a later utterance. */
  superseded: number[];
  /**
   * seq -> the utterance with only the retracted claims removed.
   *
   * Clause-level, not utterance-level. "He is unresponsive AND not breathing"
   * with only the responsiveness taken back must keep the breathing.
   */
  reduced: Record<number, string>;
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


/** Predicates this utterance actually makes a claim about. */
function mentionedPredicates(text: string): string[] {
  return PREDICATES.filter((p) => polarityOf(text, p.key) !== null).map((p) => p.key);
}

/**
 * A correction that only RENAMES the person.
 *
 * "Sorry, that's my mother, not my father" changes who is in trouble, not
 * whether anyone is. Withdrawing the whole turn here would throw away "not
 * breathing" from a real cardiac arrest — the worst kind of bug, because the
 * screen then shows nothing wrong while a person is dying.
 *
 * Deliberately narrow. Only an explicit person-swapping phrase counts, because
 * the alternative mistakes are far more expensive: reading "that was my cat" as
 * a mere renaming would leave "completely unresponsive" standing as a live
 * protocol.
 */
function isPersonCorrection(text: string): boolean {
  const PERSON = 'mother|father|mum|mom|mom\b|dad|son|daughter|brother|sister|wife|husband|partner|friend|neighbour|neighbor|grandma|grandad|grandpa|grandmother|grandfather|nan|pop|uncle|aunt|cousin';
  return new RegExp(`\\b(?:that|it)?'?s?\\s+is\\s+my\\s+(?:${PERSON})\\b`, 'i').test(text)
    || new RegExp(`\\bnot\\s+my\\s+(?:${PERSON})\\b`, 'i').test(text)
    || new RegExp(`\\bsorry,?\\s+(?:it)?'?s?\\s+my\\s+(?:${PERSON})\\b`, 'i').test(text);
}

/**
 * "I was wrong about all of that" withdraws everything, not one finding.
 *
 * Without this, a blanket retraction would be read as scoped to whatever
 * predicate it happened to mention, and the caller's "all of it" would be
 * narrowed to a single claim they did not limit it to.
 */
function isBlanketRetraction(text: string): boolean {
  return /\ball (of (that|it|this))?\b|\beverything\b|\bthe whole thing\b|\bnone of (that|it)\b/i.test(text);
}

/**
 * Split into clauses so a retraction can be scoped to one claim.
 *
 * Deliberately crude. It only has to separate "he is unresponsive" from "not
 * breathing", and a cleverer splitter would be easier to fool.
 */
function clauses(text: string): string[] {
  return text
    .split(/\s*(?:,|;|\band\b|\bbut\b|\bthen\b|\balso\b)\s*/i)
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Remove only the clauses that assert the withdrawn findings.
 *
 * This is the fix for the worst bug the multi-turn corpus found: withdrawing the
 * whole previous utterance on any cue. "Sorry, that's my mother not my father"
 * mentioned no clinical finding, so it withdrew nothing — but before this, it
 * also threw away "not breathing" from the same call, turning a cardiac arrest
 * into an abstain. Under-triage is more dangerous than a stale match, because
 * nothing on screen looks wrong.
 */
function dropClaims(text: string, predicates: string[]): string {
  return clauses(text)
    .filter((clause) => !predicates.some((k) => polarityOf(clause, k) !== null))
    .join(' ');
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
  const reduced = new Map<number, string>();
  const retractions: Retraction[] = [];

  for (let i = 1; i < utterances.length; i++) {
    const cur = utterances[i];
    if (!isRetraction(cur.text)) continue;
    const prev = utterances[i - 1];
    // Never withdraw something already withdrawn: the caller is correcting the
    // live statement, not an old one.
    if (superseded.has(prev.seq) || reduced.has(prev.seq)) continue;

    if (isBlanketRetraction(cur.text)) {
      superseded.add(prev.seq);
      reduced.delete(prev.seq);
      retractions.push({ supersedes: prev.seq, by: cur.seq, kind: 'retraction', predicates: [] });
      continue;
    }

    const predicates = mentionedPredicates(cur.text);

    if (predicates.length === 0) {
      if (isPersonCorrection(cur.text)) {
        // Only the identity changed. The person is still in trouble, so NO
        // clinical claim is withdrawn. Recorded so the operator sees the change.
        retractions.push({ supersedes: prev.seq, by: cur.seq, kind: 'correction', predicates: [] });
        continue;
      }
      // No clinical finding named and no person renamed: "that was my cat",
      // "i meant the kettle", "i was wrong, he is fine". The report is being
      // taken back, so withdraw it. Defaulting the other way would leave
      // "completely unresponsive" standing as a live protocol.
      //
      // Corrections CHAIN. "Sorry i misspoke that is my mother" then "actually
      // that was my cat" refers past the subject correction, because the
      // correction never changed the claim. Withdrawing only the immediately
      // preceding turn leaves the original "not breathing" alive and the screen
      // still showing cardiac arrest for a cat. So walk back over the retraction
      // chain and withdraw the claim underneath it.
      let target = i - 1;
      while (
        target > 0 &&
        isRetraction(utterances[target].text) &&
        !superseded.has(utterances[target].seq) &&
        // Stop if the claim underneath is already gone: there is nothing left to
        // withdraw, and the live statement is the one that must be taken back.
        !superseded.has(utterances[target - 1].seq)
      ) {
        target--;
      }
      superseded.add(utterances[target].seq);
      retractions.push({ supersedes: utterances[target].seq, by: cur.seq, kind: 'retraction', predicates: [] });
      continue;
    }

    const kept = dropClaims(prev.text, predicates);
    if (!kept.trim()) superseded.add(prev.seq);
    else reduced.set(prev.seq, kept.trim());
    retractions.push({ supersedes: prev.seq, by: cur.seq, kind: 'correction', predicates });
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

  const live = utterances
    .filter((u) => !superseded.has(u.seq))
    .map((u) => reduced.get(u.seq) ?? u.text)
    .filter((t) => t.trim().length > 0);

  return {
    utterances,
    superseded: [...superseded],
    reduced: Object.fromEntries(reduced),
    retractions,
    contradictions,
    effectiveText: live.join('. ').trim(),
    changed: retractions.length > 0 || contradictions.length > 0,
  };
}

/**
 * Human-readable note for a retraction, for the operator.
 *
 * The wording is load-bearing. This originally said "was withdrawn" for every
 * correction, including ones that deliberately withdrew NOTHING — so the console
 * told the operator that "not breathing" had been taken back when it had not.
 * An audit line that overstates the change is worse than no audit line: the
 * operator stops trusting the ones that matter.
 */
export function describeRetraction(r: Retraction, by: Utterance, was: Utterance): string {
  if (r.kind === 'correction' && r.predicates.length === 0) {
    // A non-clinical correction: the person was renamed, nothing withdrawn.
    return `Corrected — no finding withdrawn: "${by.text}"`;
  }
  if (r.predicates.length > 0) {
    return `Withdrawn (${r.predicates.join(', ')}): "${was.text}" — corrected by "${by.text}"`;
  }
  return `Withdrawn: "${was.text}" — "${by.text}"`;
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
