import { useEffect } from 'react';
import { packageTypes } from '../../data/constants';
import { getPackageImage } from '../../utils/helpers';

function PackageForm({
  packageForm,
  editingPackageId,
  onChange,
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

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-card package-modal">
        <div className="modal-header modal-header-row">
          <div>
            <h2 className="modal-title">
              {editingPackageId ? 'Edit Package' : 'New Package'}
            </h2>
            <p className="modal-subtitle">
              Create a reusable tour package template for bookings.
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
              <div className="form-section-title">📦 Package Info</div>

              <div className="form-field">
                <label>Package Name *</label>
                <input
                  className="form-input"
                  type="text"
                  name="name"
                  value={packageForm.name}
                  onChange={onChange}
                  placeholder="e.g. 4-Day Skardu Blossom Group Tour"
                />
              </div>

              <div className="section-block">
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Location *</label>
                    <input
                      className="form-input"
                      type="text"
                      name="destination"
                      value={packageForm.destination}
                      onChange={onChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Duration</label>
                    <input
                      className="form-input"
                      type="text"
                      name="duration"
                      value={packageForm.duration}
                      onChange={onChange}
                      placeholder="e.g. 4 Days / 3 Nights"
                    />
                  </div>
                </div>
              </div>

              <div className="section-block">
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Type</label>
                    <select
                      className="form-select"
                      name="type"
                      value={packageForm.type}
                      onChange={onChange}
                    >
                      {packageTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Price per Person (PKR) *</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      name="pricePerPerson"
                      value={packageForm.pricePerPerson}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">🖼 Media</div>

              <div className="form-field">
                <label>Image URL</label>
                <input
                  className="form-input"
                  type="text"
                  name="imageUrl"
                  value={packageForm.imageUrl}
                  onChange={onChange}
                  placeholder="https://..."
                />
              </div>

              <div className="section-block">
                <div className="package-preview">
                  <img
                    src={getPackageImage(packageForm.imageUrl)}
                    alt="Package preview"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">📝 Inclusions</div>

              <div className="form-field">
                <label>Inclusions</label>
                <textarea
                  className="form-textarea"
                  name="inclusionsText"
                  value={packageForm.inclusionsText}
                  onChange={onChange}
                  rows={6}
                  placeholder="One line per inclusion"
                />
              </div>
            </div>

            <div className="checkbox-row">
              <input
                type="checkbox"
                name="isActive"
                checked={packageForm.isActive}
                onChange={(event) =>
                  onChange({
                    target: {
                      name: 'isActive',
                      value: event.target.checked,
                    },
                  })
                }
              />
              <span>Active (available for booking)</span>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                {editingPackageId ? 'Update Package' : 'Add Package'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PackageForm;
