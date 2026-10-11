<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ruler class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">rpx/px换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">小程序设计稿单位双向换算，多机型宽度速查，整段样式批量转换</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        rpx 是微信小程序的响应式单位，规定 750rpx 等于屏幕宽度。本工具按「px → rpx = px × 750 ÷ 屏宽」双向换算，内置 iPhone SE / iPhone 14 / iPhone 14 Pro Max 及 360 / 393 / 412 等 Android 常见宽度速查；支持单值双向联动输入，也支持把整段 CSS / WXSS 粘进来批量替换所有 px（或反向转回 rpx），自动跳过 0 值和已是目标的单位。全部换算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 模块①：机型与基准 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Smartphone class="w-5 h-5 mr-2 text-primary" /> 屏幕宽度基准
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">屏幕宽度（px）</label>
          <input
            v-model.number="screenW"
            type="number"
            min="200"
            max="2000"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">机型速查（点击切换基准）</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="d in devices"
              :key="d.name"
              @click="screenW = d.w"
              :class="Number(screenW) === d.w ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >
              {{ d.name }} · {{ d.w }}
            </button>
          </div>
        </div>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">当前换算关系</p>
          <p class="text-lg font-bold text-primary">1px = {{ ratioRpx }}rpx</p>
          <p class="text-xs text-muted-foreground mt-1">750rpx = {{ screenW || 0 }}px（屏幕宽度）</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-muted-foreground border-b border-border">
                <th class="py-2 text-left font-medium">机型</th>
                <th class="py-2 text-right font-medium">屏宽</th>
                <th class="py-2 text-right font-medium">1px =</th>
                <th class="py-2 text-right font-medium">100px =</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="d in devices"
                :key="d.name"
                @click="screenW = d.w"
                :class="Number(screenW) === d.w ? 'bg-primary/5' : 'hover:bg-muted/40'"
                class="border-b border-border/40 cursor-pointer transition-colors"
              >
                <td class="py-2 text-foreground">{{ d.name }}</td>
                <td class="py-2 text-right text-muted-foreground">{{ d.w }}px</td>
                <td class="py-2 text-right text-muted-foreground">{{ rpxOf(1, d.w) }}rpx</td>
                <td class="py-2 text-right font-medium text-foreground">{{ rpxOf(100, d.w) }}rpx</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 模块②：单值双向换算 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 单值双向换算
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">px（设计稿尺寸）</label>
          <input
            v-model.number="pxInput"
            @input="onPxInput"
            type="number"
            step="0.5"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入 px 值，rpx 自动联动"
          />
        </div>

        <div class="flex justify-center">
          <button
            @click="swapSingle"
            class="px-4 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-xs transition-all flex items-center gap-1.5"
          >
            <ArrowLeftRight class="w-3.5 h-3.5" /> 交换方向
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">rpx（小程序单位）</label>
          <input
            v-model.number="rpxInput"
            @input="onRpxInput"
            type="number"
            step="0.5"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入 rpx 值，px 自动联动"
          />
        </div>

        <!-- 换算结果 -->
        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">{{ lastEdited === 'px' ? '换算结果' : '反向换算结果' }}</p>
          <p class="text-2xl font-bold text-primary">{{ resultText }}</p>
          <p class="text-xs text-muted-foreground mt-1">按 {{ screenW || 0 }}px 屏宽：px × 750 ÷ {{ screenW || 0 }}，rpx × {{ screenW || 0 }} ÷ 750</p>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          两个输入框双向联动：在任意一侧输入，另一侧立即按当前屏幕宽度换算；切换机型后结果自动刷新。结果保留两位小数。
        </p>
      </div>

      <!-- 模块③：批量转换 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <FileCode class="w-5 h-5 mr-2 text-primary" /> 批量转换 CSS / WXSS
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">转换方向</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="batchMode = 'px2rpx'"
              :class="batchMode === 'px2rpx' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >px → rpx</button>
            <button
              @click="batchMode = 'rpx2px'"
              :class="batchMode === 'rpx2px' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >rpx → px</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">粘贴样式代码</label>
          <textarea
            v-model="batchInput"
            class="w-full h-36 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="width: 32px; height: 16rpx; font-size: 0px;"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- 批量结果 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">
              转换结果
              <span v-if="batchCount > 0" class="ml-1 text-xs font-normal text-muted-foreground">（替换 {{ batchCount }} 处）</span>
            </label>
            <button
              @click="copyText(batchOutput, 'batch')"
              :disabled="!batchOutput"
              class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5"
            >
              <Check v-if="copiedKey === 'batch'" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === 'batch' ? '已复制' : '复制' }}
            </button>
          </div>
          <pre class="w-full h-36 overflow-auto bg-muted/30 border border-border rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all text-foreground">{{ batchOutput || '粘贴样式后自动转换' }}</pre>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          按 {{ screenW || 0 }}px 屏宽批量替换：{{ batchMode === 'px2rpx' ? '所有 `数字px` 转为 rpx' : '所有 `数字rpx` 转为 px' }}，0 值与目标方向的单位保持原样。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 rpx 与 px 换算</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            rpx（responsive pixel）是微信小程序为适配不同屏宽设计的单位：无论什么设备，750rpx 恒等于屏幕宽度。也就是说在 375px 宽的 iPhone SE 上 1px = 2rpx，在 390px 宽的 iPhone 14 上 1px ≈ 1.92rpx。按 750 宽的设计稿标注（1pt 对应 1px）写 1rpx 即可自动等比适配。
          </p>
          <h3 class="text-lg font-semibold text-foreground">换算公式</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>px → rpx：rpx = px × 750 ÷ 屏幕宽度</li>
            <li>rpx → px：px = rpx × 屏幕宽度 ÷ 750</li>
            <li>示例：375px 屏宽下 100px = 100 × 750 ÷ 375 = 200rpx</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">使用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>把设计稿（Figma / 蓝湖，通常 375 或 750 宽）的 px 标注换算成小程序 rpx</li>
            <li>把网上抄来的 rpx 片段换回 px，用于 H5 或原生页面对照</li>
            <li>老项目批量迁移：整段 WXSS 一次替换，避免逐个数值手改</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么不同机型换算结果不一样？</span>rpx 的基准是屏宽，375、390、412 等不同宽度下同一个 px 值对应的 rpx 不同；工具默认按 375（iPhone SE / 750 设计稿的一半）计算，可随时切换机型。</li>
            <li><span class="text-foreground font-medium">批量转换会误伤已有单位吗？</span>不会。px → rpx 方向只替换以 px 结尾的数字，16rpx 这类已是 rpx 的值保持不变；0px 也会原样保留。</li>
            <li><span class="text-foreground font-medium">小数怎么处理？</span>换算结果四舍五入保留两位小数，兼顾精度与代码整洁；批量转换支持 0.5px 这类小数输入。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'rpx-px-converter'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Ruler, Smartphone, ArrowLeftRight, FileCode, Copy, Check,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'rpx/px换算器 - 小程序设计稿单位双向换算与批量转换',
  description: '在线 rpx 与 px 双向换算工具，按 750rpx 等于屏幕宽度换算，内置 iPhone SE 375、iPhone 14 390、iPhone 14 Pro Max 430 及 Android 360/393/412 机型速查，支持整段 CSS/WXSS 批量转换并跳过 0 值，纯本地计算',
  keywords: 'rpx转px, px转rpx, 小程序单位换算, 750设计稿, rpx计算',
  author: 'Util工具箱',
  ogTitle: 'rpx/px换算器 - 有条工具',
  ogDescription: '小程序设计稿单位双向换算，多机型速查，整段样式批量转换',
  ogUrl: 'https://www.util.cn/tools/rpx-px-converter',
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
          name: 'rpx/px换算器',
          url: 'https://www.util.cn/tools/rpx-px-converter',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['px 与 rpx 双向换算', '多机型宽度速查', '输入框双向联动', 'CSS/WXSS 批量转换', '跳过 0 值与已有单位']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'rpx/px换算器', item: 'https://www.util.cn/tools/rpx-px-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么不同机型换算结果不一样？',
              acceptedAnswer: { '@type': 'Answer', text: 'rpx 的基准是屏宽，375、390、412 等不同宽度下同一个 px 值对应的 rpx 不同；工具默认按 375（iPhone SE / 750 设计稿的一半）计算，可随时切换机型。' }
            },
            {
              '@type': 'Question',
              name: '批量转换会误伤已有单位吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。px → rpx 方向只替换以 px 结尾的数字，16rpx 这类已是 rpx 的值保持不变；0px 也会原样保留。' }
            },
            {
              '@type': 'Question',
              name: '小数怎么处理？',
              acceptedAnswer: { '@type': 'Answer', text: '换算结果四舍五入保留两位小数，兼顾精度与代码整洁；批量转换支持 0.5px 这类小数输入。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'rpx-px-converter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const screenW = ref(375)
const pxInput = ref(null)
const rpxInput = ref(null)
const lastEdited = ref('px') // 记录最后编辑的一侧，切换机型后按该侧刷新
const batchMode = ref('px2rpx')
const batchInput = ref('')
const seoContentVisible = ref(true)
const copiedKey = ref('')
let copyTimer = null

const devices = [
  { name: 'iPhone SE', w: 375 },
  { name: 'iPhone 14/13/12', w: 390 },
  { name: 'iPhone 14 Pro Max', w: 430 },
  { name: 'Android 小屏', w: 360 },
  { name: 'Android 主流', w: 393 },
  { name: 'Android 大屏', w: 412 }
]

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 换算核心 ----------
const round2 = (v) => Math.round(v * 100) / 100

const pxToRpx = (px, w) => round2(px * 750 / w)
const rpxToPx = (rpx, w) => round2(rpx * w / 750)

const rpxOf = (px, w) => pxToRpx(px, w)

const isValidNum = (v) => v !== '' && v !== null && v !== undefined && isFinite(Number(v))

// ---------- 单值双向联动 ----------
const onPxInput = () => {
  lastEdited.value = 'px'
  if (!isValidNum(pxInput.value)) {
    rpxInput.value = ''
    return
  }
  rpxInput.value = pxToRpx(Number(pxInput.value), Number(screenW.value))
}

const onRpxInput = () => {
  lastEdited.value = 'rpx'
  if (!isValidNum(rpxInput.value)) {
    pxInput.value = ''
    return
  }
  pxInput.value = rpxToPx(Number(rpxInput.value), Number(screenW.value))
}

// 切换屏幕宽度后，按最后编辑的一侧重新换算
watch(screenW, () => {
  if (lastEdited.value === 'px') {
    onPxInput()
  } else {
    onRpxInput()
  }
})

const swapSingle = () => {
  if (lastEdited.value === 'px') {
    lastEdited.value = 'rpx'
  } else {
    lastEdited.value = 'px'
  }
}

const ratioRpx = computed(() => {
  const w = Number(screenW.value)
  if (!w || w <= 0) return '—'
  return pxToRpx(1, w)
})

const resultText = computed(() => {
  if (!isValidNum(pxInput.value) || !isValidNum(rpxInput.value)) return '—'
  if (lastEdited.value === 'px') {
    return Number(pxInput.value) + 'px = ' + rpxInput.value + 'rpx'
  }
  return Number(rpxInput.value) + 'rpx = ' + pxInput.value + 'px'
})

// ---------- 批量转换 ----------
const UNIT_RE = {
  px2rpx: /(\d*\.?\d+)px\b/gi,
  rpx2px: /(\d*\.?\d+)rpx\b/gi
}

const batchOutput = computed(() => {
  const src = batchInput.value
  if (!src) return ''
  const w = Number(screenW.value)
  if (!w || w <= 0) return src
  if (batchMode.value === 'px2rpx') {
    return src.replace(UNIT_RE.px2rpx, (m, n) => {
      const num = parseFloat(n)
      if (num === 0) return m
      return String(pxToRpx(num, w)) + 'rpx'
    })
  }
  return src.replace(UNIT_RE.rpx2px, (m, n) => {
    const num = parseFloat(n)
    if (num === 0) return m
    return String(rpxToPx(num, w)) + 'px'
  })
})

const batchCount = computed(() => {
  const src = batchInput.value
  if (!src) return 0
  const re = UNIT_RE[batchMode.value]
  re.lastIndex = 0
  let n = 0
  let m
  while ((m = re.exec(src)) !== null) {
    if (parseFloat(m[1]) !== 0) n++
  }
  re.lastIndex = 0
  return n
})

// ---------- 复制 ----------
const copyText = async (text, key) => {
  if (!text) return
  let ok = false
  try {
    await navigator.clipboard.writeText(text)
    ok = true
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      ok = true
    } catch (e2) {
      ok = false
    }
  }
  if (ok) {
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  }
}
</script>
