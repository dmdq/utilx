<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileImage class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">SVG转PNG</h1>
          <p class="text-sm text-muted-foreground mt-1">上传或粘贴 SVG 高清导出 PNG，1x-4x 倍率与自定义宽度，纯本地渲染不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 SVG 转 PNG 工具：支持拖拽上传 .svg 文件或直接粘贴 SVG 源码两种方式。渲染前自动净化源码（移除 script 脚本与所有 on* 事件属性），
        按 width/height 或 viewBox 推导画布尺寸，提供 1x/2x/3x/4x 倍率导出与自定义宽度（px），透明背景为默认、可切换白底；
        勾选多个尺寸可打包成 ZIP 一次下载。所有渲染均在浏览器本地完成，数据不上传服务器。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">纯本地计算</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">源码自动净化</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">2x/3x/4x 高清倍率</span>
        <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">批量 ZIP 打包</span>
      </div>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>尺寸推导规则：优先使用根元素 width/height 属性，缺失时回退到 viewBox（支持逗号分隔写法）；两者都没有时无法导出，请补充尺寸信息。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左栏：输入与设置 -->
      <div class="space-y-6">
        <!-- 第一步：输入 SVG -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Upload class="w-5 h-5 mr-2 text-primary" /> 第一步 · 输入 SVG
            </h2>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="switchSource('file')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                :class="sourceMode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              >上传文件</button>
              <button
                @click="switchSource('paste')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                :class="sourceMode === 'paste' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              >粘贴源码</button>
            </div>
          </div>

          <!-- 文件上传 -->
          <div v-if="sourceMode === 'file'">
            <div
              class="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              @drop="handleDrop"
              @dragover.prevent
              @dragleave.prevent
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".svg,image/svg+xml"
                class="hidden"
                @change="handleFileSelect"
              />
              <FileImage class="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p class="text-sm font-medium mb-1">拖拽 .svg 文件到这里，或点击选择</p>
              <p class="text-xs text-muted-foreground">文件只在本机浏览器内解析，不会上传</p>
            </div>
            <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs">
              <FileImage class="w-4 h-4 text-primary flex-shrink-0" />
              <span class="font-medium text-foreground truncate">{{ fileName }}</span>
              <span class="text-muted-foreground flex-shrink-0">{{ formatBytes(fileSize) }}</span>
              <button @click="clearAll" class="ml-auto text-muted-foreground hover:text-red-500 transition" aria-label="移除文件">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 粘贴源码 -->
          <div v-else>
            <textarea
              v-model="rawSvg"
              rows="8"
              placeholder="粘贴完整的 SVG 源码，例如：&#10;<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 24 24&quot;>...</svg>"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            ></textarea>
            <div class="flex items-center justify-between mt-1">
              <p class="text-xs text-muted-foreground">{{ rawCharCount > 0 ? `已输入 ${rawCharCount} 个字符` : '支持含 XML 声明的完整 SVG 文档' }}</p>
              <button v-if="rawSvg" @click="clearAll" class="text-xs text-muted-foreground hover:text-red-500 transition flex items-center gap-1">
                <Trash2 class="w-3 h-3" /> 清空
              </button>
            </div>
          </div>

          <!-- 解析结果 -->
          <div v-if="parseError" class="flex items-start gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg p-3">
            <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ parseError }}</span>
          </div>
          <div v-else-if="sizeInfo" class="bg-muted/50 rounded-lg px-3 py-2.5 text-xs space-y-1">
            <p class="text-muted-foreground">
              画布尺寸：<span class="text-foreground font-medium font-mono">{{ sizeInfo.width }} × {{ sizeInfo.height }} px</span>
              <span class="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary">来自 {{ sizeInfo.source === 'width-height' ? 'width/height 属性' : 'viewBox' }}</span>
            </p>
            <p class="text-muted-foreground">源码已净化：<span class="text-foreground">移除 script 脚本与 on* 事件属性</span></p>
          </div>
        </div>

        <!-- 第二步：导出设置 -->
        <div v-if="sizeInfo" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings class="w-5 h-5 mr-2 text-primary" /> 第二步 · 导出设置
          </h2>

          <!-- 背景 -->
          <div>
            <label class="text-sm font-medium">导出背景</label>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button
                @click="bgWhite = false"
                class="py-2 rounded-lg text-xs font-medium transition"
                :class="!bgWhite ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              >透明背景（默认）</button>
              <button
                @click="bgWhite = true"
                class="py-2 rounded-lg text-xs font-medium transition"
                :class="bgWhite ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              >白底</button>
            </div>
          </div>

          <!-- 尺寸勾选 -->
          <div>
            <label class="text-sm font-medium">导出尺寸（可勾选多个批量打包）</label>
            <div class="mt-2 space-y-1.5">
              <label
                v-for="opt in scaleOptions"
                :key="opt.value"
                class="flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition"
                :class="selectedScales.includes(opt.value) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'"
              >
                <input v-model="selectedScales" type="checkbox" :value="opt.value" class="rounded accent-primary" />
                <span class="text-sm font-medium w-8">{{ opt.value }}</span>
                <span class="text-xs text-muted-foreground font-mono ml-auto">{{ optDims(opt).width }} × {{ optDims(opt).height }} px</span>
              </label>
              <label
                class="flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition"
                :class="customEnabled ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'"
              >
                <input v-model="customEnabled" type="checkbox" class="rounded accent-primary" />
                <span class="text-sm font-medium flex-shrink-0">自定义宽度</span>
                <div class="relative w-24" @click.stop>
                  <input
                    v-model.number="customWidth"
                    type="number"
                    min="1"
                    class="w-full px-2 py-1 pr-7 border border-border rounded-md bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                </div>
                <span class="text-xs text-muted-foreground font-mono ml-auto">
                  {{ customDims.width > 0 ? `${customDims.width} × ${customDims.height} px` : '—' }}
                </span>
              </label>
            </div>
          </div>

          <!-- canvas 上限风险提示 -->
          <div v-if="hasOversize" class="flex items-start gap-2 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg p-3">
            <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>勾选的尺寸中有单边超过 8192px（{{ oversizeText }}），超出多数浏览器 canvas 安全上限，导出可能失败或被降级，建议降低倍率。</span>
          </div>

          <!-- 导出按钮 -->
          <div class="flex gap-3">
            <button
              @click="exportSelected"
              :disabled="exportRows.length === 0 || isExporting || !sizeInfo"
              class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              <Loader2 v-if="isExporting" class="w-4 h-4 inline mr-1.5 -mt-0.5 animate-spin" />
              <Download v-else class="w-4 h-4 inline mr-1.5 -mt-0.5" />
              {{ isExporting ? '导出中...' : exportRows.length > 1 ? `打包下载 ZIP（${exportRows.length} 个尺寸）` : exportRows.length === 1 ? `下载 PNG（${exportRows[0].label}）` : '请勾选导出尺寸' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右栏：预览 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ImageIcon class="w-5 h-5 mr-2 text-primary" /> 预览
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- 源图预览 -->
            <div>
              <h3 class="text-sm font-medium mb-2 text-muted-foreground">SVG 源图</h3>
              <div v-if="previewUrl" class="border border-border rounded-lg overflow-hidden bg-checkered flex items-center justify-center min-h-48 p-3">
                <img :src="previewUrl" alt="SVG 源图预览" class="max-w-full max-h-56 block" />
              </div>
              <div v-else class="border border-dashed border-border rounded-lg min-h-48 flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
                输入 SVG 后显示源图预览
              </div>
            </div>

            <!-- 导出结果预览 -->
            <div>
              <h3 class="text-sm font-medium mb-2 text-muted-foreground">PNG 导出结果</h3>
              <div v-if="resultUrl" class="border border-border rounded-lg overflow-hidden bg-checkered flex items-center justify-center min-h-48 p-3">
                <img :src="resultUrl" alt="PNG 导出结果预览" class="max-w-full max-h-56 block" />
              </div>
              <div v-else class="border border-dashed border-border rounded-lg min-h-48 flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
                导出后显示 PNG 预览
              </div>
              <p v-if="lastExport" class="mt-2 text-xs text-muted-foreground">
                {{ lastExport }}
              </p>
            </div>
          </div>

          <div v-if="sizeInfo" class="mt-4 bg-muted/50 rounded-lg px-3 py-2.5 text-xs text-muted-foreground">
            输出信息：<span class="text-foreground font-medium font-mono">{{ sizeInfo.width }} × {{ sizeInfo.height }} px 基准</span>
            <template v-if="exportRows.length"> · 待导出 {{ exportRows.length }} 个尺寸：{{ exportRows.map((r) => r.label).join(' / ') }}</template>
          </div>
        </div>

        <!-- 使用提示 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 导出小贴士
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 图标导出建议 2x/3x/4x 倍率，浏览器按矢量重新栅格化，边缘清晰不发虚</li>
            <li>• 透明背景适合叠加到其他素材上；白底适合贴到文档、PPT</li>
            <li>• 自定义宽度只给宽，高按 SVG 原始宽高比自动计算</li>
            <li>• 批量勾选多个尺寸会打包成一个 ZIP，文件名带尺寸标记</li>
            <li>• 若 SVG 引用了外部图片/字体，导出结果可能缺失该部分内容</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none flex items-center">
        <span class="text-primary mr-2">#</span> SVG 转 PNG 怎么导出才清晰？倍率、净化与常见问题
      </summary>

      <div class="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          SVG转PNG 是一款纯本地的矢量图光栅化工具。SVG 是矢量格式，理论上可以无损放大，但很多场景（App 图标、微信头图、论坛附件、老旧系统）
          只认 PNG 位图。本工具把 SVG 源码在浏览器内重新渲染到 canvas 再编码为 PNG：只要导出尺寸足够，边缘与曲线都按目标分辨率重新栅格化，清晰不糊。
          全程本地计算，SVG 源码与导出结果都不上传服务器。
        </p>

        <h3 class="text-lg font-semibold text-foreground">功能介绍</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">双输入方式</span>：拖拽/选择 .svg 文件，或直接粘贴 SVG 源码文本，所见即所得。</li>
          <li><span class="text-foreground font-medium">源码自动净化</span>：渲染前移除 script 脚本标签与所有 on* 事件属性，禁用 javascript: 伪协议链接，避免恶意代码执行。</li>
          <li><span class="text-foreground font-medium">智能尺寸推导</span>：优先取根元素 width/height，缺失时回退 viewBox（兼容逗号分隔、小数、负 min-x 等写法）。</li>
          <li><span class="text-foreground font-medium">倍率与自定义导出</span>：1x/2x/3x/4x 一键勾选，或输入自定义宽度（px），高度按原始比例自动计算。</li>
          <li><span class="text-foreground font-medium">透明/白底切换</span>：默认导出带 alpha 通道的透明背景 PNG，可一键切换白底。</li>
          <li><span class="text-foreground font-medium">批量打包下载</span>：勾选多个尺寸用 JSZip 打包成一个 ZIP，一次下载全部。</li>
          <li><span class="text-foreground font-medium">超大尺寸风险提示</span>：单边超过 8192px 时提前告警，避免浏览器 canvas 静默失败。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">使用场景</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>设计师交付 SVG 图标后，开发需要 2x/3x 多倍率 PNG 用于 App 资源目录（iOS @2x/@3x、Android mipmap）。</li>
          <li>把 logo/插图导出为指定宽度的 PNG，用于公众号封面、邮件签名等只收位图的平台。</li>
          <li>处理来自 Iconfont、Figma 导出的 SVG，快速生成 favicon、头像、水印底图。</li>
          <li>给不认识 SVG 的老系统、打印机、文档模板准备白底位图。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground pt-2">常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h4 class="text-base font-semibold text-foreground">为什么导出的 PNG 会模糊？</h4>
            <p class="mt-1">
              多数情况是按 1x 导出后又被二次放大。SVG 是矢量，导出时选 2x/3x/4x 或直接填目标宽度，浏览器会按目标分辨率重新栅格化，
              边缘清晰。已经导出的 PNG 放大无法复原细节，请回到本工具用更高倍率重新导出。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">SVG 里的脚本和事件会被保留吗？</h4>
            <p class="mt-1">
              不会。渲染前会自动净化：移除所有 script 标签、移除所有 on* 事件属性（onclick、onload、onerror 等）、禁用 javascript: 伪协议链接。
              净化只影响安全性，不会改动图形元素本身。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">没有 width/height 的 SVG 能导出吗？</h4>
            <p class="mt-1">
              可以，只要有 viewBox。工具会用 viewBox 的宽高作为画布基准（viewBox 支持空格或逗号分隔）。如果两者都没有，
              尺寸无法推导，会明确报错提示，请补充根元素尺寸信息后重试。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">导出尺寸有上限吗？</h4>
            <p class="mt-1">
              浏览器 canvas 单边普遍安全上限约 8192px（部分浏览器更宽，但内存消耗急剧上升）。勾选的尺寸单边超过 8192px 时会出现风险提示，
              建议降低倍率；超大图建议分块或改用桌面工具。
            </p>
          </div>
          <div>
            <h4 class="text-base font-semibold text-foreground">SVG 里引用的外部图片会导出吗？</h4>
            <p class="mt-1">
              取决于浏览器同源与跨域策略，外链图片、外链字体经常无法在 canvas 中渲染，导出结果会缺失该部分。建议先用 Figma/Illustrator
              把资源内联（转成 data URI 或路径化）再导出。
            </p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'svg-to-png'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  FileImage, Upload, Download, Info, AlertTriangle, Trash2, Settings, Loader2,
  Image as ImageIcon
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { tools } from '~/data/tools'
import RelatedTools from '~/components/RelatedTools.vue'

const tool = tools.find((t) => t.id === 'svg-to-png')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- SEO ----------
useSeoMeta({
  title: 'SVG转PNG - 在线SVG高清导出PNG工具（多倍率批量）',
  description: '免费在线SVG转PNG工具：上传.svg文件或粘贴源码，自动净化脚本，按width/height或viewBox推导尺寸，1x/2x/3x/4x倍率与自定义宽度导出，透明/白底可选，多尺寸批量打包ZIP下载，纯本地渲染不上传',
  keywords: 'svg转png, svg导出图片, svg高清导出, 矢量图转png, svg转jpg, 图标导出',
  author: '有条工具',
  ogTitle: 'SVG转PNG - 在线SVG高清导出PNG工具 | 有条工具',
  ogDescription: '上传或粘贴 SVG，2x/3x/4x 倍率高清导出 PNG，批量打包下载，纯本地渲染不上传。',
  ogUrl: 'https://www.util.cn/tools/svg-to-png',
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
          name: 'SVG转PNG',
          url: 'https://www.util.cn/tools/svg-to-png',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['上传文件或粘贴源码双输入', '渲染前净化 script 与 on* 事件属性', 'width/height 与 viewBox 智能尺寸推导', '1x-4x 倍率与自定义宽度导出', '透明/白底背景切换', '多尺寸 JSZip 批量打包下载', '纯本地渲染不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image' },
            { '@type': 'ListItem', position: 3, name: 'SVG转PNG', item: 'https://www.util.cn/tools/svg-to-png' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么导出的 PNG 会模糊？',
              acceptedAnswer: { '@type': 'Answer', text: '多数是按 1x 导出后被二次放大。导出时选 2x/3x/4x 或直接填目标宽度，浏览器会按目标分辨率重新栅格化 SVG 矢量，边缘清晰。已导出的 PNG 放大无法复原细节，需回工具重新导出。' }
            },
            {
              '@type': 'Question',
              name: 'SVG 里的脚本和事件会被保留吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。渲染前自动净化：移除所有 script 标签、所有 on* 事件属性（onclick/onload/onerror 等）并禁用 javascript: 伪协议链接，净化不影响图形元素本身。' }
            },
            {
              '@type': 'Question',
              name: '没有 width/height 的 SVG 能导出吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，只要有 viewBox。工具用 viewBox 宽高作画布基准（兼容逗号分隔与负 min-x 写法）；两者都缺失时无法推导尺寸，会明确报错提示补充。' }
            },
            {
              '@type': 'Question',
              name: '导出尺寸有上限吗？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器 canvas 单边普遍安全上限约 8192px。勾选尺寸单边超过 8192px 时工具会提前提示风险，建议降低倍率，超大图建议分块或用桌面工具。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== [PURE-START] 纯逻辑（可独立提取单测） =====

// CSS 长度单位 → px（96dpi 口径）；% 与非法值返回 null
const CSS_UNIT_TO_PX = {
  '': 1,
  px: 1,
  pt: 96 / 72,
  pc: 16,
  in: 96,
  mm: 96 / 25.4,
  cm: 960 / 25.4,
  q: 96 / 101.6
}

function parseCssLength(raw) {
  if (raw === null || raw === undefined) return null
  const m = String(raw).trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-zA-Z%]*)$/)
  if (!m) return null
  const unit = m[2].toLowerCase()
  if (!(unit in CSS_UNIT_TO_PX)) return null
  const value = Number(m[1])
  if (!Number.isFinite(value) || value <= 0) return null
  return value * CSS_UNIT_TO_PX[unit]
}

// 提取 <svg ...> 根开标签文本；找不到返回 null
function extractSvgRootTag(svgText) {
  const m = /<svg\b[^>]*>/i.exec(String(svgText || ''))
  return m ? m[0] : null
}

// 读取根标签上的属性值（兼容双/单引号）；不存在返回 null
function readRootAttr(tag, name) {
  const re = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  const m = re.exec(tag)
  if (!m) return null
  return m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]
}

/**
 * 尺寸推导：有 width/height 用之；否则用 viewBox（逗号/空格分隔均可）；都无则报错
 * @returns {{ok:true,width:number,height:number,source:'width-height'|'viewBox'}|{ok:false,error:string}}
 */
function resolveSvgSize(svgText) {
  const tag = extractSvgRootTag(svgText)
  if (!tag) return { ok: false, error: '未找到 <svg> 根标签，请确认输入的是完整 SVG 源码' }

  const rawW = readRootAttr(tag, 'width')
  const rawH = readRootAttr(tag, 'height')
  const w = parseCssLength(rawW)
  const h = parseCssLength(rawH)
  if (w !== null && h !== null) {
    return { ok: true, width: w, height: h, source: 'width-height' }
  }

  const vbRaw = readRootAttr(tag, 'viewBox')
  if (vbRaw !== null) {
    const nums = String(vbRaw).trim().split(/[\s,]+/).filter(Boolean).map(Number)
    const valid = nums.length === 4 && nums.every((n) => Number.isFinite(n))
    if (!valid || nums[2] <= 0 || nums[3] <= 0) {
      return { ok: false, error: `viewBox 值无法解析："${vbRaw}"（应为 "min-x min-y width height" 四个数字）` }
    }
    return { ok: true, width: nums[2], height: nums[3], source: 'viewBox' }
  }

  if (rawW !== null || rawH !== null) {
    return { ok: false, error: 'width/height 只提供了其中一个或含相对单位（%），且没有 viewBox 可回退，无法确定尺寸' }
  }
  return { ok: false, error: 'SVG 根元素缺少 width/height 和 viewBox，无法确定导出尺寸' }
}

/**
 * 净化 SVG：移除 script 标签（含内容）、所有 on* 事件属性、javascript: 伪协议链接
 */
function sanitizeSvg(svgText) {
  let s = String(svgText || '')
  // 1. 成对 script 标签连内容一起移除
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
  // 2. 残余的自闭合 / 未闭合 script 标签
  s = s.replace(/<script\b[^>]*\/?>/gi, '')
  // 3. 所有 on* 事件属性（onclick/onload/onerror/...）
  s = s.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  // 4. 禁用 javascript: 伪协议链接
  s = s.replace(/\s(xlink:href|href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, ' $1="#"')
  return s.trim()
}

/**
 * 保证 SVG 可独立渲染：补 xmlns；若根元素缺 width/height 则注入（用于无属性仅有 viewBox 的源）
 */
function injectRootAttrs(svgText, width, height) {
  const s = String(svgText || '')
  const m = /<svg\b[^>]*>/i.exec(s)
  if (!m) return s
  let tag = m[0]
  if (!/\sxmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(tag)) {
    tag = tag.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  if (!/\swidth\s*=/i.test(tag)) {
    tag = tag.replace(/^<svg/i, `<svg width="${width}"`)
  }
  if (!/\sheight\s*=/i.test(tag)) {
    tag = tag.replace(/^<svg/i, `<svg height="${height}"`)
  }
  return s.slice(0, m.index) + tag + s.slice(m.index + m[0].length)
}

// 倍率 → 输出尺寸
function dimsForScale(baseW, baseH, scale) {
  const s = Number(scale)
  if (!Number.isFinite(s) || s <= 0) return { width: 0, height: 0 }
  return { width: Math.max(1, Math.round(baseW * s)), height: Math.max(1, Math.round(baseH * s)) }
}

// 目标宽度 → 输出尺寸（高按比例）
function dimsForTargetWidth(baseW, baseH, targetW) {
  const tw = Math.round(Number(targetW))
  if (!Number.isFinite(tw) || tw <= 0 || !Number.isFinite(baseW) || baseW <= 0) return { width: 0, height: 0 }
  return { width: tw, height: Math.max(1, Math.round((tw * baseH) / baseW)) }
}

// canvas 单边安全上限：超过提示风险
const CANVAS_SAFE_LIMIT = 8192
function hasCanvasRisk(dims) {
  return dims.width > CANVAS_SAFE_LIMIT || dims.height > CANVAS_SAFE_LIMIT
}

// 导出基础名：去掉 .svg 扩展名并清洗非法字符
function exportBaseName(baseName) {
  return String(baseName || 'svg').replace(/\.svg$/i, '').replace(/[\\/:*?"<>|]/g, '_') || 'svg'
}

// 导出文件名：base-2x.png / base-256w.png
function exportFileName(baseName, label) {
  return `${exportBaseName(baseName)}-${label}.png`
}

function formatBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return '0 B'
  if (n < 1024) return `${Math.round(n)} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}
// ===== [PURE-END] 纯逻辑（可独立提取单测） =====

// ---------- 页面状态 ----------
const sourceMode = ref('file')
const fileInput = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const rawSvg = ref('')
const svgText = ref('') // 净化后的源码
const parseError = ref('')
const sizeInfo = ref(null)
const previewUrl = ref('')
const bgWhite = ref(false)
const selectedScales = ref(['2x'])
const customEnabled = ref(false)
const customWidth = ref(128)
const isExporting = ref(false)
const resultUrl = ref(null)
const lastExport = ref('')
let pasteTimer = null
let lastResultObjectUrl = null

const scaleOptions = [
  { value: '1x', scale: 1 },
  { value: '2x', scale: 2 },
  { value: '3x', scale: 3 },
  { value: '4x', scale: 4 }
]

// ---------- 派生 ----------
const rawCharCount = computed(() => rawSvg.value.length)

function optDims(opt) {
  if (!sizeInfo.value) return { width: 0, height: 0 }
  return dimsForScale(sizeInfo.value.width, sizeInfo.value.height, opt.scale)
}

const customDims = computed(() => {
  if (!sizeInfo.value) return { width: 0, height: 0 }
  return dimsForTargetWidth(sizeInfo.value.width, sizeInfo.value.height, customWidth.value)
})

// 勾选的导出行（含校验：自定义宽度需有效）
const exportRows = computed(() => {
  if (!sizeInfo.value) return []
  const rows = []
  for (const opt of scaleOptions) {
    if (selectedScales.value.includes(opt.value)) {
      const dims = optDims(opt)
      rows.push({ label: opt.value, ...dims })
    }
  }
  if (customEnabled.value && customDims.value.width > 0) {
    rows.push({ label: `${customDims.value.width}w`, ...customDims.value })
  }
  return rows.filter((r) => r.width > 0 && r.height > 0)
})

const oversizeRows = computed(() => exportRows.value.filter((r) => hasCanvasRisk(r)))
const hasOversize = computed(() => oversizeRows.value.length > 0)
const oversizeText = computed(() =>
  oversizeRows.value.map((r) => `${r.label} ${r.width}×${r.height}`).join('、')
)

// ---------- 输入处理 ----------
function switchSource(mode) {
  if (sourceMode.value === mode) return
  clearAll()
  sourceMode.value = mode
}

function triggerFileInput() {
  fileInput.value && fileInput.value.click()
}

function handleFileSelect(e) {
  const file = e.target.files && e.target.files[0]
  if (file) loadSvgFile(file)
  e.target.value = ''
}

function handleDrop(e) {
  e.preventDefault()
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) loadSvgFile(file)
}

async function loadSvgFile(file) {
  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)
  if (!isSvg) {
    parseError.value = '请选择 .svg 文件（仅支持 SVG 源文件）'
    return
  }
  try {
    const text = await file.text()
    fileName.value = file.name
    fileSize.value = file.size
    ingestSvg(text)
  } catch (err) {
    parseError.value = '读取文件失败：' + (err && err.message ? err.message : '未知错误')
  }
}

// 文件/粘贴统一入口：净化 → 尺寸推导 → 预览
function ingestSvg(text) {
  parseError.value = ''
  sizeInfo.value = null
  previewUrl.value = ''
  const clean = sanitizeSvg(text)
  if (!clean) {
    parseError.value = 'SVG 内容为空或净化后无有效内容'
    svgText.value = ''
    return
  }
  const size = resolveSvgSize(clean)
  if (!size.ok) {
    parseError.value = size.error
    svgText.value = clean
    return
  }
  svgText.value = clean
  sizeInfo.value = size
  previewUrl.value = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clean)}`
}

// 粘贴模式：输入防抖后解析
watch(rawSvg, (val) => {
  if (sourceMode.value !== 'paste') return
  if (pasteTimer) clearTimeout(pasteTimer)
  pasteTimer = setTimeout(() => {
    if (!val || !val.trim()) {
      parseError.value = ''
      sizeInfo.value = null
      previewUrl.value = ''
      svgText.value = ''
      return
    }
    ingestSvg(val)
  }, 300)
})

function clearAll() {
  if (pasteTimer) clearTimeout(pasteTimer)
  fileName.value = ''
  fileSize.value = 0
  rawSvg.value = ''
  svgText.value = ''
  parseError.value = ''
  sizeInfo.value = null
  previewUrl.value = ''
  clearResult()
}

function clearResult() {
  if (lastResultObjectUrl) {
    URL.revokeObjectURL(lastResultObjectUrl)
    lastResultObjectUrl = null
  }
  resultUrl.value = null
  lastExport.value = ''
}

// ---------- 渲染与导出（全部在用户回调内，SSR 不执行） ----------
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('SVG 渲染失败，请检查源码是否合法'))
    img.src = url
  })
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob 失败（尺寸可能超出浏览器限制）'))
    }, 'image/png')
  })
}

// 按 SVG 矢量在目标尺寸重新栅格化 → PNG Blob
async function renderPngBlob(row) {
  // 注入显式 width/height，保证浏览器按目标尺寸精确栅格化（2x/3x 边缘清晰的关键）
  const finalSvg = injectRootAttrs(svgText.value, row.width, row.height)
  const svgBlob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  try {
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = row.width
    canvas.height = row.height
    const ctx = canvas.getContext('2d')
    if (bgWhite.value) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, row.width, row.height)
    }
    ctx.drawImage(img, 0, 0, row.width, row.height)
    return await canvasToBlob(canvas)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function exportSelected() {
  const rows = exportRows.value
  if (!rows.length || !sizeInfo.value) return
  isExporting.value = true
  try {
    const results = []
    for (const row of rows) {
      const blob = await renderPngBlob(row)
      results.push({ row, blob })
    }
    const baseName = fileName.value || 'svg'
    if (results.length === 1) {
      const { row, blob } = results[0]
      const name = exportFileName(baseName, row.label)
      downloadBlob(blob, name)
      showResult(blob, `已导出 ${name}（${row.width} × ${row.height} px，${formatBytes(blob.size)}）`)
    } else {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (const { row, blob } of results) {
        zip.file(exportFileName(baseName, row.label), blob)
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipName = `${exportBaseName(baseName)}-batch.zip`
      downloadBlob(zipBlob, zipName)
      showResult(
        results[0].blob,
        `已打包 ${results.length} 个尺寸：${results.map((r) => `${r.row.label}(${r.row.width}×${r.row.height})`).join('、')}`
      )
    }
  } catch (err) {
    alert('导出失败：' + (err && err.message ? err.message : '未知错误'))
  } finally {
    isExporting.value = false
  }
}

function showResult(blob, message) {
  clearResult()
  lastResultObjectUrl = URL.createObjectURL(blob)
  resultUrl.value = lastResultObjectUrl
  lastExport.value = message
}

onUnmounted(() => {
  if (pasteTimer) clearTimeout(pasteTimer)
  if (lastResultObjectUrl) URL.revokeObjectURL(lastResultObjectUrl)
})
</script>

<style scoped>
.bg-checkered {
  background-image:
    linear-gradient(45deg, rgba(128, 128, 128, 0.15) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(128, 128, 128, 0.15) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(128, 128, 128, 0.15) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(128, 128, 128, 0.15) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}
</style>
