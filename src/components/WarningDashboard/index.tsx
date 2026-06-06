import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { usePipeStore } from '../../hooks/usePipeStore';
import { WarningType } from '../../types';
import { getStatusColor } from '../../utils/centsCalculator';

interface WarningDashboardProps {
  compact?: boolean;
}

export const WarningDashboard: React.FC<WarningDashboardProps> = ({ compact = false }) => {
  const theme = useTheme();
  const {
    warnings,
    pipes,
    resolveWarning,
    refreshWarnings,
    setSelectedPipe,
    allowedCentsDeviation,
  } = usePipeStore();

  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterType, setFilterType] = useState<WarningType | 'all'>('all');

  const unresolvedWarnings = useMemo(() => {
    let result = warnings.filter((w) => !w.resolved);

    if (filterSeverity !== 'all') {
      result = result.filter((w) => w.severity === filterSeverity);
    }

    if (filterType !== 'all') {
      result = result.filter((w) => w.type === filterType);
    }

    return result.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [warnings, filterSeverity, filterType]);

  const stats = useMemo(() => {
    const unresolved = warnings.filter((w) => !w.resolved);
    return {
      total: unresolved.length,
      high: unresolved.filter((w) => w.severity === 'high').length,
      medium: unresolved.filter((w) => w.severity === 'medium').length,
      low: unresolved.filter((w) => w.severity === 'low').length,
    };
  }, [warnings]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <ErrorIcon />;
      case 'medium':
        return <WarningIcon />;
      case 'low':
        return <InfoIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeText = (type: WarningType) => {
    switch (type) {
      case 'slot-conflict':
        return '槽位冲突';
      case 'excessive-deviation':
        return '偏差过大';
      case 'no-measured-frequency':
        return '无实测数据';
      case 'long-pending':
        return '长期待处理';
      case 'retest-failed':
        return '复测失败';
      case 'unassigned-workstation':
        return '未分配工位';
      default:
        return type;
    }
  };

  const handlePipeClick = (pipeId: string) => {
    setSelectedPipe(pipeId);
  };

  const handleResolve = (warningId: string) => {
    resolveWarning(warningId);
  };

  const handleRefresh = () => {
    refreshWarnings();
  };

  if (compact) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            异常预警
          </Typography>
          <Tooltip title="刷新预警">
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Chip
            label={`${stats.total} 个`}
            size="small"
            color={stats.total > 0 ? 'error' : 'default'}
            variant="outlined"
          />
          {stats.high > 0 && (
            <Chip label={`高 ${stats.high}`} size="small" color="error" variant="outlined" />
          )}
          {stats.medium > 0 && (
            <Chip label={`中 ${stats.medium}`} size="small" color="warning" variant="outlined" />
          )}
        </Box>

        {unresolvedWarnings.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 2,
              color: theme.palette.success.main,
            }}
          >
            <CheckIcon sx={{ fontSize: 28, mb: 0.5 }} />
            <Typography variant="caption">暂无异常</Typography>
          </Box>
        ) : (
          <List sx={{ py: 0, maxHeight: 200, overflow: 'auto' }}>
            {unresolvedWarnings.slice(0, 5).map((warning) => {
              const pipe = pipes.find((p) => p.id === warning.pipeId);
              return (
                <ListItem
                  key={warning.id}
                  sx={{
                    py: 0.5,
                    px: 0,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      borderRadius: 1,
                    },
                  }}
                  onClick={() => pipe && handlePipeClick(pipe.id)}
                >
                  <ListItemAvatar sx={{ minWidth: 32 }}>
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: `${
                          warning.severity === 'high'
                            ? theme.palette.error.main
                            : warning.severity === 'medium'
                            ? theme.palette.warning.main
                            : theme.palette.info.main
                        }20`,
                        color:
                          warning.severity === 'high'
                            ? theme.palette.error.main
                            : warning.severity === 'medium'
                            ? theme.palette.warning.main
                            : theme.palette.info.main,
                      }}
                    >
                      {getSeverityIcon(warning.severity)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {pipe?.noteName || '未知'}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          color: theme.palette.text.secondary,
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {getTypeText(warning.type)}
                      </Typography>
                    }
                    sx={{ my: 0 }}
                  />
                </ListItem>
              );
            })}
            {unresolvedWarnings.length > 5 && (
              <ListItem sx={{ py: 0.5, px: 0, justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  还有 {unresolvedWarnings.length - 5} 个预警...
                </Typography>
              </ListItem>
            )}
          </List>
        )}
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
          background: `linear-gradient(135deg, ${theme.palette.error.main}10 0%, transparent 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WarningIcon sx={{ color: theme.palette.error.main }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            异常音管预警看板
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="刷新预警">
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: theme.palette.error.main,
              }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              高优 {stats.high}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: theme.palette.warning.main,
              }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              中优 {stats.medium}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: theme.palette.info.main,
              }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              低优 {stats.low}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
            共 {stats.total} 个异常
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>严重程度</InputLabel>
          <Select
            value={filterSeverity}
            label="严重程度"
            onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="high">高</MenuItem>
            <MenuItem value="medium">中</MenuItem>
            <MenuItem value="low">低</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>预警类型</InputLabel>
          <Select
            value={filterType}
            label="预警类型"
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          >
            <MenuItem value="all">全部类型</MenuItem>
            <MenuItem value="excessive-deviation">偏差过大</MenuItem>
            <MenuItem value="no-measured-frequency">无实测数据</MenuItem>
            <MenuItem value="slot-conflict">槽位冲突</MenuItem>
            <MenuItem value="retest-failed">复测失败</MenuItem>
            <MenuItem value="unassigned-workstation">未分配工位</MenuItem>
            <MenuItem value="long-pending">长期待处理</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />

        {unresolvedWarnings.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<CheckIcon />}
            onClick={() => {
              unresolvedWarnings.forEach((w) => resolveWarning(w.id));
            }}
          >
            全部标记已处理
          </Button>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
        {unresolvedWarnings.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.palette.success.main,
            }}
          >
            <CheckIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              全部正常！
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              没有检测到异常音管
            </Typography>
          </Box>
        ) : (
          <List>
            {unresolvedWarnings.map((warning, index) => {
              const pipe = pipes.find((p) => p.id === warning.pipeId);
              const color = pipe
                ? getStatusColor(pipe.centsDeviation, allowedCentsDeviation, pipe.status)
                : null;

              return (
                <React.Fragment key={warning.id}>
                  {index > 0 && <Divider variant="inset" />}
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 1,
                      borderRadius: 1,
                      mb: 0.5,
                      backgroundColor:
                        warning.severity === 'high'
                          ? `${theme.palette.error.main}05`
                          : 'transparent',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${
                            warning.severity === 'high'
                              ? theme.palette.error.main
                              : warning.severity === 'medium'
                              ? theme.palette.warning.main
                              : theme.palette.info.main
                          }15`,
                          color:
                            warning.severity === 'high'
                              ? theme.palette.error.main
                              : warning.severity === 'medium'
                              ? theme.palette.warning.main
                              : theme.palette.info.main,
                        }}
                      >
                        {getSeverityIcon(warning.severity)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {pipe ? (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                              onClick={() => handlePipeClick(pipe.id)}
                            >
                              <MusicNoteIcon
                                sx={{ fontSize: 16, color: color?.main }}
                              />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {pipe.noteName}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="subtitle2">未知音管</Typography>
                          )}
                          <Chip
                            label={getTypeText(warning.type)}
                            size="small"
                            variant="outlined"
                            color={getSeverityColor(warning.severity)}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {warning.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.secondary, mt: 0.5, display: 'block' }}
                          >
                            {new Date(warning.timestamp).toLocaleString('zh-CN')}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {pipe && (
                        <Tooltip title="查看音管">
                          <IconButton
                            size="small"
                            onClick={() => handlePipeClick(pipe.id)}
                          >
                            <MusicNoteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="标记已处理">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleResolve(warning.id)}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default WarningDashboard;
