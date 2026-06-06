import { describe, expect, it } from 'vitest';
import { validateFrequency, validateTargetFrequency, validateSlot } from '../pipe/validation';

describe('validation functions', () => {
  describe('validateFrequency', () => {
    it('should return valid for normal frequency', () => {
      const result = validateFrequency(440);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return error for NaN', () => {
      const result = validateFrequency(NaN);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('频率值无效');
    });

    it('should return error for zero or negative frequency', () => {
      expect(validateFrequency(0).valid).toBe(false);
      expect(validateFrequency(-10).valid).toBe(false);
      expect(validateFrequency(0).errors).toContain('频率必须大于 0 Hz');
    });

    it('should return warning for very low frequency', () => {
      const result = validateFrequency(10);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('频率低于人耳可听范围');
    });

    it('should return warning for very high frequency', () => {
      const result = validateFrequency(25000);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('频率高于人耳可听范围');
    });

    it('should return warning when deviation from target exceeds 100 cents', () => {
      const result = validateFrequency(500, 440);
      expect(result.warnings).toContain('偏差超过 100 音分，请确认输入是否正确');
    });

    it('should not return warning when deviation from target is within 100 cents', () => {
      const result = validateFrequency(442, 440);
      expect(result.warnings).not.toContain('偏差超过 100 音分，请确认输入是否正确');
    });
  });

  describe('validateTargetFrequency', () => {
    it('should return valid for normal target frequency', () => {
      const result = validateTargetFrequency(440);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return error for NaN', () => {
      const result = validateTargetFrequency(NaN);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('目标频率值无效');
    });

    it('should return error for zero or negative frequency', () => {
      const result = validateTargetFrequency(0);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('目标频率必须大于 0 Hz');
    });

    it('should return warning for very low target frequency', () => {
      const result = validateTargetFrequency(10);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('目标频率极低，请确认');
    });

    it('should return warning for very high target frequency', () => {
      const result = validateTargetFrequency(20000);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('目标频率极高，请确认');
    });
  });

  describe('validateSlot', () => {
    it('should return valid for slot within range', () => {
      const result = validateSlot(5, 50);
      expect(result.valid).toBe(true);
    });

    it('should return error for slot less than 1', () => {
      const result = validateSlot(0, 50);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('槽位号必须在 1-50 之间');
    });

    it('should return error for slot greater than totalSlots', () => {
      const result = validateSlot(51, 50);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('槽位号必须在 1-50 之间');
    });

    it('should return error for NaN slot', () => {
      const result = validateSlot(NaN, 50);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('槽位号无效');
    });

    it('should return warning for occupied slot', () => {
      const result = validateSlot(5, 50, [3, 5, 7]);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('该槽位已被占用');
    });

    it('should not return warning for unoccupied slot', () => {
      const result = validateSlot(10, 50, [3, 5, 7]);
      expect(result.warnings).not.toContain('该槽位已被占用');
    });
  });
});
