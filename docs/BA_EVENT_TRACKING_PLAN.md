# 百度统计自定义事件埋点方案（2026-11-05 起）

背景：此前 hm.js 只记 PV，工具质量只能靠停留时长（存在 120s 封顶截断）与跳失率间接推断。
本方案给工具的**关键动作**加自定义事件，下次导出明细即可按「完成转化」直接分析。

## 实现

- `src/utils/track.js`：`trackEvent(category, action, label, value)`，内部守卫 `import.meta.client` + `window._hmt` 数组（hm.js 仅生产注入，dev 下静默跳过）。
- 事件名三层结构与百度统计「事件分析」对齐：**category（事件类别）/ action（事件名称）/ label（事件标签）**，后台可按 label=工具id 聚合出单工具转化率 = 事件次数 / 该工具 PV。

## 事件字典（当前全部已埋）

| category | action | label | 含义 |
|---|---|---|---|
| 工具结果 | 复制 | 工具 id | 用户复制了工具产出（结果可带走的行为信号） |
| 工具转化 | 查询成功 | 工具 id | 查询类工具拿到有效结果（whois-lookup） |
| 工具转化 | 连接成功 | 工具 id | 连接类工具握手成功（websocket-test） |
| 工具转化 | 发送消息 | 工具 id | 完成一次消息收发动线（websocket-test） |
| 工具转化 | 转换完成 | 工具 id | 转换类工具成功产出（audio-converter） |
| 工具转化 | 打印 | 工具 id | 触发打印（id-card-print-layout） |
| 工具转化 | 下载 | 工具 id | 触发文件下载（id-card-print-layout） |
| 工具转化 | 录制完成 | 工具 id | 录屏产出文件（screen-recorder，空录制不报） |
| 工具转化 | 导出图片 | 工具 id | Canvas 导出（photo-timestamp-watermark，blob 失败不报） |

## 已埋页面（16 页）

复制类：vat-calculator、ip-subnet-calculator、xingce-score-estimator、sunrise-sunset、
decibel-meter、prepayment-calculator、mac-address-convert、unicode-convert、
week-calculator、thread-reference-table、whois-lookup、websocket-test（日志行复制/复制全部）
转化类：whois-lookup、audio-converter、id-card-print-layout（打印+下载双事件）、
screen-recorder、photo-timestamp-watermark、websocket-test（连接成功+发送消息）

## 新工具埋点规范

新工具页按需接入，原则：
1. 有「可复制的结果」→ 加复制按钮并报 `工具结果/复制/<id>`；
2. 有「产出文件」类动作（转换/导出/打印/下载）→ 报 `工具转化/<动作>/<id>`；
3. 只报**成功**路径，失败不报；一次交互只报一次；
4. 不新增 category/action 枚举（扩展先改本文件），label 一律用工具 id。

## 分析口径（下次导出明细后）

- 明细导出不含自定义事件，需到百度统计后台「行为分析→事件分析」看，按 label 维度拆分；
- 核心指标：`复制+转化事件次数 / 工具 PV`＝产出率；对比改版前后同一指标；
- 注意与 PV 明细的 120s 封顶坑区分：事件计数无截断问题，是更可靠的「工具被真正用过」信号。
