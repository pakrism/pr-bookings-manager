export type UserRole = 'admin' | 'viewer';

export type BookingPayment = {
  id: string;
  amount: number;
  paidAt: string;
  note?: string;
};

export type BookingAuditEntry = {
  at: string;
  byUid: string;
  byName: string;
  action: 'created' | 'updated';
  summary: string;
};

export type Booking = {
  id?: string;
  bookingRef?: string;
  guestName?: string;
  whatsappNumber?: string;
  packageTemplateId?: string;
  packageName?: string;
  destination?: string;
  duration?: string;
  type?: string;
  inclusionsText?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  departureCity?: string;
  transport?: string;
  accommodation?: string;
  adults?: number;
  children?: number;
  infants?: number;
  groupType?: string;
  groupTypeNote?: string;
  packagePrice?: number;
  advanceReceived?: number;
  remainingAmount?: number;
  payments?: BookingPayment[];
  totalExpenses?: number | null;
  totalProfit?: number | null;
  specialNotes?: string;
  bookingStatus?: string;
  bookedBy?: string;
  auditLog?: BookingAuditEntry[];
  createdByUid?: string;
  createdByName?: string;
  updatedByUid?: string;
  updatedByName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type UserProfile = {
  uid: string;
  fullName?: string;
  email?: string;
  isActive?: boolean;
  role?: UserRole;
};
