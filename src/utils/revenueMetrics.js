import { getBookingProfit, getBookingExpenses } from './bookingFinancials';
import { getBookingBalance } from './bookingBalance';
import { getPaymentsFromBooking, getTotalPaid } from './payments';
import { getPartnerShareAmount } from './partnerProfit';
import { PARTNERS } from '../data/constants';
import {
  toMonthKey,
  getPeriodRange,
  isDateInRange,
  isMonthKeyInPeriod,
} from './datePeriods';
import { resolveBookingStatus } from './bookingStatus';

export function getRevenueAttributionDate(booking) {
  const payments = getPaymentsFromBooking(booking);
  if (!payments.length) {
    return booking.travelStartDate || '';
  }

  const sorted = [...payments].sort((a, b) =>
    (b.paidAt || '').localeCompare(a.paidAt || '')
  );
  return sorted[0]?.paidAt || booking.travelStartDate || '';
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

  if (preset === 'custom' && range) {
    return bookings.filter((booking) => {
      const payments = getPaymentsInRange(booking, range);
      if (payments.length > 0) return true;
      return isDateInRange(getRevenueAttributionDate(booking), range);
    });
  }

  if (range) {
    return bookings.filter((booking) => {
      const paymentsInRange = getPaymentsInRange(booking, range);
      if (paymentsInRange.length > 0) return true;
      return isDateInRange(getRevenueAttributionDate(booking), range);
    });
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

export function computeRevenueMetrics(bookings, preset, customStart, customEnd) {
  const range = preset === 'all_time' ? null : getPeriodRange(preset, customStart, customEnd);
  const inPeriod = filterBookingsByRevenuePeriod(
    bookings,
    preset,
    customStart,
    customEnd
  );

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

  const partnerTotals = {};
  for (const partner of PARTNERS) {
    partnerTotals[partner] = inPeriod.reduce((sum, b) => {
      const share = getPartnerShareAmount(b);
      return sum + (share ?? 0);
    }, 0);
  }

  return {
    bookingCount: inPeriod.length,
    grossRevenue,
    collected,
    outstanding,
    expenses,
    netProfit,
    partnerTotals,
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
  return {
    booking,
    attributionMonth: getRevenueAttributionMonth(booking),
    collectedInPeriod: getCollectedInPeriod(booking, range),
    profit: getBookingProfit(booking),
    status: resolveBookingStatus(booking),
    partnerShares: PARTNERS.map((partner) => ({
      partner,
      amount: getPartnerShareAmount(booking),
    })),
  };
}
