export type PipeStatus = 'tuning' | 'verified' | 'needs-review' | 'pending-retest';

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
  workstationId?: string;
  assignedCraftsmanId?: string;
  taskId?: string;
  retestCount: number;
  lastRetestAt?: string;
  warningCount: number;
  createdAt: string;
  updatedAt: string;
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

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
