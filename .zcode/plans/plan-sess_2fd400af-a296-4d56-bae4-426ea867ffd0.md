# WebSocket 测试页调试体验重设计

## Context（为什么改）

数据面：websocket-test PV 16、停留中位仅 **7s**、跳失 80%（本次分析数据）——开发者连上试一下就走，页面没有留住调试动线。
代码面（`src/pages/tools/websocket-test.vue`，753 行）审查出的硬伤：

1. **动线是 Z 字形**：连接配置（左上卡）→ 发送（左中卡）→ 消息记录（右栏），改参数→发送→看结果要来回跳
2. **日志是聊天气泡风**：每条消息占一大块（头像圆圈+气泡），信息密度极低，600px 固定高度看不了几条
3. **真 bug**：`onerror` 读 `event.message`（WebSocket error 事件没有该属性）→ 永远显示「连接错误：未知错误」；`system/error` 类型消息在模板里走 else 分支被渲染成绿色「接收」图标
4. **时间戳只有秒级**（`toLocaleTimeString`），无收发时序分析可能
5. **二进制不可用**：收发都显示 `[二进制数据]`，无大小、无 hex 预览
6. **无过滤/搜索/复制/重发/导出**；100 条上限静默截断
7. 断线后 `connectionInfo=null` 卡片直接消失，无重连；心跳是硬编码 `'ping'` 文本
8. 顺带：无 JSON-LD（P1 批次漏网）、relatedTools 是自写硬编码（未用全站 RelatedTools 组件）、无埋点

## 布局方案（桌面 ≥lg）

```
┌─────────────────────────────────────────────────────────┐
│ Hero（紧凑，不变内容）                                      │
├─────────────────────────────────────────────────────────┤
│ ① 连接命令栏（一行式，全宽）：URL(flex-1,mono+URL历史datalist) │
│    子协议(w-32) │ 示例(w-40) │ 连接/断开按钮 │ 状态徽章       │
├──────────────────────────────────┬──────────────────────┤
│ ② 消息日志（终端行风，lg:col-span-2）│ ③ 侧栏（lg:col-span-1）│
│  工具条：过滤Tab(全部/发送/接收/系统/ │  ③a 发送构造器：       │
│   错误)+搜索框+自动滚动+复制全部+    │   类型 segmented       │
│   导出JSON+清空                    │   (文本/JSON/二进制/HEX) │
│  日志行（等宽字体，单行截断）：        │   内容textarea(Ctrl+↵发) │
│   ms时间戳 ▲/▼/⚙/✗ 内容预览 大小    │   发送+最近payload历史   │
│   hover: 复制/重发；点击行展开详情     │  ③b 连接统计卡：        │
│  （JSON pretty / 二进制hex+ASCII）  │   连接时间/时长/收发数/  │
│  高度 lg:h-[calc(100dvh-300px)]    │   字节数+自动心跳+自动重连│
│  min-h-[520px]                    │                      │
├──────────────────────────────────┴──────────────────────┤
│ SEO 长尾区（保留，功能清单更新+新增「关闭码含义」节）          │
│ RelatedTools 组件（替换自写推荐，对齐全站）+ 新增 JSON-LD      │
└─────────────────────────────────────────────────────────┘
移动端：命令栏换行堆叠，日志区固定 h-[420px]，侧栏下移。
```

核心取舍：连接配置升为顶部命令栏（省掉整张左卡，动线变「一行连上→盯着日志→右侧发消息」）；日志从气泡改**终端行风**（密度×3，同屏消息数 ×5 以上），echo 场景一眼看出收发时序。

## 功能增强（全部纯前端，无新依赖）

- **消息行**：`HH:MM:SS.mmm` 毫秒时间戳 + 距上条间隔 Δms；方向徽章着色（发送=primary、接收=green、系统=灰、错误=destructive——修掉 system/error 错渲染 bug）；字节数；行 hover 出复制/重发按钮；点击行展开详情（JSON 缩进美化 / 二进制 hex+ASCII 预览前 256 字节）
- **过滤与搜索**：方向 Tab + 文本包含匹配（computed `filteredMessages`）；消息上限提到 200，触发丢弃时插一条 system 提示（不静默）
- **二进制升级**：接收 Blob → `arrayBuffer()` 存 Uint8Array，显示字节数+hex/ASCII 预览；发送新增 **HEX 模式**（`48 65 6c` 格式输入，正则校验+奇数长度报错，转 Uint8Array 发送）
- **可靠性**：`onerror` 修复（显示通用错误+引导看关闭码）；`onclose` 常见关闭码中文释义表（1000/1001/1006/1015 等 10 个）；**自动重连**开关（非手动断开时 3s 间隔重试，最多 5 次，日志记录尝试）；**自动心跳**开关+间隔输入（默认 30s 发 `ping`），组件卸载/断开时清理 interval
- **动线**：URL 历史（连接成功去重入 datalist，最多 10）；payload 历史（发送成功入最近 20 条，点击回填）；Ctrl+Enter 发送
- **导出**：日志导出 JSON 文件下载 + 复制全部（文本拼接）
- **埋点**：连接成功 → `trackEvent('工具转化','连接成功','websocket-test')`；发送 → `工具转化/发送消息`（复用 `~/utils/track`，事件字典文档同步补两行）
- **一致性**：硬编码 relatedTools 换 `RelatedTools` 组件（category=network）；补 JSON-LD（WebApplication+Offer，与 vat-calculator 同构）；SEO 区「核心功能」清单同步新功能，新增 H2「WebSocket 关闭码含义对照」（长尾 SEO）

## 技术要点

- 单文件重写 `src/pages/tools/websocket-test.vue`（模板+script 全换，SEO 长文保留迁移）；不改注册表、不新增组件文件
- 消息数据结构：`{ id(自增), type: sent|received|system|error, format: text|json|binary|hex, data, size, timestamp, Δms }`；二进制 data 存 `{ bytes: Uint8Array }`，渲染时才算 hex（避免模板里重复转）
- SSR 安全：连接/心跳/重连全部在事件回调与 onUnmounted 清理；`v-if` 守卫可空对象（week-calculator 教训）
- 双主题：颜色全用 token（沿用页面既有 `bg-green-100 dark:bg-green-900/20` 系列模式 + `bg-muted/border-border/text-muted-foreground`）；日志行风格对齐 log-viewer 的 `font-mono text-xs leading-5` 终端风
- 不用 `v-show` 访问可空链；textarea 等输入控件 `border border-border`（宽度+颜色成对写）

## 验证

1. 编译与 SSR：起 dev（:3105）→ `curl /tools/websocket-test` 200 + 日志无 `[500]`（tail 全程 grep）
2. **端到端真连接**：node_modules 里现成 `ws@8.18.3`，写一个临时 echo 服务器（/tmp 下，不入仓库）跑在 127.0.0.1:3106；headless Chrome（CDP，等真水合）打开页面 → 连 `ws://127.0.0.1:3106` → 发文本/JSON/HEX → 截图验证：日志出现毫秒时间戳行、JSON 展开详情、hex 预览、统计卡字节数增长；再杀服务器验证 `1006 异常关闭` 释义与自动重连日志
3. 双主题截图各一张（CDP `localStorage.theme` 切换法，浅色下确认无隐形边框/文字）

## 涉及文件

- 重写：`src/pages/tools/websocket-test.vue`（唯一代码文件）
- 文档：`docs/BA_EVENT_TRACKING_PLAN.md` 补 2 行事件
- 临时（不入仓库）：/tmp 下 ws echo 服务器脚本
