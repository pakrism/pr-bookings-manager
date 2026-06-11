import { Box } from '@mui/material';
import logoSrc from '../../assets/logo.png';

export default function Logo({ collapsed = false, sx = {} }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ...sx }}>
      <Box
        component="img"
        src={logoSrc}
        alt="Pakrism"
        sx={{ width: collapsed ? 40 : 40, height: collapsed ? 40 : 40 }}
      />
      {!collapsed && (
        <Box
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: '1.25rem',
            color: '#58C71B',
            letterSpacing: '-0.5px',
            fontFamily: '"Public Sans", sans-serif',
          }}
        >
          PAKRISM
        </Box>
      )}
    </Box>
  );
}
