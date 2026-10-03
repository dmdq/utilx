<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileSearch class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">目录树生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">选择本地文件夹，生成 Markdown / ASCII 目录树用于文档</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择本地文件夹后，在浏览器内遍历目录结构，生成带树形连线的文本或 Markdown 代码块。支持排除 node_modules、.git 等目录与按深度截断。文件仅在浏览器内读取文件名与相对路径，内容不会被读取或上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：选择与配置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FolderOpen class="w-5 h-5 mr-2 text-primary" /> 选择文件夹
          </h2>
          <label
            class="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="folderInput"
              type="file"
              webkitdirectory
              multiple
              class="hidden"
              @change="handleFolderChange"
            />
            <FolderOpen v-if="!rootName" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FolderCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p v-if="!rootName" class="text-sm text-muted-foreground">点击选择文件夹（只读取文件名）</p>
            <template v-else>
              <p class="text-sm font-medium text-foreground truncate">{{ rootName }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ fileCount }} 个文件 · {{ dirCount }} 个目录</p>
            </template>
          </label>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 生成选项
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">最大深度：<span class="text-primary">{{ maxDepth === 0 ? '不限' : maxDepth }}</span></label>
            <input v-model.number="maxDepth" type="range" min="0" max="8" class="w-full accent-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">排除目录（逗号分隔）</label>
            <input v-model="excludeInput" type="text" placeholder="node_modules, .git, dist"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">显示文件（关闭则只列目录）</span>
            <button
              type="button"
              @click="showFiles = !showFiles"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              :class="showFiles ? 'bg-primary' : 'bg-muted'"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="showFiles ? 'translate-x-6' : 'translate-x-1'"></span>
            </button>
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">包裹为 Markdown 代码块</span>
            <button
              type="button"
              @click="wrapMarkdown = !wrapMarkdown"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              :class="wrapMarkdown ? 'bg-primary' : 'bg-muted'"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="wrapMarkdown ? 'translate-x-6' : 'translate-x-1'"></span>
            </button>
          </label>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <ListOrdered class="w-5 h-5 mr-2 text-primary" /> 目录树
            </h2>
            <div class="flex items-center gap-2">
              <button @click="copyTree" :disabled="!treeText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5">
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button @click="downloadTree" :disabled="!treeText"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5">
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </div>
          </div>
          <div class="p-6">
            <pre v-if="treeText" class="text-xs font-mono text-foreground bg-muted/30 rounded-lg p-4 max-h-[520px] overflow-auto whitespace-pre">{{ treeText }}</pre>
            <div v-else class="py-20 text-center">
              <FileSearch class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">选择文件夹后，这里显示目录树</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于目录树生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>目录树（tree 命令的输出风格）是 README、技术文档、教程里展示项目结构的标准方式。本工具基于浏览器的目录选择 API 在本地遍历文件夹，仅读取文件名与相对路径，不读取文件内容、不上传任何数据。</p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>写 README 时展示项目结构（勾选 Markdown 代码块直接粘贴）</li>
            <li>写教程/博客时展示示例工程的文件组织</li>
            <li>交付文档时附上目录清单</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持排除哪些目录？</span>默认排除 node_modules、.git、dist、.next、build、__pycache__，可自定义。</li>
            <li><span class="text-foreground font-medium">大文件夹会卡吗？</span>建议配合深度限制与排除规则；浏览器遍历数万文件时会有些慢。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'directory-tree'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileSearch, FolderOpen, FolderCheck, Settings2, ListOrdered,
  Copy, Download, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '目录树生成器 - 文件夹结构转Markdown/ASCII树',
  description: '在线目录树生成工具，选择本地文件夹生成ASCII树形结构与Markdown代码块，支持排除node_modules等目录与深度限制，纯本地读取不上传',
  keywords: '目录树生成, tree命令, 文件夹结构, markdown目录树, 项目结构文档, ascii tree',
  author: 'Util工具箱',
  ogTitle: '目录树生成器 - 有条工具',
  ogDescription: '选择本地文件夹，生成 Markdown / ASCII 目录树用于文档',
  ogUrl: 'https://www.util.cn/tools/directory-tree',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: '目录树生成器', url: 'https://www.util.cn/tools/directory-tree', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['ASCII目录树', 'Markdown代码块', '排除规则', '深度限制'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
          { '@type': 'ListItem', position: 3, name: '目录树生成器', item: 'https://www.util.cn/tools/directory-tree/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'directory-tree')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const rootName = ref('')
const paths = ref([])
const maxDepth = ref(4)
const excludeInput = ref('node_modules, .git, dist, .next, build, __pycache__, .venv')
const showFiles = ref(true)
const wrapMarkdown = ref(false)
const isDragging = ref(false)
const seoContentVisible = ref(true)
const folderInput = ref(null)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fileCount = computed(() => paths.value.filter(p => !p.endsWith('/')).length)
const dirCount = computed(() => {
  const set = new Set()
  for (const p of paths.value) {
    const parts = p.split('/')
    for (let i = 1; i < parts.length; i++) set.add(parts.slice(0, i).join('/'))
  }
  return set.size
})

// ---------- 输入 ----------
const handleFolderChange = (e) => {
  const files = Array.from(e.target.files || [])
  ingestFiles(files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const items = Array.from(e.dataTransfer?.files || [])
  ingestFiles(items)
}

const ingestFiles = (files) => {
  const list = []
  let root = ''
  for (const f of files) {
    const rel = f.webkitRelativePath || f.name
    if (!root) root = rel.split('/')[0]
    list.push(rel)
  }
  rootName.value = root || '已选文件'
  paths.value = list.sort()
}

// ---------- 树构建 ----------
const excluded = computed(() => excludeInput.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean))

const buildTree = () => {
  const depthLimit = maxDepth.value === 0 ? Infinity : maxDepth.value
  const node = { name: rootName.value, dirs: new Map(), files: [] }

  for (const p of paths.value) {
    const parts = p.split('/')
    // 跳过根目录名
    const segs = parts.slice(1)
    // 排除规则命中任意路径段则跳过
    if (segs.some(s => excluded.value.includes(s.toLowerCase()))) continue

    let cur = node
    let accumulated = parts[0]
    const limit = segs.filter((_, i) => i < segs.length - 1).length // 目录层数
    for (let i = 0; i < segs.length; i++) {
      const isFile = i === segs.length - 1
      accumulated += '/' + segs[i]
      if (!isFile) {
        const dirDepth = i + 1
        if (dirDepth > depthLimit) break
        if (!cur.dirs.has(segs[i])) cur.dirs.set(segs[i], { name: segs[i], dirs: new Map(), files: [] })
        cur = cur.dirs.get(segs[i])
      } else {
        if (showFiles.value && dirDepthOf(segs.length) <= depthLimit) {
          cur.files.push(segs[i])
        }
      }
    }
  }
  return node
}

const dirDepthOf = (segCount) => segCount - 1

const renderTree = (node, prefix = '', isRoot = true) => {
  const lines = []
  if (isRoot) lines.push(node.name + '/')
  const dirs = [...node.dirs.values()].sort((a, b) => a.name.localeCompare(b.name))
  const files = [...node.files].sort((a, b) => a.localeCompare(b))
  const entries = [
    ...dirs.map(d => ({ name: d.name, node: d, isDir: true })),
    ...files.map(f => ({ name: f, isDir: false }))
  ]
  entries.forEach((entry, idx) => {
    const last = idx === entries.length - 1
    const connector = last ? '└── ' : '├── '
    lines.push(prefix + connector + entry.name + (entry.isDir ? '/' : ''))
    if (entry.isDir) {
      lines.push(...renderTree(entry.node, prefix + (last ? '    ' : '│   '), false))
    }
  })
  return lines
}

const treeText = computed(() => {
  if (paths.value.length === 0) return ''
  const text = renderTree(buildTree()).join('\n')
  return wrapMarkdown.value ? '```text\n' + text + '\n```' : text
})

// ---------- 交互 ----------
const copyTree = async () => {
  if (!treeText.value) return
  try {
    await navigator.clipboard.writeText(treeText.value)
    alert('目录树已复制')
  } catch (err) {
    const ta = document.createElement('textarea')
    ta.value = treeText.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('目录树已复制')
  }
}

const downloadTree = () => {
  if (!treeText.value) return
  const blob = new Blob([treeText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${rootName.value || 'directory'}-tree.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
