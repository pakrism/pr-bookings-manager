import { resolveBookingStatus } from './bookingStatus';
import { toMonthKey } from './datePeriods';
import { sortBookings } from './bookingSort';

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
  { searchTerm, statusFilter, monthFilter, sortKey }
) {
  const filtered = filterBookings(bookings, searchTerm, statusFilter);
  const byMonth = filterBookingsByTravelMonth(filtered, monthFilter);
  return sortBookings(byMonth, sortKey);
}

export function getTravelMonthOptions(bookings) {
  const keys = new Set();
  for (const booking of bookings) {
    const key = toMonthKey(booking.travelStartDate);
    if (key) keys.add(key);
  }
  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}
