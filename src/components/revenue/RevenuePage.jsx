import { useMemo, useState } from 'react';
import { formatCurrency, getStatusBadgeClass } from '../../utils/helpers';
import { PARTNERS } from '../../data/constants';
import { formatMonthLabel, getPeriodRange } from '../../utils/datePeriods';
import {
  computeRevenueMetrics,
  filterBookingsByRevenuePeriod,
  getLastMonthsBreakdown,
  getRevenueTableRow,
} from '../../utils/revenueMetrics';
import { downloadRevenueCsv } from '../../utils/exportRevenueCsv';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { getBookingProfit } from '../../utils/bookingFinancials';

const PERIOD_PRESETS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'custom', label: 'Custom range' },
  { value: 'all_time', label: 'All time' },
];

function RevenuePage({ bookings, onViewBooking, onExportToast }) {
  const [preset, setPreset] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const range = useMemo(
    () => (preset === 'all_time' ? null : getPeriodRange(preset, customStart, customEnd)),
    [preset, customStart, customEnd]
  );

  const metrics = useMemo(
    () => computeRevenueMetrics(bookings, preset, customStart, customEnd),
    [bookings, preset, customStart, customEnd]
  );

  const tableBookings = useMemo(
    () => filterBookingsByRevenuePeriod(bookings, preset, customStart, customEnd),
    [bookings, preset, customStart, customEnd]
  );

  const monthlyBreakdown = useMemo(
    () => getLastMonthsBreakdown(bookings, 6),
    [bookings]
  );

  function handleExportCsv() {
    downloadRevenueCsv(tableBookings, range);
    onExportToast?.();
  }

  return (
    <div className="revenue-page">
      <div className="revenue-toolbar bookings-toolbar-wrap">
        <select
          className="toolbar-select"
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
        >
          {PERIOD_PRESETS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {preset === 'custom' && (
          <>
            <input
              className="form-input revenue-date-input"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              aria-label="Start date"
            />
            <input
              className="form-input revenue-date-input"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              aria-label="End date"
            />
          </>
        )}

        <button type="button" className="secondary-btn" onClick={handleExportCsv}>
          Export CSV
        </button>
      </div>

      {preset === 'all_time' && bookings.length > 50 && (
        <p className="revenue-warning">
          Showing all time across {bookings.length} bookings — filters may feel slow on
          large datasets.
        </p>
      )}

      <div className="revenue-kpi-grid dashboard-grid">
        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Gross revenue</div>
            <div className="dashboard-card-value">
              {formatCurrency(metrics.grossRevenue)}
            </div>
          </div>
          <div className="dashboard-card-icon green">📈</div>
        </div>

        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Collected</div>
            <div className="dashboard-card-value">
              {formatCurrency(metrics.collected)}
            </div>
          </div>
          <div className="dashboard-card-icon teal">💵</div>
        </div>

        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Outstanding</div>
            <div className="dashboard-card-value">
              {formatCurrency(metrics.outstanding)}
            </div>
          </div>
          <div className="dashboard-card-icon orange">⏳</div>
        </div>

        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Expenses</div>
            <div className="dashboard-card-value">
              {formatCurrency(metrics.expenses)}
            </div>
          </div>
          <div className="dashboard-card-icon orange">📉</div>
        </div>

        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Net profit</div>
            <div className="dashboard-card-value">
              {formatCurrency(metrics.netProfit)}
            </div>
          </div>
          <div className="dashboard-card-icon green">💰</div>
        </div>

        {PARTNERS.map((partner) => (
          <div key={partner} className="dashboard-card">
            <div>
              <div className="dashboard-card-label">{partner} (50%)</div>
              <div className="dashboard-card-value">
                {formatCurrency(metrics.partnerTotals[partner] ?? 0)}
              </div>
            </div>
            <div className="dashboard-card-icon blue">👤</div>
          </div>
        ))}
      </div>

      {monthlyBreakdown.length > 0 && (
        <div className="revenue-breakdown-card">
          <h3 className="dashboard-table-title">Last 6 months (by payment month)</h3>
          <div className="revenue-breakdown-scroll">
            <table className="bookings-table revenue-breakdown-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                  {PARTNERS.map((p) => (
                    <th key={p}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((row) => (
                  <tr key={row.monthKey}>
                    <td>{formatMonthLabel(row.monthKey)}</td>
                    <td>{row.bookingCount}</td>
                    <td>{formatCurrency(row.grossRevenue)}</td>
                    <td>{formatCurrency(row.netProfit)}</td>
                    {PARTNERS.map((p) => (
                      <td key={p}>{formatCurrency(row.partnerTotals[p] ?? 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="revenue-table-card dashboard-table-card">
        <div className="dashboard-table-header">
          <h3 className="dashboard-table-title">
            Bookings in period ({tableBookings.length})
          </h3>
        </div>

        {!tableBookings.length ? (
          <div className="empty-state">
            <p>No bookings in this period.</p>
            <span>Try another preset or custom date range.</span>
          </div>
        ) : (
          <div className="bookings-table-wrap">
            <table className="bookings-table revenue-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Guest</th>
                  <th>Package</th>
                  <th>Attribution</th>
                  <th>Price</th>
                  <th>Collected</th>
                  <th>Profit</th>
                  {PARTNERS.map((p) => (
                    <th key={p}>{p}</th>
                  ))}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tableBookings.map((booking) => {
                  const row = getRevenueTableRow(booking, range);
                  const profit = getBookingProfit(booking);
                  return (
                    <tr
                      key={booking.id}
                      className="booking-row-clickable"
                      onClick={() => onViewBooking?.(booking)}
                    >
                      <td className="ref-cell">{booking.bookingRef || '-'}</td>
                      <td>{booking.guestName || '-'}</td>
                      <td>{booking.packageName || '-'}</td>
                      <td>{formatMonthLabel(row.attributionMonth)}</td>
                      <td>{formatCurrency(booking.packagePrice)}</td>
                      <td>{formatCurrency(row.collectedInPeriod)}</td>
                      <td>{profit != null ? formatCurrency(profit) : '-'}</td>
                      {row.partnerShares.map((s) => (
                        <td key={s.partner}>
                          {s.amount != null ? formatCurrency(s.amount) : '-'}
                        </td>
                      ))}
                      <td>
                        <span
                          className={getStatusBadgeClass(
                            resolveBookingStatus(booking)
                          )}
                        >
                          {resolveBookingStatus(booking)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default RevenuePage;
