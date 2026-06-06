import { ThemeProvider, CssBaseline, Box, useTheme } from '@mui/material';
import { theme } from './theme';
import { ToolbarComponent } from './components/Toolbar';
import { PipeMatrix } from './components/PipeMatrix';
import { PipeDetailPanel } from './components/PipeDetailPanel';
import { RangeChart } from './components/Visualizations/RangeChart';
import { DeviationChart } from './components/Visualizations/DeviationChart';
import { SlotOccupancyView } from './components/SlotOccupancyView';
import { SearchFilterPanel } from './components/SearchFilterPanel';
import { OperationHistoryPanel } from './components/OperationHistoryPanel';

function AppContent() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <ToolbarComponent />

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            p: 2,
            gap: 2,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <SearchFilterPanel compact={false} />
        </Box>

        <Box
          sx={{
            flex: '2 1 0',
            minWidth: 280,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            p: 2,
            gap: 2,
          }}
        >
          <SlotOccupancyView compact={false} />
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <PipeMatrix />
          </Box>
        </Box>

        <Box
          sx={{
            flex: '1 1 0',
            minWidth: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 2,
            overflow: 'auto',
            borderLeft: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <RangeChart />
          <DeviationChart />
          <OperationHistoryPanel compact={true} />
        </Box>

        <Box
          sx={{
            flex: '0 1 320px',
            minWidth: 260,
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderLeft: `1px solid ${theme.palette.divider}`,
          }}
        >
          <PipeDetailPanel />
        </Box>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  );
}
