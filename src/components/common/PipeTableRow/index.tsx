import React from 'react';
import { TableRow, TableCell, Chip } from '@mui/material';
import type { Pipe } from '../../../types';
import { getStatusColor, formatCents } from '../../../utils/centsCalculator';
import StatusChip from '../StatusChip';

interface PipeTableRowProps {
  pipe: Pipe;
  allowedCentsDeviation: number;
  onClick?: () => void;
  selected?: boolean;
  showCheckbox?: boolean;
  checked?: boolean;
  onCheck?: (checked: boolean) => void;
}

export const PipeTableRow: React.FC<PipeTableRowProps> = ({
  pipe,
  allowedCentsDeviation,
  onClick,
  selected = false,
}) => {
  const color = getStatusColor(pipe.centsDeviation, allowedCentsDeviation, pipe.status);

  return (
    <TableRow
      hover
      selected={selected}
      onClick={onClick}
      sx={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
        {pipe.noteName}
      </TableCell>
      <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {pipe.targetFrequency.toFixed(2)} Hz
      </TableCell>
      <TableCell
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          color: color.main,
          fontWeight: 600,
        }}
      >
        {pipe.centsDeviation !== undefined
          ? formatCents(pipe.centsDeviation)
          : '-'}
      </TableCell>
      <TableCell>
        <StatusChip
          status={pipe.status}
          centsDeviation={pipe.centsDeviation}
          allowedDeviation={allowedCentsDeviation}
          size="small"
        />
      </TableCell>
    </TableRow>
  );
};

export default PipeTableRow;
