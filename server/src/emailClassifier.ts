// Rule-based email classifier — no external dependencies, sub-millisecond per
// email. Patterns are checked in priority order; first match wins.
import { defaultUrgency } from './categories.ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

interface SenderParts {
  localPart: string;
  domain: string;
  displayName: string;
}

function parseSender(sender: string): SenderParts {
  const angleMatch = sender.match(/^(.*?)\s*<([^>]+)>\s*$/);
  const address = (angleMatch ? angleMatch[2] : sender).trim().toLowerCase();
  const atIdx = address.indexOf('@');
  const localPart = atIdx >= 0 ? address.slice(0, atIdx) : address;
  const domain = atIdx >= 0 ? address.slice(atIdx + 1) : '';
  const displayName = angleMatch ? angleMatch[1].trim().replace(/^["']|["']$/g, '') : '';
  return { localPart, domain, displayName };
}

/** Returns true if `domain` equals `pattern` or is a subdomain of it.
 *  e.g. domainIs('email.gog.com', 'gog.com') → true
 *       domainIs('fakegog.com', 'gog.com')    → false
 */
function domainIs(domain: string, ...patterns: string[]): boolean {
  return patterns.some((p) => domain === p || domain.endsWith('.' + p));
}

// ── Domain lists (checked with domainIs for exact + subdomain matching) ───────

const APPOINTMENT_DOMAINS = [
  'wellnessliving.com',
  'mindbodyonline.com',
  'headway.co',
  'zocdoc.com',
  'acuityscheduling.com',
  'calendly.com',
];
const ORDER_DOMAINS = [
  'amazon.com',
  'narvar.com',
  'usps.com',
  'fedex.com',
  'ups.com',
  'shopify.com',
  'aftership.com',
  'shipbob.com',
];
const TRAVEL_DOMAINS = [
  'alaskaair.com',
  'airbnb.com',
  'united.com',
  'delta.com',
  'southwest.com',
  'jetblue.com',
  'aa.com',
  'marriott.com',
  'hilton.com',
  'hotels.com',
  'booking.com',
  'expedia.com',
  'vrbo.com',
  'kayak.com',
];
const BANKING_DOMAINS = [
  'chase.com',
  'uwcu.org',
  'plaid.com',
  'experian.com',
  'sentilink.com',
  'transunion.com',
  'equifax.com',
  'monarch.com',
  'vestwell.com',
  'lendingclub.com',
  'creditkarma.com',
  'mint.com',
  'sofi.com',
  'wealthfront.com',
  'betterment.com',
];
const SYSTEM_DOMAINS = [
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'pagerduty.com',
  'sentry.io',
  'datadog.com',
  'pingdom.com',
  'statuspage.io',
  'heroku.com',
  'vercel.com',
  'netlify.com',
  'cloudflare.com',
  'digitalocean.com',
  'circleci.com',
  'travis-ci.com',
  'travis-ci.org',
  'render.com',
  'fly.io',
];
const GAMING_DOMAINS = [
  'gog.com',
  'epicgames.com',
  'steampowered.com',
  'ea.com',
  'xbox.com',
  'nintendo.com',
  'ubisoft.com',
  'humblebundle.com',
  'itch.io',
];
const CREATOR_DOMAINS = ['patreon.com', 'ko-fi.com', 'memberful.com', 'substack.com'];
const POLITICAL_DOMAINS = ['democraticgovernors.org', 'electionservicescorp.com', 'winred.com', 'ngpvan.com'];
const NONPROFIT_DOMAINS = [
  'defenders.org',
  'zeffy.com',
  'doctorswithoutborders.org',
  'msf.org',
  'fredhutch.org',
  'waisn.org',
  'wearebgc.org',
  'actblue.com',
  'salsalabs.com',
  'luminate.com',
  'blackbaud.com',
  'everyaction.com',
];
const COMMUNITY_DOMAINS = [
  'kexp.org',
  'pacsci.org',
  'seattlemakers.org',
  'aurelian.com',
  'wahbexchange.org',
  'ridwell.com',
  'beehiiv.com',
];
const SUBSCRIPTION_DOMAINS = [
  'att-mail.com',
  'att.com',
  'quantumfiber.com',
  'pse.com',
  'xfinity.com',
  'spectrum.net',
  'verizon.com',
  't-mobile.com',
  'nakedwines.com',
];
const RECRUITER_DOMAINS = [
  'linkedin.com',
  'lever.co',
  'greenhouse.io',
  'workday.com',
  'jobvite.com',
  'icims.com',
  'smartrecruiters.com',
  'ashbyhq.com',
  'rippling.com',
  'breezy.hr',
];
const PERSONAL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.ca',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'fastmail.com',
  'fastmail.org',
  'fastmail.fm',
  'aol.com',
  'hey.com',
]);
const NEWSLETTER_DOMAINS = ['ghost.io', 'buttondown.email', 'convertkit.com'];
const EVENT_TICKET_DOMAINS = [
  'seatgeek.com',
  'ticketmaster.com',
  'axs.com',
  'etix.com',
  'dice.fm',
  'eventbrite.com',
  'stubhub.com',
  'climatepledgearena.com',
];
const FOOD_ORDER_DOMAINS = [
  'messaging.squareup.com',
  'incentivio.com',
  'doordash.com',
  'ubereats.com',
  'grubhub.com',
  'postmates.com',
  'toasttab.com',
  'fullcircle.com',
];
const FINANCE_DOMAINS = ['zillow.com', 'splitwise.com'];
const DEVELOPER_DOMAINS = ['c2.synology.com'];
const ACCOUNTS_DOMAINS = [
  'google.com',
  'microsoft.com',
  'apple.com',
  'github.com',
  'amazon.com',
  'meta.com',
  'twitter.com',
  'linkedin.com',
  'slack.com',
  'dropbox.com',
  'adobe.com',
  'netflix.com',
  'spotify.com',
  'discord.com',
  'telegram.org',
  'uber.com',
  'airbnb.com',
  'paypal.com',
  'stripe.com',
  'auth0.com',
  'okta.com',
  'box.com',
  'figma.com',
  'notion.so',
  'asana.com',
  'atlassian.net',
  'gitlab.com',
  'heroku.com',
];

// ── Subject / snippet patterns ────────────────────────────────────────────────

const RE_RECRUITER_SUBJ =
  /\b(recruiter|recruiting|talent\s+(acquisition|agent)|career\s+opportunit|job\s+(offer|opportunit)|open\s+(role|position)|internship|(i\s*(am|'m)\s+)?reaching\s+out\s+about|came\s+across\s+your\s+(profile|background)|opportunit(y|ies)\s+at|would\s+you\s+be\s+open|interested\s+in\s+(a\s+)?(new\s+)?role)\b/i;

const RE_APPOINTMENT_SUBJ =
  /\b(upcoming\s+class|class\s+reminder|class\s+starting|appointment\s+(reminder|confirmed|scheduled|is\s+coming\s+up)|you\s+have\s+(an?\s+)?(upcoming|cancelled?|scheduled)|is\s+scheduled\s+for|booking\s+(confirmed|reminder)|reservation\s+(confirmed|reminder)|your\s+reservation|class\s+cancell)/i;

const RE_ORDER_SUBJ =
  /\b(order\s+(shipped|confirmed|confirmation|placed|delivered|complete|receipt|has\s+been\s+shipped)|out\s+for\s+delivery|your\s+package\s+(has|is)|package\s+delivered|arriving\s+(today|tomorrow|soon)|shipment\s+(update|confirmed)|tracking\s+(number|info)|order\s+#\s*\d)/i;

const RE_TRAVEL_SUBJ =
  /\b(check\s*in\s+for\s+your\s+flight|boarding\s+pass|flight\s+to\s+\w+|reservation\s+reminder|your\s+(trip|flight|stay|itinerary)|booking\s+confirmation|travel\s+itinerary|hotel\s+confirmation|check[\s-]in\s+time|departure\s+reminder|gate\s+(change|information))\b/i;

const RE_BANKING_SUBJ =
  /\b(account\s+(alert|update|activity)|new\s+linked\s+financial|connected\s+your\s+bank|credit\s+(score|report|monitoring)|unusual\s+activit|balance\s+(alert|low)|transfer\s+(scheduled|complete|confirmed)|new\s+payee|savings\s+account\s+(ready|opened)|(your\s+)?\w+\s+transfer\s+has\s+been)\b/i;

const RE_FINANCE_SUBJ =
  /\b(invoice|receipt\b|payment\s+(due|received|failed|declined|reminder|confirmation)|billing\b|account\s+statement|transaction\s+(alert|receipt)|order\s+receipt|charged?\s+(to|from|\$)|refund\s+(processed|issued|approved)|subscription\s+renew(al|ed|ing)?|amount\s+due|balance\s+due|overdue\s+(notice|balance|payment))\b/i;

const RE_EVENT_TICKET_SUBJ =
  /\b(your\s+(tickets?|e-?tickets?|order)\s+(is|are|has\s+been)\s*(confirmed|ready|on\s+the\s+way|sent|delivered|here)|mobile\s+tickets?|ticket\s+(transfer|delivery|confirmation|order)|print\s+at\s+home|will\s+call|you'?re\s+going\s+to)\b/i;

const RE_FOOD_ORDER_SUBJ =
  /\b(your\s+(food\s+)?order\s+(has\s+been\s+received|is\s+ready|is\s+being\s+prepared|has\s+been\s+placed|is\s+on\s+its\s+way)|order\s+ready\s+for\s+pickup|pickup\s+(ready|order|from)|your\s+(delivery|pickup)\s+order|order\s+from\s+\w)\b/i;

const RE_DEV_SUBJ =
  /\b(google\s+cloud|cloud\s+platform.{0,10}api|vertex\s+ai|google\s+search\s+console|google\s+search\s+traffic|monitor\s+the\s+google\s+search|review\s+successful\s+for\s+https?:|synology\s+c2|cloud\s+function|cloud\s+run|firebase\s+console|developer\s+console)\b/i;

const RE_SYSTEM_SUBJ =
  /\b(security\s+alert|new\s+sign[\s-]?in|new\s+device\s+sign|suspicious\s+activit|login\s+(attempt|from\s+new)|password\s+(reset|changed|updated)|two[\s-]?factor|2fa\b|mfa\s+(code|request)|verification\s+code|build\s+(failed|passed|succeeded|error)|deployment\s+(failed|succeeded|complete)|server\s+(error|alert|down|outage)|pull\s+request|merged\s+into|release\s+v?\d|pipeline\s+(failed|passed)|usage[\s-]based\s+billing|billing\s+(update|change|alert)|account\s+(suspended|locked|disabled)|action\s+required\s*:)\b/i;

const RE_ACCOUNTS_SUBJ =
  /\b(reset\s+your\s+password|password\s+reset\s+request|verify\s+your\s+.*\s+account|complete\s+your\s+.*\s+account\s+setup|confirm\s+your\s+(email|identity)|verification\s+code|your\s+verification\s+code\s+is|new\s+login\s+(from|detected)|account\s+created|welcome\s+to|confirm\s+your\s+(new\s+)?password|two[\s-]?factor\s+authentication|mfa\s+code|security\s+code|one[\s-]?time\s+passcode|password\s+change\s+confirmation|account\s+recovery|email\s+verification|unusual\s+account\s+activit|account\s+(locked|suspended)\s+for\s+security|someone\s+tried\s+to\s+access|recovery\s+(codes?|method)|new\s+device\s+login|sign[\s-]?in\s+from\s+(new|unknown))\b/i;

const RE_GAMING_SUBJ =
  /\b(free\s+(items?\s+added|game\s+claim|games?\s+this\s+week)|items?\s+added\s+to\s+your\s+(library|account)|your\s+epic\s+games\s+receipt|claim\s+your\s+free\s+game|game\s+(update|patch)|weekly\s+free\s+game)\b/i;

const RE_POLITICAL_SUBJ =
  /\b(campaign|vote|voter|ballot|elect(ion|oral)?|endorse(ment)?|senate|congress(ional)?|governor|presidential|candidate|caucus|primary\s+election|democrat(ic)?|republican|gop\b|grassroots|polling)\b/i;

const RE_NONPROFIT_SUBJ =
  /\b(donat(e|ion)|give\s+(now|today)|stand\s+with|take\s+action|protect\s+(our|the|wildlife)|fight\s+for|your\s+support\s+(saves|helps|matters)|match\s+your\s+gift|double\s+your\s+(impact|donation)|urgent\s*:|make\s+a\s+difference|action\s+alert|volunteer|fundrais(e|ing|er))\b/i;

const RE_NEWSLETTER_SUBJ =
  /\b(newsletter|weekly\s+(update|roundup|recap|news|digest|brief)|daily\s+(brief|digest|roundup)|this\s+week\s+(in|on|at)\b|roundup|issue\s+#?\s*\d+|edition\s+#?\s*\d+|dispatch\s+#|briefing\s+#|monthly\s+(recap|roundup|update)|top\s+stories|what\s+'?re\s+reading|the\s+\w+\s+(digest|brief|roundup))\b/i;

const RE_SUBSCRIPTION_SUBJ =
  /\b(automatic\s+payment\s+(is\s+)?(coming\s+up|scheduled|processed)|autopay\s+(scheduled|confirmed)|your\s+(subscription|plan|service)\s+(receipt|update|renewal|is\s+active)|billing\s+cycle|service\s+(update|change|confirmation)|plan\s+(update|change|confirmed|selection))\b/i;

const RE_PROMO_SUBJ =
  /(\d+\s*%\s*off|free\s+shipping|\bsale\b|discount|promo(tion)?\b|\boffer\b|\bdeal\b|coupon|\bsavings?\b|save\s+\$|limited[\s-]time|flash\s+sale|exclusive\s+(offer|deal|access|invite|savings?)|earn\s+(points|rewards|miles|cash\s*back)|refer\s+a\s+friend|don'?t\s+miss|last\s+chance|\bhurry\b|shop\s+now|buy\s+now|free\s+trial|you'?re\s+invited|membership\s+(update|news|perk|benefit)|reward\s+points?|claim\s+(your|now)|act\s+now|ends?\s+soon)/i;

const RE_BULK_SNIPPET =
  /unsubscribe|view\s+(in|this)\s+(browser|email)|manage\s+(your\s+)?(preferences|subscription|emails?)|email\s+preferences|opt[\s-]?out|you'?re\s+receiving\s+this/i;

const RE_AUTOMATED_LOCAL =
  /^(no[\s._-]?reply|noreply|do[\s._-]?not[\s._-]?reply|donotreply|automated?|notifications?|mailer[\s._-]?daemon|bounce|postmaster|hello|support|team|info|news|newsletter|marketing|updates?|alerts?|digest|promo|offers?|deals?|savings?)$/i;

// ── Named sender rules ────────────────────────────────────────────────────────
// Checked before all domain/regex logic. Use these for senders that need a
// specific category that the generic rules would get wrong — e.g. a display
// name with no known domain, or a specific address that overrides its domain.

interface SenderRule {
  /** Case-insensitive substring match against the full sender string */
  sender?: string;
  /** Case-insensitive substring match against subject */
  subject?: string;
  /** Case-insensitive substring match against snippet */
  snippet?: string;
  category: string;
}

const SENDER_RULES: SenderRule[] = [
  // GitHub issue/PR notifications are developer activity, not system alerts
  { sender: 'notifications@github.com', category: 'DEVELOPER_SERVICES' },
  // Healthcare providers & invoices
  { sender: 'Team Headway', subject: 'invoice', category: 'HEALTHCARE_MEDICAL' },
  { sender: 'Urban Dental Group', category: 'HEALTHCARE_MEDICAL' },
  // Creator / wellness newsletters identified by display name only
  { sender: 'Plane Wellness', category: 'CREATOR_CONTENT' },
  // Event senders identified by display name only
  { sender: 'CascadiaJS', category: 'EVENT_TICKET' },
  // Ridwell-specific overrides (ridwell.com sits in COMMUNITY_DOMAINS)
  { sender: 'help@ridwell.com', category: 'SUBSCRIPTION_SERVICE' },
  { subject: 'You have a ridwell pickup', category: 'APPOINTMENT_REMINDER' },
];

function matchesSenderRule(sender: string, subject: string, snippet: string, rule: SenderRule): boolean {
  const has = (field: string, term: string) => field.toLowerCase().includes(term.toLowerCase());
  if (rule.sender !== undefined && !has(sender, rule.sender)) return false;
  if (rule.subject !== undefined && !has(subject, rule.subject)) return false;
  if (rule.snippet !== undefined && !has(snippet, rule.snippet)) return false;
  return true;
}

// ── Classifier ────────────────────────────────────────────────────────────────

const CLASSIFIER_URL = process.env.CLASSIFIER_URL ?? 'http://localhost:7002';
// Minimum ML confidence (0-1) required to use the ML result over the rules.
// Below this threshold the rule-based classifier wins. Tune via env var.
const CLASSIFIER_MIN_CONFIDENCE = parseFloat(process.env.CLASSIFIER_MIN_CONFIDENCE ?? '0.40');

/**
 * Rule-based fallback classifier — no external dependencies, sub-millisecond.
 * Used when the ML service is unavailable or hasn't been trained yet.
 */
export function classifyEmailRules(subject: string, snippet: string, sender: string): string[] {
  const categories = [];

  // 0. Named sender rules — highest-priority overrides (checked before all domain logic)
  for (const rule of SENDER_RULES) {
    if (matchesSenderRule(sender, subject, snippet, rule)) categories.push(rule.category);
  }

  const { localPart, domain } = parseSender(sender);
  const isAutomated = RE_AUTOMATED_LOCAL.test(localPart);
  const hasBulkFooter = RE_BULK_SNIPPET.test(snippet);

  // 1. RECRUITER — ATS platforms or subject keywords
  if (domainIs(domain, ...RECRUITER_DOMAINS) || RE_RECRUITER_SUBJ.test(subject)) {
    categories.push('RECRUITER');
  }

  // 2. APPOINTMENT_REMINDER — scheduling platforms or clear appointment language
  if (domainIs(domain, ...APPOINTMENT_DOMAINS) || RE_APPOINTMENT_SUBJ.test(subject)) {
    categories.push('APPOINTMENT_REMINDER');
  }

  // 3. EVENT_TICKET — ticketing platforms or ticket-confirmation language
  if (domainIs(domain, ...EVENT_TICKET_DOMAINS) || RE_EVENT_TICKET_SUBJ.test(subject)) {
    categories.push('EVENT_TICKET');
  }

  // 4. FOOD_ORDER — restaurant order platforms or food pickup confirmation
  if (domainIs(domain, ...FOOD_ORDER_DOMAINS) || RE_FOOD_ORDER_SUBJ.test(subject)) {
    categories.push('FOOD_ORDER');
  }

  // 5. ORDER_SHIPPING — e-commerce / shipping platforms or order-status language
  if (domainIs(domain, ...ORDER_DOMAINS) || RE_ORDER_SUBJ.test(subject)) {
    categories.push('ORDER_SHIPPING');
  }

  // 4. TRAVEL_BOOKING — airline / accommodation domains or travel language
  if (domainIs(domain, ...TRAVEL_DOMAINS) || RE_TRAVEL_SUBJ.test(subject)) {
    categories.push('TRAVEL_BOOKING');
  }

  // 5. BANKING_ACCOUNT — bank / fintech domains or account-activity language
  if (domainIs(domain, ...BANKING_DOMAINS) || RE_BANKING_SUBJ.test(subject)) {
    categories.push('BANKING_ACCOUNT');
  }

  // 5b. ACCOUNTS — account security / authentication domains or password/MFA language
  if (domainIs(domain, ...ACCOUNTS_DOMAINS) || RE_ACCOUNTS_SUBJ.test(subject)) {
    categories.push('ACCOUNTS');
  }

  // 6. FINANCE_BILL — invoices / bills due (checked after banking so bank receipts
  //    don't accidentally land here)
  if (domainIs(domain, ...FINANCE_DOMAINS) || RE_FINANCE_SUBJ.test(subject)) {
    categories.push('FINANCE_BILL');
  }

  // 7. DEVELOPER_SERVICES — cloud platform and developer tool notices
  if (domainIs(domain, ...DEVELOPER_DOMAINS) || RE_DEV_SUBJ.test(subject)) {
    categories.push('DEVELOPER_SERVICES');
  }

  // 8. SYSTEM_ALERT — devops / hosting domains or security / CI keywords
  if (domainIs(domain, ...SYSTEM_DOMAINS) || RE_SYSTEM_SUBJ.test(subject)) {
    categories.push('SYSTEM_ALERT');
  }

  // 8. GAMING — gaming platform domains or free-game language
  if (domainIs(domain, ...GAMING_DOMAINS) || RE_GAMING_SUBJ.test(subject)) {
    categories.push('GAMING');
  }

  // 9. CREATOR_CONTENT — creator / patron platforms
  if (domainIs(domain, ...CREATOR_DOMAINS)) {
    categories.push('CREATOR_CONTENT');
  }

  // 10. POLITICAL — campaign / election domains or electoral keywords
  if (domainIs(domain, ...POLITICAL_DOMAINS) || RE_POLITICAL_SUBJ.test(subject)) {
    categories.push('POLITICAL');
  }

  // 11. NONPROFIT_ADVOCACY — known nonprofit / donation platforms or fundraising language
  if (domainIs(domain, ...NONPROFIT_DOMAINS) || RE_NONPROFIT_SUBJ.test(subject)) {
    categories.push('NONPROFIT_ADVOCACY');
  }

  // 12. COMMUNITY_LOCAL — local orgs, CSA farms, community venues
  if (domainIs(domain, ...COMMUNITY_DOMAINS)) {
    categories.push('COMMUNITY_LOCAL');
  }

  // 13. PERSONAL — from a personal email provider with no bulk signals
  if (!isAutomated && !hasBulkFooter && PERSONAL_DOMAINS.has(domain)) {
    categories.push('PERSONAL');
  }

  // 14. NEWSLETTER — editorial digest language or newsletter-specific platforms
  if (RE_NEWSLETTER_SUBJ.test(subject) || domainIs(domain, ...NEWSLETTER_DOMAINS)) {
    categories.push('NEWSLETTER');
  }

  // 15. SUBSCRIPTION_SERVICE — ISP / utility service management
  if (domainIs(domain, ...SUBSCRIPTION_DOMAINS) || RE_SUBSCRIPTION_SUBJ.test(subject)) {
    categories.push('SUBSCRIPTION_SERVICE');
  }

  // 16. PROMO_MARKETING — automated sender, bulk footer, or promotional language
  if (isAutomated || hasBulkFooter || RE_PROMO_SUBJ.test(subject)) {
    categories.push('PROMO_MARKETING');
  }

  categories.push('UNKNOWN');

  return categories;
}

interface MlCandidate {
  category: string;
  confidence: number;
}

function normalizeMlCandidates(data: unknown): MlCandidate[] {
  if (!data || typeof data !== 'object') return [];
  const asAny = data as Record<string, unknown>;

  const candidates: MlCandidate[] = [];
  if (Array.isArray(asAny.categories)) {
    for (const item of asAny.categories) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as any).category === 'string' &&
        typeof (item as any).confidence === 'number'
      ) {
        candidates.push({
          category: (item as any).category,
          confidence: (item as any).confidence,
        });
      }
    }
  }

  if (typeof asAny.category === 'string' && typeof asAny.confidence === 'number') {
    const existing = candidates.find((candidate) => candidate.category === asAny.category);
    if (!existing) {
      candidates.push({ category: asAny.category, confidence: asAny.confidence });
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

function selectSuggestions(candidates: MlCandidate[], exclude: string[]): MlCandidate[] {
  return candidates
    .filter((candidate) => !exclude.includes(candidate.category) && candidate.confidence > 0.2)
    .slice(0, 3);
}

function selectRuleSuggestions(categories: string[], exclude: string[]): string[] {
  return categories.filter((category) => !exclude.includes(category)).slice(0, 3);
}

/**
 * Classifies an email using the ML service when available, falling back to the
 * rule-based classifier when the service is unreachable or not yet trained.
 */
export async function classifyEmail(
  subject: string,
  snippet: string,
  sender: string
): Promise<{
  category: string;
  urgency: number;
  confidence?: number;
  mlSuggestions?: MlCandidate[];
  ruleSuggestions?: string[];
}> {
  const ruleCategories = classifyEmailRules(subject, snippet, sender);
  let primaryCategory = ruleCategories[0];
  let confidence = -1;
  let mlCandidates: MlCandidate[] = [];
  let earliestUrgency = defaultUrgency[primaryCategory] ?? 3;

  try {
    const res = await fetch(`${CLASSIFIER_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, snippet, sender }),
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        categories?: unknown;
        category?: string;
        confidence?: number;
        urgency?: number;
        ready?: boolean;
      };
      mlCandidates = normalizeMlCandidates(data);
      const bestMl = mlCandidates[0];
      if (bestMl) {
        confidence = bestMl.confidence;
      }

      const mlUrgency = typeof data?.urgency === 'number' ? data.urgency : undefined;
      if (bestMl && data?.ready && bestMl.confidence >= CLASSIFIER_MIN_CONFIDENCE) {
        primaryCategory = bestMl.category;
        earliestUrgency = mlUrgency ?? defaultUrgency[primaryCategory] ?? 3;
      }
    }
  } catch {
    // Service unavailable — fall through to rule-based fallback.
  }

  const ruleSuggestions = selectRuleSuggestions(ruleCategories, [primaryCategory, 'UNKNOWN']);
  const mlSuggestions = selectSuggestions(mlCandidates, [primaryCategory, 'UNKNOWN']);

  return {
    category: primaryCategory,
    urgency: earliestUrgency,
    confidence: confidence >= 0 ? confidence : undefined,
    mlSuggestions: mlSuggestions.length > 0 ? mlSuggestions : undefined,
    ruleSuggestions: ruleSuggestions.length > 0 ? ruleSuggestions : undefined,
  };
}
