<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文本相似度计算工具 - 编辑距离算法对比</h1>
      <p class="text-muted-foreground">专业的在线文本相似度计算工具，基于编辑距离(Levenshtein距离)算法计算两段文本的相似度。支持内容去重、查重检测、版本对比等场景。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 文本1输入区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">文本 1</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearText1"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteText1"
            >
              粘贴
            </button>
          </div>
        </div>
        <textarea
          v-model="text1"
          class="w-full h-40 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入第一段文本..."
          @input="calculate"
        ></textarea>
      </div>

      <!-- 文本2输入区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">文本 2</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearText2"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteText2"
            >
              粘贴
            </button>
          </div>
        </div>
        <textarea
          v-model="text2"
          class="w-full h-40 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入第二段文本..."
          @input="calculate"
        ></textarea>
      </div>
    </div>

    <!-- 相似度结果区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">相似度结果</h2>

      <div class="grid md:grid-cols-4 gap-4 mb-6">
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-3xl font-bold text-primary">{{ similarity }}%</div>
          <div class="text-sm text-muted-foreground">相似度</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-3xl font-bold text-primary">{{ distance }}</div>
          <div class="text-sm text-muted-foreground">编辑距离</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-3xl font-bold text-primary">{{ maxLen }}</div>
          <div class="text-sm text-muted-foreground">最大长度</div>
        </div>
        <div class="p-4 bg-muted rounded-lg text-center">
          <div class="text-3xl font-bold text-primary">{{ operation }}</div>
          <div class="text-sm text-muted-foreground">需要操作</div>
        </div>
      </div>

      <!-- 相似度进度条 -->
      <div class="mb-4">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-muted-foreground">相似度</span>
          <span class="text-foreground font-medium">{{ similarity }}%</span>
        </div>
        <div class="w-full bg-muted rounded-full h-4 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="similarity >= 80 ? 'bg-primary' : similarity >= 50 ? 'bg-yellow-500' : 'bg-destructive'"
            :style="{ width: `${similarity}%` }"
          ></div>
        </div>
        <div class="flex justify-between text-xs mt-1 text-muted-foreground">
          <span>不同</span>
          <span>相似</span>
          <span>几乎相同</span>
        </div>
      </div>
    </div>

    <!-- 计算说明区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">计算说明</h2>
      <div class="text-sm text-muted-foreground space-y-3">
        <p><strong class="text-foreground">编辑距离 (Levenshtein距离):</strong> 将一段文本转换为另一段文本所需的最少单字符编辑（插入、删除或替换）操作次数。</p>
        <p><strong class="text-foreground">相似度计算:</strong> 相似度 = (1 - 编辑距离 / 最大长度) × 100%</p>
        <p><strong class="text-foreground">应用场景:</strong> 内容去重、查重检测、版本对比、模糊匹配、数据清洗等。</p>
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
          什么是文本相似度？
        </h2>
        <p class="text-muted-foreground mb-4">
          文本相似度是指两段文本在内容上的相似程度。本工具使用Levenshtein编辑距离算法来计算相似度，
          这是一种衡量两个字符串差异程度的经典算法。编辑距离越小，相似度越高，表示两段文本越相似。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入或粘贴第一段文本</li>
          <li>在右侧输入框中输入或粘贴第二段文本</li>
          <li>系统会自动计算并显示相似度结果</li>
          <li>查看编辑距离、相似度百分比等详细指标</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          算法原理
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Levenshtein距离</strong>: 通过动态规划计算，将一个字符串转换为另一个字符串的最少编辑次数</li>
          <li><strong>编辑操作</strong>: 包括插入一个字符、删除一个字符、替换一个字符三种基本操作</li>
          <li><strong>相似度公式</strong>: 相似度 = (1 - 编辑距离/最大长度) × 100%</li>
          <li><strong>时间复杂度</strong>: O(m×n)，其中m和n分别是两段文本的长度</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">相似度和编辑距离有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              编辑距离是绝对值，表示需要多少次操作才能将一段文本转换为另一段；而相似度是相对值，
              以百分比形式表示两段文本的相似程度，更直观易懂。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">这个工具支持中文吗？</h3>
            <p class="text-muted-foreground mt-1">
              支持。本工具基于字符级别进行计算，无论是中文、英文还是其他语言，都能准确计算相似度。
              对于中文文本，每个汉字被视为一个字符。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">相似度多少算是相似？</h3>
            <p class="text-muted-foreground mt-1">
              这取决于具体应用场景。一般来说，相似度≥80%可视为高度相似，50%-80%为中等相似，
              &lt;50%为低相似度。在内容查重场景中，阈值可能需要设置得更高。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么空文本和任意文本的相似度是100%？</h3>
            <p class="text-muted-foreground mt-1">
              因为两段空文本的最大长度为0，根据相似度公式，0/0被视为100%。实际应用中，
              建议先检查文本是否为空，再进行相似度计算。
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
import { HelpCircle, ChevronUp, FileText, Type, Code, GitCompare } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '文本相似度计算工具 - 编辑距离算法对比 | Util工具箱',
  description: '免费在线文本相似度计算工具，基于编辑距离(Levenshtein距离)算法计算两段文本的相似度。支持内容去重、查重检测、版本对比等场景。',
  keywords: '文本相似度,编辑距离,Levenshtein,文本对比,模糊匹配,查重,内容去重,版本对比',
  author: 'Util工具箱',
  ogTitle: '文本相似度计算工具 - 编辑距离算法对比',
  ogDescription: '基于编辑距离算法计算两段文本的相似度，支持内容去重、查重检测、版本对比。',
  ogImage: 'https://www.util.cn/images/tools/text-similarity.png',
  ogUrl: 'https://www.util.cn/tools/text-similarity',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文本相似度计算工具 - 编辑距离算法对比',
  twitterDescription: '基于编辑距离算法计算两段文本的相似度，支持内容去重、查重检测。',
  twitterImage: 'https://www.util.cn/images/tools/text-similarity.png'
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
            name: '文本相似度计算工具',
            description: '在线文本相似度计算工具，基于编辑距离算法',
            url: 'https://www.util.cn/tools/text-similarity',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'Levenshtein编辑距离算法',
              '实时计算相似度',
              '显示详细指标',
              '支持多语言文本',
              '内容去重检测',
              '版本对比功能'
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
                name: '文本相似度',
                item: 'https://www.util.cn/tools/text-similarity'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '相似度和编辑距离有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '编辑距离是绝对值，表示需要多少次操作；而相似度是相对值，以百分比形式表示。'
                }
              },
              {
                '@type': 'Question',
                name: '这个工具支持中文吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '支持。本工具基于字符级别进行计算，无论是中文、英文还是其他语言，都能准确计算相似度。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const text1 = ref('')
const text2 = ref('')

const distance = ref(0)
const maxLen = ref(0)
const similarity = ref(100)
const operation = ref(0)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, Type, Code, GitCompare
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'text-similarity'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'text-diff'),
    tools.find(t => t.id === 'word-counter'),
    tools.find(t => t.id === 'duplicate-remover'),
    tools.find(t => t.id === 'text-case-converter')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

function calculate() {
  const t1 = text1.value
  const t2 = text2.value

  distance.value = levenshtein(t1, t2)
  maxLen.value = Math.max(t1.length, t2.length)
  similarity.value = maxLen.value > 0
    ? ((1 - distance.value / maxLen.value) * 100).toFixed(2)
    : '100.00'
  operation.value = distance.value
}

// Levenshtein距离算法
function levenshtein(s1, s2) {
  const len1 = s1.length
  const len2 = s2.length

  if (len1 === 0) return len2
  if (len2 === 0) return len1

  const matrix = []

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // 删除
          matrix[i][j - 1] + 1,    // 插入
          matrix[i - 1][j - 1] + 1  // 替换
        )
      }
    }
  }

  return matrix[len2][len1]
}

async function pasteText1() {
  try {
    text1.value = await navigator.clipboard.readText()
    calculate()
  } catch {}
}

async function pasteText2() {
  try {
    text2.value = await navigator.clipboard.readText()
    calculate()
  } catch {}
}

function clearText1() {
  text1.value = ''
  calculate()
}

function clearText2() {
  text2.value = ''
  calculate()
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
addRecentTool('text-similarity')

// 初始化示例
text1.value = 'hello world'
text2.value = 'hello word'
calculate()
</script>
