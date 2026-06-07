import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';

import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import PageHeader from '../components/ui/PageHeader';
import RevenueOverviewTab from '../components/revenue/RevenueOverviewTab';
import RevenuePoolTab from '../components/revenue/RevenuePoolTab';
import FinanceSummaryStrip from '../components/revenue/FinanceSummaryStrip';
import FinanceFilterPanel from '../components/revenue/FinanceFilterPanel';
import FinancePoolCards from '../components/revenue/FinancePoolCards';
import { REVENUE_TABS } from '../components/revenue/revenueConstants';
import { getPeriodRange } from '../utils/datePeriods';
import {
  computeRevenueMetrics,
  filterBookingsByRevenuePeriod,
  filterBookingsForFinance,
} from '../utils/revenueMetrics';
import { downloadRevenueCsv } from '../utils/exportRevenueCsv';
import { getDefaultFinanceTab, getManagerPoolId, getRoleCapabilities } from '../utils/accessControl';

export default function FinancePage({
  bookings,
  userProfile,
  onViewBooking,
  onExportToast,
  canEdit = false,
  onToggleProfitSharePaid,
  onTogglePartnerPoolPaid,
}) {
  const capabilities = useMemo(() => getRoleCapabilities(userProfile), [userProfile]);
  const managerPoolId = getManagerPoolId(userProfile);
  const [activeTab, setActiveTab] = useState(() => getDefaultFinanceTab(userProfile));
  const [preset, setPreset] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookedByFilter, setBookedByFilter] = useState('all');
  const [payoutFilter, setPayoutFilter] = useState('all');

  const visibleTabs = useMemo(() => {
    if (capabilities.isBookingManager && managerPoolId) {
      return REVENUE_TABS.filter((tab) => tab.id === managerPoolId);
    }
    return REVENUE_TABS;
  }, [capabilities.isBookingManager, managerPoolId]);

  const financeFilters = useMemo(
    () => ({
      status: statusFilter,
      bookedBy: bookedByFilter,
      payoutFilter,
    }),
    [statusFilter, bookedByFilter, payoutFilter]
  );

  const range = useMemo(
    () => (preset === 'all_time' ? null : getPeriodRange(preset, customStart, customEnd)),
    [preset, customStart, customEnd]
  );

  const metrics = useMemo(
    () => computeRevenueMetrics(bookings, preset, customStart, customEnd, financeFilters),
    [bookings, preset, customStart, customEnd, financeFilters]
  );

  const tableBookings = useMemo(() => {
    const periodBookings = filterBookingsByRevenuePeriod(
      bookings,
      preset,
      customStart,
      customEnd
    );
    return filterBookingsForFinance(periodBookings, financeFilters);
  }, [bookings, preset, customStart, customEnd, financeFilters]);

  function handleExportCsv() {
    downloadRevenueCsv(tableBookings, range);
    onExportToast?.();
  }

  function handleOpenPoolTab(poolId) {
    if (capabilities.isBookingManager && managerPoolId && poolId !== managerPoolId) {
      return;
    }
    setActiveTab(poolId);
  }

  const poolTabProps = {
    metrics,
    tableBookings,
    bookings,
    range,
    onViewBooking,
    canEdit,
    onToggleProfitSharePaid,
    onTogglePartnerPoolPaid,
    onExportToast,
  };

  return (
    <Box>
      <CustomBreadcrumbs
        links={[
          { name: 'Dashboard', href: '/' },
          { name: 'Finance' },
        ]}
      />

      <PageHeader title="Finance" subtitle="Departure-month attribution and partner shares" />

      <FinanceFilterPanel
        preset={preset}
        onPresetChange={setPreset}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        bookedByFilter={bookedByFilter}
        onBookedByFilterChange={setBookedByFilter}
        payoutFilter={payoutFilter}
        onPayoutFilterChange={setPayoutFilter}
        onExport={handleExportCsv}
      />

      <FinanceSummaryStrip metrics={metrics} />

      <FinancePoolCards
        metrics={metrics}
        onOpenPoolTab={handleOpenPoolTab}
        visiblePoolIds={capabilities.isBookingManager && managerPoolId ? [managerPoolId] : null}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => setActiveTab(value)}
          aria-label="Finance sections"
        >
          {visibleTabs.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {preset === 'all_time' && bookings.length > 50 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Showing all time across {bookings.length} bookings — filters may feel slow on large
          datasets.
        </Alert>
      )}

      {activeTab === 'overview' && capabilities.isAdmin && (
        <RevenueOverviewTab metrics={metrics} bookings={tableBookings} />
      )}

      {activeTab === 'zohaib' && (!capabilities.isBookingManager || managerPoolId === 'zohaib') && (
        <RevenuePoolTab poolId="zohaib" {...poolTabProps} />
      )}

      {activeTab === 'pervaiz' && (!capabilities.isBookingManager || managerPoolId === 'pervaiz') && (
        <RevenuePoolTab poolId="pervaiz" {...poolTabProps} />
      )}

      {visibleTabs.length === 0 && (
        <Typography color="text.secondary">No finance view configured for this account.</Typography>
      )}
    </Box>
  );
}
