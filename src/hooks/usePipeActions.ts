import { useCallback } from 'react';
import {
  usePipeStore,
  useHistoryStore,
  useCollaborationStore,
  useTaskStore,
  useWarningStore,
} from '../stores';
import type { OperationType, PipeStatus, TaskPriority } from '../types';

export function usePipeActions() {
  const pipes = usePipeStore((state) => state.pipes);
  const updatePipe = usePipeStore((state) => state.updatePipe);
  const updatePipeFrequency = usePipeStore((state) => state.updatePipeFrequency);
  const updateTargetFrequency = usePipeStore((state) => state.updateTargetFrequency);
  const addTrimRecord = usePipeStore((state) => state.addTrimRecord);
  const removePipe = usePipeStore((state) => state.removePipe);
  const movePipeToGroup = usePipeStore((state) => state.movePipeToGroup);
  const batchAddPipes = usePipeStore((state) => state.batchAddPipes);
  const batchVerifyPipes = usePipeStore((state) => state.batchVerifyPipes);
  const batchUpdateStatus = usePipeStore((state) => state.batchUpdateStatus);
  const batchMoveToGroup = usePipeStore((state) => state.batchMoveToGroup);
  const updatePipeStatus = usePipeStore((state) => state.updatePipeStatus);
  const allowedCentsDeviation = usePipeStore((state) => state.allowedCentsDeviation);
  const retestThreshold = useTaskStore((state) => state.retestThreshold);

  const addOperationRecord = useHistoryStore((state) => state.addOperationRecord);

  const assignPipeToWorkstation = useCollaborationStore((state) => state.assignPipeToWorkstation);
  const assignPipeToCraftsman = useCollaborationStore((state) => state.assignPipeToCraftsman);
  const batchAssignToWorkstation = useCollaborationStore((state) => state.batchAssignToWorkstation);
  const batchAssignToCraftsman = useCollaborationStore((state) => state.batchAssignToCraftsman);

  const startRetest = useTaskStore((state) => state.startRetest);
  const completeRetest = useTaskStore((state) => state.completeRetest);

  const resolveWarningsForPipe = useWarningStore((state) => state.resolveWarningsForPipe);
  const refreshWarnings = useWarningStore((state) => state.refreshWarnings);

  const updatePipeFrequencyWithHistory = useCallback(
    (id: string, measuredFrequency: number) => {
      const beforePipe = pipes.find((p) => p.id === id);
      updatePipeFrequency(id, measuredFrequency);
      const afterPipe = pipes.find((p) => p.id === id);

      if (beforePipe && afterPipe) {
        addOperationRecord(
          'update' as OperationType,
          `更新实测频率: ${afterPipe.noteName} - ${measuredFrequency.toFixed(2)} Hz`,
          {
            pipeId: id,
            beforeData: beforePipe,
            afterData: afterPipe,
          }
        );
      }

      refreshWarnings(pipes, allowedCentsDeviation, retestThreshold);
    },
    [pipes, updatePipeFrequency, addOperationRecord, refreshWarnings, allowedCentsDeviation, retestThreshold]
  );

  const updateTargetFrequencyWithHistory = useCallback(
    (id: string, targetFrequency: number) => {
      const beforePipe = pipes.find((p) => p.id === id);
      updateTargetFrequency(id, targetFrequency);
      const afterPipe = pipes.find((p) => p.id === id);

      if (beforePipe && afterPipe) {
        addOperationRecord(
          'update' as OperationType,
          `更新目标频率: ${afterPipe.noteName} - ${targetFrequency.toFixed(2)} Hz`,
          {
            pipeId: id,
            beforeData: beforePipe,
            afterData: afterPipe,
          }
        );
      }
    },
    [pipes, updateTargetFrequency, addOperationRecord]
  );

  const updatePipeStatusWithHistory = useCallback(
    (id: string, status: PipeStatus, reason?: string) => {
      const beforePipe = pipes.find((p) => p.id === id);
      updatePipeStatus(id, status, reason);
      const afterPipe = pipes.find((p) => p.id === id);

      if (beforePipe && afterPipe) {
        addOperationRecord(
          'status-change' as OperationType,
          `状态变更: ${beforePipe.noteName} ${beforePipe.status} → ${status}`,
          {
            pipeId: id,
            beforeData: { status: beforePipe.status },
            afterData: { status },
          }
        );
      }
    },
    [pipes, updatePipeStatus, addOperationRecord]
  );

  const removePipeWithHistory = useCallback(
    (id: string) => {
      const pipeToRemove = pipes.find((p) => p.id === id);
      removePipe(id);

      if (pipeToRemove) {
        addOperationRecord(
          'remove' as OperationType,
          `删除音管: ${pipeToRemove.noteName || '未知'}`,
          {
            pipeId: id,
            beforeData: pipeToRemove,
          }
        );
      }
    },
    [pipes, removePipe, addOperationRecord]
  );

  const movePipeToGroupWithHistory = useCallback(
    (pipeId: string, groupId: string | undefined) => {
      const pipe = pipes.find((p) => p.id === pipeId);
      movePipeToGroup(pipeId, groupId);

      if (pipe) {
        addOperationRecord(
          'group-change' as OperationType,
          `移动音管到分组: ${pipe.noteName} → ${groupId || '未分组'}`,
          {
            pipeId,
            beforeData: { groupId: pipe.groupId },
            afterData: { groupId },
          }
        );
      }
    },
    [pipes, movePipeToGroup, addOperationRecord]
  );

  const addTrimRecordWithHistory = useCallback(
    (pipeId: string, record: Parameters<typeof addTrimRecord>[1]) => {
      const pipe = pipes.find((p) => p.id === pipeId);
      addTrimRecord(pipeId, record);

      if (pipe) {
        addOperationRecord(
          'trim' as OperationType,
          `记录修整: ${record.beforeFrequency.toFixed(2)} → ${record.afterFrequency.toFixed(2)} Hz`,
          {
            pipeId,
            beforeData: { beforeFrequency: record.beforeFrequency },
            afterData: { afterFrequency: record.afterFrequency },
          }
        );
      }
    },
    [pipes, addTrimRecord, addOperationRecord]
  );

  const assignPipeToWorkstationWithHistory = useCallback(
    (pipeId: string, workstationId: string | undefined) => {
      const pipe = pipes.find((p) => p.id === pipeId);
      const newPipes = assignPipeToWorkstation(pipeId, workstationId, pipes);
      const wsName = useCollaborationStore.getState().workstations.find((w) => w.id === workstationId)?.name || '未分配';

      if (pipe) {
        addOperationRecord(
          'update' as OperationType,
          `分配音管到工位: ${pipe.noteName} → ${wsName}`,
          {
            pipeId,
            beforeData: { workstationId: pipe.workstationId },
            afterData: { workstationId },
          }
        );
      }

      return newPipes;
    },
    [pipes, assignPipeToWorkstation, addOperationRecord]
  );

  const assignPipeToCraftsmanWithHistory = useCallback(
    (pipeId: string, craftsmanId: string | undefined) => {
      const pipe = pipes.find((p) => p.id === pipeId);
      const newPipes = assignPipeToCraftsman(pipeId, craftsmanId, pipes);
      const cName = useCollaborationStore.getState().craftsmen.find((c) => c.id === craftsmanId)?.name || '未分配';

      if (pipe) {
        addOperationRecord(
          'update' as OperationType,
          `分配音管到制作师: ${pipe.noteName} → ${cName}`,
          {
            pipeId,
            beforeData: { assignedCraftsmanId: pipe.assignedCraftsmanId },
            afterData: { assignedCraftsmanId: craftsmanId },
          }
        );
      }

      return newPipes;
    },
    [pipes, assignPipeToCraftsman, addOperationRecord]
  );

  const batchAssignToWorkstationWithHistory = useCallback(
    (pipeIds: string[], workstationId: string | undefined) => {
      const newPipes = batchAssignToWorkstation(pipeIds, workstationId, pipes);
      const wsName = useCollaborationStore.getState().workstations.find((w) => w.id === workstationId)?.name || '未分配';

      addOperationRecord(
        'batch-verify' as OperationType,
        `批量分配 ${pipeIds.length} 根音管到工位: ${wsName}`,
        {
          pipeIds,
          metadata: { workstationId, count: pipeIds.length },
        }
      );

      return newPipes;
    },
    [pipes, batchAssignToWorkstation, addOperationRecord]
  );

  const batchAssignToCraftsmanWithHistory = useCallback(
    (pipeIds: string[], craftsmanId: string | undefined) => {
      const newPipes = batchAssignToCraftsman(pipeIds, craftsmanId, pipes);
      const cName = useCollaborationStore.getState().craftsmen.find((c) => c.id === craftsmanId)?.name || '未分配';

      addOperationRecord(
        'batch-verify' as OperationType,
        `批量分配 ${pipeIds.length} 根音管到制作师: ${cName}`,
        {
          pipeIds,
          metadata: { craftsmanId, count: pipeIds.length },
        }
      );

      return newPipes;
    },
    [pipes, batchAssignToCraftsman, addOperationRecord]
  );

  const batchAddPipesWithHistory = useCallback(
    (
      pipesData: Array<{ targetFrequency: number; noteName: string; slotNumber?: number }>,
      groupId?: string
    ) => {
      const result = batchAddPipes(pipesData, groupId);

      if (result.success) {
        addOperationRecord(
          'batch-add' as OperationType,
          `批量添加 ${result.addedCount} 根音管`,
          {
            pipeIds: [],
            metadata: { count: result.addedCount, groupId, errors: result.errors },
          }
        );
      }

      return result;
    },
    [batchAddPipes, addOperationRecord]
  );

  const batchVerifyPipesWithHistory = useCallback(
    (pipeIds: string[]) => {
      batchVerifyPipes(pipeIds);
      const verifiedCount = pipes.filter(
        (p) => pipeIds.includes(p.id) && p.status === 'verified'
      ).length;

      addOperationRecord(
        'batch-verify' as OperationType,
        `批量复核 ${verifiedCount} 根音管`,
        {
          pipeIds,
          metadata: { count: verifiedCount },
        }
      );
    },
    [pipes, batchVerifyPipes, addOperationRecord]
  );

  const completeRetestWithHistory = useCallback(
    (pipeId: string, passed: boolean, retestFrequency: number, notes?: string) => {
      const result = completeRetest(pipeId, passed, retestFrequency, allowedCentsDeviation, pipes, notes);
      const pipe = pipes.find((p) => p.id === pipeId);

      if (pipe) {
        addOperationRecord(
          'update' as OperationType,
          `复测完成: ${pipe.noteName} - ${passed ? '通过' : '未通过'}`,
          {
            pipeId,
            beforeData: { status: pipe.status, centsDeviation: pipe.centsDeviation },
            afterData: { status: result.pipes.find(p => p.id === pipeId)?.status, centsDeviation: result.pipes.find(p => p.id === pipeId)?.centsDeviation },
            metadata: { retestCount: pipe.retestCount + 1 },
          }
        );
      }

      return result;
    },
    [pipes, completeRetest, allowedCentsDeviation, addOperationRecord]
  );

  const createBatchTask = useTaskStore((state) => state.createBatchTask);

  const createBatchTaskWithHistory = useCallback(
    (name: string, pipeIds: string[], priority?: TaskPriority, description?: string) => {
      const taskId = createBatchTask(name, pipeIds, priority, description);

      addOperationRecord(
        'batch-add' as OperationType,
        `创建批量任务: ${name} (${pipeIds.length} 根音管)`,
        {
          pipeIds,
          metadata: { taskId, taskName: name, count: pipeIds.length },
        }
      );

      return taskId;
    },
    [createBatchTask, addOperationRecord]
  );

  return {
    updatePipeFrequency: updatePipeFrequencyWithHistory,
    updateTargetFrequency: updateTargetFrequencyWithHistory,
    updatePipeStatus: updatePipeStatusWithHistory,
    removePipe: removePipeWithHistory,
    movePipeToGroup: movePipeToGroupWithHistory,
    addTrimRecord: addTrimRecordWithHistory,
    assignPipeToWorkstation: assignPipeToWorkstationWithHistory,
    assignPipeToCraftsman: assignPipeToCraftsmanWithHistory,
    batchAssignToWorkstation: batchAssignToWorkstationWithHistory,
    batchAssignToCraftsman: batchAssignToCraftsmanWithHistory,
    batchAddPipes: batchAddPipesWithHistory,
    batchVerifyPipes: batchVerifyPipesWithHistory,
    batchUpdateStatus,
    batchMoveToGroup,
    updatePipe,
    startRetest,
    completeRetest: completeRetestWithHistory,
    resolveWarningsForPipe: (pipeId: string, resolvedBy?: string) =>
      resolveWarningsForPipe(pipeId, pipes, resolvedBy),
    createBatchTask: createBatchTaskWithHistory,
  };
}
