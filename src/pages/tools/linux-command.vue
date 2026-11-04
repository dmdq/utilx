<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Linux 命令生成器</h1>
      <p class="text-muted-foreground">可视化生成 Linux 命令，支持文件操作、系统管理和网络配置</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：配置区域 -->
      <div class="space-y-4">
        <!-- 命令类别选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">命令类别</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="category in commandCategories"
              :key="category.value"
              @click="selectedCategory = category.value"
              :class="[
                'px-4 py-3 rounded-md transition-colors text-left',
                selectedCategory === category.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">{{ category.name }}</div>
              <div class="text-xs opacity-80">{{ category.description }}</div>
            </button>
          </div>
        </div>

        <!-- 具体配置 -->
        <div v-if="selectedCategory" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">配置选项</h2>

          <!-- 文件操作配置 -->
          <div v-if="selectedCategory === 'file'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">操作类型</label>
              <select v-model="config.fileOperation" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="find">查找文件</option>
                <option value="copy">复制文件</option>
                <option value="move">移动文件</option>
                <option value="delete">删除文件</option>
                <option value="compress">压缩文件</option>
                <option value="extract">解压文件</option>
                <option value="chmod">修改权限</option>
              </select>
            </div>

            <!-- 查找文件 -->
            <div v-if="config.fileOperation === 'find'" class="space-y-3">
              <div>
                <label class="text-sm font-medium">查找路径</label>
                <input
                  v-model="config.findPath"
                  type="text"
                  placeholder="/home/user"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label class="text-sm font-medium">文件名模式</label>
                <input
                  v-model="config.fileName"
                  type="text"
                  placeholder="*.txt"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div class="flex items-center gap-3">
                <input
                  v-model="config.recursive"
                  type="checkbox"
                  id="recursive"
                  class="rounded text-primary focus:ring-primary"
                />
                <label for="recursive" class="text-sm">递归查找</label>
              </div>
            </div>

            <!-- 复制/移动文件 -->
            <div v-if="['copy', 'move'].includes(config.fileOperation)" class="space-y-3">
              <div>
                <label class="text-sm font-medium">源文件/目录</label>
                <input
                  v-model="config.sourcePath"
                  type="text"
                  placeholder="/path/to/source"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label class="text-sm font-medium">目标路径</label>
                <input
                  v-model="config.targetPath"
                  type="text"
                  placeholder="/path/to/destination"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div v-if="config.fileOperation === 'copy'" class="flex items-center gap-3">
                <input
                  v-model="config.preserve"
                  type="checkbox"
                  id="preserve"
                  class="rounded text-primary focus:ring-primary"
                />
                <label for="preserve" class="text-sm">保留属性</label>
              </div>
            </div>

            <!-- 修改权限 -->
            <div v-if="config.fileOperation === 'chmod'" class="space-y-3">
              <div>
                <label class="text-sm font-medium">文件/目录</label>
                <input
                  v-model="config.chmodPath"
                  type="text"
                  placeholder="/path/to/file"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label class="text-sm font-medium">权限模式</label>
                <div class="mt-2 grid grid-cols-3 gap-2">
                  <input
                    v-model="config.ownerPermission"
                    type="text"
                    placeholder="7"
                    class="px-3 py-2 border border-border rounded-md text-sm text-center"
                    maxlength="1"
                  />
                  <input
                    v-model="config.groupPermission"
                    type="text"
                    placeholder="5"
                    class="px-3 py-2 border border-border rounded-md text-sm text-center"
                    maxlength="1"
                  />
                  <input
                    v-model="config.otherPermission"
                    type="text"
                    placeholder="5"
                    class="px-3 py-2 border border-border rounded-md text-sm text-center"
                    maxlength="1"
                  />
                </div>
                <div class="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>所有者</span>
                  <span>组</span>
                  <span>其他</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 系统管理配置 -->
          <div v-if="selectedCategory === 'system'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">操作类型</label>
              <select v-model="config.systemOperation" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="ps">查看进程</option>
                <option value="kill">终止进程</option>
                <option value="service">服务管理</option>
                <option value="disk">磁盘使用</option>
                <option value="memory">内存使用</option>
                <option value="log">日志查看</option>
              </select>
            </div>

            <!-- 查看进程 -->
            <div v-if="config.systemOperation === 'ps'" class="space-y-3">
              <div class="flex items-center gap-3">
                <input
                  v-model="config.showAll"
                  type="checkbox"
                  id="showAll"
                  class="rounded text-primary focus:ring-primary"
                />
                <label for="showAll" class="text-sm">显示所有进程</label>
              </div>
              <div class="flex items-center gap-3">
                <input
                  v-model="config.showTree"
                  type="checkbox"
                  id="showTree"
                  class="rounded text-primary focus:ring-primary"
                />
                <label for="showTree" class="text-sm">树形显示</label>
              </div>
              <div>
                <label class="text-sm font-medium">筛选进程</label>
                <input
                  v-model="config.processFilter"
                  type="text"
                  placeholder="nginx"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
            </div>

            <!-- 服务管理 -->
            <div v-if="config.systemOperation === 'service'" class="space-y-3">
              <div>
                <label class="text-sm font-medium">服务名称</label>
                <input
                  v-model="config.serviceName"
                  type="text"
                  placeholder="nginx"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label class="text-sm font-medium">操作</label>
                <select v-model="config.serviceAction" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                  <option value="start">启动</option>
                  <option value="stop">停止</option>
                  <option value="restart">重启</option>
                  <option value="status">查看状态</option>
                  <option value="enable">开机自启</option>
                  <option value="disable">关闭自启</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 网络配置 -->
          <div v-if="selectedCategory === 'network'" class="space-y-4">
            <div>
              <label class="text-sm font-medium">操作类型</label>
              <select v-model="config.networkOperation" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="ping">Ping 测试</option>
                <option value="netstat">网络状态</option>
                <option value="ss">Socket 统计</option>
                <option value="curl">HTTP 请求</option>
                <option value="wget">下载文件</option>
                <option value="iptables">防火墙规则</option>
              </select>
            </div>

            <!-- Ping 测试 -->
            <div v-if="config.networkOperation === 'ping'" class="space-y-3">
              <div>
                <label class="text-sm font-medium">目标主机</label>
                <input
                  v-model="config.pingTarget"
                  type="text"
                  placeholder="google.com"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label class="text-sm font-medium">次数（可选）</label>
                <input
                  v-model="config.pingCount"
                  type="number"
                  placeholder="4"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
            </div>

            <!-- HTTP 请求 -->
            <div v-if="config.networkOperation === 'curl'" class="space-y-3">
              <div>
                <label class="text-sm font-medium">URL</label>
                <input
                  v-model="config.curlUrl"
                  type="text"
                  placeholder="https://api.example.com/data"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label class="text-sm font-medium">请求方法</label>
                <select v-model="config.curlMethod" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium">请求头（可选）</label>
                <textarea
                  v-model="config.curlHeaders"
                  placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                  class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm h-20 resize-none"
                ></textarea>
              </div>
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
              <Terminal class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>选择命令类型并配置选项</p>
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

    <!-- Linux 快速参考 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          Linux 快速参考
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-foreground mb-2">文件操作</h4>
            <ul class="space-y-1 text-sm text-muted-foreground">
              <li><code>ls -la</code> - 列出文件详情</li>
              <li><code>cp -r src dst</code> - 递归复制</li>
              <li><code>mv src dst</code> - 移动/重命名</li>
              <li><code>rm -rf dir</code> - 强制删除目录</li>
              <li><code>chmod 755 file</code> - 修改权限</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">系统管理</h4>
            <ul class="space-y-1 text-sm text-muted-foreground">
              <li><code>top</code> - 实时进程监控</li>
              <li><code>df -h</code> - 磁盘使用情况</li>
              <li><code>free -h</code> - 内存使用情况</li>
              <li><code>systemctl status service</code> - 服务状态</li>
              <li><code>journalctl -u service</code> - 查看日志</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Info, Terminal } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const selectedCategory = ref('')
const copied = ref(false)

// 配置选项
const config = ref({
  // 文件操作
  fileOperation: 'find',
  findPath: '',
  fileName: '',
  recursive: true,
  sourcePath: '',
  targetPath: '',
  preserve: false,
  chmodPath: '',
  ownerPermission: '7',
  groupPermission: '5',
  otherPermission: '5',
  // 系统管理
  systemOperation: 'ps',
  showAll: true,
  showTree: false,
  processFilter: '',
  serviceName: '',
  serviceAction: 'status',
  // 网络
  networkOperation: 'ping',
  pingTarget: '',
  pingCount: '',
  curlUrl: '',
  curlMethod: 'GET',
  curlHeaders: ''
})

// 命令类别
const commandCategories = [
  { value: 'file', name: '文件操作', description: '文件查找、复制、移动等' },
  { value: 'system', name: '系统管理', description: '进程、服务、资源监控' },
  { value: 'network', name: '网络配置', description: '网络测试、HTTP 请求等' }
]

// 生成命令
const generatedCommand = computed(() => {
  if (!selectedCategory.value) return ''

  let command = ''

  switch (selectedCategory.value) {
    case 'file':
      switch (config.value.fileOperation) {
        case 'find':
          command = 'find'
          if (config.value.findPath) {
            command += ` ${config.value.findPath}`
          }
          if (config.value.fileName) {
            command += ` -name "${config.value.fileName}"`
          }
          if (config.value.recursive) {
            command = `find ${config.value.findPath || '.'} -name "${config.value.fileName || '*'}"`
          }
          break
        case 'copy':
          command = 'cp'
          if (config.value.preserve) command += ' -p'
          if (config.value.sourcePath && config.value.targetPath) {
            command += ` ${config.value.sourcePath} ${config.value.targetPath}`
          }
          break
        case 'move':
          if (config.value.sourcePath && config.value.targetPath) {
            command = `mv ${config.value.sourcePath} ${config.value.targetPath}`
          }
          break
        case 'delete':
          if (config.value.sourcePath) {
            command = `rm -rf ${config.value.sourcePath}`
          }
          break
        case 'chmod':
          if (config.value.chmodPath) {
            const mode = `${config.value.ownerPermission}${config.value.groupPermission}${config.value.otherPermission}`
            command = `chmod ${mode} ${config.value.chmodPath}`
          }
          break
      }
      break

    case 'system':
      switch (config.value.systemOperation) {
        case 'ps':
          command = config.value.showTree ? 'pstree' : 'ps'
          if (config.value.showAll) command += ' aux'
          if (config.value.processFilter) {
            command += ` | grep ${config.value.processFilter}`
          }
          break
        case 'kill':
          if (config.value.processFilter) {
            command = `pkill ${config.value.processFilter}`
          }
          break
        case 'service':
          if (config.value.serviceName && config.value.serviceAction) {
            command = `systemctl ${config.value.serviceAction} ${config.value.serviceName}`
          }
          break
        case 'disk':
          command = 'df -h'
          break
        case 'memory':
          command = 'free -h'
          break
        case 'log':
          if (config.value.serviceName) {
            command = `journalctl -u ${config.value.serviceName} -f`
          }
          break
      }
      break

    case 'network':
      switch (config.value.networkOperation) {
        case 'ping':
          if (config.value.pingTarget) {
            command = `ping ${config.value.pingTarget}`
            if (config.value.pingCount) {
              command += ` -c ${config.value.pingCount}`
            }
          }
          break
        case 'netstat':
          command = 'netstat -tulpn'
          break
        case 'ss':
          command = 'ss -tulpn'
          break
        case 'curl':
          if (config.value.curlUrl) {
            command = `curl -X ${config.value.curlMethod}`
            if (config.value.curlHeaders) {
              const headers = config.value.curlHeaders.split('\n').filter(h => h.trim())
              headers.forEach(header => {
                command += ` -H "${header.trim()}"`
              })
            }
            command += ` ${config.value.curlUrl}`
          }
          break
        case 'wget':
          if (config.value.curlUrl) {
            command = `wget ${config.value.curlUrl}`
          }
          break
      }
      break
  }

  return command
})

// 命令说明
const commandDescription = computed(() => {
  if (!selectedCategory.value) return []

  const descriptions = {
    file: [
      'find 用于在文件系统中查找文件',
      'cp 用于复制文件或目录',
      'mv 用于移动或重命名文件',
      'rm 用于删除文件或目录（谨慎使用）',
      'chmod 用于修改文件权限'
    ],
    system: [
      'ps 用于查看当前运行的进程',
      'systemctl 用于管理系统服务',
      'df 显示磁盘使用情况',
      'free 显示内存使用情况',
      'journalctl 查看系统日志'
    ],
    network: [
      'ping 测试网络连通性',
      'netstat 显示网络连接状态',
      'curl 发送 HTTP 请求',
      'wget 下载文件',
      'iptables 配置防火墙规则'
    ]
  }

  return descriptions[selectedCategory.value] || []
})

// 常用命令示例
const commandExamples = [
  {
    title: '查找大于 100MB 的文件',
    command: 'find / -type f -size +100M 2>/dev/null'
  },
  {
    title: '查看端口占用',
    command: 'lsof -i :8080'
  },
  {
    title: '实时查看日志',
    command: 'tail -f /var/log/nginx/access.log'
  },
  {
    title: '批量重命名文件',
    command: "rename 's/old/new/' *.txt"
  },
  {
    title: '压缩目录',
    command: 'tar -czf backup.tar.gz /path/to/directory'
  },
  {
    title: '解压文件',
    command: 'tar -xzf backup.tar.gz'
  }
]

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

// SEO配置
useSeoMeta({
  title: 'Linux 命令生成器 - 可视化 Linux 命令生成工具',
  description: '免费的在线 Linux 命令生成器，可视化配置生成 Linux 命令，支持文件操作、系统管理、网络配置等常用命令。',
  keywords: ['linux', '命令生成', 'shell', 'bash', '文件操作', '系统管理', '网络配置', 'ubuntu', 'centos']
})


</script>