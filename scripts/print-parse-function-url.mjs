#!/usr/bin/env node
/**
 * Prints parseClientRequirement callable URLs for Netlify env setup.
 */
import { execSync } from 'node:child_process';

const raw = execSync(
  'npx firebase-tools functions:list --project pakrism-bookings --json',
  { encoding: 'utf8', cwd: new URL('..', import.meta.url).pathname },
);
const fn = JSON.parse(raw).result?.find((f) => f.id === 'parseClientRequirement');
if (!fn) {
  console.error('parseClientRequirement not found');
  process.exit(1);
}

console.log('cloudfunctions.net:', fn.uri);
console.log('');
console.log('Set on Netlify (then redeploy):');
console.log(`VITE_PARSE_REQUIREMENT_URL=${fn.uri}`);
console.log('');
console.log('Or fetch Cloud Run URL:');
console.log('  gcloud run services describe parseclientrequirement --region=us-central1 --project=pakrism-bookings --format="value(status.url)"');
