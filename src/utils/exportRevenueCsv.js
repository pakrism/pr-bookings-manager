import { formatMonthLabel } from './datePeriods';
import { getRevenueTableRow } from './revenueMetrics';
import { PARTNERS } from '../data/constants';

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadRevenueCsv(bookings, range, filename = 'pakrism-revenue.csv') {
  const headers = [
    'Ref',
    'Guest',
    'Package',
    'Attribution Month',
    'Package Price',
    'Collected (period)',
    'Profit',
    'Profit %',
    ...PARTNERS.map((p) => `${p} Share`),
    'Status',
  ];

  const rows = bookings.map((booking) => {
    const row = getRevenueTableRow(booking, range);
    return [
      booking.bookingRef,
      booking.guestName,
      booking.packageName,
      formatMonthLabel(row.attributionMonth),
      booking.packagePrice,
      row.collectedInPeriod,
      row.profit ?? '',
      row.profitPercentage != null ? row.profitPercentage.toFixed(1) : '',
      ...row.partnerShares.map((s) => s.amount ?? ''),
      row.status,
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
