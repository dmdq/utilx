<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CreditCard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">身份证复印件排版</h1>
          <p class="text-sm text-muted-foreground mt-1">正反面照片按 85.6×54mm 原件大小排进一页 A4，标注用途水印，打印即用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传身份证人像面与国徽面两张照片，工具按卡片真实尺寸（85.6×54mm）在一页 A4 纵向纸内上下居中排版，
        可选斜向淡色用途水印，支持直接打印或导出高清 JPEG。全部处理在本页内存中完成。
      </p>
    </div>

    <!-- 隐私承诺 -->
    <div class="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4 mb-6 flex items-start gap-3 no-print">
      <ShieldCheck class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-green-800 dark:text-green-200 leading-relaxed">
        <strong>照片仅在本页面内存中处理，不会上传到任何服务器</strong>；刷新或关闭页面后照片即从内存释放，请放心使用。也建议拍摄后遮挡无关信息、仅提供必要证件。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 tools-grid">
      <!-- 左侧：上传与设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <Upload class="w-5 h-5 mr-2 text-primary" /> 上传照片
        </h2>

        <div class="grid grid-cols-2 gap-4">
          <!-- 人像面 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">人像面（正面）</label>
            <label class="block cursor-pointer">
              <input type="file" accept="image/*" class="hidden" @change="onPortraitChange" />
              <div v-if="portraitUrl" class="relative group rounded-lg overflow-hidden border border-border aspect-[85.6/54]">
                <img :src="portraitUrl" alt="身份证人像面预览" class="absolute inset-0 w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">
                  点击重新上传
                </div>
              </div>
              <div v-else class="rounded-lg border-2 border-dashed border-border aspect-[85.6/54] flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                <ImagePlus class="w-6 h-6" />
                <span class="text-xs">点击上传人像面照片</span>
              </div>
            </label>
          </div>

          <!-- 国徽面 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">国徽面（反面）</label>
            <label class="block cursor-pointer">
              <input type="file" accept="image/*" class="hidden" @change="onEmblemChange" />
              <div v-if="emblemUrl" class="relative group rounded-lg overflow-hidden border border-border aspect-[85.6/54]">
                <img :src="emblemUrl" alt="身份证国徽面预览" class="absolute inset-0 w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">
                  点击重新上传
                </div>
              </div>
              <div v-else class="rounded-lg border-2 border-dashed border-border aspect-[85.6/54] flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                <ImagePlus class="w-6 h-6" />
                <span class="text-xs">点击上传国徽面照片</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 水印设置 -->
        <div class="space-y-3 pt-1">
          <div class="flex items-center gap-2">
            <input v-model="watermarkEnabled" type="checkbox" id="wmEnabled" class="w-4 h-4 rounded border-border" />
            <label for="wmEnabled" class="text-sm text-foreground">添加斜向淡色用途水印（推荐）</label>
          </div>
          <div v-if="watermarkEnabled">
            <label class="block text-sm font-medium mb-1 text-foreground">水印文字</label>
            <input
              v-model="watermarkText"
              type="text"
              maxlength="30"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如：仅供办理XX业务使用，他用无效"
            />
            <p class="text-xs text-muted-foreground mt-1.5">写明用途与「他用无效」可降低复印件被冒用的风险</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-3 pt-1">
          <button
            @click="printPage"
            :disabled="!canExport"
            class="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Printer class="w-4 h-4" /> 打印 / 另存为 PDF
          </button>
          <button
            @click="exportJpeg"
            :disabled="!canExport || exporting"
            class="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Download class="w-4 h-4" /> {{ exporting ? '导出中…' : '下载高清 JPEG' }}
          </button>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          排版参数：A4 纵向 210×297mm，页边距 {{ PAGE_MARGIN }}mm，卡片按原件 85.6×54mm 居中裁切铺满（cover），人像面在上、国徽面在下。
        </p>
      </div>

      <!-- 右侧：A4 预览（打印时仅保留纸面） -->
      <div class="bg-card border border-border rounded-lg p-6 preview-panel">
        <h2 class="text-lg font-semibold flex items-center mb-4 no-print">
          <FileImage class="w-5 h-5 mr-2 text-primary" /> A4 版面预览
        </h2>
        <div class="overflow-auto sheet-scroll">
          <div class="a4-sheet" :class="watermarkEnabled && watermarkText ? 'has-watermark' : ''">
            <!-- 人像面（上半） -->
            <div class="card-slot" :style="slotStyle(0)">
              <img v-if="portraitUrl" :src="portraitUrl" alt="人像面" class="absolute inset-0 w-full h-full object-cover" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">待上传人像面</div>
            </div>
            <!-- 国徽面（下半） -->
            <div class="card-slot" :style="slotStyle(1)">
              <img v-if="emblemUrl" :src="emblemUrl" alt="国徽面" class="absolute inset-0 w-full h-full object-cover" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">待上传国徽面</div>
            </div>
            <!-- 水印 -->
            <div v-if="watermarkEnabled && watermarkText" class="watermark-layer">{{ watermarkText }}</div>
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-3 no-print">预览按 1:1 比例缩放显示，导出与打印均为原件大小（85.6×54mm）。</p>
      </div>
    </div>

    <!-- 使用步骤 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3 no-print">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        使用提示：① 分别上传人像面与国徽面照片（手机拍摄即可，尽量摆正、光线均匀）；② 建议勾选水印并写明用途；
        ③ 点击「打印」后在系统弹窗中选择打印机或「另存为 PDF」，无需缩放、按实际大小打印即可。
      </p>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于身份证复印件排版</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            开户、入职、办证、租赁备案等场景经常需要提交身份证复印件。直接复印常出现正反面不在一页、尺寸忽大忽小的问题，
            本工具把人像面与国徽面按二代证真实尺寸 85.6×54mm 排进同一页 A4，上下对称、比例精准，打印后无需二次裁剪。
          </p>
          <h3 class="text-lg font-semibold text-foreground">怎么把身份证正反面排进一页 A4</h3>
          <p>
            选择两张照片后，工具按「原件大小 + cover 裁切」处理：卡片区域严格等于 85.6×54mm，照片按等比放大铺满卡片、
            超出部分居中裁掉，因此不会被拉变形。上半页放人像面、下半页放国徽面，两卡关于页面中线对称，版面整洁规范。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么要加用途水印</h3>
          <p>
            身份证复印件存在被冒用办理信用卡、注册公司等风险。在复印件上斜向叠加「仅供办理 XX 业务使用，他用无效」的淡色水印，
            是公安机关和媒体反复提醒的防范措施：水印文字与证件内容交错、不影响核验，但能大幅增加被截图冒用的难度。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">照片会上传到服务器吗？</span>不会。照片仅通过浏览器在本页内存中排版与导出，全程不上传、不保存，刷新或关闭页面后即释放。</li>
            <li><span class="text-foreground font-medium">打印出来尺寸不对怎么办？</span>打印时请在系统对话框中把缩放设为「100% / 实际大小」，不要选择「适应页面」；浏览器默认可能按 96% 缩放，改回 100% 后即为原件尺寸。</li>
            <li><span class="text-foreground font-medium">黑白打印可以吗？</span>可以。水印为淡灰色，黑白打印后依然清晰可辨；若复印后再提交，水印同样会被复制，防护效果不变。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'id-card-print-layout'" :category="'file'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CreditCard, ShieldCheck, Upload, ImagePlus, Printer, Download,
  FileImage, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '身份证复印件排版 - 正反面一页 A4 原件大小打印',
  description: '在线身份证复印件排版工具，上传正反面照片按 85.6×54mm 原件大小排进一页 A4，支持斜向用途水印、直接打印与导出高清 JPEG，照片仅本页内存处理不上传',
  keywords: '身份证复印件排版, 身份证正反面打印, 身份证复印一页, 证件复印件模板, 身份证复印尺寸, 复印件水印',
  author: 'Util工具箱',
  ogTitle: '身份证复印件排版 - 有条工具',
  ogDescription: '正反面照片按原件大小排进一页 A4，本地处理，打印即用',
  ogUrl: 'https://www.util.cn/tools/id-card-print-layout',
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
          name: '身份证复印件排版',
          url: 'https://www.util.cn/tools/id-card-print-layout',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['正反面一页 A4 排版', '85.6×54mm 原件大小', '斜向用途水印', '打印与导出 JPEG', '本地内存处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '身份证复印件排版', item: 'https://www.util.cn/tools/id-card-print-layout/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '照片会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。照片仅通过浏览器在本页内存中排版与导出，全程不上传、不保存，刷新或关闭页面后即释放。' }
            },
            {
              '@type': 'Question',
              name: '打印出来尺寸不对怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '打印时把缩放设为 100% 实际大小，不要选择适应页面，即可得到 85.6×54mm 的原件尺寸。' }
            },
            {
              '@type': 'Question',
              name: '黑白打印可以吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。水印为淡灰色，黑白打印后依然清晰可辨，复印后水印同样保留，防护效果不变。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'id-card-print-layout')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
// 毫米转 CSS 像素（96dpi 基准）：1mm ≈ 3.7795px
const mmToPx = (mm) => mm * 96 / 25.4

// A4 页面内两张证件卡的排版坐标：上半页人像面、下半页国徽面，
// 两卡各自在「页边距内区域」的上/下半区中水平垂直居中，关于页面中线对称
const layoutCards = (a4W, a4H, cardW, cardH, margin) => {
  const innerW = a4W - margin * 2
  const innerH = a4H - margin * 2
  const halfH = innerH / 2
  const x = margin + (innerW - cardW) / 2
  const yTop = margin + (halfH - cardH) / 2
  const yBottom = margin + halfH + (halfH - cardH) / 2
  return [
    { x, y: yTop, w: cardW, h: cardH },
    { x, y: yBottom, w: cardW, h: cardH }
  ]
}
/* ==== PURE:END ==== */

// ---------- 常量与状态 ----------
const CARD_W_MM = 85.6
const CARD_H_MM = 54
const A4_W_MM = 210
const A4_H_MM = 297
const PAGE_MARGIN = 15

const portraitUrl = ref('')
const emblemUrl = ref('')
const watermarkEnabled = ref(true)
const watermarkText = ref('仅供办理业务使用，他用无效')
const exporting = ref(false)
const seoContentVisible = ref(true)

// 用于导出的 HTMLImageElement（非响应式，仅事件回调中赋值）
let portraitImgEl = null
let emblemImgEl = null

const canExport = computed(() => Boolean(portraitUrl.value && emblemUrl.value))

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 预览卡片定位（直接使用 mm 单位，屏幕与打印物理尺寸一致）
const slotStyle = (index) => {
  const pos = layoutCards(A4_W_MM, A4_H_MM, CARD_W_MM, CARD_H_MM, PAGE_MARGIN)[index]
  return {
    left: pos.x + 'mm',
    top: pos.y + 'mm',
    width: pos.w + 'mm',
    height: pos.h + 'mm'
  }
}

// ---------- 照片读取（仅内存） ----------
const readImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) {
      reject(new Error('请选择图片文件'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取失败'))
    reader.readAsDataURL(file)
  })
}

const loadImageEl = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败'))
    img.src = dataUrl
  })
}

const onPortraitChange = async (event) => {
  const input = event.target
  const file = input.files && input.files[0]
  try {
    const dataUrl = await readImageFile(file)
    portraitUrl.value = dataUrl
    portraitImgEl = await loadImageEl(dataUrl)
  } catch (e) {
    // 选择被取消或文件非法时保持原状
  }
  input.value = ''
}

const onEmblemChange = async (event) => {
  const input = event.target
  const file = input.files && input.files[0]
  try {
    const dataUrl = await readImageFile(file)
    emblemUrl.value = dataUrl
    emblemImgEl = await loadImageEl(dataUrl)
  } catch (e) {
    // 选择被取消或文件非法时保持原状
  }
  input.value = ''
}

// ---------- 打印与导出 ----------
const printPage = () => {
  if (!canExport.value) return
  window.print()
}

// cover 模式绘制：等比放大铺满目标区域，超出部分居中裁掉
const drawCover = (ctx, img, x, y, w, h) => {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

const drawWatermark = (ctx, a4W, a4H, text) => {
  const pxPerMm = a4W / A4_W_MM
  ctx.save()
  ctx.translate(a4W / 2, a4H / 2)
  ctx.rotate(-30 * Math.PI / 180)
  ctx.globalAlpha = 0.14
  ctx.fillStyle = '#334155'
  ctx.font = 'bold ' + Math.round(11 * pxPerMm) + 'px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

const pad2 = (n) => String(n).padStart(2, '0')

const buildExportCanvas = () => {
  // 300dpi 导出：A4 = 2480×3508px
  const pxPerMm = 300 / 25.4
  const a4W = Math.round(A4_W_MM * pxPerMm)
  const a4H = Math.round(A4_H_MM * pxPerMm)
  const canvas = document.createElement('canvas')
  canvas.width = a4W
  canvas.height = a4H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, a4W, a4H)

  const cards = layoutCards(
    a4W, a4H,
    Math.round(CARD_W_MM * pxPerMm),
    Math.round(CARD_H_MM * pxPerMm),
    Math.round(PAGE_MARGIN * pxPerMm)
  )
  drawCover(ctx, portraitImgEl, cards[0].x, cards[0].y, cards[0].w, cards[0].h)
  drawCover(ctx, emblemImgEl, cards[1].x, cards[1].y, cards[1].w, cards[1].h)
  if (watermarkEnabled.value && watermarkText.value.trim()) {
    drawWatermark(ctx, a4W, a4H, watermarkText.value.trim())
  }
  return canvas
}

const exportJpeg = async () => {
  if (!canExport.value || exporting.value) return
  exporting.value = true
  try {
    const canvas = buildExportCanvas()
    const now = new Date()
    const stamp = '' + now.getFullYear() + pad2(now.getMonth() + 1) + pad2(now.getDate())
    const link = document.createElement('a')
    link.download = '身份证复印件排版_' + stamp + '.jpg'
    link.href = canvas.toDataURL('image/jpeg', 0.92)
    link.click()
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.a4-sheet {
  position: relative;
  width: 210mm;
  height: 297mm;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.card-slot {
  position: absolute;
  border: 1px dashed rgba(0, 0, 0, 0.25);
  overflow: hidden;
  background: #f5f5f4;
}

.watermark-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 11mm;
  font-weight: 700;
  color: rgba(51, 65, 85, 0.14);
  white-space: nowrap;
  pointer-events: none;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  .no-print {
    display: none !important;
  }

  .tools-grid {
    display: block !important;
  }

  .preview-panel {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }

  .sheet-scroll {
    overflow: visible !important;
  }

  .a4-sheet {
    width: 210mm;
    height: 296.5mm;
    box-shadow: none;
    border-radius: 0;
  }

  .card-slot {
    border-color: transparent;
    background: transparent;
  }
}
</style>
