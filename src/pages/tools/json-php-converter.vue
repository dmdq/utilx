<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">JSON与PHP数组转换 - JSON PHP Array互转工具</h1>
      <p class="text-muted-foreground">一款免费的在线 JSON 与 PHP Array 转换工具。支持JSON数据与PHP数组语法互相转换，可生成标准PHP数组格式。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 转换方向选择 -->
    <div class="flex items-center justify-center gap-4 mb-6">
      <span class="text-sm font-medium" :class="convertDirection === 'json-to-php' ? 'text-primary' : 'text-muted-foreground'">JSON</span>
      <button
        @click="toggleDirection"
        class="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        title="切换转换方向"
      >
        <RotateCcw class="w-4 h-4" />
      </button>
      <span class="text-sm font-medium" :class="convertDirection === 'php-to-json' ? 'text-primary' : 'text-muted-foreground'">PHP Array</span>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">
            输入{{ convertDirection === 'json-to-php' ? 'JSON' : 'PHP Array' }}
          </label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteFromClipboard"
            >
              粘贴
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadSample"
            >
              示例数据
            </button>
          </div>
        </div>
        <textarea
          v-model="inputData"
          class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          :placeholder="`在此输入${convertDirection === 'json-to-php' ? 'JSON' : 'PHP Array'}数据...`"
          @keydown.ctrl.enter="convert"
          @keydown.meta.enter="convert"
        ></textarea>
        <div v-if="inputError" class="mt-2 p-2 bg-destructive/20 text-destructive text-sm rounded">
          {{ inputError }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">
            {{ convertDirection === 'json-to-php' ? 'PHP Array' : 'JSON' }}输出
          </label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyOutput"
            >
              复制
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="downloadOutput"
            >
              下载{{ convertDirection === 'json-to-php' ? 'PHP' : 'JSON' }}
            </button>
          </div>
        </div>
        <pre
          ref="outputPre"
          class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg overflow-auto font-mono text-sm whitespace-pre-wrap"
        >{{ outputData }}</pre>
      </div>
    </div>

    <!-- PHP 输出配置（仅在 JSON 转 PHP 时显示） -->
    <div v-if="convertDirection === 'json-to-php'" class="mb-8 p-6 bg-card border border-border rounded-lg">
      <h3 class="text-lg font-semibold text-foreground mb-4">PHP 输出选项</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">数组语法</label>
          <select
            v-model="phpOptions.arraySyntax"
            class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="short">短数组语法 [] (PHP 5.4+)</option>
            <option value="long">长数组语法 array()</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">缩进大小</label>
          <select
            v-model="phpOptions.indentSize"
            class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="2">2 空格</option>
            <option value="4">4 空格</option>
            <option value="8">8 空格 (Tab)</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">字符串引号</label>
          <select
            v-model="phpOptions.quoteStyle"
            class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="single">单引号 '</option>
            <option value="double">双引号 "</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            v-model="phpOptions.addPhpTag"
            class="rounded"
          />
          添加 PHP 标签
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            v-model="phpOptions.addReturn"
            class="rounded"
          />
          添加 return
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            v-model="phpOptions.escapeUnicode"
            class="rounded"
          />
          转义 Unicode
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            v-model="phpOptions.alignValues"
            class="rounded"
          />
          对齐值
        </label>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        转换为 {{ convertDirection === 'json-to-php' ? 'PHP Array' : 'JSON' }}
      </button>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 JSON 与 PHP 数组转换？
        </h2>
        <p class="text-muted-foreground mb-4">
          JSON（JavaScript Object Notation）是一种轻量级的数据交换格式，而 PHP 数组是 PHP 语言中用于存储数据集合的数据结构。
          JSON 与 PHP 数组转换是指在这两种格式之间进行数据转换，方便开发者在不同系统和语言之间交换数据。
        </p>
        <p class="text-muted-foreground">
          PHP 的 json_encode() 和 json_decode() 函数提供了原生的 JSON 支持，但有时我们需要查看或手写 PHP 数组语法，
          本工具提供了便捷的转换功能，支持双向转换和多种输出格式。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择转换方向（JSON 转 PHP 或 PHP 转 JSON）</li>
          <li>将数据粘贴到左侧输入框</li>
          <li>配置输出选项（仅 JSON 转 PHP 时需要）</li>
          <li>点击转换按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧转换后的结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的数据类型映射
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">JSON → PHP</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• string → string</li>
              <li>• number → float/int</li>
              <li>• boolean → boolean</li>
              <li>• null → null</li>
              <li>• array → array</li>
              <li>• object → associative array</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">PHP → JSON</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• 'string' → "string"</li>
              <li>• 123 → 123</li>
              <li>• 123.45 → 123.45</li>
              <li>• true/false → true/false</li>
              <li>• null → null</li>
              <li>• [] / array() → []</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          PHP 数组语法选项
        </h2>
        <div class="space-y-3 mb-6">
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">短数组语法 [] (推荐)</h4>
            <p class="text-sm text-muted-foreground">PHP 5.4+ 支持，语法简洁明了，是现代 PHP 开发的标准。</p>
          </div>
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">长数组语法 array()</h4>
            <p class="text-sm text-muted-foreground">PHP 所有版本支持，兼容性好，但语法较为冗长。</p>
          </div>
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">字符串引号选择</h4>
            <p class="text-sm text-muted-foreground">可选择单引号或双引号。单引号性能更好，双引号支持变量解析。</p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换示例
        </h2>
        <div class="space-y-4 mb-6">
          <div>
            <h4 class="font-semibold text-foreground mb-2">JSON 转 PHP Array:</h4>
            <pre class="p-3 bg-muted/50 rounded text-sm overflow-x-auto"><code>// 输入 JSON
{
  "name": "John",
  "age": 30,
  "active": true,
  "hobbies": ["reading", "coding"],
  "address": {
    "city": "New York",
    "zip": "10001"
  }
}

// 输出 PHP
&lt;?php
return [
    'name' => 'John',
    'age' => 30,
    'active' => true,
    'hobbies' => [
        'reading',
        'coding'
    ],
    'address' => [
        'city' => 'New York',
        'zip' => '10001'
    ]
];</code></pre>
          </div>
          <div>
            <h4 class="font-semibold text-foreground mb-2">PHP Array 转 JSON:</h4>
            <pre class="p-3 bg-muted/50 rounded text-sm overflow-x-auto"><code>// 输入 PHP
&lt;?php
$data = array(
    'users' => array(
        array(
            'id' => 1,
            'name' => 'Alice',
            'email' => 'alice@example.com'
        ),
        array(
            'id' => 2,
            'name' => 'Bob',
            'email' => 'bob@example.com'
        )
    ),
    'total' => 2
);

// 输出 JSON
{
    "users": [
        {
            "id": 1,
            "name": "Alice",
            "email": "alice@example.com"
        },
        {
            "id": 2,
            "name": "Bob",
            "email": "bob@example.com"
        }
    ],
    "total": 2
}</code></pre>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成的 PHP 代码可以直接使用吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。生成的代码是标准的 PHP 语法，可以直接复制到 .php 文件中使用。
              如果选择了添加 PHP 标签和 return，会生成完整的可执行代码。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理 PHP 中的关联数组？</h3>
            <p class="text-muted-foreground mt-1">
              JSON 对象会被转换为 PHP 的关联数组（键值对数组）。转换时会自动处理，
              保持原有的键值关系。索引数组会保持数字索引。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持 PHP 的特殊数据类型吗？</h3>
            <p class="text-muted-foreground mt-1">
              支持 string, integer, float, boolean, null, array 等基本类型。
              对于 PHP 特有的资源类型、对象等，会被转换为相应的 JSON 表示。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}/`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileJson, FileText, Code, Copy, Download, RotateCcw,
  Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO 配置
useSeoMeta({
  title: 'JSON与PHP数组转换 - JSON PHP Array互转工具',
  description: '免费在线 JSON 与 PHP Array 转换工具，支持JSON数据与PHP数组语法互相转换，可生成标准PHP数组格式。纯本地计算，数据安全。',
  keywords: 'JSON转PHP, PHP转JSON, JSON PHP转换, PHP数组, 在线工具',
  author: 'Util工具箱',
  ogTitle: 'JSON与PHP数组转换 - JSON PHP Array互转工具',
  ogDescription: '免费在线 JSON 与 PHP Array 转换工具，支持JSON数据与PHP数组语法互相转换。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

// Schema.org 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'JSON与PHP数组转换工具',
        description: '免费在线 JSON 与 PHP Array 转换工具，支持JSON数据与PHP数组语法互相转换',
        url: 'https://www.util.cn/tools/json-php-converter',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'JSON转PHP',
          'PHP转JSON',
          '双向转换',
          '多种语法支持',
          '格式化输出',
          '本地处理'
        ]
      })
    }
  ]
})

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'json-php-converter')
const category = categories.find(c => c.id === 'format')

// 转换方向
const convertDirection = ref('json-to-php')

// 输入输出数据
const inputData = ref('')
const outputData = ref('')
const inputError = ref('')

// PHP 输出选项
const phpOptions = ref({
  arraySyntax: 'short',
  indentSize: '4',
  quoteStyle: 'single',
  addPhpTag: true,
  addReturn: true,
  escapeUnicode: false,
  alignValues: true
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, Code
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'format' && t.id !== 'json-php-converter'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'json-to-yaml'),
    tools.find(t => t.id === 'json-to-xml'),
    tools.find(t => t.id === 'yaml-formatter')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 切换转换方向
const toggleDirection = () => {
  convertDirection.value = convertDirection.value === 'json-to-php' ? 'php-to-json' : 'json-to-php'
  // 交换输入输出
  const temp = inputData.value
  inputData.value = outputData.value
  outputData.value = temp
  inputError.value = ''
}

// JSON 转 PHP 数组
const jsonToPhpArray = (jsonString, options) => {
  const jsonData = JSON.parse(jsonString)
  const indentChar = options.indentSize === '8' ? '\t' : ' '.repeat(parseInt(options.indentSize))
  const quote = options.quoteStyle
  const arrayStart = options.arraySyntax === 'short' ? '[' : 'array('
  const arrayEnd = options.arraySyntax === 'short' ? ']' : ')'

  const convertValue = (value, indentLevel = 0) => {
    const indent = indentChar.repeat(indentLevel)
    const nextIndent = indentChar.repeat(indentLevel + 1)

    if (value === null) {
      return 'null'
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }

    if (typeof value === 'number') {
      return String(value)
    }

    if (typeof value === 'string') {
      let escaped = value
        .replace(/\\/g, '\\\\')
        .replace(quote === '"' ? /"/g : /'/g, '\\$&')

      if (options.escapeUnicode) {
        escaped = escaped.replace(/[\u0080-\uffff]/g, (match) => {
          return '\\u' + match.charCodeAt(0).toString(16).padStart(4, '0')
        })
      }

      return `${quote}${escaped}${quote}`
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${arrayStart}${arrayEnd}`
      }

      const items = value.map(item => {
        const itemValue = convertValue(item, indentLevel + 1)
        return `${nextIndent}${itemValue}`
      })

      return `${arrayStart}\n${items.join(',\n')}\n${indent}${arrayEnd}`
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value)
      if (entries.length === 0) {
        return `${arrayStart}${arrayEnd}`
      }

      // 计算最大键长度用于对齐
      let maxKeyLength = 0
      if (options.alignValues) {
        maxKeyLength = Math.max(...entries.map(([key]) => key.length))
      }

      const items = entries.map(([key, val]) => {
        const escapedKey = key.replace(/'/g, "\\'")
        const keyStr = `${quote}${escapedKey}${quote}`
        const valStr = convertValue(val, indentLevel + 1)
        const padding = options.alignValues ? ' '.repeat(maxKeyLength - key.length) : ''

        return `${nextIndent}${keyStr}${padding} => ${valStr}`
      })

      return `${arrayStart}\n${items.join(',\n')}\n${indent}${arrayEnd}`
    }

    return 'null'
  }

  let result = convertValue(jsonData, 0)

  if (options.addPhpTag) {
    result = `<?php\n${options.addReturn ? 'return ' : ''}${result};`
  } else if (options.addReturn) {
    result = `return ${result};`
  }

  return result
}

// PHP 数组转 JSON
const phpArrayToJson = (phpString) => {
  // 简化的 PHP 数组解析器
  // 注意：这是一个基础实现，可能不覆盖所有 PHP 语法特性

  // 移除 PHP 标签和 return 语句
  let cleanCode = phpString
    .replace(/<\?php\s*/g, '')
    .replace(/^return\s+/gm, '')
    .replace(/;\s*$/g, '')

  // 将 array() 语法转换为 [] 语法
  cleanCode = cleanCode.replace(/array\s*\(/g, '[')
  cleanCode = cleanCode.replace(/\)\s*;/g, ']')

  // 将 PHP 键值对语法转换为 JSON 对象语法
  // 这是一个简化的正则替换，实际项目中建议使用专业的 PHP 解析器
  cleanCode = cleanCode.replace(/'([^']+)'\s*=>\s*/g, '"$1": ')
  cleanCode = cleanCode.replace(/"([^"]+)"\s*=>\s*/g, '"$1": ')

  // 处理 PHP 特有的值
  cleanCode = cleanCode.replace(/\btrue\b/g, 'true')
  cleanCode = cleanCode.replace(/\bfalse\b/g, 'false')
  cleanCode = cleanCode.replace(/\bnull\b/g, 'null')

  // 移除末尾的分号
  cleanCode = cleanCode.replace(/;$/g, '')

  try {
    // 尝试解析为 JSON
    JSON.parse(cleanCode)
    return cleanCode
  } catch (error) {
    // 如果解析失败，尝试进一步清理
    // 这里可以添加更复杂的 PHP 语法解析逻辑
    throw new Error('PHP 数组解析失败，请检查语法是否正确')
  }
}

// 执行转换
const convert = () => {
  if (!inputData.value) return

  try {
    inputError.value = ''

    if (convertDirection.value === 'json-to-php') {
      outputData.value = jsonToPhpArray(inputData.value, phpOptions.value)
    } else {
      outputData.value = phpArrayToJson(inputData.value)

      // 尝试格式化 JSON
      try {
        const parsed = JSON.parse(outputData.value)
        outputData.value = JSON.stringify(parsed, null, 2)
      } catch (e) {
        // 如果格式化失败，保持原样
      }
    }
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputData.value = ''
  }
}

// 监听选项变化，自动重新转换
watch(phpOptions, () => {
  if (inputData.value && convertDirection.value === 'json-to-php') {
    convert()
  }
}, { deep: true })

// 清空输入
const clearInput = () => {
  inputData.value = ''
  outputData.value = ''
  inputError.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputData.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  if (convertDirection.value === 'json-to-php') {
    inputData.value = `{
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "active": true,
    "score": 95.5,
    "avatar": null
  },
  "roles": ["admin", "editor"],
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": false
    }
  },
  "last_login": "2023-12-15T10:30:00Z"
}`
  } else {
    inputData.value = `<?php
$userData = array(
    'user' => array(
        'id' => 123,
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'active' => true,
        'score' => 95.5,
        'avatar' => null
    ),
    'roles' => array(
        'admin',
        'editor'
    ),
    'preferences' => array(
        'theme' => 'dark',
        'notifications' => array(
            'email' => true,
            'push' => false
        )
    ),
    'last_login' => '2023-12-15T10:30:00Z'
);`
  }
}

// 复制输出
const copyOutput = async () => {
  if (!outputData.value) return

  try {
    await navigator.clipboard.writeText(outputData.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputData.value) return

  const mimeType = convertDirection.value === 'json-to-php' ? 'text/php' : 'application/json'
  const extension = convertDirection.value === 'json-to-php' ? 'php' : 'json'

  const blob = new Blob([outputData.value], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `converted.${extension}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const handleToolSelect = (selectedTool) => {
  router.push(`/tools/${selectedTool.id}/`)
  addRecentTool(selectedTool.id)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}
</script>