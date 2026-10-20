<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Binary class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">雪花ID解码器</h1>
          <p class="text-sm text-muted-foreground mt-1">拆解 64 位雪花 ID 的符号位 / 时间戳 / 数据中心 / 机器号 / 序列号，反推生成时刻</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴一个或多个雪花 ID（每行一个），本工具用 BigInt 位运算把它们拆回各字段：时间戳增量加上纪元（epoch）还原出生时刻，并给出数据中心号、机器号与序列号。内置 Twitter、Hutool、百度 UidGenerator 等常见框架默认纪元，也支持毫秒 / 日期自定义与各位段宽度自由调整。超过 2^53、负数、位数不足等异常一律红色标注。全部计算在浏览器本地完成，ID 不会上传。
      </p>
    </div>

    <!-- 参数区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold text-foreground flex items-center mb-4">
        <Settings2 class="w-5 h-5 mr-2 text-primary" /> 解码参数
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">纪元（epoch）预设</label>
          <select
            v-model="presetKey"
            @change="applyPreset"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="p in epochPresets" :key="p.key" :value="p.key">{{ p.label }}</option>
          </select>
          <label class="block text-sm font-medium text-foreground mt-3 mb-2">纪元值（毫秒时间戳或日期）</label>
          <input
            v-model="epochInput"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 1288834974657 或 2010-01-01T00:00:00+08:00"
          />
          <p v-if="epochInfo.ok" class="text-xs text-green-600 dark:text-green-400 mt-1.5">
            解析为 {{ epochInfo.epochMs.toString() }} ms（{{ fmtMs(epochInfo.epochMs.toString()) }}）
          </p>
          <p v-else class="text-xs text-red-600 dark:text-red-400 mt-1.5">{{ epochInfo.error }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">位分配（1 符号位 + 时间 + 数据中心 + 机器 + 序列 = 64）</label>
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">时间戳位</label>
              <input v-model.number="tsBits" type="number" min="1" max="62" class="w-full px-2 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">数据中心</label>
              <input v-model.number="dcBits" type="number" min="0" max="30" class="w-full px-2 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">机器号</label>
              <input v-model.number="workerBits" type="number" min="0" max="30" class="w-full px-2 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">序列号</label>
              <input v-model.number="seqBits" type="number" min="0" max="30" class="w-full px-2 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <p :class="bitSum === 64 ? 'text-xs text-muted-foreground mt-2' : 'text-xs text-red-600 dark:text-red-400 mt-2'">
            当前合计 {{ bitSum }} 位{{ bitSum === 64 ? '（标准 64 位布局）' : '，不等于 64 位，解码结果可能失真' }}。默认 41+5+5+12 为 Twitter 布局；雪花 ID 常见形态是 19 位左右的数字。
          </p>
        </div>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 雪花 ID 输入
        </h2>
        <textarea
          v-model="idsText"
          class="w-full h-80 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="每行一个 64 位整数雪花 ID，例如：&#10;1068438253888016384&#10;7096078192489758720&#10;也可以故意粘贴 -123 或超长数字，观察异常提示"
          spellcheck="false"
        ></textarea>
        <div class="flex gap-2">
          <button @click="fillSample" class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all">填入示例</button>
          <button @click="idsText = ''" class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all">清空</button>
        </div>
        <div class="bg-primary/10 rounded-lg p-3">
          <p class="text-xs text-foreground font-medium mb-1 flex items-center gap-1">
            <Lightbulb class="w-3.5 h-3.5 text-primary" /> 往返自校验
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            用「填入示例」按当前纪元与位分配即时编码若干 ID 再解码，可验证 时间戳 / 机器号 / 序列号 原样还原（编码与解码同为位运算）。
          </p>
        </div>
      </div>

      <!-- 结果 -->
      <div class="lg:col-span-2">
        <div v-if="!epochInfo.ok" class="bg-card border border-border rounded-lg py-16 text-center">
          <AlertTriangle class="w-10 h-10 mx-auto mb-3 text-red-500/70" />
          <p class="text-sm text-red-600 dark:text-red-400">{{ epochInfo.error }}</p>
        </div>
        <div v-else-if="rows.length === 0" class="bg-card border border-border rounded-lg py-16 text-center">
          <Binary class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">粘贴雪花 ID 后，这里会显示逐行拆解结果</p>
        </div>
        <div v-else class="space-y-4">
          <div class="bg-card border border-border rounded-lg p-4 overflow-x-auto">
            <table class="w-full text-xs font-mono">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">ID</th>
                  <th class="py-2 pr-3 font-medium">时间戳(ms)</th>
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">生成时刻(本地)</th>
                  <th class="py-2 pr-3 font-medium whitespace-nowrap">数据中心</th>
                  <th class="py-2 pr-3 font-medium">机器号</th>
                  <th class="py-2 pr-3 font-medium">序列号</th>
                  <th class="py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(r, ri) in rows"
                  :key="ri"
                  @click="rowClick(ri)"
                  class="border-b border-border/50 align-top cursor-pointer hover:bg-muted/50 transition-colors"
                  :class="focusedIndex === ri ? 'bg-primary/5' : ''"
                >
                  <td class="py-2 pr-3 text-foreground break-all max-w-[200px]">{{ r.raw }}</td>
                  <td class="py-2 pr-3" :class="r.ok ? 'text-foreground' : 'text-red-600 dark:text-red-400'">{{ r.ok ? r.timestampMs : '—' }}</td>
                  <td class="py-2 pr-3 text-foreground whitespace-nowrap">
                    <template v-if="r.ok && r.time">
                      {{ r.time.local }}
                      <span class="block text-[10px] text-muted-foreground">{{ r.time.iso }}</span>
                    </template>
                    <template v-else-if="r.ok">超出可表示日期</template>
                    <template v-else>—</template>
                  </td>
                  <td class="py-2 pr-3 text-foreground">{{ r.ok ? r.dataCenterId : '—' }}</td>
                  <td class="py-2 pr-3 text-foreground">{{ r.ok ? r.workerId : '—' }}</td>
                  <td class="py-2 pr-3 text-foreground">{{ r.ok ? r.sequence : '—' }}</td>
                  <td class="py-2 min-w-[160px]">
                    <p v-if="r.error" class="text-red-600 dark:text-red-400">{{ r.error }}</p>
                    <p v-else-if="r.warnings.length === 0" class="text-green-600 dark:text-green-400">解码成功</p>
                    <p v-for="(w, wi) in r.warnings" :key="wi" class="text-amber-600 dark:text-amber-400">{{ w }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="truncated" class="text-xs text-amber-600 dark:text-amber-400">输入超过 200 行，仅解码前 200 行。</p>
          <div class="bg-card border border-border rounded-lg p-4">
            <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center">
              <GitBranch class="w-4 h-4 mr-1.5 text-primary" /> 选中行的位布局视图
            </h3>
            <div v-if="focusedRow && focusedRow.ok" class="flex flex-wrap gap-1.5 text-xs font-mono">
              <span class="px-2 py-1 rounded bg-muted text-muted-foreground">符号位 0</span>
              <span class="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">时间增量 {{ focusedRow.delta }}（{{ cfgTs }} 位）</span>
              <span class="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">数据中心 {{ focusedRow.dataCenterId }}（{{ cfgDc }} 位）</span>
              <span class="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">机器号 {{ focusedRow.workerId }}（{{ cfgWorker }} 位）</span>
              <span class="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">序列号 {{ focusedRow.sequence }}（{{ cfgSeq }} 位）</span>
            </div>
            <p v-else class="text-xs text-muted-foreground">点击上表任意一行查看该 ID 的字段占比。</p>
          </div>
        </div>
      </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于雪花ID解码器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            雪花算法（Snowflake）把一个 64 位整数拆成五段：1 位符号位（恒为 0）、41 位毫秒时间戳增量、5 位数据中心号、5 位机器号、12 位序列号（Twitter 原始布局）。ID 本身不透明，但只要知道系统的纪元与各段位宽，就能像本工具一样用位移和掩码把生成时刻与机器身份完整还原——排查分布式重复主键、定位问题数据来自哪台节点时尤其有用。
          </p>
          <h3 class="text-lg font-semibold text-foreground">如何使用</h3>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>如果你的系统改过默认纪元，先在参数区选择框架预设或直接填写毫秒 / 日期形式的纪元；</li>
            <li>调整各位段宽度（默认 41 + 5 + 5 + 12），使其与业务代码中的位移常量一致；</li>
            <li>每行粘贴一个 ID，表格即逐行给出时间戳、本地时刻、ISO 时间、数据中心、机器号与序列号；</li>
            <li>点击某一行可查看该 ID 的位布局视图；异常输入（负数、超长、位数不足）会红色或橙色标注。</li>
          </ol>
          <h3 class="text-lg font-semibold text-foreground">位布局与还原公式</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>时间戳增量 = ID 右移（数据中心 + 机器 + 序列 位数之和），生成时刻 = 纪元 + 增量；41 位可表示约 69.7 年。</li>
            <li>机器段 = 先把低位序列号掩掉再右移；序列号 = ID 与 (2^12 − 1) 按位与，同毫秒内可发 4096 个号。</li>
            <li>解码使用 BigInt 运算，19 位以上的 ID 也不会因 JS Number 精度丢失而失真；但请确认 ID 在传给前端前未经 JSON number 序列化，否则可能已被四舍五入（本工具会给出超 2^53 提示）。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么雪花 ID 会重复？</span>最常见原因是时钟回拨：机器时间被 NTP 往回调后，同一毫秒段会重新发放相同（机器, 序列）组合；其次是多实例部署时机器号配置撞车（如 K8s 克隆同一份配置、容器未注入独立 workerId）；再次是序列号溢出后若实现未等待下一毫秒而是直接复用旧时间戳，也会撞号。</li>
            <li><span class="text-foreground font-medium">解出来的时间和实际生成时间对不上？</span>先确认纪元是否为目标系统定制值（很多框架改成自己的上线日），再确认位分配是否与代码一致（有的项目把机器号扩到 10 位、序列缩到 10 位）；两者任一不符，时间戳段都会整体错位。</li>
            <li><span class="text-foreground font-medium">红色提示「超过 2^53」是什么意思？</span>该 ID 超出了 JavaScript Number 的安全整数范围。若后端用 JSON number 下发，浏览器解析时已可能失真；本解码器用 BigInt 计算不受影响，但请核对传入前是否已被序列化环节四舍五入。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'snowflake-id-decoder'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Binary, Settings2, FileText, AlertTriangle, Lightbulb, GitBranch,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '雪花ID解码器 - 在线拆解Snowflake时间戳/机器号/序列号',
  description: '在线雪花ID解码器，按位运算拆解 64 位 Snowflake ID 的符号位、时间戳、数据中心、机器号与序列号，支持 Twitter/Hutool/百度等常见纪元预设、自定义 epoch 与位分配，反推生成时刻，纯本地计算',
  keywords: '雪花ID解码, snowflake解析, 分布式ID反推, 时间戳纪元, workerId, 机器号拆解',
  author: 'Util工具箱',
  ogTitle: '雪花ID解码器 - 有条工具',
  ogDescription: '拆解雪花 ID 的时间戳/数据中心/机器号/序列号，反推生成时刻',
  ogUrl: 'https://www.util.cn/tools/snowflake-id-decoder',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '雪花ID解码器',
          url: 'https://www.util.cn/tools/snowflake-id-decoder',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['BigInt 位运算拆解', '常见框架纪元预设', '自定义 epoch 与位分配', '生成时刻本地/ISO 还原', '异常值红色提示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '雪花ID解码器', item: 'https://www.util.cn/tools/snowflake-id-decoder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么雪花ID会重复？',
              acceptedAnswer: { '@type': 'Answer', text: '最常见原因是时钟回拨导致同一毫秒段重复发放；其次是多实例机器号（workerId）配置撞车，以及序列号溢出后未等待下一毫秒的实现缺陷。' }
            },
            {
              '@type': 'Question',
              name: '解出来的时间和实际生成时间对不上？',
              acceptedAnswer: { '@type': 'Answer', text: '请确认纪元（epoch）是否为目标系统定制值，以及时间戳/数据中心/机器/序列各位的宽度是否与业务代码中的位移常量一致，两者任一不符时间段都会错位。' }
            },
            {
              '@type': 'Question',
              name: '超过 2^53 的 ID 会算错吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具使用 BigInt 精确运算不会算错，但该数值若曾经过 JS Number 或 JSON number 序列化，可能已经失真，工具会给出红色提示以便核对来源。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'snowflake-id-decoder')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== 纯函数（node 自测提取区）begin ==== */
const MAX_SAFE = 9007199254740991n // 2^53 - 1

const bitMask = (bits) => (1n << BigInt(bits)) - 1n

// 纪元输入：毫秒数字串 或 可被 Date.parse 识别的日期串
function normalizeEpochInput(raw) {
  const s = String(raw == null ? '' : raw).trim()
  if (!s) return { ok: false, error: '纪元为空，请填毫秒时间戳或日期' }
  if (/^\d{1,16}$/.test(s)) return { ok: true, epochMs: BigInt(s) }
  const d = Date.parse(s)
  if (Number.isNaN(d)) return { ok: false, error: '无法识别的纪元格式，请填毫秒或如 2010-01-01T00:00:00+08:00' }
  return { ok: true, epochMs: BigInt(d) }
}

// 毫秒 -> { iso, local }；超出 JS Date 范围返回 null
function formatEpochMs(msStr) {
  const n = Number(msStr)
  if (!Number.isFinite(n) || Math.abs(n) > 8.64e15) return null
  const d = new Date(n)
  return {
    iso: d.toISOString(),
    local: d.toLocaleString('zh-CN', { hour12: false })
  }
}

// cfg: { epochMs: BigInt, tsBits, dcBits, workerBits, seqBits }
function decodeSnowflake(idStr, cfg) {
  const res = { raw: String(idStr == null ? '' : idStr).trim(), ok: false, warnings: [], error: '' }
  const s = res.raw
  if (!/^[+-]?\d+$/.test(s)) { res.error = '非十进制整数，无法解码'; return res }
  const id = BigInt(s)
  if (id < 0n) { res.error = '负数不合法：64 位布局的符号位必须为 0'; return res }
  const total = 1 + cfg.tsBits + cfg.dcBits + cfg.workerBits + cfg.seqBits
  if (total !== 64) res.warnings.push('位分配合计 ' + total + ' 位，不等于 64 位，结果可能失真')
  if (id > bitMask(total - 1)) { res.error = '数值超出该位分配可表示的最大范围'; return res }
  if (id > MAX_SAFE) res.warnings.push('超过 2^53（Number 安全整数上限），若曾经过 JS number/JSON 序列化可能已失真')
  const shiftW = BigInt(cfg.seqBits)
  const shiftD = shiftW + BigInt(cfg.workerBits)
  const shiftT = shiftD + BigInt(cfg.dcBits)
  res.sequence = Number(id & bitMask(cfg.seqBits))
  res.workerId = Number((id >> shiftW) & bitMask(cfg.workerBits))
  res.dataCenterId = Number((id >> shiftD) & bitMask(cfg.dcBits))
  const delta = id >> shiftT
  if (delta > bitMask(cfg.tsBits)) { res.error = '时间戳增量超出 ' + cfg.tsBits + ' 位范围'; return res }
  if (delta === 0n) res.warnings.push('时间戳增量为 0：该 ID 位数不足以携带生成时间，可能不是标准雪花 ID')
  res.delta = delta.toString()
  res.timestampMs = (cfg.epochMs + delta).toString()
  const t = formatEpochMs(res.timestampMs)
  if (t) {
    res.time = t
  } else {
    res.warnings.push('还原时间戳超出 JS Date 可表示范围（约 ±2.75 亿年），无法格式化日期')
  }
  res.ok = true
  return res
}

// 反向编码：用于示例与往返自测
function encodeSnowflake(parts, cfg) {
  const ms = BigInt(parts.ms)
  if (!Number.isFinite(Number(ms))) throw new Error('时间必须为整数毫秒')
  const delta = ms - cfg.epochMs
  if (delta < 0n) throw new Error('时间早于纪元，无法编码')
  if (delta > bitMask(cfg.tsBits)) throw new Error('时间戳增量超出 ' + cfg.tsBits + ' 位位宽')
  const limit = (v, bits, name) => {
    if (v < 0 || v > Number(bitMask(bits))) throw new Error(name + '超出 ' + bits + ' 位范围')
    return BigInt(v)
  }
  const dc = limit(parts.dataCenterId, cfg.dcBits, '数据中心号')
  const worker = limit(parts.workerId, cfg.workerBits, '机器号')
  const seq = limit(parts.sequence, cfg.seqBits, '序列号')
  const shiftW = BigInt(cfg.seqBits)
  const shiftD = shiftW + BigInt(cfg.workerBits)
  const shiftT = shiftD + BigInt(cfg.dcBits)
  return ((delta << shiftT) | (dc << shiftD) | (worker << shiftW) | seq).toString()
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 状态 ----------
const idsText = ref('')
const epochPresets = [
  { key: 'twitter', label: 'Twitter 原版（1288834974657）', epoch: '1288834974657' },
  { key: 'hutool', label: 'Hutool（1262304000000）', epoch: '1262304000000' },
  { key: 'baidu', label: '百度 UidGenerator（1459990969225）', epoch: '1459990969225' },
  { key: 'leaf', label: '美团 Leaf 示例纪元（2018-01-01，项目自定义）', epoch: '1514764800000' },
  { key: 'custom', label: '自定义（毫秒或日期）', epoch: '' }
]
const presetKey = ref('twitter')
const epochInput = ref('1288834974657')
const tsBits = ref(41)
const dcBits = ref(5)
const workerBits = ref(5)
const seqBits = ref(12)
const seoContentVisible = ref(true)
const focusedIndex = ref(-1)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 切换预设时同步纪元输入（仅用户操作触发）
const applyPreset = () => {
  const p = epochPresets.find(x => x.key === presetKey.value)
  if (p && p.epoch) epochInput.value = p.epoch
}

const clampBits = (v, max) => {
  const n = Math.floor(Number(v))
  if (!Number.isFinite(n)) return 0
  return Math.min(max, Math.max(0, n))
}
const cfgTs = computed(() => clampBits(tsBits.value, 62))
const cfgDc = computed(() => clampBits(dcBits.value, 30))
const cfgWorker = computed(() => clampBits(workerBits.value, 30))
const cfgSeq = computed(() => clampBits(seqBits.value, 30))
const bitSum = computed(() => 1 + cfgTs.value + cfgDc.value + cfgWorker.value + cfgSeq.value)

const epochInfo = computed(() => normalizeEpochInput(epochInput.value))

const fmtMs = (msStr) => {
  const t = formatEpochMs(msStr)
  return t ? t.local : '—'
}

const decodedList = computed(() => {
  const list = idsText.value.split(/\r?\n/).map(x => x.trim()).filter(x => x !== '')
  if (!epochInfo.value.ok) return { rows: [], truncated: false }
  const cfg = {
    epochMs: epochInfo.value.epochMs,
    tsBits: cfgTs.value,
    dcBits: cfgDc.value,
    workerBits: cfgWorker.value,
    seqBits: cfgSeq.value
  }
  const capped = list.slice(0, 200)
  return { rows: capped.map(s => decodeSnowflake(s, cfg)), truncated: list.length > 200 }
})
const rows = computed(() => decodedList.value.rows)
const truncated = computed(() => decodedList.value.truncated)
const focusedRow = computed(() => {
  if (focusedIndex.value < 0 || focusedIndex.value >= rows.value.length) return null
  return rows.value[focusedIndex.value]
})

const focusRow = (i) => { focusedIndex.value = i }

const fillSample = () => {
  const epochOk = epochInfo.value.ok
  const cfg = {
    epochMs: epochOk ? epochInfo.value.epochMs : BigInt('1288834974657'),
    tsBits: epochOk ? cfgTs.value : 41,
    dcBits: epochOk ? cfgDc.value : 5,
    workerBits: epochOk ? cfgWorker.value : 5,
    seqBits: epochOk ? cfgSeq.value : 12
  }
  const now = Date.now()
  const ids = []
  try {
    ids.push(encodeSnowflake({ ms: now, dataCenterId: 3, workerId: 7, sequence: 1 }, cfg))
    ids.push(encodeSnowflake({ ms: now - 60000, dataCenterId: 3, workerId: 7, sequence: 4095 }, cfg))
    ids.push(encodeSnowflake({ ms: now - 3600000, dataCenterId: 31, workerId: 31, sequence: 100 }, cfg))
  } catch (e) {
    ids.push('1068438253888016384')
  }
  ids.push('9999999999999999999999999')
  ids.push('-123')
  ids.push('1288834974657')
  idsText.value = ids.join('\n')
  focusedIndex.value = -1
}

// 点击行聚焦位布局（模板事件绑定）
const rowClick = (i) => { focusRow(i) }
</script>
