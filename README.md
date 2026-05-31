# Pakrism Bookings Manager

Internal booking management app for Pakrism (React + Vite + Firebase Firestore).

## Features

- Dashboard KPIs (revenue, expenses, profit, advance, balance, margin, completed trips)
- Bookings with payment ledger, auto status from travel dates, tour types, and financials
- Package templates, schedule batches, PDF/iCal exports, CSV export, departure reminders
- Role-based access: `admin` (full) vs `viewer` (read-only)

## Firebase setup

1. Copy `.env` with your Firebase web config.
2. Deploy Firestore rules from [`firestore.rules`](firestore.rules):

```bash
firebase deploy --only firestore:rules
```

### User roles

Add to each document in `users/{uid}`:

- `isActive: true` (required for access)
- `role: "admin"` or `role: "viewer"` (omit `role` defaults to admin in the app)

Viewers can browse data but cannot create, edit, or delete bookings/packages.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
