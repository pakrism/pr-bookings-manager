import { resolveBookingStatus } from './bookingStatus';
import { getBookingBalance } from './bookingBalance';
import { getBookingProfit } from './bookingFinancials';
import { getTotalPaid, getTotalDebits, getNetCashPosition } from './payments';
import { normalizeBookingTourType } from './tourType';
import { getProfitDistribution } from './partnerProfit';
import { getProfitPercentage } from './revenueMetrics';
import { getAllRecipientConfigs } from '../data/profitPools';

const RECIPIENT_CONFIGS = getAllRecipientConfigs();

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadBookingsCsv(bookings, filename = 'pakrism-bookings.csv') {
  const recipientHeaders = RECIPIENT_CONFIGS.flatMap((c) => [
    `${c.label} Amount`,
    `${c.label} Paid`,
  ]);

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
    'Total Expenses',
    'Net Cash',
    'Balance',
    'Profit',
    'Profit %',
    ...recipientHeaders,
    'Booked By',
  ];

  const rows = bookings.map((booking) => {
    const distribution = getProfitDistribution(booking);
    const profit = getBookingProfit(booking);
    const recipientCells = RECIPIENT_CONFIGS.flatMap((config) => {
      const dist = distribution.find((d) => d.shareKey === config.shareKey);
      return [dist?.amount ?? '', dist?.paid ? 'Yes' : 'No'];
    });

    return [
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
      getTotalDebits(booking) || booking.totalExpenses || '',
      getNetCashPosition(booking),
      getBookingBalance(booking),
      profit ?? '',
      getProfitPercentage(profit, booking.packagePrice)?.toFixed(1) ?? '',
      ...recipientCells,
      booking.bookedBy,
    ];
  });

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
