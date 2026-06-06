export type PipeStatus = 'tuning' | 'verified' | 'needs-review';

export type OperationType =
  | 'add'
  | 'remove'
  | 'update'
  | 'move'
  | 'trim'
  | 'status-change'
  | 'batch-add'
  | 'batch-verify'
  | 'import'
  | 'threshold-change'
  | 'group-change';

export interface TrimRecord {
  id: string;
  timestamp: string;
  beforeFrequency: number;
  afterFrequency: number;
  description: string;
}

export interface PipeGroup {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface Pipe {
  id: string;
  keyPosition: number;
  noteName: string;
  targetFrequency: number;
  measuredFrequency?: number;
  centsDeviation?: number;
  status: PipeStatus;
  notes: string;
  trimHistory: TrimRecord[];
  initialDeviation?: number;
  groupId?: string;
  slotNumber?: number;
  verifiedAt?: string;
  needsReviewReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationRecord {
  id: string;
  type: OperationType;
  timestamp: string;
  description: string;
  pipeId?: string;
  pipeIds?: string[];
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SearchFilter {
  query: string;
  status: PipeStatus | 'all';
  groupId: string | 'all';
  hasMeasured: 'all' | 'yes' | 'no';
  deviationRange: 'all' | 'in-tune' | 'out-of-tune';
}

export interface GroupStats {
  groupId: string;
  groupName: string;
  total: number;
  verified: number;
  tuning: number;
  needsReview: number;
  avgDeviation: number;
  maxDeviation: number;
}

export interface ProjectFile {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  allowedCentsDeviation: number;
  groups: PipeGroup[];
  pipes: Pipe[];
  operationHistory: OperationRecord[];
  metadata?: {
    totalSlots?: number;
    description?: string;
  };
}

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

export interface WorkspaceState {
  pipes: Pipe[];
  groups: PipeGroup[];
  selectedPipeId: string | null;
  selectedGroupId: string | 'all';
  allowedCentsDeviation: number;
  operationHistory: OperationRecord[];
  searchFilter: SearchFilter;
  totalSlots: number;
  highlightedPipeIds: string[];
  projectName: string;
  pitchDetectionSessions: PitchDetectionSession[];
  showPitchDetectionPanel: boolean;
}
