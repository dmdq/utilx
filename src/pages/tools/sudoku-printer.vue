<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Grid class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">数独打印生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">生成唯一解数独题目，A4 排版直接打印，支持种子复现与答案页，老师组卷家长陪练必备</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线数独打印工具：一键生成经过唯一解校验的数独题目，按 A4 版式直接打印。支持简单 / 中等 / 困难 / 专家四档难度、每页 1 / 2 / 4 题组卷、
        中心对称挖洞的经典盘面美学，可选答案页与候选数提示说明；填写种子即可复现同一份练习卷，方便老师统一发题对答案。
        生成与求解全部在浏览器本地完成，不上传任何数据，还可复制每题一行 81 字符的标准文本格式跨软件使用。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：生成设置 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <Grid class="w-5 h-5 mr-2 text-primary" /> 生成设置
        </h2>

        <div>
          <label for="sudoku-difficulty" class="block text-sm font-medium text-foreground mb-2">难度</label>
          <select
            id="sudoku-difficulty"
            v-model="difficulty"
            class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="d in difficultyOptions" :key="d.key" :value="d.key">{{ d.label }}（挖去 {{ d.holes }} 格）</option>
          </select>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground mb-2">每页几题</p>
          <div class="grid grid-cols-3 gap-2" role="group" aria-label="每页几题">
            <button
              v-for="n in perPageOptions"
              :key="n"
              @click="perPage = n"
              class="px-3 py-2 rounded-lg text-sm font-medium border transition"
              :class="perPage === n ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground border-border'"
            >
              {{ n }} 题/页
            </button>
          </div>
        </div>

        <div>
          <label for="sudoku-seed" class="block text-sm font-medium text-foreground mb-2">种子（可选，复现同一份卷）</label>
          <input
            id="sudoku-seed"
            v-model="seedInput"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="留空则随机，如 2026 或 my-class-a"
          />
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            本局种子：<span class="font-mono text-foreground">{{ activeSeed === null ? '—' : activeSeed }}</span>
            · 相同种子 + 相同难度 + 相同题数 = 完全相同的题目，适合老师统一出卷与对答案。
          </p>
        </div>

        <div class="space-y-2.5 pt-1">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">答案页（附完整解答）</span>
            <input v-model="showAnswers" type="checkbox" class="w-4 h-4" />
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">候选数提示说明</span>
            <input v-model="showHintNote" type="checkbox" class="w-4 h-4" />
          </label>
          <p class="text-[11px] text-muted-foreground leading-relaxed pl-0.5">
            候选数提示为卷面说明文字（教做题时如何铅笔标注），不会在谜题格里自动显示候选数字。
          </p>
        </div>

        <button
          @click="generatePuzzles"
          :disabled="generating"
          class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" :class="{ 'animate-spin': generating }" />
          {{ generating ? '生成中…' : '重新生成' }}
        </button>

        <p
          v-if="generating"
          class="text-xs leading-relaxed p-2.5 rounded bg-primary/10 text-foreground flex items-start gap-1.5"
        >
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>正在生成唯一解题目，专家难度可能需要 1-2 秒，请稍候。</span>
        </p>
        <p
          v-else-if="anyLimitReached"
          class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
          <span>第 {{ limitIndexes.join('、') }} 题挖洞 {{ underDugText }} 格、未达目标 {{ targetHoles }} 格（该局挖洞略少于目标难度，线索略多、题面偏易）；点「重新生成」可再试一次。</span>
        </p>
        <p
          v-else-if="puzzles.length"
          class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-foreground flex items-start gap-1.5"
        >
          <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-500" />
          <span>已生成 {{ puzzles.length }} 题唯一解数独（挖洞 {{ dugSummary }} 格），均通过回溯求解器唯一解校验。</span>
        </p>

        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>挖洞数是难度的粗略口径（简单 38 / 中等 46 / 困难 54 / 专家 58），并非严格难度评级；为保证唯一解，个别题目挖洞可能略少于目标。</span>
        </p>
      </div>

      <!-- 右：A4 预览 -->
      <div class="lg:col-span-2">
        <div class="no-print flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> A4 打印预览
          </h2>
          <div class="flex items-center gap-2">
            <button
              @click="copyPuzzleText"
              :disabled="generating || !puzzles.length"
              class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle v-if="copied" class="w-4 h-4 text-green-500" />
              {{ copied ? '已复制' : '复制文本版' }}
            </button>
            <button
              @click="printSheet"
              :disabled="generating || !puzzles.length"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印 / 另存 PDF
            </button>
          </div>
        </div>

        <template v-if="puzzles.length">
          <!-- 题目页 -->
          <div class="a4-paper" :class="[layoutClass, showAnswers ? 'print-page-break' : '']">
            <div :class="perPage === 4 ? 'sheet-body-grid' : 'sheet-body'">
              <div v-for="(p, i) in puzzles" :key="'p-' + activeSeed + '-' + i" class="puzzle-block">
                <p class="puzzle-header">数独练习 · 难度：{{ difficultyLabel }} · 第 {{ i + 1 }}/{{ puzzles.length }} 题</p>
                <div class="sudoku-board" :class="boardSizeClass">
                  <div
                    v-for="cell in boardCells(p.puzzle)"
                    :key="cell.id"
                    class="sudoku-cell"
                    :class="sudokuCellClass(cell, false)"
                  >
                    <span v-if="cell.v">{{ cell.v }}</span>
                  </div>
                </div>
                <p v-if="showHintNote" class="hint-note">
                  提示：把空格可能填入的数字用铅笔小字标在格内（候选数标注），优先填只有一种可能的格子。
                </p>
              </div>
            </div>
          </div>

          <!-- 答案页 -->
          <template v-if="showAnswers">
            <p class="no-print text-xs text-muted-foreground mb-1.5 flex items-center justify-center gap-1">
              <Eye class="w-3.5 h-3.5" /> 答案页预览（灰色数字为题目给定，黑色为解答填入）
            </p>
            <div class="a4-paper" :class="layoutClass">
              <div :class="perPage === 4 ? 'sheet-body-grid' : 'sheet-body'">
                <div v-for="(p, i) in puzzles" :key="'a-' + activeSeed + '-' + i" class="puzzle-block">
                  <p class="puzzle-header">数独答案 · 难度：{{ difficultyLabel }} · 第 {{ i + 1 }}/{{ puzzles.length }} 题</p>
                  <div class="sudoku-board" :class="boardSizeClass">
                    <div
                      v-for="cell in boardCells(p.solution)"
                      :key="cell.id + 81"
                      class="sudoku-cell"
                      :class="sudokuCellClass(cell, p.puzzle[cell.r][cell.c] !== 0)"
                    >
                      <span v-if="cell.v">{{ cell.v }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>

        <div v-else class="bg-card border border-dashed border-border rounded-lg p-12 text-center">
          <Play class="w-10 h-10 text-primary/40 mx-auto mb-3" />
          <p class="text-sm font-medium text-foreground">{{ generating ? '生成中…' : '尚无题目' }}</p>
          <p class="text-xs text-muted-foreground mt-1">
            {{ generating ? '正在生成唯一解数独，专家难度可能需要 1-2 秒' : '点击左侧「重新生成」立即生成一份数独练习卷' }}
          </p>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          说明：打印或另存 PDF 时会隐藏设置与按钮，仅输出题目{{ showAnswers ? '与答案页' : '' }}，每题带独立页眉并居中排版；
          「复制文本版」为每题一行 81 字符（0 表空格）的标准跨平台格式，可直接导入其他数独软件。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>数独打印生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          数独打印生成器是一款纯本地运行的在线数独工具（数独生成器 + 打印排版二合一）。它先用随机化回溯生成一个完整终盘，
          再按难度挖去对应数量的格子——默认按中心对称成对挖洞（标准数独的美学惯例），每挖一格都用回溯求解器校验唯一解，不唯一就回填换下一格，
          因此每道题都保证「有且仅有一个答案」。页面右侧即时呈现 A4 排版预览：每题带独立页眉（难度与题号）、粗细线 9×9 盘面，
          可选答案页对照。支持四档难度、每页 1 / 2 / 4 题组卷、种子复现同一份卷，还能把题目复制成每题一行 81 字符的标准文本格式，
          导入其他数独软件或存档复用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">数独规则（30 秒入门）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          在 9×9 盘面中填入 1-9：每一行、每一列、每个 3×3 宫（粗线框出的九宫）内，数字 1-9 都必须恰好出现一次，不能重复。
          题目预先给出部分数字作为线索，其余空格由做题者依据行列宫的排除与推理逐一填满。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">难度怎么划分？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具以「挖洞数」作为难度口径：简单挖去 38 格、中等 46 格、困难 54 格、专家 58 格，挖得越多线索越少、难度越高。
          需要诚实说明的是：挖洞数只是粗略口径，并非严格难度评级——同样挖洞数的题目，实际解题手感也会不同，因为真正的难度取决于
          解题所需技巧（唯一候选、区块排除、数对/三链数等）而非单纯空格数量；本工具并未按解题技巧评级。介意手感的用户可以多生成几份挑选。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么必须唯一解？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          唯一解是一道合格数独题的底线：只有答案唯一，做题者才能确信「每个空格都能靠逻辑推出来」，而不需要靠猜；
          打印的答案页也才有核对意义。本工具每挖一对格子都会重新跑一遍求解器，一旦发现出现第二种解法就立即回填，
          换下一位置继续尝试，直到挖够目标格数或遍历完全部候选位置。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">儿童从哪个难度开始？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          学龄前与小学低年级建议从 4×4、六宫格这类小盘数独入门（对推理要求低、成就感来得快，未来版本计划支持，本版提供标准 9×9）；
          刚接触 9×9 的孩子请从「简单」档开始——每题保留 43 个提示数字，观察行列即可完成大部分推理。陪练时先示范
          「这一行还缺哪个数」「这个宫里 3 能放哪」这类提问，不要急着教铅笔标候选数，等孩子卡关了再引入。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">打印纸张与使用建议</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          按 A4 纵向排版：每页 1 题盘面最大（约 15 cm 见方），适合低龄儿童、视力不佳者或把演算写在格内的练法；
          每页 2 题大小适中，适合日常练习；每页 4 题适合一次一组或班级批量分发。建议使用 70g 及以上的纸单面打印，
          便于铅笔演算与擦改；教室批量打印可选「经济/草稿」墨量，线条与数字依然清晰。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">答案页怎么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          开启「答案页」后，打印内容会在题目页之后追加完整解答页：解答中题目原本给定的数字以灰色显示、解答填入的数字为黑色，方便快速对照。
          建议家长 / 老师单独保管答案页，或选择「双面打印」把答案印在题目背面；也可以只勾选答案页预览、用「复制文本版」把题面发给他人自行求解。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的数独题目是唯一解吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">是。每挖去一对格子都会用回溯求解器重新校验，一旦出现第二种解法就回填换位；若触发防卡死的挖洞节点上限，会保留当前谜题并在页面注明「该局挖洞略少于目标难度」，宁可题难略低也不牺牲唯一解。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">同一个种子能复现同一份卷子吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">能。生成过程完全确定性：相同种子 + 相同难度 + 相同题数会得到完全相同的题目与答案，适合老师统一出卷、前后批次对答案；种子留空则每次随机出一卷新题。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印时只输出题目吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">是。打印样式会隐藏设置与按钮，按 A4 纵向输出，每题独立页眉居中排版；开启答案页后会在题目页后追加解答页（给定格灰色区分）。每页 1 / 2 / 4 题对应不同盘面大小，可按需选择。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'sudoku-printer'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Grid, Printer, RefreshCw, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, Play, Eye
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '数独打印生成器 - 免费在线数独题目生成与A4打印（唯一解）',
  description: '免费在线数独生成器：一键生成唯一解数独题目并按 A4 排版直接打印，简单/中等/困难/专家四档难度，每页 1/2/4 题组卷，支持种子复现同一份练习卷、答案页对照与 81 字符标准文本导出，纯浏览器本地运行，儿童与教师打印练习必备',
  keywords: '数独打印,数独生成器,免费数独,数独题目下载,儿童数独',
  author: '有条工具',
  ogTitle: '数独打印生成器 - 在线数独题目生成与打印 | 有条工具',
  ogDescription: '生成唯一解数独题目，A4 排版直接打印，种子可复现，附答案页对照。',
  ogUrl: 'https://www.util.cn/tools/sudoku-printer',
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
          name: '数独打印生成器',
          url: 'https://www.util.cn/tools/sudoku-printer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['四档难度唯一解数独生成', '中心对称挖洞经典盘面', 'A4 打印排版每页 1/2/4 题', '种子复现同一份练习卷', '答案页灰色给定数字对照', '81 字符标准文本导出', '纯本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '数独打印生成器', item: 'https://www.util.cn/tools/sudoku-printer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的数独题目是唯一解吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是。每挖去一对格子都会用回溯求解器重新校验，一旦出现第二种解法就回填换位；若触发防卡死的挖洞节点上限，会保留当前谜题并在页面注明该局挖洞略少于目标难度，宁可题难略低也不牺牲唯一解。' }
            },
            {
              '@type': 'Question',
              name: '同一个种子能复现同一份卷子吗？',
              acceptedAnswer: { '@type': 'Answer', text: '能。生成过程完全确定性：相同种子加相同难度和相同题数会得到完全相同的题目与答案，适合老师统一出卷、前后批次对答案；种子留空则每次随机出一卷新题。' }
            },
            {
              '@type': 'Question',
              name: '打印时只输出题目吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是。打印样式会隐藏设置与按钮，按 A4 纵向输出，每题独立页眉居中排版；开启答案页后会在题目页后追加解答页（给定格灰色区分），每页 1/2/4 题对应不同盘面大小。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 以下函数全部为确定性纯函数：随机性只来自传入的 mulberry32 风格 rng（调用返回 [0,1)），
// 不依赖 Date / Math.random / DOM，可在 Node 环境中直接单测。

const SUDOKU_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const FULL_MASK = 0b1111111110 // 数字 1~9 各占一位（bit1..bit9）

// mulberry32：轻量确定性 PRNG，种子为 uint32
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 种子解析：纯数字字符串直接取 uint32，其他字符串做 djb2 哈希；空值返回 null（表示随机出卷）
function seedFromString(text) {
  const s = String(text == null ? '' : text).trim()
  if (s === '') return null
  if (/^-?\d{1,10}$/.test(s)) return Number(s) >>> 0
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h >>> 0
}

// Fisher-Yates 洗牌（不修改原数组，返回新数组）
function shuffleWithRng(list, rng) {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

// 候选位掩码 → 数字数组（升序）
function maskToDigits(mask) {
  const out = []
  let m = mask
  while (m) {
    const bit = m & -m
    m ^= bit
    out.push(31 - Math.clz32(bit))
  }
  return out
}

// 0..1023 的位计数表
const POPCOUNT = new Uint8Array(1024)
for (let i = 1; i < 1024; i++) POPCOUNT[i] = POPCOUNT[i >> 1] + (i & 1)

// 挖洞阶段共享的回溯节点预算上限（防卡死护栏：超限即停止挖洞，返回当前已有谜题；
// 实测专家档深挖的单次唯一解校验可达数千节点，取 120000 兼顾深度与 4 题总耗时约 1 秒）
const DEFAULT_MAX_DIG_NODES = 120000

// 回溯求解器（位掩码 + 最少候选格 MRV）。solutions 最多枚举 2 个即停，用于唯一解校验。
// options.budget = { used, maxNodes } 可选：跨多次调用共享节点预算，超限中止（返回 aborted: true）。
function solveSudoku(grid, options) {
  const budget = options && options.budget ? options.budget : null
  const board = grid.map((row) => row.slice())
  const rows = new Array(9).fill(0)
  const cols = new Array(9).fill(0)
  const boxes = new Array(9).fill(0)
  let aborted = false

  // 校验并登记给定数字
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c] | 0
      if (!v) continue
      if (v < 1 || v > 9) return { solutions: 0, solution: null, aborted: false, nodes: 0 }
      const bit = 1 << v
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3)
      if (rows[r] & bit || cols[c] & bit || boxes[b] & bit) {
        return { solutions: 0, solution: null, aborted: false, nodes: 0 } // 给定数字互相冲突
      }
      rows[r] |= bit
      cols[c] |= bit
      boxes[b] |= bit
    }
  }

  let solutions = 0
  let first = null

  function backtrack() {
    if (solutions >= 2) return
    if (budget) {
      budget.used += 1
      if (budget.used > budget.maxNodes) {
        aborted = true
        return
      }
    }
    // MRV：找候选数字最少的空格
    let bestR = -1
    let bestC = -1
    let bestMask = 0
    let bestCount = 10
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c]) continue
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3)
        const mask = FULL_MASK & ~(rows[r] | cols[c] | boxes[b])
        const cnt = POPCOUNT[mask]
        if (cnt === 0) return // 有空格无数可填，剪枝
        if (cnt < bestCount) {
          bestCount = cnt
          bestR = r
          bestC = c
          bestMask = mask
        }
      }
    }
    if (bestR === -1) {
      solutions += 1
      if (!first) first = board.map((row) => row.slice())
      return
    }
    const b = Math.floor(bestR / 3) * 3 + Math.floor(bestC / 3)
    let mask = bestMask
    while (mask) {
      const bit = mask & -mask
      mask ^= bit
      const v = 31 - Math.clz32(bit)
      board[bestR][bestC] = v
      rows[bestR] |= bit
      cols[bestC] |= bit
      boxes[b] |= bit
      backtrack()
      board[bestR][bestC] = 0
      rows[bestR] ^= bit
      cols[bestC] ^= bit
      boxes[b] ^= bit
      if (solutions >= 2 || aborted) return
    }
  }

  backtrack()
  return { solutions, solution: first, aborted, nodes: budget ? budget.used : 0 }
}

// 生成完整终盘：对角三个 3×3 宫先随机填入，再用「随机化候选顺序 + MRV」回溯补全
function generateSolved(rng) {
  const board = Array.from({ length: 9 }, () => new Array(9).fill(0))
  const rows = new Array(9).fill(0)
  const cols = new Array(9).fill(0)
  const boxes = new Array(9).fill(0)

  for (const b of [0, 4, 8]) {
    const digits = shuffleWithRng(SUDOKU_DIGITS, rng)
    const br = Math.floor(b / 3) * 3
    const bc = (b % 3) * 3
    let k = 0
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const v = digits[k]
        k += 1
        board[br + r][bc + c] = v
        rows[br + r] |= 1 << v
        cols[bc + c] |= 1 << v
        boxes[b] |= 1 << v
      }
    }
  }

  function fill() {
    let bestR = -1
    let bestC = -1
    let bestMask = 0
    let bestCount = 10
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c]) continue
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3)
        const mask = FULL_MASK & ~(rows[r] | cols[c] | boxes[b])
        const cnt = POPCOUNT[mask]
        if (cnt === 0) return false
        if (cnt < bestCount) {
          bestCount = cnt
          bestR = r
          bestC = c
          bestMask = mask
        }
      }
    }
    if (bestR === -1) return true
    const order = shuffleWithRng(maskToDigits(bestMask), rng)
    const b = Math.floor(bestR / 3) * 3 + Math.floor(bestC / 3)
    for (const v of order) {
      const bit = 1 << v
      board[bestR][bestC] = v
      rows[bestR] |= bit
      cols[bestC] |= bit
      boxes[b] |= bit
      if (fill()) return true
      board[bestR][bestC] = 0
      rows[bestR] ^= bit
      cols[bestC] ^= bit
      boxes[b] ^= bit
    }
    return false
  }

  fill() // 对角宫预填后必有解
  return board
}

// 难度四档 ↔ 挖洞数（粗略口径，非严格难度评级）
const DIFFICULTIES = [
  { key: 'easy', label: '简单', holes: 38 },
  { key: 'medium', label: '中等', holes: 46 },
  { key: 'hard', label: '困难', holes: 54 },
  { key: 'expert', label: '专家', holes: 58 }
]

function holesOfDifficulty(key) {
  const d = DIFFICULTIES.find((d) => d.key === key)
  return d ? d.holes : 46
}

function difficultyOf(holes) {
  if (holes <= 38) return '简单'
  if (holes <= 46) return '中等'
  if (holes <= 54) return '困难'
  return '专家'
}

// 从终盘挖洞生成谜题：中心对称成对挖（标准数独美学），每挖一对用 solveSudoku 校验唯一解，
// 不唯一则回填该对并尝试下一候选；停滞时做有限次「换穴脱困」（回填一个已挖对、替换挖一个未挖对）
// 以跳出局部最优。挖够目标、彻底停滞或节点预算耗尽即停。
// 返回 { puzzle, dug, complete, limitReached, nodes }。
function digHoles(solution, holes, rng, options) {
  const maxNodes = options && Number.isFinite(options.maxNodes) ? options.maxNodes : DEFAULT_MAX_DIG_NODES
  const budget = { used: 0, maxNodes }
  const puzzle = solution.map((row) => row.slice())
  const need = Math.max(0, Math.min(81, Math.floor(holes)))
  let dug = 0
  let limitReached = false
  const dugPairs = [] // 当前已挖去的对称对（pair 索引 0..39）

  const cellOf = (p) => {
    const r = Math.floor(p / 9)
    const c = p % 9
    return { r, c, r2: 8 - r, c2: 8 - c }
  }

  // 尝试挖去对称对 p：唯一解成立则保留，否则回填；预算耗尽标记 limitReached
  function tryDigPair(p) {
    const { r, c, r2, c2 } = cellOf(p)
    const va = puzzle[r][c]
    const vb = puzzle[r2][c2]
    if (!va || !vb) return false
    puzzle[r][c] = 0
    puzzle[r2][c2] = 0
    const res = solveSudoku(puzzle, { budget })
    if (res.aborted) {
      puzzle[r][c] = va
      puzzle[r2][c2] = vb
      limitReached = true
      return false
    }
    if (res.solutions === 1) {
      dug += 2
      dugPairs.push(p)
      return true
    }
    puzzle[r][c] = va
    puzzle[r2][c2] = vb
    return false
  }

  // 换穴脱困：回填一个已挖对 q，替换挖一个未挖对 p（挖洞总数不变，改变空格分布以跳出局部最优）
  const MAX_SWAP_TRIES = 24
  function swapEscape(remaining) {
    if (!dugPairs.length || !remaining.length) return false
    for (let t = 0; t < MAX_SWAP_TRIES && !limitReached; t++) {
      const q = dugPairs[Math.floor(rng() * dugPairs.length)]
      const p = remaining[Math.floor(rng() * remaining.length)]
      if (p === q) continue
      // 回填 q
      const qc = cellOf(q)
      puzzle[qc.r][qc.c] = solution[qc.r][qc.c]
      puzzle[qc.r2][qc.c2] = solution[qc.r2][qc.c2]
      dugPairs.splice(dugPairs.indexOf(q), 1)
      dug -= 2
      // 尝试改挖 p
      const ok = tryDigPair(p)
      if (limitReached) {
        // 预算耗尽：恢复到交换前的盘面（p 已被 tryDigPair 回填，这里重新挖开 q，不再校验）
        const cur = cellOf(q)
        puzzle[cur.r][cur.c] = 0
        puzzle[cur.r2][cur.c2] = 0
        dug += 2
        dugPairs.push(q)
        return false
      }
      if (ok) {
        remaining.splice(remaining.indexOf(p), 1)
        remaining.push(q)
        return true
      }
      // 失败：p 已被回填，重新挖开 q 恢复原状
      const cur = cellOf(q)
      puzzle[cur.r][cur.c] = 0
      puzzle[cur.r2][cur.c2] = 0
      dug += 2
      dugPairs.push(q)
    }
    return false
  }

  // 奇数目标：先尝试挖中心格（中心格自身即一个对称单元）
  if (need % 2 === 1 && puzzle[4][4] !== 0) {
    const saved = puzzle[4][4]
    puzzle[4][4] = 0
    const res = solveSudoku(puzzle, { budget })
    if (res.aborted) {
      puzzle[4][4] = saved
      limitReached = true
    } else if (res.solutions === 1) {
      dug += 1
    } else {
      puzzle[4][4] = saved
    }
  }

  // 主循环：整轮洗牌遍历候选对；一轮有进展则继续，停滞则换穴脱困，彻底停滞或预算耗尽即止
  let remaining = Array.from({ length: 40 }, (_, i) => i)
  while (dug < need && !limitReached) {
    if (remaining.length) {
      const order = shuffleWithRng(remaining, rng)
      remaining = []
      let progressed = false
      for (const p of order) {
        if (dug >= need || limitReached) break
        const ok = tryDigPair(p)
        if (limitReached) break
        if (ok) progressed = true
        else remaining.push(p)
      }
      if (limitReached) break
      if (progressed) continue
    }
    if (dug >= need) break
    if (!swapEscape(remaining)) break
  }

  return { puzzle, dug, complete: dug >= need, limitReached, nodes: budget.used }
}

// 谜题转标准文本：单行 81 字符，空格以 0 表示（跨平台通用格式）
function puzzleToText(puzzle) {
  let out = ''
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = puzzle[r][c] | 0
      out += v >= 1 && v <= 9 ? String(v) : '0'
    }
  }
  return out
}

// 由种子批量生成一组「谜题 + 答案」：同一种子 + 同一参数 → 完全相同的结果（可复现）
function buildPuzzleSet(seedBase, difficultyKey, count, options) {
  const holes = holesOfDifficulty(difficultyKey)
  const list = []
  for (let i = 0; i < count; i++) {
    const rng = mulberry32((seedBase + Math.imul(i + 1, 0x9e3779b9)) >>> 0)
    const solution = generateSolved(rng)
    const dig = digHoles(solution, holes, rng, options)
    list.push({
      solution,
      puzzle: dig.puzzle,
      dug: dig.dug,
      complete: dig.complete,
      limitReached: dig.limitReached,
      nodes: dig.nodes,
      text: puzzleToText(dig.puzzle)
    })
  }
  return list
}

// 9×9 棋盘展平为 81 个格子，供模板渲染
function boardCells(puzzle) {
  const cells = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cells.push({ id: r * 9 + c, r, c, v: puzzle[r][c] | 0 })
    }
  }
  return cells
}

// 格子边框类：3×3 宫界为粗线，最外圈交给棋盘容器；givenInPuzzle 用于答案页给定格置灰
function sudokuCellClass(cell, givenInPuzzle) {
  return {
    'cell-bold-r': cell.c === 2 || cell.c === 5,
    'cell-bold-b': cell.r === 2 || cell.r === 5,
    'cell-end-r': cell.c === 8,
    'cell-end-b': cell.r === 8,
    'cell-given-gray': !!givenInPuzzle
  }
}

// ---------- 页面状态 ----------
const difficultyOptions = DIFFICULTIES.map((d) => ({ key: d.key, label: d.label, holes: d.holes }))
const perPageOptions = [1, 2, 4]

const difficulty = ref('medium')
const perPage = ref(2)
const showHintNote = ref(false)
const showAnswers = ref(true)
const seedInput = ref('')
const activeSeed = ref(null)
const puzzles = ref([])
const generating = ref(false)
const copied = ref(false)
const seoContentVisible = ref(true)

const difficultyLabel = computed(() => {
  const d = DIFFICULTIES.find((d) => d.key === difficulty.value)
  return d ? d.label : '中等'
})
const targetHoles = computed(() => holesOfDifficulty(difficulty.value))
const layoutClass = computed(() => 'sheet-layout-' + perPage.value)
const boardSizeClass = computed(() => 'board-size-' + perPage.value)
const limitIndexes = computed(() =>
  puzzles.value.reduce((acc, p, i) => {
    if (!p.complete) acc.push(i + 1)
    return acc
  }, [])
)
const anyLimitReached = computed(() => limitIndexes.value.length > 0)
const underDugText = computed(() =>
  limitIndexes.value.map((i) => puzzles.value[i - 1].dug).join(' / ')
)
const dugSummary = computed(() => puzzles.value.map((p) => p.dug).join(' / '))

// ---------- 生成 / 打印 / 复制（浏览器回调，SSR 安全） ----------
let copyTimer = null
let printStyleEl = null

function randomSeedUint32() {
  return Math.floor(Math.random() * 4294967296) >>> 0
}

function generatePuzzles() {
  if (generating.value) return
  generating.value = true
  copied.value = false
  // 先让「生成中…」状态渲染出来，再一次性同步生成（专家 4 题最坏约 1-2 秒）
  setTimeout(() => {
    const parsed = seedFromString(seedInput.value)
    const base = parsed === null ? randomSeedUint32() : parsed
    activeSeed.value = base
    puzzles.value = buildPuzzleSet(base, difficulty.value, perPage.value)
    generating.value = false
  }, 40)
}

function printSheet() {
  if (!generating.value && puzzles.value.length) window.print()
}

async function copyPuzzleText() {
  if (generating.value || !puzzles.value.length) return
  const text = puzzles.value.map((p) => p.text).join('\n')
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
      copyTimer = null
    }, 2000)
  } catch (e) {
    copied.value = false
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// 切换难度 / 每页题数时自动重出卷（种子不变则同设置可复现）
watch([difficulty, perPage], () => {
  generatePuzzles()
})

onMounted(() => {
  // 动态注入全局打印样式：@page A4 纵向 + 隐藏站点头尾（@page 不能写在 scoped 样式里）
  if (typeof document !== 'undefined') {
    printStyleEl = document.createElement('style')
    printStyleEl.setAttribute('data-print-style', 'sudoku-printer')
    printStyleEl.textContent = [
      '@media print {',
      '  @page { size: A4 portrait; margin: 12mm; }',
      '  header, aside, footer, nav, .no-print { display: none !important; }',
      '  main { padding: 0 !important; }',
      '}'
    ].join('\n')
    document.head.appendChild(printStyleEl)
  }
  addRecentTool('sudoku-printer')
  generatePuzzles()
})

onBeforeUnmount(() => {
  if (printStyleEl && printStyleEl.parentNode) {
    printStyleEl.parentNode.removeChild(printStyleEl)
  }
  printStyleEl = null
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})
</script>

<style scoped>
/* 屏显 A4 纸张 */
.a4-paper {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 24px;
  padding: 26px 30px;
  background: #fff;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  aspect-ratio: 210 / 297;
}

.sheet-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 10px;
}

.sheet-body-grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-content: space-evenly;
  gap: 10px 22px;
}

.puzzle-block {
  text-align: center;
  min-width: 0;
}

.puzzle-header {
  font-size: 12px;
  color: #374151;
  margin-bottom: 5px;
  letter-spacing: 0.04em;
}

.hint-note {
  font-size: 10px;
  color: #6b7280;
  margin-top: 5px;
}

/* 9×9 盘面：CSS grid + 粗细线 */
.sudoku-board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  background: #fff;
  border: 3px solid #111;
}

.board-size-1 { max-width: 80%; font-size: 34px; }
.board-size-2 { max-width: 56%; font-size: 24px; }
.board-size-4 { max-width: 42%; font-size: 17px; }

.sudoku-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #b9b9b9;
  border-bottom: 1px solid #b9b9b9;
  color: #111;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  user-select: none;
}

.cell-bold-r { border-right: 2.5px solid #111; }
.cell-bold-b { border-bottom: 2.5px solid #111; }
.cell-end-r { border-right: none; }
.cell-end-b { border-bottom: none; }
.cell-given-gray { color: #9ca3af; font-weight: 600; }

@media print {
  .no-print {
    display: none !important;
  }
  .a4-paper {
    max-width: none;
    width: auto;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
    aspect-ratio: auto;
  }
  .print-page-break {
    page-break-after: always;
    break-after: page;
  }
  .puzzle-header {
    font-size: 4mm;
    margin-bottom: 2.5mm;
  }
  .hint-note {
    font-size: 3.2mm;
    margin-top: 2mm;
  }
  .sudoku-board {
    border-width: 0.9mm;
  }
  .sudoku-cell {
    border-right-width: 0.22mm;
    border-bottom-width: 0.22mm;
  }
  .cell-bold-r { border-right-width: 0.65mm; }
  .cell-bold-b { border-bottom-width: 0.65mm; }
  .board-size-1 { max-width: 148mm; font-size: 11.5mm; }
  .board-size-2 { max-width: 106mm; font-size: 8mm; }
  .board-size-4 { max-width: 78mm; font-size: 5.6mm; }
}
</style>
