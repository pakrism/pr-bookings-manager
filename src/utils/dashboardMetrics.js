import { getBookingProfit } from './bookingFinancials';
import { getBookingBalance } from './bookingBalance';
import { getTotalPaid } from './payments';
import { resolveBookingStatus } from './bookingStatus';
import { normalizeBookingTourType } from './tourType';
import {
  getLastMonthsBreakdown,
  getRevenueAttributionMonth,
} from './revenueMetrics';
import { formatMonthLabel, toMonthKey } from './datePeriods';
import { formatCurrency } from './helpers';

const STATUS_ORDER = [
  'Upcoming',
  'On-Going',
  'Completed',
  'Cancelled',
  'Refunded',
];

function getLastNMonthKeys(count = 8) {
  const keys = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    keys.push(toMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`));
  }
  return keys;
}

function percentChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildSparklineSeries(breakdown, valueKey) {
  const sorted = [...breakdown].reverse();
  return sorted.map((row) => Number(row[valueKey] || 0));
}

export function computeDashboardMetrics(bookings) {
  const breakdown = getLastMonthsBreakdown(bookings, 6);
  const lastTwo = breakdown.slice(0, 2);
  const current = lastTwo[0];
  const previous = lastTwo[1];

  const totalRevenue = bookings.reduce(
    (sum, b) => sum + Number(b.packagePrice || 0),
    0
  );
  const totalProfit = bookings.reduce((sum, b) => {
    const p = getBookingProfit(b);
    return sum + (p ?? 0);
  }, 0);
  const outstanding = bookings.reduce(
    (sum, b) => sum + getBookingBalance(b),
    0
  );
  const totalAdvance = bookings.reduce(
    (sum, b) => sum + getTotalPaid(b),
    0
  );

  const kpiWidgets = [
    {
      id: 'bookings',
      title: 'Total Bookings',
      total: String(bookings.length),
      percent: percentChange(
        current?.bookingCount ?? 0,
        previous?.bookingCount ?? 0
      ),
      color: 'primary',
      icon: 'ri-calendar-check-line',
      chart: { series: buildSparklineSeries(breakdown, 'bookingCount') },
    },
    {
      id: 'revenue',
      title: 'Total Revenue',
      total: formatCurrency(totalRevenue),
      percent: percentChange(
        current?.grossRevenue ?? 0,
        previous?.grossRevenue ?? 0
      ),
      color: 'secondary',
      icon: 'ri-money-dollar-circle-line',
      chart: { series: buildSparklineSeries(breakdown, 'grossRevenue') },
    },
    {
      id: 'profit',
      title: 'Net Profit',
      total: formatCurrency(totalProfit),
      percent: percentChange(current?.netProfit ?? 0, previous?.netProfit ?? 0),
      color: 'success',
      icon: 'ri-line-chart-line',
      chart: { series: buildSparklineSeries(breakdown, 'netProfit') },
    },
    {
      id: 'outstanding',
      title: 'Outstanding',
      total: formatCurrency(outstanding),
      percent: percentChange(
        current?.outstanding ?? 0,
        previous?.outstanding ?? 0
      ),
      color: 'warning',
      icon: 'ri-time-line',
      chart: { series: buildSparklineSeries(breakdown, 'outstanding') },
    },
  ];

  const statusCounts = STATUS_ORDER.map((status) => ({
    label: status,
    value: bookings.filter((b) => resolveBookingStatus(b) === status).length,
  })).filter((row) => row.value > 0);

  const monthKeys = getLastNMonthKeys(8);
  const monthlyRevenue = monthKeys.map((key) => {
    const monthBookings = bookings.filter(
      (b) => getRevenueAttributionMonth(b) === key
    );
    const revenue = monthBookings.reduce(
      (sum, b) => sum + Number(b.packagePrice || 0),
      0
    );
    return { monthKey: key, label: formatMonthLabel(key), revenue };
  });

  const packageMap = {};
  for (const booking of bookings) {
    const name = booking.packageName || 'Unknown';
    if (!packageMap[name]) {
      packageMap[name] = { count: 0, profit: 0 };
    }
    packageMap[name].count += 1;
    const profit = getBookingProfit(booking);
    packageMap[name].profit += profit ?? 0;
  }

  const topPackages = Object.entries(packageMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const tourTypeMap = {};
  for (const booking of bookings) {
    const type = normalizeBookingTourType(booking.type);
    tourTypeMap[type] = (tourTypeMap[type] || 0) + 1;
  }
  const tourTypes = Object.entries(tourTypeMap).map(([label, value]) => ({
    label,
    value,
  }));

  const cityMap = {};
  for (const booking of bookings) {
    const city = booking.departureCity?.trim() || 'Unknown';
    cityMap[city] = (cityMap[city] || 0) + 1;
  }
  const topCities = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const timelineEntries = [];
  for (const booking of bookings) {
    const log = booking.auditLog || [];
    for (const entry of log) {
      timelineEntries.push({
        id: `${booking.id}-${entry.at || entry.timestamp || Math.random()}`,
        bookingRef: booking.bookingRef,
        guestName: booking.guestName,
        action: entry.action,
        summary: entry.summary,
        byName: entry.byName,
        at: entry.at || entry.timestamp,
      });
    }
  }

  timelineEntries.sort((a, b) => {
    const aTime = parseAuditTime(a.at);
    const bTime = parseAuditTime(b.at);
    return bTime - aTime;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const upcomingDepartures = bookings
    .filter((b) => {
      const status = resolveBookingStatus(b);
      if (status !== 'Upcoming') return false;
      if (!b.travelStartDate) return false;
      const start = new Date(b.travelStartDate);
      return start >= today && start <= weekAhead;
    })
    .sort((a, b) => (a.travelStartDate || '').localeCompare(b.travelStartDate || ''))
    .slice(0, 5);

  const recentBookings = [...bookings]
    .sort((a, b) => {
      const aTime = parseAuditTime(a.createdAt);
      const bTime = parseAuditTime(b.createdAt);
      return bTime - aTime;
    })
    .slice(0, 8);

  return {
    kpiWidgets,
    statusCounts,
    monthlyRevenue,
    topPackages,
    tourTypes,
    topCities,
    timelineEntries: timelineEntries.slice(0, 8),
    upcomingDepartures,
    recentBookings,
    totalAdvance,
    profitMargin:
      totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0,
  };
}

function parseAuditTime(value) {
  if (!value) return 0;
  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime();
  }
  if (typeof value === 'object' && value.seconds) {
    return value.seconds * 1000;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatAuditTime(value) {
  const time = parseAuditTime(value);
  if (!time) return '-';
  return new Date(time).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
