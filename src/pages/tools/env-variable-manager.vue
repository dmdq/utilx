<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">环境变量管理器</h1>
      <p class="text-muted-foreground mb-4">管理项目环境变量，支持多环境配置、加密存储和格式导出</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧环境管理 -->
      <div class="space-y-6">
        <!-- 环境选择 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">环境配置</h3>
            <button
              @click="addEnvironment"
              class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
            >
              新建环境
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="env in environments"
              :key="env.id"
              :class="[
                'p-3 rounded-lg border cursor-pointer transition-colors',
                currentEnvironment === env.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted'
              ]"
              @click="selectEnvironment(env.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: env.color }"></div>
                  <span class="font-medium">{{ env.name }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    @click.stop="duplicateEnvironment(env.id)"
                    class="p-1 hover:bg-muted rounded"
                    title="复制环境"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                  <button
                    @click.stop="deleteEnvironment(env.id)"
                    class="p-1 hover:bg-muted rounded"
                    title="删除环境"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ env.variables?.length || 0 }} 个变量
              </div>
            </div>
          </div>
        </div>

        <!-- 环境信息 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">环境信息</h3>
          <div v-if="currentEnvironmentData" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">环境名称</label>
              <input
                v-model="currentEnvironmentData.name"
                @blur="updateEnvironmentInfo"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">环境描述</label>
              <textarea
                v-model="currentEnvironmentData.description"
                @blur="updateEnvironmentInfo"
                class="w-full px-3 py-2 border rounded-md resize-none h-20"
                placeholder="描述此环境的用途..."
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">环境颜色</label>
              <div class="flex gap-2 flex-wrap">
                <div
                  v-for="color in presetColors"
                  :key="color"
                  @click="currentEnvironmentData.color = color; updateEnvironmentInfo()"
                  class="w-8 h-8 rounded cursor-pointer border-2"
                  :class="currentEnvironmentData.color === color ? 'border-primary' : 'border-transparent'"
                  :style="{ backgroundColor: color }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">快速操作</h3>
          <div class="space-y-2">
            <button
              @click="loadFromClipboard"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left"
            >
              从剪贴板导入
            </button>
            <button
              @click="importFromFile"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left"
            >
              从文件导入
            </button>
            <button
              @click="generateTemplate"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left"
            >
              生成模板
            </button>
          </div>
        </div>
      </div>

      <!-- 中间变量管理 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 变量列表 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">环境变量</h3>
            <div class="flex gap-2">
              <input
                v-model="searchQuery"
                placeholder="搜索变量..."
                class="px-3 py-1 border rounded text-sm"
              >
              <button
                @click="addVariable"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                添加变量
              </button>
            </div>
          </div>

          <!-- 变量统计 -->
          <div class="mb-4 p-3 bg-muted rounded-md">
            <div class="grid grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-lg font-bold text-primary">{{ filteredVariables.length }}</div>
                <div class="text-xs text-muted-foreground">总变量</div>
              </div>
              <div>
                <div class="text-lg font-bold text-success">{{ sensitiveVariables.length }}</div>
                <div class="text-xs text-muted-foreground">敏感变量</div>
              </div>
              <div>
                <div class="text-lg font-bold text-warning">{{ encryptedVariables.length }}</div>
                <div class="text-xs text-muted-foreground">已加密</div>
              </div>
              <div>
                <div class="text-lg font-bold text-info">{{ hasValueVariables.length }}</div>
                <div class="text-xs text-muted-foreground">有值变量</div>
              </div>
            </div>
          </div>

          <!-- 变量表格 -->
          <div class="border rounded-md overflow-hidden">
            <table class="w-full">
              <thead class="bg-muted">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium">名称</th>
                  <th class="px-3 py-2 text-left text-xs font-medium">值</th>
                  <th class="px-3 py-2 text-left text-xs font-medium">类型</th>
                  <th class="px-3 py-2 text-left text-xs font-medium">描述</th>
                  <th class="px-3 py-2 text-center text-xs font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="variable in filteredVariables"
                  :key="variable.id"
                  class="border-t hover:bg-muted/50"
                >
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-sm">{{ variable.name }}</span>
                      <div v-if="variable.sensitive" class="text-xs bg-destructive/10 text-destructive px-1 rounded">敏感</div>
                      <div v-if="variable.encrypted" class="text-xs bg-warning/10 text-warning px-1 rounded">加密</div>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-2">
                      <span
                        v-if="variable.sensitive && !showValues[variable.id]"
                        class="text-muted-foreground font-mono text-sm"
                      >
                        ••••••••
                      </span>
                      <span
                        v-else
                        class="font-mono text-sm max-w-32 truncate"
                        :title="variable.value"
                      >
                        {{ variable.value || '(空)' }}
                      </span>
                      <button
                        v-if="variable.sensitive"
                        @click="toggleValueVisibility(variable.id)"
                        class="text-muted-foreground hover:text-foreground"
                      >
                        <Eye v-if="!showValues[variable.id]" class="w-4 h-4" />
                        <EyeOff v-else class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <select
                      v-model="variable.type"
                      @change="saveToStorage"
                      class="text-sm border rounded px-2 py-1"
                    >
                      <option value="string">字符串</option>
                      <option value="number">数字</option>
                      <option value="boolean">布尔值</option>
                      <option value="json">JSON</option>
                      <option value="path">路径</option>
                      <option value="url">URL</option>
                    </select>
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model="variable.description"
                      @blur="saveToStorage"
                      placeholder="添加描述..."
                      class="text-sm border-none bg-transparent w-full"
                    >
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        @click="editVariable(variable.id)"
                        class="p-1 hover:bg-muted rounded"
                        title="编辑"
                      >
                        <Edit class="w-4 h-4" />
                      </button>
                      <button
                        @click="duplicateVariable(variable.id)"
                        class="p-1 hover:bg-muted rounded"
                        title="复制"
                      >
                        <Copy class="w-4 h-4" />
                      </button>
                      <button
                        @click="deleteVariable(variable.id)"
                        class="p-1 hover:bg-muted rounded text-destructive"
                        title="删除"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="filteredVariables.length === 0" class="text-center py-8 text-muted-foreground">
              <div class="mb-2">
                <Database class="w-12 h-12 mx-auto opacity-50" />
              </div>
              <div>暂无变量</div>
              <div class="text-sm">点击"添加变量"开始创建</div>
            </div>
          </div>
        </div>

        <!-- 导出选项 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">导出配置</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">导出格式</label>
              <select v-model="exportFormat" class="w-full px-3 py-2 border rounded-md">
                <option value="env">.env</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
                <option value="docker">Docker Compose</option>
                <option value="k8s">Kubernetes</option>
                <option value="export">Shell Export</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">导出选项</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input
                    v-model="exportOptions.includeComments"
                    type="checkbox"
                    class="rounded"
                  >
                  <span class="text-sm">包含注释</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="exportOptions.includeEmpty"
                    type="checkbox"
                    class="rounded"
                  >
                  <span class="text-sm">包含空值</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="exportOptions.encryptSensitive"
                    type="checkbox"
                    class="rounded"
                  >
                  <span class="text-sm">加密敏感值</span>
                </label>
              </div>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <button
              @click="previewExport"
              class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              预览
            </button>
            <button
              @click="copyToClipboard"
              class="px-3 py-2 bg-primary text-primary-foreground rounded text-sm"
            >
              复制到剪贴板
            </button>
            <button
              @click="downloadFile"
              class="px-3 py-2 bg-primary text-primary-foreground rounded text-sm"
            >
              下载文件
            </button>
          </div>

          <!-- 预览区域 -->
          <div v-if="exportPreview" class="mt-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium">预览</h4>
              <button
                @click="exportPreview = ''"
                class="text-sm text-muted-foreground hover:text-foreground"
              >
                关闭
              </button>
            </div>
            <pre class="bg-muted p-3 rounded text-sm overflow-x-auto max-h-64 overflow-y-auto">{{ exportPreview }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="editingVariable" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-background rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">编辑变量</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">变量名</label>
            <input
              v-model="editingVariable.name"
              class="w-full px-3 py-2 border rounded-md"
              placeholder="VARIABLE_NAME"
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">变量值</label>
            <textarea
              v-model="editingVariable.value"
              class="w-full px-3 py-2 border rounded-md resize-none h-24"
              placeholder="变量值..."
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">描述</label>
            <input
              v-model="editingVariable.description"
              class="w-full px-3 py-2 border rounded-md"
              placeholder="变量描述..."
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">类型</label>
            <select v-model="editingVariable.type" class="w-full px-3 py-2 border rounded-md">
              <option value="string">字符串</option>
              <option value="number">数字</option>
              <option value="boolean">布尔值</option>
              <option value="json">JSON</option>
              <option value="path">路径</option>
              <option value="url">URL</option>
            </select>
          </div>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <input
                v-model="editingVariable.sensitive"
                type="checkbox"
                class="rounded"
              >
              <span class="text-sm">敏感信息</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="editingVariable.encrypted"
                type="checkbox"
                class="rounded"
              >
              <span class="text-sm">加密存储</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="editingVariable = null"
            class="px-4 py-2 border rounded-md text-sm"
          >
            取消
          </button>
          <button
            @click="saveVariable"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".env,.json,.yaml,.yml"
      @change="handleFileImport"
      class="hidden"
    >
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSEO } from '~/composables/useSEO'
import { Copy, Trash2, Edit, Database, Eye, EyeOff } from 'lucide-vue-next'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('环境变量管理器 - 多环境配置管理工具')

// 数据
const environments = ref([
  {
    id: 'development',
    name: '开发环境',
    description: '本地开发环境配置',
    color: '#22c55e',
    variables: []
  },
  {
    id: 'staging',
    name: '测试环境',
    description: '测试服务器环境配置',
    color: '#f59e0b',
    variables: []
  },
  {
    id: 'production',
    name: '生产环境',
    description: '生产服务器环境配置',
    color: '#ef4444',
    variables: []
  }
])

const currentEnvironment = ref('development')
const searchQuery = ref('')
const showValues = ref({})
const editingVariable = ref(null)
const fileInput = ref(null)

const exportFormat = ref('env')
const exportPreview = ref('')
const exportOptions = ref({
  includeComments: true,
  includeEmpty: false,
  encryptSensitive: false
})

const presetColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
]

// 计算属性
const currentEnvironmentData = computed(() => {
  return environments.value.find(env => env.id === currentEnvironment.value)
})

const currentVariables = computed(() => {
  return currentEnvironmentData.value?.variables || []
})

const filteredVariables = computed(() => {
  if (!searchQuery.value) return currentVariables.value

  const query = searchQuery.value.toLowerCase()
  return currentVariables.value.filter(variable =>
    variable.name.toLowerCase().includes(query) ||
    variable.description?.toLowerCase().includes(query) ||
    variable.value?.toLowerCase().includes(query)
  )
})

const sensitiveVariables = computed(() => {
  return currentVariables.value.filter(v => v.sensitive)
})

const encryptedVariables = computed(() => {
  return currentVariables.value.filter(v => v.encrypted)
})

const hasValueVariables = computed(() => {
  return currentVariables.value.filter(v => v.value && v.value.trim() !== '')
})

// 方法
const selectEnvironment = (envId) => {
  currentEnvironment.value = envId
  saveToStorage()
}

const addEnvironment = () => {
  const newEnv = {
    id: `env_${Date.now()}`,
    name: '新环境',
    description: '',
    color: presetColors.value[Math.floor(Math.random() * presetColors.value.length)],
    variables: []
  }
  environments.value.push(newEnv)
  currentEnvironment.value = newEnv.id
  saveToStorage()
}

const duplicateEnvironment = (envId) => {
  const env = environments.value.find(e => e.id === envId)
  if (env) {
    const newEnv = {
      ...env,
      id: `env_${Date.now()}`,
      name: `${env.name} (副本)`,
      variables: env.variables.map(v => ({ ...v, id: `var_${Date.now()}_${Math.random()}` }))
    }
    environments.value.push(newEnv)
    saveToStorage()
  }
}

const deleteEnvironment = (envId) => {
  if (environments.value.length <= 1) {
    alert('至少需要保留一个环境')
    return
  }

  if (confirm('确定要删除这个环境吗？')) {
    const index = environments.value.findIndex(e => e.id === envId)
    if (index > -1) {
      environments.value.splice(index, 1)
      if (currentEnvironment.value === envId) {
        currentEnvironment.value = environments.value[0].id
      }
      saveToStorage()
    }
  }
}

const updateEnvironmentInfo = () => {
  saveToStorage()
}

const addVariable = () => {
  const newVariable = {
    id: `var_${Date.now()}`,
    name: '',
    value: '',
    type: 'string',
    description: '',
    sensitive: false,
    encrypted: false
  }

  if (!currentEnvironmentData.value.variables) {
    currentEnvironmentData.value.variables = []
  }

  currentEnvironmentData.value.variables.push(newVariable)
  editingVariable.value = { ...newVariable }
  saveToStorage()
}

const editVariable = (variableId) => {
  const variable = currentVariables.value.find(v => v.id === variableId)
  if (variable) {
    editingVariable.value = { ...variable }
  }
}

const saveVariable = () => {
  if (!editingVariable.value) return

  const index = currentVariables.value.findIndex(v => v.id === editingVariable.value.id)
  if (index > -1) {
    currentVariables.value[index] = { ...editingVariable.value }
  } else {
    currentVariables.value.push({ ...editingVariable.value })
  }

  editingVariable.value = null
  saveToStorage()
}

const duplicateVariable = (variableId) => {
  const variable = currentVariables.value.find(v => v.id === variableId)
  if (variable) {
    const newVariable = {
      ...variable,
      id: `var_${Date.now()}`,
      name: `${variable.name}_COPY`
    }
    currentVariables.value.push(newVariable)
    saveToStorage()
  }
}

const deleteVariable = (variableId) => {
  if (confirm('确定要删除这个变量吗？')) {
    const index = currentVariables.value.findIndex(v => v.id === variableId)
    if (index > -1) {
      currentVariables.value.splice(index, 1)
      saveToStorage()
    }
  }
}

const toggleValueVisibility = (variableId) => {
  showValues.value[variableId] = !showValues.value[variableId]
}

const loadFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    parseEnvText(text)
  } catch (err) {
    console.error('读取剪贴板失败:', err)
    alert('无法读取剪贴板内容')
  }
}

const importFromFile = () => {
  fileInput.value?.click()
}

const handleFileImport = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    parseEnvText(content)
  }
  reader.readAsText(file)

  // 重置文件输入
  event.target.value = ''
}

const parseEnvText = (text) => {
  const lines = text.split('\n')
  const newVariables = []

  lines.forEach(line => {
    line = line.trim()
    if (!line || line.startsWith('#')) return

    const [name, ...valueParts] = line.split('=')
    if (name && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '')
      const existingVar = currentVariables.value.find(v => v.name === name)

      if (!existingVar) {
        newVariables.push({
          id: `var_${Date.now()}_${Math.random()}`,
          name: name.trim(),
          value: value,
          type: detectType(value),
          description: '',
          sensitive: isSensitive(name, value),
          encrypted: false
        })
      }
    }
  })

  if (newVariables.length > 0) {
    currentVariables.value.push(...newVariables)
    saveToStorage()
    console.log(`成功导入 ${newVariables.length} 个变量`)
  } else {
    console.log('未找到有效的环境变量')
  }
}

const generateTemplate = () => {
  const template = [
    '# 应用配置',
    'APP_NAME=my-application',
    'APP_VERSION=1.0.0',
    'APP_DEBUG=true',
    '',
    '# 数据库配置',
    'DB_HOST=localhost',
    'DB_PORT=3306',
    'DB_NAME=myapp',
    'DB_USERNAME=root',
    'DB_PASSWORD=password',
    '',
    '# API配置',
    'API_BASE_URL=https://api.example.com',
    'API_KEY=your-api-key',
    'API_SECRET=your-api-secret',
    '',
    '# 其他配置',
    'LOG_LEVEL=info',
    'MAX_CONNECTIONS=100',
    'TIMEOUT=30000'
  ]

  parseEnvText(template.join('\n'))
}

const previewExport = () => {
  exportPreview.value = generateExportContent()
}

const copyToClipboard = async () => {
  try {
    const content = generateExportContent()
    await navigator.clipboard.writeText(content)
    console.log('已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    console.log('复制失败，请重试')
  }
}

const downloadFile = () => {
  const content = generateExportContent()
  const filename = `${currentEnvironmentData.value.name}.${exportFormat.value}`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const generateExportContent = () => {
  let content = ''

  switch (exportFormat.value) {
    case 'env':
      content = generateEnvFormat()
      break
    case 'json':
      content = generateJsonFormat()
      break
    case 'yaml':
      content = generateYamlFormat()
      break
    case 'docker':
      content = generateDockerFormat()
      break
    case 'k8s':
      content = generateK8sFormat()
      break
    case 'export':
      content = generateExportFormat()
      break
  }

  return content
}

const generateEnvFormat = () => {
  let lines = []

  if (exportOptions.value.includeComments) {
    lines.push(`# ${currentEnvironmentData.value.name} 环境变量`)
    lines.push(`# 生成时间: ${new Date().toLocaleString()}`)
    lines.push('')
  }

  currentVariables.value.forEach(variable => {
    if (!exportOptions.value.includeEmpty && !variable.value) return

    if (exportOptions.value.includeComments && variable.description) {
      lines.push(`# ${variable.description}`)
    }

    let value = variable.value || ''
    if (exportOptions.value.encryptSensitive && variable.sensitive) {
      value = '***ENCRYPTED***'
    }

    lines.push(`${variable.name}=${value}`)
  })

  return lines.join('\n')
}

const generateJsonFormat = () => {
  const config = {}

  currentVariables.value.forEach(variable => {
    if (!exportOptions.value.includeEmpty && !variable.value) return

    let value = variable.value
    if (variable.type === 'boolean') {
      value = value === 'true'
    } else if (variable.type === 'number') {
      value = Number(value)
    } else if (variable.type === 'json') {
      try {
        value = JSON.parse(value)
      } catch (e) {
        // 保持原值
      }
    }

    if (exportOptions.value.encryptSensitive && variable.sensitive) {
      value = '***ENCRYPTED***'
    }

    config[variable.name] = value
  })

  return JSON.stringify(config, null, 2)
}

const generateYamlFormat = () => {
  let lines = []

  if (exportOptions.value.includeComments) {
    lines.push(`# ${currentEnvironmentData.value.name} 环境变量`)
    lines.push('')
  }

  currentVariables.value.forEach(variable => {
    if (!exportOptions.value.includeEmpty && !variable.value) return

    if (exportOptions.value.includeComments && variable.description) {
      lines.push(`# ${variable.description}`)
    }

    let value = variable.value || ''
    if (exportOptions.value.encryptSensitive && variable.sensitive) {
      value = '***ENCRYPTED***'
    }

    lines.push(`${variable.name}: ${value}`)
  })

  return lines.join('\n')
}

const generateDockerFormat = () => {
  let lines = ['version: "3.8"', 'services:', '  app:', '    environment:']

  currentVariables.value.forEach(variable => {
    if (!exportOptions.value.includeEmpty && !variable.value) return

    let value = variable.value || ''
    if (exportOptions.value.encryptSensitive && variable.sensitive) {
      value = '***ENCRYPTED***'
    }

    lines.push(`      - ${variable.name}=${value}`)
  })

  return lines.join('\n')
}

const generateK8sFormat = () => {
  let lines = [
    'apiVersion: v1',
    'kind: ConfigMap',
    'metadata:',
    `  name: ${currentEnvironmentData.value.name}-config`,
    'data:'
  ]

  currentVariables.value
    .filter(v => !v.sensitive && (!exportOptions.value.includeEmpty && v.value))
    .forEach(variable => {
      lines.push(`  ${variable.name}: "${variable.value || ''}"`)
    })

  const secrets = currentVariables.value.filter(v => v.sensitive && v.value)
  if (secrets.length > 0) {
    lines.push('')
    lines.push('---')
    lines.push('apiVersion: v1')
    lines.push('kind: Secret')
    lines.push('metadata:')
    lines.push(`  name: ${currentEnvironmentData.value.name}-secrets`)
    lines.push('type: Opaque')
    lines.push('data:')

    secrets.forEach(variable => {
      const encodedValue = btoa(variable.value)
      lines.push(`  ${variable.name}: "${encodedValue}"`)
    })
  }

  return lines.join('\n')
}

const generateExportFormat = () => {
  let lines = []

  if (exportOptions.value.includeComments) {
    lines.push('#!/bin/bash')
    lines.push(`# ${currentEnvironmentData.value.name} 环境变量`)
    lines.push('')
  }

  currentVariables.value.forEach(variable => {
    if (!exportOptions.value.includeEmpty && !variable.value) return

    let value = variable.value || ''
    if (exportOptions.value.encryptSensitive && variable.sensitive) {
      value = '***ENCRYPTED***'
    }

    lines.push(`export ${variable.name}="${value}"`)
  })

  return lines.join('\n')
}

// 工具函数
const detectType = (value) => {
  if (value === 'true' || value === 'false') return 'boolean'
  if (!isNaN(value) && value !== '') return 'number'
  if (value.startsWith('http://') || value.startsWith('https://')) return 'url'
  if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return 'path'

  try {
    JSON.parse(value)
    return 'json'
  } catch (e) {
    return 'string'
  }
}

const isSensitive = (name, value) => {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /api/i,
    /auth/i,
    /private/i,
    /credential/i
  ]

  return sensitivePatterns.some(pattern => pattern.test(name))
}

const saveToStorage = () => {
  try {
    localStorage.setItem('env-manager-data', JSON.stringify(environments.value))
    localStorage.setItem('env-manager-current', currentEnvironment.value)
  } catch (e) {
    console.error('保存失败:', e)
  }
}

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem('env-manager-data')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        environments.value = parsed
      }
    }

    const current = localStorage.getItem('env-manager-current')
    if (current) {
      currentEnvironment.value = current
    }
  } catch (e) {
    console.error('加载失败:', e)
  }
}

// 初始化
onMounted(() => {
  loadFromStorage()
  generateTemplate() // 生成一些示例变量
})
</script>