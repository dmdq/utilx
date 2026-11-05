<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">周数计算器</h1>
      <p class="text-muted-foreground">计算日期所在的周数，查询指定年份的周数信息</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：周数查询 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">日期周数查询</h2>

          <!-- 日期输入 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">选择日期</label>
              <input
                v-model="selectedDate"
                type="date"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @input="calculateWeekInfo"
              />
              <div class="mt-2 flex gap-2">
                <button
                  @click="setToday"
                  class="px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  今天
                </button>
                <button
                  @click="setThisWeek"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  本周
                </button>
                <button
                  @click="setThisMonth"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  本月
                </button>
              </div>
            </div>

            <!-- 周数结果 -->
            <div v-if="weekInfo" class="space-y-3">
              <div class="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-sm text-muted-foreground">第几周</div>
                  <button
                    @click="copyWeekInfo"
                    class="text-xs px-2 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {{ copyStatus === 'idle' ? '复制结果' : copyStatus === 'ok' ? '已复制' : '复制失败' }}
                  </button>
                </div>
                <div class="text-3xl font-bold">第 {{ weekInfo.weekNumber }} 周</div>
                <div class="text-sm text-muted-foreground mt-1">{{ weekInfo.year }}年</div>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-muted-foreground mb-1">周开始</div>
                  <div class="font-medium">{{ weekInfo.weekStart }}</div>
                </div>
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-muted-foreground mb-1">周结束</div>
                  <div class="font-medium">{{ weekInfo.weekEnd }}</div>
                </div>
              </div>

              <div class="p-4 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-2">本周日期</div>
                <div class="space-y-1">
                  <div
                    v-for="day in weekInfo.weekDays"
                    :key="day.date"
                    class="flex justify-between items-center"
                  >
                    <span class="text-sm">{{ day.name }}</span>
                    <span class="text-sm font-mono">{{ day.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 年度周数统计 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">年度周数统计</h2>

          <!-- 年份选择 -->
          <div class="mb-4">
            <label class="text-sm font-medium">选择年份</label>
            <input
              v-model.number="selectedYear"
              type="number"
              min="1900"
              max="2100"
              class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              @input="calculateYearWeeks"
            />
            <button
              @click="setCurrentYear"
              class="mt-2 px-3 py-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              今年
            </button>
          </div>

          <!-- 年度统计 -->
          <div v-if="yearWeekInfo" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">总周数</div>
                <div class="text-2xl font-bold">{{ yearWeekInfo.totalWeeks }}</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">天数</div>
                <div class="text-2xl font-bold">{{ yearWeekInfo.totalDays }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">开始日期</div>
                <div class="font-medium">{{ yearWeekInfo.startDate }}</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">结束日期</div>
                <div class="font-medium">{{ yearWeekInfo.endDate }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：周数转换和工具 -->
      <div class="space-y-4">
        <!-- 周数转日期 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">周数转日期</h2>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium">年份</label>
                <input
                  v-model.number="weekToYear"
                  type="number"
                  min="1900"
                  max="2100"
                  class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  @input="convertWeekToDate"
                />
              </div>
              <div>
                <label class="text-sm font-medium">周数</label>
                <input
                  v-model.number="weekToNumber"
                  type="number"
                  min="1"
                  max="53"
                  placeholder="1-53"
                  class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  @input="convertWeekToDate"
                />
              </div>
            </div>

            <div v-if="convertedWeek" class="p-4 bg-muted rounded-lg space-y-2">
              <div class="text-sm text-muted-foreground">该周的日期范围</div>
              <div class="font-medium">{{ convertedWeek.start }} - {{ convertedWeek.end }}</div>
              <div class="text-sm text-muted-foreground">共7天</div>
            </div>
            <p v-if="weekHint" class="mt-2 text-xs text-destructive">{{ weekHint }}</p>
          </div>
        </div>

        <!-- ISO 周数说明 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">ISO 周数标准</h2>
          <div class="space-y-3 text-sm">
            <div>
              <h3 class="font-medium mb-2">ISO 8601 标准</h3>
              <p class="text-muted-foreground">国际标准化组织的日期和时间表示法，包含以下规则：</p>
            </div>
            <ul class="space-y-2 text-muted-foreground ml-4">
              <li>• 每周从周一开始</li>
              <li>• 一年的第一周是包含该年第一个星期四的那一周</li>
              <li>这意味着1月4日总是在第1周</li>
              <li>一年可能有52或53周</li>
            </ul>
            <div class="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="font-medium text-sm mb-1">格式示例</div>
              <div class="font-mono text-sm">2024-W52 表示2024年第52周</div>
            </div>
          </div>
        </div>

        <!-- 快速参考 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">快速参考</h2>
          <div class="space-y-3">
            <div
              v-for="ref in quickReferences"
              :key="ref.label"
              class="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
              @click="setReferenceDate(ref.date)"
            >
              <span class="text-sm font-medium">{{ ref.label }}</span>
              <span class="text-sm text-muted-foreground">{{ ref.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          关于周数计算
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">计算规则</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>遵循 ISO 8601 国际标准进行周数计算</li>
              <li>周一为每周的开始，周日为每周的结束</li>
              <li>一年的第一周是包含1月4日的那一周</li>
              <li>12月29日-12月31日可能属于下一年的第一周</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">应用场景</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>制定周计划和周报</li>
              <li>计算项目周期</li>
              <li>薪资结算周期</li>
              <li>学术日历管理</li>
            </ul>
          </div>
        </div>
      </div>

    </div>

    <!-- SEO 内容区 -->
    <div class="relative mt-6">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>ISO 8601 周数是什么？两条规则记住就够了</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          国际标准的周数只靠两条规则：第一，周一是一周的第一天；第二，一年的第 1 周是「包含该年第一个星期四」的那一周
          （等价说法：包含 1 月 4 日的那周）。判断某天属于哪一年，看它所在那周的周四落在哪一年——
          所以 12 月 29 日到 31 日经常属于「下一年第 1 周」，例如 2026 年第 1 周从 2025 年 12 月 29 日（周一）开始，
          到 2026 年 1 月 4 日（周日）结束。排班、周报、项目排期里的 W45、2026-W45 用的都是这套编号。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>哪些年份有 53 周？通俗判断方法</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          一年只有 52 周或 53 周两种可能：365 天是 52 周零 1 天、366 天是 52 周零 2 天，多出来的 1～2 天总会把某些年份「顶」成 53 周，
          平均五六年出现一次。通俗判断：1 月 1 日是周四的年份必有 53 周；闰年若 1 月 1 日是周三，同样有 53 周。
          更省事的记法是看年底——12 月 31 日落在周四，这一年就是 53 周。例如 2026 年 1 月 1 日恰逢周四，
          所以 2026 年有 53 周；而 2025 年、2027 年都只有 52 周。做年度计划、版本规划时别默认「一年 52 周」，
          年底的那一周最容易排错。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>排班表、项目排期、生产周报为什么都用周数</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          周数是跨部门对齐节奏的通用坐标：护士排班表、产线生产周报、敏捷迭代计划、物流班列和供应商交期，常常直接写「第 N 周」。
          相比「11 月的第三个完整周」「本月倒数第二周」这类说法，周数不随法定节假日挪动、歧义小，翻译成任何语言都指向同一组日期。
          隐患在于各家设备日历设置不一（周起始日、第 1 周定义不同），对表前先统一按 ISO 8601 口径，可以避免错位一整周的事故。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>周数反查日期怎么用</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          左侧选日期可查出它属于第几周、本周一到周日的逐日对照，结果卡支持一键复制，格式如「2026 年第 45 周（11-02 ~ 11-08）」，
          可直接贴进周报或工单；右侧「周数转日期」则反向操作——输入年份和周号，得到该周的起止日期，
          适合把「第 45 周交货」换算成具体日子（2026 年第 45 周即 11 月 2 日至 11 月 8 日，11 月 5 日正落在这一周）。
          若输入的周号超出该年总周数（比如在 52 周的年份输入 53），工具不中断计算，但会在结果下方给出超范围提示。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">一年一定是 52 周吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是。365 天合 52 周零 1 天、闰年 366 天合 52 周零 2 天，多出的天数会让部分年份达到 53 周，平均五六年一次。例如 2026 年就有 53 周，而 2025 年、2027 年是 52 周；判断方法见上文「12 月 31 日是不是周四」。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么手机日历和这个工具的周数不一样？</h3>
            <p class="text-sm text-muted-foreground mt-1">常见原因有两个：一是周起始日不同，美式日历从周日开始一周，本工具按 ISO 8601 从周一起算；二是第 1 周的定义不同，部分手机把「包含 1 月 1 日的那周」编为第 1 周，而 ISO 要求第 1 周必须包含第一个周四。以 2026 年 1 月 1 日（周四）为例：ISO 的第 1 周从 2025-12-29（周一）开始，「周日起始＋含元旦」的日历则把 2025-12-28 至 2026-01-03 记作第 1 周，两边差了一两天。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">2026 年第 1 周从哪天开始？</h3>
            <p class="text-sm text-muted-foreground mt-1">从 2025 年 12 月 29 日（周一）开始，到 2026 年 1 月 4 日（周日）结束。因为 2026 年的第一个周四是 1 月 1 日，按「第 1 周包含第一个周四」的规则，这周的周一自然落在 2025 年——这种跨年属于正常现象，用本页「周数转日期」输入 2026 年第 1 周即可验证。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'week-calculator'" :category="'time'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Info, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { trackEvent } from '~/utils/track'
import Breadcrumb from '~/components/Breadcrumb.vue'
import RelatedTools from '~/components/RelatedTools.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const selectedDate = ref('')
const weekInfo = ref(null)
const selectedYear = ref(new Date().getFullYear())
const yearWeekInfo = ref(null)
const weekToYear = ref(new Date().getFullYear())
const weekToNumber = ref('')
const convertedWeek = ref(null)
const seoContentVisible = ref(true)
const copyStatus = ref('idle')

// 复制周信息文案：如「2026 年第 45 周（11-02 ~ 11-08）」，日期取自 formatLocalDate 生成的 weekDays
const copyWeekText = computed(() => {
  const info = weekInfo.value
  if (!info || !info.weekDays || info.weekDays.length < 7) return ''
  const start = info.weekDays[0].value.slice(5)
  const end = info.weekDays[6].value.slice(5)
  return `${info.year} 年第 ${info.weekNumber} 周（${start} ~ ${end}）`
})

// 复制状态 1.6s 后复位
let copyTimer = null
function flashCopy(status) {
  copyStatus.value = status
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copyStatus.value = 'idle'
    copyTimer = null
  }, 1600)
}

async function copyWeekInfo() {
  const text = copyWeekText.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    flashCopy('ok')
    trackEvent('工具结果', '复制', 'week-calculator')
  } catch (err) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      flashCopy(ok ? 'ok' : 'fail')
      if (ok) trackEvent('工具结果', '复制', 'week-calculator')
    } catch (err2) {
      flashCopy('fail')
    }
  }
}

// ISO 8601：12 月 28 日必属该年最后一周，可直接得出该年总周数（52 或 53）
const weeksInYear = (y) => getISOWeek(new Date(y, 11, 28))

// 周数超范围提示（不阻断计算，仅提示）
const weekHint = computed(() => {
  const w = Number(weekToNumber.value)
  if (!w || w < 1 || !weekToYear.value) return ''
  const max = weeksInYear(weekToYear.value)
  if (!convertedWeek.value) return `请输入 1 - ${max} 之间的周数（${weekToYear.value} 年共 ${max} 周）`
  if (w > max) return `${weekToYear.value} 年只有 ${max} 周，第 ${w} 周已超出范围，以下结果已顺延到下一年周历，仅供参考`
  return ''
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 星期名称
const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 快速参考
const quickReferences = computed(() => {
  const now = new Date()
  const year = now.getFullYear()

  return [
    {
      label: '元旦',
      date: `${year}-01-01`
    },
    {
      label: '劳动节',
      date: `${year}-05-01`
    },
    {
      label: '国庆节',
      date: `${year}-10-01`
    },
    {
      label: '圣诞节',
      date: `${year}-12-25`
    }
  ]
})

// 获取 ISO 周数
const getISOWeek = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  // Thursday in current week decides the year.
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)

  // January 4 is always in week 1.
  const week1 = new Date(d.getFullYear(), 0, 4)

  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

// 获取周的开始和结束日期
const getWeekStartEnd = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday

  const monday = new Date(d.setDate(diff))
  const sunday = new Date(d.setDate(diff + 6))

  return {
    start: monday,
    end: sunday
  }
}

// 本地日期格式化（勿用 toISOString：东八区下会把日期偏移到 UTC 前一天）
const formatLocalDate = (d) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// 获取一周的所有日期
const getWeekDays = (date) => {
  const { start } = getWeekStartEnd(date)
  const days = []

  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push({
      name: weekDayNames[i],
      date: day.toLocaleDateString('zh-CN'),
      value: formatLocalDate(day)
    })
  }

  return days
}

// 计算周信息
const calculateWeekInfo = () => {
  if (!selectedDate.value) {
    weekInfo.value = null
    return
  }

  const date = new Date(selectedDate.value)
  const weekNumber = getISOWeek(date)
  const year = date.getFullYear()

  // 处理跨年的情况
  const januaryFirst = new Date(year, 0, 1)
  const weekOfJanFirst = getISOWeek(januaryFirst)

  let actualYear = year
  if (weekNumber === 1 && date.getMonth() === 11) {
    actualYear = year + 1
  } else if (weekNumber >= 52 && date.getMonth() === 0) {
    actualYear = year - 1
  }

  const { start, end } = getWeekStartEnd(date)
  const weekDays = getWeekDays(date)

  weekInfo.value = {
    weekNumber,
    year: actualYear,
    weekStart: start.toLocaleDateString('zh-CN'),
    weekEnd: end.toLocaleDateString('zh-CN'),
    weekDays
  }
}

// 计算年度周数
const calculateYearWeeks = () => {
  if (!selectedYear.value) {
    yearWeekInfo.value = null
    return
  }

  const year = selectedYear.value
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)

  // 获取该年最后一周的周数
  const lastWeek = getISOWeek(end)

  // 处理12月31日可能属于下一年第一周的情况
  let totalWeeks = lastWeek
  if (lastWeek === 1) {
    const dec30 = new Date(year, 11, 30)
    totalWeeks = getISOWeek(dec30)
  }

  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

  yearWeekInfo.value = {
    totalWeeks,
    totalDays,
    startDate: start.toLocaleDateString('zh-CN'),
    endDate: end.toLocaleDateString('zh-CN')
  }
}

// 周数转日期
const convertWeekToDate = () => {
  if (!weekToYear.value || !weekToNumber.value) {
    convertedWeek.value = null
    return
  }

  const year = weekToYear.value
  const week = weekToNumber.value

  // 找到该年的第一个星期四
  const januaryFirst = new Date(year, 0, 1)
  const firstThursday = new Date(januaryFirst)
  firstThursday.setDate(januaryFirst.getDate() + (3 - (januaryFirst.getDay() + 6) % 7))

  // 计算第一周的开始日期（周一）
  const weekOneStart = new Date(firstThursday)
  weekOneStart.setDate(firstThursday.getDate() - 3)

  // 计算指定周的开始日期
  const targetWeekStart = new Date(weekOneStart)
  targetWeekStart.setDate(weekOneStart.getDate() + (week - 1) * 7)

  const targetWeekEnd = new Date(targetWeekStart)
  targetWeekEnd.setDate(targetWeekStart.getDate() + 6)

  convertedWeek.value = {
    start: targetWeekStart.toLocaleDateString('zh-CN'),
    end: targetWeekEnd.toLocaleDateString('zh-CN')
  }
}

// 设置今天
const setToday = () => {
  selectedDate.value = formatLocalDate(new Date())
  calculateWeekInfo()
}

// 设置本周
const setThisWeek = () => {
  const today = new Date()
  const { start } = getWeekStartEnd(today)
  selectedDate.value = formatLocalDate(start)
  calculateWeekInfo()
}

// 设置本月
const setThisMonth = () => {
  const today = new Date()
  selectedDate.value = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1))
  calculateWeekInfo()
}

// 设置当前年份
const setCurrentYear = () => {
  selectedYear.value = new Date().getFullYear()
  calculateYearWeeks()
}

// 设置参考日期
const setReferenceDate = (date) => {
  selectedDate.value = date
  calculateWeekInfo()
}

// SEO配置
useSeoMeta({
  title: '周数计算器 - 在线计算日期所在周数和ISO周数',
  description: '在线查询今天第几周、任意日期对应的 ISO 8601 周数，支持按年份和周号反查该周起止日期、统计年度总周数（52/53 周），排班表、项目排期、生产周报周数对照必备，结果一键复制，纯浏览器本地计算不上传数据。',
  keywords: ['今天第几周', 'ISO周数', '周数查询', '周数转日期', '第几周', '周数计算器', '一年有几周', '2026年第1周', '排班周数'],
  ogTitle: '周数计算器 - 在线计算日期所在周数和ISO周数 | 有条工具',
  ogDescription: '查询日期所在 ISO 周数、周数转日期反查、年度总周数统计，排班排期周数对照工具。',
  ogUrl: 'https://www.util.cn/tools/week-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（WebApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '周数计算器',
          url: 'https://www.util.cn/tools/week-calculator/',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '日期查询 ISO 8601 周数与本周起止日期',
            '周数转日期反查（年份 + 周号）',
            '年度总周数与起止日期统计',
            '本周逐日对照与结果一键复制',
            '本地运行不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间日期', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '周数计算器', item: 'https://www.util.cn/tools/week-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '一年一定是 52 周吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。365 天合 52 周零 1 天、闰年 366 天合 52 周零 2 天，多出的天数会让部分年份达到 53 周，平均五六年一次。例如 2026 年就有 53 周，而 2025 年、2027 年是 52 周；可按「12 月 31 日是不是周四」快速判断。' }
            },
            {
              '@type': 'Question',
              name: '为什么手机日历和这个工具的周数不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '常见原因有二：一是周起始日不同，美式日历从周日开始一周，ISO 8601 从周一开始；二是第 1 周定义不同，部分手机把包含 1 月 1 日的那周编为第 1 周，而 ISO 要求第 1 周必须包含第一个周四。' }
            },
            {
              '@type': 'Question',
              name: '2026 年第 1 周从哪天开始？',
              acceptedAnswer: { '@type': 'Answer', text: '从 2025 年 12 月 29 日（周一）开始，到 2026 年 1 月 4 日（周日）结束。因为 2026 年的第一个周四是 1 月 1 日，按「第 1 周包含第一个周四」的规则，这周的周一落在 2025 年，属正常跨年现象。' }
            }
          ]
        }
      ]
    })
  }]
})



// 初始化
onMounted(() => {
  setToday()
  setCurrentYear()
})
</script>