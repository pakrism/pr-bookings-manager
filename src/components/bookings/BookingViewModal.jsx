import { useEffect } from 'react';
import { formatCurrency, getStatusBadgeClass } from '../../utils/helpers';
import {
  getBookingProfit,
  hasBookingFinancials,
} from '../../utils/bookingFinancials';

function BookingViewModal({ booking, onClose }) {
  useEffect(() => {
    function handleEsc(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!booking) return null;

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  const pax =
    Number(booking.adults || 0) +
    Number(booking.children || 0) +
    Number(booking.infants || 0);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-card package-modal">
        <div className="modal-header modal-header-row">
          <div>
            <h2 className="modal-title">Booking Details</h2>
            <p className="modal-subtitle">{booking.bookingRef || '-'}</p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <div className="form-section-title">👤 Guest</div>
            <div className="view-grid">
              <div>
                <strong>Name:</strong> {booking.guestName || '-'}
              </div>
              <div>
                <strong>Booked By:</strong> {booking.bookedBy || '-'}
              </div>
              <div>
                <strong>Package:</strong> {booking.packageName || '-'}
              </div>
              <div>
                <strong>Type:</strong> {booking.type || '-'}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">✈️ Travel</div>
            <div className="view-grid">
              <div>
                <strong>Dates:</strong> {booking.travelStartDate || '-'} →{' '}
                {booking.travelEndDate || '-'}
              </div>
              <div>
                <strong>Destination:</strong> {booking.destination || '-'}
              </div>
              <div>
                <strong>Duration:</strong> {booking.duration || '-'}
              </div>
              <div>
                <strong>Transport:</strong> {booking.transport || '-'}
              </div>
              <div>
                <strong>Departure City:</strong> {booking.departureCity || '-'}
              </div>
              <div>
                <strong>Accommodation:</strong> {booking.accommodation || '-'}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">👥 Persons</div>
            <div className="view-grid">
              <div>
                <strong>Pax:</strong> {pax}
              </div>
              <div>
                <strong>Adults:</strong> {booking.adults || 0}
              </div>
              <div>
                <strong>Children:</strong> {booking.children || 0}
              </div>
              <div>
                <strong>Infants:</strong> {booking.infants || 0}
              </div>
              <div>
                <strong>Group Type:</strong>{' '}
                {booking.groupType === 'Other'
                  ? booking.groupTypeNote || 'Other'
                  : booking.groupType || '-'}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">💳 Payment</div>
            <div className="view-grid">
              <div>
                <strong>Package:</strong> {formatCurrency(booking.packagePrice)}
              </div>
              <div>
                <strong>Advance:</strong>{' '}
                {formatCurrency(booking.advanceReceived)}
              </div>
              <div>
                <strong>Balance:</strong>{' '}
                {formatCurrency(booking.remainingAmount)}
              </div>
              <div>
                <strong>Total Expenses:</strong>{' '}
                {hasBookingFinancials(booking)
                  ? formatCurrency(booking.totalExpenses)
                  : '-'}
              </div>
              <div>
                <strong>Total Profit:</strong>{' '}
                {hasBookingFinancials(booking)
                  ? formatCurrency(getBookingProfit(booking))
                  : '-'}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={getStatusBadgeClass(booking.bookingStatus)}>
                  {booking.bookingStatus || '-'}
                </span>
              </div>
            </div>
          </div>

          {!!booking.specialNotes && (
            <div className="form-section">
              <div className="form-section-title">📝 Notes</div>
              <p className="muted-text">{booking.specialNotes}</p>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingViewModal;
