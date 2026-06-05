import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import PackagesPage from './pages/PackagesPage';
import PackageForm from './components/packages/PackageForm';
import BookingForm from './components/bookings/BookingForm';
import BookingViewModal from './components/bookings/BookingViewModal';
import DepartureRemindersModal from './components/bookings/DepartureRemindersModal';
import SchedulePage from './components/schedule/SchedulePage';
import RevenuePage from './components/revenue/RevenuePage';
import LoginPage from './components/auth/LoginPage';
import { Toast } from './components/common/Toast';

import { emptyBookingForm, emptyPackageForm } from './data/constants';
import { getNextBookingRef, totalPersons } from './utils/helpers';
import {
  syncFinancials,
} from './utils/bookingFinancials';
import {
  computeBookingStatus,
} from './utils/bookingStatus';
import { toFormTourType } from './utils/tourType';
import { getBookingSyncPatch } from './utils/bookingSync';
import {
  emptyPaymentRow,
  getPaymentsFromBooking,
  normalizeFormPayments,
  computeRemainingAmount,
} from './utils/payments';
import {
  appendAuditLog,
  buildAuditEntry,
  buildBookingAuditSummary,
} from './utils/auditLog';
import { downloadBookingsCsv } from './utils/exportBookingsCsv';
import { prepareBookingsForList } from './utils/bookingFilters';
import {
  normalizeProfitSharePaid,
} from './utils/partnerProfit';

import {
  getApprovedUserProfile,
  loginWithEmail,
  logoutUser,
  watchAuth,
} from './lib/auth';

import { db } from './lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

import {
  subscribeToPackages,
  subscribeToBookings,
  createPackage,
  updatePackage,
  removePackage,
  createBooking,
  updateBooking,
  removeBooking,
} from './lib/firestore';

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [screen, setScreen] = useState('dashboard');

  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [bookingForm, setBookingForm] = useState({
    ...emptyBookingForm,
    payments: [emptyPaymentRow()],
  });

  const [editingPackageId, setEditingPackageId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [viewBooking, setViewBooking] = useState(null);

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All Status');
  const [bookingMonthFilter, setBookingMonthFilter] = useState('All months');
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [toast, setToast] = useState(null);
  const [showRemindersModal, setShowRemindersModal] = useState(false);

  const bookingSyncStarted = useRef(false);
  const isBookingModalOpenRef = useRef(false);

  const isAdmin = userProfile?.role !== 'viewer';

  useEffect(() => {
    isBookingModalOpenRef.current = isBookingModalOpen;
  }, [isBookingModalOpen]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const unsubscribe = watchAuth(async (firebaseUser) => {
      setAuthLoading(true);
      setAuthError('');

      if (!firebaseUser) {
        setAuthUser(null);
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        const profile = await getApprovedUserProfile(firebaseUser.uid);

        if (!profile || profile.isActive !== true) {
          await logoutUser();
          setAuthError('Access not approved.');
          setAuthUser(null);
          setUserProfile(null);
          setAuthLoading(false);
          return;
        }

        setAuthUser(firebaseUser);
        setUserProfile(profile);
      } catch (error) {
        console.error('Profile verification error:', error);
        setAuthError('Failed to verify access.');
        setAuthUser(null);
        setUserProfile(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser || !userProfile) return;

    const unsubPackages = subscribeToPackages((items) => {
      setPackages(items);
    });

    const unsubBookings = subscribeToBookings((items) => {
      setBookings(items);
    });

    return () => {
      unsubPackages();
      unsubBookings();
      bookingSyncStarted.current = false;
    };
  }, [authUser, userProfile]);

  useEffect(() => {
    if (!authUser || !userProfile || !bookings.length) return undefined;
    if (isBookingModalOpenRef.current) return undefined;

    const timer = window.setTimeout(async () => {
      if (bookingSyncStarted.current) return;
      bookingSyncStarted.current = true;

      const updates = bookings
        .map((booking) => {
          const patch = getBookingSyncPatch(booking);
          return patch ? { id: booking.id, patch } : null;
        })
        .filter(Boolean);

      for (const item of updates) {
        try {
          await updateBooking(item.id, item.patch);
        } catch (error) {
          console.error('Booking sync error:', error);
        }
      }
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [authUser, userProfile, bookings]);

  const pageMeta = useMemo(() => {
    if (screen === 'dashboard') {
      return {
        title: 'Dashboard',
        subtitle: 'Welcome back to Pakrism management',
      };
    }

    if (screen === 'bookings') {
      return {
        title: 'Bookings',
        subtitle: `${bookings.length} total bookings`,
      };
    }

    if (screen === 'schedule') {
      return {
        title: 'Schedule',
        subtitle: 'Grouped upcoming and past trip batches',
      };
    }

    if (screen === 'revenue') {
      return {
        title: 'Finance',
        subtitle: 'Departure-month attribution and partner shares',
      };
    }

    return {
      title: 'Packages',
      subtitle: `${packages.length} tour packages`,
    };
  }, [screen, bookings.length, packages.length]);

  async function handleLogin(email, password) {
    setLoginLoading(true);
    setAuthError('');

    try {
      await loginWithEmail(email, password);
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Sign out error:', error);
      showToast('Failed to sign out.', 'error');
    }
  }

  async function getNextBookingRefFromFirestore() {
    const counterRef = doc(db, 'counters', 'bookings');

    const nextNumber = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);

      if (!counterSnap.exists()) {
        transaction.set(counterRef, { current: 1 });
        return 1;
      }

      const current = Number(counterSnap.data().current || 0);
      const next = current + 1;

      transaction.update(counterRef, { current: next });
      return next;
    });

    return getNextBookingRef(nextNumber);
  }

  function resetPackageForm() {
    setPackageForm(emptyPackageForm);
    setEditingPackageId(null);
  }

  function resetBookingForm() {
    setBookingForm({
      ...emptyBookingForm,
      payments: [emptyPaymentRow()],
    });
    setEditingBookingId(null);
  }

  function getSuggestedPackagePrice(form = bookingForm) {
    const selectedPackage = packages.find(
      (item) => item.id === form.packageTemplateId
    );
    if (!selectedPackage) return 0;

    const pax = totalPersons(form);
    return Number(selectedPackage.pricePerPerson || 0) * pax;
  }

  const suggestedPackagePrice = useMemo(
    () => getSuggestedPackagePrice(bookingForm),
    [bookingForm, packages]
  );

  function openNewPackageModal() {
    resetPackageForm();
    setIsPackageModalOpen(true);
  }

  function closePackageModal() {
    resetPackageForm();
    setIsPackageModalOpen(false);
  }

  function openNewBookingModal() {
    resetBookingForm();
    setIsBookingModalOpen(true);
  }

  function closeBookingModal() {
    resetBookingForm();
    setIsBookingModalOpen(false);
  }

  function handlePackageInputChange(event) {
    const { name, value, type, checked } = event.target;

    setPackageForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleBookingInputChange(event) {
    const { name, value } = event.target;

    setBookingForm((prev) => {
      let next = syncFinancials(prev, name, value);

      if (name === 'packagePrice') {
        next = { ...next, packagePriceTouched: true };
      }

      if (['adults', 'children', 'infants'].includes(name) && !next.packagePriceTouched) {
        const suggested = getSuggestedPackagePrice(next);
        if (suggested > 0) {
          next = { ...next, packagePrice: String(suggested) };
        }
      }

      return next;
    });
  }

  function handlePaymentChange(index, field, value) {
    setBookingForm((prev) => {
      const payments = [...(prev.payments || [])];
      payments[index] = { ...payments[index], [field]: value };
      return { ...prev, payments };
    });
  }

  function handleAddPayment() {
    setBookingForm((prev) => ({
      ...prev,
      payments: [...(prev.payments || []), emptyPaymentRow()],
    }));
  }

  function handleRemovePayment(index) {
    setBookingForm((prev) => ({
      ...prev,
      payments: (prev.payments || []).filter((_, i) => i !== index),
    }));
  }

  function handleApplySuggestedPrice() {
    setBookingForm((prev) => ({
      ...prev,
      packagePrice: String(getSuggestedPackagePrice(prev) || ''),
      packagePriceTouched: false,
    }));
  }

  function handleBookingPackageChange(event) {
    const selectedId = event.target.value;
    const selectedPackage = packages.find((item) => item.id === selectedId);

    if (!selectedPackage) {
      setBookingForm((prev) => ({
        ...prev,
        packageTemplateId: '',
        packageName: '',
        destination: '',
        duration: '',
        type: '',
        inclusionsText: '',
      }));
      return;
    }

    setBookingForm((prev) => {
      const pax = totalPersons(prev);
      const priceSuggestion = Number(selectedPackage.pricePerPerson || 0) * pax;

      return {
        ...prev,
        packageTemplateId: selectedPackage.id,
        packageName: selectedPackage.name,
        destination: selectedPackage.destination,
        duration: selectedPackage.duration,
        type: selectedPackage.type,
        inclusionsText: selectedPackage.inclusionsText,
        packagePrice:
          !prev.packagePriceTouched && priceSuggestion > 0
            ? String(priceSuggestion)
            : prev.packagePrice,
      };
    });
  }

  async function handleSavePackage(event) {
    event.preventDefault();

    if (!packageForm.name.trim()) {
      showToast('Please enter package name.', 'error');
      return;
    }

    if (!packageForm.destination.trim()) {
      showToast('Please enter location.', 'error');
      return;
    }

    const existingPackage = packages.find(
      (item) => item.id === editingPackageId
    );

    const data = {
      name: packageForm.name.trim(),
      destination: packageForm.destination.trim(),
      duration: packageForm.duration?.trim() || '',
      type: packageForm.type,
      pricePerPerson: Number(packageForm.pricePerPerson || 0),
      imageUrl: packageForm.imageUrl?.trim() || '',
      inclusionsText: packageForm.inclusionsText || '',
      isActive: packageForm.isActive,
      createdByName: existingPackage?.createdByName || userProfile.fullName,
      createdByUid: existingPackage?.createdByUid || authUser.uid,
      updatedByName: userProfile.fullName,
      updatedByUid: authUser.uid,
      createdAt: existingPackage?.createdAt || null,
    };

    try {
      if (editingPackageId) {
        await updatePackage(editingPackageId, data);
      } else {
        await createPackage(data);
      }

      closePackageModal();
      showToast(
        editingPackageId ? 'Package updated.' : 'Package created.'
      );
    } catch (error) {
      console.error('Save package error:', error);
      showToast(
        `Failed to save package: ${error.code || ''} ${error.message || ''}`,
        'error'
      );
    }
  }

  function handleEditPackage(packageItem) {
    setEditingPackageId(packageItem.id);
    setPackageForm({
      name: packageItem.name || '',
      destination: packageItem.destination || '',
      duration: packageItem.duration || '',
      type: packageItem.type || 'Group',
      pricePerPerson: packageItem.pricePerPerson || '',
      imageUrl: packageItem.imageUrl || '',
      inclusionsText: packageItem.inclusionsText || '',
      isActive:
        typeof packageItem.isActive === 'boolean' ? packageItem.isActive : true,
    });
    setIsPackageModalOpen(true);
  }

  async function handleDeletePackage(packageId) {
    const linkedBookings = bookings.filter(
      (booking) => booking.packageTemplateId === packageId
    );

    if (linkedBookings.length) {
      showToast(
        'This package is linked with bookings and cannot be deleted.',
        'error'
      );
      return;
    }

    const confirmed = window.confirm('Delete this package?');
    if (!confirmed) return;

    try {
      await removePackage(packageId);
      showToast('Package deleted.');
    } catch (error) {
      console.error('Delete package error:', error);
      showToast('Failed to delete package.', 'error');
    }
  }

  async function handleSaveBooking(event) {
    event.preventDefault();

    if (!isAdmin) {
      showToast('You have read-only access.', 'error');
      return;
    }

    if (!bookingForm.guestName.trim()) {
      showToast('Please enter guest name.', 'error');
      return;
    }

    if (!bookingForm.packageTemplateId) {
      showToast('Please select a package.', 'error');
      return;
    }

    if (!bookingForm.travelStartDate) {
      showToast('Please select departure date.', 'error');
      return;
    }

    if (!bookingForm.travelEndDate) {
      showToast('Please select return date.', 'error');
      return;
    }

    const packagePrice = Number(bookingForm.packagePrice || 0);
    const payments = normalizeFormPayments(bookingForm.payments);
    const advanceReceived = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const bookingStatus = bookingForm.statusOverride
      ? bookingForm.statusOverride
      : computeBookingStatus(
          bookingForm.travelStartDate,
          bookingForm.travelEndDate
        );
    const remainingAmount = computeRemainingAmount(
      packagePrice,
      advanceReceived,
      bookingStatus
    );

    const hasFinancialInput =
      bookingForm.totalExpenses !== '' || bookingForm.totalProfit !== '';
    const financialFields = hasFinancialInput
      ? {
          totalExpenses: Number(bookingForm.totalExpenses || 0),
          totalProfit: packagePrice - Number(bookingForm.totalExpenses || 0),
        }
      : {
          totalExpenses: null,
          totalProfit: null,
        };

    const existingBooking = bookings.find(
      (item) => item.id === editingBookingId
    );

    const bookingPayload = {
      guestName: bookingForm.guestName.trim(),
      whatsappNumber: bookingForm.whatsappNumber.trim(),
      packageTemplateId: bookingForm.packageTemplateId,
      packageName: bookingForm.packageName,
      destination: bookingForm.destination,
      duration: bookingForm.duration,
      type: bookingForm.type,
      inclusionsText: bookingForm.inclusionsText,
      travelStartDate: bookingForm.travelStartDate,
      travelEndDate: bookingForm.travelEndDate,
      departureCity: bookingForm.departureCity.trim(),
      transport: bookingForm.transport,
      accommodation: bookingForm.accommodation.trim(),
      adults: Number(bookingForm.adults || 0),
      children: Number(bookingForm.children || 0),
      infants: Number(bookingForm.infants || 0),
      groupType: bookingForm.groupType,
      groupTypeNote: bookingForm.groupTypeNote.trim(),
      packagePrice,
      payments,
      advanceReceived,
      remainingAmount,
      ...financialFields,
      specialNotes: bookingForm.specialNotes.trim(),
      bookingStatus,
      bookedBy: bookingForm.bookedBy,
      updatedByUid: authUser.uid,
      updatedByName: userProfile.fullName,
    };

    setIsSavingBooking(true);

    try {
      if (editingBookingId) {
        const updatedBooking = {
          bookingRef: existingBooking?.bookingRef || '',
          ...bookingPayload,
          profitSharePaid: normalizeProfitSharePaid(
            existingBooking?.profitSharePaid
          ),
          createdByUid: existingBooking?.createdByUid || authUser.uid,
          createdByName: existingBooking?.createdByName || userProfile.fullName,
          createdAt: existingBooking?.createdAt || null,
          auditLog: appendAuditLog(
            existingBooking?.auditLog,
            buildAuditEntry({
              action: 'updated',
              byUid: authUser.uid,
              byName: userProfile.fullName,
              summary: buildBookingAuditSummary(existingBooking, bookingPayload),
            })
          ),
        };

        await updateBooking(editingBookingId, updatedBooking);
        showToast('Booking updated.');
      } else {
        const bookingRef = await getNextBookingRefFromFirestore();

        const newBooking = {
          bookingRef,
          ...bookingPayload,
          createdByUid: authUser.uid,
          createdByName: userProfile.fullName,
          createdAt: null,
          auditLog: [
            buildAuditEntry({
              action: 'created',
              byUid: authUser.uid,
              byName: userProfile.fullName,
              summary: 'Booking created',
            }),
          ],
        };

        await createBooking(newBooking);
        showToast('Booking created.');
      }

      closeBookingModal();
    } catch (error) {
      console.error('Save booking error:', error);
      showToast(
        `Failed to save booking: ${error.code || ''} ${error.message || ''}`,
        'error'
      );
    } finally {
      setIsSavingBooking(false);
    }
  }

  function handleEditBooking(booking) {
    const payments = getPaymentsFromBooking(booking).map((payment) => ({
      id: payment.id,
      amount: String(payment.amount ?? ''),
      paidAt: payment.paidAt || '',
      note: payment.note || '',
    }));

    setEditingBookingId(booking.id);
    setBookingForm({
      guestName: booking.guestName || '',
      whatsappNumber: booking.whatsappNumber || '',
      packageTemplateId: booking.packageTemplateId || '',
      packageName: booking.packageName || '',
      destination: booking.destination || '',
      duration: booking.duration || '',
      type: toFormTourType(booking.type),
      inclusionsText: booking.inclusionsText || '',
      travelStartDate: booking.travelStartDate || '',
      travelEndDate: booking.travelEndDate || '',
      departureCity: booking.departureCity || '',
      transport: booking.transport || '',
      accommodation: booking.accommodation || '',
      adults: booking.adults ?? 1,
      children: booking.children ?? 0,
      infants: booking.infants ?? 0,
      groupType: booking.groupType || 'Solo',
      groupTypeNote: booking.groupTypeNote || '',
      packagePrice: booking.packagePrice || '',
      packagePriceTouched: true,
      payments: payments.length ? payments : [emptyPaymentRow()],
      totalExpenses: booking.totalExpenses ?? '',
      totalProfit: booking.totalProfit ?? '',
      specialNotes: booking.specialNotes || '',
      statusOverride: ['Cancelled', 'Refunded'].includes(booking.bookingStatus)
        ? booking.bookingStatus
        : '',
      bookedBy: booking.bookedBy || '',
    });
    setIsBookingModalOpen(true);
  }

  async function handleToggleProfitSharePaid(bookingId, shareKey, paid) {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking || !authUser || !userProfile) return;

    const profitSharePaid = {
      ...normalizeProfitSharePaid(booking.profitSharePaid),
      [shareKey]: paid,
    };

    try {
      await updateBooking(bookingId, {
        profitSharePaid,
        updatedByUid: authUser.uid,
        updatedByName: userProfile.fullName,
      });

      if (viewBooking?.id === bookingId) {
        setViewBooking({ ...viewBooking, profitSharePaid });
      }

      showToast(paid ? 'Marked as paid.' : 'Marked as unpaid.');
    } catch (error) {
      console.error('Profit share paid toggle error:', error);
      showToast('Failed to update payout status.', 'error');
    }
  }

  async function handleDeleteBooking(bookingId) {
    const confirmed = window.confirm('Delete this booking?');
    if (!confirmed) return;

    try {
      await removeBooking(bookingId);
      showToast('Booking deleted.');
    } catch (error) {
      console.error('Delete booking error:', error);
      showToast('Failed to delete booking.', 'error');
    }
  }

  function handleExportBookingsCsv() {
    const filtered = prepareBookingsForList(bookings, {
      searchTerm: bookingSearch,
      statusFilter: bookingStatusFilter,
      monthFilter: bookingMonthFilter,
      sortKey: 'departure_desc',
    });
    downloadBookingsCsv(filtered);
    showToast('Bookings CSV downloaded.');
  }

  function handleResetLocalData() {
    showToast('Local reset is no longer used after Firestore sync.', 'error');
  }

  if (authLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-loading">Checking access...</div>
        </div>
      </div>
    );
  }

  if (!authUser || !userProfile) {
    return (
      <LoginPage
        onLogin={handleLogin}
        errorMessage={authError}
        loading={loginLoading}
      />
    );
  }

  return (
    <DashboardLayout
      screen={screen}
      setScreen={setScreen}
      pageTitle={pageMeta.title}
      pageSubtitle={pageMeta.subtitle}
      currentUserName={userProfile.fullName}
      currentUserEmail={userProfile.email}
      userRole={userProfile.role}
      bookingCount={bookings.length}
      packageCount={packages.length}
      onSignOut={handleSignOut}
    >
      {screen === 'dashboard' && (
        <DashboardPage
          bookings={bookings}
          userProfile={userProfile}
          isAdmin={isAdmin}
          onNewBooking={openNewBookingModal}
          onViewBooking={(booking) => setViewBooking(booking)}
          onViewAllBookings={() => setScreen('bookings')}
        />
      )}

      {screen === 'packages' && (
        <PackagesPage
          packages={packages}
          onEdit={handleEditPackage}
          onDelete={handleDeletePackage}
          canEdit={isAdmin}
          onAddPackage={openNewPackageModal}
        />
      )}

      {screen === 'bookings' && (
        <BookingsPage
          bookings={bookings}
          searchTerm={bookingSearch}
          statusFilter={bookingStatusFilter}
          monthFilter={bookingMonthFilter}
          onSearchChange={setBookingSearch}
          onStatusChange={setBookingStatusFilter}
          onMonthChange={setBookingMonthFilter}
          onView={(booking) => setViewBooking(booking)}
          onEdit={handleEditBooking}
          onDelete={handleDeleteBooking}
          canEdit={isAdmin}
          onNewBooking={openNewBookingModal}
          onExportCsv={handleExportBookingsCsv}
          onShowReminders={() => setShowRemindersModal(true)}
        />
      )}

      {screen === 'revenue' && (
        <RevenuePage
          bookings={bookings}
          onViewBooking={(booking) => setViewBooking(booking)}
          onExportToast={() => showToast('Revenue CSV downloaded.')}
          canEdit={isAdmin}
          onToggleProfitSharePaid={handleToggleProfitSharePaid}
        />
      )}

      {screen === 'schedule' && (
        <>
          <div className="page-actions">
            <div className="page-section-title">Trip schedule overview</div>
          </div>

          <SchedulePage
            bookings={bookings}
            onOpenBooking={(booking) => setViewBooking(booking)}
          />
        </>
      )}

      {isPackageModalOpen && (
        <PackageForm
          packageForm={packageForm}
          editingPackageId={editingPackageId}
          onChange={handlePackageInputChange}
          onSubmit={handleSavePackage}
          onClose={closePackageModal}
        />
      )}

      {isBookingModalOpen && (
        <BookingForm
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
          onClose={closeBookingModal}
          isSubmitting={isSavingBooking}
          readOnly={!isAdmin}
        />
      )}

      {viewBooking && (
        <BookingViewModal
          booking={viewBooking}
          onClose={() => setViewBooking(null)}
          canEdit={isAdmin}
          onEdit={handleEditBooking}
          onToggleProfitSharePaid={handleToggleProfitSharePaid}
        />
      )}

      {showRemindersModal && (
        <DepartureRemindersModal
          bookings={bookings}
          onClose={() => setShowRemindersModal(false)}
        />
      )}

      <Toast toast={toast} />
    </DashboardLayout>
  );
}

export default App;
