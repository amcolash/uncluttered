import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CREDENTIALS_PATH = path.join(__dirname, '../data/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../data/token.json');

// This port must be registered as an authorized redirect URI in Google Cloud Console!
// http://localhost:7001/oauth2callback
const OAUTH_CALLBACK_PORT = 7001;

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

interface CredentialsFile {
  installed?: { client_id: string; client_secret: string; redirect_uris: string[] };
  web?: { client_id: string; client_secret: string; redirect_uris: string[] };
}

let oAuth2ClientInstance: OAuth2Client | null = null;
let cachedAuthUrl: string | null = null;
let authUrlExpiresAt: number = 0;

async function getOAuthClientInstance(): Promise<OAuth2Client> {
  if (oAuth2ClientInstance) {
    return oAuth2ClientInstance;
  }

  let raw: string;
  try {
    raw = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
  } catch {
    throw new Error(
      `Missing credentials.json at ${CREDENTIALS_PATH}.\n` +
        'Download it from Google Cloud Console → APIs & Services → Credentials.'
    );
  }

  const creds: CredentialsFile = JSON.parse(raw);
  const { client_id, client_secret } = creds.installed ?? creds.web!;
  const redirectUri = `http://localhost:${OAUTH_CALLBACK_PORT}/oauth2callback`;

  oAuth2ClientInstance = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  // Persist updated tokens (e.g. when a refresh_token rotation returns a new one)
  oAuth2ClientInstance.on('tokens', async (newTokens) => {
    try {
      const rawToken = await fs.readFile(TOKEN_PATH, 'utf-8').catch(() => '{}');
      const existing = JSON.parse(rawToken) as Record<string, unknown>;
      await fs.writeFile(TOKEN_PATH, JSON.stringify({ ...existing, ...newTokens }, null, 2));
    } catch (err) {
      console.error('[GmailAuth] Failed to persist refreshed token:', err);
    }
  });

  return oAuth2ClientInstance;
}

function createAuthUrl(client: OAuth2Client): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function resetAuth(): Promise<{ success: boolean; url: string }> {
  console.log('[GmailAuth] Resetting authentication state...');
  try {
    await fs.rm(TOKEN_PATH, { force: true });
  } catch (err) {
    console.warn('[GmailAuth] Could not delete token file:', err);
  }

  oAuth2ClientInstance = null;
  cachedAuthUrl = null;
  authUrlExpiresAt = 0;

  const client = await getOAuthClientInstance();
  cachedAuthUrl = createAuthUrl(client);
  authUrlExpiresAt = Date.now() + 1000 * 60 * 60;

  return { success: true, url: cachedAuthUrl };
}

export async function authorizeWithCode(code: string): Promise<void> {
  const client = await getOAuthClientInstance();
  const { tokens } = await client.getToken(code);

  let existing: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(TOKEN_PATH, 'utf-8');
    existing = JSON.parse(raw);
  } catch {
    // Missing or corrupt file
  }

  const mergedTokens = { ...existing, ...tokens };
  client.setCredentials(mergedTokens);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(mergedTokens, null, 2));
  console.log(`[GmailAuth] Token saved to ${TOKEN_PATH}`);

  cachedAuthUrl = null;
  authUrlExpiresAt = 0;
}

async function verifyToken(client: OAuth2Client): Promise<boolean> {
  try {
    const tokenRaw = await fs.readFile(TOKEN_PATH, 'utf-8');
    const token = JSON.parse(tokenRaw) as Record<string, unknown>;
    if (!token || (!token.access_token && !token.refresh_token)) {
      return false;
    }
    client.setCredentials(token);
  } catch {
    // Missing file, bad JSON, etc.
    return false;
  }

  try {
    await client.getAccessToken();
    return true;
  } catch (err: any) {
    console.warn('[GmailAuth] Token verification failed:', err.message || err);
    return false;
  }
}

export async function checkAuthStatus(): Promise<{ tokenValid: boolean; url?: string }> {
  const client = await getOAuthClientInstance();
  const isValid = await verifyToken(client);

  if (!isValid) {
    if (!cachedAuthUrl || Date.now() > authUrlExpiresAt) {
      cachedAuthUrl = createAuthUrl(client);
      authUrlExpiresAt = Date.now() + 1000 * 60 * 60; // Cache for 1 hour
    }
    return { tokenValid: false, url: cachedAuthUrl };
  }

  // Clear cache if we suddenly become valid
  cachedAuthUrl = null;
  return { tokenValid: true };
}

export async function getAuthClient(): Promise<OAuth2Client> {
  const client = await getOAuthClientInstance();
  const isValid = await verifyToken(client);

  if (!isValid) {
    throw new Error('[GmailAuth] Authentication required. Token missing, invalid, or expired.');
  }

  return client;
}
