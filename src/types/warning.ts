export type WarningType =
  | 'slot-conflict'
  | 'excessive-deviation'
  | 'no-measured-frequency'
  | 'long-pending'
  | 'retest-failed'
  | 'unassigned-workstation';

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
