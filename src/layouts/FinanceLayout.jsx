import { useMemo } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import PageHeader from '../components/ui/PageHeader';
import FinanceFilterPanel from '../components/revenue/FinanceFilterPanel';
import FinanceKpiRow from '../components/revenue/FinanceKpiRow';
import FinanceBookedBySummary from '../components/revenue/FinanceBookedBySummary';
import FinancePoolCards from '../components/revenue/FinancePoolCards';
import { FinanceDataContext } from '../context/FinanceDataContext';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAppData } from '../context/AppDataContext';
import { getManagerPoolId, canManageZohaibPoolExpenses } from '../utils/accessControl';
import { downloadRevenueCsv } from '../utils/exportRevenueCsv';

const POOL_LABELS = {
  zohaib: 'Zohaib pool',
  pervaiz: 'Pervaiz pool',
};

export default function FinanceLayout() {
  const location = useLocation();
  const {
    bookings,
    userProfile,
    capabilities,
    poolExpenses,
    navigateToBooking,
    handleToggleProfitSharePaid,
    handleTogglePartnerPoolPaid,
    handleBulkUpdatePayouts,
    handleCreatePoolExpense,
    handleUpdatePoolExpense,
    handleDeletePoolExpense,
    showToast,
  } = useAppData();

  const financeData = useFinanceData(bookings, poolExpenses);
  const managerPoolId = getManagerPoolId(userProfile);
  const canManagePoolExpenses = canManageZohaibPoolExpenses(userProfile);
  const isDashboard = location.pathname === '/finance' || location.pathname === '/finance/';
  const poolMatch = location.pathname.match(/^\/finance\/(zohaib|pervaiz)$/);
  const activePoolId = poolMatch?.[1] || null;

  const contextValue = useMemo(
    () => ({
      ...financeData,
      bookings,
      userProfile,
      capabilities,
      canEdit: capabilities.canTogglePayouts,
      onViewBooking: navigateToBooking,
      onToggleProfitSharePaid: handleToggleProfitSharePaid,
      onTogglePartnerPoolPaid: handleTogglePartnerPoolPaid,
      onBulkUpdatePayouts: handleBulkUpdatePayouts,
      onExportToast: () => showToast('Revenue CSV downloaded.'),
      canManagePoolExpenses,
      onCreatePoolExpense: handleCreatePoolExpense,
      onUpdatePoolExpense: handleUpdatePoolExpense,
      onDeletePoolExpense: handleDeletePoolExpense,
    }),
    [
      financeData,
      bookings,
      userProfile,
      capabilities,
      canManagePoolExpenses,
      navigateToBooking,
      handleToggleProfitSharePaid,
      handleTogglePartnerPoolPaid,
      handleBulkUpdatePayouts,
      handleCreatePoolExpense,
      handleUpdatePoolExpense,
      handleDeletePoolExpense,
      showToast,
    ]
  );

  if (capabilities.isBookingManager && managerPoolId && isDashboard) {
    return <Navigate to={`/finance/${managerPoolId}`} replace />;
  }

  function handleExportCsv() {
    downloadRevenueCsv(financeData.tableBookings, financeData.range);
    showToast('Revenue CSV downloaded.');
  }

  const breadcrumbs = [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Finance', href: '/finance' }];
  if (activePoolId) {
    breadcrumbs.push({ name: POOL_LABELS[activePoolId] });
  }

  const subtitle = isDashboard
    ? 'Departure-month attribution and partner shares'
    : `${POOL_LABELS[activePoolId]} · 50% of booking profit`;

  return (
    <FinanceDataContext.Provider value={contextValue}>
      <Box>
        <CustomBreadcrumbs links={breadcrumbs} />

        <PageHeader
          title={isDashboard ? 'Finance' : POOL_LABELS[activePoolId]}
          subtitle={subtitle}
          sx={{ mb: 2 }}
          titleVariant={isDashboard ? 'h5' : 'h4'}
        />

        <FinanceFilterPanel
          preset={financeData.preset}
          onPresetChange={financeData.setPreset}
          customStart={financeData.customStart}
          customEnd={financeData.customEnd}
          onCustomStartChange={financeData.setCustomStart}
          onCustomEndChange={financeData.setCustomEnd}
          statusFilter={financeData.statusFilter}
          onStatusFilterChange={financeData.setStatusFilter}
          bookedByFilter={financeData.bookedByFilter}
          onBookedByFilterChange={financeData.setBookedByFilter}
          payoutFilter={financeData.payoutFilter}
          onPayoutFilterChange={financeData.setPayoutFilter}
          onExport={handleExportCsv}
          compact={isDashboard}
        />

        {isDashboard && capabilities.isAdmin && (
          <>
            <FinanceKpiRow kpiWidgets={financeData.kpiWidgets} />
            <FinanceBookedBySummary
              rows={financeData.bookedByTotals}
              activeBookedBy={financeData.bookedByFilter === 'all' ? null : financeData.bookedByFilter}
              onSelectBookedBy={(bookedBy) => {
                if (financeData.bookedByFilter === bookedBy) {
                  financeData.setBookedByFilter('all');
                  return;
                }
                financeData.setBookedByFilter(bookedBy);
              }}
            />
            <FinancePoolCards
              metrics={financeData.metrics}
              visiblePoolIds={null}
              linkMode
            />
          </>
        )}

        {financeData.preset === 'all_time' && bookings.length > 50 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Showing all time across {bookings.length} bookings — filters may feel slow on large
            datasets.
          </Alert>
        )}

        <Outlet />
      </Box>
    </FinanceDataContext.Provider>
  );
}
