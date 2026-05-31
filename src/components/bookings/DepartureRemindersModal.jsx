import { useEffect, useMemo } from 'react';
import { DEPARTURE_REMINDER_DAYS } from '../../data/constants';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { formatDateForDisplay, getWhatsappLink } from '../../utils/helpers';

function DepartureRemindersModal({ bookings, onClose }) {
  useEffect(() => {
    function handleEsc(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const reminderBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + DEPARTURE_REMINDER_DAYS);

    return bookings
      .filter((booking) => {
        const status = resolveBookingStatus(booking);
        if (status !== 'Upcoming' && status !== 'On-Going') {
          return false;
        }

        const start = new Date(booking.travelStartDate);
        if (Number.isNaN(start.getTime())) return false;

        start.setHours(0, 0, 0, 0);
        return start >= today && start <= end;
      })
      .sort(
        (a, b) =>
          new Date(a.travelStartDate).getTime() -
          new Date(b.travelStartDate).getTime()
      );
  }, [bookings]);

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleCopyNumbers() {
    const numbers = reminderBookings
      .map((booking) => booking.whatsappNumber?.replace(/[^\d]/g, ''))
      .filter(Boolean)
      .join('\n');

    if (!numbers) return;
    navigator.clipboard.writeText(numbers);
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-card package-modal">
        <div className="modal-header modal-header-row">
          <div>
            <h2 className="modal-title">Departure reminders</h2>
            <p className="modal-subtitle">
              Trips departing in the next {DEPARTURE_REMINDER_DAYS} days
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {!reminderBookings.length ? (
            <div className="empty-state">
              <p>No upcoming departures in this window.</p>
            </div>
          ) : (
            <>
              <div className="reminder-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleCopyNumbers}
                >
                  Copy all WhatsApp numbers
                </button>
              </div>

              <div className="reminder-list">
                {reminderBookings.map((booking) => {
                  const link = getWhatsappLink(booking.whatsappNumber);
                  const message = encodeURIComponent(
                    `Hi ${booking.guestName}, this is Pakrism regarding your trip to ${booking.destination} on ${formatDateForDisplay(booking.travelStartDate)}.`
                  );
                  const waHref = link ? `${link}?text=${message}` : null;

                  return (
                    <div key={booking.id} className="reminder-row">
                      <div>
                        <div className="guest-name">{booking.guestName}</div>
                        <div className="table-subtext">
                          {booking.packageName} •{' '}
                          {formatDateForDisplay(booking.travelStartDate)}
                        </div>
                      </div>
                      {waHref ? (
                        <a
                          className="secondary-btn"
                          href={waHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      ) : (
                        <span className="table-subtext">No number</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
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

export default DepartureRemindersModal;
