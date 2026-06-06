import { Fragment, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import Chart from '../ui/Chart';
import { useChart } from '../ui/useChart';
import { OutlineButton } from '../common/BrandButton';
import { formatCurrency } from '../../utils/helpers';
import BookingStatusChip from '../common/BookingStatusChip';
import {
  getRecipientConfigsForPool,
  getPoolSplitLabel,
  PROFIT_POOLS,
} from '../../data/profitPools';
import { formatMonthLabel } from '../../utils/datePeriods';
import {
  getLastMonthsBreakdown,
  getRevenueTableRow,
} from '../../utils/revenueMetrics';
import {
  getRecipientTotalsForPool,
  filterDistributionByPool,
  isPartnerPoolPaid,
} from '../../utils/partnerProfit';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { getBookingProfit } from '../../utils/bookingFinancials';
import ProfitShareBreakdown from '../profit/ProfitShareBreakdown';
import { formatPercent } from './revenueConstants';
import { downloadRevenueCsv } from '../../utils/exportRevenueCsv';

function RevenuePoolTab({
  poolId,
  metrics,
  tableBookings,
  bookings,
  range,
  onViewBooking,
  canEdit,
  onToggleProfitSharePaid,
  onTogglePartnerPoolPaid,
  onExportToast,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [orderBy, setOrderBy] = useState('travelStartDate');
  const [order, setOrder] = useState('desc');

  const pool = PROFIT_POOLS[poolId];
  const poolConfigs = useMemo(
    () => getRecipientConfigsForPool(poolId),
    [poolId]
  );

  const partnerSummary = metrics.partnerPoolTotals?.[poolId] || {
    total: 0,
    paidTotal: 0,
    unpaidTotal: 0,
    paidCount: 0,
    unpaidCount: 0,
  };

  const recipientList = useMemo(() => {
    const poolTotals = getRecipientTotalsForPool(metrics.recipientTotals, poolId);
    return poolConfigs.map((config) => ({
      ...config,
      ...(poolTotals[config.shareKey] || {
        total: 0,
        paidTotal: 0,
        unpaidTotal: 0,
        paidCount: 0,
        unpaidCount: 0,
      }),
    }));
  }, [metrics.recipientTotals, poolId, poolConfigs]);

  const monthlyBreakdown = useMemo(
    () => getLastMonthsBreakdown(bookings, 6),
    [bookings]
  );

  const sortedBookings = useMemo(() => {
    const list = [...tableBookings];
    const dir = order === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (orderBy === 'profit') {
        const av = getBookingProfit(a) ?? 0;
        const bv = getBookingProfit(b) ?? 0;
        return (av - bv) * dir;
      }
      if (orderBy === 'partnerPaid') {
        const av = isPartnerPoolPaid(a, poolId) ? 1 : 0;
        const bv = isPartnerPoolPaid(b, poolId) ? 1 : 0;
        return (av - bv) * dir;
      }
      const av = a[orderBy] || '';
      const bv = b[orderBy] || '';
      return String(av).localeCompare(String(bv)) * dir;
    });
    return list;
  }, [tableBookings, order, orderBy, poolId]);

  const recipientChartOptions = useChart({
    xaxis: { categories: recipientList.map((r) => r.label) },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    legend: { show: true, position: 'top' },
  });

  const monthlyPaidOptions = useChart({
    xaxis: {
      categories: monthlyBreakdown.map((row) => formatMonthLabel(row.monthKey).split(' ')[0]),
    },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    stroke: { width: 0 },
  });

  function handleSort(id) {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  }

  function toggleExpanded(bookingId, event) {
    event.stopPropagation();
    setExpandedId((prev) => (prev === bookingId ? null : bookingId));
  }

  function handlePoolExport() {
    downloadRevenueCsv(tableBookings, range, `pakrism-${poolId}-revenue.csv`);
    onExportToast?.();
  }

  if (!pool) return null;

  const partnerLabel = poolId === 'zohaib' ? 'Zohaib' : 'Pervaiz';

  return (
    <Box>
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {pool.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              50% of booking profit · {getPoolSplitLabel(poolId)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="caption" color="text.secondary">
                Pool total (period)
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {formatCurrency(metrics.poolTotals?.[poolId] ?? 0)}
              </Typography>
            </Box>
            <OutlineButton type="button" onClick={handlePoolExport}>
              Export pool CSV
            </OutlineButton>
          </Stack>
        </Stack>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Partner share ({partnerLabel})
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatCurrency(partnerSummary.total)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Paid {formatCurrency(partnerSummary.paidTotal)} · Unpaid{' '}
              {formatCurrency(partnerSummary.unpaidTotal)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {partnerSummary.paidCount}/{partnerSummary.paidCount + partnerSummary.unpaidCount} bookings settled
            </Typography>
          </Card>
        </Grid>
        {recipientList.map((recipient) => (
          <Grid key={recipient.shareKey} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" noWrap>
                {recipient.label}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatCurrency(recipient.total)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {recipient.percent}% of pool
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Paid {formatCurrency(recipient.paidTotal)} · Unpaid{' '}
                {formatCurrency(recipient.unpaidTotal)}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recipient breakdown
            </Typography>
            <Chart
              type="bar"
              height={280}
              series={[
                { name: 'Paid', data: recipientList.map((r) => r.paidTotal) },
                { name: 'Unpaid', data: recipientList.map((r) => r.unpaidTotal) },
              ]}
              options={recipientChartOptions}
            />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Partner share by month
            </Typography>
            {monthlyBreakdown.length ? (
              <Chart
                type="bar"
                height={280}
                series={[
                  {
                    name: 'Paid',
                    data: monthlyBreakdown.map((row) => {
                      const poolBookings = row.bookings || [];
                      return poolBookings.reduce((sum, booking) => {
                        if (!isPartnerPoolPaid(booking, poolId)) return sum;
                        const profit = getBookingProfit(booking);
                        return sum + (profit != null ? profit / 2 : 0);
                      }, 0);
                    }),
                  },
                  {
                    name: 'Unpaid',
                    data: monthlyBreakdown.map((row) => {
                      const poolBookings = row.bookings || [];
                      return poolBookings.reduce((sum, booking) => {
                        if (isPartnerPoolPaid(booking, poolId)) return sum;
                        const profit = getBookingProfit(booking);
                        return sum + (profit != null ? profit / 2 : 0);
                      }, 0);
                    }),
                  },
                ]}
                options={monthlyPaidOptions}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
                No monthly data
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="h6">Payouts (selected period)</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Recipient</TableCell>
                <TableCell align="right">Total due</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Unpaid</TableCell>
                <TableCell align="right">Paid lines</TableCell>
                <TableCell align="right">Unpaid lines</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recipientList.map((row) => (
                <TableRow key={row.shareKey} hover>
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

      {monthlyBreakdown.length > 0 && (
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2 }}>
            <Typography variant="h6">Last 6 months (by departure month)</Typography>
          </Box>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Bookings</TableCell>
                  <TableCell align="right">Pool total</TableCell>
                  {poolConfigs.map((c) => (
                    <TableCell key={c.shareKey} align="right">
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyBreakdown.map((row) => {
                  const poolTotal = row.poolTotals?.[poolId] ?? 0;
                  return (
                    <TableRow key={row.monthKey} hover>
                      <TableCell>{formatMonthLabel(row.monthKey)}</TableCell>
                      <TableCell align="right">{row.bookingCount}</TableCell>
                      <TableCell align="right">{formatCurrency(poolTotal)}</TableCell>
                      {poolConfigs.map((c) => {
                        const totals = row.recipientTotals?.[c.shareKey];
                        return (
                          <TableCell key={c.shareKey} align="right">
                            {totals ? (
                              <>
                                {formatCurrency(totals.total)}
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {totals.paidCount}/{row.bookingCount} paid
                                </Typography>
                              </>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="h6">
            Bookings in period ({sortedBookings.length})
          </Typography>
        </Box>

        {!sortedBookings.length ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No bookings in this period.</Typography>
            <Typography variant="body2" color="text.secondary">
              Try another preset or custom date range.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={48} />
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
                  <TableCell align="right">Pool share</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'partnerPaid'}
                      direction={orderBy === 'partnerPaid' ? order : 'asc'}
                      onClick={() => handleSort('partnerPaid')}
                    >
                      Partner paid
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedBookings.map((booking) => {
                  const row = getRevenueTableRow(booking, range);
                  const profit = getBookingProfit(booking);
                  const poolDistribution = filterDistributionByPool(row.distribution, poolId);
                  const isExpanded = expandedId === booking.id;
                  const paidCount = poolDistribution.filter((d) => d.paid).length;
                  const totalShares = poolDistribution.length;
                  const poolShareSum = poolDistribution.reduce((sum, d) => sum + d.amount, 0);
                  const partnerPaid = isPartnerPoolPaid(booking, poolId);

                  return (
                    <Fragment key={booking.id}>
                      <TableRow
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => onViewBooking?.(booking)}
                      >
                        <TableCell onClick={(e) => toggleExpanded(booking.id, e)}>
                          <IconButton size="small" aria-expanded={isExpanded}>
                            <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                          </IconButton>
                        </TableCell>
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
                        <TableCell align="right">
                          {totalShares > 0 ? (
                            <>
                              {formatCurrency(poolShareSum)}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {paidCount}/{totalShares} paid
                              </Typography>
                            </>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={partnerPaid ? 'Paid' : 'Pending'}
                            color={partnerPaid ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <BookingStatusChip status={resolveBookingStatus(booking)} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 0, borderBottom: isExpanded ? undefined : 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2 }}>
                              <ProfitShareBreakdown
                                booking={booking}
                                poolId={poolId}
                                canEdit={canEdit}
                                compact
                                onTogglePaid={(shareKey, paid) =>
                                  onToggleProfitSharePaid?.(booking.id, shareKey, paid)
                                }
                                onTogglePartnerPaid={(pid, paid) =>
                                  onTogglePartnerPoolPaid?.(booking.id, pid, paid)
                                }
                              />
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}

export default RevenuePoolTab;
