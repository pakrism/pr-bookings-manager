import { useEffect, useRef } from 'react';

function BookingRowMenu({
  booking,
  isOpen,
  onToggle,
  onClose,
  onEdit,
  onDelete,
  canEdit = true,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const whatsappLink = booking.whatsappNumber
    ? `https://wa.me/${booking.whatsappNumber.replace(/[^\d]/g, '')}`
    : null;

  return (
    <div className="row-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="row-menu-trigger"
        onClick={onToggle}
        aria-label="More actions"
      >
        ⋯
      </button>

      {isOpen && (
        <div className="row-menu-dropdown">
          {whatsappLink && (
            <a
              className="row-menu-item"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
            >
              WhatsApp
            </a>
          )}
          {canEdit && (
            <>
              <button
                type="button"
                className="row-menu-item"
                onClick={() => {
                  onClose();
                  onEdit(booking);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="row-menu-item danger"
                onClick={() => {
                  onClose();
                  onDelete(booking.id);
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default BookingRowMenu;
