import { compareDates, periodToNumber } from './dates';
import type {
  ChronicleEvent,
  Company,
  CompanyView,
  Dataset,
  Product,
  ProductCard,
  RevenuePoint,
  TimelineItem,
} from './types';

function byDate<T>(get: (item: T) => string) {
  return (a: T, b: T) => compareDates(get(a), get(b));
}

export function displayCompanyName(ds: Dataset, idOrName: string): string {
  return ds.companies.find((c) => c.id === idOrName)?.name ?? idOrName;
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

  return errors;
}

export function revenueSeries(product: Product): RevenuePoint[] {
  return product.revenue
    .map((r) => ({
      period: r.period,
      x: periodToNumber(r.period),
      amountCNY: r.amountCNY,
      kind: r.kind,
      sourceTitle: r.source.title,
      sourceUrl: r.source.url,
    }))
    .sort((a, b) => a.x - b.x);
}

export function toProductCards(ds: Dataset, products: Product[]): ProductCard[] {
  return products.map((p) => ({
    ...p,
    developerName: displayCompanyName(ds, p.developer),
    publisherName: displayCompanyName(ds, p.publisher),
    series: revenueSeries(p),
  }));
}

export function buildTimeline(company: Company, products: Product[], events: ChronicleEvent[]): TimelineItem[] {
  const items: TimelineItem[] = [
    { date: company.founded, kind: 'founded', label: `${company.name}成立`, verified: company.verified },
  ];
  for (const p of products) {
    items.push({ date: p.released, kind: 'launch', label: `《${p.name}》上线`, productId: p.id, verified: p.verified });
    if (p.shutdown) {
      items.push({ date: p.shutdown, kind: 'shutdown', label: `《${p.name}》停服`, productId: p.id, verified: p.verified });
    }
  }
  for (const e of events) {
    items.push({ date: e.date, kind: e.type, label: e.summary, verified: e.verified });
  }
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

  return { company, products, people, events, timeline: buildTimeline(company, products, events) };
}
