# 商业潜力选品调研 · 2026-10-29

> 目标：在 644 款存量之上，挑一批**纯本地、免费、有商业潜力**的新工具。
> 方法：全库 id 撞车核查（644 个 id 逐一 grep）→ 竞品搜索验证 → 按三条商业主线聚合。
> 结论：**第一梯队 10 款主推 + 第二梯队 6 款备选**，新依赖仅 jsbarcode 一个。
> 提案已同步挂入 `docs/TOOL_BACKLOG.md` 第十二节；实施后请更新该文件批次记录。

---

## 一、为什么这批"有商业潜力"

站内现有 644 款覆盖面已极广，剩下有价值的空位集中在**"用户愿意付钱解决"的场景**。这批选品沿三条主线：

1. **小微生意闭环线**（个体户/自由职业/外贸 SOHO——互联网上付费意愿最高的人群之一）：
   获客（名片）→ 报价（报价单）→ 成交（商业发票/收条/借条）→ 经营（条形码/标价签/账单分析）。
   站内已有 expense-report、payslip、receipt、leave-note 等单据簇，商业单据恰好缺最关键的报价单与发票。
2. **设备检测矩阵线**（高频复访 + 外设/办公场景）：gpu-detector、screen-test、mouse-test、keyboard-test、network-speed-test 已有 5 件，补上摄像头/麦克风测试与手柄测试即收官，形成"买设备先来这测"的入口心智。
3. **AI 开发者线**（流量红利 + 技术受众）：token-cost、prompt-library、ai-rules-generator 已有，补 RAG 分块预览器卡位"搭知识库"这一 2026 年高频工程动作。

共同卖点：**数据不出浏览器**——对账单、报价、发票、简历这类敏感数据，是相对在线 SaaS 的降维打击。

---

## 二、第一梯队（10 款主推）

| # | 工具 | id（已查零撞车） | 建议分类 | 可行性 | 新依赖 |
|---|---|---|---|---|---|
| 1 | 账单分析器 | bill-analyzer | finance | 中 | 无（jszip/xlsx 已有） |
| 2 | 报价单生成器 | quotation-generator | finance | 高 | 无（jspdf 已有） |
| 3 | 商业发票生成器 | invoice-generator | file | 高 | 无 |
| 4 | 借条生成器 | iou-generator | file | 高 | 无 |
| 5 | 条形码生成器 | barcode-generator | image | 高 | jsbarcode（小） |
| 6 | 标价签生成器 | price-tag-generator | file | 中 | 无（复用 5 的产物） |
| 7 | 名片生成器 | business-card-generator | design | 中 | 无 |
| 8 | 摄像头麦克风测试 | camera-mic-test | dev | 高 | 无 |
| 9 | 游戏手柄测试 | gamepad-tester | dev | 高 | 无 |
| 10 | RAG 分块预览器 | rag-chunk-previewer | dev | 中 | 无 |

### 1. 账单分析器 bill-analyzer ⭐ 旗舰
- **场景**：导出支付宝/微信账单 → 本地解析 → 分类统计、月度收支趋势、Top 商户、退款剔除。
- **竞品结论**：现有方案全是 GitHub Python 脚本（wechat-alipay-merge、bill_classifier、table2firefly 等），需要装环境，普通用户触达不了；在线方案要上传财务数据没人敢用。**浏览器本地解析是真空位**。
- **技术要点**：两边导出均为带说明头部的 CSV（微信 UTF-8、支付宝 GBK——站内编码工具经验现成）；导出 zip 自带打开密码，JSZip 不支持解密，规格须定为"用户自行解压后拖入 CSV"，页面给一步图解指引。
- **联动**：expense-tracker、csv-converter、file-encoding-converter、mojibake-fixer。
- **商业化**：月度复访（每月导一次账单）+ 理财/记账受众；未来可挂 Pro（多年对比、预算规则自定义）。

### 2. 报价单生成器 quotation-generator
- **场景**：行项目+数量单价+税率+大小写总额（联动 rmb-capital-converter）→ 打印/PDF（jspdf 现成），留存公司抬头复用。
- **差异化**：站内单据簇独缺"报价"这一环；在线报价工具多为 SaaS 注册墙。
- **联动**：invoice-generator（成交后一键转发票结构）、expense-report、payslip、receipt。
- **商业化**：销售/外贸/自由职业即付费人群；模板可作未来 Pro 钩子。

### 3. 商业发票生成器 invoice-generator
- **场景**：外贸形式发票（PI/CI）、自由职业 invoice：双语字段、编号规则、汇率栏（联动 currency-converter）、PDF 导出。
- **⚠️ 合规红线**：页面首屏显著标注"**非增值税发票**，仅供商业/外贸形式用途"，不得出现增值税发票票样。守住这条即无风险。
- **联动**：报价单、currency-converter、rmb-capital-converter。

### 4. 借条生成器 iou-generator
- **场景**：出借人/借款人/金额大小写/利率上限提示（LPR 四倍红线提示）/还款期限/逾期条款 → 规范借条打印；与 receipt-generator（收条）姊妹篇。
- **⚠️ 合规**：显著免责声明"模板仅供参考，不构成法律意见"。
- **商业化**：搜索量常年稳定的高频法律邻接需求，引流强。

### 5. 条形码生成器 barcode-generator
- **场景**：EAN-13/UPC-A/Code128/Code39 单个+批量（粘贴一列文本批量出图打包），导出 PNG/SVG。
- **竞品**：在线条码站多带广告墙；站内已有 4 款二维码工具，条形码是同族天然缺口。
- **新依赖**：jsbarcode（~40KB，MIT，输出 SVG/canvas 零网络请求）。
- **联动**：qrcode 家族、标价签（6）、资产标签场景。

### 6. 标价签生成器 price-tag-generator
- **场景**：小商户零售：品名+规格+价格+条码/收款码 → A4 多联排版裁切打印（排版复用 id-card-print-layout 模式）。
- **联动**：条形码（5）、wifi-qrcode/收款码场景。**5+6 组合=线下小商户引流款**。
- **商业化**：小商户是最愿意为打印模板付费的人群，免费版获客后可挂 Pro 模板。

### 7. 名片生成器 business-card-generator
- **场景**：90×54mm 标准名片，canvas 渲染 300dpi + 出血 3mm 标线，正反面，导出 PNG/PDF 送印。
- **联动**：logo-maker、email-signature-generator、favicon-generator 组成"**品牌起步包**"专题（collections 可加一辑）。
- **商业化**：创业者/门店开业刚需，模板付费空间明确。

### 8. 摄像头麦克风测试 camera-mic-test
- **场景**：getUserMedia 本地回显+设备枚举+分辨率/帧率实测+录音波形与回放，全程零上传。
- **竞品结论**：webcamtests/mictests 类站点流量巨大但全是广告墙；干净无广告+隐私是站内品牌天然差异化。腾讯会议/Zoom 前自检是高频刚需。
- **联动**：设备检测矩阵第 6 件（gpu/screen/mouse/keyboard/network-speed）。
- **注意**：需 HTTPS/localhost 才有权限（站点已满足）；权限被拒时的指引文案要写足。

### 9. 游戏手柄测试 gamepad-tester
- **场景**：Gamepad API 枚举手柄，按键/摇杆漂移/十字/扳机行程可视化+震动测试（Chrome）。
- **联动**：mouse-test、keyboard-test——**外设三件套收官**，买手柄验货/查漂移是常青搜索（Switch Pro/DualSense 用户基数大）。
- **零依赖**，纯 Gamepad API。

### 10. RAG 分块预览器 rag-chunk-previewer
- **场景**：粘贴文档 → 选策略（固定长度/递归分隔符/Markdown 标题感知）+ chunk size + overlap → 分块可视化+每块 token 数与重叠高亮 → 导出 JSONL。
- **竞品结论**：该领域只有 chunkviz 这类 demo 级实验品，无成熟独立工具；LangChain RecursiveCharacterTextSplitter 的行为可作为对齐基准。token 估算复用 token-cost-calculator 的口径。
- **联动**：token-cost-calculator、prompt-library、ai-rules-generator——AI 线第 4 件。
- **商业化**：AI 开发者受众+新技术词 SEO 卡位（"rag 分块""chunk splitter"中文结果几乎空白）。

---

## 三、第二梯队（6 款备选）

| 工具 | id | 一句话 | 备注 |
|---|---|---|---|
| 系统提示词构建器 | system-prompt-builder | 角色/上下文/约束/输出格式/少样本区块合成 system prompt | 与 ai-rules-generator（规则文件）、prompt-library（库）差异化=生成器 |
| 体积重运费计算器 | shipping-fee-calculator | 长×宽×高÷抛比系数(5000/6000/12000)+首重续重阶梯多渠道对比 | 货代站点全做成获客表单，独立干净工具少；跨境电商卖家高频 |
| 股权稀释计算器 | cap-table-calculator | 多轮融资推演创始人/期权池稀释比例 | 小众但商业意图极强（创始人/FA） |
| robots.txt 生成器 | robots-txt-generator | 按引擎/路径规则生成并校验 | 站长簇补位（open-graph-validator/json-ld 已有） |
| sitemap.xml 生成器 | sitemap-generator | URL 列表→规范 xml，支持 lastmod/changefreq | 与上款可同批做，凑 SEO 二件套 |
| 甘特图生成器 | gantt-chart-maker | 表格/CSV→甘特 SVG+打印 | 与 kanban/mind-map/flowchart 组轻项目管理簇 |

---

## 四、明确弃选（本轮调研结论）

- **简历生成器 resume-builder**：已有多个免费+隐私+开源竞品（木及简历、Oh My CV、魔方简历），饱和，按"弃选饱和项"惯例不做。
- **发票 OCR 增强、WPS 格式族**：pdf/xlsx 家族 644 款中已深度覆盖，边际收益低。

---

## 五、建议实施批次（第十一批，10 款）

按主题聚合（沿用"主题凑文"打法）：
- **生意单据 3**：quotation-generator + invoice-generator + iou-generator → 配文《自由职业者的单据三件套》
- **小商户零售 2**：barcode-generator + price-tag-generator → 配文《开店必备：条码与标价签》
- **设备检测 2**：camera-mic-test + gamepad-tester → 配文《买前验货：外设检测矩阵》
- **AI 开发 1**：rag-chunk-previewer → 配文《搭知识库前，先把分块调对》
- **个人财务 2**：bill-analyzer + 名片 business-card-generator 归入品牌/财务自由搭配，或拆单发

规格注意（写入 agent 任务书）：
1. invoice-generator 页面首屏"非增值税发票"标注；
2. iou-generator 法律免责声明；
3. bill-analyzer 明确"自行解压 zip 后上传 CSV"流程 + GBK/UTF-8 双编码 + 跳过说明头部行；
4. camera-mic-test 权限拒绝引导 + import.meta.server 守卫（getUserMedia 不在 setup 触发）；
5. jsbarcode 动态 import 仅在用户交互回调内（站内媒体库同款规约）；
6. 全部页面按四段骨架 + useSeoMeta + JSON-LD + addRecentTool，id 均已 grep 零撞车。

---

## 六、主要调研来源

- 支付宝/微信账单分析竞品：[wechat-alipay-merge](https://github.com/Sitoi/wechat-alipay-merge)、[bill_classifier](https://github.com/renzhong/bill_classifier)、[table2firefly](https://github.com/conradsheeran/table2firefly)（均为需自建环境的开源脚本）
- 发票生成器竞争格局：[QuillBill](https://www.quill-bill.com/invoice-generator)、[InvoiceTo.me](https://invoiceto.me)、[Deel 免费发票工具评测](https://www.deel.com/blog/best-free-invoice-generator-for-freelancers)
- 简历赛道饱和证据：[木及简历](https://mujicv.com)、[Oh My CV](https://ohmycv.app)、[魔方简历](https://magicv.art)
- RAG 分块空白证据：[Chunking Strategies – glhov.org](https://www.glukhov.org/rag/retrieval/chunking-strategies-in-rag)、[Document Chunking 实测 – langcopilot](https://langcopilot.com/posts/2025-10-11-document-chunking-for-rag-practical-guide)、[chunkviz（demo 级）](https://chunkviz.up.railway.app)
