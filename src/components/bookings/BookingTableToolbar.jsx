import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableToolbar from '../ui/TableToolbar';
import { BOOKED_BY_OPTIONS } from '../../data/constants';
import {
  BOOKING_DATE_PRESETS,
  getTravelMonthOptions,
  getTravelPresetLabel,
} from '../../utils/bookingFilters';
import { formatMonthLabel } from '../../utils/datePeriods';

export default function BookingTableToolbar({
  bookings,
  searchValue,
  onSearchChange,
  datePreset,
  onDatePresetChange,
  travelMonth,
  onTravelMonthChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  bookedByFilter,
  onBookedByChange,
}) {
  const monthOptions = getTravelMonthOptions(bookings);
  const hint = getTravelPresetLabel(datePreset, travelMonth, customStart, customEnd);

  return (
    <TableToolbar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      placeholder="Search customer or booking ref..."
      filterSlot={
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            label="Travel dates"
            value={datePreset || 'all_dates'}
            onChange={(e) => onDatePresetChange?.(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {BOOKING_DATE_PRESETS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {datePreset === 'pick_month' && (
            <TextField
              select
              label="Month"
              value={travelMonth || ''}
              onChange={(e) => onTravelMonthChange?.(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Select month</MenuItem>
              {monthOptions.map((key) => (
                <MenuItem key={key} value={key}>
                  {formatMonthLabel(key)}
                </MenuItem>
              ))}
            </TextField>
          )}

          {datePreset === 'custom' && (
            <>
              <TextField
                type="date"
                label="From"
                value={customStart}
                onChange={(e) => onCustomStartChange?.(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                type="date"
                label="To"
                value={customEnd}
                onChange={(e) => onCustomEndChange?.(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
            </>
          )}

          <TextField
            select
            label="Booked by"
            value={bookedByFilter || 'all'}
            onChange={(e) => onBookedByChange?.(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All</MenuItem>
            {BOOKED_BY_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          {datePreset !== 'all_dates' && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              {hint}
            </Typography>
          )}
        </Box>
      }
    />
  );
}
