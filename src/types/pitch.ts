export interface FrequencySample {
  id: string;
  timestamp: string;
  frequency: number;
  confidence: number;
  stability: number;
  centsDeviation?: number;
}

export interface PitchDetectionSession {
  id: string;
  pipeId?: string;
  startTime: string;
  endTime?: string;
  samples: FrequencySample[];
  avgFrequency?: number;
  avgConfidence?: number;
  avgStability?: number;
  finalFrequency?: number;
}

export interface TuningAdvice {
  direction: 'sharp' | 'flat' | 'in-tune';
  cents: number;
  estimatedTrimAmount?: number;
  suggestions: string[];
}
