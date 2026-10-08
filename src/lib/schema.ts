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
  status: z.enum(['active', 'acquired', 'closed']),
  tagline: z.string().min(1),
  website: z.url().optional(),
  logo: z.string().optional(),
  cover: z.string().optional(),
  sources,
  verified: z.boolean().default(false),
});

export const revenueEntrySchema = z.object({
  period: z.string().regex(/^\d{4}(-Q[1-4])?$/, { error: '流水期间应为 YYYY 或 YYYY-Q1..Q4' }),
  amountCNY: z.number().nonnegative(),
  kind: z.enum(['official', 'estimate']),
  source: sourceSchema,
});

export const productSchema = z.object({
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  genre: z.enum(['otome', 'dressup', 'interactive', 'other']),
  developer: z.string().min(1),
  publisher: z.string().min(1),
  released: partialDate,
  shutdown: partialDate.optional(),
  platforms: z.array(z.string()).min(1),
  status: z.enum(['live', 'shutdown']),
  significance: z.string().min(1),
  cover: z.string().optional(),
  keyArt: z.string().optional(),
  revenue: z.array(revenueEntrySchema).default([]),
  sources,
  verified: z.boolean().default(false),
});

export const roleSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  from: partialDate,
  to: partialDate.optional(),
});

export const personSchema = z.object({
  name: z.string().min(1),
  avatar: z.string().optional(),
  bio: z.string().min(1),
  roles: z.array(roleSchema).min(1),
  sources,
  verified: z.boolean().default(false),
});

export const eventSchema = z.object({
  date: partialDate,
  type: z.enum(['funding', 'ipo', 'acquisition', 'rename', 'layoff', 'controversy', 'milestone']),
  companies: z.array(z.string()).min(1),
  products: z.array(z.string()).default([]),
  summary: z.string().min(1),
  sources,
  verified: z.boolean().default(false),
});
