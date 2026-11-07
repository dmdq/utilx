# 第二十八~三十批调研报告：工程线深挖 + 统计教育 + 传感器实用件（2026-11-07）

> **【落地结果 2026-11-07】三批 54 款全部落地（全站 873→927）：批 28 的 20 款 + 批 29 的 19 款 + 批 30 的 15 款与第三节清单一致（排序字段有微调，以 tools.js 为准）。7 波 13 agent 交付，单测 1000+ 断言全绿；SSR 54 页全 200、日志零 [500]。agent 规格自纠 40+ 处（重点：Bronstein 公式应为加回 min(消耗,x) 非 max(消耗/2,x)；Fisher [[12,5],[7,10]] p=0.1663 非 0.1147；电镀闭式 t=0.6δρ/(EηD) 面积约去；轮空分给最前种子；salary-reverse 锚点 12900 应落 20% 档税 1170；Bronstein/Gas Mark/电网因子 0.5306 为 2023 年度值；劳社部发〔2008〕3 号已废止（21.75 不变、月工作日 20.67）；上海病假 83 号文已失效）。配套：personas +32 任务（353/32 画像）、collections 28→31（cctv-security-kit/stats-workbench/renovation-finishing）、wiki 63→69（置信区间/t 检验/露点/纸张开数/劳务报酬预扣/法拉第定律）、推文 10 篇（posts/2026-11-07/）、sitemap 927 工具、覆盖率 927/927=100%、feed 433 条。死链修复 1 处（handover→leave-note-generator）。图标补 Blinds/Shirt/Leaf（总 272）。**

> 背景：第二十七批后全站 873 款。保池核销 3（tvs-selector/transformer-rewind/uart-baud-error 已在批 26 落地，backlog 第二十二节记载过时，本报告修正）；批 27 保池剩 9 款可用（视力表医疗边界待拍板、转速被 RPM-RCF 实质覆盖，均不纳入）。本轮方法：**两轮 96 个 idea 碰撞检测（发现 33 个撞车——日出日落/加班费/睡眠周期/拼音/中文数字/cron×2/UA×2/秒表/转盘/位运算/Markdown表格/提前还款/信用卡/基金定投/GPA/BMR/体脂/卡路里/理想体重/打字速度 等均已有）+ WebSearch 15 组实抓验证**，产出 54 款零撞车组合，分三批落地（20+19+15），目标全站 873→927。

## 一、竞争验证结论（15 组实抓）

| 方向 | 竞争格局 | 结论 |
|---|---|---|
| 地暖盘管计算 | **只有文章公式（凤凰/房天下），零交互工具** | ✅ 真空，优先 |
| 跨境电商综合税/行邮税 | 网页版≈零（App Store 应用为主） | ✅ 真空，优先 |
| PoE 供电预算 | 无独立计算器（厂商文档 H3C/菲尼涩为主） | ✅ 真空，优先 |
| 焊接电流选择 | bchrt 通用站 1 家 + Miller 英文官方 | ✅ 中文弱，国标焊条差异位 |
| NVR 监控存储 | TP-LINK 官方品牌内工具 + JVSG 国际 | 🟡 独立教学型可打（多品牌+报警占比+H.265） |
| 监控镜头焦距 | 同上格局（JVSG lens calc） | 🟡 同批组队打 |
| 劳务报酬·稿酬个税 | gerensuodeshui/ip138 老式页面 | 🟡 升级位：预扣+汇算合并示意 |
| 工伤赔偿 | 上海法院官方 + 律所计算器 3-5 家 | 🟡 需求大，教学型+参数透明差异位，强免责 |
| 置信区间/t检验等统计套件 | bchrt/mathcracker/星球狮/miniwebtool 零散 | 🟡 **成套中文统计线仍空**（互链矩阵） |
| 新风量 | inettools + toolizer(繁) 2 家 | 🟡 差异=人均/ACH 取大+CFM+GB 预设 |
| 照度流明法 | inettools/miniwebtool 2 家 | 🟡 差异=GB 50034 照度标准预设表 |
| 纸张开数 | 100xgj 1 家 | 🟡 正度/大度双体系+两种开切法 |
| 窗帘用料 | miniwebtool 中文版 1 家 | 🟡 差异=门幅拼接+对花损耗+双层纱帘 |
| 砂浆配比 | 卡兔建筑 1 家 + App | 🟡 差异=现场体积比换算+抹灰面积法 |
| 对阵表 | THE TOURNAMENT/LeagueLobster 国际强 | 🟡 轻量免注册+打印向可打 |
| 飞镖 501 | online-calculator 中文 + Matchito | 🟡 收镖表+三镖平均差异位 |
| 摸鱼工资 | App/Chrome 扩展/GitHub 为主，网页零散 | 🟡 21.75 计薪口径差异位 |
| 儿童身高预测 | ip138/metools 2 家 | 🟡 多公式并列+站内生长曲线内链 |

传感器实用件（尺子/水平仪/指南针/放大镜）：原生 App 域，**网页版稀缺**，免安装+纯本地是天然差异位；iOS 13+ DeviceOrientation 需手势内 requestPermission，需处理。

## 二、弃选清单（本报告定论）

- **AA 分摊**：记账 App 内置+零散网页饱和，无差异位。
- **全屏时钟/在线闹钟**：需求薄、竞品零散、与 countdown-timer/秒表重叠。
- **简繁转换**：OpenCC 系站点林立，且词库依赖 ≥1.5MB，性价比低。
- **视力表**：医疗边界维持待拍板不落地。
- **转速换算**：rcf-calculator 已实质覆盖实验室场景，通用 n↔rad/s 太薄。
- **税前税后互推**保留但降第三梯队（tax-calculator 已有个税正向，反推做差异位）。

## 三、三批组合（54 款）

### 第二十八批（20 款）：安防暖通工程线 + 印刷 + 蓝领家装 + 厨房母婴

| # | id | 名称 | 分类 | 一句话 | 竞争位 |
|---|---|---|---|---|---|
| 1 | cctv-lens-calculator | 监控镜头焦距计算器 | dev | 焦距↔视场↔探测/识别人脸距离，传感器尺寸联动 | 中低 |
| 2 | nvr-storage-calculator | 监控硬盘存储计算器 | dev | 码率×通道×天数互算，H.264/265+报警触发占比 | 中 |
| 3 | poe-power-budget | PoE 供电功率预算器 | dev | af/at/bt 三标准 PSE/PD 端功率+余量系数 | **真空** |
| 4 | fresh-air-calculator | 新风量计算器 | calculate | 人均法/换气次数法双算取大+CFM | 中 |
| 5 | duct-size-calculator | 风管尺寸计算器 | calculate | 风量+风速→圆管径/矩形管，比摩阻提示 | 中低 |
| 6 | floor-heating-calculator | 地暖盘管计算器 | calculate | 面积÷间距=管长+回路数≤120m+分水器口数 | **真空** |
| 7 | lumen-lighting-calculator | 照度计算器 | calculate | 流明法 N=E·A/(Φ·UF·MF)+GB 50034 预设 | 中 |
| 8 | dew-point-calculator | 露点湿度计算器 | calculate | Magnus 公式 T/RH↔Td/Tw/绝对湿度 | 中低 |
| 9 | shadow-length-calculator | 太阳高度角影子计算器 | calculate | NOAA 太阳位置+影子长度/最佳拍摄时段 | 中低 |
| 10 | paper-cut-size-calculator | 纸张开数计算器 | design | 正度/大度全开→64开，几何/直线双开切 | 中低 |
| 11 | print-bleed-guide | 印刷出血参考生成器 | design | 常见印品出血/安全区可视化+校稿清单 | 低 |
| 12 | large-format-resolution | 喷绘写真分辨率计算器 | design | 视距→DPI 档位+幅面像素建议 | 中低 |
| 13 | welding-amperage-calculator | 焊接电流选择器 | calculate | 焊条直径×(35~55)+位置/厚度修正，J422 国标条目 | 中文弱 |
| 14 | miter-angle-calculator | 斜切角计算器 | calculate | 多段拼角/任意墙角对切/边框拼接 | 中低 |
| 15 | mortar-mix-calculator | 砂浆配比计算器 | calculate | M2.5~M15 每方用量+抹灰面积法 | 中低 |
| 16 | curtain-fabric-calculator | 窗帘用料计算器 | calculate | 褶皱倍数×门幅拼接+对花损耗 | 中 |
| 17 | flooring-material-calculator | 地板用量计算器 | calculate | 面积×损耗率→包数/条数，铺法方向 | 中低 |
| 18 | oven-temperature-converter | 烤箱温度换算器 | calculate | °C/°F/Gas Mark/风扇档换算 | 中 |
| 19 | bakers-percentage-calculator | 烘焙百分比计算器 | calculate | 面粉基准 100% 配比换算+配方缩放 | 中低 |
| 20 | child-height-predictor | 儿童身高预测器 | health | CMH/欧洲法则并列±区间+生长曲线内链 | 中 |

### 第二十九批（19 款）：统计检验线 + 记分游戏线 + 财务法律线

| # | id | 名称 | 分类 | 一句话 | 竞争位 |
|---|---|---|---|---|---|
| 21 | confidence-interval-calculator | 置信区间计算器 | calculate | 均值(σ已知/未知)/比例，z 与 t 自动选择 | 中 |
| 22 | t-test-calculator | t 检验计算器 | calculate | 单样本/独立(Welch)/配对+效应量 | 中 |
| 23 | chi-square-calculator | 卡方检验计算器 | calculate | 拟合优度+独立性列联表 | 中 |
| 24 | normal-distribution-calculator | 正态分布计算器 | calculate | CDF/PDF/逆Z/标准分，erf 高精度 | 中 |
| 25 | linear-regression-calculator | 线性回归计算器 | calculate | OLS 多点拟合+r/R²+残差表 | 中 |
| 26 | anova-calculator | 方差分析计算器 | calculate | 单因素 ANOVA+F/p+组间组内分解 | 中 |
| 27 | twenty-four-solver | 24点求解器 | others | 穷举全部解+分数运算+步骤展示 | 中 |
| 28 | chess-clock-online | 在线棋钟 | others | 双面倒计时+Fisher 增时+WebAudio 提示 | 中低 |
| 29 | scoreboard-counter | 比赛记分牌 | others | 大字翻页计分+局分+撤销，全屏模式 | 中低 |
| 30 | tournament-bracket-generator | 淘汰赛对阵表生成器 | others | 单败轮空自动+SVG+A4 打印 | 中 |
| 31 | darts-scorer | 飞镖计分器 | others | 501/301+爆分检测+收镖提示+三镖平均 | 中 |
| 32 | billiards-counter | 台球计分器 | others | 中式黑八局分+斯诺克连续得分 | 中低 |
| 33 | labor-remuneration-tax | 劳务报酬稿酬个税计算器 | finance | 劳务三级预扣+稿酬 70% 减计+汇算提示 | 中 |
| 34 | work-injury-compensation | 工伤赔偿计算器 | finance | 伤残月数表/津贴比例/工亡三项，强免责 | 中强 |
| 35 | sick-leave-pay-calculator | 病假工资计算器 | finance | 医疗期 3-24 月表+病假工资下限口径 | 中低 |
| 36 | debt-payoff-planner | 债务还款计划器 | finance | 雪球/雪崩双策略+利息对比时间线 | 中低 |
| 37 | blood-type-inheritance | 血型遗传计算器 | health | ABO Punnett 组合+概率分布 | 中低 |
| 38 | slacking-salary-counter | 摸鱼计算器 | others | 21.75 计薪口径秒级实时+今日进度条 | 中 |
| 39 | carbon-footprint-calculator | 碳排放计算器 | others | 电/气/行/废弃物因子透明可查 | 中 |

### 第三十批（15 款）：手机传感器实用件 + 保池清算

| # | id | 名称 | 分类 | 一句话 | 竞争位 |
|---|---|---|---|---|---|
| 40 | online-ruler | 屏幕尺子 | others | 银行卡 85.6mm 校准 PPI+cm/inch 双刻度 | 中低 |
| 41 | spirit-level-tool | 手机水平仪 | others | 陀螺仪气泡+角度数显+校零 | 中低 |
| 42 | online-compass | 网页指南针 | others | webkitCompassHeading/absolute 双源+方位名 | 中低 |
| 43 | screen-magnifier | 屏幕放大镜 | others | 摄像头变焦+定格+对比度增强 | 中低 |
| 44 | q-format-converter | Q 格式定点数转换器 | dev | Qm.n↔浮点双+十六进制+饱和截断演示 | **真空** |
| 45 | lithium-charge-time | 锂电池充电时间计算器 | dev | CC-CV 分段估算+效率+0-80% 快充档 | 低 |
| 46 | pottery-shrinkage-calculator | 陶艺收缩率计算器 | others | 干燥+烧成复合收缩正反算 | **真空** |
| 47 | sewing-fabric-estimator | 缝纫估料计算器 | others | 部位用量表+门幅×克重双显 | 低 |
| 48 | electroplating-time-calculator | 电镀时间计算器 | calculate | 法拉第定律 t=ρ·δ·A/(ECE·η·I) 常用镀层表 | **真空** |
| 49 | weld-strength-calculator | 焊缝强度计算器 | calculate | 角焊缝 0.7a 受剪+对接焊缝校核 | 低 |
| 50 | viscosity-converter | 粘度换算器 | calculate | cSt↔°E↔SSU↔Redwood 经验式 | 低 |
| 51 | math-word-problem-generator | 应用题生成器 | others | 鸡兔同笼/行程/工程/盈亏多题型+答案页 | 中低 |
| 52 | handover-checklist-generator | 离职交接清单生成器 | others | 岗位模板勾选→Markdown/打印 | 低 |
| 53 | salary-reverse-calculator | 税前税后互推器 | finance | 累计预扣逆推（二分法）+五险一金联动 | 中 |
| 54 | drone-flight-time-calculator | 无人机续航计算器 | calculate | 容量×电压÷平均功率+悬停巡航双档 | 低 |

## 四、锚点备忘（已自算，落地时给 agent 的向量必须与此一致或明说自核）

- NVR 存储：GB/天 = 码率(Mbps) × 10.8（4Mbps 单通道 30 天 = 1296GB≈1.30TB，十进制）。
- PoE：af=15.4/12.95W、at=30/25.5W、bt-T3=60/51W、bt-T4=90/71W（PSE 端/PD 端）。
- 地暖：每平米管长=1/间距(m)，150mm→6.67m/㎡；20㎡÷0.15m=133.3m→2 回路（单路≤120m）。
- 露点 Magnus（a=17.62,b=243.12）：25℃/60%RH → Td=16.69℃。
- 流明法：N=E·A/(Φ·UF·MF)；100lx·20㎡/(1200lm·0.5·0.8)=4.17→5 盏。
- 焊接：I=(35~55)×d；3.2mm→112~176A（平焊），立/横焊 ×0.85~0.90。
- 跨境综合税：普通商品 13%×70%=9.1%；高档化妆品（消费税 15%）=23.06%；行邮税 13/20/50 三档+50 元免征额。
- 劳务报酬：≤4000 减 800；>4000 ×(1−20%)；20/30(速扣2000)/40(速扣7000)；稿酬再 ×70%。锚点：3000→440、10000→1600、30000→5200、稿酬 10000→1120。
- 太阳几何（忽略折射）：北京(39.9°N) 冬至正午 alt=90−39.9−23.44=26.66°；春分正午≈50.1°。
- 统计：z(0.975)=1.959964、t(0.975,df=9)=2.262、χ²(df=1,α=0.05)=3.841。
- 摸鱼：月薪 10000 → 10000/(21.75×8×3600)=0.01596 元/秒。
- Q7.8：0x0555=1365/256=5.33203125。
- 陶艺：干燥 5%+烧成 8% 复合 = 1−0.95×0.92=12.6%（线性）。
- 查表类（砂浆 JGJ/T 98、开数、Gas Mark、喷绘视距、收镖表、医疗期、工伤月数、粘度经验式、镀层电化当量、GB 50034 照度值）一律"以官方/权威原文为准自核"，不给死表。

## 五、配套计划

- personas：硬件工程师 +3（cctv/nvr/poe）、建筑施工 +4（新风/风管? 归暖通→建筑施工/地暖/砂浆/地板/窗帘 择优）、机修 +1（焊接）、手工 +2（陶艺/缝纫）、法律个人 +3（工伤/病假/劳务报酬）、实验室 +1（统计套件归质量/实验室择一）——**8 个饱和画像不加任务**。
- collections：+3（监控安防工具箱 / 统计检验工作台 / 装修收尾计算器），视聚合聚簇情况微调。
- wiki：+6（置信区间/t 检验/露点/跨境电商综合税/劳务报酬预扣/纸张开数）。
- 推文：每批 4-5 篇，date 用构建时刻往前推 2-3 小时。
- 图标：预计补 Ruler/Compass/Blinds/Flame/Wind/Snowflake/Sun/Lamp/Dices/Swords/Target/Trophy/Timer 等（先核 lucide 0.556 导出与 toolIcons 现池）。
- 验证：每批 SFC 全编译 + dev SSR(:3105) curl 200 + 日志 grep [500] + QA 脚本；批末跑 sitemap/llms/tutorials 链。
