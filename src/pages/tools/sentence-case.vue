<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">句首大写工具 - 每个句子首字母大写</h1>
      <p class="text-muted-foreground">将每个句子的首字母转换为大写，支持多种大小写转换模式。适用于英文文本编辑。</p>
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
          placeholder="输入英文文本..."
          @input="convert"
        ></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">转换结果</label>
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

    <!-- 转换选项 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">转换模式</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in types"
          :key="type.id"
          @click="currentType = type.id; convert()"
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
          什么是句首大写？
        </h2>
        <p class="text-muted-foreground mb-4">
          句首大写是英文写作中的标准格式要求，每个句子的首字母都应该大写。
          句首大写工具可以自动识别句子边界（如句号、问号、感叹号等），并将每个句子的首字母转换为大写。
          此外，本工具还支持其他常见的大小写转换模式，方便您快速调整文本格式。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入需要转换的英文文本</li>
          <li>选择转换模式：句首大写、每个单词大写、全部小写后句首大写等</li>
          <li>右侧实时显示转换结果</li>
          <li>点击"复制"按钮可复制结果到剪贴板</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换模式说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>句首大写</strong>：仅将每个句子的首字母大写，其余字母保持不变</li>
          <li><strong>每个单词大写</strong>：将每个单词的首字母大写（标题格式）</li>
          <li><strong>全部小写后句首大写</strong>：先将全部字母转为小写，再将句首字母大写</li>
          <li><strong>首字母大写其余小写</strong>：仅将文本的第一个字母大写，其余全部小写</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何识别句子边界？</h3>
            <p class="text-muted-foreground mt-1">
              本工具通过标点符号（句号.、问号?、感叹号!）来识别句子边界。
              当遇到这些标点符号后跟空格时，会将下一个单词的首字母大写。
              注意：缩写词中的句号（如 Mr.、Dr.）可能会被误识别为句子结束。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是标题格式？</h3>
            <p class="text-muted-foreground mt-1">
              标题格式（Title Case）是指将每个主要单词的首字母大写，如"The Quick Brown Fox"。
              这种格式常用于文章标题、书籍标题等。使用"每个单词大写"模式可以快速实现这种格式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要统一大小写？</h3>
            <p class="text-muted-foreground mt-1">
              统一的大小写格式可以让文本更专业、更易读。在英文写作中，句首大写是基本规范。
              此外，正确的标题格式可以提升内容的可读性和专业度，特别是在文章、报告等正式文档中。
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
import { HelpCircle, ChevronUp, Type, Heading1, CaseSensitive } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '句首大写工具 - 每个句子首字母大写 | Util工具箱',
  description: '免费在线句首大写工具，将每个句子的首字母转换为大写，支持多种句子分隔符和大小写转换模式。',
  keywords: '句首大写,句子大写,首字母大写,英文格式化,文本编辑,大小写转换,标题格式',
  author: 'Util工具箱',
  ogTitle: '句首大写工具 - 每个句子首字母大写',
  ogDescription: '免费在线句首大写工具，将每个句子的首字母转换为大写，支持多种大小写转换模式。',
  ogImage: 'https://www.util.cn/images/tools/sentence-case.png',
  ogUrl: 'https://www.util.cn/tools/sentence-case',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '句首大写工具 - 每个句子首字母大写',
  twitterDescription: '免费在线句首大写工具，将每个句子的首字母转换为大写，支持多种大小写转换模式。',
  twitterImage: 'https://www.util.cn/images/tools/sentence-case.png'
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
            name: '句首大写工具',
            description: '免费在线句首大写工具，将每个句子的首字母转换为大写',
            url: 'https://www.util.cn/tools/sentence-case',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '句首大写转换',
              '每个单词大写',
              '全部小写后句首大写',
              '首字母大写其余小写',
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
                name: '句首大写',
                item: 'https://www.util.cn/tools/sentence-case'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何识别句子边界？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '本工具通过标点符号（句号.、问号?、感叹号!）来识别句子边界。当遇到这些标点符号后跟空格时，会将下一个单词的首字母大写。'
                }
              },
              {
                '@type': 'Question',
                name: '什么是标题格式？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '标题格式（Title Case）是指将每个主要单词的首字母大写。这种格式常用于文章标题、书籍标题等。使用"每个单词大写"模式可以快速实现这种格式。'
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
const currentType = ref('sentence')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Type, Heading1, CaseSensitive
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'pinyin-converter'),
    tools.find(t => t.id === 'traditional-simplified'),
    tools.find(t => t.id === 'text-whitespace'),
    tools.find(t => t.id === 'text-reverse')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

const types = [
  { id: 'sentence', name: '句首大写' },
  { id: 'word', name: '每个单词大写' },
  { id: 'lower', name: '全部小写后句首大写' },
  { id: 'upper', name: '首字母大写其余小写' }
]

function convert() {
  const text = inputText.value

  switch (currentType.value) {
    case 'sentence':
      outputText.value = text.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase())
      break
    case 'word':
      outputText.value = text.replace(/\b\w/g, c => c.toUpperCase())
      break
    case 'lower':
      outputText.value = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase())
      break
    case 'upper':
      outputText.value = text.toLowerCase().replace(/^\w/g, c => c.toUpperCase())
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
    convert()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

function loadSample() {
  inputText.value = `hello world. this is a TEST. another sentence here.`
  convert()
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

loadSample()
</script>
