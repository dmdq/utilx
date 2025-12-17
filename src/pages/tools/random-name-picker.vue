<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <User class="w-8 h-8 text-primary" />
        随机点名器
      </h1>
      <p class="text-muted-foreground">随机抽取姓名，支持多种抽取模式和公平性算法</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 姓名配置 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">姓名配置</h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 姓名列表 -->
          <div>
            <label class="text-sm font-medium mb-2 block">姓名列表</label>
            <textarea
              v-model="nameList"
              placeholder="请输入姓名，每行一个&#10;例如：&#10;张三&#10;李四&#10;王五"
              class="w-full h-48 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            ></textarea>
            <div class="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>共 {{ nameCount }} 个姓名</span>
              <button
                @click="loadSampleNames"
                class="text-primary hover:underline"
              >
                加载示例姓名
              </button>
            </div>
          </div>

          <!-- 配置选项 -->
          <div class="space-y-4">
            <!-- 抽取模式 -->
            <div>
              <label class="text-sm font-medium mb-2 block">抽取模式</label>
              <select v-model="pickMode" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="single">随机抽取单个</option>
                <option value="multiple">批量抽取</option>
                <option value="lottery">抽奖模式</option>
                <option value="rollcall">轮流点名</option>
              </select>
            </div>

            <!-- 抽取数量 -->
            <div v-if="pickMode === 'multiple'">
              <label class="text-sm font-medium mb-2 block">抽取数量</label>
              <div class="flex gap-2">
                <input
                  v-model.number="pickCount"
                  type="number"
                  :min="1"
                  :max="nameCount"
                  class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span class="px-3 py-2 bg-muted rounded-lg text-sm">个</span>
              </div>
            </div>

            <!-- 抽奖设置 -->
            <div v-if="pickMode === 'lottery'">
              <label class="text-sm font-medium mb-2 block">奖项设置</label>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <input
                    v-model="prizeName"
                    type="text"
                    placeholder="奖项名称（如：一等奖）"
                    class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div class="flex gap-2">
                  <input
                    v-model.number="prizeCount"
                    type="number"
                    :min="1"
                    placeholder="中奖人数"
                    class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <!-- 公平性选项 -->
            <div>
              <label class="text-sm font-medium mb-2 block">抽取规则</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input
                    v-model="allowRepeat"
                    type="checkbox"
                    class="rounded border-border"
                  />
                  <span class="text-sm">允许重复抽取</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="enableWeight"
                    type="checkbox"
                    class="rounded border-border"
                  />
                  <span class="text-sm">启用权重模式（抽取过的姓名概率降低）</span>
                </label>
              </div>
            </div>

            <!-- 动画效果 -->
            <div>
              <label class="text-sm font-medium mb-2 block">动画效果</label>
              <select v-model="animationStyle" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="none">无动画</option>
                <option value="spin">旋转动画</option>
                <option value="fade">淡入淡出</option>
                <option value="typewriter">打字机效果</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 快捷模板 -->
        <div class="mt-6">
          <label class="text-sm font-medium mb-2 block">快捷模板</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="loadTemplate('students')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              学生名单
            </button>
            <button
              @click="loadTemplate('employees')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              员工名单
            </button>
            <button
              @click="loadTemplate('participants')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              参与者名单
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="startPicking"
          :disabled="isPicking || nameList.trim().length === 0"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isPicking" class="w-5 h-5 animate-spin" />
          <User v-else class="w-5 h-5" />
          {{ getButtonText() }}
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

      <!-- 抽取动画 -->
      <div v-if="isPicking && currentName" class="bg-card border border-border rounded-lg p-12">
        <div class="text-center">
          <div class="mb-4 text-sm text-muted-foreground">正在抽取...</div>
          <div
            :class="[
              'inline-block text-4xl font-bold text-primary',
              getAnimationClass()
            ]"
          >
            {{ currentName }}
          </div>
        </div>
      </div>

      <!-- 抽取结果 -->
      <div v-if="results.length > 0 && !isPicking" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">抽取结果</h2>
          <div class="flex gap-2">
            <button
              @click="copyResults"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              {{ copied ? '已复制' : '复制结果' }}
            </button>
            <button
              @click="exportResults"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Download class="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        <!-- 最新结果 -->
        <div v-if="latestResult" class="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div class="text-center">
            <div class="text-sm text-muted-foreground mb-2">最新抽取</div>
            <div class="text-2xl font-bold text-primary">
              {{ latestResult.mode === 'multiple' ? latestResult.names.join(', ') : latestResult.names[0] }}
            </div>
            <div class="text-sm text-muted-foreground mt-2">{{ latestResult.timestamp }}</div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="space-y-3 max-h-64 overflow-y-auto">
          <div
            v-for="(result, index) in results"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">{{ result.timestamp }}</span>
              <div class="flex items-center gap-2">
                <span class="text-xs bg-muted px-2 py-1 rounded">{{ getModeText(result.mode) }}</span>
                <span class="text-xs text-muted-foreground">{{ result.names.length }}个</span>
              </div>
            </div>
            <div class="mt-2 text-lg font-medium">
              {{ result.names.join(', ') }}
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">统计信息</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-primary">{{ totalPicks }}</div>
            <div class="text-sm text-muted-foreground">总抽取次数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ uniqueNames }}</div>
            <div class="text-sm text-muted-foreground">被抽取人数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ mostPicked }}</div>
            <div class="text-sm text-muted-foreground">最多次数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ fairnessScore }}%</div>
            <div class="text-sm text-muted-foreground">公平性评分</div>
          </div>
        </div>

        <!-- 抽取分布 -->
        <div class="mt-6">
          <h3 class="font-medium mb-3">抽取分布</h3>
          <div class="space-y-2">
            <div
              v="(name, index) in nameStats"
              :key="index"
              class="flex items-center gap-3"
            >
              <span class="text-sm w-20 truncate">{{ name.name }}</span>
              <div class="flex-1 bg-muted rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full"
                  :style="{ width: (name.count / Math.max(...nameStats.map(n => n.count)) * 100) + '%' }"
                ></div>
              </div>
              <span class="text-sm text-muted-foreground w-8">{{ name.count }}</span>
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
              <li>支持多种抽取模式（单个、批量、抽奖、轮流）</li>
              <li>智能权重算法，确保抽取的公平性</li>
              <li>丰富的动画效果，增强体验</li>
              <li>完整的统计和历史记录</li>
              <li>支持姓名导入导出</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">应用场景</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>课堂随机点名提问</li>
              <li>会议发言顺序安排</li>
              <li>抽奖活动组织</li>
              <li>任务随机分配</li>
              <li>游戏参与者选择</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">公平性说明</h3>
            <p class="text-muted-foreground">
              默认情况下，每个姓名被抽中的概率相等。启用权重模式后，已被抽中的姓名概率会降低，
              确保在多次抽取中每个姓名都有相对公平的机会。建议定期重置抽取历史以保持最佳公平性。
            </p>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            to="/tools/random-team"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Users class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机分队工具</p>
              <p class="text-xs text-muted-foreground">人员分组管理</p>
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
import { User, RefreshCw, Trash2, Copy, Download, Hash, List, Users, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机点名器 - 在线姓名抽取工具')

// 配置
const nameList = ref('')
const pickMode = ref('single')
const pickCount = ref(1)
const prizeName = ref('一等奖')
const prizeCount = ref(1)
const allowRepeat = ref(false)
const enableWeight = ref(false)
const animationStyle = ref('spin')

// 状态
const isPicking = ref(false)
const currentName = ref('')
const results = ref([])
const copied = ref(false)

// 示例姓名模板
const sampleNames = {
  students: '张小明\n李小红\n王小强\n刘小芳\n陈小军\n赵小敏\n孙小华\n周小刚\n吴小丽\n郑小伟\n朱小燕\n何小鹏\n马小琳\n林小东\n宋小杰',
  employees: '王经理\n李主管\n张组长\n刘专员\n陈助理\n赵科员\n孙工程师\n周设计师\n吴分析师\n郑策划\n朱编辑\n何会计\n马销售\n林客服\n宋运维',
  participants: '参与者A\n参与者B\n参与者C\n参与者D\n参与者E\n参与者F\n参与者G\n参与者H\n参与者I\n参与者J\n参与者K\n参与者L\n参与者M\n参与者N\n参与者O'
}

// 计算属性
const nameCount = computed(() => {
  return nameList.value.trim().split('\n').filter(name => name.trim()).length
})

const names = computed(() => {
  return nameList.value.trim().split('\n').filter(name => name.trim())
})

const latestResult = computed(() => {
  return results.value[0] || null
})

const totalPicks = computed(() => {
  return results.value.reduce((total, result) => total + result.names.length, 0)
})

const uniqueNamesCount = computed(() => {
  const allNames = results.value.flatMap(result => result.names)
  return new Set(allNames).size
})

const uniqueNames = computed(() => {
  return uniqueNamesCount.value
})

const nameStats = computed(() => {
  const allNames = results.value.flatMap(result => result.names)
  const stats = {}

  allNames.forEach(name => {
    stats[name] = (stats[name] || 0) + 1
  })

  return Object.entries(stats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const mostPicked = computed(() => {
  if (nameStats.value.length === 0) return 0
  return Math.max(...nameStats.value.map(n => n.count))
})

const fairnessScore = computed(() => {
  if (nameStats.value.length === 0) return 100

  const counts = nameStats.value.map(n => n.count)
  const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length
  const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length
  const standardDeviation = Math.sqrt(variance)

  // 公平性评分：标准差越小，评分越高
  return Math.max(0, Math.min(100, Math.round(100 - (standardDeviation / mean) * 100)))
})

// 加载示例姓名
const loadSampleNames = () => {
  nameList.value = sampleNames.students
}

// 加载模板
const loadTemplate = (type) => {
  nameList.value = sampleNames[type] || sampleNames.students
}

// 获取按钮文字
const getButtonText = () => {
  switch (pickMode.value) {
    case 'single': return '抽取一人'
    case 'multiple': return `抽取${pickCount.value}人`
    case 'lottery': return '抽取中奖者'
    case 'rollcall': return '开始点名'
    default: return '开始抽取'
  }
}

// 获取模式文字
const getModeText = (mode) => {
  switch (mode) {
    case 'single': return '单人'
    case 'multiple': return '批量'
    case 'lottery': return '抽奖'
    case 'rollcall': return '点名'
    default: return '抽取'
  }
}

// 获取动画类
const getAnimationClass = () => {
  switch (animationStyle.value) {
    case 'spin': return 'animate-spin'
    case 'fade': return 'animate-pulse'
    case 'typewriter': return 'animate-bounce'
    default: return ''
  }
}

// 计算权重
const calculateWeights = () => {
  if (!enableWeight.value) {
    return names.value.map(() => 1)
  }

  const weights = []
  const history = results.value.flatMap(result => result.names)

  names.value.forEach(name => {
    const count = history.filter(n => n === name).length
    // 权重 = 1 / (1 + 历史次数)，确保越少被抽到的权重越高
    weights.push(1 / (1 + count))
  })

  return weights
}

// 随机抽取
const randomPick = (availableNames, count = 1) => {
  const picked = []
  const available = [...availableNames]
  const weights = enableWeight.value ? calculateWeights() : null

  for (let i = 0; i < count && available.length > 0; i++) {
    let pick

    if (weights) {
      // 权重随机选择
      const totalWeight = weights.reduce((sum, w) => sum + w, 0)
      let random = Math.random() * totalWeight

      for (let j = 0; j < available.length; j++) {
        random -= weights[j]
        if (random <= 0) {
          pick = j
          break
        }
      }

      if (pick === undefined) pick = Math.floor(Math.random() * available.length)
    } else {
      // 普通随机选择
      pick = Math.floor(Math.random() * available.length)
    }

    picked.push(available[pick])

    if (!allowRepeat.value) {
      available.splice(pick, 1)
      if (weights) {
        weights.splice(pick, 1)
      }
    }
  }

  return picked
}

// 开始抽取
const startPicking = async () => {
  if (isPicking.value || names.value.length === 0) return

  isPicking.value = true
  currentName.value = ''

  // 动画效果
  const animationDuration = animationStyle.value === 'none' ? 0 : 2000
  const animationInterval = animationStyle.value === 'typewriter' ? 100 : 50

  if (animationDuration > 0) {
    let animationCount = 0
    const animationTimer = setInterval(() => {
      currentName.value = names.value[Math.floor(Math.random() * names.value.length)]
      animationCount++

      if (animationCount >= animationDuration / animationInterval) {
        clearInterval(animationTimer)
      }
    }, animationInterval)

    await new Promise(resolve => setTimeout(resolve, animationDuration))
  }

  // 执行抽取
  let picked = []

  switch (pickMode.value) {
    case 'single':
      picked = randomPick(names.value, 1)
      break
    case 'multiple':
      picked = randomPick(names.value, Math.min(pickCount.value, names.value.length))
      break
    case 'lottery':
      picked = randomPick(names.value, Math.min(prizeCount.value, names.value.length))
      break
    case 'rollcall':
      // 轮流点名：从未被点过的人开始
      const pickedNames = results.value.flatMap(r => r.names)
      const unpicked = names.value.filter(name => !pickedNames.includes(name))
      const available = unpicked.length > 0 ? unpicked : names.value
      picked = randomPick(available, 1)
      break
  }

  // 保存结果
  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  results.value.unshift({
    mode: pickMode.value,
    names: picked,
    timestamp: pickMode.value === 'lottery' ? `${prizeName} - ${timestamp}` : timestamp
  })

  // 显示最终结果
  currentName.value = pickMode.value === 'multiple' ? picked.join(', ') : picked[0]

  // 限制结果数量
  if (results.value.length > 100) {
    results.value = results.value.slice(0, 100)
  }

  isPicking.value = false
}

// 清空结果
const clearResults = () => {
  results.value = []
  currentName.value = ''
}

// 复制结果
const copyResults = async () => {
  try {
    const text = results.value.map((result, index) => {
      const modeText = getModeText(result.mode)
      return `${index + 1}. [${modeText}] ${result.names.join(', ')} (${result.timestamp})`
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

// 导出结果
const exportResults = () => {
  if (results.value.length === 0) return

  let content = '随机点名结果导出\n'
  content += '==================\n\n'
  content += `导出时间: ${new Date().toLocaleString()}\n`
  content += `姓名总数: ${nameCount}\n`
  content += `抽取次数: ${totalPicks}\n`
  content += `参与人数: ${uniqueNames}\n`
  content += `公平性评分: ${fairnessScore}%\n\n`

  results.value.forEach((result, index) => {
    content += `${index + 1}. [${getModeText(result.mode)}] ${result.names.join(', ')}\n`
    content += `   时间: ${result.timestamp}\n\n`
  })

  // 添加统计信息
  if (nameStats.value.length > 0) {
    content += '\n抽取统计:\n'
    content += '---------\n'
    nameStats.value.forEach(stat => {
      content += `${stat.name}: ${stat.count}次\n`
    })
  }

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `name-picker-results-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>