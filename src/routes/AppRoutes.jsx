import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardPage from '../pages/DashboardPage';
import BookingsPage from '../pages/BookingsPage';
import BookingDetailPage from '../pages/BookingDetailPage';
import BookingFormPage from '../pages/BookingFormPage';
import PackagesPage from '../pages/PackagesPage';
import PackageFormDrawer from '../components/packages/PackageFormDrawer';
import SchedulePage from '../pages/SchedulePage';
import FinancePage from '../pages/FinancePage';
import UsersPage from '../pages/UsersPage';
import DepartureRemindersModal from '../components/bookings/DepartureRemindersModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RequireAccess from '../components/auth/RequireAccess';
import { Toast } from '../components/common/Toast';
import { useAppData } from '../context/AppDataContext';

function AppShell() {
  const {
    bookings,
    userProfile,
    capabilities,
    showRemindersModal,
    setShowRemindersModal,
    confirmDialog,
    setConfirmDialog,
    toast,
    navigateToBooking,
    handleToggleProfitSharePaid,
    handleTogglePartnerPoolPaid,
    handleBulkUpdatePayouts,
    showToast,
  } = useAppData();

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route
          path="/bookings/new"
          element={
            <RequireAccess fallback="/bookings">
              <BookingFormPage />
            </RequireAccess>
          }
        />
        <Route path="/bookings/:id" element={<BookingDetailPage />} />
        <Route
          path="/bookings/:id/edit"
          element={
            <RequireAccess fallback="/bookings">
              <BookingFormPage />
            </RequireAccess>
          }
        />
        <Route path="/packages" element={<PackagesPage />} />
        <Route
          path="/packages/new"
          element={
            <RequireAccess fallback="/packages">
              <PackagesPage />
              <PackageFormDrawer />
            </RequireAccess>
          }
        />
        <Route
          path="/packages/:id/edit"
          element={
            <RequireAccess fallback="/packages">
              <PackagesPage />
              <PackageFormDrawer />
            </RequireAccess>
          }
        />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route
          path="/finance"
          element={
            <RequireAccess fallback="/dashboard">
              <FinancePage
                bookings={bookings}
                userProfile={userProfile}
                onViewBooking={navigateToBooking}
                onExportToast={() => showToast('Revenue CSV downloaded.')}
                canEdit={capabilities.canTogglePayouts}
                onToggleProfitSharePaid={handleToggleProfitSharePaid}
                onTogglePartnerPoolPaid={handleTogglePartnerPoolPaid}
                onBulkUpdatePayouts={handleBulkUpdatePayouts}
              />
            </RequireAccess>
          }
        />
        <Route
          path="/users"
          element={
            <RequireAccess fallback="/dashboard">
              <UsersPage />
            </RequireAccess>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {showRemindersModal && (
        <DepartureRemindersModal
          bookings={bookings}
          onClose={() => setShowRemindersModal(false)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          open
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      <Toast toast={toast} />
    </DashboardLayout>
  );
}

export default AppShell;
