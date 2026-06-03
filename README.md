# Pakrism Bookings Manager

Internal booking management app for Pakrism (React + Vite + Firebase Firestore).

## Features

- Dashboard KPIs (revenue, expenses, profit, advance, balance, margin, completed trips)
- Bookings with payment ledger, auto status from travel dates, tour types, and financials
- Package templates, schedule batches, PDF/iCal exports, CSV export, departure reminders
- Revenue page with Overview and per-partner (Zohaib / Pervaiz) tabs
- Role-based access: `admin` (full) vs `viewer` (read-only)

## Firebase setup

Firebase config is **hardcoded** in [`src/lib/firebase.js`](src/lib/firebase.js) for the `pakrism-bookings` project, so the app runs on StackBlitz and similar environments without a `.env` file.

Deploy Firestore rules from [`firestore.rules`](firestore.rules):

```bash
firebase deploy --only firestore:rules --project pakrism-bookings
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
