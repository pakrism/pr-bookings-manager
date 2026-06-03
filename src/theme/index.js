import { createTheme, alpha } from '@mui/material/styles';

export const pakrism = {
  lightGreen: '#9CEE69',
  green: '#58C71B',
  darkGreen: '#409F11',
  black: '#101828',
  softOrange: '#FFCE6D',
  orange: '#FFAD32',
  white: '#FFFFFF',
  bgLight: '#F6FBF3',
  bgCard: '#FFFFFF',
  textSecondary: '#637381',
  divider: '#E8F5E0',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: pakrism.green,
      light: pakrism.lightGreen,
      dark: pakrism.darkGreen,
      contrastText: '#ffffff',
    },
    secondary: {
      main: pakrism.orange,
      light: pakrism.softOrange,
      dark: '#E8961A',
      contrastText: '#ffffff',
    },
    warning: {
      main: pakrism.softOrange,
      dark: pakrism.orange,
    },
    background: {
      default: pakrism.bgLight,
      paper: pakrism.bgCard,
    },
    text: {
      primary: pakrism.black,
      secondary: pakrism.textSecondary,
    },
    divider: pakrism.divider,
    success: { main: pakrism.green, light: pakrism.lightGreen },
  },
  typography: {
    fontFamily: '"Public Sans", "Inter", sans-serif',
    h1: { fontWeight: 800, color: pakrism.black },
    h2: { fontWeight: 800, color: pakrism.black },
    h3: { fontWeight: 700, color: pakrism.black },
    h4: { fontWeight: 700, color: pakrism.black },
    h5: { fontWeight: 700, color: pakrism.black },
    h6: { fontWeight: 700, color: pakrism.black },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: '0.875rem' },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem', color: pakrism.textSecondary },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0px 2px 8px rgba(88, 199, 27, 0.08)',
    '0px 4px 16px rgba(88, 199, 27, 0.10)',
    '0px 8px 24px rgba(88, 199, 27, 0.12)',
    '0px 12px 32px rgba(16, 24, 40, 0.08)',
    '0px 16px 40px rgba(16, 24, 40, 0.10)',
    ...Array(19).fill('none'),
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(88, 199, 27, 0.08)',
          border: '1px solid #E8F5E0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          padding: '10px 20px',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #58C71B 0%, #409F11 100%)',
          boxShadow: '0px 4px 12px rgba(88, 199, 27, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #409F11 0%, #337D0D 100%)',
            boxShadow: '0px 6px 16px rgba(88, 199, 27, 0.45)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #FFCE6D 0%, #FFAD32 100%)',
          color: '#101828',
          boxShadow: '0px 4px 12px rgba(255, 173, 50, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFAD32 0%, #E8961A 100%)',
          },
        },
        outlinedPrimary: {
          borderColor: '#58C71B',
          color: '#58C71B',
          '&:hover': {
            background: alpha('#58C71B', 0.06),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        colorSuccess: {
          background: alpha('#58C71B', 0.12),
          color: '#409F11',
        },
        colorWarning: {
          background: alpha('#FFCE6D', 0.25),
          color: '#B07200',
        },
        colorError: {
          background: alpha('#FF5630', 0.12),
          color: '#B71D18',
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '&.Mui-focused fieldset': {
              borderColor: '#58C71B',
            },
          },
          '& label.Mui-focused': {
            color: '#58C71B',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& th': {
            backgroundColor: '#F6FBF3',
            color: '#637381',
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderBottom: '1px solid #E8F5E0',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha('#58C71B', 0.04),
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginBottom: 4,
          '&.Mui-selected': {
            backgroundColor: alpha('#58C71B', 0.12),
            color: '#409F11',
            fontWeight: 700,
            '& .MuiListItemIcon-root': { color: '#409F11' },
            '&:hover': { backgroundColor: alpha('#58C71B', 0.16) },
          },
          '&:hover': { backgroundColor: alpha('#58C71B', 0.06) },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E8F5E0',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#101828',
          boxShadow: '0px 1px 0px #E8F5E0',
        },
      },
    },
  },
});
