import { resolveBookingStatus } from './bookingStatus';

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
