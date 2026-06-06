import { calculateCentsDeviation } from '../../utils/centsCalculator';
import type { ValidationResult } from '../../types';

export function validateFrequency(freq: number, targetFreq?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(freq)) {
    errors.push('频率值无效');
  } else if (freq <= 0) {
    errors.push('频率必须大于 0 Hz');
  } else if (freq < 20) {
    warnings.push('频率低于人耳可听范围');
  } else if (freq > 20000) {
    warnings.push('频率高于人耳可听范围');
  }

  if (targetFreq && !isNaN(freq)) {
    const cents = calculateCentsDeviation(targetFreq, freq);
    if (Math.abs(cents) > 100) {
      warnings.push('偏差超过 100 音分，请确认输入是否正确');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateTargetFrequency(freq: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(freq)) {
    errors.push('目标频率值无效');
  } else if (freq <= 0) {
    errors.push('目标频率必须大于 0 Hz');
  } else if (freq < 16) {
    warnings.push('目标频率极低，请确认');
  } else if (freq > 16000) {
    warnings.push('目标频率极高，请确认');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateSlot(slot: number, totalSlots: number, existingSlots?: number[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(slot)) {
    errors.push('槽位号无效');
  } else if (slot < 1 || slot > totalSlots) {
    errors.push(`槽位号必须在 1-${totalSlots} 之间`);
  }

  if (existingSlots && existingSlots.includes(slot)) {
    warnings.push('该槽位已被占用');
  }

  return { valid: errors.length === 0, errors, warnings };
}
