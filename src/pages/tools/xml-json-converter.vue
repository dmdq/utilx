<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">XML与JSON互转工具</h1>
      <p class="text-gray-600 dark:text-gray-400">XML和JSON格式互相转换，支持属性处理和命名空间</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex flex-wrap gap-4 mb-4">
        <button
          @click="direction = 'xml2json'"
          :class="['px-4 py-2 rounded', direction === 'xml2json' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          XML → JSON
        </button>
        <button
          @click="direction = 'json2xml'"
          :class="['px-4 py-2 rounded', direction === 'json2xml' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          JSON → XML
        </button>
      </div>

      <div class="flex gap-4 mb-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.pretty" @change="convert" class="rounded">
          <span>美化输出</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.attributesAsProperties" @change="convert" class="rounded">
          <span>属性转为属性(@)</span>
        </label>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">{{ direction === 'xml2json' ? 'XML输入' : 'JSON输入' }}</h2>
          <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
        </div>
        <textarea
          v-model="inputData"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          :placeholder="direction === 'xml2json' ? '粘贴XML...' : '粘贴JSON...'"
          @input="convert"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">{{ direction === 'xml2json' ? 'JSON输出' : 'XML输出' }}</h2>
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!outputData">复制</button>
        </div>
        <div v-if="error" class="p-3 mb-2 bg-red-100 dark:bg-red-900/30 rounded text-red-600 text-sm">
          {{ error }}
        </div>
        <textarea
          v-model="outputData"
          readonly
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        ></textarea>
      </div>
    </div>

    <!-- 转换说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">转换规则说明</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-2">XML → JSON</h3>
          <ul class="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• 元素 → 对象属性</li>
            <li>• 属性 → @属性名</li>
            <li>• 文本内容 → #text</li>
            <li>• 多个子元素 → 数组</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">JSON → XML</h3>
          <ul class="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• 对象 → 元素</li>
            <li>• @属性 → XML属性</li>
            <li>• #text → 文本内容</li>
            <li>• 数组 → 多个同名元素</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'XML与JSON互转工具 - 在线格式转换',
  meta: [{ name: 'description', content: '在线XML与JSON互转工具，支持XML转JSON和JSON转XML，处理属性和命名空间。' }],
  keywords: ['XML转JSON', 'JSON转XML', 'XML转换', 'JSON转换', '数据格式转换']
})

const direction = ref<'xml2json' | 'json2xml'>('xml2json')
const inputData = ref('')
const outputData = ref('')
const error = ref('')

const options = ref({
  pretty: true,
  attributesAsProperties: false
})

const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="web">
    <title lang="en">Learning XML</title>
    <author>John Doe</author>
    <price>39.95</price>
  </book>
  <book category="web">
    <title lang="en">XQuery Kick Start</title>
    <author>Jane Doe</author>
    <price>49.99</price>
  </book>
</bookstore>`

const sampleJSON = {
  bookstore: {
    book: [
      {
        '@category': 'web',
        title: { '#text': 'Learning XML', '@lang': 'en' },
        author: 'John Doe',
        price: 39.95
      },
      {
        '@category': 'web',
        title: { '#text': 'XQuery Kick Start', '@lang': 'en' },
        author: 'Jane Doe',
        price: 49.99
      }
    ]
  }
}

function loadSample() {
  if (direction.value === 'xml2json') {
    inputData.value = sampleXML
  } else {
    inputData.value = JSON.stringify(sampleJSON, null, 2)
  }
  convert()
}

function convert() {
  error.value = ''

  if (!inputData.value) {
    outputData.value = ''
    return
  }

  if (direction.value === 'xml2json') {
    xmlToJson()
  } else {
    jsonToXml()
  }
}

function xmlToJson() {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(inputData.value, 'text/xml')

    // 检查解析错误
    const parseError = xmlDoc.getElementsByTagName('parsererror')
    if (parseError.length > 0) {
      throw new Error('XML解析错误: ' + parseError[0].textContent)
    }

    const json = xmlElementToJson(xmlDoc.documentElement)
    outputData.value = JSON.stringify(json, null, options.value.pretty ? 2 : 0)
  } catch (e) {
    error.value = (e as Error).message
    outputData.value = ''
  }
}

function xmlElementToJson(element: Element): any {
  const obj: any = {}

  // 处理属性
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    if (options.value.attributesAsProperties) {
      obj[attr.name] = attr.value
    } else {
      obj['@' + attr.name] = attr.value
    }
  }

  // 处理子节点
  const children = element.childNodes
  const childMap: Record<string, any[]> = {}
  let textContent = ''

  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || ''
      if (text.trim()) {
        textContent += text
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const elem = child as Element
      const childObj = xmlElementToJson(elem)
      const tagName = elem.tagName

      if (!childMap[tagName]) {
        childMap[tagName] = []
      }
      childMap[tagName].push(childObj)
    }
  }

  // 合并子节点
  for (const [tag, values] of Object.entries(childMap)) {
    obj[tag] = values.length === 1 ? values[0] : values
  }

  // 文本内容
  if (textContent) {
    if (Object.keys(obj).length > 0) {
      obj['#text'] = textContent.trim()
    } else {
      return textContent.trim()
    }
  }

  return obj
}

function jsonToXml() {
  try {
    const json = JSON.parse(inputData.value)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += jsonToXmlString(json, 'root')
    outputData.value = xml
  } catch (e) {
    error.value = 'JSON解析错误: ' + (e as Error).message
    outputData.value = ''
  }
}

function jsonToXmlString(obj: any, tagName: string): string {
  let xml = ''

  if (Array.isArray(obj)) {
    for (const item of obj) {
      xml += jsonToXmlString(item, tagName)
    }
  } else if (typeof obj === 'object' && obj !== null) {
    xml += `<${tagName}`

    // 提取属性
    const attrs: string[] = []
    const content: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('@')) {
        const attrName = key.substring(1)
        attrs.push(`${attrName}="${escapeXml(String(value))}"`)
      } else if (key !== '#text') {
        content[key] = value
      }
    }

    if (attrs.length > 0) {
      xml += ' ' + attrs.join(' ')
    }

    xml += '>'

    // 处理内容
    const keys = Object.keys(content)
    if (keys.length === 1 && keys[0] === '#text') {
      xml += escapeXml(String(content['#text']))
    } else {
      if (options.value.pretty) xml += '\n'
      for (const [key, value] of Object.entries(content)) {
        xml += jsonToXmlString(value, key)
        if (options.value.pretty) xml += '\n'
      }
    }

    xml += `</${tagName}>`
  } else {
    xml += `<${tagName}>${escapeXml(String(obj))}</${tagName}>`
  }

  return xml
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputData.value)
    alert('已复制')
  } catch {}
}

// 初始化
loadSample()
</script>
