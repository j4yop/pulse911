/**
 * Broad guidance categories — the layer that makes "I don't know" survivable.
 *
 * ## Why this exists
 *
 * A six-protocol corpus can only ever answer six things. Everything else used to
 * dead-end on "I could not identify this emergency", which is honest and useless:
 * a caller describing something we lack a protocol for still needs help, and for
 * most first aid the *name* of the condition does not change what is safe to do
 * right now.
 *
 * So this is deliberately NOT more protocols. It is ~20 broad families with
 * generic, low-risk actions that remain correct across the whole family — you do
 * not need to know if a skin injury is a scald, a chemical burn or a steam burn
 * to cool it under running water and call 911 if the face is involved.
 *
 * ## The safety rule
 *
 * Category guidance is a *floor*, never a ceiling:
 *
 * - Every action here must be safe even if the category is the WRONG one. If an
 *   action is only safe when you have correctly identified the condition, it
 *   does not belong in this file — it belongs in a reviewed protocol.
 * - No drug names, no doses, no timings that imply a diagnosis.
 * - Every category carries explicit `doNot` entries, because under stress
 *   bystanders improvise, and the common improvisations are the dangerous part
 *   (ice on a burn, butter, putting things in a seizing person's mouth, inducing
 *   vomiting, giving water to someone who cannot swallow).
 * - `redFlags` exist so the category can escalate to "call 911 now" rather than
 *   staying reassuringly calm.
 *
 * Anything narrower or riskier belongs in `emergencyProtocols.ts` behind
 * clinician review. See TRIAGE_SAFETY_WORKFLOW.md Stage 3.
 */

export interface GuidanceCategory {
  id: string;
  /** Short human label for the dispatcher. */
  label: string;
  /**
   * Symptom phrases. Deliberately broad and family-level: the goal is to catch
   * the presentation, not to name the disease.
   */
  keywords: string[];
  /** Used for weak lexical tiebreak only. Keep it family-level, not diagnostic. */
  clinicalSummary: string;
  /** Generic, low-risk actions. Safe even if this category is the wrong one. */
  safeActions: string[];
  /** Call 911 / escalate immediately if any apply. */
  redFlags: string[];
  /** Actively harmful improvisations to name out loud. */
  doNot: string[];
}

export const GUIDANCE_CATEGORIES: GuidanceCategory[] = [
  {
    id: 'cat-airway',
    label: 'Airway — choking or something stuck in the throat',
    keywords: [
      'choking', 'choke', 'cannot speak', 'can not speak', 'cannot breathe',
      'can not breathe', 'something stuck', 'swallowed object', 'swallowed food',
      'noisy breathing', 'high pitched breathing', 'silent cough', 'hands on throat',
    ],
    clinicalSummary:
      'Airway obstruction or inability to move air, from a foreign body or swelling. Until proven otherwise treat as airway.',
    safeActions: [
      'Ask them to cough. If the cough works, keep encouraging it — do not interfere.',
      'If they cannot cough, speak or breathe at all, this is a severe obstruction and you must act now.',
      'Call 911 and put the phone on speaker so your hands stay free.',
      'Stay with them and keep watching whether they can still cough or speak.',
    ],
    redFlags: [
      'They cannot cough, speak or breathe at all.',
      'They are turning blue or grey around the lips.',
      'They are unconscious or limp.',
    ],
    doNot: [
      'Do not slap the back while they can still cough effectively.',
      'Do not sweep a finger blindly in the mouth — it can push the object deeper.',
      'Do not give water to "wash it down".',
    ],
  },
  {
    id: 'cat-breathing',
    label: 'Breathing — struggling to breathe',
    keywords: [
      'cannot breathe', 'can not breathe', 'struggling to breathe', 'short of of breath',
      'shortness of breath', 'gasping', 'wheezing', 'breathing fast', 'breathing fast',
      'laboured breathing', 'labored breathing', 'breathing heavily', 'chest tight',
      'chest tightness', 'breathless', 'inhaler', 'asthma attack',
    ],
    clinicalSummary:
      'Difficulty moving air in or out, whatever the cause. Position and escalate; do not diagnose.',
    safeActions: [
      'Help them sit upright. Do not let them lie flat.',
      'Loosen tight clothing around the neck and chest.',
      'Call 911 now if this is new, severe, or getting worse.',
      'Stay calm and keep them still — do not walk them anywhere.',
    ],
    redFlags: [
      'They cannot speak in full sentences.',
      'Their lips or fingertips are blue or grey.',
      'They are getting more tired, or seem sleepy or confused.',
      'They have no pulse and are not breathing normally.',
    ],
    doNot: [
      'Do not give food, drink or medication unless a clinician tells you to.',
      'Do not let them "walk it off" or drive themselves.',
    ],
  },
  {
    id: 'cat-chest',
    label: 'Chest pain / possible cardiac',
    keywords: [
      'chest pain', 'chest pains', 'chest pressure', 'chest tightness', 'crushing chest',
      'arm pain', 'jaw pain', 'pain in the chest', 'heart attack', 'pressure in the chest',
      'pain radiating to the arm',
    ],
    clinicalSummary:
      'Possible acute coronary or other chest emergency. Treat as cardiac until a clinician says otherwise.',
    safeActions: [
      'Have them sit down and stay completely still. Do not let them walk around.',
      'Call 911 now. Say "possible chest pain" so the response is prioritised.',
      'Loosen tight clothing and keep them calm while you wait.',
      'Stay on the line with them until help arrives.',
    ],
    redFlags: [
      'The pain lasts more than a few minutes, or keeps coming back.',
      'They look pale, clammy, grey or faint.',
      'They become unconscious or stop breathing normally.',
    ],
    doNot: [
      'Do not drive them to hospital yourself unless told to.',
      'Do not give them aspirin or any other medication unless a clinician instructs you.',
    ],
  },
  {
    id: 'cat-neuro',
    label: 'Neurological — stroke or sudden brain symptoms',
    keywords: [
      'face drooping', 'facial droop', 'drooping face', 'arm drooping', 'weak on one side',
      'one side weak', 'slurred speech', 'speech is slurred', 'cannot speak properly',
      'confusion sudden', 'sudden confusion', 'cannot understand', 'loss of vision',
      'double vision', 'severe headache', 'worst headache', 'thunderclap headache',
      'seizure', 'fitting', 'convulsion', 'collapsed and shaking', 'unresponsive',
    ],
    clinicalSummary:
      'Sudden neurological change or seizure. Time of onset is the single most useful fact; protect the airway and escalate.',
    safeActions: [
      'Note the exact time symptoms started, and write it down. It matters enormously to the hospital.',
      'Call 911 now and say "possible stroke" if the face, arm or speech is affected.',
      'Keep them lying down with their head slightly raised if they are comfortable.',
      'Loosen anything around the neck and keep their airway clear.',
    ],
    redFlags: [
      'One side of the face or body droops, or speech goes slurred or strange.',
      'They become unconscious, or start seizing.',
      'They are not breathing normally.',
    ],
    doNot: [
      'Do not give food, drink or tablets — swallowing may already be impaired.',
      'Do not give aspirin unless a clinician tells you to.',
    ],
  },
  {
    id: 'cat-seizure',
    label: 'Seizure / fitting',
    keywords: [
      'seizure', 'seizuring', 'fitting', 'convulsion', 'convulsing', 'shaking uncontrollably',
      'unconscious and shaking', 'body stiff', 'jerking', 'epilepsy',
    ],
    clinicalSummary:
      'Seizure activity. The overwhelming majority are self-limiting. Protect from injury, do not restrain, do not restrain the mouth.',
    safeActions: [
      'Clear hard or sharp objects away from them and cushion their head.',
      'Let the seizure run. Time it — note when it starts.',
      'Call 911 if it lasts more than about 5 minutes, repeats, or they are not recovering afterwards.',
      'Once it stops, roll them onto their side and keep their airway clear.',
    ],
    redFlags: [
      'It lasts more than 5 minutes, or they have a second seizure.',
      'They do not wake up properly afterwards.',
      'They were injured during it, or it happened in water or with a head injury.',
      'It is their first ever seizure.',
    ],
    doNot: [
      'Do NOT put anything in their mouth — they cannot swallow their tongue and you will break teeth or choke them.',
      'Do not hold them down or restrain their limbs.',
      'Do not give water, food or tablets until they are fully alert.',
    ],
  },
  {
    id: 'cat-trauma',
    label: 'Trauma / serious injury',
    keywords: [
      'fall', 'fell', 'falling', 'head injury', 'hit his head', 'hit her head', 'knocked out',
      'car crash', 'crashed', 'collision', 'hit by a car', 'trapped', 'crushed', 'fell from',
      'hit by', 'run over',
    ],
    clinicalSummary:
      'Significant impact or injury mechanism. Suspect spinal and internal injury; immobilise and escalate.',
    safeActions: [
      'Call 911 for anything beyond a minor bruise. Do not assume it is fine.',
      'Keep the head and neck still and in line with the body.',
      'Control any bleeding with firm, direct pressure using a clean cloth.',
      'Keep them warm and stay with them.',
    ],
    redFlags: [
      'They lost consciousness at any point, even briefly.',
      'They are not waking up properly, are confused, or are vomiting.',
      'Neck or back pain, tingling or weakness anywhere.',
      'Bleeding will not stop with firm pressure.',
    ],
    doNot: [
      'Do not move them or their head unless they are in immediate danger.',
      'Do not let them eat or drink — they may need surgery.',
      'Do not remove anything stuck in a wound.',
    ],
  },
  {
    id: 'cat-bleeding',
    label: 'Bleeding',
    keywords: [
      'bleeding', 'bleeds', 'bleeding heavily', 'heavy bleeding', 'blood everywhere',
      'wont stop bleeding', 'cut badly', 'deep cut', 'gash', 'stab', 'shot', 'gunshot',
      'bleeding from the arm', 'bleeding from the leg', 'bleeding from the head',
    ],
    clinicalSummary:
      'External haemorrhage. Firm direct pressure is the correct first action in essentially every case, and is safe even if the underlying cause is wrong.',
    safeActions: [
      'Press firmly on the wound with a clean cloth or gauze and keep pressing.',
      'Call 911 if the bleeding is heavy, spurting, or will not stop.',
      'If blood soaks through, add another layer on top — do not remove the first one.',
      'Keep them warm and lying down.',
    ],
    redFlags: [
      'The blood is spurting, pooling, or soaking through quickly.',
      'They are pale, cold, confused, or their breathing has changed.',
      'The bleeding does not slow after several minutes of firm pressure.',
      'The injury is deep, a stab or gunshot, or something is embedded.',
    ],
    doNot: [
      'Do not remove an object stuck in the wound — pad around it instead.',
      'Do not use a tourniquet unless a clinician tells you to or direct bleeding is uncontrollable.',
      'Do not rinse or poke at the wound.',
    ],
  },
  {
    id: 'cat-thermal',
    label: 'Burns, scalds and smoke',
    keywords: [
      'burn', 'burned', 'burnt', 'scald', 'scalded', 'hot water', 'hot oil', 'steam',
      'chemical burn', 'on fire', 'caught fire', 'smoke inhalation', 'singed hair',
      'sunburn severe', 'boiling water',
    ],
    clinicalSummary:
      'Thermal, chemical or electrical injury. Cooling and covering are safe across the whole family.',
    safeActions: [
      'Cool the burn under cool running water for about 20 minutes, as soon as you safely can.',
      'Remove rings, watches and clothing near the burn, unless stuck to the skin.',
      'Cover loosely with cling film or a clean non-fluffy cloth.',
      'Keep the rest of the body warm — a large burn causes heat loss.',
    ],
    redFlags: [
      'The burn covers a large area, or involves the face, hands, feet, genitals or a major joint.',
      'The burn is deep — white, black or leathery skin, or numb.',
      'It is chemical or electrical, or the person inhaled smoke.',
      'They are not breathing normally.',
    ],
    doNot: [
      'Do NOT use ice, butter, toothpaste, oil or grease.',
      'Do not burst blisters or peel skin.',
      'Do not pull off clothing stuck to the skin — cut around it instead.',
      'Do not apply ice to a large burn — it can worsen tissue damage.',
    ],
  },
  {
    id: 'cat-toxic',
    label: 'Poisoning, overdose or swallowed something harmful',
    keywords: [
      'poison', 'poisoned', 'swallowed chemicals', 'drank bleach', 'drank detergent',
      'overdose', 'took too many', 'swallowed pills', 'swallowed a bottle', 'bottle of pills',
      'a bottle of pills', 'pills', 'took a bunch of pills', 'ate something', 'bitten by a snake',
      'spider bite', 'chemical in the eye', 'inhaled fumes', 'carbon monoxide',
      'ate a plant', 'toxic',
    ],
    clinicalSummary:
      'Ingestion, inhalation or absorption of a harmful substance. Nothing is made worse by getting professional advice before acting.',
    safeActions: [
      'Call 911 if they are drowsy, confused, seizing or having trouble breathing.',
      'Keep the container, packet or plant sample — it tells the hospital what it is.',
      'If it is on their skin or in their eye, rinse with clean running water for 20 minutes.',
      'Move them into fresh air if they inhaled something.',
    ],
    redFlags: [
      'They are unconscious, seizing, or not breathing normally.',
      'Their lips or skin are unusually blue, cherry red or very pale.',
      'Their pupils are very small or very large.',
      'They have swallowed a household chemical, a battery, or a plant you do not recognise.',
    ],
    doNot: [
      'Do NOT make them vomit.',
      'Do not give water, milk, food or charcoal unless poison control or a clinician tells you to.',
      'Do not put your hand in their mouth to "get it back".',
    ],
  },
  {
    id: 'cat-obstetric',
    label: 'Pregnancy and childbirth',
    keywords: [
      'pregnant', 'pregnancy', 'in labour', 'in labor', 'water broke', 'waters broke',
      'contractions', 'pushing', 'bleeding while pregnant', 'pregnant and bleeding',
      'miscarriage', 'vaginally bleeding', 'postnatal', 'after giving birth',
    ],
    clinicalSummary:
      'Pregnancy, labour or postpartum emergency. Anything unexpected in pregnancy is time-critical.',
    safeActions: [
      'Call 911 now for bleeding, severe pain, fluid loss, or reduced movement of the baby.',
      'Help her lie on her left side if she is comfortable — it helps blood flow to the baby.',
      'Note the time any bleeding or fluid loss started.',
      'Keep her calm and keep the phone on speaker.',
    ],
    redFlags: [
      'Vaginal bleeding of any amount.',
      'Severe or constant abdominal pain.',
      'Fluid or blood loss, or the baby moving much less than usual.',
      'She feels faint, or has a severe headache or blurred vision.',
    ],
    doNot: [
      'Do not give her food, drink or medication unless a clinician tells you to.',
      'Do not let her drive herself.',
    ],
  },
  {
    id: 'cat-metabolic',
    label: 'Diabetic or blood-sugar emergency',
    keywords: [
      'diabetic', 'diabetes', 'low blood sugar', 'high blood sugar', 'hypo', 'hyper',
      'insulin', 'sugar level', 'glucose', 'medication alert bracelet', 'confused and diabetic',
      'shaky and sweaty', 'passed out diabetic',
    ],
    clinicalSummary:
      'Blood-glucose related illness. Sugar helps a conscious low; it does nothing for an unconscious person and is dangerous by mouth.',
    safeActions: [
      'If they are fully awake and can swallow, give them fast sugar — glucose tablets, fruit juice, or a sugary drink.',
      'Call 911 if they are confused, drowsy, having a seizure, or unable to swallow safely.',
      'Check for a medical ID bracelet or necklace and tell the responders what it says.',
      'Re-check their alertness every few minutes and tell responders what you gave and when.',
    ],
    redFlags: [
      'They are unconscious, seizing, or cannot swallow safely.',
      'They are confused, aggressive or unusually drowsy.',
      'Their breathing is slow or laboured.',
    ],
    doNot: [
      'Do NOT put food or drink in the mouth of anyone who is drowsy, seizing or unconscious — it will choke them.',
      'Do not give insulin unless they tell you it is part of their own plan and they are fully alert.',
    ],
  },
  {
    id: 'cat-allergic',
    label: 'Severe allergic reaction',
    keywords: [
      'anaphylaxis', 'anaphylactic', 'throat closing', 'tongue swelling', 'swollen tongue',
      'lips swelling', 'epipen', 'epinephrine', 'severe allergy', 'bee sting reaction',
      'peanut allergy', 'hives and swelling', 'cannot breathe after a sting',
    ],
    clinicalSummary:
      'Rapid systemic allergic reaction. Speed matters more than certainty.',
    safeActions: [
      'Call 911 immediately — this can deteriorate within minutes.',
      'If they have a prescribed auto-injector, help them use it now. It is safe to use early.',
      'Lay them flat with their legs raised, unless breathing is difficult, in which case let them sit up.',
      'Stay with them until help arrives, and keep the second auto-injector ready if prescribed.',
    ],
    redFlags: [
      'Trouble breathing, wheeze, or a noisy breathing sound.',
      'Swelling of the lips, tongue or throat, or difficulty swallowing.',
      'Dizziness, collapse, or they look grey or blue.',
    ],
    doNot: [
      'Do not let them lie flat and walk about if breathing is difficult.',
      'Do not delay calling to see whether it "passes".',
    ],
  },
  {
    id: 'cat-drowning',
    label: 'Drowning / near-drowning',
    keywords: [
      'drowning', 'drowned', 'fell into water', 'underwater', 'near drowning', 'pulled from water',
      'swimming pool', 'in the lake', 'in the river', 'could not swim',
    ],
    clinicalSummary:
      'Water immersion. Secondary deterioration can occur hours later even if they seem fine.',
    safeActions: [
      'Get them out of the water safely — do not enter if it is dangerous to you.',
      'Check whether they are breathing normally. If not, start chest compressions.',
      'Call 911 — they need to be assessed even if they seem completely fine.',
      'Keep them warm and monitor their breathing for several hours.',
    ],
    redFlags: [
      'They are not breathing normally, or are breathing but coughing persistently.',
      'They are drowsy, confused, or unusually tired.',
      'They were underwater for any length of time, or needed rescue breaths.',
    ],
    doNot: [
      'Do not let them "sleep it off" — delayed breathing problems are common.',
      'Do not give food or drink.',
    ],
  },
  {
    id: 'cat-environmental',
    label: 'Heat or cold exposure',
    keywords: [
      'heat stroke', 'heat exhaustion', 'overheating', 'overheated', 'too hot', 'sun stroke',
      'heatwave', 'hypothermia', 'very cold', 'freezing', 'cold exposure', 'wet and cold',
      'struck by heat', '105 degrees', '100 degrees', 'degrees outside', 'degrees fahrenheit',
      'hot day', 'heat wave', 'confused and hot', 'hot and confused',
    ],
    clinicalSummary:
      'Environmental temperature injury. Both extremes deteriorate slowly and need active management.',
    safeActions: [
      'Move them somewhere cool (or warm) and out of the sun or wind.',
      'Loosen heavy clothing and cool them gradually with fans or cool water if they are too hot.',
      'If they are alert and able to swallow, give small sips of cool water if they are overheated.',
      'Warm someone with cold exposure gradually, covering with dry layers.',
    ],
    redFlags: [
      'They are confused, aggressive, or not making sense — a medical emergency either way.',
      'They are unconscious or fitting.',
      'They are vomiting, or their core feels very hot or very cold.',
    ],
    doNot: [
      'Do not use direct ice or very cold water on someone with heat stroke — it can cause shock.',
      'Do not rub a frostbitten area, or use direct heat on it.',
      'Do not give alcohol to "warm them up".',
    ],
  },
  {
    id: 'cat-abdominal',
    label: 'Severe abdominal pain',
    keywords: [
      'severe stomach pain', 'severe abdominal pain', 'belly pain', 'appendix', 'appendicitis',
      'gut pain', 'abdominal pain', 'stomach pain', 'vomiting blood', 'bloody vomit',
      'black stool', 'blood in stool', 'can not pass wind',
    ],
    clinicalSummary:
      'Significant abdominal pain or GI bleeding. Do not attempt to diagnose the cause.',
    safeActions: [
      'Have them lie still somewhere comfortable.',
      'Call 911 if the pain is severe, constant, or comes with vomiting blood, black stool or collapse.',
      'Note when the pain started and where it is.',
      'Keep them calm and keep them still.',
    ],
    redFlags: [
      'Severe or constant pain, especially if rigid or tender to touch.',
      'Vomiting blood, black tarry stool, or blood in the stool.',
      'They are faint, cold, clammy, or pass out.',
      'Pregnancy with abdominal pain — see the pregnancy guidance.',
    ],
    doNot: [
      'Do not give food, drink or laxatives.',
      'Do not give painkillers unless a clinician tells you to.',
    ],
  },
  {
    id: 'cat-eye',
    label: 'Eye injury or chemical splash',
    keywords: [
      'chemical in the eye', 'something in the eye', 'eye injury', 'eye is bleeding',
      'something splashed', 'acid in the eye', 'eye burn', 'poked in the eye', 'eyelid stuck',
    ],
    clinicalSummary: 'Ocular injury or chemical exposure. Irrigation time matters more than anything else.',
    safeActions: [
      'Rinse the eye with clean lukewarm water for at least 20 minutes, holding the lids open.',
      'Remove contact lenses if they come out easily; do not force them.',
      'Call 911 for anything involving vision loss, severe pain, or a cut to the eye.',
      'Keep them still and stop the bleeding of the surrounding area with light pressure if needed.',
    ],
    redFlags: [
      'Any change in vision, or a white or cloudy eyeball.',
      'Severe pain, or a cut involving the eyelid or eyeball.',
      'Chemical exposure — this is an emergency even if it does not hurt yet.',
    ],
    doNot: [
      'Do not rub the eye.',
      'Do not try to remove a stuck object with a clean cloth — that can push it in.',
    ],
  },
  {
    id: 'cat-mentalhealth',
    label: 'Mental health crisis or risk of self-harm',
    keywords: [
      'suicidal', 'suicide', 'kill himself', 'kill herself', 'kill themselves',
      'killing themselves', 'killing himself', 'killing herself', 'self harm', 'self-harm',
      'wants to die', 'end my life', 'end their life', 'overdose on purpose',
      'cutting herself', 'cutting himself', 'cutting themselves', 'harming themselves',
      'mental breakdown', 'panic attack', 'cannot cope', 'no reason to live',
    ],
    clinicalSummary:
      'Psychological or suicidal crisis. The most important intervention is a human being who stays.',
    safeActions: [
      'Stay with them. Do not leave them alone, however awkward you feel.',
      'Call 911 if there is any risk of immediate harm, and say plainly what you are worried about.',
      'In the US you can call or text 988 for a crisis line; elsewhere call your local emergency number.',
      'If there are any medicines, weapons or sharp objects within reach, move them away if it is safe to do so.',
    ],
    redFlags: [
      'They have taken something overdose, or have an injury they did not mean to cause.',
      'They are threatening to hurt themselves or someone else.',
      'They are not responsive, or you cannot keep them safe right now.',
    ],
    doNot: [
      'Do not leave them on their own, even for a few minutes.',
      'Do not argue about whether they deserve to feel this way.',
      'Do not promise to keep a secret from a clinician.',
    ],
  },
  {
    id: 'cat-unknown-injury',
    label: 'Pain and injury of unknown cause',
    keywords: [
      'hurt', 'injured', 'injury', 'pain', 'sore', 'swollen', 'bruise', 'swelling',
      'cannot move', 'cant move', 'pulled something', 'tore something', 'wrenched',
    ],
    clinicalSummary:
      'Unlocalised pain or minor injury. Generic care only; the category exists so this never dead-ends.',
    safeActions: [
      'Rest the injured part and avoid making it worse.',
      'Use a wrapped cold pack for a new painful or swollen area, for short periods.',
      'Raise and support the injured part if that is comfortable.',
      'Call 911 if the pain is severe, the limb looks deformed, or they cannot use it at all.',
    ],
    redFlags: [
      'The limb is deformed, or they cannot move it or bear weight on it.',
      'The pain is severe or rapidly worsening.',
      'There is numbness, or the skin is pale, blue or cold.',
      'The injury involves the head, neck, chest, abdomen or spine.',
    ],
    doNot: [
      'Do not push a deformed joint or limb back into place.',
      'Do not apply a cold pack directly to bare skin, or for long periods.',
    ],
  },
];

/**
 * Minimum anchor weight before a category may be surfaced.
 *
 * Deliberately lower than the clinical `MIN_ANCHOR_WEIGHT` of 2. A category is
 * generic and low-risk rather than diagnostic, so one strong symptom phrase such
 * as "cannot breathe" is enough to offer safe positioning and an escalation. The
 * higher clinical bar is unchanged, which is what stops a single weak keyword
 * from selecting a treatment protocol.
 */
export const MIN_CATEGORY_ANCHOR_WEIGHT = 1;

/**
 * Confidence a category needs before it may be SPOKEN.
 *
 * Display has no confidence floor (see `matchGuidanceCategories`); only audio
 * does, because audio is unprompted and unreviewable.
 */
export const MIN_CATEGORY_CONFIDENCE = 0.45;

// ── Matching ────────────────────────────────────────────────────────────────

import { rankByText, phraseWeight, tokenize } from './retrievalCore';

export interface CategoryMatch {
  category: GuidanceCategory;
  score: number;
  confidence: number;
  anchors: string[];
  anchorWeight: number;
}

/**
 * Score every guidance category against the transcript.
 *
 * Reuses the *same* stemmer, phrase matcher and anchor weighting as the
 * clinical ranker, so "his speech is slurred" and "slurred speech" behave the
 * same in both corpora. Returns only categories with real signal; nothing here
 * is ever treated as a diagnosis.
 */
export function matchGuidanceCategories(
  transcript: string,
  topK = 3
): CategoryMatch[] {
  const ranked = rankByText(transcript, GUIDANCE_CATEGORIES, GUIDANCE_CATEGORIES.length);
  const tokens = tokenize(transcript);
  const second = ranked[1]?.score ?? 0;
  const top = ranked[0]?.score ?? 0;

  const matches: CategoryMatch[] = ranked.map(({ item, score, anchors }) => {
    const anchorWeight = anchors.reduce((sum, a) => sum + phraseWeight(a), 0);
    // Bounded 0..1 on purpose — this number is shown to a dispatcher and gates
    // speech, so it must not be able to exceed 1.
    //   dominance: how far ahead of the runner-up category (0 if tied)
    //   evidence:  how much anchor weight we actually matched, saturating at 3
    const dominance = top > 0 ? Math.max(0, (score - second) / top) : 0;
    const evidence = Math.min(1, anchorWeight / 3);
    const confidence = +(dominance * 0.6 + evidence * 0.4).toFixed(3);
    void tokens;
    return { category: item, score, confidence, anchors, anchorWeight };
  });

  // Display is gated on EVIDENCE (anchor weight), not on confidence.
  //
  // Confidence deliberately falls toward zero when two categories tie, which is
  // the right signal for *speaking* — but as a display gate it erased real
  // matches. "She is having a seizure" ties between the neuro and seizure
  // families (both legitimately contain it) and vanished entirely, taking the
  // do-not-restock-their-mouth advice with it. Low confidence now means "shown,
  // but do not say aloud", which is exactly the distinction worth having.
  return matches
    .filter((m) => m.anchorWeight >= MIN_CATEGORY_ANCHOR_WEIGHT)
    .slice(0, Math.max(1, topK));
}

/**
 * The categories safe enough to speak aloud.
 *
 * Speaking is gated harder than displaying. A dispatcher can read any category
 * on screen, but audio goes into a caller's ear unprompted with no chance to
 * check it, so it needs a clearly dominant, multi-signal match.
 */
export function speakableCategories(matches: CategoryMatch[]): CategoryMatch[] {
  return matches.filter(
    (m) => m.anchors.length >= 2 && m.confidence >= MIN_CATEGORY_CONFIDENCE
  );
}
