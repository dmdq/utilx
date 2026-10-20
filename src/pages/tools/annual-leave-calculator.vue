<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CalendarRange class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">带薪年假折算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按累计工龄算年假天数，入离职当年按比例折算，未休补偿参考</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入累计工龄（或直接填年数，或按首份工作日期推算）与本年度在职情况，自动得出全年应得年假、当年实际折算天数、未休天数与未休年假工资补偿参考。折算规则按《职工带薪年休假条例》及实施办法的公开口径：不足 1 整天部分不保留。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 我的情况
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">累计工龄（含其他单位工作时间）</label>
          <div class="grid grid-cols-2 gap-1.5 mb-2">
            <button
              @click="seniorityMode = 'direct'"
              :class="seniorityMode === 'direct' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >直接填年数</button>
            <button
              @click="seniorityMode = 'date'"
              :class="seniorityMode === 'date' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >按首份工作日期推算</button>
          </div>
          <input
            v-if="seniorityMode === 'direct'"
            v-model.number="seniorityYears"
            type="number"
            min="0"
            max="50"
            step="0.5"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="累计工作年数"
          />
          <input
            v-else
            v-model="firstWorkDate"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">累计工龄 = 在不同单位工作的时间总和，满 1 年才享受年假</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">本年度在职状态</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="s in statusOptions"
              :key="s.value"
              @click="status = s.value"
              :class="status === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ s.label }}</button>
          </div>
        </div>

        <div v-if="status === 'joined'">
          <label class="block text-sm font-medium text-foreground mb-2">本年度在本单位已过日历天数</label>
          <input
            v-model.number="daysElapsed"
            type="number"
            min="0"
            max="365"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">从入职之日起算至年末（或至今天）的自然天数</p>
        </div>

        <div v-if="status === 'leaving'">
          <label class="block text-sm font-medium text-foreground mb-2">离职日期</label>
          <input
            v-model="leaveDate"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">本年度已工作天数按 1 月 1 日至离职日（含当日）自动计算{{ workedDaysText }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">本年度已休年假天数</label>
          <input
            v-model.number="usedDays"
            type="number"
            min="0"
            max="30"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">日工资（元，算未休补偿用）</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
            <input
              v-model.number="dailyWage"
              type="number"
              min="0"
              step="10"
              class="w-full pl-8 pr-4 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 800"
            />
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">通常按本人月工资除以月计薪天数 21.75 天折算（剔除加班工资后）</p>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 折算结果
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div class="bg-muted/50 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">累计工龄</p>
            <p class="text-xl font-bold text-foreground">{{ effectiveSeniority.toFixed(1) }} 年</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">工龄对应档</p>
            <p class="text-xl font-bold text-foreground">{{ seniorityBandText }}</p>
          </div>
        </div>

        <div class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">全年应得年假</p>
          <p class="text-3xl font-bold text-primary">{{ annualEntitlement }} 天</p>
        </div>

        <div class="space-y-2.5 text-sm">
          <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span class="text-muted-foreground">当年实际可休（折算后）</span>
            <span class="font-semibold text-foreground">{{ convertedEntitlement }} 天</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span class="text-muted-foreground">已休天数</span>
            <span class="font-semibold text-foreground">{{ Math.max(0, usedDays) }} 天</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span class="text-muted-foreground">未休天数</span>
            <span class="font-semibold" :class="unusedDays > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'">{{ unusedDays }} 天</span>
          </div>
        </div>

        <div class="bg-muted/50 rounded-lg p-4">
          <p class="text-xs text-muted-foreground mb-1">未休年假工资补偿参考（{{ status === 'leaving' ? '离职折算口径' : '跨年度安排口径' }}）</p>
          <p class="text-xl font-bold text-foreground">¥{{ fmt(compensation) }}</p>
          <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            按日工资 × 300% × 未休天数估算，其中 300% 已包含正常工作期间支付的 100% 工资（即单位另行支付 200%）；在职未休能否跨年结算、按 200% 还是 300% 主张，各地仲裁口径不同，以当地规定为准。
          </p>
        </div>

        <div class="p-4 bg-muted/50 rounded-lg border border-border">
          <h3 class="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
            <Lightbulb class="w-4 h-4" /> 折算口径提示
          </h3>
          <ul class="list-disc pl-5 space-y-1 text-xs text-muted-foreground leading-relaxed">
            <li>折算公式：（本年度已过日历天数 ÷ 365）× 全年应得天数，不足 1 整天部分不保留</li>
            <li>{{ status === 'joined' ? `折算式：(${clampedDaysElapsed} ÷ 365) × ${annualEntitlement} ≈ ${rawConvertedText} → 取整 ${convertedEntitlement} 天` : status === 'leaving' ? `离职折算：（本年度已工作天数 ÷ 365）× 全年应得 − 已休天数` : '整年在职：按全年应得天数，不折算' }}</li>
            <li>依法享受寒暑假且天数多于年假、请事假累计 20 天以上单位不扣工资等情形，当年不享受年假（条例公开口径）</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        年假天数与折算规则按《职工带薪年休假条例》及其实施办法公开规定整理（工龄满 1 年不满 10 年 5 天、满 10 年不满 20 年 10 天、满 20 年 15 天），以最新官方政策与单位规章制度为准；未休补偿的支付口径各地执行存在差异，涉及争议建议咨询当地人社部门或专业律师。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于带薪年假折算</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            带薪年休假天数取决于「累计工作时间」而非本单位工龄：职工在不同用人单位的工作时间可以累加计算，一般以档案记录、社保缴费记录、劳动合同等证明。本工具按公开规定自动分档并折算入离职当年的天数。
          </p>
          <h3 class="text-lg font-semibold text-foreground">年假天数怎么分档</h3>
          <p>
            累计工龄满 1 年不满 10 年，每年休 5 天；满 10 年不满 20 年，休 10 天；满 20 年，休 15 天。国家法定休假日与休息日不计入年假假期。这里说的是「全年应得」，入职当年和离职当年需要按比例折算。
          </p>
          <h3 class="text-lg font-semibold text-foreground">入职、离职当年怎么折算</h3>
          <p>
            入职当年：（在本单位剩余日历天数 ÷ 365）× 全年应得天数；离职当年：（当年度在本单位已过日历天数 ÷ 365）× 全年应得天数 − 当年度已休天数。折算后不足 1 整天的部分不享受、也不支付补偿。例如工龄 8 年、3 月 1 日入职当年：(306 ÷ 365) × 5 ≈ 4.19 天，实际可休 4 天。
          </p>
          <h3 class="text-lg font-semibold text-foreground">未休年假怎么补偿</h3>
          <p>
            单位因工作需要不能安排休年假，经本人同意可不休，但应按日工资收入的 300% 支付未休年假工资报酬，其中包含单位已支付的正常工作期间工资（即另付 200%）。离职时未休完的折算天数同样适用该补偿口径；职工本人书面提出不休的除外。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <div class="space-y-3">
            <div>
              <h4 class="font-semibold text-foreground">Q1：年假多少天是按总工龄还是本公司工龄？</h4>
              <p class="mt-1">按累计工作时间（总工龄）确定天数档次，在本单位连续工作满 1 个月以上即可享受；换工作不影响累计口径，但需能提供社保、档案等工龄证明。</p>
            </div>
            <div>
              <h4 class="font-semibold text-foreground">Q2：中途入职，当年的年假怎么算？</h4>
              <p class="mt-1">用「剩余日历天数 ÷ 365 × 全年应得」折算，小数部分直接舍去（不足 1 整天不保留）。如 3 月 1 日入职、工龄 8 年（应得 5 天），(306 ÷ 365) × 5 ≈ 4.19，当年可休 4 天。</p>
            </div>
            <div>
              <h4 class="font-semibold text-foreground">Q3：离职时没休完的年假单位要给钱吗？</h4>
              <p class="mt-1">应给出：先按已过日历天数折算当年应休天数，减去已休即为未休，按日工资 300%（含正常工资 100%）支付参考；具体是否支持跨年安排、举证责任等，各地仲裁口径略有差异。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'annual-leave-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CalendarRange, Calculator, FileText, Lightbulb, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '带薪年假折算器 - 年假天数/离职折算/未休补偿计算',
  description: '在线带薪年假折算器，按累计工龄分档（1-10年5天、10-20年10天、20年以上15天），支持年中入职与离职按日历天数比例折算、不足1整天不保留，附未休年假300%工资补偿参考，纯本地计算不上传数据',
  keywords: '年假多少天, 年假折算公式, 离职年假怎么算, 未休年假补偿, 工龄年假, 带薪年休假计算器',
  author: 'Util工具箱',
  ogTitle: '带薪年假折算器 - 有条工具',
  ogDescription: '按累计工龄算年假天数，入离职当年按比例折算并给未休补偿参考',
  ogUrl: 'https://www.util.cn/tools/annual-leave-calculator',
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
          name: '带薪年假折算器',
          url: 'https://www.util.cn/tools/annual-leave-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['累计工龄三档判定', '入职离职按比例折算', '不足1整天不保留', '未休年假补偿参考', '薪资数据本地计算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '带薪年假折算器', item: 'https://www.util.cn/tools/annual-leave-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '年假多少天是按总工龄还是本公司工龄？',
              acceptedAnswer: { '@type': 'Answer', text: '按累计工作时间（总工龄）分档：满1年不满10年5天、满10年不满20年10天、满20年15天，不同单位的工作时间可累加。' }
            },
            {
              '@type': 'Question',
              name: '中途入职当年年假怎么折算？',
              acceptedAnswer: { '@type': 'Answer', text: '（在本单位剩余日历天数÷365）×全年应得天数，折算后不足1整天的部分不保留。例如3月1日入职、应得5天，(306÷365)×5≈4.19天，当年可休4天。' }
            },
            {
              '@type': 'Question',
              name: '离职时未休完的年假有补偿吗？',
              acceptedAnswer: { '@type': 'Answer', text: '按当年已过日历天数折算应休天数减去已休，未休部分按日工资300%（含正常工资100%）支付参考，各地执行口径存在差异。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'annual-leave-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const seniorityMode = ref('direct') // direct: 直接填年数 | date: 按首份工作日期推算
const seniorityYears = ref(8)
const firstWorkDate = ref('')
const status = ref('full') // full 在职整年 | joined 年中入职 | leaving 年中离职
const daysElapsed = ref(365)
const leaveDate = ref('')
const usedDays = ref(0)
const dailyWage = ref(0)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const statusOptions = [
  { value: 'full', label: '在职整年' },
  { value: 'joined', label: '年中入职' },
  { value: 'leaving', label: '年中离职' }
]

const fmt = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '0')

// ---------- 工龄 ----------
const effectiveSeniority = computed(() => {
  if (seniorityMode.value === 'direct') {
    return Math.max(0, seniorityYears.value || 0)
  }
  if (!firstWorkDate.value) return 0
  const start = new Date(`${firstWorkDate.value}T00:00:00`).getTime()
  if (Number.isNaN(start)) return 0
  return Math.max(0, (Date.now() - start) / 86400000 / 365.25)
})

const annualEntitlement = computed(() => {
  const y = effectiveSeniority.value
  if (y < 1) return 0
  if (y < 10) return 5
  if (y < 20) return 10
  return 15
})

const seniorityBandText = computed(() => {
  const y = effectiveSeniority.value
  if (y < 1) return '不满1年'
  if (y < 10) return '1-10年'
  if (y < 20) return '10-20年'
  return '满20年'
})

// ---------- 本年度已过/已工作日历天数 ----------
const clampedDaysElapsed = computed(() => Math.min(365, Math.max(0, Math.round(daysElapsed.value || 0))))

const workedDays = computed(() => {
  if (!leaveDate.value) return 0
  const d = new Date(`${leaveDate.value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return 0
  const jan1 = new Date(d.getFullYear(), 0, 1).getTime()
  const days = Math.round((d.getTime() - jan1) / 86400000) + 1 // 含离职当日
  return Math.min(365, Math.max(0, days))
})

const workedDaysText = computed(() => {
  if (status.value !== 'leaving' || !leaveDate.value) return ''
  return `（约 ${workedDays.value} 天）`
})

const relevantDays = computed(() => {
  if (status.value === 'joined') return clampedDaysElapsed.value
  if (status.value === 'leaving') return workedDays.value
  return 365
})

// ---------- 折算 ----------
const rawConverted = computed(() => (relevantDays.value / 365) * annualEntitlement.value)
const rawConvertedText = computed(() => rawConverted.value.toFixed(2))
const convertedEntitlement = computed(() => Math.floor(rawConverted.value)) // 不足1整天不保留
const unusedDays = computed(() => Math.max(0, convertedEntitlement.value - Math.max(0, usedDays.value || 0)))
const compensation = computed(() => Math.max(0, dailyWage.value || 0) * 3 * unusedDays.value)
</script>
