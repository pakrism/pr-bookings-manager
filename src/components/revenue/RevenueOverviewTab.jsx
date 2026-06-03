import { formatCurrency } from '../../utils/helpers';
import { getPoolPaidSummary } from '../../utils/partnerProfit';
import { formatPercent } from './revenueConstants';

function RevenueOverviewTab({ metrics, onOpenPoolTab }) {
  const zohaibSummary = getPoolPaidSummary(metrics.recipientTotals, 'zohaib');
  const pervaizSummary = getPoolPaidSummary(metrics.recipientTotals, 'pervaiz');

  return (
    <div className="revenue-tab-content">
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
      </div>

      <div className="revenue-pool-entry-grid">
        <div className="revenue-pool-entry-card">
          <div className="revenue-pool-entry-header">
            <h3 className="revenue-pool-entry-title">Zohaib</h3>
            <span className="revenue-pool-entry-badge">50% pool</span>
          </div>
          <div className="revenue-pool-entry-amount">
            {formatCurrency(metrics.poolTotals?.zohaib ?? 0)}
          </div>
          <p className="table-subtext">
            Paid {formatCurrency(zohaibSummary.paidTotal)} · Unpaid{' '}
            {formatCurrency(zohaibSummary.unpaidTotal)}
          </p>
          <p className="revenue-pool-entry-split">
            Zohaib 55% · Fawad 35% · Sohaib 10%
          </p>
          <button
            type="button"
            className="secondary-btn revenue-pool-entry-btn"
            onClick={() => onOpenPoolTab('zohaib')}
          >
            View Zohaib breakdown →
          </button>
        </div>

        <div className="revenue-pool-entry-card">
          <div className="revenue-pool-entry-header">
            <h3 className="revenue-pool-entry-title">Pervaiz</h3>
            <span className="revenue-pool-entry-badge">50% pool</span>
          </div>
          <div className="revenue-pool-entry-amount">
            {formatCurrency(metrics.poolTotals?.pervaiz ?? 0)}
          </div>
          <p className="table-subtext">
            Paid {formatCurrency(pervaizSummary.paidTotal)} · Unpaid{' '}
            {formatCurrency(pervaizSummary.unpaidTotal)}
          </p>
          <p className="revenue-pool-entry-split">
            Mrs Pervaiz 20% · Aahid 5% · Skardu 15% · Pervaiz 60%
          </p>
          <button
            type="button"
            className="secondary-btn revenue-pool-entry-btn"
            onClick={() => onOpenPoolTab('pervaiz')}
          >
            View Pervaiz breakdown →
          </button>
        </div>
      </div>
    </div>
  );
}

export default RevenueOverviewTab;
