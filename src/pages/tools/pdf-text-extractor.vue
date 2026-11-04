<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileSearch class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PDF文本提取</h1>
          <p class="text-sm text-muted-foreground mt-1">提取 PDF 中的全部文字，支持页码范围、段落合并与扫描件检测，一键复制或导出 TXT/Markdown</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 PDF 文本提取工具：上传 PDF 后在浏览器本地读取文本层，按坐标重组行序与空格，还原可读正文；支持全部页面、起止区间与自定义页码表达式三种范围，
        可选择逐行保留或智能合并被硬换行切断的段落，并自动检测无文本层的扫描件。结果一键复制，或按每页分隔导出 TXT / Markdown 文件。
      </p>
      <div class="mt-3 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-primary leading-relaxed">文件全程在你的浏览器本地解析，不上传任何服务器；合同、论文、标书等敏感文档可放心处理。</p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> 选择 PDF 文件
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="application/pdf,.pdf"
              class="hidden"
              @change="handleFileChange"
            />
            <FileText class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击或拖入一个 PDF 文件</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Info class="w-3 h-3" /> 纯本地解析，文件不上传
            </p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <FileText class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">{{ formatSize(fileSize) }}<span v-if="pageCount"> · 共 {{ pageCount }} 页</span></p>
            </div>
          </div>
          <div v-if="fileSize > 50 * 1024 * 1024" class="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">大文件解析可能较慢，请耐心等待；也可以先用页码范围提取部分页面验证效果。</p>
          </div>
          <button
            v-if="fileName"
            @click="triggerFileSelect"
            class="mt-3 w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-3.5 h-3.5" /> 换一个文件
          </button>
        </div>

        <!-- 提取设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 提取设置
          </h2>

          <!-- 页码范围 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">页码范围</label>
            <div class="grid grid-cols-3 gap-1.5 mb-2">
              <button
                @click="rangeMode = 'all'"
                :class="rangeMode === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >全部页面</button>
              <button
                @click="rangeMode = 'span'"
                :class="rangeMode === 'span' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >页码区间</button>
              <button
                @click="rangeMode = 'custom'"
                :class="rangeMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >自定义表达式</button>
            </div>

            <div v-if="rangeMode === 'span' && pageCount" class="grid grid-cols-2 gap-2">
              <input
                v-model.number="rangeFrom"
                type="number"
                min="1"
                :max="pageCount"
                class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="从第几页"
              />
              <input
                v-model.number="rangeTo"
                type="number"
                min="1"
                :max="pageCount"
                class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="到第几页"
              />
              <p class="col-span-2 text-xs text-muted-foreground">将在第 {{ clampedSpan.start }} 页至第 {{ clampedSpan.end }} 页之间提取（共 {{ clampedSpan.count }} 页）</p>
            </div>

            <div v-if="rangeMode === 'custom'" class="space-y-1.5">
              <input
                v-model="customExpr"
                type="text"
                class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如：1,3,5-8 或 2-10"
              />
              <p
                v-if="customRangeHint"
                class="text-xs flex items-start gap-1 leading-relaxed"
                :class="customRangeHint.ok ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'"
              >
                <TriangleAlert v-if="!customRangeHint.ok" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <Info v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{{ customRangeHint.msg }}</span>
              </p>
            </div>
          </div>

          <!-- 段落合并 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">段落合并</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="mergeMode = 'line'"
                :class="mergeMode === 'line' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >逐行保留</button>
              <button
                @click="mergeMode = 'paragraph'"
                :class="mergeMode === 'paragraph' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >合并为段落</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">合并规则：上一行末尾无句末标点、且下一行不以列表符或编号开头时，两行拼接为一段；提取后切换即时生效，无需重新解析。</p>
          </div>

          <div class="flex gap-2">
            <button
              @click="extract"
              :disabled="!pdfjsReady || processing"
              class="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Play class="w-4 h-4" />
              {{ processing ? '提取中…' : '开始提取' }}
            </button>
            <button
              @click="resetAll"
              :disabled="processing"
              class="px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-sm font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 重置
            </button>
          </div>
          <p v-if="!pdfjsReady" class="text-xs text-muted-foreground text-center">请先选择一个 PDF 文件</p>
        </div>
      </div>

      <!-- 右侧结果区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 提取结果
          </h2>
          <div v-if="processedPages.length && !processing" class="flex items-center gap-1.5 flex-wrap">
            <button
              @click="copyFullText"
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
        <div v-if="!processedPages.length && !processing" class="py-16 text-center text-muted-foreground">
          <FileText class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择 PDF 并设置页码范围后，点击「开始提取」</p>
          <p class="text-xs mt-1">将读取 PDF 内的文本层，逐页展示可复制的文字内容</p>
        </div>

        <!-- 进度 -->
        <div v-if="processing" class="py-10">
          <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
            <RefreshCw class="w-4 h-4 animate-spin" />
            正在提取第 {{ progress.done }} / {{ progress.total }} 页…
          </div>
          <div class="max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary transition-all"
              :style="{ width: progress.total ? (progress.done / progress.total * 100) + '%' : '0%' }"
            ></div>
          </div>
        </div>

        <!-- 结果 -->
        <div v-if="!processing && processedPages.length" class="space-y-4">
          <!-- 统计条 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">总页数</p>
              <p class="text-lg font-bold text-foreground">{{ pageCount }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">提取页数</p>
              <p class="text-lg font-bold text-foreground">{{ processedPages.length }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">字符数</p>
              <p class="text-lg font-bold text-foreground">{{ totalChars.toLocaleString() }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">含文本层页数</p>
              <p class="text-lg font-bold" :class="pagesWithTextCount ? 'text-foreground' : 'text-amber-600 dark:text-amber-400'">{{ pagesWithTextCount }}</p>
            </div>
          </div>

          <!-- 扫描件检测 -->
          <div v-if="isLikelyScanned" class="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5">
            <TriangleAlert class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">该 PDF 疑似扫描件（无文本层），请用站内图片 OCR 工具处理（image-ocr）：每页平均提取到的字符少于 10 个，页面内容大概率是图片而非文字。</p>
          </div>

          <!-- 视图切换 -->
          <div class="flex items-center gap-1.5">
            <button
              @click="viewMode = 'pages'"
              :class="viewMode === 'pages' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >逐页视图</button>
            <button
              @click="viewMode = 'full'"
              :class="viewMode === 'full' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >全文视图</button>
          </div>

          <!-- 逐页视图：每页一卡 -->
          <div v-if="viewMode === 'pages'" class="space-y-2">
            <div
              v-for="p in processedPages"
              :key="p.pageNo"
              class="border border-border rounded-lg overflow-hidden bg-muted/20"
            >
              <button
                type="button"
                class="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                @click="togglePage(p.pageNo)"
              >
                <span class="text-sm font-medium text-foreground flex-shrink-0">第 {{ p.pageNo }} 页</span>
                <span class="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {{ p.chars.toLocaleString() }} 字符 · {{ expandedPages[p.pageNo] ? '收起' : '展开全文' }}
                  <ChevronUp v-if="expandedPages[p.pageNo]" class="w-3.5 h-3.5" />
                  <ChevronDown v-else class="w-3.5 h-3.5" />
                </span>
              </button>
              <div class="px-4 pb-3">
                <div
                  v-if="!expandedPages[p.pageNo]"
                  class="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed"
                >{{ p.preview || '（本页未提取到文本，可能是图片页或空页）' }}</div>
                <div
                  v-else
                  class="text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto pt-2 border-t border-border"
                >{{ p.text || '（本页未提取到文本，可能是图片页或空页）' }}</div>
              </div>
            </div>
          </div>

          <!-- 全文视图 -->
          <div v-else class="bg-muted/30 border border-border rounded-lg p-4">
            <div class="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed max-h-[560px] overflow-y-auto">{{ fullText || '（未提取到任何文本）' }}</div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 PDF 文本提取</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            PDF 里能被「选中复制」的文字来自文件内置的文本层：一组记录了每个字符编码与坐标的隐藏对象。本工具基于 pdf.js 在浏览器本地读取文本层，
            按字符坐标重组行序、还原空格，把整份文档的文字一次性提取出来，支持复制与 TXT / Markdown 导出，文件全程不上传服务器。
          </p>

          <h3 class="text-lg font-semibold text-foreground">怎么复制 PDF 里的文字？</h3>
          <p>
            在阅读器里直接选中复制适合几句话的场景，但整份文档逐段选中效率很低，部分 PDF 还禁用了右键与复制菜单，或复制出来行序错乱、每行断成一小截。
            本工具一次性提取全部页面文字，按坐标重新拼行，可在页码范围内批量获取正文，一键复制全文或导出 TXT / Markdown；
            对于设置了打开密码的 PDF，仍需先解密才能读取。
          </p>

          <h3 class="text-lg font-semibold text-foreground">扫描版 PDF 为什么复制不了？</h3>
          <p>
            扫描件是把纸质页面拍照（或整页截图）后封装成 PDF，页面上只有一张图片的像素，没有任何文本对象，所以无论用什么阅读器都选不中、复制不出文字。
            文字能复制的前提是文件里有文本层。本工具会自动检测：当平均每页提取到的字符少于 10 个时提示「疑似扫描件」，
            此时应先用 OCR（光学字符识别）把页面图片转成文字，可以使用站内的图片 OCR 工具（image-ocr）处理。
          </p>

          <h3 class="text-lg font-semibold text-foreground">提取的文字会乱码吗？</h3>
          <p>
            绝大多数 PDF 不会：文本层记录的是标准字符编码，提取即得原文。但个别 PDF 在制作时内嵌字体缺少 ToUnicode 映射表——字体文件只存了字形外观、没存每个字形对应的字符，
            此时提取结果可能出现乱码、问号或缺字。这是源文件自身的问题，任何工具都难以完美还原；
            遇到这种情况可尝试用 Word / WPS 等软件重新导出一份 PDF 再提取，或对照原文手动校对。
          </p>

          <h3 class="text-lg font-semibold text-foreground">本地处理和在线工具的区别</h3>
          <p>
            常见的在线提取服务需要把 PDF 完整上传到对方服务器，解析完再把结果传回，合同、标书、论文等敏感文档存在被存储或泄露的风险。
            本工具基于 pdf.js 在你的浏览器内完成解析，文件不出本地设备，断网也能用；代价是解析速度取决于你自己的电脑性能，超大文件会比服务器慢一些。
          </p>

          <h3 class="text-lg font-semibold text-foreground">支持多少页的 PDF？</h3>
          <p>
            没有硬性页数限制，页数只影响耗时与内存占用：几百页的文字型 PDF 通常几秒到十几秒即可完成。
            超过 50MB 的大文件解析较慢，建议用页码区间或自定义表达式分批提取，先取几页验证内容质量，再处理全文。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">怎么复制 PDF 里的文字？</h3>
              <p class="text-sm text-muted-foreground mt-1">上传 PDF 点击「开始提取」，即可一键复制全文或导出 TXT/Markdown。相比在阅读器中逐段选中复制，本工具按坐标重组行序，一次提取整份文档，不受右键限制与选区乱序影响。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">扫描版 PDF 为什么复制不了？</h3>
              <p class="text-sm text-muted-foreground mt-1">扫描件页面上只有图片像素、没有记录字符编码与坐标的文本层，任何阅读器都无法直接选中复制。本工具会自动检测并提示，需先用 OCR 工具（image-ocr）把页面图片转成文字。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">提取的文字会乱码吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">绝大多数 PDF 不会。个别 PDF 内嵌字体缺少 ToUnicode 字符映射，提取结果可能乱码或缺字，这是源文件自身的问题；可用 Word/WPS 等重新导出 PDF 后再试。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">本地处理和在线工具有什么区别？</h3>
              <p class="text-sm text-muted-foreground mt-1">常见在线工具需要把 PDF 上传到服务器解析，存在泄露与留存风险；本工具全程在浏览器本地完成，文件不出设备，适合合同、标书、论文等敏感文档。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">支持多少页的 PDF？</h3>
              <p class="text-sm text-muted-foreground mt-1">没有硬性页数限制。几百页文字型 PDF 通常几秒到十几秒完成；超过 50MB 的大文件解析较慢，建议用页码范围分批提取。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pdf-text-extractor'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileSearch, FileText, Download, Copy, RefreshCw, CheckCircle,
  TriangleAlert, ChevronUp, ChevronDown, Info, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PDF文本提取 - 在线提取 PDF 文字本地工具',
  description: '在线 PDF 文本提取工具，浏览器本地解析 PDF 文字，支持页码范围（区间/自定义表达式）、段落合并、扫描件检测，一键复制全文或导出 TXT/Markdown，文件不上传服务器，合同论文标书放心用',
  keywords: 'pdf文本提取,pdf文字提取,pdf复制文字,pdf转txt,pdf提取内容,扫描件检测,pdf段落合并,本地pdf解析',
  author: '有条工具',
  ogTitle: 'PDF文本提取 - 有条工具',
  ogDescription: '本地提取 PDF 文字，页码范围与段落合并可调，扫描件自动检测，文件不出浏览器',
  ogUrl: 'https://www.util.cn/tools/pdf-text-extractor',
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
          name: 'PDF文本提取',
          url: 'https://www.util.cn/tools/pdf-text-extractor',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['提取 PDF 文本层文字', '页码范围（全部/区间/自定义表达式）', '逐行保留或合并段落', '扫描件（无文本层）自动检测', '复制全文 / 导出 TXT / 导出 Markdown', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PDF文本提取', item: 'https://www.util.cn/tools/pdf-text-extractor/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么复制 PDF 里的文字？',
              acceptedAnswer: { '@type': 'Answer', text: '上传 PDF 点击「开始提取」，即可一键复制全文或导出 TXT/Markdown。相比在阅读器中逐段选中复制，本工具按坐标重组行序，一次提取整份文档，不受右键限制与选区乱序影响。' }
            },
            {
              '@type': 'Question',
              name: '扫描版 PDF 为什么复制不了？',
              acceptedAnswer: { '@type': 'Answer', text: '扫描件页面上只有图片像素、没有记录字符编码与坐标的文本层，任何阅读器都无法直接选中复制。本工具会自动检测并提示，需先用 OCR 工具把页面图片转成文字。' }
            },
            {
              '@type': 'Question',
              name: '提取的文字会乱码吗？',
              acceptedAnswer: { '@type': 'Answer', text: '绝大多数 PDF 不会。个别 PDF 内嵌字体缺少 ToUnicode 字符映射，提取结果可能乱码或缺字，这是源文件自身的问题；可用 Word/WPS 等重新导出 PDF 后再试。' }
            },
            {
              '@type': 'Question',
              name: '本地处理和在线工具有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '常见在线工具需要把 PDF 上传到服务器解析，存在泄露与留存风险；本工具全程在浏览器本地完成，文件不出设备，适合合同、标书、论文等敏感文档。' }
            },
            {
              '@type': 'Question',
              name: '支持多少页的 PDF？',
              acceptedAnswer: { '@type': 'Answer', text: '没有硬性页数限制。几百页文字型 PDF 通常几秒到十几秒完成；超过 50MB 的大文件解析较慢，建议用页码范围分批提取。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 解析自定义页码表达式（1 基，含端点）：'1,3,5-8' → [1,3,5,6,7,8]
// 容错：倒序区间（8-3 视为 3-8）、区间越界钳制到 [1, totalPages]、空段跳过、结果去重升序；
// 越界的单个页码直接忽略；表达式为空 / 含非法字符 / 区间格式无效时抛出中文 Error
function parsePageRange(expr, totalPages) {
  const raw = String(expr == null ? '' : expr).trim()
  if (!raw) throw new Error('页码表达式为空，例如：1,3,5-8')
  if (!/^[0-9,\-\s]+$/.test(raw)) {
    throw new Error('页码表达式含有非法字符，只允许半角数字、逗号（,）和连字符（-）')
  }
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new Error('文档页数无效，请先选择 PDF 文件')
  }
  const picked = new Set()
  for (const part of raw.split(',')) {
    const seg = part.trim()
    if (!seg) continue
    if (seg.indexOf('-') !== -1) {
      const m = seg.match(/^(\d+)-(\d+)$/)
      if (!m) throw new Error(`页码区间「${seg}」格式无效，应为「起-止」形式，例如 5-8`)
      let a = parseInt(m[1], 10)
      let b = parseInt(m[2], 10)
      if (a > b) { const t = a; a = b; b = t } // 倒序区间容错
      a = Math.max(1, a)                       // 越界钳制
      b = Math.min(totalPages, b)
      for (let p = a; p <= b; p++) picked.add(p)
    } else {
      const p = parseInt(seg, 10)
      if (!Number.isInteger(p)) throw new Error(`页码「${seg}」无效`)
      if (p >= 1 && p <= totalPages) picked.add(p) // 越界单页忽略
    }
  }
  return Array.from(picked).sort((a, b) => a - b)
}

// 「从 N 到 N」区间模式：含端点、倒序自动交换、越界钳制，返回升序页码数组
function resolveSpanPages(from, to, totalPages) {
  if (!Number.isInteger(totalPages) || totalPages < 1) return []
  let a = Math.floor(Number(from)) || 1
  let b = Math.floor(Number(to)) || totalPages
  if (a > b) { const t = a; a = b; b = t }
  a = Math.max(1, a)
  b = Math.min(totalPages, b)
  const out = []
  for (let p = a; p <= b; p++) out.push(p)
  return out
}

// 把页码数组压缩成「1-3, 7」的简短描述
function describePages(pages) {
  const list = Array.from(new Set((pages || []).filter((p) => Number.isInteger(p) && p >= 1))).sort((a, b) => a - b)
  const parts = []
  let i = 0
  while (i < list.length) {
    let j = i
    while (j + 1 < list.length && list[j + 1] === list[j] + 1) j++
    parts.push(i === j ? String(list[i]) : `${list[i]}-${list[j]}`)
    i = j + 1
  }
  return parts.join(', ')
}

// 将 pdfjs getTextContent 的 items 重组为可读行（纯函数）：
// 1) 按 transform[5]（y 坐标）四舍五入到 2px 精度分桶成行，行序按 y 从大到小（PDF 坐标系 y 轴向上，先读靠上的行）
// 2) 行内按 transform[4]（x 坐标）升序拼接
// 3) 相邻项水平间隙 > 行内平均字符宽 × 0.3 时补一个空格
// 4) 忽略空文本项；缺失 width 字段时用字号（|transform[0]|）× 0.5 估算字符宽
function groupTextItemsToLines(items) {
  if (!Array.isArray(items) || !items.length) return []
  const usable = items.filter((it) => it && typeof it.str === 'string' && it.str.length > 0)
  if (!usable.length) return []

  const prepared = usable.map((it) => {
    const t = Array.isArray(it.transform) ? it.transform : [1, 0, 0, 1, 0, 0]
    const fontSize = Math.abs(Number(t[0])) || 1
    const width = (typeof it.width === 'number' && it.width > 0)
      ? it.width
      : it.str.length * fontSize * 0.5
    return { str: it.str, x: Number(t[4]) || 0, y: Number(t[5]) || 0, width }
  })

  const buckets = new Map()
  for (const it of prepared) {
    const yKey = Math.round(it.y / 2) * 2 // 2px 精度
    if (!buckets.has(yKey)) buckets.set(yKey, [])
    buckets.get(yKey).push(it)
  }

  const yKeys = Array.from(buckets.keys()).sort((a, b) => b - a) // y 大 → 靠上 → 先读

  const lines = []
  for (const yKey of yKeys) {
    const row = buckets.get(yKey).slice().sort((a, b) => a.x - b.x)
    const charWidths = row.map((it) => it.width / it.str.length)
    const avgCharWidth = charWidths.reduce((s, w) => s + w, 0) / charWidths.length
    let text = ''
    for (let i = 0; i < row.length; i++) {
      if (i > 0) {
        const gap = row[i].x - (row[i - 1].x + row[i - 1].width)
        if (gap > avgCharWidth * 0.3) text += ' '
      }
      text += row[i].str
    }
    lines.push(text)
  }
  return lines
}

// 句末标点：中英文句号/问号/叹号/分号/冒号/省略号，允许其后跟引号括号等收尾符
const SENTENCE_END_RE = /[。．！？!?；;：:…]["'」』”’）)\]】》]*$/
// 列表符 / 编号开头：项目符号、破折号、阿拉伯或中文序号
const LIST_START_RE = /^\s*([-*•·●○■□▪◦▸‣⁃>–—]|\d{1,3}[.、)）]|[一二三四五六七八九十百]+[、.．]|[（(][一二三四五六七八九十\d]+[)）])/

function isSentenceEnd(line) {
  return SENTENCE_END_RE.test(String(line || '').trimEnd())
}

function startsWithListMarker(line) {
  return LIST_START_RE.test(String(line || ''))
}

// 断行拼接：两端都是 ASCII 字母/数字时补一个空格（英文断词），否则直接相连（中文）
function joinWrappedLines(a, b) {
  const last = a.slice(-1)
  const first = b.slice(0, 1)
  const ascii = /[A-Za-z0-9]/
  return ascii.test(last) && ascii.test(first) ? a + ' ' + b : a + b
}

// 段落合并（纯函数）：
// mode='line'      → 原样逐行返回（拷贝）
// mode='paragraph' → 合并被硬换行切断的段落：上一行末尾非句末标点 且 下一行不以列表符/编号开头则拼接；
//                    空白行视为段落边界
function joinLinesToParagraphs(lines, mode) {
  const src = Array.isArray(lines) ? lines : []
  if (mode !== 'paragraph') return src.slice()

  const paras = []
  let buf = ''
  for (const raw of src) {
    const line = String(raw == null ? '' : raw)
    if (!line.trim()) {
      if (buf) { paras.push(buf); buf = '' }
      continue
    }
    const trimmed = line.trim()
    if (!buf) { buf = trimmed; continue }
    if (!isSentenceEnd(buf) && !startsWithListMarker(trimmed)) {
      buf = joinWrappedLines(buf, trimmed)
    } else {
      paras.push(buf)
      buf = trimmed
    }
  }
  if (buf) paras.push(buf)
  return paras
}

// 非空白字符数（扫描件检测用，排除纯缩进/空格伪文本层）
function countNonWhitespaceChars(text) {
  return (String(text || '').match(/\S/g) || []).length
}

// 扫描件启发式判定：平均每页非空白字符 < 10 视为疑似无文本层
function isLikelyScanned(pageTexts, perPageThreshold = 10) {
  const list = Array.isArray(pageTexts) ? pageTexts : []
  if (!list.length) return false
  const total = list.reduce((s, t) => s + countNonWhitespaceChars(t), 0)
  return total < list.length * perPageThreshold
}

// 导出文件名：<原文件名去 .pdf 后缀>-文本.<ext>
function buildExportName(rawName, ext) {
  const base = String(rawName || 'document').replace(/\.pdf$/i, '') || 'document'
  return `${base}-文本.${ext}`
}

// TXT 导出：每页之间空行分隔
function buildTxtExport(pages) {
  return (pages || [])
    .map((p) => String((p && p.text) || '').replace(/\s+$/, ''))
    .join('\n\n') + '\n'
}

// Markdown 导出：每页一个「## 第 N 页」标题
function buildMdExport(pages) {
  return (pages || [])
    .map((p) => `## 第 ${(p && p.pageNo) || '?'} 页\n\n${String((p && p.text) || '').replace(/\s+$/, '')}`)
    .join('\n\n') + '\n'
}

// 字节大小格式化
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- pdf.js 加载（动态 import，仅在用户交互回调内调用） ----------
let pdfjsLib = null
const loadPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib
  const lib = await import('pdfjs-dist')
  try {
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    lib.GlobalWorkerOptions.workerSrc = workerUrl
  } catch (e) {
    // 降级：worker 资源加载失败时置空，由 pdf.js 回退主线程解析
    console.warn('PDF worker 加载失败，回退主线程模式', e)
    lib.GlobalWorkerOptions.workerSrc = ''
  }
  pdfjsLib = lib
  return pdfjsLib
}

// ---------- 状态 ----------
const fileInput = ref(null)
const isDragging = ref(false)
const fileName = ref('')
const fileSize = ref(0)
const pageCount = ref(0)
const pdfjsReady = ref(false)
const processing = ref(false)
const error = ref('')
const progress = ref({ done: 0, total: 0 })

const rangeMode = ref('all')   // all | span | custom
const rangeFrom = ref(1)
const rangeTo = ref(1)
const customExpr = ref('')
const mergeMode = ref('line')  // line | paragraph
const viewMode = ref('pages')  // pages | full
const expandedPages = ref({})

// 原始提取结果：每页只存页码与重组后的行（非响应式文本交由 computed 派生）
const extractedPages = ref([])
// 提取运行令牌：换文件 / 重置时自增，使进行中的提取循环失效
let extractRun = 0
let pdfjsDoc = null // 非响应式：已打开的 PDF 文档句柄

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 派生数据 ----------
const clampedSpan = computed(() => {
  const pages = resolveSpanPages(rangeFrom.value, rangeTo.value, pageCount.value || 0)
  return {
    start: pages.length ? pages[0] : 1,
    end: pages.length ? pages[pages.length - 1] : 1,
    count: pages.length
  }
})

// 自定义表达式实时校验提示（未选文件或表达式为空时不做错误提示）
const customRangeHint = computed(() => {
  if (rangeMode.value !== 'custom' || !pageCount.value) return null
  const expr = String(customExpr.value || '').trim()
  if (!expr) return { ok: true, msg: `支持逗号分隔的单页与「起-止」区间，页码范围 1-${pageCount.value}，例如 1,3,5-8` }
  try {
    const pages = parsePageRange(expr, pageCount.value)
    if (!pages.length) return { ok: false, msg: `表达式未匹配到有效页码（超出 1-${pageCount.value} 的页码会被忽略）` }
    return { ok: true, msg: `将提取 ${pages.length} 页（${describePages(pages)}）` }
  } catch (e) {
    return { ok: false, msg: e && e.message ? e.message : '页码表达式无效' }
  }
})

// 按当前段落合并模式把每页行文本派生成展示/导出用的正文
const processedPages = computed(() =>
  extractedPages.value.map((p) => {
    const paras = joinLinesToParagraphs(p.lines, mergeMode.value)
    const text = mergeMode.value === 'paragraph' ? paras.join('\n\n') : paras.join('\n')
    return {
      pageNo: p.pageNo,
      lineCount: p.lines.length,
      text,
      preview: p.lines.slice(0, 3).join('\n'),
      chars: text.length,
      nonWs: countNonWhitespaceChars(text)
    }
  })
)

const totalChars = computed(() => processedPages.value.reduce((s, p) => s + p.chars, 0))
const pagesWithTextCount = computed(() => processedPages.value.filter((p) => p.nonWs > 0).length)
const isLikelyScannedDoc = computed(() => isLikelyScanned(processedPages.value.map((p) => p.text)))
const fullText = computed(() => buildTxtExport(processedPages.value).trimEnd())
const txtExportName = computed(() => buildExportName(fileName.value, 'txt'))
const mdExportName = computed(() => buildExportName(fileName.value, 'md'))

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const clearFile = () => {
  extractRun++ // 使可能仍在进行的提取失效
  if (pdfjsDoc) {
    try { pdfjsDoc.destroy() } catch (e) { /* 忽略销毁异常 */ }
    pdfjsDoc = null
  }
  fileName.value = ''
  fileSize.value = 0
  pageCount.value = 0
  pdfjsReady.value = false
  error.value = ''
  progress.value = { done: 0, total: 0 }
  extractedPages.value = []
  expandedPages.value = {}
}

const resetAll = () => {
  clearFile()
  rangeMode.value = 'all'
  rangeFrom.value = 1
  rangeTo.value = 1
  customExpr.value = ''
  mergeMode.value = 'line'
  viewMode.value = 'pages'
}

const acceptFile = async (f) => {
  if (!f) return
  if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
    error.value = '请选择 PDF 文件'
    return
  }
  clearFile()
  fileName.value = f.name
  fileSize.value = f.size
  error.value = ''
  let lib = null
  try {
    lib = await loadPdfJs()
  } catch (e) {
    error.value = 'PDF 解析组件加载失败，请检查网络后刷新页面重试。' + (e && e.message ? `（${e.message}）` : '')
    fileName.value = ''
    fileSize.value = 0
    return
  }
  try {
    const buf = await f.arrayBuffer()
    pdfjsDoc = await lib.getDocument({ data: new Uint8Array(buf) }).promise
    pageCount.value = pdfjsDoc.numPages
    rangeFrom.value = 1
    rangeTo.value = pdfjsDoc.numPages
    pdfjsReady.value = true
  } catch (e) {
    if (e && e.name === 'PasswordException') {
      error.value = '该 PDF 设有打开密码，请先解除密码后再提取。'
    } else {
      error.value = '无法读取该 PDF（文件可能损坏或格式异常），请确认后重试。' + (e && e.message ? `（${e.message}）` : '')
    }
    fileName.value = ''
    fileSize.value = 0
    pdfjsReady.value = false
    if (pdfjsDoc) {
      try { pdfjsDoc.destroy() } catch (e2) { /* 忽略销毁异常 */ }
      pdfjsDoc = null
    }
  }
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) acceptFile(files[0])
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) acceptFile(files[0])
}

// ---------- 提取 ----------
const extract = async () => {
  if (!pdfjsDoc || processing.value) return

  // 先确定要提取的页码
  let pagesToExtract = []
  if (rangeMode.value === 'custom') {
    try {
      pagesToExtract = parsePageRange(customExpr.value, pageCount.value)
    } catch (e) {
      error.value = e && e.message ? e.message : '页码表达式无效'
      return
    }
    if (!pagesToExtract.length) {
      error.value = `页码表达式未匹配到有效页码（当前文档共 ${pageCount.value} 页），请检查后重试`
      return
    }
  } else if (rangeMode.value === 'span') {
    pagesToExtract = resolveSpanPages(rangeFrom.value, rangeTo.value, pageCount.value)
  } else {
    pagesToExtract = resolveSpanPages(1, pageCount.value, pageCount.value)
  }
  if (!pagesToExtract.length) {
    error.value = '未选中任何有效页面，请检查页码范围设置'
    return
  }

  const run = ++extractRun
  processing.value = true
  error.value = ''
  extractedPages.value = []
  expandedPages.value = {}
  const total = pagesToExtract.length
  progress.value = { done: 0, total }

  try {
    const list = []
    for (let i = 0; i < total; i++) {
      if (run !== extractRun) return // 用户已换文件 / 重置，放弃本次结果
      const n = pagesToExtract[i]
      const page = await pdfjsDoc.getPage(n)
      const tc = await page.getTextContent()
      const lines = groupTextItemsToLines(tc.items)
      list.push({ pageNo: n, lines })
      page.cleanup()
      progress.value = { done: i + 1, total }
      await new Promise((r) => setTimeout(r, 0)) // 让出主线程，刷新进度
    }
    if (run !== extractRun) return
    extractedPages.value = list
  } catch (e) {
    if (run === extractRun) {
      error.value = '提取失败：' + (e && e.message ? e.message : '未知错误')
    }
  } finally {
    if (run === extractRun) {
      processing.value = false
    }
  }
}

const togglePage = (pageNo) => {
  expandedPages.value = { ...expandedPages.value, [pageNo]: !expandedPages.value[pageNo] }
}

// ---------- 导出 ----------
const copyFullText = async () => {
  const text = fullText.value
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
  alert(ok ? `已复制全文（共 ${text.length.toLocaleString()} 字符）到剪贴板` : '复制失败，请切换到「全文视图」手动选中文本复制')
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
  if (!processedPages.value.length) return
  const blob = new Blob([buildTxtExport(processedPages.value)], { type: 'text/plain;charset=utf-8' })
  triggerDownload(blob, txtExportName.value)
}

const downloadMd = () => {
  if (!processedPages.value.length) return
  const blob = new Blob([buildMdExport(processedPages.value)], { type: 'text/markdown;charset=utf-8' })
  triggerDownload(blob, mdExportName.value)
}

onMounted(() => {
  addRecentTool('pdf-text-extractor')
})
</script>
