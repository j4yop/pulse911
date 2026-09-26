import { EmergencyProtocol } from '../types';

export const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
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
      'swallowed and cannot cry', 'swallowed a coin and cannot breathe',
      // NOTE: bare "silent" was tried and reverted. It let the *infant* protocol
      // match "adult friend is choking on steak and silent" — back slaps and
      // chest thrusts are wrong for an adult, who needs abdominal thrusts. Every
      // added term here must be child-specific.
    ],
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
      'arm drooping', 'one arm is drooping', 'stroke symptoms', 'face is drooping'
    ],
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
    citations: 'Ministry of Home Affairs & CERT-In 2026 National Cyber Extortion Advisory'
  }
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
