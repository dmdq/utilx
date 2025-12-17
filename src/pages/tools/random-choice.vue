<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <List class="w-8 h-8 text-primary" />
        随机选择器
      </h1>
      <p class="text-muted-foreground">从列表中随机选择一个或多个选项</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">选择配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 选项列表 -->
          <div>
            <label class="text-sm font-medium mb-2 block">选项列表（每行一个选项）</label>
            <textarea
              v-model="optionsInput"
              placeholder="输入选项，每行一个...&#10;例如：&#10;选项1&#10;选项2&#10;选项3"
              class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-32 resize-none"
            ></textarea>
            <div class="mt-2 text-sm text-muted-foreground">
              当前 {{ options.length }} 个选项
            </div>
          </div>

          <!-- 选择设置 -->
          <div class="space-y-4">
            <!-- 选择数量 -->
            <div>
              <label class="text-sm font-medium mb-2 block">选择数量</label>
              <div class="flex gap-2">
                <input
                  v-model.number="selectCount"
                  type="number"
                  min="1"
                  :max="options.length"
                  class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span class="px-3 py-2 bg-muted rounded-lg text-sm">个</span>
              </div>
            </div>

            <!-- 选择模式 -->
            <div>
              <label class="text-sm font-medium mb-2 block">选择模式</label>
              <select v-model="selectMode" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="random">随机选择</option>
                <option value="weighted">加权随机</option>
                <option value="unique">不重复选择</option>
              </select>
            </div>

            <!-- 权重设置 -->
            <div v-if="selectMode === 'weighted'">
              <label class="text-sm font-medium mb-2 block">权重设置（用逗号分隔）</label>
              <input
                v-model="weightsInput"
                type="text"
                placeholder="例如: 1, 2, 3"
                class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <!-- 预设选项 -->
        <div class="mt-6">
          <label class="text-sm font-medium mb-2 block">预设选项</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="loadPreset('food')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              今天吃什么
            </button>
            <button
              @click="loadPreset('activity')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              周末活动
            </button>
            <button
              @click="loadPreset('team')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              团队分组
            </button>
            <button
              @click="loadPreset('priority')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              任务优先级
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="makeChoice"
          :disabled="isChoosing || options.length < selectCount"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isChoosing" class="w-5 h-5 animate-spin" />
          <List v-else class="w-5 h-5" />
          {{ isChoosing ? '选择中...' : '开始选择' }}
        </button>

        <button
          @click="clearAll"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Trash2 class="w-5 h-5" />
          清空所有
        </button>
      </div>

      <!-- 结果显示 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">选择结果</h2>
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

        <div class="space-y-4">
          <div
            v-for="(result, index) in results"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-muted-foreground">第 {{ index + 1 }} 次选择</span>
              <span class="text-sm text-muted-foreground">{{ result.timestamp }}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="(choice, choiceIndex) in result.selected"
                :key="choiceIndex"
                class="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center transform hover:scale-105 transition-transform"
              >
                <div class="font-medium text-primary">{{ choice }}</div>
              </div>
            </div>

            <!-- 淘汰的选项 -->
            <div v-if="result.eliminated && result.eliminated.length > 0" class="mt-3">
              <div class="text-sm text-muted-foreground">未被选中：</div>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="item in result.eliminated"
                  :key="item"
                  class="px-2 py-1 bg-muted rounded text-sm"
                >
                  {{ item }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="mt-6">
          <h3 class="font-medium mb-3">选择统计</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(stats, option) in choiceStats"
              :key="option"
              class="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <span class="font-medium">{{ option }}</span>
              <div class="flex items-center gap-2">
                <div class="w-20 bg-muted rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full"
                    :style="{ width: (stats.percentage) + '%' }"
                  ></div>
                </div>
                <span class="text-sm text-muted-foreground w-12 text-right">{{ stats.count }}次</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">使用说明</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">选择模式说明</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">随机选择</h4>
                <p class="text-muted-foreground">完全随机选择，每个选项概率相等</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">加权随机</h4>
                <p class="text-muted-foreground">根据权重设置，概率不同</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">不重复选择</h4>
                <p class="text-muted-foreground">选择的选项不会重复</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">使用场景</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>决策困难时的随机选择</li>
              <li>抽奖活动和公平分组</li>
              <li>任务分配和人员选择</li>
              <li>随机抽样和数据筛选</li>
              <li>游戏随机事件触发</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { List, RefreshCw, Trash2, Copy, Dice6, Circle, Hash, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机选择器 - 在线随机选择工具')

// 配置
const optionsInput = ref('')
const selectCount = ref(1)
const selectMode = ref('random')
const weightsInput = ref('')

// 状态
const isChoosing = ref(false)
const results = ref([])
const copied = ref(false)

// 预设选项
const presets = {
  food: [
    '火锅', '烧烤', '日料', '西餐', '中餐', '韩料', '泰餐', '越南菜',
    '快餐', '外卖', '自己做饭', '不吃', '随便'
  ],
  activity: [
    '看电影', '逛街', '运动', '读书', '游戏', '聚会', '旅行', '在家休息',
    '学习', '工作', '健身', '户外活动', '看展览', '听音乐'
  ],
  team: [
    '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'
  ],
  priority: [
    '紧急重要', '重要不紧急', '紧急不重要', '不紧急不重要'
  ]
}

// 计算属性
const options = computed(() => {
  if (!optionsInput.value.trim()) return []
  return optionsInput.value.split('\n')
    .map(opt => opt.trim())
    .filter(opt => opt.length > 0)
})

const weights = computed(() => {
  if (!weightsInput.value.trim()) return []
  return weightsInput.value.split(',')
    .map(w => parseFloat(w.trim()))
    .filter(w => !isNaN(w) && w > 0)
})

const choiceStats = computed(() => {
  const stats = {}
  results.value.forEach(result => {
    result.selected.forEach(choice => {
      stats[choice] = (stats[choice] || 0) + 1
    })
  })

  const total = results.value.reduce((sum, result) => sum + result.selected.length, 0)

  Object.keys(stats).forEach(key => {
    stats[key] = {
      count: stats[key],
      percentage: Math.round((stats[key] / total) * 100)
    }
  })

  return stats
})

// 加载预设
const loadPreset = (presetName) => {
  if (presets[presetName]) {
    optionsInput.value = presets[presetName].join('\n')
    if (presetName === 'team') {
      selectCount.value = 2
    } else if (presetName === 'priority') {
      selectCount.value = 1
    } else {
      selectCount.value = Math.min(3, presets[presetName].length)
    }
  }
}

// 随机选择
const makeChoice = async () => {
  if (isChoosing.value || options.value.length < selectCount.value) return

  isChoosing.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  let selected = []
  let available = [...options.value]

  if (selectMode.value === 'random') {
    // 完全随机选择
    for (let i = 0; i < selectCount.value && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length)
      selected.push(available[index])
      available.splice(index, 1)
    }
  } else if (selectMode.value === 'weighted') {
    // 加权随机选择
    const weightsArray = weights.value.length > 0 ? weights.value : options.value.map(() => 1)
    const totalWeight = weightsArray.reduce((sum, weight) => sum + weight, 0)

    for (let i = 0; i < selectCount.value && available.length > 0; i++) {
      let random = Math.random() * totalWeight
      let selectedIndex = 0

      for (let j = 0; j < weightsArray.length; j++) {
        random -= weightsArray[j]
        if (random <= 0) {
          selectedIndex = j
          break
        }
      }

      if (selectedIndex < available.length) {
        selected.push(available[selectedIndex])
        available.splice(selectedIndex, 1)
        weightsArray.splice(selectedIndex, 1)
      }
    }
  } else if (selectMode.value === 'unique') {
    // 不重复选择
    selected = available.sort(() => Math.random() - 0.5).slice(0, selectCount.value)
  }

  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  results.value.unshift({
    selected,
    eliminated: selectMode.value === 'unique' ? available.slice(selectCount.value) : null,
    timestamp
  })

  if (results.value.length > 20) {
    results.value = results.value.slice(0, 20)
  }

  isChoosing.value = false
}

// 清空所有
const clearAll = () => {
  optionsInput.value = ''
  weightsInput.value = ''
  results.value = []
  selectCount.value = 1
}

// 复制结果
const copyResults = async () => {
  try {
    const text = results.value.map((result, index) => {
      return `第${index + 1}次选择: ${result.selected.join(', ')}`
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