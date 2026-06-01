import { getBookingProfit } from './bookingFinancials';

export const BOOKING_SORT_OPTIONS = [
  { value: 'departure_desc', label: 'Departure (newest)' },
  { value: 'departure_asc', label: 'Departure (oldest)' },
  { value: 'guest_asc', label: 'Guest (A–Z)' },
  { value: 'price_desc', label: 'Price (high–low)' },
  { value: 'price_asc', label: 'Price (low–high)' },
  { value: 'profit_desc', label: 'Profit (high–low)' },
  { value: 'profit_asc', label: 'Profit (low–high)' },
];

export function sortBookings(bookings, sortKey = 'departure_desc') {
  const list = [...bookings];

  list.sort((a, b) => {
    switch (sortKey) {
      case 'departure_asc':
        return (a.travelStartDate || '').localeCompare(b.travelStartDate || '');
      case 'guest_asc':
        return (a.guestName || '').localeCompare(b.guestName || '');
      case 'price_desc':
        return Number(b.packagePrice || 0) - Number(a.packagePrice || 0);
      case 'price_asc':
        return Number(a.packagePrice || 0) - Number(b.packagePrice || 0);
      case 'profit_desc': {
        const profitA = getBookingProfit(a) ?? -Infinity;
        const profitB = getBookingProfit(b) ?? -Infinity;
        return profitB - profitA;
      }
      case 'profit_asc': {
        const profitA = getBookingProfit(a) ?? Infinity;
        const profitB = getBookingProfit(b) ?? Infinity;
        return profitA - profitB;
      }
      case 'departure_desc':
      default:
        return (b.travelStartDate || '').localeCompare(a.travelStartDate || '');
    }
  });

  return list;
}

export const BATCH_SORT_OPTIONS = [
  { value: 'departure_asc', label: 'Departure (soonest)' },
  { value: 'departure_desc', label: 'Departure (latest)' },
  { value: 'bookings_desc', label: 'Most bookings' },
  { value: 'balance_desc', label: 'Highest balance' },
];

export function sortScheduleBatches(batches, sortKey = 'departure_asc') {
  const list = [...batches];

  list.sort((a, b) => {
    switch (sortKey) {
      case 'departure_desc':
        return (b.travelStartDate || '').localeCompare(a.travelStartDate || '');
      case 'bookings_desc':
        return Number(b.totalBookings || 0) - Number(a.totalBookings || 0);
      case 'balance_desc':
        return Number(b.totalBalance || 0) - Number(a.totalBalance || 0);
      case 'departure_asc':
      default:
        return (a.travelStartDate || '').localeCompare(b.travelStartDate || '');
    }
  });

  return list;
}
