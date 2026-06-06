import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  BatchTuningTask,
  TaskStatus,
  TaskPriority,
  RetestRecord,
  Pipe,
  PipeStatus,
} from '../../types';
import { calculateCentsDeviation } from '../../utils/centsCalculator';
import { generateMockBatchTasks, generateMockRetestRecords } from '../../utils/mockData';

interface TaskStoreState {
  batchTasks: BatchTuningTask[];
  retestRecords: RetestRecord[];
  autoRetestEnabled: boolean;
  retestThreshold: number;
}

interface TaskStoreActions {
  createBatchTask: (name: string, pipeIds: string[], priority?: TaskPriority, description?: string) => string;
  updateBatchTask: (taskId: string, updates: Partial<BatchTuningTask>) => void;
  removeBatchTask: (taskId: string) => { tasks: BatchTuningTask[]; pipes: Pipe[] };
  startBatchTask: (taskId: string) => void;
  completeBatchTask: (taskId: string) => void;
  assignTaskToWorkstation: (taskId: string, workstationId: string | undefined, pipes: Pipe[]) => { tasks: BatchTuningTask[]; pipes: Pipe[] };
  assignTaskToCraftsman: (taskId: string, craftsmanId: string | undefined, pipes: Pipe[]) => { tasks: BatchTuningTask[]; pipes: Pipe[] };
  updateTaskProgress: (taskId: string, progress: number) => void;
  getTasksByWorkstation: (workstationId: string) => BatchTuningTask[];
  getTasksByCraftsman: (craftsmanId: string) => BatchTuningTask[];

  addRetestRecord: (record: Omit<RetestRecord, 'id' | 'timestamp'>) => void;
  getRetestRecordsForPipe: (pipeId: string) => RetestRecord[];
  startRetest: (pipeId: string, pipes: Pipe[]) => Pipe[];
  completeRetest: (
    pipeId: string,
    passed: boolean,
    retestFrequency: number,
    allowedDeviation: number,
    pipes: Pipe[],
    notes?: string
  ) => { pipes: Pipe[]; retestRecords: RetestRecord[] };
}

export type TaskStore = TaskStoreState & TaskStoreActions;

export const useTaskStore = create<TaskStore>((set, get) => ({
  batchTasks: generateMockBatchTasks([]),
  retestRecords: generateMockRetestRecords([]),
  autoRetestEnabled: true,
  retestThreshold: 2,

  createBatchTask: (name, pipeIds, priority = 'medium', description) => {
    const taskId = uuidv4();
    set((state) => {
      const newTask: BatchTuningTask = {
        id: taskId,
        name,
        description,
        pipeIds,
        status: 'pending',
        priority,
        createdAt: new Date().toISOString(),
        progress: 0,
      };

      return {
        batchTasks: [...state.batchTasks, newTask],
      };
    });
    return taskId;
  },

  updateBatchTask: (taskId, updates) =>
    set((state) => ({
      batchTasks: state.batchTasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),

  removeBatchTask: (taskId) => {
    const tasks = get().batchTasks.filter((t) => t.id !== taskId);
    const task = get().batchTasks.find((t) => t.id === taskId);
    set({ batchTasks: tasks });
    return {
      tasks,
      pipes: [] as Pipe[],
    };
  },

  startBatchTask: (taskId) =>
    set((state) => ({
      batchTasks: state.batchTasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'in-progress' as TaskStatus, startedAt: new Date().toISOString() }
          : t
      ),
    })),

  completeBatchTask: (taskId) =>
    set((state) => ({
      batchTasks: state.batchTasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed' as TaskStatus, completedAt: new Date().toISOString(), progress: 100 }
          : t
      ),
    })),

  assignTaskToWorkstation: (taskId, workstationId, pipes) => {
    const task = get().batchTasks.find((t) => t.id === taskId);
    if (!task) return { tasks: get().batchTasks, pipes };

    const updatedTasks = get().batchTasks.map((t) =>
      t.id === taskId ? { ...t, assignedWorkstationId: workstationId } : t
    );
    const updatedPipes = pipes.map((p) =>
      task.pipeIds.includes(p.id) ? { ...p, workstationId } : p
    );

    set({ batchTasks: updatedTasks });

    return { tasks: updatedTasks, pipes: updatedPipes };
  },

  assignTaskToCraftsman: (taskId, craftsmanId, pipes) => {
    const task = get().batchTasks.find((t) => t.id === taskId);
    if (!task) return { tasks: get().batchTasks, pipes };

    const updatedTasks = get().batchTasks.map((t) =>
      t.id === taskId ? { ...t, assignedCraftsmanId: craftsmanId } : t
    );
    const updatedPipes = pipes.map((p) =>
      task.pipeIds.includes(p.id) ? { ...p, assignedCraftsmanId: craftsmanId } : p
    );

    set({ batchTasks: updatedTasks });

    return { tasks: updatedTasks, pipes: updatedPipes };
  },

  updateTaskProgress: (taskId, progress) =>
    set((state) => ({
      batchTasks: state.batchTasks.map((t) =>
        t.id === taskId ? { ...t, progress: Math.min(100, Math.max(0, progress)) } : t
      ),
    })),

  getTasksByWorkstation: (workstationId) => {
    const { batchTasks } = get();
    return batchTasks.filter((t) => t.assignedWorkstationId === workstationId);
  },

  getTasksByCraftsman: (craftsmanId) => {
    const { batchTasks } = get();
    return batchTasks.filter((t) => t.assignedCraftsmanId === craftsmanId);
  },

  addRetestRecord: (record) =>
    set((state) => {
      const newRecord: RetestRecord = {
        ...record,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
      };
      return { retestRecords: [...state.retestRecords, newRecord] };
    }),

  getRetestRecordsForPipe: (pipeId) => {
    const { retestRecords } = get();
    return retestRecords.filter((r) => r.pipeId === pipeId);
  },

  startRetest: (pipeId, pipes) => {
    return pipes.map((p) =>
      p.id === pipeId ? { ...p, status: 'pending-retest' as PipeStatus, updatedAt: new Date().toISOString() } : p
    );
  },

  completeRetest: (pipeId, passed, retestFrequency, allowedDeviation, pipes, notes) => {
    const pipe = pipes.find((p) => p.id === pipeId);
    if (!pipe || pipe.centsDeviation === undefined) return { pipes, retestRecords: get().retestRecords };

    const newCents = calculateCentsDeviation(pipe.targetFrequency, retestFrequency);
    const newStatus = passed
      ? 'verified' as PipeStatus
      : Math.abs(newCents) <= allowedDeviation
      ? 'verified' as PipeStatus
      : 'tuning' as PipeStatus;

    const retestRecord: RetestRecord = {
      id: uuidv4(),
      pipeId,
      originalFrequency: pipe.measuredFrequency ?? pipe.targetFrequency,
      retestFrequency,
      originalCentsDeviation: pipe.centsDeviation,
      retestCentsDeviation: newCents,
      timestamp: new Date().toISOString(),
      passed,
      notes,
    };

    const updatedPipes = pipes.map((p) =>
      p.id === pipeId
        ? {
            ...p,
            measuredFrequency: retestFrequency,
            centsDeviation: newCents,
            status: newStatus,
            retestCount: p.retestCount + 1,
            lastRetestAt: new Date().toISOString(),
            verifiedAt: newStatus === 'verified' ? new Date().toISOString() : p.verifiedAt,
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    const updatedRecords = [...get().retestRecords, retestRecord];

    set({ retestRecords: updatedRecords });

    return { pipes: updatedPipes, retestRecords: updatedRecords };
  },
}));
