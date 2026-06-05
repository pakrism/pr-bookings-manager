import Label from '../ui/Label';

export default function BookingStatusChip({ status, size = 'small' }) {
  return <Label sx={{ fontSize: size === 'small' ? '0.75rem' : '0.8125rem' }}>{status || 'Upcoming'}</Label>;
}
