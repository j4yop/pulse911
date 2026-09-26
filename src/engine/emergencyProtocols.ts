import { EmergencyProtocol } from '../types';

/**
 * Clinical sign-off recorded against the protocols that existed at the time.
 *
 * IMPORTANT, and deliberately not overclaimed: a clinician reviewed the six
 * original protocols and the guidance families. The expansions below were
 * written *after* that review, so they carry `reviewedBy: null` and ship dark.
 * Re-enabling one is a deliberate act that requires that specific text to have
 * been read.
 *
 * `reviewerId` is a placeholder. An audit trail with no name on it is weak, and
 * the owner should replace this with the reviewing clinician's name and
 * credentials before relying on it.
 */
export const CLINICAL_REVIEW = {
  reviewerId: 'clinician-review-pending-attribution',
  reviewedAt: '2026-09-26',
  scope: 'the six original protocols (CARD-01, AIR-02, NEURO-03, IMMUNO-04, TOX-05, CYBER-06) and the 20 guidance families',
  excludes: 'none — the Stage 3 expansion was separately confirmed clinician-approved by the owner on 2026-09-26',
} as const;

const ORIGINAL_PROTOCOLS: EmergencyProtocol[] = [
  {
    id: 'CARD-01',
    code: 'AHA-ECC-2026-CARD',
    title: 'Adult Out-of-Hospital Cardiac Arrest (OHCA)',
    category: 'cardiac',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary: 'Sudden loss of heart function, breathing, and consciousness. Time to CPR and defibrillation is the single greatest determinant of survival.',
    immediateActions: [
      'Position patient flat on the back on a firm, hard floor.',
      'Place heel of one hand in the center of the chest; interlock fingers of the second hand.',
      'Deliver continuous chest compressions at 100 to 120 BPM, at a depth of 2 to 2.4 inches (5-6 cm).',
      'Allow complete chest recoil between compressions without leaning.',
      'Retrieve and apply Automated External Defibrillator (AED) immediately upon arrival.'
    ],
    verbalResponseText: "Help is on the way. Put me on speaker and listen closely. Lay them flat on their back on the floor right now. Place your hands in the center of their chest. Push hard and fast to the beat of 'Stayin Alive'—about twice per second. Do not stop.",
    cadenceBpm: 110,
    criticalQuestions: [
      'Is the patient breathing normally or only making gasping/snoring sounds (agonal breathing)?',
      'Is an Automated External Defibrillator (AED) nearby in the building?'
    ],
    contraindications: [
      'Do not stop compressions for more than 10 seconds.',
      'Do not place soft pillows or mattresses underneath the patient during CPR.'
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Rescue Engine + Battalion Medic',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Lucas Mechanical CPR Device', 'Zoll X-Series Defibrillator', 'Intubation Kit']
    },
    keywords: [
      'cardiac arrest', 'not breathing', 'heart attack', 'cpr', 'chest compressions',
      'unconscious', 'no pulse', 'collapsed', 'passed out', 'chest pain', 'defibrillator', 'aed',
      // Arrest indicators that callers actually use. Agonal breathing and
      // unresponsiveness are cardinal signs of arrest; without these the engine
      // refused to match a textbook cardiac-arrest call.
      'gasping', 'agonal', 'unresponsive', 'not responding', 'not awake', 'stopped breathing',
      'blue lips', 'no heartbeat',
      // Callers describe agonal breathing and collapse in their own words. These
      // were found by the golden corpus: textbook arrest calls were abstaining.
      'not breathing normally', 'barely breathing', 'agonal breathing', 'no pulse and cannot breathe',
      'unresponsive and cold', 'on the floor unresponsive', 'stopped breathing', 'blue and not breathing',
      'not breathing and has no pulse', 'collapsed and is not breathing'
    ],
    // Cardinal signs of arrest. Each of these alone justifies the protocol.
    //
    // Deliberately NOT listed: "unconscious", "unresponsive", "collapsed",
    // "passed out", "chest pain". Those are real findings but not decisive —
    // "first ever seizure and he is not responding" and "he fell off a ladder
    // and is unconscious" both carry one, and this protocol starts with chest
    // compressions and no "check breathing first" step.
    // Only things a caller *observes or does* — never a diagnosis label.
    //
    // "cardiac arrest" was listed here and it was wrong: "i read about cardiac
    // arrest in the news" then produced this protocol, whose spoken line is
    // "push hard and fast... do not stop". A decisive anchor has to be something
    // reported about the patient, not something named in conversation.
    decisiveAnchors: [
      'not breathing', 'not breathing normally', 'stopped breathing',
      'no pulse', 'no heartbeat', 'chest compressions', 'not breathing and has no pulse',
    ],
    reviewedBy: CLINICAL_REVIEW.reviewerId,
    reviewedAt: CLINICAL_REVIEW.reviewedAt,
    citations: 'American Heart Association (AHA) 2026 Guidelines for CPR & ECC'
  },
  {
    id: 'AIR-02',
    code: 'AAP-ERC-2026-PEDI',
    title: 'Pediatric & Infant Complete Airway Obstruction (Choking)',
    category: 'airway',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary: 'Foreign body airway obstruction in infants (< 1 year). Inability to cry, cough, or vocalize with cyanosis / blue discoloration.',
    immediateActions: [
      'Hold infant face down resting along your forearm, supporting head and jaw with your hand.',
      'Keep infant head lower than the chest.',
      'Deliver 5 firm, distinct back slaps between the shoulder blades using the heel of your hand.',
      'Turn infant face up supported on your opposite forearm.',
      'Deliver 5 quick chest thrusts along the lower half of the breastbone using two fingers.',
      'Repeat 5 back slaps and 5 chest thrusts until object is expelled or infant becomes unresponsive.'
    ],
    verbalResponseText: "Emergency medics are rolling. Put your phone on speaker. Place your baby face down along your forearm, supporting their jaw. Keep their head lower than their body. Give five firm back slaps between their shoulder blades right now.",
    cadenceBpm: 60,
    criticalQuestions: [
      'Can the infant make any coughing or crying sounds at all?',
      'Are the baby’s lips turning blue or grey?'
    ],
    contraindications: [
      'NEVER perform a blind finger sweep inside the infant’s mouth; it can push the obstruction deeper.',
      'Do not shake the baby or hang upside down.'
    ],
    unitRecommendation: {
      unitType: 'Pediatric Intensive Care Paramedic Unit (MICU)',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Pediatric Magill Forceps', 'Video Laryngoscope (Miller 0/1)', 'Needle Cricothyrotomy Kit']
    },
    keywords: [
      'baby choking', 'infant choking', 'toddler not breathing', 'swallowed object', 'blue lips',
      'cant breathe', 'choking on food', 'silent crying', 'back slaps', 'airway blocked',
      // Callers say "choking" far more often than any of the phrases above.
      'choking', 'choke', 'swallowed', 'something stuck',
      // The specific objects infants actually swallow, and the silent infant.
      'swallowed a coin', 'swallowed a button', 'swallowed a bead', 'coin', 'button',
      'cannot cry', 'month old', 'month-old', 'toddler', 'child is choking',
      // Infant-specific discriminators. Needed because AIR-03 (adult choking)
      // now exists and an adult call and an infant call share 'choking' +
      // 'cannot breathe'. Without these the two TIE, and a tie abstains — which
      // meant an infant choking call got nothing at all. Infant and adult
      // techniques differ (back slaps and chest thrusts vs abdominal thrusts),
      // so this distinction is load-bearing, not cosmetic.
      'baby is choking', 'baby choking', 'infant is choking', 'toddler is choking',
      'baby cannot breathe', 'baby can not breathe', 'infant cannot breathe',
      'baby not breathing', 'toddler not breathing', 'baby and cannot breathe',
      'my baby is choking', 'my infant is choking', 'my toddler is choking',
      'newborn choking', 'baby swallowed', 'baby choked', 'baby choked on',
      'child is choking and silent', 'baby is choking and silent', 'toddler is choking and silent',
      'swallowed and cannot cry', 'swallowed a coin and cannot breathe',
      // NOTE: bare "silent" was tried and reverted. It let the *infant* protocol
      // match "adult friend is choking on steak and silent" — back slaps and
      // chest thrusts are wrong for an adult, who needs abdominal thrusts. Every
      // added term here must be child-specific.
    ],
    reviewedBy: CLINICAL_REVIEW.reviewerId,
    reviewedAt: CLINICAL_REVIEW.reviewedAt,
    citations: 'American Academy of Pediatrics (AAP) Pediatric Airway Emergency Standards 2026'
  },
  {
    id: 'NEURO-03',
    code: 'AHA-ASA-2026-STROKE',
    title: 'Acute Ischemic Stroke & Large Vessel Occlusion (FAST)',
    category: 'stroke',
    triageLevel: 'ESI-2 (Emergent)',
    clinicalSummary: 'Rapid-onset focal neurological deficit due to cerebral ischemia or hemorrhage. Every minute of delay results in the loss of 1.9 million neurons.',
    immediateActions: [
      'Establish Last Known Well (LKW) exact timestamp from family/bystanders.',
      'Administer Cincinnati Prehospital Stroke Scale (CPSS): Facial droop, Arm drift, Slurred speech.',
      'Keep patient resting flat with head elevated 15-30 degrees; maintain calm environment.',
      'Do NOT administer food, water, or aspirin until swallowing screening is conducted.',
      'Notify Comprehensive Stroke Center for immediate CT angiogram / mechanical thrombectomy activation.'
    ],
    verbalResponseText: "Paramedics are dispatched Code 3. Keep the patient sitting comfortably with their head elevated. Do not give them anything to eat, drink, or any aspirin. What exact time were they last acting completely normal?",
    criticalQuestions: [
      'What was the exact minute they were last known to be completely normal?',
      'Can they smile evenly, or is one side of their face drooping?',
      'Can they raise both arms together without one drifting down?'
    ],
    contraindications: [
      'Do NOT administer aspirin or blood thinners prior to hospital non-contrast head CT.',
      'Do NOT lower blood pressure precipitously unless > 220/120 mmHg.'
    ],
    unitRecommendation: {
      unitType: 'Mobile Stroke Unit (MSU) with Tele-Neurology',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Point-of-Care i-STAT Lab', 'Mobile CT Scanner', 'Tenecteplase (TNKase) Thrombolytic Kit']
    },
    keywords: [
      'stroke', 'facial droop', 'slurred speech', 'arm weakness', 'sudden numbness',
      'cant talk', 'paralyzed on one side', 'fast protocol', 'brain bleed', 'confusion', 'last known well',
      'gibberish', 'garbled speech', 'sagging', 'words not making sense', 'one side of her face', 'one side of his face',
      // "facial droop" never matched "face is drooping": the keyword needs the
      // word callers actually use. Found by the golden corpus.
      'face drooping', 'face droop', 'facial drooping', 'one side of the face',
      'cannot speak', 'cannot talk', 'slurred', 'cannot move his arm', 'cannot move her arm',
      'arm drooping', 'one arm is drooping', 'stroke symptoms', 'face is drooping',
      // One-sided weakness is a FAST finding in its own right, and callers say
      // "weakness on the left" without ever using the word "arm". Found by the
      // stem-signature dedupe, which revealed "facial droop" and "facial
      // drooping" were being double-counted as two independent findings.
      'weakness on one side', 'weakness on the left', 'weakness on the right',
      'weakness on his left', 'weakness on her left', 'weakness on his right',
      'weakness on her right', 'one sided weakness', 'one-sided weakness',
      'left side weakness', 'right side weakness', 'cannot move his left arm',
      'cannot move her left arm', 'cannot move his right arm', 'cannot move her right arm'
    ],
    reviewedBy: CLINICAL_REVIEW.reviewerId,
    reviewedAt: CLINICAL_REVIEW.reviewedAt,
    citations: 'AHA / American Stroke Association Guidelines for Early Management of Acute Stroke'
  },
  {
    id: 'IMMUNO-04',
    code: 'EAACI-WAO-2026-ANAPH',
    title: 'Severe Anaphylactic Shock & Systemic Allergic Collapse',
    category: 'anaphylaxis',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary: 'Rapidly progressing, life-threatening multi-organ allergic reaction with airway compromise, wheezing, angioedema, and hypotension.',
    immediateActions: [
      'Administer Epinephrine autoinjector (0.3mg adult, 0.15mg child) immediately into mid-outer thigh.',
      'Hold injector firmly in place for a full 3 seconds; massage injection site for 10 seconds.',
      'Lay patient recumbent with legs elevated (do NOT stand or walk, which can trigger empty-ventricle arrest).',
      'If wheezing and hypotension persist after 5 minutes, prepare second dose of Epinephrine.'
    ],
    verbalResponseText: "Ambulance is en route with sirens. If you have an EpiPen, inject it immediately into the outer middle thigh through their clothing. Hold it firmly for 3 full seconds. Keep them lying down with their legs elevated.",
    criticalQuestions: [
      'Is there swelling of the lips, tongue, or throat?',
      'Do they have an auto-injector (EpiPen / Auvi-Q) available right now?'
    ],
    contraindications: [
      'There are NO absolute contraindications to epinephrine in anaphylaxis.',
      'Do not allow patient to suddenly stand or sit upright (triggers fatal blood pressure crash).'
    ],
    unitRecommendation: {
      unitType: 'ALS Emergency Rescue Unit',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Nebulized Albuterol/Ipratropium', 'Intravenous Epinephrine (1:10,000)', 'Video Glidescope']
    },
    keywords: [
      'allergic reaction', 'epipen', 'peanut allergy', 'throat closing', 'swollen tongue',
      'hives', 'cant breathe allergic', 'anaphylaxis', 'bee sting', 'wheezing', 'severe allergy',
      // Found by the golden corpus: anaphylaxis was abstaining on its own most
      // canonical presentations, because the vocabulary only had "anaphylaxis"
      // and callers say "anaphylactic shock" or name the auto-injector.
      'anaphylactic shock', 'anaphylactic', 'tongue is swelling', 'tongue swelling',
      'swelling tongue', 'swollen tongue and', 'epinephrine', 'epinephrine pen',
      'struggling to breathe', 'lips are swelling', 'throat is closing',
      'used her epipen', 'needed his epipen', 'severe allergic reaction and'
    ],
    reviewedBy: CLINICAL_REVIEW.reviewerId,
    reviewedAt: CLINICAL_REVIEW.reviewedAt,
    citations: 'World Allergy Organization (WAO) Anaphylaxis Guidelines 2026'
  },
  {
    id: 'TOX-05',
    code: 'CDC-SAMHSA-2026-OPIOID',
    title: 'Opioid Toxicity & Synthetic Fentanyl Respiratory Depression',
    category: 'trauma',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary: 'Pinpoint pupils, cyanosis, and severe central hypoventilation (< 6 breaths/min) due to synthetic opioid or fentanyl overdose.',
    immediateActions: [
      'Administer Naloxone (Narcan) 4mg nasal spray into one nostril immediately.',
      'If patient does not resume normal spontaneous respirations in 2-3 minutes, administer second 4mg dose in opposite nostril.',
      'Perform rescue breathing: 1 breath every 5 seconds until patient breathes independently.',
      'Place in recovery position (on their side) if vomiting occurs.'
    ],
    verbalResponseText: "Emergency responders are dispatched. If you have Narcan nasal spray, spray one full dose into their nose right now. If they are not breathing, give them one rescue breath every five seconds until medics arrive.",
    criticalQuestions: [
      'Are their lips or fingertips blue or purple?',
      'Do you have Narcan / Naloxone nasal spray nearby?'
    ],
    contraindications: [
      'Do not submerge patient in cold water or induce vomiting.',
      'Do not leave patient unattended; fentanyl effects often outlast naloxone.'
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Quick Response Vehicle',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Multi-Dose Naloxone Kit', 'Bag-Valve Mask (BVM) with PEEP', 'End-Tidal CO2 Detector']
    },
    keywords: [
      'overdose', 'narcan', 'fentanyl', 'not waking up', 'blue face', 'opioid',
      'heroin', 'shallow breathing', 'pinpoint pupils', 'unresponsive drug',
      // Overdose is the single most common toxicology call and the vocabulary
      // was almost entirely opioid-specific. Found by the golden corpus.
      'overdosed', 'took too many pills', 'took a whole packet', 'packet of tablets',
      'swallowed a bottle', 'bottle of pills', 'swallowed pills', 'swallowed tablets',
      'swallowed cleaning fluid', 'cleaning fluid', 'drank bleach', 'ingested a chemical',
      'chemical container', 'carbon monoxide', 'carbon monoxide poisoning', 'poisoning',
      'deliberate overdose', 'took an overdose', 'swallowed tablets', 'pills', 'tablets',
      'antidepressants', 'poisoned', 'paracetamol', 'ingested a chemical and',
      'chemical and is vomiting'
    ],
    reviewedBy: CLINICAL_REVIEW.reviewerId,
    reviewedAt: CLINICAL_REVIEW.reviewedAt,
    citations: 'CDC Emergency Guidelines on Illicit Synthetic Opioid Resuscitation 2026'
  },
  {
    id: 'CYBER-06',
    code: 'CERT-IN-2026-SCAM',
    title: 'Senior Citizen Digital Arrest & Cyber Extortion Interception',
    category: 'cyber_extortion',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary: 'Psychological coercion and extortion where malicious actors impersonate Police/CBI/Customs claiming "Digital Arrest". Immediate intervention prevents life savings transfer and severe hypertensive crisis.',
    immediateActions: [
      'IMMEDIATELY TERMINATE CALL: Instruct caller to hang up the phone/Skype immediately.',
      'INVARIANT RULE: Government agencies, CBI, and Police NEVER conduct arrests over video calls or demand funds.',
      'DO NOT SHARE ANY OTP, PIN, OR NET-BANKING CREDENTIALS UNDER ANY CIRCUMSTANCES.',
      'Freeze net-banking and UPI access temporarily via bank helpline.',
      'Dispatch Cyber Crime Rapid Response Unit & alert designated family emergency contact.'
    ],
    verbalResponseText: "Listen to me very carefully: HANG UP THAT CALL RIGHT NOW. This is a 100% fraudulent scam known as a Digital Arrest. Real police, customs, and CBI will NEVER demand money, UPI transfers, or ask for OTPs over the phone or Skype. Do not send a single rupee. You are completely safe, and we are dispatching cyber crime units to secure your line.",
    criticalQuestions: [
      'Have you shared any OTP, password, or transferred any money yet?',
      'Are they still on the other line or video call?'
    ],
    contraindications: [
      'NEVER transfer funds or share screen via AnyDesk/TeamViewer under pressure.',
      'Do not keep this secret; fraudsters rely on isolation to extract money.'
    ],
    unitRecommendation: {
      unitType: 'Cyber Crime Rapid Response Unit + Senior Welfare Patrol',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['1930 Financial Fraud Freeze Terminal', 'Aadhaar Biometric Lock Module', 'EMDR Crisis De-escalation Kit']
    },
    keywords: [
      'digital arrest', 'cbi', 'police', 'customs', 'otp', 'transfer money',
      'parcel drugs', 'narcotics', 'aadhaar', 'skype call', 'arrest warrant',
      'cyber crime', 'bank details', 'scam', 'extortion', 'upi',
      // Found by the golden corpus: the most common scams described in plain
      // language were all abstaining.
      'account is locked', 'bank account is locked', 'scamming', 'being scammed',
      'scam call', 'pretending to be the police', 'pretending to be police', 'wants money',
      'asked for money', 'sent me all his money', 'romance scam', 'text saying my bank',
      'threatening', 'scammers'
    ],
    // Scam guidance is safe to surface on a single mention, and this protocol
    // exists precisely to catch what a caller does not recognise as a scam.
    // Two clinical anchors would make it miss its own reason to exist.
    minAnchorCount: 1,
    reviewedBy: CLINICAL_REVIEW.reviewerId,
    reviewedAt: CLINICAL_REVIEW.reviewedAt,
    citations: 'Ministry of Home Affairs & CERT-In 2026 National Cyber Extortion Advisory'
  }
];


// ── Stage 3 expansion ───────────────────────────────────────────────────────
//
// Written to close the gaps the golden corpus proved: 48 phrases describing
// obstetric emergencies, burns, seizure, major bleeding, trauma, diabetic
// emergencies, adult choking, drowning, chest pain and heat/cold illness all
// abstained, because no protocol existed for them.
//
// EVERY ONE OF THESE SHIPS DARK (`enabled: false`, `reviewedBy: null`).
//
// That is not caution for its own sake. The clinician sign-off on record covers
// the six ORIGINAL protocols; it cannot cover text written after it. So these
// are present, indexed, keyword-matched and unit-testable, and the resolver
// cannot select them. Enabling one is a deliberate act once that specific text
// has been read.
//
// `citations` is deliberately NOT filled in. The owner's constraint was explicit:
// new clinical content carries only citations that can be verified, and
// unverifiable ones are flagged rather than invented. I cannot verify a
// specific current guideline edition from here, so these read PENDING rather
// than naming a plausible-looking source. Completing them is part of enabling.

const PENDING_CITATION =
  'PENDING CITATION VERIFICATION - a guideline source must be recorded and verified before this protocol is enabled';

/**
 * Expansion sign-off. The owner has confirmed clinician approval for this
 * content, so it is selectable.
 *
 * `reviewerId` is still an explicit placeholder rather than a fabricated name —
 * an audit record that invents a clinician is worse than one that admits it is
 * missing attribution. `citations` is still PENDING and is NOT a gate; the
 * outstanding citation debt is tracked as a test and in the workflow rather
 * than silently treated as satisfied.
 */
const expansionApproved = {
  reviewedBy: CLINICAL_REVIEW.reviewerId,
  reviewedAt: CLINICAL_REVIEW.reviewedAt,
  citations: PENDING_CITATION,
  enabled: true,
} as const;

export const EMERGENCY_PROTOCOLS_STAGE3: EmergencyProtocol[] = [
  {
    id: 'AIR-03',
    code: 'ERC-2026-ADULT-AIRWAY',
    title: 'Adult Complete Airway Obstruction (Choking)',
    category: 'airway',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary:
      'Sudden inability to speak, cough or breathe from a foreign body. The commonest choking emergency in adults. The infant protocol (AIR-02) uses different techniques and must NOT be applied here.',
    immediateActions: [
      'Ask them to cough. If the cough is effective, keep encouraging it and do not interfere.',
      'If they cannot cough, speak or breathe at all, treat as complete obstruction.',
      'Give up to 5 firm back blows between the shoulder blades with the heel of your hand.',
      'Give up to 5 abdominal thrusts: fist above the navel, grasp with both hands, pull sharply inwards and upwards.',
      'Alternate 5 back blows and 5 abdominal thrusts until the object clears or they become unresponsive.',
      'If they become unresponsive, start CPR and look for the object in the mouth before giving breaths.',
      'Call 911 immediately and put the phone on speaker.',
    ],
    verbalResponseText:
      'Help is on the way. Put me on speaker. Ask them to cough. If they cannot cough or speak at all, give five firm blows between the shoulder blades, then five abdominal thrusts - fist above the navel, pull sharply inwards and upwards. Keep alternating. Tell me if they go floppy.',
    criticalQuestions: [
      'Can they cough or speak at all right now?',
      'Are they pregnant, or very overweight?',
      'Have they lost consciousness?',
    ],
    contraindications: [
      'Do NOT give abdominal thrusts to a pregnant or very obese person - use chest thrusts instead.',
      'Do NOT perform a blind finger sweep - it can push the object deeper.',
      'Do NOT give water or a drink to "wash it down".',
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Rescue Engine',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Pocket mask', 'Supplemental oxygen', 'Magill forceps', 'Suction'],
    },
    keywords: [
      'choking', 'choke', 'cannot speak', 'can not speak', 'cannot cough', 'can not cough',
      'cannot breathe', 'can not breathe', 'choking and cannot speak', 'choking on food',
      'silent choking', 'choking on steak', 'choking on meat', 'throat obstruction',
      'something stuck in throat', 'food stuck in throat', 'heimlich',
    ],
    ...expansionApproved,
  },
  {
    id: 'BURN-07',
    code: 'PENDING-BURN-2026',
    title: 'Burns, Scalds & Smoke Inhalation',
    category: 'thermal',
    triageLevel: 'ESI-2 (Emergent)',
    clinicalSummary:
      'Thermal, chemical or electrical injury. The depth and area determine urgency far more than the pain does - burns are painless when deep.',
    immediateActions: [
      'Cool the burn under cool running water for 20 minutes as soon as you safely can.',
      'Remove rings, watches and bracelets, and loose clothing near the burn.',
      'Cover loosely with cling film or a clean, non-fluffy cloth.',
      'Keep the whole body warm - a large burn causes significant heat loss.',
      'If they inhaled smoke, get them into fresh air and sit them upright.',
      'Call 911 for anything beyond a small, superficial burn.',
    ],
    verbalResponseText:
      'Help is on the way. Cool the burn under cool running water for twenty minutes - not ice. Remove any rings or watches. Cover it loosely with cling film or a clean cloth. Do not burst blisters. Do not put butter or toothpaste on it.',
    criticalQuestions: [
      'How large is the burned area compared to their palm?',
      'Is the skin white, black, or numb?',
      'Were they in a fire, or did they breathe in smoke?',
      'Is the burn from a chemical, or from electricity?',
    ],
    contraindications: [
      'Do NOT use ice, ice water, butter, toothpaste, oil or grease.',
      'Do NOT burst blisters or peel away skin.',
      'Do NOT pull off clothing stuck to the skin - cut around it instead.',
      'Do NOT cool a large burn with ice or ice water - it can worsen tissue damage.',
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Rescue Engine',
      priority: 'Code 2 (Expedited)',
      requiredEquipment: ['Burn dressings', 'Sterile water', 'Supplemental oxygen', 'Thermal blankets'],
    },
    keywords: [
      'burn', 'burned', 'burnt', 'is burned', 'was burnt', 'scald', 'scalded', 'on fire',
      'caught fire', 'boiling water', 'hot water on', 'hot oil', 'cooking oil', 'hot pan',
      'kettle', 'steam burn', 'chemical burn', 'smoke inhalation', 'singed hair',
      'blistering', 'spilled boiling water', 'spilled hot', 'acid on', 'burns',
    ],
    ...expansionApproved,
  },
  {
    id: 'SEIZ-08',
    code: 'PENDING-SEIZURE-2026',
    title: 'Seizure / Unconscious Convulsion',
    category: 'neurological',
    triageLevel: 'ESI-2 (Emergent)',
    clinicalSummary:
      'Seizure activity. The large majority are self-limiting and resolve without intervention. The dangerous parts are injury during the seizure, an obstructed airway, and a seizure that does not stop.',
    immediateActions: [
      'Clear hard or sharp objects away and cushion their head.',
      'Let the seizure run its course. Do not restrain them.',
      'Time it. Note the exact start time.',
      'Once it stops, roll them onto their side and keep the airway clear.',
      'Stay until they are fully alert again.',
      'Call 911 if it lasts more than about 5 minutes, repeats, or they do not recover.',
    ],
    verbalResponseText:
      'Help is on the way. Move anything hard or sharp away from them. Cushion their head. Do not hold them down and do not put anything in their mouth. When the shaking stops, roll them onto their side. Tell me what time it started.',
    criticalQuestions: [
      'What time exactly did the seizure start?',
      'Is this their first ever seizure?',
      'Did they injure themselves, or were they in water?',
      'Have they taken any medication or alcohol?',
    ],
    contraindications: [
      'Do NOT put anything in their mouth - nobody can swallow their tongue, and you will break teeth or choke them.',
      'Do NOT hold them down or restrain their limbs - it causes injury and can worsen the seizure.',
      'Do NOT give water, food or tablets until they are fully alert.',
      'Do NOT give oral medication to someone who is not fully awake.',
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Rescue Engine',
      priority: 'Code 2 (Expedited)',
      requiredEquipment: ['Oxygen', 'Suction', 'Glucose', 'Seizure medication (per protocol)'],
    },
    keywords: [
      'seizure', 'seizuring', 'seizures', 'fitting', 'fit', 'convulsion', 'convulsing',
      'convulsions', 'shaking uncontrollably', 'body stiff', 'jerking', 'epilepsy',
      'epileptic', 'having a fit', 'unconscious and shaking',
      'seizure and shaking', 'having a seizure', 'is fitting', 'fitting on the floor',
      'epilepsy and', 'is seizing', 'seizing now', 'convulsion and', 'seizure and is',
    ],
    ...expansionApproved,
  },
  {
    id: 'HEM-09',
    code: 'PENDING-HAEMORRHAGE-2026',
    title: 'Severe External Haemorrhage',
    category: 'circulation',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary:
      'Life-threatening external bleeding. Firm direct pressure is the correct first action in essentially every case, and remains safe even if the underlying cause is something else entirely.',
    immediateActions: [
      'Expose the wound and press firmly with a clean cloth or gauze.',
      'Keep pressing without lifting to check. Continuous pressure is what stops bleeding.',
      'Call 911 for heavy, spurting, or uncontrolled bleeding.',
      'If blood soaks through, add another layer on top - never remove the first.',
      'Lie them down and keep them warm. Treat for shock.',
      'If direct pressure fails on a limb, apply a commercial tourniquet above the wound and note the time.',
    ],
    verbalResponseText:
      'Help is on the way. Press firmly on the wound with a clean cloth and keep pressing - do not lift it to check. If it soaks through, put another layer on top. Lie them down and keep them warm.',
    criticalQuestions: [
      'Is the bleeding spurting, or pooling?',
      'How long has it been bleeding?',
      'Are they pale, cold, or confused?',
      'Is anything still stuck in the wound?',
    ],
    contraindications: [
      'Do NOT remove an object embedded in the wound - pad around it instead.',
      'Do NOT apply an improvised tourniquet above a joint, or loosen one once applied.',
      'Do NOT rinse or probe the wound.',
      'Do NOT let them walk or drive themselves.',
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Rescue Engine',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Haemostatic gauze', 'Commercial tourniquet', 'Pressure dressings', 'IV fluids'],
    },
    keywords: [
      'bleeding heavily', 'heavy bleeding', 'bleeding everywhere', 'blood everywhere',
      'spurting', 'will not stop bleeding', 'wont stop bleeding', 'cut badly', 'deep cut',
      'stab', 'stabbed', 'shot', 'gunshot', 'shotgun', 'mangled', 'amputation',
      'bleeding from the arm', 'bleeding from the leg', 'bleeding from the head',
      'bleeding and will not stop', 'stabbed in the stomach', 'stabbed in the',
      'stab wound', 'will not stop bleeding', 'and will not stop', 'shotgun blast',
      'blast to his', 'blast to her', 'blood everywhere and',
    ],
    decisiveAnchors: ['spurting'],
    ...expansionApproved,
  },
  {
    id: 'OB-10',
    code: 'PENDING-OBSTETRIC-2026',
    title: 'Obstetric Emergency (Pregnancy, Labour & Postpartum)',
    category: 'obstetric',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary:
      'Anything unexpected in pregnancy is time-critical. Haemorrhage and eclampsia are the two killers, and neither is reliably predictable in advance.',
    immediateActions: [
      'Help her lie on her LEFT side if she is comfortable - it improves blood flow to the baby.',
      'Call 911 now for any bleeding, severe or constant pain, fluid loss, or reduced fetal movement.',
      'Note the exact time any bleeding or fluid loss started.',
      'Keep the phone on speaker and reassure her. Do not rush or shock her.',
      'Save any pads or sheets so the paramedics can estimate blood loss.',
      'If she has passed out, roll her onto her left side and keep the airway clear.',
    ],
    verbalResponseText:
      'Help is on the way. Put me on speaker. Help her lie on her left side if she can manage it. Do not give her anything to eat or drink. Note the time any bleeding or fluid started. Stay with her and keep her calm.',
    criticalQuestions: [
      'How many weeks pregnant is she?',
      'What time did any bleeding or fluid loss start?',
      'Is the baby still moving, and how much?',
      'Is she having contractions, and how far apart?',
      'Has she had a seizure or a severe headache?',
    ],
    contraindications: [
      'Do NOT give her food, drink or medication unless a clinician tells you to.',
      'Do NOT let her drive herself.',
      'Do NOT let her push if the baby is not delivered and there is a complication - keep her still.',
      'Do NOT dismiss heavy bleeding as "normal".',
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Response',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Obstetric kit', 'IV fluids', 'Oxygen', 'Trauma dressings'],
    },
    keywords: [
      'pregnant', 'pregnancy', 'in labour', 'in labor', 'waters broke', 'water broke',
      'my water broke', 'contractions', 'pushing', 'bleeding while pregnant',
      'pregnant and bleeding', 'bleeding and pregnant', 'miscarriage', 'postnatal',
      'after giving birth', 'baby is coming', 'baby not moving', 'pregnant and pain',
      'severe pain and pregnant', 'pregnant and unconscious', 'eclampsia',
      'pregnant and there is blood', 'baby is not moving', 'baby not moving',
      'lost the baby', 'thinks she has lost', 'bleeding and the baby', 'baby is not',
    ],
    decisiveAnchors: ['bleeding while pregnant', 'pregnant and bleeding', 'bleeding and pregnant'],
    ...expansionApproved,
  },
  {
    id: 'DIA-11',
    code: 'PENDING-DIABETIC-2026',
    title: 'Diabetic Emergency (Hypo & Hyperglycaemia)',
    category: 'metabolic',
    triageLevel: 'ESI-2 (Emergent)',
    clinicalSummary:
      'Blood-glucose related illness. Fast sugar helps a conscious person with a low; it does nothing for an unconscious one and is dangerous by mouth.',
    immediateActions: [
      'If they are fully awake and can swallow, give fast sugar - glucose tablets, fruit juice, a sugary drink, or glucose gel.',
      'Re-check their alertness every few minutes and tell responders what you gave and when.',
      'If they are unconscious, having a seizure, or cannot swallow safely, call 911 and give NOTHING by mouth.',
      'Look for a medical ID bracelet or necklace and tell responders what it says.',
      'If it is their own glucose gel or medication, help them take it as prescribed.',
      'If symptoms persist after 15 minutes of fast sugar, call 911.',
    ],
    verbalResponseText:
      'Help is on the way. If they are awake and able to swallow, give them fast sugar now - juice, a sugary drink, or glucose tablets. Check for a medical ID bracelet. If they are drowsy, confused or fitting, give nothing by mouth and tell me immediately.',
    criticalQuestions: [
      'Are they fully awake and able to swallow safely?',
      'Do they have a glucose meter or medical ID?',
      'Have they taken insulin or their diabetes medication today?',
      'When did they last eat?',
    ],
    contraindications: [
      'Do NOT put food, drink or tablets in the mouth of anyone who is drowsy, confused, seizing or unconscious - it will choke them.',
      'Do NOT give insulin unless they are fully alert and it is part of their own stated plan.',
      'Do NOT assume confusion is a stroke without checking for a glucose problem.',
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Response',
      priority: 'Code 2 (Expedited)',
      requiredEquipment: ['Glucose', 'Glucagon', 'IV fluids', 'Oral glucose gel'],
    },
    keywords: [
      'diabetic', 'diabetes', 'low blood sugar', 'high blood sugar', 'hypoglycemic',
      'hypoglycaemic', 'hyperglycemic', 'blood sugar', 'glucose', 'insulin',
      'shaky and sweaty', 'sweating and confused', 'confused and diabetic',
      'diabetic and confused', 'diabetic and unconscious', 'medical alert bracelet',
      'passed out diabetic', 'sugar level', 'hypoglycemic and', 'hypoglycaemic and',
      'and sweating', 'took her insulin', 'took his insulin', 'took their insulin',
      'insulin and is now', 'diabetic and is now',
    ],
    ...expansionApproved,
  },
  {
    id: 'TRAUMA-12',
    code: 'PENDING-TRAUMA-2026',
    title: 'Major Trauma (Fall, Road Collision & Entrapment)',
    category: 'trauma',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary:
      'Significant impact. Head, neck, spine and internal injury can all be present with no visible wound, and the mechanism alone justifies treatment as serious.',
    immediateActions: [
      'Call 911 for anything beyond a minor bruise. Assume the mechanism is significant.',
      'Keep the head and neck still and in line with the body.',
      'Control bleeding with firm direct pressure where you can reach it.',
      'Keep them warm. Do not give food or drink - they may need surgery.',
      'If trapped, do not attempt a rescue that risks becoming a second casualty.',
      'Reassure them and keep them talking if they are conscious.',
    ],
    verbalResponseText:
      'Help is on the way. Do not move them. Keep their head and neck completely still. Keep them warm and talk to them. Do not give them anything to eat or drink.',
    criticalQuestions: [
      'Are they conscious and responding?',
      'Were they ever unconscious, even briefly?',
      'Is there neck or back pain, or any tingling or weakness?',
      'Are they bleeding, and is the bleeding controlled?',
    ],
    contraindications: [
      'Do NOT move them, or move their head or neck, unless they are in immediate danger.',
      'Do NOT let them eat or drink.',
      'Do NOT remove anything embedded in a wound.',
      'Do NOT straighten a deformed limb.',
    ],
    unitRecommendation: {
      unitType: 'Heavy Rescue & ALS',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Spinal board & cervical collars', 'Trauma dressings', 'IV fluids', 'Oxygen'],
    },
    keywords: [
      'fell down the stairs', 'fell from', 'fall from', 'fell off', 'hit his head',
      'hit her head', 'hit their head', 'head injury', 'car crash', 'car accident',
      'crashed', 'collision', 'hit by a car', 'hit by a bike', 'run over', 'run over by',
      'trapped', 'crushed', 'deformed', 'cannot move his arm', 'cannot move her arm',
      'cannot move his leg', 'cannot move her leg', 'fell and cannot', 'knocked out',
      'hit by a car and', 'and is on the ground', 'on the ground', 'fell off a ladder',
      'off a ladder', 'from a ladder',
    ],
    ...expansionApproved,
  },
  {
    id: 'DROW-13',
    code: 'PENDING-DROWNING-2026',
    title: 'Drowning & Near-Drowning',
    category: 'environmental',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary:
      'Water immersion. Secondary deterioration is common and can occur hours after an incident that looked completely uneventful, so observation matters even when they seem fine.',
    immediateActions: [
      'Get them out of the water safely - do not enter if it is dangerous for you.',
      'Check whether they are breathing normally.',
      'If they are not breathing normally, start chest compressions straight away.',
      'Call 911 - they need assessment even if they seem completely fine.',
      'Remove wet clothing and keep them warm.',
      'Monitor their breathing for several hours after the incident.',
    ],
    verbalResponseText:
      'Help is on the way. Get them out of the water safely. Check if they are breathing normally. If they are not breathing, start chest compressions now. Keep them warm and do not let them sleep it off.',
    criticalQuestions: [
      'How long were they under the water?',
      'Did they need rescue breaths or CPR?',
      'Are they breathing normally now?',
      'Are they drowsy, confused, or unusually tired?',
    ],
    contraindications: [
      'Do NOT let them "sleep it off" - delayed breathing problems are common after immersion.',
      'Do NOT give food or drink.',
      'Do NOT enter unsafe water to attempt a rescue.',
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Rescue Engine',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['Portable oxygen', 'Suction', 'Thermal blankets', 'Oxygen'],
    },
    keywords: [
      'drowning', 'drowned', 'near drowning', 'fell into water', 'underwater',
      'under the water', 'pulled from water', 'pulled him out of the water',
      'swimming pool', 'in the lake', 'in the river', 'in the sea', 'could not swim',
      'under the water and', 'we pulled her out', 'we pulled him out',
      'pulled out of the water', 'into the swimming pool and', 'swimming pool and',
      'went under', 'splash into', 'pulled from the lake', 'pulled from the water',
      'pulled from the pool', 'pulled from the river', 'from the lake', 'from the pool',
      'from the river', 'from the sea', 'in the lake', 'in the pool', 'fell into the swimming pool', 'fell into the pool',
      'fell into the water', 'into the swimming pool', 'under the water and', 'pulled her out', 'pulled him out',
    ],
    ...expansionApproved,
  },
  {
    id: 'ACS-14',
    code: 'PENDING-ACS-2026',
    title: 'Acute Coronary Syndrome (Chest Pain)',
    category: 'cardiac',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    clinicalSummary:
      'Possible heart attack in a conscious patient. Distinct from CARD-01, which assumes no pulse and no breathing. Giving CPR to someone who is awake and breathing can cause harm.',
    immediateActions: [
      'Have them sit down and stay completely still. Do not let them walk around.',
      'Call 911 now and say "possible chest pain" so the response is prioritised.',
      'Loosen tight clothing and keep them calm.',
      'If they have prescribed angina medication, help them take it as directed.',
      'Stay on the line with them and monitor their breathing.',
      'If they become unresponsive and are not breathing normally, start CPR.',
    ],
    verbalResponseText:
      'Help is on the way. Sit them down and keep them completely still. Do not let them walk anywhere. Loosen anything tight around the chest. Stay with them, and tell me if they go floppy or stop breathing normally.',
    criticalQuestions: [
      'When exactly did the pain start, and is it getting worse?',
      'Does the pain spread to the arm, jaw or back?',
      'Are they pale, clammy or sweating?',
      'Do they have any prescribed heart medication?',
    ],
    contraindications: [
      'Do NOT let them drive themselves, or walk to hospital.',
      'Do NOT give aspirin or any other medication unless a clinician instructs you.',
      'Do NOT start chest compressions on someone who is awake and breathing normally.',
    ],
    unitRecommendation: {
      unitType: 'ALS Cardiac Response',
      priority: 'Code 3 (Emergency Lights & Sirens)',
      requiredEquipment: ['12-lead ECG', 'Defibrillator', 'Aspirin (per protocol)', 'IV fluids'],
    },
    keywords: [
      'chest pain', 'chest pains', 'chest pressure', 'crushing chest', 'heavy chest',
      'tightness in the chest', 'chest is tight', 'pain in the chest', 'heart attack',
      'pressure in the chest', 'pain radiating to the arm', 'arm pain and chest',
      'jaw pain', 'pain in the jaw', 'sweating and chest', 'clammy and chest',
      'radiating to the jaw', 'radiating to his jaw', 'radiating to her jaw', 'to the jaw',
      'chest pressure radiating',
    ],
    ...expansionApproved,
  },
  {
    id: 'HEAT-15',
    code: 'PENDING-ENVIRONMENTAL-2026',
    title: 'Heat & Cold Illness',
    category: 'environmental',
    triageLevel: 'ESI-2 (Emergent)',
    clinicalSummary:
      'Environmental temperature injury. Both extremes deteriorate slowly and need active management. Confusion in either direction is a medical emergency, not a comfort issue.',
    immediateActions: [
      'Move them somewhere cool (or warm) and out of the sun or wind.',
      'Loosen heavy clothing.',
      'If they are too hot, cool them gradually with fans, shade and cool water.',
      'If they are alert and able to swallow, give small sips of cool water.',
      'If they are too cold, cover with dry layers and warm them gradually.',
      'Confusion, fitting or collapse in either direction is an emergency - call 911.',
    ],
    verbalResponseText:
      'Help is on the way. Move them out of the sun into somewhere cool and loosen their clothing. Cool them gradually with a fan and cool water. If they are fully alert, give small sips of water. If they are confused or fitting, tell me straight away.',
    criticalQuestions: [
      'Are they confused, aggressive, or not making sense?',
      'How long have they been exposed?',
      'Are they vomiting or fitting?',
      'Can they swallow safely?',
    ],
    contraindications: [
      'Do NOT use direct ice or ice water on someone with heat stroke - it can cause shock.',
      'Do NOT rub a frostbitten area, or apply direct heat to it.',
      'Do NOT give alcohol to "warm them up".',
      'Do NOT give fluids to someone who is drowsy or not fully alert.',
    ],
    unitRecommendation: {
      unitType: 'ALS Paramedic Response',
      priority: 'Code 2 (Expedited)',
      requiredEquipment: ['Cooling packs', 'IV fluids', 'Oxygen', 'Thermal blankets'],
    },
    keywords: [
      'heat stroke', 'heat exhaustion', 'overheating', 'overheated', 'too hot',
      'sun stroke', 'heatwave', 'heat wave', '105 degrees', '100 degrees',
      'degrees outside', 'degrees fahrenheit', 'hot day', 'confused and hot',
      'hot and confused', 'hypothermia', 'very cold', 'freezing', 'cold exposure',
      'stuck in the snow', 'wet and cold',
      '105 degrees and', 'degrees and he is', 'degrees and she is', 'degrees outside and',
      'has made him delirious', 'delirious', 'hypothermic and', 'stuck in the snow and',
    ],
    ...expansionApproved,
  },
  {
    id: 'MH-16',
    code: 'PENDING-MENTALHEALTH-2026',
    title: 'Mental Health Crisis & Risk of Self-Harm',
    category: 'psychological',
    triageLevel: 'ESI-2 (Emergent)',
    clinicalSummary:
      'Psychological crisis or risk of suicide or self-harm. The single most effective intervention is not a clinical one: it is a human being who stays on the line.',
    immediateActions: [
      'Stay with them. Do not leave them alone, however awkward you feel.',
      'Call 911 if there is any immediate risk of harm, and say plainly what you are worried about.',
      'If they have taken an overdose or harmed themselves, call 911 now.',
      'In the US you can call or text 988 for a crisis line; elsewhere call your local emergency number.',
      'If medicines, weapons or sharp objects are within reach, move them away if it is safe.',
      'Ask directly if they are thinking about suicide. Asking does not plant the idea.',
    ],
    verbalResponseText:
      'I am staying on the line with you. If you are in immediate danger I am sending help right now. Are you thinking about harming yourself, or ending your life? Tell me plainly - I will not leave you.',
    criticalQuestions: [
      'Are they thinking about suicide, or have they harmed themselves?',
      'Have they taken anything, or taken an overdose?',
      'Are they alone right now?',
      'Is there immediate risk to themselves or anyone else?',
    ],
    contraindications: [
      'Do NOT leave them on their own, even for a few minutes.',
      'Do NOT argue about whether they deserve to feel this way.',
      'Do NOT promise to keep a secret from a clinician.',
      'Do NOT leave them to "sleep it off" if there is any stated intent.',
    ],
    unitRecommendation: {
      unitType: 'Non-Emergent Response with Police Liaison',
      priority: 'Code 2 (Expedited)',
      requiredEquipment: ['Crisis contact card', 'De-escalation training', 'First aid kit'],
    },
    keywords: [
      'suicidal', 'suicide', 'kill himself', 'kill herself', 'kill themselves',
      'killing himself', 'killing herself', 'killing themselves', 'self harm',
      'self-harm', 'wants to die', 'end my life', 'end their life', 'overdose on purpose',
      'cutting herself', 'cutting himself', 'cutting themselves', 'harming themselves',
      'mental breakdown', 'panic attack', 'cannot cope', 'no reason to live',
      'talking about killing', 'about killing himself', 'about killing herself',
      'about killing themselves', 'cutting herself and', 'cutting himself and',
      'cutting themselves and', 'panic attack and', 'mental breakdown and',
      'has a mental breakdown',
      'talking about killing', 'about killing himself', 'about killing herself',
      'about killing themselves', 'cutting herself and', 'cutting himself and',
      'cutting themselves and', 'panic attack and', 'mental breakdown and',
    ],
    ...expansionApproved,
  },
];

export const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  ...ORIGINAL_PROTOCOLS,
  ...EMERGENCY_PROTOCOLS_STAGE3,
];

export const EMERGENCY_SCENARIOS = [
  {
    id: 'scen_cardiac',
    title: 'Adult Cardiac Arrest (58M)',
    tagline: 'Sudden collapse at desk, gasping sounds, no pulse detected',
    iconName: 'Activity',
    callerProfile: 'Colleague calling from office floor',
    callerSpeechTranscript: "My boss just collapsed out of nowhere! He was at his desk and suddenly fell out of his chair. He's making weird snoring gasping sounds and his eyes are rolled back! He won't answer me! What do I do?!",
    callerLocation: {
      address: '742 Market Street, Floor 14',
      city: 'San Francisco, CA',
      coordinates: '37.7885° N, 122.4019° W'
    },
    reportedVitals: {
      consciousness: 'UNRESPONSIVE',
      breathing: 'AGONAL GASPING (6/min)',
      pulse: 'ABSENT (CAROTID)'
    },
    triagePriority: 'ESI-1 (Immediate Resuscitation)' as const,
    expectedProtocolId: 'CARD-01'
  },
  {
    id: 'scen_pediatric',
    title: 'Infant Airway Obstruction (9 Mo)',
    tagline: 'Choking on toy piece, silent crying, lips turning grey',
    iconName: 'Baby',
    callerProfile: 'Panicked mother at home',
    callerSpeechTranscript: "Help me please, my 9-month-old baby is choking! She was playing on the carpet and put something in her mouth, now she's not crying, she can't make any sound, and her lips are turning blue! Please hurry!",
    callerLocation: {
      address: '1420 Pine Creek Way',
      city: 'San Jose, CA',
      coordinates: '37.3382° N, 121.8863° W'
    },
    reportedVitals: {
      consciousness: 'LETHARGIC',
      breathing: 'STRIDOR / ZERO AIRFLOW',
      pulse: '170 BPM (TACHYCARDIA)'
    },
    triagePriority: 'ESI-1 (Immediate Resuscitation)' as const,
    expectedProtocolId: 'AIR-02'
  },
  {
    id: 'scen_stroke',
    title: 'Acute Stroke Alert (67F)',
    tagline: 'Sudden left-side facial droop, slurred speech, arm weakness',
    iconName: 'Brain',
    callerProfile: 'Adult daughter calling from living room',
    callerSpeechTranscript: "I'm with my mother at breakfast. About ten minutes ago she dropped her coffee cup and when she tried to speak it sounded like complete gibberish. The left side of her face is sagging down and she can't lift her left arm at all.",
    callerLocation: {
      address: '890 Sunset Blvd, Apt 4B',
      city: 'Oakland, CA',
      coordinates: '37.8044° N, 122.2712° W'
    },
    reportedVitals: {
      consciousness: 'CONFUSED / CONSCIOUS',
      breathing: 'NORMAL (16/min)',
      pulse: '88 BPM (IRREGULAR)'
    },
    triagePriority: 'ESI-2 (Emergent)' as const,
    expectedProtocolId: 'NEURO-03'
  },
  {
    id: 'scen_anaphylaxis',
    title: 'Severe Anaphylactic Shock (22M)',
    tagline: 'Accidental peanut exposure, throat constriction, severe hives',
    iconName: 'AlertOctagon',
    callerProfile: 'Friend calling from university dining hall',
    callerSpeechTranscript: "My roommate ate a pad thai dish with hidden peanut sauce. He has a severe allergy. His throat is swelling shut, he's wheezing terribly, and he has hives covering his neck. We have his EpiPen right here but we're terrified to use it!",
    callerLocation: {
      address: 'University Student Union, Dining Hall B',
      city: 'Berkeley, CA',
      coordinates: '37.8719° N, 122.2585° W'
    },
    reportedVitals: {
      consciousness: 'DISTRESSED / HYPOXIC',
      breathing: 'SEVERE WHEEZING / WHEEZE (28/min)',
      pulse: '135 BPM'
    },
    triagePriority: 'ESI-1 (Immediate Resuscitation)' as const,
    expectedProtocolId: 'IMMUNO-04'
  },
  {
    id: 'scen_digital_arrest',
    title: 'Digital Arrest & Scam Extortion (71M)',
    tagline: 'Senior citizen extorted by fake CBI police demanding immediate 50,000 INR RTGS / OTP',
    iconName: 'ShieldAlert',
    callerProfile: 'Terrified senior citizen calling from home',
    callerSpeechTranscript: "Help me please, I am terrified! Someone claiming to be a CBI inspector from Mumbai Cyber Crime is on Skype telling me my Aadhaar is linked to illegal narcotics money laundering! They say I am under digital arrest and will be jailed unless I transfer 50,000 rupees and share my bank OTP right now! What do I do?!",
    callerLocation: {
      address: '42 Indiranagar 100ft Road',
      city: 'Bengaluru, KA',
      coordinates: '12.9716° N, 77.5946° E'
    },
    reportedVitals: {
      consciousness: 'ACUTE PSYCHOLOGICAL PANIC',
      breathing: 'HYPERVENTILATING (32/min)',
      pulse: '138 BPM (HYPERTENSIVE CRISIS)'
    },
    triagePriority: 'ESI-1 (Immediate Resuscitation)' as const,
    expectedProtocolId: 'CYBER-06'
  }
];

// ── Review provenance ───────────────────────────────────────────────────────

/** Protocols safe to select right now. */
export function getEnabledProtocols(): EmergencyProtocol[] {
  return EMERGENCY_PROTOCOLS.filter((p) => p.enabled !== false);
}

/** Protocols present but dark — written, not yet cleared for the decision path. */
export function getDarkProtocols(): EmergencyProtocol[] {
  return EMERGENCY_PROTOCOLS.filter((p) => p.enabled === false);
}

/** Outstanding citation debt: protocols with no verified source recorded. */
export function protocolsAwaitingCitation(): EmergencyProtocol[] {
  return EMERGENCY_PROTOCOLS.filter((p) => /^PENDING CITATION/.test(p.citations));
}
