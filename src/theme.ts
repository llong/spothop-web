import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';
  const divider = isLight ? '#eff3f4' : '#2d3336';
  
  return createTheme({
  palette: {
    mode,
    ...(isLight
      ? {
          primary: {
            main: '#05668d', // Baltic Blue
          },
          secondary: {
            main: '#028090', // Teal
          },
          background: {
            default: '#ffffff',
            paper: '#ffffff',
          },
          divider,
        }
      : {
          primary: {
            main: '#02c39a', // Mint Leaf (High vibrance for dark mode)
          },
          secondary: {
            main: '#00a896', // Verdigris
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
          divider,
        }),
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 800,
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 9999,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${divider}`,
        },
      },
    },
  },
});
};