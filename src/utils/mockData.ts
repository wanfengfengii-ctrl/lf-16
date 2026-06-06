import { v4 as uuidv4 } from 'uuid';
import { Pipe, PipeStatus, PipeGroup, Workstation, Craftsman, WarningRecord, BatchTuningTask, RetestRecord, SlotConflict, WarningType } from '../types';
import { noteToFrequency } from './noteConverter';
import { calculateCentsDeviation } from './centsCalculator';

function createPipe(
  keyPosition: number,
  noteName: string,
  octave: number,
  measuredOffset: number = 0,
  status: PipeStatus = 'tuning',
  groupId?: string,
  slotNumber?: number,
  workstationId?: string,
  assignedCraftsmanId?: string
): Pipe {
  const targetFreq = noteToFrequency(noteName, octave);
  const measuredFreq = targetFreq + measuredOffset;
  const cents = calculateCentsDeviation(targetFreq, measuredFreq);
  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    keyPosition,
    noteName: `${noteName}${octave}`,
    targetFrequency: targetFreq,
    measuredFrequency: measuredOffset !== 0 ? measuredFreq : undefined,
    centsDeviation: measuredOffset !== 0 ? cents : undefined,
    initialDeviation: measuredOffset !== 0 ? cents + (Math.random() - 0.5) * 30 : undefined,
    status,
    notes: '',
    trimHistory: [],
    groupId,
    slotNumber,
    verifiedAt: status === 'verified' ? now : undefined,
    needsReviewReason: status === 'needs-review' ? '首次检测偏差较大' : undefined,
    workstationId,
    assignedCraftsmanId,
    retestCount: 0,
    warningCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function generateMockGroups(): PipeGroup[] {
  return [
    {
      id: 'group-1',
      name: '低音区',
      color: '#3b82f6',
      description: '低音音管组 (C3-B3)',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'group-2',
      name: '中音区',
      color: '#10b981',
      description: '中音音管组 (C4-B4)',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'group-3',
      name: '高音区',
      color: '#f59e0b',
      description: '高音音管组 (C5-B5)',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function generateMockPipes(): Pipe[] {
  const pipes: Pipe[] = [];
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octaves = [3, 4, 5];
  let position = 1;

  for (const octave of octaves) {
    let groupId: string | undefined;
    if (octave === 3) groupId = 'group-1';
    else if (octave === 4) groupId = 'group-2';
    else if (octave === 5) groupId = 'group-3';

    for (const note of notes) {
      let offset = 0;
      let status: PipeStatus = 'tuning';

      if (position <= 8) {
        offset = (Math.random() - 0.5) * 2;
        status = 'verified';
      } else if (position <= 16) {
        offset = (Math.random() - 0.5) * 15;
        status = 'needs-review';
      } else if (position <= 24) {
        offset = (Math.random() - 0.3) * 25;
        status = 'tuning';
      }

      pipes.push(createPipe(position, note, octave, offset, status, groupId, position));
      position++;

      if (position > 32) break;
    }
    if (position > 32) break;
  }

  return pipes;
}

export function generateMockWorkstations(): Workstation[] {
  return [
    {
      id: 'ws-1',
      name: '一号工位',
      description: '低音区校音工位',
      color: '#3b82f6',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ws-2',
      name: '二号工位',
      description: '中音区校音工位',
      color: '#10b981',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ws-3',
      name: '三号工位',
      description: '高音区校音工位',
      color: '#f59e0b',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ws-4',
      name: '复核工位',
      description: '质量复核工位',
      color: '#8b5cf6',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function generateMockCraftsmen(): Craftsman[] {
  return [
    {
      id: 'craftsman-1',
      name: '张师傅',
      role: '高级调音师',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'craftsman-2',
      name: '李师傅',
      role: '调音师',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'craftsman-3',
      name: '王师傅',
      role: '高级调音师',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'craftsman-4',
      name: '赵师傅',
      role: '质检师',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function generateMockWarnings(pipes: Pipe[]): WarningRecord[] {
  const warnings: WarningRecord[] = [];
  const now = new Date();

  const needsReviewPipes = pipes.filter((p) => p.status === 'needs-review');
  needsReviewPipes.slice(0, 3).forEach((pipe, index) => {
    warnings.push({
      id: uuidv4(),
      type: 'excessive-deviation',
      pipeId: pipe.id,
      severity: 'medium',
      message: `音管 ${pipe.noteName} 偏差超过允许范围，需及时校音`,
      timestamp: new Date(now.getTime() - index * 3600000).toISOString(),
      resolved: false,
    });
  });

  const tuningPipes = pipes.filter((p) => p.status === 'tuning' && !p.measuredFrequency);
  tuningPipes.slice(0, 2).forEach((pipe, index) => {
    warnings.push({
      id: uuidv4(),
      type: 'no-measured-frequency',
      pipeId: pipe.id,
      severity: 'low',
      message: `音管 ${pipe.noteName} 尚未录入实测频率`,
      timestamp: new Date(now.getTime() - (index + 3) * 3600000).toISOString(),
      resolved: false,
    });
  });

  const unassignedPipes = pipes.filter((p) => !p.workstationId);
  unassignedPipes.slice(0, 2).forEach((pipe, index) => {
    warnings.push({
      id: uuidv4(),
      type: 'unassigned-workstation',
      pipeId: pipe.id,
      severity: 'low',
      message: `音管 ${pipe.noteName} 未分配工位`,
      timestamp: new Date(now.getTime() - (index + 5) * 3600000).toISOString(),
      resolved: false,
    });
  });

  return warnings;
}

export function generateMockBatchTasks(pipes: Pipe[]): BatchTuningTask[] {
  const pipeIds = pipes.map((p) => p.id);
  const now = new Date();

  return [
    {
      id: 'task-1',
      name: '低音区首轮校音',
      description: '对低音区所有音管进行首次校音',
      pipeIds: pipeIds.slice(0, 8),
      status: 'completed',
      priority: 'high',
      assignedWorkstationId: 'ws-1',
      assignedCraftsmanId: 'craftsman-1',
      createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
      startedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      completedAt: new Date(now.getTime() - 86400000).toISOString(),
      progress: 100,
    },
    {
      id: 'task-2',
      name: '中音区精细调校',
      description: '中音区音管精细调校任务',
      pipeIds: pipeIds.slice(8, 20),
      status: 'in-progress',
      priority: 'medium',
      assignedWorkstationId: 'ws-2',
      assignedCraftsmanId: 'craftsman-2',
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      startedAt: new Date(now.getTime() - 86400000).toISOString(),
      progress: 60,
    },
    {
      id: 'task-3',
      name: '高音区待复核',
      description: '高音区音管校音后质量复核',
      pipeIds: pipeIds.slice(20, 32),
      status: 'pending',
      priority: 'low',
      assignedWorkstationId: 'ws-4',
      assignedCraftsmanId: 'craftsman-4',
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      progress: 0,
    },
  ];
}

export function generateMockRetestRecords(pipes: Pipe[]): RetestRecord[] {
  const records: RetestRecord[] = [];
  const verifiedPipes = pipes.filter((p) => p.status === 'verified');
  const now = new Date();

  verifiedPipes.slice(0, 5).forEach((pipe, index) => {
    if (pipe.measuredFrequency && pipe.centsDeviation !== undefined) {
      records.push({
        id: uuidv4(),
        pipeId: pipe.id,
        originalFrequency: pipe.targetFrequency,
        retestFrequency: pipe.measuredFrequency,
        originalCentsDeviation: pipe.initialDeviation ?? pipe.centsDeviation,
        retestCentsDeviation: pipe.centsDeviation,
        timestamp: new Date(now.getTime() - index * 7200000).toISOString(),
        operator: '张师傅',
        passed: true,
      });
    }
  });

  return records;
}

export function generateMockSlotConflicts(): SlotConflict[] {
  return [];
}
