<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Smile class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">节日头像框生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">国旗角标、圣诞、新年等模板一键叠加，头像本地合成不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传头像，叠加 Canvas 程序化绘制的节日边框模板：国旗角标、圣诞红绿框、新年红金灯笼框、通用彩色圆环，或上传自制的透明 PNG 边框素材。非方形头像自动中心裁方，框粗细可调，一键导出 PNG 换头像。全部合成在浏览器本地完成，头像不会上传到任何服务器。
      </p>
      <!-- 隐私提示 -->
      <div class="mt-4 bg-card border border-border rounded-lg p-4 flex items-start gap-3">
        <ShieldCheck class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p class="text-xs text-muted-foreground leading-relaxed">
          隐私保障：头像与边框素材仅在浏览器内通过 Canvas 合成，不上传、不保存；所有模板均为程序化绘制，不加载任何外部图片资源。
        </p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Palette class="w-5 h-5 mr-2 text-primary" /> 头像与模板
        </h2>

        <!-- 头像上传 -->
        <label class="block cursor-pointer">
          <input type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
          <div class="border-2 border-dashed border-border rounded-lg p-5 text-center hover:bg-accent/50 transition-colors">
            <Upload class="w-7 h-7 mx-auto text-muted-foreground mb-2" />
            <p class="text-sm text-foreground font-medium">点击上传头像</p>
            <p class="text-xs text-muted-foreground mt-1">非方形图片会自动中心裁方</p>
          </div>
        </label>
        <p v-if="avatarName" class="text-xs text-muted-foreground break-all">已选择：{{ avatarName }}</p>

        <!-- 模板选择 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">边框模板</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="tpl in templateOptions"
              :key="tpl.value"
              @click="selectTemplate(tpl.value)"
              :class="selectedTemplate === tpl.value ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'"
              class="flex items-center gap-2 p-2.5 rounded-lg border bg-background text-left transition-all"
            >
              <span class="w-6 h-6 rounded-full flex-shrink-0" :style="{ background: tpl.swatch }"></span>
              <span class="text-xs font-medium text-foreground">{{ tpl.label }}</span>
            </button>
          </div>
        </div>

        <!-- 自定义边框上传 -->
        <div v-if="selectedTemplate === 'custom'">
          <label class="block cursor-pointer">
            <input type="file" accept="image/png" class="hidden" @change="onOverlayChange" />
            <div class="border border-dashed border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
              <p class="text-sm text-foreground font-medium">上传透明 PNG 边框素材</p>
              <p class="text-xs text-muted-foreground mt-1">建议使用与头像等比的方形透明边框图</p>
            </div>
          </label>
          <p v-if="overlayName" class="text-xs text-muted-foreground break-all mt-2">已选择：{{ overlayName }}</p>
        </div>

        <!-- 框粗细 -->
        <div v-if="selectedTemplate !== 'custom'">
          <label class="block text-sm font-medium text-foreground mb-2">
            框粗细：<span class="text-primary">{{ thickness }}%</span>
          </label>
          <input
            v-model.number="thickness"
            type="range"
            min="3"
            max="20"
            step="1"
            class="w-full accent-primary"
            @input="redraw"
          />
        </div>

        <button
          v-if="avatarName"
          @click="downloadFrame"
          class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Download class="w-4 h-4" /> 导出 PNG 头像
        </button>
      </div>

      <!-- 预览 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center">
        <h2 class="text-lg font-semibold flex items-center self-start mb-4">
          <Frame class="w-5 h-5 mr-2 text-primary" /> 实时预览
        </h2>
        <canvas
          v-show="avatarName"
          ref="frameCanvas"
          width="800"
          height="800"
          class="w-full max-w-sm rounded-lg border border-border shadow-sm"
        ></canvas>
        <div v-if="!avatarName" class="py-20 text-center text-muted-foreground">
          <Smile class="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p class="text-sm">上传头像后选择节日模板，预览会实时更新</p>
        </div>
        <p v-if="avatarName" class="text-xs text-muted-foreground mt-3">导出尺寸 800 × 800 px，微信、QQ、微博头像均适用</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于节日头像框</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            节日换头像是社交平台的保留节目：国庆换国旗角标、圣诞换红绿帽框、新年换红金边框，一个头像就能传递节日气氛。本工具无需安装 App，网页上传头像即可合成。
          </p>
          <h3 class="text-lg font-semibold text-foreground">内置模板介绍</h3>
          <p>
            国旗角标：右上角 1/4 圆形红色底配黄色五角星，五角星按几何顶点公式绘制，庄重不变形；圣诞模板：红绿相间边框加雪花点；新年模板：红金双色边框配灯笼剪影；彩色圆环：多色圆环适合日常与活动头像；自定义模板：支持上传自制的透明 PNG 边框素材无限扩展。
          </p>
          <h3 class="text-lg font-semibold text-foreground">如何使用本工具</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>上传头像，非方形图片会自动中心裁切为正方形</li>
            <li>选择节日模板，非自定义模板可用滑条调节框粗细</li>
            <li>预览满意后点击「导出 PNG 头像」保存到本地</li>
            <li>到微信、QQ 等平台更换头像即可</li>
          </ol>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">头像不是正方形会变形吗？</span>不会。工具会按短边自动中心裁方，只裁剪不拉伸，人物居中位置保持不变。</li>
            <li><span class="text-foreground font-medium">自定义边框素材怎么选？</span>准备一张方形透明底 PNG，边框画在四周边缘区域、中间镂空，上传后会被完整叠加在头像上。</li>
            <li><span class="text-foreground font-medium">我的头像会被上传吗？</span>不会。合成全部通过浏览器本地 Canvas 完成，页面不发出任何包含图片数据的网络请求。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'festival-avatar-frame'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  Smile, Upload, Download, ShieldCheck, ChevronUp, ChevronDown,
  Palette, Frame
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '节日头像框生成器 - 国旗/圣诞/新年头像',
  description: '在线节日头像框生成器，头像一键叠加国旗角标、圣诞红绿框、新年红金灯笼框、彩色圆环或自定义透明 PNG 边框，本地 Canvas 合成导出，头像不上传',
  keywords: '节日头像框, 国庆国旗头像, 圣诞头像, 头像加框, 微信头像模板, 新年头像',
  author: 'Util工具箱',
  ogTitle: '节日头像框生成器 - 有条工具',
  ogDescription: '国旗角标、圣诞、新年模板一键叠加，头像本地合成不上传',
  ogUrl: 'https://www.util.cn/tools/festival-avatar-frame',
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
          name: '节日头像框生成器',
          url: 'https://www.util.cn/tools/festival-avatar-frame',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['国旗角标模板', '圣诞红绿边框', '新年红金灯笼框', '通用彩色圆环', '自定义透明 PNG 边框', '框粗细可调', '本地合成不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '节日头像框生成器', item: 'https://www.util.cn/tools/festival-avatar-frame' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '头像不是正方形会变形吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。工具按短边自动中心裁方，只裁剪不拉伸，人物居中位置保持不变。' }
            },
            {
              '@type': 'Question',
              name: '自定义边框素材怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '准备方形透明底 PNG，边框画在四周边缘、中间镂空，上传后完整叠加在头像上。' }
            },
            {
              '@type': 'Question',
              name: '我的头像会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。合成全部通过浏览器本地 Canvas 完成，不含任何图片数据上传。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'festival-avatar-frame')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数：五角星顶点（首点在正上方 -90°） ----------
function starPoints(cx, cy, R, r, n) {
  if (n === undefined) n = 5
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const radius = i % 2 === 0 ? R : r
    const angle = -Math.PI / 2 + (i * Math.PI) / n
    pts.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
  }
  return pts
}

// 固定种子伪随机数（保证同参数下模板绘制结果一致）
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let s = Math.imul(a ^ (a >>> 15), 1 | a)
    s = (s + Math.imul(s ^ (s >>> 7), 61 | s)) ^ s
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- 模板绘制（全部 Canvas 程序化绘制，不依赖外部图片） ----------
function drawPathPolygon(ctx, pts) {
  ctx.beginPath()
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i][0], pts[i][1])
    else ctx.lineTo(pts[i][0], pts[i][1])
  }
  ctx.closePath()
}

// ① 国旗角标：右上角 1/4 圆红底 + 五角星徽章
function drawFlagBadge(ctx, size) {
  const r = size * 0.30
  ctx.save()
  // 右上角 1/4 圆形红色底（扇区朝画布内）
  ctx.beginPath()
  ctx.moveTo(size, 0)
  ctx.arc(size, 0, r, Math.PI / 2, Math.PI)
  ctx.closePath()
  ctx.fillStyle = '#DE2910'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = Math.max(2, size * 0.012)
  ctx.stroke()
  // 五角星（顶点朝上，庄重不变形），并裁剪进扇区内
  ctx.clip()
  const cx = size - r * 0.5
  const cy = r * 0.5
  const R = r * 0.34
  drawPathPolygon(ctx, starPoints(cx, cy, R, R * 0.4, 5))
  ctx.fillStyle = '#FFDE00'
  ctx.fill()
  ctx.restore()
}

// ② 圣诞：红绿相间边框 + 雪花点
function drawChristmasFrame(ctx, size, t) {
  const radius = size / 2 - t / 2
  const colors = ['#D42426', '#1F8A3B']
  const segs = 12
  for (let i = 0; i < segs; i++) {
    const a0 = (i * Math.PI * 2) / segs
    const a1 = ((i + 1) * Math.PI * 2) / segs
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, radius, a0, a1)
    ctx.strokeStyle = colors[i % 2]
    ctx.lineWidth = t
    ctx.stroke()
  }
  // 内侧白色细描边
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - t, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = Math.max(2, size * 0.006)
  ctx.stroke()
  // 雪花点分布在边框带内（固定种子，重复生成一致）
  const rand = mulberry32(20241225)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  for (let i = 0; i < 42; i++) {
    const a = rand() * Math.PI * 2
    const rr = size / 2 - t / 2 + (rand() - 0.5) * t * 0.7
    const x = size / 2 + rr * Math.cos(a)
    const y = size / 2 + rr * Math.sin(a)
    const dr = size * (0.004 + rand() * 0.008)
    ctx.beginPath()
    ctx.arc(x, y, dr, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ③ 新年：红金边框 + 灯笼剪影
function drawLantern(ctx, cx, topY, rw, rh) {
  const bodyCy = topY + rh * 1.1
  ctx.save()
  ctx.fillStyle = '#E63946'
  ctx.strokeStyle = '#F7C948'
  // 上下盖
  ctx.fillRect(cx - rw * 0.32, topY, rw * 0.64, rh * 0.22)
  ctx.fillRect(cx - rw * 0.32, bodyCy + rh - rh * 0.22, rw * 0.64, rh * 0.22)
  // 灯身
  ctx.beginPath()
  ctx.ellipse(cx, bodyCy, rw, rh, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, rw * 0.06)
  ctx.stroke()
  // 灯身竖纹
  ctx.beginPath()
  ctx.ellipse(cx, bodyCy, rw * 0.45, rh, 0, 0, Math.PI * 2)
  ctx.stroke()
  // 流苏
  ctx.beginPath()
  ctx.moveTo(cx, bodyCy + rh + rh * 0.1)
  ctx.lineTo(cx, bodyCy + rh + rh * 0.6)
  ctx.stroke()
  ctx.restore()
}

function drawNewYearFrame(ctx, size, t) {
  // 红色外框
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - t / 2, 0, Math.PI * 2)
  ctx.strokeStyle = '#C8102E'
  ctx.lineWidth = t
  ctx.stroke()
  // 金色内圈线
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - t - size * 0.012, 0, Math.PI * 2)
  ctx.strokeStyle = '#F7C948'
  ctx.lineWidth = Math.max(3, size * 0.008)
  ctx.stroke()
  // 挂绳与灯笼剪影
  const hangY = t + size * 0.012
  ctx.strokeStyle = '#F7C948'
  ctx.lineWidth = Math.max(2, size * 0.005)
  const positions = [0.22, 0.78]
  for (let i = 0; i < positions.length; i++) {
    const x = size * positions[i]
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, hangY)
    ctx.stroke()
    drawLantern(ctx, x, hangY, size * 0.075, size * 0.062)
  }
}

// ④ 通用彩色圆环
const RING_COLORS = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6']

function drawRingFrame(ctx, size, t) {
  const radius = size / 2 - t / 2
  const segs = RING_COLORS.length
  for (let i = 0; i < segs; i++) {
    const a0 = -Math.PI / 2 + (i * Math.PI * 2) / segs
    const a1 = -Math.PI / 2 + ((i + 1) * Math.PI * 2) / segs
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, radius, a0, a1)
    ctx.strokeStyle = RING_COLORS[i]
    ctx.lineWidth = t
    ctx.stroke()
  }
}

// ---------- 状态 ----------
const templateOptions = [
  { value: 'flag', label: '国旗角标', swatch: 'linear-gradient(135deg, #DE2910 65%, #FFDE00 65%)' },
  { value: 'christmas', label: '圣诞红绿', swatch: 'linear-gradient(90deg, #D42426 50%, #1F8A3B 50%)' },
  { value: 'newyear', label: '新年红金', swatch: 'linear-gradient(90deg, #C8102E 55%, #F7C948 55%)' },
  { value: 'ring', label: '彩色圆环', swatch: 'conic-gradient(#F87171, #FBBF24, #34D399, #60A5FA, #A78BFA, #F472B6, #F87171)' },
  { value: 'custom', label: '自定义 PNG', swatch: 'linear-gradient(135deg, #e5e7eb 45%, #9ca3af 45%)' }
]
const frameCanvas = ref(null)
const avatarImg = ref(null)
const avatarName = ref('')
const overlayImg = ref(null)
const overlayName = ref('')
const selectedTemplate = ref('flag')
const thickness = ref(8)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 用户交互回调 ----------
const onAvatarChange = (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      avatarImg.value = img
      avatarName.value = file.name
      redraw()
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const onOverlayChange = (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      overlayImg.value = img
      overlayName.value = file.name
      redraw()
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const selectTemplate = (v) => {
  selectedTemplate.value = v
  redraw()
}

// ---------- 合成绘制（用户交互后执行） ----------
const redraw = () => {
  const canvas = frameCanvas.value
  const img = avatarImg.value
  if (!canvas || !img) return
  const size = 800
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // 非方形头像：按短边中心裁方
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - side) / 2
  const sy = (img.naturalHeight - side) / 2
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)

  const t = Math.max(3, Math.round(size * thickness.value / 100))
  if (selectedTemplate.value === 'flag') {
    drawFlagBadge(ctx, size)
  } else if (selectedTemplate.value === 'christmas') {
    drawChristmasFrame(ctx, size, t)
  } else if (selectedTemplate.value === 'newyear') {
    drawNewYearFrame(ctx, size, t)
  } else if (selectedTemplate.value === 'ring') {
    drawRingFrame(ctx, size, t)
  } else if (selectedTemplate.value === 'custom' && overlayImg.value) {
    ctx.drawImage(overlayImg.value, 0, 0, size, size)
  }
}

const downloadFrame = () => {
  const canvas = frameCanvas.value
  if (!canvas) return
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'festival-avatar.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/png')
}

onBeforeUnmount(() => {
  avatarImg.value = null
  overlayImg.value = null
})
</script>
