export type EmergencyCategory = 'cardiac' | 'airway' | 'stroke' | 'anaphylaxis' | 'trauma' | 'cyber_extortion' | 'security' | 'general';
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
}

export interface EmergencyScenario {
  id: string;
  title: string;
  tagline: string;
  iconName: string;
  callerProfile: string;
  callerSpeechTranscript: string;
  simulatedAudioUrl?: string;
  callerLocation: {
    address: string;
    city: string;
    coordinates: string;
  };
  reportedVitals: {
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
