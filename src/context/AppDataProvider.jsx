import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { AppDataContext, useAppData } from './AppDataContext';
import { db } from '../lib/firebase';
import { emptyBookingForm, emptyPackageForm } from '../data/constants';
import { getNextBookingRef, totalPersons } from '../utils/helpers';
import { syncFinancials } from '../utils/bookingFinancials';
import { computeBookingStatus } from '../utils/bookingStatus';
import { toFormTourType } from '../utils/tourType';
import { getBookingSyncPatch } from '../utils/bookingSync';
import {
  emptyPaymentRow,
  emptyLedgerRow,
  getPaymentsFromBooking,
  normalizeFormPayments,
  computeFinancialsFromLedger,
} from '../utils/payments';
import {
  appendAuditLog,
  buildAuditEntry,
  buildBookingAuditSummary,
} from '../utils/auditLog';
import { downloadBookingsCsv } from '../utils/exportBookingsCsv';
import { prepareBookingsForList, filterBookingsByTravelPreset, filterBookingsByBookedBy } from '../utils/bookingFilters';
import { filterBookingsByStatusTab } from '../utils/bookingStatusCounts';
import { normalizeProfitSharePaid, normalizePartnerPoolPaid } from '../utils/partnerProfit';
import {
  getRoleCapabilities,
  getScopedBookings,
  canManagerAccessBooking,
  getDefaultBookedBy,
} from '../utils/accessControl';
import {
  subscribeToPackages,
  subscribeToBookings,
  createPackage,
  updatePackage,
  removePackage,
  createBooking,
  updateBooking,
  removeBooking,
} from '../lib/firestore';

export function AppDataProvider({ authUser, userProfile, children }) {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [bookingForm, setBookingForm] = useState({
    ...emptyBookingForm,
    payments: [emptyPaymentRow()],
  });
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusTab, setBookingStatusTab] = useState('All');
  const [bookingDatePreset, setBookingDatePreset] = useState('all_dates');
  const [bookingTravelMonth, setBookingTravelMonth] = useState('');
  const [bookingCustomStart, setBookingCustomStart] = useState('');
  const [bookingCustomEnd, setBookingCustomEnd] = useState('');
  const [bookingBookedByFilter, setBookingBookedByFilter] = useState('all');
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [toast, setToast] = useState(null);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [quickUpdateBooking, setQuickUpdateBooking] = useState(null);

  const bookingSyncStarted = useRef(false);
  const isBookingFormOpenRef = useRef(false);

  const capabilities = useMemo(
    () => getRoleCapabilities(userProfile),
    [userProfile]
  );
  const isAdmin = capabilities.isAdmin;
  const scopedBookings = useMemo(
    () => getScopedBookings(bookings, userProfile),
    [bookings, userProfile]
  );

  useEffect(() => {
    if (capabilities.isBookingManager && capabilities.bookedBy) {
      setBookingBookedByFilter(capabilities.bookedBy);
    }
  }, [capabilities.isBookingManager, capabilities.bookedBy]);

  useEffect(() => {
    isBookingFormOpenRef.current =
      window.location.pathname.includes('/bookings/new') ||
      window.location.pathname.includes('/edit');
  });

  function showToast(message, type = 'success') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const unsubPackages = subscribeToPackages(setPackages);
    const unsubBookings = subscribeToBookings(setBookings);
    return () => {
      unsubPackages();
      unsubBookings();
      bookingSyncStarted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!bookings.length) return undefined;
    if (isBookingFormOpenRef.current) return undefined;

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
  }, [bookings]);

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
      bookedBy: getDefaultBookedBy(userProfile),
    });
    setEditingBookingId(null);
  }

  function getSuggestedPackagePrice(form = bookingForm) {
    const selectedPackage = packages.find((item) => item.id === form.packageTemplateId);
    if (!selectedPackage) return 0;
    return Number(selectedPackage.pricePerPerson || 0) * totalPersons(form);
  }

  function loadBookingIntoForm(booking) {
    const payments = getPaymentsFromBooking(booking).map((payment) => ({
      id: payment.id,
      type: payment.type || 'credit',
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
      specialNotes: booking.specialNotes || '',
      statusOverride: ['Cancelled', 'Refunded'].includes(booking.bookingStatus)
        ? booking.bookingStatus
        : '',
      bookedBy: booking.bookedBy || '',
    });
  }

  function loadPackageIntoForm(packageItem) {
    setEditingPackageId(packageItem.id);
    setPackageForm({
      name: packageItem.name || '',
      destination: packageItem.destination || '',
      duration: packageItem.duration || '',
      type: packageItem.type || 'Group',
      pricePerPerson: packageItem.pricePerPerson || '',
      imageUrl: packageItem.imageUrl || '',
      inclusionsText: packageItem.inclusionsText || '',
      isActive: typeof packageItem.isActive === 'boolean' ? packageItem.isActive : true,
    });
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
      if (name === 'packagePrice') next = { ...next, packagePriceTouched: true };
      if (['adults', 'children', 'infants'].includes(name) && !next.packagePriceTouched) {
        const suggested = getSuggestedPackagePrice(next);
        if (suggested > 0) next = { ...next, packagePrice: String(suggested) };
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

  function handleAddPayment(type = 'credit') {
    setBookingForm((prev) => ({
      ...prev,
      payments: [...(prev.payments || []), emptyLedgerRow(type)],
    }));
  }

  function handleRemovePayment(index) {
    setBookingForm((prev) => ({
      ...prev,
      payments: (prev.payments || []).filter((_, i) => i !== index),
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
    event?.preventDefault?.();
    if (!capabilities.canManagePackages) {
      showToast('You do not have permission to manage packages.', 'error');
      return;
    }
    if (!packageForm.name.trim()) {
      showToast('Please enter package name.', 'error');
      return;
    }
    if (!packageForm.destination.trim()) {
      showToast('Please enter location.', 'error');
      return;
    }

    const existingPackage = packages.find((item) => item.id === editingPackageId);
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
      resetPackageForm();
      navigate('/packages');
      showToast(editingPackageId ? 'Package updated.' : 'Package created.');
    } catch (error) {
      console.error('Save package error:', error);
      showToast(`Failed to save package: ${error.message || ''}`, 'error');
    }
  }

  async function handleSaveBooking(event) {
    event?.preventDefault?.();
    if (!capabilities.canWriteBookings) {
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
    if (!bookingForm.travelStartDate || !bookingForm.travelEndDate) {
      showToast('Please select travel dates.', 'error');
      return;
    }

    const packagePrice = Number(bookingForm.packagePrice || 0);
    const payments = normalizeFormPayments(bookingForm.payments);
    const bookingStatus = bookingForm.statusOverride
      ? bookingForm.statusOverride
      : computeBookingStatus(bookingForm.travelStartDate, bookingForm.travelEndDate);
    const ledgerFinancials = computeFinancialsFromLedger(
      packagePrice,
      payments,
      bookingStatus
    );
    const advanceReceived = ledgerFinancials.totalPaid;
    const remainingAmount = ledgerFinancials.balanceDue;
    const financialFields = payments.length
      ? {
          totalExpenses: ledgerFinancials.totalExpenses,
          totalProfit: ledgerFinancials.totalProfit,
        }
      : { totalExpenses: null, totalProfit: null };

    const existingBooking = bookings.find((item) => item.id === editingBookingId);
    if (
      editingBookingId &&
      capabilities.isBookingManager &&
      existingBooking &&
      !canManagerAccessBooking(existingBooking, userProfile)
    ) {
      showToast('You can only edit your own bookings.', 'error');
      return;
    }

    const bookedBy = capabilities.isBookingManager
      ? capabilities.bookedBy
      : bookingForm.bookedBy;

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
      bookedBy,
      updatedByUid: authUser.uid,
      updatedByName: userProfile.fullName,
    };

    setIsSavingBooking(true);
    try {
      if (editingBookingId) {
        const updatedBooking = {
          bookingRef: existingBooking?.bookingRef || '',
          ...bookingPayload,
          profitSharePaid: normalizeProfitSharePaid(existingBooking?.profitSharePaid),
          partnerPoolPaid: normalizePartnerPoolPaid(existingBooking?.partnerPoolPaid),
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
        navigate(`/bookings/${editingBookingId}`);
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
        navigate('/bookings');
      }
      resetBookingForm();
    } catch (error) {
      console.error('Save booking error:', error);
      showToast(`Failed to save booking: ${error.message || ''}`, 'error');
    } finally {
      setIsSavingBooking(false);
    }
  }

  async function handleToggleProfitSharePaid(bookingId, shareKey, paid) {
    if (!capabilities.canTogglePayouts) {
      showToast('You do not have permission to update payouts.', 'error');
      return;
    }
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return;
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
      showToast(paid ? 'Marked as paid.' : 'Marked as unpaid.');
    } catch (error) {
      showToast('Failed to update payout status.', 'error');
    }
  }

  async function handleTogglePartnerPoolPaid(bookingId, poolId, paid) {
    if (!capabilities.canTogglePayouts) {
      showToast('You do not have permission to update payouts.', 'error');
      return;
    }
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return;
    const partnerPoolPaid = {
      ...normalizePartnerPoolPaid(booking.partnerPoolPaid),
      [poolId]: paid,
    };
    try {
      await updateBooking(bookingId, {
        partnerPoolPaid,
        updatedByUid: authUser.uid,
        updatedByName: userProfile.fullName,
      });
      showToast(paid ? 'Partner share marked as paid.' : 'Partner share marked as unpaid.');
    } catch (error) {
      showToast('Failed to update partner payout status.', 'error');
    }
  }

  async function handleBulkUpdatePayouts({
    bookingIds,
    shareKeys = [],
    includePartnerPool = false,
    poolId,
    paid,
  }) {
    if (!capabilities.canTogglePayouts) {
      showToast('You do not have permission to update payouts.', 'error');
      return { successCount: 0, failCount: 0 };
    }

    const targets = bookingIds
      .map((id) => bookings.find((item) => item.id === id))
      .filter(Boolean);

    const results = await Promise.all(
      targets.map(async (booking) => {
        const profitSharePaid = { ...normalizeProfitSharePaid(booking.profitSharePaid) };
        for (const shareKey of shareKeys) {
          profitSharePaid[shareKey] = paid;
        }

        const patch = {
          profitSharePaid,
          updatedByUid: authUser.uid,
          updatedByName: userProfile.fullName,
        };

        if (includePartnerPool && poolId) {
          patch.partnerPoolPaid = {
            ...normalizePartnerPoolPaid(booking.partnerPoolPaid),
            [poolId]: paid,
          };
        }

        try {
          await updateBooking(booking.id, patch);
          return true;
        } catch {
          return false;
        }
      })
    );

    const successCount = results.filter(Boolean).length;
    const failCount = results.length - successCount;

    if (failCount > 0) {
      showToast(`Updated ${successCount} bookings; ${failCount} failed.`, 'error');
    } else if (successCount > 0) {
      showToast(
        paid
          ? `Marked ${successCount} booking${successCount === 1 ? '' : 's'} as paid.`
          : `Marked ${successCount} booking${successCount === 1 ? '' : 's'} as unpaid.`
      );
    }

    return { successCount, failCount };
  }

  function requestDeleteBooking(bookingId) {
    if (!capabilities.canDeleteBookings) {
      showToast('You do not have permission to delete bookings.', 'error');
      return;
    }
    setConfirmDialog({
      title: 'Delete booking',
      message: 'Are you sure you want to delete this booking? This cannot be undone.',
      onConfirm: async () => {
        try {
          await removeBooking(bookingId);
          showToast('Booking deleted.');
          navigate('/bookings');
        } catch (error) {
          showToast('Failed to delete booking.', 'error');
        }
        setConfirmDialog(null);
      },
    });
  }

  function requestDeletePackage(packageId) {
    if (!capabilities.canManagePackages) {
      showToast('You do not have permission to delete packages.', 'error');
      return;
    }
    const linkedBookings = bookings.filter((b) => b.packageTemplateId === packageId);
    if (linkedBookings.length) {
      showToast('This package is linked with bookings and cannot be deleted.', 'error');
      return;
    }
    setConfirmDialog({
      title: 'Delete package',
      message: 'Are you sure you want to delete this package?',
      onConfirm: async () => {
        try {
          await removePackage(packageId);
          showToast('Package deleted.');
          navigate('/packages');
        } catch (error) {
          showToast('Failed to delete package.', 'error');
        }
        setConfirmDialog(null);
      },
    });
  }

  function handleExportBookingsCsv() {
    if (!capabilities.canExportFinancials) {
      showToast('You do not have permission to export financial data.', 'error');
      return;
    }
    let list = filterBookingsByStatusTab(scopedBookings, bookingStatusTab);
    list = prepareBookingsForList(list, {
      searchTerm: bookingSearch,
      statusFilter: 'All Status',
      sortKey: 'departure_desc',
    });
    list = filterBookingsByTravelPreset(list, {
      preset: bookingDatePreset,
      monthKey: bookingTravelMonth,
      customStart: bookingCustomStart,
      customEnd: bookingCustomEnd,
    });
    list = filterBookingsByBookedBy(list, bookingBookedByFilter);
    downloadBookingsCsv(list);
    showToast('Bookings CSV downloaded.');
  }

  function navigateToBooking(booking) {
    navigate(`/bookings/${booking.id}`);
  }

  function navigateToEditBooking(booking) {
    if (!capabilities.canWriteBookings) {
      showToast('You have read-only access.', 'error');
      return;
    }
    if (capabilities.isBookingManager && !canManagerAccessBooking(booking, userProfile)) {
      showToast('You can only edit your own bookings.', 'error');
      return;
    }
    loadBookingIntoForm(booking);
    navigate(`/bookings/${booking.id}/edit`);
  }

  const value = {
    authUser,
    userProfile,
    capabilities,
    isAdmin,
    scopedBookings,
    packages,
    bookings,
    packageForm,
    bookingForm,
    editingPackageId,
    editingBookingId,
    bookingSearch,
    setBookingSearch,
    bookingStatusTab,
    setBookingStatusTab,
    bookingDatePreset,
    setBookingDatePreset,
    bookingTravelMonth,
    setBookingTravelMonth,
    bookingCustomStart,
    setBookingCustomStart,
    bookingCustomEnd,
    setBookingCustomEnd,
    bookingBookedByFilter,
    setBookingBookedByFilter,
    isSavingBooking,
    toast,
    showRemindersModal,
    setShowRemindersModal,
    confirmDialog,
    setConfirmDialog,
    quickUpdateBooking,
    setQuickUpdateBooking,
    showToast,
    resetPackageForm,
    resetBookingForm,
    loadBookingIntoForm,
    loadPackageIntoForm,
    handlePackageInputChange,
    handleBookingInputChange,
    handlePaymentChange,
    handleAddPayment,
    handleRemovePayment,
    handleBookingPackageChange,
    handleSavePackage,
    handleSaveBooking,
    handleToggleProfitSharePaid,
    handleTogglePartnerPoolPaid,
    handleBulkUpdatePayouts,
    requestDeleteBooking,
    requestDeletePackage,
    handleExportBookingsCsv,
    navigateToBooking,
    navigateToEditBooking,
    navigate,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useBookingFromParams() {
  const { id } = useParams();
  const { bookings } = useAppData();
  return useMemo(() => bookings.find((b) => b.id === id), [bookings, id]);
}
