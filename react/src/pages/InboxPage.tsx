import { EmailBundle } from 'components/EmailBundle';
import { Nav } from 'components/Nav';
import type { Email } from 'hooks/useEmails';

const data: Email[] = [
  {
    id: '19e66bdbf4564cf6',
    threadId: '19e66bdbf4564cf6',
    sender: 'Airbnb <automated@airbnb.com>',
    subject: 'Reservation reminder - June 3, 2026',
    snippet:
      'Access check-in info anywhere, anytime Download on the App Store Get it on Google Play Airbnb Pack your bags! It&#39;s almost time for your trip to Eastsound, WA. Elegant Madrona Townhouse, right in',
    aiCategory: 'TRAVEL_BOOKING',
    userOverrideCategory: null,
    isArchived: false,
    processedAt: '2026-05-27T04:58:37.358Z',
    validated: true,
  },
  {
    id: '19e6696edc7292b1',
    threadId: '19e6696edc7292b1',
    sender: 'Lending Club <noreply@qemailserver.com>',
    subject: 'Andrew, LendingClub wants to hear from you!',
    snippet:
      'Hi Andrew, At LendingClub, we strive to deliver exceptional experiences and high-quality products thatsupport our members &lt;&gt;. We&#39;d be grateful if you could take just 3 minutes to rate your',
    aiCategory: 'BANKING_ACCOUNT',
    userOverrideCategory: null,
    isArchived: false,
    processedAt: '2026-05-27T04:58:37.812Z',
    validated: true,
  },
  {
    id: '19e664e524e878ef',
    threadId: '19e664e524e878ef',
    sender: 'Roy Cooper <info@e.roycooper.com>',
    subject: 'Will you add your name to personally endorse my campaign?',
    snippet:
      'I wanted to reach out to you specifically, folks.͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌ ͏‌',
    aiCategory: 'POLITICAL',
    userOverrideCategory: null,
    isArchived: false,
    processedAt: '2026-05-27T04:58:38.456Z',
    validated: true,
  },
  {
    id: '19e66345b6e75044',
    threadId: '19e66345b6e75044',
    sender: 'Full Circle <farmnews@news.fullcircle.com>',
    subject: '🌷 Spring Savings When You Refer a Friend',
    snippet:
      'Get your unique Refer-A-Friend code and start saving on your farm box deliveries! Refer-A-Friend and save! :: FULL CIRCLE :: Refer-A-Friend Program Get your unique Refer-A-Friend code &amp; start',
    aiCategory: 'PROMO_MARKETING',
    userOverrideCategory: 'FOOD_ORDER',
    isArchived: false,
    processedAt: '2026-05-27T04:58:38.914Z',
    validated: true,
  },
  {
    id: '19e65949ad97b360',
    threadId: '19e65949ad97b360',
    sender: 'Plane Wellness <contact@mailer.zeffy.com>',
    subject: '3x The Fun!',
    snippet:
      'View in browser 3 Awesome Courses! Need Some Summer Fun? In this class, we&#39;ll explore the block plane—not just as a tool, but as a gateway to precision, control, and craftsmanship. Whether you&#39;',
    aiCategory: 'NONPROFIT_ADVOCACY',
    userOverrideCategory: 'CREATOR_CONTENT',
    isArchived: false,
    processedAt: '2026-05-27T04:58:39.361Z',
    validated: true,
  },
  {
    id: '19e6561e58cb6631',
    threadId: '19e6561e58cb6631',
    sender: 'Petco Membership <Petco@e.petco.com>',
    subject: 'Exciting news about your Perks membership.',
    snippet:
      'Learn more about the upcoming changes. ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ ͏ ‌ Petco Thank you for being a part of our Petco Perks membership pilot. We received',
    aiCategory: 'SUBSCRIPTION_SERVICE',
    userOverrideCategory: null,
    isArchived: false,
    processedAt: '2026-05-27T04:58:39.914Z',
    validated: true,
  },
  {
    id: '19e6517e5f5bfd98',
    threadId: '19e6517e5f5bfd98',
    sender: 'News Alert via DGA <info@democraticgovernors.org>',
    subject: 'UNBELIEVABLE headline',
    snippet:
      '‼️ URGENT NEWS ‼️ The Washington Post: Republicans Who Denied 2020 Election Results Could Be Governors Next Year The DGA is ALL IN to elect Democratic governors and defeat MAGA extremists nationwide –',
    aiCategory: 'POLITICAL',
    userOverrideCategory: null,
    isArchived: false,
    processedAt: '2026-05-27T04:58:40.346Z',
    validated: true,
  },
  {
    id: '19e64ea4c09862b9',
    threadId: '19e64ea4c09862b9',
    sender: 'CascadiaJS 2026 <support@tito.io>',
    subject: 'ONE WEEK to CascadiaJS 2026!!! 🚀 (PLEASE READ)',
    snippet:
      'Thanks to Arcjet for being a Gold Sponsor for CascadiaJS 2026! Hey folks! We&#39;re ONE WEEK OUT from CascadiaJS 2026, so please review the checklist below for things to do, things to pack and things',
    aiCategory: 'COMMUNITY_LOCAL',
    userOverrideCategory: 'EVENT_TICKET',
    isArchived: false,
    processedAt: '2026-05-27T04:58:40.812Z',
    validated: true,
  },
  {
    id: '19e64a8c1aa47f09',
    threadId: '19e64a8c1aa47f09',
    sender: 'Doctors Without Borders <updates.reply@e.doctorswithoutborders.org>',
    subject: 'The power of play therapy',
    snippet:
      'Explore how play is helping children recover from illness Click here if you are having trouble viewing this message. MSF-USA logo Play therapy is powerful. Explore our programs for children&#39;s',
    aiCategory: 'NONPROFIT_ADVOCACY',
    userOverrideCategory: null,
    isArchived: false,
    processedAt: '2026-05-27T04:58:41.250Z',
    validated: true,
  },
  {
    id: '19e6358c468c4c24',
    threadId: '19e6358c468c4c24',
    sender: 'hpfnotificationprod@wahbexchange.org',
    subject: 'Plan Selection Confirmed',
    snippet:
      'Dear Andrew Mcolash, Sign into your Washington Healthplanfinder account to view your Plan Selection Confirmed notice. http://www.wahealthplanfinder.org ***This is an automatically generated email.',
    aiCategory: 'COMMUNITY_LOCAL',
    userOverrideCategory: 'HEALTHCARE_MEDICAL',
    isArchived: false,
    processedAt: '2026-05-27T04:58:41.708Z',
    validated: true,
  },
];

export function InboxPage() {
  const emails = data;

  return (
    <div className="flex justify-center gap-8">
      <Nav />

      <div className="flex max-w-screen flex-1 flex-col items-center gap-20 p-8">
        <h1 className="mt-8 text-2xl font-bold text-white">Inbox</h1>

        {emails.length > 0 ? (
          <EmailBundle emails={emails} />
        ) : (
          <p className="text-center text-lg text-white">
            <span>All done — no more emails to review.</span>
            <br />
            <br />
            <span className="text-4xl">🎉</span>
          </p>
        )}
      </div>
    </div>
  );
}
