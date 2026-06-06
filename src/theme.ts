import { createTheme } from '@mui/material/styles';
import { ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    background: {
      default: '#0f1419',
      paper: '#1a2332',
    },
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      disabled: '#64748b',
    },
    divider: '#2d3a4f',
  },
  typography: {
    fontFamily: "'Inter', 'JetBrains Mono', system-ui, sans-serif",
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.75rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#2d3a4f',
            },
            '&:hover fieldset': {
              borderColor: '#3b82f6',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);

export default theme;
