import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';

import BookingStatusChip from '../common/BookingStatusChip';
import { formatCurrency } from '../../utils/helpers';
import { formatMonthLabel } from '../../utils/datePeriods';
import { getRevenueTableRow } from '../../utils/revenueMetrics';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { getBookingProfit } from '../../utils/bookingFinancials';
import { formatPercent } from './revenueConstants';

export default function FinanceBookingsTab({ tableBookings, range, onViewBooking }) {
  const [orderBy, setOrderBy] = useState('travelStartDate');
  const [order, setOrder] = useState('desc');

  const sortedBookings = useMemo(() => {
    const list = [...tableBookings];
    const dir = order === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (orderBy === 'profit') {
        const av = getBookingProfit(a) ?? 0;
        const bv = getBookingProfit(b) ?? 0;
        return (av - bv) * dir;
      }
      const av = a[orderBy] || '';
      const bv = b[orderBy] || '';
      return String(av).localeCompare(String(bv)) * dir;
    });
    return list;
  }, [tableBookings, order, orderBy]);

  function handleSort(id) {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  }

  if (!sortedBookings.length) {
    return (
      <Card sx={{ py: 6, textAlign: 'center' }}>
        <i className="ri-calendar-line" style={{ fontSize: 40, color: '#919EAB' }} />
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          No bookings in this period — adjust the date filter above.
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700}>
          <i className="ri-list-check-2" style={{ marginRight: 8 }} />
          Bookings in period ({sortedBookings.length})
        </Typography>
      </Box>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'bookingRef'}
                  direction={orderBy === 'bookingRef' ? order : 'asc'}
                  onClick={() => handleSort('bookingRef')}
                >
                  Ref
                </TableSortLabel>
              </TableCell>
              <TableCell>Guest</TableCell>
              <TableCell>Package</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'travelStartDate'}
                  direction={orderBy === 'travelStartDate' ? order : 'asc'}
                  onClick={() => handleSort('travelStartDate')}
                >
                  Departure
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'profit'}
                  direction={orderBy === 'profit' ? order : 'asc'}
                  onClick={() => handleSort('profit')}
                >
                  Profit
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedBookings.map((booking) => {
              const row = getRevenueTableRow(booking, range);
              const profit = getBookingProfit(booking);
              return (
                <TableRow
                  key={booking.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onViewBooking?.(booking)}
                >
                  <TableCell sx={{ fontWeight: 700 }}>{booking.bookingRef || '-'}</TableCell>
                  <TableCell>{booking.guestName || '-'}</TableCell>
                  <TableCell>{booking.packageName || '-'}</TableCell>
                  <TableCell>{formatMonthLabel(row.attributionMonth)}</TableCell>
                  <TableCell align="right">
                    {profit != null ? (
                      <>
                        {formatCurrency(profit)}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {formatPercent(row.profitPercentage)} margin
                        </Typography>
                      </>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <BookingStatusChip status={resolveBookingStatus(booking)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
