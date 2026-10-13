<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileCheck class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">请假条生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">填表即出规范请假条，天数自动计算，格式无忧直接打印签字</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择请假类型、填写申请人、部门、起止日期与事由，自动按含首尾的方式计算请假天数并生成标准版式请假条；
        病假自动追加诊断证明提示。纸张预览所见即所得，直接打印签字即可提交。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：表单 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 请假信息
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="leaveType">请假类型</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="t in LEAVE_TYPES"
              :key="t"
              @click="leaveType = t"
              :class="leaveType === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
            >{{ t }}</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="applicant">申请人</label>
            <input
              id="applicant"
              v-model="applicant"
              type="text"
              maxlength="30"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="姓名"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="department">部门 / 班级</label>
            <input
              id="department"
              v-model="department"
              type="text"
              maxlength="40"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如：市场部 / 三年二班"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="position">职务 / 身份（可选）</label>
          <input
            id="position"
            v-model="position"
            type="text"
            maxlength="30"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如：项目经理 / 学生，不填则省略"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="startDate">开始日期</label>
            <input
              id="startDate"
              v-model="startDate"
              type="date"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="endDate">结束日期</label>
            <input
              id="endDate"
              v-model="endDate"
              type="date"
              :min="startDate || undefined"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="reason">请假事由</label>
          <textarea
            id="reason"
            v-model="reason"
            rows="3"
            maxlength="120"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如：家中有急事需要处理 / 术后复查休养"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3 items-end">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="signDate">落款日期</label>
            <input
              id="signDate"
              v-model="signDate"
              type="date"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">默认今天，可改为实际递交日</p>
          </div>
          <div class="bg-primary/10 rounded-lg p-3 text-center">
            <p class="text-[11px] text-muted-foreground mb-0.5">请假天数（含首尾）</p>
            <p class="text-xl font-bold text-primary">{{ days }} 天</p>
          </div>
        </div>

        <p v-if="dateInvalid" class="text-xs text-red-500">结束日期早于开始日期，已按同一天处理，请核对日期。</p>

        <button
          @click="printNote"
          class="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Printer class="w-4 h-4" /> 打印请假条
        </button>
      </div>

      <!-- 右侧：纸张预览（打印时仅保留纸面） -->
      <div class="bg-card border border-border rounded-lg p-6 preview-panel">
        <h2 class="text-lg font-semibold flex items-center mb-4 no-print">
          <Eye class="w-5 h-5 mr-2 text-primary" /> 纸张预览（打印所见即所得）
        </h2>
        <div class="overflow-auto sheet-scroll">
          <div class="note-paper">
            <h2 class="note-title">请假条</h2>
            <p class="note-salutation">尊敬的领导：</p>
            <p class="note-body">{{ bodyText }}</p>
            <div class="note-closing">
              <p class="note-zhici">此致</p>
              <p class="note-jingli">敬礼！</p>
            </div>
            <div class="note-sign">
              <p>申请人：{{ applicant || '（请填写姓名）' }}{{ position ? '（' + position + '）' : '' }}</p>
              <p class="note-sign-date">{{ signDate || '年　月　日' }}</p>
            </div>
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-3 no-print">打印时自动隐藏左侧表单，仅输出请假条纸面内容。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于请假条</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            请假条是最常用的日常应用文之一，格式看着简单，真要写规范却容易漏项：标题、称谓、事由、起止日期、天数、
            交接说明、此致敬礼、署名与日期一样都不能少。本工具按标准版式逐项生成，填表即可，打印后签字就能交。
          </p>
          <h3 class="text-lg font-semibold text-foreground">请假天数怎么算</h3>
          <p>
            按「含首尾」计算：10 月 13 日请假到 10 月 15 日，13、14、15 三天都在假期内，共 3 天——即结束日减开始日加 1。
            只请当天一天时，起止填同一天即可。工具会自动完成这一换算并写进正文，避免口头表述与实际审批天数对不上。
          </p>
          <h3 class="text-lg font-semibold text-foreground">不同假期类型的注意事项</h3>
          <p>
            事假一般不带薪，尽量提前申请并写明交接安排；病假通常需要医院诊断证明，本工具在类型选择「病假」时
            会自动在正文后追加「附：医院诊断证明」提示；年假、婚假、产假、调休则注意对照单位制度与当地规定的天数上限，
            超出部分建议改按事假续假。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">请假条的标准格式是什么？</span>居中标题「请假条」、顶格称谓、缩进正文（写清事由、起止日期与天数、交接安排）、此致敬礼、右下署名与落款日期，本工具已按此版式输出。</li>
            <li><span class="text-foreground font-medium">学生请假可以用吗？</span>可以，「部门 / 班级」填班级、职务可填「学生」，称谓按需改为班主任或辅导员后再打印。</li>
            <li><span class="text-foreground font-medium">可以交电子版吗？</span>建议打印签字后拍照或扫描提交，手写签名是审批依据；直接转发网页截图的效力以单位要求为准。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'leave-note-generator'" :category="'text'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileCheck, ClipboardList, Printer, Eye, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '请假条生成器 - 标准格式请假条模板在线生成打印',
  description: '在线请假条生成器，选择事假/病假/年假/调休等类型，填写申请人、部门、起止日期与事由，自动计算含首尾天数并生成标准版式请假条，病假自动附诊断证明提示，直接打印签字',
  keywords: '请假条生成, 请假条模板, 请假条格式, 请假条怎么写, 病假条, 请假单',
  author: 'Util工具箱',
  ogTitle: '请假条生成器 - 有条工具',
  ogDescription: '填表即出规范请假条，天数自动计算，格式无忧直接打印签字',
  ogUrl: 'https://www.util.cn/tools/leave-note-generator',
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
          name: '请假条生成器',
          url: 'https://www.util.cn/tools/leave-note-generator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['七种请假类型', '含首尾天数自动计算', '标准版式一键生成', '病假自动附诊断证明提示', '纸张预览与打印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '请假条生成器', item: 'https://www.util.cn/tools/leave-note-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '请假条的标准格式是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '居中标题、顶格称谓、缩进正文（事由、起止日期与天数、交接安排）、此致敬礼、右下署名与落款日期，本工具按此版式输出。' }
            },
            {
              '@type': 'Question',
              name: '请假天数怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '按含首尾计算：13 日请到 15 日共 3 天，即结束日减开始日加 1；只请一天则起止填同一天。' }
            },
            {
              '@type': 'Question',
              name: '学生请假可以用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，部门填班级、职务可填学生，称谓按需改为班主任或辅导员后打印即可。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'leave-note-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 落款日期与起止默认今天（仅客户端设置，避免 SSR 不一致）
  if (!signDate.value) signDate.value = todayStr()
  if (!startDate.value) startDate.value = todayStr()
  if (!endDate.value) endDate.value = todayStr()
})

/* ==== PURE:BEGIN ==== */
const LEAVE_TYPES = ['事假', '病假', '年假', '调休', '婚假', '产假', '其他']

const pad2 = (n) => String(n).padStart(2, '0')

const parseDateKey = (key) => {
  const parts = String(key).split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2])
}

// 含首尾天数：13 日至 15 日 = 3 天；非法输入返回 0
const daysBetween = (startKey, endKey) => {
  if (!startKey || !endKey) return 0
  const s = parseDateKey(startKey)
  const e = parseDateKey(endKey)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0
  if (e.getTime() < s.getTime()) return 0
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1
}

// 本地时区的今天（YYYY-MM-DD）
const todayStr = () => {
  const d = new Date()
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

// 生成正文：本人因[事由]，需请假 X 天（起 至 止）……望批准为盼；病假自动追加诊断证明提示
const buildLeaveBody = (f) => {
  const days = daysBetween(f.startDate, f.endDate)
  const who = f.applicant ? '本人' + f.applicant : '本人'
  const dept = f.department ? '（' + f.department + (f.position ? ' ' + f.position : '') + '）' : ''
  const typeTag = f.type ? f.type + '，' : ''
  let body = who + dept + '因' + (f.reason || '个人事务') +
    '，需请假 ' + days + ' 天（' + typeTag + (f.startDate || '　') + ' 至 ' + (f.endDate || '　') +
    '），期间相关事项已安排交接，望批准为盼。'
  if (f.type === '病假') {
    body += '\n附：医院诊断证明。'
  }
  return body
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const leaveType = ref('事假')
const applicant = ref('')
const department = ref('')
const position = ref('')
const startDate = ref('')
const endDate = ref('')
const reason = ref('')
const signDate = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const dateInvalid = computed(() => {
  return Boolean(startDate.value && endDate.value && endDate.value < startDate.value)
})

// 结束日期早于开始时按同一天处理
const effectiveEnd = computed(() => {
  if (dateInvalid.value) return startDate.value
  return endDate.value
})

const days = computed(() => daysBetween(startDate.value, effectiveEnd.value))

const bodyText = computed(() => {
  return buildLeaveBody({
    type: leaveType.value,
    applicant: applicant.value.trim(),
    department: department.value.trim(),
    position: position.value.trim(),
    reason: reason.value.trim(),
    startDate: startDate.value,
    endDate: effectiveEnd.value
  })
})

const printNote = () => {
  window.print()
}
</script>

<style scoped>
/* 请假条纸面：A4 比例的白底版式 */
.note-paper {
  width: 210mm;
  min-height: 270mm;
  background: #fff;
  color: #1a1a1a;
  padding: 22mm 20mm;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  font-family: 'SimSun', 'Songti SC', 'Noto Serif CJK SC', serif;
  font-size: 12.5pt;
  line-height: 2;
}

.note-title {
  text-align: center;
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: 0.6em;
  text-indent: 0.6em; /* 抵消末字后的字距，保证视觉居中 */
  margin-bottom: 10mm;
}

.note-salutation {
  font-weight: 500;
}

.note-body {
  text-indent: 2em;
  white-space: pre-line;
  text-align: justify;
  margin-top: 2mm;
}

.note-closing {
  margin-top: 8mm;
}

.note-zhici {
  text-indent: 2em;
}

.note-sign {
  margin-top: 16mm;
  text-align: right;
  padding-right: 10mm;
}

.note-sign-date {
  margin-top: 2mm;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  .no-print {
    display: none !important;
  }

  .preview-panel {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }

  .sheet-scroll {
    overflow: visible !important;
  }

  .note-paper {
    width: 210mm;
    min-height: 296mm;
    box-shadow: none;
    padding: 25mm 22mm;
  }
}
</style>
