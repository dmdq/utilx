<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">行测估分器 - 考公行测模考在线估分</h1>
      <p class="text-muted-foreground">
        免费在线行测估分工具，按常识判断、言语理解、数量关系、判断推理、资料分析五个模块录入题数与对题数，即时计算各模块正确率与得分、总分及模块强弱排序。内置「简化等题分」与「加权归一」两套社区通行分值方案，全部计算在浏览器本地完成。
      </p>
      <div class="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
        <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          重要说明：行测官方从未公布各模块分值，本工具所有分值均为<strong>社区通行估算口径，非官方</strong>，结果仅供参考，请勿作为报考决策唯一依据。
        </p>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">各模块答题情况</label>
        </div>

        <div class="space-y-3">
          <div
            v-for="module in modules"
            :key="module.key"
            class="p-3 bg-muted/50 border border-border rounded-lg"
          >
            <div class="flex items-center gap-3 flex-wrap">
              <span class="text-sm font-medium text-foreground w-20 flex-shrink-0">{{ module.label }}</span>
              <div class="flex items-center gap-1.5">
                <label class="text-xs text-muted-foreground whitespace-nowrap">题数</label>
                <input
                  v-model.number="module.total"
                  type="number"
                  min="0"
                  step="1"
                  class="w-20 px-2 py-1.5 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                >
              </div>
              <div class="flex items-center gap-1.5">
                <label class="text-xs text-muted-foreground whitespace-nowrap">对题数</label>
                <input
                  v-model.number="module.correct"
                  type="number"
                  min="0"
                  step="1"
                  class="w-20 px-2 py-1.5 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                >
              </div>
              <span
                v-if="moduleAccuracy(module) !== null"
                :class="[
                  'ml-auto text-sm font-semibold',
                  accuracyClass(moduleAccuracy(module))
                ]"
              >
                正确率 {{ moduleAccuracy(module) }}%
              </span>
            </div>
            <div v-if="module.total > 0" class="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all"
                :style="{ width: Math.min(100, moduleAccuracy(module) || 0) + '%' }"
              ></div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground">
            题数已按国考常见结构预填（合计 {{ grandTotal }} 题），可按本省卷型自行修改；对题数填 0 至题数之间的整数。
          </p>
        </div>
      </div>

      <!-- 结果区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">估分结果</label>
          <!-- 两套分值方案切换 -->
          <div class="flex gap-1.5">
            <button
              v-for="scheme in schemeOptions"
              :key="scheme.key"
              @click="currentScheme = scheme.key"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                currentScheme === scheme.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              {{ scheme.label }}
            </button>
          </div>
        </div>

        <div v-if="hasAnswered" class="space-y-4">
          <!-- 总分醒目卡片 -->
          <div class="p-6 bg-primary/10 border border-primary/30 rounded-lg text-center">
            <p class="text-sm text-muted-foreground mb-1">
              估算总分（{{ currentSchemeLabel }} · 100 分制）
            </p>
            <p class="text-5xl font-bold text-primary">{{ totalScore }}</p>
            <p class="text-xs text-muted-foreground mt-2">
              共答对 {{ totalCorrect }} / {{ grandTotal }} 题 · 总正确率 {{ overallAccuracy }}%
            </p>
          </div>

          <!-- 各模块得分表 -->
          <div class="overflow-x-auto border border-border rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted text-left">
                  <th class="px-3 py-2 font-medium text-foreground">模块</th>
                  <th class="px-3 py-2 font-medium text-foreground">对/总</th>
                  <th class="px-3 py-2 font-medium text-foreground">正确率</th>
                  <th class="px-3 py-2 font-medium text-foreground">得分</th>
                  <th class="px-3 py-2 font-medium text-foreground">强弱排序</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in moduleScoreRows"
                  :key="item.key"
                  class="border-t border-border"
                >
                  <td class="px-3 py-1.5 text-foreground">{{ item.label }}</td>
                  <td class="px-3 py-1.5 text-muted-foreground">{{ item.correct }}/{{ item.total }}</td>
                  <td :class="['px-3 py-1.5 font-medium', accuracyClass(item.accuracy)]">{{ item.accuracy }}%</td>
                  <td class="px-3 py-1.5 text-foreground">{{ item.scoreText }}</td>
                  <td class="px-3 py-1.5">
                    <span :class="[
                      'inline-block px-1.5 py-0.5 text-[10px] rounded',
                      item.rank === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-muted text-muted-foreground'
                    ]">
                      第 {{ item.rank }} 强
                    </span>
                    <span
                      v-if="item.key === weakestModule.key"
                      class="ml-1 inline-block px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    >最弱</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 最弱模块提示 -->
          <div
            v-if="weakestModule"
            class="p-4 bg-muted rounded-lg border border-border"
          >
            <h3 class="text-sm font-medium mb-1 text-foreground">强弱分析</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              你的最强模块是 <strong class="text-green-600 dark:text-green-400">{{ strongestModule.label }}</strong>（正确率 {{ moduleAccuracy(strongestModule) }}%），
              最弱模块是 <strong class="text-red-600 dark:text-red-400">{{ weakestModule.label }}</strong>（正确率 {{ moduleAccuracy(weakestModule) }}%）。
              冲刺阶段建议把错题整理和专项练习优先投入「{{ weakestModule.label }}」，性价比最高。
            </p>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请在左侧填写各模块对题数，即时出分
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
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
          什么是行测估分器？
        </h2>
        <p class="text-muted-foreground mb-4">
          行测（行政职业能力测验）是公务员考试的公共科目，国考卷通常为 130-135 题、满分 100 分。由于官方只公布总分不公布各题分值，
          考生模考后只能自己估算得分。行测估分器让你按五个模块录入「题数」和「对题数」，即时换算成 100 分制的估算总分，
          并给出各模块正确率与强弱排序，帮助定位短板、调整复习策略。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">两套分值方案有什么区别</h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>简化方案</strong>：每题 1 分，总分 = 答对题数 ÷ 总题数 × 100。计算直观，适合快速横向对比多次模考。</li>
          <li><strong>加权方案</strong>：按社区流行的经验权重计算——常识×0.5、言语×0.6、数量×0.8、判断×0.6、资料×1.0，
            再按「加权得分 ÷ 满分权重 × 100」归一化。它体现了「资料分析题量大且单题分高、数量关系单题分高」的通行认知。</li>
          <li>两套方案在全对时都得 100 分；答错越多，加权方案通常比简化方案掉分更明显（因为高分值模块错题惩罚更重）。</li>
        </ul>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">如何使用本工具估分</h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>对照答案，数出每个模块的答对题数并填入</li>
          <li>题数默认按国考 135 题结构预填，省考或其他卷型可自行修改</li>
          <li>切换「简化方案 / 加权方案」查看不同口径下的总分</li>
          <li>根据强弱排序，把复习时间优先投入正确率最低的模块</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-lg font-semibold text-foreground">行测每道题到底值多少分？</h4>
            <p class="text-muted-foreground mt-1">
              官方从未公布行测的单题分值，不同机构的「分值表」均为经验估算。本工具在醒目位置也标注了「分值为社区通行估算口径，非官方」。
              建议：与目标岗位往年进面分数对比时，使用同一套口径保持前后一致即可，绝对数值不必较真。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">估分 70 分是什么水平？</h4>
            <p class="text-muted-foreground mt-1">
              以国考为参照，行测 60 分上下属于基础水平，65-70 分具备较强竞争力，70 分以上在多数岗位进面希望较大，
              部分热门岗位需要 75 分以上。各省省考难度与分数线差异较大，请结合本省历年进面名单判断。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">为什么我两次模考分差很大？</h4>
            <p class="text-muted-foreground mt-1">
              行测题量大、时间紧，正确率受试卷难度、考场状态与蒙题运气影响明显。单次估分波动 3-5 分属正常现象，
              建议以 3 次以上模考的移动平均观察趋势，并重点看「分模块正确率」而非总分本身。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'xingce-score-estimator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '行测估分器 - 考公行测模考在线估分',
  description: '在线行测估分工具，按常识/言语/数量/判断/资料五模块录题数与对题数，即时算正确率、总分与模块强弱排序，内置简化与加权两套社区通行分值方案，纯本地计算，非官方口径已标注',
  keywords: '行测估分, 行测分数计算, 模考估分, 考公行测, 正确率换算, 行测分值',
  author: 'Util工具箱',
  ogTitle: '行测估分器 - 有条工具',
  ogDescription: '五模块录入即时估分，内置两套社区通行分值方案',
  ogUrl: 'https://www.util.cn/tools/xingce-score-estimator',
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
          name: '行测估分器',
          url: 'https://www.util.cn/tools/xingce-score-estimator',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['五模块录题即时估分', '简化/加权两套方案', '模块正确率统计', '强弱排序提示', '题数可自定义']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '行测估分器', item: 'https://www.util.cn/tools/xingce-score-estimator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '行测每道题到底值多少分？',
              acceptedAnswer: { '@type': 'Answer', text: '官方从未公布单题分值，各机构分值表均为经验估算，本工具结果为社区通行估算口径，非官方。' }
            },
            {
              '@type': 'Question',
              name: '估分 70 分是什么水平？',
              acceptedAnswer: { '@type': 'Answer', text: '国考参照下 65-70 分具备较强竞争力，70 分以上多数岗位进面希望较大，热门岗位常需 75 分以上。' }
            },
            {
              '@type': 'Question',
              name: '为什么两次模考分差很大？',
              acceptedAnswer: { '@type': 'Answer', text: '行测受难度、状态与蒙题运气影响，单次波动 3-5 分正常，建议看多次模考趋势与分模块正确率。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'xingce-score-estimator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
// 社区通行经验权重：满分权重 = 20*0.5+40*0.6+15*0.8+40*0.6+20*1.0 = 90
const MODULE_WEIGHT = {
  common: 0.5,
  verbal: 0.6,
  quant: 0.8,
  judge: 0.6,
  data: 1.0
}

const modules = ref([
  { key: 'common', label: '常识判断', total: 20, correct: 0 },
  { key: 'verbal', label: '言语理解', total: 40, correct: 0 },
  { key: 'quant', label: '数量关系', total: 15, correct: 0 },
  { key: 'judge', label: '判断推理', total: 40, correct: 0 },
  { key: 'data', label: '资料分析', total: 20, correct: 0 }
])

const schemeOptions = [
  { key: 'simple', label: '简化方案' },
  { key: 'weighted', label: '加权方案' }
]
const currentScheme = ref('simple')
const currentSchemeLabel = computed(() =>
  schemeOptions.find(s => s.key === currentScheme.value)?.label || ''
)

const isSeoContentVisible = ref(true)
const toggleSeoContent = () => { isSeoContentVisible.value = !isSeoContentVisible.value }

// ---------- 计算逻辑（纯函数） ----------
const clampCorrect = (m) => Math.max(0, Math.min(Number(m.correct) || 0, Number(m.total) || 0))
const moduleAccuracy = (m) => {
  const total = Number(m.total) || 0
  if (total <= 0) return null
  return Math.round(clampCorrect(m) / total * 1000) / 10
}
const accuracyClass = (acc) => {
  if (acc === null) return 'text-muted-foreground'
  if (acc >= 80) return 'text-green-600 dark:text-green-400'
  if (acc >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

const grandTotal = computed(() => modules.value.reduce((sum, m) => sum + (Number(m.total) || 0), 0))
const totalCorrect = computed(() => modules.value.reduce((sum, m) => sum + clampCorrect(m), 0))
const overallAccuracy = computed(() => {
  if (grandTotal.value <= 0) return '0'
  return (Math.round(totalCorrect.value / grandTotal.value * 1000) / 10).toString()
})
const hasAnswered = computed(() => grandTotal.value > 0 && modules.value.some(m => clampCorrect(m) > 0))

// 各模块得分与排序
const moduleScoreRows = computed(() => {
  const simpleMax = grandTotal.value || 1
  const weightedMax = modules.value.reduce((sum, m) => sum + (Number(m.total) || 0) * MODULE_WEIGHT[m.key], 0) || 1

  const rows = modules.value.map(m => {
    const correct = clampCorrect(m)
    const total = Number(m.total) || 0
    const acc = moduleAccuracy(m)
    let scoreText
    if (currentScheme.value === 'simple') {
      // 简化方案：每题 1 分，模块得分 = 对题数，总分按 总对数/总题数*100 折算
      scoreText = `${correct} 分 / 满 ${total} 分`
    } else {
      // 加权方案：模块加权得分，满分权重按当前题数动态计算
      const w = MODULE_WEIGHT[m.key]
      const got = Math.round(correct * w * 100) / 100
      const max = Math.round(total * w * 100) / 100
      scoreText = `${got} / 满 ${max}（权重×${w}）`
    }
    return { ...m, correct, total, accuracy: acc === null ? 0 : acc, scoreText, simpleMax, weightedMax }
  })

  // 按正确率排强弱（1 = 最强），并列同名次
  const sorted = [...rows].sort((a, b) => b.accuracy - a.accuracy)
  sorted.forEach((row, idx) => {
    row.rank = idx > 0 && sorted[idx - 1].accuracy === row.accuracy ? sorted[idx - 1].rank : idx + 1
  })
  return rows
})

const strongestModule = computed(() => {
  const sorted = [...moduleScoreRows.value].sort((a, b) => (b.accuracy - a.accuracy) || a.key.localeCompare(b.key))
  return sorted[0]
})

const weakestModule = computed(() => {
  const sorted = [...moduleScoreRows.value].sort((a, b) => a.accuracy - b.accuracy)
  return sorted[0]
})

// 总分
const totalScore = computed(() => {
  let score
  if (currentScheme.value === 'simple') {
    // 简化方案：对数/总题数*100
    score = totalCorrect.value / (grandTotal.value || 1) * 100
  } else {
    // 加权方案：加权总分 / 满分权重 * 100（全对 = 100）
    const got = modules.value.reduce((sum, m) => sum + clampCorrect(m) * MODULE_WEIGHT[m.key], 0)
    const max = modules.value.reduce((sum, m) => sum + (Number(m.total) || 0) * MODULE_WEIGHT[m.key], 0)
    score = max > 0 ? got / max * 100 : 0
  }
  return (Math.round(score * 10) / 10).toFixed(1)
})
</script>
