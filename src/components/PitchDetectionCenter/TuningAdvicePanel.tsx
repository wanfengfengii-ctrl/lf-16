import React from 'react';
import { Box, Typography, useTheme, Chip, LinearProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import { TuningAdvice } from '../../types';
import { formatCents, formatFrequency } from '../../utils/centsCalculator';

interface TuningAdvicePanelProps {
  advice: TuningAdvice | null;
  measuredFrequency?: number;
  targetFrequency?: number;
  confidence?: number;
  stability?: number;
}

export const TuningAdvicePanel: React.FC<TuningAdvicePanelProps> = ({
  advice,
  measuredFrequency,
  targetFrequency,
  confidence = 0,
  stability = 0,
}) => {
  const theme = useTheme();

  const getDirectionColor = () => {
    if (!advice) return theme.palette.text.secondary;
    switch (advice.direction) {
      case 'sharp':
        return theme.palette.error.main;
      case 'flat':
        return theme.palette.warning.main;
      case 'in-tune':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getDirectionIcon = () => {
    if (!advice) return null;
    switch (advice.direction) {
      case 'sharp':
        return <TrendingUpIcon sx={{ fontSize: 20 }} />;
      case 'flat':
        return <TrendingDownIcon sx={{ fontSize: 20 }} />;
      case 'in-tune':
        return <CheckCircleIcon sx={{ fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const getDirectionText = () => {
    if (!advice) return '等待检测...';
    switch (advice.direction) {
      case 'sharp':
        return '音偏高';
      case 'flat':
        return '音偏低';
      case 'in-tune':
        return '音准良好';
      default:
        return '--';
    }
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <BuildIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          校音建议
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
            color: getDirectionColor(),
          }}
        >
          {getDirectionIcon()}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {getDirectionText()}
          </Typography>
          {advice && (
            <Chip
              label={formatCents(advice.cents)}
              size="small"
              sx={{
                backgroundColor: getDirectionColor() + '20',
                color: getDirectionColor(),
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              目标频率
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
            >
              {targetFrequency ? formatFrequency(targetFrequency) : '--'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              实测频率
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                color: advice ? getDirectionColor() : 'inherit',
              }}
            >
              {measuredFrequency ? formatFrequency(measuredFrequency) : '--'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            置信度
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {(confidence * 100).toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={confidence * 100}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.palette.divider,
            '& .MuiLinearProgress-bar': {
              backgroundColor:
                confidence > 0.7
                  ? theme.palette.success.main
                  : confidence > 0.4
                  ? theme.palette.warning.main
                  : theme.palette.error.main,
            },
          }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            稳定度
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {(stability * 100).toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={stability * 100}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.palette.divider,
            '& .MuiLinearProgress-bar': {
              backgroundColor:
                stability > 0.8
                  ? theme.palette.success.main
                  : stability > 0.5
                  ? theme.palette.warning.main
                  : theme.palette.error.main,
            },
          }}
        />
      </Box>

      {advice && advice.suggestions.length > 0 && (
        <Box>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
            修整建议
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {advice.suggestions.map((suggestion, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 1,
                  p: 1,
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.primary, fontSize: '0.8rem' }}
                >
                  {index + 1}. {suggestion}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TuningAdvicePanel;
