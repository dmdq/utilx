<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">全角半角转换工具 - 全角与半角字符互转</h1>
      <p class="text-muted-foreground">在线全角半角转换工具，支持字母、数字、标点符号的全角与半角互转，适用于中英文混合文本处理。纯本地计算，数据隐私绝对安全。</p>
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
          placeholder="在此输入需要转换的文本..."
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
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg font-mono text-sm resize-none"
          placeholder="转换后的文本将显示在这里..."
          readonly
        ></textarea>
      </div>
    </div>

    <!-- 转换选项 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-lg font-semibold text-foreground mb-4">转换选项</h2>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="option in options"
          :key="option.id"
          @click="currentOption = option.id; convert()"
          :class="[
            'px-4 py-2 rounded transition-colors font-medium',
            currentOption === option.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          ]"
        >
          {{ option.name }}
        </button>
      </div>
    </div>

    <!-- SEO 内容区 -->
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
          什么是全角半角？
        </h2>
        <p class="text-muted-foreground mb-4">
          全角和半角是字符编码中的两种显示形式。全角字符（Full-width）通常占用两个标准字符宽度，
          主要用于中文排版中与汉字对齐；半角字符（Half-width）占用一个标准字符宽度，是英文和数字的标准显示形式。
        </p>
        <p class="text-muted-foreground mb-4">
          在中文文档中，如果混用全角和半角字符，会导致排版不整齐。全角半角转换工具可以帮助您统一字符格式，
          使文档更加美观规范。常见的应用场景包括：统一标点符号格式、规范化中英文混合文本、调整代码中的字符宽度等。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          全角半角对照表
        </h2>
        <div class="bg-muted p-4 rounded-lg mb-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-2 px-4 text-foreground">字符类型</th>
                <th class="text-left py-2 px-4 text-foreground">半角</th>
                <th class="text-left py-2 px-4 text-foreground">全角</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border">
                <td class="py-2 px-4 text-muted-foreground">英文字母</td>
                <td class="py-2 px-4 font-mono">A-Z, a-z</td>
                <td class="py-2 px-4 font-mono">Ａ-Ｚ, ａ-ｚ</td>
              </tr>
              <tr class="border-b border-border">
                <td class="py-2 px-4 text-muted-foreground">数字</td>
                <td class="py-2 px-4 font-mono">0-9</td>
                <td class="py-2 px-4 font-mono">０-９</td>
              </tr>
              <tr class="border-b border-border">
                <td class="py-2 px-4 text-muted-foreground">标点符号</td>
                <td class="py-2 px-4 font-mono">，。！？</td>
                <td class="py-2 px-4 font-mono">，。！？</td>
              </tr>
              <tr>
                <td class="py-2 px-4 text-muted-foreground">空格</td>
                <td class="py-2 px-4 font-mono">␣</td>
                <td class="py-2 px-4 font-mono">　</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入需要转换的文本</li>
          <li>选择转换类型（全角转半角、半角转全角、仅标点转换等）</li>
          <li>右侧自动显示转换结果</li>
          <li>点击"复制"按钮复制结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>文档排版:</strong> 统一中英文混合文档的字符格式，使排版更加整齐</li>
          <li><strong>标点规范化:</strong> 将中文标点转换为全角，英文标点转换为半角</li>
          <li><strong>代码处理:</strong> 统一代码中的字符宽度，避免编码问题</li>
          <li><strong>数据清洗:</strong> 批量转换数据库或表格中的字符格式</li>
          <li><strong>网页优化:</strong> 统一网页文本的显示格式，提升用户体验</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">全角和半角有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              主要区别在于字符占用的宽度和编码方式。全角字符占用两个字节，宽度是标准字符的两倍；
              半角字符占用一个字节，宽度是标准的字符宽度。在中文环境中，全角字符通常用于与汉字对齐。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么要转换全角半角？</h3>
            <p class="text-muted-foreground mt-1">
              转换全角半角主要有几个原因：一是统一文档格式，使排版更加整齐；二是避免编码问题，
              某些系统可能不支持全角字符；三是满足特定场景的要求，如编程代码通常使用半角字符。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线转换安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的全角半角转换工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器，确保隐私安全。
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
import {
  ArrowLeftRight, Code, FileText, Hash, Type, Scissors, Sparkles, Settings,
  ChevronUp, HelpCircle, BarChart3, FileDiff
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '全角半角转换工具 - 全角与半角字符互转 | Util工具箱',
  description: '免费在线全角半角转换工具，支持字母、数字、标点符号的全角与半角互转。纯本地计算，数据安全隐私。',
  keywords: '全角半角转换,全角转半角,半角转全角,字符转换,中英文处理,标点符号转换',
  author: 'Util工具箱',
  ogTitle: '全角半角转换工具 - 全角与半角字符互转',
  ogDescription: '专业的全角半角转换工具，支持字母、数字、标点符号的全角与半角互转。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/full-half-converter.png',
  ogUrl: 'https://www.util.cn/tools/full-half-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '全角半角转换工具 - 全角与半角字符互转',
  twitterDescription: '专业的全角半角转换工具，支持字母、数字、标点符号的全角与半角互转。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/full-half-converter.png'
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
            name: '全角半角转换工具',
            description: '在线全角半角转换工具，支持字母、数字、标点符号的全角与半角互转',
            url: 'https://www.util.cn/tools/full-half-converter',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '全角转半角',
              '半角转全角',
              '仅标点转半角',
              '仅标点转全角',
              '实时转换',
              '本地安全处理',
              '批量转换',
              '一键复制结果'
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
                name: '全角半角转换',
                item: 'https://www.util.cn/tools/full-half-converter'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '全角和半角有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '主要区别在于字符占用的宽度和编码方式。全角字符占用两个字节，宽度是标准字符的两倍；半角字符占用一个字节，宽度是标准的字符宽度。'
                }
              },
              {
                '@type': 'Question',
                name: '为什么要转换全角半角？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '转换全角半角主要用于统一文档格式、避免编码问题、满足特定场景要求（如编程代码通常使用半角字符）。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// 输入输出数据
const inputText = ref('')
const outputText = ref('')
const currentOption = ref('to-half')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 转换选项
const options = [
  { id: 'to-half', name: '全角→半角' },
  { id: 'to-full', name: '半角→全角' },
  { id: 'to-half-punct', name: '仅标点转半角' },
  { id: 'to-full-punct', name: '仅标点转全角' }
]

// 全角半角映射
const fullWidthToHalfWidthMap = {}
const halfWidthToFullWidthMap = {}

// 字母数字映射
for (let i = 0; i < 26; i++) {
  const lower = String.fromCharCode(97 + i)
  const upper = String.fromCharCode(65 + i)
  fullWidthToHalfWidthMap[String.fromCharCode(65313 + i)] = lower // ａ-ｚ
  fullWidthToHalfWidthMap[String.fromCharCode(65281 + i)] = upper // Ａ-Ｚ
  halfWidthToFullWidthMap[lower] = String.fromCharCode(65313 + i)
  halfWidthToFullWidthMap[upper] = String.fromCharCode(65281 + i)
}

for (let i = 0; i < 10; i++) {
  const digit = String.fromCharCode(48 + i)
  fullWidthToHalfWidthMap[String.fromCharCode(65296 + i)] = digit // ０-９
  halfWidthToFullWidthMap[digit] = String.fromCharCode(65296 + i)
}

// 标点符号映射
const punctuations = [
  ['，', ','], ['。', '.'], ['！', '!'], ['？', '?'],
  ['：', ':'], ['；', ';'], ['（', '('], ['）', ')'],
  ['【', '['], ['】', ']'], ['「', '"'], ['」', '"'],
  ['『', "'"], ['』', "'"], ['《', '<'], ['》', '>'],
  ['、', ','], ['＠', '@'], ['＃', '#'], ['＄', '$'],
  ['％', '%'], ['＆', '&'], ['＊', '*'], ['＋', '+'],
  ['－', '-'], ['／', '/'], ['：', ':'], ['＜', '<'],
  ['＝', '='], ['＞', '>'], ['？', '?'], ['［', '['],
  ['＼', '\\'], ['］', ']'], ['＾', '^'], ['＿', '_'],
  ['｀', '`'], ['｛', '{'], ['｜', '|'], ['｝', '}'],
  ['～', '~']
]

punctuations.forEach(([full, half]) => {
  fullWidthToHalfWidthMap[full] = half
  halfWidthToFullWidthMap[half] = full
})

// 空格
fullWidthToHalfWidthMap['　'] = ' '
halfWidthToFullWidthMap[' '] = '　'

// 图标映射
const iconMap = {
  ArrowLeftRight, Code, FileText, Hash, Type, Scissors, Sparkles, Settings,
  BarChart3, FileDiff
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'full-half-converter'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'text-escape'),
    tools.find(t => t.id === 'text-split-merge'),
    tools.find(t => t.id === 'text-cleaner'),
    tools.find(t => t.id === 'text-statistics')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 转换函数
function convert() {
  let text = inputText.value

  if (currentOption.value === 'to-half') {
    text = text.replace(/[\uFF01-\uFF5E]/g, char => fullWidthToHalfWidthMap[char] || char)
  } else if (currentOption.value === 'to-full') {
    text = text.replace(/[a-zA-Z0-9\s!,.?;:()\[\]"'<>{}/\\|^_~@#$%&*+\-]/g, char => halfWidthToFullWidthMap[char] || char)
  } else if (currentOption.value === 'to-half-punct') {
    punctuations.forEach(([full, half]) => {
      text = text.split(full).join(half)
    })
    text = text.replace(/　/g, ' ')
  } else if (currentOption.value === 'to-full-punct') {
    punctuations.forEach(([full, half]) => {
      text = text.split(half).join(full)
    })
    text = text.replace(/ /g, '　')
  }

  outputText.value = text
}

// 清空输入
function clearInput() {
  inputText.value = ''
  outputText.value = ''
}

// 粘贴文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    convert()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 复制结果
async function copyResult() {
  if (!outputText.value) return

  try {
    await navigator.clipboard.writeText(outputText.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 加载示例
function loadSample() {
  inputText.value = 'Ｈｅｌｌｏ　Ｗｏｒｌｄ！１２３，ＡＢＣ。'
  convert()
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化示例
loadSample()
</script>
