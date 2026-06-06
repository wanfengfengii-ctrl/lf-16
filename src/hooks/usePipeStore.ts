import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Pipe, PipeStatus, TrimRecord, WorkspaceState } from '../types';
import { calculateCentsDeviation } from '../utils/centsCalculator';
import { generateMockPipes } from '../utils/mockData';

interface PipeStore extends WorkspaceState {
  setSelectedPipe: (id: string | null) => void;
  addPipe: (targetFrequency: number, noteName: string) => void;
  removePipe: (id: string) => void;
  updatePipe: (id: string, updates: Partial<Pipe>) => void;
  updatePipeFrequency: (id: string, measuredFrequency: number) => void;
  updateTargetFrequency: (id: string, targetFrequency: number) => void;
  movePipe: (fromIndex: number, toIndex: number) => void;
  addTrimRecord: (pipeId: string, record: Omit<TrimRecord, 'id' | 'timestamp'>) => void;
  setAllowedDeviation: (cents: number) => void;
  updatePipeStatus: (id: string, status: PipeStatus) => void;
  recalculateAllDeviations: () => void;
}

export const usePipeStore = create<PipeStore>((set, get) => ({
  pipes: generateMockPipes(),
  selectedPipeId: null,
  allowedCentsDeviation: 5,

  setSelectedPipe: (id) => set({ selectedPipeId: id }),

  addPipe: (targetFrequency, noteName) =>
    set((state) => {
      const newPipe: Pipe = {
        id: uuidv4(),
        keyPosition: state.pipes.length + 1,
        noteName,
        targetFrequency,
        status: 'tuning',
        notes: '',
        trimHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        pipes: [...state.pipes, newPipe],
      };
    }),

  removePipe: (id) =>
    set((state) => {
      const filtered = state.pipes.filter((p) => p.id !== id);
      const repositioned = filtered.map((p, idx) => ({ ...p, keyPosition: idx + 1 }));
      return {
        pipes: repositioned,
        selectedPipeId: state.selectedPipeId === id ? null : state.selectedPipeId,
      };
    }),

  updatePipe: (id, updates) =>
    set((state) => ({
      pipes: state.pipes.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    })),

  updatePipeFrequency: (id, measuredFrequency) => {
    if (measuredFrequency <= 0) return;

    set((state) => {
      const pipes = state.pipes.map((p) => {
        if (p.id !== id) return p;
        const cents = calculateCentsDeviation(p.targetFrequency, measuredFrequency);
        const absCents = Math.abs(cents);
        let status: PipeStatus = p.status;

        if (p.status === 'tuning') {
          status = absCents <= state.allowedCentsDeviation ? 'verified' : 'tuning';
        }

        return {
          ...p,
          measuredFrequency,
          centsDeviation: cents,
          status,
          initialDeviation: p.initialDeviation ?? cents,
          updatedAt: new Date().toISOString(),
        };
      });
      return { pipes };
    });
  },

  updateTargetFrequency: (id, targetFrequency) => {
    if (targetFrequency <= 0) return;

    set((state) => {
      const pipes = state.pipes.map((p) => {
        if (p.id !== id) return p;
        const cents = p.measuredFrequency
          ? calculateCentsDeviation(targetFrequency, p.measuredFrequency)
          : undefined;
        return {
          ...p,
          targetFrequency,
          centsDeviation: cents,
          updatedAt: new Date().toISOString(),
        };
      });
      return { pipes };
    });
  },

  movePipe: (fromIndex, toIndex) =>
    set((state) => {
      const pipes = [...state.pipes];
      const [movedPipe] = pipes.splice(fromIndex, 1);
      pipes.splice(toIndex, 0, movedPipe);

      const repositioned = pipes.map((p, idx) => {
        const newPosition = idx + 1;
        let status = p.status;
        if (p.status === 'verified' && p.keyPosition !== newPosition) {
          status = 'needs-review';
        }
        return { ...p, keyPosition: newPosition, status };
      });

      return { pipes: repositioned };
    }),

  addTrimRecord: (pipeId, record) =>
    set((state) => {
      const newRecord: TrimRecord = {
        ...record,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
      };
      return {
        pipes: state.pipes.map((p) =>
          p.id === pipeId
            ? { ...p, trimHistory: [...p.trimHistory, newRecord], updatedAt: new Date().toISOString() }
            : p
        ),
      };
    }),

  setAllowedDeviation: (cents) => set({ allowedCentsDeviation: cents }),

  updatePipeStatus: (id, status) =>
    set((state) => ({
      pipes: state.pipes.map((p) =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
      ),
    })),

  recalculateAllDeviations: () =>
    set((state) => ({
      pipes: state.pipes.map((p) => {
        if (!p.measuredFrequency) return p;
        const cents = calculateCentsDeviation(p.targetFrequency, p.measuredFrequency);
        return { ...p, centsDeviation: cents };
      }),
    })),
}));
