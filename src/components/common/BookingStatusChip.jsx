import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';

function getChipProps(status) {
  switch (status) {
    case 'On-Going':
      return { color: 'success', label: status };
    case 'Completed':
      return {
        label: status,
        sx: {
          backgroundColor: alpha('#58C71B', 0.12),
          color: '#409F11',
          fontWeight: 600,
        },
      };
    case 'Cancelled':
    case 'Refunded':
      return { color: 'error', label: status };
    case 'Upcoming':
    default:
      return { color: 'warning', label: status || 'Upcoming' };
  }
}

export default function BookingStatusChip({ status, size = 'small' }) {
  const chipProps = getChipProps(status);

  return <Chip size={size} {...chipProps} />;
}
