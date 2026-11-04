<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">会议纪要生成器 - 在线会议记录工具</h1>
      <p class="text-muted-foreground">一款免费的在线会议纪要生成工具。支持参会人员管理、议题讨论记录、任务分配追踪，可导出为文本格式。适用于团队协作会议、项目会议等场景，纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：编辑区 -->
      <div class="space-y-4">
        <!-- 基本信息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar :size="24" class="text-primary" />
            基本信息
          </h2>
          <div class="space-y-3">
            <div>
              <label class="text-sm text-muted-foreground mb-1 block">会议标题</label>
              <input
                v-model="meeting.title"
                type="text"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="输入会议标题"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm text-muted-foreground mb-1 block">日期</label>
                <input
                  v-model="meeting.date"
                  type="date"
                  class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="text-sm text-muted-foreground mb-1 block">时间</label>
                <input
                  v-model="meeting.time"
                  type="time"
                  class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label class="text-sm text-muted-foreground mb-1 block">地点</label>
              <input
                v-model="meeting.location"
                type="text"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="输入会议地点"
              />
            </div>
          </div>
        </div>

        <!-- 参会人员 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users :size="24" class="text-primary" />
            参会人员 ({{ meeting.attendees.length }})
          </h2>
          <div class="flex gap-2 mb-3">
            <input
              v-model="newAttendee"
              @keyup.enter="addAttendee"
              type="text"
              class="flex-1 px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入姓名"
            />
            <button
              @click="addAttendee"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center gap-1"
            >
              <Plus :size="18" />
              添加
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(attendee, index) in meeting.attendees"
              :key="index"
              class="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
            >
              <span class="text-foreground">{{ attendee }}</span>
              <button
                @click="removeAttendee(index)"
                class="text-destructive hover:text-destructive/80 transition"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>

        <!-- 会议议程 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock :size="24" class="text-primary" />
            会议议程
          </h2>
          <div class="flex gap-2 mb-3">
            <input
              v-model="newAgendaItem"
              @keyup.enter="addAgendaItem"
              type="text"
              class="flex-1 px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入议程项"
            />
            <button
              @click="addAgendaItem"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center gap-1"
            >
              <Plus :size="18" />
              添加
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(item, index) in meeting.agenda"
              :key="index"
              class="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <button
                  @click="toggleAgendaComplete(index)"
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition',
                    item.completed ? 'bg-primary border-primary' : 'border-border'
                  ]"
                >
                  <CheckSquare v-if="item.completed" :size="14" class="text-primary-foreground" />
                </button>
                <span :class="{ 'line-through text-muted-foreground': item.completed }" class="text-foreground">
                  {{ item.title }}
                </span>
              </div>
              <button
                @click="removeAgendaItem(index)"
                class="text-destructive hover:text-destructive/80 transition"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>

        <!-- 行动项 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckSquare :size="24" class="text-primary" />
            行动项
          </h2>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <input
              v-model="newActionItem.task"
              type="text"
              class="col-span-2 px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="任务描述"
            />
            <input
              v-model="newActionItem.assignee"
              type="text"
              class="px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="负责人"
            />
            <input
              v-model="newActionItem.dueDate"
              type="date"
              class="px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              v-model="newActionItem.priority"
              class="px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">低优先级</option>
              <option value="medium">中优先级</option>
              <option value="high">高优先级</option>
            </select>
            <button
              @click="addActionItem"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-1"
            >
              <Plus :size="18" />
              添加
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(item, index) in meeting.actionItems"
              :key="item.id"
              class="bg-muted rounded-lg px-3 py-2"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-start gap-2 flex-1">
                  <button
                    @click="toggleActionComplete(index)"
                    :class="[
                      'w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition flex-shrink-0',
                      item.completed ? 'bg-primary border-primary' : 'border-border'
                    ]"
                  >
                    <CheckSquare v-if="item.completed" :size="14" class="text-primary-foreground" />
                  </button>
                  <span :class="{ 'line-through text-muted-foreground': item.completed }" class="text-foreground">
                    {{ item.task }}
                  </span>
                </div>
                <button
                  @click="removeActionItem(index)"
                  class="text-destructive hover:text-destructive/80 transition"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
              <div class="text-xs text-muted-foreground ml-7">
                {{ item.assignee || '未分配' }} | {{ item.dueDate || '无截止日期' }} |
                <span :class="{
                  'text-destructive': item.priority === 'high',
                  'text-yellow-600': item.priority === 'medium',
                  'text-green-600': item.priority === 'low'
                }">
                  {{ item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低' }}优先级
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：讨论记录和预览 -->
      <div class="space-y-4">
        <!-- 讨论记录 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText :size="24" class="text-primary" />
            讨论记录
          </h2>
          <textarea
            v-model="meeting.notes"
            class="w-full h-64 px-4 py-3 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="记录会议讨论要点..."
          ></textarea>
        </div>

        <!-- 预览和导出 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-foreground">会议纪要预览</h2>
            <div class="flex gap-2">
              <button
                @click="copyToClipboard"
                class="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition"
              >
                复制
              </button>
              <button
                @click="exportAsText"
                class="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition flex items-center gap-1"
              >
                <Download :size="16" />
                导出
              </button>
            </div>
          </div>
          <div class="bg-muted rounded-lg p-4 h-96 overflow-y-auto">
            <pre class="whitespace-pre-wrap text-sm text-foreground font-mono">{{ generateMinutes() }}</pre>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <button
            @click="clear"
            class="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition flex items-center justify-center gap-2"
          >
            <Trash2 :size="18" />
            清空
          </button>
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
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是会议纪要生成器？
        </h2>
        <p class="text-muted-foreground mb-4">
          会议纪要生成器是一款专业的在线工具，帮助团队高效记录会议内容、追踪任务行动。
          它支持参会人员管理、议程规划、讨论记录和行动项跟踪，确保会议成果得到有效落实。
        </p>
        <p class="text-muted-foreground">
          无论是团队协作会议、项目进度会议，还是决策讨论会议，本工具都能帮助您快速生成规范的会议纪要，
          提高会议效率，避免遗漏重要信息。所有数据处理均在本地完成，确保信息安全。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>填写会议基本信息（标题、日期、时间、地点）</li>
          <li>添加参会人员名单，记录参与者</li>
          <li>规划会议议程，设置议题和时长</li>
          <li>记录会议讨论要点和决策内容</li>
          <li>分配行动项，指定负责人和截止日期</li>
          <li>预览并导出会议纪要文档</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>参会人员管理</strong>: 快速添加和管理参会人员名单</li>
          <li><strong>议程规划</strong>: 设置会议议程和讨论时长，跟踪完成状态</li>
          <li><strong>讨论记录</strong>: 大文本框记录会议讨论要点和决策内容</li>
          <li><strong>行动项跟踪</strong>: 分配任务、设置优先级、指定负责人和截止日期</li>
          <li><strong>自动保存</strong>: 本地存储数据，防止意外丢失</li>
          <li><strong>多种导出</strong>: 支持复制到剪贴板或导出为文本文件</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">团队协作会议</h3>
            <p class="text-muted-foreground mt-1">
              记录团队周会、月会讨论内容，追踪项目进展和任务分配，确保团队目标一致。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">项目会议</h3>
            <p class="text-muted-foreground mt-1">
              记录项目需求评审、技术方案讨论，明确行动项和责任分工，提高项目执行效率。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">决策会议</h3>
            <p class="text-muted-foreground mt-1">
              记录重要决策过程和结论，形成正式的会议文档，便于后续查阅和执行。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">头脑风暴会议</h3>
            <p class="text-muted-foreground mt-1">
              记录创意想法和讨论要点，整理后续行动计划，确保创意得到落实。
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">会议纪要生成器安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。本工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。我们使用 localStorage 技术实现数据自动保存，
              确保您的会议信息安全私密，您可以放心使用。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何导出会议纪要？</h3>
            <p class="text-muted-foreground mt-1">
              您可以点击"复制"按钮将会议纪要复制到剪贴板，然后粘贴到任何文档编辑器中；
              也可以点击"导出"按钮，将会议纪要保存为文本文件。导出内容采用 Markdown 格式，
              易于阅读和分享。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">数据会自动保存吗？</h3>
            <p class="text-muted-foreground mt-1">
              是的，本工具具有自动保存功能。您的每次输入和修改都会自动保存到浏览器的本地存储中，
              即使关闭浏览器再重新打开，数据也不会丢失。但请注意，清除浏览器缓存可能会导致数据丢失。
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileText, Users, Calendar, Clock, CheckSquare, Download, Plus, Trash2,
  FileJson, Code, Type, Hash, Link, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '会议纪要生成器 - 在线会议记录工具 | 任务分配追踪',
  description: '免费在线会议纪要生成工具，支持参会人员管理、议题讨论记录、任务分配追踪，可导出为文本格式。适用于团队协作会议、项目会议等场景，纯本地计算，数据隐私绝对安全。',
  keywords: '会议纪要,会议记录,会议模板,任务分配,团队协作,会议管理,在线会议,会议文档',
  author: 'Util工具箱',
  ogTitle: '会议纪要生成器 - 免费在线会议记录工具',
  ogDescription: '专业的会议纪要生成工具，支持参会人员管理、议程规划、讨论记录和行动项跟踪。纯前端处理，数据安全可靠。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '会议纪要生成器 - 免费在线会议记录',
  twitterDescription: '专业的会议纪要生成工具，支持参会人员管理、议程规划、讨论记录和行动项跟踪。纯前端处理，数据安全可靠。'
})

const router = useRouter()

// 定义当前工具
const tool = tools.find(t => t.id === 'meeting-minutes')

// 会议数据
const meeting = ref({
  title: '',
  date: new Date().toISOString().split('T')[0],
  time: '',
  location: '',
  attendees: [],
  agenda: [],
  notes: '',
  actionItems: []
})

const newAttendee = ref('')
const newAgendaItem = ref('')
const newActionItem = ref({
  task: '',
  assignee: '',
  dueDate: '',
  priority: 'medium'
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, Users, Calendar, Clock, CheckSquare, FileJson, Code, Type, Hash, Link
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'office' && t.id !== 'meeting-minutes'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'todo-list-generator'),
    tools.find(t => t.id === 'quick-notes'),
    tools.find(t => t.id === 'kanban-board'),
    tools.find(t => t.id === 'time-tracker')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 添加参会人员
const addAttendee = () => {
  if (newAttendee.value.trim()) {
    meeting.value.attendees.push(newAttendee.value.trim())
    newAttendee.value = ''
  }
}

// 删除参会人员
const removeAttendee = (index) => {
  meeting.value.attendees.splice(index, 1)
}

// 添加议程
const addAgendaItem = () => {
  if (newAgendaItem.value.trim()) {
    meeting.value.agenda.push({
      title: newAgendaItem.value.trim(),
      duration: '',
      completed: false
    })
    newAgendaItem.value = ''
  }
}

// 删除议程
const removeAgendaItem = (index) => {
  meeting.value.agenda.splice(index, 1)
}

// 切换议程完成状态
const toggleAgendaComplete = (index) => {
  meeting.value.agenda[index].completed = !meeting.value.agenda[index].completed
}

// 添加任务
const addActionItem = () => {
  if (newActionItem.value.task.trim()) {
    meeting.value.actionItems.push({
      ...newActionItem.value,
      id: Date.now(),
      completed: false
    })
    newActionItem.value = {
      task: '',
      assignee: '',
      dueDate: '',
      priority: 'medium'
    }
  }
}

// 删除任务
const removeActionItem = (index) => {
  meeting.value.actionItems.splice(index, 1)
}

// 切换任务完成状态
const toggleActionComplete = (index) => {
  meeting.value.actionItems[index].completed = !meeting.value.actionItems[index].completed
}

// 生成会议纪要
const generateMinutes = () => {
  return `# ${meeting.value.title || '会议纪要'}

## 基本信息
- **日期**: ${meeting.value.date}
- **时间**: ${meeting.value.time || '未设置'}
- **地点**: ${meeting.value.location || '未设置'}

## 参会人员
${meeting.value.attendees.length > 0 ? meeting.value.attendees.map(a => `- ${a}`).join('\n') : '- 无'}

## 会议议程
${meeting.value.agenda.length > 0 ? meeting.value.agenda.map((a, i) =>
  `${i + 1}. [${a.completed ? 'x' : ' '}] ${a.title}${a.duration ? ` (${a.duration})` : ''}`
).join('\n') : '- 无议程'}

## 讨论记录
${meeting.value.notes || '暂无讨论记录'}

## 行动项
${meeting.value.actionItems.length > 0 ? meeting.value.actionItems.map((item, i) =>
  `${i + 1}. [${item.completed ? 'x' : ' '}] **${item.task}**
   - 负责人: ${item.assignee || '未分配'}
   - 截止日期: ${item.dueDate || '未设置'}
   - 优先级: ${item.priority}`
).join('\n\n') : '- 无行动项'}

---
生成时间: ${new Date().toLocaleString('zh-CN')}`
}

// 导出为文本
const exportAsText = () => {
  const content = generateMinutes()
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${meeting.value.title || '会议纪要'}_${meeting.value.date}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

// 复制到剪贴板
const copyToClipboard = async () => {
  const content = generateMinutes()
  try {
    await navigator.clipboard.writeText(content)
    // 可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 清空
const clear = () => {
  if (confirm('确定要清空所有内容吗？')) {
    meeting.value = {
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      attendees: [],
      agenda: [],
      notes: '',
      actionItems: []
    }
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 自动保存
watch(meeting, () => {
  localStorage.setItem('meeting-minutes', JSON.stringify(meeting.value))
}, { deep: true })

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

onMounted(() => {
  const saved = localStorage.getItem('meeting-minutes')
  if (saved) {
    try {
      meeting.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载失败', e)
    }
  }
})
</script>
