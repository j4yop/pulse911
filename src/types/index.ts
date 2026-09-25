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

export interface DispatchedUnit {
  id: string;
  name: string;
  type: string;
  station: string;
  etaMinutes: number;
  status: 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE';
  crew: string;
}
