<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BookOpen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">EPUB电子书制作</h1>
          <p class="text-sm text-muted-foreground mt-1">TXT / Markdown 按章节切分，本地打包成 EPUB 3 电子书，导入阅读器即用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 EPUB 制作工具：上传 TXT 或 Markdown 文件，自动识别「第 X 章 / 第 X 回」等章节标记（或 Markdown # / ## 标题、自定义正则），
        在浏览器本地用 JSZip 按 EPUB 3 规范组包——mimetype 首条目 STORE 不压缩、container.xml、content.opf（含 dc:title/creator/language/uuid/dcterms:modified）、
        EPUB 3 nav 目录 + 兼容老阅读器的 toc.ncx、XHTML 章节文件与温和样式表，一键下载 .epub，文件全程不上传服务器。
      </p>
      <div class="mt-3 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-primary leading-relaxed">整本书在你的浏览器内切分并打包，不上传任何服务器；小说草稿、网文合集、个人笔记可放心制作。</p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：文件与切分设置 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <FileUp class="w-5 h-5 mr-2 text-primary" /> 选择文本文件
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
            accept=".txt,.md,.markdown,text/plain,text/markdown"
            class="hidden"
            @change="handleFileChange"
          />
          <FileText v-if="!fileName" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
          <p class="text-sm text-muted-foreground">点击选择或拖入一个 .txt / .md 文件</p>
          <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Info class="w-3 h-3" /> 纯本地读取切分，文件不上传
          </p>
        </div>

        <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <FileText class="w-4 h-4 text-primary flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
            <p class="text-[10px] text-muted-foreground">{{ formatSize(fileSize) }} · 正文按{{ sourceFormat === 'md' ? ' Markdown' : ' 纯文本' }}渲染</p>
          </div>
        </div>

        <!-- 编码告警 -->
        <div v-if="mojibakeCount > 0" class="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5">
          <TriangleAlert class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            检测到 {{ mojibakeCount.toLocaleString() }} 个替换符（U+FFFD）：文件很可能不是 UTF-8 编码（常见于记事本 / Excel 导出的 GBK / ANSI 文本）。
            请先用 <NuxtLink to="/tools/file-encoding-converter" class="underline font-medium">文件编码转换</NuxtLink> 工具转成 UTF-8 再制作，否则正文会变成乱码。
          </p>
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

        <!-- 章节切分方式 -->
        <div class="mt-5">
          <label class="block text-sm font-medium text-foreground mb-2">章节切分方式</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="opt in splitModeOptions"
              :key="opt.value"
              @click="setSplitMode(opt.value)"
              :class="splitMode === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
              :title="opt.title"
            >
              {{ opt.label }}
            </button>
          </div>
          <div v-if="splitMode === 'custom'" class="mt-3">
            <input
              v-model="customRegex"
              type="text"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="输入切分正则，如：^\s*第\s*\d+\s*章"
              spellcheck="false"
            />
            <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
              每一行会单独与该正则匹配，命中即作为新章节的开头（整行作为章节标题）；{{ customRegexHint }}
            </p>
          </div>
        </div>

        <!-- 正文渲染格式 -->
        <div class="mt-5">
          <label class="block text-sm font-medium text-foreground mb-2">正文渲染格式</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="sourceFormat = 'txt'"
              :class="sourceFormat === 'txt' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >纯文本（空行分段）</button>
            <button
              @click="sourceFormat = 'md'"
              :class="sourceFormat === 'md' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >Markdown</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            默认按扩展名识别（.md / .markdown 按 Markdown）。Markdown 只做标题、段落与基础行内格式（粗体 / 斜体 / 行内代码 / 链接）转换，
            表格、图片、代码块等复杂语法按普通文本段落处理。
          </p>
        </div>

        <!-- 解析规则说明 -->
        <div class="mt-5 bg-muted/40 border border-border rounded-lg p-3">
          <h3 class="text-xs font-semibold text-foreground mb-1.5 flex items-center">
            <Settings2 class="w-3.5 h-3.5 mr-1 text-primary" /> 章节识别规则
          </h3>
          <ul class="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
            <li>• 中文章节：识别行首「第 + 数字/中文数字 + 章 / 节 / 回 / 卷 / 部 / 篇」的行（允许空格）</li>
            <li>• Markdown：识别行首 # 与 ## 标题行作为章节起点，### 及更深层级保留在正文内</li>
            <li>• 自定义正则：逐行试运行，默认已填入中文章节规则，可直接修改</li>
            <li>• 首个章节标记之前的内容若非空，会单独生成「前言」一章；无任何匹配时全书按单章生成并提示</li>
            <li>• 切分前每章内容会去除首尾空白，空章自动并入上一章</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：章节预览与生成 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ListTree class="w-5 h-5 mr-2 text-primary" /> 章节预览与生成
          </h2>
        </div>

        <!-- 空状态 -->
        <div v-if="!fileName" class="py-14 text-center text-muted-foreground">
          <BookOpen class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择 TXT / Markdown 文件后自动切分章节</p>
          <p class="text-xs mt-1">支持中文卷章、Markdown 标题与自定义正则三种切分方式</p>
        </div>

        <!-- 文件为空 -->
        <div v-else-if="rawText && !rawText.trim()" class="py-14 text-center text-muted-foreground">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">文件内容为空，请换一个文件</p>
        </div>

        <!-- 切分结果 -->
        <div v-else-if="splitResult && splitResult.ok" class="space-y-3">
          <!-- 统计 -->
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">章节数</p>
              <p class="text-lg font-bold text-foreground">{{ splitResult.chapters.length }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">总字数</p>
              <p class="text-lg font-bold text-foreground">{{ totalChars.toLocaleString() }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">命中标记</p>
              <p class="text-lg font-bold text-foreground">{{ splitResult.matchCount }}</p>
            </div>
          </div>

          <!-- 单章提示 -->
          <div v-if="splitResult.singleChapter" class="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{{ splitResult.warning }}</p>
          </div>

          <!-- 章节列表 -->
          <div class="bg-muted/30 border border-border rounded-lg max-h-[300px] overflow-y-auto divide-y divide-border">
            <div
              v-for="(ch, i) in splitResult.chapters"
              :key="i"
              class="px-3 py-2 cursor-pointer transition-colors hover:bg-muted/60"
              @click="toggleChapter(i)"
            >
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 flex-shrink-0 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{{ i + 1 }}</span>
                <p class="flex-1 min-w-0 text-xs font-medium text-foreground truncate" :title="ch.title">{{ ch.title }}</p>
                <span class="text-[10px] text-muted-foreground flex-shrink-0">{{ ch.content.length.toLocaleString() }} 字</span>
                <ChevronDown v-if="expandedChapter === i" class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <ChevronRight v-else class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </div>
              <div v-if="expandedChapter === i" class="mt-2 ml-8 bg-background border border-border rounded-lg p-2.5">
                <p class="text-[10px] text-muted-foreground mb-1">开头预览</p>
                <p class="text-[11px] text-foreground leading-relaxed break-words">{{ chapterPreview(ch) }}</p>
              </div>
            </div>
          </div>

          <!-- 元数据表单 -->
          <div class="bg-muted/40 border border-border rounded-lg p-3 space-y-2.5">
            <h3 class="text-xs font-semibold text-foreground flex items-center">
              <BookMarked class="w-3.5 h-3.5 mr-1 text-primary" /> 书籍信息（写入 EPUB 元数据）
            </h3>
            <div class="grid grid-cols-2 gap-2.5">
              <div class="col-span-2">
                <label class="block text-[11px] text-muted-foreground mb-1">书名</label>
                <input
                  v-model="bookTitle"
                  type="text"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="默认取文件名"
                />
              </div>
              <div>
                <label class="block text-[11px] text-muted-foreground mb-1">作者</label>
                <input
                  v-model="bookAuthor"
                  type="text"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="可留空"
                />
              </div>
              <div>
                <label class="block text-[11px] text-muted-foreground mb-1">语言</label>
                <select
                  v-model="bookLanguage"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option v-for="lang in languageOptions" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 生成按钮 -->
          <button
            @click="generateEpub"
            :disabled="generating || splitResult.chapters.length === 0"
            class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <Loader2 v-if="generating" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            {{ generating ? '正在本地打包…' : '生成 EPUB 并下载' }}
          </button>
          <p class="text-[11px] text-muted-foreground text-center leading-relaxed">
            EPUB 3 格式（含 nav 目录 + 兼容旧阅读器的 toc.ncx），可导入微信读书、Apple Books、Kindle、Calibre 等主流阅读器。
          </p>
        </div>

        <!-- 切分错误（如正则无效） -->
        <div v-else-if="splitResult && !splitResult.ok" class="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5">
          <TriangleAlert class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p class="text-xs text-destructive leading-relaxed">{{ splitResult.error }}</p>
        </div>

        <!-- 生成失败 -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 EPUB 电子书制作</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            EPUB 是目前最通用的开放电子书格式：本质是一个 ZIP 压缩包，内含按 XHTML 组织的章节文件、OPF 包描述（书名 / 作者 / 语言 / 唯一标识）与目录文件。
            本工具在浏览器本地把 TXT 或 Markdown 按章节切分，再逐章转成 XHTML，用 JSZip 按 EPUB 3 规范组包：
            mimetype 作为第一个条目以 STORE（不压缩）方式写入（EPUB 规范硬性要求，压缩会导致部分阅读器拒开）、META-INF/container.xml 指向
            OEBPS/content.opf、目录同时提供 EPUB 3 的 nav.xhtml 与兼容老阅读器的 toc.ncx。整个过程不经过任何服务器，断网也能用。
          </p>

          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>把网文 TXT 合集按「第 X 章」切成章节书，导入微信读书 / Apple Books / Kindle 掌阅</li>
            <li>把 Markdown 写的小说、专栏、笔记做成排版规整的电子书，方便手机上阅读</li>
            <li>为同人小说、私人日记、课程讲义制作可收藏的 .epub 文件</li>
            <li>给旧阅读器（只认 toc.ncx 目录的 EPUB 2 时代设备）准备兼容文件</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">章节是怎么切分的？</h3>
          <p>
            中文章节模式识别行首的「第 + 数字（含一二三四五六七八九十百千零等中文数字）+ 章 / 节 / 回 / 卷 / 部 / 篇」行，整行作为章节标题；
            Markdown 模式把行首 # 与 ## 标题行作为章节起点（### 及更深层级保留为正文内的小标题）；
            自定义正则模式对每一行单独试运行你输入的正则，命中即切分，右侧列表会实时显示命中章节数。
            首个标记之前若还有内容，会单独生成「前言」一章；完全识别不到标记时全书按单章生成并明确提示。
          </p>

          <h3 class="text-lg font-semibold text-foreground">Markdown 支持到什么程度？</h3>
          <p>
            本工具对 Markdown 只做标题（# → h1 ~ h6）、段落（空行分段）与基础行内格式（**粗体**、*斜体*、`行内代码`、[链接](url)）的转换，
            这是诚实的能力边界：表格、图片、引用块、代码块等复杂语法不会渲染成对应 EPUB 元素，而是按普通文本段落原样保留。
            如需完整 Markdown 渲染建议先用专业工具把 MD 转成 HTML 再打包。
          </p>

          <h3 class="text-lg font-semibold text-foreground">TXT 乱码（替换符提示）怎么办？</h3>
          <p>
            中文 TXT 很常见是 GBK / GB2312 / ANSI 编码，浏览器按 UTF-8 读取时会出现 U+FFFD 替换符，页面会在检测到时给出明确告警。
            请先用站内 <NuxtLink to="/tools/file-encoding-converter" class="text-primary hover:underline">文件编码转换</NuxtLink>
            工具把文件转成 UTF-8 再回来制作 EPUB，否则打包进书里的正文就是乱码。
          </p>

          <h3 class="text-lg font-semibold text-foreground">本地处理和在线 EPUB 工具有什么区别？</h3>
          <p>
            在线电子书制作服务需要把整本书上传到对方服务器，未发表的小说、私人笔记存在被存储或泄露的风险。
            本工具从读文件、切章节到 ZIP 组包全部发生在你的浏览器里，文件不出本地设备；代价是超大文件（几十 MB）打包耗时取决于你自己的电脑性能。
          </p>

          <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">生成的 EPUB 能在哪些阅读器打开？</h3>
              <p class="text-sm text-muted-foreground mt-1">按 EPUB 3 规范组包并同时生成兼容 EPUB 2 的 toc.ncx 目录，微信读书、Apple Books、Kindle（导入后自动转换）、Calibre、掌阅、静读天下等主流阅读器均可打开。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">章节识别不出来怎么办？</h3>
              <p class="text-sm text-muted-foreground mt-1">切换到「自定义正则」模式，用一行正则描述你的章节开头（例如 ^\s*Chapter\s+\d+），每一行都会与正则试运行匹配，右侧实时显示命中章节数。无任何匹配时全书会按单章生成并提示。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">为什么我的 TXT 做出来正文是乱码？</h3>
              <p class="text-sm text-muted-foreground mt-1">文件大概率是 GBK / ANSI 编码而非 UTF-8。页面在检测到替换符（U+FFFD）时会告警，请先用「文件编码转换」工具转成 UTF-8 再重新制作。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">Markdown 的表格和图片会进书里吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会作为表格 / 图片渲染——本工具的 Markdown 转换只覆盖标题、段落与基础行内格式（粗体 / 斜体 / 行内代码 / 链接），复杂语法按普通文本段落处理，页面明示这一边界。</p>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">文件会被上传到服务器吗？</h3>
              <p class="text-sm text-muted-foreground mt-1">不会。章节切分与 ZIP 组包全部在浏览器本地完成，整本书不出你的设备，断网状态下也可以正常使用。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'epub-maker'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  BookOpen, BookMarked, FileUp, FileCheck, FileText, Download, RefreshCw, Trash2,
  TriangleAlert, ChevronUp, ChevronDown, ChevronRight, Info, Loader2,
  Settings2, ListTree
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'EPUB电子书制作 - TXT/Markdown在线转EPUB转换器',
  description: '在线 EPUB 电子书制作工具，上传 TXT / Markdown 自动按章节切分，本地打包成 EPUB 3 格式（含 nav 目录与 toc.ncx 兼容层），支持中文章节识别与自定义正则，纯浏览器处理不上传服务器',
  keywords: 'epub制作,epub生成器,txt转epub,markdown转epub,电子书制作,章节拆分,epub转换,手机看小说',
  author: '有条工具',
  ogTitle: 'EPUB电子书制作 - 有条工具',
  ogDescription: 'TXT / Markdown 按章节切分，本地打包成 EPUB 3 电子书，文件不上传',
  ogUrl: 'https://www.util.cn/tools/epub-maker',
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
          name: 'EPUB电子书制作',
          url: 'https://www.util.cn/tools/epub-maker',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['TXT / Markdown 按章节切分', '中文章节与自定义正则识别', 'EPUB 3 规范组包（mimetype STORE 首条目）', 'nav.xhtml + toc.ncx 双目录', '书名作者语言元数据写入', '纯本地打包不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'EPUB电子书制作', item: 'https://www.util.cn/tools/epub-maker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '生成的 EPUB 能在哪些阅读器打开？',
              acceptedAnswer: { '@type': 'Answer', text: '按 EPUB 3 规范组包并同时生成兼容 EPUB 2 的 toc.ncx 目录，微信读书、Apple Books、Kindle、Calibre、掌阅等主流阅读器均可打开。' }
            },
            {
              '@type': 'Question',
              name: '章节识别不出来怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '切换到自定义正则模式，用一行正则描述章节开头（例如 ^\\s*Chapter\\s+\\d+），逐行试运行并实时显示命中章节数；无匹配时全书按单章生成并提示。' }
            },
            {
              '@type': 'Question',
              name: '为什么我的 TXT 做出来正文是乱码？',
              acceptedAnswer: { '@type': 'Answer', text: '文件大概率是 GBK / ANSI 编码而非 UTF-8。页面检测到替换符（U+FFFD）时会告警，请先用文件编码转换工具转成 UTF-8 再重新制作。' }
            },
            {
              '@type': 'Question',
              name: 'Markdown 的表格和图片会进书里吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会作为表格 / 图片渲染。Markdown 转换只覆盖标题、段落与基础行内格式（粗体 / 斜体 / 行内代码 / 链接），复杂语法按普通文本段落处理。' }
            },
            {
              '@type': 'Question',
              name: '文件会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。章节切分与 ZIP 组包全部在浏览器本地完成，整本书不出你的设备，断网状态下也可以正常使用。' }
            }
          ]
        }
      ]
    })
  }]
})

// ================== 纯逻辑（SENTINEL: EPUB_PURE_BEGIN） ==================
// 说明：本区块不依赖 Vue 与任何浏览器 API，可被 node 脚本整段提取后独立单测；
// JSZip 组包也只在本区块之外的用户回调中进行。

// XML / XHTML 文本转义（属性与文本通用）
function escapeXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 中文章节标记：行首「第 + 数字（含全角数字与中文数字）+ 章/节/回/卷/部/篇」，允许空格
const CHAPTER_MARK_RE = /^\s*第\s*[0-9０-９一二三四五六七八九十百千零〇两]+\s*[章节回卷部篇]/
// Markdown 章节：行首 # 或 ## 标题（### 及更深保留在正文）
const MD_CHAPTER_RE = /^\s*(#{1,2})\s+(.+)$/

// 自定义正则输入规整：支持 "/pattern/flags" 包裹写法（仅保留 i 标志，按行匹配不使用 g）
function normalizeRegexInput(input) {
  const s = String(input == null ? '' : input).trim()
  if (!s) return ''
  const m = s.match(/^\/(.+)\/([a-z]*)$/)
  if (m) return /i/.test(m[2]) ? new RegExp(m[1], 'i').source : m[1]
  return s
}

// 章节切分（纯函数）
// mode: 'chapter' 中文标记 | 'md' Markdown 标题 | 'custom' 自定义正则
// 返回 { ok, chapters:[{title,content}], matchCount, singleChapter, warning, error }
function splitChapters(text, mode, customRegex) {
  const src = String(text == null ? '' : text).replace(/\r\n?/g, '\n')
  if (!src.trim()) return { ok: false, chapters: [], matchCount: 0, singleChapter: false, warning: '', error: '文件内容为空' }

  let startRe = null
  if (mode === 'chapter') {
    startRe = CHAPTER_MARK_RE
  } else if (mode === 'md') {
    startRe = MD_CHAPTER_RE
  } else if (mode === 'custom') {
    const pat = normalizeRegexInput(customRegex)
    if (!pat) return { ok: false, chapters: [], matchCount: 0, singleChapter: false, warning: '', error: '请输入切分正则' }
    try {
      startRe = new RegExp(pat)
    } catch (e) {
      return { ok: false, chapters: [], matchCount: 0, singleChapter: false, warning: '', error: '正则无效：' + (e && e.message ? e.message : String(e)) }
    }
  } else {
    return { ok: false, chapters: [], matchCount: 0, singleChapter: false, warning: '', error: '未知的切分模式：' + mode }
  }

  const lines = src.split('\n')
  const markers = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (mode === 'md') {
      const m = MD_CHAPTER_RE.exec(line)
      if (m) markers.push({ idx: i, title: m[2].replace(/\s+#+\s*$/, '').trim() })
    } else {
      if (startRe.test(line)) markers.push({ idx: i, title: line.trim() })
    }
  }

  // 无匹配 → 全书单章 + 提示
  if (markers.length === 0) {
    return {
      ok: true,
      chapters: [{ title: '全文', content: src.trim() }],
      matchCount: 0,
      singleChapter: true,
      warning: '未识别到章节标记，已按全书单章生成。可切换「自定义正则」模式手动指定切分规则。',
      error: ''
    }
  }

  const chapters = []
  // 首个标记之前的非空内容 → 「前言」章
  const preLines = lines.slice(0, markers[0].idx).join('\n').trim()
  if (preLines) chapters.push({ title: '前言', content: preLines })
  for (let k = 0; k < markers.length; k++) {
    const from = markers[k].idx + 1
    const to = k + 1 < markers.length ? markers[k + 1].idx : lines.length
    chapters.push({
      title: markers[k].title || ('第' + (k + 1) + '章'),
      content: lines.slice(from, to).join('\n').trim()
    })
  }

  // 空章合并：无内容的章并入上一章（第一章除外——保留为仅含标题的章）
  const merged = []
  for (const ch of chapters) {
    if (!ch.content && merged.length > 0) {
      merged[merged.length - 1].content += '\n' + ch.title
    } else {
      merged.push(ch)
    }
  }

  return { ok: true, chapters: merged, matchCount: markers.length, singleChapter: false, warning: '', error: '' }
}

// UUID v4（Math.random 版本，纯函数可 node 单测；仅作书籍唯一标识用）
function generateUuid() {
  const hex = '0123456789abcdef'
  let s = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-'
    else if (i === 14) s += '4'
    else if (i === 19) s += hex[8 + Math.floor(Math.random() * 4)]
    else s += hex[Math.floor(Math.random() * 16)]
  }
  return s
}

// Markdown 行内基础转换：先整体转义，再做 行内代码 / 链接 / 粗体 / 斜体（诚实边界：仅此四种）
function mdInlineToHtml(s) {
  let h = escapeXml(s)
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>')
  h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => '<a href="' + url + '">' + text + '</a>')
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  h = h.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  return h
}

// TXT 章节正文 → XHTML：按空行分段，段内换行 → <br/>，内容全部转义
function txtChapterBodyHtml(content) {
  const paras = String(content == null ? '' : content)
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
  return paras
    .map(p => '    <p>' + escapeXml(p).replace(/\n/g, '<br/>') + '</p>')
    .join('\n')
}

// Markdown 章节正文 → XHTML：# 级别 → h1~h6，其余按段落（空行分段、行内换行 → <br/>）
// 诚实边界：表格 / 图片 / 引用块 / 代码块等块级语法不做特殊渲染，按普通文本段落保留
function mdChapterBodyHtml(content) {
  const lines = String(content == null ? '' : content).split('\n')
  const out = []
  let buf = []
  const flush = () => {
    if (!buf.length) return
    out.push('    <p>' + buf.map(l => mdInlineToHtml(l)).join('<br/>') + '</p>')
    buf = []
  }
  for (const line of lines) {
    const hm = /^\s*(#{1,6})\s+(.*)$/.exec(line)
    if (hm) {
      flush()
      const lv = Math.min(hm[1].length, 6)
      const inner = mdInlineToHtml(hm[2].replace(/\s+#+\s*$/, '').trim())
      out.push('    <h' + lv + '>' + inner + '</h' + lv + '>')
      continue
    }
    if (!line.trim()) { flush(); continue }
    buf.push(line.replace(/\s+$/, ''))
  }
  flush()
  return out.join('\n')
}

// 单章 → XHTML 文件（XHTML 1.1 命名空间严格格式）
function buildChapterXhtml(ch, lang, n, format) {
  const title = escapeXml(ch.title || ('第' + n + '章'))
  const body = format === 'md'
    ? mdChapterBodyHtml(ch.content)
    : txtChapterBodyHtml(ch.content)
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!DOCTYPE html>\n'
    + '<html xmlns="http://www.w3.org/1999/xhtml" lang="' + lang + '" xml:lang="' + lang + '">\n'
    + '  <head>\n'
    + '    <title>' + title + '</title>\n'
    + '    <link rel="stylesheet" type="text/css" href="style.css"/>\n'
    + '  </head>\n'
    + '  <body>\n'
    + '    <h1 class="chapter-title">' + title + '</h1>\n'
    + (body ? body + '\n' : '')
    + '  </body>\n'
    + '</html>\n'
}

// 温和样式：只用相对字号与行距，不设颜色 / 强制字体，阅读器可覆盖
const EPUB_STYLE_CSS = [
  'body { line-height: 1.7; margin: 0 5%; }',
  'h1 { font-size: 1.35em; text-align: center; margin: 1.4em 0 1em; }',
  'h2 { font-size: 1.2em; margin: 1.2em 0 0.8em; }',
  'h3, h4, h5, h6 { font-size: 1.05em; margin: 1em 0 0.6em; }',
  'p { margin: 0.35em 0; text-indent: 2em; }',
  'h1 + p, h2 + p, h3 + p { text-indent: 0; }',
  'a { color: inherit; }',
  'code { font-family: monospace; font-size: 0.9em; }',
  'nav ol { list-style: none; padding: 0; margin: 0; }',
  'nav li { margin: 0.4em 0; text-indent: 0; }',
  ''
].join('\n')

// EPUB 文件组包（纯函数）：返回 { 路径: 内容字符串 } 表
// mimetype 条目由调用方以 STORE 方式最先写入（EPUB 规范硬要求），不在此函数内
function buildEpubFiles(chapters, meta, format) {
  const chs = Array.isArray(chapters) ? chapters : []
  const title = escapeXml(String(meta && meta.title ? meta.title : '未命名'))
  const author = String(meta && meta.author ? meta.author : '').trim()
  const lang = String(meta && meta.language ? meta.language : 'zh').replace(/[^A-Za-z0-9-]/g, '') || 'zh'
  const uuid = String(meta && meta.uuid ? meta.uuid : generateUuid())
  const modified = String(meta && meta.modified ? meta.modified : '1970-01-01T00:00:00Z')

  const files = {}
  files['META-INF/container.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n'
    + '  <rootfiles>\n'
    + '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n'
    + '  </rootfiles>\n'
    + '</container>\n'

  const manifestItems = [
    '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '    <item id="css" href="style.css" media-type="text/css"/>'
  ]
  const spineItems = ['    <itemref idref="nav" linear="no"/>']
  const navLis = []
  const ncxPoints = []

  chs.forEach((ch, i) => {
    const n = i + 1
    const id = 'chapter-' + n
    const href = id + '.xhtml'
    const t = escapeXml(ch.title || ('第' + n + '章'))
    manifestItems.push('    <item id="' + id + '" href="' + href + '" media-type="application/xhtml+xml"/>')
    spineItems.push('    <itemref idref="' + id + '"/>')
    navLis.push('        <li><a href="' + href + '">' + t + '</a></li>')
    ncxPoints.push('      <navPoint id="navPoint-' + n + '" playOrder="' + n + '">\n'
      + '        <navLabel><text>' + t + '</text></navLabel>\n'
      + '        <content src="' + href + '"/>\n'
      + '      </navPoint>')
    files['OEBPS/' + href] = buildChapterXhtml(ch, lang, n, format)
  })

  const creatorLine = author
    ? '\n    <dc:creator id="creator">' + escapeXml(author) + '</dc:creator>'
    : ''

  files['OEBPS/content.opf'] = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="' + lang + '">\n'
    + '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n'
    + '    <dc:title id="title">' + title + '</dc:title>'
    + creatorLine + '\n'
    + '    <dc:language>' + lang + '</dc:language>\n'
    + '    <dc:identifier id="book-id">urn:uuid:' + uuid + '</dc:identifier>\n'
    + '    <meta property="dcterms:modified">' + modified + '</meta>\n'
    + '  </metadata>\n'
    + '  <manifest>\n'
    + manifestItems.join('\n') + '\n'
    + '  </manifest>\n'
    + '  <spine toc="ncx">\n'
    + spineItems.join('\n') + '\n'
    + '  </spine>\n'
    + '</package>\n'

  files['OEBPS/nav.xhtml'] = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!DOCTYPE html>\n'
    + '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="' + lang + '" xml:lang="' + lang + '">\n'
    + '  <head>\n'
    + '    <title>目录</title>\n'
    + '    <link rel="stylesheet" type="text/css" href="style.css"/>\n'
    + '  </head>\n'
    + '  <body>\n'
    + '    <nav epub:type="toc" id="toc">\n'
    + '      <h1>目录</h1>\n'
    + '      <ol>\n'
    + navLis.join('\n') + '\n'
    + '      </ol>\n'
    + '    </nav>\n'
    + '    <nav epub:type="landmarks" id="landmarks" hidden="hidden">\n'
    + '      <ol>\n'
    + (chs.length ? '        <li><a epub:type="bodymatter" href="chapter-1.xhtml">正文</a></li>\n' : '')
    + '      </ol>\n'
    + '    </nav>\n'
    + '  </body>\n'
    + '</html>\n'

  files['OEBPS/toc.ncx'] = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="' + lang + '">\n'
    + '  <head>\n'
    + '    <meta name="dtb:uid" content="urn:uuid:' + uuid + '"/>\n'
    + '    <meta name="dtb:depth" content="1"/>\n'
    + '    <meta name="dtb:totalPageCount" content="0"/>\n'
    + '    <meta name="dtb:maxPageNumber" content="0"/>\n'
    + '  </head>\n'
    + '  <docTitle><text>' + title + '</text></docTitle>\n'
    + '  <navMap>\n'
    + ncxPoints.join('\n') + '\n'
    + '  </navMap>\n'
    + '</ncx>\n'

  files['OEBPS/style.css'] = EPUB_STYLE_CSS
  return files
}
// ================== 纯逻辑（SENTINEL: EPUB_PURE_END） ====================

// ---------- 状态 ----------
const fileInput = ref(null)
const isDragging = ref(false)
const fileName = ref('')
const fileSize = ref(0)
const rawText = ref('')
const error = ref('')
const generating = ref(false)
const expandedChapter = ref(null)

// 切分设置
const splitMode = ref('chapter') // chapter | md | custom
const customRegex = ref('^\\s*第\\s*[0-9０-９一二三四五六七八九十百千零〇两]+\\s*[章节回卷部篇]')
const sourceFormat = ref('txt') // txt | md

// 元数据
const bookTitle = ref('')
const bookAuthor = ref('')
const bookLanguage = ref('zh')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const splitModeOptions = [
  { value: 'chapter', label: '中文章节', title: '识别行首 第X章/节/回/卷/部/篇' },
  { value: 'md', label: 'Markdown标题', title: '识别行首 # 与 ## 标题行' },
  { value: 'custom', label: '自定义正则', title: '逐行匹配自定义正则' }
]

const languageOptions = [
  { value: 'zh', label: '中文（zh）' },
  { value: 'zh-TW', label: '繁体中文（zh-TW）' },
  { value: 'en', label: '英语（en）' },
  { value: 'ja', label: '日语（ja）' },
  { value: 'ko', label: '韩语（ko）' },
  { value: 'fr', label: '法语（fr）' },
  { value: 'de', label: '德语（de）' },
  { value: 'es', label: '西班牙语（es）' },
  { value: 'ru', label: '俄语（ru）' }
]

// ---------- 派生数据 ----------
const mojibakeCount = computed(() => (rawText.value.match(/\uFFFD/g) || []).length)

const customRegexHint = computed(() => {
  if (splitMode.value !== 'custom') return ''
  const m = normalizeRegexInput(customRegex.value).match(/^\^/)
  return m ? '正则已带 ^ 锚定行首' : '未锚定 ^ 时行内任意位置命中即切分'
})

const splitResult = computed(() => {
  if (!rawText.value || !rawText.value.trim()) return null
  return splitChapters(rawText.value, splitMode.value, customRegex.value)
})

const totalChars = computed(() => {
  const res = splitResult.value
  if (!res || !res.ok) return 0
  return res.chapters.reduce((sum, ch) => sum + ch.content.length, 0)
})

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const chapterPreview = (ch) => {
  const head = String(ch.content || '').slice(0, 120).trim()
  return head ? head + (ch.content.length > 120 ? '…' : '') : '（本章暂无正文内容）'
}

const setSplitMode = (mode) => {
  splitMode.value = mode
  expandedChapter.value = null
}

const toggleChapter = (i) => {
  expandedChapter.value = expandedChapter.value === i ? null : i
}

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const resetAll = () => {
  fileName.value = ''
  fileSize.value = 0
  rawText.value = ''
  error.value = ''
  expandedChapter.value = null
  bookTitle.value = ''
  bookAuthor.value = ''
  bookLanguage.value = 'zh'
  splitMode.value = 'chapter'
  sourceFormat.value = 'txt'
}

const acceptFile = async (f) => {
  if (!f) return
  resetAll()
  fileName.value = f.name
  fileSize.value = f.size
  try {
    const text = await f.text()
    rawText.value = text
    // 按扩展名识别渲染格式与默认切分方式
    if (/\.(md|markdown|mdown|mkd)$/i.test(f.name)) {
      sourceFormat.value = 'md'
      splitMode.value = 'md'
    } else {
      sourceFormat.value = 'txt'
      splitMode.value = 'chapter'
    }
    // 书名默认取文件名（去扩展名）
    bookTitle.value = f.name.replace(/\.[^.]+$/, '') || '未命名'
  } catch (e) {
    error.value = '读取文件失败：' + (e && e.message ? e.message : '未知错误')
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

// ---------- 生成 EPUB（JSZip 动态 import 只出现在用户回调中） ----------
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

const generateEpub = async () => {
  const res = splitResult.value
  if (!res || !res.ok || !res.chapters.length) return
  generating.value = true
  error.value = ''
  try {
    // EPUB 3 dcterms:modified 要求 UTC 时间（去掉毫秒）
    const meta = {
      title: bookTitle.value.trim() || '未命名',
      author: bookAuthor.value.trim(),
      language: bookLanguage.value || 'zh',
      uuid: generateUuid(),
      modified: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    }
    const files = buildEpubFiles(res.chapters, meta, sourceFormat.value)

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    // EPUB 规范硬要求：mimetype 必须是第一个条目且不压缩（STORE）
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
    for (const path of Object.keys(files)) {
      zip.file(path, files[path])
    }
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE' })
    const safeName = (meta.title.replace(/[\\/:*?"<>|]/g, '_') || 'book') + '.epub'
    triggerDownload(blob, safeName)
  } catch (e) {
    error.value = 'EPUB 打包失败：' + (e && e.message ? e.message : '未知错误')
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  addRecentTool('epub-maker')
})
</script>
