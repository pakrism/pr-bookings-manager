import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getStatusBadgeClass, getWhatsappLink } from '../../utils/helpers';
import {
  formatScheduleMoney,
  getScheduleBatchStatus,
  getScheduleKpis,
  groupBookingsIntoSchedules,
} from '../../utils/scheduleHelpers';

function ScheduleBatchCard({ batch, onOpenBooking }) {
  const [expanded, setExpanded] = useState(true);

  const batchStatus = getScheduleBatchStatus(batch);

  function handleDownloadPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Pakrism Schedule Batch`, 14, 16);

    doc.setFontSize(11);
    doc.text(`Trip Batch: ${batch.tripBatch}`, 14, 26);
    doc.text(`Destination: ${batch.destination}`, 14, 32);
    doc.text(`Duration: ${batch.duration}`, 14, 38);
    doc.text(`Status: ${batchStatus}`, 14, 44);
    doc.text(`Bookings: ${batch.totalBookings}`, 120, 26);
    doc.text(`Pax: ${batch.totalPax}`, 120, 32);
    doc.text(`Advance: ${formatScheduleMoney(batch.totalAdvance)}`, 120, 38);
    doc.text(`Balance: ${formatScheduleMoney(batch.totalBalance)}`, 120, 44);

    autoTable(doc, {
      startY: 52,
      head: [
        [
          'Ref',
          'Guest / Group',
          'Booked By',
          'Type',
          'Pax',
          'Transport',
          'Advance',
          'Package',
          'Balance',
        ],
      ],
      body: batch.bookings.map((booking) => {
        const pax =
          Number(booking.adults || 0) +
          Number(booking.children || 0) +
          Number(booking.infants || 0);

        return [
          booking.bookingRef || '-',
          booking.guestName || '-',
          booking.bookedBy || '-',
          booking.type || '-',
          pax,
          booking.transport || '-',
          booking.advanceReceived || 0,
          booking.packagePrice || 0,
          booking.remainingAmount || 0,
        ];
      }),
    });

    doc.save(
      `pakrism-schedule-${batch.destination}-${
        batch.travelStartDate || 'batch'
      }.pdf`
    );
  }

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
            <span
              className={`batch-status ${batchStatus
                .toLowerCase()
                .replace('-', '')}`}
            >
              {batchStatus}
            </span>
          </div>

          <p className="schedule-batch-subtitle">
            {batch.destination} • {batch.duration}
          </p>
        </div>

        <div className="schedule-header-actions">
          <button
            type="button"
            className="schedule-pdf-btn"
            onClick={handleDownloadPDF}
          >
            Download PDF
          </button>

          <button
            type="button"
            className="schedule-toggle-btn"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
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
                <th>Advance</th>
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
                    <td>{booking.type || '-'}</td>
                    <td>{pax}</td>
                    <td>{booking.transport || '-'}</td>
                    <td>{formatScheduleMoney(booking.advanceReceived)}</td>
                    <td>{formatScheduleMoney(booking.packagePrice)}</td>
                    <td>
                      <span className="balance-text">
                        {formatScheduleMoney(
                          booking.remainingAmount ||
                            Number(booking.packagePrice || 0) -
                              Number(booking.advanceReceived || 0)
                        )}
                      </span>
                    </td>
                    <td>
                      <span
                        className={getStatusBadgeClass(booking.bookingStatus)}
                      >
                        {booking.bookingStatus || '-'}
                      </span>
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

  const groupedSchedules = useMemo(() => {
    return groupBookingsIntoSchedules(bookings, {
      search: searchTerm,
      view: viewFilter,
    });
  }, [bookings, searchTerm, viewFilter]);

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
