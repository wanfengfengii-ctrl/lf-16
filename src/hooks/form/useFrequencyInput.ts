import { useState, useCallback } from 'react';
import type { ValidationResult } from '../../types';
import { usePipeStore } from '../../stores';

interface UseFrequencyInputOptions {
  initialValue?: string;
  validateFn: (freq: number, targetFreq?: number) => ValidationResult;
  targetFreq?: number;
  onValidSubmit?: (value: number) => void;
}

interface UseFrequencyInputReturn {
  value: string;
  errors: string[];
  warnings: string[];
  setValue: (value: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  reset: (newValue?: string) => void;
}

export function useFrequencyInput(options: UseFrequencyInputOptions): UseFrequencyInputReturn {
  const { initialValue = '', validateFn, targetFreq, onValidSubmit } = options;
  const [value, setValue] = useState(initialValue);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (newValue === '') {
        setErrors([]);
        setWarnings([]);
        return;
      }

      const freq = parseFloat(newValue);
      if (isNaN(freq)) {
        setErrors(['请输入有效数字']);
        setWarnings([]);
        return;
      }

      const validation = validateFn(freq, targetFreq);
      setErrors(validation.errors);
      setWarnings(validation.warnings);
    },
    [validateFn, targetFreq]
  );

  const handleBlur = useCallback(() => {
    const freq = parseFloat(value);

    if (value === '' || isNaN(freq) || onValidSubmit === undefined) {
      return;
    }

    const validation = validateFn(freq, targetFreq);
    if (!validation.valid) {
      return;
    }

    onValidSubmit(freq);
  }, [value, validateFn, targetFreq, onValidSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleBlur();
        (e.target as HTMLInputElement).blur();
      }
    },
    [handleBlur]
  );

  const reset = useCallback((newValue = '') => {
    setValue(newValue);
    setErrors([]);
    setWarnings([]);
  }, []);

  return {
    value,
    errors,
    warnings,
    setValue,
    handleChange,
    handleBlur,
    handleKeyDown,
    reset,
  };
}

export function useMeasuredFrequencyInput(
  onValidSubmit: (value: number) => void,
  targetFreq?: number,
  initialValue?: string
) {
  const validateTarget = usePipeStore((state) => state.validateFrequency);
  return useFrequencyInput({
    initialValue,
    validateFn: validateTarget,
    targetFreq,
    onValidSubmit,
  });
}

export function useTargetFrequencyInput(
  onValidSubmit: (value: number) => void,
  initialValue?: string
) {
  const validateTarget = usePipeStore((state) => state.validateTargetFrequency);
  return useFrequencyInput({
    initialValue,
    validateFn: validateTarget,
    onValidSubmit,
  });
}
