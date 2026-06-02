import { formatMonthLabel } from './datePeriods';
import { getRevenueTableRow } from './revenueMetrics';
import { getAllRecipientConfigs } from '../data/profitPools';

const RECIPIENT_CONFIGS = getAllRecipientConfigs();

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadRevenueCsv(bookings, range, filename = 'pakrism-revenue.csv') {
  const recipientHeaders = RECIPIENT_CONFIGS.flatMap((c) => [
    `${c.label} Amount`,
    `${c.label} Paid`,
  ]);

  const headers = [
    'Ref',
    'Guest',
    'Package',
    'Departure Month',
    'Package Price',
    'Collected (period)',
    'Profit',
    'Profit %',
    ...recipientHeaders,
    'Status',
  ];

  const rows = bookings.map((booking) => {
    const row = getRevenueTableRow(booking, range);
    const recipientCells = RECIPIENT_CONFIGS.flatMap((config) => {
      const dist = row.distribution.find((d) => d.shareKey === config.shareKey);
      return [
        dist?.amount ?? '',
        dist?.paid ? 'Yes' : 'No',
      ];
    });

    return [
      booking.bookingRef,
      booking.guestName,
      booking.packageName,
      formatMonthLabel(row.attributionMonth),
      booking.packagePrice,
      row.collectedInPeriod,
      row.profit ?? '',
      row.profitPercentage != null ? row.profitPercentage.toFixed(1) : '',
      ...recipientCells,
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
