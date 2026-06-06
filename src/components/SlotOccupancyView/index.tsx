import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  useTheme,
  Chip,
} from '@mui/material';
import { usePipeStore } from '../../hooks/usePipeStore';
import { getStatusColor, getStatusText } from '../../utils/centsCalculator';
import { Pipe } from '../../types';

interface SlotOccupancyViewProps {
  compact?: boolean;
}

export const SlotOccupancyView: React.FC<SlotOccupancyViewProps> = ({ compact = false }) => {
  const theme = useTheme();
  const { pipes, totalSlots, selectedPipeId, setSelectedPipe, highlightedPipeIds, allowedCentsDeviation } = usePipeStore();

  const slotOccupancy = useMemo(() => {
    const occupancy: Array<{ slot: number; pipe: Pipe | null }> = [];
    for (let i = 1; i <= totalSlots; i++) {
      const pipe = pipes.find((p) => p.slotNumber === i) || null;
      occupancy.push({ slot: i, pipe });
    }
    return occupancy;
  }, [pipes, totalSlots]);

  const stats = useMemo(() => {
    const occupied = pipes.filter((p) => p.slotNumber !== undefined).length;
    const empty = totalSlots - occupied;
    return { occupied, empty, total: totalSlots };
  }, [pipes, totalSlots]);

  const handleSlotClick = (pipe: Pipe | null) => {
    if (pipe) {
      setSelectedPipe(pipe.id);
    }
  };

  if (compact) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            槽位占用
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            {stats.occupied}/{stats.total} 已占用
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))',
            gap: 0.5,
          }}
        >
          {slotOccupancy.map(({ slot, pipe }) => {
            const isHighlighted = highlightedPipeIds.includes(pipe?.id || '');
            const isSelected = selectedPipeId === pipe?.id;
            const color = pipe
              ? getStatusColor(pipe.centsDeviation, allowedCentsDeviation, pipe.status)
              : null;

            return (
              <Tooltip
                key={slot}
                title={
                  pipe
                    ? `${pipe.noteName} - ${getStatusText(pipe.status)}`
                    : `槽位 ${slot} - 空闲`
                }
                arrow
                placement="top"
              >
                <Box
                  onClick={() => handleSlotClick(pipe)}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: 1,
                    backgroundColor: pipe ? color?.main : theme.palette.divider,
                    opacity: pipe ? 1 : 0.3,
                    cursor: pipe ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    border: isSelected
                      ? `2px solid ${theme.palette.primary.main}`
                      : isHighlighted
                      ? `2px solid ${theme.palette.secondary.main}`
                      : 'none',
                    boxShadow: isSelected
                      ? `0 0 8px ${theme.palette.primary.main}60`
                      : 'none',
                    '&:hover': {
                      transform: pipe ? 'scale(1.2)' : 'none',
                      zIndex: 1,
                    },
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        p: 2,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          键位槽位占用视图
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={`已占用 ${stats.occupied}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`空闲 ${stats.empty}`}
            size="small"
            variant="outlined"
            sx={{ color: theme.palette.text.secondary }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
          gap: 1,
          maxHeight: 200,
          overflow: 'auto',
          p: 1,
          backgroundColor: theme.palette.background.default,
          borderRadius: 1,
        }}
      >
        {slotOccupancy.map(({ slot, pipe }) => {
          const isHighlighted = highlightedPipeIds.includes(pipe?.id || '');
          const isSelected = selectedPipeId === pipe?.id;
          const color = pipe
            ? getStatusColor(pipe.centsDeviation, allowedCentsDeviation, pipe.status)
            : null;

          return (
            <Tooltip
              key={slot}
              title={
                pipe ? (
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {pipe.noteName}
                    </Typography>
                    <Typography variant="caption">槽位: {slot}</Typography>
                    <br />
                    <Typography variant="caption">
                      状态: {getStatusText(pipe.status)}
                    </Typography>
                    {pipe.centsDeviation !== undefined && (
                      <>
                        <br />
                        <Typography variant="caption">
                          偏差: {pipe.centsDeviation > 0 ? '+' : ''}
                          {pipe.centsDeviation.toFixed(2)} c
                        </Typography>
                      </>
                    )}
                  </Box>
                ) : (
                  `槽位 ${slot} - 空闲`
                )
              }
              arrow
              placement="top"
            >
              <Box
                onClick={() => handleSlotClick(pipe)}
                sx={{
                  aspectRatio: '1',
                  borderRadius: 1,
                  backgroundColor: pipe ? color?.bg : theme.palette.background.paper,
                  border: `2px solid ${
                    pipe ? color?.main : theme.palette.divider
                  }`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: pipe ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  ...(isSelected && {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 12px ${theme.palette.primary.main}40`,
                  }),
                  ...(isHighlighted && {
                    borderColor: theme.palette.secondary.main,
                    boxShadow: `0 0 8px ${theme.palette.secondary.main}40`,
                  }),
                  '&:hover': {
                    transform: pipe ? 'translateY(-2px)' : 'none',
                    boxShadow: pipe ? `0 4px 12px ${color?.main}40` : 'none',
                  },
                }}
              >
                {pipe ? (
                  <>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.6rem',
                        color: color?.main,
                        fontWeight: 600,
                      }}
                    >
                      {pipe.noteName.replace(/\d+/, '')}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.55rem',
                        color: theme.palette.text.secondary,
                      }}
                    >
                      #{slot}
                    </Typography>
                  </>
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.6rem',
                      color: theme.palette.text.disabled,
                    }}
                  >
                    {slot}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}
          />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            已定音
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
            }}
          />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            待复核
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#64748b',
            }}
          />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            调校中
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: theme.palette.divider,
              opacity: 0.3,
            }}
          />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            空闲
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SlotOccupancyView;
