import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAppData } from '../context/AppDataContext';
import { useBookingFromParams } from '../context/AppDataProvider';
import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import BookingForm from '../components/bookings/BookingForm';

export default function BookingFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const booking = useBookingFromParams();
  const {
    packages,
    bookingForm,
    editingBookingId,
    isSavingBooking,
    isAdmin,
    loadBookingIntoForm,
    resetBookingForm,
    handleBookingInputChange,
    handleBookingPackageChange,
    handlePaymentChange,
    handleAddPayment,
    handleRemovePayment,
    handleApplySuggestedPrice,
    handleSaveBooking,
    suggestedPackagePrice,
  } = useAppData();

  useEffect(() => {
    if (isEdit && booking) {
      loadBookingIntoForm(booking);
    } else if (!isEdit) {
      resetBookingForm();
    }
  }, [id, booking?.id]);

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Bookings', href: '/bookings' },
    { name: isEdit ? booking?.bookingRef || 'Edit' : 'New' },
  ];

  return (
    <Box>
      <CustomBreadcrumbs links={breadcrumbs} />
      <BookingForm
        variant="page"
        bookingForm={bookingForm}
        editingBookingId={editingBookingId}
        packages={packages}
        onChange={handleBookingInputChange}
        onPackageChange={handleBookingPackageChange}
        onPaymentChange={handlePaymentChange}
        onAddPayment={handleAddPayment}
        onRemovePayment={handleRemovePayment}
        onApplySuggestedPrice={handleApplySuggestedPrice}
        suggestedPackagePrice={suggestedPackagePrice}
        onSubmit={handleSaveBooking}
        onClose={() => navigate(isEdit && id ? `/bookings/${id}` : '/bookings')}
        isSubmitting={isSavingBooking}
        readOnly={!isAdmin}
      />
    </Box>
  );
}
