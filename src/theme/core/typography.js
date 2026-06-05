import { themeConfig } from '../theme-config';

export function typography() {
  const fontFamily = themeConfig.fontFamily.primary;

  return {
    fontFamily,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightSemiBold: 600,
    fontWeightBold: 700,
    h1: { fontWeight: 800, fontSize: '2.5rem', lineHeight: 1.2 },
    h2: { fontWeight: 800, fontSize: '2rem', lineHeight: 1.25 },
    h3: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3 },
    h4: { fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.35 },
    h5: { fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.4 },
    h6: { fontWeight: 700, fontSize: '1rem', lineHeight: 1.45 },
    subtitle1: { fontWeight: 600, fontSize: '1rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.875rem' },
    body1: { fontSize: '0.875rem', lineHeight: 1.57 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.57, color: '#637381' },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    button: { fontWeight: 700, textTransform: 'none' },
  };
}
