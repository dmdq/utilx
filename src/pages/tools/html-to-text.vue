<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">HTML转纯文本工具</h1>
      <p class="text-gray-600 dark:text-gray-400">去除HTML标签，提取纯文本内容</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">HTML输入</h2>
        <textarea
          v-model="inputText"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入HTML代码..."
          @input="convert"
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="inputText = ''; convert()" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          <button @click="pasteText" class="px-3 py-1 text-sm bg-blue-500 text-white rounded">粘贴</button>
          <button @click="loadSample" class="px-3 py-1 text-sm bg-green-500 text-white rounded">示例</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">纯文本输出</h2>
        <textarea
          v-model="outputText"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          readonly
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded">复制</button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">提取选项</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.preserveLinks" @change="convert" class="rounded">
          <span>保留链接 (将&lt;a&gt;转为 [文字](url))</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.preserveImages" @change="convert" class="rounded">
          <span>保留图片 (将&lt;img&gt;转为 ![alt](url))</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.preserveHeadings" @change="convert" class="rounded">
          <span>保留标题格式 (# 标题)</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.preserveLists" @change="convert" class="rounded">
          <span>保留列表格式 (- 项目)</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.preserveBreaks" @change="convert" class="rounded">
          <span>保留换行结构</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.decodeEntities" @change="convert" class="rounded">
          <span>解码HTML实体 (&amp;nbsp; → 空格)</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({
  title: 'HTML转纯文本工具 - 去除HTML标签提取文本',
  meta: [{ name: 'description', content: '在线HTML转纯文本工具，去除HTML标签提取纯文本内容，支持保留链接、图片、标题等格式。' }],
  keywords: ['html转纯文本', 'html转text', '去除html标签', 'html文本提取', 'html清理']
})

const inputText = ref('')
const outputText = ref('')
const options = ref({
  preserveLinks: true,
  preserveImages: true,
  preserveHeadings: true,
  preserveLists: true,
  preserveBreaks: true,
  decodeEntities: true
})

function convert() {
  // 只在客户端执行
  if (!process.client) return

  let text = inputText.value

  // 创建DOM解析器
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tag = el.tagName.toLowerCase()

      // 处理不同标签
      switch (tag) {
        case 'br':
          return '\n'
        case 'hr':
          return '\n---\n'
        case 'p':
        case 'div':
          return processChildren(el) + (options.value.preserveBreaks ? '\n\n' : ' ')
        case 'h1':
          return options.value.preserveHeadings ? `# ${processChildren(el).trim()}\n\n` : processChildren(el)
        case 'h2':
          return options.value.preserveHeadings ? `## ${processChildren(el).trim()}\n\n` : processChildren(el)
        case 'h3':
          return options.value.preserveHeadings ? `### ${processChildren(el).trim()}\n\n` : processChildren(el)
        case 'h4':
          return options.value.preserveHeadings ? `#### ${processChildren(el).trim()}\n\n` : processChildren(el)
        case 'h5':
          return options.value.preserveHeadings ? `##### ${processChildren(el).trim()}\n\n` : processChildren(el)
        case 'h6':
          return options.value.preserveHeadings ? `###### ${processChildren(el).trim()}\n\n` : processChildren(el)
        case 'ul':
          if (options.value.preserveLists) {
            return Array.from(el.children).map(li => `- ${processChildren(li).trim()}`).join('\n') + '\n\n'
          }
          return processChildren(el)
        case 'ol':
          if (options.value.preserveLists) {
            return Array.from(el.children).map((li, i) => `${i + 1}. ${processChildren(li).trim()}`).join('\n') + '\n\n'
          }
          return processChildren(el)
        case 'li':
          return processChildren(el)
        case 'a':
          if (options.value.preserveLinks) {
            const href = el.getAttribute('href') || ''
            const text = processChildren(el).trim()
            return `[${text}](${href})`
          }
          return processChildren(el)
        case 'img':
          if (options.value.preserveImages) {
            const src = el.getAttribute('src') || ''
            const alt = el.getAttribute('alt') || ''
            return `![${alt}](${src})`
          }
          return el.getAttribute('alt') || ''
        case 'b':
        case 'strong':
          return `**${processChildren(el)}**`
        case 'i':
        case 'em':
          return `*${processChildren(el)}*`
        case 'code':
          return `\`${processChildren(el)}\``
        case 'pre':
          return '```\n' + processChildren(el) + '\n```\n\n'
        case 'blockquote':
          return `> ${processChildren(el).trim()}\n\n`
        case 'script':
        case 'style':
        case 'noscript':
          return ''
        default:
          return processChildren(el)
      }
    }

    return processChildren(node)
  }

  function processChildren(node: Node): string {
    let result = ''
    for (const child of node.childNodes) {
      result += processNode(child)
    }
    return result
  }

  let result = processNode(doc.body)

  // 解码HTML实体
  if (options.value.decodeEntities) {
    const textarea = document.createElement('textarea')
    result = result.replace(/&[^;]+;/g, (entity) => {
      textarea.innerHTML = entity
      return textarea.textContent || entity
    })
  }

  // 清理多余的空白
  result = result
    .replace(/\n{3,}/g, '\n\n')  // 最多两个连续换行
    .replace(/[ \t]+/g, ' ')     // 合并空格
    .replace(/^[\n\s]+|[\n\s]+$/g, '')  // 去除首尾空白

  outputText.value = result
}

async function pasteText() {
  try {
    inputText.value = await navigator.clipboard.readText()
    convert()
  } catch {}
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制')
  } catch {}
}

function loadSample() {
  inputText.value = `<!DOCTYPE html>
<html>
<head><title>示例</title></head>
<body>
  <h1>文章标题</h1>
  <p>这是一段<strong>重要</strong>的文字。</p>
  <ul>
    <li>第一项</li>
    <li>第二项</li>
  </ul>
  <p>访问 <a href="https://example.com">示例网站</a> 了解更多。</p>
  <img src="image.jpg" alt="示例图片">
</body>
</html>`
  convert()
}

// 只在客户端挂载后加载示例
onMounted(() => {
  loadSample()
})
</script>
