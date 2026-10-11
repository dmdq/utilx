<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Baby class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">孕周计算产检日历</h1>
          <p class="text-sm text-muted-foreground mt-1">末次月经输入得孕周与预产期，40周逐周发育对照，产检节点自动换算为日期</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入末次月经（LMP）或预产期任一日期，即可算出当前孕周、孕天与预产期，自动生成 40 周逐周发育对照表和按具体日期标注状态的产检日历。全部计算在浏览器本地完成，无需联网上传任何信息。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 输入日期
        </h2>

        <!-- 输入模式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">计算依据</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="inputMode = 'lmp'"
              :class="inputMode === 'lmp' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >末次月经（LMP）</button>
            <button
              @click="inputMode = 'due'"
              :class="inputMode === 'due' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >预产期</button>
          </div>
        </div>

        <div v-if="inputMode === 'lmp'">
          <label class="block text-sm font-medium text-foreground mb-2">末次月经第一天</label>
          <input
            v-model="lmp"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">月经规律（28天周期）时按此计算最准</p>
        </div>

        <div v-else>
          <label class="block text-sm font-medium text-foreground mb-2">预产期</label>
          <input
            v-model="dueInput"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">医生告知的预产期，将反推末次月经日期</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">计算基准日（默认今天，可改）</label>
          <input
            v-model="today"
            type="date"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div class="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
          <p class="font-medium text-foreground mb-1">算法说明</p>
          <p>孕周 = floor((基准日 − 末次月经) ÷ 7)，孕天 = 差值 mod 7；预产期 = 末次月经 + 280 天（40 周）。医学上孕周从末次月经首日起算，而非受孕日。</p>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="lg:col-span-2 space-y-4">
        <template v-if="result">
          <!-- 当前孕周大卡片 -->
          <div class="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
            <p class="text-sm text-muted-foreground mb-2">当前孕周（基准日 {{ today }}）</p>
            <p class="text-5xl font-bold text-primary mb-3">{{ result.weeks }}周<span class="text-2xl">+{{ result.dayInWeek }}天</span></p>
            <div class="flex items-center justify-center gap-2 flex-wrap">
              <span :class="trimesterBadge.class" class="px-3 py-1 rounded-full text-xs font-medium">{{ trimesterBadge.label }}</span>
              <span v-if="result.overdueDays > 0" class="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">已过预产期 {{ result.overdueDays }} 天</span>
              <span v-else class="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">距预产期 {{ result.daysToDue }} 天</span>
            </div>
            <div class="mt-4">
              <div class="h-2 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all" :style="{ width: result.progressPercent + '%' }"></div>
              </div>
              <p class="text-xs text-muted-foreground mt-1.5">孕期进度 {{ result.progressPercent }}%（满 40 周为 100%）</p>
            </div>
          </div>

          <!-- 关键日期 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-card border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">{{ inputMode === 'lmp' ? '预产期' : '末次月经' }}</p>
              <p class="text-sm font-bold text-foreground">{{ inputMode === 'lmp' ? result.dueISO : lmp }}</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">孕足月日（37周）</p>
              <p class="text-sm font-bold text-foreground">{{ result.fullTermISO }}</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">已孕天数</p>
              <p class="text-sm font-bold text-foreground">{{ result.daysPreg }} 天</p>
            </div>
            <div class="bg-card border border-border rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">当前阶段</p>
              <p class="text-sm font-bold text-foreground">{{ trimesterBadge.label }}</p>
            </div>
          </div>

          <!-- 产检日历 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-4">
              <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 产检日历（按末次月经自动换算日期）
            </h2>
            <div class="space-y-2">
              <div
                v-for="node in prenatalCalendar"
                :key="node.name"
                class="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border"
                :class="node.status === 'done' ? 'border-border/50 bg-muted/30 opacity-75' : node.status === 'current' ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-background'"
              >
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 w-fit"
                  :class="node.status === 'done' ? 'bg-muted text-muted-foreground' : node.status === 'current' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
                >{{ node.status === 'done' ? '已完成' : node.status === 'current' ? '本周进行' : '未到' }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-sm text-foreground">{{ node.name }}</span>
                    <span class="text-xs text-muted-foreground">{{ node.weekLabel }}</span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ node.note }} · {{ node.startISO }} ~ {{ node.endISO }}</p>
                </div>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3">产检节点为国内常见安排，不同医院方案略有差异，请以产检医院医嘱为准。</p>
          </div>
        </template>

        <div v-else class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          {{ inputHint }}
        </div>
      </div>
    </div>

    <!-- 40 周逐周发育简表 -->
    <div v-if="result" class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <ListChecks class="w-5 h-5 mr-2 text-primary" /> 40 周逐周发育简表
      </h2>
      <div class="max-h-96 overflow-y-auto rounded-lg border border-border/50">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-muted">
            <tr>
              <th class="text-left px-3 py-2 font-medium text-muted-foreground w-20">孕周</th>
              <th class="text-left px-3 py-2 font-medium text-muted-foreground">发育要点</th>
              <th class="text-left px-3 py-2 font-medium text-muted-foreground w-32">体重近似</th>
              <th class="text-left px-3 py-2 font-medium text-muted-foreground w-28">身长近似</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="w in weeklyTable"
              :key="w.week"
              :class="w.status === 'current' ? 'bg-primary/10' : w.week % 2 === 0 ? 'bg-muted/20' : ''"
            >
              <td class="px-3 py-1.5">
                <span class="font-medium text-foreground">{{ w.week }}周</span>
                <span v-if="w.status === 'current'" class="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">本周</span>
              </td>
              <td class="px-3 py-1.5 text-muted-foreground">{{ w.note }}</td>
              <td class="px-3 py-1.5 text-muted-foreground">{{ w.weight }}</td>
              <td class="px-3 py-1.5 text-muted-foreground">{{ w.length }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground mt-3">体重/身长为按临床均值线性内插的社区经验参考值，个体差异较大，仅供了解大致趋势，请以超声检查结果为准。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于孕周计算与产检安排</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            孕周（gestational age）是孕期管理的通用语言：从末次月经第一天起算，全程 40 周、280 天。B 超、产检节点、预产期推算都建立在孕周之上，因此准确记住末次月经日期非常重要；月经不规律或周期偏长时，应以孕早期（11-13周）超声测量的头臀长为准修正孕周。
          </p>
          <h3 class="text-lg font-semibold text-foreground">孕早中晚期怎么划分</h3>
          <p>
            0-13 周为孕早期（器官形成关键期，注意补充叶酸、避免致畸因素）；14-27 周为孕中期（胎儿快速生长，孕妇状态通常最舒适的阶段）；28-40 周为孕晚期（重点是胎动监测、胎心监护与分娩准备）。本工具会根据当前孕周自动标注所在阶段。
          </p>
          <h3 class="text-lg font-semibold text-foreground">产检时间表为什么重要</h3>
          <p>
            NT（11-13周+6）、唐筛（15-20周）、大排畸（20-24周）、糖耐（24-28周）等关键产检都有严格的孕周窗口，错过窗口就无法补做或需要换用其他方案。本工具把每个节点换算成具体日期区间并标注状态，方便对照日历提前预约。
          </p>
          <h3 class="text-lg font-semibold text-foreground">预产期只是参考不是截止日</h3>
          <p>
            统计上只有约 5% 的宝宝恰好在预产期出生，37-42 周内分娩都属正常范围。孕 37 周即算足月，孕 41 周后医生通常会评估是否引产。预产期的作用是给孕期管理一个统一的时间锚点。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">月经不规律，按末次月经算准吗？</span>不一定。排卵推迟会导致实际孕周偏小，建议以孕早期 B 超头臀长核对，用医生按超声修正后的预产期回填本工具。</li>
            <li><span class="text-foreground font-medium">为什么孕 0 周也算"怀孕"？</span>孕周从末次月经首日起算，排卵受孕发生在约孕 2 周末，所以"孕 4 周"实际受孕约 2 周，这是国际通行的计算口径。</li>
            <li><span class="text-foreground font-medium">逐周发育数据可靠吗？</span>关键节点描述对应通行产检安排；体重/身长为按临床均值线性内插的社区经验参考值，个体差异大，仅作趋势参考。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pregnancy-week-calculator'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Baby, CalendarDays, ClipboardList, ListChecks, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '孕周计算产检日历 - 孕周/预产期查询与产检时间表',
  description: '输入末次月经或预产期，即时算出当前孕周孕天、预产期与孕早中晚期，附40周逐周发育对照表和自动换算日期并标注状态的产检日历，纯本地计算不上传',
  keywords: '孕周计算器, 产检时间表, 预产期计算, 胎儿每周发育, 孕期查询, 产检日历',
  author: 'Util工具箱',
  ogTitle: '孕周计算产检日历 - 有条工具',
  ogDescription: '输入末次月经得孕周与预产期，40周逐周发育对照，产检节点自动换算为日期',
  ogUrl: 'https://www.util.cn/tools/pregnancy-week-calculator',
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
          name: '孕周计算产检日历',
          url: 'https://www.util.cn/tools/pregnancy-week-calculator',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['孕周孕天计算', '预产期推算', '孕早中晚期标注', '40周发育对照', '产检日期日历']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '孕周计算产检日历', item: 'https://www.util.cn/tools/pregnancy-week-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '月经不规律，按末次月经算准吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不一定。排卵推迟会导致实际孕周偏小，建议以孕早期B超头臀长核对，用医生按超声修正后的预产期回填计算。' }
            },
            {
              '@type': 'Question',
              name: '为什么孕0周也算怀孕？',
              acceptedAnswer: { '@type': 'Answer', text: '孕周从末次月经首日起算，排卵受孕发生在约孕2周末，这是国际通行的计算口径。' }
            },
            {
              '@type': 'Question',
              name: '逐周发育数据可靠吗？',
              acceptedAnswer: { '@type': 'Answer', text: '关键节点对应通行产检安排；体重身长为按临床均值线性内插的社区经验参考值，个体差异大，仅作趋势参考。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pregnancy-week-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 基准日默认当天，末次月经给出示例值便于直接查看结果
  const now = new Date()
  today.value = toISODate(now)
  if (!lmp.value) lmp.value = toISODate(addDays(now, -70))
})

// ---------- 纯函数（可独立测试） ----------
const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parseISO = (s) => {
  const parts = String(s).split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2])
}
const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + n)
  return x
}

// 核心：按末次月经与基准日计算孕周信息
const computePregnancy = (lmpISO, todayISO) => {
  if (!lmpISO || !todayISO) return null
  const lmp = parseISO(lmpISO)
  const today = parseISO(todayISO)
  if (isNaN(lmp.getTime()) || isNaN(today.getTime())) return null
  const daysPreg = Math.floor((today - lmp) / 86400000)
  const weeks = Math.floor(daysPreg / 7)
  const dayInWeek = ((daysPreg % 7) + 7) % 7
  const due = addDays(lmp, 280)
  const fullTerm = addDays(lmp, 37 * 7)
  const daysToDue = Math.round((due - today) / 86400000)
  return {
    daysPreg,
    weeks,
    dayInWeek,
    dueISO: toISODate(due),
    fullTermISO: toISODate(fullTerm),
    daysToDue,
    overdueDays: Math.max(0, -daysToDue),
    progressPercent: Math.max(0, Math.min(100, Math.round((daysPreg / 280) * 100)))
  }
}

// 预产期反推末次月经
const lmpFromDue = (dueISO) => toISODate(addDays(parseISO(dueISO), -280))

// 逐周发育：关键周文案 + 体重/身长临床均值锚点线性内插（社区经验参考值）
const WEEK_NOTES = {
  1: '受精卵形成，沿输卵管向子宫移动',
  2: '排卵受精完成，受精卵开始分裂',
  3: '受精卵着床，胚胎开始发育',
  4: '胚泡完成着床，早孕试纸可测出',
  5: '心脏开始跳动，神经管闭合',
  6: '可见胎芽与原始心管搏动',
  7: '面部五官雏形开始显现',
  8: '初具人形，四肢萌芽（约1g）',
  9: '各器官雏形基本具备',
  10: '正式进入胎儿期',
  11: '生殖器开始分化发育',
  12: 'NT检查窗口（11-13周+6）',
  13: '早期流产风险显著降低',
  14: '进入孕中期，胎儿听力开始发育',
  15: '皮肤薄，可透见血管',
  16: '可辨性别，开始出现打嗝',
  17: '皮下脂肪开始形成',
  18: '骨髓开始参与造血',
  19: '感觉器官快速发育',
  20: '可感受到胎动，准备大排畸',
  21: '胎动日益明显规律',
  22: '眉毛眼睑清晰可辨',
  23: '听觉灵敏，对声音有反应',
  24: '大排畸窗口（20-24周），肺部产生表面活性物质',
  25: '皮肤逐渐变得不透明',
  26: '眼睛可以睁开，对光有反应',
  27: '味蕾发育完善，会吸吮手指',
  28: '进入孕晚期，胎动规律（建议数胎动）',
  29: '骨骼快速钙化，需补钙',
  30: '大脑进入快速发育期',
  31: '肺与消化道接近成熟',
  32: '胎位检查窗口，多数转为头位',
  33: '皮下脂肪快速积累',
  34: '胎心监护启动（34周起每周）',
  35: '听力发育完全，肺部趋近成熟',
  36: '入盆评估，胎位基本固定',
  37: '孕足月，随时可能发动',
  38: '继续增重，练习呼吸动作',
  39: '胎盘供能达到峰值',
  40: '预产期本周，做好入院准备'
}
const GROWTH_ANCHORS = [
  [8, 1, 1.6], [12, 14, 6], [16, 100, 11.6], [20, 300, 25],
  [24, 600, 30], [28, 1100, 35], [32, 1800, 40], [36, 2700, 47], [40, 3400, 51]
]
const interpGrowth = (week) => {
  if (week <= 7) return null
  const anchors = GROWTH_ANCHORS
  if (week >= anchors[anchors.length - 1][0]) {
    const last = anchors[anchors.length - 1]
    return { weightG: last[1], lengthCm: last[2] }
  }
  for (let i = 0; i < anchors.length - 1; i++) {
    const [w1, g1, l1] = anchors[i]
    const [w2, g2, l2] = anchors[i + 1]
    if (week >= w1 && week <= w2) {
      const t = (week - w1) / (w2 - w1)
      return {
        weightG: Math.round(g1 + (g2 - g1) * t),
        lengthCm: Math.round((l1 + (l2 - l1) * t) * 10) / 10
      }
    }
  }
  return null
}

// 产检节点表（单位：周，可含小数表示周+天）
const PRENATAL_NODES = [
  { name: '建档检查', start: 6, end: 8 + 6 / 7, note: '确认宫内妊娠，建立孕产妇保健手册' },
  { name: 'NT检查', start: 11, end: 13 + 6 / 7, note: '胎儿颈项透明层超声，窗口严格' },
  { name: '无创DNA（NIPT）', start: 12, end: 22, note: '胎儿游离DNA产前筛查' },
  { name: '唐氏筛查（中期）', start: 15, end: 20, note: '血清学唐氏综合征筛查' },
  { name: '大排畸（系统超声）', start: 20, end: 24, note: '胎儿系统结构筛查' },
  { name: '糖耐量试验（OGTT）', start: 24, end: 28, note: '妊娠期糖尿病筛查' },
  { name: '小排畸超声', start: 28, end: 32, note: '补漏筛查与生长发育评估' },
  { name: '胎心监护', start: 34, end: 40, note: '34周起每周一次' },
  { name: '足月评估', start: 37, end: 40, note: '评估胎位与分娩方式' }
]

// ---------- 状态 ----------
const inputMode = ref('lmp')
const lmp = ref('')
const dueInput = ref('')
const today = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fmtWeekLabel = (w) => {
  const full = Math.floor(w)
  const days = Math.round((w - full) * 7)
  return days > 0 ? `${full}周+${days}天` : `${full}周`
}

// 当前孕周结果（预产期输入时先反推 LMP；基准日早于末次月经时视为无效）
const effectiveLmpISO = computed(() => {
  return inputMode.value === 'lmp' ? lmp.value : (dueInput.value ? lmpFromDue(dueInput.value) : '')
})

const result = computed(() => {
  if (!effectiveLmpISO.value || !today.value) return null
  const p = computePregnancy(effectiveLmpISO.value, today.value)
  if (!p || p.daysPreg < 0) return null
  return p
})

const inputHint = computed(() => {
  if (!today.value) return '正在初始化日期…'
  if (effectiveLmpISO.value && parseISO(effectiveLmpISO.value) > parseISO(today.value)) {
    return '基准日早于末次月经/预产期，请检查日期是否填写正确'
  }
  if (inputMode.value === 'lmp') return '请选择末次月经第一天开始计算'
  return '请输入医生告知的预产期开始计算'
})

const trimesterBadge = computed(() => {
  if (!result.value) return { label: '—', class: 'bg-muted text-muted-foreground' }
  const w = result.value.weeks
  if (w < 14) return { label: '孕早期（0-13周）', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' }
  if (w < 28) return { label: '孕中期（14-27周）', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
  return { label: '孕晚期（28-40周）', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' }
})

// 产检日历：节点换算为具体日期区间并标注状态
const prenatalCalendar = computed(() => {
  if (!result.value || !effectiveLmpISO.value) return []
  const base = parseISO(effectiveLmpISO.value)
  const todayDays = result.value.daysPreg
  return PRENATAL_NODES.map((node) => {
    const startDay = Math.round(node.start * 7)
    const endDay = Math.round(node.end * 7)
    const startISO = toISODate(addDays(base, startDay))
    const endISO = toISODate(addDays(base, endDay))
    let status = 'future'
    if (todayDays > endDay) status = 'done'
    else if (todayDays >= startDay) status = 'current'
    return {
      name: node.name,
      note: node.note,
      weekLabel: `${fmtWeekLabel(node.start)} - ${fmtWeekLabel(node.end)}`,
      startISO,
      endISO,
      status
    }
  })
})

// 40 周逐周发育简表
const weeklyTable = computed(() => {
  if (!result.value) return []
  const cur = result.value.weeks
  const rows = []
  for (let w = 1; w <= 40; w++) {
    const g = interpGrowth(w)
    rows.push({
      week: w,
      note: WEEK_NOTES[w] || '稳步发育中',
      weight: g ? (g.weightG >= 1000 ? (Math.round(g.weightG / 50) * 50 / 1000).toFixed(2) + ' kg' : g.weightG + ' g') : '—',
      length: g ? g.lengthCm + ' cm' : '—',
      status: w === cur ? 'current' : 'other'
    })
  }
  return rows
})
</script>
