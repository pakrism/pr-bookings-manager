import { useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/helpers';
import BookingStatusChip from '../common/BookingStatusChip';
import {
  PrimaryButton,
  OutlineButton,
} from '../common/BrandButton';
import {
  getBookingProfit,
  hasBookingFinancials,
} from '../../utils/bookingFinancials';
import { getBookingBalance } from '../../utils/bookingBalance';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { normalizeBookingTourType } from '../../utils/tourType';
import { getPaymentsFromBooking, getTotalPaid } from '../../utils/payments';
import { generateInvoicePDF } from '../../utils/invoice';
import ProfitShareBreakdown from '../profit/ProfitShareBreakdown';

function BookingViewModal({
  booking,
  onClose,
  canEdit = true,
  onEdit,
  onToggleProfitSharePaid,
}) {
  const [showHistory, setShowHistory] = useState(false);

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

  const resolvedStatus = resolveBookingStatus(booking);
  const payments = getPaymentsFromBooking(booking);
  const balance = getBookingBalance(booking);
  const totalPaid = getTotalPaid(booking);

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
                <strong>Type:</strong> {normalizeBookingTourType(booking.type)}
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
                <strong>Total paid:</strong> {formatCurrency(totalPaid)}
              </div>
              <div>
                <strong>Balance:</strong> {formatCurrency(balance)}
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
                <BookingStatusChip status={resolvedStatus} />
              </div>
            </div>

            {payments.length > 0 && (
              <div className="payment-history-list">
                {payments.map((payment) => (
                  <div key={payment.id} className="payment-history-row">
                    <span>{payment.paidAt || '-'}</span>
                    <span>{payment.note || '-'}</span>
                    <strong>{formatCurrency(payment.amount)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasBookingFinancials(booking) && (
            <div className="form-section">
              <div className="form-section-title">Profit distribution</div>
              <ProfitShareBreakdown
                booking={booking}
                canEdit={canEdit}
                onTogglePaid={(shareKey, paid) =>
                  onToggleProfitSharePaid?.(booking.id, shareKey, paid)
                }
              />
            </div>
          )}

          {!!booking.auditLog?.length && (
            <div className="form-section">
              <button
                type="button"
                className="link-btn"
                onClick={() => setShowHistory((prev) => !prev)}
              >
                {showHistory ? 'Hide' : 'Show'} change history
              </button>
              {showHistory && (
                <ul className="audit-log-list">
                  {booking.auditLog.map((entry, index) => (
                    <li key={`${entry.at}-${index}`}>
                      <strong>{entry.byName || 'User'}</strong> — {entry.summary}
                      <div className="table-subtext">
                        {new Date(entry.at).toLocaleString()} ({entry.action})
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!!booking.specialNotes && (
            <div className="form-section">
              <div className="form-section-title">📝 Notes</div>
              <p className="muted-text">{booking.specialNotes}</p>
            </div>
          )}

          <div className="modal-footer">
            <OutlineButton
              type="button"
              onClick={() => generateInvoicePDF(booking)}
            >
              Download invoice
            </OutlineButton>
            {canEdit && onEdit && (
              <PrimaryButton
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(booking);
                }}
              >
                Edit
              </PrimaryButton>
            )}
            <OutlineButton type="button" onClick={onClose}>
              Close
            </OutlineButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingViewModal;
