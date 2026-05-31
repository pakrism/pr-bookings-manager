const MAX_AUDIT_ENTRIES = 20;

export function buildAuditEntry({
  action,
  byUid,
  byName,
  summary,
}) {
  return {
    at: new Date().toISOString(),
    byUid: byUid || '',
    byName: byName || '',
    action,
    summary: summary || '',
  };
}

export function appendAuditLog(existingLog, entry) {
  const log = Array.isArray(existingLog) ? [...existingLog] : [];
  log.unshift(entry);
  return log.slice(0, MAX_AUDIT_ENTRIES);
}

export function buildBookingAuditSummary(previous, next) {
  const parts = [];

  if (previous?.bookingStatus !== next?.bookingStatus) {
    parts.push(`Status → ${next.bookingStatus}`);
  }

  if (Number(previous?.packagePrice) !== Number(next?.packagePrice)) {
    parts.push(`Price → ${next.packagePrice}`);
  }

  if (Number(previous?.remainingAmount) !== Number(next?.remainingAmount)) {
    parts.push(`Balance → ${next.remainingAmount}`);
  }

  return parts.length ? parts.join('; ') : 'Booking updated';
}
