import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/db.json');
const BACKUP_DIR = path.join(__dirname, '../data/backups');

const MAX_STARTUP_BACKUPS = 10;
const MAX_DAILY_BACKUPS = 10;

export type BackupPool = 'startup' | 'daily';

/**
 * Validates db.json integrity.
 * Returns true only if the file exists, is non-empty, and parses as valid JSON with an emails array.
 */
async function validateDbFile(): Promise<boolean> {
  try {
    const stats = await fs.stat(DB_PATH);
    if (stats.size === 0) {
      console.error('[Backup] ABORT: db.json exists but is 0 bytes.');
      return false;
    }

    const content = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.emails)) {
      console.error('[Backup] ABORT: db.json is missing required "emails" array.');
      return false;
    }

    return true;
  } catch (err: any) {
    console.error(`[Backup] ABORT: db.json validation failed: ${err?.message || err}`);
    return false;
  }
}

/**
 * Prunes backups in a pool to keep only the newest maxCount files.
 * NEVER called if backup creation or validation failed.
 */
async function pruneBackups(pool: BackupPool): Promise<void> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const prefix = `db.${pool}.`;
    const poolFiles = files
      .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
      .sort()
      .reverse(); // Newest first due to ISO timestamp naming

    const maxCount = pool === 'startup' ? MAX_STARTUP_BACKUPS : MAX_DAILY_BACKUPS;

    if (poolFiles.length > maxCount) {
      const toDelete = poolFiles.slice(maxCount);
      for (const file of toDelete) {
        const filePath = path.join(BACKUP_DIR, file);
        await fs.unlink(filePath);
        console.log(`[Backup] Pruned old ${pool} backup: ${file}`);
      }
    }
  } catch (err) {
    console.error(`[Backup] Error pruning ${pool} backups:`, err);
  }
}

/**
 * Creates an atomic backup for the given pool ('startup' | 'daily').
 * Aborts without modifying existing backups if db.json is invalid.
 */
export async function createBackup(pool: BackupPool): Promise<boolean> {
  const isValid = await validateDbFile();
  if (!isValid) {
    console.error(`[Backup] Aborting ${pool} backup creation — existing backups preserved untouched.`);
    return false;
  }

  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const now = new Date();
  let filename: string;

  if (pool === 'daily') {
    // Format: db.daily.YYYY-MM-DD.json
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    filename = `db.daily.${yyyy}-${mm}-${dd}.json`;
  } else {
    // Format: db.startup.YYYY-MM-DDTHH-mm-ss.json
    const isoClean = now.toISOString().replace(/[:.]/g, '-');
    filename = `db.startup.${isoClean}.json`;
  }

  const finalPath = path.join(BACKUP_DIR, filename);
  const tmpPath = path.join(BACKUP_DIR, `.${filename}.tmp`);

  try {
    await fs.copyFile(DB_PATH, tmpPath);
    await fs.rename(tmpPath, finalPath);
    console.log(`[Backup] Successfully created ${pool} backup: ${filename}`);

    // Safely prune older backups only after successful write
    await pruneBackups(pool);
    return true;
  } catch (err) {
    console.error(`[Backup] Failed to create ${pool} backup:`, err);
    try {
      await fs.unlink(tmpPath);
    } catch {
      // Ignore tmp cleanup error
    }
    return false;
  }
}

/**
 * Ensures today has a daily backup. Called on startup in case the server was offline at 3:55 AM.
 */
export async function ensureDailyBackup(): Promise<void> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const expectedFile = path.join(BACKUP_DIR, `db.daily.${yyyy}-${mm}-${dd}.json`);

  try {
    await fs.access(expectedFile);
  } catch {
    console.log("[Backup] Today's daily backup not found; creating it now...");
    await createBackup('daily');
  }
}
