import { Fragment, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

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
  getProfitPoolAmount,
  computeBulkPayoutPreview,
} from '../../utils/partnerProfit';
import { getBookingsForAttributionMonth } from '../../utils/revenueMetrics';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { getBookingProfit } from '../../utils/bookingFinancials';
import ProfitShareBreakdown from '../profit/ProfitShareBreakdown';
import { formatPercent } from './revenueConstants';
import { downloadRevenueCsv } from '../../utils/exportRevenueCsv';
import PayoutSelectionBar from './PayoutSelectionBar';
import BulkPayoutConfirmDialog from './BulkPayoutConfirmDialog';

function PoolAccordion({ title, helper, defaultExpanded = false, children }) {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<i className="ri-arrow-down-s-line" />}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {helper && (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

function RevenuePoolTab({
  poolId,
  metrics,
  tableBookings,
  bookings,
  range,
  financeFilters,
  onViewBooking,
  canEdit,
  onToggleProfitSharePaid,
  onTogglePartnerPoolPaid,
  onBulkUpdatePayouts,
  onExportToast,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [orderBy, setOrderBy] = useState('travelStartDate');
  const [order, setOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [shareKeys, setShareKeys] = useState([]);
  const [includePartnerPool, setIncludePartnerPool] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, paid: true, loading: false });

  const pool = PROFIT_POOLS[poolId];
  const partnerLabel = poolId === 'zohaib' ? 'Zohaib' : 'Pervaiz';
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

  useEffect(() => {
    setSelectedIds([]);
    setShareKeys([]);
    setIncludePartnerPool(false);
  }, [poolId]);

  const selectedBookings = useMemo(
    () => sortedBookings.filter((booking) => selectedIds.includes(booking.id)),
    [sortedBookings, selectedIds]
  );

  const totalPoolShare = useMemo(
    () =>
      selectedBookings.reduce((sum, booking) => {
        const amount = getProfitPoolAmount(booking, poolId);
        return sum + (amount ?? 0);
      }, 0),
    [selectedBookings, poolId]
  );

  const payoutLabels = useMemo(() => {
    const labels = [];
    if (includePartnerPool) labels.push(`Partner share — ${partnerLabel}`);
    for (const key of shareKeys) {
      const config = poolConfigs.find((item) => item.shareKey === key);
      if (config) labels.push(config.label);
    }
    return labels;
  }, [includePartnerPool, shareKeys, poolConfigs, partnerLabel]);

  const bulkPreview = useMemo(() => {
    if (!confirmState.open) return null;
    return computeBulkPayoutPreview(selectedBookings, poolId, {
      shareKeys,
      includePartnerPool,
      paid: confirmState.paid,
    });
  }, [confirmState.open, confirmState.paid, selectedBookings, poolId, shareKeys, includePartnerPool]);

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

  function toggleBookingSelection(bookingId) {
    setSelectedIds((prev) =>
      prev.includes(bookingId) ? prev.filter((id) => id !== bookingId) : [...prev, bookingId]
    );
  }

  function selectAllBookings(checked) {
    setSelectedIds(checked ? sortedBookings.map((booking) => booking.id) : []);
  }

  function selectMonthBookings(monthKey, checked) {
    const monthBookings = getBookingsForAttributionMonth(bookings, monthKey, financeFilters);
    const monthIds = monthBookings.map((booking) => booking.id);
    if (checked) {
      setSelectedIds(monthIds);
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !monthIds.includes(id)));
  }

  function getMonthSelectionState(monthKey) {
    const monthBookings = getBookingsForAttributionMonth(bookings, monthKey, financeFilters);
    const monthIds = monthBookings.map((booking) => booking.id);
    if (!monthIds.length) return { checked: false, indeterminate: false };
    const selectedInMonth = monthIds.filter((id) => selectedIds.includes(id));
    return {
      checked: selectedInMonth.length === monthIds.length,
      indeterminate: selectedInMonth.length > 0 && selectedInMonth.length < monthIds.length,
    };
  }

  function handleShareKeyToggle(shareKey, checked) {
    setShareKeys((prev) =>
      checked ? [...prev, shareKey] : prev.filter((key) => key !== shareKey)
    );
  }

  function openBulkConfirm(paid) {
    setConfirmState({ open: true, paid, loading: false });
  }

  async function handleConfirmBulk() {
    if (!onBulkUpdatePayouts) return;
    setConfirmState((prev) => ({ ...prev, loading: true }));
    const result = await onBulkUpdatePayouts({
      bookingIds: selectedIds,
      shareKeys,
      includePartnerPool,
      poolId,
      paid: confirmState.paid,
    });
    setConfirmState({ open: false, paid: true, loading: false });
    if (result?.successCount > 0) {
      setSelectedIds([]);
      setShareKeys([]);
      setIncludePartnerPool(false);
    }
  }

  if (!pool) return null;

  return (
    <Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {pool.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              50% of booking profit · {getPoolSplitLabel(poolId)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              {formatCurrency(metrics.poolTotals?.[poolId] ?? 0)}
            </Typography>
            <OutlineButton type="button" onClick={handlePoolExport}>
              Export pool CSV
            </OutlineButton>
          </Stack>
        </Stack>
      </Card>

      <Card sx={{ overflow: 'hidden' }}>
        <PoolAccordion
          title="Summary"
          helper={`Partner share and in-pool recipients for ${partnerLabel}`}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip
              label={`Partner ${formatCurrency(partnerSummary.total)} · Paid ${formatCurrency(partnerSummary.paidTotal)}`}
              variant="outlined"
            />
            {recipientList.map((recipient) => (
              <Chip
                key={recipient.shareKey}
                label={`${recipient.label} ${formatCurrency(recipient.total)}`}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Paid {formatCurrency(partnerSummary.paidTotal)} · Unpaid{' '}
            {formatCurrency(partnerSummary.unpaidTotal)} ·{' '}
            {partnerSummary.paidCount}/{partnerSummary.paidCount + partnerSummary.unpaidCount}{' '}
            bookings settled
          </Typography>
        </PoolAccordion>

        <PoolAccordion title="Charts" helper="Recipient and monthly partner share">
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
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
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
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
            </Grid>
          </Grid>
        </PoolAccordion>

        <PoolAccordion title="Payouts" helper="Totals due and paid lines for the selected period">
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
        </PoolAccordion>

        {monthlyBreakdown.length > 0 && (
          <PoolAccordion title="Monthly breakdown" helper="Last 6 departure months">
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {canEdit && <TableCell padding="checkbox" />}
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
                    const monthSelection = getMonthSelectionState(row.monthKey);
                    return (
                      <TableRow key={row.monthKey} hover>
                        {canEdit && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={monthSelection.checked}
                              indeterminate={monthSelection.indeterminate}
                              onChange={(e) => selectMonthBookings(row.monthKey, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                        )}
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
          </PoolAccordion>
        )}

        <PoolAccordion
          title={`Bookings in period (${sortedBookings.length})`}
          helper="Tap a row to view; expand for profit share details"
          defaultExpanded
        >
          {canEdit && selectedIds.length > 0 && (
            <PayoutSelectionBar
              poolId={poolId}
              selectedCount={selectedIds.length}
              totalPoolShare={totalPoolShare}
              poolConfigs={poolConfigs}
              shareKeys={shareKeys}
              includePartnerPool={includePartnerPool}
              onShareKeyToggle={handleShareKeyToggle}
              onPartnerPoolToggle={setIncludePartnerPool}
              onClear={() => {
                setSelectedIds([]);
                setShareKeys([]);
                setIncludePartnerPool(false);
              }}
              onMarkPaid={() => openBulkConfirm(true)}
              onMarkUnpaid={() => openBulkConfirm(false)}
            />
          )}

          {!sortedBookings.length ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No bookings in this period.</Typography>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {canEdit && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          indeterminate={
                            selectedIds.length > 0 && selectedIds.length < sortedBookings.length
                          }
                          checked={
                            sortedBookings.length > 0 && selectedIds.length === sortedBookings.length
                          }
                          onChange={(e) => selectAllBookings(e.target.checked)}
                        />
                      </TableCell>
                    )}
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
                          selected={canEdit && selectedIds.includes(booking.id)}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => onViewBooking?.(booking)}
                        >
                          {canEdit && (
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                size="small"
                                checked={selectedIds.includes(booking.id)}
                                onChange={() => toggleBookingSelection(booking.id)}
                              />
                            </TableCell>
                          )}
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
                          <TableCell
                            colSpan={canEdit ? 10 : 9}
                            sx={{ py: 0, borderBottom: isExpanded ? undefined : 0 }}
                          >
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
        </PoolAccordion>
      </Card>

      <BulkPayoutConfirmDialog
        open={confirmState.open}
        paid={confirmState.paid}
        selectedCount={selectedIds.length}
        payoutLabels={payoutLabels}
        preview={bulkPreview}
        loading={confirmState.loading}
        onClose={() => setConfirmState({ open: false, paid: true, loading: false })}
        onConfirm={handleConfirmBulk}
      />
    </Box>
  );
}

export default RevenuePoolTab;
