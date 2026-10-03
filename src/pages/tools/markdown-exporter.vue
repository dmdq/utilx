<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileText class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Markdown导出器</h1>
          <p class="text-sm text-muted-foreground mt-1">Markdown 转独立 HTML / 片段 / 带行号 HTML，纯本地渲染</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴或上传 Markdown，右侧沙箱 iframe 实时预览；导出为内置浅色/深色排版样式的独立 HTML 文件、纯 HTML 片段或带行号 HTML。转换在浏览器本地完成，数据不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> 输入 Markdown
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
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload v-if="!inputFileName" class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
            <FileCheck v-else class="w-6 h-6 mx-auto mb-1.5 text-primary" />
            <p v-if="!inputFileName" class="text-xs text-muted-foreground">点击选择或拖入 .md / .markdown 文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ inputFileName }}</p>
          </div>

          <textarea
            v-model="mdText"
            class="w-full h-96 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴 Markdown 内容，例如：&#10;&#10;# 标题&#10;&#10;正文段落，支持 **加粗**、`行内代码`。&#10;&#10;```js&#10;console.log('代码块')&#10;```"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- 文件信息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 文件信息
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ charCount }}</p>
              <p class="text-xs text-muted-foreground">字数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ headingCount }}</p>
              <p class="text-xs text-muted-foreground">标题数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ codeBlockCount }}</p>
              <p class="text-xs text-muted-foreground">代码块</p>
            </div>
          </div>
          <button
            @click="clearAll"
            class="w-full mt-4 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" /> 清空
          </button>
        </div>
      </div>

      <!-- 右侧：预览与导出 -->
      <div class="space-y-6">
        <!-- 实时预览 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 实时预览
            </h2>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="t in themeOptions"
                :key="t.value"
                @click="theme = t.value"
                :class="theme === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded text-xs font-medium transition-all"
              >
                {{ t.label }}
              </button>
            </div>
          </div>
          <div class="p-4">
            <div class="border border-border rounded-lg overflow-hidden">
              <iframe
                :srcdoc="previewDoc"
                sandbox=""
                title="Markdown 渲染预览"
                class="w-full h-[440px] border-0"
              ></iframe>
            </div>
          </div>
        </div>

        <!-- 导出 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Download class="w-5 h-5 mr-2 text-primary" /> 导出 HTML
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copyOutput"
                :disabled="!exportedText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadOutput"
                :disabled="!exportedText"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载 .html
              </button>
            </div>
          </div>
          <div class="p-6">
            <!-- 导出格式 -->
            <label class="block text-sm font-medium text-foreground mb-2">导出格式</label>
            <div class="grid grid-cols-3 gap-1.5 mb-4">
              <button
                v-for="f in formatOptions"
                :key="f.value"
                @click="exportFormat = f.value"
                :class="exportFormat === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
                :title="f.title"
              >
                {{ f.label }}
              </button>
            </div>

            <textarea
              v-if="exportedText"
              :value="exportedText"
              readonly
              class="w-full h-44 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <div v-else class="h-44 flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
              <FileText class="w-8 h-8 mb-2 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入 Markdown 后，这里会显示导出的 HTML</p>
            </div>

            <ul class="text-xs text-muted-foreground space-y-1.5 mt-4">
              <li>• <span class="text-foreground">独立 HTML</span>：含完整文档结构与内联排版样式（随上方主题切换），单文件可直接打开</li>
              <li>• <span class="text-foreground">HTML 片段</span>：仅输出正文渲染结果，适合嵌入现有页面或 CMS</li>
              <li>• <span class="text-foreground">带行号 HTML</span>：在独立 HTML 基础上为每个内容块添加行号，便于比对审阅</li>
            </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于Markdown导出器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Markdown 适合写作，HTML 适合展示。本工具把 Markdown 渲染为 HTML，并提供三种导出形态：可直接打开的独立 HTML 文件（内置浅色/深色两套内联排版样式，含代码块样式）、纯 HTML 片段、以及带行号的 HTML，方便把文档带进网页、邮件或内部系统。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>把 README / 技术方案导出为带样式的 HTML，发给不熟悉 Markdown 的同事</li>
            <li>生成纯 HTML 片段，粘贴进博客、CMS 或邮件编辑器</li>
            <li>导出带行号 HTML，用于文档评审与逐行讨论</li>
            <li>深色主题导出适配暗色模式的文档站点</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">导出的 HTML 依赖外部资源吗？</span>不依赖。样式全部内联在文件中，单文件双击即可打开。</li>
            <li><span class="text-foreground font-medium">预览安全吗？</span>预览在 sandbox 沙箱 iframe 中渲染，脚本不会执行；所有转换都在浏览器本地完成。</li>
            <li><span class="text-foreground font-medium">带行号是按什么编号的？</span>按渲染后的内容块（段落、标题、列表等顶层元素）编号，便于定位讨论。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'markdown-exporter'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileText, Upload, FileCheck, Copy, Download, Eye, Info, Trash2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { marked } from 'marked'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Markdown导出器 - Markdown转HTML导出工具',
  description: '在线Markdown导出工具，实时预览并导出独立HTML文件（浅色/深色内联样式）、纯HTML片段、带行号HTML，转换在浏览器本地完成',
  keywords: 'markdown转html, markdown导出, markdown预览, markdown在线编辑, html片段, 带行号html',
  author: 'Util工具箱',
  ogTitle: 'Markdown导出器 - 有条工具',
  ogDescription: 'Markdown 转独立 HTML / 片段 / 带行号 HTML，纯本地渲染',
  ogUrl: 'https://www.util.cn/tools/markdown-exporter',
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
          name: 'Markdown导出器',
          url: 'https://www.util.cn/tools/markdown-exporter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Markdown实时预览', '导出独立HTML', '浅色/深色主题', '导出HTML片段', '带行号HTML导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'Markdown导出器', item: 'https://www.util.cn/tools/markdown-exporter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '导出的HTML依赖外部资源吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不依赖。样式全部内联在HTML文件中，单文件即可直接打开。' }
            },
            {
              '@type': 'Question',
              name: 'Markdown渲染会上传数据吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。渲染与导出均在浏览器本地完成，预览运行在沙箱iframe中，脚本不会执行。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'markdown-exporter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const mdText = ref('')
const inputFileName = ref('')
const theme = ref('light')
const exportFormat = ref('full')
const isDragging = ref(false)
const seoContentVisible = ref(true)
const fileInput = ref(null)

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' }
]

const formatOptions = [
  { value: 'full', label: '独立HTML', title: '完整文档，含内联样式' },
  { value: 'fragment', label: 'HTML片段', title: '仅正文渲染结果' },
  { value: 'lineNumbers', label: '带行号HTML', title: '独立HTML + 内容块行号' }
]

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 导出用内联样式 ----------
const LIGHT_CSS = `body{max-width:860px;margin:0 auto;padding:48px 24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;line-height:1.75;color:#1f2937;background:#ffffff;}
h1,h2,h3,h4,h5,h6{line-height:1.3;margin:1.6em 0 .8em;font-weight:700;}
h1{font-size:2em;border-bottom:1px solid #e5e7eb;padding-bottom:.3em;}
h2{font-size:1.5em;border-bottom:1px solid #f3f4f6;padding-bottom:.3em;}
h3{font-size:1.25em;}
p,ul,ol,blockquote,table,pre{margin:1em 0;}
ul,ol{padding-left:1.5em;}
a{color:#2563eb;text-decoration:none;}
a:hover{text-decoration:underline;}
code{font-family:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;font-size:.875em;background:#f3f4f6;padding:.2em .4em;border-radius:4px;}
pre{background:#f6f8fa;border:1px solid #e5e7eb;border-radius:8px;padding:16px;overflow:auto;}
pre code{background:none;padding:0;font-size:.875em;}
blockquote{border-left:4px solid #d1d5db;padding-left:1em;color:#6b7280;}
table{border-collapse:collapse;width:100%;display:block;overflow:auto;}
th,td{border:1px solid #e5e7eb;padding:8px 12px;}
th{background:#f9fafb;font-weight:600;}
img{max-width:100%;}
hr{border:none;border-top:1px solid #e5e7eb;margin:2em 0;}`

const DARK_CSS = `body{max-width:860px;margin:0 auto;padding:48px 24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;line-height:1.75;color:#e6edf3;background:#0d1117;}
h1,h2,h3,h4,h5,h6{line-height:1.3;margin:1.6em 0 .8em;font-weight:700;}
h1{font-size:2em;border-bottom:1px solid #30363d;padding-bottom:.3em;}
h2{font-size:1.5em;border-bottom:1px solid #21262d;padding-bottom:.3em;}
h3{font-size:1.25em;}
p,ul,ol,blockquote,table,pre{margin:1em 0;}
ul,ol{padding-left:1.5em;}
a{color:#58a6ff;text-decoration:none;}
a:hover{text-decoration:underline;}
code{font-family:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;font-size:.875em;background:#161b22;padding:.2em .4em;border-radius:4px;}
pre{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:16px;overflow:auto;}
pre code{background:none;padding:0;font-size:.875em;}
blockquote{border-left:4px solid #30363d;padding-left:1em;color:#8b949e;}
table{border-collapse:collapse;width:100%;display:block;overflow:auto;}
th,td{border:1px solid #30363d;padding:8px 12px;}
th{background:#161b22;font-weight:600;}
img{max-width:100%;}
hr{border:none;border-top:1px solid #30363d;margin:2em 0;}`

const LINE_NUMBER_CSS = `.md-line-numbers{counter-reset:md-line;}
.md-line-numbers>*{position:relative;margin-left:3em;}
.md-line-numbers>*::before{counter-increment:md-line;content:counter(md-line);position:absolute;left:-3em;top:0;width:2.5em;text-align:right;color:#9ca3af;font-size:.8em;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;}`

const buildFullDoc = (bodyHtml, themeValue, lineNumbers) => {
  const css = themeValue === 'dark' ? DARK_CSS : LIGHT_CSS
  const lnCss = lineNumbers ? '\n' + LINE_NUMBER_CSS : ''
  const body = lineNumbers
    ? '<div class="md-line-numbers">\n' + bodyHtml + '\n</div>'
    : bodyHtml
  return [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>Markdown 导出</title>',
    '<style>',
    css + lnCss,
    '</style>',
    '</head>',
    '<body>',
    body,
    '</body>',
    '</html>',
    ''
  ].join('\n')
}

// ---------- 渲染 ----------
const renderedHtml = computed(() => {
  try {
    return marked.parse(mdText.value || '')
  } catch (e) {
    return ''
  }
})

const previewDoc = computed(() => buildFullDoc(renderedHtml.value, theme.value, false))

const exportedText = computed(() => {
  if (!mdText.value.trim()) return ''
  if (exportFormat.value === 'fragment') return renderedHtml.value
  return buildFullDoc(renderedHtml.value, theme.value, exportFormat.value === 'lineNumbers')
})

// ---------- 文件信息 ----------
const charCount = computed(() => mdText.value.replace(/\s/g, '').length)
const headingCount = computed(() => (mdText.value.match(/^#{1,6}\s+\S/gm) || []).length)
const codeBlockCount = computed(() => Math.floor((mdText.value.match(/^[ \t]*```/gm) || []).length / 2))

// ---------- 交互 ----------
const copyOutput = async () => {
  if (!exportedText.value) return
  try {
    await navigator.clipboard.writeText(exportedText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = exportedText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = async (e) => {
  const selected = e.target.files?.[0]
  if (selected) {
    inputFileName.value = selected.name
    mdText.value = await selected.text()
  }
  e.target.value = ''
}

const handleDrop = async (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) {
    inputFileName.value = dropped.name
    mdText.value = await dropped.text()
  }
}

const clearAll = () => {
  mdText.value = ''
  inputFileName.value = ''
}

const downloadOutput = () => {
  if (!exportedText.value) return
  const blob = new Blob([exportedText.value], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const base = (inputFileName.value || 'document').replace(/\.[^.]+$/, '')
  a.href = url
  a.download = `${base}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
