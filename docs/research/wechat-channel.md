# 微信公众号检索与接入

公众号是每家公司五方向检索的必查渠道。先发现文章，再核对发布主体及原文；不能把搜索摘要当证据。

## 入口与顺序

1. 公司官网的官方微信入口、产品官方公告中的文章链接：用于确认账号身份；未确认的同名账号不标官方。
2. 搜狗微信 https://weixin.sogou.com/ ：按公司名、产品名、制作人、主策、研发、校招、上线、停服、融资等组合检索。2026-10-12主页可读，搜索结果读取失败；不代表没有文章。
3. 通用搜索分别查 `site:mp.weixin.qq.com 公司 产品` 和 `公司 产品 公众号 原文`。只查域名会遗漏未被索引的内容。
4. 行业媒体网页和官方跨平台转载：追索文末原文链接。优先查游戏葡萄、手游那点事、游戏茶馆、GameLook的同名文章，账号身份逐篇核对。
5. 微信内搜一搜、账号历史文章与第三方历史服务作为补充入口：当前没有登录连接，尚未验证；遇到登录或验证码记 access-needed，留给人工提供链接或正文，不伪装全量接口。

## 单篇读取

`python scripts/wechat-source.py "https://mp.weixin.qq.com/s/文章标识"`

本地已保存HTML可用 `--html path.html`，结果写 `.local-checks/wechat/`；只提取文章正文容器，不把验证页当文章。脚本不登录、不获取Cookie、不批量循环。readable仅表示提取到正文，factVerification仍是pending，必须人工核对。

记录标题、账号名、官方身份依据、发布日、原文地址、转载地址、核查日、读取状态、可支持事实、剩余疑问。原始发布日未知则留空；修改日不替代首发日。带参数文章链接保留定位参数，不猜__biz/mid/idx/sn。

原文不可读时，转载作为独立来源引用并注明未核对微信原文；不同转载同一稿不是多个独立证据。公众号为采访或估算也不能自动升级为官方财务。网站存摘要、事实与链接，完整正文临时本地保存，不整篇公开搬运。

## 本次实测

- GameRes https://www.gameres.com/881431.html 保留微信 https://mp.weixin.qq.com/s/0kxjGCmFdvHTAP-FGprUAw ，有Warpath开发负责人线索；原文读取失败，身份/任期待专项核查。
- GameRes https://www.gameres.com/890453.html 保留微信 https://mp.weixin.qq.com/s/2UzImtqiQxhhuZ9Ly_y8dQ ，有莉莉丝策略产品线线索；原文读取失败。

两篇进入 wechat-source-queue.json，不直接修改人员或财务档案。下一轮优先重点公司的官方账号身份与历史产品/研发访谈链接，检索范围写公司页末的examined和gaps。

GitHub方案已另核查：[选型与已失效接口说明](wechat-github-evaluation-2026-10-12.md)。WeRSS作为订阅候选，公众号历史回补仍需独立验收。
