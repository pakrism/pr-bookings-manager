import { resolveBookingStatus } from './bookingStatus';

export const MANAGER_BOOKED_BY_OPTIONS = ['Zohaib', 'Pervaiz'];
export const MANAGER_POOL_IDS = ['zohaib', 'pervaiz'];

const BOOKED_BY_TO_POOL = {
  Zohaib: 'zohaib',
  Pervaiz: 'pervaiz',
};

const SENSITIVE_BOOKING_FIELDS = new Set([
  'packagePrice',
  'totalExpenses',
  'totalProfit',
  'payments',
  'whatsappNumber',
  'auditLog',
  'profitSharePaid',
  'partnerPoolPaid',
]);

export function normalizeUserRole(role) {
  if (role === 'viewer') return 'viewer';
  if (role === 'booking_manager') return 'booking_manager';
  if (role === 'admin') return 'admin';
  return 'admin';
}

export function getRoleLabel(role) {
  if (role === 'viewer') return 'View only';
  if (role === 'booking_manager') return 'Booking Manager';
  return 'Admin';
}

export function getRoleCapabilities(profile) {
  const role = normalizeUserRole(profile?.role);

  return {
    role,
    isAdmin: role === 'admin',
    isBookingManager: role === 'booking_manager',
    isViewer: role === 'viewer',
    canWriteBookings: role === 'admin' || role === 'booking_manager',
    canManagePackages: role === 'admin',
    canViewFinance: role === 'admin' || role === 'booking_manager',
    canManageUsers: role === 'admin',
    canTogglePayouts: role === 'admin',
    canExportFinancials: role === 'admin' || role === 'booking_manager',
    canBulkEditBookings: role === 'admin',
    canDeleteBookings: role === 'admin',
    canViewFinancialFields: role !== 'viewer',
    canViewGuestContact: role !== 'viewer',
    bookedBy: profile?.bookedBy || null,
    poolId: profile?.poolId || null,
  };
}

export function canAccessRoute(path, profile) {
  const role = normalizeUserRole(profile?.role);
  const normalized = path.split('?')[0];

  if (normalized.startsWith('/users')) {
    return role === 'admin';
  }

  if (normalized.startsWith('/finance')) {
    return canAccessFinanceRoute(normalized, profile);
  }

  if (normalized.startsWith('/bookings/new') || normalized.includes('/edit')) {
    return role === 'admin' || role === 'booking_manager';
  }

  if (normalized.startsWith('/packages/new') || normalized.startsWith('/packages/') && normalized.includes('/edit')) {
    return role === 'admin';
  }

  return true;
}

export function canAccessFinanceRoute(path, profile) {
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
  const role = normalizeUserRole(profile?.role);

  if (!normalized.startsWith('/finance')) return true;
  if (role !== 'admin' && role !== 'booking_manager') return false;

  if (role === 'booking_manager') {
    const poolId = getManagerPoolId(profile);
    if (!poolId) return false;
    if (normalized === '/finance') return true;
    return normalized === `/finance/${poolId}`;
  }

  return true;
}

export function getFinanceNavItems(profile) {
  const role = normalizeUserRole(profile?.role);
  const poolId = getManagerPoolId(profile);

  if (role === 'booking_manager' && poolId) {
    return [
      {
        path: `/finance/${poolId}`,
        label: poolId === 'zohaib' ? 'Zohaib pool' : 'Pervaiz pool',
        icon: 'ri-user-line',
      },
    ];
  }

  return [
    { path: '/finance', label: 'Overview', icon: 'ri-dashboard-line', end: true },
    { path: '/finance/zohaib', label: 'Zohaib pool', icon: 'ri-user-line' },
    { path: '/finance/pervaiz', label: 'Pervaiz pool', icon: 'ri-user-line' },
  ];
}

export function getScopedBookings(bookings, profile) {
  const capabilities = getRoleCapabilities(profile);
  if (capabilities.isAdmin) {
    return bookings;
  }

  if (capabilities.isBookingManager && capabilities.bookedBy) {
    return bookings.filter(
      (booking) => (booking.bookedBy || '').trim() === capabilities.bookedBy
    );
  }

  if (capabilities.isViewer) {
    return bookings.filter((booking) => {
      const status = resolveBookingStatus(booking);
      return status === 'Upcoming' || status === 'On-Going';
    });
  }

  return bookings;
}

export function canManagerAccessBooking(booking, profile) {
  const capabilities = getRoleCapabilities(profile);
  if (capabilities.isAdmin) return true;
  if (!capabilities.isBookingManager || !capabilities.bookedBy) return false;
  return (booking?.bookedBy || '').trim() === capabilities.bookedBy;
}

export function canViewBookingField(role, field) {
  const normalizedRole = normalizeUserRole(role);
  if (normalizedRole !== 'viewer') return true;
  return !SENSITIVE_BOOKING_FIELDS.has(field);
}

export function redactBookingForViewer(booking) {
  if (!booking) return booking;

  const redacted = { ...booking };
  for (const field of SENSITIVE_BOOKING_FIELDS) {
    if (field in redacted) {
      if (field === 'payments') {
        redacted.payments = [];
      } else {
        delete redacted[field];
      }
    }
  }
  redacted._profit = null;
  return redacted;
}

export function getManagerPoolId(profile) {
  if (profile?.poolId) return profile.poolId;
  if (profile?.bookedBy && BOOKED_BY_TO_POOL[profile.bookedBy]) {
    return BOOKED_BY_TO_POOL[profile.bookedBy];
  }
  return null;
}

export function getDefaultBookedBy(profile) {
  const capabilities = getRoleCapabilities(profile);
  if (capabilities.isBookingManager && capabilities.bookedBy) {
    return capabilities.bookedBy;
  }
  return '';
}

export function filterScheduleBatches(batches, scopedBookingIds) {
  const idSet = new Set(scopedBookingIds);
  return batches
    .map((batch) => ({
      ...batch,
      bookings: batch.bookings.filter((booking) => idSet.has(booking.id)),
    }))
    .filter((batch) => batch.bookings.length > 0);
}
