<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Clipboard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">节假日值班表生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">成员×日期段自动轮转排班，法定节假日自动标注，打印公示一张表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入成员名单与日期范围，按「每天 / 仅工作日 / 每周」三种模式自动轮转排班；
        内置 2026 年法定节假日静态表，落在节假日的班次自动标红提示。生成后可打印张贴公示。
      </p>
    </div>

    <!-- 政策口径提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3 no-print">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        内置 2026 年法定节假日为静态表（元旦 1.1-1.3、春节 2.15-2.21、清明 4.4-4.6、劳动节 5.1-5.5、端午 6.19-6.21、中秋 9.25-9.27、国庆 10.1-10.7），
        <strong>以国务院办公厅正式通知为准</strong>；调休上班日、地方性假期与单位特殊安排请自行核对后使用。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 tools-grid">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <Users class="w-5 h-5 mr-2 text-primary" /> 排班设置
        </h2>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground" for="membersInput">成员名单（每行一位）</label>
            <button @click="fillSample" class="text-xs text-primary hover:underline flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5" /> 示例
            </button>
          </div>
          <textarea
            id="membersInput"
            v-model="membersText"
            rows="8"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="每行一位成员，如：&#10;张三&#10;李四&#10;王五"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="startDate">开始日期</label>
            <input
              id="startDate"
              v-model="startDate"
              type="date"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="endDate">结束日期</label>
            <input
              id="endDate"
              v-model="endDate"
              type="date"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">排班模式</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="m in MODES"
              :key="m.value"
              @click="mode = m.value"
              :class="mode === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
              :title="m.hint"
            >{{ m.label }}</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">{{ currentModeHint }}</p>
        </div>

        <!-- 统计概览 -->
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">值班班次</p>
            <p class="text-lg font-bold text-foreground">{{ roster.rows.length }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">节假日班次</p>
            <p class="text-lg font-bold text-red-500">{{ holidayCount }}</p>
          </div>
        </div>

        <button
          @click="printRoster"
          :disabled="!roster.rows.length"
          class="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Printer class="w-4 h-4" /> 打印值班表
        </button>
      </div>

      <!-- 右侧：轮值表 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 print-area">
        <h2 class="text-lg font-semibold flex items-center mb-4 no-print">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 轮值表
        </h2>

        <template v-if="roster.rows.length">
          <!-- 打印时显示的表头 -->
          <div class="print-only text-center mb-4">
            <h2 class="text-xl font-bold text-neutral-900">值班安排表</h2>
            <p class="text-xs text-neutral-500 mt-1">{{ startDate || '—' }} 至 {{ endDate || '—' }} · {{ currentModeLabel }}</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-muted/70 text-muted-foreground">
                  <th class="border border-border px-3 py-2 text-left font-medium">日期</th>
                  <th class="border border-border px-3 py-2 text-left font-medium">星期</th>
                  <th class="border border-border px-3 py-2 text-left font-medium">值班人</th>
                  <th class="border border-border px-3 py-2 text-left font-medium">节假日</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in roster.rows"
                  :key="row.date"
                  :class="row.holiday ? 'bg-red-50 dark:bg-red-900/10' : (i % 2 ? 'bg-muted/30' : '')"
                >
                  <td class="border border-border px-3 py-1.5 text-foreground" :class="row.holiday ? 'text-red-600 dark:text-red-400 font-medium' : ''">{{ row.date }}</td>
                  <td class="border border-border px-3 py-1.5 text-muted-foreground">{{ row.weekday }}</td>
                  <td class="border border-border px-3 py-1.5 text-foreground font-medium">{{ row.member }}</td>
                  <td class="border border-border px-3 py-1.5">
                    <span v-if="row.holiday" class="text-red-600 dark:text-red-400 font-medium">〔{{ row.holiday }}〕</span>
                    <span v-else class="text-muted-foreground/50">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 每人班次统计 -->
          <div class="mt-5 no-print">
            <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center">
              <BarChart3 class="w-4 h-4 mr-1.5 text-primary" /> 每人班次统计
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <div
                v-for="stat in roster.stats"
                :key="stat.name"
                class="bg-muted/50 rounded-lg px-3 py-2 flex items-center justify-between"
              >
                <span class="text-sm text-foreground truncate">{{ stat.name }}</span>
                <span class="text-sm font-bold" :class="stat.count > 0 ? 'text-primary' : 'text-muted-foreground/50'">{{ stat.count }} 班</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-4">节假日标注以国务院通知为准；如遇调休上班、换班请在此表基础上手工调整。</p>
        </template>

        <div v-else class="p-10 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          填写成员名单与日期范围后，自动生成轮值表
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于节假日值班表</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            节假日期间的安全值守、应急保障、客户接待都离不开一张清晰的值班表。手工排班容易漏掉周末与法定节假日的差异，
            本工具按成员顺序自动轮转，并内置 2026 年法定节假日静态表，值班落在节假日时自动标红，张贴公示一目了然。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三种排班模式怎么选</h3>
          <p>
            「每天」模式区间内逐日排班，适合春节、国庆等需要全天候值守的长假；「仅工作日」模式自动跳过周六周日，
            适合日常行政值班；「每周」模式从开始日期起每 7 天一轮，适合周度轮值（如每周一收发安全报表）。
            所有模式都按名单顺序循环取人，班次自动均摊。
          </p>
          <h3 class="text-lg font-semibold text-foreground">节假日班次为什么要标红</h3>
          <p>
            法定节假日的值班通常涉及三倍工资或调休补偿（以单位制度为准），标红既提醒值班人提前安排，
            也方便行政核算加班与补偿。红色行同时在打印稿中保留底色，张贴后更容易被注意到。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">节假日数据准确吗？</span>内置 2026 年全年法定节假日静态表（元旦、春节、清明、劳动、端午、中秋、国庆），如国务院后续发布调休或增减安排，请以正式通知为准并手工调整。</li>
            <li><span class="text-foreground font-medium">「仅工作日」模式会把法定节假日剔除吗？</span>不会，该模式仅剔除周六周日；法定节假日若落在工作日仍会生成班次并标红，便于单位按需保留节假日值守。</li>
            <li><span class="text-foreground font-medium">成员人数和班次数不整除怎么办？</span>按名单顺序循环取人，排不完的从头再轮，前面的成员会多排一班；统计卡片可以看到每人的实际班次数。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'duty-roster-generator'" :category="'time'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Clipboard, Users, Sparkles, Printer, CalendarDays, BarChart3,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '节假日值班表生成器 - 自动轮转排班与节假日标注',
  description: '在线值班表生成器，输入成员名单与日期范围，按每天/仅工作日/每周模式自动轮转排班，内置 2026 年法定节假日静态表自动标红，支持每人班次统计与打印公示',
  keywords: '值班表生成, 节假日排班, 值班安排表, 排班工具, 值班表模板, 自动排班',
  author: 'Util工具箱',
  ogTitle: '节假日值班表生成器 - 有条工具',
  ogDescription: '成员×日期段自动轮转排班，法定节假日自动标注，打印公示一张表',
  ogUrl: 'https://www.util.cn/tools/duty-roster-generator',
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
          name: '节假日值班表生成器',
          url: 'https://www.util.cn/tools/duty-roster-generator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['每天/仅工作日/每周三种模式', '成员顺序自动轮转', '2026 法定节假日静态表标红', '每人班次统计', '打印公示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间日期', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '节假日值班表生成器', item: 'https://www.util.cn/tools/duty-roster-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '节假日数据准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '内置 2026 年全年法定节假日静态表，如国务院后续发布调休或增减安排，请以正式通知为准并手工调整。' }
            },
            {
              '@type': 'Question',
              name: '仅工作日模式会把法定节假日剔除吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，该模式仅剔除周六周日；法定节假日若落在工作日仍生成班次并标红提示。' }
            },
            {
              '@type': 'Question',
              name: '成员人数和班次数不整除怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '按名单顺序循环取人，排不完的从头再轮，前面的成员会多排一班，统计卡片可见每人实际班次。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'duty-roster-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
// 2026 年法定节假日静态表（以国务院通知为准）
const HOLIDAYS_2026 = [
  { name: '元旦', start: '2026-01-01', end: '2026-01-03' },
  { name: '春节', start: '2026-02-15', end: '2026-02-21' },
  { name: '清明节', start: '2026-04-04', end: '2026-04-06' },
  { name: '劳动节', start: '2026-05-01', end: '2026-05-05' },
  { name: '端午节', start: '2026-06-19', end: '2026-06-21' },
  { name: '中秋节', start: '2026-09-25', end: '2026-09-27' },
  { name: '国庆节', start: '2026-10-01', end: '2026-10-07' }
]

const pad2 = (n) => String(n).padStart(2, '0')
const dateKey = (y, m, d) => y + '-' + pad2(m) + '-' + pad2(d)

const parseDateKey = (key) => {
  const parts = String(key).split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2])
}

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const weekdayName = (date) => WEEKDAY_NAMES[date.getDay()]

// 命中 2026 法定节假日则返回名称，否则返回 null
const findHoliday2026 = (key) => {
  for (const h of HOLIDAYS_2026) {
    if (key >= h.start && key <= h.end) return h.name
  }
  return null
}

// 生成日期序列：daily 逐日；workday 剔除周六周日；weekly 从开始日期起每 7 天一轮
const buildDates = (startKey, endKey, mode) => {
  const dates = []
  if (!startKey || !endKey) return dates
  const start = parseDateKey(startKey)
  const end = parseDateKey(endKey)
  if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) return dates
  if (end.getTime() < start.getTime()) return dates
  const stepMs = (mode === 'weekly' ? 7 : 1) * 86400000
  for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
    const d = new Date(t)
    if (mode === 'workday' && (d.getDay() === 0 || d.getDay() === 6)) continue
    dates.push({
      key: dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      weekday: weekdayName(d)
    })
  }
  return dates
}

// 生成轮值表：成员按顺序循环取人；返回班次行与每人统计
const buildRoster = (members, startKey, endKey, mode) => {
  const names = (members || []).filter(Boolean)
  const rows = buildDates(startKey, endKey, mode).map((d, i) => ({
    date: d.key,
    weekday: d.weekday,
    member: names.length ? names[i % names.length] : '—',
    holiday: findHoliday2026(d.key)
  }))
  const stats = names.map((name) => ({
    name,
    count: rows.filter((r) => r.member === name).length
  }))
  return { rows, stats }
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const MODES = [
  { value: 'daily', label: '每天', hint: '区间内逐日排班，适合长假全天候值守' },
  { value: 'workday', label: '仅工作日', hint: '自动跳过周六周日（法定节假日仍排并标红）' },
  { value: 'weekly', label: '每周', hint: '从开始日期起每 7 天一轮' }
]

const membersText = ref('张三\n李四\n王五')
const startDate = ref('2026-01-01')
const endDate = ref('2026-01-14')
const mode = ref('daily')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const SAMPLE = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九'].join('\n')
const fillSample = () => { membersText.value = SAMPLE }

const members = computed(() => {
  return String(membersText.value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
})

const currentMode = computed(() => MODES.find((m) => m.value === mode.value) || MODES[0])
const currentModeHint = computed(() => currentMode.value.hint)
const currentModeLabel = computed(() => currentMode.value.label)

const roster = computed(() => buildRoster(members.value, startDate.value, endDate.value, mode.value))

const holidayCount = computed(() => roster.value.rows.filter((r) => r.holiday).length)

const printRoster = () => {
  if (!roster.value.rows.length) return
  window.print()
}
</script>

<style scoped>
.print-only {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }

  .tools-grid {
    display: block !important;
  }

  .print-only {
    display: block;
  }

  .print-area {
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
  }

  thead tr {
    background: #f3f4f6 !important;
  }

  tbody tr {
    break-inside: avoid;
  }
}
</style>
