import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CREDENTIALS_PATH = path.join(__dirname, '../data/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../data/token.json');

// This port must be registered as an authorized redirect URI in Google Cloud Console:
// http://localhost:3003/oauth2callback
const OAUTH_CALLBACK_PORT = 3003;

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

interface CredentialsFile {
  installed?: { client_id: string; client_secret: string; redirect_uris: string[] };
  web?: { client_id: string; client_secret: string; redirect_uris: string[] };
}

async function buildOAuthClient(): Promise<OAuth2Client> {
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

  return new google.auth.OAuth2(client_id, client_secret, redirectUri);
}

async function runAuthorizationFlow(oAuth2Client: OAuth2Client): Promise<void> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // force refresh_token to be returned
  });

  console.log('\n=== Gmail Authorization Required ===');
  console.log(`Open this URL in a browser (then come back):\n\n${authUrl}\n`);
  console.log(`Waiting for callback on http://localhost:${OAUTH_CALLBACK_PORT}/oauth2callback ...\n`);

  await new Promise<void>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url ?? '/', `http://localhost:${OAUTH_CALLBACK_PORT}`);

        if (reqUrl.pathname !== '/oauth2callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const code = reqUrl.searchParams.get('code');
        const error = reqUrl.searchParams.get('error');

        if (error) {
          res.writeHead(400);
          res.end(`Authorization denied: ${error}`);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code) {
          res.writeHead(400);
          res.end('No authorization code received.');
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h2>Authorization successful! You can close this tab.</h2></body></html>');
        server.close();

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log(`[GmailAuth] Token saved to ${TOKEN_PATH}`);
        resolve();
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    server.listen(OAUTH_CALLBACK_PORT);
    server.on('error', reject);
  });
}

export async function getAuthClient(): Promise<OAuth2Client> {
  const oAuth2Client = await buildOAuthClient();

  try {
    const tokenRaw = await fs.readFile(TOKEN_PATH, 'utf-8');
    const token = JSON.parse(tokenRaw) as Record<string, unknown>;
    oAuth2Client.setCredentials(token);

    // Persist updated tokens (e.g. when a refresh_token rotation returns a new one)
    oAuth2Client.on('tokens', async (newTokens) => {
      try {
        const existing = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf-8')) as Record<string, unknown>;
        await fs.writeFile(TOKEN_PATH, JSON.stringify({ ...existing, ...newTokens }, null, 2));
      } catch (err) {
        console.error('[GmailAuth] Failed to persist refreshed token:', err);
      }
    });
  } catch {
    await runAuthorizationFlow(oAuth2Client);
  }

  return oAuth2Client;
}
