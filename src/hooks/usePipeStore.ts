import { useMemo } from 'react';
import type {
  Pipe,
  PipeStatus,
  TrimRecord,
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
import {
  usePipeStore as usePipeDomainStore,
  useSlotStore,
  useTaskStore,
  useWarningStore,
  usePitchDetectionStore,
  useCollaborationStore,
  useHistoryStore,
  useUiStore,
  recalculateStatus,
} from '../stores';
import { exportProject, importProject } from '../stores/project/projectUtils';
import { initializeMockData } from '../stores/init';

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  const data = initializeMockData();

  const pipeStore = usePipeDomainStore.getState();
  (pipeStore as any).pipes = data.pipes;
  (pipeStore as any).groups = data.groups;

  const slotStore = useSlotStore.getState();
  (slotStore as any).slotConflicts = data.slotConflicts;

  const taskStore = useTaskStore.getState();
  (taskStore as any).batchTasks = data.batchTasks;
  (taskStore as any).retestRecords = data.retestRecords;

  const warningStore = useWarningStore.getState();
  (warningStore as any).warnings = data.warnings;

  const collaborationStore = useCollaborationStore.getState();
  (collaborationStore as any).workstations = data.workstations;
  (collaborationStore as any).craftsmen = data.craftsmen;
}

export function usePipeStore(selector?: (state: any) => any): any {
  ensureInitialized();

  const pipes = usePipeDomainStore((s: any) => s.pipes);
  const groups = usePipeDomainStore((s: any) => s.groups);
  const selectedPipeId = usePipeDomainStore((s: any) => s.selectedPipeId);
  const selectedGroupId = usePipeDomainStore((s: any) => s.selectedGroupId);
  const searchFilter = usePipeDomainStore((s: any) => s.searchFilter);
  const allowedCentsDeviation = usePipeDomainStore((s: any) => s.allowedCentsDeviation);
  const highlightedPipeIds = usePipeDomainStore((s: any) => s.highlightedPipeIds);
  const totalSlots = usePipeDomainStore((s: any) => s.totalSlots ?? 50);

  const slotConflicts = useSlotStore((s: any) => s.slotConflicts || s.conflicts || []);

  const batchTasks = useTaskStore((s: any) => s.batchTasks || []);
  const retestRecords = useTaskStore((s: any) => s.retestRecords || []);
  const retestThreshold = useTaskStore((s: any) => s.retestThreshold ?? 15);
  const autoRetestEnabled = useTaskStore((s: any) => s.autoRetestEnabled ?? false);

  const warnings = useWarningStore((s: any) => s.warnings || []);

  const pitchDetectionSessions = usePitchDetectionStore((s: any) => s.sessions || s.pitchDetectionSessions || []);

  const workstations = useCollaborationStore((s: any) => s.workstations || []);
  const craftsmen = useCollaborationStore((s: any) => s.craftsmen || []);
  const selectedWorkstationId = useCollaborationStore((s: any) => s.selectedWorkstationId || 'all');
  const selectedCraftsmanId = useCollaborationStore((s: any) => s.selectedCraftsmanId || 'all');
  const currentCraftsmanId = useCollaborationStore((s: any) => s.currentCraftsmanId || null);

  const operationHistory = useHistoryStore((s: any) => s.operationHistory || []);
  const operationLogs = useHistoryStore((s: any) => s.operationLogs || []);

  const projectName = useUiStore((s: any) => s.projectName);
  const showPitchDetectionPanel = useUiStore((s: any) => s.showPitchDetectionPanel);
  const showWarningPanel = useUiStore((s: any) => s.showWarningPanel);
  const showTaskPanel = useUiStore((s: any) => s.showTaskPanel);
  const showWorkstationPanel = useUiStore((s: any) => s.showWorkstationPanel);
  const showConflictDesk = useUiStore((s: any) => s.showConflictDesk);

  const state = useMemo(() => {
    const pipeStoreState = usePipeDomainStore.getState() as any;
    const slotStoreState = useSlotStore.getState() as any;
    const taskStoreState = useTaskStore.getState() as any;
    const warningStoreState = useWarningStore.getState() as any;
    const pitchStoreState = usePitchDetectionStore.getState() as any;
    const collabStoreState = useCollaborationStore.getState() as any;
    const historyStoreState = useHistoryStore.getState() as any;
    const uiStoreState = useUiStore.getState() as any;

    const setPipes = (newPipes: Pipe[]) => {
      usePipeDomainStore.setState({ pipes: newPipes });
    };

    const setGroups = (newGroups: PipeGroup[]) => {
      usePipeDomainStore.setState({ groups: newGroups });
    };

    const getSlotOccupancy = (): Array<{ slot: number; pipeId: string | null; pipe?: Pipe; conflict?: boolean }> => {
      const occupancy: Array<{ slot: number; pipeId: string | null; pipe?: Pipe; conflict?: boolean }> = [];
      for (let i = 1; i <= totalSlots; i++) {
        const pipeInSlot = pipes.find((p: Pipe) => p.slotNumber === i);
        occupancy.push({
          slot: i,
          pipeId: pipeInSlot?.id || null,
          pipe: pipeInSlot,
        });
      }
      return occupancy;
    };

    const isSlotOccupied = (slotNumber: number, excludePipeId?: string): boolean => {
      return pipes.some(
        (p: Pipe) => p.slotNumber === slotNumber && p.id !== excludePipeId
      );
    };

    const checkSlotConflict = (slotNumber: number, excludePipeId?: string): Pipe | null => {
      const conflictPipe = pipes.find(
        (p: Pipe) => p.slotNumber === slotNumber && p.id !== excludePipeId
      );
      return conflictPipe || null;
    };

    const getPipesBySlot = (slotNumber: number): Pipe[] => {
      return pipes.filter((p: Pipe) => p.slotNumber === slotNumber);
    };

    const assignPipeToWorkstation = (pipeId: string, workstationId: string | undefined) => {
      const result = collabStoreState.assignPipeToWorkstation?.(pipeId, workstationId, pipes);
      if (result) {
        setPipes(result.pipes || result);
      }
    };

    const assignPipeToCraftsman = (pipeId: string, craftsmanId: string | undefined) => {
      const result = collabStoreState.assignPipeToCraftsman?.(pipeId, craftsmanId, pipes);
      if (result) {
        setPipes(result.pipes || result);
      }
    };

    const batchAssignToWorkstation = (pipeIds: string[], workstationId: string | undefined) => {
      const result = collabStoreState.batchAssignToWorkstation?.(pipeIds, workstationId, pipes);
      if (result) {
        setPipes(result.pipes || result);
      }
    };

    const batchAssignToCraftsman = (pipeIds: string[], craftsmanId: string | undefined) => {
      const result = collabStoreState.batchAssignToCraftsman?.(pipeIds, craftsmanId, pipes);
      if (result) {
        setPipes(result.pipes || result);
      }
    };

    const addPitchDetectionSession = (session: Omit<PitchDetectionSession, 'id' | 'startTime'>): string => {
      return pitchStoreState.addSession?.(session) || pitchStoreState.addPitchDetectionSession?.(session) || '';
    };

    const removePitchDetectionSession = (sessionId: string) => {
      if (pitchStoreState.removeSession) {
        pitchStoreState.removeSession(sessionId);
      } else if (pitchStoreState.removePitchDetectionSession) {
        pitchStoreState.removePitchDetectionSession(sessionId);
      }
    };

    const getPitchDetectionSessionsForPipe = (pipeId: string): PitchDetectionSession[] => {
      return pitchStoreState.getSessionsForPipe?.(pipeId) || pitchStoreState.getPitchDetectionSessionsForPipe?.(pipeId) || [];
    };

    const writeMeasuredFrequencyFromSession = (
      pipeId: string,
      frequency: number,
      _sessionId?: string
    ) => {
      pipeStoreState.updatePipeFrequency?.(pipeId, frequency);
      historyStoreState.addOperationRecord?.(
        'update' as OperationType,
        `录音测频写入: ${frequency.toFixed(2)} Hz`,
        { pipeId, metadata: { frequency } }
      );
    };

    const detectSlotConflicts = (): SlotConflict[] => {
      const fn = slotStoreState.detectConflicts || slotStoreState.detectSlotConflicts;
      return fn?.(pipes) || [];
    };

    const resolveSlotConflict = (conflictId: string, keepPipeId: string) => {
      const fn = slotStoreState.resolveConflict || slotStoreState.resolveSlotConflict;
      const result = fn?.(conflictId, keepPipeId, pipes);
      if (result?.pipes) {
        setPipes(result.pipes);
      }
    };

    const getSlotConflicts = (): SlotConflict[] => {
      const fn = slotStoreState.getConflicts || slotStoreState.getSlotConflicts;
      return fn?.() || slotConflicts || [];
    };

    const resolveWarningsForPipe = (pipeId: string, resolvedBy?: string) => {
      warningStoreState.resolveWarningsForPipe?.(pipeId, pipes, resolvedBy);
    };

    const refreshWarnings = () => {
      warningStoreState.refreshWarnings?.(pipes, allowedCentsDeviation, retestThreshold);
    };

    const getUnresolvedWarnings = (): WarningRecord[] => {
      return warningStoreState.getUnresolvedWarnings?.() || warnings.filter((w: WarningRecord) => !w.resolved);
    };

    const getTasksByWorkstation = (workstationId: string): BatchTuningTask[] => {
      return taskStoreState.getTasksByWorkstation?.(workstationId) || batchTasks.filter((t: BatchTuningTask) => t.assignedWorkstationId === workstationId);
    };

    const getTasksByCraftsman = (craftsmanId: string): BatchTuningTask[] => {
      return taskStoreState.getTasksByCraftsman?.(craftsmanId) || batchTasks.filter((t: BatchTuningTask) => t.assignedCraftsmanId === craftsmanId);
    };

    const getRetestRecordsForPipe = (pipeId: string): RetestRecord[] => {
      return taskStoreState.getRetestRecordsForPipe?.(pipeId) || retestRecords.filter((r: RetestRecord) => r.pipeId === pipeId);
    };

    const completeRetest = (pipeId: string, passed: boolean, retestFrequency: number, notes?: string) => {
      const result = taskStoreState.completeRetest?.(pipeId, passed, retestFrequency, allowedCentsDeviation, pipes, notes);
      if (result?.pipes) {
        setPipes(result.pipes);
      }
    };

    const getWorkstationStats = (): WorkstationStats[] => {
      return collabStoreState.getWorkstationStats?.(pipes, allowedCentsDeviation) || [];
    };

    const getCraftsmanStats = (): CraftsmanStats[] => {
      return collabStoreState.getCraftsmanStats?.(pipes, allowedCentsDeviation) || [];
    };

    const getOperationLogsForPipe = (pipeId: string): OperationLog[] => {
      return historyStoreState.getOperationLogsForPipe?.(pipeId) || operationLogs.filter((l: OperationLog) => l.pipeId === pipeId);
    };

    const addOperationLog = (action: string, data?: { pipeId?: string; pipeIds?: string[]; details?: Record<string, unknown> }) => {
      historyStoreState.addOperationLog?.(action, data);
    };

    const doExportProject = (): ProjectFile => {
      return exportProject({
        pipes,
        groups,
        workstations,
        craftsmen,
        warnings,
        batchTasks,
        retestRecords,
        operationHistory,
        operationLogs,
        projectName,
        allowedCentsDeviation,
        totalSlots,
      } as any);
    };

    const doImportProject = (project: ProjectFile, mode: 'replace' | 'merge' = 'replace') => {
      const result = importProject(project, mode, {
        pipes,
        groups,
        workstations,
        craftsmen,
        warnings,
        batchTasks,
        retestRecords,
        allowedCentsDeviation,
        totalSlots,
        projectName,
        operationHistory,
        operationLogs,
        slotConflicts,
      } as any);

      if (result.pipes) setPipes(result.pipes);
      if (result.groups) setGroups(result.groups);
      if (result.workstations) useCollaborationStore.setState({ workstations: result.workstations });
      if (result.craftsmen) useCollaborationStore.setState({ craftsmen: result.craftsmen });
      if (result.warnings) useWarningStore.setState({ warnings: result.warnings });
      if (result.batchTasks) useTaskStore.setState({ batchTasks: result.batchTasks });
      if (result.retestRecords) useTaskStore.setState({ retestRecords: result.retestRecords });
      if (result.projectName) useUiStore.setState({ projectName: result.projectName });
    };

    const validateFrequency = pipeStoreState.validateFrequency || ((freq: number, targetFreq?: number): ValidationResult => {
      const errors: string[] = [];
      const warningsArr: string[] = [];
      if (isNaN(freq)) errors.push('频率值无效');
      else if (freq <= 0) errors.push('频率必须大于 0 Hz');
      return { valid: errors.length === 0, errors, warnings: warningsArr };
    });

    const validateTargetFrequency = pipeStoreState.validateTargetFrequency || ((freq: number): ValidationResult => {
      const errors: string[] = [];
      const warningsArr: string[] = [];
      if (isNaN(freq)) errors.push('目标频率值无效');
      else if (freq <= 0) errors.push('目标频率必须大于 0 Hz');
      return { valid: errors.length === 0, errors, warnings: warningsArr };
    });

    return {
      pipes,
      groups,
      selectedPipeId,
      selectedGroupId,
      searchFilter,
      allowedCentsDeviation,
      highlightedPipeIds,
      totalSlots,

      slotConflicts,

      batchTasks,
      retestRecords,
      retestThreshold,
      autoRetestEnabled,

      warnings,

      pitchDetectionSessions,

      workstations,
      craftsmen,
      selectedWorkstationId,
      selectedCraftsmanId,
      currentCraftsmanId,

      operationHistory,
      operationLogs,

      projectName,
      showPitchDetectionPanel,
      showWarningPanel,
      showTaskPanel,
      showWorkstationPanel,
      showConflictDesk,

      setSelectedPipe: pipeStoreState.setSelectedPipe,
      setSelectedGroup: pipeStoreState.setSelectedGroup,
      addPipe: pipeStoreState.addPipe,
      removePipe: pipeStoreState.removePipe,
      updatePipe: pipeStoreState.updatePipe,
      updatePipeFrequency: pipeStoreState.updatePipeFrequency,
      updateTargetFrequency: pipeStoreState.updateTargetFrequency,
      movePipe: pipeStoreState.movePipe,
      addTrimRecord: pipeStoreState.addTrimRecord,
      setAllowedDeviation: pipeStoreState.setAllowedDeviation,
      updatePipeStatus: pipeStoreState.updatePipeStatus,
      recalculateAllDeviations: pipeStoreState.recalculateAllDeviations,

      addGroup: pipeStoreState.addGroup,
      removeGroup: pipeStoreState.removeGroup,
      updateGroup: pipeStoreState.updateGroup,
      movePipeToGroup: pipeStoreState.movePipeToGroup,

      batchAddPipes: pipeStoreState.batchAddPipes,
      batchVerifyPipes: pipeStoreState.batchVerifyPipes,
      batchUpdateStatus: pipeStoreState.batchUpdateStatus,
      batchMoveToGroup: pipeStoreState.batchMoveToGroup,

      validateFrequency,
      validateTargetFrequency,

      setSearchFilter: pipeStoreState.setSearchFilter,
      getFilteredPipes: pipeStoreState.getFilteredPipes,
      getGroupStats: pipeStoreState.getGroupStats,

      setHighlightedPipes: pipeStoreState.setHighlightedPipes,
      clearHighlightedPipes: pipeStoreState.clearHighlightedPipes,

      addOperationRecord: historyStoreState.addOperationRecord,

      setTotalSlots: pipeStoreState.setTotalSlots || ((slots: number) => usePipeDomainStore.setState({ totalSlots: slots })),
      getSlotOccupancy,
      isSlotOccupied,
      checkSlotConflict,
      getPipesBySlot,

      reorderPipesInGroup: pipeStoreState.reorderPipesInGroup,

      exportProject: doExportProject,
      importProject: doImportProject,

      setProjectName: uiStoreState.setProjectName,

      addPitchDetectionSession,
      removePitchDetectionSession,
      getPitchDetectionSessionsForPipe,
      writeMeasuredFrequencyFromSession,

      togglePitchDetectionPanel: uiStoreState.togglePitchDetectionPanel,
      setShowPitchDetectionPanel: uiStoreState.setShowPitchDetectionPanel,

      addWorkstation: collabStoreState.addWorkstation,
      removeWorkstation: collabStoreState.removeWorkstation,
      updateWorkstation: collabStoreState.updateWorkstation,
      setSelectedWorkstation: collabStoreState.setSelectedWorkstation,

      addCraftsman: collabStoreState.addCraftsman,
      removeCraftsman: collabStoreState.removeCraftsman,
      updateCraftsman: collabStoreState.updateCraftsman,
      setSelectedCraftsman: collabStoreState.setSelectedCraftsman,
      setCurrentCraftsman: collabStoreState.setCurrentCraftsman,

      assignPipeToWorkstation,
      assignPipeToCraftsman,
      batchAssignToWorkstation,
      batchAssignToCraftsman,

      getWorkstationStats,
      getCraftsmanStats,

      addWarning: warningStoreState.addWarning,
      resolveWarning: warningStoreState.resolveWarning,
      resolveWarningsForPipe,
      refreshWarnings,
      getUnresolvedWarnings,

      createBatchTask: taskStoreState.createBatchTask,
      updateBatchTask: taskStoreState.updateBatchTask,
      removeBatchTask: taskStoreState.removeBatchTask,
      startBatchTask: taskStoreState.startBatchTask,
      completeBatchTask: taskStoreState.completeBatchTask,
      assignTaskToWorkstation: taskStoreState.assignTaskToWorkstation,
      assignTaskToCraftsman: taskStoreState.assignTaskToCraftsman,
      updateTaskProgress: taskStoreState.updateTaskProgress,
      getTasksByWorkstation,
      getTasksByCraftsman,

      addRetestRecord: taskStoreState.addRetestRecord,
      getRetestRecordsForPipe,
      startRetest: taskStoreState.startRetest,
      completeRetest,

      detectSlotConflicts,
      resolveSlotConflict,
      getSlotConflicts,

      addOperationLog,
      getOperationLogsForPipe,

      toggleWarningPanel: uiStoreState.toggleWarningPanel,
      toggleTaskPanel: uiStoreState.toggleTaskPanel,
      toggleWorkstationPanel: uiStoreState.toggleWorkstationPanel,
      toggleConflictDesk: uiStoreState.toggleConflictDesk,
      setShowWarningPanel: uiStoreState.setShowWarningPanel,
      setShowTaskPanel: uiStoreState.setShowTaskPanel,
      setShowWorkstationPanel: uiStoreState.setShowWorkstationPanel,
      setShowConflictDesk: uiStoreState.setShowConflictDesk,

      setAutoRetestEnabled: taskStoreState.setAutoRetestEnabled || ((enabled: boolean) => useTaskStore.setState({ autoRetestEnabled: enabled })),
      setRetestThreshold: taskStoreState.setRetestThreshold || ((threshold: number) => useTaskStore.setState({ retestThreshold: threshold })),
    };
  }, [
    pipes, groups, selectedPipeId, selectedGroupId, searchFilter,
    allowedCentsDeviation, highlightedPipeIds, totalSlots,
    slotConflicts, batchTasks, retestRecords, retestThreshold, autoRetestEnabled,
    warnings, pitchDetectionSessions, workstations, craftsmen,
    selectedWorkstationId, selectedCraftsmanId, currentCraftsmanId,
    operationHistory, operationLogs, projectName,
    showPitchDetectionPanel, showWarningPanel, showTaskPanel,
    showWorkstationPanel, showConflictDesk,
  ]);

  if (selector) {
    return selector(state);
  }

  return state;
}

export { recalculateStatus };
