import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  useTheme,
  Chip,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
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
    const occupancy: Array<{ slot: number; pipes: Pipe[]; hasConflict: boolean }> = [];
    for (let i = 1; i <= totalSlots; i++) {
      const slotPipes = pipes.filter((p) => p.slotNumber === i);
      occupancy.push({ slot: i, pipes: slotPipes, hasConflict: slotPipes.length > 1 });
    }
    return occupancy;
  }, [pipes, totalSlots]);

  const stats = useMemo(() => {
    const occupiedSlots = slotOccupancy.filter((s) => s.pipes.length > 0).length;
    const conflictSlots = slotOccupancy.filter((s) => s.hasConflict).length;
    const empty = totalSlots - occupiedSlots;
    return { occupied: occupiedSlots, empty, conflict: conflictSlots, total: totalSlots };
  }, [slotOccupancy, totalSlots]);

  const handleSlotClick = (slotPipes: Pipe[]) => {
    if (slotPipes.length > 0) {
      setSelectedPipe(slotPipes[0].id);
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
          {slotOccupancy.map(({ slot, pipes: slotPipes, hasConflict }) => {
            const primaryPipe = slotPipes.length > 0 ? slotPipes[0] : null;
            const isHighlighted = highlightedPipeIds.some((id) => slotPipes.some((p) => p.id === id));
            const isSelected = selectedPipeId && slotPipes.some((p) => p.id === selectedPipeId);
            const color = primaryPipe
              ? getStatusColor(primaryPipe.centsDeviation, allowedCentsDeviation, primaryPipe.status)
              : null;

            return (
              <Tooltip
                key={slot}
                title={
                  slotPipes.length > 0 ? (
                    <Box sx={{ p: 0.5 }}>
                      {slotPipes.map((p) => (
                        <Typography key={p.id} variant="body2">
                          {p.noteName} - {getStatusText(p.status)}
                        </Typography>
                      ))}
                      {hasConflict && (
                        <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                          ⚠️ 槽位冲突 ({slotPipes.length} 根音管)
                        </Typography>
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
                  onClick={() => handleSlotClick(slotPipes)}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: 1,
                    backgroundColor: primaryPipe ? color?.main : theme.palette.divider,
                    opacity: primaryPipe ? 1 : 0.3,
                    cursor: primaryPipe ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    border: isSelected
                      ? `2px solid ${theme.palette.primary.main}`
                      : isHighlighted
                      ? `2px solid ${theme.palette.secondary.main}`
                      : hasConflict
                      ? `2px solid ${theme.palette.error.main}`
                      : 'none',
                    boxShadow: isSelected
                      ? `0 0 8px ${theme.palette.primary.main}60`
                      : hasConflict
                      ? `0 0 6px ${theme.palette.error.main}60`
                      : 'none',
                    '&:hover': {
                      transform: primaryPipe ? 'scale(1.2)' : 'none',
                      zIndex: 1,
                    },
                  }}
                >
                  {hasConflict && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.error.main,
                        border: `1px solid ${theme.palette.background.paper}`,
                      }}
                    />
                  )}
                </Box>
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
          {stats.conflict > 0 && (
            <Chip
              label={`冲突 ${stats.conflict}`}
              size="small"
              color="error"
              variant="outlined"
              icon={<WarningIcon sx={{ fontSize: 12 }} />}
            />
          )}
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
        {slotOccupancy.map(({ slot, pipes: slotPipes, hasConflict }) => {
          const primaryPipe = slotPipes.length > 0 ? slotPipes[0] : null;
          const isHighlighted = highlightedPipeIds.some((id) => slotPipes.some((p) => p.id === id));
          const isSelected = selectedPipeId && slotPipes.some((p) => p.id === selectedPipeId);
          const color = primaryPipe
            ? getStatusColor(primaryPipe.centsDeviation, allowedCentsDeviation, primaryPipe.status)
            : null;

          return (
            <Tooltip
              key={slot}
              title={
                slotPipes.length > 0 ? (
                  <Box sx={{ p: 0.5 }}>
                    {slotPipes.map((p) => (
                      <Box key={p.id} sx={{ mb: slotPipes.length > 1 ? 0.5 : 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {p.noteName}
                        </Typography>
                        <Typography variant="caption">
                          状态: {getStatusText(p.status)}
                        </Typography>
                        {p.centsDeviation !== undefined && (
                          <Typography variant="caption">
                            {' '}偏差: {p.centsDeviation > 0 ? '+' : ''}
                            {p.centsDeviation.toFixed(2)} c
                          </Typography>
                        )}
                      </Box>
                    ))}
                    {hasConflict && (
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.error.main, fontWeight: 600 }}
                      >
                        ⚠️ 槽位冲突：{slotPipes.length} 根音管共用此槽位
                      </Typography>
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
                onClick={() => handleSlotClick(slotPipes)}
                sx={{
                  aspectRatio: '1',
                  borderRadius: 1,
                  backgroundColor: primaryPipe ? color?.bg : theme.palette.background.paper,
                  border: `2px solid ${
                    hasConflict
                      ? theme.palette.error.main
                      : primaryPipe
                      ? color?.main
                      : theme.palette.divider
                  }`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: primaryPipe ? 'pointer' : 'default',
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
                  ...(hasConflict && !isSelected && !isHighlighted && {
                    boxShadow: `0 0 8px ${theme.palette.error.main}40`,
                  }),
                  '&:hover': {
                    transform: primaryPipe ? 'translateY(-2px)' : 'none',
                    boxShadow: primaryPipe
                      ? `0 4px 12px ${hasConflict ? theme.palette.error.main : color?.main}40`
                      : 'none',
                  },
                }}
              >
                {primaryPipe ? (
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
                      {primaryPipe.noteName.replace(/\d+/, '')}
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
                    {hasConflict && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.error.main,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.5rem',
                          fontWeight: 700,
                          border: `1px solid ${theme.palette.background.paper}`,
                        }}
                      >
                        {slotPipes.length}
                      </Box>
                    )}
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
              backgroundColor: theme.palette.error.main,
            }}
          />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            槽位冲突
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
