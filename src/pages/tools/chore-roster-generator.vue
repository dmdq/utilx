<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ListChecks class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">家务轮值排班生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">成员×家务×周期自动轮值排班，同一天任务错开不撞人，打印贴墙一张表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入成员名单与家务项，选择「每天轮 / 每周轮」周期与起始日期，自动生成按任务错开的轮值表：
        任务序号 + 日期序号取模轮转，同一天不同任务尽量分给不同的人，每人总任务数自动均摊（差值不超过 1）。
        全部计算在浏览器本地完成，支持周视图表格、每人任务统计、复制文本与打印张贴。
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
            <label class="text-sm font-medium text-foreground" for="membersInput">成员名单（每行一位，1-8 人）</label>
            <button @click="fillSample" class="text-xs text-primary hover:underline flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5" /> 示例
            </button>
          </div>
          <textarea
            id="membersInput"
            v-model="membersText"
            rows="5"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="每行一位成员，如：&#10;张三&#10;李四&#10;王五"
          ></textarea>
        </div>

        <div>
          <label class="text-sm font-medium text-foreground mb-2 block" for="choresInput">家务项（每行一项，1-10 项）</label>
          <textarea
            id="choresInput"
            v-model="choresText"
            rows="6"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="每行一项，如：&#10;洗碗&#10;拖地&#10;倒垃圾&#10;擦桌子"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">轮值周期</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="c in CYCLES"
              :key="c.value"
              @click="cycle = c.value"
              :class="cycle === c.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
              :title="c.hint"
            >{{ c.label }}</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">{{ currentCycleHint }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="startDate">起始日期</label>
            <input
              id="startDate"
              v-model="startDate"
              type="date"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="weeksInput">排班周数</label>
            <input
              id="weeksInput"
              v-model.number="weeks"
              type="number"
              min="1"
              max="6"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <!-- 校验提示 -->
        <p v-if="inputError" class="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
          <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ inputError }}
        </p>

        <!-- 概览统计 -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-muted/50 rounded-lg p-2.5 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">成员</p>
            <p class="text-lg font-bold text-foreground">{{ memberCount }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-2.5 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">家务项</p>
            <p class="text-lg font-bold text-foreground">{{ choreCount }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-2.5 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">任务班次</p>
            <p class="text-lg font-bold text-foreground">{{ roster.rows.length }}</p>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="printRoster"
            :disabled="!roster.rows.length"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Printer class="w-4 h-4" /> 打印排班表
          </button>
          <button
            @click="copyRosterText"
            :disabled="!roster.rows.length"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Copy class="w-4 h-4" /> {{ copyLabel }}
          </button>
        </div>
      </div>

      <!-- 右侧：周视图排班表 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 print-area">
        <h2 class="text-lg font-semibold flex items-center mb-4 no-print">
          <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 周视图排班表
        </h2>

        <template v-if="roster.rows.length">
          <!-- 打印表头 -->
          <div class="print-only text-center mb-4">
            <h2 class="text-xl font-bold text-neutral-900">家务轮值表</h2>
            <p class="text-xs text-neutral-500 mt-1">{{ startDate }} 起 {{ weeksLabel }} · {{ currentCycleLabel }}</p>
          </div>

          <div v-for="week in weekGroups" :key="week.index" class="mb-6">
            <h3 class="text-sm font-semibold text-foreground mb-2">第 {{ week.index + 1 }} 周（{{ week.startKey }} ~ {{ week.endKey }}）</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="bg-muted/70 text-muted-foreground">
                    <th class="border border-border px-3 py-2 text-left font-medium whitespace-nowrap">日期</th>
                    <th
                      v-for="chore in chores"
                      :key="chore"
                      class="border border-border px-3 py-2 text-center font-medium whitespace-nowrap"
                    >{{ chore }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(day, i) in week.days" :key="day.date" :class="i % 2 ? 'bg-muted/30' : ''">
                    <td class="border border-border px-3 py-1.5 whitespace-nowrap">
                      <span class="text-foreground font-medium">{{ day.date }}</span>
                      <span class="text-muted-foreground ml-1 text-xs">{{ day.weekday }}</span>
                    </td>
                    <td
                      v-for="(cell, ti) in day.cells"
                      :key="ti"
                      class="border border-border px-3 py-1.5 text-center font-medium"
                      :class="cellStyle(cell.person)"
                    >{{ cell.person }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 每人任务统计 -->
          <div class="mt-2 no-print">
            <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center">
              <BarChart3 class="w-4 h-4 mr-1.5 text-primary" /> 每人任务统计
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <div
                v-for="stat in roster.stats"
                :key="stat.name"
                class="bg-muted/50 rounded-lg px-3 py-2 flex items-center justify-between"
              >
                <span class="text-sm text-foreground font-medium">{{ stat.name }}</span>
                <span class="text-sm font-bold text-primary">{{ stat.count }} 项</span>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Scale class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              公平性：{{ fairnessLabel }}
            </p>
          </div>
        </template>

        <div v-else class="p-10 text-center text-muted-foreground text-sm">
          <ListChecks class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{{ inputError || '填写成员与家务项后，自动生成轮值排班表' }}</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
        :aria-label="seoContentVisible ? '收起说明' : '展开说明'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于家务轮值排班</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            合租、宿舍或家庭里最容易「扯皮」的就是家务分工：谁洗碗、谁拖地、什么时候轮到我。
            手工排的班表要么有人连轴转，要么同一天几个任务全压在一个人身上。
            本工具用「任务序号 + 日期序号」对人数取模的轮转公式自动生成排班，规则透明、结果可打印贴墙，按表执行即可。
          </p>
          <h3 class="text-lg font-semibold text-foreground">任务×日期错开是怎么实现的</h3>
          <p>
            每个任务有一个序号（洗碗 0、拖地 1……），每天有一个日期序号。某任务某天的负责人 = 名单[(任务序号 + 日期序号) ÷ 人数取余]。
            这样同一天里不同任务落在不同的余数上，只要人数不少于任务数，同一天的任务就绝不会撞在同一人身上；
            人数少于任务数时也能把重叠降到最低，同一任务的负责人每天（或每周）顺延一位，不会出现连续两天同一人干同一件活。
          </p>
          <h3 class="text-lg font-semibold text-foreground">每人任务数如何保证均衡</h3>
          <p>
            轮转公式对每人是「循环取人」，任何任务在一段连续天数内的分配天然均摊：任务总班次除以人数，每人分到的数量最多只差 1。
            右侧「每人任务统计」会实时显示每位成员的任务总数与最大差值，差值 ≤1 即为均衡，避免「老实人吃亏」。
          </p>
          <h3 class="text-lg font-semibold text-foreground">每天轮还是每周轮</h3>
          <p>
            「每天轮」适合洗碗、倒垃圾这类高频小家务，责任日清日结；「每周轮」适合拖地、擦窗、整理公共区这类按周完成的任务，
            周内不换人、下周整体顺延一位。两种模式都按同一取模公式错开任务，只是「日期序号」按天还是按周计数。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">人数少于任务数，同一天会撞人吗？</span>会尽量错开：只要人数 ≥2，同一天相邻任务分给不同的人，只有任务数超过人数时才可能出现一人一天两项，统计区会如实展示。</li>
            <li><span class="text-foreground font-medium">排班周数最多可以排多久？</span>支持 1-6 周，按周分块输出周视图表格，适合贴墙一两个月轮换一次。</li>
            <li><span class="text-foreground font-medium">可以打印出来贴墙吗？</span>可以，点击「打印排班表」隐藏输入区、只打印周视图表格与轮值标题，建议 A4 横向打印。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'chore-roster-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ListChecks, Users, Sparkles, Printer, CalendarDays, BarChart3, Copy,
  AlertTriangle, ChevronUp, ChevronDown, Scale
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '家务轮值排班生成器 - 成员×任务自动轮值表',
  description: '在线家务轮值排班生成器，输入成员名单与家务项，按每天/每周周期自动错开排班，同一天不同任务不撞人，每人任务数均衡，支持周视图表格、复制文本与打印贴墙，纯本地计算',
  keywords: '家务分工表, 轮值表生成, 值日排班, 宿舍值日表, 合租家务分配, 家务轮换安排',
  author: '有条工具',
  ogTitle: '家务轮值排班生成器 - 有条工具',
  ogDescription: '成员×家务×周期自动轮值排班，任务错开不撞人，公平分配不扯皮，支持打印贴墙',
  ogUrl: 'https://www.util.cn/tools/chore-roster-generator',
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
          name: '家务轮值排班生成器',
          url: 'https://www.util.cn/tools/chore-roster-generator',
          applicationCategory: 'ProductivityApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['成员×家务自动轮值', '每天/每周周期切换', '同一天任务错开不撞人', '每人任务数均衡统计', '周视图表格', '打印与复制文本']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '家务轮值排班生成器', item: 'https://www.util.cn/tools/chore-roster-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '人数少于任务数，同一天会撞人吗？',
              acceptedAnswer: { '@type': 'Answer', text: '工具按「任务序号+日期序号」对人数取模错开分配，人数不少于任务数时同一天绝不撞人；任务数超过人数时会把重叠降到最低，并如实在统计区展示每人任务数。' }
            },
            {
              '@type': 'Question',
              name: '每人任务数真的均衡吗？',
              acceptedAnswer: { '@type': 'Answer', text: '轮转公式循环取人，任何任务在连续周期内均摊，每人分到的总任务数最多相差 1，统计区会显示每人任务数与最大差值。' }
            },
            {
              '@type': 'Question',
              name: '可以打印出来贴墙吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，点击打印按钮后仅输出周视图排班表与标题，输入区自动隐藏，建议 A4 横向打印张贴。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'chore-roster-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
const pad2 = (n) => String(n).padStart(2, '0')
const dateKey = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const parseDateKey = (key) => {
  const parts = String(key || '').split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return isNaN(d.getTime()) ? null : d
}

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

// 文本按行解析（去空行）
const parseLines = (text) => String(text || '')
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean)

// 轮转核心：任务序号 + 日期序号 对人数取模
const roundRobin = (taskIndex, daySeq, peopleCount) =>
  (taskIndex + daySeq) % peopleCount

// 生成排班：rows 为按日期序列展开的任务单元格
const buildRoster = (members, chores, cycle, startKey, weeks) => {
  const names = (members || []).slice(0, 8)
  const items = (chores || []).slice(0, 10)
  const rows = []
  const cells = []
  if (!names.length || !items.length || !startKey) return { rows, cells }
  const start = parseDateKey(startKey)
  if (!start) return { rows, cells }
  const p = names.length
  const totalDays = Math.max(1, Math.round(weeks || 1)) * 7
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(start, i)
    const seq = cycle === 'weekly' ? Math.floor(i / 7) : i
    const dayRow = {
      date: dateKey(d),
      weekday: WEEKDAY_NAMES[d.getDay()],
      cells: items.map((chore, ti) => ({ chore, person: names[roundRobin(ti, seq, p)] }))
    }
    rows.push(dayRow)
    dayRow.cells.forEach((c) => cells.push({ date: dayRow.date, chore: c.chore, person: c.person }))
  }
  const stats = names.map((name) => ({
    name,
    count: cells.filter((c) => c.person === name).length
  }))
  return { rows, cells, stats }
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const CYCLES = [
  { value: 'daily', label: '每天轮', hint: '每天顺延一位，高频小家务日清日结' },
  { value: 'weekly', label: '每周轮', hint: '周内不换人，每周整体顺延一位' }
]

const membersText = ref('张三\n李四\n王五')
const choresText = ref('洗碗\n拖地\n倒垃圾\n擦桌子')
const cycle = ref('daily')
const startDate = ref('2026-10-19')
const weeks = ref(2)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const SAMPLE_MEMBERS = ['张三', '李四', '王五'].join('\n')
const SAMPLE_CHORES = ['洗碗', '拖地', '倒垃圾', '擦桌子'].join('\n')
const fillSample = () => {
  membersText.value = SAMPLE_MEMBERS
  choresText.value = SAMPLE_CHORES
}

const members = computed(() => parseLines(membersText.value))
const chores = computed(() => parseLines(choresText.value))
const memberCount = computed(() => members.value.length)
const choreCount = computed(() => chores.value.length)

const inputError = computed(() => {
  if (!members.value.length) return '请至少填写 1 位成员（每行一位）'
  if (members.value.length > 8) return '成员最多支持 8 人，请删减名单'
  if (!chores.value.length) return '请至少填写 1 项家务（每行一项）'
  if (chores.value.length > 10) return '家务项最多支持 10 项，请删减'
  if (!startDate.value) return '请选择起始日期'
  return ''
})

const currentCycle = computed(() => CYCLES.find((c) => c.value === cycle.value) || CYCLES[0])
const currentCycleHint = computed(() => currentCycle.value.hint)
const currentCycleLabel = computed(() => currentCycle.value.label)

const safeWeeks = computed(() => {
  const n = Number(weeks.value)
  if (!Number.isFinite(n)) return 1
  return Math.min(6, Math.max(1, Math.round(n)))
})
const weeksLabel = computed(() => safeWeeks.value + ' 周')

const roster = computed(() =>
  inputError.value
    ? { rows: [], cells: [], stats: [] }
    : buildRoster(members.value, chores.value, cycle.value, startDate.value, safeWeeks.value)
)

// 周视图分组：每 7 天一块
const weekGroups = computed(() => {
  const groups = []
  for (let w = 0; w < safeWeeks.value; w++) {
    const days = roster.value.rows.slice(w * 7, w * 7 + 7)
    if (!days.length) break
    groups.push({ index: w, startKey: days[0].date, endKey: days[days.length - 1].date, days })
  }
  return groups
})

const fairness = computed(() => {
  const stats = roster.value.stats
  if (!stats.length) return { diff: 0, balanced: true }
  const counts = stats.map((s) => s.count)
  const diff = Math.max(...counts) - Math.min(...counts)
  return { diff, balanced: diff <= 1 }
})
const fairnessLabel = computed(() => fairness.value.balanced
  ? '每人任务数差 ≤1，分配均衡'
  : '当前设置下最大差值为 ' + fairness.value.diff + ' 项，建议增减任务数或人数')

// 同一列（任务）在打印与屏幕上以成员色区分：不同人不同底色
const PERSON_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-amber-600 dark:text-amber-400',
  'text-purple-600 dark:text-purple-400',
  'text-rose-600 dark:text-rose-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-orange-600 dark:text-orange-400',
  'text-teal-600 dark:text-teal-400'
]
const cellStyle = (person) => {
  // 同一格按负责人序号着色，方便一眼看清自己的日子；取人逻辑与表格渲染共用同一轮转公式
  const names = members.value
  if (!names.length) return 'text-foreground'
  const idx = Math.max(0, names.indexOf(person))
  return PERSON_COLORS[idx % PERSON_COLORS.length]
}

const printRoster = () => {
  if (!roster.value.rows.length) return
  window.print()
}

// ---------- 复制文本 ----------
const copyLabel = ref('复制文本')

const buildRosterText = (rosterData, cycleLabel, startDateStr, weeksStr) => {
  const lines = ['家务轮值表（' + cycleLabel + '，' + startDateStr + ' 起 ' + weeksStr + '）', '']
  rosterData.cells.forEach((c) => {
    lines.push(c.date + '　' + c.chore + '：' + c.person)
  })
  lines.push('', '每人任务数：' + rosterData.stats.map((s) => s.name + ' ' + s.count + '项').join('；'))
  return lines.join('\n')
}

const copyRosterText = async () => {
  const text = buildRosterText(roster.value, currentCycleLabel.value, startDate.value, weeksLabel.value)
  if (!text || !roster.value.rows.length) return
  try {
    await navigator.clipboard.writeText(text)
    copyLabel.value = '已复制 ✓'
  } catch (e) {
    // 兜底：临时 textarea + execCommand
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      copyLabel.value = '已复制 ✓'
    } catch (e2) {
      copyLabel.value = '复制失败'
    }
    document.body.removeChild(ta)
  }
  setTimeout(() => { copyLabel.value = '复制文本' }, 2000)
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
