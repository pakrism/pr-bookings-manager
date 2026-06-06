import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { alpha, useTheme } from '@mui/material/styles';

import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import PageHeader from '../components/ui/PageHeader';
import { OutlineButton } from '../components/common/BrandButton';
import RevenueOverviewTab from '../components/revenue/RevenueOverviewTab';
import RevenuePoolTab from '../components/revenue/RevenuePoolTab';
import { PERIOD_PRESETS, REVENUE_TABS, formatPercent } from '../components/revenue/revenueConstants';
import { BOOKED_BY_OPTIONS } from '../data/constants';
import { getPeriodRange } from '../utils/datePeriods';
import {
  computeRevenueMetrics,
  filterBookingsByRevenuePeriod,
  filterBookingsForFinance,
} from '../utils/revenueMetrics';
import { downloadRevenueCsv } from '../utils/exportRevenueCsv';
import { formatCurrency } from '../utils/helpers';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'On-Going', label: 'On-Going' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Refunded', label: 'Refunded' },
];

const PAYOUT_FILTER_OPTIONS = [
  { value: 'all', label: 'All payouts' },
  { value: 'partner_unpaid', label: 'Partner unpaid' },
  { value: 'recipient_unpaid', label: 'Any recipient unpaid' },
];

function FinanceMetricCard({ title, value, subtitle, icon, colorKey = 'primary' }) {
  const theme = useTheme();
  const paletteColor = theme.palette[colorKey]?.main || theme.palette.primary.main;

  return (
    <Card
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
        boxShadow: theme.shadows[1],
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(paletteColor, 0.12),
          color: paletteColor,
          fontSize: 22,
          ml: 2,
        }}
      >
        <i className={icon} />
      </Box>
    </Card>
  );
}

export default function FinancePage({
  bookings,
  onViewBooking,
  onExportToast,
  canEdit = false,
  onToggleProfitSharePaid,
  onTogglePartnerPoolPaid,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [preset, setPreset] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookedByFilter, setBookedByFilter] = useState('all');
  const [payoutFilter, setPayoutFilter] = useState('all');

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

  const summaryCards = useMemo(
    () => [
      {
        id: 'gross',
        title: 'Total revenue',
        value: formatCurrency(metrics.grossRevenue),
        icon: 'ri-money-dollar-circle-line',
        colorKey: 'primary',
      },
      {
        id: 'collected',
        title: 'Collected',
        value: formatCurrency(metrics.collected),
        icon: 'ri-checkbox-circle-line',
        colorKey: 'success',
      },
      {
        id: 'outstanding',
        title: 'Outstanding',
        value: formatCurrency(metrics.outstanding),
        icon: 'ri-time-line',
        colorKey: 'warning',
      },
      {
        id: 'expenses',
        title: 'Expenses',
        value: formatCurrency(metrics.expenses),
        icon: 'ri-shopping-bag-3-line',
        colorKey: 'error',
      },
      {
        id: 'net-profit',
        title: 'Net profit',
        value: formatCurrency(metrics.netProfit),
        subtitle: `Margin ${formatPercent(metrics.profitPercentage)}`,
        icon: 'ri-line-chart-line',
        colorKey: 'info',
      },
    ],
    [metrics]
  );

  function handleExportCsv() {
    downloadRevenueCsv(tableBookings, range);
    onExportToast?.();
  }

  function handleOpenPoolTab(poolId) {
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

      <PageHeader
        title="Finance"
        subtitle="Departure-month attribution and partner shares"
        action={
          <OutlineButton type="button" onClick={handleExportCsv}>
            Export CSV
          </OutlineButton>
        }
      />

      <Grid container spacing={3} columns={{ xs: 4, sm: 8, md: 12, lg: 15 }} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.id} size={{ xs: 4, sm: 4, md: 4, lg: 3 }}>
            <FinanceMetricCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              displayEmpty
            >
              {PERIOD_PRESETS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {preset === 'custom' && (
            <>
              <TextField
                size="small"
                type="date"
                label="Start date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 160 }}
              />
              <TextField
                size="small"
                type="date"
                label="End date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 160 }}
              />
            </>
          )}

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={bookedByFilter}
              onChange={(e) => setBookedByFilter(e.target.value)}
            >
              <MenuItem value="all">All booked by</MenuItem>
              {BOOKED_BY_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={payoutFilter}
              onChange={(e) => setPayoutFilter(e.target.value)}
            >
              {PAYOUT_FILTER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => setActiveTab(value)}
          aria-label="Finance sections"
        >
          {REVENUE_TABS.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {preset === 'all_time' && bookings.length > 50 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Showing all time across {bookings.length} bookings — filters may feel slow on
          large datasets.
        </Alert>
      )}

      {activeTab === 'overview' && (
        <RevenueOverviewTab
          metrics={metrics}
          bookings={tableBookings}
          onOpenPoolTab={handleOpenPoolTab}
        />
      )}

      {activeTab === 'zohaib' && (
        <RevenuePoolTab poolId="zohaib" {...poolTabProps} />
      )}

      {activeTab === 'pervaiz' && (
        <RevenuePoolTab poolId="pervaiz" {...poolTabProps} />
      )}
    </Box>
  );
}
