import { useMemo, useState } from 'react';
import { getPeriodRange } from '../../utils/datePeriods';
import {
  computeRevenueMetrics,
  filterBookingsByRevenuePeriod,
} from '../../utils/revenueMetrics';
import { downloadRevenueCsv } from '../../utils/exportRevenueCsv';
import { PERIOD_PRESETS, REVENUE_TABS } from './revenueConstants';
import RevenueOverviewTab from './RevenueOverviewTab';
import RevenuePoolTab from './RevenuePoolTab';

function RevenuePage({
  bookings,
  onViewBooking,
  onExportToast,
  canEdit = false,
  onToggleProfitSharePaid,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [preset, setPreset] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const range = useMemo(
    () => (preset === 'all_time' ? null : getPeriodRange(preset, customStart, customEnd)),
    [preset, customStart, customEnd]
  );

  const metrics = useMemo(
    () => computeRevenueMetrics(bookings, preset, customStart, customEnd),
    [bookings, preset, customStart, customEnd]
  );

  const tableBookings = useMemo(
    () => filterBookingsByRevenuePeriod(bookings, preset, customStart, customEnd),
    [bookings, preset, customStart, customEnd]
  );

  function handleExportCsv() {
    downloadRevenueCsv(tableBookings, range);
    onExportToast?.();
  }

  function handleOpenPoolTab(poolId) {
    setActiveTab(poolId);
  }

  return (
    <div className="revenue-page">
      <div className="revenue-toolbar bookings-toolbar-wrap">
        <select
          className="toolbar-select"
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
        >
          {PERIOD_PRESETS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {preset === 'custom' && (
          <>
            <input
              className="form-input revenue-date-input"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              aria-label="Start date"
            />
            <input
              className="form-input revenue-date-input"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              aria-label="End date"
            />
          </>
        )}

        <button type="button" className="secondary-btn" onClick={handleExportCsv}>
          Export CSV
        </button>
      </div>

      <nav className="revenue-subnav" aria-label="Revenue sections">
        {REVENUE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? 'revenue-subnav-btn active'
                : 'revenue-subnav-btn'
            }
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {preset === 'all_time' && bookings.length > 50 && (
        <p className="revenue-warning">
          Showing all time across {bookings.length} bookings — filters may feel slow on
          large datasets.
        </p>
      )}

      {activeTab === 'overview' && (
        <RevenueOverviewTab
          metrics={metrics}
          onOpenPoolTab={handleOpenPoolTab}
        />
      )}

      {activeTab === 'zohaib' && (
        <RevenuePoolTab
          poolId="zohaib"
          metrics={metrics}
          tableBookings={tableBookings}
          bookings={bookings}
          range={range}
          onViewBooking={onViewBooking}
          canEdit={canEdit}
          onToggleProfitSharePaid={onToggleProfitSharePaid}
        />
      )}

      {activeTab === 'pervaiz' && (
        <RevenuePoolTab
          poolId="pervaiz"
          metrics={metrics}
          tableBookings={tableBookings}
          bookings={bookings}
          range={range}
          onViewBooking={onViewBooking}
          canEdit={canEdit}
          onToggleProfitSharePaid={onToggleProfitSharePaid}
        />
      )}
    </div>
  );
}

export default RevenuePage;
