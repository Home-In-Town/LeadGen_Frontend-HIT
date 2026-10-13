/**
 * Sales presentation content for /sales (public, before login).
 *
 * Everything the sales team pitches lives here so copy, prices and limits can be
 * changed without touching the page layout. Prices are in INR.
 */

// Where "Book a demo" goes. Fill in phone / WhatsApp (digits with country code,
// e.g. "919876543210") to show the Call and WhatsApp buttons.
export const SALES_CONTACT = {
  email: 'support@homeintown.in',
  phone: '',
  whatsapp: '',
};

export const PITCH = {
  eyebrow: 'OneEmployee for Real Estate',
  title: 'Your AI sales employee that never misses a lead',
  subtitle:
    'Every enquiry from your ads gets an AI call, a 90-second qualification, WhatsApp and email follow-up, and a place in your CRM — day or night.',
  highlights: [
    { icon: 'support_agent', label: '90-sec AI qualification' },
    { icon: 'nightlight', label: '24/7 off-hours handling' },
    { icon: 'forum', label: 'WhatsApp + Email follow-up' },
    { icon: 'apartment', label: 'Project microsites' },
  ],
};

// Typical Meta Ads spend by real-estate businesses in India (market estimates shared by the team).
export const AD_SPEND_TIERS = [
  {
    id: 'solo',
    icon: 'person',
    title: 'Solo / Beginner Agent',
    who: 'Most individual agents',
    monthly: '₹15,000 – ₹30,000',
    period: 'per month',
    points: [
      '₹500 – ₹1,000 a day',
      '15–30 leads a day when targeting is right',
      "Meta's minimum is ₹100–150/day, but real-estate campaigns don't optimise at that level",
    ],
    plan: 'starter',
  },
  {
    id: 'established',
    icon: 'groups',
    title: 'Established Agent / Team',
    who: 'Regular work in Tier-2 cities like Nagpur',
    monthly: '₹40,000 – ₹80,000',
    period: 'per month',
    points: [
      'The most common bracket',
      '₹40,000 spend → 12 site visits and 3 deals in one case',
      '₹1.2 lakh spend → 740 leads in another',
      'Cost per lead ₹550–750 in month 1, ₹150–300 once optimised',
    ],
    plan: 'growth',
  },
  {
    id: 'developer',
    icon: 'domain',
    title: 'Developer / Builder / Big Brokerage',
    who: 'Multiple projects, larger teams',
    monthly: '₹50,000 – ₹1,00,000+',
    period: 'to start, scaling to ₹2 lakh+',
    points: [
      'Agency management fee is extra — usually from ₹50,000 a month',
      'Ad spend is paid on top of the agency fee',
    ],
    plan: 'pro',
  },
];

export const LEAK_POINTS = [
  { icon: 'schedule', title: 'Leads go cold', desc: 'A buyer who filled your form is comparing other projects too. If nobody calls quickly, the next builder does.' },
  { icon: 'bedtime', title: 'After-hours enquiries wait', desc: 'Leads that arrive at night or on Sundays sit untouched until someone is free.' },
  { icon: 'repeat', title: 'Follow-up is manual', desc: 'Calling, sending project details and reminding for site visits depends on how busy the team is.' },
  { icon: 'help', title: 'No clear picture', desc: 'It is hard to see which leads are serious, which were called, and what each one said.' },
];

export const FLOW_STEPS = [
  { icon: 'campaign', title: 'Lead arrives', desc: 'From Meta / Google ads, your website, WhatsApp or added manually.' },
  { icon: 'call', title: 'AI calls', desc: 'Introduces your project in Hindi, Hinglish, English or Marathi.' },
  { icon: 'fact_check', title: 'Qualifies in ~90 sec', desc: 'Budget, BHK, timeline and interest captured on the call.' },
  { icon: 'chat', title: 'Follows up', desc: 'WhatsApp templates, email and 24/7 WhatsApp auto-reply.' },
  { icon: 'event_available', title: 'Books the visit', desc: 'Site visits and callbacks land in your meetings panel.' },
  { icon: 'insights', title: 'CRM scores it', desc: 'Hot / warm / cold status, transcript and summary for your team.' },
];

export const SOFTWARE_FEATURES = [
  { icon: 'call', title: 'AI calling', desc: 'AI agent calls new leads and follows up, with transcripts and summaries saved to the lead.' },
  { icon: 'auto_mode', title: 'Lead nurturing', desc: 'Keeps prospective buyers engaged across the sales process with timed follow-ups.' },
  { icon: 'chat', title: 'WhatsApp template messaging', desc: 'Send project information, brochures and follow-up messages using approved templates.' },
  { icon: 'mail', title: 'Email automation', desc: 'Planned, repeatable email communication with prospects.' },
  { icon: 'add_business', title: 'Project creation', desc: 'Add your property projects with details, pricing and media.' },
  { icon: 'tune', title: 'Custom project automation', desc: 'Choose the automations that suit each project — channels, templates and timing.' },
  { icon: 'contacts', title: 'Client & lead management', desc: 'CRM configured around your business — sources, projects, statuses and history.' },
  { icon: 'web', title: 'Project microsite', desc: "A page for each project with its details and your company profile." },
  { icon: 'link', title: 'Shareable project links', desc: 'Links and templates that take buyers straight to the right project and profile page.' },
  { icon: 'engineering', title: 'Done-for-you setup', desc: 'Our team sets up and configures the account for your business.' },
  { icon: 'filter_alt', title: 'Lead filtering & meeting follow-up', desc: 'Spot promising enquiries quickly and keep track of upcoming meetings.' },
  { icon: 'data_usage', title: 'Credit & API usage tracking', desc: 'Usage dashboard with credits — planned for a future release.', soon: true },
];

export const SERVICES = [
  { icon: 'ads_click', title: 'Digital campaign management', desc: 'Campaigns that promote your projects and attract prospective buyers.' },
  { icon: 'thumb_up', title: 'Social media page management', desc: 'Your property pages managed with regular posts and creatives.' },
  { icon: 'trending_up', title: 'Organic marketing', desc: 'Better visibility for your property without relying only on paid ads.' },
  { icon: 'flight', title: 'Drone shoots', desc: 'Aerial photos and video of your project and its surroundings.' },
  { icon: 'photo_camera', title: 'Property presentation & shoots', desc: 'Professional shoots arranged to showcase your listings and projects.' },
  { icon: 'move_to_inbox', title: 'Leads delivered into the system', desc: 'Every marketing enquiry lands in your CRM, ready for the AI to call and follow up.' },
];

export const BENEFITS = [
  { icon: 'folder_managed', text: 'Project information and prospect follow-up stay organised in one place.' },
  { icon: 'bolt', text: 'Every enquiry gets a consistent response through automated calls, WhatsApp and email.' },
  { icon: 'do_not_disturb_on', text: 'Less repetitive manual follow-up for your sales and marketing team.' },
  { icon: 'share', text: 'Project information shared through a dedicated page and links.' },
  { icon: 'travel_explore', text: 'Buyers get an online place to view project and profile details.' },
  { icon: 'verified', text: 'Lead qualification and meeting follow-up built in.' },
  { icon: 'hub', text: 'Property promotion and lead management combined in one offering.' },
  { icon: 'videocam', text: 'Better property presentation with professional visuals and drone footage.' },
  { icon: 'public', text: 'More reach through social media, organic marketing and digital campaigns.' },
  { icon: 'settings_suggest', text: "Configured around your projects and the way your business works." },
];

// Everything below is included in every plan ("Sab milega — no feature cut").
export const PLAN_INCLUDES = [
  'One Employee AI — 90-second lead qualification',
  '24/7 off-hours lead handling',
  'RERA details + Trust Folder + EMI Calculator',
  '3D Tour + WhatsApp Auto-Reply',
  'CRM Inbox',
];

export const PLAN_DURATIONS = [
  { key: '3m', months: 3, label: '3 Months' },
  { key: '6m', months: 6, label: '6 Months' },
  { key: '12m', months: 12, label: '12 Months' },
];

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    audience: 'For Solo Agents & Freelance Brokers',
    note: 'Sab milega — every feature included',
    prices: { '3m': 14997, '6m': 25994, '12m': 41988 },
    limits: { leads: 300, projects: 1, users: 1, aiChats: 500 },
    extras: [],
  },
  {
    id: 'growth',
    name: 'Growth',
    audience: 'For Builders with 1–5 Projects',
    note: '80% of builders choose this plan',
    popular: true,
    prices: { '3m': 44997, '6m': 76494, '12m': 119988 },
    limits: { leads: 1200, projects: 5, users: 5, aiChats: 2500 },
    extras: ['Priority onboarding'],
  },
  {
    id: 'pro',
    name: 'Pro',
    audience: 'For Big Developers & 5+ Project Groups',
    note: 'Same power, built for scale',
    prices: { '3m': 89997, '6m': 152994, '12m': 239988 },
    limits: { leads: 5000, projects: 'Unlimited', users: 15, aiChats: 10000 },
    extras: ['Dedicated manager'],
  },
];

export const PRICING_NOTES = [
  'Prices in INR. GST extra as applicable.',
  'Ad spend is not included — it is paid directly to Meta / Google.',
  "WhatsApp message fees charged by Meta are billed to your WhatsApp Business account.",
  'Marketing services (campaigns, social media, drone and property shoots) are quoted separately.',
];

export const ONBOARDING_STEPS = [
  { icon: 'videocam', title: 'Demo', desc: 'A 20-minute walkthrough with your own project.' },
  { icon: 'workspace_premium', title: 'Pick a plan', desc: 'Starter, Growth or Pro — 3, 6 or 12 months.' },
  { icon: 'engineering', title: 'We set it up', desc: 'Account, projects, WhatsApp number, templates and automations.' },
  { icon: 'rocket_launch', title: 'Go live', desc: 'The AI starts calling and following up your leads.' },
];

export const FAQS = [
  {
    q: 'What does the AI calling and automation actually do?',
    a: 'When a new lead comes in, the AI agent calls automatically — day or night — in Hindi, Hinglish, English or Marathi. It introduces your company, pitches the project the lead asked about (BHK options, pricing, RERA, location), asks qualifying questions on budget, requirement and timeline, answers common questions, and books a site visit or callback. If the customer is busy or not interested, it ends the call politely. Every call is saved with a transcript, summary and interest score, and your chosen WhatsApp and email follow-ups go out after the call.',
  },
  {
    q: 'Which WhatsApp templates are available, and who approves them?',
    a: 'During setup our team connects your own WhatsApp Business number and prepares starter templates for project details, follow-ups and site-visit reminders. You can create more templates from the dashboard, with text, image headers and buttons. Every template is reviewed and approved by Meta before it can be sent — usually within minutes, sometimes up to 24 hours.',
  },
  {
    q: 'What appears on the project microsite, and can the client update it?',
    a: "Each project gets its own page with the project's details — location, configurations, pricing, RERA number, amenities and photos — along with your company profile. You can edit project details any time from the Projects section.",
  },
  {
    q: 'How does the system define, filter and qualify a lead?',
    a: 'A lead is an enquiry with a name and phone number that reaches your CRM — from Meta or Google lead forms, your website, WhatsApp, or added by your team. The same phone number is kept as one lead. The AI call grades interest, budget and timeline, which sets a lead score and a Hot / Warm / Cold status. You can filter leads by project, source, campaign and status.',
  },
  {
    q: 'How do team members work leads, and how are meetings tracked?',
    a: "Each sales user gets their own login, up to your plan's user limit, and works from the shared CRM where leads are organised by project, campaign and status. Site visits and meetings booked by the AI or the team appear in the Upcoming Meetings panel on the dashboard, with notifications.",
  },
  {
    q: 'What does lead nurturing include?',
    a: 'An automatic AI call, WhatsApp template messages, email follow-ups, and a 24/7 WhatsApp AI auto-reply that answers buyer questions when your team is offline. You choose the automations per project — which channels run, which templates are used, and the follow-up timing.',
  },
  {
    q: 'Which social media platforms are managed, and what work is included?',
    a: 'Facebook and Instagram. We manage your property pages with planned posts and creatives. The number of posts and formats each month is written into your proposal before work starts.',
  },
  {
    q: 'What does organic marketing include, and how are results reported?',
    a: 'Unpaid visibility for your projects — regular posts on your pages, shareable project microsites and links, and profile optimisation. Leads it brings in are tracked by source in your CRM, and we share a regular report covering reach, engagement and leads.',
  },
  {
    q: 'What is included in a drone shoot?',
    a: 'Aerial photos and video of your project site and surroundings, edited for ads, your project microsite and WhatsApp. The location, shoot duration and final deliverables are fixed in your proposal, and shoots follow DGCA drone rules for that location.',
  },
  {
    q: 'What does the lead number in a plan mean, and how are interested customers counted?',
    a: 'The monthly lead figure in each plan (300, 1,200 or 5,000) is how many leads the software will call and manage — it is capacity, not a promise of ad results. When we run your campaigns, a lead is a unique enquiry with a name and phone number that lands in your CRM. An interested customer is one the AI call marks as high or medium interest, or who books a site visit or callback. Any lead-volume commitment for a campaign is written into that campaign\'s proposal.',
  },
  {
    q: 'Is there credit or API usage billing?',
    a: "Not today. Your plan covers the included limits — leads, AI chats, projects and users — and we don't meter API usage or charge credits. Your ad spend and Meta's WhatsApp message fees are paid directly to Meta. A usage dashboard with credits is planned; before it applies to your account we'll tell you in advance and show your usage clearly.",
  },
];

// ── Pricing helpers ───────────────────────────────────────────────────────────
export const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Monthly equivalent for a plan/duration. */
export const perMonth = (plan, key) => {
  const d = PLAN_DURATIONS.find((x) => x.key === key);
  return plan.prices[key] / d.months;
};

/** Saving vs paying the 3-month rate for the same period (0 for 3 months). */
export const savingPct = (plan, key) => {
  const d = PLAN_DURATIONS.find((x) => x.key === key);
  const base = (plan.prices['3m'] / 3) * d.months;
  return Math.max(0, Math.round((1 - plan.prices[key] / base) * 100));
};

/** Smallest plan whose monthly lead limit covers `leads` (null when above Pro). */
export const planForLeads = (leads) => PLANS.find((p) => leads <= p.limits.leads) || null;
