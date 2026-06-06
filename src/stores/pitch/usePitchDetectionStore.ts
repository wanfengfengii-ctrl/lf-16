import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { PitchDetectionSession, Pipe, TrimRecord } from '../../types';
import { calculateCentsDeviation } from '../../utils/centsCalculator';

interface PitchDetectionStoreState {
  pitchDetectionSessions: PitchDetectionSession[];
  showPitchDetectionPanel: boolean;
}

interface PitchDetectionStoreActions {
  addPitchDetectionSession: (session: Omit<PitchDetectionSession, 'id' | 'startTime'>) => string;
  removePitchDetectionSession: (sessionId: string) => void;
  getPitchDetectionSessionsForPipe: (pipeId: string) => PitchDetectionSession[];
  writeMeasuredFrequencyFromSession: (
    pipeId: string,
    frequency: number,
    pipes: Pipe[],
    sessionId?: string
  ) => { pipes: Pipe[]; trimRecords: TrimRecord[] };

  togglePitchDetectionPanel: () => void;
  setShowPitchDetectionPanel: (show: boolean) => void;
}

export type PitchDetectionStore = PitchDetectionStoreState & PitchDetectionStoreActions;

export const usePitchDetectionStore = create<PitchDetectionStore>((set, get) => ({
  pitchDetectionSessions: [],
  showPitchDetectionPanel: false,

  addPitchDetectionSession: (sessionData) => {
    const sessionId = uuidv4();
    const newSession: PitchDetectionSession = {
      ...sessionData,
      id: sessionId,
      startTime: new Date().toISOString(),
    };
    set((state) => ({
      pitchDetectionSessions: [...state.pitchDetectionSessions, newSession],
    }));
    return sessionId;
  },

  removePitchDetectionSession: (sessionId) =>
    set((state) => ({
      pitchDetectionSessions: state.pitchDetectionSessions.filter((s) => s.id !== sessionId),
    })),

  getPitchDetectionSessionsForPipe: (pipeId) => {
    const { pitchDetectionSessions } = get();
    return pitchDetectionSessions.filter((s) => s.pipeId === pipeId);
  },

  writeMeasuredFrequencyFromSession: (pipeId, frequency, pipes, sessionId) => {
    const pipe = pipes.find((p) => p.id === pipeId);
    const trimRecords: TrimRecord[] = [];

    const updatedPipes = pipes.map((p) => {
      if (p.id !== pipeId) return p;

      const cents = calculateCentsDeviation(p.targetFrequency, frequency);

      if (pipe && pipe.measuredFrequency) {
        trimRecords.push({
          id: uuidv4(),
          beforeFrequency: pipe.measuredFrequency,
          afterFrequency: frequency,
          description: sessionId ? '录音测频自动写入' : '录音测频写入',
          timestamp: new Date().toISOString(),
        });
      }

      return {
        ...p,
        measuredFrequency: frequency,
        centsDeviation: cents,
        initialDeviation: p.initialDeviation ?? cents,
        updatedAt: new Date().toISOString(),
        trimHistory: pipe && pipe.measuredFrequency
          ? [...p.trimHistory, {
              id: uuidv4(),
              beforeFrequency: pipe.measuredFrequency,
              afterFrequency: frequency,
              description: sessionId ? '录音测频自动写入' : '录音测频写入',
              timestamp: new Date().toISOString(),
            }]
          : p.trimHistory,
      };
    });

    return { pipes: updatedPipes, trimRecords };
  },

  togglePitchDetectionPanel: () =>
    set((state) => ({ showPitchDetectionPanel: !state.showPitchDetectionPanel })),

  setShowPitchDetectionPanel: (show) => set({ showPitchDetectionPanel: show }),
}));
