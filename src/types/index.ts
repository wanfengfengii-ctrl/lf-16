export type PipeStatus = 'tuning' | 'verified' | 'needs-review';

export interface TrimRecord {
  id: string;
  timestamp: string;
  beforeFrequency: number;
  afterFrequency: number;
  description: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceState {
  pipes: Pipe[];
  selectedPipeId: string | null;
  allowedCentsDeviation: number;
}
