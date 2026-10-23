export type UserRole = 'admin' | 'sub_aff';

export interface User {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  status: 'active' | 'inactive';
  role: UserRole;
  ref_code: string;
  split_pct: number;
  wallet_pending: number;
  wallet_approved: number;
  created_at?: string;
}

export interface CustomParamDefinition {
  id: string;
  name: string;
  param_key: string;
  token: string;
  default_value?: string;
  category?: 'attribution' | 'campaign' | 'device' | 'custom';
}

export interface BrandParam {
  id: string;
  brand_name: string;
  master_aff_id: string;
  url_template: string;
  click_id_param_key: string;
  sub_ref_param_key: string;
  postback_secret: string;
  custom_params?: CustomParamDefinition[];
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  brand_id: string;
  brand_name: string;
  title: string;
  slug: string;
  destination_url: string;
  retail_price: number;
  default_comm_pct: number;
  image_url?: string;
  is_active: boolean;
  url_template?: string;
}

export interface MasterReportSummary {
  totalClicks: number;
  totalSalesVolume: number;
  totalGrossComm: number;
  directProfit: number;
  subOverrideProfit: number;
  subPayableLiability: number;
}

export interface DirectVsSubItem {
  category: string;
  clicks: number;
  orders: number;
  total_sale_amount: number;
  gross_commission: number;
  sub_payout: number;
  net_master_profit: number;
  conversion_rate: number;
  epc: number;
}

export interface LeaderboardItem {
  id: string;
  full_name: string;
  ref_code: string;
  split_pct: number;
  wallet_pending: number;
  wallet_approved: number;
  clicks: number;
  orders: number;
  volume: number;
  gross_commission: number;
  sub_earnings: number;
  master_override: number;
  cr_pct: number;
  epc: number;
  is_suspicious_spike: boolean;
}

export interface TrafficSourceItem {
  source: string;
  clicks: number;
  conversions: number;
  total_commission: number;
  cr_pct: number;
}

export interface ConversionStreamItem {
  id: string;
  click_id: string;
  brand_order_id: string;
  sale_amount: number;
  gross_comm: number;
  sub_pay: number;
  net_profit: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  ref_code: string;
  src: string;
  camp: string;
  promoter: string;
  brand_name: string;
  product_title: string;
}

export interface SubAffiliateStatsResponse {
  success: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    refCode: string;
    splitPct: number;
    walletPending: number;
    walletApproved: number;
  };
  metrics: {
    clicks30d: number;
    orders: number;
    conversionRate: number;
    epc: number;
    totalEarned: number;
  };
  trafficBySource: Array<{
    source: string;
    clicks: number;
    orders_sold: number;
    earned: number;
    epc: number;
    cr_pct: number;
  }>;
  personalLedger: Array<{
    id: string;
    click_id: string;
    brand_order_id: string;
    sale_amount: number;
    my_commission: number;
    status: string;
    created_at: string;
    src: string;
    camp: string;
    product_name: string;
    brand_name: string;
  }>;
}
