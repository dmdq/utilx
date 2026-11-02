<template>
  <div class="max-w-8xl mx-auto">
    <!-- 全局 @page 规则：A4 竖版、12mm 页边距（打印对话框中缩放保持 100% 即与预览一致） -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <NotebookPen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">口算题卡生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">加减乘除、混合两步、比大小、填空六种题型混编，A4 多列排版直接打印，可附独立答案页</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线小学口算题卡生成器：加减法（数值范围 10/20/100/1000、可强制含进退位）、表内乘法与两位数乘一位数、整除与带余数除法（保证余数小于除数）、
        混合两步运算（先乘除后加减或括号优先）、比大小、求算数项填空共六种题型按比例混编成卷，每页 20-100 题、2-4 列 A4 排版。
        填写相同的随机种子随时再生成完全相同的一份卷，方便补打与全班同卷；勾选答案页即单独多打印一页参考答案。
        全部题目在浏览器本地生成，不上传任何数据，打印即可使用。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：出题设置 -->
      <div class="no-print space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <NotebookPen class="w-5 h-5 mr-2 text-primary" /> 题型与难度
            </h2>
            <span class="text-xs text-muted-foreground">已选 {{ types.length }} / {{ TYPE_OPTIONS.length }} 种</span>
          </div>

          <!-- 题型多选（至少保留 1 种） -->
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="opt in TYPE_OPTIONS"
              :key="opt.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition"
              :class="types.includes(opt.id) ? 'bg-primary/10 border-primary/40 text-primary font-medium' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
            >
              <input
                type="checkbox"
                class="accent-primary w-4 h-4"
                :checked="types.includes(opt.id)"
                @change="toggleType(opt.id, $event)"
              />
              {{ opt.label }}
            </label>
          </div>
          <p v-if="typeTip" class="text-xs text-amber-600 flex items-center gap-1">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ typeTip }}
          </p>

          <!-- 加减法子设置 -->
          <div v-show="types.includes('addsub')" class="border-t border-border pt-4 space-y-3">
            <p class="text-sm font-medium text-foreground">加减法设置</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-muted-foreground mb-1">运算</label>
                <select v-model="addsubOp" :class="SEL_CLS">
                  <option value="add">只加法</option>
                  <option value="sub">只减法</option>
                  <option value="mixed">加减混合</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-muted-foreground mb-1">项数</label>
                <select v-model.number="addsubTerms" :class="SEL_CLS">
                  <option :value="2">两数（如 12+7）</option>
                  <option :value="3">三数连算（如 8+5-6）</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="block text-xs text-muted-foreground mb-1">数值范围</label>
                <select v-model.number="addsubRange" :class="SEL_CLS">
                  <option v-for="r in RANGE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="addsubCarry" type="checkbox" class="accent-primary w-4 h-4" />
              强制含进 / 退位（如 45+58、31-17，难度提升）
            </label>
          </div>

          <!-- 乘法子设置 -->
          <div v-show="types.includes('mul')" class="border-t border-border pt-4 space-y-2">
            <p class="text-sm font-medium text-foreground">乘法设置</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="mulMode = 'table'"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition"
                :class="mulMode === 'table' ? BTN_ON : BTN_OFF"
              >
                表内乘法（1~9）
              </button>
              <button
                type="button"
                @click="mulMode = 'two'"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition"
                :class="mulMode === 'two' ? BTN_ON : BTN_OFF"
              >
                两位数×一位数
              </button>
            </div>
          </div>

          <!-- 除法子设置 -->
          <div v-show="types.includes('div')" class="border-t border-border pt-4 space-y-2">
            <p class="text-sm font-medium text-foreground">除法设置</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="divMode = 'exact'"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition"
                :class="divMode === 'exact' ? BTN_ON : BTN_OFF"
              >
                整除（表内）
              </button>
              <button
                type="button"
                @click="divMode = 'remainder'"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition"
                :class="divMode === 'remainder' ? BTN_ON : BTN_OFF"
              >
                带余数（商……余数）
              </button>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              带余数除法自动保证：商与余数都非负，且余数 < 除数（如 17÷3=5……2）。
            </p>
          </div>

          <!-- 混合两步子设置 -->
          <div v-show="types.includes('mixed')" class="border-t border-border pt-4 space-y-2">
            <p class="text-sm font-medium text-foreground">混合两步设置</p>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="mixedParen" type="checkbox" class="accent-primary w-4 h-4" />
              使用括号（如 (3+5)÷4；不勾选则为 3+5×2 先乘除后加减）
            </label>
          </div>
        </div>

        <!-- 版式与输出 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 版式与输出
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">每页题数</label>
              <select v-model.number="count" :class="SEL_CLS">
                <option v-for="n in COUNT_OPTIONS" :key="n" :value="n">{{ n }} 题</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">列数</label>
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="c in COL_OPTIONS"
                  :key="c"
                  type="button"
                  @click="cols = c"
                  class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                  :class="cols === c ? BTN_ON : BTN_OFF"
                >
                  {{ c }} 列
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">字号</label>
              <div class="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  @click="fontMode = 'standard'"
                  class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                  :class="fontMode === 'standard' ? BTN_ON : BTN_OFF"
                >
                  标准
                </button>
                <button
                  type="button"
                  @click="fontMode = 'large'"
                  class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                  :class="fontMode === 'large' ? BTN_ON : BTN_OFF"
                >
                  大字
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">答案页</label>
              <label class="flex items-center gap-2 h-[38px] px-3 rounded-lg border bg-muted/40 border-border text-sm text-foreground cursor-pointer">
                <input v-model="showAnswers" type="checkbox" class="accent-primary w-4 h-4" />
                附加答案页
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">页眉（打印在题目上方，可直接修改）</label>
            <input
              v-model="headerText"
              type="text"
              :class="SEL_CLS"
              placeholder="口算练习 · ____年__月__日 · 用时____分____秒"
            />
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">随机种子（同一种子 = 同一份卷）</label>
            <input
              v-model="seedInput"
              type="text"
              inputmode="numeric"
              :class="SEL_CLS"
              placeholder="留空则每次随机；如填 42 随时能再出同一份卷"
              @change="applySeedInput"
            />
          </div>

          <div class="grid grid-cols-1 gap-2 pt-1">
            <button
              @click="regenerate"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 重新生成（换一套题）
            </button>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="printWorksheet"
                class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
              >
                <Printer class="w-4 h-4" /> 打印 / PDF
              </button>
              <button
                @click="copyPlainText"
                class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle v-if="copied" class="w-4 h-4 text-green-500" />
                <Copy v-else class="w-4 h-4" />
                {{ copied ? '已复制' : '复制纯文本' }}
              </button>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>改任何设置会按当前种子即时重新组卷；只有点「重新生成」才会换新随机种子出新卷。同一种子 + 同样设置 = 逐题完全一致。</span>
          </p>
        </div>
      </div>

      <!-- 右：A4 预览（打印时仅输出题目页与答案页） -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> A4 预览
          </h2>
          <div class="inline-flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              type="button"
              @click="viewMode = 'questions'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'questions' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              题目页
            </button>
            <button
              v-if="showAnswers"
              type="button"
              @click="viewMode = 'answers'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'answers' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              答案页
            </button>
          </div>
        </div>

        <div class="no-print flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <Info class="w-3.5 h-3.5 shrink-0" />
            共 {{ worksheet.items.length }} 题 · {{ cols }} 列排版 · 当前种子 {{ activeSeed }}
          </span>
          <span
            v-if="selfCheck.total > 0 && selfCheck.passed === selfCheck.total"
            class="flex items-center gap-1 text-green-600"
          >
            <CheckCircle class="w-3.5 h-3.5 shrink-0" /> 答案自校验 {{ selfCheck.passed }}/{{ selfCheck.total }} 通过
          </span>
          <span v-else-if="selfCheck.failed.length" class="flex items-center gap-1 text-amber-600">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ selfCheck.failed.length }} 题自校验未通过，请重新生成
          </span>
        </div>

        <div ref="previewWrapRef" class="w-full">
          <div class="preview-holder mx-auto" :style="holderStyle">
            <div ref="previewStackRef" class="pages-stack" :style="stackStyle">
              <!-- 题目页 -->
              <div
                v-show="viewMode === 'questions'"
                class="a4-sheet"
                :class="{ 'sheet-break': showAnswers }"
                :style="sheetStyle"
              >
                <p class="sheet-header">{{ headerText }}</p>
                <div class="q-grid" :style="gridStyle">
                  <p v-for="it in worksheet.items" :key="it.no" class="q-item">
                    <span class="q-no">{{ it.no }}.</span>{{ it.text }}
                  </p>
                </div>
              </div>
              <!-- 答案页（单独一页，仅题号 + 答案） -->
              <div
                v-if="showAnswers"
                v-show="viewMode === 'answers'"
                class="a4-sheet answer-sheet"
                :style="sheetStyle"
              >
                <p class="sheet-header">{{ headerText }} · 参考答案</p>
                <div class="q-grid" :style="gridStyle">
                  <p v-for="a in worksheet.answers" :key="a.no" class="q-item q-answer">
                    <span class="q-no">{{ a.no }}.</span>{{ a.answer }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时缩放请选「100% / 实际大小」，本页已按 A4 竖版、12mm 页边距排版；打印只会输出题目页（若开启答案页则另起一页附加在卷尾），
          设置面板与页面其余内容不会被打出来。题目较多时会自动分页，每题完整不断行。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>口算题卡生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          口算题卡生成器是一款面向小学家长与老师的免费在线出题工具。它把六种常见口算题型——加减法（可选两数或三数连算、10/20/100/1000 数值范围、
          可强制含进退位）、乘法（表内 1-9 与两位数×一位数）、除法（整除与带余数）、混合两步运算（先乘除后加减或括号优先）、比大小（两式或两数之间填
          &gt; &lt; =）、求算数项填空（3+□=7、□×4=12）——按均等配额混编成一份口算卷，支持每页 20-100 题、2-4 列 A4 排版、标准与大字两种字号，
          并可单独附一页只含题号与答案的参考答案页。出题核心是确定性的 mulberry32 随机数：同一种子配同样设置，任何时候都能逐题复现同一份卷。
          全部生成与排版都在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">口算每天练多少题合适？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一个常用的口径是：低年级（一二年级）每天 20-50 题，其中 20-30 题控制在 5 分钟内完成为宜，三年级可增加到 50 题左右，
          四年级以上更多靠限时训练而非加量。口算练习贵在每天坚持、限时完成，而不是一次做几百题。
          本工具的 20/30/50/100 档位即按这个口径设置：日常打卡选 20 或 30，周末巩固或限时测可选 50 或 100。
          具体请以孩子状态与老师布置为准，本页仅供量级参考。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">数值范围怎么选（对照年级）？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          大致对应关系：10 以内加减法对应一年级上学期；20 以内（含进位加、退位减）对应一年级下学期到二年级上学期；
          100 以内对应二年级；1000 以内对应二年级下学期到三年级。乘法方面，表内乘法（1-9）在二年级学习，
          两位数×一位数多在三年级出现；除法同样从二年级的表内除法起步。可以按「孩子本学期学到哪、口算正确率是否稳定在 90% 以上」来微调，
          正确率高就升一档范围或勾选强制进退位，吃力就降一档。各版本教材进度略有差异，以孩子所用教材与老师要求为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">带余数除法什么时候学？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          按人教版等主流教材的课程口径，「有余数的除法」一般安排在二年级下册学习（各版本教材与学校进度略有差异，请以孩子本学期教材为准）。
          它的核心规则是：余数必须小于除数，且满足「商×除数+余数=被除数」。本工具生成带余数除法时严格保证商与余数都非负、余数小于除数，
          答案页按「商……余数」书写（如 17÷3=5……2），与课堂书写习惯一致，孩子做完可直接对照验算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">答案页怎么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          勾选「附加答案页」后，打印会在题目卷尾单独输出一页参考答案（只有题号与答案，不含题目），常见两种用法：
          一是孩子做完后自己对照批改并圈出错题，培养自查习惯；二是家长批改时把答案页留在自己手里，核对更快。
          建议在页眉处让孩子填写日期并计时，批改后记录用时与错题数，坚持一两周就能看到口算速度的变化。
          如果担心孩子提前翻看，也可以先只打题目页，批改前再单独补打答案页——用相同种子重新生成即可得到同一份卷的答案页。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么同种子能出同一份卷？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          工具的出题随机数不是取系统时间，而是使用确定性的 mulberry32 算法：给定一个种子数字，它产生的随机数序列完全固定，
          因此「同一种子 + 同样设置」在任何时候、任何设备上都会生成逐题一致的卷子。典型场景：老师把同一个种子布置给全班，
          做到全班同卷便于对比讲评；家长卷子打丢了或想补打答案页，填回原种子即可；双胞胎或同桌用同一种子各做一份，公平比速度。
          想换新卷，点「重新生成」就会换一个新随机种子。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">口算每天练多少题合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">低年级常用的口径是每天 20-50 题：一二年级 20-30 题、5 分钟内完成为宜，三年级可到 50 题左右。重在每天限时坚持而非一次加量，具体以老师布置与孩子状态为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">带余数除法什么时候学？</h3>
            <p class="text-sm text-muted-foreground mt-1">多数教材在二年级下册学习「有余数的除法」，各版本进度略有差异，以孩子教材与老师进度为准。本工具已保证余数小于除数、商与余数非负，答案按「商……余数」书写。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">随机种子是什么？怎么复现同一份卷？</h3>
            <p class="text-sm text-muted-foreground mt-1">种子是出题随机数的起点：同一种子配同样设置，生成的卷子逐题完全一致。把种子填回输入框即可复现（补打丢卷、全班同卷都靠它）；点「重新生成」则换新种子出新卷。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印会带出按钮和设置吗？答案怎么打？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。打印样式已隐藏页面其余内容，只输出 A4 题目卷；勾选「附加答案页」时会另起一页单独打印参考答案（含题号），方便自批或家长批改。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的题目会上传或保存吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有题目都在你的浏览器里即时生成，不发送任何网络请求，也不做本地存储；换一套题就点「重新生成」，想保留哪份卷就把它的种子数字记下来。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'math-worksheet-printer'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  NotebookPen, Printer, RefreshCw, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '口算题卡生成器 - 小学数学口算题自动生成打印（带答案）',
  description: '免费在线口算题卡生成器：加减法、乘除法、混合两步、比大小、填空六种题型自动组卷，数值范围与进退位可调，带余数除法保证余数小于除数，A4 多列排版直接打印并附独立答案页，随机种子同码同卷可复现，纯浏览器本地生成不上传',
  keywords: '口算题卡生成器,口算打印,小学数学口算,口算题自动生成,带答案口算',
  author: '有条工具',
  ogTitle: '口算题卡生成器 - 小学数学口算题自动生成打印（带答案） | 有条工具',
  ogDescription: '六种题型混编，A4 多列排版直接打印，可附答案页，同种子同卷可复现。',
  ogUrl: 'https://www.util.cn/tools/math-worksheet-printer',
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
          name: '口算题卡生成器',
          url: 'https://www.util.cn/tools/math-worksheet-printer',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '六种题型：加减法/乘法/除法/混合两步/比大小/填空',
            '数值范围 10/20/100/1000 与强制进退位控制',
            '带余数除法保证余数小于除数',
            'mulberry32 确定性种子，同种子同卷可复现',
            'A4 多列排版打印，独立答案页',
            '纯浏览器本地生成不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '口算题卡生成器', item: 'https://www.util.cn/tools/math-worksheet-printer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '口算每天练多少题合适？',
              acceptedAnswer: { '@type': 'Answer', text: '低年级常用的口径是每天20-50题：一二年级20-30题、5分钟内完成为宜，三年级可到50题左右。重在每天限时坚持而非一次加量，具体以老师布置与孩子状态为准。' }
            },
            {
              '@type': 'Question',
              name: '带余数除法什么时候学？',
              acceptedAnswer: { '@type': 'Answer', text: '多数教材在二年级下册学习有余数的除法，各版本进度略有差异，以孩子教材与老师进度为准。本工具已保证余数小于除数、商与余数非负，答案按商……余数书写。' }
            },
            {
              '@type': 'Question',
              name: '随机种子是什么？怎么复现同一份卷？',
              acceptedAnswer: { '@type': 'Answer', text: '种子是出题随机数的起点：同一种子配同样设置，生成的卷子逐题完全一致。把种子填回输入框即可复现（补打丢卷、全班同卷都靠它）；点重新生成则换新种子出新卷。' }
            },
            {
              '@type': 'Question',
              name: '打印会带出按钮和设置吗？答案怎么打？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。打印样式已隐藏页面其余内容，只输出A4题目卷；勾选附加答案页时会另起一页单独打印参考答案（含题号），方便自批或家长批改。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const ADDSUB_RANGES = [10, 20, 100, 1000]
const WORKSHEET_TYPES = ['addsub', 'mul', 'div', 'mixed', 'compare', 'blank']

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

// 加法是否出现进位：任一数位两数字之和 ≥ 10（150+50 十位 5+5 进位也算）
function addHasCarry(a, b) {
  let x = a
  let y = b
  while (x > 0 || y > 0) {
    if ((x % 10) + (y % 10) >= 10) return true
    x = Math.floor(x / 10)
    y = Math.floor(y / 10)
  }
  return false
}

// 减法是否出现退位：任一数位被减数数字小于减数数字（调用前保证 a ≥ b）
function subHasBorrow(a, b) {
  let x = a
  let y = b
  while (y > 0) {
    if ((x % 10) < (y % 10)) return true
    x = Math.floor(x / 10)
    y = Math.floor(y / 10)
  }
  return false
}

// 按书写顺序从左到右模拟连算式，返回结果与是否出现进/退位
function evalChain(nums, ops) {
  let cur = nums[0]
  let carry = false
  for (let i = 0; i < ops.length; i++) {
    const x = nums[i + 1]
    if (ops[i] === '+') {
      if (addHasCarry(cur, x)) carry = true
      cur += x
    } else {
      if (subHasBorrow(cur, x)) carry = true
      cur -= x
    }
  }
  return { result: cur, carry }
}

// 把数字与运算符拼成算式文本，如 [8,5,6] ['+','-'] → "8+5-6"
function joinExpr(nums, ops) {
  let s = String(nums[0])
  for (let i = 0; i < ops.length; i++) s += ops[i] + String(nums[i + 1])
  return s
}

// 加减法兜底构造：任何参数组合都能给出合法题（加法凑满 range，减法从 range 起减；range 需 ≥ 2）
function fallbackAddSub(range, op, terms) {
  const r = Math.max(2, range)
  if (op === 'sub') {
    const nums = terms === 3 ? [r, 1, 1] : [r, 1]
    const ops = terms === 3 ? ['-', '-'] : ['-']
    return { text: joinExpr(nums, ops) + '=', answer: String(evalChain(nums, ops).result) }
  }
  const nums = terms === 3 ? [1, 1, r - 2] : [r - 1, 1]
  const ops = terms === 3 ? ['+', '+'] : ['+']
  return { text: joinExpr(nums, ops) + '=', answer: String(evalChain(nums, ops).result) }
}

// 生成一道加减法题：逐步限界生成，保证所有中间结果都落在 [0, range]；carry=true 时强制含进位或退位
function genOneAddSub(range, op, rng, carry, terms) {
  const opChar = op === 'add' ? '+' : op === 'sub' ? '-' : null // mixed → 逐步随机
  for (let attempt = 0; attempt < 400; attempt++) {
    const ops = []
    for (let i = 1; i < terms; i++) ops.push(opChar === null ? (rng() < 0.5 ? '+' : '-') : opChar)
    const nums = [randInt(rng, 1, range)]
    let cur = nums[0]
    let ok = true
    for (let i = 0; i < ops.length; i++) {
      if (ops[i] === '+') {
        const room = range - cur
        if (room < 1) { ok = false; break }
        const x = randInt(rng, 1, room)
        nums.push(x)
        cur += x
      } else {
        if (cur < 1) { ok = false; break }
        const x = randInt(rng, 1, cur)
        nums.push(x)
        cur -= x
      }
    }
    if (!ok) continue
    const r = evalChain(nums, ops)
    if (carry && !r.carry) continue
    return { text: joinExpr(nums, ops) + '=', answer: String(r.result) }
  }
  return fallbackAddSub(range, op, terms)
}

// 批量生成加减法：genAddSub(20, 'mixed', 30, rng, { carry: false, terms: 2 }) → [{text, answer}, ...]
function genAddSub(range, op, count, rng, opts) {
  const safeRange = ADDSUB_RANGES.includes(range) ? range : 20
  const safeOp = ['add', 'sub', 'mixed'].includes(op) ? op : 'mixed'
  const n = Math.max(1, Math.floor(Number(count) || 1))
  const o = opts && typeof opts === 'object' ? opts : {}
  const carry = !!o.carry
  const terms = o.terms === 3 ? 3 : 2
  const out = []
  for (let i = 0; i < n; i++) out.push(genOneAddSub(safeRange, safeOp, rng, carry, terms))
  return out
}

// 乘法题：mode 'table' 表内乘法（两因数均在 1-9）；'two' 两位数×一位数（一位数取 2-9 避免乘 1 平凡题）
function genMul(mode, rng) {
  if (mode === 'two') {
    const a = randInt(rng, 10, 99)
    const b = randInt(rng, 2, 9)
    return { text: a + '×' + b + '=', answer: String(a * b) }
  }
  const a = randInt(rng, 1, 9)
  const b = randInt(rng, 1, 9)
  return { text: a + '×' + b + '=', answer: String(a * b) }
}

// 除法题：mode 'exact' 表内整除；'remainder' 带余数（a = b×q + r，商 q ≥ 1、余数 1 ≤ r < b）
function genDiv(mode, rng) {
  const b = randInt(rng, 2, 9)
  const q = randInt(rng, 1, 9)
  if (mode === 'remainder') {
    const r = randInt(rng, 1, b - 1)
    const a = b * q + r
    return { text: a + '÷' + b + '=', answer: q + '……' + r }
  }
  const a = b * q
  return { text: a + '÷' + b + '=', answer: String(q) }
}

// 两步混合运算：useParen=false 时先乘除后加减（a+b×c 等），true 时括号优先（(a+b)÷c 等）；答案均为非负整数
function genMixed(rng, useParen) {
  if (useParen) {
    const form = randInt(rng, 0, 3)
    if (form === 0) {
      const a = randInt(rng, 1, 9)
      const b = randInt(rng, 1, 9)
      const c = randInt(rng, 2, 9)
      return { text: '(' + a + '+' + b + ')×' + c + '=', answer: String((a + b) * c) }
    }
    if (form === 1) {
      const c = randInt(rng, 2, 9)
      const q = randInt(rng, 2, 9)
      const sum = c * q
      const a = randInt(rng, 1, sum - 1)
      return { text: '(' + a + '+' + (sum - a) + ')÷' + c + '=', answer: String(q) }
    }
    if (form === 2) {
      const a = randInt(rng, 3, 20)
      const b = randInt(rng, 1, a - 1)
      const c = randInt(rng, 2, 9)
      return { text: '(' + a + '-' + b + ')×' + c + '=', answer: String((a - b) * c) }
    }
    const c = randInt(rng, 2, 9)
    const q = randInt(rng, 2, 9)
    const b = randInt(rng, 1, 15)
    const a = c * q + b
    return { text: '(' + a + '-' + b + ')÷' + c + '=', answer: String(q) }
  }
  const form = randInt(rng, 0, 5)
  if (form === 0) {
    const b = randInt(rng, 2, 9)
    const c = randInt(rng, 2, 9)
    const a = randInt(rng, 1, 20)
    return { text: a + '+' + b + '×' + c + '=', answer: String(a + b * c) }
  }
  if (form === 1) {
    const b = randInt(rng, 2, 5)
    const c = randInt(rng, 2, 5)
    const a = randInt(rng, b * c, b * c + 20)
    return { text: a + '-' + b + '×' + c + '=', answer: String(a - b * c) }
  }
  if (form === 2) {
    const a = randInt(rng, 2, 9)
    const b = randInt(rng, 2, 9)
    const c = randInt(rng, 1, 20)
    return { text: a + '×' + b + '+' + c + '=', answer: String(a * b + c) }
  }
  if (form === 3) {
    const a = randInt(rng, 2, 9)
    const b = randInt(rng, 2, 9)
    const c = randInt(rng, 1, a * b - 1)
    return { text: a + '×' + b + '-' + c + '=', answer: String(a * b - c) }
  }
  if (form === 4) {
    const b = randInt(rng, 2, 9)
    const q = randInt(rng, 2, 9)
    const c = randInt(rng, 1, 20)
    return { text: b * q + '÷' + b + '+' + c + '=', answer: String(q + c) }
  }
  const b = randInt(rng, 2, 9)
  const q = randInt(rng, 3, 9)
  const c = randInt(rng, 1, q - 1)
  return { text: b * q + '÷' + b + '-' + c + '=', answer: String(q - c) }
}

// 比大小：两式/两数之间填 > < =；约 1/3 概率构造两边相等（答案 =），其余随机
function genCompare(rng, range) {
  const makeSide = (allowExpr) => {
    if (allowExpr && rng() < 0.5) {
      if (rng() < 0.5) {
        const a = randInt(rng, 1, range - 1)
        const b = randInt(rng, 1, range - a)
        return { text: a + '+' + b, value: a + b }
      }
      const a = randInt(rng, 2, range)
      const b = randInt(rng, 1, a - 1)
      return { text: a + '-' + b, value: a - b }
    }
    const v = randInt(rng, 0, range)
    return { text: String(v), value: v }
  }
  let left
  let right
  if (rng() < 0.34) {
    const a = randInt(rng, 1, range - 1)
    const b = randInt(rng, 1, range - a)
    left = { text: a + '+' + b, value: a + b }
    right = rng() < 0.5 ? { text: String(a + b), value: a + b } : { text: b + '+' + a, value: a + b }
  } else {
    left = makeSide(rng() < 0.6)
    right = makeSide(rng() < 0.6)
  }
  return {
    text: left.text + ' ○ ' + right.text,
    answer: left.value > right.value ? '>' : left.value < right.value ? '<' : '='
  }
}

// 填空（求算数项）：3+□=7 / □-4=6 / □×3=12 / 12÷□=4 等，answer 为缺失的数
function genBlank(rng, range) {
  const form = randInt(rng, 0, 6)
  if (form === 0) {
    const a = randInt(rng, 1, range - 1)
    const x = randInt(rng, 1, range - a)
    return { text: a + '+□=' + (a + x), answer: String(x) }
  }
  if (form === 1) {
    const a = randInt(rng, 1, range - 1)
    const x = randInt(rng, 1, range - a)
    return { text: '□+' + a + '=' + (a + x), answer: String(x) }
  }
  if (form === 2) {
    const a = randInt(rng, 2, range)
    const x = randInt(rng, 1, a - 1)
    return { text: a + '-□=' + (a - x), answer: String(x) }
  }
  if (form === 3) {
    const a = randInt(rng, 1, range - 1)
    const c = randInt(rng, 1, range - a) // 差为 c，缺失的被减数 □ = a + c ≤ range
    return { text: '□-' + a + '=' + c, answer: String(a + c) }
  }
  if (form === 4) {
    const b = randInt(rng, 2, 9)
    const x = randInt(rng, 2, 9)
    return { text: '□×' + b + '=' + (x * b), answer: String(x) }
  }
  if (form === 5) {
    const c = randInt(rng, 2, 9)
    const x = randInt(rng, 2, 9)
    return { text: (c * x) + '÷□=' + c, answer: String(x) }
  }
  const b = randInt(rng, 2, 9)
  const c = randInt(rng, 2, 9)
  return { text: '□÷' + b + '=' + c, answer: String(b * c) }
}

// 简单四则求值器：支持 + - × ÷ 与括号，先乘除后加减（生成器保证除法整除，此处整除取商）
function evalExpressionOf(expr) {
  const s = String(expr).replace(/\s+/g, '').replace(/=$/, '')
  let i = 0
  const parseExpr = () => {
    let v = parseTerm()
    while (i < s.length && (s[i] === '+' || s[i] === '-')) {
      const op = s[i]
      i += 1
      const r = parseTerm()
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  const parseTerm = () => {
    let v = parseFactor()
    while (i < s.length && (s[i] === '×' || s[i] === '÷')) {
      const op = s[i]
      i += 1
      const r = parseFactor()
      v = op === '×' ? v * r : Math.floor(v / r)
    }
    return v
  }
  const parseFactor = () => {
    if (s[i] === '(') {
      i += 1
      const v = parseExpr()
      if (s[i] === ')') i += 1
      return v
    }
    let n = ''
    while (i < s.length && s[i] >= '0' && s[i] <= '9') {
      n += s[i]
      i += 1
    }
    return n === '' ? 0 : Number(n)
  }
  return parseExpr()
}

// 解填空题：3+□=7 / □-4=6 / □×3=12 / 12÷□=4 等，返回缺失的数（字符串），不匹配返回 ''
function solveBlankOf(text) {
  const m = /^(\d+|□)([+\-×÷])(\d+|□)=(\d+)$/.exec(String(text).replace(/\s+/g, ''))
  if (!m) return ''
  const a = m[1] === '□' ? null : Number(m[1])
  const op = m[2]
  const b = m[3] === '□' ? null : Number(m[3])
  const c = Number(m[4])
  if (op === '+') return String(c - (a === null ? b : a))
  if (op === '-') return a === null ? String(c + b) : String(a - c)
  if (op === '×') return String(c / (a === null ? b : a))
  return a === null ? String(c * b) : String(a / c)
}

// 每题的标准答案：比大小/填空特殊处理；其余按四则求值（单独 a÷b 不整除时返回「商……余数」）
function expectedAnswerOf(text) {
  const t = String(text).trim()
  if (t.includes('○')) {
    const parts = t.split('○')
    const lv = evalExpressionOf(parts[0])
    const rv = evalExpressionOf(parts[1])
    return lv > rv ? '>' : lv < rv ? '<' : '='
  }
  if (t.includes('□')) return solveBlankOf(t)
  const expr = t.replace(/=\s*$/, '')
  const div = /^(\d+)÷(\d+)$/.exec(expr)
  if (div) {
    const a = Number(div[1])
    const b = Number(div[2])
    const q = Math.floor(a / b)
    const r = a % b
    return r === 0 ? String(q) : q + '……' + r
  }
  return String(evalExpressionOf(expr))
}

// 组卷配置归一化：题型集合按固定顺序规范化、非法值回退默认，保证「同配置」含义稳定
function normalizeWorksheetConfig(config) {
  const c = config && typeof config === 'object' ? config : {}
  const rawTypes = Array.isArray(c.types) ? c.types : []
  const types = WORKSHEET_TYPES.filter((t) => rawTypes.includes(t))
  const a = c.addsub && typeof c.addsub === 'object' ? c.addsub : {}
  return {
    types: types.length ? types : ['addsub'],
    count: Math.min(200, Math.max(1, Math.floor(Number(c.count) || 30))),
    addsub: {
      range: ADDSUB_RANGES.includes(a.range) ? a.range : 20,
      op: ['add', 'sub', 'mixed'].includes(a.op) ? a.op : 'mixed',
      terms: a.terms === 3 ? 3 : 2,
      carry: !!a.carry
    },
    mulMode: c.mulMode === 'two' ? 'two' : 'table',
    divMode: c.divMode === 'remainder' ? 'remainder' : 'exact',
    mixedParen: !!c.mixedParen
  }
}

// 按题型派发到对应生成器，出 1 道题
function genQuestionOf(type, config, rng) {
  if (type === 'addsub') {
    return genAddSub(config.addsub.range, config.addsub.op, 1, rng, {
      carry: config.addsub.carry,
      terms: config.addsub.terms
    })[0]
  }
  if (type === 'mul') return genMul(config.mulMode, rng)
  if (type === 'div') return genDiv(config.divMode, rng)
  if (type === 'mixed') return genMixed(rng, config.mixedParen)
  if (type === 'compare') return genCompare(rng, config.addsub.range)
  return genBlank(rng, config.addsub.range)
}

// 组卷：题型均等配额 + 确定性洗牌 + 去重重试；同 config 同 seed 输出逐题完全一致
function buildWorksheet(config, seed) {
  const cfg = normalizeWorksheetConfig(config)
  const rng = mulberry32(Number(seed) >>> 0)
  const slots = []
  for (let i = 0; i < cfg.count; i++) slots.push(cfg.types[i % cfg.types.length])
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = slots[i]
    slots[i] = slots[j]
    slots[j] = tmp
  }
  const items = []
  const answers = []
  const seen = new Set()
  for (let i = 0; i < slots.length; i++) {
    let q = null
    for (let attempt = 0; attempt < 8; attempt++) {
      q = genQuestionOf(slots[i], cfg, rng)
      if (!seen.has(q.text)) break
    }
    seen.add(q.text)
    items.push({ no: i + 1, text: q.text })
    answers.push({ no: i + 1, answer: q.answer })
  }
  return { items, answers }
}

// 自校验：用独立求值器逐题重算答案，返回通过数与错题号列表
function checkWorksheet(items, answers) {
  const list = Array.isArray(items) ? items : []
  const map = new Map()
  for (const a of Array.isArray(answers) ? answers : []) map.set(a.no, String(a.answer))
  let passed = 0
  const failed = []
  for (const it of list) {
    const expected = expectedAnswerOf(it.text)
    const actual = map.has(it.no) ? String(map.get(it.no)) : ''
    if (expected !== '' && expected === actual) passed += 1
    else failed.push(it.no)
  }
  return { total: list.length, passed, failed }
}

// 复制用纯文本：每行 cols 题，制表符分隔
function worksheetPlainText(items, cols) {
  const list = Array.isArray(items) ? items : []
  const n = Math.max(1, Math.floor(Number(cols) || 3))
  const lines = []
  for (let i = 0; i < list.length; i += n) {
    lines.push(list.slice(i, i + n).map((it) => it.no + '. ' + it.text).join('\t'))
  }
  return lines.join('\n')
}

// ---------- 页面状态与交互 ----------
const TYPE_OPTIONS = [
  { id: 'addsub', label: '加减法' },
  { id: 'mul', label: '乘法' },
  { id: 'div', label: '除法' },
  { id: 'mixed', label: '混合两步' },
  { id: 'compare', label: '比大小' },
  { id: 'blank', label: '填空' }
]
const RANGE_OPTIONS = [
  { value: 10, label: '10 以内' },
  { value: 20, label: '20 以内' },
  { value: 100, label: '100 以内' },
  { value: 1000, label: '1000 以内' }
]
const COUNT_OPTIONS = [20, 30, 50, 100]
const COL_OPTIONS = [2, 3, 4]
const DEFAULT_HEADER = '口算练习 · ____年__月__日 · 用时____分____秒'

const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const types = ref(['addsub', 'mul', 'div'])
const addsubOp = ref('mixed')
const addsubTerms = ref(2)
const addsubRange = ref(20)
const addsubCarry = ref(false)
const mulMode = ref('table')
const divMode = ref('exact')
const mixedParen = ref(false)
const count = ref(30)
const cols = ref(3)
const fontMode = ref('standard')
const showAnswers = ref(true)
const headerText = ref(DEFAULT_HEADER)
const seedInput = ref('')
const activeSeed = ref(20261103) // 首屏用固定种子保证 SSR 与客户端渲染一致；onMounted 后换随机种子
const viewMode = ref('questions')
const seoContentVisible = ref(true)
const typeTip = ref('')
const copied = ref(false)
let copiedTimer = null

const worksheet = ref({ items: [], answers: [] })
const selfCheck = ref({ total: 0, passed: 0, failed: [] })

const worksheetConfig = computed(() => ({
  types: types.value.slice(),
  count: count.value,
  addsub: {
    range: addsubRange.value,
    op: addsubOp.value,
    terms: addsubTerms.value,
    carry: addsubCarry.value
  },
  mulMode: mulMode.value,
  divMode: divMode.value,
  mixedParen: mixedParen.value
}))

// 按当前种子重新组卷并自校验（纯函数，SSR 阶段也可安全执行）
function rebuild() {
  worksheet.value = buildWorksheet(worksheetConfig.value, activeSeed.value)
  selfCheck.value = checkWorksheet(worksheet.value.items, worksheet.value.answers)
}
watch(worksheetConfig, rebuild)
rebuild()

// 题型开关：至少保留 1 种，试图全关时回拨并提示
function toggleType(id, e) {
  const checked = e.target.checked
  const next = checked ? [...types.value, id] : types.value.filter((t) => t !== id)
  if (!next.length) {
    e.target.checked = true
    typeTip.value = '至少需要保留 1 种题型'
    return
  }
  types.value = next
  typeTip.value = ''
}

// 解析种子输入：空或非法返回 null（表示随机）
function seedFromInput() {
  const raw = String(seedInput.value).trim()
  if (raw === '') return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? Math.abs(n) >>> 0 : null
}

// 9 位正整数随机种子（仅回调中调用，SSR 安全）
function randomSeed() {
  return Math.floor(Math.random() * 900000000) + 100000000
}

// 手动输入种子后回车 / 失焦：空则视为随机，有值则复现
function applySeedInput() {
  const s = seedFromInput()
  activeSeed.value = s === null ? randomSeed() : s
  rebuild()
}

// 重新生成：换一个新随机种子（同时清空输入框，表示「当前卷来自随机」）
function regenerate() {
  seedInput.value = ''
  activeSeed.value = randomSeed()
  rebuild()
}

function printWorksheet() {
  window.print()
}

// 复制纯文本版：每行 N 题制表符分隔（N = 列数）
async function copyPlainText() {
  const text = worksheetPlainText(worksheet.value.items, cols.value)
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
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
      copiedTimer = null
    }, 2000)
  } catch (err) {
    typeTip.value = '复制失败，请手动选择预览中的题目文本复制'
  }
}

// ---------- A4 排版（mm 为单位，屏幕缩放预览、打印还原物理尺寸） ----------
const MM_PX = 96 / 25.4
const SHEET_W_MM = 210
const FONT_MM = { standard: 4.2, large: 5.4 }
const ROW_GAP_MM = { standard: 7.5, large: 9 }

const fontMm = computed(() => (fontMode.value === 'large' ? FONT_MM.large : FONT_MM.standard))
const rowGapMm = computed(() => (fontMode.value === 'large' ? ROW_GAP_MM.large : ROW_GAP_MM.standard))

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(' + cols.value + ', 1fr)',
  columnGap: '6mm',
  rowGap: rowGapMm.value + 'mm',
  alignContent: 'start'
}))

const sheetStyle = computed(() => ({
  width: SHEET_W_MM + 'mm',
  minHeight: '297mm',
  padding: '14mm 13mm',
  fontSize: fontMm.value + 'mm'
}))

// 预览缩放：屏幕上把 210mm 宽的卷面缩放到面板宽度内，打印时还原
const previewWrapRef = ref(null)
const previewStackRef = ref(null)
const previewScale = ref(1)
const stackH = ref(0)
let resizeObserver = null
const pageWpx = SHEET_W_MM * MM_PX

const holderStyle = computed(() => ({
  width: pageWpx * previewScale.value + 'px',
  height: stackH.value > 0 ? stackH.value * previewScale.value + 'px' : 'auto'
}))

const stackStyle = computed(() => ({
  width: pageWpx + 'px',
  transform: 'scale(' + previewScale.value + ')',
  transformOrigin: 'top left'
}))

function updateScale() {
  const wrap = previewWrapRef.value
  if (!wrap) return
  const avail = wrap.clientWidth
  if (avail > 0) previewScale.value = Math.min(1, (avail - 2) / pageWpx)
  if (previewStackRef.value) stackH.value = previewStackRef.value.offsetHeight
}

// 关闭答案页时若正停留在答案页视图，切回题目页
watch(showAnswers, (v) => {
  if (!v && viewMode.value === 'answers') viewMode.value = 'questions'
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// @page 规则单独注入（静态内容，A4 竖版 + 12mm 页边距）
const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  activeSeed.value = randomSeed()
  rebuild()
  updateScale()
  if (typeof ResizeObserver !== 'undefined' && previewWrapRef.value) {
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(previewWrapRef.value)
    if (previewStackRef.value) resizeObserver.observe(previewStackRef.value)
  }
  addRecentTool('math-worksheet-printer')
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (copiedTimer) {
    clearTimeout(copiedTimer)
    copiedTimer = null
  }
})
</script>

<style scoped>
/* 屏幕上的 A4 卷面 */
.a4-sheet {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  border-radius: 2px;
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.pages-stack > .a4-sheet + .a4-sheet {
  margin-top: 16px;
}
.sheet-header {
  font-size: 0.8em;
  color: #374151;
  border-bottom: 1.5px solid #d1d5db;
  padding-bottom: 3mm;
  margin-bottom: 8mm;
  white-space: pre-wrap;
  font-variant-numeric: tabular-nums;
}
.q-item {
  line-height: 1.5;
  font-variant-numeric: tabular-nums; /* 等宽数字排版，列内对齐 */
  break-inside: avoid;
  page-break-inside: avoid;
}
.q-no {
  display: inline-block;
  min-width: 2.4em;
  color: #6b7280;
}
.q-answer {
  color: #1e40af;
}

@media print {
  .no-print {
    display: none !important;
  }
  /* 打印时放开布局壳层：左右分栏改为通栏，保证 A4 卷面完整输出 */
  .print-grid {
    display: block !important;
  }
  .print-area {
    width: auto !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .preview-holder {
    width: auto !important;
    height: auto !important;
  }
  .pages-stack {
    transform: none !important;
    width: auto !important;
  }
  /* 覆盖 v-show 的 display:none：打印时题目页与答案页都输出 */
  .a4-sheet {
    display: block !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    width: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin-top: 0 !important;
  }
  .pages-stack > .a4-sheet + .a4-sheet {
    margin-top: 0 !important;
  }
  /* 答案页另起一页（仅在开启答案页时给题目页加分页符，避免输出空白页） */
  .sheet-break {
    break-after: page;
    page-break-after: always;
  }
}
</style>
