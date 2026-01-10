<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3 flex items-center gap-2">
        <GitBranch :size="32" />
        流程图绘制工具 - 免费在线流程图设计器
      </h1>
      <p class="text-muted-foreground">免费在线流程图绘制工具，支持拖拽创建节点、连接线和分支结构，可导出为PNG图片，适用于业务流程设计、系统架构图、工作流程图等场景。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      <!-- 左侧工具栏 -->
      <div class="lg:col-span-1 space-y-4">
        <!-- 节点工具 -->
        <div class="bg-card border border-border rounded-xl p-4">
          <h3 class="font-semibold text-foreground mb-3">添加节点</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="nodeType in NODE_TYPES"
              :key="nodeType.type"
              @click="selectedTool = nodeType.type"
              :class="[
                'p-3 rounded-lg text-center transition',
                selectedTool === nodeType.type
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="text-2xl mb-1">{{ nodeType.icon }}</div>
              <div class="text-xs">{{ nodeType.label }}</div>
            </button>
          </div>
          <button
            @click="selectedTool = 'connect'"
            :class="[
              'w-full mt-2 p-2 rounded-lg transition flex items-center justify-center gap-2',
              selectedTool === 'connect'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            ]"
          >
            <ArrowRight :size="18" />
            连接模式
          </button>
        </div>

        <!-- 操作按钮 -->
        <div class="bg-card border border-border rounded-xl p-4">
          <h3 class="font-semibold text-foreground mb-3">操作</h3>
          <div class="space-y-2">
            <button
              @click="deleteSelected"
              :disabled="!selectedNode && !selectedConnection"
              class="w-full p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground flex items-center justify-center gap-2"
            >
              <Trash2 :size="18" />
              删除选中
            </button>
            <button
              @click="clearCanvas"
              class="w-full p-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition flex items-center justify-center gap-2"
            >
              <RotateCcw :size="18" />
              清空画布
            </button>
          </div>
        </div>

        <!-- 导出保存 -->
        <div class="bg-card border border-border rounded-xl p-4">
          <h3 class="font-semibold text-foreground mb-3">导出/保存</h3>
          <div class="space-y-2">
            <button
              @click="exportAsImage"
              class="w-full p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2"
            >
              <Download :size="18" />
              导出PNG
            </button>
            <button
              @click="saveToStorage"
              class="w-full p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2"
            >
              <Save :size="18" />
              保存
            </button>
            <button
              @click="loadSample"
              class="w-full p-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition"
            >
              加载示例
            </button>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-muted/30 border border-border rounded-xl p-4 text-sm">
          <h3 class="font-semibold text-foreground mb-2">使用说明</h3>
          <ul class="space-y-1 text-muted-foreground">
            <li>• 选择节点类型，点击画布添加</li>
            <li>• 拖拽节点调整位置</li>
            <li>• 选择"连接模式"后依次点击两个节点</li>
            <li>• 按Delete键删除选中元素</li>
          </ul>
        </div>
      </div>

      <!-- 右侧画布 -->
      <div class="lg:col-span-3">
        <div class="bg-card border border-border rounded-xl p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-foreground">画布</h2>
            <div class="text-sm text-muted-foreground">
              节点: {{ nodes.length }} | 连接: {{ connections.length }}
            </div>
          </div>

          <div
            ref="canvasRef"
            class="relative bg-muted rounded-lg border-2 border-dashed border-border overflow-hidden"
            style="height: 600px;"
            @click="onCanvasClick"
            @mousemove="onDrag"
            @mouseup="endDrag"
            @mouseleave="endDrag"
          >
            <!-- 连接线 -->
            <svg class="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#666" />
                </marker>
              </defs>
              <g
                v-for="(conn, index) in connections"
                :key="index"
                class="connection pointer-events-auto cursor-pointer"
                @click.stop="selectedConnection = conn; selectedNode = null"
              >
                <path
                  :d="`M ${getConnectionPoints(nodes.find(n => n.id === conn.from))?.right?.x || 0} ${getConnectionPoints(nodes.find(n => n.id === conn.from))?.right?.y || 0} L ${getConnectionPoints(nodes.find(n => n.id === conn.to))?.left?.x || 0} ${getConnectionPoints(nodes.find(n => n.id === conn.to))?.left?.y || 0}`"
                  :stroke="selectedConnection === conn ? '#000' : '#666'"
                  stroke-width="2"
                  fill="none"
                  marker-end="url(#arrowhead)"
                />
              </g>
            </svg>

            <!-- 节点 -->
            <div
              v-for="node in nodes"
              :key="node.id"
              class="node"
              :style="getNodeStyle(node)"
              @mousedown.stop="startDrag($event, node)"
              @dblclick.stop="startConnection(node)"
            >
              <span
                class="text-white font-medium text-sm"
                :style="{ transform: node.shape === 'diamond' ? 'rotate(-45deg)' : 'none' }"
              >
                {{ node.label }}
              </span>
            </div>

            <!-- 空状态提示 -->
            <div
              v-if="nodes.length === 0"
              class="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none"
            >
              <div class="text-center">
                <div class="text-6xl mb-4">📊</div>
                <div>点击左侧工具栏添加节点</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 选中节点编辑 -->
        <div
          v-if="selectedNode"
          class="mt-4 bg-card border border-border rounded-xl p-4"
        >
          <h3 class="font-semibold text-foreground mb-3">编辑节点</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-muted-foreground mb-1 block">标签文本</label>
              <input
                v-model="selectedNode.label"
                type="text"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="节点标签"
              />
            </div>
            <div>
              <label class="text-sm text-muted-foreground mb-1 block">颜色</label>
              <input
                v-model="selectedNode.color"
                type="color"
                class="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-muted/30 border border-border rounded-xl">
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
          什么是流程图？
        </h2>
        <p class="text-muted-foreground mb-4">
          流程图(Flowchart)是一种图形化的表示方法，用于展示算法、工作流或过程的各个步骤。
          它通过不同形状的符号和箭头来表示流程的方向和步骤之间的关系，是业务流程设计、系统架构设计、
          工作流程分析等领域的重要工具。
        </p>
        <p class="text-muted-foreground">
          本工具提供在线流程图绘制功能，无需下载安装任何软件，在浏览器中即可完成专业的流程图设计。
          支持多种节点类型、自定义颜色、拖拽调整位置等功能，导出的图片可直接用于文档、演示文稿等场景。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择左侧工具栏中的节点类型（矩形、圆形、菱形等）</li>
          <li>在画布上点击以添加节点</li>
          <li>拖拽节点到合适的位置</li>
          <li>选择"连接模式"，依次点击两个节点建立连接</li>
          <li>双击节点可快速进入连接模式</li>
          <li>点击"导出PNG"将流程图保存为图片</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种节点类型</strong>: 支持矩形、圆角矩形、圆形、菱形等常用流程图符号</li>
          <li><strong>拖拽操作</strong>: 自由拖拽节点调整位置，打造理想布局</li>
          <li><strong>智能连接</strong>: 自动生成带箭头的连接线，清晰展示流程关系</li>
          <li><strong>自定义样式</strong>: 可调整节点颜色和标签文本</li>
          <li><strong>导出功能</strong>: 一键导出为PNG图片，方便分享和使用</li>
          <li><strong>本地保存</strong>: 支持保存到浏览器本地存储，随时继续编辑</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          流程图符号说明
        </h2>
        <div class="space-y-3 text-muted-foreground mb-6">
          <div class="flex items-start gap-3">
            <div class="w-12 h-8 bg-primary rounded flex items-center justify-center text-white text-xs shrink-0">矩形</div>
            <div>表示处理步骤或操作</div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-12 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs shrink-0">圆形</div>
            <div>表示开始或结束节点</div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-primary rotate-45 flex items-center justify-center text-white text-xs shrink-0" style="transform: rotate(45deg)">菱形</div>
            <div>表示决策判断点</div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何删除节点或连接线？</h3>
            <p class="text-muted-foreground mt-1">
              点击选中要删除的节点或连接线，选中后会高亮显示，然后点击左侧工具栏的"删除选中"按钮，
              或直接按Delete键即可删除。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">导出的图片清晰度如何？</h3>
            <p class="text-muted-foreground mt-1">
              导出的PNG图片保持画布原始分辨率，适合用于文档、演示文稿等场景。
              如果需要更高清晰度，建议在浏览器中缩放页面后导出。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">数据会被上传到服务器吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。所有操作都在浏览器本地完成，数据不会上传到任何服务器，确保您的隐私安全。
              保存功能也是使用浏览器的本地存储。
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { GitBranch, Download, Trash2, ArrowRight, Save, RotateCcw, ChevronUp, HelpCircle, FileText, Image, Database } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '流程图绘制工具 - 免费在线流程图设计器 | 业务流程设计',
  description: '免费在线流程图绘制工具，支持拖拽创建节点、连接线和分支结构，可导出为PNG图片，适用于业务流程设计、系统架构图、工作流程图等场景。',
  keywords: '流程图,流程图绘制,在线流程图,流程设计,业务流程,系统架构图,工作流程,免费流程图工具',
  author: 'Util工具箱',
  ogTitle: '流程图绘制工具 - 免费在线流程图设计器',
  ogDescription: '免费在线流程图绘制工具，支持拖拽创建节点、连接线和分支结构，可导出为PNG图片。',
  ogType: 'website'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '流程图绘制工具',
            description: '免费在线流程图绘制工具',
            url: 'https://www.util.cn/tools/flowchart-builder',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多种节点类型',
              '拖拽操作',
              '智能连接',
              '导出PNG图片',
              '本地保存'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '流程图绘制',
                item: 'https://www.util.cn/tools/flowchart-builder'
              }
            ]
          }
        ]
      })
    }
  ]
})

const router = useRouter()

// 定义当前工具
const tool = tools.find(t => t.id === 'flowchart-builder')

// 图标映射
const iconMap = {
  GitBranch, FileText, Image, Database
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'business' && t.id !== 'flowchart-builder'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'mind-map'),
    tools.find(t => t.id === 'kanban-board'),
    tools.find(t => t.id === 'todo-list-generator'),
    tools.find(t => t.id === 'meeting-minutes')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 节点类型定义
const NODE_TYPES = [
  { type: 'rectangle', label: '矩形', icon: '▢' },
  { type: 'rounded', label: '圆角', icon: '▭' },
  { type: 'circle', label: '圆形', icon: '○' },
  { type: 'diamond', label: '菱形', icon: '◇' }
]

// 状态管理
const selectedTool = ref('rectangle')
const nodes = ref([])
const connections = ref([])
const selectedNode = ref(null)
const selectedConnection = ref(null)
const canvasRef = ref(null)

// 拖拽状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const draggedNode = ref(null)

// 连接状态
const connectionStart = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 生成唯一ID
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 获取节点样式
const getNodeStyle = (node) => {
  const baseStyle = {
    position: 'absolute',
    left: `${node.x}px`,
    top: `${node.y}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'move',
    userSelect: 'none',
    transition: 'box-shadow 0.2s',
    backgroundColor: node.color,
    border: selectedNode.value === node ? '3px solid #000' : '2px solid transparent'
  }

  switch (node.shape) {
    case 'rectangle':
      return {
        ...baseStyle,
        width: '120px',
        height: '60px',
        borderRadius: '0'
      }
    case 'rounded':
      return {
        ...baseStyle,
        width: '120px',
        height: '60px',
        borderRadius: '10px'
      }
    case 'circle':
      return {
        ...baseStyle,
        width: '80px',
        height: '80px',
        borderRadius: '50%'
      }
    case 'diamond':
      return {
        ...baseStyle,
        width: '80px',
        height: '80px',
        transform: 'rotate(45deg)',
        borderRadius: '0'
      }
    default:
      return baseStyle
  }
}

// 获取连接点位置
const getConnectionPoints = (node) => {
  if (!node) return { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }

  const nodeWidth = node.shape === 'circle' || node.shape === 'diamond' ? 80 : 120
  const nodeHeight = node.shape === 'circle' || node.shape === 'diamond' ? 80 : 60

  return {
    left: {
      x: node.x,
      y: node.y + nodeHeight / 2
    },
    right: {
      x: node.x + nodeWidth,
      y: node.y + nodeHeight / 2
    }
  }
}

// 画布点击事件
const onCanvasClick = (event) => {
  if (event.target !== canvasRef.value && !event.target.classList.contains('connection')) {
    return
  }

  if (selectedTool.value !== 'connect') {
    const rect = canvasRef.value.getBoundingClientRect()
    const x = event.clientX - rect.left - 60
    const y = event.clientY - rect.top - 30

    const newNode = {
      id: generateId(),
      type: selectedTool.value,
      shape: selectedTool.value,
      x: Math.max(0, x),
      y: Math.max(0, y),
      label: `节点${nodes.value.length + 1}`,
      color: '#3b82f6'
    }

    nodes.value.push(newNode)
    selectedNode.value = newNode
    selectedConnection.value = null
  }
}

// 开始拖拽
const startDrag = (event, node) => {
  if (selectedTool.value === 'connect') return

  isDragging.value = true
  draggedNode.value = node
  selectedNode.value = node
  selectedConnection.value = null

  const rect = canvasRef.value.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left - node.x,
    y: event.clientY - rect.top - node.y
  }
}

// 拖拽中
const onDrag = (event) => {
  if (!isDragging.value || !draggedNode.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  draggedNode.value.x = Math.max(0, event.clientX - rect.left - dragOffset.value.x)
  draggedNode.value.y = Math.max(0, event.clientY - rect.top - dragOffset.value.y)
}

// 结束拖拽
const endDrag = () => {
  isDragging.value = false
  draggedNode.value = null
}

// 开始连接
const startConnection = (node) => {
  if (connectionStart.value === null) {
    connectionStart.value = node
  } else if (connectionStart.value.id !== node.id) {
    // 检查连接是否已存在
    const exists = connections.value.some(
      conn => conn.from === connectionStart.value.id && conn.to === node.id
    )

    if (!exists) {
      connections.value.push({
        from: connectionStart.value.id,
        to: node.id
      })
    }

    connectionStart.value = null
  }
}

// 删除选中
const deleteSelected = () => {
  if (selectedNode.value) {
    const nodeId = selectedNode.value.id
    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    connections.value = connections.value.filter(c => c.from !== nodeId && c.to !== nodeId)
    selectedNode.value = null
  }

  if (selectedConnection.value) {
    connections.value = connections.value.filter(c => c !== selectedConnection.value)
    selectedConnection.value = null
  }
}

// 清空画布
const clearCanvas = () => {
  if (confirm('确定要清空画布吗？')) {
    nodes.value = []
    connections.value = []
    selectedNode.value = null
    selectedConnection.value = null
  }
}

// 导出为图片
const exportAsImage = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  // 使用html2canvas库（需要先引入）
  // 这里简化实现，创建一个临时canvas
  const tempCanvas = document.createElement('canvas')
  const ctx = tempCanvas.getContext('2d')
  tempCanvas.width = canvas.offsetWidth
  tempCanvas.height = canvas.offsetHeight

  // 白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

  // 绘制连接线
  connections.value.forEach(conn => {
    const fromNode = nodes.value.find(n => n.id === conn.from)
    const toNode = nodes.value.find(n => n.id === conn.to)
    const fromPoints = getConnectionPoints(fromNode)
    const toPoints = getConnectionPoints(toNode)

    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(fromPoints.right.x, fromPoints.right.y)
    ctx.lineTo(toPoints.left.x, toPoints.left.y)
    ctx.stroke()

    // 绘制箭头
    const angle = Math.atan2(toPoints.left.y - fromPoints.right.y, toPoints.left.x - fromPoints.right.x)
    ctx.save()
    ctx.translate(toPoints.left.x, toPoints.left.y)
    ctx.rotate(angle)
    ctx.fillStyle = '#666'
    ctx.beginPath()
    ctx.moveTo(-10, -5)
    ctx.lineTo(0, 0)
    ctx.lineTo(-10, 5)
    ctx.fill()
    ctx.restore()
  })

  // 绘制节点
  nodes.value.forEach(node => {
    const nodeWidth = node.shape === 'circle' || node.shape === 'diamond' ? 80 : 120
    const nodeHeight = node.shape === 'circle' || node.shape === 'diamond' ? 80 : 60

    ctx.fillStyle = node.color

    if (node.shape === 'circle') {
      ctx.beginPath()
      ctx.arc(node.x + nodeWidth / 2, node.y + nodeHeight / 2, nodeWidth / 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (node.shape === 'diamond') {
      ctx.save()
      ctx.translate(node.x + nodeWidth / 2, node.y + nodeHeight / 2)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-nodeWidth / 2, -nodeHeight / 2, nodeWidth, nodeHeight)
      ctx.restore()
    } else {
      const radius = node.shape === 'rounded' ? 10 : 0
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, nodeWidth, nodeHeight, radius)
      ctx.fill()
    }

    // 绘制文字
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.save()
    if (node.shape === 'diamond') {
      ctx.translate(node.x + nodeWidth / 2, node.y + nodeHeight / 2)
      ctx.rotate(-Math.PI / 4)
      ctx.fillText(node.label, 0, 0)
    } else {
      ctx.fillText(node.label, node.x + nodeWidth / 2, node.y + nodeHeight / 2)
    }
    ctx.restore()
  })

  // 下载图片
  const link = document.createElement('a')
  link.download = `flowchart_${Date.now()}.png`
  link.href = tempCanvas.toDataURL('image/png')
  link.click()
}

// 保存到本地存储
const saveToStorage = () => {
  const data = {
    nodes: nodes.value,
    connections: connections.value
  }
  localStorage.setItem('flowchart_data', JSON.stringify(data))
  alert('已保存到浏览器本地存储')
}

// 从本地存储加载
const loadFromStorage = () => {
  const data = localStorage.getItem('flowchart_data')
  if (data) {
    const parsed = JSON.parse(data)
    nodes.value = parsed.nodes || []
    connections.value = parsed.connections || []
  }
}

// 加载示例
const loadSample = () => {
  nodes.value = [
    { id: 'node_1', shape: 'circle', x: 50, y: 50, label: '开始', color: '#10b981' },
    { id: 'node_2', shape: 'rectangle', x: 200, y: 50, label: '处理数据', color: '#3b82f6' },
    { id: 'node_3', shape: 'diamond', x: 380, y: 50, label: '判断', color: '#f59e0b' },
    { id: 'node_4', shape: 'rectangle', x: 200, y: 180, label: '重试', color: '#ef4444' },
    { id: 'node_5', shape: 'circle', x: 550, y: 50, label: '结束', color: '#10b981' }
  ]

  connections.value = [
    { from: 'node_1', to: 'node_2' },
    { from: 'node_2', to: 'node_3' },
    { from: 'node_3', to: 'node_4' },
    { from: 'node_3', to: 'node_5' },
    { from: 'node_4', to: 'node_2' }
  ]
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (document.activeElement.tagName !== 'INPUT') {
      deleteSelected()
    }
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  loadFromStorage()

  // 添加到最近使用
  if (tool) {
    addRecentTool(tool.id)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
