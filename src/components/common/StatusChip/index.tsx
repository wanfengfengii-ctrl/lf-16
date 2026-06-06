import React from 'react';
import { Chip } from '@mui/material';
import type { PipeStatus } from '../../../types';
import { getStatusColor, getStatusText } from '../../../utils/centsCalculator';

interface StatusChipProps {
  status: PipeStatus;
  centsDeviation?: number;
  allowedDeviation?: number;
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  centsDeviation,
  allowedDeviation = 5,
  size = 'small',
}) => {
  const color = getStatusColor(centsDeviation, allowedDeviation, status);

  return (
    <Chip
      label={getStatusText(status)}
      size={size}
      sx={{
        backgroundColor: color.main,
        color: '#fff',
        fontWeight: 500,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        height: size === 'small' ? 20 : 24,
      }}
    />
  );
};

export default StatusChip;
