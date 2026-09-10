# Economics Essay Logic Bank

Edexcel IAL Economics U3 四层题库：Unit → Knowledge Point → Essay Title → Essay Detail。中文界面，英文 Economics 内容。

保留 11 篇用户 Essay，53 个已有论证模块，6 张原图及 1 个原始 payoff matrix。两篇原文不完整的 Essay 保留 missing 占位。Question、points、logic 与图片未经本次架构迁移改写。

唯一内容源是 `data/essay-bank.json`。正式图片为 `diagrams/`。所有分类由数据生成，无内容的 Knowledge Point 不显示。

Content ChatGPT 交接规范：[CONTENT_IMPORT_GUIDE.md](CONTENT_IMPORT_GUIDE.md)。空白模板：[essay-import-template.json](essay-import-template.json)。机器可读 Schema：[essay-bank.schema.json](essay-bank.schema.json)。

- Safari 本地打开：双击 `打开网站.command`，它会先构建网站，再用本机 HTTP 地址打开 Safari。
- 命令行预览：`npm run dev`，用 HTTP 打开 `http://127.0.0.1:4173`。不要直接双击 `index.html`；Safari 会阻止 `file://` 页面读取 JSON 数据和 JavaScript modules。
- 校验及构建：`npm run build`，输出到 `dist/`。
- 批量校验：`node scripts/import-essays.mjs /path/to/batch.json`。
- 正式追加：在上条命令后加 `--apply`。授权修订已有 ID 时加 `--replace-existing`。

无需后端、数据库、上传按钮、OCR、AI API 或运行时外部依赖。Hash 路由让 Essay 深层链接可直接刷新。

GitHub：`nmcxyzhi/economics-essay-logic-bank`（独立 private repository）。
Vercel Project：`economics-essay-logic-bank`。
生产地址与 Git 自动部署验证将在配置完成后记录。

## 当前章节与文章映射

当前使用五个 U3 课程章节；章节可在唯一数据文件的 units 中更新。`Labour Market` 暂无 Essay，因此不会生成任何空 Knowledge Point。

1. Types and Sizes of Businesses
2. Business Objectives
3. Revenue, Costs and Profits
4. Market Structure and Contestability
5. Labour Market

| Unit | Knowledge Point | Essay Title | Marks |
|---|---|---|---|
| Market Structure and Contestability | Monopoly | Monopoly Power: Benefits to Consumers | 20 |
| Types and Sizes of Businesses | Market Concentration | Reasons for Market Concentration | 14 |
| Market Structure and Contestability | Oligopoly | Price and Non-Price Strategies: Effects on Sales | 14 |
| Business Objectives | Revenue Maximisation | Revenue Maximisation as a Realistic Objective | 20 |
| Business Objectives | Objectives by Firm Size | Business Objectives: SMEs vs Large Firms | 20 |
| Types and Sizes of Businesses | Demergers | Benefits of Demergers | 20 |
| Types and Sizes of Businesses | Mergers | Effects of Mergers on Workers | 14 |
| Types and Sizes of Businesses | Mergers | Benefits of External Growth by Merger | 20 |
| Market Structure and Contestability | Oligopoly | Disadvantages to Consumers | 20 |
| Market Structure and Contestability | Oligopoly | Disadvantages to Firms and Game Theory | 20 |
| Revenue, Costs and Profits | Shutdown Decisions | Reasons for Shutdown | 14 |

## 自动部署状态

GitHub 已推送 main。Vercel Git 连接返回：需要先添加 GitHub Login Connection。当前不得把手动 CLI 部署表述为 Git push 自动部署。完成账户连接后运行 Vercel git connect 并用一次正常提交验证实际部署。
