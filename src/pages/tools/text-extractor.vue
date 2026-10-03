<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Search class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">文本提取器</h1>
          <p class="text-sm text-muted-foreground mt-1">从大段文本中一键提取邮箱/URL/手机号/IP/身份证等，支持自定义正则</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴任意文本，勾选要提取的类型（邮箱、URL、手机号、IPv4、身份证号、十六进制颜色、金额、QQ 号），或输入自定义正则，结果自动去重、按类型分组展示，支持单类复制、全部复制与导出，并可在原文中高亮所有匹配项。全部处理在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入与提取配置 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> 原始文本
          </h2>
          <textarea
            v-model="inputText"
            class="w-full h-56 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴大段文本，例如客户留言、日志、表格导出内容……&#10;联系方式：zhang@example.com，电话 13812345678&#10;官网 https://www.example.com/help，色值 #1A73E8"
            spellcheck="false"
          ></textarea>

          <!-- 提取类型 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">提取类型（可多选）</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                v-for="t in extractTypes"
                :key="t.key"
                @click="t.on = !t.on"
                :class="t.on ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
                :title="t.hint"
              >{{ t.label }}</button>
            </div>
          </div>

          <!-- 自定义正则 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">自定义正则（可选）</label>
            <div class="flex gap-2">
              <input
                v-model="customPattern"
                type="text"
                placeholder="例如：订单号 \d{4}-\d{8}"
                class="flex-1 min-w-0 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                spellcheck="false"
              />
              <input
                v-model="customFlags"
                type="text"
                placeholder="g"
                class="w-16 px-2 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-ring"
                spellcheck="false"
              />
            </div>
            <p v-if="customRegexError" class="text-xs text-destructive mt-1.5">{{ customRegexError }}</p>
            <p v-else class="text-xs text-muted-foreground mt-1.5">flags 支持 g / i / m / s / u / y，默认含 g</p>
          </div>
        </div>

        <!-- 高亮预览 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <CheckSquare class="w-4 h-4 mr-2 text-primary" /> 原文高亮预览
          </h3>
          <div
            v-if="highlightedHtml"
            class="bg-muted/30 border border-border rounded-lg p-4 max-h-72 overflow-auto text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-all"
            v-html="highlightedHtml"
          ></div>
          <div v-else class="py-10 text-center">
            <Search class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p class="text-xs text-muted-foreground">输入文本并选择提取类型后，匹配项会在这里高亮显示</p>
          </div>
        </div>
      </div>

      <!-- 右侧：提取结果 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <List class="w-5 h-5 mr-2 text-primary" />
              提取结果
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copyText(allOutputText)"
                :disabled="!allOutputText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 全部复制
              </button>
              <button
                @click="exportResult"
                :disabled="!allOutputText"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 导出 TXT
              </button>
            </div>
          </div>

          <div class="p-6">
            <div v-if="activeGroups.length === 0" class="py-14 text-center">
              <Search class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">暂无提取结果，请在左侧输入文本并选择提取类型</p>
            </div>
            <template v-else>
              <p class="text-xs text-muted-foreground mb-4">
                共 <span class="text-primary font-medium">{{ totalUnique }}</span> 项（去重后） · {{ activeGroups.length }} 类
              </p>
              <div class="space-y-5">
                <div v-for="g in activeGroups" :key="g.key">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-medium text-foreground">
                      {{ g.label }}
                      <span class="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{{ g.items.length }} 项</span>
                    </p>
                    <button
                      @click="copyText(g.items.join('\n'))"
                      class="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-xs"
                    >
                      <Copy class="w-3 h-3" /> 复制本类
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="item in g.items"
                      :key="item"
                      class="inline-block max-w-full bg-muted text-foreground text-xs px-2.5 py-1 rounded-full font-mono break-all"
                    >{{ item }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-3.5 mr-2 text-primary" /> 提取规则说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">邮箱</span>：标准 RFC 简化版正则，覆盖常见邮箱格式</li>
            <li>• <span class="text-foreground">手机号</span>：1 开头第二位 3-9 的 11 位数字，前后不能紧邻其他数字</li>
            <li>• <span class="text-foreground">IPv4</span>：逐段校验 0-255 范围，避免把版本号误判为 IP</li>
            <li>• <span class="text-foreground">身份证号</span>：15/18 位粗匹配（不校验校验位，可配合身份证校验解析器使用）</li>
            <li>• <span class="text-foreground">QQ 号</span>：5-11 位数字且不以 0 开头，误报较多，默认关闭</li>
            <li>• 结果自动去重；高亮预览已做 HTML 转义，原文内容不会被当作标签执行</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于文本提取器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            从客户留言、客服记录、服务器日志、群聊导出里手工挑联系方式是一件低效又容易遗漏的事。文本提取器把这一过程自动化：勾选目标类型，一次粘贴即可把邮箱、URL、手机号、IP、身份证号、色值、金额等信息全部捞出，去重后按类型分组，复制或导出即用。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>运营从活动反馈、群聊记录中批量收集用户邮箱与手机号</li>
            <li>开发从日志或报错信息中提取 URL、IPv4 地址定位问题</li>
            <li>数据清洗：从混乱文本中抽取身份证号、金额等结构化字段</li>
            <li>用自定义正则适配任意私有格式（订单号、工单号、编号等）</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么某些号码没有被识别？</span>内置正则偏保守以减少误报：例如手机号要求前后不紧邻数字，身份证只做位数粗匹配；更特殊的格式请使用自定义正则。</li>
            <li><span class="text-foreground font-medium">自定义正则支持哪些 flags？</span>支持 g（全局，自动附加）、i（忽略大小写）、m（多行）、s（点号匹配换行）、u（Unicode）、y（粘性匹配）。</li>
            <li><span class="text-foreground font-medium">提取的文本会上传吗？</span>不会。所有匹配、高亮与导出都在浏览器本地完成，数据不出设备。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'text-extractor'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Search, FileText, List, Copy, Download, Info, CheckSquare,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '文本提取器 - 提取邮箱/URL/手机号/IP/身份证号',
  description: '在线文本提取工具，从大段文本中按类型提取邮箱、URL链接、手机号、IPv4、身份证号、十六进制颜色、金额、QQ号，支持自定义正则、去重分组、高亮预览与导出，纯本地处理',
  keywords: '文本提取, 提取邮箱, 提取手机号, 提取url, 提取ip, 正则提取, 文本抓取, 信息抽取工具',
  author: 'Util工具箱',
  ogTitle: '文本提取器 - 有条工具',
  ogDescription: '从大段文本一键提取邮箱/URL/手机号/IP/身份证等，支持自定义正则',
  ogUrl: 'https://www.util.cn/tools/text-extractor',
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
          name: '文本提取器',
          url: 'https://www.util.cn/tools/text-extractor',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['邮箱提取', 'URL提取', '手机号提取', 'IPv4提取', '身份证号提取', '自定义正则', '匹配高亮', '去重导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '文本提取器', item: 'https://www.util.cn/tools/text-extractor/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么有些号码没有被提取到？',
              acceptedAnswer: { '@type': 'Answer', text: '内置正则偏保守以减少误报，例如手机号要求前后不紧邻其他数字；特殊格式可使用自定义正则提取。' }
            },
            {
              '@type': 'Question',
              name: '自定义正则支持哪些 flags？',
              acceptedAnswer: { '@type': 'Answer', text: '支持 g、i、m、s、u、y 六种 flags，g（全局匹配）会自动附加。' }
            },
            {
              '@type': 'Question',
              name: '粘贴的文本会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，提取、高亮与导出全部在浏览器本地完成，文本不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'text-extractor')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const inputText = ref('')
const customPattern = ref('')
const customFlags = ref('g')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 提取类型（模式串形式，运行时编译，含后行断言） ----------
const extractTypes = ref([
  { key: 'email', label: '邮箱', on: true, hint: '标准 RFC 简化版', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { key: 'url', label: 'URL', on: true, hint: 'http/https 链接', pattern: 'https?://[^\\s"\'<>()\\[\\]{}，。；：！？、（）《》【】“”‘’]+' },
  { key: 'phone', label: '手机号', on: true, hint: '1[3-9] 开头 11 位', pattern: '(?<!\\d)1[3-9]\\d{9}(?!\\d)' },
  { key: 'ipv4', label: 'IPv4', on: true, hint: '逐段校验 0-255', pattern: '(?<!\\d)(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?!\\d)' },
  { key: 'idcard', label: '身份证号', on: false, hint: '15/18 位粗匹配', pattern: '(?<!\\d)(?:\\d{17}[\\dXx]|\\d{15})(?!\\d)' },
  { key: 'hexcolor', label: '十六进制颜色', on: false, hint: '#RGB / #RRGGBB', pattern: '#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b' },
  { key: 'money', label: '金额', on: false, hint: '¥/￥ 开头的数字', pattern: '[¥￥]\\s*\\d+(?:,\\d{3})*(?:\\.\\d{1,2})?' },
  { key: 'qq', label: 'QQ 号', on: false, hint: '5-11 位数字，误报多', pattern: '(?<!\\d)[1-9]\\d{4,10}(?!\\d)' }
])

// ---------- 自定义正则校验 ----------
const customRegexError = computed(() => {
  const p = customPattern.value.trim()
  if (!p) return ''
  if (!/^[gimsuy]*$/.test(customFlags.value.trim())) return 'flags 只能包含 g / i / m / s / u / y'
  try {
    new RegExp(p, customFlags.value.trim() || 'g')
    return ''
  } catch (e) {
    return '正则表达式语法错误：' + e.message
  }
})

const getCustomRegex = () => {
  const p = customPattern.value.trim()
  if (!p || customRegexError.value) return null
  const flags = customFlags.value.trim() || 'g'
  return new RegExp(p, flags.includes('g') ? flags : flags + 'g')
}

// ---------- 提取与去重分组 ----------
const activeGroups = computed(() => {
  const text = inputText.value
  if (!text.trim()) return []
  const groups = []
  for (const t of extractTypes.value) {
    if (!t.on) continue
    try {
      const found = text.match(new RegExp(t.pattern, 'g')) || []
      const items = [...new Set(found.map(s => s.trim()))]
      if (items.length) groups.push({ key: t.key, label: t.label, items, count: found.length })
    } catch (e) { /* 忽略非法模式 */ }
  }
  const customRe = getCustomRegex()
  if (customRe) {
    try {
      const found = text.match(customRe) || []
      const items = [...new Set(found.map(s => s.trim()))]
      if (items.length) groups.push({ key: 'custom', label: '自定义正则', items, count: found.length })
    } catch (e) { /* 忽略 */ }
  }
  return groups
})

const totalUnique = computed(() => activeGroups.value.reduce((sum, g) => sum + g.items.length, 0))

const allOutputText = computed(() => {
  if (!activeGroups.value.length) return ''
  return activeGroups.value.map(g => '# ' + g.label + '\n' + g.items.join('\n')).join('\n\n')
})

// ---------- 高亮预览（先转义再包 span，防注入） ----------
const escapeHtml = (s) => {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const highlightedHtml = computed(() => {
  const text = inputText.value
  if (!text.trim()) return ''
  const patterns = extractTypes.value.filter(t => t.on).map(t => '(?:' + t.pattern + ')')
  const customRe = getCustomRegex()
  if (customRe) patterns.push(customRe.source)
  if (!patterns.length) return escapeHtml(text)

  let combined
  try {
    combined = new RegExp(patterns.join('|'), 'g')
  } catch (e) {
    return escapeHtml(text)
  }

  let html = ''
  let last = 0
  for (const m of text.matchAll(combined)) {
    if (m[0] === '') break // 防止零宽匹配死循环
    html += escapeHtml(text.slice(last, m.index))
      + '<span class="bg-primary/20 text-primary rounded px-0.5 font-medium">'
      + escapeHtml(m[0]) + '</span>'
    last = m.index + m[0].length
  }
  html += escapeHtml(text.slice(last))
  return html
})

// ---------- 复制与导出 ----------
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

const exportResult = () => {
  if (!allOutputText.value) return
  const blob = new Blob([allOutputText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'extracted-' + new Date().toISOString().slice(0, 10) + '.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
