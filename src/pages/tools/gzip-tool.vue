<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileArchive class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">gzip 压缩解压</h1>
          <p class="text-sm text-muted-foreground mt-1">文本与文件的 gzip 压缩解压，实时查看压缩率，浏览器原生实现、零依赖</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        gzip 是最通用的无损压缩格式（RFC 1952，Deflate 流）。本工具直接调用浏览器原生的
        <code class="px-1 bg-muted rounded text-sm">CompressionStream</code> /
        <code class="px-1 bg-muted rounded text-sm">DecompressionStream</code> API：粘贴文本或上传任意文件即可压成标准
        <code class="px-1 bg-muted rounded text-sm">.gz</code> 下载，也能上传 .gz 解压恢复原文件——解压后优先按 UTF-8 文本预览，
        二进制内容则显示十六进制文件头并直接下载原字节，文件名自动去掉 .gz 后缀。压缩结果同时提供 Base64 / Hex 编码，
        方便小文本走聊天、邮件等纯文本通道。压缩与解压全程在本机内存完成，不上传任何数据。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        数据不出浏览器：压缩解压全部由本机原生 API 完成，不会上传到任何服务器。
      </div>
    </div>

    <!-- 能力检测提示 -->
    <div
      v-if="supported === false"
      class="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-700 dark:text-amber-400 leading-relaxed"
    >
      当前浏览器不支持 CompressionStream / DecompressionStream API，压缩与解压功能不可用。
      请改用 Chrome / Edge 80+、Firefox 113+ 或 Safari 16.4+ 及以上版本。
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：操作区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Archive class="w-5 h-5 mr-2 text-primary" /> 选择操作
        </h2>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="op in OPERATIONS"
            :key="op.value"
            @click="switchMode(op.value)"
            :class="mode === op.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >{{ op.label }}</button>
        </div>

        <!-- 模式 A：压缩 -->
        <template v-if="mode === 'compress'">
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="sm in SOURCE_MODES"
              :key="sm.value"
              @click="switchSrcMode(sm.value)"
              :class="srcMode === sm.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded-lg text-xs font-medium transition-all"
            >{{ sm.label }}</button>
          </div>

          <template v-if="srcMode === 'text'">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">要压缩的文本</label>
              <textarea
                v-model="inputText"
                rows="8"
                spellcheck="false"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="粘贴 JSON、日志、CSV、代码等重复度高的文本，压缩效果最明显……"
              ></textarea>
              <p class="mt-1.5 text-xs text-muted-foreground">{{ inputText.length }} 字符</p>
            </div>
            <button
              @click="runCompressText"
              :disabled="!supported || busy"
              class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >{{ busy ? '压缩中…' : 'gzip 压缩文本' }}</button>
          </template>

          <template v-else>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">要压缩的文件（任意类型）</label>
              <input
                ref="compressFileInput"
                type="file"
                class="hidden"
                @change="onCompressFileChange"
              >
              <div
                @click="triggerCompressPick"
                @drop.prevent="onCompressDrop"
                @dragover.prevent="dragCompress = true"
                @dragleave="dragCompress = false"
                class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
                :class="dragCompress ? 'border-primary/60 bg-primary/5' : 'border-border'"
              >
                <Upload class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <div class="text-sm text-muted-foreground">点击选择或拖拽文件到此处</div>
              </div>
              <div v-if="pickedFile" class="mt-3 flex items-center justify-between p-3 bg-muted/40 border border-border rounded-lg">
                <div class="min-w-0">
                  <div class="text-sm font-medium text-foreground truncate">{{ pickedFile.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ formatBytes(pickedFile.size) }}</div>
                </div>
                <button @click="clearPickedFile" class="p-1.5 text-muted-foreground hover:text-foreground" aria-label="移除文件">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              @click="runCompressFile"
              :disabled="!supported || busy || !pickedFile"
              class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >{{ busy ? '压缩中…' : 'gzip 压缩文件' }}</button>
          </template>

          <div class="p-3 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground leading-relaxed">
            诚实标注：浏览器 CompressionStream API 没有压缩级别参数（使用实现默认级别），输出为标准 gzip
            格式（<code class="px-0.5 bg-muted rounded">gunzip</code> / <code class="px-0.5 bg-muted rounded">gzip -d</code> 均可解），
            但压缩率可能与命令行 <code class="px-0.5 bg-muted rounded">gzip -9</code> 的结果不同。已压缩过一次的内容（jpg / zip / mp4）再压缩几乎不会再变小。
          </div>
        </template>

        <!-- 模式 B：解压 -->
        <template v-else>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">要解压的 .gz 文件</label>
            <input
              ref="gzFileInput"
              type="file"
              accept=".gz,.tgz,application/gzip,application/x-gzip"
              class="hidden"
              @change="onGzFileChange"
            >
            <div
              @click="triggerGzPick"
              @drop.prevent="onGzDrop"
              @dragover.prevent="dragGz = true"
              @dragleave="dragGz = false"
              class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
              :class="dragGz ? 'border-primary/60 bg-primary/5' : 'border-border'"
            >
              <PackageOpen class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <div class="text-sm text-muted-foreground">点击选择或拖拽 .gz 文件到此处</div>
            </div>
            <div v-if="gzFile" class="mt-3 flex items-center justify-between p-3 bg-muted/40 border border-border rounded-lg">
              <div class="min-w-0">
                <div class="text-sm font-medium text-foreground truncate">{{ gzFile.name }}</div>
                <div class="text-xs text-muted-foreground">{{ formatBytes(gzFile.size) }}</div>
              </div>
              <button @click="clearGzFile" class="p-1.5 text-muted-foreground hover:text-foreground" aria-label="移除文件">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            @click="runDecompress"
            :disabled="!supported || busy || !gzFile"
            class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >{{ busy ? '解压中…' : '解压 .gz 文件' }}</button>

          <div class="p-3 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground leading-relaxed">
            诚实标注：对多成员 gzip 文件（多个 gzip 流拼接，如部分工具的追加压缩产物），浏览器原生
            DecompressionStream 只解压第一个成员，这是原生流的固定行为。解压结果优先按 UTF-8
            文本预览，二进制内容显示十六进制文件头并直接下载原字节。建议单文件 100MB 以内（浏览器内存限制）。
          </div>
        </template>

        <p v-if="errorMsg" class="text-sm text-red-600 dark:text-red-400">{{ errorMsg }}</p>
      </div>

      <!-- 右侧：结果区 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <!-- 压缩结果 -->
        <template v-if="mode === 'compress'">
          <div v-if="compressResult" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-foreground flex items-center gap-2">
                <FileArchive class="w-4 h-4 text-primary" /> 压缩结果
              </h3>
              <button
                @click="downloadBytes(compressResult.bytes, compressResult.downloadName)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Download class="w-3.5 h-3.5" /> 下载 {{ compressResult.downloadName }}
              </button>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="border border-border rounded-lg p-3 text-center">
                <div class="text-xs text-muted-foreground mb-1">原始大小</div>
                <div class="text-sm font-semibold text-foreground">{{ formatBytes(compressResult.originalSize) }}</div>
              </div>
              <div class="border border-border rounded-lg p-3 text-center">
                <div class="text-xs text-muted-foreground mb-1">压缩后大小</div>
                <div class="text-sm font-semibold text-foreground">{{ formatBytes(compressResult.compressedSize) }}</div>
              </div>
              <div class="border border-border rounded-lg p-3 text-center">
                <div class="text-xs text-muted-foreground mb-1">压缩率</div>
                <div class="text-sm font-semibold" :class="compressResult.ratio < 100 ? 'text-green-600 dark:text-green-400' : 'text-foreground'">
                  {{ compressResult.ratio }}%
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="grid grid-cols-2 gap-1.5 w-44">
                  <button
                    @click="encView = 'base64'"
                    :class="encView === 'base64' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                    class="py-1.5 rounded-lg text-xs font-medium transition-all"
                  >Base64</button>
                  <button
                    @click="encView = 'hex'"
                    :class="encView === 'hex' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                    class="py-1.5 rounded-lg text-xs font-medium transition-all"
                  >Hex</button>
                </div>
                <button
                  @click="copyText(encOutput, 'enc-output')"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
                >
                  <Check v-if="copiedKey === 'enc-output'" class="w-3.5 h-3.5 text-green-600" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  {{ copiedKey === 'enc-output' ? '已复制' : '复制' }}
                </button>
              </div>
              <pre class="overflow-auto p-3 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed max-h-48 whitespace-pre-wrap break-all">{{ encOutput }}</pre>
              <p class="mt-1.5 text-xs text-muted-foreground">
                gzip 结果的{{ encView === 'base64' ? ' Base64' : ' 十六进制' }}编码（{{ encOutput.length }} 字符），
                适合把小文本的压缩结果复制到聊天、邮件等纯文本通道。
              </p>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              下载的 .gz 是标准 gzip 文件，可用 <code class="px-0.5 bg-muted rounded">gunzip</code>、<code class="px-0.5 bg-muted rounded">gzip -d</code> 或其他解压工具打开。
            </p>
          </div>
          <div v-else class="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
            输入文本或选择文件后，这里会显示压缩结果与压缩率
          </div>
        </template>

        <!-- 解压结果 -->
        <template v-else>
          <div v-if="decompressResult" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-foreground flex items-center gap-2">
                <PackageOpen class="w-4 h-4 text-primary" /> 解压结果
              </h3>
              <button
                @click="downloadBytes(decompressResult.bytes, decompressResult.downloadName)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Download class="w-3.5 h-3.5" /> 下载 {{ decompressResult.downloadName }}
              </button>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="border border-border rounded-lg p-3 text-center min-w-0">
                <div class="text-xs text-muted-foreground mb-1">还原文件名</div>
                <div class="text-sm font-semibold text-foreground truncate">{{ decompressResult.downloadName }}</div>
              </div>
              <div class="border border-border rounded-lg p-3 text-center">
                <div class="text-xs text-muted-foreground mb-1">解压后大小</div>
                <div class="text-sm font-semibold text-foreground">{{ formatBytes(decompressResult.bytes.length) }}</div>
              </div>
            </div>

            <div v-if="decompressResult.isText">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium text-foreground">已按 UTF-8 解码，文本预览：</span>
                <button
                  @click="copyText(decompressResult.text, 'dec-text')"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
                >
                  <Check v-if="copiedKey === 'dec-text'" class="w-3.5 h-3.5 text-green-600" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  {{ copiedKey === 'dec-text' ? '已复制' : '复制文本' }}
                </button>
              </div>
              <pre class="overflow-auto p-3 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed max-h-64 whitespace-pre-wrap break-all">{{ decompressResult.text }}</pre>
            </div>
            <div v-else>
              <div class="mb-2 text-xs font-medium text-foreground">二进制内容（无法按 UTF-8 文本预览），十六进制文件头：</div>
              <pre class="overflow-auto p-3 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">{{ decompressResult.hexHead }}</pre>
              <p class="mt-1.5 text-xs text-muted-foreground">点上方按钮直接下载原始字节，文件名已去掉 .gz 后缀。</p>
            </div>
          </div>
          <div v-else class="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
            选择 .gz 文件后，这里会显示解压结果与预览
          </div>
        </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 gzip 在线压缩解压工具</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            gzip 基于 DEFLATE 算法（RFC 1951）与 gzip 容器格式（RFC 1952），是 HTTP 传输、Linux 发行版包管理、日志归档中最通用的无损压缩格式。
            2022 年起，浏览器把 gzip 压缩解压做成了原生流式 API——CompressionStream 与 DecompressionStream，
            无需引入 pako 等第三方库即可在纯前端完成标准 gzip 压缩。本工具即基于这对原生 API 构建：零依赖、零网络请求，
            输出是标准 .gz 文件，可被 gunzip、gzip -d、7-Zip 等一切兼容 gzip 的工具打开。
          </p>

          <h3 class="text-lg font-semibold text-foreground">什么时候用它</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>压缩前先看效果：粘贴 JSON / 日志 / CSV / 代码，立刻看到压缩后大小与压缩率，判断值不值得压缩传输或归档。</li>
            <li>给小文本"挤水分"：压缩结果转 Base64 后贴进聊天、邮件、配置文件等纯文本通道，接收方解 Base64 + gunzip 即可还原。</li>
            <li>解压 .gz 文件：没有命令行环境时（如手机、公司受限电脑），上传 .gz 直接还原，文本内容先预览再下载。</li>
            <li>HTTP 调试：直观感受 Content-Encoding: gzip 对响应体积的实际收益。</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">边界与诚实说明</h3>
          <p>
            浏览器的 CompressionStream 没有压缩级别参数（命令行的 -1 到 -9），始终使用实现默认级别，因此压缩率与
            <code class="px-1 bg-muted rounded">gzip -9</code> 可能不同，但格式完全标准、可互通。解压多成员 gzip
            （多个 gzip 流首尾拼接）时，原生 DecompressionStream 只解第一个成员。解压结果按 UTF-8 尝试解码做文本预览：
            合法 UTF-8 的内容直接预览，否则按二进制处理，显示十六进制文件头并下载原字节——判断只影响预览方式，下载永远是逐字节还原。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些浏览器？</span>CompressionStream / DecompressionStream 需要 Chrome / Edge 80+、Firefox 113+ 或 Safari 16.4+；更旧的浏览器打开本页会显示不支持提示，按钮置灰。</li>
            <li><span class="text-foreground font-medium">压缩结果和命令行 gzip 一样吗？</span>是标准 gzip 格式，gunzip 可解；但浏览器 API 无压缩级别参数（默认级别），压缩率可能与 gzip -9 不同。</li>
            <li><span class="text-foreground font-medium">压缩率是怎么算的？</span>压缩率 = 压缩后大小 ÷ 原始大小 × 100%，数值越小说明压得越狠。重复度高的文本可压到 20%–40%，图片视频等已压缩格式接近 100%。</li>
            <li><span class="text-foreground font-medium">解压出来是乱码？</span>.gz 里装的是二进制（图片、字体、压缩包等）时无法按文本预览，工具会显示十六进制文件头并直接下载原始字节，文件名自动去掉 .gz 后缀（如 a.txt.gz → a.txt）。</li>
            <li><span class="text-foreground font-medium">我的数据会上传吗？</span>不会。压缩解压由浏览器原生 API 在本机内存完成，页面没有任何网络请求，关闭页面数据即释放。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'gzip-tool'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FileArchive, Archive, PackageOpen, Upload, Download, Copy, Check, ChevronUp, ChevronDown, ShieldCheck, X } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'gzip压缩解压工具 - 在线gz解压、文件压缩率查看',
  description: '在线 gzip 压缩解压工具：文本与文件 gzip 压缩、.gz 解压，实时查看压缩率，支持下载标准 .gz 与 Base64/Hex 编码，浏览器原生 CompressionStream 实现，纯本地不上传',
  keywords: 'gzip压缩, gzip解压, 在线gz解压, 文件压缩率, gzip在线工具, 文本压缩',
  author: 'Util工具箱',
  ogTitle: 'gzip 压缩解压 - 有条工具',
  ogDescription: '文本与文件的 gzip 压缩解压，实时查看压缩率，浏览器原生实现、数据不上传',
  ogUrl: 'https://www.util.cn/tools/gzip-tool',
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
          name: 'gzip 压缩解压',
          url: 'https://www.util.cn/tools/gzip-tool',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any（浏览器）',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['文本 gzip 压缩', '文件 gzip 压缩', '.gz 解压还原', '压缩率实时查看', 'Base64/Hex 编码复制', '标准 gzip 格式下载']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'gzip 压缩解压', item: 'https://www.util.cn/tools/gzip-tool/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '支持哪些浏览器？',
              acceptedAnswer: { '@type': 'Answer', text: '需要浏览器支持 CompressionStream / DecompressionStream API：Chrome / Edge 80+、Firefox 113+、Safari 16.4+ 及以上版本。更旧的浏览器会看到不支持提示，功能按钮置灰。' }
            },
            {
              '@type': 'Question',
              name: '压缩结果和命令行 gzip 一样吗？',
              acceptedAnswer: { '@type': 'Answer', text: '输出是标准 gzip 格式，gunzip、gzip -d 等工具均可解压。但浏览器 CompressionStream API 没有压缩级别参数（使用实现默认级别），压缩率可能与命令行 gzip -9 的结果不同。' }
            },
            {
              '@type': 'Question',
              name: '压缩率是怎么算的？',
              acceptedAnswer: { '@type': 'Answer', text: '压缩率 = 压缩后大小 ÷ 原始大小 × 100%，越小说明压得越狠。重复度高的文本通常可压到 20%–40%，jpg/zip/mp4 等已压缩格式再压缩接近 100%。' }
            },
            {
              '@type': 'Question',
              name: '解压出来是乱码怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '说明 .gz 里是二进制内容（图片、字体、压缩包等），无法按 UTF-8 文本预览。工具会显示十六进制文件头，点击下载按钮即可得到逐字节还原的原始文件，文件名自动去掉 .gz 后缀。' }
            },
            {
              '@type': 'Question',
              name: '我的数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。压缩解压全部由浏览器原生流式 API 在本机内存完成，页面没有任何网络请求，关闭页面数据即释放。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'gzip-tool')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] 纯函数（可独立提取测试，node 18+ 亦有 CompressionStream/crypto 全局） =====

// 大小智能换算：B / KB / MB / GB / TB
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return bytes + ' B'
  const units = ['KB', 'MB', 'GB', 'TB']
  let val = bytes
  let i = -1
  do {
    val /= 1024
    i++
  } while (val >= 1024 && i < units.length - 1)
  return val.toFixed(2) + ' ' + units[i]
}

// 压缩率（百分比，保留 1 位小数）：压缩后 ÷ 原始 × 100
function compressionRatio(originalSize, compressedSize) {
  if (!originalSize || originalSize <= 0) return 0
  return Math.round((compressedSize / originalSize) * 1000) / 10
}

// 由 .gz 文件名推导解压后文件名：a.txt.gz→a.txt；archive.gz→archive；无 .gz 后缀→原名+.out
function deriveOriginalName(name) {
  const n = String(name || '')
  if (/\.gz$/i.test(n) && n.length > 3) return n.slice(0, -3)
  return n + '.out'
}

// 字节 → 十六进制字符串（可限制预览字节数）
function bytesToHex(bytes, limit) {
  const arr = limit ? bytes.slice(0, limit) : bytes
  let out = ''
  for (let i = 0; i < arr.length; i++) {
    out += (arr[i] < 16 ? '0' : '') + arr[i].toString(16)
    if (i < arr.length - 1) out += ' '
  }
  return out
}

// 字节 → Base64（纯表驱动实现，浏览器与 node 通用，无 btoa/Buffer 依赖）
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function bytesToBase64(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = bytes[i + 1]
    const b2 = bytes[i + 2]
    out += B64_CHARS[b0 >> 2]
    out += B64_CHARS[((b0 & 3) << 4) | ((b1 === undefined ? 0 : b1) >> 4)]
    out += b1 === undefined ? '=' : B64_CHARS[((b1 & 15) << 2) | ((b2 === undefined ? 0 : b2) >> 6)]
    out += b2 === undefined ? '=' : B64_CHARS[b2 & 63]
  }
  return out
}

// UTF-8 编码 / 严格解码（非法 UTF-8 返回 null，用于判断文本 or 二进制）
function utf8Encode(text) {
  return new TextEncoder().encode(text)
}
function utf8DecodeStrict(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch (e) {
    return null
  }
}

// gzip 魔数检测：1F 8B
function isGzipMagic(bytes) {
  return !!bytes && bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b
}

// 流 → 字节（Response 全局可用：浏览器与 node 18+）
async function streamToBytes(stream) {
  const buf = await new Response(stream).arrayBuffer()
  return new Uint8Array(buf)
}

// gzip 压缩（浏览器原生 CompressionStream，零依赖）
async function gzipCompress(bytes) {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('当前浏览器不支持 CompressionStream API')
  }
  const cs = new CompressionStream('gzip')
  return streamToBytes(new Blob([bytes]).stream().pipeThrough(cs))
}

// gzip 解压（注意：原生流对多成员 gzip 只解第一个成员）
async function gzipDecompress(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('当前浏览器不支持 DecompressionStream API')
  }
  const ds = new DecompressionStream('gzip')
  return streamToBytes(new Blob([bytes]).stream().pipeThrough(ds))
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const OPERATIONS = [
  { value: 'compress', label: 'gzip 压缩' },
  { value: 'decompress', label: 'gzip 解压' }
]
const SOURCE_MODES = [
  { value: 'text', label: '文本输入' },
  { value: 'file', label: '文件上传' }
]

const supported = ref(null) // null=检测中，true/false
const mode = ref('compress')
const srcMode = ref('text')
const inputText = ref('')
const pickedFile = ref(null)
const gzFile = ref(null)
const busy = ref(false)
const errorMsg = ref('')
const encView = ref('base64')
const copiedKey = ref('')
const seoContentVisible = ref(true)
const dragCompress = ref(false)
const dragGz = ref(false)

const compressFileInput = ref(null)
const gzFileInput = ref(null)

const compressResult = ref(null) // { originalSize, compressedSize, ratio, bytes, downloadName }
const decompressResult = ref(null) // { bytes, downloadName, isText, text, hexHead }

const encOutput = computed(() => {
  if (!compressResult.value) return ''
  return encView.value === 'base64'
    ? bytesToBase64(compressResult.value.bytes)
    : bytesToHex(compressResult.value.bytes)
})

// ---------- 模式切换 ----------
function switchMode(v) {
  mode.value = v
  errorMsg.value = ''
}
function switchSrcMode(v) {
  srcMode.value = v
  errorMsg.value = ''
}

// ---------- 文件选择 ----------
function triggerCompressPick() {
  if (compressFileInput.value) compressFileInput.value.click()
}
function onCompressFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (f) pickedFile.value = f
}
function onCompressDrop(e) {
  dragCompress.value = false
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (f) pickedFile.value = f
}
function clearPickedFile() {
  pickedFile.value = null
  if (compressFileInput.value) compressFileInput.value.value = ''
}

function triggerGzPick() {
  if (gzFileInput.value) gzFileInput.value.click()
}
function onGzFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (f) gzFile.value = f
}
function onGzDrop(e) {
  dragGz.value = false
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (f) gzFile.value = f
}
function clearGzFile() {
  gzFile.value = null
  if (gzFileInput.value) gzFileInput.value.value = ''
}

// ---------- 压缩 ----------
async function runCompressText() {
  errorMsg.value = ''
  compressResult.value = null
  if (!inputText.value) {
    errorMsg.value = '请先输入要压缩的文本'
    return
  }
  await runCompress(async () => {
    const original = utf8Encode(inputText.value)
    const compressed = await gzipCompress(original)
    return {
      originalSize: original.length,
      compressedSize: compressed.length,
      bytes: compressed,
      downloadName: 'text.gz'
    }
  })
}

async function runCompressFile() {
  errorMsg.value = ''
  compressResult.value = null
  if (!pickedFile.value) {
    errorMsg.value = '请先选择要压缩的文件'
    return
  }
  const f = pickedFile.value
  await runCompress(async () => {
    const original = new Uint8Array(await f.arrayBuffer())
    const compressed = await gzipCompress(original)
    return {
      originalSize: original.length,
      compressedSize: compressed.length,
      bytes: compressed,
      downloadName: f.name + '.gz'
    }
  })
}

async function runCompress(fn) {
  busy.value = true
  try {
    const r = await fn()
    compressResult.value = {
      originalSize: r.originalSize,
      compressedSize: r.compressedSize,
      ratio: compressionRatio(r.originalSize, r.compressedSize),
      bytes: r.bytes,
      downloadName: r.downloadName
    }
  } catch (e) {
    errorMsg.value = (e && e.message) || '压缩失败，请重试'
  } finally {
    busy.value = false
  }
}

// ---------- 解压 ----------
async function runDecompress() {
  errorMsg.value = ''
  decompressResult.value = null
  if (!gzFile.value) {
    errorMsg.value = '请先选择要解压的 .gz 文件'
    return
  }
  const f = gzFile.value
  busy.value = true
  try {
    const gzBytes = new Uint8Array(await f.arrayBuffer())
    if (!isGzipMagic(gzBytes)) {
      errorMsg.value = '这不是有效的 gzip 文件（缺少 1F 8B 魔数头），请确认文件格式'
      return
    }
    const raw = await gzipDecompress(gzBytes)
    const text = utf8DecodeStrict(raw)
    decompressResult.value = {
      bytes: raw,
      downloadName: deriveOriginalName(f.name),
      isText: text !== null,
      text: text === null ? '' : text,
      hexHead: bytesToHex(raw, 32) + (raw.length > 32 ? ' …' : '')
    }
  } catch (e) {
    errorMsg.value = (e && e.message) || '解压失败，文件可能已损坏'
  } finally {
    busy.value = false
  }
}

// ---------- 下载 / 复制 ----------
function downloadBytes(bytes, name) {
  const blob = new Blob([bytes])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

let copyTimer = null
async function copyText(text, key) {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

function toggleSeoContent() {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
