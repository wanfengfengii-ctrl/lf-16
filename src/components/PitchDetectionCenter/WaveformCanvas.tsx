import React, { useRef, useEffect } from 'react';
import { useTheme } from '@mui/material';

interface WaveformCanvasProps {
  waveformData: Float32Array | null;
  samples?: Array<{ frequency: number; timestamp: string }>;
  targetFrequency?: number;
  height?: number;
  mode?: 'waveform' | 'spectrum' | 'history';
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  waveformData,
  samples = [],
  targetFrequency,
  height = 120,
  mode = 'waveform',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = height;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = theme.palette.background.default;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    if (mode === 'waveform' && waveformData) {
      drawWaveform(ctx, waveformData, displayWidth, displayHeight);
    } else if (mode === 'spectrum' && waveformData) {
      drawSpectrum(ctx, waveformData, displayWidth, displayHeight);
    } else if (mode === 'history') {
      drawHistory(ctx, samples, targetFrequency, displayWidth, displayHeight);
    }
  }, [waveformData, samples, targetFrequency, height, mode, theme]);

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number
  ) => {
    const centerY = height / 2;

    ctx.strokeStyle = theme.palette.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.palette.primary.main);
    gradient.addColorStop(0.5, theme.palette.primary.light);
    gradient.addColorStop(1, theme.palette.primary.main);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const step = data.length / width;
    for (let i = 0; i < width; i++) {
      const index = Math.floor(i * step);
      const value = data[index] || 0;
      const y = centerY + value * centerY * 0.8;

      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();
  };

  const drawSpectrum = (
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    width: number,
    height: number
  ) => {
    const n = data.length;
    const spectrum = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n - i; j++) {
        sum += data[j] * data[j + i];
      }
      spectrum[i] = sum;
    }

    const maxVal = Math.max(...Array.from(spectrum.slice(0, Math.floor(n / 2))));

    const barCount = Math.floor(width / 3);
    const barWidth = width / barCount;

    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor((i / barCount) * (n / 2));
      const val = spectrum[idx] / maxVal;
      const barHeight = val * height * 0.9;

      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, theme.palette.primary.dark);
      gradient.addColorStop(0.5, theme.palette.primary.main);
      gradient.addColorStop(1, theme.palette.primary.light);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        i * barWidth + 1,
        height - barHeight,
        barWidth - 2,
        barHeight
      );
    }
  };

  const drawHistory = (
    ctx: CanvasRenderingContext2D,
    historySamples: Array<{ frequency: number; timestamp: string }>,
    target: number | undefined,
    width: number,
    height: number
  ) => {
    if (historySamples.length === 0) return;

    const freqs = historySamples.map((s) => s.frequency);
    const minFreq = Math.min(...freqs) * 0.99;
    const maxFreq = Math.max(...freqs) * 1.01;

    const range = maxFreq - minFreq || 1;
    const padding = 20;

    if (target) {
      const targetY = padding + (1 - (target - minFreq) / range) * (height - padding * 2);
      ctx.strokeStyle = theme.palette.success.main;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(width, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = theme.palette.success.main;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(target.toFixed(1) + ' Hz', 4, targetY - 4);
    }

    if (historySamples.length < 2) return;

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, theme.palette.primary.light);
    gradient.addColorStop(1, theme.palette.primary.main);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    historySamples.forEach((sample, i) => {
      const x = (i / (historySamples.length - 1)) * width;
      const y = padding + (1 - (sample.frequency - minFreq) / range) * (height - padding * 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    historySamples.forEach((sample, i) => {
      const x = (i / (historySamples.length - 1)) * width;
      const y = padding + (1 - (sample.frequency - minFreq) / range) * (height - padding * 2);

      ctx.fillStyle = theme.palette.primary.main;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    const avgFreq = freqs.reduce((a, b) => a + b, 0) / freqs.length;
    const avgY = padding + (1 - (avgFreq - minFreq) / range) * (height - padding * 2);

    ctx.strokeStyle = theme.palette.warning.main;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, avgY);
    ctx.lineTo(width, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = theme.palette.warning.main;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('平均: ' + avgFreq.toFixed(2) + ' Hz', width - 4, avgY - 4);
    ctx.textAlign = 'left';
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: height,
        display: 'block',
        borderRadius: 8,
        backgroundColor: theme.palette.background.default,
      }}
    />
  );
};

export default WaveformCanvas;
