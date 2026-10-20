<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Video class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频压缩</h1>
          <p class="text-sm text-muted-foreground mt-1">浏览器本地重编码缩小视频体积，解决微信发送超限，视频不上传</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        选择本地视频，按需降低分辨率（原始/720p/540p/480p）、选择码率档（高/中/低），可一键静音。
        工具采用 MediaRecorder 实时重编码方案：视频在本地播放的同时逐帧绘制到 canvas 并录制为
        WebM（VP8/Opus），输出体积由目标码率决定。压缩全程在浏览器完成，视频不会上传服务器。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解码、缩放与重编码全部在本机完成，视频不会上传到任何服务器。
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
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
              accept="video/*,.mp4,.webm,.mov,.m4v"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击或拖入视频文件（上限 1GB）</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 本地压缩，视频不上传
            </p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Video class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">
                {{ formatSize(fileSize) }}<span v-if="duration"> · 时长 {{ formatTime(duration) }}</span><span v-if="videoSize.w"> · {{ videoSize.w }}×{{ videoSize.h }}</span>
              </p>
            </div>
            <button @click="clearFile" class="p-1 text-muted-foreground hover:text-destructive" title="移除">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="fileSize > 300 * 1024 * 1024" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <Info class="w-3 h-3 flex-shrink-0" /> 大文件提醒：超过 300MB 的视频在浏览器中解码回放会占用较多内存，请关闭多余标签页后再压缩。
          </p>
        </div>

        <!-- 压缩设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 压缩设置
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">目标分辨率（长边上限）</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="r in resOptions"
                :key="r.id"
                @click="resPreset = r.id"
                :disabled="recording"
                :class="resPreset === r.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >{{ r.label }}</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">码率档位</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="q in qualityOptions"
                :key="q.id"
                @click="quality = q.id"
                :disabled="recording"
                :class="quality === q.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              >{{ q.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">分辨率越低、码率档越低，压缩率越高；过低会明显模糊</p>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="muteAudio"
              type="checkbox"
              id="compressMute"
              :disabled="recording"
              class="w-4 h-4 rounded border-border"
            />
            <label for="compressMute" class="text-sm text-foreground">静音输出（去掉音轨可再省约 16% 体积）</label>
          </div>

          <!-- 输出预估 -->
          <div class="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">预计输出尺寸</span>
              <span class="text-foreground font-medium">{{ outDims.w ? outDims.w + '×' + outDims.h : '选择视频后显示' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">目标视频码率</span>
              <span class="text-foreground font-medium">{{ (targetBitrate / 1000).toFixed(0) }} kbps<span v-if="!muteAudio"> + 音频 128 kbps</span></span>
            </div>
            <div v-if="estBytes > 0" class="flex justify-between">
              <span class="text-muted-foreground">预计输出体积</span>
              <span class="text-foreground font-medium">{{ formatSize(estBytes) }}<span v-if="estRatio > 0" class="text-green-600 dark:text-green-400 ml-1">（约再省 {{ Math.round(estRatio * 100) }}%）</span></span>
            </div>
            <p v-if="estBytes > 0 && estBytes >= fileSize" class="text-amber-600 dark:text-amber-400">
              预计输出不小于原视频：原片码率可能已经很低，建议换更高分辨率/低压缩档，或直接静音。
            </p>
          </div>

          <button
            @click="startCompress"
            :disabled="!duration || recording || !canRecord"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="recording" class="w-4 h-4 animate-spin" />
            <Video v-else class="w-4 h-4" />
            {{ recording ? '实时压缩中，请勿切换标签页' : '开始压缩（耗时≈视频时长）' }}
          </button>

          <button
            v-if="recording"
            @click="stopEarly"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-all"
          >
            提前停止（输出已录制的部分）
          </button>

          <!-- 进度条（播放进度） -->
          <div v-if="recording || progress > 0">
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: Math.min(100, Math.round(progress * 100)) + '%' }"></div>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1.5">已录制 {{ formatTime(elapsedSeconds) }} / {{ formatTime(duration) }}（按播放进度实时计算）</p>
          </div>

          <div v-if="error" class="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <FileWarning class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>
          <div v-if="warnText" class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-3">
            <Info class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ warnText }}</span>
          </div>

          <p class="text-[10px] text-muted-foreground leading-relaxed">
            方式说明：本工具采用「实时录制」重编码——视频播放一遍、同步录制一遍，所需时间约等于视频时长；
            输出为兼容性广的 WebM（VP8/Opus），mp4 可先用站内格式工具查看兼容性；
            实际画质与体积因浏览器编码器实现而异。录制期间请保持页面在前台。
          </p>
        </div>

        <!-- 浏览器不支持提示 -->
        <div v-if="supportChecked && !canRecord" class="bg-card border border-amber-500/40 rounded-lg p-4 space-y-2">
          <p class="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <FileWarning class="w-4 h-4" /> 当前浏览器不支持本压缩方式
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            压缩依赖 canvas.captureStream 与 MediaRecorder 视频录制能力（新版 Chrome / Edge / Firefox 支持）。
            请更换浏览器后重试，或使用系统自带工具（如手机剪辑 App、QuickTime「导出为 4K/1080p」）压缩。
          </p>
        </div>
      </div>

      <!-- 右侧：预览与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 视频预览 -->
        <div v-if="videoUrl" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <MonitorPlay class="w-5 h-5 mr-2 text-primary" /> 原视频预览<span v-if="recording" class="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">（压缩进行中，正在实时播放录制）</span>
          </h2>
          <video
            ref="videoEl"
            :src="videoUrl"
            playsinline
            preload="auto"
            controls
            class="w-full max-h-96 rounded-lg bg-black"
            @loadedmetadata="onLoadedMetadata"
            @error="onVideoError"
            @timeupdate="onTimeUpdate"
            @ended="onVideoEnded"
          ></video>
        </div>

        <!-- 压缩结果 -->
        <div v-if="resultUrl" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle2 class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 压缩完成{{ partialNote }}
          </h2>
          <video
            :src="resultUrl"
            playsinline
            controls
            class="w-full max-h-96 rounded-lg bg-black mb-4"
          ></video>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">原始大小</p>
              <p class="font-bold text-foreground">{{ formatSize(fileSize) }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">压缩后</p>
              <p class="font-bold text-green-600 dark:text-green-400">{{ formatSize(resultInfo ? resultInfo.size : 0) }}</p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">压缩率</p>
              <p class="font-bold" :class="actualRatio >= 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                {{ actualRatio >= 0 ? '省 ' + Math.round(actualRatio * 100) + '%' : '+' + Math.round(-actualRatio * 100) + '%（变大）' }}
              </p>
            </div>
            <div class="p-3 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-1">输出规格</p>
              <p class="font-bold text-foreground">{{ outDims.w }}×{{ outDims.h }} · {{ muteAudio ? '无声' : '含音轨' }}</p>
            </div>
          </div>
          <p v-if="actualRatio < 0" class="text-xs text-amber-600 dark:text-amber-400 mb-3">
            输出反而变大：原视频码率已低于目标码率（或被录制开销抬高），建议降低分辨率档位或选「低码率」重试。
          </p>
          <button
            @click="downloadResult"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Download class="w-4 h-4" /> 保存压缩结果（{{ formatSize(resultInfo ? resultInfo.size : 0) }}）
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="!videoUrl && !resultUrl" class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          选择视频后，这里会显示原视频预览与压缩结果
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线视频压缩</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            微信发不了超过 25MB 的视频、网盘上传太慢、素材库占满磁盘——这些场景都需要给视频「瘦身」。
            本工具在浏览器里完成解压播放、缩放重绘与 WebM 重编码，视频自始至终不离开你的电脑；
            相比上传到云端排队压缩，本地处理更快也更适合隐私内容（会议录屏、家庭视频）。
          </p>
          <h3 class="text-lg font-semibold text-foreground">实时录制式压缩是怎么工作的</h3>
          <p>
            浏览器没有公开「一键重编码视频文件」的 API，本工具采用的方案相当于：把视频当作直播源，
            播放的同时逐帧绘制到 canvas，canvas.captureStream() 产出视频轨，再与音轨合并交给 MediaRecorder
            按目标码率录制为 WebM。因此压缩一遍的时间约等于视频时长，且效果取决于当前浏览器的 VP8/Opus 编码器实现；
            追求更快、更小、更保真的专业压缩，请交给桌面版 FFmpeg 或剪辑软件。
          </p>
          <h3 class="text-lg font-semibold text-foreground">参数怎么设：微信 25MB 上限示例</h3>
          <p>
            体积 ≈ 总码率 × 时长 ÷ 8。以 2 分钟视频为例：目标 24MB 以内 → 总码率 ≤ 1600kbps →
            选「480p + 低码率 + 保留音频」通常可达；60 秒以内的短片选「720p + 中码率」画质更均衡。
            工具面板会实时显示目标码率与预计体积，按「预计输出 ≤ 平台限制」倒推即可。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">输出的 WebM 发微信、传抖音能用吗？</span>主流 App 与网页端（微信/抖音/B站/小红书）都能接受或自动转码 WebM；若目标平台只认 mp4，请选低码率后先用平台自带的上传压缩，或使用桌面工具转换容器格式。</li>
            <li><span class="text-foreground font-medium">为什么压缩完反而更大了？</span>实时录制存在码率下限与容器开销，源视频码率极低（如已被强压缩过）时输出可能变大，工具会明确提示并建议换更低档位。</li>
            <li><span class="text-foreground font-medium">中途可以停止吗？关掉页面会怎样？</span>录制中可点「提前停止」拿到已录制的部分；关闭页面或切走标签页会中断录制，所有进度不落盘，请保持页面在前台直至完成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'video-compressor'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Video, FileUp, FileWarning, Upload, Download, X, Loader2, CheckCircle2,
  Settings2, MonitorPlay, ShieldCheck, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '视频压缩 - 浏览器重编码缩小视频体积，解决微信发送超限',
  description: '免费在线视频压缩：本地 MediaRecorder 重编码，分辨率原始/720p/540p/480p、高中低码率档与静音可选，实时显示压缩前后大小与压缩率，视频不上传服务器',
  keywords: '视频压缩, 视频变小, 微信视频超限, 视频瘦身, 在线压缩视频, webm转码, 降低码率',
  author: 'Util工具箱',
  ogTitle: '视频压缩 - 有条工具',
  ogDescription: '浏览器重编码压缩视频体积，解决微信发送超限，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/video-compressor',
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
          name: '视频压缩',
          url: 'https://www.util.cn/tools/video-compressor',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['分辨率降档压缩', '高中低码率档', '静音输出', '预计体积估算', '压缩前后对比', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '视频压缩', item: 'https://www.util.cn/tools/video-compressor/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '输出的 WebM 发微信、传抖音能用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '主流 App 与网页端都能接受或自动转码 WebM；若目标平台只认 mp4，可先用平台自带上传压缩或桌面工具转换容器格式。' }
            },
            {
              '@type': 'Question',
              name: '为什么压缩完反而更大了？',
              acceptedAnswer: { '@type': 'Answer', text: '实时录制存在码率下限与容器开销，源视频码率极低时输出可能变大，工具会提示并建议换更低的分辨率或码率档。' }
            },
            {
              '@type': 'Question',
              name: '压缩要多久？中途可以停止吗？',
              acceptedAnswer: { '@type': 'Answer', text: '采用实时录制式重编码，耗时约等于视频时长；录制中可提前停止并拿到已录制的部分，关闭页面会中断录制。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'video-compressor')

// ---------- 纯函数（node 自测覆盖） ----------
// 分辨率预设 → 长边上限（0 = 不缩小）；720p 的长边即 1280，以此类推
const RES_CAPS = { original: 0, '720p': 1280, '540p': 960, '480p': 854 }
// 码率系数：码率 ≈ 像素面积 × 30fps × 系数（bpp·帧），高/中/低三档
const QUALITY_FACTORS = { high: 0.15, medium: 0.1, low: 0.06 }
const AUDIO_BITRATE = 128000
function evenRound(v) { return Math.max(2, Math.round(v / 2) * 2) }
// 目标输出尺寸：只缩小不放大，保持宽高比并取偶数（编码器友好）
function targetDims(w, h, preset) {
  const iw = Math.max(2, Math.round(Number(w) || 2))
  const ih = Math.max(2, Math.round(Number(h) || 2))
  const cap = RES_CAPS[preset] || 0
  if (!cap || Math.max(iw, ih) <= cap) return { w: evenRound(iw), h: evenRound(ih) }
  const s = cap / Math.max(iw, ih)
  return { w: evenRound(iw * s), h: evenRound(ih * s) }
}
// 目标视频码率（bps）：分辨率越小、档位越低，码率越低；钳制在 300kbps～8Mbps
function bitrateFor(dims, quality) {
  const f = QUALITY_FACTORS[quality] || QUALITY_FACTORS.medium
  const w = Math.max(2, dims && dims.w ? dims.w : 640)
  const h = Math.max(2, dims && dims.h ? dims.h : 360)
  const raw = w * h * 30 * f
  return Math.min(8000000, Math.max(300000, Math.round(raw)))
}
// 输出体积估算（字节）：体积 ≈ 总码率 × 时长 ÷ 8
function estimateOutputBytes(bitrate, seconds, keepAudio) {
  const totalBitrate = Math.max(0, Number(bitrate) || 0) + (keepAudio ? AUDIO_BITRATE : 0)
  return Math.round((totalBitrate * Math.max(0, Number(seconds) || 0)) / 8)
}
// 压缩率：正值表示体积减少的百分比
function compressionRatio(originalBytes, outputBytes) {
  if (!originalBytes || originalBytes <= 0) return 0
  return (originalBytes - outputBytes) / originalBytes
}
// ---------- 纯函数结束 ----------

const formatTime = (sec) => {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r}`
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 状态 ----------
const fileInput = ref(null)
const videoEl = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const videoUrl = ref('')
const duration = ref(0)
const videoSize = ref({ w: 0, h: 0 })
const isDragging = ref(false)
const error = ref('')
const warnText = ref('')

const resPreset = ref('720p')
const quality = ref('medium')
const muteAudio = ref(false)
const recording = ref(false)
const progress = ref(0)
const elapsedSeconds = ref(0)
const partial = ref(false)

const resultUrl = ref('')
const resultInfo = ref(null)

const supportChecked = ref(false)
const support = ref({ recorder: false, capture: false, mimeType: '' })

const seoContentVisible = ref(true)

const resOptions = [
  { id: 'original', label: '原始' },
  { id: '720p', label: '720p' },
  { id: '540p', label: '540p' },
  { id: '480p', label: '480p' }
]
const qualityOptions = [
  { id: 'high', label: '高码率' },
  { id: 'medium', label: '中（推荐）' },
  { id: 'low', label: '低码率' }
]

// 非响应式录制内部件
let recorder = null
let rafId = 0
let rvfcId = 0
let chunks = []
// AudioContext 分离音轨的节点（MediaElementSource 与 <video> 元素绑定，创建后复用）
let audioCtx = null
let audioSourceNode = null
let audioDestNode = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const outDims = computed(() => targetDims(videoSize.value.w, videoSize.value.h, resPreset.value))
const targetBitrate = computed(() => bitrateFor(outDims.value, quality.value))
const estBytes = computed(() => estimateOutputBytes(targetBitrate.value, duration.value, !muteAudio.value))
const estRatio = computed(() => compressionRatio(fileSize.value, estBytes.value))
const actualRatio = computed(() => (resultInfo.value ? compressionRatio(fileSize.value, resultInfo.value.size) : 0))
const canRecord = computed(() => support.value.recorder && support.value.capture && !!support.value.mimeType)
const partialNote = computed(() => (partial.value ? '（提前停止，输出为片段）' : ''))

const outputExt = computed(() => {
  const mime = support.value.mimeType || 'video/webm'
  return mime.includes('mp4') ? 'mp4' : 'webm'
})

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 能力检测仅在客户端 onMounted 执行
  const pickMime = () => {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return ''
    const candidates = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm']
    for (let i = 0; i < candidates.length; i++) {
      if (MediaRecorder.isTypeSupported(candidates[i])) return candidates[i]
    }
    return ''
  }
  support.value = {
    recorder: typeof MediaRecorder !== 'undefined',
    capture: typeof HTMLCanvasElement !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function',
    mimeType: pickMime()
  }
  supportChecked.value = true
})

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const clearResult = () => {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultInfo.value = null
  partial.value = false
}

const resetVideo = () => {
  stopRecorderInternal()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  duration.value = 0
  videoSize.value = { w: 0, h: 0 }
  progress.value = 0
  elapsedSeconds.value = 0
  clearResult()
}

const acceptFile = (f) => {
  if (!f) return
  error.value = ''
  warnText.value = ''
  if (!f.type.startsWith('video/')) {
    error.value = '请选择视频文件（mp4 / webm / mov 等）'
    return
  }
  if (f.size > 1024 * 1024 * 1024) {
    error.value = '视频超过 1GB，浏览器重编码容易内存不足，建议先用剪辑工具分段处理'
    return
  }
  resetVideo()
  fileName.value = f.name
  fileSize.value = f.size
  // 用户交互回调内创建对象 URL（浏览器 API）
  videoUrl.value = URL.createObjectURL(f)
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

const clearFile = () => {
  resetVideo()
  error.value = ''
  warnText.value = ''
}

const onLoadedMetadata = () => {
  const v = videoEl.value
  if (!v) return
  duration.value = isFinite(v.duration) ? v.duration : 0
  videoSize.value = { w: v.videoWidth, h: v.videoHeight }
}

const onVideoError = () => {
  error.value = '视频无法在浏览器中播放（编码不受支持），请尝试 mp4（H.264）或 webm 格式'
}

const onTimeUpdate = () => {
  const v = videoEl.value
  if (!v || !duration.value) return
  progress.value = Math.min(1, v.currentTime / duration.value)
  elapsedSeconds.value = v.currentTime
}

// ---------- seek 定位（seeked 事件 + 1.5 秒超时兜底） ----------
const seekTo = (video, t) => {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      video.removeEventListener('seeked', onSeeked)
      clearTimeout(timer)
      resolve()
    }
    const onSeeked = () => {
      requestAnimationFrame(() => finish())
    }
    const timer = setTimeout(finish, 1500)
    video.addEventListener('seeked', onSeeked)
    video.currentTime = t
  })
}

// ---------- 音轨获取：优先元素 captureStream，失败则 AudioContext 分离 ----------
const obtainAudioTracks = (video) => {
  const cs = typeof video.captureStream === 'function'
    ? video.captureStream
    : (typeof video.mozCaptureStream === 'function' ? video.mozCaptureStream : null)
  if (cs) {
    try {
      const s = cs.call(video)
      const at = s.getAudioTracks()
      if (at && at.length) return at
    } catch (err) { /* 落到 AudioContext 路径 */ }
  }
  if (!audioCtx || audioCtx.state === 'closed' || !audioSourceNode) {
    // 回调内创建 AudioContext（浏览器 API）
    audioCtx = new AudioContext()
    audioSourceNode = audioCtx.createMediaElementSource(video)
    audioDestNode = audioCtx.createMediaStreamDestination()
    audioSourceNode.connect(audioDestNode)
    audioSourceNode.connect(audioCtx.destination) // 保持录制期间可正常听到声音
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioDestNode.stream.getAudioTracks()
}

// ---------- 逐帧绘制循环 ----------
const pumpFrame = (ctx, video) => {
  if (!recording.value) return
  try {
    ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height)
  } catch (err) { /* 单帧绘制失败不中断录制 */ }
  if (typeof video.requestVideoFrameCallback === 'function') {
    rvfcId = video.requestVideoFrameCallback(() => pumpFrame(ctx, video))
  } else {
    rafId = requestAnimationFrame(() => pumpFrame(ctx, video))
  }
}

const stopRecorderInternal = () => {
  recording.value = false
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
  if (rvfcId && videoEl.value && typeof videoEl.value.cancelVideoFrameCallback === 'function') {
    try { videoEl.value.cancelVideoFrameCallback(rvfcId) } catch (err) { /* 忽略 */ }
  }
  rvfcId = 0
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop() } catch (err) { /* 忽略 */ }
  }
}

const onVideoEnded = () => {
  // 自然播完：收尾录制
  if (recording.value) {
    partial.value = false
    stopRecorderInternal()
  }
}

const stopEarly = () => {
  if (!recording.value) return
  partial.value = true
  const v = videoEl.value
  if (v) { v.pause(); elapsedSeconds.value = v.currentTime }
  stopRecorderInternal()
}

// ---------- 主流程：实时录制重编码（用户手势触发） ----------
const startCompress = async () => {
  const video = videoEl.value
  if (!video || !duration.value) {
    error.value = '请先选择可播放的视频文件'
    return
  }
  if (!canRecord.value) {
    error.value = '当前浏览器缺少 canvas.captureStream 或 MediaRecorder 视频录制能力，请更换新版 Chrome / Edge / Firefox'
    return
  }
  if (recording.value) return
  error.value = ''
  warnText.value = ''
  clearResult()
  recording.value = true
  progress.value = 0
  elapsedSeconds.value = 0
  try {
    video.pause()
    await seekTo(video, 0)
    const dims = outDims.value
    const canvas = document.createElement('canvas')
    canvas.width = dims.w
    canvas.height = dims.h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, dims.w, dims.h)

    const stream = canvas.captureStream(30)
    const tracks = stream.getVideoTracks().slice()
    if (!muteAudio.value) {
      const at = obtainAudioTracks(video)
      if (at && at.length) {
        tracks.push(...at)
      } else {
        warnText.value = '未能获取音轨（视频可能无声或浏览器限制），本次输出为无声视频。'
      }
    }
    video.muted = muteAudio.value

    const merged = new MediaStream(tracks)
    try {
      recorder = new MediaRecorder(merged, {
        mimeType: support.value.mimeType,
        videoBitsPerSecond: targetBitrate.value,
        audioBitsPerSecond: AUDIO_BITRATE
      })
    } catch (err) {
      error.value = '当前浏览器不支持创建视频录制器，请更换新版 Chrome / Edge / Firefox 后重试'
      recording.value = false
      return
    }
    chunks = []
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data)
    }
    recorder.onerror = () => {
      error.value = '录制出错：请确认视频可正常播放，并保持页面在前台后重试'
      recording.value = false
    }
    recorder.onstop = () => {
      recording.value = false
      recorder = null
      if (!chunks.length) {
        error.value = '未录制到任何数据：视频可能未能播放，请检查浏览器控制台后重试'
        return
      }
      const blob = new Blob(chunks, { type: 'video/webm' })
      chunks = []
      if (blob.size < 1024) {
        error.value = '录制结果异常（数据为空），请重试或更换新版浏览器'
        return
      }
      const base = (fileName.value || 'video').replace(/\.[^.]+$/, '')
      resultUrl.value = URL.createObjectURL(blob)
      resultInfo.value = { name: `${base}-compressed.${outputExt.value}`, size: blob.size }
    }
    recorder.start(1000)
    pumpFrame(ctx, video)
    await video.play()
  } catch (err) {
    recording.value = false
    error.value = '压缩失败：' + (err && err.message ? err.message : '视频未能自动播放，请点击播放按钮后重新开始')
  }
}

const downloadResult = () => {
  if (!resultUrl.value || !resultInfo.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = resultInfo.value.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>
