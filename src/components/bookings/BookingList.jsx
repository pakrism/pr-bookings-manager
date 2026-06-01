import { useState } from 'react';
import {
  formatCurrency,
  formatDateForDisplay,
  getStatusBadgeClass,
  totalPersons,
} from '../../utils/helpers';
import { getBookingBalance } from '../../utils/bookingBalance';
import { getBookingProfit } from '../../utils/bookingFinancials';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { normalizeBookingTourType } from '../../utils/tourType';
import {
  prepareBookingsForList,
  getTravelMonthOptions,
} from '../../utils/bookingFilters';
import { BOOKING_SORT_OPTIONS } from '../../utils/bookingSort';
import { formatMonthLabel, groupByMonthKey } from '../../utils/datePeriods';
import { getPartnerShareAmount } from '../../utils/partnerProfit';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import BookingRowMenu from './BookingRowMenu';

function BookingRowContent({
  booking,
  rowVariant,
  listVariant,
  openMenuId,
  setOpenMenuId,
  onView,
  onEdit,
  onDelete,
  canEdit,
}) {
  const resolvedStatus = resolveBookingStatus(booking);
  const balance = getBookingBalance(booking);
  const profit = getBookingProfit(booking);
  const partnerShare = getPartnerShareAmount(booking);

  function getGroupDisplay() {
    if (booking.groupType === 'Other' && booking.groupTypeNote?.trim()) {
      return booking.groupTypeNote.trim();
    }
    return booking.groupType || '-';
  }

  if (rowVariant === 'table') {
    return (
      <tr
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
          <div className="table-subtext">{booking.destination || '-'}</div>
        </td>
        {listVariant === 'full' && (
          <td>
            <div>{`${formatDateForDisplay(
              booking.travelStartDate
            )} → ${formatDateForDisplay(booking.travelEndDate)}`}</div>
            <div className="table-subtext">{booking.transport || '-'}</div>
          </td>
        )}
        <td>
          <span className={getStatusBadgeClass(resolvedStatus)}>
            {resolvedStatus}
          </span>
        </td>
        <td>{formatCurrency(booking.packagePrice)}</td>
        <td>
          {profit != null ? (
            <div>
              <div>{formatCurrency(profit)}</div>
              <div className="table-subtext">
                {partnerShare != null
                  ? `${formatCurrency(partnerShare)} / partner`
                  : '-'}
              </div>
            </div>
          ) : (
            '-'
          )}
        </td>
        <td>
          <span className="balance-text">{formatCurrency(balance)}</span>
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
  }

  return (
    <article
      className="booking-card"
      onClick={() => onView?.(booking)}
    >
      <div className="booking-card-header">
        <div>
          <div className="guest-name">{booking.guestName}</div>
          <div className="table-subtext">{booking.bookingRef || '-'}</div>
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
          <span className="booking-card-label">Profit / share</span>
          <span>
            {profit != null
              ? `${formatCurrency(profit)} / ${formatCurrency(partnerShare)}`
              : '-'}
          </span>
        </div>
        <div>
          <span className="booking-card-label">Balance</span>
          <span className="balance-text">{formatCurrency(balance)}</span>
        </div>
        <div>
          <span className="booking-card-label">Persons</span>
          <span>
            {totalPersons(booking)} • {getGroupDisplay()}
          </span>
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
            setOpenMenuId((prev) => (prev === booking.id ? null : booking.id))
          }
          onClose={() => setOpenMenuId(null)}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
        />
      </div>
    </article>
  );
}

function MonthGroupHeader({ monthKey, bookings }) {
  const revenue = bookings.reduce(
    (sum, b) => sum + Number(b.packagePrice || 0),
    0
  );
  const profit = bookings.reduce((sum, b) => {
    const p = getBookingProfit(b);
    return sum + (p ?? 0);
  }, 0);

  return (
    <div className="month-group-header">
      <h3 className="month-group-title">{formatMonthLabel(monthKey)}</h3>
      <span className="month-group-meta">
        {bookings.length} booking{bookings.length !== 1 ? 's' : ''} •{' '}
        {formatCurrency(revenue)} revenue • {formatCurrency(profit)} profit
      </span>
    </div>
  );
}

function BookingList({
  allBookings = [],
  bookings,
  searchTerm,
  statusFilter,
  monthFilter,
  sortKey,
  onSearchChange,
  onStatusChange,
  onMonthChange,
  onSortChange,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  variant = 'full',
  showToolbar = true,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const isMobile = useMediaQuery('(max-width: 760px)');

  const sourceBookings = bookings ?? allBookings;
  const monthOptions = getTravelMonthOptions(sourceBookings);

  const prepared = prepareBookingsForList(sourceBookings, {
    searchTerm,
    statusFilter,
    monthFilter,
    sortKey,
  });

  const showMonthGroups =
    showToolbar && (!monthFilter || monthFilter === 'All months');

  const grouped =
    showMonthGroups && prepared.length
      ? groupByMonthKey(prepared, (b) => b.travelStartDate)
      : [['', prepared]];

  if (!sourceBookings.length) {
    return (
      <div className="empty-state">
        <p>No bookings added yet.</p>
        <span>Create your first booking to start tracking records.</span>
      </div>
    );
  }

  function renderBookingsList(list) {
    if (isMobile) {
      return (
        <div className="bookings-cards-wrap">
          {list.map((booking) => (
            <BookingRowContent
              key={booking.id}
              booking={booking}
              rowVariant="card"
              listVariant={variant}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="bookings-table-wrap">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Guest</th>
              <th>Package</th>
              {variant === 'full' && <th>Travel</th>}
              <th>Status</th>
              <th>Price</th>
              <th>Profit</th>
              <th>Balance</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {list.map((booking) => (
              <BookingRowContent
                key={booking.id}
                booking={booking}
                rowVariant="table"
                listVariant={variant}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={canEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bookings-panel">
      {showToolbar && (
        <div className="bookings-toolbar bookings-toolbar-wrap">
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
            value={monthFilter || 'All months'}
            onChange={(e) => onMonthChange?.(e.target.value)}
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

          <select
            className="toolbar-select"
            value={sortKey || 'departure_desc'}
            onChange={(e) => onSortChange?.(e.target.value)}
          >
            {BOOKING_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {prepared.length === 0 ? (
        <div className="empty-state" style={{ margin: '16px' }}>
          <p>No matching bookings.</p>
          <span>Try a different search, month, or status filter.</span>
        </div>
      ) : showMonthGroups ? (
        grouped.map(([monthKey, monthBookings]) => (
          <div key={monthKey || 'all'} className="month-group">
            {monthKey && monthKey !== 'unknown' && (
              <MonthGroupHeader monthKey={monthKey} bookings={monthBookings} />
            )}
            {renderBookingsList(monthBookings)}
          </div>
        ))
      ) : (
        renderBookingsList(prepared)
      )}
    </div>
  );
}

export default BookingList;
