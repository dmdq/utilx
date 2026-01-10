<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文本缩进格式化工具 - 调整代码缩进与格式</h1>
      <p class="text-muted-foreground">专业的在线文本缩进格式化工具，支持添加/移除缩进、Tab与空格互转、代码格式化。一键美化代码，提升可读性。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入文本</label>
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
          placeholder="输入需要调整缩进的代码或文本..."
          @input="process"
        ></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输出结果</label>
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

    <!-- 操作控制区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">缩进操作</h2>

      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">操作类型</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="operation = 'add'; process()"
              :class="['px-4 py-2 rounded transition-colors', operation === 'add' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >
              添加缩进
            </button>
            <button
              @click="operation = 'remove'; process()"
              :class="['px-4 py-2 rounded transition-colors', operation === 'remove' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >
              移除缩进
            </button>
            <button
              @click="operation = 'tab2space'; process()"
              :class="['px-4 py-2 rounded transition-colors', operation === 'tab2space' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >
              Tab转空格
            </button>
            <button
              @click="operation = 'space2tab'; process()"
              :class="['px-4 py-2 rounded transition-colors', operation === 'space2tab' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >
              空格转Tab
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">缩进单位</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="size in [2, 4, 8]"
              :key="size"
              @click="indentSize = size; process()"
              :class="['px-3 py-1 text-sm rounded transition-colors', indentSize === size ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >
              {{ size }} 空格
            </button>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" v-model="options.preserveEmptyLines" @change="process" class="rounded">
          <span>保留空行</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" v-model="options.trimTrailing" @change="process" class="rounded">
          <span>去除行尾空白</span>
        </label>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-2">缩进级别</label>
        <input
          v-model.number="indentLevel"
          type="number"
          min="0"
          max="20"
          class="w-24 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          @input="operation === 'add' ? process() : null"
        >
        <span class="ml-2 text-sm text-muted-foreground">级别（用于添加/移除缩进）</span>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">统计信息</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="p-3 bg-muted rounded-lg">
          <div class="text-2xl font-bold text-primary">{{ stats.lines }}</div>
          <div class="text-sm text-muted-foreground">总行数</div>
        </div>
        <div class="p-3 bg-muted rounded-lg">
          <div class="text-2xl font-bold text-primary">{{ stats.emptyLines }}</div>
          <div class="text-sm text-muted-foreground">空行数</div>
        </div>
        <div class="p-3 bg-muted rounded-lg">
          <div class="text-2xl font-bold text-primary">{{ stats.maxIndent }}</div>
          <div class="text-sm text-muted-foreground">最大缩进</div>
        </div>
        <div class="p-3 bg-muted rounded-lg">
          <div class="text-2xl font-bold text-primary">{{ stats.tabLines }}</div>
          <div class="text-sm text-muted-foreground">包含Tab的行</div>
        </div>
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
          什么是文本缩进格式化？
        </h2>
        <p class="text-muted-foreground mb-4">
          文本缩进格式化工具可以帮助开发者快速调整代码和文本的缩进格式。它支持添加或移除缩进、
          将Tab字符转换为空格、将空格转换为Tab字符等功能。良好的代码缩进可以提高代码可读性，
          是编程规范的重要组成部分。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中粘贴或输入需要调整缩进的文本或代码</li>
          <li>选择操作类型：添加缩进、移除缩进、Tab转空格或空格转Tab</li>
          <li>设置缩进单位（2、4或8个空格）和缩进级别</li>
          <li>查看右侧输出区域的格式化结果，可一键复制</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种操作模式</strong>: 支持添加缩进、移除缩进、Tab与空格互转</li>
          <li><strong>灵活配置</strong>: 可自定义缩进单位和缩进级别</li>
          <li><strong>保留格式</strong>: 可选择保留空行或去除行尾空白</li>
          <li><strong>实时统计</strong>: 显示总行数、空行数、最大缩进等统计信息</li>
          <li><strong>本地处理</strong>: 所有处理都在浏览器本地完成，数据安全</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">Tab和空格有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              Tab是一个制表符字符，而空格是实际的空格字符。不同编辑器对Tab的显示宽度可能不同，
              而空格始终固定。在现代开发中，通常建议使用空格（如2或4个空格）来保持一致的代码格式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要统一缩进格式？</h3>
            <p class="text-muted-foreground mt-1">
              统一的缩进格式可以提高代码可读性，便于团队协作。不同开发者可能使用不同的编辑器设置，
              统一缩进格式可以避免代码风格不一致的问题，使代码更易于维护。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的缩进大小？</h3>
            <p class="text-muted-foreground mt-1">
              常见的缩进大小是2或4个空格。2个空格适合嵌套较深的代码，4个空格提供更清晰的层次结构。
              选择时应考虑团队规范和项目约定，保持一致性最重要。
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
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp, FileText, Type, Code, AlignLeft, Indent } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '文本缩进格式化工具 - 在线代码缩进调整与格式化 | Util工具箱',
  description: '免费在线文本缩进格式化工具，支持添加/移除缩进、Tab与空格互转、代码格式化。一键美化代码，提升可读性。纯本地处理，数据安全可靠。',
  keywords: '文本缩进格式化,代码缩进,Tab转空格,空格转Tab,缩进调整,代码格式化,在线缩进工具',
  author: 'Util工具箱',
  ogTitle: '文本缩进格式化工具 - 专业代码缩进调整',
  ogDescription: '支持添加/移除缩进、Tab与空格互转、代码格式化。一键美化代码，提升可读性。',
  ogImage: 'https://www.util.cn/images/tools/text-indent.png',
  ogUrl: 'https://www.util.cn/tools/text-indent',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文本缩进格式化工具 - 专业代码缩进调整',
  twitterDescription: '支持添加/移除缩进、Tab与空格互转、代码格式化。一键美化代码。',
  twitterImage: 'https://www.util.cn/images/tools/text-indent.png'
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
            name: '文本缩进格式化工具',
            description: '在线文本缩进格式化工具，支持添加/移除缩进、Tab与空格互转',
            url: 'https://www.util.cn/tools/text-indent',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '添加或移除缩进',
              'Tab转空格',
              '空格转Tab',
              '自定义缩进单位',
              '保留或移除空行',
              '统计信息显示'
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
                name: '文本缩进格式化',
                item: 'https://www.util.cn/tools/text-indent'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Tab和空格有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Tab是一个制表符字符，而空格是实际的空格字符。不同编辑器对Tab的显示宽度可能不同，而空格始终固定。'
                }
              },
              {
                '@type': 'Question',
                name: '为什么需要统一缩进格式？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '统一的缩进格式可以提高代码可读性，便于团队协作，避免代码风格不一致的问题。'
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
const operation = ref('add')
const indentSize = ref(4)
const indentLevel = ref(1)

const options = ref({
  preserveEmptyLines: true,
  trimTrailing: false
})

const stats = ref({
  lines: 0,
  emptyLines: 0,
  maxIndent: 0,
  tabLines: 0
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, Type, Code, AlignLeft, Indent
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'text-indent'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'word-counter'),
    tools.find(t => t.id === 'text-to-table'),
    tools.find(t => t.id === 'text-diff'),
    tools.find(t => t.id === 'text-case-converter')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

function process() {
  const text = inputText.value
  const lines = text.split('\n')
  const indentStr = ' '.repeat(indentSize.value)

  let result = []
  let maxIndent = 0
  let tabLines = 0
  let emptyLines = 0

  for (const line of lines) {
    // 统计信息
    if (line.trim() === '') {
      emptyLines++
    }
    if (line.includes('\t')) {
      tabLines++
    }
    const currentIndent = line.search(/\S/)
    if (currentIndent > maxIndent) {
      maxIndent = currentIndent
    }

    // 处理空行
    if (line.trim() === '') {
      if (options.value.preserveEmptyLines) {
        result.push(options.value.trimTrailing ? '' : line)
      }
      continue
    }

    let processedLine = line

    switch (operation.value) {
      case 'add':
        // 添加缩进
        for (let i = 0; i < indentLevel.value; i++) {
          processedLine = indentStr + processedLine
        }
        break

      case 'remove':
        // 移除缩进
        for (let i = 0; i < indentLevel.value; i++) {
          if (processedLine.startsWith(indentStr)) {
            processedLine = processedLine.substring(indentStr.length)
          } else if (processedLine.startsWith('\t')) {
            processedLine = processedLine.substring(1)
          } else if (processedLine.startsWith(' ')) {
            processedLine = processedLine.trimStart()
          }
        }
        break

      case 'tab2space':
        // Tab转空格
        let col = 0
        let newLine = ''
        for (let i = 0; i < processedLine.length; i++) {
          const char = processedLine[i]
          if (char === '\t') {
            const spaces = indentSize.value - (col % indentSize.value)
            newLine += ' '.repeat(spaces)
            col += spaces
          } else {
            newLine += char
            col++
          }
        }
        processedLine = newLine
        break

      case 'space2tab':
        // 空格转Tab（仅处理行首）
        const leadingSpaces = processedLine.match(/^ +/)
        if (leadingSpaces) {
          const spaceCount = leadingSpaces[0].length
          const tabCount = Math.floor(spaceCount / indentSize.value)
          const remainingSpaces = spaceCount % indentSize.value
          processedLine = '\t'.repeat(tabCount) + ' '.repeat(remainingSpaces) + processedLine.substring(spaceCount)
        }
        break
    }

    // 去除行尾空白
    if (options.value.trimTrailing) {
      processedLine = processedLine.trimEnd()
    }

    result.push(processedLine)
  }

  // 更新统计
  stats.value = {
    lines: lines.length,
    emptyLines,
    maxIndent,
    tabLines
  }

  outputText.value = result.join('\n')
}

async function pasteText() {
  try {
    inputText.value = await navigator.clipboard.readText()
    process()
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
  inputText.value = `function example() {
    const data = {
        name: 'test',
        value: 123
    }
    return data
}`
  process()
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
addRecentTool('text-indent')

// 初始化示例
loadSample()
</script>
