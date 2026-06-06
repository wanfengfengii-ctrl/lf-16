import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { usePipeStore } from '../../hooks/usePipeStore';
import { OperationRecord, OperationType } from '../../types';

interface OperationHistoryPanelProps {
  compact?: boolean;
}

const operationTypeConfig: Record<
  OperationType,
  { icon: React.ReactNode; color: string; label: string }
> = {
  add: { icon: <AddIcon />, color: 'success', label: '添加' },
  remove: { icon: <RemoveIcon />, color: 'error', label: '删除' },
  update: { icon: <EditIcon />, color: 'primary', label: '更新' },
  move: { icon: <SwapHorizIcon />, color: 'info', label: '移动' },
  trim: { icon: <BuildIcon />, color: 'warning', label: '修整' },
  'status-change': { icon: <CheckCircleIcon />, color: 'success', label: '状态变更' },
  'batch-add': { icon: <AddIcon />, color: 'success', label: '批量添加' },
  'batch-verify': { icon: <CheckCircleIcon />, color: 'success', label: '批量复核' },
  import: { icon: <FileDownloadIcon />, color: 'secondary', label: '导入' },
  'threshold-change': { icon: <EditIcon />, color: 'info', label: '阈值调整' },
  'group-change': { icon: <SwapHorizIcon />, color: 'secondary', label: '分组变更' },
};

export const OperationHistoryPanel: React.FC<OperationHistoryPanelProps> = ({
  compact = false,
}) => {
  const theme = useTheme();
  const { operationHistory, pipes, setSelectedPipe, setHighlightedPipes } = usePipeStore();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OperationRecord | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [filterType, setFilterType] = useState<OperationType | 'all'>('all');

  const filteredHistory = useMemo(() => {
    const sorted = [...operationHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (filterType === 'all') return sorted;
    return sorted.filter((r) => r.type === filterType);
  }, [operationHistory, filterType]);

  const handleRecordClick = (record: OperationRecord) => {
    setSelectedRecord(record);
    setDetailOpen(true);

    if (record.pipeIds) {
      setHighlightedPipes(record.pipeIds);
    } else if (record.pipeId) {
      setHighlightedPipes([record.pipeId]);
      setSelectedPipe(record.pipeId);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setHighlightedPipes([]);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handlePlaybackToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setPlaybackIndex(filteredHistory.length - 1);
    }
  };

  const handlePlaybackPrev = () => {
    if (playbackIndex > 0) {
      const nextIndex = playbackIndex - 1;
      setPlaybackIndex(nextIndex);
      const record = filteredHistory[nextIndex];
      if (record?.pipeIds) {
        setHighlightedPipes(record.pipeIds);
      } else if (record?.pipeId) {
        setHighlightedPipes([record.pipeId]);
      }
    }
  };

  const handlePlaybackNext = () => {
    if (playbackIndex < filteredHistory.length - 1) {
      const nextIndex = playbackIndex + 1;
      setPlaybackIndex(nextIndex);
      const record = filteredHistory[nextIndex];
      if (record?.pipeIds) {
        setHighlightedPipes(record.pipeIds);
      } else if (record?.pipeId) {
        setHighlightedPipes([record.pipeId]);
      }
    } else {
      setIsPlaying(false);
    }
  };

  React.useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      if (playbackIndex < filteredHistory.length - 1) {
        handlePlaybackNext();
      } else {
        setIsPlaying(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, playbackIndex, filteredHistory.length]);

  if (compact) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          p: 1.5,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <HistoryIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            操作历史
          </Typography>
          <Chip
            label={operationHistory.length}
            size="small"
            variant="outlined"
            sx={{ ml: 'auto', fontSize: '0.7rem' }}
          />
        </Box>

        <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
          {filteredHistory.slice(0, 10).map((record, index) => {
            const config = operationTypeConfig[record.type];
            return (
              <Box
                key={record.id}
                onClick={() => handleRecordClick(record)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                  px: 1,
                  borderRadius: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  ...(playbackIndex === index && isPlaying
                    ? { backgroundColor: `${theme.palette.primary.main}20` }
                    : {}),
                }}
              >
                <Box sx={{ color: (config.color as string), fontSize: 14 }}>{config.icon}</Box>
                <Typography variant="caption" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.description}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.65rem',
                    color: theme.palette.text.disabled,
                  }}
                >
                  {formatTime(record.timestamp)}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {filteredHistory.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Tooltip title="上一步">
              <IconButton size="small" onClick={handlePlaybackPrev} disabled={playbackIndex === 0}>
                <SkipPreviousIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isPlaying ? '暂停' : '播放'}>
              <IconButton size="small" onClick={handlePlaybackToggle} color="primary">
                {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="下一步">
              <IconButton
                size="small"
                onClick={handlePlaybackNext}
                disabled={playbackIndex >= filteredHistory.length - 1}
              >
                <SkipNextIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxHeight: 400,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            操作历史
          </Typography>
          <Chip
            label={`${operationHistory.length} 条记录`}
            size="small"
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Tabs
          value={filterType}
          onChange={(_, v) => setFilterType(v)}
          sx={{ minHeight: 0, '& .MuiTab-root': { minHeight: 32, py: 0.5 } }}
        >
          <Tab value="all" label="全部" sx={{ minWidth: 60 }} />
          <Tab value="add" label="添加" sx={{ minWidth: 60 }} />
          <Tab value="update" label="更新" sx={{ minWidth: 60 }} />
          <Tab value="trim" label="修整" sx={{ minWidth: 60 }} />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <List dense disablePadding>
            {filteredHistory.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: theme.palette.text.disabled }}>
                <HistoryIcon sx={{ fontSize: 32, opacity: 0.5, mb: 1 }} />
                <Typography variant="body2">暂无操作记录</Typography>
              </Box>
            ) : (
              filteredHistory.map((record) => {
                const config = operationTypeConfig[record.type];
                return (
                  <ListItem
                    key={record.id}
                    disablePadding
                    sx={{
                      mb: 0.5,
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleRecordClick(record)}
                      sx={{
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box sx={{ color: config.color as string }}>{config.icon}</Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {record.description}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.7rem',
                            color: theme.palette.text.disabled,
                          }}
                        >
                          {new Date(record.timestamp).toLocaleString('zh-CN')}
                        </Typography>
                      }
                    />
                    <Chip
                      label={config.label}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: config.color as string,
                        color: config.color as string,
                        fontSize: '0.65rem',
                      }}
                    />
                    </ListItemButton>
                  </ListItem>
                );
              })
            )}
          </List>
        </Box>

        {filteredHistory.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Tooltip title="上一步">
              <IconButton size="small" onClick={handlePlaybackPrev} disabled={playbackIndex === 0}>
                <SkipPreviousIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isPlaying ? '暂停回放' : '播放回放'}>
              <IconButton size="small" onClick={handlePlaybackToggle} color="primary">
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="下一步">
              <IconButton
                size="small"
                onClick={handlePlaybackNext}
                disabled={playbackIndex >= filteredHistory.length - 1}
              >
                <SkipNextIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>操作详情</DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ color: operationTypeConfig[selectedRecord.type].color as string }}>
                  {operationTypeConfig[selectedRecord.type].icon}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedRecord.description}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {new Date(selectedRecord.timestamp).toLocaleString('zh-CN')}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                操作类型
              </Typography>
              <Chip
                label={operationTypeConfig[selectedRecord.type].label}
                size="small"
                sx={{
                  backgroundColor: `${operationTypeConfig[selectedRecord.type].color}15`,
                  color: operationTypeConfig[selectedRecord.type].color as string,
                  mb: 2,
                }}
              />

              {selectedRecord.pipeId && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    关联音管
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {pipes.find((p) => p.id === selectedRecord.pipeId)?.noteName || '已删除'}
                  </Typography>
                </>
              )}

              {selectedRecord.pipeIds && selectedRecord.pipeIds.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    关联音管 ({selectedRecord.pipeIds.length} 根)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {selectedRecord.pipeIds.slice(0, 10).map((id) => {
                      const pipe = pipes.find((p) => p.id === id);
                      return (
                        <Chip
                          key={id}
                          label={pipe?.noteName || '未知'}
                          size="small"
                          variant="outlined"
                        />
                      );
                    })}
                    {selectedRecord.pipeIds.length > 10 && (
                      <Chip
                        label={`+${selectedRecord.pipeIds.length - 10}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </>
              )}

              {selectedRecord.metadata && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    元数据
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: theme.palette.background.default,
                      borderRadius: 1,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.75rem',
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedRecord.metadata, null, 2)}
                    </pre>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>关闭</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OperationHistoryPanel;
