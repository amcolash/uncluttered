import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { JSONFilePreset } from 'lowdb/node';

import type { DbSchema } from './dbTypes.ts';
import { runMigrations } from './migrations.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/db.json');

const defaultData: DbSchema = {
  categories: [
    { key: 'RECRUITER', description: 'Direct job outreach from a recruiter or talent agent' },
    {
      key: 'APPOINTMENT_REMINDER',
      description: 'Upcoming class, appointment, or booking reminders from fitness, health, or scheduling services',
    },
    {
      key: 'EVENT_TICKET',
      description: 'Concert, show, and live event ticket order confirmations and delivery from ticketing platforms',
    },
    {
      key: 'FOOD_ORDER',
      description: 'Local restaurant orders, food pickup confirmations, and food delivery receipts',
    },
    { key: 'ORDER_SHIPPING', description: 'E-commerce order confirmations, shipping updates, and package tracking' },
    { key: 'TRAVEL_BOOKING', description: 'Flight check-ins, reservation confirmations, and travel itineraries' },
    {
      key: 'BANKING_ACCOUNT',
      description: 'Bank account activity, credit monitoring, fintech connections, and financial app alerts',
    },
    { key: 'FINANCE_BILL', description: 'Invoices, utility bills, and financial things requiring payment' },
    {
      key: 'DEVELOPER_SERVICES',
      description:
        'Cloud platform billing and notices, developer tool subscriptions, and infrastructure service updates',
    },
    { key: 'SYSTEM_ALERT', description: 'Automated server logs, GitHub notifications, security logins' },
    { key: 'GAMING', description: 'Gaming platform emails, free game offers, and game-related updates' },
    {
      key: 'CREATOR_CONTENT',
      description: 'Creator platform updates and posts from artists and independent content creators you support',
    },
    { key: 'POLITICAL', description: 'Political campaign fundraising, candidate outreach, and voter action' },
    {
      key: 'NONPROFIT_ADVOCACY',
      description: 'Charity and nonprofit fundraising, donation asks, and action campaigns',
    },
    {
      key: 'COMMUNITY_LOCAL',
      description: 'Local organizations, community groups, maker spaces, cultural venues, and CSA memberships',
    },
    { key: 'PERSONAL', description: 'Direct emails from individual human beings' },
    { key: 'NEWSLETTER', description: 'Long-form regular reading updates and tech summaries' },
    { key: 'SUBSCRIPTION_SERVICE', description: 'ISP, utility, and recurring subscription service management emails' },
    { key: 'PROMO_MARKETING', description: 'Product offers, corporate promotional sales, and ads' },
    {
      key: 'HEALTHCARE_MEDICAL',
      description: 'Medical appointment reminders, test results, and healthcare provider communications',
    },
    { key: 'UNKNOWN', description: 'Fallback bucket for anything ambiguous' },
  ],
  emails: [],
};

export const db = await JSONFilePreset<DbSchema>(DB_PATH, defaultData);
await runMigrations(db, defaultData);
