export { pakrism, themeConfig, chartColors } from './theme-config';
export { createTheme } from './create-theme';

import { createTheme as buildTheme } from './create-theme';

export const theme = buildTheme();
