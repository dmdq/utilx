<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Hash class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">九九乘法练习</h1>
          <p class="text-sm text-muted-foreground mt-1">速查表 · 限时测验 · 闪卡三种模式，中文口诀读法、错题统计与种子复现</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线九九乘法口诀练习工具：① 速查表完整呈现 9×9 口诀表，点击任意格子高亮并朗读中文读法（如三七二十一）；
        ② 随机测验支持 10/20/30 题与乘数范围筛选（全部或只练 7/8/9），计时作答后自动判分、列出错题清单与用时；
        ③ 闪卡模式大字展示 a×b=?，点击揭示答案后自评"会 / 不会"，不会的卡片自动进入重练队列。
        全程基于 mulberry32 确定性种子：同一种子随时复现同一份测验。错题统计会聚合出你最该重点练的数字。
        全部在浏览器本地运行，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：模式与设置 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Hash class="w-5 h-5 mr-2 text-primary" /> 选择模式
          </h2>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="m in MODES"
              :key="m.id"
              type="button"
              @click="mode = m.id"
              class="px-1 py-2 rounded-lg border text-xs font-medium transition"
              :class="mode === m.id ? BTN_ON : BTN_OFF"
            >
              {{ m.label }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">{{ MODES.find((m) => m.id === mode)?.desc }}</p>
        </div>

        <!-- 测验设置 -->
        <div v-if="mode === 'quiz'" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 测验设置
          </h2>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">题目数量</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="n in QUIZ_COUNTS"
                :key="n"
                type="button"
                @click="quizCount = n"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="quizCount === n ? BTN_ON : BTN_OFF"
              >
                {{ n }} 题
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">乘数范围（不选则 1-9 全部）</label>
            <div class="grid grid-cols-5 gap-1">
              <button
                v-for="n in 9"
                :key="n"
                type="button"
                @click="toggleFocus(n)"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="focus.includes(n) ? BTN_ON : BTN_OFF"
              >
                {{ n }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              当前：{{ focusLabel }} · 建议只练易错段（如 7/8/9）
            </p>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">随机种子（同一种子 = 同一份题）</label>
            <input
              v-model="seedInput"
              type="text"
              inputmode="numeric"
              :class="SEL_CLS"
              placeholder="如填 20260101 随时复现同一份测验"
              @change="applySeedInput"
            />
          </div>
          <button
            type="button"
            @click="startQuiz"
            :disabled="quizState === 'running'"
            class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Play class="w-4 h-4" /> {{ quizState === 'running' ? '答题中…' : '出题并开始计时' }}
          </button>
          <p class="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>点「出题并开始计时」后作答，全部填优点「交卷判分」，或时间到了再看结果。</span>
          </p>
        </div>

        <!-- 闪卡设置 -->
        <div v-if="mode === 'card'" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Layers class="w-5 h-5 mr-2 text-primary" /> 闪卡设置
          </h2>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">练哪几个数字（不选则全部 45 张卡）</label>
            <div class="grid grid-cols-5 gap-1">
              <button
                v-for="n in 9"
                :key="n"
                type="button"
                @click="toggleFocus(n)"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="focus.includes(n) ? BTN_ON : BTN_OFF"
              >
                {{ n }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">当前卡组：{{ focusLabel }}，共 {{ cardDeck.length }} 张（去重后 a×b 与 b×a 视为同一张）</p>
          </div>
          <button
            type="button"
            @click="resetCards"
            class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw class="w-4 h-4" /> 重置卡组与统计
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            自评「不会」的卡片会立即排到队尾重练（马克笔重练队列），直到全部评「会」；右侧记录累计会 / 不会次数。
          </p>
        </div>

        <!-- 错题统计 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 错题统计（本次会话累计）
          </h2>
          <template v-if="stats.totalWrong > 0">
            <div class="bg-muted/50 rounded-xl p-4 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">累计错题</span>
                <span class="font-semibold text-foreground">{{ stats.totalWrong }} 题</span>
              </div>
              <div
                v-for="f in stats.topFactors"
                :key="f.factor"
                class="flex items-center gap-2 text-sm"
              >
                <span class="w-10 text-center py-0.5 rounded bg-primary/10 text-primary font-medium">{{ f.factor }}</span>
                <div class="flex-1 h-2 rounded bg-muted overflow-hidden">
                  <div class="h-full bg-primary/60 rounded" :style="{ width: (f.count / stats.maxFactorCount * 100) + '%' }"></div>
                </div>
                <span class="w-14 text-right text-muted-foreground">{{ f.count }} 次</span>
              </div>
              <p v-if="stats.advice" class="text-sm text-amber-600 flex items-center gap-1.5 pt-1">
                <TriangleAlert class="w-4 h-4 shrink-0" /> {{ stats.advice }}
              </p>
            </div>
          </template>
          <p v-else class="text-sm text-muted-foreground">还没有错题记录。做一轮测验或闪卡，这里会告诉你该重点练哪个数字。</p>
        </div>
      </div>

      <!-- 右：内容区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 速查表 -->
        <div v-if="mode === 'table'" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Table2 class="w-5 h-5 mr-2 text-primary" /> 九九乘法速查表
          </h2>
          <p class="text-sm text-muted-foreground mb-4">点击任意格子查看中文口诀读法，表内行列交叉即乘积。</p>
          <div class="overflow-x-auto">
            <table class="border-collapse text-sm select-none">
              <thead>
                <tr>
                  <th class="p-1.5 border border-border bg-muted/50 text-muted-foreground">×</th>
                  <th v-for="b in 9" :key="'h' + b" class="p-1.5 border border-border bg-muted/50 text-foreground font-medium w-12">{{ b }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in 9" :key="'r' + a">
                  <th class="p-1.5 border border-border bg-muted/50 text-foreground font-medium">{{ a }}</th>
                  <td
                    v-for="b in 9"
                    :key="a + '-' + b"
                    class="p-1.5 border border-border text-center cursor-pointer transition tabular-nums"
                    :class="selected && selected.a === a && selected.b === b ? 'bg-primary text-primary-foreground font-bold' : 'bg-background hover:bg-primary/10'"
                    @click="selected = { a, b }"
                  >
                    {{ a * b }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 bg-muted/50 rounded-xl p-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <template v-if="selected">
              <span class="text-lg font-bold text-foreground tabular-nums">{{ selected.a }} × {{ selected.b }} = {{ selected.a * selected.b }}</span>
              <span class="text-base text-primary font-medium">口诀：{{ koujueOf(selected.a, selected.b) }}</span>
            </template>
            <span v-else class="text-sm text-muted-foreground">示例：点击 3 行 7 列 → 3 × 7 = 21，口诀「三七二十一」</span>
          </div>
        </div>

        <!-- 随机测验 -->
        <div v-if="mode === 'quiz'" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <ListChecks class="w-5 h-5 mr-2 text-primary" /> 限时测验
            </h2>
            <div v-if="quizState === 'running'" class="text-sm font-mono px-3 py-1 rounded-lg bg-primary/10 text-primary tabular-nums">
              已用 {{ elapsedText }}
            </div>
            <div v-else-if="quizState === 'done'" class="text-sm px-3 py-1 rounded-lg bg-muted/50 text-foreground">
              用时 {{ elapsedText }} · 得分 {{ quizResult.score }} / {{ quizQuestions.length }}
            </div>
          </div>

          <!-- 作答中 / 未开始 -->
          <template v-if="quizState !== 'done'">
            <div v-if="!quizQuestions.length" class="text-sm text-muted-foreground py-8 text-center">
              在左侧设置题数与乘数范围，点「出题并开始计时」开始。
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="(q, i) in quizQuestions"
                :key="q.no"
                class="flex items-center gap-2 border border-border rounded-lg px-3 py-2"
              >
                <span class="text-xs text-muted-foreground w-6 tabular-nums">{{ q.no }}.</span>
                <span class="font-medium text-foreground tabular-nums">{{ q.a }} × {{ q.b }} =</span>
                <input
                  v-model="quizInputs[i]"
                  type="number"
                  inputmode="numeric"
                  class="w-20 px-2 py-1 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div v-if="quizQuestions.length" class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                @click="submitQuiz"
                class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              >
                交卷判分
              </button>
              <button
                type="button"
                @click="quizState = 'idle'; quizQuestions = []; quizInputs = []"
                class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
              >
                放弃本轮
              </button>
            </div>
          </template>

          <!-- 结果 -->
          <template v-else>
            <div class="bg-muted/50 rounded-xl p-4 mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span class="text-foreground">正确 <b class="text-green-600">{{ quizResult.score }}</b> / {{ quizQuestions.length }}</span>
              <span class="text-foreground">用时 <b class="tabular-nums">{{ elapsedText }}</b></span>
              <span class="text-foreground">正确率 <b>{{ quizResult.rate }}%</b></span>
            </div>
            <div v-if="quizResult.wrong.length" class="space-y-2">
              <h3 class="text-base font-semibold text-foreground">错题清单</h3>
              <div
                v-for="w in quizResult.wrong"
                :key="w.no"
                class="border border-border rounded-lg px-3 py-2 text-sm flex flex-wrap items-baseline gap-x-2"
              >
                <span class="text-muted-foreground tabular-nums">{{ w.no }}.</span>
                <span class="text-foreground tabular-nums">{{ w.a }} × {{ w.b }} =</span>
                <span class="text-red-500 line-through tabular-nums">{{ w.given === '' ? '未作答' : w.given }}</span>
                <span class="text-green-600 font-medium tabular-nums">{{ w.answer }}</span>
                <span class="text-muted-foreground">（{{ koujueOf(w.a, w.b) }}）</span>
              </div>
            </div>
            <p v-else class="text-sm text-green-600 font-medium">全对，太棒了！可以加大题量或换新种子再来一轮。</p>
            <div class="mt-4 flex gap-2">
              <button
                type="button"
                @click="startQuiz"
                class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              >
                再来一轮
              </button>
            </div>
          </template>
        </div>

        <!-- 闪卡 -->
        <div v-if="mode === 'card'" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Layers class="w-5 h-5 mr-2 text-primary" /> 闪卡练习
          </h2>
          <template v-if="cardDeck.length">
            <div class="flex flex-col items-center py-6">
              <p class="text-xs text-muted-foreground mb-4">剩余 {{ cardQueue.length }} / {{ cardDeck.length }} 张 · 已评会 {{ cardStats.hui }} 次 / 不会 {{ cardStats.buhui }} 次</p>
              <div class="w-full max-w-sm bg-muted/50 rounded-xl p-8 text-center">
                <template v-if="currentCard">
                  <p class="text-5xl font-bold text-foreground tabular-nums tracking-wide">{{ currentCard.a }} × {{ currentCard.b }} = ?</p>
                  <template v-if="cardRevealed">
                    <p class="mt-4 text-4xl font-bold text-primary tabular-nums">{{ currentCard.a * currentCard.b }}</p>
                    <p class="mt-1 text-sm text-muted-foreground">口诀：{{ koujueOf(currentCard.a, currentCard.b) }}</p>
                    <div class="mt-6 flex justify-center gap-3">
                      <button
                        type="button"
                        @click="rateCard(true)"
                        class="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
                      >
                        会了
                      </button>
                      <button
                        type="button"
                        @click="rateCard(false)"
                        class="px-6 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
                      >
                        不会，再练
                      </button>
                    </div>
                  </template>
                  <button
                    v-else
                    type="button"
                    @click="cardRevealed = true"
                    class="mt-4 px-6 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition"
                  >
                    点击揭示答案
                  </button>
                </template>
              </div>
            </div>
          </template>
          <div v-else class="py-10 text-center text-sm text-muted-foreground">
            当前卡组已全部练完。点左侧「重置卡组与统计」再来一轮，或换几个数字继续。
            <p v-if="cardStats.buhui > 0" class="mt-2 text-amber-600">本轮共重练 {{ cardStats.buhui }} 张"不会"卡，建议明天用同一批数字再做一轮测验巩固。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <details class="bg-card border border-border rounded-lg mb-12 group">
        <summary class="cursor-pointer list-none px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-foreground"><span class="text-primary mr-2">#</span>九九乘法练习：用法、易错段与常见问题</h2>
          <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
        </summary>
        <div class="px-6 pb-6 space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">为什么 7、8、9 的口诀最容易错？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              一几得几、二几得几这类小数字口诀在加法阶段就已经反复用过，记忆负担小；而 7/8/9 段有三个特点让它成为错题重灾区：
              一是口诀条数多（每段 9 句且积都很大），二是相邻积之间差值不唯一（如 七八五十六 与 七九六十三、八八六十四 混淆），
              三是高干扰组合集中（六九五十四 与 五九四十五、六八四十八 与 七八五十六 极易串）。
              教学上通用的口径是：先用速查表把 7/8/9 段过一遍形成整体印象，再用本工具把乘数范围限定到 7/8/9 做限时测验，
              错题统计会自动聚合出你错得最多的乘数——比如错题里反复出现 6×7、8×9，就会提示"重点练 6 和 9"，
              然后把范围收窄到这几个数字集中突破，最后放开到全部 1-9 验证。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">三种模式怎么搭配用？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              速查表适合第一次接触口诀或订正作业时查读法；限时测验适合每天 5 分钟打卡，10 题起步、20-30 题进阶，
              交卷后重点看错题清单里的中文口诀；闪卡适合睡前或碎片时间过卡，"不会"的卡会自动排到队尾重练（马克笔重练队列的思路），
              全部评"会"才算过卡。建议节奏：测验暴露问题 → 闪卡针对重练 → 隔天再测验验证。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">同种子复现是什么意思？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              出题用的随机数来自 mulberry32 确定性算法：填同一个种子（如 20260101）配同样设置，任何一次、任何设备上生成的题目顺序完全一致。
              家长想让孩子"重做昨天那份卷"或同桌之间"同卷比速度"，把种子数字填回去即可；不填种子则每次都是新题。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">需要纸质口算卷怎么办？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              本页偏屏幕互动练习。如果要打印成 A4 口算题卡（含答案页、多列排版、竖式等），请配合
              <NuxtLink to="/tools/math-worksheet-printer/" class="text-primary hover:underline">口算题卡生成器</NuxtLink>
              使用：它支持加减乘除混合出题与打印排版，与本页的错题统计配合效果更好。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm font-semibold text-foreground">口诀读法的规则是什么？</p>
                <p class="text-sm text-muted-foreground mt-1">按现行小学通用口径：积是一位数读"得几"（如二三得六），积是十位为 1 的整十数读"一十"（如二五一十），其余两位数直接连读（如三七二十一、四四十六）。口诀一律小数在前，所以 7×3 也读作"三七二十一"。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">数据会上传吗？</p>
                <p class="text-sm text-muted-foreground mt-1">不会。出题、判分、统计全部在浏览器本地完成，没有任何网络请求；错题统计只在当前页面会话内累计，刷新页面后清零。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">单题时间到会自动交卷吗？</p>
                <p class="text-sm text-muted-foreground mt-1">本工具记录总用时而不强制交卷，孩子可以按自己的节奏答完再判分；需要严格限时的家长可以口头约定时间，用时看计时器即可。</p>
              </div>
            </div>
          </div>
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-semibold text-foreground mb-1">口径与来源</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              口诀文本与读法规则依维基百科「九九表」与百度百科「乘法口诀」两个来源交叉核对（现行小学通用版本，小数在前、
              积一位数用"得"、十位 1 读"一十"）；"7/8/9 段易错"为常见教学经验口径，仅供练习安排参考。
            </p>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Hash, ListChecks, Layers, BarChart3, Table2, Play, RotateCcw,
  Info, TriangleAlert, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'

// ---------- SEO ----------
useSeoMeta({
  title: '九九乘法练习 - 速查表/限时测验/闪卡，中文口诀错题统计 | 有条工具',
  description: '免费在线九九乘法口诀练习：9×9 速查表点击朗读中文口诀，限时测验 10/20/30 题可只练 7/8/9 易错段并自动判分列错题，闪卡模式不会的卡自动重练，mulberry32 种子同码同卷可复现，错题统计提示重点练哪个数字，纯本地运行',
  keywords: '九九乘法练习,乘法口诀表,乘法闪卡,口诀速查,乘法测验,小学乘法',
  author: '有条工具',
  ogTitle: '九九乘法练习 - 速查表/限时测验/闪卡 | 有条工具',
  ogDescription: '速查表、限时测验、闪卡三模式，中文口诀读法，错题统计重点突破 7/8/9。',
  ogUrl: 'https://www.util.cn/tools/multiplication-trainer',
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
          name: '九九乘法练习',
          url: 'https://www.util.cn/tools/multiplication-trainer',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '9×9 速查表，点击高亮并显示中文口诀读法',
            '限时测验 10/20/30 题，乘数范围可限定 7/8/9',
            '自动判分、错题清单（附中文口诀）与用时统计',
            '闪卡模式：不会的卡自动进入重练队列',
            '错题按乘数聚合，提示重点练哪个数字',
            'mulberry32 确定性种子，同种子同题可复现'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '九九乘法练习', item: 'https://www.util.cn/tools/multiplication-trainer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么 7、8、9 的口诀最容易错？',
              acceptedAnswer: { '@type': 'Answer', text: '小数字口诀在加法阶段已反复用过，而7/8/9段口诀条数多、积大且相邻积易混淆（如七八五十六与七九六十三），干扰组合集中。建议用速查表过一遍后限定范围限时测验，再按错题统计收窄突破。' }
            },
            {
              '@type': 'Question',
              name: '口诀读法的规则是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '现行小学通用口径：积是一位数读得几（二三得六），积是十位为1的整十数读一十（二五一十），其余两位数直接连读（三七二十一、四四十六）；口诀一律小数在前。' }
            },
            {
              '@type': 'Question',
              name: '同种子复现是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '出题随机数来自mulberry32确定性算法：填同一个种子配同样设置，任何一次、任何设备生成的题目顺序完全一致，可用于重做同卷或同班同卷比速度。' }
            }
          ]
        }
      ]
    })
  }]
})

/* PURE-FNS-START（纯函数区：供 node 自测提取，勿在此使用浏览器 API / Vue 响应式） */

// mulberry32 确定性伪随机数发生器（标准实现）：同一种子产生完全相同的 [0,1) 序列
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// [min, max] 闭区间随机整数
function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

const CN_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

// 中文口诀读法：3×7→「三七二十一」，4×4→「四四十六」，1×1→「一一得一」，2×5→「二五一十」。
// 规则（现行小学通用口径，维基百科「九九表」/百度百科「乘法口诀」两源核对）：
// 口诀小数在前；积是一位数用「得」；积恰为 10 读「一十」（二五一十）；
// 积为 11-19 读「十几」（四四十六）；其余两位数直接连读（四五二十、九九八十一）。
function koujueOf(a, b) {
  const x = Math.min(Math.round(a), Math.round(b))
  const y = Math.max(Math.round(a), Math.round(b))
  if (x < 1 || x > 9 || y < 1 || y > 9) return ''
  const p = x * y
  if (p < 10) return CN_DIGITS[x] + CN_DIGITS[y] + '得' + CN_DIGITS[p]
  const tens = Math.floor(p / 10)
  const ones = p % 10
  let tail = ''
  if (p === 10) tail = '一十'
  else if (tens === 1) tail = '十' + CN_DIGITS[ones]
  else tail = CN_DIGITS[tens] + '十' + (ones ? CN_DIGITS[ones] : '')
  return CN_DIGITS[x] + CN_DIGITS[y] + tail
}

// 组卷：count 道乘法题，乘数 a 从 focus 集合取、被乘数 b 取 1-9；确定性种子复现
function buildQuiz(count, focus, seed) {
  const n = Math.min(100, Math.max(1, Math.floor(Number(count) || 10)))
  const pool = (Array.isArray(focus) ? focus : []).filter((v) => v >= 1 && v <= 9)
  const factors = pool.length ? pool.slice().sort((m, k) => m - k) : [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const rng = mulberry32(Number(seed) >>> 0)
  const items = []
  const seen = new Set()
  for (let i = 0; i < n; i++) {
    let a = 1
    let b = 1
    for (let attempt = 0; attempt < 8; attempt++) {
      a = factors[randInt(rng, 0, factors.length - 1)]
      b = randInt(rng, 1, 9)
      if (!seen.has(a + 'x' + b)) break
    }
    seen.add(a + 'x' + b)
    items.push({ no: i + 1, a, b })
  }
  return items
}

// 判分：answers 为与题目等长的字符串数组；返回得分、正确率与错题清单
function gradeQuiz(questions, answers) {
  const list = Array.isArray(questions) ? questions : []
  const given = Array.isArray(answers) ? answers : []
  let score = 0
  const wrong = []
  for (let i = 0; i < list.length; i++) {
    const q = list[i]
    const expect = String(q.a * q.b)
    const actual = String(given[i] == null ? '' : given[i]).trim()
    if (actual === expect) score += 1
    else wrong.push({ no: q.no, a: q.a, b: q.b, answer: q.a * q.b, given: actual })
  }
  return { score, wrong, total: list.length, rate: list.length ? Math.round((score / list.length) * 100) : 0 }
}

// 错题统计：把错题按两个乘数各计一次，聚出最该重点练的数字（如 6×7、8×9 错得多 → 重点练 6 和 8）
function wrongFactorStats(wrong, topN) {
  const list = Array.isArray(wrong) ? wrong : []
  const counts = {}
  for (const w of list) {
    if (!w || typeof w.a !== 'number' || typeof w.b !== 'number') continue
    counts[w.a] = (counts[w.a] || 0) + 1
    counts[w.b] = (counts[w.b] || 0) + 1
  }
  const factors = Object.keys(counts).map((k) => ({ factor: Number(k), count: counts[k] }))
  factors.sort((x, y) => y.count - x.count || x.factor - y.factor)
  const top = factors.slice(0, Math.max(1, Math.floor(Number(topN) || 2)))
  const maxCount = factors.length ? factors[0].count : 0
  const advice = top.length
    ? '重点练 ' + top.map((t) => t.factor).join(' 和 ') + '：错题里反复出现这些乘数，建议把练习范围收窄到它们'
    : ''
  return { counts, factors, topFactors: top, maxFactorCount: maxCount, totalWrong: list.length, advice }
}

// 闪卡卡组：focus 数字 × 1-9，去重（a×b 与 b×a 同卡，统一小数在前）后按种子洗牌
function buildFlashDeck(focus, seed) {
  const pool = (Array.isArray(focus) ? focus : []).filter((v) => v >= 1 && v <= 9)
  const factors = pool.length ? pool.slice().sort((m, k) => m - k) : [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const cards = []
  const seen = new Set()
  for (const a of factors) {
    for (let b = 1; b <= 9; b++) {
      const key = Math.min(a, b) + 'x' + Math.max(a, b)
      if (seen.has(key)) continue
      seen.add(key)
      cards.push({ a: Math.min(a, b), b: Math.max(a, b) })
    }
  }
  const rng = mulberry32(Number(seed) >>> 0)
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = cards[i]
    cards[i] = cards[j]
    cards[j] = tmp
  }
  return cards
}

/* PURE-FNS-END */

// ---------- 页面状态 ----------
const MODES = [
  { id: 'table', label: '速查表', desc: '完整 9×9 口诀表，点击格子高亮并显示中文读法，适合查与订正。' },
  { id: 'quiz', label: '限时测验', desc: '计时作答，交卷后自动判分并列出错题清单与中文口诀，适合每日打卡。' },
  { id: 'card', label: '闪卡', desc: '大字 a×b=?，点开答案后自评会/不会，不会的卡自动排队重练。' }
]
const QUIZ_COUNTS = [10, 20, 30]
const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const mode = ref('table')
const focus = ref([])

const selected = ref(null)

// 测验状态
const quizCount = ref(10)
const seedInput = ref('')
const activeSeed = ref(20260101) // 首屏固定种子保证 SSR 与客户端一致；onMounted 后换随机种子
const quizState = ref('idle') // idle | running | done
const quizQuestions = ref([])
const quizInputs = ref([])
const quizResult = ref({ score: 0, wrong: [], total: 0, rate: 0 })
const elapsedMs = ref(0)
let timerId = null
let startedAt = 0

// 闪卡状态
const cardDeck = ref([])
const cardQueue = ref([])
const cardRevealed = ref(false)
const cardStats = ref({ hui: 0, buhui: 0 })

// 会话错题统计
const stats = computed(() => {
  const agg = wrongFactorStats(sessionWrong.value, 2)
  return agg
})
const sessionWrong = ref([])

const focusLabel = computed(() => (focus.value.length ? focus.value.slice().sort((a, b) => a - b).join('、') : '1-9 全部'))

function toggleFocus(n) {
  const i = focus.value.indexOf(n)
  if (i >= 0) focus.value = focus.value.filter((v) => v !== n)
  else focus.value = [...focus.value, n]
  if (mode.value === 'card') resetCards()
}

function seedFromInput() {
  const raw = String(seedInput.value).trim()
  if (raw === '') return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? Math.abs(n) >>> 0 : null
}

function randomSeed() {
  return Math.floor(Math.random() * 900000000) + 100000000
}

function applySeedInput() {
  const s = seedFromInput()
  activeSeed.value = s === null ? randomSeed() : s
}

function startQuiz() {
  quizQuestions.value = buildQuiz(quizCount.value, focus.value, activeSeed.value)
  quizInputs.value = quizQuestions.value.map(() => '')
  quizResult.value = { score: 0, wrong: [], total: 0, rate: 0 }
  quizState.value = 'running'
  elapsedMs.value = 0
  startedAt = Date.now()
  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    elapsedMs.value = Date.now() - startedAt
  }, 250)
}

function submitQuiz() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  elapsedMs.value = Date.now() - startedAt
  const result = gradeQuiz(quizQuestions.value, quizInputs.value)
  quizResult.value = result
  quizState.value = 'done'
  sessionWrong.value = [...sessionWrong.value, ...result.wrong]
}

const elapsedText = computed(() => {
  const s = Math.floor(elapsedMs.value / 1000)
  return Math.floor(s / 60) + '分' + String(s % 60).padStart(2, '0') + '秒'
})

// 闪卡流程
function resetCards() {
  cardDeck.value = buildFlashDeck(focus.value, activeSeed.value)
  cardQueue.value = cardDeck.value.slice()
  cardRevealed.value = false
  cardStats.value = { hui: 0, buhui: 0 }
}

const currentCard = computed(() => cardQueue.value[0] || null)

function rateCard(hui) {
  const cur = cardQueue.value[0]
  if (!cur) return
  if (hui) {
    cardStats.value = { ...cardStats.value, hui: cardStats.value.hui + 1 }
    cardQueue.value = cardQueue.value.slice(1)
  } else {
    // 马克笔重练队列：不会的卡标记后排到队尾，直到评「会」才出队
    cardStats.value = { ...cardStats.value, buhui: cardStats.value.buhui + 1 }
    cardQueue.value = [...cardQueue.value.slice(1), cur]
  }
  cardRevealed.value = false
}

// 表格选中默认给一个示例（SSR 安全：纯数据）
selected.value = { a: 3, b: 7 }

onMounted(() => {
  activeSeed.value = randomSeed()
  resetCards()
  addRecentTool('multiplication-trainer')
})

onBeforeUnmount(() => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
})
</script>
