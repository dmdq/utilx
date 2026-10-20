<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Monitor class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">壁纸多机型适配</h1>
          <p class="text-sm text-muted-foreground mt-1">一张图批量裁成 iPhone / 安卓 / iPad / 桌面 / 微信的全套壁纸</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传一张高清原图，勾选需要适配的设备分辨率，选择 cover 智能裁切、contain 模糊补边或拉伸三种处理方式，即可逐张下载或一次性导出全部壁纸。文件名自动带上目标分辨率，方便区分。全程浏览器本地 Canvas 合成，原图不上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：上传 + 机型 + 处理 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ImageIcon class="w-5 h-5 mr-2 text-primary" /> 上传原图
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
            <Upload v-if="!hasImage" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p v-if="!hasImage" class="text-sm text-muted-foreground">点击或拖入高清图（建议长边 ≥ 2000px）</p>
            <template v-else>
              <p class="text-sm font-medium text-foreground truncate">{{ fileName }}</p>
              <p class="text-xs text-muted-foreground mt-1">原图 {{ imgW }}×{{ imgH }} · {{ sourceRatioText }}</p>
            </template>
          </div>
        </div>

        <!-- 设备清单 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Smartphone class="w-5 h-5 mr-2 text-primary" /> 设备清单
            </h2>
            <div class="flex gap-2 text-xs">
              <button @click="selectAll" class="text-muted-foreground hover:text-primary">全选</button>
              <span class="text-border">|</span>
              <button @click="clearAll" class="text-muted-foreground hover:text-primary">清空</button>
            </div>
          </div>
          <div class="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            <div v-for="grp in groupedTargets" :key="grp.name">
              <p class="text-xs font-medium text-muted-foreground mb-2">{{ grp.name }}</p>
              <div class="space-y-1.5">
                <label
                  v-for="t in grp.items"
                  :key="t.id"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  :class="selectedIds.includes(t.id) ? 'bg-primary/10' : 'hover:bg-muted/60'"
                >
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(t.id)"
                    @change="toggleTarget(t.id)"
                    class="w-4 h-4 rounded accent-primary"
                  />
                  <span class="flex-1 text-sm text-foreground">{{ t.label }}</span>
                  <span class="text-xs text-muted-foreground font-mono">{{ t.w }}×{{ t.h }}</span>
                </label>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3">已选 <span class="text-primary font-medium">{{ selectedTargets.length }}</span> 档</p>
        </div>

        <!-- 处理方式 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> 处理方式
          </h2>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="m in fitModes"
              :key="m.value"
              @click="setFitMode(m.value)"
              :class="fitMode === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >
              {{ m.label }}
            </button>
          </div>

          <!-- cover 焦点 -->
          <div v-if="fitMode === 'cover'" class="space-y-3">
            <div>
              <div class="flex items-center justify-between text-sm">
                <label class="font-medium text-foreground">水平焦点</label>
                <span class="text-muted-foreground">{{ Math.round(focusX * 100) }}%</span>
              </div>
              <input v-model.number="focusX" @input="renderPreview" type="range" min="0" max="1" step="0.02" class="w-full accent-primary" />
            </div>
            <div>
              <div class="flex items-center justify-between text-sm">
                <label class="font-medium text-foreground">垂直焦点</label>
                <span class="text-muted-foreground">{{ Math.round(focusY * 100) }}%</span>
              </div>
              <input v-model.number="focusY" @input="renderPreview" type="range" min="0" max="1" step="0.02" class="w-full accent-primary" />
            </div>
            <p class="text-xs text-muted-foreground">滑到边缘可保留人物或主体所在一侧，其余居中裁切。</p>
          </div>

          <!-- contain 模糊 -->
          <div v-if="fitMode === 'contain'" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <label class="font-medium text-foreground">背景模糊强度</label>
              <span class="text-muted-foreground">{{ blurAmount }}</span>
            </div>
            <input v-model.number="blurAmount" @input="renderPreview" type="range" min="4" max="48" step="1" class="w-full accent-primary" />
            <p class="text-xs text-muted-foreground">背景为同图放大后高斯模糊，前景完整保留，比例不合时不裁切主体。</p>
          </div>

          <p v-if="fitMode === 'stretch'" class="text-xs text-muted-foreground">拉伸会改变画面比例，仅在源图与目标比例接近时使用。</p>

          <!-- 输出格式 -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">输出格式</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button @click="setOutput('png')" :class="outputFormat === 'png' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'" class="py-2 rounded-lg text-xs font-medium transition-all">PNG</button>
                <button @click="setOutput('jpeg')" :class="outputFormat === 'jpeg' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'" class="py-2 rounded-lg text-xs font-medium transition-all">JPG</button>
              </div>
            </div>
            <div v-if="outputFormat === 'jpeg'">
              <label class="block text-sm font-medium text-foreground mb-1.5">质量</label>
              <input v-model.number="quality" type="range" min="0.5" max="1" step="0.05" class="w-full accent-primary" />
              <p class="text-xs text-muted-foreground mt-1">{{ Math.round(quality * 100) }}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览与导出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 效果预览
            </h2>
            <span class="text-xs text-muted-foreground">{{ previewHint }}</span>
          </div>

          <!-- 目标切换（已选机型） -->
          <div v-if="selectedTargets.length > 0" class="flex flex-wrap gap-1.5 mb-4">
            <button
              v-for="t in selectedTargets"
              :key="t.id"
              @click="setActive(t.id)"
              :class="activeId === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            >
              {{ t.w }}×{{ t.h }}
            </button>
          </div>

          <div class="flex items-center justify-center bg-muted/40 rounded-lg min-h-[300px] max-h-[560px] overflow-hidden">
            <canvas v-show="hasImage && activeTarget" ref="previewCanvas" class="max-h-[520px] rounded-md shadow-md" />
            <div v-if="!hasImage || !activeTarget" class="text-center text-muted-foreground py-10">
              <ImageIcon class="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p class="text-sm">{{ !hasImage ? '上传原图并勾选设备后预览' : '请至少勾选一台设备' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-4">
            <button
              @click="downloadActive"
              :disabled="!canExport"
              class="px-4 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Download class="w-4 h-4" /> 下载当前
            </button>
            <button
              @click="downloadAll"
              :disabled="!canExport || processing"
              class="px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
              <Layers v-else class="w-4 h-4" />
              {{ processing ? `导出中 ${progress}/${selectedTargets.length}` : `批量导出 (${selectedTargets.length} 张)` }}
            </button>
          </div>

          <div v-if="downloadedCount > 0 && !processing" class="mt-3 text-xs text-muted-foreground text-center">
            已生成 {{ downloadedCount }} 张，若浏览器拦截了连续下载，请在弹窗中允许本站多次下载。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于壁纸多机型适配</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            不同设备的壁纸比例差异很大：iPhone 多为 19.5:9 刘海屏、安卓旗舰常见 20:9、iPad 接近 4:3、桌面显示器是 16:9，而微信状态和朋友圈背景又是 1:1 或 9:16。把同一张图直接设为壁纸，往往被系统居中裁掉一大半。本工具按目标分辨率预先处理，让每张壁纸在对应设备上都恰到好处。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三种处理方式怎么选</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">cover 智能裁切</span>：铺满目标、多余部分裁掉，配合水平/垂直焦点滑条把主体留在画面里，最常用的壁纸方案。</li>
            <li><span class="text-foreground font-medium">contain 模糊补边</span>：完整保留原图不裁切，比例不合的空隙用同图放大高斯模糊填充，适合含文字或不能裁的海报。</li>
            <li><span class="text-foreground font-medium">拉伸</span>：强行拉到目标尺寸，仅在源图与目标比例接近时用，否则会明显变形。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">裁切背后的数学</h3>
          <p>
            cover 模式先比较源图比例与目标比例：源图更「瘦长」则按高度取宽、裁掉左右；源图更「扁宽」则按宽度取高、裁掉上下；焦点 0.5 时居中，越靠近 0 或 1 越保留某一侧。裁切矩形始终被限制在源图边界内，绝不会越界取到空白像素。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">导出的分辨率准吗？</span>准。每个目标都是精确按勾选分辨率的画布像素输出，文件名里的宽×高即真实尺寸。</li>
            <li><span class="text-foreground font-medium">原图会上传吗？</span>不会，解码、裁切、模糊、导出全部在浏览器本地 Canvas 完成。</li>
            <li><span class="text-foreground font-medium">批量下载被浏览器拦了怎么办？</span>连续下载多张时浏览器可能拦截，请在地址栏弹窗中选择「允许」，或逐张点「下载当前」。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'wallpaper-adapter'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Monitor, ImageIcon, Upload, FileCheck, Smartphone, SlidersHorizontal,
  Eye, Download, Layers, Loader2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- 纯函数（可脱离浏览器单测） ----------
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// cover 裁切：返回源图上能铺满目标比例的裁切矩形，焦点 0.5 居中，且始终不越界
const coverCrop = (srcW, srcH, tgtW, tgtH, focusX = 0.5, focusY = 0.5) => {
  const sw0 = Math.max(1, srcW); const sh0 = Math.max(1, srcH)
  const ratio = (tgtW || 1) / (tgtH || 1)
  let sw; let sh
  if (sw0 / sh0 > ratio) {
    sh = sh0
    sw = sh0 * ratio
  } else {
    sw = sw0
    sh = sw0 / ratio
  }
  const fx = clamp(focusX, 0, 1)
  const fy = clamp(focusY, 0, 1)
  let sx = (sw0 - sw) * fx
  let sy = (sh0 - sh) * fy
  sx = clamp(sx, 0, sw0 - sw)
  sy = clamp(sy, 0, sh0 - sh)
  return { sx, sy, sw, sh }
}

// contain 前景：返回完整放入目标框的绘制矩形（含居中偏移）
const containFit = (srcW, srcH, tgtW, tgtH) => {
  const scale = Math.min(tgtW / Math.max(1, srcW), tgtH / Math.max(1, srcH))
  const dw = srcW * scale
  const dh = srcH * scale
  return { dw, dh, dx: (tgtW - dw) / 2, dy: (tgtH - dh) / 2 }
}

// 从全部机型中解析已勾选清单（保持定义顺序）
const resolveTargets = (all, ids) => all.filter(t => ids.includes(t.id))

// ---------- 机型清单 ----------
const ALL_TARGETS = [
  { id: 'iphone-1170', group: 'iPhone（19.5:9）', label: 'iPhone 经典', w: 1170, h: 2532 },
  { id: 'iphone-1284', group: 'iPhone（19.5:9）', label: 'iPhone Plus', w: 1284, h: 2778 },
  { id: 'iphone-1290', group: 'iPhone（19.5:9）', label: 'iPhone Pro Max', w: 1290, h: 2796 },
  { id: 'android-2400', group: '安卓主流（20:9）', label: '安卓旗舰', w: 1080, h: 2400 },
  { id: 'ipad-portrait', group: 'iPad（4:3 / 3:4）', label: 'iPad 竖屏', w: 1620, h: 2160 },
  { id: 'ipad-landscape', group: 'iPad（4:3 / 3:4）', label: 'iPad 横屏', w: 2160, h: 1620 },
  { id: 'desktop-1080p', group: '桌面（16:9）', label: '桌面 1080P', w: 1920, h: 1080 },
  { id: 'desktop-1440p', group: '桌面（16:9）', label: '桌面 2K', w: 2560, h: 1440 },
  { id: 'wechat-square', group: '微信（1:1 / 9:16）', label: '朋友圈封面', w: 1080, h: 1080 },
  { id: 'wechat-status', group: '微信（1:1 / 9:16）', label: '微信状态', w: 1080, h: 1920 }
]

// ---------- SEO ----------
useSeoMeta({
  title: '壁纸多机型适配 - 一张图裁成iPhone/安卓/iPad/桌面壁纸',
  description: '在线壁纸适配工具，上传一张高清图批量裁剪适配iPhone、安卓、iPad、桌面、微信状态/朋友圈等全套分辨率，支持cover焦点裁切、contain模糊补边、拉伸三种方式，Canvas本地导出，文件名带分辨率',
  keywords: '壁纸裁剪, 手机壁纸适配, iPhone壁纸尺寸, 安卓壁纸分辨率, iPad壁纸, 微信状态壁纸, 图片转壁纸, 多机型壁纸',
  author: 'Util工具箱',
  ogTitle: '壁纸多机型适配 - 有条工具',
  ogDescription: '一张图一键裁剪适配 iPhone/安卓/平板全套壁纸，焦点裁切+模糊补边',
  ogUrl: 'https://www.util.cn/tools/wallpaper-adapter',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '壁纸多机型适配',
          url: 'https://www.util.cn/tools/wallpaper-adapter',
          applicationCategory: 'PhotographyApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多机型分辨率清单', 'cover焦点裁切', 'contain模糊补边', '批量导出', '文件名带分辨率']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '壁纸多机型适配', item: 'https://www.util.cn/tools/wallpaper-adapter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '导出的壁纸分辨率准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '准确。每个目标都是精确按勾选分辨率的画布像素输出，文件名里的宽×高就是真实尺寸。' }
            },
            {
              '@type': 'Question',
              name: '原图会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，解码、裁切、模糊、导出全部在浏览器本地 Canvas 完成，关闭页面不留数据。' }
            },
            {
              '@type': 'Question',
              name: 'cover 和 contain 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'cover 铺满目标并裁掉多余部分、可用焦点滑条保住主体；contain 完整保留原图、空隙用同图放大高斯模糊填充。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'wallpaper-adapter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const fileInput = ref(null)
const previewCanvas = ref(null)
const imageEl = ref(null)
const fileName = ref('')
const imgW = ref(0)
const imgH = ref(0)
const isDragging = ref(false)

const selectedIds = ref(['iphone-1170', 'desktop-1080p'])
const activeId = ref('iphone-1170')
const fitMode = ref('cover')
const focusX = ref(0.5)
const focusY = ref(0.5)
const blurAmount = ref(20)
const outputFormat = ref('jpeg')
const quality = ref(0.92)

const processing = ref(false)
const progress = ref(0)
const downloadedCount = ref(0)
const seoContentVisible = ref(true)

const fitModes = [
  { value: 'cover', label: 'cover 裁切' },
  { value: 'contain', label: '模糊补边' },
  { value: 'stretch', label: '拉伸' }
]

const hasImage = computed(() => !!imageEl.value)
const sourceRatioText = computed(() => {
  if (!imgW.value || !imgH.value) return '—'
  return (imgW.value / imgH.value).toFixed(3) + ' : 1'
})

const groupedTargets = computed(() => {
  const order = []
  const map = {}
  ALL_TARGETS.forEach(t => {
    if (!map[t.group]) { map[t.group] = []; order.push(t.group) }
    map[t.group].push(t)
  })
  return order.map(name => ({ name, items: map[name] }))
})

const selectedTargets = computed(() => resolveTargets(ALL_TARGETS, selectedIds.value))
const activeTarget = computed(() => ALL_TARGETS.find(t => t.id === activeId.value) || null)
const canExport = computed(() => hasImage.value && selectedTargets.value.length > 0 && !!activeTarget.value)
const previewHint = computed(() => {
  if (!hasImage.value) return '未选择原图'
  if (!activeTarget.value) return '请勾选设备'
  return `当前 ${activeTarget.value.w}×${activeTarget.value.h} · ${fitMode.value}`
})

const toggleTarget = (id) => {
  const i = selectedIds.value.indexOf(id)
  if (i >= 0) {
    selectedIds.value.splice(i, 1)
    if (activeId.value === id) {
      activeId.value = selectedTargets.value.length ? selectedTargets.value[0].id : ''
    }
  } else {
    selectedIds.value.push(id)
    if (!activeTarget.value) activeId.value = id
  }
  renderPreview()
}
const selectAll = () => { selectedIds.value = ALL_TARGETS.map(t => t.id); if (!activeTarget.value) activeId.value = selectedIds.value[0]; renderPreview() }
const clearAll = () => { selectedIds.value = []; activeId.value = ''; renderPreview() }
const setActive = (id) => { activeId.value = id; renderPreview() }
const setFitMode = (v) => { fitMode.value = v; renderPreview() }
const setOutput = (v) => { outputFormat.value = v }
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 文件处理（浏览器 API 仅在回调内） ----------
const triggerFileSelect = () => fileInput.value?.click()
const handleFileChange = (e) => {
  const f = e.target.files?.[0]
  if (f) setFile(f)
  e.target.value = ''
}
const handleDrop = (e) => {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setFile(f)
}
const setFile = (f) => {
  if (!f.type.startsWith('image/')) { alert('请选择图片文件'); return }
  fileName.value = f.name
  const img = new Image()
  const objectUrl = URL.createObjectURL(f)
  img.onload = () => {
    imageEl.value = img
    imgW.value = img.naturalWidth
    imgH.value = img.naturalHeight
    renderPreview()
  }
  img.onerror = () => { URL.revokeObjectURL(objectUrl); alert('图片解码失败') }
  img.src = objectUrl
}

// ---------- 渲染单个目标到画布 ----------
const paintTarget = (ctx, target) => {
  const img = imageEl.value
  const w = target.w
  const h = target.h
  const srcW = img.naturalWidth
  const srcH = img.naturalHeight
  ctx.clearRect(0, 0, w, h)

  if (fitMode.value === 'cover') {
    const c = coverCrop(srcW, srcH, w, h, focusX.value, focusY.value)
    ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, w, h)
  } else if (fitMode.value === 'stretch') {
    ctx.drawImage(img, 0, 0, w, h)
  } else {
    // contain + 模糊补边：背景同图放大铺满并高斯模糊，前景完整居中
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, h)
    const bg = coverCrop(srcW, srcH, w, h, 0.5, 0.5)
    const blurPx = Math.max(2, blurAmount.value * (Math.min(w, h) / 1000))
    const over = Math.round(blurPx * 2)
    ctx.save()
    ctx.filter = `blur(${blurPx.toFixed(1)}px)`
    ctx.drawImage(img, bg.sx, bg.sy, bg.sw, bg.sh, -over, -over, w + over * 2, h + over * 2)
    ctx.restore()
    ctx.filter = 'none'
    const fg = containFit(srcW, srcH, w, h)
    ctx.drawImage(img, fg.dx, fg.dy, fg.dw, fg.dh)
  }
}

// 预览：直接以目标分辨率绘制到可见 canvas（CSS 缩放显示）
const renderPreview = () => {
  const canvas = previewCanvas.value
  const target = activeTarget.value
  if (!canvas || !imageEl.value || !target) return
  canvas.width = target.w
  canvas.height = target.h
  const ctx = canvas.getContext('2d')
  paintTarget(ctx, target)
}

// ---------- 导出 ----------
const renderBlob = (target) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = target.w
    canvas.height = target.h
    const ctx = canvas.getContext('2d')
    if (outputFormat.value === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, target.w, target.h)
    }
    paintTarget(ctx, target)
    canvas.toBlob(
      (blob) => resolve(blob),
      `image/${outputFormat.value}`,
      outputFormat.value === 'png' ? undefined : quality.value
    )
  })
}

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const nameFor = (target) => {
  const base = (fileName.value || 'wallpaper').replace(/\.[^.]+$/, '')
  const ext = outputFormat.value === 'jpeg' ? 'jpg' : 'png'
  return `${base}-${target.w}x${target.h}.${ext}`
}

const downloadActive = async () => {
  const target = activeTarget.value
  if (!target || !imageEl.value) return
  const blob = await renderBlob(target)
  if (blob) { triggerDownload(blob, nameFor(target)); downloadedCount.value += 1 }
}

const downloadAll = async () => {
  const list = selectedTargets.value
  if (!list.length || !imageEl.value || processing.value) return
  processing.value = true
  progress.value = 0
  for (const t of list) {
    const blob = await renderBlob(t)
    if (blob) { triggerDownload(blob, nameFor(t)); downloadedCount.value += 1 }
    progress.value += 1
    await new Promise(r => setTimeout(r, 350))
  }
  processing.value = false
}
</script>
