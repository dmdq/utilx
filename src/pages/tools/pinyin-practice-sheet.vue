<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- @page 规则：A4 竖版、12mm 页边距 -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Type class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">拼音练习纸生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">A4 四线三格：空白格 / 描灰拼音（首格示范）/ 声调专项，行数格数可调直接打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线汉语拼音四线三格练习纸生成器：可调行数（8-16 行）与每行格数（8-14 格），格宽按 A4 版心自适应。
        三种内容模式——空白格自由书写；描灰字模式输入拼音串（如 b p m f 或 wo ai bei jing，空格分隔；连写会按声母韵母自动拆分），
        按音节整体入格描灰、每行首格黑字示范；声调专项模式把 a o e i u ü 的一二三四声逐格排布。
        四线三格以 SVG 按 1:1 毫米精确绘制（顶线底线实线、中格两条虚线），打印精确 A4。页面附字母占格速查卡，
        全部在浏览器本地生成，不上传任何数据。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：设置 -->
      <div class="no-print space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Type class="w-5 h-5 mr-2 text-primary" /> 版式
          </h2>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">行数：<span class="text-primary font-medium">{{ rows }} 行</span></label>
            <input v-model.number="rows" type="range" min="8" max="16" step="1" class="w-full accent-primary" />
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">每行格数：<span class="text-primary font-medium">{{ cols }} 格</span></label>
            <input v-model.number="cols" type="range" min="8" max="14" step="1" class="w-full accent-primary" />
          </div>
          <p class="text-xs text-muted-foreground">当前格宽约 {{ geometry.cellWmm }}mm × 四线区高 {{ geometry.bandMm }}mm；共 {{ rows * cols }} 格。</p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <PencilLine class="w-5 h-5 mr-2 text-primary" /> 内容模式
          </h2>
          <div class="grid grid-cols-3 gap-1">
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
          <p class="text-xs text-muted-foreground leading-relaxed">{{ MODES.find((m) => m.id === mode)?.tip }}</p>
          <div v-if="mode === 'trace'">
            <label class="block text-xs text-muted-foreground mb-1">拼音串（空格分隔按音节；连写自动按声母韵母拆分；带调音节整体入一格）</label>
            <textarea
              v-model="pinyinText"
              rows="3"
              placeholder="例如：b p m f&#10;或：wo ai bei jing tian an men&#10;或带调：bā bá bǎ bà"
              :class="SEL_CLS + ' font-mono resize-y'"
            />
            <p class="text-xs text-muted-foreground mt-1">
              已拆出 {{ syllables.length }} 个音节，循环填入每行：{{ syllables.slice(0, 12).join(' ') }}{{ syllables.length > 12 ? ' …' : '' }}
            </p>
          </div>
        </div>

        <!-- 字母占格速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2 text-sm">
          <h2 class="text-base font-semibold flex items-center">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> 字母占格速查卡
          </h2>
          <div v-for="g in OCCUPY_RULES" :key="g.label" class="flex gap-2">
            <span class="shrink-0 px-1.5 py-0.5 rounded text-xs font-medium h-fit" :class="g.cls">{{ g.label }}</span>
            <span class="text-muted-foreground">{{ g.letters }}</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border">
            口诀：中格写满顶两边，住上格不顶天，住下格不踩线。i、ü 主体在中格、点写上格；j 竖左弯下探、点在上格。
          </p>
        </div>
      </div>

      <!-- 右：A4 预览 -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> A4 预览
          </h2>
          <span class="text-xs text-muted-foreground">{{ MODES.find((m) => m.id === mode)?.label }} · {{ rows }} 行 × {{ cols }} 格</span>
        </div>

        <div class="sheet-scroll w-full">
          <div class="mx-auto" style="width: 210mm; max-width: none">
            <div class="a4-sheet" :style="sheetStyle">
              <!-- 标题区：姓名 / 日期 -->
              <div class="title-area">
                <span v-if="titleText" class="title-text">{{ titleText }}</span>
                <span class="title-blanks">姓名：____________　日期：______年____月____日　用时：____分____秒</span>
              </div>
              <!-- 四线三格行 -->
              <div v-for="(row, r) in sheet.rows" :key="r" class="pinyin-row">
                <svg
                  :width="geometry.contentWmm + 'mm'"
                  :height="geometry.bandMm + 'mm'"
                  :viewBox="'0 0 ' + geometry.contentWmm + ' ' + geometry.bandMm"
                  preserveAspectRatio="none"
                  class="block"
                >
                  <!-- 四线：上中线为实线，第二、三线为虚线 -->
                  <line x1="0" :y1="geometry.lineOffsets[0]" :x2="geometry.contentWmm" :y2="geometry.lineOffsets[0]" class="cl-solid" />
                  <line x1="0" :y1="geometry.lineOffsets[1]" :x2="geometry.contentWmm" :y2="geometry.lineOffsets[1]" class="cl-dashed" />
                  <line x1="0" :y1="geometry.lineOffsets[2]" :x2="geometry.contentWmm" :y2="geometry.lineOffsets[2]" class="cl-dashed" />
                  <line x1="0" :y1="geometry.lineOffsets[3]" :x2="geometry.contentWmm" :y2="geometry.lineOffsets[3]" class="cl-solid" />
                  <!-- 格分隔竖线 -->
                  <line
                    v-for="c in sheet.cols - 1"
                    :key="'v' + c"
                    :x1="c * geometry.cellWmm"
                    :y1="geometry.lineOffsets[0]"
                    :x2="c * geometry.cellWmm"
                    :y2="geometry.lineOffsets[3]"
                    class="cl-vert"
                  />
                  <!-- 格内拼音：demo 黑字示范 / trace 浅灰描灰 -->
                  <text
                    v-for="(cell, ci) in row.cells"
                    :key="'t' + ci"
                    :x="ci * geometry.cellWmm + geometry.cellWmm / 2"
                    :y="geometry.baselineY"
                    :text-anchor="'middle'"
                    :font-size="geometry.fontMm"
                    :class="cell.style === 'demo' ? 'demo-text' : cell.style === 'trace' ? 'trace-text' : 'empty-text'"
                  >{{ cell.text }}</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时缩放请选「100% / 实际大小」，本页按 A4 竖版、12mm 页边距排版，四线以 1:1 毫米绘制；
          描灰字使用系统字体渲染浅灰示范，不同系统字形略有差异，以四线占格位置为准。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <details class="bg-card border border-border rounded-lg mb-12 group">
        <summary class="cursor-pointer list-none px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-foreground"><span class="text-primary mr-2">#</span>四线三格规则、描红为什么有效与常见问题</h2>
          <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
        </summary>
        <div class="px-6 pb-6 space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">四线三格的书写规则</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              四线三格由四条横线把行高分成上、中、下三个格，拼音字母按"主体占哪格"分成四类
              （口径依汉语拼音书写教学通用规则，经搜狐、网易两处书写笔顺专文交叉核对）：
              <b class="text-foreground">只占中格</b>：a、o、e、m、n、u（以及 c、r、s、w、x、z）——中格要写满、上下顶线；
              <b class="text-foreground">占上中格</b>：b、d、f、h、k、l、t——竖从第二线起笔顶向第一线但不顶满；i、ü 主体在中格，点写在上格；
              <b class="text-foreground">占中下格</b>：p、q、g、y——竖或竖弯下探到下格但不踩第四条线；
              <b class="text-foreground">占上中下三格</b>：j——竖左弯下探入下格、点写在上格。
              配套口诀：中格写满顶两边，住上格的不顶天，住下格的不踩线。声调符号标在主要元音上，优先级 a &gt; o &gt; e &gt; i &gt; u &gt; ü。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">为什么描红（描灰）练习有效？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              描红的原理是"动作示范 + 即时反馈"：浅灰范字给出了笔画的路径、比例与占格位置，孩子沿轨迹书写时手部肌肉
              直接复现正确动作，比"看一眼范例再凭记忆写"的出错率低，也比单纯描空心字更接近真实书写力度。
              教学上通用的搭配是"描 1 格 + 独立写 1-2 格"：本工具每行首格用黑字示范、其余格描灰，
              打印后家长可以把每行后面几格留作独立书写检查点，对照首格看占格是否正确。
              声调专项模式把 a o e i u ü 的四声逐格排布，适合一年级上学期集中突破"标调位置"和"调号方向"两个易错点。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">行数和格数怎么选？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              低年级（一年级上）建议 10-12 行、8-10 格：格子大、四线区高，方便控制笔画；能够熟练书写后可以到 14 行、12-14 格过渡到
              接近作业本的密度。本工具的四线区高随行数自适应（8 行时约 18mm、16 行时约 9mm），不必担心格子变形。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm font-semibold text-foreground">带声调的拼音怎么填？</p>
                <p class="text-sm text-muted-foreground mt-1">直接输入带调字符（如 bā bá bǎ bà），带调音节会整体作为一个音节入一格，不会拆开；不带调的连写串（如 beijing）会按声母+韵母自动拆成 bei、jing 两格。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">打印会不会把设置面板打出来？</p>
                <p class="text-sm text-muted-foreground mt-1">不会。打印样式只输出 A4 练习纸本体（含姓名日期行与四线三格），设置面板、速查卡与说明文字自动隐藏。</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">想练英文字母四线格怎么办？</p>
                <p class="text-sm text-muted-foreground mt-1">英文书写的四线三格比例与拼音不同（字母有升降部），请使用
                  <NuxtLink to="/tools/english-copybook-generator/" class="text-primary hover:underline">英语字帖生成器</NuxtLink>，
                  它支持单词句子描红与空白行搭配打印。</p>
              </div>
            </div>
          </div>
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-semibold text-foreground mb-1">口径与来源</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              字母占格规则与"中格写满顶两边"口诀依两处独立来源交叉核对（搜狐教育"汉语拼音书写笔顺+四线格位置"、网易同题文章）；
              声调标调优先级依《汉语拼音方案》通用教学口径。四线比例为上中下三格等高的标准教学画法。
            </p>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Type, PencilLine, BookOpen, FileText, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'

// ---------- SEO ----------
useSeoMeta({
  title: '拼音练习纸生成器 - A4四线三格描红/声调专项打印 | 有条工具',
  description: '免费在线拼音四线三格练习纸生成：行数8-16、每行8-14格自适应A4版心，三种模式（空白格/描灰拼音首格示范/声调专项a o e i u ü四声排布），拼音串按音节入格、连写自动拆分，SVG 1:1毫米精确绘制，打印精确A4，附字母占格速查卡，纯本地生成',
  keywords: '拼音练习纸,四线三格,拼音描红,拼音格打印,声调练习,一年级拼音',
  author: '有条工具',
  ogTitle: '拼音练习纸生成器 - A4四线三格描红打印 | 有条工具',
  ogDescription: '空白格、描灰拼音、声调专项三种模式，行数格数可调，SVG 精确四线三格直接打印。',
  ogUrl: 'https://www.util.cn/tools/pinyin-practice-sheet',
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
          name: '拼音练习纸生成器',
          url: 'https://www.util.cn/tools/pinyin-practice-sheet',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '标准四线三格：上中下三格等高，顶线底线实线、中格虚线',
            '行数 8-16、每行格数 8-14，格宽按 A4 版心自适应',
            '三种模式：空白格 / 描灰拼音（首格黑字示范）/ 声调专项',
            '拼音按音节整体入格，连写串自动按声母韵母拆分',
            '姓名日期标题区，SVG 1:1 毫米绘制打印精确 A4',
            '附字母占格速查卡，纯本地生成不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '拼音练习纸生成器', item: 'https://www.util.cn/tools/pinyin-practice-sheet/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '四线三格字母占格规则是什么？',
              acceptedAnswer: { '@type': 'Answer', text: 'a、o、e、m、n、u等只占中格且写满顶线；b、d、f、h、k、l、t占上中格；p、q、g、y占中下格但不踩第四线；j占上中下三格（点在上格）；i、ü主体在中格、点写在上格。口诀：中格写满顶两边，住上格不顶天，住下格不踩线。' }
            },
            {
              '@type': 'Question',
              name: '带声调的拼音怎么填？',
              acceptedAnswer: { '@type': 'Answer', text: '直接输入带调字符（如bā bá bǎ bà），带调音节整体作为一个音节入一格；不带调的连写串（如beijing）按声母加韵母自动拆分为bei、jing两格。' }
            },
            {
              '@type': 'Question',
              name: '为什么描红练习有效？',
              acceptedAnswer: { '@type': 'Answer', text: '描红给出笔画路径、比例与占格位置的直接示范，孩子沿浅灰轨迹书写时手部肌肉复现正确动作，出错率低于凭记忆临写；推荐描1格加独立写1-2格搭配，家长对照首格示范检查占格。' }
            }
          ]
        }
      ]
    })
  }]
})

/* PURE-FNS-START（纯函数区：供 node 自测提取，勿在此使用浏览器 API / Vue 响应式） */

// clamp 整数到 [min, max]
function clampInt(v, min, max) {
  const n = Math.floor(Number(v) || 0)
  return Math.min(max, Math.max(min, n))
}

// 声母表（双字母在前保证最长匹配）
const INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w']
// 韵母表（按长度降序保证最长匹配）
const FINALS = [
  'iang', 'uang', 'iong', 'üan', 'uan', 'iao', 'ian', 'uai', 'ing', 'ang', 'eng', 'ong',
  'ia', 'ua', 'uo', 'ui', 'iu', 'ie', 'üe', 'ue', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'in', 'un', 'ün',
  'er', 'a', 'o', 'e', 'i', 'u', 'ü'
]
// 带调字符视为"已写好的音节"整体入格
const TONE_MARK_RE = /[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ]/

// 拼音串 → 音节数组（每音节整体占一格）：
// 1) 先按空白/标点切分；2) 含带调字符的 token 整体作为一个音节（如 bā）；
// 3) 纯字母 token 按"最长声母 + 最长韵母"贪心拆分（如 beijing → bei、jing；bpmf → b、p、m、f）
function splitSyllables(raw) {
  const text = String(raw == null ? '' : raw).toLowerCase()
  const tokens = text.split(/[\s，。！？；、,.!?;:()（）\[\]"]+/).filter(Boolean)
  const out = []
  for (const token of tokens) {
    if (TONE_MARK_RE.test(token)) {
      out.push(token)
      continue
    }
    let i = 0
    while (i < token.length) {
      let matched = ''
      for (const ini of INITIALS) {
        if (token.startsWith(ini, i)) {
          for (const fin of FINALS) {
            if (token.startsWith(fin, i + ini.length)) {
              matched = ini + fin
              break
            }
          }
          if (matched) break
        }
      }
      if (!matched) {
        for (const fin of FINALS) {
          if (token.startsWith(fin, i)) {
            matched = fin
            break
          }
        }
      }
      if (!matched) matched = token[i]
      out.push(matched)
      i += matched.length
    }
  }
  return out
}

// 单韵母四声表（声调专项模式）
const TONE_SETS = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ']
}
const TONE_VOWELS = ['a', 'o', 'e', 'i', 'u', 'ü']

// 组版面：返回 rows 行、每行 cols 个 cell {text, style: 'blank'|'demo'|'trace'}
// mode: 'blank' 空白格；'trace' 拼音串逐格描灰（每行首格黑字示范，音节按行从头循环）；
//       'tones' 声调专项（第 r 行取 TONE_VOWELS[r % 6]，四声逐格循环，首格示范）
function buildSheet(rows, cols, mode, rawText) {
  const r = clampInt(rows, 8, 16)
  const c = clampInt(cols, 8, 14)
  const syllables = splitSyllables(rawText)
  const grid = []
  for (let i = 0; i < r; i++) {
    const cells = []
    for (let j = 0; j < c; j++) {
      if (mode === 'trace' && syllables.length) {
        const syl = syllables[j % syllables.length]
        cells.push({ text: syl, style: j === 0 ? 'demo' : 'trace' })
      } else if (mode === 'tones') {
        const vowel = TONE_VOWELS[i % TONE_VOWELS.length]
        const set = TONE_SETS[vowel]
        cells.push({ text: set[j % 4], style: j === 0 ? 'demo' : 'trace' })
      } else {
        cells.push({ text: '', style: 'blank' })
      }
    }
    grid.push({ cells })
  }
  return { rows: grid, cols: c, rowCount: r, cellCount: r * c, syllables }
}

// 四线三格线 Y 坐标：rowTop 为该行四线区顶部，band 为四线区总高（上中下三格等高）
function lineYsOf(rowTop, band) {
  const b = Number(band) || 0
  return [rowTop, rowTop + b / 3, rowTop + (2 * b) / 3, rowTop + b]
}

// A4 版面几何（mm）：页 210×297、四周页边距 12、标题区 14、行距 3
const PAGE_GEOM = { w: 210, h: 297, margin: 12, titleH: 14, rowGap: 3 }
function sheetGeometry(rows, cols) {
  const r = clampInt(rows, 8, 16)
  const c = clampInt(cols, 8, 14)
  const contentWmm = PAGE_GEOM.w - 2 * PAGE_GEOM.margin
  const usableH = PAGE_GEOM.h - PAGE_GEOM.margin - PAGE_GEOM.margin - PAGE_GEOM.titleH
  const pitch = (usableH - (r - 1) * PAGE_GEOM.rowGap) / r
  const bandMm = Math.round(pitch * 1000) / 1000
  const cellWmm = Math.round((contentWmm / c) * 1000) / 1000
  // 行 r 的四线区顶部 Y（自标题区下缘起算）
  const rowTopMm = (i) => Math.round(i * (bandMm + PAGE_GEOM.rowGap) * 1000) / 1000
  return {
    contentWmm,
    usableH,
    pitch,
    bandMm,
    cellWmm,
    rowTopMm,
    lineOffsets: lineYsOf(0, bandMm),
    baselineY: Math.round((bandMm * 0.72) * 1000) / 1000,
    fontMm: Math.round((bandMm * 0.58) * 1000) / 1000
  }
}

/* PURE-FNS-END */

// ---------- 页面状态 ----------
const MODES = [
  { id: 'blank', label: '空白格', tip: '整页空白四线三格，供自由书写或听写。' },
  { id: 'trace', label: '描灰字', tip: '输入拼音串按音节描灰，每行首格黑字示范；带调音节（如 bā）整体入一格。' },
  { id: 'tones', label: '声调专项', tip: 'a o e i u ü 逐行排布一二三四声，适合集中练标调与调号方向。' }
]
const OCCUPY_RULES = [
  { label: '只占中格', letters: 'a o e m n u（c r s w x z 同）', cls: 'bg-primary/10 text-primary' },
  { label: '占上中格', letters: 'b d f h k l t；i ü 主体中格、点在上格', cls: 'bg-sky-500/10 text-sky-600' },
  { label: '占中下格', letters: 'p q g y（下探不踩第四线）', cls: 'bg-emerald-500/10 text-emerald-600' },
  { label: '占三格', letters: 'j（竖左弯下探，点在上格）', cls: 'bg-amber-500/10 text-amber-600' }
]
const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const rows = ref(10)
const cols = ref(10)
const mode = ref('trace')
const pinyinText = ref('b p m f d t n l')
const titleText = ref('汉语拼音练习')

const syllables = computed(() => splitSyllables(pinyinText.value))
const geometry = computed(() => sheetGeometry(rows.value, cols.value))

const sheet = computed(() => {
  const s = buildSheet(rows.value, cols.value, mode.value, pinyinText.value)
  if (mode.value === 'trace' && !s.syllables.length) {
    return buildSheet(rows.value, cols.value, 'blank', '')
  }
  return s
})

const sheetStyle = computed(() => ({
  width: '210mm',
  minHeight: '297mm',
  padding: '12mm'
}))

const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  addRecentTool('pinyin-practice-sheet')
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
.sheet-scroll {
  overflow-x: auto;
}
.title-area {
  height: 14mm;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 2mm;
  gap: 1mm;
}
.title-text {
  font-size: 4.5mm;
  font-weight: 600;
  color: #111827;
}
.title-blanks {
  font-size: 3.2mm;
  color: #374151;
  letter-spacing: 0.2mm;
}
.pinyin-row {
  break-inside: avoid;
  page-break-inside: avoid;
  /* 行距与 PAGE_GEOM.rowGap（3mm）保持一致 */
  margin-bottom: 3mm;
}
.pinyin-row:last-child {
  margin-bottom: 0;
}
.pinyin-row svg {
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
.cl-vert {
  stroke: #c9ced6;
  stroke-width: 0.22;
}
.demo-text {
  fill: #111827;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
}
.trace-text {
  fill: #6b7280;
  fill-opacity: 0.35;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
}
.empty-text {
  fill: none;
}

@media print {
  .no-print {
    display: none !important;
  }
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
  .a4-sheet {
    box-shadow: none !important;
    border-radius: 0 !important;
    width: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
  }
}
</style>
