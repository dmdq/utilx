<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">HTML 编码器</h1>
      <p class="text-muted-foreground">将文本转换为 HTML 实体编码，防止 XSS 攻击和显示特殊字符</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">原始文本</h2>
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
          </div>
        </div>

        <textarea
          v-model="inputText"
          placeholder="请输入要编码的文本..."
          class="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>

        <!-- 编码选项 -->
        <div class="space-y-3">
          <h3 class="font-medium text-sm">编码选项</h3>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.encodeAll"
              class="rounded"
            />
            <span class="text-sm">编码所有字符（包括字母数字）</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.useNamed"
              class="rounded"
            />
            <span class="text-sm">优先使用命名实体（如 &amp; 而不是 &#38;）</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.preserveSpaces"
              class="rounded"
            />
            <span class="text-sm">保留空格不编码</span>
          </label>
        </div>

        <!-- 常见HTML实体参考 -->
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">常见 HTML 实体</h3>
          <div class="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>&lt; → &lt;</div>
            <div>&gt; → &gt;</div>
            <div>&amp; → &amp;</div>
            <div>" → &quot;</div>
            <div>' → &#39;</div>
            <div>© → &copy;</div>
            <div>® → &reg;</div>
            <div>€ → &euro;</div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">编码结果</h2>
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

        <!-- 编码结果 -->
        <div class="relative">
          <pre
            v-if="outputText"
            class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputText }}</pre>
          <div
            v-else
            class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground"
          >
            编码结果将显示在这里
          </div>

          <!-- 字符统计 -->
          <div
            v-if="outputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ outputText.length }} 字符
          </div>
        </div>

        <!-- 预览区域 -->
        <div v-if="outputText" class="bg-card border rounded-lg p-4">
          <h3 class="font-medium text-sm mb-2">HTML 预览</h3>
          <div
            class="p-3 bg-muted rounded-lg min-h-[100px] text-sm"
            v-html="outputText"
          ></div>
        </div>

        <!-- 编码统计 -->
        <div v-if="inputText" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">编码统计</h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>原始长度: {{ inputText.length }}</div>
            <div>编码长度: {{ outputText.length }}</div>
            <div>增加字符: {{ outputText.length - inputText.length }}</div>
            <div>编码率: {{ ((outputText.length - inputText.length) / inputText.length * 100).toFixed(1) }}%</div>
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
          <p>• 在 Web 开发中，对用户输入进行 HTML 编码可以防止 XSS 攻击</p>
          <p>• 显示代码片段时，使用 HTML 编码确保标签正确显示</p>
          <p>• 在 XML/HTML 属性中使用特殊字符时需要进行编码</p>
          <p>• 编码所有字符可以用于隐藏内容或绕过某些过滤器</p>
        </div>
      </div>

      <!-- 编码示例 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">编码示例</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-1">1. HTML 标签编码</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原始:</p>
                <code class="text-xs">&lt;script&gt;alert('XSS')&lt;/script&gt;</code>
              </div>
              <div class="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">编码:</p>
                <code class="text-xs">&amp;lt;script&amp;gt;alert(&amp;apos;XSS&amp;apos;)&amp;lt;/script&amp;gt;</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-1">2. 特殊符号编码</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原始:</p>
                <code class="text-xs">© 2025 Company® - All rights reserved.</code>
              </div>
              <div class="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">编码:</p>
                <code class="text-xs">&amp;copy; 2025 Company&amp;reg; - All rights reserved.</code>
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
            to="/tools/html-decode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">HTML 解码</p>
              <p class="text-xs text-muted-foreground">HTML 实体解码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/url-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Link class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">URL 编码</p>
              <p class="text-xs text-muted-foreground">URL 百分比编码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/unicode-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Type class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Unicode 转换</p>
              <p class="text-xs text-muted-foreground">Unicode 编码转换</p>
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
import { Zap, FileText, Link, Type, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const inputText = ref('')
const outputText = ref('')
const copied = ref(false)

// 编码选项
const options = ref({
  encodeAll: false,
  useNamed: true,
  preserveSpaces: false
})

// HTML 实体映射表
const namedEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '©': '&copy;',
  '®': '&reg;',
  '€': '&euro;',
  '£': '&pound;',
  '¥': '&yen;',
  '§': '&sect;',
  '¶': '&para;',
  '°': '&deg;',
  '±': '&plusmn;',
  '×': '&times;',
  '÷': '&divide;',
  '½': '&frac12;',
  '¼': '&frac14;',
  '¾': '&frac34;',
  '…': '&hellip;',
  '—': '&mdash;',
  '–': '&ndash;',
  '\"': '&ldquo;',
  '""': '&rdquo;',
  '\'': '&lsquo;',
  '\'': '&rsquo;'
}

// HTML 编码函数
const encodeHTML = (text) => {
  if (!text) return ''

  let result = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const code = char.charCodeAt(0)

    // 处理空格
    if (char === ' ' && options.value.preserveSpaces) {
      result += ' '
      continue
    }

    // 检查命名实体
    if (options.value.useNamed && namedEntities[char]) {
      result += namedEntities[char]
      continue
    }

    // 编码所有字符或仅特殊字符
    if (options.value.encodeAll || code < 32 || code > 126) {
      // 使用数字实体
      if (code < 128) {
        result += `&#${code};`
      } else {
        // Unicode 字符使用十六进制
        result += `&#x${code.toString(16).toUpperCase()};`
      }
    } else {
      // 检查是否是特殊字符
      if ('&<>"\''.includes(char)) {
        result += namedEntities[char] || `&#${code};`
      } else {
        result += char
      }
    }
  }

  return result
}

// 监听输入变化
watch(inputText, (newText) => {
  if (newText) {
    outputText.value = encodeHTML(newText)
  } else {
    outputText.value = ''
  }
})

// 监听选项变化
watch(options, () => {
  if (inputText.value) {
    outputText.value = encodeHTML(inputText.value)
  }
}, { deep: true })

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
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
  const blob = new Blob([outputText.value], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'html-encoded.html'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: 'HTML编码器 - 在线HTML实体编码工具',
  description: '免费在线HTML编码工具，支持命名实体和数字实体编码，可自定义编码选项，防止XSS攻击。',
  keywords: ['html', '编码', 'entity', 'html-encoder', 'xss', '在线工具', '实体编码']
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