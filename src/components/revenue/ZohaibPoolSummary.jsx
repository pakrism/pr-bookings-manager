import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { DarkButton, OutlineButton } from '../common/BrandButton';
import { formatCurrency, formatDateForDisplay } from '../../utils/helpers';

const PARTNER_ROWS = [
  { key: 'zohaib', label: 'Zohaib', percent: 55 },
  { key: 'fawad', label: 'Fawad', percent: 35 },
  { key: 'sohaib', label: 'Sohaib', percent: 10 },
];

export default function ZohaibPoolSummary({
  poolGross,
  expenseSummary,
  periodPoolExpenses = [],
  partnerSummary,
  partnerPaidPercent,
  canManagePoolExpenses,
  onAddExpense,
  onExport,
}) {
  const hasExpenses = (expenseSummary?.totalExpenses ?? 0) > 0;

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'flex-start' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <i className="ri-user-star-line" style={{ fontSize: 22, color: '#58C71B' }} />
            <Typography variant="h6" fontWeight={700}>
              Zohaib pool
            </Typography>
            <Chip size="small" label="50% of booking profit" variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Summary for the selected period. Split: Zohaib 55% · Fawad 35% · Sohaib 10%.
          </Typography>
        </Box>
        <OutlineButton type="button" onClick={onExport}>
          <i className="ri-download-2-line" style={{ marginRight: 6 }} />
          Export pool CSV
        </OutlineButton>
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Pool profit
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Pool profit from bookings</TableCell>
                  <TableCell align="right">{formatCurrency(poolGross)}</TableCell>
                </TableRow>
                {hasExpenses && (
                  <TableRow>
                    <TableCell>Pool expenses</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      − {formatCurrency(expenseSummary.totalExpenses)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>
                    <Typography fontWeight={700}>Profit after expenses</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>
                      {formatCurrency(hasExpenses ? expenseSummary.poolNet : poolGross)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ flex: 1.4 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Partner take-home
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Partner</TableCell>
                  <TableCell align="right">Share</TableCell>
                  <TableCell align="right">
                    {hasExpenses ? 'Before expenses' : 'Amount'}
                  </TableCell>
                  {hasExpenses && <TableCell align="right">Expenses</TableCell>}
                  {hasExpenses && (
                    <TableCell align="right">
                      <Typography component="span" fontWeight={700}>
                        Take-home
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {PARTNER_ROWS.map((partner) => {
                  const entry = expenseSummary?.[partner.key];
                  const gross = entry?.gross ?? 0;
                  const expenseShare = entry?.expenseShare ?? 0;
                  const net = entry?.net ?? gross;
                  const isSohaib = partner.key === 'sohaib';

                  return (
                    <TableRow key={partner.key}>
                      <TableCell>{partner.label}</TableCell>
                      <TableCell align="right">{partner.percent}%</TableCell>
                      <TableCell align="right">{formatCurrency(gross)}</TableCell>
                      {hasExpenses && (
                        <TableCell align="right" sx={{ color: isSohaib ? 'text.secondary' : 'error.main' }}>
                          {isSohaib ? '—' : `− ${formatCurrency(expenseShare)}`}
                        </TableCell>
                      )}
                      {hasExpenses && (
                        <TableCell align="right">
                          <Typography fontWeight={700}>{formatCurrency(net)}</Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {hasExpenses && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Pool expenses are deducted from Zohaib and Fawad only. Sohaib&apos;s share stays the same.
            </Typography>
          )}
        </Box>
      </Stack>

      <Box sx={{ mb: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Pool expenses
          </Typography>
          {canManagePoolExpenses && (
            <DarkButton type="button" size="small" onClick={onAddExpense}>
              <i className="ri-add-line" style={{ marginRight: 6 }} />
              Add expense
            </DarkButton>
          )}
        </Stack>

        {!periodPoolExpenses.length ? (
          <Box
            sx={{
              py: 2,
              px: 2,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No pool expenses in this period.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {periodPoolExpenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{formatDateForDisplay(expense.expenseDate)}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={2}>
                    <Typography fontWeight={700}>Total</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>
                      {formatCurrency(expenseSummary?.totalExpenses ?? 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {periodPoolExpenses.length > 0 && canManagePoolExpenses && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            Use the Expenses tab to edit or delete entries.
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        <Chip
          size="small"
          icon={<i className="ri-checkbox-circle-line" />}
          label={`Partner paid ${formatCurrency(partnerSummary?.paidTotal ?? 0)}`}
          color="success"
          variant="outlined"
        />
        <Chip
          size="small"
          icon={<i className="ri-time-line" />}
          label={`Pending ${formatCurrency(partnerSummary?.unpaidTotal ?? 0)}`}
          color="warning"
          variant="outlined"
        />
      </Stack>

      <Box sx={{ maxWidth: 360 }}>
        <Typography variant="caption" color="text.secondary">
          Partner settlement {partnerPaidPercent}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={partnerPaidPercent}
          sx={{ mt: 0.5, height: 6, borderRadius: 999 }}
        />
      </Box>
    </Card>
  );
}
