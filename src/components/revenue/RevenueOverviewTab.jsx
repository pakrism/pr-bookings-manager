import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';

import Chart from '../ui/Chart';
import { useChart } from '../ui/useChart';
import { PrimaryButton } from '../common/BrandButton';
import { formatCurrency } from '../../utils/helpers';
import { getPoolSplitLabel } from '../../data/profitPools';
import { getPoolPaidSummary } from '../../utils/partnerProfit';
import { getLastMonthsBreakdown } from '../../utils/revenueMetrics';
import { formatPercent } from './revenueConstants';

function ChartCard({ title, subheader, children }) {
  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {subheader && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subheader}
        </Typography>
      )}
      {children}
    </Card>
  );
}

function PoolEntryCard({
  title,
  poolTotal,
  partnerSummary,
  recipientSummary,
  splitLabel,
  onOpen,
}) {
  return (
    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Chip label="50% pool" size="small" variant="outlined" />
      </Stack>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        {formatCurrency(poolTotal)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Partner share — Paid {formatCurrency(partnerSummary.paidTotal)} · Unpaid{' '}
        {formatCurrency(partnerSummary.unpaidTotal)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        In-pool recipients — Paid {formatCurrency(recipientSummary.paidTotal)} · Unpaid{' '}
        {formatCurrency(recipientSummary.unpaidTotal)}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
        {splitLabel}
      </Typography>
      <PrimaryButton type="button" onClick={onOpen}>
        View {title} breakdown
      </PrimaryButton>
    </Card>
  );
}

function RevenueOverviewTab({ metrics, bookings, onOpenPoolTab }) {
  const zohaibRecipientSummary = getPoolPaidSummary(metrics.recipientTotals, 'zohaib');
  const pervaizRecipientSummary = getPoolPaidSummary(metrics.recipientTotals, 'pervaiz');
  const zohaibPartnerSummary = metrics.partnerPoolTotals?.zohaib || {
    paidTotal: 0,
    unpaidTotal: 0,
  };
  const pervaizPartnerSummary = metrics.partnerPoolTotals?.pervaiz || {
    paidTotal: 0,
    unpaidTotal: 0,
  };

  const monthlyBreakdown = getLastMonthsBreakdown(bookings, 8).reverse();

  const trendChartOptions = useChart({
    xaxis: {
      categories: monthlyBreakdown.map((row) => row.monthKey?.slice(5) || ''),
    },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    stroke: { width: [0, 3] },
  });

  const poolSplitOptions = useChart({
    labels: ['Zohaib pool', 'Pervaiz pool'],
    legend: { show: true, position: 'bottom' },
    plotOptions: { pie: { donut: { size: '72%' } } },
    stroke: { width: 0 },
  });

  const zohaibTotal = metrics.poolTotals?.zohaib ?? 0;
  const pervaizTotal = metrics.poolTotals?.pervaiz ?? 0;

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Gross revenue
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {formatCurrency(metrics.grossRevenue)}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Net profit
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {formatCurrency(metrics.netProfit)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Margin {formatPercent(metrics.profitPercentage)}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Bookings in period
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {metrics.bookingCount}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard title="Revenue & profit trend" subheader="Last 8 departure months">
            {monthlyBreakdown.length ? (
              <Chart
                type="line"
                height={300}
                series={[
                  {
                    name: 'Revenue',
                    type: 'column',
                    data: monthlyBreakdown.map((row) => row.grossRevenue),
                  },
                  {
                    name: 'Net profit',
                    type: 'line',
                    data: monthlyBreakdown.map((row) => row.netProfit),
                  },
                ]}
                options={trendChartOptions}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
                No departure data yet
              </Typography>
            )}
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard title="Pool split" subheader="50/50 partner allocation">
            {zohaibTotal + pervaizTotal > 0 ? (
              <Chart
                type="donut"
                height={300}
                series={[zohaibTotal, pervaizTotal]}
                options={poolSplitOptions}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
                No profit in period
              </Typography>
            )}
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PoolEntryCard
            title="Zohaib"
            poolTotal={zohaibTotal}
            partnerSummary={zohaibPartnerSummary}
            recipientSummary={zohaibRecipientSummary}
            splitLabel={getPoolSplitLabel('zohaib')}
            onOpen={() => onOpenPoolTab('zohaib')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PoolEntryCard
            title="Pervaiz"
            poolTotal={pervaizTotal}
            partnerSummary={pervaizPartnerSummary}
            recipientSummary={pervaizRecipientSummary}
            splitLabel={getPoolSplitLabel('pervaiz')}
            onOpen={() => onOpenPoolTab('pervaiz')}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default RevenueOverviewTab;
