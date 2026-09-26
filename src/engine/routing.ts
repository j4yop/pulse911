/**
 * Is this actually an emergency, or a general health question?
 *
 * ## Why this exists
 *
 * The console is an emergency dispatch path. Sending it a routine question —
 * "is 120/80 normal?", "can I take ibuprofen with my blood pressure tablets?" —
 * produced emergency-grade refusal: an amber ABSTAIN card telling the user to
 * call 911. That is both wrong and alarming, and it trained users to distrust
 * the one screen where the warning genuinely matters.
 *
 * So the two are separated, with one rule that overrides everything else:
 *
 * > **Any emergency signal means emergency, whatever the phrasing.**
 *
 * "what should I do if my father collapses?" is a question and an emergency.
 * The interrogative form must never be a way to slip past triage, because the
 * cheapest trick to break a triage system is to get it to classify by grammar
 * instead of by content.
 *
 * This classifies only. It never generates medical advice — a general question
 * still gets signposting to a clinician or pharmacist, not an answer.
 */

import { matchGuidanceCategories } from './guidanceCategories';

/** Words that mean someone might be in trouble right now. */
const EMERGENCY_SIGNALS: string[] = [
  'not breathing', 'cannot breathe', 'can not breathe', 'stopped breathing',
  'unconscious', 'unresponsive', 'not responding', 'collapsed', 'fainted', 'passed out',
  'choking', 'choke', 'bleeding', 'blood everywhere', 'severe bleeding',
  'seizure', 'seizuring', 'fitting', 'convulsion', 'shaking uncontrollably',
  'chest pain', 'chest pressure', 'crushing chest', 'heart attack',
  'stroke', 'face drooping', 'facial droop', 'slurred speech', 'one side weak',
  'overdose', 'poison', 'poisoned', 'drank bleach', 'swallowed a bottle',
  'burn', 'burned', 'scalded', 'on fire', 'smoke inhalation',
  'trapped', 'crushed', 'car crash', 'hit by', 'fell from', 'run over',
  'drowning', 'underwater', 'pulled from water',
  'anaphylaxis', 'throat closing', 'swollen tongue', 'epipen',
  'heavy bleeding', 'blood in stool', 'vomiting blood',
  'pregnant and bleeding', 'water broke', 'waters broke', 'in labour', 'in labor',
  'suicidal', 'suicide', 'kill himself', 'kill herself', 'kill themselves',
  'end my life', 'self harm', 'self-harm', 'cutting herself', 'cutting themselves',
  'hypothermia', 'heat stroke', 'heat exhaustion', '105 degrees',
  'choking on', 'stuck in', 'cannot speak', 'can not speak', 'gasping',
  'blue lips', 'not moving', 'cannot move', 'cant move', 'deform',
];

/**
 * Phrasings that mark a general, non-urgent question.
 *
 * Only consulted AFTER no emergency signal is present, so a question that
 * contains one is still treated as an emergency.
 */
const INFORMATIONAL_MARKERS: string[] = [
  'what is normal', 'what is a normal', 'normal range', 'what does it mean',
  'what does this mean', 'is it normal', 'is this normal', 'should i worry',
  'should i be worried', 'am i dying', 'is it dangerous',
  'side effects', 'interactions', 'can i take', 'can you take',
  'is it safe to take', 'can i mix', 'how much should', 'what dosage',
  'is it worth', 'should i take', 'do i need to see a doctor',
  'what causes', 'how do i treat a', 'prevention', 'is it normal for',
  'what happens if', 'explain', 'what are the symptoms of',
  // Phrasings that surfaced while testing: a numeric reading, a lab result, or
  // a "how much is normal" ask are all information requests, not emergencies.
  'a normal', 'normal adult', 'normal child', 'lab result', 'blood test result',
  'what does', 'what is a', 'reading mean', 'result mean', 'means that',
];

/** Phrases that mean "I need a professional", not "give me an answer". */
const CLINICIAN_SEEKS = [
  '911 or your local emergency number',
  'a doctor, pharmacist or nurse',
  'a clinician who can see them',
  'poison control',
];

export interface RouteVerdict {
  kind: 'emergency' | 'informational';
  /** The emergency signal that forced the emergency route, if any. */
  signal: string | null;
  /**
   * A matched guidance family, present only for the emergency route. Lets the
   * emergency path show first aid *and* point at the right kind of help.
   */
  categoryId: string | null;
  categoryLabel: string | null;
  /**
   * Why we are not answering, in one line, when informational. The whole point
   * is that we decline to answer and say so usefully — silently returning the
   * amber emergency card is what we are fixing.
   */
  signpost: string | null;
}

function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ')} `;
}

/** Classify a transcript. Deterministic, cheap, and never generates advice. */
export function routeTranscript(transcript: string): RouteVerdict {
  const hay = normalise(transcript);

  for (const signal of EMERGENCY_SIGNALS) {
    if (hay.includes(signal)) {
      const [top] = matchGuidanceCategories(transcript, 1);
      return {
        kind: 'emergency',
        signal,
        categoryId: top?.category.id ?? null,
        categoryLabel: top?.category.label ?? null,
        signpost: null,
      };
    }
  }

  // No emergency signal. Now, and only now, does phrasing matter.
  const looksInformational = INFORMATIONAL_MARKERS.some((m) => hay.includes(m));
  if (looksInformational) {
    return {
      kind: 'informational',
      signal: null,
      categoryId: null,
      categoryLabel: null,
      signpost: CLINICIAN_SEEKS[0],
    };
  }

  return {
    kind: 'emergency',
    signal: null,
    categoryId: null,
    categoryLabel: null,
    signpost: null,
  };
}
