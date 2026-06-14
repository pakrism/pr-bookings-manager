const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

const VALID_ROLES = new Set(['admin', 'booking_manager', 'viewer']);
const MANAGER_BOOKED_BY = new Set(['Zohaib', 'Pervaiz']);
const MANAGER_POOL_IDS = new Set(['zohaib', 'pervaiz']);

const { defineSecret } = require('firebase-functions/params');

const openaiApiKey = defineSecret('OPENAI_API_KEY');

const callableOptions = {
  region: 'us-central1',
  cors: [
    'https://pr-bms.netlify.app',
    'https://pr-plan.netlify.app',
    /^http:\/\/localhost(:\d+)?$/,
  ],
};

async function assertSignedIn(context) {
  if (!context.auth?.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const callerDoc = await db.doc(`users/${context.auth.uid}`).get();

  if (!callerDoc.exists || callerDoc.data()?.isActive !== true) {
    throw new HttpsError('permission-denied', 'Your account is not active.');
  }
}

async function assertAdmin(context) {
  if (!context.auth?.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const callerDoc = await db.doc(`users/${context.auth.uid}`).get();
  const role = callerDoc.data()?.role;

  if (!callerDoc.exists || callerDoc.data()?.isActive !== true) {
    throw new HttpsError('permission-denied', 'Your account is not active.');
  }

  if (role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can manage users.');
  }
}

function sanitizeUserPayload(data, { partial = false } = {}) {
  const payload = {};

  if (!partial || data.fullName !== undefined) {
    payload.fullName = String(data.fullName || '').trim();
  }

  if (!partial || data.role !== undefined) {
    const role = String(data.role || 'viewer');
    if (!VALID_ROLES.has(role)) {
      throw new HttpsError('invalid-argument', 'Invalid role.');
    }
    payload.role = role;
  }

  if (!partial || data.isActive !== undefined) {
    payload.isActive = data.isActive !== false;
  }

  const role = payload.role ?? data.role;

  if (role === 'booking_manager') {
    const bookedBy = String(data.bookedBy || '').trim();
    const poolId = String(data.poolId || '').trim();

    if (!MANAGER_BOOKED_BY.has(bookedBy)) {
      throw new HttpsError('invalid-argument', 'Booking managers need bookedBy set to Zohaib or Pervaiz.');
    }

    if (!MANAGER_POOL_IDS.has(poolId)) {
      throw new HttpsError('invalid-argument', 'Booking managers need poolId set to zohaib or pervaiz.');
    }

    payload.bookedBy = bookedBy;
    payload.poolId = poolId;
  } else if (!partial) {
    payload.bookedBy = admin.firestore.FieldValue.delete();
    payload.poolId = admin.firestore.FieldValue.delete();
  } else if (role && role !== 'booking_manager') {
    payload.bookedBy = admin.firestore.FieldValue.delete();
    payload.poolId = admin.firestore.FieldValue.delete();
  }

  return payload;
}

exports.listUsers = onCall(callableOptions, async (request) => {
  await assertAdmin(request);

  const snapshot = await db.collection('users').get();
  return snapshot.docs
    .map((docSnap) => ({
      uid: docSnap.id,
      ...docSnap.data(),
    }))
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')));
});

exports.createUser = onCall(callableOptions, async (request) => {
  await assertAdmin(request);

  const { email, password, sendPasswordReset } = request.data || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new HttpsError('invalid-argument', 'Email is required.');
  }

  if (!sendPasswordReset && (!password || String(password).length < 6)) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.');
  }

  const profile = sanitizeUserPayload(request.data || {});

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: normalizedEmail,
      password: sendPasswordReset ? undefined : String(password),
      displayName: profile.fullName || normalizedEmail,
      disabled: profile.isActive === false,
    });
  } catch (error) {
    throw new HttpsError('already-exists', error.message || 'Could not create auth user.');
  }

  await db.doc(`users/${userRecord.uid}`).set({
    email: normalizedEmail,
    fullName: profile.fullName || '',
    role: profile.role || 'viewer',
    isActive: profile.isActive !== false,
    ...(profile.role === 'booking_manager'
      ? { bookedBy: profile.bookedBy, poolId: profile.poolId }
      : {}),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (sendPasswordReset) {
    const resetLink = await auth.generatePasswordResetLink(normalizedEmail);
    return { uid: userRecord.uid, email: normalizedEmail, resetLink };
  }

  return { uid: userRecord.uid, email: normalizedEmail };
});

exports.updateUser = onCall(callableOptions, async (request) => {
  await assertAdmin(request);

  const { uid } = request.data || {};
  if (!uid) {
    throw new HttpsError('invalid-argument', 'User id is required.');
  }

  const existing = await db.doc(`users/${uid}`).get();
  if (!existing.exists) {
    throw new HttpsError('not-found', 'User not found.');
  }

  const mergedRole = request.data.role ?? existing.data()?.role;
  const profile = sanitizeUserPayload(
    { ...existing.data(), ...request.data, role: mergedRole },
    { partial: true }
  );

  await db.doc(`users/${uid}`).set(
    {
      ...profile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (request.data.isActive === false) {
    await auth.updateUser(uid, { disabled: true });
  } else if (request.data.isActive === true) {
    await auth.updateUser(uid, { disabled: false });
  }

  if (request.data.fullName) {
    await auth.updateUser(uid, { displayName: String(request.data.fullName).trim() });
  }

  return { uid };
});

exports.resetUserPassword = onCall(callableOptions, async (request) => {
  await assertAdmin(request);

  const email = String(request.data?.email || '').trim().toLowerCase();
  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required.');
  }

  const resetLink = await auth.generatePasswordResetLink(email);
  return { resetLink };
});

function buildParserContext(config) {
  const cities = (config?.cities ?? []).map((city) => ({
    id: city.id,
    name: city.name,
    kind: city.kind,
  }));
  const vehicles = (config?.vehicles ?? []).map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    type: vehicle.type,
    capacity: vehicle.capacity,
  }));
  const hotelCategories = (config?.hotelCategories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
  }));
  const hotels = (config?.hotels ?? []).map((hotel) => ({
    id: hotel.id,
    name: hotel.name,
    cityId: hotel.cityId,
    categoryId: hotel.categoryId,
  }));
  const jeepSegments = (config?.jeepSegments ?? []).map((segment) => ({
    id: segment.id,
    name: segment.name,
    cityId: segment.cityId,
  }));
  const entryTickets = (config?.entryTickets ?? []).map((ticket) => ({
    id: ticket.id,
    name: ticket.name,
  }));

  return { cities, vehicles, hotelCategories, hotels, jeepSegments, entryTickets };
}

function normalizeParsedRequirement(raw, context) {
  const warnings = Array.isArray(raw?.warnings) ? [...raw.warnings] : [];
  const cityIds = new Set(context.cities.map((c) => c.id));
  const vehicleIds = new Set(context.vehicles.map((v) => v.id));
  const categoryIds = new Set(context.hotelCategories.map((c) => c.id));
  const hotelIds = new Set(context.hotels.map((h) => h.id));
  const segmentIds = new Set(context.jeepSegments.map((s) => s.id));
  const ticketIds = new Set(context.entryTickets.map((t) => t.id));

  const departureCityId =
    raw?.departureCityId && cityIds.has(raw.departureCityId) ? raw.departureCityId : null;

  const waypointIds = (raw?.waypointIds ?? []).filter((id) => {
    if (!cityIds.has(id)) {
      warnings.push(`Removed unknown stop: ${id}`);
      return false;
    }
    return id !== departureCityId;
  });

  let vehicleId = raw?.vehicleId && vehicleIds.has(raw.vehicleId) ? raw.vehicleId : null;
  const adults = Math.max(Number(raw?.adults) || 4, 1);
  if (!vehicleId && adults >= 15) {
    vehicleId = context.vehicles.find((v) => v.id === 'coaster')?.id
      ?? context.vehicles.find((v) => v.type === 'coaster')?.id
      ?? context.vehicles.find((v) => v.id === 'hiace')?.id
      ?? null;
    if (vehicleId) warnings.push(`Selected large-group vehicle for ${adults} pax`);
  }

  const hotelNights = (raw?.hotelNights ?? [])
    .filter((night) => night?.destinationId && cityIds.has(night.destinationId))
    .map((night) => {
      const categoryId =
        night.categoryId && categoryIds.has(night.categoryId) ? night.categoryId : 'deluxe';
      const hotelId = night.hotelId && hotelIds.has(night.hotelId) ? night.hotelId : undefined;
      return {
        destinationId: night.destinationId,
        categoryId,
        ...(hotelId ? { hotelId } : {}),
        rooms: Math.max(Number(night.rooms) || 1, 1),
        nights: Math.max(Number(night.nights) || 1, 1),
      };
    });

  const jeepSegments = (raw?.jeepSegments ?? [])
    .filter((sel) => sel?.segmentId && segmentIds.has(sel.segmentId))
    .map((sel) => ({
      segmentId: sel.segmentId,
      quantity: Math.max(Number(sel.quantity) || 1, 1),
      ...(sel.days != null ? { days: Math.max(Number(sel.days) || 1, 1) } : {}),
    }));

  const tickets = (raw?.tickets ?? [])
    .filter((sel) => sel?.ticketId && ticketIds.has(sel.ticketId))
    .map((sel) => ({
      ticketId: sel.ticketId,
      quantity: Math.max(Number(sel.quantity) || adults, 1),
    }));

  const tripDays = Math.max(Number(raw?.tripDays) || 7, 1);
  const quoteMode = raw?.quoteMode === 'perPerson' ? 'perPerson' : 'family';

  return {
    packageTitle: String(raw?.packageTitle || 'Northern Pakistan Tour').trim(),
    departureCityId,
    waypointIds,
    vehicleId,
    tripDays,
    adults,
    children: Math.max(Number(raw?.children) || 0, 0),
    hotelNights,
    jeepSegments,
    tickets,
    marginPercent: raw?.marginPercent != null ? Number(raw.marginPercent) : null,
    quoteMode,
    warnings,
  };
}

async function loadPricePlannerConfig() {
  const snap = await db.doc('pricePlanner/config').get();
  return snap.exists ? snap.data() : null;
}

exports.parseClientRequirement = onCall(
  { ...callableOptions, secrets: [openaiApiKey] },
  async (request) => {
    await assertSignedIn(request);

    const text = String(request.data?.text || '').trim();
    if (!text) {
      throw new HttpsError('invalid-argument', 'Client message text is required.');
    }

    const config = await loadPricePlannerConfig();
    const context = buildParserContext(config);

    const systemPrompt = [
      'You extract structured tour package requirements from WhatsApp-style client messages for Pakistan road tours.',
      'Return ONLY valid JSON matching this schema:',
      '{',
      '  "packageTitle": string,',
      '  "departureCityId": string | null,',
      '  "waypointIds": string[],',
      '  "vehicleId": string | null,',
      '  "tripDays": number,',
      '  "adults": number,',
      '  "children": number,',
      '  "hotelNights": [{ "destinationId": string, "categoryId": string, "hotelId": string | null, "rooms": number, "nights": number }],',
      '  "jeepSegments": [{ "segmentId": string, "quantity": number, "days": number | null }],',
      '  "tickets": [{ "ticketId": string, "quantity": number }],',
      '  "marginPercent": number | null,',
      '  "quoteMode": "family" | "perPerson",',
      '  "warnings": string[]',
      '}',
      'Rules:',
      '- tripDays = number of days (not nights). "10 days 9 nights" → tripDays: 10.',
      '- adults = total people/pax when message says "20 people", "20 pax", "family of 20", etc.',
      '- hotelNights[].rooms = rooms per night when message says "8 rooms" or "8 rooms per night".',
      '- Map "5 star", "5-star", luxury → categoryId "executive". Deluxe/standard → "deluxe".',
      '- waypointIds in logical route order (departure → stops). Use stop city ids only.',
      '- Build one hotelNights row per destination stop; split total nights across stops.',
      '- For 15+ adults, prefer coaster or hiace vehicle ids from config.',
      '- Pick hotelId from config when a named hotel matches; otherwise omit hotelId.',
      '- Use ONLY ids from the provided config lists. Add warnings for assumptions.',
      `Allowed config: ${JSON.stringify(context)}`,
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey.value()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpsError('internal', `OpenAI request failed: ${errorText.slice(0, 300)}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (!content) {
      throw new HttpsError('internal', 'OpenAI returned an empty response.');
    }

    try {
      const parsed = JSON.parse(content);
      return normalizeParsedRequirement(parsed, context);
    } catch {
      throw new HttpsError('internal', 'OpenAI returned invalid JSON.');
    }
  },
);
