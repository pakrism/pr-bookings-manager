import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';

const STATUS_COLORS = {
  Upcoming: { bg: '#FFF5CC', text: '#B76E00' },
  'On-Going': { bg: '#D3FCD2', text: '#118D57' },
  Completed: { bg: '#D3FCD2', text: '#065E49' },
  Cancelled: { bg: '#FFE9D5', text: '#B71D18' },
  Refunded: { bg: '#F4F6F8', text: '#637381' },
  Pending: { bg: '#FFF5CC', text: '#B76E00' },
  Paid: { bg: '#D3FCD2', text: '#118D57' },
  Active: { bg: '#D3FCD2', text: '#118D57' },
  Inactive: { bg: '#F4F6F8', text: '#637381' },
  default: { bg: '#F4F6F8', text: '#637381' },
};

export default function Label({ children, color, variant = 'soft', sx, ...other }) {
  const statusKey = color || children;
  const colors = STATUS_COLORS[statusKey] || STATUS_COLORS.default;

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        fontSize: '0.75rem',
        fontWeight: 700,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        ...(variant === 'soft'
          ? { bgcolor: colors.bg, color: colors.text }
          : { bgcolor: colors.text, color: '#fff' }),
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}

export { STATUS_COLORS };
