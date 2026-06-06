import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';

import Chart from '../ui/Chart';
import { useChart } from '../ui/useChart';
import { OutlineButton } from '../common/BrandButton';
import { getLastMonthsBreakdown } from '../../utils/revenueMetrics';

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
  const [chartsOpen, setChartsOpen] = useState(false);

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
        <Grid size={{ xs: 12 }}>
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
      </Grid>

      <Box sx={{ mb: 2 }}>
        <OutlineButton type="button" onClick={() => setChartsOpen((open) => !open)}>
          {chartsOpen ? 'Hide charts' : 'Show charts'}
          <IconButton size="small" component="span" sx={{ ml: 0.5 }}>
            <i className={chartsOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
          </IconButton>
        </OutlineButton>
      </Box>

      <Collapse in={chartsOpen}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard title="Pool split" subheader="50/50 partner allocation">
              {zohaibTotal + pervaizTotal > 0 ? (
                <Chart
                  type="donut"
                  height={280}
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
            <ChartCard title="Bookings in period" subheader="Count by departure month">
              <Typography variant="h3" fontWeight={700} sx={{ py: 6, textAlign: 'center' }}>
                {metrics.bookingCount}
              </Typography>
            </ChartCard>
          </Grid>
        </Grid>
      </Collapse>
    </Box>
  );
}

export default RevenueOverviewTab;
