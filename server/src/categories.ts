import type { Category } from './dbTypes.ts';

const partialCategories: Omit<Category, 'urgency'>[] = [
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
    description: 'Cloud platform billing and notices, developer tool subscriptions, and infrastructure service updates',
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
];

/**
 * Default urgency level per category.
 * 1 = read this now  2 = read soon
 * 3 = get to it this week  4 = low priority
 * 5 = maybe read someday
 */
export const defaultUrgency: Record<string, number> = {
  RECRUITER: 3,
  APPOINTMENT_REMINDER: 1,
  EVENT_TICKET: 2,
  FOOD_ORDER: 1,
  ORDER_SHIPPING: 3,
  TRAVEL_BOOKING: 2,
  BANKING_ACCOUNT: 1,
  FINANCE_BILL: 2,
  HEALTHCARE_MEDICAL: 2,
  DEVELOPER_SERVICES: 3,
  SYSTEM_ALERT: 2,
  GAMING: 4,
  CREATOR_CONTENT: 4,
  POLITICAL: 5,
  NONPROFIT_ADVOCACY: 4,
  COMMUNITY_LOCAL: 3,
  PERSONAL: 1,
  NEWSLETTER: 5,
  SUBSCRIPTION_SERVICE: 4,
  PROMO_MARKETING: 5,
  UNKNOWN: 3,
};

export const defaultCategories = partialCategories.map((cat) => ({ ...cat, urgency: defaultUrgency[cat.key] || 5 }));
