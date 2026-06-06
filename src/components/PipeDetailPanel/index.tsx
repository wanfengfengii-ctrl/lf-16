import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize,
  Alert,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { usePipeStore } from '../../hooks/usePipeStore';
import { PipeStatus, Pipe } from '../../types';
import { CentsGauge } from './CentsGauge';
import { TrimHistory } from './TrimHistory';
import {
  getStatusColor,
  getStatusText,
  formatFrequency,
} from '../../utils/centsCalculator';
import { getNoteName } from '../../utils/noteConverter';

export const PipeDetailPanel: React.FC = () => {
  const theme = useTheme();
  const {
    selectedPipeId,
    pipes,
    groups,
    allowedCentsDeviation,
    updatePipeFrequency,
    updateTargetFrequency,
    updatePipeStatus,
    updatePipe,
    addTrimRecord,
    removePipe,
    validateFrequency,
    validateTargetFrequency,
    movePipeToGroup,
    isSlotOccupied,
    getPipesBySlot,
  } = usePipeStore();

  const [trimDialogOpen, setTrimDialogOpen] = useState(false);
  const [trimDescription, setTrimDescription] = useState('');
  const [newMeasuredFreq, setNewMeasuredFreq] = useState('');
  const [targetFreqInput, setTargetFreqInput] = useState('');
  const [measuredFreqInput, setMeasuredFreqInput] = useState('');
  const [targetFreqError, setTargetFreqError] = useState<string[]>([]);
  const [targetFreqWarning, setTargetFreqWarning] = useState<string[]>([]);
  const [measuredFreqError, setMeasuredFreqError] = useState<string[]>([]);
  const [measuredFreqWarning, setMeasuredFreqWarning] = useState<string[]>([]);

  const selectedPipe = pipes.find((p) => p.id === selectedPipeId);

  const slotConflictInfo = useMemo(() => {
    if (!selectedPipe || selectedPipe.slotNumber === undefined) {
      return { hasConflict: false, conflictingPipes: [] as Pipe[] };
    }
    const pipesInSlot = getPipesBySlot(selectedPipe.slotNumber).filter(
      (p) => p.id !== selectedPipe.id
    );
    return {
      hasConflict: pipesInSlot.length > 0,
      conflictingPipes: pipesInSlot,
    };
  }, [selectedPipe?.id, selectedPipe?.slotNumber, getPipesBySlot]);

  useEffect(() => {
    if (selectedPipe) {
      setTargetFreqInput(selectedPipe.targetFrequency.toFixed(2));
      setMeasuredFreqInput(selectedPipe.measuredFrequency?.toFixed(2) ?? '');
      setTargetFreqError([]);
      setTargetFreqWarning([]);
      setMeasuredFreqError([]);
      setMeasuredFreqWarning([]);
    }
  }, [selectedPipe?.id, selectedPipe?.targetFrequency, selectedPipe?.measuredFrequency]);

  const handleTargetFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTargetFreqInput(value);

    const freq = parseFloat(value);
    if (value === '' || isNaN(freq)) {
      setTargetFreqError(['请输入有效数字']);
      setTargetFreqWarning([]);
      return;
    }

    const validation = validateTargetFrequency(freq);
    setTargetFreqError(validation.errors);
    setTargetFreqWarning(validation.warnings);
  };

  const handleTargetFreqBlur = () => {
    if (!selectedPipe) return;
    const value = parseFloat(targetFreqInput);
    const validation = validateTargetFrequency(value);

    if (!validation.valid) {
      setTargetFreqInput(selectedPipe.targetFrequency.toFixed(2));
      setTargetFreqError([]);
      setTargetFreqWarning([]);
      return;
    }

    updateTargetFrequency(selectedPipe.id, value);
    const newNoteName = getNoteName(value);
    updatePipe(selectedPipe.id, { noteName: newNoteName });
  };

  const handleTargetFreqKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTargetFreqBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleMeasuredFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMeasuredFreqInput(value);

    if (value === '') {
      setMeasuredFreqError([]);
      setMeasuredFreqWarning([]);
      return;
    }

    const freq = parseFloat(value);
    if (isNaN(freq)) {
      setMeasuredFreqError(['请输入有效数字']);
      setMeasuredFreqWarning([]);
      return;
    }

    const validation = validateFrequency(freq, selectedPipe?.targetFrequency);
    setMeasuredFreqError(validation.errors);
    setMeasuredFreqWarning(validation.warnings);
  };

  const handleMeasuredFreqBlur = () => {
    if (!selectedPipe) return;
    const value = parseFloat(measuredFreqInput);

    if (measuredFreqInput === '') {
      return;
    }

    const validation = validateFrequency(value, selectedPipe.targetFrequency);
    if (!validation.valid) {
      setMeasuredFreqInput(selectedPipe.measuredFrequency?.toFixed(2) ?? '');
      setMeasuredFreqError([]);
      setMeasuredFreqWarning([]);
      return;
    }

    updatePipeFrequency(selectedPipe.id, value);
  };

  const handleMeasuredFreqKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMeasuredFreqBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleStatusChange = (e: SelectChangeEvent<PipeStatus>) => {
    if (selectedPipe) {
      updatePipeStatus(selectedPipe.id, e.target.value as PipeStatus);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedPipe) {
      updatePipe(selectedPipe.id, { notes: e.target.value });
    }
  };

  const handleGroupChange = (e: SelectChangeEvent<string>) => {
    if (selectedPipe) {
      const groupId = e.target.value;
      movePipeToGroup(selectedPipe.id, groupId === 'none' ? undefined : groupId);
    }
  };

  const handleSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPipe) return;
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      updatePipe(selectedPipe.id, { slotNumber: value });
    }
  };

  const handleAddTrim = () => {
    if (selectedPipe && selectedPipe.measuredFrequency) {
      setNewMeasuredFreq(selectedPipe.measuredFrequency.toString());
      setTrimDialogOpen(true);
    }
  };

  const handleConfirmTrim = () => {
    if (selectedPipe && selectedPipe.measuredFrequency) {
      const newFreq = parseFloat(newMeasuredFreq);
      if (!isNaN(newFreq) && newFreq > 0) {
        addTrimRecord(selectedPipe.id, {
          beforeFrequency: selectedPipe.measuredFrequency,
          afterFrequency: newFreq,
          description: trimDescription,
        });
        updatePipeFrequency(selectedPipe.id, newFreq);
        setTrimDialogOpen(false);
        setTrimDescription('');
        setNewMeasuredFreq('');
      }
    }
  };

  const handleRemovePipe = () => {
    if (selectedPipe) {
      removePipe(selectedPipe.id);
    }
  };

  const currentGroup = useMemo(() => {
    if (!selectedPipe?.groupId) return null;
    return groups.find((g) => g.id === selectedPipe.groupId);
  }, [selectedPipe, groups]);

  if (!selectedPipe) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.text.secondary,
          p: 3,
        }}
      >
        <Typography variant="body1" sx={{ mb: 1 }}>
          选择一根音管查看详情
        </Typography>
        <Typography variant="caption">点击左侧音管矩阵中的音管</Typography>
      </Box>
    );
  }

  const color = getStatusColor(
    selectedPipe.centsDeviation,
    allowedCentsDeviation,
    selectedPipe.status
  );

  const textFieldSx = {
    '& .MuiInputBase-input': {
      fontFamily: "'JetBrains Mono', monospace",
    },
  };

  const hasErrors = targetFreqError.length > 0 || measuredFreqError.length > 0;
  const hasWarnings = targetFreqWarning.length > 0 || measuredFreqWarning.length > 0;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${color.bg} 0%, transparent 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mr: 2 }}>
            {selectedPipe.noteName}
          </Typography>
          <Chip
            label={getStatusText(selectedPipe.status)}
            size="small"
            sx={{
              backgroundColor: color.main,
              color: '#fff',
              fontWeight: 500,
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          键位 #{selectedPipe.keyPosition}
          {selectedPipe.slotNumber && ` · 槽位 ${selectedPipe.slotNumber}`}
          {' · '}
          目标频率 {formatFrequency(selectedPipe.targetFrequency)}
        </Typography>

        {selectedPipe.needsReviewReason && selectedPipe.status === 'needs-review' && (
          <Box sx={{ mt: 1.5 }}>
            <Alert
              severity="warning"
              icon={<WarningIcon fontSize="small" />}
              sx={{ fontSize: '0.75rem', '& .MuiAlert-message': { padding: 0 } }}
            >
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                待复核原因：{selectedPipe.needsReviewReason}
              </Typography>
            </Alert>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <CentsGauge
            cents={selectedPipe.centsDeviation}
            allowedDeviation={allowedCentsDeviation}
            status={selectedPipe.status}
            size={220}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            频率设置
          </Typography>

          <TextField
            fullWidth
            type="text"
            label="目标频率 (Hz)"
            value={targetFreqInput}
            onChange={handleTargetFreqChange}
            onBlur={handleTargetFreqBlur}
            onKeyDown={handleTargetFreqKeyDown}
            size="small"
            sx={{ mb: 1, ...textFieldSx }}
            error={targetFreqError.length > 0}
            helperText={
              targetFreqError.length > 0
                ? targetFreqError.join('; ')
                : targetFreqWarning.length > 0
                ? targetFreqWarning.join('; ')
                : ''
            }
            slotProps={{
              formHelperText: {
                sx: {
                  color:
                    targetFreqError.length > 0
                      ? theme.palette.error.main
                      : theme.palette.warning.main,
                },
              },
              input: {
                inputMode: 'decimal',
                endAdornment: targetFreqError.length > 0 ? (
                  <ErrorIcon color="error" sx={{ fontSize: 18 }} />
                ) : targetFreqWarning.length > 0 ? (
                  <WarningIcon color="warning" sx={{ fontSize: 18 }} />
                ) : null,
              },
            }}
          />

          <TextField
            fullWidth
            type="text"
            label="实测频率 (Hz)"
            value={measuredFreqInput}
            onChange={handleMeasuredFreqChange}
            onBlur={handleMeasuredFreqBlur}
            onKeyDown={handleMeasuredFreqKeyDown}
            size="small"
            placeholder="输入实测频率"
            sx={{ mb: 1, ...textFieldSx }}
            error={measuredFreqError.length > 0}
            helperText={
              measuredFreqError.length > 0
                ? measuredFreqError.join('; ')
                : measuredFreqWarning.length > 0
                ? measuredFreqWarning.join('; ')
                : ''
            }
            slotProps={{
              formHelperText: {
                sx: {
                  color:
                    measuredFreqError.length > 0
                      ? theme.palette.error.main
                      : theme.palette.warning.main,
                },
              },
              input: {
                inputMode: 'decimal',
                endAdornment: measuredFreqError.length > 0 ? (
                  <ErrorIcon color="error" sx={{ fontSize: 18 }} />
                ) : measuredFreqWarning.length > 0 ? (
                  <WarningIcon color="warning" sx={{ fontSize: 18 }} />
                ) : null,
              },
            }}
          />

          <TextField
            fullWidth
            type="number"
            label="槽位号"
            value={selectedPipe.slotNumber ?? ''}
            onChange={handleSlotChange}
            size="small"
            placeholder="可选"
            sx={{ mb: slotConflictInfo.hasConflict ? 0.5 : 1, ...textFieldSx }}
            error={slotConflictInfo.hasConflict}
            helperText={
              slotConflictInfo.hasConflict
                ? `⚠️ 槽位冲突：已被 ${slotConflictInfo.conflictingPipes.map((p) => p.noteName).join('、')} 占用`
                : ''
            }
            slotProps={{
              htmlInput: { min: 1 },
              input: {
                endAdornment: slotConflictInfo.hasConflict ? (
                  <WarningIcon color="error" sx={{ fontSize: 18 }} />
                ) : null,
              },
              formHelperText: {
                sx: { color: theme.palette.error.main },
              },
            }}
          />
          {slotConflictInfo.hasConflict && (
            <Box
              sx={{
                mb: 1,
                p: 1,
                backgroundColor: `${theme.palette.error.main}10`,
                borderRadius: 1,
                border: `1px solid ${theme.palette.error.main}30`,
              }}
            >
              <Typography variant="caption" sx={{ color: theme.palette.error.main, fontSize: '0.7rem' }}>
                {slotConflictInfo.conflictingPipes.length} 根音管共用此槽位
              </Typography>
              {slotConflictInfo.conflictingPipes.map((p) => (
                <Chip
                  key={p.id}
                  label={p.noteName}
                  size="small"
                  variant="outlined"
                  sx={{
                    mr: 0.5,
                    mt: 0.5,
                    height: 20,
                    fontSize: '0.65rem',
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            状态管理
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>状态</InputLabel>
            <Select
              value={selectedPipe.status}
              label="状态"
              onChange={handleStatusChange}
            >
              <MenuItem value="tuning">调校中</MenuItem>
              <MenuItem value="verified">已定音</MenuItem>
              <MenuItem value="needs-review">待复核</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>所属分组</InputLabel>
            <Select
              value={selectedPipe.groupId || 'none'}
              label="所属分组"
              onChange={handleGroupChange}
            >
              <MenuItem value="none">未分组</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: g.color,
                      }}
                    />
                    {g.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedPipe.verifiedAt && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ScheduleIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                定音时间：{new Date(selectedPipe.verifiedAt).toLocaleString('zh-CN')}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              onClick={handleAddTrim}
              fullWidth
              disabled={!selectedPipe.measuredFrequency}
            >
              记录修整
            </Button>
            {selectedPipe.status === 'needs-review' && (
              <Button
                startIcon={<CheckIcon />}
                variant="contained"
                size="small"
                color="success"
                onClick={() => updatePipeStatus(selectedPipe.id, 'verified')}
                fullWidth
              >
                标记完成
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            备注
          </Typography>
          <TextareaAutosize
            minRows={3}
            placeholder="添加备注..."
            value={selectedPipe.notes}
            onChange={handleNotesChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.palette.primary.main;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.palette.divider;
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <TrimHistory
          records={selectedPipe.trimHistory}
          targetFrequency={selectedPipe.targetFrequency}
        />
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          更新于 {new Date(selectedPipe.updatedAt).toLocaleString('zh-CN')}
        </Typography>
        <Tooltip title="删除音管">
          <IconButton
            size="small"
            color="error"
            onClick={handleRemovePipe}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Dialog
        open={trimDialogOpen}
        onClose={() => setTrimDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>记录修整</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              type="number"
              label="修整后频率 (Hz)"
              value={newMeasuredFreq}
              onChange={(e) => setNewMeasuredFreq(e.target.value)}
              size="small"
              sx={{ mb: 2, ...textFieldSx }}
              slotProps={{
                htmlInput: { min: 0, step: 0.01 },
              }}
              autoFocus
            />
            <TextareaAutosize
              minRows={3}
              placeholder="修整说明（可选）..."
              value={trimDescription}
              onChange={(e) => setTrimDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrimDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleConfirmTrim}
            startIcon={<RefreshIcon />}
          >
            确认记录
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PipeDetailPanel;
