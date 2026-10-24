import {
  DashboardSummary,
  Domain,
  Network,
  Offer,
  User,
  AffiliatesDualList,
  NetworkReportResponse,
  OfferReportResponse,
  PublisherReportResponse,
  PublisherStatus,
  DomainStatus,
  NetworkStatus,
  OfferStatus
} from '../types';

const API_BASE = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error) {
        errorMessage = errJson.error;
      } else if (errJson.message) {
        errorMessage = errJson.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

// ==================== DASHBOARD ====================
export async function fetchDashboardSummary(
  startDate?: string,
  endDate?: string
): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_BASE}/dashboard/summary${query}`);
  const raw = await handleResponse<any>(res);

  if (raw.kpis) {
    return {
      clicks: raw.kpis.clicks?.total ?? 0,
      clicksGrowth: raw.kpis.clicks?.trendPercent ? `+${raw.kpis.clicks.trendPercent}% Today` : '+136% Today',
      conversions: raw.kpis.conversions?.total ?? 0,
      conversionsGrowth: raw.kpis.conversions?.trendPercent ? `+${raw.kpis.conversions.trendPercent}% Today` : '+200% Today',
      payout: raw.kpis.payout?.total ?? 0,
      revenue: raw.kpis.revenue?.total ?? 0,
      epc: raw.kpis.epc?.total ?? 0,
      currency: raw.kpis.payout?.currency ?? 'USD',
      trafficStats: (raw.trafficLast30Days || []).map((t: any) => ({
        date: t.date,
        conversions: t.conversions ?? 0,
        clicks: t.clicks ?? 0,
        profit: t.totalProfit ?? t.profit ?? 0,
        income: t.totalIncome ?? t.income ?? 0,
      })),
      topOffers: raw.topOffers || [],
      topPublishers: raw.topPublishers || [],
    };
  }

  return raw as DashboardSummary;
}

// ==================== PUBLISHERS ====================
export async function fetchPublishers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/publishers`);
  const raw = await handleResponse<any>(res);
  return Array.isArray(raw) ? raw : (raw?.data || raw?.publishers || []);
}

export async function createPublisher(data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/publishers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<User>(res);
}

export async function updatePublisher(
  id: number,
  data: { name?: string; email?: string; password?: string }
): Promise<User> {
  const res = await fetch(`${API_BASE}/publishers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<User>(res);
}

export async function updatePublisherStatus(
  id: number,
  status: PublisherStatus
): Promise<User> {
  const res = await fetch(`${API_BASE}/publishers/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse<User>(res);
}

export async function deletePublisher(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/publishers/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ success: boolean }>(res);
}

// ==================== DOMAINS ====================
export async function fetchDomains(): Promise<Domain[]> {
  const res = await fetch(`${API_BASE}/domains`);
  const raw = await handleResponse<any>(res);
  return Array.isArray(raw) ? raw : (raw?.domains || raw?.data || []);
}

export async function createDomain(name: string): Promise<Domain> {
  const res = await fetch(`${API_BASE}/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse<Domain>(res);
}

export async function updateDomainStatus(
  id: number,
  status: DomainStatus
): Promise<Domain> {
  const res = await fetch(`${API_BASE}/domains/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Domain>(res);
}

export async function deleteDomain(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/domains/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ success: boolean }>(res);
}

// ==================== NETWORKS ====================
export async function fetchNetworks(): Promise<Network[]> {
  const res = await fetch(`${API_BASE}/networks`);
  const raw = await handleResponse<any>(res);
  return Array.isArray(raw) ? raw : (raw?.networks || raw?.data || []);
}

export async function createNetwork(data: {
  name: string;
  contactDetails?: string;
  allowDuplicateConversions?: boolean;
}): Promise<Network> {
  const res = await fetch(`${API_BASE}/networks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Network>(res);
}

export async function updateNetwork(
  id: number,
  data: {
    name?: string;
    contactDetails?: string;
    allowDuplicateConversions?: boolean;
  }
): Promise<Network> {
  const res = await fetch(`${API_BASE}/networks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Network>(res);
}

export async function updateNetworkStatus(
  id: number,
  status: NetworkStatus
): Promise<Network> {
  const res = await fetch(`${API_BASE}/networks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Network>(res);
}

export async function deleteNetwork(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/networks/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ success: boolean }>(res);
}

// ==================== OFFERS ====================
export async function fetchOffers(): Promise<Offer[]> {
  const res = await fetch(`${API_BASE}/offers`);
  const raw = await handleResponse<any>(res);
  return Array.isArray(raw) ? raw : (raw?.offers || raw?.data || []);
}

export async function fetchOffer(id: number): Promise<Offer> {
  const res = await fetch(`${API_BASE}/offers/${id}`);
  return handleResponse<Offer>(res);
}

export async function createOffer(data: any): Promise<Offer> {
  const res = await fetch(`${API_BASE}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Offer>(res);
}

export async function updateOffer(id: number, data: any): Promise<Offer> {
  const res = await fetch(`${API_BASE}/offers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Offer>(res);
}

export async function duplicateOffer(id: number): Promise<Offer> {
  const res = await fetch(`${API_BASE}/offers/${id}/duplicate`, {
    method: 'POST',
  });
  return handleResponse<Offer>(res);
}

export async function updateOfferStatus(
  id: number,
  status: OfferStatus
): Promise<Offer> {
  const res = await fetch(`${API_BASE}/offers/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Offer>(res);
}

export async function deleteOffer(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/offers/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ success: boolean }>(res);
}

// ==================== AFFILIATES (DUAL-LIST) ====================
export async function fetchOfferAffiliates(offerId: number): Promise<AffiliatesDualList> {
  const res = await fetch(`${API_BASE}/offers/${offerId}/affiliates`);
  return handleResponse<AffiliatesDualList>(res);
}

export async function assignOfferAffiliate(
  offerId: number,
  publisherId: number
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/offers/${offerId}/affiliates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publisherId }),
  });
  return handleResponse<{ success: boolean }>(res);
}

export async function revokeOfferAffiliate(
  offerId: number,
  publisherId: number
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/offers/${offerId}/affiliates/${publisherId}`, {
    method: 'DELETE',
  });
  return handleResponse<{ success: boolean }>(res);
}

// ==================== REPORTS ====================
export async function fetchNetworksReport(
  startDate?: string,
  endDate?: string
): Promise<NetworkReportResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_BASE}/reports/networks${query}`);
  return handleResponse<NetworkReportResponse>(res);
}

export async function fetchOffersReport(
  startDate?: string,
  endDate?: string
): Promise<OfferReportResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_BASE}/reports/offers${query}`);
  return handleResponse<OfferReportResponse>(res);
}

export async function fetchPublishersReport(
  startDate?: string,
  endDate?: string
): Promise<PublisherReportResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_BASE}/reports/publishers${query}`);
  return handleResponse<PublisherReportResponse>(res);
}
