<template>
  <div class="max-w-8xl mx-auto copybook-root">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <NotebookPen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">字帖生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">田字格/米字格/回宫格/拼音田字格/英文四线三格，A4 排版直接打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入要练的文字，选格子类型与描红样式，即刻生成可打印的 A4 字帖：文字不足时自动循环填充、可生成多页。支持给常见启蒙字自动注音（内置约 100 个高频字，其余留空并如实提示）。练字打卡、儿童识字、英文字母练习都能用，全程本地生成、不上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 copybook-grid">
      <!-- 左栏：设置 -->
      <div class="space-y-6 no-print">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Type class="w-5 h-5 mr-2 text-primary" /> 字帖内容
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">要练的文字（汉字格会去掉空白并循环填充整页；英文格保留空格）</label>
            <textarea
              v-model="text"
              rows="4"
              maxlength="200"
              placeholder="例如：天地玄黄宇宙洪荒"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
            <p class="text-xs text-muted-foreground mt-1">当前 {{ charCount }} 个字 · 每页 {{ cellsPerPage }} 格</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">格子类型</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="g in gridTypes"
                :key="g.value"
                @click="gridType = g.value"
                :class="gridType === g.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >
                {{ g.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">每行格数</label>
              <input v-model.number="cols" type="number" min="1" max="20" class="w-full px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">行数</label>
              <input v-model.number="rows" type="number" min="1" max="20" class="w-full px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">页数</label>
              <input v-model.number="pages" type="number" min="1" max="20" class="w-full px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <p v-if="!fitsA4Flag" class="text-xs text-amber-600 dark:text-amber-500 bg-amber-500/10 rounded-lg p-2 leading-relaxed">
            按 A4 估算，每格约 {{ cellSizeMm(colsSafe).toFixed(1) }}mm × {{ rowsSafe }} 行{{ showPinyin && gridType !== 'english' ? '（含拼音行）' : '' }}会超出纸张可用高度，建议减少行数或增加每行格数。
          </p>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">描红样式</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="s in traceStyles"
                :key="s.value"
                @click="traceStyle = s.value"
                :class="traceStyle === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <div v-if="gridType !== 'english'" class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <label class="text-sm font-medium text-foreground">显示拼音</label>
              <p class="text-xs text-muted-foreground">田字格上方加拼音行</p>
            </div>
            <input v-model="showPinyin" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
          </div>
          <div v-if="showPinyin && gridType !== 'english' && missingList.length" class="text-xs text-amber-600 dark:text-amber-500 bg-amber-500/10 rounded-lg p-2 leading-relaxed flex items-start gap-1.5">
            <AlertTriangle class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>「{{ missingList.join('、') }}」{{ missingList.length >= 20 ? '等' : '' }}共 {{ missingList.length }} 个字暂无内置注音，对应格子的拼音留空（本工具仅内置约 100 个高频启蒙字的注音，其余如实留空）。</span>
          </div>

          <button
            @click="printSheet"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Printer class="w-4 h-4" /> 打印字帖（A4）
          </button>
          <p class="text-xs text-muted-foreground leading-relaxed">
            打印时仅输出右侧字帖本体，操作界面自动隐藏；多页会按 A4 逐页分页。
          </p>
        </div>
      </div>

      <!-- 右栏：A4 字帖预览 -->
      <div class="lg:col-span-2 space-y-4 copybook-col">
        <div class="flex items-center justify-between no-print">
          <h2 class="text-lg font-semibold flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> 字帖预览
          </h2>
          <span class="text-xs text-muted-foreground">共 {{ sheets.length }} 页 · 每页 {{ rowsSafe }} 行 × {{ colsSafe }} 格</span>
        </div>

        <!-- 空态 -->
        <div v-if="!sheets.length" class="bg-card border border-border rounded-lg p-16 text-center">
          <NotebookPen class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">请先在左侧输入要练习的文字</p>
        </div>

        <!-- 字帖页 -->
        <div
          v-for="(sheet, pi) in sheets"
          :key="pi"
          class="sheet bg-white rounded-lg shadow-sm ring-1 ring-border p-[10mm]"
          :class="{ 'sheet-break': pi < sheets.length - 1 }"
          style="width: min(100%, 200mm)"
        >
          <div
            class="grid border-t border-l border-[#9aa0ab]"
            :style="{ gridTemplateColumns: 'repeat(' + colsSafe + ', minmax(0, 1fr))' }"
          >
            <div
              v-for="(ch, ci) in sheet"
              :key="ci"
              class="cell-box border-r border-b border-[#9aa0ab]"
              style="container-type: inline-size"
            >
              <!-- 拼音行（中文格子类型） -->
              <div
                v-if="showPinyin && gridType !== 'english'"
                class="flex items-center justify-center leading-none text-[#7a828e]"
                style="font-size: 18cqw; height: 20cqw"
              >{{ pinyinFor(ch) }}</div>

              <!-- 格子本体 -->
              <div class="relative w-full" style="aspect-ratio: 1 / 1">
                <!-- 田字格 / 米字格 / 拼音田字格 -->
                <svg v-if="gridType === 'tian' || gridType === 'mi' || gridType === 'pinyin'" viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 w-full h-full">
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#d9a2a2" stroke-width="1.2" stroke-dasharray="4 3" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#d9a2a2" stroke-width="1.2" stroke-dasharray="4 3" />
                  <template v-if="gridType === 'mi'">
                    <line x1="0" y1="0" x2="100" y2="100" stroke="#d9a2a2" stroke-width="1" stroke-dasharray="4 3" />
                    <line x1="100" y1="0" x2="0" y2="100" stroke="#d9a2a2" stroke-width="1" stroke-dasharray="4 3" />
                  </template>
                </svg>
                <!-- 回宫格 -->
                <svg v-else-if="gridType === 'huigong'" viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 w-full h-full">
                  <rect x="28" y="28" width="44" height="44" fill="none" stroke="#d9a2a2" stroke-width="1.4" />
                  <line x1="50" y1="0" x2="50" y2="28" stroke="#d9a2a2" stroke-width="1" stroke-dasharray="3 3" />
                  <line x1="50" y1="72" x2="50" y2="100" stroke="#d9a2a2" stroke-width="1" stroke-dasharray="3 3" />
                  <line x1="0" y1="50" x2="28" y2="50" stroke="#d9a2a2" stroke-width="1" stroke-dasharray="3 3" />
                  <line x1="72" y1="50" x2="100" y2="50" stroke="#d9a2a2" stroke-width="1" stroke-dasharray="3 3" />
                </svg>
                <!-- 英文四线三格 -->
                <svg v-else viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 w-full h-full">
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#9aa0ab" stroke-width="1.4" />
                  <line x1="0" y1="36" x2="100" y2="36" stroke="#9aa0ab" stroke-width="1.2" stroke-dasharray="4 3" />
                  <line x1="0" y1="63" x2="100" y2="63" stroke="#9aa0ab" stroke-width="1.2" stroke-dasharray="4 3" />
                  <line x1="0" y1="90" x2="100" y2="90" stroke="#9aa0ab" stroke-width="1.4" />
                </svg>

                <!-- 范字 -->
                <div
                  v-if="showModel && ch && ch !== ' '"
                  class="absolute inset-0 flex items-center justify-center kai select-none"
                  :class="traceStyle === 'hollow' ? 'hollow-char' : 'gray-char'"
                  style="font-size: 74cqw; line-height: 1"
                  :style="gridType === 'english' ? { fontSize: '56cqw', transform: 'translateY(-8%)' } : {}"
                >{{ ch }}</div>
              </div>
            </div>
          </div>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线字帖生成器</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          字帖生成器可以在浏览器里把任意文字排成 A4 字帖：田字格、米字格、回宫格适合汉字结构与笔顺练习，拼音田字格兼顾儿童识字正音，英文四线三格用于字母与单词书写。
          文字循环填充整页并可多页输出，灰色范字适合描红、空心范字适合临摹轮廓，「无」则留白供独立书写。所有格子用矢量线条绘制，打印清晰、不上传任何内容。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">五种格子怎么选</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><span class="text-foreground font-medium">田字格</span>：纵横虚线定位部件位置，适合已会写、要练间架结构的孩子与成人。</li>
          <li><span class="text-foreground font-medium">米字格</span>：增加对角斜线，练撇捺钩等斜笔走向最有效，初学汉字首选。</li>
          <li><span class="text-foreground font-medium">回宫格</span>：内框提示主体大小，专治「字写得太撑出格」，从田字格过渡到无格书写的关键一步。</li>
          <li><span class="text-foreground font-medium">拼音田字格 / 英文四线三格</span>：分别服务识字正音与字母占格（顶线、中线、基线）练习。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">打印建议</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>浏览器打印对话框中选择 A4、实际大小（缩放 100%），关闭页眉页脚。</li>
          <li>默认每行 8 格 × 10 行约每格 23.7mm，适合铅笔淡描；给低龄孩子可将每行格数改为 5～6，格子更大。</li>
          <li>灰色范字建议用较淡打印（打印机省墨模式），让孩子只能「描」不能「抄」。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><span class="text-foreground font-medium">拼音是从哪来的？准吗？</span>内置约 100 个高频启蒙字的注音表（取最常用读音，多音字按启蒙常见音），表里没有的字拼音留空并在页面上如实提示，绝不瞎编。</li>
          <li><span class="text-foreground font-medium">为什么有的字不显示？</span>中文格子类型会去掉空格与换行后循环填充；英文四线三格保留字母、数字与空格用于单词书写。</li>
          <li><span class="text-foreground font-medium">可以商用打印售卖吗？</span>工具本身免费，字帖版式通用无版权；但请自行确保所练文字内容不侵权。</li>
        </ul>
      </div>
    </div>

    <RelatedTools :currentToolId="'copybook-generator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  NotebookPen, Type, Printer, FileText, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '字帖生成器 - 田字格米字格拼音字帖在线打印 | 有条工具',
  description: '免费在线字帖生成器，输入文字生成田字格/米字格/回宫格/拼音田字格/英文四线三格A4字帖，支持灰色范字与空心描红、自动注音（内置约百个启蒙字）、循环填充多页输出，纯本地生成直接打印',
  keywords: '字帖生成器, 田字格字帖, 米字格, 回宫格, 拼音田字格, 英文四线三格, 描红字帖, A4字帖打印, 练字模板',
  author: '有条工具',
  ogTitle: '字帖生成器 - 在线生成可打印A4字帖',
  ogDescription: '田字格/米字格/回宫格/拼音/英文四线三格，循环填充多页，描红样式可选，纯本地生成',
  ogUrl: 'https://www.util.cn/tools/copybook-generator',
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
          name: '字帖生成器',
          url: 'https://www.util.cn/tools/copybook-generator',
          applicationCategory: 'EducationApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['五种格子类型', '灰色/空心/无描红样式', '常见启蒙字自动注音', '文字循环填充', 'A4多页打印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '更多工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '字帖生成器', item: 'https://www.util.cn/tools/copybook-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '拼音数据从哪里来？没有的字怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '内置约100个高频启蒙字的注音表，取最常用读音；表中没有的字拼音留空，并在页面上如实提示缺注字的清单，不会编造读音。' }
            },
            {
              '@type': 'Question',
              name: '文字不够一格怎么填满整页？',
              acceptedAnswer: { '@type': 'Answer', text: '输入文字去掉空白后按顺序循环填充所有格子，页数、行数、每行格数都可以自定义。' }
            },
            {
              '@type': 'Question',
              name: '打印时会不会把网页按钮一起打出来？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。打印样式只输出A4字帖本体，操作界面与说明文字在打印时自动隐藏，多页按A4逐页分页。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'copybook-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* __PURE_START__ 纯函数区（供 node 自测提取，勿在此使用浏览器 API） */
// 内置高频启蒙字注音表（约百字，取最常用读音，多音字按启蒙常见音）
const PINYIN_TABLE = {
  一: 'yī', 二: 'èr', 三: 'sān', 四: 'sì', 五: 'wǔ', 六: 'liù', 七: 'qī', 八: 'bā', 九: 'jiǔ', 十: 'shí',
  百: 'bǎi', 千: 'qiān', 万: 'wàn',
  人: 'rén', 口: 'kǒu', 手: 'shǒu', 目: 'mù', 耳: 'ěr', 头: 'tóu', 面: 'miàn', 身: 'shēn',
  上: 'shàng', 下: 'xià', 左: 'zuǒ', 右: 'yòu', 中: 'zhōng', 里: 'lǐ', 外: 'wài',
  大: 'dà', 小: 'xiǎo', 多: 'duō', 少: 'shǎo',
  天: 'tiān', 地: 'dì', 日: 'rì', 月: 'yuè', 星: 'xīng', 风: 'fēng', 云: 'yún', 雨: 'yǔ', 雪: 'xuě',
  山: 'shān', 水: 'shuǐ', 火: 'huǒ', 土: 'tǔ', 木: 'mù', 金: 'jīn', 石: 'shí', 田: 'tián', 园: 'yuán',
  花: 'huā', 草: 'cǎo', 树: 'shù', 叶: 'yè', 果: 'guǒ', 米: 'mǐ', 谷: 'gǔ',
  鸟: 'niǎo', 鱼: 'yú', 虫: 'chóng', 马: 'mǎ', 牛: 'niú', 羊: 'yáng', 狗: 'gǒu', 猫: 'māo', 鸡: 'jī', 鸭: 'yā',
  爸: 'bà', 妈: 'mā', 爷: 'yé', 奶: 'nǎi', 哥: 'gē', 姐: 'jiě', 弟: 'dì', 妹: 'mèi',
  我: 'wǒ', 你: 'nǐ', 他: 'tā', 她: 'tā', 们: 'men',
  家: 'jiā', 门: 'mén', 窗: 'chuāng', 床: 'chuáng', 桌: 'zhuō',
  好: 'hǎo', 学: 'xué', 生: 'shēng', 字: 'zì', 书: 'shū', 文: 'wén', 画: 'huà', 歌: 'gē', 舞: 'wǔ',
  红: 'hóng', 黄: 'huáng', 蓝: 'lán', 绿: 'lǜ', 白: 'bái', 黑: 'hēi',
  春: 'chūn', 夏: 'xià', 秋: 'qiū', 冬: 'dōng',
  东: 'dōng', 南: 'nán', 西: 'xī', 北: 'běi',
  玄: 'xuán', 宇: 'yǔ', 宙: 'zhòu', 洪: 'hóng', 荒: 'huāng', 辰: 'chén'
}
function lookupPinyin (ch) {
  return PINYIN_TABLE[ch] || ''
}
function gridChars (text, gridType) {
  const s = String(text == null ? '' : text)
  if (gridType === 'english') {
    // 英文四线三格：保留可打印 ASCII（字母数字空格标点），去掉换行
    return Array.from(s.replace(/[\r\n]+/g, ' ')).filter(c => c >= ' ' && c <= '~')
  }
  return Array.from(s.replace(/\s+/g, ''))
}
function fillGrid (text, cols, rows, pages, gridType) {
  const chars = gridChars(text, gridType)
  const c = Math.max(1, Math.round(Number(cols) || 0) || 8)
  const r = Math.max(1, Math.round(Number(rows) || 0) || 10)
  const p = Math.max(1, Math.round(Number(pages) || 0) || 1)
  if (!chars.length) return []
  const perPage = c * r
  const cells = []
  for (let i = 0; i < perPage * p; i++) cells.push(chars[i % chars.length])
  const out = []
  for (let i = 0; i < p; i++) out.push(cells.slice(i * perPage, (i + 1) * perPage))
  return out
}
function missingPinyinList (text, limit) {
  const seen = []
  for (const ch of gridChars(text, 'tian')) {
    if (!lookupPinyin(ch) && !seen.includes(ch)) seen.push(ch)
    if (limit && seen.length >= limit) break
  }
  return seen
}
// A4 适配估算：A4 为 210×297mm，上下左右各 10mm 内边距
function cellSizeMm (cols) {
  return (210 - 20) / Math.max(1, cols)
}
function fitsA4 (cols, rows, withPinyin) {
  // 可用高度 277mm；拼音行使每行加高约 20%
  const rowH = cellSizeMm(cols) * (withPinyin ? 1.2 : 1)
  return rows * rowH <= 297 - 20
}
/* __PURE_END__ */

// ---------- 状态 ----------
const text = ref('天地玄黄宇宙洪荒')
const gridType = ref('mi')
const cols = ref(8)
const rows = ref(10)
const pages = ref(1)
const showPinyin = ref(false)
const traceStyle = ref('gray')
const seoContentVisible = ref(true)

const gridTypes = [
  { value: 'tian', label: '田字格' },
  { value: 'mi', label: '米字格' },
  { value: 'huigong', label: '回宫格' },
  { value: 'pinyin', label: '拼音田字格' },
  { value: 'english', label: '英文四线三格' }
]
const traceStyles = [
  { value: 'gray', label: '灰色范字' },
  { value: 'hollow', label: '空心描红' },
  { value: 'none', label: '仅空格' }
]

const colsSafe = computed(() => Math.min(20, Math.max(1, Math.round(Number(cols.value)) || 8)))
const rowsSafe = computed(() => Math.min(20, Math.max(1, Math.round(Number(rows.value)) || 10)))
const pagesSafe = computed(() => Math.min(20, Math.max(1, Math.round(Number(pages.value)) || 1)))

const charCount = computed(() => gridChars(text.value, gridType.value).length)
const cellsPerPage = computed(() => colsSafe.value * rowsSafe.value)
const sheets = computed(() => fillGrid(text.value, colsSafe.value, rowsSafe.value, pagesSafe.value, gridType.value))
const showModel = computed(() => traceStyle.value !== 'none')
const missingList = computed(() => missingPinyinList(text.value, 20))
const fitsA4Flag = computed(() => fitsA4(colsSafe.value, rowsSafe.value, showPinyin.value && gridType.value !== 'english'))

const pinyinFor = (ch) => (showPinyin.value && gridType.value !== 'english' ? lookupPinyin(ch) : '')

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const printSheet = () => window.print()
</script>

<style scoped>
.kai {
  font-family: 'KaiTi', 'STKaiti', '楷体', 'AR PL UKai CN', serif;
}
.gray-char {
  color: #c8cdd6;
}
.hollow-char {
  color: transparent;
  -webkit-text-stroke: 1.2px #c0c6d0;
}
.cell-box {
  display: flex;
  flex-direction: column;
}
@media print {
  @page {
    size: A4;
    margin: 0;
  }
  .no-print {
    display: none !important;
  }
  /* 打印时打破三列网格，字帖占满整页宽 */
  .copybook-root,
  .copybook-grid,
  .copybook-col {
    display: block !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .sheet {
    box-shadow: none !important;
    border-radius: 0 !important;
    width: 210mm !important;
    margin: 0 auto !important;
  }
  .sheet-break {
    break-after: page;
  }
}
</style>
