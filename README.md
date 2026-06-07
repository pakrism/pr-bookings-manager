# Pakrism Bookings Manager

Internal booking management app for Pakrism (React + Vite + Firebase Firestore).

## Features

- Dashboard KPIs (revenue, expenses, profit, advance, balance, margin, completed trips)
- Bookings with payment ledger, auto status from travel dates, tour types, and financials
- Package templates, schedule batches, PDF/iCal exports, CSV export, departure reminders
- Finance page with Overview and per-partner (Zohaib / Pervaiz) tabs
- Role-based access: `admin`, `booking_manager`, `viewer`
- Admin Users page backed by Firebase Cloud Functions

## Firebase setup

Firebase config is **hardcoded** in [`src/lib/firebase.js`](src/lib/firebase.js) for the `pakrism-bookings` project, so the app runs on StackBlitz and similar environments without a `.env` file.

Deploy Firestore rules and Cloud Functions:

```bash
firebase deploy --only firestore:rules,functions --project pakrism-bookings
```

Install function dependencies first:

```bash
cd functions && npm install && cd ..
```

### User roles

Add to each document in `users/{uid}` (or use the in-app **Users** page as admin):

| Role | Access |
|------|--------|
| `admin` | Full access; manage users, packages, all bookings, finance |
| `booking_manager` | Own bookings (`bookedBy`); create/edit own bookings; finance limited to assigned profit pool |
| `viewer` | Read-only operational views (bookings, schedule, packages); no revenue/profit/payments |

Required fields on every user doc:

- `isActive: true` (required for access)
- `role: "admin" | "booking_manager" | "viewer"` (omit `role` defaults to admin in the app)

Booking manager accounts also need:

- `bookedBy: "Zohaib" | "Pervaiz"`
- `poolId: "zohaib" | "pervaiz"`

User creation and updates go through Cloud Functions (`createUser`, `updateUser`, `listUsers`, `resetUserPassword`). Client writes to `users/{uid}` are blocked in Firestore rules.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
