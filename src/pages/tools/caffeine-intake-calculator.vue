<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Coffee class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">咖啡因摄入计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">内置常见咖啡茶饮咖啡因含量，算今日摄入是否超400mg并推算安全停饮时间</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        逐条记录今天喝下的咖啡、茶、可乐、能量饮料与巧克力，内置常见饮品的咖啡因参考含量（mg/标准份），自动累加今日总量，对照成人每日 400mg 参考上限给出绿/黄/红状态，支持孕期 200mg 建议口径；再按 5 小时半衰期推算「安全停饮时间」——再过几小时体内咖啡因能降到 50mg 助眠线以下。全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：摄入记录 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Plus class="w-5 h-5 mr-2 text-primary" /> 今日饮品记录
        </h2>

        <div class="space-y-3">
          <div
            v-for="(row, idx) in rows"
            :key="idx"
            class="flex items-center gap-2"
          >
            <select
              v-model="row.key"
              class="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option
                v-for="item in CAFFEINE_ITEMS"
                :key="item.key"
                :value="item.key"
              >{{ item.name }}（{{ item.mg }}mg/{{ item.unit }}）</option>
            </select>
            <input
              v-model.number="row.count"
              type="number"
              min="0"
              step="0.5"
              class="w-20 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              @click="removeRow(idx)"
              class="w-9 h-9 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground transition"
              title="删除这条"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          @click="addRow"
          class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1"
        >
          <Plus class="w-4 h-4" /> 加一杯
        </button>

        <div class="space-y-2 pt-2 border-t border-border">
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input v-model="pregnancyMode" type="checkbox" id="pregnancyMode" class="w-4 h-4 rounded border-border" />
            按孕期建议口径（上限 200mg）
          </label>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">现在时间（推算安全停饮时间用）</label>
            <input
              v-model="nowTime"
              type="time"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div class="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground leading-relaxed">
          咖啡因含量为常见出餐规格的参考值，因豆种、萃取浓度与杯型差异较大，仅供日常参考。
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Activity class="w-5 h-5 mr-2 text-primary" /> 今日摄入状态
        </h2>

        <!-- 总量卡片 -->
        <div class="p-4 bg-muted rounded-lg text-center">
          <p class="text-sm text-muted-foreground mb-1">今日咖啡因总量</p>
          <p
            :class="[
              'text-3xl font-bold',
              status === 'low' ? 'text-green-600 dark:text-green-400' : status === 'mid' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            ]"
          >
            {{ Math.round(totalMg) }} mg
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            占{{ limitLabel }}上限（{{ activeLimit }}mg）的 {{ percentOfLimit }}%
          </p>
        </div>

        <!-- 进度条 -->
        <div>
          <div class="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              :class="[
                'h-full rounded-full transition-all',
                status === 'low' ? 'bg-green-500' : status === 'mid' ? 'bg-yellow-500' : 'bg-red-500'
              ]"
              :style="{ width: barWidth + '%' }"
            />
          </div>
          <div class="flex justify-between items-center mt-2 text-xs">
            <span
              :class="[
                'px-2 py-0.5 rounded-full font-medium',
                status === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : status === 'mid' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              ]"
            >{{ statusText }}</span>
            <span class="text-muted-foreground">{{ activeLimit }}mg 参考线</span>
          </div>
        </div>

        <!-- 明细 -->
        <div v-if="breakdown.length > 0" class="text-sm space-y-1.5">
          <div
            v-for="b in breakdown"
            :key="b.key"
            class="flex justify-between items-center py-1.5 px-3 bg-muted/50 rounded-lg"
          >
            <span class="text-muted-foreground">{{ b.name }} × {{ b.count }}</span>
            <span class="font-medium text-foreground">{{ b.mg }} mg</span>
          </div>
        </div>

        <!-- 安全停饮时间 -->
        <div class="p-4 bg-primary/10 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <Moon class="w-4 h-4 text-primary" />
            <span class="font-medium text-foreground">安全停饮时间（半衰期 5 小时推算）</span>
          </div>
          <p v-if="totalMg <= SLEEP_LINE" class="text-sm text-foreground">
            当前总量已在 50mg 助眠线以下，任何时间饮用对入睡影响都较小（敏感人群仍建议下午后避免）。
          </p>
          <p v-else class="text-sm text-foreground leading-relaxed">
            按今天这些量，<strong>再过约 {{ hoursToSleepLine.toFixed(1) }} 小时</strong>体内咖啡因可降到 50mg 以下助眠线{{ nowTime ? `（约 ${sleepReadyClock} 点之后）` : '' }}。
          </p>
          <p v-if="totalMg > SLEEP_LINE && nowTime" class="text-xs text-muted-foreground mt-2">
            例如现在 {{ nowTime }} 喝，则约 {{ sleepReadyClock }} 后达到助眠线；若 8 小时后入睡，体内仍约残留 {{ remainingAfter8h }} mg（参考值）。
          </p>
        </div>

        <div class="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>免责声明：成人 400mg/日与孕期 200mg 为常见公共卫生机构给出的参考上限，并非安全/不安全分界线；咖啡因半衰期个体差异约 3–7 小时，孕期、哺乳期、服药人群与青少年代谢更慢，本工具按 5 小时典型值估算，结果仅供日常参考，健康疑虑请咨询医生。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>咖啡因摄入计算器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            咖啡因摄入计算器帮你把「今天喝了几杯」换算成体内咖啡因负荷。一杯中杯美式约含 225mg 咖啡因，接近成人全天 400mg 参考上限的六成；而很多人并不知道可乐、抹茶、黑巧克力同样含有可观的咖啡因。工具内置 14 种常见饮品与食品的参考含量，逐条累加即可得到今日总量与安全停饮时间。
          </p>
          <h3 class="text-lg font-semibold text-foreground">如何使用本工具</h3>
          <ol class="list-decimal list-inside space-y-1">
            <li>点「加一杯」逐条录入今天的咖啡、茶、饮料或巧克力，选择品类并填份数；</li>
            <li>孕期或哺乳期可勾选 200mg 建议口径，状态色带随之切换；</li>
            <li>填入现在时间，查看「几小时后摄入能降到 50mg 助眠线」与对应时钟时间；</li>
            <li>对照绿（&lt;200mg）/黄（200–400mg）/红（&gt;400mg）三档调整下午的饮品计划。</li>
          </ol>
          <h3 class="text-lg font-semibold text-foreground">安全量参考</h3>
          <p>
            多数公共卫生机构（如欧洲食品安全局 EFSA、FDA 相关指南）建议健康成人每日咖啡因不超过约 400mg（大致相当 4 杯现煮咖啡）；孕期与哺乳期建议减半至 200mg；青少年与咖啡因敏感人群更低。这些数字是「建议上限」而非中毒剂量线，单次摄入过多可能引起心悸、焦虑与入睡困难。
          </p>
          <h3 class="text-lg font-semibold text-foreground">推算公式</h3>
          <ul class="list-disc list-inside space-y-1">
            <li><span class="text-foreground font-medium">今日总量</span> = Σ（品类咖啡因 × 份数）</li>
            <li><span class="text-foreground font-medium">残余量</span>：remaining = total × 0.5<sup>(t/5)</sup>（t 为小时，半衰期按 5 小时）</li>
            <li><span class="text-foreground font-medium">降到 50mg 的时间</span>：t = 5 × log₂(total ÷ 50)</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">下午到底几点后不能喝咖啡？</span>取决于总量与你的入睡时间：一杯美式（225mg）大约需要 15.5 小时才降到 50mg，两杯则超过 20 小时——所以「睡前 8 小时不喝」对大杯爱好者往往不够，建议把最后一杯提前到午后早段。</li>
            <li><span class="text-foreground font-medium">能量饮料和可乐也算吗？</span>要算。一罐 250ml 能量饮料约 80mg、一罐 330ml 可乐约 34mg，叠加咖啡后很容易超出心理预期。</li>
            <li><span class="text-foreground font-medium">半衰期 5 小时准确吗？</span>5 小时是健康成人的典型参考值，个体差异约 3–7 小时；孕妇、口服避孕药使用者代谢明显更慢，敏感人群请自行留更大余量，本工具结果仅供参考。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'caffeine-intake-calculator'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Coffee, Plus, Trash2, Moon, Activity, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '咖啡因摄入计算器 - 今日咖啡因是否超400mg与安全停饮时间',
  description: '在线咖啡因摄入计算器，内置咖啡茶饮可乐能量饮料等常见咖啡因含量，累加今日摄入并对照成人400mg、孕期200mg参考上限给出状态，按5小时半衰期推算降到50mg助眠线的安全停饮时间，纯本地计算',
  keywords: '咖啡因计算, 咖啡因摄入量, 每天咖啡因上限, 400mg, 安全停饮时间, 咖啡因半衰期, 几点不能喝咖啡, 美式咖啡因含量',
  author: 'Util工具箱',
  ogTitle: '咖啡因摄入计算器 - 有条工具',
  ogDescription: '算今日咖啡因是否超400mg，按半衰期推算安全停饮时间',
  ogUrl: 'https://www.util.cn/tools/caffeine-intake-calculator',
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
          name: '咖啡因摄入计算器',
          url: 'https://www.util.cn/tools/caffeine-intake-calculator',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['常见饮品咖啡因参考含量表', '今日摄入累加与400mg状态', '孕期200mg口径开关', '半衰期推算安全停饮时间', '8小时后残留参考量']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '咖啡因摄入计算器', item: 'https://www.util.cn/tools/caffeine-intake-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '下午几点后不宜喝咖啡？',
              acceptedAnswer: { '@type': 'Answer', text: '取决于总量与入睡时间。以半衰期5小时估算，一杯中杯美式（225mg）约需15.5小时降到50mg助眠线，两杯超过20小时，建议把最后一杯提前到午后早段。' }
            },
            {
              '@type': 'Question',
              name: '可乐和能量饮料也要计入吗？',
              acceptedAnswer: { '@type': 'Answer', text: '需要。一罐250ml能量饮料约80mg、一罐330ml可乐约34mg，加上黑巧、抹茶等都会贡献咖啡因，叠加后容易超出预期。' }
            },
            {
              '@type': 'Question',
              name: '计算结果准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '含量为常见出餐规格参考值，半衰期按健康成人典型5小时估算（个体约3-7小时），结果仅供日常参考，孕期、哺乳期及服药人群请咨询医生。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'caffeine-intake-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 默认填入现在时间（避免 SSR 水合差异，放在 onMounted）
  if (!nowTime.value) {
    nowTime.value = new Date().toTimeString().slice(0, 5)
  }
})

/* __PURE_START__ */
// 咖啡因参考表（mg/标准份）
const CAFFEINE_ITEMS = [
  { key: 'espresso', name: '意式浓缩', mg: 63, unit: '份(约30ml)' },
  { key: 'americano', name: '美式(中杯)', mg: 225, unit: '杯' },
  { key: 'latte', name: '拿铁(中杯)', mg: 150, unit: '杯' },
  { key: 'cold-brew', name: '冷萃(中杯)', mg: 200, unit: '杯' },
  { key: 'pour-over', name: '手冲咖啡', mg: 95, unit: '杯' },
  { key: 'black-tea', name: '红茶', mg: 47, unit: '杯' },
  { key: 'green-tea', name: '绿茶', mg: 28, unit: '杯' },
  { key: 'oolong', name: '乌龙茶', mg: 16, unit: '杯' },
  { key: 'cola', name: '可乐(罐330ml)', mg: 34, unit: '罐' },
  { key: 'energy-drink', name: '能量饮料(罐250ml)', mg: 80, unit: '罐' },
  { key: 'instant-coffee', name: '速溶咖啡', mg: 62, unit: '杯' },
  { key: 'matcha', name: '抹茶', mg: 70, unit: '杯' },
  { key: 'dark-choco', name: '黑巧克力', mg: 24, unit: '块(40g)' },
  { key: 'milk-choco', name: '牛奶巧克力', mg: 6, unit: '块(40g)' }
]

const ADULT_LIMIT = 400      // 成人每日参考上限 mg
const PREGNANCY_LIMIT = 200  // 孕期建议上限 mg
const HALF_LIFE = 5          // 半衰期小时
const SLEEP_LINE = 50        // 助眠线 mg

// 今日总量 = Σ(品类含量 × 份数)
const caffeineTotal = (drinks) => drinks.reduce((sum, r) => {
  const item = CAFFEINE_ITEMS.find(i => i.key === r.key)
  const count = Number(r.count)
  if (!item || !isFinite(count)) return sum
  return sum + item.mg * count
}, 0)

// 状态：绿 low（<上限一半）/ 黄 mid（到上限）/ 红 high（超上限）
const caffeineStatus = (total, limit) => {
  if (total < limit / 2) return 'low'
  if (total <= limit) return 'mid'
  return 'high'
}

// remaining = total × 0.5^(t/halfLife)，求 remaining 降到 target 的时间 t
const timeToBelow = (total, halfLife, target) => {
  if (!(total > target)) return 0
  return halfLife * Math.log2(total / target)
}

// t 小时后体内仍残留多少 mg
const remainingAt = (total, hours, halfLife) => total * Math.pow(0.5, hours / halfLife)

// 时钟加法：'HH:MM' + 小时 → 'HH:MM'（跨天取模）
const addHoursToClock = (hhmm, hours) => {
  if (!hhmm || !hhmm.includes(':')) return ''
  const parts = hhmm.split(':')
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (!isFinite(h) || !isFinite(m)) return ''
  const totalMin = Math.round(h * 60 + m + hours * 60)
  const wrapped = ((totalMin % 1440) + 1440) % 1440
  const hh = String(Math.floor(wrapped / 60)).padStart(2, '0')
  const mm = String(wrapped % 60).padStart(2, '0')
  return `${hh}:${mm}`
}
/* __PURE_END__ */

// ---------- 状态 ----------
const rows = ref([{ key: 'americano', count: 1 }])
const pregnancyMode = ref(false)
const nowTime = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const addRow = () => {
  rows.value.push({ key: 'espresso', count: 1 })
}

const removeRow = (idx) => {
  if (rows.value.length <= 1) {
    rows.value = [{ key: 'americano', count: 1 }]
    return
  }
  rows.value = rows.value.filter((_, i) => i !== idx)
}

// ---------- 计算 ----------
const activeLimit = computed(() => (pregnancyMode.value ? PREGNANCY_LIMIT : ADULT_LIMIT))
const limitLabel = computed(() => (pregnancyMode.value ? '孕期建议' : '成人参考'))

const totalMg = computed(() => caffeineTotal(rows.value))

const status = computed(() => caffeineStatus(totalMg.value, activeLimit.value))

const statusText = computed(() => {
  if (status.value === 'low') return '绿色 · 摄入较轻'
  if (status.value === 'mid') return '黄色 · 接近上限'
  return '红色 · 已超过参考上限'
})

const percentOfLimit = computed(() => Math.round(totalMg.value / activeLimit.value * 100))

const barWidth = computed(() => Math.min(100, percentOfLimit.value))

const breakdown = computed(() => rows.value
  .map(r => {
    const item = CAFFEINE_ITEMS.find(i => i.key === r.key)
    const count = Number(r.count) || 0
    if (!item || count <= 0) return null
    return { key: r.key + '-' + count, name: item.name, count, mg: Math.round(item.mg * count) }
  })
  .filter(Boolean))

const hoursToSleepLine = computed(() => timeToBelow(totalMg.value, HALF_LIFE, SLEEP_LINE))

const sleepReadyClock = computed(() => addHoursToClock(nowTime.value, hoursToSleepLine.value))

const remainingAfter8h = computed(() => Math.round(remainingAt(totalMg.value, 8, HALF_LIFE)))
</script>
