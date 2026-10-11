<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Heart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">儿童疫苗接种日历</h1>
          <p class="text-sm text-muted-foreground mt-1">按出生日期生成国家免疫规划接种日历，标注当前月龄应接种项与补种提示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入宝宝出生日期，即可按国家免疫规划疫苗程序（2021版）生成从出生到 6 周岁的完整接种日历：每个"月龄节点"自动换算为应种日期，标注"关注补种 / 当月应种 / 未来安排"三档状态，附补种规则说明。全部计算在浏览器本地完成，数据不上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarClock class="w-5 h-5 mr-2 text-primary" /> 宝宝信息
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">出生日期</label>
          <input
            v-model="birth"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">计算基准日（默认今天，可改）</label>
          <input
            v-model="today"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div v-if="summary" class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">当前月龄</p>
          <p class="text-2xl font-bold text-primary">{{ summary.monthAgeText }}</p>
          <p class="text-xs text-muted-foreground mt-1.5">
            已到应种节点 {{ summary.dueCount }} 个，其中
            <span class="text-amber-600 dark:text-amber-400 font-medium">已过月龄 {{ summary.overdueCount }} 个</span>
          </p>
        </div>

        <div class="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
          <p class="font-medium text-foreground mb-1">换算规则</p>
          <p>X 月龄应种日期 = 出生日期 + X 个自然月（月末出生自动取月末）。当前月龄 = 出生至基准日的整月数，处于该区间内的节点标记为"当月应种"。</p>
        </div>

        <!-- 导出操作 -->
        <div v-if="calendar.length" class="space-y-2">
          <label class="block text-sm font-medium text-foreground">导出日历</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="printCalendar"
              class="py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
            >
              <Printer class="w-3.5 h-3.5" /> 打印接种日历
            </button>
            <button
              @click="copyAsText"
              class="py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center justify-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> {{ copied ? '已复制' : '复制为文本' }}
            </button>
          </div>
          <p class="text-[10px] text-muted-foreground">打印时自动隐藏输入区，仅输出日历表格；内容全程本地生成，不上传。</p>
        </div>
      </div>

      <!-- 日历区 -->
      <div class="lg:col-span-2 space-y-4">
        <template v-if="calendar.length">
          <!-- 状态图例 + 日历表 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-4">
              <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 国家免疫规划疫苗儿童接种情况对照表（2021版）
            </h2>
            <div class="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground flex-wrap">
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-300"></span>已过月龄 · 关注补种</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-300"></span>当月应种</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-muted border border-border"></span>未来安排</span>
            </div>
            <div class="overflow-x-auto rounded-lg border border-border/50">
              <table class="w-full text-sm min-w-[560px]">
                <thead class="bg-muted">
                  <tr>
                    <th class="text-left px-3 py-2 font-medium text-muted-foreground w-24">月龄节点</th>
                    <th class="text-left px-3 py-2 font-medium text-muted-foreground w-32">应种日期</th>
                    <th class="text-left px-3 py-2 font-medium text-muted-foreground">疫苗与剂次</th>
                    <th class="text-left px-3 py-2 font-medium text-muted-foreground w-36">状态</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="node in calendar" :key="node.monthAge">
                    <tr
                      v-for="(vaccine, vi) in node.vaccines"
                      :key="node.monthAge + '-' + vi"
                      :class="node.status === 'overdue' ? 'bg-red-50 dark:bg-red-900/10' : node.status === 'current' ? 'bg-green-50 dark:bg-green-900/10' : vi % 2 === 0 ? 'bg-muted/20' : ''"
                    >
                      <td class="px-3 py-1.5 text-foreground font-medium">{{ vi === 0 ? node.monthLabel : '' }}</td>
                      <td class="px-3 py-1.5 text-muted-foreground">{{ vi === 0 ? node.dateISO : '' }}</td>
                      <td class="px-3 py-1.5 text-foreground">{{ vaccine }}</td>
                      <td class="px-3 py-1.5">
                        <span v-if="vi === 0" class="px-2 py-0.5 rounded text-[10px] font-medium"
                          :class="node.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : node.status === 'current' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-muted text-muted-foreground'">
                          {{ node.status === 'overdue' ? '已过月龄 · 关注补种' : node.status === 'current' ? '当月应种' : '未来安排' }}
                        </span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 补种规则说明 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-3">
              <Info class="w-5 h-5 mr-2 text-primary" /> 补种与接种通用规则
            </h2>
            <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
              <li>未完成程序剂次的儿童应尽早补种，无需重新开始全程接种，只需补完未完成的剂次。</li>
              <li>两剂次疫苗之间一般需间隔 <span class="text-foreground font-medium">≥28 天</span>（≥14 天的工序另有说明），请勿在同一窗口密集预约多种多剂。</li>
              <li>同一条手臂可同时接种<span class="text-foreground font-medium">不同疫苗</span>时，注射部位应相距 ≥2.5cm；如需在同侧接种两种注射疫苗建议分两侧手臂。</li>
              <li>现存"免疫规划疫苗"由国家免费提供；本表为 2021 版国家免疫规划程序，各地对进口替代、联合疫苗（如五联）安排不同，以接种门诊实际为准。</li>
              <li>接种前请如实告知健康状况（发热、急性疾病应暂缓），接种后留观 30 分钟。</li>
            </ul>
          </div>
        </template>

        <div v-else class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          {{ !today ? '正在初始化日期…' : '请输入宝宝出生日期，生成接种日历' }}
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于国家免疫规划疫苗程序</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            国家免疫规划疫苗儿童免疫程序（2021版）规定了从出生到 6 周岁应接种的疫苗种类与剂次时间：乙肝疫苗 3 剂、卡介苗 1 剂、脊灰疫苗 4 剂、百白破 4 剂加白破加强、麻腮风 2 剂、流脑与乙脑、甲肝等按月龄安排。按程序按时接种，是儿童入托入学的硬性查验条件。
          </p>
          <h3 class="text-lg font-semibold text-foreground">月龄与接种日期怎么对应</h3>
          <p>
            程序表中的"X 月龄"指满 X 个整月后的时间段：出生日起算满月进入 1 月龄、满两个月进入 2 月龄，以此类推。本工具把每个节点换算成具体应种日期，并以当前月龄对照，标注"关注补种 / 当月应种 / 未来安排"，方便家长对照疫苗本查漏。
          </p>
          <h3 class="text-lg font-semibold text-foreground">错过月龄怎么办</h3>
          <p>
            错过不代表作废：免疫规划疫苗均可补种，原则是尽早补齐未完成剂次、剂次间满足最小间隔（一般 ≥28 天），无需从头重打。不同疫苗补种起始年龄与联合方案有差异，建议带接种本到接种门诊由医生出具补种方案。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">非免疫规划疫苗（自费）要打吗？</span>自费疫苗是对免疫程序的补充，如五联、轮状、手足口、水痘等，经济允许时建议按知情自愿原则选择，可与免费疫苗参照说明书间隔安排。</li>
            <li><span class="text-foreground font-medium">两种疫苗能同一天打吗？</span>免疫规划疫苗之间通常可以同时在不同部位接种；与其他疫苗同接需遵循说明书与门诊安排，剂次间隔一般不短于 2 周（注射减毒活疫苗未同接时建议间隔 ≥28 天）。</li>
            <li><span class="text-foreground font-medium">接种本丢失了怎么办？</span>可到原接种门诊补办，接种记录一般已上传区域免疫规划信息系统；本工具生成的日历仅作家庭提醒，不能替代接种证。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'vaccine-schedule-calculator'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Heart, CalendarClock, ClipboardList, Info, Printer, Copy, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '儿童疫苗接种日历 - 国家免疫规划接种时间表查询',
  description: '输入出生日期按国家免疫规划疫苗程序（2021版）生成0-6周岁接种日历，自动换算各月龄应种日期，标注补种/当月应种/未来安排三档状态，支持打印导出，纯本地计算',
  keywords: '疫苗接种时间表, 儿童疫苗日历, 免疫规划程序, 宝宝疫苗, 疫苗补种, 接种证查询',
  author: 'Util工具箱',
  ogTitle: '儿童疫苗接种日历 - 有条工具',
  ogDescription: '按出生日期生成国家免疫规划接种日历，标注当前月龄应接种项与补种提示',
  ogUrl: 'https://www.util.cn/tools/vaccine-schedule-calculator',
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
          name: '儿童疫苗接种日历',
          url: 'https://www.util.cn/tools/vaccine-schedule-calculator',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按出生日期生成接种日历', '月龄节点换算应种日期', '补种/当月/未来三档状态', '2021版免疫规划程序', '打印与文本导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '儿童疫苗接种日历', item: 'https://www.util.cn/tools/vaccine-schedule-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '错过月龄还能补种吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。免疫规划疫苗均可补种，原则是尽早补齐未完成剂次、剂次间满足最小间隔（一般≥28天），无需从头重打。' }
            },
            {
              '@type': 'Question',
              name: '两种疫苗能同一天打吗？',
              acceptedAnswer: { '@type': 'Answer', text: '免疫规划疫苗之间通常可同时在不同部位接种；与其他疫苗同接需遵循说明书与门诊安排，间隔一般不短于2周。' }
            },
            {
              '@type': 'Question',
              name: '接种本丢失了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '可到原接种门诊补办，记录一般已上传区域免疫规划信息系统；本工具日历仅作家庭提醒，不能替代接种证。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'vaccine-schedule-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  const now = new Date()
  today.value = toISODate(now)
})

// ---------- 纯函数（可独立测试） ----------
const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parseISO = (s) => {
  const parts = String(s).split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2])
}

// 出生日期 + months 个自然月（月末自动钳制到当月最后一天）
const addMonthsClamped = (date, months) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) d.setDate(0)
  return d
}

// 月龄节点应种日期（ISO 字符串）
const nodeDateISO = (birthISO, monthAge) => toISODate(addMonthsClamped(parseISO(birthISO), monthAge))

// 当前整月龄
const fullMonthAge = (birthISO, todayISO) => {
  const b = parseISO(birthISO)
  const t = parseISO(todayISO)
  let m = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth())
  if (t.getDate() < b.getDate()) m -= 1
  return Math.max(0, m)
}

// 国家免疫规划疫苗儿童免疫程序（2021版）：月龄 → 疫苗名数组
const SCHEDULE = [
  { monthAge: 0, vaccines: ['乙肝疫苗第1剂', '卡介苗（出生时）'] },
  { monthAge: 1, vaccines: ['乙肝疫苗第2剂'] },
  { monthAge: 2, vaccines: ['脊灰疫苗第1剂'] },
  { monthAge: 3, vaccines: ['脊灰疫苗第2剂', '百白破疫苗第1剂'] },
  { monthAge: 4, vaccines: ['脊灰疫苗第3剂', '百白破疫苗第2剂'] },
  { monthAge: 5, vaccines: ['百白破疫苗第3剂'] },
  { monthAge: 6, vaccines: ['乙肝疫苗第3剂', 'A群流脑多糖疫苗第1剂'] },
  { monthAge: 8, vaccines: ['麻腮风疫苗第1剂', '乙脑减毒活疫苗第1剂'] },
  { monthAge: 9, vaccines: ['A群流脑多糖疫苗第2剂'] },
  { monthAge: 18, vaccines: ['百白破疫苗第4剂', '麻腮风疫苗第2剂', '甲肝减毒活疫苗第1剂'] },
  { monthAge: 24, vaccines: ['乙脑减毒活疫苗第2剂'] },
  { monthAge: 36, vaccines: ['A群C群流脑多糖疫苗第1剂'] },
  { monthAge: 48, vaccines: ['脊灰疫苗第4剂'] },
  { monthAge: 72, vaccines: ['白破疫苗加强', 'A群C群流脑多糖疫苗第2剂'] }
]

const monthAgeLabel = (m) => (m < 12 ? `${m}月龄` : `${m / 12}周岁`)

// ---------- 状态 ----------
const birth = ref('')
const today = ref('')
const copied = ref(false)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 完整接种日历（按时间排序）
const calendar = computed(() => {
  if (!birth.value || !today.value) return []
  if (isNaN(parseISO(birth.value).getTime())) return []
  const age = fullMonthAge(birth.value, today.value)
  return SCHEDULE.map((item) => {
    let status = 'future'
    if (age > item.monthAge) status = 'overdue'
    else if (age === item.monthAge) status = 'current'
    return {
      monthAge: item.monthAge,
      monthLabel: monthAgeLabel(item.monthAge),
      vaccines: item.vaccines,
      dateISO: nodeDateISO(birth.value, item.monthAge),
      status
    }
  })
})

const summary = computed(() => {
  if (!calendar.value.length) return null
  const age = fullMonthAge(birth.value, today.value)
  return {
    monthAgeText: age >= 36 ? `${(age / 12).toFixed(1)} 周岁（${age} 月龄）` : `${age} 月龄`,
    dueCount: calendar.value.filter(n => n.status !== 'future').length,
    overdueCount: calendar.value.filter(n => n.status === 'overdue').length
  }
})

// ---------- 导出 ----------
const calendarAsText = () => {
  const lines = [`儿童疫苗接种日历（国家免疫规划疫苗程序 2021版）`, `出生日期：${birth.value}`, `生成基准日：${today.value}`, '']
  for (const node of calendar.value) {
    const statusText = node.status === 'overdue' ? '已过月龄·关注补种' : node.status === 'current' ? '当月应种' : '未来安排'
    lines.push(`【${node.monthLabel}】应种日期 ${node.dateISO}（${statusText}）`)
    for (const v of node.vaccines) lines.push(`  - ${v}`)
  }
  lines.push('', '注：仅作家庭提醒，不能替代预防接种证；补种方案请咨询接种门诊。')
  return lines.join('\n')
}

const printCalendar = () => { window.print() }

const copyAsText = async () => {
  try {
    await navigator.clipboard.writeText(calendarAsText())
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    // 降级：选中文本域方式
    const ta = document.createElement('textarea')
    ta.value = calendarAsText()
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
