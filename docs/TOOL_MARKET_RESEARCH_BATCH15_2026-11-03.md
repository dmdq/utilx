# 市场空白与高需求选品调研（第三轮）· 2026-11-03

> 背景：全站 684 款（第十三、十四批已消化上轮 28 款中的 20 款），日活约 300 IP，必应排名持续扩大。目标：第三轮调研，规划**不少于 30 款**新增。
> 方法：32 个新候选全库零撞车核查 → 5 组市场验证搜索（延迟退休/生育津贴/口算题卡/租房买房）→ 按需求×竞争×可行性三梯队分层。
> 结论：**新候选 32 款（三梯队 12/12/8）+ 原备选池 8 款 = 40 款路线图**，对应批十五~十七，全部纯本地浏览器可实现（1 款标注"重"）。
> 提案同步挂入 `docs/TOOL_BACKLOG.md` 第十五节。

---

## 一、本轮选品策略

1. **政策计算器是本站已被验证的强项**：劳动补偿（批十三）、二手房税费（批十三）、延迟退休（本轮）都属于"SERP 全是文章、交互工具少"的赛道，且天然带政策更新流量。
2. **打印簇继续加深**：证件照排版、52 周存钱表、日历验证了"A4 打印"是本站差异化能力，教育打印（口算题卡、数独）是其中需求频次最高的子类（家长每天用）。
3. **健身与音乐补齐"自我量化"心智**：反应测试、节拍器、调音器已有，1RM、HIIT 计时、和弦图、听辨训练让"练习室"和"健身房"两个场景成簇。
4. **开发者小工具保持"经典款"节奏**：chmod、curl 构建器、json-to-go/pydantic 都是十年常青需求，实现小、词根稳。
5. **避开的坑**：需要外部数据/API 的（股价、车牌、快递）、AI 生成类（违纯本地）、超敏感法律文书（合同、证明文件）。

---

## 二、第一梯队（12 款，建议=批十五）

| # | 工具 | id（零撞车已核） | 分类 | 需求证据 | 可行性 |
|---|---|---|---|---|---|
| 1 | 租房还是买房计算器 | rent-vs-buy-calculator | finance | **简体中文真空**：仅繁体 MiniWebtool 与海外英文站；租售比 1:200-1:300 国际标准是现成讲解素材 | 高 |
| 2 | 生育津贴计算器 | maternity-allowance-calculator | finance | 公式标准（单位月均缴费工资÷30×产假天数）；竞品仅百度实验室简单版+深蓝保；**各地奖励假 98+30~90 天差异表**是差异位 | 高 |
| 3 | 延迟退休年龄计算器 | retirement-age-calculator | finance | 需求巨大（m12333/东方财富/本地宝/人社部官方均有）；差异化=弹性提前/延迟区间+最低缴费年限+干净无广告 | 高 |
| 4 | 口算题卡生成器 | math-worksheet-printer | others | 家长每日高频打印；竞品中等（教育屋/365Lab/开源项目）；差异=竖式、带余数除法、求算数项、无广告本地版 | 高 |
| 5 | 数独生成打印器 | sudoku-printer | others | 打印解谜常青；中文免费干净版少 | 中 |
| 6 | 1RM 力量计算器 | one-rep-max-calculator | health | 健身三大常青公式之一（Epley/Brzycki 多公式对照+百分比训练表） | 高 |
| 7 | HIIT 间歇计时器 | interval-timer | health | 训练/跳绳/操课高频；WebAudio 提示音+全屏大字+循环组数 | 高 |
| 8 | 盈亏平衡计算器 | break-even-calculator | finance | 创业/小店高频（固定成本/单价/变动成本→保本量额+安全边际） | 高 |
| 9 | chmod 权限计算器 | chmod-calculator | dev | 十年经典款（勾选 rwx→755/六位八进制/递归说明） | 高 |
| 10 | curl 命令构建器 | curl-command-builder | dev | 与站内 curl-to-code 反向；表单填 method/headers/body→带转义的多平台命令 | 高 |
| 11 | 关键词密度检查器 | keyword-density-checker | text | SEO 写手/站长高频（词频 TopN+双字词+密度警示带） | 高 |
| 12 | 海报生成器 | poster-generator | design | 促销/招聘/课程海报 SMB 高频；Canvas 模板路线已被邀请函验证 | 中 |

### 重点规格提示（写入实施任务书）

- **rent-vs-buy**：两侧全成本模型（购房=首付机会成本+月供利息+物业维修+交易税费；租房=租金+租金上涨+押金机会成本）→ 累计成本交叉年份+"租售比"标注 + 涨租/房价增值/理财收益三参数敏感性。
- **retirement-age**：严格按 2024 人大决定对照表（男 60→63 每 4 个月+1；女干部 55→58 每 4 个月+1；女工人 50→55 每 2 个月+1），输出法定退休年月+弹性提前/延迟区间+2030 起最低缴费年限逐步+6 个月提示；页面放官方口径链接与免责。
- **maternity-allowance**：内置各省奖励假天数预设表（广东 158、上海 158 等，可编辑），产检/难产/多胞胎加减项，"津贴 vs 产假工资就高+差额补足"说明。
- **math-worksheet**：题型至少含 加减法(进退位开关)/乘法(九九)/除法(带余数开关)/混合两步/竖式版/比大小/填空（□）；每页题数/列数/字号；答案页可选；A4 双栏打印。
- **sudoku-printer**：终盘生成+挖洞（难度=挖洞数与对称性），唯一解校验（行列排除回溯计数），4 难度+每页 N 题+答案页。
- **poster-generator**：3 场景模板（促销/招聘/课程）×6 配色，字段区（标题/副题/亮点 3 行/时间地点/二维码可选——复用站内 qrcode 产物 dataURL），1800×2400 导出。

---

## 三、第二梯队（12 款，建议=批十六）

| # | 工具 | id | 分类 | 一句话 | 可行性 |
|---|---|---|---|---|---|
| 13 | 定价计算器 | pricing-calculator | finance | 成本加成/目标毛利反推售价/划线价心理价位三模式 | 高 |
| 14 | LTV/CAC 计算器 | ltv-cac-calculator | calculate | 客户终身价值与获客成本比值、回收期、健康线 3:1 判定 | 高 |
| 15 | JSON 转 Go Struct | json-to-go-struct | dev | 嵌套 struct+json tag+可导出命名（对标 json-to-typescript 的 Go 版） | 高 |
| 16 | JSON 转 Pydantic | json-to-pydantic | dev | v2 BaseModel+字段类型推断+Optional 判定 | 高 |
| 17 | .editorconfig 生成器 | editorconfig-generator | dev | 勾选缩进/字符集/换行→标准 ini | 高 |
| 18 | Prettier 配置生成器 | prettier-config-generator | dev | 可视化选项→.prettierrc JSON+一行安装命令 | 高 |
| 19 | 婴儿喂养记录器 | baby-feed-tracker | health | 新手爸妈刚需：亲喂/瓶喂/换尿布计时+今日时间线+每日小结（localStorage） | 中 |
| 20 | 戒烟账本 | quit-smoking-calculator | health | 戒烟天数+省钱累计+健康恢复时间线（20 分钟/12 小时/1 年口径） | 高 |
| 21 | 情绪日记 | mood-tracker | health | 每日 5 档情绪+一句话记录+月度曲线（localStorage） | 中 |
| 22 | 吉他和弦图查询 | chord-chart-viewer | others | 常用和弦指法 SVG 指板图+按品标注+同名移调（与调音器/节拍器成"练习室"簇） | 中 |
| 23 | 音程听辨训练 | ear-training-trainer | others | 随机两音播听辨音程/和弦性质，正确率曲线（WebAudio） | 中 |
| 24 | 鞋码对照转换 | shoe-size-converter | calculate | 中/欧/美/英/日/厘米互转表+男女童分栏（跨境购高频） | 高 |

---

## 四、第三梯队（8 款，批十七或机动）

| # | 工具 | id | 分类 | 一句话 | 可行性 |
|---|---|---|---|---|---|
| 25 | 视频裁剪器 | video-trimmer | file | 时间段裁剪导出（MediaRecorder 重编码路线，同视频压缩模式） | **重** |
| 26 | 音频拼接器 | audio-merger | file | 多段音频按序合并+间隙设置（WebAudio buffer 拼接） | 中 |
| 27 | 音频变速器 | audio-speed-changer | file | 0.5-3 倍变速导出（语言学习高频；playbackRate 试听+重编码导出） | 中 |
| 28 | 作息计划表打印 | daily-routine-printer | others | 每日时间块表（起床/学习/运动/睡觉）A4 打印，儿童暑假场景 | 高 |
| 29 | 护眼提醒器 | eye-rest-timer | health | 20-20-20 法则提醒（标签页存续期内计时+提示音） | 高 |
| 30 | 植物浇水提醒 | plant-watering-tracker | others | 植物清单+浇水周期+到期高亮（localStorage） | 高 |
| 31 | 生肖年份速查 | zodiac-lookup | time | 出生年→生肖+干支+下一个本命年（轻量内容型） | 高 |
| 32 | 体感温度计算 | feels-like-temperature-calculator | calculate | 温度+湿度+风速→体感温度（热指数/风寒公式），夏冬话题流量 | 高 |

## 五、原备选池 8 款（并入路线图机动池）

flashcard-printer（单词卡打印）/ random-quiz-picker（随机抽题）/ molar-mass-calculator（分子量）/ phone-attribution-lookup（手机号归属，需数据包）/ virtual-piano（虚拟钢琴）/ batch-rename-tool（批量重命名，FSA）/ compound-interest-calculator（复利，需与 investment 差异化）/ business-scope-generator（经营范围模板库）。

**两轮合计路线图：32 新 + 8 池 = 40 款。**

---

## 六、明确弃选（本轮结论）

| 方向 | 弃选原因 |
|---|---|
| 股价/K 线/基金查询 | 依赖行情 API，违纯本地 |
| 车牌估价/新车落地价 | 数据垄断（此前已弃购车落地价） |
| 电子签名/合同生成 | 法律合规风险高于收益 |
| 在职/收入证明生成器 | 伪造滥用风险，宁可不做 |
| 儿童绘本/头像 AI 生成 | 依赖云端 AI，违品牌承诺 |
| 菜谱推荐/厨房百科 | 内容型非工具型 |
| 域名估价/外链分析 | 第三方数据源不稳定 |
| 录音转文字 | Chrome 方案走云端（沿用上轮弃选） |

---

## 七、批次路线图与配文规划

- **批十五（12 款）**：政策账 3（退休/生育津贴/租买对比）→《人生三笔大账：退休年龄、生育津贴和要不要买房》；健身 2（1RM/HIIT）→《健身房的数字装备》；家长打印 2（口算/数独）→《每晚八点的两张纸》；开发 2（chmod/curl）→ 散文并入开发合集；散 3（keyword-density/poster/break-even）。
- **批十六（12 款）**：B 端财务 2（定价/LTV-CAC）+盈亏平衡若未入批十五；开发者配置 4（json-to-go/pydantic/editorconfig/prettier）；家庭健康 3（喂养/戒烟/情绪）；音乐 2（和弦/听辨）+鞋码。
- **批十七（8 款 + 池 8 机动）**：媒体 3 + 打印 1 + 提醒 2 + 轻查询 2；池内 8 款按主题搭车。
- 三批做完全站 **724 款**；每批 5-6 篇推文维持覆盖率红线。

## 八、主要调研来源

- 延迟退休竞争格局与政策口径：[m12333 计算器](https://m12333.cn/qa/ppkmc.html)、[tuixiu.xuecan](https://tuixiu.xuecan.net)、[东方财富](https://marketing.dfcfs.com/views/delaycalc/index)、[本地宝](https://m.sh.bendibao.com/mtools/tuixiunianling)、[对照表（知乎）](https://zhuanlan.zhihu.com/p/13664206434)
- 生育津贴公式与产假差异：[百度互动实验室计算器](https://ife.baidu.com/calculate/maternity-allowance-calc.html)、[北京丰台区政府](https://www.bjfsh.gov.cn/ztzx/2024/2024hyzt/syfw/wyw/202411/t20241121_40083011.shtml)、[深圳医保局](https://hsa.sz.gov.cn/gkmlpt/content/12/12267/post_12267943.html)、[深蓝保 158 天计算](https://www.shenlanbao.com/he/339638)
- 口算题卡需求与竞品：[教育屋](https://www.jiaoyuwu.com/calculate)、[365Lab](https://www.bgrdh.com/sites/57764.html)、[Gitee 开源项目](https://gitee.com/J_Sky/PrimarySchoolMathematics)、[知乎家长经验](https://zhuanlan.zhihu.com/p/636909222)
- 租房买房中文真空证据：[MiniWebtool 繁体版](https://miniwebtool.com/zh-tw/租房vs買屋計算機)、[Orchard（英文）](https://orchard.com/rent-vs-buy-calculator)、[租售比国际标准（百度文库）](http://doc360.baidu.com/view/c62eb9b40422192e453610661ed9ad51f01d549d.html)
