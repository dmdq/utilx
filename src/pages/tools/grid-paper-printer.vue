<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Grid3x3 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">可打印网格纸生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">方格 / 点阵 / 横线 / 坐标纸 / 五线谱 / 康奈尔笔记 / 田字格，A4 规格直接打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按需生成 A4 规格的打印纸：可调格大小、行距、页边距、线条深浅与纸张方向，支持一次生成多页。所有图样以 SVG 精确绘制（1 个绘图单位 = 1 毫米），打印时无边距、无页眉页脚干扰，适合数学草稿、手账笔记、练字与音乐练习。全部在本机浏览器生成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
      <!-- 控制面板 -->
      <div class="no-print lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 class="text-base font-semibold flex items-center">
            <PencilRuler class="w-5 h-5 mr-2 text-primary" /> 纸型与参数
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">纸型</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="t in typeOptions"
                :key="t.value"
                @click="setType(t.value)"
                :class="paperType === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ t.label }}</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              {{ sizeLabel }}：<span class="text-primary">{{ sizeMm }} mm</span>
            </label>
            <input v-model.number="sizeMm" type="range" :min="sizeRange.min" :max="sizeRange.max" step="0.5" class="w-full accent-primary" />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">页边距：<span class="text-primary">{{ marginMm }} mm</span></label>
            <input v-model.number="marginMm" type="range" min="5" max="25" step="1" class="w-full accent-primary" />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">纸张方向</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button @click="orientation = 'portrait'" :class="orientation === 'portrait' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'" class="py-2 rounded-lg text-xs font-medium transition-all">A4 纵向</button>
              <button @click="orientation = 'landscape'" :class="orientation === 'landscape' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'" class="py-2 rounded-lg text-xs font-medium transition-all">A4 横向</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">线色深浅：<span class="text-primary">{{ ['最浅', '较浅', '适中', '较深', '最深'][darkness - 1] }}</span></label>
            <input v-model.number="darkness" type="range" min="1" max="5" step="1" class="w-full accent-primary" />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">页数</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="n in [1, 2, 3, 4]"
                :key="n"
                @click="pageCount = n"
                :class="pageCount === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all">{{ n }} 页</button>
            </div>
          </div>

          <button
            @click="printPaper"
            class="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition"
          >
            <Printer class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 打印 / 另存为 PDF
          </button>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            打印请在打印对话框中：纸张 A4、缩放 100%（无边距）、关闭「页眉和页脚」。选择「另存为 PDF」可导出后到打印店输出。
          </p>
        </div>

        <!-- 图样信息 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-2 text-sm">
          <h2 class="text-base font-semibold mb-1">版面信息</h2>
          <div class="flex justify-between p-2 bg-muted rounded">
            <span class="text-muted-foreground">页面尺寸</span>
            <span class="font-medium text-foreground">{{ pageSize.w }} × {{ pageSize.h }} mm</span>
          </div>
          <div class="flex justify-between p-2 bg-muted rounded">
            <span class="text-muted-foreground">可用区域</span>
            <span class="font-medium text-foreground">{{ usable.w }} × {{ usable.h }} mm</span>
          </div>
          <div class="flex justify-between p-2 bg-muted rounded">
            <span class="text-muted-foreground">{{ densityLabel }}</span>
            <span class="font-medium text-foreground">{{ densityText }}</span>
          </div>
          <div class="flex justify-between p-2 bg-muted rounded">
            <span class="text-muted-foreground">SVG viewBox</span>
            <span class="font-mono text-xs font-medium text-foreground">{{ viewBox }}</span>
          </div>
        </div>
      </div>

      <!-- 纸张预览 -->
      <div class="lg:col-span-3">
        <div class="paper-stack no-print-headings">
          <div class="no-print flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold">打印预览（{{ pageCount }} 页）</h2>
            <span class="text-xs text-muted-foreground">灰框为屏幕示意，打印输出为纯白页面无边框</span>
          </div>
          <div
            v-for="p in pageCount"
            :key="p"
            class="paper-sheet"
            :class="{ 'paper-sheet-gap': p < pageCount }"
            :style="{ aspectRatio: `${pageSize.w} / ${pageSize.h}`, maxWidth: `${pageSize.w}mm` }"
          >
            <p class="sheet-page-tag no-print">第 {{ p }} / {{ pageCount }} 页</p>
            <svg
              :viewBox="viewBox"
              class="paper-svg"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              :aria-label="`${typeLabel}打印纸预览`"
            >
              <rect x="0" y="0" :width="pageSize.w" :height="pageSize.h" fill="#ffffff"></rect>
              <template v-for="(el, i) in shapes" :key="i">
                <line
                  v-if="el.t === 'line'"
                  :x1="el.x1" :y1="el.y1" :x2="el.x2" :y2="el.y2"
                  :stroke="el.stroke" :stroke-width="el.sw"
                  :stroke-dasharray="el.dash || undefined"
                  stroke-linecap="round"
                ></line>
                <circle
                  v-else-if="el.t === 'circle'"
                  :cx="el.cx" :cy="el.cy" :r="el.r"
                  :fill="el.stroke"
                ></circle>
                <rect
                  v-else-if="el.t === 'rect'"
                  :x="el.x" :y="el.y" :width="el.w" :height="el.h"
                  fill="none" :stroke="el.stroke" :stroke-width="el.sw"
                ></rect>
                <polyline
                  v-else-if="el.t === 'poly'"
                  :points="el.points"
                  fill="none" :stroke="el.stroke" :stroke-width="el.sw"
                  stroke-linecap="round" stroke-linejoin="round"
                ></polyline>
              </template>
            </svg>
          </div>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>可打印网格纸生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款在线特殊稿纸生成与打印工具。你在页面上选择纸型（方格纸、点阵纸、横线纸、坐标纸、五线谱本、康奈尔笔记纸、田字格），
          设定格大小 / 行距（毫米）、页边距、A4 纵横方向和线条深浅，本工具会即时绘制整页矢量图样，点击打印即可获得与实际规格一致的一页或多页纸。
          SVG 矢量输出放大不糊，比下载 PDF 模板更灵活。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">格大小怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          数学草稿与绘图推荐 5 mm 方格；手账子弹笔记常用 5 mm 点阵；英语书写建议 8 mm 横线；练字田字格儿童用 12-15 mm；
          乐理练习五线谱线距常用 1.5-2 mm。坐标纸自带中央十字轴与每 5 格一条的粗计线，可直接画函数图像。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何获得精准尺寸的打印？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>打印对话框选择 A4 纸、方向与页面一致、缩放设为 100% / 「实际大小」，并取消勾选「适应可打印区域」。</li>
          <li>普通激光/喷墨打印机存在约 4-5 mm 物理不可打边缘，若担心边缘图案被裁，可把页边距调到 8 mm 以上。</li>
          <li>先「另存为 PDF」确认版面，再批量打印更稳妥。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">康奈尔笔记纸的结构</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          页面左侧为线索栏（占可用宽度约 30%），右侧为笔记主区（含横线），底部约 20% 为总结区，由分隔横线独立出来。
          上课时在右栏记录，课后左栏写关键词自测，底部总结用自己的话复述——这就是经典的 Cornell Note-Taking 分区。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">打印出来尺寸和屏幕上不一样？</h3>
            <p class="text-sm text-muted-foreground mt-1">请确认打印缩放为 100%（而非「适应页面」），且未开启「双面/缩放一页两张」。本页面 viewBox 按 1 单位 = 1 mm 绘制，只要不缩放即与设定一致。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">可以只导出 PDF 不打印吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以。在打印对话框的目标打印机中选择「另存为 PDF」即可导出，多页设置会保留为多页 PDF。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生成这些纸会上传我的设置吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。图样完全由浏览器本地 SVG 计算绘制，无任何数据请求，可离线放心使用。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'grid-paper-printer'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Grid3x3, PencilRuler, Printer,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '可打印网格纸生成器 - 方格纸/点阵纸/五线谱 A4 打印 | 有条工具',
  description: '在线可打印网格纸生成器：方格纸、点阵纸、横线纸、坐标纸、五线谱、康奈尔笔记纸、田字格，可调格大小行距边距与线色深浅，A4 多页无边距直接打印或存 PDF，纯本地生成',
  keywords: '网格纸,方格纸打印,点阵纸,坐标纸,五线谱纸,康奈尔笔记纸,田字格打印,A4打印模板',
  author: '有条工具',
  ogTitle: '可打印网格纸生成器 - 七种 A4 稿纸在线生成 | 有条工具',
  ogDescription: '方格/点阵/坐标/五线谱/康奈尔笔记纸按规格生成 A4 打印，手账笔记数学全能。',
  ogUrl: 'https://www.util.cn/tools/grid-paper-printer',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（WebApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '可打印网格纸生成器',
          url: 'https://www.util.cn/tools/grid-paper-printer',
          applicationCategory: 'ProductivityApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['方格纸', '点阵纸', '横线纸', '坐标纸（十字轴）', '五线谱纸', '康奈尔笔记纸', '田字格', 'A4 横纵向', '多页打印', 'SVG 矢量无边距']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '可打印网格纸生成器', item: 'https://www.util.cn/tools/grid-paper-printer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '打印出来尺寸和屏幕上不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '请确认打印缩放为100%（而非适应页面）。本页 viewBox 按 1 单位=1 毫米绘制，只要不缩放即与设定一致。' }
            },
            {
              '@type': 'Question',
              name: '可以只导出 PDF 不打印吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。在打印对话框中选择「另存为 PDF」即可导出，多页设置会保留为多页 PDF。' }
            },
            {
              '@type': 'Question',
              name: '生成纸张会上传我的设置吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。图样完全由浏览器本地 SVG 计算绘制，无任何数据请求，可离线使用。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯几何计算（可独立单测；1 viewBox 单位 = 1 mm） ----------
function a4Size(orientation) {
  return orientation === 'landscape' ? { w: 297, h: 210 } : { w: 210, h: 297 }
}

function viewBoxFor(orientation) {
  const s = a4Size(orientation)
  return `0 0 ${s.w} ${s.h}`
}

// 格数 = 可用宽（高）÷ 格宽，向下取整
function gridCount(pageW, pageH, margin, cell) {
  return {
    cols: Math.floor((pageW - 2 * margin) / cell),
    rows: Math.floor((pageH - 2 * margin) / cell)
  }
}

// 五线谱：每系统 5 条线（线距 lineGap，系统内 4 个间距），系统间隔 = systemGapFactor × lineGap
function staffSystems(usableH, lineGap, systemGapFactor = 3) {
  const systemH = 4 * lineGap
  const period = systemH + systemGapFactor * lineGap
  return {
    systemCount: Math.floor(usableH / period),
    systemHeight: systemH,
    period,
    linePositionsInSystem: [0, lineGap, 2 * lineGap, 3 * lineGap, 4 * lineGap]
  }
}

// 康奈尔：线索栏竖线 x、总结区横线 y
function cornellLayout(usableW, usableH, margin, cueRatio = 0.3, summaryRatio = 0.2) {
  return {
    dividerX: margin + usableW * cueRatio,
    summaryY: margin + usableH * (1 - summaryRatio)
  }
}

// ---------- 状态 ----------
const paperType = ref('grid')
const sizeMm = ref(5)
const marginMm = ref(10)
const orientation = ref('portrait')
const darkness = ref(3)
const pageCount = ref(1)

const typeOptions = [
  { value: 'grid', label: '方格', size: 5, min: 2, max: 15 },
  { value: 'dot', label: '点阵', size: 5, min: 3, max: 12 },
  { value: 'lines', label: '横线', size: 8, min: 5, max: 14 },
  { value: 'coords', label: '坐标纸', size: 5, min: 2, max: 10 },
  { value: 'staff', label: '五线谱', size: 2, min: 1.5, max: 3 },
  { value: 'cornell', label: '康奈尔笔记', size: 8, min: 6, max: 12 },
  { value: 'tianzhi', label: '田字格', size: 12, min: 8, max: 20 }
]

const typeMeta = computed(() => typeOptions.find((t) => t.value === paperType.value) || typeOptions[0])
const typeLabel = computed(() => typeMeta.value.label)
const sizeRange = computed(() => typeMeta.value)
const sizeLabel = computed(() => (paperType.value === 'staff' ? '五线谱线间距' : (paperType.value === 'lines' || paperType.value === 'cornell') ? '行距' : '格大小'))
const densityLabel = computed(() => (paperType.value === 'lines' || paperType.value === 'cornell' ? '横线条数' : (paperType.value === 'staff' ? '谱表系统数' : '格数')))

function setType(t) {
  paperType.value = t
  const meta = typeOptions.find((o) => o.value === t)
  if (meta) sizeMm.value = meta.size
}

const pageSize = computed(() => a4Size(orientation.value))
const viewBox = computed(() => viewBoxFor(orientation.value))
const usable = computed(() => ({
  w: Math.max(0, pageSize.value.w - 2 * marginMm.value),
  h: Math.max(0, pageSize.value.h - 2 * marginMm.value)
}))

// 线色深浅：1 最浅 → 5 最深
const GRAY_LEVELS = [210, 180, 150, 115, 80]
const lineColor = computed(() => {
  const v = GRAY_LEVELS[Math.min(4, Math.max(0, darkness.value - 1))]
  return `rgb(${v}, ${v}, ${v})`
})
const strongColor = computed(() => {
  const v = Math.max(40, GRAY_LEVELS[Math.min(4, Math.max(0, darkness.value - 1))] - 45)
  return `rgb(${v}, ${v}, ${v})`
})

const thinW = 0.25
const midW = 0.45
const heavyW = 0.7

// ---------- 图样元素构建 ----------
const L = (x1, y1, x2, y2, stroke, sw, dash) => ({ t: 'line', x1, y1, x2, y2, stroke, sw, dash })

const shapes = computed(() => {
  const els = []
  const pw = pageSize.value.w
  const ph = pageSize.value.h
  const m = marginMm.value
  const cell = sizeMm.value
  const uw = usable.value.w
  const uh = usable.value.h
  const { cols, rows } = gridCount(pw, ph, m, cell)
  const color = lineColor.value
  const strong = strongColor.value

  if (paperType.value === 'grid' || paperType.value === 'coords') {
    const startX = m + (uw - cols * cell) / 2
    const startY = m + (uh - rows * cell) / 2
    // 细网格
    for (let c = 0; c <= cols; c++) {
      els.push(L(startX + c * cell, startY, startX + c * cell, startY + rows * cell, color, thinW))
    }
    for (let r = 0; r <= rows; r++) {
      els.push(L(startX, startY + r * cell, startX + cols * cell, startY + r * cell, color, thinW))
    }
    if (paperType.value === 'coords') {
      // 每 5 格一条计线
      for (let c = 5; c < cols; c += 5) {
        els.push(L(startX + c * cell, startY, startX + c * cell, startY + rows * cell, strong, midW))
      }
      for (let r = 5; r < rows; r += 5) {
        els.push(L(startX, startY + r * cell, startX + cols * cell, startY + r * cell, strong, midW))
      }
      // 中央十字轴 + 箭头
      const cx = startX + Math.round(cols / 2) * cell
      const cy = startY + Math.round(rows / 2) * cell
      els.push(L(startX, cy, startX + cols * cell, cy, strong, heavyW))
      els.push(L(cx, startY, cx, startY + rows * cell, strong, heavyW))
      const a = 2.2
      els.push({ t: 'poly', points: `${startX + cols * cell - a},${cy - a / 1.6} ${startX + cols * cell},${cy} ${startX + cols * cell - a},${cy + a / 1.6}`, stroke: strong, sw: midW })
      els.push({ t: 'poly', points: `${cx - a / 1.6},${startY + a} ${cx},${startY} ${cx + a / 1.6},${startY + a}`, stroke: strong, sw: midW })
    } else {
      // 方格外框
      els.push(L(startX, startY, startX + cols * cell, startY, strong, midW))
      els.push(L(startX, startY + rows * cell, startX + cols * cell, startY + rows * cell, strong, midW))
      els.push(L(startX, startY, startX, startY + rows * cell, strong, midW))
      els.push(L(startX + cols * cell, startY, startX + cols * cell, startY + rows * cell, strong, midW))
    }
  }

  if (paperType.value === 'dot') {
    const startX = m + (uw - cols * cell) / 2
    const startY = m + (uh - rows * cell) / 2
    const r = Math.max(0.35, cell * 0.08)
    for (let c = 0; c <= cols; c++) {
      for (let row = 0; row <= rows; row++) {
        els.push({ t: 'circle', cx: startX + c * cell, cy: startY + row * cell, r, stroke: strong })
      }
    }
  }

  if (paperType.value === 'lines') {
    const lineCount = Math.floor(uh / cell)
    const startY = m + (uh - lineCount * cell) / 2
    for (let i = 1; i <= lineCount; i++) {
      els.push(L(m, startY + i * cell, pw - m, startY + i * cell, color, midW))
    }
  }

  if (paperType.value === 'staff') {
    const st = staffSystems(uh, cell, 3)
    const blockH = st.systemCount * st.period - 3 * cell
    const startY = m + (uh - blockH) / 2
    for (let s = 0; s < st.systemCount; s++) {
      const top = startY + s * st.period
      for (const off of st.linePositionsInSystem) {
        els.push(L(m, top + off, pw - m, top + off, strong, midW))
      }
    }
  }

  if (paperType.value === 'cornell') {
    const cn = cornellLayout(uw, uh, m)
    const lineCount = Math.floor((cn.summaryY - m - cell) / cell)
    const firstY = m + cell
    // 右栏横线
    for (let i = 0; i < lineCount; i++) {
      els.push(L(cn.dividerX + 2, firstY + i * cell, pw - m, firstY + i * cell, color, thinW))
    }
    // 线索栏竖线（贯通标题与总结线之间）
    els.push(L(cn.dividerX, m, cn.dividerX, cn.summaryY, strong, midW))
    // 总结区分隔横线
    els.push(L(m, cn.summaryY, pw - m, cn.summaryY, strong, midW))
    // 顶部标题横线
    els.push(L(m, m + cell * 0.6, pw - m, m + cell * 0.6, strong, midW))
    // 外框
    els.push({ t: 'rect', x: m, y: m, w: uw, h: uh, stroke: strong, sw: midW })
  }

  if (paperType.value === 'tianzhi') {
    const { cols: tc, rows: tr } = gridCount(pw, ph, m, cell)
    const startX = m + (uw - tc * cell) / 2
    const startY = m + (uh - tr * cell) / 2
    const half = cell / 2
    const dash = `${cell * 0.06} ${cell * 0.06}`
    for (let c = 0; c < tc; c++) {
      for (let r = 0; r < tr; r++) {
        const x = startX + c * cell
        const y = startY + r * cell
        els.push({ t: 'rect', x, y, w: cell, h: cell, stroke: strong, sw: midW })
        els.push(L(x + half, y, x + half, y + cell, color, thinW, dash))
        els.push(L(x, y + half, x + cell, y + half, color, thinW, dash))
        els.push(L(x, y, x + cell, y + cell, color, thinW, dash))
        els.push(L(x + cell, y, x, y + cell, color, thinW, dash))
      }
    }
  }

  return els
})

const densityText = computed(() => {
  if (paperType.value === 'lines') {
    return `${Math.floor(usable.value.h / sizeMm.value)} 行`
  }
  if (paperType.value === 'cornell') {
    const cn = cornellLayout(usable.value.w, usable.value.h, marginMm.value)
    return `${Math.max(0, Math.floor((cn.summaryY - marginMm.value - sizeMm.value) / sizeMm.value))} 行（右栏）`
  }
  if (paperType.value === 'staff') {
    const st = staffSystems(usable.value.h, sizeMm.value, 3)
    return `${st.systemCount} 系统 × 5 线（线距 ${sizeMm.value}mm）`
  }
  const { cols, rows } = gridCount(pageSize.value.w, pageSize.value.h, marginMm.value, sizeMm.value)
  return `${cols} × ${rows}`
})

// ---------- 打印 ----------
function printPaper() {
  window.print()
}

// 动态注入全局打印样式（@page 需随纸张方向变化；同时隐藏站点头尾）
let printStyle = null

function updatePrintStyle() {
  if (!printStyle) return
  const o = orientation.value === 'landscape' ? 'landscape' : 'portrait'
  const s = a4Size(orientation.value)
  printStyle.textContent = `
@media print {
  @page { size: A4 ${o}; margin: 0; }
  header, aside, footer, nav, .no-print { display: none !important; }
  main { padding: 0 !important; }
  .paper-stack { display: block !important; max-width: none !important; }
  .paper-sheet {
    width: ${s.w}mm !important; height: ${s.h}mm !important;
    max-width: none !important; margin: 0 !important; border: none !important;
    box-shadow: none !important; overflow: hidden;
  }
  .paper-sheet:not(:last-child) { page-break-after: always; break-after: page; }
  .paper-svg { width: 100% !important; height: 100% !important; }
}
`
}

watch(orientation, updatePrintStyle)

onMounted(() => {
  printStyle = document.createElement('style')
  printStyle.setAttribute('data-print', 'grid-paper')
  document.head.appendChild(printStyle)
  updatePrintStyle()
  const tool = tools.find((t) => t.id === 'grid-paper-printer')
  if (tool) addRecentTool(tool.id)
})

onUnmounted(() => {
  if (printStyle && printStyle.parentNode) {
    printStyle.parentNode.removeChild(printStyle)
  }
  printStyle = null
})

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
</script>

<style scoped>
.paper-stack {
  max-width: 320mm;
}

.paper-sheet {
  position: relative;
  width: 100%;
  margin: 0 auto 20px;
  background: #fff;
  border: 1px solid var(--border, #e4e4e7);
  border-radius: 4px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.10);
}

.sheet-page-tag {
  position: absolute;
  top: 6px;
  right: 10px;
  font-size: 10px;
  color: #9ca3af;
}

.paper-svg {
  display: block;
  width: 100%;
  height: auto;
}

@media print {
  .no-print {
    display: none !important;
  }
}
</style>
