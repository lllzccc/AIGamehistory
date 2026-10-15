import { CREDIT_TITLE_ORDER } from './labels';
import { compareDates, periodToNumber, yearOf } from './dates';
import type {
  ChronicleEvent,
  Company,
  CompanyView,
  CompareLane,
  Dataset,
  Genre,
  GenreFilter,
  MarketPoint,
  PersonView,
  Product,
  ProductCard,
  ProductCredit,
  RevenuePoint,
  TalentMapGroup,
  RiverCompany,
  RiverEvent,
  TimelineItem,
  YearBucket,
} from './types';

const GENRE_ORDER: Genre[] = ['otome', 'dressup', 'palace', 'court', 'interactive', 'rpg', 'strategy', 'other'];

function byDate<T>(get: (item: T) => string) {
  return (a: T, b: T) => compareDates(get(a), get(b));
}

function uniqueGenres(products: Product[]): Genre[] {
  const present = new Set(products.map((p) => p.genre));
  return GENRE_ORDER.filter((g) => present.has(g));
}

export function displayCompanyName(ds: Dataset, idOrName: string): string {
  return ds.companies.find((c) => c.id === idOrName)?.name ?? idOrName;
}

export function listFreePublishers(ds: Dataset): string[] {
  const companyIds = new Set(ds.companies.map((c) => c.id));
  return [...new Set(ds.products.map((p) => p.publisher).filter((name) => !companyIds.has(name)))].sort((a, b) =>
    a.localeCompare(b, 'zh-CN'),
  );
}

export function checkIntegrity(ds: Dataset): string[] {
  const companyIds = new Set(ds.companies.map((c) => c.id));
  const productIds = new Set(ds.products.map((p) => p.id));
  const errors: string[] = [];

  for (const product of ds.products) {
    if (!companyIds.has(product.developer)) {
      errors.push(`产品 ${product.id}：研发方 "${product.developer}" 不是已收录公司的 id`);
    }
    const granularities = new Set(product.revenue.map((r) => r.period.includes('-Q')));
    if (granularities.size > 1) {
      errors.push(`产品 ${product.id}：流水数据混用了年度和季度`);
    }
    const periods = new Set<string>();
    for (const r of product.revenue) {
      if (periods.has(r.period)) errors.push(`产品 ${product.id}：流水期间 ${r.period} 重复`);
      periods.add(r.period);
    }
    if (product.status === 'shutdown' && !product.shutdown) {
      errors.push(`产品 ${product.id}：状态为已停服但缺少停服日期`);
    }
    if (product.shutdown && product.status !== 'shutdown') {
      errors.push(`产品 ${product.id}：有停服日期但状态不是已停服`);
    }
    if (product.shutdown && compareDates(product.shutdown, product.released) < 0) {
      errors.push(`产品 ${product.id}：停服日期 ${product.shutdown} 早于上线日期 ${product.released}`);
    }
  }

  for (const person of ds.people) {
    for (const role of person.roles) {
      if (!companyIds.has(role.company)) {
        errors.push(`人物 ${person.id}：任职公司 "${role.company}" 不是已收录公司的 id`);
      }
      if (role.to && compareDates(role.to, role.from) < 0) {
        errors.push(`人物 ${person.id}：在 "${role.company}" 的任职结束时间 ${role.to} 早于开始时间 ${role.from}`);
      }
      if (role.scope === 'company' && role.products.length > 0) {
        errors.push(`人物 ${person.id}：公司职务不应挂产品`);
      }
      if (role.scope === 'product') {
        if (role.products.length === 0) {
          errors.push(`人物 ${person.id}：产品署名未挂产品`);
        }
        for (const productId of role.products) {
          if (!productIds.has(productId)) {
            errors.push(`人物 ${person.id}：署名产品 "${productId}" 不存在`);
          }
        }
      }
    }
  }

  for (const event of ds.events) {
    for (const company of event.companies) {
      if (!companyIds.has(company)) errors.push(`事件 ${event.id}：公司 "${company}" 不存在`);
    }
    for (const product of event.products) {
      if (!productIds.has(product)) errors.push(`事件 ${event.id}：产品 "${product}" 不存在`);
    }
  }

  const marketYears = new Set<number>();
  for (const entry of ds.market) {
    if (marketYears.has(entry.year)) errors.push(`市场数据：${entry.year} 年重复`);
    marketYears.add(entry.year);
  }
  const scopes = new Set(ds.market.map((m) => m.scope));
  if (scopes.size > 1) {
    errors.push(`市场数据：统计口径不一致（${[...scopes].join(' / ')}）`);
  }

  return errors;
}

export function revenueSeries(product: Product): RevenuePoint[] {
  return product.revenue
    .map((r) => ({
      period: r.period,
      x: periodToNumber(r.period),
      amountCNY: r.amountCNY,
      kind: r.kind,
      basis: r.basis,
      partial: r.partial ?? false,
      lowerBound: r.lowerBound ?? false,
      sourceTitle: r.source.title,
      sourceUrl: r.source.url,
    }))
    .sort((a, b) => a.x - b.x);
}

function launchItem(p: Product): TimelineItem {
  return {
    id: `launch-${p.id}`,
    date: p.released,
    kind: 'launch',
    label: `《${p.name}》上线`,
    productIds: [p.id],
    sources: p.sources,
    verified: p.verified,
  };
}

function shutdownItem(p: Product, date: string): TimelineItem {
  return {
    id: `shutdown-${p.id}`,
    date,
    kind: 'shutdown',
    label: `《${p.name}》停服`,
    productIds: [p.id],
    sources: p.sources,
    verified: p.verified,
  };
}

function eventItem(e: ChronicleEvent): TimelineItem {
  return {
    id: e.id,
    date: e.date,
    kind: e.type,
    label: e.summary,
    productIds: e.products,
    sources: e.sources,
    verified: e.verified,
  };
}

export function productMilestones(ds: Dataset, product: Product): TimelineItem[] {
  const items = [launchItem(product)];
  if (product.shutdown) items.push(shutdownItem(product, product.shutdown));
  for (const e of ds.events) {
    if (e.products.includes(product.id)) items.push(eventItem(e));
  }
  return items.sort(byDate((item) => item.date));
}

export function getProductCredits(ds: Dataset, productId: string): ProductCredit[] {
  const credits: ProductCredit[] = [];
  for (const person of ds.people) {
    for (const role of person.roles) {
      if (role.scope === 'product' && role.products.includes(productId)) {
        credits.push({ person, role });
      }
    }
  }
  return credits.sort((a, b) => {
    const ai = CREDIT_TITLE_ORDER.indexOf(a.role.title);
    const bi = CREDIT_TITLE_ORDER.indexOf(b.role.title);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return compareDates(a.role.from, b.role.from);
  });
}

export function getCompanyTalentMap(ds: Dataset, companyId: string): TalentMapGroup[] {
  return ds.products
    .filter((p) => p.developer === companyId || p.publisher === companyId)
    .sort(byDate((p) => p.released))
    .map((product) => ({
      product,
      credits: getProductCredits(ds, product.id).filter((c) => c.role.company === companyId),
    }));
}

export function getPersonView(ds: Dataset, id: string): PersonView {
  const person = ds.people.find((p) => p.id === id);
  if (!person) throw new Error(`未找到人物：${id}`);
  return { person, roles: [...person.roles].sort(byDate((r) => r.from)) };
}

export function toProductCards(ds: Dataset, products: Product[]): ProductCard[] {
  return products.map((p) => ({
    ...p,
    developerName: displayCompanyName(ds, p.developer),
    publisherName: displayCompanyName(ds, p.publisher),
    publisherId: ds.companies.some((c) => c.id === p.publisher) ? p.publisher : undefined,
    series: revenueSeries(p),
    milestones: productMilestones(ds, p),
    credits: getProductCredits(ds, p.id),
  }));
}

export const COMPARE_THICKNESS_MIN = 6;
export const COMPARE_THICKNESS_MAX = 28;

export function representativeRevenue(product: Product): Product['revenue'][number] | undefined {
  if (product.revenue.length === 0) return undefined;
  return [...product.revenue].sort((a, b) => periodToNumber(a.period) - periodToNumber(b.period)).at(-1);
}

export function compareThickness(product: Product, peers: Product[]): number {
  const mine = representativeRevenue(product);
  if (!mine?.basis) return COMPARE_THICKNESS_MIN;
  const amounts = peers
    .map(representativeRevenue)
    .filter((r): r is NonNullable<typeof r> => !!r && r.basis === mine.basis)
    .map((r) => r.amountCNY);
  if (amounts.length === 0) return COMPARE_THICKNESS_MIN;
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  if (min === max) return (COMPARE_THICKNESS_MIN + COMPARE_THICKNESS_MAX) / 2;
  return COMPARE_THICKNESS_MIN + ((mine.amountCNY - min) / (max - min)) * (COMPARE_THICKNESS_MAX - COMPARE_THICKNESS_MIN);
}

export function getCompareLanes(ds: Dataset, ids: string[]): CompareLane[] {
  const wanted = ids.length === 0 ? ds.companies.map((c) => c.id) : ids;
  const known = new Set(ds.companies.map((c) => c.id));
  const selected = ds.companies
    .filter((c) => wanted.includes(c.id) && known.has(c.id))
    .sort((a, b) => compareDates(a.founded, b.founded) || a.id.localeCompare(b.id));

  return selected.map((company) => {
    const products = ds.products.filter((p) => p.developer === company.id).sort(byDate((p) => p.released));
    const events = ds.events.filter((e) => e.companies.includes(company.id)).sort(byDate((e) => e.date));
    return { company, products: toProductCards(ds, products), events };
  });
}

export function buildTimeline(company: Company, products: Product[], events: ChronicleEvent[]): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      id: `founded-${company.id}`,
      date: company.founded,
      kind: 'founded',
      label: `${company.name}成立`,
      productIds: [],
      sources: company.sources,
      verified: company.verified,
    },
  ];
  for (const p of products) {
    items.push(launchItem(p));
    if (p.shutdown) items.push(shutdownItem(p, p.shutdown));
  }
  for (const e of events) items.push(eventItem(e));
  return items.sort(byDate((item) => item.date));
}

export function getCompanyView(ds: Dataset, id: string): CompanyView {
  const company = ds.companies.find((c) => c.id === id);
  if (!company) throw new Error(`未找到公司：${id}`);

  const products = ds.products
    .filter((p) => p.developer === id || p.publisher === id)
    .sort(byDate((p) => p.released));
  const events = ds.events.filter((e) => e.companies.includes(id)).sort(byDate((e) => e.date));
  const people = ds.people
    .map((person) => {
      const roles = [...person.roles].sort(byDate((r) => r.from));
      return {
        person,
        roles: roles.filter((r) => r.company === id),
        elsewhere: roles.filter((r) => r.company !== id),
      };
    })
    .filter((entry) => entry.roles.length > 0)
    .sort((a, b) => compareDates(a.roles[0].from, b.roles[0].from));

  return {
    company,
    products,
    people,
    talentMap: getCompanyTalentMap(ds, id),
    events,
    timeline: buildTimeline(company, products, events),
  };
}

export function getYearBuckets(ds: Dataset, endYear: number): YearBucket[] {
  const productsOf = (companyIds: string[]) =>
    ds.products.filter((p) => companyIds.includes(p.developer) || companyIds.includes(p.publisher));
  const companyRef = (id: string) => ({ id, name: displayCompanyName(ds, id) });

  const founded: RiverCompany[] = ds.companies.map((c) => ({
    id: c.id,
    name: c.name,
    aliases: c.aliases,
    tagline: c.tagline,
    kind: c.kind,
    logo: c.logo,
    founded: c.founded,
    verified: c.verified,
    genres: uniqueGenres(productsOf([c.id])),
  }));
  const launches = toProductCards(ds, ds.products);
  const events: RiverEvent[] = [];
  for (const p of ds.products) {
    if (p.shutdown) {
      events.push({ ...shutdownItem(p, p.shutdown), companies: [companyRef(p.developer)], genres: [p.genre] });
    }
  }
  for (const e of ds.events) {
    const linked = ds.products.filter((p) => e.products.includes(p.id));
    const genres = uniqueGenres(linked.length > 0 ? linked : productsOf(e.companies));
    events.push({ ...eventItem(e), companies: e.companies.map(companyRef), genres });
  }

  const years = [
    ...founded.map((c) => yearOf(c.founded)),
    ...launches.map((p) => yearOf(p.released)),
    ...events.map((e) => yearOf(e.date)),
  ];
  if (years.length === 0) return [];

  const buckets: YearBucket[] = [];
  for (let year = Math.min(...years); year <= Math.max(endYear, ...years); year++) {
    buckets.push({
      year,
      founded: founded.filter((c) => yearOf(c.founded) === year).sort(byDate((c) => c.founded)),
      launches: launches.filter((p) => yearOf(p.released) === year).sort(byDate((p) => p.released)),
      events: events.filter((e) => yearOf(e.date) === year).sort(byDate((e) => e.date)),
    });
  }
  return buckets;
}

export function bucketSize(bucket: YearBucket): number {
  return bucket.founded.length + bucket.launches.length + bucket.events.length;
}

export function filterBucket(bucket: YearBucket, genre: GenreFilter): YearBucket {
  if (genre === 'all') return bucket;
  return {
    year: bucket.year,
    founded: bucket.founded.filter((c) => c.genres.includes(genre)),
    launches: bucket.launches.filter((p) => p.genre === genre),
    events: bucket.events.filter((e) => e.genres.includes(genre)),
  };
}

export function marketSeries(ds: Dataset): MarketPoint[] {
  return [...ds.market]
    .sort((a, b) => a.year - b.year)
    .map((m) => ({
      year: m.year,
      amountCNY: m.amountCNY,
      kind: m.kind,
      scope: m.scope,
      sourceTitle: m.source.title,
      sourceUrl: m.source.url,
      verified: m.verified,
    }));
}
