<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Utensils class="w-8 h-8 text-primary" />
        随机吃什么
      </h1>
      <p class="text-muted-foreground">解决"吃什么"难题，随机推荐美食</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">美食配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- 餐饮类型 -->
          <div>
            <label class="text-sm font-medium mb-2 block">餐饮类型</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="foodTypes"
                  value="chinese"
                  class="mr-2"
                />
                中餐
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="foodTypes"
                  value="western"
                  class="mr-2"
                />
                西餐
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="foodTypes"
                  value="japanese"
                  class="mr-2"
                />
                日料
              </label>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="foodTypes"
                  value="korean"
                  class="mr-2"
                />
                韩料
              </label>
            </div>
          </div>

          <!-- 用餐时段 -->
          <div>
            <label class="text-sm font-medium mb-2 block">用餐时段</label>
            <select v-model="mealTime" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="breakfast">早餐</option>
              <option value="lunch">午餐</option>
              <option value="dinner">晚餐</option>
              <option value="snack">加餐/夜宵</option>
              <option value="any">任何时间</option>
            </select>
          </div>

          <!-- 价格范围 -->
          <div>
            <label class="text-sm font-medium mb-2 block">价格范围</label>
            <select v-model="priceRange" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="low">经济实惠(￥20以下)</option>
              <option value="medium">中等消费(￥20-50)</option>
              <option value="high">高档消费(￥50以上)</option>
              <option value="any">不限制</option>
            </select>
          </div>
        </div>

        <!-- 特殊需求 -->
        <div class="mt-6">
          <label class="text-sm font-medium mb-2 block">特殊需求</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="need in specialNeeds"
              :key="need.value"
              @click="toggleSpecialNeed(need.value)"
              :class="[
                'px-3 py-1.5 text-sm rounded transition-colors',
                selectedNeeds.includes(need.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              {{ need.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="recommendFood"
          :disabled="isRecommending || foodTypes.length === 0"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isRecommending" class="w-5 h-5 animate-spin" />
          <Utensils v-else class="w-5 h-5" />
          {{ isRecommending ? '推荐中...' : '推荐美食' }}
        </button>

        <button
          @click="quickRecommend"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Zap class="w-5 h-5" />
          快速推荐
        </button>

        <button
          v-if="results.length > 0"
          @click="clearResults"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Trash2 class="w-5 h-5" />
          清空结果
        </button>
      </div>

      <!-- 推荐结果 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">美食推荐</h2>
          <div class="flex gap-2">
            <button
              @click="copyResults"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              {{ copied ? '已复制' : '复制结果' }}
            </button>
          </div>
        </div>

        <div class="space-y-6">
          <div
            v-for="(result, index) in results"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm text-muted-foreground">推荐 {{ index + 1 }}</span>
              <span class="text-sm text-muted-foreground">{{ result.timestamp }}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="food in result.foods"
                :key="food.name"
                class="bg-white rounded-lg p-4 border border-border hover:shadow-md transition-shadow"
              >
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-semibold text-lg">{{ food.name }}</h3>
                  <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    {{ food.type }}
                  </span>
                </div>

                <div class="space-y-2 text-sm text-muted-foreground">
                  <div class="flex items-center gap-2">
                    <MapPin class="w-4 h-4" />
                    {{ food.category }}
                  </div>
                  <div class="flex items-center gap-2">
                    <DollarSign class="w-4 h-4" />
                    {{ food.price }}
                  </div>
                  <div class="flex items-center gap-2">
                    <Clock class="w-4 h-4" />
                    {{ food.time }}
                  </div>
                </div>

                <div v-if="food.description" class="mt-3 text-sm">
                  {{ food.description }}
                </div>

                <div v-if="food.tags && food.tags.length > 0" class="mt-3 flex flex-wrap gap-1">
                  <span
                    v-for="tag in food.tags"
                    :key="tag"
                    class="px-2 py-1 bg-muted rounded text-xs"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 美食统计 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">推荐统计</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-primary">{{ results.length }}</div>
            <div class="text-sm text-muted-foreground">推荐次数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ typeStats.chinese || 0 }}</div>
            <div class="text-sm text-muted-foreground">中餐推荐</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ typeStats.western || 0 }}</div>
            <div class="text-sm text-muted-foreground">西餐推荐</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ typeStats.other || 0 }}</div>
            <div class="text-sm text-muted-foreground">其他推荐</div>
          </div>
        </div>
      </div>

      <!-- 美食百科 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">美食百科</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="category in foodCategories"
            :key="category.name"
            class="p-4 bg-muted rounded-lg"
          >
            <h3 class="font-semibold mb-2">{{ category.name }}</h3>
            <p class="text-sm text-muted-foreground mb-3">{{ category.description }}</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="example in category.examples"
                :key="example"
                class="px-2 py-1 bg-white rounded text-xs"
              >
                {{ example }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">使用说明</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">功能特点</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>支持多种菜系类型选择</li>
              <li>根据用餐时段智能推荐</li>
              <li>价格范围筛选功能</li>
              <li>特殊饮食需求考虑</li>
              <li>美食百科知识介绍</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">选择建议</h3>
            <p class="text-muted-foreground">
              根据个人口味偏好、营养需求、用餐时间等因素合理选择。
              建议保持饮食多样化，不偏食，适量摄入各类营养素。
            </p>
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
            to="/tools/random-coin"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Circle class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机硬币</p>
              <p class="text-xs text-muted-foreground">抛硬币做决定</p>
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
import { Utensils, RefreshCw, Trash2, Copy, Zap, MapPin, DollarSign, Clock, List, Circle, Dice6, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机吃什么 - 美食推荐工具')

// 配置
const foodTypes = ref(['chinese', 'western'])
const mealTime = ref('lunch')
const priceRange = ref('medium')
const selectedNeeds = ref([])

// 状态
const isRecommending = ref(false)
const results = ref([])
const copied = ref(false)

// 特殊需求
const specialNeeds = [
  { label: '素食', value: 'vegetarian' },
  { label: '清淡', value: 'light' },
  { label: '辛辣', value: 'spicy' },
  { label: '低卡', value: 'low-calorie' },
  { label: '高蛋白', value: 'high-protein' }
]

// 美食数据库
const foodDatabase = {
  chinese: [
    { name: '宫保鸡丁', category: '川菜', price: '￥25-35', time: '午餐/晚餐', description: '经典川菜，鸡肉嫩滑，花生香脆', tags: ['辣', '下饭'] },
    { name: '麻婆豆腐', category: '川菜', price: '￥15-25', time: '午餐/晚餐', description: '麻辣鲜香，豆腐嫩滑', tags: ['辣', '素食'] },
    { name: '糖醋排骨', category: '江浙菜', price: '￥35-45', time: '午餐/晚餐', description: '酸甜可口，排骨香嫩', tags: ['酸甜', '荤菜'] },
    { name: '蒸蛋羹', category: '家常菜', price: '￥8-15', time: '任何时间', description: '嫩滑爽口，营养丰富', tags: ['清淡', '营养'] },
    { name: '小笼包', category: '点心', price: '￥20-30', time: '早餐/午餐', description: '皮薄馅大，汤汁鲜美', tags: ['点心', '鲜美'] }
  ],
  western: [
    { name: '意大利面', category: '西餐', price: '￥30-50', time: '午餐/晚餐', description: '经典意面，番茄肉酱丰富', tags: ['主食', '番茄'] },
    { name: '牛排', category: '西餐', price: '￥80-150', time: '晚餐', description: '嫩滑多汁，炭火烤制', tags: ['荤菜', '高蛋白'] },
    { name: '凯撒沙拉', category: '沙拉', price: '￥25-35', time: '午餐/晚餐', description: '清爽健康，蔬菜新鲜', tags: ['素食', '低卡'] },
    { name: '汉堡', category: '快餐', price: '￥30-45', time: '午餐/晚餐', description: '经典美式，肉饼多汁', tags: ['快餐', '主食'] },
    { name: '披萨', category: '意式', price: '￥40-80', time: '午餐/晚餐', description: '芝士浓郁，配料丰富', tags: ['主食', '芝士'] }
  ],
  japanese: [
    { name: '寿司', category: '日料', price: '￥50-100', time: '午餐/晚餐', description: '新鲜海鱼，米饭香糯', tags: ['生鲜', '米饭'] },
    { name: '拉面', category: '日料', price: '￥30-50', time: '任何时间', description: '汤头浓郁，面条劲道', tags: ['汤面', '主食'] },
    { name: '天妇罗', category: '日料', price: '￥40-60', time: '午餐/晚餐', description: '酥脆鲜嫩，蘸料美味', tags: ['油炸', '海鲜'] },
    { name: '日式咖喱', category: '日料', price: '￥25-40', time: '午餐/晚餐', description: '香浓微辣，配菜丰富', tags: ['咖喱', '主食'] }
  ],
  korean: [
    { name: '韩式烤肉', category: '韩料', price: '￥60-120', time: '晚餐', description: '炭火烤制，配菜丰富', tags: ['烤肉', '荤菜'] },
    { name: '石锅拌饭', category: '韩料', price: '￥30-45', time: '午餐/晚餐', description: '营养均衡，锅巴香脆', tags: ['拌饭', '主食'] },
    { name: '部队锅', category: '韩料', price: '￥40-60', time: '晚餐', description: '汤底鲜美，配菜丰富', tags: ['汤锅', '辛辣'] },
    { name: '韩式炸鸡', category: '韩料', price: '￥35-55', time: '晚餐/夜宵', description: '外酥内嫩，酱汁诱人', tags: ['油炸', '夜宵'] }
  ]
}

// 美食分类
const foodCategories = [
  {
    name: '川菜',
    description: '以麻辣著称，口味浓郁',
    examples: ['麻婆豆腐', '宫保鸡丁', '水煮鱼', '回锅肉']
  },
  {
    name: '粤菜',
    description: '清淡鲜美，注重原味',
    examples: ['白切鸡', '蒸蛋羹', '清蒸鱼', '广式点心']
  },
  {
    name: '日料',
    description: '新鲜精致，讲究季节',
    examples: ['寿司', '拉面', '天妇罗', '刺身']
  },
  {
    name: '西餐',
    description: '营养丰富，摆盘精美',
    examples: ['牛排', '意大利面', '沙拉', '汤品']
  },
  {
    name: '快餐',
    description: '方便快捷，价格实惠',
    examples: ['汉堡', '三明治', '披萨', '炸鸡']
  },
  {
    name: '素食',
    description: '健康清淡，营养丰富',
    examples: ['素食沙拉', '豆腐料理', '蔬菜料理', '谷物料理']
  }
]

// 计算属性
const typeStats = computed(() => {
  const stats = {}
  results.value.forEach(result => {
    result.foods.forEach(food => {
      const type = getTypeLabel(food.type)
      stats[type] = (stats[type] || 0) + 1
    })
  })
  return stats
})

// 获取类型标签
const getTypeLabel = (type) => {
  const typeMap = {
    chinese: 'chinese',
    western: 'western',
    japanese: 'other',
    korean: 'other'
  }
  return typeMap[type] || 'other'
}

// 切换特殊需求
const toggleSpecialNeed = (need) => {
  const index = selectedNeeds.value.indexOf(need)
  if (index > -1) {
    selectedNeeds.value.splice(index, 1)
  } else {
    selectedNeeds.value.push(need)
  }
}

// 推荐美食
const recommendFood = async () => {
  if (isRecommending.value || foodTypes.value.length === 0) return

  isRecommending.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))

  const recommendations = []
  const foodCount = Math.min(3, 6) // 推荐3个，最多6个

  for (const type of foodTypes.value) {
    if (foodDatabase[type]) {
      const availableFoods = foodDatabase[type].filter(food => {
        // 价格筛选
        if (priceRange.value !== 'any') {
          const foodPrice = parseInt(food.price.match(/￥(\d+)/)[1])
          if (priceRange.value === 'low' && foodPrice > 20) return false
          if (priceRange.value === 'medium' && (foodPrice < 20 || foodPrice > 50)) return false
          if (priceRange.value === 'high' && foodPrice <= 50) return false
        }

        // 时间筛选
        if (mealTime.value !== 'any' && !food.time.includes(mealTimeMap[mealTime.value])) {
          return false
        }

        // 特殊需求筛选
        if (selectedNeeds.value.length > 0) {
          const hasMatch = selectedNeeds.value.some(need => {
            if (need === 'vegetarian' && food.tags.includes('素食')) return true
            if (need === 'light' && food.tags.includes('清淡')) return true
            if (need === 'spicy' && food.tags.includes('辣')) return true
            if (need === 'low-calorie' && food.tags.includes('低卡')) return true
            if (need === 'high-protein' && food.tags.includes('高蛋白')) return true
            return false
          })
          if (!hasMatch) return false
        }

        return true
      })

      // 随机选择
      const selected = availableFoods.sort(() => Math.random() - 0.5).slice(0, Math.ceil(foodCount / foodTypes.value))
      selected.forEach(food => {
        food.type = type
        recommendations.push(food)
      })
    }
  }

  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  results.value.unshift({
    foods: recommendations.sort(() => Math.random() - 0.5),
    timestamp
  })

  if (results.value.length > 10) {
    results.value = results.value.slice(0, 10)
  }

  isRecommending.value = false
}

// 快速推荐
const quickRecommend = () => {
  foodTypes.value = ['chinese', 'western']
  mealTime.value = 'lunch'
  priceRange.value = 'medium'
  selectedNeeds.value = []
  recommendFood()
}

// 时间映射
const mealTimeMap = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '夜宵'
}

// 清空结果
const clearResults = () => {
  results.value = []
}

// 复制结果
const copyResults = async () => {
  try {
    const text = results.value.map((result, index) => {
      const foods = result.foods.map(f => `${f.name}(${f.category})`).join(', ')
      return `推荐${index + 1}: ${foods}`
    }).join('\n')

    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}
</script>