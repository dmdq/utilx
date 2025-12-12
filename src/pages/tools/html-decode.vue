<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">HTML 解码器</h1>
      <p class="text-muted-foreground">将 HTML 实体编码还原为原始文本，支持命名实体和数字实体</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">HTML 编码文本</h2>
          <div class="flex gap-2">
            <button
              @click="clearInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
            <button
              @click="pasteFromClipboard"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              粘贴
            </button>
            <button
              @click="loadExample"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              示例
            </button>
          </div>
        </div>

        <textarea
          v-model="inputText"
          placeholder="请输入要解码的 HTML 编码文本..."
          class="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>

        <!-- 解码选项 -->
        <div class="space-y-3">
          <h3 class="font-medium text-sm">解码选项</h3>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.strict"
              class="rounded"
            />
            <span class="text-sm">严格模式（仅解码标准 HTML 实体）</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.showInvalid"
              class="rounded"
            />
            <span class="text-sm">显示无效实体标记</span>
          </label>
        </div>

        <!-- 常见解码参考 -->
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">常见 HTML 实体</h3>
          <div class="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>&amp;lt; → &lt;</div>
            <div>&amp;gt; → &gt;</div>
            <div>&amp;amp; → &amp;</div>
            <div>&amp;quot; → "</div>
            <div>&amp;#39; → '</div>
            <div>&amp;copy; → ©</div>
            <div>&amp;reg; → ®</div>
            <div>&amp;euro; → €</div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">解码结果</h2>
          <div class="flex gap-2">
            <button
              v-if="outputText"
              @click="copyOutput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ copied ? '已复制' : '复制' }}
            </button>
            <button
              v-if="outputText"
              @click="downloadOutput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              下载
            </button>
          </div>
        </div>

        <!-- 解码结果 -->
        <div class="relative">
          <pre
            v-if="outputText"
            class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm whitespace-pre-wrap break-all"
          >{{ outputText }}</pre>
          <div
            v-else
            class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground"
          >
            解码结果将显示在这里
          </div>

          <!-- 字符统计 -->
          <div
            v-if="outputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ outputText.length }} 字符
          </div>
        </div>

        <!-- 解码统计 -->
        <div v-if="inputText" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">解码统计</h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>编码长度: {{ inputText.length }}</div>
            <div>解码长度: {{ outputText.length }}</div>
            <div>节省字符: {{ inputText.length - outputText.length }}</div>
            <div>压缩率: {{ ((inputText.length - outputText.length) / inputText.length * 100).toFixed(1) }}%</div>
          </div>
        </div>

        <!-- 解码详情 -->
        <div v-if="decodedEntities.length > 0" class="bg-card border rounded-lg p-4">
          <h3 class="font-medium text-sm mb-2">已解码实体</h3>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <div
              v-for="entity in decodedEntities"
              :key="entity.original"
              class="flex items-center gap-2 text-xs font-mono"
            >
              <span class="text-muted-foreground">{{ entity.original }}</span>
              <ArrowRight class="w-3 h-3 text-muted-foreground" />
              <span class="text-foreground">{{ entity.decoded }}</span>
              <span class="text-muted-foreground">({{ entity.description }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用技巧 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap class="w-5 h-5 text-primary" />
          使用技巧
        </h3>
        <div class="space-y-3 text-sm text-muted-foreground">
          <p>• 支持所有标准 HTML5 命名实体，如 &amp;copy;、&amp;nbsp; 等</p>
          <p>• 支持十进制和十六进制数字实体，如 &amp;#65;、&amp;#x41;</p>
          <p>• 可以一次解码多个 HTML 实体</p>
          <p>• 严格模式下会忽略非标准的 HTML 实体</p>
        </div>
      </div>

      <!-- 解码示例 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">解码示例</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-1">1. 命名实体解码</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">编码:</p>
                <code class="text-xs">&amp;copy; 2025 &amp;reg; Company Ltd.</code>
              </div>
              <div class="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">解码:</p>
                <code class="text-xs">© 2025 ® Company Ltd.</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-1">2. 数字实体解码</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">编码:</p>
                <code class="text-xs">&amp;#72;&amp;#101;&amp;#108;&amp;#108;&amp;#111;</code>
              </div>
              <div class="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">解码:</p>
                <code class="text-xs">Hello</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/html-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">HTML 编码</p>
              <p class="text-xs text-muted-foreground">文本转 HTML 实体</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/url-decode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Link class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">URL 解码</p>
              <p class="text-xs text-muted-foreground">URL 百分比解码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/base64-decode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 解码</p>
              <p class="text-xs text-muted-foreground">Base64 格式解码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Zap, FileText, Link, Hash, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const inputText = ref('')
const outputText = ref('')
const copied = ref(false)
const decodedEntities = ref([])

// 解码选项
const options = ref({
  strict: false,
  showInvalid: false
})

// HTML 实体映射表
const namedEntities = {
  // 特殊字符
  'amp': '&',
  'lt': '<',
  'gt': '>',
  'quot': '"',
  'apos': "'",

  // 常用符号
  'nbsp': ' ',
  'copy': '©',
  'reg': '®',
  'trade': '™',
  'euro': '€',
  'pound': '£',
  'yen': '¥',
  'cent': '¢',
  'sect': '§',
  'para': '¶',
  'deg': '°',
  'prime': '\'',
  'Prime': '\"',
  'lsquo': '\'',
  'rsquo': '\'',
  'ldquo': '\"',
  'rdquo': '\"',
  'hellip': '…',
  'mdash': '—',
  'ndash': '–',

  // 数学符号
  'plusmn': '±',
  'times': '×',
  'divide': '÷',
  'frac12': '½',
  'frac14': '¼',
  'frac34': '¾',
  'sup2': '²',
  'sup3': '³',
  'frac13': '⅓',
  'frac23': '⅔',

  // 箭头
  'larr': '←',
  'rarr': '→',
  'uarr': '↑',
  'darr': '↓',
  'harr': '↔',
  'larr2': '⇐',
  'rarr2': '⇒',
  'uarr2': '⇑',
  'darr2': '⇓',
  'harr2': '⇔',

  // 其他常用
  'bull': '•',
  'para': '¶',
  'sect': '§',
  'middot': '·',
  'laquo': '«',
  'raquo': '»',
  'lsaquo': '‹',
  'rsaquo': '›',
  'loz': '◊',
  'spades': '♠',
  'clubs': '♣',
  'hearts': '♥',
  'diams': '♦'
}

// HTML 解码函数
const decodeHTML = (text) => {
  if (!text) return ''

  decodedEntities.value = []
  let result = text

  // 匹配实体正则
  const entityRegex = /&(#?[\w\d]+);?/g
  let match

  while ((match = entityRegex.exec(text)) !== null) {
    const fullEntity = match[0]
    const entityCode = match[1]
    let decoded = null
    let description = ''

    // 处理数字实体
    if (entityCode.startsWith('#')) {
      const isHex = entityCode.startsWith('#x')
      const code = parseInt(entityCode.slice(isHex ? 2 : 1), isHex ? 16 : 10)

      if (!isNaN(code)) {
        decoded = String.fromCharCode(code)
        description = `Unicode ${isHex ? 'hex' : 'decimal'} ${code}`
      }
    } else {
      // 处理命名实体
      if (namedEntities[entityCode] !== undefined) {
        decoded = namedEntities[entityCode]
        description = `Named entity &${entityCode};`
      } else if (!options.value.strict) {
        // 非严格模式下，尝试 HTML5 实体
        try {
          const textarea = document.createElement('textarea')
          textarea.innerHTML = fullEntity
          decoded = textarea.value
          description = `HTML5 entity ${entityCode}`
        } catch (e) {
          // 忽略错误
        }
      }
    }

    if (decoded !== null) {
      result = result.replace(fullEntity, decoded)
      decodedEntities.value.push({
        original: fullEntity,
        decoded: decoded,
        description: description
      })
    } else if (options.value.showInvalid) {
      decodedEntities.value.push({
        original: fullEntity,
        decoded: '?',
        description: 'Invalid entity'
      })
    }
  }

  return result
}

// 加载示例
const loadExample = () => {
  inputText.value = '&lt;p&gt;Hello &amp; Welcome! &copy; 2025 Company&amp;reg;&lt;/p&gt;\n&amp;#72;&amp;#101;&amp;#108;&amp;#108;&amp;#111; &amp;#x57;&amp;#x6f;&amp;#x72;&amp;#x6c;&amp;#x64;'
}

// 监听输入变化
watch(inputText, (newText) => {
  if (newText) {
    outputText.value = decodeHTML(newText)
  } else {
    outputText.value = ''
    decodedEntities.value = []
  }
})

// 监听选项变化
watch(options, () => {
  if (inputText.value) {
    outputText.value = decodeHTML(inputText.value)
  }
}, { deep: true })

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  decodedEntities.value = []
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('paste')
    inputText.value = textarea.value || ''
    document.body.removeChild(textarea)
  }
}

// 复制输出
const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// 下载输出
const downloadOutput = () => {
  const blob = new Blob([outputText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'html-decoded.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: 'HTML解码器 - 在线HTML实体解码工具',
  description: '免费在线HTML解码工具，支持命名实体和数字实体解码，提供详细的解码信息和统计。',
  keywords: ['html', '解码', 'entity', 'html-decoder', '在线工具', '实体解码', 'html5']
})

definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
input[type="checkbox"]:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
</style>