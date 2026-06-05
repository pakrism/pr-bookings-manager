import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import Chart from './Chart';
import { useChart, sparklineOptions } from './useChart';

export default function AnalyticsWidgetSummary({
  title,
  total,
  percent = 0,
  color = 'primary',
  icon,
  chart,
  sx,
  ...other
}) {
  const theme = useTheme();
  const paletteColor = theme.palette[color]?.main || theme.palette.primary.main;

  const chartOptions = useChart({
    ...sparklineOptions(paletteColor),
    colors: [paletteColor],
  });

  return (
    <Card
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
        ...sx,
      }}
      {...other}
    >
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={700}>{total}</Typography>
        {percent !== 0 && (
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: percent < 0 ? 'error.main' : 'success.main', fontWeight: 600 }}
          >
            {percent > 0 ? '+' : ''}{percent}%
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(paletteColor, 0.12),
              color: paletteColor,
              fontSize: 22,
            }}
          >
            <i className={icon} />
          </Box>
        )}
        {chart && (
          <Chart type="area" series={[{ data: chart.series }]} options={chartOptions} width={84} height={56} />
        )}
      </Box>
    </Card>
  );
}

export function DarkIncomeCard({ title, total, percent, chartSeries }) {
  const chartOptions = useChart({
    ...sparklineOptions('#fff'),
    colors: ['#fff'],
    chart: { sparkline: { enabled: true }, background: 'transparent' },
  });

  return (
    <Card
      sx={{
        p: 3,
        bgcolor: '#004B50',
        color: '#fff',
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 160,
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ opacity: 0.72 }}>{title}</Typography>
        <Typography variant="h3" fontWeight={700}>{total}</Typography>
        {percent != null && (
          <Typography variant="body2" sx={{ mt: 0.5, color: '#77ED8B' }}>
            {percent > 0 ? '+' : ''}{percent}%
          </Typography>
        )}
      </Box>
      {chartSeries && (
        <Chart type="area" series={[{ data: chartSeries }]} options={chartOptions} width={120} height={64} />
      )}
    </Card>
  );
}
