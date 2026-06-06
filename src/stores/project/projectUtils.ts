import type {
  ProjectFile,
  Pipe,
  PipeGroup,
  Workstation,
  Craftsman,
  WarningRecord,
  BatchTuningTask,
  RetestRecord,
  SlotConflict,
  OperationRecord,
} from '../../types';

export interface FullProjectState {
  pipes: Pipe[];
  groups: PipeGroup[];
  allowedCentsDeviation: number;
  totalSlots: number;
  projectName: string;
  operationHistory: OperationRecord[];
  workstations: Workstation[];
  craftsmen: Craftsman[];
  warnings: WarningRecord[];
  batchTasks: BatchTuningTask[];
  retestRecords: RetestRecord[];
  slotConflicts: SlotConflict[];
  autoRetestEnabled: boolean;
  retestThreshold: number;
}

export function exportProject(state: FullProjectState): ProjectFile {
  return {
    version: '1.0.0',
    name: state.projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    allowedCentsDeviation: state.allowedCentsDeviation,
    groups: state.groups,
    pipes: state.pipes,
    operationHistory: state.operationHistory,
    workstations: state.workstations,
    craftsmen: state.craftsmen,
    warnings: state.warnings,
    batchTasks: state.batchTasks,
    retestRecords: state.retestRecords,
    slotConflicts: state.slotConflicts,
    metadata: {
      totalSlots: state.totalSlots,
      autoRetestEnabled: state.autoRetestEnabled,
      retestThreshold: state.retestThreshold,
    },
  };
}

export interface ImportResult {
  pipes: Pipe[];
  groups: PipeGroup[];
  allowedCentsDeviation: number;
  totalSlots: number;
  projectName: string;
  operationHistory: OperationRecord[];
  workstations: Workstation[];
  craftsmen: Craftsman[];
  warnings: WarningRecord[];
  batchTasks: BatchTuningTask[];
  retestRecords: RetestRecord[];
  slotConflicts: SlotConflict[];
  autoRetestEnabled: boolean;
  retestThreshold: number;
}

export function importProject(
  project: ProjectFile,
  mode: 'replace' | 'merge',
  currentState: FullProjectState
): ImportResult {
  if (mode === 'replace') {
    return {
      pipes: project.pipes,
      groups: project.groups,
      allowedCentsDeviation: project.allowedCentsDeviation,
      totalSlots: project.metadata?.totalSlots || currentState.totalSlots,
      projectName: project.name,
      operationHistory: [...currentState.operationHistory, ...project.operationHistory],
      workstations: project.workstations || [],
      craftsmen: project.craftsmen || [],
      warnings: project.warnings || [],
      batchTasks: project.batchTasks || [],
      retestRecords: project.retestRecords || [],
      slotConflicts: project.slotConflicts || [],
      autoRetestEnabled: project.metadata?.autoRetestEnabled ?? currentState.autoRetestEnabled,
      retestThreshold: project.metadata?.retestThreshold ?? currentState.retestThreshold,
    };
  } else {
    const existingPipeIds = new Set(currentState.pipes.map((p) => p.id));
    const newPipes = project.pipes.filter((p) => !existingPipeIds.has(p.id));
    const existingGroupIds = new Set(currentState.groups.map((g) => g.id));
    const newGroups = project.groups.filter((g) => !existingGroupIds.has(g.id));

    let maxPosition = currentState.pipes.length;
    const mergedPipes = [
      ...currentState.pipes,
      ...newPipes.map((p) => ({ ...p, keyPosition: ++maxPosition })),
    ];

    const existingWsIds = new Set(currentState.workstations.map((w) => w.id));
    const newWorkstations = (project.workstations || []).filter((w) => !existingWsIds.has(w.id));

    const existingCraftsmanIds = new Set(currentState.craftsmen.map((c) => c.id));
    const newCraftsmen = (project.craftsmen || []).filter((c) => !existingCraftsmanIds.has(c.id));

    return {
      pipes: mergedPipes,
      groups: [...currentState.groups, ...newGroups],
      allowedCentsDeviation: currentState.allowedCentsDeviation,
      totalSlots: currentState.totalSlots,
      projectName: currentState.projectName,
      operationHistory: [...currentState.operationHistory],
      workstations: [...currentState.workstations, ...newWorkstations],
      craftsmen: [...currentState.craftsmen, ...newCraftsmen],
      warnings: [...currentState.warnings, ...(project.warnings || [])],
      batchTasks: [...currentState.batchTasks, ...(project.batchTasks || [])],
      retestRecords: [...currentState.retestRecords, ...(project.retestRecords || [])],
      slotConflicts: [...currentState.slotConflicts, ...(project.slotConflicts || [])],
      autoRetestEnabled: currentState.autoRetestEnabled,
      retestThreshold: currentState.retestThreshold,
    };
  }
}
