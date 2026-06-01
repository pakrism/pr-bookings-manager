import { resolveBookingStatus } from './bookingStatus';
import { getBookingBalance } from './bookingBalance';
import { getBookingProfit } from './bookingFinancials';
import { getTotalPaid } from './payments';
import { normalizeBookingTourType } from './tourType';
import { getPartnerShareAmount } from './partnerProfit';

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadBookingsCsv(bookings, filename = 'pakrism-bookings.csv') {
  const headers = [
    'Ref',
    'Guest',
    'Package',
    'Destination',
    'Departure',
    'Return',
    'Status',
    'Tour Type',
    'Price',
    'Total Paid',
    'Balance',
    'Profit',
    'Partner Share (each)',
    'Booked By',
  ];

  const rows = bookings.map((booking) => [
    booking.bookingRef,
    booking.guestName,
    booking.packageName,
    booking.destination,
    booking.travelStartDate,
    booking.travelEndDate,
    resolveBookingStatus(booking),
    normalizeBookingTourType(booking.type),
    booking.packagePrice,
    getTotalPaid(booking),
    getBookingBalance(booking),
    getBookingProfit(booking) ?? '',
    getPartnerShareAmount(booking) ?? '',
    booking.bookedBy,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
