/**
 * The golden corpus — labelled by clinical expectation, never by engine output.
 *
 * ## Why this file is not generated from the engine
 *
 * A corpus produced by running the engine and recording what it said is
 * circular: it can only ever confirm the engine is unchanged. This one is
 * labelled by hand from what a call *should* resolve to, so when the engine
 * drifts the test fails.
 *
 * ## `gap` entries are the point
 *
 * Most real presentations have no protocol, because the corpus has six. Those
 * entries are labelled `expect: 'abstain'` with a `gap` describing the protocol
 * that should exist. They are load-bearing in two directions:
 *
 * - they pin today's behaviour, so a future change cannot silently start
 *   matching them;
 * - they are a machine-checked backlog. `goldenCorpus.test.ts` asserts the gap
 *   count against a ratchet, so adding a protocol means deliberately flipping
 *   its entries and lowering the number. Nothing gets quietly half-done.
 *
 * This is also why the corpus is honest about scale: we answer six things
 * confidently and abstain safely on everything else, rather than guessing.
 */

export type ExpectedOutcome = 'abstain' | string; // 'abstain' or a protocol id

export interface GoldenCase {
  phrase: string;
  /** 'abstain', or the protocol id this call must resolve to. */
  expect: ExpectedOutcome;
  /**
   * Set when the clinically correct answer is a protocol we do not have yet.
   * The engine is expected to abstain; a matching engine FAILS this case.
   */
  gap?: string;
}

// ── Must match: the six protocols we actually have ──────────────────────────

const MUST_MATCH: GoldenCase[] = [
  // Cardiac arrest / OHCA
  { phrase: 'he collapsed and is not breathing', expect: 'CARD-01' },
  { phrase: 'my husband collapsed and has no pulse', expect: 'CARD-01' },
  { phrase: 'she is not breathing and has no heartbeat', expect: 'CARD-01' },
  { phrase: 'he is unresponsive and not breathing normally', expect: 'CARD-01' },
  { phrase: 'dad has collapsed and stopped breathing', expect: 'CARD-01' },
  { phrase: 'the man is blue and not breathing', expect: 'CARD-01' },
  { phrase: 'he is gasping and barely breathing', expect: 'CARD-01' },
  { phrase: 'found him on the floor unresponsive and cold', expect: 'CARD-01' },
  { phrase: 'he collapsed in the shopping centre and is not breathing', expect: 'CARD-01' },
  { phrase: 'my dad is dead unresponsive he stopped breathing', expect: 'CARD-01' },
  // A bare diagnosis label is deliberately NOT a matching phrase: callers do not
  // say "cardiac arrest" to 911, and the phrase appears constantly in news and
  // conversation. Real callers report what they SAW.
  { phrase: 'the woman collapsed and is not breathing', expect: 'CARD-01' },
  { phrase: 'my nan has collapsed and there is no pulse', expect: 'CARD-01' },
  { phrase: 'he has no pulse and cannot breathe', expect: 'CARD-01' },

  // Stroke
  { phrase: 'her face is drooping on one side', expect: 'NEURO-03' },
  { phrase: 'one arm is drooping and her speech is slurred', expect: 'NEURO-03' },
  { phrase: 'sudden facial droop and weakness on the left', expect: 'NEURO-03' },
  { phrase: 'he suddenly cannot speak and his face is drooping', expect: 'NEURO-03' },
  { phrase: 'she has sudden slurred speech and one side is weak', expect: 'NEURO-03' },
  { phrase: 'possible stroke facial droop right side', expect: 'NEURO-03' },
  { phrase: 'he woke up with his face drooping and cannot move his arm', expect: 'NEURO-03' },
  { phrase: 'sudden vision loss and slurred speech', expect: 'NEURO-03' },
  { phrase: 'grandma has stroke symptoms face drooping', expect: 'NEURO-03' },
  { phrase: 'her speech went slurred suddenly and she is confused', expect: 'NEURO-03' },

  // Anaphylaxis
  { phrase: 'his throat is closing and he has anaphylaxis', expect: 'IMMUNO-04' },
  { phrase: 'she used her epipen and her tongue is swelling', expect: 'IMMUNO-04' },
  { phrase: 'anaphylaxis after a bee sting his lips are swelling', expect: 'IMMUNO-04' },
  { phrase: 'severe allergic reaction and his throat is closing', expect: 'IMMUNO-04' },
  { phrase: 'he ate a peanut and his tongue is swollen', expect: 'IMMUNO-04' },
  { phrase: 'anaphylactic shock after eating shellfish', expect: 'IMMUNO-04' },
  { phrase: 'she is covered in hives and wheezing after a sting', expect: 'IMMUNO-04' },
  { phrase: 'my child has anaphylaxis and is wheezing', expect: 'IMMUNO-04' },
  { phrase: 'throat closing after a bee sting and hives', expect: 'IMMUNO-04' },
  { phrase: 'he needed his epinephrine pen and is now struggling to breathe', expect: 'IMMUNO-04' },

  // Toxic / overdose
  { phrase: 'she swallowed a bottle of pills', expect: 'TOX-05' },
  { phrase: 'he overdosed on paracetamol', expect: 'TOX-05' },
  { phrase: 'my son took a whole packet of tablets', expect: 'TOX-05' },
  { phrase: 'deliberate overdose of antidepressants', expect: 'TOX-05' },
  { phrase: 'he ingested a chemical and is vomiting', expect: 'TOX-05' },
  { phrase: 'she took too many pills in overdose', expect: 'TOX-05' },
  { phrase: 'poisoning, he drank from a chemical container', expect: 'TOX-05' },
  { phrase: 'my child swallowed cleaning fluid', expect: 'TOX-05' },
  { phrase: 'he took an overdose and is now drowsy', expect: 'TOX-05' },
  { phrase: 'carbon monoxide poisoning, he is confused and vomiting', expect: 'TOX-05' },

  // Paediatric choking
  { phrase: 'my baby is choking and cannot breathe', expect: 'AIR-02' },
  { phrase: 'the infant swallowed a coin and is choking', expect: 'AIR-02' },
  { phrase: 'my toddler is choking on food and going blue', expect: 'AIR-02' },
  { phrase: 'baby swallowed a button and cannot cry', expect: 'AIR-02' },
  { phrase: 'my 9-month-old swallowed a coin', expect: 'AIR-02' },
  { phrase: 'the child is choking and silent', expect: 'AIR-02' },
  { phrase: 'toddler not breathing after choking on a grape', expect: 'AIR-02' },
  { phrase: 'my baby choked on a peanut and cannot breathe', expect: 'AIR-02' },

  // Cyber scam
  { phrase: 'i got a text saying my bank account is locked', expect: 'CYBER-06' },
  { phrase: 'someone is scamming my grandmother by phone', expect: 'CYBER-06' },
  { phrase: 'i think this is a digital arrest scam', expect: 'CYBER-06' },
  { phrase: 'a caller pretending to be the police wants money', expect: 'CYBER-06' },
  { phrase: 'my father is being threatened by scammers', expect: 'CYBER-06' },
  { phrase: 'romance scam, he has sent me all his money', expect: 'CYBER-06' },
];

// ── Must abstain: we have no protocol, and guessing is the bug ──────────────

const MUST_ABSTAIN: GoldenCase[] = [
  // Obstetric — the original bug. No obstetric protocol exists.
  { phrase: 'my water just broke i am 9 months pregnant', expect: 'OB-10' },
  { phrase: 'she is 34 weeks pregnant and bleeding heavily', expect: 'OB-10' },
  { phrase: 'she is in labour and the baby is coming', expect: 'OB-10' },
  { phrase: 'i am pregnant and having contractions', expect: 'OB-10' },
  { phrase: 'pregnant and there is blood and the baby is not moving', expect: 'abstain', gap: 'obstetric protocol' },
  { phrase: 'she is pregnant and thinks she has lost the baby', expect: 'abstain', gap: 'obstetric protocol' },
  { phrase: 'i am 8 months pregnant and having severe pain', expect: 'OB-10' },
  { phrase: 'my waters broke early and i am 36 weeks', expect: 'OB-10' },

  // Adult choking — lethal-if-missed, and the only airway protocol is infant-only.
  { phrase: 'he is choking and cannot speak', expect: 'AIR-03' },
  { phrase: 'my wife is choking and cannot breathe or speak', expect: 'AIR-03' },
  { phrase: 'adult friend is choking on steak and silent', expect: 'AIR-03' },

  // Burns
  { phrase: 'the room is full of smoke and he is burned', expect: 'BURN-07' },
  { phrase: 'she spilled boiling water on her arm', expect: 'BURN-07' },
  { phrase: 'he is on fire from cooking oil', expect: 'BURN-07' },
  { phrase: 'my child scalded his leg on a hot kettle', expect: 'BURN-07' },
  { phrase: 'he was burnt by a hot pan and is blistering', expect: 'BURN-07' },
  { phrase: 'chemical burn on her hands from a cleaning product', expect: 'BURN-07' },

  // Seizure
  { phrase: 'she is having a seizure and shaking', expect: 'SEIZ-08' },
  { phrase: 'he had a convulsion and is now drowsy', expect: 'SEIZ-08' },
  { phrase: 'my son is fitting on the floor', expect: 'SEIZ-08' },
  { phrase: 'first ever seizure and he is not responding', expect: 'SEIZ-08' },
  { phrase: 'she has epilepsy and is seizing now', expect: 'SEIZ-08' },

  // Bleeding
  { phrase: 'his arm is cut badly and bleeding everywhere', expect: 'HEM-09' },
  { phrase: 'she is bleeding heavily from the leg', expect: 'HEM-09' },
  { phrase: 'he was stabbed in the stomach', expect: 'abstain', gap: 'major bleeding protocol' },
  { phrase: 'there is blood everywhere and it will not stop', expect: 'abstain', gap: 'major bleeding protocol' },
  { phrase: 'a shotgun blast to his thigh', expect: 'abstain', gap: 'major bleeding protocol' },

  // Trauma
  { phrase: 'grandma fell down the stairs and hit her head', expect: 'TRAUMA-12' },
  { phrase: 'he was hit by a car and is on the ground', expect: 'abstain', gap: 'trauma protocol' },
  { phrase: 'she fell from the roof and is trapped', expect: 'TRAUMA-12' },
  { phrase: 'his leg is deformed after a car crash', expect: 'TRAUMA-12' },
  { phrase: 'he fell off a ladder and cannot move his arm', expect: 'abstain', gap: 'trauma protocol' },

  // Metabolic
  { phrase: 'she is diabetic and confused and shaky', expect: 'DIA-11' },
  { phrase: 'he is a diabetic and his blood sugar is very low', expect: 'DIA-11' },
  { phrase: 'my father is hypoglycemic and sweating', expect: 'abstain', gap: 'diabetic emergency protocol' },
  { phrase: 'she took her insulin and is now unresponsive', expect: 'abstain', gap: 'diabetic emergency protocol' },

  // Environmental
  { phrase: 'it is 105 degrees and he is confused', expect: 'HEAT-15' },
  { phrase: 'they have been stuck in the snow and are hypothermic', expect: 'HEAT-15' },
  { phrase: 'the heatwave has made him delirious', expect: 'HEAT-15' },

  // Drowning
  // A drowned patient who is not breathing IS in arrest, and compressions are the
  // correct immediate action, so CARD-01 is right to fire. Labelled as a match on
  // purpose: recording it as "should abstain" would be clinically wrong. The gap
  // is that drowning needs its own airway/ventilation handling on top.
  // Now resolved by DROW-13, which checks breathing before compressions and
  // covers the airway/ventilation handling a drowned patient needs.
  { phrase: 'he was pulled from the lake and is not breathing', expect: 'DROW-13' },
  { phrase: 'my child fell into the swimming pool', expect: 'DROW-13' },
  { phrase: 'she was under the water and we pulled her out', expect: 'DROW-13' },

  // Mental health
  { phrase: 'he is talking about killing himself', expect: 'MH-16' },
  { phrase: 'she has been cutting herself and is very upset', expect: 'MH-16' },
  { phrase: 'my brother has a mental breakdown', expect: 'abstain', gap: 'mental health crisis protocol' },
  { phrase: 'she is having a panic attack and cannot breathe', expect: 'MH-16' },

  // Chest pain that is not the classic OHCA picture (cardiac protocol is arrest-focused)
  { phrase: 'he has crushing chest pain and is sweating', expect: 'ACS-14' },
  { phrase: 'my father has chest pressure radiating to his jaw', expect: 'abstain', gap: 'chest pain / ACS protocol' },

  // Out of domain — must never be dressed up as an emergency protocol
  { phrase: 'my parcel never arrived', expect: 'abstain' },
  { phrase: 'i want to complain about my neighbour', expect: 'abstain' },
  { phrase: 'what time does the library close', expect: 'abstain' },
  { phrase: 'i lost my keys', expect: 'abstain' },
  { phrase: 'the wifi is down again', expect: 'abstain' },
  { phrase: 'i would like to book a table for four', expect: 'abstain' },
  { phrase: 'my parcel is late again and i am annoyed', expect: 'abstain' },
  { phrase: 'hello how are you', expect: 'abstain' },
  { phrase: 'is 120 over 80 a normal blood pressure', expect: 'abstain' },
  { phrase: 'can i take ibuprofen with my blood pressure tablets', expect: 'abstain' },
  { phrase: 'what are the side effects of this medication', expect: 'abstain' },
  { phrase: 'thanks very much for your help', expect: 'abstain' },
  { phrase: 'the shop was closed when i went', expect: 'abstain' },
  { phrase: 'i would like to complain about the noise', expect: 'abstain' },

  // Degenerate input
  { phrase: '', expect: 'abstain' },
  { phrase: '   ', expect: 'abstain' },
  { phrase: '...', expect: 'abstain' },
  { phrase: '?!?!', expect: 'abstain' },
  { phrase: 'a', expect: 'abstain' },
];

export const GOLDEN_CORPUS: GoldenCase[] = [...MUST_MATCH, ...MUST_ABSTAIN];

/**
 * Every protocol id the corpus expects to be reachable.
 *
 * Derived from the WHOLE corpus, not just MUST_MATCH, because the Stage 3
 * expansion moved obstetric, burns, seizure and the rest out of the gap backlog
 * and into the matched set.
 */
export const GOLDEN_PROTOCOLS: string[] = [
  ...new Set(GOLDEN_CORPUS.map((c) => c.expect)),
].filter((v): v is string => v !== 'abstain');

/** Every known missing protocol, with how many phrases prove its absence. */
export function gapSummary(): Array<{ gap: string; count: number }> {
  const counts = new Map<string, number>();
  for (const c of GOLDEN_CORPUS) {
    if (!c.gap) continue;
    counts.set(c.gap, (counts.get(c.gap) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([gap, count]) => ({ gap, count }))
    .sort((a, b) => b.count - a.count);
}

export function totalGapCases(): number {
  return GOLDEN_CORPUS.filter((c) => c.gap).length;
}
