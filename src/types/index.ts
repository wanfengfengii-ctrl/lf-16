export type PipeStatus = 'tuning' | 'verified' | 'needs-review' | 'pending-retest';

export type WarningType =
  | 'slot-conflict'
  | 'excessive-deviation'
  | 'no-measured-frequency'
  | 'long-pending'
  | 'retest-failed'
  | 'unassigned-workstation';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Workstation {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export interface Craftsman {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  createdAt: string;
}

export interface WarningRecord {
  id: string;
  type: WarningType;
  pipeId: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

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
  workstationId?: string;
  assignedCraftsmanId?: string;
  taskId?: string;
  retestCount: number;
  lastRetestAt?: string;
  warningCount: number;
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
  workstations?: Workstation[];
  craftsmen?: Craftsman[];
  warnings?: WarningRecord[];
  batchTasks?: BatchTuningTask[];
  retestRecords?: RetestRecord[];
  slotConflicts?: SlotConflict[];
  metadata?: {
    totalSlots?: number;
    description?: string;
    autoRetestEnabled?: boolean;
    retestThreshold?: number;
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

export interface BatchTuningTask {
  id: string;
  name: string;
  description?: string;
  pipeIds: string[];
  status: TaskStatus;
  priority: TaskPriority;
  assignedWorkstationId?: string;
  assignedCraftsmanId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy?: string;
  progress: number;
}

export interface RetestRecord {
  id: string;
  pipeId: string;
  originalFrequency: number;
  retestFrequency: number;
  originalCentsDeviation: number;
  retestCentsDeviation: number;
  timestamp: string;
  operator?: string;
  sessionId?: string;
  passed: boolean;
  notes?: string;
}

export interface SlotConflict {
  id: string;
  slotNumber: number;
  pipeIds: string[];
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
}

export interface OperationLog {
  id: string;
  pipeId?: string;
  pipeIds?: string[];
  action: string;
  operator?: string;
  workstationId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface WorkstationStats {
  workstationId: string;
  workstationName: string;
  totalPipes: number;
  verifiedPipes: number;
  tuningPipes: number;
  needsReviewPipes: number;
  pendingRetestPipes: number;
  avgDeviation: number;
}

export interface CraftsmanStats {
  craftsmanId: string;
  craftsmanName: string;
  completedTasks: number;
  totalPipesTuned: number;
  avgDeviation: number;
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
  workstations: Workstation[];
  craftsmen: Craftsman[];
  warnings: WarningRecord[];
  batchTasks: BatchTuningTask[];
  retestRecords: RetestRecord[];
  slotConflicts: SlotConflict[];
  operationLogs: OperationLog[];
  selectedWorkstationId: string | 'all';
  selectedCraftsmanId: string | 'all';
  showWarningPanel: boolean;
  showTaskPanel: boolean;
  showWorkstationPanel: boolean;
  showConflictDesk: boolean;
  currentCraftsmanId: string | null;
  autoRetestEnabled: boolean;
  retestThreshold: number;
}
