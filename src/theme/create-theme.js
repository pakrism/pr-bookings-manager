import { createTheme as muiCreateTheme } from '@mui/material/styles';
import { palette } from './core/palette';
import { typography } from './core/typography';
import { shadows } from './core/shadows';
import { components } from './core/components';

export function createTheme() {
  return muiCreateTheme({
    palette: palette(),
    typography: typography(),
    shape: { borderRadius: 8 },
    shadows: shadows(),
    components: components(),
  });
}
