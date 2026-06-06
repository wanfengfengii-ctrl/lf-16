import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Slider,
  useTheme,
  Menu,
  MenuItem,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import GroupsIcon from '@mui/icons-material/Groups';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MicIcon from '@mui/icons-material/Mic';
import { usePipeStore } from '../../hooks/usePipeStore';
import { noteToFrequency, getNoteName } from '../../utils/noteConverter';
import { Pipe } from '../../types';
import { BatchOperations } from '../BatchOperations';
import { ImportExportDialog } from '../ImportExportDialog';

export const ToolbarComponent: React.FC = () => {
  const theme = useTheme();
  const {
    pipes,
    groups,
    allowedCentsDeviation,
    setAllowedDeviation,
    addPipe,
    projectName,
    setProjectName,
    totalSlots,
    setTotalSlots,
    addGroup,
    togglePitchDetectionPanel,
    showPitchDetectionPanel,
    checkSlotConflict,
  } = usePipeStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchTab, setBatchTab] = useState(0);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [importExportTab, setImportExportTab] = useState(0);
  const [newNoteName, setNewNoteName] = useState('C');
  const [newOctave, setNewOctave] = useState(4);
  const [newTargetFreq, setNewTargetFreq] = useState('261.63');
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newGroupId, setNewGroupId] = useState('');
  const [slotError, setSlotError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6');

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  const handleAddClick = () => {
    setAddDialogOpen(true);
    setNewNoteName('C');
    setNewOctave(4);
    setNewTargetFreq('261.63');
    setNewSlotNumber('');
    setNewGroupId('');
    setSlotError('');
  };

  const handleSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewSlotNumber(value);

    if (value === '') {
      setSlotError('');
      return;
    }

    const slotNum = parseInt(value);
    if (isNaN(slotNum) || slotNum <= 0) {
      setSlotError('请输入有效的槽位号');
      return;
    }

    const conflictPipe = checkSlotConflict(slotNum);
    if (conflictPipe) {
      setSlotError(`槽位 #${slotNum} 已被音管 ${conflictPipe.noteName} 占用`);
    } else {
      setSlotError('');
    }
  };

  const handleAddConfirm = () => {
    const freq = parseFloat(newTargetFreq);
    const slot = newSlotNumber ? parseInt(newSlotNumber) : undefined;

    if (isNaN(freq) || freq <= 0) return;

    if (slot !== undefined) {
      const conflictPipe = checkSlotConflict(slot);
      if (conflictPipe) {
        setSlotError(`槽位 #${slot} 已被音管 ${conflictPipe.noteName} 占用`);
        return;
      }
    }

    const result = addPipe(freq, getNoteName(freq), newGroupId || undefined, slot);
    if (result.success) {
      setAddDialogOpen(false);
    } else if (result.error) {
      setSlotError(result.error);
    }
  };

  const handleNoteChange = (note: string, octave: number) => {
    setNewNoteName(note);
    setNewOctave(octave);
    const freq = noteToFrequency(note, octave);
    setNewTargetFreq(freq.toFixed(2));
  };

  const handleTargetFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTargetFreq(value);
    const freq = parseFloat(value);
    if (!isNaN(freq) && freq > 0) {
      const { note, octave } = getNoteData(freq);
      setNewNoteName(note);
      setNewOctave(octave);
    }
  };

  const getNoteData = (freq: number) => {
    const A4 = 440;
    const A4_MIDI = 69;
    const midiNumber = 12 * Math.log2(freq / A4) + A4_MIDI;
    const roundedMidi = Math.round(midiNumber);
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = ((roundedMidi % 12) + 12) % 12;
    const octave = Math.floor(roundedMidi / 12) - 1;
    return { note: noteNames[noteIndex], octave };
  };

  const handleExport = () => {
    setImportExportTab(0);
    setImportExportOpen(true);
    setAnchorEl(null);
    setMenuAnchorEl(null);
  };

  const handleImportClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          data.forEach((pipe: Pipe) => {
            if (pipe.targetFrequency && pipe.targetFrequency > 0) {
              addPipe(pipe.targetFrequency, pipe.noteName || getNoteName(pipe.targetFrequency));
            }
          });
        }
      } catch (error) {
        console.error('Import failed:', error);
      }
    };
    reader.readAsText(file);
    setAnchorEl(null);
  };

  const handleBatchAdd = () => {
    setBatchTab(0);
    setBatchDialogOpen(true);
    setMenuAnchorEl(null);
  };

  const handleBatchVerify = () => {
    setBatchTab(1);
    setBatchDialogOpen(true);
    setMenuAnchorEl(null);
  };

  const handleImportExport = (tab: number) => {
    setImportExportTab(tab);
    setImportExportOpen(true);
    setMenuAnchorEl(null);
  };

  const handleAddGroupConfirm = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim(), newGroupColor);
      setAddGroupDialogOpen(false);
      setNewGroupName('');
      setNewGroupColor('#3b82f6');
    }
  };

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octaves = [2, 3, 4, 5, 6];
  const groupColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const textFieldSx = {
    '& .MuiInputBase-input': {
      fontFamily: "'JetBrains Mono', monospace",
    },
  };

  const occupiedSlots = pipes.filter((p) => p.slotNumber !== undefined).length;

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'none',
        }}
      >
        <Toolbar variant="dense">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MusicNoteIcon sx={{ color: theme.palette.primary.main }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                音管校音工作站
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}
              >
                {projectName} · {pipes.length} 根音管
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="录音测频">
              <IconButton
                onClick={togglePitchDetectionPanel}
                size="small"
                color={showPitchDetectionPanel ? 'primary' : 'default'}
                sx={{
                  backgroundColor: showPitchDetectionPanel ? 'primary.main' : 'transparent',
                  color: showPitchDetectionPanel ? 'white' : 'inherit',
                  '&:hover': {
                    backgroundColor: showPitchDetectionPanel ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <MicIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="添加音管">
              <IconButton onClick={handleAddClick} size="small" color="primary">
                <AddIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="批量操作">
              <IconButton
                onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                size="small"
              >
                <PlaylistAddCheckIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={() => setMenuAnchorEl(null)}
            >
              <MenuItem onClick={handleBatchAdd}>
                <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                批量录入
              </MenuItem>
              <MenuItem onClick={handleBatchVerify}>
                <PlaylistAddCheckIcon sx={{ mr: 1, fontSize: 18 }} />
                批量复核
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleImportExport(0)}>
                <FileDownloadIcon sx={{ mr: 1, fontSize: 18 }} />
                导出工程
              </MenuItem>
              <MenuItem onClick={() => handleImportExport(1)}>
                <UploadIcon sx={{ mr: 1, fontSize: 18 }} />
                导入工程
              </MenuItem>
            </Menu>

            <Tooltip title="导入/导出">
              <IconButton onClick={handleImportClick} size="small">
                <UploadIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={handleExport}>
                <DownloadIcon sx={{ mr: 1, fontSize: 18 }} />
                导出数据
              </MenuItem>
              <Divider />
              <MenuItem component="label">
                <UploadIcon sx={{ mr: 1, fontSize: 18 }} />
                导入数据
                <input
                  type="file"
                  accept=".json"
                  hidden
                  onChange={handleImportFile}
                />
              </MenuItem>
            </Menu>

            <Tooltip title="设置">
              <IconButton onClick={handleSettingsClick} size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>校音设置</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography gutterBottom sx={{ fontWeight: 500 }}>
                工程名称
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="输入工程名称"
              />
            </Box>

            <Box>
              <Typography gutterBottom sx={{ fontWeight: 500 }}>
                允许音分偏差: {allowedCentsDeviation} 音分
              </Typography>
              <Slider
                value={allowedCentsDeviation}
                onChange={(_, value) => setAllowedDeviation(value as number)}
                min={1}
                max={50}
                step={1}
                marks={[
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                偏差超过此值的音管将标记为需校音。调整后所有音管状态将自动重新计算。
              </Typography>
            </Box>

            <Box>
              <Typography gutterBottom sx={{ fontWeight: 500 }}>
                总槽位数: {totalSlots}
              </Typography>
              <Slider
                value={totalSlots}
                onChange={(_, value) => setTotalSlots(value as number)}
                min={12}
                max={100}
                step={1}
                marks={[
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 75, label: '75' },
                  { value: 100, label: '100' },
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                已占用: {occupiedSlots} / {totalSlots}
              </Typography>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 500 }}>分组管理</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAddGroupDialogOpen(true)}
                >
                  新建分组
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {groups.map((g) => (
                  <Chip
                    key={g.id}
                    label={g.name}
                    size="small"
                    sx={{
                      backgroundColor: `${g.color}20`,
                      color: g.color,
                      border: `1px solid ${g.color}`,
                    }}
                  />
                ))}
                {groups.length === 0 && (
                  <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                    暂无分组
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加音管</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                选择音名
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {noteNames.map((note) => (
                  <Button
                    key={note}
                    size="small"
                    variant={newNoteName === note ? 'contained' : 'outlined'}
                    onClick={() => handleNoteChange(note, newOctave)}
                    sx={{ minWidth: 40, textTransform: 'none' }}
                  >
                    {note}
                  </Button>
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                选择八度
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {octaves.map((oct) => (
                  <Button
                    key={oct}
                    size="small"
                    variant={newOctave === oct ? 'contained' : 'outlined'}
                    onClick={() => handleNoteChange(newNoteName, oct)}
                    sx={{ minWidth: 40, textTransform: 'none' }}
                  >
                    {oct}
                  </Button>
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              type="number"
              label="目标频率 (Hz)"
              value={newTargetFreq}
              onChange={handleTargetFreqChange}
              sx={textFieldSx}
              slotProps={{
                htmlInput: { min: 0, step: 0.01 },
              }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                type="number"
                label="槽位号（可选）"
                value={newSlotNumber}
                onChange={handleSlotChange}
                size="small"
                sx={textFieldSx}
                error={!!slotError}
                helperText={slotError || ''}
                slotProps={{
                  htmlInput: { min: 1 },
                  formHelperText: {
                    sx: {
                      color: 'error.main',
                    },
                  },
                }}
              />
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel>所属分组（可选）</InputLabel>
              <Select
                value={newGroupId}
                onChange={(e) => setNewGroupId(e.target.value)}
                label="所属分组（可选）"
              >
                <MenuItem value="">不指定</MenuItem>
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

            <Box
              sx={{
                p: 2,
                backgroundColor: theme.palette.background.default,
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: theme.palette.primary.main }}
              >
                {newNoteName}
                {newOctave}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: theme.palette.text.secondary,
                }}
              >
                {parseFloat(newTargetFreq || '0').toFixed(2)} Hz
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleAddConfirm} startIcon={<AddIcon />}>
            添加
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addGroupDialogOpen}
        onClose={() => setAddGroupDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>新建分组</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="分组名称"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              size="small"
              autoFocus
            />
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                选择颜色
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {groupColors.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setNewGroupColor(color)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: newGroupColor === color ? '2px solid' : '2px solid transparent',
                      borderColor: newGroupColor === color ? theme.palette.primary.main : 'transparent',
                      boxShadow: newGroupColor === color ? `0 0 0 2px ${theme.palette.primary.main}40` : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddGroupDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleAddGroupConfirm}
            disabled={!newGroupName.trim()}
            startIcon={<GroupsIcon />}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>

      <BatchOperations
        open={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        initialTab={batchTab}
      />

      <ImportExportDialog
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        initialTab={importExportTab}
      />
    </>
  );
};

export default ToolbarComponent;
