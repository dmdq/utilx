# 扩面选品深度调研 · 2026-11-02

> 背景：站点日活约 300 IP，必应已有多词排名，全站 664 款。目标：扩大影响面，挑出下一阶段值得做的纯本地浏览器工具。
> 方法：28 个候选 id 全库零撞车核查 → 8 组市场验证搜索（证件照/劳动补偿/二手房/调音器/PDF提取/Excel公式等）→ 按需求×竞争×可行性分层。
> 结论：**第一梯队 10 款（第十三批建议）+ 第二梯队 10 款（第十四批）+ 备选池 8 款**，全部零新依赖或复用已有依赖（pdfjs-dist 已在库）。
> 提案同步挂入 `docs/TOOL_BACKLOG.md` 第十四节。

---

## 一、从 300 IP 到扩面：本批选品策略

1. **承接已有词根**：Bing 已给排名说明站点有基础权重，新工具挂在已有分类下（finance/file/image/others）能吃到内链传导，优先选与存量工具成簇的（PDF 全家桶再 +1、excel 族再 +1、外设测试簇再 +1）。
2. **隐私是站牌**：证件照、PDF 提取、账单类竞品几乎全是"上传到服务器"或"免费水印+高清收费"，**本地处理+免费+无广告**三连是差异化最锐的刀。
3. **流量款与刚需款混搭**：电子木鱼/反应测试负责拉新与传播，证件照/N+1 补偿/节拍器负责收藏与回访（练琴的人每天打开一次）。
4. **英文词顺手拿**：工具注册表 keywords 惯例已带英文；反应测试（reaction time test）、调音器（online tuner）、节拍器（online metronome）、A/B 样本量（sample size calculator）是全球搜索词，Bing 国际流量可顺手承接。

---

## 二、第一梯队（10 款，第十三批建议）

| # | 工具 | id（零撞车已核） | 分类 | 需求 | 竞争 | 可行性 |
|---|---|---|---|---|---|---|
| 1 | 证件照换底色排版 | id-photo-maker | image | 极高 | 收费制为主 | 中 |
| 2 | PDF 文本提取 | pdf-text-extractor | file | 极高 | 上传制为主 | 高 |
| 3 | 劳动补偿金计算器 | labor-severance-calculator | finance | 高（周期性爆发） | 文章多工具弱 | 高 |
| 4 | 二手房税费计算器 | house-transfer-tax-calculator | finance | 极高 | 强（官方/链家） | 高 |
| 5 | Excel 公式生成器 | excel-formula-builder | file | 极高 | AI 竞品多 | 高 |
| 6 | 化学方程式配平 | chem-equation-balancer | calculate | 高（学生常青） | 广告站 | 高 |
| 7 | 反应速度测试 | reaction-time-test | others | 高 | 广告站 | 高 |
| 8 | 在线节拍器 | online-metronome | others | 高 | 网页版少 | 高 |
| 9 | 吉他调音器 | guitar-tuner | others | 高 | 中等 | 中 |
| 10 | 批量文本生成器 | mail-merge-tool | text | 中高 | 蓝海 | 高 |

### 1. 证件照换底色排版 id-photo-maker ⭐ 本批旗舰
- **需求证据**：什么值得买 2025-11 有《五款免费换底色小程序实测》专文，说明需求大到有人专门写横评；主流模式是"基础换底免费、**高清无水印下载收费几元**"（抠图帮、Clouding AI 等全走这条路）。
- **差异化**：完全免费+本地处理（照片不上传，身份证/考试报名照尤其敏感）+无广告。竞品收费墙就是我们最好的广告。
- **技术要点**：纯色背景替换用"从四角取样的边缘泛洪+色彩距离阈值"（canvas 像素级），红/蓝/白三色目标；**头发丝边缘是诚实短板**，页面明示"适合纯色背景照，复杂发丝建议重拍"；尺寸库（一寸 25×35、二寸 35×49、小一寸、护照/签证常用规格）+六寸相纸排版打印（复用 id-card-print-layout 的 mm 排版经验）。
- **联动**：image-crop / image-resize / id-card-print-layout / image-compress。

### 2. PDF 文本提取 pdf-text-extractor
- **需求证据**：搜索"PDF 提取文字 隐私"的结论——明确主打**本地不上传**的只有 Images Tool 一家，其余（PDF2Go、ChatSlide、白描）全是上传制；合同/论文/标书场景对"上传"天然抵触。
- **技术要点**：pdfjs-dist@6 已在依赖（PDF 转图片用的就是它），getTextContent() 拿文本层零成本；支持页码范围、按页分隔导出 txt/md、无文本层的扫描件诚实提示"需 OCR"（站内 image-ocr 顺手内链）。
- **联动**：站内 PDF 九件套（merge/watermark/compress/sign/页码/解锁/转图/整理/拆合），凑成十全十美。

### 3. 劳动补偿金计算器 labor-severance-calculator
- **需求证据**：搜索"N+1 经济补偿金计算器"，SERP 全是知乎/法大大/搜狐的**文章**，没有一个占位的交互工具——工具真空位，且裁员周期需求爆发。
- **规格要点**：三口径并列（N / N+1 / 2N）+ 规则引擎：工作年限"满 6 个月不满 1 年按 1 年、不满 6 个月按 0.5 个月"；**月工资超当地社平 3 倍按 3 倍封顶且年限最高 12 年**（社平基数做成可编辑常量+城市预设表）；代通知金按"上月工资"口径说明。页面固定免责声明"不构成法律意见，争议请咨询劳动仲裁/律师"。
- **联动**：overtime-pay-calculator（加班费）、annual-leave-calculator（年假折算）、social-insurance-calculator。

### 4. 二手房税费计算器 house-transfer-tax-calculator
- **需求证据与竞争**：需求极大（买房决策刚需）；竞争也强——北京税务局官方计算器、链家、高顿、东方财富都在。**诚实定级：不是蓝海，但盘子大到值得切**。
- **差异化**：无广告无注册（链家工具挂中介触点）、规则讲解透明（每笔税费附计算依据：契税首套 ≤140㎡ 1%/>140㎡ 1.5%、二套同规则 1%/2%；增值税满 2 年免征；个税满五唯一免征，否则 1% 或差额 20%）、全国通用+城市参数留编辑口。
- **规格要点**：政策以 2024 契税新政为基线常量，页面标注"以当地税务/不动产登记中心实收为准"；买卖双方税费分列。
- **联动**：loan-calculator / provident-fund-loan / prepayment-calculator / stamp-duty（如有）。

### 5. Excel 公式生成器 excel-formula-builder（参数化模板版）
- **需求证据**：搜索结果显示 AI 生成公式赛道已热（Merlin、mysheetAI、DeepSeek 玩法、不坑盒子插件）。**不与 AI 正面竞争**，卡位"参数化模板+教学"：
  - 十大高频函数模板（SUMIF/SUMIFS/COUNTIF/COUNTIFS/VLOOKUP/XLOOKUP/INDEX+MATCH/IF 嵌套/TEXT/SUBTOTAL），每个参数一个填空框+一句人话解释；
  - 生成公式的**每个参数带注释版本**（教学场景：看懂为什么这么写）；
  - 目标词是"vlookup 怎么用""sumif 三个条件怎么写"这类学习型长尾（AI 工具不承接"看懂"需求）；
  - 隐私角度：不用把表结构粘给 AI。
- **联动**：excel-table-merge / excel-column-splitter / csv-to-sql / pivot-table。

### 6. 化学方程式配平 chem-equation-balancer
- **场景**：初高中/大学基础化学作业刚需，搜索稳定；现有在线配平站老旧带广告。
- **技术要点**：解析反应物/生成物 → 构建元素矩阵 → 高斯消元求整数解（最小整数比），支持水合/条件标注（↑↓、点燃/加热）；离子方程式模式（电荷平衡列加入矩阵）。这是本批算法趣味最足的一款，纯函数可单测性极好。
- **联动**：periodic-table（元素数据表复用）/ equation-solver / fraction-calculator。

### 7. 反应速度测试 reaction-time-test
- **场景**：humanbenchmark 验证过的全球需求，中文竞品是广告墙小站。 gamers 自测+外设党联动。
- **技术要点**：rAF+performance.now() 精确到 ms；5 次取平均+最佳+分布图；人类基准对照表（≈250ms 平均，电竞级 <180ms）；抢先点击检测（防作弊提示）。
- **联动**：mouse-test / keyboard-test / gamepad-tester / fps-test / typing-test——**外设检测矩阵的第 7 件**。

### 8. 在线节拍器 online-metronome
- **需求证据**：调音器搜索顺带确认——**网页版节拍器比调音器少**（Musicca 一家较全，其余是 App）。乐器的练习场景=每日打开=天然回访流量。
- **技术要点**：WebAudio 精确调度（lookahead scheduler：25ms 定时器+0.1s 前瞻队列，不能 setTimeout 直敲——会漂）；BPM 30-240、拍号 2/3/4/6、每小节首拍重音、音色（木鱼短促音/电子哔声）、视觉摆锤、tap tempo（连点测速）。
- **联动**：与 guitar-tuner 组成"在线音乐练习室"，可开专题。

### 9. 吉他调音器 guitar-tuner
- **需求证据**：网页调音器存在（xiwnn、guitar-tuner.org、tool.lu、Musicca），功能同质化（麦克风检测+偏差显示）。
- **差异化**：无广告+预设多（吉他标准 EADGBE/全音降/开 D、尤克里里 GCEA、贝斯、小提琴 GDAE）+新手教学（每根弦给标准音播放对照"耳朵调音法"）+ cents 偏差表盘。
- **技术要点**：自相关音高检测（Goertzel/YIN 简化，2048 采样窗口），A4=440 可校准 415-460；环境噪声门限提示（低于阈值显示"信号太弱"）。麦克风权限拒绝引导复用 camera-mic-test 的文案体系。
- **风险**：环境嘈杂时检测不稳——页面诚实标注使用条件。

### 10. 批量文本生成器 mail-merge-tool（邮件合并/文本套版）
- **场景蓝海**：行政/HR/教师/微商高频——CSV 名单+模板（"尊敬的{{姓名}}，您的{{课程}}课程于{{时间}}开课"）→ 批量生成通知短信/家长寄语/邀请话术/证书文本，导出 txt/CSV 逐条复制。中文网页工具里几乎空白（Excel 邮件合并对普通用户太难）。
- **技术要点**：CSV 解析（复用 bill-analyzer 的解析经验）+ {{占位符}} 替换引擎 + 缺字段行警告 + 批量结果预览（前 50 条）+ 打包下载。
- **联动**：test-data-generator（假数据源）/ csv-converter / text-replace。

---

## 三、第二梯队（10 款，第十四批建议）

| # | 工具 | id | 一句话 | 要点 |
|---|---|---|---|---|
| 11 | 白噪音发生器 | white-noise-generator | 棕/粉/白噪声+雨声滤波合成，专注定时 | WebAudio 循环缓冲合成（不加载音频文件），雨/风扇用滤波逼近；30/60/90 分钟定时；联动番茄钟/呼吸训练组成"专注套件" |
| 12 | 电子木鱼 | electronic-woodfish | 敲一下+1 功德，WebAudio 木鱼音 | 流量彩蛋款（病毒传播属性），敲击音合成（短促衰减正弦+噪声瞬态）、功德计数 localStorage、敲击粒子动画；成本极低回报潜力高 |
| 13 | FIRE 提前退休计算器 | fire-calculator | 4% 法则：年支出×25=自由数字 | 储蓄率→自由年限曲线、投资收益率敏感性、通胀调整；国内中文工具几乎空白（豆瓣 FIRE 组/知乎人群），创业两笔账的姊妹篇 |
| 14 | 52周存钱计划 | savings-challenge-tracker | 阶梯存钱表+进度追踪+打印 | 小红书"52周存钱法"内容火而工具空白；周金额递增/自定义起点、进度打卡 localStorage、A4 打印表；联动 inflation/bill-analyzer |
| 15 | A/B测试样本量计算器 | ab-sample-size-calculator | 双比例 z 检验功效公式反推样本量 | α/β/MDE 三参数+基线转化率→每组所需样本；反向：输入日流量算实验天数；中文 B 端空白（Evan Miller 垄断英文）；联动 statistics-calculator |
| 16 | 广告投放换算器 | ad-metrics-calculator | CPM/CPC/CPA/CTR/CVR/ROI 互转 | 任填两项推其余+盈亏平衡 CPC/CPA 反算；投放优化岗日常速查；零依赖纯公式 |
| 17 | 中文排版检查器 | chinese-typography-linter | 中英之间加空格/全半角/重复标点检查 | 规则来自《中文文案排版指北》（中英文间空格、重复标点、全角数字混用、省略号规范）；逐条下划线标注+一键修复+忽略清单；编辑/公众号写手小众刚需，市场空白；与 banned-words/xhs-formatter 成簇 |
| 18 | 日志着色查看器 | log-viewer | 粘贴日志→级别着色+过滤+统计 | ERROR/WARN/INFO/DEBUG 正则识别+时间戳解析着色、级别过滤、ERROR 计数与时间分布；开发蓝海（现在大家粘到编辑器里看）；与 nginx-log-analyzer 差异=通用格式 |
| 19 | 可打印日历 | printable-calendar | 月历/年历模板+农历+节气打印 | 复用站内 lunarInfo 1900-2100 与节气数据（lunar-birthday/solar-term 现成）；周一起始可选、今日高亮、备注列；教师/家庭/办公打印场景；与 grid-paper-printer/copybook 成打印簇 |
| 20 | 电子请柬生成器 | invitation-card-maker | 婚礼/满月/乔迁/升学宴请柬图片 | Canvas 模板（5-8 套配色）+时间地点文案编辑→长图下载+短信版文案复制；竞品 SaaS 重（稿定系），免费本地方位；季节性流量（五一/十一婚季） |

---

## 四、备选池（8 款，批次外机动）

| 工具 | id | 一句话 | 保留原因 |
|---|---|---|---|
| 单词卡片打印 | flashcard-printer | Q/A 卡片 A4 双面打印模板 | 教师/家长打印簇延伸 |
| 随机抽题组卷 | random-quiz-picker | 粘贴题库→随机抽 N 题 | 教师高频，与 random 族差异=题库结构 |
| 分子量计算器 | molar-mass-calculator | 化学式→摩尔质量 | 配平器姊妹件，元素数据复用 periodic-table |
| 手机号归属地 | phone-attribution-lookup | 号段→省市运营商 | 需内置 ~500KB 数据包；与 mac-vendor-lookup 同模式 |
| 虚拟钢琴 | virtual-piano | WebAudio 合成键盘弹奏 | 娱乐延伸，与节拍器/调音器凑音乐三件套 |
| 批量重命名 | batch-rename-tool | File System Access API 规则改名 | Chrome 86+ 限定需显著标注；规则预览+撤销 |
| 复利计算器 | compound-interest-calculator | 单利对比/72 法则/定投 | 与 investment-calculator 有重叠风险，需先做差异化定位再上 |
| 经营范围生成器 | business-scope-generator | 注册公司选经营范围模板库 | 静态模板数据工程；代记账 SEO 强但工具位存在 |

---

## 五、明确弃选（本轮调研结论）

| 方向 | 弃选原因 |
|---|---|
| 经期追踪日历 | ovulation-calculator 已覆盖同人群，自耗 |
| 公众号 Markdown 排版 | mdnice/doocs 开源免费且成熟，饱和 |
| 数学函数图像 | Desmos/GeoGebra 免费垄断，体验天花板不可逾越 |
| 语音转文字 | Chrome Web Speech 音频走云端，违背"纯本地"品牌承诺 |
| 中文 OCR（证件/题目识别） | 浏览器端中文识别质量不足，砸招牌 |
| 天气/快递/违章查询 | 依赖外部 API，与本地品牌冲突 |
| 塔罗/运势类 | 内容型+非工具属性，品牌稀释 |

---

## 六、增长配套建议（300 IP → 扩面的杠杆）

1. **专题矩阵**：新工具上线时同步开 3 个 collections——"音乐练习室"（节拍器+调音器+白噪音）、"考试季工具箱"（配平+抽题+默写+卡片）、"求职与裁员应对"（补偿计算+简历相关+个税）。专题页是内链枢纽，能放大新工具收录。
2. **英文关键词**：reaction-time-test / online-metronome / guitar-tuner / ab-sample-size 的 keywords 字段按站内惯例带英文短语，Bing 国际流量是现成的增量。
3. **流量款→刚需款漏斗**：木鱼和反应测试做传播入口（内容号/贴吧可转），页面内链导向证件照/节拍器等回访型工具；回访工具再导向 collections 沉淀。
4. **博客节奏不减**：每批 5 篇推文保持覆盖率 100% 红线（check-blog-coverage 已自动把关）；十三批建议配文《证件照不用花钱：本地换底色指南》《被裁了能拿多少补偿：N/N+1/2N 一图算清》《乐器的第一个装备是浏览器：节拍器+调音器》。
5. **PWA 离线卖点**：节拍器/调音器/白噪音是"想装成 App"的工具，vite-pwa 已就绪，工具页明示"可离线使用"。

---

## 七、实施批次建议

- **第十三批（10 款）**：第一梯队全量。无新依赖（pdfjs-dist 复用；证件照/调音器纯 canvas/WebAudio）。按主题配 5 篇推文。
- **第十四批（10 款）**：第二梯队全量。同样零新依赖。
- 两批完成后全站 684 款，备选池 8 款机动。

## 八、主要调研来源

- 证件照赛道与收费模式：[什么值得买·五款免费换底色小程序实测](https://post.smzdm.com/p/aogg5zkm)、[抠图帮](https://www.koutubang.com/jiaocheng/99.html)、[Clouding AI](https://www.clouding-ai.com/idphoto/make)
- 劳动补偿 SERP 文章化证据：[知乎·N/N+1/2N 解读](https://zhuanlan.zhihu.com/p/1897640023366546971)、[法大大·补偿标准](https://www.fadada.com/article/detail-14364)、[知乎·裁员赔偿指南](https://zhuanlan.zhihu.com/p/703383120)
- 二手房税费竞争格局：[北京税务局官方计算器](https://etax.beijing.chinatax.gov.cn/WebGt3GrZlf/views/ssxgj/skjsq.html)、[链家](https://bj.lianjia.com/tool_595.html)、[高顿](https://tool.gaodun.com/ershoufangjiaoyi.html)、[东方财富](https://data.eastmoney.com/money/calc/TaxHouse.html)、[ip138](https://www.ip138.com/fangdai/shuifei.htm)
- 调音器/节拍器网页版供给：[xiwnn](https://www.xiwnn.com/tiaoyin/guitar)、[guitar-tuner.org](https://guitar-tuner.org/zh/acoustic-guitar-tuning)、[Musicca](https://www.musicca.com/zh/tuner)、[tool.lu](https://tool.lu/guitartuner)
- PDF 提取本地化稀缺证据：[Images Tool（唯一主打本地的竞品）](https://pdf.imagestool.com/zh-CN/extract-text)、[白描](https://pdf.baimiaoapp.com)
- Excel 公式 AI 赛道：[Merlin](https://www.getmerlin.in/zh-CN/ai-tools/excel-formula-generator)、[AI 写公式实测（smzdm）](https://post.smzdm.com/p/am9mp5oz)、[M365 Copilot 横评](https://post.smzdm.com/p/az842035)
