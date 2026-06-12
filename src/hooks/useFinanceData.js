import { useMemo, useState } from 'react';
import { getPeriodRange } from '../utils/datePeriods';
import {
  computeRevenueMetrics,
  filterBookingsByRevenuePeriod,
  filterBookingsForFinance,
  getLastMonthsBreakdown,
} from '../utils/revenueMetrics';

function percentChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildSparkline(breakdown, key) {
  return [...breakdown].reverse().map((row) => Number(row[key] || 0));
}

export function useFinanceData(bookings) {
  const [preset, setPreset] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookedByFilter, setBookedByFilter] = useState('all');
  const [payoutFilter, setPayoutFilter] = useState('all');

  const financeFilters = useMemo(
    () => ({
      status: statusFilter,
      bookedBy: bookedByFilter,
      payoutFilter,
    }),
    [statusFilter, bookedByFilter, payoutFilter]
  );

  const range = useMemo(
    () => (preset === 'all_time' ? null : getPeriodRange(preset, customStart, customEnd)),
    [preset, customStart, customEnd]
  );

  const metrics = useMemo(
    () => computeRevenueMetrics(bookings, preset, customStart, customEnd, financeFilters),
    [bookings, preset, customStart, customEnd, financeFilters]
  );

  const tableBookings = useMemo(() => {
    const periodBookings = filterBookingsByRevenuePeriod(
      bookings,
      preset,
      customStart,
      customEnd
    );
    return filterBookingsForFinance(periodBookings, financeFilters);
  }, [bookings, preset, customStart, customEnd, financeFilters]);

  const monthlyBreakdown = useMemo(
    () => getLastMonthsBreakdown(tableBookings, 6),
    [tableBookings]
  );

  const kpiWidgets = useMemo(() => {
    const lastTwo = monthlyBreakdown.slice(0, 2);
    const current = lastTwo[0];
    const previous = lastTwo[1];

    return [
      {
        id: 'revenue',
        title: 'Revenue',
        total: metrics.grossRevenue,
        percent: percentChange(current?.grossRevenue ?? 0, previous?.grossRevenue ?? 0),
        icon: 'ri-money-dollar-circle-line',
        color: 'primary',
        sparkKey: 'grossRevenue',
      },
      {
        id: 'collected',
        title: 'Collected',
        total: metrics.collected,
        percent: percentChange(current?.collected ?? 0, previous?.collected ?? 0),
        icon: 'ri-wallet-3-line',
        color: 'info',
        sparkKey: 'collected',
      },
      {
        id: 'profit',
        title: 'Net profit',
        total: metrics.netProfit,
        percent: percentChange(current?.netProfit ?? 0, previous?.netProfit ?? 0),
        icon: 'ri-line-chart-line',
        color: 'success',
        sparkKey: 'netProfit',
        subtitle: metrics.profitPercentage,
      },
      {
        id: 'outstanding',
        title: 'Outstanding',
        total: metrics.outstanding,
        percent: percentChange(current?.outstanding ?? 0, previous?.outstanding ?? 0),
        icon: 'ri-alert-line',
        color: 'warning',
        sparkKey: 'outstanding',
      },
    ].map((widget) => ({
      ...widget,
      chart: { series: buildSparkline(monthlyBreakdown, widget.sparkKey) },
    }));
  }, [metrics, monthlyBreakdown]);

  return {
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    statusFilter,
    setStatusFilter,
    bookedByFilter,
    setBookedByFilter,
    payoutFilter,
    setPayoutFilter,
    financeFilters,
    range,
    metrics,
    tableBookings,
    monthlyBreakdown,
    kpiWidgets,
  };
}
