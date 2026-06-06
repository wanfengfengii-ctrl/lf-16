// @ts-nocheck
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Box, Typography, useTheme, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { usePipeStore } from '../../hooks/usePipeStore';
import { Pipe } from '../../types';
import { getStatusColor } from '../../utils/centsCalculator';

type SortMode = 'position' | 'deviation' | 'note';

export const DeviationChart: React.FC = () => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const { pipes, allowedCentsDeviation, selectedPipeId, setSelectedPipe, highlightedPipeIds, setHighlightedPipes } = usePipeStore();
  const [sortMode, setSortMode] = React.useState<SortMode>('position');

  const sortedPipes = useMemo(() => {
    const result = [...pipes];
    switch (sortMode) {
      case 'deviation':
        return result.sort(
          (a, b) =>
            Math.abs(b.centsDeviation ?? 0) - Math.abs(a.centsDeviation ?? 0)
        );
      case 'note':
        return result.sort((a, b) => a.targetFrequency - b.targetFrequency);
      case 'position':
      default:
        return result.sort((a, b) => a.keyPosition - b.keyPosition);
    }
  }, [pipes, sortMode]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    if (containerWidth < 50) return;

    const width = containerWidth;
    const height = 260;
    const margin = { top: 30, right: 20, bottom: 50, left: 50 };
    const innerWidth = Math.max(width - margin.left - margin.right, 50);
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const maxDeviation = Math.max(
      allowedCentsDeviation * 3,
      30,
      ...sortedPipes.map((p) => Math.max(Math.abs(p.initialDeviation ?? 0), Math.abs(p.centsDeviation ?? 0)))
    );

    const xScale = d3
      .scaleBand()
      .domain(sortedPipes.map((p) => p.id))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([-maxDeviation, maxDeviation])
      .range([innerHeight, 0])
      .nice();

    const xAxis = d3.axisBottom(xScale).tickFormat((d) => {
      const pipe = sortedPipes.find((p) => p.id === d);
      return pipe ? pipe.noteName : '';
    });

    const yAxis = d3.axisLeft(yScale).ticks(8).tickFormat((d) => `${d}c`);

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '9px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .style('text-anchor', 'end')
      .attr('dx', '-.5em')
      .attr('dy', '-.25em')
      .attr('transform', 'rotate(-45)');

    g.selectAll('.domain, .tick line')
      .attr('stroke', theme.palette.divider);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '10px')
      .attr('font-family', "'JetBrains Mono', monospace");

    g.selectAll('.domain, .tick line')
      .attr('stroke', theme.palette.divider);

    const safeZoneTop = g
      .append('rect')
      .attr('x', 0)
      .attr('y', yScale(allowedCentsDeviation))
      .attr('width', innerWidth)
      .attr('height', yScale(-allowedCentsDeviation) - yScale(allowedCentsDeviation))
      .attr('fill', theme.palette.success.main)
      .attr('opacity', 0.08);

    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(allowedCentsDeviation))
      .attr('y2', yScale(allowedCentsDeviation))
      .attr('stroke', theme.palette.success.main)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.5);

    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(-allowedCentsDeviation))
      .attr('y2', yScale(-allowedCentsDeviation))
      .attr('stroke', theme.palette.success.main)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.5);

    const barWidth = xScale.bandwidth() / 2 - 2;

    const initialBars = g
      .selectAll('.initial-bar')
      .data(sortedPipes.filter((p) => p.initialDeviation !== undefined))
      .enter()
      .append('rect')
      .attr('class', 'initial-bar')
      .attr('x', (d) => (xScale(d.id) ?? 0))
      .attr('y', (d) =>
        yScale(Math.max(0, d.initialDeviation ?? 0))
      )
      .attr('width', barWidth)
      .attr('height', (d) => Math.abs(yScale(d.initialDeviation ?? 0) - yScale(0)))
      .attr('fill', theme.palette.grey[600])
      .attr('opacity', 0.4)
      .attr('rx', 2);

    const currentBars = g
      .selectAll('.current-bar')
      .data(sortedPipes.filter((p) => p.centsDeviation !== undefined))
      .enter()
      .append('rect')
      .attr('class', 'current-bar')
      .attr('x', (d) => (xScale(d.id) ?? 0) + barWidth + 4)
      .attr('y', (d) =>
        yScale(Math.max(0, d.centsDeviation ?? 0))
      )
      .attr('width', barWidth)
      .attr('height', (d) => Math.abs(yScale(d.centsDeviation ?? 0) - yScale(0)))
      .attr('fill', (d) => {
        const color = getStatusColor(d.centsDeviation, allowedCentsDeviation, d.status);
        return color.main;
      })
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d: Pipe) => {
        setSelectedPipe(d.id);
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        setHighlightedPipes([d.id]);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('opacity', 1);
        setHighlightedPipes([]);
      });

    g.selectAll<string>('.highlight-indicator')
      .data(highlightedPipeIds.filter((id) => sortedPipes.some((p) => p.id === id)))
      .enter()
      .append('rect')
      .attr('class', 'highlight-indicator')
      .attr('x', (d) => (xScale(d) ?? 0) - 2)
      .attr('y', -5)
      .attr('width', xScale.bandwidth() + 4)
      .attr('height', innerHeight + 10)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.secondary.main)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('rx', 4)
      .attr('pointer-events', 'none');

    g.selectAll<string>('.selected-indicator')
      .data(selectedPipeId ? [selectedPipeId] : [])
      .enter()
      .append('rect')
      .attr('class', 'selected-indicator')
      .attr('x', (d) => (xScale(d) ?? 0) - 2)
      .attr('y', -5)
      .attr('width', xScale.bandwidth() + 4)
      .attr('height', innerHeight + 10)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.primary.main)
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .attr('pointer-events', 'none');

    const legend = g
      .append('g')
      .attr('transform', `translate(${innerWidth - 120}, -20)`);

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', theme.palette.grey[600])
      .attr('opacity', 0.4)
      .attr('rx', 2);

    legend
      .append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '10px')
      .text('校音前');

    legend
      .append('rect')
      .attr('x', 60)
      .attr('y', 0)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', theme.palette.success.main)
      .attr('rx', 2);

    legend
      .append('text')
      .attr('x', 78)
      .attr('y', 10)
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '10px')
      .text('当前');

  }, [sortedPipes, allowedCentsDeviation, selectedPipeId, highlightedPipeIds, theme, setSelectedPipe, setHighlightedPipes, sortMode]);

  const stats = useMemo(() => {
    const withDeviation = pipes.filter((p) => p.centsDeviation !== undefined);
    if (withDeviation.length === 0) return { avg: 0, max: 0, inTune: 0, total: 0 };
    const avg =
      withDeviation.reduce((sum, p) => sum + Math.abs(p.centsDeviation ?? 0), 0) /
      withDeviation.length;
    const max = Math.max(...withDeviation.map((p) => Math.abs(p.centsDeviation ?? 0)));
    const inTune = withDeviation.filter(
      (p) => Math.abs(p.centsDeviation ?? 0) <= allowedCentsDeviation
    ).length;
    return { avg, max, inTune, total: withDeviation.length };
  }, [pipes, allowedCentsDeviation]);

  const handleSortChange = (e: SelectChangeEvent<SortMode>) => {
    setSortMode(e.target.value as SortMode);
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        p: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
            偏差对比
          </Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={sortMode}
              onChange={handleSortChange}
              variant="standard"
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="position">按键位</MenuItem>
              <MenuItem value="note">按音高</MenuItem>
              <MenuItem value="deviation">按偏差</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          平均: {stats.avg.toFixed(1)}c · 最大: {stats.max.toFixed(1)}c
        </Typography>
      </Box>
      <svg ref={svgRef} style={{ width: '100%', display: 'block' }} />
    </Box>
  );
};

export default DeviationChart;
