<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">成绩等级统计分析 - 及格率优秀率分数段分布</h1>
      <p class="text-muted-foreground">
        免费在线成绩统计分析工具，粘贴成绩列表（每行一个分数，或「姓名,分数」格式，自动识别）即可本地计算人数、最高分、最低分、平均分、中位数、及格率、优秀率与分数段分布，生成含并列排名的成绩明细表，等级线可自定义，支持一键打印报表。数据全程不出浏览器。
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full no-print">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">成绩数据录入</label>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">粘贴成绩（每行一条）</label>
            <textarea
              v-model="rawInput"
              rows="10"
              class="w-full px-4 py-3 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm font-mono leading-relaxed"
              placeholder="两种格式自动识别：&#10;95&#10;88&#10;或&#10;张三,95&#10;李四,88"
            ></textarea>
            <p class="text-xs text-muted-foreground mt-1">
              已识别 <strong class="text-foreground">{{ students.length }}</strong> 条有效成绩<span v-if="skippedLines > 0">，跳过 {{ skippedLines }} 条无法识别的行</span>
            </p>
          </div>

          <!-- 等级线配置 -->
          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">等级线配置（≥ 即为该等级）</label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs text-muted-foreground mb-1">优秀 ≥</label>
                <input
                  v-model.number="excellentLine"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                >
              </div>
              <div>
                <label class="block text-xs text-muted-foreground mb-1">良好 ≥</label>
                <input
                  v-model.number="goodLine"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                >
              </div>
              <div>
                <label class="block text-xs text-muted-foreground mb-1">及格 ≥</label>
                <input
                  v-model.number="passLine"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                >
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="fillSample"
              class="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition"
            >
              填入示例数据
            </button>
            <button
              @click="clearInput"
              class="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      <!-- 统计结果 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3 no-print">
          <label class="text-sm font-medium text-foreground">统计结果</label>
          <button
            v-if="students.length > 0"
            @click="printReport"
            class="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
          >
            <Printer class="w-4 h-4" /> 打印报表
          </button>
        </div>

        <div v-if="students.length > 0" class="space-y-4">
          <!-- 统计卡 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">人数</p>
              <p class="text-2xl font-bold text-primary">{{ stats.count }}</p>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">平均分</p>
              <p class="text-2xl font-bold text-foreground">{{ stats.avg }}</p>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">中位数</p>
              <p class="text-2xl font-bold text-foreground">{{ stats.median }}</p>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">最高 / 最低</p>
              <p class="text-2xl font-bold text-foreground">{{ stats.max }} <span class="text-sm text-muted-foreground">/</span> {{ stats.min }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">及格率（≥{{ passLine }} 分）</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats.passRate }}%</p>
              <p class="text-xs text-muted-foreground">{{ stats.passCount }}/{{ stats.count }} 人</p>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">优秀率（≥{{ excellentLine }} 分）</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats.excellentRate }}%</p>
              <p class="text-xs text-muted-foreground">{{ stats.excellentCount }}/{{ stats.count }} 人</p>
            </div>
          </div>

          <!-- 分数段分布表 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted text-left">
                  <th class="px-3 py-2 font-medium text-foreground">分数段</th>
                  <th class="px-3 py-2 font-medium text-foreground">人数</th>
                  <th class="px-3 py-2 font-medium text-foreground w-1/2">占比</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="band in bands"
                  :key="band.label"
                  class="border-t border-border"
                >
                  <td class="px-3 py-1.5 text-foreground whitespace-nowrap">{{ band.label }}</td>
                  <td class="px-3 py-1.5 text-foreground">{{ band.count }} 人</td>
                  <td class="px-3 py-1.5">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          class="h-full bg-primary rounded-full"
                          :style="{ width: band.percent + '%' }"
                        ></div>
                      </div>
                      <span class="text-xs text-muted-foreground w-12 text-right">{{ band.percent }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请在左侧粘贴成绩数据，自动生成统计报表
        </div>
      </div>
    </div>

    <!-- 成绩明细表 -->
    <div v-if="students.length > 0" class="mb-8">
      <h2 class="text-lg font-semibold text-foreground mb-3 no-print">成绩明细（同分并列排名）</h2>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-muted text-left">
              <th class="px-3 py-2 font-medium text-foreground">排名</th>
              <th class="px-3 py-2 font-medium text-foreground">姓名</th>
              <th class="px-3 py-2 font-medium text-foreground">分数</th>
              <th class="px-3 py-2 font-medium text-foreground">等级</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="student in rankedStudents"
              :key="student.uid"
              class="border-t border-border"
            >
              <td class="px-3 py-1.5 text-foreground">{{ student.rank }}</td>
              <td class="px-3 py-1.5 text-foreground">{{ student.name }}</td>
              <td class="px-3 py-1.5 font-semibold text-foreground">{{ student.score }}</td>
              <td class="px-3 py-1.5">
                <span :class="['px-2 py-0.5 text-xs rounded', gradeClass(student.grade)]">{{ student.grade }}</span>
              </td>
            </tr>
          </tbody>
        </table>
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
          什么是成绩等级统计分析工具？
        </h2>
        <p class="text-muted-foreground mb-4">
          成绩等级统计分析是一款面向老师、班主任和培训机构的本地统计工具：把成绩单直接粘贴进文本框（支持「每行一个分数」或「姓名,分数」两种格式，自动识别），
          一键得到人数、最高/最低分、平均分、中位数、及格率、优秀率、分数段分布表与含并列排名的明细表。所有计算都在浏览器内完成，成绩数据不上传服务器。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">统计口径说明</h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>平均分</strong>：算术平均，保留 1 位小数；<strong>中位数</strong>：排序后取中间值，偶数个取中间两数均值。</li>
          <li><strong>及格率</strong> = 分数 ≥ 及格线（默认 60）的人数 ÷ 总人数；<strong>优秀率</strong> = 分数 ≥ 优秀线（默认 90）的人数 ÷ 总人数，均保留 1 位小数。</li>
          <li><strong>等级</strong>按 优秀线 / 良好线 / 及格线 从高到低判定，低于及格线为「不及格」，三条等级线均可自定义。</li>
          <li><strong>并列排名</strong>采用同分同名次、下一名次跳过的竞赛排名法：如两人并列第 2，则下一位是第 4 名。</li>
        </ul>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">如何使用本工具分析班级成绩</h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>从 Excel 或成绩系统复制成绩列，粘贴到文本框（带姓名就写成「姓名,分数」）</li>
          <li>按需调整优秀/良好/及格三条等级线</li>
          <li>查看统计卡、分数段分布与明细排名，判断班级整体水平与两极分化程度</li>
          <li>点击「打印报表」可直接打印或另存为 PDF 存档</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-lg font-semibold text-foreground">我的成绩数据会被上传吗？</h4>
            <p class="text-muted-foreground mt-1">
              不会。本工具为纯前端本地计算，粘贴的数据只在浏览器内存中参与统计，页面关闭即消失，不会发送到任何服务器，
              可放心用于真实班级成绩分析。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">平均分和中位数应该看哪个？</h4>
            <p class="text-muted-foreground mt-1">
              平均分反映整体水平但容易被极端分数拉偏；中位数反映「中间学生」的位置，对偏科、低分极端值更稳健。
              两者差距越大，说明班级两极分化越明显，可结合分数段分布表确认。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">可以统计及格线不是 60 分的考试吗？</h4>
            <p class="text-muted-foreground mt-1">
              可以。及格线、良好线、优秀线都是可编辑的数字输入框，例如某些职业考试 72 分折算及格、某些竞赛 85 分才算优秀，
              直接改数字即可，及格率、优秀率与等级判定会实时重算。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'grade-statistics-analyzer'" :category="'calculate'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Printer, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '成绩等级统计分析 - 及格率优秀率分数段分布计算',
  description: '在线成绩统计分析工具，粘贴成绩列表自动算人数/最高分/最低分/平均分/中位数/及格率/优秀率与分数段分布，生成并列排名明细表，等级线可自定义，支持打印报表，数据纯本地计算不上传',
  keywords: '成绩统计分析, 及格率优秀率计算, 分数段分布, 班级成绩, 教师成绩工具, 成绩排名',
  author: 'Util工具箱',
  ogTitle: '成绩等级统计分析 - 有条工具',
  ogDescription: '粘贴成绩本地算均分/及格率/优秀率/分数段分布，可打印报表',
  ogUrl: 'https://www.util.cn/tools/grade-statistics-analyzer',
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
          name: '成绩等级统计分析',
          url: 'https://www.util.cn/tools/grade-statistics-analyzer',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['粘贴即统计', '及格率优秀率', '分数段分布表', '并列排名明细', '等级线可配置', '本地计算可打印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '成绩等级统计分析', item: 'https://www.util.cn/tools/grade-statistics-analyzer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '我的成绩数据会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。纯前端本地计算，数据只在浏览器内存中参与统计，不会发送到任何服务器。' }
            },
            {
              '@type': 'Question',
              name: '平均分和中位数应该看哪个？',
              acceptedAnswer: { '@type': 'Answer', text: '平均分反映整体水平但易被极端值拉偏，中位数更稳健；两者差距越大说明两极分化越明显。' }
            },
            {
              '@type': 'Question',
              name: '可以统计及格线不是 60 分的考试吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，及格线/良好线/优秀线均为可编辑输入框，修改后及格率、优秀率与等级实时重算。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'grade-statistics-analyzer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const rawInput = ref('95\n88\n76\n60\n45\n88')
const excellentLine = ref(90)
const goodLine = ref(80)
const passLine = ref(60)

const isSeoContentVisible = ref(true)
const toggleSeoContent = () => { isSeoContentVisible.value = !isSeoContentVisible.value }

// ---------- 解析（纯函数）：每行一个分数 或 「姓名,分数」 ----------
const parseScores = (text) => {
  const lines = String(text).split('\n')
  const students = []
  let skipped = 0
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line === '') continue
    // 格式二：姓名,分数（中英文逗号均可）
    const named = line.match(/^(.+?)[,，]\s*(-?\d+(?:\.\d+)?)\s*$/)
    if (named) {
      students.push({ name: named[1].trim(), score: parseFloat(named[2]) })
      continue
    }
    // 格式一：整行就是一个分数
    if (/^-?\d+(?:\.\d+)?$/.test(line)) {
      students.push({ name: `考生${students.length + 1}`, score: parseFloat(line) })
      continue
    }
    skipped++
  }
  return { students, skipped }
}

const parsed = computed(() => parseScores(rawInput.value))
const students = computed(() => parsed.value.students)
const skippedLines = computed(() => parsed.value.skipped)

const fillSample = () => {
  rawInput.value = '张三,95\n李四,88\n王五,76\n赵六,60\n钱七,45\n孙八,88'
}
const clearInput = () => { rawInput.value = '' }
const printReport = () => { window.print() }

// ---------- 统计（纯函数） ----------
const round1 = (v) => Math.round(v * 10) / 10

const computeStats = (list, pass, excellent) => {
  const scores = list.map(s => s.score)
  const count = scores.length
  if (count === 0) return { count: 0 }
  const sorted = [...scores].sort((a, b) => a - b)
  const sum = scores.reduce((a, b) => a + b, 0)
  let median
  if (count % 2 === 1) {
    median = sorted[(count - 1) / 2]
  } else {
    median = (sorted[count / 2 - 1] + sorted[count / 2]) / 2
  }
  const passCount = scores.filter(s => s >= pass).length
  const excellentCount = scores.filter(s => s >= excellent).length
  return {
    count,
    max: sorted[count - 1],
    min: sorted[0],
    avg: round1(sum / count),
    median: round1(median),
    passCount,
    passRate: round1(passCount / count * 100),
    excellentCount,
    excellentRate: round1(excellentCount / count * 100)
  }
}

const stats = computed(() => computeStats(students.value, Number(passLine.value) || 0, Number(excellentLine.value) || 0))

// 分数段分布（固定五段）
const bands = computed(() => {
  const scores = students.value.map(s => s.score)
  const count = scores.length
  const defs = [
    { label: '<60（不及格）', test: s => s < 60 },
    { label: '60-69', test: s => s >= 60 && s <= 69 },
    { label: '70-79', test: s => s >= 70 && s <= 79 },
    { label: '80-89', test: s => s >= 80 && s <= 89 },
    { label: '90-100', test: s => s >= 90 }
  ]
  return defs.map(d => {
    const c = scores.filter(d.test).length
    return {
      label: d.label,
      count: c,
      percent: count > 0 ? round1(c / count * 100) : 0
    }
  })
})

// 等级与排名（同分并列，下一名跳过：1,2,2,4）
const gradeOf = (score) => {
  if (score >= (Number(excellentLine.value) || 0)) return '优秀'
  if (score >= (Number(goodLine.value) || 0)) return '良好'
  if (score >= (Number(passLine.value) || 0)) return '及格'
  return '不及格'
}
const gradeClass = (grade) => {
  if (grade === '优秀') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  if (grade === '良好') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
  if (grade === '及格') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
}

const rankedStudents = computed(() => {
  const sorted = [...students.value]
    .map((s, i) => ({ ...s, uid: i }))
    .sort((a, b) => b.score - a.score)
  let prevRank = 0
  return sorted.map((s, idx) => {
    const rank = idx > 0 && sorted[idx - 1].score === s.score ? prevRank : idx + 1
    prevRank = rank
    return { ...s, grade: gradeOf(s.score), rank }
  })
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
