<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scissors class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">口播静音切除</h1>
          <p class="text-sm text-muted-foreground mt-1">自动检测录音中的停顿静音并切除，口播剪辑提效，参数可调、边看波形边校</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传口播/配音录音后，工具按 50ms 窗逐窗计算响度（dBFS），把连续低于阈值且足够长的区段判为静音，
        在波形上以半透明红色标出，可调节阈值、最短静音时长与边缘保留（padding）后一键拼接导出 WAV。
        阈值建议：安静环境的口播录音用 -40dBFS（默认），嘈杂环境提高到 -30dBFS。
        支持 mp3 / m4a / wav / ogg / flac 等浏览器可解码格式，建议单次处理不超过 10 分钟的音频。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：音频全程通过 WebAudio 在本地解码、检测与拼接，不会上传到任何服务器。
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 波形与静音检测 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Waves class="w-5 h-5 mr-2 text-primary" /> 波形与静音检测
          </h2>
          <span v-if="fileInfo" class="text-xs text-muted-foreground truncate max-w-[50%]">
            {{ fileInfo.name }} · {{ formatSize(fileInfo.size) }}
          </span>
        </div>

        <input ref="fileInput" type="file" accept="audio/*" class="hidden" @change="onFileChange" />

        <div v-if="!fileInfo">
          <button
            @click="triggerPick"
            class="w-full py-12 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground"
          >
            <Upload class="w-8 h-8 text-primary" />
            <span class="text-sm font-medium text-foreground">点击选择音频文件</span>
            <span class="text-xs">mp3 / m4a / wav / ogg / flac / webm，文件仅在本地解码</span>
          </button>
        </div>

        <div v-else class="space-y-2">
          <canvas ref="waveCanvas" class="w-full h-36 bg-muted rounded-lg block"></canvas>
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>0:00</span>
            <span>{{ sourceInfo }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
          <div class="flex items-center gap-4">
            <button @click="triggerPick" class="text-xs text-muted-foreground hover:text-primary transition-colors">
              重新选择文件
            </button>
            <span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span class="inline-block w-3 h-3 rounded-sm bg-red-500/40 border border-red-500/60"></span>
              静音段（将被切除）
            </span>
          </div>
        </div>

        <p v-if="isDecoding" class="text-sm text-muted-foreground">正在本地解码音频...</p>
        <p v-if="loadError" class="text-sm text-red-500">{{ loadError }}</p>

        <!-- 静音段清单 -->
        <div v-if="analysis">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground">静音段清单（收边后实际切除区间）</h3>
            <span class="text-xs text-muted-foreground">{{ analysis.silences.length }} 段</span>
          </div>
          <div v-if="analysis.silences.length" class="max-h-56 overflow-y-auto border border-border rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-muted/60 sticky top-0">
                <tr>
                  <th class="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                  <th class="text-left px-3 py-2 font-medium text-muted-foreground">开始</th>
                  <th class="text-left px-3 py-2 font-medium text-muted-foreground">结束</th>
                  <th class="text-left px-3 py-2 font-medium text-muted-foreground">时长</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(seg, i) in analysis.silences" :key="i" class="border-t border-border">
                  <td class="px-3 py-1.5 text-muted-foreground">{{ i + 1 }}</td>
                  <td class="px-3 py-1.5 font-mono text-foreground">{{ seg.start.toFixed(2) }}s</td>
                  <td class="px-3 py-1.5 font-mono text-foreground">{{ seg.end.toFixed(2) }}s</td>
                  <td class="px-3 py-1.5 font-mono text-foreground">{{ seg.duration.toFixed(2) }}s</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
            按当前参数未检测到需要切除的静音段，可尝试降低阈值或缩短最短静音时长。
          </p>
        </div>
      </div>

      <!-- 参数、统计与导出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Sliders class="w-5 h-5 mr-2 text-primary" /> 检测参数与导出
        </h2>

        <template v-if="fileInfo">
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-foreground">静音阈值</label>
              <span class="text-sm font-mono text-primary">{{ thresholdDb }} dBFS</span>
            </div>
            <input v-model.number="thresholdDb" type="range" min="-70" max="-10" step="1" class="w-full accent-primary" />
            <div class="flex gap-2 mt-2">
              <button
                v-for="p in thresholdPresets"
                :key="p.value"
                @click="thresholdDb = p.value"
                class="px-2 py-1 text-xs rounded-md border transition-colors"
                :class="thresholdDb === p.value
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'"
              >{{ p.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">低于该响度（dBFS，0 为满幅）的窗判定为静音。口播建议 -40，嘈杂环境 -30，安静棚录可用 -50。</p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-foreground">最短静音时长</label>
              <span class="text-sm font-mono text-primary">{{ minSilence.toFixed(2) }} s</span>
            </div>
            <input v-model.number="minSilence" type="range" min="0.1" max="2" step="0.05" class="w-full accent-primary" />
            <p class="text-xs text-muted-foreground mt-1.5">短于该时长的停顿不切除，保留自然的呼吸与断句。</p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-foreground">边缘保留 padding</label>
              <span class="text-sm font-mono text-primary">{{ padding.toFixed(2) }} s</span>
            </div>
            <input v-model.number="padding" type="range" min="0" max="0.2" step="0.01" class="w-full accent-primary" />
            <p class="text-xs text-muted-foreground mt-1.5">每段静音两侧向内收缩的量，防止切掉音节的尾巴。</p>
          </div>

          <!-- 统计卡 -->
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
              <div class="text-xs text-muted-foreground">原时长</div>
              <div class="text-base font-semibold text-foreground mt-1">{{ formatTime(duration) }}</div>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
              <div class="text-xs text-muted-foreground">切除时长</div>
              <div class="text-base font-semibold text-red-500 mt-1">{{ cutDuration.toFixed(1) }}s</div>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3 text-center">
              <div class="text-xs text-muted-foreground">节省</div>
              <div class="text-base font-semibold text-green-600 dark:text-green-400 mt-1">{{ savedPercent.toFixed(1) }}%</div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground flex items-start gap-1.5">
            <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            处理在浏览器内存中完成，建议单次不超过 10 分钟；更长的录音建议分段处理。导出为与源同采样率的 WAV（PCM16）。
          </p>

          <div class="grid grid-cols-2 gap-2">
            <button
              @click="buildCutPreview"
              :disabled="isExporting"
              class="py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Play class="w-4 h-4" /> 生成切后试听
            </button>
            <button
              @click="exportWav"
              :disabled="isExporting"
              class="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Download class="w-4 h-4" /> 导出切除后 WAV
            </button>
          </div>
          <p v-if="isExporting" class="text-xs text-muted-foreground">{{ exportStatus }}</p>
          <p v-else-if="exportStatus" class="text-xs" :class="exportOk ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ exportStatus }}</p>

          <!-- 试听对比 -->
          <div v-if="originalUrl || cutUrl" class="border-t border-border pt-4 space-y-3">
            <h3 class="text-sm font-semibold text-foreground">试听对比</h3>
            <div v-if="originalUrl">
              <div class="text-xs text-muted-foreground mb-1">原始音频（{{ formatTime(duration) }}）</div>
              <audio :src="originalUrl" controls class="w-full h-9"></audio>
            </div>
            <div v-if="cutUrl">
              <div class="text-xs text-muted-foreground mb-1">
                切除后（{{ cutTotalDuration.toFixed(1) }}s，较原片节省 {{ savedPercent.toFixed(1) }}%）
              </div>
              <audio :src="cutUrl" controls class="w-full h-9"></audio>
            </div>
          </div>
        </template>

        <p v-else class="text-sm text-muted-foreground">上传音频后即可调整检测参数并导出切除后的音频。</p>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          在线口播静音切除工具
        </h2>
        <p class="text-muted-foreground mb-6">
          录完一段口播，最耗时的往往不是说，而是剪：把每一处停顿、呼吸和卡壳逐个手动删掉。本工具在浏览器里
          按 50ms 窗逐窗计算响度（dBFS，满幅为 0dBFS），自动找出连续低于阈值且超过最短时长的静音段，
          在波形上半透明红色标出，确认后把保留片段按原顺序无损拼接，导出与源同采样率的 WAV，全程本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">阈值怎么选</h3>
        <p class="text-muted-foreground mb-6">
          阈值以 dBFS 计（满幅信号为 0dBFS，越小越安静）：安静室内录制的口播建议 -40dBFS（默认值）；
          环境噪声明显的场合（风扇、空调、街头）可提高到 -30dBFS；录音棚级安静环境可用 -50dBFS 更保守地只切纯停顿。
          若发现句子被误切，说明阈值过高（数值偏大），调低即可；若停顿没切干净，则适当调高阈值或缩短最短静音时长。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">适用场景</h3>
        <p class="text-muted-foreground mb-6">
          知识口播与课程视频的旁白轨道粗剪、播客清谈节目的长停顿压缩、配音样音去咳音前的静音预清理、
          会议录音转文字前的加速听审。配合「边缘保留 padding」可以让切口落在停顿中间而不是音节尾巴上，
          听感更自然。剪辑只是辅助，导出后建议快速通听一遍确认没有误伤。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">结果为什么是 WAV</h3>
        <p class="text-muted-foreground mb-6">
          切除只是重新拼接采样点，不涉及重新编码，因此导出 PCM16 WAV 可以做到零额外音质损失，且与源文件同采样率。
          需要分发体积更小的格式时，可配合站内音频转换工具把 WAV 转成 mp3 等格式。源文件全程只读，不会被修改。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">静音阈值 -40dBFS 是什么意思？该怎么调？</h3>
            <p class="text-muted-foreground mt-1">
              dBFS 是数字音频满幅为 0 的响度刻度，数值越小越安静。-40dBFS 适合安静环境的口播录音；
              嘈杂环境建议 -30dBFS；发现误切就调低数值，停顿切不干净就调高数值，配合波形红色区域直观确认。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么有些很短的停顿没有被切除？</h3>
            <p class="text-muted-foreground mt-1">
              工具默认保留短于 0.3 秒的停顿，这是刻意的：自然的呼吸和断句能让语速听起来舒服。想让节奏更紧凑，
              可把「最短静音时长」降到 0.1~0.2 秒；但低于 0.1 秒的停顿切除后语句可能显得急促。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">会不会把句子里的轻声字误切掉？</h3>
            <p class="text-muted-foreground mt-1">
              每段静音两侧默认向内收缩 0.05 秒（padding），就是为了防止切掉音节的尾巴。如果录制电平整体偏低
              （比如峰值只有 -26dBFS 左右），请把阈值调到 -50 附近再检测，避免整段被误判。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持多大的文件？会上传吗？</h3>
            <p class="text-muted-foreground mt-1">
              处理全部在浏览器本地内存中完成，不上传任何数据；受内存限制建议单次不超过 10 分钟的音频，
              更长的录音请分段处理。导出的 WAV 与源文件同采样率、16bit PCM 编码。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-silence-cutter'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Scissors, Waves, Sliders, ShieldCheck, Upload, Download, Play,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '口播静音切除 - 本地自动去除录音停顿静音',
  description: '在线口播静音切除工具，自动检测录音中的停顿静音段并切除拼接，阈值/最短静音/边缘保留可调，波形红色可视化确认，导出同采样率 WAV，全程浏览器本地处理不上传',
  keywords: '静音切除, 去除静音, 录音去停顿, 口播剪辑, 音频静音检测, 口播提效',
  author: 'Util工具箱',
  ogTitle: '口播静音切除 - 有条工具',
  ogDescription: '自动检测并切除录音中的停顿静音段，口播剪辑提效，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/audio-silence-cutter',
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
          name: '口播静音切除',
          url: 'https://www.util.cn/tools/audio-silence-cutter',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['50ms 窗 RMS 响度检测', '阈值/最短静音/边缘保留可调', '波形静音区红色可视化', '静音段清单', '保留段无损拼接导出 WAV', '原/切后试听对比', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '口播静音切除', item: 'https://www.util.cn/tools/audio-silence-cutter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '静音阈值 -40dBFS 是什么意思？该怎么调？',
              acceptedAnswer: { '@type': 'Answer', text: 'dBFS 是数字音频满幅为 0 的响度刻度，数值越小越安静。-40dBFS 适合安静环境的口播录音，嘈杂环境建议 -30dBFS，误切就调低、切不干净就调高。' }
            },
            {
              '@type': 'Question',
              name: '为什么有些很短的停顿没有被切除？',
              acceptedAnswer: { '@type': 'Answer', text: '工具默认保留短于 0.3 秒的停顿以保留自然呼吸与断句，可把最短静音时长降到 0.1~0.2 秒让节奏更紧凑。' }
            },
            {
              '@type': 'Question',
              name: '会不会把句子里的轻声字误切掉？',
              acceptedAnswer: { '@type': 'Answer', text: '每段静音两侧默认向内收缩 0.05 秒防止切掉音节尾巴；若录制电平整体偏低，请把阈值调到 -50 附近再检测。' }
            },
            {
              '@type': 'Question',
              name: '支持多大的文件？会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '处理全部在浏览器本地完成不上传；建议单次不超过 10 分钟，更长录音请分段处理。导出 WAV 与源同采样率、16bit PCM。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-silence-cutter')

// ---------- 状态 ----------
const fileInput = ref(null)
const waveCanvas = ref(null)
const fileInfo = ref(null)
const sourceInfo = ref('')
const duration = ref(0)
const isDecoding = ref(false)
const isExporting = ref(false)
const exportStatus = ref('')
const exportOk = ref(false)
const loadError = ref('')
const seoContentVisible = ref(true)

const thresholdDb = ref(-40)
const minSilence = ref(0.3)
const padding = ref(0.05)

const thresholdPresets = [
  { label: '口播 -40', value: -40 },
  { label: '嘈杂 -30', value: -30 },
  { label: '安静 -50', value: -50 }
]

const analysis = ref(null) // { silences, keeps }；v-if 消费，不用 v-show
const originalUrl = ref('')
const cutUrl = ref('')

// 非响应式大对象（AudioBuffer / 波形峰值缓存）
let audioBuffer = null
let wavePeaks = null
let originalBlobUrl = ''
let cutBlob = null
let cutDirty = true
let debounceTimer = null

const cutDuration = computed(() => {
  if (!analysis.value) return 0
  return analysis.value.silences.reduce((s, seg) => s + seg.duration, 0)
})
const cutTotalDuration = computed(() => {
  if (!analysis.value) return 0
  return analysis.value.keeps.reduce((s, seg) => s + seg.duration, 0)
})
const savedPercent = computed(() => {
  if (!duration.value) return 0
  return Math.min(100, (cutDuration.value / duration.value) * 100)
})

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

onBeforeUnmount(() => {
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
  if (originalBlobUrl) URL.revokeObjectURL(originalBlobUrl)
  if (cutUrl.value) URL.revokeObjectURL(cutUrl.value)
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerPick = () => { if (fileInput.value) fileInput.value.click() }

const formatTime = (t) => {
  const s = Math.max(0, Number(t) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`
}
const formatSize = (n) => {
  if (!n) return '0 B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 纯函数（node 自测覆盖） ----------
// RMS → dBFS：满幅正弦/直流 1.0 为 0dBFS；rms 非正数（含 0 / NaN）按极低值 -120 处理
function rmsToDbfs(rms) {
  if (!(rms > 0)) return -120
  const db = 20 * Math.log10(rms)
  return db < -120 ? -120 : db
}

function windowRms(samples, start, end) {
  const len = end - start
  if (len <= 0) return 0
  let sum = 0
  for (let i = start; i < end; i++) {
    const v = samples[i]
    sum += v * v
  }
  return Math.sqrt(sum / len)
}

// 静音检测：hop 窗长逐窗 RMS → dBFS，连续低于阈值且时长 ≥ minSilence 判为静音段，
// 两侧向内收 padding（防切音节尾巴），返回收边后的 silence 段与互补 keep 段（单位秒）
function detectSilence(samples, sampleRate, opts) {
  const o = {
    thresholdDb: typeof (opts && opts.thresholdDb) === 'number' ? opts.thresholdDb : -40,
    minSilence: typeof (opts && opts.minSilence) === 'number' ? opts.minSilence : 0.3,
    padding: typeof (opts && opts.padding) === 'number' ? opts.padding : 0.05,
    hop: typeof (opts && opts.hop) === 'number' ? opts.hop : 0.05
  }
  const silences = []
  const keeps = []
  const n = samples ? samples.length : 0
  if (!n || !(sampleRate > 0)) return { silences, keeps }
  const total = n / sampleRate
  const hopSamples = Math.max(1, Math.round(o.hop * sampleRate))
  const winCount = Math.ceil(n / hopSamples)

  // a+b) 逐窗判定，扫描线收集连续低于阈值的运行段（末尾哨兵收尾）
  let runStart = -1
  for (let w = 0; w <= winCount; w++) {
    let below = false
    if (w < winCount) {
      const s = w * hopSamples
      const e = Math.min(n, s + hopSamples)
      below = rmsToDbfs(windowRms(samples, s, e)) < o.thresholdDb
    }
    if (below && runStart < 0) runStart = w
    if (!below && runStart >= 0) {
      const startSec = (runStart * hopSamples) / sampleRate
      const endSec = (Math.min(n, w * hopSamples)) / sampleRate
      if (endSec - startSec >= o.minSilence - 1e-9) {
        silences.push({ start: startSec, end: endSec })
      }
      runStart = -1
    }
  }

  // c) 两侧收 padding；收完为空的段丢弃
  const padded = []
  for (const seg of silences) {
    const start = Math.max(0, seg.start + o.padding)
    const end = Math.min(total, seg.end - o.padding)
    if (end - start > 1e-6) padded.push({ start, end })
  }

  // 合并相邻（防御性）并生成互补 keep 段
  const finalSil = []
  for (const seg of padded) {
    const last = finalSil[finalSil.length - 1]
    if (last && seg.start - last.end < 1e-6) {
      last.end = Math.max(last.end, seg.end)
    } else {
      finalSil.push({ start: seg.start, end: seg.end })
    }
  }
  let cursor = 0
  for (const seg of finalSil) {
    if (seg.start - cursor > 1e-6) keeps.push({ start: cursor, end: seg.start })
    cursor = Math.max(cursor, seg.end)
  }
  if (total - cursor > 1e-6) keeps.push({ start: cursor, end: total })

  for (const s of finalSil) s.duration = s.end - s.start
  for (const k of keeps) k.duration = k.end - k.start
  return { silences: finalSil, keeps }
}

// 按 keep 段顺序拼接多声道采样（不经过 OfflineAudioContext，直接 Float32Array 拼接）
function concatSegmentsByKeeps(channels, sampleRate, keeps) {
  const numCh = Math.max(1, channels.length)
  const srcLen = channels[0] ? channels[0].length : 0
  let totalFrames = 0
  const ranges = []
  for (const k of keeps || []) {
    const s = Math.max(0, Math.floor(k.start * sampleRate))
    const e = Math.min(srcLen, Math.floor(k.end * sampleRate))
    if (e - s > 0) {
      ranges.push([s, e])
      totalFrames += e - s
    }
  }
  const out = []
  for (let c = 0; c < numCh; c++) out.push(new Float32Array(totalFrames))
  let off = 0
  for (const [s, e] of ranges) {
    const len = e - s
    for (let c = 0; c < numCh; c++) {
      const src = channels[c] || new Float32Array(srcLen)
      out[c].set(src.subarray(s, s + len), off)
    }
    off += len
  }
  return out
}

// 自写 WAV 编码（PCM16 小端），channels: Float32Array[]
function encodeWavFromChannels(channels, sampleRate) {
  const numCh = Math.max(1, channels.length)
  const numFrames = channels[0] ? channels[0].length : 0
  const blockAlign = numCh * 2
  const dataSize = numFrames * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numCh, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = channels[c][i]
      s = s > 1 ? 1 : (s < -1 ? -1 : s)
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      offset += 2
    }
  }
  return new Uint8Array(buffer)
}

// ---------- 纯函数结束 ----------

// ---------- 波形峰值（读原 channelData 视图，不复制第二份全量数组） ----------
function computeWaveformPeaks(data, bucketCount) {
  const mins = new Float32Array(bucketCount)
  const maxs = new Float32Array(bucketCount)
  const size = Math.max(1, Math.floor(data.length / bucketCount))
  for (let b = 0; b < bucketCount; b++) {
    const s = b * size
    const e = Math.min(data.length, s + size)
    let mn = 0
    let mx = 0
    for (let i = s; i < e; i++) {
      const v = data[i]
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    mins[b] = mn
    maxs[b] = mx
  }
  return { mins, maxs }
}

// ---------- 文件解码（用户手势回调内创建 AudioContext） ----------
const onFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  isDecoding.value = true
  loadError.value = ''
  exportStatus.value = ''
  try {
    const arrayBuffer = await file.arrayBuffer()
    const ctx = new AudioContext()
    const buf = await ctx.decodeAudioData(arrayBuffer)
    await ctx.close()
    audioBuffer = buf
    const dot = file.name.lastIndexOf('.')
    const ext = dot >= 0 ? file.name.slice(dot + 1).toUpperCase() : '未知'
    fileInfo.value = { name: file.name, size: file.size, ext }
    sourceInfo.value = `${ext} · ${buf.sampleRate}Hz · ${buf.numberOfChannels === 1 ? '单声道' : buf.numberOfChannels + ' 声道'}`
    duration.value = buf.duration
    wavePeaks = computeWaveformPeaks(buf.getChannelData(0), 800)
    if (originalBlobUrl) URL.revokeObjectURL(originalBlobUrl)
    originalBlobUrl = URL.createObjectURL(file)
    originalUrl.value = originalBlobUrl
    if (cutUrl.value) { URL.revokeObjectURL(cutUrl.value); cutUrl.value = '' }
    cutBlob = null
    cutDirty = true
    runAnalysis()
    drawWave()
  } catch (err) {
    loadError.value = '解码失败：当前浏览器无法解析该音频文件，请尝试 mp3 / wav / m4a 格式'
  } finally {
    isDecoding.value = false
    e.target.value = ''
  }
}

// ---------- 参数联动（150ms 防抖重算） ----------
const runAnalysis = () => {
  if (!audioBuffer) return
  analysis.value = detectSilence(audioBuffer.getChannelData(0), audioBuffer.sampleRate, {
    thresholdDb: thresholdDb.value,
    minSilence: minSilence.value,
    padding: padding.value
  })
  cutDirty = true
  // 参数变化后旧试听失效，避免误导
  if (cutUrl.value) { URL.revokeObjectURL(cutUrl.value); cutUrl.value = '' }
  drawWave()
}

watch([thresholdDb, minSilence, padding], () => {
  if (!audioBuffer) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    runAnalysis()
  }, 150)
})

// ---------- 波形绘制（静音区半透明红色覆盖） ----------
const drawWave = () => {
  const canvas = waveCanvas.value
  if (!canvas || !wavePeaks || !fileInfo.value) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || canvas.parentElement.clientWidth
  const h = canvas.clientHeight || 144
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const g = canvas.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, w, h)
  const d = duration.value || 1
  const { mins, maxs } = wavePeaks
  const n = mins.length
  const mid = h / 2
  const scale = (h / 2 - 6) / 1
  // 包络
  const bw = w / n
  for (let i = 0; i < n; i++) {
    const x = i * bw
    g.fillStyle = 'rgba(148, 163, 184, 0.75)'
    const y0 = mid - maxs[i] * scale
    const y1 = mid - mins[i] * scale
    g.fillRect(x, y0, Math.max(1, bw * 0.9), Math.max(1.5, y1 - y0))
  }
  // 静音区半透明红色覆盖
  if (analysis.value) {
    for (const seg of analysis.value.silences) {
      const x0 = (seg.start / d) * w
      const x1 = (seg.end / d) * w
      g.fillStyle = 'rgba(239, 68, 68, 0.35)'
      g.fillRect(x0, 0, Math.max(2, x1 - x0), h)
      g.strokeStyle = 'rgba(239, 68, 68, 0.8)'
      g.lineWidth = 1
      g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0, h); g.stroke()
      g.beginPath(); g.moveTo(x1, 0); g.lineTo(x1, h); g.stroke()
    }
  }
  // 中线
  g.strokeStyle = 'rgba(128, 128, 128, 0.35)'
  g.beginPath()
  g.moveTo(0, mid)
  g.lineTo(w, mid)
  g.stroke()
}

// ---------- 拼接与导出 ----------
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const getChannels = () => {
  const chans = []
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    chans.push(audioBuffer.getChannelData(c))
  }
  return chans
}

// 构建切后 WAV Blob（结果复用：参数未变时直接返回缓存）
const ensureCutBlob = () => {
  if (!audioBuffer || !analysis.value) return null
  if (!cutDirty && cutBlob) return cutBlob
  const chans = concatSegmentsByKeeps(getChannels(), audioBuffer.sampleRate, analysis.value.keeps)
  const bytes = encodeWavFromChannels(chans, audioBuffer.sampleRate)
  cutBlob = new Blob([bytes], { type: 'audio/wav' })
  cutDirty = false
  return cutBlob
}

const buildCutPreview = () => {
  if (!audioBuffer || isExporting.value) return
  isExporting.value = true
  exportStatus.value = ''
  try {
    const blob = ensureCutBlob()
    if (!blob) throw new Error('尚未分析出可保留的片段')
    if (cutUrl.value) URL.revokeObjectURL(cutUrl.value)
    cutUrl.value = URL.createObjectURL(blob)
    exportOk.value = true
    exportStatus.value = `切后音频已生成（${formatSize(blob.size)}），可在下方与原片对比试听`
  } catch (err) {
    exportOk.value = false
    exportStatus.value = '生成失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isExporting.value = false
  }
}

const exportWav = () => {
  if (!audioBuffer || isExporting.value) return
  isExporting.value = true
  exportStatus.value = ''
  try {
    const blob = ensureCutBlob()
    if (!blob) throw new Error('尚未分析出可保留的片段')
    triggerDownload(blob, 'silence-removed.wav')
    exportOk.value = true
    exportStatus.value = `WAV 导出成功（${formatSize(blob.size)}），文件未离开浏览器`
  } catch (err) {
    exportOk.value = false
    exportStatus.value = '导出失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isExporting.value = false
  }
}
</script>
