<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <EyeOff class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">零宽字符编码器</h1>
          <p class="text-sm text-muted-foreground mt-1">用零宽字符把隐藏信息嵌入普通文本，支持编码、解码、检测与清理</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        零宽字符（U+200B / U+200C / U+200D）在屏幕上完全不显示，却真实存在于文本中。本工具将隐藏消息按 8-bit 编码进零宽字符并嵌入载体文本，肉眼不可见但可完整提取；同时提供检测与一键清理功能，全部在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Sliders class="w-5 h-5 mr-2 text-primary" /> 工作模式
          </h2>

          <div class="grid grid-cols-4 gap-1.5 mb-4">
            <button
              v-for="opt in modeOptions"
              :key="opt.value"
              @click="switchMode(opt.value)"
              :class="mode === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              {{ opt.label }}
            </button>
          </div>

          <!-- 编码模式输入 -->
          <template v-if="mode === 'encode'">
            <label class="block text-sm font-medium text-foreground mb-2">载体文本（隐藏信息将嵌入其中）</label>
            <textarea
              v-model="carrier"
              class="w-full h-28 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="输入一段正常展示的文本，例如：今天的会议纪要已发邮件。"
            ></textarea>
            <label class="block text-sm font-medium text-foreground mb-2 mt-3">隐藏消息（需要秘密携带的内容）</label>
            <textarea
              v-model="secret"
              class="w-full h-20 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="输入要隐藏的消息，支持中文，例如：来自张三"
            ></textarea>
          </template>

          <!-- 其他模式输入 -->
          <template v-else>
            <label class="block text-sm font-medium text-foreground mb-2">待分析文本</label>
            <textarea
              v-model="analysisInput"
              class="w-full h-40 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              :placeholder="mode === 'decode' ? '粘贴含零宽字符的文本，提取其中的隐藏消息' : '粘贴任意文本进行零宽字符检测或清理'"
              spellcheck="false"
            ></textarea>
          </template>

          <button
            v-if="mode === 'encode'"
            @click="runEncode"
            class="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <Type class="w-4 h-4" /> 生成嵌入文本
          </button>
        </div>

        <!-- 编码说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 编码方案
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 隐藏消息先经 UTF-8 编码为字节序列，每个字节拆成 8 个二进制位</li>
            <li>• 位 <span class="font-mono">0</span> → U+200B（零宽空格），位 <span class="font-mono">1</span> → U+200C（零宽连字）</li>
            <li>• 每个字节之间用 U+200D（零宽连接符）分隔，整段追加在载体文本末尾</li>
            <li>• 视觉上载体文本完全不变，体积每隐藏 1 字节增加 9 个零宽字符</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="space-y-6">
        <!-- 编码输出 -->
        <div v-if="mode === 'encode'" class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileCode class="w-5 h-5 mr-2 text-primary" /> 嵌入后的文本
            </h2>
            <button
              @click="copyText(embedOutput)"
              :disabled="!embedOutput"
              class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制嵌入文本
            </button>
          </div>
          <div class="p-6">
            <textarea
              v-if="embedOutput"
              :value="embedOutput"
              readonly
              class="w-full h-48 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:outline-none resize-y"
            ></textarea>
            <div v-else class="py-16 text-center">
              <EyeOff class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">填入载体文本与隐藏消息后生成，输出看起来与原文一模一样</p>
            </div>
            <p v-if="embedOutput" class="text-xs text-muted-foreground mt-3">
              已隐藏 {{ secretByteCount }} 字节，新增 {{ hiddenCharCount }} 个零宽字符。复制后可粘贴到微信、邮件、网页等任意支持 Unicode 的地方。
            </p>
          </div>
        </div>

        <!-- 解码输出 -->
        <div v-else-if="mode === 'decode'" class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Search class="w-5 h-5 mr-2 text-primary" /> 隐藏消息
            </h2>
            <button
              @click="copyText(decodedMessage)"
              :disabled="!decodedMessage"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>
          </div>
          <div class="p-6">
            <template v-if="analysisInput">
              <div v-if="decodedMessage" class="bg-muted/50 rounded-lg p-4">
                <p class="text-base text-foreground break-all">{{ decodedMessage }}</p>
              </div>
              <div v-else-if="analysisError" class="py-8 text-center">
                <XCircle class="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p class="text-sm text-destructive">{{ analysisError }}</p>
              </div>
              <div v-else class="py-8 text-center">
                <Search class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p class="text-sm text-muted-foreground">文本中没有发现零宽字符，未隐藏任何消息</p>
              </div>
            </template>
            <div v-else class="py-16 text-center">
              <Search class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">粘贴含零宽字符的文本，这里会还原隐藏消息</p>
            </div>
          </div>
        </div>

        <!-- 检测输出 -->
        <div v-else-if="mode === 'detect'" class="bg-card border border-border rounded-lg">
          <div class="px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Search class="w-5 h-5 mr-2 text-primary" /> 检测报告
            </h2>
          </div>
          <div class="p-6">
            <template v-if="analysisInput">
              <div v-if="detectReport.total === 0" class="py-8 text-center">
                <CheckCircle class="w-10 h-10 mx-auto mb-3 text-green-500" />
                <p class="text-sm text-foreground font-medium">未检测到零宽字符</p>
                <p class="text-xs text-muted-foreground mt-1">文本是干净的，共 {{ analysisInput.length }} 个字符</p>
              </div>
              <div v-else class="space-y-3">
                <div class="grid grid-cols-5 gap-2">
                  <div v-for="t in detectReport.types" :key="t.name" class="bg-muted/50 rounded-lg p-3 text-center">
                    <p class="text-lg font-bold" :class="t.count > 0 ? 'text-foreground' : 'text-muted-foreground'">{{ t.count }}</p>
                    <p class="text-xs text-muted-foreground">{{ t.name }}</p>
                    <p class="text-xs font-mono text-muted-foreground">{{ t.code }}</p>
                  </div>
                </div>
                <div class="bg-muted/50 rounded-lg p-4">
                  <p class="text-xs text-muted-foreground leading-relaxed">
                    共发现 <span class="text-foreground font-medium">{{ detectReport.total }}</span> 个零宽字符，
                    可见字符 {{ detectReport.visibleLength }} 个，隐藏字符 {{ detectReport.total }} 个。
                    <span v-if="detectReport.total > 0" class="text-yellow-500">该文本可能携带隐藏信息或水印。</span>
                  </p>
                  <p v-if="detectReport.positions.length" class="text-xs text-muted-foreground mt-2">
                    位置（第几个字符）：<span class="font-mono">{{ detectReport.positions.slice(0, 30).join('、') }}{{ detectReport.positions.length > 30 ? ' …' : '' }}</span>
                  </p>
                </div>
              </div>
            </template>
            <div v-else class="py-16 text-center">
              <Search class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">粘贴文本，检测其中的零宽字符数量与位置</p>
            </div>
          </div>
        </div>

        <!-- 清理输出 -->
        <div v-else class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <XCircle class="w-5 h-5 mr-2 text-primary" /> 清理后的文本
            </h2>
            <button
              @click="copyText(cleanedText)"
              :disabled="!cleanedText"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>
          </div>
          <div class="p-6">
            <textarea
              v-if="analysisInput"
              :value="cleanedText"
              readonly
              class="w-full h-40 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:outline-none resize-y"
            ></textarea>
            <div v-else class="py-16 text-center">
              <XCircle class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">粘贴文本，一键移除全部零宽字符</p>
            </div>
            <p v-if="analysisInput" class="text-xs text-muted-foreground mt-3">
              已移除 {{ detectReport.total }} 个零宽字符，移除比例 {{ detectReport.total > 0 ? ((detectReport.total / analysisInput.length) * 100).toFixed(1) : '0' }}%。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 用途与风险 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
          <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 合理用途
        </h3>
        <ul class="text-xs text-muted-foreground space-y-2">
          <li>• <span class="text-foreground">文本水印溯源</span>：给不同渠道分发的文案嵌入不同 ID，泄露后可定位来源</li>
          <li>• <span class="text-foreground">隐蔽传递信息</span>：在看似正常的文本中夹带暗号，适合 CTF 与安全教学</li>
          <li>• <span class="text-foreground">防复制标记</span>：论坛文章、小说站用于追踪洗稿行为</li>
        </ul>
      </div>
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
          <AlertTriangle class="w-4 h-4 mr-2 text-primary" /> 风险提示
        </h3>
        <ul class="text-xs text-muted-foreground space-y-2">
          <li>• 零宽字符可能被用于隐藏违规关键词以绕过内容审核，使用时请遵守平台规则与法律</li>
          <li>• 部分 SQL/NoSQL 数据库、搜索引擎对零宽字符的匹配行为不同，可能造成数据异常</li>
          <li>• 用户名等场景嵌入零宽字符可用于仿冒混淆（钓鱼），请在敏感输入框中使用「清理模式」校验</li>
          <li>• 某些字体/终端可能把零宽字符渲染为豆腐块或意外换行</li>
        </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于零宽字符编码器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            零宽字符是一类宽度为零、不可见但合法存在的 Unicode 字符，最常用的有 U+200B（零宽空格）、U+200C（零宽非连接符）与 U+200D（零宽连接符）。把它们当作二进制的 0 和 1，就可以把任意消息「缝」进一段普通文本——载体文本看起来毫无变化，但用解码工具即可还原出隐藏内容。这种技术常用于文本水印与信息溯源，也是 CTF 中经典的隐写考点。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>内容分发水印：给不同用户/渠道发送嵌入了不同 ID 的同一篇文章，泄露可溯源</li>
            <li>CTF 隐写题：解析或构造零宽字符隐藏的 flag</li>
            <li>文本安全检查：检测粘贴内容里是否被塞入不可见字符（配合检测/清理模式）</li>
            <li>清理从网页复制的文本中的隐形字符，避免搜索与比对异常</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">嵌入后体积会变大吗？</span>会。本方案每隐藏 1 字节需要 9 个零宽字符，但所有字符都不显示，肉眼与常规阅读完全无感。</li>
            <li><span class="text-foreground font-medium">支持中文吗？</span>支持。隐藏消息先按 UTF-8 编码为字节再逐位映射，中文、Emoji 均可无损还原。</li>
            <li><span class="text-foreground font-medium">为什么复制到某些平台会失效？</span>部分平台会过滤零宽字符或对文本做规范化（NFKC），粘贴后可先用「检测模式」确认字符是否还在。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'zero-width-encoder'" :category="'encode'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  EyeOff, Sliders, Type, FileCode, Copy, Info, Search,
  CheckCircle, XCircle, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '零宽字符编码器 - 文本隐写与隐形水印工具',
  description: '零宽字符编码器在线工具，把隐藏消息嵌入文本实现隐形水印与信息溯源，支持编码、解码、检测与一键清理，UTF-8中文无损还原，纯本地处理',
  keywords: '零宽字符, 零宽空格, 文本隐写, 隐形水印, 零宽字符解码, 文本水印, u200b',
  author: 'Util工具箱',
  ogTitle: '零宽字符编码器 - 有条工具',
  ogDescription: '用零宽字符把隐藏信息嵌入普通文本，支持编码、解码、检测与清理',
  ogUrl: 'https://www.util.cn/tools/zero-width-encoder',
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
          name: '零宽字符编码器',
          url: 'https://www.util.cn/tools/zero-width-encoder',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['零宽字符编码', '隐藏信息解码', '零宽字符检测', '一键清理', 'UTF-8中文支持']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '编码解码', item: 'https://www.util.cn/encode/' },
            { '@type': 'ListItem', position: 3, name: '零宽字符编码器', item: 'https://www.util.cn/tools/zero-width-encoder/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'zero-width-encoder')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 常量 ----------
const ZWSP = '\u200B' // 零宽空格 → bit 0
const ZWNJ = '\u200C' // 零宽非连接符 → bit 1
const ZWJ = '\u200D'  // 零宽连接符 → 字节分隔符
const ZW_CHARS = [ZWSP, ZWNJ, ZWJ]

const modeOptions = [
  { value: 'encode', label: '编码' },
  { value: 'decode', label: '解码' },
  { value: 'detect', label: '检测' },
  { value: 'clean', label: '清理' }
]

// ---------- 状态 ----------
const mode = ref('encode')
const carrier = ref('')
const secret = ref('')
const analysisInput = ref('')
const embedOutput = ref('')
const decodedMessage = ref('')
const analysisError = ref('')
const seoContentVisible = ref(true)

// ---------- 编码 ----------
const runEncode = () => {
  embedOutput.value = ''
  if (!carrier.value && !secret.value) return
  if (!secret.value) {
    embedOutput.value = carrier.value
    return
  }
  embedOutput.value = carrier.value + encodeMessage(secret.value)
}

const encodeMessage = (msg) => {
  const bytes = new TextEncoder().encode(msg)
  const groups = []
  for (const b of bytes) {
    let bits = ''
    for (let i = 7; i >= 0; i--) {
      bits += ((b >> i) & 1) ? ZWNJ : ZWSP
    }
    groups.push(bits)
  }
  return groups.join(ZWJ)
}

const secretByteCount = computed(() => new TextEncoder().encode(secret.value).length)
const hiddenCharCount = computed(() => {
  if (!embedOutput.value || !carrier.value) return 0
  return embedOutput.value.length - carrier.value.length
})

// ---------- 解码 ----------
const decodeMessage = (text) => {
  let stream = ''
  for (const ch of text) {
    if (ch === ZWSP || ch === ZWNJ || ch === ZWJ) stream += ch
  }
  if (!stream) return ''
  const groups = stream.split(ZWJ)
  const bytes = []
  for (const g of groups) {
    if (!g) continue
    if (g.length !== 8) {
      throw new Error('零宽字符流不完整（某字节长度为 ' + g.length + ' 位），可能被平台过滤或截断')
    }
    let byte = 0
    for (const ch of g) {
      byte = byte * 2 + (ch === ZWNJ ? 1 : 0)
    }
    bytes.push(byte)
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes))
}

// ---------- 检测 / 清理 ----------
const ZW_TYPES = [
  { name: 'ZWSP', code: 'U+200B', test: ch => ch === ZWSP },
  { name: 'ZWNJ', code: 'U+200C', test: ch => ch === ZWNJ },
  { name: 'ZWJ', code: 'U+200D', test: ch => ch === ZWJ },
  { name: 'BOM', code: 'U+FEFF', test: ch => ch === '\uFEFF' },
  { name: 'WJ', code: 'U+2060', test: ch => ch === '\u2060' }
]

const detectReport = computed(() => {
  const text = analysisInput.value
  if (!text) return { total: 0, visibleLength: 0, positions: [], types: ZW_TYPES.map(t => ({ ...t, count: 0 })) }
  const chars = Array.from(text)
  const positions = []
  let total = 0
  const types = ZW_TYPES.map(t => ({ ...t, count: 0 }))
  chars.forEach((ch, idx) => {
    for (const t of types) {
      if (t.test(ch)) {
        t.count++
        total++
        positions.push(idx + 1)
        return
      }
    }
  })
  return {
    total,
    visibleLength: chars.length - total,
    positions,
    types
  }
})

const cleanedText = computed(() => {
  const text = analysisInput.value
  if (!text) return ''
  return Array.from(text).filter(ch => !ZW_TYPES.some(t => t.test(ch))).join('')
})

// ---------- 模式切换时自动执行 ----------
const switchMode = (m) => {
  mode.value = m
  if (m === 'decode') {
    decodedMessage.value = ''
    analysisError.value = ''
    if (analysisInput.value) {
      try {
        decodedMessage.value = decodeMessage(analysisInput.value)
      } catch (err) {
        analysisError.value = err?.message || '解码失败'
      }
    }
  }
}

// 输入变化时自动解码
watch(analysisInput, () => {
  analysisError.value = ''
  decodedMessage.value = ''
  if (mode.value === 'decode' && analysisInput.value) {
    try {
      decodedMessage.value = decodeMessage(analysisInput.value)
    } catch (err) {
      analysisError.value = err?.message || '解码失败'
    }
  }
})

// ---------- 复制 ----------
const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
