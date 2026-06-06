import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { WarningRecord, WarningType, Pipe } from '../../types';
import { generateMockWarnings } from '../../utils/mockData';

interface WarningStoreState {
  warnings: WarningRecord[];
}

interface WarningStoreActions {
  addWarning: (type: WarningType, pipeId: string, severity: 'low' | 'medium' | 'high', message: string) => void;
  resolveWarning: (warningId: string, resolvedBy?: string) => void;
  resolveWarningsForPipe: (pipeId: string, pipes: Pipe[], resolvedBy?: string) => { warnings: WarningRecord[]; pipes: Pipe[] };
  refreshWarnings: (pipes: Pipe[], allowedCentsDeviation: number, retestThreshold: number) => WarningRecord[];
  getUnresolvedWarnings: () => WarningRecord[];
}

export type WarningStore = WarningStoreState & WarningStoreActions;

export const useWarningStore = create<WarningStore>((set, get) => ({
  warnings: generateMockWarnings([]),

  addWarning: (type, pipeId, severity, message) =>
    set((state) => {
      const newWarning: WarningRecord = {
        id: uuidv4(),
        type,
        pipeId,
        severity,
        message,
        timestamp: new Date().toISOString(),
        resolved: false,
      };

      return {
        warnings: [...state.warnings, newWarning],
      };
    }),

  resolveWarning: (warningId, resolvedBy) =>
    set((state) => ({
      warnings: state.warnings.map((w) =>
        w.id === warningId
          ? { ...w, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy }
          : w
      ),
    })),

  resolveWarningsForPipe: (pipeId, pipes, resolvedBy) => {
    const now = new Date().toISOString();
    const updatedWarnings = get().warnings.map((w) =>
      w.pipeId === pipeId && !w.resolved
        ? { ...w, resolved: true, resolvedAt: now, resolvedBy }
        : w
    );
    const updatedPipes = pipes.map((p) =>
      p.id === pipeId ? { ...p, warningCount: 0 } : p
    );

    set({ warnings: updatedWarnings });

    return { warnings: updatedWarnings, pipes: updatedPipes };
  },

  refreshWarnings: (pipes, allowedCentsDeviation, retestThreshold) => {
    const { warnings: currentWarnings } = get();
    const newWarnings: WarningRecord[] = [];
    const now = new Date();

    pipes.forEach((pipe) => {
      if (pipe.centsDeviation !== undefined && Math.abs(pipe.centsDeviation) > allowedCentsDeviation) {
        const severity = Math.abs(pipe.centsDeviation) > allowedCentsDeviation * 2 ? 'high' : 'medium';
        const existing = currentWarnings.find(
          (w) => w.pipeId === pipe.id && w.type === 'excessive-deviation' && !w.resolved
        );
        if (!existing) {
          newWarnings.push({
            id: uuidv4(),
            type: 'excessive-deviation',
            pipeId: pipe.id,
            severity,
            message: `音管 ${pipe.noteName} 偏差超过允许范围`,
            timestamp: now.toISOString(),
            resolved: false,
          });
        }
      }

      if (!pipe.measuredFrequency) {
        const existing = currentWarnings.find(
          (w) => w.pipeId === pipe.id && w.type === 'no-measured-frequency' && !w.resolved
        );
        if (!existing) {
          newWarnings.push({
            id: uuidv4(),
            type: 'no-measured-frequency',
            pipeId: pipe.id,
            severity: 'low',
            message: `音管 ${pipe.noteName} 尚未录入实测频率`,
            timestamp: now.toISOString(),
            resolved: false,
          });
        }
      }

      if (pipe.retestCount >= retestThreshold && pipe.status !== 'verified') {
        const existing = currentWarnings.find(
          (w) => w.pipeId === pipe.id && w.type === 'retest-failed' && !w.resolved
        );
        if (!existing) {
          newWarnings.push({
            id: uuidv4(),
            type: 'retest-failed',
            pipeId: pipe.id,
            severity: 'high',
            message: `音管 ${pipe.noteName} 复测次数过多，需重点关注`,
            timestamp: now.toISOString(),
            resolved: false,
          });
        }
      }
    });

    if (newWarnings.length > 0) {
      set((state) => ({
        warnings: [...state.warnings, ...newWarnings],
      }));
    }

    return newWarnings;
  },

  getUnresolvedWarnings: () => {
    const { warnings } = get();
    return warnings.filter((w) => !w.resolved);
  },
}));
