import { useEffect } from 'react';
import {
  BOOKED_BY_OPTIONS,
  BOOKING_TOUR_TYPES,
  MANUAL_BOOKING_STATUSES,
  groupTypes,
  transportOptions,
} from '../../data/constants';
import { formatCurrency, getStatusBadgeClass } from '../../utils/helpers';
import { resolveFormBookingStatus } from '../../utils/bookingStatus';

function BookingForm({
  bookingForm,
  editingBookingId,
  packages,
  onChange,
  onPackageChange,
  onSubmit,
  onClose,
}) {
  useEffect(() => {
    function handleEsc(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  const totalPersons =
    Number(bookingForm.adults || 0) +
    Number(bookingForm.children || 0) +
    Number(bookingForm.infants || 0);

  const balance =
    Number(bookingForm.packagePrice || 0) -
    Number(bookingForm.advanceReceived || 0);

  const autoStatus = resolveFormBookingStatus(bookingForm);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-card booking-modal">
        <div className="modal-header modal-header-row">
          <div>
            <h2 className="modal-title">
              {editingBookingId ? 'Edit Booking' : 'New Booking'}
            </h2>
            <p className="modal-subtitle">
              Add guest and tour booking details.
            </p>
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
          <form onSubmit={onSubmit}>
            <div className="form-section">
              <div className="form-section-title">👤 Guest & Tour</div>

              <div className="form-field">
                <label>Guest Name *</label>
                <input
                  className="form-input"
                  type="text"
                  name="guestName"
                  value={bookingForm.guestName}
                  onChange={onChange}
                  placeholder="Full name of the guest"
                />
              </div>

              <div className="section-block">
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>WhatsApp Number</label>
                    <input
                      className="form-input"
                      type="text"
                      name="whatsappNumber"
                      value={bookingForm.whatsappNumber}
                      onChange={onChange}
                      placeholder="+92 3xx xxxxxxx"
                    />
                  </div>

                  <div className="form-field">
                    <label>Package *</label>
                    <select
                      className="form-select"
                      name="packageTemplateId"
                      value={bookingForm.packageTemplateId}
                      onChange={onPackageChange}
                    >
                      <option value="">Select package</option>
                      {packages.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="section-block">
                <div className="form-grid-3">
                  <div className="form-field">
                    <label>Tour Type *</label>
                    <select
                      className="form-select"
                      name="type"
                      value={bookingForm.type}
                      onChange={onChange}
                    >
                      {BOOKING_TOUR_TYPES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Departure City</label>
                    <input
                      className="form-input"
                      type="text"
                      name="departureCity"
                      value={bookingForm.departureCity}
                      onChange={onChange}
                      placeholder="e.g. Islamabad"
                    />
                  </div>

                  <div className="form-field">
                    <label>Booked By</label>
                    <select
                      className="form-select"
                      name="bookedBy"
                      value={bookingForm.bookedBy}
                      onChange={onChange}
                    >
                      <option value="">Select</option>
                      {BOOKED_BY_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">✈️ Travel Details</div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Transport</label>
                  <select
                    className="form-select"
                    name="transport"
                    value={bookingForm.transport}
                    onChange={onChange}
                  >
                    <option value="">Select transport</option>
                    {transportOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Accommodation</label>
                  <input
                    className="form-input"
                    type="text"
                    name="accommodation"
                    value={bookingForm.accommodation}
                    onChange={onChange}
                    placeholder="e.g. Hotel Serena, 3-star"
                  />
                </div>
              </div>

              <div className="section-block">
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Departure Date *</label>
                    <input
                      className="form-input"
                      type="date"
                      name="travelStartDate"
                      value={bookingForm.travelStartDate}
                      onChange={onChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Return Date *</label>
                    <input
                      className="form-input"
                      type="date"
                      name="travelEndDate"
                      value={bookingForm.travelEndDate}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">
                👥 Persons
                <span className="count-pill">{totalPersons} total</span>
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label>Adults</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    name="adults"
                    value={bookingForm.adults}
                    onChange={onChange}
                  />
                </div>

                <div className="form-field">
                  <label>Children</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    name="children"
                    value={bookingForm.children}
                    onChange={onChange}
                  />
                </div>

                <div className="form-field">
                  <label>Infants</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    name="infants"
                    value={bookingForm.infants}
                    onChange={onChange}
                  />
                </div>
              </div>

              <div className="section-block">
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Group Type</label>
                    <select
                      className="form-select"
                      name="groupType"
                      value={bookingForm.groupType}
                      onChange={onChange}
                    >
                      {groupTypes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {bookingForm.groupType === 'Other' && (
                    <div className="form-field">
                      <label>Other Group Note</label>
                      <input
                        className="form-input"
                        type="text"
                        name="groupTypeNote"
                        value={bookingForm.groupTypeNote}
                        onChange={onChange}
                        placeholder="e.g. 3 colleagues"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">📝 Notes</div>

              <div className="form-field">
                <label>Special Notes</label>
                <textarea
                  className="form-textarea"
                  name="specialNotes"
                  value={bookingForm.specialNotes}
                  onChange={onChange}
                  rows={5}
                  placeholder="Any special requests or notes..."
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">💳 Payment</div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label>Package Price (PKR)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    name="packagePrice"
                    value={bookingForm.packagePrice}
                    onChange={onChange}
                  />
                </div>

                <div className="form-field">
                  <label>Advance Received (PKR)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    name="advanceReceived"
                    value={bookingForm.advanceReceived}
                    onChange={onChange}
                  />
                </div>

                <div className="form-field">
                  <label>Balance Due</label>
                  <div className="balance-box">{formatCurrency(balance)}</div>
                </div>
              </div>

              <div className="section-block">
                <div className="form-section-title">📊 Financials</div>
                <p className="form-hint">
                  Profit = Package Price − Total Expenses. Editing either field
                  updates the other.
                </p>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Total Expenses (PKR)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      name="totalExpenses"
                      value={bookingForm.totalExpenses}
                      onChange={onChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Total Profit (PKR)</label>
                    <input
                      className="form-input"
                      type="number"
                      name="totalProfit"
                      value={bookingForm.totalProfit}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>

              <div className="section-block">
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Status (auto from dates)</label>
                    <div className="status-preview">
                      <span className={getStatusBadgeClass(autoStatus)}>
                        {autoStatus}
                      </span>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Status override</label>
                    <select
                      className="form-select"
                      name="statusOverride"
                      value={bookingForm.statusOverride}
                      onChange={onChange}
                    >
                      <option value="">None (use dates)</option>
                      {MANUAL_BOOKING_STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Inclusions</label>
                    <textarea
                      className="form-textarea"
                      name="inclusionsText"
                      value={bookingForm.inclusionsText}
                      onChange={onChange}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                {editingBookingId ? 'Update Booking' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;
