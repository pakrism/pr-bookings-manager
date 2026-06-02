export const PROFIT_POOLS = {
  zohaib: {
    id: 'zohaib',
    label: 'Zohaib pool',
    recipients: [
      { key: 'zohaib', label: 'Zohaib', percent: 55 },
      { key: 'fawad', label: 'Fawad', percent: 35 },
      { key: 'sohaib', label: 'Sohaib', percent: 10 },
    ],
  },
  pervaiz: {
    id: 'pervaiz',
    label: 'Pervaiz pool',
    recipients: [
      { key: 'mrs_pervaiz', label: 'Mrs Pervaiz', percent: 20 },
      { key: 'aahid', label: 'Aahid', percent: 5 },
      { key: 'skardu_expenses', label: 'Skardu Expenses', percent: 15 },
      { key: 'pervaiz', label: 'Pervaiz', percent: 60 },
    ],
  },
};

export const POOL_IDS = Object.keys(PROFIT_POOLS);

export function getShareKey(poolId, recipientKey) {
  return `${poolId}:${recipientKey}`;
}

export function getAllRecipientConfigs() {
  const list = [];
  for (const pool of Object.values(PROFIT_POOLS)) {
    for (const recipient of pool.recipients) {
      list.push({
        poolId: pool.id,
        poolLabel: pool.label,
        recipientKey: recipient.key,
        label: recipient.label,
        percent: recipient.percent,
        shareKey: getShareKey(pool.id, recipient.key),
      });
    }
  }
  return list;
}
