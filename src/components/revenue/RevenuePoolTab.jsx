import { Fragment, useMemo, useState } from 'react';
import { formatCurrency } from '../../utils/helpers';
import BookingStatusChip from '../common/BookingStatusChip';
import {
  getRecipientConfigsForPool,
  getPoolSplitLabel,
  PROFIT_POOLS,
} from '../../data/profitPools';
import { formatMonthLabel } from '../../utils/datePeriods';
import {
  getLastMonthsBreakdown,
  getRevenueTableRow,
} from '../../utils/revenueMetrics';
import {
  getRecipientTotalsForPool,
  filterDistributionByPool,
} from '../../utils/partnerProfit';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { getBookingProfit } from '../../utils/bookingFinancials';
import ProfitShareBreakdown from '../profit/ProfitShareBreakdown';
import { formatPercent } from './revenueConstants';

function RevenuePoolTab({
  poolId,
  metrics,
  tableBookings,
  bookings,
  range,
  onViewBooking,
  canEdit,
  onToggleProfitSharePaid,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const pool = PROFIT_POOLS[poolId];
  const poolConfigs = useMemo(
    () => getRecipientConfigsForPool(poolId),
    [poolId]
  );

  const recipientList = useMemo(() => {
    const poolTotals = getRecipientTotalsForPool(metrics.recipientTotals, poolId);
    return poolConfigs.map((config) => ({
      ...config,
      ...(poolTotals[config.shareKey] || {
        total: 0,
        paidTotal: 0,
        unpaidTotal: 0,
        paidCount: 0,
        unpaidCount: 0,
      }),
    }));
  }, [metrics.recipientTotals, poolId, poolConfigs]);

  const monthlyBreakdown = useMemo(
    () => getLastMonthsBreakdown(bookings, 6),
    [bookings]
  );

  function toggleExpanded(bookingId, event) {
    event.stopPropagation();
    setExpandedId((prev) => (prev === bookingId ? null : bookingId));
  }

  if (!pool) return null;

  return (
    <div className="revenue-tab-content">
      <div className="revenue-pool-header">
        <div>
          <h2 className="revenue-pool-header-title">{pool.label}</h2>
          <p className="revenue-pool-header-subtitle">
            50% of booking profit · {getPoolSplitLabel(poolId)}
          </p>
        </div>
        <div className="revenue-pool-header-total">
          <span className="revenue-pool-header-total-label">Pool total (period)</span>
          <strong>{formatCurrency(metrics.poolTotals?.[poolId] ?? 0)}</strong>
        </div>
      </div>

      <div className="revenue-recipient-kpi-grid revenue-pool-recipient-grid">
        {recipientList.map((recipient) => (
          <div key={recipient.shareKey} className="revenue-recipient-kpi">
            <div className="revenue-recipient-kpi-label">{recipient.label}</div>
            <div className="revenue-recipient-kpi-value">
              {formatCurrency(recipient.total)}
            </div>
            <div className="table-subtext">
              {recipient.percent}% of pool · Paid{' '}
              {formatCurrency(recipient.paidTotal)}
            </div>
            <div className="table-subtext">
              Unpaid {formatCurrency(recipient.unpaidTotal)}
            </div>
          </div>
        ))}
      </div>

      <div className="revenue-breakdown-card">
        <h3 className="dashboard-table-title">Payouts (selected period)</h3>
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
                  <th>Pool total</th>
                  {poolConfigs.map((c) => (
                    <th key={c.shareKey}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((row) => {
                  const poolTotal = row.poolTotals?.[poolId] ?? 0;
                  return (
                    <tr key={row.monthKey}>
                      <td>{formatMonthLabel(row.monthKey)}</td>
                      <td>{row.bookingCount}</td>
                      <td>{formatCurrency(poolTotal)}</td>
                      {poolConfigs.map((c) => {
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
                  );
                })}
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
                  <th>Pool share</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tableBookings.map((booking) => {
                  const row = getRevenueTableRow(booking, range);
                  const profit = getBookingProfit(booking);
                  const poolDistribution = filterDistributionByPool(
                    row.distribution,
                    poolId
                  );
                  const isExpanded = expandedId === booking.id;
                  const paidCount = poolDistribution.filter((d) => d.paid).length;
                  const totalShares = poolDistribution.length;
                  const poolShareSum = poolDistribution.reduce(
                    (sum, d) => sum + d.amount,
                    0
                  );

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
                          <div className="table-subtext">
                            {formatPercent(row.profitPercentage)} margin
                          </div>
                        </td>
                        <td>
                          {totalShares > 0 ? (
                            <>
                              {formatCurrency(poolShareSum)}
                              <div className="table-subtext">
                                {paidCount}/{totalShares} paid
                              </div>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <BookingStatusChip
                            status={resolveBookingStatus(booking)}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="revenue-detail-row">
                          <td colSpan={8}>
                            <ProfitShareBreakdown
                              booking={booking}
                              poolId={poolId}
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

export default RevenuePoolTab;
