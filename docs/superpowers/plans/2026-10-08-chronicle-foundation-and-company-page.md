# 编年史第一期：项目骨架 + 叠纸样板数据 + 公司详情页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭好 Astro 项目与数据层，用叠纸游戏的真实数据做出一个完整、好看、可交互的公司详情页。

**Architecture:** Astro 7 静态站。数据存放在 `src/content/` 下的 Markdown / JSON 文件，由 `src/lib/schema.ts` 中的 Zod schema 校验；`src/lib/data.ts` 是不依赖 Astro 的纯函数层（可单测），`src/lib/load.ts` 负责从 Astro 内容集合读取并做引用完整性检查。交互部分（时间轴、作品抽屉、流水图）是 React 组件，以 `client:visible` 挂载。

**Tech Stack:** Astro 7.3、@astrojs/react 7、React 19、Tailwind CSS 4（@tailwindcss/vite）、motion 14、d3-scale / d3-shape、Vitest 5、@fontsource 字体（Noto Serif SC、Noto Sans SC、Cormorant Garamond）。

## Global Constraints

- Node ≥ 22.12（本机为 v24.14.0）。
- Zod 一律从 `astro/zod` 导入（Zod 4 语法：`z.url()`、`{ error: '...' }`）。
- 内容集合配置文件为 `src/content.config.ts`，使用 `glob()` loader；条目 id 取自文件名。
- Astro 7 使用 Rust 编译器：所有非空元素必须显式闭合；行内元素之间的空格需写 `{' '}` 或用间距工具类。
- 配色：纸色 `#F4EFE8`、深纸 `#EAE3D9`、墨色 `#1E1A17`、淡墨 `#5B524B`、雾灰 `#A79E95`、胭脂红 `#9E3B4D`、浅胭脂 `#E9D3D5`。
- 字体：标题 Noto Serif SC，正文 Noto Sans SC，年份数字 Cormorant Garamond。
- 动效必须尊重 `prefers-reduced-motion`（React 用 `<MotionConfig reducedMotion="user">`，CSS 用媒体查询）。
- 每条事实数据必须有至少一个来源；未核实的标 `verified: false`，界面显示"待核实"。
- 流水区分 `official` / `estimate`，图上官方为实线实心点，估算为虚线空心点。
- 界面文案一律中文。
- git 提交需要用户先配置 `user.name` / `user.email`；未配置时跳过提交步骤并告知用户，不得擅自代填身份。

## File Structure

```
package.json, astro.config.mjs, tsconfig.json, vitest.config.ts, .gitignore
src/
  content.config.ts            # 注册四个内容集合
  content/companies/*.md        # 公司（frontmatter + 笔记正文）
  content/products/*.json       # 产品
  content/people/*.json         # 人物
  content/events/*.json         # 事件
  lib/schema.ts                # Zod schema（唯一的数据结构定义）
  lib/types.ts                 # 由 schema 推导的类型 + 视图类型
  lib/dates.ts                 # 不完整日期的解析、比较、格式化
  lib/money.ts                 # 人民币金额格式化
  lib/labels.ts                # 枚举值 → 中文标签
  lib/timelineLayout.ts        # 时间轴标签防重叠的分层算法
  lib/data.ts                  # 纯函数：完整性检查、公司视图、时间轴、流水序列
  lib/load.ts                  # 从 Astro 内容集合组装 Dataset
  layouts/Base.astro           # html 外壳、字体、页眉页脚
  styles/global.css            # Tailwind 主题 token、纸纹、正文排版、动效
  components/SectionTitle.astro
  components/CompanyHero.astro
  components/PeopleSection.astro
  components/SourceList.tsx
  components/CompanyTimeline.tsx
  components/Sparkline.tsx
  components/RevenueChart.tsx
  components/ProductDrawer.tsx
  components/ProductShelf.tsx
  pages/index.astro            # 临时首页：公司目录（第二期替换为时间长河）
  pages/company/[id].astro     # 公司详情页
public/images/                 # 本地图片
tests/
  fixtures.ts
  schema.test.ts, dates.test.ts, money.test.ts, data.test.ts, timelineLayout.test.ts
```

---

### Task 1: 项目脚手架与设计 token

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`
- Create: `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro`（占位）

**Interfaces:**
- Produces: `Base.astro`（props `{ title: string; description?: string }`，默认插槽）；Tailwind 主题色 `paper / paper-deep / ink / ink-soft / mist / rouge / rouge-soft`，字体族 `font-serif / font-sans / font-display`；CSS 类 `.unverified`、`.prose-chronicle`、`.timeline-scroller`、`.hero-rise`、`.hero-art`。

- [ ] **Step 1: 写 `package.json`**

```json
{
  "name": "otome-chronicle",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run:
```powershell
npm install astro@^7.3.7 @astrojs/react@^7.0.1 react@^19.3.0 react-dom@^19.3.0 tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3 motion@^14.0.0 d3-scale d3-shape @fontsource/noto-serif-sc @fontsource/noto-sans-sc @fontsource/cormorant-garamond
npm install -D vitest@^5.0.3 @types/react @types/react-dom @types/d3-scale @types/d3-shape
```
Expected: 安装成功，无 peer 依赖报错。

- [ ] **Step 3: 写配置文件**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
```

`.gitignore`:
```
node_modules/
dist/
.astro/
```

- [ ] **Step 4: 写 `src/styles/global.css`**

```css
@import "tailwindcss";

@theme {
  --color-paper: #f4efe8;
  --color-paper-deep: #eae3d9;
  --color-ink: #1e1a17;
  --color-ink-soft: #5b524b;
  --color-mist: #a79e95;
  --color-rouge: #9e3b4d;
  --color-rouge-soft: #e9d3d5;

  --font-serif: "Noto Serif SC", "Songti SC", serif;
  --font-sans: "Noto Sans SC", system-ui, sans-serif;
  --font-display: "Cormorant Garamond", "Noto Serif SC", serif;
}

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    background-color: var(--color-paper);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  }
  ::selection {
    background: var(--color-rouge-soft);
    color: var(--color-ink);
  }
}

@layer components {
  .unverified {
    display: inline-flex;
    border: 1px solid color-mix(in srgb, var(--color-rouge) 45%, transparent);
    color: var(--color-rouge);
    padding: 0.1rem 0.5rem;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
  }

  .prose-chronicle {
    font-family: var(--font-serif);
    font-size: 1.0625rem;
    line-height: 2;
    color: var(--color-ink-soft);
  }
  .prose-chronicle > * + * {
    margin-top: 1.25em;
  }
  .prose-chronicle h2 {
    margin-top: 2.5em;
    font-size: 1.5rem;
    color: var(--color-ink);
  }
  .prose-chronicle h3 {
    margin-top: 2em;
    font-size: 1.2rem;
    color: var(--color-ink);
  }
  .prose-chronicle a {
    color: var(--color-rouge);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .prose-chronicle ul > li {
    position: relative;
    padding-left: 1.5em;
  }
  .prose-chronicle ul > li::before {
    content: "—";
    position: absolute;
    left: 0;
    color: var(--color-mist);
  }
  .prose-chronicle blockquote {
    border-left: 2px solid var(--color-rouge);
    padding-left: 1.25em;
    color: var(--color-ink);
  }

  .timeline-scroller {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--color-ink) 20%, transparent) transparent;
    mask-image: linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent);
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes settle {
  from {
    transform: scale(1.06);
  }
  to {
    transform: scale(1);
  }
}
.hero-rise {
  animation: rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.hero-art {
  animation: settle 2.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  .hero-rise,
  .hero-art {
    animation: none;
  }
}
```

- [ ] **Step 5: 写 `src/layouts/Base.astro`**

```astro
---
import '@fontsource/noto-serif-sc/500.css';
import '@fontsource/noto-serif-sc/700.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = '中国女性向游戏公司编年史' } = Astro.props;
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title} · 女性向游戏编年史</title>
  </head>
  <body class="min-h-screen bg-paper font-sans text-ink antialiased">
    <header class="absolute inset-x-0 top-0 z-40">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <a href="/" class="font-serif text-base tracking-[0.2em] text-ink">女性向游戏编年史</a>
        <nav class="flex gap-8 text-sm text-ink-soft">
          <a href="/" class="transition hover:text-rouge">时间长河</a>
        </nav>
      </div>
    </header>
    <main>
      <slot />
    </main>
    <footer class="border-t border-ink/10">
      <div class="mx-auto max-w-6xl px-6 py-10 text-xs leading-relaxed text-mist sm:px-10">
        <p>资料整理自公开来源，仅供个人学习。流水数据多为第三方估算，以页面标注为准。</p>
      </div>
    </footer>
  </body>
</html>
```

- [ ] **Step 6: 写占位首页 `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
---

<Base title="首页">
  <section class="mx-auto max-w-6xl px-6 pt-32 pb-24 sm:px-10">
    <h1 class="hero-rise font-serif text-5xl font-bold">中国女性向游戏编年史</h1>
  </section>
</Base>
```

- [ ] **Step 7: 验证构建与开发服务器**

Run: `npm run build`
Expected: 构建成功，生成 `dist/index.html`。

Run: `npm run dev`，浏览器打开 `http://localhost:4321/`
Expected: 暖白纸色背景、宋体大标题、标题有上浮渐入动画。确认后停止服务器。

- [ ] **Step 8: Commit**

```powershell
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts .gitignore src
git commit -m "chore: scaffold Astro project with design tokens"
```

---

### Task 2: 数据 schema 与内容集合

**Files:**
- Create: `src/lib/schema.ts`, `src/lib/types.ts`, `src/content.config.ts`
- Test: `tests/schema.test.ts`

**Interfaces:**
- Produces（`src/lib/schema.ts`）：`partialDate`、`sourceSchema`、`companySchema`、`revenueEntrySchema`、`productSchema`、`roleSchema`、`personSchema`、`eventSchema`。
- Produces（`src/lib/types.ts`）：`Source`、`Company`、`Product`、`RevenueEntry`、`Role`、`Person`、`ChronicleEvent`、`EventType`、`Dataset`、`RevenuePoint`、`ProductCard`、`TimelineKind`、`TimelineItem`、`CompanyPerson`、`CompanyView`。

- [ ] **Step 1: 写失败测试 `tests/schema.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { companySchema, partialDate, productSchema } from '../src/lib/schema';

const source = { title: '官网', url: 'https://example.com' };

describe('partialDate', () => {
  it.each(['2013', '2013-05', '2013-05-07'])('接受 %s', (value) => {
    expect(partialDate.safeParse(value).success).toBe(true);
  });
  it.each(['13', '2013-5', '2013-13', '2013/05', '2013-05-32'])('拒绝 %s', (value) => {
    expect(partialDate.safeParse(value).success).toBe(false);
  });
});

describe('companySchema', () => {
  const valid = {
    name: '测试公司',
    founded: '2013',
    headquarters: '苏州',
    kind: 'independent',
    status: 'active',
    tagline: '一句话',
    sources: [source],
  };

  it('填充默认值', () => {
    const company = companySchema.parse(valid);
    expect(company.aliases).toEqual([]);
    expect(company.verified).toBe(false);
  });

  it('至少需要一个来源', () => {
    expect(companySchema.safeParse({ ...valid, sources: [] }).success).toBe(false);
  });
});

describe('productSchema', () => {
  const valid = {
    name: '测试作品',
    genre: 'otome',
    developer: 'alpha',
    publisher: '腾讯',
    released: '2017-12-20',
    platforms: ['iOS'],
    status: 'live',
    significance: '一句话',
    sources: [source],
  };
  const revenue = (period: string) => ({ period, amountCNY: 1e8, kind: 'estimate', source });

  it('接受年度与季度流水', () => {
    expect(productSchema.safeParse({ ...valid, revenue: [revenue('2024')] }).success).toBe(true);
    expect(productSchema.safeParse({ ...valid, revenue: [revenue('2024-Q3')] }).success).toBe(true);
  });

  it.each(['2024-Q5', '2024Q1', '24'])('拒绝流水期间 %s', (period) => {
    expect(productSchema.safeParse({ ...valid, revenue: [revenue(period)] }).success).toBe(false);
  });

  it('流水默认为空数组', () => {
    expect(productSchema.parse(valid).revenue).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- tests/schema.test.ts`
Expected: FAIL，提示无法解析 `../src/lib/schema`。

- [ ] **Step 3: 写 `src/lib/schema.ts`**

```ts
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
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- tests/schema.test.ts`
Expected: PASS。若 Vitest 无法解析 `astro/zod`，执行 `npm install zod@^4`，并把本文件的导入改为 `import { z } from 'zod';`，然后重跑。

- [ ] **Step 5: 写 `src/lib/types.ts`**

```ts
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
```

- [ ] **Step 6: 写 `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { companySchema, eventSchema, personSchema, productSchema } from './lib/schema';

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

export const collections = { companies, products, people, events };
```

- [ ] **Step 7: 验证构建**

Run: `npm run build`
Expected: 构建成功（四个集合为空时可能出现"集合为空"的警告，属正常）。

- [ ] **Step 8: Commit**

```powershell
git add src/lib/schema.ts src/lib/types.ts src/content.config.ts tests/schema.test.ts
git commit -m "feat: add content schemas and collections"
```

---

### Task 3: 日期、金额与标签工具

**Files:**
- Create: `src/lib/dates.ts`, `src/lib/money.ts`, `src/lib/labels.ts`
- Test: `tests/dates.test.ts`, `tests/money.test.ts`

**Interfaces:**
- Produces: `yearOf(date: string): number`、`compareDates(a: string, b: string): number`、`formatDate(date: string): string`、`dateToNumber(date: string): number`、`periodToNumber(period: string): number`、`formatCNY(amount: number): string`；标签表 `companyKindLabel`、`companyStatusLabel`、`genreLabel`、`productStatusLabel`、`timelineKindLabel`。

- [ ] **Step 1: 写失败测试**

`tests/dates.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { compareDates, dateToNumber, formatDate, periodToNumber, yearOf } from '../src/lib/dates';

describe('dates', () => {
  it('yearOf 取年份', () => {
    expect(yearOf('2017-12-20')).toBe(2017);
    expect(yearOf('2013')).toBe(2013);
  });

  it('compareDates 按时间先后排序，同年时只写年份的排在前面', () => {
    const sorted = ['2019', '2017-12', '2017', '2017-01-05'].sort(compareDates);
    expect(sorted).toEqual(['2017', '2017-01-05', '2017-12', '2019']);
  });

  it('formatDate 按精度输出中文日期', () => {
    expect(formatDate('2013')).toBe('2013年');
    expect(formatDate('2013-05')).toBe('2013年5月');
    expect(formatDate('2013-05-07')).toBe('2013年5月7日');
  });

  it('dateToNumber 把日期换算成小数年份', () => {
    expect(dateToNumber('2017')).toBe(2017);
    expect(dateToNumber('2017-07')).toBe(2017.5);
    expect(dateToNumber('2017-01-01')).toBe(2017);
  });

  it('periodToNumber 支持年度和季度', () => {
    expect(periodToNumber('2024')).toBe(2024);
    expect(periodToNumber('2024-Q1')).toBe(2024);
    expect(periodToNumber('2024-Q3')).toBe(2024.5);
  });
});
```

`tests/money.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatCNY } from '../src/lib/money';

describe('formatCNY', () => {
  it('亿元', () => {
    expect(formatCNY(1.25e9)).toBe('12.5亿元');
    expect(formatCNY(3e9)).toBe('30亿元');
  });
  it('万元', () => {
    expect(formatCNY(4.5e7)).toBe('4500万元');
    expect(formatCNY(12_300)).toBe('1.2万元');
  });
  it('元', () => {
    expect(formatCNY(0)).toBe('0元');
    expect(formatCNY(800)).toBe('800元');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- tests/dates.test.ts tests/money.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现**

`src/lib/dates.ts`:
```ts
export function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

export function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  if (day) return `${year}年${Number(month)}月${Number(day)}日`;
  if (month) return `${year}年${Number(month)}月`;
  return `${year}年`;
}

export function dateToNumber(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return year + (month ? (month - 1) / 12 : 0) + (day ? (day - 1) / 365 : 0);
}

export function periodToNumber(period: string): number {
  const [year, quarter] = period.split('-Q');
  return Number(year) + (quarter ? (Number(quarter) - 1) / 4 : 0);
}
```

`src/lib/money.ts`:
```ts
function trim(value: number): string {
  return String(Number(value.toFixed(1)));
}

export function formatCNY(amount: number): string {
  if (amount >= 1e8) return `${trim(amount / 1e8)}亿元`;
  if (amount >= 1e4) return `${trim(amount / 1e4)}万元`;
  return `${amount}元`;
}
```

`src/lib/labels.ts`:
```ts
import type { Company, Product, TimelineKind } from './types';

export const companyKindLabel: Record<Company['kind'], string> = {
  independent: '独立公司',
  studio: '大厂工作室',
  platform: '平台',
};

export const companyStatusLabel: Record<Company['status'], string> = {
  active: '运营中',
  acquired: '已被收购',
  closed: '已关闭',
};

export const genreLabel: Record<Product['genre'], string> = {
  otome: '乙女',
  dressup: '换装',
  interactive: '互动叙事',
  other: '其他',
};

export const productStatusLabel: Record<Product['status'], string> = {
  live: '运营中',
  shutdown: '已停服',
};

export const timelineKindLabel: Record<TimelineKind, string> = {
  founded: '成立',
  launch: '上线',
  shutdown: '停服',
  funding: '融资',
  ipo: '上市',
  acquisition: '收购',
  rename: '更名',
  layoff: '裁员',
  controversy: '争议',
  milestone: '里程碑',
};
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```powershell
git add src/lib/dates.ts src/lib/money.ts src/lib/labels.ts tests/dates.test.ts tests/money.test.ts
git commit -m "feat: add date, money and label helpers"
```

---

### Task 4: 数据聚合层与时间轴分层算法

**Files:**
- Create: `src/lib/data.ts`, `src/lib/timelineLayout.ts`, `tests/fixtures.ts`
- Test: `tests/data.test.ts`, `tests/timelineLayout.test.ts`

**Interfaces:**
- Consumes: Task 2 的类型；Task 3 的 `compareDates`、`periodToNumber`。
- Produces:
  - `displayCompanyName(ds: Dataset, idOrName: string): string`
  - `checkIntegrity(ds: Dataset): string[]`
  - `revenueSeries(product: Product): RevenuePoint[]`
  - `toProductCards(ds: Dataset, products: Product[]): ProductCard[]`
  - `buildTimeline(company: Company, products: Product[], events: ChronicleEvent[]): TimelineItem[]`
  - `getCompanyView(ds: Dataset, id: string): CompanyView`
  - `assignLevels(xs: number[], minGap: number, levels?: number): number[]`

- [ ] **Step 1: 写测试数据 `tests/fixtures.ts`**

```ts
import type { Dataset } from '../src/lib/types';

const sources = [{ title: '测试来源', url: 'https://example.com' }];

export function makeDataset(): Dataset {
  return {
    companies: [
      { id: 'alpha', name: 'Alpha 游戏', aliases: [], founded: '2013-05', headquarters: '苏州', kind: 'independent', status: 'active', tagline: '测试公司', sources, verified: true },
      { id: 'beta', name: 'Beta 工作室', aliases: [], founded: '2018', headquarters: '深圳', kind: 'studio', parent: '某大厂', status: 'active', tagline: '测试工作室', sources, verified: false },
    ],
    products: [
      {
        id: 'a-first', name: '初作', aliases: [], genre: 'dressup', developer: 'alpha', publisher: 'alpha',
        released: '2015-06-01', platforms: ['iOS', 'Android'], status: 'live', significance: '第一款作品',
        revenue: [
          { period: '2016', amountCNY: 5e8, kind: 'estimate', source: sources[0] },
          { period: '2015', amountCNY: 1e8, kind: 'official', source: sources[0] },
        ],
        sources, verified: true,
      },
      {
        id: 'a-second', name: '次作', aliases: [], genre: 'otome', developer: 'alpha', publisher: '某发行商',
        released: '2017-12', shutdown: '2023-03', platforms: ['iOS'], status: 'shutdown', significance: '第二款作品',
        revenue: [], sources, verified: true,
      },
      {
        id: 'b-first', name: '代理作', aliases: [], genre: 'otome', developer: 'beta', publisher: 'alpha',
        released: '2021-06-24', platforms: ['Android'], status: 'live', significance: '由 Alpha 发行',
        revenue: [], sources, verified: false,
      },
    ],
    people: [
      {
        id: 'founder', name: '张三', bio: '创始人', sources, verified: true,
        roles: [
          { company: 'beta', title: '顾问', from: '2019', to: '2020' },
          { company: 'alpha', title: '创始人', from: '2013' },
        ],
      },
      { id: 'producer', name: '李四', bio: '制作人', sources, verified: false, roles: [{ company: 'beta', title: '制作人', from: '2018' }] },
    ],
    events: [
      { id: 'joint', date: '2019', type: 'milestone', companies: ['alpha', 'beta'], products: ['b-first'], summary: '达成合作', sources, verified: false },
      { id: 'alpha-a-round', date: '2016-03', type: 'funding', companies: ['alpha'], products: [], summary: '完成 A 轮融资', sources, verified: true },
    ],
  };
}
```

- [ ] **Step 2: 写失败测试**

`tests/data.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { checkIntegrity, displayCompanyName, getCompanyView, revenueSeries, toProductCards } from '../src/lib/data';
import { makeDataset } from './fixtures';

describe('checkIntegrity', () => {
  it('引用完整时无错误', () => {
    expect(checkIntegrity(makeDataset())).toEqual([]);
  });

  it('发现不存在的研发方、任职公司和事件引用', () => {
    const ds = makeDataset();
    ds.products[0].developer = 'ghost-dev';
    ds.people[1].roles[0].company = 'ghost-co';
    ds.events[0].products = ['ghost-product'];
    const errors = checkIntegrity(ds).join('\n');
    expect(errors).toContain('ghost-dev');
    expect(errors).toContain('ghost-co');
    expect(errors).toContain('ghost-product');
  });

  it('发行方允许填未收录的名称', () => {
    const ds = makeDataset();
    ds.products[0].publisher = '腾讯';
    expect(checkIntegrity(ds)).toEqual([]);
  });

  it('发现年度与季度混用的流水', () => {
    const ds = makeDataset();
    ds.products[0].revenue.push({ period: '2017-Q1', amountCNY: 1, kind: 'estimate', source: ds.products[0].sources[0] });
    expect(checkIntegrity(ds).join('\n')).toContain('a-first');
  });
});

describe('displayCompanyName', () => {
  it('id 转成公司名，未收录的名称原样返回', () => {
    const ds = makeDataset();
    expect(displayCompanyName(ds, 'alpha')).toBe('Alpha 游戏');
    expect(displayCompanyName(ds, '某发行商')).toBe('某发行商');
  });
});

describe('revenueSeries', () => {
  it('按期间排序并展开来源', () => {
    const series = revenueSeries(makeDataset().products[0]);
    expect(series.map((p) => p.period)).toEqual(['2015', '2016']);
    expect(series[0]).toMatchObject({ x: 2015, amountCNY: 1e8, kind: 'official', sourceTitle: '测试来源' });
  });
});

describe('toProductCards', () => {
  it('补充研发、发行名称和流水序列', () => {
    const ds = makeDataset();
    const [card] = toProductCards(ds, [ds.products[2]]);
    expect(card.developerName).toBe('Beta 工作室');
    expect(card.publisherName).toBe('Alpha 游戏');
    expect(card.series).toEqual([]);
  });
});

describe('getCompanyView', () => {
  it('包含研发或发行的作品，按首发时间排序', () => {
    const view = getCompanyView(makeDataset(), 'alpha');
    expect(view.products.map((p) => p.id)).toEqual(['a-first', 'a-second', 'b-first']);
  });

  it('人物只保留在本公司任职的人，并区分本公司与其他公司的任职', () => {
    const view = getCompanyView(makeDataset(), 'alpha');
    expect(view.people.map((p) => p.person.id)).toEqual(['founder']);
    expect(view.people[0].roles.map((r) => r.title)).toEqual(['创始人']);
    expect(view.people[0].elsewhere.map((r) => r.company)).toEqual(['beta']);
  });

  it('事件按日期排序', () => {
    const view = getCompanyView(makeDataset(), 'alpha');
    expect(view.events.map((e) => e.id)).toEqual(['alpha-a-round', 'joint']);
  });

  it('时间轴合并成立、上线、停服与事件，并按日期排序', () => {
    const view = getCompanyView(makeDataset(), 'alpha');
    expect(view.timeline.map((t) => [t.date, t.kind])).toEqual([
      ['2013-05', 'founded'],
      ['2015-06-01', 'launch'],
      ['2016-03', 'funding'],
      ['2017-12', 'launch'],
      ['2019', 'milestone'],
      ['2021-06-24', 'launch'],
      ['2023-03', 'shutdown'],
    ]);
    expect(view.timeline[1].label).toBe('《初作》上线');
    expect(view.timeline[4].verified).toBe(false);
  });

  it('未收录的公司抛出错误', () => {
    expect(() => getCompanyView(makeDataset(), 'nope')).toThrow('nope');
  });
});
```

`tests/timelineLayout.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { assignLevels } from '../src/lib/timelineLayout';

describe('assignLevels', () => {
  it('间距足够时在轴线上下交替', () => {
    expect(assignLevels([0, 200, 400], 150)).toEqual([0, 1, 0]);
  });

  it('间距不足时依次使用更外侧的层', () => {
    expect(assignLevels([0, 50, 100, 120], 150)).toEqual([0, 1, 2, 3]);
  });

  it('所有层都被占用时回到最早空出的层', () => {
    expect(assignLevels([0, 10, 20, 30, 40], 150)).toEqual([0, 1, 2, 3, 0]);
  });
});
```

- [ ] **Step 3: 运行测试，确认失败**

Run: `npm test -- tests/data.test.ts tests/timelineLayout.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 4: 实现 `src/lib/timelineLayout.ts`**

```ts
/**
 * 层 0、2 在轴线上方，层 1、3 在下方。偶数项优先上方，奇数项优先下方，
 * 与同层上一个标签的水平距离不足 minGap 时换到更外侧的层。
 */
export function assignLevels(xs: number[], minGap: number, levels = 4): number[] {
  const lastX = Array<number>(levels).fill(-Infinity);
  const upFirst = Array.from({ length: levels }, (_, i) => i);
  const downFirst = upFirst.map((i) => (i % 2 === 0 ? i + 1 : i - 1)).filter((i) => i < levels);

  return xs.map((x, index) => {
    const preference = index % 2 === 0 ? upFirst : downFirst;
    let level = preference.find((l) => x - lastX[l] >= minGap);
    if (level === undefined) level = lastX.indexOf(Math.min(...lastX));
    lastX[level] = x;
    return level;
  });
}
```

- [ ] **Step 5: 实现 `src/lib/data.ts`**

```ts
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
  }

  for (const person of ds.people) {
    for (const role of person.roles) {
      if (!companyIds.has(role.company)) {
        errors.push(`人物 ${person.id}：任职公司 "${role.company}" 不是已收录公司的 id`);
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
```

- [ ] **Step 6: 运行测试，确认通过**

Run: `npm test`
Expected: 全部 PASS。

- [ ] **Step 7: Commit**

```powershell
git add src/lib/data.ts src/lib/timelineLayout.ts tests/fixtures.ts tests/data.test.ts tests/timelineLayout.test.ts
git commit -m "feat: add data aggregation and timeline layout"
```

---

### Task 5: 数据加载与叠纸游戏样板数据

**Files:**
- Create: `src/lib/load.ts`
- Create: `src/content/companies/papergames.md`
- Create: `src/content/products/*.json`, `src/content/people/*.json`, `src/content/events/*.json`
- Create: `public/images/papergames/*`

**Interfaces:**
- Consumes: Task 4 的 `checkIntegrity`。
- Produces: `loadDataset(): Promise<Dataset>`（引用错误时抛出带全部错误信息的异常，使构建失败）。

- [ ] **Step 1: 写 `src/lib/load.ts`**

```ts
import { getCollection } from 'astro:content';
import { checkIntegrity } from './data';
import type { Dataset } from './types';

export async function loadDataset(): Promise<Dataset> {
  const [companies, products, people, events] = await Promise.all([
    getCollection('companies'),
    getCollection('products'),
    getCollection('people'),
    getCollection('events'),
  ]);

  const ds: Dataset = {
    companies: companies.map((e) => ({ id: e.id, ...e.data })),
    products: products.map((e) => ({ id: e.id, ...e.data })),
    people: people.map((e) => ({ id: e.id, ...e.data })),
    events: events.map((e) => ({ id: e.id, ...e.data })),
  };

  const errors = checkIntegrity(ds);
  if (errors.length > 0) {
    throw new Error(`数据引用错误：\n${errors.join('\n')}`);
  }
  return ds;
}
```

- [ ] **Step 2: 联网检索叠纸游戏资料**

用 Exa / Bright Data 搜索工具检索，至少覆盖以下问题，每条事实记录来源链接（优先：官网、上市公司公告、主流媒体报道、游戏葡萄 / 竞核 / GameLook 等行业媒体、Sensor Tower / 点点数据报告；百科只作线索，不作唯一来源）：

1. 公司：正式名称与曾用名、成立时间（尽量精确到月）、总部、现状、官网、一句话定位。
2. 产品：叠纸研发或发行的全部女性向产品（至少包括《奇迹暖暖》《恋与制作人》《闪耀暖暖》《无限暖暖》《恋与深空》，并核查更早的暖暖系列作品）。每款的首发日期（国服）、平台、研发方、发行方、是否停服、为什么重要。
3. 流水：至少为《恋与制作人》《恋与深空》各找 2 个以上年度的流水数据；能找到其他产品的也补上。统一用年度粒度，标注 `official` 或 `estimate` 和来源。
4. 人物：创始人及 1–3 名有公开报道的核心制作人或高管，含任职年份。
5. 事件：至少 5 条（融资、重大里程碑、争议、海外发行等），每条一句话。

两个来源互相矛盾时，在公司笔记里写明分歧，并把相关条目标为 `verified: false`。

- [ ] **Step 3: 写公司文件 `src/content/companies/papergames.md`**

格式如下，所有字段值用 Step 2 检索到的事实填写：

```markdown
---
name: 叠纸游戏
aliases: [<检索到的曾用名或英文名，如 Papergames>]
founded: "<YYYY-MM>"
headquarters: <城市>
kind: independent
status: active
tagline: <一句话定位>
website: <官网 URL>
cover: /images/papergames/cover.jpg
sources:
  - title: <来源标题>
    url: <来源 URL>
verified: true
---

## 概览

<三到五段：公司起源、产品路线、在女性向市场中的地位、近年动向。>

## 关键转折

- <按时间列出 3–6 个转折点>

## 资料分歧

<两个来源说法不一致的地方；没有则删去本节。>
```

- [ ] **Step 4: 写产品、人物、事件文件**

文件名即 id，使用小写英文短横线命名。产品示例 `src/content/products/love-and-producer.json` 的格式：

```json
{
  "name": "恋与制作人",
  "aliases": ["Mr Love: Queen's Choice"],
  "genre": "otome",
  "developer": "papergames",
  "publisher": "papergames",
  "released": "<YYYY-MM-DD>",
  "platforms": ["iOS", "Android"],
  "status": "live",
  "significance": "<一句话>",
  "keyArt": "/images/papergames/love-and-producer.jpg",
  "revenue": [
    {
      "period": "<YYYY>",
      "amountCNY": 0,
      "kind": "estimate",
      "source": { "title": "<来源>", "url": "<URL>" }
    }
  ],
  "sources": [{ "title": "<来源>", "url": "<URL>" }],
  "verified": true
}
```

`amountCNY` 写检索到的实际数额（单位：元，如 10 亿元写 `1000000000`）；没有可靠流水的产品写 `"revenue": []`，不要编造。

人物示例 `src/content/people/<id>.json`：

```json
{
  "name": "<姓名>",
  "bio": "<一到两句介绍>",
  "roles": [{ "company": "papergames", "title": "<职位>", "from": "<YYYY>" }],
  "sources": [{ "title": "<来源>", "url": "<URL>" }],
  "verified": true
}
```

事件示例 `src/content/events/<id>.json`：

```json
{
  "date": "<YYYY-MM>",
  "type": "milestone",
  "companies": ["papergames"],
  "products": ["<相关产品 id>"],
  "summary": "<一句话>",
  "sources": [{ "title": "<来源>", "url": "<URL>" }],
  "verified": true
}
```

验收：1 个公司文件、≥5 个产品、≥2 个人物、≥5 个事件；每个文件都有来源；不含任何尖括号占位符。

- [ ] **Step 5: 下载图片**

从官网、官方社媒或官方新闻稿获取：公司首屏图（`public/images/papergames/cover.jpg`，横版、宽 ≥1600px）和每款产品的主视觉（`public/images/papergames/<产品 id>.jpg`）。单张尽量控制在 800KB 以内。找不到的图片就删掉对应字段，页面会显示年份占位。

Run（PowerShell 下载示例）：
```powershell
New-Item -ItemType Directory -Force public/images/papergames | Out-Null
Invoke-WebRequest -Uri "<图片 URL>" -OutFile "public/images/papergames/love-and-producer.jpg"
```

- [ ] **Step 6: 验证数据**

Run: `npm run build`
Expected: 构建成功。若报 schema 错误或"数据引用错误"，按报错信息修正对应文件后重跑。

Run: `rg "<" src/content`
Expected: 无输出（没有遗留的尖括号占位符）。

- [ ] **Step 7: Commit**

```powershell
git add src/lib/load.ts src/content public/images
git commit -m "feat: add data loader and Papergames sample data"
```

---

### Task 6: 公司详情页静态部分

**Files:**
- Create: `src/components/SectionTitle.astro`, `src/components/CompanyHero.astro`, `src/components/PeopleSection.astro`, `src/components/SourceList.tsx`
- Create: `src/pages/company/[id].astro`
- Modify: `src/pages/index.astro`（替换为公司目录）

**Interfaces:**
- Consumes: `loadDataset()`、`getCompanyView()`、`displayCompanyName()`、`toProductCards()`、标签表、`formatDate()`、`yearOf()`、`compareDates()`。
- Produces: 路由 `/company/<id>`；`SourceList`（props `{ sources: Source[] }`）供 Task 8 的抽屉复用。页面中预留 `#timeline` 与 `#works` 两个区块，由 Task 7、Task 8 填入组件。

- [ ] **Step 1: 写 `src/components/SectionTitle.astro`**

```astro
---
interface Props {
  index: string;
  title: string;
  note?: string;
}

const { index, title, note } = Astro.props;
---

<div class="flex items-end justify-between gap-6 border-b border-ink/15 pb-5">
  <div class="flex items-baseline gap-5">
    <span class="font-display text-2xl text-rouge">{index}</span>
    <h2 class="font-serif text-3xl tracking-wide text-ink">{title}</h2>
  </div>
  {note && <p class="text-sm text-mist">{note}</p>}
</div>
```

- [ ] **Step 2: 写 `src/components/SourceList.tsx`**

```tsx
import type { Source } from '../lib/types';

export default function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="border-t border-ink/10 pt-6">
      <h3 className="text-xs tracking-[0.3em] text-mist">来源</h3>
      <ol className="mt-3 space-y-1.5 text-sm">
        {sources.map((source, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-display text-mist">{i + 1}</span>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-ink-soft underline decoration-ink/20 underline-offset-4 transition hover:text-rouge"
            >
              {source.title}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: 写 `src/components/CompanyHero.astro`**

```astro
---
import type { Company } from '../lib/types';
import { formatDate, yearOf } from '../lib/dates';
import { companyKindLabel, companyStatusLabel } from '../lib/labels';

interface Props {
  company: Company;
  cover?: string;
  productCount: number;
  parentName?: string;
}

const { company, cover, productCount, parentName } = Astro.props;
---

<section class="relative isolate flex min-h-[86vh] items-end overflow-hidden">
  {cover && <img src={cover} alt="" class="hero-art absolute inset-0 -z-20 h-full w-full object-cover saturate-[0.85]" />}
  <div class="absolute inset-0 -z-10 bg-gradient-to-b from-paper/10 via-paper/65 to-paper"></div>
  <span
    aria-hidden="true"
    class="pointer-events-none absolute -right-6 top-16 -z-10 font-display text-[22vw] leading-none text-ink/[0.06]"
  >{yearOf(company.founded)}</span>

  <div class="mx-auto w-full max-w-6xl px-6 pb-20 sm:px-10">
    <p class="hero-rise text-xs tracking-[0.4em] text-ink-soft">
      {companyKindLabel[company.kind]}{' · '}{company.headquarters}{parentName && ` · 隶属${parentName}`}
    </p>
    <h1 class="hero-rise mt-5 font-serif text-5xl font-bold tracking-wide sm:text-7xl" style="animation-delay: 80ms">
      {company.name}
    </h1>
    {company.aliases.length > 0 && <p class="mt-3 text-sm text-mist">{company.aliases.join(' / ')}</p>}
    <p class="hero-rise mt-6 max-w-xl font-serif text-xl leading-relaxed text-ink-soft" style="animation-delay: 160ms">
      {company.tagline}
    </p>

    <dl class="hero-rise mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-ink/15 pt-6" style="animation-delay: 240ms">
      <div>
        <dt class="text-xs tracking-widest text-mist">成立</dt>
        <dd class="mt-2 font-display text-2xl text-ink">{formatDate(company.founded)}</dd>
      </div>
      <div>
        <dt class="text-xs tracking-widest text-mist">现状</dt>
        <dd class="mt-2 font-serif text-xl text-ink">{companyStatusLabel[company.status]}</dd>
      </div>
      <div>
        <dt class="text-xs tracking-widest text-mist">收录作品</dt>
        <dd class="mt-2 font-display text-2xl text-ink">{productCount}</dd>
      </div>
    </dl>
    {!company.verified && <span class="unverified mt-6">待核实</span>}
  </div>
</section>
```

- [ ] **Step 4: 写 `src/components/PeopleSection.astro`**

```astro
---
import type { Company, CompanyPerson } from '../lib/types';
import SectionTitle from './SectionTitle.astro';

interface Props {
  index: string;
  people: CompanyPerson[];
  companies: Company[];
}

const { index, people, companies } = Astro.props;
const nameOf = (id: string) => companies.find((c) => c.id === id)?.name ?? id;
const span = (from: string, to?: string) => `${from.slice(0, 4)} — ${to ? to.slice(0, 4) : '至今'}`;
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
        {!person.verified && <span class="unverified mt-3">待核实</span>}
      </li>
    ))}
  </ul>
</section>
```

- [ ] **Step 5: 写 `src/pages/company/[id].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../../layouts/Base.astro';
import CompanyHero from '../../components/CompanyHero.astro';
import PeopleSection from '../../components/PeopleSection.astro';
import SectionTitle from '../../components/SectionTitle.astro';
import SourceList from '../../components/SourceList';
import { loadDataset } from '../../lib/load';
import { displayCompanyName, getCompanyView, toProductCards } from '../../lib/data';

export async function getStaticPaths() {
  const entries = await getCollection('companies');
  return entries.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const ds = await loadDataset();
const view = getCompanyView(ds, entry.id);
const { company } = view;
const cards = toProductCards(ds, view.products);
const cover = company.cover ?? view.products.find((p) => p.keyArt)?.keyArt;
const parentName = company.parent ? displayCompanyName(ds, company.parent) : undefined;
const endYear = new Date().getFullYear();
const peopleIndex = '03';
const notesIndex = view.people.length > 0 ? '04' : '03';
---

<Base title={company.name} description={company.tagline}>
  <CompanyHero company={company} cover={cover} productCount={view.products.length} parentName={parentName} />

  <section id="timeline" class="py-24">
    <div class="mx-auto max-w-6xl px-6 sm:px-10">
      <SectionTitle index="01" title="时间轴" note="按住拖动浏览" />
    </div>
    <div class="mt-10"></div>
  </section>

  <section id="works" class="mx-auto max-w-6xl px-6 py-24 sm:px-10">
    <SectionTitle index="02" title="作品" note={`${cards.length} 款`} />
    <div class="mt-12"></div>
  </section>

  {view.people.length > 0 && <PeopleSection index={peopleIndex} people={view.people} companies={ds.companies} />}

  <section class="mx-auto max-w-3xl px-6 py-24 sm:px-10">
    <SectionTitle index={notesIndex} title="笔记" />
    <article class="prose-chronicle mt-10">
      <Content />
    </article>
    <div class="mt-16">
      <SourceList sources={company.sources} />
    </div>
  </section>
</Base>
```

- [ ] **Step 6: 把 `src/pages/index.astro` 替换为公司目录**

```astro
---
import Base from '../layouts/Base.astro';
import { loadDataset } from '../lib/load';
import { compareDates, yearOf } from '../lib/dates';

const ds = await loadDataset();
const companies = [...ds.companies].sort((a, b) => compareDates(a.founded, b.founded));
const firstYear = companies.length > 0 ? yearOf(companies[0].founded) : new Date().getFullYear();
const endYear = new Date().getFullYear();
---

<Base title="首页">
  <section class="mx-auto max-w-6xl px-6 pt-36 pb-20 sm:px-10">
    <p class="hero-rise font-display text-sm tracking-[0.4em] text-mist">CHRONICLE · {firstYear} — {endYear}</p>
    <h1 class="hero-rise mt-6 font-serif text-5xl leading-tight font-bold sm:text-7xl" style="animation-delay: 80ms">
      中国女性向游戏<br />编年史
    </h1>
    <p class="hero-rise mt-8 max-w-xl font-serif text-lg leading-loose text-ink-soft" style="animation-delay: 160ms">
      从换装到乙女，从互动阅读到 3D 恋爱，记录那些为女性玩家做游戏的公司，以及它们走过的年份。
    </p>
  </section>

  <section class="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
    <ul class="divide-y divide-ink/10 border-y border-ink/10">
      {companies.map((c) => (
        <li>
          <a href={`/company/${c.id}`} class="group grid grid-cols-[5rem_1fr_auto] items-baseline gap-6 py-8 sm:grid-cols-[7rem_1fr_auto]">
            <span class="font-display text-3xl text-mist transition group-hover:text-rouge">{yearOf(c.founded)}</span>
            <span>
              <span class="block font-serif text-2xl text-ink transition group-hover:text-rouge">{c.name}</span>
              <span class="mt-2 block text-sm text-ink-soft">{c.tagline}</span>
            </span>
            <span class="text-mist transition group-hover:translate-x-1 group-hover:text-rouge">→</span>
          </a>
        </li>
      ))}
    </ul>
  </section>
</Base>
```

- [ ] **Step 7: 验证**

Run: `npm run build`
Expected: 构建成功，生成 `dist/company/papergames/index.html`。

Run: `npm run dev`，打开 `http://localhost:4321/` 与 `http://localhost:4321/company/papergames`
Expected: 首页显示叠纸条目，点击进入详情页；首屏有背景图、渐变、巨大的淡色年份和上浮动画；人物卡片、笔记正文、来源列表正常显示。

- [ ] **Step 8: Commit**

```powershell
git add src/components src/pages
git commit -m "feat: add company page hero, people and notes"
```

---

### Task 7: 可拖动的公司时间轴

**Files:**
- Create: `src/components/CompanyTimeline.tsx`
- Modify: `src/pages/company/[id].astro`（`#timeline` 区块）

**Interfaces:**
- Consumes: `TimelineItem[]`（已按日期排序）、`assignLevels()`、`dateToNumber()`、`formatDate()`、`timelineKindLabel`。
- Produces: `CompanyTimeline`，props `{ items: TimelineItem[]; endYear: number }`。

- [ ] **Step 1: 写 `src/components/CompanyTimeline.tsx`**

```tsx
import { useRef, type PointerEvent } from 'react';
import { motion, MotionConfig } from 'motion/react';
import type { TimelineItem, TimelineKind } from '../lib/types';
import { dateToNumber, formatDate } from '../lib/dates';
import { timelineKindLabel } from '../lib/labels';
import { assignLevels } from '../lib/timelineLayout';

const PX_PER_YEAR = 180;
const PAD = 96;
const HEIGHT = 400;
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

  if (items.length === 0) return null;

  const startYear = Math.floor(dateToNumber(items[0].date));
  const xs = items.map((item) => PAD + (dateToNumber(item.date) - startYear) * PX_PER_YEAR);
  const levels = assignLevels(xs, LABEL_WIDTH + 16);
  const years = Array.from({ length: endYear - startYear + 2 }, (_, k) => startYear + k);
  const width = PAD * 2 + (years.length - 1) * PX_PER_YEAR;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !scroller.current) return;
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
        className="timeline-scroller cursor-grab overflow-x-auto select-none active:cursor-grabbing"
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
                key={`${item.date}-${i}`}
                className="absolute top-0"
                style={{ left: xs[i], height: HEIGHT }}
                initial={{ opacity: 0, y: up ? 10 : -10 }}
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
                  {!item.verified && <span className="unverified mt-1">待核实</span>}
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

- [ ] **Step 2: 挂到页面**

在 `src/pages/company/[id].astro` frontmatter 中加入导入：
```ts
import CompanyTimeline from '../../components/CompanyTimeline';
```
把 `#timeline` 区块里的 `<div class="mt-10"></div>` 替换为：
```astro
    <div class="mt-10">
      <CompanyTimeline client:visible items={view.timeline} endYear={endYear} />
    </div>
```

- [ ] **Step 3: 验证**

Run: `npm run dev`，打开 `http://localhost:4321/company/papergames`
Expected:
- 时间轴横向铺开，年份刻度均匀；成立为空心圆，上线为胭脂红实心点，停服为灰点，其他事件为小黑点。
- 标签在轴线上下交替，彼此不重叠。
- 鼠标按住可拖动，触控板 / 触屏可原生横向滚动；两端有渐隐。
- 滚动到视野内时标签依次渐入；系统开启"减少动态效果"后无动画。

- [ ] **Step 4: Commit**

```powershell
git add src/components/CompanyTimeline.tsx src/pages/company/[id].astro
git commit -m "feat: add draggable company timeline"
```

---

### Task 8: 作品陈列、流水图与详情抽屉

**Files:**
- Create: `src/components/Sparkline.tsx`, `src/components/RevenueChart.tsx`, `src/components/ProductDrawer.tsx`, `src/components/ProductShelf.tsx`
- Modify: `src/pages/company/[id].astro`（`#works` 区块）

**Interfaces:**
- Consumes: `ProductCard[]`、`RevenuePoint`、`formatCNY()`、`formatDate()`、`yearOf()`、`genreLabel`、`productStatusLabel`、`SourceList`。
- Produces: `ProductShelf`，props `{ products: ProductCard[] }`。

- [ ] **Step 1: 写 `src/components/Sparkline.tsx`**

```tsx
import { scaleLinear } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';
import type { RevenuePoint } from '../lib/types';

const W = 240;
const H = 36;

export default function Sparkline({ series }: { series: RevenuePoint[] }) {
  if (series.length < 2) return null;
  const x = scaleLinear().domain([series[0].x, series[series.length - 1].x]).range([2, W - 2]);
  const y = scaleLinear().domain([0, Math.max(...series.map((p) => p.amountCNY))]).range([H - 2, 2]);
  const d = line<RevenuePoint>()
    .x((p) => x(p.x))
    .y((p) => y(p.amountCNY))
    .curve(curveMonotoneX)(series);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-9 w-full" aria-hidden="true">
      <path d={d ?? ''} fill="none" stroke="currentColor" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
```

- [ ] **Step 2: 写 `src/components/RevenueChart.tsx`**

```tsx
import { useState } from 'react';
import { scaleLinear } from 'd3-scale';
import type { RevenuePoint } from '../lib/types';
import { formatCNY } from '../lib/money';

const W = 520;
const H = 220;
const M = { top: 16, right: 16, bottom: 32, left: 72 };

export default function RevenueChart({ series }: { series: RevenuePoint[] }) {
  const [active, setActive] = useState(series.length - 1);
  const first = series[0].x;
  const last = series[series.length - 1].x;
  const x = scaleLinear()
    .domain(first === last ? [first - 1, last + 1] : [first, last])
    .range([M.left, W - M.right]);
  const y = scaleLinear()
    .domain([0, Math.max(...series.map((p) => p.amountCNY))])
    .nice(4)
    .range([H - M.bottom, M.top]);
  const labelStep = Math.ceil(series.length / 8);
  const hasEstimate = series.some((p) => p.kind === 'estimate');
  const point = series[active];

  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="营收流水折线图">
        {y.ticks(4).map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-ink/10" />
            <text x={M.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-mist text-[11px]">
              {formatCNY(t)}
            </text>
          </g>
        ))}

        {series.map((p, i) =>
          i % labelStep === 0 ? (
            <text key={p.period} x={x(p.x)} y={H - 8} textAnchor="middle" className="fill-mist font-display text-[12px]">
              {p.period}
            </text>
          ) : null,
        )}

        {series.slice(1).map((p, i) => {
          const a = series[i];
          const dashed = a.kind === 'estimate' || p.kind === 'estimate';
          return (
            <line
              key={p.period}
              x1={x(a.x)}
              y1={y(a.amountCNY)}
              x2={x(p.x)}
              y2={y(p.amountCNY)}
              stroke="var(--color-rouge)"
              strokeWidth={1.75}
              strokeDasharray={dashed ? '5 4' : undefined}
            />
          );
        })}

        {series.map((p, i) => (
          <circle
            key={p.period}
            cx={x(p.x)}
            cy={y(p.amountCNY)}
            r={active === i ? 5.5 : 3.5}
            fill={p.kind === 'official' ? 'var(--color-rouge)' : 'var(--color-paper)'}
            stroke="var(--color-rouge)"
            strokeWidth={1.5}
            tabIndex={0}
            className="cursor-pointer outline-none transition-[r]"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
          />
        ))}
      </svg>

      <figcaption className="mt-3 min-h-12 text-sm leading-relaxed text-ink-soft">
        <span className="font-display text-base text-ink">{point.period}</span>
        <span className="mx-2 text-mist">·</span>
        {formatCNY(point.amountCNY)}
        <span className="mx-2 text-mist">·</span>
        {point.kind === 'official' ? '官方数据' : '第三方估算'}
        <span className="mx-2 text-mist">·</span>
        <a
          href={point.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-ink/20 underline-offset-4 hover:text-rouge"
        >
          {point.sourceTitle}
        </a>
        {hasEstimate && <span className="mt-1 block text-xs text-mist">虚线与空心点为第三方估算，仅供参考。</span>}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 3: 写 `src/components/ProductDrawer.tsx`**

```tsx
import { useEffect } from 'react';
import { motion } from 'motion/react';
import type { ProductCard } from '../lib/types';
import { formatDate } from '../lib/dates';
import { genreLabel, productStatusLabel } from '../lib/labels';
import RevenueChart from './RevenueChart';
import SourceList from './SourceList';

interface Props {
  product: ProductCard;
  onClose: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function ProductDrawer({ product, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
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
        className="absolute inset-y-0 right-0 w-[min(600px,94vw)] overflow-y-auto bg-paper shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.45, ease }}
      >
        {art && <img src={art} alt="" className="aspect-[16/9] w-full object-cover" />}
        <div className="px-8 pt-8 pb-16 sm:px-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-mist">{genreLabel[product.genre]}</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">{product.name}</h2>
              {product.aliases.length > 0 && <p className="mt-1 text-sm text-mist">{product.aliases.join(' / ')}</p>}
            </div>
            <button
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
            <dd className="text-ink">{product.developerName}</dd>
            <dt className="text-mist">发行</dt>
            <dd className="text-ink">{product.publisherName}</dd>
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

- [ ] **Step 4: 写 `src/components/ProductShelf.tsx`**

```tsx
import { useCallback, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import type { ProductCard } from '../lib/types';
import { yearOf } from '../lib/dates';
import { genreLabel } from '../lib/labels';
import ProductDrawer from './ProductDrawer';
import Sparkline from './Sparkline';

export default function ProductShelf({ products }: { products: ProductCard[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const open = products.find((p) => p.id === openId);

  return (
    <MotionConfig reducedMotion="user">
      <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p, i) => {
          const art = p.keyArt ?? p.cover;
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <button type="button" onClick={() => setOpenId(p.id)} className="group block w-full text-left">
                <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
                  {art ? (
                    <img
                      src={art}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-7xl text-ink/10">
                      {yearOf(p.released)}
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-paper/90 px-2 py-1 text-xs tracking-widest text-ink-soft">
                    {genreLabel[p.genre]}
                  </span>
                  {p.status === 'shutdown' && (
                    <span className="absolute top-4 right-4 bg-ink/80 px-2 py-1 text-xs tracking-widest text-paper">
                      已停服
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-xl text-ink transition group-hover:text-rouge">{p.name}</h3>
                  <span className="font-display text-lg text-mist">{yearOf(p.released)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{p.significance}</p>
                {p.series.length >= 2 && (
                  <div className="mt-4 text-rouge/80">
                    <Sparkline series={p.series} />
                  </div>
                )}
              </button>
            </motion.li>
          );
        })}
      </ul>

      <AnimatePresence>{open && <ProductDrawer key={open.id} product={open} onClose={close} />}</AnimatePresence>
    </MotionConfig>
  );
}
```

- [ ] **Step 5: 挂到页面**

在 `src/pages/company/[id].astro` frontmatter 中加入导入：
```ts
import ProductShelf from '../../components/ProductShelf';
```
把 `#works` 区块里的 `<div class="mt-12"></div>` 替换为：
```astro
    <div class="mt-12">
      <ProductShelf client:visible products={cards} />
    </div>
```

- [ ] **Step 6: 验证**

Run: `npm test`
Expected: 全部 PASS。

Run: `npm run build`
Expected: 构建成功。

Run: `npm run dev`，打开 `http://localhost:4321/company/papergames`
Expected:
- 作品卡片三列排布，主视觉悬停时轻微放大，标题变胭脂红；有流水的卡片底部有细折线。
- 点击卡片，右侧抽屉滑入，背景变暗；按 Esc、点击遮罩或 × 关闭时抽屉滑出；打开时页面不滚动。
- 流水图：官方数据为实线实心点，估算为虚线空心点；悬停或点击数据点时，下方显示期间、金额、数据类型和可点击的来源链接。

- [ ] **Step 7: Commit**

```powershell
git add src/components src/pages/company/[id].astro
git commit -m "feat: add product shelf, revenue chart and drawer"
```

---

### Task 9: 浏览器视觉验收

**Files:**
- Modify: 验收中发现问题的组件或样式文件

- [ ] **Step 1: 启动开发服务器**

Run: `npm run dev`（后台运行）

- [ ] **Step 2: 桌面端截图检查**

用浏览器工具打开 `http://localhost:4321/company/papergames`，视口 1440×900，依次截图：首屏、时间轴、作品区、打开的抽屉、人物区、笔记区。逐项确认：
- 字体：标题为宋体，年份为 Cormorant Garamond，正文为黑体，没有回退成系统默认字体。
- 配色：只有胭脂红一种强调色，没有出现 Tailwind 默认的蓝色或灰色。
- 首屏文字在背景图上清晰可读。
- 时间轴标签互不重叠，也没有被容器裁掉。
- 抽屉内的流水图坐标轴标签完整，没有溢出。
- 浏览器控制台没有报错或水合（hydration）警告。

- [ ] **Step 3: 窄屏截图检查**

视口 390×844，重复 Step 2 的截图。确认：首屏标题不溢出，作品为单列，抽屉占满宽度且可滚动，时间轴可以横向滑动。

- [ ] **Step 4: 修正问题并复查**

对每个问题修改对应文件，刷新后重新截图确认。

- [ ] **Step 5: 全量验证**

Run: `npm test`
Expected: 全部 PASS。

Run: `npm run build`
Expected: 构建成功。

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "fix: polish company page after visual review"
```

---

## 后续计划（不在本计划范围）

- 第二期：首页"时间长河"与年份热度条（替换当前的公司目录首页）。
- 第三期：其余候选公司的数据批量采集，以及总览对比页（泳道图）。
