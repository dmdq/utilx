<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">XPath 测试器</h1>
      <p class="text-muted-foreground">使用 XPath 表达式查询和提取 XML 数据</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- XML 输入区 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- XML 输入 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">XML 数据</h2>
            <div class="flex gap-2">
              <button
                @click="loadSample"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                加载示例
              </button>
              <button
                @click="formatXML"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                格式化
              </button>
              <button
                @click="clearXML"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <div class="relative">
            <textarea
              v-model="xmlInput"
              @input="validateXML"
              placeholder="请输入 XML 数据..."
              class="w-full h-96 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              :class="{ 'border-red-500': xmlError }"
            ></textarea>

            <!-- 字符统计 -->
            <div class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded">
              {{ xmlInput.length }} 字符
            </div>
          </div>

          <!-- XML 错误提示 -->
          <div v-if="xmlError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {{ xmlError }}
          </div>
        </div>

        <!-- XPath 查询区 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">XPath 查询</h2>
            <div class="flex gap-2">
              <button
                @click="clearQuery"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <!-- XPath 输入 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">XPath 表达式</label>
            <div class="relative">
              <input
                v-model="xpath"
                @keyup.enter="executeQuery"
                placeholder="例如: //book/title"
                class="w-full p-3 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <button
                v-if="xpath"
                @click="xpath = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- 查询选项 -->
          <div class="space-y-3">
            <label class="text-sm font-medium">查询选项</label>
            <div class="flex flex-wrap gap-3">
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="queryType"
                  value="single"
                  class="mr-2"
                />
                <span class="text-sm">返回单个结果</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="queryType"
                  value="multiple"
                  class="mr-2"
                />
                <span class="text-sm">返回所有结果</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="queryType"
                  value="count"
                  class="mr-2"
                />
                <span class="text-sm">只返回数量</span>
              </label>
            </div>
          </div>

          <!-- 快捷示例 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">快捷示例</label>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="example in xpathExamples"
                :key="example.xpath"
                @click="applyExample(example)"
                class="p-2 text-sm bg-muted hover:bg-muted/80 rounded text-left transition-colors"
              >
                <div class="font-mono text-primary">{{ example.xpath }}</div>
                <div class="text-xs text-muted-foreground">{{ example.description }}</div>
              </button>
            </div>
          </div>

          <!-- 执行按钮 -->
          <button
            @click="executeQuery"
            :disabled="!xmlDoc || !xpath"
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            执行查询
          </button>

          <!-- 查询结果 -->
          <div v-if="queryResult !== null" class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">查询结果</label>
              <div class="flex gap-2">
                <button
                  @click="copyResult"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {{ copied ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <div class="border rounded-lg overflow-hidden">
              <!-- 结果统计 -->
              <div class="px-3 py-2 bg-muted border-b flex items-center gap-2">
                <span class="text-sm font-medium">
                  {{ queryType === 'count' ? '匹配数量' : `找到 ${resultCount} 个结果` }}
                </span>
              </div>

              <!-- 结果内容 -->
              <div class="max-h-64 overflow-auto p-4">
                <pre v-if="queryResult" class="text-sm whitespace-pre-wrap">{{ formatQueryResult() }}</pre>
                <div v-else class="text-sm text-muted-foreground">没有找到匹配的结果</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- XPath 语法说明 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">XPath 语法说明</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-3">节点选择</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">表达式</th>
                  <th class="text-left py-2">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">nodename</td>
                  <td class="py-2">选择所有 nodename 子节点</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">/</td>
                  <td class="py-2">从根节点选择</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">//</td>
                  <td class="py-2">从当前节点选择匹配的节点</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">.</td>
                  <td class="py-2">选择当前节点</td>
                </tr>
                <tr>
                  <td class="py-2 font-mono text-primary">..</td>
                  <td class="py-2">选择当前节点的父节点</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 class="font-medium mb-3">谓语（Predicates）</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">表达式</th>
                  <th class="text-left py-2">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">[1]</td>
                  <td class="py-2">第一个节点</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">[last()]</td>
                  <td class="py-2">最后一个节点</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">[@attr]</td>
                  <td class="py-2">包含 attr 属性的节点</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">[@attr='value']</td>
                  <td class="py-2">attr 属性等于 value 的节点</td>
                </tr>
                <tr>
                  <td class="py-2 font-mono text-primary">[text()='value']</td>
                  <td class="py-2">文本内容等于 value 的节点</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 通配符和操作符 -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-3">通配符</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">表达式</th>
                  <th class="text-left py-2">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">*</td>
                  <td class="py-2">匹配任何元素节点</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">@*</td>
                  <td class="py-2">匹配任何属性节点</td>
                </tr>
                <tr>
                  <td class="py-2 font-mono text-primary">node()</td>
                  <td class="py-2">匹配任何类型的节点</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 class="font-medium mb-3">常用函数</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">函数</th>
                  <th class="text-left py-2">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">text()</td>
                  <td class="py-2">获取节点的文本内容</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">count()</td>
                  <td class="py-2">统计节点数量</td>
                </tr>
                <tr>
                  <td class="py-2 font-mono text-primary">contains()</td>
                  <td class="py-2">检查是否包含指定字符串</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 示例 -->
        <div class="mt-6">
          <h3 class="font-medium mb-3">常用示例</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium mb-2">基础查询</h4>
              <ul class="space-y-1 text-sm">
                <li><code class="bg-muted px-1 rounded">/bookstore/book</code> - bookstore 下的所有 book</li>
                <li><code class="bg-muted px-1 rounded">//book</code> - 所有 book 节点</li>
                <li><code class="bg-muted px-1 rounded">//@lang</code> - 所有 lang 属性</li>
                <li><code class="bg-muted px-1 rounded">/bookstore/book[1]</code> - 第一个 book</li>
              </ul>
            </div>
            <div>
              <h4 class="text-sm font-medium mb-2">高级查询</h4>
              <ul class="space-y-1 text-sm">
                <li><code class="bg-muted px-1 rounded">//book[price>35]</code> - 价格大于 35 的书</li>
                <li><code class="bg-muted px-1 rounded">//book[@category='web']</code> - web 类别的书</li>
                <li><code class="bg-muted px-1 rounded">//book/title/text()</code> - 所有书的标题文本</li>
                <li><code class="bg-muted px-1 rounded">count(//book)</code> - 书籍总数</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/xml-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">XML格式化</p>
              <p class="text-xs text-muted-foreground">美化压缩XML</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/xml-to-json"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileJson class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">XML转JSON</p>
              <p class="text-xs text-muted-foreground">XML转换为JSON</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/json-path"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileJson class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSONPath查询</p>
              <p class="text-xs text-muted-foreground">JSON路径查询</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { X, FileText, FileJson, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'text', name: '文本处理', description: '文本处理工具集合' }

// 状态管理
const xmlInput = ref('')
const xpath = ref('')
const xmlDoc = ref(null)
const xmlError = ref('')
const queryResult = ref(null)
const resultCount = ref(0)
const copied = ref(false)
const queryType = ref('multiple')

// 示例 XML
const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="children">
    <title lang="en">Harry Potter</title>
    <author>J. K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="web">
    <title lang="en">XQuery Kick Start</title>
    <author>James McGovern</author>
    <author>Per Bothner</author>
    <author>Kurt Cagle</author>
    <author>James Linn</author>
    <author>Vaidyanathan Nagarajan</author>
    <year>2003</year>
    <price>49.99</price>
  </book>
  <book category="web" cover="paperback">
    <title lang="en">Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>`

// XPath 示例
const xpathExamples = [
  {
    xpath: '/bookstore/book',
    description: '获取所有书籍节点'
  },
  {
    xpath: '//book',
    description: '获取文档中所有书籍节点'
  },
  {
    xpath: '//book[1]',
    description: '获取第一本书'
  },
  {
    xpath: '//book[last()]',
    description: '获取最后一本书'
  },
  {
    xpath: '//book[@category="web"]',
    description: '获取 web 类别的书'
  },
  {
    xpath: '//book[price>35]',
    description: '获取价格大于 35 的书'
  },
  {
    xpath: '//title/text()',
    description: '获取所有书的标题文本'
  },
  {
    xpath: 'count(//book)',
    description: '统计书籍总数'
  }
]

// 解析 XML
const parseXML = (xmlString) => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

  // 检查解析错误
  const parseError = xmlDoc.getElementsByTagName('parsererror')
  if (parseError.length) {
    throw new Error('XML 解析错误')
  }

  return xmlDoc
}

// 验证 XML
const validateXML = () => {
  xmlError.value = ''
  xmlDoc.value = null

  if (!xmlInput.value.trim()) {
    return
  }

  try {
    xmlDoc.value = parseXML(xmlInput.value)
  } catch (error) {
    xmlError.value = 'XML 解析错误: 请检查 XML 格式是否正确'
  }
}

// 格式化 XML
const formatXML = () => {
  if (!xmlDoc.value) {
    validateXML()
  }
  if (xmlDoc.value) {
    // 使用浏览器内置的格式化
    const serializer = new XMLSerializer()
    const xmlString = serializer.serializeToString(xmlDoc.value)

    // 简单的格式化（添加缩进）
    const formatted = xmlString
      .replace(/></g, '>\n<')
      .replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
        if (!match.includes('</')) {
          return `<${tag}${attrs}>`
        }
        return match
      })

    // 更精确的格式化
    let indentLevel = 0
    const lines = formatted.split('\n')
    const formattedLines = lines.map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''

      if (trimmed.startsWith('</')) {
        indentLevel--
      }

      const indented = '  '.repeat(Math.max(0, indentLevel)) + trimmed

      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
        const closingTag = `</${trimmed.match(/<(\w+)/)[1]}>`
        if (!trimmed.includes(closingTag)) {
          indentLevel++
        }
      }

      return indented
    }).filter(line => line)

    xmlInput.value = formattedLines.join('\n')
  }
}

// 加载示例
const loadSample = () => {
  xmlInput.value = sampleXML
  validateXML()
}

// 清空 XML
const clearXML = () => {
  xmlInput.value = ''
  xmlDoc.value = null
  xmlError.value = ''
  queryResult.value = null
  resultCount.value = 0
}

// 清空查询
const clearQuery = () => {
  xpath.value = ''
  queryResult.value = null
  resultCount.value = 0
}

// 应用示例
const applyExample = (example) => {
  xpath.value = example.xpath
}

// 执行查询
const executeQuery = () => {
  if (!xmlDoc.value || !xpath.value) {
    return
  }

  try {
    if (queryType.value === 'count') {
      const nodes = xmlDoc.value.evaluate(xpath.value, xmlDoc.value, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      queryResult.value = nodes.snapshotLength
      resultCount.value = nodes.snapshotLength
    } else if (queryType.value === 'single') {
      const node = xmlDoc.value.evaluate(xpath.value, xmlDoc.value, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      queryResult.value = node.singleNodeValue
      resultCount.value = node.singleNodeValue ? 1 : 0
    } else {
      const nodes = xmlDoc.value.evaluate(xpath.value, xmlDoc.value, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      const results = []

      for (let i = 0; i < nodes.snapshotLength; i++) {
        const node = nodes.snapshotItem(i)
        results.push(node)
      }

      queryResult.value = results
      resultCount.value = results.length
    }
  } catch (error) {
    queryResult.value = 'XPath 查询错误: ' + error.message
    resultCount.value = 0
  }
}

// 格式化查询结果
const formatQueryResult = () => {
  if (!queryResult.value) return ''

  if (typeof queryResult.value === 'number') {
    return queryResult.value.toString()
  }

  if (queryResult.value.nodeType === 1) {
    // 单个元素节点
    const serializer = new XMLSerializer()
    return serializer.serializeToString(queryResult.value)
  }

  if (Array.isArray(queryResult.value)) {
    // 多个节点
    const serializer = new XMLSerializer()
    return queryResult.value.map(node => {
      if (node.nodeType === 1) {
        return serializer.serializeToString(node)
      } else if (node.nodeType === 2) {
        // 属性节点
        return `${node.name}="${node.value}"`
      } else {
        return node.textContent || node.nodeValue
      }
    }).join('\n\n')
  }

  return queryResult.value.toString()
}

// 复制结果
const copyResult = async () => {
  const text = formatQueryResult()

  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
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

// SEO配置
useSeoMeta({
  title: 'XPath测试器 - 在线XML路径表达式查询',
  description: '免费在线XPath测试工具，支持使用XPath表达式查询和提取XML数据，提供语法说明和示例。',
  keywords: ['xpath', 'xml', 'query', 'path', 'test', '在线工具']
})


</script>