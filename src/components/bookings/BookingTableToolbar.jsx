import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableToolbar from '../ui/TableToolbar';
import { BOOKED_BY_OPTIONS } from '../../data/constants';
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
  bookedByFilter,
  onBookedByChange,
}) {
  const monthOptions = getTravelMonthOptions(bookings);
  const showRangeHint = dateStart && dateEnd;

  return (
    <TableToolbar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      placeholder="Search customer or booking ref..."
      filterSlot={
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
          <TextField
            select
            label="Booked by"
            value={bookedByFilter || 'all'}
            onChange={(e) => onBookedByChange?.(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All</MenuItem>
            {BOOKED_BY_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          {showRangeHint && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Trips overlapping {dateStart} to {dateEnd}
            </Typography>
          )}
        </Box>
      }
    />
  );
}
