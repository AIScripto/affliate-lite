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
  postbackExtraQuery?: string | null;
  postbackCustomParams?: any;
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
  documentNumber?: string;
  name: string;
  networkName?: string;
  offer: string;
  offerName?: string;
  clicks: number;
  conversionsApproved: number;
  conversionsUnchecked: number;
  conversionsTotal: number;
  approvedConversions?: number;
  uncheckedConversions?: number;
  totalConversions?: number;
  payout: number;
  revenue?: number;
  cr?: number;
  netAmount?: number;
  gross?: number;
}

export interface NetworkReportResponse {
  data: NetworkReportItem[];
  rows?: NetworkReportItem[];
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
  documentNumber?: string;
  name: string;
  offerName?: string;
  networkName?: string;
  conversions: number;
  totalConversions?: number;
  payout: number;
  revenue?: number;
  clicks: number;
  epc: number;
  cr?: number;
}

export interface OfferReportResponse {
  data: OfferReportItem[];
  rows?: OfferReportItem[];
  summary: {
    totalConversions: number;
    totalPayout: number;
    totalClicks: number;
    weightedEpc: number;
    averageEpc?: number;
  };
}

export interface PublisherReportItem {
  id: number;
  documentNumber?: string;
  name: string;
  publisherName?: string;
  offer: string;
  offerName?: string;
  clicks: number;
  conversionsApproved: number;
  conversionsUnchecked: number;
  conversionsTotal: number;
  approvedConversions?: number;
  uncheckedConversions?: number;
  totalConversions?: number;
  epc: number;
  payout: number;
  revenue?: number;
}

export interface PublisherReportResponse {
  data: PublisherReportItem[];
  rows?: PublisherReportItem[];
  summary: {
    totalClicks: number;
    totalApproved: number;
    totalUnchecked: number;
    totalConversions: number;
    weightedEpc: number;
    averageEpc?: number;
    totalPayout: number;
  };
}

export interface ReportsOverviewResponse {
  summary: {
    totalClicks: number;
    totalConversions: number;
    approvedConversions: number;
    uncheckedConversions: number;
    declinedConversions: number;
    totalPayout: number;
    totalRevenue: number;
    netMargin: number;
    marginPercent: number;
    overallCr: number;
    averageEpc: number;
  };
  topOffers: Array<{
    id: number;
    name: string;
    networkName: string;
    clicks: number;
    conversions: number;
    cr: number;
    payout: number;
    revenue: number;
    epc: number;
  }>;
  topNetworks: Array<{
    id: number;
    name: string;
    conversions: number;
    payout: number;
    revenue: number;
  }>;
  topPublishers: Array<{
    id: number;
    name: string;
    conversions: number;
    payout: number;
  }>;
  recentConversions: Array<{
    id: number;
    clickId: string;
    externalTxId: string;
    offerName: string;
    networkName: string;
    publisherName: string;
    goalValue: string;
    status: string;
    currency: string;
    payout: number;
    revenue: number;
    createdAt: string;
  }>;
}

export interface ConversionReportItem {
  id: number;
  date: string;
  documentNumber: string;
  clickId: string;
  externalTxId: string;
  offerId: number;
  offerName: string;
  networkId: number;
  networkName: string;
  publisherId: number;
  publisherName: string;
  goalValue: string;
  status: string;
  currency: string;
  ipAddress: string;
  countryCode: string;
  deviceType: string;
  subId: string;
  payout: number;
  revenue: number;
  gross: number;
  netAmount: number;
}

export interface ConversionReportResponse {
  data: ConversionReportItem[];
  summary: {
    totalRecords: number;
    totalPayout: number;
    totalRevenue: number;
  };
  total: number;
}

export interface TrafficReportItem {
  id: string;
  date: string;
  documentNumber: string;
  clickId: string;
  offerId: number;
  offerName: string;
  publisherId: number;
  publisherName: string;
  ipAddress: string;
  countryCode: string;
  deviceType: string;
  subId: string;
  hasConversion: boolean;
  conversionStatus: string;
  payout: number;
  revenue: number;
}

export interface TrafficReportResponse {
  data: TrafficReportItem[];
  total: number;
}
