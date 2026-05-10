import { formatCurrency, getPackageImage } from '../../utils/helpers';

function PackageList({ packages, onEdit, onDelete }) {
  if (!packages.length) {
    return (
      <div className="empty-state">
        <p>No packages added yet.</p>
        <span>Add your first package template to start using bookings.</span>
      </div>
    );
  }

  return (
    <div className="package-grid">
      {packages.map((item) => (
        <article className="package-card" key={item.id}>
          <img
            src={getPackageImage(item.imageUrl)}
            alt={item.name}
            className="package-image"
          />

          <div className="package-card-body">
            <h3>{item.name}</h3>
            <p className="package-location">{item.destination}</p>

            <div className="package-divider" />

            <div className="package-card-footer">
              <div>
                <p className="package-price">
                  {formatCurrency(item.pricePerPerson)}
                </p>
                <p className="package-duration">{item.duration || '-'}</p>
              </div>

              <div className="package-actions">
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => onEdit(item)}
                  title="Edit package"
                >
                  ✎
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => onDelete(item.id)}
                  title="Delete package"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default PackageList;
