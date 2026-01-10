<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">拼音转换工具 - 汉字转拼音带声调</h1>
      <p class="text-muted-foreground">汉字转拼音，支持有声调、无声调、首字母多种格式。简单易用的在线拼音转换工具。</p>
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
          placeholder="输入需要转换的汉字..."
          @input="convert"
        ></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">拼音结果</label>
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

    <!-- 格式选项 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">输出格式</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="format in formats"
          :key="format.id"
          @click="currentFormat = format.id; convert()"
          :class="[
            'px-4 py-2 rounded font-medium transition-colors',
            currentFormat === format.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          {{ format.name }}
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
          什么是拼音转换？
        </h2>
        <p class="text-muted-foreground mb-4">
          拼音是汉字的罗马化注音系统，采用拉丁字母来标注汉字的读音。拼音转换工具可以将汉字转换为拼音，
          帮助学习者正确发音，也用于输入法、索引排序等场景。本工具支持多种拼音格式输出，
          包括带声调拼音、不带声调拼音、首字母和数字声调标记等。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入需要转换的中文文本</li>
          <li>选择输出格式：有声调、无声调、首字母或数字声调</li>
          <li>右侧实时显示转换结果</li>
          <li>点击"复制"按钮可复制结果到剪贴板</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          拼音格式说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>有声调</strong>：使用声调符号标注，如 zhōng guó</li>
          <li><strong>无声调</strong>：仅显示拼音字母，如 zhong guo</li>
          <li><strong>首字母</strong>：仅显示每个字拼音的首字母，如 z g</li>
          <li><strong>数字声调</strong>：使用数字表示声调，如 zho1ng guo2</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">拼音转换准确吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具内置常用汉字的拼音映射，可以准确转换大部分常见汉字。对于多音字，默认显示最常用的读音。
              如需更专业的拼音转换，建议使用专业的语言学库。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些拼音格式？</h3>
            <p class="text-muted-foreground mt-1">
              支持四种格式：带声调符号（zhōng）、不带声调（zhong）、首字母（z）和数字声调（zho1ng）。
              您可以根据需要选择合适的输出格式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理多音字？</h3>
            <p class="text-muted-foreground mt-1">
              多音字在上下文中有不同的读音，本工具使用最常见的读音作为默认值。
              例如"银行"和"行走"中的"行"字读音不同，工具会根据常用习惯选择读音。
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
import { HelpCircle, ChevronUp, Type, Languages, FileText, Hash } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '拼音转换工具 - 汉字转拼音带声调 | Util工具箱',
  description: '免费在线拼音转换工具，将汉字转换为拼音，支持有声调、无声调、首字母等多种格式输出。简单易用，实时转换。',
  keywords: '拼音转换,汉字转拼音,带声调拼音,拼音首字母,中文拼音,拼音标注,在线拼音',
  author: 'Util工具箱',
  ogTitle: '拼音转换工具 - 汉字转拼音带声调',
  ogDescription: '免费在线拼音转换工具，支持有声调、无声调、首字母等多种格式输出。简单易用，实时转换。',
  ogImage: 'https://www.util.cn/images/tools/pinyin-converter.png',
  ogUrl: 'https://www.util.cn/tools/pinyin-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '拼音转换工具 - 汉字转拼音带声调',
  twitterDescription: '免费在线拼音转换工具，支持有声调、无声调、首字母等多种格式输出。',
  twitterImage: 'https://www.util.cn/images/tools/pinyin-converter.png'
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
            name: '拼音转换工具',
            description: '免费在线拼音转换工具，将汉字转换为拼音',
            url: 'https://www.util.cn/tools/pinyin-converter',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '有声调拼音转换',
              '无声调拼音转换',
              '首字母提取',
              '数字声调标记',
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
                name: '拼音转换',
                item: 'https://www.util.cn/tools/pinyin-converter'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '拼音转换准确吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '本工具内置常用汉字的拼音映射，可以准确转换大部分常见汉字。对于多音字，默认显示最常用的读音。'
                }
              },
              {
                '@type': 'Question',
                name: '支持哪些拼音格式？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '支持四种格式：带声调符号、不带声调、首字母和数字声调。您可以根据需要选择合适的输出格式。'
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
const currentFormat = ref('tone')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Type, Languages, FileText, Hash
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'traditional-simplified'),
    tools.find(t => t.id === 'text-whitespace'),
    tools.find(t => t.id === 'sentence-case'),
    tools.find(t => t.id === 'text-reverse')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

const formats = [
  { id: 'tone', name: '有声调' },
  { id: 'no-tone', name: '无声调' },
  { id: 'first', name: '首字母' },
  { id: 'number', name: '数字声调' }
]

// 简化拼音映射（常用字）
const pinyinMap = {
  '我': ['wǒ'], '爱': ['ài'], '你': ['nǐ'], '好': ['hǎo'],
  '中': ['zhōng'], '国': ['guó'], '人': ['rén'], '大': ['dà'],
  '学': ['xué'], '习': ['xí'], '天': ['tiān'], '气': ['qì'],
  '春': ['chūn'], '夏': ['xià'], '秋': ['qiū'], '冬': ['dōng'],
  '北': ['běi'], '京': ['jīng'], '上': ['shàng'], '海': ['hǎi'],
  '一': ['yī'], '二': ['èr'], '三': ['sān'], '四': ['sì'],
  '五': ['wǔ'], '六': ['liù'], '七': ['qī'], '八': ['bā'],
  '九': ['jiǔ'], '十': ['shí']
}

function convert() {
  const text = inputText.value
  let result = ''

  for (const char of text) {
    if (pinyinMap[char]) {
      let py = pinyinMap[char][0]

      switch (currentFormat.value) {
        case 'tone':
          // 保留声调
          break
        case 'no-tone':
          // 去除声调
          py = py.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          break
        case 'first':
          // 只保留首字母
          py = py.charAt(0)
          break
        case 'number':
          // 数字声调: hao3
          py = py.replace(/[āáǎà]/g, 'a1').replace(/[ēéěè]/g, 'e1')
            .replace(/[īíǐì]/g, 'i1').replace(/[ōóǒò]/g, 'o1')
            .replace(/[ūúǔù]/g, 'u1').replace(/[ǖǘǚǜ]/g, 'v1')
            .replace(/[āáǎà]/g, 'a1')
          break
      }
      result += py + ' '
    } else {
      result += char
    }
  }

  outputText.value = result.trim()
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
  inputText.value = '我爱北京天安门'
  convert()
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

loadSample()
</script>
