import React, { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Box, Typography, useTheme } from '@mui/material';
import { usePipeStore } from '../../hooks/usePipeStore';
import { PipeCard } from './PipeCard';
import { Pipe } from '../../types';

export const PipeMatrix: React.FC = () => {
  const theme = useTheme();
  const { pipes, movePipe, selectedPipeId } = usePipeStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedPipes = useMemo(() => {
    return [...pipes].sort((a, b) => a.keyPosition - b.keyPosition);
  }, [pipes]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sortedPipes.findIndex((p) => p.id === active.id);
      const newIndex = sortedPipes.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        movePipe(oldIndex, newIndex);
      }
    }
  };

  const activePipe = activeId ? pipes.find((p) => p.id === activeId) : null;

  const stats = useMemo(() => {
    const total = pipes.length;
    const verified = pipes.filter((p) => p.status === 'verified').length;
    const needsReview = pipes.filter((p) => p.status === 'needs-review').length;
    const tuning = pipes.filter((p) => p.status === 'tuning').length;
    return { total, verified, needsReview, tuning };
  }, [pipes]);

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          音管矩阵
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: theme.palette.success.main, whiteSpace: 'nowrap' }}>
            已定音 {stats.verified}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.warning.main, whiteSpace: 'nowrap' }}>
            待复核 {stats.needsReview}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, whiteSpace: 'nowrap' }}>
            调校中 {stats.tuning}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.primary, whiteSpace: 'nowrap' }}>
            总计 {stats.total}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 2,
          borderRadius: 2,
          backgroundColor: `${theme.palette.background.default}80`,
          border: `1px solid ${theme.palette.divider}`,
          backgroundImage:
            'linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedPipes.map((p) => p.id)} strategy={rectSortingStrategy}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 1.5,
                minHeight: '100%',
                alignContent: 'start',
              }}
            >
              {sortedPipes.map((pipe) => (
                <PipeCard pipe={pipe} key={pipe.id} />
              ))}
            </Box>
          </SortableContext>

          <DragOverlay>
            {activePipe ? (
              <Box sx={{ transform: 'scale(1.05)', opacity: 0.9, width: 180 }}>
                <PipeCard pipe={activePipe} />
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>
      </Box>
    </Box>
  );
};

export default PipeMatrix;
