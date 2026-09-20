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

export interface MossQueryResult {
  protocol: EmergencyProtocol;
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
