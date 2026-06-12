import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { formatCurrency } from '../../utils/helpers';
import { formatPercent } from './revenueConstants';

export default function FinanceBookedBySummary({
  rows,
  activeBookedBy,
  onSelectBookedBy,
}) {
  if (!rows?.length) {
    return (
      <Card sx={{ mb: 2, px: 2, py: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          No bookings in this period for booked-by breakdown.
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={700}>
          <i className="ri-user-shared-line" style={{ marginRight: 6 }} />
          By booked by
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Booked by</TableCell>
              <TableCell align="right">Bookings</TableCell>
              <TableCell align="right">Revenue</TableCell>
              <TableCell align="right">Profit</TableCell>
              <TableCell align="right">Margin</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isActive = activeBookedBy === row.bookedBy;
              return (
                <TableRow
                  key={row.bookedBy}
                  hover
                  selected={isActive}
                  onClick={() => onSelectBookedBy?.(row.bookedBy)}
                  sx={{ cursor: onSelectBookedBy ? 'pointer' : 'default' }}
                >
                  <TableCell sx={{ fontWeight: isActive ? 700 : 500 }}>{row.bookedBy}</TableCell>
                  <TableCell align="right">{row.bookingCount}</TableCell>
                  <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.profit)}</TableCell>
                  <TableCell align="right">{formatPercent(row.profitPercentage)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
