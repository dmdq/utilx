<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">字数统计工具</h1>
      <p class="text-muted-foreground">实时统计文本的字数、字符数、段落数、句子数等信息</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 文本输入区 -->
      <div class="bg-card   rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">输入文本</h2>
          <div class="flex gap-2">
            <button
              @click="pasteFromClipboard"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              粘贴文本
            </button>
            <button
              @click="clearText"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
        </div>

        <textarea
          v-model="inputText"
          @input="updateStatistics"
          placeholder="请输入或粘贴要统计的文本..."
          class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <!-- 统计信息 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-primary mb-1">{{ statistics.characters }}</div>
          <div class="text-sm text-muted-foreground">总字符数</div>
        </div>
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-primary mb-1">{{ statistics.charactersNoSpaces }}</div>
          <div class="text-sm text-muted-foreground">字符数（无空格）</div>
        </div>
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-primary mb-1">{{ statistics.words }}</div>
          <div class="text-sm text-muted-foreground">单词数</div>
        </div>
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-primary mb-1">{{ statistics.chineseCharacters }}</div>
          <div class="text-sm text-muted-foreground">中文字符</div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-primary mb-1">{{ statistics.paragraphs }}</div>
          <div class="text-sm text-muted-foreground">段落数</div>
        </div>
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-primary mb-1">{{ statistics.sentences }}</div>
          <div class="text-sm text-muted-foreground">句子数</div>
        </div>
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-primary mb-1">{{ statistics.lines }}</div>
          <div class="text-sm text-muted-foreground">行数</div>
        </div>
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-primary mb-1">{{ statistics.readingTime }}</div>
          <div class="text-sm text-muted-foreground">阅读时间（分钟）</div>
        </div>
      </div>

      <!-- 详细分析 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">详细分析</h2>

        <!-- 字符分布 -->
        <div class="space-y-4">
          <div>
            <h3 class="font-medium mb-2">字符类型分布</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span>中文字符</span>
                  <span class="font-mono">{{ statistics.chineseCharacters }}</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full transition-all"
                    :style="{ width: getPercentage(statistics.chineseCharacters, statistics.characters) + '%' }"
                  ></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span>英文单词</span>
                  <span class="font-mono">{{ statistics.englishWords }}</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full transition-all"
                    :style="{ width: getPercentage(statistics.englishWords, statistics.words) + '%' }"
                  ></div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span>数字</span>
                  <span class="font-mono">{{ statistics.numbers }}</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full transition-all"
                    :style="{ width: getPercentage(statistics.numbers, statistics.characters) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 词频统计 -->
          <div>
            <h3 class="font-medium mb-2">词频统计（Top 10）</h3>
            <div v-if="wordFrequency.length > 0" class="space-y-2">
              <div
                v-for="(item, index) in wordFrequency"
                :key="index"
                class="flex items-center justify-between text-sm p-2 bg-muted rounded"
              >
                <span class="flex items-center gap-2">
                  <span class="font-mono text-muted-foreground">#{{ index + 1 }}</span>
                  <span>{{ item.word }}</span>
                </span>
                <span class="font-mono text-primary">{{ item.count }} 次</span>
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground p-4 bg-muted rounded text-center">
              暂无词频统计
            </div>
          </div>

          <!-- 段落统计 -->
          <div>
            <h3 class="font-medium mb-2">段落统计</h3>
            <div v-if="paragraphStats.length > 0" class="space-y-2">
              <div
                v-for="(item, index) in paragraphStats"
                :key="index"
                class="p-3 bg-muted rounded text-sm"
              >
                <div class="flex justify-between mb-1">
                  <span class="font-medium">段落 {{ index + 1 }}</span>
                  <span class="text-muted-foreground">
                    {{ item.words }} 词 · {{ item.characters }} 字符
                  </span>
                </div>
                <div class="text-muted-foreground truncate">{{ item.preview }}</div>
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground p-4 bg-muted rounded text-center">
              暂无段落统计
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/markdown-editor"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Markdown编辑器</p>
              <p class="text-xs text-muted-foreground">实时预览编辑</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/case-converter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Type class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">大小写转换</p>
              <p class="text-xs text-muted-foreground">文本格式转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/text-replace"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">文本替换</p>
              <p class="text-xs text-muted-foreground">批量查找替换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { FileText, Type, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'text', name: '文本处理', description: '文本处理工具集合' }

// 状态管理
const inputText = ref('')

// 统计数据
const statistics = ref({
  characters: 0,
  charactersNoSpaces: 0,
  words: 0,
  chineseCharacters: 0,
  englishWords: 0,
  numbers: 0,
  paragraphs: 0,
  sentences: 0,
  lines: 0,
  readingTime: 0
})

// 词频统计
const wordFrequency = ref([])

// 段落统计
const paragraphStats = ref([])

// 更新统计信息
const updateStatistics = () => {
  const text = inputText.value

  // 总字符数
  statistics.value.characters = text.length

  // 字符数（无空格）
  statistics.value.charactersNoSpaces = text.replace(/\s/g, '').length

  // 中文字符数
  statistics.value.chineseCharacters = (text.match(/[\u4e00-\u9fa5]/g) || []).length

  // 数字个数
  statistics.value.numbers = (text.match(/\d/g) || []).length

  // 单词统计（英文）
  const englishWords = text.match(/[a-zA-Z]+/g) || []
  statistics.value.englishWords = englishWords.length

  // 单词总数（中英文）
  const chineseWords = text.match(/[\u4e00-\u9fa5]+/g) || []
  statistics.value.words = englishWords.length + chineseWords.length

  // 段落数
  statistics.value.paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length

  // 句子数
  statistics.value.sentences = (text.match(/[。！？.!?]+/g) || []).length

  // 行数
  statistics.value.lines = text.split('\n').length

  // 阅读时间（按每分钟200字计算）
  statistics.value.readingTime = Math.ceil(statistics.value.words / 200)

  // 词频统计
  updateWordFrequency()

  // 段落统计
  updateParagraphStats()
}

// 更新词频统计
const updateWordFrequency = () => {
  const text = inputText.value.toLowerCase()

  // 提取所有单词（中文和英文）
  const chineseWords = text.match(/[\u4e00-\u9fa5]+/g) || []
  const englishWords = text.match(/[a-zA-Z]+/g) || []

  // 合并所有单词
  const allWords = [...chineseWords, ...englishWords]

  // 统计词频
  const frequency = {}
  allWords.forEach(word => {
    if (word.length > 1) { // 过滤单字符
      frequency[word] = (frequency[word] || 0) + 1
    }
  })

  // 排序并取前10
  wordFrequency.value = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))
}

// 更新段落统计
const updateParagraphStats = () => {
  const paragraphs = inputText.value.split(/\n\s*\n/).filter(p => p.trim())

  paragraphStats.value = paragraphs.map(paragraph => {
    const words = paragraph.split(/\s+/).filter(w => w).length
    const characters = paragraph.length
    const preview = paragraph.substring(0, 50) + (paragraph.length > 50 ? '...' : '')

    return { words, characters, preview }
  })
}

// 计算百分比
const getPercentage = (value, total) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    updateStatistics()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 清空文本
const clearText = () => {
  inputText.value = ''
  updateStatistics()
}

// 初始化
updateStatistics()

// SEO配置
useSeoMeta({
  title: '字数统计工具 - 在线文本字数字符统计',
  description: '免费在线字数统计工具，实时统计文本字符数、单词数、段落数、句子数等详细信息，支持中英文统计。',
  keywords: ['字数统计', '字符统计', '单词统计', '在线工具', '文本分析']
})


</script>