import { useState, useCallback, useMemo } from 'react';
import { useSlotStore } from '../../stores';
import type { Pipe } from '../../types';

interface UseSlotInputOptions {
  initialValue?: string;
  pipes: Pipe[];
  currentPipeId?: string;
  onValidSubmit?: (slotNumber: number | undefined) => void;
}

interface UseSlotInputReturn {
  value: string;
  error: string;
  hasConflict: boolean;
  conflictingPipe: Pipe | null;
  setValue: (value: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  reset: (newValue?: string) => void;
}

export function useSlotInput(options: UseSlotInputOptions): UseSlotInputReturn {
  const { initialValue = '', pipes, currentPipeId, onValidSubmit } = options;
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  const checkSlotConflict = useSlotStore((state) => state.checkSlotConflict);

  const { hasConflict, conflictingPipe } = useMemo(() => {
    const slotNum = parseInt(value);
    if (!value || isNaN(slotNum) || slotNum <= 0) {
      return { hasConflict: false, conflictingPipe: null as Pipe | null };
    }
    const conflictPipe = checkSlotConflict(slotNum, pipes, currentPipeId);
    return {
      hasConflict: !!conflictPipe,
      conflictingPipe: conflictPipe,
    };
  }, [value, pipes, currentPipeId, checkSlotConflict]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (newValue === '') {
        setError('');
        return;
      }

      const slotNum = parseInt(newValue);
      if (isNaN(slotNum) || slotNum <= 0) {
        setError('请输入有效的槽位号');
        return;
      }

      const conflictPipe = checkSlotConflict(slotNum, pipes, currentPipeId);
      if (conflictPipe) {
        setError(`槽位 #${slotNum} 已被占用`);
      } else {
        setError('');
      }
    },
    [pipes, currentPipeId, checkSlotConflict]
  );

  const handleBlur = useCallback(() => {
    if (onValidSubmit === undefined) return;

    if (value === '') {
      onValidSubmit(undefined);
      setError('');
      return;
    }

    const slotNum = parseInt(value);
    if (isNaN(slotNum) || slotNum <= 0) {
      return;
    }

    const conflictPipe = checkSlotConflict(slotNum, pipes, currentPipeId);
    if (conflictPipe) {
      setError(`槽位 #${slotNum} 已被音管 ${conflictPipe.noteName} 占用`);
      return;
    }

    onValidSubmit(slotNum);
    setError('');
  }, [value, pipes, currentPipeId, checkSlotConflict, onValidSubmit]);

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
    setError('');
  }, []);

  return {
    value,
    error,
    hasConflict,
    conflictingPipe,
    setValue,
    handleChange,
    handleBlur,
    handleKeyDown,
    reset,
  };
}
