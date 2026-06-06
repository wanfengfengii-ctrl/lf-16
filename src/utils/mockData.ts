import { v4 as uuidv4 } from 'uuid';
import { Pipe, PipeStatus } from '../types';
import { noteToFrequency } from './noteConverter';
import { calculateCentsDeviation } from './centsCalculator';

function createPipe(
  keyPosition: number,
  noteName: string,
  octave: number,
  measuredOffset: number = 0,
  status: PipeStatus = 'tuning'
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
    createdAt: now,
    updatedAt: now,
  };
}

export function generateMockPipes(): Pipe[] {
  const pipes: Pipe[] = [];
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octaves = [3, 4, 5];
  let position = 1;

  for (const octave of octaves) {
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

      pipes.push(createPipe(position, note, octave, offset, status));
      position++;

      if (position > 32) break;
    }
    if (position > 32) break;
  }

  return pipes;
}
