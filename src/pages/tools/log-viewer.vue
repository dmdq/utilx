<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Terminal class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">日志着色查看器</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴日志本地解析：ERROR/WARN/INFO/DEBUG 整行着色、关键词与 /正则/ 过滤、堆栈异常聚合</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线日志查看器：把程序日志整段粘贴进来，自动按 ERROR / WARN / INFO / DEBUG 级别给整行加左边框与浅底着色，识别行首 [ERROR]、ERROR␣、error: 等常见标记，并抽取 ISO / [时刻] / 裸时刻三种时间戳；
        以空格开头的 at / Caused by 堆栈行自动继承上一行级别，多行异常完整跟色。支持关键词（不区分大小写）与 /正则/ 两种过滤写法，命中片段黄底高亮，并按异常类名聚合 Top5 帮你定位报错热点。
        全部解析在浏览器内存中完成，日志不上传、不落盘，关页面即走。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Terminal class="w-5 h-5 mr-2 text-primary" /> 粘贴日志
        </h2>

        <div class="relative">
          <textarea
            v-model="logText"
            class="w-full h-[20rem] px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴多行程序日志，例如：&#10;2026-11-03 12:00:00.123 ERROR [main] c.a.OrderService - createOrder failed&#10;java.lang.NullPointerException: order is null&#10;&#9;at com.a.OrderService.run(OrderService.java:42)"
            spellcheck="false"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          ></textarea>
          <div
            v-if="dragging"
            class="absolute inset-0 z-10 rounded-lg border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center text-sm font-medium text-primary pointer-events-none"
          >
            松开鼠标载入 .log / .txt 文件
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          也可把 .log / .txt 文件直接拖进上方输入框读取；超过 5MB 会自动截断，日志不会离开你的浏览器。
        </p>

        <p
          v-if="truncateNote"
          class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ truncateNote }}</span>
        </p>
        <p
          v-if="fileNote"
          class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ fileNote }}</span>
        </p>

        <div class="flex gap-2">
          <button
            @click="loadSample"
            class="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="clearAll"
            class="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 清空
          </button>
        </div>
      </div>

      <!-- 右：解析展示（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Search class="w-5 h-5 mr-2 text-primary" /> 解析结果
        </h2>

        <!-- 统计条：总行数 + 五级别 -->
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div class="bg-muted/40 border border-border rounded-lg p-2.5 text-center">
            <p class="text-[10px] text-muted-foreground mb-0.5">总行数</p>
            <p class="text-xl font-bold text-foreground">{{ totalLines }}</p>
          </div>
          <button
            v-for="card in LEVEL_CARDS"
            :key="'card-' + card.id"
            type="button"
            class="rounded-lg p-2.5 text-center border transition focus:outline-none"
            :class="cardClass(card.id)"
            :title="levelActive[card.id] ? '点击隐藏该级别' : '点击显示该级别'"
            @click="toggleLevel(card.id)"
          >
            <p class="text-[10px] mb-0.5 opacity-80 font-mono">{{ card.label }}</p>
            <p class="text-xl font-bold">{{ levelStats[card.id] }}</p>
          </button>
        </div>

        <p v-if="hasLines && levelStats.ERROR === 0" class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle class="w-3.5 h-3.5" /> 当前日志没有 ERROR 级别的行
        </p>

        <!-- 过滤工具行：级别 chips + 关键词/正则 + 复制 -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="chip in LEVEL_CARDS"
            :key="'chip-' + chip.id"
            type="button"
            class="px-2.5 py-1 rounded-full border text-xs font-mono font-medium transition"
            :class="cardClass(chip.id)"
            @click="toggleLevel(chip.id)"
          >
            {{ chip.label }} · {{ levelStats[chip.id] }}
          </button>

          <input
            v-model="filterInput"
            type="text"
            class="flex-1 min-w-[14rem] px-3 py-1.5 bg-background border border-border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="关键词（不区分大小写）或 /正则/，如 /timeout\d*/i"
            spellcheck="false"
          />
          <button
            @click="copyFiltered"
            :disabled="!filteredCount"
            class="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制结果
          </button>
        </div>
        <p v-if="copyState" class="text-xs text-green-600 dark:text-green-400">{{ copyState }}</p>
        <p v-if="filterError" class="text-xs text-red-500">{{ filterError }}（已按不过滤处理）</p>

        <!-- 着色日志视图（默认渲染前 2000 行） -->
        <div class="rounded-lg border border-border bg-background overflow-hidden">
          <div v-if="renderedEntries.length" class="max-h-[26rem] overflow-y-auto p-2 font-mono text-xs leading-5">
            <div
              v-for="entry in renderedEntries"
              :key="entry.no"
              class="border-l-4 pl-2 pr-1 py-px whitespace-pre-wrap break-all"
              :class="LEVEL_ROW_STYLE[entry.level]"
              v-html="entry.html"
            ></div>
          </div>
          <p v-else class="py-20 px-6 text-center text-sm text-muted-foreground">{{ viewEmptyText }}</p>
        </div>
        <p v-if="filteredCount > RENDER_LIMIT" class="text-xs text-muted-foreground text-center pt-1">
          已显示前 {{ RENDER_LIMIT }} 行，共 {{ filteredCount }} 行——级别与关键词过滤可缩小范围
        </p>

        <!-- ERROR 聚合小卡 -->
        <div v-if="errorClusters.length" class="bg-muted/40 border border-border rounded-lg p-4">
          <h3 class="text-sm font-semibold text-foreground flex items-center mb-2">
            <TriangleAlert class="w-4 h-4 mr-1.5 text-red-500" /> ERROR 聚合 Top {{ errorClusters.length }}（按首个非时间戳 token 粗聚类）
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div v-for="(c, i) in errorClusters" :key="c.key" class="flex items-center gap-2 text-xs">
              <span class="w-4 text-muted-foreground font-mono">{{ i + 1 }}.</span>
              <span class="font-mono text-foreground truncate" :title="c.key">{{ c.key }}</span>
              <span class="ml-auto text-muted-foreground whitespace-nowrap">× {{ c.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 静态提示条 -->
    <div class="bg-muted/50 border border-border rounded-lg px-4 py-3 mb-6 text-xs text-muted-foreground flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>日志只在浏览器内存中处理，粘贴进来关页面即走；正则过滤写法 /pattern/ 与 grep 兼容常用子集。</span>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>日志着色查看器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          日志着色查看器是一款纯前端的日志阅读工具：把程序日志粘贴进来后，逐行识别级别（ERROR / WARN / INFO / DEBUG，TRACE 并入 DEBUG 口径），给整行加彩色左边框与浅底，
          并抽取行内时间戳、识别缩进的 at / Caused by 堆栈行并继承上一行级别，多行异常块会作为一个整体被着色。右侧提供级别多选 chips、关键词与 /正则/ 过滤（命中片段黄底高亮）、
          ERROR 行按首个非时间戳 token 的 Top5 聚合，以及一键复制过滤结果。适合临时排查线上报错、读别人发来的日志片段，或在没有终端环境时快速给日志上色。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">日志级别怎么分？ERROR / WARN / INFO / DEBUG 的口径</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>ERROR：操作失败、需要人处理——请求 500、连接不上、任务中断、抛出未捕获异常。</li>
          <li>WARN：有风险但程序已自行兜底——慢查询、重试、降级、配置缺省、磁盘水位偏高。</li>
          <li>INFO：关键业务节点与生命周期事件——服务启动、定时任务执行、出入参摘要、状态迁移。</li>
          <li>DEBUG：开发排查细节——变量取值、SQL、循环内部状态；TRACE 是最细粒度追踪，本工具统一按 DEBUG 着色统计。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么看 Java 堆栈异常（Caused by 链）？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          先读第一行「异常类名: 消息」，at 开头的行是调用路径，最上面的 at 离抛出点最近；出现「Caused by:」说明底层还包着一个更根因的异常，
          一段日志里最后一个 Caused by 往往才是真正的问题源头（前面的异常只是它向外传播的包装）。本工具会把整个堆栈块（at、Caused by、… N more、异常类名行）
          继承首行的级别一起着色，方便一眼圈出完整异常块，并按异常类名聚合同类报错。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和 grep / tail 有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          grep 擅长在大文件里精确筛行，但需要终端与管道，且没有级别语义；本工具面向临时排查与阅读：粘贴即解析、自动按级别着色、聚合 ERROR 异常类、黄底标出命中片段，
          /pattern/ 写法与 grep 兼容常用子集。几 MB 以内的日志片段用这里最顺手；如果是几十 GB 的滚动日志，仍建议先 grep 再把关键片段粘过来着色细看。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">日志里的时间戳格式有哪些？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          常见三类：完整日期时间（如 2026-11-03 12:00:00.123，兼容 T 分隔、逗号毫秒与时区后缀的 ISO 风格）、方括号时刻（[12:00:00]）、裸时刻（12:00:00）。
          本工具会抽取行内第一处时间戳，并在判断级别前先剥掉行首时间戳，保证「时间戳 + 级别 + 消息」这类标准布局也能正确识别级别。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">日志级别 ERROR / WARN / INFO / DEBUG 怎么划分？</h3>
            <p class="text-sm text-muted-foreground mt-1">通行口径：ERROR 是需要处理的失败（请求 500、连接失败、未捕获异常）；WARN 是已自行兜底的风险（重试、降级、慢查询）；INFO 是关键业务节点（启动、定时任务、状态迁移）；DEBUG 是排查细节，TRACE 作为最细粒度追踪在本工具中并入 DEBUG 着色统计。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么快速看懂 Java 堆栈的 Caused by 链？</h3>
            <p class="text-sm text-muted-foreground mt-1">第一行是表面异常，每个 Caused by 是更底层的原因，最后一个 Caused by 通常才是根因；at 行从上往下离抛出点由近及远。本工具会把整个异常块继承首行级别着色，不需要手动区分哪些行属于异常。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">这个工具和 grep 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">grep 面向终端里的大文件精确筛行；本工具面向粘贴即看的临时排查：自动按级别着色、堆栈跟色、异常类聚合与命中高亮，/pattern/ 过滤写法与 grep 兼容常用子集，适合几 MB 以内的日志片段。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">日志里的时间戳都支持哪些格式？</h3>
            <p class="text-sm text-muted-foreground mt-1">支持 ISO 完整日期时间（2026-11-03 12:00:00.123，兼容 T 分隔与时区）、方括号时刻（[12:00:00]）与裸时刻（12:00:00）三类，抽取行内第一处；识别级别前会先剥掉行首时间戳。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">粘贴的日志会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。解析、着色、过滤与聚合全部在浏览器内存中完成，不发送任何网络请求，也没有本地存储；关闭或刷新页面后日志立即消失，含敏感信息的日志也可以放心粘贴。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'log-viewer'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Terminal, Search, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '日志着色查看器 - 在线日志级别分类与 ERROR 过滤工具',
  description: '免费在线日志查看器：粘贴程序日志自动按 ERROR/WARN/INFO/DEBUG 着色，抽取时间戳、堆栈行继承级别，支持关键词与 /regex/ 过滤、命中黄底高亮、ERROR 异常类 Top5 聚合与一键复制，纯浏览器本地处理不上传',
  keywords: '日志分析,log viewer,日志着色,ERROR 过滤,日志级别',
  author: '有条工具',
  ogTitle: '日志着色查看器 - 在线日志级别分类与 ERROR 过滤工具 | 有条工具',
  ogDescription: '粘贴日志自动按级别着色，关键词与 /regex/ 过滤，ERROR 异常聚合，本地处理不上传。',
  ogUrl: 'https://www.util.cn/tools/log-viewer',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '日志着色查看器',
          url: 'https://www.util.cn/tools/log-viewer',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['ERROR/WARN/INFO/DEBUG 级别整行着色', 'ISO/方括号/裸时刻三种时间戳抽取', '堆栈行继承上一行级别', '关键词与 /regex/ 过滤并黄底高亮', 'ERROR 异常类 Top5 聚合', '复制过滤结果', '.log/.txt 文件拖入', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '日志着色查看器', item: 'https://www.util.cn/tools/log-viewer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '日志级别 ERROR/WARN/INFO/DEBUG 怎么划分？',
              acceptedAnswer: { '@type': 'Answer', text: 'ERROR 是需要处理的失败（请求500、连接失败、未捕获异常）；WARN 是已自行兜底的风险（重试、降级、慢查询）；INFO 是关键业务节点（启动、定时任务、状态迁移）；DEBUG 是排查细节，TRACE 作为最细粒度追踪在本工具中并入 DEBUG 着色统计。' }
            },
            {
              '@type': 'Question',
              name: '怎么快速看懂 Java 堆栈的 Caused by 链？',
              acceptedAnswer: { '@type': 'Answer', text: '第一行是表面异常，每个 Caused by 是更底层的原因，最后一个 Caused by 通常才是根因；at 行从上往下离抛出点由近及远。本工具会把整个异常块继承首行级别着色。' }
            },
            {
              '@type': 'Question',
              name: '这个工具和 grep 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'grep 面向终端里的大文件精确筛行；本工具面向粘贴即看的临时排查：自动按级别着色、堆栈跟色、异常类聚合与命中高亮，/pattern/ 过滤写法与 grep 兼容常用子集。' }
            },
            {
              '@type': 'Question',
              name: '日志里的时间戳都支持哪些格式？',
              acceptedAnswer: { '@type': 'Answer', text: '支持 ISO 完整日期时间（2026-11-03 12:00:00.123，兼容 T 分隔与时区）、方括号时刻（[12:00:00]）与裸时刻（12:00:00）三类，抽取行内第一处；识别级别前会先剥掉行首时间戳。' }
            },
            {
              '@type': 'Question',
              name: '粘贴的日志会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析、着色、过滤与聚合全部在浏览器内存中完成，不发送任何网络请求，也没有本地存储；关闭或刷新页面后日志立即消失。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_LOG_CHARS = 5 * 1024 * 1024 // 输入上限 5MB，超出截断
const RENDER_LIMIT = 2000             // 日志视图默认最多渲染行数
const TOP_CLUSTER = 5                 // ERROR 聚合展示条数
const MAX_HL_RANGES = 200             // 单行最多高亮片段数（防极端长行卡顿）

// 级别 token → 统一口径（fatal/severe 等别名归并为 ERROR，warning→WARN，TRACE 并入 DEBUG 统计）
const LEVEL_ALIASES = {
  error: 'ERROR', err: 'ERROR', fatal: 'ERROR', critical: 'ERROR', severe: 'ERROR',
  warn: 'WARN', warning: 'WARN',
  info: 'INFO', notice: 'INFO',
  debug: 'DEBUG', trace: 'DEBUG'
}

// 三种常见时间戳：ISO 完整日期时间 / [12:00:00] 方括号时刻 / 12:00:00 裸时刻
const TS_ISO_SRC = '\\d{4}-\\d{1,2}-\\d{1,2}[T ]\\d{1,2}:\\d{2}:\\d{2}(?:[.,]\\d{1,6})?(?:Z|[+-]\\d{2}:?\\d{2})?'
const TS_BRACKET_SRC = '\\[\\d{1,2}:\\d{2}:\\d{2}(?:[.,]\\d{1,6})?\\]'
const TS_BARE_SRC = '\\b\\d{1,2}:\\d{2}:\\d{2}(?:[.,]\\d{1,6})?\\b'
const TS_ANY_RE = new RegExp(TS_ISO_SRC + '|' + TS_BRACKET_SRC + '|' + TS_BARE_SRC)
const TS_LEAD_RE = new RegExp('^\\s*\\[?\\s*(?:' + TS_ISO_SRC + '|' + TS_BRACKET_SRC + '|' + TS_BARE_SRC + ')\\s*\\]?\\s*')

// 级别前缀四种风格：[ERROR] / ERROR␣ / error: / level=error（大小写不敏感）
const LEVEL_WORDS_SRC = 'error|fatal|critical|severe|warning|warn|notice|info|debug|trace|err'
const LEVEL_RE = new RegExp(
  '^\\s*(?:' +
  '\\[\\s*(' + LEVEL_WORDS_SRC + ')\\s*\\]\\s*[:：]?' +
  '|(' + LEVEL_WORDS_SRC + ')(?=[\\s,|])' +
  '|(' + LEVEL_WORDS_SRC + ')\\s*[:：]' +
  '|level\\s*[=:]\\s*["\']?(' + LEVEL_WORDS_SRC + ')["\']?' +
  ')',
  'i'
)

// 堆栈/异常延续行：缩进 at / Caused by / ... N more / 缩进 File(Java回溯不缩进的 Python) / 顶格异常类名
const STACK_RE = new RegExp(
  '^(?:\\s+at\\s|\\s*Caused by[\\s:]|\\s+\\.{3}\\s*\\d+\\s+more|\\t(?:at\\s|\\.{3})|\\s+File\\s+["<]|[\\w.$]*(?:Exception|Error|Throwable)\\b(?:[\\s:,]|$))',
  'i'
)

function stripTsBrackets(ts) {
  return ts.replace(/^\[/, '').replace(/\]$/, '')
}

// 行首级别词匹配：返回命中的级别 token（未命中返回 null）
function matchLevelWord(s) {
  const m = LEVEL_RE.exec(s)
  return m ? (m[1] || m[2] || m[3] || m[4] || null) : null
}

// 单行识别：显式级别标记 > 堆栈延续（继承 prevLevel）> unknown；时间戳抽取与级别判定相互独立
function classifyLine(line, prevLevel) {
  const s = String(line == null ? '' : line)
  let word = matchLevelWord(s)
  if (!word) {
    const lead = TS_LEAD_RE.exec(s)
    if (lead && lead[0]) {
      const rest = s.slice(lead[0].length)
      word = matchLevelWord(rest)
      if (!word) {
        const rest2 = rest.replace(/^\s*\[[^\]]*\]\s*/, '') // 再跳过 [线程名] 一类方括号组
        if (rest2 !== rest) word = matchLevelWord(rest2)
      }
    }
  }
  if (word) {
    const m = TS_ANY_RE.exec(s)
    return { level: LEVEL_ALIASES[word.toLowerCase()] || 'unknown', ts: m ? stripTsBrackets(m[0]) : null }
  }
  if (STACK_RE.test(s)) return { level: prevLevel || 'unknown', ts: null }
  const m = TS_ANY_RE.exec(s)
  return { level: 'unknown', ts: m ? stripTsBrackets(m[0]) : null }
}

// 逐行分类并做堆栈级别继承（unknown 行不打断继承链）
function classifyLineStream(lines) {
  const out = []
  let prev = null
  for (let i = 0; i < lines.length; i++) {
    const r = classifyLine(lines[i], prev)
    out.push({ no: i + 1, raw: lines[i], level: r.level, ts: r.ts })
    if (r.level !== 'unknown') prev = r.level
  }
  return out
}

function classifyLog(text) {
  return classifyLineStream(String(text == null ? '' : text).split(/\r?\n/))
}

// 过滤表达式解析：'关键词' → text（不区分大小写）；'/pattern/flags' → regex（flags 限 gimsuy）；坏正则 → error
function parseFilterOf(input) {
  const raw = String(input == null ? '' : input).trim()
  if (!raw) return null
  const m = raw.match(/^\/(.+)\/([gimsuy]*)$/)
  if (m) {
    try {
      new RegExp(m[1], m[2])
      return { mode: 'regex', value: m[1], flags: m[2], error: null }
    } catch (e) {
      return { mode: 'regex', value: m[1], flags: m[2], error: '正则无效：' + ((e && e.message) || '语法错误') }
    }
  }
  return { mode: 'text', value: raw, flags: '', error: null }
}

// 由解析结果构造行匹配器（regex 去掉 g/y 标志，避免 lastIndex 状态污染 test）
function buildMatcher(filter) {
  if (!filter || filter.error) return function () { return true }
  if (filter.mode === 'regex') {
    let re
    try {
      re = new RegExp(filter.value, String(filter.flags || '').replace(/[gy]/g, ''))
    } catch (e) {
      return function () { return true }
    }
    return function (raw) { return re.test(String(raw)) }
  }
  const needle = filter.value.toLowerCase()
  return function (raw) { return String(raw).toLowerCase().indexOf(needle) !== -1 }
}

// 求命中片段区间（左闭右开），供「先转义再包 span」的安全高亮使用
function matchRangesOf(raw, filter) {
  const s = String(raw == null ? '' : raw)
  if (!filter || filter.error || !s) return null
  if (filter.mode === 'regex') {
    let re
    try {
      re = new RegExp(filter.value, String(filter.flags || '').replace(/[gy]/g, '') + 'g')
    } catch (e) {
      return null
    }
    const ranges = []
    let m = re.exec(s)
    while (m !== null) {
      if (m[0].length === 0) { // 空匹配（如 /a*/）手动前进，防死循环
        re.lastIndex += 1
        if (re.lastIndex > s.length) break
        m = re.exec(s)
        continue
      }
      ranges.push([m.index, m.index + m[0].length])
      if (ranges.length >= MAX_HL_RANGES) break
      m = re.exec(s)
    }
    return mergeRanges(ranges)
  }
  const needle = filter.value.toLowerCase()
  if (!needle) return null
  const hay = s.toLowerCase()
  const ranges = []
  let i = hay.indexOf(needle)
  while (i !== -1 && ranges.length < MAX_HL_RANGES) {
    ranges.push([i, i + needle.length])
    i = hay.indexOf(needle, i + needle.length)
  }
  return mergeRanges(ranges)
}

// 合并重叠/相邻区间
function mergeRanges(ranges) {
  if (!ranges.length) return []
  const sorted = ranges.slice().sort((a, b) => a[0] - b[0])
  const out = [sorted[0].slice()]
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1]
    if (sorted[i][0] <= last[1]) last[1] = Math.max(last[1], sorted[i][1])
    else out.push(sorted[i].slice())
  }
  return out
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 先按原串区间切段、逐段转义，再把命中段包上黄底 span（转义不改变切片边界，注入安全）
function highlightLineHtml(raw, ranges) {
  const s = String(raw == null ? '' : raw)
  if (!ranges || !ranges.length) return escapeHtml(s)
  let html = ''
  let pos = 0
  for (let i = 0; i < ranges.length; i++) {
    const start = Math.max(pos, ranges[i][0])
    const end = Math.max(pos, ranges[i][1])
    if (end <= start) continue
    if (start > pos) html += escapeHtml(s.slice(pos, start))
    html += '<span class="bg-yellow-300 text-zinc-900 rounded-sm px-0.5">' + escapeHtml(s.slice(start, end)) + '</span>'
    pos = end
  }
  if (pos < s.length) html += escapeHtml(s.slice(pos))
  return html
}

// ERROR 聚类的 key：剥行首时间戳与级别标记后，优先取含 Exception/Error/Throwable 的 token（取简单类名），否则取首个 token
function errorKeyOf(line) {
  let s = String(line == null ? '' : line).trim()
  if (!s) return '(空行)'
  const lead = TS_LEAD_RE.exec(s)
  if (lead && lead[0]) s = s.slice(lead[0].length)
  const lv = LEVEL_RE.exec(s)
  if (lv && lv[0]) s = s.slice(lv[0].length)
  s = s.replace(/^\s*\[[^\]]*\]\s*/, '')
  const tokens = s.split(/\s+/).filter(Boolean)
  if (!tokens.length) return '(无 token)'
  const exc = tokens.find((t) => /(?:exception|error|throwable)/i.test(t))
  let key = String(exc || tokens[0])
    .replace(/^["'(\[]+/, '')
    .replace(/[:：,，;；)\]"']+$/, '')
  if (key.indexOf('.') !== -1) {
    const lastSeg = key.slice(key.lastIndexOf('.') + 1)
    if (/(?:exception|error|throwable)/i.test(lastSeg)) key = lastSeg
  }
  return key || '(无 token)'
}

// 堆栈帧行（at ... / ... N more）：继承级别但不作为聚类事件，避免 'at' 之类噪声 key
const STACK_FRAME_RE = /^\s*(?:at\s|\.{3}\s*\d+\s+more|\t)/i

// ERROR 行按 key 粗聚类，返回 Top5 [{key, count}]（内部走完整分类流，堆栈行级别继承一致）
function clusterErrorsOf(lines) {
  const counter = new Map()
  for (const e of classifyLineStream(Array.isArray(lines) ? lines : [])) {
    if (e.level !== 'ERROR') continue
    if (STACK_FRAME_RE.test(e.raw)) continue
    const key = errorKeyOf(e.raw)
    counter.set(key, (counter.get(key) || 0) + 1)
  }
  return Array.from(counter.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => (b.count - a.count) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .slice(0, TOP_CLUSTER)
}

// 示例日志：约 44 行，覆盖三种级别风格与大小写变体、三种时间戳、多行异常与 Caused by 链、trace/warning/level= 别名、nginx 风格未知行
const SAMPLE_LOG = [
  '2026-11-03 09:30:12.101  INFO [main] c.util.Application - Starting util-service v2.4.0 on host-07 (Java 17.0.9)',
  '2026-11-03 09:30:12.894 DEBUG [main] c.util.config.ConfigLoader - loaded 42 keys from application.yml',
  '[2026-11-03 09:30:13] [INFO] redis pool ready: redis://127.0.0.1:6379 (max=8)',
  '09:30:13.512 DEBUG CacheWarmer - warming 256 entries from MySQL orders',
  '2026-11-03 09:30:14.032 INFO [main] o.s.b.w.embedded.tomcat.TomcatWebServer - Tomcat started on port 8080',
  'error: mysql ping timeout after 3000ms, retry 1/3 (host=db-primary)',
  '2026-11-03 09:30:14.870 WARN  [main] c.util.datasource.PoolMonitor - slow ping 2.4s to db-replica-2, threshold=1s',
  'level=warn msg="clock skew detected: ntp offset 812ms" source=agent-node-3',
  '[09:30:15] [warn] disk usage 91% on /data (total 2T)',
  '2026-11-03 09:30:20.118 INFO [http-nio-8080-exec-1] c.util.web.AccessLog - GET /api/health 200 3ms',
  '2026-11-03 09:31:02.771 ERROR [http-nio-8080-exec-7] c.util.order.OrderService - createOrder failed, userId=10086',
  'java.lang.NullPointerException: Cannot invoke "com.util.order.Order.getId()" because "order" is null',
  '\tat com.util.order.OrderService.createOrder(OrderService.java:88)',
  '\tat com.util.order.OrderService.lambda$submit$0(OrderService.java:64)',
  '\t... 12 more',
  'Caused by: java.net.SocketTimeoutException: Read timed out',
  '\tat java.base/java.net.SocketInputStream.socketRead0(Native Method)',
  '\t... 5 more',
  '2026-11-03 09:31:03.004 ERROR [http-nio-8080-exec-7] c.util.order.OrderService - createOrder failed, userId=10087',
  'java.lang.NullPointerException: Cannot invoke "com.util.order.Order.getId()" because "order" is null',
  '\tat com.util.order.OrderService.createOrder(OrderService.java:88)',
  '\t... 3 more',
  'trace: payment callback enter, tradeNo=TB202611030001',
  '2026-11-03 09:31:10.550 INFO [http-nio-8080-exec-9] c.util.pay.CallbackController - callback received tradeNo=TB202611030001',
  '2026-11-03 09:31:10.661 ERROR [http-nio-8080-exec-9] c.util.pay.RefundClient - refund call http 502, gateway=gw-2',
  'com.util.pay.GatewayException: upstream 502 Bad Gateway, cost 4021ms',
  '\tat com.util.pay.RefundClient.invoke(RefundClient.java:120)',
  '\t... 8 more',
  '2026-11-03 09:31:11.020 WARN  [http-nio-8080-exec-9] c.util.pay.RefundClient - refund retry 2/5 with backoff 800ms',
  'Error: order 10088 not found in local cache, fallback to db',
  '2026-11-03 09:31:12.480 DEBUG [http-nio-8080-exec-9] c.util.pay.RefundDao - select refund by tradeNo rows=1',
  '10.2.3.4 - - [09:31:12] "POST /api/refund HTTP/1.1" 502 187',
  '2026-11-03 09:31:15.313 INFO [scheduling-1] c.util.job.CleanJob - cleaned 0 expired sessions',
  '[2026-11-03 09:31:16] [ERROR] fatal: connection pool exhausted after 30s wait',
  'java.util.concurrent.TimeoutException: Connection pool wait timed out',
  '\tat com.util.datasource.Pool.borrow(Pool.java:55)',
  '\t... 6 more',
  '09:31:16.444 INFO Scheduler heartbeat ok, lag=0',
  'warn: config key refund.retry.max missing, using default 5',
  '2026-11-03 09:31:25.700 ERROR [http-nio-8080-exec-4] c.util.order.OrderService - createOrder failed, userId=10090',
  'java.lang.NullPointerException: Cannot invoke "com.util.order.Order.getId()" because "order" is null',
  '\tat com.util.order.OrderService.createOrder(OrderService.java:88)',
  '\t... 3 more',
  '2026-11-03 09:31:26.120 INFO [http-nio-8080-exec-4] c.util.web.AccessLog - POST /api/orders 500 812ms'
].join('\n')

// ---------- 展示定义 ----------
const LEVEL_CARDS = [
  { id: 'ERROR', label: 'ERROR' },
  { id: 'WARN', label: 'WARN' },
  { id: 'INFO', label: 'INFO' },
  { id: 'DEBUG', label: 'DEBUG' },
  { id: 'unknown', label: '未知' }
]

const LEVEL_CARD_CLASS = {
  ERROR: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30',
  WARN: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
  INFO: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',
  DEBUG: 'text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-400/30',
  unknown: 'text-muted-foreground bg-muted/40 border-border'
}

const LEVEL_ROW_STYLE = {
  ERROR: 'border-l-red-500 bg-red-500/10',
  WARN: 'border-l-amber-500 bg-amber-500/10',
  INFO: 'border-l-blue-500 bg-blue-500/10',
  DEBUG: 'border-l-slate-400 bg-slate-500/10',
  unknown: 'border-l-transparent'
}

// ---------- 页面状态 ----------
const logText = ref('')
const filterInput = ref('')
const levelActive = ref({ ERROR: true, WARN: true, INFO: true, DEBUG: true, unknown: true })
const dragging = ref(false)
const truncateNote = ref('')
const fileNote = ref('')
const copyState = ref('')
const seoContentVisible = ref(true)
let copyTimer = null

// 超过 5MB 截断并提示（正常打字不会触发重赋值，仅在超限时兜底）
watch(logText, (v) => {
  if (v && v.length > MAX_LOG_CHARS) {
    truncateNote.value = '输入长度 ' + v.length + ' 字符，超过 5MB 上限，已截断保留前 ' + MAX_LOG_CHARS + ' 字符'
    logText.value = v.slice(0, MAX_LOG_CHARS)
  } else if (!v || v.length < MAX_LOG_CHARS) {
    truncateNote.value = ''
  }
})

const classified = computed(() => classifyLog(logText.value))
const totalLines = computed(() => classified.value.length)
const hasLines = computed(() => logText.value.trim().length > 0)
const levelStats = computed(() => {
  const counts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, unknown: 0 }
  for (const e of classified.value) counts[e.level] += 1
  return counts
})

const parsedFilter = computed(() => parseFilterOf(filterInput.value))
const filterError = computed(() => (parsedFilter.value && parsedFilter.value.error) || '')
const effectiveFilter = computed(() => (parsedFilter.value && !parsedFilter.value.error) ? parsedFilter.value : null)

const filteredEntries = computed(() => {
  const matcher = buildMatcher(effectiveFilter.value)
  const active = levelActive.value
  return classified.value.filter((e) => active[e.level] && matcher(e.raw))
})
const filteredCount = computed(() => filteredEntries.value.length)
const renderedEntries = computed(() =>
  filteredEntries.value.slice(0, RENDER_LIMIT).map((e) => ({
    no: e.no,
    level: e.level,
    html: highlightLineHtml(e.raw, matchRangesOf(e.raw, effectiveFilter.value)) || '&nbsp;'
  }))
)
const errorClusters = computed(() =>
  clusterErrorsOf(logText.value ? logText.value.split(/\r?\n/) : [])
)
const viewEmptyText = computed(() => {
  if (!hasLines.value) return '把日志粘贴到左侧输入框（或把 .log / .txt 文件拖进输入框），这里会按级别着色展示'
  return '没有匹配当前级别与关键词的行：试试点回被隐藏的级别，或放宽关键词 / 修正正则'
})

// 级别卡片与 chips 的配色（ERROR>0 时红框高亮，隐藏中的级别降透明度）
function cardClass(id) {
  const dim = levelActive.value[id] ? '' : ' opacity-40'
  const hot = id === 'ERROR' && levelStats.value.ERROR > 0 ? ' ring-1 ring-red-500/60' : ''
  return (LEVEL_CARD_CLASS[id] || '') + dim + hot
}

function toggleLevel(id) {
  levelActive.value[id] = !levelActive.value[id]
}

function loadSample() {
  logText.value = SAMPLE_LOG
  fileNote.value = ''
}

function clearAll() {
  logText.value = ''
  filterInput.value = ''
  truncateNote.value = ''
  fileNote.value = ''
  copyState.value = ''
  levelActive.value = { ERROR: true, WARN: true, INFO: true, DEBUG: true, unknown: true }
}

// 复制过滤结果（优先 Clipboard API，失败回退 execCommand，均只在用户点击回调中执行）
async function copyFiltered() {
  const lines = filteredEntries.value.map((e) => e.raw)
  if (!lines.length) return
  const text = lines.join('\n')
  let ok = false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      ok = true
    }
  } catch (e) {
    ok = false
  }
  if (!ok) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      ok = document.execCommand('copy')
      document.body.removeChild(ta)
    } catch (e) {
      ok = false
    }
  }
  copyState.value = ok ? '已复制 ' + lines.length + ' 行' : '复制失败，请手动选择文本复制'
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyState.value = '' }, 2000)
}

// 拖入 .log/.txt 文件读取（事件回调内执行，SSR 安全）
function onDragOver(e) {
  e.preventDefault()
  dragging.value = true
}

function onDragLeave() {
  dragging.value = false
}

function onDrop(e) {
  e.preventDefault()
  dragging.value = false
  const dt = e.dataTransfer
  const file = dt && dt.files && dt.files[0]
  if (!file) return
  const name = String(file.name || '')
  const isText = /\.(log|txt|out|err)$/i.test(name) || String(file.type || '').indexOf('text/') === 0
  if (!isText) {
    fileNote.value = '「' + name + '」不是纯文本日志文件，仅支持 .log / .txt 等'
    return
  }
  fileNote.value = ''
  const reader = new FileReader()
  reader.onload = () => { logText.value = String(reader.result || '') }
  reader.onerror = () => { fileNote.value = '文件读取失败，请重试' }
  reader.readAsText(file)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('log-viewer')
})

onBeforeUnmount(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})
</script>
