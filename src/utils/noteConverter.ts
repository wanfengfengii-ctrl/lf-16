const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
  if (frequency <= 0) return { note: '-', octave: 0, cents: 0 };

  const A4 = 440;
  const A4_MIDI = 69;

  const midiNumber = 12 * Math.log2(frequency / A4) + A4_MIDI;
  const roundedMidi = Math.round(midiNumber);
  const cents = (midiNumber - roundedMidi) * 100;

  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
  };
}

export function noteToFrequency(note: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 0;

  const A4 = 440;
  const A4_MIDI = 69;
  const midiNumber = (octave + 1) * 12 + noteIndex;

  return A4 * Math.pow(2, (midiNumber - A4_MIDI) / 12);
}

export function getNoteName(frequency: number): string {
  const { note, octave } = frequencyToNote(frequency);
  return `${note}${octave}`;
}

export function getPianoKeyIndices(startNote: string, startOctave: number, numKeys: number): string[] {
  const keys: string[] = [];
  const startIndex = NOTE_NAMES.indexOf(startNote);
  if (startIndex === -1) return keys;

  let currentIndex = startIndex;
  let currentOctave = startOctave;

  for (let i = 0; i < numKeys; i++) {
    keys.push(`${NOTE_NAMES[currentIndex]}${currentOctave}`);
    currentIndex++;
    if (currentIndex >= 12) {
      currentIndex = 0;
      currentOctave++;
    }
  }

  return keys;
}

export function isBlackKey(noteName: string): boolean {
  const note = noteName.replace(/[0-9]/g, '');
  return note.includes('#');
}
