<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Crop class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">图片白边裁切</h1>
          <p class="text-sm text-muted-foreground mt-1">自动检测并裁掉图片四周的白边 / 纯色边 / 透明边，容差可调，支持批量，纯本地处理</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        截图、扫描件四周常有一圈多余的空白边框。本工具在四角取样确定背景参考色，从四边向内逐行扫描出可裁区域，
        容差滑杆实时适配带噪点、渐变或压缩伪影的边缘；带透明通道的图片自动切换为「透明边」检测模式。
        所有像素计算在浏览器 Canvas 内完成，文件不会上传到任何服务器。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">纯本地处理</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">数据不上传</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">批量裁切</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">容差实时可调</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">白边 / 透明边</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：上传 + 设置 + 批量列表 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ImageUp class="w-5 h-5 mr-2 text-primary" /> 选择图片（可多选批量）
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleFileChange"
            />
            <Upload v-if="items.length === 0" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p class="text-sm text-muted-foreground">点击选择或拖入图片（单张或多张），支持 PNG / JPEG / WebP 等浏览器可解码格式</p>
          </div>

          <!-- 批量列表 -->
          <div v-if="items.length > 0" class="mt-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-foreground">{{ items.length }} 张图片（点击行可切换预览）</span>
              <button
                @click="clearAll"
                class="text-xs text-destructive hover:bg-destructive/5 px-2 py-1 rounded-md transition-colors"
              >
                清空全部
              </button>
            </div>
            <div class="max-h-64 overflow-y-auto space-y-2">
              <div
                v-for="item in items"
                :key="item.id"
                class="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border"
                :class="item.id === activeId ? 'bg-primary/5 border-primary/40' : 'bg-muted/50 border-transparent hover:bg-muted'"
                @click="activeId = item.id"
              >
                <img :src="item.previewUrl" :alt="item.name" class="w-10 h-10 object-cover rounded bg-checkered flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground truncate">{{ item.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ item.width }} × {{ item.height }}
                    <template v-if="item.croppedW"> → {{ item.croppedW }} × {{ item.croppedH }}</template>
                  </p>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0" :class="statusCls(item.status)">{{ item.status }}</span>
                <button
                  class="text-muted-foreground hover:text-destructive p-1 flex-shrink-0"
                  aria-label="移除该图片"
                  @click.stop="removeItem(item.id)"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 裁切设置 -->
        <div v-if="items.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> 裁切设置
          </h2>

          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground" for="tolerance-range">容差（对背景噪声的容忍度）</label>
            <span class="text-sm font-mono text-primary">{{ tolerance }}</span>
          </div>
          <input
            id="tolerance-range"
            v-model.number="tolerance"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full accent-primary"
          />
          <div class="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0 · 严格（逐像素一致）</span>
            <span>100 · 宽松</span>
          </div>
          <p class="text-xs text-muted-foreground mt-3">
            调整后自动实时重算全部图片的裁切框（200ms 防抖）。JPEG 截图建议 8-20，带渐变噪点的扫描件可适当调大；过大可能把浅色内容误判为背景。
          </p>

          <div v-if="activeItem" class="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
            <p>
              检测模式：
              <span class="text-foreground font-medium">{{ activeItem.transparentMode ? '透明边（按 alpha 通道判定）' : '纯色边（按四角背景参考色判定）' }}</span>
            </p>
            <p>当前容差 {{ tolerance }} 对应每通道允许差值 ≤ {{ toleranceBytes }} / 255。</p>
          </div>
        </div>

        <!-- 隐私说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Lock class="w-4 h-4 mr-2 text-primary" /> 隐私保障
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 图片在浏览器内通过 Canvas 解码与裁切，不经过网络</li>
            <li>• 批量打包（ZIP）同样在本机内存中完成</li>
            <li>• 关闭页面后不留任何数据</li>
          </ul>
        </div>
      </div>

      <!-- 右：前后对比预览 + 批量下载 -->
      <div class="space-y-6">
        <!-- 前后对比 -->
        <div v-if="activeItem" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ScanSearch class="w-5 h-5 mr-2 text-primary" /> 前后对比预览
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="text-sm font-medium text-foreground mb-2">原图（虚线框 = 裁切区域）</h3>
              <div class="border border-border rounded-lg overflow-auto bg-checkered p-2 max-h-96">
                <div class="relative inline-block max-w-full">
                  <img :src="activeItem.previewUrl" :alt="activeItem.name" class="block max-w-full h-auto" />
                  <div
                    v-if="cropBox"
                    class="absolute border-2 border-dashed border-primary pointer-events-none"
                    :style="cropBox"
                  ></div>
                </div>
              </div>
              <p class="mt-2 text-xs text-muted-foreground">裁切前：{{ activeItem.width }} × {{ activeItem.height }} px</p>
            </div>
            <div>
              <h3 class="text-sm font-medium text-foreground mb-2">裁切后</h3>
              <div class="border border-border rounded-lg overflow-auto bg-checkered p-2 max-h-96 flex items-center justify-center min-h-[120px]">
                <img v-if="activeItem.croppedUrl" :src="activeItem.croppedUrl" :alt="activeItem.name" class="block max-w-full h-auto" />
                <p v-else class="text-sm text-muted-foreground text-center px-4">{{ cropEmptyHint }}</p>
              </div>
              <p class="mt-2 text-xs text-muted-foreground">
                裁切后：{{ activeItem.croppedW ? activeItem.croppedW + ' × ' + activeItem.croppedH + ' px' : '—' }}
                <span v-if="areaSaved" class="ml-1 text-primary">（面积 -{{ areaSaved }}%）</span>
              </p>
            </div>
          </div>

          <button
            @click="downloadOne(activeItem)"
            :disabled="!activeItem.croppedBlob"
            class="w-full mt-5 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Download class="w-4 h-4" />
            下载当前图片（保持原格式 {{ outExtFor(activeItem).toUpperCase() }}）
          </button>
          <p v-if="activeItem && outMimeFor(activeItem) === 'image/png' && activeItem.file.type !== 'image/png'" class="text-xs text-muted-foreground mt-2">
            原图为 {{ activeItem.file.type || '未知格式' }}，浏览器 Canvas 无法原样重编码，已按 PNG 无损输出。
          </p>
          <p v-else-if="activeItem && outMimeFor(activeItem) === 'image/jpeg'" class="text-xs text-muted-foreground mt-2">
            JPEG 需经浏览器重编码（质量 92%），像素级无损仅 PNG 可保证。
          </p>
        </div>

        <!-- 空状态 -->
        <div v-else class="bg-card border border-border rounded-lg p-12">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crop class="w-8 h-8 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">为什么需要裁掉白边？</h3>
            <p class="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              截图工具、扫描仪、PPT 导出的图片常带一圈空白边：放进文档会显得松散，拼图时产生难看的缝隙。
              自动检测 + 容差控制比手动裁剪更快、更整齐。
            </p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
              <div class="bg-muted/50 rounded-lg p-3">
                <ScanSearch class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">四角取样抗噪</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <SlidersHorizontal class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">容差实时可调</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <Layers class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">批量一键打包</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量下载 -->
        <div v-if="doneCount > 0" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 class="text-lg font-semibold text-foreground flex items-center">
                <Package class="w-5 h-5 mr-2 text-primary" /> 批量下载
              </h2>
              <p class="text-xs text-muted-foreground mt-1">{{ doneCount }} 张已完成裁切，打包为 ZIP 一次性保存（保持原格式）</p>
            </div>
            <button
              @click="downloadAllZip"
              :disabled="zipping"
              class="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Loader2 v-if="zipping" class="w-4 h-4 animate-spin" />
              <Download v-else class="w-4 h-4" />
              {{ zipping ? '打包中...' : '下载全部 ZIP（' + doneCount + ' 张）' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-8">
      <summary class="text-lg font-semibold cursor-pointer select-none text-foreground flex items-center">
        <span class="text-primary mr-2">#</span>图片白边裁切是怎么工作的：四角取样、逐行扫描与容差
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <h3 class="text-lg font-semibold text-foreground">功能介绍</h3>
        <p>
          图片白边裁切（Auto Crop）用于自动去掉图片四周与背景一致的空白边框。算法分三步：
          第一步在图片四角各取 3×3 像素共 36 个样本，逐通道取中位数得到「背景参考色」——中位数比平均值稳健，
          即使角落混入少量噪点也不会带偏参考色；第二步从上、下、左、右四边分别向内逐行（逐列）扫描，
          一整行像素都与参考色足够接近才算背景边，遇到第一行「不像背景」的行立即停止；
          第三步把四条边围出的内框作为裁切区域。若四角样本中存在半透明像素（alpha &lt; 255），
          自动切换为「透明边」模式，按 alpha 通道判定背景，适配透明 PNG 素材。
        </p>
        <p>
          「容差」决定每通道允许的颜色偏差（0-100 映射到 0-255）：容差 0 表示逐像素完全一致，
          默认 10（约 ±26/255）足以容忍 JPEG 压缩噪点与轻微渐变；扫描件、老照片可以调大到 20-40。
          容差过大可能把浅色内容误判为背景裁掉，建议配合预览确认。
        </p>
        <h3 class="text-lg font-semibold text-foreground">典型使用场景</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>截图去白边：PPT / 网页截图四边的空白，放进文档、公众号排版前裁掉更紧凑</li>
          <li>扫描件整理：扫描仪留下的黑边、白边批量切除，统一版面</li>
          <li>透明 PNG 素材：裁掉四周的透明区域，让图标、贴纸内容顶满画布</li>
          <li>电商图片：批量去除商品图的统一留白，控制主图有效内容比例</li>
          <li>拼图前置处理：多张素材先去边再拼接，避免出现双重缝隙</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">什么样的边会被裁掉？</span>与四角背景一致（白边、纯色边、透明边）的边缘区域。内容直达边缘的图片会提示「未检测到可裁边框」，不会强行裁切。</li>
          <li><span class="text-foreground font-medium">整图同色会怎样？</span>当裁切区域为空（整图同色或全部透明）时返回空结果并提示「未检测到可裁边框」，不会输出 0 像素的图片。</li>
          <li><span class="text-foreground font-medium">会损失画质吗？</span>PNG 输出与原图像素一致（无损裁切）；JPEG 源文件需经浏览器重编码（质量 92%），有极轻微的二次压缩，介意可先转 PNG。</li>
          <li><span class="text-foreground font-medium">容差调多少合适？</span>无损 PNG 截图用 0-8；JPEG 建议默认 10；带渐变噪点的扫描件 20-40。调整后预览中的虚线框会实时更新。</li>
          <li><span class="text-foreground font-medium">图片会被上传吗？</span>不会。解码、检测、裁切、ZIP 打包全部在浏览器本地完成，关闭页面数据即消失。</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">延伸工具</h3>
        <p>
          需要手动控制裁剪区域可用 <a href="/tools/image-crop/" class="text-primary hover:underline">图片裁剪</a>；
          需要修改 DPI 打印信息可用 <a href="/tools/image-dpi/" class="text-primary hover:underline">图片DPI修改</a>；
          需要批量改尺寸可用 <a href="/tools/image-resize/" class="text-primary hover:underline">图片尺寸调整</a>。
        </p>
      </div>
    </details>

    <RelatedTools :current-tool-id="'image-autocrop'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Crop, ImageUp, Upload, FileCheck, Download, Loader2, X,
  SlidersHorizontal, ScanSearch, Package, Lock, Layers
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '图片白边裁切 - 在线自动裁掉图片白边/透明边工具',
  description: '免费在线图片白边裁切工具：四角取样自动检测白边、纯色边、透明边，容差实时可调抗噪点，前后对比预览，支持批量裁切并打包ZIP下载，纯本地处理不上传服务器',
  keywords: '图片去白边,自动裁剪,白边裁切,透明边裁切,批量裁剪图片,截图去白边,扫描件去边',
  author: '有条工具',
  ogTitle: '图片白边裁切 - 有条工具',
  ogDescription: '自动检测并裁掉图片四周白边/纯色边/透明边，容差可调，支持批量，纯本地处理。',
  ogUrl: 'https://www.util.cn/tools/image-autocrop',
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
          name: '图片白边裁切',
          url: 'https://www.util.cn/tools/image-autocrop',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['四角3x3取样中位数确定背景参考色', '四边逐行扫描检测可裁边框', '白边/纯色边/透明边自动识别', '容差0-100实时重算抗噪点', '前后对比预览虚线框标注', '批量裁切ZIP打包下载', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '图片白边裁切', item: 'https://www.util.cn/tools/image-autocrop/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '什么样的边会被自动裁掉？',
              acceptedAnswer: { '@type': 'Answer', text: '与四角背景一致的边缘区域：白边、纯色边、透明边均可。内容直达边缘的图片会提示未检测到可裁边框，不会强行裁切。' }
            },
            {
              '@type': 'Question',
              name: '容差调多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '无损PNG截图用0-8；JPEG建议默认10（容忍压缩噪点）；带渐变噪点的扫描件20-40。过大可能把浅色内容误判为背景。' }
            },
            {
              '@type': 'Question',
              name: '裁切会损失画质吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'PNG输出与原图像素一致（无损）；JPEG源文件需经浏览器重编码（质量92%），有极轻微二次压缩。' }
            },
            {
              '@type': 'Question',
              name: '整张图片都是同色会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '当裁切区域为空（整图同色或全部透明）时提示「未检测到可裁边框」，不会输出空图片。' }
            },
            {
              '@type': 'Question',
              name: '上传的图片会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解码、检测、裁切、ZIP打包全部在浏览器本地完成，数据不上传，关闭页面即消失。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'image-autocrop')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
// 容差 0-100 → 每通道允许的最大差值（0-255）
const toleranceToBytes = (tolerance) => Math.round(tolerance * 2.55)

// 中位数（偶数个取中间两数均值四舍五入）
const median = (arr) => {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

// 四角各 3x3 取样，逐通道取中位 → 背景参考色；任一角落样本 alpha<255 则按透明边模式判定
function sampleCornerRef(data, width, height) {
  const r = [], g = [], b = [], a = []
  const sample = (x, y) => {
    const i = (y * width + x) * 4
    r.push(data[i]); g.push(data[i + 1]); b.push(data[i + 2]); a.push(data[i + 3])
  }
  const x0s = [0, Math.max(0, width - 3)]
  const y0s = [0, Math.max(0, height - 3)]
  for (const y0 of y0s) {
    for (const x0 of x0s) {
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          sample(Math.min(x0 + dx, width - 1), Math.min(y0 + dy, height - 1))
        }
      }
    }
  }
  return {
    r: median(r),
    g: median(g),
    b: median(b),
    a: median(a),
    hasAlphaCorner: a.some(v => v < 255)
  }
}

// 整行是否都是「可裁边」：透明模式看 alpha，纯色模式与参考色逐通道比较
function rowIsEdge(data, width, y, ref, tolBytes, transparentMode) {
  const base = y * width * 4
  for (let x = 0; x < width; x++) {
    const i = base + x * 4
    if (transparentMode) {
      if (data[i + 3] > tolBytes) return false
    } else {
      if (Math.abs(data[i] - ref.r) > tolBytes) return false
      if (Math.abs(data[i + 1] - ref.g) > tolBytes) return false
      if (Math.abs(data[i + 2] - ref.b) > tolBytes) return false
      if (Math.abs(data[i + 3] - ref.a) > tolBytes) return false
    }
  }
  return true
}

// 整列是否都是「可裁边」（仅在已裁定的行区间 [y0,y1] 内检查）
function colIsEdge(data, width, x, y0, y1, ref, tolBytes, transparentMode) {
  for (let y = y0; y <= y1; y++) {
    const i = (y * width + x) * 4
    if (transparentMode) {
      if (data[i + 3] > tolBytes) return false
    } else {
      if (Math.abs(data[i] - ref.r) > tolBytes) return false
      if (Math.abs(data[i + 1] - ref.g) > tolBytes) return false
      if (Math.abs(data[i + 2] - ref.b) > tolBytes) return false
      if (Math.abs(data[i + 3] - ref.a) > tolBytes) return false
    }
  }
  return true
}

/**
 * 检测图片四周的可裁边框。
 * @param {Uint8ClampedArray|Array} data RGBA 像素数据（长度 = width*height*4）
 * @param {number} width  像素宽
 * @param {number} height 像素高
 * @param {number} tolerance 容差 0-100（默认 10）
 * @returns {{top:number, right:number, bottom:number, left:number}|null} 四边内缩像素数；整图同色 / 裁到空时返回 null
 */
function detectCropRect(data, width, height, tolerance = 10) {
  if (!width || !height || !data || data.length < width * height * 4) return null
  const tolBytes = toleranceToBytes(tolerance)
  const ref = sampleCornerRef(data, width, height)
  const transparentMode = ref.hasAlphaCorner

  let top = 0
  let bottom = height - 1
  while (top <= bottom && rowIsEdge(data, width, top, ref, tolBytes, transparentMode)) top++
  while (top <= bottom && rowIsEdge(data, width, bottom, ref, tolBytes, transparentMode)) bottom--
  if (top > bottom) return null

  let left = 0
  let right = width - 1
  while (left <= right && colIsEdge(data, width, left, top, bottom, ref, tolBytes, transparentMode)) left++
  while (left <= right && colIsEdge(data, width, right, top, bottom, ref, tolBytes, transparentMode)) right--
  if (left > right) return null

  return { top, right: width - 1 - right, bottom: height - 1 - bottom, left }
}

// 仅判定检测模式（透明边 or 纯色边），供 UI 展示，代价 O(1)
function detectEdgeMode(data, width, height) {
  if (!width || !height || !data || data.length < width * height * 4) return false
  return sampleCornerRef(data, width, height).hasAlphaCorner
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const items = ref([])
const activeId = ref(null)
const tolerance = ref(10)
const isDragging = ref(false)
const isProcessing = ref(false)
const zipping = ref(false)
const fileInput = ref(null)
let uid = 0
let pendingReprocess = false

const activeItem = computed(() => items.value.find(i => i.id === activeId.value) || null)
const toleranceBytes = computed(() => toleranceToBytes(tolerance.value))
const doneCount = computed(() => items.value.filter(i => i.croppedBlob).length)

// 虚线裁切框定位（百分比定位，随预览缩放自适应）；无有效裁切时返回 null
const cropBox = computed(() => {
  const it = activeItem.value
  if (!it || !it.rect) return null
  const w = it.width - it.rect.left - it.rect.right
  const h = it.height - it.rect.top - it.rect.bottom
  if (w <= 0 || h <= 0) return null
  return {
    left: (it.rect.left / it.width * 100) + '%',
    top: (it.rect.top / it.height * 100) + '%',
    width: (w / it.width * 100) + '%',
    height: (h / it.height * 100) + '%'
  }
})

const areaSaved = computed(() => {
  const it = activeItem.value
  if (!it || !it.croppedW || !it.width || !it.height) return null
  const before = it.width * it.height
  const after = it.croppedW * it.croppedH
  if (after >= before) return null
  return ((1 - after / before) * 100).toFixed(1)
})

const cropEmptyHint = computed(() => {
  const it = activeItem.value
  if (!it) return ''
  if (it.status === '处理中' || it.status === '排队') return '正在检测可裁边框...'
  return '未检测到可裁边框：四周没有与背景一致的纯色/透明边（内容直达边缘或整图同色），可尝试调大容差。'
})

// ---------- 工具函数（组件层） ----------
const outMimeFor = (item) => (item.file.type === 'image/png' || item.file.type === 'image/jpeg') ? item.file.type : 'image/png'
const outExtFor = (item) => outMimeFor(item) === 'image/png' ? 'png' : 'jpg'
const baseName = (name) => name.replace(/\.[^.]+$/, '') || 'image'

const statusCls = (status) => {
  switch (status) {
    case '完成': return 'bg-green-500/10 text-green-600 dark:text-green-400'
    case '处理中': return 'bg-primary/10 text-primary'
    case '处理失败': return 'bg-destructive/10 text-destructive'
    default: return 'bg-muted text-muted-foreground'
  }
}

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = () => reject(new Error('图片解码失败'))
  img.src = src
})

// ---------- 文件选择 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length) addFiles(files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length) addFiles(files)
}

const addFiles = async (fileList) => {
  const files = Array.from(fileList)
  const images = files.filter(f => f.type.startsWith('image/'))
  if (!images.length) {
    alert('请选择图片文件')
    return
  }
  for (const f of images) {
    const previewUrl = URL.createObjectURL(f)
    try {
      const img = await loadImage(previewUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      items.value.push({
        id: ++uid,
        name: f.name,
        file: f,
        previewUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        pixels: imageData.data,
        rect: null,
        transparentMode: false,
        croppedUrl: '',
        croppedW: 0,
        croppedH: 0,
        croppedBlob: null,
        status: '排队'
      })
      if (!activeId.value) activeId.value = uid
    } catch (err) {
      URL.revokeObjectURL(previewUrl)
      alert('无法读取图片：' + f.name)
    }
  }
  scheduleProcessAll()
}

const removeItem = (id) => {
  const idx = items.value.findIndex(i => i.id === id)
  if (idx === -1) return
  const it = items.value[idx]
  URL.revokeObjectURL(it.previewUrl)
  if (it.croppedUrl) URL.revokeObjectURL(it.croppedUrl)
  items.value.splice(idx, 1)
  if (activeId.value === id) activeId.value = items.value[0]?.id ?? null
}

const clearAll = () => {
  items.value.forEach(it => {
    URL.revokeObjectURL(it.previewUrl)
    if (it.croppedUrl) URL.revokeObjectURL(it.croppedUrl)
  })
  items.value = []
  activeId.value = null
}

// ---------- 裁切处理 ----------
const processItem = async (it) => {
  it.status = '处理中'
  it.rect = detectCropRect(it.pixels, it.width, it.height, tolerance.value)
  it.transparentMode = detectEdgeMode(it.pixels, it.width, it.height)
  if (it.croppedUrl) {
    URL.revokeObjectURL(it.croppedUrl)
    it.croppedUrl = ''
    it.croppedBlob = null
    it.croppedW = 0
    it.croppedH = 0
  }
  const r = it.rect
  const isEmpty = !r || r.left + r.right >= it.width || r.top + r.bottom >= it.height
  const isFull = r && r.left === 0 && r.right === 0 && r.top === 0 && r.bottom === 0
  if (isEmpty || isFull) {
    it.status = '无可裁边'
    return
  }
  try {
    const img = await loadImage(it.previewUrl)
    const w = it.width - r.left - r.right
    const h = it.height - r.top - r.bottom
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const mime = outMimeFor(it)
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(img, r.left, r.top, w, h, 0, 0, w, h)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('编码失败'))), mime, mime === 'image/jpeg' ? 0.92 : undefined)
    })
    it.croppedBlob = blob
    it.croppedUrl = URL.createObjectURL(blob)
    it.croppedW = w
    it.croppedH = h
    it.status = '完成'
  } catch (err) {
    it.status = '处理失败'
  }
}

const processAll = async () => {
  isProcessing.value = true
  for (const it of items.value) {
    await processItem(it)
  }
  isProcessing.value = false
}

const scheduleProcessAll = () => {
  if (isProcessing.value) {
    pendingReprocess = true
    return
  }
  processAll().then(() => {
    if (pendingReprocess) {
      pendingReprocess = false
      scheduleProcessAll()
    }
  })
}

// 容差变化 → 防抖后实时重算
let toleranceTimer = null
watch(tolerance, () => {
  if (!items.value.length) return
  if (toleranceTimer) clearTimeout(toleranceTimer)
  toleranceTimer = setTimeout(() => scheduleProcessAll(), 200)
})

// ---------- 下载 ----------
const downloadOne = (it) => {
  if (!it || !it.croppedBlob) return
  const url = URL.createObjectURL(it.croppedBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName(it.name)}-cropped.${outExtFor(it)}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadAllZip = async () => {
  const done = items.value.filter(i => i.croppedBlob)
  if (!done.length) return
  zipping.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const used = {}
    for (const it of done) {
      let name = `${baseName(it.name)}-cropped.${outExtFor(it)}`
      used[name] = (used[name] || 0) + 1
      if (used[name] > 1) name = `${baseName(it.name)}-cropped-${used[name]}.${outExtFor(it)}`
      zip.file(name, it.croppedBlob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autocrop_${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    alert('打包失败：' + (err.message || '未知错误'))
  } finally {
    zipping.value = false
  }
}

onUnmounted(() => {
  if (toleranceTimer) clearTimeout(toleranceTimer)
  items.value.forEach(it => {
    URL.revokeObjectURL(it.previewUrl)
    if (it.croppedUrl) URL.revokeObjectURL(it.croppedUrl)
  })
})
</script>

<style scoped>
.bg-checkered {
  background-image:
    linear-gradient(45deg, #e8e8e8 25%, transparent 25%),
    linear-gradient(-45deg, #e8e8e8 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e8e8e8 75%),
    linear-gradient(-45deg, transparent 75%, #e8e8e8 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}
</style>
