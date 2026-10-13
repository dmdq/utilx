<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">备考倒排规划器 - 考试倒计时每日任务拆解</h1>
      <p class="text-muted-foreground">
        免费在线备考倒排计划工具，从考试日期反向推算剩余天数，按科目重要性与章节量把学习任务倒排到每一天（后期预留 20% 时间做总复习），自动生成「日期 / 科目 / 建议章节区间」每日任务表，考研、考公、期末复习均可使用。
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">考试与科目设置</label>
        </div>

        <div class="space-y-4">
          <!-- 考试日期 -->
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">考试日期</label>
            <input
              v-model="examDate"
              type="date"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
            <p class="text-xs text-muted-foreground mt-1">
              今天：{{ todayKey || '加载中…' }}<span v-if="remainingDays > 0">，距考试还剩 <strong class="text-primary">{{ remainingDays }}</strong> 天</span>
            </p>
          </div>

          <!-- 科目列表 -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-medium text-foreground">科目列表</label>
              <button
                @click="addSubject"
                class="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus class="w-4 h-4" /> 添加科目
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(subject, index) in subjects"
                :key="subject.id"
                class="p-3 bg-muted/50 border border-border rounded-lg space-y-2"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">{{ index + 1 }}.</span>
                  <input
                    v-model="subject.name"
                    type="text"
                    class="flex-1 px-3 py-1.5 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                    placeholder="科目名称，如：数学"
                  >
                  <button
                    @click="removeSubject(subject.id)"
                    class="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                    title="删除该科目"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                  <div class="flex items-center gap-2">
                    <label class="text-xs text-muted-foreground whitespace-nowrap">章节数</label>
                    <input
                      v-model.number="subject.chapters"
                      type="number"
                      min="1"
                      step="1"
                      class="w-20 px-2 py-1.5 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                    >
                  </div>
                  <div class="flex items-center gap-1.5">
                    <label class="text-xs text-muted-foreground whitespace-nowrap">重要性</label>
                    <button
                      v-for="level in importanceLevels"
                      :key="level.key"
                      @click="subject.importance = level.key"
                      :class="[
                        'px-2.5 py-1 rounded text-xs transition',
                        subject.importance === level.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      ]"
                    >
                      {{ level.label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-2">重要性自动映射权重：高=3、中=2、低=1，权重越高每天分到的章节任务越多</p>
          </div>
        </div>
      </div>

      <!-- 结果区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">每日任务规划结果</label>
        </div>

        <div v-if="plan.ok" class="space-y-4">
          <!-- 汇总卡片 -->
          <div class="grid grid-cols-2 gap-2">
            <div class="p-4 bg-primary/10 border border-primary/30 rounded-lg text-center">
              <p class="text-xs text-muted-foreground mb-1">距考试剩余天数</p>
              <p class="text-3xl font-bold text-primary">{{ plan.remaining }}</p>
            </div>
            <div class="grid grid-rows-2 gap-2">
              <div class="bg-muted rounded-lg p-2 text-center flex flex-col justify-center">
                <p class="text-[10px] text-muted-foreground">学习期（前 80%）</p>
                <p class="text-base font-bold text-foreground">{{ plan.studyDays }} 天</p>
              </div>
              <div class="bg-muted rounded-lg p-2 text-center flex flex-col justify-center">
                <p class="text-[10px] text-muted-foreground">总复习期（后 20%）</p>
                <p class="text-base font-bold text-foreground">{{ plan.reviewDays }} 天</p>
              </div>
            </div>
          </div>

          <!-- 各科节奏 -->
          <div class="p-3 bg-muted rounded-lg">
            <p class="text-xs font-medium text-foreground mb-1.5">各科每日节奏（学习期内）</p>
            <div class="space-y-1">
              <p
                v-for="s in plan.subjectPace"
                :key="s.name"
                class="text-xs text-muted-foreground"
              >
                • {{ s.name }}：{{ s.chapters }} 章 ÷ {{ plan.studyDays }} 天 ≈ 每天 {{ s.pace }} 章（权重 {{ s.weight }}）
              </p>
            </div>
          </div>

          <!-- 每日任务表 -->
          <div class="overflow-x-auto border border-border rounded-lg">
            <div class="max-h-96 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="sticky top-0">
                  <tr class="bg-muted text-left">
                    <th class="px-3 py-2 font-medium text-foreground whitespace-nowrap">日期</th>
                    <th class="px-3 py-2 font-medium text-foreground">科目</th>
                    <th class="px-3 py-2 font-medium text-foreground">建议章节区间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, i) in plan.rows"
                    :key="i"
                    :class="[
                      'border-t border-border',
                      row.type === 'exam' ? 'bg-primary/10' : (row.type === 'review' ? 'bg-muted/40' : '')
                    ]"
                  >
                    <td class="px-3 py-1.5 whitespace-nowrap text-foreground">
                      {{ formatMonthDay(row.date) }}
                      <span class="text-xs text-muted-foreground">周{{ weekdayCN(row.date) }}</span>
                    </td>
                    <td class="px-3 py-1.5 text-foreground">{{ row.subject }}</td>
                    <td class="px-3 py-1.5 text-muted-foreground">{{ row.range }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            共 {{ plan.rows.length }} 行 = 学习期 {{ plan.studyDays }} 天 + 总复习期 {{ plan.reviewDays }} 天 + 考试日提示；学习任务从今天开始铺满到考前一天。
          </p>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          {{ plan.reason || '请选择考试日期并添加至少一个科目' }}
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="isSeoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是备考倒排规划器？
        </h2>
        <p class="text-muted-foreground mb-4">
          备考倒排规划器是一款从考试日期「反向推算」的复习计划工具：先算出距离考试还剩多少天，再把各科章节量按重要性权重拆解到每一天，
          生成一张可直接执行的每日任务表。与「今天学多少算多少」的正向安排不同，倒排法以截止日期为锚点，能尽早暴露「时间不够」的风险，及时调整科目取舍。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">倒排算法：前紧后松，留足总复习</h3>
        <p class="text-muted-foreground mb-4">
          工具把剩余天数切成两段：前 80% 为「学习期」，按科目权重（高=3、中=2、低=1）把各科章节量分摊到每天；
          后 20% 为「总复习期」，不再安排新章节，专用于整体回顾、错题重做与薄弱章节二刷。
          例如考试日 2026-12-31、今天 2026-10-13，剩余 79 天，则学习期 63 天、总复习期 16 天；
          单科 40 章时每天约推进 40 ÷ 63 ≈ 0.63 章，任务表会精确给出每天应完成的章节区间。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">如何使用本工具做备考计划</h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择考试日期，页面自动按今天计算剩余天数</li>
          <li>添加科目，填写章节数并点选重要性（自动映射权重）</li>
          <li>查看每日任务表：学习期显示科目与建议章节区间，最后 20% 天数显示总复习轮次</li>
          <li>每天按表推进，落后时提高当天章节量或压缩低权重科目</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-lg font-semibold text-foreground">为什么后期要留 20% 天数做总复习？</h4>
            <p class="text-muted-foreground mt-1">
              只学不复习的知识留存率很低。预留约 20% 的考前时间做整体回顾，能把前面学过的内容再串 1-2 轮，
              重点攻克错题与薄弱章节；这也是「前紧后松」排法的核心：新知识尽量早学完，越临近考试越以巩固为主。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">科目权重（高/中/低）是怎么影响计划的？</h4>
            <p class="text-muted-foreground mt-1">
              高、中、低分别映射为 3、2、1 的权重，每个科目按「自身权重 ÷ 总权重」的比例瓜分每天的可学章节量。
              例如数学标「高」、政治标「低」，数学每天分到的章节任务约是政治的 3 倍。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">任务落后于计划了怎么办？</h4>
            <p class="text-muted-foreground mt-1">
              优先做减法而不是硬追赶：降低低权重科目的章节颗粒度（只过框架和高频考点）、把部分章节移入总复习期一起处理，
              或者接受「学不完」并把剩余时间全部倾斜给高权重科目。倒排表的价值正是让这个决策尽早发生。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'exam-countdown-planner'" :category="'time'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '备考倒排规划器 - 考试倒计时每日任务拆解',
  description: '在线备考倒排规划工具，从考试日反向推算剩余天数，按科目重要性权重把章节任务倒排到每天，后期预留 20% 总复习期，自动生成日期/科目/章节区间每日任务表，纯本地计算',
  keywords: '备考时间规划, 考研倒排, 复习计划倒排, 考试倒计时, 每日复习任务, 备考计划表',
  author: 'Util工具箱',
  ogTitle: '备考倒排规划器 - 有条工具',
  ogDescription: '从考试日反向拆解各科任务到每日，按剩余天数与章节权重自动重算',
  ogUrl: 'https://www.util.cn/tools/exam-countdown-planner',
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
          name: '备考倒排规划器',
          url: 'https://www.util.cn/tools/exam-countdown-planner',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['考试倒计时', '按权重倒排每日任务', '章节区间拆解', '预留20%总复习期', '科目可增删']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间工具', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '备考倒排规划器', item: 'https://www.util.cn/tools/exam-countdown-planner/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么后期要留 20% 天数做总复习？',
              acceptedAnswer: { '@type': 'Answer', text: '只学不复习留存率低，预留约 20% 考前时间可把内容再串 1-2 轮，越临近考试越以巩固为主。' }
            },
            {
              '@type': 'Question',
              name: '科目权重（高/中/低）是怎么影响计划的？',
              acceptedAnswer: { '@type': 'Answer', text: '高、中、低映射为 3、2、1 权重，各科目按自身权重占总权的比例瓜分每天可学章节量。' }
            },
            {
              '@type': 'Question',
              name: '任务落后于计划了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '优先做减法：压缩低权重科目颗粒度或并入总复习期，把剩余时间倾斜给高权重科目。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'exam-countdown-planner')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 日期工具（纯函数） ----------
const pad2 = (n) => String(n).padStart(2, '0')
const toDateStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (dateStr, n) => {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}
const diffDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000)
const weekdayCN = (s) => '日一二三四五六'[parseDate(s).getDay()]
const formatMonthDay = (s) => {
  const d = parseDate(s)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// ---------- 倒排核心算法（纯函数） ----------
// remaining = 考试日 - 今天；学习期 = floor(remaining * 0.8)；总复习期 = 其余；
// 各科按 权重/总权重 分摊每日章节量：cum_i = i * chapters * weight / totalWeight / studyDays
const IMPORTANCE_WEIGHT = { high: 3, mid: 2, low: 1 }

const buildPlan = (today, examDateStr, subjectList) => {
  if (!today || !examDateStr) return { ok: false, reason: '请先选择考试日期' }
  const remaining = diffDays(today, examDateStr)
  if (isNaN(remaining)) return { ok: false, reason: '日期格式有误' }
  if (remaining <= 0) return { ok: false, reason: remaining === 0 ? '今天就是考试日，全力以赴！' : '考试日期已过，请重新选择' }

  const validSubjects = subjectList.filter(s => s.name.trim() !== '' && Number(s.chapters) > 0)
  if (validSubjects.length === 0) return { ok: false, reason: '请添加至少一个科目并填写章节数' }

  const studyDays = Math.floor(remaining * 0.8)
  const reviewDays = remaining - studyDays

  const totalWeight = validSubjects.reduce((sum, s) => sum + IMPORTANCE_WEIGHT[s.importance], 0)

  const rows = []
  // 学习期：每天 × 每个科目一行
  for (let i = 1; i <= studyDays; i++) {
    const date = addDays(today, i - 1)
    for (const s of validSubjects) {
      const chapters = Math.floor(Number(s.chapters))
      const share = IMPORTANCE_WEIGHT[s.importance] / totalWeight
      // 该科目每天应推进的章节量 = 章节数 × 权重份额 ÷ 学习期天数
      const dailyQuota = chapters * share / studyDays
      const cumPrev = (i - 1) * dailyQuota
      const cumNow = i * dailyQuota
      const start = Math.floor(cumPrev) + 1
      const end = Math.min(chapters, Math.max(start, Math.floor(cumNow)))
      let range
      if (end > start) {
        range = `第${start}–${end}章`
      } else if (cumPrev > start - 1) {
        range = `第${start}章（续）`
      } else {
        range = `第${start}章`
      }
      rows.push({ type: 'study', date, subject: s.name.trim(), range })
    }
  }
  // 总复习期：轮次提示
  const half = Math.ceil(reviewDays / 2)
  for (let r = 1; r <= reviewDays; r++) {
    const date = addDays(today, studyDays + r - 1)
    const round = r <= half ? 1 : 2
    rows.push({
      type: 'review',
      date,
      subject: '全科总复习',
      range: `第 ${round} 轮：回顾错题与薄弱章节，不打新章`
    })
  }
  // 考试日
  rows.push({ type: 'exam', date: examDateStr, subject: '考试日', range: '轻装上阵，祝顺利上岸' })

  const subjectPace = validSubjects.map(s => ({
    name: s.name.trim(),
    chapters: Math.floor(Number(s.chapters)),
    weight: IMPORTANCE_WEIGHT[s.importance],
    pace: (Math.floor(Number(s.chapters)) * IMPORTANCE_WEIGHT[s.importance] / totalWeight / studyDays).toFixed(2)
  }))

  return { ok: true, remaining, studyDays, reviewDays, rows, subjectPace }
}

// ---------- 状态 ----------
const todayKey = ref('')
const examDate = ref('')
const subjects = ref([
  { id: 1, name: '数学', chapters: 6, importance: 'high' },
  { id: 2, name: '专业课', chapters: 10, importance: 'mid' }
])
let subjectIdSeed = 3

const importanceLevels = [
  { key: 'high', label: '高' },
  { key: 'mid', label: '中' },
  { key: 'low', label: '低' }
]

const isSeoContentVisible = ref(true)
const toggleSeoContent = () => { isSeoContentVisible.value = !isSeoContentVisible.value }

const remainingDays = computed(() => {
  if (!todayKey.value || !examDate.value) return 0
  const d = diffDays(todayKey.value, examDate.value)
  return isNaN(d) ? 0 : d
})

const plan = computed(() => {
  if (!todayKey.value) return { ok: false, reason: '' }
  return buildPlan(todayKey.value, examDate.value, subjects.value)
})

const addSubject = () => {
  subjects.value.push({ id: subjectIdSeed++, name: '', chapters: 10, importance: 'mid' })
}
const removeSubject = (id) => {
  subjects.value = subjects.value.filter(s => s.id !== id)
}

onMounted(() => {
  todayKey.value = toDateStr(new Date())
  if (!examDate.value) examDate.value = addDays(todayKey.value, 60)
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
