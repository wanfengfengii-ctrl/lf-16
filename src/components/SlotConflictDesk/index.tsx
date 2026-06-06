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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { usePipeStore } from '../../hooks/usePipeStore';
import { getStatusColor, formatCents } from '../../utils/centsCalculator';

interface SlotConflictDeskProps {
  open: boolean;
  onClose: () => void;
}

export const SlotConflictDesk: React.FC<SlotConflictDeskProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const {
    pipes,
    slotConflicts,
    detectSlotConflicts,
    resolveSlotConflict,
    allowedCentsDeviation,
    setSelectedPipe,
  } = usePipeStore();

  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);

  const unresolvedConflicts = useMemo(() => {
    return slotConflicts.filter((c) => !c.resolved);
  }, [slotConflicts]);

  const getConflictPipes = (pipeIds: string[]) => {
    return pipeIds
      .map((id) => pipes.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  };

  const handleDetectConflicts = () => {
    detectSlotConflicts();
  };

  const handleResolve = (conflictId: string, keepPipeId: string) => {
    resolveSlotConflict(conflictId, keepPipeId);
    setSelectedConflictId(null);
  };

  const handlePipeClick = (pipeId: string) => {
    setSelectedPipe(pipeId);
  };

  const stats = useMemo(() => {
    const total = unresolvedConflicts.length;
    const highPriority = unresolvedConflicts.filter((c) => c.pipeIds.length > 2).length;
    return { total, highPriority };
  }, [unresolvedConflicts]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            槽位冲突处理台
          </Typography>
          {unresolvedConflicts.length > 0 && (
            <Chip
              label={`${unresolvedConflicts.length} 个冲突`}
              size="small"
              color="error"
              sx={{ ml: 1 }}
            />
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="重新检测">
            <IconButton size="small" onClick={handleDetectConflicts}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="关闭">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`总冲突数: ${stats.total}`}
            color="error"
            variant="outlined"
            size="small"
          />
          <Chip
            label={`高优先级: ${stats.highPriority}`}
            color="warning"
            variant="outlined"
            size="small"
          />
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<RefreshIcon />}
            onClick={handleDetectConflicts}
          >
            检测冲突
          </Button>
        </Box>

        {unresolvedConflicts.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              color: theme.palette.text.secondary,
            }}
          >
            <CheckIcon sx={{ fontSize: 48, color: theme.palette.success.main, mb: 2 }} />
            <Typography variant="body1">暂无槽位冲突</Typography>
            <Typography variant="caption">所有音管槽位分配正常</Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {unresolvedConflicts.map((conflict, index) => {
              const conflictPipes = getConflictPipes(conflict.pipeIds);
              const isExpanded = selectedConflictId === conflict.id;

              return (
                <React.Fragment key={conflict.id}>
                  {index > 0 && <Divider variant="inset" />}
                  <ListItem
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      backgroundColor: isExpanded
                        ? `${theme.palette.error.main}08`
                        : 'transparent',
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        setSelectedConflictId(isExpanded ? null : conflict.id)
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                          <WarningIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              槽位 #{conflict.slotNumber}
                            </Typography>
                            <Chip
                              label={`${conflict.pipeIds.length} 根音管`}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            检测于 {new Date(conflict.detectedAt).toLocaleString('zh-CN')}
                          </Typography>
                        }
                      />
                      <Chip
                        label={isExpanded ? '收起' : '展开'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {isExpanded && (
                      <Box sx={{ mt: 2, ml: 7 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                          该槽位被 {conflict.pipeIds.length} 根音管占用，请选择要保留的音管
                        </Alert>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {conflictPipes.map((pipe) => {
                            const color = getStatusColor(
                              pipe.centsDeviation,
                              allowedCentsDeviation,
                              pipe.status
                            );
                            return (
                              <Box
                                key={pipe.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  p: 1.5,
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 1,
                                  backgroundColor: theme.palette.background.paper,
                                  '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                  },
                                }}
                              >
                                <MusicNoteIcon sx={{ color: color.main }} />
                                <Box sx={{ flex: 1 }}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {pipe.noteName}
                                    </Typography>
                                    <Chip
                                      label={
                                        pipe.status === 'verified'
                                          ? '已定音'
                                          : pipe.status === 'needs-review'
                                          ? '待复核'
                                          : '调校中'
                                      }
                                      size="small"
                                      sx={{
                                        backgroundColor: color.main,
                                        color: '#fff',
                                        fontSize: '0.65rem',
                                        height: 20,
                                      }}
                                    />
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: theme.palette.text.secondary,
                                      fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                  >
                                    目标: {pipe.targetFrequency.toFixed(2)} Hz
                                    {pipe.centsDeviation !== undefined &&
                                      ` · 偏差: ${formatCents(pipe.centsDeviation)}`}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handlePipeClick(pipe.id)}
                                  >
                                    查看详情
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    startIcon={<CheckIcon />}
                                    onClick={() =>
                                      handleResolve(conflict.id, pipe.id)
                                    }
                                  >
                                    保留此管
                                  </Button>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlotConflictDesk;
