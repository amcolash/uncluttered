import { Low } from 'lowdb';

import type { DbSchema } from './dbTypes.ts';

export async function runMigrations(db: Low<DbSchema>, defaultData: DbSchema): Promise<void> {
  console.log('[DB] Running migrations...');

  // Forward migration: add any categories present in the defaults but missing
  // from an existing db.json (e.g. when new categories are introduced).
  let categoriesMigrated = false;
  for (const cat of defaultData.categories) {
    if (!db.data.categories.some((c) => c.key === cat.key)) {
      db.data.categories.push(cat);
      categoriesMigrated = true;
      console.log(`[DB] Added new category: ${cat.key}`);
    }
  }
  if (categoriesMigrated) await db.write();
}
