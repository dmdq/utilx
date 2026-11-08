<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FilePen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Markdown转Word</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴 Markdown 一键导出 Word 文档，标题、表格、代码块完整保留，全程本地转换</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        粘贴 Markdown 或拖入 .md / .txt 文件，工具在浏览器本地将其解析为 HTML，
        再注入 Word 可识别的文档设置与样式（标题层级、Consolas 代码块、全边框表格、引用块等），
        导出为 Word 兼容的 .doc 文件，Word / WPS 均可直接打开编辑。支持自定义文档标题、
        正文字体（宋体 / 微软雅黑 / 黑体）与字号（10.5 / 12 / 14pt），右侧白纸预览所见即所得。
      </p>
      <div class="flex flex-wrap gap-2 mb-3">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground">
          <Check class="w-3.5 h-3.5 text-primary" /> GFM 表格 / 代码块 / 引用完整保留
        </span>
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground">
          <Check class="w-3.5 h-3.5 text-primary" /> 宋体 / 微软雅黑 / 黑体三选
        </span>
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground">
          <Check class="w-3.5 h-3.5 text-primary" /> 免安装，浏览器直接转换
        </span>
      </div>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        数据不出浏览器：Markdown 全程在本地解析与生成，不会上传到任何服务器。
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground">Markdown 输入</h2>
          <span class="text-xs text-muted-foreground">支持 GFM 表格 / 删除线 / 任务列表</span>
        </div>

        <div
          class="border-2 border-dashed rounded-lg overflow-hidden transition-colors"
          :class="isDragging ? 'border-primary bg-primary/5' : 'border-border'"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <textarea
            v-model="markdownText"
            class="w-full h-80 px-4 py-3 bg-background border-0 focus:outline-none resize-none font-mono text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="在此粘贴 Markdown 文本，或将 .md / .markdown / .txt 文件拖入此区域..."
          ></textarea>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept=".md,.markdown,.txt"
          class="hidden"
          @change="handleFileChange"
        />

        <div class="flex flex-wrap gap-2">
          <button
            @click="triggerPick"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileUp class="w-4 h-4" /> 选择文件
          </button>
          <button
            @click="pasteFromClipboard"
            class="px-3 py-1.5 text-sm rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            粘贴
          </button>
          <button
            @click="loadSample"
            class="px-3 py-1.5 text-sm rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            示例
          </button>
          <button
            @click="clearInput"
            class="px-3 py-1.5 text-sm rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            清空
          </button>
        </div>

        <p v-if="fileError" class="text-sm text-red-500">{{ fileError }}</p>

        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border pt-3">
          <span>字符 {{ charCount }}</span>
          <span>标题 {{ headingCount }}</span>
          <span>表格 {{ tableCount }}</span>
          <span v-if="fileInfo" class="truncate max-w-full">{{ fileInfo }}</span>
        </div>
      </div>

      <!-- 右：设置与预览 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Settings2 class="w-5 h-5 mr-2 text-primary" /> 转换设置
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">文档标题（可选，作为首行大标题与下载文件名）</label>
          <input
            v-model="docTitle"
            type="text"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="留空时取文档第一个标题或默认名"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">正文字体</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="f in fontOptions"
                :key="f.value"
                @click="fontChoice = f.value"
                class="py-1.5 text-sm rounded-lg border transition-colors"
                :class="fontChoice === f.value
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'"
              >{{ f.label }}</button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">正文字号</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="s in sizeOptions"
                :key="s.value"
                @click="fontSize = s.value"
                class="py-1.5 text-xs rounded-lg border transition-colors"
                :class="fontSize === s.value
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'"
              >{{ s.label }}</button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Eye class="w-5 h-5 mr-2 text-primary" /> Word 样式预览
          </h2>
          <span class="text-xs text-muted-foreground">白纸效果近似导出排版</span>
        </div>

        <div
          v-if="previewHtml"
          class="word-paper bg-white text-black border border-border rounded-md shadow-sm p-8 max-h-[520px] overflow-auto"
          :style="{ fontFamily: activeFont.stack, fontSize: fontSize + 'pt' }"
        >
          <div
            v-if="docTitle.trim()"
            class="text-center font-bold"
            style="font-size: 24pt; margin: 0 0 16pt 0;"
          >{{ docTitle }}</div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="previewHtml"></div>
        </div>
        <div
          v-else
          class="border border-dashed border-border rounded-md p-10 text-center text-sm text-muted-foreground bg-muted/30"
        >
          <template v-if="previewError">{{ previewError }}</template>
          <template v-else>粘贴或拖入 Markdown 后，这里将显示导出 Word 的样式预览</template>
        </div>

        <button
          @click="downloadDoc"
          :disabled="!previewHtml || isExporting"
          class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Download class="w-4 h-4" /> 下载 .doc 文档
        </button>
        <p v-if="exportStatus" class="text-xs" :class="exportOk ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ exportStatus }}</p>
        <p class="text-xs text-muted-foreground flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
          导出为 .doc 格式（Word / WPS 可直接打开编辑）；如需 .docx，在 Word 中「另存为」选择 .docx 即可。
        </p>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          在线 Markdown 转 Word 工具
        </h2>
        <p class="text-muted-foreground mb-6">
          很多文档的最终交付格式仍是 Word：给客户的需求说明、交给导师的论文初稿、要在公司内部流转的周报。
          本工具补上「从 Markdown 到 Word」的最后一公里：先用 marked 按 GitHub Flavored Markdown 规则
          把文本解析为 HTML，再注入 Word 可识别的文档设置（页面尺寸、页边距）与元素样式
          （标题层级、代码块底色、表格边框、引用缩进），最后打包为 Word 兼容的 .doc 文件供下载。
          全程在浏览器本地完成，内容不会上传到任何服务器，断网也能用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">样式映射规则</h3>
        <p class="text-muted-foreground mb-6">
          导出的文档使用 Word 识别度最高的简写 CSS：h1–h6 字号递减并加粗（22pt 至 10pt）；
          行内代码与代码块使用 Consolas 等宽字体、#f9f9f9 浅灰底并带细边框（Word 对 mso 背景要求纯色，
          不支持半透明）；表格为全边框加边框合并，表头浅灰底加粗；引用块左缩进、斜体并带左侧竖线；
          列表保持标准圆点 / 数字序号；链接保留蓝色下划线；分割线渲染为水平横线。
          正文可选宋体、微软雅黑或黑体，字号支持 10.5pt（五号）、12pt（小四）、14pt（四号）三档。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">如何使用</h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框粘贴 Markdown 文本，或把 .md / .markdown / .txt 文件拖入输入区</li>
          <li>可选：填写文档标题（将作为首行大标题与下载文件名），选择正文字体与字号</li>
          <li>在右侧白纸预览中确认排版效果</li>
          <li>点击「下载 .doc 文档」，用 Word 或 WPS 打开即可继续编辑</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mb-2">适用场景</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-semibold text-foreground mb-1">文档交付</h4>
            <p class="text-sm text-muted-foreground">用 Markdown 写好的需求文档、接口说明，转成 Word 交给不用 Markdown 的同事或客户</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-semibold text-foreground mb-1">论文与作业初稿</h4>
            <p class="text-sm text-muted-foreground">在 Markdown 里完成内容与结构，再转 Word 套学校的格式要求做最后调整</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-semibold text-foreground mb-1">周报与汇报</h4>
            <p class="text-sm text-muted-foreground">把周报、项目汇报中的表格与要点列表转成 Word，方便邮件附件或打印</p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-semibold text-foreground mb-1">内容存档分发</h4>
            <p class="text-sm text-muted-foreground">把 README、笔记转成 Word 存档，发给需要离线阅读或批注的人</p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">导出的是 .doc 还是 .docx？</h3>
            <p class="text-muted-foreground mt-1">
              导出为 .doc 格式（Word 兼容 HTML 文档），Word 与 WPS 均可直接打开编辑，排版样式完整保留。
              如需 .docx，在 Word 中「另存为」选择 .docx 格式保存一次即可，内容不会丢失。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">文档里的图片能显示吗？</h3>
            <p class="text-muted-foreground mt-1">
              以 data: URL（base64）内嵌的图片会直接写进文档，Word 打开即可显示，无需联网。
              远程 http(s) 图片链接不会自动内嵌：Word 打开时需要联网拉取，且可能被安全设置拦截而显示为空。
              建议先把远程图片转成本地 data: URL（例如用 base64 编码工具）再插入 Markdown。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">文件会上传到服务器吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。解析（marked）、样式注入与 .doc 文件生成全部在浏览器本地完成，
              输入的 Markdown 与生成的文档不经过任何服务器，断网状态下同样可用。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些 Markdown 语法？</h3>
            <p class="text-muted-foreground mt-1">
              支持 GitHub Flavored Markdown（GFM）：标题、粗体、斜体、删除线、表格、任务列表、
              有序 / 无序列表、行内代码与代码块、引用块、链接、图片、分割线等。
              数学公式与脚注等扩展语法暂不支持。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么 Word 打开后的排版和预览略有差异？</h3>
            <p class="text-muted-foreground mt-1">
              预览是浏览器对同一套样式的近似渲染，Word 对字体度量、行距与表格宽度的处理与浏览器略有不同，
              属正常现象。若某台电脑未安装所选字体（如微软雅黑），Word 会用系统默认字体替代，
              可在 Word 中全选后重新指定字体。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'markdown-to-word'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  FilePen, ShieldCheck, Check, FileUp, Download, Settings2,
  Eye, TriangleAlert, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Markdown转Word - 在线 MD 一键导出 Word 文档工具',
  description: '免费在线 Markdown 转 Word 工具，粘贴或拖入 .md 文件一键导出 Word 兼容 .doc 文档，标题表格代码块完整保留，字体字号可调，全程本地转换不上传',
  keywords: 'markdown转word, md转word, markdown转doc, markdown导出word, md转文档, markdown to word',
  author: 'Util工具箱',
  ogTitle: 'Markdown转Word - 有条工具',
  ogDescription: 'Markdown 一键转 Word 文档，标题表格代码块完整保留，本地转换不上传',
  ogUrl: 'https://www.util.cn/tools/markdown-to-word',
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
          '@type': 'SoftwareApplication',
          name: 'Markdown转Word',
          url: 'https://www.util.cn/tools/markdown-to-word',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'GFM 表格 / 删除线 / 任务列表解析',
            '导出 Word 兼容 .doc 文档',
            '标题层级 / 代码块 / 引用块样式映射',
            '文档标题可选',
            '宋体 / 微软雅黑 / 黑体三选',
            '10.5 / 12 / 14pt 字号三档',
            'Word 白纸样式预览',
            '本地转换不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: 'Markdown转Word', item: 'https://www.util.cn/tools/markdown-to-word/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '导出的是 .doc 还是 .docx？',
              acceptedAnswer: { '@type': 'Answer', text: '导出为 .doc 格式（Word 兼容 HTML 文档），Word 与 WPS 均可直接打开编辑；如需 .docx，在 Word 中「另存为」选择 .docx 格式保存一次即可。' }
            },
            {
              '@type': 'Question',
              name: '文档里的图片能显示吗？',
              acceptedAnswer: { '@type': 'Answer', text: '以 data: URL（base64）内嵌的图片会直接写进文档，Word 打开即可显示；远程 http(s) 图片不会自动内嵌，Word 打开时需联网且可能被安全设置拦截，建议先转成本地 data: URL 再插入。' }
            },
            {
              '@type': 'Question',
              name: '文件会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析、样式注入与 .doc 生成全部在浏览器本地完成，输入与输出不经过任何服务器，断网也可用。' }
            },
            {
              '@type': 'Question',
              name: '支持哪些 Markdown 语法？',
              acceptedAnswer: { '@type': 'Answer', text: '支持 GitHub Flavored Markdown（GFM）：标题、粗斜体、删除线、表格、任务列表、列表、代码块、引用块、链接、图片、分割线等；数学公式与脚注暂不支持。' }
            },
            {
              '@type': 'Question',
              name: '为什么 Word 打开后的排版和预览略有差异？',
              acceptedAnswer: { '@type': 'Answer', text: '预览是浏览器的近似渲染，Word 对字体度量、行距与表格宽度处理略有不同，属正常现象；若系统缺少所选字体会以默认字体替代，可在 Word 中重新指定。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'markdown-to-word')

// ---------- 常量 ----------
const fontOptions = [
  { value: 'SimSun', label: '宋体', stack: "SimSun, '宋体', serif" },
  { value: 'Microsoft YaHei', label: '微软雅黑', stack: "'Microsoft YaHei', '微软雅黑', 'PingFang SC', sans-serif" },
  { value: 'SimHei', label: '黑体', stack: "SimHei, '黑体', sans-serif" }
]
const sizeOptions = [
  { value: 10.5, label: '10.5pt 五号' },
  { value: 12, label: '12pt 小四' },
  { value: 14, label: '14pt 四号' }
]

// 示例文档（数组拼接避免嵌套反引号转义问题）
const SAMPLE_MARKDOWN = [
  '# 项目周报',
  '',
  '## 本周进展',
  '',
  '**搜索模块**已上线，支持 ***拼音纠错*** 与结果高亮，~~旧版入口~~已下线。',
  '',
  '| 模块 | 进度 | 负责人 |',
  '| ---- | ---- | ------ |',
  '| 搜索 | 100% | 张三   |',
  '| 导出 | 60%  | 李四   |',
  '',
  '### 代码示例',
  '',
  '```js',
  'function greet(name) {',
  "  return `你好, ${name}`",
  '}',
  '```',
  '',
  '行内代码如 `npm install` 保持等宽字体。',
  '',
  '> 提示：所有数据仅在浏览器本地处理，不会上传服务器。',
  '',
  '- 支持表格与删除线',
  '- 支持代码块与引用',
  '',
  '1. 粘贴 Markdown',
  '2. 调整字体字号',
  '3. 下载 .doc 文档',
  '',
  '详见 [使用手册](https://example.com/manual)。',
  '',
  '---'
].join('\n')

// ---------- 状态 ----------
const markdownText = ref('')
const docTitle = ref('')
const fontChoice = ref('SimSun')
const fontSize = ref(12)
const previewHtml = ref('')
const previewError = ref('')
const isDragging = ref(false)
const fileInfo = ref('')
const fileError = ref('')
const isExporting = ref(false)
const exportStatus = ref('')
const exportOk = ref(false)
const seoContentVisible = ref(true)
const fileInputRef = ref(null)

let previewTimer = null

const activeFont = computed(() => {
  return fontOptions.find(f => f.value === fontChoice.value) || fontOptions[0]
})

// 统计：字符数 / 标题数 / 表格数（基于 Markdown 源文本，即时计算）
const charCount = computed(() => markdownText.value.length)
const headingCount = computed(() => countHeadings(markdownText.value))
const tableCount = computed(() => countTables(markdownText.value))

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

onBeforeUnmount(() => {
  if (previewTimer) {
    clearTimeout(previewTimer)
    previewTimer = null
  }
})

// 输入防抖：300ms 后解析预览（marked 动态 import 仅在防抖回调内执行）
watch(markdownText, () => {
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(updatePreview, 300)
})

// ---------- 纯函数（node 自测覆盖） ----------

// HTML 转义（文档标题 / <title> 用）
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Markdown 源文本统计：ATX 标题行数
function countHeadings(md) {
  const text = String(md || '')
  if (!text) return 0
  let n = 0
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (/^ {0,3}#{1,6}\s+\S/.test(lines[i])) n++
  }
  return n
}

// Markdown 源文本统计：表格分隔行数（如 | --- | --- |）
function countTables(md) {
  const text = String(md || '')
  if (!text) return 0
  let n = 0
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t || t.indexOf('|') === -1) continue
    if (/^ {0,3}\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(t)) n++
  }
  return n
}

// 取第一个 ATX 标题文本（用于默认文件名）
function firstHeadingText(md) {
  const lines = String(md || '').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/)
    if (m) return m[1].trim()
  }
  return ''
}

// 文件名净化：中文标题 → 安全文件名（去除 Windows 非法字符、控制字符、首尾点空格，限长）
function safeFileName(name, fallback) {
  const fb = fallback || 'markdown文档'
  let s = String(name || '').trim()
  if (!s) return fb
  s = s
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[-. ]+|[-. ]+$/g, '')
  if (!s) return fb
  if (s.length > 60) s = s.slice(0, 60).replace(/[-. ]+$/, '')
  return s || fb
}

// 元素级样式映射：导出 Word 与右侧预览共用（选择器 → CSS 声明，Word 识别的简写为主）
function elementCssRules() {
  return [
    ['p', 'margin: 0 0 8pt 0;'],
    ['h1', 'font-size: 22pt; font-weight: bold; margin: 18pt 0 10pt 0; line-height: 1.3;'],
    ['h2', 'font-size: 17pt; font-weight: bold; margin: 16pt 0 8pt 0; border-bottom: 1px solid #dddddd; padding-bottom: 4pt;'],
    ['h3', 'font-size: 14pt; font-weight: bold; margin: 14pt 0 8pt 0;'],
    ['h4', 'font-size: 12pt; font-weight: bold; margin: 12pt 0 6pt 0;'],
    ['h5', 'font-size: 10.5pt; font-weight: bold; margin: 10pt 0 6pt 0;'],
    ['h6', 'font-size: 10pt; font-weight: bold; margin: 10pt 0 6pt 0; color: #555555;'],
    ['pre', "font-family: Consolas, 'Courier New', monospace; font-size: 9.5pt; background: #f9f9f9; border: 1px solid #dddddd; padding: 8pt; margin: 8pt 0; white-space: pre-wrap; word-wrap: break-word;"],
    ['code', "font-family: Consolas, 'Courier New', monospace; font-size: 9.5pt; background: #f9f9f9; border: 1px solid #e0e0e0; padding: 1pt 3pt;"],
    ['pre code', 'background: #f9f9f9; border: none; padding: 0; font-size: 9.5pt;'],
    ['table', 'border-collapse: collapse; border: 1px solid #999999; width: 100%; margin: 8pt 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt;'],
    ['th', 'border: 1px solid #999999; padding: 4pt 6pt; background: #f2f2f2; font-weight: bold; text-align: left;'],
    ['td', 'border: 1px solid #999999; padding: 4pt 6pt;'],
    ['blockquote', 'margin: 8pt 0 8pt 20pt; padding-left: 10pt; border-left: 3pt solid #aaaaaa; font-style: italic; color: #555555;'],
    ['a', 'color: #0563c1; text-decoration: underline;'],
    ['ul', 'margin: 6pt 0 6pt 0; padding-left: 28pt;'],
    ['ol', 'margin: 6pt 0 6pt 0; padding-left: 28pt;'],
    ['li', 'margin: 2pt 0;'],
    ['hr', 'border: none; border-top: 1px solid #bbbbbb; margin: 12pt 0;'],
    ['img', 'max-width: 100%; border: none;'],
    ['del', 'text-decoration: line-through; color: #777777;']
  ]
}

// 组装 Word 兼容 .doc 的完整 HTML：mso 文档头 + 样式 + 正文包装
function buildWordHtml(bodyHtml, opts) {
  const o = opts || {}
  const titleRaw = String(o.title || '').trim()
  const title = escapeHtml(titleRaw)
  const docTitle = titleRaw || 'Markdown 文档'
  const fontStack = o.fontStack || "SimSun, '宋体', serif"
  const fontSizePt = Number(o.fontSize) || 12
  const rules = elementCssRules()
  const css = rules.map(function (r) { return r[0] + ' { ' + r[1] + ' }' }).join('\n')
  const bodyFont = 'body { font-family: ' + fontStack + '; font-size: ' + fontSizePt + 'pt; color: #000000; line-height: 1.6; mso-pagination: widow-orphan; }'
  const titleBlock = title
    ? '<h1 class="DocTitle" style="font-size: 24pt; font-weight: bold; text-align: center; margin: 0 0 16pt 0;">' + title + '</h1>'
    : ''

  return '<html xmlns:o="urn:schemas-microsoft-com:office:office"' +
    ' xmlns:w="urn:schemas-microsoft-com:office:word"' +
    ' xmlns="http://www.w3.org/TR/REC-html40">\n' +
    '<head>\n' +
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n' +
    '<meta name="ProgId" content="Word.Document" />\n' +
    '<title>' + escapeHtml(docTitle) + '</title>\n' +
    '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser /></w:WordDocument></xml><![endif]-->\n' +
    '<style>\n' +
    '@page WordSection1 { size: 595.3pt 841.9pt; margin: 72pt 90pt 72pt 90pt; }\n' +
    'div.WordSection1 { page: WordSection1; }\n' +
    bodyFont + '\n' +
    css + '\n' +
    '</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '<div class="WordSection1">\n' +
    titleBlock + '\n' +
    String(bodyHtml || '') + '\n' +
    '</div>\n' +
    '</body>\n' +
    '</html>'
}

// Markdown → HTML（GFM 表格 / 删除线开启）。marked 动态 import：
// 该函数只在用户手势或防抖回调内被调用，SSR 阶段不会执行
async function renderToHtml(md) {
  const { marked } = await import('marked')
  marked.setOptions({ gfm: true, breaks: true })
  return String(marked.parse(String(md || '')))
}

// ---------- 纯函数结束 ----------

// 生成右侧预览（防抖回调内）
async function updatePreview() {
  const md = markdownText.value
  if (!md.trim()) {
    previewHtml.value = ''
    previewError.value = ''
    return
  }
  try {
    previewHtml.value = await renderToHtml(md)
    previewError.value = ''
  } catch (err) {
    previewHtml.value = ''
    previewError.value = 'Markdown 解析失败，请检查内容后重试'
  }
}

// ---------- 文件读取（.md / .markdown / .txt，file.text() 本地读取） ----------
function isSupportedFile(name) {
  return /\.(md|markdown|txt)$/i.test(String(name || ''))
}

async function readFileIntoEditor(file) {
  if (!isSupportedFile(file.name)) {
    fileError.value = '仅支持 .md / .markdown / .txt 纯文本文件'
    return
  }
  try {
    const text = await file.text()
    markdownText.value = text
    fileInfo.value = file.name
    fileError.value = ''
    if (!docTitle.value.trim()) {
      docTitle.value = file.name.replace(/\.(md|markdown|txt)$/i, '')
    }
  } catch (err) {
    fileError.value = '读取文件失败，请重试'
  }
}

const handleFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (file) await readFileIntoEditor(file)
  e.target.value = ''
}

const handleDrop = async (e) => {
  isDragging.value = false
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) await readFileIntoEditor(file)
}

const triggerPick = () => {
  if (fileInputRef.value) fileInputRef.value.click()
}

// ---------- 剪贴板 / 示例 / 清空 ----------
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) markdownText.value = text
  } catch (err) {
    fileError.value = '读取剪贴板失败，请手动 Ctrl+V 粘贴'
  }
}

const loadSample = () => {
  markdownText.value = SAMPLE_MARKDOWN
  fileInfo.value = ''
  fileError.value = ''
}

const clearInput = () => {
  markdownText.value = ''
  previewHtml.value = ''
  previewError.value = ''
  fileInfo.value = ''
  fileError.value = ''
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 下载 .doc（用户手势回调内创建 Blob / ObjectURL） ----------
const downloadDoc = () => {
  if (!previewHtml.value || isExporting.value) return
  isExporting.value = true
  try {
    const wordHtml = buildWordHtml(previewHtml.value, {
      title: docTitle.value,
      fontStack: activeFont.value.stack,
      fontSize: fontSize.value
    })
    // BOM 前缀帮助 Word 以 UTF-8 解码，避免中文乱码
    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = safeFileName(docTitle.value || firstHeadingText(markdownText.value), 'markdown文档') + '.doc'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    exportOk.value = true
    exportStatus.value = '已导出 ' + a.download + '，Word / WPS 可直接打开；如需 .docx 请在 Word 中另存为'
  } catch (err) {
    exportOk.value = false
    exportStatus.value = '导出失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
/* Word 白纸预览：样式与 elementCssRules() 的导出映射保持一致 */
.word-paper {
  color: #000000;
  line-height: 1.7;
  word-wrap: break-word;
}
.word-paper :deep(p) {
  margin: 0 0 8pt 0;
}
.word-paper :deep(h1) {
  font-size: 22pt;
  font-weight: 700;
  margin: 18pt 0 10pt 0;
  line-height: 1.3;
}
.word-paper :deep(h2) {
  font-size: 17pt;
  font-weight: 700;
  margin: 16pt 0 8pt 0;
  border-bottom: 1px solid #dddddd;
  padding-bottom: 4pt;
}
.word-paper :deep(h3) {
  font-size: 14pt;
  font-weight: 700;
  margin: 14pt 0 8pt 0;
}
.word-paper :deep(h4) {
  font-size: 12pt;
  font-weight: 700;
  margin: 12pt 0 6pt 0;
}
.word-paper :deep(h5) {
  font-size: 10.5pt;
  font-weight: 700;
  margin: 10pt 0 6pt 0;
}
.word-paper :deep(h6) {
  font-size: 10pt;
  font-weight: 700;
  margin: 10pt 0 6pt 0;
  color: #555555;
}
.word-paper :deep(pre) {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 9.5pt;
  background: #f9f9f9;
  border: 1px solid #dddddd;
  padding: 8pt;
  margin: 8pt 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.word-paper :deep(code) {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 9.5pt;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  padding: 1pt 3pt;
}
.word-paper :deep(pre code) {
  background: #f9f9f9;
  border: none;
  padding: 0;
}
.word-paper :deep(table) {
  border-collapse: collapse;
  border: 1px solid #999999;
  width: 100%;
  margin: 8pt 0;
}
.word-paper :deep(th) {
  border: 1px solid #999999;
  padding: 4pt 6pt;
  background: #f2f2f2;
  font-weight: 700;
  text-align: left;
}
.word-paper :deep(td) {
  border: 1px solid #999999;
  padding: 4pt 6pt;
}
.word-paper :deep(blockquote) {
  margin: 8pt 0 8pt 20pt;
  padding-left: 10pt;
  border-left: 3pt solid #aaaaaa;
  font-style: italic;
  color: #555555;
}
.word-paper :deep(a) {
  color: #0563c1;
  text-decoration: underline;
}
.word-paper :deep(ul),
.word-paper :deep(ol) {
  margin: 6pt 0 6pt 0;
  padding-left: 28pt;
}
.word-paper :deep(li) {
  margin: 2pt 0;
}
.word-paper :deep(hr) {
  border: none;
  border-top: 1px solid #bbbbbb;
  margin: 12pt 0;
}
.word-paper :deep(img) {
  max-width: 100%;
  border: none;
}
.word-paper :deep(del) {
  text-decoration: line-through;
  color: #777777;
}
</style>
