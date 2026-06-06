import { generateMockPipes, generateMockGroups, generateMockWorkstations, generateMockCraftsmen, generateMockWarnings, generateMockBatchTasks, generateMockRetestRecords, generateMockSlotConflicts } from '../utils/mockData';
import type { Pipe, Workstation, Craftsman, WarningRecord, BatchTuningTask, RetestRecord, SlotConflict, PipeGroup } from '../types';
import { recalculateStatus } from '../stores/pipe/usePipeStore';

export interface InitializedData {
  pipes: Pipe[];
  groups: PipeGroup[];
  workstations: Workstation[];
  craftsmen: Craftsman[];
  warnings: WarningRecord[];
  batchTasks: BatchTuningTask[];
  retestRecords: RetestRecord[];
  slotConflicts: SlotConflict[];
}

export function initializeMockData(): InitializedData {
  const rawPipes = generateMockPipes();
  const groups = generateMockGroups();
  const workstations = generateMockWorkstations();
  const craftsmen = generateMockCraftsmen();

  const defaultDeviation = 5;
  const pipesWithStatus = rawPipes.map((p) => {
    if (p.centsDeviation === undefined || p.measuredFrequency === undefined) {
      return p;
    }
    const newStatus = recalculateStatus(p.centsDeviation, p.status, defaultDeviation);
    return { ...p, status: newStatus };
  });

  const pipesWithAssignments = pipesWithStatus.map((pipe, index) => {
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

  const warnings = generateMockWarnings(pipesWithAssignments);
  const batchTasks = generateMockBatchTasks(pipesWithAssignments);
  const retestRecords = generateMockRetestRecords(pipesWithAssignments);
  const slotConflicts = generateMockSlotConflicts();

  return {
    pipes: pipesWithAssignments,
    groups,
    workstations,
    craftsmen,
    warnings,
    batchTasks,
    retestRecords,
    slotConflicts,
  };
}
