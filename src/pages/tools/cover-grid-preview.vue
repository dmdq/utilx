<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <LayoutGrid class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">封面瀑布流预览</h1>
          <p class="text-sm text-muted-foreground mt-1">批量上传封面，模拟抖音/B站/小红书/公众号信息流观感，挑出最抓眼的那张</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        做博主最怕封面在信息流里「泯然众人」。把候选封面一次性传进来，切换四种平台视图，看看它在真实排版尺寸下够不够醒目；每张封面还能填上标题文字，连标题长度对观感的影响也能一起预览。图片只在本机浏览器内渲染，不上传服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左栏：上传 + 封面清单 -->
      <div class="space-y-6 no-print">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Upload class="w-5 h-5 mr-2 text-primary" /> 上传封面
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="handleFileChange" />
            <LayoutGrid class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击选择或拖入多张封面图</p>
            <p class="text-xs text-muted-foreground mt-1.5">建议竖版 3:4（抖音/小红书）或横版 16:9（B站/公众号），其他比例会按 object-fit 裁切显示</p>
          </div>
          <div v-if="images.length" class="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>已加入 {{ images.length }} 张封面</span>
            <button class="text-red-500 hover:underline flex items-center gap-1" @click="clearAll">
              <Trash2 class="w-3.5 h-3.5" /> 清空
            </button>
          </div>
        </div>

        <!-- 封面清单与标题编辑 -->
        <div v-if="images.length" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Type class="w-5 h-5 mr-2 text-primary" /> 封面标题
          </h2>
          <p class="text-xs text-muted-foreground">为每张封面填写将展示在信息流里的标题，留空则使用占位文字。</p>
          <div v-for="(item, i) in images" :key="item.id" class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
              <img :src="item.url" class="w-full h-full object-cover" :alt="item.name" />
            </div>
            <input
              v-model="images[i].title"
              type="text"
              maxlength="30"
              :placeholder="'封面 ' + (i + 1) + ' 的标题（' + baseName(item.name) + '）'"
              class="flex-1 px-3 py-1.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              class="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
              :title="'移除第 ' + (i + 1) + ' 张'"
              @click="removeImage(i)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- 右栏：平台视图切换 + 信息流预览 -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-4 flex flex-wrap gap-1.5 no-print">
          <button
            v-for="p in platforms"
            :key="p.value"
            @click="platform = p.value"
            :class="platform === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            {{ p.label }}
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Eye class="w-4 h-4 text-primary" /> {{ currentPlatformLabel }} · {{ spec.columns }} 列 · 封面比例 {{ spec.ratio[0] }}:{{ spec.ratio[1] }}
            </h2>
            <span class="text-xs text-muted-foreground">缩略预览，按手机信息流排版 1:1 还原列数与裁切</span>
          </div>

          <!-- 空态 -->
          <div v-if="isEmpty" class="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Smartphone class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">还没有封面，先在左侧上传几张候选封面图</p>
            <p class="text-xs text-muted-foreground mt-1.5">上传后即可在这里对比它们在信息流里的「第一眼效果」</p>
          </div>

          <!-- 抖音 / 小红书：多列瀑布流 -->
          <div
            v-else-if="spec.kind === 'waterfall'"
            class="rounded-lg bg-background p-2 overflow-hidden"
            :style="{ columnCount: spec.columns, columnGap: '8px' }"
          >
            <div
              v-for="(item, i) in images"
              :key="item.id"
              class="mb-2 rounded-lg overflow-hidden bg-muted/40 border border-border/60"
              :style="{ breakInside: 'avoid' }"
            >
              <div class="relative w-full" :style="{ aspectRatio: spec.ratio[0] + ' / ' + spec.ratio[1] }">
                <img :src="item.url" class="absolute inset-0 w-full h-full object-cover" :alt="feedTitle(item, i)" />
                <!-- 小红书：标题叠在封面底部 -->
                <p
                  v-if="platform === 'xiaohongshu'"
                  class="absolute inset-x-0 bottom-0 px-2 pb-1.5 pt-6 text-[11px] leading-snug text-white font-medium line-clamp-2 bg-gradient-to-t from-black/60 to-transparent"
                  style="text-shadow: 0 1px 3px rgba(0,0,0,.7)"
                >
                  {{ feedTitle(item, i) }}
                </p>
              </div>
              <div v-if="platform === 'douyin'" class="p-2">
                <p class="text-xs text-foreground leading-snug line-clamp-2">{{ feedTitle(item, i) }}</p>
                <div class="flex items-center justify-between mt-1.5">
                  <div class="flex items-center gap-1 min-w-0">
                    <span class="w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 to-amber-400 flex-shrink-0" />
                    <span class="text-[10px] text-muted-foreground truncate">@{{ baseName(item.name) }}</span>
                  </div>
                  <span class="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Heart class="w-3 h-3" /> {{ fmtCount(likeCount(i)) }}
                  </span>
                </div>
              </div>
              <div v-else-if="platform === 'xiaohongshu'" class="p-2 flex items-center gap-1">
                <span class="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex-shrink-0" />
                <span class="text-[10px] text-muted-foreground truncate">{{ baseName(item.name) }}</span>
                <span class="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
                  <Heart class="w-3 h-3" /> {{ fmtCount(likeCount(i)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- B站：横向卡片 -->
          <div v-else-if="spec.kind === 'card'" class="grid gap-2 rounded-lg bg-background p-2 overflow-hidden" :style="{ gridTemplateColumns: 'repeat(' + spec.columns + ', minmax(0, 1fr))' }">
            <div v-for="(item, i) in images" :key="item.id" class="rounded-lg overflow-hidden bg-muted/40 border border-border/60 flex gap-2 p-2">
              <div class="relative w-[42%] flex-shrink-0 rounded overflow-hidden" :style="{ aspectRatio: spec.ratio[0] + ' / ' + spec.ratio[1] }">
                <img :src="item.url" class="absolute inset-0 w-full h-full object-cover" :alt="feedTitle(item, i)" />
                <span class="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-white text-[10px] font-mono">{{ fakeDuration(i) }}</span>
              </div>
              <div class="min-w-0 flex-1 flex flex-col">
                <p class="text-xs text-foreground leading-snug line-clamp-2">{{ feedTitle(item, i) }}</p>
                <div class="mt-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Play class="w-3 h-3" /> {{ fmtCount(fakeViews(i)) }} · 弹幕 {{ fmtCount(Math.round(fakeViews(i) / 40)) }}
                </div>
                <span class="text-[10px] text-muted-foreground truncate">{{ baseName(item.name) }}</span>
              </div>
            </div>
          </div>

          <!-- 公众号：列表 -->
          <div v-else class="space-y-3 rounded-lg bg-background p-2">
            <div v-for="(item, i) in images" :key="item.id" class="flex gap-3 items-start">
              <div class="min-w-0 flex-1">
                <p class="text-sm text-foreground leading-snug line-clamp-2">{{ feedTitle(item, i) }}</p>
                <p class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ summaryText(item, i) }}</p>
                <div class="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                  <span class="text-primary/80">{{ baseName(item.name) }}</span>
                  <span>{{ fakeDate(i) }}</span>
                  <span class="ml-auto">{{ fmtCount(readCount(i)) }} 阅读</span>
                </div>
              </div>
              <div class="w-[112px] sm:w-[140px] flex-shrink-0 rounded overflow-hidden" :style="{ aspectRatio: spec.ratio[0] + ' / ' + spec.ratio[1] }">
                <img :src="item.url" class="w-full h-full object-cover" :alt="feedTitle(item, i)" />
              </div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
            <Smartphone class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            挑选建议：把手机横过来远距离扫一眼，最先「跳进眼睛」的那张通常就是信息流里点击率最高的封面；标题尽量把钩子词放在前 8 个字内。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是封面瀑布流预览？</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          封面瀑布流预览是一个纯本地的信息流模拟器：批量上传候选封面后，一键切换抖音三列瀑布流、B站横向卡片、小红书两列竖图和公众号横图列表四种排版，
          在小尺寸、被裁切、与「邻居封面」并排的真实条件下检查自己的封面是否醒目，帮博主在发布前挑出点击率最高的那一张。所有图片仅在浏览器内存里渲染，不会上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">四大平台的信息流排版差异</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><span class="text-foreground font-medium">抖音</span>：三列瀑布流，封面多为 3:4 竖图，下方紧跟标题两行与作者行，竞争极其密集。</li>
          <li><span class="text-foreground font-medium">B站</span>：双列横向卡片，封面 16:10，标题在右侧两行，左下角是播放量——横图构图更重要。</li>
          <li><span class="text-foreground font-medium">小红书</span>：双列瀑布流竖图，标题直接压在封面底部，图上大字与标题不能互相打架。</li>
          <li><span class="text-foreground font-medium">公众号</span>：次条与列表页使用横图小缩略，大图元素在 140px 宽下几乎不可辨认。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何使用本工具</h3>
        <ol class="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>把多张候选封面拖入或点选上传（支持 JPG/PNG/WebP 等浏览器可解码格式）。</li>
          <li>在左侧清单为每张封面填写准备发布的标题文字。</li>
          <li>依次切换四个平台标签，观察每张封面在该平台真实列数与比例下的表现。</li>
          <li>远距离扫一眼，保留第一眼看过去对比度最高、主体最大的那张。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><span class="text-foreground font-medium">上传的封面会传到服务器吗？</span>不会。工具使用浏览器本地对象地址渲染，全程不上传，关闭页面即释放。</li>
          <li><span class="text-foreground font-medium">比例和真机不完全一样？</span>本工具还原的是各平台信息流的核心版式（列数、封面比例、标题位置），像素级排版随版本与屏幕宽度略有差异，用于对比挑选封面足够。</li>
          <li><span class="text-foreground font-medium">封面不是 3:4 或 16:9 怎么办？</span>预览按目标比例居中裁切（object-fit: cover），与平台展示逻辑一致，正好可以提前看到会被裁掉的部分。</li>
        </ul>
      </div>
    </div>

    <RelatedTools :currentToolId="'cover-grid-preview'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  LayoutGrid, Upload, Trash2, Type, X, Eye, Heart, Play,
  Smartphone, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '封面瀑布流预览 - 抖音B站小红书信息流封面模拟 | 有条工具',
  description: '免费在线封面预览工具，批量上传封面图模拟抖音三列瀑布流、B站横向卡片、小红书两列竖图、公众号横图列表四种信息流排版，可填写封面标题，帮博主挑选最醒目封面，纯本地渲染不上传',
  keywords: '封面预览, 瀑布流封面, 抖音封面, B站封面, 小红书封面, 公众号封面, 信息流模拟, 封面尺寸',
  author: '有条工具',
  ogTitle: '封面瀑布流预览 - 信息流封面模拟',
  ogDescription: '批量上传封面，切换抖音/B站/小红书/公众号四种信息流视图，挑出最醒目的一张',
  ogUrl: 'https://www.util.cn/tools/cover-grid-preview',
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
          name: '封面瀑布流预览',
          url: 'https://www.util.cn/tools/cover-grid-preview',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['四平台信息流视图切换', '批量上传封面', '封面标题填写', '瀑布流/卡片/列表排版还原', '本地渲染不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '封面瀑布流预览', item: 'https://www.util.cn/tools/cover-grid-preview/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '上传的封面会传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。工具使用浏览器本地对象地址渲染，全程不上传，关闭页面即释放。' }
            },
            {
              '@type': 'Question',
              name: '预览排版和真机完全一样吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具还原各平台信息流的核心版式（列数、封面比例、标题位置），像素级细节随平台版本略有差异，用于对比挑选封面足够。' }
            },
            {
              '@type': 'Question',
              name: '封面比例不符合要求怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '预览按目标比例居中裁切显示，与平台展示逻辑一致，可提前看到会被裁掉的部分。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'cover-grid-preview')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* __PURE_START__ 纯函数区（供 node 自测提取，勿在此使用浏览器 API） */
const PLATFORM_LAYOUTS = {
  douyin: { columns: 3, ratio: [3, 4], kind: 'waterfall' },
  bilibili: { columns: 2, ratio: [16, 10], kind: 'card' },
  xiaohongshu: { columns: 2, ratio: [3, 4], kind: 'waterfall' },
  gzh: { columns: 1, ratio: [16, 9], kind: 'list' }
}
function layoutSpec (platform) {
  return PLATFORM_LAYOUTS[platform] || null
}
function feedTitle (item, i) {
  const t = item && String(item.title || '').trim()
  return t || ('未命名封面 ' + (i + 1))
}
function baseName (name) {
  const s = String(name || '').split(/[\\/]/).pop() || ''
  return s.replace(/\.[^.]+$/, '') || '未命名'
}
function fakeViews (i) {
  return 1200 + ((i + 1) * 3721) % 46000
}
function likeCount (i) {
  return 300 + ((i + 1) * 967) % 9000
}
function readCount (i) {
  return 800 + ((i + 1) * 2311) % 60000
}
function fakeDuration (i) {
  const m = String((i % 9) + 1).padStart(2, '0')
  const s = String((i * 13) % 60).padStart(2, '0')
  return m + ':' + s
}
function fakeDate (i) {
  return '2026-10-' + String((i % 19) + 1).padStart(2, '0')
}
function summaryText (item, i) {
  const t = feedTitle(item, i)
  return t + '——点击上方标题查看完整内容，这里是列表页摘要占位文字，用于检查标题与摘要在小图排版下的观感。'
}
function fmtCount (n) {
  if (n >= 10000) return (Math.round(n / 1000) / 10).toFixed(1) + '万'
  return String(n)
}
function isEmptyGallery (images) {
  return !images || images.length === 0
}
/* __PURE_END__ */

// ---------- 状态 ----------
const fileInput = ref(null)
const isDragging = ref(false)
const images = ref([])
const platform = ref('douyin')
const seoContentVisible = ref(true)
let nextId = 1

const platforms = [
  { value: 'douyin', label: '抖音风 · 3列' },
  { value: 'bilibili', label: 'B站风 · 横向卡片' },
  { value: 'xiaohongshu', label: '小红书风 · 2列' },
  { value: 'gzh', label: '公众号风 · 列表' }
]

const spec = computed(() => layoutSpec(platform.value) || layoutSpec('douyin'))
const currentPlatformLabel = computed(() => {
  const p = platforms.find(x => x.value === platform.value)
  return p ? p.label : ''
})
const isEmpty = computed(() => isEmptyGallery(images.value))

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 文件处理（浏览器 API 仅在回调/钩子内） ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  addFiles(e.target.files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  addFiles(e.dataTransfer?.files)
}

const addFiles = (list) => {
  for (const f of Array.from(list || [])) {
    if (!f.type || !f.type.startsWith('image/')) continue
    const objectUrl = URL.createObjectURL(f)
    images.value.push({ id: nextId++, url: objectUrl, name: f.name, title: '' })
  }
}

const removeImage = (i) => {
  const item = images.value[i]
  if (item) URL.revokeObjectURL(item.url)
  images.value.splice(i, 1)
}

const clearAll = () => {
  for (const item of images.value) URL.revokeObjectURL(item.url)
  images.value = []
}

onBeforeUnmount(() => {
  for (const item of images.value) URL.revokeObjectURL(item.url)
})
</script>
