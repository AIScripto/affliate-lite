import { BrandParam, User } from '../types';

const API_BASE = ''; // Uses Vite proxy in development or direct host

export async function fetchMasterReports() {
  const res = await fetch(`${API_BASE}/api/reports/master`);
  if (!res.ok) throw new Error('Failed to fetch master reports');
  return res.json();
}

export async function fetchBrandParams() {
  const res = await fetch(`${API_BASE}/api/admin/brand-params`);
  if (!res.ok) throw new Error('Failed to fetch brand parameters');
  return res.json();
}

export async function saveBrandParam(data: Partial<BrandParam>) {
  const res = await fetch(`${API_BASE}/api/admin/brand-params`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save brand parameter');
  return res.json();
}

export async function deleteBrandParam(id: string) {
  const res = await fetch(`${API_BASE}/api/admin/brand-params/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete brand parameter');
  return res.json();
}

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function createProduct(data: {
  brand_id: string;
  title: string;
  slug: string;
  destination_url: string;
  retail_price: number;
  default_comm_pct?: number;
  image_url?: string;
}) {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create product');
  }
  return res.json();
}

export async function updateProduct(id: string, data: Partial<{
  brand_id: string;
  title: string;
  slug: string;
  destination_url: string;
  retail_price: number;
  default_comm_pct: number;
  image_url: string;
  is_active: boolean;
}>) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  const res = await fetch(`${API_BASE}/api/products/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) throw new Error('Failed to toggle product status');
  return res.json();
}

export async function fetchUsers(): Promise<{ users: User[] }> {
  const res = await fetch(`${API_BASE}/api/auth/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createSubAffiliate(data: {
  first_name: string;
  last_name?: string;
  mobile_number?: string;
  email: string;
  status?: 'active' | 'inactive';
  ref_code?: string;
  split_pct?: number;
}) {
  const res = await fetch(`${API_BASE}/api/auth/register-sub`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create sub-affiliate');
  }
  return res.json();
}

export async function updateSubAffiliate(id: string, data: Partial<{
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  split_pct: number;
  status: 'active' | 'inactive';
}>) {
  const res = await fetch(`${API_BASE}/api/auth/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update partner');
  return res.json();
}

export async function deleteSubAffiliate(id: string) {
  const res = await fetch(`${API_BASE}/api/auth/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete partner account');
  return res.json();
}

export async function toggleUserStatus(userId: string, status: 'active' | 'inactive') {
  const res = await fetch(`${API_BASE}/api/auth/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update partner status');
  return res.json();
}

export async function fetchPortalStats(refCode: string) {
  const res = await fetch(`${API_BASE}/api/portal/my-stats?ref_code=${encodeURIComponent(refCode)}`);
  if (!res.ok) throw new Error('Failed to fetch portal stats');
  return res.json();
}

export async function requestPayout(userId: string, amount?: number) {
  const res = await fetch(`${API_BASE}/api/portal/payout-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, amount }),
  });
  if (!res.ok) throw new Error('Failed to request payout');
  return res.json();
}

export async function firePostback(payload: {
  click_id: string;
  order_id: string;
  sale_amount: number;
  gross_comm: number;
  secret?: string;
}) {
  const res = await fetch(`${API_BASE}/api/v1/postback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function simulateClick(slug: string, params: { ref: string; src: string; camp: string }) {
  const query = new URLSearchParams({
    ...params,
    json: 'true',
  }).toString();

  const res = await fetch(`${API_BASE}/go/${slug}?${query}`);
  return res.json();
}
