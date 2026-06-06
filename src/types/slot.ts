export interface SlotConflict {
  id: string;
  slotNumber: number;
  pipeIds: string[];
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
}

export interface SlotOccupancyItem {
  slot: number;
  pipeId: string | null;
  pipe?: any;
  conflict?: boolean;
}
