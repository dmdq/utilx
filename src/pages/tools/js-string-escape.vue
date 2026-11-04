<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">JavaScript 字符串转义工具</h1>
      <p class="text-muted-foreground">JavaScript 字符串转义与反转义，支持单引号、双引号、模板字符串格式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入内容</h2>
          <div class="flex gap-2">
            <button
              @click="clearInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
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
          placeholder="请输入需要转义的 JavaScript 字符串..."
          class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>

        <!-- 转义选项 -->
        <div class="space-y-3">
          <h3 class="font-medium text-sm">字符串格式</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="format in stringFormats"
              :key="format.value"
              @click="stringFormat = format.value"
              :class="[
                'px-3 py-2 text-sm rounded-lg border transition-colors',
                stringFormat === format.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted'
              ]"
            >
              {{ format.label }}
            </button>
          </div>
        </div>

        <!-- 转义规则 -->
        <div class="space-y-3">
          <h3 class="font-medium text-sm">转义选项</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="escapeQuotes"
                class="rounded"
              />
              <span class="text-sm">转义引号 (\" \')</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="escapeNewlines"
                class="rounded"
              />
              <span class="text-sm">转义换行符 (\n)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="escapeSpecial"
                class="rounded"
              />
              <span class="text-sm">转义特殊字符 (\\ \t \r)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="escapeUnicode"
                class="rounded"
              />
              <span class="text-sm">Unicode 转义 (\uXXXX)</span>
            </label>
          </div>
        </div>

        <!-- 转义字符参考 -->
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">转义字符参考</h3>
          <div class="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>\' - 单引号</div>
            <div>\" - 双引号</div>
            <div>\\ - 反斜杠</div>
            <div>\n - 换行</div>
            <div>\r - 回车</div>
            <div>\t - 制表符</div>
            <div>\b - 退格</div>
            <div>\f - 换页符</div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">转义结果</h2>
          <div class="flex gap-2">
            <button
              v-if="outputText"
              @click="toggleDirection"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ direction === 'escape' ? '反转义' : '转义' }}
            </button>
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

        <div class="relative">
          <pre
            v-if="outputText"
            class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputText }}</pre>
          <div
            v-else
            class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground"
          >
            转义结果将显示在这里
          </div>

          <!-- 字符统计 -->
          <div
            v-if="outputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ outputText.length }} 字符
          </div>
        </div>

        <!-- 转义统计 -->
        <div v-if="inputText" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">处理统计</h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>原始长度: {{ inputText.length }}</div>
            <div>结果长度: {{ outputText.length }}</div>
            <div>长度变化: {{ outputText.length - inputText.length }}</div>
            <div>转义字符数: {{ escapeCount }}</div>
          </div>
        </div>

        <!-- 代码预览 -->
        <div v-if="outputText" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">代码预览</h3>
          <pre class="text-xs font-mono overflow-auto">{{ codePreview }}</pre>
        </div>
      </div>
    </div>

    <!-- 使用场景说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Code class="w-5 h-5 text-primary" />
          JavaScript 字符串转义说明
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <h4 class="font-medium">何时需要转义：</h4>
            <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>字符串中包含引号</li>
              <li>包含特殊字符（换行、制表符等）</li>
              <li>包含路径（Windows 路径）</li>
              <li>JSON 字符串值</li>
              <li>正则表达式字符串</li>
            </ul>
          </div>
          <div class="space-y-3">
            <h4 class="font-medium">转义规则：</h4>
            <div class="space-y-1 text-sm">
              <div class="flex items-center gap-2">
                <span class="font-mono bg-muted px-2 py-1 rounded">\"</span>
                <span class="text-muted-foreground">→ 转义双引号</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono bg-muted px-2 py-1 rounded">\\</span>
                <span class="text-muted-foreground">→ 转义反斜杠</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono bg-muted px-2 py-1 rounded">\n</span>
                <span class="text-muted-foreground">→ 换行符</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono bg-muted px-2 py-1 rounded">\uXXXX</span>
                <span class="text-muted-foreground">→ Unicode 字符</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 转义示例 -->
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">转义示例</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-2">1. 转义引号</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原始:</p>
                <code class="text-sm">He said "Hello"</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">转义后:</p>
                <code class="text-sm">He said \"Hello\"</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">2. 转义换行符</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原始:</p>
                <code class="text-sm">Line 1\nLine 2\nLine 3</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">转义后:</p>
                <code class="text-sm">Line 1\\nLine 2\\nLine 3</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">3. Windows 路径</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原始:</p>
                <code class="text-sm">C:\Users\Name\file.txt</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">转义后:</p>
                <code class="text-sm">C:\\Users\\Name\\file.txt</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">4. Unicode 转义</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原始:</p>
                <code class="text-sm">你好世界</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">Unicode 转义:</p>
                <code class="text-xs font-mono">\u4f60\u597d\u4e16\u754c</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/json-url-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSON URL 编码</p>
              <p class="text-xs text-muted-foreground">JSON URL 编码转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/html-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">HTML 编码</p>
              <p class="text-xs text-muted-foreground">HTML 实体编码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/base64-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Lock class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 编码</p>
              <p class="text-xs text-muted-foreground">Base64 格式转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useSeoMeta } from '#app'
import { Code, Hash, FileText, Lock, ArrowRight } from 'lucide-vue-next'

// 状态管理
const inputText = ref('')
const outputText = ref('')
const stringFormat = ref('double') // single, double, backtick
const escapeQuotes = ref(true)
const escapeNewlines = ref(true)
const escapeSpecial = ref(true)
const escapeUnicode = ref(false)
const direction = ref('escape') // escape, unescape
const copied = ref(false)

// 字符串格式选项
const stringFormats = [
  { value: 'single', label: '单引号 \'...\'' },
  { value: 'double', label: '双引号 "..."' },
  { value: 'backtick', label: '模板字符串 `...`' }
]

// 示例数据
const examples = [
  'He said "Hello" to me',
  'C:\\Users\\Name\\file.txt',
  'Line 1\nLine 2\nLine 3',
  '你好世界 Hello'
]
const currentExample = ref(0)

// 转义字符统计
const escapeCount = computed(() => {
  if (!outputText.value) return 0
  return (outputText.value.match(/\\/g) || []).length
})

// 代码预览
const codePreview = computed(() => {
  if (!outputText.value) return ''

  const quote = stringFormat.value === 'single' ? "'" :
                stringFormat.value === 'double' ? '"' : '`'

  return `const message = ${quote}${outputText.value}${quote};`
})

// JavaScript 转义函数
const escapeJSString = (text, options) => {
  let result = text

  if (options.escapeUnicode) {
    result = result.split('').map(char => {
      const code = char.charCodeAt(0)
      if (code > 127) {
        return '\\u' + code.toString(16).padStart(4, '0')
      }
      return char
    }).join('')
  }

  if (options.escapeQuotes) {
    if (stringFormat.value === 'single') {
      result = result.replace(/'/g, "\\'")
    } else if (stringFormat.value === 'double') {
      result = result.replace(/"/g, '\\"')
    }
  }

  if (options.escapeSpecial) {
    result = result
      .replace(/\\/g, '\\\\')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r')
      .replace(/\b/g, '\\b')
      .replace(/\f/g, '\\f')
  }

  if (options.escapeNewlines) {
    result = result.replace(/\n/g, '\\n')
  }

  return result
}

// JavaScript 反转义函数
const unescapeJSString = (text) => {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
}

// 处理文本转换
const processText = (text) => {
  if (!text) return ''

  const options = {
    escapeQuotes: escapeQuotes.value,
    escapeNewlines: escapeNewlines.value,
    escapeSpecial: escapeSpecial.value,
    escapeUnicode: escapeUnicode.value
  }

  if (direction.value === 'escape') {
    return escapeJSString(text, options)
  } else {
    return unescapeJSString(text)
  }
}

// 监听输入变化
watch([inputText, stringFormat, escapeQuotes, escapeNewlines, escapeSpecial, escapeUnicode, direction], () => {
  if (inputText.value) {
    outputText.value = processText(inputText.value)
  } else {
    outputText.value = ''
  }
})

// 切换方向
const toggleDirection = () => {
  direction.value = direction.value === 'escape' ? 'unescape' : 'escape'
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
}

// 加载示例
const loadExample = () => {
  inputText.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
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
  a.download = 'js-string.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: 'JavaScript字符串转义 - 在线JS字符串转义/反转义工具',
  description: '免费在线JavaScript字符串转义工具，支持单引号、双引号、模板字符串格式，智能转义特殊字符、换行符和Unicode字符。',
  keywords: ['javascript', 'js', '字符串转义', 'string escape', '转义字符', '反转义', '在线工具', 'unicode escape']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('JavaScript字符串转义工具')
</script>

<style scoped>
input[type="radio"]:checked,
input[type="checkbox"]:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
</style>
