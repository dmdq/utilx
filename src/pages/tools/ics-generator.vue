<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CalendarClock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">ICS日历文件生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">生成 .ics 日历邀请，兼容 Google / Outlook / Apple 日历</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填写活动信息，按 RFC 5545 标准生成 .ics 日历文件，支持全天事件、重复规则与提前提醒。收件人双击即可导入到各类日历应用。全部在浏览器本地生成，适合课程表、会议邀请、活动通知等场景。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：表单 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 活动信息
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">标题 <span class="text-destructive">*</span></label>
            <input v-model="form.title" type="text" placeholder="例如：项目周会"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">地点（可选）</label>
            <input v-model="form.location" type="text" placeholder="会议室 / 线上链接"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">描述（可选）</label>
            <textarea v-model="form.description" rows="2"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"></textarea>
          </div>

          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">全天事件</span>
            <button
              type="button"
              @click="form.allDay = !form.allDay"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              :class="form.allDay ? 'bg-primary' : 'bg-muted'"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="form.allDay ? 'translate-x-6' : 'translate-x-1'"></span>
            </button>
          </label>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">开始{{ form.allDay ? '日期' : '时间' }}</label>
              <input :type="form.allDay ? 'date' : 'datetime-local'" v-model="form.start"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">结束{{ form.allDay ? '日期' : '时间' }}</label>
              <input :type="form.allDay ? 'date' : 'datetime-local'" v-model="form.end"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">重复</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="r in repeatOptions"
                :key="r.value"
                @click="form.repeat = r.value"
                :class="form.repeat === r.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >{{ r.label }}</button>
            </div>
          </div>

          <div v-if="form.repeat !== 'none'" class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">重复间隔</label>
              <input v-model.number="form.repeatInterval" type="number" min="1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">重复次数</label>
              <input v-model.number="form.repeatCount" type="number" min="1" max="999"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">提前提醒</label>
            <div class="grid grid-cols-5 gap-1.5">
              <button
                v-for="m in reminderOptions"
                :key="m.value"
                @click="form.reminder = m.value"
                :class="form.reminder === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >{{ m.label }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileOutput class="w-5 h-5 mr-2 text-primary" /> .ics 文件预览
            </h2>
            <div class="flex items-center gap-2">
              <button @click="copyIcs" :disabled="!icsText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5">
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button @click="downloadIcs" :disabled="!canGenerate"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5">
                <Download class="w-3.5 h-3.5" /> 下载 .ics
              </button>
            </div>
          </div>
          <div class="p-6">
            <pre v-if="icsText" class="text-xs font-mono text-foreground bg-muted/30 rounded-lg p-4 overflow-auto whitespace-pre-wrap max-h-96">{{ icsText }}</pre>
            <div v-else class="py-20 text-center">
              <CalendarClock class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">填写标题与时间后，这里显示 .ics 内容</p>
            </div>
          </div>
        </div>

        <!-- 使用提示 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 使用方式
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 下载后双击 .ics 文件，系统会自动调用日历应用导入</li>
            <li>• 邮件场景：把 .ics 作为附件发送，收件人在 Gmail / Outlook 中可直接点击「添加到日历」</li>
            <li>• 网页场景：将 .ics 上传到网站供下载，或使用 webcal 协议提供订阅</li>
            <li>• 时间按本地时间（浮动时间）写入，导入后按收件人所在时区显示</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 ICS 日历文件</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>ICS（iCalendar，RFC 5545）是日历事件的通用交换格式，Google 日历、Outlook、Apple 日历及各类日历应用都支持导入。相比口头发通知，一份 .ics 附件能让收件人一键把时间写进日历并收到提醒，出席率明显更高。</p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>会议邀请：邮件附 .ics，参会人一键订阅提醒</li>
            <li>课程表 / 培训计划：用重复规则一次生成整个学期</li>
            <li>直播、发布会等活动通知：官网提供 .ics 下载</li>
            <li>个人节奏管理：把复习、锻炼计划批量写入日历</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">跨时区参与者时间会错吗？</span>本工具按浮动本地时间写入，导入方按其设备时区显示；如需精确定时区，请在 UTC±0 时间发布会前自行换算。</li>
            <li><span class="text-foreground font-medium">重复事件如何终止？</span>通过「重复次数」控制，例如每周重复 16 次即一个学期。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ics-generator'" :category="'time'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CalendarClock, Settings2, FileOutput, Copy, Download, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: 'ICS日历文件生成器 - 生成日历邀请.ics文件',
  description: '在线生成ICS日历文件，支持全天事件、重复规则、提前提醒，兼容Google日历/Outlook/Apple日历，适合会议邀请与课程表分发',
  keywords: 'ics生成, 日历邀请, ics文件, calendar invite, 会议邀请, 课程表ics, rfc5545',
  author: 'Util工具箱',
  ogTitle: 'ICS日历文件生成器 - 有条工具',
  ogDescription: '生成 .ics 日历邀请，兼容 Google / Outlook / Apple 日历',
  ogUrl: 'https://www.util.cn/tools/ics-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: 'ICS日历文件生成器', url: 'https://www.util.cn/tools/ics-generator', applicationCategory: 'ProductivityApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['RFC5545标准', '重复规则', '提前提醒', '全天事件'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '时间日期', item: 'https://www.util.cn/time/' },
          { '@type': 'ListItem', position: 3, name: 'ICS日历文件生成器', item: 'https://www.util.cn/tools/ics-generator/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ics-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 默认值：下一个整点开始，1 小时
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  const pad = (n) => String(n).padStart(2, '0')
  const toLocalInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  form.value.start = toLocalInput(now)
  const end = new Date(now.getTime() + 3600000)
  form.value.end = toLocalInput(end)
})

const repeatOptions = [
  { value: 'none', label: '不重复' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' }
]
const reminderOptions = [
  { value: 0, label: '不提醒' },
  { value: 5, label: '5分' },
  { value: 15, label: '15分' },
  { value: 30, label: '30分' },
  { value: 60, label: '1时' }
]

const form = ref({
  title: '',
  location: '',
  description: '',
  allDay: false,
  start: '',
  end: '',
  repeat: 'none',
  repeatInterval: 1,
  repeatCount: 4,
  reminder: 15
})

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const canGenerate = computed(() => {
  return form.value.title.trim() && form.value.start && form.value.end && form.value.end >= form.value.start
})

// ---------- ICS 生成 ----------
const escapeText = (s) => String(s || '')
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/\n/g, '\\n')

const foldLine = (line) => {
  // RFC 5545：单行不超过 75 字节，按 74 字符折行（中文按 UTF-8 字节近似处理）
  if (line.length <= 74) return line
  const parts = []
  let rest = line
  parts.push(rest.slice(0, 74))
  rest = rest.slice(74)
  while (rest.length > 0) {
    parts.push(' ' + rest.slice(0, 73))
    rest = rest.slice(73)
  }
  return parts.join('\r\n')
}

const toLocalICS = (dtLocal) => {
  // datetime-local: 2026-10-02T14:00 → 20261002T140000（浮动时间）
  return dtLocal.replace(/[-:]/g, '').replace('T', 'T').slice(0, 15)
}

const toDateICS = (dtLocal) => dtLocal.slice(0, 10).replace(/-/g, '')

const icsText = computed(() => {
  if (!canGenerate.value) return ''
  const f = form.value
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Util.cn//ICS Generator//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + `${Date.now()}@util.cn`,
    `DTSTAMP:${stamp}`
  ]

  if (f.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${toDateICS(f.start)}`)
    // 全天事件 DTEND 为-exclusive，加一天
    const endD = new Date(f.end + 'T00:00:00')
    endD.setDate(endD.getDate() + 1)
    const padM = (n) => String(n).padStart(2, '0')
    lines.push(`DTEND;VALUE=DATE:${endD.getFullYear()}${padM(endD.getMonth() + 1)}${padM(endD.getDate())}`)
  } else {
    lines.push(`DTSTART:${toLocalICS(f.start)}`)
    lines.push(`DTEND:${toLocalICS(f.end)}`)
  }

  if (f.repeat !== 'none') {
    const freq = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY' }[f.repeat]
    lines.push(`RRULE:FREQ=${freq};INTERVAL=${Math.max(1, f.repeatInterval || 1)};COUNT=${Math.max(1, f.repeatCount || 1)}`)
  }

  lines.push(`SUMMARY:${escapeText(f.title)}`)
  if (f.location.trim()) lines.push(`LOCATION:${escapeText(f.location)}`)
  if (f.description.trim()) lines.push(`DESCRIPTION:${escapeText(f.description)}`)

  if (f.reminder > 0) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(f.title)}`,
      `TRIGGER:-PT${f.reminder}M`,
      'END:VALARM'
    )
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.map(foldLine).join('\r\n')
})

const copyIcs = async () => {
  if (!icsText.value) return
  try {
    await navigator.clipboard.writeText(icsText.value)
    alert('ICS 内容已复制')
  } catch (err) {
    const ta = document.createElement('textarea')
    ta.value = icsText.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('ICS 内容已复制')
  }
}

const downloadIcs = () => {
  if (!icsText.value) return
  const blob = new Blob([icsText.value], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(form.value.title || 'event').replace(/[\\/:*?"<>|]/g, '')}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
