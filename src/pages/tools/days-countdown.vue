<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CalendarClock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">倒数日管理</h1>
          <p class="text-sm text-muted-foreground mt-1">生日、考试、纪念日、还款日倒数看板，支持每年重复与进度条，数据本地保存不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线倒数日管理工具：把生日、考试日、纪念日、还款日、项目截止日等重要日子集中到同一张看板，自动按天倒数并按「最近先到」排序，
        距离考试还有多少天、生日倒计时还剩多久一眼可见。生日、纪念日等每年重复的日子在当年过后会自动滚动到下一个公历周年，
        每个目标日还配有从添加日（或今年 1 月 1 日，取较近者）到目标日的流逝进度条；剩余不足 1 天时自动改用小时、分钟显示。
        所有数据仅保存在本机浏览器，不上传服务器。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左：添加 / 编辑 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <CalendarDays class="w-5 h-5 text-primary" />
          {{ editingId ? '编辑倒数日' : '添加倒数日' }}
        </h2>

        <!-- 快捷添加预设 -->
        <div>
          <label class="block text-sm font-medium mb-1.5 text-foreground">快捷添加</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in presets"
              :key="p.key"
              @click="applyPreset(p)"
              class="px-3 py-1.5 rounded-lg text-sm bg-muted hover:bg-muted/80 text-foreground border border-border transition"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">名称</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="如：我的生日 / 期末考试"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">目标日期</label>
            <input
              v-model="form.date"
              type="date"
              class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">具体时刻（可选）</label>
            <input
              v-model="form.time"
              type="time"
              class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-foreground">
          <input v-model="form.repeatYearly" type="checkbox" class="w-4 h-4 rounded border border-border">
          每年重复
          <span class="text-xs text-muted-foreground">（公历每年同月同日，自动滚动到下一次）</span>
        </label>

        <div v-if="formError" class="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm">
          {{ formError }}
        </div>

        <div class="flex gap-2">
          <button
            @click="submitForm"
            class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            {{ editingId ? '保存修改' : '添加到看板' }}
          </button>
          <button
            v-if="editingId"
            @click="resetForm"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            取消
          </button>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          不填具体时刻则按当天 0 点倒数；每年重复按公历月日计算，2 月 29 日遇平年按 2 月 28 日。
        </p>
      </div>

      <!-- 右：倒数看板 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 汇总行 -->
        <div v-if="nowText" class="flex flex-wrap items-center justify-between gap-2 px-1">
          <p class="text-sm text-muted-foreground">今天是 {{ nowText }}</p>
          <p class="text-sm text-muted-foreground">
            共 {{ items.length }} 个倒数日<span v-if="nextUpText"> · 最近：{{ nextUpText }}</span>
          </p>
        </div>

        <!-- 卡片列表（最近先到） -->
        <div v-if="cards.length" class="space-y-3">
          <div
            v-for="card in cards"
            :key="card.item.id"
            class="p-5 bg-card border rounded-lg"
            :class="card.isPast ? 'border-border' : 'border-primary/40'"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-semibold text-foreground truncate">{{ card.item.name }}</h3>
                  <span
                    v-if="card.item.repeatYearly"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                  >
                    <Repeat class="w-3 h-3" /> 每年
                  </span>
                  <span
                    v-if="card.isPast"
                    class="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border"
                  >
                    已过期
                  </span>
                </div>
                <p class="text-xs text-muted-foreground mt-1">{{ card.occText }}</p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click="startEdit(card.item)"
                  class="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="编辑"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="removeItem(card.item)"
                  class="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                  title="删除"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <p class="mt-3 text-2xl font-bold" :class="countdownClass(card)">
              {{ card.countdownText }}
            </p>

            <p
              v-for="(note, ni) in card.notes"
              :key="ni"
              class="mt-1.5 text-xs text-amber-600 dark:text-amber-400"
            >
              {{ note }}
            </p>

            <!-- 进度条：添加日（或今年 1 月 1 日，取较近者）→ 目标日 -->
            <div v-if="card.progress" class="mt-3">
              <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>自 {{ card.progress.startKey }} 起</span>
                <span>已流逝 {{ card.progress.percent }}%</span>
              </div>
              <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full transition-all duration-300"
                  :style="{ width: card.progress.percent + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态引导 -->
        <div v-else-if="nowRef" class="p-10 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-card">
          <p class="font-medium text-foreground mb-1">还没有倒数日</p>
          <p class="text-sm">
            在左侧填写名称和目标日期，或点一个快捷预设（生日 / 考试日 / 纪念日 / 还款日 / 项目截止），
            添加第一个倒数日；勾选「每年重复」的日期会在每年自动滚动。
          </p>
        </div>
        <div v-else class="p-10 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-card">
          正在读取本机数据…
        </div>

        <p class="text-xs text-muted-foreground text-center">
          数据仅保存在本机浏览器（localStorage），不上传服务器；清理浏览器数据会一并清除，更换设备不会同步。
        </p>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="isSeoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          倒数日管理是什么？
        </h2>
        <p class="text-muted-foreground mb-4">
          倒数日管理是一款多目标「倒数看板」工具：把生日、考试日、纪念日、还款日、项目截止日等重要日子添加进列表，
          自动计算每个日子距离今天的倒计时天数，并按最近先到排序，打开页面就能看到所有重要日子的最新倒数。
          支持每年重复（公历同月同日自动滚动到下一次）、剩余不足 1 天改显小时分钟、每个目标日的流逝进度条；
          数据保存在本机浏览器 localStorage，不上传服务器。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">与「日期差计算」「倒计时器」有什么区别？</h3>
        <p class="text-muted-foreground mb-4 text-sm leading-relaxed">
          站内另有两个相邻工具，分工不同：「日期差计算」是一次性输入两个日期、当场算一段差值，不保留任何目标；
          「倒计时器」是时、分、秒级的计时工具，适合考试限时、烹饪计时这类以秒计的场景。
          本工具面向「以天为单位的重要日子」：多个目标日的列表管理、每年重复自动滚动、进度条与本地保存——
          关掉页面再打开，倒数看板还在，适合当长期提醒用。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">进度条从哪天开始算？</h3>
        <p class="text-muted-foreground mb-4 text-sm leading-relaxed">
          取「添加日」与「今年 1 月 1 日」中距离目标日更近（更晚）的一个作为起点，到目标日 0 点（或填写的具体时刻）为终点，
          显示已流逝的百分比。对于今年已过、滚动到明年的每年重复项，进度条会覆盖从今年年初到明年目标日的完整区间。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">2 月 29 日（闰日）怎么处理？</h3>
        <p class="text-muted-foreground mb-4 text-sm leading-relaxed">
          采用「月末回退」策略：平年没有 2 月 29 日时，按 2 月 28 日计算并在卡片上明确注明；遇到闰年则仍回到 2 月 29 日。
          这与站内「农历生日提醒」对特殊日期的回退口径一致，保证每个公历年都有且只有一个对应日期。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-6 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">数据会上传到服务器吗？</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              不会。倒数日列表只保存在本机浏览器的 localStorage 里，页面不会发送任何包含你目标日的网络请求；
              清理浏览器数据会一并清除，更换设备不会自动同步。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">「今年已过，明年还有 X 天」是什么意思？</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              每年重复的日期（如生日、纪念日）在今年的月日过去之后，会自动滚动到下一个符合的公历日期，
              并提示到明年同一天还剩多少天，无需手动修改日期；卡片上会明确标注已滚动。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">距离考试还有多少天按什么口径算？</h3>
            <p class="text-muted-foreground mt-1 text-sm">
              按日历天（自然日）计算：到目标日 0 点即为到达当天；若填写了具体时刻，剩余不足 24 小时会自动改用
              「小时 + 分钟」显示，更贴近临考、截稿这类需要精确到时刻的场景。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'days-countdown'" :category="'time'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  CalendarClock, CalendarDays, Repeat, Pencil, Trash2,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '倒数日管理 - 生日/考试/纪念日倒计时看板',
  description: '在线倒数日管理工具：添加生日、考试、纪念日、还款日等多个目标日，自动按天倒数、每年重复自动滚动到下一年、进度条可视化，数据仅保存在本机浏览器不上传服务器',
  keywords: '倒数日,倒计时天数,纪念日计算,距离考试还有多少天,生日倒计时',
  author: 'Util工具箱',
  ogTitle: '倒数日管理 - 生日/考试/纪念日倒计时看板 | 有条工具',
  ogDescription: '生日、考试、纪念日倒数看板，支持每年重复与进度条，数据本地保存不上传',
  ogUrl: 'https://www.util.cn/tools/days-countdown',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '倒数日管理',
          url: 'https://www.util.cn/tools/days-countdown',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多个倒数日看板', '按最近先到排序', '每年重复自动滚动', '不足一天显示小时分钟', '流逝进度条', '本地保存不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间工具', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '倒数日管理', item: 'https://www.util.cn/tools/days-countdown/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '数据会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。倒数日列表只保存在本机浏览器的 localStorage 里，页面不会发送任何包含目标日的网络请求；清理浏览器数据会一并清除，更换设备不会自动同步。' }
            },
            {
              '@type': 'Question',
              name: '「今年已过，明年还有 X 天」是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '每年重复的日期在今年的月日过去后自动滚动到下一个符合的公历日期，并提示到明年同一天还剩多少天，无需手动修改。' }
            },
            {
              '@type': 'Question',
              name: '距离考试还有多少天按什么口径算？',
              acceptedAnswer: { '@type': 'Answer', text: '按日历天（自然日）计算，到目标日 0 点即为到达当天；填写具体时刻后，剩余不足 24 小时自动改用小时和分钟显示。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'days-countdown')

/* ===== PURE-BEGIN ===== */
// 全部日期计算均为纯函数：日期一律用本地时区构造（new Date(y, m-1, d)），
// 避免 new Date('YYYY-MM-DD') 按 UTC 解析导致的时区偏移问题。
const MS_PER_DAY = 86400000
const WEEK_CN = '日一二三四五六'

const pad2 = (n) => String(n).padStart(2, '0')

// 'YYYY-MM-DD' → 本地时区当天 00:00 的 Date
function parseLocalDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Date → 'YYYY-MM-DD'（本地时区）
function toDateKey(dt) {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

// 本地日期 key 加 n 天（跨月/跨年安全）
function addDaysKey(key, n) {
  const d = parseLocalDate(key)
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}

// 'HH:MM' → [h, m]；空/非法回退 00:00
function parseTimeParts(time) {
  if (!time) return [0, 0]
  const parts = time.split(':').map(Number)
  const h = Number.isFinite(parts[0]) ? parts[0] : 0
  const m = Number.isFinite(parts[1]) ? parts[1] : 0
  return [h, m]
}

// 两个本地日期的日历天数差 = to - from（Date.UTC 归一化 + Math.round，抗夏令时）
function dateDiffDays(fromKey, toKey) {
  const a = parseLocalDate(fromKey)
  const b = parseLocalDate(toKey)
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / MS_PER_DAY)
}

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

function daysInMonth(y, m) {
  if (m === 2) return isLeapYear(y) ? 29 : 28
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
}

// 某年中「月/日」的实际发生日期。
// 闰日策略：2 月 29 日遇平年回退到 2 月 28 日（月末回退，与站内农历生日提醒口径一致），clamped 标记是否回退。
function occurrenceInYear(month, day, year) {
  const realDay = Math.min(day, daysInMonth(year, month))
  return { year, month, day: realDay, clamped: realDay !== day }
}

// 下一次发生时刻（>= now 的第一刻）。
// target: { date: 'YYYY-MM-DD', time?: 'HH:MM' }；repeat: 是否每年重复；now: Date
// 返回 { dateKey, datetime, year, rolledToNextYear, clamped }
function nextOccurrence(target, repeat, now) {
  const [y, m, d] = target.date.split('-').map(Number)
  const [hh, mm] = parseTimeParts(target.time)
  const valid = m >= 1 && m <= 12 && d >= 1 && d <= 31
  if (repeat && valid) {
    const thisYear = now.getFullYear()
    for (let yy = thisYear; yy <= thisYear + 5; yy++) {
      const occ = occurrenceInYear(m, d, yy)
      const dt = new Date(occ.year, occ.month - 1, occ.day, hh, mm, 0, 0)
      if (dt.getTime() >= now.getTime()) {
        return {
          dateKey: `${occ.year}-${pad2(occ.month)}-${pad2(occ.day)}`,
          datetime: dt,
          year: occ.year,
          month: occ.month,
          day: occ.day,
          rolledToNextYear: occ.year > thisYear,
          clamped: occ.clamped
        }
      }
    }
  }
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0)
  return {
    dateKey: `${y}-${pad2(m)}-${pad2(d)}`,
    datetime: dt,
    year: y,
    month: m,
    day: d,
    rolledToNextYear: false,
    clamped: false
  }
}

// 倒数描述（occ 为 nextOccurrence 结果）：
// - passed：不重复且已过（按日历天）
// - today：目标日就是今天（时刻已过或未填时刻）
// - soon：剩余不足 24 小时，以小时 + 分钟显示
// - days：剩余 ≥ 24 小时，按日历天显示
function describeCountdown(occ, now) {
  const todayKey = toDateKey(now)
  const diff = dateDiffDays(todayKey, occ.dateKey)
  if (diff < 0) return { state: 'passed', passedDays: -diff }
  if (diff === 0) {
    if (occ.datetime.getTime() > now.getTime()) {
      const totalMin = Math.max(0, Math.floor((occ.datetime.getTime() - now.getTime()) / 60000))
      return { state: 'soon', hours: Math.floor(totalMin / 60), minutes: totalMin % 60 }
    }
    return { state: 'today' }
  }
  const ms = occ.datetime.getTime() - now.getTime()
  if (ms < MS_PER_DAY) {
    const totalMin = Math.max(0, Math.floor(ms / 60000))
    return { state: 'soon', hours: Math.floor(totalMin / 60), minutes: totalMin % 60 }
  }
  return { state: 'days', days: diff }
}

// 倒数主文案
function countdownText(desc) {
  if (desc.state === 'days') return `还剩 ${desc.days} 天`
  if (desc.state === 'soon') {
    if (desc.hours === 0 && desc.minutes === 0) return '还剩不足 1 分钟'
    return `还剩 ${desc.hours} 小时 ${desc.minutes} 分钟`
  }
  if (desc.state === 'today') return '就是今天'
  return `已过 ${desc.passedDays} 天`
}

// 进度：起点 = 「添加日」与「今年 1 月 1 日」中距目标更近（更晚）者，终点 = 发生时刻。
// 返回 { startKey, percent }，percent 保留 1 位小数并夹在 [0, 100]。
function progressInfo(createdAtKey, occ, now) {
  const jan1 = `${now.getFullYear()}-01-01`
  let startKey = jan1
  if (createdAtKey && /^\d{4}-\d{2}-\d{2}$/.test(createdAtKey) && dateDiffDays(jan1, createdAtKey) > 0) {
    startKey = createdAtKey
  }
  const startMs = parseLocalDate(startKey).getTime()
  const endMs = occ.datetime.getTime()
  const denom = endMs - startMs
  let percent
  if (denom <= 0) {
    percent = now.getTime() >= endMs ? 100 : 0
  } else {
    percent = ((now.getTime() - startMs) / denom) * 100
    percent = Math.max(0, Math.min(100, percent))
  }
  return { startKey, percent: Math.round(percent * 10) / 10 }
}

// 发生日期的展示文案：'2027-06-01' + '08:00' → '2027 年 6 月 1 日（星期二）08:00'
function formatOccText(dateKey, time) {
  const dt = parseLocalDate(dateKey)
  const base = `${dt.getFullYear()} 年 ${dt.getMonth() + 1} 月 ${dt.getDate()} 日（星期${WEEK_CN[dt.getDay()]}）`
  return time ? `${base} ${time}` : base
}

// 单张卡片：目标日 → 发生时刻 + 倒数描述 + 滚动/闰日注释 + 进度
function buildCard(item, now) {
  const occ = nextOccurrence({ date: item.date, time: item.time }, !!item.repeatYearly, now)
  const desc = describeCountdown(occ, now)
  const isPast = desc.state === 'passed'
  const notes = []
  if (item.repeatYearly && occ.rolledToNextYear && desc.state === 'days') {
    const [, sm, sd] = item.date.split('-').map(Number)
    const cur = occurrenceInYear(sm, sd, now.getFullYear())
    notes.push(`今年的 ${cur.month} 月 ${cur.day} 日已过，已自动滚动：明年（${occ.year} 年 ${occ.month} 月 ${occ.day} 日）还有 ${desc.days} 天`)
  }
  if (occ.clamped) {
    notes.push(`${occ.year} 年是平年，没有 2 月 29 日，按 2 月 28 日计算`)
  }
  return {
    item,
    occ,
    desc,
    isPast,
    occText: formatOccText(occ.dateKey, item.time),
    countdownText: countdownText(desc),
    notes,
    progress: isPast ? null : progressInfo(item.createdAt, occ, now)
  }
}

// 卡片排序：未过期按发生时刻升序（最近先到）；已过期排最后、按过期时间新 → 旧
function sortCards(cards) {
  const pending = cards.filter(c => !c.isPast).sort((a, b) => a.occ.datetime.getTime() - b.occ.datetime.getTime())
  const passed = cards.filter(c => c.isPast).sort((a, b) => b.occ.datetime.getTime() - a.occ.datetime.getTime())
  return pending.concat(passed)
}
/* ===== PURE-END ===== */

// ---------- 状态 ----------
const STORAGE_KEY = 'days-countdown-items'

const items = ref([])
const nowRef = ref(null)
const form = ref({ name: '', date: '', time: '', repeatYearly: false })
const editingId = ref('')
const formError = ref('')
let refreshTimer = null

const isSeoContentVisible = ref(true)
const toggleSeoContent = () => { isSeoContentVisible.value = !isSeoContentVisible.value }

// 快捷添加预设（label / 预填名称 / 是否每年重复）
const presets = [
  { key: 'birthday', label: '生日', name: '生日', repeat: true },
  { key: 'exam', label: '考试日', name: '考试日', repeat: false },
  { key: 'anniversary', label: '纪念日', name: '纪念日', repeat: true },
  { key: 'payment', label: '还款日', name: '还款日', repeat: true },
  { key: 'deadline', label: '项目截止', name: '项目截止', repeat: false }
]

// ---------- 派生 ----------
const nowText = computed(() => {
  const d = nowRef.value
  if (!d) return ''
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日（星期${WEEK_CN[d.getDay()]}）`
})

const cards = computed(() => {
  const nv = nowRef.value
  if (!nv) return []
  return sortCards(items.value.map(it => buildCard(it, nv)))
})

const nextUpText = computed(() => {
  const next = cards.value.find(c => !c.isPast)
  if (!next) return ''
  return `「${next.item.name}」${next.countdownText}`
})

function countdownClass(card) {
  if (card.isPast) return 'text-muted-foreground'
  if (card.desc.state === 'today' || card.desc.state === 'soon') return 'text-red-500'
  return card.desc.days <= 7 ? 'text-red-500' : 'text-primary'
}

// ---------- 操作 ----------
function applyPreset(p) {
  form.value.name = p.name
  form.value.repeatYearly = p.repeat
  form.value.time = ''
  formError.value = ''
}

function resetForm() {
  form.value = { name: '', date: '', time: '', repeatYearly: false }
  editingId.value = ''
  formError.value = ''
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  } catch (e) {
    // 存储不可用（隐私模式等）时静默降级，页面内功能不受影响
  }
}

function submitForm() {
  const name = form.value.name.trim()
  if (!name) {
    formError.value = '请填写倒数日名称'
    return
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.value.date)) {
    formError.value = '请选择目标日期'
    return
  }
  if (editingId.value) {
    items.value = items.value.map(it => it.id === editingId.value
      ? { ...it, name, date: form.value.date, time: form.value.time, repeatYearly: form.value.repeatYearly }
      : it)
  } else {
    items.value = [{
      id: genId(),
      name,
      date: form.value.date,
      time: form.value.time,
      repeatYearly: form.value.repeatYearly,
      createdAt: toDateKey(new Date())
    }, ...items.value]
  }
  persist()
  resetForm()
}

function startEdit(item) {
  editingId.value = item.id
  form.value = { name: item.name, date: item.date, time: item.time || '', repeatYearly: !!item.repeatYearly }
  formError.value = ''
}

function removeItem(item) {
  if (!window.confirm(`确定删除「${item.name}」吗？删除后不可恢复。`)) return
  items.value = items.value.filter(it => it.id !== item.id)
  if (editingId.value === item.id) resetForm()
  persist()
}

// localStorage 读写全部收敛在 onMounted / 用户事件中，保证 SSR 安全
onMounted(() => {
  nowRef.value = new Date()
  if (!form.value.date) form.value.date = addDaysKey(toDateKey(nowRef.value), 30)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        items.value = arr.filter(it => it && typeof it.name === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(it.date || ''))
      }
    }
  } catch (e) {
    items.value = []
  }
  // 每 30 秒刷新一次当前时间，让「小时 + 分钟」级倒数自动前进
  refreshTimer = window.setInterval(() => { nowRef.value = new Date() }, 30000)
  if (tool) addRecentTool(tool.id)
})

onUnmounted(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>
