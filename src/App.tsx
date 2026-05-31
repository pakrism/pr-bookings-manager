import { useEffect, useMemo, useState } from 'react';
import './App.css';

import Sidebar from './components/layout/Sidebar';
import PackageForm from './components/packages/PackageForm';
import PackageList from './components/packages/PackageList';
import BookingForm from './components/bookings/BookingForm';
import BookingList from './components/bookings/BookingList';
import BookingViewModal from './components/bookings/BookingViewModal';
import SchedulePage from './components/schedule/SchedulePage';
import LoginPage from './components/auth/LoginPage';

import { emptyBookingForm, emptyPackageForm } from './data/constants';
import { getNextBookingRef, formatCurrency } from './utils/helpers';
import {
  syncFinancials,
  getBookingProfit,
  getBookingExpenses,
} from './utils/bookingFinancials';
import {
  computeBookingStatus,
  resolveBookingStatus,
} from './utils/bookingStatus';
import { toFormTourType } from './utils/tourType';

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
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);

  const [editingPackageId, setEditingPackageId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [viewBooking, setViewBooking] = useState(null);

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All Status');

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
    };
  }, [authUser, userProfile]);

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

    return {
      title: 'Packages',
      subtitle: `${packages.length} tour packages`,
    };
  }, [screen, bookings.length, packages.length]);

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + Number(booking.packagePrice || 0),
    0
  );

  const totalProfit = bookings.reduce((sum, booking) => {
    const profit = getBookingProfit(booking);
    return sum + (profit ?? 0);
  }, 0);

  const totalExpenses = bookings.reduce((sum, booking) => {
    const expenses = getBookingExpenses(booking);
    return sum + (expenses ?? 0);
  }, 0);

  const totalAdvance = bookings.reduce(
    (sum, booking) => sum + Number(booking.advanceReceived || 0),
    0
  );

  const outstandingBalance = bookings.reduce((sum, booking) => {
    const balance =
      Number(booking.remainingAmount || 0) ||
      Number(booking.packagePrice || 0) -
        Number(booking.advanceReceived || 0);
    return sum + balance;
  }, 0);

  const profitMargin =
    totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const completedTrips = bookings.filter(
    (booking) => resolveBookingStatus(booking) === 'Completed'
  ).length;

  const upcomingBookings = bookings.filter((booking) => {
    const status = resolveBookingStatus(booking);
    return status === 'Upcoming' || status === 'On-Going';
  }).length;

  const recentBookings = [...bookings]
    .sort((a, b) => {
      const aTime =
        typeof a.createdAt?.toDate === 'function'
          ? a.createdAt.toDate().getTime()
          : new Date(a.createdAt || 0).getTime();

      const bTime =
        typeof b.createdAt?.toDate === 'function'
          ? b.createdAt.toDate().getTime()
          : new Date(b.createdAt || 0).getTime();

      return bTime - aTime;
    })
    .slice(0, 5);

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
      alert('Failed to sign out.');
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
    setBookingForm(emptyBookingForm);
    setEditingBookingId(null);
  }

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

    setBookingForm((prev) => syncFinancials(prev, name, value));
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

    setBookingForm((prev) => ({
      ...prev,
      packageTemplateId: selectedPackage.id,
      packageName: selectedPackage.name,
      destination: selectedPackage.destination,
      duration: selectedPackage.duration,
      type: selectedPackage.type,
      inclusionsText: selectedPackage.inclusionsText,
    }));
  }

  async function handleSavePackage(event) {
    event.preventDefault();

    if (!packageForm.name.trim()) {
      alert('Please enter package name.');
      return;
    }

    if (!packageForm.destination.trim()) {
      alert('Please enter location.');
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
    } catch (error) {
      console.error('Save package error:', error);
      alert(
        `Failed to save package: ${error.code || ''} ${error.message || ''}`
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
      alert('This package is linked with bookings and cannot be deleted.');
      return;
    }

    const confirmed = window.confirm('Delete this package?');
    if (!confirmed) return;

    try {
      await removePackage(packageId);
    } catch (error) {
      console.error('Delete package error:', error);
      alert('Failed to delete package.');
    }
  }

  async function handleSaveBooking(event) {
    event.preventDefault();

    if (!bookingForm.guestName.trim()) {
      alert('Please enter guest name.');
      return;
    }

    if (!bookingForm.packageTemplateId) {
      alert('Please select a package.');
      return;
    }

    if (!bookingForm.travelStartDate) {
      alert('Please select departure date.');
      return;
    }

    if (!bookingForm.travelEndDate) {
      alert('Please select return date.');
      return;
    }

    const packagePrice = Number(bookingForm.packagePrice || 0);
    const advanceReceived = Number(bookingForm.advanceReceived || 0);
    const remainingAmount = Math.max(packagePrice - advanceReceived, 0);
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
    const bookingStatus = bookingForm.statusOverride
      ? bookingForm.statusOverride
      : computeBookingStatus(
          bookingForm.travelStartDate,
          bookingForm.travelEndDate
        );

    const existingBooking = bookings.find(
      (item) => item.id === editingBookingId
    );

    try {
      if (editingBookingId) {
        const updatedBooking = {
          bookingRef: existingBooking?.bookingRef || '',
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
          advanceReceived,
          remainingAmount,
          ...financialFields,
          specialNotes: bookingForm.specialNotes.trim(),
          bookingStatus,
          bookedBy: bookingForm.bookedBy,
          createdByUid: existingBooking?.createdByUid || authUser.uid,
          createdByName: existingBooking?.createdByName || userProfile.fullName,
          updatedByUid: authUser.uid,
          updatedByName: userProfile.fullName,
          createdAt: existingBooking?.createdAt || null,
        };

        await updateBooking(editingBookingId, updatedBooking);
      } else {
        const bookingRef = await getNextBookingRefFromFirestore();

        const newBooking = {
          bookingRef,
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
          advanceReceived,
          remainingAmount,
          ...financialFields,
          specialNotes: bookingForm.specialNotes.trim(),
          bookingStatus,
          bookedBy: bookingForm.bookedBy,
          createdByUid: authUser.uid,
          createdByName: userProfile.fullName,
          updatedByUid: authUser.uid,
          updatedByName: userProfile.fullName,
          createdAt: null,
        };

        await createBooking(newBooking);
      }

      closeBookingModal();
    } catch (error) {
      console.error('Save booking error:', error);
      alert(
        `Failed to save booking: ${error.code || ''} ${error.message || ''}`
      );
    }
  }

  function handleEditBooking(booking) {
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
      advanceReceived: booking.advanceReceived || '',
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

  async function handleDeleteBooking(bookingId) {
    const confirmed = window.confirm('Delete this booking?');
    if (!confirmed) return;

    try {
      await removeBooking(bookingId);
    } catch (error) {
      console.error('Delete booking error:', error);
      alert('Failed to delete booking.');
    }
  }

  function handleResetLocalData() {
    alert('Local reset is no longer used after Firestore sync.');
  }

  function renderDashboard() {
    return (
      <>
        <div className="page-actions">
          <div className="page-section-title">Overview</div>
          <button className="header-action-btn" onClick={openNewBookingModal}>
            + New Booking
          </button>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Total Bookings</div>
              <div className="dashboard-card-value">{bookings.length}</div>
            </div>
            <div className="dashboard-card-icon teal">🗓</div>
          </div>

          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Upcoming / Active</div>
              <div className="dashboard-card-value">{upcomingBookings}</div>
            </div>
            <div className="dashboard-card-icon blue">👥</div>
          </div>

          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Packages</div>
              <div className="dashboard-card-value">{packages.length}</div>
            </div>
            <div className="dashboard-card-icon orange">📦</div>
          </div>

          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Total Revenue</div>
              <div className="dashboard-card-value">
                {formatCurrency(totalRevenue)}
              </div>
            </div>
            <div className="dashboard-card-icon green">📈</div>
          </div>

          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Total Expenses</div>
              <div className="dashboard-card-value">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
            <div className="dashboard-card-icon orange">📉</div>
          </div>

          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Total Profit</div>
              <div className="dashboard-card-value">
                {formatCurrency(totalProfit)}
              </div>
            </div>
            <div className="dashboard-card-icon green">💰</div>
          </div>

          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Total Advance</div>
              <div className="dashboard-card-value">
                {formatCurrency(totalAdvance)}
              </div>
            </div>
            <div className="dashboard-card-icon blue">💳</div>
          </div>

          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Outstanding Balance</div>
              <div className="dashboard-card-value">
                {formatCurrency(outstandingBalance)}
              </div>
            </div>
            <div className="dashboard-card-icon orange">⏳</div>
          </div>

          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Profit Margin</div>
              <div className="dashboard-card-value">{profitMargin}%</div>
            </div>
            <div className="dashboard-card-icon green">📊</div>
          </div>

          <div className="dashboard-card">
            <div>
              <div className="dashboard-card-label">Completed Trips</div>
              <div className="dashboard-card-value">{completedTrips}</div>
            </div>
            <div className="dashboard-card-icon teal">✓</div>
          </div>
        </div>

        <div className="dashboard-table-card">
          <div className="dashboard-table-header">
            <h3 className="dashboard-table-title">Recent Bookings</h3>
            <button
              className="dashboard-link"
              type="button"
              onClick={() => setScreen('bookings')}
            >
              View all →
            </button>
          </div>

          <BookingList
            bookings={recentBookings}
            searchTerm=""
            statusFilter="All Status"
            onSearchChange={() => {}}
            onStatusChange={() => {}}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
          />
        </div>
      </>
    );
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
    <div className="app-shell">
      <Sidebar
        screen={screen}
        setScreen={setScreen}
        onResetLocalData={handleResetLocalData}
        bookingCount={bookings.length}
        packageCount={packages.length}
        currentUserName={userProfile.fullName}
        currentUserEmail={userProfile.email}
        onSignOut={handleSignOut}
      />

      <div className="app-main">
        <header className="page-topbar">
          <div className="page-topbar-left">
            <h1 className="page-topbar-title">{pageMeta.title}</h1>
            <p className="page-topbar-subtitle">{pageMeta.subtitle}</p>
          </div>

          <div className="page-topbar-right">
            <div className="live-indicator">
              <span className="live-dot" />
              <span>Live</span>
            </div>

            <div className="topbar-user-chip">
              <span className="topbar-avatar">
                {userProfile.fullName?.trim()?.[0]?.toUpperCase() || 'U'}
              </span>
              <span>{userProfile.fullName || 'User'}</span>
            </div>
          </div>
        </header>

        <div className="page-body">
          {screen === 'dashboard' && renderDashboard()}

          {screen === 'packages' && (
            <>
              <div className="page-actions">
                <div className="page-section-title">All packages</div>
                <button
                  className="header-action-btn"
                  onClick={openNewPackageModal}
                >
                  + Add Package
                </button>
              </div>

              <PackageList
                packages={packages}
                onEdit={handleEditPackage}
                onDelete={handleDeletePackage}
              />
            </>
          )}

          {screen === 'bookings' && (
            <>
              <div className="page-actions">
                <div className="page-section-title">All bookings</div>
                <button
                  className="header-action-btn"
                  onClick={openNewBookingModal}
                >
                  + New Booking
                </button>
              </div>

              <BookingList
                bookings={bookings}
                searchTerm={bookingSearch}
                statusFilter={bookingStatusFilter}
                onSearchChange={setBookingSearch}
                onStatusChange={setBookingStatusFilter}
                onEdit={handleEditBooking}
                onDelete={handleDeleteBooking}
              />
            </>
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
        </div>

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
            onSubmit={handleSaveBooking}
            onClose={closeBookingModal}
          />
        )}

        {viewBooking && (
          <BookingViewModal
            booking={viewBooking}
            onClose={() => setViewBooking(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
