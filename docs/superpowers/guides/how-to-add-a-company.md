# 如何收录一家女性向游戏公司

给以后用自动化（例如 zcode）补录公司的人看。只收**公司**，优先自研。2026-10-10 用户扩展范围：可从成功的官斗、宫斗、宫廷与历史养成产品反查研发公司；官斗或帝王视角不自动归为女性向。不要把橙光 / 闪艺上的用户作品做成产品条目。不要为阿里、腾讯、网易、米哈游建公司实体；大厂只收其女性向工作室，`kind: studio`，`parent` 写集团中文名。

## 1. 要新建哪些文件

id 一律小写英文短横线，取自文件名：

- `src/content/companies/<id>.md`
- `src/content/products/<product-id>.json`（只收该公司女性向代表作）
- `src/content/people/<person-id>.json`（查得到再写，没有来源就不建）
- `src/content/events/<event-id>.json`（重要流动用 `departure`，公司裁员用 `layoff`）

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

伽马数据只是全平台/行业报告里的一家，不是唯一渠道。按口径分开找，不要把商店估算、媒体全平台估算和财报写进同一条序列冒充连续：

| 口径 | 渠道 | 能写进 `revenue`？ |
|------|------|-------------------|
| `official-report` | 港交所 / 上交所 / 深交所公告、招股书、年报中报、公司 IR | 能，`kind: official` |
| `store` | [Sensor Tower](https://sensortower.com/)、[data.ai](https://www.data.ai/)（原 App Annie）、[七麦数据](https://www.qimai.cn/)、[点点数据](https://www.diandian.com/zh) | 能，`kind: estimate`，注明不含国内安卓渠道时标 `partial` |
| `all-platform` | [GameLook](http://www.gamelook.com.cn/)、[游戏陀螺](http://www.youxituoluo.com/)、竞核、游戏葡萄、白鲸出海、游戏日报；伽马数据的产品流水估算也落这里 | 能，`kind: estimate`，必须写清原文口径 |
| 行业规模（不是单品流水） | 游戏工委 GPC、艾瑞、易观、Newzoo、伽马的市场总量报告 | **不写进产品 `revenue`**，最多进公司概述 |
| 买量 / 素材 | [AppGrowing](https://www.appgrowing.cn/) | 不写流水 |
| 排行、热度 | iOS / 安卓畅销免费榜、TapTap、SteamDB（PC） | 不写流水，可写进 `significance` |
| 上线资格 | 国家新闻出版署版号公示 | 不写流水，可核对上线年 |

媒体转引 Sensor Tower / 伽马时，跟原始口径走，不要因为文章标题写「流水」就改成 `all-platform`。预测值（「预计将达到」）不收录。

主视觉优先官网 CSS 里的 `header.jpg` / `main_header.jpg` / `top_bg.jpg`，不要用导航栏 96px 图标。官网没有宽图时，再用官方商店 KV（TapTap / App Store），不要用 OG 头像。

## 4. 人物与主创

人是主档，产品和公司都从 `roles` 反查，不要在产品 JSON 里再写一份 credits。

- `scope: company`：创始人 / 董事长 / CEO / 总裁。不要挂 `products`。只出现在公司页「关键人物」。
- `scope: product`：制作人、执行制作人、制作人总监、主策、核心策划、主美、核心美术、编剧、音乐。必须挂已有产品 id，可多款。只出现在「人才地图」，按项目列历任。
- 人档可空外链：`linkedin` / `maimai` / `weibo`。先占位，本期不从脉脉取事实。
- 对不上枚举用 `title: other` + `titleNote` 写原文。有更贴切的原文职务时，枚举岗位也可加 `titleNote`，界面优先显示原文。
- `name` 用报道里最常见的称呼，`aliases` 写本名或其他署名。
- 不收普通策划、原画、运营、CV、全员表。
- 来源至少一条能点开的出处。官网、官方采访、当期新闻优先。玩家百科只当线索，两源才 `verified: true`。脉脉、匿名爆料不用。
- 只有「某年亮相」就用亮相日当 `from`，不要倒推入职年。普通任期末日只改 `to`；具名制作人离职另建 `departure` 事件。
- 未收录的前东家只写进简介，不新开公司。

## 5. 冲突与命名

- 冲突：条目 `verified: false`，公司笔记「资料分歧」写清两说与采用理由
- 发行方若是已收录公司，填那个公司 id；否则填自由文本，**必须沿用仓库里已经出现过的写法**（构建日志会打印「自由文本发行方：…」）
- 无公开上线产品（只有预告 / 已取消）→ **暂缓**，不要建只有空壳的公司

## 6. 待收录（本期未做）

橙光、闪艺、腾讯北极光 /《光与夜之恋》、米哈游 /《未定事件簿》、网易女向线（《绘旅人》《世界之外》《云裳羽衣》等）。三七苏州萤火若代表作仍未上线，继续暂缓。

## 7. 自检

在仓库根目录：

```powershell
npm test
npm run check
npx astro build
```

三道都必须过。构建失败常见原因：引用了不存在的公司 / 产品 id、流水年季混用、停服缺日期、日期倒序。
