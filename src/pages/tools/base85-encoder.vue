<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Binary class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Base85编码转换</h1>
          <p class="text-sm text-muted-foreground mt-1">Ascii85（Adobe 变体）编码与解码，支持 UTF-8，比 Base64 更紧凑</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        Base85（Ascii85）将每 4 个字节映射为 5 个可打印字符（字符集 ! 到 u），全零组缩写为 z，膨胀率仅 25%，低于 Base64 的 33%。支持 <~ ~> 包裹开关、UTF-8 中文、解码合法性校验，全部在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与配置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Sliders class="w-5 h-5 mr-2 text-primary" /> 输入与配置
          </h2>

          <div class="grid grid-cols-2 gap-1.5 mb-4">
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

          <textarea
            v-model="inputText"
            class="w-full h-40 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            :placeholder="mode === 'encode' ? '输入要编码的文本（支持中文）' : '粘贴 Base85/Ascii85 编码文本'"
            spellcheck="false"
          ></textarea>

          <label class="flex items-center justify-between cursor-pointer mt-4">
            <span class="text-sm text-foreground">Adobe 包裹符 &lt;~ ~&gt;</span>
            <button
              type="button"
              @click="wrapDelimiters = !wrapDelimiters; process()"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="wrapDelimiters ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="wrapDelimiters ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>

          <div class="flex items-center gap-2 mt-4">
            <button
              @click="process"
              class="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeftRight class="w-4 h-4" /> {{ mode === 'encode' ? '编码' : '解码' }}
            </button>
            <button
              @click="fillSample"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5"
            >
              <RefreshCw class="w-3.5 h-3.5" /> 样例
            </button>
            <button
              @click="clearAll"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-sm transition-all"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 统计 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 统计信息
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-foreground">{{ stats.inputBytes }}</p>
              <p class="text-xs text-muted-foreground">输入字节</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-foreground">{{ stats.outputChars }}</p>
              <p class="text-xs text-muted-foreground">输出字符</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-foreground">{{ stats.ratio }}</p>
              <p class="text-xs text-muted-foreground">膨胀率</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3">Base85 膨胀率约 1.25（5/4），Base64 为 1.33（4/3），Base85 每编码 4 字节省约 6% 体积。</p>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileCode class="w-5 h-5 mr-2 text-primary" />
              {{ mode === 'encode' ? '编码结果' : '解码结果' }}
            </h2>
            <button
              @click="copyOutput"
              :disabled="!outputText"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>
          </div>
          <div class="p-6">
            <textarea
              v-if="outputText && !errorMsg"
              :value="outputText"
              readonly
              class="w-full h-80 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <div v-else-if="errorMsg" class="py-16 text-center">
              <XCircle class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">转换失败</p>
              <p class="text-xs text-muted-foreground">{{ errorMsg }}</p>
            </div>
            <div v-else class="py-16 text-center">
              <Binary class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入内容后点击「{{ mode === 'encode' ? '编码' : '解码' }}」，这里会显示结果</p>
            </div>
          </div>
        </div>

        <!-- 编码说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 编码规则
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 每 4 个字节拼成 32 位整数，按 85 进制拆成 5 个字符，字符集为 ASCII 33（<span class="font-mono">!</span>）到 117（<span class="font-mono">u</span>）</li>
            <li>• 4 个字节全为 0 时用单个 <span class="font-mono">z</span> 表示（仅在分组起始处合法）</li>
            <li>• 尾部不足 4 字节时补零编码，只取前「剩余字节数 + 1」个字符；解码时用 <span class="font-mono">u</span>（84）补齐还原</li>
            <li>• Adobe 变体使用 <span class="font-mono">&lt;~</span> 与 <span class="font-mono">~&gt;</span> 包裹整段数据，常用于 PDF 与 PostScript</li>
            <li>• 解码时会校验字符范围、z 的位置与溢出，防止静默产生错误数据</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Base85 vs Base64 对比 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Table class="w-5 h-5 mr-2 text-primary" /> Base85 与 Base64 对比
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-muted">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-foreground">对比项</th>
              <th class="px-4 py-3 text-left font-medium text-foreground">Base64</th>
              <th class="px-4 py-3 text-left font-medium text-foreground">Base85（Ascii85）</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-border">
              <td class="px-4 py-3 text-muted-foreground">字符集</td>
              <td class="px-4 py-3 text-foreground">A-Z a-z 0-9 + /（64 个）</td>
              <td class="px-4 py-3 text-foreground">ASCII 33~117（! 到 u，85 个）</td>
            </tr>
            <tr class="border-t border-border">
              <td class="px-4 py-3 text-muted-foreground">膨胀率</td>
              <td class="px-4 py-3 text-foreground">4/3 ≈ 133%</td>
              <td class="px-4 py-3 text-foreground">5/4 = 125%</td>
            </tr>
            <tr class="border-t border-border">
              <td class="px-4 py-3 text-muted-foreground">分组方式</td>
              <td class="px-4 py-3 text-foreground">3 字节 → 4 字符（6 bit）</td>
              <td class="px-4 py-3 text-foreground">4 字节 → 5 字符（32 位整数）</td>
            </tr>
            <tr class="border-t border-border">
              <td class="px-4 py-3 text-muted-foreground">特殊字符</td>
              <td class="px-4 py-3 text-foreground">无（URL 安全变体用 - _）</td>
              <td class="px-4 py-3 text-foreground">含 , . ; ' 等标点，z 缩写全零组</td>
            </tr>
            <tr class="border-t border-border">
              <td class="px-4 py-3 text-muted-foreground">典型应用</td>
              <td class="px-4 py-3 text-foreground">邮件 MIME、Data URI、JWT</td>
              <td class="px-4 py-3 text-foreground">PDF / PostScript 内嵌流、Git 二进制补丁、Adobe 系产品</td>
            </tr>
            <tr class="border-t border-border">
              <td class="px-4 py-3 text-muted-foreground">UTF-8 支持</td>
              <td class="px-4 py-3 text-foreground" colspan="2">本工具均先经 TextEncoder 转为 UTF-8 字节再编码，中文等多字节字符可无损还原</td>
            </tr>
          </tbody>
        </table>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于Base85编码转换</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Base85（又称 Ascii85）是一种将二进制数据编码为可打印 ASCII 字符的方案：把每 4 个字节当作一个 32 位大整数，用 85 进制写成 5 个字符，字符集从 <span class="font-mono">!</span>（33）到 <span class="font-mono">u</span>（117）。相比 Base64 每 3 字节输出 4 字符（膨胀 33%），Base85 每 4 字节输出 5 字符（膨胀 25%），体积更小。Adobe 变体在 PDF 与 PostScript 文件中广泛用于内嵌二进制流，并使用 <span class="font-mono">&lt;~ ~&gt;</span> 作为定界符。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>阅读 PDF 内部结构（对象流常用 Ascii85 + Flate 双重编码）时解码分析</li>
            <li>Git 二进制补丁（git diff --binary）中出现的 Base85 数据块解码</li>
            <li>需要比 Base64 更省字节的文本通道二进制传输方案设计</li>
            <li>CTF 与安全研究中的多层编码还原</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">中文能编码吗？</span>可以。工具先用 TextEncoder 把文本转成 UTF-8 字节再编码，解码时按 UTF-8 还原，中文与 Emoji 均可无损往返。</li>
            <li><span class="text-foreground font-medium">z 是什么？</span>4 个字节全为 0 的分组缩写为单个字符 z，可显著压缩长串零（如 PDF 中的空数据），但 z 只能出现在分组边界。</li>
            <li><span class="text-foreground font-medium">编码结果为什么包含标点符号？</span>Base85 字符集覆盖 ASCII 33~117，包含逗号、分号、引号等标点，复制时注意不要被聊天软件转换成全角字符。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'base85-encoder'" :category="'encode'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Binary, Sliders, ArrowLeftRight, RefreshCw, Copy, Info, FileCode,
  XCircle, Table, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Base85编码转换 - Ascii85编码解码在线工具',
  description: 'Base85（Ascii85）在线编码解码工具，Adobe变体支持<~ ~>包裹符与z缩写，UTF-8中文无损往返，含膨胀率统计与Base85/Base64对比说明',
  keywords: 'base85, ascii85, base85编码, ascii85解码, base85 base64, pdf编码, 编码转换',
  author: 'Util工具箱',
  ogTitle: 'Base85编码转换 - 有条工具',
  ogDescription: 'Ascii85编码解码，Adobe变体<~ ~>包裹，UTF-8中文无损，比Base64更紧凑',
  ogUrl: 'https://www.util.cn/tools/base85-encoder',
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
          name: 'Base85编码转换',
          url: 'https://www.util.cn/tools/base85-encoder',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Ascii85编码', 'Ascii85解码', 'Adobe包裹符支持', 'UTF-8中文支持', '非法字符校验']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '编码解码', item: 'https://www.util.cn/encode/' },
            { '@type': 'ListItem', position: 3, name: 'Base85编码转换', item: 'https://www.util.cn/tools/base85-encoder/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'base85-encoder')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const CHARSET = Array.from({ length: 85 }, (_, i) => String.fromCharCode(33 + i)).join('')
const mode = ref('encode')
const inputText = ref('')
const wrapDelimiters = ref(true)
const outputText = ref('')
const errorMsg = ref('')
const seoContentVisible = ref(true)

const modeOptions = [
  { value: 'encode', label: '编码' },
  { value: 'decode', label: '解码' }
]

const switchMode = (m) => {
  mode.value = m
  // 编码结果可直接作为解码输入，方便往返验证
  if (outputText.value && !errorMsg.value) {
    inputText.value = outputText.value
  }
  process()
}

// ---------- Ascii85 编码（Adobe 变体） ----------
const encodeAscii85 = (bytes, wrap) => {
  let out = ''
  for (let i = 0; i < bytes.length; i += 4) {
    const chunkLen = Math.min(4, bytes.length - i)
    const b0 = bytes[i]
    const b1 = chunkLen > 1 ? bytes[i + 1] : 0
    const b2 = chunkLen > 2 ? bytes[i + 2] : 0
    const b3 = chunkLen > 3 ? bytes[i + 3] : 0
    const value = b0 * 0x1000000 + b1 * 0x10000 + b2 * 0x100 + b3
    if (value === 0 && chunkLen === 4) {
      out += 'z'
      continue
    }
    let v = value
    const digits = new Array(5)
    for (let j = 4; j >= 0; j--) {
      digits[j] = CHARSET[v % 85]
      v = Math.floor(v / 85)
    }
    out += digits.slice(0, chunkLen === 4 ? 5 : chunkLen + 1).join('')
  }
  return wrap ? '<~' + out + '~>' : out
}

// ---------- Ascii85 解码（含校验） ----------
const decodeAscii85 = (text) => {
  let s = text
  // 若包含 Adobe 定界符则自动剥除
  if (s.includes('<~')) {
    s = s.replace(/<~/g, '')
    s = s.replace(/~>/g, '')
  }
  s = s.replace(/\s+/g, '')

  const bytes = []
  let group = []
  const flushGroup = (isFinal, tailLen) => {
    while (group.length < 5) group.push(84) // 'u' - 33 = 84
    let value = 0
    for (const d of group) value = value * 85 + d
    if (value > 0xFFFFFFFF) {
      throw new Error('分组数值溢出（编码数据可能已损坏）')
    }
    const chunk = [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]
    const take = isFinal ? tailLen : 4
    bytes.push(...chunk.slice(0, take))
    group = []
  }

  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === 'z') {
      if (group.length > 0) {
        throw new Error('字符 z 只能出现在分组起始处（位置 ' + i + '）')
      }
      bytes.push(0, 0, 0, 0)
      i++
      continue
    }
    const code = ch.charCodeAt(0)
    if (code < 33 || code > 117) {
      throw new Error('非法字符「' + ch + '」（位置 ' + i + '）：Base85 字符集为 ! 到 u')
    }
    group.push(code - 33)
    if (group.length === 5) {
      flushGroup(false, 4)
    }
    i++
  }

  if (group.length > 0) {
    if (group.length === 1) {
      throw new Error('末尾分组只有 1 个字符，无法还原字节')
    }
    flushGroup(true, group.length - 1)
  }

  return new Uint8Array(bytes)
}

// ---------- 处理 ----------
const process = () => {
  errorMsg.value = ''
  outputText.value = ''
  const text = inputText.value
  if (!text) return

  try {
    if (mode.value === 'encode') {
      const bytes = new TextEncoder().encode(text)
      outputText.value = encodeAscii85(bytes, wrapDelimiters.value)
    } else {
      const bytes = decodeAscii85(text)
      outputText.value = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    }
  } catch (err) {
    errorMsg.value = err?.message || '转换失败，请检查输入内容'
  }
}

// ---------- 统计 ----------
const stats = computed(() => {
  const raw = inputText.value
  if (!raw || errorMsg.value) {
    return { inputBytes: 0, outputChars: 0, ratio: '-' }
  }
  const inBytes = new TextEncoder().encode(raw).length
  if (!outputText.value) {
    return { inputBytes: inBytes, outputChars: 0, ratio: '-' }
  }
  // 输出与输入统计均剔除 <~ ~> 包裹符与空白
  const outCore = outputText.value.replace(/^<~/, '').replace(/~>$/, '')
  let ratio = '-'
  if (mode.value === 'encode' && inBytes > 0) {
    ratio = (outCore.length / inBytes).toFixed(2)
  } else if (mode.value === 'decode') {
    const coreInput = raw.replace(/<~/g, '').replace(/~>/g, '').replace(/\s+/g, '')
    const decodedBytes = new TextEncoder().encode(outputText.value).length
    if (coreInput.length > 0 && decodedBytes > 0) {
      ratio = (decodedBytes / coreInput.length).toFixed(2)
    }
  }
  return { inputBytes: inBytes, outputChars: outCore.length, ratio }
})

// ---------- 交互 ----------
const copyOutput = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const fillSample = () => {
  if (mode.value === 'encode') {
    inputText.value = 'Hello, Base85! 这是一段包含中文与 Emoji 🎉 的测试文本。'
    } else {
      // "Hello, Ascii85!" 的 Adobe 变体编码结果
      inputText.value = '<~87cURD_*"sF(8ou3&Mi~>'
    }
  process()
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  errorMsg.value = ''
}
</script>
