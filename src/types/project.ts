import type { Pipe, PipeGroup, TrimRecord } from './pipe';
import type { Workstation, Craftsman } from './collaboration';
import type { WarningRecord } from './warning';
import type { BatchTuningTask, RetestRecord } from './task';
import type { SlotConflict } from './slot';

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
