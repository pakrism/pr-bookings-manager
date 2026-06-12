import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

export default function FinanceKpiCard({
  title,
  total,
  percent = 0,
  color = 'primary',
  icon,
  subtitle,
}) {
  const theme = useTheme();
  const paletteColor = theme.palette[color]?.main || theme.palette.primary.main;

  return (
    <Card
      sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
        height: '100%',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {title}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          {total}
        </Typography>
        {subtitle != null && (
          <Typography variant="caption" color="text.secondary" display="block">
            Margin {subtitle}
          </Typography>
        )}
        {percent !== 0 && (
          <Typography
            variant="caption"
            sx={{ color: percent < 0 ? 'error.main' : 'success.main', fontWeight: 600 }}
          >
            {percent > 0 ? '+' : ''}
            {percent}%
          </Typography>
        )}
      </Box>
      {icon && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(paletteColor, 0.12),
            color: paletteColor,
            fontSize: 18,
            flexShrink: 0,
            ml: 1,
          }}
        >
          <i className={icon} />
        </Box>
      )}
    </Card>
  );
}
