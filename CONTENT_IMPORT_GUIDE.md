# Content ChatGPT → Codex：Essay 数据交接规范 v1

本文件交给处理 Economics 内容的 Content ChatGPT 阅读。Content ChatGPT 负责内容、分类与原图；Codex 只做数据导入、格式校验、GitHub 提交及部署，不重新总结、改写或优化 Economics 内容。

## 1. 唯一正式数据源与文件路径

项目根目录：`/Users/sunmingcan/Documents/codex/economics-essay-logic-bank/`。

- 正式题库：`data/essay-bank.json`（绝对路径：`/Users/sunmingcan/Documents/codex/economics-essay-logic-bank/data/essay-bank.json`）。
- 正式图片目录：`diagrams/`（绝对路径：`/Users/sunmingcan/Documents/codex/economics-essay-logic-bank/diagrams/`）。
- JSON Schema：`essay-bank.schema.json`。
- 空白模板：`essay-import-template.json`。
- 本规范：`CONTENT_IMPORT_GUIDE.md`。

原文件不需要交给 Codex。请提交一份 `essay-import-YYYY-MM-DD.json` 和本批使用的实际 diagrams 文件夹，必要时一并打包为 ZIP。不提供伪造的图片路径或仅有图像描述而没有文件的条目。

## 2. 网站的四层结构

`unit → topic → essayTitle → Essay Detail`。

`unit` 为课程大章节，`topic` 为该章节中的知识点，`essayTitle` 为简短英文文章标题，`question` 为完整真正 Question。外层不显示完整 Question。

根对象的 `units` 数组固定声明五个顶层 Unit 及显示顺序。五个 Unit 始终显示，即使当前没有 Essay。Knowledge Point 由 essays 的 `topic` 自动生成，只有实际包含 Essay 的 Knowledge Point 才显示。

Knowledge Point 使用适合 Essay 复习的直接知识模块，不机械复制教材 subchapter，也不增加中间层级。当前已确认的分类为：

1. `Types and Sizes of Businesses`
   - `Business Objectives`
   - `Mergers`
   - `Demergers`
2. `Revenue, Costs and Profits`
   - `Shutdown`
3. `Market Structures and Contestability`
   - `Market Concentration`
   - `Oligopoly`
   - `Monopoly`
   - `Price and Non-Price Competition`
4. `Labour Markets`
5. `Government Intervention`

新 Essay 若确实需要新的直接 Knowledge Point，应先明确其所属 Unit，再把新名称加入 validation；不得用教材小章节额外包一层。大小写、单复数与空格必须一致。导入脚本会拒绝未确认的 Unit / Knowledge Point，以及顺序不同的顶层 `units`。当前映射见 `README.md`.

## 3. 字段与类型

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| schemaVersion | integer，固定 1 | 是 | 根对象的数据版本 |
| essays | Essay[] | 是 | 单篇与批量都使用数组 |
| units | string[] | 否 | 章节顺序；一般新增内容包省略，由每篇 unit 推导 |
| id | string | 是 | 唯一稳定 ID；正则 `^[a-z0-9]+(?:-[a-z0-9]+)*$`；仅小写英文、数字、单个连字符 |
| unit | string | 是 | 英文课程章节名 |
| topic | string | 是 | 英文 Knowledge Point |
| essayTitle | string | 是 | 简短英文标题；无扩展名、考试年份或冗余题号；不可直接照抄 Question |
| question | string | 是 | 英文问题句，保留题目真正范围；移除题前材料与作图指令 |
| questionNumber | string 或 null | 是 | 已确认时如 `Q7(e)`、`Q8`、`Q9`、`Q10`；未知填 null，禁止猜题号 |
| marks | integer，14 或 20 | 是 | Q7=14，Q8/Q9/Q10=20；其他编号体系使用原文明确分值，并用 source 记录证据 |
| sections | Section[] | 是 | 数组顺序就是页面顺序，不由网站增删或改写 |
| status | `complete` 或 `partial` | 否 | 默认内容已提供；不完整时填 partial |
| contentNote | string | partial 时必填 | 中文状态说明，只用于说明缺失范围，不放 Economics 论证 |
| source | object | 否 | 溯源元数据；可包含 filename、session、questionLocation、marksEvidence |
| sections[].type | string | 是 | `KAA1`、`EVA1`、`Weighing1` 等，编号从 1 开始；每篇不能重复 |
| sections[].summary | string | 新导入必填 | 3–8 个英文单词的段落中心思想；旧数据缺失时网站兼容；missing placeholder 填 `""` |
| sections[].point | string | 是 | 完整英文观点句；已提供模块不能为空 |
| sections[].logic | string[] | 是 | 一项一个英文推导步骤；无箭头前缀，网站自动加纵向箭头 |
| sections[].diagrams | string[] | 是 | 无图时 `[]`；有图时 `/diagrams/filename.png` |
| sections[].diagramDetails | object | 否 | 以 diagram path 为键，保存 alt、caption、sourceLocation、sha256 |
| sections[].matrix | object | 否 | 原文收益矩阵；caption、headers、rows，所有单元格为字符串；可加 sourceLocation |
| sections[].missing | boolean | 否 | 仅原文确实缺失时使用 true，point=`""`、logic=`[]`、diagrams=`[]` |

`sections[].type` 正则：`^(KAA|EVA|Weighing)[1-9][0-9]*$`。正常建议以完整论证组排序；网站依据末尾编号提供分组，并保持数组原有顺序。新增第三组等不需修改代码。

## 4. 分值与 sections 顺序

20 分常见顺序：KAA1、EVA1、Weighing1、KAA2、EVA2、Weighing2。
14 分常见顺序：KAA1、EVA1、KAA2、EVA2。

这些是内容组织约定，不是网站硬编码的段落数量。最终以用户批准的实际 sections 为准；不要因为分值擅自补写缺失模块。缺失原文可以保留 missing 占位并添加 contentNote。已有两篇 partial 条目不能在导入时误标为完整。

Practice 中 summary 始终可见且不计入 reveal step。默认保留 point，逐项隐藏/显示 logic；图像和 matrix 也计入揭示步骤。勾选同时隐藏观点句后，point 也计入步骤。missing 占位不计入回忆步数。

## 5. 图像与原表格

实际文件名使用小写 ASCII、数字、连字符。例如：`my-essay-kaa1.png`；重复图可复用相同路径。优先 PNG/JPEG/WebP，支持可信静态 SVG。不写电脑绝对路径、file://、远程 URL、../ 或 `public/` 前缀。

JSON 填写 `/diagrams/my-essay-kaa1.png`，实际文件交付在 `diagrams/my-essay-kaa1.png`。该路径在本地 HTTP 预览和 Vercel 网站上相同。

只提供原文真实存在的图，保留原始比例、坐标、曲线及标注，不要裁掉内容或生成新图。把路径放入对应的 KAA section。页面不设独立 Diagram 总区，点击原图在新窗口放大。评分标准参考截图不应冒充用户 Essay 图。

原生收益矩阵示例：
```json
{"caption":"Payoffs: (A, B)","headers":["","B: maintain","B: cut"],"rows":[["A: maintain","10, 10","5, 15"],["A: cut","15, 5","7, 7"]],"sourceLocation":"Original Word table following KAA1"}
```
表格各行列数必须等于 headers 列数，不改写原收益数值。

## 6. 内容边界与不可违反的要求

- Economics 内容全英文，界面状态说明用中文。
- `summary` 是 3–8 个英文单词的快速复习标签。Content ChatGPT 对新 Essay 负责提供；Codex 只校验、原样导入和显示，不改写或覆盖。
- `point` 保留考试中可直接使用的完整观点句；`logic` 压缩为短语但不跳过重要经济中间环节。
- Remove the case-study detail, not the economic logic.
- Question、论证、图像及分类在 Content ChatGPT 侧确定后，Codex 不再改写或重新分类。
- JSON 必须合法 UTF-8：双引号、无注释、无尾逗号，不要把 Markdown 代码围栏放入 JSON 文件。
- ID 不可重复。修改现有文章沿用原 id；不得用新 id 制造重复文章。
- 同一篇 section.type 不可重复。无图也必须保留 diagrams 数组。
- 新导入的每个正常 section 必须包含非空 `summary`；missing section 的 `summary` 为 `""`。历史数据暂缺 summary 时仍可打开和构建。
- 空白模板故意不可直接导入：必须填完所有必填内容，再移除不适用的 section。
- 不在数据中放 API key、登录凭据或私人账户信息。

## 7. 完整 JSON Schema

机器可读文件：`essay-bank.schema.json`。以下与文件一致：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://economics-essay-logic-bank.vercel.app/essay-bank.schema.json",
  "title": "Economics Essay Logic Bank v1",
  "type": "object",
  "required": [
    "schemaVersion",
    "essays"
  ],
  "properties": {
    "schemaVersion": {
      "const": 1
    },
    "units": {
      "type": "array",
      "minItems": 5,
      "maxItems": 5,
      "prefixItems": [
        {
          "const": "Types and Sizes of Businesses"
        },
        {
          "const": "Revenue, Costs and Profits"
        },
        {
          "const": "Market Structures and Contestability"
        },
        {
          "const": "Labour Markets"
        },
        {
          "const": "Government Intervention"
        }
      ],
      "items": false
    },
    "essays": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/essay"
      }
    }
  },
  "additionalProperties": false,
  "$defs": {
    "essay": {
      "type": "object",
      "required": [
        "id",
        "unit",
        "topic",
        "essayTitle",
        "question",
        "questionNumber",
        "marks",
        "sections"
      ],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
        },
        "unit": {
          "type": "string",
          "enum": [
            "Types and Sizes of Businesses",
            "Revenue, Costs and Profits",
            "Market Structures and Contestability",
            "Labour Markets",
            "Government Intervention"
          ]
        },
        "topic": {
          "type": "string",
          "minLength": 1
        },
        "essayTitle": {
          "type": "string",
          "minLength": 1
        },
        "question": {
          "type": "string",
          "minLength": 1
        },
        "questionNumber": {
          "type": [
            "string",
            "null"
          ]
        },
        "marks": {
          "type": "integer",
          "enum": [
            14,
            20
          ]
        },
        "sections": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/section"
          }
        },
        "status": {
          "enum": [
            "complete",
            "partial"
          ]
        },
        "contentNote": {
          "type": "string",
          "minLength": 1
        },
        "source": {
          "type": "object",
          "additionalProperties": true
        }
      },
      "additionalProperties": false,
      "allOf": [
        {
          "if": {
            "properties": {
              "status": {
                "const": "partial"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "required": [
              "contentNote"
            ]
          }
        },
        {
          "oneOf": [
            {
              "properties": {
                "unit": {
                  "const": "Types and Sizes of Businesses"
                },
                "topic": {
                  "enum": [
                    "Business Objectives",
                    "Mergers",
                    "Demergers"
                  ]
                }
              }
            },
            {
              "properties": {
                "unit": {
                  "const": "Revenue, Costs and Profits"
                },
                "topic": {
                  "enum": [
                    "Shutdown"
                  ]
                }
              }
            },
            {
              "properties": {
                "unit": {
                  "const": "Market Structures and Contestability"
                },
                "topic": {
                  "enum": [
                    "Market Concentration",
                    "Oligopoly",
                    "Monopoly",
                    "Price and Non-Price Competition"
                  ]
                }
              }
            }
          ]
        }
      ]
    },
    "section": {
      "type": "object",
      "required": [
        "type",
        "point",
        "logic",
        "diagrams"
      ],
      "properties": {
        "type": {
          "type": "string",
          "pattern": "^(KAA|EVA|Weighing)[1-9][0-9]*$"
        },
        "summary": {
          "type": "string",
          "maxLength": 80,
          "description": "Legacy-compatible short section label; required for new imports by import validation."
        },
        "point": {
          "type": "string"
        },
        "logic": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "diagrams": {
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^/diagrams/[a-zA-Z0-9][a-zA-Z0-9._-]*\\.(png|jpg|jpeg|webp|svg)$"
          }
        },
        "missing": {
          "type": "boolean"
        },
        "diagramDetails": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "alt": {
                "type": "string",
                "minLength": 1
              },
              "caption": {
                "type": "string"
              },
              "sourceLocation": {
                "type": "string",
                "minLength": 1
              },
              "sha256": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$"
              }
            },
            "additionalProperties": false
          }
        },
        "matrix": {
          "type": "object",
          "required": [
            "caption",
            "headers",
            "rows"
          ],
          "properties": {
            "caption": {
              "type": "string",
              "minLength": 1
            },
            "headers": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "string"
              }
            },
            "rows": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "array",
                "minItems": 1,
                "items": {
                  "type": "string"
                }
              }
            },
            "sourceLocation": {
              "type": "string",
              "minLength": 1
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "allOf": [
        {
          "if": {
            "properties": {
              "missing": {
                "const": true
              }
            },
            "required": [
              "missing"
            ]
          },
          "then": {
            "properties": {
              "point": {
                "const": ""
              },
              "summary": {
                "const": ""
              },
              "logic": {
                "maxItems": 0
              },
              "diagrams": {
                "maxItems": 0
              }
            }
          },
          "else": {
            "properties": {
              "point": {
                "type": "string",
                "minLength": 1
              },
              "summary": {
                "type": "string",
                "minLength": 1
              },
              "logic": {
                "minItems": 1
              }
            }
          }
        }
      ]
    }
  }
}
```

## 8. 一篇完整 Essay 示例（14 分）

这是结构示例，不要把 example ID 当作用户新增 Essay 重复导入。

```json
{
  "schemaVersion": 1,
  "essays": [
    {
      "id": "example-price-nonprice-strategies",
      "question": "Discuss pricing and non-pricing strategies that e-bike manufacturers might use to increase sales.",
      "marks": 14,
      "questionNumber": "(b)",
      "unit": "Market Structures and Contestability",
      "topic": "Price and Non-Price Competition",
      "essayTitle": "Price and Non-Price Strategies: Effects on Sales",
      "sections": [
        {
          "type": "KAA1",
          "summary": "Lower prices can increase sales",
          "point": "A firm can increase sales by reducing its price.",
          "logic": [
            "A lower price improves affordability and relative price competitiveness",
            "More consumers are willing and able to buy",
            "Some consumers switch from competing products",
            "Quantity demanded rises, increasing units sold"
          ],
          "diagrams": []
        },
        {
          "type": "EVA1",
          "summary": "Impact depends on price elasticity",
          "point": "However, the effectiveness of price cutting depends on price elasticity of demand.",
          "logic": [
            "If demand is price inelastic, a price cut causes a less than proportionate rise in quantity demanded",
            "The increase in units sold may be small",
            "Price cutting may therefore have only a limited effect on sales volume"
          ],
          "diagrams": []
        },
        {
          "type": "KAA2",
          "summary": "Quality differentiation can increase sales",
          "point": "Improving product quality can increase sales through product differentiation.",
          "logic": [
            "Better quality and design meet consumer preferences more closely",
            "The product becomes more differentiated from competing alternatives",
            "Consumers are more likely to choose the firm’s product",
            "Brand loyalty strengthens and close substitutes become less attractive",
            "Demand, the customer base and market share increase"
          ],
          "diagrams": []
        },
        {
          "type": "EVA2",
          "summary": "R&D costs may offset sales gains",
          "point": "However, improving quality may involve high R&D costs that limit the increase in sales.",
          "logic": [
            "Product development requires substantial funding",
            "Production costs rise",
            "The firm may raise prices to protect profit margins",
            "Affordability falls and quantity demanded may decrease",
            "The sales gain from higher quality is partly offset"
          ],
          "diagrams": []
        }
      ]
    }
  ]
}
```

## 9. 多篇 Essay 批量示例（14 分 + 20 分）

同一个 essays 数组中依次放完整对象；每个 ID 独立，图片随包提供。

```json
{
  "schemaVersion": 1,
  "essays": [
    {
      "id": "example-price-nonprice-strategies",
      "question": "Discuss pricing and non-pricing strategies that e-bike manufacturers might use to increase sales.",
      "marks": 14,
      "questionNumber": "(b)",
      "unit": "Market Structures and Contestability",
      "topic": "Price and Non-Price Competition",
      "essayTitle": "Price and Non-Price Strategies: Effects on Sales",
      "sections": [
        {
          "type": "KAA1",
          "summary": "Lower prices can increase sales",
          "point": "A firm can increase sales by reducing its price.",
          "logic": [
            "A lower price improves affordability and relative price competitiveness",
            "More consumers are willing and able to buy",
            "Some consumers switch from competing products",
            "Quantity demanded rises, increasing units sold"
          ],
          "diagrams": []
        },
        {
          "type": "EVA1",
          "summary": "Impact depends on price elasticity",
          "point": "However, the effectiveness of price cutting depends on price elasticity of demand.",
          "logic": [
            "If demand is price inelastic, a price cut causes a less than proportionate rise in quantity demanded",
            "The increase in units sold may be small",
            "Price cutting may therefore have only a limited effect on sales volume"
          ],
          "diagrams": []
        },
        {
          "type": "KAA2",
          "summary": "Quality differentiation can increase sales",
          "point": "Improving product quality can increase sales through product differentiation.",
          "logic": [
            "Better quality and design meet consumer preferences more closely",
            "The product becomes more differentiated from competing alternatives",
            "Consumers are more likely to choose the firm’s product",
            "Brand loyalty strengthens and close substitutes become less attractive",
            "Demand, the customer base and market share increase"
          ],
          "diagrams": []
        },
        {
          "type": "EVA2",
          "summary": "R&D costs may offset sales gains",
          "point": "However, improving quality may involve high R&D costs that limit the increase in sales.",
          "logic": [
            "Product development requires substantial funding",
            "Production costs rise",
            "The firm may raise prices to protect profit margins",
            "Affordability falls and quantity demanded may decrease",
            "The sales gain from higher quality is partly offset"
          ],
          "diagrams": []
        }
      ]
    },
    {
      "id": "example-monopoly-consumers",
      "question": "Evaluate whether such a high market share for one company is in the consumer interest.",
      "marks": 20,
      "questionNumber": "20",
      "unit": "Market Structures and Contestability",
      "topic": "Monopoly",
      "essayTitle": "Monopoly Power: Benefits to Consumers",
      "sections": [
        {
          "type": "KAA1",
          "summary": "Economies of scale may lower prices",
          "point": "A high market share can benefit consumers through lower prices.",
          "logic": [
            "Large sales and output increase the scale of input purchases",
            "Suppliers may offer bulk-buying discounts",
            "Lower input costs per unit reduce LRAC from C1 to C2",
            "The firm can lower its price while maintaining a viable profit margin",
            "If cost savings are passed on, consumers pay less and consumer surplus rises"
          ],
          "diagrams": [
            "/diagrams/monopoly-consumer-benefits-kaa1.jpeg"
          ],
          "diagramDetails": {
            "/diagrams/monopoly-consumer-benefits-kaa1.jpeg": {
              "alt": "Original LRAC diagram: output rises from Q1 to Q2 and average cost falls from C1 to C2.",
              "sourceLocation": "作业Monopoly (20) gpt修改版.docx · word/media/image2.jpeg",
              "sha256": "784b2b23f9e5f3028daa198e7f90b2374c91a6369492286fe68a2254decaa040"
            }
          }
        },
        {
          "type": "EVA1",
          "summary": "Cost savings may raise profits instead",
          "point": "However, a high market share may reduce the incentive to pass cost savings on to consumers.",
          "logic": [
            "Greater market power reduces competitive pressure to cut prices",
            "The firm may keep its price unchanged despite lower LRAC",
            "Cost savings increase the profit margin instead",
            "The gain in consumer welfare is limited"
          ],
          "diagrams": []
        },
        {
          "type": "Weighing1",
          "summary": "Depends on cost-saving pass-through",
          "point": "The significance of the benefit depends on how much of the cost saving is passed on to consumers.",
          "logic": [
            "A high proportion passed on through lower prices produces a larger gain in consumer surplus",
            "A high proportion retained as profit leaves consumers with little benefit",
            "The pass-through of savings therefore matters more than the cost reduction alone"
          ],
          "diagrams": []
        },
        {
          "type": "KAA2",
          "summary": "Supernormal profits can finance R&D",
          "point": "A high market share may benefit consumers through greater investment in product development.",
          "logic": [
            "Strong brand loyalty and fewer close substitutes may make demand relatively price inelastic",
            "Greater market power permits higher prices and supernormal profit",
            "Retained profits provide funds for R&D",
            "Successful R&D improves product quality and meets consumer needs more closely",
            "Consumer utility increases"
          ],
          "diagrams": []
        },
        {
          "type": "EVA2",
          "summary": "Unsuccessful R&D may raise prices",
          "point": "However, unsuccessful R&D may raise costs without improving products.",
          "logic": [
            "Substantial development spending may fail to produce a successful product",
            "Costs rise without a genuine improvement in quality",
            "If these costs are passed on, consumers face higher prices",
            "Consumers pay more without receiving greater utility"
          ],
          "diagrams": []
        },
        {
          "type": "Weighing2",
          "summary": "Depends on successful consumer-focused innovation",
          "point": "Consumer benefit depends more on the nature and success of innovation than on the amount spent on R&D.",
          "logic": [
            "Innovation that meets consumer needs increases utility",
            "High spending without meaningful product improvement offers little benefit",
            "Sustained consumer gains therefore require successful innovation, not simply large R&D budgets"
          ],
          "diagrams": []
        }
      ]
    }
  ]
}
```

## 10. Codex 导入与部署步骤

1. 把本批 diagrams 复制到项目 `diagrams/`，同名图如内容不同需明确属于用户授权修订。
2. 将 Content ChatGPT 的 JSON 保存为本地 batch 文件，先运行 `node scripts/import-essays.mjs /absolute/path/batch.json`，默认只检查，不改题库。
3. 校验通过后加 `--apply`，只追加到正式 `data/essay-bank.json`，原 Economics 字段原样保存。
4. 已有 ID 默认拒绝覆盖；明确修订时使用 `--replace-existing --apply`。
5. 运行 `npm run build`，检查实际四层导航、图片及 Practice。
6. 只提交正式题库、图片和必要维护文件到 GitHub；push 到 main，由 Vercel Git 集成自动部署。
7. 检查最新 Git commit 对应的 Vercel 部署及线上页面。不要只凭 push 成功就宣称自动上线成功。

新增内容通常只改变 `data/essay-bank.json` 和 `diagrams/`，无需修改 HTML、app.js、model.js 或 styles.css。根 units 的顺序只有用户要求调整时才修改。

本项目是无后端静态网站，`npm run build` 生成 dist/；dist/ 是产物，不是第二套可编辑内容源。不需要上传按钮、OCR、数据库、AI API 或运行时外部依赖。
