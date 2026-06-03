import { formatCurrency } from '../../utils/helpers';
import { getBookingProfit } from '../../utils/bookingFinancials';
import { getProfitDistribution, getProfitPoolAmount } from '../../utils/partnerProfit';
import { PROFIT_POOLS } from '../../data/profitPools';

function PoolSection({
  poolId,
  booking,
  canEdit,
  onTogglePaid,
  compact,
}) {
  const pool = PROFIT_POOLS[poolId];
  const poolAmount = getProfitPoolAmount(booking, poolId);
  const rows = getProfitDistribution(booking).filter((r) => r.poolId === poolId);

  if (!rows.length) return null;

  return (
    <div className="profit-share-section">
      <div className="profit-share-section-header">
        <span className="profit-share-pool-title">{pool.label} (50%)</span>
        {poolAmount != null && (
          <span className="profit-share-pool-total">
            {formatCurrency(poolAmount)}
          </span>
        )}
      </div>
      <ul className={`profit-share-list${compact ? ' profit-share-list-compact' : ''}`}>
        {rows.map((row) => (
          <li
            key={row.shareKey}
            className={`profit-share-row${row.paid ? ' profit-share-paid' : ''}`}
          >
            <label
              className="profit-share-row-label"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={row.paid}
                disabled={!canEdit || !onTogglePaid}
                onChange={(e) =>
                  onTogglePaid?.(row.shareKey, e.target.checked)
                }
              />
              <span className="profit-share-name">{row.label}</span>
              <span className="profit-share-percent">{row.percentOfPool}%</span>
            </label>
            <span className="profit-share-amount">
              {formatCurrency(row.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfitShareBreakdown({
  booking,
  canEdit = false,
  onTogglePaid,
  compact = false,
}) {
  const profit = getBookingProfit(booking);
  const distribution = getProfitDistribution(booking);

  if (profit == null || !distribution.length) {
    return (
      <p className="form-hint">Set profit to see distribution breakdown.</p>
    );
  }

  return (
    <div className={`profit-share-breakdown${compact ? ' profit-share-breakdown-compact' : ''}`}>
      <PoolSection
        poolId="zohaib"
        booking={booking}
        canEdit={canEdit}
        onTogglePaid={onTogglePaid}
        compact={compact}
      />
      <PoolSection
        poolId="pervaiz"
        booking={booking}
        canEdit={canEdit}
        onTogglePaid={onTogglePaid}
        compact={compact}
      />
    </div>
  );
}

export default ProfitShareBreakdown;
