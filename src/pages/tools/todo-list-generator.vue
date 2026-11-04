<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3 flex items-center gap-2">
        <CheckSquare :size="36" />
        任务清单生成器 - 在线任务管理工具 | 优先级管理与进度追踪
      </h1>
      <p class="text-muted-foreground">免费在线任务清单生成器，支持优先级标记、分类管理、进度追踪，可导出分享，适用于个人和团队任务规划。数据自动保存，纯本地处理，安全可靠。</p>
    </div>

    <!-- 进度统计 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-foreground">任务进度</h2>
        <div class="text-sm text-muted-foreground">
          {{ stats.completed }} / {{ stats.total }} 已完成
        </div>
      </div>
      <div class="w-full bg-muted rounded-full h-4 overflow-hidden">
        <div
          class="h-full bg-primary transition-all duration-500"
          :style="{ width: stats.progress + '%' }"
        ></div>
      </div>
      <div class="text-center mt-2 text-2xl font-bold text-primary">
        {{ stats.progress }}%
      </div>
    </div>

    <!-- 添加任务 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex gap-2">
        <input
          v-model="newTask"
          @keyup.enter="addTask"
          type="text"
          class="flex-1 px-4 py-3 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="输入新任务，按回车添加..."
        />
        <button
          @click="addTask"
          class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus :size="20" />
          添加
        </button>
      </div>
    </div>

    <!-- 筛选和排序 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-6">
      <div class="flex flex-wrap gap-3">
        <div class="flex gap-2">
          <button
            @click="filter = 'all'"
            :class="[
              'px-4 py-2 rounded-lg transition-colors',
              filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'
            ]"
          >
            全部 ({{ stats.total }})
          </button>
          <button
            @click="filter = 'active'"
            :class="[
              'px-4 py-2 rounded-lg transition-colors',
              filter === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'
            ]"
          >
            进行中 ({{ stats.active }})
          </button>
          <button
            @click="filter = 'completed'"
            :class="[
              'px-4 py-2 rounded-lg transition-colors',
              filter === 'completed' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'
            ]"
          >
            已完成 ({{ stats.completed }})
          </button>
        </div>
        <select
          v-model="sortBy"
          class="px-4 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="priority">按优先级</option>
          <option value="date">按时间</option>
          <option value="name">按名称</option>
        </select>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="space-y-4 mb-6">
      <div
        v-for="(items, category) in groupedTasks"
        :key="category"
        class="bg-card border border-border rounded-lg p-6"
      >
        <h3 class="text-lg font-semibold text-foreground mb-3">
          {{ category === 'default' ? '默认' : category }}
          <span class="text-sm font-normal text-muted-foreground">({{ items.length }})</span>
        </h3>
        <div class="space-y-2">
          <div
            v-for="task in items"
            :key="task.id"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <button
              @click="toggleTask(task.id)"
              :class="[
                'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0',
                task.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary'
              ]"
            >
              <CheckSquare v-if="task.completed" :size="16" class="text-primary-foreground" />
            </button>

            <div class="flex-1 min-w-0">
              <p
                :class="[
                  'font-medium',
                  task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                ]"
              >
                {{ task.text }}
              </p>
            </div>

            <select
              :value="task.priority"
              @change="updatePriority(task.id, $event.target.value)"
              class="px-2 py-1 text-sm bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">🟢 低</option>
              <option value="medium">🟡 中</option>
              <option value="high">🔴 高</option>
            </select>

            <select
              :value="task.category"
              @change="updateCategory(task.id, $event.target.value)"
              class="px-2 py-1 text-sm bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="default">默认</option>
              <option value="工作">工作</option>
              <option value="个人">个人</option>
              <option value="学习">学习</option>
              <option value="其他">其他</option>
            </select>

            <button
              @click="deleteTask(task.id)"
              class="p-2 text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出操作 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex flex-wrap gap-3">
        <button
          @click="exportList"
          class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Download :size="20" />
          导出清单
        </button>
        <button
          @click="copyToClipboard"
          class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Share2 :size="20" />
          复制分享
        </button>
        <button
          v-if="stats.completed > 0"
          @click="clearCompleted"
          class="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
        >
          清空已完成
        </button>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
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
          什么是任务清单生成器？
        </h2>
        <p class="text-muted-foreground mb-4">
          任务清单生成器是一款免费的在线任务管理工具，帮助个人和团队高效规划、追踪和管理日常任务。
          支持优先级标记、分类管理、进度追踪等功能，让您的任务管理更加系统化和高效化。
          所有数据都保存在浏览器本地，确保您的隐私安全。
        </p>
        <p class="text-muted-foreground">
          无论是日常工作计划、学习任务列表，还是项目管理需求，任务清单生成器都能满足您的需求。
          通过可视化的进度条和直观的任务分类，您可以轻松掌握任务完成情况，提升工作效率。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中输入新任务内容，点击"添加"按钮或按回车键添加任务</li>
          <li>使用优先级选择器（高/中/低）标记任务的重要程度</li>
          <li>通过分类功能组织不同类型的任务（工作/个人/学习/其他）</li>
          <li>点击任务左侧的方框标记任务完成状态</li>
          <li>使用筛选功能查看全部、进行中或已完成的任务</li>
          <li>导出或分享您的任务清单，便于离线查看或团队协作</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>优先级管理</strong>: 支持高、中、低三个优先级，帮助您聚焦重要任务</li>
          <li><strong>分类组织</strong>: 支持工作、个人、学习、等多个分类，让任务更有条理</li>
          <li><strong>进度追踪</strong>: 可视化进度条显示任务完成情况，一目了然</li>
          <li><strong>本地存储</strong>: 数据自动保存到浏览器本地，无需登录，隐私安全</li>
          <li><strong>灵活排序</strong>: 支持按优先级、时间、名称等多种方式排序</li>
          <li><strong>导出分享</strong>: 支持导出为文本文件或复制分享，方便离线使用</li>
          <li><strong>智能筛选</strong>: 快速筛选全部、进行中或已完成的任务</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">个人任务管理</h3>
            <p class="text-muted-foreground mt-1">
              适用于日常生活规划、购物清单、旅行准备、学习计划等个人任务管理。
              通过优先级标记确保重要事项不被遗漏。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">工作任务规划</h3>
            <p class="text-muted-foreground mt-1">
              帮助职场人士规划日常工作任务、项目管理、会议准备等工作事项。
              分类功能让工作和个人任务清晰分离。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">团队协作</h3>
            <p class="text-muted-foreground mt-1">
              通过导出和分享功能，可以将任务清单分享给团队成员，便于协作和任务分配。
              适用于小型团队的任务沟通和进度同步。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">学习计划</h3>
            <p class="text-muted-foreground mt-1">
              学生和终身学习者可以使用本工具规划学习任务、阅读清单、课程作业等。
              进度追踪功能帮助保持学习动力。
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
import { ref, computed, onMounted } from 'vue'
import { CheckSquare, Plus, Trash2, Download, Share2, HelpCircle, ChevronUp } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '任务清单生成器 - 在线任务清单工具 | 优先级管理进度追踪',
  description: '免费在线任务清单生成器，支持优先级标记、分类管理、进度追踪，可导出分享，适用于个人和团队任务规划。',
  keywords: '任务清单,待办事项,任务管理,优先级,任务规划,效率工具,清单生成,任务跟踪'
})

const newTask = ref('')
const tasks = ref([])
const filter = ref('all') // all, active, completed
const sortBy = ref('priority') // priority, date, name

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 定义当前工具
const tool = tools.find(t => t.id === 'todo-list-generator')

// 图标映射
const iconMap = {
  CheckSquare, Plus, Trash2, Download, Share2
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'quick-notes'),
    tools.find(t => t.id === 'time-tracker'),
    tools.find(t => t.id === 'mind-map'),
    tools.find(t => t.id === 'kanban-board')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 添加任务
const addTask = () => {
  if (!newTask.value.trim()) return

  tasks.value.push({
    id: Date.now(),
    text: newTask.value.trim(),
    completed: false,
    priority: 'medium',
    category: 'default',
    createdAt: new Date().toISOString()
  })

  newTask.value = ''
  saveToStorage()
}

// 删除任务
const deleteTask = (taskId) => {
  tasks.value = tasks.value.filter(t => t.id !== taskId)
  saveToStorage()
}

// 切换完成状态
const toggleTask = (taskId) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
    saveToStorage()
  }
}

// 更新优先级
const updatePriority = (taskId, priority) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.priority = priority
    saveToStorage()
  }
}

// 更新分类
const updateCategory = (taskId, category) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.category = category
    saveToStorage()
  }
}

// 过滤和排序后的任务
const filteredTasks = computed(() => {
  let filtered = [...tasks.value]

  // 过滤
  if (filter.value === 'active') {
    filtered = filtered.filter(t => !t.completed)
  } else if (filter.value === 'completed') {
    filtered = filtered.filter(t => t.completed)
  }

  // 排序
  filtered.sort((a, b) => {
    if (sortBy.value === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    } else if (sortBy.value === 'date') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    } else {
      return a.text.localeCompare(b.text)
    }
  })

  return filtered
})

// 统计
const stats = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter(t => t.completed).length
  const active = total - completed
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, completed, active, progress }
})

// 按分类分组的任务
const groupedTasks = computed(() => {
  const groups = {}
  filteredTasks.value.forEach(task => {
    const cat = task.category || 'default'
    if (!groups[cat]) {
      groups[cat] = []
    }
    groups[cat].push(task)
  })
  return groups
})

// 导出清单
const exportList = () => {
  let content = `任务清单\n${'='.repeat(40)}\n\n`
  content += `进度: ${stats.completed}/${stats.total} (${stats.progress}%)\n\n`

  Object.entries(groupedTasks.value).forEach(([category, items]) => {
    content += `\n【${category === 'default' ? '默认' : category}】\n`
    items.forEach((task, index) => {
      const status = task.completed ? '✓' : '○'
      const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'
      content += `${status} ${priority} ${task.text}\n`
    })
  })

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `任务清单_${new Date().toLocaleDateString('zh-CN')}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

// 复制到剪贴板
const copyToClipboard = () => {
  let content = '任务清单\n\n'
  Object.entries(groupedTasks.value).forEach(([category, items]) => {
    content += `\n【${category === 'default' ? '默认' : category}】\n`
    items.forEach((task) => {
      const status = task.completed ? '[x]' : '[ ]'
      content += `${status} ${task.text}\n`
    })
  })

  navigator.clipboard.writeText(content)
  alert('已复制到剪贴板')
}

// 清空已完成
const clearCompleted = () => {
  if (confirm('确定要删除所有已完成的任务吗？')) {
    tasks.value = tasks.value.filter(t => !t.completed)
    saveToStorage()
  }
}

// 保存到本地存储
const saveToStorage = () => {
  localStorage.setItem('todo-list', JSON.stringify(tasks.value))
}

// 从本地存储加载
const loadFromStorage = () => {
  const saved = localStorage.getItem('todo-list')
  if (saved) {
    try {
      tasks.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载失败', e)
    }
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

onMounted(() => {
  loadFromStorage()
})
</script>
