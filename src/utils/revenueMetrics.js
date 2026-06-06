import { getBookingProfit, getBookingExpenses } from './bookingFinancials';
import { getBookingBalance } from './bookingBalance';
import { getPaymentsFromBooking, getTotalPaid } from './payments';
import {
  getRecipientTotals,
  getPoolTotals,
  getProfitDistribution,
  getPartnerPoolTotals,
  isPartnerPoolPaid,
} from './partnerProfit';
import {
  toMonthKey,
  getPeriodRange,
  isDateInRange,
  isMonthKeyInPeriod,
} from './datePeriods';
import { resolveBookingStatus } from './bookingStatus';

export function getRevenueAttributionDate(booking) {
  return booking.travelStartDate || '';
}

export function getRevenueAttributionMonth(booking) {
  return toMonthKey(getRevenueAttributionDate(booking));
}

export function getPaymentsInRange(booking, range) {
  if (!range) {
    return getPaymentsFromBooking(booking);
  }

  return getPaymentsFromBooking(booking).filter((payment) =>
    isDateInRange(payment.paidAt, range)
  );
}

export function getCollectedInPeriod(booking, range) {
  if (!range) {
    return getTotalPaid(booking);
  }
  return getPaymentsInRange(booking, range).reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
}

export function getProfitPercentage(profit, revenue) {
  const safeRevenue = Number(revenue || 0);
  if (safeRevenue <= 0 || profit == null) return null;
  return (Number(profit) / safeRevenue) * 100;
}

export function filterBookingsByRevenuePeriod(
  bookings,
  preset,
  customStart = '',
  customEnd = ''
) {
  if (preset === 'all_time') {
    return [...bookings];
  }

  const range = getPeriodRange(preset, customStart, customEnd);
  if (range) {
    return bookings.filter((booking) =>
      isDateInRange(getRevenueAttributionDate(booking), range)
    );
  }

  return bookings.filter((booking) =>
    isMonthKeyInPeriod(
      getRevenueAttributionMonth(booking),
      preset,
      customStart,
      customEnd
    )
  );
}

export function filterBookingsForFinance(bookings, filters = {}) {
  const {
    status = 'all',
    bookedBy = 'all',
    payoutFilter = 'all',
  } = filters;

  return bookings.filter((booking) => {
    if (status !== 'all') {
      const resolved = resolveBookingStatus(booking);
      if (resolved !== status) return false;
    }

    if (bookedBy !== 'all') {
      const value = (booking.bookedBy || '').trim();
      if (value !== bookedBy) return false;
    }

    if (payoutFilter === 'partner_unpaid') {
      const zohaibUnpaid = !isPartnerPoolPaid(booking, 'zohaib');
      const pervaizUnpaid = !isPartnerPoolPaid(booking, 'pervaiz');
      if (!zohaibUnpaid && !pervaizUnpaid) return false;
    }

    if (payoutFilter === 'recipient_unpaid') {
      const distribution = getProfitDistribution(booking);
      if (!distribution.some((row) => !row.paid)) return false;
    }

    return true;
  });
}

export function computeRevenueMetrics(bookings, preset, customStart, customEnd, filters = {}) {
  const periodBookings = filterBookingsByRevenuePeriod(
    bookings,
    preset,
    customStart,
    customEnd
  );
  const inPeriod = filterBookingsForFinance(periodBookings, filters);
  const range = preset === 'all_time' ? null : getPeriodRange(preset, customStart, customEnd);

  const grossRevenue = inPeriod.reduce(
    (sum, b) => sum + Number(b.packagePrice || 0),
    0
  );

  const collected = inPeriod.reduce(
    (sum, b) => sum + getCollectedInPeriod(b, range),
    0
  );

  const outstanding = inPeriod.reduce(
    (sum, b) => sum + getBookingBalance(b),
    0
  );

  const expenses = inPeriod.reduce((sum, b) => {
    const exp = getBookingExpenses(b);
    return sum + (exp ?? 0);
  }, 0);

  const netProfit = inPeriod.reduce((sum, b) => {
    const profit = getBookingProfit(b);
    return sum + (profit ?? 0);
  }, 0);
  const profitPercentage = getProfitPercentage(netProfit, grossRevenue);

  const poolTotals = getPoolTotals(inPeriod);
  const recipientTotals = getRecipientTotals(inPeriod);
  const partnerPoolTotals = getPartnerPoolTotals(inPeriod);

  return {
    bookingCount: inPeriod.length,
    grossRevenue,
    collected,
    outstanding,
    expenses,
    netProfit,
    profitPercentage,
    poolTotals,
    recipientTotals,
    partnerPoolTotals,
    bookings: inPeriod,
  };
}

export function getLastMonthsBreakdown(bookings, monthCount = 6) {
  const keys = new Set();
  for (const booking of bookings) {
    const key = getRevenueAttributionMonth(booking);
    if (key) keys.add(key);
  }

  const sortedKeys = Array.from(keys).sort((a, b) => b.localeCompare(a)).slice(0, monthCount);

  return sortedKeys.map((monthKey) => {
    const monthBookings = bookings.filter(
      (b) => getRevenueAttributionMonth(b) === monthKey
    );
    const metrics = computeRevenueMetrics(monthBookings, 'all_time');
    return {
      monthKey,
      ...metrics,
    };
  });
}

export function getRevenueTableRow(booking, range) {
  const revenue = Number(booking.packagePrice || 0);
  const profit = getBookingProfit(booking);
  return {
    booking,
    attributionMonth: getRevenueAttributionMonth(booking),
    collectedInPeriod: getCollectedInPeriod(booking, range),
    profit,
    profitPercentage: getProfitPercentage(profit, revenue),
    status: resolveBookingStatus(booking),
    distribution: getProfitDistribution(booking),
    partnerPoolPaid: {
      zohaib: isPartnerPoolPaid(booking, 'zohaib'),
      pervaiz: isPartnerPoolPaid(booking, 'pervaiz'),
    },
  };
}
