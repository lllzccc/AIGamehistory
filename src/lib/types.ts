import type { z } from 'astro/zod';
import type {
  companySchema,
  eventSchema,
  marketEntrySchema,
  orgUnitKindSchema,
  orgUnitSchema,
  personSchema,
  personTitleSchema,
  productSchema,
  revenueBasisSchema,
  revenueEntrySchema,
  roleSchema,
  sourceSchema,
} from './schema';

export type Source = z.infer<typeof sourceSchema>;
export type Company = z.infer<typeof companySchema> & { id: string };
export type OrgUnit = z.infer<typeof orgUnitSchema>;
export type OrgUnitKind = z.infer<typeof orgUnitKindSchema>;
export type RevenueBasis = z.infer<typeof revenueBasisSchema>;
export type RevenueEntry = z.infer<typeof revenueEntrySchema>;
export type Product = z.infer<typeof productSchema> & { id: string };
export type PersonTitle = z.infer<typeof personTitleSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Person = z.infer<typeof personSchema> & { id: string };
export type ChronicleEvent = z.infer<typeof eventSchema> & { id: string };
export type MarketEntry = z.infer<typeof marketEntrySchema> & { id: string };
export type EventType = ChronicleEvent['type'];
export type Genre = Product['genre'];
export type GenreFilter = Genre | 'all';

export interface Dataset {
  companies: Company[];
  products: Product[];
  people: Person[];
  events: ChronicleEvent[];
  market: MarketEntry[];
}

export interface RevenuePoint {
  period: string;
  x: number;
  amountCNY: number;
  kind: RevenueEntry['kind'];
  basis?: RevenueBasis;
  partial: boolean;
  lowerBound: boolean;
  sourceTitle: string;
  sourceUrl: string;
}

export type TimelineKind = 'founded' | 'launch' | 'shutdown' | EventType;

export interface TimelineItem {
  id: string;
  date: string;
  kind: TimelineKind;
  label: string;
  productIds: string[];
  sources: Source[];
  verified: boolean;
}

export interface ProductCredit {
  person: Person;
  role: Role;
}

export type ProductCard = Product & {
  developerName: string;
  publisherName: string;
  publisherId?: string;
  series: RevenuePoint[];
  milestones: TimelineItem[];
  credits: ProductCredit[];
};

export interface PersonView {
  person: Person;
  roles: Role[];
}

export interface CompanyPerson {
  person: Person;
  roles: Role[];
  elsewhere: Role[];
}

export interface TalentMapGroup {
  product: Product;
  credits: ProductCredit[];
}

export interface CompanyView {
  company: Company;
  products: Product[];
  people: CompanyPerson[];
  talentMap: TalentMapGroup[];
  events: ChronicleEvent[];
  timeline: TimelineItem[];
}

export interface MarketPoint {
  year: number;
  amountCNY: number;
  kind: MarketEntry['kind'];
  scope: string;
  sourceTitle: string;
  sourceUrl: string;
  verified: boolean;
}

export interface RiverCompany {
  id: string;
  name: string;
  aliases?: string[];
  tagline: string;
  kind: Company['kind'];
  logo?: string;
  founded: string;
  verified: boolean;
  genres: Genre[];
}

export interface RiverEvent extends TimelineItem {
  companies: { id: string; name: string }[];
  genres: Genre[];
}

export interface YearBucket {
  year: number;
  founded: RiverCompany[];
  launches: ProductCard[];
  events: RiverEvent[];
}

export interface CompareLane {
  company: Company;
  products: ProductCard[];
  events: ChronicleEvent[];
}
