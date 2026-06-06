import { v4 as uuidv4 } from 'uuid';
import { Pipe, PipeStatus, PipeGroup } from '../types';
import { noteToFrequency } from './noteConverter';
import { calculateCentsDeviation } from './centsCalculator';

function createPipe(
  keyPosition: number,
  noteName: string,
  octave: number,
  measuredOffset: number = 0,
  status: PipeStatus = 'tuning',
  groupId?: string,
  slotNumber?: number
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
