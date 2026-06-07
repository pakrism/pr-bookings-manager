import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';

import { DarkButton, OutlineButton } from '../common/BrandButton';
import { createUser, updateUser, resetUserPassword } from '../../lib/userManagement';
import { MANAGER_BOOKED_BY_OPTIONS, MANAGER_POOL_IDS } from '../../utils/accessControl';
import { useAppData } from '../../context/AppDataContext';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'booking_manager', label: 'Booking Manager' },
  { value: 'viewer', label: 'View only' },
];

export default function UserFormDialog({ open, user, onClose, onSaved }) {
  const { showToast } = useAppData();
  const isEdit = Boolean(user?.uid);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [sendPasswordReset, setSendPasswordReset] = useState(true);
  const [role, setRole] = useState(user?.role || 'viewer');
  const [bookedBy, setBookedBy] = useState(user?.bookedBy || 'Zohaib');
  const [poolId, setPoolId] = useState(user?.poolId || 'zohaib');
  const [isActive, setIsActive] = useState(user?.isActive !== false);
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  async function handleSave() {
    setLoading(true);
    try {
      if (isEdit) {
        await updateUser({
          uid: user.uid,
          fullName: fullName.trim(),
          role,
          isActive,
          ...(role === 'booking_manager' ? { bookedBy, poolId } : {}),
        });
        showToast('User updated.');
      } else {
        const result = await createUser({
          email: email.trim(),
          fullName: fullName.trim(),
          password,
          sendPasswordReset,
          role,
          isActive,
          ...(role === 'booking_manager' ? { bookedBy, poolId } : {}),
        });
        if (result?.resetLink) {
          setResetLink(result.resetLink);
          showToast('User created. Copy the reset link if email is not configured.');
          return;
        }
        showToast('User created.');
      }
      onSaved?.();
    } catch (error) {
      showToast(error.message || 'Failed to save user.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReset() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const result = await resetUserPassword(email.trim());
      setResetLink(result.resetLink || '');
      showToast('Password reset link generated.');
    } catch (error) {
      showToast(error.message || 'Failed to generate reset link.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit user' : 'Add user'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isEdit}
            />
          </Grid>
          {!isEdit && (
            <>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sendPasswordReset}
                      onChange={(e) => setSendPasswordReset(e.target.checked)}
                    />
                  }
                  label="Generate password reset link instead of temp password"
                />
              </Grid>
              {!sendPasswordReset && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Temporary password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Grid>
              )}
            </>
          )}
          <Grid size={{ xs: 12 }}>
            <TextField select fullWidth label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {role === 'booking_manager' && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Booked by"
                  value={bookedBy}
                  onChange={(e) => setBookedBy(e.target.value)}
                >
                  {MANAGER_BOOKED_BY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Profit pool"
                  value={poolId}
                  onChange={(e) => setPoolId(e.target.value)}
                >
                  {MANAGER_POOL_IDS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
              label="Active"
            />
          </Grid>
          {resetLink && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                Password reset link generated. Share it securely with the user.
              </Alert>
              <TextField fullWidth multiline rows={2} value={resetLink} sx={{ mt: 1 }} />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {isEdit && (
          <OutlineButton onClick={handleSendReset} disabled={loading}>
            Send reset link
          </OutlineButton>
        )}
        <OutlineButton onClick={onClose} disabled={loading}>
          {resetLink ? 'Close' : 'Cancel'}
        </OutlineButton>
        {!resetLink && (
          <DarkButton onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}
          </DarkButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
