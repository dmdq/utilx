<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Clock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">加班费计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按工作日 1.5 倍 / 休息日 2 倍 / 法定节假日 3 倍自动套算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入月工资基数与加班日期，工具自动判断该日是工作日、休息日还是法定节假日，并按对应倍数计算加班费：
        法定节假日 3 倍且不可用调休抵扣，休息日 2 倍且仅在未调休时计发，工作日延长工时 1.5 倍。支持多条记录增删与汇总，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 政策口径提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        内置 2026 年法定节假日表<strong>按国务院办公厅公开通知口径整理</strong>，放假与调休安排请以官方最新通知为准；加班倍数依据《劳动法》第四十四条，本工具结果仅供参考，不构成法律意见。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入与记录 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 加班记录
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">月工资基数（元）</label>
            <input
              v-model.number="baseSalary"
              type="number"
              min="0"
              step="100"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 8700"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">当月已调休（小时，可选）</label>
            <input
              v-model.number="compHours"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="仅抵扣休息日加班"
            />
          </div>
        </div>

        <!-- 添加记录 -->
        <div class="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">加班日期</label>
            <input
              v-model="newDate"
              type="date"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">时长（小时）</label>
            <input
              v-model.number="newHours"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            @click="addRecord"
            class="h-[42px] px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
          >
            <Plus class="w-4 h-4" /> 添加
          </button>
        </div>

        <!-- 记录列表 -->
        <div v-if="detailedRecords.length > 0" class="space-y-2">
          <div
            v-for="rec in detailedRecords"
            :key="rec.id"
            class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5"
          >
            <div class="flex items-center gap-3">
              <span class="text-sm text-foreground font-medium">{{ rec.date }}</span>
              <span :class="['text-xs px-2 py-0.5 rounded-full', typeBadgeClass(rec.type)]">{{ typeLabel(rec.type) }}</span>
              <span class="text-xs text-muted-foreground">{{ rec.hours }} 小时<span v-if="rec.deducted > 0">（已抵调休 {{ rec.deducted }}h）</span></span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-semibold text-primary">{{ fmt(rec.pay) }} 元</span>
              <button
                @click="removeRecord(rec.id)"
                class="text-muted-foreground hover:text-red-500 transition-colors"
                aria-label="删除该条记录"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div v-else class="p-6 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          添加加班记录开始计算，日期类型会自动判定
        </div>
      </div>

      <!-- 汇总 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <CircleDollarSign class="w-5 h-5 mr-2 text-primary" /> 加班费汇总
        </h2>

        <div class="bg-muted/50 rounded-lg p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">小时工资 = 基数 ÷ 21.75 ÷ 8</p>
          <p class="text-lg font-bold text-foreground">{{ fmt(hourly) }} 元/小时</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
            <span class="text-sm text-muted-foreground">法定节假日（3 倍，不可调休抵）</span>
            <span class="text-sm font-semibold text-foreground">{{ fmt(totalByType.legal) }} 元</span>
          </div>
          <div class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
            <span class="text-sm text-muted-foreground">休息日（2 倍，未调休才计）</span>
            <span class="text-sm font-semibold text-foreground">{{ fmt(totalByType.rest) }} 元</span>
          </div>
          <div class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
            <span class="text-sm text-muted-foreground">工作日延长工时（1.5 倍）</span>
            <span class="text-sm font-semibold text-foreground">{{ fmt(totalByType.workday) }} 元</span>
          </div>
        </div>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">加班费合计（{{ detailedRecords.length }} 条记录）</p>
          <p class="text-2xl font-bold text-primary">{{ fmt(grandTotal) }} 元</p>
          <p v-if="compHours > 0 && totalByType.rest > 0" class="text-xs text-primary mt-1">
            已用 {{ fmt(usedCompHours) }} 小时调休抵扣休息日加班
          </p>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          依据《劳动法》第四十四条：法定节假日加班支付不低于 300% 工资且不能以调休替代；休息日加班又不能安排补休的支付不低于 200%；
          工作日延长工时支付不低于 150%。月计薪天数按 21.75 天折算小时工资。
        </p>
      </div>
    </div>

    <!-- 内置节假日表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <button
        @click="toggleHolidays"
        class="w-full flex items-center justify-between text-left"
        aria-label="展开或收起节假日表"
      >
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 内置 2026 年法定节假日表
        </h2>
        <ChevronUp v-if="holidaysVisible" class="w-5 h-5 text-muted-foreground" />
        <ChevronDown v-else class="w-5 h-5 text-muted-foreground" />
      </button>
      <div v-show="holidaysVisible" class="mt-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="h in holidays2026" :key="h.name" class="bg-muted/50 rounded-lg p-3">
            <p class="text-sm font-medium text-foreground">{{ h.name }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ h.range }}</p>
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-4">
          放假区间按国务院办公厅公开通知口径整理，未区分调休补班的周末，以官方最新通知为准。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于加班费</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            加班费是劳动者的法定权益。加班分为三种情形：工作日延长工时、休息日加班、法定节假日加班，
            三者的支付倍数与能否调休抵扣各不相同。本工具按日期自动判定类型并套算倍数，适合核对工资单或与公司沟通时使用。
          </p>
          <h3 class="text-lg font-semibold text-foreground">加班费的三种倍数</h3>
          <p>
            依据《劳动法》第四十四条：安排劳动者延长工作时间的，支付不低于工资的 150%；休息日安排工作又不能安排补休的，
            支付不低于 200%；法定休假日安排工作的，支付不低于 300%。注意法定节假日加班必须支付 3 倍工资，
            不能用事后补休替代；休息日加班则优先安排补休，确实无法补休时才支付 2 倍。
          </p>
          <h3 class="text-lg font-semibold text-foreground">小时工资怎么折算</h3>
          <p>
            按人社部规定，月计薪天数为 21.75 天（(365 − 104 个双休日) ÷ 12），小时工资 = 月工资基数 ÷ 21.75 ÷ 8。
            例如月基数 8700 元，小时工资为 50 元，法定节假日加班 8 小时应得 50 × 8 × 3 = 1200 元。
            加班费计算基数为正常工作时间工资，不含加班费本身，部分地区允许约定但不低于最低工资。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">调休能抵法定节假日加班吗？</span>不能。法定节假日加班必须支付 3 倍工资，调休只能抵扣休息日加班；本工具中"已调休小时"仅用于抵扣休息日记录。</li>
            <li><span class="text-foreground font-medium">放假调休期间上班按几倍算？</span>法定节假日当天（如初一）为 3 倍；放假区间内调休转来的休息日按 2 倍。本工具按放假区间整体简化为 3 倍，严谨核算请按官方通知区分。</li>
            <li><span class="text-foreground font-medium">计件工资或有提成怎么算基数？</span>一般以正常工作时间应得工资为基数折算小时工资，具体以地方规定与劳动合同约定为准。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'overtime-pay-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Clock, CalendarDays, CircleDollarSign, Plus, Trash2,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '加班费计算器 - 工作日1.5倍/休息日2倍/法定节假日3倍',
  description: '在线加班费计算器，输入工资基数与加班日期自动判定工作日/休息日/法定节假日并按 1.5 倍、2 倍、3 倍套算，内置 2026 年法定节假日表，支持多条记录增删汇总与调休抵扣，纯本地计算',
  keywords: '加班费计算, 节假日三倍工资, 加班工资, 调休, 21.75, 劳动法四十四条',
  author: 'Util工具箱',
  ogTitle: '加班费计算器 - 有条工具',
  ogDescription: '按日期自动判定加班类型，1.5/2/3 倍自动套算',
  ogUrl: 'https://www.util.cn/tools/overtime-pay-calculator',
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
          name: '加班费计算器',
          url: 'https://www.util.cn/tools/overtime-pay-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['日期类型自动判定', '1.5/2/3 倍自动套算', '内置 2026 法定节假日表', '调休抵扣休息日', '多条记录增删汇总']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '加班费计算器', item: 'https://www.util.cn/tools/overtime-pay-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '调休能抵法定节假日加班吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。法定节假日加班必须支付 3 倍工资，调休只能抵扣休息日加班。' }
            },
            {
              '@type': 'Question',
              name: '放假调休期间上班按几倍算？',
              acceptedAnswer: { '@type': 'Answer', text: '法定节假日当天为 3 倍，放假区间内调休转来的休息日按 2 倍，本工具按放假区间整体简化为 3 倍。' }
            },
            {
              '@type': 'Question',
              name: '小时工资怎么折算？',
              acceptedAnswer: { '@type': 'Answer', text: '月计薪天数为 21.75 天，小时工资 = 月工资基数 ÷ 21.75 ÷ 8，如基数 8700 元时薪为 50 元。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'overtime-pay-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  if (!newDate.value) newDate.value = todayKey()
})

// ---------- 内置 2026 年法定节假日表（按国务院办公厅公开通知口径整理） ----------
const holidays2026 = [
  { name: '元旦', range: '1 月 1 日 - 1 月 3 日', days: ['2026-01-01', '2026-01-02', '2026-01-03'] },
  { name: '春节', range: '2 月 15 日 - 2 月 21 日（含除夕 2 月 16 日）', days: ['2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21'] },
  { name: '清明节', range: '4 月 4 日 - 4 月 6 日', days: ['2026-04-04', '2026-04-05', '2026-04-06'] },
  { name: '劳动节', range: '5 月 1 日 - 5 月 5 日', days: ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05'] },
  { name: '端午节', range: '6 月 19 日 - 6 月 21 日', days: ['2026-06-19', '2026-06-20', '2026-06-21'] },
  { name: '中秋节', range: '9 月 25 日 - 9 月 27 日', days: ['2026-09-25', '2026-09-26', '2026-09-27'] },
  { name: '国庆节', range: '10 月 1 日 - 10 月 7 日', days: ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'] }
]

// ---------- 日期类型判定 ----------
const classifyDate = (dateStr) => {
  for (const h of holidays2026) {
    if (h.days.includes(dateStr)) return 'legal'
  }
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return 'workday'
  const wd = d.getDay()
  return (wd === 0 || wd === 6) ? 'rest' : 'workday'
}

const todayKey = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// ---------- 状态 ----------
const baseSalary = ref(8700)
const compHours = ref(0)
const newDate = ref('')
const newHours = ref(8)
const records = ref([])
let recordSeq = 0

const holidaysVisible = ref(true)
const seoContentVisible = ref(true)
const toggleHolidays = () => { holidaysVisible.value = !holidaysVisible.value }
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fmt = (v) => (isFinite(v) ? v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—')

const typeLabel = (t) => (t === 'legal' ? '法定节假日' : t === 'rest' ? '休息日' : '工作日')
const typeBadgeClass = (t) => (t === 'legal'
  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  : t === 'rest'
    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300')

const addRecord = () => {
  const h = Math.max(0, Number(newHours.value) || 0)
  if (!newDate.value || h <= 0) return
  recordSeq += 1
  records.value.push({ id: recordSeq, date: newDate.value, hours: h, type: classifyDate(newDate.value) })
  records.value.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

const removeRecord = (id) => {
  const idx = records.value.findIndex(r => r.id === id)
  if (idx > -1) records.value.splice(idx, 1)
}

// ---------- 明细：倍数套算与调休抵扣（仅抵休息日，按日期顺序消耗） ----------
const detailedRecords = computed(() => {
  const hourly = hourlyRate.value
  let compLeft = Math.max(0, Number(compHours.value) || 0)
  return [...records.value]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((rec) => {
      if (rec.type === 'legal') {
        return { ...rec, deducted: 0, pay: rec.hours * hourly * 3 }
      }
      if (rec.type === 'rest') {
        const deducted = Math.min(rec.hours, compLeft)
        compLeft -= deducted
        return { ...rec, deducted, pay: (rec.hours - deducted) * hourly * 2 }
      }
      return { ...rec, deducted: 0, pay: rec.hours * hourly * 1.5 }
    })
})

const hourlyRate = computed(() => {
  const base = Math.max(0, Number(baseSalary.value) || 0)
  return base / 21.75 / 8
})

const totalByType = computed(() => {
  const t = { legal: 0, rest: 0, workday: 0 }
  for (const rec of detailedRecords.value) t[rec.type] += rec.pay
  return t
})

const grandTotal = computed(() => totalByType.value.legal + totalByType.value.rest + totalByType.value.workday)

const usedCompHours = computed(() => {
  let compLeft = Math.max(0, Number(compHours.value) || 0)
  let used = 0
  for (const rec of records.value) {
    if (rec.type === 'rest') {
      const d = Math.min(rec.hours, compLeft)
      compLeft -= d
      used += d
    }
  }
  return used
})
</script>
