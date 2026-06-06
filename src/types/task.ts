export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

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
