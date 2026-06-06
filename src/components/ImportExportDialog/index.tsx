import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Chip,
  useTheme,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import GroupIcon from '@mui/icons-material/Group';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import { usePipeStore } from '../../hooks/usePipeStore';
import { ProjectFile } from '../../types';

interface ImportExportDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: number;
}

export const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  open,
  onClose,
  initialTab = 0,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(initialTab);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [importedProject, setImportedProject] = useState<ProjectFile | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const {
    exportProject,
    importProject,
    pipes,
    groups,
    operationHistory,
    allowedCentsDeviation,
    totalSlots,
    projectName: currentProjectName,
    setProjectName,
  } = usePipeStore();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setImportedProject(null);
    setImportError(null);
  };

  const handleExport = () => {
    const project = exportProject();
    if (projectNameInput) {
      project.name = projectNameInput;
    }
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'pipe-tuning-project'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (!data.version || !data.pipes || !Array.isArray(data.pipes)) {
          throw new Error('文件格式不正确：缺少必要字段');
        }

        const project: ProjectFile = {
          version: data.version || '1.0.0',
          name: data.name || '导入的工程',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          allowedCentsDeviation: data.allowedCentsDeviation || 5,
          groups: data.groups || [],
          pipes: data.pipes,
          operationHistory: data.operationHistory || [],
          metadata: data.metadata,
        };

        setImportedProject(project);
        setImportError(null);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : '导入失败：文件解析错误');
        setImportedProject(null);
      }
    };
    reader.onerror = () => {
      setImportError('读取文件失败');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importedProject) return;
    importProject(importedProject, importMode);
    if (importedProject.name) {
      setProjectName(importedProject.name);
    }
    onClose();
  };

  const exportStats = {
    pipeCount: pipes.length,
    groupCount: groups.length,
    historyCount: operationHistory.length,
    deviation: allowedCentsDeviation,
    slots: totalSlots,
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>工程导入/导出</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab icon={<DownloadIcon />} iconPosition="start" label="导出工程" />
          <Tab icon={<UploadIcon />} iconPosition="start" label="导入工程" />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              导出完整的工程文件，包含所有音管数据、分组、操作历史和设置。
            </Typography>

            <TextField
              fullWidth
              label="工程名称"
              value={projectNameInput || currentProjectName}
              onChange={(e) => setProjectNameInput(e.target.value)}
              size="small"
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  style: { fontFamily: "'JetBrains Mono', monospace" },
                },
              }}
            />

            <Box
              sx={{
                p: 2,
                backgroundColor: theme.palette.background.default,
                borderRadius: 2,
                mb: 3,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                导出内容预览
              </Typography>
              <List dense disablePadding>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <MusicNoteIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="音管数据"
                    secondary={
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                        {exportStats.pipeCount} 根音管
                      </span>
                    }
                  />
                  <Chip label="完整数据" size="small" color="success" variant="outlined" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <GroupIcon sx={{ fontSize: 18, color: theme.palette.secondary.main }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="分组信息"
                    secondary={
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                        {exportStats.groupCount} 个分组
                      </span>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <HistoryIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="操作历史"
                    secondary={
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                        {exportStats.historyCount} 条记录
                      </span>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SettingsIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="设置"
                    secondary={
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                        偏差阈值: {exportStats.deviation}c · 槽位: {exportStats.slots}
                      </span>
                    }
                  />
                </ListItem>
              </List>
            </Box>

            <Alert severity="info" icon={<FileDownloadIcon />}>
              导出的 JSON 文件可在任意时间重新导入以恢复完整工作状态。
            </Alert>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              选择工程文件以导入音管数据、分组和历史记录。
            </Typography>

            <Box
              sx={{
                p: 3,
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                textAlign: 'center',
                mb: 3,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <input
                type="file"
                accept=".json"
                id="import-file-input"
                hidden
                onChange={handleImportFile}
              />
              <label htmlFor="import-file-input">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<FileUploadIcon />}
                  size="large"
                >
                  选择工程文件
                </Button>
              </label>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: theme.palette.text.disabled }}>
                支持 .json 格式
              </Typography>
            </Box>

            {importError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {importError}
              </Alert>
            )}

            {importedProject && (
              <Box>
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                  文件解析成功，共 {importedProject.pipes.length} 根音管
                </Alert>

                <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                  <FormLabel component="legend">导入模式</FormLabel>
                  <RadioGroup
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
                    row
                  >
                    <FormControlLabel value="replace" control={<Radio />} label="替换当前" />
                    <FormControlLabel value="merge" control={<Radio />} label="合并追加" />
                  </RadioGroup>
                </FormControl>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  导入内容
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    icon={<MusicNoteIcon sx={{ fontSize: 14 }} />}
                    label={`${importedProject.pipes.length} 根音管`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<GroupIcon sx={{ fontSize: 14 }} />}
                    label={`${importedProject.groups?.length || 0} 个分组`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<HistoryIcon sx={{ fontSize: 14 }} />}
                    label={`${importedProject.operationHistory?.length || 0} 条历史`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Box>

                {importMode === 'merge' && (
                  <Alert severity="warning" icon={<WarningIcon />}>
                    合并模式将保留当前数据并追加新音管，可能导致 ID 冲突。
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        {tabValue === 0 && (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={pipes.length === 0}
          >
            导出工程
          </Button>
        )}
        {tabValue === 1 && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleConfirmImport}
            disabled={!importedProject}
          >
            确认导入
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportExportDialog;
