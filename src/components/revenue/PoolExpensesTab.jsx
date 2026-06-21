import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { DarkButton } from '../common/BrandButton';
import PoolExpenseFormDialog from './PoolExpenseFormDialog';
import { formatCurrency, formatDateForDisplay } from '../../utils/helpers';

export default function PoolExpensesTab({
  expenses,
  totalExpenses,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  function openCreate() {
    setEditingExpense(null);
    setDialogOpen(true);
  }

  function openEdit(expense) {
    setEditingExpense(expense);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingExpense(null);
  }

  async function handleSave(data) {
    if (editingExpense?.id) {
      return onUpdate?.(editingExpense.id, data);
    }
    return onCreate?.(data);
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Delete expense "${expense.description}"?`)) return;
    await onDelete?.(expense.id);
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Pool expenses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deducted from Zohaib and Fawad only. Sohaib&apos;s share is unchanged.
          </Typography>
        </Box>
        {canManage && (
          <DarkButton type="button" onClick={openCreate}>
            <i className="ri-add-line" style={{ marginRight: 6 }} />
            Add expense
          </DarkButton>
        )}
      </Box>

      <Card sx={{ overflow: 'hidden' }}>
        {!expenses.length ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No pool expenses in this period.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  {canManage && <TableCell align="right" width={96} />}
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{formatDateForDisplay(expense.expenseDate)}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(expense)} aria-label="Edit expense">
                          <i className="ri-pencil-line" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(expense)}
                          aria-label="Delete expense"
                        >
                          <i className="ri-delete-bin-line" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={canManage ? 2 : 2}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Period total
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight={700}>
                      {formatCurrency(totalExpenses)}
                    </Typography>
                  </TableCell>
                  {canManage && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <PoolExpenseFormDialog
        open={dialogOpen}
        expense={editingExpense}
        onClose={closeDialog}
        onSave={handleSave}
      />
    </Box>
  );
}
