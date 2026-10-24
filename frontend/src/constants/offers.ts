export interface StatusOption {
  id: string;
  label: string;
  description: string;
  dotColor: string;
  badgeClass: string;
}

export const OFFER_STATUSES: Record<string, StatusOption> = {
  active: {
    id: 'active',
    label: 'Active',
    description: 'Offer is live and tracking all traffic, clicks, and payouts.',
    dotColor: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  paused: {
    id: 'paused',
    label: 'Paused',
    description: 'Tracking still works but clicks/conversions do not earn payouts.',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  pending: {
    id: 'pending',
    label: 'Pending',
    description: 'Under review or draft stage, not yet open for live partner traffic.',
    dotColor: 'bg-indigo-500',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  },
  deleted: {
    id: 'deleted',
    label: 'Deleted',
    description: 'Tracking turned off. Links no longer redirect but reports remain.',
    dotColor: 'bg-rose-500',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
};

export interface ConversionMethodOption {
  id: string;
  title: string;
  description: string;
  badge: string;
}

export const CONVERSION_METHODS: ConversionMethodOption[] = [
  {
    id: 'server_postback',
    title: 'Server Postback (S2S)',
    description: 'Server-to-server webhook connection passing {transaction_id}. Safest and most reliable.',
    badge: 'Recommended',
  },
  {
    id: 'js_sdk',
    title: 'JavaScript SDK (1st-Party)',
    description: 'First-party cookie script. Allows direct traffic from Meta & Google without redirect hops.',
    badge: 'Cookie-less Compliant',
  },
  {
    id: 'html_pixel',
    title: 'HTML Image / Iframe Pixel',
    description: 'Client-side cookie pixel fired on order thank-you pages for older web stores.',
    badge: 'Legacy Support',
  },
];

export interface RevenueTypeOption {
  id: string;
  label: string;
  hint: string;
}

export const REVENUE_TYPES: RevenueTypeOption[] = [
  { id: 'rps', label: 'RPS (% of Sale)', hint: 'Revenue Per Sale (percentage from total cart amount)' },
  { id: 'rpa', label: 'RPA (Flat $)', hint: 'Revenue Per Action (fixed dollar amount per event)' },
  { id: 'hybrid', label: 'Hybrid (RPA + RPS)', hint: 'Fixed base fee plus a percentage bonus' },
];

export interface PayoutTypeOption {
  id: string;
  label: string;
  hint: string;
}

export const PAYOUT_TYPES: PayoutTypeOption[] = [
  { id: 'cpa', label: 'CPA (Flat $)', hint: 'Cost Per Action (flat dollars paid to partner)' },
  { id: 'cps', label: 'CPS (% of Sale)', hint: 'Cost Per Sale (percentage paid to partner)' },
  { id: 'hybrid', label: 'Hybrid (CPA + CPS)', hint: 'Base payout plus percentage share' },
];

export interface MacroTokenOption {
  token: string;
  paramKey: string;
  label: string;
  description: string;
}

export const OFFER_MACRO_TOKENS: MacroTokenOption[] = [
  {
    token: '{transaction_id}',
    paramKey: 'click_id',
    label: 'Transaction / Click ID',
    description: 'Mandatory unique click code generated on each link visit.',
  },
  {
    token: '{affiliate_id}',
    paramKey: 'ref',
    label: 'Partner Referral Code',
    description: 'Identifies the promoter who drove the customer.',
  },
  {
    token: '{sub1}',
    paramKey: 'sub1',
    label: 'Custom Sub-Parameter 1',
    description: 'Ad campaign, placement, or banner ID.',
  },
  {
    token: '{sub2}',
    paramKey: 'sub2',
    label: 'Custom Sub-Parameter 2',
    description: 'Audience keyword, ad set, or influencer sub-tag.',
  },
  {
    token: '{source}',
    paramKey: 'src',
    label: 'Traffic Source',
    description: 'Channel medium (e.g., google, meta, youtube, email).',
  },
];

export interface OfferCategory {
  id: string;
  name: string;
  code: string;
  color: string;
}

export const DEFAULT_OFFER_CATEGORIES: OfferCategory[] = [
  { id: 'cat-elearning', name: 'E-Learning & Courses', code: '34', color: 'bg-emerald-500' },
  { id: 'cat-software', name: 'Software & SaaS', code: '30', color: 'bg-blue-500' },
  { id: 'cat-finance', name: 'Banking & Finance', code: '12', color: 'bg-amber-500' },
  { id: 'cat-ecommerce', name: 'E-Commerce & Retail', code: '25', color: 'bg-purple-500' },
  { id: 'cat-health', name: 'Health & Wellness', code: '38', color: 'bg-teal-500' },
  { id: 'cat-telecom', name: 'Apps & Mobile Games', code: '20', color: 'bg-rose-500' },
];

export const SESSION_IDENTIFIER_OPTIONS = [
  { id: 'cookie', label: 'First-Party Browser Cookie', description: 'Standard browser cookie (recommended for web stores)' },
  { id: 'ip_ua', label: 'IP Address + User Agent Hash', description: 'Cookie-less fingerprint (safe for privacy browsers)' },
  { id: 'device_id', label: 'Mobile Advertising ID (IDFA / GAID)', description: 'Best for native iOS & Android apps' },
  { id: 'ip_only', label: 'IP Address Only', description: 'Looser matching window for special proxy traffic' },
];

export const REDIRECT_MODES = [
  { id: '302', label: 'Standard 302 Found', description: 'Fast temporary redirect, standard across affiliate networks' },
  { id: '307', label: '307 Temporary Redirect', description: 'Preserves POST bodies when redirecting forms' },
  { id: 'direct', label: 'Direct Linking (No Redirect)', description: 'Shopper lands directly via JavaScript tracking snippet' },
];
