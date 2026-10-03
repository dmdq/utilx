<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileImage class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">SVG优化压缩器</h1>
          <p class="text-sm text-muted-foreground mt-1">清理编辑器元数据、压缩数字精度，纯本地保守优化</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴 SVG 代码或上传 .svg 文件，去除注释、Inkscape/Illustrator 等编辑器元数据与空节点，按可调精度压缩坐标数值，支持实时预览与下载。保守策略：不动路径数据形状，只做无损/近无损压缩，全部处理在浏览器本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入与选项 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileImage class="w-5 h-5 mr-2 text-primary" /> 输入 SVG
          </h2>

          <!-- 上传区 -->
          <div
            class="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30 mb-4"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".svg,image/svg+xml"
              class="hidden"
              @change="handleFileChange"
            />
            <FileImage class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
            <p v-if="!fileName" class="text-xs text-muted-foreground">点击选择或拖入 .svg 文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ fileName }}</p>
          </div>

          <textarea
            v-model="inputText"
            class="w-full h-56 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴完整的 SVG 代码（以 <svg> 开头）"
            spellcheck="false"
          ></textarea>

          <button
            @click="clearAll"
            :disabled="!inputText"
            class="w-full mt-4 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" /> 清空
          </button>
        </div>

        <!-- 优化选项 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 优化选项
          </h2>

          <div class="space-y-3.5">
            <label
              v-for="item in optionItems"
              :key="item.key"
              class="flex items-center justify-between cursor-pointer"
            >
              <span>
                <span class="text-sm text-foreground block">{{ item.label }}</span>
                <span class="text-xs text-muted-foreground">{{ item.desc }}</span>
              </span>
              <button
                type="button"
                @click="options[item.key] = !options[item.key]"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3"
                :class="options[item.key] ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="options[item.key] ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <!-- 数字精度 -->
            <div class="flex items-center justify-between pt-1">
              <span>
                <span class="text-sm text-foreground block">数字精度压缩</span>
                <span class="text-xs text-muted-foreground">对 d/x/y/cx/cy/r 等坐标数值做四舍五入</span>
              </span>
              <button
                type="button"
                @click="options.precisionOn = !options.precisionOn"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3"
                :class="options.precisionOn ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="options.precisionOn ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </div>
            <div v-if="options.precisionOn" class="flex items-center gap-3 pl-0.5">
              <input
                v-model.number="options.precision"
                type="range"
                min="0"
                max="3"
                step="1"
                class="flex-1 accent-primary"
              />
              <span class="text-xs text-muted-foreground w-20 text-right">保留 {{ options.precision }} 位小数</span>
            </div>
          </div>

          <div class="mt-5 flex items-start gap-2 bg-muted/50 rounded-lg p-3">
            <AlertTriangle class="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">
              保守策略：不会重写或简化路径数据的形状，只做无损/近无损压缩。精度设为 0 位（取整）体积最小，但视觉偏差也最大，建议 1-2 位。
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧：统计 / 输出 / 预览 -->
      <div class="space-y-6">
        <!-- 体积统计 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Gauge class="w-4 h-4 mr-2 text-primary" /> 体积对比
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-foreground">{{ formatBytes(originalBytes) }}</p>
              <p class="text-xs text-muted-foreground">原始大小</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-foreground">{{ formatBytes(optimizedBytes) }}</p>
              <p class="text-xs text-muted-foreground">优化后</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold" :class="savings > 0 ? 'text-green-500' : 'text-muted-foreground'">
                {{ savings > 0 ? '-' + savings.toFixed(1) + '%' : '--' }}
              </p>
              <p class="text-xs text-muted-foreground">节省</p>
            </div>
          </div>
        </div>

        <!-- 输出 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 优化结果
            </h2>
            <div class="flex items-center gap-2">
              <div class="grid grid-cols-2 gap-1 mr-1">
                <button
                  @click="viewMode = 'pretty'"
                  :class="viewMode === 'pretty' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-1.5 rounded text-xs font-medium transition-all"
                >格式化</button>
                <button
                  @click="viewMode = 'min'"
                  :class="viewMode === 'min' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-1.5 rounded text-xs font-medium transition-all"
                >压缩</button>
              </div>
              <button
                @click="copyOutput"
                :disabled="!outputSvg"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadOutput"
                :disabled="!outputSvg"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </div>
          </div>
          <div class="p-6">
            <textarea
              v-if="viewText"
              :value="viewText"
              readonly
              class="w-full h-72 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <div v-else-if="parseError" class="py-12 text-center">
              <AlertTriangle class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">无法优化</p>
              <p class="text-xs text-muted-foreground">{{ parseError }}</p>
            </div>
            <div v-else class="py-12 text-center">
              <FileImage class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">粘贴或上传 SVG 后，这里会显示优化结果</p>
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Eye class="w-4 h-4 mr-2 text-primary" /> 渲染预览
          </h3>
          <iframe
            v-if="outputSvg"
            :srcdoc="outputSvg"
            sandbox=""
            class="w-full h-64 rounded-lg border border-border bg-muted"
            title="SVG 渲染预览"
          ></iframe>
          <div v-else class="h-64 rounded-lg border border-dashed border-border flex items-center justify-center">
            <p class="text-sm text-muted-foreground">优化后可实时预览渲染效果</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于SVG优化压缩器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            从 Inkscape、Illustrator、Figma 等编辑器导出的 SVG 通常携带大量冗余：编辑器命名空间（inkscape:*、sodipodi:*）、metadata 节点、注释、多余的空分组以及过高精度的坐标小数。这些内容浏览器渲染时完全用不到，却会让文件体积膨胀数倍。本工具按「保守策略」清理这些冗余：不重排路径命令、不简化曲线形状，只删除确定无用的内容并对坐标数值做四舍五入，属于无损/近无损压缩。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>网页图标与插画上线前瘦身，减少首屏资源体积</li>
            <li>清理设计工具导出文件中的编辑器痕迹，便于交付与版本管理</li>
            <li>App / 小程序资源包体积优化</li>
            <li>嵌入邮件或文档前压缩 SVG 代码长度</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">会影响显示效果吗？</span>默认设置下视觉无差别；将数字精度调到 0 位（取整）时可能出现细微偏移，建议逐级尝试并用预览确认。</li>
            <li><span class="text-foreground font-medium">和 SVG 深度压缩工具有什么区别？</span>深度压缩会重写路径数据（合并命令、简化曲线），体积更小但可能改变形状；本工具保证形状不动，适合对还原度要求高的场景。</li>
            <li><span class="text-foreground font-medium">代码会上传吗？</span>不会。解析与优化全部在浏览器本地完成，数据不出设备。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'svg-optimizer'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  FileImage, Settings2, Gauge, Copy, Download, Trash2, Eye,
  AlertTriangle, CheckCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'SVG优化压缩器 - 在线SVG压缩与代码清理工具',
  description: '在线SVG压缩优化工具，去除注释、inkscape/sodipodi编辑器元数据、空group，按精度压缩坐标数字，实时预览渲染，保守策略不动路径形状，纯本地处理',
  keywords: 'svg压缩, svg优化, svg瘦身, svg minify, inkscape清理, svg元数据清理, svg代码精简',
  author: 'Util工具箱',
  ogTitle: 'SVG优化压缩器 - 有条工具',
  ogDescription: '清理编辑器元数据、压缩数字精度，纯本地保守优化',
  ogUrl: 'https://www.util.cn/tools/svg-optimizer',
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
          name: 'SVG优化压缩器',
          url: 'https://www.util.cn/tools/svg-optimizer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['去除注释与编辑器元数据', '去除空group', '数字精度压缩', '实时渲染预览', '体积对比统计']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: 'SVG优化压缩器', item: 'https://www.util.cn/tools/svg-optimizer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'SVG优化会改变图形显示效果吗？',
              acceptedAnswer: { '@type': 'Answer', text: '采用保守策略，不重写路径数据形状，默认设置下视觉无差别；精度调到0位时可能有细微偏移，建议用预览确认。' }
            },
            {
              '@type': 'Question',
              name: 'SVG代码会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，所有解析与优化都在浏览器本地完成，数据不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'svg-optimizer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const inputText = ref('')
const fileName = ref('')
const isDragging = ref(false)
const parseError = ref('')
const outputSvg = ref('')
const viewMode = ref('pretty')
const seoContentVisible = ref(true)
const fileInput = ref(null)

const options = reactive({
  removeComments: true,
  removeMetadata: true,
  removeEmptyGroups: true,
  collapseWhitespace: true,
  precisionOn: true,
  precision: 1
})

const optionItems = [
  { key: 'removeComments', label: '去除注释', desc: '移除 <!-- --> 注释节点' },
  { key: 'removeMetadata', label: '去除编辑器元数据', desc: '移除 inkscape:*/sodipodi:* 属性与命名空间、<metadata>、<sodipodi:namedview>' },
  { key: 'removeEmptyGroups', label: '去除空 group', desc: '移除没有子元素和文本内容的 <g>' },
  { key: 'collapseWhitespace', label: '折叠空白', desc: '压缩标签之间的换行与缩进空白' }
]

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 数字精度压缩 ----------
const NUMERIC_ATTRS = 'cx|cy|x1|x2|y1|y2|rx|ry|dx|dy|width|height|points|transform|stroke-width|stroke-dasharray|offset|d|x|y|r'

const roundNumbers = (val, p) => {
  const re = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/g
  return val.replace(re, (m) => String(parseFloat(Number(m).toFixed(p))))
}

const roundAttrNumbers = (svg, p) => {
  // 分组1：属性名与 =" 前缀（保留原始空白符），分组2：属性值，结尾引号原样保留
  const re = new RegExp('(\\s(?:' + NUMERIC_ATTRS + ')=")([^"]*)"', 'g')
  return svg.replace(re, (m, prefix, val) => prefix + roundNumbers(val, p) + '"')
}

// ---------- 字符串级处理（正则通道 / 序列化后共用） ----------
const applyStringSteps = (svg, opt) => {
  let out = svg
  if (opt.precisionOn) out = roundAttrNumbers(out, opt.precision)
  if (opt.collapseWhitespace) out = out.replace(/>\s+</g, '><').trim()
  return out
}

// ---------- 正则通道（DOMParser 失败时的降级） ----------
const optimizeWithRegex = (src, opt) => {
  let out = src
  if (opt.removeComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, '')
  }
  if (opt.removeMetadata) {
    out = out.replace(/<metadata[\s\S]*?<\/metadata\s*>/gi, '')
    out = out.replace(/<metadata[^>]*\/>/gi, '')
    out = out.replace(/<sodipodi:namedview[\s\S]*?<\/sodipodi:namedview\s*>/gi, '')
    out = out.replace(/<sodipodi:namedview[^>]*\/?>/gi, '')
    out = out.replace(/\s(?:inkscape|sodipodi):[\w.-]+\s*=\s*"[^"]*"/g, '')
    out = out.replace(/\sxmlns:(?:inkscape|sodipodi)\s*=\s*"[^"]*"/g, '')
  }
  if (opt.removeEmptyGroups) {
    let prev
    do {
      prev = out
      out = out.replace(/<g(?:\s[^>]*)?>\s*<\/g>/g, '')
    } while (out !== prev)
  }
  return applyStringSteps(out, opt)
}

// ---------- DOM 通道（DOMParser 解析成功优先） ----------
const optimizeWithDom = (doc, opt) => {
  const root = doc.documentElement

  if (opt.removeComments) {
    const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */)
    const comments = []
    while (walker.nextNode()) comments.push(walker.currentNode)
    comments.forEach((n) => {
      if (n.parentNode) n.parentNode.removeChild(n)
    })
  }

  if (opt.removeMetadata) {
    const all = [root].concat(Array.prototype.slice.call(root.getElementsByTagName('*')))
    const toRemove = []
    for (const el of all) {
      const tagName = el.tagName || ''
      if (tagName === 'metadata' || tagName.indexOf('sodipodi:') === 0) {
        toRemove.push(el)
        continue
      }
      const attrs = Array.prototype.slice.call(el.attributes)
      for (const attr of attrs) {
        const n = attr.name
        if (n.indexOf('inkscape:') === 0 || n.indexOf('sodipodi:') === 0 ||
            n === 'xmlns:inkscape' || n === 'xmlns:sodipodi') {
          el.removeAttribute(n)
        }
      }
    }
    toRemove.forEach((el) => {
      if (el.parentNode) el.parentNode.removeChild(el)
    })
  }

  if (opt.removeEmptyGroups) {
    // 文档顺序父在前子在后，倒序处理可逐层移除嵌套空组
    const groups = Array.prototype.slice.call(root.querySelectorAll('g')).reverse()
    for (const g of groups) {
      if (!g.parentNode) continue
      const hasElement = g.querySelector('*')
      const hasText = Array.prototype.some.call(g.childNodes, (n) => n.nodeType === 3 && n.textContent.trim() !== '')
      if (!hasElement && !hasText) g.parentNode.removeChild(g)
    }
  }

  const serialized = new XMLSerializer().serializeToString(root)
  return applyStringSteps(serialized, opt)
}

// ---------- 主流程：DOMParser 解析成功优先，失败降级正则 ----------
const optimizeSvg = (src, opt) => {
  let doc = null
  try {
    const parsed = new DOMParser().parseFromString(src, 'image/svg+xml')
    if (parsed.getElementsByTagName('parsererror').length === 0 && parsed.documentElement &&
        parsed.documentElement.nodeName.toLowerCase() === 'svg') {
      doc = parsed
    }
  } catch (e) { /* 降级到正则通道 */ }
  return doc ? optimizeWithDom(doc, opt) : optimizeWithRegex(src, opt)
}

// ---------- 防抖执行 ----------
let runTimer = null
const runOptimize = () => {
  parseError.value = ''
  outputSvg.value = ''
  const src = inputText.value
  if (!src.trim()) return
  if (!/<svg[\s>]/i.test(src)) {
    parseError.value = '未检测到 <svg> 根元素，请确认粘贴的是完整的 SVG 代码。'
    return
  }
  try {
    outputSvg.value = optimizeSvg(src, { ...options })
  } catch (err) {
    parseError.value = '优化过程出现异常，请检查代码是否完整。'
  }
}

const scheduleRun = () => {
  if (runTimer) clearTimeout(runTimer)
  runTimer = setTimeout(runOptimize, 300)
}

watch(options, scheduleRun, { deep: true })
watch(inputText, scheduleRun)
onUnmounted(() => {
  if (runTimer) clearTimeout(runTimer)
})

// ---------- 统计与视图 ----------
const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  return (bytes / 1024).toFixed(1) + ' KB'
}

const byteSize = (str) => {
  if (!process.client || !str) return 0
  try {
    return new Blob([str]).size
  } catch (e) {
    return str.length
  }
}

const originalBytes = computed(() => byteSize(inputText.value))
const optimizedBytes = computed(() => byteSize(outputSvg.value))
const savings = computed(() => {
  if (!originalBytes.value || !optimizedBytes.value) return 0
  return (1 - optimizedBytes.value / originalBytes.value) * 100
})

const collapseWhitespace = (svg) => svg.replace(/>\s+</g, '><').trim()

const prettyPrintSvg = (src) => {
  const lines = collapseWhitespace(src).replace(/></g, '>\n<').split('\n')
  let depth = 0
  const out = []
  for (const line of lines) {
    const isClose = /^<\//.test(line)
    const isOpen = /^<[^/!?]/.test(line)
    const isSelfClose = /\/>$/.test(line)
    if (isClose) depth = Math.max(0, depth - 1)
    out.push('  '.repeat(depth) + line)
    if (isOpen && !isSelfClose) depth++
  }
  return out.join('\n')
}

const viewText = computed(() => {
  if (!outputSvg.value) return ''
  return viewMode.value === 'pretty' ? prettyPrintSvg(outputSvg.value) : collapseWhitespace(outputSvg.value)
})

// ---------- 交互 ----------
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const copyOutput = async () => {
  if (!viewText.value) return
  await copyText(viewText.value)
}

const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = async (e) => {
  const selected = e.target.files?.[0]
  if (selected) {
    fileName.value = selected.name
    inputText.value = await selected.text()
  }
  e.target.value = ''
}

const handleDrop = async (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) {
    fileName.value = dropped.name
    inputText.value = await dropped.text()
  }
}

const clearAll = () => {
  inputText.value = ''
  fileName.value = ''
  outputSvg.value = ''
  parseError.value = ''
}

const downloadOutput = () => {
  if (!outputSvg.value) return
  const blob = new Blob([outputSvg.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const base = (fileName.value || 'optimized').replace(/\.[^.]+$/, '')
  a.href = url
  a.download = `${base}.min.svg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
