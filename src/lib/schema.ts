import { z } from 'astro/zod';

export const partialDate = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/, {
    error: '日期格式应为 YYYY、YYYY-MM 或 YYYY-MM-DD',
  });

export const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
});

const sources = z.array(sourceSchema).min(1, { error: '至少需要一个来源' });

export const companySchema = z.object({
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  founded: partialDate,
  headquarters: z.string().min(1),
  kind: z.enum(['independent', 'studio', 'platform']),
  parent: z.string().optional(),
  status: z.enum(['active', 'acquired', 'closed', 'unknown']),
  tagline: z.string().min(1),
  website: z.url().optional(),
  logo: z.string().optional(),
  cover: z.string().optional(),
  financials: z.array(z.object({
    period: z.string().regex(/^\d{4}(-H[12])?$/),
    revenueCNY: z.number().nonnegative(),
    profitCNY: z.number().optional(),
    source: sourceSchema,
  })).optional(),
  research: z.array(z.object({
    area: z.enum(['company', 'products', 'financials', 'people']),
    status: z.enum(['reviewed', 'partial', 'searched-unconfirmed', 'pending']),
    checkedAt: partialDate,
    note: z.string().min(1),
    sources: z.array(sourceSchema).min(1),
  })).optional(),
  sources,
  verified: z.boolean().default(false),
});

export const revenueBasisSchema = z.enum(['store', 'all-platform', 'official-report']);

export const revenueEntrySchema = z.object({
  period: z.string().regex(/^\d{4}(-Q[1-4])?$/, { error: '流水期间应为 YYYY 或 YYYY-Q1..Q4' }),
  amountCNY: z.number().nonnegative(),
  kind: z.enum(['official', 'estimate']),
  basis: revenueBasisSchema.optional(),
  partial: z.boolean().default(false),
  lowerBound: z.boolean().default(false),
  source: sourceSchema,
});

export const productSchema = z.object({
  chronicles: z.array(z.enum(['female', 'casual'])).min(1).optional(),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  genre: z.enum(['otome', 'dressup', 'interactive', 'other']),
  developer: z.string().min(1),
  publisher: z.string().min(1),
  released: partialDate,
  shutdown: partialDate.optional(),
  platforms: z.array(z.string()).min(1),
  status: z.enum(['live', 'shutdown', 'unknown']),
  versionLabel: z.string().min(1).optional(),
  lifecycleNotes: z.array(z.object({ note: z.string().min(1), sources: z.array(sourceSchema).min(1) })).optional(),
  significance: z.string().min(1),
  cover: z.string().optional(),
  keyArt: z.string().optional(),
  teamEvidence: z.array(z.object({
    observedAt: partialDate,
    kind: z.enum(['official', 'reported']),
    summary: z.string().min(1),
    sources: z.array(sourceSchema).min(1),
  })).optional(),
  personnelResearch: z.object({
    status: z.enum(['searched-unconfirmed', 'documented']),
    checkedAt: partialDate,
    note: z.string().min(1),
    sources: z.array(sourceSchema).min(1),
  }).optional(),
  artPosition: z.enum(['top', 'center', 'bottom', 'center 25%']).optional(),
  revenue: z.array(revenueEntrySchema).default([]),
  sources,
  verified: z.boolean().default(false),
});

export const personTitleSchema = z.enum([
  'founder',
  'chair',
  'ceo',
  'president',
  'producer',
  'executive-producer',
  'creative-director',
  'lead-designer',
  'core-designer',
  'lead-artist',
  'core-artist',
  'writer',
  'music',
  'other',
]);

export const roleSchema = z
  .object({
    company: z.string().min(1),
    scope: z.enum(['company', 'product']),
    products: z.array(z.string()).default([]),
    title: personTitleSchema,
    titleNote: z.string().optional(),
    from: partialDate,
    to: partialDate.optional(),
    status: z.enum(['active', 'departed', 'unknown']).optional(),
    dateBasis: z.enum(['employment', 'public-observation', 'unknown']).optional(),
    sources: z.array(sourceSchema).min(1).optional(),
    checkedAt: partialDate.optional(),
    note: z.string().optional(),
  })
  .superRefine((role, ctx) => {
    if (role.status === 'active' && (role.to || !role.checkedAt || !role.sources?.length)) {
      ctx.addIssue({ code: 'custom', message: '确认在任需来源、核实日期且不能有离任日期', path: ['status'] });
    }
    if (role.scope === 'product' && role.products.length === 0) {
      ctx.addIssue({ code: 'custom', message: '产品署名必须挂至少一个产品 id', path: ['products'] });
    }
    if (role.scope === 'company' && role.products.length > 0) {
      ctx.addIssue({ code: 'custom', message: '公司职务不要挂产品 id', path: ['products'] });
    }
    if (role.title === 'other' && !role.titleNote?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'title 为 other 时必须写 titleNote', path: ['titleNote'] });
    }
  });

export const personSchema = z.object({
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  avatar: z.string().optional(),
  bio: z.string().min(1),
  linkedin: z.url().optional(),
  maimai: z.url().optional(),
  weibo: z.url().optional(),
  roles: z.array(roleSchema).min(1),
  sources,
  verified: z.boolean().default(false),
});

export const eventSchema = z.object({
  date: partialDate,
  type: z.enum(['funding', 'ipo', 'acquisition', 'rename', 'layoff', 'departure', 'controversy', 'milestone']),
  companies: z.array(z.string()).min(1),
  products: z.array(z.string()).default([]),
  summary: z.string().min(1),
  sources,
  verified: z.boolean().default(false),
});

export const marketEntrySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  amountCNY: z.number().positive(),
  kind: z.enum(['official', 'estimate']),
  scope: z.string().min(1),
  source: sourceSchema,
  verified: z.boolean().default(false),
  note: z.string().optional(),
});
