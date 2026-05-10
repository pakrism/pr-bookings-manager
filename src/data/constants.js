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

export const BOOKING_STATUSES = [
  'Upcoming',
  'On-Going',
  'Completed',
  'Cancelled',
  'Refunded',
];

export const BOOKED_BY_OPTIONS = ['Zohaib', 'Pervaiz', 'Admin', 'Other'];

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
  type: 'Group',
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
  advanceReceived: '',
  specialNotes: '',
  bookingStatus: 'Upcoming',
  bookedBy: '',
};
