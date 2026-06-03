# Pakrism Bookings Manager

Internal booking management app for Pakrism (React + Vite + Firebase Firestore).

## Features

- Dashboard KPIs (revenue, expenses, profit, advance, balance, margin, completed trips)
- Bookings with payment ledger, auto status from travel dates, tour types, and financials
- Package templates, schedule batches, PDF/iCal exports, CSV export, departure reminders
- Firebase Authentication (email/password) for sign-in

## Firebase setup

1. Copy `.env` with your Firebase web config (`VITE_FIREBASE_*`).
2. Deploy Firestore rules from [`firestore.rules`](firestore.rules):

```bash
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

### Access control

- **Sign-in:** Any user with a valid Firebase Auth account can log in.
- **Data:** Firestore rules allow any signed-in user to read and write `bookings`, `packages`, and `counters`.
- **`users/{uid}` documents are optional** and not required for app access.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
