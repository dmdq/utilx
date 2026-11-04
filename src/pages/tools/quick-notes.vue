<script setup>
import { ref, computed, onMounted } from 'vue'
import { Download, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

useSeoMeta({
  title: '快速笔记工具 - 在线Markdown笔记 | 自动保存本地存储',
  description: '免费在线快速笔记工具，支持Markdown编辑、本地存储、自动保存',
  keywords: '在线笔记,Markdown笔记,快速记录,在线编辑器,本地笔记,笔记工具',
  author: 'Util工具箱',
  ogTitle: '快速笔记工具 - 免费在线Markdown笔记',
  ogDescription: '轻量级在线笔记工具，支持Markdown编辑、本地存储、自动保存。',
  ogType: 'website'
})

const notes = ref([])
const activeNoteId = ref(null)
const searchQuery = ref('')

const activeNote = computed(() => {
  return notes.value.find(n => n.id === activeNoteId.value)
})

const filteredNotes = computed(() => {
  if (!searchQuery.value) return notes.value
  const query = searchQuery.value.toLowerCase()
  return notes.value.filter(n =>
    n.title.toLowerCase().includes(query) ||
    n.content.toLowerCase().includes(query)
  )
})

const createNote = () => {
  const newNote = {
    id: Date.now(),
    title: '新笔记',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  notes.value.unshift(newNote)
  activeNoteId.value = newNote.id
  saveToStorage()
}

const deleteNote = (noteId) => {
  if (confirm('确定要删除这条笔记吗？')) {
    notes.value = notes.value.filter(n => n.id !== noteId)
    if (activeNoteId.value === noteId) {
      activeNoteId.value = notes.value[0]?.id || null
    }
    saveToStorage()
  }
}

const updateNote = (field, value) => {
  if (!activeNote.value) return
  activeNote.value[field] = value
  activeNote.value.updatedAt = new Date().toISOString()
  saveToStorage()
}

const saveToStorage = () => {
  localStorage.setItem('quick-notes', JSON.stringify(notes.value))
}

const loadFromStorage = () => {
  const saved = localStorage.getItem('quick-notes')
  if (saved) {
    try {
      notes.value = JSON.parse(saved)
      if (notes.value.length > 0) {
        activeNoteId.value = notes.value[0].id
      }
    } catch (e) {
      console.error('加载失败', e)
    }
  }
}

const exportNote = () => {
  if (!activeNote.value) return
  const content = '# ' + activeNote.value.title + '\n\n' + activeNote.value.content
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = activeNote.value.title + '.md'
  link.click()
  URL.revokeObjectURL(url)
}

const exportAllNotes = () => {
  const content = notes.value.map(note =>
    '# ' + note.title + '\n\n创建时间: ' + new Date(note.createdAt).toLocaleString('zh-CN') + '\n\n' + note.content + '\n\n---\n\n'
  ).join('')
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '所有笔记_' + new Date().toLocaleDateString('zh-CN') + '.md'
  link.click()
  URL.revokeObjectURL(url)
}

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'todo-list-generator'),
  tools.find(t => t.id === 'mind-map'),
  tools.find(t => t.id === 'meeting-minutes'),
  tools.find(t => t.id === 'text-diff')
].filter(Boolean)

onMounted(() => {
  loadFromStorage()
})
</script>

<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">快速笔记工具 - 在线Markdown笔记</h1>
      <p class="text-muted-foreground">轻量级在线笔记工具，支持Markdown编辑、本地存储、自动保存。随时随地记录您的想法。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      <!-- 左侧：笔记列表 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-4">
          <input
            v-model="searchQuery"
            type="text"
            class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="搜索笔记..."
          />
          <button
            @click="createNote"
            class="w-full mt-3 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition text-sm"
          >
            新建笔记
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-3">笔记列表 ({{ filteredNotes.length }})</h3>
          <div class="space-y-2 max-h-[500px] overflow-y-auto">
            <div
              v-for="note in filteredNotes"
              :key="note.id"
              @click="activeNoteId = note.id"
              :class="[
                'p-3 rounded-lg cursor-pointer transition',
                activeNoteId === note.id
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
              ]"
            >
              <div class="flex items-start justify-between mb-1">
                <div class="font-medium text-foreground truncate flex-1">
                  {{ note.title || '无标题' }}
                </div>
                <button
                  @click.stop="deleteNote(note.id)"
                  class="text-destructive hover:text-destructive/80 ml-2 flex-shrink-0"
                >
                  ×
                </button>
              </div>
              <div class="text-xs text-muted-foreground">
                {{ new Date(note.updatedAt).toLocaleString('zh-CN') }}
              </div>
              <div class="text-sm text-muted-foreground truncate mt-1">
                {{ note.content.substring(0, 50) || '空笔记' }}...
              </div>
            </div>

            <div
              v-if="filteredNotes.length === 0"
              class="text-center py-8 text-muted-foreground"
            >
              <div>暂无笔记</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：笔记编辑 -->
      <div v-if="activeNote" class="lg:col-span-3">
        <div class="bg-card border border-border rounded-lg p-4 h-full">
          <div class="mb-4">
            <input
              :value="activeNote.title"
              @input="updateNote('title', $event.target.value)"
              type="text"
              class="w-full px-4 py-2 text-xl font-semibold bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="笔记标题"
            />
          </div>

          <div class="flex gap-2 mb-4">
            <button
              @click="exportNote"
              class="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition text-sm flex items-center gap-1"
            >
              <Download :size="14" />
              导出当前
            </button>
            <button
              @click="exportAllNotes"
              class="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition text-sm"
            >
              导出全部
            </button>
            <div class="flex-1"></div>
            <span class="text-sm text-muted-foreground flex items-center gap-1">
              自动保存
            </span>
          </div>

          <div class="mb-4">
            <div class="flex gap-2">
              <button
                @click="activeNote.previewMode = false"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  !activeNote.previewMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                ]"
              >
                编辑
              </button>
              <button
                @click="activeNote.previewMode = true"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  activeNote.previewMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                ]"
              >
                预览
              </button>
            </div>
          </div>

          <div v-if="!activeNote.previewMode" class="relative">
            <textarea
              :value="activeNote.content"
              @input="updateNote('content', $event.target.value)"
              class="w-full h-[500px] px-4 py-3 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
              placeholder="开始输入内容，支持 Markdown 语法..."
            ></textarea>
            <div class="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {{ activeNote.content.length }} 字符
            </div>
          </div>

          <div v-else class="h-[500px] px-4 py-3 bg-muted border border-border rounded-lg overflow-y-auto">
            <div class="whitespace-pre-wrap text-foreground">{{ activeNote.content }}</div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="lg:col-span-3">
        <div class="bg-card border border-border rounded-lg p-12 text-center">
          <h3 class="text-xl font-semibold text-foreground mb-2">还没有笔记</h3>
          <p class="text-muted-foreground mb-4">点击"新建笔记"开始记录</p>
          <button
            @click="createNote"
            class="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition"
          >
            新建笔记
          </button>
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
          什么是快速笔记？
        </h2>
        <p class="text-muted-foreground mb-4">
          快速笔记是一款轻量级的在线笔记工具，支持Markdown语法编辑。
          所有笔记都保存在浏览器本地存储中，即使离线也能使用。
          适合快速记录想法、待办事项、会议纪要等内容。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>点击"新建笔记"按钮创建新笔记</li>
          <li>输入笔记标题和内容，支持Markdown语法</li>
          <li>笔记会自动保存到浏览器本地存储</li>
          <li>可以搜索、导出单个笔记或所有笔记</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Markdown支持</strong>：完整的Markdown语法支持，实时预览</li>
          <li><strong>本地存储</strong>：所有笔记保存在浏览器本地，保护隐私</li>
          <li><strong>自动保存</strong>：输入内容自动保存，无需手动操作</li>
          <li><strong>搜索功能</strong>：快速搜索笔记标题和内容</li>
          <li><strong>导出功能</strong>：支持导出单个笔记或所有笔记为Markdown文件</li>
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
