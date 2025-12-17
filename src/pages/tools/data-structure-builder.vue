<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">数据结构构建器</h1>
      <p class="text-muted-foreground mb-4">可视化构建和操作数据结构，支持树、图、数组等常用数据结构</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧工具栏 -->
      <div class="space-y-6">
        <!-- 结构类型选择 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">数据结构</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="type in structureTypes"
              :key="type.id"
              @click="createStructure(type.id)"
              :class="[
                'px-3 py-2 rounded text-sm flex flex-col items-center',
                currentStructure === type.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              ]"
            >
              <span class="text-lg mb-1">{{ type.icon }}</span>
              <span>{{ type.name }}</span>
            </button>
          </div>
        </div>

        <!-- 节点操作 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">节点操作</h3>
          <div class="space-y-2">
            <button
              @click="addNode"
              :disabled="!currentStructure"
              class="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
            >
              添加节点
            </button>
            <button
              @click="removeNode"
              :disabled="!currentStructure || selectedNodes.length === 0"
              class="w-full px-3 py-2 bg-destructive text-destructive-foreground rounded text-sm disabled:opacity-50"
            >
              删除节点
            </button>
            <button
              @click="connectNodes"
              :disabled="!currentStructure || selectedNodes.length !== 2"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm disabled:opacity-50"
            >
              连接节点
            </button>
          </div>
        </div>

        <!-- 预设模板 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">预设模板</h3>
          <div class="space-y-2">
            <button
              v-for="template in templates"
              :key="template.id"
              @click="loadTemplate(template)"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left"
            >
              {{ template.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- 中间可视化区域 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 可视化画布 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">可视化画布</h3>
            <div class="flex gap-2">
              <button
                @click="clearCanvas"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
              <button
                @click="exportCode"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                导出代码
              </button>
            </div>
          </div>

          <div class="border-2 border-dashed border-muted-foreground/20 rounded-lg" style="height: 500px; position: relative;">
            <svg
              ref="canvasRef"
              width="100%"
              height="100%"
              viewBox="0 0 500 500"
              class="bg-white"
              @click="handleCanvasClick"
            >
              <!-- 网格背景 -->
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              <!-- 渲染数据结构 -->
              <component
                :is="currentStructureComponent"
                :nodes="nodes"
                :edges="edges"
                :selected-nodes="selectedNodes"
                @node-select="handleNodeSelect"
              />

              <!-- 空状态提示 -->
              <g v-if="!currentStructure">
                <text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-size="18">
                  请选择一个数据结构类型开始
                </text>
                <text x="50%" y="50%" dy="30" text-anchor="middle" fill="#cbd5e1" font-size="14">
                  点击左侧的树、图、数组等按钮
                </text>
              </g>
            </svg>
          </div>
        </div>

        <!-- 代码输出 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">生成的代码</h3>
            <div class="flex gap-2">
              <select v-model="outputLanguage" class="px-3 py-1 border rounded text-sm">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
              <button
                @click="copyCode"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                复制代码
              </button>
            </div>
          </div>

          <pre class="bg-muted p-4 rounded-md text-sm overflow-x-auto max-h-64 overflow-y-auto"><code>{{ generatedCode }}</code></pre>
        </div>

        <!-- 操作说明 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">操作说明</h3>
          <div class="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <strong>选择结构:</strong> 点击左侧结构类型创建
            </div>
            <div>
              <strong>添加节点:</strong> 点击画布或使用"添加节点"按钮
            </div>
            <div>
              <strong>选择节点:</strong> 点击节点进行选择（按住Ctrl多选）
            </div>
            <div>
              <strong>连接节点:</strong> 选中两个节点后点击"连接节点"
            </div>
            <div>
              <strong>删除节点:</strong> 选中节点后点击"删除节点"
            </div>
            <div>
              <strong>编辑属性:</strong> 选中单个节点后在左侧编辑
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSEO } from '~/composables/useSEO'
import TreeStructure from '~/components/structures/TreeStructure.vue'
import GraphStructure from '~/components/structures/GraphStructure.vue'
import ArrayStructure from '~/components/structures/ArrayStructure.vue'
import LinkedListStructure from '~/components/structures/LinkedListStructure.vue'
import StackStructure from '~/components/structures/StackStructure.vue'
import QueueStructure from '~/components/structures/QueueStructure.vue'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('数据结构构建器 - 可视化构建树和图结构')

// 数据
const currentStructure = ref('tree')
const selectedNodes = ref([])
const nodes = ref([])
const edges = ref([])
const canvasRef = ref(null)
const outputLanguage = ref('javascript')

// 结构类型
const structureTypes = [
  { id: 'tree', name: '树', icon: '🌳' },
  { id: 'graph', name: '图', icon: '🔗' },
  { id: 'array', name: '数组', icon: '📊' },
  { id: 'linked-list', name: '链表', icon: '📋' },
  { id: 'stack', name: '栈', icon: '📚' },
  { id: 'queue', name: '队列', icon: '🎯' }
]

// 预设模板
const templates = [
  {
    id: 'binary-tree',
    name: '二叉树',
    structure: 'tree',
    nodes: [
      { id: 1, value: 'A', x: 200, y: 50, color: '#3b82f6', size: 30 },
      { id: 2, value: 'B', x: 120, y: 150, color: '#3b82f6', size: 30 },
      { id: 3, value: 'C', x: 280, y: 150, color: '#3b82f6', size: 30 },
      { id: 4, value: 'D', x: 80, y: 250, color: '#3b82f6', size: 30 },
      { id: 5, value: 'E', x: 160, y: 250, color: '#3b82f6', size: 30 },
      { id: 6, value: 'F', x: 240, y: 250, color: '#3b82f6', size: 30 },
      { id: 7, value: 'G', x: 320, y: 250, color: '#3b82f6', size: 30 }
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 6 },
      { from: 3, to: 7 }
    ]
  },
  {
    id: 'graph-example',
    name: '无向图',
    structure: 'graph',
    nodes: [
      { id: 1, value: 'A', x: 150, y: 100, color: '#10b981', size: 35 },
      { id: 2, value: 'B', x: 250, y: 100, color: '#10b981', size: 35 },
      { id: 3, value: 'C', x: 300, y: 200, color: '#10b981', size: 35 },
      { id: 4, value: 'D', x: 200, y: 300, color: '#10b981', size: 35 },
      { id: 5, value: 'E', x: 100, y: 200, color: '#10b981', size: 35 }
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 1, to: 5 },
      { from: 2, to: 3 },
      { from: 2, to: 5 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 4, to: 1 }
    ]
  },
  {
    id: 'linked-list',
    name: '链表',
    structure: 'linked-list',
    nodes: [
      { id: 1, value: '10', x: 50, y: 200, color: '#f59e0b', size: 40 },
      { id: 2, value: '20', x: 150, y: 200, color: '#f59e0b', size: 40 },
      { id: 3, value: '30', x: 250, y: 200, color: '#f59e0b', size: 40 },
      { id: 4, value: '40', x: 350, y: 200, color: '#f59e0b', size: 40 }
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 }
    ]
  }
]

// 组件映射
const structureComponents = {
  tree: TreeStructure,
  graph: GraphStructure,
  array: ArrayStructure,
  'linked-list': LinkedListStructure,
  stack: StackStructure,
  queue: QueueStructure
}

// 计算属性
const currentStructureComponent = computed(() => {
  return structureComponents[currentStructure.value] || null
})

const generatedCode = computed(() => {
  if (nodes.value.length === 0) return '// 请先创建数据结构'

  switch (outputLanguage.value) {
    case 'javascript':
      return generateJavaScriptCode()
    case 'python':
      return generatePythonCode()
    case 'java':
      return generateJavaCode()
    case 'cpp':
      return generateCppCode()
    default:
      return generateJavaScriptCode()
  }
})

// 方法
const createStructure = (type) => {
  currentStructure.value = type
  nodes.value = []
  edges.value = []
  selectedNodes.value = []
}

const addNode = () => {
  let x, y, color, size

  // 根据不同的数据结构类型设置合适的位置和样式
  switch (currentStructure.value) {
    case 'tree':
      // 树结构：按层排列
      const level = Math.floor(Math.log2(nodes.value.length + 1))
      const posInLevel = nodes.value.length - (Math.pow(2, level) - 1)
      x = 200 + (posInLevel - (Math.pow(2, level) - 1) / 2) * 60
      y = 50 + level * 80
      color = '#3b82f6'
      size = 30
      break

    case 'array':
      // 数组：水平排列
      x = 100 + nodes.value.length * 80
      y = 250
      color = '#dc2626'
      size = 30
      break

    case 'linked-list':
      // 链表：水平排列
      x = 80 + nodes.value.length * 100
      y = 200
      color = '#f59e0b'
      size = 40
      break

    case 'stack':
      // 栈：垂直排列，从底部开始
      x = 200
      y = 350 - nodes.value.length * 50
      color = '#7c3aed'
      size = 30
      break

    case 'queue':
      // 队列：水平排列
      x = 120 + nodes.value.length * 70
      y = 200
      color = '#2563eb'
      size = 30
      break

    case 'graph':
    default:
      // 图结构：随机位置
      x = Math.random() * 300 + 50
      y = Math.random() * 300 + 50
      color = '#10b981'
      size = 35
      break
  }

  const newNode = {
    id: Date.now(),
    value: `Node${nodes.value.length + 1}`,
    x,
    y,
    color,
    size
  }
  nodes.value.push(newNode)
}

const removeNode = () => {
  selectedNodes.value.forEach(nodeId => {
    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    edges.value = edges.value.filter(e => e.from !== nodeId && e.to !== nodeId)
  })
  selectedNodes.value = []
}

const connectNodes = () => {
  if (selectedNodes.value.length !== 2) return

  const [from, to] = selectedNodes.value
  if (!edges.value.some(e => e.from === from && e.to === to)) {
    edges.value.push({ from, to })
  }
  selectedNodes.value = []
}

const handleNodeSelect = (nodeId, event) => {
  event.stopPropagation()

  if (event.ctrlKey || event.metaKey) {
    const index = selectedNodes.value.indexOf(nodeId)
    if (index === -1) {
      selectedNodes.value.push(nodeId)
    } else {
      selectedNodes.value.splice(index, 1)
    }
  } else {
    selectedNodes.value = [nodeId]
  }
}

const handleCanvasClick = (event) => {
  if (event.target === canvasRef.value) {
    selectedNodes.value = []
  }
}

const clearCanvas = () => {
  nodes.value = []
  edges.value = []
  selectedNodes.value = []
}

const loadTemplate = (template) => {
  currentStructure.value = template.structure
  nodes.value = [...template.nodes]
  edges.value = [...template.edges]
  selectedNodes.value = []
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const exportCode = () => {
  const blob = new Blob([generatedCode.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `data_structure.${getFileExtension()}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const getFileExtension = () => {
  switch (outputLanguage.value) {
    case 'javascript': return 'js'
    case 'python': return 'py'
    case 'java': return 'java'
    case 'cpp': return 'cpp'
    default: return 'txt'
  }
}

// 代码生成方法
const generateJavaScriptCode = () => {
  let code = `// ${getStructureName()} 数据结构\n\n`

  if (currentStructure.value === 'tree') {
    code += generateTreeJavaScript()
  } else if (currentStructure.value === 'graph') {
    code += generateGraphJavaScript()
  } else if (currentStructure.value === 'linked-list') {
    code += generateLinkedListJavaScript()
  } else if (currentStructure.value === 'array') {
    code += generateArrayJavaScript()
  }

  return code
}

const generateTreeJavaScript = () => {
  const nodeValues = nodes.value.map(n => n.value)
  return `class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

// 创建树结构
const root = new TreeNode('${nodeValues[0] || 'Root'}');
const child1 = new TreeNode('${nodeValues[1] || 'Child'}');
const child2 = new TreeNode('${nodeValues[2] || 'Child'}');

root.left = child1;
root.right = child2;

// 遍历树
function inorderTraversal(node) {
  if (node === null) return [];
  return [...inorderTraversal(node.left), node.value, ...inorderTraversal(node.right)];
}

console.log(inorderTraversal(root));`
}

const generateArrayJavaScript = () => {
  const nodeValues = nodes.value.map(n => n.value)
  return `// 数组结构
const array = [${nodeValues.map(v => `'${v}'`).join(', ')}];

// 数组操作
array.push('${nodeValues[nodeValues.length - 1] || 'New Item'}'); // 添加元素
array.pop(); // 移除最后元素
array.sort(); // 排序

console.log(array);`
}

const generateLinkedListJavaScript = () => {
  const nodeValues = nodes.value.map(n => n.value)
  return `class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

// 创建链表
const head = new ListNode('${nodeValues[0] || 'Head'}');
let current = head;

${nodeValues.slice(1).map((value, index) => `const node${index + 2} = new ListNode('${value}');`).join('\n')}
${nodeValues.slice(1).map((value, index) => `current.next = node${index + 2}; current = current.next;`).join('\n')}

// 遍历链表
function traverseList(head) {
  const result = [];
  let current = head;
  while (current !== null) {
    result.push(current.value);
    current = current.next;
  }
  return result;
}

console.log(traverseList(head));`
}

const generateGraphJavaScript = () => {
  const nodeValues = nodes.value.map(n => n.value)
  return `// 图结构
class Graph {
  constructor() {
    this.adjacencyList = new Map();
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  addEdge(vertex1, vertex2) {
    this.adjacencyList.get(vertex1).push(vertex2);
    this.adjacencyList.get(vertex2).push(vertex1);
  }
}

const graph = new Graph();

${nodeValues.map(value => `graph.addVertex('${value}');`).join('\n')}

${edges.value.map(edge => `graph.addEdge('${nodes.value.find(n => n.id === edge.from)?.value}', '${nodes.value.find(n => n.id === edge.to)?.value}');`).join('\n')}

// 广度优先搜索
function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];

  while (queue.length > 0) {
    const vertex = queue.shift();
    if (!visited.has(vertex)) {
      visited.add(vertex);
      result.push(vertex);
      graph.adjacencyList.get(vertex).forEach(neighbor => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }
  }
  return result;
}

console.log(bfs(graph, '${nodeValues[0] || 'A'}'));`
}

const getStructureName = () => {
  const type = structureTypes.find(t => t.id === currentStructure.value)
  return type ? type.name : '数据结构'
}

// 占位符方法（实际项目中需要完整实现）
const generatePythonCode = () => {
  return `# Python数据结构代码
# 支持的数据结构: 树、图、链表、数组等
# 请选择具体的结构类型来生成对应代码
`
}

const generateJavaCode = () => {
  return `// Java数据结构代码
// 支持的数据结构: 树、图、链表、数组等
// 请选择具体的结构类型来生成对应代码
`
}

const generateCppCode = () => {
  return `// C++数据结构代码
// 支持的数据结构: 树、图、链表、数组等
// 请选择具体的结构类型来生成对应代码
`
}

onMounted(() => {
  // 创建一个简单的二叉树示例
  setTimeout(() => {
    // 添加根节点
    nodes.value = [
      { id: 1, value: 'A', x: 200, y: 50, color: '#3b82f6', size: 30 },
      { id: 2, value: 'B', x: 120, y: 150, color: '#3b82f6', size: 30 },
      { id: 3, value: 'C', x: 280, y: 150, color: '#3b82f6', size: 30 },
      { id: 4, value: 'D', x: 80, y: 250, color: '#3b82f6', size: 30 },
      { id: 5, value: 'E', x: 160, y: 250, color: '#3b82f6', size: 30 }
    ]

    edges.value = [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 }
    ]
  }, 100)
})
</script>

<style scoped>
svg {
  cursor: crosshair;
}

svg circle, svg rect {
  cursor: pointer;
}
</style>