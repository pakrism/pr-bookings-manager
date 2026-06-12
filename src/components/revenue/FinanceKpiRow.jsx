import Grid from '@mui/material/Grid';

import FinanceKpiCard from './FinanceKpiCard';
import { formatCurrency } from '../../utils/helpers';
import { formatPercent } from './revenueConstants';

export default function FinanceKpiRow({ kpiWidgets }) {
  return (
    <Grid container spacing={1.5} sx={{ mb: 2 }}>
      {kpiWidgets.map((widget) => (
        <Grid key={widget.id} size={{ xs: 6, md: 3 }}>
          <FinanceKpiCard
            title={widget.title}
            total={formatCurrency(widget.total)}
            percent={widget.percent}
            color={widget.color}
            icon={widget.icon}
            subtitle={widget.subtitle != null ? formatPercent(widget.subtitle) : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
}
