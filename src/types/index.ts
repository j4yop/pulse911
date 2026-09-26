export type EmergencyCategory =
  | 'cardiac'
  | 'airway'
  | 'stroke'
  | 'anaphylaxis'
  | 'trauma'
  | 'cyber_extortion'
  | 'security'
  | 'general'
  // Added by the Stage 3 expansion, for the gaps the golden corpus proved.
  | 'thermal'
  | 'neurological'
  | 'circulation'
  | 'obstetric'
  | 'metabolic'
  | 'environmental'
  | 'psychological';
export type TriageLevel = 'ESI-1 (Immediate Resuscitation)' | 'ESI-2 (Emergent)' | 'ESI-3 (Urgent)';

export interface EmergencyProtocol {
  id: string;
  code: string;
  title: string;
  category: EmergencyCategory;
  triageLevel: TriageLevel;
  clinicalSummary: string;
  immediateActions: string[];
  verbalResponseText: string;
  cadenceBpm?: number;
  criticalQuestions: string[];
  contraindications: string[];
  unitRecommendation: {
    unitType: string;
    priority: 'Code 3 (Emergency Lights & Sirens)' | 'Code 2 (Expedited)';
    requiredEquipment: string[];
  };
  keywords: string[];
  citations: string;
  /**
   * How many DISTINCT keyword anchors must fire before this protocol may be
   * selected. Defaults to `MIN_ANCHOR_COUNT` (2).
   *
   * The default of two is a clinical safety rule: an emergency described well
   * enough to act on presents as more than one finding, and one finding is a
   * hypothesis. It is the wrong rule for a non-clinical protocol whose guidance
   * is safe to show on a single mention — CYBER-06 sets 1, because "someone is
   * scamming my grandmother" is already enough to justify scam advice, and
   * demanding two clinical anchors defeats the point of the protocol.
   *
   * Lowering this is a clinical decision, not a tuning knob.
   */
  minAnchorCount?: number;
  /**
   * Whether this protocol may be selected. Defaults to enabled.
   *
   * New clinical content ships DARK: present, indexed, testable, and matched by
   * nothing. That is deliberate. `corpusLint` refuses to let a protocol without a
   * recorded reviewer and source be presented as verified, and the only honest
   * way to hold both rules at once is to let the text exist in the repository
   * while keeping it out of the decision path until a clinician has actually
   * read that specific text.
   *
   * Enabling one is a single-token change, made on purpose, after review.
   */
  enabled?: boolean;
  /** Set once a named clinician has reviewed THIS text. Null means unreviewed. */
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  /**
   * Anchors decisive enough to select this protocol on their own, with no
   * second finding required.
   *
   * This exists because the two-anchor default is right for almost everything
   * and wrong for one specific thing: a caller who says "he is not breathing"
   * has reported a cardinal sign of arrest, and making them find a second
   * finding before we help is not caution, it is neglect.
   *
   * It is deliberately a declared list rather than a rule about phrase
   * length, because "is not breathing" and "is unresponsive" are both single
   * findings and only one of them is decisive. An undeclared protocol gets no
   * decisive anchors and therefore keeps the strict two-anchor default.
   */
  decisiveAnchors?: string[];
}

export interface EmergencyScenario {
  id: string;
  title: string;
  tagline: string;
  iconName: string;
  callerProfile: string;
  callerSpeechTranscript: string;
  simulatedAudioUrl?: string;
  /**
   * Optional on purpose.
   *
   * The live-call path used to hardcode a location — "Triangulating Cell Tower
   * GPS", "Metro Dispatch Sector 4", 37.7749° N / 122.4194° W — and render it
   * under a map-pin icon. None of it came from anywhere: there is no
   * geolocation in this app, and those are San Francisco coordinates hardcoded
   * in source. A dispatcher seeing a map pin has no way to know it is invented.
   *
   * So a live call has no location until something real supplies one.
   */
  callerLocation?: {
    address: string;
    city: string;
    coordinates: string;
  };
  /** Optional: only populated where a real monitor or a scenario supplies it. */
  reportedVitals?: {
    consciousness: string;
    breathing: string;
    pulse: string;
  };
  triagePriority: TriageLevel;
}

/**
 * Why triage declined to select a protocol. Surfaced verbatim in the UI so a
 * dispatcher can see *why* the system refused rather than silently guessing.
 */
export type AbstainReason =
  | 'empty-transcript'
  | 'no-anchor-match'
  | 'low-confidence'
  | 'low-margin'
  | 'incomplete-transcript';

/**
 * The result of a triage attempt.
 *
 * This is a discriminated union on purpose. The previous shape had
 * `protocol: EmergencyProtocol` (non-nullable), which made "no match"
 * unrepresentable and forced both engines to fabricate one — the ranker's
 * `ranked[0]` and the Moss path's `EMERGENCY_PROTOCOLS[0]`. Because
 * cardiac arrest sits at index 0, every unrecognised presentation
 * (a woman in labour, a stroke, a lost parcel) silently became CPR.
 *
 * `abstain` is now a first-class outcome, and TypeScript forces every call
 * site to handle it before it can speak or dispatch anything.
 */
export type TriageOutcome =
  | {
      kind: 'matched';
      protocol: EmergencyProtocol;
      /** Scale-free confidence in [0,1]. Never compare across engines. */
      confidence: number;
      /** Normalised gap between the top two candidates. */
      margin: number;
      /** Symptom phrases that actually fired, for auditability. */
      anchors: string[];
    }
  | {
      kind: 'abstain';
      reason: AbstainReason;
      confidence: number;
      anchors: string[];
    };

export interface MossQueryResult {
  outcome: TriageOutcome;
  /** Raw relevance score from whichever engine served the query (display only). */
  score: number;
  /** Measured cost of the executed retrieval — SDK-reported or real performance.now() delta. Never synthesized. */
  latencyMs: number;
  /** What actually served this query, e.g. 'Moss WASM Runtime (@moss-dev/moss-web)' or 'Local Fallback (deterministic keyword pass)'. */
  engine: string;
  vectorDistance: number;
  tokensEvaluated: number;
}

/**
 * What triage asks CAD for — and nothing more.
 *
 * This type deliberately has no unit id, no unit name, no crew, no station and
 * no ETA, because there is no CAD backend behind this app to produce any of
 * them. The previous `DispatchedUnit` carried all of those as hardcoded
 * literals — a unit id and call sign, a station name, a named crew, and a
 * randomised ETA — so the console displayed an invented ambulance with an
 * invented ETA under a "DISPATCHED" badge for every matched call.
 *
 * Every field below is derived from the matched protocol, so it cannot invent
 * anything the protocol does not already state.
 */
export interface DispatchIntent {
  protocolId: string;
  protocolCode: string;
  /** Recommended unit type, verbatim from the protocol. Not an assignment. */
  unitType: string;
  priority: string;
  requiredEquipment: string[];
  /**
   * Always `AWAITING_CAD`. There is no integration that can move this to a
   * real dispatched/en-route state, so no code may set it to anything else.
   */
  status: 'AWAITING_CAD';
}

/**
 * An immutable record of a human overriding a triage abstention.
 *
 * The override control used to flip local React state and nothing else, while
 * the UI implied an audit trail. These records are that trail: what triage
 * refused and why, what the human chose instead, who chose it and when.
 */
export interface OverrideRecord {
  id: string;
  atIso: string;
  /**
   * Operator identity. This build has no authentication, so this is an
   * explicit placeholder rather than a pretend name — see `operatorLabel`.
   */
  operator: string;
  /** The transcript as triage saw it at the moment of the override. */
  transcript: string;
  /** The abstention the human was overriding. */
  presentedReason: AbstainReason;
  presentedConfidence: number;
  chosenProtocolId: string;
  chosenProtocolCode: string;
  chosenProtocolTitle: string;
}
