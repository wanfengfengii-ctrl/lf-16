import React from 'react';
import { Box, Typography, useTheme, List, ListItem, ListItemText, Chip } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { FrequencySample } from '../../types';
import { formatFrequency, formatCents } from '../../utils/centsCalculator';

interface SampleHistoryProps {
  samples: FrequencySample[];
  targetFrequency?: number;
  maxItems?: number;
}

export const SampleHistory: React.FC<SampleHistoryProps> = ({
  samples,
  targetFrequency,
  maxItems = 20,
}) => {
  const theme = useTheme();

  const displaySamples = samples.slice(-maxItems).reverse();

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return theme.palette.success.main;
    if (confidence > 0.4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getStabilityColor = (stability: number) => {
    if (stability > 0.8) return theme.palette.success.main;
    if (stability > 0.5) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const stats = React.useMemo(() => {
    if (samples.length === 0) {
      return { avg: 0, min: 0, max: 0, std: 0, count: 0 };
    }

    const validSamples = samples.filter((s) => s.confidence > 0.3);
    if (validSamples.length === 0) {
      return { avg: 0, min: 0, max: 0, std: 0, count: 0 };
    }

    const freqs = validSamples.map((s) => s.frequency);
    const avg = freqs.reduce((a, b) => a + b, 0) / freqs.length;
    const min = Math.min(...freqs);
    const max = Math.max(...freqs);
    const variance = freqs.reduce((sum, f) => sum + Math.pow(f - avg, 2), 0) / freqs.length;
    const std = Math.sqrt(variance);

    return { avg, min, max, std, count: validSamples.length };
  }, [samples]);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <HistoryIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          采样记录
        </Typography>
        <Chip
          label={samples.length + ' 个'}
          size="small"
          sx={{
            ml: 'auto',
            backgroundColor: theme.palette.action.hover,
            fontSize: '0.7rem',
            height: 20,
          }}
        />
      </Box>

      {samples.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.action.hover,
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                平均频率
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                }}
              >
                {stats.count > 0 ? formatFrequency(stats.avg) : '--'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                波动范围
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}
              >
                {stats.count > 0
                  ? stats.min.toFixed(2) + ' ~ ' + stats.max.toFixed(2) + ' Hz'
                  : '--'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                标准差
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}
              >
                {stats.count > 0 ? stats.std.toFixed(3) + ' Hz' : '--'}
              </Typography>
            </Box>
            {targetFrequency && stats.count > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  平均偏差
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.8rem',
                    color:
                      Math.abs(
                        1200 * Math.log2(stats.avg / targetFrequency)
                      ) <= 5
                        ? theme.palette.success.main
                        : theme.palette.warning.main,
                  }}
                >
                  {formatCents(1200 * Math.log2(stats.avg / targetFrequency))}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 100 }}>
        {displaySamples.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3,
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              暂无采样记录
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {displaySamples.map((sample, index) => (
              <ListItem
                key={sample.id}
                sx={{
                  px: 2,
                  py: 0.5,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  '&:last-child': { borderBottom: 'none' },
                  backgroundColor:
                    index === 0 ? theme.palette.action.selected : 'transparent',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: index === 0 ? 600 : 400,
                        }}
                      >
                        {sample.frequency.toFixed(2)} Hz
                      </Typography>
                      {sample.centsDeviation !== undefined && (
                        <Chip
                          label={formatCents(sample.centsDeviation)}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.65rem',
                            fontFamily: "'JetBrains Mono', monospace",
                            backgroundColor:
                              Math.abs(sample.centsDeviation) <= 5
                                ? theme.palette.success.main + '20'
                                : theme.palette.warning.main + '20',
                            color:
                              Math.abs(sample.centsDeviation) <= 5
                                ? theme.palette.success.main
                                : theme.palette.warning.main,
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {formatTime(sample.timestamp)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: getConfidenceColor(sample.confidence),
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        置信度 {(sample.confidence * 100).toFixed(0)}%
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: getStabilityColor(sample.stability),
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        稳定度 {(sample.stability * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default SampleHistory;
