/**
 * process-db.mjs
 *
 * Bulk-process db.json: match emails by sender/subject/snippet and set
 * their validated flag + category override.
 *
 * Usage:
 *   node scripts/process-db.mjs [--dry-run]
 *
 * Each rule in RULES is applied in order. A rule can match on any
 * combination of sender, subject, and snippet (all treated as
 * case-insensitive substrings). Matching emails have:
 *   - userOverrideCategory set to the rule's category
 *   - validated set to true
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/db.json');

// ── Rules ─────────────────────────────────────────────────────────────────────
// Each rule: { sender?, subject?, snippet?, category, validated? }
// All provided fields must match (AND logic). Omit a field to skip it.
// validated defaults to true.

/** @type {Array<{ sender?: string, subject?: string, snippet?: string, category: string, validated?: boolean }>} */
const RULES = [
  // Examples — edit or add rules as needed:
  // { sender: 'github.com',       category: 'SYSTEM_ALERT' },
  // { sender: 'noreply@bank.com', category: 'BANKING_ACCOUNT' },
  // { subject: 'Your order',      category: 'ORDER_SHIPPING' },
  // { snippet: 'unsubscribe',     category: 'PROMO_MARKETING', validated: false },

  { sender: 'customerservice@fullcircle.com', subject: 'your payment', category: 'FOOD_ORDER', validated: true },
  { subject: 'You have a ridwell pickup', category: 'APPOINTMENT_REMINDER', validated: true },
  { sender: 'Patreon', category: 'CREATOR_CONTENT', validated: true },
  { sender: 'creator.patreon.com', category: 'CREATOR_CONTENT', validated: true },
  { subject: 'Invoice for your', sender: 'Team Headway', category: 'HEALTHCARE_MEDICAL', validated: true },
  { sender: 'nakedwines', category: 'SUBSCRIPTION_SERVICE', validated: true },
  { sender: 'Urban Dental Group', category: 'HEALTHCARE_MEDICAL', validated: true },
  { sender: 'Climate Pledge Arena', category: 'EVENT_TICKET', validated: true },
  { sender: 'Zillow Rental Manager', category: 'FINANCE_BILL', validated: true },
  { sender: 'Full Circle', category: 'FOOD_ORDER', validated: true },
  { sender: 'Plane Wellness', category: 'CREATOR_CONTENT', validated: true },
  { sender: 'notifications@github.com', category: 'DEVELOPER_SERVICES', validated: true },
  { sender: 'Defenders of Wildlife', category: 'NONPROFIT_ADVOCACY', validated: true },
  { sender: 'mail.defenders.org', category: 'NONPROFIT_ADVOCACY', validated: true },
  { sender: 'Alaska Airlines', category: 'TRAVEL_BOOKING', validated: true },
  { sender: 'toasttab.com', category: 'FOOD_ORDER', validated: true },
  { sender: 'CascadiaJS', category: 'EVENT_TICKET', validated: true },
  { sender: 'Splitwise', category: 'FINANCE_BILL', validated: true },
  { sender: 'USPS', subject: 'Expected Delivery', category: 'ORDER_SHIPPING', validated: true },
  { sender: 'help@ridwell.com', category: 'SUBSCRIPTION_SERVICE', validated: true },
];

// ── Matching ──────────────────────────────────────────────────────────────────

function matches(email, rule) {
  const contains = (field, term) => field != null && field.toLowerCase().includes(term.toLowerCase());

  if (rule.sender !== undefined && !contains(email.sender, rule.sender)) return false;
  if (rule.subject !== undefined && !contains(email.subject, rule.subject)) return false;
  if (rule.snippet !== undefined && !contains(email.snippet, rule.snippet)) return false;
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const dryRun = process.argv.includes('--dry-run');

const raw = await readFile(DB_PATH, 'utf-8');
const db = JSON.parse(raw);

let changed = 0;

for (const email of db.emails) {
  for (const rule of RULES) {
    if (matches(email, rule)) {
      if (dryRun) {
        console.log(`[dry-run] ${email.id} | ${email.sender} | "${email.subject}" → ${rule.category}`);
      } else {
        email.userOverrideCategory = rule.category;
        email.validated = rule.validated ?? true;
      }
      changed++;
      break; // first matching rule wins
    }
  }
}

if (dryRun) {
  console.log(`\n[dry-run] ${changed} email(s) would be updated. No changes written.`);
} else {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2));
  console.log(`Done. ${changed} email(s) updated across ${db.emails.length} total.`);
}
