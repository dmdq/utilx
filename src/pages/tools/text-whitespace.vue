<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">空格格式化工具 - 统一空格Tab、去除多余空白</h1>
      <p class="text-muted-foreground">统一空格与Tab、去除多余空白、代码缩进整理。适用于代码格式化和文本清理。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
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
              @click="pasteFromClipboard"
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
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入需要格式化的文本..."
          @input="format"
        ></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">格式化结果</label>
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
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <!-- 格式化选项 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">格式化选项</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium text-foreground mb-2">Tab/空格转换</h3>
          <div class="flex flex-wrap gap-2">
            <button
              @click="tabToSpaces"
              class="px-3 py-2 text-sm bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors"
            >
              Tab转空格(4)
            </button>
            <button
              @click="spacesToTab"
              class="px-3 py-2 text-sm bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors"
            >
              空格转Tab
            </button>
          </div>
        </div>

        <div>
          <h3 class="font-medium text-foreground mb-2">空白处理</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                v-model="options.removeExtraSpaces"
                @change="format"
                class="rounded"
              >
              <span>去多余空格</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                v-model="options.removeTrailSpaces"
                @change="format"
                class="rounded"
              >
              <span>去行尾空格</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                v-model="options.removeEmptyLines"
                @change="format"
                class="rounded"
              >
              <span>去空行</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12 relative">
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
          什么是空格格式化？
        </h2>
        <p class="text-muted-foreground mb-4">
          空格格式化工具用于处理文本中的空白字符，包括空格、Tab、换行等。
          在编程和文本编辑中，统一的缩进和空白格式非常重要，可以提高代码可读性和维护性。
          本工具可以帮助您快速清理和格式化文本中的空白字符。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入需要格式化的文本或代码</li>
          <li>选择需要的格式化选项，如Tab转空格、去除多余空格等</li>
          <li>右侧实时显示格式化结果</li>
          <li>点击"复制"按钮可复制结果到剪贴板</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          格式化选项说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Tab转空格(4)</strong>：将所有Tab字符转换为4个空格，便于统一缩进</li>
          <li><strong>空格转Tab</strong>：将每4个连续空格转换为1个Tab字符</li>
          <li><strong>去多余空格</strong>：将多个连续空格替换为单个空格</li>
          <li><strong>去行尾空格</strong>：删除每行末尾的空格和Tab字符</li>
          <li><strong>去空行</strong>：删除多余的空行，仅保留单个换行符</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要Tab转空格？</h3>
            <p class="text-muted-foreground mt-1">
              不同的编辑器和环境对Tab的显示宽度设置不同，可能导致代码缩进混乱。
              将Tab转换为空格可以确保代码在任何地方都保持一致的缩进效果。
              许多编程规范也建议使用空格而非Tab。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是行尾空格？</h3>
            <p class="text-muted-foreground mt-1">
              行尾空格是指每行末尾不可见的空格或Tab字符。这些字符通常没有实际作用，
              但可能导致代码审查工具警告或版本控制系统产生不必要的差异。
              去除行尾空格是良好的编码习惯。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">格式化会改变文本内容吗？</h3>
            <p class="text-muted-foreground mt-1">
              格式化仅改变空白字符（空格、Tab、换行），不会改变文本的实际内容。
              但请注意，去除多余空格可能会改变某些文本的格式，如诗歌、对齐的文本等。
              使用前请确认选项是否符合您的需求。
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
import { HelpCircle, ChevronUp, Type, AlignLeft, Indent, Minus } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '空格格式化工具 - 统一空格Tab、去除多余空白 | Util工具箱',
  description: '免费在线空格格式化工具，统一Tab和空格、去除多余空白、去除行尾空格、删除空行，适用于代码格式化。',
  keywords: '空格格式化,Tab转空格,去除空白,代码格式化,缩进整理,去除行尾空格,文本清理',
  author: 'Util工具箱',
  ogTitle: '空格格式化工具 - 统一空格Tab、去除多余空白',
  ogDescription: '免费在线空格格式化工具，统一Tab和空格、去除多余空白、去除行尾空格、删除空行。',
  ogImage: 'https://www.util.cn/images/tools/text-whitespace.png',
  ogUrl: 'https://www.util.cn/tools/text-whitespace',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '空格格式化工具 - 统一空格Tab、去除多余空白',
  twitterDescription: '免费在线空格格式化工具，统一Tab和空格、去除多余空白、去除行尾空格、删除空行。',
  twitterImage: 'https://www.util.cn/images/tools/text-whitespace.png'
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
            name: '空格格式化工具',
            description: '免费在线空格格式化工具，统一Tab和空格、去除多余空白',
            url: 'https://www.util.cn/tools/text-whitespace',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'Tab转空格',
              '空格转Tab',
              '去除多余空格',
              '去除行尾空格',
              '删除空行',
              '实时格式化'
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
                name: '空格格式化',
                item: 'https://www.util.cn/tools/text-whitespace'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '为什么需要Tab转空格？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '不同的编辑器和环境对Tab的显示宽度设置不同，可能导致代码缩进混乱。将Tab转换为空格可以确保代码在任何地方都保持一致的缩进效果。'
                }
              },
              {
                '@type': 'Question',
                name: '什么是行尾空格？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '行尾空格是指每行末尾不可见的空格或Tab字符。这些字符通常没有实际作用，但可能导致代码审查工具警告或版本控制系统产生不必要的差异。'
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

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Type, AlignLeft, Indent, Minus
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'pinyin-converter'),
    tools.find(t => t.id === 'traditional-simplified'),
    tools.find(t => t.id === 'sentence-case'),
    tools.find(t => t.id === 'text-reverse')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

const options = ref({
  removeExtraSpaces: false,
  removeTrailSpaces: true,
  removeEmptyLines: false
})

function format() {
  let text = inputText.value

  if (options.value.removeExtraSpaces) {
    text = text.replace(/[ \t]+/g, ' ')
  }

  if (options.value.removeTrailSpaces) {
    text = text.replace(/[ \t]+$/gm, '')
  }

  if (options.value.removeEmptyLines) {
    text = text.replace(/\n{2,}/g, '\n')
  }

  outputText.value = text
}

function tabToSpaces() {
  let text = inputText.value
  text = text.replace(/\t/g, '    ')
  inputText.value = text
  format()
}

function spacesToTab() {
  let text = inputText.value
  text = text.replace(/    /g, '\t')
  inputText.value = text
  format()
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制')
  } catch {}
}

function clearInput() {
  inputText.value = ''
  outputText.value = ''
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    format()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

function loadSample() {
  inputText.value = `Line 1
  Line 2\t\t
  Line 3


  Line 4`
  format()
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

loadSample()
</script>
