<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Download, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '词云生成器 - 在线文本词云分析工具 | 词频统计可视化',
  description: '免费在线词云生成工具，支持文本分析生成词云图，可自定义颜色、字体、布局样式，可导出为图片，适用于数据可视化和文本分析。',
  keywords: '词云,词云生成,文本分析,词频统计,数据可视化,在线词云',
  author: 'Util工具箱',
  ogTitle: '词云生成器 - 免费在线文本词云分析工具',
  ogDescription: '专业的词云生成工具，支持文本分析、词频统计、自定义样式，可导出为图片。',
  ogType: 'website'
})

// 输入文本
const inputText = ref('')

// 词云配置
const cloudConfig = ref({
  maxWords: 100,
  minWordLength: 2,
  backgroundColor: '#ffffff',
  colorScheme: 'colorful',
  fontFamily: 'Arial',
  layout: 'horizontal',
  minFontSize: 16,
  maxFontSize: 80
})

// 词频统计结果
const wordFrequency = ref([])

// 停用词列表
const stopWords = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
])

// 颜色方案
const colorSchemes = {
  colorful: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'],
  warm: ['#FF6B6B', '#FFA07A', '#FFD93D', '#FF8C42', '#FF6347', '#FFB347', '#FF7F50', '#FFA500'],
  cool: ['#4ECDC4', '#45B7D1', '#85C1E2', '#5DADE2', '#48C9B0', '#76D7C4', '#A3E4D7', '#D4E6F1'],
  monochrome: ['#2C3E50', '#34495E', '#5D6D7E', '#808B96', '#ABB2B9', '#D5D8DC', '#EAEDED', '#F8F9F9'],
  pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4', '#D4F1F4', '#FFC3A0']
}

// 字体选项
const fontFamilies = {
  Arial: 'Arial, sans-serif',
  'Microsoft YaHei': 'Microsoft YaHei, sans-serif',
  'SimSun': 'SimSun, serif',
  'KaiTi': 'KaiTi,楷体, serif',
  'Georgia': 'Georgia, serif',
  'Impact': 'Impact, sans-serif',
  'Courier New': 'Courier New, monospace',
  'Times New Roman': 'Times New Roman, serif'
}

// 画布引用
const canvasRef = ref(null)

// 分析文本
const analyzeText = () => {
  if (!inputText.value.trim()) {
    wordFrequency.value = []
    return
  }

  const words = inputText.value.toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/gi, ' ')
    .split(/\s+/)

  const frequency = {}

  words.forEach(word => {
    if (word.length >= cloudConfig.value.minWordLength && !stopWords.has(word)) {
      frequency[word] = (frequency[word] || 0) + 1
    }
  })

  const sorted = Object.entries(frequency)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, cloudConfig.value.maxWords)

  wordFrequency.value = sorted
}

// 获取词云颜色
const getWordColor = (index, total) => {
  const scheme = colorSchemes[cloudConfig.value.colorScheme]
  return scheme[index % scheme.length]
}

// 计算字体大小
const getFontSize = (count, maxCount, minCount) => {
  const range = maxCount - minCount
  if (range === 0) return cloudConfig.value.minFontSize

  const normalized = (count - minCount) / range
  return Math.round(
    cloudConfig.value.minFontSize +
    normalized * (cloudConfig.value.maxFontSize - cloudConfig.value.minFontSize)
  )
}

// 生成词云
const generateWordCloud = async () => {
  analyzeText()

  await nextTick()

  if (!canvasRef.value || wordFrequency.value.length === 0) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  canvas.width = 800
  canvas.height = 600

  ctx.fillStyle = cloudConfig.value.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (wordFrequency.value.length === 0) return

  const maxCount = wordFrequency.value[0].count
  const minCount = wordFrequency.value[wordFrequency.value.length - 1].count

  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const placedWords = []

  wordFrequency.value.forEach((item, index) => {
    const fontSize = getFontSize(item.count, maxCount, minCount)
    ctx.font = `${fontSize}px ${cloudConfig.value.fontFamily}`
    ctx.fillStyle = getWordColor(index, wordFrequency.value.length)

    const metrics = ctx.measureText(item.word)
    const wordWidth = metrics.width
    const wordHeight = fontSize

    let placed = false
    let angle = 0
    let radius = 0
    const maxRadius = Math.min(canvas.width, canvas.height) / 2

    while (!placed && radius < maxRadius) {
      const x = centerX + radius * Math.cos(angle) - wordWidth / 2
      const y = centerY + radius * Math.sin(angle) + wordHeight / 2

      let overlaps = false
      for (const placed of placedWords) {
        if (
          x < placed.x + placed.width &&
          x + wordWidth > placed.x &&
          y - wordHeight < placed.y &&
          y > placed.y - placed.height
        ) {
          overlaps = true
          break
        }
      }

      if (!overlaps) {
        ctx.save()

        if (cloudConfig.value.layout === 'vertical') {
          ctx.translate(x + wordWidth / 2, y - wordHeight / 2)
          ctx.rotate(-Math.PI / 2)
          ctx.fillText(item.word, -wordWidth / 2, wordHeight / 3)
        } else if (cloudConfig.value.layout === 'mixed' && index % 2 === 1) {
          ctx.translate(x + wordWidth / 2, y - wordHeight / 2)
          ctx.rotate(-Math.PI / 2)
          ctx.fillText(item.word, -wordWidth / 2, wordHeight / 3)
        } else {
          ctx.fillText(item.word, x, y - wordHeight / 3)
        }

        ctx.restore()

        placedWords.push({
          x,
          y: y - wordHeight,
          width: wordWidth,
          height: wordHeight
        })

        placed = true
      }

      angle += 0.5
      if (angle > Math.PI * 2) {
        angle = 0
        radius += 10
      }
    }
  })
}

// 导出为图片
const exportAsImage = () => {
  if (!canvasRef.value || wordFrequency.value.length === 0) return

  const link = document.createElement('a')
  link.download = `词云_${new Date().toLocaleDateString('zh-CN')}.png`
  link.href = canvasRef.value.toDataURL('image/png')
  link.click()
}

// 加载示例文本
const loadSample = () => {
  inputText.value = `人工智能 机器学习 深度学习 神经网络 数据科学 大数据 云计算 区块链 物联网 虚拟现实 增强现实 自然语言处理 计算机视觉 算法 模型 训练 推理 优化 框架 TensorFlow PyTorch 数据挖掘 特征工程 分类 回归 聚类 降维 监督学习 无监督学习 强化学习 迁移学习 生成对抗网络 Transformer 注意力机制 BERT GPT 预训练 微调 NLP CV 推荐系统 搜索引擎 知识图谱 智能客服 自动驾驶 智能家居 智慧城市 数字化转型 科技创新 未来`
  generateWordCloud()
}

// 清空
const clear = () => {
  inputText.value = ''
  wordFrequency.value = []
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    ctx.fillStyle = cloudConfig.value.backgroundColor
    ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

// 统计信息
const stats = computed(() => {
  if (wordFrequency.value.length === 0) {
    return { totalWords: 0, uniqueWords: 0, topWord: '-' }
  }

  const totalWords = wordFrequency.value.reduce((sum, item) => sum + item.count, 0)
  const topWord = wordFrequency.value[0]?.word || '-'

  return {
    totalWords,
    uniqueWords: wordFrequency.value.length,
    topWord
  }
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'text-statistics'),
  tools.find(t => t.id === 'ascii-art-generator'),
  tools.find(t => t.id === 'keyword-extractor'),
  tools.find(t => t.id === 'image-converter')
].filter(Boolean)

// 防抖定时器
const debounceTimer = ref(null)

// 监听配置变化
watch(cloudConfig, () => {
  if (wordFrequency.value.length > 0) {
    generateWordCloud()
  }
}, { deep: true })

// 监听文本输入（带防抖）
watch(inputText, () => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }

  debounceTimer.value = setTimeout(() => {
    if (inputText.value.trim()) {
      analyzeText()
      generateWordCloud()
    }
  }, 500)
})
</script>

<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">词云生成器 - 在线文本词云分析工具</h1>
      <p class="text-muted-foreground">免费在线词云生成工具，支持文本分析生成词云图，可自定义颜色、字体、布局样式，可导出为图片，适用于数据可视化和文本分析。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入和配置 -->
      <div class="space-y-4">
        <!-- 文本输入 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-3">输入文本</h3>
          <textarea
            v-model="inputText"
            class="w-full h-48 px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
            placeholder="输入要分析的文本..."
          ></textarea>
          <div class="flex gap-2 mt-3">
            <button
              @click="generateWordCloud"
              :disabled="!inputText.trim()"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition text-sm"
            >
              生成词云
            </button>
            <button
              @click="clear"
              class="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition text-sm"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 统计信息 -->
        <div v-if="wordFrequency.length > 0" class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-3">统计信息</h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-foreground">{{ stats.totalWords }}</div>
              <div class="text-xs text-muted-foreground">总词频</div>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-foreground">{{ stats.uniqueWords }}</div>
              <div class="text-xs text-muted-foreground">唯一词</div>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-foreground truncate">{{ stats.topWord }}</div>
              <div class="text-xs text-muted-foreground">最高频</div>
            </div>
          </div>
        </div>

        <!-- 词频列表 -->
        <div v-if="wordFrequency.length > 0" class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-3">词频排行 (前20)</h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in wordFrequency.slice(0, 20)"
              :key="item.word"
              class="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                  :style="{ backgroundColor: getWordColor(index, 20) }"
                >
                  {{ index + 1 }}
                </span>
                <span class="font-medium text-foreground">{{ item.word }}</span>
              </div>
              <span class="text-primary font-mono font-bold">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <!-- 样式配置 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-3">样式配置</h3>
          <div class="space-y-4">
            <div>
              <label class="text-xs text-muted-foreground mb-2 block">颜色方案</label>
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="(colors, key) in colorSchemes"
                  :key="key"
                  @click="cloudConfig.colorScheme = key"
                  :class="[
                    'p-2 rounded-lg border-2 transition',
                    cloudConfig.colorScheme === key ? 'border-primary' : 'border-border'
                  ]"
                >
                  <div class="flex gap-0.5">
                    <div
                      v-for="color in colors.slice(0, 5)"
                      :key="color"
                      class="w-3 h-3 rounded-sm"
                      :style="{ backgroundColor: color }"
                    ></div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">字体</label>
              <select
                v-model="cloudConfig.fontFamily"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option v-for="(font, name) in fontFamilies" :key="name" :value="font">
                  {{ name }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">布局方向</label>
              <select
                v-model="cloudConfig.layout"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="horizontal">水平</option>
                <option value="vertical">垂直</option>
                <option value="mixed">混合</option>
              </select>
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">字体大小范围</label>
              <div class="flex gap-2 items-center">
                <input
                  v-model.number="cloudConfig.minFontSize"
                  type="number"
                  min="8"
                  max="50"
                  class="flex-1 px-2 py-1 bg-muted border border-border border-border rounded text-sm"
                />
                <span class="text-muted-foreground">-</span>
                <input
                  v-model.number="cloudConfig.maxFontSize"
                  type="number"
                  min="20"
                  max="200"
                  class="flex-1 px-2 py-1 bg-muted border border-border border-border rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">最大词数: {{ cloudConfig.maxWords }}</label>
              <input
                v-model.number="cloudConfig.maxWords"
                type="range"
                min="10"
                max="200"
                class="w-full"
              />
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">最小词长: {{ cloudConfig.minWordLength }}</label>
              <input
                v-model.number="cloudConfig.minWordLength"
                type="range"
                min="1"
                max="5"
                class="w-full"
              />
            </div>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">背景颜色</label>
              <div class="flex gap-2 items-center">
                <input
                  v-model="cloudConfig.backgroundColor"
                  type="color"
                  class="w-12 h-8 rounded cursor-pointer"
                />
                <input
                  v-model="cloudConfig.backgroundColor"
                  type="text"
                  class="flex-1 px-2 py-1 bg-muted border border-border border-border rounded text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：词云画布 -->
      <div class="lg:col-span-2">
        <div class="bg-card border border-border rounded-lg overflow-hidden h-full">
          <div class="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 class="text-sm font-medium text-foreground">词云预览</h3>
            <div class="flex gap-2">
              <button
                @click="loadSample"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                加载示例
              </button>
              <button
                @click="exportAsImage"
                :disabled="wordFrequency.length === 0"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 disabled:bg-muted disabled:text-muted-foreground rounded text-muted-foreground flex items-center gap-1"
              >
                <Download :size="14" />
                导出
              </button>
            </div>
          </div>
          <div class="p-6 flex items-center justify-center" style="min-height: 600px;">
            <canvas
              ref="canvasRef"
              class="border border-border rounded-lg"
              width="800"
              height="600"
            ></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="p-6 mb-12 relative">
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
          什么是词云？
        </h2>
        <p class="text-muted-foreground mb-4">
          词云（Word Cloud）是一种文本数据可视化形式，通过将文本中出现频率较高的词汇以更大的字体显示，
          而出现频率较低的词汇以较小的字体显示，从而直观地展示文本的核心内容。
          词云被广泛应用于文本分析、关键词提取、数据可视化等场景。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中粘贴或输入要分析的文本</li>
          <li>点击"生成词云"按钮，系统会自动分析词频</li>
          <li>在样式配置中调整颜色、字体、布局等参数</li>
          <li>点击"导出"按钮将词云保存为图片</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>智能分词</strong>：支持中文和英文分词，自动过滤停用词</li>
          <li><strong>词频统计</strong>：实时统计词频，显示词频排行</li>
          <li><strong>自定义样式</strong>：支持多种颜色方案、字体和布局</li>
          <li><strong>图片导出</strong>：一键导出为PNG图片</li>
          <li><strong>本地处理</strong>：所有处理都在浏览器本地完成，保护隐私</li>
        </ul>
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
              :is="relatedTool.icon"
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
