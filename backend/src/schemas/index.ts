import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please fill out this field.'),
});

export const CreatePublisherSchema = z.object({
  name: z.string().trim().min(1, 'Please fill out this field.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Please fill out this field.'),
  publisherType: z.enum(['Publisher', 'SubPublisher']).default('Publisher').optional(),
  postbackUrl: z.string().optional().or(z.literal('')),
  offerIds: z.array(z.number().int()).optional(),
});

export const UpdatePublisherSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(6).optional(),
  publisherType: z.enum(['Publisher', 'SubPublisher']).optional(),
  postbackUrl: z.string().optional().or(z.literal('')),
  offerIds: z.array(z.number().int()).optional(),
});

export const UpdatePublisherStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PAUSED'], {
    errorMap: () => ({ message: 'Please select a valid status.' }),
  }),
});

export const CreateDomainSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please fill out this field.')
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain hostname'),
});

export const UpdateDomainStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const CreateNetworkSchema = z.object({
  name: z.string().trim().min(1, 'Please fill out this field.'),
  contactDetails: z.string().trim().optional().default(''),
  allowDuplicateConversions: z.boolean().default(false),
});

export const UpdateNetworkSchema = z.object({
  name: z.string().trim().min(1).optional(),
  contactDetails: z.string().trim().optional(),
  allowDuplicateConversions: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PAUSED', 'DISABLED']).optional(),
});

export const UpsertOfferSchema = z.object({
  general: z.object({
    name: z.string().trim().min(2, 'Please fill out this field.'),
    networkId: z.number().int().positive('Please select a valid network/advertiser.'),
    visibility: z.enum(['PUBLIC', 'PRIVATE', 'REQUIRES_APPROVAL']).default('PRIVATE'),
    status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED']).default('ACTIVE'),
    previewUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().optional().default(''),
  }),
  tracking: z.object({
    domainId: z.number().int().positive().optional().nullable(),
    destinationUrl: z.string().trim().min(5, 'Please enter a valid destination URL.'),
    trafficbackUrl: z.string().trim().optional().nullable().or(z.literal('')),
    cookieLifetimeDays: z.number().int().min(1).max(365).default(30).optional(),
    clickSessionLifespanHours: z.number().int().min(1).default(24).optional(),
    allowConversionsWithoutSession: z.boolean().default(false).optional(),
    enforceIpUniqueness: z.boolean().default(false),
    blockDuplicateIps: z.boolean().default(false),
    postbackMacroParam: z.string().optional().default('{clickid}'),
    advertiserSecurityToken: z.string().optional().nullable().or(z.literal('')),
    postbackExtraQuery: z.string().optional().default(''),
    postbackCustomParams: z.any().optional().nullable(),
  }),
  targeting: z.object({
    name: z.string().default('Targeting group #1'),
    conditionOp: z.enum(['AND', 'OR']).default('AND'),
    isEnabled: z.boolean().default(true),
    preset: z.string().optional().nullable().or(z.literal('')),
    affiliateIds: z.array(z.number().int()).default([]),
    devices: z.array(z.string()).default(['ALL']),
    countries: z.array(z.string()).default(['ALL']),
    excludeCountries: z.boolean().default(false),
    cities: z.array(z.string()).default([]),
    excludeCities: z.boolean().default(false),
    regions: z.array(z.string()).default([]),
    excludeRegions: z.boolean().default(false),
    operatingSystems: z.array(z.string()).default([]),
    browsers: z.array(z.string()).default([]),
    connectionTypes: z.array(z.string()).default([]),
    carriers: z.array(z.string()).default([]),
    ips: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    additionalUrls: z.array(z.any()).default([]),
  }),
  affiliates: z.object({
    enabledPublisherIds: z.array(z.number().int().positive()).default([]),
  }),
  revenuePayouts: z.object({
    title: z.string().default('Default'),
    goalValue: z.string().default('1'),
    paymentModel: z.enum(['CPA_FIXED', 'CPC', 'CPM', 'REVSHARE']).default('CPA_FIXED'),
    currency: z.enum(['USD', 'EUR', 'GBP', 'PKR', 'AED']).default('USD'),
    revenue: z.number().nonnegative('Revenue must be >= 0'),
    payout: z.number().nonnegative('Payout must be >= 0'),
  }),
});

export const DashboardQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'PKR', 'AED']).default('USD'),
});

export const ClickQuerySchema = z.object({
  offer_id: z.string().regex(/^\d+$/, 'Invalid offer_id'),
  aff_id: z.string().regex(/^\d+$/, 'Invalid aff_id'),
  sub_id: z.string().optional(),
});

export const PostbackQuerySchema = z.object({
  clickid: z.string().uuid('Valid clickid UUID is required'),
  goal: z.string().optional().default('1'),
  sum: z.string().optional(),
  status: z.string().optional().default('1'),
});

export const ReportQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional().default(''),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});
