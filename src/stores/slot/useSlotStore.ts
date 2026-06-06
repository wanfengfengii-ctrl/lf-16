import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Pipe, SlotConflict } from '../../types';
import { generateMockSlotConflicts } from '../../utils/mockData';

interface SlotStoreState {
  totalSlots: number;
  slotConflicts: SlotConflict[];
}

interface SlotStoreActions {
  setTotalSlots: (slots: number) => void;
  getSlotOccupancy: (pipes: Pipe[]) => Array<{ slot: number; pipeId: string | null; pipe?: Pipe; conflict?: boolean }>;
  isSlotOccupied: (slotNumber: number, pipes: Pipe[], excludePipeId?: string) => boolean;
  checkSlotConflict: (slotNumber: number, pipes: Pipe[], excludePipeId?: string) => Pipe | null;
  getPipesBySlot: (slotNumber: number, pipes: Pipe[]) => Pipe[];
  detectSlotConflicts: (pipes: Pipe[]) => SlotConflict[];
  resolveSlotConflict: (conflictId: string, keepPipeId: string, pipes: Pipe[]) => { conflicts: SlotConflict[]; pipes: Pipe[] };
  getSlotConflicts: () => SlotConflict[];
}

export type SlotStore = SlotStoreState & SlotStoreActions;

export const useSlotStore = create<SlotStore>((set, get) => ({
  totalSlots: 61,
  slotConflicts: generateMockSlotConflicts(),

  setTotalSlots: (slots) => set({ totalSlots: slots }),

  getSlotOccupancy: (pipes) => {
    const { totalSlots } = get();
    const occupancy: Array<{ slot: number; pipeId: string | null; pipe?: Pipe; conflict?: boolean }> = [];

    for (let i = 1; i <= totalSlots; i++) {
      const pipesInSlot = pipes.filter((p) => p.slotNumber === i);
      const hasConflict = pipesInSlot.length > 1;
      occupancy.push({
        slot: i,
        pipeId: pipesInSlot.length > 0 ? pipesInSlot[0].id : null,
        pipe: pipesInSlot.length > 0 ? pipesInSlot[0] : undefined,
        conflict: hasConflict,
      });
    }

    return occupancy;
  },

  isSlotOccupied: (slotNumber, pipes, excludePipeId) => {
    return pipes.some((p) => p.slotNumber === slotNumber && p.id !== excludePipeId);
  },

  checkSlotConflict: (slotNumber, pipes, excludePipeId) => {
    return pipes.find((p) => p.slotNumber === slotNumber && p.id !== excludePipeId) || null;
  },

  getPipesBySlot: (slotNumber, pipes) => {
    return pipes.filter((p) => p.slotNumber === slotNumber);
  },

  detectSlotConflicts: (pipes) => {
    const { slotConflicts } = get();
    const conflicts: SlotConflict[] = [];
    const slotMap = new Map<number, string[]>();

    pipes.forEach((pipe) => {
      if (pipe.slotNumber !== undefined) {
        const existing = slotMap.get(pipe.slotNumber) || [];
        existing.push(pipe.id);
        slotMap.set(pipe.slotNumber, existing);
      }
    });

    slotMap.forEach((pipeIds, slotNumber) => {
      if (pipeIds.length > 1) {
        const existingConflict = slotConflicts.find(
          (c) => c.slotNumber === slotNumber && !c.resolved
        );
        if (!existingConflict) {
          conflicts.push({
            id: uuidv4(),
            slotNumber,
            pipeIds,
            detectedAt: new Date().toISOString(),
            resolved: false,
          });
        }
      }
    });

    if (conflicts.length > 0) {
      set((state) => ({
        slotConflicts: [...state.slotConflicts, ...conflicts],
      }));
    }

    return conflicts;
  },

  resolveSlotConflict: (conflictId, keepPipeId, pipes) => {
    const conflict = get().slotConflicts.find((c) => c.id === conflictId);
    if (!conflict) return { conflicts: get().slotConflicts, pipes };

    const removeSlotPipeIds = conflict.pipeIds.filter((id) => id !== keepPipeId);

    const updatedConflicts = get().slotConflicts.map((c) =>
      c.id === conflictId
        ? { ...c, resolved: true, resolvedAt: new Date().toISOString(), resolution: `保留音管 ${keepPipeId}` }
        : c
    );

    const updatedPipes = pipes.map((p) =>
      removeSlotPipeIds.includes(p.id) ? { ...p, slotNumber: undefined } : p
    );

    set({ slotConflicts: updatedConflicts });

    return { conflicts: updatedConflicts, pipes: updatedPipes };
  },

  getSlotConflicts: () => {
    const { slotConflicts } = get();
    return slotConflicts.filter((c) => !c.resolved);
  },
}));
