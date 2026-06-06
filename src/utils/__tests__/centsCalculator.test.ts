import { describe, expect, it } from 'vitest';
import {
  calculateCentsDeviation,
  getStatusColor,
  getStatusText,
  formatFrequency,
  formatCents,
} from '../centsCalculator';

describe('centsCalculator', () => {
  describe('calculateCentsDeviation', () => {
    it('should return 0 when target frequency is 440 and measured is 440', () => {
      expect(calculateCentsDeviation(440, 440)).toBe(0);
    });

    it('should return positive cents when measured frequency is higher', () => {
      const cents = calculateCentsDeviation(440, 442.5);
      expect(cents).toBeGreaterThan(0);
      expect(cents).toBeCloseTo(9.78, 1);
    });

    it('should return negative cents when measured frequency is lower', () => {
      const cents = calculateCentsDeviation(440, 437.5);
      expect(cents).toBeLessThan(0);
      expect(cents).toBeCloseTo(-9.88, 1);
    });

    it('should return 0 for invalid frequencies', () => {
      expect(calculateCentsDeviation(0, 440)).toBe(0);
      expect(calculateCentsDeviation(440, 0)).toBe(0);
      expect(calculateCentsDeviation(-10, 440)).toBe(0);
    });

    it('should return 100 cents for a semitone difference', () => {
      const A4 = 440;
      const A4sharp = 440 * Math.pow(2, 1 / 12);
      const cents = calculateCentsDeviation(A4, A4sharp);
      expect(cents).toBeCloseTo(100, 5);
    });
  });

  describe('getStatusColor', () => {
    it('should return gray for tuning status', () => {
      const color = getStatusColor(0, 5, 'tuning');
      expect(color.main).toBe('#64748b');
    });

    it('should return gray when centsDeviation is undefined', () => {
      const color = getStatusColor(undefined, 5, 'verified');
      expect(color.main).toBe('#64748b');
    });

    it('should return green when deviation is within allowed range', () => {
      const color = getStatusColor(3, 5, 'verified');
      expect(color.main).toBe('#10b981');
    });

    it('should return red when deviation exceeds allowed range', () => {
      const color = getStatusColor(10, 5, 'verified');
      expect(color.main).toBe('#ef4444');
    });

    it('should return amber for needs-review status', () => {
      const color = getStatusColor(3, 5, 'needs-review');
      expect(color.main).toBe('#f59e0b');
    });

    it('should return purple for pending-retest status', () => {
      const color = getStatusColor(3, 5, 'pending-retest');
      expect(color.main).toBe('#8b5cf6');
    });
  });

  describe('getStatusText', () => {
    it('should return Chinese text for tuning', () => {
      expect(getStatusText('tuning')).toBe('调校中');
    });

    it('should return Chinese text for verified', () => {
      expect(getStatusText('verified')).toBe('已定音');
    });

    it('should return Chinese text for needs-review', () => {
      expect(getStatusText('needs-review')).toBe('待复核');
    });

    it('should return Chinese text for pending-retest', () => {
      expect(getStatusText('pending-retest')).toBe('待复测');
    });

    it('should return original status for unknown status', () => {
      expect(getStatusText('unknown')).toBe('unknown');
    });
  });

  describe('formatFrequency', () => {
    it('should format frequency with 2 decimal places', () => {
      expect(formatFrequency(440)).toBe('440.00 Hz');
    });

    it('should return -- for undefined', () => {
      expect(formatFrequency(undefined)).toBe('--');
    });
  });

  describe('formatCents', () => {
    it('should format positive cents with + sign', () => {
      expect(formatCents(5.5)).toBe('+5.50 c');
    });

    it('should format negative cents with - sign', () => {
      expect(formatCents(-3.2)).toBe('-3.20 c');
    });

    it('should return -- for undefined', () => {
      expect(formatCents(undefined)).toBe('--');
    });
  });
});
