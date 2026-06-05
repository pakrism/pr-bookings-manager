import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { DarkButton, OutlineButton } from '../common/BrandButton';
import { MANUAL_BOOKING_STATUSES } from '../../data/constants';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { appendAuditLog, buildAuditEntry } from '../../utils/auditLog';
import { updateBooking } from '../../lib/firestore';
import { useAppData } from '../../context/AppDataContext';

export default function BookingQuickUpdateDialog({ booking, open, onClose }) {
  const { authUser, userProfile, showToast } = useAppData();
  const [statusOverride, setStatusOverride] = useState(
    MANUAL_BOOKING_STATUSES.includes(booking.bookingStatus) ? booking.bookingStatus : ''
  );
  const [notes, setNotes] = useState(booking.specialNotes || '');
  const [loading, setLoading] = useState(false);

  const resolved = resolveBookingStatus(booking);

  async function handleUpdate() {
    setLoading(true);
    try {
      const bookingStatus = statusOverride || resolved;
      await updateBooking(booking.id, {
        specialNotes: notes.trim(),
        bookingStatus,
        updatedByUid: authUser.uid,
        updatedByName: userProfile.fullName,
        auditLog: appendAuditLog(
          booking.auditLog,
          buildAuditEntry({
            action: 'updated',
            byUid: authUser.uid,
            byName: userProfile.fullName,
            summary: 'Quick update applied',
          })
        ),
      });
      showToast('Booking updated.');
      onClose();
    } catch (error) {
      showToast('Failed to update booking.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Quick update</DialogTitle>
      <DialogContent>
        {resolved === 'Upcoming' && !statusOverride && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Booking is upcoming — confirm status if needed.
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Status override"
              value={statusOverride}
              onChange={(e) => setStatusOverride(e.target.value)}
            >
              <MenuItem value="">Use automatic status ({resolved})</MenuItem>
              {MANUAL_BOOKING_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <OutlineButton onClick={onClose} disabled={loading}>Cancel</OutlineButton>
        <DarkButton onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </DarkButton>
      </DialogActions>
    </Dialog>
  );
}
