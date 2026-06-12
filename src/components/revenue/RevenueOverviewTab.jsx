import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import Chart from '../ui/Chart';
import { useChart } from '../ui/useChart';
import { getLastMonthsBreakdown } from '../../utils/revenueMetrics';
import { POOL_IDS } from '../../data/profitPools';

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

function RevenueOverviewTab({ metrics, bookings }) {
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

  const paidUnpaidOptions = useChart({
    xaxis: { categories: POOL_IDS.map((id) => (id === 'zohaib' ? 'Zohaib' : 'Pervaiz')) },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
    legend: { show: true, position: 'top' },
  });

  return (
    <Box>
      <Grid container spacing={3}>
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

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Partner paid vs unpaid" subheader="Pool partner shares in period">
            <Chart
              type="bar"
              height={280}
              series={[
                {
                  name: 'Paid',
                  data: POOL_IDS.map((id) => metrics.partnerPoolTotals?.[id]?.paidTotal ?? 0),
                },
                {
                  name: 'Unpaid',
                  data: POOL_IDS.map((id) => metrics.partnerPoolTotals?.[id]?.unpaidTotal ?? 0),
                },
              ]}
              options={paidUnpaidOptions}
            />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Bookings in period" subheader="Departure-month attribution">
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700}>
                {metrics.bookingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                bookings in selected period
              </Typography>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}

export default RevenueOverviewTab;
