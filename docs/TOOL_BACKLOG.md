# 可追加工具总后备清单（Backlog）· 2026-10-13 整理

> 汇总四批调研的全部备选池（去重、剔除已实施项），并补充 7 款未入池新提案。
> 每项一句话场景；"可行性"栏：高=纯公式/文本/查表，中=Canvas/WebAudio/解析器，重=需 ffmpeg.wasm 或大数据文件。
> 下一次选品直接从本清单点菜；实施后请从本清单划掉对应项并更新批次记录。

---

## 一、教育 / 教师（6）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 古诗文默写挖空自测 | 粘贴篇目按规则挖空自测判分（随机/等距/实词三种策略） | 高 |
| 英语听写挖空生成器 | 粘贴单词表或课文→挖空→A4 打印听写稿 | 高 |
| 课程表制作器 | 填课程格子→选配色→导出课表壁纸图 | 高 |
| 班级座位表生成器 | 导入名单→教室网格拖拽/随机排→打印 | 中 |
| 演讲比赛计分器 | 录各评委分，去最高最低求均、实时排名 | 高 |
| 作文稿纸方格估算 | 字数统计扩展稿纸模式：300/400 格折算页数与达标提示 | 高 |

## 二、图片 / 社交（6）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 带壳截图生成器 | 截图套设备边框（机型 SVG 模板），发版本公告/商店图 | 中 |
| OG 分享卡片生成器 | 1200×630 社交分享图本地合成（复用站内渐变/图案能力） | 中 |
| 情侣头像切图 | 一张合照切两半，实时预览拼接效果（左右/上下/对角） | 高 |
| 拍立得排版 | 多张照片排成拍立得墙（白框+投影+手写字），导出长图 | 中 |
| 时间地点水印相机 | 照片加时间地点水印（手动填地点不定位，可读 EXIF 拍摄时间） | 中 |
| 壁纸多机型适配 | 一张图出 iPhone/安卓/平板全套壁纸，焦点裁剪+模糊补边 | 中 |

## 三、生活（8）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 咖啡因摄入计算器 | 内置常见饮品咖啡因表+按半衰期推算建议停饮时间 | 高 |
| 家宴点菜计算器 | 人数→凉热汤点配比与主食克重，宴请不尴尬 | 高 |
| 烘焙原料替换对照 | 泡打粉↔小苏打、黄油↔植物油等替换关系与风味影响 | 高 |
| 腌渍配比计算 | 按食材重量算盐糖醋克数（川泡/韩式/日式浅渍/糖醋） | 高 |
| 家务轮值排班生成器 | 成员×任务×频率自动排周期表，支持打印 | 高 |
| 旅行清单生成器 | 海岛/雪山/城市模板×天数生成勾选清单 | 高 |
| 护照有效期提醒 | 按目的地规则判定 3/6 个月有效期风险 | 高 |
| 露营装备清单生成器 | 按场景（亲子/过夜/冬季）生成勾选清单 | 高 |

## 四、职场 / 财务（4）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 带薪年假折算器 | 入/离职日期+工龄→年假天数折算与未休补偿 | 高 |
| 阶梯提成计算器 | 分段区间+全额/超额累进两种模式逐段明细 | 高 |
| 接单报价换算器 | 月薪↔时薪↔日薪↔项目价，含 1.3-1.5 隐性成本系数 | 高 |
| 礼金往来参考表 | 地区×关系×场合金额参考+按对方曾随推回礼 | 高 |

## 五、开发 / 技术（9）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 雪花 ID 解码器 | 位运算拆时间戳/机器号，多 epoch 可选 | 高 |
| Nginx 访问日志速析 | 粘 access.log 出状态码分布/Top IP/URL | 中 |
| ANSI 转义码预览 | 终端颜色码渲染预览+转 HTML，附 256 色表 | 高 |
| Patch 在线应用 | diff 库本地应用 .patch，容错 fuzz 与失败报告 | 中 |
| SSH Config 生成器 | 多主机+跳板 ProxyJump 生成 ~/.ssh/config | 高 |
| GitHub Actions 生成器 | 选语言/触发器/缓存→workflow yml | 高 |
| ESLint 9 配置生成器 | flat config + .editorconfig + husky 组合 | 高 |
| DDL 转 ER 图 | DDL→mermaid erDiagram 渲染导出（与手绘流程图差异化） | 中 |
| LaTeX 公式渲染成图 | KaTeX 本地渲染导出（LaTeXLive 供给强，作补位） | 高 |

## 六、AI 应用（3）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 大模型 API 价格对比 | 内置静态价目表按输入/输出/上下文排序（注明更新日期） | 高 |
| AI 编程规则文件生成器 | 勾选技术栈→.cursorrules/CLAUDE.md/AGENTS.md 本地合成 | 高 |
| Prompt 逐字对比 | 字符级 LCS 高亮+token/行数增减统计（与文本对比需差异化） | 高 |

## 七、媒体（5）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 视频抽帧工具 | 按间隔/数量批量截帧导出 PNG 打包（挑封面/取素材） | 中 |
| 人声消除（简易） | L-R 相位抵消去中置人声，效果有限需标注 | 中 |
| 视频压缩 | ffmpeg.wasm 或 MediaRecorder 重编码（重） | 重 |
| MP4 转 MP3 | ffmpeg.wasm 抽音频流（重） | 重 |
| HEIC 转 JPG | libheif.wasm/heic2any（iPhone 照片转通用格式） | 中 |

## 八、办公 / 运营（5）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 差评回复模板生成器 | 选评价类型+品类+补偿要素→拼接可复制话术 | 高 |
| 封面瀑布流预览 | 上传封面→模拟抖音三列/B站卡片信息流观感 | 中 |
| 周报结构生成器 | 勾选本周要点→结构化周报模板输出 | 高 |
| 字帖生成器 | 田字格/米字格/描红字帖打印（拼音注音差异化） | 中 |
| LED 滚动字幕 | 全屏 CSS 动画，演唱会应援/摊位招牌/接机牌 | 高 |

## 九、游戏（2）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 跑团骰子集 | d4-d100 组合+修正值+COO 检定等级判定（与普通骰子差异化） | 高 |
| 狼人杀法官助手 | 板子库+夜晚/发言分段倒计时+流程提示音 | 高 |

## 十、数据工程（1）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 成语词典/接龙 | 需内置词库数据（约 1-2MB JSON，可精简为高频 5000 条） | 中（词库工程） |

---

## 十一、新提案（本轮补充，未入过池，7 款）

| 工具 | 场景 | 可行性 |
|---|---|---|
| 键盘按键测试 | 逐键点击检测卡键/冲突/无冲，外设党常青小工具 | 高 |
| 呼吸训练引导器 | 4-7-8 呼吸法/盒式呼吸动画引导+时长设置（放松场景） | 高 |
| 可打印网格纸生成器 | 方格/点阵/五线谱/康奈尔笔记纸按规格生成打印 | 高 |
| 婚礼座位安排器 | 宾客名单按关系分组→桌位分配+冲突提示 | 中 |
| 收条/收据生成器 | 收到款项明细→规范收条打印（与报销单姊妹场景） | 高 |
| 骑行配速换算表 | 速度/档位/踏频/距离时间互算（运动细分补位） | 高 |
| 农历生日提醒计算器 | 阳历生日↔农历生日互查+今年对应公历日期（联动站内农历转换） | 高 |

## 十二、商业潜力提案（2026-10-29，主推 10 款已全部落地=第十一批，详报告 docs/TOOL_COMMERCIAL_RESEARCH_2026-10-29.md）

| 工具 | id（零撞车已核） | 一句话 | 可行性 |
|---|---|---|---|
| 账单分析器 | bill-analyzer | 支付宝/微信导出 CSV 本地解析分类统计（自行解压 zip 后上传；竞品全是 Python 脚本） | 中 |
| 报价单生成器 | quotation-generator | 行项目+税率+大小写总额→打印/PDF，单据簇补最关键一环 | 高 |
| 商业发票生成器 | invoice-generator | 外贸 PI/CI 形式发票双语 PDF；**须标注"非增值税发票"** | 高 |
| 借条生成器 | iou-generator | 规范借条要素+利率红线提示+打印；与收条姊妹，须法律免责声明 | 高 |
| 条形码生成器 | barcode-generator | EAN-13/UPC/Code128 单个+批量，新依赖 jsbarcode | 高 |
| 标价签生成器 | price-tag-generator | 品名价格条码→A4 多联裁切打印（小商户引流款） | 中 |
| 名片生成器 | business-card-generator | 90×54mm 300dpi+出血正反面；与 logo/邮件签名组品牌起步包 | 中 |
| 摄像头麦克风测试 | camera-mic-test | getUserMedia 本地回显+分辨率帧率+录音回放，会议前刚需 | 高 |
| 游戏手柄测试 | gamepad-tester | Gamepad API 按键/摇杆漂移/震动，外设三件套收官 | 高 |
| RAG 分块预览器 | rag-chunk-previewer | 固定/递归/Markdown 感知分块+overlap+token 统计，导出 JSONL | 中 |

备选 6：system-prompt-builder / shipping-fee-calculator / cap-table-calculator / robots-txt-generator / sitemap-generator / gantt-chart-maker。弃选：resume-builder（木及简历/OhMyCV/魔方简历等免费隐私竞品已饱和）。

---

## 十三、第十二批提案（2026-10-31，备选池升级+4 新增，共 10 款，全库零撞车已核）

| 工具 | id | 分类 | 来源 | 主题分组 |
|---|---|---|---|---|
| robots.txt 生成器 | robots-txt-generator | dev | 备选池 | 站长 SEO 三件套 |
| sitemap.xml 生成器 | sitemap-generator | dev | 备选池 | 站长 SEO 三件套 |
| Meta 标签生成器 | meta-tags-generator | dev | 新增 | 站长 SEO 三件套 |
| system prompt 构建器 | system-prompt-builder | dev | 备选池 | AI 提示词工程 |
| 股权稀释计算器 | cap-table-calculator | finance | 备选池 | 创业两笔账 |
| 现金跑道计算器 | burn-rate-calculator | finance | 新增 | 创业两笔账 |
| 增值税含税换算 | vat-calculator | finance | 新增 | 生意数字账 |
| 体积重运费计算器 | shipping-fee-calculator | calculate | 备选池 | 生意数字账 |
| 甘特图生成器 | gantt-chart-maker | others | 备选池 | 职场时间账 |
| 会议成本计算器 | meeting-cost-calculator | others | 新增 | 职场时间账 |

> 全部零新依赖（纯 JS/文本/SVG）。sortOrder 接位：dev 2420-2450 / finance 2130-2150 / calculate 1820 / others 1930-1940。新图标白名单：Bot/ListTree/Tags/GanttChart/Ship（lucide 导出已验证）。配文 5 篇：seo-meta-toolkit / startup-equity-and-runway / system-prompt-anatomy / freight-volumetric-weight-guide / meeting-cost-gantt-schedule。

---

## 十四、扩面选品提案（2026-11-02，28 款，全库零撞车已核，详报告 docs/TOOL_MARKET_RESEARCH_2026-11-02.md）

### 第一梯队（第十三批建议，10）

| 工具 | id | 分类 | 一句话 | 可行性 |
|---|---|---|---|---|
| 证件照换底色排版 | id-photo-maker | image | 纯色底替换+尺寸库+六寸排版；竞品全收费，本地免费是差异位 | 中（发丝边缘诚实标注） |
| PDF 文本提取 | pdf-text-extractor | file | pdfjs-dist 已在库零成本；主打"本地上传竞品"差异 | 高 |
| 劳动补偿金计算器 | labor-severance-calculator | finance | N/N+1/2N+社平3倍封顶+12年封顶；SERP 全文章无工具 | 高 |
| 二手房税费计算器 | house-transfer-tax-calculator | finance | 契税/增值税/个税满五唯一规则引擎；竞争强但盘子大 | 高 |
| Excel 公式生成器 | excel-formula-builder | file | 参数化模板+教学注释，不与 AI 正面打，卡"看懂"长尾 | 高 |
| 化学方程式配平 | chem-equation-balancer | calculate | 元素矩阵+整数解；学生常青 | 高 |
| 反应速度测试 | reaction-time-test | others | 5次均值+人类基准；外设矩阵第 7 件 | 高 |
| 在线节拍器 | online-metronome | others | WebAudio lookahead 调度+tap tempo；网页版供给少 | 高 |
| 吉他调音器 | guitar-tuner | others | 自相关音高检测+多乐器预设+教学 | 中（噪音环境） |
| 批量文本生成器 | mail-merge-tool | text | CSV+{{占位符}}批量套版；办公蓝海 | 高 |

### 第二梯队（第十四批建议，10）

white-noise-generator（白噪音合成）/ electronic-woodfish（功德计数流量款）/ fire-calculator（4%法则）/ savings-challenge-tracker（52周存钱）/ ab-sample-size-calculator（双比例z检验功效）/ ad-metrics-calculator（CPM/CPC/CPA 互转）/ chinese-typography-linter（中英空格等指北规则）/ log-viewer（级别着色过滤）/ printable-calendar（农历节气打印，复用 lunarInfo）/ invitation-card-maker（请柬长图）。

### 备选池（8）

flashcard-printer / random-quiz-picker / molar-mass-calculator / phone-attribution-lookup（需数据包）/ virtual-piano / batch-rename-tool（FSA，Chrome 限定）/ compound-interest-calculator（先与 investment 差异化）/ business-scope-generator（模板库工程）。

弃选：经期追踪（ovulation 已覆盖）/ 公众号排版（mdnice 饱和）/ 函数图像（Desmos 垄断）/ 语音转文字（Web Speech 走云端违本地品牌）/ 中文 OCR（质量不足）/ 天气快递（外部 API）。

---

## 十五、第三轮市场调研提案（2026-11-03，32 新 + 池 8 = 40 款路线图，零撞车已核，详报告 docs/TOOL_MARKET_RESEARCH_BATCH15_2026-11-03.md）

### 第一梯队（批十五，12）

| 工具 | id | 分类 | 一句话 | 可行性 |
|---|---|---|---|---|
| 租房还是买房计算器 | rent-vs-buy-calculator | finance | **简体中文真空**；租售比 1:200-300+全成本模型 | 高 |
| 生育津贴计算器 | maternity-allowance-calculator | finance | 单位月均缴费工资÷30×产假；各省奖励假预设表 | 高 |
| 延迟退休年龄计算器 | retirement-age-calculator | finance | 2024 人大决定对照表+弹性提前/延迟+最低缴费年限 | 高 |
| 口算题卡生成器 | math-worksheet-printer | others | 家长每日打印；竖式/带余数/求算数项/答案页 | 高 |
| 数独生成打印器 | sudoku-printer | others | 4 难度+唯一解校验+答案页 | 中 |
| 1RM 力量计算器 | one-rep-max-calculator | health | Epley/Brzycki 多公式+百分比训练表 | 高 |
| HIIT 间歇计时器 | interval-timer | health | 备战/组间/循环+WebAudio 提示+全屏大字 | 高 |
| 盈亏平衡计算器 | break-even-calculator | finance | 保本量额+安全边际 | 高 |
| chmod 权限计算器 | chmod-calculator | dev | 经典款 rwx 勾选 | 高 |
| curl 命令构建器 | curl-command-builder | dev | 表单→多平台 curl（与 curl-to-code 反向） | 高 |
| 关键词密度检查器 | keyword-density-checker | text | 词频 TopN+双字词+密度带 | 高 |
| 海报生成器 | poster-generator | design | 促销/招聘/课程 Canvas 模板（邀请函模式复用） | 中 |

### 第二梯队（批十六，12）

pricing-calculator（定价三模式）/ ltv-cac-calculator（健康线 3:1）/ json-to-go-struct / json-to-pydantic / editorconfig-generator / prettier-config-generator / baby-feed-tracker（喂养计时 localStorage）/ quit-smoking-calculator（戒烟账本）/ mood-tracker（情绪曲线）/ chord-chart-viewer（和弦指法 SVG）/ ear-training-trainer（音程听辨）/ shoe-size-converter（鞋码互转）。

### 第三梯队（批十七/机动，8）

video-trimmer（重）/ audio-merger / audio-speed-changer / daily-routine-printer / eye-rest-timer（20-20-20）/ plant-watering-tracker / zodiac-lookup / feels-like-temperature-calculator（体感温度）。

### 原备选池并入（8，机动）

flashcard-printer / random-quiz-picker / molar-mass-calculator / phone-attribution-lookup / virtual-piano / batch-rename-tool / compound-interest-calculator / business-scope-generator。

弃选：股价 K 线（API）/车牌估价（数据垄断）/电子签与合同（合规）/在职收入证明（伪造风险）/儿童 AI 绘本（云端 AI）/菜谱内容型/域名估价（数据源不稳）。

---

## 十六、职业画像交叉分析提案（2026-11-04，38 款三梯队，全库零撞车已核，详报告 docs/TOOL_PERSONA_RESEARCH_2026-11-04.md）

> 换视角：从词根驱动改为"职业画像找空白"。交叉矩阵结论：**程序员/设计师/学生/教师/办公/财务/宝妈/自媒体画像已饱和不补**；主战场=蓝领技术工（电工/机修/建筑）+专业技术岗（音频/摄影/实验室/质检）+爱好者经济（水族/手工/模型/调酒）。

### 第一梯队（第十九批，12）

voltage-drop-calculator 电压降 / cable-ampacity-lookup 载流量 / ohms-law-calculator 欧姆定律 / resistor-color-code 电阻色环 / depth-of-field-calculator 景深超焦距（**验证：中文交互供给≈0**）/ audio-frequency-calculator 频率波长 / room-reverb-calculator RT60 混响 / rcf-calculator 离心力换算 / serial-dilution-calculator 梯度稀释 / rebar-weight-calculator 钢筋米重 / ac-btu-calculator 空调匹数 / thread-reference-table 螺纹速查（**验证：电压降类"概念有工具无"**）

### 第二梯队（第二十批，12）

battery-pack-calculator 电池组 / capacitor-code-reader 电容标号 / belt-length-calculator 皮带长 / tire-size-calculator 轮胎对比 / aql-sampling-calculator AQL 抽样（**验证：仅 QIMA/HQTS 验货公司附带**）/ eoq-calculator EOQ / reorder-point-calculator 安全库存 / moon-phase-calculator 月相 / aquarium-calculator 鱼缸水体 / cocktail-calculator 鸡尾酒 / alcohol-dilution-calculator 降度勾兑 / recipe-cost-calculator 菜品成本卡

### 第三梯队（第二十一批/机动，14）

concrete-mix-calculator / room-volume-calculator / pesticide-dilution-calculator / gas-ppm-calculator / plywood-cut-planner / lumber-calculator / cross-stitch-calculator / knitting-yarn-calculator / model-scale-calculator / print-cost-calculator / truck-loading-calculator / print-resolution-calculator / nd-filter-calculator / torque-unit-converter

备选：iv-drip-calculator（医疗强免责）/ audio-bitrate-calculator / crossover-calculator / 星空 500 法则 / rhyme-finder。不补画像：程序员/设计师/学生/教师/办公/财务/宝妈/自媒体（存量饱和）；弃：军警（涉敏）/医生处方（合规）/快递面单（API）。

---

## 十七、画像底账与覆盖度审计体系（2026-11-04 建成，选品方法论升级）

> 背景：724 款前三轮靠"调研+感觉"点状积累，画像间覆盖失衡（程序员 67 款 vs 电工曾为 0）。本轮建成**机器可读的职业画像×任务×工具底账**，选品从"问 AI"升级为"查矩阵断档"。

### 组成

- 数据底账：`src/data/personas.js` —— **29 个职业画像**（按《职业分类大典》大类骨架×工具消费力修正）× **238 条核心任务**（Job-to-be-Done 口径）× 工具 id 映射；
- 审计脚本：`npm run persona-audit` → 自动校验 id、输出各画像覆盖率、断档任务清单，报告落 `docs/PERSONA_AUDIT.md`（每次覆盖更新）。

### 首轮审计结论（762 款时点）

- 总覆盖率 **94%**（224/238 任务）；关联工具 494 款，通用件 268 款未绑定画像（正常）；
- **饱和画像 23 个（100%）**：程序员 67 款、设计师 50、办公 43、运维 41、健身 31、安全 36、自媒体 24、电商 24、写作 26……均不再主动加工具；
- **最弱画像与断档 14 条（第二十二批候选池）**：机修 50%（公差配合/齿轮模数/轴承对照/硬度换算 4 条）、电工 70%（三相功率因数/星三角接触器/导线重量桥架 3 条）、农户 71%（肥料养分/播种株距 2 条）、法律个人 75%（诉讼时效/诉讼费 2 条）、实验室 78%（缓冲液 pH/细胞计数 2 条）、游戏 86%（灵敏度 eDPI 换算 1 条）。

### 使用规则（写进 PERSONA_AUDIT.md 头部）

1. 每批上线先挂 personas.js 任务、跑审计刷新报告；2. 新需求加 tools:[] 任务自动进断档池；3. 覆盖率 ≥90% 画像跳过；4. 268 款通用件不强制绑定。**后续机会：personas.js 可直接驱动"按职业找工具"前端页面（数据已就绪）。**


---

## 十八、第二十二批：断档清零批次（2026-11-04 调研，2026-11-05 全部落地，全站 777 款）

> 详 docs/TOOL_BATCH22_RESEARCH_2026-11-04.md。画像审计断档 14 条采纳 13 + 小尾巴 2 = **15 款**，三梯队，预估零新依赖。竞争验证 9 词（cn.bing 实抓）：公差配合/功率因数补偿/缓冲液 pH/码率/星空 500=中文真空或被垃圾站语义劫持；硬度换算=仅 fuwa.org 一家工具；诉讼费=官方 4 席+独立站 5 席可竞争（差异化=组合计算）。**弃选**：eDPI（psamethod.cn/mousesensitivity.cn 等中英饱和）、押韵（押韵大师/tetiku/yayunci 84 万语料站林立）、输液滴速（第四轮已弃）。

### 第一梯队（蓝领收官 9：机修 50%→100%、电工 70%→100%、农户 71%→100%）
tolerance-fit-lookup（公差配合速查 GB/T 1800）· gear-module-calculator（齿轮模数/径节换算）· bearing-lookup（轴承型号对照+内外径反查）· hardness-converter（硬度换算 GB/T 1172 插值）· motor-power-factor（三相功率因数补偿 kvar）· star-delta-starter（星三角启动电流与接触器选型）· cable-weight-tray（导线重量+桥架填充率≤40%）· fertilizer-calculator（肥料折纯与亩用量）· seeding-rate-calculator（播种量/株距行距）

### 第二梯队（专业岗 4：法律 75%→100%、实验室 78%→100%）
statute-limitations（诉讼时效 民法典188条+特别时效）· court-fee-calculator（诉讼费组合计算：受理费8档累退+保全+执行+简易减半，锚点已验算 10万→2300、500万→46800）· buffer-ph-calculator（Henderson-Hasselbalch，Tris/磷酸盐/醋酸/碳酸盐母液+温度修正）· cell-count-calculator（血球计数板×稀释×10⁴+活率+接种密度）

### 第三梯队（长尾 2）
bitrate-calculator（视频码率/文件大小+OBS 推流档）· star-exposure-rule（星空 500/600/NPF 法则快门，内链月相工具）

### 落地备注
- 上线后跑 persona-audit：预期总覆盖 94%→99%，仅剩游戏画像 1 条断档（主动弃选），23 画像全饱和。
- collections 复用既有「车间速查」「电工工具箱」追加收官款，不新建专题。
- 图标复用 253 池为主，可能补 Gem/Rows3/Sprout。
- 查表类规格（公差/硬度/轴承/诉讼费）先自核标准再写任务书（AQL 锚点教训）。

---

## 十九、第二十三批：聚合反推法（2026-11-05 调研并落地，全站 780 款）

> 详 docs/TOOL_BATCH23_RESEARCH_2026-11-05.md。新方法：**经典 idea 全清单 × 注册表碰撞检测**（50 个高频 idea 中 28 个已有——重复造轮子是最大浪费）+ Bing 验证。主推 3 款全部落地：legal-doc-generator（法律文书 5 模板，「租房合同生成器」房源劫持真空）、official-document-generator（GB/T 9704 红头公文，语义劫持真空）、seal-maker-online（印章 Canvas 透明 PNG，8 家小站无垄断）。备选留池：derivative-calculator（MathDF/ToolV 两家成熟竞品）、五笔反查（码表重）。弃选重申：语音转文字/OCR/手写/植物辨识（云端或视觉模型违纯本地）、简历（饱和）。**本轮内容层并行**：RelatedTools 职业推荐位（组件级 777 页生效）、collections 16→21（维权/健康/PDF/电商/音频）、wiki 词条 20→40（新增工程/法律/健康三分类）。

## 二十、第二十四批：电子元器件行业线（2026-11-05 调研并落地，全站 792 款）

> 详 docs/TOOL_ELECTRONICS_RESEARCH_2026-11-05.md。背景：商业合作方经营元器件销售（电容/传感器/IC/PCB）+ IC 测试代工，客户=工程师+维修人员。31 个候选碰撞检测零撞车。全部零新依赖。

**第一批 12 款（真空优先）**：signal-loop-converter（4-20mA/0-10V/PLC 数字量换算，中文交互真空）/ motor-capacitor-sizer（单相电机启动/运转电容，维修+电容导流）/ heatsink-calculator（功率器件散热，真空）/ ntc-thermistor-calculator（B 值+Steinhart-Hart 双模型）/ rtd-thermocouple-lookup（PT100 CVD+K 型 NIST 分度）/ electrolytic-cap-life（10℃ 法则+纹波注记）/ inductor-code-reader（解码三件套收官）/ ic-marking-decoder（丝印解读教学型：date code YYWW+前缀厂商线索，不做全量反查——芯查查数据库垄断）/ eseries-resistor-finder（E24/E96 最近值+两电阻串并联组合替代，独家功能）/ dppm-yield-calculator（DPPM+滚动良率+置信上限，IC 测试线）/ crystal-load-calculator / i2c-pullup-calculator（TI SLVA689）。

**第二批（已于 2026-11-05 完成竞争验证并重组为第二十五批 12 款，详 docs/TOOL_BATCH25_RESEARCH_2026-11-05.md；✅ 2026-11-06 全部落地，全站 804 款，见批次记录）**：grr-msa-calculator（在线交互中文零——搜索引擎都提示搜英文）/ cpk-process-capability / mtbf-fit-reliability（品牌专属垄断、通用换算无）/ opamp-gain-calculator（简体 Web 真空）/ buck-inductor-calculator（MPS/Coilcraft/TDK 品牌选型器错位：公式教学+纹波率）/ pcb-trace-width-calculator（IPC-2221+过孔）/ copper-thickness-converter（铜厚档+基铜成品铜+AWG）/ tl431-feedback-calculator（三芯片合并，吸收分压场景）/ rc-time-constant（曲线 SVG）/ **fuse-selector（新发现：保险丝选型厂商全是指南无计算器）** / **logic-ic-truth-table（新发现升格：74/4000 系列零交互工具——落地 39 型号）** / timer-555-calculator（红海差异化三板斧：SVG 电路重绘+反向求解+E12 吸附）。

**弃选 4（本轮验证后定论）**：lc-resonance、impedance-reactance（各 6 家饱和）、voltage-divider（3+ 家并入 TL431）、adc-resolution（NTC 页模式三已实质覆盖）。

**保池 3**：tvs-selector（TVS 四条件校验器，应用笔记多交互无）/ transformer-rewind（理想换算 5 家饱和但重绕特化无工具：每伏匝数 45/截面积+数原匝反推）/ uart-baud-error。

**原弃选维持**：丝印全量反查（数据库型）、datasheet/BOM 比价（数据库型）、电路仿真/示波器（工程量或精度不可达）、RF 史密斯圆图（过窄）。

**配套**：personas 新增 hardware-engineer + electronics-repairer 两画像（客户群一比一映射，当前底账缺位）；collections 新增电子工程师设计台/传感器信号链/IC 测试质量台 3 专题+电子维修工作台 4→8 扩容；wiki 8 词条；推文 5 篇。导流形态（合作伙伴位 vs 结果区选型建议）待用户拍板，先上线积累收录再挂位。

## 二十一、第二十六批：51 款大批次（2026-11-06 调研并落地，全站 855 款）

> 详 docs/TOOL_BATCH26_RESEARCH_2026-11-06.md。110 idea 碰撞检测 + 6 项 WebSearch 抽查，九条线 51 款全部落地：电子保护驱动 6 + 无源数字 7 + 射频 5 + 离网电源 3 + 汽车 3 + 机械 7 + 建筑庭院 5 + 影音 5 + 生活实验 5 + 单位换算 6（capacitor-energy 归无源组）。弃选 8：楼梯踏步（5+ 家饱和）、等效焦距（4 家）、油耗/攻丝底孔/咖啡/HTTP 状态码/DNS 记录/年龄（站内已有）。新专题 car-owner-kit（车主随车速查）。wiki +6（TVS/去耦/SWR/螺栓等级/砂纸目数/溶液浓度）。详见批次记录 2026-11-06 条。

## 二十二、第二十七批：质量计量+单位收官+打印教育+行业新画像（2026-11-06 调研并落地，全站 873 款）

> 详 docs/TOOL_BATCH27_RESEARCH_2026-11-06.md。方法：画像断档法榨干（31 画像 100%，仅剩已弃 eDPI）→ 53 idea 碰撞检测 33 空白 → 5 误报复核 → WebSearch 12 组抽查。三梯队 18 款全部落地：**质量计量 5**（测量不确定度[真空]/8D 报告[中文交互真空]/PFMEA[RPN+AP 双模式，AP 表 5 源交叉验证]/有效数字修约 GB 8170 BigInt 定点/西格玛水平全向换算）+ **单位收官+打印教育 8**（温度/速度/数据存储/角度四换算 + 竖式计算器/英语四线格字帖/认识时钟/人民币练习）+ **行业新画像+嵌入式 5**（染膏双氧奶[新画像美发师]/钣金展开/水产塘口用药/CAN 位定时/步进脉冲）。保池 11：Q 格式/锂电充电/陶艺收缩/缝纫估料/电镀时间/焊缝强度/粘度/转速/应用题/视力表[医疗边界待拍板]/离职交接。弃选定论 5：隐形眼镜（6 家）、配速（7 家）、轮毂 ET（5 家）、时差（7+ 家）、LUFS（测量类占位）。配套：personas 31→32（美发师）、collections 28（质量工具箱 9 件套）、wiki 63（+5）、推文 4 篇覆盖率 100%。

> 详 docs/TOOL_BATCH27_RESEARCH_2026-11-06.md。方法：画像断档法榨干（31 画像 100%，仅剩已弃 eDPI）→ 53 idea 碰撞检测 33 空白 → 5 误报复核 → WebSearch 12 组抽查。三梯队 18 款：**质量计量 5**（测量不确定度[真空]/8D 报告[中文交互真空]/PFMEA[RPN+AP 双模式]/有效数字修约 GB 8170/西格玛水平全向换算）+ **单位收官+打印教育 8**（温度/速度/数据存储/角度四换算 + 竖式计算器/英语四线格字帖/认识时钟/人民币练习）+ **行业新画像+嵌入式 5**（染膏双氧奶[新画像美发师，中高真空]/钣金展开[中竞争]/水产塘口用药/CAN 位定时[中竞争]/步进脉冲[中竞争]）。保池 11：Q 格式/锂电充电/陶艺收缩/缝纫估料/电镀时间/焊缝强度/粘度/转速/应用题/视力表[医疗边界待拍板]/离职交接。弃选定论 5：隐形眼镜（6 家）、配速（7 家）、轮毂 ET（5 家）、时差（7+ 家）、LUFS（测量类占位）。配套：新画像美发师、新专题「质量工具箱」（与 IC 测试质量台联动）、PFMEA AP 矩阵与修约边界一律"以官方原文为准自核"。

## 二十三、第二十八~三十批：工程线深挖+统计教育+传感器实用件（2026-11-07 调研，54 款三批，详报告 docs/TOOL_BATCH28_RESEARCH_2026-11-07.md）

> 方法：96 idea 两轮碰撞检测（33 撞车排除）+ WebSearch 15 组实抓。**保池核销修正：tvs-selector/transformer-rewind/uart-baud-error 已随第二十六批落地，第二十节记载过时。**真空优先：地暖盘管（只有文章无工具）/跨境电商税（网页版≈零）/PoE 预算/Q 格式/陶艺收缩/电镀时间。弃选定论：AA 分摊（记账 App 饱和）、全屏时钟/闹钟（薄）、简繁转换（OpenCC 饱和+依赖重）、视力表（医疗边界待拍板）、转速（RCF 已盖）。

- **第二十八批 20 款**（安防暖通工程+印刷+蓝领家装+厨房母婴）：cctv-lens-calculator/nvr-storage-calculator/poe-power-budget/fresh-air-calculator/duct-size-calculator/floor-heating-calculator/lumen-lighting-calculator/dew-point-calculator/shadow-length-calculator/paper-cut-size-calculator/print-bleed-guide/large-format-resolution/welding-amperage-calculator/miter-angle-calculator/mortar-mix-calculator/curtain-fabric-calculator/flooring-material-calculator/oven-temperature-converter/bakers-percentage-calculator/child-height-predictor
- **第二十九批 19 款**（统计检验+记分游戏+财务法律）：confidence-interval-calculator/t-test-calculator/chi-square-calculator/normal-distribution-calculator/linear-regression-calculator/anova-calculator/twenty-four-solver/chess-clock-online/scoreboard-counter/tournament-bracket-generator/darts-scorer/billiards-counter/labor-remuneration-tax/work-injury-compensation/sick-leave-pay-calculator/debt-payoff-planner/blood-type-inheritance/slacking-salary-counter/carbon-footprint-calculator
- **第三十批 15 款**（传感器实用件+保池清算）：online-ruler/spirit-level-tool/online-compass/screen-magnifier/q-format-converter/lithium-charge-time/pottery-shrinkage-calculator/sewing-fabric-estimator/electroplating-time-calculator/weld-strength-calculator/viscosity-converter/math-word-problem-generator/handover-checklist-generator/salary-reverse-calculator/drone-flight-time-calculator

配套：personas 硬件+3/施工+4/机修+1/手工+2/法律+3（饱和画像不加任务）；collections +3（监控安防/统计检验/装修收尾）；wiki +6；图标补约 14。锚点备忘与自核口径见报告第四节。

## 二十四、第二十八~三十批落地记录（2026-11-07，全站 927 款）

- 2026-11-07：**第二十八批落地**（安防暖通工程+印刷+蓝领家装+厨房母婴，全站 **893 款**）：20 款全部实施（监控镜头 DORI/监控硬盘/PoE预算/新风/风管/地暖/流明法/露点/太阳影子/纸张开数/印刷出血/喷绘分辨率/焊接电流/斜切角/砂浆配比/窗帘用料/地板用量/烤箱温度/烘焙百分比/儿童身高）。toolIcons 补 Blinds/Shirt（总 271）。自纠规格：风管回算风速锚点、露点 e_s(25) 是 20℃ 值（31.69 非 23.76）、GB/T 788 实为 A/B 系列口径、Gas Mark 用 F=250+25G 定义。
- 2026-11-07：**第二十九批落地**（统计检验+记分游戏+财务法律，全站 **912 款**）：19 款全部实施（置信区间/t检验/卡方/正态/回归/ANOVA/24点求解（BigInt 有理数）/棋钟/记分牌/对阵表/飞镖/台球/劳务报酬个税/工伤赔偿/病假工资/债务雪球雪崩/血型遗传/摸鱼/碳排放）。toolIcons 补 Leaf（总 272）。**统计套件为高精度亮点**：erf 级数+连分式、不完全贝塔 Lentz、Anscombe/R 经典数据 1e-4 复现（Fisher 锚点 0.1147 被自纠为 0.1663）；**两处法规时效自纠**：劳社部发〔2008〕3 号已废止（21.75 不变、月工作日 20.83→20.67）、上海病假 83 号文 2026-08 已失效；Bronstein 公式自纠为加回 min(消耗,x)。
- 2026-11-07：**第三十批落地**（传感器实用件+保池清算，全站 **927 款**）：15 款全部实施（屏幕尺子/水平仪/指南针/放大镜/Q格式/锂电池充电/陶艺收缩/缝纫估料/电镀时间/焊缝强度/粘度换算/应用题/离职交接/税前税后互推/无人机续航）。传感器 4 件走 DeviceOrientation/getUserMedia 手势内授权（iOS 13+ requestPermission 坑已处理）；电镀页沉淀量纲推导（t=0.6δρ/(EηD) 面积约去）；salary-reverse 锚点自纠（12900 落 20% 档税 1170 非 1080）。死链修复：handover 页 leave-request-printer→leave-note-generator。
- 2026-11-07：**三批配套与验证**：personas +32 任务（32 画像 353 任务）、collections 28→31（监控安防/统计检验/装修收尾）、wiki 63→69、推文 10 篇（posts/2026-11-07/ 12:00-13:10 已过去时段）、feed 433 条零跳过、sitemap 927 工具、llms 290KB、覆盖率 927/927=100%。54 页 SSR 200 + 日志零 [500] + QA 全量通过。13 agent 7 波（2 并发）交付，单测 1000+ 断言，**规格锚点自纠 40+ 处——第 5 次复训"锚点先自己精算"**。

## 批次记录

---

- 2026-11-06：**第二十七批落地**（质量计量+单位收官+打印教育+行业新画像，全站 **873 款**）：三梯队 18 款全部实施。① 质量计量 5：测量不确定度评定（A/B 类→合成→Welch-Satterthwaite→t 分布 k，erf 级数+DLMF 连分式双精度，Φ(1.5) 1e-12）、西格玛水平换算（两口径 σ↔DPMO↔Cpk，6σ=3.4DPMO 锚点 1e-9）、有效数字修约（GB/T 8170 四舍六入五成双 **BigInt 定点实现，浮点 toFixed 翻车案例入页面**）、PFMEA 风险评估（**AP 表 5 源交叉验证**：Relyence 软件截图+Acadlore 论文 PDF 逐格+Pretesh Biswas+SMMT+独立二次转录 1000 组合全覆盖核对，孤例 fmearatings 弃用）、8D 报告生成器（D1-D8 5W2H 双根因+A4 预览+导出 HTML+草稿）。② 单位换算收官 4（温度四向/速度含节与马赫/数据存储双体系 GB↔GiB 931 科普/角度含 DMS 三段）+ 打印教育 4（竖式进退位约束组卷/英语四线格 SVG 描红/时钟双题型精确角度/人民币简笔示意）。③ 行业垂类 5：染膏调配（重量比警示+浓度档引导）、钣金展开（**外模线口径 L=A+B−BD 与分解式恒等零误差**，两种量法差异入 SEO）、水产用药（三种塘形水体+泼洒/拌饵双方式+休药期）、CAN 位定时（BRP/Ntq 枚举+CAN FD 双相位+Top5 备选表，2400 行扫参约束校验）、步进五参联动（往返 <1e-9）。toolIcons 补 ShieldAlert/HardDrive（总 269）。personas 31→32（美发师 2 任务），质检 +5/实验室 +2/农户 +1/机修 +1/硬件 +1/手工 +1 任务（321 任务覆盖 100%、关联 587/873）；collections 27→28（质量工具箱 9 件套联动 IC 测试质量台）；wiki 58→63（不确定度/8D/PFMEA/西格玛/修约，工程与车间类）。sitemap 873 工具、llms 273.9KB、博客覆盖率 873/873=100%。**六 agent 三波（2 并发）交付，锚点断言 386 项全过，自纠真 bug 9 个**（A: 空 B 类假分量+修约标志传反；C: DMS 60 进位 const 回写 TypeError；D: 数位累加顺序颠倒+pad NaN RangeError+模板漏声明；B: watch debounce 臆造选项+臆造 CSS 变量；合计另纠正主会话规格锚点笔误 2 处——速度 knot 尾数、钣金 60° 尾差——"锚点先自己精算"教训再次量化）。18 页 SSR 200 + 8 关联路由 200、日志零 [500]、QA 全量 873 款 0 异常。4 篇推文（posts/2026-11-06/，date 03:10-04:10 已过去时段）。

---

- 2026-11-06：**第二十六批落地**（51 款大批次，全站 **855 款**）：九条线全部实施——电子保护驱动（TVS/继电器/光耦/RC吸收/去耦/LDO）、无源数字（电容储能/PWM/LED串并联/空芯电感/Sallen-Key/变压器重绕/波特率误差）、射频（天线/SWR/dBm/衰减器）、离网电源（太阳能/UPS/电池续航）、汽车（胎压/OBD 70码/车灯 20型号）、机械（**螺栓扭矩表 VDI 2230 五源核验**/弹簧/气缸/液压/减速比/链条/砂纸 24档）、建筑庭院（坡度/温室/碎石/花土）、影音（微距/快门角度/延摄/声压/BPM延时）、生活实验（溶液/巧克力分级/徒步饮水/传动比/编织密度）、健康（噪声剂量）、单位换算六件套（压力/流量/能量/功率/力/纸张克重）。toolIcons 补 Lightbulb/Mountain/Bike（总 267）。personas 10 画像任务增补（hw 16→24 任务）；collections 27（新专题 car-owner-kit）；wiki 58。sitemap 1576 URL、覆盖率 855/855=100%。**16 agent 8 波交付，单测 700+ 全绿，规格笔误自纠约 20 处**（教训固化：我给的"自核锚点"约 1/3 有误——Wheeler 系数/精度条件方向反/电感锚点物理不可能/Sallen-Key 等值 Q=√m 漏 /2/Arrhenius 306→77.66/E96 锚点属 E192/SWR 损耗值/衰减器 π 型 61Ω 是 20dB 口径/纸张令重/Bond 基准 17×22 非 25×38/噪声 95dBA 时间 1.585h 数学矛盾……），最亮眼：A4 用自写 Maxwell 电流片数值积分做 Wheeler 公式 ground truth、A9 螺栓表下载厂商 PDF 五源交叉、A6 用 ABCD 矩阵验证衰减器。11 篇推文覆盖 51 款（sound-dose 漏引一轮后补齐）。52 页编译+SSR 200、13 关联路由 200、日志零 [500]。

---

- 2026-11-06：**第二十五批落地**（电子行业线第二批·品质/模拟/保护/数字，全站 **804 款**）：12 款全部实施（GR&R/Cpk/MTBF-FIT/运放增益/Buck电感/PCB线宽/铜厚线规/TL431稳压反馈/RC时间常数/保险丝选型/555定时器/74·4000系列速查），全部零新依赖。toolIcons 补 CircuitBoard/PlugZap（总 264）。**personas 任务 16/12**（hw-engineer +5：运放/Buck/线宽铜厚/TL431/74系列；repair +3：保险丝/RC/555）；collections 电子设计台 7→13 款、IC 测试质量台 4→7 款、电子维修台 8→11 款；wiki 48→52（运放/MTBF/保险丝I²t/555 四词条）。sitemap 1506 URL、覆盖率 804/804=100%。**六 agent 三波交付，单测 400+ 全绿，规格笔误自纠 6 处**：A 组 AIAG K/d₂ 系数自核一致+c₄ 改 Lanczos 伽马精确计算+自揪空格解析真 bug；B 组**纠正规格书 Arrhenius 锚点（55→125℃/Ea0.7 实为 77.66 倍非 306）**+AFR 口径少 3 个数量级按 8.76e3 修正；C 组过孔公式恒等式证明（π·d·t）+oz 口径双源注明；D 组 AWG 5 锚点全过+纠正规格 TL431 手算误差（10.040k 非 10.020k）+"40mil/A 归 IPC 名下不准确"双列口径呈现；E 组**纠正规格 E96 锚点（98.8k 属 E192）**+INA 常数按 AD620 口径注明；F 组**勘误规格 555 测试向量 2 处（f≈986Hz 非 9.86kHz、D=53.4% 非 81.25%）**+logic-ic 39 型号以 Nexperia datasheet 一手 PDF 核验（自纠 CD4001 引脚排布与 7475 电源位两处记忆偏差，4001↔7402 不兼容警示入库）。12 页编译+SSR 200、9 关联路由 200、日志零 [500]。5 篇推文（含 fuse-mtbf 篇 Arrhenius 修正至 78 倍）覆盖率 100%。保池 3（tvs-selector/transformer-rewind/uart-baud-error）留第二十节。

---

- 2026-11-05：**第二十四批落地**（电子元器件行业线，商业合作向，全站 **792 款**）：第二十节第一批 12 款全部实施（4-20mA信号换算/电机电容选型/散热热阻/NTC热敏/PT100热电偶/电解电容寿命/电感标号/IC丝印解读/E系列阻值组合替代/DPPM良率/晶振负载电容/I2C上拉），全部零新依赖。toolIcons 补 Fan/Magnet/ScanSearch/Sigma/ThermometerSnowflake（总 262）。**底账补缺：personas 29→31 画像**（hardware-engineer 11 任务/electronics-repairer 9 任务，两画像 100% 覆盖，审计断档仅剩主动弃选的 eDPI）；collections 21→24（电子工程师设计台/传感器信号链/IC 测试质量台 + 电子维修工作台 4→8 扩容）；wiki 40→48 词条（新分类「电子与硬件」8 条）；sitemap 1422→1479 URL、覆盖率 792/792=100%。配套 5 篇推文（posts/2026-11-05/）12 新工具全覆盖。**六 agent 三波（2 并发）交付，单测合计 500+ 项全绿**：A 组 38（PLC 档位 NAMUR 细化）、B 组 39（**自纠 S-H 拟合设计矩阵 x²→(lnR)³**）、C 组 54（**自纠 NIST c6 转写 e-15→e-16**；K 型锚点 4096µV 非 4095）、D 组 288（**自纠 YYDDD 闰年校验与 ISO 8601 周历**——2020 有 W53 而 2025 没有）、E 组 67（**纠正规格书两处算术笔误**：E6-E24 须用 IEC 60063 公布表非纯公式、滚动良率 0.95×0.98×0.99=92.169% 非 92.117%；最近值度量改对数距离、组合搜索窗口放宽到目标/25 才能命中 220Ω 这类小电阻）、F 组 61（按 NXP 分档 FM+ Cb 上限 550pF、E24 推荐用几何中点）。12 页编译+SSR 200 全过、13 条关联路由（3 专题/2 职业/wiki 词条）200、日志零 [500]。调研报告含「重要发现三条建议」附录（画像复利用法/合作方丝印数据升级路径/导流三阶段节奏）。备选池：第二批 10 款（Cpk/GR&R/线宽/TL431 合并页等）+ 第三梯队 6 款留池。

---

- 2026-11-05：**第二十二批落地**（断档清零批次）：第十八节 15 款全部实施（公差配合/齿轮模数/轴承对照/硬度换算/功率因数补偿/星三角启动/导线重量桥架/肥料养分/播种量/诉讼时效/诉讼费/缓冲液pH/细胞计数/视频码率/星空曝光），全站 **777 款**，零新依赖。toolIcons 补 Gem/Triangle/Rows3/Microscope（总 257）。**画像审计收官：断档 14→1（仅剩游戏 eDPI 主动弃选），27 画像 100% 饱和**。collections 复用追加：电工随身计算尺 4→7 款、车间与工地速查 4→8 款（总 16 专题）。配套 5 篇推文（posts/2026-11-05/）覆盖率 **100%（777/777）**、feed 388 条。**agent 自纠规格 5 处**：公差配合优先配合实为 H7/n6·p6（非 n7/p7）、GB/T 1172 现行版 1999 且 HB 高段留空、诉讼费实为 10 档（>2000 万 0.5% 档）+ 执行费 5 档、播种量公式单位口径（×1000 为克）、硬度源表 HRC59 HS 笔误修正保单调；另抓 1 个真 bug（硬度转换 SCALE_KEY 大小写映射 NaN）。**主会话回归一枚**：公差页 IT_TABLE 缺 IT8 行致 H8/f7 SSR 500（新增行+缺行守卫修复）——查表类数据完整性须 SSR 探测而非仅编译。**踩坑复训**：系统时钟凌晨时推文 date 用当天凌晨已过时段（本次 00:10-02:00，08:10-10:20 曾全被 Hugo 静默跳过）。

---

- 2026-11-04：**第二十一批落地**：第十六节第三梯队 14 款全部实施（混凝土配合比/房间体积/农药稀释/ppm换算/板材开料/木材材积/十字绣/毛线用量/模型比例/3D打印成本/货车装载/打印分辨率/ND滤镜/扭矩换算），全站 **762 款**，零新依赖。toolIcons 补 House/TreePine/Box/Printer/Truck/PaintBucket（总 253）。配套 4 篇推文覆盖率 100%。**至此第四轮画像调研 38 款全部落地**（19/20/21 批共 38 款），本轮 6 画像矩阵收官（12 画像饱和判定不变）。agent 自纠规格多处：模型 N 比例（1:160 非 1:150）与新干线 40m 物理不可能、打印 A4@150 应为 1754 非 1748、扭矩 50lb-ft=67.79 非 67.75、truck 示例 219 件超体积上限实为 175。**SSR 真 bug 一枚**：knitting-yarn 页 v-show 包 null 对象属性（v-show 仍求值内部绑定）SSR 500，改 v-if 修复——新坑入记忆。dev server 教训：批二十 nohup 起的进程 kill %1 杀不掉导致 build.lock 占用，需 pkill -f "nuxt dev --port" 精确杀。
- 2026-11-04：**第二十批落地**：第十六节第二梯队 12 款全部实施（电池组/电容标号/皮带长/轮胎对比/AQL/EOQ/安全库存/月相/鱼缸/鸡尾酒/降度勾兑/菜品成本卡），全站 **748 款**，零新依赖。toolIcons 补 Cog/ClipboardCheck/Martini/Wine（总 247）。collections 追加 2 画像专题（电子维修工作台/质检与库存工作台，总 16——教训：Edit 大数组时 new_string 漏保留原锚条目致 lab-bench 被覆盖当场补回，collections 后续改为纯追加写法）。配套 5 篇推文覆盖率 100%。agent 自纠规格两处：降度互配比方向式（正确 A:B=(T−B):(A−T)）、AQL 预设锚点（1201-3200/II 字码 J 非 L 等三处）。SSR 教训：dev server Ready 前 curl 全 503，多等 40s 复测全 200。
- 2026-11-04：**第十九批落地**（画像法首批）：第十六节第一梯队 12 款全部实施（电压降/载流量/欧姆定律/电阻色环/景深超焦距/频率波长/RT60混响/离心RCF/梯度稀释/钢筋米重/空调BTU/螺纹速查），全站 **736 款**，零新依赖。toolIcons 补 Cable/CircleDot/Disc/Cylinder/AirVent/Wrench（总 243）。配套 5 篇推文（posts/2026-11-04/ 晚场）覆盖率 100%。**collections 首次按画像组织**：新增 4 专题（电工随身计算尺/车间与工地速查/光影与声学问算台/实验台面换算器，总数 10→14）。agent 自纠规格四处（色环 3 处预设矛盾、RT60 房间表面积 88.6 非 102.1、钢筋 Φ16/20/25 精确米重尾差、螺纹"NPT 牙型同 G"为规格错误按标准修正），电压降/RCF 预设手算修正。
- 2026-11-04：**第十八批落地**：第三轮备选池 8 款全部实施（单词卡打印/随机抽题/分子量/手机归属地/虚拟钢琴/批量重命名/复利计算器/经营范围生成器），全站 **724 款**，零新依赖。toolIcons 补 Piano/Atom/FilePen/Shuffle（总 237；Shuffle 此前仅 import 未入映射表的漏项顺带修复）。配套 5 篇推文（posts/2026-11-04/）覆盖率 100%。**至此第三轮调研 40 款（32 新+8 池）全部消化完毕，backlog 池子清空**——下次选品需新一轮调研。agent 自纠规格两处：flashcard 背面镜像矩阵按长边翻页物理原理修正（规格示例与"行同序列倒序"自述矛盾）；复利精确翻倍年限公式量纲修正（n>1 时为年非期）。批量重命名与手机归属地是"浏览器本地能力扩张"路线代表作（FSA+内置号段库）。两 agent 600s inactive 但文件未落盘，重派成功——"先查文件"惯例再次验证（有时真没写）。
- 2026-11-03：**第十七批落地**：第十五节第三梯队 8 款全部实施（视频裁剪/音频拼接/音频变速/作息计划表/护眼提醒/植物浇水/生肖速查/体感温度），全站 **715 款**，零新依赖。至此第三轮调研 40 款路线图中新候选 32 款全部落地（批十五~十七），剩余原备选池 8 款留池机动。配套 3 篇推文覆盖率 100%。**本批经验**：① 模型配额（1310 周上限）中断派发后，agent 可能已把文件写完落盘——恢复后先编译校验再决定重派（interval-timer/video-trimmer/audio-merger 三例同模式）；② 中断页补派"审计修复"任务有效：video-trimmer 审计修出 4 处（含录制音轨挂 gainNode 后被静音的关键 bug、seek 中止竞态、canvas 轨道未 stop、异步 AudioContext suspended），audio-merger 审计零修复；③ 体感温度 agent 校准值与 NWS 官方表不符时按官方公式逐字实现并报告偏差（风寒 0℃/20km/h 实际 -5.24 非任务书 -4.2）。
- 2026-11-03：**第十六批落地**：第十五节第二梯队 12 款全部实施（定价/LTV-CAC/JSON转GoStruct/JSON转Pydantic/EditorConfig/Prettier配置/婴儿喂养/戒烟账本/情绪日记/和弦图/音程听辨/鞋码对照），全站 **708 款**，零新依赖。toolIcons 补 BadgePercent/Repeat2/Milk/CigaretteOff/Music2（总 230）。配套 5 篇推文（posts/2026-11-03/ 末场）覆盖率 100%。json-to-go-struct 过真实 go vet + Unmarshal 冒烟；json-to-pydantic 过 ast.parse；鞋码 EU 公式笔误（1.5×cm+1.5 → (cm+1.5)×1.5）被 agent 自纠。prettier 中断于配额限制但文件已完整写完（编译校验通过直接采用）。
- 2026-11-03：**第十五批落地**：第十五节第一梯队 12 款全部实施（租房买房对比/生育津贴/延迟退休/盈亏平衡/口算题卡/数独打印/1RM/HIIT计时/chmod/curl构建器/关键词密度/海报生成），全站 **696 款**，零新依赖（海报复用 qrcode）。toolIcons 补 Building2/Hourglass（总 225）。配套 5 篇推文（posts/2026-11-03/ 晚场）覆盖率 100%。**延迟退休官方校准**：agent 核对人社部 12333 官方 PDF 纠正规格样例 1 个月偏差（首组 +1 口径，1970-01 男→2031-05 延 16 个月）。EPIPE 中断的 interval-timer 文件已完整写完，重派 agent 审计保留——"先查文件再重派"惯例再次生效。
- 2026-11-03：第三轮市场调研新增第十五节 32 新+池 8=40 款路线图（未实施，待用户拍板），详 docs/TOOL_MARKET_RESEARCH_BATCH15_2026-11-03.md。关键验证：租房vs买房简体中文真空；延迟退休需求巨大竞品中等（干净版差异位）；生育津贴竞品仅简单版（各省产假表差异位）；口算题卡家长每日高频竞品中等。
- 2026-11-03：**第十四批落地**：第十四节第二梯队 10 款全部实施（白噪音/电子木鱼/FIRE/52周存钱/AB样本量/广告指标/中文排版检查/日志查看/可打印日历/电子请柬），全站 **684 款**，零新依赖，两批十款全零依赖。toolIcons 补 AudioLines/Fish/PiggyBank/SplitSquareHorizontal（总 223）。配套 5 篇推文（posts/2026-11-03/ 下午场）覆盖率 100%。可打印日历接入 lunar-birthday-reminder 的 lunarInfo 真历法表（弃用 lunar-calendar.vue 的近似实现与 solar-term-calculator 的固定日期表，改用通用 sTermInfo 公式）。AB 计算器再次纠正规格笔误（每组 122,124 非 6.3 万，R power.prop.test 交叉验证）。至此 2026-11-02 调研 28 款中 20 款已落地，备选 8 款留池。
- 2026-11-03：**第十三批落地**：第十四节第一梯队 10 款全部实施（证件照换底色/PDF文本提取/劳动补偿/二手房税费/Excel公式/化学配平/反应测试/节拍器/吉他调音器/批量文本），全站 674 款。toolIcons 补 FlaskConical/Guitar（Table 已存在勿重复 import——重复声明会编译失败）。配套 6 篇推文（posts/2026-11-03/）覆盖率 100%。**新坑：环境 PATH 偶发丢 node/nvm（`command not found: node`），后台命令与 npm/node 调用统一前置 `export PATH="$HOME/.nvm/versions/node/$(ls ~/.nvm/versions/node/ | tail -1)/bin:$PATH"`**。
- 2026-11-02：扩面深度调研新增第十四节 28 款（第一/第二梯队各 10 + 备选 8，未实施，待用户拍板），详 docs/TOOL_MARKET_RESEARCH_2026-11-02.md。站点现状：日活约 300 IP、必应多词有排名。
- 2026-10-31：**第十二批落地**：第十三节 10 款全部实施（robots/sitemap/meta-tags/system-prompt/cap-table/burn-rate/vat/shipping/gantt/meeting-cost），全站 664 款，零新依赖。配套 5 篇推文（posts/2026-10-31/）覆盖率 100%。本批经验：**宿主并发限制约 2 个 agent**（一次派 5 个只有 2 个获准执行，"user concurrency limit exceeded"），后续派发按 2 并发分波。
- 2026-10-29：**第十一批落地**：第十二节主推 10 款全部实施（账单分析/报价单/商业发票/借条/条形码/标价签/名片/摄像头麦克风/手柄/RAG分块），全站 654 款。新依赖 jsbarcode。配套 5 篇推文（posts/2026-10-29/）覆盖率 100%。备选 6 款留池待选。agent 规格笔误两处被自纠（EAN 校验位向量 690123456789→2 而非 0；A4 40×30 gap2 为 32 枚/页而非 36）。
- 2026-10-29：商业潜力调研新增第十二节 10 款主推+6 款备选，详 docs/TOOL_COMMERCIAL_RESEARCH_2026-10-29.md。
- 2026-10-13~20：第五~九批共 56 款全部落地，本清单池子（含十一类新提案）已消化完毕，全站 641 款。
- **2026-10-26：池外高频补缺 3 款（全站 644 款）**——鼠标按键测试 mouse-test（health）、倒数日管理 days-countdown（time）、噪音分贝检测 decibel-meter（health）。选品依据：全库零撞车 + 高频搜索场景（外设验货/重要日子管理/环境噪音），均纯本地零新依赖。配套 5 篇推文（posts/2026-10-26/）覆盖三款新工具，覆盖率保持 100%。

## 建议的第五批组合（20 款，按主题聚合力挑选）

**教育/教师主题 6**：古诗文默写挖空、听写挖空生成、课程表制作、班级座位表、演讲比赛计分器、作文稿纸估算
**图片社交 4**：带壳截图、情侣头像切图、时间地点水印相机、壁纸多机型适配
**生活 4**：咖啡因摄入、家宴点菜、烘焙原料替换、旅行清单
**职场 3**：带薪年假折算、阶梯提成、接单报价换算
**开发 3**：雪花 ID 解码、DDL 转 ER 图、GitHub Actions 生成器

> 备选理由：教育主题可凑一篇《考试季之后：教师与家长的打印工具箱》系列文；图片 4 款可发《发图进阶姿势》接续朋友圈篇；全部为高/中可行性，无重依赖。
