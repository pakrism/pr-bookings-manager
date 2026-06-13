#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Deploying Firestore rules to pakrism-bookings..."
echo "If this fails, run: npx firebase-tools login"
echo ""

npm run deploy:rules

echo ""
echo "Done. Verify in Firebase Console → Firestore → Rules"
echo "Look for: match /pricePlanner/{doc}"
