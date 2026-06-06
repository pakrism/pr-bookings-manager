import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { formatCurrency } from '../../utils/helpers';
import { formatPercent } from './revenueConstants';

const METRICS = [
  { key: 'grossRevenue', label: 'Revenue' },
  { key: 'collected', label: 'Collected' },
  { key: 'netProfit', label: 'Net profit', subtitleKey: 'profitPercentage' },
  { key: 'outstanding', label: 'Outstanding' },
];

export default function FinanceSummaryStrip({ metrics }) {
  return (
    <Card sx={{ mb: 3, p: 2 }}>
      <Grid container spacing={2}>
        {METRICS.map((item) => (
          <Grid key={item.key} size={{ xs: 6, md: 3 }}>
            <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {item.label}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatCurrency(metrics[item.key])}
              </Typography>
              {item.subtitleKey && (
                <Typography variant="caption" color="text.secondary">
                  Margin {formatPercent(metrics[item.subtitleKey])}
                </Typography>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
}
