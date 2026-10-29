# 创酷深挖批次（2026-10-29）

女性向卷顺序第三轮第十四家。四缺口：海外版精确首发日、深圳/香港实体关系、国内版现状、主创署名。

## 已核实（iTunes 双区官方接口，一次落定三项）

- **海外版精确首发日（解决）**：US 区《Be The King: Judge Destiny》iOS 首发 **2018-08-07**（releaseDate），seller=HONG KONG CHUANG COOL INTERACTIVE ENTERTAINMENT CO., LIMITED（香港创酷互动娱乐），**末次版本 2026-10-20**——"约2018年"精确化，且海外版至本月仍在更新。
- **国内版现状（解决）**：CN 区《极品芝麻官》seller=Shenzhen Chuangku Interactive Information Technology Co., Ltd.（深圳创酷互动信息技术），iOS 上架 **2017-01-17**、末次版本 **2026-10-12**——国服 iOS 持续更新。⚠️ 2017-01-17（商店上架）与档案 2017-06-12（上线日）口径差异留核（或为商店首发与全平台公测之别），不改既有字段。
- **深港双主体（实体名锁定）**：深圳创酷互动信息技术（国服）/ 香港创酷互动娱乐（海外）——双边官方接口确认；股权关系仍待工商原件。

产品档 lifecycleNotes 与公司档三处 gap nextStep 已更新；主创署名未及。

## 原始来源

- https://itunes.apple.com/search?term=极品芝麻官&country=cn ：CN 区 seller/上架/末版。
- https://itunes.apple.com/search?term=Be+the+King&country=us ：US 区 seller/首发/末版。

## 下一步

2017 双日期口径核因 → 各地区版本逐区对应 → 深港股权工商原件 → 主创署名。

## 自检

见当批提交流程：npm test 全过 → astro check（硬停止：退出码=0 且 InvalidContentEntryDataError=0）→ knowledge:build → 4330 渲染验证 → 点名提交推送。
