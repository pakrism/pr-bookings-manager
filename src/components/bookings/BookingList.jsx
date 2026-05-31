import { useState } from 'react';
import {
  formatCurrency,
  formatDateForDisplay,
  getStatusBadgeClass,
  totalPersons,
} from '../../utils/helpers';
import { getBookingBalance } from '../../utils/bookingBalance';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { normalizeBookingTourType } from '../../utils/tourType';
import { filterBookings } from '../../utils/bookingFilters';
import BookingRowMenu from './BookingRowMenu';

function BookingList({
  bookings,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  variant = 'full',
  showToolbar = true,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  const filteredBookings = filterBookings(bookings, searchTerm, statusFilter);

  function getGroupDisplay(booking) {
    if (booking.groupType === 'Other' && booking.groupTypeNote?.trim()) {
      return booking.groupTypeNote.trim();
    }
    return booking.groupType || '-';
  }

  if (!bookings.length) {
    return (
      <div className="empty-state">
        <p>No bookings added yet.</p>
        <span>Create your first booking to start tracking records.</span>
      </div>
    );
  }

  return (
    <div className="bookings-panel">
      {showToolbar && (
        <div className="bookings-toolbar">
          <div className="search-wrap">
            <input
              className="search-input"
              type="text"
              placeholder="Search by guest, package, destination, ref..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option>All Status</option>
            <option>Upcoming</option>
            <option>On-Going</option>
            <option>Completed</option>
            <option>Cancelled</option>
            <option>Refunded</option>
          </select>
        </div>
      )}

      <div className="bookings-table-wrap bookings-desktop-only">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Guest</th>
              <th>Package</th>
              {variant === 'full' && <th>Travel</th>}
              <th>Status</th>
              <th>Price</th>
              <th>Balance</th>
              <th aria-label="Actions" />
            </tr>
          </thead>

          <tbody>
            {filteredBookings.map((booking) => {
              const resolvedStatus = resolveBookingStatus(booking);
              const balance = getBookingBalance(booking);

              return (
                <tr
                  key={booking.id}
                  className="booking-row-clickable"
                  onClick={() => onView?.(booking)}
                >
                  <td className="ref-cell">{booking.bookingRef || '-'}</td>
                  <td>
                    <div className="guest-name">{booking.guestName}</div>
                    <div className="guest-subtext">
                      {booking.departureCity || '-'} •{' '}
                      {normalizeBookingTourType(booking.type)}
                    </div>
                  </td>
                  <td>
                    <div>{booking.packageName || '-'}</div>
                    <div className="table-subtext">
                      {booking.destination || '-'}
                    </div>
                  </td>
                  {variant === 'full' && (
                    <td>
                      <div>{`${formatDateForDisplay(
                        booking.travelStartDate
                      )} → ${formatDateForDisplay(booking.travelEndDate)}`}</div>
                      <div className="table-subtext">
                        {booking.transport || '-'}
                      </div>
                    </td>
                  )}
                  <td>
                    <span className={getStatusBadgeClass(resolvedStatus)}>
                      {resolvedStatus}
                    </span>
                  </td>
                  <td>{formatCurrency(booking.packagePrice)}</td>
                  <td>
                    <span className="balance-text">
                      {formatCurrency(balance)}
                    </span>
                  </td>
                  <td>
                    <BookingRowMenu
                      booking={booking}
                      isOpen={openMenuId === booking.id}
                      onToggle={() =>
                        setOpenMenuId((prev) =>
                          prev === booking.id ? null : booking.id
                        )
                      }
                      onClose={() => setOpenMenuId(null)}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      canEdit={canEdit}
                    />
                  </td>
                </tr>
              );
            })}

            {!filteredBookings.length && (
              <tr>
                <td colSpan={variant === 'full' ? 8 : 7}>
                  <div className="empty-state" style={{ margin: '16px' }}>
                    <p>No matching bookings.</p>
                    <span>Try a different search or status filter.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bookings-cards-wrap bookings-mobile-only">
        {filteredBookings.map((booking) => {
          const resolvedStatus = resolveBookingStatus(booking);
          const balance = getBookingBalance(booking);

          return (
            <article
              key={booking.id}
              className="booking-card"
              onClick={() => onView?.(booking)}
            >
              <div className="booking-card-header">
                <div>
                  <div className="guest-name">{booking.guestName}</div>
                  <div className="table-subtext">
                    {booking.bookingRef || '-'}
                  </div>
                </div>
                <span className={getStatusBadgeClass(resolvedStatus)}>
                  {resolvedStatus}
                </span>
              </div>

              <div className="booking-card-grid">
                <div>
                  <span className="booking-card-label">Package</span>
                  <span>{booking.packageName || '-'}</span>
                </div>
                <div>
                  <span className="booking-card-label">Travel</span>
                  <span>
                    {formatDateForDisplay(booking.travelStartDate)} →{' '}
                    {formatDateForDisplay(booking.travelEndDate)}
                  </span>
                </div>
                <div>
                  <span className="booking-card-label">Price</span>
                  <span>{formatCurrency(booking.packagePrice)}</span>
                </div>
                <div>
                  <span className="booking-card-label">Balance</span>
                  <span className="balance-text">
                    {formatCurrency(balance)}
                  </span>
                </div>
                <div>
                  <span className="booking-card-label">Persons</span>
                  <span>
                    {totalPersons(booking)} • {getGroupDisplay(booking)}
                  </span>
                </div>
                <div>
                  <span className="booking-card-label">Type</span>
                  <span>{normalizeBookingTourType(booking.type)}</span>
                </div>
              </div>

              <div
                className="booking-card-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <BookingRowMenu
                  booking={booking}
                  isOpen={openMenuId === booking.id}
                  onToggle={() =>
                    setOpenMenuId((prev) =>
                      prev === booking.id ? null : booking.id
                    )
                  }
                  onClose={() => setOpenMenuId(null)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  canEdit={canEdit}
                />
              </div>
            </article>
          );
        })}

        {!filteredBookings.length && (
          <div className="empty-state">
            <p>No matching bookings.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingList;
