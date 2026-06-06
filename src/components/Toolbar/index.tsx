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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { usePipeStore } from '../../hooks/usePipeStore';
import { noteToFrequency, getNoteName } from '../../utils/noteConverter';
import { v4 as uuidv4 } from 'uuid';
import { Pipe } from '../../types';

export const ToolbarComponent: React.FC = () => {
  const theme = useTheme();
  const {
    pipes,
    allowedCentsDeviation,
    setAllowedDeviation,
    addPipe,
  } = usePipeStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newNoteName, setNewNoteName] = useState('C');
  const [newOctave, setNewOctave] = useState(4);
  const [newTargetFreq, setNewTargetFreq] = useState('261.63');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  const handleAddClick = () => {
    setAddDialogOpen(true);
    setNewNoteName('C');
    setNewOctave(4);
    setNewTargetFreq('261.63');
  };

  const handleAddConfirm = () => {
    const freq = parseFloat(newTargetFreq);
    if (!isNaN(freq) && freq > 0) {
      addPipe(freq, getNoteName(freq));
      setAddDialogOpen(false);
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
    const data = JSON.stringify(pipes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipe-tuning-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setAnchorEl(null);
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

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octaves = [2, 3, 4, 5, 6];

  const textFieldSx = {
    '& .MuiInputBase-input': {
      fontFamily: "'JetBrains Mono', monospace",
    },
  };

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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              音管校音工作台
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="添加音管">
              <IconButton onClick={handleAddClick} size="small" color="primary">
                <AddIcon />
              </IconButton>
            </Tooltip>

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
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>
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
              偏差超过此值的音管将标记为需校音
            </Typography>
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
    </>
  );
};

export default ToolbarComponent;
