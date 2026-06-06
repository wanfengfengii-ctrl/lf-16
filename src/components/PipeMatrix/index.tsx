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
import { Box, Typography, useTheme, Chip, Tabs, Tab } from '@mui/material';
import { usePipeStore } from '../../hooks/usePipeStore';
import { PipeCard } from './PipeCard';
import { Pipe } from '../../types';

export const PipeMatrix: React.FC = () => {
  const theme = useTheme();
  const {
    pipes,
    groups,
    movePipe,
    reorderPipesInGroup,
    selectedPipeId,
    getFilteredPipes,
    selectedGroupId,
    setSelectedGroup,
    highlightedPipeIds,
  } = usePipeStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'group'>('all');

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

  const filteredPipes = useMemo(() => getFilteredPipes(), [getFilteredPipes]);

  const displayPipes = useMemo(() => {
    if (viewMode === 'group' && selectedGroupId !== 'all') {
      return filteredPipes.filter((p) => p.groupId === selectedGroupId);
    }
    return filteredPipes;
  }, [filteredPipes, viewMode, selectedGroupId]);

  const sortedPipes = useMemo(() => {
    return [...displayPipes].sort((a, b) => a.keyPosition - b.keyPosition);
  }, [displayPipes]);

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
        if (selectedGroupId === 'all') {
          const allOldIndex = pipes.findIndex((p) => p.id === active.id);
          const allNewIndex = pipes.findIndex((p) => p.id === over.id);
          movePipe(allOldIndex, allNewIndex);
        } else {
          reorderPipesInGroup(selectedGroupId, oldIndex, newIndex);
        }
      }
    }
  };

  const activePipe = activeId ? pipes.find((p) => p.id === activeId) : null;

  const stats = useMemo(() => {
    const total = filteredPipes.length;
    const verified = filteredPipes.filter((p) => p.status === 'verified').length;
    const needsReview = filteredPipes.filter((p) => p.status === 'needs-review').length;
    const tuning = filteredPipes.filter((p) => p.status === 'tuning').length;
    return { total, verified, needsReview, tuning };
  }, [filteredPipes]);

  const groupTabs = useMemo(() => {
    return [
      { id: 'all', name: '全部', count: filteredPipes.length },
      ...groups.map((g) => ({
        id: g.id,
        name: g.name,
        count: filteredPipes.filter((p) => p.groupId === g.id).length,
        color: g.color,
      })),
    ];
  }, [groups, filteredPipes]);

  const handleGroupTabChange = (_event: React.SyntheticEvent, value: string) => {
    setSelectedGroup(value);
  };

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

        <Tabs
          value={selectedGroupId}
          onChange={handleGroupTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 0,
            '& .MuiTab-root': {
              minHeight: 32,
              py: 0.5,
              fontSize: '0.75rem',
            },
          }}
        >
          {groupTabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {tab.id !== 'all' && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: (tab as { color?: string }).color,
                      }}
                    />
                  )}
                  <span>{tab.name}</span>
                  <Chip
                    label={tab.count}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: '0.65rem',
                      '& .MuiChip-label': { px: 0.5 },
                    }}
                    variant="outlined"
                  />
                </Box>
              }
              sx={{ textTransform: 'none' }}
            />
          ))}
        </Tabs>

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
          {highlightedPipeIds.length > 0 && (
            <Typography
              variant="caption"
              sx={{ color: theme.palette.secondary.main, whiteSpace: 'nowrap' }}
            >
              高亮 {highlightedPipeIds.length}
            </Typography>
          )}
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
        {sortedPipes.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.palette.text.disabled,
            }}
          >
            <Typography variant="body2">没有符合条件的音管</Typography>
            <Typography variant="caption">请调整筛选条件</Typography>
          </Box>
        ) : (
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
                  <PipeCard
                    pipe={pipe}
                    key={pipe.id}
                    isHighlighted={highlightedPipeIds.includes(pipe.id)}
                  />
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
        )}
      </Box>
    </Box>
  );
};

export default PipeMatrix;
