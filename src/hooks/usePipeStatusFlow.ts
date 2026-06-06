import { useCallback } from 'react';
import { usePipeStore as usePipeDomainStore, useHistoryStore } from '../stores';
import type { PipeStatus, OperationType } from '../types';
import { recalculateStatus } from '../stores/pipe/usePipeStore';

export function usePipeStatusFlow() {
  const updatePipeStatus = usePipeDomainStore((state) => state.updatePipeStatus);
  const addOperationRecord = useHistoryStore((state) => state.addOperationRecord);
  const allowedCentsDeviation = usePipeDomainStore((state) => state.allowedCentsDeviation);
  const pipes = usePipeDomainStore((state) => state.pipes);

  const calculateStatus = useCallback(
    (cents: number | undefined, currentStatus: PipeStatus): PipeStatus => {
      return recalculateStatus(cents, currentStatus, allowedCentsDeviation);
    },
    [allowedCentsDeviation]
  );

  const changeStatus = useCallback(
    (pipeId: string, newStatus: PipeStatus, reason?: string) => {
      const pipe = pipes.find((p) => p.id === pipeId);
      if (!pipe) return;

      updatePipeStatus(pipeId, newStatus, reason);
      addOperationRecord(
        'status-change' as OperationType,
        `状态变更: ${pipe.noteName} ${pipe.status} → ${newStatus}`,
        {
          pipeId,
          beforeData: { status: pipe.status },
          afterData: { status: newStatus },
        }
      );
    },
    [pipes, updatePipeStatus, addOperationRecord]
  );

  const markAsVerified = useCallback(
    (pipeId: string) => {
      changeStatus(pipeId, 'verified');
    },
    [changeStatus]
  );

  const markAsNeedsReview = useCallback(
    (pipeId: string, reason?: string) => {
      changeStatus(pipeId, 'needs-review', reason || '需要复核');
    },
    [changeStatus]
  );

  return {
    calculateStatus,
    changeStatus,
    markAsVerified,
    markAsNeedsReview,
  };
}
