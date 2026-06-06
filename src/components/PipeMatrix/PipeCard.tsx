import React from 'react';
import { Card, CardContent, Typography, Box, Chip, useTheme } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pipe } from '../../types';
import {
  getStatusColor,
  getStatusText,
  formatFrequency,
  formatCents,
} from '../../utils/centsCalculator';
import { usePipeStore } from '../../hooks/usePipeStore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface PipeCardProps {
  pipe: Pipe;
  isHighlighted?: boolean;
}

export const PipeCard: React.FC<PipeCardProps> = ({ pipe, isHighlighted = false }) => {
  const theme = useTheme();
  const { selectedPipeId, setSelectedPipe, allowedCentsDeviation, groups } = usePipeStore();
  const isSelected = selectedPipeId === pipe.id;

  const group = groups.find((g) => g.id === pipe.groupId);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pipe.id,
  });

  const color = getStatusColor(pipe.centsDeviation, allowedCentsDeviation, pipe.status);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPipe(pipe.id);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      sx={{
        position: 'relative',
        border: `2px solid ${
          isHighlighted
            ? theme.palette.secondary.main
            : isSelected
            ? theme.palette.primary.main
            : color.main
        }`,
        backgroundColor: isSelected
          ? `${theme.palette.primary.main}15`
          : isHighlighted
          ? `${theme.palette.secondary.main}15`
          : color.bg,
        boxShadow: isSelected
          ? `0 0 20px ${theme.palette.primary.main}40`
          : isHighlighted
          ? `0 0 15px ${theme.palette.secondary.main}40`
          : 'none',
        transition: 'all 0.2s ease',
        minHeight: 120,
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${color.main}30`,
        },
        ...(isDragging && {
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          zIndex: 1000,
        }),
      }}
    >
      {group && (
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: 8,
            width: 20,
            height: 6,
            backgroundColor: group.color,
            borderRadius: '0 0 4px 4px',
          }}
        />
      )}

      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'grab',
              color: theme.palette.text.secondary,
              mr: 1,
              '&:hover': {
                color: theme.palette.text.primary,
              },
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: 18 }} />
          </Box>

          <Typography
            variant="caption"
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            #{pipe.keyPosition.toString().padStart(2, '0')}
          </Typography>
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            fontSize: '1.25rem',
            textAlign: 'center',
            color: color.main,
            mb: 0.5,
            letterSpacing: '-0.02em',
          }}
        >
          {pipe.noteName}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            textAlign: 'center',
            color: theme.palette.text.secondary,
            mb: 1.5,
          }}
        >
          {formatFrequency(pipe.targetFrequency)}
        </Typography>

        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            pt: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {pipe.measuredFrequency !== undefined ? (
            <>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.65rem',
                  color: theme.palette.text.secondary,
                }}
              >
                实测: {formatFrequency(pipe.measuredFrequency)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: color.main,
                }}
              >
                {formatCents(pipe.centsDeviation)}
              </Typography>
            </>
          ) : (
            <Typography
              variant="caption"
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem',
                color: theme.palette.text.disabled,
                fontStyle: 'italic',
              }}
            >
              待测量
            </Typography>
          )}
        </Box>

        {pipe.slotNumber && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              color: theme.palette.text.disabled,
              textAlign: 'right',
              mt: 0.5,
            }}
          >
            槽位 {pipe.slotNumber}
          </Typography>
        )}

        <Chip
          label={getStatusText(pipe.status)}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 500,
            backgroundColor: color.main,
            color: '#fff',
            '& .MuiChip-label': {
              px: 1,
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default PipeCard;
