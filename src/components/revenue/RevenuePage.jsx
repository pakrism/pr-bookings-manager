import { Fragment, useMemo, useState } from 'react';
import { formatCurrency, getStatusBadgeClass } from '../../utils/helpers';
import { getAllRecipientConfigs } from '../../data/profitPools';
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
import ProfitShareBreakdown from '../profit/ProfitShareBreakdown';

const PERIOD_PRESETS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'custom', label: 'Custom range' },
  { value: 'all_time', label: 'All time' },
];

const RECIPIENT_CONFIGS = getAllRecipientConfigs();

function RevenuePage({
  bookings,
  onViewBooking,
  onExportToast,
  canEdit = false,
  onToggleProfitSharePaid,
}) {
  const [preset, setPreset] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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

  const recipientList = useMemo(
    () =>
      RECIPIENT_CONFIGS.map((config) => ({
        ...config,
        ...(metrics.recipientTotals[config.shareKey] || {
          total: 0,
          paidTotal: 0,
          unpaidTotal: 0,
          paidCount: 0,
          unpaidCount: 0,
        }),
      })),
    [metrics.recipientTotals]
  );

  function handleExportCsv() {
    downloadRevenueCsv(tableBookings, range);
    onExportToast?.();
  }

  function formatPercent(value) {
    if (value == null || Number.isNaN(value)) return '-';
    return `${value.toFixed(1)}%`;
  }

  function toggleExpanded(bookingId, event) {
    event.stopPropagation();
    setExpandedId((prev) => (prev === bookingId ? null : bookingId));
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
            <div className="dashboard-card-label">Net profit</div>
            <div className="dashboard-card-value">
              {formatCurrency(metrics.netProfit)}
            </div>
            <div className="table-subtext">
              Margin {formatPercent(metrics.profitPercentage)}
            </div>
          </div>
          <div className="dashboard-card-icon green">💰</div>
        </div>

        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Zohaib pool (50%)</div>
            <div className="dashboard-card-value">
              {formatCurrency(metrics.poolTotals?.zohaib ?? 0)}
            </div>
          </div>
          <div className="dashboard-card-icon blue">👤</div>
        </div>

        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Pervaiz pool (50%)</div>
            <div className="dashboard-card-value">
              {formatCurrency(metrics.poolTotals?.pervaiz ?? 0)}
            </div>
          </div>
          <div className="dashboard-card-icon blue">👤</div>
        </div>
      </div>

      <div className="revenue-recipient-kpi-grid">
        {recipientList.map((recipient) => (
          <div key={recipient.shareKey} className="revenue-recipient-kpi">
            <div className="revenue-recipient-kpi-label">{recipient.label}</div>
            <div className="revenue-recipient-kpi-value">
              {formatCurrency(recipient.total)}
            </div>
            <div className="table-subtext">
              Paid {formatCurrency(recipient.paidTotal)} · Unpaid{' '}
              {formatCurrency(recipient.unpaidTotal)}
            </div>
          </div>
        ))}
      </div>

      <div className="revenue-breakdown-card">
        <h3 className="dashboard-table-title">Profit payouts (selected period)</h3>
        <div className="revenue-breakdown-scroll">
          <table className="bookings-table revenue-payouts-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Total due</th>
                <th>Paid</th>
                <th>Unpaid</th>
                <th>Paid lines</th>
                <th>Unpaid lines</th>
              </tr>
            </thead>
            <tbody>
              {recipientList.map((row) => (
                <tr key={row.shareKey}>
                  <td>{row.label}</td>
                  <td>{formatCurrency(row.total)}</td>
                  <td>{formatCurrency(row.paidTotal)}</td>
                  <td>{formatCurrency(row.unpaidTotal)}</td>
                  <td>{row.paidCount}</td>
                  <td>{row.unpaidCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {monthlyBreakdown.length > 0 && (
        <div className="revenue-breakdown-card">
          <h3 className="dashboard-table-title">
            Last 6 months (by departure month)
          </h3>
          <div className="revenue-breakdown-scroll">
            <table className="bookings-table revenue-breakdown-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Bookings</th>
                  <th>Profit</th>
                  {RECIPIENT_CONFIGS.map((c) => (
                    <th key={c.shareKey}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((row) => (
                  <tr key={row.monthKey}>
                    <td>{formatMonthLabel(row.monthKey)}</td>
                    <td>{row.bookingCount}</td>
                    <td>{formatCurrency(row.netProfit)}</td>
                    {RECIPIENT_CONFIGS.map((c) => {
                      const totals = row.recipientTotals?.[c.shareKey];
                      return (
                        <td key={c.shareKey}>
                          {totals ? (
                            <>
                              {formatCurrency(totals.total)}
                              <div className="table-subtext">
                                {totals.paidCount}/{row.bookingCount} paid
                              </div>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                      );
                    })}
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
                  <th aria-label="Expand" />
                  <th>Ref</th>
                  <th>Guest</th>
                  <th>Package</th>
                  <th>Departure</th>
                  <th>Profit</th>
                  <th>Profit %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tableBookings.map((booking) => {
                  const row = getRevenueTableRow(booking, range);
                  const profit = getBookingProfit(booking);
                  const isExpanded = expandedId === booking.id;
                  const paidCount = row.distribution.filter((d) => d.paid).length;
                  const totalShares = row.distribution.length;

                  return (
                    <Fragment key={booking.id}>
                      <tr
                        className="booking-row-clickable"
                        onClick={() => onViewBooking?.(booking)}
                      >
                        <td onClick={(e) => toggleExpanded(booking.id, e)}>
                          <button
                            type="button"
                            className="revenue-expand-btn"
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? '−' : '+'}
                          </button>
                        </td>
                        <td className="ref-cell">{booking.bookingRef || '-'}</td>
                        <td>{booking.guestName || '-'}</td>
                        <td>{booking.packageName || '-'}</td>
                        <td>{formatMonthLabel(row.attributionMonth)}</td>
                        <td>
                          {profit != null ? formatCurrency(profit) : '-'}
                          {totalShares > 0 && (
                            <div className="table-subtext">
                              {paidCount}/{totalShares} payouts paid
                            </div>
                          )}
                        </td>
                        <td>{formatPercent(row.profitPercentage)}</td>
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
                      {isExpanded && (
                        <tr className="revenue-detail-row">
                          <td colSpan={8}>
                            <ProfitShareBreakdown
                              booking={booking}
                              canEdit={canEdit}
                              compact
                              onTogglePaid={(shareKey, paid) =>
                                onToggleProfitSharePaid?.(
                                  booking.id,
                                  shareKey,
                                  paid
                                )
                              }
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
