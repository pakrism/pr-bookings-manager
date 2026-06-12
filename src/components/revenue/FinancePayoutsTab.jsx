import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { formatCurrency } from '../../utils/helpers';
import { getAllRecipientConfigs } from '../../data/profitPools';
import { PROFIT_POOLS } from '../../data/profitPools';

export default function FinancePayoutsTab({ metrics }) {
  const rows = getAllRecipientConfigs().map((config) => {
    const totals = metrics.recipientTotals?.[config.shareKey] || {
      total: 0,
      paidTotal: 0,
      unpaidTotal: 0,
      paidCount: 0,
      unpaidCount: 0,
    };
    return { ...config, ...totals };
  });

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700}>
          <i className="ri-hand-coin-line" style={{ marginRight: 8 }} />
          Company payout summary
        </Typography>
        <Typography variant="caption" color="text.secondary">
          All pools and recipients for the selected period
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Pool</TableCell>
              <TableCell>Recipient</TableCell>
              <TableCell align="right">Total due</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Unpaid</TableCell>
              <TableCell align="right">Paid lines</TableCell>
              <TableCell align="right">Unpaid lines</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.shareKey} hover>
                <TableCell>{PROFIT_POOLS[row.poolId]?.label || row.poolId}</TableCell>
                <TableCell>{row.label}</TableCell>
                <TableCell align="right">{formatCurrency(row.total)}</TableCell>
                <TableCell align="right">{formatCurrency(row.paidTotal)}</TableCell>
                <TableCell align="right">{formatCurrency(row.unpaidTotal)}</TableCell>
                <TableCell align="right">{row.paidCount}</TableCell>
                <TableCell align="right">{row.unpaidCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
