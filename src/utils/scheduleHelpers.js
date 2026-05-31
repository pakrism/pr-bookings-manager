import { formatCurrency } from './helpers';
import { getBookingBalance } from './bookingBalance';
import { getTotalPaid } from './payments';

function safeDateValue(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function getScheduleBatchKey(booking) {
  const start = booking.travelStartDate || '';
  const end = booking.travelEndDate || '';
  const destination = (booking.destination || '').trim().toLowerCase();
  const duration = (booking.duration || '').trim().toLowerCase();

  return `${start}__${end}__${destination}__${duration}`;
}

export function getTripBatchLabel(startDate, endDate) {
  const start = safeDateValue(startDate);
  const end = safeDateValue(endDate);

  if (!start || !end) return 'Dates not set';

  const startLabel = start.toLocaleDateString('en-GB', {
    month: 'short',
    day: '2-digit',
  });

  const endLabel = end.toLocaleDateString('en-GB', {
    month: start.getMonth() === end.getMonth() ? undefined : 'short',
    day: '2-digit',
  });

  return `${startLabel}–${endLabel}`;
}

export function getScheduleBatchStatus(batch) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = safeDateValue(batch.travelStartDate);
  const end = safeDateValue(batch.travelEndDate);

  if (!start || !end) return 'Upcoming';
  if (today >= start && today <= end) return 'On-Going';
  if (today < start) return 'Upcoming';
  return 'Completed';
}

export function groupBookingsIntoSchedules(bookings = [], options = {}) {
  const { search = '', view = 'upcoming' } = options;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = bookings.filter((booking) => {
    const start = safeDateValue(booking.travelStartDate);
    const end = safeDateValue(booking.travelEndDate);

    let matchesView = true;

    if (view === 'upcoming') {
      matchesView = !!start && start >= today;
    } else if (view === 'past') {
      matchesView = !!end && end < today;
    } else if (view === 'ongoing') {
      matchesView = !!start && !!end && today >= start && today <= end;
    }

    const matchesSearch =
      !normalizedSearch ||
      (booking.guestName || '').toLowerCase().includes(normalizedSearch) ||
      (booking.destination || '').toLowerCase().includes(normalizedSearch) ||
      (booking.packageName || '').toLowerCase().includes(normalizedSearch) ||
      (booking.bookingRef || '').toLowerCase().includes(normalizedSearch);

    return matchesView && matchesSearch;
  });

  const groupedMap = new Map();

  for (const booking of filtered) {
    const key = getScheduleBatchKey(booking);
    const existing = groupedMap.get(key);

    const pax =
      Number(booking.adults || 0) +
      Number(booking.children || 0) +
      Number(booking.infants || 0);

    const advance = getTotalPaid(booking);
    const packagePrice = Number(booking.packagePrice || 0);
    const balance = getBookingBalance(booking);

    if (!existing) {
      groupedMap.set(key, {
        batchKey: key,
        tripBatch: getTripBatchLabel(
          booking.travelStartDate,
          booking.travelEndDate
        ),
        travelStartDate: booking.travelStartDate || '',
        travelEndDate: booking.travelEndDate || '',
        destination: booking.destination || '-',
        duration: booking.duration || '-',
        packageName: booking.packageName || '-',
        totalBookings: 1,
        totalPax: pax,
        totalAdvance: advance,
        totalPackageAmount: packagePrice,
        totalBalance: balance,
        bookings: [booking],
      });
    } else {
      existing.totalBookings += 1;
      existing.totalPax += pax;
      existing.totalAdvance += advance;
      existing.totalPackageAmount += packagePrice;
      existing.totalBalance += balance;
      existing.bookings.push(booking);
    }
  }

  return Array.from(groupedMap.values())
    .map((batch) => ({
      ...batch,
      bookings: [...batch.bookings].sort((a, b) => {
        const aTime = safeDateValue(a.travelStartDate)?.getTime() || 0;
        const bTime = safeDateValue(b.travelStartDate)?.getTime() || 0;
        return aTime - bTime;
      }),
    }))
    .sort((a, b) => {
      const aTime = safeDateValue(a.travelStartDate)?.getTime() || 0;
      const bTime = safeDateValue(b.travelStartDate)?.getTime() || 0;
      return aTime - bTime;
    });
}

export function getScheduleKpis(groupedSchedules = []) {
  return groupedSchedules.reduce(
    (acc, batch) => {
      acc.totalBatches += 1;
      acc.totalPax += Number(batch.totalPax || 0);
      acc.totalAdvance += Number(batch.totalAdvance || 0);
      acc.totalBalance += Number(batch.totalBalance || 0);
      return acc;
    },
    {
      totalBatches: 0,
      totalPax: 0,
      totalAdvance: 0,
      totalBalance: 0,
    }
  );
}

export function formatScheduleMoney(value) {
  return formatCurrency(Number(value || 0));
}
