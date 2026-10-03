<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PenTool class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">中文数字转换器</h1>
          <p class="text-sm text-muted-foreground mt-1">阿拉伯数字与中文数字互转：普通「一二三」、财务大写「壹贰叁」、人民币金额</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        双向转换工具：数字可转为普通中文（正确处理万/亿分节与零的读法，如 1024 → 一千零二十四）与财务大写（壹仟零贰拾肆），也可转为人民币大写金额（X元X角X分整）；输入中文数字（十/百/千/万/亿组合）可解析回阿拉伯数字。实时转换，一键复制，全部在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：数字 → 中文 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 数字 → 中文
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">输入数字（整数最多 16 位，支持两位小数）</label>
          <input
            v-model="numberInput"
            type="text"
            placeholder="例如：1024 或 1024.50"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            spellcheck="false"
          />
          <p v-if="numberError" class="text-xs text-destructive mt-1.5">{{ numberError }}</p>
        </div>

        <!-- 普通中文 -->
        <div class="flex items-center justify-between gap-3 bg-muted/50 rounded-lg px-4 py-3">
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground mb-0.5">普通中文（一二三）</p>
            <p class="text-sm font-medium text-foreground break-all">{{ normalChinese || '—' }}</p>
          </div>
          <button
            v-if="normalChinese"
            @click="copyText(normalChinese)"
            class="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            title="复制"
          >
            <Copy class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- 财务大写 -->
        <div class="flex items-center justify-between gap-3 bg-muted/50 rounded-lg px-4 py-3">
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground mb-0.5">财务大写（壹贰叁）</p>
            <p class="text-sm font-medium text-foreground break-all">{{ upperChinese || '—' }}</p>
          </div>
          <button
            v-if="upperChinese"
            @click="copyText(upperChinese)"
            class="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            title="复制"
          >
            <Copy class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- 人民币大写 -->
        <div class="flex items-center justify-between gap-3 bg-primary/10 rounded-lg px-4 py-3">
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground mb-0.5">人民币大写金额</p>
            <p class="text-sm font-semibold text-primary break-all">{{ rmbUpper || '—' }}</p>
          </div>
          <button
            v-if="rmbUpper"
            @click="copyText(rmbUpper)"
            class="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            title="复制"
          >
            <Copy class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="bg-muted/50 rounded-lg p-3 flex items-start gap-2.5">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            普通口语中 10-19 读作「十X」而非「一十X」；财务大写按银行规范保留「壹拾」。金额模式按四舍五入保留到分，角位为零时补「零」，无分时加「整」。
          </p>
        </div>
      </div>

      <!-- 右侧：中文 → 数字 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <List class="w-5 h-5 mr-2 text-primary" /> 中文 → 数字
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">输入中文数字</label>
          <input
            v-model="chineseInput"
            type="text"
            placeholder="例如：一千零二十四 / 十五 / 三亿二千万 / 壹佰贰拾"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            spellcheck="false"
          />
        </div>

        <div v-if="chineseResult.error" class="rounded-lg p-4 flex items-start gap-3 bg-muted/50">
          <AlertTriangle class="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p class="text-sm text-destructive">{{ chineseResult.error }}</p>
        </div>
        <div v-else-if="chineseResult.value !== ''" class="bg-primary/10 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground mb-0.5">转换结果</p>
            <p class="text-2xl font-bold text-primary break-all">{{ chineseResult.value }}</p>
          </div>
          <button
            @click="copyText(chineseResult.value)"
            class="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            title="复制"
          >
            <Copy class="w-4 h-4" />
          </button>
        </div>
        <div v-else class="py-10 text-center">
          <PenTool class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p class="text-xs text-muted-foreground">输入中文数字后，这里会实时显示阿拉伯数字</p>
        </div>

        <!-- 支持的字符 -->
        <div class="bg-muted/50 rounded-lg p-3">
          <p class="text-xs text-muted-foreground leading-relaxed">
            支持数字「零〇一二三四五六七八九两壹贰叁肆伍陆柒捌玖」、位值「十拾百百千仟」与分节「万亿」，如 一千零二十四、十五、三亿零二十万、贰拾伍。纯数字输入会原样返回。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于中文数字转换</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            中文数字有两套体系：日常使用的「一二三」小写与财务防篡改的「壹贰叁」大写。大写数字源于武则天时期，因笔画复杂难以涂改，至今仍是银行票据、合同金额的强制规范。两套体系都采用「四位一分节」的万进制：个、十、百、千为一节，节与节之间用万、亿衔接，这决定了中文读数中「零」的特殊规则。
          </p>
          <h3 class="text-lg font-semibold text-foreground">「零」的读法规则</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>节内连续多个零只读一个：1002 → 一千零二</li>
            <li>中间整节为零且后续非零时补一个零：1000001 → 一百万零一</li>
            <li>末尾的零全部省略：1200 → 一千二百</li>
            <li>金额中间的零要写出来：1002.50 → 壹仟零贰元伍角整</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么 15 转普通中文是「十五」，大写却是「壹拾伍」？</span>口语习惯 10-19 读「十X」，而银行规范要求大写金额必须带「壹拾」，防止「拾伍」被篡改。</li>
            <li><span class="text-foreground font-medium">最大支持多大的数？</span>整数最多 16 位，可达「亿亿」级；人民币金额模式按四舍五入精确到分。</li>
            <li><span class="text-foreground font-medium">支持解析繁体或「佰仟」吗？</span>支持「拾佰仟」财务位值与大写数字的混合输入，如「贰拾伍」可解析为 25。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'chinese-number-converter'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  PenTool, Calculator, List, Copy, Info, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '中文数字转换器 - 数字转中文大写/人民币大写金额',
  description: '在线中文数字转换工具，阿拉伯数字转普通中文（一二三）与财务大写（壹贰叁），数字转人民币大写金额（X元X角X分整），中文数字解析回阿拉伯数字，正确处理万/亿分节与零的读法',
  keywords: '中文数字转换, 数字转大写, 人民币大写, 数字转中文, 壹贰叁大写, 金额大写转换, 中文数字解析',
  author: 'Util工具箱',
  ogTitle: '中文数字转换器 - 有条工具',
  ogDescription: '数字与中文数字互转：普通中文、财务大写、人民币金额大写',
  ogUrl: 'https://www.util.cn/tools/chinese-number-converter',
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
          name: '中文数字转换器',
          url: 'https://www.util.cn/tools/chinese-number-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['数字转普通中文', '数字转财务大写', '人民币大写金额', '中文数字解析回数字', '万/亿分节与零规则']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '中文数字转换器', item: 'https://www.util.cn/tools/chinese-number-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么 15 的普通中文是「十五」，大写却是「壹拾伍」？',
              acceptedAnswer: { '@type': 'Answer', text: '口语习惯 10-19 读「十X」，而银行规范要求大写金额必须写作「壹拾X」以防篡改。' }
            },
            {
              '@type': 'Question',
              name: '支持多大的数字？',
              acceptedAnswer: { '@type': 'Answer', text: '整数最多 16 位（可达亿亿级），人民币金额模式按四舍五入精确到分。' }
            },
            {
              '@type': 'Question',
              name: '能解析「壹佰贰拾」这类大写输入吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，中文转数字同时支持普通（一二三十百千万亿）与财务（壹贰拾佰仟）两套字符。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'chinese-number-converter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const numberInput = ref('')
const chineseInput = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 字符表 ----------
const DIGITS_NORMAL = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const DIGITS_UPPER = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const UNITS4_NORMAL = ['', '十', '百', '千']
const UNITS4_UPPER = ['', '拾', '佰', '仟']
const GROUP_UNITS = ['', '万', '亿', '万亿', '亿亿']

const DIGIT_MAP = {
  '零': 0, '〇': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
  '壹': 1, '贰': 2, '叁': 3, '肆': 4, '伍': 5, '陆': 6, '柒': 7, '捌': 8, '玖': 9
}
const UNIT_MAP = { '十': 10, '百': 100, '千': 1000, '拾': 10, '佰': 100, '仟': 1000 }
const GROUP_MAP = { '万': 1e4, '亿': 1e8 }

// ---------- 数字 → 中文 ----------
// 四位一节内部转换（1024 → 一千零二十四 / 壹仟零贰拾肆）
const sectionToChinese = (num, digits, units4) => {
  let str = ''
  let zero = false
  for (let i = 3; i >= 0; i--) {
    const d = Math.floor(num / Math.pow(10, i)) % 10
    if (d === 0) {
      if (str) zero = true
      continue
    }
    str += (zero ? '零' : '') + digits[d] + units4[i]
    zero = false
  }
  return str
}

// 按 4 位分节拼接（万/亿），处理跨节零
const integerToChinese = (intStr, isUpper) => {
  const digits = isUpper ? DIGITS_UPPER : DIGITS_NORMAL
  const units4 = isUpper ? UNITS4_UPPER : UNITS4_NORMAL
  const clean = intStr.replace(/^0+(?=\d)/, '')
  if (/^0*$/.test(clean)) return '零'

  const padded = clean.length % 4 === 0 ? clean : '0'.repeat(4 - (clean.length % 4)) + clean
  const groups = []
  for (let i = 0; i < padded.length; i += 4) groups.push(Number(padded.slice(i, i + 4)))

  let out = ''
  let zeroPending = false
  for (let g = 0; g < groups.length; g++) {
    const value = groups[g]
    const unitIdx = groups.length - 1 - g
    if (value === 0) {
      zeroPending = true
      continue
    }
    const needZero = out && (value < 1000 || zeroPending)
    out += (needZero ? '零' : '') + sectionToChinese(value, digits, units4) + GROUP_UNITS[unitIdx]
    zeroPending = false
  }
  // 口语习惯：整个数字以「一十」开头时读「十」（财务大写保留壹拾）
  if (!isUpper && out.startsWith('一十')) out = out.slice(1)
  return out || '零'
}

// 小数部分逐位读出（点 X X X）
const fractionToChinese = (frac, digits) => {
  return frac.split('').map(d => digits[Number(d)]).join('')
}

const numberError = computed(() => {
  const s = numberInput.value.trim()
  if (!s) return ''
  if (!/^\d{1,16}(\.\d+)?$/.test(s)) return '请输入数字（整数最多 16 位，可含小数），例如 1024 或 1024.50'
  return ''
})

const parsedNumberParts = computed(() => {
  const s = numberInput.value.trim()
  if (!s || numberError.value) return null
  const [intPart, fracPart = ''] = s.split('.')
  return { intPart: intPart.replace(/^0+(?=\d)/, '') || '0', fracPart }
})

const normalChinese = computed(() => {
  const p = parsedNumberParts.value
  if (!p) return ''
  const base = integerToChinese(p.intPart, false)
  return p.fracPart ? base + '点' + fractionToChinese(p.fracPart, DIGITS_NORMAL) : base
})

const upperChinese = computed(() => {
  const p = parsedNumberParts.value
  if (!p) return ''
  const base = integerToChinese(p.intPart, true)
  return p.fracPart ? base + '点' + fractionToChinese(p.fracPart, DIGITS_UPPER) : base
})

// 数字字符串加一（处理金额进位，如 9.996 → 10.00）
const addOneStr = (digits) => {
  const arr = digits.split('')
  let i = arr.length - 1
  while (i >= 0 && arr[i] === '9') { arr[i] = '0'; i-- }
  if (i >= 0) arr[i] = String(Number(arr[i]) + 1)
  else arr.unshift('1')
  return arr.join('')
}

// 金额 → 人民币大写（X元X角X分整）
const amountToUpper = (numStr) => {
  const [rawInt, rawFrac = ''] = numStr.split('.')
  let intPart = rawInt.replace(/^0+(?=\d)/, '')
  let cents
  if (rawFrac.length <= 2) {
    cents = Number((rawFrac + '00').slice(0, 2) || '0')
  } else {
    cents = Number(rawFrac.slice(0, 2))
    if (Number(rawFrac[2]) >= 5) cents += 1
  }
  if (cents === 100) {
    intPart = addOneStr(intPart)
    cents = 0
  }
  const jiao = Math.floor(cents / 10)
  const fen = cents % 10

  const D = DIGITS_UPPER
  const intIsZero = /^0*$/.test(intPart)
  if (intIsZero && jiao === 0 && fen === 0) return '零元整'

  const intChinese = intIsZero ? '零' : integerToChinese(intPart, true)
  let out = intChinese + '元'
  if (jiao === 0 && fen === 0) out += '整'
  else if (jiao === 0) out += '零' + D[fen] + '分'
  else if (fen === 0) out += D[jiao] + '角整'
  else out += D[jiao] + '角' + D[fen] + '分'
  return out
}

const rmbUpper = computed(() => {
  const p = parsedNumberParts.value
  if (!p) return ''
  return amountToUpper(p.intPart + (p.fracPart ? '.' + p.fracPart : ''))
})

// ---------- 中文 → 数字 ----------
const chineseToNumber = (input) => {
  const s = String(input || '').trim().replace(/\s/g, '')
  if (!s) return { value: '', error: '' }
  // 纯数字直接返回
  if (/^\d+$/.test(s)) return { value: s, error: '' }

  let total = 0
  let section = 0
  let digit = null
  let seen = false

  for (const ch of s) {
    if (DIGIT_MAP[ch] !== undefined) {
      digit = DIGIT_MAP[ch]
      seen = true
    } else if (UNIT_MAP[ch] !== undefined) {
      section += (digit ?? 1) * UNIT_MAP[ch] // 「十五」的十前面默认 1
      digit = null
      seen = true
    } else if (GROUP_MAP[ch] !== undefined) {
      section = (section + (digit ?? 0)) * GROUP_MAP[ch]
      total += section
      section = 0
      digit = null
      seen = true
    } else {
      return { value: '', error: '无法识别的字符「' + ch + '」，请使用标准中文数字' }
    }
  }
  if (!seen) return { value: '', error: '' }
  return { value: String(total + section + (digit ?? 0)), error: '' }
}

const chineseResult = computed(() => chineseToNumber(chineseInput.value))

// ---------- 复制 ----------
const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
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
    alert('已复制')
  }
}
</script>
