<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Quote class="w-8 h-8 text-primary" />
        随机名言/句子
      </h1>
      <p class="text-muted-foreground">随机显示名言警句、电影台词或有趣句子</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 分类选择 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">句子分类</h2>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="category in quoteCategories"
            :key="category.id"
            :class="[
              'p-4 border rounded-lg cursor-pointer transition-all',
              selectedCategories.includes(category.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            ]"
            @click="toggleCategory(category.id)"
          >
            <div class="flex items-center gap-3 mb-2">
              <component :is="category.icon" class="w-5 h-5 text-primary" />
              <h3 class="font-semibold">{{ category.name }}</h3>
            </div>
            <p class="text-sm text-muted-foreground">{{ category.description }}</p>
            <div class="text-xs text-muted-foreground mt-2">
              {{ category.count }} 条
            </div>
          </div>
        </div>
      </div>

      <!-- 显示设置 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">显示设置</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 语言选择 -->
          <div>
            <label class="text-sm font-medium mb-2 block">语言选择</label>
            <select v-model="selectedLanguage" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="chinese">中文</option>
              <option value="english">English</option>
              <option value="mixed">混合</option>
            </select>
          </div>

          <!-- 显示数量 -->
          <div>
            <label class="text-sm font-medium mb-2 block">显示数量</label>
            <div class="flex gap-2">
              <input
                v-model.number="displayCount"
                type="number"
                min="1"
                max="10"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">条</span>
            </div>
          </div>

          <!-- 排序方式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">排序方式</label>
            <select v-model="sortBy" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="random">随机</option>
              <option value="latest">最新</option>
              <option value="popular">热门</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="generateQuotes"
          :disabled="isGenerating || selectedCategories.length === 0"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isGenerating" class="w-5 h-5 animate-spin" />
          <Quote v-else class="w-5 h-5" />
          {{ isGenerating ? '获取中...' : '获取句子' }}
        </button>

        <button
          @click="shuffleQuotes"
          :disabled="currentQuotes.length === 0"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Shuffle class="w-5 h-5" />
          重新随机
        </button>

        <button
          v-if="currentQuotes.length > 0"
          @click="clearQuotes"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Trash2 class="w-5 h-5" />
          清空结果
        </button>
      </div>

      <!-- 句子显示 -->
      <div v-if="currentQuotes.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">精选句子</h2>
          <div class="flex gap-2">
            <button
              @click="copyQuotes"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              {{ copied ? '已复制' : '复制句子' }}
            </button>
          </div>
        </div>

        <div class="space-y-6">
          <div
            v-for="(quote, index) in currentQuotes"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-6"
          >
            <!-- 引号装饰 -->
            <div class="flex justify-center mb-4">
              <Quote class="w-8 h-8 text-primary/20" />
            </div>

            <!-- 句子内容 -->
            <div class="text-center mb-4">
              <p class="text-lg font-medium leading-relaxed">{{ quote.content }}</p>
            </div>

            <!-- 作者和来源 -->
            <div class="text-center text-sm text-muted-foreground">
              <span v-if="quote.author">—— {{ quote.author }}</span>
              <span v-if="quote.source && quote.author"> · </span>
              <span v-if="quote.source">《{{ quote.source }}》</span>
            </div>

            <!-- 标签 -->
            <div v-if="quote.tags && quote.tags.length > 0" class="mt-4 flex flex-wrap justify-center gap-2">
              <span
                v-for="tag in quote.tags"
                :key="tag"
                class="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
              >
                {{ tag }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="mt-4 flex justify-center gap-2">
              <button
                @click="copySingleQuote(quote)"
                class="text-sm text-muted-foreground hover:text-primary p-2"
              >
                <Copy class="w-4 h-4" />
              </button>
              <button
                @click="shareQuote(quote)"
                class="text-sm text-muted-foreground hover:text-primary p-2"
              >
                <Share2 class="w-4 h-4" />
              </button>
              <button
                @click="favoriteQuote(quote)"
                class="text-sm text-muted-foreground hover:text-red-500 p-2"
              >
                <Heart :class="quote.isFavorite ? 'fill-current text-red-500' : ''" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 分享统计 -->
        <div class="mt-6 text-center">
          <p class="text-sm text-muted-foreground">
            已获取 {{ totalQuotes }} 条句子 · {{ currentQuotes.length }} 条显示中
          </p>
        </div>
      </div>

      <!-- 收藏夹 -->
      <div v-if="favoriteQuotes.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <Heart class="w-5 h-5 text-red-500 fill-current" />
            我的收藏
          </h2>
          <button
            @click="clearFavorites"
            class="text-sm text-red-500 hover:text-red-600"
          >
            清空收藏
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(quote, index) in favoriteQuotes"
            :key="index"
            class="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p class="text-sm font-medium mb-2 line-clamp-3">{{ quote.content }}</p>
            <div class="text-xs text-muted-foreground">
              {{ quote.author }} {{ quote.source ? `· ${quote.source}` : '' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">使用说明</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">分类说明</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">励志名言</h4>
                <p class="text-muted-foreground">激励人心的人生哲理和成功格言</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">电影台词</h4>
                <p class="text-muted-foreground">经典电影中的精彩对白和语录</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">文学经典</h4>
                <p class="text-muted-foreground">名著中的经典段落和名句</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">幽默段子</h4>
                <p class="text-muted-foreground">轻松有趣的笑话和幽默语录</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">使用技巧</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>选择多个分类可以获得更多样化的句子</li>
              <li>收藏喜欢的句子方便以后查看</li>
              <li>可以复制句子用于社交媒体分享</li>
              <li>支持中英文混合显示，适合不同需求</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/random-choice"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <List class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机选择器</p>
              <p class="text-xs text-muted-foreground">从列表中随机选择</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-number-generator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机数字生成器</p>
              <p class="text-xs text-muted-foreground">生成指定范围的随机数</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-dice"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Dice6 class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机骰子</p>
              <p class="text-xs text-muted-foreground">投掷虚拟骰子</p>
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
import { Quote, RefreshCw, Trash2, Copy, Shuffle, Share2, Heart, List, Hash, Dice6, ArrowRight, BookOpen, Film, Laugh, Brain, Coffee, Microscope, Briefcase } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机名言句子 - 在线语录生成')

// 配置
const selectedCategories = ref(['motivational', 'literature'])
const selectedLanguage = ref('chinese')
const displayCount = ref(3)
const sortBy = ref('random')

// 状态
const isGenerating = ref(false)
const currentQuotes = ref([])
const favoriteQuotes = ref([])
const copied = ref(false)
const totalQuotes = ref(0)

// 句子分类
const quoteCategories = [
  {
    id: 'motivational',
    name: '励志名言',
    description: '激励人心的人生哲理',
    icon: Heart,
    count: 500
  },
  {
    id: 'literature',
    name: '文学经典',
    description: '名著中的经典名句',
    icon: BookOpen,
    count: 300
  },
  {
    id: 'movie',
    name: '电影台词',
    description: '经典电影精彩对白',
    icon: Film,
    count: 200
  },
  {
    id: 'humor',
    name: '幽默段子',
    description: '轻松有趣的笑话',
    icon: Laugh,
    count: 150
  },
  {
    id: 'philosophy',
    name: '哲学思考',
    description: '深度思考和人生智慧',
    icon: Brain,
    count: 180
  },
  {
    id: 'life',
    name: '生活感悟',
    description: '日常生活的点滴智慧',
    icon: Coffee,
    count: 120
  },
  {
    id: 'science',
    name: '科学名言',
    description: '科学家的经典语录',
    icon: Microscope,
    count: 100
  },
  {
    id: 'business',
    name: '商业智慧',
    description: '商业领域的经验之谈',
    icon: Briefcase,
    count: 80
  }
]

// 名言数据库
const quotesDatabase = {
  motivational: [
    { content: '成功不是终点，失败也不是终结：唯有勇气才是永恒。', author: '温斯顿·丘吉尔', tags: ['成功', '勇气', '永恒'] },
    { content: '生活就像骑自行车，想保持平衡就得往前走。', author: '阿尔伯特·爱因斯坦', tags: ['生活', '平衡', '前进'] },
    { content: '最困难的时候，就是距离成功不远了。', author: '拿破仑', tags: ['困难', '成功', '坚持'] },
    { content: '不经一番寒彻骨，怎得梅花扑鼻香。', author: '古代谚语', tags: ['努力', '成功', '坚持'] },
    { content: '千里之行，始于足下。', author: '老子', source: '道德经', tags: ['行动', '开始', '基础'] }
  ],
  literature: [
    { content: '人的一生应当这样度过：当他回首往事的时候，他不会因为虚度年华而悔恨，也不会因为碌碌无为而羞愧。', author: '奥斯特洛夫斯基', source: '钢铁是怎样炼成的', tags: ['人生', '意义', '价值'] },
    { content: '一个人可以被毁灭，但不能被打败。', author: '海明威', source: '老人与海', tags: ['坚强', '意志', '精神'] },
    { content: '我思故我在。', author: '笛卡尔', source: '方法论', tags: ['思考', '存在', '哲学'] },
    { content: '生存还是毁灭，这是一个值得考虑的问题。', author: '莎士比亚', source: '哈姆雷特', tags: ['选择', '思考', '人生'] },
    { content: '世界上只有一种真正的英雄主义，那就是认清生活的真相后依然热爱生活。', author: '罗曼·罗兰', source: '约翰·克利斯朵夫', tags: ['英雄主义', '真相', '热爱生活'] }
  ],
  movie: [
    { content: '生活就像一盒巧克力，你永远不知道下一颗是什么味道。', author: '阿甘', source: '阿甘正传', tags: ['生活', '未知', '惊喜'] },
    { content: 'To be or not to be, that is the question.', author: '哈姆雷特', source: '哈姆雷特', tags: ['选择', '存在', '思考'] },
    { content: 'May the Force be with you.', author: '欧比旺·克诺比', source: '星球大战', tags: ['祝福', '力量', '陪伴'] },
    { content: '生命不息，奋斗不止。', author: 'T-800', source: '终结者2', tags: ['生命', '奋斗', '坚持'] },
    { content: '念念不忘，必有回响。', author: '梅兰妮', source: '盗梦空间', tags: ['记忆', '回响', '思念'] }
  ],
  humor: [
    { content: '我所有的朋友都比我有钱，但他们没有一个比我快乐。', author: '网络', tags: ['快乐', '财富', '对比'] },
    { content: '我正在减肥，只是效果不太明显，每次看到美食都克制不住。', author: '网络', tags: ['减肥', '美食', '自嘲'] },
    { content: '我的梦想是当个有钱人，现在实现了——我做梦时很有钱。', author: '网络', tags: ['梦想', '现实', '幽默'] },
    { content: '拖延症不是病，拖起来真要命。', author: '网络', tags: ['拖延症', '幽默', '自嘲'] },
    { content: '早起的鸟儿有虫吃，早起的虫儿被鸟吃。', author: '网络', tags: ['早起', '双关', '幽默'] }
  ],
  philosophy: [
    { content: '认识你自己。', author: '苏格拉底', tags: ['自我认知', '哲学', '智慧'] },
    { content: '未经审视的人生不值得过。', author: '苏格拉底', tags: ['审视', '人生', '思考'] },
    { content: '存在先于本质。', author: '萨特', tags: ['存在', '本质', '哲学'] },
    { content: '人是自由的，但自由的人要为自己的选择负责。', author: '萨特', tags: ['自由', '责任', '选择'] },
    { content: '我思故我在。', author: '笛卡尔', tags: ['思考', '存在', '认知'] }
  ]
}

// 计算属性
const filteredQuotes = computed(() => {
  let quotes = []

  selectedCategories.value.forEach(category => {
    if (quotesDatabase[category]) {
      quotes.push(...quotesDatabase[category])
    }
  })

  // 根据语言过滤
  if (selectedLanguage.value !== 'mixed') {
    quotes = quotes.filter(quote => {
      // 这里可以添加语言检测逻辑
      return true
    })
  }

  return quotes
})

// 切换分类
const toggleCategory = (categoryId) => {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(categoryId)
  }
}

// 生成句子
const generateQuotes = async () => {
  if (isGenerating.value || selectedCategories.length === 0) return

  isGenerating.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  const availableQuotes = filteredQuotes.value
  const selectedQuotes = []

  if (sortBy.value === 'random') {
    // 随机选择
    for (let i = 0; i < displayCount.value && availableQuotes.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableQuotes.length)
      selectedQuotes.push({
        ...availableQuotes[randomIndex],
        isFavorite: favoriteQuotes.value.some(fav => fav.content === availableQuotes[randomIndex].content)
      })
      availableQuotes.splice(randomIndex, 1)
    }
  } else {
    // 其他排序方式
    selectedQuotes.push(...availableQuotes.slice(0, displayCount.value))
  }

  currentQuotes.value = selectedQuotes
  totalQuotes.value += selectedQuotes.length

  isGenerating.value = false
}

// 重新随机
const shuffleQuotes = () => {
  currentQuotes.value = currentQuotes.value.sort(() => Math.random() - 0.5)
}

// 清空结果
const clearQuotes = () => {
  currentQuotes.value = []
}

// 复制单个句子
const copySingleQuote = async (quote) => {
  try {
    const text = `${quote.content} —— ${quote.author}${quote.source ? `《${quote.source}》` : ''}`
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 复制所有句子
const copyQuotes = async () => {
  try {
    const text = currentQuotes.value.map(quote => {
      return `${quote.content} —— ${quote.author}${quote.source ? `《${quote.source}》` : ''}`
    }).join('\n\n')

    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 分享句子
const shareQuote = (quote) => {
  const text = `${quote.content} —— ${quote.author}`
  if (navigator.share) {
    navigator.share({
      title: '精彩句子',
      text: text
    })
  }
}

// 收藏句子
const favoriteQuote = (quote) => {
  const index = favoriteQuotes.value.findIndex(fav => fav.content === quote.content)
  if (index > -1) {
    favoriteQuotes.value.splice(index, 1)
    quote.isFavorite = false
  } else {
    favoriteQuotes.value.push(quote)
    quote.isFavorite = true
  }
}

// 清空收藏
const clearFavorites = () => {
  favoriteQuotes.value = []
  currentQuotes.value.forEach(quote => {
    quote.isFavorite = false
  })
}
</script>