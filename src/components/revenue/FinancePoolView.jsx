import { Fragment, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';

import { OutlineButton } from '../common/BrandButton';
import BookingStatusChip from '../common/BookingStatusChip';
import ProfitShareBreakdown from '../profit/ProfitShareBreakdown';
import PayoutSelectionBar from './PayoutSelectionBar';
import BulkPayoutConfirmDialog from './BulkPayoutConfirmDialog';
import PoolExpensesTab from './PoolExpensesTab';
import { formatCurrency } from '../../utils/helpers';
import { formatMonthLabel } from '../../utils/datePeriods';
import {
  getLastMonthsBreakdown,
  getRevenueTableRow,
  getBookingsForAttributionMonth,
} from '../../utils/revenueMetrics';
import {
  getRecipientConfigsForPool,
  getPoolSplitLabel,
  PROFIT_POOLS,
} from '../../data/profitPools';
import {
  getRecipientTotalsForPool,
  filterDistributionByPool,
  isPartnerPoolPaid,
  getProfitPoolAmount,
  computeBulkPayoutPreview,
} from '../../utils/partnerProfit';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { getBookingProfit } from '../../utils/bookingFinancials';
import { formatPercent } from './revenueConstants';
import { downloadRevenueCsv } from '../../utils/exportRevenueCsv';

export default function FinancePoolView({
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
  periodPoolExpenses = [],
  zohaibPoolExpenseSummary,
  canManagePoolExpenses = false,
  onCreatePoolExpense,
  onUpdatePoolExpense,
  onDeletePoolExpense,
}) {
  const [activeTab, setActiveTab] = useState('payouts');
  const [expandedId, setExpandedId] = useState(null);
  const [orderBy, setOrderBy] = useState('travelStartDate');
  const [order, setOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [shareKeys, setShareKeys] = useState([]);
  const [includePartnerPool, setIncludePartnerPool] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, paid: true, loading: false });

  const pool = PROFIT_POOLS[poolId];
  const partnerLabel = poolId === 'zohaib' ? 'Zohaib' : 'Pervaiz';
  const isZohaibPool = poolId === 'zohaib';
  const expenseSummary = isZohaibPool ? zohaibPoolExpenseSummary : null;
  const poolConfigs = useMemo(() => getRecipientConfigsForPool(poolId), [poolId]);

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

  const monthlyBreakdown = useMemo(() => getLastMonthsBreakdown(bookings, 6), [bookings]);

  const sortedBookings = useMemo(() => {
    const list = [...tableBookings];
    const dir = order === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (orderBy === 'profit') {
        return ((getBookingProfit(a) ?? 0) - (getBookingProfit(b) ?? 0)) * dir;
      }
      if (orderBy === 'partnerPaid') {
        const av = isPartnerPoolPaid(a, poolId) ? 1 : 0;
        const bv = isPartnerPoolPaid(b, poolId) ? 1 : 0;
        return (av - bv) * dir;
      }
      return String(a[orderBy] || '').localeCompare(String(b[orderBy] || '')) * dir;
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
      selectedBookings.reduce((sum, booking) => sum + (getProfitPoolAmount(booking, poolId) ?? 0), 0),
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

  const partnerPaidPercent =
    partnerSummary.total > 0 ? Math.round((partnerSummary.paidTotal / partnerSummary.total) * 100) : 0;

  if (!pool) return null;

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
    setSelectedIds(checked ? monthIds : (prev) => prev.filter((id) => !monthIds.includes(id)));
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

  return (
    <Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <i className="ri-user-star-line" style={{ fontSize: 22, color: '#58C71B' }} />
              <Typography variant="h6" fontWeight={700}>
                {formatCurrency(metrics.poolTotals?.[poolId] ?? 0)}
              </Typography>
              <Chip size="small" label="50% pool" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {getPoolSplitLabel(poolId)}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                icon={<i className="ri-checkbox-circle-line" />}
                label={`Partner paid ${formatCurrency(partnerSummary.paidTotal)}`}
                color="success"
                variant="outlined"
              />
              <Chip
                size="small"
                icon={<i className="ri-time-line" />}
                label={`Pending ${formatCurrency(partnerSummary.unpaidTotal)}`}
                color="warning"
                variant="outlined"
              />
              {recipientList.map((recipient) => (
                <Chip
                  key={recipient.shareKey}
                  size="small"
                  label={`${recipient.label} ${formatCurrency(recipient.total)}`}
                  variant="outlined"
                />
              ))}
            </Stack>
            {expenseSummary && expenseSummary.totalExpenses > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  color="error"
                  variant="outlined"
                  label={`Pool expenses −${formatCurrency(expenseSummary.totalExpenses)}`}
                />
                <Chip
                  size="small"
                  color="info"
                  variant="outlined"
                  label={`Net after expenses ${formatCurrency(expenseSummary.poolNet)}`}
                />
                {recipientList.map((recipient) => {
                  if (recipient.recipientKey === 'sohaib') {
                    return (
                      <Chip
                        key={`${recipient.shareKey}-net`}
                        size="small"
                        label={`${recipient.label} ${formatCurrency(recipient.total)}`}
                        variant="outlined"
                      />
                    );
                  }
                  const netEntry =
                    recipient.recipientKey === 'zohaib'
                      ? expenseSummary.zohaib
                      : recipient.recipientKey === 'fawad'
                        ? expenseSummary.fawad
                        : null;
                  if (!netEntry) return null;
                  return (
                    <Chip
                      key={`${recipient.shareKey}-net`}
                      size="small"
                      label={`${recipient.label} ${formatCurrency(netEntry.gross)} → ${formatCurrency(netEntry.net)}`}
                      variant="outlined"
                    />
                  );
                })}
              </Stack>
            )}
            <Box sx={{ mt: 1.5, maxWidth: 360 }}>
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
          <OutlineButton type="button" onClick={handlePoolExport}>
            <i className="ri-download-2-line" style={{ marginRight: 6 }} />
            Export pool CSV
          </OutlineButton>
        </Stack>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)}>
          <Tab
            value="payouts"
            label={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <i className="ri-hand-coin-line" />
                Payouts
              </Box>
            }
          />
          <Tab
            value="bookings"
            label={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <i className="ri-list-check-2" />
                Bookings ({sortedBookings.length})
              </Box>
            }
          />
          {isZohaibPool && (
            <Tab
              value="expenses"
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  <i className="ri-receipt-line" />
                  Expenses ({periodPoolExpenses.length})
                </Box>
              }
            />
          )}
        </Tabs>
      </Box>

      {activeTab === 'payouts' && (
        <Card sx={{ overflow: 'hidden' }}>
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
          {expenseSummary && expenseSummary.totalExpenses > 0 && (
            <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                After pool expenses (period)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sohaib {formatCurrency(expenseSummary.sohaib.net)} (unchanged) · Zohaib{' '}
                {formatCurrency(expenseSummary.zohaib.net)} · Fawad {formatCurrency(expenseSummary.fawad.net)}
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {activeTab === 'expenses' && isZohaibPool && (
        <PoolExpensesTab
          expenses={periodPoolExpenses}
          totalExpenses={expenseSummary?.totalExpenses ?? 0}
          canManage={canManagePoolExpenses}
          onCreate={onCreatePoolExpense}
          onUpdate={onUpdatePoolExpense}
          onDelete={onDeletePoolExpense}
        />
      )}

      {activeTab === 'bookings' && (
        <Box>
          {monthlyBreakdown.length > 0 && (
            <Card sx={{ overflow: 'hidden', mb: 2 }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  <i className="ri-calendar-line" style={{ marginRight: 8 }} />
                  Monthly breakdown
                </Typography>
              </Box>
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
                              />
                            </TableCell>
                          )}
                          <TableCell>{formatMonthLabel(row.monthKey)}</TableCell>
                          <TableCell align="right">{row.bookingCount}</TableCell>
                          <TableCell align="right">{formatCurrency(row.poolTotals?.[poolId] ?? 0)}</TableCell>
                          {poolConfigs.map((c) => {
                            const totals = row.recipientTotals?.[c.shareKey];
                            return (
                              <TableCell key={c.shareKey} align="right">
                                {totals ? formatCurrency(totals.total) : '-'}
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
            {canEdit && selectedIds.length > 0 && (
              <PayoutSelectionBar
                poolId={poolId}
                selectedCount={selectedIds.length}
                totalPoolShare={totalPoolShare}
                poolConfigs={poolConfigs}
                shareKeys={shareKeys}
                includePartnerPool={includePartnerPool}
                onShareKeyToggle={(shareKey, checked) =>
                  setShareKeys((prev) =>
                    checked ? [...prev, shareKey] : prev.filter((key) => key !== shareKey)
                  )
                }
                onPartnerPoolToggle={setIncludePartnerPool}
                onClear={() => {
                  setSelectedIds([]);
                  setShareKeys([]);
                  setIncludePartnerPool(false);
                }}
                onMarkPaid={() => setConfirmState({ open: true, paid: true, loading: false })}
                onMarkUnpaid={() => setConfirmState({ open: true, paid: false, loading: false })}
              />
            )}

            {!sortedBookings.length ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
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
                      <TableCell align="right">Profit</TableCell>
                      <TableCell align="right">Pool share</TableCell>
                      <TableCell>Partner paid</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedBookings.map((booking) => {
                      const row = getRevenueTableRow(booking, range);
                      const profit = getBookingProfit(booking);
                      const poolDistribution = filterDistributionByPool(row.distribution, poolId);
                      const isExpanded = expandedId === booking.id;
                      const poolShareSum = poolDistribution.reduce((sum, d) => sum + d.amount, 0);
                      const paidCount = poolDistribution.filter((d) => d.paid).length;

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
                              <IconButton size="small">
                                <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{booking.bookingRef || '-'}</TableCell>
                            <TableCell>{booking.guestName || '-'}</TableCell>
                            <TableCell>{booking.packageName || '-'}</TableCell>
                            <TableCell>{formatMonthLabel(row.attributionMonth)}</TableCell>
                            <TableCell align="right">
                              {profit != null ? formatCurrency(profit) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {poolDistribution.length ? (
                                <>
                                  {formatCurrency(poolShareSum)}
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {paidCount}/{poolDistribution.length} paid
                                  </Typography>
                                </>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={isPartnerPoolPaid(booking, poolId) ? 'Paid' : 'Pending'}
                                color={isPartnerPoolPaid(booking, poolId) ? 'success' : 'warning'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <BookingStatusChip status={resolveBookingStatus(booking)} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={canEdit ? 10 : 9} sx={{ py: 0 }}>
                              <Collapse in={isExpanded} unmountOnExit>
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
      )}

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
