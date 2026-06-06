import { describe, expect, it } from 'vitest';
import {
  frequencyToNote,
  noteToFrequency,
  getNoteName,
  getPianoKeyIndices,
  isBlackKey,
} from '../noteConverter';

describe('noteConverter', () => {
  describe('noteToFrequency', () => {
    it('should return 440 Hz for A4', () => {
      expect(noteToFrequency('A', 4)).toBe(440);
    });

    it('should return correct frequency for C4', () => {
      expect(noteToFrequency('C', 4)).toBeCloseTo(261.63, 2);
    });

    it('should return 0 for invalid note', () => {
      expect(noteToFrequency('X', 4)).toBe(0);
    });

    it('should have correct ratio between octaves', () => {
      const A4 = noteToFrequency('A', 4);
      const A5 = noteToFrequency('A', 5);
      expect(A5 / A4).toBeCloseTo(2, 5);
    });
  });

  describe('frequencyToNote', () => {
    it('should return A4 for 440 Hz', () => {
      const result = frequencyToNote(440);
      expect(result.note).toBe('A');
      expect(result.octave).toBe(4);
      expect(result.cents).toBeCloseTo(0, 5);
    });

    it('should return C4 for ~261.63 Hz', () => {
      const result = frequencyToNote(261.63);
      expect(result.note).toBe('C');
      expect(result.octave).toBe(4);
    });

    it('should return default values for 0 or negative frequency', () => {
      const result1 = frequencyToNote(0);
      expect(result1.note).toBe('-');
      expect(result1.octave).toBe(0);
      expect(result1.cents).toBe(0);

      const result2 = frequencyToNote(-10);
      expect(result2.note).toBe('-');
    });

    it('should calculate cents deviation correctly', () => {
      const A4plus25 = 440 * Math.pow(2, 25 / 1200);
      const result = frequencyToNote(A4plus25);
      expect(result.note).toBe('A');
      expect(result.octave).toBe(4);
      expect(result.cents).toBeCloseTo(25, 0);
    });
  });

  describe('getNoteName', () => {
    it('should return note name with octave', () => {
      expect(getNoteName(440)).toBe('A4');
    });
  });

  describe('getPianoKeyIndices', () => {
    it('should generate correct piano key sequence', () => {
      const keys = getPianoKeyIndices('C', 4, 12);
      expect(keys).toHaveLength(12);
      expect(keys[0]).toBe('C4');
      expect(keys[11]).toBe('B4');
    });

    it('should handle octave wrap', () => {
      const keys = getPianoKeyIndices('A', 4, 5);
      expect(keys).toEqual(['A4', 'A#4', 'B4', 'C5', 'C#5']);
    });

    it('should return empty array for invalid start note', () => {
      const keys = getPianoKeyIndices('X', 4, 10);
      expect(keys).toEqual([]);
    });
  });

  describe('isBlackKey', () => {
    it('should return true for sharp notes', () => {
      expect(isBlackKey('C#4')).toBe(true);
      expect(isBlackKey('F#5')).toBe(true);
    });

    it('should return false for natural notes', () => {
      expect(isBlackKey('C4')).toBe(false);
      expect(isBlackKey('A4')).toBe(false);
    });
  });
});
