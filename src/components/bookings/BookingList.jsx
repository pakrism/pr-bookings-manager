import {
  formatCurrency,
  formatDateForDisplay,
  getStatusBadgeClass,
  getWhatsappLink,
  totalPersons,
} from '../../utils/helpers';
import {
  getBookingProfit,
  hasBookingFinancials,
} from '../../utils/bookingFinancials';

function BookingList({
  bookings,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onEdit,
  onDelete,
}) {
  const filteredBookings = bookings.filter((booking) => {
    const query = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !query ||
      booking.guestName?.toLowerCase().includes(query) ||
      booking.packageName?.toLowerCase().includes(query) ||
      booking.destination?.toLowerCase().includes(query) ||
      booking.bookingRef?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'All Status' || booking.bookingStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

      <div className="bookings-table-wrap">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Package</th>
              <th>Type</th>
              <th>Travel</th>
              <th>Persons</th>
              <th>Booked By</th>
              <th>Status</th>
              <th>Price</th>
              <th>Expenses</th>
              <th>Profit</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredBookings.map((booking) => {
              const balance =
                Number(booking.remainingAmount || 0) ||
                Number(booking.packagePrice || 0) -
                  Number(booking.advanceReceived || 0);

              const whatsappLink = getWhatsappLink(booking.whatsappNumber);

              return (
                <tr key={booking.id}>
                  <td>
                    <div className="guest-name">{booking.guestName}</div>
                    <div className="guest-subtext">
                      {booking.departureCity || '-'}
                    </div>
                  </td>

                  <td>{booking.packageName || '-'}</td>

                  <td>
                    <span className="type-pill">{booking.type || '-'}</span>
                  </td>

                  <td>
                    <div>{`${formatDateForDisplay(
                      booking.travelStartDate
                    )} → ${formatDateForDisplay(booking.travelEndDate)}`}</div>
                    <div className="table-subtext">
                      {booking.transport || '-'}
                    </div>
                  </td>

                  <td>
                    {totalPersons(booking)} • {getGroupDisplay(booking)}
                  </td>

                  <td>{booking.bookedBy || '-'}</td>

                  <td>
                    <span
                      className={getStatusBadgeClass(booking.bookingStatus)}
                    >
                      {booking.bookingStatus}
                    </span>
                  </td>

                  <td>{formatCurrency(booking.packagePrice)}</td>

                  <td>
                    {hasBookingFinancials(booking)
                      ? formatCurrency(booking.totalExpenses)
                      : '-'}
                  </td>

                  <td>
                    {hasBookingFinancials(booking)
                      ? formatCurrency(getBookingProfit(booking))
                      : '-'}
                  </td>

                  <td>
                    <span className="balance-text">
                      {formatCurrency(balance)}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">
                      {booking.whatsappNumber && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="action-btn whatsapp"
                          title="Open WhatsApp"
                        >
                          💬
                        </a>
                      )}

                      <button
                        className="action-btn edit"
                        onClick={() => onEdit(booking)}
                        title="Edit booking"
                      >
                        ✏️
                      </button>

                      <button
                        className="action-btn delete"
                        onClick={() => onDelete(booking.id)}
                        title="Delete booking"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filteredBookings.length && (
              <tr>
                <td colSpan="10">
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
    </div>
  );
}

export default BookingList;
