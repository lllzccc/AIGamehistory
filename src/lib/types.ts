import type { z } from 'astro/zod';
import type {
  companySchema,
  eventSchema,
  personSchema,
  productSchema,
  revenueEntrySchema,
  roleSchema,
  sourceSchema,
} from './schema';

export type Source = z.infer<typeof sourceSchema>;
export type Company = z.infer<typeof companySchema> & { id: string };
export type RevenueEntry = z.infer<typeof revenueEntrySchema>;
export type Product = z.infer<typeof productSchema> & { id: string };
export type Role = z.infer<typeof roleSchema>;
export type Person = z.infer<typeof personSchema> & { id: string };
export type ChronicleEvent = z.infer<typeof eventSchema> & { id: string };
export type EventType = ChronicleEvent['type'];

export interface Dataset {
  companies: Company[];
  products: Product[];
  people: Person[];
  events: ChronicleEvent[];
}

export interface RevenuePoint {
  period: string;
  x: number;
  amountCNY: number;
  kind: RevenueEntry['kind'];
  sourceTitle: string;
  sourceUrl: string;
}

export type ProductCard = Product & {
  developerName: string;
  publisherName: string;
  series: RevenuePoint[];
};

export type TimelineKind = 'founded' | 'launch' | 'shutdown' | EventType;

export interface TimelineItem {
  date: string;
  kind: TimelineKind;
  label: string;
  productId?: string;
  verified: boolean;
}

export interface CompanyPerson {
  person: Person;
  roles: Role[];
  elsewhere: Role[];
}

export interface CompanyView {
  company: Company;
  products: Product[];
  people: CompanyPerson[];
  events: ChronicleEvent[];
  timeline: TimelineItem[];
}
