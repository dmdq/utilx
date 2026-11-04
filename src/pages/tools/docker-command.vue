<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Docker 命令生成器</h1>
      <p class="text-muted-foreground">可视化生成 Docker 命令，支持容器管理、镜像操作和网络配置</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：配置区域 -->
      <div class="space-y-4">
        <!-- 命令类型选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">命令类型</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="type in commandTypes"
              :key="type.value"
              @click="selectedType = type.value"
              :class="[
                'px-4 py-3 rounded-md transition-colors text-left',
                selectedType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">{{ type.name }}</div>
              <div class="text-xs opacity-80">{{ type.description }}</div>
            </button>
          </div>
        </div>

        <!-- 具体配置 -->
        <div v-if="selectedType" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">配置选项</h2>

          <!-- 运行容器配置 -->
          <div v-if="selectedType === 'run'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">镜像名称</label>
              <input
                v-model="config.image"
                type="text"
                placeholder="nginx:latest"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">容器名称</label>
              <input
                v-model="config.containerName"
                type="text"
                placeholder="my-container"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">端口映射</label>
              <div class="mt-2 space-y-2">
                <div v-for="(port, index) in config.ports" :key="index" class="flex gap-2">
                  <input
                    v-model="port.host"
                    type="text"
                    placeholder="8080"
                    class="flex-1 px-2 py-1 border border-border rounded text-sm"
                  />
                  <span>:</span>
                  <input
                    v-model="port.container"
                    type="text"
                    placeholder="80"
                    class="flex-1 px-2 py-1 border border-border rounded text-sm"
                  />
                  <button
                    @click="removePort(index)"
                    class="text-red-500 hover:text-red-700"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
                <button
                  @click="addPort"
                  class="text-sm text-primary hover:text-primary/80"
                >
                  + 添加端口
                </button>
              </div>
            </div>
            <div>
              <label class="text-sm font-medium">卷挂载</label>
              <div class="mt-2 space-y-2">
                <div v-for="(volume, index) in config.volumes" :key="index" class="flex gap-2">
                  <input
                    v-model="volume.host"
                    type="text"
                    placeholder="/host/path"
                    class="flex-1 px-2 py-1 border border-border rounded text-sm"
                  />
                  <span>:</span>
                  <input
                    v-model="volume.container"
                    type="text"
                    placeholder="/container/path"
                    class="flex-1 px-2 py-1 border border-border rounded text-sm"
                  />
                  <button
                    @click="removeVolume(index)"
                    class="text-red-500 hover:text-red-700"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
                <button
                  @click="addVolume"
                  class="text-sm text-primary hover:text-primary/80"
                >
                  + 添加卷
                </button>
              </div>
            </div>
            <div>
              <label class="text-sm font-medium">环境变量</label>
              <textarea
                v-model="config.environment"
                placeholder="KEY=value&#10;DEBUG=true"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm h-20 resize-none"
              ></textarea>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.detach"
                type="checkbox"
                id="detach"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="detach" class="text-sm">后台运行</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.remove"
                type="checkbox"
                id="remove"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="remove" class="text-sm">停止后自动删除</label>
            </div>
          </div>

          <!-- 构建镜像配置 -->
          <div v-if="selectedType === 'build'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">镜像名称</label>
              <input
                v-model="config.imageName"
                type="text"
                placeholder="my-app:1.0.0"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Dockerfile 路径</label>
              <input
                v-model="config.dockerfilePath"
                type="text"
                placeholder="./Dockerfile"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">构建上下文</label>
              <input
                v-model="config.context"
                type="text"
                placeholder="."
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">构建参数</label>
              <textarea
                v-model="config.buildArgs"
                placeholder="VERSION=1.0.0&#10;ENV=production"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm h-20 resize-none"
              ></textarea>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.noCache"
                type="checkbox"
                id="noCache"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="noCache" class="text-sm">不使用缓存</label>
            </div>
          </div>

          <!-- 网络配置 -->
          <div v-if="selectedType === 'network'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">网络名称</label>
              <input
                v-model="config.networkName"
                type="text"
                placeholder="my-network"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">驱动类型</label>
              <select v-model="config.driver" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="bridge">Bridge</option>
                <option value="host">Host</option>
                <option value="overlay">Overlay</option>
                <option value="macvlan">MACVLAN</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">子网（可选）</label>
              <input
                v-model="config.subnet"
                type="text"
                placeholder="172.20.0.0/16"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>

          <!-- Compose 配置 -->
          <div v-if="selectedType === 'compose'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">Compose 文件</label>
              <input
                v-model="config.composeFile"
                type="text"
                placeholder="docker-compose.yml"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">操作</label>
              <select v-model="config.composeAction" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="up">启动服务</option>
                <option value="down">停止并删除</option>
                <option value="start">启动</option>
                <option value="stop">停止</option>
                <option value="restart">重启</option>
                <option value="pull">拉取镜像</option>
                <option value="logs">查看日志</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">指定服务（可选）</label>
              <input
                v-model="config.services"
                type="text"
                placeholder="web db"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="config.daemon"
                type="checkbox"
                id="daemon"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="daemon" class="text-sm">后台运行</label>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：命令预览 -->
      <div class="space-y-4">
        <!-- 生成的命令 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">生成的命令</h2>
            <button
              @click="copyCommand"
              :disabled="!generatedCommand"
              class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>

          <div class="bg-muted/30 rounded-lg p-4">
            <code v-if="generatedCommand" class="text-sm whitespace-pre-wrap break-all">{{ generatedCommand }}</code>
            <div v-else class="text-center text-muted-foreground py-8">
              <Package class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>请选择命令类型并配置选项</p>
            </div>
          </div>
        </div>

        <!-- 命令说明 -->
        <div v-if="generatedCommand" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">命令说明</h2>
          <div class="space-y-3 text-sm text-muted-foreground">
            <div v-for="desc in commandDescription" :key="desc" class="flex gap-2">
              <span class="text-primary">•</span>
              <span>{{ desc }}</span>
            </div>
          </div>
        </div>

        <!-- 常用命令示例 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">常用命令示例</h2>
          <div class="space-y-3">
            <div
              v-for="example in commandExamples"
              :key="example.title"
              class="p-3 bg-muted rounded-lg"
            >
              <h4 class="font-medium text-sm mb-1">{{ example.title }}</h4>
              <code class="text-xs text-muted-foreground">{{ example.command }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Docker 最佳实践 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          Docker 最佳实践
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-foreground mb-2">容器管理</h4>
            <ul class="space-y-1 text-sm text-muted-foreground">
              <li>• 使用 .dockerignore 排除不必要的文件</li>
              <li>• 为容器设置资源限制</li>
              <li>• 使用健康检查确保容器正常</li>
              <li>• 定期清理未使用的镜像和容器</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">镜像优化</h4>
            <ul class="space-y-1 text-sm text-muted-foreground">
              <li>• 使用多阶段构建减小镜像体积</li>
              <li>• 选择合适的基础镜像</li>
              <li>• 合理利用缓存层</li>
              <li>• 最小化镜像层数</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Info, Package, X } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const selectedType = ref('')
const copied = ref(false)

// 配置选项
const config = ref({
  // 运行容器
  image: '',
  containerName: '',
  ports: [],
  volumes: [],
  environment: '',
  detach: true,
  remove: false,
  // 构建镜像
  imageName: '',
  dockerfilePath: './Dockerfile',
  context: '.',
  buildArgs: '',
  noCache: false,
  // 网络
  networkName: '',
  driver: 'bridge',
  subnet: '',
  // Compose
  composeFile: 'docker-compose.yml',
  composeAction: 'up',
  services: '',
  daemon: false
})

// 命令类型
const commandTypes = [
  { value: 'run', name: '运行容器', description: '创建并运行容器' },
  { value: 'build', name: '构建镜像', description: '从 Dockerfile 构建镜像' },
  { value: 'network', name: '网络管理', description: '创建和管理 Docker 网络' },
  { value: 'compose', name: 'Docker Compose', description: '多容器应用编排' }
]

// 生成命令
const generatedCommand = computed(() => {
  if (!selectedType.value) return ''

  let command = ''

  switch (selectedType.value) {
    case 'run':
      command = 'docker run'
      if (config.value.detach) command += ' -d'
      if (config.value.remove) command += ' --rm'
      if (config.value.containerName) command += ` --name ${config.value.containerName}`

      config.value.ports.forEach(port => {
        if (port.host && port.container) {
          command += ` -p ${port.host}:${port.container}`
        }
      })

      config.value.volumes.forEach(volume => {
        if (volume.host && volume.container) {
          command += ` -v ${volume.host}:${volume.container}`
        }
      })

      if (config.value.environment) {
        const envs = config.value.environment.split('\n').filter(e => e.trim())
        envs.forEach(env => {
          command += ` -e ${env.trim()}`
        })
      }

      command += ` ${config.value.image || '<image-name>'}`
      break

    case 'build':
      command = 'docker build'
      if (config.value.noCache) command += ' --no-cache'
      if (config.value.imageName) command += ` -t ${config.value.imageName}`
      if (config.value.dockerfilePath !== './Dockerfile') {
        command += ` -f ${config.value.dockerfilePath}`
      }
      if (config.value.buildArgs) {
        const args = config.value.buildArgs.split('\n').filter(a => a.trim())
        args.forEach(arg => {
          command += ` --build-arg ${arg.trim()}`
        })
      }
      command += ` ${config.value.context}`
      break

    case 'network':
      command = 'docker network create'
      if (config.value.driver !== 'bridge') command += ` --driver ${config.value.driver}`
      if (config.value.subnet) command += ` --subnet=${config.value.subnet}`
      command += ` ${config.value.networkName || '<network-name>'}`
      break

    case 'compose':
      command = 'docker-compose'
      if (config.value.composeFile !== 'docker-compose.yml') {
        command += ` -f ${config.value.composeFile}`
      }

      command += ` ${config.value.composeAction}`

      if (config.value.services) {
        command += ` ${config.value.services}`
      }

      if (config.value.daemon && ['up'].includes(config.value.composeAction)) {
        command += ' -d'
      }
      break
  }

  return command
})

// 命令说明
const commandDescription = computed(() => {
  if (!selectedType.value) return []

  const descriptions = {
    run: [
      'docker run 用于创建并启动一个新的容器',
      '-d 参数让容器在后台运行',
      '-p 用于端口映射，格式：主机端口:容器端口',
      '-v 用于卷挂载，格式：主机路径:容器路径',
      '-e 用于设置环境变量',
      '--rm 让容器停止后自动删除'
    ],
    build: [
      'docker build 用于从 Dockerfile 构建镜像',
      '-t 用于标记镜像名称和版本',
      '-f 指定 Dockerfile 路径',
      '--build-arg 传递构建参数',
      '--no-cache 忽略缓存重新构建'
    ],
    network: [
      'docker network create 创建新的 Docker 网络',
      '--driver 指定网络驱动类型',
      '--subnet 配置子网范围',
      '容器连接到同一网络后可以通过容器名互相访问'
    ],
    compose: [
      'docker-compose 用于管理多容器应用',
      '-f 指定 compose 文件路径',
      'up 创建并启动服务',
      'down 停止并删除服务和网络',
      'logs 查看服务日志'
    ]
  }

  return descriptions[selectedType.value] || []
})

// 常用命令示例
const commandExamples = [
  {
    title: '运行 Nginx 服务器',
    command: 'docker run -d -p 8080:80 --name web-server nginx:latest'
  },
  {
    title: '运行 PostgreSQL 数据库',
    command: 'docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword postgres:13'
  },
  {
    title: '构建 Go 应用镜像',
    command: 'docker build -t my-go-app:1.0 .'
  },
  {
    title: '查看运行中的容器',
    command: 'docker ps -a'
  },
  {
    title: '清理未使用的资源',
    command: 'docker system prune -a'
  },
  {
    title: '查看容器日志',
    command: 'docker logs -f container-name'
  }
]

// 添加端口映射
const addPort = () => {
  config.value.ports.push({ host: '', container: '' })
}

// 移除端口映射
const removePort = (index) => {
  config.value.ports.splice(index, 1)
}

// 添加卷挂载
const addVolume = () => {
  config.value.volumes.push({ host: '', container: '' })
}

// 移除卷挂载
const removeVolume = (index) => {
  config.value.volumes.splice(index, 1)
}

// 复制命令
const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText(generatedCommand.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// 初始化配置
const initConfig = () => {
  config.value = {
    // 运行容器
    image: '',
    containerName: '',
    ports: [{ host: '', container: '' }],
    volumes: [],
    environment: '',
    detach: true,
    remove: false,
    // 构建镜像
    imageName: '',
    dockerfilePath: './Dockerfile',
    context: '.',
    buildArgs: '',
    noCache: false,
    // 网络
    networkName: '',
    driver: 'bridge',
    subnet: '',
    // Compose
    composeFile: 'docker-compose.yml',
    composeAction: 'up',
    services: '',
    daemon: false
  }
}

// 监听类型变化
watch(selectedType, () => {
  initConfig()
})

// SEO配置
useSeoMeta({
  title: 'Docker 命令生成器 - 可视化 Docker 命令生成工具',
  description: '免费的在线 Docker 命令生成器，可视化配置生成 Docker 命令，支持容器运行、镜像构建、网络管理和 Docker Compose 编排。',
  keywords: ['docker', '容器', '命令生成', 'docker-compose', '容器化', 'dockerfile', '虚拟化']
})


</script>