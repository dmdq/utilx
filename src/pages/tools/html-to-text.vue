<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">HTML转纯文本工具 - 去除HTML标签提取文本</h1>
      <p class="text-muted-foreground">专业的在线HTML转纯文本工具，去除HTML标签提取纯文本内容。支持保留链接、图片、标题、列表等格式，一键转换为可读文本。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">HTML输入</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteText"
            >
              粘贴
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadSample"
            >
              示例
            </button>
          </div>
        </div>
        <textarea
          v-model="inputText"
          class="w-full h-80 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入HTML代码..."
          @input="convert"
        ></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">纯文本输出</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyResult"
            >
              复制
            </button>
          </div>
        </div>
        <textarea
          v-model="outputText"
          class="w-full h-80 px-4 py-3 bg-muted border border-border rounded-lg resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <!-- 提取选项区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">提取选项</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" v-model="options.preserveLinks" @change="convert" class="rounded">
          <span>保留链接 (将&lt;a&gt;转为 [文字](url))</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" v-model="options.preserveImages" @change="convert" class="rounded">
          <span>保留图片 (将&lt;img&gt;转为 ![alt](url))</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" v-model="options.preserveHeadings" @change="convert" class="rounded">
          <span>保留标题格式 (# 标题)</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" v-model="options.preserveLists" @change="convert" class="rounded">
          <span>保留列表格式 (- 项目)</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" v-model="options.preserveBreaks" @change="convert" class="rounded">
          <span>保留换行结构</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" v-model="options.decodeEntities" @change="convert" class="rounded">
          <span>解码HTML实体 (&amp;nbsp; → 空格)</span>
        </label>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12 relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是HTML转纯文本？
        </h2>
        <p class="text-muted-foreground mb-4">
          HTML转纯文本工具可以去除HTML文档中的所有标签，提取出纯文本内容。同时支持保留部分格式信息，
          如链接、标题、列表等，以Markdown格式输出。这对于从网页提取内容、清理HTML格式非常有用。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中粘贴或输入HTML代码</li>
          <li>选择需要保留的格式选项（链接、图片、标题、列表等）</li>
          <li>查看右侧提取的纯文本结果</li>
          <li>点击复制按钮导出结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的HTML标签转换
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>标题标签</strong>: h1-h6 转换为 Markdown 标题格式</li>
          <li><strong>列表标签</strong>: ul/ol/li 转换为 Markdown 列表格式</li>
          <li><strong>链接标签</strong>: &lt;a&gt; 转换为 [文字](url) 格式</li>
          <li><strong>图片标签</strong>: &lt;img&gt; 转换为 ![alt](url) 格式</li>
          <li><strong>文本格式</strong>: &lt;strong&gt;/&lt;b&gt;, &lt;em&gt;/&lt;i&gt;, &lt;code&gt; 等</li>
          <li><strong>段落和换行</strong>: &lt;p&gt;, &lt;br&gt;, &lt;div&gt; 等</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么转换后仍有HTML标签？</h3>
            <p class="text-muted-foreground mt-1">
              如果HTML格式不正确或包含特殊标签，可能无法完全解析。建议确保HTML格式正确，
              或者取消勾选"保留格式"选项以获取纯文本。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理JavaScript和CSS代码？</h3>
            <p class="text-muted-foreground mt-1">
              本工具会自动忽略 &lt;script&gt;、&lt;style&gt; 等标签内的内容，
              只提取页面的实际文本内容，不会包含脚本和样式代码。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是HTML实体解码？</h3>
            <p class="text-muted-foreground mt-1">
              HTML实体是特殊字符的编码表示，如 &amp;nbsp; 表示空格，&amp;amp; 表示 & 符号。
              启用解码功能会将这些实体转换为实际字符，使文本更易读。
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
          :to="`/tools/${relatedTool.id}`"
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
import { ref, onMounted, computed } from 'vue'
import { HelpCircle, ChevronUp, FileText, Code, Type, Link, Image } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'HTML转纯文本工具 - 去除HTML标签提取文本 | Util工具箱',
  description: '免费在线HTML转纯文本工具，去除HTML标签提取纯文本内容。支持保留链接、图片、标题、列表等格式，一键转换为可读文本。',
  keywords: 'html转纯文本,html转text,去除html标签,html文本提取,html清理,html解析,网页内容提取',
  author: 'Util工具箱',
  ogTitle: 'HTML转纯文本工具 - 去除HTML标签提取文本',
  ogDescription: '去除HTML标签提取纯文本内容，支持保留链接、图片、标题、列表等格式。',
  ogImage: 'https://www.util.cn/images/tools/html-to-text.png',
  ogUrl: 'https://www.util.cn/tools/html-to-text',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'HTML转纯文本工具 - 去除HTML标签提取文本',
  twitterDescription: '去除HTML标签提取纯文本内容，支持保留链接、图片、标题、列表等格式。',
  twitterImage: 'https://www.util.cn/images/tools/html-to-text.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'HTML转纯文本工具',
            description: '在线HTML转纯文本工具，去除HTML标签提取纯文本内容',
            url: 'https://www.util.cn/tools/html-to-text',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '去除HTML标签',
              '保留链接格式',
              '保留图片格式',
              '保留标题格式',
              '保留列表格式',
              '解码HTML实体'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'HTML转纯文本',
                item: 'https://www.util.cn/tools/html-to-text'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '为什么转换后仍有HTML标签？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '如果HTML格式不正确或包含特殊标签，可能无法完全解析。建议确保HTML格式正确。'
                }
              },
              {
                '@type': 'Question',
                name: '如何处理JavaScript和CSS代码？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '本工具会自动忽略 <script>、<style> 等标签内的内容，只提取页面的实际文本内容。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
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

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, Code, Type, Link, Image
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'html-to-text'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'markdown-editor'),
    tools.find(t => t.id === 'html-formatter'),
    tools.find(t => t.id === 'text-to-table'),
    tools.find(t => t.id === 'word-counter')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

function convert() {
  // 只在客户端执行
  if (process.client) {
    let text = inputText.value

    // 创建DOM解析器
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || ''
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node
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

    function processChildren(node) {
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
  } catch {}
}

function clearInput() {
  inputText.value = ''
  outputText.value = ''
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

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
addRecentTool('html-to-text')

// 只在客户端挂载后加载示例
onMounted(() => {
  loadSample()
})
</script>
