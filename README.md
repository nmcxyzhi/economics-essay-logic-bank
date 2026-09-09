# Economics Essay Logic Bank

Edexcel IAL Economics U3 四层题库：Unit → Knowledge Point → Essay Title → Essay Detail。中文界面，英文 Economics 内容。

保留 11 篇用户 Essay，53 个已有论证模块，6 张原图及 1 个原始 payoff matrix。两篇原文不完整的 Essay 保留 missing 占位。Question、points、logic 与图片未经本次架构迁移改写。

唯一内容源是 `data/essay-bank.json`。正式图片为 `diagrams/`。所有分类由数据生成，无内容的 Knowledge Point 不显示。

Content ChatGPT 交接规范：[CONTENT_IMPORT_GUIDE.md](CONTENT_IMPORT_GUIDE.md)。空白模板：[essay-import-template.json](essay-import-template.json)。机器可读 Schema：[essay-bank.schema.json](essay-bank.schema.json)。

- 本地预览：`npm run dev`，用 HTTP 打开 `http://127.0.0.1:4173`，不要双击以 file:// 打开 ES modules。
- 校验及构建：`npm run build`，输出到 `dist/`。
- 批量校验：`node scripts/import-essays.mjs /path/to/batch.json`。
- 正式追加：在上条命令后加 `--apply`。授权修订已有 ID 时加 `--replace-existing`。

无需后端、数据库、上传按钮、OCR、AI API 或运行时外部依赖。Hash 路由让 Essay 深层链接可直接刷新。

GitHub：`nmcxyzhi/economics-essay-logic-bank`（独立 private repository）。
Vercel Project：`economics-essay-logic-bank`。
生产地址与 Git 自动部署验证将在配置完成后记录。
