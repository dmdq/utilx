<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Trophy class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">演讲比赛计分器</h1>
          <p class="text-sm text-muted-foreground mt-1">多评委打分自动去最高最低求均值，实时排名并附可打印评分表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        录入各评委打分自动去最高最低求均值并实时排名，附可打印评分表模板。支持 3-15 位评委、选手随时增删，
        去掉最高 / 最低的个数可配置（默认各 1），有效分均值保留 2 或 3 位小数，并列同名次；
        去极值明细可逐人展开核对，还可下载空白评分表（Word 可直接打开）供线下收集后录入，全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <!-- 输入区域：设置 -->
      <div class="space-y-5 no-print">
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
            <Settings2 class="w-4 h-4 text-primary" /> 比赛与计分设置
          </h2>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">比赛名称</label>
            <input
              v-model="contestName"
              type="text"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如：校园演讲比赛决赛"
            >
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">评委人数（3-15）</label>
            <input
              v-model.number="judgeCount"
              type="number"
              min="3"
              max="15"
              step="1"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
            <p v-if="judgeCountSafe < 3" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
              评委少于 3 位时将自动不去极值，直接取全部有效分平均。
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">去掉最高分个数</label>
              <input
                v-model.number="trimHigh"
                type="number"
                min="0"
                max="5"
                step="1"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">去掉最低分个数</label>
              <input
                v-model.number="trimLow"
                type="number"
                min="0"
                max="5"
                step="1"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">得分保留小数位</label>
            <div class="flex gap-2">
              <button
                v-for="d in [2, 3]"
                :key="d"
                @click="decimals = d"
                :class="[
                  'flex-1 py-2 rounded-lg text-sm font-medium transition',
                  decimals === d ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >{{ d }} 位小数</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">排名按保留后的得分比较，得分相同则并列同名次。</p>
          </div>
        </div>

        <!-- 选手管理 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Users class="w-4 h-4 text-primary" /> 选手列表
            </h2>
            <button
              @click="addContestant"
              class="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus class="w-4 h-4" /> 添加选手
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(c, i) in contestants" :key="c.id" class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground w-6 text-right">{{ i + 1 }}.</span>
              <input
                v-model="c.name"
                type="text"
                class="flex-1 min-w-0 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="`选手${i + 1}`"
              >
              <button
                @click="removeContestant(c.id)"
                :disabled="contestants.length <= 1"
                class="p-2 text-muted-foreground hover:text-red-500 disabled:opacity-40 transition-colors"
                title="删除该选手及其已录分数"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-2.5">
          <h2 class="text-base font-semibold text-foreground">线下评分收集</h2>
          <p class="text-xs text-muted-foreground">下载按当前选手与评委数生成的空白评分表，打印给评委现场打分，回来再录入本工具计分。</p>
          <div class="flex flex-col gap-2 pt-1">
            <button
              @click="downloadBlankSheet"
              class="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
            >
              <FileText class="w-4 h-4" /> 下载空白评分表 (.doc)
            </button>
            <button
              @click="printAll"
              class="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-accent transition"
            >
              <Printer class="w-4 h-4" /> 打印当前录入表
            </button>
            <button
              @click="clearScores"
              class="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-muted-foreground text-sm hover:text-red-500 transition"
            >
              <RotateCcw class="w-4 h-4" /> 清空全部已录分数
            </button>
          </div>
        </div>
      </div>

      <!-- 输出区域：录入表 + 排名 -->
      <div class="xl:col-span-2 space-y-4">
        <!-- 打分录入表 -->
        <div class="bg-card border border-border rounded-lg p-6 print-area">
          <h2 class="print-only text-xl font-bold text-foreground text-center mb-2">{{ contestName || '演讲比赛评分' }} · 评委打分录入表</h2>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4 no-print">
            <h2 class="text-base font-semibold text-foreground">评委打分录入（0-100）</h2>
            <span class="text-xs text-muted-foreground">
              {{ contestants.length }} 名选手 × {{ judgeCountSafe }} 位评委 · 去最高 {{ trimHighSafe }} 个 / 去最低 {{ trimLowSafe }} 个
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm min-w-[560px]">
              <thead>
                <tr class="bg-muted text-foreground">
                  <th class="border border-border px-3 py-2 font-medium text-left sticky left-0 bg-muted">选手</th>
                  <th v-for="j in judgeIdxs" :key="j" class="border border-border px-2 py-2 font-medium text-center whitespace-nowrap">评委{{ j + 1 }}</th>
                  <th class="border border-border px-2 py-2 font-medium text-center whitespace-nowrap">已录</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in contestants" :key="c.id">
                  <td class="border border-border px-3 py-1.5 font-medium text-foreground whitespace-nowrap sticky left-0 bg-card">
                    {{ c.name || `选手${c.id}` }}
                  </td>
                  <td v-for="j in judgeIdxs" :key="j" class="border border-border p-0.5">
                    <input
                      v-model.number="scores[scoreKey(c.id, j)]"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      class="w-full px-1.5 py-1.5 bg-background text-center text-foreground text-sm rounded border border-transparent hover:border-input focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="-"
                    >
                  </td>
                  <td class="border border-border px-2 py-1.5 text-center text-xs" :class="enteredCount(c.id) === judgeCountSafe ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                    {{ enteredCount(c.id) }}/{{ judgeCountSafe }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 实时排名结果 -->
        <div class="bg-card border border-border rounded-lg p-6 print-area">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Trophy class="w-4 h-4 text-primary" /> 实时排名与去极值结果
            </h2>
            <button
              @click="expandAll"
              class="text-xs text-primary hover:underline no-print"
            >{{ allExpanded ? '收起全部明细' : '展开全部明细' }}</button>
          </div>

          <div v-if="scoredCount === 0" class="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
            在上方录入表填入至少 1 位选手的分数，这里将实时计算去极值平均分与排名
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="row in rankedResults"
              :key="row.id"
              class="rounded-lg border border-border bg-muted/30 overflow-hidden"
            >
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span
                  :class="[
                    'w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold',
                    rankBadge(row.rank)
                  ]"
                >{{ row.rank === null ? '-' : row.rank }}</span>
                <span class="font-medium text-foreground min-w-[72px]">{{ row.name || '未命名' }}</span>
                <span class="text-lg font-bold text-primary">{{ row.avgDisplay === null ? '—' : row.avgDisplay }}</span>
                <span class="text-xs text-muted-foreground">{{ decimals }} 位小数有效分均值</span>
                <span v-if="row.entered < judgeCountSafe" class="text-xs text-amber-600 dark:text-amber-400">尚有 {{ judgeCountSafe - row.entered }} 位评委未录</span>
                <span v-if="row.warn" class="text-xs text-amber-600 dark:text-amber-400">{{ row.warn }}</span>
                <button
                  @click="toggleDetail(row.id)"
                  class="ml-auto p-1.5 text-muted-foreground hover:text-foreground transition-colors no-print"
                  :title="expanded[row.id] ? '收起去极值明细' : '展开去极值明细'"
                >
                  <ChevronUp v-if="expanded[row.id]" class="w-4 h-4" />
                  <ChevronDown v-else class="w-4 h-4" />
                </button>
              </div>
              <div v-if="expanded[row.id]" class="px-4 pb-3 pt-1 border-t border-border/60 text-xs space-y-2">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-muted-foreground">全部录入（{{ row.entered }} 个，升序）：</span>
                  <span v-for="(v, i) in row.sortedAll" :key="'a' + i" class="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">{{ v }}</span>
                  <span v-if="row.entered === 0" class="text-muted-foreground">无</span>
                </div>
                <div v-if="row.droppedHigh.length > 0" class="flex flex-wrap items-center gap-1.5">
                  <span class="text-muted-foreground">去掉最高：</span>
                  <span v-for="(v, i) in row.droppedHigh" :key="'h' + i" class="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-mono line-through">{{ v }}</span>
                </div>
                <div v-if="row.droppedLow.length > 0" class="flex flex-wrap items-center gap-1.5">
                  <span class="text-muted-foreground">去掉最低：</span>
                  <span v-for="(v, i) in row.droppedLow" :key="'l' + i" class="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-mono line-through">{{ v }}</span>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-muted-foreground">计入平均的有效分：</span>
                  <span v-for="(v, i) in row.used" :key="'u' + i" class="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-mono">{{ v }}</span>
                  <span v-if="row.used.length === 0" class="text-muted-foreground">无</span>
                </div>
              </div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 no-print">
            计分规则：对每位选手的已录分数排序，去掉最高的 {{ trimHighSafe }} 个与最低的 {{ trimLowSafe }} 个后取算术平均；已录有效分不足 3 个或去极值数超过分数的个数时不去极值并给出提示；全部评委分一致时均值即为该分值。
          </p>
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
          什么是演讲比赛计分器？
        </h2>
        <p class="text-muted-foreground mb-4">
          演讲比赛计分器是一款面向演讲、朗诵、主持、歌咏等评委制比赛的在线计分工具：录入每位选手在各评委处的打分，
          按「去掉最高分与最低分再取平均」的通行规则自动计算有效分均值，实时生成排行榜（并列同名次），
          每位选手的去极值过程明细均可展开核对，并可下载空白评分表用于线下纸质打分。所有计算在本机浏览器完成，不上传任何数据。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">如何使用本工具计分</h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>设置比赛名称、评委人数（3-15）与去极值个数（默认各 1）</li>
          <li>逐个录入选手，选择得分保留 2 位或 3 位小数</li>
          <li>线下场景可先点「下载空白评分表」打印给评委，收回后录入本工具</li>
          <li>在录入表逐格填入各评委打分，结果区实时排名</li>
          <li>点选手行右侧箭头展开去极值明细，核对无误后「打印当前录入表」存档</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">去极值计分公式与边界规则</h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>基本公式</strong>：有效分均值 =（全部录入分升序后，去掉最低 lowMax 个与最高 highMax 个）÷ 剩余个数</li>
          <li><strong>示例</strong>：评委打分 9.5、9、8、8.5、9.2，去 1 高（9.5）去 1 低（8），剩余 8.5、9、9.2，均值 = 26.7 ÷ 3 ≈ 8.90</li>
          <li><strong>并列处理</strong>：按保留小数位后的得分比较，相同则同名次，后续名次顺延（1、1、3 式排名）</li>
          <li><strong>评委少于 3 位</strong>：不去极值，直接取平均并给出提示，避免样本过小时「去头去尾」失去意义</li>
          <li><strong>全部评委分一致</strong>：去掉的分与保留的分相同，均值即该分值，排名正常输出</li>
        </ul>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-lg font-semibold text-foreground">为什么要去掉最高分和最低分？</h4>
            <p class="text-muted-foreground mt-1">
              评委人数较多时，个别评委的偏好或失误会形成离散的极端分。去掉一定数量的最高与最低分后再取平均（截尾均值），
              可显著降低单个极端打分对最终成绩的影响，是各类评委制比赛最常见的公平计分惯例。本工具去极值个数可自由设置。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">下载的空白评分表怎么使用？</h4>
            <p class="text-muted-foreground mt-1">
              「下载空白评分表」会生成一张 .doc 文件（用 Word / WPS 直接打开），内含按当前选手名单与评委人数排好的表格，
              每列一位评委签名打分，附「去掉最高 / 去掉最低 / 最终得分」列。评委现场手填后，主持人把各评委同一选手的分数录入本网格即可自动计分排名。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">评委中途缺打分影响排名吗？</h4>
            <p class="text-muted-foreground mt-1">
              留空即视为未录。计分时只用该选手已录入的分数执行去极值与求平均，并在结果行提示「尚有 n 位评委未录」；
              若已录有效分不足 3 个则自动不去极值。为保证横向可比，建议正式排名前补齐所有选手的分数。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'contest-scoring-calculator'" :category="'calculate'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Trophy, Settings2, Users, Plus, Trash2, FileText, Printer,
  RotateCcw, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '演讲比赛计分器 - 去最高最低分求均值/实时排名',
  description: '在线演讲比赛计分器，录入3-15位评委打分自动去掉最高最低求有效分均值并实时排名，并列同名次，去极值明细可展开核对，支持下载空白评分表(.doc)与打印录入表，纯本地计算',
  keywords: '比赛计分器, 去掉最高分最低分, 评委打分计算, 演讲比赛评分表, 评分系统, 有效分平均分, 空白评分表打印',
  author: 'Util工具箱',
  ogTitle: '演讲比赛计分器 - 有条工具',
  ogDescription: '录入各评委打分自动去最高最低求均值并实时排名，附可打印评分表模板',
  ogUrl: 'https://www.util.cn/tools/contest-scoring-calculator',
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
          name: '演讲比赛计分器',
          url: 'https://www.util.cn/tools/contest-scoring-calculator',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['3-15位评委打分录入', '去极值个数可配', '有效分均值实时排名', '并列同名次', '去极值明细展开', '空白评分表下载(.doc)', '打印录入表']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '演讲比赛计分器', item: 'https://www.util.cn/tools/contest-scoring-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么要去掉最高分和最低分？',
              acceptedAnswer: { '@type': 'Answer', text: '去掉个别评委形成的极端离散分后取截尾均值，可显著降低单个偏好或失误打分的影响，是评委制比赛最常见的公平计分惯例。' }
            },
            {
              '@type': 'Question',
              name: '下载的空白评分表怎么使用？',
              acceptedAnswer: { '@type': 'Answer', text: '生成的 .doc 文件可用 Word/WPS 打开打印，按当前选手与评委数排好表格，评委现场手填后回到本网页逐格录入即可自动计分。' }
            },
            {
              '@type': 'Question',
              name: '评委中途缺打分影响排名吗？',
              acceptedAnswer: { '@type': 'Answer', text: '留空视为未录，只按已录分数去极值求平均并提示未录人数；已录有效分不足3个时自动不去极值。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'contest-scoring-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ===== PURE-BEGIN ===== */
function toScore(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return isFinite(n) ? n : null
}

// 截尾均值：升序后去掉最低 lowCount 个与最高 highCount 个
// 返回 { sortedAll, used, droppedLow, droppedHigh, avg, warn }
function trimMean(values, highCount, lowCount) {
  const nums = values.map(toScore).filter(v => v !== null).sort((a, b) => a - b)
  const n = nums.length
  const high = Math.max(0, Math.round(Number(highCount) || 0))
  const low = Math.max(0, Math.round(Number(lowCount) || 0))
  if (n === 0) {
    return { sortedAll: [], used: [], droppedLow: [], droppedHigh: [], avg: null, warn: '未录入任何分数' }
  }
  if (n < 3 || high + low >= n) {
    const avg = nums.reduce((a, b) => a + b, 0) / n
    const warn = n < 3 ? '有效分不足 3 个，未去极值' : '去极值个数已达分数个数，未去极值'
    return { sortedAll: nums.slice(), used: nums.slice(), droppedLow: [], droppedHigh: [], avg, warn }
  }
  const droppedLow = nums.slice(0, low)
  const droppedHigh = nums.slice(n - high)
  const used = nums.slice(low, n - high)
  const avg = used.reduce((a, b) => a + b, 0) / used.length
  return { sortedAll: nums.slice(), used, droppedLow, droppedHigh, avg, warn: '' }
}

// 排名：按保留 decimals 位后的得分降序，相同并列同名次，名次顺延（1,1,3 式）
function rankContestants(items, decimals) {
  const scored = items.filter(x => x.avg !== null)
  scored.sort((a, b) => b.avg - a.avg)
  let prevKey = null
  let prevRank = 0
  scored.forEach((x, idx) => {
    const key = x.avg.toFixed(decimals)
    if (prevKey === null || key !== prevKey) {
      x.rank = idx + 1
      prevRank = x.rank
    } else {
      x.rank = prevRank
    }
    prevKey = key
  })
  items.forEach(x => {
    if (x.avg === null) x.rank = null
  })
  return items
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 空白评分表 HTML（保存为 .doc，Word/WPS 可直接打开）
function buildBlankSheetHtml(title, names, judges) {
  const head = '<meta charset="utf-8"><title>' + escapeHtml(title) + '</title>' +
    '<style>body{font-family:"Microsoft YaHei",SimSun,sans-serif}' +
    'h2{text-align:center}' +
    'table{border-collapse:collapse;width:100%;margin-top:12px}' +
    'th,td{border:1px solid #333;padding:6px 8px;font-size:12pt;text-align:center}' +
    'td.blank{height:30px}' +
    'p.note{font-size:10.5pt;color:#555}</style>'
  let ths = '<th>编号</th><th>选手姓名</th>'
  for (let j = 1; j <= judges; j++) ths += '<th>评委' + j + '</th>'
  ths += '<th>去掉最高</th><th>去掉最低</th><th>最终得分</th><th>评委签名</th>'
  let body = ''
  for (let i = 0; i < names.length; i++) {
    let tds = '<td>' + (i + 1) + '</td><td>' + escapeHtml(names[i]) + '</td>'
    for (let j = 0; j < judges; j++) tds += '<td class="blank">&nbsp;</td>'
    tds += '<td class="blank">&nbsp;</td><td class="blank">&nbsp;</td><td class="blank">&nbsp;</td><td class="blank">&nbsp;</td>'
    body += '<tr>' + tds + '</tr>'
  }
  return '<html><head>' + head + '</head><body>' +
    '<h2>' + escapeHtml(title || '评委打分表') + '</h2>' +
    '<p class="note">计分规则：去掉最高分与最低分后取平均（各评委请按 0-100 独立填写本表）。</p>' +
    '<table><thead><tr>' + ths + '</tr></thead><tbody>' + body + '</tbody></table>' +
    '</body></html>'
}
/* ===== PURE-END ===== */

// ---------- 状态 ----------
const contestName = ref('校园演讲比赛')
const judgeCount = ref(5)
const trimHigh = ref(1)
const trimLow = ref(1)
const decimals = ref(2)
const contestants = ref([
  { id: 1, name: '选手1' },
  { id: 2, name: '选手2' },
  { id: 3, name: '选手3' },
  { id: 4, name: '选手4' }
])
let cidSeed = 5
const scores = ref({})
const expanded = ref({})
const isSeoContentVisible = ref(true)

// ---------- 派生 ----------
const judgeCountSafe = computed(() => {
  const n = Math.round(Number(judgeCount.value))
  if (!isFinite(n) || n < 1) return 1
  return Math.min(15, n)
})
const trimHighSafe = computed(() => Math.max(0, Math.round(Number(trimHigh.value) || 0)))
const trimLowSafe = computed(() => Math.max(0, Math.round(Number(trimLow.value) || 0)))
const judgeIdxs = computed(() => {
  const arr = []
  for (let j = 0; j < judgeCountSafe.value; j++) arr.push(j)
  return arr
})

const scoreKey = (cid, j) => cid + '|' + j

const enteredCount = (cid) => {
  let n = 0
  for (let j = 0; j < judgeCountSafe.value; j++) {
    if (toScore(scores.value[scoreKey(cid, j)]) !== null) n++
  }
  return n
}

const resultsBase = computed(() => contestants.value.map(c => {
  const vals = []
  for (let j = 0; j < judgeCountSafe.value; j++) {
    const v = toScore(scores.value[scoreKey(c.id, j)])
    if (v !== null) vals.push(v)
  }
  const t = trimMean(vals, trimHighSafe.value, trimLowSafe.value)
  return {
    id: c.id,
    name: c.name,
    entered: vals.length,
    avg: t.avg,
    sortedAll: t.sortedAll,
    used: t.used,
    droppedLow: t.droppedLow,
    droppedHigh: t.droppedHigh,
    warn: t.warn,
    rank: null
  }
}))

const scoredCount = computed(() => resultsBase.value.filter(r => r.avg !== null).length)

const rankedResults = computed(() => {
  const cloned = resultsBase.value.map(r => ({ ...r }))
  rankContestants(cloned, decimals.value)
  cloned.sort((a, b) => {
    if (a.rank === null && b.rank === null) return 0
    if (a.rank === null) return 1
    if (b.rank === null) return -1
    return a.rank - b.rank
  })
  return cloned.map(r => ({
    ...r,
    avgDisplay: r.avg === null ? null : r.avg.toFixed(decimals.value)
  }))
})

const allExpanded = computed(() => contestants.value.length > 0 && contestants.value.every(c => !!expanded.value[c.id]))

// ---------- 交互 ----------
const rankBadge = (rank) => {
  if (rank === 1) return 'bg-amber-100 text-amber-700'
  if (rank === 2) return 'bg-slate-200 text-slate-700'
  if (rank === 3) return 'bg-orange-100 text-orange-700'
  if (rank === null) return 'bg-muted text-muted-foreground'
  return 'bg-muted text-foreground'
}

const addContestant = () => {
  contestants.value = [...contestants.value, { id: cidSeed++, name: `选手${contestants.value.length + 1}` }]
}
const removeContestant = (id) => {
  if (contestants.value.length <= 1) return
  contestants.value = contestants.value.filter(c => c.id !== id)
  const next = {}
  Object.keys(scores.value).forEach(k => {
    if (!k.startsWith(id + '|')) next[k] = scores.value[k]
  })
  scores.value = next
}
const clearScores = () => {
  scores.value = {}
  expanded.value = {}
}
const toggleDetail = (id) => {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
}
const expandAll = () => {
  if (allExpanded.value) {
    expanded.value = {}
  } else {
    const next = {}
    contestants.value.forEach(c => { next[c.id] = true })
    expanded.value = next
  }
}

// ---------- 下载与打印 ----------
const downloadBlankSheet = () => {
  const names = contestants.value.map((c, i) => c.name || `选手${i + 1}`)
  const html = buildBlankSheetHtml(contestName.value || '评委打分表', names, judgeCountSafe.value)
  const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  link.download = '空白评分表_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.doc'
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

const printAll = () => {
  window.print()
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
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
  .print-only {
    display: block;
  }
  .print-area {
    overflow: visible !important;
    break-inside: avoid;
  }
}
</style>
