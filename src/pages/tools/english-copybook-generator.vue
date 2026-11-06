<template>
  <div class="max-w-8xl mx-auto">
    <!-- @page 规则：A4 竖版，页边距跟随设置（毫米级） -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Languages class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">英语字帖生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">四线三格描红字帖：单词句子逐行排版，A4 毫米级页边距直接打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入要练的英文单词或句子（每行一条），即刻生成可打印的 A4 四线三格字帖：每条练习行由顶线、两条中格虚线与底线构成标准三格，
        文字按第三线基线排布；浅灰实心字供描摹，描红行后可自动跟空白行供独立书写。支持每行重复次数、字号档位、原样 / 全大写 / 句首大写
        三种大小写模式与毫米级页边距调节。文字排版使用系统字体（Arial / Segoe UI 等），不下载任何外部字体，打印效果随系统字体略有差异。
        全程本地生成、不上传任何数据。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print-grid">
      <!-- 左栏：设置 -->
      <div class="space-y-6 no-print">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Type class="w-5 h-5 mr-2 text-primary" /> 练习内容
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">单词 / 句子（每行一条，最多 40 行）</label>
            <textarea
              v-model="rawText"
              rows="6"
              placeholder="例如：&#10;apple&#10;banana&#10;I like reading books."
              class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y font-mono"
            />
            <p class="text-xs text-muted-foreground mt-1">当前 {{ practiceLines.length }} 条 · 共 {{ totalRows }} 个练习行 · {{ pageCount }} 页</p>
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1.5">内置模板（点击填入，再自由修改）</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="t in TEMPLATE_SETS"
                :key="t.id"
                type="button"
                @click="applyTemplate(t)"
                class="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition"
                :class="BTN_OFF"
              >
                {{ t.name }}
              </button>
              <button
                type="button"
                @click="randomTemplate"
                class="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition"
                :class="BTN_ON"
              >
                <Dices class="w-3.5 h-3.5 inline -mt-0.5 mr-0.5" /> 随机换一批
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">「随机换一批」按下方种子抽取模板：同一种子永远抽到同一套，方便复现。</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">每行重复次数</label>
              <select v-model.number="repeat" :class="SEL_CLS">
                <option v-for="n in REPEAT_OPTIONS" :key="n" :value="n">{{ n }} 遍</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">描红行后空白行</label>
              <select v-model.number="blankAfter" :class="SEL_CLS">
                <option v-for="n in BLANK_OPTIONS" :key="n" :value="n">{{ n }} 行</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">字号档</label>
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="f in FONT_TIERS"
                  :key="f.id"
                  type="button"
                  @click="fontTier = f.id"
                  class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                  :class="fontTier === f.id ? BTN_ON : BTN_OFF"
                >
                  {{ f.label }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">大小写模式</label>
              <select v-model="caseMode" :class="SEL_CLS">
                <option value="original">原样输入</option>
                <option value="upper">全部大写</option>
                <option value="sentence">句首大写</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 纸张与输出 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 纸张与输出
          </h2>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">页边距（毫米，A4 四周）</label>
            <input
              v-model.number="marginMm"
              type="number"
              min="10"
              max="25"
              step="1"
              :class="SEL_CLS"
            />
            <p class="text-xs text-muted-foreground mt-1">当前 {{ marginSafe }}mm · 每页 {{ rowsPerPage }} 行</p>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">随机模板种子（同一种子 = 同一套模板）</label>
            <input
              v-model="seedInput"
              type="text"
              inputmode="numeric"
              :class="SEL_CLS"
              placeholder="留空则每次随机；如填 42 随时能再抽到同一套"
              @change="applySeedInput"
            />
          </div>
          <button
            @click="printSheet"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Printer class="w-4 h-4" /> 打印字帖（A4）
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            打印时仅输出右侧字帖本体，操作界面自动隐藏；多页会按 A4 逐页分页，每行四线完整不断开。
          </p>
        </div>
      </div>

      <!-- 右栏：A4 字帖预览 -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> A4 预览
          </h2>
          <span class="text-xs text-muted-foreground">共 {{ pageCount }} 页 · 每页 {{ rowsPerPage }} 行 · 描红 {{ repeat }} 遍 + 空白 {{ blankAfter }} 行</span>
        </div>

        <!-- 空态 -->
        <div v-if="!practicePages.length" class="bg-card border border-border rounded-lg p-16 text-center no-print">
          <Languages class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">请先在左侧输入要练习的单词或句子，或点一个内置模板</p>
        </div>

        <div class="sheet-scroll w-full">
          <div class="pages-stack mx-auto" style="width: 210mm; max-width: none">
            <div
              v-for="(page, pi) in practicePages"
              :key="pi"
              class="a4-sheet"
              :class="{ 'sheet-break': pi < practicePages.length - 1 }"
              :style="sheetStyle"
            >
              <div v-for="(row, ri) in page" :key="ri" class="practice-row">
                <svg
                  :width="contentWmm + 'mm'"
                  :height="rowHmm + 'mm'"
                  :viewBox="'0 0 ' + contentWmm + ' ' + rowHmm"
                  preserveAspectRatio="none"
                  class="block"
                >
                  <!-- 四线三格：顶线（实）、第二线（虚）、第三线（虚）、底线（实） -->
                  <line x1="0" :y1="y1" :x2="contentWmm" :y2="y1" class="cl-solid" />
                  <line x1="0" :y1="y2" :x2="contentWmm" :y2="y2" class="cl-dashed" />
                  <line x1="0" :y1="y3" :x2="contentWmm" :y2="y3" class="cl-dashed" />
                  <line x1="0" :y1="y4" :x2="contentWmm" :y2="y4" class="cl-solid" />
                  <!-- 描红层：浅灰实心字，基线落在第三线 -->
                  <text
                    v-if="row.mode === 'trace'"
                    x="2"
                    :y="baselineY"
                    :font-size="fsMm"
                    letter-spacing="0.8"
                    class="trace-text"
                  >{{ row.text }}</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时缩放请选「100% / 实际大小」。字帖文字使用系统字体（Arial / Segoe UI 等）按第三线基线排版，不同操作系统与打印机的字体渲染略有差异：
          大写字母与字母升部（如 b、d、k）可能略微越过第二条虚线、降部字母（如 g、p、y）落在第三、四线之间，属于正常现象，不影响描摹练习。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>英语字帖生成器是什么？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          英语字帖生成器是一款免费在线英文书写练习工具。输入任意英文单词或句子（每行一条），它会按标准四线三格生成可打印的 A4 字帖：
          每条练习行由四条水平线构成三个格——顶线与底线为实线、中间两条为中格虚线，文字按第三线（基线）排布，小写字母的主体落在中格，
          升部朝顶线方向、降部（g、p、q、y）落向底线。浅灰实心字供孩子描摹，描红行之后可自动跟 0-6 个空白行过渡到独立书写。
          支持每行重复 1-10 遍、三档字号、原样 / 全大写 / 句首大写三种大小写模式与 10-25mm 毫米级页边距调节，内容超出时自动按 A4 分页。
          文字渲染使用系统字体（Arial / Segoe UI 等，回退 sans-serif），不下载任何外部字体，因此不同设备的打印效果可能有细微差异。
          全部生成与排版都在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">四线三格怎么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          四线三格从上到下共四条线，把行分成三格：第二格（两条虚线之间）是「中格」，小写字母 a、c、e、m、n、o、u、v、w、x、z 的主体占满中格；
          大写字母与升部字母 b、d、f、h、k、l、t 从基线向上顶到顶线附近；降部字母 g、j、p、q、y 从基线向下探入第三格但不触底线。
          书写口诀：头上有尾巴的（升部）顶上格，有尾巴下探的（降部）下格，其余稳稳站中格。低年级先描红、后临写，
          每写完一行对照范字检查字母是否「站对格」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">描红行和空白行怎么搭配？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          常见搭配是「描 1 行 + 空白 1-2 行」：第一行浅灰范字供描摹建立手感，紧跟的空白行凭记忆独立书写，家长只需批改空白行即可看出掌握程度。
          刚接触书写的孩子可以用「描 2 行 + 空白 1 行」降低难度；复习巩固阶段可以直接全部空白行听写。每行重复次数控制同一内容的练习密度，
          建议单词 3-5 遍、句子 2-3 遍，避免一次抄太多导致疲劳变形。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">大小写模式有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「原样输入」完全保留你输入的内容，适合按课本词表练习；「全部大写」把所有字母转成大写，适合刚认识字母的低龄孩子练字母形状；
          「句首大写」把每行行首以及句号、问号、感叹号之后的第一个字母转为大写，其余保持原样，适合句子抄写时同步练习英文标点与大小写规范。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">字帖用的是什么字体？会和我电脑上看到的不一样吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">工具使用系统字体（Arial、Segoe UI 等，回退 sans-serif），不下载任何外部字体，因此加载快、离线可用；不同操作系统的默认无衬线字体略有差异，打印出来字母形状会有细微不同，但对四线三格占格练习没有影响。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么字母没有正好顶满格线？</h3>
            <p class="text-sm text-muted-foreground mt-1">字号按「小写主体占满中格」适配，大写字母与升部可能略微越过第二条虚线、降部下探深度也随字体略有不同，这是系统字体与手写体比例差异导致的正常现象；范字浅灰描摹时以基线和占格趋势为准即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印时会不会把网页按钮一起打出来？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。打印样式只输出 A4 字帖本体，操作界面与说明文字自动隐藏；多页按 A4 逐页分页，页边距按你设置的毫米数生效。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">一行太长排不下怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">每条练习行最多保留 46 个字符，超长会自动截断；句子建议控制在 40 字符以内，或把长句拆成两行分别练习，也可以改用小字号档。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'english-copybook-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Languages, Type, Printer, FileText, Dices,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '英语字帖生成器 - 四线三格描红字帖在线打印 | 有条工具',
  description: '免费在线英语字帖生成器：输入单词或句子按四线三格生成A4描红字帖，浅灰范字描摹、描红行后自动跟空白行，支持每行重复次数、三档字号、原样/全大写/句首大写与毫米级页边距，多页自动分页，纯本地生成直接打印',
  keywords: '英语字帖生成器,四线三格,英文描红字帖,单词抄写模板,英文字母练习,英语句子字帖打印',
  author: '有条工具',
  ogTitle: '英语字帖生成器 - 四线三格描红字帖在线打印 | 有条工具',
  ogDescription: '单词句子四线三格排版，浅灰描红加空白行过渡独立书写，三档字号与大小写模式，A4 毫米级页边距直接打印。',
  ogUrl: 'https://www.util.cn/tools/english-copybook-generator',
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
          name: '英语字帖生成器',
          url: 'https://www.util.cn/tools/english-copybook-generator',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '标准四线三格：顶线底线实线、中格虚线，文字按第三线基线排布',
            '浅灰描红范字，描红行后可自动跟空白行',
            '每行重复 1-10 遍、三档字号、多页自动分页',
            '原样 / 全大写 / 句首大写三种大小写模式',
            '页边距 10-25mm 毫米级可调',
            '系统字体渲染，零外部字体下载，纯本地生成'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '英语字帖生成器', item: 'https://www.util.cn/tools/english-copybook-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '字帖用的是什么字体？会和我电脑上看到的不一样吗？',
              acceptedAnswer: { '@type': 'Answer', text: '工具使用系统字体（Arial、Segoe UI等，回退sans-serif），不下载任何外部字体；不同系统的默认无衬线字体略有差异，打印出来字母形状会有细微不同，但对四线三格占格练习没有影响。' }
            },
            {
              '@type': 'Question',
              name: '描红行和空白行怎么搭配？',
              acceptedAnswer: { '@type': 'Answer', text: '常见搭配是描1行加空白1-2行：范字描摹建立手感，紧跟的空白行独立书写，批改空白行即可看出掌握程度；初学者可描2行加空白1行，复习阶段可直接全部空白行听写。' }
            },
            {
              '@type': 'Question',
              name: '打印时会不会把网页按钮一起打出来？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。打印样式只输出A4字帖本体，操作界面与说明文字自动隐藏；多页按A4逐页分页，页边距按设置的毫米数生效。' }
            },
            {
              '@type': 'Question',
              name: '一行太长排不下怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '每条练习行最多保留46个字符，超长自动截断；句子建议控制在40字符以内，或拆成两行分别练习，也可以改用小字号档。' }
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

// 内置模板集（每行一条练习内容）
const TEMPLATE_SETS = [
  { id: 'letters', name: '字母表', lines: ['abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] },
  { id: 'numbers', name: '数字', lines: ['0123456789', '10 20 30 40 50 60 70 80 90'] },
  { id: 'family', name: '家庭称呼', lines: ['father', 'mother', 'brother', 'sister', 'grandpa', 'grandma', 'family', 'parents'] },
  { id: 'colors', name: '颜色单词', lines: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'black', 'white', 'brown', 'pink'] },
  { id: 'greetings', name: '日常用语', lines: ['hello', 'thank you', 'good morning', 'good night', 'excuse me', 'how are you', 'nice to meet you', 'see you tomorrow'] },
  { id: 'sentences', name: '常用句', lines: ['The cat sits on the mat.', 'I like to read books.', 'We go to school by bus.', 'My favorite color is blue.', 'Today is a sunny day.'] }
]

// 按种子确定性地抽取一套模板（同一种子永远抽到同一套）
function pickTemplateSet(seed) {
  const rng = mulberry32(Number(seed) >>> 0)
  return TEMPLATE_SETS[Math.floor(rng() * TEMPLATE_SETS.length) % TEMPLATE_SETS.length]
}

// 解析多行输入：每行一条，去空行，最多 40 行、每行最多 46 字符
function parsePracticeLines(raw) {
  const out = []
  const parts = String(raw == null ? '' : raw).split(/\r?\n/)
  for (const p of parts) {
    const s = p.trim()
    if (!s) continue
    out.push(s.length > 46 ? s.slice(0, 46) : s)
    if (out.length >= 40) break
  }
  return out
}

// 文本规范化：'original' 原样 / 'upper' 全大写 / 'sentence' 句首大写（行首与 .!? 后首字母大写，其余不变）
function applyCaseMode(text, mode) {
  const s = String(text == null ? '' : text)
  if (mode === 'upper') return s.toUpperCase()
  if (mode === 'sentence') return s.replace(/(^|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())
  return s
}

// 生成练习行序列：每条内容重复 repeat 遍，每遍 = 1 个描红行 + blankAfter 个空白行
function buildPracticeRows(lines, repeat, blankAfter) {
  const list = Array.isArray(lines) ? lines : []
  const r = Math.min(10, Math.max(1, Math.floor(Number(repeat) || 1)))
  const b = Math.min(6, Math.max(0, Math.floor(Number(blankAfter) || 0)))
  const rows = []
  for (const line of list) {
    for (let i = 0; i < r; i++) {
      rows.push({ text: line, mode: 'trace' })
      for (let k = 0; k < b; k++) rows.push({ text: '', mode: 'blank' })
    }
  }
  return rows
}

// 字号档：lineH 为四线三格总高（mm），gap 为行间距（mm）
const FONT_GEOMETRY = {
  small: { lineH: 8, gap: 3.5 },
  medium: { lineH: 10.5, gap: 4.5 },
  large: { lineH: 13, gap: 5.5 }
}

// 每页可容纳的练习行数：A4 高 297mm，上下各 marginMm 页边距
function rowsPerPageOf(marginMm, rowHmm) {
  const m = Math.min(25, Math.max(10, Number(marginMm) || 15))
  const h = Math.max(1, Number(rowHmm) || 1)
  return Math.max(1, Math.floor((297 - 2 * m) / h))
}

// 按每页容量分页（保持行顺序）
function chunkPages(rows, perPage) {
  const list = Array.isArray(rows) ? rows : []
  const per = Math.max(1, Math.floor(Number(perPage) || 1))
  const pages = []
  for (let i = 0; i < list.length; i += per) pages.push(list.slice(i, i + per))
  return pages
}

/* PURE-FNS-END */

// ---------- 状态 ----------
const REPEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10]
const BLANK_OPTIONS = [0, 1, 2, 3, 4, 5, 6]
const FONT_TIERS = [
  { id: 'small', label: '小' },
  { id: 'medium', label: '中' },
  { id: 'large', label: '大' }
]

const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const rawText = ref('The cat sits on the mat.\nI like to read books.')
const repeat = ref(2)
const blankAfter = ref(1)
const fontTier = ref('medium')
const caseMode = ref('sentence')
const marginMm = ref(15)
const seedInput = ref('')
const activeSeed = ref(20261102) // 首屏用固定种子保证 SSR 与客户端渲染一致；onMounted 后换随机种子
const seoContentVisible = ref(true)

const practiceLines = computed(() => parsePracticeLines(rawText.value))
const geometry = computed(() => FONT_GEOMETRY[fontTier.value] || FONT_GEOMETRY.medium)

// 四线三格几何（viewBox 以 mm 为单位，1:1 映射打印尺寸）
const rowHmm = computed(() => geometry.value.lineH + geometry.value.gap)
const y1 = computed(() => 0)
const y2 = computed(() => +(0.325 * geometry.value.lineH).toFixed(3))
const y3 = computed(() => +(0.6625 * geometry.value.lineH).toFixed(3))
const y4 = computed(() => geometry.value.lineH)
const baselineY = computed(() => y3.value)
const fsMm = computed(() => +((0.3375 * geometry.value.lineH) / 0.52).toFixed(2)) // 小写主体占满中格

const marginSafe = computed(() => Math.min(25, Math.max(10, Math.round(Number(marginMm.value)) || 15)))
const contentWmm = computed(() => 210 - 2 * marginSafe.value)

// 练习行（大小写规范化后）与分页
const totalRows = computed(() => buildPracticeRows(practiceLines.value, repeat.value, blankAfter.value).length)
const rowsPerPage = computed(() => rowsPerPageOf(marginSafe.value, rowHmm.value))
const practicePages = computed(() => {
  const rows = buildPracticeRows(practiceLines.value, repeat.value, blankAfter.value)
  return chunkPages(rows, rowsPerPage.value).map((page) =>
    page.map((row) => ({ mode: row.mode, text: row.mode === 'trace' ? applyCaseMode(row.text, caseMode.value) : '' }))
  )
})
const pageCount = computed(() => practicePages.value.length)

const sheetStyle = computed(() => ({
  width: '210mm',
  minHeight: '297mm',
  padding: marginSafe.value + 'mm'
}))

// @page 页边距跟随设置（毫米级）
const printPageCss = computed(() => '@page { size: A4 portrait; margin: ' + marginSafe.value + 'mm; }')

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

function applySeedInput() {
  const s = seedFromInput()
  activeSeed.value = s === null ? randomSeed() : s
}

function applyTemplate(t) {
  rawText.value = t.lines.join('\n')
}

// 随机换一批模板：按当前种子确定性抽取（同一种子永远抽到同一套）
function randomTemplate() {
  const set = pickTemplateSet(activeSeed.value)
  rawText.value = set.lines.join('\n')
  trackEvent('工具使用', '随机模板', 'english-copybook-generator')
}

function printSheet() {
  trackEvent('工具结果', '打印', 'english-copybook-generator')
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  activeSeed.value = randomSeed()
  addRecentTool('english-copybook-generator')
})
</script>

<style scoped>
/* 屏幕上的 A4 纸张 */
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
/* 小屏幕上纸张固定 210mm 宽，允许横向滚动查看 */
.sheet-scroll {
  overflow-x: auto;
}

.practice-row {
  break-inside: avoid;
  page-break-inside: avoid;
}
.practice-row svg {
  display: block;
}
.cl-solid {
  stroke: #9aa0ab;
  stroke-width: 0.3;
}
.cl-dashed {
  stroke: #9aa0ab;
  stroke-width: 0.28;
  stroke-dasharray: 1.6 1.2;
}
.trace-text {
  fill: #6b7280;
  fill-opacity: 0.35;
  font-family: Arial, 'Segoe UI', 'Helvetica Neue', Helvetica, sans-serif;
}

@media print {
  .no-print {
    display: none !important;
  }
  /* 打印时放开布局壳层：左右分栏改为通栏，保证 A4 纸张完整输出 */
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
  .a4-sheet {
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
  /* 多页逐页分页 */
  .sheet-break {
    break-after: page;
    page-break-after: always;
  }
}
</style>
