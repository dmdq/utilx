<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Volume2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">文字转语音朗读</h1>
          <p class="text-sm text-muted-foreground mt-1">浏览器原生语音合成朗读中文文案，语速音调可调</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴文案即可用浏览器内置语音合成引擎朗读：自动优先列出系统中文语音包，语速与音调滑条实时可调，
        支持暂停、继续与停止，长文案自动按 200 字分段连续朗读，不装任何软件。全部处理在浏览器本地完成，文本不上传。
      </p>
    </div>

    <!-- 醒目使用说明 -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <Info class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
        <strong>浏览器合成仅限本页播放试听</strong>；如需音频文件，可开启系统声音后用站内
        <NuxtLink to="/tools/screen-recorder" class="underline font-medium">【在线录屏】</NuxtLink>
        录制。可朗读的音色取决于操作系统已安装的语音包：Windows（晓晓/Huihui）、macOS（婷婷/Ting-Ting）、
        安卓（小米/华为内置引擎）各不相同，缺中文语音包时请先在系统设置中补装。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 文案输入与控制 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 文案与朗读控制
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">朗读文案</label>
          <textarea
            v-model="text"
            rows="8"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴需要朗读的文案，例如短视频口播稿、新闻快讯、文章段落……"
          ></textarea>
          <div class="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>{{ charCount }} 字</span>
            <span v-if="chunkCount > 1">长文案将自动分为 {{ chunkCount }} 段连续朗读</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            语速：<span class="text-primary">{{ rate.toFixed(1) }}x</span>
          </label>
          <input v-model.number="rate" type="range" min="0.5" max="2" step="0.1" class="w-full accent-primary" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            音调：<span class="text-primary">{{ pitch.toFixed(1) }}</span>
          </label>
          <input v-model.number="pitch" type="range" min="0.5" max="2" step="0.1" class="w-full accent-primary" />
        </div>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            @click="speak"
            :disabled="!canSpeak"
            class="py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Play class="w-4 h-4" /> 朗读
          </button>
          <button
            @click="pause"
            :disabled="status !== 'speaking'"
            class="py-2.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Pause class="w-4 h-4" /> 暂停
          </button>
          <button
            @click="resume"
            :disabled="status !== 'paused'"
            class="py-2.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Play class="w-4 h-4" /> 继续
          </button>
          <button
            @click="stop"
            :disabled="status === 'idle'"
            class="py-2.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Square class="w-4 h-4" /> 停止
          </button>
        </div>
      </div>

      <!-- 语音选择与状态 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Mic class="w-5 h-5 mr-2 text-primary" /> 语音与状态
        </h2>

        <!-- 状态徽章 -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-muted-foreground">当前状态</span>
          <span :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium', statusClass]">
            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
            {{ statusLabel }}
          </span>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-foreground">语音音色</label>
            <span class="text-xs text-muted-foreground">中文音色已优先排列（{{ voices.length }} 个可用）</span>
          </div>
          <select
            v-model="selectedVoiceName"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="v in sortedVoices" :key="v.name" :value="v.name">
              {{ voiceLabel(v) }}
            </option>
          </select>
          <p v-if="supported && voices.length === 0" class="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
            暂未枚举到系统语音，部分浏览器需等待语音包异步加载或先安装系统语音包
          </p>
          <p v-if="!supported" class="text-xs text-red-500 mt-1.5">
            当前浏览器不支持语音合成（speechSynthesis），请更换 Chrome / Edge / Safari 等现代浏览器
          </p>
        </div>

        <!-- 使用提示 -->
        <div class="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground leading-relaxed space-y-1.5">
          <p>· 音色由系统语音包决定，同一页面在不同设备上可选项不同</p>
          <p>· 朗读中调整语速音调不会立即生效，重新点击「朗读」即可按新参数朗读</p>
          <p>· 切换浏览器标签页可能导致朗读暂停，请保持本页在前台播放</p>
          <p>· 文本仅在本地合成播放，不会被上传到任何服务器</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线文字转语音</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            本工具基于浏览器原生的 Web Speech API（speechSynthesis）实现，无需安装软件、无需注册，粘贴文案即可试听。
            合成引擎与音色来自操作系统内置的语音包，因此发音质量与可选项取决于所用设备：
            Windows 自带中文音色晓晓、雅琳等，macOS 自带婷婷（Ting-Ting），移动端则由系统 TTS 引擎提供。
          </p>
          <h3 class="text-lg font-semibold text-foreground">适合哪些场景</h3>
          <p>
            典型用途包括：短视频与口播稿的配音试听（先听效果再决定是否专业配音）、长文章的听读代替阅读、
            外语单词与课文的发音参考、以及无障碍场景下的网页文案朗读。配合语速 0.5x 慢速播放，
            也适合做语言学习的跟读练习。
          </p>
          <h3 class="text-lg font-semibold text-foreground">长文案是怎么处理的</h3>
          <p>
            浏览器引擎对单次合成的文本长度有限制，超长文本容易被截断。本工具在朗读前会先清洗文本
            （去除 emoji 与多余空白），再按 200 字一段切分，依次提交引擎连续朗读，段落间无缝衔接，听感接近整篇播报。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么音色列表和别人的不一样？</span>音色来自本机系统语音包，不同品牌系统与语言设置差异很大；缺中文音色时可在系统设置的「语音/辅助功能」中补装中文语音包。</li>
            <li><span class="text-foreground font-medium">能导出 MP3 音频文件吗？</span>浏览器合成不生成音频文件，仅限本页播放试听；需要音频时可开启系统声音，用站内【在线录屏】录制后剪辑。</li>
            <li><span class="text-foreground font-medium">朗读到一半没声音了？</span>多为浏览器对后台标签页的省电限制或系统语音引擎超时，保持页面在前台、适当缩短单次文案或调慢语速通常可以缓解。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'text-to-speech'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Volume2, FileText, Mic, Play, Pause, Square, Info,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '文字转语音朗读 - 在线中文语音合成试听',
  description: '在线文字转语音工具，基于浏览器原生语音合成朗读中文文案，自动优先系统中文音色，语速音调滑条可调，支持暂停继续停止，长文案自动200字分段连续朗读，纯本地处理不上传',
  keywords: '文字转语音, 在线朗读, 语音合成, tts在线, 文案配音, 中文朗读',
  author: 'Util工具箱',
  ogTitle: '文字转语音朗读 - 有条工具',
  ogDescription: '浏览器原生语音合成朗读中文文案，语速音调可调',
  ogUrl: 'https://www.util.cn/tools/text-to-speech',
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
          name: '文字转语音朗读',
          url: 'https://www.util.cn/tools/text-to-speech',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['浏览器原生语音合成', '中文音色优先排序', '语速音调可调', '暂停继续停止控制', '长文案200字分段朗读', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '文字转语音朗读', item: 'https://www.util.cn/tools/text-to-speech/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么音色列表和别人的不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '音色来自本机系统语音包，不同设备差异很大，缺中文音色时可在系统设置中补装中文语音包。' }
            },
            {
              '@type': 'Question',
              name: '能导出MP3音频文件吗？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器合成仅限本页播放试听，不生成音频文件；需要音频可开启系统声音后用在线录屏录制。' }
            },
            {
              '@type': 'Question',
              name: '超长文案会被截断吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，工具会在朗读前清洗文本并按200字一段切分，依次提交引擎连续朗读。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'text-to-speech')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  initSpeech()
})

// ---------- 文本清洗与分段（与 node 自测用例保持一致） ----------
const prepareText = (t) => {
  const cleaned = String(t || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return []
  const chunks = []
  for (let i = 0; i < cleaned.length; i += 200) {
    chunks.push(cleaned.slice(i, i + 200))
  }
  return chunks
}

// ---------- 状态 ----------
const text = ref('')
const rate = ref(1)
const pitch = ref(1)
const voices = ref([])
const selectedVoiceName = ref('')
const status = ref('idle') // idle | speaking | paused
const supported = ref(true)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const charCount = computed(() => [...text.value].length)
const chunkCount = computed(() => prepareText(text.value).length)

// 中文音色识别：lang 含 zh/CMN，或名称命中常见中文语音包命名
const CN_NAME_RE = /ting.?ting|meijia|xiaoxiao|yaoyao|huihui|hanhan|kangkang|yunxi|yunyang|xiaoyi|晓晓|晓伊|婷婷|美佳|云希|云扬|sinji|hiu.?gaai|sin.?ji/i
const isCnVoice = (v) => /zh|cmn/i.test(v.lang || '') || CN_NAME_RE.test(v.name || '')

const sortedVoices = computed(() => {
  const list = [...voices.value]
  list.sort((a, b) => {
    const ca = isCnVoice(a) ? 0 : 1
    const cb = isCnVoice(b) ? 0 : 1
    if (ca !== cb) return ca - cb
    return (a.name || '').localeCompare(b.name || '')
  })
  return list
})

const voiceLabel = (v) => {
  const tag = isCnVoice(v) ? '中文' : v.lang || '其他'
  const local = v.localService ? '本机' : '在线'
  return `${v.name}（${tag} · ${local}）`
}

const statusLabel = computed(() => (status.value === 'speaking' ? '朗读中' : status.value === 'paused' ? '已暂停' : '待机'))
const statusClass = computed(() => (status.value === 'speaking'
  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
  : status.value === 'paused'
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    : 'bg-muted text-muted-foreground'))

const canSpeak = computed(() => supported.value && chunkCount.value > 0 && status.value !== 'speaking')

// ---------- 语音枚举（API 异步：onvoiceschanged + 延迟兜底） ----------
const initSpeech = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    supported.value = false
    return
  }
  const synth = window.speechSynthesis
  const loadVoices = () => {
    voices.value = synth.getVoices() || []
    if (!selectedVoiceName.value && voices.value.length > 0) {
      const cn = voices.value.find(v => isCnVoice(v))
      selectedVoiceName.value = (cn || voices.value[0]).name
    }
  }
  loadVoices()
  synth.onvoiceschanged = loadVoices
  setTimeout(loadVoices, 500)
}

// ---------- 播放控制 ----------
const speak = () => {
  if (!supported.value || !canSpeak.value) return
  const synth = window.speechSynthesis
  synth.cancel()
  const chunks = prepareText(text.value)
  if (chunks.length === 0) return
  const voice = voices.value.find(v => v.name === selectedVoiceName.value) || null
  chunks.forEach((chunk, idx) => {
    const utterance = new SpeechSynthesisUtterance(chunk)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      utterance.lang = 'zh-CN'
    }
    utterance.rate = rate.value
    utterance.pitch = pitch.value
    if (idx === 0) {
      utterance.onstart = () => { status.value = 'speaking' }
    }
    if (idx === chunks.length - 1) {
      utterance.onend = () => { status.value = 'idle' }
      utterance.onerror = () => { status.value = 'idle' }
    }
    synth.speak(utterance)
  })
  status.value = 'speaking'
}

const pause = () => {
  if (!supported.value) return
  window.speechSynthesis.pause()
  status.value = 'paused'
}

const resume = () => {
  if (!supported.value) return
  window.speechSynthesis.resume()
  status.value = 'speaking'
}

const stop = () => {
  if (!supported.value) return
  window.speechSynthesis.cancel()
  status.value = 'idle'
}
</script>
