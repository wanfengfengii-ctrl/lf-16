import { create } from 'zustand';
import type { OperationRecord, OperationLog, OperationType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface HistoryStoreState {
  operationHistory: OperationRecord[];
  operationLogs: OperationLog[];
}

interface HistoryStoreActions {
  addOperationRecord: (
    type: OperationType,
    description: string,
    data?: { pipeId?: string; pipeIds?: string[]; beforeData?: unknown; afterData?: unknown; metadata?: Record<string, unknown> }
  ) => void;

  addOperationLog: (action: string, data?: { pipeId?: string; pipeIds?: string[]; details?: Record<string, unknown> }) => void;
  getOperationLogsForPipe: (pipeId: string) => OperationLog[];
}

export type HistoryStore = HistoryStoreState & HistoryStoreActions;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  operationHistory: [],
  operationLogs: [],

  addOperationRecord: (type, description, data) =>
    set((state) => {
      const record: OperationRecord = {
        id: uuidv4(),
        type,
        timestamp: new Date().toISOString(),
        description,
        ...data,
      };
      return { operationHistory: [...state.operationHistory, record] };
    }),

  addOperationLog: (action, data) =>
    set((state) => {
      const log: OperationLog = {
        id: uuidv4(),
        action,
        timestamp: new Date().toISOString(),
        ...data,
      };
      return { operationLogs: [...state.operationLogs, log] };
    }),

  getOperationLogsForPipe: (pipeId) => {
    const { operationLogs } = get();
    return operationLogs.filter((log) => log.pipeId === pipeId || (log.pipeIds && log.pipeIds.includes(pipeId)));
  },
}));
