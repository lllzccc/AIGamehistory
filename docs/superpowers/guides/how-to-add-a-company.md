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
