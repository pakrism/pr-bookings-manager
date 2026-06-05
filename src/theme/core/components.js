import { alpha } from '@mui/material/styles';
import { themeConfig } from '../theme-config';

const { palette: p, action } = themeConfig;

export function components() {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: p.background.default },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 0px 2px rgba(145, 158, 171, 0.2), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)',
          border: `1px solid ${alpha(p.grey[500], 0.12)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
          padding: '8px 16px',
        },
        containedPrimary: {
          backgroundColor: p.primary.main,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: p.primary.dark,
            boxShadow: 'none',
          },
        },
        containedSecondary: {
          backgroundColor: p.secondary.main,
          color: p.secondary.contrastText,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: p.secondary.dark,
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: alpha(p.grey[500], 0.32),
          color: p.text.primary,
          '&:hover': {
            borderColor: p.text.primary,
            backgroundColor: alpha(p.grey[500], 0.08),
          },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'inherit' },
          style: {
            backgroundColor: action.dark,
            color: action.darkContrastText,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: action.darkHover,
              boxShadow: 'none',
            },
          },
        },
      ],
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&.Mui-focused fieldset': { borderColor: p.text.primary },
          },
          '& label.Mui-focused': { color: p.text.primary },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& th': {
            backgroundColor: p.grey[200],
            color: p.text.secondary,
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: `1px solid ${p.divider}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: alpha(p.grey[500], 0.04) },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: p.text.primary, height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 48,
          '&.Mui-selected': { color: p.text.primary, fontWeight: 700 },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 4,
          '&:hover': { backgroundColor: p.grey[200] },
          '&.Mui-selected': {
            backgroundColor: alpha(p.primary.main, 0.08),
            color: p.primary.dark,
            fontWeight: 700,
            '&:hover': { backgroundColor: alpha(p.primary.main, 0.12) },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: p.background.paper,
          borderRight: `1px solid ${p.divider}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: p.background.paper,
          color: p.text.primary,
          boxShadow: `0px 1px 0px ${p.divider}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },
  };
}
