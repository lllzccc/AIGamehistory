# 每日 20:00 信息补充定时任务·指令规格（2026-10-20 用户要求设立）

> 本会话因归属计划任务无法新建定时（系统限制：同一会话只能属于一个调度任务）。新会话创建时，将下述 prompt 原文交给 CronCreate（cron: `0 20 * * *`，recurring: true，标题：每天晚上8点：女性向信息自动检索补充）。

## CronCreate 参数

- cron: `0 20 * * *`
- title: 每天晚上8点：女性向信息自动检索补充
- recurring: true

## prompt 原文

女性向编年史·每日信息补充检索（2026-10-20用户设立：每天晚上8点自动检索补充信息）。工作目录 A:\AIProjects\AIGamehistory。

### 开工前状态检查
1. git fetch origin && git log --oneline -3 origin/master：若有并行会话新提交，先 git worktree 建临时目录（A:/tmp/wt-daily）在其上工作；主工作区若有其他会话未提交WIP（git status 查 M 文件数>0 且非本任务产生），一律不碰，用 worktree 模式改动与推送。
2. 内部站：curl http://127.0.0.1:4330/ 不通则 npm run knowledge:start 后台重启。

### 每日渠道轮换（按星期几，date +%u 取 1-7）
- 周一/周四：搜狐号镜像扫「游戏葡萄」（mp.sohu.com/profile?xpt=eW91eGlwdXRhb0Bzb2h1LmNvbQ==）与「游戏茶馆」（mp.sohu.com/profile?xpt=MTc1MDA0OTQ4NEBzaW5hLnNvaHUuY29t）近20篇标题+相对时间，筛女性向/小游戏/宫斗/乙女/AI陪伴相关篇目。
- 周二/周五：游戏陀螺镜像（mp.sohu.com/profile?xpt=d2VuamluZ0B5b3V4aXR1b2x1by5jb20=）+ GameLook腾讯新闻号（WebSearch 搜 gamelook 腾讯新闻 女性向/小游戏 近期稿）。
- 周三/周六：内置WebSearch 女性向快讯轮：三种检索公式（"女性向游戏 新游/新公司/融资"、"乙女游戏 制作人 离职/新工作室"、"微信小游戏 女性向/消除/宫斗 新品"）。
- 周日：小红书 IAB（agent.browsers.get("iab")，bootstrap用process.env.ZCODE_PLUGIN_ROOT+scripts/browser-client.mjs的setupBrowserRuntime）：检查登录态（a[href*="/user/profile/"]存在则可用），可用则扫2个词（goto https://www.xiaohongshu.com/search_result?keyword=… → 等5秒 → evaluate抽 a[href*="/explore/"] 标题与笔记ID，8秒以上间隔）；ERR_CONNECTION_RESET即停并记录。小红书笔记一律只作线索不作sources。
- 每日固定重试（连通即处理）：curl -m 10 https://pdf.dfcfw.com/pdf/H2_AN202404261631399987_1.pdf 与 https://www1.hkexnews.hk/ ——通则下载点触2023年报PDF（node pdfjs-dist解析，Uint8Array+cMapUrl 'node_modules/pdfjs-dist/cmaps/'）核对2021-2023归母净利与2024两说；百奥按代码02100检索招股书入库。

### 线索处理纪律
- 新发现厂商/产品：双源可核→建档（developer必须是已收录公司id，否则先建公司实体；keyArt用iTunes接口artworkUrl，注意search与lookup接口CDN路径差一位时以lookup为准）；单源→src/data/mapping-plan.json登记仅列名（注明发现渠道与日期）。
- 人物/角色/数字必须打开原文核实，搜索摘要不作为事实。
- 负面结论四步纪律：≥2检索公式+引擎轮换（搜狗反爬即换内置WebSearch）+商店开发者账号反查+近三月榜单核查。
- founded等必填字段不可空串；gap级status枚举不含partial（详见 docs/research/company-research-workflow.md 与 discovery-protocol.md）。

### 门禁与提交（每次改动后）
npm test（109全过）→ npx astro check（⚠️内容崩溃时exit仍为0，必须grep输出：InvalidContentEntryDataError计数=0且汇总行0 errors）→ npm run knowledge:build → curl 验证127.0.0.1:4330对应页面渲染 → git add 只点名本批文件 → commit（英文信息）→ push origin master（worktree模式则 push origin HEAD:master 后 git worktree remove 临时目录，删除仅限自建的 A:/tmp/wt-daily 字面路径）。门禁不绿不推送。

### 数据安全铁律（最高优先级）
禁止对 ~、$HOME、C:\Users 下任何路径、盘符根目录、AppData/Desktop/Documents/Downloads 等执行任何删除；删除命令禁裸变量与通配符；不碰用户数据；临时文件只放 A:/tmp 或项目工作区。

### 收尾
当日过程与结论追加 docs/research/daily-sweep-log.md（格式：## YYYY-MM-DD（周X）| 渠道 | 发现线索清单 | 入档/登记结果 | 遗留），随批提交。输出总结：本期新发现、入库清单、遗留缺口。当日全无新信息也如实记录。
