<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileText class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Word转文本</h1>
          <p class="text-sm text-muted-foreground mt-1">上传 .docx 提取正文文字，支持导出纯文本 / Markdown，标题与表格结构保留，纯本地解析</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 Word 文档转文本工具：上传 .docx 后在浏览器本地解压（OOXML 即 ZIP 容器），解析 word/document.xml 还原正文段落，
        标题样式自动映射为 Markdown 的 # 级别，表格转换为 Markdown 表格或制表符分隔行，w:br 换行与 w:tab 制表符按原样保留。
        可一键复制全文，或导出 .txt / .md 文件，文件全程不上传服务器。
      </p>
      <div class="mt-3 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-primary leading-relaxed">文档在你的浏览器内解压解析，不上传任何服务器；合同、论文、内部资料可放心处理。</p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：文件选择 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <FileUp class="w-5 h-5 mr-2 text-primary" /> 选择 Word 文档
        </h2>
        <div
          class="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
          :class="{ 'border-primary/60 bg-primary/5': isDragging }"
          @click="triggerFileSelect"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            class="hidden"
            @change="handleFileChange"
          />
          <FileText v-if="!fileName" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
          <p class="text-sm text-muted-foreground">点击选择或拖入一个 .docx 文件</p>
          <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Info class="w-3 h-3" /> 纯本地解压解析，文件不上传
          </p>
        </div>

        <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <FileText class="w-4 h-4 text-primary flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
            <p class="text-[10px] text-muted-foreground">{{ formatSize(fileSize) }}</p>
          </div>
        </div>

        <div v-if="fileSize > 50 * 1024 * 1024" class="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <TriangleAlert class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">文件较大，解析可能需要几秒，请耐心等待。</p>
        </div>

        <div class="mt-4 flex gap-2">
          <button
            @click="triggerFileSelect"
            class="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-3.5 h-3.5" /> {{ fileName ? '换一个文件' : '选择文件' }}
          </button>
          <button
            @click="resetAll"
            :disabled="!fileName"
            class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" /> 清空
          </button>
        </div>

        <!-- 解析规则说明 -->
        <div class="mt-4 bg-muted/40 border border-border rounded-lg p-3">
          <h3 class="text-xs font-semibold text-foreground mb-1.5 flex items-center">
            <Settings2 class="w-3.5 h-3.5 mr-1 text-primary" /> 解析规则
          </h3>
          <ul class="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
            <li>• 标题样式 Heading1-6 / Title → Markdown 一级至六级标题（#）</li>
            <li>• 表格 → Markdown 表格（纯文本模式下按制表符分隔）</li>
            <li>• 换行 w:br 与制表符 w:tab 按原样保留，XML 实体自动解码</li>
            <li>• 列表项目符号 / 编号不还原（numPr 忽略），列表项按普通段落输出</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 提取结果
          </h2>
          <div v-if="parsed && outputText" class="flex items-center gap-1.5 flex-wrap">
            <button
              @click="copyOutput"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Copy class="w-3.5 h-3.5" /> 复制全文
            </button>
            <button
              @click="downloadTxt"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors"
            >
              <Download class="w-3.5 h-3.5" /> TXT
            </button>
            <button
              @click="downloadMd"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors"
            >
              <Download class="w-3.5 h-3.5" /> Markdown
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!parsed && !parsing" class="py-16 text-center text-muted-foreground">
          <FileText class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择 .docx 文件后自动开始提取</p>
          <p class="text-xs mt-1">支持标题、段落与表格；旧版 .doc 请先另存为 .docx</p>
        </div>

        <!-- 解析中 -->
        <div v-if="parsing" class="py-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 class="w-4 h-4 animate-spin" /> 正在本地解压并解析文档…
        </div>

        <!-- 结果 -->
        <div v-if="parsed && !parsing" class="space-y-3">
          <!-- 统计 -->
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">字符数</p>
              <p class="text-lg font-bold text-foreground">{{ outputText.length.toLocaleString() }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">段落数</p>
              <p class="text-lg font-bold text-foreground">{{ parsed.paraCount }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">表格数</p>
              <p class="text-lg font-bold text-foreground">{{ parsed.tableCount }}</p>
            </div>
          </div>

          <!-- 输出模式 -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">输出模式</span>
            <div class="flex items-center gap-1">
              <button
                @click="outputMode = 'plain'"
                :class="outputMode === 'plain' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >纯文本</button>
              <button
                @click="outputMode = 'markdown'"
                :class="outputMode === 'markdown' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >Markdown</button>
            </div>
          </div>

          <!-- 预览 -->
          <div class="bg-muted/30 border border-border rounded-lg p-4">
            <pre
              v-if="outputText"
              class="text-xs text-foreground whitespace-pre-wrap break-words leading-relaxed max-h-[480px] overflow-y-auto font-sans"
            >{{ outputText }}</pre>
            <p v-else class="text-sm text-muted-foreground text-center py-8">（未提取到文本内容，文档可能是空的或只包含图片）</p>
          </div>
        </div>

        <!-- 错误 -->
        <div v-if="error" class="mt-4 flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5">
          <TriangleAlert class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p class="text-xs text-destructive leading-relaxed">{{ error }}</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 Word 转文本</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            .docx 是 Office Open XML 格式：本质是一个 ZIP 压缩包，正文全部存在包内的 word/document.xml 里。本工具在浏览器本地用 JSZip 解压，
            用字符串解析器按段落（w:p）、文本片段（w:t）、换行（w:br）、制表符（w:tab）重组正文，并把标题样式映射为 Markdown 标题、
            表格（w:tbl）转换为 Markdown 表格。整个过程不经过任何服务器，适合快速把 Word 内容搬进笔记、博客、数据库或纯文本流程。
          </p>

          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>把 Word 方案、标书、论文快速转成 Markdown，粘贴进语雀、Notion、Typora 等笔记工具</li>
            <li>批量提取合同 / 报告正文做关键词检索、归档或导入数据库</li>
            <li>没有装 Office 的电脑上临时查看 docx 文档的文字内容</li>
            <li>提取表格数据到 CSV / Markdown 表格，再做二次加工</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">标题与表格是如何保留的？</h3>
          <p>
            切换到 Markdown 模式后，「标题 1」到「标题 9」样式中的 Heading1-6 会映射为对应数量的 #（Title 样式映射为一级标题），
            文档中的表格会转换成标准的 Markdown 表格语法（竖线分隔 + 表头分隔行），单元格内多段文字以空格拼接、竖线字符自动转义。
            纯文本模式则输出原始文字：表格行以制表符分隔，适合直接粘贴进 Excel 或 CSV。
          </p>

          <h3 class="text-lg font-semibold text-foreground">列表编号和图片会还原吗？</h3>
          <p>
            列表的项目符号与自动编号由编号定义（numPr）在渲染时动态生成，提取纯文本时无法恢复成「1. 2. 3.」的字面编号，
            列表项会按普通段落输出——这是本工具诚实的能力边界。图片、文本框、艺术字中的文字不在正文文本流中
            （文本框内容存放在 drawing 内层，可能被截断），如需完整还原建议使用站内 Markdown 转 Word 的反向工具或专业转换器。
          </p>

          <h3 class="text-lg font-semibold text-foreground">老版 .doc 为什么不支持？</h3>
          <p>
            .doc 是 97-2003 的 OLE2 复合二进制格式（文件头 D0 CF 11 E0），不是 ZIP 容器，结构完全不同。
            本工具检测到 OLE 文件头时会明确提示「请先另存为 .docx」；在 Word / WPS 中用「文件 → 另存为」选择 .docx 即可，无损转换。
          </p>

          <h3 class="text-lg font-semibold text-foreground">本地处理和在线工具有什么区别？</h3>
          <p>
            常见在线转换服务需要把整份文档上传到对方服务器，合同、论文、内部资料存在被存储或泄露的风险。
            本工具解压与解析全部发生在你的浏览器里，文件不出本地设备，断网也能用；代价是解析速度取决于你自己的电脑性能。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">docx 和 doc 有什么区别？为什么 .doc 不支持？</h3>
              <p class="text-sm text-muted-foreground mt-1">docx 是 ZIP 容器包裹的 XML（OOXML），可以直接解压读取；doc 是 OLE2 复合二进制格式，结构完全不同。请先用 Word / WPS 把 .doc 另存为 .docx 再提取。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">提取后标题和表格还在吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">Markdown 模式下标题样式映射为 # 级别、表格转换为 Markdown 表格；纯文本模式下标题作为普通文字输出、表格按制表符分隔，结构信息以两种形式分别保留。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">列表的项目符号和编号会还原吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。编号由文档的编号定义动态生成，纯文本提取无法恢复字面编号，列表项按普通段落输出；如需保留编号请用 Word 的「转换为文本」功能预处理。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">文件会被上传到服务器吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。解压（JSZip）与解析全部在浏览器本地完成，文档内容不出你的设备，断网状态下也可以正常使用。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">为什么有些文字提取不出来？</h3>
              <p class="text-sm text-muted-foreground mt-1">图片里的文字需要 OCR；艺术字、SmartArt、图表中的文字存放在独立的 XML 部件中，可能不在正文文本流内；加密文档需先解除密码再提取。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'docx-to-text'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileText, FileUp, FileCheck, Download, Copy, RefreshCw, Trash2, CheckCircle,
  TriangleAlert, ChevronUp, ChevronDown, Info, Loader2, Settings2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Word转文本 - 在线docx提取文字转TXT/Markdown工具',
  description: '在线 Word 转文本工具，上传 .docx 本地提取正文文字，标题映射 Markdown #、表格转 Markdown 表格，支持纯文本/Markdown 双模式导出 TXT/MD，纯浏览器解析不上传服务器',
  keywords: 'word转文本,docx转文字,docx提取文字,word转markdown,docx转txt,文档文字提取,docx读取,本地docx解析',
  author: '有条工具',
  ogTitle: 'Word转文本 - 有条工具',
  ogDescription: '上传 .docx 本地提取正文，标题与表格结构保留，导出 TXT / Markdown，文件不上传',
  ogUrl: 'https://www.util.cn/tools/docx-to-text',
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
          name: 'Word转文本',
          url: 'https://www.util.cn/tools/docx-to-text',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['本地解压 docx 提取正文', '标题样式映射 Markdown 标题', '表格转换 Markdown 表格', '纯文本 / Markdown 双模式', '复制全文 / 导出 TXT / 导出 MD', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'Word转文本', item: 'https://www.util.cn/tools/docx-to-text/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'docx 和 doc 有什么区别？为什么 .doc 不支持？',
              acceptedAnswer: { '@type': 'Answer', text: 'docx 是 ZIP 容器包裹的 XML（OOXML），可以直接解压读取；doc 是 OLE2 复合二进制格式，结构完全不同。请先用 Word / WPS 把 .doc 另存为 .docx 再提取。' }
            },
            {
              '@type': 'Question',
              name: '提取后标题和表格还在吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'Markdown 模式下标题样式映射为 # 级别、表格转换为 Markdown 表格；纯文本模式下标题作为普通文字输出、表格按制表符分隔。' }
            },
            {
              '@type': 'Question',
              name: '列表的项目符号和编号会还原吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。编号由文档的编号定义动态生成，纯文本提取无法恢复字面编号，列表项按普通段落输出；如需保留编号请用 Word 的「转换为文本」功能预处理。' }
            },
            {
              '@type': 'Question',
              name: '文件会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解压与解析全部在浏览器本地完成，文档内容不出你的设备，断网状态下也可以正常使用。' }
            },
            {
              '@type': 'Question',
              name: '为什么有些文字提取不出来？',
              acceptedAnswer: { '@type': 'Answer', text: '图片里的文字需要 OCR；艺术字、SmartArt、图表中的文字存放在独立的 XML 部件中，可能不在正文文本流内；加密文档需先解除密码再提取。' }
            }
          ]
        }
      ]
    })
  }]
})

// ================== 纯解析逻辑（SENTINEL: DOCX_PURE_BEGIN） ==================
// 说明：本区块不依赖 Vue 与任何浏览器 API，可被 node 脚本整段提取后独立单测。
// OOXML 命名空间前缀固定为 w:（docx 标准即如此写死），故按字面量 '<w:p' / '<w:tbl' 匹配即可，
// 不处理任意自定义前缀；w:p / w:tbl 的属性值均为十六进制 ID 或数字，不含 '>'，可安全地用
// 「第一个 > 判定标签结束」。

// XML 实体解码：&amp; &lt; &gt; &quot; &apos; 与数字（&#NN; / &#xHH;）实体，单遍替换避免二次解码
function decodeXmlEntities(s) {
  const str = String(s == null ? '' : s)
  if (str.indexOf('&') === -1) return str
  return str.replace(/&(#[0-9]+|#x[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g, (m, g) => {
    if (g.charAt(0) === '#') {
      const code = (g.charAt(1) === 'x' || g.charAt(1) === 'X')
        ? parseInt(g.slice(2), 16)
        : parseInt(g.slice(1), 10)
      return (Number.isFinite(code) && code >= 0 && code <= 0x10ffff) ? String.fromCodePoint(code) : m
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[g] || m
  })
}

// 在 s 中从 from 开始查找标签起始 '<name'，且其后一个字符不是单词字符
// （排除 <w:pPr / <w:tblPr / <w:pgSz 等以同名前缀开头的其他标签）
function findTagStart(s, from, name) {
  const needle = '<' + name
  let i = from
  while (i <= s.length - needle.length) {
    i = s.indexOf(needle, i)
    if (i === -1) return -1
    const next = s.charAt(i + needle.length)
    if (!/[A-Za-z0-9_.]/.test(next)) return i
    i += 1
  }
  return -1
}

// 段落结束位置：自闭合 <w:p .../> 返回标签结束；否则找第一个 </w:p>
// （依赖 w:p 属性值不含 '>' 这一事实，见区块头注释）
function findParagraphEnd(s, pStart) {
  const gt = s.indexOf('>', pStart)
  if (gt === -1) return s.length
  if (s.charAt(gt - 1) === '/') return gt + 1
  const close = s.indexOf('</w:p>', gt + 1)
  return close === -1 ? s.length : close + 6
}

// 表格结束位置：深度计数匹配嵌套 <w:tbl>（表格可嵌套于单元格内）
function findTableEnd(s, tblStart) {
  let depth = 1
  let i = tblStart + 6 // 跳过 '<w:tbl'
  while (i < s.length) {
    const open = findTagStart(s, i, 'w:tbl')
    const close = s.indexOf('</w:tbl>', i)
    if (close === -1) return s.length
    if (open !== -1 && open < close) {
      depth++
      i = open + 6
    } else {
      depth--
      i = close + 8 // '</w:tbl>'.length === 8
      if (depth === 0) return i
    }
  }
  return s.length
}

// 段落样式 → Markdown 标题级别：Heading1-6 → 1-6，Title → 1，其余（ListParagraph 等）→ 0
function headingLevelOf(style) {
  const m = String(style || '').match(/^heading([1-6])$/i)
  if (m) return parseInt(m[1], 10)
  if (/^title$/i.test(String(style || ''))) return 1
  return 0
}

// 提取单个段落的可见文本：按文档顺序拼接 w:t / w:br / w:cr / w:tab
// 先剥掉 <w:pPr>（含 pStyle、numPr、w:tabs 制表位定义），避免 <w:tabs> 里的
// <w:tab w:val="left" .../> 被误当成正文制表符。
// 注：w: 前缀为 docx 标准固定前缀（见区块头注释）。
function extractParagraphText(parXml) {
  const s = String(parXml == null ? '' : parXml).replace(/<w:pPr\b[\s\S]*?<\/w:pPr>/g, '')
  let text = ''
  const runRe = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:br\s*\/?>|<w:cr\s*\/?>|<w:tab\s*\/?>/g
  let m
  while ((m = runRe.exec(s)) !== null) {
    if (m[1] !== undefined) {
      text += decodeXmlEntities(m[1])
    } else if (m[0].charAt(3) === 'b' || m[0].charAt(3) === 'c') {
      text += '\n' // <w:br/> 换行、<w:cr/> 回车均按换行处理
    } else {
      text += '\t' // <w:tab/>
    }
  }
  return text
}

function getParagraphStyle(parXml) {
  const m = String(parXml || '').match(/<w:pStyle\s+w:val="([^"]*)"/)
  return m ? m[1] : ''
}

// 解析表格：w:tr → 行、w:tc → 单元格；单元格内多段文字以空格拼接并压缩空白
function parseTableRows(tblXml) {
  const rows = []
  const trRe = /<w:tr\b[\s\S]*?<\/w:tr>/g
  let m
  while ((m = trRe.exec(String(tblXml || ''))) !== null) {
    const rowXml = m[0]
    const cells = []
    const tcRe = /<w:tc\b[\s\S]*?<\/w:tc>/g
    let c
    while ((c = tcRe.exec(rowXml)) !== null) {
      const cellXml = c[0]
      const paras = []
      let j = 0
      for (;;) {
        const pStart = findTagStart(cellXml, j, 'w:p')
        if (pStart === -1) break
        const pEnd = findParagraphEnd(cellXml, pStart)
        paras.push(extractParagraphText(cellXml.slice(pStart, pEnd)))
        j = pEnd
      }
      cells.push(paras.join(' ').replace(/\s+/g, ' ').trim())
    }
    rows.push(cells)
  }
  return rows
}

// 顶层扫描 <w:body>：段落与表格按文档顺序输出为块数组；
// 表格整体作为一个块（其内部段落不会重复输出）
function parseBodyBlocks(xml) {
  const s = String(xml == null ? '' : xml).replace(/^\uFEFF/, '')
  let body = s
  const bOpen = findTagStart(s, 0, 'w:body')
  if (bOpen !== -1) {
    const openEnd = s.indexOf('>', bOpen)
    const close = s.indexOf('</w:body>', bOpen)
    if (openEnd !== -1) body = s.slice(openEnd + 1, close === -1 ? s.length : close)
  }
  const blocks = []
  let i = 0
  while (i < body.length) {
    const pIdx = findTagStart(body, i, 'w:p')
    const tIdx = findTagStart(body, i, 'w:tbl')
    if (pIdx === -1 && tIdx === -1) break
    if (tIdx !== -1 && (pIdx === -1 || tIdx < pIdx)) {
      const end = findTableEnd(body, tIdx)
      blocks.push({ type: 'tbl', rows: parseTableRows(body.slice(tIdx, end)) })
      i = end
    } else {
      const end = findParagraphEnd(body, pIdx)
      const parXml = body.slice(pIdx, end)
      const style = getParagraphStyle(parXml)
      blocks.push({ type: 'p', style, level: headingLevelOf(style), text: extractParagraphText(parXml) })
      i = end
    }
  }
  return blocks
}

// 入口：解析 document.xml 字符串 → { blocks, paraCount, tableCount }
function parseDocxDocumentXml(xml) {
  const blocks = parseBodyBlocks(xml)
  let paraCount = 0
  let tableCount = 0
  for (const b of blocks) {
    if (b.type === 'p') {
      if (String(b.text || '').trim()) paraCount++
    } else {
      tableCount++
    }
  }
  return { blocks, paraCount, tableCount }
}

// 表格块 → Markdown 表格（首行作表头 + 分隔行；竖线转义；列数按最宽行补齐）
function tableToMarkdown(rows) {
  const rs = Array.isArray(rows) ? rows : []
  if (!rs.length) return ''
  const maxCols = rs.reduce((mx, r) => Math.max(mx, Array.isArray(r) ? r.length : 0), 0)
  if (maxCols === 0) return ''
  const norm = (cell) => String(cell == null ? '' : cell)
    .replace(/\|/g, '\\|')
    .replace(/[\t\r\n]+/g, ' ')
    .trim()
  const lines = []
  rs.forEach((r, ri) => {
    const cells = []
    for (let ci = 0; ci < maxCols; ci++) cells.push(norm(Array.isArray(r) ? r[ci] : ''))
    lines.push('| ' + cells.join(' | ') + ' |')
    if (ri === 0) lines.push('| ' + new Array(maxCols).fill('---').join(' | ') + ' |')
  })
  return lines.join('\n')
}

// 纯文本输出：段落间空行；标题按普通文字；表格行以制表符分隔；空段落跳过
function buildPlainOutput(blocks) {
  const parts = []
  for (const b of Array.isArray(blocks) ? blocks : []) {
    if (b.type === 'p') {
      if (String(b.text || '').trim()) parts.push(String(b.text).replace(/[ \t]+$/gm, ''))
    } else {
      for (const row of (b.rows || [])) parts.push((row || []).join('\t'))
    }
  }
  return parts.join('\n\n')
}

// Markdown 输出：标题 → #、表格 → Markdown 表格；列表符号不还原（按普通段落输出）
function buildMarkdownOutput(blocks) {
  const parts = []
  for (const b of Array.isArray(blocks) ? blocks : []) {
    if (b.type === 'p') {
      if (!String(b.text || '').trim()) continue
      const level = b.level || 0
      if (level >= 1 && level <= 6) {
        parts.push('#'.repeat(level) + ' ' + String(b.text).replace(/\s*\n\s*/g, ' ').trim())
      } else {
        parts.push(String(b.text).replace(/[ \t]+$/gm, ''))
      }
    } else {
      const md = tableToMarkdown(b.rows || [])
      if (md) parts.push(md)
    }
  }
  return parts.join('\n\n')
}

function buildOutput(blocks, mode) {
  return mode === 'markdown' ? buildMarkdownOutput(blocks) : buildPlainOutput(blocks)
}

// 字节头识别（容器分流用）
function startsWithBytes(bytes, arr) {
  if (!bytes || bytes.length < arr.length) return false
  for (let i = 0; i < arr.length; i++) {
    if (bytes[i] !== arr[i]) return false
  }
  return true
}

// ZIP 本地文件头 'PK\x03\x04' 及其他 PK 变体
function looksLikeZipBytes(bytes) {
  return bytes && bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b
}

// OLE2 复合文档（老版 .doc / .xls / .ppt / .msi）文件头
function looksLikeLegacyOfficeDoc(bytes) {
  return startsWithBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
}

// 导出文件名：<原名去 .docx>-文本.<ext>
function buildExportName(rawName, ext) {
  const base = String(rawName || 'document').replace(/\.docx$/i, '') || 'document'
  return `${base}-文本.${ext}`
}
// ================== 纯解析逻辑（SENTINEL: DOCX_PURE_END） ====================

// ---------- 状态 ----------
const fileInput = ref(null)
const isDragging = ref(false)
const fileName = ref('')
const fileSize = ref(0)
const parsing = ref(false)
const error = ref('')
const outputMode = ref('plain') // plain | markdown

// 解析结果（可空对象，模板中一律 v-if 守卫）
const parsed = ref(null)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 派生数据 ----------
const outputText = computed(() => (parsed.value ? buildOutput(parsed.value.blocks, outputMode.value) : ''))
const txtName = computed(() => buildExportName(fileName.value, 'txt'))
const mdName = computed(() => buildExportName(fileName.value, 'md'))

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const resetAll = () => {
  fileName.value = ''
  fileSize.value = 0
  parsing.value = false
  error.value = ''
  parsed.value = null
  outputMode.value = 'plain'
}

// 解析单个 docx（用户回调内执行；JSZip 动态 import 只出现在这里）
const acceptFile = async (f) => {
  if (!f) return
  resetAll()
  fileName.value = f.name
  fileSize.value = f.size
  parsing.value = true
  try {
    const buf = await f.arrayBuffer()
    const bytes = new Uint8Array(buf)
    if (!looksLikeZipBytes(bytes)) {
      if (looksLikeLegacyOfficeDoc(bytes)) {
        error.value = '这是老版 .doc 二进制格式（OLE2 复合文档），不是 .docx。请先用 Word / WPS「另存为」.docx 后再提取。'
      } else {
        error.value = '不是有效的 .docx 文件（.docx 本质是 ZIP 压缩包，但该文件不是 ZIP 格式）。请确认文件未损坏。'
      }
      return
    }
    const JSZip = (await import('jszip')).default
    let zip
    try {
      zip = await JSZip.loadAsync(bytes)
    } catch (e) {
      error.value = 'ZIP 容器解压失败，文件可能已损坏或被加密。' + (e && e.message ? `（${e.message}）` : '')
      return
    }
    const entry = zip.file('word/document.xml')
    if (!entry) {
      error.value = '压缩包里没有 word/document.xml：这是 ZIP 文件但不是 Word 文档（可能是 .xlsx / .pptx 或普通压缩包）。'
      return
    }
    let xml = ''
    try {
      xml = await entry.async('string') // JSZip 按 UTF-8 解码，与 XML 声明中的 encoding="UTF-8" 一致
    } catch (e) {
      error.value = '文档内容读取失败：该 docx 可能设置了打开密码（加密的 OOXML 需先在 Word 中解除密码）。'
      return
    }
    parsed.value = parseDocxDocumentXml(xml)
  } catch (e) {
    error.value = '解析失败：' + (e && e.message ? e.message : '未知错误')
  } finally {
    parsing.value = false
  }
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) acceptFile(files[0])
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer && e.dataTransfer.files
  if (files && files.length > 0) acceptFile(files[0])
}

// ---------- 导出 ----------
const copyOutput = async () => {
  const text = outputText.value
  if (!text) return
  let ok = false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      ok = true
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      ok = document.execCommand('copy')
      document.body.removeChild(ta)
    }
  } catch (e) {
    ok = false
  }
  alert(ok ? `已复制全文（共 ${text.length.toLocaleString()} 字符）到剪贴板` : '复制失败，请在预览区手动选中文本复制')
}

const triggerDownload = (blob, name) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadTxt = () => {
  if (!outputText.value) return
  triggerDownload(new Blob([outputText.value], { type: 'text/plain;charset=utf-8' }), txtName.value)
}

const downloadMd = () => {
  if (!outputText.value) return
  triggerDownload(new Blob([outputText.value], { type: 'text/markdown;charset=utf-8' }), mdName.value)
}

onMounted(() => {
  addRecentTool('docx-to-text')
})
</script>
