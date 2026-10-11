<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gauge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">汽车保养周期计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">里程/时间双维度推算下次保养，生成全年保养日历，不怕被过度保养</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填入上次保养的里程与日期，选择机油类型和年均行驶里程，工具会对机油机滤、空气滤芯、火花塞、刹车油等 10 个保养项目分别按"里程间隔"与"时间间隔"双维度推算到期点（取先到者），生成按到期时间排序的保养日历。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Car class="w-5 h-5 mr-2 text-primary" /> 保养信息
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">上次保养里程（km）</label>
            <input v-model.number="lastMileage" type="number" min="0" step="500" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">上次保养日期</label>
            <input v-model="lastDate" type="date" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">年均行驶里程（km）</label>
          <input v-model.number="annualMileage" type="number" min="0" step="1000" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <p class="text-xs text-muted-foreground mt-1.5">用于把里程间隔换算成时间（按每年 365 天折算日里程）</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">机油类型</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="o in OIL_OPTIONS"
              :key="o.id"
              @click="oilType = o.id"
              :class="oilType === o.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 px-1 rounded-lg text-xs font-medium transition-all"
            >
              {{ o.label }}<br />
              <span class="text-[10px] opacity-80">{{ o.km }}km/{{ o.months }}个月</span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input v-model="turbo" type="checkbox" id="turboChk" class="w-4 h-4 rounded border-border" />
          <label for="turboChk" class="text-sm text-foreground">涡轮增压发动机（火花塞间隔减半）</label>
        </div>

        <!-- 下次机油保养提示 -->
        <div v-if="calc" class="bg-primary/10 rounded-lg p-4">
          <p class="text-xs text-muted-foreground mb-1">下次保养（机油机滤）</p>
          <template v-if="oilItem && oilItem.status !== '已到'">
            <p class="text-lg font-bold text-primary">
              还剩 {{ oilItem.remainKm.toLocaleString('zh-CN') }} km 或 {{ oilItem.remainDays }} 天
            </p>
          </template>
          <template v-else>
            <p class="text-lg font-bold text-red-600 dark:text-red-400">保养周期已到，建议尽快保养</p>
          </template>
          <p class="text-xs text-muted-foreground mt-1">
            到期点：{{ oilItem ? oilItem.dueMileage.toLocaleString('zh-CN') : '—' }} km 或 {{ fmtDate(oilItem && oilItem.dueDate) }}（{{ oilItem ? oilItem.trigger : '—' }}）
          </p>
          <p class="text-xs text-muted-foreground mt-1">按年均里程估算当前里程约 {{ calc.estCurrent.toLocaleString('zh-CN') }} km</p>
        </div>
      </div>

      <!-- 保养日历 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 保养日历（按到期时间排序）
        </h2>

        <div v-if="calc" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground border-b border-border">
                <th class="py-2 pr-3 font-medium">保养项目</th>
                <th class="py-2 pr-3 font-medium">间隔</th>
                <th class="py-2 pr-3 font-medium">预计里程</th>
                <th class="py-2 pr-3 font-medium">预计日期</th>
                <th class="py-2 pr-3 font-medium">触发依据</th>
                <th class="py-2 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in calc.items" :key="it.id" class="border-b border-border/50" :class="it.followsOil ? 'bg-primary/5' : ''">
                <td class="py-2.5 pr-3 text-foreground whitespace-nowrap">
                  {{ it.name }}
                  <span v-if="it.note" class="block text-[11px] text-muted-foreground">{{ it.note }}</span>
                </td>
                <td class="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">{{ fmtKm(it.kmInterval) }}km / {{ it.monthsInterval % 12 === 0 ? (it.monthsInterval / 12) + '年' : it.monthsInterval + '个月' }}</td>
                <td class="py-2.5 pr-3 text-foreground whitespace-nowrap">{{ it.dueMileage.toLocaleString('zh-CN') }} km</td>
                <td class="py-2.5 pr-3 text-foreground whitespace-nowrap">{{ fmtDate(it.dueDate) }}</td>
                <td class="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">{{ it.trigger }}</td>
                <td class="py-2.5 whitespace-nowrap">
                  <span v-if="it.status === '已到'" class="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-600 dark:text-red-400">已到</span>
                  <span v-else-if="it.status === '临近'" class="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">临近（剩{{ it.remainKm }}km/{{ it.remainDays }}天）</span>
                  <span v-else class="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600 dark:text-green-400">未到</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="text-xs text-muted-foreground mt-3">
            状态判定：到期日期已过，或按年均里程估算的当前里程已超过预计里程即"已到"；30 天内或 2000 km 内到期为"临近"。里程与时间哪个先到按哪个执行。
          </p>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请填写上次保养里程与日期
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：各品牌车型的官方保养周期差异较大（部分车型要求每 5000/10000 km 或 6/12 个月不等），本工具按通用经验周期估算，结果仅供参考，请以车辆保养手册和 4S 店/维修厂根据实际车况的建议为准；刹车片、轮胎、电瓶等易损件请结合磨损与老化情况提前更换。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于汽车保养周期</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            保养周期有"里程"和"时间"两个维度：机油会随时间氧化变质，即使不开也要按时间更换；而开得多时里程会先到。正确做法是哪个先到按哪个保养，既不提前浪费，也不超期伤车。机油类型直接决定机油机滤的周期：矿物油约 5000 km / 6 个月，半合成约 7500 km / 6 个月，全合成可到 10000 km / 12 个月。
          </p>
          <h3 class="text-lg font-semibold text-foreground">双维度推算是怎么算的</h3>
          <p>
            每个保养项目按里程间隔与时间间隔分别推算到期点：里程间隔到达日期 = 上次保养日期 + 间隔里程 ÷ 日均里程（年均里程 ÷ 365）；时间间隔到达日期 = 上次保养日期 + 间隔月数。两者取更早者作为到期点，同时可按年均里程反推"到那天大约跑了多少公里"，生成完整保养日历。
          </p>
          <h3 class="text-lg font-semibold text-foreground">涡轮增压与易损件</h3>
          <p>
            涡轮增压发动机工作温度更高，火花塞寿命通常减半（自然吸气约 4 万 km / 4 年，涡轮增压约 2 万 km / 2 年）。刹车片、轮胎、电瓶属于易损件：刹车片看磨损厚度，轮胎看磨损与老化裂纹，电瓶看启动性能，实际更换节奏应以检查结果为准。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">全合成机油真的可以 1 年 1 万公里一换吗？</span>多数车型可以，但长期短途、多灰尘、高温环境应适当缩短；具体以保养手册为准。</li>
            <li><span class="text-foreground font-medium">为什么我的到期日期和 4S 店提醒不一样？</span>4S 店提醒通常按固定周期偏保守设置，本工具按你填写的年均里程动态折算，更贴近实际用车强度。</li>
            <li><span class="text-foreground font-medium">空调滤芯可以自己换吗？</span>多数车型空调滤芯位于副驾驶手套箱后方，动手能力强的话几分钟即可自行更换，能省下工时费。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'car-maintenance-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Gauge, Car, CalendarDays, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '汽车保养周期计算器 - 里程/时间双维度保养日历',
  description: '输入上次保养里程与日期，按机油类型与年均行驶里程对 10 个保养项目做里程/时间双维度推算，生成按到期时间排序的保养日历，纯本地计算',
  keywords: '汽车保养周期, 下次保养计算, 保养里程时间, 保养日历, 机油更换周期, 养车',
  author: 'Util工具箱',
  ogTitle: '汽车保养周期计算器 - 有条工具',
  ogDescription: '里程/时间双维度推算下次保养，生成全年保养日历，不怕被过度保养',
  ogUrl: 'https://www.util.cn/tools/car-maintenance-calculator',
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
          name: '汽车保养周期计算器',
          url: 'https://www.util.cn/tools/car-maintenance-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['机油类型选择', '里程/时间双维度推算', '10 项保养日历', '涡轮增压间隔调整', '临近/已到状态提醒']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '汽车保养周期计算器', item: 'https://www.util.cn/tools/car-maintenance-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '全合成机油可以多久换一次？',
              acceptedAnswer: { '@type': 'Answer', text: '多数车型全合成机油可按 10000 km 或 12 个月更换，长期短途、多灰尘或高温环境应适当缩短，以保养手册为准。' }
            },
            {
              '@type': 'Question',
              name: '为什么到期日期和 4S 店提醒不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '4S 店提醒通常按固定周期偏保守设置，本工具按你填写的年均里程动态折算里程与时间哪个先到，更贴近实际用车强度。' }
            },
            {
              '@type': 'Question',
              name: '涡轮增压车型有什么不同？',
              acceptedAnswer: { '@type': 'Answer', text: '涡轮增压发动机工作温度更高，火花塞寿命通常减半，勾选涡轮增压选项后火花塞间隔自动按 20000 km / 2 年计算。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'car-maintenance-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 常量表 ----------
const OIL_OPTIONS = [
  { id: 'mineral', label: '矿物油', km: 5000, months: 6 },
  { id: 'semi', label: '半合成机油', km: 7500, months: 6 },
  { id: 'full', label: '全合成机油', km: 10000, months: 12 }
]

const MAINT_ITEMS = [
  { id: 'oil', name: '机油机滤', followsOil: true, km: 0, months: 0, note: '' },
  { id: 'air', name: '空气滤芯', km: 20000, months: 24, note: '' },
  { id: 'cabin', name: '空调滤芯', km: 10000, months: 12, note: '建议随每次小保养检查' },
  { id: 'spark', name: '火花塞', km: 40000, months: 48, turboHalve: true, note: '涡轮增压间隔减半' },
  { id: 'brakeFluid', name: '刹车油', km: 40000, months: 24, note: '' },
  { id: 'coolant', name: '防冻液', km: 60000, months: 36, note: '' },
  { id: 'gearbox', name: '变速箱油', km: 60000, months: 72, note: '' },
  { id: 'tire', name: '轮胎', km: 60000, months: 72, note: '按磨损与老化情况检查' },
  { id: 'battery', name: '电瓶', km: 60000, months: 48, note: '' },
  { id: 'brakePad', name: '刹车片', km: 40000, months: 48, note: '按磨损情况检查，先到为准' }
]

// ---------- 状态 ----------
const todayStr = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const lastMileage = ref(20000)
const lastDate = ref('2026-01-01')
const annualMileage = ref(15000)
const oilType = ref('full')
const turbo = ref(false)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 工具函数 ----------
const parseYmd = (s) => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(s || ''))
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}
const addMonths = (date, n) => new Date(date.getFullYear(), date.getMonth() + n, date.getDate())
const daysBetween = (a, b) => (b.getTime() - a.getTime()) / 86400000
const fmtDate = (d) => {
  if (!d) return '—'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const fmtKm = (v) => (v % 1 === 0 ? String(v) : String(v / 1000) + '千')

// ---------- 核心推算：每个项目按 里程/时间 双维度取先到 ----------
const calc = computed(() => {
  const base = parseYmd(lastDate.value)
  if (!base || !(lastMileage.value >= 0) || !lastDate.value) return null
  const annual = annualMileage.value > 0 ? annualMileage.value : 15000
  const dailyKm = annual / 365
  const now = new Date()
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const estCurrent = Math.max(0, Math.round(lastMileage.value + dailyKm * daysBetween(base, today0)))
  const oilOpt = OIL_OPTIONS.find(o => o.id === oilType.value) || OIL_OPTIONS[2]
  const items = MAINT_ITEMS.map(item => {
    const km = item.followsOil ? oilOpt.km : (item.turboHalve && turbo.value ? item.km / 2 : item.km)
    const months = item.followsOil ? oilOpt.months : (item.turboHalve && turbo.value ? item.months / 2 : item.months)
    const kmDate = new Date(base.getTime() + (km / dailyKm) * 86400000)
    const timeDate = addMonths(base, months)
    const byMileage = kmDate.getTime() <= timeDate.getTime()
    const dueDate = byMileage ? kmDate : timeDate
    const dueMileage = byMileage ? lastMileage.value + km : Math.round((lastMileage.value + dailyKm * daysBetween(base, dueDate)) / 10) * 10
    const overdue = today0.getTime() > dueDate.getTime() || estCurrent >= dueMileage
    const soon = !overdue && (dueDate.getTime() - today0.getTime() <= 30 * 86400000 || dueMileage - estCurrent <= 2000)
    return {
      ...item,
      kmInterval: km,
      monthsInterval: months,
      dueMileage,
      dueDate,
      trigger: byMileage ? '里程先到' : '时间先到',
      status: overdue ? '已到' : (soon ? '临近' : '未到'),
      remainKm: Math.max(0, Math.round(dueMileage - estCurrent)),
      remainDays: Math.max(0, Math.ceil((dueDate.getTime() - today0.getTime()) / 86400000))
    }
  })
  items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  return { items, estCurrent, dailyKm }
})

const oilItem = computed(() => {
  if (!calc.value) return null
  return calc.value.items.find(i => i.id === 'oil') || null
})
</script>
