#!/usr/bin/env node
/**
 * Seeds pricePlanner/config from pakrism-price-planner seedConfig.
 * Requires: npx firebase-tools login
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plannerRoot = path.resolve(__dirname, '../../pakrism-price-planner');

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  return {
    mapValue: {
      fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toFirestoreValue(v)])),
    },
  };
}

function getAccessToken() {
  const configPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
  const refreshToken = JSON.parse(fs.readFileSync(configPath, 'utf8')).tokens?.refresh_token;
  if (!refreshToken) throw new Error('Run: npx firebase-tools login');

  const body = new URLSearchParams({
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }).toString();

  const raw = execSync(
    `curl -sS -X POST https://oauth2.googleapis.com/token -d ${JSON.stringify(body)}`,
    { encoding: 'utf8' },
  );
  return JSON.parse(raw).access_token;
}

function loadSeedConfig() {
  const tsPath = path.join(plannerRoot, 'src/data/seedConfig.ts');
  const src = fs
    .readFileSync(tsPath, 'utf8')
    .replace(/^import type.*\n/m, '')
    .replace(/ as const/g, '')
    .replace('export const seedConfig: AppConfig', 'globalThis.seedConfig')
    .replace('export const seedConfig', 'globalThis.seedConfig');
  eval(src);
  return globalThis.seedConfig;
}

const token = getAccessToken();
const seedConfig = loadSeedConfig();
const fields = Object.fromEntries(Object.entries(seedConfig).map(([k, v]) => [k, toFirestoreValue(v)]));
const payload = JSON.stringify({ fields });
const url =
  'https://firestore.googleapis.com/v1/projects/pakrism-bookings/databases/(default)/documents/pricePlanner?documentId=config';

const result = execSync(
  `curl -sS -X POST ${JSON.stringify(url)} -H ${JSON.stringify(`Authorization: Bearer ${token}`)} -H "Content-Type: application/json" -d ${JSON.stringify(payload)}`,
  { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
);

console.log(result.includes('createTime') || result.includes('updateTime') ? 'Seeded pricePlanner/config' : result);
