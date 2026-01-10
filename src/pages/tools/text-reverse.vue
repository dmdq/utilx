<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文本倒置工具 - 字符/单词/行倒序</h1>
      <p class="text-muted-foreground">字符、单词、行倒序，支持多种倒置方式。适用于文本处理和数据转换。</p>
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
          placeholder="输入需要倒置的文本..."
          @input="reverse"
        ></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">倒置结果</label>
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

    <!-- 倒置方式 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">倒置方式</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in reverseTypes"
          :key="type.id"
          @click="currentType = type.id; reverse()"
          :class="[
            'px-4 py-2 rounded font-medium transition-colors',
            currentType === type.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          {{ type.name }}
        </button>
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
          什么是文本倒置？
        </h2>
        <p class="text-muted-foreground mb-4">
          文本倒置是指将文本按照特定规则进行反向排列。常见的倒置方式包括字符倒序、单词倒序、行倒序等。
          文本倒置工具可以快速实现各种倒置操作，适用于文本处理、数据转换、编码加密等多种场景。
          本工具支持多种倒置方式，满足不同的使用需求。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入需要倒置的文本</li>
          <li>选择倒置方式：字符倒序、单词倒序、行倒序或每行单词倒序</li>
          <li>右侧实时显示倒置结果</li>
          <li>点击"复制"按钮可复制结果到剪贴板</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          倒置方式说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>字符倒序</strong>：将文本中的每个字符顺序完全反转，如"Hello"变为"olleH"</li>
          <li><strong>单词倒序</strong>：保持单词内部不变，反转单词的顺序，如"Hello World"变为"World Hello"</li>
          <li><strong>行倒序</strong>：将多行文本的行序反转，第一行变最后一行</li>
          <li><strong>每行单词倒序</strong>：对每一行单独进行单词倒序处理</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>文本处理</strong>：快速反转文本内容，用于特殊排版或格式转换</li>
          <li><strong>数据转换</strong>：将数据列表顺序反转，便于数据分析或处理</li>
          <li><strong>编码测试</strong>：生成倒序文本用于测试编码处理的正确性</li>
          <li><strong>创意设计</strong>：创造特殊的文字效果，用于设计或娱乐</li>
          <li><strong>密码学</strong>：简单的文本变换可用于基础加密或解密练习</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">倒置会影响文本格式吗？</h3>
            <p class="text-muted-foreground mt-1">
              倒置仅改变文本的顺序，不会改变字符本身的内容。但请注意，字符倒序会破坏单词的可读性，
              而单词倒序则保持每个单词的完整性。根据您的需求选择合适的倒置方式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持中文倒置吗？</h3>
            <p class="text-muted-foreground mt-1">
              支持。本工具完全支持中文文本的倒置。字符倒序会将汉字顺序反转，
              单词倒序会将中文词语（以空格分隔）顺序反转。对于没有空格分隔的中文文本，
              建议使用字符倒序或行倒序。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">倒置可以撤销吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。大多数倒置操作都是可逆的。例如，对文本进行两次字符倒序会恢复原文本。
              对于单词倒序，再次执行相同的倒置操作也会恢复原顺序。您可以通过再次倒置来撤销操作。
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
import { HelpCircle, ChevronUp, RotateCcw, ArrowUpDown, ArrowLeftRight } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '文本倒置工具 - 字符/单词/行倒序 | Util工具箱',
  description: '免费在线文本倒置工具，支持字符倒序、单词倒序、行倒序等多种倒置方式。简单易用，实时转换。',
  keywords: '文本倒置,字符串反转,字符倒序,单词倒序,行倒序,文本处理,数据转换',
  author: 'Util工具箱',
  ogTitle: '文本倒置工具 - 字符/单词/行倒序',
  ogDescription: '免费在线文本倒置工具，支持字符倒序、单词倒序、行倒序等多种倒置方式。',
  ogImage: 'https://www.util.cn/images/tools/text-reverse.png',
  ogUrl: 'https://www.util.cn/tools/text-reverse',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文本倒置工具 - 字符/单词/行倒序',
  twitterDescription: '免费在线文本倒置工具，支持字符倒序、单词倒序、行倒序等多种倒置方式。',
  twitterImage: 'https://www.util.cn/images/tools/text-reverse.png'
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
            name: '文本倒置工具',
            description: '免费在线文本倒置工具，支持字符倒序、单词倒序、行倒序',
            url: 'https://www.util.cn/tools/text-reverse',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '字符倒序',
              '单词倒序',
              '行倒序',
              '每行单词倒序',
              '实时转换',
              '一键复制'
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
                name: '文本倒置',
                item: 'https://www.util.cn/tools/text-reverse'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '倒置会影响文本格式吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '倒置仅改变文本的顺序，不会改变字符本身的内容。但请注意，字符倒序会破坏单词的可读性，而单词倒序则保持每个单词的完整性。'
                }
              },
              {
                '@type': 'Question',
                name: '支持中文倒置吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '支持。本工具完全支持中文文本的倒置。字符倒序会将汉字顺序反转，单词倒序会将中文词语（以空格分隔）顺序反转。'
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
const currentType = ref('char')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  RotateCcw, ArrowUpDown, ArrowLeftRight
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'pinyin-converter'),
    tools.find(t => t.id === 'traditional-simplified'),
    tools.find(t => t.id === 'text-whitespace'),
    tools.find(t => t.id === 'sentence-case')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

const reverseTypes = [
  { id: 'char', name: '字符倒序' },
  { id: 'word', name: '单词倒序' },
  { id: 'line', name: '行倒序' },
  { id: 'word-line', name: '每行单词倒序' }
]

function reverse() {
  const text = inputText.value

  switch (currentType.value) {
    case 'char':
      outputText.value = text.split('').reverse().join('')
      break
    case 'word':
      outputText.value = text.split(/\s+/).reverse().join(' ')
      break
    case 'line':
      outputText.value = text.split('\n').reverse().join('\n')
      break
    case 'word-line':
      outputText.value = text.split('\n').map(line =>
        line.split(/\s+/).reverse().join(' ')
      ).join('\n')
      break
  }
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
    reverse()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

function loadSample() {
  inputText.value = 'Hello World\nThis is a test'
  reverse()
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

loadSample()
</script>
