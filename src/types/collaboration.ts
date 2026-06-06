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
