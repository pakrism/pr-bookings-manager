import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { DarkButton, OutlineButton } from '../common/BrandButton';
import { formatCurrencyWhole, formatDateForDisplay } from '../../utils/helpers';

const PARTNER_ROWS = [
  { key: 'zohaib', label: 'Zohaib', percent: 55 },
  { key: 'fawad', label: 'Fawad', percent: 35 },
  { key: 'sohaib', label: 'Sohaib', percent: 10 },
];

function SummaryKpiCard({ title, value, icon, color = 'primary' }) {
  const theme = useTheme();
  const paletteColor = theme.palette[color]?.main || theme.palette.primary.main;

  return (
    <Card
      sx={{
        p: 2,
        height: '100%',
        border: 1,
        borderColor: 'divider',
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {value}
          </Typography>
        </Box>
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(paletteColor, 0.12),
              color: paletteColor,
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            <i className={icon} />
          </Box>
        )}
      </Stack>
    </Card>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        mb: 2,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

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
  const profitAfterExpenses = hasExpenses ? expenseSummary.poolNet : poolGross;

  return (
    <Card sx={{ p: { xs: 2, md: 2.5 }, mb: 2, boxShadow: 1 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2.5 }}
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
            Summary for the selected period · Zohaib 55% · Fawad 35% · Sohaib 10%
          </Typography>
        </Box>
        <OutlineButton type="button" onClick={onExport}>
          <i className="ri-download-2-line" style={{ marginRight: 6 }} />
          Export pool CSV
        </OutlineButton>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryKpiCard
            title="Pool profit from bookings"
            value={formatCurrencyWhole(poolGross)}
            icon="ri-line-chart-line"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryKpiCard
            title="Pool expenses"
            value={hasExpenses ? `− ${formatCurrencyWhole(expenseSummary.totalExpenses)}` : formatCurrencyWhole(0)}
            icon="ri-receipt-line"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryKpiCard
            title="Profit after expenses"
            value={formatCurrencyWhole(profitAfterExpenses)}
            icon="ri-wallet-3-line"
            color="primary"
          />
        </Grid>
      </Grid>

      <SectionCard title="Partner take-home">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Partner</TableCell>
                <TableCell align="right">Share</TableCell>
                <TableCell align="right">{hasExpenses ? 'Before expenses' : 'Amount'}</TableCell>
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
                  <TableRow key={partner.key} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{partner.label}</TableCell>
                    <TableCell align="right">{partner.percent}%</TableCell>
                    <TableCell align="right">{formatCurrencyWhole(gross)}</TableCell>
                    {hasExpenses && (
                      <TableCell align="right" sx={{ color: isSohaib ? 'text.secondary' : 'error.main' }}>
                        {isSohaib ? '—' : `− ${formatCurrencyWhole(expenseShare)}`}
                      </TableCell>
                    )}
                    {hasExpenses && (
                      <TableCell align="right">
                        <Typography fontWeight={700}>{formatCurrencyWhole(net)}</Typography>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {hasExpenses && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Pool expenses are split equally between Zohaib and Fawad. Sohaib&apos;s share stays the
            same.
          </Typography>
        )}
      </SectionCard>

      <SectionCard
        title="Pool expenses"
        action={
          canManagePoolExpenses ? (
            <DarkButton type="button" size="small" onClick={onAddExpense}>
              <i className="ri-add-line" style={{ marginRight: 6 }} />
              Add expense
            </DarkButton>
          ) : null
        }
      >
        {!periodPoolExpenses.length ? (
          <Box
            sx={{
              py: 3,
              textAlign: 'center',
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <i
              className="ri-file-list-3-line"
              style={{ fontSize: 28, color: '#9CA3AF', marginBottom: 8 }}
            />
            <Typography variant="body2" color="text.secondary">
              No pool expenses in this period.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
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
                      <TableCell align="right">{formatCurrencyWhole(expense.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell colSpan={2}>
                      <Typography fontWeight={700}>Total</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700}>
                        {formatCurrencyWhole(expenseSummary?.totalExpenses ?? 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            {canManagePoolExpenses && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Use the Expenses tab to edit or delete entries.
              </Typography>
            )}
          </>
        )}
      </SectionCard>

      <Box
        sx={{
          pt: 2,
          mt: 0.5,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          <Chip
            size="small"
            icon={<i className="ri-checkbox-circle-line" />}
            label={`Partner paid ${formatCurrencyWhole(partnerSummary?.paidTotal ?? 0)}`}
            color="success"
            variant="outlined"
          />
          <Chip
            size="small"
            icon={<i className="ri-time-line" />}
            label={`Pending ${formatCurrencyWhole(partnerSummary?.unpaidTotal ?? 0)}`}
            color="warning"
            variant="outlined"
          />
        </Stack>
        <Box sx={{ maxWidth: 400 }}>
          <Typography variant="caption" color="text.secondary">
            Partner settlement {partnerPaidPercent}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={partnerPaidPercent}
            sx={{ mt: 0.5, height: 6, borderRadius: 999 }}
          />
        </Box>
      </Box>
    </Card>
  );
}
