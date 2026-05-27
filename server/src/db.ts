import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { JSONFilePreset } from 'lowdb/node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/db.json');

export interface Category {
  key: string;
  description: string;
}

export interface Email {
  id: string;
  threadId: string;
  sender: string;
  subject: string;
  snippet: string;
  aiCategory: string;
  userOverrideCategory: string | null;
  isArchived: boolean;
  processedAt: string;
}

interface DbSchema {
  categories: Category[];
  emails: Email[];
}

const defaultData: DbSchema = {
  categories: [
    { key: 'FINANCE_BILL', description: 'Invoices, utilities, and financial things requiring payment' },
    { key: 'RECRUITER', description: 'Direct job outreach from a recruiter or talent agent' },
    { key: 'PROMO_MARKETING', description: 'Single product offers, corporate promotional sales, and ads' },
    { key: 'NEWSLETTER', description: 'Long-form regular reading updates and tech summaries' },
    { key: 'SYSTEM_ALERT', description: 'Automated server logs, GitHub notifications, security logins' },
    { key: 'PERSONAL', description: 'Direct emails from individual human beings' },
    { key: 'UNKNOWN', description: 'Fallback bucket for anything ambiguous' },
  ],
  emails: [],
};

export const db = await JSONFilePreset<DbSchema>(DB_PATH, defaultData);
