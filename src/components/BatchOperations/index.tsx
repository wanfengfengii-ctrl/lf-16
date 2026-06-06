import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  useTheme,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { usePipeStore } from '../../hooks/usePipeStore';
import { getStatusColor, getStatusText, formatCents } from '../../utils/centsCalculator';
import { noteToFrequency, getNoteName } from '../../utils/noteConverter';
import { PipeStatus } from '../../types';

interface BatchOperationsProps {
  open: boolean;
  onClose: () => void;
  initialTab?: number;
}

interface BatchEntry {
  id: string;
  noteName: string;
  targetFrequency: number;
  slotNumber?: number;
  errors: string[];
}

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  open,
  onClose,
  initialTab = 0,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(initialTab);
  const {
    pipes,
    groups,
    batchAddPipes,
    batchVerifyPipes,
    batchUpdateStatus,
    batchMoveToGroup,
    validateTargetFrequency,
    allowedCentsDeviation,
    checkSlotConflict,
  } = usePipeStore();

  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [selectedPipeIds, setSelectedPipeIds] = useState<string[]>([]);
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<PipeStatus | 'all'>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const filteredPipes = useMemo(() => {
    return pipes.filter((p) => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterGroup !== 'all' && p.groupId !== filterGroup) return false;
      return true;
    });
  }, [pipes, filterStatus, filterGroup]);

  const needsReviewPipes = useMemo(() => {
    return pipes.filter((p) => p.status === 'needs-review');
  }, [pipes]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const validateEntry = (entry: Omit<BatchEntry, 'errors'>, allEntries?: Omit<BatchEntry, 'errors'>[]): string[] => {
    const errors: string[] = [];
    const validation = validateTargetFrequency(entry.targetFrequency);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    if (entry.slotNumber !== undefined && entry.slotNumber !== null) {
      if (entry.slotNumber <= 0) {
        errors.push('槽位号必须大于 0');
      } else {
        const conflictPipe = checkSlotConflict(entry.slotNumber);
        if (conflictPipe) {
          errors.push(`槽位 #${entry.slotNumber} 已被音管 ${conflictPipe.noteName} 占用`);
        }

        if (allEntries) {
          const dupCount = allEntries.filter(
            (e) => e.slotNumber === entry.slotNumber && e.id !== entry.id
          ).length;
          if (dupCount > 0) {
            errors.push(`槽位 #${entry.slotNumber} 在批量数据中重复`);
          }
        }
      }
    }

    return errors;
  };

  const revalidateAllSlots = (entries: BatchEntry[]): BatchEntry[] => {
    return entries.map((entry) => ({
      ...entry,
      errors: validateEntry(entry, entries),
    }));
  };

  const addEntry = () => {
    const newEntry: BatchEntry = {
      id: Date.now().toString() + Math.random(),
      noteName: 'C4',
      targetFrequency: 261.63,
      errors: [],
    };
    const newEntries = [...batchEntries, newEntry];
    setBatchEntries(revalidateAllSlots(newEntries));
  };

  const updateEntry = (id: string, field: keyof BatchEntry, value: string | number) => {
    const updatedEntries = batchEntries.map((entry) => {
      if (entry.id !== id) return entry;
      let updated = { ...entry, [field]: value };

      if (field === 'noteName') {
        const note = value as string;
        const match = note.match(/^([A-G]#?)(\d)$/);
        if (match) {
          const freq = noteToFrequency(match[1], parseInt(match[2]));
          updated = { ...updated, targetFrequency: freq };
        }
      } else if (field === 'targetFrequency') {
        const freq = parseFloat(value as string);
        if (!isNaN(freq) && freq > 0) {
          updated = { ...updated, noteName: getNoteName(freq) };
        }
      }

      return updated;
    });

    setBatchEntries(revalidateAllSlots(updatedEntries));
  };

  const removeEntry = (id: string) => {
    const newEntries = batchEntries.filter((e) => e.id !== id);
    setBatchEntries(revalidateAllSlots(newEntries));
  };

  const parseBulkText = () => {
    const lines = bulkText.split('\n').filter((line) => line.trim());
    const entries: BatchEntry[] = [];

    for (const line of lines) {
      const parts = line.split(/[,，\t\s]+/).filter(Boolean);
      let noteName = '';
      let targetFreq = 0;
      let slotNumber: number | undefined;

      for (const part of parts) {
        const freq = parseFloat(part);
        if (!isNaN(freq) && freq > 0) {
          if (freq < 1000 && Number.isInteger(freq) && freq <= 100) {
            slotNumber = freq;
          } else if (freq > targetFreq) {
            targetFreq = freq;
          }
        } else if (/^[A-G]#?\d$/.test(part)) {
          noteName = part;
        }
      }

      if (targetFreq > 0 && !noteName) {
        noteName = getNoteName(targetFreq);
      }

      if (noteName && !targetFreq) {
        const match = noteName.match(/^([A-G]#?)(\d)$/);
        if (match) {
          targetFreq = noteToFrequency(match[1], parseInt(match[2]));
        }
      }

      if (targetFreq > 0) {
        const entry: BatchEntry = {
          id: Date.now().toString() + Math.random() + entries.length,
          noteName: noteName || getNoteName(targetFreq),
          targetFrequency: targetFreq,
          slotNumber,
          errors: [],
        };
        entries.push(entry);
      }
    }

    setBatchEntries(revalidateAllSlots(entries));
  };

  const handleBatchAdd = () => {
    const validEntries = batchEntries.filter((e) => e.errors.length === 0);
    if (validEntries.length === 0) return;

    batchAddPipes(
      validEntries.map((e) => ({
        targetFrequency: e.targetFrequency,
        noteName: e.noteName,
        slotNumber: e.slotNumber,
      })),
      selectedGroupForAdd || undefined
    );

    setBatchEntries([]);
    setBulkText('');
    onClose();
  };

  const handleSelectAll = () => {
    if (selectedPipeIds.length === filteredPipes.length) {
      setSelectedPipeIds([]);
    } else {
      setSelectedPipeIds(filteredPipes.map((p) => p.id));
    }
  };

  const handleSelectPipe = (id: string) => {
    if (selectedPipeIds.includes(id)) {
      setSelectedPipeIds(selectedPipeIds.filter((i) => i !== id));
    } else {
      setSelectedPipeIds([...selectedPipeIds, id]);
    }
  };

  const handleBatchVerify = () => {
    const idsToVerify = selectedPipeIds.length > 0
      ? selectedPipeIds
      : needsReviewPipes.map((p) => p.id);
    batchVerifyPipes(idsToVerify);
    setSelectedPipeIds([]);
  };

  const handleBatchSetStatus = (status: PipeStatus) => {
    const ids = selectedPipeIds.length > 0 ? selectedPipeIds : filteredPipes.map((p) => p.id);
    batchUpdateStatus(ids, status);
    setSelectedPipeIds([]);
  };

  const handleBatchMoveToGroup = (groupId: string) => {
    const ids = selectedPipeIds.length > 0 ? selectedPipeIds : filteredPipes.map((p) => p.id);
    batchMoveToGroup(ids, groupId === 'none' ? undefined : groupId);
    setSelectedPipeIds([]);
  };

  const validEntriesCount = batchEntries.filter((e) => e.errors.length === 0).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>批量操作</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab icon={<AddIcon />} iconPosition="start" label="批量录入" />
          <Tab icon={<CheckIcon />} iconPosition="start" label="批量复核" />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>目标分组</InputLabel>
                <Select
                  value={selectedGroupForAdd}
                  onChange={(e) => setSelectedGroupForAdd(e.target.value)}
                  label="目标分组"
                >
                  <MenuItem value="">不指定</MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addEntry}
                size="small"
              >
                添加条目
              </Button>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: theme.palette.text.secondary }}>
                批量文本解析（每行一条，支持格式：音名、频率、或音名+频率+槽位）
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                size="small"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`示例：&#10;C4&#10;261.63&#10;D4 293.66 3&#10;E5, 659.25, 15`}
                sx={{ mb: 1 }}
              />
              <Button size="small" onClick={parseBulkText} startIcon={<PlaylistAddIcon />}>
                解析文本
              </Button>
            </Paper>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>序号</TableCell>
                    <TableCell>音名</TableCell>
                    <TableCell>目标频率 (Hz)</TableCell>
                    <TableCell>槽位</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: theme.palette.text.disabled, py: 3 }}>
                        暂无条目，请添加或从文本解析
                      </TableCell>
                    </TableRow>
                  ) : (
                    batchEntries.map((entry, index) => (
                      <TableRow key={entry.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={entry.noteName}
                            onChange={(e) => updateEntry(entry.id, 'noteName', e.target.value)}
                            sx={{ width: 80 }}
                            slotProps={{
                              htmlInput: { style: { fontFamily: "'JetBrains Mono', monospace" } },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={entry.targetFrequency}
                            onChange={(e) =>
                              updateEntry(entry.id, 'targetFrequency', parseFloat(e.target.value))
                            }
                            sx={{ width: 120 }}
                            slotProps={{
                              htmlInput: {
                                style: { fontFamily: "'JetBrains Mono', monospace" },
                                step: 0.01,
                              },
                            }}
                            error={entry.errors.length > 0}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={entry.slotNumber ?? ''}
                            onChange={(e) =>
                              updateEntry(entry.id, 'slotNumber', parseInt(e.target.value) || undefined)
                            }
                            sx={{ width: 80 }}
                            error={entry.errors.some((err) => err.includes('槽位'))}
                            slotProps={{
                              htmlInput: { style: { fontFamily: "'JetBrains Mono', monospace" } },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {entry.errors.length > 0 ? (
                            <Chip
                              label="无效"
                              size="small"
                              color="error"
                              variant="outlined"
                              title={entry.errors.join('; ')}
                            />
                          ) : (
                            <Chip label="有效" size="small" color="success" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="删除">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeEntry(entry.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                共 {batchEntries.length} 条，有效 {validEntriesCount} 条
              </Typography>
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>状态筛选</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as PipeStatus | 'all')}
                  label="状态筛选"
                >
                  <MenuItem value="all">全部</MenuItem>
                  <MenuItem value="tuning">调校中</MenuItem>
                  <MenuItem value="verified">已定音</MenuItem>
                  <MenuItem value="needs-review">待复核</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>分组筛选</InputLabel>
                <Select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  label="分组筛选"
                >
                  <MenuItem value="all">全部分组</MenuItem>
                  <MenuItem value="none">未分组</MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ flex: 1 }} />

              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={handleBatchVerify}
                disabled={selectedPipeIds.length === 0 && needsReviewPipes.length === 0}
              >
                批量通过
                {selectedPipeIds.length > 0 ? ` (${selectedPipeIds.length})` : ''}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ alignSelf: 'center', color: theme.palette.text.secondary }}>
                批量设置状态:
              </Typography>
              <Button size="small" variant="outlined" onClick={() => handleBatchSetStatus('tuning')}>
                设为调校中
              </Button>
              <Button size="small" variant="outlined" color="success" onClick={() => handleBatchSetStatus('verified')}>
                设为已定音
              </Button>
              <Button size="small" variant="outlined" color="warning" onClick={() => handleBatchSetStatus('needs-review')}>
                设为待复核
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ alignSelf: 'center', color: theme.palette.text.secondary }}>
                批量移动到分组:
              </Typography>
              <Button size="small" variant="outlined" onClick={() => handleBatchMoveToGroup('none')}>
                未分组
              </Button>
              {groups.map((g) => (
                <Button
                  key={g.id}
                  size="small"
                  variant="outlined"
                  onClick={() => handleBatchMoveToGroup(g.id)}
                  sx={{ borderColor: g.color, color: g.color, '&:hover': { borderColor: g.color, backgroundColor: `${g.color}10` } }}
                >
                  {g.name}
                </Button>
              ))}
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={
                          filteredPipes.length > 0 &&
                          selectedPipeIds.length === filteredPipes.length
                        }
                        indeterminate={
                          selectedPipeIds.length > 0 &&
                          selectedPipeIds.length < filteredPipes.length
                        }
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>键位</TableCell>
                    <TableCell>音名</TableCell>
                    <TableCell>目标频率</TableCell>
                    <TableCell>实测偏差</TableCell>
                    <TableCell>状态</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPipes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: theme.palette.text.disabled, py: 3 }}>
                        没有符合条件的音管
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPipes.map((pipe) => {
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
                          onClick={() => handleSelectPipe(pipe.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={selectedPipeIds.includes(pipe.id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleSelectPipe(pipe.id)}
                            />
                          </TableCell>
                          <TableCell>#{pipe.keyPosition}</TableCell>
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
                            {formatCents(pipe.centsDeviation)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusText(pipe.status)}
                              size="small"
                              sx={{
                                backgroundColor: color.main,
                                color: '#fff',
                                fontSize: '0.7rem',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                共 {filteredPipes.length} 条，已选择 {selectedPipeIds.length} 条
                {needsReviewPipes.length > 0 && (
                  <span style={{ marginLeft: 8 }}>
                    待复核 {needsReviewPipes.length} 条
                  </span>
                )}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        {tabValue === 0 && (
          <Button
            variant="contained"
            onClick={handleBatchAdd}
            disabled={validEntriesCount === 0}
            startIcon={<AddIcon />}
          >
            批量添加 ({validEntriesCount})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BatchOperations;
