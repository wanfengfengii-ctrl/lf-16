import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import { TrimRecord } from '../../types';
import { formatFrequency, formatCents } from '../../utils/centsCalculator';
import BuildIcon from '@mui/icons-material/Build';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface TrimHistoryProps {
  records: TrimRecord[];
  targetFrequency: number;
}

export const TrimHistory: React.FC<TrimHistoryProps> = ({ records, targetFrequency }) => {
  const theme = useTheme();

  const calculateCents = (freq: number) => {
    return 1200 * Math.log2(freq / targetFrequency);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <BuildIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          修整历史
        </Typography>
        <Typography
          variant="caption"
          sx={{
            ml: 'auto',
            color: theme.palette.text.secondary,
          }}
        >
          {records.length} 条记录
        </Typography>
      </Box>

      {records.length === 0 ? (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            color: theme.palette.text.disabled,
            fontStyle: 'italic',
            fontSize: '0.875rem',
          }}
        >
          暂无修整记录
        </Box>
      ) : (
        <List
          dense
          sx={{
            maxHeight: 200,
            overflow: 'auto',
            bgcolor: theme.palette.background.default,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {records.slice().reverse().map((record, index) => {
            const beforeCents = calculateCents(record.beforeFrequency);
            const afterCents = calculateCents(record.afterFrequency);
            const diffCents = afterCents - beforeCents;

            return (
              <React.Fragment key={record.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            color: theme.palette.error.main,
                            textDecoration: 'line-through',
                          }}
                        >
                          {formatCents(beforeCents)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          →
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            color: theme.palette.success.main,
                            fontWeight: 600,
                          }}
                        >
                          {formatCents(afterCents)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 'auto',
                            color:
                              diffCents < 0
                                ? theme.palette.success.main
                                : theme.palette.error.main,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {diffCents > 0 ? '+' : ''}
                          {diffCents.toFixed(1)} c
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          {formatFrequency(record.beforeFrequency)} →{' '}
                          {formatFrequency(record.afterFrequency)}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5,
                          }}
                        >
                          <AccessTimeIcon
                            sx={{ fontSize: 12, color: theme.palette.text.disabled }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(record.timestamp)}
                          </Typography>
                        </Box>
                        {record.description && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              color: theme.palette.text.primary,
                            }}
                          >
                            {record.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default TrimHistory;
