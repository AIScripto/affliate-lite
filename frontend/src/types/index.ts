export type UserRole = 'ADMIN' | 'PUBLISHER';
export type PublisherStatus = 'ACTIVE' | 'INACTIVE' | 'PAUSED';
export type DomainStatus = 'ACTIVE' | 'INACTIVE';
export type NetworkStatus = 'ACTIVE' | 'INACTIVE';
export type OfferVisibility = 'PUBLIC' | 'PRIVATE' | 'REQUIRES_APPROVAL';
export type OfferStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';
export type PaymentModel = 'CPA' | 'CPC' | 'CPM' | 'REVSHARE';

export type PublisherType = 'Publisher' | 'SubPublisher';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: PublisherStatus;
  publisherType?: PublisherType;
  postbackUrl?: string | null;
  assignedOffers?: Array<{ offer: { id: number; name: string } }>;
  createdAt?: string;
  offersCount?: number;
  _count?: {
    assignedOffers?: number;
    clicks?: number;
    conversions?: number;
  };
}

export interface Domain {
  id: number;
  name: string;
  status: DomainStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Network {
  id: number;
  name: string;
  contactDetails?: string | null;
  allowDuplicateConversions: boolean;
  status: NetworkStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface OfferTargetingUrl {
  id?: string;
  title: string;
  url: string;
  weight?: number;
  isEnabled?: boolean;
}

export interface OfferTargetingGroup {
  id?: number;
  name: string;
  condition: 'AND' | 'OR';
  isEnabled?: boolean;
  preset?: string | null;
  affiliateIds?: number[];
  devices: string[];
  countries: string[];
  excludeCountries: boolean;
  cities: string[];
  excludeCities: boolean;
  regions: string[];
  excludeRegions: boolean;
  operatingSystems?: string[];
  browsers?: string[];
  connectionTypes?: string[];
  carriers?: string[];
  ips?: string[];
  languages?: string[];
  additionalUrls?: OfferTargetingUrl[];
}

export interface OfferPayout {
  id?: number;
  paymentModel: PaymentModel;
  currency: string;
  revenue: number;
  payout: number;
}

export interface Offer {
  id: number;
  name: string;
  advertiserId: number;
  advertiser?: Network;
  domainId?: number | null;
  domain?: Domain | null;
  visibility: OfferVisibility;
  status: OfferStatus;
  previewUrl?: string | null;
  description?: string | null;
  baseDestinationUrl: string;
  trafficbackUrl?: string | null;
  cookieLifetimeDays?: number;
  clickSessionLifespanHours?: number;
  allowConversionsWithoutSession?: boolean;
  enforceIpUniqueness: boolean;
  blockDuplicateIps: boolean;
  globalPostbackUrl?: string | null;
  postbackMacroParam?: string | null;
  advertiserSecurityToken?: string | null;
  targetingGroups?: OfferTargetingGroup[];
  payouts?: OfferPayout[];
  clicksCount?: number;
  conversionsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  clicks: number;
  clicksGrowth: string;
  conversions: number;
  conversionsGrowth: string;
  payout: number;
  revenue?: number;
  epc: number;
  currency: string;
  trafficStats: Array<{
    date: string;
    conversions: number;
    clicks: number;
    profit?: number;
    income?: number;
  }>;
  topOffers: Array<{
    id: number;
    name: string;
    clicks: number;
    conversions: number;
  }>;
  topPublishers: Array<{
    id: number;
    name: string;
    clicks: number;
    conversions: number;
  }>;
}

export interface AffiliatesDualList {
  allAffiliates: Array<{ id: number; name: string; email: string; status: string }>;
  enabledAffiliates: Array<{ id: number; name: string; email: string; status: string }>;
}

export interface NetworkReportItem {
  id: number;
  name: string;
  offer: string;
  clicks: number;
  conversionsApproved: number;
  conversionsUnchecked: number;
  conversionsTotal: number;
  payout: number;
  revenue?: number;
}

export interface NetworkReportResponse {
  data: NetworkReportItem[];
  summary: {
    totalClicks: number;
    totalApproved: number;
    totalUnchecked: number;
    totalConversions: number;
    totalPayout: number;
    totalRevenue?: number;
  };
}

export interface OfferReportItem {
  id: number;
  name: string;
  conversions: number;
  payout: number;
  clicks: number;
  epc: number;
}

export interface OfferReportResponse {
  data: OfferReportItem[];
  summary: {
    totalConversions: number;
    totalPayout: number;
    totalClicks: number;
    weightedEpc: number;
  };
}

export interface PublisherReportItem {
  id: number;
  name: string;
  offer: string;
  clicks: number;
  conversionsApproved: number;
  conversionsUnchecked: number;
  conversionsTotal: number;
  epc: number;
  payout: number;
}

export interface PublisherReportResponse {
  data: PublisherReportItem[];
  summary: {
    totalClicks: number;
    totalApproved: number;
    totalUnchecked: number;
    totalConversions: number;
    weightedEpc: number;
    totalPayout: number;
  };
}
