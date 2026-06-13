#!/usr/bin/env bash
set -euo pipefail

# Grants Cloud Build roles needed for Firebase Functions Gen2 deploys.
# Requires: npx firebase-tools login (OAuth token in ~/.config/configstore/firebase-tools.json)

cd "$(dirname "$0")/.."

REFRESH=$(node -pe "JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.config/configstore/firebase-tools.json','utf8')).tokens.refresh_token")
TOKEN=$(curl -sS -X POST https://oauth2.googleapis.com/token \
  -d "client_id=563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com" \
  -d "client_secret=j9iVZfS8kkCEFUPaAeJV0sAi" \
  -d "refresh_token=$REFRESH" \
  -d "grant_type=refresh_token" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).access_token")

PROJECT_NUMBER=$(curl -sS -X POST "https://cloudresourcemanager.googleapis.com/v1/projects/pakrism-bookings:getIamPolicy" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' | node -pe "console.log('709553104809')")

SA="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

curl -sS -X POST "https://cloudresourcemanager.googleapis.com/v1/projects/pakrism-bookings:getIamPolicy" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' > /tmp/iam-policy.json

node <<NODE
const fs = require('fs');
const policy = JSON.parse(fs.readFileSync('/tmp/iam-policy.json', 'utf8'));
const sa = '$SA';
const roles = [
  'roles/cloudbuild.builds.builder',
  'roles/artifactregistry.writer',
  'roles/storage.objectViewer',
  'roles/logging.logWriter',
  'roles/run.admin',
  'roles/iam.serviceAccountUser',
];
for (const role of roles) {
  let binding = policy.bindings.find((b) => b.role === role);
  if (!binding) { binding = { role, members: [] }; policy.bindings.push(binding); }
  if (!binding.members.includes(sa)) binding.members.push(sa);
}
fs.writeFileSync('/tmp/iam-policy-updated.json', JSON.stringify({ policy }));
NODE

curl -sS -X POST "https://cloudresourcemanager.googleapis.com/v1/projects/pakrism-bookings:setIamPolicy" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d @/tmp/iam-policy-updated.json > /dev/null

echo "Granted Cloud Build IAM roles to $SA"
echo "Now run: npx firebase-tools deploy --only functions:parseClientRequirement --project pakrism-bookings"
