<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Film class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">字幕工具箱</h1>
          <p class="text-sm text-muted-foreground mt-1">SRT / VTT 互转、时间轴平移与变速，文件不出浏览器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传或粘贴 SRT、VTT 字幕文件，进行格式互转、整体时间轴前移/后移、按倍速缩放时间轴等处理，处理后直接下载。解析与转换全部在浏览器本地完成，适合处理未发布的影视素材与翻译稿。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与处理 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 输入字幕
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30 mb-4"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input ref="fileInput" type="file" accept=".srt,.vtt,.txt,text/plain" class="hidden" @change="handleFileChange" />
            <Upload v-if="!fileName" class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
            <FileCheck v-else class="w-6 h-6 mx-auto mb-1.5 text-primary" />
            <p v-if="!fileName" class="text-xs text-muted-foreground">点击选择或拖入 .srt / .vtt 文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ fileName }} · {{ cueCount }} 条字幕</p>
          </div>

          <textarea
            v-model="inputText"
            class="w-full h-36 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="或直接粘贴字幕内容..."
            spellcheck="false"
            @input="parseInput"
          ></textarea>
          <p v-if="parseError" class="text-xs text-destructive mt-2">{{ parseError }}</p>
        </div>

        <!-- 处理选项 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 处理选项
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">输出格式</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="f in ['SRT', 'VTT']"
                :key="f"
                @click="outputFormat = f"
                :class="outputFormat === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >{{ f }}</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">时间平移（秒）</label>
            <div class="flex items-center gap-2">
              <button @click="shiftSec -= 0.5" class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded text-sm">−0.5s</button>
              <input v-model.number="shiftSec" type="number" step="0.1" class="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-center" />
              <button @click="shiftSec += 0.5" class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded text-sm">+0.5s</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">正数整体延后（字幕比声音快时用），负数整体提前。</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">速度倍率（帧率换算）</label>
            <div class="grid grid-cols-5 gap-1.5">
              <button
                v-for="s in speedPresets"
                :key="s"
                @click="speedFactor = s"
                :class="speedFactor === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >{{ s }}×</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">例如 23.976fps 字幕用到 25fps 视频上选 1.043×。</p>
          </div>

          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">去除空行字幕与重复行</span>
            <button
              type="button"
              @click="dedupe = !dedupe"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              :class="dedupe ? 'bg-primary' : 'bg-muted'"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="dedupe ? 'translate-x-6' : 'translate-x-1'"></span>
            </button>
          </label>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileOutput class="w-5 h-5 mr-2 text-primary" /> 转换结果（{{ processedCues }} 条）
            </h2>
            <div class="flex items-center gap-2">
              <button @click="copyOutput" :disabled="!outputText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5">
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button @click="downloadOutput" :disabled="!outputText"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5">
                <Download class="w-3.5 h-3.5" /> 下载 .{{ outputFormat.toLowerCase() }}
              </button>
            </div>
          </div>
          <div class="p-6">
            <textarea v-if="outputText" :value="outputText" readonly
              class="w-full h-[420px] px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none resize-y" spellcheck="false"></textarea>
            <div v-else class="py-20 text-center">
              <Film class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入字幕内容后，这里显示转换结果</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于字幕格式与时间轴</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>SRT（SubRip）是最通用的字幕格式，被几乎所有播放器支持；VTT（WebVTT）是 HTML5 视频的标准字幕格式，二者结构相近但头部声明、时间戳分隔符（逗号 vs 点）与样式能力不同。本工具在浏览器本地完成解析与转换，未发布的素材不必上传到任何服务器。</p>
          <h3 class="text-lg font-semibold text-foreground">什么时候需要调整时间轴</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>字幕整体比声音快/慢固定时长：使用时间平移</li>
            <li>视频被加速/减速处理（如 23.976fps 转 25fps）：使用速度倍率整体缩放</li>
            <li>片源开头裁掉了几秒：平移负值补偿</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持 ASS/SSA 吗？</span>当前版本支持 SRT 与 VTT 的互转，ASS 样式字幕建议先在专业工具中转换为 SRT。</li>
            <li><span class="text-foreground font-medium">字幕文件乱码？</span>SRT 若为 GBK 编码请先转为 UTF-8 再粘贴（可配合站内编码转换工具）。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'subtitle-toolbox'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Film, FileUp, FileCheck, FileOutput, Upload, Download, Copy,
  Settings2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '字幕工具箱 - SRT/VTT互转与时间轴调整工具',
  description: '在线字幕转换工具，支持SRT与VTT互转、时间轴整体平移、按倍率缩放时间轴、去重复行，本地处理字幕文件不上传',
  keywords: 'srt转vtt, vtt转srt, 字幕转换, 字幕时间轴调整, 字幕平移, 字幕格式转换, webvtt',
  author: 'Util工具箱',
  ogTitle: '字幕工具箱 - 有条工具',
  ogDescription: 'SRT/VTT互转、时间轴平移与变速，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/subtitle-toolbox',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: '字幕工具箱', url: 'https://www.util.cn/tools/subtitle-toolbox', applicationCategory: 'MultimediaApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['SRT/VTT互转', '时间轴平移', '速度倍率缩放', '本地处理'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
          { '@type': 'ListItem', position: 3, name: '字幕工具箱', item: 'https://www.util.cn/tools/subtitle-toolbox/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'subtitle-toolbox')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const inputText = ref('')
const fileName = ref('')
const outputFormat = ref('SRT')
const shiftSec = ref(0)
const speedFactor = ref(1)
const dedupe = ref(false)
const isDragging = ref(false)
const parseError = ref('')
const seoContentVisible = ref(true)
const fileInput = ref(null)
const speedPresets = [0.959, 1.043, 0.96, 1.25, 2]

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 解析 ----------
const parseTime = (s) => {
  const m = s.trim().match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/)
  if (!m) return null
  return (+m[1]) * 3600000 + (+m[2]) * 60000 + (+m[3]) * 1000 + (+m[4].padEnd(3, '0'))
}

const parseCues = (text) => {
  const cues = []
  const blocks = text.replace(/\r/g, '').replace(/^WEBVTT.*\n/, '').split(/\n\n+/)
  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim() !== '')
    if (lines.length === 0) continue
    const timeIdx = lines.findIndex(l => l.includes('-->'))
    if (timeIdx === -1) continue
    const [from, to] = lines[timeIdx].split('-->').map(parseTime)
    if (from == null || to == null) continue
    const content = lines.slice(timeIdx + 1).join('\n').trim()
    cues.push({ from, to, content })
  }
  return cues
}

const cues = computed(() => parseCues(inputText.value))
const cueCount = computed(() => cues.value.length)

const parseInput = () => {
  parseError.value = ''
  if (inputText.value.trim() && cueCount.value === 0) {
    parseError.value = '未识别到有效字幕（需要 "00:00:01,000 --> 00:00:03,000" 格式的时间轴行）'
  }
}

// ---------- 处理与输出 ----------
const fmt = (ms, srt) => {
  if (ms < 0) ms = 0
  const h = Math.floor(ms / 3600000)
  const m = Math.floor(ms % 3600000 / 60000)
  const s = Math.floor(ms % 60000 / 1000)
  const milli = Math.round(ms % 1000)
  const base = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return srt ? `${base},${String(milli).padStart(3, '0')}` : `${base}.${String(milli).padStart(3, '0')}`
}

const processedCuesList = computed(() => {
  const factor = Number(speedFactor.value) || 1
  const shift = (Number(shiftSec.value) || 0) * 1000
  let list = cues.value.map(c => ({
    from: Math.round(c.from * factor + shift),
    to: Math.round(c.to * factor + shift),
    content: c.content
  }))
  if (dedupe.value) {
    const seen = new Set()
    list = list.filter(c => {
      if (!c.content) return false
      const key = c.content.replace(/\s+/g, '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  return list
})

const processedCues = computed(() => processedCuesList.value.length)

const outputText = computed(() => {
  const list = processedCuesList.value
  if (list.length === 0) return ''
  if (outputFormat.value === 'VTT') {
    return 'WEBVTT\n\n' + list.map(c => `${fmt(c.from, false)} --> ${fmt(c.to, false)}\n${c.content}`).join('\n\n') + '\n'
  }
  return list.map((c, i) => `${i + 1}\n${fmt(c.from, true)} --> ${fmt(c.to, true)}\n${c.content}`).join('\n\n') + '\n'
})

// ---------- 交互 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = async (e) => {
  const f = e.target.files?.[0]
  if (f) {
    fileName.value = f.name
    inputText.value = await f.text()
    if (/\.vtt$/i.test(f.name)) outputFormat.value = 'SRT'
    parseInput()
  }
  e.target.value = ''
}

const handleDrop = async (e) => {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) {
    fileName.value = f.name
    inputText.value = await f.text()
    parseInput()
  }
}

const copyOutput = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    const ta = document.createElement('textarea')
    ta.value = outputText.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('已复制到剪贴板')
  }
}

const downloadOutput = () => {
  if (!outputText.value) return
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const base = (fileName.value || 'subtitle').replace(/\.[^.]+$/, '')
  a.href = url
  a.download = `${base}.${outputFormat.value.toLowerCase()}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
