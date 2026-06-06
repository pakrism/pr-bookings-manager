import { PARTNERS, PARTNER_SHARE_COUNT } from '../data/constants';
import {
  PROFIT_POOLS,
  POOL_IDS,
  getShareKey,
  getAllRecipientConfigs,
} from '../data/profitPools';
import { getBookingProfit } from './bookingFinancials';

export function getBookingProfitTotal(booking) {
  return getBookingProfit(booking);
}

export function buildDefaultProfitSharePaid() {
  const paid = {};
  for (const { shareKey } of getAllRecipientConfigs()) {
    paid[shareKey] = false;
  }
  return paid;
}

export function normalizeProfitSharePaid(stored) {
  const defaults = buildDefaultProfitSharePaid();
  if (!stored || typeof stored !== 'object') {
    return defaults;
  }
  return { ...defaults, ...stored };
}

export function buildDefaultPartnerPoolPaid() {
  return { zohaib: false, pervaiz: false };
}

export function normalizePartnerPoolPaid(stored) {
  const defaults = buildDefaultPartnerPoolPaid();
  if (!stored || typeof stored !== 'object') {
    return defaults;
  }
  return { ...defaults, ...stored };
}

export function isPartnerPoolPaid(booking, poolId) {
  const paid = normalizePartnerPoolPaid(booking?.partnerPoolPaid);
  return Boolean(paid[poolId]);
}

export function isProfitSharePaid(booking, shareKey) {
  const paid = normalizeProfitSharePaid(booking?.profitSharePaid);
  return Boolean(paid[shareKey]);
}

export function getProfitPoolAmount(booking, poolId) {
  const profit = getBookingProfitTotal(booking);
  if (profit == null) return null;
  if (!POOL_IDS.includes(poolId)) return null;
  return profit / PARTNER_SHARE_COUNT;
}

/** @deprecated Use getProfitPoolAmount; kept for top-level 50% display */
export function getPartnerShareAmount(booking) {
  return getProfitPoolAmount(booking, 'zohaib');
}

export function getProfitDistribution(booking) {
  const profit = getBookingProfitTotal(booking);
  if (profit == null) return [];

  const paidMap = normalizeProfitSharePaid(booking?.profitSharePaid);
  const rows = [];

  for (const poolId of POOL_IDS) {
    const pool = PROFIT_POOLS[poolId];
    const poolAmount = profit / PARTNER_SHARE_COUNT;

    for (const recipient of pool.recipients) {
      const shareKey = getShareKey(poolId, recipient.key);
      const amount = (poolAmount * recipient.percent) / 100;
      rows.push({
        poolId,
        poolLabel: pool.label,
        recipientKey: recipient.key,
        label: recipient.label,
        percentOfPool: recipient.percent,
        shareKey,
        amount,
        paid: Boolean(paidMap[shareKey]),
      });
    }
  }

  return rows;
}

export function getPartnerShares(booking) {
  return PARTNERS.map((partner) => {
    const poolId = partner.toLowerCase();
    return {
      partner,
      amount: getProfitPoolAmount(booking, poolId),
    };
  });
}

export function getPoolTotals(bookings) {
  const totals = {};
  for (const poolId of POOL_IDS) {
    totals[poolId] = bookings.reduce((sum, booking) => {
      const amount = getProfitPoolAmount(booking, poolId);
      return sum + (amount ?? 0);
    }, 0);
  }
  return totals;
}

export function getRecipientTotals(bookings) {
  const configs = getAllRecipientConfigs();
  const totals = {};

  for (const config of configs) {
    totals[config.shareKey] = {
      shareKey: config.shareKey,
      poolId: config.poolId,
      recipientKey: config.recipientKey,
      label: config.label,
      total: 0,
      paidTotal: 0,
      unpaidTotal: 0,
      paidCount: 0,
      unpaidCount: 0,
    };
  }

  for (const booking of bookings) {
    const distribution = getProfitDistribution(booking);
    for (const row of distribution) {
      const entry = totals[row.shareKey];
      if (!entry) continue;
      entry.total += row.amount;
      if (row.paid) {
        entry.paidTotal += row.amount;
        entry.paidCount += 1;
      } else {
        entry.unpaidTotal += row.amount;
        entry.unpaidCount += 1;
      }
    }
  }

  return totals;
}

export function sumPartnerShares(bookings, partnerName) {
  const poolId = partnerName?.toLowerCase();
  return bookings.reduce((sum, booking) => {
    const amount = getProfitPoolAmount(booking, poolId);
    return sum + (amount ?? 0);
  }, 0);
}

export function filterDistributionByPool(distribution, poolId) {
  if (!poolId) return distribution;
  return distribution.filter((row) => row.poolId === poolId);
}

export function getRecipientTotalsForPool(recipientTotals, poolId) {
  const filtered = {};
  for (const [key, value] of Object.entries(recipientTotals || {})) {
    if (value.poolId === poolId) {
      filtered[key] = value;
    }
  }
  return filtered;
}

export function getPoolPaidSummary(recipientTotals, poolId) {
  const poolEntries = Object.values(getRecipientTotalsForPool(recipientTotals, poolId));
  return poolEntries.reduce(
    (acc, entry) => ({
      paidTotal: acc.paidTotal + entry.paidTotal,
      unpaidTotal: acc.unpaidTotal + entry.unpaidTotal,
    }),
    { paidTotal: 0, unpaidTotal: 0 }
  );
}

export function getPartnerPoolTotals(bookings) {
  const totals = {};
  for (const poolId of POOL_IDS) {
    totals[poolId] = {
      total: 0,
      paidTotal: 0,
      unpaidTotal: 0,
      paidCount: 0,
      unpaidCount: 0,
    };
  }

  for (const booking of bookings) {
    for (const poolId of POOL_IDS) {
      const amount = getProfitPoolAmount(booking, poolId);
      if (amount == null) continue;
      const entry = totals[poolId];
      entry.total += amount;
      if (isPartnerPoolPaid(booking, poolId)) {
        entry.paidTotal += amount;
        entry.paidCount += 1;
      } else {
        entry.unpaidTotal += amount;
        entry.unpaidCount += 1;
      }
    }
  }

  return totals;
}

export { getAllRecipientConfigs, getShareKey };
