<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Presentation class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PPT转文本</h1>
          <p class="text-sm text-muted-foreground mt-1">上传 .pptx 按页提取幻灯片文字大纲与演讲者备注，支持导出纯文本 / Markdown，纯本地解析</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 PPT 转文本工具：上传 .pptx 后在浏览器本地解压（OOXML 即 ZIP 容器），按页解析 ppt/slides/slideN.xml，
        以形状（p:sp）为分界提取 a:t 文字，标题占位符自动识别，可选提取演讲者备注（notesSlides）。
        页序按幻灯片真实编号排序而非文件名字典序，输出纯文本（── 第 N 页 ── 分隔）或 Markdown（## 第 N 页），
        可一键复制或下载 .txt / .md，文件全程不上传服务器。
      </p>
      <div class="mt-3 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-primary leading-relaxed">演示文稿在你的浏览器内解压解析，不上传任何服务器；课件、内训资料、商业方案可放心处理。</p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：文件选择 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <FileUp class="w-5 h-5 mr-2 text-primary" /> 选择 PPT 文件
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
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            class="hidden"
            @change="handleFileChange"
          />
          <Presentation v-if="!fileName" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
          <p class="text-sm text-muted-foreground">点击选择或拖入一个 .pptx 文件</p>
          <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Info class="w-3 h-3" /> 纯本地解压解析，文件不上传
          </p>
        </div>

        <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <Presentation class="w-4 h-4 text-primary flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
            <p class="text-[10px] text-muted-foreground">{{ formatSize(fileSize) }}</p>
          </div>
        </div>

        <div v-if="fileSize > 50 * 1024 * 1024" class="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <TriangleAlert class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">文件较大，解析可能需要几秒，请耐心等待。</p>
        </div>

        <!-- 提取选项 -->
        <label class="mt-4 flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
          <input type="checkbox" v-model="includeNotes" class="accent-primary" />
          提取演讲者备注（输出在对应页下方「【备注】」段）
        </label>

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
            <li>• 幻灯片按真实页码排序（slide10 排在 slide2 之后，非文件名字典序）</li>
            <li>• 以形状（p:sp）为分界，形状内文字按文档顺序拼接，形状间换行</li>
            <li>• 标题占位符（p:ph type="title" / ctrTitle）识别为标题行，Markdown 模式加 ###</li>
            <li>• XML 实体（&amp; &lt; &gt; 等）自动解码；表格（graphicFrame）内文字一并提取</li>
            <li>• 图片文字需 OCR，SmartArt / 图表内文字可能缺失，此为诚实能力边界</li>
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
          <Presentation class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择 .pptx 文件后自动开始提取</p>
          <p class="text-xs mt-1">按页提取文字与备注；旧版 .ppt 请先另存为 .pptx</p>
        </div>

        <!-- 解析中 -->
        <div v-if="parsing" class="py-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 class="w-4 h-4 animate-spin" /> 正在本地解压并解析幻灯片…
        </div>

        <!-- 结果 -->
        <div v-if="parsed && !parsing" class="space-y-3">
          <!-- 统计 -->
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">总页数</p>
              <p class="text-lg font-bold text-foreground">{{ parsed.pages.length }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">字符数</p>
              <p class="text-lg font-bold text-foreground">{{ outputText.length.toLocaleString() }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">备注页数</p>
              <p class="text-lg font-bold text-foreground">{{ notesCount }}</p>
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
            <p v-else class="text-sm text-muted-foreground text-center py-8">（未提取到文本内容，幻灯片可能是空的或只包含图片）</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 PPT 转文本</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            .pptx 是 Office Open XML 格式：本质是一个 ZIP 压缩包，每张幻灯片对应包内的一个 XML 部件
            （ppt/slides/slide1.xml、slide2.xml……），文字内容存放在形状（p:sp）的文本框（p:txBody）中的 a:t 节点里。
            本工具在浏览器本地用 JSZip 解压，按页提取文字：以形状为分界把每个形状的内容合为一段，形状之间换行；
            标题占位符（p:ph type="title" / ctrTitle）会被识别出来，Markdown 模式下输出为 ### 标题行；
            还可以同时提取演讲者备注（ppt/notesSlides/notesSlideN.xml），输出在对应页下方。
          </p>

          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>拿到课件 / 内训 PPT，快速提取文字大纲进笔记软件复习或二次整理</li>
            <li>把演讲稿、汇报 PPT 的内容转成文字稿，交给 AI 做总结、翻译或改写</li>
            <li>批量审阅多份 PPT 的文字内容（合规检查、关键词检索），不用一页页翻</li>
            <li>没有装 Office 的电脑上临时查看 .pptx 里的文字</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">页序是怎么保证的？</h3>
          <p>
            ZIP 包内文件的列出顺序并不保证是幻灯片顺序，而文件名字典序会把 slide10 排到 slide2 前面。
            本工具先按扩展名筛出 ppt/slides/ 下的幻灯片部件，再从文件名中提取页码数字做数值排序，
            保证 slide1 → slide2 → … → slide10 的真实页序，输出的「第 N 页」与 PowerPoint 中的页码一致。
          </p>

          <h3 class="text-lg font-semibold text-foreground">哪些内容提取不到？</h3>
          <p>
            图片里的文字需要 OCR；SmartArt、图表的数据标签、母版与版式中的装饰性文字不在幻灯片正文文本流里，可能缺失；
            艺术字与文本框内文字一般可以提取（它们也是形状），但排版效果（字号、颜色、动画）不会还原——
            本工具输出的是纯文字与结构，这是诚实的能力边界。
          </p>

          <h3 class="text-lg font-semibold text-foreground">老版 .ppt 和加密文件为什么打不开？</h3>
          <p>
            .ppt 是 97-2003 的 OLE2 复合二进制格式（文件头 D0 CF 11 E0），不是 ZIP 容器，结构完全不同；
            设置了打开密码的 .pptx 同样会被加密成 OLE 容器。本工具检测到 OLE 文件头时会明确提示：
            请先在 PowerPoint / WPS 中另存为 .pptx 或解除密码后再提取。
          </p>

          <h3 class="text-lg font-semibold text-foreground">本地处理和在线工具有什么区别？</h3>
          <p>
            常见在线转换服务需要把整份演示文稿上传到对方服务器，课件、内训资料、商业方案存在被存储或泄露的风险。
            本工具解压与解析全部发生在你的浏览器里，文件不出本地设备，断网也能用；代价是解析速度取决于你自己的电脑性能。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">pptx 和 ppt 有什么区别？为什么 .ppt 不支持？</h3>
              <p class="text-sm text-muted-foreground mt-1">pptx 是 ZIP 容器包裹的 XML（OOXML），可以直接解压读取；ppt 是 OLE2 复合二进制格式，结构完全不同。请先用 PowerPoint / WPS 把 .ppt 另存为 .pptx 再提取。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">演讲者备注会提取吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">会。勾选「提取演讲者备注」后，每页的备注（notesSlides）会以「【备注】」段输出在对应页下方；不需要时取消勾选即可，纯大纲输出更干净。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">提取的页码顺序对吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">对。页序按幻灯片文件名中的页码数字排序，slide10 正确排在 slide2 之后，与 PowerPoint 中的实际页序一致。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">文件会被上传到服务器吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。解压（JSZip）与解析全部在浏览器本地完成，演示文稿内容不出你的设备，断网状态下也可以正常使用。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">为什么有些文字提取不出来？</h3>
              <p class="text-sm text-muted-foreground mt-1">图片中的文字需要 OCR；SmartArt、图表标签等存放在独立部件或以图形呈现，可能不在正文文本流内；加密文档需先解除密码再提取。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pptx-to-text'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Presentation, FileUp, FileCheck, Download, Copy, RefreshCw, Trash2, CheckCircle,
  TriangleAlert, ChevronUp, ChevronDown, Info, Loader2, Settings2
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PPT转文本 - 在线pptx提取文字转TXT/Markdown工具',
  description: '在线 PPT 转文本工具，上传 .pptx 本地按页提取幻灯片文字大纲，标题占位符识别、页码数值排序、可选提取演讲者备注，支持纯文本/Markdown 双模式导出 TXT/MD，纯浏览器解析不上传服务器',
  keywords: 'ppt转文本,pptx转文字,pptx提取文字,ppt转markdown,pptx转txt,幻灯片文字提取,演讲备注提取,ppt大纲提取',
  author: '有条工具',
  ogTitle: 'PPT转文本 - 有条工具',
  ogDescription: '上传 .pptx 按页提取幻灯片文字大纲与演讲者备注，导出 TXT / Markdown，文件不上传',
  ogUrl: 'https://www.util.cn/tools/pptx-to-text',
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
          name: 'PPT转文本',
          url: 'https://www.util.cn/tools/pptx-to-text',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['本地解压 pptx 按页提取文字', '页码数值排序保证真实页序', '标题占位符识别为标题行', '演讲者备注可选提取', '纯文本 / Markdown 双模式', '复制全文 / 导出 TXT / 导出 MD', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PPT转文本', item: 'https://www.util.cn/tools/pptx-to-text/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'pptx 和 ppt 有什么区别？为什么 .ppt 不支持？',
              acceptedAnswer: { '@type': 'Answer', text: 'pptx 是 ZIP 容器包裹的 XML（OOXML），可以直接解压读取；ppt 是 OLE2 复合二进制格式，结构完全不同。请先用 PowerPoint / WPS 把 .ppt 另存为 .pptx 再提取。' }
            },
            {
              '@type': 'Question',
              name: '演讲者备注会提取吗？',
              acceptedAnswer: { '@type': 'Answer', text: '会。勾选「提取演讲者备注」后，每页的备注会以「【备注】」段输出在对应页下方；不需要时取消勾选即可。' }
            },
            {
              '@type': 'Question',
              name: '提取的页码顺序对吗？',
              acceptedAnswer: { '@type': 'Answer', text: '对。页序按幻灯片文件名中的页码数字排序，slide10 正确排在 slide2 之后，与 PowerPoint 中的实际页序一致。' }
            },
            {
              '@type': 'Question',
              name: '文件会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解压与解析全部在浏览器本地完成，演示文稿内容不出你的设备，断网状态下也可以正常使用。' }
            },
            {
              '@type': 'Question',
              name: '为什么有些文字提取不出来？',
              acceptedAnswer: { '@type': 'Answer', text: '图片中的文字需要 OCR；SmartArt、图表标签等存放在独立部件或以图形呈现，可能不在正文文本流内；加密文档需先解除密码再提取。' }
            }
          ]
        }
      ]
    })
  }]
})

// ================== 纯解析逻辑（SENTINEL: PPTX_PURE_BEGIN） ==================
// 说明：本区块不依赖 Vue 与任何浏览器 API，可被 node 脚本整段提取后独立单测。
// OOXML 命名空间前缀固定（幻灯片用 p: 与 a:，docx 标准即如此写死），按字面量标签匹配即可；
// p:sp 内不会嵌套 p:sp、p:graphicFrame 内不会嵌套 p:graphicFrame、a:p 内不会嵌套 a:p，
// 故非贪婪匹配这些块是安全的。

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

// 纯函数：幻灯片文件按页码数字排序（slide10 必须排在 slide2 之后，非字典序）
// 匹配「数字.xml」结尾的条目按数字升序；不含页码的条目按字典序垫底
function sortSlideNames(names) {
  const numOf = (n) => {
    const m = String(n).match(/(\d+)\.xml$/i)
    return m ? parseInt(m[1], 10) : NaN
  }
  return (Array.isArray(names) ? names.slice() : [])
    .sort((a, b) => {
      const na = numOf(a)
      const nb = numOf(b)
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
      if (Number.isFinite(na) && !Number.isFinite(nb)) return -1
      if (!Number.isFinite(na) && Number.isFinite(nb)) return 1
      return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0
    })
}

// 占位符类型：读 p:ph 的 type 属性（title / ctrTitle / subTitle / body / sldNum / ftr / hdr / dt）
function getPlaceholderType(spXml) {
  const m = String(spXml || '').match(/<p:ph\b[^>]*\stype=("([^"]*)"|'([^']*)')/)
  return m ? (m[2] !== undefined ? m[2] : m[3]) : ''
}

// 标题占位符判定：type="title" 或 type="ctrTitle"（居中标题，PowerPoint 首页常用）
function isTitlePlaceholder(spXml) {
  const t = getPlaceholderType(spXml)
  return t === 'title' || t === 'ctrTitle'
}

// 提取一个 XML 片段内按文档顺序的段落文本数组：a:p 分段、a:t 取文字、a:br 换行；
// 空段落（无可见文字）跳过
function extractParagraphs(xml) {
  const s = String(xml == null ? '' : xml)
  const paras = []
  const pRe = /<a:p(?:\s[^>]*)?\/>|<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g
  let pm
  while ((pm = pRe.exec(s)) !== null) {
    const pXml = pm[0]
    let text = ''
    const runRe = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>|<a:br\s*\/?>/g
    let rm
    while ((rm = runRe.exec(pXml)) !== null) {
      if (rm[1] !== undefined) text += decodeXmlEntities(rm[1])
      else text += '\n'
    }
    if (text.trim()) paras.push(text)
  }
  return paras
}

// 形状分界：按文档顺序切 <p:sp>…</p:sp>（普通形状/文本框）与 <p:graphicFrame>…</p:graphicFrame>
// （表格等），块内取段落文本；无文字的形状跳过
function extractSlideBlocks(slideXml) {
  const s = String(slideXml == null ? '' : slideXml).replace(/^\uFEFF/, '')
  const marks = []
  let m
  const spRe = /<p:sp(?:\s[^>]*)?>[\s\S]*?<\/p:sp>/g
  while ((m = spRe.exec(s)) !== null) marks.push({ start: m.index, xml: m[0], kind: 'sp' })
  const gfRe = /<p:graphicFrame(?:\s[^>]*)?>[\s\S]*?<\/p:graphicFrame>/g
  while ((m = gfRe.exec(s)) !== null) marks.push({ start: m.index, xml: m[0], kind: 'frame' })
  marks.sort((a, b) => a.start - b.start)
  const blocks = []
  for (const mk of marks) {
    const paragraphs = extractParagraphs(mk.xml)
    if (!paragraphs.length) continue
    blocks.push({
      kind: mk.kind,
      phType: getPlaceholderType(mk.xml),
      isTitle: isTitlePlaceholder(mk.xml),
      paragraphs
    })
  }
  return blocks
}

// 解析一页幻灯片 XML → { blocks }
function parseSlideXml(xml) {
  return { blocks: extractSlideBlocks(xml) }
}

// 解析演讲者备注：剔除幻灯片编号 / 页脚 / 页眉 / 日期占位符形状后取段落文本
function parseNotesXml(xml) {
  let s = String(xml == null ? '' : xml).replace(/^\uFEFF/, '')
  s = s.replace(/<p:sp(?:\s[^>]*)?>[\s\S]*?<\/p:sp>/g, (sp) => {
    const t = getPlaceholderType(sp)
    return (t === 'sldNum' || t === 'ftr' || t === 'hdr' || t === 'dt') ? '' : sp
  })
  return extractParagraphs(s).join('\n')
}

// 单页文本行：形状段落平铺 + 备注段；整页无文字时给出占位说明
function pageTextLines(page, includeNotes) {
  const lines = []
  for (const b of ((page && page.blocks) || [])) {
    for (const p of (b.paragraphs || [])) lines.push(p)
  }
  if (includeNotes && page && page.notes) {
    if (lines.length) lines.push('')
    lines.push('【备注】')
    for (const n of String(page.notes).split('\n')) lines.push(n)
  }
  if (!lines.length) lines.push('（本页无文字）')
  return lines
}

// 纯文本输出：── 第 N 页 ── 分隔，块间换行，备注在对应页下方
function buildPlainOutput(pages, includeNotes) {
  const list = Array.isArray(pages) ? pages : []
  const parts = []
  list.forEach((page, i) => {
    if (i > 0) parts.push('')
    parts.push('── 第 ' + ((page && page.num) || i + 1) + ' 页 ──')
    for (const line of pageTextLines(page, includeNotes)) parts.push(line)
  })
  return parts.join('\n')
}

// Markdown 输出：每页 ## 第 N 页；标题占位符行加 ###；备注段在对应页下方
function buildMarkdownOutput(pages, includeNotes) {
  const list = Array.isArray(pages) ? pages : []
  const parts = []
  list.forEach((page, i) => {
    const num = (page && page.num) || i + 1
    const blocks = (page && page.blocks) || []
    const hasText = blocks.some(b => (b.paragraphs || []).length)
    const hasNotes = includeNotes && page && page.notes
    const seg = ['## 第 ' + num + ' 页']
    if (!hasText && !hasNotes) {
      seg.push('（本页无文字）')
    } else {
      for (const b of blocks) {
        const prefix = b.isTitle ? '### ' : ''
        for (const p of (b.paragraphs || [])) seg.push(prefix + p)
      }
      if (hasNotes) {
        seg.push('')
        seg.push('【备注】')
        for (const n of String(page.notes).split('\n')) seg.push(n)
      }
    }
    parts.push(seg.join('\n\n'))
  })
  return parts.join('\n\n')
}

function buildPptxOutput(pages, mode, includeNotes) {
  return mode === 'markdown' ? buildMarkdownOutput(pages, includeNotes) : buildPlainOutput(pages, includeNotes)
}

// 导出文件名：<原名去 .pptx>-文本.<ext>
function buildExportName(rawName, ext) {
  const base = String(rawName || 'presentation').replace(/\.pptx$/i, '') || 'presentation'
  return `${base}-文本.${ext}`
}

// 字节头识别（容器分流用）
function looksLikeZipBytes(bytes) {
  return bytes && bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b
}

// OLE2 复合文档（老版 .ppt / 加密的 .pptx / .doc / .xls）文件头
function looksLikeLegacyOfficeDoc(bytes) {
  if (!bytes || bytes.length < 8) return false
  const sig = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false
  }
  return true
}
// ================== 纯解析逻辑（SENTINEL: PPTX_PURE_END） ====================

// ---------- 状态 ----------
const fileInput = ref(null)
const isDragging = ref(false)
const fileName = ref('')
const fileSize = ref(0)
const parsing = ref(false)
const error = ref('')
const outputMode = ref('plain') // plain | markdown
const includeNotes = ref(true)

// 解析结果（可空对象，模板中一律 v-if 守卫）
const parsed = ref(null)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 派生数据 ----------
const outputText = computed(() => {
  if (!parsed.value) return ''
  return buildPptxOutput(parsed.value.pages, outputMode.value, includeNotes.value)
})
const notesCount = computed(() => {
  if (!parsed.value) return 0
  return parsed.value.pages.filter(p => p.notes).length
})
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

// 解析单个 pptx（用户回调内执行；JSZip 动态 import 只出现在这里）
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
        error.value = '这是 OLE2 复合文档：可能是老版 .ppt 二进制格式，也可能是设置了打开密码的加密 .pptx。请先在 PowerPoint / WPS 中「另存为」.pptx 或解除密码后再提取。'
      } else {
        error.value = '不是有效的 .pptx 文件（.pptx 本质是 ZIP 压缩包，但该文件不是 ZIP 格式）。请确认文件未损坏。'
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
    // 幻灯片：按页码数字排序（非字典序），备注：页码 → xml 条目
    const slideNames = sortSlideNames(
      Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    )
    if (!slideNames.length) {
      error.value = '压缩包里没有 ppt/slides/ 幻灯片：这是 ZIP 文件但不是 PowerPoint 演示文稿（可能是 .docx / .xlsx 或普通压缩包）。'
      return
    }
    const notesNames = Object.keys(zip.files).filter(n => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n))
    const notesByNum = new Map()
    for (const n of notesNames) {
      const m = n.match(/notesSlide(\d+)\.xml$/i)
      if (m) notesByNum.set(parseInt(m[1], 10), zip.file(n))
    }
    const pages = []
    try {
      for (const name of slideNames) {
        const m = name.match(/slide(\d+)\.xml$/i)
        const num = m ? parseInt(m[1], 10) : pages.length + 1
        const xml = await zip.file(name).async('string') // JSZip 按 UTF-8 解码，与 XML 声明一致
        const blocks = parseSlideXml(xml).blocks
        let notes = ''
        const notesEntry = notesByNum.get(num)
        if (notesEntry) {
          try {
            notes = parseNotesXml(await notesEntry.async('string'))
          } catch (e) {
            notes = '' // 单页备注读取失败不影响该页正文
          }
        }
        pages.push({ num, blocks, notes })
      }
    } catch (e) {
      error.value = '幻灯片内容读取失败：该 pptx 可能设置了打开密码（加密的 OOXML 需先在 PowerPoint 中解除密码）。'
      return
    }
    parsed.value = { pages }
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
  addRecentTool('pptx-to-text')
})
</script>
