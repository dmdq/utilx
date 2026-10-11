<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CalendarClock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">驾照换证记分计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">换证窗口（期满前 90 天）、清分日倒计时、逾期分级后果一键算清</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入初领日期即可算清：当前有效期的到期日（未填则按初领 + 6 年推算）、最早可换证日期（有效期满前 90 天）、6 年 → 10 年 → 长期的有效期升档序列，以及按初领日期周年日滚动的记分清分日与倒计时。工具还会按今天的日期给出状态徽章（正常 / 可换证 / 逾期未换 / 已注销），A、B 类驾照另有记分审验提示。全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 基本信息
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">初领日期</label>
          <input
            v-model="firstIssueDate"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">当前有效期至（可选）</label>
          <input
            v-model="expireInput"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">不填则按「初领日期 + 6 年 − 1 天」自动推算第一个有效期</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">准驾车型</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="vehicleClass = 'C'"
              :class="vehicleClass === 'C' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg text-sm font-medium transition-all"
            >C1 / C2 类</button>
            <button
              @click="vehicleClass = 'AB'"
              :class="vehicleClass === 'AB' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg text-sm font-medium transition-all"
            >A / B 类</button>
          </div>
        </div>

        <div class="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
          计算口径：换证窗口为有效期满前 90 日（含当日）；记分周期为 12 个月，从初领日期起算，每个周年日自动清分；A、B 类记分周期内只要有记分（含 1 分）就需要参加审验。
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <BadgeCheck class="w-5 h-5 mr-2 text-primary" /> 计算结果
        </h2>

        <template v-if="firstIssue && expireDate">
          <!-- 状态徽章 -->
          <div class="rounded-lg p-5 text-center" :class="status.bg">
            <p class="text-xs text-muted-foreground mb-1">当前状态（按今天 {{ fmtDate(today) }}）</p>
            <p class="text-2xl font-bold" :class="status.text">{{ status.label }}</p>
            <p class="text-xs mt-1.5" :class="status.text">{{ status.desc }}</p>
          </div>

          <!-- 关键日期 -->
          <div class="text-sm">
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">当前有效期至</span>
              <span class="text-foreground font-medium">{{ fmtDate(expireDate) }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">最早可换日期（期满前 90 日）</span>
              <span class="text-primary font-medium">{{ fmtDate(earliestSwapDate) }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">下一个清分日</span>
              <span class="text-foreground font-medium">{{ fmtDate(nextClearDate) }}</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-muted-foreground">距下一个清分日</span>
              <span class="text-foreground font-medium">还有 {{ daysToClear }} 天</span>
            </div>
          </div>

          <!-- 有效期序列 -->
          <div>
            <h3 class="text-sm font-medium text-foreground mb-2">有效期升档序列（C / A / B 类通用）</h3>
            <div class="space-y-2">
              <div
                v-for="(p, i) in periods"
                :key="i"
                class="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <span class="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{{ i + 1 }}</span>
                <div>
                  <p class="text-sm font-medium text-foreground">{{ p.name }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ p.range }}</p>
                </div>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
              规则：每个记分周期内记分均未满 12 分，期满换证时才能升入更长有效期（6 年 → 10 年 → 长期）；任一周期记满 12 分则维持原档换发。
            </p>
          </div>

          <!-- A/B 类附加提示 -->
          <div v-if="vehicleClass === 'AB'" class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              A、B 类附加提示：记分周期内有记分（即使只记 1 分）就需要在周期结束后 30 日内参加审验；连续几个周期无记分可免审验。换证前请先处理完未缴的罚款。
            </p>
          </div>
        </template>

        <div v-else class="p-8 text-center text-muted-foreground">
          请先选择有效的初领日期
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="seoContentVisible = !seoContentVisible"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>驾驶证换证与记分周期规则</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
                驾驶证有效期不是从拿证那天整年开始算整年，而是"初领日期 + 年数 − 1 天"，例如 2020 年 3 月 15 日初领，第一个有效期至 2026 年 3 月 14 日。记分周期则是每 12 个月一轮，以初领日期的周年日为界，周期内的记分在周年日当天自动清零（前提是罚款已缴清）。
          </p>
          <h3 class="text-lg font-semibold text-foreground">有效期升档规则</h3>
          <p>
                第一次换证后有效期一般为 6 年；6 年内每个记分周期均未记满 12 分，可换发 10 年有效期驾驶证；10 年内同样表现良好，则换发长期有效的驾驶证。若某个周期记满 12 分，升档进程就要从该周期重新积累，因此"满分"不仅意味着学习和考试，还会影响换证档位。
          </p>
          <h3 class="text-lg font-semibold text-foreground">逾期不换证的分级后果</h3>
          <p>
                有效期满前 90 日内即可申请换证；有效期满后 1 年内仍可正常办理期满换证；超过 1 年未满 3 年，驾驶证被注销但处于可恢复状态，通过科目一考试即可恢复；超过 3 年则驾驶证彻底注销，需要重新报名考试。A、B 类还需注意：记分周期内有记分就要参加审验。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">换证窗口是什么时候？</span>有效期满前 90 日内即可申请期满换证，例如有效期至 2026-03-14，最早 2025-12-15 就可以办理，换证后有效期从原到期日起算。</li>
            <li><span class="text-foreground font-medium">清分日怎么计算？</span>记分周期为 12 个月，从初领日期起算，每个周年日自动清分；例如 2020-03-15 初领，则每年 3 月 15 日清分，前提是违法罚款已缴清。</li>
            <li><span class="text-foreground font-medium">逾期不换证会怎样？</span>有效期满后 1 年内可正常换证；超过 1 年未满 3 年注销可恢复，需考科目一；超过 3 年需重新报考。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'driver-license-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CalendarClock, CalendarDays, BadgeCheck, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '驾照换证记分计算器 - 换证窗口/清分日/逾期后果',
  description: '在线驾照换证记分计算器：算换证窗口（有效期满前 90 天最早可换日期）、6年→10年→长期有效期序列、按初领周年日滚动的记分清分日与倒计时，逾期分级后果状态徽章，C1/A/B 类通用',
  keywords: '驾照换证时间, 记分周期计算, 清分日, 驾驶证有效期, 换证90天, 逾期换证',
  author: 'Util工具箱',
  ogTitle: '驾照换证记分计算器 - 有条工具',
  ogDescription: '算换证窗口（期满前90天）、记分清分日、逾期分级后果，C1/A/B 类通用',
  ogUrl: 'https://www.util.cn/tools/driver-license-calculator',
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
          name: '驾照换证记分计算器',
          url: 'https://www.util.cn/tools/driver-license-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['换证窗口计算（期满前90日）', '6年→10年→长期有效期序列', '记分清分日与倒计时', '逾期分级状态徽章', 'A/B 类审验提示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '驾照换证记分计算器', item: 'https://www.util.cn/tools/driver-license-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '换证窗口是什么时候？',
              acceptedAnswer: { '@type': 'Answer', text: '有效期满前 90 日内即可申请期满换证，例如有效期至 2026-03-14，最早 2025-12-15 就可以办理。' }
            },
            {
              '@type': 'Question',
              name: '清分日怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: '记分周期为 12 个月，从初领日期起算，每个周年日自动清分，前提是违法罚款已缴清。' }
            },
            {
              '@type': 'Question',
              name: '逾期不换证会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '有效期满后 1 年内可正常换证；超过 1 年未满 3 年注销可恢复，需考科目一；超过 3 年需重新报考。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'driver-license-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const firstIssueDate = ref('2020-03-15')
const expireInput = ref('')
const vehicleClass = ref('C')
const seoContentVisible = ref(true)

// ---------- 日期工具 ----------
const today = new Date()

const parseDate = (s) => {
  if (!s) return null
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s).trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(d.getTime()) ? null : d
}

const addDays = (date, n) => {
  const d = new Date(date.getTime())
  d.setDate(d.getDate() + n)
  return d
}

const addYears = (date, n) => {
  const d = new Date(date.getTime())
  d.setFullYear(d.getFullYear() + n)
  return d
}

const fmtDate = (d) => {
  if (!d) return '—'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------- 计算 ----------
const firstIssue = computed(() => parseDate(firstIssueDate.value))

const expireDate = computed(() => {
  if (!firstIssue.value) return null
  const manual = parseDate(expireInput.value)
  if (manual) return manual
  return addDays(addYears(firstIssue.value, 6), -1)
})

// 期满前 90 日（含当日共 90 天），即到期日往前推 89 天
const earliestSwapDate = computed(() => (expireDate.value ? addDays(expireDate.value, -89) : null))

const periods = computed(() => {
  if (!firstIssue.value) return []
  const fi = firstIssue.value
  const p1End = addDays(addYears(fi, 6), -1)
  const p2Start = addYears(fi, 6)
  const p2End = addDays(addYears(fi, 16), -1)
  const p3Start = addYears(fi, 16)
  return [
    { name: '第 1 个有效期（6 年）', range: `${fmtDate(fi)} 至 ${fmtDate(p1End)}` },
    { name: '第 2 个有效期（10 年）', range: `${fmtDate(p2Start)} 至 ${fmtDate(p2End)}` },
    { name: '第 3 个有效期（长期）', range: `${fmtDate(p3Start)} 起 长期有效` }
  ]
})

// 清分日：初领日期周年日，取今天之后（不含今天）最近的一个
const nextClearDate = computed(() => {
  if (!firstIssue.value) return null
  const fi = firstIssue.value
  const candidate = new Date(today.getFullYear(), fi.getMonth(), fi.getDate())
  if (candidate.getTime() <= today.getTime()) {
    candidate.setFullYear(candidate.getFullYear() + 1)
  }
  return candidate
})

const daysToClear = computed(() => {
  if (!nextClearDate.value) return '—'
  return Math.ceil((nextClearDate.value.getTime() - today.getTime()) / 86400000)
})

// 状态分级
const status = computed(() => {
  const exp = expireDate.value
  const earliest = earliestSwapDate.value
  if (!exp || !earliest) {
    return { key: 'unknown', label: '待计算', desc: '请选择有效的初领日期', bg: 'bg-muted/50', text: 'text-muted-foreground' }
  }
  if (today.getTime() < earliest.getTime()) {
    return {
      key: 'normal', label: '正常',
      desc: `未到换证窗口，最早 ${fmtDate(earliest)} 可申请换证`,
      bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400'
    }
  }
  if (today.getTime() <= exp.getTime()) {
    return {
      key: 'swappable', label: '可换证',
      desc: '已进入换证窗口，可申请期满换证',
      bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400'
    }
  }
  if (today.getTime() <= addYears(exp, 1).getTime()) {
    return {
      key: 'overdue', label: '逾期未换',
      desc: '有效期满未满 1 年，仍可正常办理期满换证',
      bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400'
    }
  }
  if (today.getTime() <= addYears(exp, 3).getTime()) {
    return {
      key: 'revocable', label: '已注销',
      desc: '注销未满 3 年可恢复，需通过科目一考试',
      bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400'
    }
  }
  return {
    key: 'revoked', label: '已注销',
    desc: '注销超过 3 年，驾驶资格终止，需重新报名考试',
    bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400'
  }
})
</script>
