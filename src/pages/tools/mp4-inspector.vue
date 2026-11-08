<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileVideo class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">MP4信息查看器</h1>
          <p class="text-sm text-muted-foreground mt-1">解析 MP4/MOV 内部 box 结构：时长、编码、分辨率、码率、帧率一目了然</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        选择本地视频文件，工具用内置的 ISO-BMFF 解析器逐字节读取 MP4/MOV 容器：ftyp 品牌、mvhd 时长、
        tkhd 分辨率与旋转矩阵、stsd 编码器（H.264/H.265/AV1/AAC…）、stts/stsz 帧数与帧率、btrt 码率、
        moof 分片（fMP4）与 iTunes 元数据全部就地解析，并展示完整的 box 树（路径、大小、偏移）。
        支持 mp4 / m4v / mov，WebM/MKV 等其他容器会得到明确的「不是 MP4/MOV」提示。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解析在本地内存中完成，视频不会上传到任何服务器。
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：文件选择与元数据 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 选择视频文件
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
              accept=".mp4,.mov,.m4v,video/mp4,video/quicktime"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击或拖入 mp4 / m4v / mov 文件</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 纯本地解析，不上传
            </p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <FileVideo class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">{{ formatSize(fileSize) }}<span v-if="info"> · {{ containerLabel }}</span></p>
            </div>
            <button @click="clearFile" class="p-1 text-muted-foreground hover:text-destructive" title="移除">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="fileSize > 1024 * 1024 * 1024" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <Info class="w-3 h-3 flex-shrink-0" /> 文件超过 1GB：解析需要把整个文件读入内存，小内存设备可能卡顿。
          </p>
          <p v-if="parsing" class="text-sm text-muted-foreground mt-3 flex items-center gap-2">
            <Loader2 class="w-4 h-4 animate-spin" /> 正在本地解析 box 结构...
          </p>
          <div v-if="parseError" class="mt-3 flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <FileWarning class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ parseError }}</span>
          </div>
          <div v-if="warnings.length" class="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-3">
            <Info class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium mb-1">解析警告（文件存在不规范或损坏的结构，以下内容已尽力解析）：</p>
              <ul class="list-disc pl-4 space-y-0.5">
                <li v-for="(w, i) in warnings" :key="i">{{ w }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 元数据 -->
        <div v-if="metadataEntries.length" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Braces class="w-5 h-5 mr-2 text-primary" /> 元数据（moov.meta.ilst）
          </h2>
          <div class="space-y-2 text-sm">
            <div v-for="m in metadataEntries" :key="m.key" class="flex justify-between gap-4">
              <span class="text-muted-foreground flex-shrink-0">{{ m.label }}</span>
              <span class="text-foreground text-right break-all">{{ m.value }}</span>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div v-if="!info && !parseError" class="bg-card border border-dashed border-border rounded-lg p-6 text-sm text-muted-foreground space-y-2">
          <p class="font-medium text-foreground flex items-center gap-2"><Info class="w-4 h-4 text-primary" /> 能看到什么</p>
          <p>· 摘要卡：时长、分辨率（含旋转修正）、视频/音频编码与档位、码率、帧数、帧率、是否分片封装</p>
          <p>· 轨道列表：每条视频/音频轨的 fourcc、采样率、声道、语言等</p>
          <p>· 完整 box 树：每个 box 的路径、大小与文件偏移，可逐层折叠</p>
        </div>
      </div>

      <!-- 右侧：摘要卡与 box 树 -->
      <div class="space-y-6">
        <div v-if="info" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 媒体摘要
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">时长</p>
              <p class="font-bold text-foreground">{{ summary.duration }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">分辨率</p>
              <p class="font-bold text-foreground">{{ summary.resolution }}</p>
              <p v-if="summary.resolutionNote" class="text-[10px] text-muted-foreground mt-0.5">{{ summary.resolutionNote }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">视频编码</p>
              <p class="font-bold text-foreground">{{ summary.videoCodec }}</p>
              <p v-if="summary.videoProfile" class="text-[10px] text-muted-foreground mt-0.5">{{ summary.videoProfile }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">音频编码</p>
              <p class="font-bold text-foreground">{{ summary.audioCodec }}</p>
              <p v-if="summary.audioDetail" class="text-[10px] text-muted-foreground mt-0.5">{{ summary.audioDetail }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">码率</p>
              <p class="font-bold text-foreground">{{ summary.bitrate }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">{{ summary.bitrateSource }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">帧数</p>
              <p class="font-bold text-foreground">{{ summary.frameCount }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">帧率</p>
              <p class="font-bold text-foreground">{{ summary.fps }}</p>
              <p v-if="summary.fpsNote" class="text-[10px] text-muted-foreground mt-0.5">{{ summary.fpsNote }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">封装</p>
              <p class="font-bold" :class="info.fragmented ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'">{{ summary.container }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">{{ summary.containerNote }}</p>
            </div>
          </div>

          <div v-if="info.brands" class="bg-muted/50 rounded-lg p-3 text-xs mb-4">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-muted-foreground">major brand：</span>
              <span class="font-mono font-medium text-foreground bg-background border border-border rounded px-1.5 py-0.5">{{ info.brands.major }}</span>
              <span class="text-muted-foreground ml-2">兼容：</span>
              <span v-for="b in info.brands.compatible" :key="b" class="font-mono text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">{{ b }}</span>
            </div>
          </div>

          <div v-if="trackLines.length" class="space-y-2">
            <p class="text-xs font-medium text-muted-foreground">轨道（{{ trackLines.length }}）</p>
            <div v-for="tl in trackLines" :key="tl.id" class="text-xs bg-muted/50 border border-border rounded-lg px-3 py-2 leading-relaxed">
              <span class="font-semibold text-foreground">{{ tl.head }}</span>
              <span v-for="(seg, i) in tl.segs" :key="i" class="text-muted-foreground"> · {{ seg }}</span>
            </div>
          </div>
        </div>

        <!-- box 树 -->
        <div v-if="info && treeRows.length" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold flex items-center">
              <ListTree class="w-5 h-5 mr-2 text-primary" /> box 结构树
            </h2>
            <div class="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{{ visibleNodeCount }} / {{ totalNodeCount }} 个 box</span>
              <button
                @click="toggleExpandAll"
                class="px-2 py-1 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors"
              >{{ allExpanded ? '全部折叠' : '全部展开' }}</button>
            </div>
          </div>
          <div class="font-mono text-xs overflow-x-auto">
            <button
              v-for="row in treeRows"
              :key="row.node.path + '@' + row.node.offset"
              class="flex items-baseline gap-2 w-full text-left py-1 rounded hover:bg-muted/60 transition-colors"
              :class="{ 'cursor-pointer': row.hasChildren }"
              :style="{ paddingLeft: row.depth * 14 + 4 + 'px' }"
              @click="row.hasChildren && toggleNode(row.node.path)"
            >
              <ChevronRight
                v-if="row.hasChildren"
                class="w-3 h-3 flex-shrink-0 self-center transition-transform text-muted-foreground"
                :class="{ 'rotate-90': !isCollapsed(row.node.path) }"
              />
              <span v-else class="w-3 flex-shrink-0"></span>
              <span class="font-semibold text-foreground">{{ row.node.type }}</span>
              <span class="text-muted-foreground">{{ formatSize(row.node.size) }}</span>
              <span class="text-muted-foreground/70">@ {{ row.node.offset }}</span>
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!info && !parseError" class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          选择 MP4/MOV 文件后，这里会显示媒体摘要与完整 box 结构树
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 MP4 信息查看</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            MP4 不是一整块黑盒，而是一棵由 box（也叫 atom）组成的树：ftyp 声明容器品牌，moov 里的 mvhd/tkhd/stsd
            分别描述时长、轨道与编码器，mdat 存实际音视频数据。想知道视频是什么编码、什么分辨率、多少帧率、
            码率有没有虚标，读 box 就能得到比播放器「属性」面板更准确的答案。本工具内置了一个纯 JS 的 ISO-BMFF
            解析器，按 ISO/IEC 14496-12/14 的字节布局就地解析，不依赖任何第三方库，也不用联网。
          </p>
          <h3 class="text-lg font-semibold text-foreground">什么场景会用到</h3>
          <p>
            排查「为什么这个视频导入剪辑软件时间轴显示 0 秒」（常见于分片 fMP4 或缺 mvhd）；确认录制/转码产物
            是不是真的 H.265、是不是用了 High profile；对比不同压缩参数下的码率与帧率；检查手机竖拍视频的
            旋转矩阵（画面显示尺寸与编码尺寸不一致的原因）；以及看懂一个 MOV 文件里到底塞了多少轨。
          </p>
          <h3 class="text-lg font-semibold text-foreground">怎么读 box 树</h3>
          <p>
            树中每一行显示 box 类型、大小与在文件中的偏移。顶层通常是 ftyp / moov / mdat / free；展开 moov
            可以逐层看到 trak（轨）→ mdia（媒体）→ minf → stbl（样本表）→ stsd（编码描述）。路径就是定位依据，
            例如 moov.trak.mdia.minf.stbl.stsd.avc1.avcC 里藏着 H.264 的 profile 与 level。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些文件？</span>MP4 家族（ftyp 容器）与 QuickTime MOV 都支持；WebM/MKV 是 EBML 容器、AVI 是 RIFF 容器，结构完全不同，工具会明确报「不是 MP4/MOV 容器」而不是硬解析出错误结果。</li>
            <li><span class="text-foreground font-medium">为什么有的文件时长或帧数显示「-」？</span>分片封装（fMP4，存在 moof）的文件把样本表拆进了分片里，mvhd/stts 里常常没有总时长与总帧数；此时工具会尽量用 mehd 或按体积估算码率，并如实标注数据来源。</li>
            <li><span class="text-foreground font-medium">码率数字是哪来的？</span>优先使用文件里 btrt box（或 esds 描述符）声明的平均码率，没有时按「文件大小 × 8 ÷ 时长」估算，卡片下方会标注来源，估算值包含容器开销。</li>
            <li><span class="text-foreground font-medium">旋转的视频分辨率怎么算？</span>tkhd 里的 3×3 矩阵记录了 90°/180°/270° 旋转，工具会同时给出编码尺寸与旋转后的实际显示尺寸（宽高互换）。</li>
            <li><span class="text-foreground font-medium">文件会被上传吗？</span>不会。解析在浏览器本地内存中完成，页面没有任何网络请求行为，断网也能用。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mp4-inspector'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileVideo, FileUp, FileWarning, Upload, X, Loader2, ShieldCheck, Info,
  ChevronUp, ChevronDown, ChevronRight, ListTree, Gauge, Braces
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'
import { parseMp4 } from '~/utils/mp4-parser'

// SEO
useSeoMeta({
  title: 'MP4信息查看器 - 解析视频编码/分辨率/码率/帧率与box结构',
  description: '免费在线 MP4/MOV 信息查看器：本地解析 ftyp 品牌、时长、H.264/H.265 编码与 profile、分辨率与旋转、码率、帧数帧率、分片 fMP4 与完整 box 树，纯浏览器本地解析不上传',
  keywords: 'MP4信息查看, 视频编码查看, 视频分辨率查询, 视频码率, mp4分析, box结构, mov信息, 视频帧率查看',
  author: 'Util工具箱',
  ogTitle: 'MP4信息查看器 - 有条工具',
  ogDescription: '解析 MP4/MOV 内部结构：时长、编码、分辨率、码率、帧率一目了然，本地解析不上传',
  ogUrl: 'https://www.util.cn/tools/mp4-inspector',
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
          name: 'MP4信息查看器',
          url: 'https://www.util.cn/tools/mp4-inspector',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['ftyp 品牌与兼容列表', '时长与分辨率（含旋转修正）', '编码 fourcc 与 profile/level', '码率（btrt 或体积估算）', '帧数与帧率推算', '分片 fMP4 识别', '完整 box 结构树', '本地解析不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: 'MP4信息查看器', item: 'https://www.util.cn/tools/mp4-inspector/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '支持哪些文件格式？',
              acceptedAnswer: { '@type': 'Answer', text: '支持 MP4 家族（ftyp 容器）与 QuickTime MOV；WebM/MKV、AVI 等容器结构不同，工具会明确提示「不是 MP4/MOV 容器」。' }
            },
            {
              '@type': 'Question',
              name: '为什么有的文件时长或帧数显示不出来？',
              acceptedAnswer: { '@type': 'Answer', text: '分片封装（fMP4）把样本表拆进了 moof 分片，mvhd/stts 里常常没有总时长与总帧数，工具会尽量用 mehd 兜底并如实标注。' }
            },
            {
              '@type': 'Question',
              name: '码率数字是怎么来的？',
              acceptedAnswer: { '@type': 'Answer', text: '优先读取文件内 btrt box 或 esds 描述符声明的平均码率；没有时按「文件大小 × 8 ÷ 时长」估算，并标注数据来源。' }
            },
            {
              '@type': 'Question',
              name: '文件会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析在浏览器本地内存中完成，页面没有任何上传行为，断网也能使用。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'mp4-inspector')

// ---------- 状态 ----------
const fileInput = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const isDragging = ref(false)
const parsing = ref(false)
const parseError = ref('')
const info = ref(null)
const seoContentVisible = ref(true)

// box 树折叠状态（path → 是否折叠）
const collapsedMap = ref({})

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 展示辅助 ----------
const formatSize = (bytes) => {
  const n = Number(bytes)
  if (!n || n <= 0) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

const formatBitrate = (bps) => {
  if (!bps || bps <= 0) return '-'
  if (bps >= 1000000) return (bps / 1000000).toFixed(2) + ' Mbps'
  return Math.round(bps / 1000) + ' kbps'
}

const formatDuration = (sec) => {
  if (sec == null || !isFinite(sec) || sec <= 0) return '-'
  const total = Math.round(sec * 1000) / 1000
  const m = Math.floor(total / 60)
  const s = total - m * 60
  return s < 10 ? `${m}:0${s.toFixed(2)}` : `${m}:${s.toFixed(2)}`
}

const METADATA_LABELS = {
  title: '标题', artist: '艺术家', albumArtist: '专辑艺术家', album: '专辑',
  composer: '作曲', date: '日期', genre: '流派', encoder: '编码器',
  comment: '注释', description: '描述', lyrics: '歌词', copyright: '版权'
}

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const clearFile = () => {
  fileName.value = ''
  fileSize.value = 0
  info.value = null
  parseError.value = ''
  collapsedMap.value = {}
}

const acceptFile = async (f) => {
  if (!f) return
  parseError.value = ''
  info.value = null
  fileName.value = f.name
  fileSize.value = f.size
  parsing.value = true
  try {
    // 用户手势回调内读取文件（浏览器 API 不进 setup 阶段）
    const buf = await f.arrayBuffer()
    const result = parseMp4(buf)
    if (result.notContainer) {
      parseError.value = result.errors[0] || '不是 MP4/MOV 容器，无法解析'
      info.value = null
    } else {
      info.value = result
      collapsedMap.value = {}
    }
  } catch (err) {
    parseError.value = '解析失败：' + (err && err.message ? err.message : '读取文件时出现未知错误')
    info.value = null
  } finally {
    parsing.value = false
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

// ---------- 摘要计算 ----------
const videoTrack = computed(() => (info.value ? info.value.tracks.find((t) => t.kind === 'video') : null))
const audioTrack = computed(() => (info.value ? info.value.tracks.find((t) => t.kind === 'audio') : null))

const warnings = computed(() => (info.value ? info.value.errors : []))
const containerLabel = computed(() => {
  const r = info.value
  if (!r) return ''
  return (r.fileType === 'mov' ? 'QuickTime MOV' : 'MP4') + (r.fragmented ? ' · 分片 fMP4' : '')
})

// 旋转 90/270 时显示宽高互换
function displayDims(track) {
  if (!track) return null
  const w = track.width != null ? track.width : track.codedWidth
  const h = track.height != null ? track.height : track.codedHeight
  if (w == null || h == null) return null
  if (track.rotation === 90 || track.rotation === 270) return { w: h, h: w }
  return { w, h }
}

const summary = computed(() => {
  const r = info.value
  if (!r) return null
  const vt = videoTrack.value
  const at = audioTrack.value
  const dims = displayDims(vt)
  const encodedDims = vt && vt.codedWidth ? vt.codedWidth + '×' + vt.codedHeight : null

  // 码率：优先 btrt/esds 声明（各轨求和），否则按体积估算
  const declared = r.tracks.reduce((sum, t) => sum + (t.bitrate && t.bitrate.avgBitrate > 0 ? t.bitrate.avgBitrate : 0), 0)
  const bitrate = declared > 0 ? formatBitrate(declared) : formatBitrate(r.estimatedBitrate)
  const bitrateSource = declared > 0 ? 'btrt/esds 声明' : r.estimatedBitrate > 0 ? '按体积估算' : '-'

  const codecText = (t) => {
    if (!t) return '-'
    const fourcc = t.codec || '?'
    return t.codecName && t.codecName !== fourcc ? fourcc + ' ' + t.codecName : fourcc
  }
  let videoProfile = ''
  if (vt && vt.codecDetail) {
    videoProfile = vt.codecDetail.profileName + ' @ L' + vt.codecDetail.levelText
  }
  let audioDetail = ''
  if (at) {
    const parts = []
    if (at.audioDetail && at.audioDetail.aotName) parts.push(at.audioDetail.aotName)
    if (at.channels) parts.push(at.channels + ' 声道')
    if (at.sampleRate) parts.push(at.sampleRate >= 1000 ? (at.sampleRate / 1000).toFixed(1).replace(/\.0$/, '') + ' kHz' : at.sampleRate + ' Hz')
    audioDetail = parts.join(' · ')
  }
  const resolutionNoteParts = []
  if (vt && encodedDims && dims && encodedDims !== dims.w + '×' + dims.h) {
    resolutionNoteParts.push('编码 ' + encodedDims)
  }
  if (vt && vt.rotation) {
    resolutionNoteParts.push('画面旋转 ' + vt.rotation + '°')
  }
  return {
    duration: r.durationSec > 0 ? formatDuration(r.durationSec) : '-',
    resolution: dims ? dims.w + '×' + dims.h : '-',
    resolutionNote: resolutionNoteParts.join(' · '),
    videoCodec: codecText(vt),
    videoProfile,
    audioCodec: codecText(at),
    audioDetail,
    bitrate,
    bitrateSource,
    frameCount: vt && vt.frameCount > 0 ? vt.frameCount.toLocaleString('en-US') : '-',
    fps: vt && vt.fps ? vt.fps + ' fps' : '-',
    fpsNote: vt && vt.fps ? 'stts 样本间隔平均推算' : '',
    container: r.fileType === 'mov' ? 'MOV' : 'MP4',
    containerNote: r.fragmented ? '分片 fMP4（含 moof）' : r.mvhdVersion === 1 ? 'mvhd v1' : '常规'
  }
})

const metadataEntries = computed(() => {
  const r = info.value
  if (!r) return []
  return Object.entries(r.metadata || {})
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => ({ key: k, label: METADATA_LABELS[k] || k, value: String(v).length > 200 ? String(v).slice(0, 200) + '…' : String(v) }))
})

const HANDLER_ZH = { vide: '视频', soun: '音频', hint: '流提示', meta: '元数据', text: '文本', tmcd: '时间码', clcp: '字幕', sbtl: '字幕', subp: '子画面' }

const trackLines = computed(() => {
  const r = info.value
  if (!r) return []
  return r.tracks.map((t, idx) => {
    const kindName = t.kind === 'video' ? '视频' : t.kind === 'audio' ? '音频' : (HANDLER_ZH[t.handler] || t.handler || '未知')
    const segs = []
    if (t.codec) segs.push(t.codec + (t.codecName && t.codecName !== t.codec ? '（' + t.codecName + '）' : ''))
    if (t.kind === 'video') {
      const d = displayDims(t)
      if (d) segs.push(d.w + '×' + d.h)
      if (t.codedWidth && d && t.codedWidth + '×' + t.codedHeight !== d.w + '×' + d.h) segs.push('编码 ' + t.codedWidth + '×' + t.codedHeight)
      if (t.rotation) segs.push('旋转 ' + t.rotation + '°')
      if (t.fps) segs.push(t.fps + ' fps')
      if (t.frameCount > 0) segs.push(t.frameCount.toLocaleString('en-US') + ' 帧')
      if (t.maxSampleSize > 0) segs.push('最大帧 ' + formatSize(t.maxSampleSize))
    }
    if (t.kind === 'audio') {
      if (t.audioDetail && t.audioDetail.aotName) segs.push(t.audioDetail.aotName)
      if (t.channels) segs.push(t.channels + ' 声道')
      if (t.sampleRate) segs.push(t.sampleRate + ' Hz')
      if (t.sampleSize) segs.push(t.sampleSize + ' bit')
    }
    if (t.bitrate && t.bitrate.avgBitrate > 0) segs.push('码率 ' + formatBitrate(t.bitrate.avgBitrate))
    else if (t.estimatedBitrate > 0) segs.push('估算码率 ' + formatBitrate(t.estimatedBitrate))
    if (t.language && t.language !== 'und') segs.push('语言 ' + t.language)
    if (t.durationSec > 0) segs.push('轨时长 ' + formatDuration(t.durationSec))
    return { id: (t.id != null ? 't' + t.id : 'i' + idx) + '-' + idx, head: '#' + (idx + 1) + ' ' + kindName + '轨', segs }
  })
})

// ---------- box 树 ----------
const flattenTree = (nodes, depth, out) => {
  for (const n of nodes || []) {
    const hasChildren = !!(n.children && n.children.length)
    out.push({ node: n, depth, hasChildren })
    if (hasChildren && !isCollapsed(n.path)) flattenTree(n.children, depth + 1, out)
  }
  return out
}

const isCollapsed = (path) => !!collapsedMap.value[path]
const toggleNode = (path) => {
  collapsedMap.value = { ...collapsedMap.value, [path]: !collapsedMap.value[path] }
}

const treeRows = computed(() => (info.value ? flattenTree(info.value.boxes, 0, []) : []))
const totalNodeCount = computed(() => {
  const count = (nodes) => (nodes || []).reduce((s, n) => s + 1 + count(n.children), 0)
  return info.value ? count(info.value.boxes) : 0
})
const visibleNodeCount = computed(() => treeRows.value.length)
const allExpanded = computed(() => {
  const hasCollapsed = (nodes) => (nodes || []).some((n) => (n.children && n.children.length && (isCollapsed(n.path) || hasCollapsed(n.children))))
  return info.value ? !hasCollapsed(info.value.boxes) : false
})
const toggleExpandAll = () => {
  if (allExpanded.value) {
    // 全部折叠：收集所有有子节点的 path
    const map = {}
    const walk = (nodes) => (nodes || []).forEach((n) => {
      if (n.children && n.children.length) { map[n.path] = true; walk(n.children) }
    })
    walk(info.value.boxes)
    collapsedMap.value = map
  } else {
    collapsedMap.value = {}
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
</script>
