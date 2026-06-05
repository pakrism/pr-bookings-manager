import { resolveBookingStatus } from './bookingStatus';

const STATUS_TABS = [
  { value: 'All', label: 'All' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'On-Going', label: 'On-Going' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Refunded', label: 'Refunded' },
];

export function getBookingStatusCounts(bookings) {
  const counts = { All: bookings.length };

  for (const tab of STATUS_TABS) {
    if (tab.value === 'All') continue;
    counts[tab.value] = bookings.filter(
      (b) => resolveBookingStatus(b) === tab.value
    ).length;
  }

  return counts;
}

export function getBookingStatusTabs(bookings) {
  const counts = getBookingStatusCounts(bookings);
  return STATUS_TABS.map((tab) => ({
    ...tab,
    count: counts[tab.value] ?? 0,
  }));
}

export function filterBookingsByStatusTab(bookings, tabValue) {
  if (!tabValue || tabValue === 'All') return bookings;
  return bookings.filter((b) => resolveBookingStatus(b) === tabValue);
}

export { STATUS_TABS };
