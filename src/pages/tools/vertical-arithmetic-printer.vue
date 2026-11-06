<template>
  <div class="max-w-8xl mx-auto">
    <!-- 全局 @page 规则：A4 竖版、12mm 页边距（打印对话框中缩放保持 100% 即与预览一致） -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Calculator class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">竖式计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">加减乘除竖式练习纸生成打印：可调位数与进退位，长除法骨架，附独立答案页</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线小学竖式计算题生成器：加法、减法、乘法（多位×一位 / 多位×两位）与带余数除法（长除骨架）四种题型，
        运算数位数（2/3/4 位）可调，加法可选必含进位 / 无进位 / 混合，减法可选必含退位 / 无退位 / 混合，
        每题按竖式对齐排版、结果行留空给学生填写，可选进退位小灰格辅助标注，A4 每页 1-3 栏排布并附独立答案页。
        填写相同的随机种子随时再生成完全相同的一份卷，方便补打与全班同卷。全部题目在浏览器本地生成，不上传任何数据。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：出题设置 -->
      <div class="no-print space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Calculator class="w-5 h-5 mr-2 text-primary" /> 题型与难度
            </h2>
            <span class="text-xs text-muted-foreground">已选 {{ ops.length }} / {{ OP_OPTIONS.length }} 种</span>
          </div>

          <!-- 题型多选（至少保留 1 种） -->
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="opt in OP_OPTIONS"
              :key="opt.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition"
              :class="ops.includes(opt.id) ? 'bg-primary/10 border-primary/40 text-primary font-medium' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
            >
              <input
                type="checkbox"
                class="accent-primary w-4 h-4"
                :checked="ops.includes(opt.id)"
                @change="toggleOp(opt.id, $event)"
              />
              {{ opt.label }}
            </label>
          </div>
          <p v-if="opTip" class="text-xs text-amber-600 flex items-center gap-1">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ opTip }}
          </p>

          <div class="border-t border-border pt-4 space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-muted-foreground mb-1">运算数位数</label>
                <select v-model.number="digits" :class="SEL_CLS">
                  <option :value="2">两位数</option>
                  <option :value="3">三位数</option>
                  <option :value="4">四位数</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-muted-foreground mb-1">乘法形式</label>
                <select v-model="mulMode" :class="SEL_CLS">
                  <option value="one">多位×一位</option>
                  <option value="two">多位×两位</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs text-muted-foreground mb-1">加法进位</label>
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="m in CARRY_MODES"
                  :key="m.id"
                  type="button"
                  @click="addCarry = m.id"
                  class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                  :class="addCarry === m.id ? BTN_ON : BTN_OFF"
                >
                  {{ m.label }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs text-muted-foreground mb-1">减法退位</label>
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="m in CARRY_MODES"
                  :key="'s' + m.id"
                  type="button"
                  @click="subBorrow = m.id"
                  class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                  :class="subBorrow === m.id ? BTN_ON : BTN_OFF"
                >
                  {{ m.label }}
                </button>
              </div>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              「必含进位」保证个位两数之和 ≥ 10（如 45+58）；「必含退位」保证被减数个位小于减数个位（如 32-18）。
              除法固定为带余数的长除法：除数一位数、被除数与所选位数一致，余数小于除数，答案页给出商与余数。
            </p>
          </div>
        </div>

        <!-- 版式与输出 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 版式与输出
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">题数</label>
              <select v-model.number="count" :class="SEL_CLS">
                <option v-for="n in COUNT_OPTIONS" :key="n" :value="n">{{ n }} 题</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">每页栏数</label>
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="c in COL_OPTIONS"
                  :key="c"
                  type="button"
                  @click="cols = c"
                  class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                  :class="cols === c ? BTN_ON : BTN_OFF"
                >
                  {{ c }} 栏
                </button>
              </div>
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="carryAssist" type="checkbox" class="accent-primary w-4 h-4" />
            进退位小灰格（在数位间上方印小方格，供标注进位数 / 退位点）
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="showAnswers" type="checkbox" class="accent-primary w-4 h-4" />
            附加答案页（卷尾单独一页，含商与余数）
          </label>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">页眉（打印在题目上方，可直接修改）</label>
            <input
              v-model="headerText"
              type="text"
              :class="SEL_CLS"
              placeholder="竖式计算练习 · ____年__月__日 · 用时____分____秒"
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
            <button
              @click="printWorksheet"
              class="w-full px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印 / PDF
            </button>
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
            共 {{ worksheet.items.length }} 题 · {{ cols }} 栏排版 · 当前种子 {{ activeSeed }}
          </span>
        </div>

        <div class="sheet-scroll w-full">
          <div class="pages-stack mx-auto" style="width: 210mm; max-width: none">
            <!-- 题目页 -->
            <div
              v-show="viewMode === 'questions'"
              class="a4-sheet"
              :class="{ 'sheet-break': showAnswers }"
              :style="sheetStyle"
            >
              <p class="sheet-header">{{ headerText }}</p>
              <div class="q-grid" :style="gridStyle">
                <div v-for="it in layoutItems" :key="it.no" class="vq-item">
                  <span class="q-no">{{ it.no }}.</span>
                  <!-- 加减乘：竖式对齐，结果行留空 -->
                  <div v-if="!it.isDiv" class="vq" :style="{ fontSize: qFontSize }">
                    <div v-if="carryAssist" class="vq-row vq-assist">
                      <span class="vq-op"></span>
                      <span v-for="i in it.width" :key="'a' + i" class="vq-cell vq-carry-slot"><i class="vq-carry-box"></i></span>
                    </div>
                    <div class="vq-row">
                      <span class="vq-op"></span>
                      <span v-for="(c, i) in it.topCells" :key="'t' + i" class="vq-cell">{{ c }}</span>
                    </div>
                    <div class="vq-row">
                      <span class="vq-op">{{ it.op }}</span>
                      <span v-for="(c, i) in it.bottomCells" :key="'b' + i" class="vq-cell">{{ c }}</span>
                    </div>
                    <div class="vq-row vq-result">
                      <span class="vq-op"></span>
                      <span v-for="i in it.width" :key="'r' + i" class="vq-cell"></span>
                    </div>
                  </div>
                  <!-- 除法：长除骨架（商空行 + 除数|被除数 + 中间过程留空） -->
                  <div v-else class="vq vq-div" :style="{ fontSize: qFontSize }">
                    <div class="vq-row vq-quotient">
                      <span v-for="i in it.width" :key="'q' + i" class="vq-cell"></span>
                    </div>
                    <div class="vq-row">
                      <span class="vq-divisor">{{ it.b }}</span>
                      <span class="vq-bracket"></span>
                      <span v-for="(c, i) in it.divDigits" :key="'d' + i" class="vq-cell vq-dividend">{{ c }}</span>
                    </div>
                    <div class="vq-row vq-work">
                      <span class="vq-divisor"></span>
                      <span class="vq-bracket-side"></span>
                      <span v-for="i in it.width" :key="'w1' + i" class="vq-cell"></span>
                    </div>
                    <div class="vq-row vq-work">
                      <span class="vq-divisor"></span>
                      <span class="vq-bracket-side"></span>
                      <span v-for="i in it.width" :key="'w2' + i" class="vq-cell"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 答案页（单独一页，仅题号 + 完整答案，除法含商与余数） -->
            <div
              v-if="showAnswers"
              v-show="viewMode === 'answers'"
              class="a4-sheet answer-sheet"
              :style="sheetStyle"
            >
              <p class="sheet-header">{{ headerText }} · 参考答案</p>
              <div class="q-grid" :style="gridStyle">
                <p v-for="a in layoutItems" :key="'ans' + a.no" class="q-item q-answer">
                  <span class="q-no">{{ a.no }}.</span>{{ a.answerText }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时缩放请选「100% / 实际大小」，本页已按 A4 竖版、12mm 页边距排版；打印只会输出题目页（若开启答案页则另起一页附加在卷尾），
          设置面板与页面其余内容不会被打出来。题数较多时会自动分页，每道竖式完整不断开。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>竖式计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          竖式计算器是一款面向小学家长与老师的免费在线竖式练习纸生成工具。它生成四种题型的竖式计算题——加法、减法、
          乘法（多位×一位或多位×两位）与带余数除法（长除骨架），运算数位数可选两位 / 三位 / 四位，加法可选必含进位 / 无进位 / 混合，
          减法可选必含退位 / 无退位 / 混合。每道题按标准竖式排版：运算数按位对齐、运算符与横线齐全、结果行留空由学生填写；
          开启「进退位小灰格」后会在数位间上方印出小方格，供孩子标注进位数与退位点。卷面按 A4 每页 1-3 栏排布，
          可附一页独立参考答案（除法含商与余数）。出题核心是确定性的 mulberry32 随机数：同一种子配同样设置，任何时候都能逐题复现同一份卷。
          全部生成与排版都在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">进位和退位应该怎么练？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          进位加法（如 45+58，个位 5+8=13 要向十位进 1）和退位减法（如 32-18，个位 2 不够减要向十位借 1）是两位数
          运算的核心难点，一般安排在一年级下学期到二年级上学期集中练习。建议路径：先用「无进位 / 无退位」档巩固数位对齐的习惯，
          再切到「必含进位 / 必含退位」档专攻难点，最后用「混合」档模拟真实作业。开启小灰格后，孩子在进位处把小数字写进格子里，
          能显著减少「忘了加进上来的 1」这类错误；熟练后关掉小灰格，过渡到心算标注。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">长除法竖式的书写步骤</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具的除法题印好了长除骨架：除数写在左边，被除数在括线内，括线上方的空行留给商，下方空白区域留给中间的
          「商×除数」与相减过程。书写口诀：一除（看被除数前几位够不够除）、二商（商写在对应位上方）、三乘（商×除数写在被除数下面）、
          四减（相减得余数）、五比（余数必须比除数小）、六落（落下一位接着除）。答案页按「商……余数」书写（如 158÷3=52……2），
          与课堂习惯一致，孩子做完可直接对照验算：商×除数+余数应等于被除数。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么同种子能出同一份卷？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          工具的出题随机数不是取系统时间，而是使用确定性的 mulberry32 算法：给定一个种子数字，它产生的随机数序列完全固定，
          因此「同一种子 + 同样设置」在任何时候、任何设备上都会生成逐题一致的卷子。典型场景：老师把同一个种子布置给全班，
          全班同卷便于对比讲评；卷子打丢了或想补打答案页，填回原种子即可。想换新卷，点「重新生成」就会换一个新随机种子。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">「必含进位」是怎么保证的？</h3>
            <p class="text-sm text-muted-foreground mt-1">生成器按数位构造题目：勾选必含进位时保证个位两个数字之和 ≥ 10（如 45+58），无进位档则保证每一列两数之和都不超过 9；减法同理，必含退位保证被减数个位小于减数个位（如 32-18），无退位档保证每一列被减数数字都不小于减数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">除法竖式里商和余数怎么给？</h3>
            <p class="text-sm text-muted-foreground mt-1">题目页只印长除骨架（除数、括线、被除数与空白区），商与中间过程全部留空；答案页给出完整结果，按「商……余数」书写（如 158÷3=52……2），并保证余数小于除数、商与余数都非负。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印会带出按钮和设置吗？答案怎么打？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。打印样式已隐藏页面其余内容，只输出 A4 题目卷；勾选「附加答案页」时会另起一页单独打印参考答案（含题号），方便自批或家长批改。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">每页栏数怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1">两位数题建议 2-3 栏，三、四位数或多位×两位乘法建议 1-2 栏，保证竖式有足够宽度。题数多时会自动分页，每道竖式完整不断开。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的题目会上传或保存吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有题目都在你的浏览器里即时生成，不发送任何网络请求，也不做本地存储；想保留哪份卷就把它的种子数字记下来。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'vertical-arithmetic-printer'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Calculator, Printer, RefreshCw, TriangleAlert,
  ChevronUp, ChevronDown, Info, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '竖式计算器 - 小学竖式计算题生成打印（加减乘除带答案）',
  description: '免费在线竖式计算器：加法、减法、乘法（多位×一位/两位）与带余数长除法竖式自动生成，位数2/3/4可调，进位退位可控制并附小灰格标注，A4每页1-3栏排版直接打印并附独立答案页，随机种子同码同卷可复现，纯浏览器本地生成不上传',
  keywords: '竖式计算器,竖式计算题打印,竖式生成器,进位退位练习,长除法竖式,小学数学竖式',
  author: '有条工具',
  ogTitle: '竖式计算器 - 小学竖式计算题生成打印（带答案） | 有条工具',
  ogDescription: '加减乘除竖式自动生成，位数与进退位可调，长除法骨架，A4 多栏排版直接打印，可附答案页，同种子同卷可复现。',
  ogUrl: 'https://www.util.cn/tools/vertical-arithmetic-printer',
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
          name: '竖式计算器',
          url: 'https://www.util.cn/tools/vertical-arithmetic-printer',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '四种题型：加法/减法/乘法/带余数除法（长除骨架）',
            '运算数位数 2/3/4 位可调',
            '加法进位与减法退位三档控制（必含/无/混合）',
            '进退位小灰格辅助标注开关',
            'mulberry32 确定性种子，同种子同卷可复现',
            'A4 每页 1-3 栏排版，独立答案页（除法含商与余数）'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '竖式计算器', item: 'https://www.util.cn/tools/vertical-arithmetic-printer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '「必含进位」是怎么保证的？',
              acceptedAnswer: { '@type': 'Answer', text: '生成器按数位构造题目：必含进位时保证个位两个数字之和≥10（如45+58），无进位档保证每一列两数之和都不超过9；减法同理，必含退位保证被减数个位小于减数个位（如32-18）。' }
            },
            {
              '@type': 'Question',
              name: '除法竖式里商和余数怎么给？',
              acceptedAnswer: { '@type': 'Answer', text: '题目页只印长除骨架（除数、括线、被除数与空白区），商与中间过程全部留空；答案页给出完整结果，按商……余数书写（如158÷3=52……2），并保证余数小于除数。' }
            },
            {
              '@type': 'Question',
              name: '打印会带出按钮和设置吗？答案怎么打？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。打印样式已隐藏页面其余内容，只输出A4题目卷；勾选附加答案页时会另起一页单独打印参考答案（含题号），方便自批或家长批改。' }
            },
            {
              '@type': 'Question',
              name: '为什么同种子能出同一份卷？',
              acceptedAnswer: { '@type': 'Answer', text: '出题随机数使用确定性的mulberry32算法：同一种子配同样设置，任何时候任何设备都生成逐题一致的卷子；点重新生成即换新种子出新卷。' }
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

// 恰好 d 位（无前导零）的随机正整数
function randExactDigits(rng, d) {
  const lo = Math.pow(10, d - 1)
  return lo + Math.floor(rng() * (lo * 9))
}

// 任意一列是否出现进位（任意数位两数字之和 ≥ 10）
function hasAnyCarry(a, b) {
  let x = a
  let y = b
  while (x > 0 || y > 0) {
    if ((x % 10) + (y % 10) >= 10) return true
    x = Math.floor(x / 10)
    y = Math.floor(y / 10)
  }
  return false
}

// 是否出现退位（任一数位被减数数字小于减数数字，要求 a ≥ b）
function hasAnyBorrow(a, b) {
  let x = a
  let y = b
  while (y > 0) {
    if ((x % 10) < (y % 10)) return true
    x = Math.floor(x / 10)
    y = Math.floor(y / 10)
  }
  return false
}

// 用新个位替换 n 的个位（不改变位数）
function withOnes(n, ones) {
  return n - (n % 10) + ones
}

// 加法出一对运算数：mode 'must' 保证个位和 ≥ 10（个位进位）；'none' 保证每列都不进位；'mixed' 各半
function genAddPair(rng, d, mode) {
  const want = mode === 'mixed' ? (rng() < 0.5 ? 'must' : 'none') : mode
  if (want === 'must') {
    for (let i = 0; i < 300; i++) {
      const x = randInt(rng, 1, 9)
      const y = randInt(rng, 10 - x, 9) // x + y ≥ 10
      const a = withOnes(randExactDigits(rng, d), x)
      const b = withOnes(randExactDigits(rng, d), y)
      if ((a % 10) + (b % 10) >= 10) return { a, b }
    }
    // 兜底：95..5 + 10..5 形式（个位 5+5=10 必进位，均为 d 位）
    return { a: 9 * Math.pow(10, d - 1) + 5, b: Math.pow(10, d - 1) + 5 }
  }
  // 无进位：逐列构造，每列两数字之和 ≤ 9（最高位均 ≥ 1；col = d-1 为最高位、col = 0 为个位）
  const da = []
  const db = []
  for (let col = d - 1; col >= 0; col--) {
    const xMax = col === d - 1 ? 8 : 9 // 最高位留出 y ≥ 1 的空间
    const x = randInt(rng, col === d - 1 ? 1 : 0, xMax)
    da[col] = x
    db[col] = randInt(rng, col === d - 1 ? 1 : 0, 9 - x)
  }
  let a = 0
  let b = 0
  for (let col = d - 1; col >= 0; col--) {
    a = a * 10 + da[col]
    b = b * 10 + db[col]
  }
  return { a, b }
}

// 减法出一对运算数（a > b）：mode 'must' 保证个位退位（a 个位 < b 个位）；'none' 保证每列都不退位；'mixed' 各半
function genSubPair(rng, d, mode) {
  const want = mode === 'mixed' ? (rng() < 0.5 ? 'must' : 'none') : mode
  if (want === 'must') {
    for (let i = 0; i < 300; i++) {
      const a = randExactDigits(rng, d)
      const b = randExactDigits(rng, d)
      if (b >= a) continue
      if ((a % 10) < (b % 10)) return { a, b }
    }
    // 兜底：9..91 - 1..88（个位 1 < 8 必退位，均为 d 位且 a > b）
    return { a: 9 * Math.pow(10, d - 1) + 1, b: Math.pow(10, d - 1) + 8 }
  }
  // 无退位：逐列构造 a 位数字 ≥ b 位数字，个位严格大于保证 a > b（最高位均 ≥ 1）
  const da = []
  const db = []
  for (let col = d - 1; col >= 0; col--) {
    if (col === d - 1) {
      const x = randInt(rng, 1, 9)
      da[col] = x
      db[col] = randInt(rng, 1, x)
    } else if (col === 0) {
      const x = randInt(rng, 1, 9)
      da[col] = x
      db[col] = randInt(rng, 0, x - 1) // 个位严格小于 → 必 a > b 且本列无退位
    } else {
      const x = randInt(rng, 0, 9)
      da[col] = x
      db[col] = randInt(rng, 0, x)
    }
  }
  let a = 0
  let b = 0
  for (let col = d - 1; col >= 0; col--) {
    a = a * 10 + da[col]
    b = b * 10 + db[col]
  }
  return { a, b }
}

// 乘法：被除数位数 d 的多位 × 一位（2-9）或多位 × 两位（11-99）
function genMulPair(rng, d, mulMode) {
  const a = randExactDigits(rng, d)
  const b = mulMode === 'two' ? randInt(rng, 11, 99) : randInt(rng, 2, 9)
  return { a, b }
}

// 除法：被除数 d 位、除数一位数（2-9），带余数（1 ≤ 余数 < 除数，商 ≥ 1）
function genDivTriple(rng, d) {
  for (let i = 0; i < 300; i++) {
    const a = randExactDigits(rng, d)
    const b = randInt(rng, 2, 9)
    const q = Math.floor(a / b)
    const r = a % b
    if (r >= 1 && q >= 1) return { a, b, q, r }
  }
  // 兜底：99..98 ÷ 9 = 商……8（余数恒为 8）
  const a = Math.pow(10, d) - 2
  const b = 9
  return { a, b, q: Math.floor(a / b), r: 8 }
}

// 生成一道竖式题（含题型 key 与答案文本，除法答案为「商……余数」）
function genVerticalQuestion(kind, cfg, rng) {
  if (kind === 'add') {
    const p = genAddPair(rng, cfg.digits, cfg.addCarry)
    return { kind: 'add', op: '+', a: p.a, b: p.b, key: '+' + p.a + '_' + p.b, answer: String(p.a + p.b) }
  }
  if (kind === 'sub') {
    const p = genSubPair(rng, cfg.digits, cfg.subBorrow)
    return { kind: 'sub', op: '-', a: p.a, b: p.b, key: '-' + p.a + '_' + p.b, answer: String(p.a - p.b) }
  }
  if (kind === 'mul') {
    const p = genMulPair(rng, cfg.digits, cfg.mulMode)
    return { kind: 'mul', op: '×', a: p.a, b: p.b, key: '*' + p.a + '_' + p.b, answer: String(p.a * p.b) }
  }
  const t = genDivTriple(rng, cfg.digits)
  return { kind: 'div', op: '÷', a: t.a, b: t.b, q: t.q, r: t.r, key: '/' + t.a + '_' + t.b, answer: t.q + '……' + t.r }
}

// 配置归一化：非法值回退默认，保证「同配置」含义稳定
function normalizeVerticalConfig(config) {
  const c = config && typeof config === 'object' ? config : {}
  const rawOps = Array.isArray(c.ops) ? c.ops : []
  const ops = ['add', 'sub', 'mul', 'div'].filter((k) => rawOps.includes(k))
  return {
    ops: ops.length ? ops : ['add'],
    digits: [2, 3, 4].includes(c.digits) ? c.digits : 2,
    addCarry: ['must', 'none', 'mixed'].includes(c.addCarry) ? c.addCarry : 'mixed',
    subBorrow: ['must', 'none', 'mixed'].includes(c.subBorrow) ? c.subBorrow : 'mixed',
    mulMode: c.mulMode === 'two' ? 'two' : 'one',
    count: Math.min(30, Math.max(1, Math.floor(Number(c.count) || 9)))
  }
}

// 组卷：题型均等配额 + 确定性洗牌 + 去重重试；同 config 同 seed 输出逐题完全一致
function buildVerticalWorksheet(config, seed) {
  const cfg = normalizeVerticalConfig(config)
  const rng = mulberry32(Number(seed) >>> 0)
  const slots = []
  for (let i = 0; i < cfg.count; i++) slots.push(cfg.ops[i % cfg.ops.length])
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
    for (let attempt = 0; attempt < 10; attempt++) {
      q = genVerticalQuestion(slots[i], cfg, rng)
      if (!seen.has(q.key)) break
    }
    seen.add(q.key)
    items.push({ no: i + 1, kind: q.kind, op: q.op, a: q.a, b: q.b, answer: q.answer })
    answers.push({ no: i + 1, answer: q.answer })
  }
  return { items, answers }
}

// 竖式渲染模型：加减乘 → 右对齐数位格；除法 → 长除骨架数位
function layoutVerticalItem(it) {
  if (it.kind === 'div') {
    const divDigits = String(it.a).split('')
    return { ...it, isDiv: true, divDigits, width: divDigits.length, answerText: it.a + '÷' + it.b + '=' + it.answer }
  }
  const lenA = String(it.a).length
  const lenB = String(it.b).length
  const digitCols = Math.max(lenA, lenB)
  const resultCols = it.kind === 'mul' ? lenA + lenB : digitCols + 1
  const width = Math.max(digitCols, resultCols)
  const pad = (s) => {
    const str = String(s)
    return Array(width - str.length).fill('').concat(str.split(''))
  }
  return {
    ...it,
    isDiv: false,
    width,
    topCells: pad(it.a),
    bottomCells: pad(it.b),
    answerText: it.a + it.op + it.b + '=' + it.answer
  }
}

/* PURE-FNS-END */

// ---------- 页面状态与交互 ----------
const OP_OPTIONS = [
  { id: 'add', label: '加法' },
  { id: 'sub', label: '减法' },
  { id: 'mul', label: '乘法' },
  { id: 'div', label: '除法' }
]
const CARRY_MODES = [
  { id: 'must', label: '必含' },
  { id: 'none', label: '无' },
  { id: 'mixed', label: '混合' }
]
const COUNT_OPTIONS = [6, 9, 12, 18, 24]
const COL_OPTIONS = [1, 2, 3]
const DEFAULT_HEADER = '竖式计算练习 · ____年__月__日 · 用时____分____秒'

const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const ops = ref(['add', 'sub', 'mul'])
const digits = ref(2)
const addCarry = ref('mixed')
const subBorrow = ref('mixed')
const mulMode = ref('one')
const count = ref(9)
const cols = ref(2)
const carryAssist = ref(false)
const showAnswers = ref(true)
const headerText = ref(DEFAULT_HEADER)
const seedInput = ref('')
const activeSeed = ref(20261106) // 首屏用固定种子保证 SSR 与客户端渲染一致；onMounted 后换随机种子
const viewMode = ref('questions')
const seoContentVisible = ref(true)
const opTip = ref('')

const worksheet = ref({ items: [], answers: [] })

const worksheetConfig = computed(() => ({
  ops: ops.value.slice(),
  digits: digits.value,
  addCarry: addCarry.value,
  subBorrow: subBorrow.value,
  mulMode: mulMode.value,
  count: count.value
}))

// 按当前种子重新组卷（纯函数，SSR 阶段也可安全执行）
function rebuild() {
  worksheet.value = buildVerticalWorksheet(worksheetConfig.value, activeSeed.value)
}
watch(worksheetConfig, rebuild)
rebuild()

// 竖式渲染模型（纯数据，模板直接渲染）
const layoutItems = computed(() => worksheet.value.items.map((it) => layoutVerticalItem(it)))

// 栏数越多字号略小，保证三栏下多位×两位竖式不超宽
const qFontSize = computed(() => (cols.value === 3 ? '4.8mm' : '5.6mm'))

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(' + cols.value + ', 1fr)',
  columnGap: '8mm',
  rowGap: '10mm',
  alignContent: 'start'
}))

const sheetStyle = computed(() => ({
  width: '210mm',
  minHeight: '297mm',
  padding: '12mm'
}))

// 关闭答案页时若正停留在答案页视图，切回题目页
watch(showAnswers, (v) => {
  if (!v && viewMode.value === 'answers') viewMode.value = 'questions'
})

// 题型开关：至少保留 1 种，试图全关时回拨并提示
function toggleOp(id, e) {
  const checked = e.target.checked
  const next = checked ? [...ops.value, id] : ops.value.filter((t) => t !== id)
  if (!next.length) {
    e.target.checked = true
    opTip.value = '至少需要保留 1 种题型'
    return
  }
  ops.value = next
  opTip.value = ''
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
  trackEvent('工具使用', '重新生成', 'vertical-arithmetic-printer')
}

function printWorksheet() {
  trackEvent('工具结果', '打印', 'vertical-arithmetic-printer')
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// @page 规则单独注入（静态内容，A4 竖版 + 12mm 页边距）
const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  activeSeed.value = randomSeed()
  rebuild()
  addRecentTool('vertical-arithmetic-printer')
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
  font-size: 4mm;
  color: #374151;
  border-bottom: 1.5px solid #d1d5db;
  padding-bottom: 3mm;
  margin-bottom: 8mm;
  white-space: pre-wrap;
  font-variant-numeric: tabular-nums;
}
/* 小屏幕上卷面固定 210mm 宽，允许横向滚动查看 */
.sheet-scroll {
  overflow-x: auto;
}

.q-item {
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
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
  font-size: 5mm;
}

/* 竖式题 */
.vq-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
  break-inside: avoid;
  page-break-inside: avoid;
  font-size: 5.6mm;
}
.vq-item .q-no {
  min-width: 1.6em;
  color: #6b7280;
  font-size: 4mm;
  padding-top: 0.4em;
}
.vq {
  color: #111827;
  line-height: 1;
}
.vq-row {
  display: flex;
  align-items: flex-end;
  height: 2em;
}
.vq-op {
  width: 1.4em;
  text-align: center;
  flex: none;
}
.vq-cell {
  width: 1.55em;
  text-align: center;
  flex: none;
  font-variant-numeric: tabular-nums;
}
.vq-assist {
  height: 0.9em;
  align-items: flex-end;
}
.vq-carry-slot {
  text-align: right;
  padding-right: 0.3em;
  box-sizing: border-box;
}
.vq-carry-box {
  display: inline-block;
  width: 0.6em;
  height: 0.6em;
  border: 1px solid #9ca3af;
}
.vq-result .vq-cell {
  border-top: 1.5px solid #111827;
  height: 1.9em; /* 横线在上方，行内留下方空白供学生写结果 */
}
/* 长除法骨架 */
.vq-quotient {
  height: 1.7em;
  margin-left: 2.55em; /* 除数格(1.7em) + 括线格(0.85em) */
  align-items: flex-end;
}
.vq-divisor {
  width: 1.7em;
  text-align: center;
  flex: none;
}
.vq-bracket {
  width: 0.85em;
  height: 1.9em;
  flex: none;
  border-left: 1.5px solid #111827;
  border-top: 1.5px solid #111827;
}
.vq-bracket-side {
  width: 0.85em;
  height: 1.9em;
  flex: none;
  border-left: 1.5px solid #111827;
}
.vq-dividend {
  border-top: 1.5px solid #111827;
  height: 1.9em;
  line-height: 1.9;
}
.vq-work {
  height: 1.9em;
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
  .sheet-scroll {
    overflow: visible !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .pages-stack {
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
