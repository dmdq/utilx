<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">JSON 转 Model 类</h1>
      <p class="text-muted-foreground">将 JSON 数据自动转换为各种编程语言的 Model 类，支持复杂嵌套结构</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <!-- 目标语言选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">目标语言</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="lang in languages"
              :key="lang.value"
              @click="selectedLanguage = lang.value"
              :class="[
                'px-4 py-3 rounded-md transition-colors text-left',
                selectedLanguage === lang.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">{{ lang.name }}</div>
              <div class="text-xs opacity-80">{{ lang.description }}</div>
            </button>
          </div>
        </div>

        <!-- JSON 输入 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">JSON 数据</h2>
            <div class="flex gap-2">
              <button
                @click="loadExample"
                class="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                加载示例
              </button>
              <button
                @click="clearJson"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
              <button
                @click="formatJson"
                :disabled="!jsonInput"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                格式化
              </button>
            </div>
          </div>

          <textarea
            v-model="jsonInput"
            placeholder="输入 JSON 数据..."
            class="w-full h-80 px-4 py-3 border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>

          <!-- 配置选项 -->
          <div class="mt-4 space-y-3">
            <div>
              <label class="text-sm font-medium">根类名称</label>
              <input
                v-model="options.rootClassName"
                type="text"
                placeholder="RootModel"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.generateImmutable"
                type="checkbox"
                id="generateImmutable"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="generateImmutable" class="text-sm">生成不可变类</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.useOptionalTypes"
                type="checkbox"
                id="useOptionalTypes"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="useOptionalTypes" class="text-sm">使用可选类型</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.generateAnnotations"
                type="checkbox"
                id="generateAnnotations"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="generateAnnotations" class="text-sm">生成注解</label>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：输出区域 -->
      <div class="space-y-4">
        <!-- 生成预览 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">生成结果</h2>
            <div class="flex gap-2">
              <button
                @click="copyModel"
                :disabled="!generatedModel"
                class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ copied ? '已复制' : '复制' }}
              </button>
              <button
                @click="downloadModel"
                :disabled="!generatedModel"
                class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下载
              </button>
            </div>
          </div>

          <div class="border rounded-lg p-4 bg-muted/30 min-h-[500px] max-h-[600px] overflow-auto">
            <pre v-if="generatedModel" class="text-sm whitespace-pre-wrap font-mono"><code>{{ generatedModel }}</code></pre>
            <div v-else class="text-center text-muted-foreground py-12">
              <FileJson class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>请输入 JSON 数据后生成 Model 类</p>
            </div>
          </div>
        </div>

        <!-- 类型分析 -->
        <div v-if="typeAnalysis" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">类型分析</h2>
          <div class="space-y-2">
            <div v-for="(type, name) in typeAnalysis" :key="name" class="flex items-center justify-between p-2 bg-muted rounded">
              <span class="font-mono text-sm">{{ name }}</span>
              <span class="text-xs text-muted-foreground">{{ type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          支持的 JSON 格式
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">基本类型映射</h4>
            <ul class="list-disc list-inside space-y-1">
              <li>字符串 → String / str / string</li>
              <li>数字 → Integer / Double / number / int</li>
              <li>布尔值 → Boolean / bool / boolean</li>
              <li>数组 → List / Array / array</li>
              <li>对象 → 自定义类 / interface</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">特殊处理</h4>
            <ul class="list-disc list-inside space-y-1">
              <li>自动识别嵌套对象并生成对应的类</li>
              <li>支持数组和对象的复杂嵌套结构</li>
              <li>自动转换驼峰命名和下划线命名</li>
              <li>处理 null 值和可选字段</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/sql-to-model"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Database class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">SQL 转 Model</p>
              <p class="text-xs text-muted-foreground">SQL语句转模型类</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/xml-to-model"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">XML 转 Model</p>
              <p class="text-xs text-muted-foreground">XML数据转模型类</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/json-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Code class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSON 格式化</p>
              <p class="text-xs text-muted-foreground">格式化JSON数据</p>
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
import { Info, FileJson, Database, FileText, Code, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const selectedLanguage = ref('typescript')
const jsonInput = ref('')
const copied = ref(false)
const parsedJson = ref(null)

// 配置选项
const options = ref({
  rootClassName: 'RootModel',
  generateImmutable: false,
  useOptionalTypes: true,
  generateAnnotations: true
})

// 支持的语言
const languages = [
  { value: 'typescript', name: 'TypeScript', description: '类型安全的 JavaScript' },
  { value: 'java', name: 'Java', description: '企业级开发语言' },
  { value: 'python', name: 'Python', description: '动态类型语言' },
  { value: 'csharp', name: 'C#', description: '.NET 平台语言' },
  { value: 'go', name: 'Go', description: '高效并发语言' },
  { value: 'kotlin', name: 'Kotlin', description: 'JVM 新兴语言' }
]

// 示例 JSON
const exampleJson = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  isActive: true,
  balance: 1250.50,
  address: {
    street: "123 Main St",
    city: "New York",
    country: "USA",
    zipCode: "10001"
  },
  phoneNumbers: [
    {
      type: "home",
      number: "212-555-1234"
    },
    {
      type: "work",
      number: "646-555-4567"
    }
  ],
  createdAt: "2024-01-15T10:30:00Z",
  tags: ["premium", "verified", "active"]
}

// 类型分析
const typeAnalysis = computed(() => {
  if (!parsedJson.value) return null

  const analysis = {}

  const analyzeType = (obj, prefix = '') => {
    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        analyzeType(obj[0], prefix)
      }
    } else if (typeof obj === 'object' && obj !== null) {
      const className = prefix || options.value.rootClassName
      analysis[className] = 'class'

      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'object') {
              const itemClassName = toPascalCase(key)
              analyzeType(value[0], itemClassName)
            }
          } else {
            const subClassName = toPascalCase(key)
            analyzeType(value, subClassName)
          }
        }
      }
    }
  }

  analyzeType(parsedJson.value)
  return analysis
})

// 生成 Model 类
const generatedModel = computed(() => {
  if (!parsedJson.value) return ''

  switch (selectedLanguage.value) {
    case 'typescript':
      return generateTypeScriptModel()
    case 'java':
      return generateJavaModel()
    case 'python':
      return generatePythonModel()
    case 'csharp':
      return generateCSharpModel()
    case 'go':
      return generateGoModel()
    case 'kotlin':
      return generateKotlinModel()
    default:
      return ''
  }
})

// 转换为 PascalCase
const toPascalCase = (str) => {
  return str.replace(/(?:^|[_-])(\w)/g, (_, char) => char.toUpperCase())
}

// 转换为 camelCase
const toCamelCase = (str) => {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

// 推断数据类型
const inferType = (value, language) => {
  if (value === null || value === undefined) {
    switch (language) {
      case 'typescript': return options.value.useOptionalTypes ? 'any | null' : 'any'
      case 'java': return 'Object'
      case 'python': return 'Any'
      case 'csharp': return 'object'
      case 'go': return 'interface{}'
      case 'kotlin': return 'Any?'
      default: return 'any'
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${inferType(null, language)}[]`
    }
    const itemType = inferType(value[0], language)
    return `${itemType}[]`
  }

  if (typeof value === 'object') {
    switch (language) {
      case 'typescript': return toPascalCase(Object.keys(value)[0] || 'Item')
      case 'java': return toPascalCase(Object.keys(value)[0] || 'Item')
      case 'python': return toPascalCase(Object.keys(value)[0] || 'Item')
      case 'csharp': return toPascalCase(Object.keys(value)[0] || 'Item')
      case 'go': return toPascalCase(Object.keys(value)[0] || 'Item')
      case 'kotlin': return toPascalCase(Object.keys(value)[0] || 'Item')
      default: return 'Object'
    }
  }

  switch (typeof value) {
    case 'string':
      // 检查是否是日期格式
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        switch (language) {
          case 'typescript': return 'Date'
          case 'java': return 'LocalDateTime'
          case 'python': return 'datetime'
          case 'csharp': return 'DateTime'
          case 'go': return 'time.Time'
          case 'kotlin': return 'LocalDateTime'
          default: return 'string'
        }
      }
      switch (language) {
        case 'typescript': return 'string'
        case 'java': return 'String'
        case 'python': return 'str'
        case 'csharp': return 'string'
        case 'go': return 'string'
        case 'kotlin': return 'String'
        default: return 'string'
      }
    case 'number':
      if (Number.isInteger(value)) {
        switch (language) {
          case 'typescript': return 'number'
          case 'java': return 'Integer'
          case 'python': return 'int'
          case 'csharp': return 'int'
          case 'go': return 'int'
          case 'kotlin': return 'Int'
          default: return 'number'
        }
      } else {
        switch (language) {
          case 'typescript': return 'number'
          case 'java': return 'Double'
          case 'python': return 'float'
          case 'csharp': return 'double'
          case 'go': return 'float64'
          case 'kotlin': return 'Double'
          default: return 'number'
        }
      }
    case 'boolean':
      switch (language) {
        case 'typescript': return 'boolean'
        case 'java': return 'Boolean'
        case 'python': return 'bool'
        case 'csharp': return 'bool'
        case 'go': return 'bool'
        case 'kotlin': return 'Boolean'
        default: return 'boolean'
      }
    default:
      return 'any'
  }
}

// 生成 TypeScript Model
const generateTypeScriptModel = () => {
  const classes = new Map()

  const generateClass = (obj, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = ''

    if (className === options.value.rootClassName) {
      result += `export interface ${className} {\n`
    } else {
      result += `export interface ${className} {\n`
    }

    for (const [key, value] of Object.entries(obj)) {
      const propertyKey = toCamelCase(key)
      let type = inferType(value, 'typescript')

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const subClassName = toPascalCase(key)
        type = generateClass(value, subClassName)
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const itemClassName = toPascalCase(key)
        generateClass(value[0], itemClassName)
        type = `${itemClassName}[]`
      }

      const optional = options.value.useOptionalTypes && (value === null || value === undefined)
      result += `  ${propertyKey}${optional ? '?' : ''}: ${type};\n`
    }

    result += '}\n'
    classes.set(className, result)
    return className
  }

  generateClass(parsedJson.value, options.value.rootClassName)

  return Array.from(classes.values()).join('\n')
}

// 生成 Java Model
const generateJavaModel = () => {
  const classes = new Map()

  const generateClass = (obj, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = `public class ${className} {\n`

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toCamelCase(key)
      const fieldType = inferType(value, 'java')

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const subClassName = toPascalCase(key)
        generateClass(value, subClassName)
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const itemClassName = toPascalCase(key)
        generateClass(value[0], itemClassName)
      }

      if (options.value.generateAnnotations) {
        if (key !== fieldName) {
          result += `    @JsonProperty("${key}")\n`
        }
      }

      result += `    private ${fieldType} ${fieldName};\n\n`
    }

    // 生成 getter/setter
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toCamelCase(key)
      const fieldNameUpper = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      const fieldType = inferType(value, 'java')

      result += `    public ${fieldType} get${fieldNameUpper}() {\n`
      result += `        return ${fieldName};\n`
      result += `    }\n\n`

      result += `    public void set${fieldNameUpper}(${fieldType} ${fieldName}) {\n`
      result += `        this.${fieldName} = ${fieldName};\n`
      result += `    }\n\n`
    }

    result += '}\n'
    classes.set(className, result)
    return className
  }

  generateClass(parsedJson.value, options.value.rootClassName)

  let output = ''
  if (options.value.generateAnnotations) {
    output = 'import com.fasterxml.jackson.annotation.JsonProperty;\n\n'
  }
  output += Array.from(classes.values()).join('\n')

  return output
}

// 生成 Python Model
const generatePythonModel = () => {
  const classes = new Map()

  const generateClass = (obj, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = `from typing import Optional, List, Dict, Any\n`
    result += `from dataclasses import dataclass\n\n`
    result += `@dataclass\n`
    result += `class ${className}:\n`

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toCamelCase(key)
      let fieldType = inferType(value, 'python')

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const subClassName = toPascalCase(key)
        generateClass(value, subClassName)
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const itemClassName = toPascalCase(key)
        generateClass(value[0], itemClassName)
        fieldType = `List[${itemClassName}]`
      } else if (Array.isArray(value)) {
        const itemType = value.length > 0 ? inferType(value[0], 'python') : 'Any'
        fieldType = `List[${itemType}]`
      }

      if (options.value.useOptionalTypes && (value === null || value === undefined)) {
        fieldType = `Optional[${fieldType}]`
      }

      result += `    ${fieldName}: ${fieldType}\n`
    }

    classes.set(className, result)
    return className
  }

  generateClass(parsedJson.value, options.value.rootClassName)

  return Array.from(classes.values()).join('\n')
}

// 生成 C# Model
const generateCSharpModel = () => {
  const classes = new Map()

  const generateClass = (obj, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = `using System;\n`
    result += `using System.Collections.Generic;\n`
    result += `using Newtonsoft.Json;\n\n`
    result += `public class ${className}\n{\n`

    for (const [key, value] of Object.entries(obj)) {
      const propertyName = toPascalCase(key)
      let fieldType = inferType(value, 'csharp')

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const subClassName = toPascalCase(key)
        generateClass(value, subClassName)
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const itemClassName = toPascalCase(key)
        generateClass(value[0], itemClassName)
        fieldType = `List<${itemClassName}>`
      } else if (Array.isArray(value)) {
        const itemType = value.length > 0 ? inferType(value[0], 'csharp') : 'object'
        fieldType = `List<${itemType}>`
      }

      if (options.value.generateAnnotations && key !== propertyName) {
        result += `    [JsonProperty("${key}")]\n`
      }

      result += `    public ${fieldType} ${propertyName} { get; set; }\n\n`
    }

    result += '}\n'
    classes.set(className, result)
    return className
  }

  generateClass(parsedJson.value, options.value.rootClassName)

  return Array.from(classes.values()).join('\n')
}

// 生成 Go Model
const generateGoModel = () => {
  const classes = new Map()

  const generateClass = (obj, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = `package models\n\n`
    result += `import "time"\n\n`
    result += `type ${className} struct {\n`

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toPascalCase(key)
      let fieldType = inferType(value, 'go')

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const subClassName = toPascalCase(key)
        generateClass(value, subClassName)
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const itemClassName = toPascalCase(key)
        generateClass(value[0], itemClassName)
        fieldType = `[]${itemClassName}`
      } else if (Array.isArray(value)) {
        const itemType = value.length > 0 ? inferType(value[0], 'go') : 'interface{}'
        fieldType = `[]${itemType}`
      }

      const jsonTag = key === fieldName ? `json:"${key}"` : `json:"${key}" bson:"${fieldName}"`
      result += `    ${fieldName} ${fieldType} \` ${jsonTag} \`\n`
    }

    result += '}\n'
    classes.set(className, result)
    return className
  }

  generateClass(parsedJson.value, options.value.rootClassName)

  return Array.from(classes.values()).join('\n')
}

// 生成 Kotlin Model
const generateKotlinModel = () => {
  const classes = new Map()

  const generateClass = (obj, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = `import com.fasterxml.jackson.annotation.JsonProperty\n\n`

    if (options.value.generateImmutable) {
      result += `data class ${className}(\n`
      const fields = []

      for (const [key, value] of Object.entries(obj)) {
        const fieldName = toCamelCase(key)
        let fieldType = inferType(value, 'kotlin')

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const subClassName = toPascalCase(key)
          generateClass(value, subClassName)
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          const itemClassName = toPascalCase(key)
          generateClass(value[0], itemClassName)
          fieldType = `List<${itemClassName}>`
        } else if (Array.isArray(value)) {
          const itemType = value.length > 0 ? inferType(value[0], 'kotlin') : 'Any'
          fieldType = `List<${itemType}>`
        }

        if (options.value.useOptionalTypes && (value === null || value === undefined)) {
          fieldType += '?'
        }

        const annotation = key !== fieldName ? `@JsonProperty("${key}") ` : ''
        fields.push(`    ${annotation}val ${fieldName}: ${fieldType}`)
      }

      result += fields.join(',\n') + '\n)\n'
    } else {
      result += `class ${className} {\n`

      for (const [key, value] of Object.entries(obj)) {
        const fieldName = toCamelCase(key)
        const fieldNameUpper = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        let fieldType = inferType(value, 'kotlin')

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const subClassName = toPascalCase(key)
          generateClass(value, subClassName)
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          const itemClassName = toPascalCase(key)
          generateClass(value[0], itemClassName)
          fieldType = `List<${itemClassName}>`
        } else if (Array.isArray(value)) {
          const itemType = value.length > 0 ? inferType(value[0], 'kotlin') : 'Any'
          fieldType = `List<${itemType}>`
        }

        if (options.value.generateAnnotations && key !== fieldName) {
          result += `    @JsonProperty("${key}")\n`
        }

        if (options.value.useOptionalTypes && (value === null || value === undefined)) {
          fieldType += '?'
        }

        result += `    lateinit var ${fieldName}: ${fieldType}\n\n`
      }

      result += '}\n'
    }

    classes.set(className, result)
    return className
  }

  generateClass(parsedJson.value, options.value.rootClassName)

  return Array.from(classes.values()).join('\n')
}

// 加载示例
const loadExample = () => {
  jsonInput.value = JSON.stringify(exampleJson, null, 2)
  parseJson()
}

// 清空 JSON
const clearJson = () => {
  jsonInput.value = ''
  parsedJson.value = null
}

// 格式化 JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonInput.value)
    jsonInput.value = JSON.stringify(parsed, null, 2)
  } catch (error) {
    console.error('JSON 格式错误', error)
  }
}

// 解析 JSON
const parseJson = () => {
  // 如果输入为空，直接设置为 null
  if (!jsonInput.value.trim()) {
    parsedJson.value = null
    return
  }
  
  try {
    parsedJson.value = JSON.parse(jsonInput.value)
  } catch (error) {
    parsedJson.value = null
    console.error('JSON 解析错误', error)
  }
}

// 复制 Model
const copyModel = async () => {
  try {
    await navigator.clipboard.writeText(generatedModel.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// 下载 Model
const downloadModel = () => {
  const content = generatedModel.value
  const filename = `${options.value.rootClassName}.${getFileExtension()}`
  const mimeType = 'text/plain'

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 获取文件扩展名
const getFileExtension = () => {
  switch (selectedLanguage.value) {
    case 'typescript': return 'ts'
    case 'java': return 'java'
    case 'python': return 'py'
    case 'csharp': return 'cs'
    case 'go': return 'go'
    case 'kotlin': return 'kt'
    default: return 'txt'
  }
}

// 监听 JSON 输入变化
watch(jsonInput, () => {
  parseJson()
}, { immediate: true })

// SEO配置
useSeoMeta({
  title: 'JSON 转 Model 类 - 在线代码生成工具',
  description: '免费的在线 JSON 转 Model 类工具，支持将 JSON 数据自动转换为 TypeScript、Java、Python、C#、Go、Kotlin 等多种编程语言的模型类。',
  keywords: ['json', 'model', '代码生成', 'typescript', 'java', 'python', 'csharp', 'go', 'kotlin', '数据结构']
})


</script>