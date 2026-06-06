import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Pipe,
  PipeStatus,
  TrimRecord,
  WorkspaceState,
  PipeGroup,
  OperationRecord,
  OperationType,
  SearchFilter,
  ValidationResult,
  ProjectFile,
  GroupStats,
  PitchDetectionSession,
  Workstation,
  Craftsman,
  WarningRecord,
  WarningType,
  BatchTuningTask,
  TaskStatus,
  TaskPriority,
  RetestRecord,
  SlotConflict,
  OperationLog,
  WorkstationStats,
  CraftsmanStats,
} from '../types';
import { calculateCentsDeviation } from '../utils/centsCalculator';
import {
  generateMockPipes,
  generateMockGroups,
  generateMockWorkstations,
  generateMockCraftsmen,
  generateMockWarnings,
  generateMockBatchTasks,
  generateMockRetestRecords,
  generateMockSlotConflicts,
} from '../utils/mockData';

interface PipeStore extends WorkspaceState {
  setSelectedPipe: (id: string | null) => void;
  setSelectedGroup: (groupId: string | 'all') => void;
  addPipe: (targetFrequency: number, noteName: string, groupId?: string, slotNumber?: number) => { success: boolean; error?: string; pipeId?: string };
  removePipe: (id: string) => void;
  updatePipe: (id: string, updates: Partial<Pipe>) => { success: boolean; error?: string };
  updatePipeFrequency: (id: string, measuredFrequency: number) => void;
  updateTargetFrequency: (id: string, targetFrequency: number) => void;
  movePipe: (fromIndex: number, toIndex: number) => void;
  addTrimRecord: (pipeId: string, record: Omit<TrimRecord, 'id' | 'timestamp'>) => void;
  setAllowedDeviation: (cents: number) => void;
  updatePipeStatus: (id: string, status: PipeStatus, reason?: string) => void;
  recalculateAllDeviations: () => void;

  addGroup: (name: string, color: string, description?: string) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<PipeGroup>) => void;
  movePipeToGroup: (pipeId: string, groupId: string | undefined) => void;

  batchAddPipes: (
    pipes: Array<{ targetFrequency: number; noteName: string; slotNumber?: number }>,
    groupId?: string
  ) => { success: boolean; error?: string; addedCount: number; errors?: string[] };
  batchVerifyPipes: (pipeIds: string[]) => void;
  batchUpdateStatus: (pipeIds: string[], status: PipeStatus) => void;
  batchMoveToGroup: (pipeIds: string[], groupId: string | undefined) => void;

  validateFrequency: (freq: number, targetFreq?: number) => ValidationResult;
  validateTargetFrequency: (freq: number) => ValidationResult;

  setSearchFilter: (filter: Partial<SearchFilter>) => void;
  getFilteredPipes: () => Pipe[];
  getGroupStats: () => GroupStats[];

  setHighlightedPipes: (pipeIds: string[]) => void;
  clearHighlightedPipes: () => void;

  addOperationRecord: (
    type: OperationType,
    description: string,
    data?: { pipeId?: string; pipeIds?: string[]; beforeData?: unknown; afterData?: unknown; metadata?: Record<string, unknown> }
  ) => void;

  setTotalSlots: (slots: number) => void;
  getSlotOccupancy: () => Array<{ slot: number; pipeId: string | null; pipe?: Pipe; conflict?: boolean }>;
  isSlotOccupied: (slotNumber: number, excludePipeId?: string) => boolean;
  checkSlotConflict: (slotNumber: number, excludePipeId?: string) => Pipe | null;
  getPipesBySlot: (slotNumber: number) => Pipe[];

  reorderPipesInGroup: (groupId: string | undefined, fromIndex: number, toIndex: number) => void;

  exportProject: () => ProjectFile;
  importProject: (project: ProjectFile, mode?: 'replace' | 'merge') => void;

  setProjectName: (name: string) => void;

  addPitchDetectionSession: (session: Omit<PitchDetectionSession, 'id' | 'startTime'>) => string;
  removePitchDetectionSession: (sessionId: string) => void;
  getPitchDetectionSessionsForPipe: (pipeId: string) => PitchDetectionSession[];
  writeMeasuredFrequencyFromSession: (
    pipeId: string,
    frequency: number,
    sessionId?: string
  ) => void;

  togglePitchDetectionPanel: () => void;
  setShowPitchDetectionPanel: (show: boolean) => void;

  addWorkstation: (name: string, color: string, description?: string) => void;
  removeWorkstation: (id: string) => void;
  updateWorkstation: (id: string, updates: Partial<Workstation>) => void;
  setSelectedWorkstation: (id: string | 'all') => void;

  addCraftsman: (name: string, role?: string) => void;
  removeCraftsman: (id: string) => void;
  updateCraftsman: (id: string, updates: Partial<Craftsman>) => void;
  setSelectedCraftsman: (id: string | 'all') => void;
  setCurrentCraftsman: (id: string | null) => void;

  assignPipeToWorkstation: (pipeId: string, workstationId: string | undefined) => void;
  assignPipeToCraftsman: (pipeId: string, craftsmanId: string | undefined) => void;
  batchAssignToWorkstation: (pipeIds: string[], workstationId: string | undefined) => void;
  batchAssignToCraftsman: (pipeIds: string[], craftsmanId: string | undefined) => void;

  getWorkstationStats: () => WorkstationStats[];
  getCraftsmanStats: () => CraftsmanStats[];

  addWarning: (type: WarningType, pipeId: string, severity: 'low' | 'medium' | 'high', message: string) => void;
  resolveWarning: (warningId: string, resolvedBy?: string) => void;
  resolveWarningsForPipe: (pipeId: string, resolvedBy?: string) => void;
  refreshWarnings: () => void;
  getUnresolvedWarnings: () => WarningRecord[];

  createBatchTask: (name: string, pipeIds: string[], priority?: TaskPriority, description?: string) => string;
  updateBatchTask: (taskId: string, updates: Partial<BatchTuningTask>) => void;
  removeBatchTask: (taskId: string) => void;
  startBatchTask: (taskId: string) => void;
  completeBatchTask: (taskId: string) => void;
  assignTaskToWorkstation: (taskId: string, workstationId: string | undefined) => void;
  assignTaskToCraftsman: (taskId: string, craftsmanId: string | undefined) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  getTasksByWorkstation: (workstationId: string) => BatchTuningTask[];
  getTasksByCraftsman: (craftsmanId: string) => BatchTuningTask[];

  addRetestRecord: (record: Omit<RetestRecord, 'id' | 'timestamp'>) => void;
  getRetestRecordsForPipe: (pipeId: string) => RetestRecord[];
  startRetest: (pipeId: string) => void;
  completeRetest: (pipeId: string, passed: boolean, retestFrequency: number, notes?: string) => void;

  detectSlotConflicts: () => SlotConflict[];
  resolveSlotConflict: (conflictId: string, keepPipeId: string) => void;
  getSlotConflicts: () => SlotConflict[];

  addOperationLog: (action: string, data?: { pipeId?: string; pipeIds?: string[]; details?: Record<string, unknown> }) => void;
  getOperationLogsForPipe: (pipeId: string) => OperationLog[];

  toggleWarningPanel: () => void;
  toggleTaskPanel: () => void;
  toggleWorkstationPanel: () => void;
  toggleConflictDesk: () => void;
  setShowWarningPanel: (show: boolean) => void;
  setShowTaskPanel: (show: boolean) => void;
  setShowWorkstationPanel: (show: boolean) => void;
  setShowConflictDesk: (show: boolean) => void;

  setAutoRetestEnabled: (enabled: boolean) => void;
  setRetestThreshold: (threshold: number) => void;
}

function recalculateStatus(
  cents: number | undefined,
  currentStatus: PipeStatus,
  allowedDeviation: number
): PipeStatus {
  if (cents === undefined) return currentStatus === 'verified' ? 'needs-review' : currentStatus;

  const absCents = Math.abs(cents);

  if (currentStatus === 'tuning') {
    return absCents <= allowedDeviation ? 'verified' : 'tuning';
  } else if (currentStatus === 'verified') {
    return absCents > allowedDeviation ? 'needs-review' : 'verified';
  } else if (currentStatus === 'needs-review') {
    return absCents <= allowedDeviation ? 'verified' : 'needs-review';
  }

  return currentStatus;
}

export const usePipeStore = create<PipeStore>((set, get) => {
  const initialPipes = (() => {
    const pipes = generateMockPipes();
    const defaultDeviation = 5;
    return pipes.map((p) => {
      if (p.centsDeviation === undefined || p.measuredFrequency === undefined) {
        return p;
      }
      const absCents = Math.abs(p.centsDeviation);
      let status = p.status;
      if (absCents <= defaultDeviation) {
        status = 'verified';
      } else if (p.status === 'verified') {
        status = 'needs-review';
      }
      return { ...p, status };
    });
  })();

  const initialGroups = generateMockGroups();

  const initialWorkstations = generateMockWorkstations();
  const initialCraftsmen = generateMockCraftsmen();
  const initialWarnings = generateMockWarnings(initialPipes);
  const initialBatchTasks = generateMockBatchTasks(initialPipes);
  const initialRetestRecords = generateMockRetestRecords(initialPipes);
  const initialSlotConflicts = generateMockSlotConflicts();

  const pipesWithAssignments = initialPipes.map((pipe, index) => {
    let workstationId: string | undefined;
    let craftsmanId: string | undefined;
    let taskId: string | undefined;

    if (index < 8) {
      workstationId = 'ws-1';
      craftsmanId = 'craftsman-1';
      taskId = 'task-1';
    } else if (index < 20) {
      workstationId = 'ws-2';
      craftsmanId = 'craftsman-2';
      taskId = 'task-2';
    } else if (index < 32) {
      workstationId = 'ws-3';
      craftsmanId = 'craftsman-3';
      taskId = 'task-3';
    }

    return {
      ...pipe,
      workstationId,
      assignedCraftsmanId: craftsmanId,
      taskId,
    };
  });

  return {
    pipes: pipesWithAssignments,
    groups: initialGroups,
    selectedPipeId: null,
    selectedGroupId: 'all',
    allowedCentsDeviation: 5,
    operationHistory: [],
    searchFilter: {
      query: '',
      status: 'all',
      groupId: 'all',
      hasMeasured: 'all',
      deviationRange: 'all',
    },
    totalSlots: 61,
    highlightedPipeIds: [],
    projectName: '未命名工程',
    pitchDetectionSessions: [],
    showPitchDetectionPanel: false,
    workstations: initialWorkstations,
    craftsmen: initialCraftsmen,
    warnings: initialWarnings,
    batchTasks: initialBatchTasks,
    retestRecords: initialRetestRecords,
    slotConflicts: initialSlotConflicts,
    operationLogs: [],
    selectedWorkstationId: 'all',
    selectedCraftsmanId: 'all',
    showWarningPanel: false,
    showTaskPanel: false,
    showWorkstationPanel: false,
    showConflictDesk: false,
    currentCraftsmanId: null,
    autoRetestEnabled: true,
    retestThreshold: 2,

    setSelectedPipe: (id) => set({ selectedPipeId: id }),

    setSelectedGroup: (groupId) => set({ selectedGroupId: groupId }),

    addPipe: (targetFrequency, noteName, groupId, slotNumber) => {
      const { pipes } = get();

      if (slotNumber !== undefined && slotNumber !== null) {
        const conflictPipe = pipes.find((p) => p.slotNumber === slotNumber);
        if (conflictPipe) {
          return {
            success: false,
            error: `槽位 #${slotNumber} 已被音管 ${conflictPipe.noteName} 占用`,
          };
        }
      }

      const newPipeId = uuidv4();
      set((state) => {
        const newPipe: Pipe = {
          id: newPipeId,
          keyPosition: state.pipes.length + 1,
          noteName,
          targetFrequency,
          status: 'tuning',
          notes: '',
          trimHistory: [],
          groupId,
          slotNumber,
          retestCount: 0,
          warningCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          pipes: [...state.pipes, newPipe],
        };
      });

      return { success: true, pipeId: newPipeId };
    },

    removePipe: (id) =>
      set((state) => {
        const pipeToRemove = state.pipes.find((p) => p.id === id);
        const removedIndex = state.pipes.findIndex((p) => p.id === id);
        const filtered = state.pipes.filter((p) => p.id !== id);
        const repositioned = filtered.map((p, idx) => ({ ...p, keyPosition: idx + 1 }));

        const repositionedWithReview = repositioned.map((p, idx) => {
          if (p.status === 'verified' && removedIndex >= 0 && idx >= removedIndex) {
            return { ...p, status: 'needs-review' as PipeStatus, needsReviewReason: '位置变更需复核' };
          }
          return p;
        });

        const newRecord: OperationRecord = {
          id: uuidv4(),
          type: 'remove',
          timestamp: new Date().toISOString(),
          description: `删除音管: ${pipeToRemove?.noteName || '未知'}`,
          pipeId: id,
          beforeData: pipeToRemove,
        };

        return {
          pipes: repositionedWithReview,
          selectedPipeId: state.selectedPipeId === id ? null : state.selectedPipeId,
          operationHistory: [...state.operationHistory, newRecord],
        };
      }),

    updatePipe: (id, updates) => {
      const { pipes } = get();

      if (updates.slotNumber !== undefined && updates.slotNumber !== null) {
        const conflictPipe = pipes.find(
          (p) => p.slotNumber === updates.slotNumber && p.id !== id
        );
        if (conflictPipe) {
          return {
            success: false,
            error: `槽位 #${updates.slotNumber} 已被音管 ${conflictPipe.noteName} 占用`,
          };
        }
      }

      set((state) => ({
        pipes: state.pipes.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
      }));

      return { success: true };
    },

    updatePipeFrequency: (id, measuredFrequency) => {
      if (measuredFrequency <= 0) return;

      set((state) => {
        const beforePipe = state.pipes.find((p) => p.id === id);
        const pipes = state.pipes.map((p) => {
          if (p.id !== id) return p;
          const cents = calculateCentsDeviation(p.targetFrequency, measuredFrequency);
          const newStatus = recalculateStatus(cents, p.status, state.allowedCentsDeviation);

          return {
            ...p,
            measuredFrequency,
            centsDeviation: cents,
            status: newStatus,
            initialDeviation: p.initialDeviation ?? cents,
            verifiedAt: newStatus === 'verified' ? new Date().toISOString() : p.verifiedAt,
            updatedAt: new Date().toISOString(),
          };
        });

        const afterPipe = pipes.find((p) => p.id === id);
        const newRecord: OperationRecord = {
          id: uuidv4(),
          type: 'update',
          timestamp: new Date().toISOString(),
          description: `更新实测频率: ${afterPipe?.noteName} - ${measuredFrequency.toFixed(2)} Hz`,
          pipeId: id,
          beforeData: beforePipe,
          afterData: afterPipe,
        };

        return { pipes, operationHistory: [...state.operationHistory, newRecord] };
      });
    },

    updateTargetFrequency: (id, targetFrequency) => {
      if (targetFrequency <= 0) return;

      set((state) => {
        const beforePipe = state.pipes.find((p) => p.id === id);
        const pipes = state.pipes.map((p) => {
          if (p.id !== id) return p;
          const cents = p.measuredFrequency
            ? calculateCentsDeviation(targetFrequency, p.measuredFrequency)
            : undefined;
          const newStatus = recalculateStatus(cents, p.status, state.allowedCentsDeviation);
          const needsReviewReason =
            p.status === 'verified' && newStatus === 'needs-review' ? '目标频率变更需复核' : p.needsReviewReason;

          return {
            ...p,
            targetFrequency,
            centsDeviation: cents,
            status: newStatus,
            needsReviewReason,
            updatedAt: new Date().toISOString(),
          };
        });

        const afterPipe = pipes.find((p) => p.id === id);
        const newRecord: OperationRecord = {
          id: uuidv4(),
          type: 'update',
          timestamp: new Date().toISOString(),
          description: `更新目标频率: ${afterPipe?.noteName} - ${targetFrequency.toFixed(2)} Hz`,
          pipeId: id,
          beforeData: beforePipe,
          afterData: afterPipe,
        };

        return { pipes, operationHistory: [...state.operationHistory, newRecord] };
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
          let needsReviewReason = p.needsReviewReason;
          if (p.status === 'verified' && p.keyPosition !== newPosition) {
            status = 'needs-review';
            needsReviewReason = '位置变更需复核';
          }
          return { ...p, keyPosition: newPosition, status, needsReviewReason };
        });

        const newRecord: OperationRecord = {
          id: uuidv4(),
          type: 'move',
          timestamp: new Date().toISOString(),
          description: `移动音管: ${movedPipe.noteName} 从位置 ${fromIndex + 1} 到 ${toIndex + 1}`,
          pipeId: movedPipe.id,
          metadata: { fromIndex, toIndex },
        };

        return { pipes: repositioned, operationHistory: [...state.operationHistory, newRecord] };
      }),

    reorderPipesInGroup: (groupId, fromIndex, toIndex) =>
      set((state) => {
        const groupPipes = state.pipes
          .filter((p) =>
            groupId === undefined ? p.groupId === undefined : p.groupId === groupId
          )
          .sort((a, b) => a.keyPosition - b.keyPosition);

        if (fromIndex < 0 || fromIndex >= groupPipes.length) return {};
        if (toIndex < 0 || toIndex >= groupPipes.length) return {};
        if (fromIndex === toIndex) return {};

        const [movedPipe] = groupPipes.splice(fromIndex, 1);
        groupPipes.splice(toIndex, 0, movedPipe);

        const allPipes = [...state.pipes].sort((a, b) => a.keyPosition - b.keyPosition);
        const groupPipeIds = new Set(groupPipes.map((p) => p.id));

        let groupIdx = 0;
        const newPipes: Pipe[] = [];

        for (const pipe of allPipes) {
          if (groupPipeIds.has(pipe.id)) {
            newPipes.push(groupPipes[groupIdx]);
            groupIdx++;
          } else {
            newPipes.push(pipe);
          }
        }

        const repositioned = newPipes.map((p, idx) => {
          const newPosition = idx + 1;
          let status = p.status;
          let needsReviewReason = p.needsReviewReason;
          if (p.status === 'verified' && p.keyPosition !== newPosition) {
            status = 'needs-review';
            needsReviewReason = '位置变更需复核';
          }
          return { ...p, keyPosition: newPosition, status, needsReviewReason };
        });

        const newRecord: OperationRecord = {
          id: uuidv4(),
          type: 'move',
          timestamp: new Date().toISOString(),
          description: `分组内移动音管: ${movedPipe.noteName} 从位置 ${fromIndex + 1} 到 ${toIndex + 1}`,
          pipeId: movedPipe.id,
          metadata: { fromIndex, toIndex, groupId },
        };

        return { pipes: repositioned, operationHistory: [...state.operationHistory, newRecord] };
      }),

    addTrimRecord: (pipeId, record) =>
      set((state) => {
        const newRecord: TrimRecord = {
          ...record,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
        };

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'trim',
          timestamp: new Date().toISOString(),
          description: `记录修整: ${record.beforeFrequency.toFixed(2)} → ${record.afterFrequency.toFixed(2)} Hz`,
          pipeId,
          beforeData: { beforeFrequency: record.beforeFrequency },
          afterData: { afterFrequency: record.afterFrequency },
        };

        return {
          pipes: state.pipes.map((p) =>
            p.id === pipeId
              ? { ...p, trimHistory: [...p.trimHistory, newRecord], updatedAt: new Date().toISOString() }
              : p
          ),
          operationHistory: [...state.operationHistory, opRecord],
        };
      }),

    setAllowedDeviation: (cents) =>
      set((state) => {
        const pipes = state.pipes.map((p) => {
          if (p.centsDeviation === undefined || p.measuredFrequency === undefined) {
            return p;
          }
          const newStatus = recalculateStatus(p.centsDeviation, p.status, cents);
          const needsReviewReason =
            p.status === 'verified' && newStatus === 'needs-review'
              ? '阈值调整需复核'
              : p.needsReviewReason;

          return { ...p, status: newStatus, needsReviewReason };
        });

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'threshold-change',
          timestamp: new Date().toISOString(),
          description: `调整允许偏差: ${state.allowedCentsDeviation} → ${cents} 音分`,
          metadata: { before: state.allowedCentsDeviation, after: cents },
        };

        return {
          allowedCentsDeviation: cents,
          pipes,
          operationHistory: [...state.operationHistory, opRecord],
        };
      }),

    updatePipeStatus: (id, status, reason) =>
      set((state) => {
        const beforePipe = state.pipes.find((p) => p.id === id);
        const pipes = state.pipes.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                needsReviewReason: reason,
                verifiedAt: status === 'verified' ? new Date().toISOString() : p.verifiedAt,
                updatedAt: new Date().toISOString(),
              }
            : p
        );

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'status-change',
          timestamp: new Date().toISOString(),
          description: `状态变更: ${beforePipe?.noteName} ${beforePipe?.status} → ${status}`,
          pipeId: id,
          beforeData: { status: beforePipe?.status },
          afterData: { status },
        };

        return { pipes, operationHistory: [...state.operationHistory, opRecord] };
      }),

    recalculateAllDeviations: () =>
      set((state) => ({
        pipes: state.pipes.map((p) => {
          if (!p.measuredFrequency) return p;
          const cents = calculateCentsDeviation(p.targetFrequency, p.measuredFrequency);
          return { ...p, centsDeviation: cents };
        }),
      })),

    addGroup: (name, color, description) =>
      set((state) => {
        const newGroup: PipeGroup = {
          id: uuidv4(),
          name,
          color,
          description,
          createdAt: new Date().toISOString(),
        };
        return { groups: [...state.groups, newGroup] };
      }),

    removeGroup: (groupId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        return {
          groups: state.groups.filter((g) => g.id !== groupId),
          pipes: state.pipes.map((p) =>
            p.groupId === groupId ? { ...p, groupId: undefined } : p
          ),
          selectedGroupId: state.selectedGroupId === groupId ? 'all' : state.selectedGroupId,
        };
      }),

    updateGroup: (groupId, updates) =>
      set((state) => ({
        groups: state.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
      })),

    movePipeToGroup: (pipeId, groupId) =>
      set((state) => {
        const pipe = state.pipes.find((p) => p.id === pipeId);
        const group = state.groups.find((g) => g.id === groupId);

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'group-change',
          timestamp: new Date().toISOString(),
          description: `移动音管到分组: ${pipe?.noteName} → ${group?.name || '未分组'}`,
          pipeId,
          beforeData: { groupId: pipe?.groupId },
          afterData: { groupId },
        };

        return {
          pipes: state.pipes.map((p) =>
            p.id === pipeId ? { ...p, groupId, updatedAt: new Date().toISOString() } : p
          ),
          operationHistory: [...state.operationHistory, opRecord],
        };
      }),

    batchAddPipes: (pipesData, groupId) => {
      const { pipes: existingPipes } = get();
      const errors: string[] = [];

      const slotSet = new Set<number>();
      const validData: typeof pipesData = [];

      for (let i = 0; i < pipesData.length; i++) {
        const data = pipesData[i];

        if (data.slotNumber !== undefined && data.slotNumber !== null) {
          const conflictExisting = existingPipes.find(
            (p) => p.slotNumber === data.slotNumber
          );
          if (conflictExisting) {
            errors.push(
              `第 ${i + 1} 条：槽位 #${data.slotNumber} 已被音管 ${conflictExisting.noteName} 占用`
            );
            continue;
          }

          if (slotSet.has(data.slotNumber)) {
            errors.push(
              `第 ${i + 1} 条：槽位 #${data.slotNumber} 在批量数据中重复`
            );
            continue;
          }

          slotSet.add(data.slotNumber);
        }

        validData.push(data);
      }

      if (validData.length === 0) {
        return { success: false, error: '没有可添加的有效音管', addedCount: 0, errors };
      }

      set((state) => {
        let position = state.pipes.length;
        const newPipes: Pipe[] = validData.map((data) => {
          position++;
          return {
            id: uuidv4(),
            keyPosition: position,
            noteName: data.noteName,
            targetFrequency: data.targetFrequency,
            status: 'tuning' as PipeStatus,
            notes: '',
            trimHistory: [],
            groupId,
            slotNumber: data.slotNumber,
            retestCount: 0,
            warningCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'batch-add',
          timestamp: new Date().toISOString(),
          description: `批量添加 ${validData.length} 根音管`,
          pipeIds: newPipes.map((p) => p.id),
          metadata: { count: validData.length, groupId, errors },
        };

        return {
          pipes: [...state.pipes, ...newPipes],
          operationHistory: [...state.operationHistory, opRecord],
        };
      });

      return {
        success: true,
        addedCount: validData.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    },

    batchVerifyPipes: (pipeIds) =>
      set((state) => {
        const pipes = state.pipes.map((p) => {
          if (!pipeIds.includes(p.id)) return p;
          if (p.centsDeviation === undefined) return p;
          const absCents = Math.abs(p.centsDeviation);
          if (absCents <= state.allowedCentsDeviation) {
            return {
              ...p,
              status: 'verified' as PipeStatus,
              verifiedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });

        const verifiedCount = pipes.filter(
          (p) => pipeIds.includes(p.id) && p.status === 'verified'
        ).length;

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'batch-verify',
          timestamp: new Date().toISOString(),
          description: `批量复核 ${verifiedCount} 根音管`,
          pipeIds,
          metadata: { count: verifiedCount },
        };

        return { pipes, operationHistory: [...state.operationHistory, opRecord] };
      }),

    batchUpdateStatus: (pipeIds, status) =>
      set((state) => ({
        pipes: state.pipes.map((p) =>
          pipeIds.includes(p.id)
            ? {
                ...p,
                status,
                verifiedAt: status === 'verified' ? new Date().toISOString() : p.verifiedAt,
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      })),

    batchMoveToGroup: (pipeIds, groupId) =>
      set((state) => ({
        pipes: state.pipes.map((p) =>
          pipeIds.includes(p.id) ? { ...p, groupId, updatedAt: new Date().toISOString() } : p
        ),
      })),

    validateFrequency: (freq, targetFreq) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (isNaN(freq)) {
        errors.push('频率值无效');
      } else if (freq <= 0) {
        errors.push('频率必须大于 0 Hz');
      } else if (freq < 20) {
        warnings.push('频率低于人耳可听范围');
      } else if (freq > 20000) {
        warnings.push('频率高于人耳可听范围');
      }

      if (targetFreq && !isNaN(freq)) {
        const cents = calculateCentsDeviation(targetFreq, freq);
        if (Math.abs(cents) > 100) {
          warnings.push('偏差超过 100 音分，请确认输入是否正确');
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    },

    validateTargetFrequency: (freq) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (isNaN(freq)) {
        errors.push('目标频率值无效');
      } else if (freq <= 0) {
        errors.push('目标频率必须大于 0 Hz');
      } else if (freq < 16) {
        warnings.push('目标频率极低，请确认');
      } else if (freq > 16000) {
        warnings.push('目标频率极高，请确认');
      }

      return { valid: errors.length === 0, errors, warnings };
    },

    setSearchFilter: (filter) =>
      set((state) => ({
        searchFilter: { ...state.searchFilter, ...filter },
      })),

    getFilteredPipes: () => {
      const { pipes, searchFilter, allowedCentsDeviation } = get();
      return pipes.filter((p) => {
        if (searchFilter.query) {
          const query = searchFilter.query.toLowerCase();
          const matchesNote = p.noteName.toLowerCase().includes(query);
          const matchesFreq = p.targetFrequency.toString().includes(query);
          const matchesNotes = p.notes.toLowerCase().includes(query);
          const matchesPosition = p.keyPosition.toString().includes(query);
          if (!matchesNote && !matchesFreq && !matchesNotes && !matchesPosition) {
            return false;
          }
        }

        if (searchFilter.status !== 'all' && p.status !== searchFilter.status) {
          return false;
        }

        if (searchFilter.groupId !== 'all' && p.groupId !== searchFilter.groupId) {
          return false;
        }

        if (searchFilter.hasMeasured === 'yes' && p.measuredFrequency === undefined) {
          return false;
        }
        if (searchFilter.hasMeasured === 'no' && p.measuredFrequency !== undefined) {
          return false;
        }

        if (searchFilter.deviationRange !== 'all' && p.centsDeviation !== undefined) {
          const absCents = Math.abs(p.centsDeviation);
          if (searchFilter.deviationRange === 'in-tune' && absCents > allowedCentsDeviation) {
            return false;
          }
          if (searchFilter.deviationRange === 'out-of-tune' && absCents <= allowedCentsDeviation) {
            return false;
          }
        }

        return true;
      });
    },

    getGroupStats: () => {
      const { pipes, groups, allowedCentsDeviation } = get();
      const stats: GroupStats[] = [];

      const allGroupPipes = pipes.filter((p) => !p.groupId);
      const allDeviations = allGroupPipes
        .filter((p) => p.centsDeviation !== undefined)
        .map((p) => Math.abs(p.centsDeviation!));

      stats.push({
        groupId: 'all',
        groupName: '未分组',
        total: allGroupPipes.length,
        verified: allGroupPipes.filter((p) => p.status === 'verified').length,
        tuning: allGroupPipes.filter((p) => p.status === 'tuning').length,
        needsReview: allGroupPipes.filter((p) => p.status === 'needs-review').length,
        avgDeviation: allDeviations.length > 0 ? allDeviations.reduce((a, b) => a + b, 0) / allDeviations.length : 0,
        maxDeviation: allDeviations.length > 0 ? Math.max(...allDeviations) : 0,
      });

      for (const group of groups) {
        const groupPipes = pipes.filter((p) => p.groupId === group.id);
        const deviations = groupPipes
          .filter((p) => p.centsDeviation !== undefined)
          .map((p) => Math.abs(p.centsDeviation!));

        stats.push({
          groupId: group.id,
          groupName: group.name,
          total: groupPipes.length,
          verified: groupPipes.filter((p) => p.status === 'verified').length,
          tuning: groupPipes.filter((p) => p.status === 'tuning').length,
          needsReview: groupPipes.filter((p) => p.status === 'needs-review').length,
          avgDeviation: deviations.length > 0 ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 0,
          maxDeviation: deviations.length > 0 ? Math.max(...deviations) : 0,
        });
      }

      return stats;
    },

    setHighlightedPipes: (pipeIds) => set({ highlightedPipeIds: pipeIds }),

    clearHighlightedPipes: () => set({ highlightedPipeIds: [] }),

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

    setTotalSlots: (slots) => set({ totalSlots: slots }),

    getSlotOccupancy: () => {
      const { pipes, totalSlots } = get();
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

    isSlotOccupied: (slotNumber, excludePipeId) => {
      const { pipes } = get();
      return pipes.some((p) => p.slotNumber === slotNumber && p.id !== excludePipeId);
    },

    checkSlotConflict: (slotNumber, excludePipeId) => {
      const { pipes } = get();
      return pipes.find((p) => p.slotNumber === slotNumber && p.id !== excludePipeId) || null;
    },

    getPipesBySlot: (slotNumber) => {
      const { pipes } = get();
      return pipes.filter((p) => p.slotNumber === slotNumber);
    },

    exportProject: (): ProjectFile => {
      const { pipes, groups, operationHistory, allowedCentsDeviation, totalSlots, projectName } = get();
      return {
        version: '1.0.0',
        name: projectName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        allowedCentsDeviation,
        groups,
        pipes,
        operationHistory,
        metadata: {
          totalSlots,
        },
      };
    },

    importProject: (project, mode = 'replace') =>
      set((state) => {
        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'import',
          timestamp: new Date().toISOString(),
          description: `导入工程: ${project.name} (模式: ${mode})`,
          metadata: { projectName: project.name, mode, pipeCount: project.pipes.length },
        };

        if (mode === 'replace') {
          return {
            pipes: project.pipes,
            groups: project.groups,
            allowedCentsDeviation: project.allowedCentsDeviation,
            operationHistory: [...state.operationHistory, opRecord, ...project.operationHistory],
            totalSlots: project.metadata?.totalSlots || state.totalSlots,
            projectName: project.name,
            selectedPipeId: null,
            searchFilter: {
              query: '',
              status: 'all',
              groupId: 'all',
              hasMeasured: 'all',
              deviationRange: 'all',
            },
          };
        } else {
          const existingIds = new Set(state.pipes.map((p) => p.id));
          const newPipes = project.pipes.filter((p) => !existingIds.has(p.id));
          const existingGroupIds = new Set(state.groups.map((g) => g.id));
          const newGroups = project.groups.filter((g) => !existingGroupIds.has(g.id));

          let maxPosition = state.pipes.length;
          const mergedPipes = [
            ...state.pipes,
            ...newPipes.map((p) => ({ ...p, keyPosition: ++maxPosition })),
          ];

          return {
            pipes: mergedPipes,
            groups: [...state.groups, ...newGroups],
            operationHistory: [...state.operationHistory, opRecord],
          };
        }
      }),

    setProjectName: (name) => set({ projectName: name }),

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

    writeMeasuredFrequencyFromSession: (pipeId, frequency, sessionId) => {
      const { updatePipeFrequency, addTrimRecord, pipes } = get();
      const pipe = pipes.find((p) => p.id === pipeId);

      if (pipe && pipe.measuredFrequency) {
        addTrimRecord(pipeId, {
          beforeFrequency: pipe.measuredFrequency,
          afterFrequency: frequency,
          description: sessionId ? '录音测频自动写入' : '录音测频写入',
        });
      }

      updatePipeFrequency(pipeId, frequency);
    },

    togglePitchDetectionPanel: () =>
      set((state) => ({ showPitchDetectionPanel: !state.showPitchDetectionPanel })),

    setShowPitchDetectionPanel: (show) => set({ showPitchDetectionPanel: show }),

    addWorkstation: (name, color, description) =>
      set((state) => {
        const newWorkstation: Workstation = {
          id: uuidv4(),
          name,
          color,
          description,
          createdAt: new Date().toISOString(),
        };
        return { workstations: [...state.workstations, newWorkstation] };
      }),

    removeWorkstation: (id) =>
      set((state) => ({
        workstations: state.workstations.filter((w) => w.id !== id),
        pipes: state.pipes.map((p) =>
          p.workstationId === id ? { ...p, workstationId: undefined } : p
        ),
        selectedWorkstationId: state.selectedWorkstationId === id ? 'all' : state.selectedWorkstationId,
      })),

    updateWorkstation: (id, updates) =>
      set((state) => ({
        workstations: state.workstations.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      })),

    setSelectedWorkstation: (id) => set({ selectedWorkstationId: id }),

    addCraftsman: (name, role) =>
      set((state) => {
        const newCraftsman: Craftsman = {
          id: uuidv4(),
          name,
          role,
          createdAt: new Date().toISOString(),
        };
        return { craftsmen: [...state.craftsmen, newCraftsman] };
      }),

    removeCraftsman: (id) =>
      set((state) => ({
        craftsmen: state.craftsmen.filter((c) => c.id !== id),
        pipes: state.pipes.map((p) =>
          p.assignedCraftsmanId === id ? { ...p, assignedCraftsmanId: undefined } : p
        ),
        selectedCraftsmanId: state.selectedCraftsmanId === id ? 'all' : state.selectedCraftsmanId,
      })),

    updateCraftsman: (id, updates) =>
      set((state) => ({
        craftsmen: state.craftsmen.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),

    setSelectedCraftsman: (id) => set({ selectedCraftsmanId: id }),

    setCurrentCraftsman: (id) => set({ currentCraftsmanId: id }),

    assignPipeToWorkstation: (pipeId, workstationId) =>
      set((state) => {
        const pipe = state.pipes.find((p) => p.id === pipeId);
        const workstation = state.workstations.find((w) => w.id === workstationId);

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'update',
          timestamp: new Date().toISOString(),
          description: `分配音管到工位: ${pipe?.noteName} → ${workstation?.name || '未分配'}`,
          pipeId,
          beforeData: { workstationId: pipe?.workstationId },
          afterData: { workstationId },
        };

        return {
          pipes: state.pipes.map((p) =>
            p.id === pipeId ? { ...p, workstationId, updatedAt: new Date().toISOString() } : p
          ),
          operationHistory: [...state.operationHistory, opRecord],
        };
      }),

    assignPipeToCraftsman: (pipeId, craftsmanId) =>
      set((state) => {
        const pipe = state.pipes.find((p) => p.id === pipeId);
        const craftsman = state.craftsmen.find((c) => c.id === craftsmanId);

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'update',
          timestamp: new Date().toISOString(),
          description: `分配音管到制作师: ${pipe?.noteName} → ${craftsman?.name || '未分配'}`,
          pipeId,
          beforeData: { assignedCraftsmanId: pipe?.assignedCraftsmanId },
          afterData: { assignedCraftsmanId: craftsmanId },
        };

        return {
          pipes: state.pipes.map((p) =>
            p.id === pipeId ? { ...p, assignedCraftsmanId: craftsmanId, updatedAt: new Date().toISOString() } : p
          ),
          operationHistory: [...state.operationHistory, opRecord],
        };
      }),

    batchAssignToWorkstation: (pipeIds, workstationId) =>
      set((state) => {
        const workstation = state.workstations.find((w) => w.id === workstationId);

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'batch-verify',
          timestamp: new Date().toISOString(),
          description: `批量分配 ${pipeIds.length} 根音管到工位: ${workstation?.name || '未分配'}`,
          pipeIds,
          metadata: { workstationId, count: pipeIds.length },
        };

        return {
          pipes: state.pipes.map((p) =>
            pipeIds.includes(p.id) ? { ...p, workstationId, updatedAt: new Date().toISOString() } : p
          ),
          operationHistory: [...state.operationHistory, opRecord],
        };
      }),

    batchAssignToCraftsman: (pipeIds, craftsmanId) =>
      set((state) => {
        const craftsman = state.craftsmen.find((c) => c.id === craftsmanId);

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'batch-verify',
          timestamp: new Date().toISOString(),
          description: `批量分配 ${pipeIds.length} 根音管到制作师: ${craftsman?.name || '未分配'}`,
          pipeIds,
          metadata: { craftsmanId, count: pipeIds.length },
        };

        return {
          pipes: state.pipes.map((p) =>
            pipeIds.includes(p.id) ? { ...p, assignedCraftsmanId: craftsmanId, updatedAt: new Date().toISOString() } : p
          ),
          operationHistory: [...state.operationHistory, opRecord],
        };
      }),

    getWorkstationStats: () => {
      const { pipes, workstations, allowedCentsDeviation } = get();
      const stats: WorkstationStats[] = [];

      const unassignedPipes = pipes.filter((p) => !p.workstationId);
      const unassignedDeviations = unassignedPipes
        .filter((p) => p.centsDeviation !== undefined)
        .map((p) => Math.abs(p.centsDeviation!));

      stats.push({
        workstationId: 'unassigned',
        workstationName: '未分配',
        totalPipes: unassignedPipes.length,
        verifiedPipes: unassignedPipes.filter((p) => p.status === 'verified').length,
        tuningPipes: unassignedPipes.filter((p) => p.status === 'tuning').length,
        needsReviewPipes: unassignedPipes.filter((p) => p.status === 'needs-review').length,
        pendingRetestPipes: unassignedPipes.filter((p) => p.status === 'pending-retest').length,
        avgDeviation: unassignedDeviations.length > 0 ? unassignedDeviations.reduce((a, b) => a + b, 0) / unassignedDeviations.length : 0,
      });

      for (const ws of workstations) {
        const wsPipes = pipes.filter((p) => p.workstationId === ws.id);
        const deviations = wsPipes
          .filter((p) => p.centsDeviation !== undefined)
          .map((p) => Math.abs(p.centsDeviation!));

        stats.push({
          workstationId: ws.id,
          workstationName: ws.name,
          totalPipes: wsPipes.length,
          verifiedPipes: wsPipes.filter((p) => p.status === 'verified').length,
          tuningPipes: wsPipes.filter((p) => p.status === 'tuning').length,
          needsReviewPipes: wsPipes.filter((p) => p.status === 'needs-review').length,
          pendingRetestPipes: wsPipes.filter((p) => p.status === 'pending-retest').length,
          avgDeviation: deviations.length > 0 ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 0,
        });
      }

      return stats;
    },

    getCraftsmanStats: () => {
      const { pipes, craftsmen } = get();
      const stats: CraftsmanStats[] = [];

      for (const craftsman of craftsmen) {
        const cPipes = pipes.filter((p) => p.assignedCraftsmanId === craftsman.id);
        const completedTasks = cPipes.filter((p) => p.status === 'verified').length;
        const deviations = cPipes
          .filter((p) => p.centsDeviation !== undefined)
          .map((p) => Math.abs(p.centsDeviation!));

        stats.push({
          craftsmanId: craftsman.id,
          craftsmanName: craftsman.name,
          completedTasks,
          totalPipesTuned: cPipes.length,
          avgDeviation: deviations.length > 0 ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 0,
        });
      }

      return stats;
    },

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
          pipes: state.pipes.map((p) =>
            p.id === pipeId ? { ...p, warningCount: p.warningCount + 1 } : p
          ),
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

    resolveWarningsForPipe: (pipeId, resolvedBy) =>
      set((state) => {
        const now = new Date().toISOString();
        return {
          warnings: state.warnings.map((w) =>
            w.pipeId === pipeId && !w.resolved
              ? { ...w, resolved: true, resolvedAt: now, resolvedBy }
              : w
          ),
          pipes: state.pipes.map((p) =>
            p.id === pipeId ? { ...p, warningCount: 0 } : p
          ),
        };
      }),

    refreshWarnings: () =>
      set((state) => {
        const { allowedCentsDeviation, retestThreshold } = state;
        const newWarnings: WarningRecord[] = [];
        const now = new Date();

        state.pipes.forEach((pipe) => {
          if (pipe.centsDeviation !== undefined && Math.abs(pipe.centsDeviation) > allowedCentsDeviation) {
            const severity = Math.abs(pipe.centsDeviation) > allowedCentsDeviation * 2 ? 'high' : 'medium';
            const existing = state.warnings.find(
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
            const existing = state.warnings.find(
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
            const existing = state.warnings.find(
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

        return {
          warnings: [...state.warnings, ...newWarnings],
        };
      }),

    getUnresolvedWarnings: () => {
      const { warnings } = get();
      return warnings.filter((w) => !w.resolved);
    },

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

        const updatedPipes = state.pipes.map((p) =>
          pipeIds.includes(p.id) ? { ...p, taskId, updatedAt: new Date().toISOString() } : p
        );

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'batch-add',
          timestamp: new Date().toISOString(),
          description: `创建批量任务: ${name} (${pipeIds.length} 根音管)`,
          pipeIds,
          metadata: { taskId, taskName: name, count: pipeIds.length },
        };

        return {
          batchTasks: [...state.batchTasks, newTask],
          pipes: updatedPipes,
          operationHistory: [...state.operationHistory, opRecord],
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

    removeBatchTask: (taskId) =>
      set((state) => ({
        batchTasks: state.batchTasks.filter((t) => t.id !== taskId),
        pipes: state.pipes.map((p) =>
          p.taskId === taskId ? { ...p, taskId: undefined } : p
        ),
      })),

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

    assignTaskToWorkstation: (taskId, workstationId) =>
      set((state) => {
        const task = state.batchTasks.find((t) => t.id === taskId);
        if (!task) return {};

        return {
          batchTasks: state.batchTasks.map((t) =>
            t.id === taskId ? { ...t, assignedWorkstationId: workstationId } : t
          ),
          pipes: state.pipes.map((p) =>
            task.pipeIds.includes(p.id) ? { ...p, workstationId } : p
          ),
        };
      }),

    assignTaskToCraftsman: (taskId, craftsmanId) =>
      set((state) => {
        const task = state.batchTasks.find((t) => t.id === taskId);
        if (!task) return {};

        return {
          batchTasks: state.batchTasks.map((t) =>
            t.id === taskId ? { ...t, assignedCraftsmanId: craftsmanId } : t
          ),
          pipes: state.pipes.map((p) =>
            task.pipeIds.includes(p.id) ? { ...p, assignedCraftsmanId: craftsmanId } : p
          ),
        };
      }),

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

    startRetest: (pipeId) =>
      set((state) => ({
        pipes: state.pipes.map((p) =>
          p.id === pipeId ? { ...p, status: 'pending-retest' as PipeStatus, updatedAt: new Date().toISOString() } : p
        ),
      })),

    completeRetest: (pipeId, passed, retestFrequency, notes) =>
      set((state) => {
        const pipe = state.pipes.find((p) => p.id === pipeId);
        if (!pipe || pipe.centsDeviation === undefined) return {};

        const newCents = calculateCentsDeviation(pipe.targetFrequency, retestFrequency);
        const newStatus = passed
          ? 'verified' as PipeStatus
          : Math.abs(newCents) <= state.allowedCentsDeviation
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

        const opRecord: OperationRecord = {
          id: uuidv4(),
          type: 'update',
          timestamp: new Date().toISOString(),
          description: `复测完成: ${pipe.noteName} - ${passed ? '通过' : '未通过'}`,
          pipeId,
          beforeData: { status: pipe.status, centsDeviation: pipe.centsDeviation },
          afterData: { status: newStatus, centsDeviation: newCents },
          metadata: { retestCount: pipe.retestCount + 1 },
        };

        return {
          pipes: state.pipes.map((p) =>
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
          ),
          retestRecords: [...state.retestRecords, retestRecord],
          operationHistory: [...state.operationHistory, opRecord],
        };
      }),

    detectSlotConflicts: () => {
      const { pipes, slotConflicts } = get();
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

    resolveSlotConflict: (conflictId, keepPipeId) =>
      set((state) => {
        const conflict = state.slotConflicts.find((c) => c.id === conflictId);
        if (!conflict) return {};

        const removeSlotPipeIds = conflict.pipeIds.filter((id) => id !== keepPipeId);

        return {
          slotConflicts: state.slotConflicts.map((c) =>
            c.id === conflictId
              ? { ...c, resolved: true, resolvedAt: new Date().toISOString(), resolution: `保留音管 ${keepPipeId}` }
              : c
          ),
          pipes: state.pipes.map((p) =>
            removeSlotPipeIds.includes(p.id) ? { ...p, slotNumber: undefined } : p
          ),
        };
      }),

    getSlotConflicts: () => {
      const { slotConflicts } = get();
      return slotConflicts.filter((c) => !c.resolved);
    },

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

    toggleWarningPanel: () =>
      set((state) => ({ showWarningPanel: !state.showWarningPanel })),

    toggleTaskPanel: () =>
      set((state) => ({ showTaskPanel: !state.showTaskPanel })),

    toggleWorkstationPanel: () =>
      set((state) => ({ showWorkstationPanel: !state.showWorkstationPanel })),

    toggleConflictDesk: () =>
      set((state) => ({ showConflictDesk: !state.showConflictDesk })),

    setShowWarningPanel: (show) => set({ showWarningPanel: show }),

    setShowTaskPanel: (show) => set({ showTaskPanel: show }),

    setShowWorkstationPanel: (show) => set({ showWorkstationPanel: show }),

    setShowConflictDesk: (show) => set({ showConflictDesk: show }),

    setAutoRetestEnabled: (enabled) => set({ autoRetestEnabled: enabled }),

    setRetestThreshold: (threshold) => set({ retestThreshold: threshold }),
  };
});
