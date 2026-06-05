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
  statusFilter,
  onStatusChange,
  monthFilter,
  onMonthChange,
}) {
  const monthOptions = getTravelMonthOptions(bookings);

  return (
    <TableToolbar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      placeholder="Search by guest, package, destination, ref..."
      filterSlot={
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            select
            label="Month"
            value={monthFilter || 'All months'}
            onChange={(e) => onMonthChange?.(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="All months">All months</MenuItem>
            {monthOptions.map((key) => (
              <MenuItem key={key} value={key}>
                {formatMonthLabel(key)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="All Status">All Status</MenuItem>
            <MenuItem value="Upcoming">Upcoming</MenuItem>
            <MenuItem value="On-Going">On-Going</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
            <MenuItem value="Refunded">Refunded</MenuItem>
          </TextField>
        </Box>
      }
    />
  );
}
