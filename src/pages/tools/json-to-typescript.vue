<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">JSON转TypeScript接口 - 自动生成TS类型定义</h1>
      <p class="text-muted-foreground">一款免费的在线 JSON to TypeScript 转换工具。根据JSON数据自动生成TypeScript接口、类型定义，支持嵌套对象、数组等复杂结构。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入JSON</label>
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
          v-model="inputJSON"
          class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入JSON数据..."
          @input="convert"
        ></textarea>
        <div v-if="inputError" class="mt-2 p-2 bg-destructive/20 text-destructive text-sm rounded">
          {{ inputError }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">TypeScript接口</label>
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
              下载TS
            </button>
          </div>
        </div>
        <pre
          ref="outputPre"
          class="flex-1 w-full min-h-[400px] p-4 bg-muted border border-border rounded-lg overflow-auto font-mono text-sm whitespace-pre-wrap"
        >{{ outputTypeScript }}</pre>
      </div>
    </div>

    <!-- 配置选项 -->
    <div class="mb-8 p-6 bg-card border border-border rounded-lg">
      <h3 class="text-lg font-semibold text-foreground mb-4">生成选项</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">接口名称</label>
          <input
            type="text"
            v-model="config.interfaceName"
            class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="根接口名称"
          />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">输出格式</label>
          <select
            v-model="config.outputFormat"
            class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="interface">Interface</option>
            <option value="type">Type Alias</option>
            <option value="class">Class</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">命名规则</label>
          <select
            v-model="config.namingConvention"
            class="w-full px-3 py-2 bg-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="pascal">PascalCase</option>
            <option value="camel">camelCase</option>
            <option value="snake">snake_case</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            v-model="config.optionalFields"
            class="rounded"
          />
          所有属性可选
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            v-model="config.exportKeyword"
            class="rounded"
          />
          添加export
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            v-model="config.addComments"
            class="rounded"
          />
          添加注释
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            v-model="config.strictNullChecks"
            class="rounded"
          />
          严格空值检查
        </label>
      </div>
    </div>

    <!-- 转换按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="convert"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        生成 TypeScript 接口
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
          什么是 JSON 转 TypeScript 接口？
        </h2>
        <p class="text-muted-foreground mb-4">
          JSON（JavaScript Object Notation）是一种轻量级的数据交换格式，而 TypeScript 是 JavaScript 的超集，
          提供了静态类型检查。JSON 转 TypeScript 接口是将 JSON 数据结构转换为 TypeScript 类型定义的过程，
          帮助开发者在代码中实现类型安全。
        </p>
        <p class="text-muted-foreground">
          通过自动生成接口定义，开发者可以快速为 API 响应、配置文件等数据结构创建类型定义，
          避免手动编写繁琐的类型代码，提高开发效率和代码质量。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将 JSON 数据粘贴到左侧输入框</li>
          <li>配置生成选项（接口名称、格式等）</li>
          <li>工具会自动实时生成 TypeScript 接口</li>
          <li>点击"生成 TypeScript 接口"按钮或等待自动转换</li>
          <li>复制或下载生成的接口定义</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的类型转换
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">基础类型</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• string → string</li>
              <li>• number → number</li>
              <li>• boolean → boolean</li>
              <li>• null → null | undefined</li>
              <li>• undefined → undefined</li>
            </ul>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">复杂类型</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• [] → T[]</li>
              <li>• {} → Interface</li>
              <li>• 混合数组 → Union[]</li>
              <li>• 可选字段 → property?</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          高级功能
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>智能命名</strong>: 自动推断和生成接口名称</li>
          <li><strong>嵌套处理</strong>: 支持任意深度的嵌套对象</li>
          <li><strong>数组类型推断</strong>: 智能推断数组元素类型</li>
          <li><strong>联合类型</strong>: 处理不同类型的混合数组</li>
          <li><strong>注释生成</strong>: 可选添加类型注释说明</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换示例
        </h2>
        <div class="space-y-4 mb-6">
          <div>
            <h4 class="font-semibold text-foreground mb-2">输入 JSON:</h4>
            <pre class="p-3 bg-muted/50 rounded text-sm overflow-x-auto"><code>{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "hobbies": ["reading", "coding"],
  "address": {
    "street": "123 Main St",
    "city": "New York"
  },
  "scores": [95, 88, 92]
}</code></pre>
          </div>
          <div>
            <h4 class="font-semibold text-foreground mb-2">输出 TypeScript:</h4>
            <pre class="p-3 bg-muted/50 rounded text-sm overflow-x-auto"><code>export interface RootObject {
  name: string;
  age: number;
  isActive: boolean;
  hobbies: string[];
  address: Address;
  scores: number[];
}

export interface Address {
  street: string;
  city: string;
}</code></pre>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理数组中不同类型的数据？</h3>
            <p class="text-muted-foreground mt-1">
              工具会自动检测数组中的不同类型，并生成联合类型。例如包含字符串和数字的数组会生成 (string | number)[]。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成的接口可以直接使用吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。生成的接口遵循 TypeScript 标准语法，可以直接复制到 .ts 文件中使用。
              建议根据实际需求调整属性的可选性和类型定义。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持日期类型吗？</h3>
            <p class="text-muted-foreground mt-1">
              日期字符串会被识别为 string 类型。如果需要 Date 类型，可以在生成后手动修改，
              或者使用"添加注释"选项来标记哪些字段是日期。
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
  FileJson, FileCode, Copy, Download,
  Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO 配置
useSeoMeta({
  title: 'JSON转TypeScript接口 - 自动生成TS类型定义',
  description: '免费在线 JSON to TypeScript 转换工具，根据JSON数据自动生成TypeScript接口、类型定义，支持嵌套对象、数组等复杂结构。纯本地计算，数据安全。',
  keywords: 'JSON转TypeScript, JSON to TypeScript, TypeScript接口生成, 类型定义生成, 在线工具',
  author: 'Util工具箱',
  ogTitle: 'JSON转TypeScript接口 - 自动生成TS类型定义',
  ogDescription: '免费在线 JSON to TypeScript 转换工具，根据JSON数据自动生成TypeScript接口。',
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
        name: 'JSON转TypeScript接口工具',
        description: '免费在线 JSON to TypeScript 转换工具，根据JSON数据自动生成TypeScript接口',
        url: 'https://www.util.cn/tools/json-to-typescript',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'JSON转TypeScript',
          '自动生成接口',
          '智能类型推断',
          '嵌套对象支持',
          '多种输出格式',
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
const tool = tools.find(t => t.id === 'json-to-typescript')
const category = categories.find(c => c.id === 'dev')

// 输入输出数据
const inputJSON = ref('')
const outputTypeScript = ref('')
const inputError = ref('')

// 配置选项
const config = ref({
  interfaceName: 'RootObject',
  outputFormat: 'interface',
  namingConvention: 'pascal',
  optionalFields: false,
  exportKeyword: true,
  addComments: false,
  strictNullChecks: false
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileCode, Lock, Shield, Clock, Type, Wifi, Image,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'dev' && t.id !== 'json-to-typescript'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'json-to-model'),
    tools.find(t => t.id === 'json-schema'),
    tools.find(t => t.id === 'mock-data')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 类型映射
const typeMap = {
  'string': 'string',
  'number': 'number',
  'boolean': 'boolean',
  'null': config.value.strictNullChecks ? 'null' : 'null | undefined',
  'undefined': 'undefined'
}

// 命名转换函数
const convertName = (name, convention) => {
  switch (convention) {
    case 'pascal':
      return name.replace(/(^|_)([a-z])/g, (_, __, letter) => letter.toUpperCase())
    case 'camel':
      return name.replace(/(^|_)([a-z])/g, (_, __, letter) => __ ? letter.toUpperCase() : letter.toLowerCase())
    case 'snake':
      return name.replace(/([A-Z])/g, '_$1').toLowerCase()
    default:
      return name
  }
}

// 推断类型
const inferType = (value, key = '') => {
  if (value === null) return config.value.strictNullChecks ? 'null' : 'null | undefined'
  if (value === undefined) return 'undefined'

  const type = typeof value

  if (type === 'string') {
    // 检查是否为日期字符串
    if (value.match(/^\d{4}-\d{2}-\d{2}/) || !isNaN(Date.parse(value))) {
      return config.value.addComments ? `string /* ${key} is a date */` : 'string'
    }
    return 'string'
  }
  if (type === 'number') return 'number'
  if (type === 'boolean') return 'boolean'

  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]'

    // 分析数组元素类型
    const types = new Set(value.map(item => inferType(item)))
    const uniqueTypes = Array.from(types)

    if (uniqueTypes.length === 1) {
      return `${uniqueTypes[0]}[]`
    }
    return `(${uniqueTypes.join(' | ')})[]`
  }

  if (type === 'object') return 'object'

  return 'any'
}

// 生成接口名称
const generateInterfaceName = (key, parentName = '') => {
  let name = key
  if (!name) {
    name = parentName || config.value.interfaceName
  }

  // 清理名称
  name = name.replace(/[^a-zA-Z0-9_]/g, '')

  // 确保首字母大写
  if (name.length > 0 && !/^[A-Z]/.test(name)) {
    name = name.charAt(0).toUpperCase() + name.slice(1)
  }

  return convertName(name, config.value.namingConvention)
}

// 生成接口
const generateInterface = (obj, interfaceName = '', indentLevel = 0, interfaces = new Map()) => {
  const indent = '  '.repeat(indentLevel)
  const name = interfaceName || generateInterfaceName(config.value.interfaceName)

  // 检查是否已经生成过相同的接口
  const objKey = JSON.stringify(obj)
  if (interfaces.has(objKey)) {
    return interfaces.get(objKey)
  }

  let result = ''

  // 添加注释
  if (config.value.addComments && indentLevel === 0) {
    result += `${indent}/**\n`
    result += `${indent} * Auto-generated interface from JSON\n`
    result += `${indent} */\n`
  }

  // 导出关键字
  const exportKeyword = config.value.exportKeyword && indentLevel === 0 ? 'export ' : ''

  // 开始接口定义
  const formatKeyword = config.value.outputFormat
  if (formatKeyword === 'interface') {
    result += `${indent}${exportKeyword}interface ${name} {\n`
  } else if (formatKeyword === 'type') {
    result += `${indent}${exportKeyword}type ${name} = {\n`
  } else if (formatKeyword === 'class') {
    result += `${indent}${exportKeyword}class ${name} {\n`
  }

  // 处理属性
  const entries = Object.entries(obj)
  for (const [key, value] of entries) {
    const optionalMark = config.value.optionalFields || value === null || value === undefined ? '?' : ''
    const type = inferType(value, key)

    if (config.value.addComments) {
      result += `${indent}  /** ${key} property */\n`
    }

    if (formatKeyword === 'class') {
      result += `${indent}  ${key}${optionalMark}: ${type};\n`
    } else {
      result += `${indent}  ${key}${optionalMark}: ${type};\n`
    }
  }

  // 结束接口定义
  result += `${indent}}`

  if (formatKeyword === 'interface' || formatKeyword === 'type') {
    result += ';'
  }
  result += '\n'

  // 保存到接口映射
  interfaces.set(objKey, name)

  // 处理嵌套对象
  for (const [key, value] of entries) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedName = generateInterfaceName(key, name)
      result += '\n' + generateInterface(value, nestedName, indentLevel, interfaces)
    }
  }

  return result
}

// 执行转换
const convert = () => {
  if (!inputJSON.value) {
    outputTypeScript.value = ''
    return
  }

  try {
    inputError.value = ''
    const jsonData = JSON.parse(inputJSON.value)

    if (typeof jsonData !== 'object' || jsonData === null) {
      throw new Error('输入必须是 JSON 对象')
    }

    const interfaces = new Map()
    outputTypeScript.value = generateInterface(jsonData, config.value.interfaceName, 0, interfaces).trim()
  } catch (error) {
    inputError.value = `转换失败: ${error.message}`
    outputTypeScript.value = ''
  }
}

// 监听配置变化，自动重新转换
watch(config, () => {
  if (inputJSON.value) {
    convert()
  }
}, { deep: true })

// 清空输入
const clearInput = () => {
  inputJSON.value = ''
  outputTypeScript.value = ''
  inputError.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputJSON.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  inputJSON.value = `{
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "isActive": true,
    "lastLogin": "2023-12-15T10:30:00Z"
  },
  "posts": [
    {
      "id": 1,
      "title": "Getting Started with TypeScript",
      "content": "TypeScript is a typed superset of JavaScript...",
      "published": true,
      "tags": ["typescript", "javascript", "tutorial"],
      "createdAt": "2023-12-01T09:00:00Z"
    },
    {
      "id": 2,
      "title": "Advanced TypeScript Patterns",
      "content": "In this post, we explore advanced TypeScript patterns...",
      "published": false,
      "tags": ["typescript", "advanced", "patterns"],
      "createdAt": "2023-12-10T14:30:00Z"
    }
  ],
  "settings": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": false,
      "sms": null
    },
    "privacy": {
      "publicProfile": false,
      "showEmail": false
    }
  },
  "metadata": {
    "version": "1.0.0",
    "created": "2023-01-01T00:00:00Z",
    "updated": null
  }
}`
}

// 复制输出
const copyOutput = async () => {
  if (!outputTypeScript.value) return

  try {
    await navigator.clipboard.writeText(outputTypeScript.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputTypeScript.value) return

  const blob = new Blob([outputTypeScript.value], { type: 'text/typescript' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'types.d.ts'
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