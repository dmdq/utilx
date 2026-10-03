<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wand2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">文本乱码修复器</h1>
          <p class="text-sm text-muted-foreground mt-1">多链路自动尝试还原 UTF-8 / GBK 乱码文本，纯本地计算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴乱码文本，工具会自动尝试多条「字符 → 字节 → 重新解码」修复链路（Latin1 误读、CP1252 误读、GBK 误读、UTF-8 双重编码），列出候选结果及链路说明，按可读性排序后点击复制采用。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入与说明 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> 乱码文本
          </h2>
          <textarea
            v-model="inputText"
            class="w-full h-48 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴乱码文本，例如：&#10;ä½ å¥½&#10;浣犲ソ涓栫晫&#10;Donâ€™t â€¦okâ€¦"
            spellcheck="false"
          ></textarea>
          <div
            v-if="hasReplacement"
            class="mt-3 flex items-start gap-2 bg-muted/50 border border-border rounded-lg p-3"
          >
            <AlertTriangle class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p class="text-xs text-muted-foreground">
              输入中包含替换符 <span class="text-foreground font-mono">�</span>（U+FFFD）。解码产生替换符时原始字节已被丢弃，这部分内容的信息已丢失，可能无法完整修复。
            </p>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-4">
            <button
              @click="fixAll"
              :disabled="!inputText.trim() || fixing"
              class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Loader2 v-if="fixing || building" class="w-4 h-4 animate-spin" />
              <RefreshCw v-else class="w-4 h-4" />
              {{ building ? '正在构建编码表…' : (fixing ? '修复中…' : '自动修复') }}
            </button>
            <button
              @click="clearAll"
              :disabled="!inputText && results.length === 0"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 class="w-4 h-4" /> 清空
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-3">
            提示：请粘贴乱码的「最终形态」（不要中途手动转码）；首次修复含中文的乱码时，需构建 GBK 编码表（约几十毫秒）。
          </p>
        </div>

        <!-- 乱码成因说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 乱码是怎么产生的
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 乱码的本质是<span class="text-foreground">字节序列被用错误的字符集解码</span>：正确的字节被解读成了错误的字符（如 UTF-8 字节被按 Latin1/GBK 解码）</li>
            <li>• 修复思路是反向操作：把错误字符还原回原始字节，再用正确的字符集重新解码，即「字符 → 字节 → 重新解码」</li>
            <li>• 工具会自动尝试：Latin1 误读还原、CP1252 误读还原（€‚ƒ„… 等高位字符）、GBK 误读还原（再按 UTF-8 / Big5 解码）、UTF-8 双重编码还原</li>
            <li>• <span class="text-foreground">带 �（U+FFFD）的文本无法修复</span>：解码器遇到无法映射的字节时输出替换符并丢弃原始字节，信息已彻底丢失，只能回到源数据重新获取</li>
            <li>• 文本被多次转码、或丢失了部分字节时，修复结果可能不完整，请以候选内容为准人工确认</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：候选结果 -->
      <div class="bg-card border border-border rounded-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 候选结果
          </h2>
          <p v-if="results.length > 0" class="text-xs text-muted-foreground">按可读性排序，共 {{ results.length }} 条</p>
        </div>
        <div class="p-6">
          <!-- 构建编码表 -->
          <div v-if="building" class="py-16 text-center">
            <Loader2 class="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
            <p class="text-sm text-muted-foreground">正在构建 GBK 编码表（约 2.4 万次映射，仅需一次）…</p>
          </div>
          <!-- 候选列表 -->
          <div v-else-if="results.length > 0" class="space-y-4">
            <div v-for="(c, idx) in results" :key="idx" class="border border-border rounded-lg p-4 bg-muted/30">
              <div class="flex items-center justify-between gap-3 mb-2">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <CheckCircle class="w-4 h-4 text-primary flex-shrink-0" />
                    {{ c.label }}
                  </p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ c.desc }}</p>
                </div>
                <button
                  @click="copyText(c.text)"
                  class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1 flex-shrink-0"
                >
                  <Copy class="w-3.5 h-3.5" /> 复制
                </button>
              </div>
              <p class="text-sm text-foreground font-mono whitespace-pre-wrap break-all bg-background border border-border rounded p-3 max-h-40 overflow-auto">{{ c.display }}<span v-if="c.text.length > 200">…</span></p>
            </div>
          </div>
          <!-- 无结果 -->
          <div v-else-if="fixed" class="py-16 text-center">
            <FileWarning class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-foreground font-medium mb-1">没有找到可用的修复结果</p>
            <p class="text-xs text-muted-foreground">所有链路都无法提升可读性；若文本包含 �，原始信息可能已丢失。</p>
          </div>
          <!-- 空状态 -->
          <div v-else class="py-16 text-center">
            <Wand2 class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">粘贴乱码文本并点击「自动修复」，候选结果会显示在这里</p>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于文本乱码修复器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            「浣犲ソ」「ä½ å¥½」「â€"」……这些看不懂的字符是典型的乱码：原本的字节序列被用错误的字符集解码，生成了错误的文字。乱码修复不是「翻译」，而是逆向还原——把当前字符变回字节，再用正确的字符集解一次码。本工具自动尝试多种常见误读链路，给出全部候选结果。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见乱码对照</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-mono">ä½ å¥½</span> 类：UTF-8 字节被按 Latin1 误读，走 Latin1 还原链路</li>
            <li><span class="text-foreground font-mono">â€&#x153;hello&#x201d;â€¦</span> 类：UTF-8 字节被按 CP1252 误读（出现 € ‚ ƒ „ … 等特征字符），走 CP1252 还原链路</li>
            <li><span class="text-foreground font-mono">浣犲ソ</span> 类：UTF-8 字节被按 GBK 误读，走 GBK 还原链路（可再尝试 UTF-8 / Big5 两个方向）</li>
            <li><span class="text-foreground font-mono">ä¸­æ–‡</span> 嵌套乱码：UTF-8 被两次误读，走双重编码还原链路</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么带 � 的文本修不好？</span>�（U+FFFD）是解码失败时的替换符，原始字节在解码时已被丢弃，信息不可逆地丢失了。</li>
            <li><span class="text-foreground font-medium">为什么给出多个候选？</span>工具无法确定原始编码，只能全部尝试并按中文/英文可读性启发式排序，由你来确认哪个是正确结果。</li>
            <li><span class="text-foreground font-medium">文本会上传吗？</span>不会，所有修复计算都在浏览器本地完成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mojibake-fixer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wand2, FileText, CheckCircle, Copy, RefreshCw, Trash2, Info, AlertTriangle,
  Loader2, FileWarning, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '文本乱码修复器 - 在线修复UTF-8/GBK乱码文本',
  description: '在线乱码修复工具，自动尝试Latin1/CP1252/GBK误读还原与UTF-8双重编码等多条修复链路，修复浣犲ソ、ä½ å¥½、â€"类乱码，纯本地计算不上传',
  keywords: '乱码修复, 乱码转换, utf-8乱码, gbk乱码, 乱码还原, 文本乱码, 浣犲ソ, 在线转码',
  author: 'Util工具箱',
  ogTitle: '文本乱码修复器 - 有条工具',
  ogDescription: '多链路自动尝试还原 UTF-8 / GBK 乱码文本，纯本地计算',
  ogUrl: 'https://www.util.cn/tools/mojibake-fixer',
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
          name: '文本乱码修复器',
          url: 'https://www.util.cn/tools/mojibake-fixer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Latin1误读还原', 'CP1252误读还原', 'GBK误读还原（UTF-8/Big5双向）', 'UTF-8双重编码还原', '候选按可读性排序']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '文本乱码修复器', item: 'https://www.util.cn/tools/mojibake-fixer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么带替换符�的乱码文本无法修复？',
              acceptedAnswer: { '@type': 'Answer', text: '解码器遇到无法映射的字节时输出替换符并丢弃原始字节，信息已不可逆丢失，只能从源数据重新获取。' }
            },
            {
              '@type': 'Question',
              name: '乱码修复会上传文本到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，所有修复计算都在浏览器本地完成，数据不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'mojibake-fixer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const inputText = ref('')
const results = ref([])
const fixing = ref(false)
const building = ref(false)
const fixed = ref(false)
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const hasReplacement = computed(() => inputText.value.includes('\uFFFD'))

// ---------- 可读性启发式（常用中文字符占比高者得分高） ----------
// 内置常用汉字表（约 450 个高频字），用于区分「常用中文」与「误读出的生僻 CJK 字符」
const COMMON_CJK = '的一是了我不人在他有这上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感见明问力理尔点文几定本公特做外孩相西果走将月十实向声车全信重三机工物气每并别真打太新比才便夫再书部水像眼等体却加电主界门利海受听表德少克代员许先口由死安写性马光白或住难望教命花结乐色更拉东神记处让母父应直字场平报友关放至张认接告入笑内英军候民岁往何度山觉路带万男边风解叫任金快原吃妈变通师立象数四失满战远格士音轻目条呢病始达深完今提求清王化空业思切怎非找片罗钱吗语元喜曾离飞科言干流欢约各即指合反题必该论交终林请医晚制球决传画保读运及则房早院量苦火布品近坐产答星精视五连司巴奇管类未朋且婚台夜青北队久乎越观落尽形影红爸百令周吧识步希亚术留市半热送兴造谈容极随演收首根讲整式取照办强石古华拿计您装似足双妻尼转诉米称丽客南领节衣站黑刻统断福城故历惊脸选包紧争另建维绝树系伤示愿持千史谁准联妇纪基买志静阿诗独复痛消社算义竟确酒需单治卡幸兰念举援洋恐妙句若退私'
const COMMON_CJK_SET = new Set(COMMON_CJK.split(''))

const readabilityScore = (s) => {
  if (!s) return -1
  let score = 0
  for (const ch of s) {
    const c = ch.codePointAt(0)
    if ((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf) || (c >= 0xf900 && c <= 0xfaff)) {
      score += COMMON_CJK_SET.has(ch) ? 2 : 0.5 // 常用汉字高分，生僻 CJK 低分
    } else if ((c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a)) {
      score += 1 // 数字与英文字母
    } else if (c === 0x20 || c === 0x2c || c === 0x2e || c === 0x3001 || c === 0x3002 || c === 0xff0c || c === 0xff1a || c === 0xff1f) {
      score += 1 // 空格与常见标点
    } else if (c === 0xfffd) {
      score -= 3 // 替换符重罚
    }
  }
  return score / s.length
}

// ---------- 链路 a：Latin1 误读还原（ä½ å¥½ 类） ----------
const fixLatin1 = (text) => {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0xff) return null
  }
  const bytes = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch (e) {
    return null
  }
}

// ---------- 链路 b：CP1252 误读还原（â€" 类） ----------
// CP1252 高位特殊字符 → 原始字节映射表（0x80-0x9F）
const CP1252_CHAR_TO_BYTE = new Map([
  ['\u20ac', 0x80], ['\u201a', 0x82], ['\u0192', 0x83], ['\u201e', 0x84], ['\u2026', 0x85],
  ['\u2020', 0x86], ['\u2021', 0x87], ['\u02c6', 0x88], ['\u2030', 0x89], ['\u0160', 0x8a],
  ['\u2039', 0x8b], ['\u0152', 0x8c], ['\u017d', 0x8e], ['\u2018', 0x91], ['\u2019', 0x92],
  ['\u201c', 0x93], ['\u201d', 0x94], ['\u2022', 0x95], ['\u2013', 0x96], ['\u2014', 0x97],
  ['\u02dc', 0x98], ['\u2122', 0x99], ['\u0161', 0x9a], ['\u203a', 0x9b], ['\u0153', 0x9c],
  ['\u017e', 0x9e], ['\u0178', 0x9f]
])

const fixCp1252 = (text) => {
  const bytes = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i++) {
    const mapped = CP1252_CHAR_TO_BYTE.get(text[i])
    if (mapped !== undefined) {
      bytes[i] = mapped
    } else {
      const code = text.charCodeAt(i)
      if (code > 0xff) return null
      bytes[i] = code
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch (e) {
    return null
  }
}

// ---------- 链路 c：GBK 误读还原（浣犲ソ 类） ----------
// 惰性构建 GBK 编码表：遍历所有 GBK 双字节组合，字符 → 字节
let gbkMapCache = null

const ensureGbkMap = async () => {
  if (gbkMapCache) return gbkMapCache
  building.value = true
  // 让「正在构建编码表」状态先渲染
  await new Promise(resolve => setTimeout(resolve, 30))
  try {
    const map = new Map()
    const decoder = new TextDecoder('gbk')
    const pair = new Uint8Array(2)
    for (let lead = 0x81; lead <= 0xfe; lead++) {
      for (let trail = 0x40; trail <= 0xfe; trail++) {
        if (trail === 0x7f) continue
        pair[0] = lead
        pair[1] = trail
        const ch = decoder.decode(pair)
        if (ch && ch !== '\ufffd' && !map.has(ch)) {
          map.set(ch, [lead, trail])
        }
      }
    }
    gbkMapCache = map
  } finally {
    building.value = false
  }
  return gbkMapCache
}

const encodeAsGbk = (text, map) => {
  const out = []
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (code <= 0x7f) {
      out.push(code)
      continue
    }
    const bytes = map.get(ch)
    if (!bytes) return null
    out.push(bytes[0], bytes[1])
  }
  return new Uint8Array(out)
}

const fixGbk = async (text) => {
  // 纯 ASCII 输入走 GBK 链路无意义，跳过
  let hasHigh = false
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0x7f) {
      hasHigh = true
      break
    }
  }
  if (!hasHigh) return []
  const map = await ensureGbkMap()
  const bytes = encodeAsGbk(text, map)
  if (!bytes) return []
  const candidates = []
  const directions = [
    { enc: 'utf-8', name: 'UTF-8' },
    { enc: 'big5', name: 'Big5' }
  ]
  for (const dir of directions) {
    try {
      candidates.push({ text: new TextDecoder(dir.enc).decode(bytes), name: dir.name })
    } catch (e) {
      // 该方向解码失败，跳过
    }
  }
  return candidates
}

// ---------- 链路 d：UTF-8 双重编码还原（Ã¤Â¸Â­ 类嵌套乱码） ----------
// 双重编码 = 字节被两次误读为 Latin1 并重新编码，因此连续还原两层
const fixDoubleUtf8 = (text) => {
  try {
    const first = fixLatin1(text)
    if (!first || first === text) return null
    // 第二层：若还原结果仍是 Latin1 形态，继续还原一层
    const second = fixLatin1(first)
    return second || first
  } catch (e) {
    return null
  }
}

// ---------- 自动修复 ----------
const fixAll = async () => {
  const text = inputText.value
  if (!text.trim() || fixing.value) return
  fixing.value = true
  fixed.value = false
  results.value = []
  try {
    const baseScore = readabilityScore(text)
    const candidates = []
    const push = (fixedText, label, desc, mustBeat) => {
      if (!fixedText || fixedText === text || fixedText.includes('\ufffd')) return
      const score = readabilityScore(fixedText)
      if (mustBeat && score <= baseScore) return
      if (candidates.some(c => c.text === fixedText)) return
      candidates.push({
        text: fixedText,
        display: fixedText.slice(0, 200),
        label,
        desc,
        score
      })
    }

    // 链路 a：Latin1 误读还原
    push(fixLatin1(text), 'Latin1 误读还原 → UTF-8', '每个字符按码点还原为字节后以 UTF-8 重新解码，可修复 ä½ å¥½ 类乱码', false)
    // 链路 b：CP1252 误读还原
    push(fixCp1252(text), 'CP1252 误读还原 → UTF-8', '将 €‚ƒ„…â€" 等高位字符映射回原始字节后以 UTF-8 重新解码', false)
    // 链路 d：UTF-8 双重编码还原
    push(fixDoubleUtf8(text), 'UTF-8 双重编码还原', '在 Latin1 还原的基础上连续还原两层编码，可修复 Ã¤Â¸Â­ 类嵌套乱码', false)
    // 链路 c：GBK 误读还原（可能触发编码表构建）
    const gbkResults = await fixGbk(text)
    for (const item of gbkResults) {
      push(item.text, 'GBK 误读还原 → ' + item.name, '把输入按 GBK 编码表还原为字节，再以 UTF-8 与 Big5 两种方向解码，可修复 浣犲ソ 类乱码', true)
    }

    // 去重后按可读性排序
    candidates.sort((a, b) => b.score - a.score)
    results.value = candidates
  } finally {
    fixing.value = false
    fixed.value = true
  }
}

// ---------- 复制 ----------
const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
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

// ---------- 清空 ----------
const clearAll = () => {
  inputText.value = ''
  results.value = []
  fixed.value = false
}
</script>
