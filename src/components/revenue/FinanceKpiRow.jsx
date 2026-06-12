import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import AnalyticsWidgetSummary from '../ui/AnalyticsWidgetSummary';
import { formatCurrency } from '../../utils/helpers';
import { formatPercent } from './revenueConstants';

export default function FinanceKpiRow({ kpiWidgets }) {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {kpiWidgets.map((widget) => (
        <Grid key={widget.id} size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title={widget.title}
            total={formatCurrency(widget.total)}
            percent={widget.percent}
            color={widget.color}
            icon={widget.icon}
            chart={widget.chart}
          />
          {widget.subtitle != null && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', px: 0.5 }}>
              Margin {formatPercent(widget.subtitle)}
            </Typography>
          )}
        </Grid>
      ))}
    </Grid>
  );
}
