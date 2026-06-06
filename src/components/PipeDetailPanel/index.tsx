import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import { usePipeStore } from '../../hooks/usePipeStore';
import { PipeStatus } from '../../types';
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
    allowedCentsDeviation,
    updatePipeFrequency,
    updateTargetFrequency,
    updatePipeStatus,
    updatePipe,
    addTrimRecord,
    removePipe,
  } = usePipeStore();

  const [trimDialogOpen, setTrimDialogOpen] = useState(false);
  const [trimDescription, setTrimDescription] = useState('');
  const [newMeasuredFreq, setNewMeasuredFreq] = useState('');
  const [targetFreqInput, setTargetFreqInput] = useState('');
  const [measuredFreqInput, setMeasuredFreqInput] = useState('');

  const selectedPipe = pipes.find((p) => p.id === selectedPipeId);

  useEffect(() => {
    if (selectedPipe) {
      setTargetFreqInput(selectedPipe.targetFrequency.toFixed(2));
      setMeasuredFreqInput(selectedPipe.measuredFrequency?.toFixed(2) ?? '');
    }
  }, [selectedPipe?.id, selectedPipe?.targetFrequency, selectedPipe?.measuredFrequency]);

  const handleTargetFreqBlur = () => {
    if (!selectedPipe) return;
    const value = parseFloat(targetFreqInput);
    if (!isNaN(value) && value > 0) {
      updateTargetFrequency(selectedPipe.id, value);
      const newNoteName = getNoteName(value);
      updatePipe(selectedPipe.id, { noteName: newNoteName });
    } else {
      setTargetFreqInput(selectedPipe.targetFrequency.toFixed(2));
    }
  };

  const handleTargetFreqKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTargetFreqBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleMeasuredFreqBlur = () => {
    if (!selectedPipe) return;
    const value = parseFloat(measuredFreqInput);
    if (!isNaN(value) && value > 0) {
      updatePipeFrequency(selectedPipe.id, value);
    } else if (measuredFreqInput === '') {
    } else {
      setMeasuredFreqInput(selectedPipe.measuredFrequency?.toFixed(2) ?? '');
    }
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
          键位 #{selectedPipe.keyPosition} · 目标频率 {formatFrequency(selectedPipe.targetFrequency)}
        </Typography>
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
            onChange={(e) => setTargetFreqInput(e.target.value)}
            onBlur={handleTargetFreqBlur}
            onKeyDown={handleTargetFreqKeyDown}
            size="small"
            sx={{ mb: 2, ...textFieldSx }}
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
            }}
          />

          <TextField
            fullWidth
            type="text"
            label="实测频率 (Hz)"
            value={measuredFreqInput}
            onChange={(e) => setMeasuredFreqInput(e.target.value)}
            onBlur={handleMeasuredFreqBlur}
            onKeyDown={handleMeasuredFreqKeyDown}
            size="small"
            placeholder="输入实测频率"
            sx={textFieldSx}
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
            }}
          />
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
        <IconButton
          size="small"
          color="error"
          onClick={handleRemovePipe}
          title="删除音管"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
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
