import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import { usePipeStore } from '../../hooks/usePipeStore';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { WaveformCanvas } from './WaveformCanvas';
import { TuningAdvicePanel } from './TuningAdvicePanel';
import { SampleHistory } from './SampleHistory';
import { generateTuningAdvice, calculateAverageFrequency } from '../../utils/pitchDetector';
import { calculateCentsDeviation, formatFrequency, formatCents } from '../../utils/centsCalculator';
import { getNoteName } from '../../utils/noteConverter';
import { TuningAdvice } from '../../types';

export const PitchDetectionCenter: React.FC = () => {
  const theme = useTheme();
  const {
    selectedPipeId,
    pipes,
    allowedCentsDeviation,
    writeMeasuredFrequencyFromSession,
    addPitchDetectionSession,
  } = usePipeStore();

  const selectedPipe = useMemo(
    () => pipes.find((p) => p.id === selectedPipeId) || null,
    [pipes, selectedPipeId]
  );

  const [viewMode, setViewMode] = useState<'waveform' | 'spectrum' | 'history'>('waveform');
  const [autoDetect, setAutoDetect] = useState(true);

  const {
    isRecording,
    isSupported,
    error,
    currentResult,
    waveformData,
    samples,
    toggleRecording,
    clearSamples,
  } = usePitchDetection({
    bufferSize: 4096,
    minFrequency: 50,
    maxFrequency: 2000,
    targetFrequency: selectedPipe?.targetFrequency,
  });

  const validSamples = useMemo(
    () => samples.filter((s) => s.confidence > 0.3),
    [samples]
  );

  const avgFrequency = useMemo(() => {
    if (validSamples.length === 0) return 0;
    const freqs = validSamples.map((s) => s.frequency);
    return calculateAverageFrequency(freqs);
  }, [validSamples]);

  const tuningAdvice = useMemo<TuningAdvice | null>(() => {
    if (!selectedPipe || !currentResult || currentResult.frequency <= 0 || currentResult.confidence < 0.3) {
      return null;
    }
    const cents = calculateCentsDeviation(selectedPipe.targetFrequency, currentResult.frequency);
    const { direction, suggestions } = generateTuningAdvice(
      selectedPipe.targetFrequency,
      currentResult.frequency,
      cents,
      allowedCentsDeviation
    );
    return { direction, cents, suggestions };
  }, [selectedPipe, currentResult, allowedCentsDeviation]);

  const avgTuningAdvice = useMemo<TuningAdvice | null>(() => {
    if (!selectedPipe || avgFrequency <= 0 || validSamples.length < 3) {
      return null;
    }
    const cents = calculateCentsDeviation(selectedPipe.targetFrequency, avgFrequency);
    const { direction, suggestions } = generateTuningAdvice(
      selectedPipe.targetFrequency,
      avgFrequency,
      cents,
      allowedCentsDeviation
    );
    return { direction, cents, suggestions };
  }, [selectedPipe, avgFrequency, validSamples.length, allowedCentsDeviation]);

  const displayFrequency = autoDetect ? currentResult?.frequency || 0 : avgFrequency;
  const displayAdvice = autoDetect ? tuningAdvice : avgTuningAdvice;
  const displayConfidence = autoDetect
    ? currentResult?.confidence || 0
    : validSamples.length > 0
    ? validSamples.reduce((sum, s) => sum + s.confidence, 0) / validSamples.length
    : 0;
  const displayStability = autoDetect
    ? currentResult?.stability || 0
    : validSamples.length > 0
    ? validSamples.reduce((sum, s) => sum + s.stability, 0) / validSamples.length
    : 0;

  const handleWriteFrequency = () => {
    if (!selectedPipe || (!currentResult && avgFrequency <= 0)) return;

    const freq = autoDetect ? currentResult?.frequency || 0 : avgFrequency;
    if (freq <= 0) return;

    const sessionId = addPitchDetectionSession({
      pipeId: selectedPipe.id,
      samples: validSamples,
      avgFrequency,
      avgConfidence: displayConfidence,
      avgStability: displayStability,
      finalFrequency: freq,
    });

    writeMeasuredFrequencyFromSession(selectedPipe.id, freq, sessionId);
  };

  const handleViewModeChange = (_event: React.SyntheticEvent, newValue: 'waveform' | 'spectrum' | 'history') => {
    setViewMode(newValue);
  };

  const detectedNote = useMemo(() => {
    if (!currentResult || currentResult.frequency <= 0) return null;
    return getNoteName(currentResult.frequency);
  }, [currentResult]);

  if (!isSupported) {
    return (
      <Box
        sx={{
          p: 2,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Alert severity="warning">
          您的浏览器不支持麦克风录音功能，请使用支持 Web Audio API 的浏览器。
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: isRecording
            ? `linear-gradient(135deg, ${theme.palette.error.main}15 0%, transparent 100%)`
            : 'transparent',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <GraphicEqIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            录音测频中心
          </Typography>
          {isRecording && (
            <Chip
              label="录音中"
              size="small"
              color="error"
              sx={{
                ml: 'auto',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          )}
        </Box>

        {selectedPipe ? (
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            当前音管: {selectedPipe.noteName} · 目标 {formatFrequency(selectedPipe.targetFrequency)}
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            请先选择一根音管
          </Typography>
        )}
      </Box>

      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 2,
            backgroundColor: theme.palette.action.hover,
            borderRadius: 2,
          }}
        >
          {displayFrequency > 0 ? (
            <>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: displayAdvice
                    ? displayAdvice.direction === 'in-tune'
                      ? theme.palette.success.main
                      : displayAdvice.direction === 'sharp'
                      ? theme.palette.error.main
                      : theme.palette.warning.main
                    : theme.palette.text.primary,
                }}
              >
                {displayFrequency.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Hz
                {detectedNote && ' · ' + detectedNote}
                {displayAdvice && ' · ' + formatCents(displayAdvice.cents)}
              </Typography>
            </>
          ) : (
            <>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: theme.palette.text.disabled,
                }}
              >
                --.--
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                Hz · 等待检测
              </Typography>
            </>
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant={isRecording ? 'contained' : 'outlined'}
              color={isRecording ? 'error' : 'primary'}
              startIcon={isRecording ? <MicOffIcon /> : <MicIcon />}
              onClick={toggleRecording}
              size="medium"
            >
              {isRecording ? '停止录音' : '开始录音'}
            </Button>

            <Tooltip title={selectedPipe ? '写入实测频率' : '请先选择音管'}>
              <span>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  onClick={handleWriteFrequency}
                  disabled={
                    !selectedPipe ||
                    displayFrequency <= 0 ||
                    displayConfidence < 0.3 ||
                    isRecording
                  }
                  size="medium"
                >
                  写入频率
                </Button>
              </span>
            </Tooltip>

            <Tooltip title="清除采样">
              <IconButton onClick={clearSamples} size="medium">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
              />
            }
            label={autoDetect ? '实时模式' : '平均模式'}
            sx={{ mt: 1 }}
          />
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={viewMode} onChange={handleViewModeChange}>
            <Tab label="波形" icon={<GraphicEqIcon />} iconPosition="start" value="waveform" />
            <Tab label="频谱" icon={<TuneIcon />} iconPosition="start" value="spectrum" />
            <Tab label="曲线" icon={<HistoryIcon />} iconPosition="start" value="history" />
          </Tabs>
        </Box>

        <Box
          sx={{
            backgroundColor: theme.palette.background.default,
            borderRadius: 1,
            p: 1,
          }}
        >
          <WaveformCanvas
            waveformData={waveformData}
            samples={validSamples.map((s) => ({
              frequency: s.frequency,
              timestamp: s.timestamp,
            }))}
            targetFrequency={selectedPipe?.targetFrequency}
            height={120}
            mode={viewMode}
          />
        </Box>

        <TuningAdvicePanel
          advice={displayAdvice}
          measuredFrequency={displayFrequency || undefined}
          targetFrequency={selectedPipe?.targetFrequency}
          confidence={displayConfidence}
          stability={displayStability}
        />

        <SampleHistory
          samples={validSamples}
          targetFrequency={selectedPipe?.targetFrequency}
        />
      </Box>
    </Box>
  );
};

export default PitchDetectionCenter;
