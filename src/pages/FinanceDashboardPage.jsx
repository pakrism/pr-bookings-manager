import { useState } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { useFinanceContext } from '../context/FinanceDataContext';
import RevenueOverviewTab from '../components/revenue/RevenueOverviewTab';
import FinancePayoutsTab from '../components/revenue/FinancePayoutsTab';
import FinanceBookingsTab from '../components/revenue/FinanceBookingsTab';

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview', icon: 'ri-bar-chart-box-line' },
  { id: 'payouts', label: 'Payouts', icon: 'ri-hand-coin-line' },
  { id: 'bookings', label: 'Bookings', icon: 'ri-list-check-2' },
];

export default function FinanceDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { metrics, tableBookings, range, onViewBooking } = useFinanceContext();

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => setActiveTab(value)}
          aria-label="Finance dashboard sections"
        >
          {DASHBOARD_TABS.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  <i className={tab.icon} />
                  {tab.label}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {activeTab === 'overview' && (
        <RevenueOverviewTab metrics={metrics} bookings={tableBookings} />
      )}

      {activeTab === 'payouts' && <FinancePayoutsTab metrics={metrics} />}

      {activeTab === 'bookings' && (
        <FinanceBookingsTab
          tableBookings={tableBookings}
          range={range}
          onViewBooking={onViewBooking}
        />
      )}
    </Box>
  );
}
