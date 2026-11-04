<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">代码格式化工具</h1>
      <p class="text-muted-foreground">格式化各种编程语言代码，美化代码结构</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 语言选择和选项 -->
      <div class="bg-card   rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 语言选择 -->
          <div>
            <label class="text-sm font-medium mb-2 block">编程语言</label>
            <select
              v-model="selectedLanguage"
              @change="handleLanguageChange"
              class="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">自动检测</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="cpp">C++</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="scss">SCSS</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="sql">SQL</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="swift">Swift</option>
              <option value="kotlin">Kotlin</option>
            </select>
          </div>

          <!-- 缩进选项 -->
          <div>
            <label class="text-sm font-medium mb-2 block">缩进</label>
            <div class="flex gap-2">
              <select
                v-model="indentType"
                class="flex-1 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="spaces">空格</option>
                <option value="tabs">制表符</option>
              </select>
              <input
                v-model.number="indentSize"
                type="number"
                min="1"
                max="8"
                class="w-20 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                :disabled="indentType === 'tabs'"
              />
            </div>
          </div>

          <!-- 格式化选项 -->
          <div>
            <label class="text-sm font-medium mb-2 block">格式化选项</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="options.semicolons"
                  class="mr-2"
                />
                <span class="text-sm">保留分号</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="options.singleQuote"
                  class="mr-2"
                />
                <span class="text-sm">单引号</span>
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="options.trailingComma"
                  class="mr-2"
                />
                <span class="text-sm">尾随逗号</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 代码输入输出区 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 输入区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">输入代码</h2>
            <div class="flex gap-2">
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
                加载示例
              </button>
              <button
                @click="clearInput"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <div class="relative">
            <textarea
              v-model="inputCode"
              placeholder="请输入要格式化的代码..."
              class="w-full h-96 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            ></textarea>

            <!-- 语言标签 -->
            <div v-if="detectedLanguage" class="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
              {{ detectedLanguage }}
            </div>

            <!-- 字符统计 -->
            <div class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded">
              {{ inputCode.length }} 字符
            </div>
          </div>
        </div>

        <!-- 输出区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">格式化结果</h2>
            <div class="flex gap-2">
              <button
                v-if="formattedCode"
                @click="copyResult"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ copied ? '已复制' : '复制' }}
              </button>
              <button
                v-if="formattedCode"
                @click="downloadResult"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                下载
              </button>
            </div>
          </div>

          <div class="relative">
            <textarea
              v-model="formattedCode"
              readonly
              placeholder="格式化后的代码将显示在这里..."
              class="w-full h-96 p-4 bg-muted rounded-lg resize-none font-mono text-sm"
            ></textarea>

            <!-- 复制成功提示 -->
            <div
              v-if="copied"
              class="absolute top-2 right-2 px-3 py-1 bg-green-500 text-white text-sm rounded"
            >
              已复制到剪贴板
            </div>

            <!-- 字符统计 -->
            <div class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded">
              {{ formattedCode.length }} 字符
            </div>
          </div>
        </div>
      </div>

      <!-- 格式化按钮 -->
      <div class="flex justify-center">
        <button
          @click="formatCode"
          :disabled="!inputCode"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Sparkles class="w-5 h-5" />
          格式化代码
        </button>
      </div>

      <!-- 压缩/压缩选项 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">代码压缩</h2>
        <div class="flex gap-4">
          <button
            @click="minifyCode"
            :disabled="!inputCode"
            class="px-4 py-2 bg-muted hover:bg-muted/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            压缩代码
          </button>
          <button
            @click="unminifyCode"
            :disabled="!inputCode"
            class="px-4 py-2 bg-muted hover:bg-muted/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            解压缩代码
          </button>
        </div>
      </div>

      <!-- 支持的语言列表 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">支持的语言</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div
            v-for="lang in supportedLanguages"
            :key="lang.value"
            class="p-3 bg-muted rounded-lg text-center"
          >
            <div class="font-medium text-sm">{{ lang.name }}</div>
            <div class="text-xs text-muted-foreground mt-1">{{ lang.extensions.join(', ') }}</div>
          </div>
        </div>
      </div>

      <!-- 格式化技巧 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">代码格式化技巧</h2>
        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">1. 统一代码风格</h3>
            <p class="text-muted-foreground">
              代码格式化不仅让代码更易读，还能帮助团队成员保持一致的代码风格。
              建议在项目中配置统一的格式化规则，如 ESLint、Prettier 等工具。
            </p>
          </div>
          <div>
            <h3 class="font-medium mb-2">2. 选择合适的缩进</h3>
            <p class="text-muted-foreground">
              2 个空格适合小型项目或配置文件，4 个空格是大多数语言的标准。
              制表符可以保持不同编辑器的一致性，但要注意混用空格和制表符的问题。
            </p>
          </div>
          <div>
            <h3 class="font-medium mb-2">3. 保持可读性</h3>
            <p class="text-muted-foreground">
              格式化后的代码应该保持原有的逻辑结构，避免过度格式化导致代码难以理解。
              适当添加空行分隔不同的逻辑块，提高代码的可读性。
            </p>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/json-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileJson class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSON格式化</p>
              <p class="text-xs text-muted-foreground">美化压缩JSON</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/css-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">CSS格式化</p>
              <p class="text-xs text-muted-foreground">美化压缩CSS</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/sql-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Database class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">SQL格式化</p>
              <p class="text-xs text-muted-foreground">美化SQL语句</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Sparkles, FileJson, FileText, Database, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'text', name: '文本处理', description: '文本处理工具集合' }

// 状态管理
const inputCode = ref('')
const formattedCode = ref('')
const selectedLanguage = ref('')
const detectedLanguage = ref('')
const copied = ref(false)

// 缩进设置
const indentType = ref('spaces')
const indentSize = ref(2)

// 格式化选项
const options = ref({
  semicolons: true,
  singleQuote: false,
  trailingComma: false
})

// 支持的语言
const supportedLanguages = [
  { name: 'JavaScript', value: 'javascript', extensions: ['js', 'jsx'] },
  { name: 'TypeScript', value: 'typescript', extensions: ['ts', 'tsx'] },
  { name: 'Python', value: 'python', extensions: ['py'] },
  { name: 'Java', value: 'java', extensions: ['java'] },
  { name: 'C#', value: 'csharp', extensions: ['cs'] },
  { name: 'C++', value: 'cpp', extensions: ['cpp', 'cc', 'cxx'] },
  { name: 'HTML', value: 'html', extensions: ['html', 'htm'] },
  { name: 'CSS', value: 'css', extensions: ['css'] },
  { name: 'SCSS', value: 'scss', extensions: ['scss'] },
  { name: 'JSON', value: 'json', extensions: ['json'] },
  { name: 'XML', value: 'xml', extensions: ['xml'] },
  { name: 'SQL', value: 'sql', extensions: ['sql'] },
  { name: 'PHP', value: 'php', extensions: ['php'] },
  { name: 'Ruby', value: 'ruby', extensions: ['rb'] },
  { name: 'Go', value: 'go', extensions: ['go'] },
  { name: 'Rust', value: 'rust', extensions: ['rs'] },
  { name: 'Swift', value: 'swift', extensions: ['swift'] },
  { name: 'Kotlin', value: 'kotlin', extensions: ['kt', 'kts'] }
]

// 示例代码
const exampleCodes = {
  javascript: `function calculateTotal(items, tax = 0.08) {
const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const taxAmount = subtotal * tax;
return subtotal + taxAmount; }`,
  python: `def calculate_total(items, tax=0.08):
subtotal = sum(item['price'] * item['quantity'] for item in items)
tax_amount = subtotal * tax
return subtotal + tax_amount

items = [{'name': 'Book', 'price': 20, 'quantity': 2}]
total = calculate_total(items)
print(f"Total: \${total:.2f}")`,
  json: `{"name":"John Doe","age":30,"email":"john@example.com","address":{"street":"123 Main St","city":"New York","zip":"10001"},"hobbies":["reading","traveling","coding"]}`,
  sql: `SELECT u.name, u.email, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2023-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY order_count DESC`
}

// 语言切换处理
const handleLanguageChange = () => {
  if (selectedLanguage.value && exampleCodes[selectedLanguage.value]) {
    inputCode.value = exampleCodes[selectedLanguage.value]
  }
}

// 检测语言
const detectLanguage = (code) => {
  // 简单的语言检测逻辑
  if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html'
  if (code.includes('def ') && code.includes(':')) return 'python'
  if (code.includes('function') || code.includes('const ') || code.includes('let ')) return 'javascript'
  if (code.includes('public class') || code.includes('import java')) return 'java'
  if (code.startsWith('{') || code.includes('":')) return 'json'
  if (code.toUpperCase().includes('SELECT') || code.toUpperCase().includes('FROM')) return 'sql'
  return ''
}

// 基础格式化函数
const basicFormat = (code, language) => {
  if (!code) return ''

  // 根据语言类型进行特殊处理
  switch (language) {
    case 'json':
      try {
        return JSON.stringify(JSON.parse(code), null, indentSize.value)
      } catch (e) {
        return code
      }

    case 'html':
      // 简单的 HTML 格式化
      return code
        .replace(/></g, '>\n<')
        .replace(/^\s*\n/gm, '')
        .split('\n')
        .map(line => {
          const depth = (line.match(/^\s*<\//g) || []).length - (line.match(/^\s*<[^\/][^>]*[^\/]>/g) || []).length
          const indent = '  '.repeat(Math.max(0, depth))
          return indent + line.trim()
        })
        .join('\n')

    default:
      // 通用格式化
      return formatGenericCode(code)
  }
}

// 通用代码格式化
const formatGenericCode = (code) => {
  const lines = code.split('\n')
  const indentChar = indentType.value === 'spaces' ? ' '.repeat(indentSize.value) : '\t'
  let formattedLines = []
  let currentIndent = 0

  for (let line of lines) {
    const trimmed = line.trim()

    // 处理空行
    if (!trimmed) {
      formattedLines.push('')
      continue
    }

    // 减少缩进的情况
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')') || trimmed.endsWith(':')) {
      currentIndent = Math.max(0, currentIndent - 1)
    }

    // 添加当前行
    formattedLines.push(indentChar.repeat(currentIndent) + trimmed)

    // 增加缩进的情况
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(') || trimmed.endsWith(':')) {
      currentIndent++
    }
  }

  return formattedLines.join('\n')
}

// 格式化代码
const formatCode = () => {
  const language = selectedLanguage.value || detectLanguage(inputCode.value)
  detectedLanguage.value = language

  formattedCode.value = basicFormat(inputCode.value, language)
}

// 压缩代码
const minifyCode = () => {
  // 简单的代码压缩
  let minified = inputCode.value
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
    .replace(/\/\/.*$/gm, '') // 移除单行注释
    .replace(/\s+/g, ' ') // 压缩空格
    .replace(/;\s*}/g, '}') // 移除分号前的空格
    .replace(/\s*([{}();,])\s*/g, '$1') // 压缩运算符周围空格
    .trim()

  formattedCode.value = minified
}

// 解压缩代码
const unminifyCode = () => {
  // 简单的代码解压缩
  const language = selectedLanguage.value || detectLanguage(inputCode.value)
  formattedCode.value = basicFormat(inputCode.value, language)
}

// 加载示例
const loadExample = () => {
  if (selectedLanguage.value && exampleCodes[selectedLanguage.value]) {
    inputCode.value = exampleCodes[selectedLanguage.value]
  } else {
    // 默认加载 JavaScript 示例
    inputCode.value = exampleCodes.javascript
    selectedLanguage.value = 'javascript'
  }
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputCode.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 清空输入
const clearInput = () => {
  inputCode.value = ''
  formattedCode.value = ''
  detectedLanguage.value = ''
}

// 复制结果
const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(formattedCode.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = formattedCode.value
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

// 下载结果
const downloadResult = () => {
  const language = selectedLanguage.value || 'txt'
  const extensions = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    csharp: 'cs',
    cpp: 'cpp',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    xml: 'xml',
    sql: 'sql',
    php: 'php',
    ruby: 'rb',
    go: 'go',
    rust: 'rs',
    swift: 'swift',
    kotlin: 'kt'
  }

  const ext = extensions[language] || 'txt'
  const blob = new Blob([formattedCode.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `formatted-code.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: '代码格式化工具 - 在线多语言代码美化工具',
  description: '免费在线代码格式化工具，支持JavaScript、Python、Java、JSON等20+种编程语言的代码美化和压缩功能。',
  keywords: ['代码格式化', '代码美化', '在线格式化', '代码压缩', 'JavaScript', 'Python', 'JSON']
})


</script>