import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Tabs,
  Tab,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { usePipeStore } from '../../hooks/usePipeStore';
import { getStatusColor, formatCents } from '../../utils/centsCalculator';

interface WorkstationManagerProps {
  open: boolean;
  onClose: () => void;
  initialTab?: number;
}

export const WorkstationManager: React.FC<WorkstationManagerProps> = ({
  open,
  onClose,
  initialTab = 0,
}) => {
  const theme = useTheme();
  const {
    workstations,
    craftsmen,
    pipes,
    operationHistory,
    addWorkstation,
    removeWorkstation,
    addCraftsman,
    removeCraftsman,
    getWorkstationStats,
    getCraftsmanStats,
    batchAssignToWorkstation,
    batchAssignToCraftsman,
    allowedCentsDeviation,
  } = usePipeStore();

  const [tabValue, setTabValue] = useState(initialTab);
  const [addWsDialogOpen, setAddWsDialogOpen] = useState(false);
  const [addCraftsmanDialogOpen, setAddCraftsmanDialogOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsColor, setNewWsColor] = useState('#3b82f6');
  const [newCraftsmanName, setNewCraftsmanName] = useState('');
  const [newCraftsmanRole, setNewCraftsmanRole] = useState('');
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [selectedCraftsmanId, setSelectedCraftsmanId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignType, setAssignType] = useState<'workstation' | 'craftsman'>('workstation');
  const [selectedPipeIds, setSelectedPipeIds] = useState<string[]>([]);

  const workstationStats = useMemo(() => getWorkstationStats(), [getWorkstationStats]);
  const craftsmanStats = useMemo(() => getCraftsmanStats(), [getCraftsmanStats]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddWorkstation = () => {
    if (!newWsName.trim()) return;
    addWorkstation(newWsName.trim(), newWsColor, newWsDesc.trim() || undefined);
    setAddWsDialogOpen(false);
    setNewWsName('');
    setNewWsDesc('');
    setNewWsColor('#3b82f6');
  };

  const handleAddCraftsman = () => {
    if (!newCraftsmanName.trim()) return;
    addCraftsman(newCraftsmanName.trim(), newCraftsmanRole.trim() || undefined);
    setAddCraftsmanDialogOpen(false);
    setNewCraftsmanName('');
    setNewCraftsmanRole('');
  };

  const openAssignDialog = (type: 'workstation' | 'craftsman', id: string) => {
    setAssignType(type);
    if (type === 'workstation') {
      setSelectedWsId(id);
    } else {
      setSelectedCraftsmanId(id);
    }
    setSelectedPipeIds([]);
    setAssignDialogOpen(true);
  };

  const handleAssign = () => {
    if (selectedPipeIds.length === 0) return;

    if (assignType === 'workstation' && selectedWsId) {
      batchAssignToWorkstation(selectedPipeIds, selectedWsId);
    } else if (assignType === 'craftsman' && selectedCraftsmanId) {
      batchAssignToCraftsman(selectedPipeIds, selectedCraftsmanId);
    }

    setAssignDialogOpen(false);
    setSelectedPipeIds([]);
  };

  const unassignedPipes = useMemo(() => {
    if (assignType === 'workstation') {
      return pipes.filter((p) => !p.workstationId);
    } else {
      return pipes.filter((p) => !p.assignedCraftsmanId);
    }
  }, [pipes, assignType]);

  const recentOperations = useMemo(() => {
    return [...operationHistory]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [operationHistory]);

  const wsColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const currentAssignmentName = useMemo(() => {
    if (assignType === 'workstation' && selectedWsId) {
      return workstations.find((w) => w.id === selectedWsId)?.name || '';
    } else if (assignType === 'craftsman' && selectedCraftsmanId) {
      return craftsmen.find((c) => c.id === selectedCraftsmanId)?.name || '';
    }
    return '';
  }, [assignType, selectedWsId, selectedCraftsmanId, workstations, craftsmen]);

  const selectedWsStats = useMemo(() => {
    if (!selectedWsId) return null;
    return workstationStats.find((s) => s.workstationId === selectedWsId) || null;
  }, [selectedWsId, workstationStats]);

  const selectedWsPipes = useMemo(() => {
    if (!selectedWsId) return [];
    return pipes.filter((p) => p.workstationId === selectedWsId);
  }, [selectedWsId, pipes]);

  const selectedCraftsmanPipes = useMemo(() => {
    if (!selectedCraftsmanId) return [];
    return pipes.filter((p) => p.assignedCraftsmanId === selectedCraftsmanId);
  }, [selectedCraftsmanId, pipes]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIndIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            工位与制作师管理
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="关闭">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ px: 2, pt: 1 }}>
          <Tab icon={<PrecisionManufacturingIcon />} iconPosition="start" label="工位管理" />
          <Tab icon={<PersonIcon />} iconPosition="start" label="制作师管理" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="操作留痕" />
        </Tabs>

        <Box sx={{ height: 'calc(85vh - 140px)', overflow: 'auto' }}>
          {tabValue === 0 && (
            <Box sx={{ display: 'flex', height: '100%' }}>
              <Box sx={{ width: '40%', borderRight: `1px solid ${theme.palette.divider}`, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    工位列表
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={() => setAddWsDialogOpen(true)}
                  >
                    新增
                  </Button>
                </Box>
                <List>
                  {workstationStats.map((stat, index) => {
                    const ws = workstations.find((w) => w.id === stat.workstationId);
                    const isSelected = selectedWsId === stat.workstationId;
                    return (
                      <React.Fragment key={stat.workstationId}>
                        {index > 0 && <Divider variant="inset" />}
                        <ListItem
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: isSelected
                              ? `${theme.palette.primary.main}08`
                              : 'transparent',
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                              backgroundColor: `${theme.palette.action.hover}`,
                            },
                          }}
                          onClick={() => setSelectedWsId(stat.workstationId)}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: ws?.color || theme.palette.grey[500],
                              }}
                            >
                              <PrecisionManufacturingIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {stat.workstationName}
                                </Typography>
                                <Chip
                                  label={`${stat.totalPipes} 根`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                  label={`已定音 ${stat.verifiedPipes}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: theme.palette.success.main,
                                    color: '#fff',
                                    fontSize: '0.65rem',
                                    height: 18,
                                  }}
                                />
                                <Chip
                                  label={`调校中 ${stat.tuningPipes}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: theme.palette.grey[500],
                                    color: '#fff',
                                    fontSize: '0.65rem',
                                    height: 18,
                                  }}
                                />
                                <Chip
                                  label={`待复核 ${stat.needsReviewPipes}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: theme.palette.warning.main,
                                    color: '#fff',
                                    fontSize: '0.65rem',
                                    height: 18,
                                  }}
                                />
                              </Box>
                            }
                          />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="分配音管">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAssignDialog('workstation', stat.workstationId);
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="删除">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeWorkstation(stat.workstationId);
                                  if (selectedWsId === stat.workstationId) {
                                    setSelectedWsId(null);
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
                </List>
              </Box>

              <Box sx={{ width: '60%', p: 2, overflow: 'auto' }}>
                {!selectedWsId ? (
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
                    <Typography variant="body1">选择工位查看详情</Typography>
                  </Box>
                ) : (
                  <Box>
                    {selectedWsStats && (
                      <>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                          {selectedWsStats.workstationName}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                          <Box sx={{ p: 2, backgroundColor: theme.palette.success.main + '10', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                              {selectedWsStats.verifiedPipes}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              已定音
                            </Typography>
                          </Box>
                          <Box sx={{ p: 2, backgroundColor: theme.palette.warning.main + '10', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                              {selectedWsStats.needsReviewPipes}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              待复核
                            </Typography>
                          </Box>
                          <Box sx={{ p: 2, backgroundColor: theme.palette.info.main + '10', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                              {selectedWsStats.avgDeviation.toFixed(1)}c
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              平均偏差
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    )}

                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      音管列表 ({selectedWsPipes.length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
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
                          {selectedWsPipes.map((pipe) => {
                            const color = getStatusColor(
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
                                    ? formatCents(pipe.centsDeviation)
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
                )}
              </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ display: 'flex', height: '100%' }}>
              <Box sx={{ width: '40%', borderRight: `1px solid ${theme.palette.divider}`, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    制作师列表
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={() => setAddCraftsmanDialogOpen(true)}
                  >
                    新增
                  </Button>
                </Box>
                <List>
                  {craftsmanStats.map((stat, index) => {
                    const craftsman = craftsmen.find((c) => c.id === stat.craftsmanId);
                    const isSelected = selectedCraftsmanId === stat.craftsmanId;
                    return (
                      <React.Fragment key={stat.craftsmanId}>
                        {index > 0 && <Divider variant="inset" />}
                        <ListItem
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: isSelected
                              ? `${theme.palette.primary.main}08`
                              : 'transparent',
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                              backgroundColor: `${theme.palette.action.hover}`,
                            },
                          }}
                          onClick={() => setSelectedCraftsmanId(stat.craftsmanId)}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {stat.craftsmanName}
                                </Typography>
                                {craftsman?.role && (
                                  <Chip
                                    label={craftsman.role}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                已完成 {stat.completedTasks} 根 · 平均偏差 {stat.avgDeviation.toFixed(1)}c
                              </Typography>
                            }
                          />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="分配音管">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAssignDialog('craftsman', stat.craftsmanId);
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="删除">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCraftsman(stat.craftsmanId);
                                  if (selectedCraftsmanId === stat.craftsmanId) {
                                    setSelectedCraftsmanId(null);
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
                </List>
              </Box>

              <Box sx={{ width: '60%', p: 2, overflow: 'auto' }}>
                {!selectedCraftsmanId ? (
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
                    <Typography variant="body1">选择制作师查看详情</Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      {craftsmen.find((c) => c.id === selectedCraftsmanId)?.name}
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                      <Box sx={{ p: 2, backgroundColor: theme.palette.primary.main + '10', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                          {selectedCraftsmanPipes.length}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          负责音管
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, backgroundColor: theme.palette.success.main + '10', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                          {craftsmanStats.find((s) => s.craftsmanId === selectedCraftsmanId)?.completedTasks || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          已完成
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, backgroundColor: theme.palette.info.main + '10', borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                          {craftsmanStats.find((s) => s.craftsmanId === selectedCraftsmanId)?.avgDeviation.toFixed(1) || 0}c
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          平均偏差
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      负责音管列表 ({selectedCraftsmanPipes.length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
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
                          {selectedCraftsmanPipes.map((pipe) => {
                            const color = getStatusColor(
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
                                    ? formatCents(pipe.centsDeviation)
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
                )}
              </Box>
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                操作记录
              </Typography>
              <List>
                {recentOperations.map((record, index) => (
                  <React.Fragment key={record.id}>
                    {index > 0 && <Divider variant="inset" />}
                    <ListItem sx={{ py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main + '20' }}>
                          <HistoryIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {record.description}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {new Date(record.timestamp).toLocaleString('zh-CN')}
                          </Typography>
                        }
                      />
                      <Chip
                        label={record.type}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </DialogContent>

      <Dialog open={addWsDialogOpen} onClose={() => setAddWsDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>新增工位</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="工位名称"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              size="small"
              autoFocus
            />
            <TextField
              fullWidth
              label="工位描述（可选）"
              value={newWsDesc}
              onChange={(e) => setNewWsDesc(e.target.value)}
              size="small"
            />
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                选择颜色
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {wsColors.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setNewWsColor(color)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: newWsColor === color ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      boxShadow: newWsColor === color ? `0 0 0 2px ${theme.palette.primary.main}40` : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWsDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleAddWorkstation} disabled={!newWsName.trim()} startIcon={<AddIcon />}>
            创建
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addCraftsmanDialogOpen} onClose={() => setAddCraftsmanDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>新增制作师</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="制作师姓名"
              value={newCraftsmanName}
              onChange={(e) => setNewCraftsmanName(e.target.value)}
              size="small"
              autoFocus
            />
            <TextField
              fullWidth
              label="职位（可选）"
              value={newCraftsmanRole}
              onChange={(e) => setNewCraftsmanRole(e.target.value)}
              size="small"
              placeholder="如：调音师、高级调音师、质检师"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCraftsmanDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleAddCraftsman} disabled={!newCraftsmanName.trim()} startIcon={<AddIcon />}>
            添加
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          分配音管到 {assignType === 'workstation' ? '工位' : '制作师'}：{currentAssignmentName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {unassignedPipes.length === 0 ? (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, py: 4, textAlign: 'center' }}>
                没有可分配的音管
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    选择要分配的音管（已选 {selectedPipeIds.length}）
                  </Typography>
                  <Button
                    size="small"
                    onClick={() =>
                      setSelectedPipeIds(
                        selectedPipeIds.length === unassignedPipes.length
                          ? []
                          : unassignedPipes.map((p) => p.id)
                      )
                    }
                  >
                    {selectedPipeIds.length === unassignedPipes.length ? '取消全选' : '全选'}
                  </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={
                              unassignedPipes.length > 0 &&
                              selectedPipeIds.length === unassignedPipes.length
                            }
                            indeterminate={
                              selectedPipeIds.length > 0 &&
                              selectedPipeIds.length < unassignedPipes.length
                            }
                            onChange={() =>
                              setSelectedPipeIds(
                                selectedPipeIds.length === unassignedPipes.length
                                  ? []
                                  : unassignedPipes.map((p) => p.id)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>音名</TableCell>
                        <TableCell>目标频率</TableCell>
                        <TableCell>状态</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unassignedPipes.map((pipe) => {
                        const color = getStatusColor(
                          pipe.centsDeviation,
                          allowedCentsDeviation,
                          pipe.status
                        );
                        return (
                          <TableRow
                            key={pipe.id}
                            hover
                            selected={selectedPipeIds.includes(pipe.id)}
                            onClick={() =>
                              setSelectedPipeIds((prev) =>
                                prev.includes(pipe.id)
                                  ? prev.filter((id) => id !== pipe.id)
                                  : [...prev, pipe.id]
                              )
                            }
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={selectedPipeIds.includes(pipe.id)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() =>
                                  setSelectedPipeIds((prev) =>
                                    prev.includes(pipe.id)
                                      ? prev.filter((id) => id !== pipe.id)
                                      : [...prev, pipe.id]
                                  )
                                }
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
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={selectedPipeIds.length === 0}
            startIcon={<AddIcon />}
          >
            分配 ({selectedPipeIds.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default WorkstationManager;
