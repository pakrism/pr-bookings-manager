import { resolveBookingStatus } from './bookingStatus';
import { toMonthKey, getPeriodRange, isDateInRange } from './datePeriods';
import { sortBookings } from './bookingSort';

export const BOOKING_DATE_PRESETS = [
  { value: 'all_dates', label: 'All dates' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'pick_month', label: 'Pick month' },
  { value: 'custom', label: 'Custom range' },
];

export function filterBookings(bookings, searchTerm, statusFilter) {
  const query = searchTerm.trim().toLowerCase();

  return bookings.filter((booking) => {
    const matchesSearch =
      !query ||
      booking.guestName?.toLowerCase().includes(query) ||
      booking.packageName?.toLowerCase().includes(query) ||
      booking.destination?.toLowerCase().includes(query) ||
      booking.bookingRef?.toLowerCase().includes(query);

    const resolvedStatus = resolveBookingStatus(booking);
    const matchesStatus =
      statusFilter === 'All Status' || resolvedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

export function filterBookingsByTravelMonth(bookings, monthFilter) {
  if (!monthFilter || monthFilter === 'All months') {
    return bookings;
  }

  return bookings.filter(
    (booking) => toMonthKey(booking.travelStartDate) === monthFilter
  );
}

export function prepareBookingsForList(
  bookings,
  { searchTerm, statusFilter, sortKey }
) {
  const filtered = filterBookings(bookings, searchTerm, statusFilter);
  return sortBookings(filtered, sortKey);
}

export function getTravelMonthOptions(bookings) {
  const keys = new Set();
  for (const booking of bookings) {
    const key = toMonthKey(booking.travelStartDate);
    if (key) keys.add(key);
  }
  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}

export function filterBookingsByTravelPreset(
  bookings,
  { preset = 'all_dates', monthKey = '', customStart = '', customEnd = '' } = {}
) {
  if (!preset || preset === 'all_dates') {
    return bookings;
  }

  if (preset === 'pick_month') {
    if (!monthKey) return bookings;
    return bookings.filter(
      (booking) => toMonthKey(booking.travelStartDate) === monthKey
    );
  }

  const range = getPeriodRange(preset, customStart, customEnd);
  if (!range) {
    return bookings;
  }

  return bookings.filter((booking) =>
    isDateInRange(booking.travelStartDate, range)
  );
}

export function getTravelPresetLabel(preset, monthKey, customStart, customEnd) {
  if (preset === 'all_dates' || !preset) return 'All departure dates';
  if (preset === 'pick_month' && monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return `Departures in ${date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
  }
  if (preset === 'custom' && customStart && customEnd) {
    return `Departures from ${customStart} to ${customEnd}`;
  }
  const option = BOOKING_DATE_PRESETS.find((item) => item.value === preset);
  return option ? `${option.label} departures` : 'Filtered departures';
}

export function filterBookingsByBookedBy(bookings, bookedByFilter) {
  if (!bookedByFilter || bookedByFilter === 'all') {
    return bookings;
  }

  return bookings.filter(
    (booking) => (booking.bookedBy || '').trim() === bookedByFilter
  );
}
