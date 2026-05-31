import { BOOKING_TOUR_TYPES } from '../data/constants';

export function normalizeBookingTourType(value) {
  if (value === 'Group' || value === 'Group Tour') return 'Group Tour';
  if (value === 'Private Tour' || value === 'Private') return 'Private Tour';
  return value || '-';
}

export function toFormTourType(value) {
  const normalized = normalizeBookingTourType(value);
  if (BOOKING_TOUR_TYPES.includes(normalized)) {
    return normalized;
  }
  return 'Group Tour';
}
