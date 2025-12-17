<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Users class="w-8 h-8 text-primary" />
        随机分队工具
      </h1>
      <p class="text-muted-foreground">随机将人员分成多个队伍</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">分队配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- 分队模式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">分队模式</label>
            <select v-model="teamMode" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="by-count">按队伍数量分队</option>
              <option value="by-size">按每队人数分队</option>
            </select>
          </div>

          <!-- 队伍数量 -->
          <div v-if="teamMode === 'by-count'">
            <label class="text-sm font-medium mb-2 block">队伍数量</label>
            <div class="flex gap-2">
              <input
                v-model.number="teamCount"
                type="number"
                min="2"
                max="20"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">队</span>
            </div>
          </div>

          <!-- 每队人数 -->
          <div v-if="teamMode === 'by-size'">
            <label class="text-sm font-medium mb-2 block">每队人数</label>
            <div class="flex gap-2">
              <input
                v-model.number="teamSize"
                type="number"
                min="1"
                max="50"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">人</span>
            </div>
          </div>

          <!-- 分组方式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">分组方式</label>
            <select v-model="groupMethod" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="random">完全随机</option>
              <option value="balanced">平衡分组</option>
              <option value="custom">自定义分组</option>
            </select>
          </div>
        </div>

        <!-- 人员列表 -->
        <div class="mt-6">
          <label class="text-sm font-medium mb-2 block">人员名单（每行一个）</label>
          <textarea
            v-model="membersInput"
            placeholder="输入人员名单，每行一个...&#10;例如：&#10;张三&#10;李四&#10;王五"
            class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-32 resize-none"
          ></textarea>
          <div class="mt-2 text-sm text-muted-foreground">
            当前 {{ members.length }} 人
            <span v-if="teamMode === 'by-count' && teamCount > 0">
              · 预计 {{ Math.ceil(members.length / teamCount) }} 人/队
            </span>
            <span v-if="teamMode === 'by-size' && teamSize > 0">
              · 预计 {{ Math.ceil(members.length / teamSize) }} 个队伍
            </span>
          </div>
        </div>

        <!-- 预设模板 -->
        <div class="mt-6">
          <label class="text-sm font-medium mb-2 block">预设模板</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="loadTemplate('class')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              班级分组
            </button>
            <button
              @click="loadTemplate('meeting')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              会议分组
            </button>
            <button
              @click="loadTemplate('sports')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              运动分组
            </button>
            <button
              @click="loadTemplate('numbers')"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              数字编号
            </button>
          </div>
        </div>

        <!-- 快捷按钮 -->
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            @click="quickSetup(2)"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            2队分组
          </button>
          <button
            @click="quickSetup(4)"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            4队分组
          </button>
          <button
            v-if="teamMode === 'by-size'"
            @click="teamSize = 5"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            5人/队
          </button>
          <button
            v-if="teamMode === 'by-size'"
            @click="teamSize = 10"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            10人/队
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="createTeams"
          :disabled="isGrouping || members.length === 0"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isGrouping" class="w-5 h-5 animate-spin" />
          <Users v-else class="w-5 h-5" />
          {{ isGrouping ? '分组中...' : '开始分组' }}
        </button>

        <button
          @click="shuffleTeams"
          :disabled="currentTeams.length === 0"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Shuffle class="w-5 h-5" />
          重新分组
        </button>

        <button
          v-if="currentTeams.length > 0"
          @click="clearTeams"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Trash2 class="w-5 h-5" />
          清空分组
        </button>
      </div>

      <!-- 分组结果显示 -->
      <div v-if="currentTeams.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">分组结果</h2>
          <div class="flex gap-2">
            <button
              @click="copyTeams"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              {{ copied ? '已复制' : '复制分组' }}
            </button>
            <button
              @click="exportTeams"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Download class="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(team, index) in currentTeams"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold flex items-center gap-2">
                <span :style="{ color: getTeamColor(index) }" class="text-lg">●</span>
                {{ getTeamName(index) }}
              </h3>
              <span class="text-sm text-muted-foreground">{{ team.members.length }}人</span>
            </div>

            <div class="space-y-2">
              <div
                v-for="(member, memberIndex) in team.members"
                :key="memberIndex"
                class="flex items-center gap-2 p-2 bg-white rounded border"
              >
                <span class="text-lg">{{ getTeamEmoji(memberIndex) }}</span>
                <span class="font-medium">{{ member }}</span>
              </div>
            </div>

            <!-- 队长指示器 -->
            <div v-if="team.captain" class="mt-3 text-xs text-muted-foreground">
              队长：{{ team.captain }}
            </div>
          </div>
        </div>

        <!-- 分组统计 -->
        <div class="mt-6">
          <h3 class="font-medium mb-3">分组统计</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-primary">{{ currentTeams.length }}</div>
              <div class="text-sm text-muted-foreground">队伍数量</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-primary">{{ totalMembers }}</div>
              <div class="text-sm text-muted-foreground">总人数</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-primary">{{ averageTeamSize }}</div>
              <div class="text-sm text-muted-foreground">平均每队</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-primary">{{ groupCount }}</div>
              <div class="text-sm text-muted-foreground">分组次数</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分组历史 -->
      <div v-if="teamHistory.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">分组历史</h2>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="(history, index) in teamHistory"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">{{ history.timestamp }}</span>
              <div class="flex gap-2">
                <button
                  @click="restoreTeams(history)"
                  class="text-sm text-primary hover:text-primary/80"
                >
                  恢复
                </button>
                <button
                  @click="removeHistory(index)"
                  class="text-sm text-red-500 hover:text-red-600"
                >
                  删除
                </button>
              </div>
            </div>
            <div class="text-sm mt-1">
              {{ history.teams.length }}个队伍，{{ history.totalMembers }}人
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">使用说明</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">分组方式说明</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">完全随机</h4>
                <p class="text-muted-foreground">完全随机分配，不考虑平衡性</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">平衡分组</h4>
                <p class="text-muted-foreground">尽量使各队人数相等</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">自定义分组</h4>
                <p class="text-muted-foreground">手动调整分组结果</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">应用场景</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>班级活动和学生分组</li>
              <li>团队建设和活动组织</li>
              <li>运动比赛分队</li>
              <li>会议讨论分组</li>
              <li>游戏娱乐分队</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">使用技巧</h3>
            <p class="text-muted-foreground">
              分组前确保人员名单准确，避免重名。对于重要的分组活动，
              建议多次分组取平均值，或使用平衡分组确保公平性。
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
            to="/tools/random-name-picker"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <User class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机姓名抽取</p>
              <p class="text-xs text-muted-foreground">点名抽奖工具</p>
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
import { Users, RefreshCw, Trash2, Copy, Download, Shuffle, List, Hash, User, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机分队工具 - 在线队伍分组')

// 配置
const teamMode = ref('by-count')
const teamCount = ref(4)
const teamSize = ref(5)
const groupMethod = ref('random')
const membersInput = ref('')

// 状态
const isGrouping = ref(false)
const currentTeams = ref([])
const teamHistory = ref([])
const copied = ref(false)
const groupCount = ref(0)

// 计算属性
const members = computed(() => {
  if (!membersInput.value.trim()) return []
  return membersInput.value.split('\n')
    .map(name => name.trim())
    .filter(name => name.length > 0)
})

const totalMembers = computed(() => {
  return members.value.length
})

const averageTeamSize = computed(() => {
  if (currentTeams.value.length === 0) return 0
  return Math.round(totalMembers.value / currentTeams.value.length * 10) / 10
})

// 预设模板
const templates = {
  class: [
    '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
    '郑一', '王二', '冯三', '陈四', '褚五', '卫六', '蒋七', '沈八',
    '韩九', '杨十'
  ],
  meeting: [
    '产品经理', '技术负责人', '设计师', '前端开发', '后端开发',
    '测试工程师', '运营专员', '市场经理', '客服代表', '数据分析师'
  ],
  sports: [
    '小明', '小红', '小刚', '小美', '大强', '大壮', '大胖', '大个',
    '阿杰', '阿明', '阿华', '阿强', '阿军', '阿飞', '阿龙', '阿虎'
  ],
  numbers: Array.from({ length: 20 }, (_, i) => `人员${i + 1}`)
}

// 队伍颜色
const teamColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
]

// 队伍名称
const teamNames = [
  '蓝队', '红队', '绿队', '黄队', '紫队',
  '粉队', '青队', '橙队', '靛队', '草绿队'
]

// 加载模板
const loadTemplate = (templateName) => {
  if (templates[templateName]) {
    membersInput.value = templates[templateName].join('\n')
    if (templateName === 'class') {
      teamCount.value = 4
      teamMode.value = 'by-count'
    } else if (templateName === 'meeting') {
      teamSize.value = 5
      teamMode.value = 'by-size'
    } else if (templateName === 'sports') {
      teamCount.value = 4
      teamMode.value = 'by-count'
    }
  }
}

// 快捷设置
const quickSetup = (count) => {
  teamMode.value = 'by-count'
  teamCount.value = count
}

// 获取队伍颜色
const getTeamColor = (index) => {
  return teamColors[index % teamColors.length]
}

// 获取队伍名称
const getTeamName = (index) => {
  if (index < teamNames.length) {
    return teamNames[index]
  }
  return `${index + 1}队`
}

// 获取emoji
const getTeamEmoji = (index) => {
  const emojis = ['😊', '😎', '🤓', '😏', '🥳', '🤠', '🦄', '🐼', '🦁', '🐯']
  return emojis[index % emojis.length]
}

// 创建队伍
const createTeams = async () => {
  if (isGrouping.value || members.value.length === 0) return

  isGrouping.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  let teams = []
  const shuffledMembers = [...members.value].sort(() => Math.random() - 0.5)

  if (teamMode.value === 'by-count') {
    // 按队伍数量分队
    teams = Array.from({ length: teamCount.value }, (_, i) => ({
      name: getTeamName(i),
      color: getTeamColor(i),
      members: []
    }))

    shuffledMembers.forEach((member, index) => {
      teams[index % teamCount.value].members.push(member)
    })
  } else {
    // 按每队人数分队
    const numTeams = Math.ceil(shuffledMembers.length / teamSize.value)
    teams = Array.from({ length: numTeams }, (_, i) => ({
      name: getTeamName(i),
      color: getTeamColor(i),
      members: []
    }))

    shuffledMembers.forEach((member, index) => {
      teams[Math.floor(index / teamSize.value)].members.push(member)
    })
  }

  // 设置队长（第一个成员）
  teams.forEach(team => {
    if (team.members.length > 0) {
      team.captain = team.members[0]
    }
  })

  // 平衡分组
  if (groupMethod.value === 'balanced' && teamMode.value === 'by-count') {
    teams = balanceTeams(teams)
  }

  currentTeams.value = teams
  addToHistory(teams)
  groupCount.value++

  isGrouping.value = false
}

// 平衡分组
const balanceTeams = (teams) => {
  const maxTeamSize = Math.max(...teams.map(t => t.members.length))
  const minTeamSize = Math.min(...teams.map(t => t.members.length))

  if (maxTeamSize - minTeamSize <= 1) {
    return teams
  }

  // 简单的平衡算法
  const sortedTeams = [...teams].sort((a, b) => b.members.length - a.members.length)
  let attempts = 0

  while (sortedTeams[0].members.length - sortedTeams[sortedTeams.length - 1].members.length > 1 && attempts < 100) {
    const largest = sortedTeams[0]
    const smallest = sortedTeams[sortedTeams.length - 1]

    if (largest.members.length > smallest.members.length + 1) {
      const member = largest.members.pop()
      smallest.members.push(member)
    }

    attempts++
  }

  return sortedTeams
}

// 重新分组
const shuffleTeams = () => {
  createTeams()
}

// 清空分组
const clearTeams = () => {
  currentTeams.value = []
}

// 添加到历史
const addToHistory = (teams) => {
  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  teamHistory.value.unshift({
    teams: JSON.parse(JSON.stringify(teams)),
    timestamp,
    totalMembers: totalMembers.value
  })

  if (teamHistory.value.length > 20) {
    teamHistory.value = teamHistory.value.slice(0, 20)
  }
}

// 恢复分组
const restoreTeams = (history) => {
  currentTeams.value = JSON.parse(JSON.stringify(history.teams))
}

// 删除历史
const removeHistory = (index) => {
  teamHistory.value.splice(index, 1)
}

// 复制分组
const copyTeams = async () => {
  try {
    const text = currentTeams.value.map((team, index) => {
      const members = team.members.join(', ')
      return `${team.name}: ${members}`
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

// 导出分组
const exportTeams = () => {
  if (currentTeams.value.length === 0) return

  let content = '分组结果导出\n'
  content += '==============\n\n'
  content += `分组时间: ${new Date().toLocaleString()}\n`
  content += `分组模式: ${teamMode.value === 'by-count' ? '按队伍数量' : '按每队人数'}\n`
  content += `总人数: ${totalMembers.value}\n`
  content += `队伍数量: ${currentTeams.value.length}\n\n`

  content += '队伍详情:\n'
  content += '------------\n\n'

  currentTeams.value.forEach((team, index) => {
    content += `${team.name} (${team.members.length}人)\n`
    if (team.captain) {
      content += `队长: ${team.captain}\n`
    }
    content += '成员:\n'
    team.members.forEach((member, memberIndex) => {
      content += `  ${memberIndex + 1}. ${member}\n`
    })
    content += '\n'
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `team-groups-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>