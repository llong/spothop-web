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
    borderRadius: 8,
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
    MuiCssBaseline: {
      styleOverrides: {
        '@keyframes fade-in': {
          '0%': { opacity: 0, transform: 'translateY(5px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        // Google Places Autocomplete (.pac-*)
        '.pac-container': {
          backgroundColor: isLight ? '#ffffff' : '#1e1e1e',
          borderColor: divider,
          borderRadius: '8px',
          boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 8px 32px rgba(0,0,0,0.5)',
          marginTop: '4px',
          zIndex: 1300,
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          // On mobile & small screens, expand across the screen so locations & addresses are not cut off
          '@media (max-width: 600px)': {
            left: '12px !important',
            right: '12px !important',
            width: 'calc(100vw - 24px) !important',
            maxWidth: 'calc(100vw - 24px) !important',
            minWidth: '0 !important',
          },
          '@media (min-width: 601px)': {
            minWidth: '380px !important',
            maxWidth: 'calc(100vw - 24px) !important',
          },
        },
        '.pac-item': {
          borderTop: `1px solid ${divider}`,
          color: isLight ? '#536471' : '#8b98a5',
          padding: '10px 14px',
          cursor: 'pointer',
          whiteSpace: 'normal',
          lineHeight: 1.4,
          '&:first-of-type': {
            borderTop: 'none',
          },
          '&:hover': {
            backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
          },
        },
        '.pac-item-selected, .pac-item-selected:hover': {
          backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
          color: isLight ? '#0f1419' : '#ffffff',
        },
        '.pac-item-query': {
          color: isLight ? '#0f1419' : '#ffffff',
          fontSize: '0.875rem',
          paddingRight: '6px',
        },
        '.pac-item-selected .pac-item-query, .pac-item:hover .pac-item-query': {
          color: isLight ? '#0f1419' : '#ffffff',
        },
        '.pac-matched': {
          color: isLight ? '#05668d' : '#02c39a',
          fontWeight: 700,
        },
        '.pac-icon': {
          filter: isLight ? 'none' : 'invert(0.85) hue-rotate(180deg)',
        },
        '.pac-logo:after': {
          display: 'none',
        },
        // Leaflet Map Controls & Popups
        '.leaflet-container .leaflet-bar': {
          border: `1px solid ${divider}`,
          boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.4)',
        },
        '.leaflet-container .leaflet-bar a': {
          backgroundColor: isLight ? '#ffffff' : '#1e1e1e',
          color: isLight ? '#0f1419' : '#ffffff',
          borderBottomColor: divider,
          '&:hover, &:focus': {
            backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
          },
          '&.leaflet-disabled': {
            backgroundColor: isLight ? '#ffffff' : '#1e1e1e',
            color: isLight ? '#cfd9de' : '#536471',
          },
        },
        '.leaflet-popup-content-wrapper': {
          padding: 0,
          overflow: 'hidden',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
        '.leaflet-popup-content': {
          margin: 0,
          lineHeight: 'inherit',
        },
        '.leaflet-popup-tip': {
          display: 'none',
        },
      },
    },
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
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: 'none',
        },
      },
    },
  },
});
};
