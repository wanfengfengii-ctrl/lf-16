export interface PitchDetectionResult {
  frequency: number;
  confidence: number;
  stability: number;
}

export class PitchDetector {
  private sampleRate: number;
  private minFrequency: number;
  private maxFrequency: number;

  constructor(sampleRate: number, minFreq = 50, maxFreq = 2000) {
    this.sampleRate = sampleRate;
    this.minFrequency = minFreq;
    this.maxFrequency = maxFreq;
  }

  detect(buffer: Float32Array): PitchDetectionResult {
    const rms = this.calculateRMS(buffer);
    if (rms < 0.01) {
      return { frequency: 0, confidence: 0, stability: 0 };
    }

    const autocorr = this.autocorrelation(buffer);
    const { peakIndex, peakValue } = this.findPeak(autocorr);

    if (peakIndex < 2) {
      return { frequency: 0, confidence: 0, stability: 0 };
    }

    const refinedIndex = this.parabolicInterpolation(autocorr, peakIndex);
    const frequency = this.sampleRate / refinedIndex;

    if (frequency < this.minFrequency || frequency > this.maxFrequency) {
      return { frequency: 0, confidence: 0, stability: 0 };
    }

    const confidence = Math.min(1, peakValue / autocorr[0]);
    const stability = this.calculateStability(buffer, frequency);

    return { frequency, confidence, stability };
  }

  private autocorrelation(buffer: Float32Array): Float32Array {
    const n = buffer.length;
    const result = new Float32Array(n);

    for (let lag = 0; lag < n; lag++) {
      let sum = 0;
      for (let i = 0; i < n - lag; i++) {
        sum += buffer[i] * buffer[i + lag];
      }
      result[lag] = sum;
    }

    return result;
  }

  private findPeak(autocorr: Float32Array): { peakIndex: number; peakValue: number } {
    const minLag = Math.floor(this.sampleRate / this.maxFrequency);
    const maxLag = Math.floor(this.sampleRate / this.minFrequency);

    let peakIndex = 0;
    let peakValue = -Infinity;

    for (let i = minLag; i < Math.min(maxLag, autocorr.length - 1); i++) {
      if (autocorr[i] > autocorr[i - 1] && autocorr[i] >= autocorr[i + 1] && autocorr[i] > peakValue) {
        peakValue = autocorr[i];
        peakIndex = i;
      }
    }

    return { peakIndex, peakValue };
  }

  private parabolicInterpolation(autocorr: Float32Array, peakIndex: number): number {
    if (peakIndex <= 0 || peakIndex >= autocorr.length - 1) {
      return peakIndex;
    }

    const y0 = autocorr[peakIndex - 1];
    const y1 = autocorr[peakIndex];
    const y2 = autocorr[peakIndex + 1];

    const denominator = 2 * (y0 - 2 * y1 + y2);
    if (denominator === 0) {
      return peakIndex;
    }

    const shift = (y0 - y2) / denominator;
    return peakIndex + shift;
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  private calculateStability(buffer: Float32Array, frequency: number): number {
    const period = Math.round(this.sampleRate / frequency);
    if (period <= 0 || period * 3 > buffer.length) {
      return 0;
    }

    let similaritySum = 0;
    let count = 0;

    for (let i = 0; i < buffer.length - period * 2; i++) {
      const diff = Math.abs(buffer[i] - buffer[i + period]);
      const amp = Math.max(Math.abs(buffer[i]), Math.abs(buffer[i + period]));
      if (amp > 0.01) {
        similaritySum += 1 - diff / amp;
        count++;
      }
    }

    return count > 0 ? Math.max(0, Math.min(1, similaritySum / count)) : 0;
  }

  setSampleRate(rate: number): void {
    this.sampleRate = rate;
  }

  setFrequencyRange(minFreq: number, maxFreq: number): void {
    this.minFrequency = minFreq;
    this.maxFrequency = maxFreq;
  }
}

export function calculateAverageFrequency(samples: number[]): number {
  if (samples.length === 0) return 0;

  const sorted = [...samples].sort((a, b) => a - b);
  const start = Math.floor(sorted.length * 0.1);
  const end = Math.ceil(sorted.length * 0.9);
  const trimmed = sorted.slice(start, end);

  if (trimmed.length === 0) return 0;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export function generateTuningAdvice(
  targetFrequency: number,
  measuredFrequency: number,
  cents: number,
  allowedDeviation: number
): {
  direction: 'sharp' | 'flat' | 'in-tune';
  cents: number;
  suggestions: string[];
} {
  const absCents = Math.abs(cents);
  const direction: 'sharp' | 'flat' | 'in-tune' =
    absCents <= allowedDeviation ? 'in-tune' : cents > 0 ? 'sharp' : 'flat';

  const suggestions: string[] = [];

  if (direction === 'in-tune') {
    suggestions.push('音高在允许偏差范围内，音管状态良好。');
  } else if (direction === 'sharp') {
    suggestions.push('音偏高 ' + absCents.toFixed(1) + ' 音分，需要将音管锉短。');
    if (absCents > 50) {
      suggestions.push('偏差较大，建议先检查音管是否有异物堵塞或长度误差。');
    }
    if (absCents > 10 && absCents <= 50) {
      suggestions.push('建议逐步调整，每次微调后复测。');
    }
  } else {
    suggestions.push('音偏低 ' + absCents.toFixed(1) + ' 音分，需要将音管加长或加焊锡。');
    if (absCents > 50) {
      suggestions.push('偏差较大，建议检查音管是否有漏气或破损。');
    }
    if (absCents > 10 && absCents <= 50) {
      suggestions.push('建议逐步加锡调整，每次微调后复测。');
    }
  }

  const freqDiff = measuredFrequency - targetFrequency;
  if (Math.abs(freqDiff) > 0.01) {
    suggestions.push(
      '频率差: ' + (freqDiff > 0 ? '+' : '') + freqDiff.toFixed(2) + ' Hz'
    );
  }

  return { direction, cents, suggestions };
}
