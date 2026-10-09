# 第三期：流水口径、三家自研与对比页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给流水补上统计口径，收录友谊时光 / 乐元素 / 灵犀互娱三家自研公司，做出 `/compare` 泳道对比页，并写下以后给 zcode 用的收录说明书。

**Architecture:** 流水字段仍挂在产品 `revenue[]` 上，新增可选 `basis` / `partial` / `lowerBound`。对比页用纯函数 `getCompareLanes` 取泳道，用 `representativeRevenue` + `compareThickness` 算条带粗细（只在同一 `basis` 内比较）。页面是 React island，选择写入 `?c=`。三家公司按叠纸样板写内容文件。说明书只写方法，不接自动化。

**Tech Stack:** Astro 7.3、React 19、Tailwind CSS 4、d3-scale 4、motion 14（`motion/react`）、Vitest 5、TypeScript 6 + `@astrojs/check`。

## Global Constraints

- Node ≥ 22.12（本机为 v24.14.0）；Windows / PowerShell，没有 bash。提交用 PowerShell，不要写 bash heredoc。
- Zod 一律从 `astro/zod` 导入（Zod 4 语法：`z.url()`、`{ error: '...' }`）。
- 内容集合配置文件为 `src/content.config.ts`，使用 `glob()` loader；条目 id 取自文件名。
- Astro 7 使用 Rust 编译器：所有非空元素必须显式闭合；`compressHTML: 'jsx'` 会去掉行内元素之间的空白，需写 `{' '}` 或用 flex/gap 间距。
- 配色：纸色 `#F4EFE8`、深纸 `#EAE3D9`、墨色 `#1E1A17`、淡墨 `#5B524B`、雾灰 `#A79E95`、胭脂红 `#9E3B4D`、浅胭脂 `#E9D3D5`（Tailwind token：`paper`、`paper-deep`、`ink`、`ink-soft`、`mist`、`rouge`、`rouge-soft`）。
- 字体：标题 `font-serif`（Noto Serif SC），正文 `font-sans`（Noto Sans SC），年份数字 `font-display`（Cormorant Garamond）。
- 动效必须尊重 `prefers-reduced-motion`：React 组件用 `<MotionConfig reducedMotion="user">`，并在 `useReducedMotion()` 为真时 `initial={false}`；CSS 用媒体查询。
- 每条事实数据必须有至少一个来源；未核实的标 `verified: false`，界面显示「待核实」（`.unverified` 样式类）。
- 流水区分 `official` / `estimate`：官方实线，估算虚线。行业机构测算一律 `estimate`。
- 同一产品不得混用年与季度流水。
- 界面文案一律中文。
- 布局 header 为绝对定位，页面自行留出顶部空间（对比页首屏用 `pt-36`）。
- 公司 id 固定：`papergames`、`youyi-shiguang`、`happyelements`、`lingxi`。
- 数字不得用示例值充数。找不到两年以上同口径流水时，产品可以没有 `revenue`。
- 每个任务结束前必须跑通：`npm test`、`npm run check`（0 errors）、`npx astro build`。
- 不要提交 `.superpowers/` 下的任何文件。
- 不要收录阿里 / 腾讯 / 网易 / 米哈游作为公司实体；灵犀的 `parent` 写自由文本 `"阿里巴巴"`。

规格：`docs/superpowers/specs/2026-10-09-phase-3-compare-and-companies-design.md`。

---

## File Structure

| 文件 | 职责 | 任务 |
|---|---|---|
| `src/lib/schema.ts` | `revenueEntrySchema` 增加 `basis` / `partial` / `lowerBound` | 1 |
| `src/lib/types.ts` | `RevenueBasis`、`RevenuePoint` 新字段、`CompareLane` | 1、2 |
| `src/lib/data.ts` | `revenueSeries` 透传口径；`listFreePublishers`；`getCompareLanes`；`representativeRevenue`；`compareThickness` | 1、2 |
| `src/lib/load.ts` | 构建时打印自由文本发行方 | 1 |
| `src/lib/labels.ts` | `revenueBasisLabel` | 1 |
| `src/content/products/*.json`（叠纸已有流水） | 补 `basis` / `partial` / `lowerBound` | 1 |
| `tests/schema.test.ts`、`tests/fixtures.ts`、`tests/data.test.ts` | 口径默认值、发行方列表、泳道与粗细 | 1、2 |
| `src/content/companies/youyi-shiguang.md` 及产品 / 人物 / 事件 | 友谊时光 | 3 |
| `src/content/companies/happyelements.md` 及产品 / 人物 / 事件 | 乐元素 | 4 |
| `src/content/companies/lingxi.md` 及产品 / 人物 / 事件 | 灵犀互娱 | 5 |
| `src/lib/compareQuery.ts`、`tests/compareQuery.test.ts` | `?c=` 解析与序列化 | 6 |
| `src/components/SwimLanes.tsx` | 泳道图 island | 6 |
| `src/pages/compare.astro` | 对比页 | 6 |
| `src/layouts/Base.astro` | 导航加「对比」 | 6 |
| `docs/superpowers/guides/how-to-add-a-company.md` | zcode 收录说明书 | 7 |

已有、**不要重做**的完整性检查（`checkIntegrity` 已实现，测试已覆盖）：同一产品重复 `period`、`shutdown` 与 `status` 互证、停服不早于上线、任职 `to` 不早于 `from`。

---

### Task 1: 流水口径字段、发行方清单、叠纸旧流水补口径

**Files:**
- Modify: `src/lib/schema.ts`（`revenueEntrySchema`）
- Modify: `src/lib/types.ts`（`RevenuePoint`）
- Modify: `src/lib/data.ts`（`revenueSeries`、新增 `listFreePublishers`）
- Modify: `src/lib/load.ts`
- Modify: `src/lib/labels.ts`
- Modify: `src/content/products/love-and-deepspace.json`
- Modify: `src/content/products/love-and-producer.json`
- Modify: `src/content/products/shining-nikki.json`
- Modify: `src/content/products/infinity-nikki.json`
- Modify: `tests/schema.test.ts`、`tests/fixtures.ts`、`tests/data.test.ts`

**Interfaces:**
- Consumes: 现有 `revenueEntrySchema`（`period`、`amountCNY`、`kind`、`source`）、`RevenuePoint`、`displayCompanyName`。
- Produces:
  - `RevenueBasis = 'store' | 'all-platform' | 'official-report'`
  - `revenueEntrySchema` 增加 `basis?: RevenueBasis`、`partial: boolean`（默认 false）、`lowerBound: boolean`（默认 false）
  - `RevenuePoint` 增加 `basis?: RevenueBasis`、`partial: boolean`、`lowerBound: boolean`
  - `revenueBasisLabel: Record<RevenueBasis, string>`：`store` → `应用商店口径`，`all-platform` → `全平台估算`，`official-report` → `官方财报`
  - `listFreePublishers(ds: Dataset): string[]`——`publisher` 不是已收录公司 id 的去重排序列表
  - 旧数据不填 `basis` 仍能通过 zod；`partial` / `lowerBound` 缺省为 false

- [ ] **Step 1: 写失败测试（schema 默认值与拒绝非法 basis）**

在 `tests/schema.test.ts` 的 `productSchema` describe 里，把现有 `revenue` helper 保持不变（不带新字段也应能 parse）。追加：

```ts
  it('流水缺省 basis，partial 与 lowerBound 为 false', () => {
    const parsed = productSchema.parse({ ...valid, revenue: [revenue('2024')] });
    expect(parsed.revenue[0].basis).toBeUndefined();
    expect(parsed.revenue[0].partial).toBe(false);
    expect(parsed.revenue[0].lowerBound).toBe(false);
  });

  it('接受三种口径', () => {
    for (const basis of ['store', 'all-platform', 'official-report'] as const) {
      const parsed = productSchema.parse({
        ...valid,
        revenue: [{ ...revenue('2024'), basis, partial: true, lowerBound: true }],
      });
      expect(parsed.revenue[0]).toMatchObject({ basis, partial: true, lowerBound: true });
    }
  });

  it('拒绝未知口径', () => {
    expect(
      productSchema.safeParse({
        ...valid,
        revenue: [{ ...revenue('2024'), basis: 'sensor-tower' }],
      }).success,
    ).toBe(false);
  });
```

- [ ] **Step 2: 跑测试，确认失败**

Run: `npx vitest run tests/schema.test.ts`
Expected: FAIL，报 `basis` / `partial` / `lowerBound` 不存在。

- [ ] **Step 3: 改 schema、types、labels、revenueSeries**

`src/lib/schema.ts` 把 `revenueEntrySchema` 换成：

```ts
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
```

`src/lib/types.ts` 增加导出并扩展 `RevenuePoint`：

```ts
export type RevenueBasis = z.infer<typeof revenueBasisSchema>;
```

（在 import 列表里加上 `revenueBasisSchema`。）

```ts
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
```

`src/lib/labels.ts` 增加：

```ts
import type { Company, Product, RevenueBasis, TimelineKind } from './types';

export const revenueBasisLabel: Record<RevenueBasis, string> = {
  store: '应用商店口径',
  'all-platform': '全平台估算',
  'official-report': '官方财报',
};
```

`src/lib/data.ts` 的 `revenueSeries` 映射改为：

```ts
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
```

- [ ] **Step 4: 再跑 schema 测试**

Run: `npx vitest run tests/schema.test.ts`
Expected: PASS。

- [ ] **Step 5: 写 `listFreePublishers` 的失败测试，并补 fixture 字段**

`tests/fixtures.ts` 里两条带 `revenue` 的条目，每条流水补上 `partial: false, lowerBound: false`（可以不写 `basis`）。`tests/data.test.ts` 里所有 `revenue.push({...})` 同样补这两个字段。

在 `tests/data.test.ts` 增加：

```ts
describe('listFreePublishers', () => {
  it('列出不是已收录公司 id 的发行方，去重排序', () => {
    const ds = makeDataset();
    expect(listFreePublishers(ds)).toEqual(['某发行商']);
    ds.products[1].publisher = '腾讯游戏';
    ds.products.push({ ...ds.products[1], id: 'a-third', publisher: '腾讯' });
    expect(listFreePublishers(ds)).toEqual(['腾讯', '腾讯游戏']);
  });
});
```

并更新 `revenueSeries` 断言，使第一点包含 `partial: false, lowerBound: false`：

```ts
    expect(series[0]).toMatchObject({
      x: 2015,
      amountCNY: 1e8,
      kind: 'official',
      partial: false,
      lowerBound: false,
      sourceTitle: '测试来源',
    });
```

- [ ] **Step 6: 跑测试，确认 listFreePublishers 失败**

Run: `npx vitest run tests/data.test.ts`
Expected: FAIL，`listFreePublishers` 未导出。

- [ ] **Step 7: 实现 listFreePublishers，构建时打印**

在 `src/lib/data.ts`：

```ts
export function listFreePublishers(ds: Dataset): string[] {
  const companyIds = new Set(ds.companies.map((c) => c.id));
  return [...new Set(ds.products.map((p) => p.publisher).filter((name) => !companyIds.has(name)))].sort((a, b) =>
    a.localeCompare(b, 'zh-CN'),
  );
}
```

`src/lib/load.ts` 在 `checkIntegrity` 通过之后、`return ds` 之前：

```ts
  const freePublishers = listFreePublishers(ds);
  if (freePublishers.length > 0) {
    console.info(`自由文本发行方（请沿用已有写法）：${freePublishers.join('、')}`);
  }
```

记得从 `./data` 一并导入 `listFreePublishers`。

- [ ] **Step 8: 叠纸已有流水补口径（按现有 source 标题判断，不要改金额）**

| 文件 | period | basis | partial | lowerBound |
|---|---|---|---|---|
| `love-and-deepspace.json` | 2024、2025 | `store` | false | false |
| `love-and-producer.json` | 2018、2019、2020 | `all-platform` | false | false |
| `shining-nikki.json` | 2019 | `all-platform` | true | false |
| `infinity-nikki.json` | 2024 | `all-platform` | true | true |

每条流水对象加上对应字段，例如无限暖暖：

```json
      "basis": "all-platform",
      "partial": true,
      "lowerBound": true,
```

- [ ] **Step 9: 跑完全部检查**

Run: `npm test`、`npm run check`、`npx astro build`
Expected: 测试全过；check 0 errors；build 成功，日志里出现「自由文本发行方……猎豹移动（iOS）/ 阿里游戏（安卓）」或当前叠纸数据里的自由文本发行方。

- [ ] **Step 10: Commit**

```powershell
git add src/lib/schema.ts src/lib/types.ts src/lib/data.ts src/lib/load.ts src/lib/labels.ts src/content/products/love-and-deepspace.json src/content/products/love-and-producer.json src/content/products/shining-nikki.json src/content/products/infinity-nikki.json tests/schema.test.ts tests/fixtures.ts tests/data.test.ts
git commit -m "feat: add revenue basis, partial and lowerBound"
```

---

### Task 2: `getCompareLanes` 与条带粗细

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/data.ts`
- Modify: `tests/data.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `RevenueEntry.basis` / `partial` / `lowerBound`、`toProductCards`、`compareDates`、`periodToNumber`。
- Produces:
  - `CompareLane { company: Company; products: ProductCard[]; events: ChronicleEvent[] }`
  - `getCompareLanes(ds: Dataset, ids: string[]): CompareLane[]`
    - `ids` 为空 → 全部已收录公司
    - 未知 id 忽略，不报错
    - 泳道按公司 `founded` 升序，同年按 `id` 字母序
    - 产品只收 `developer === company.id`（自研；发行代理不画第二条）
    - 产品按 `released` 升序
    - 事件只含 `e.companies` 包含该泳道公司的条目，按 `date` 升序
  - `COMPARE_THICKNESS_MIN = 6`、`COMPARE_THICKNESS_MAX = 28`
  - `representativeRevenue(product: Product): RevenueEntry | undefined`——按 `periodToNumber` 取最晚一条；无流水则 `undefined`
  - `compareThickness(product: Product, peers: Product[]): number`
    - 代表流水没有 `basis` → 返回 `COMPARE_THICKNESS_MIN`
    - 只拿 `peers` 里代表流水 `basis` 相同的金额做 min-max 线性映射到 `[MIN, MAX]`
    - 该口径下只有一个金额或 min===max → 返回 `(MIN + MAX) / 2`

- [ ] **Step 1: 写失败测试**

在 `tests/data.test.ts` 追加（从 `../src/lib/data` 导入新符号）：

```ts
describe('getCompareLanes', () => {
  const ds = makeDataset();

  it('ids 为空时返回全部公司，按成立时间排序', () => {
    expect(getCompareLanes(ds, []).map((l) => l.company.id)).toEqual(['alpha', 'beta']);
  });

  it('忽略未知 id，只返回仍存在的公司', () => {
    expect(getCompareLanes(ds, ['beta', 'ghost']).map((l) => l.company.id)).toEqual(['beta']);
  });

  it('产品只收本公司自研，按上线排序；事件只含本公司', () => {
    const [alpha] = getCompareLanes(ds, ['alpha']);
    expect(alpha.products.map((p) => p.id)).toEqual(['a-first', 'a-second']);
    expect(alpha.products[0].developerName).toBe('Alpha 游戏');
    expect(alpha.events.map((e) => e.id)).toEqual(['alpha-a-round', 'joint']);
  });

  it('全部 id 都不存在时返回空数组', () => {
    expect(getCompareLanes(ds, ['ghost'])).toEqual([]);
  });
});

describe('representativeRevenue', () => {
  it('取期间最晚的一条；没有流水则 undefined', () => {
    const ds = makeDataset();
    expect(representativeRevenue(ds.products[0])?.period).toBe('2016');
    expect(representativeRevenue(ds.products[1])).toBeUndefined();
  });
});

describe('compareThickness', () => {
  const source = { title: 's', url: 'https://example.com' };
  const entry = (amountCNY: number, basis: 'store' | 'all-platform' = 'store') => ({
    period: '2024',
    amountCNY,
    kind: 'estimate' as const,
    basis,
    partial: false,
    lowerBound: false,
    source,
  });
  const product = (id: string, revenue: ReturnType<typeof entry>[]) =>
    ({
      id,
      name: id,
      aliases: [],
      genre: 'otome' as const,
      developer: 'alpha',
      publisher: 'alpha',
      released: '2020',
      platforms: ['iOS'],
      status: 'live' as const,
      significance: 'x',
      revenue,
      sources: [source],
      verified: true,
    });

  it('没有口径时用最细条', () => {
    expect(compareThickness(product('a', []), [product('b', [entry(1e9)])])).toBe(COMPARE_THICKNESS_MIN);
  });

  it('只在同一 basis 内比较粗细', () => {
    const storeSmall = product('a', [entry(1e8, 'store')]);
    const storeLarge = product('b', [entry(9e8, 'store')]);
    const allPlat = product('c', [entry(9e9, 'all-platform')]);
    expect(compareThickness(storeSmall, [storeSmall, storeLarge, allPlat])).toBe(COMPARE_THICKNESS_MIN);
    expect(compareThickness(storeLarge, [storeSmall, storeLarge, allPlat])).toBe(COMPARE_THICKNESS_MAX);
    expect(compareThickness(allPlat, [storeSmall, storeLarge, allPlat])).toBe(
      (COMPARE_THICKNESS_MIN + COMPARE_THICKNESS_MAX) / 2,
    );
  });
});
```

- [ ] **Step 2: 跑测试，确认失败**

Run: `npx vitest run tests/data.test.ts`
Expected: FAIL，`getCompareLanes` / `representativeRevenue` / `compareThickness` 未导出。

- [ ] **Step 3: 实现类型与函数**

`src/lib/types.ts` 追加：

```ts
export interface CompareLane {
  company: Company;
  products: ProductCard[];
  events: ChronicleEvent[];
}
```

`src/lib/data.ts` 追加（`toProductCards` 之后即可）：

```ts
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/data.test.ts`
Expected: PASS。

- [ ] **Step 5: 全量检查并提交**

Run: `npm test`、`npm run check`、`npx astro build`
Expected: 全过。

```powershell
git add src/lib/types.ts src/lib/data.ts tests/data.test.ts
git commit -m "feat: add compare lanes and thickness scale"
```

---

### Task 3: 友谊时光数据采集

**Files:**
- Create: `src/content/companies/youyi-shiguang.md`
- Create: `src/content/products/<id>.json`（核实后的女向代表作，id 小写英文短横线）
- Create: `src/content/people/<id>.json`（查得到再写，查不到不建文件）
- Create: `src/content/events/<id>.json`（融资、上市、改名、里程碑、争议等）
- Create (scratch, 不提交): `.superpowers/sdd/task-3-research.md`

**Interfaces:**
- Consumes: 现有 company / product / person / event schema；Task 1 的流水口径字段。
- Produces: 公司 id 必须是 `youyi-shiguang`；`kind: independent`；`headquarters` 为苏州（若工商/官宣一致）。产品 `developer: "youyi-shiguang"`。

这是数据采集任务。用联网检索（搜索引擎 + 抓取页面）完成，**禁止编造数字和日期**。

- [ ] **Step 1: 检索**

检索词（至少覆盖这些，可补充）：

- `友谊时光 玩友时代 成立 苏州`
- `友谊时光 宫廷计 上线`
- `友谊时光 熹妃传 上线`
- `花与绯想 友谊时光`
- `玩友时代 港股 上市`
- `宫廷计 流水` / `熹妃传 流水 Sensor Tower`

优先来源：官网 / 港交所公告 / 工商转述的当期报道 / 权威新闻；流水优先 Sensor Tower 或官方财报。男向、合成、非女向主线不收。

- [ ] **Step 2: 决定产品名单**

- 《宫廷计》《熹妃传》应收录（女向宫廷向代表作）。
- 《花与绯想》等近年新作：核实是女向且已公开上线再收；未上线则不建产品，可在公司笔记里提一句。
- 同一产品换皮 / 渠道版只建一条，`aliases` 写其它名字。

- [ ] **Step 3: 写公司 Markdown**

对齐 `src/content/companies/papergames.md`：frontmatter + 正文「概览 / 关键转折 / 资料分歧」。frontmatter 必填：`name`、`aliases`（含玩友时代及工商名）、`founded`、`headquarters`、`kind: independent`、`status`、`tagline`、`sources`、`verified`。有官网就写 `website`。

- [ ] **Step 4: 写产品 / 人物 / 事件 JSON**

产品字段对齐叠纸产品。流水能查到两年以上同口径再写 `revenue`，并填 `basis`；只有「超过 X」则 `lowerBound: true`；上线当年不足一年则 `partial: true`。找不到流水就 `revenue: []`。

事件 `companies` 必须含 `youyi-shiguang`。人物 `roles.company` 必须是 `youyi-shiguang`。

- [ ] **Step 5: 研究记录**

`.superpowers/sdd/task-3-research.md` 写：收录了哪些产品、排除了哪些及原因、流水取舍、未解决分歧。不要 git add 这个文件。

- [ ] **Step 6: 验证**

Run: `npm test`、`npm run check`、`npx astro build`
Expected: 全过；`/company/youyi-shiguang` 能静态生成。

- [ ] **Step 7: Commit**

```powershell
git add src/content/companies/youyi-shiguang.md src/content/products src/content/people src/content/events
git commit -m "data: add Youyi Shiguang and female-oriented titles"
```

只 add 本任务新建的文件，不要把无关改动塞进去。

---

### Task 4: 乐元素数据采集

**Files:**
- Create: `src/content/companies/happyelements.md`
- Create: `src/content/products/<id>.json`（偶像梦幻祭系列里核实过的条目）
- Create: `src/content/people/<id>.json`（查得到再写）
- Create: `src/content/events/<id>.json`
- Create (scratch, 不提交): `.superpowers/sdd/task-4-research.md`

**Interfaces:**
- Consumes: 与 Task 3 相同的 schema 与口径规则。
- Produces: 公司 id 必须是 `happyelements`；`kind: independent`；以国内工商主体与国服官宣为准，不把日本总部分成第二家公司。产品 `developer: "happyelements"`。

- [ ] **Step 1: 检索**

检索词：`乐元素 成立`、`Happy Elements 中国 工商`、`偶像梦幻祭 国服 上线`、`偶像梦幻祭 Music 停服`、`偶像梦幻祭 流水`、`乐元素 女性向`。

只收女向代表作（偶像梦幻祭系列）。非女向产品不收。国服 / 日服若为同一 IP 的两个独立运营产品：能核实国服主体是乐元素中国的才收国服；不要为日本法人再建公司。

- [ ] **Step 2: 写公司、产品、人物、事件**

公司笔记同样要有概览 / 关键转折 / 资料分歧。流水规则与 Task 3 相同。停服作品必须同时有 `status: "shutdown"` 和 `shutdown` 日期。

- [ ] **Step 3: 研究记录**

`.superpowers/sdd/task-4-research.md`：产品取舍、日中主体如何处理、流水口径。不要提交。

- [ ] **Step 4: 验证**

Run: `npm test`、`npm run check`、`npx astro build`
Expected: 全过；生成 `/company/happyelements`。

- [ ] **Step 5: Commit**

```powershell
git add src/content/companies/happyelements.md src/content/products src/content/people src/content/events
git commit -m "data: add Happy Elements and Ensemble Stars"
```

---

### Task 5: 灵犀互娱数据采集

**Files:**
- Create: `src/content/companies/lingxi.md`
- Create: `src/content/products/<id>.json`（《代号鸢》《如鸢》，若核实为同一产品则只建一条）
- Create: `src/content/people/<id>.json`（查得到再写）
- Create: `src/content/events/<id>.json`
- Create (scratch, 不提交): `.superpowers/sdd/task-5-research.md`

**Interfaces:**
- Consumes: 与 Task 3 相同的 schema 与口径规则。
- Produces: 公司 id 必须是 `lingxi`；`kind: studio`；`parent: "阿里巴巴"`（自由文本，不要建阿里公司条目）；只收《代号鸢》《如鸢》。产品 `developer: "lingxi"`。

- [ ] **Step 1: 检索**

检索词：`灵犀互娱 成立`、`阿里 灵犀 代号鸢`、`代号鸢 上线`、`如鸢 代号鸢 区别`、`代号鸢 流水 Sensor Tower`。

判断《代号鸢》与《如鸢》是双端/换名还是两款独立游戏：前者只建一条（另一个进 `aliases`），后者建两条。灵犀其它非女向产品不收。

- [ ] **Step 2: 写公司、产品、人物、事件**

`parent` 必须是 `"阿里巴巴"`。公司页会显示「隶属阿里巴巴」。笔记里写清工作室与阿里的关系，但不要把阿里写成可跳转的公司 id。

- [ ] **Step 3: 研究记录**

`.superpowers/sdd/task-5-research.md`。不要提交。

- [ ] **Step 4: 验证**

Run: `npm test`、`npm run check`、`npx astro build`
Expected: 全过；生成 `/company/lingxi`。

- [ ] **Step 5: Commit**

```powershell
git add src/content/companies/lingxi.md src/content/products src/content/people src/content/events
git commit -m "data: add Lingxi and Code Yan titles"
```

---

### Task 6: 对比页 UI、URL 勾选、导航、视觉验收

**Files:**
- Create: `src/lib/compareQuery.ts`
- Create: `tests/compareQuery.test.ts`
- Create: `src/components/SwimLanes.tsx`
- Create: `src/pages/compare.astro`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: Task 2 的 `getCompareLanes`、`representativeRevenue`、`compareThickness`、`COMPARE_THICKNESS_*`；Task 1 的 `revenueBasisLabel`；`dateToNumber`、`formatDate`、`formatCNY`、`timelineKindLabel`。
- Produces:
  - `parseCompareIds(query: string, knownIds: string[]): string[]`
    - 查询串里**没有** `c` 这个键 → 返回 `[...knownIds]`（默认全选）
    - 有 `c` → 按逗号拆、去空白、只留 `knownIds` 里有的、去重；可以是空数组（用户取消了全部）
  - `serializeCompareIds(ids: string[]): string` → 字母序 `join(',')`
  - `SwimLanes`：`{ lanes: CompareLane[]; endYear: number }`
  - 页头「时间长河」旁增加「对比」；当前路径以 `/compare` 开头时「对比」为 `text-rouge`
  - 勾选变化用 `history.replaceState` 写 `?c=`（全选时删除 `c`，保持干净 URL）

- [ ] **Step 1: 写 compareQuery 失败测试**

`tests/compareQuery.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { parseCompareIds, serializeCompareIds } from '../src/lib/compareQuery';

const known = ['happyelements', 'lingxi', 'papergames', 'youyi-shiguang'];

describe('parseCompareIds', () => {
  it('没有 c 参数时默认全选', () => {
    expect(parseCompareIds('', known)).toEqual(known);
    expect(parseCompareIds('foo=1', known)).toEqual(known);
  });

  it('只保留已知 id，忽略未知', () => {
    expect(parseCompareIds('c=lingxi,ghost,papergames', known)).toEqual(['lingxi', 'papergames']);
  });

  it('有 c 但没有任何已知 id 时是空选择，不回退全选', () => {
    expect(parseCompareIds('c=', known)).toEqual([]);
    expect(parseCompareIds('c=ghost', known)).toEqual([]);
  });
});

describe('serializeCompareIds', () => {
  it('按字母排序后用逗号连接', () => {
    expect(serializeCompareIds(['papergames', 'lingxi'])).toBe('lingxi,papergames');
  });
});
```

- [ ] **Step 2: 跑测试，确认失败**

Run: `npx vitest run tests/compareQuery.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 compareQuery**

`src/lib/compareQuery.ts`：

```ts
export function parseCompareIds(query: string, knownIds: string[]): string[] {
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  if (!params.has('c')) return [...knownIds];
  return [...new Set((params.get('c') ?? '').split(',').map((id) => id.trim()).filter((id) => knownIds.includes(id)))];
}

export function serializeCompareIds(ids: string[]): string {
  return [...new Set(ids)].sort().join(',');
}
```

- [ ] **Step 4: 跑 compareQuery 测试**

Run: `npx vitest run tests/compareQuery.test.ts`
Expected: PASS。

- [ ] **Step 5: 改导航**

`src/layouts/Base.astro` 在 props 解构之后加：

```ts
const path = Astro.url.pathname;
```

把 `<nav>` 换成：

```astro
        <nav class="flex gap-8 text-sm text-ink-soft">
          <a href="/" class:list={['transition hover:text-rouge', path === '/' && 'text-rouge']}>时间长河</a>
          <a href="/compare" class:list={['transition hover:text-rouge', path.startsWith('/compare') && 'text-rouge']}>对比</a>
        </nav>
```

- [ ] **Step 6: 写对比页与泳道组件**

`src/pages/compare.astro`：

```astro
---
import Base from '../layouts/Base.astro';
import SwimLanes from '../components/SwimLanes';
import { loadDataset } from '../lib/load';
import { getCompareLanes } from '../lib/data';

const ds = await loadDataset();
const endYear = new Date().getFullYear();
const lanes = getCompareLanes(ds, []);
---

<Base title="对比" description="把已收录公司放在同一条时间轴上并排比较。这是并排年表，不是市值榜。">
  <section class="mx-auto max-w-6xl px-6 pt-36 pb-10 sm:px-10">
    <p class="font-display text-sm tracking-[0.4em] text-mist">COMPARE</p>
    <h1 class="mt-6 font-serif text-5xl font-bold sm:text-6xl">并排年表</h1>
    <p class="mt-6 max-w-xl font-serif text-lg leading-loose text-ink-soft">
      这是并排年表，不是市值榜。条带长度是作品从上线到停服或至今的时间；粗细只在同一流水口径里比较。
    </p>
  </section>
  <SwimLanes client:load lanes={lanes} endYear={endYear} />
</Base>
```

`src/components/SwimLanes.tsx` 整文件如下（不要引入新图表库，不要用 `any`）：

```tsx
import { useEffect, useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { MotionConfig } from 'motion/react';
import type { ChronicleEvent, CompareLane, ProductCard } from '../lib/types';
import { compareThickness, representativeRevenue } from '../lib/data';
import { parseCompareIds, serializeCompareIds } from '../lib/compareQuery';
import { dateToNumber, formatDate } from '../lib/dates';
import { formatCNY } from '../lib/money';
import { revenueBasisLabel, timelineKindLabel } from '../lib/labels';

const LABEL_W = 148;
const PAD_X = 32;
const YEAR_W = 112;
const LANE_H = 96;
const AXIS_H = 36;

function eventFill(type: ChronicleEvent['type']): string {
  switch (type) {
    case 'funding':
    case 'ipo':
      return '#9E3B4D';
    case 'controversy':
      return '#1E1A17';
    case 'layoff':
    case 'rename':
      return '#A79E95';
    default:
      return '#5B524B';
  }
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

function writeUrl(ids: string[], allIds: string[]) {
  const url = new URL(window.location.href);
  if (sameSet(ids, allIds)) url.searchParams.delete('c');
  else url.searchParams.set('c', serializeCompareIds(ids));
  history.replaceState(null, '', url);
}

type Tip =
  | { kind: 'product'; x: number; y: number; product: ProductCard }
  | { kind: 'event'; x: number; y: number; event: ChronicleEvent };

export default function SwimLanes({ lanes, endYear }: { lanes: CompareLane[]; endYear: number }) {
  const allIds = useMemo(() => lanes.map((l) => l.company.id), [lanes]);
  const [selected, setSelected] = useState(() =>
    typeof window === 'undefined' ? allIds : parseCompareIds(window.location.search, allIds),
  );
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    writeUrl(selected, allIds);
  }, [selected, allIds]);

  const visible = lanes.filter((l) => selected.includes(l.company.id));
  const visibleProducts = visible.flatMap((l) => l.products);

  const dates = visible.flatMap((l) => [
    l.company.founded,
    ...l.products.map((p) => p.released),
    ...l.events.map((e) => e.date),
  ]);
  const start = dates.length === 0 ? endYear - 4 : Math.floor(Math.min(...dates.map(dateToNumber)));
  const end = endYear + 1;
  const years = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const width = LABEL_W + PAD_X * 2 + Math.max(1, years.length - 1) * YEAR_W;
  const height = AXIS_H + visible.length * LANE_H;
  const x = scaleLinear()
    .domain([start, end])
    .range([LABEL_W + PAD_X, width - PAD_X]);

  const toggle = (id: string) => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]));
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div role="group" aria-label="选择对比公司" className="flex flex-wrap gap-3 pb-8 text-sm">
          {lanes.map((l) => (
            <label key={l.company.id} className="flex cursor-pointer items-center gap-2 text-ink-soft">
              <input
                type="checkbox"
                checked={selected.includes(l.company.id)}
                onChange={() => toggle(l.company.id)}
              />
              <span className={selected.includes(l.company.id) ? 'text-ink' : ''}>{l.company.name}</span>
            </label>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mx-auto max-w-6xl px-6 pb-24 font-serif text-ink-soft sm:px-10">请选择至少一家公司</p>
      ) : (
        <div className="relative overflow-x-auto pb-24">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            className="min-w-full"
            role="img"
            aria-label="对比泳道"
          >
            {years.map((year) => (
              <g key={year}>
                <line x1={x(year)} x2={x(year)} y1={0} y2={height} className="stroke-ink/10" />
                <text x={x(year)} y={22} textAnchor="middle" className="fill-mist font-display text-[14px]">
                  {year}
                </text>
              </g>
            ))}

            {visible.map((lane, i) => {
              const mid = AXIS_H + i * LANE_H + LANE_H / 2;
              return (
                <g key={lane.company.id}>
                  <line x1={LABEL_W} x2={width} y1={mid} y2={mid} className="stroke-ink/15" />
                  {lane.products.map((product) => {
                    const rev = representativeRevenue(product);
                    const faded = !!(rev?.partial || rev?.lowerBound);
                    const h = compareThickness(product, visibleProducts);
                    const x1 = x(dateToNumber(product.released));
                    const x2 = x(dateToNumber(product.shutdown ?? `${endYear}`));
                    const w = Math.max(8, x2 - x1);
                    return (
                      <a key={product.id} href={`/company/${product.developer}#works`}>
                        <rect
                          x={x1}
                          y={mid - h / 2}
                          width={w}
                          height={h}
                          rx={h / 2}
                          fill="#9E3B4D"
                          fillOpacity={faded ? 0.28 : 0.55}
                          stroke="#9E3B4D"
                          strokeDasharray={rev?.kind === 'estimate' ? '4 3' : undefined}
                          onMouseEnter={(e) => setTip({ kind: 'product', x: e.clientX, y: e.clientY, product })}
                          onMouseLeave={() => setTip(null)}
                        />
                      </a>
                    );
                  })}
                  {lane.events.map((event) => (
                    <circle
                      key={event.id}
                      cx={x(dateToNumber(event.date))}
                      cy={mid}
                      r={5}
                      fill={eventFill(event.type)}
                      onMouseEnter={(e) => setTip({ kind: 'event', x: e.clientX, y: e.clientY, event })}
                      onMouseLeave={() => setTip(null)}
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-[148px] bg-gradient-to-r from-paper via-paper/95 to-transparent">
            {visible.map((lane, i) => (
              <a
                key={lane.company.id}
                href={`/company/${lane.company.id}`}
                className="pointer-events-auto absolute left-6 truncate font-serif text-sm text-ink hover:text-rouge"
                style={{ top: AXIS_H + i * LANE_H + LANE_H / 2 - 10 }}
              >
                {lane.company.name}
              </a>
            ))}
          </div>

          {tip && (
            <div
              className="pointer-events-none fixed z-50 max-w-xs rounded-sm border border-ink/10 bg-paper px-4 py-3 text-sm shadow-sm"
              style={{ left: tip.x + 12, top: tip.y + 12 }}
            >
              {tip.kind === 'product' ? <ProductTip product={tip.product} endYear={endYear} /> : <EventTip event={tip.event} />}
            </div>
          )}
        </div>
      )}
    </MotionConfig>
  );
}

function ProductTip({ product, endYear }: { product: ProductCard; endYear: number }) {
  const rev = representativeRevenue(product);
  const until = product.shutdown ? formatDate(product.shutdown) : `${endYear}年至今`;
  return (
    <div>
      <p className="font-serif text-ink">《{product.name}》</p>
      <p className="mt-1 text-ink-soft">
        {formatDate(product.released)}
        {' — '}
        {until}
      </p>
      {rev && (
        <p className="mt-2 text-ink">
          {formatCNY(rev.amountCNY)}
          {rev.basis ? ` · ${revenueBasisLabel[rev.basis]}` : ''}
          {rev.partial ? ' · 部分月份' : ''}
          {rev.lowerBound ? ' · 下限' : ''}
        </p>
      )}
      {!product.verified && <span className="unverified mt-2">待核实</span>}
    </div>
  );
}

function EventTip({ event }: { event: ChronicleEvent }) {
  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-mist">{timelineKindLabel[event.type]}</p>
      <p className="mt-1 font-serif text-ink">{event.summary}</p>
      <p className="mt-1 text-ink-soft">{formatDate(event.date)}</p>
      {!event.verified && <span className="unverified mt-2">待核实</span>}
    </div>
  );
}
```

- [ ] **Step 7: 跑检查**

Run: `npm test`、`npm run check`、`npx astro build`
Expected: 全过；`dist` 里有 `compare/index.html`。

- [ ] **Step 8: 浏览器视觉验收**

启动或复用 `npx astro dev --host 127.0.0.1 --port 4321`。用浏览器工具走完：

1. 首页导航能点进「对比」；对比页「对比」为红色当前态。
2. `/compare` 默认四条泳道（若某家产品尚未写入则仍有公司名空泳道——公司条目在 Task 3–5 已建）。条带从作品上线延伸到停服或轴末端。
3. 取消一家，该泳道消失，URL 出现 `?c=`（字母序、无空格）。刷新后勾选保持。再勾回全部，`c` 从 URL 去掉。
4. 悬停有流水的条带：能看到金额和口径；`infinity-nikki` 若被选中应出现「部分月份」「下限」。估算条为虚线描边。
5. 点击公司名进入公司页；点击条带进入该公司页 `#works`。
6. 窄视口（约 390px）：泳道可横滑，公司名吸左，不被裁没。
7. 首页时间长河能看到四家成立与作品（Task 3–5 之后）。

发现问题就改，再跑 `npm test`、`npm run check`、`npx astro build`。

- [ ] **Step 9: Commit**

```powershell
git add src/lib/compareQuery.ts tests/compareQuery.test.ts src/components/SwimLanes.tsx src/pages/compare.astro src/layouts/Base.astro
git commit -m "feat: add compare swimlanes page"
```

---

### Task 7: zcode 收录说明书

**Files:**
- Create: `docs/superpowers/guides/how-to-add-a-company.md`

**Interfaces:**
- Consumes: 本期 schema、口径规则、叠纸 + 三家样板路径。
- Produces: 一篇给以后 zcode 夜间批量收录用的方法说明。不写定时任务、不改 CI、不接 zcode。

- [ ] **Step 1: 写说明书**

文件必须包含以下全部小节，用中文，命令用 PowerShell：

```markdown
# 如何收录一家女性向游戏公司

给以后用自动化（例如 zcode）补录公司的人看。只收**公司**，优先自研。不要把橙光 / 闪艺上的用户作品做成产品条目。不要为阿里、腾讯、网易、米哈游建公司实体；大厂只收其女性向工作室，`kind: studio`，`parent` 写集团中文名。

## 1. 要新建哪些文件

id 一律小写英文短横线，取自文件名：

- `src/content/companies/<id>.md`
- `src/content/products/<product-id>.json`（只收该公司女性向代表作）
- `src/content/people/<person-id>.json`（查得到再写）
- `src/content/events/<event-id>.json`

对照样板：`src/content/companies/papergames.md`、`youyi-shiguang.md`、`happyelements.md`、`lingxi.md`。

## 2. 检索顺序

1. 官网 About / 新闻
2. 工商成立时间（当期报道转述即可）
3. 上线 / 停服的官方公告或当期新闻
4. 融资、上市、改名、争议
5. 流水：官方财报 / 公告 → Sensor Tower 应用商店 → 全平台估算。不同口径不要写进同一条 `revenue` 序列里冒充连续。

预测值（「预计将达到」）不收录。

## 3. 流水口径

- `kind`: 官方财报 / 公告 = `official`，其余 = `estimate`
- `basis`: `store`（应用商店，如 Sensor Tower）、`all-platform`（全平台估算）、`official-report`（官方财报）
- `partial: true`：该期间只覆盖部分月份
- `lowerBound: true`：原文是「超过 / 至少」
- 同一产品不得混用 `YYYY` 与 `YYYY-Q1`
- 找不到两年以上同口径数字：`revenue: []`

## 4. 冲突与命名

- 冲突：条目 `verified: false`，公司笔记「资料分歧」写清两说与采用理由
- 发行方若是已收录公司，填那个公司 id；否则填自由文本，**必须沿用仓库里已经出现过的写法**（构建日志会打印「自由文本发行方：…」）
- 无公开上线产品（只有预告 / 已取消）→ **暂缓**，不要建只有空壳的公司

## 5. 待收录（本期未做）

橙光、闪艺、腾讯北极光 /《光与夜之恋》、米哈游 /《未定事件簿》、网易女向线（《绘旅人》《世界之外》《云裳羽衣》等）。三七苏州萤火若代表作仍未上线，继续暂缓。

## 6. 自检

在仓库根目录：

```powershell
npm test
npm run check
npx astro build
```

三道都必须过。构建失败常见原因：引用了不存在的公司 / 产品 id、流水年季混用、停服缺日期、日期倒序。
```

把上面全文写入该路径（可以按样板稍作排版，但六个小节标题和待收录名单不能少）。

- [ ] **Step 2: Commit**

```powershell
git add docs/superpowers/guides/how-to-add-a-company.md
git commit -m "docs: add how to add a company playbook"
```

---

## 自我对照（写计划时已核对）

| 规格条目 | 任务 |
|---|---|
| §3 流水 `basis` / `partial` / `lowerBound`；旧数据可缺省 | Task 1 |
| §3 对比粗细只比同一 `basis`；partial/lowerBound 淡填充 | Task 2 + Task 6 |
| §3 叠纸旧流水补 basis | Task 1 |
| §2 友谊时光 / 乐元素 / 灵犀（阿里不建条目） | Task 3–5 |
| §4 `/compare` 泳道、URL、导航、窄屏吸左 | Task 6 |
| §5 完整性（已有部分不重做）+ 自由文本发行方列表 | Task 1 |
| §6 zcode 说明书，不接自动化 | Task 7 |
| §7 不做关系网 / CMS / UGC / 大厂实体 / 市值并排 | 各任务均未包含 |
| §9 验收四家详情 + 对比勾选 + 测试/check/build | Task 3–6 |
