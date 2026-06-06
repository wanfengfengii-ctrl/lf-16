import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import { usePipeStore } from '../../hooks/usePipeStore';
import { SearchFilter as SearchFilterType, PipeStatus } from '../../types';
import { formatCents } from '../../utils/centsCalculator';

interface SearchFilterPanelProps {
  compact?: boolean;
}

export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({ compact = false }) => {
  const theme = useTheme();
  const {
    searchFilter,
    setSearchFilter,
    getFilteredPipes,
    getGroupStats,
    groups,
    setSelectedGroup,
    selectedGroupId,
    setSelectedPipe,
    setHighlightedPipes,
  } = usePipeStore();

  const filteredPipes = useMemo(() => getFilteredPipes(), [getFilteredPipes]);
  const groupStats = useMemo(() => getGroupStats(), [getGroupStats]);

  const handleFilterChange = (key: keyof SearchFilterType, value: string) => {
    setSearchFilter({ [key]: value });
  };

  const handleGroupClick = (groupId: string) => {
    setSelectedGroup(groupId === 'all' ? 'all' : groupId);
    if (groupId !== 'all') {
      setSearchFilter({ groupId });
    } else {
      setSearchFilter({ groupId: 'all' });
    }
  };

  const handleGroupHover = (groupId: string) => {
    const pipesInGroup = filteredPipes.filter(
      (p) => groupId === 'all' ? !p.groupId : p.groupId === groupId
    );
    setHighlightedPipes(pipesInGroup.map((p) => p.id));
  };

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
        <TextField
          fullWidth
          size="small"
          placeholder="搜索音管..."
          value={searchFilter.query}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: 18 }} />,
            },
          }}
          sx={{ mb: 1.5 }}
        />

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {(['all', 'verified', 'tuning', 'needs-review'] as Array<'all' | PipeStatus>).map((status) => {
            const colors: Record<string, string> = {
              all: theme.palette.text.secondary,
              verified: theme.palette.success.main,
              tuning: theme.palette.grey[600],
              'needs-review': theme.palette.warning.main,
            };
            const labels: Record<string, string> = {
              all: '全部',
              verified: '已定音',
              tuning: '调校中',
              'needs-review': '待复核',
            };
            return (
              <Chip
                key={status}
                label={labels[status]}
                size="small"
                variant={searchFilter.status === status ? 'filled' : 'outlined'}
                onClick={() => handleFilterChange('status', status)}
                sx={{
                  borderColor: colors[status],
                  color: searchFilter.status === status ? '#fff' : colors[status],
                  backgroundColor: searchFilter.status === status ? colors[status] : 'transparent',
                  '&:hover': {
                    backgroundColor: searchFilter.status === status ? colors[status] : `${colors[status]}10`,
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        p: 2,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            搜索筛选
          </Typography>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="搜索音名、频率、备注..."
          value={searchFilter.query}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: 18 }} />,
            },
          }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>状态筛选</InputLabel>
          <Select
            value={searchFilter.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            label="状态筛选"
          >
            <MenuItem value="all">全部状态</MenuItem>
            <MenuItem value="verified">已定音</MenuItem>
            <MenuItem value="tuning">调校中</MenuItem>
            <MenuItem value="needs-review">待复核</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>分组筛选</InputLabel>
          <Select
            value={searchFilter.groupId}
            onChange={(e) => handleFilterChange('groupId', e.target.value)}
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

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>测量状态</InputLabel>
          <Select
            value={searchFilter.hasMeasured}
            onChange={(e) => handleFilterChange('hasMeasured', e.target.value)}
            label="测量状态"
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="yes">已测量</MenuItem>
            <MenuItem value="no">未测量</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>偏差范围</InputLabel>
          <Select
            value={searchFilter.deviationRange}
            onChange={(e) => handleFilterChange('deviationRange', e.target.value)}
            label="偏差范围"
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="in-tune">在阈值内</MenuItem>
            <MenuItem value="out-of-tune">超出阈值</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider />

      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FilterListIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            筛选结果
          </Typography>
          <Chip
            label={`${filteredPipes.length} 根`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        </Box>
      </Box>

      <Divider />

      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <GroupIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            分组统计
          </Typography>
        </Box>

        <List dense disablePadding>
          {groupStats.map((stat) => {
            const group = groups.find((g) => g.id === stat.groupId);
            const color = group?.color || theme.palette.text.secondary;
            const isSelected = selectedGroupId === stat.groupId;

            return (
              <ListItem
                key={stat.groupId}
                disablePadding
                sx={{
                  mb: 0.5,
                }}
              >
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleGroupClick(stat.groupId)}
                  onMouseEnter={() => handleGroupHover(stat.groupId)}
                  onMouseLeave={() => setHighlightedPipes([])}
                  sx={{
                    borderRadius: 1,
                    borderLeft: `3px solid ${color}`,
                    backgroundColor: isSelected ? `${color}10` : 'transparent',
                    '&:hover': {
                      backgroundColor: `${color}10`,
                    },
                  }}
                >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <GroupIcon sx={{ fontSize: 18, color }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {stat.groupName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: "'JetBrains Mono', monospace", color: theme.palette.text.secondary }}
                      >
                        {stat.total} 根
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircleIcon sx={{ fontSize: 12, color: theme.palette.success.main }} />
                        <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                          {stat.verified}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BuildIcon sx={{ fontSize: 12, color: theme.palette.grey[600] }} />
                        <Typography variant="caption" sx={{ color: theme.palette.grey[600] }}>
                          {stat.tuning}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <WarningIcon sx={{ fontSize: 12, color: theme.palette.warning.main }} />
                        <Typography variant="caption" sx={{ color: theme.palette.warning.main }}>
                          {stat.needsReview}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          ml: 'auto',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: theme.palette.text.secondary,
                        }}
                      >
                        平均 {formatCents(stat.avgDeviation)}
                      </Typography>
                    </Box>
                  }
                />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default SearchFilterPanel;
