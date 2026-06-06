import { useState, useRef, useCallback, useEffect } from 'react';
import { PitchDetector, PitchDetectionResult } from '../utils/pitchDetector';
import { FrequencySample } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateCentsDeviation } from '../utils/centsCalculator';

export interface UsePitchDetectionOptions {
  bufferSize?: number;
  minFrequency?: number;
  maxFrequency?: number;
  sampleRate?: number;
  targetFrequency?: number;
}

export function usePitchDetection(options: UsePitchDetectionOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<PitchDetectionResult | null>(null);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [samples, setSamples] = useState<FrequencySample[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PitchDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSampleTimeRef = useRef<number>(0);
  const targetFrequencyRef = useRef<number | undefined>(options.targetFrequency);
  const minFrequencyRef = useRef<number>(options.minFrequency ?? 50);
  const maxFrequencyRef = useRef<number>(options.maxFrequency ?? 2000);
  const bufferSizeRef = useRef<number>(options.bufferSize ?? 2048);

  useEffect(() => {
    targetFrequencyRef.current = options.targetFrequency;
  }, [options.targetFrequency]);

  useEffect(() => {
    minFrequencyRef.current = options.minFrequency ?? 50;
    maxFrequencyRef.current = options.maxFrequency ?? 2000;
    bufferSizeRef.current = options.bufferSize ?? 2048;
  }, [options.minFrequency, options.maxFrequency, options.bufferSize]);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !window.AudioContext) {
      setIsSupported(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('浏览器不支持麦克风录音功能');
      return;
    }

    try {
      setError(null);
      setSamples([]);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const sampleRate = audioContext.sampleRate;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = bufferSizeRef.current * 2;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      detectorRef.current = new PitchDetector(
        sampleRate,
        minFrequencyRef.current,
        maxFrequencyRef.current
      );

      setIsRecording(true);
      lastSampleTimeRef.current = Date.now();

      const analyserLocal = analyser;
      const detectorLocal = detectorRef.current;
      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      const process = () => {
        if (!analyserRef.current || !detectorRef.current) return;

        analyserLocal.getFloatTimeDomainData(dataArray);

        setWaveformData(new Float32Array(dataArray));

        const result = detectorLocal.detect(dataArray);
        setCurrentResult(result);

        const now = Date.now();
        if (result.frequency > 0 && result.confidence > 0.3 && now - lastSampleTimeRef.current >= 100) {
          const sample: FrequencySample = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            frequency: result.frequency,
            confidence: result.confidence,
            stability: result.stability,
            centsDeviation: targetFrequencyRef.current
              ? calculateCentsDeviation(targetFrequencyRef.current, result.frequency)
              : undefined,
          };

          setSamples((prev) => {
            const updated = [...prev, sample];
            return updated.slice(-200);
          });

          lastSampleTimeRef.current = now;
        }

        animationFrameRef.current = requestAnimationFrame(process);
      };

      animationFrameRef.current = requestAnimationFrame(process);
    } catch (err) {
      setError(err instanceof Error ? err.message : '无法访问麦克风');
      setIsRecording(false);
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (microphoneRef.current) {
      try {
        microphoneRef.current.disconnect();
      } catch {
        // ignore
      }
      microphoneRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    detectorRef.current = null;

    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const clearSamples = useCallback(() => {
    setSamples([]);
    setCurrentResult(null);
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isSupported,
    error,
    currentResult,
    waveformData,
    samples,
    startRecording,
    stopRecording,
    toggleRecording,
    clearSamples,
  };
}
