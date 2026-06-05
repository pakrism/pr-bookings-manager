import { themeConfig } from '../theme-config';

export function palette() {
  const { palette: p } = themeConfig;
  const { dark, darkHover, darkContrastText } = p.action;

  return {
    mode: 'light',
    primary: p.primary,
    secondary: p.secondary,
    info: p.info,
    success: p.success,
    warning: p.warning,
    error: p.error,
    grey: p.grey,
    common: p.common,
    text: p.text,
    background: p.background,
    divider: p.divider,
    inherit: {
      main: dark,
      dark: darkHover,
      light: dark,
      contrastText: darkContrastText,
    },
    action: {
      active: p.grey[600],
      hover: 'rgba(145, 158, 171, 0.08)',
      selected: 'rgba(145, 158, 171, 0.16)',
      disabled: p.grey[500],
      disabledBackground: p.grey[200],
      focus: 'rgba(145, 158, 171, 0.24)',
    },
  };
}
