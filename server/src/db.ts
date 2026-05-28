import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { JSONFilePreset } from 'lowdb/node';

import { defaultCategories } from './categories.ts';
import type { DbSchema } from './dbTypes.ts';
import { runMigrations } from './migrations.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/db.json');

const defaultData: DbSchema = {
  categories: defaultCategories,
  emails: [],
};

export const db = await JSONFilePreset<DbSchema>(DB_PATH, defaultData);
await runMigrations(db, defaultData);
