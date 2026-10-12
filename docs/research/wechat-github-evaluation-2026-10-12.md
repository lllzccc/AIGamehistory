# 微信公众号 GitHub 方案核查（2026-10-12）

核查README、源码、GitHub API维护状态、问题记录；未安装第三方代码，未登录微信，未做成功率或长期稳定性测试。项目宣传不是实测保证。

| 项目 | 本轮核实能力 | 维护 / 限制 | 选型 |
| --- | --- | --- | --- |
| rachelos/we-mp-rss | 本地FastAPI、SQLite、RSS/API、定时采集、Markdown/JSON导出 | API显示2026-10-10更新，约4.9k stars；近期仍有同步失败和200013反馈。weread_mp文档明确仅最新一篇，无历史回补，需本地登录凭据 | 持续订阅候选，先单号验收，不宣称稳定全量 |
| wechat-article/wechat-article-exporter | 曾有历史批量导出 | 2026-07-30作者Issue200明确上游核心接口关闭并停止维护；仓库API未archived也不能说明仍维护 | 不选作主入口 |
| cooderl/wewe-rss | 曾基于微信读书生成RSS | 当前API archived=true，页面显示2026-05-11归档 | 不采用原仓库 |
| jj-cheng25/weixin-articles-mcp | 已知URL正文/图片读取，MCP输出 | 2026-05-01最后更新；fetcher只是httpx+浏览器UA，不是新数据权限，也没有账号历史检索 | 单篇读取候选，须对已阻断样本实测 |
| odyecho/mcp-server-wechat | 搜狗公开检索与自有公众号API | 2026-04-30更新；search_client仍HTTP搜狗，官方凭据管理自己的号，不能据此读取任意号 | 不解决当前主要缺口 |
| WupfAGI/wechat-search-skill | Tavily+搜狗双源发现 | 2026-03-03更新；Tavily需要Key，搜狗仍可能验证；只有7stars，不当成熟服务 | 可借鉴双源搜索，当前没有已连接Tavily能力 |
| zjp1997720/zhijian-skills / wechat-article-search | 关键词发现和真实链接解析 | 总仓2026-10-08更新不证明单个skill更新；明确搜狗解析受反爬影响 | 轻量发现候选，不保证正文读取 |
| lansine/weixin_search_skill | 多搜索源与浏览器/Tavily组合流程 | 2026-05-04更新；Skill本身不提供新数据接口 | 作为流程参考 |

原仓API元数据临时保存在.local-checks/wechat-repo-evaluation.json；不会把凭据纳入仓库。

## 可核查证据

- https://github.com/rachelos/we-mp-rss
- https://github.com/rachelos/we-mp-rss/blob/main/docs/weread-mp.md ：明确旧列表接口废弃、cover仅最新一篇。
- https://github.com/rachelos/we-mp-rss/issues/469 ：频率限制反馈。
- https://github.com/rachelos/we-mp-rss/issues/466 ：授权后不能同步反馈。
- https://github.com/wechat-article/wechat-article-exporter/issues/200 ：停止维护原始声明。
- https://github.com/cooderl/wewe-rss/releases ：归档提示。
- https://github.com/jj-cheng25/weixin-articles-mcp/blob/main/src/weixin_articles_mcp/fetcher.py ：实际HTTP获取实现。
- https://github.com/odyecho/mcp-server-wechat/blob/main/src/mcp_server_wechat/utils/search_client.py ：搜狗依赖。
- https://github.com/WupfAGI/wechat-search-skill
- https://github.com/zjp1997720/zhijian-skills/tree/main/skills/wechat-article-search
- https://github.com/lansine/weixin_search_skill

## 本项目接法及验收

发现层：多源搜索和官方/媒体跨平台文章反查原链接。阅读层：已知链接解析器/MCP候选与转载核验。订阅层：WeRSS本地服务输出RSS/API，接研究队列；发布网站仍保留事实摘要与来源，不公开登录凭据和全文。

先用一个官方公司号和一个行业媒体号，各选新文章及历史已知文章做样本：核对账号、标题、原文URL、发布日期、正文；区分发现成功与全文成功；记录过期登录、删文、验证码和限流；验证增量去重、重启后保存、失败恢复。历史文章回补单独验收，最新文章同步成功不能证明历史全量。

未经过以上实测不称已经接入、更稳定或已抓全。下一步根据本机容器/Python环境准备隔离试验，不改用户全局MCP配置；涉及微信扫码登录由用户操作，不提取已有其他应用会话。
