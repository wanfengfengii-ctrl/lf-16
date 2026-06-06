// @ts-nocheck
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Box, Typography, useTheme } from '@mui/material';
import { usePipeStore } from '../../hooks/usePipeStore';
import { getStatusColor } from '../../utils/centsCalculator';
import { noteToFrequency, isBlackKey, frequencyToNote } from '../../utils/noteConverter';
import { Pipe } from '../../types';

export const RangeChart: React.FC = () => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const { pipes, allowedCentsDeviation, selectedPipeId, setSelectedPipe, highlightedPipeIds, setHighlightedPipes } = usePipeStore();

  const rangeConfig = useMemo(() => {
    const startNote = 'C';
    const startOctave = 3;
    const endNote = 'B';
    const endOctave = 5;
    const startFreq = noteToFrequency(startNote, startOctave);
    const endFreq = noteToFrequency(endNote, endOctave) * Math.pow(2, 1 / 12);
    return { startNote, startOctave, endNote, endOctave, startFreq, endFreq };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    if (containerWidth < 50) return;

    const width = containerWidth;
    const height = 180;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };
    const innerWidth = Math.max(width - margin.left - margin.right, 50);
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3
      .scaleLog()
      .domain([rangeConfig.startFreq, rangeConfig.endFreq])
      .range([0, innerWidth]);

    const whiteKeyWidth = innerWidth / 22;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const whiteKeyHeight = innerHeight * 0.8;
    const blackKeyHeight = whiteKeyHeight * 0.6;

    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const keys: { note: string; octave: number; freq: number; isBlack: boolean }[] = [];
    for (let oct = rangeConfig.startOctave; oct <= rangeConfig.endOctave; oct++) {
      for (const note of allNotes) {
        if (oct === rangeConfig.startOctave && allNotes.indexOf(note) < allNotes.indexOf(rangeConfig.startNote)) continue;
        if (oct === rangeConfig.endOctave && allNotes.indexOf(note) > allNotes.indexOf(rangeConfig.endNote)) continue;
        keys.push({
          note,
          octave: oct,
          freq: noteToFrequency(note, oct),
          isBlack: isBlackKey(note),
        });
      }
    }

    const whiteKeys = keys.filter((k) => !k.isBlack);
    const blackKeys = keys.filter((k) => k.isBlack);

    g.selectAll('.white-key')
      .data(whiteKeys)
      .enter()
      .append('rect')
      .attr('class', 'white-key')
      .attr('x', (d, i) => i * whiteKeyWidth)
      .attr('y', 0)
      .attr('width', whiteKeyWidth - 1)
      .attr('height', whiteKeyHeight)
      .attr('fill', theme.palette.grey[200])
      .attr('stroke', theme.palette.divider)
      .attr('rx', 2)
      .attr('opacity', 0.9);

    const blackKeyOffsets: { [key: string]: number } = {
      'C#': 0.65,
      'D#': 1.65,
      'F#': 3.65,
      'G#': 4.65,
      'A#': 5.65,
    };

    g.selectAll('.black-key')
      .data(blackKeys)
      .enter()
      .append('rect')
      .attr('class', 'black-key')
      .attr('x', (d) => {
        const whiteKeyIndex = whiteNotes.indexOf(d.note.replace('#', ''));
        const octaveOffset = (d.octave - rangeConfig.startOctave) * 7;
        const offset = blackKeyOffsets[d.note] || 0;
        return (octaveOffset + whiteKeyIndex + offset) * whiteKeyWidth;
      })
      .attr('y', 0)
      .attr('width', blackKeyWidth)
      .attr('height', blackKeyHeight)
      .attr('fill', theme.palette.grey[800])
      .attr('stroke', theme.palette.divider)
      .attr('rx', 2)
      .attr('z-index', 10);

    const activePipes = pipes.filter(
      (p) =>
        p.targetFrequency >= rangeConfig.startFreq &&
        p.targetFrequency <= rangeConfig.endFreq
    );

    const pipeMarkers = g
      .selectAll<Pipe>('.pipe-marker')
      .data(activePipes)
      .enter()
      .append('g')
      .attr('class', 'pipe-marker')
      .attr('transform', (d) => `translate(${xScale(d.targetFrequency)}, ${whiteKeyHeight + 5})`)
      .style('cursor', 'pointer')
      .on('click', (event, d: Pipe) => {
        setSelectedPipe(d.id);
      })
      .on('mouseover', function(event, d) {
        setHighlightedPipes([d.id]);
      })
      .on('mouseout', function(event, d) {
        setHighlightedPipes([]);
      });

    pipeMarkers
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', innerHeight - whiteKeyHeight - 10)
      .attr('stroke', (d) => {
        const color = getStatusColor(d.centsDeviation, allowedCentsDeviation, d.status);
        return color.main;
      })
      .attr('stroke-width', (d) => (d.id === selectedPipeId || highlightedPipeIds.includes(d.id) ? 3 : 2))
      .attr('stroke-linecap', 'round')
      .attr('opacity', (d) => (d.id === selectedPipeId || highlightedPipeIds.includes(d.id) ? 1 : 0.7));

    pipeMarkers
      .append('circle')
      .attr('cx', 0)
      .attr('cy', innerHeight - whiteKeyHeight - 10)
      .attr('r', (d) => (d.id === selectedPipeId ? 8 : highlightedPipeIds.includes(d.id) ? 7 : 5))
      .attr('fill', (d) => {
        const color = getStatusColor(d.centsDeviation, allowedCentsDeviation, d.status);
        return color.main;
      })
      .attr('stroke', (d) =>
        highlightedPipeIds.includes(d.id) ? theme.palette.secondary.main : theme.palette.background.paper
      )
      .attr('stroke-width', 2)
      .style('transition', 'r 0.2s ease');

    const cNotes = keys.filter((k) => k.note === 'C' && !k.isBlack);
    const xAxisGroup = g.append('g').attr('transform', `translate(0, ${innerHeight - 10})`);

    xAxisGroup
      .selectAll('.octave-label')
      .data(cNotes)
      .enter()
      .append('text')
      .attr('class', 'octave-label')
      .attr('x', (d) => {
        const whiteKeyIndex = whiteNotes.indexOf(d.note);
        const octaveOffset = (d.octave - rangeConfig.startOctave) * 7;
        return (octaveOffset + whiteKeyIndex) * whiteKeyWidth + whiteKeyWidth / 2;
      })
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '10px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text((d) => `C${d.octave}`);

    const frequencyTicks = [130.81, 261.63, 523.25, 1046.5];
    const freqLabelGroup = g.append('g');

    freqLabelGroup
      .selectAll('.freq-label')
      .data(frequencyTicks)
      .enter()
      .append('text')
      .attr('class', 'freq-label')
      .attr('x', (d) => xScale(d))
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.text.disabled)
      .attr('font-size', '9px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text((d) => `${d.toFixed(0)} Hz`);
  }, [pipes, allowedCentsDeviation, selectedPipeId, highlightedPipeIds, rangeConfig, theme, setSelectedPipe, setHighlightedPipes]);

  const stats = useMemo(() => {
    if (pipes.length === 0) return { min: 0, max: 0, range: 0 };
    const freqs = pipes.map((p) => p.targetFrequency);
    const min = Math.min(...freqs);
    const max = Math.max(...freqs);
    return { min, max, range: max - min };
  }, [pipes]);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        p: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          音域图
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          {stats.min.toFixed(1)} - {stats.max.toFixed(1)} Hz
        </Typography>
      </Box>
      <svg ref={svgRef} style={{ width: '100%', display: 'block' }} />
    </Box>
  );
};

export default RangeChart;
