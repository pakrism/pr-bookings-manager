import { useMemo, useState } from 'react';
import { getWhatsappLink } from '../../utils/helpers';
import BookingStatusChip from '../common/BookingStatusChip';
import { OutlineButton } from '../common/BrandButton';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { normalizeBookingTourType } from '../../utils/tourType';
import { getBookingBalance } from '../../utils/bookingBalance';
import { getTotalPaid } from '../../utils/payments';
import {
  formatScheduleMoney,
  getScheduleBatchStatus,
  getScheduleKpis,
  groupBookingsIntoSchedules,
} from '../../utils/scheduleHelpers';
import { toMonthKey, formatMonthLabel } from '../../utils/datePeriods';
import {
  BATCH_SORT_OPTIONS,
  sortScheduleBatches,
} from '../../utils/bookingSort';
import { getTravelMonthOptions } from '../../utils/bookingFilters';
import {
  downloadAllScheduleBatchesPdf,
  downloadScheduleBatchPdf,
} from '../../utils/schedulePdf';
import { downloadScheduleIcal } from '../../utils/scheduleIcal';

function ScheduleBatchCard({ batch, onOpenBooking }) {
  const [expanded, setExpanded] = useState(true);
  const batchStatus = getScheduleBatchStatus(batch);

  return (
    <div className="schedule-batch-card">
      <div className="schedule-batch-header">
        <div>
          <div className="schedule-batch-title-row">
            <h3 className="schedule-batch-title">{batch.tripBatch}</h3>
            <span className="schedule-batch-count">
              {batch.totalBookings} booking
              {batch.totalBookings !== 1 ? 's' : ''}
            </span>
            <BookingStatusChip status={batchStatus} />
          </div>

          <p className="schedule-batch-subtitle">
            {batch.destination} • {batch.duration}
          </p>
        </div>

        <div className="schedule-header-actions">
          <OutlineButton
            type="button"
            size="small"
            onClick={() => downloadScheduleBatchPdf(batch)}
          >
            Download PDF
          </OutlineButton>

          <OutlineButton
            type="button"
            size="small"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Hide' : 'Show'}
          </OutlineButton>
        </div>
      </div>

      <div className="schedule-summary-grid">
        <div className="schedule-summary-box">
          <span className="schedule-summary-label">Pax</span>
          <strong>{batch.totalPax}</strong>
        </div>

        <div className="schedule-summary-box">
          <span className="schedule-summary-label">Advance</span>
          <strong>{formatScheduleMoney(batch.totalAdvance)}</strong>
        </div>

        <div className="schedule-summary-box">
          <span className="schedule-summary-label">Package</span>
          <strong>{formatScheduleMoney(batch.totalPackageAmount)}</strong>
        </div>

        <div className="schedule-summary-box warning">
          <span className="schedule-summary-label">Balance</span>
          <strong>{formatScheduleMoney(batch.totalBalance)}</strong>
        </div>
      </div>

      {expanded && (
        <div className="schedule-bookings-table-wrap">
          <table className="schedule-bookings-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Guest / Group</th>
                <th>Booked By</th>
                <th>Type</th>
                <th>Pax</th>
                <th>Transport</th>
                <th>Paid</th>
                <th>Package</th>
                <th>Balance</th>
                <th>Status</th>
                <th>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {batch.bookings.map((booking) => {
                const pax =
                  Number(booking.adults || 0) +
                  Number(booking.children || 0) +
                  Number(booking.infants || 0);

                const whatsappLink = getWhatsappLink(booking.whatsappNumber);
                const resolvedStatus = resolveBookingStatus(booking);

                return (
                  <tr
                    key={booking.id}
                    className="schedule-row-clickable"
                    onClick={() => onOpenBooking?.(booking)}
                  >
                    <td>{booking.bookingRef || '-'}</td>
                    <td>
                      <div className="guest-name">
                        {booking.guestName || '-'}
                      </div>
                      <div className="table-subtext">
                        {booking.groupType === 'Other'
                          ? booking.groupTypeNote || 'Other'
                          : booking.groupType || '-'}
                      </div>
                    </td>
                    <td>{booking.bookedBy || '-'}</td>
                    <td>{normalizeBookingTourType(booking.type)}</td>
                    <td>{pax}</td>
                    <td>{booking.transport || '-'}</td>
                    <td>{formatScheduleMoney(getTotalPaid(booking))}</td>
                    <td>{formatScheduleMoney(booking.packagePrice)}</td>
                    <td>
                      <span className="balance-text">
                        {formatScheduleMoney(getBookingBalance(booking))}
                      </span>
                    </td>
                    <td>
                      <BookingStatusChip status={resolvedStatus} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {whatsappLink ? (
                        <a
                          className="whatsapp-link"
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="table-subtext">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SchedulePage({ bookings, onOpenBooking }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState('upcoming');
  const [monthFilter, setMonthFilter] = useState('All months');
  const [batchSort, setBatchSort] = useState('departure_asc');

  const monthOptions = useMemo(
    () => getTravelMonthOptions(bookings),
    [bookings]
  );

  const groupedSchedules = useMemo(() => {
    let batches = groupBookingsIntoSchedules(bookings, {
      search: searchTerm,
      view: viewFilter,
    });

    if (monthFilter && monthFilter !== 'All months') {
      batches = batches.filter(
        (batch) => toMonthKey(batch.travelStartDate) === monthFilter
      );
    }

    return sortScheduleBatches(batches, batchSort);
  }, [bookings, searchTerm, viewFilter, monthFilter, batchSort]);

  const upcomingBatchesForExport = useMemo(() => {
    return groupBookingsIntoSchedules(bookings, {
      search: searchTerm,
      view: 'upcoming',
    }).filter((batch) => getScheduleBatchStatus(batch) !== 'Completed');
  }, [bookings, searchTerm]);

  const kpis = useMemo(
    () => getScheduleKpis(groupedSchedules),
    [groupedSchedules]
  );

  return (
    <div className="schedule-page">
      <div className="schedule-kpi-grid">
        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Trip Batches</div>
            <div className="dashboard-card-value">{kpis.totalBatches}</div>
          </div>
          <div className="dashboard-card-icon teal">🗂</div>
        </div>

        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Total Pax</div>
            <div className="dashboard-card-value">{kpis.totalPax}</div>
          </div>
          <div className="dashboard-card-icon blue">👥</div>
        </div>

        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Total Advance</div>
            <div className="dashboard-card-value">
              {formatScheduleMoney(kpis.totalAdvance)}
            </div>
          </div>
          <div className="dashboard-card-icon orange">💰</div>
        </div>

        <div className="dashboard-card">
          <div>
            <div className="dashboard-card-label">Outstanding Balance</div>
            <div className="dashboard-card-value">
              {formatScheduleMoney(kpis.totalBalance)}
            </div>
          </div>
          <div className="dashboard-card-icon green">📈</div>
        </div>
      </div>

      <div className="schedule-toolbar">
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="Search guest, destination, package, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="toolbar-select"
          value={viewFilter}
          onChange={(e) => setViewFilter(e.target.value)}
        >
          <option value="ongoing">On-Going Trips</option>
          <option value="upcoming">Upcoming Trips</option>
          <option value="past">Past Trips</option>
          <option value="all">All Trips</option>
        </select>

        <select
          className="toolbar-select"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="All months">All months</option>
          {monthOptions.map((key) => (
            <option key={key} value={key}>
              {formatMonthLabel(key)}
            </option>
          ))}
        </select>

        <select
          className="toolbar-select"
          value={batchSort}
          onChange={(e) => setBatchSort(e.target.value)}
        >
          {BATCH_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <OutlineButton
          type="button"
          size="small"
          disabled={!upcomingBatchesForExport.length}
          onClick={() =>
            downloadAllScheduleBatchesPdf(
              upcomingBatchesForExport,
              'Upcoming Schedules'
            )
          }
        >
          Download all upcoming PDF
        </OutlineButton>

        <OutlineButton
          type="button"
          size="small"
          disabled={!upcomingBatchesForExport.length}
          onClick={() => downloadScheduleIcal(upcomingBatchesForExport)}
        >
          Export iCal
        </OutlineButton>
      </div>

      {!groupedSchedules.length ? (
        <div className="empty-state">
          <p>No schedule batches found.</p>
          <span>
            Add bookings with travel dates and they will automatically appear
            here.
          </span>
        </div>
      ) : (
        <div className="schedule-list">
          {groupedSchedules.map((batch) => (
            <ScheduleBatchCard
              key={batch.batchKey}
              batch={batch}
              onOpenBooking={onOpenBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SchedulePage;
