/**
 * Voice answering for the clarifying loop.
 *
 * Stage 2 asked for "answered by voice or tap". Tap shipped; voice did not. On
 * a console whose whole premise is a caller speaking while the operator's hands
 * are busy, tap-only means the feature is half-built.
 *
 * ## The safety problem, stated plainly
 *
 * Speech recognition misfires. If a misfire can silently select a clinical
 * option, then voice answering is *less* safe than tapping — it turns a
 * deliberate act into an accidental one, and a wrong answer here can select the
 * wrong protocol for a real person.
 *
 * So this module is built to refuse rather than guess:
 *
 * - An answer must be **clearly** one of the offered options. A near-miss
 *   returns null and nothing happens.
 * - Short utterances ("yes", "no", "yeah", "nah", "not sure") are mapped
 *   deliberately, because that is how people actually answer.
 * - Free text that matches nothing returns null. The operator is told it was not
 *   recognised and the buttons stay.
 * - The caller never sees a wrong answer: the matched option is rendered in the
 *   answer trail with a "(voice)" marker, so a misfire is visible and can be
 *   overridden by tapping the right one.
 *
 * Nothing here ever runs triage. It only ever selects among options the
 * dispatcher is already looking at.
 */

import type { ClarifyOption, ClarifyQuestion } from './clarify';

/** Bare affirmatives and negatives, normalised. */
const YES = new Set([
  'yes', 'yeah', 'yep', 'yup', 'sure', 'correct', 'right', 'affirmative', 'ok', 'okay',
  'yes it is', 'yes they are', 'he is', 'she is', 'they are',
]);
const NO = new Set([
  'no', 'nope', 'nah', 'not', 'negative', 'incorrect', 'wrong', 'no it is not',
  'no they are not', 'he is not', 'she is not', 'they are not',
]);
const UNSURE = new Set([
  'not sure', 'unsure', 'unknown', 'dunno', 'do not know', 'no idea', 'not certain',
  'cannot tell', 'cant tell', 'i do not know', 'i dont know',
]);

function normalise(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

/** Coarse intent of a short spoken answer, or null. */
function bareIntent(spoken: string): 'yes' | 'no' | 'unsure' | null {
  const s = normalise(spoken).trim();
  if (YES.has(s)) return 'yes';
  if (NO.has(s)) return 'no';
  if (UNSURE.has(s)) return 'unsure';
  return null;
}

/** The "Yes, ..." / "No, ..." / "Not sure" options on a question. */
function classifyOptions(options: ClarifyOption[]) {
  const yes: ClarifyOption[] = [];
  const no: ClarifyOption[] = [];
  const unsure: ClarifyOption[] = [];
  const other: ClarifyOption[] = [];

  for (const o of options) {
    const l = normalise(o.label).trim();
    if (UNSURE.has(l) || l.includes('not sure')) unsure.push(o);
    else if (l.startsWith('yes')) yes.push(o);
    else if (l === 'no' || l.startsWith('no ')) no.push(o);
    // "Breathing but struggling" and "Adult" are real options but are not
    // yes/no answers, so a bare "yes" must never land on them.
    else other.push(o);
  }
  return { yes, no, unsure, other };
}

/**
 * Match a spoken answer to one of a question's options.
 *
 * Returns null unless the match is unambiguous. That refusal is the point: a
 * dispatcher who says something we do not understand gets the buttons, not a
 * guessed clinical selection.
 */
export function matchSpokenAnswer(
  spoken: string,
  question: ClarifyQuestion
): ClarifyOption | null {
  const text = normalise(spoken);
  const tokens = text.split(' ').filter(Boolean);
  if (tokens.length === 0) return null;

  const { yes, no, unsure } = classifyOptions(question.options);

  /**
   * A yes/no marker only resolves when the question offers exactly one option
   * of that kind. Two "No, ..." options plus a bare "no" is a coin flip.
   */
  const markerMatch = (opts: ClarifyOption[]) => (opts.length === 1 ? opts[0] : null);

  // 1. Whole-utterance intent for a whole short utterance ("yeah", "not sure", "no idea").
  const intent = bareIntent(text);
  if (intent) {
    const hit =
      intent === 'yes' ? markerMatch(yes) : intent === 'no' ? markerMatch(no) : markerMatch(unsure);
    if (hit) return hit;
    return null;
  }

  // 2. A deliberate leading yes/no/unsure marker wins outright, and is also
  //    stripped before content matching — "yes she is pregnant" is an answer,
  //    not a phrase that matches nothing.
  const lead = tokens[0];
  const leadIntent =
    YES.has(lead) ? 'yes' : NO.has(lead) ? 'no' : UNSURE.has(lead) ? 'unsure' : null;

  if (leadIntent) {
    const hit =
      leadIntent === 'yes' ? markerMatch(yes) : leadIntent === 'no' ? markerMatch(no) : markerMatch(unsure);
    if (hit) return hit;
  }

  // 3. Content matching. An option that ANSWERS yes or no must also agree with
  //    the marker the operator used, otherwise "breathing normally" would tie
  //    the Yes and No options on their shared words.
  const content = leadIntent ? tokens.slice(1).join(' ') : text;
  const saidNo = content.includes(' no ') || content.trim().startsWith('no ');
  const saidYes = content.includes(' yes ') || content.trim().startsWith('yes ');

  const scored = question.options
    .map((o) => {
      const words = normalise(o.label).trim().split(' ').filter((w) => w.length > 3);
      if (words.length === 0) return null;
      const matched = words.filter((w) => content.includes(w)).length;
      if (matched !== words.length) return null;
      const l = normalise(o.label).trim();
      const isNo = l === 'no' || l.startsWith('no ');
      const isYes = l.startsWith('yes');
      // A yes/no option contradicted by the operator's own marker is out.
      if (isNo && saidYes) return null;
      if (isYes && saidNo) return null;
      return { option: o, matched, need: words.length, isMarker: isYes || isNo };
    })
    .filter((x): x is { option: ClarifyOption; matched: number; need: number; isMarker: boolean } => x !== null)
    .sort((a, b) => Number(b.isMarker) - Number(a.isMarker) || b.matched - a.matched);

  if (scored.length === 0) return null;
  const top = scored[0];
  // A marker option beats a content match outright; otherwise a tie means the
  // operator said something that fits two options equally, and guessing is how
  // we got here.
  if (scored.length > 1 && !top.isMarker && scored[1].isMarker) return null;
  if (scored.length > 1 && top.matched === scored[1].matched) return null;
  // Uniqueness above already rejects any option that shares its words with
  // another, so a lone distinctive term like "unresponsive" is a strong enough
  // answer on its own. Multi-word options still need every word present.
  return top.matched === top.need ? top.option : null;
}
