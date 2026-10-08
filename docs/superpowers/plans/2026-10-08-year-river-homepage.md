# 时间长河首页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把首页从临时公司目录换成"时间长河"：顶部年份热度条（叠加市场规模曲线），下方按年纵向滚动、年份吸顶、可按品类筛选；同时把事件 / 人物来源和作品"关键节点"补到界面上。

**Architecture:** 数据层新增 `market` 内容集合和三个纯函数（`getYearBuckets`、`filterBucket`、`marketSeries`），时间轴条目统一带 `id / sources / productIds`。热度条是纯静态 Astro 组件（CSS 悬停浮层，无需水合）；时间长河是一个 React island（筛选状态 + 复用 Phase 1 的 `ProductDrawer`）。

**Tech Stack:** Astro 7.3、React 19、Tailwind CSS 4、motion 14（`motion/react`）、Vitest 5、TypeScript 6 + `@astrojs/check`。

## Global Constraints

- Node ≥ 22.12（本机为 v24.14.0）；Windows / PowerShell，没有 bash。
- Zod 一律从 `astro/zod` 导入（Zod 4 语法：`z.url()`、`{ error: '...' }`）。
- 内容集合配置文件为 `src/content.config.ts`，使用 `glob()` loader；条目 id 取自文件名。
- Astro 7 使用 Rust 编译器：所有非空元素必须显式闭合；`compressHTML: 'jsx'` 会去掉行内元素之间的空白，需写 `{' '}` 或用 flex/gap 间距。
- 配色：纸色 `#F4EFE8`、深纸 `#EAE3D9`、墨色 `#1E1A17`、淡墨 `#5B524B`、雾灰 `#A79E95`、胭脂红 `#9E3B4D`、浅胭脂 `#E9D3D5`（Tailwind token：`paper`、`paper-deep`、`ink`、`ink-soft`、`mist`、`rouge`、`rouge-soft`）。
- 字体：标题 `font-serif`（Noto Serif SC），正文 `font-sans`（Noto Sans SC），年份数字 `font-display`（Cormorant Garamond）。
- 动效必须尊重 `prefers-reduced-motion`：React 组件用 `<MotionConfig reducedMotion="user">`，并在 `useReducedMotion()` 为真时 `initial={false}`；CSS 用媒体查询。
- 每条事实数据必须有至少一个来源；未核实的标 `verified: false`，界面显示"待核实"（`.unverified` 样式类）。
- 流水 / 市场规模区分 `official` / `estimate`：官方实线，估算虚线。
- 界面文案一律中文。
- 布局 header 为绝对定位，页面自行留出顶部空间（首页首屏 `pt-36`）。
- 每个任务结束前必须跑通：`npm test`、`npm run check`（0 errors）、`npx astro build`。
- 不要提交 `.superpowers/` 下的任何文件。

---

## File Structure

| 文件 | 职责 | 任务 |
|---|---|---|
| `src/lib/schema.ts` | 新增 `marketEntrySchema` | 1 |
| `src/content.config.ts` | 注册 `market` 集合 | 1 |
| `src/lib/types.ts` | `TimelineItem` 扩展；`Genre`、`GenreFilter`、`MarketEntry`、`MarketPoint`、`RiverCompany`、`RiverEvent`、`YearBucket` | 1 |
| `src/lib/data.ts` | `productMilestones`、`getYearBuckets`、`bucketSize`、`filterBucket`、`marketSeries`；市场数据完整性检查 | 1 |
| `src/lib/load.ts` | 读取 `market` 集合 | 1 |
| `tests/fixtures.ts`、`tests/data.test.ts`、`tests/schema.test.ts` | 测试 | 1 |
| `src/content/market/<year>.json` | 市场规模数据（联网检索） | 2 |
| `src/components/SourceLinks.tsx` | "来源 1 2" 小链接，三处复用 | 3 |
| `src/components/CompanyTimeline.tsx` | 时间轴条目显示来源；拖动不吞链接点击 | 3 |
| `src/components/ProductDrawer.tsx` | 关键节点；研发 / 发行可跳公司页 | 3 |
| `src/components/PeopleSection.astro` | 人物来源 | 3 |
| `src/components/HeatStrip.astro` | 年份热度条 + 市场曲线 | 4 |
| `src/components/YearRiver.tsx` | 时间长河 island | 5 |
| `src/pages/index.astro` | 首页 | 5 |

---

### Task 1: 数据层——时间轴来源、关键节点、年份分桶与市场集合

**Files:**
- Modify: `src/lib/schema.ts`（文件末尾追加）
- Modify: `src/content.config.ts`（整文件替换）
- Modify: `src/lib/types.ts`（整文件替换）
- Modify: `src/lib/data.ts`（整文件替换）
- Modify: `src/lib/load.ts`（整文件替换）
- Modify: `tests/fixtures.ts`、`tests/data.test.ts`、`tests/schema.test.ts`

**Interfaces:**
- Consumes: Phase 1 的 `compareDates`、`periodToNumber`、`yearOf`（`src/lib/dates.ts`），`sourceSchema`（`src/lib/schema.ts`）。
- Produces（后续任务依赖，名称与类型必须一致）：
  - `TimelineItem { id: string; date: string; kind: TimelineKind; label: string; productIds: string[]; sources: Source[]; verified: boolean }`（删除原 `productId?`）
  - `ProductCard = Product & { developerName: string; publisherName: string; publisherId?: string; series: RevenuePoint[]; milestones: TimelineItem[] }`
  - `type Genre = Product['genre']`；`type GenreFilter = Genre | 'all'`
  - `MarketPoint { year: number; amountCNY: number; kind: 'official' | 'estimate'; scope: string; sourceTitle: string; sourceUrl: string; verified: boolean }`
  - `RiverCompany { id; name; tagline; kind: Company['kind']; logo?: string; founded: string; verified: boolean; genres: Genre[] }`
  - `RiverEvent extends TimelineItem { companies: { id: string; name: string }[]; genres: Genre[] }`
  - `YearBucket { year: number; founded: RiverCompany[]; launches: ProductCard[]; events: RiverEvent[] }`
  - `getYearBuckets(ds: Dataset, endYear: number): YearBucket[]`——从最早年份到 `max(endYear, 数据最晚年份)`，**包含空年份**
  - `bucketSize(b: YearBucket): number`
  - `filterBucket(b: YearBucket, genre: GenreFilter): YearBucket`
  - `marketSeries(ds: Dataset): MarketPoint[]`（按年份升序）
  - `Dataset.market: MarketEntry[]`

- [ ] **Step 1: 在 `tests/fixtures.ts` 的数据集中加入 `market`**

在 `events: [...]` 之后（`return` 对象内）追加：

```ts
    market: [
      { id: '2016', year: 2016, amountCNY: 2e9, kind: 'estimate', scope: '测试口径', source: sources[0], verified: true },
      { id: '2015', year: 2015, amountCNY: 1e9, kind: 'estimate', scope: '测试口径', source: sources[0], verified: true },
    ],
```

- [ ] **Step 2: 写失败的测试**

`tests/schema.test.ts` 顶部导入里加入 `marketEntrySchema`，文件末尾追加：

```ts
describe('marketEntrySchema', () => {
  const base = {
    year: 2023,
    amountCNY: 5e9,
    kind: 'estimate',
    scope: '中国女性向游戏市场实际销售收入',
    source: { title: '测试来源', url: 'https://example.com' },
  };

  it('接受合法条目，verified 默认为 false', () => {
    const parsed = marketEntrySchema.parse(base);
    expect(parsed.verified).toBe(false);
  });

  it('拒绝非整数年份和非正数金额', () => {
    expect(marketEntrySchema.safeParse({ ...base, year: 2023.5 }).success).toBe(false);
    expect(marketEntrySchema.safeParse({ ...base, amountCNY: 0 }).success).toBe(false);
  });
});
```

`tests/data.test.ts`：把第 2 行导入替换为

```ts
import {
  bucketSize,
  checkIntegrity,
  displayCompanyName,
  filterBucket,
  getCompanyView,
  getYearBuckets,
  marketSeries,
  revenueSeries,
  toProductCards,
} from '../src/lib/data';
```

在 `describe('checkIntegrity', ...)` 内末尾追加：

```ts
  it('发现重复年份的市场数据', () => {
    const ds = makeDataset();
    ds.market.push({ ...ds.market[0], id: '2016-b' });
    expect(checkIntegrity(ds).join('\n')).toContain('2016');
  });

  it('发现口径不一致的市场数据', () => {
    const ds = makeDataset();
    ds.market[1].scope = '另一种口径';
    expect(checkIntegrity(ds).join('\n')).toContain('口径');
  });
```

把 `describe('toProductCards', ...)` 整块替换为：

```ts
describe('toProductCards', () => {
  it('补充研发、发行名称和流水序列', () => {
    const ds = makeDataset();
    const [card] = toProductCards(ds, [ds.products[2]]);
    expect(card.developerName).toBe('Beta 工作室');
    expect(card.publisherName).toBe('Alpha 游戏');
    expect(card.series).toEqual([]);
  });

  it('发行方是已收录公司时给出 publisherId，否则为空', () => {
    const ds = makeDataset();
    const [second, third] = toProductCards(ds, [ds.products[1], ds.products[2]]);
    expect(second.publisherId).toBeUndefined();
    expect(third.publisherId).toBe('alpha');
  });

  it('关键节点包含上线、停服和关联事件，按日期排序', () => {
    const ds = makeDataset();
    const [first, second, third] = toProductCards(ds, ds.products);
    expect(first.milestones.map((m) => m.id)).toEqual(['launch-a-first']);
    expect(second.milestones.map((m) => m.id)).toEqual(['launch-a-second', 'shutdown-a-second']);
    expect(third.milestones.map((m) => m.id)).toEqual(['joint', 'launch-b-first']);
    expect(third.milestones[0].sources).toHaveLength(1);
  });
});
```

（`joint` 日期 `2019` 早于 `b-first` 的 `2021-06-24`，所以排在前面。）

在 `describe('getCompanyView', ...)` 内的"时间轴合并……"测试末尾（`expect(view.timeline[4].verified).toBe(false);` 之后）追加：

```ts
    expect(view.timeline[0]).toMatchObject({ id: 'founded-alpha', productIds: [] });
    expect(view.timeline[1]).toMatchObject({ id: 'launch-a-first', productIds: ['a-first'] });
    expect(view.timeline[4]).toMatchObject({ id: 'joint', productIds: ['b-first'] });
    expect(view.timeline.every((t) => t.sources.length > 0)).toBe(true);
```

文件末尾追加：

```ts
describe('getYearBuckets', () => {
  const buckets = getYearBuckets(makeDataset(), 2024);
  const at = (year: number) => buckets.find((b) => b.year === year)!;

  it('覆盖从最早年份到 endYear 的每一年，包含空年份', () => {
    expect(buckets.map((b) => b.year)).toEqual([
      2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024,
    ]);
    expect(bucketSize(at(2014))).toBe(0);
  });

  it('成立的公司带上其作品品类', () => {
    expect(at(2013).founded.map((c) => [c.id, c.genres])).toEqual([['alpha', ['otome', 'dressup']]]);
    expect(at(2018).founded.map((c) => [c.id, c.genres])).toEqual([['beta', ['otome']]]);
  });

  it('上线作品是完整的 ProductCard', () => {
    expect(at(2015).launches.map((p) => p.id)).toEqual(['a-first']);
    expect(at(2015).launches[0].developerName).toBe('Alpha 游戏');
  });

  it('事件包含停服，并带公司名和品类', () => {
    expect(at(2023).events.map((e) => [e.id, e.kind])).toEqual([['shutdown-a-second', 'shutdown']]);
    const joint = at(2019).events[0];
    expect(joint.companies.map((c) => c.name)).toEqual(['Alpha 游戏', 'Beta 工作室']);
    expect(joint.genres).toEqual(['otome']);
    expect(at(2016).events[0].genres).toEqual(['otome', 'dressup']);
  });

  it('bucketSize 统计三类条目总数', () => {
    expect(bucketSize(at(2013))).toBe(1);
    expect(bucketSize(at(2021))).toBe(1);
  });
});

describe('filterBucket', () => {
  const buckets = getYearBuckets(makeDataset(), 2024);
  const at = (year: number) => buckets.find((b) => b.year === year)!;

  it('all 原样返回', () => {
    expect(filterBucket(at(2019), 'all')).toBe(at(2019));
  });

  it('按品类过滤公司、作品和事件', () => {
    expect(filterBucket(at(2013), 'dressup').founded.map((c) => c.id)).toEqual(['alpha']);
    expect(filterBucket(at(2015), 'otome').launches).toEqual([]);
    expect(filterBucket(at(2016), 'dressup').events).toHaveLength(1);
    expect(filterBucket(at(2019), 'dressup').events).toEqual([]);
  });
});

describe('marketSeries', () => {
  it('按年份升序并展开来源', () => {
    const series = marketSeries(makeDataset());
    expect(series.map((p) => p.year)).toEqual([2015, 2016]);
    expect(series[0]).toMatchObject({ amountCNY: 1e9, kind: 'estimate', scope: '测试口径', sourceTitle: '测试来源' });
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test`
Expected: FAIL——`marketEntrySchema` / `getYearBuckets` 等未导出，`market` 不在 `Dataset` 类型中（Vitest 不做类型检查，主要表现为导入为 undefined 导致的运行时错误）。

- [ ] **Step 4: 实现 schema 与集合**

`src/lib/schema.ts` 文件末尾追加：

```ts
export const marketEntrySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  amountCNY: z.number().positive(),
  kind: z.enum(['official', 'estimate']),
  scope: z.string().min(1),
  source: sourceSchema,
  verified: z.boolean().default(false),
  note: z.string().optional(),
});
```

`src/content.config.ts` 整文件替换为：

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { companySchema, eventSchema, marketEntrySchema, personSchema, productSchema } from './lib/schema';

const companies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/companies' }),
  schema: companySchema,
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: productSchema,
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/people' }),
  schema: personSchema,
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/events' }),
  schema: eventSchema,
});

const market = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/market' }),
  schema: marketEntrySchema,
});

export const collections = { companies, products, people, events, market };
```

创建空目录 `src/content/market/`（放一个 `README.md` 说明格式，避免目录不存在；`README.md` 不匹配 `*.json`，不会被当成数据）：

```markdown
# 市场规模数据

每年一个文件，文件名为年份，如 `2023.json`。字段见 `src/lib/schema.ts` 的 `marketEntrySchema`。
所有条目的 `scope`（统计口径）必须完全一致，否则构建报错。
```

（Task 2 之前此集合为空，`astro build` 可能打印"未找到文件"之类的警告，属预期。）

- [ ] **Step 5: 实现类型**

`src/lib/types.ts` 整文件替换为：

```ts
import type { z } from 'astro/zod';
import type {
  companySchema,
  eventSchema,
  marketEntrySchema,
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

export type ProductCard = Product & {
  developerName: string;
  publisherName: string;
  publisherId?: string;
  series: RevenuePoint[];
  milestones: TimelineItem[];
};

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
```

- [ ] **Step 6: 实现数据函数**

`src/lib/data.ts` 整文件替换为：

```ts
import { compareDates, periodToNumber, yearOf } from './dates';
import type {
  ChronicleEvent,
  Company,
  CompanyView,
  Dataset,
  Genre,
  GenreFilter,
  MarketPoint,
  Product,
  ProductCard,
  RevenuePoint,
  RiverCompany,
  RiverEvent,
  TimelineItem,
  YearBucket,
} from './types';

const GENRE_ORDER: Genre[] = ['otome', 'dressup', 'interactive', 'other'];

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

export function toProductCards(ds: Dataset, products: Product[]): ProductCard[] {
  return products.map((p) => ({
    ...p,
    developerName: displayCompanyName(ds, p.developer),
    publisherName: displayCompanyName(ds, p.publisher),
    publisherId: ds.companies.some((c) => c.id === p.publisher) ? p.publisher : undefined,
    series: revenueSeries(p),
    milestones: productMilestones(ds, p),
  }));
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

  return { company, products, people, events, timeline: buildTimeline(company, products, events) };
}

export function getYearBuckets(ds: Dataset, endYear: number): YearBucket[] {
  const productsOf = (companyIds: string[]) =>
    ds.products.filter((p) => companyIds.includes(p.developer) || companyIds.includes(p.publisher));
  const companyRef = (id: string) => ({ id, name: displayCompanyName(ds, id) });

  const founded: RiverCompany[] = ds.companies.map((c) => ({
    id: c.id,
    name: c.name,
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
```

- [ ] **Step 7: 读取 market 集合**

`src/lib/load.ts` 整文件替换为：

```ts
import { getCollection } from 'astro:content';
import { checkIntegrity } from './data';
import type { Dataset } from './types';

export async function loadDataset(): Promise<Dataset> {
  const [companies, products, people, events, market] = await Promise.all([
    getCollection('companies'),
    getCollection('products'),
    getCollection('people'),
    getCollection('events'),
    getCollection('market'),
  ]);

  const ds: Dataset = {
    companies: companies.map((e) => ({ id: e.id, ...e.data })),
    products: products.map((e) => ({ id: e.id, ...e.data })),
    people: people.map((e) => ({ id: e.id, ...e.data })),
    events: events.map((e) => ({ id: e.id, ...e.data })),
    market: market.map((e) => ({ id: e.id, ...e.data })),
  };

  const errors = checkIntegrity(ds);
  if (errors.length > 0) {
    throw new Error(`数据引用错误：\n${errors.join('\n')}`);
  }
  return ds;
}
```

- [ ] **Step 8: 运行全部检查**

Run: `npm test`
Expected: 全部通过（原 43 个 + 新增约 13 个）。

Run: `npm run check`
Expected: `0 errors`。`CompanyTimeline.tsx` 里原来 `key={`${item.date}-${i}`}` 不受影响；若有其他文件引用了已删除的 `productId`，按新字段 `productIds` 修正。

Run: `npx astro build`
Expected: 构建成功（可能有 market 集合为空的警告）。

- [ ] **Step 9: Commit**

```powershell
git add src/lib src/content.config.ts src/content/market/README.md tests
git commit -m "feat: add year buckets, product milestones and market collection"
```

---

### Task 2: 市场规模数据（联网检索）

**Files:**
- Create: `src/content/market/<year>.json`（若干）
- Create (scratch, 不提交): `.superpowers/sdd/task-2-research.md`

**Interfaces:**
- Consumes: Task 1 的 `marketEntrySchema`（`year`、`amountCNY`、`kind`、`scope`、`source { title, url }`、`verified`、`note?`）和 `checkIntegrity` 的口径一致性检查。
- Produces: `ds.market` 数据，供 Task 4 热度条画线。

这是数据采集任务，不写代码。用可用的联网检索工具（搜索 + 抓取网页）完成。

- [ ] **Step 1: 检索**

目标：**中国女性向游戏市场规模**的逐年数字（元）。优先顺序：
1. 中国音像与数字出版协会游戏出版工作委员会 / 伽马数据（CNG）的《中国女性向游戏市场（调查）报告》或年度产业报告中"女性向游戏市场实际销售收入"；
2. 其他机构（如艾瑞、QuestMobile、头豹）的同类口径数据，仅当 1 无法覆盖时作为单独口径考虑。

检索词示例：`女性向游戏 市场规模 伽马数据`、`女性向游戏 实际销售收入 亿元 2023`、`中国女性向游戏市场调查报告`。

- [ ] **Step 2: 选定唯一口径**

- 所有条目的 `scope` 字符串必须**逐字相同**（构建会检查）。例如：`"中国女性向游戏市场实际销售收入（伽马数据）"`。
- 只收录与选定口径一致的年份；不同机构、不同口径的数字不得混入同一序列。
- 同一机构不同年份报告对同一年给出不同数字（修订）时：采用最新报告的数字，`verified: false`，在 `note` 写明两个数字和出处。
- 预测值（如"预计 2026 年将达到…"）**不收录**。
- 金额换算成元：`56.2 亿元` → `5620000000`。
- `kind`：行业机构的测算一律记 `estimate`。
- 每条至少一个来源链接；能交叉核对到第二个来源的设 `verified: true`，只有单一来源的设 `verified: false`。

- [ ] **Step 3: 写数据文件**

每年一个文件，文件名为年份，例如 `src/content/market/2023.json`：

```json
{
  "year": 2023,
  "amountCNY": 5620000000,
  "kind": "estimate",
  "scope": "中国女性向游戏市场实际销售收入（伽马数据）",
  "source": { "title": "伽马数据：2023 年中国女性向游戏市场调查报告", "url": "https://..." },
  "verified": true
}
```

（上面的数字是格式示例，**不是**真实数据，必须替换为检索到的值。）

如果找不到同一口径下**至少两年**的可靠数据：不写任何 json 文件，在研究记录里说明原因。热度条会自动不画市场曲线。

- [ ] **Step 4: 研究记录**

在 `.superpowers/sdd/task-2-research.md` 写：选定的口径、每年数字及来源、被排除的数字和原因、未解决的分歧。

- [ ] **Step 5: 验证**

Run: `npm test`、`npm run check`、`npx astro build`
Expected: 全部通过；若口径不一致或年份重复，build 会报"数据引用错误：市场数据……"。

- [ ] **Step 6: Commit**

```powershell
git add src/content/market
git commit -m "data: add female-oriented game market size series"
```

---

### Task 3: 来源与关键节点上界面

**Files:**
- Create: `src/components/SourceLinks.tsx`
- Modify: `src/components/CompanyTimeline.tsx`（整文件替换）
- Modify: `src/components/ProductDrawer.tsx`（整文件替换）
- Modify: `src/components/PeopleSection.astro`（整文件替换）

**Interfaces:**
- Consumes: Task 1 的 `TimelineItem`（`id`、`sources`、`verified`）、`ProductCard`（`milestones`、`publisherId`、`developer`）。
- Produces: `SourceLinks({ sources }: { sources: Source[] })`——渲染 `来源`（单个）或 `来源1 来源2 …`（多个）外链，新标签页打开，`title` 为来源标题。Task 5 复用。

- [ ] **Step 1: 创建 `src/components/SourceLinks.tsx`**

```tsx
import type { Source } from '../lib/types';

export default function SourceLinks({ sources }: { sources: Source[] }) {
  return (
    <>
      {sources.map((source, i) => (
        <a
          key={i}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          title={source.title}
          className="underline decoration-ink/20 underline-offset-2 transition hover:text-rouge"
        >
          来源{sources.length > 1 ? i + 1 : ''}
        </a>
      ))}
    </>
  );
}
```

- [ ] **Step 2: 替换 `src/components/CompanyTimeline.tsx`**

变化：条目 key 改用 `item.id`；标签下方增加来源链接，并与"待核实"放在同一行（不增加标签高度）；按下链接时不启动拖动（否则指针捕获会吞掉链接点击）。

```tsx
import { useRef, type PointerEvent } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'motion/react';
import type { TimelineItem, TimelineKind } from '../lib/types';
import { dateToNumber, formatDate } from '../lib/dates';
import { timelineKindLabel } from '../lib/labels';
import { assignLevels } from '../lib/timelineLayout';
import SourceLinks from './SourceLinks';

const PX_PER_YEAR = 180;
const PAD = 96;
const HEIGHT = 520;
const AXIS_Y = HEIGHT / 2;
const LEVEL_OFFSETS = [-64, 64, -140, 140];
const LABEL_WIDTH = 168;

function dotClass(kind: TimelineKind): string {
  switch (kind) {
    case 'launch':
      return 'h-3.5 w-3.5 bg-rouge ring-4 ring-paper';
    case 'founded':
      return 'h-4 w-4 border-2 border-ink bg-paper';
    case 'shutdown':
      return 'h-3 w-3 bg-mist ring-4 ring-paper';
    default:
      return 'h-2.5 w-2.5 bg-ink ring-4 ring-paper';
  }
}

interface Props {
  items: TimelineItem[];
  endYear: number;
}

export default function CompanyTimeline({ items, endYear }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const reduceMotion = useReducedMotion();

  if (items.length === 0) return null;

  const startYear = Math.floor(dateToNumber(items[0].date));
  const xs = items.map((item) => PAD + (dateToNumber(item.date) - startYear) * PX_PER_YEAR);
  const levels = assignLevels(xs, LABEL_WIDTH + 16);
  const years = Array.from({ length: endYear - startYear + 2 }, (_, k) => startYear + k);
  const width = PAD * 2 + (years.length - 1) * PX_PER_YEAR;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !scroller.current) return;
    if (e.target instanceof Element && e.target.closest('a')) return;
    drag.current = { x: e.clientX, left: scroller.current.scrollLeft };
    scroller.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !scroller.current) return;
    scroller.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="公司时间轴"
        className="timeline-scroller cursor-grab overflow-x-auto select-none active:cursor-grabbing focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-rouge/40"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="relative" style={{ width, height: HEIGHT }}>
          <div className="absolute inset-x-0 h-px bg-ink/20" style={{ top: AXIS_Y }} />

          {years.map((year) => (
            <div
              key={year}
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{ left: PAD + (year - startYear) * PX_PER_YEAR, top: AXIS_Y - 6 }}
            >
              <span className="h-3 w-px bg-ink/25" />
              <span className="mt-2 font-display text-sm text-mist">{year}</span>
            </div>
          ))}

          {items.map((item, i) => {
            const offset = LEVEL_OFFSETS[levels[i]];
            const up = offset < 0;
            return (
              <motion.div
                key={item.id}
                className="absolute top-0"
                style={{ left: xs[i], height: HEIGHT }}
                initial={reduceMotion ? false : { opacity: 0, y: up ? 10 : -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  className="absolute w-px bg-ink/15"
                  style={up ? { top: AXIS_Y + offset, height: -offset } : { top: AXIS_Y, height: offset }}
                />
                <span
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${dotClass(item.kind)}`}
                  style={{ top: AXIS_Y }}
                />
                <div
                  className="absolute"
                  style={{
                    width: LABEL_WIDTH,
                    left: -12,
                    ...(up ? { bottom: HEIGHT - (AXIS_Y + offset) + 6 } : { top: AXIS_Y + offset + 6 }),
                  }}
                >
                  <p className="font-display text-xs tracking-wide text-mist">
                    {formatDate(item.date)} · {timelineKindLabel[item.kind]}
                  </p>
                  <p className="mt-1 line-clamp-3 font-serif text-sm leading-snug text-ink" title={item.label}>
                    {item.label}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[0.7rem] text-mist">
                    <SourceLinks sources={item.sources} />
                    {!item.verified && <span className="unverified">待核实</span>}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MotionConfig>
  );
}
```

- [ ] **Step 3: 替换 `src/components/ProductDrawer.tsx`**

变化：研发方链接到公司页；发行方是已收录公司（`publisherId`）时也链接；在"营收流水"之前增加"关键节点"竖向时间线，每个节点带来源和"待核实"。

```tsx
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { ProductCard } from '../lib/types';
import { formatDate } from '../lib/dates';
import { genreLabel, productStatusLabel, timelineKindLabel } from '../lib/labels';
import RevenueChart from './RevenueChart';
import SourceLinks from './SourceLinks';
import SourceList from './SourceList';

interface Props {
  product: ProductCard;
  onClose: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const companyLink = 'underline decoration-ink/20 underline-offset-4 transition hover:text-rouge';

export default function ProductDrawer({ product, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement | SVGElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement;
      const inside = current instanceof Node && panelRef.current.contains(current);
      if (e.shiftKey && (current === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [onClose]);

  const art = product.keyArt ?? product.cover;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={product.name}>
      <motion.div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.aside
        ref={panelRef}
        className="absolute inset-y-0 right-0 w-[min(600px,94vw)] overflow-y-auto bg-paper shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.45, ease }}
      >
        {art && <img src={art} alt="" className="aspect-[16/9] w-full object-cover object-top" />}
        <div className="px-8 pt-8 pb-16 sm:px-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-mist">{genreLabel[product.genre]}</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">{product.name}</h2>
              {product.aliases.length > 0 && <p className="mt-1 text-sm text-mist">{product.aliases.join(' / ')}</p>}
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-xl text-ink-soft transition hover:border-rouge hover:text-rouge"
            >
              ×
            </button>
          </div>
          {!product.verified && <span className="unverified mt-4">待核实</span>}

          <p className="mt-6 font-serif text-lg leading-relaxed text-ink-soft">{product.significance}</p>

          <dl className="mt-8 grid grid-cols-[5rem_1fr] gap-y-3 border-t border-ink/10 pt-6 text-sm">
            <dt className="text-mist">研发</dt>
            <dd className="text-ink">
              <a href={`/company/${product.developer}`} className={companyLink}>
                {product.developerName}
              </a>
            </dd>
            <dt className="text-mist">发行</dt>
            <dd className="text-ink">
              {product.publisherId ? (
                <a href={`/company/${product.publisherId}`} className={companyLink}>
                  {product.publisherName}
                </a>
              ) : (
                product.publisherName
              )}
            </dd>
            <dt className="text-mist">首发</dt>
            <dd className="text-ink">{formatDate(product.released)}</dd>
            {product.shutdown && (
              <>
                <dt className="text-mist">停服</dt>
                <dd className="text-ink">{formatDate(product.shutdown)}</dd>
              </>
            )}
            <dt className="text-mist">平台</dt>
            <dd className="text-ink">{product.platforms.join('、')}</dd>
            <dt className="text-mist">状态</dt>
            <dd className="text-ink">{productStatusLabel[product.status]}</dd>
          </dl>

          <section className="mt-10">
            <h3 className="font-serif text-lg text-ink">关键节点</h3>
            <ol className="mt-5 space-y-5 border-l border-ink/15 pl-5">
              {product.milestones.map((m) => (
                <li key={m.id} className="relative">
                  <span className="absolute top-1.5 -left-[24.5px] h-2 w-2 rounded-full bg-rouge" aria-hidden="true" />
                  <p className="font-display text-xs tracking-wide text-mist">
                    {formatDate(m.date)} · {timelineKindLabel[m.kind]}
                  </p>
                  <p className="mt-1 font-serif text-sm leading-relaxed text-ink">{m.label}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-mist">
                    <SourceLinks sources={m.sources} />
                    {!m.verified && <span className="unverified">待核实</span>}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10">
            <h3 className="font-serif text-lg text-ink">营收流水</h3>
            {product.series.length > 0 ? (
              <RevenueChart series={product.series} />
            ) : (
              <p className="mt-3 text-sm text-mist">暂无可靠的流水数据。</p>
            )}
          </section>

          <div className="mt-10">
            <SourceList sources={product.sources} />
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
```

- [ ] **Step 4: 替换 `src/components/PeopleSection.astro`**

变化：每张人物卡片显示来源；年份用 `yearOf`（去掉手写 `slice`）。`SourceLinks` 作为无 `client:` 指令的 React 组件在服务端静态渲染。

```astro
---
import type { Company, CompanyPerson } from '../lib/types';
import { yearOf } from '../lib/dates';
import SectionTitle from './SectionTitle.astro';
import SourceLinks from './SourceLinks';

interface Props {
  index: string;
  people: CompanyPerson[];
  companies: Company[];
}

const { index, people, companies } = Astro.props;
const nameOf = (id: string) => companies.find((c) => c.id === id)?.name ?? id;
const span = (from: string, to?: string) => `${yearOf(from)} — ${to ? yearOf(to) : '至今'}`;
---

<section class="mx-auto max-w-6xl px-6 py-24 sm:px-10">
  <SectionTitle index={index} title="关键人物" />
  <ul class="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
    {people.map(({ person, roles, elsewhere }) => (
      <li class="border-t border-ink/15 pt-6">
        <div class="flex items-center gap-4">
          {person.avatar ? (
            <img src={person.avatar} alt="" class="h-14 w-14 rounded-full object-cover grayscale" />
          ) : (
            <span class="flex h-14 w-14 items-center justify-center rounded-full bg-rouge-soft font-serif text-xl text-rouge">
              {person.name.slice(0, 1)}
            </span>
          )}
          <div>
            <p class="font-serif text-lg text-ink">{person.name}</p>
            {roles.map((role) => (
              <p class="text-sm text-ink-soft">
                {role.title}
                <span class="ml-2 font-display text-mist">{span(role.from, role.to)}</span>
              </p>
            ))}
          </div>
        </div>
        <p class="mt-4 text-sm leading-relaxed text-ink-soft">{person.bio}</p>
        {elsewhere.length > 0 && (
          <p class="mt-3 text-xs leading-relaxed text-mist">
            亦曾任职：
            {elsewhere.map((role, i) => (
              <>
                {i > 0 && '、'}
                <a href={`/company/${role.company}`} class="text-rouge hover:underline">{nameOf(role.company)}</a>
                <span class="ml-1">{role.title}</span>
              </>
            ))}
          </p>
        )}
        <p class="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-mist">
          <SourceLinks sources={person.sources} />
          {!person.verified && <span class="unverified">待核实</span>}
        </p>
      </li>
    ))}
  </ul>
</section>
```

- [ ] **Step 5: 运行全部检查**

Run: `npm test`、`npm run check`、`npx astro build`
Expected: 全部通过，`astro check` 0 errors。

- [ ] **Step 6: 浏览器自查**

`npm run dev` 已在 4321 端口运行时直接访问 `http://localhost:4321/company/papergames`（没在运行则启动它）：
- 时间轴每个条目下有"来源"小链接；点击在新标签页打开；按住空白处拖动仍可横向滚动。
- 上层标签没有被裁切（容器高度 520）。
- 打开《恋与制作人》抽屉：有"关键节点"，包含上线和"梦心湖"争议两条；研发"叠纸游戏"是链接；发行若为未收录名称则是纯文本。
- 人物卡片底部有"来源"链接。

- [ ] **Step 7: Commit**

```powershell
git add src/components
git commit -m "feat: surface event and person sources, add product milestones"
```

---

### Task 4: 年份热度条

**Files:**
- Create: `src/components/HeatStrip.astro`

**Interfaces:**
- Consumes: Task 1 的 `MarketPoint`；Phase 1 的 `formatCNY(amount: number): string`（`src/lib/money.ts`）。
- Produces: `<HeatStrip years={{ year: number; count: number }[]} market={MarketPoint[]} />`——每年一根柱子，是指向 `#y<year>` 的链接；市场数据 ≥ 2 年时叠加胭脂红曲线（含估算时为虚线）。Task 5 在首页使用。

设计说明：纯静态组件，悬停浮层用 CSS `group-hover` / `group-focus-visible`，不需要水合。柱子用 CSS grid 排列，自适应宽度；曲线用 `viewBox="0 0 100 100"` + `preserveAspectRatio="none"` 的 SVG 覆盖在柱子上，`vector-effect="non-scaling-stroke"` 保证线宽不被拉伸。年份标签在窄屏只显示逢 5 年份和首尾（其余 `invisible`，不能用 `hidden`，否则 grid 列会错位）。

- [ ] **Step 1: 创建 `src/components/HeatStrip.astro`**

```astro
---
import type { MarketPoint } from '../lib/types';
import { formatCNY } from '../lib/money';

interface Props {
  years: { year: number; count: number }[];
  market: MarketPoint[];
}

const { years, market } = Astro.props;
const n = years.length;
const first = years[0]?.year ?? 0;
const maxCount = Math.max(1, ...years.map((y) => y.count));
const inRange = market.filter((m) => m.year >= first && m.year < first + n);
const maxMarket = Math.max(1, ...inRange.map((m) => m.amountCNY));
const marketByYear = new Map(inRange.map((m) => [m.year, m]));
const linePath = inRange
  .map((m, i) => {
    const x = ((m.year - first + 0.5) / n) * 100;
    const y = 100 - (m.amountCNY / maxMarket) * 86;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  })
  .join(' ');
const showLine = inRange.length >= 2;
const estimated = inRange.some((m) => m.kind === 'estimate');
const marketSources = [...new Map(inRange.map((m) => [m.sourceUrl, m.sourceTitle])).entries()];
const barHeight = (count: number) => (count === 0 ? 2 : 10 + (count / maxCount) * 90);
const columns = `grid-template-columns: repeat(${n}, minmax(0, 1fr))`;
---

{n > 0 && (
  <figure>
    <div class="relative h-36">
      <div class="absolute inset-0 grid items-end gap-1 sm:gap-2" style={columns}>
        {years.map(({ year, count }) => {
          const m = marketByYear.get(year);
          const label = `${year} 年 · ${count} 条记录${m ? ` · 市场 ${formatCNY(m.amountCNY)}` : ''}`;
          return (
            <a href={`#y${year}`} aria-label={label} class="group relative flex h-full items-end justify-center focus-visible:outline-none">
              <span
                class="block w-full max-w-7 bg-ink/15 transition-colors duration-300 group-hover:bg-rouge group-focus-visible:bg-rouge"
                style={`height: ${barHeight(count)}%`}
              ></span>
              <span class="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap bg-ink px-2.5 py-1 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {label}
              </span>
            </a>
          );
        })}
      </div>
      {showLine && (
        <svg
          class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-rouge)"
            stroke-width="1.5"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
            stroke-dasharray={estimated ? '5 4' : undefined}
          ></path>
        </svg>
      )}
    </div>
    <div class="mt-3 grid gap-1 sm:gap-2" style={columns}>
      {years.map(({ year }, i) => (
        <span
          class:list={[
            'text-center font-display text-xs text-mist',
            year % 5 === 0 || i === 0 || i === n - 1 ? '' : 'invisible sm:visible',
          ]}
        >
          {year}
        </span>
      ))}
    </div>
    <figcaption class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-soft">
      <span class="flex items-center gap-2">
        <span class="inline-block h-3 w-2 bg-ink/15"></span>
        柱高：当年收录的成立、上线与大事记条数
      </span>
      {showLine && (
        <span class="flex flex-wrap items-center gap-2">
          <span class:list={['inline-block w-5 border-t-[1.5px] border-rouge', estimated && 'border-dashed']}></span>
          <span>{inRange[0].scope}{estimated ? '（第三方估算）' : ''}</span>
          {marketSources.map(([url, title], i) => (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              title={title}
              class="text-mist underline decoration-ink/20 underline-offset-2 transition hover:text-rouge"
            >
              来源{marketSources.length > 1 ? i + 1 : ''}
            </a>
          ))}
        </span>
      )}
    </figcaption>
  </figure>
)}
```

- [ ] **Step 2: 临时挂到首页验证渲染**

在 `src/pages/index.astro` frontmatter 里临时加入：

```ts
import HeatStrip from '../components/HeatStrip.astro';
import { bucketSize, getYearBuckets, marketSeries } from '../lib/data';
const buckets = getYearBuckets(ds, endYear);
```

并在第一个 `</section>` 之后插入：

```astro
<section class="mx-auto max-w-6xl px-6 pb-12 sm:px-10">
  <HeatStrip years={buckets.map((b) => ({ year: b.year, count: bucketSize(b) }))} market={marketSeries(ds)} />
</section>
```

（Task 5 会整文件替换首页，这里的临时改动随之被覆盖。）

- [ ] **Step 3: 检查**

Run: `npm run check`、`npx astro build`
Expected: 0 errors，构建成功。

浏览器打开 `http://localhost:4321/`：
- 2013—2026 每年一根柱子；悬停出现深色浮层"2015 年 · N 条记录"；Tab 聚焦柱子同样出现浮层。
- 若 Task 2 写入了 ≥ 2 年市场数据：有胭脂红曲线（估算为虚线），图例显示口径和来源链接；否则没有曲线也没有对应图例。
- 390px 宽时年份标签只显示首尾和逢 5 年份，柱子不溢出。

- [ ] **Step 4: Commit**

```powershell
git add src/components/HeatStrip.astro src/pages/index.astro
git commit -m "feat: add year heat strip with market overlay"
```

---

### Task 5: 时间长河与首页

**Files:**
- Create: `src/components/YearRiver.tsx`
- Modify: `src/pages/index.astro`（整文件替换）

**Interfaces:**
- Consumes: Task 1 的 `YearBucket`、`GenreFilter`、`bucketSize`、`filterBucket`、`getYearBuckets`、`marketSeries`；Task 3 的 `SourceLinks`、更新后的 `ProductDrawer({ product, onClose })`；Task 4 的 `HeatStrip`；Phase 1 的 `formatDate`、`genreLabel`、`companyKindLabel`、`timelineKindLabel`。
- Produces: `<YearRiver buckets={YearBucket[]} />`（React island，首页 `client:load`）。每个年份区块 `id="y<year>"`，供热度条锚点跳转。

设计说明：
- 顶部吸顶筛选条（全部 / 乙女 / 换装 / 互动叙事），按钮带 `aria-pressed`。
- 每年一个区块：左列大号年份 `md:sticky md:top-24`；右列按"新成立 / 新作上线 / 大事记"分组，空分组不渲染；筛选后整年为空则不渲染该年。
- 新成立：小卡片（logo 或首字圆章 + 名称 + 日期 · 类型 + 一句话），链接到公司页。
- 新作上线：大卡片（主视觉 16:10 + 品类角标 + 名称 + 日期 + 研发 / 发行），点击打开 `ProductDrawer`。
- 大事记：日期 + 类型（胭脂红小字）+ 一句话 + 公司链接 + 来源 + 待核实。
- 入场动效：`whileInView` 渐入上浮，`useReducedMotion()` 为真时 `initial={false}`。

- [ ] **Step 1: 创建 `src/components/YearRiver.tsx`**

```tsx
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react';
import type { GenreFilter, YearBucket } from '../lib/types';
import { bucketSize, filterBucket } from '../lib/data';
import { formatDate } from '../lib/dates';
import { companyKindLabel, genreLabel, timelineKindLabel } from '../lib/labels';
import ProductDrawer from './ProductDrawer';
import SourceLinks from './SourceLinks';

const FILTERS: { value: GenreFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'otome', label: genreLabel.otome },
  { value: 'dressup', label: genreLabel.dressup },
  { value: 'interactive', label: genreLabel.interactive },
];

const ease = [0.22, 1, 0.36, 1] as const;

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-5 text-xs tracking-[0.3em] text-mist">{label}</h3>
      {children}
    </div>
  );
}

export default function YearRiver({ buckets }: { buckets: YearBucket[] }) {
  const [genre, setGenre] = useState<GenreFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const reduceMotion = useReducedMotion();

  const visible = useMemo(
    () => buckets.map((b) => filterBucket(b, genre)).filter((b) => bucketSize(b) > 0),
    [buckets, genre],
  );
  const open = useMemo(
    () => buckets.flatMap((b) => b.launches).find((p) => p.id === openId),
    [buckets, openId],
  );

  const reveal = (delay = 0) => ({
    initial: reduceMotion ? (false as const) : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, delay, ease },
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className="sticky top-0 z-30 -mx-6 border-b border-ink/10 bg-paper/90 px-6 backdrop-blur sm:-mx-10 sm:px-10">
        <div role="group" aria-label="按品类筛选" className="flex flex-wrap items-center gap-2 py-4 text-sm">
          <span className="mr-2 text-xs tracking-[0.3em] text-mist">品类</span>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={genre === f.value}
              onClick={() => setGenre(f.value)}
              className={`rounded-full border px-4 py-1.5 transition ${
                genre === f.value
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/15 text-ink-soft hover:border-rouge hover:text-rouge'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-24 text-center font-serif text-lg text-ink-soft">这个品类暂时还没有收录内容。</p>
      ) : (
        visible.map((b) => (
          <section
            key={b.year}
            id={`y${b.year}`}
            className="grid scroll-mt-20 gap-8 border-t border-ink/10 py-16 first:border-t-0 md:grid-cols-[11rem_1fr] md:gap-12"
          >
            <div className="md:sticky md:top-24 md:self-start">
              <h2 className="font-display text-6xl leading-none text-ink md:text-8xl">{b.year}</h2>
              <p className="mt-3 text-xs tracking-[0.3em] text-mist">{bucketSize(b)} 条记录</p>
            </div>

            <div className="space-y-14">
              {b.founded.length > 0 && (
                <Group label="新成立">
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {b.founded.map((c, i) => (
                      <motion.li key={c.id} {...reveal(i * 0.06)}>
                        <a
                          href={`/company/${c.id}`}
                          className="group flex items-start gap-4 border border-ink/10 bg-paper-deep/40 p-5 transition hover:-translate-y-0.5 hover:border-rouge/40"
                        >
                          {c.logo ? (
                            <img src={c.logo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rouge-soft font-serif text-lg text-rouge">
                              {c.name.slice(0, 1)}
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block font-serif text-lg text-ink transition group-hover:text-rouge">
                              {c.name}
                            </span>
                            <span className="mt-1 block text-xs tracking-wide text-mist">
                              {formatDate(c.founded)} · {companyKindLabel[c.kind]}
                            </span>
                            <span className="mt-2 block text-sm leading-relaxed text-ink-soft">{c.tagline}</span>
                            {!c.verified && <span className="unverified mt-2">待核实</span>}
                          </span>
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </Group>
              )}

              {b.launches.length > 0 && (
                <Group label="新作上线">
                  <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
                    {b.launches.map((p, i) => {
                      const art = p.keyArt ?? p.cover;
                      return (
                        <motion.li key={p.id} {...reveal((i % 2) * 0.08)}>
                          <button
                            type="button"
                            onClick={() => setOpenId(p.id)}
                            aria-label={`${p.name}，查看详情`}
                            className="group block w-full text-left"
                          >
                            <span className="relative block aspect-[16/10] overflow-hidden bg-paper-deep">
                              {art ? (
                                <img
                                  src={art}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover object-top transition duration-700 ease-out group-hover:scale-[1.03]"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center font-display text-6xl text-ink/10">
                                  {b.year}
                                </span>
                              )}
                              <span className="absolute top-3 left-3 bg-paper/90 px-2 py-1 text-xs tracking-widest text-ink-soft">
                                {genreLabel[p.genre]}
                              </span>
                            </span>
                            <span className="mt-4 flex items-baseline justify-between gap-4">
                              <span className="font-serif text-xl text-ink transition group-hover:text-rouge">
                                {p.name}
                              </span>
                              <span className="shrink-0 font-display text-sm text-mist">{formatDate(p.released)}</span>
                            </span>
                            <span className="mt-1 block text-sm text-ink-soft">
                              研发 {p.developerName}
                              {p.publisherName !== p.developerName && ` · 发行 ${p.publisherName}`}
                            </span>
                            {!p.verified && <span className="unverified mt-2">待核实</span>}
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                </Group>
              )}

              {b.events.length > 0 && (
                <Group label="大事记">
                  <ol className="space-y-5">
                    {b.events.map((e, i) => (
                      <motion.li
                        key={e.id}
                        {...reveal(Math.min(i * 0.05, 0.3))}
                        className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-ink/5 pb-5 sm:grid-cols-[8rem_1fr]"
                      >
                        <p className="font-display text-sm text-mist">
                          {formatDate(e.date)}
                          <span className="mt-1 block font-sans text-xs tracking-[0.2em] text-rouge">
                            {timelineKindLabel[e.kind]}
                          </span>
                        </p>
                        <div>
                          <p className="font-serif leading-relaxed text-ink">{e.label}</p>
                          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist">
                            {e.companies.map((c) => (
                              <a key={c.id} href={`/company/${c.id}`} className="text-ink-soft transition hover:text-rouge">
                                {c.name}
                              </a>
                            ))}
                            <SourceLinks sources={e.sources} />
                            {!e.verified && <span className="unverified">待核实</span>}
                          </p>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                </Group>
              )}
            </div>
          </section>
        ))
      )}

      <AnimatePresence>{open && <ProductDrawer key={open.id} product={open} onClose={close} />}</AnimatePresence>
    </MotionConfig>
  );
}
```

- [ ] **Step 2: 替换 `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import HeatStrip from '../components/HeatStrip.astro';
import YearRiver from '../components/YearRiver';
import { loadDataset } from '../lib/load';
import { bucketSize, getYearBuckets, marketSeries } from '../lib/data';
import { compareDates } from '../lib/dates';

const ds = await loadDataset();
const endYear = new Date().getFullYear();
const buckets = getYearBuckets(ds, endYear);
const firstYear = buckets[0]?.year ?? endYear;
const companies = [...ds.companies].sort((a, b) => compareDates(a.founded, b.founded));
const stats = [
  { label: '收录公司', value: ds.companies.length },
  { label: '作品', value: ds.products.length },
  { label: '大事记', value: ds.events.length },
];
---

<Base title="时间长河">
  <section class="mx-auto max-w-6xl px-6 pt-36 pb-16 sm:px-10">
    <p class="hero-rise font-display text-sm tracking-[0.4em] text-mist">CHRONICLE · {firstYear} — {endYear}</p>
    <h1 class="hero-rise mt-6 font-serif text-5xl leading-tight font-bold sm:text-7xl" style="animation-delay: 80ms">
      中国女性向游戏<br />编年史
    </h1>
    <p class="hero-rise mt-8 max-w-xl font-serif text-lg leading-loose text-ink-soft" style="animation-delay: 160ms">
      从换装到乙女，从互动阅读到 3D 恋爱，记录那些为女性玩家做游戏的公司，以及它们走过的年份。
    </p>
    <dl class="hero-rise mt-12 flex gap-12" style="animation-delay: 240ms">
      {stats.map((s) => (
        <div>
          <dt class="text-xs tracking-[0.3em] text-mist">{s.label}</dt>
          <dd class="mt-2 font-display text-4xl text-ink">{s.value}</dd>
        </div>
      ))}
    </dl>
  </section>

  <section class="mx-auto max-w-6xl px-6 pb-14 sm:px-10">
    <HeatStrip years={buckets.map((b) => ({ year: b.year, count: bucketSize(b) }))} market={marketSeries(ds)} />
  </section>

  <section class="mx-auto max-w-6xl px-6 sm:px-10">
    <p class="text-xs tracking-[0.3em] text-mist">收录公司</p>
    <ul class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
      {companies.map((c) => (
        <li>
          <a href={`/company/${c.id}`} class="font-serif text-lg text-ink-soft transition hover:text-rouge">{c.name}</a>
        </li>
      ))}
    </ul>
  </section>

  <section class="mx-auto max-w-6xl px-6 pt-16 pb-32 sm:px-10">
    <YearRiver client:load buckets={buckets} />
  </section>
</Base>
```

- [ ] **Step 3: 运行全部检查**

Run: `npm test`、`npm run check`、`npx astro build`
Expected: 全部通过，0 errors。

- [ ] **Step 4: 浏览器自查**

访问 `http://localhost:4321/`（若出现组件不水合、卡片停在透明状态，先停掉开发服务器、删除 `node_modules/.vite` 再重启）：
- 首屏：标题、三个统计数字、热度条、收录公司。
- 向下滚动：每个有内容的年份一个区块，年份在左侧吸顶；2013 有"新成立 叠纸游戏"和"新作上线 暖暖环游世界"；2024 有恋与深空、无限暖暖两张大卡片和大事记。
- 点击热度条上的 2018：平滑滚动到 2018 区块，年份不被吸顶筛选条遮住。
- 点"换装"：只剩暖暖系列和相关事件；点"互动叙事"：显示"这个品类暂时还没有收录内容。"；点"全部"恢复。
- 点击大卡片：抽屉打开，Esc 关闭，焦点回到卡片。
- 390px 宽：年份在区块顶部（不吸顶），卡片单列，无横向溢出。

- [ ] **Step 5: Commit**

```powershell
git add src/components/YearRiver.tsx src/pages/index.astro
git commit -m "feat: replace homepage with year river"
```

---

### Task 6: 浏览器视觉验收（由控制者执行）

**Files:** 视检查结果而定；修复由单独的修复子代理完成。

**Interfaces:**
- Consumes: Task 1—5 的全部成果。
- Produces: 修复清单 `.superpowers/sdd/phase2-task-6-fixes.md`（如有）与对应的修复提交。

- [ ] **Step 1: 桌面端 1920×1080 截图**：首页首屏、热度条悬停、2013 区块、2024 区块、筛选为"乙女"、打开抽屉（含关键节点）、公司页时间轴（来源链接）。
- [ ] **Step 2: 窄屏 390px 检查**：首页无横向溢出；年份标签、筛选条、卡片排布正常。
- [ ] **Step 3: 减少动效**：在 CDP 用 `Emulation.setEmulatedMedia` 设 `prefers-reduced-motion: reduce`，确认首页卡片直接可见、无渐入。
- [ ] **Step 4: 键盘**：Tab 能依次到达热度条柱子（出现浮层）、筛选按钮、卡片；抽屉焦点管理正常。
- [ ] **Step 5: 汇总问题**，写修复清单，派修复子代理，复查后提交 `fix: polish year river after visual review`。
