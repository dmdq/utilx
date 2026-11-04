<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3 flex items-center gap-2">
        <LayoutGrid :size="36" />
        待办事项看板 - 在线看板管理工具 | 项目管理任务跟踪
      </h1>
      <p class="text-muted-foreground">免费在线看板管理工具，支持Todo/Doing/Done三栏管理，拖拽操作，本地存储，适用于项目管理和任务跟踪。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="mb-8">
      <!-- 添加任务 -->
      <div class="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-foreground mb-4">添加新任务</h2>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div class="md:col-span-4">
            <input
              v-model="newItem.title"
              type="text"
              class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="任务标题"
              @keyup.enter="addItem"
            />
          </div>
          <div class="md:col-span-4">
            <input
              v-model="newItem.description"
              type="text"
              class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="描述（可选）"
            />
          </div>
          <div class="md:col-span-2">
            <select
              v-model="newItem.priority"
              class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">低优先级</option>
              <option value="medium">中优先级</option>
              <option value="high">高优先级</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <select
              v-model="newItem.column"
              class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todo">待办</option>
              <option value="doing">进行中</option>
              <option value="done">已完成</option>
            </select>
          </div>
          <div class="md:col-span-12 flex gap-2">
            <button
              @click="addItem"
              class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus :size="18" />
              添加任务
            </button>
            <button
              @click="clearAll"
              class="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
            >
              清空所有
            </button>
          </div>
        </div>
      </div>

      <!-- 看板列 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="column in columns"
          :key="column.id"
          class="bg-muted border border-border rounded-lg p-4"
          @drop="onDrop($event, column.id)"
          @dragover="onDragOver"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-foreground flex items-center gap-2">
              {{ column.title }}
              <span class="bg-primary/20 text-primary text-sm px-2 py-0.5 rounded-full">
                {{ column.items.length }}
              </span>
            </h3>
          </div>

          <div class="space-y-3 min-h-[400px]">
            <div
              v-for="item in column.items"
              :key="item.id"
              draggable="true"
              @dragstart="onDragStart($event, item, column.id)"
              class="bg-card border border-border rounded-lg p-3 cursor-move hover:border-primary/50 transition-colors group"
            >
              <div class="flex items-start gap-2">
                <GripVertical :size="16" class="text-muted-foreground mt-1 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <h4 class="font-medium text-foreground truncate">{{ item.title }}</h4>
                    <button
                      @click="deleteItem(column.id, item.id)"
                      class="text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </div>
                  <p v-if="item.description" class="text-sm text-muted-foreground mb-2">
                    {{ item.description }}
                  </p>
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'text-xs px-2 py-0.5 rounded border',
                        getPriorityColor(item.priority)
                      ]"
                    >
                      {{ item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低' }}
                    </span>
                    <span class="text-xs text-muted-foreground">
                      {{ new Date(item.createdAt).toLocaleDateString('zh-CN') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div
              v-if="column.items.length === 0"
              class="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground"
            >
              <div class="text-4xl mb-2">📋</div>
              <div>拖拽任务到此处</div>
            </div>
          </div>
        </div>
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
        <ChevronUp v-if="isSeoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是看板管理？
        </h2>
        <p class="text-muted-foreground mb-4">
          看板（Kanban）是一种敏捷项目管理方法，起源于丰田汽车公司的生产系统。它通过可视化工作流程，
          帮助团队更有效地管理工作任务。看板方法强调在制品（WIP）限制、持续改进和流动效率，
          使团队能够更快地交付价值，同时保持工作质量。
        </p>
        <p class="text-muted-foreground">
          看板的核心原则包括：可视化工作流程、限制在制品数量、管理流动、明确流程策略、实施反馈循环、
          协作改进实验。通过这些原则，团队可以减少浪费、提高效率、优化工作流程。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在顶部表单中填写任务标题和描述（可选）</li>
          <li>选择任务优先级（高、中、低）和目标列（待办、进行中、已完成）</li>
          <li>点击"添加任务"按钮或按回车键添加任务</li>
          <li>拖拽任务卡片到不同列，更新任务状态</li>
          <li>悬停在任务卡片上，点击删除按钮移除任务</li>
          <li>所有数据自动保存到浏览器本地存储</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>三栏看板</strong>: 待办、进行中、已完成三栏管理，清晰展示任务状态</li>
          <li><strong>拖拽操作</strong>: 直观的拖拽交互，轻松移动任务到不同状态</li>
          <li><strong>优先级管理</strong>: 支持高、中、低三个优先级，用颜色区分</li>
          <li><strong>本地存储</strong>: 所有数据保存在浏览器本地，无需联网，保护隐私</li>
          <li><strong>响应式设计</strong>: 适配各种屏幕尺寸，移动端也能流畅使用</li>
          <li><strong>任务详情</strong>: 支持任务标题、描述、优先级和创建时间</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          看板管理的优势
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">提高可视化程度</h3>
            <p class="text-muted-foreground mt-1">
              看板将工作流程可视化，让每个人都能清楚地看到任务的状态、进度和瓶颈。
              这种透明度有助于团队识别问题并快速做出调整。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">限制在制品（WIP）</h3>
            <p class="text-muted-foreground mt-1">
              通过限制同时进行的任务数量，团队可以更专注于完成当前任务，
              减少任务切换的开销，提高整体效率和质量。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">持续改进</h3>
            <p class="text-muted-foreground mt-1">
              看板鼓励团队不断反思和改进工作流程。通过监控关键指标如周期时间、吞吐量等，
              团队可以识别改进机会并实施优化措施。
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
import { useRouter } from 'vue-router'
import {
  LayoutGrid, Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
  FileText, CheckSquare, Calendar, ListTodo, Target, Clock, GitBranch
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '待办事项看板 - 在线看板管理工具 | 项目管理任务跟踪',
  description: '免费在线看板管理工具，支持Todo/Doing/Done三栏管理，拖拽操作，本地存储，适用于项目管理和任务跟踪。',
  keywords: '看板,任务管理,项目管理,敏捷开发,Todo看板,任务跟踪,在线看板,Kanban,看板工具',
  author: 'Util工具箱',
  ogTitle: '待办事项看板 - 免费在线看板管理工具',
  ogDescription: '专业的在线看板管理工具，支持三栏管理、拖拽操作、优先级设置。纯前端处理，数据安全可靠。',
  ogType: 'website'
})

const columns = ref([
  { id: 'todo', title: '待办', items: [] },
  { id: 'doing', title: '进行中', items: [] },
  { id: 'done', title: '已完成', items: [] }
])

const newItem = ref({
  title: '',
  description: '',
  priority: 'medium',
  column: 'todo'
})

const draggedItem = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, CheckSquare, Calendar, ListTodo, Target, Clock, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'todo-list-generator'),
    tools.find(t => t.id === 'quick-notes'),
    tools.find(t => t.id === 'time-tracker'),
    tools.find(t => t.id === 'mind-map')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 添加任务
const addItem = () => {
  if (!newItem.value.title.trim()) return

  const column = columns.value.find(c => c.id === newItem.value.column)
  column.items.push({
    id: Date.now(),
    title: newItem.value.title,
    description: newItem.value.description,
    priority: newItem.value.priority,
    createdAt: new Date().toISOString()
  })

  newItem.value = {
    title: '',
    description: '',
    priority: 'medium',
    column: 'todo'
  }

  saveToStorage()
}

// 删除任务
const deleteItem = (columnId, itemId) => {
  const column = columns.value.find(c => c.id === columnId)
  column.items = column.items.filter(i => i.id !== itemId)
  saveToStorage()
}

// 拖拽开始
const onDragStart = (event, item, columnId) => {
  draggedItem.value = { item, columnId }
  event.dataTransfer.effectAllowed = 'move'
}

// 拖拽结束
const onDrop = (event, targetColumnId) => {
  event.preventDefault()
  if (!draggedItem.value) return

  const { item, columnId: sourceColumnId } = draggedItem.value

  // 从源列移除
  const sourceColumn = columns.value.find(c => c.id === sourceColumnId)
  sourceColumn.items = sourceColumn.items.filter(i => i.id !== item.id)

  // 添加到目标列
  const targetColumn = columns.value.find(c => c.id === targetColumnId)
  targetColumn.items.push(item)

  draggedItem.value = null
  saveToStorage()
}

// 允许拖拽
const onDragOver = (event) => {
  event.preventDefault()
}

// 优先级颜色
const getPriorityColor = (priority) => {
  const colors = {
    high: 'bg-destructive/20 border-destructive/50 text-destructive',
    medium: 'bg-warning/20 border-warning/50 text-warning',
    low: 'bg-success/20 border-success/50 text-success'
  }
  return colors[priority] || colors.medium
}

// 保存到本地存储
const saveToStorage = () => {
  localStorage.setItem('kanban-board', JSON.stringify(columns.value))
}

// 从本地存储加载
const loadFromStorage = () => {
  const saved = localStorage.getItem('kanban-board')
  if (saved) {
    try {
      columns.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载失败', e)
    }
  }
}

// 清空所有
const clearAll = () => {
  if (confirm('确定要清空所有任务吗？')) {
    columns.value = [
      { id: 'todo', title: '待办', items: [] },
      { id: 'doing', title: '进行中', items: [] },
      { id: 'done', title: '已完成', items: [] }
    ]
    saveToStorage()
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
const tool = tools.find(t => t.id === 'kanban-board')
if (tool) {
  addRecentTool(tool.id)
}

onMounted(() => {
  loadFromStorage()
})
</script>
