<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">Docker Compose 编辑器</h1>
      <p class="text-muted-foreground mb-4">在线编辑和验证 Docker Compose 文件，支持 Yaml 格式化、语法高亮和实时预览</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧编辑器 -->
      <div class="space-y-6">
        <!-- 版本选择和快速操作 -->
        <div class="bg-card rounded-lg p-4">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2">Compose 版本</label>
              <select v-model="composeVersion" @change="updateVersion" class="w-full px-3 py-2 border rounded-md">
                <option value="3.8">3.8 (最新推荐)</option>
                <option value="3.7">3.7</option>
                <option value="3.6">3.6</option>
                <option value="3.5">3.5</option>
                <option value="3.4">3.4</option>
                <option value="3.3">3.3</option>
                <option value="2.4">2.4 (旧版)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">快速模板</label>
              <select v-model="selectedTemplate" @change="loadTemplate" class="w-full px-3 py-2 border rounded-md">
                <option value="">选择模板...</option>
                <option value="web-app">Web 应用 (Nginx + Node.js)</option>
                <option value="database">数据库服务</option>
                <option value="microservice">微服务架构</option>
                <option value="development">开发环境</option>
                <option value="monitoring">监控服务</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="formatYaml"
              class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              格式化
            </button>
            <button
              @click="validateCompose"
              class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
            >
              验证
            </button>
            <button
              @click="clearEditor"
              class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
            >
              清空
            </button>
          </div>
        </div>

        <!-- YAML 编辑器 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">docker-compose.yml</h3>
            <div class="flex items-center gap-2">
              <div v-if="isValid" class="flex items-center gap-1 text-sm text-green-600">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                有效
              </div>
              <div v-else-if="hasErrors" class="flex items-center gap-1 text-sm text-red-600">
                <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                有错误
              </div>
            </div>
          </div>

          <textarea
            v-model="composeContent"
            @input="onInputChange"
            @blur="validateCompose"
            class="w-full h-96 p-3 font-mono text-sm border rounded-md resize-none"
            placeholder="version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - '8080:80'
    volumes:
      - ./html:/usr/share/nginx/html"
            spellcheck="false"
          ></textarea>

          <div class="mt-2 flex justify-between text-sm text-muted-foreground">
            <span>行数: {{ composeContent.split('\n').length }} | 字符数: {{ composeContent.length }}</span>
            <span v-if="lastSaved">保存于: {{ lastSaved.toLocaleTimeString() }}</span>
          </div>
        </div>

        <!-- 服务快速添加 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">快速添加服务</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="service in quickServices"
              :key="service.name"
              @click="addService(service)"
              class="p-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left"
            >
              <div class="font-medium">{{ service.name }}</div>
              <div class="text-xs text-muted-foreground">{{ service.description }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧预览和工具 -->
      <div class="space-y-6">
        <!-- 验证结果 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">验证结果</h3>
          <div v-if="validationResults.length === 0" class="text-center py-8 text-muted-foreground text-sm">
            点击"验证"按钮检查 Docker Compose 文件
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(result, index) in validationResults"
              :key="index"
              class="p-3 border rounded"
              :class="getValidationClass(result.level)"
            >
              <div class="flex items-start gap-2">
                <div class="flex-shrink-0 mt-0.5">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="getValidationIcon(result.level)"
                  ></div>
                </div>
                <div class="flex-1">
                  <div class="font-medium text-sm">{{ result.title }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ result.description }}</div>
                  <div v-if="result.line" class="text-xs text-muted-foreground mt-1">
                    行号: {{ result.line }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 服务拓扑图 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">服务拓扑</h3>
          <div class="border rounded bg-gray-50" style="height: 300px; position: relative;">
            <canvas ref="topologyCanvas" class="w-full h-full"></canvas>
            <div v-if="services.length === 0" class="absolute inset-0 flex items-center justify-center text-muted-foreground">
              定义服务后将显示拓扑图
            </div>
          </div>
        </div>

        <!-- 环境变量管理 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">环境变量</h3>
          <div class="space-y-2">
            <div
              v-for="(env, index) in environmentVariables"
              :key="index"
              class="flex gap-2"
            >
              <input
                v-model="env.key"
                @input="updateEnvFile"
                placeholder="变量名"
                class="flex-1 px-2 py-1 border rounded text-sm"
              >
              <input
                v-model="env.value"
                @input="updateEnvFile"
                placeholder="变量值"
                class="flex-1 px-2 py-1 border rounded text-sm"
              >
              <button
                @click="removeEnvVar(index)"
                class="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                删除
              </button>
            </div>
            <button
              @click="addEnvVar"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              添加环境变量
            </button>
          </div>
        </div>

        <!-- 网络和卷管理 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">网络和卷</h3>
          <div class="space-y-4">
            <div>
              <h4 class="font-medium text-sm mb-2">网络 ({{ networks.length }})</h4>
              <div v-if="networks.length === 0" class="text-xs text-muted-foreground">暂无自定义网络</div>
              <div v-else class="space-y-1">
                <div v-for="network in networks" :key="network" class="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>{{ network }}</span>
                  <span class="text-xs text-muted-foreground">bridge</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-sm mb-2">卷 ({{ volumes.length }})</h4>
              <div v-if="volumes.length === 0" class="text-xs text-muted-foreground">暂无定义卷</div>
              <div v-else class="space-y-1">
                <div v-for="volume in volumes" :key="volume" class="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>{{ volume }}</span>
                  <span class="text-xs text-muted-foreground">local</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出选项 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">导出</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="exportCompose"
              class="px-3 py-2 bg-primary text-primary-foreground rounded text-sm"
            >
              下载 docker-compose.yml
            </button>
            <button
              @click="exportEnvFile"
              class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              下载 .env 文件
            </button>
            <button
              @click="copyToClipboard"
              class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              复制到剪贴板
            </button>
            <button
              @click="generateDockerCommands"
              class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              生成 Docker 命令
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Docker 命令弹窗 -->
    <div v-if="showDockerCommands" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-card rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
        <h3 class="text-lg font-semibold mb-4">生成的 Docker 命令</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium mb-2">启动命令</h4>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto"><code>{{ dockerCommands.up }}</code></pre>
          </div>
          <div>
            <h4 class="font-medium mb-2">停止命令</h4>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto"><code>{{ dockerCommands.down }}</code></pre>
          </div>
          <div>
            <h4 class="font-medium mb-2">查看日志</h4>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto"><code>{{ dockerCommands.logs }}</code></pre>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button
            @click="copyDockerCommands"
            class="px-3 py-2 bg-primary text-primary-foreground rounded text-sm"
          >
            复制命令
          </button>
          <button
            @click="showDockerCommands = false"
            class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('Docker Compose 编辑器 - Yaml编辑和容器编排工具')

// 数据
const composeVersion = ref('3.8')
const selectedTemplate = ref('')
const composeContent = ref('')
const isValid = ref(false)
const hasErrors = ref(false)
const lastSaved = ref(null)
const validationResults = ref([])
const services = ref([])
const networks = ref([])
const volumes = ref([])
const environmentVariables = ref([])
const showDockerCommands = ref(false)
const dockerCommands = ref({
  up: '',
  down: '',
  logs: ''
})

const topologyCanvas = ref(null)

// 快速服务
const quickServices = [
  {
    name: 'Nginx',
    description: 'Web 服务器',
    config: `  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./html:/usr/share/nginx/html`
  },
  {
    name: 'MySQL',
    description: '数据库',
    config: `  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: app
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - '3306:3306'`
  },
  {
    name: 'Redis',
    description: '缓存服务',
    config: `  redis:
    image: redis:alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data`
  },
  {
    name: 'Node.js',
    description: 'Node 应用',
    config: `  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: development
    volumes:
      - .:/app
      - /app/node_modules`
  },
  {
    name: 'PostgreSQL',
    description: '关系数据库',
    config: `  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'`
  },
  {
    name: 'MongoDB',
    description: '文档数据库',
    config: `  mongodb:
    image: mongo:4.4
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - '27017:27017'`
  }
]

// 模板
const templates = {
  'web-app': `version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./html:/usr/share/nginx/html
    depends_on:
      - app

  app:
    build: .
    environment:
      NODE_ENV: production
    volumes:
      - ./logs:/app/logs

volumes:
  nginx_logs:`,

  'database': `version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: \${MYSQL_DATABASE}
      MYSQL_USER: \${MYSQL_USER}
      MYSQL_PASSWORD: \${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - '3306:3306'
    restart: unless-stopped

  redis:
    image: redis:alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:`,

  'microservice': `version: '3.8'

services:
  api-gateway:
    image: nginx:alpine
    ports:
      - '80:80'
    volumes:
      - ./gateway.conf:/etc/nginx/nginx.conf
    depends_on:
      - user-service
      - order-service
      - product-service

  user-service:
    build: ./services/user
    environment:
      DATABASE_URL: postgres://user:password@postgres-users:5432/users
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres-users
      - redis

  order-service:
    build: ./services/order
    environment:
      DATABASE_URL: postgres://order:password@postgres-orders:5432/orders
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres-orders
      - redis

  product-service:
    build: ./services/product
    environment:
      DATABASE_URL: postgres://product:password@postgres-products:5432/products
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres-products
      - redis

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

  postgres-users:
    image: postgres:13
    environment:
      POSTGRES_DB: users
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_users_data:/var/lib/postgresql/data

  postgres-orders:
    image: postgres:13
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: order
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_orders_data:/var/lib/postgresql/data

  postgres-products:
    image: postgres:13
    environment:
      POSTGRES_DB: products
      POSTGRES_USER: product
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_products_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_users_data:
  postgres_orders_data:
  postgres_products_data:`,

  'development': `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - '3000:3000'
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      CHOKIDAR_USEPOLLING: true
    command: npm run dev

  db:
    image: postgres:13
    ports:
      - '5432:5432'
    environment:
      POSTGRES_DB: dev_db
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - '6379:6379'

  adminer:
    image: adminer
    ports:
      - '8080:8080'
    depends_on:
      - db

volumes:
  postgres_dev_data:`,

  'monitoring': `version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana
    ports:
      - '3000:3000'
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  node-exporter:
    image: prom/node-exporter
    ports:
      - '9100:9100'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus_data:
  grafana_data:`
}

// 方法
const updateVersion = () => {
  if (!composeContent.value) {
    composeContent.value = `version: '${composeVersion.value}'
services:
  # 在这里添加服务`
  } else {
    composeContent.value = composeContent.value.replace(
      /^version:\s*['"]?[^'"]*['"]?/m,
      `version: '${composeVersion.value}'`
    )
  }
  validateCompose()
}

const loadTemplate = () => {
  if (selectedTemplate.value && templates[selectedTemplate.value]) {
    composeContent.value = templates[selectedTemplate.value]
    validateCompose()
  }
}

const formatYaml = () => {
  try {
    // 简单的 YAML 格式化
    let formatted = composeContent.value
      .split('\n')
      .map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return ''

        // 计算缩进
        const indentMatch = line.match(/^(\s*)/)
        const indent = indentMatch ? indentMatch[1] : ''

        // 处理特殊字符
        if (trimmed.includes(':') && !trimmed.includes(' ')) {
          return indent + trimmed
        }

        return indent + trimmed
      })
      .filter(line => line !== null)
      .join('\n')

    composeContent.value = formatted
    validateCompose()
  } catch (e) {
    console.error('格式化失败:', e)
  }
}

const validateCompose = () => {
  validationResults.value = []
  isValid.value = false
  hasErrors.value = false

  try {
    if (!composeContent.value.trim()) {
      validationResults.value.push({
        level: 'warning',
        title: '文件为空',
        description: 'Docker Compose 文件内容为空',
        line: null
      })
      hasErrors.value = true
      return
    }

    const lines = composeContent.value.split('\n')
    let hasVersion = false
    let hasServices = false
    const serviceNames = new Set()

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      const lineNum = index + 1

      // 检查版本
      if (trimmed.startsWith('version:')) {
        hasVersion = true
        const version = trimmed.match(/version:\s*['"]?([0-9.]+)['"]?/)
        if (version) {
          const [major, minor] = version[1].split('.').map(Number)
          if (major === 2 && minor >= 0) {
            validationResults.value.push({
              level: 'warning',
              title: '使用旧版本',
              description: '建议使用 Docker Compose 3.x 版本',
              line: lineNum
            })
          }
        }
      }

      // 检查服务
      if (trimmed === 'services:') {
        hasServices = true
      }

      // 提取服务名称
      const serviceMatch = trimmed.match(/^(\w+):/)
      if (serviceMatch && hasServices && !trimmed.startsWith('#')) {
        const serviceName = serviceMatch[1]
        if (serviceNames.has(serviceName)) {
          validationResults.value.push({
            level: 'error',
            title: '重复的服务名',
            description: `服务 "${serviceName}" 已存在`,
            line: lineNum
          })
          hasErrors.value = true
        } else {
          serviceNames.add(serviceName)
        }
      }

      // 检查常见错误
      if (trimmed.includes('\t')) {
        validationResults.value.push({
          level: 'error',
          title: '使用制表符',
          description: 'YAML 不支持制表符，请使用空格',
          line: lineNum
        })
        hasErrors.value = true
      }

      // 检查端口格式
      if (trimmed.includes('ports:') && !trimmed.includes('#')) {
        const portMatch = trimmed.match(/'([^']+)'/)
        if (portMatch && !portMatch[1].includes(':')) {
          validationResults.value.push({
            level: 'warning',
            title: '端口映射建议',
            description: '建议指定主机端口: 容器端口',
            line: lineNum
          })
        }
      }

      // 检查环境变量
      if (trimmed.includes('environment:') && index < lines.length - 1) {
        const nextLine = lines[index + 1].trim()
        if (nextLine && !nextLine.includes('#') && !nextLine.includes(':') && !nextLine.startsWith('-')) {
          validationResults.value.push({
            level: 'error',
            title: '环境变量格式错误',
            description: '环境变量应为 KEY: VALUE 或使用数组格式',
            line: lineNum + 1
          })
          hasErrors.value = true
        }
      }
    })

    if (!hasVersion) {
      validationResults.value.push({
        level: 'warning',
        title: '缺少版本',
        description: '建议指定 Docker Compose 版本',
        line: null
      })
    }

    if (!hasServices) {
      validationResults.value.push({
        level: 'error',
        title: '缺少服务',
        description: 'Docker Compose 文件必须定义至少一个服务',
        line: null
      })
      hasErrors.value = true
    }

    // 提取服务信息
    extractServices()

    isValid.value = !hasErrors.value

  } catch (e) {
    validationResults.value.push({
      level: 'error',
      title: '解析错误',
      description: e.message,
      line: null
    })
    hasErrors.value = true
  }
}

const extractServices = () => {
  services.value = []
  networks.value = []
  volumes.value = []

  try {
    const lines = composeContent.value.split('\n')
    let inServices = false
    let currentService = null

    lines.forEach(line => {
      const trimmed = line.trim()

      if (trimmed === 'services:') {
        inServices = true
        return
      }

      if (trimmed === 'networks:' || trimmed === 'volumes:') {
        inServices = false
        return
      }

      // 提取服务
      if (inServices) {
        const serviceMatch = trimmed.match(/^(\w+):/)
        if (serviceMatch && !trimmed.startsWith('#')) {
          currentService = serviceMatch[1]
          services.value.push({
            name: currentService,
            image: null,
            ports: [],
            depends_on: []
          })
        } else if (currentService && trimmed.includes('image:')) {
          const image = trimmed.replace('image:', '').trim()
          const service = services.value.find(s => s.name === currentService)
          if (service) service.image = image
        }
      }

      // 提取网络
      if (trimmed.includes('networks:') && !inServices) {
        const networkMatch = trimmed.match(/^\s*(\w+):/)
        if (networkMatch) {
          networks.value.push(networkMatch[1])
        }
      }

      // 提取卷
      if (trimmed.includes('volumes:') && !inServices) {
        const volumeMatch = trimmed.match(/^\s*(\w+):/)
        if (volumeMatch) {
          volumes.value.push(volumeMatch[1])
        }
      }
    })

    // 绘制拓扑图
    nextTick(() => {
      drawTopology()
    })
  } catch (e) {
    console.error('提取信息失败:', e)
  }
}

const drawTopology = () => {
  if (!topologyCanvas.value || services.value.length === 0) return

  const canvas = topologyCanvas.value
  const ctx = canvas.getContext('2d')

  // 设置画布大小
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制服务节点
  const nodeRadius = 30
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const angleStep = (2 * Math.PI) / services.value.length

  services.value.forEach((service, index) => {
    const x = centerX + Math.cos(index * angleStep) * 100
    const y = centerY + Math.sin(index * angleStep) * 80

    // 绘制节点
    ctx.beginPath()
    ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI)
    ctx.fillStyle = '#3b82f6'
    ctx.fill()
    ctx.strokeStyle = '#1d4ed8'
    ctx.lineWidth = 2
    ctx.stroke()

    // 绘制标签
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(service.name, x, y)

    // 绘制连接线（如果有关联）
    if (service.depends_on && service.depends_on.length > 0) {
      service.depends_on.forEach(dep => {
        const depIndex = services.value.findIndex(s => s.name === dep)
        if (depIndex !== -1) {
          const depX = centerX + Math.cos(depIndex * angleStep) * 100
          const depY = centerY + Math.sin(depIndex * angleStep) * 80

          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(depX, depY)
          ctx.strokeStyle = '#e5e7eb'
          ctx.lineWidth = 1
          ctx.setLineDash([5, 5])
          ctx.stroke()
          ctx.setLineDash([])
        }
      })
    }
  })
}

const addService = (service) => {
  if (!composeContent.value) {
    composeContent.value = `version: '${composeVersion.value}'

services:`
  }

  // 查找 services 部分
  const servicesIndex = composeContent.value.indexOf('services:')
  if (servicesIndex !== -1) {
    // 在 services 部分后添加新服务
    const before = composeContent.value.substring(0, servicesIndex + 9)
    const after = composeContent.value.substring(servicesIndex + 9)
    composeContent.value = before + '\n' + service.config + after
  } else {
    composeContent.value += `

services:
${service.config}`
  }

  validateCompose()
}

const clearEditor = () => {
  composeContent.value = ''
  validationResults.value = []
  isValid.value = false
  hasErrors.value = false
  services.value = []
  networks.value = []
  volumes.value = []
}

const onInputChange = () => {
  lastSaved.value = new Date()
}

const getValidationClass = (level) => {
  const classes = {
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50'
  }
  return classes[level] || classes.info
}

const getValidationIcon = (level) => {
  const colors = {
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }
  return colors[level] || colors.info
}

const addEnvVar = () => {
  environmentVariables.value.push({ key: '', value: '' })
}

const removeEnvVar = (index) => {
  environmentVariables.value.splice(index, 1)
  updateEnvFile()
}

const updateEnvFile = () => {
  // 更新环境变量文件内容
  const envContent = environmentVariables.value
    .filter(env => env.key && env.value)
    .map(env => `${env.key}=${env.value}`)
    .join('\n')

  // 这里可以保存到 .env 文件
  console.log('Environment file content:', envContent)
}

const exportCompose = () => {
  const blob = new Blob([composeContent.value], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'docker-compose.yml'
  a.click()
  URL.revokeObjectURL(url)
}

const exportEnvFile = () => {
  const envContent = environmentVariables.value
    .filter(env => env.key && env.value)
    .map(env => `${env.key}=${env.value}`)
    .join('\n')

  const blob = new Blob([envContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '.env'
  a.click()
  URL.revokeObjectURL(url)
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(composeContent.value)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const generateDockerCommands = () => {
  const projectName = 'myapp'

  dockerCommands.value = {
    up: `docker-compose up -d --build`,
    down: `docker-compose down --volumes`,
    logs: `docker-compose logs -f`
  }

  showDockerCommands.value = true
}

const copyDockerCommands = async () => {
  const commands = Object.values(dockerCommands.value).join('\n')
  try {
    await navigator.clipboard.writeText(commands)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 初始化
onMounted(() => {
  loadTemplate()
})
</script>