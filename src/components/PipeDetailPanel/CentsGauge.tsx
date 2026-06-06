import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, Typography, useTheme } from '@mui/material';
import { getStatusColor } from '../../utils/centsCalculator';

interface CentsGaugeProps {
  cents: number | undefined;
  allowedDeviation: number;
  status: string;
  size?: number;
}

interface ArcDatum {
  startAngle: number;
  endAngle: number;
}

export const CentsGauge: React.FC<CentsGaugeProps> = ({
  cents,
  allowedDeviation,
  status,
  size = 200,
}) => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = size;
    const height = size * 0.6;
    const radius = Math.min(width, height * 2) * 0.8;
    const centerX = width / 2;
    const centerY = height * 0.9;

    const maxDeviation = Math.max(allowedDeviation * 3, 50);
    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;

    const color = getStatusColor(cents, allowedDeviation, status);

    const angleScale = d3.scaleLinear()
      .domain([-maxDeviation, maxDeviation])
      .range([startAngle, endAngle]);

    const arc = d3.arc<ArcDatum>()
      .innerRadius(radius * 0.7)
      .outerRadius(radius);

    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    const bgDatum: ArcDatum = {
      startAngle: startAngle,
      endAngle: endAngle,
    };
    g.append('path')
      .datum(bgDatum)
      .attr('d', arc as unknown as (d: ArcDatum) => string)
      .attr('fill', theme.palette.divider)
      .attr('opacity', 0.5);

    const safeDatum: ArcDatum = {
      startAngle: angleScale(-allowedDeviation),
      endAngle: angleScale(allowedDeviation),
    };
    g.append('path')
      .datum(safeDatum)
      .attr('d', arc as unknown as (d: ArcDatum) => string)
      .attr('fill', theme.palette.success.main)
      .attr('opacity', 0.3);

    if (cents !== undefined) {
      const currentValue = Math.max(-maxDeviation, Math.min(maxDeviation, cents));

      const valueDatum: ArcDatum = {
        startAngle: angleScale(0),
        endAngle: angleScale(currentValue),
      };

      g.append('path')
        .datum(valueDatum)
        .attr('d', arc as unknown as (d: ArcDatum) => string)
        .attr('fill', color.main)
        .attr('opacity', 0.8);

      const needleAngle = angleScale(currentValue);
      const needleLength = radius * 0.85;

      const needle = g.append('g')
        .attr('class', 'needle')
        .attr('transform', `rotate(${(needleAngle * 180) / Math.PI})`);

      needle.append('line')
        .attr('x1', 0)
        .attr('y1', 10)
        .attr('x2', 0)
        .attr('y2', -needleLength)
        .attr('stroke', color.main)
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round');

      needle.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 8)
        .attr('fill', color.main);
    }

    const ticks = [-maxDeviation, -allowedDeviation, 0, allowedDeviation, maxDeviation];
    const tickGroup = g.selectAll('.tick')
      .data(ticks)
      .enter()
      .append('g')
      .attr('class', 'tick')
      .attr('transform', (d) => {
        const angle = angleScale(d);
        const x = Math.sin(angle) * (radius + 15);
        const y = -Math.cos(angle) * (radius + 15);
        return `translate(${x}, ${y})`;
      });

    tickGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '10px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text((d) => `${d > 0 ? '+' : ''}${d}`);

  }, [cents, allowedDeviation, status, size, theme]);

  const displayCents = cents !== undefined ? cents.toFixed(2) : '--';
  const color = getStatusColor(cents, allowedDeviation, status);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <svg ref={svgRef} width={size} height={size * 0.6} />
      <Box
        sx={{
          position: 'absolute',
          top: size * 0.35,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: '1.75rem',
            color: color.main,
          }}
        >
          {cents !== undefined && cents > 0 ? '+' : ''}
          {displayCents}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            color: theme.palette.text.secondary,
          }}
        >
          音分
        </Typography>
      </Box>
    </Box>
  );
};

export default CentsGauge;
