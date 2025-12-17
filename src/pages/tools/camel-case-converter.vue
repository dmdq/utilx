<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">命名格式转换</h1>
      <p class="text-muted-foreground">camelCase、PascalCase、snake_case、kebab-case等命名格式互转</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <!-- 输入框 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">输入文本</h2>
          <textarea
            v-model="inputText"
            @input="convertAll"
            placeholder="输入要转换的文本...
支持单行、多行、驼峰式、下划线、短横线等格式
例如：helloWorld, hello_world, hello-world, Hello World"
            class="w-full h-48 p-3 border rounded-md resize-none"
          ></textarea>
          <div class="mt-3 flex justify-between text-sm text-muted-foreground">
            <span>字符数: {{ inputText.length }}</span>
            <span>行数: {{ inputText.split('\n').length }}</span>
          </div>

          <!-- 清空按钮 -->
          <button
            @click="clearInput"
            class="mt-3 w-full px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors text-sm"
          >
            清空输入
          </button>
        </div>

        <!-- 分隔符设置 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">分隔符设置</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-2">
              <input
                v-model="separators.space"
                type="checkbox"
                class="rounded"
                @change="convertAll"
              >
              <span class="text-sm">空格</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="separators.underscore"
                type="checkbox"
                class="rounded"
                @change="convertAll"
              >
              <span class="text-sm">下划线 (_)</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="separators.hyphen"
                type="checkbox"
                class="rounded"
                @change="convertAll"
              >
              <span class="text-sm">短横线 (-)</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="separators.camel"
                type="checkbox"
                class="rounded"
                @change="convertAll"
              >
              <span class="text-sm">驼峰大小写</span>
            </label>
          </div>
        </div>

        <!-- 示例文本 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">示例文本</h3>
          <div class="space-y-2">
            <button
              @click="loadExample('helloWorld')"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left font-mono"
            >
              helloWorld (驼峰式)
            </button>
            <button
              @click="loadExample('hello_world')"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left font-mono"
            >
              hello_world (下划线)
            </button>
            <button
              @click="loadExample('Hello World')"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left font-mono"
            >
              Hello World (空格分隔)
            </button>
            <button
              @click="loadExample('convert-text-to-different-formats\nhandle-multiple-lines')"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left font-mono"
            >
              多行示例
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：转换结果 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 转换结果 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">转换结果</h2>

          <div v-if="!inputText" class="text-center py-12 text-muted-foreground">
            <Type class="w-16 h-16 mx-auto mb-4" />
            <p>输入文本开始转换</p>
          </div>

          <div v-else class="space-y-4">
            <!-- 结果卡片 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- camelCase -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.camelCase)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">camelCase</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.camelCase || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  驼峰命名：首字母小写，单词间无分隔符
                </p>
              </div>

              <!-- PascalCase -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.pascalCase)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">PascalCase</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.pascalCase || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  帕斯卡命名：首字母大写，单词间无分隔符
                </p>
              </div>

              <!-- snake_case -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.snakeCase)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">snake_case</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.snakeCase || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  蛇形命名：全小写，下划线分隔
                </p>
              </div>

              <!-- kebab-case -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.kebabCase)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">kebab-case</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.kebabCase || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  短横线命名：全小写，短横线分隔
                </p>
              </div>

              <!-- CONSTANT_CASE -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.constantCase)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">CONSTANT_CASE</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.constantCase || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  常量命名：全大写，下划线分隔
                </p>
              </div>

              <!-- Train-Case -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.trainCase)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">Train-Case</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.trainCase || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  火车命名：首字母大写，短横线分隔
                </p>
              </div>

              <!-- dot.notation -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.dotNotation)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">dot.notation</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.dotNotation || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  点命名：全小写，点号分隔
                </p>
              </div>

              <!-- SPACE CASE -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.spaceCase)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">SPACE CASE</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.spaceCase || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  空格命名：首字母大写，空格分隔
                </p>
              </div>

              <!-- lower case -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.lowerCase)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">lower case</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.lowerCase || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  全小写
                </p>
              </div>

              <!-- UPPER CASE -->
              <div
                class="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="copyToClipboard(formats.upperCase)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">UPPER CASE</h3>
                  <Copy class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="font-mono text-sm bg-muted p-2 rounded">
                  {{ formats.upperCase || '无结果' }}
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  全大写
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info class="w-5 h-5 text-primary" />
            使用说明
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <h4 class="font-medium text-foreground mb-2">支持的格式</h4>
              <ul class="space-y-1 list-disc list-inside">
                <li>camelCase：JavaScript变量命名</li>
                <li>PascalCase：C#类名、TypeScript接口</li>
                <li>snake_case：Python变量、数据库字段</li>
                <li>kebab-case：CSS类名、URL路径</li>
                <li>CONSTANT_CASE：常量、宏定义</li>
                <li>Train-Case：文章标题、标题命名</li>
                <li>dot.notation：对象属性路径</li>
                <li>SPACE CASE：标题、描述文本</li>
              </ul>
            </div>
            <div>
              <h4 class="font-medium text-foreground mb-2">使用技巧</h4>
              <ul class="space-y-1 list-disc list-inside">
                <li>自动识别多种分隔符和大小写模式</li>
                <li>支持多行文本批量转换</li>
                <li>点击结果卡片可快速复制</li>
                <li>可自定义识别的分隔符类型</li>
                <li>保留原有换行，逐行转换</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">相关工具</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NuxtLink
              to="/tools/case-converter"
              class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
            >
              <Type class="w-5 h-5 text-primary" />
              <div>
                <p class="font-medium group-hover:text-primary">大小写转换</p>
                <p class="text-xs text-muted-foreground">文本大小写互转</p>
              </div>
              <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
            </NuxtLink>
            <NuxtLink
              to="/tools/text-replace"
              class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
            >
              <FileText class="w-5 h-5 text-primary" />
              <div>
                <p class="font-medium group-hover:text-primary">文本替换</p>
                <p class="text-xs text-muted-foreground">批量查找替换</p>
              </div>
              <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
            </NuxtLink>
            <NuxtLink
              to="/tools/line-operations"
              class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
            >
              <List class="w-5 h-5 text-primary" />
              <div>
                <p class="font-medium group-hover:text-primary">行操作工具</p>
                <p class="text-xs text-muted-foreground">行排序、去重、过滤</p>
              </div>
              <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- 复制成功提示 -->
    <div
      v-if="copySuccess"
      class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity"
    >
      已复制到剪贴板
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Type, Copy, Info, FileText, List, ArrowRight } from 'lucide-vue-next'

// 状态管理
const inputText = ref('')
const copySuccess = ref(false)
const separators = ref({
  space: true,
  underscore: true,
  hyphen: true,
  camel: true
})

// 格式转换结果
const formats = ref({
  camelCase: '',
  pascalCase: '',
  snakeCase: '',
  kebabCase: '',
  constantCase: '',
  trainCase: '',
  dotNotation: '',
  spaceCase: '',
  lowerCase: '',
  upperCase: ''
})

// 分词函数
const tokenize = (text) => {
  if (!text) return []

  const lines = text.split('\n')
  const result = []

  lines.forEach(line => {
    if (!line.trim()) {
      result.push([])
      return
    }

    const words = []
    let currentWord = ''

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      // 处理分隔符
      if (separators.value.space && char === ' ') {
        if (currentWord) words.push(currentWord)
        currentWord = ''
        continue
      }

      if (separators.value.underscore && char === '_') {
        if (currentWord) words.push(currentWord)
        words.push('_')
        currentWord = ''
        continue
      }

      if (separators.value.hyphen && char === '-') {
        if (currentWord) words.push(currentWord)
        words.push('-')
        currentWord = ''
        continue
      }

      // 处理驼峰式
      if (separators.value.camel && currentWord && char !== char.toLowerCase() && nextChar && nextChar !== nextChar.toUpperCase()) {
        words.push(currentWord)
        currentWord = char
        continue
      }

      currentWord += char
    }

    if (currentWord) words.push(currentWord)
    result.push(words)
  })

  return result
}

// 合并成原始单词（去除分隔符）
const mergeToWords = (tokens) => {
  const words = []
  let currentWord = ''

  tokens.forEach(token => {
    if (token === '_' || token === '-') {
      if (currentWord) {
        words.push(currentWord)
        currentWord = ''
      }
    } else {
      currentWord += token
    }
  })

  if (currentWord) {
    words.push(currentWord)
  }

  return words.map(word => word.toLowerCase())
}

// 转换所有格式
const convertAll = () => {
  const lines = inputText.value.split('\n')
  const convertedLines = {
    camelCase: [],
    pascalCase: [],
    snakeCase: [],
    kebabCase: [],
    constantCase: [],
    trainCase: [],
    dotNotation: [],
    spaceCase: [],
    lowerCase: [],
    upperCase: []
  }

  lines.forEach(line => {
    if (!line.trim()) {
      Object.keys(convertedLines).forEach(key => {
        convertedLines[key].push('')
      })
      return
    }

    const tokens = tokenize(line)[0] || []
    const words = mergeToWords(tokens)

    // 转换各种格式
    convertedLines.camelCase.push(toCamelCase(words))
    convertedLines.pascalCase.push(toPascalCase(words))
    convertedLines.snakeCase.push(toSnakeCase(words))
    convertedLines.kebabCase.push(toKebabCase(words))
    convertedLines.constantCase.push(toConstantCase(words))
    convertedLines.trainCase.push(toTrainCase(words))
    convertedLines.dotNotation.push(toDotNotation(words))
    convertedLines.spaceCase.push(toSpaceCase(words))
    convertedLines.lowerCase.push(toLowerCase(words))
    convertedLines.upperCase.push(toUpperCase(words))
  })

  // 合并为字符串
  Object.keys(formats.value).forEach(key => {
    formats.value[key] = convertedLines[key].join('\n')
  })
}

// 各种格式的转换函数
const toCamelCase = (words) => {
  if (words.length === 0) return ''
  return words[0] + words.slice(1).map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('')
}

const toPascalCase = (words) => {
  return words.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('')
}

const toSnakeCase = (words) => {
  return words.join('_')
}

const toKebabCase = (words) => {
  return words.join('-')
}

const toConstantCase = (words) => {
  return words.join('_').toUpperCase()
}

const toTrainCase = (words) => {
  return words.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('-')
}

const toDotNotation = (words) => {
  return words.join('.')
}

const toSpaceCase = (words) => {
  return words.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const toLowerCase = (words) => {
  return words.join(' ')
}

const toUpperCase = (words) => {
  return words.join(' ').toUpperCase()
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  Object.keys(formats.value).forEach(key => {
    formats.value[key] = ''
  })
}

// 加载示例
const loadExample = (text) => {
  inputText.value = text
  convertAll()
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// SEO配置
useSeoMeta({
  title: '命名格式转换 - camelCase、snake_case、kebab-case在线转换',
  description: '免费在线命名格式转换工具，支持camelCase、PascalCase、snake_case、kebab-case等多种编程命名格式互转。',
  keywords: ['命名格式转换', 'camelCase', 'snake_case', 'kebab-case', 'PascalCase', '命名规范', '编程命名']
})

definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
/* 自定义样式 */
.transition-shadow {
  transition: box-shadow 0.2s ease;
}

.cursor-pointer {
  cursor: pointer;
}
</style>