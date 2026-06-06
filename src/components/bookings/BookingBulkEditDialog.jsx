import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { DarkButton, OutlineButton } from '../common/BrandButton';
import { BOOKED_BY_OPTIONS, MANUAL_BOOKING_STATUSES } from '../../data/constants';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { appendAuditLog, buildAuditEntry } from '../../utils/auditLog';
import { updateBooking } from '../../lib/firestore';
import { useAppData } from '../../context/AppDataContext';

const UNCHANGED = '__unchanged__';

export default function BookingBulkEditDialog({ bookings, open, onClose, onComplete }) {
  const { authUser, userProfile, showToast } = useAppData();
  const [bookedBy, setBookedBy] = useState(UNCHANGED);
  const [statusOverride, setStatusOverride] = useState(UNCHANGED);
  const [loading, setLoading] = useState(false);

  const hasChanges = bookedBy !== UNCHANGED || statusOverride !== UNCHANGED;

  async function handleApply() {
    if (!hasChanges) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      for (const booking of bookings) {
        const patch = {
          updatedByUid: authUser.uid,
          updatedByName: userProfile.fullName,
          auditLog: appendAuditLog(
            booking.auditLog,
            buildAuditEntry({
              action: 'updated',
              byUid: authUser.uid,
              byName: userProfile.fullName,
              summary: 'Bulk edit applied',
            })
          ),
        };

        if (bookedBy !== UNCHANGED) {
          patch.bookedBy = bookedBy;
        }

        if (statusOverride !== UNCHANGED) {
          patch.bookingStatus = statusOverride;
        } else if (bookedBy !== UNCHANGED) {
          patch.bookingStatus = resolveBookingStatus(booking);
        }

        await updateBooking(booking.id, patch);
      }

      showToast(`${bookings.length} booking${bookings.length === 1 ? '' : 's'} updated.`);
      onComplete?.();
      onClose();
    } catch (error) {
      showToast('Failed to update bookings.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk edit</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Update {bookings.length} selected booking{bookings.length === 1 ? '' : 's'}. Leave a field
          unchanged to keep existing values.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Booked by"
              value={bookedBy}
              onChange={(e) => setBookedBy(e.target.value)}
            >
              <MenuItem value={UNCHANGED}>Leave unchanged</MenuItem>
              {BOOKED_BY_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Status override"
              value={statusOverride}
              onChange={(e) => setStatusOverride(e.target.value)}
            >
              <MenuItem value={UNCHANGED}>Leave unchanged</MenuItem>
              {MANUAL_BOOKING_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <OutlineButton onClick={onClose} disabled={loading}>
          Cancel
        </OutlineButton>
        <DarkButton onClick={handleApply} disabled={loading || !hasChanges}>
          {loading ? 'Updating...' : 'Apply to selected'}
        </DarkButton>
      </DialogActions>
    </Dialog>
  );
}
