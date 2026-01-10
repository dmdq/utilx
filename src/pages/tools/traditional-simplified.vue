<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">繁简体转换工具 - 繁体字与简体字互转</h1>
      <p class="text-muted-foreground">繁体字与简体字相互转换，支持常见词汇转换。简单易用的在线繁简转换工具。</p>
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
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入需要转换的繁体或简体中文..."
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
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          @click="direction = 's2t'; convert()"
          :class="[
            'px-4 py-2 rounded font-medium transition-colors',
            direction === 's2t'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          简体 → 繁体
        </button>
        <button
          @click="direction = 't2s'; convert()"
          :class="[
            'px-4 py-2 rounded font-medium transition-colors',
            direction === 't2s'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          繁体 → 简体
        </button>
      </div>

      <div class="flex items-center gap-2">
        <label class="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            v-model="options.phraseConversion"
            @change="convert"
            class="rounded"
          >
          <span>启用词汇转换（更准确但可能改变原意）</span>
        </label>
      </div>
    </div>

    <!-- 常见示例 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">常见繁简对照示例</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div v-for="item in examples" :key="item.simplified" class="p-3 bg-muted rounded border border-border">
          <div class="flex justify-between mb-1">
            <span class="text-muted-foreground">简体:</span>
            <span class="font-medium text-foreground">{{ item.simplified }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">繁体:</span>
            <span class="font-medium text-foreground">{{ item.traditional }}</span>
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
          什么是繁简体转换？
        </h2>
        <p class="text-muted-foreground mb-4">
          繁体字和简体字是汉字的两种书写形式。简体字是20世纪50年代中国大陆推行的简化汉字方案，
          而繁体字则保留了更多的原始笔画和结构。繁简体转换工具可以帮助用户在两种形式之间进行转换，
          方便不同地区的中文用户阅读和交流。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入需要转换的繁体或简体中文</li>
          <li>选择转换方向：简体转繁体或繁体转简体</li>
          <li>可选择是否启用词汇转换以提高准确性</li>
          <li>右侧实时显示转换结果，可复制使用</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          转换模式说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>简体 → 繁体</strong>：将简体字转换为繁体字，适用于面向港台用户的场景</li>
          <li><strong>繁体 → 简体</strong>：将繁体字转换为简体字，适用于面向大陆用户的场景</li>
          <li><strong>词汇转换</strong>：智能转换常见词汇，如"软件"→"軟件"，更准确但可能改变原意</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">转换准确吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具内置常用汉字的繁简对照表，可以准确转换大部分常见汉字。启用词汇转换功能可以提高准确性，
              但可能会改变某些专业术语的原意。对于专业文献，建议人工校对。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是词汇转换？</h3>
            <p class="text-muted-foreground mt-1">
              词汇转换是指将常见的简体词汇转换为对应的繁体词汇，如"软件"转换为"軟件"、"网络"转换为"網絡"。
              这可以提高转换的地道性，但可能不适用于某些专业术语。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么有些字转换后没变化？</h3>
            <p class="text-muted-foreground mt-1">
              有些汉字在繁体和简体中写法相同，如"人"、"大"、"天"等字，这些字转换后不会发生变化。
              还有一些字不在本工具的字典中，也会保持原样。
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
import { HelpCircle, ChevronUp, Languages, FileText, Type } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '繁简体转换工具 - 繁体字与简体字互转 | Util工具箱',
  description: '免费在线繁简体转换工具，支持繁体字与简体字相互转换，支持常见词汇转换。简单易用，实时转换。',
  keywords: '繁简体转换,繁体转简体,简体转繁体,中文转换,汉字转换,繁体字,简体字',
  author: 'Util工具箱',
  ogTitle: '繁简体转换工具 - 繁体字与简体字互转',
  ogDescription: '免费在线繁简体转换工具，支持繁体字与简体字相互转换，支持常见词汇转换。',
  ogImage: 'https://www.util.cn/images/tools/traditional-simplified.png',
  ogUrl: 'https://www.util.cn/tools/traditional-simplified',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '繁简体转换工具 - 繁体字与简体字互转',
  twitterDescription: '免费在线繁简体转换工具，支持繁体字与简体字相互转换，支持常见词汇转换。',
  twitterImage: 'https://www.util.cn/images/tools/traditional-simplified.png'
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
            name: '繁简体转换工具',
            description: '免费在线繁简体转换工具，支持繁体字与简体字相互转换',
            url: 'https://www.util.cn/tools/traditional-simplified',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '简体转繁体',
              '繁体转简体',
              '词汇智能转换',
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
                name: '繁简体转换',
                item: 'https://www.util.cn/tools/traditional-simplified'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '转换准确吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '本工具内置常用汉字的繁简对照表，可以准确转换大部分常见汉字。启用词汇转换功能可以提高准确性。'
                }
              },
              {
                '@type': 'Question',
                name: '什么是词汇转换？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '词汇转换是指将常见的简体词汇转换为对应的繁体词汇，如"软件"转换为"軟件"、"网络"转换为"網絡"。'
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
const direction = ref('s2t')
const options = ref({
  phraseConversion: true
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Languages, FileText, Type
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'pinyin-converter'),
    tools.find(t => t.id === 'text-whitespace'),
    tools.find(t => t.id === 'sentence-case'),
    tools.find(t => t.id === 'text-reverse')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 简化的繁简对照表（常用字）
const charMap = {
  // 简体 -> 繁体
  '爱': '愛', '国': '國', '语': '語', '学': '學', '习': '習',
  '长': '長', '开': '開', '关': '關', '门': '門', '东': '東',
  '车': '車', '马': '馬', '龙': '龍', '风': '風', '华': '華',
  '书': '書', '农': '農', '头': '頭', '见': '見', '觉': '覺',
  '贝': '貝', '车': '車', '东': '東', '冈': '岡', '业': '業',
  '电': '電', '钟': '鐘', '表': '錶', '识': '識', '专': '專'
}

// 繁体 -> 简体（反转映射）
const reverseMap = {}
Object.entries(charMap).forEach(([s, t]) => {
  reverseMap[t] = s
})

// 词汇对照表
const phraseMap = {
  // 简体 -> 繁体
  '软件': '軟件', '硬件': '硬件', '互联网': '互聯網', '网络': '網絡',
  '电脑': '電腦', '电话': '電話', '手机': '手機', '程序': '程式',
  '信息': '信息', '数据': '數據', '系统': '系統', '文件': '文件',
  '服务器': '服務器', '数据库': '數據庫', '算法': '算法', '内存': '內存'
}

const reversePhraseMap = {}
Object.entries(phraseMap).forEach(([s, t]) => {
  reversePhraseMap[t] = s
})

const examples = [
  { simplified: '我爱你', traditional: '我愛你' },
  { simplified: '中国', traditional: '中國' },
  { simplified: '学习', traditional: '學習' },
  { simplified: '电脑', traditional: '電腦' },
  { simplified: '网络', traditional: '網絡' },
  { simplified: '软件', traditional: '軟件' }
]

function convert() {
  let text = inputText.value

  if (direction.value === 's2t') {
    // 简体 -> 繁体
    // 先转换词汇
    if (options.value.phraseConversion) {
      Object.entries(phraseMap).forEach(([s, t]) => {
        text = text.split(s).join(t)
      })
    }
    // 再转换单字
    text = text.split('').map(c => charMap[c] || c).join('')
  } else {
    // 繁体 -> 简体
    if (options.value.phraseConversion) {
      Object.entries(reversePhraseMap).forEach(([t, s]) => {
        text = text.split(t).join(s)
      })
    }
    text = text.split('').map(c => reverseMap[c] || c).join('')
  }

  outputText.value = text
}

function clearInput() {
  inputText.value = ''
  outputText.value = ''
}

async function pasteText() {
  try {
    inputText.value = await navigator.clipboard.readText()
    convert()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制')
  } catch {}
}

function loadSample() {
  direction.value = 's2t'
  inputText.value = '我喜欢使用电脑软件和网络。'
  convert()
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
loadSample()
</script>
