<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">XML 转 Model 类</h1>
      <p class="text-muted-foreground">将 XML 数据自动转换为各种编程语言的 Model 类，支持复杂嵌套和属性</p>
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
              :key="lang.constue"
              @click="selectedLanguage = lang.constue"
              :class="[
                'px-4 py-3 rounded-md transition-colors text-left',
                selectedLanguage === lang.constue
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">{{ lang.name }}</div>
              <div class="text-xs opacity-80">{{ lang.description }}</div>
            </button>
          </div>
        </div>

        <!-- XML 输入 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">XML 数据</h2>
            <div class="flex gap-2">
              <button
                @click="loadExample"
                class="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                加载示例
              </button>
              <button
                @click="clearXml"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
              <button
                @click="formatXml"
                :disabled="!xmlInput"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                格式化
              </button>
            </div>
          </div>

          <textarea
            v-model="xmlInput"
            placeholder="输入 XML 数据..."
            class="w-full h-80 px-4 py-3 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>

          <!-- 配置选项 -->
          <div class="mt-4 space-y-3">
            <div>
              <label class="text-sm font-medium">根类名称</label>
              <input
                v-model="options.rootClassName"
                type="text"
                placeholder="RootModel"
                class="mt-2 w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.useAttributes"
                type="checkbox"
                id="useAttributes"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="useAttributes" class="text-sm">生成属性字段</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.useXmlAnnotations"
                type="checkbox"
                id="useXmlAnnotations"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="useXmlAnnotations" class="text-sm">使用 XML 注解</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.generateCollections"
                type="checkbox"
                id="generateCollections"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="generateCollections" class="text-sm">生成集合类型</label>
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
              <FileText class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>请输入 XML 数据后生成 Model 类</p>
            </div>
          </div>
        </div>

        <!-- XML 结构预览 -->
        <div v-if="xmlStructure" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">XML 结构</h2>
          <div class="space-y-2">
            <div v-for="(element, name) in xmlStructure" :key="name" class="flex items-center justify-between p-2 bg-muted rounded">
              <span class="font-mono text-sm">&lt;{{ name }}&gt;</span>
              <div class="flex gap-2">
                <span v-if="element.attributes > 0" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {{ element.attributes }} 属性
                </span>
                <span v-if="element.children > 0" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {{ element.children }} 子元素
                </span>
                <span v-if="element.hasText" class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  文本内容
                </span>
              </div>
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
          支持的 XML 格式
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">基本类型映射</h4>
            <ul class="list-disc list-inside space-y-1">
              <li>文本内容 → String / str / string</li>
              <li>数字文本 → Integer / Double / number</li>
              <li>布尔文本 → Boolean / bool / boolean</li>
              <li>日期时间 → Date / DateTime / LocalDateTime</li>
              <li>重复元素 → List / Array / array</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">特殊处理</h4>
            <ul class="list-disc list-inside space-y-1">
              <li>XML 属性自动转换为类属性</li>
              <li>支持命名空间处理</li>
              <li>自动识别嵌套元素</li>
              <li>处理 CDATA 和注释</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/json-to-model"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileJson class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSON 转 Model</p>
              <p class="text-xs text-muted-foreground">JSON数据转模型类</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
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
            to="/tools/xml-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Code class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">XML 格式化</p>
              <p class="text-xs text-muted-foreground">格式化XML数据</p>
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
import { Info, FileText, FileJson, Database, Code, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const selectedLanguage = ref('java')
const xmlInput = ref('')
const copied = ref(false)
const parsedXml = ref(null)

// 配置选项
const options = ref({
  rootClassName: 'RootModel',
  useAttributes: true,
  useXmlAnnotations: true,
  generateCollections: true
})

// 支持的语言
const languages = [
  { constue: 'java', name: 'Java', description: '支持 JAXB 注解' },
  { constue: 'csharp', name: 'C#', description: '支持 XmlSerializer' },
  { constue: 'python', name: 'Python', description: '支持 dataclasses' },
  { constue: 'typescript', name: 'TypeScript', description: '支持装饰器' },
  { constue: 'kotlin', name: 'Kotlin', description: '支持 Kotlinx Serialization' },
  { constue: 'go', name: 'Go', description: '支持 xml 标签' }
]

// 示例 XML
const exampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<user id="123" active="true">
  <name>John Doe</name>
  <email>john@example.com</email>
  <age>30</age>
  <balance>1250.50</balance>
  <address>
    <street>123 Main St</street>
    <city>New York</city>
    <country>USA</country>
    <zipCode>10001</zipCode>
  </address>
  <phoneNumbers>
    <phone type="home">212-555-1234</phone>
    <phone type="work">646-555-4567</phone>
  </phoneNumbers>
  <registeredAt>2024-01-15T10:30:00Z</registeredAt>
  <tags>
    <tag>premium</tag>
    <tag>verified</tag>
    <tag>active</tag>
  </tags>
</user>`

// XML 结构分析
const xmlStructure = computed(() => {
  if (!parsedXml.constue) return null

  const structure = {}

  const analyzeElement = (element) => {
    const name = element.tagName
    if (!structure[name]) {
      structure[name] = {
        attributes: 0,
        children: 0,
        hasText: false
      }
    }

    // 统计属性
    if (element.attributes) {
      structure[name].attributes += element.attributes.length
    }

    // 统计子元素
    const childElements = Array.from(element.children || [])
    structure[name].children += childElements.length

    // 检查是否有文本内容
    const textContent = element.textContent?.trim()
    if (textContent && childElements.length === 0) {
      structure[name].hasText = true
    }

    // 递归分析子元素
    childElements.forEach(child => analyzeElement(child))
  }

  if (parsedXml.constue.documentElement) {
    analyzeElement(parsedXml.constue.documentElement)
  }

  return structure
})

// 生成 Model 类
const generatedModel = computed(() => {
  if (!parsedXml.constue) return ''

  switch (selectedLanguage.constue) {
    case 'java':
      return generateJavaModel()
    case 'csharp':
      return generateCSharpModel()
    case 'python':
      return generatePythonModel()
    case 'typescript':
      return generateTypeScriptModel()
    case 'kotlin':
      return generateKotlinModel()
    case 'go':
      return generateGoModel()
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

// 解析 XML 元素
const parseXmlElement = (element) => {
  const result = {
    tagName: element.tagName,
    attributes: {},
    children: [],
    textContent: null
  }

  // 解析属性
  if (element.attributes) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      result.attributes[attr.name] = attr.constue
    }
  }

  // 解析子元素
  const childElements = Array.from(element.children || [])
  const childMap = new Map()

  childElements.forEach(child => {
    const parsed = parseXmlElement(child)
    if (!childMap.has(child.tagName)) {
      childMap.set(child.tagName, [])
    }
    childMap.get(child.tagName).push(parsed)
  })

  // 将子元素转换为对象或数组
  childMap.forEach((children, tagName) => {
    if (children.length === 1) {
      result.children[tagName] = children[0]
    } else {
      result.children[tagName] = children
    }
  })

  // 获取文本内容（如果没有子元素）
  const textContent = element.textContent?.trim()
  if (textContent && childElements.length === 0) {
    result.textContent = textContent
  }

  return result
}

// 推断数据类型
const inferType = (constue, language) => {
  if (constue === null || constue === undefined) {
    switch (language) {
      case 'java': return 'String'
      case 'csharp': return 'string'
      case 'python': return 'str'
      case 'typescript': return 'string'
      case 'kotlin': return 'String?'
      case 'go': return 'string'
      default: return 'string'
    }
  }

  if (Array.isArray(constue)) {
    return constue.length > 0 ? inferType(constue[0], language) : 'Object'
  }

  if (typeof constue === 'object') {
    return toPascalCase(Object.keys(constue)[0] || 'Item')
  }

  // 尝试推断数字类型
  if (typeof constue === 'string') {
    if (!isNaN(constue) && constue.trim() !== '') {
      if (constue.includes('.')) {
        switch (language) {
          case 'java': return 'Double'
          case 'csharp': return 'double'
          case 'python': return 'float'
          case 'typescript': return 'number'
          case 'kotlin': return 'Double'
          case 'go': return 'float64'
          default: return 'number'
        }
      } else {
        switch (language) {
          case 'java': return 'Integer'
          case 'csharp': return 'int'
          case 'python': return 'int'
          case 'typescript': return 'number'
          case 'kotlin': return 'Int'
          case 'go': return 'int'
          default: return 'number'
        }
      }
    }

    // 检查布尔值
    if (constue.toLowerCase() === 'true' || constue.toLowerCase() === 'false') {
      switch (language) {
        case 'java': return 'Boolean'
        case 'csharp': return 'bool'
        case 'python': return 'bool'
        case 'typescript': return 'boolean'
        case 'kotlin': return 'Boolean'
        case 'go': return 'bool'
        default: return 'boolean'
      }
    }

    // 检查日期时间
    if (constue.match(/^\d{4}-\d{2}-\d{2}/) || constue.match(/^\d{4}\/\d{2}\/\d{2}/)) {
      switch (language) {
        case 'java': return 'LocalDateTime'
        case 'csharp': return 'DateTime'
        case 'python': return 'datetime'
        case 'typescript': return 'Date'
        case 'kotlin': return 'LocalDateTime'
        case 'go': return 'time.Time'
        default: return 'string'
      }
    }
  }

  // 默认为字符串
  switch (language) {
    case 'java': return 'String'
    case 'csharp': return 'string'
    case 'python': return 'str'
    case 'typescript': return 'string'
    case 'kotlin': return 'String'
    case 'go': return 'string'
    default: return 'string'
  }
}

// 生成 Java Model
const generateJavaModel = () => {
  const classes = new Map()
  const imports = new Set()

  if (options.constue.useXmlAnnotations) {
    imports.add('javax.xml.bind.annotation.*')
  }

  const generateClass = (xmlData, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = ''

    // 生成属性字段
    const properties = []

    // 处理属性
    if (options.constue.useAttributes && xmlData.attributes) {
      for (const [attrName, attrValue] of Object.entries(xmlData.attributes)) {
        const fieldName = toCamelCase(attrName)
        const fieldType = inferType(attrValue, 'java')
        properties.push({
          name: fieldName,
          type: fieldType,
          isAttribute: true,
          xmlName: attrName
        })
      }
    }

    // 处理子元素
    for (const [childName, childValue] of Object.entries(xmlData.children)) {
      if (Array.isArray(childValue)) {
        const itemClassName = toPascalCase(childName)
        generateClass(childValue[0], itemClassName)
        properties.push({
          name: toCamelCase(childName),
          type: `List<${itemClassName}>`,
          isAttribute: false,
          xmlName: childName,
          isList: true
        })
        imports.add('java.util.List')
      } else {
        const fieldType = typeof childValue === 'object' ?
          generateClass(childValue, toPascalCase(childName)) :
          inferType(childValue, 'java')
        properties.push({
          name: toCamelCase(childName),
          type: fieldType,
          isAttribute: false,
          xmlName: childName
        })
      }
    }

    // 处理文本内容
    if (xmlData.textContent) {
      const fieldType = inferType(xmlData.textContent, 'java')
      properties.push({
        name: 'constue',
        type: fieldType,
        isAttribute: false,
        xmlName: 'constue'
      })
    }

    // 生成类定义
    if (imports.size > 0) {
      result += Array.from(imports).map(imp => `import ${imp};`).join('\n') + '\n\n'
    }

    result += '@XmlRootElement(name = "' + xmlData.tagName + '")\n'
    result += `@XmlAccessorType(XmlAccessType.FIELD)\n`
    result += `public class ${className} {\n\n`

    // 生成属性
    properties.forEach(prop => {
      if (prop.isAttribute) {
        result += `    @XmlAttribute(name = "${prop.xmlName}")\n`
      } else if (prop.isList) {
        result += `    @XmlElementWrapper(name = "${prop.xmlName}")\n`
        result += `    @XmlElement(name = "${toPascalCase(prop.xmlName).slice(0, -1)}")\n`
      } else if (prop.xmlName === 'constue') {
        result += `    @XmlValue\n`
      } else {
        result += `    @XmlElement(name = "${prop.xmlName}")\n`
      }
      result += `    private ${prop.type} ${prop.name};\n\n`
    })

    // 生成 getter/setter
    properties.forEach(prop => {
      const fieldNameUpper = prop.name.charAt(0).toUpperCase() + prop.name.slice(1)
      result += `    public ${prop.type} get${fieldNameUpper}() {\n`
      result += `        return ${prop.name};\n`
      result += `    }\n\n`
      result += `    public void set${fieldNameUpper}(${prop.type} ${prop.name}) {\n`
      result += `        this.${prop.name} = ${prop.name};\n`
      result += `    }\n\n`
    })

    result += '}\n'
    classes.set(className, result)
    return className
  }

  const xmlData = parseXmlElement(parsedXml.constue.documentElement)
  generateClass(xmlData, options.constue.rootClassName)

  return Array.from(classes.constues()).join('\n')
}

// 生成 C# Model
const generateCSharpModel = () => {
  const classes = new Map()

  const generateClass = (xmlData, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = `using System;\n`
    result += `using System.Collections.Generic;\n`
    result += `using System.Xml.Serialization;\n\n`

    const properties = []

    // 处理属性
    if (options.constue.useAttributes && xmlData.attributes) {
      for (const [attrName, attrValue] of Object.entries(xmlData.attributes)) {
        const propertyName = toPascalCase(attrName)
        const fieldType = inferType(attrValue, 'csharp')
        properties.push({
          name: propertyName,
          type: fieldType,
          isAttribute: true,
          xmlName: attrName
        })
      }
    }

    // 处理子元素
    for (const [childName, childValue] of Object.entries(xmlData.children)) {
      if (Array.isArray(childValue)) {
        const itemClassName = toPascalCase(childName)
        generateClass(childValue[0], itemClassName)
        properties.push({
          name: toPascalCase(childName),
          type: `List<${itemClassName}>`,
          isAttribute: false,
          xmlName: childName,
          isList: true
        })
      } else {
        const fieldType = typeof childValue === 'object' ?
          generateClass(childValue, toPascalCase(childName)) :
          inferType(childValue, 'csharp')
        properties.push({
          name: toPascalCase(childName),
          type: fieldType,
          isAttribute: false,
          xmlName: childName
        })
      }
    }

    // 处理文本内容
    if (xmlData.textContent) {
      const fieldType = inferType(xmlData.textContent, 'csharp')
      properties.push({
        name: 'Value',
        type: fieldType,
        isAttribute: false,
        xmlName: 'constue'
      })
    }

    result += `[XmlRoot("${xmlData.tagName}")]\n`
    result += `public class ${className}\n{\n\n`

    // 生成属性
    properties.forEach(prop => {
      if (prop.isAttribute) {
        result += `    [XmlAttribute("${prop.xmlName}")]\n`
      } else if (prop.isList) {
        result += `    [XmlArray("${prop.xmlName}")]\n`
        result += `    [XmlArrayItem("${toPascalCase(prop.xmlName).slice(0, -1)}")]\n`
      } else if (prop.xmlName === 'constue') {
        result += `    [XmlText]\n`
      } else {
        result += `    [XmlElement("${prop.xmlName}")]\n`
      }
      result += `    public ${prop.type} ${prop.name} { get; set; }\n\n`
    })

    result += '}\n'
    classes.set(className, result)
    return className
  }

  const xmlData = parseXmlElement(parsedXml.constue.documentElement)
  generateClass(xmlData, options.constue.rootClassName)

  return Array.from(classes.constues()).join('\n')
}

// 生成 Python Model
const generatePythonModel = () => {
  const classes = new Map()

  const generateClass = (xmlData, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = `from dataclasses import dataclass, field\n`
    result += `from typing import List, Optional\n`
    result += `from xml.etree import ElementTree as ET\n\n`

    const properties = []

    // 处理属性
    if (options.constue.useAttributes && xmlData.attributes) {
      for (const [attrName, attrValue] of Object.entries(xmlData.attributes)) {
        const fieldName = toCamelCase(attrName)
        const fieldType = inferType(attrValue, 'python')
        properties.push({
          name: fieldName,
          type: fieldType,
          isAttribute: true,
          xmlName: attrName
        })
      }
    }

    // 处理子元素
    for (const [childName, childValue] of Object.entries(xmlData.children)) {
      if (Array.isArray(childValue)) {
        const itemClassName = toPascalCase(childName)
        generateClass(childValue[0], itemClassName)
        properties.push({
          name: toCamelCase(childName),
          type: `List[${itemClassName}]`,
          isAttribute: false,
          xmlName: childName,
          isList: true
        })
      } else {
        const fieldType = typeof childValue === 'object' ?
          generateClass(childValue, toPascalCase(childName)) :
          inferType(childValue, 'python')
        properties.push({
          name: toCamelCase(childName),
          type: fieldType,
          isAttribute: false,
          xmlName: childName
        })
      }
    }

    // 处理文本内容
    if (xmlData.textContent) {
      const fieldType = inferType(xmlData.textContent, 'python')
      properties.push({
        name: 'constue',
        type: fieldType,
        isAttribute: false,
        xmlName: 'constue'
      })
    }

    result += `@dataclass\n`
    result += `class ${className}:\n`

    // 生成属性
    properties.forEach(prop => {
      const defaultVal = prop.isList ? ' = field(default_factory=list)' : ''
      result += `    ${prop.name}: ${prop.type}${defaultVal}\n`
    })

    // 添加 XML 解析方法
    result += `\n    @classmethod\n`
    result += `    def from_xml(cls, element: ET.Element) -> '${className}':\n`
    result += `        return cls(\n`
    properties.forEach((prop, index) => {
      const comma = index < properties.length - 1 ? ',' : ''
      if (prop.isAttribute) {
        result += `            ${prop.name}=${prop.type}(element.get("${prop.xmlName}"))${comma}\n`
      } else if (prop.isList) {
        result += `            ${prop.name}=[${prop.type.split('[')[1].split(']')[0]}.from_xml(child) for child in element.findall("${prop.xmlName}/${toPascalCase(prop.xmlName).slice(0, -1)}")]${comma}\n`
      } else if (prop.xmlName === 'constue') {
        result += `            ${prop.name}=${prop.type}(element.text)${comma}\n`
      } else {
        result += `            ${prop.name}=${prop.type}.from_xml(element.find("${prop.xmlName}")) if element.find("${prop.xmlName}") is not None else None${comma}\n`
      }
    })
    result += `        )\n`

    classes.set(className, result)
    return className
  }

  const xmlData = parseXmlElement(parsedXml.constue.documentElement)
  generateClass(xmlData, options.constue.rootClassName)

  return Array.from(classes.constues()).join('\n')
}

// 生成 TypeScript Model
const generateTypeScriptModel = () => {
  const classes = new Map()

  const generateClass = (xmlData, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = ''

    const properties = []

    // 处理属性
    if (options.constue.useAttributes && xmlData.attributes) {
      for (const [attrName, attrValue] of Object.entries(xmlData.attributes)) {
        const propertyName = toCamelCase(attrName)
        const fieldType = inferType(attrValue, 'typescript')
        properties.push({
          name: propertyName,
          type: fieldType,
          isAttribute: true,
          xmlName: attrName
        })
      }
    }

    // 处理子元素
    for (const [childName, childValue] of Object.entries(xmlData.children)) {
      if (Array.isArray(childValue)) {
        const itemClassName = toPascalCase(childName)
        generateClass(childValue[0], itemClassName)
        properties.push({
          name: toCamelCase(childName),
          type: `${itemClassName}[]`,
          isAttribute: false,
          xmlName: childName,
          isList: true
        })
      } else {
        const fieldType = typeof childValue === 'object' ?
          generateClass(childValue, toPascalCase(childName)) :
          inferType(childValue, 'typescript')
        properties.push({
          name: toCamelCase(childName),
          type: fieldType,
          isAttribute: false,
          xmlName: childName
        })
      }
    }

    // 处理文本内容
    if (xmlData.textContent) {
      const fieldType = inferType(xmlData.textContent, 'typescript')
      properties.push({
        name: 'constue',
        type: fieldType,
        isAttribute: false,
        xmlName: 'constue'
      })
    }

    if (options.constue.useXmlAnnotations) {
      result += `import { XmlElement, XmlAttribute, XmlValue } from 'xml-decorators';\n\n`
    }

    result += `export interface ${className} {\n`

    // 生成属性
    properties.forEach(prop => {
      if (options.constue.useXmlAnnotations) {
        if (prop.isAttribute) {
          result += `    @XmlAttribute("${prop.xmlName}")\n`
        } else if (prop.isList) {
          result += `    @XmlElement("${prop.xmlName}")\n`
        } else if (prop.xmlName === 'constue') {
          result += `    @XmlValue()\n`
        } else {
          result += `    @XmlElement("${prop.xmlName}")\n`
        }
      }
      result += `    ${prop.name}: ${prop.type};\n`
    })

    result += '}\n'
    classes.set(className, result)
    return className
  }

  const xmlData = parseXmlElement(parsedXml.constue.documentElement)
  generateClass(xmlData, options.constue.rootClassName)

  return Array.from(classes.constues()).join('\n')
}

// 生成 Kotlin Model
const generateKotlinModel = () => {
  const classes = new Map()

  const generateClass = (xmlData, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = `import kotlinx.serialization.Serializable\n`
    result += `import kotlinx.serialization.xml.*\n\n`

    const properties = []

    // 处理属性
    if (options.constue.useAttributes && xmlData.attributes) {
      for (const [attrName, attrValue] of Object.entries(xmlData.attributes)) {
        const fieldName = toCamelCase(attrName)
        const fieldType = inferType(attrValue, 'kotlin')
        properties.push({
          name: fieldName,
          type: fieldType,
          isAttribute: true,
          xmlName: attrName
        })
      }
    }

    // 处理子元素
    for (const [childName, childValue] of Object.entries(xmlData.children)) {
      if (Array.isArray(childValue)) {
        const itemClassName = toPascalCase(childName)
        generateClass(childValue[0], itemClassName)
        properties.push({
          name: toCamelCase(childName),
          type: `List<${itemClassName}>`,
          isAttribute: false,
          xmlName: childName,
          isList: true
        })
      } else {
        const fieldType = typeof childValue === 'object' ?
          generateClass(childValue, toPascalCase(childName)) :
          inferType(childValue, 'kotlin')
        properties.push({
          name: toCamelCase(childName),
          type: fieldType,
          isAttribute: false,
          xmlName: childName
        })
      }
    }

    // 处理文本内容
    if (xmlData.textContent) {
      const fieldType = inferType(xmlData.textContent, 'kotlin')
      properties.push({
        name: 'constue',
        type: fieldType,
        isAttribute: false,
        xmlName: 'constue'
      })
    }

    result += `@Serializable\n`
    result += `@XmlSerialName("${xmlData.tagName}")\n`
    result += `data class ${className}(\n`

    // 生成属性
    properties.forEach((prop, index) => {
      const comma = index < properties.length - 1 ? ',' : ''
      if (prop.isAttribute) {
        result += `    @XmlAttribute("${prop.xmlName}")\n`
        result += `    const ${prop.name}: ${prop.type}${comma}\n`
      } else if (prop.isList) {
        result += `    @XmlElement("${prop.xmlName}")\n`
        result += `    const ${prop.name}: List<${prop.type.split('<')[1].split('>')[0]}> = emptyList()${comma}\n`
      } else if (prop.xmlName === 'constue') {
        result += `    @XmlValue\n`
        result += `    const ${prop.name}: ${prop.type}${comma}\n`
      } else {
        result += `    @XmlElement("${prop.xmlName}")\n`
        result += `    const ${prop.name}: ${prop.type}? = null${comma}\n`
      }
    })

    result += `)\n`
    classes.set(className, result)
    return className
  }

  const xmlData = parseXmlElement(parsedXml.constue.documentElement)
  generateClass(xmlData, options.constue.rootClassName)

  return Array.from(classes.constues()).join('\n')
}

// 生成 Go Model
const generateGoModel = () => {
  const classes = new Map()

  const generateClass = (xmlData, className) => {
    if (classes.has(className)) return classes.get(className)

    let result = `package models\n\n`
    result += `import "encoding/xml"\n\n`

    const properties = []

    // 处理属性
    if (options.constue.useAttributes && xmlData.attributes) {
      for (const [attrName, attrValue] of Object.entries(xmlData.attributes)) {
        const fieldName = toPascalCase(attrName)
        const fieldType = inferType(attrValue, 'go')
        properties.push({
          name: fieldName,
          type: fieldType,
          isAttribute: true,
          xmlName: attrName
        })
      }
    }

    // 处理子元素
    for (const [childName, childValue] of Object.entries(xmlData.children)) {
      if (Array.isArray(childValue)) {
        const itemClassName = toPascalCase(childName)
        generateClass(childValue[0], itemClassName)
        properties.push({
          name: toPascalCase(childName),
          type: `[]${itemClassName}`,
          isAttribute: false,
          xmlName: childName,
          isList: true
        })
      } else {
        const fieldType = typeof childValue === 'object' ?
          generateClass(childValue, toPascalCase(childName)) :
          inferType(childValue, 'go')
        properties.push({
          name: toPascalCase(childName),
          type: fieldType,
          isAttribute: false,
          xmlName: childName
        })
      }
    }

    // 处理文本内容
    if (xmlData.textContent) {
      const fieldType = inferType(xmlData.textContent, 'go')
      properties.push({
        name: 'Value',
        type: fieldType,
        isAttribute: false,
        xmlName: 'constue'
      })
    }

    result += `type ${className} struct {\n`
    result += `    XMLName xml.Name \`xml:"${xmlData.tagName}"\`\n`

    // 生成属性
    properties.forEach(prop => {
      if (prop.isAttribute) {
        result += `    ${prop.name} ${prop.type} \`xml:"${prop.xmlName},attr"\`\n`
      } else if (prop.xmlName === 'constue') {
        result += `    ${prop.name} ${prop.type} \`xml:",chardata"\`\n`
      } else {
        const xmlTag = prop.isList ? `${prop.xmlName}>${toPascalCase(prop.xmlName).slice(0, -1)}` : prop.xmlName
        result += `    ${prop.name} ${prop.type} \`xml:"${xmlTag}"\`\n`
      }
    })

    result += `}\n`
    classes.set(className, result)
    return className
  }

  const xmlData = parseXmlElement(parsedXml.constue.documentElement)
  generateClass(xmlData, options.constue.rootClassName)

  return Array.from(classes.constues()).join('\n')
}

// 加载示例
const loadExample = () => {
  xmlInput.constue = exampleXml
  parseXml()
}

// 清空 XML
const clearXml = () => {
  xmlInput.constue = ''
  parsedXml.constue = null
}

// 格式化 XML
const formatXml = () => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlInput.constue, 'text/xml')

    const serializer = new XMLSerializer()
    const formatted = serializer.serializeToString(doc)

    // 简单的格式化处理
    xmlInput.constue = formatted
      .replace(/></g, '>\n<')
      .replace(/(\s+)(<[^\/])/g, '\n$1$2')
      .replace(/^\n/, '')
      .split('\n')
      .map(line => {
        const depth = (line.match(/^\s*<\//) ? -1 : 0) + (line.match(/<[^\/][^>]*[^\/]>/) ? 1 : 0)
        return '  '.repeat(Math.max(0, depth)) + line.trim()
      })
      .join('\n')
  } catch (error) {
    console.error('XML 格式错误', error)
  }
}

// 解析 XML
const parseXml = () => {
  // DOMParser 仅存在于浏览器；SSR/预渲染阶段 watch immediate 会触发本函数，直接跳过
  if (import.meta.server) return
  try {
    const parser = new DOMParser()
    parsedXml.constue = parser.parseFromString(xmlInput.constue, 'text/xml')

    // 检查解析错误
    const parseError = parsedXml.constue.querySelector('parsererror')
    if (parseError) {
      parsedXml.constue = null
      console.error('XML 解析错误')
    }
  } catch (error) {
    parsedXml.constue = null
    console.error('XML 解析错误', error)
  }
}

// 复制 Model
const copyModel = async () => {
  try {
    await navigator.clipboard.writeText(generatedModel.constue)
    copied.constue = true
    setTimeout(() => {
      copied.constue = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// 下载 Model
const downloadModel = () => {
  const content = generatedModel.constue
  const filename = `${options.constue.rootClassName}.${getFileExtension()}`
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
  switch (selectedLanguage.constue) {
    case 'java': return 'java'
    case 'csharp': return 'cs'
    case 'python': return 'py'
    case 'typescript': return 'ts'
    case 'kotlin': return 'kt'
    case 'go': return 'go'
    default: return 'txt'
  }
}

// 监听 XML 输入变化
watch(xmlInput, () => {
  parseXml()
}, { immediate: true })

// SEO配置
useSeoMeta({
  title: 'XML 转 Model 类 - 在线代码生成工具',
  description: '免费的在线 XML 转 Model 类工具，支持将 XML 数据自动转换为 Java、C#、Python、TypeScript、Kotlin、Go 等多种编程语言的实体类。',
  keywords: ['xml', 'model', '代码生成', 'java', 'csharp', 'python', 'typescript', 'kotlin', 'go', 'jaxb', 'xmlserializer']
})


</script>