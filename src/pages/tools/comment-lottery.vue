<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gift class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">评论区抽奖工具</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴评论名单按用户去重/加权随机抽奖，生成开奖结果卡片，运营开奖神器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        把评论区名单粘贴进来（每行「昵称」或「昵称: 评论」），按昵称自动去重，可选「评论越多概率越大」的加权模式，
        用密码级随机数滚动 2 秒定格开奖，中奖名单一键生成结果图下载公示。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入与开奖 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ListChecks class="w-5 h-5 mr-2 text-primary" /> 参与名单
        </h2>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground" for="entriesInput">评论名单（每行一条）</label>
            <button @click="fillSample" class="text-xs text-primary hover:underline flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5" /> 填入示例
            </button>
          </div>
          <textarea
            id="entriesInput"
            v-model="entriesText"
            rows="9"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="每行一条，格式：昵称 或 昵称: 评论内容&#10;例如：&#10;小明&#10;阿花: 转发抽奖冲！&#10;阿花: 已关注一键三连"
          ></textarea>
          <p class="text-xs text-muted-foreground mt-1.5">同一昵称的多条评论会合并为一位参与者，评论条数作为加权依据。</p>
        </div>

        <!-- 名单统计 -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-muted/50 rounded-lg p-2.5 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">评论条数</p>
            <p class="text-base font-bold text-foreground">{{ entries.length }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-2.5 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">去重后参与者</p>
            <p class="text-base font-bold text-primary">{{ pool.length }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-2.5 text-center">
            <p class="text-[11px] text-muted-foreground mb-1">中奖人数</p>
            <p class="text-base font-bold text-foreground">{{ effectiveWinnerCount }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 items-center">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2" for="winnerCount">中奖人数</label>
            <input
              id="winnerCount"
              v-model.number="winnerCount"
              type="number"
              min="1"
              max="100"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <label class="flex items-center gap-2 mt-5 cursor-pointer" for="weightedToggle">
            <input
              id="weightedToggle"
              v-model="weighted"
              type="checkbox"
              class="w-4 h-4 rounded border-border"
            />
            <span class="text-sm text-foreground">评论越多概率越大</span>
          </label>
        </div>
        <p v-if="countClamped" class="text-xs text-amber-600 dark:text-amber-400">
          中奖人数已按参与人数调整为 {{ pool.length }} 人
        </p>

        <!-- 开奖按钮 -->
        <button
          @click="draw"
          :disabled="!pool.length || rolling"
          class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Play v-if="!rolling" class="w-4 h-4" />
          <Loader2 v-else class="w-4 h-4 animate-spin" />
          {{ drawButtonLabel }}
        </button>

        <!-- 滚动高亮区 -->
        <div class="rounded-lg border border-border bg-muted/40 p-6 text-center min-h-[88px] flex items-center justify-center overflow-hidden">
          <div v-if="rolling" class="w-full">
            <p class="text-xs text-muted-foreground mb-2">正在密码级随机滚动…</p>
            <p class="text-3xl font-bold text-primary animate-pulse truncate">{{ flashName }}</p>
          </div>
          <p v-else-if="!winners.length" class="text-sm text-muted-foreground">
            点击「开始抽奖」，滚动 2 秒后定格开奖
          </p>
          <p v-else class="text-sm text-muted-foreground">
            已开奖，可重新抽取或下载下方结果图
          </p>
        </div>

        <!-- 中奖名单 -->
        <div v-if="winners.length">
          <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center">
            <Trophy class="w-4 h-4 mr-1.5 text-primary" /> 中奖名单（{{ winners.length }} 人）
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div
              v-for="(name, i) in winners"
              :key="name + i"
              class="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 flex items-center gap-2.5"
            >
              <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">{{ i + 1 }}</span>
              <span class="text-sm font-semibold text-foreground truncate">{{ name }}</span>
              <span v-if="weighted" class="ml-auto text-[10px] text-muted-foreground flex-shrink-0">评论×{{ weightOf(name) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：开奖结果图 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ImageIcon class="w-5 h-5 mr-2 text-primary" /> 开奖结果图
        </h2>

        <div v-if="resultImageUrl" class="space-y-3">
          <img :src="resultImageUrl" alt="开奖结果图" class="w-full rounded-lg border border-border" />
          <button
            @click="downloadResult"
            class="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-all"
          >
            <Download class="w-4 h-4" /> 下载结果图（PNG）
          </button>
        </div>
        <div v-else class="p-10 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg leading-relaxed">
          开奖后自动生成结果图：<br />标题、开奖时间与中奖名单一目了然，<br />可直接下载发到群里公示。
        </div>

        <div class="bg-muted/40 rounded-lg p-3">
          <p class="text-xs text-muted-foreground leading-relaxed">
            公平性说明：随机源使用浏览器密码级随机数 crypto.getRandomValues；
            加权模式下每位参与者被抽中的概率与其评论条数成正比；已中奖者不会重复中奖（不放回抽取）。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于评论区抽奖</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            评论区抽奖是涨粉互动的常用玩法，但「谁中奖」必须让粉丝信服。本工具按昵称去重、按评论条数加权、
            用密码级随机数开奖，并把开奖时间与中奖名单固化成一张结果图，规则透明、可截图留证，适合直播、公众号与社群运营。
          </p>
          <h3 class="text-lg font-semibold text-foreground">加权抽奖的概率是怎么算的</h3>
          <p>
            开启「评论越多概率越大」后，每位参与者被抽中的概率 = 其评论条数 ÷ 总评论条数：
            发 3 条评论的用户中奖概率是不发言只留 1 条用户的 3 倍。关闭该开关则为等概率抽取，
            去重后每人机会均等。两种模式都按不放回方式抽满中奖人数，同一人不会重复中奖。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么随机数更可信</h3>
          <p>
            工具使用浏览器提供的 crypto.getRandomValues 密码级随机数，而不是可以预测的普通伪随机序列；
            滚动动画 2 秒后定格，现场连屏幕展示也无懈可击。开奖后生成的结果图包含标题、时间与名单，防止事后口说无凭。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">同一人评论多次会重复中奖吗？</span>不会。名单先按昵称去重合并为一位参与者，多条评论转为加权权重，且单轮开奖内已中奖者不再参与后续抽取。</li>
            <li><span class="text-foreground font-medium">中奖人数超过参与人数怎么办？</span>会自动按去重后的参与人数封顶并提示，避免空转。</li>
            <li><span class="text-foreground font-medium">名单会上传服务器吗？</span>不会，解析、去重与抽取全部在本页内存中完成，刷新页面数据即消失。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'comment-lottery'" :category="'random'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Gift, ListChecks, Sparkles, Play, Loader2, Trophy, Download,
  Image as ImageIcon, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '评论区抽奖工具 - 按昵称去重加权随机开奖',
  description: '在线评论区抽奖工具，粘贴评论名单按昵称去重，可选评论越多概率越大的加权随机，密码级随机数滚动 2 秒定格开奖，中奖名单一键生成结果图下载公示，纯本地计算',
  keywords: '评论区抽奖, 开奖工具, 随机抽奖, 加权抽奖, 直播抽奖, 运营抽奖工具',
  author: 'Util工具箱',
  ogTitle: '评论区抽奖工具 - 有条工具',
  ogDescription: '粘贴名单按用户去重/加权随机抽奖，生成开奖结果卡片',
  ogUrl: 'https://www.util.cn/tools/comment-lottery',
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
          name: '评论区抽奖工具',
          url: 'https://www.util.cn/tools/comment-lottery',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按昵称去重', '评论条数加权随机', '密码级随机数 crypto.getRandomValues', '滚动 2 秒定格开奖', '开奖结果图下载']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '随机决策', item: 'https://www.util.cn/random/' },
            { '@type': 'ListItem', position: 3, name: '评论区抽奖工具', item: 'https://www.util.cn/tools/comment-lottery/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '同一人评论多次会重复中奖吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。名单先按昵称去重合并，多条评论转为加权权重，单轮开奖内已中奖者不再参与后续抽取。' }
            },
            {
              '@type': 'Question',
              name: '加权抽奖的概率是怎么算的？',
              acceptedAnswer: { '@type': 'Answer', text: '开启加权后每位参与者被抽中的概率等于其评论条数除以总评论条数；关闭则为去重后等概率抽取。' }
            },
            {
              '@type': 'Question',
              name: '名单会上传服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，解析、去重与抽取全部在本页内存中完成，刷新页面数据即消失。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'comment-lottery')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== PURE:BEGIN ==== */
// 解析名单：每行「昵称」或「昵称: 评论」（半角/全角冒号均可），空行忽略
const parseEntries = (text) => {
  const entries = []
  const lines = String(text || '').split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const colonIdx = line.search(/[:：]/)
    if (colonIdx >= 0) {
      const name = line.slice(0, colonIdx).trim()
      const comment = line.slice(colonIdx + 1).trim()
      if (name) entries.push({ name, comment })
    } else {
      entries.push({ name: line, comment: '' })
    }
  }
  return entries
}

// 按昵称去重，保留首现顺序；评论条数作为权重
const buildPool = (entries) => {
  const map = new Map()
  for (const e of entries) {
    map.set(e.name, (map.get(e.name) || 0) + 1)
  }
  return Array.from(map, ([name, weight]) => ({ name, weight }))
}

// 加权随机不放回抽取 count 人；rnd 为返回 [0,1) 的随机函数，便于注入测试
const weightedPick = (pool, count, rnd) => {
  const rest = pool.map((p) => ({ name: p.name, weight: p.weight }))
  const winners = []
  const n = Math.max(0, Math.min(count, rest.length))
  for (let k = 0; k < n; k++) {
    const total = rest.reduce((sum, p) => sum + p.weight, 0)
    let r = rnd() * total
    let hitIdx = rest.length - 1
    for (let i = 0; i < rest.length; i++) {
      r -= rest[i].weight
      if (r < 0) {
        hitIdx = i
        break
      }
    }
    winners.push(rest[hitIdx].name)
    rest.splice(hitIdx, 1)
  }
  return winners
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const entriesText = ref('')
const winnerCount = ref(3)
const weighted = ref(true)
const rolling = ref(false)
const flashName = ref('')
const winners = ref([])
const resultImageUrl = ref('')
const seoContentVisible = ref(true)

// 定时器句柄（let，仅事件回调与卸载钩子中赋值）
let rollTimer = null
let endTimer = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const SAMPLE = [
  '小明',
  '阿花: 转发抽奖冲！',
  '阿花: 已关注一键三连',
  '大壮: 官方快点开吧',
  '大壮: 已转发',
  '大壮: 天天来蹲',
  '泡泡: 支持一下',
  '老王',
  'Lucky_77: 冲冲冲',
  '南风: 好运给我'
].join('\n')

const fillSample = () => { entriesText.value = SAMPLE }

const entries = computed(() => parseEntries(entriesText.value))
const pool = computed(() => buildPool(entries.value))

// 中奖人数按参与人数封顶
const effectiveWinnerCount = computed(() => {
  return Math.max(1, Math.min(Math.max(1, winnerCount.value || 1), pool.value.length))
})
const countClamped = computed(() => {
  return pool.value.length > 0 && Math.max(1, winnerCount.value || 1) > pool.value.length
})

const drawButtonLabel = computed(() => {
  if (rolling.value) return '开奖中…'
  return winners.value.length ? '重新抽取' : '开始抽奖'
})

const weightOf = (name) => {
  const found = pool.value.find((p) => p.name === name)
  return found ? found.weight : 1
}

// ---------- 密码级随机数 ----------
const cryptoRandom = () => {
  const arr = new Uint32Array(1)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
    return arr[0] / 4294967296
  }
  return Math.random()
}

// ---------- 开奖流程：滚动高亮 2 秒后定格 ----------
const draw = () => {
  if (!pool.value.length || rolling.value) return
  const finalWinners = weightedPick(
    weighted.value ? pool.value : pool.value.map((p) => ({ name: p.name, weight: 1 })),
    effectiveWinnerCount.value,
    cryptoRandom
  )

  rolling.value = true
  winners.value = []
  resultImageUrl.value = ''

  rollTimer = setInterval(() => {
    const names = pool.value
    flashName.value = names[Math.floor(cryptoRandom() * names.length)].name
  }, 80)

  endTimer = setTimeout(() => {
    if (rollTimer !== null) {
      clearInterval(rollTimer)
      rollTimer = null
    }
    endTimer = null
    rolling.value = false
    flashName.value = ''
    winners.value = finalWinners
    drawResultImage(finalWinners)
  }, 2000)
}

// ---------- 开奖结果图 ----------
const drawResultImage = (names) => {
  const W = 1000
  const H = 700
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 背景渐变
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#1e1b4b')
  grad.addColorStop(1, '#4c1d95')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // 装饰圆
  ctx.globalAlpha = 0.08
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(120, 610, 170, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(910, 90, 130, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // 标题与时间
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px sans-serif'
  ctx.fillText('开奖结果', W / 2, 110)
  ctx.font = '24px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  const timeStr = new Date().toLocaleString('zh-CN', { hour12: false })
  ctx.fillText('开奖时间：' + timeStr, W / 2, 155)

  // 中奖名单（两列，最多展示 12 人）
  const perCol = Math.ceil(Math.min(names.length, 12) / 2)
  const startX = names.length <= 6 ? W / 2 : W * 0.3
  const colGap = names.length <= 6 ? 0 : W * 0.4
  const startY = 250
  const rowGap = 64
  ctx.font = 'bold 32px sans-serif'
  const shown = Math.min(names.length, 12)
  for (let i = 0; i < shown; i++) {
    const col = names.length <= 6 ? 0 : Math.floor(i / perCol)
    const row = names.length <= 6 ? i : i % perCol
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fillText((i + 1) + '. ' + names[i], startX + col * colGap, startY + row * rowGap)
  }
  if (names.length > 12) {
    ctx.font = '24px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fillText('……等共 ' + names.length + ' 人', W / 2, startY + perCol * rowGap)
  }

  // 底部署名
  ctx.font = '20px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('由有条工具 · 评论区抽奖工具生成', W / 2, H - 40)

  resultImageUrl.value = canvas.toDataURL('image/png')
}

const downloadResult = () => {
  if (!resultImageUrl.value) return
  const link = document.createElement('a')
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  link.download = '抽奖结果_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.png'
  link.href = resultImageUrl.value
  link.click()
}

onUnmounted(() => {
  if (rollTimer !== null) clearInterval(rollTimer)
  if (endTimer !== null) clearTimeout(endTimer)
})
</script>
