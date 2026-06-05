import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import TableToolbar from '../ui/TableToolbar';
import { getTravelMonthOptions } from '../../utils/bookingFilters';
import { formatMonthLabel } from '../../utils/datePeriods';

export default function BookingTableToolbar({
  bookings,
  searchValue,
  onSearchChange,
  monthFilter,
  onMonthChange,
  dateStart,
  dateEnd,
  onDateStartChange,
  onDateEndChange,
}) {
  const monthOptions = getTravelMonthOptions(bookings);

  return (
    <TableToolbar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      placeholder="Search customer or booking ref..."
      filterSlot={
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            type="date"
            label="Start date"
            value={dateStart}
            onChange={(e) => onDateStartChange?.(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            type="date"
            label="End date"
            value={dateEnd}
            onChange={(e) => onDateEndChange?.(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            select
            label="Month"
            value={monthFilter || 'All months'}
            onChange={(e) => onMonthChange?.(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="All months">All months</MenuItem>
            {monthOptions.map((key) => (
              <MenuItem key={key} value={key}>{formatMonthLabel(key)}</MenuItem>
            ))}
          </TextField>
        </Box>
      }
    />
  );
}
