# 中国女性向游戏公司编年史 —— 设计文档

日期：2026-10-08
状态：待用户审阅

## 1. 目标

做一个本地运行的可视化网站，用来学习中国女性向游戏公司的发展历史：

- 按年份浏览：每年有哪些公司成立、发行了哪些产品、发生了哪些重大事件。
- 点进单家公司：查看基本信息、产品年表、营收流水、关键人物、重大事件，以及用户自己的学习笔记。
- 总览对比：把多家公司放在同一条时间轴上并排比较。

体验要求：画册般的视觉质感，有交互，不是冷冰冰的数据表。

## 2. 收录范围（第一版）

"女性向"口径：

- 乙女 / 恋爱向游戏
- 换装游戏
- 女性向互动叙事平台（如橙光、易次元、闪艺）

大厂（腾讯、网易、米哈游、阿里等）不整体收录，只收录其女性向产品线及对应工作室。
不收录早期泛女性用户产品（如小花仙、奥比岛、QQ炫舞、劲舞团），以后可扩展。

初步候选名单（正式采集时逐条联网核实，并通过检索补充中小厂商）：

| 主体 | 类型 | 代表产品 |
|---|---|---|
| 叠纸游戏 | 独立公司 | 奇迹暖暖、恋与制作人、闪耀暖暖、无限暖暖、恋与深空 |
| 友谊时光（玩友时代） | 独立公司 | 宫廷计、熹妃传，及能核实的近年女向新作 |
| 乐元素 | 独立公司 | 偶像梦幻祭系列 |
| 橙光 / 66RPG（北京六趣网络） | 平台 | 橙光互动阅读平台 |
| 闪艺 | 平台 | 闪艺互动视觉小说平台 |
| 腾讯 · 北极光工作室 | 大厂产品线 | 光与夜之恋 |
| 网易 | 大厂产品线 | 时空中的绘旅人、世界之外、云裳羽衣、易次元 |
| 米哈游 | 大厂产品线 | 未定事件簿 |
| 阿里 · 灵犀互娱 | 大厂产品线 | 代号鸢 / 如鸢 |

## 3. 数据模型

所有数据以文件形式存放在仓库中，由 Astro Content Collections 按 schema（zod）校验，格式错误在构建时直接报错。

### 3.1 公司 Company —— `src/content/companies/<id>.md`

frontmatter 字段：

- `id`、`name`、`aliases`（曾用名）
- `founded`（日期，允许只精确到年或月）
- `headquarters`（城市）
- `kind`：`independent` | `studio` | `platform`
- `parent`（母公司 id 或名称，可选）
- `status`：`active` | `acquired` | `closed`
- `tagline`（一句话简介，用于卡片和首屏）
- `website`、`logo`、`cover`（本地图片路径）
- `sources`：来源链接列表
- `verified`：是否已核实

正文：公司介绍 + 用户学习笔记（自由 Markdown）。

### 3.2 产品 Product —— `src/content/products/<id>.json`

- `id`、`name`、`aliases`
- `genre`：`otome` | `dressup` | `interactive` | `other`
- `developer`（必须是已收录公司的 id）
- `publisher`（已收录公司的 id，或直接写名称，如"腾讯"——大厂本身不作为实体收录）
- `released`（首发日期）、`shutdown`（停服日期，可选）
- `platforms`
- `status`：`live` | `shutdown`
- `significance`（一句话说明为什么重要）
- `cover`、`keyArt`（本地图片）
- `revenue`：数组，每项为
  - `period`（如 `2024` 或 `2024-Q3`）
  - `amountCNY`（数值，单位：元）
  - `kind`：`official`（财报 / 官方）| `estimate`（第三方估算）
  - `source`（来源名称 + 链接，如 Sensor Tower、点点数据、上市公司财报）
  - 同一产品的流水不得混用年度与季度粒度
- `sources`、`verified`

### 3.3 人物 Person —— `src/content/people/<id>.json`

- `id`、`name`、`avatar`（可选）
- `roles`：数组，每项为 `{ company, title, from, to }`
- `bio`（简短介绍）
- `sources`、`verified`

人物单独成实体，用于追踪跳槽和出走创业。

### 3.4 事件 Event —— `src/content/events/<id>.json`

- `id`、`date`
- `type`：`funding` | `ipo` | `acquisition` | `rename` | `layoff` | `controversy` | `milestone`
  （"成立"、"上线"、"停服"由公司的 `founded`、产品的 `released` / `shutdown` 自动生成，不再单独记录为事件，避免重复）
- `companies`、`products`（关联 id 列表）
- `summary`（一句话）
- `sources`、`verified`

### 3.5 市场规模 Market —— `src/content/market/<year>.json`

- `year`、`amountCNY`（元）、`kind`（`official` | `estimate`）
- `scope`：统计口径说明（如"中国女性向游戏市场实际销售收入"）；所有条目必须同一口径，否则构建报错
- `source`、`verified`、`note`（可选，记录版本修订等）
- 用于首页热度条上叠加的市场整体流水曲线；口径一致的数据不足两年时不画线

### 3.6 数据准确性

- 每条事实必须带至少一个来源链接。
- 无法核实的条目标记 `verified: false`，页面上用"待核实"标识显示。
- 营收区分官方数据与第三方估算，页面上用不同样式区分（官方用实线，估算用虚线）。

## 4. 视觉风格

- **气质**：编年史画册 / 博物馆线上展览。克制、留白，不做甜腻粉色。
- **配色**：暖白纸色底（约 `#F4EFE8`），深墨色文字（约 `#1E1A17`），唯一点缀色"胭脂红"（约 `#9E3B4D`），辅以低饱和灰褐。
- **字体**：标题用思源宋体（Noto Serif SC），年份数字用大号衬线体，正文用思源黑体（Noto Sans SC）。
- **画面**：游戏主视觉作为主角，大图出血排版；图表线条细、颜色淡。
- **动效**：滚动渐入、年份吸顶切换、卡片悬停轻浮起。尊重 `prefers-reduced-motion`。

## 5. 页面

### 5.1 首页"时间长河" `/`

- 顶部热度条：横跨收录的最早年份到 2026 年；每年柱高为事件数，叠加女性向市场整体流水曲线；点击年份跳转。
- 主体：纵向滚动，左侧大号年份吸顶；右侧按当年内容排布：
  - 新成立公司：小卡片（logo + 名称 + 一句话）
  - 产品首发：大卡片（主视觉 + 名称 + 研发 / 发行方）
  - 重大事件：日期 + 一句话
- 筛选：按 `genre`（乙女 / 换装 / 互动叙事）过滤。

### 5.2 公司详情页 `/company/<id>`

- 首屏：公司名、成立年份、现状，背景为代表作主视觉。
- 公司时间轴：可横向拖动，标注成立、融资、产品上线 / 停服等事件。
- 产品陈列：卡片 + 流水迷你折线图；点击后侧边抽屉滑出，展示完整流水图、研发 / 发行信息、关键节点。
- 关键人物：人物卡片，显示任职年份；若曾任职于其他已收录公司，可点击跳转。
- 学习笔记：渲染 Markdown 正文。

### 5.3 总览对比页 `/compare`

- 泳道图：每家公司一条泳道；产品为横条（长度 = 上线到停服 / 至今，粗细 = 流水量级），事件为圆点。
- 顶部勾选要对比的公司；选择状态保存在 URL 查询参数中，方便收藏。
- 悬停显示详情浮层，点击跳转到公司页。
- 流水粗细与口径字段的细则见 `2026-10-09-phase-3-compare-and-companies-design.md`。

### 5.4 暂不做

- 人物关系网络图（数据积累后再做）
- 后台编辑界面、用户系统、搜索引擎级全文检索

## 6. 技术架构

- **框架**：Astro（静态生成），交互部分用 React 组件（islands）。
- **样式**：Tailwind CSS，配合设计 token（颜色、字号、间距）。
- **动效**：Motion（motion.dev）。
- **图表**：D3 计算比例尺 + 自绘 SVG（热度条、泳道图、流水折线），不使用现成图表库，以保证画册质感。
- **数据层**：`src/lib/data.ts` 提供纯函数，如 `getYearBuckets()`、`getCompanyTimeline(id)`、`getCompareLanes(ids)`；页面和组件只依赖这些函数，不直接读文件。
- **图片**：下载到 `public/images/` 本地使用（仅个人学习用途）。
- **运行**：`npm run dev` 本地浏览；以后如需公开，`npm run build` 后可部署到任意静态托管。

目录结构：

```
src/
  content/            # companies/ products/ people/ events/
  content.config.ts   # zod schema
  lib/data.ts         # 数据聚合纯函数
  components/         # YearRiver, HeatStrip, CompanyTimeline, ProductDrawer, SwimLanes, ...
  pages/              # index.astro, company/[id].astro, compare.astro
  styles/
public/images/
```

## 7. 数据采集流程

1. 用联网检索（搜索引擎 + 网页抓取）逐家公司收集信息：工商成立时间、官网、百科、新闻报道、财报、第三方数据平台。
2. 交叉核对至少两个来源；冲突时在条目中注明。
3. 写入对应数据文件，附来源链接；未核实的标 `verified: false`。
4. 先完成一家（叠纸游戏）作为样板，确认数据深度和页面效果后，再批量采集其余公司。

## 8. 校验与测试

- 构建时 zod schema 校验所有数据文件。
- 引用完整性检查脚本：产品的 `developer` / `publisher`、事件的 `companies` / `products`、人物的 `roles.company` 必须指向已存在的 id。
- `src/lib/data.ts` 的聚合函数写单元测试（Vitest）。
- 视觉验收：在浏览器中检查三个页面的桌面端效果，兼顾基本的窄屏适配。

## 9. 交付顺序

1. 项目脚手架 + 数据 schema + 设计 token
2. 叠纸游戏样板数据（公司、产品、人物、事件、流水）
3. 公司详情页
4. 首页时间长河 + 热度条
5. 其余公司数据批量采集 + 总览对比页（见 `2026-10-09-phase-3-compare-and-companies-design.md`）
