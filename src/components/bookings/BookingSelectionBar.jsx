import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { OutlineButton, SecondaryButton } from '../common/BrandButton';
import { formatCurrency } from '../../utils/helpers';

export default function BookingSelectionBar({
  metrics,
  canEdit,
  onClear,
  onBulkEdit,
  onExportSelected,
  onDeleteSelected,
}) {
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        px: 2,
        py: 1.5,
        bgcolor: 'action.selected',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700}>
        {metrics.count} selected
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ flex: 1 }}>
        <Typography variant="body2">
          Revenue <strong>{formatCurrency(metrics.revenue)}</strong>
        </Typography>
        <Typography variant="body2">
          Collected <strong>{formatCurrency(metrics.collected)}</strong>
        </Typography>
        <Typography variant="body2">
          Outstanding <strong>{formatCurrency(metrics.outstanding)}</strong>
        </Typography>
        <Typography variant="body2">
          Profit{' '}
          <strong>{metrics.profit != null ? formatCurrency(metrics.profit) : '-'}</strong>
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <OutlineButton type="button" onClick={onClear}>
          Clear
        </OutlineButton>
        {canEdit && (
          <SecondaryButton type="button" onClick={onBulkEdit}>
            Bulk edit
          </SecondaryButton>
        )}
        <OutlineButton type="button" onClick={onExportSelected}>
          Export selected
        </OutlineButton>
        {canEdit && (
          <OutlineButton type="button" onClick={onDeleteSelected} sx={{ color: 'error.main' }}>
            Delete selected
          </OutlineButton>
        )}
      </Stack>
    </Box>
  );
}
