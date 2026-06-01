import { PARTNERS, PARTNER_SHARE_COUNT } from '../data/constants';
import { getBookingProfit } from './bookingFinancials';

export function getBookingProfitTotal(booking) {
  return getBookingProfit(booking);
}

export function getPartnerShareAmount(booking) {
  const profit = getBookingProfitTotal(booking);
  if (profit == null) return null;
  return profit / PARTNER_SHARE_COUNT;
}

export function getPartnerShares(booking) {
  const share = getPartnerShareAmount(booking);
  return PARTNERS.map((partner) => ({
    partner,
    amount: share,
  }));
}

export function sumPartnerShares(bookings, partnerName) {
  return bookings.reduce((sum, booking) => {
    const share = getPartnerShareAmount(booking);
    return sum + (share ?? 0);
  }, 0);
}
