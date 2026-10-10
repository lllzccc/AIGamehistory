# 人物、主创与人员流动

日期：2026-10-09
状态：已通过口头确认，框架先落地，数据后填
父规格：`docs/superpowers/specs/2026-10-08-otome-game-chronicle-design.md`

## 1. 目标

把人从「公司页上的董事长简介」变成可挂到产品上的主创履历，并能看出谁来、谁走、去了哪。本期只搭框架：schema、派生查询、三处界面、说明书。不批量检索新主创。现有 6 个人迁到新字段。查不到的产品主创栏保持空白。

## 2. 原则

人是主档。公司和产品都从 `people[].roles` 反查，不在产品 JSON 里再写一份 credits。没有来源就不建人。未收录的前东家只写进简介，不新开公司。

## 3. 数据

### 3.1 Person

在现有 `name` / `bio` / `roles` / `sources` / `verified` 上增加 `aliases`（花名、本名、英文名），默认 `[]`。`name` 用公开报道最常见的称呼。

### 3.2 Role

| 字段 | 规则 |
|------|------|
| `company` | 已收录公司 id |
| `scope` | `company` 或 `product` |
| `products` | `product` 时至少一个已收录产品 id，可挂多款；`company` 时必须为空 |
| `title` | 封闭枚举，见下 |
| `titleNote` | 展示用原文；`title` 为 `other` 时必填 |
| `from` / `to` | 与现有日期格式相同；在任不写 `to` |

`title`：`founder` `chair` `ceo` `president` `producer` `executive-producer` `creative-director` `lead-designer` `lead-artist` `writer` `music` `other`。

界面优先显示 `titleNote`，否则用中文标签（制作人、执行制作人、制作人总监、主策、主美、编剧、音乐、创始人、董事长、CEO、总裁）。

一人多产品：同一任期挂多个产品 id；任期不同则拆成多条。

### 3.3 事件

`event.type` 增加 `departure`（具名制作人/主创离职）。已有 `layoff` 仍表示公司裁员。小萌离职事件从 `milestone` 改为 `departure`。普通任期末日只改 `to`，不上时间轴。

### 3.4 校验

`checkIntegrity` 除原有公司/日期检查外：`scope: product` 的产品 id 必须存在；`scope: company` 不得挂产品。

## 4. 派生

- `getProductCredits(ds, productId)`：所有挂了该产品的署名，按岗位顺序再按 `from`。
- `toProductCards` 带上 `credits`。
- `getCompanyView` 的人物仍按公司过滤；界面按 `scope` 拆成管理层与主创。
- `getPersonView(ds, id)`：该人全部履历，供个人页。

## 5. 界面

- 产品抽屉：有 credits 才在元数据下显示「主创」，名字链到 `/person/<id>`。
- 公司页「关键人物」：管理层 / 主创两块；主创行写出产品名。
- 个人页 `/person/<id>`：简介、花名、按时间排的履历（公司 + 产品可点）。无总名录。
- 时间轴：`departure` 与现有事件一样出现。长河和对比页不加人物。

空着就不露。

## 6. 收录（说明书）

收：制作人、执行制作人、制作人总监、主策、主美、编剧、音乐，以及公司创始人/董事长/CEO/总裁。不收普通策划、原画、运营、CV、全员表。

来源至少一条可点开的出处。官网、官方采访、当期新闻优先。玩家百科只当线索，两源才 `verified: true`。脉脉、匿名爆料、无出处主创表不用。

日期能细则细；只有「某年亮相」就用亮相日当 `from`，不倒推入职年。

## 7. 本期迁移

| 人 | 迁法 |
|----|------|
| 姚润昊 / 蒋孝黄 / 王海宁 / 詹钟晖 | `scope: company`，`titleNote` 保留原职务原文 |
| 小萌 | `scope: product`，挂 `ru-yuan` `daimao-yuan`，`title: producer`，`to: 2026-06` |
| 富永健太郎 | `scope: product`，挂 `infinity-nikki`，`title: executive-producer` |
| 小萌离职事件 | `type: departure` |

不新采集栗子或其他制作人。

## 8. 非目标

不写 zcode 自动化。不做人物总名录。不把入职自动变成时间轴节点。不改流水口径。
