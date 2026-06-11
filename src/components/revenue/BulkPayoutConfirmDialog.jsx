import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import { OutlineButton, SecondaryButton } from '../common/BrandButton';
import { formatCurrency } from '../../utils/helpers';

export default function BulkPayoutConfirmDialog({
  open,
  paid,
  selectedCount,
  payoutLabels,
  preview,
  loading,
  onClose,
  onConfirm,
}) {
  const actionLabel = paid ? 'Mark as paid' : 'Mark as unpaid';

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{actionLabel} for selected bookings</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {selectedCount} booking{selectedCount === 1 ? '' : 's'} selected. This will update{' '}
            {preview?.affectedCount ?? 0} booking
            {(preview?.affectedCount ?? 0) === 1 ? '' : 's'}
            {(preview?.skippedCount ?? 0) > 0
              ? ` (${preview.skippedCount} already in target state or without profit)`
              : ''}
            .
          </Typography>

          {payoutLabels?.length > 0 && (
            <List dense disablePadding>
              {payoutLabels.map((label) => (
                <ListItem key={label} disableGutters>
                  <ListItemText primary={label} />
                </ListItem>
              ))}
            </List>
          )}

          {(preview?.totalAmount ?? 0) > 0 && (
            <Typography variant="body2">
              Total payout amount affected:{' '}
              <strong>{formatCurrency(preview.totalAmount)}</strong>
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <OutlineButton type="button" onClick={onClose} disabled={loading}>
          Cancel
        </OutlineButton>
        <SecondaryButton
          type="button"
          onClick={onConfirm}
          disabled={loading || (preview?.affectedCount ?? 0) === 0}
        >
          {loading ? 'Updating...' : actionLabel}
        </SecondaryButton>
      </DialogActions>
    </Dialog>
  );
}
