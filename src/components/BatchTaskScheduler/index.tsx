import React, { useState, useMemo } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  LinearProgress,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import PersonIcon from '@mui/icons-material/Person';
import { usePipeStore } from '../../hooks/usePipeStore';
import { TaskStatus, TaskPriority } from '../../types';
import * as centsCalc from '../../utils/centsCalculator';

interface BatchTaskSchedulerProps {
  open: boolean;
  onClose: () => void;
}

export const BatchTaskScheduler: React.FC<BatchTaskSchedulerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const {
    batchTasks,
    pipes,
    workstations,
    craftsmen,
    createBatchTask,
    removeBatchTask,
    startBatchTask,
    completeBatchTask,
    assignTaskToWorkstation,
    assignTaskToCraftsman,
    updateTaskProgress,
    groups,
    allowedCentsDeviation,
  } = usePipeStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [selectedPipeIdsForTask, setSelectedPipeIdsForTask] = useState<string[]>([]);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    let result = [...batchTasks];
    if (filterStatus !== 'all') {
      result = result.filter((t) => t.status === filterStatus);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [batchTasks, filterStatus]);

  const filteredPipesForSelection = useMemo(() => {
    let result = pipes.filter((p) => !p.taskId);
    if (filterGroup !== 'all') {
      result = result.filter((p) => p.groupId === filterGroup);
    }
    return result;
  }, [pipes, filterGroup]);

  const handleCreateTask = () => {
    if (!newTaskName.trim() || selectedPipeIdsForTask.length === 0) return;
    createBatchTask(newTaskName.trim(), selectedPipeIdsForTask, newTaskPriority, newTaskDesc.trim() || undefined);
    setCreateDialogOpen(false);
    setNewTaskName('');
    setNewTaskDesc('');
    setNewTaskPriority('medium');
    setSelectedPipeIdsForTask([]);
  };

  const handleSelectAllPipes = () => {
    if (selectedPipeIdsForTask.length === filteredPipesForSelection.length) {
      setSelectedPipeIdsForTask([]);
    } else {
      setSelectedPipeIdsForTask(filteredPipesForSelection.map((p) => p.id));
    }
  };

  const handleSelectPipe = (pipeId: string) => {
    if (selectedPipeIdsForTask.includes(pipeId)) {
      setSelectedPipeIdsForTask(selectedPipeIdsForTask.filter((id) => id !== pipeId));
    } else {
      setSelectedPipeIdsForTask([...selectedPipeIdsForTask, pipeId]);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return '紧急';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'in-progress': return '进行中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
    }
  };

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'default';
      case 'in-progress': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'error';
    }
  };

  const taskStats = useMemo(() => {
    const total = batchTasks.length;
    const pending = batchTasks.filter((t) => t.status === 'pending').length;
    const inProgress = batchTasks.filter((t) => t.status === 'in-progress').length;
    const completed = batchTasks.filter((t) => t.status === 'completed').length;
    return { total, pending, inProgress, completed };
  }, [batchTasks]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return batchTasks.find((t) => t.id === selectedTaskId) || null;
  }, [selectedTaskId, batchTasks]);

  const selectedTaskPipes = useMemo(() => {
    if (!selectedTask) return [];
    return selectedTask.pipeIds
      .map((id) => pipes.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  }, [selectedTask, pipes]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            批量校音任务编排
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            onClick={() => setCreateDialogOpen(true)}
          >
            新建任务
          </Button>
          <Tooltip title="关闭">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, p: 2, flexWrap: 'wrap' }}>
          <Chip label={`总计 ${taskStats.total}`} variant="outlined" size="small" />
          <Chip label={`待处理 ${taskStats.pending}`} color="default" variant="outlined" size="small" />
          <Chip label={`进行中 ${taskStats.inProgress}`} color="primary" variant="outlined" size="small" />
          <Chip label={`已完成 ${taskStats.completed}`} color="success" variant="outlined" size="small" />
          <Box sx={{ flexGrow: 1 }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>状态筛选</InputLabel>
            <Select
              value={filterStatus}
              label="状态筛选"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">全部</MenuItem>
              <MenuItem value="pending">待处理</MenuItem>
              <MenuItem value="in-progress">进行中</MenuItem>
              <MenuItem value="completed">已完成</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', height: 'calc(80vh - 140px)' }}>
          <Box sx={{ width: '50%', borderRight: `1px solid ${theme.palette.divider}`, overflow: 'auto' }}>
            {filteredTasks.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme.palette.text.secondary,
                }}
              >
                <AssignmentIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body1">暂无任务</Typography>
                <Typography variant="caption">点击上方按钮创建新任务</Typography>
              </Box>
            ) : (
              <List>
                {filteredTasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    {index > 0 && <Divider variant="inset" />}
                    <ListItem
                      sx={{
                        cursor: 'pointer',
                        backgroundColor:
                          selectedTaskId === task.id
                            ? `${theme.palette.primary.main}08`
                            : 'transparent',
                        '&:hover': {
                          backgroundColor: `${theme.palette.action.hover}`,
                        },
                      }}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              task.status === 'completed'
                                ? theme.palette.success.main
                                : task.status === 'in-progress'
                                ? theme.palette.primary.main
                                : theme.palette.grey[500],
                          }}
                        >
                          {task.status === 'completed' ? (
                            <CheckIcon />
                          ) : task.status === 'in-progress' ? (
                            <PlayArrowIcon />
                          ) : (
                            <AssignmentIcon />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {task.name}
                            </Typography>
                            <Chip
                              label={getPriorityText(task.priority)}
                              size="small"
                              color={getPriorityColor(task.priority)}
                              variant="outlined"
                              icon={<PriorityHighIcon sx={{ fontSize: 14 }} />}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                              {task.pipeIds.length} 根音管 · 创建于 {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                            </Typography>
                            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={task.progress}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
                                {task.progress}%
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <Chip
                        label={getStatusText(task.status)}
                        size="small"
                        color={getTaskStatusColor(task.status)}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>

          <Box sx={{ width: '50%', overflow: 'auto', p: 2 }}>
            {!selectedTask ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme.palette.text.secondary,
                }}
              >
                <Typography variant="body1">选择任务查看详情</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {selectedTask.name}
                  </Typography>
                  {selectedTask.description && (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      {selectedTask.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={getStatusText(selectedTask.status)}
                      size="small"
                      color={getTaskStatusColor(selectedTask.status)}
                    />
                    <Chip
                      label={`优先级: ${getPriorityText(selectedTask.priority)}`}
                      size="small"
                      color={getPriorityColor(selectedTask.priority)}
                      variant="outlined"
                    />
                    <Chip
                      label={`${selectedTask.pipeIds.length} 根音管`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedTask.status === 'pending' && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => startBatchTask(selectedTask.id)}
                    >
                      开始任务
                    </Button>
                  )}
                  {selectedTask.status === 'in-progress' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckIcon />}
                      onClick={() => completeBatchTask(selectedTask.id)}
                    >
                      标记完成
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => {
                      removeBatchTask(selectedTask.id);
                      setSelectedTaskId(null);
                    }}
                  >
                    删除任务
                  </Button>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    分配信息
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel>分配工位</InputLabel>
                      <Select
                        value={selectedTask.assignedWorkstationId || ''}
                        label="分配工位"
                        onChange={(e: SelectChangeEvent<string>) =>
                          assignTaskToWorkstation(selectedTask.id, e.target.value || undefined)
                        }
                      >
                        <MenuItem value="">未分配</MenuItem>
                        {workstations.map((ws) => (
                          <MenuItem key={ws.id} value={ws.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  backgroundColor: ws.color,
                                }}
                              />
                              {ws.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel>分配制作师</InputLabel>
                      <Select
                        value={selectedTask.assignedCraftsmanId || ''}
                        label="分配制作师"
                        onChange={(e: SelectChangeEvent<string>) =>
                          assignTaskToCraftsman(selectedTask.id, e.target.value || undefined)
                        }
                      >
                        <MenuItem value="">未分配</MenuItem>
                        {craftsmen.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon sx={{ fontSize: 16 }} />
                              {c.name}
                              {c.role && (
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                  ({c.role})
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    进度 {selectedTask.progress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={selectedTask.progress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        updateTaskProgress(
                          selectedTask.id,
                          Math.max(0, selectedTask.progress - 10)
                        )
                      }
                    >
                      -10%
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        updateTaskProgress(
                          selectedTask.id,
                          Math.min(100, selectedTask.progress + 10)
                        )
                      }
                    >
                      +10%
                    </Button>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    音管列表 ({selectedTaskPipes.length})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>音名</TableCell>
                          <TableCell>目标频率</TableCell>
                          <TableCell>偏差</TableCell>
                          <TableCell>状态</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedTaskPipes.map((pipe) => {
                          const color = centsCalc.getStatusColor(
                            pipe.centsDeviation,
                            allowedCentsDeviation,
                            pipe.status
                          );
                          return (
                            <TableRow key={pipe.id} hover>
                              <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                                {pipe.noteName}
                              </TableCell>
                              <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {pipe.targetFrequency.toFixed(2)} Hz
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  color: color.main,
                                  fontWeight: 600,
                                }}
                              >
                                {pipe.centsDeviation !== undefined
                                  ? centsCalc.formatCents(pipe.centsDeviation)
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    pipe.status === 'verified'
                                      ? '已定音'
                                      : pipe.status === 'needs-review'
                                      ? '待复核'
                                      : pipe.status === 'pending-retest'
                                      ? '待复测'
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
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>创建批量校音任务</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="任务名称"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              size="small"
              autoFocus
            />
            <TextField
              fullWidth
              label="任务描述（可选）"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              size="small"
              multiline
              rows={2}
            />
            <FormControl size="small">
              <InputLabel>优先级</InputLabel>
              <Select
                value={newTaskPriority}
                label="优先级"
                onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
              >
                <MenuItem value="low">低</MenuItem>
                <MenuItem value="medium">中</MenuItem>
                <MenuItem value="high">高</MenuItem>
                <MenuItem value="urgent">紧急</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  选择音管 ({selectedPipeIdsForTask.length})
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>分组筛选</InputLabel>
                  <Select
                    value={filterGroup}
                    label="分组筛选"
                    onChange={(e) => setFilterGroup(e.target.value)}
                  >
                    <MenuItem value="all">全部分组</MenuItem>
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {filteredPipesForSelection.length === 0 ? (
                <Alert severity="info">没有可分配的音管</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={
                              filteredPipesForSelection.length > 0 &&
                              selectedPipeIdsForTask.length === filteredPipesForSelection.length
                            }
                            indeterminate={
                              selectedPipeIdsForTask.length > 0 &&
                              selectedPipeIdsForTask.length < filteredPipesForSelection.length
                            }
                            onChange={handleSelectAllPipes}
                          />
                        </TableCell>
                        <TableCell>音名</TableCell>
                        <TableCell>目标频率</TableCell>
                        <TableCell>状态</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPipesForSelection.map((pipe) => {
                        const color = centsCalc.getStatusColor(
                          pipe.centsDeviation,
                          allowedCentsDeviation,
                          pipe.status
                        );
                        return (
                          <TableRow
                            key={pipe.id}
                            hover
                            selected={selectedPipeIdsForTask.includes(pipe.id)}
                            onClick={() => handleSelectPipe(pipe.id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={selectedPipeIdsForTask.includes(pipe.id)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleSelectPipe(pipe.id)}
                              />
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                              {pipe.noteName}
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {pipe.targetFrequency.toFixed(2)} Hz
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleCreateTask}
            disabled={!newTaskName.trim() || selectedPipeIdsForTask.length === 0}
            startIcon={<AddIcon />}
          >
            创建任务 ({selectedPipeIdsForTask.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default BatchTaskScheduler;
