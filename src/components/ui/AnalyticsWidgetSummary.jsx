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
        background: `linear-gradient(135deg, ${alpha(paletteColor, 0.16)} 0%, ${alpha(paletteColor, 0.04)} 100%)`,
        ...sx,
      }}
      {...other}
    >
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4">{total}</Typography>
        {percent !== 0 && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: percent < 0 ? 'error.main' : 'success.main',
              fontWeight: 600,
            }}
          >
            {percent > 0 ? '+' : ''}
            {percent}%
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
              bgcolor: alpha(paletteColor, 0.16),
              color: paletteColor,
              fontSize: 24,
            }}
          >
            <i className={icon} />
          </Box>
        )}
        {chart && (
          <Chart
            type="area"
            series={[{ data: chart.series }]}
            options={chartOptions}
            width={84}
            height={56}
          />
        )}
      </Box>
    </Card>
  );
}
