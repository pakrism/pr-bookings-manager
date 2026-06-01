export const packageTypes = [
  'Group',
  'Private Tour',
  'Honeymoon',
  'Corporate',
  'Custom',
];

export const transportOptions = [
  'Airblue',
  'PIA',
  'PIA + Airblue',
  'By Road',
  'By Road (Private)',
  'Flight + Road',
];

export const AUTO_BOOKING_STATUSES = ['Upcoming', 'On-Going', 'Completed'];

export const MANUAL_BOOKING_STATUSES = ['Cancelled', 'Refunded'];

export const BOOKING_STATUSES = [
  ...AUTO_BOOKING_STATUSES,
  ...MANUAL_BOOKING_STATUSES,
];

export const BOOKING_TOUR_TYPES = ['Group Tour', 'Private Tour'];

export const BOOKED_BY_OPTIONS = ['Zohaib', 'Pervaiz', 'Admin', 'Other'];

export const PARTNERS = ['Zohaib', 'Pervaiz'];
export const PARTNER_SHARE_COUNT = 2;

export const DEPARTURE_REMINDER_DAYS = 7;

export const groupTypes = [
  'Solo',
  'Couple',
  'Males',
  'Females',
  'Family',
  'Group',
  'Other',
];

export const emptyPackageForm = {
  name: '',
  destination: '',
  duration: '',
  type: 'Group',
  pricePerPerson: '',
  imageUrl: '',
  inclusionsText: '',
  isActive: true,
};

export const emptyBookingForm = {
  guestName: '',
  whatsappNumber: '',
  packageTemplateId: '',
  packageName: '',
  destination: '',
  duration: '',
  type: 'Group Tour',
  inclusionsText: '',
  travelStartDate: '',
  travelEndDate: '',
  departureCity: '',
  transport: '',
  accommodation: '',
  adults: 1,
  children: 0,
  infants: 0,
  groupType: 'Solo',
  groupTypeNote: '',
  packagePrice: '',
  packagePriceTouched: false,
  payments: [],
  totalExpenses: '',
  totalProfit: '',
  specialNotes: '',
  statusOverride: '',
  bookedBy: '',
};
