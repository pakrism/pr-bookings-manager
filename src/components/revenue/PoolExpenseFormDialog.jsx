import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import { DarkButton, OutlineButton } from '../common/BrandButton';

const emptyForm = {
  description: '',
  expenseDate: '',
  amount: '',
};

export default function PoolExpenseFormDialog({ open, expense, onClose, onSave }) {
  const isEdit = Boolean(expense?.id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        description: expense.description || '',
        expenseDate: expense.expenseDate || '',
        amount: String(expense.amount ?? ''),
      });
      return;
    }
    setForm(emptyForm);
  }, [open, expense]);

  function handleChange(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const success = await onSave?.({
      description: form.description,
      expenseDate: form.expenseDate,
      amount: form.amount,
    });
    setLoading(false);
    if (success) onClose?.();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit pool expense' : 'Add pool expense'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={form.expenseDate}
              onChange={handleChange('expenseDate')}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={handleChange('description')}
              required
              fullWidth
            />
            <TextField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={handleChange('amount')}
              inputProps={{ min: 0, step: '0.01' }}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <OutlineButton type="button" onClick={onClose} disabled={loading}>
            Cancel
          </OutlineButton>
          <DarkButton type="submit" disabled={loading}>
            {isEdit ? 'Save changes' : 'Add expense'}
          </DarkButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
