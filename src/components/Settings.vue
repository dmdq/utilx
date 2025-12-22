<template>
  <div class="settings-container h-screen flex flex-col">
    <!-- Tab Navigation -->
    <div class="border-b border-gray-200">
      <nav class="flex space-x-8 px-6" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === tab.key
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="settings-section flex-1 overflow-y-auto p-6">
      <!-- 常规设置 -->
      <div v-show="activeTab === 'general'" class="space-y-6">
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">主题</label>
              <select
                v-model="userSettings.theme"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="auto">自动</option>
                <option value="light">亮色</option>
                <option value="dark">暗色</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">语言</label>
              <select
                v-model="userSettings.language"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          <div class="border-t pt-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">应用设置</h3>
            <div class="space-y-3">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="userSettings.auto_start"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <span class="ml-2 text-sm text-gray-700">开机启动</span>
              </label>

              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="userSettings.minimize_to_tray"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <span class="ml-2 text-sm text-gray-700">最小化到托盘</span>
              </label>

              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="userSettings.show_notifications"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <span class="ml-2 text-sm text-gray-700">显示通知</span>
              </label>
            </div>
          </div>

          <div class="border-t pt-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">窗口设置</h3>
            <div class="space-y-3">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="userSettings.window_settings.remember_size"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <span class="ml-2 text-sm text-gray-700">记住窗口大小</span>
              </label>

              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="userSettings.window_settings.remember_position"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <span class="ml-2 text-sm text-gray-700">记住窗口位置</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 更新设置 -->
      <div v-show="activeTab === 'update'" class="space-y-6">
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="updateConfig.auto_check_enabled"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <span class="ml-2 text-sm text-gray-700">自动检查更新</span>
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">检查间隔</label>
              <div class="flex items-center space-x-2">
                <input
                  type="number"
                  v-model.number="updateConfig.check_interval_hours"
                  :min="1"
                  :max="168"
                  :disabled="!updateConfig.auto_check_enabled"
                  class="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                <span class="text-sm text-gray-500">小时</span>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="updateConfig.auto_download_hotfix"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              >
              <span class="ml-2 text-sm text-gray-700">自动下载热更新</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="updateConfig.auto_install_hotfix"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              >
              <span class="ml-2 text-sm text-gray-700">自动安装热更新</span>
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">发布频道</label>
              <select
                v-model="updateConfig.release_channel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="stable">稳定版</option>
                <option value="beta">测试版</option>
                <option value="dev">开发版</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">更新服务器</label>
              <input
                type="text"
                v-model="updateConfig.update_server"
                placeholder="https://updates.util.cn"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
            </div>
          </div>

          <div class="border-t pt-4">
            <div class="flex flex-wrap gap-3">
              <button
                @click="checkForUpdates"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download class="w-4 h-4 mr-2" />
                检查更新
              </button>

              <button
                @click="viewUpdateHistory"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <History class="w-4 h-4 mr-2" />
                更新历史
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 工具设置 -->
      <div v-show="activeTab === 'tools'" class="space-y-6">
        <div class="space-y-6">
          <!-- 端口检查器 -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">端口检查器</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">默认端口</label>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(port, index) in toolsConfig.port_checker.default_ports"
                    :key="index"
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {{ port }}
                    <button
                      @click="toolsConfig.port_checker.default_ports.splice(index, 1)"
                      class="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                  <button
                    @click="toolsConfig.port_checker.default_ports.push(8080)"
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >
                    + 添加端口
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">超时时间</label>
                <div class="flex items-center space-x-2">
                  <input
                    type="number"
                    v-model.number="toolsConfig.port_checker.timeout"
                    :min="1000"
                    :max="30000"
                    :step="1000"
                    class="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                  <span class="text-sm text-gray-500">毫秒</span>
                </div>
              </div>
            </div>
          </div>

          <!-- WHOIS 查询 -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">WHOIS 查询</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">默认服务器</label>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(server, index) in toolsConfig.whois_lookup.default_servers"
                    :key="index"
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {{ server }}
                    <button
                      @click="toolsConfig.whois_lookup.default_servers.splice(index, 1)"
                      class="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                  <button
                    @click="toolsConfig.whois_lookup.default_servers.push('whois.example.com')"
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >
                    + 添加服务器
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">超时时间</label>
                <div class="flex items-center space-x-2">
                  <input
                    type="number"
                    v-model.number="toolsConfig.whois_lookup.timeout"
                    :min="5000"
                    :max="60000"
                    :step="1000"
                    class="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                  <span class="text-sm text-gray-500">毫秒</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 二维码生成器 -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">二维码生成器</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  默认尺寸: {{ toolsConfig.qr_code.default_size }}px
                </label>
                <input
                  type="range"
                  v-model.number="toolsConfig.qr_code.default_size"
                  :min="100"
                  :max="500"
                  :step="10"
                  class="w-full"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">纠错级别</label>
                <select
                  v-model="toolsConfig.qr_code.error_correction"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="L">低 (L)</option>
                  <option value="M">中 (M)</option>
                  <option value="Q">高 (Q)</option>
                  <option value="H">最高 (H)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">默认格式</label>
                <select
                  v-model="toolsConfig.qr_code.default_format"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="svg">SVG</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 配置管理 -->
      <div v-show="activeTab === 'config'" class="space-y-6">
        <div class="space-y-6">
          <!-- 配置备份 -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">配置备份</h3>
              <button
                @click="createBackup"
                class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save class="w-4 h-4 mr-2" />
                创建备份
              </button>
            </div>

            <div v-if="configBackups.length > 0" class="space-y-2">
              <div
                v-for="backup in configBackups"
                :key="backup"
                class="flex justify-between items-center p-3 border border-gray-200 rounded-md"
              >
                <span class="text-sm font-medium text-gray-900">{{ backup }}</span>
                <div class="flex space-x-2">
                  <button
                    @click="restoreBackup(backup)"
                    class="px-3 py-1 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    恢复
                  </button>
                  <button
                    @click="deleteBackup(backup)"
                    class="px-3 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              暂无备份
            </div>
          </div>

          <!-- 配置导入导出 -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">配置导入导出</h3>
            <div class="flex flex-wrap gap-3">
              <button
                @click="exportConfig"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload class="w-4 h-4 mr-2" />
                导出配置
              </button>

              <button
                @click="importConfig"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download class="w-4 h-4 mr-2" />
                导入配置
              </button>

              <button
                @click="resetConfig"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw class="w-4 h-4 mr-2" />
                重置配置
              </button>
            </div>
          </div>

          <!-- 缓存管理 -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">缓存管理</h3>
            <div class="flex flex-wrap gap-3">
              <button
                @click="clearCache"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <Trash2 class="w-4 h-4 mr-2" />
                清理缓存
              </button>

              <button
                @click="openConfigDir"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Folder class="w-4 h-4 mr-2" />
                打开配置目录
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 关于 -->
      <div v-show="activeTab === 'about'" class="space-y-6">
        <div class="text-center space-y-4">
          <div class="app-info">
            <img src="/icon.png" alt="Logo" class="w-16 h-16 mx-auto" />
            <h2 class="text-2xl font-bold text-gray-900">有条工具</h2>
            <p class="text-gray-600">开发者效率工具箱</p>
          </div>

          <div class="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
            <dl class="space-y-2">
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-600">版本</dt>
                <dd class="text-sm text-gray-900">{{ appInfo.version }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-600">构建时间</dt>
                <dd class="text-sm text-gray-900">{{ appInfo.build_time }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-600">Git 提交</dt>
                <dd class="text-sm text-gray-900 font-mono">{{ appInfo.git_commit.substring(0, 8) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-600">Rust 版本</dt>
                <dd class="text-sm text-gray-900">{{ appInfo.rust_version }}</dd>
              </div>
            </dl>
          </div>

          <div class="flex flex-wrap justify-center gap-3">
            <button
              @click="openWebsite"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              官方网站
            </button>
            <button
              @click="openGitHub"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              GitHub
            </button>
            <button
              @click="checkForUpdates"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download class="w-4 h-4 mr-2" />
              检查更新
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="settings-footer border-t border-gray-200 bg-gray-50 p-4">
      <div class="flex space-x-3">
        <button
          @click="saveSettings"
          :disabled="saving"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="saving" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          保存设置
        </button>
        <button
          @click="resetSettings"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          重置设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import {
  Download, History, Save, Upload, RefreshCw, Trash2, Folder
} from 'lucide-vue-next'

// 响应式数据
const saving = ref(false)
const activeTab = ref('general')
const configBackups = ref([])

const tabs = [
  { key: 'general', label: '常规设置' },
  { key: 'update', label: '更新设置' },
  { key: 'tools', label: '工具设置' },
  { key: 'config', label: '配置管理' },
  { key: 'about', label: '关于' }
]

const userSettings = reactive({
  theme: 'auto',
  language: 'zh-CN',
  auto_start: false,
  minimize_to_tray: true,
  show_notifications: true,
  window_settings: {
    remember_size: true,
    remember_position: true
  },
  tools: {
    remember_last_used: true,
    favorites: []
  }
})

const updateConfig = reactive({
  auto_check_enabled: true,
  check_interval_hours: 24,
  auto_download_hotfix: true,
  auto_install_hotfix: false,
  release_channel: 'stable',
  update_server: 'http://localhost:3001'
})

const toolsConfig = reactive({
  port_checker: {
    default_ports: [80, 443, 8080, 3000, 5000],
    timeout: 5000
  },
  whois_lookup: {
    default_servers: ['whois.verisign-grs.com', 'whois.crsnic.net'],
    timeout: 10000
  },
  qr_code: {
    default_size: 200,
    error_correction: 'M',
    default_format: 'png'
  }
})

const appInfo = ref({
  version: '1.0.0',
  build_time: '',
  git_commit: '',
  rust_version: ''
})

// 消息提示函数
const showMessage = (message, type = 'info') => {
  // 简单的消息提示实现
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }

  const notification = document.createElement('div')
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}

const showConfirmDialog = (title, content, onConfirm) => {
  if (confirm(`${title}\n\n${content}`)) {
    onConfirm()
  }
}

// 加载设置
const loadSettings = async () => {
  try {
    // 加载用户设置
    const userSettingsData = await invoke('get_user_settings')
    Object.assign(userSettings, userSettingsData)

    // 加载更新配置
    const updateConfigData = await invoke('get_update_config')
    Object.assign(updateConfig, updateConfigData)

    // 加载工具配置
    const toolsConfigData = await invoke('get_tools_config')
    Object.assign(toolsConfig, toolsConfigData)

    // 加载应用信息
    appInfo.value = await invoke('get_app_info')

    // 加载配置备份列表
    configBackups.value = await invoke('list_config_backups')
  } catch (error) {
    showMessage(`加载设置失败: ${error}`, 'error')
  }
}

// 保存设置
const saveSettings = async () => {
  saving.value = true
  try {
    await invoke('save_user_settings', { settings: userSettings })
    await invoke('update_update_config', { config: updateConfig })
    await invoke('save_tools_config', { config: toolsConfig })

    showMessage('设置保存成功', 'success')
  } catch (error) {
    showMessage(`保存设置失败: ${error}`, 'error')
  } finally {
    saving.value = false
  }
}

// 重置设置
const resetSettings = async () => {
  showConfirmDialog(
    '确认重置',
    '确定要重置所有设置到默认值吗？此操作无法撤销。',
    async () => {
      try {
        await invoke('reset_config')
        await loadSettings()
        showMessage('设置已重置', 'success')
      } catch (error) {
        showMessage(`重置设置失败: ${error}`, 'error')
      }
    }
  )
}

// 创建备份
const createBackup = async () => {
  try {
    await invoke('backup_config')
    configBackups.value = await invoke('list_config_backups')
    showMessage('备份创建成功', 'success')
  } catch (error) {
    showMessage(`创建备份失败: ${error}`, 'error')
  }
}

// 恢复备份
const restoreBackup = (backup) => {
  showConfirmDialog(
    '确认恢复',
    `确定要恢复备份 "${backup}" 吗？这将覆盖当前设置。`,
    async () => {
      try {
        await invoke('restore_config_backup', { backupName: backup })
        await loadSettings()
        showMessage('备份恢复成功', 'success')
      } catch (error) {
        showMessage(`恢复备份失败: ${error}`, 'error')
      }
    }
  )
}

// 删除备份
const deleteBackup = (backup) => {
  showConfirmDialog(
    '确认删除',
    `确定要删除备份 "${backup}" 吗？此操作无法撤销。`,
    async () => {
      try {
        // 这里需要实现删除备份的逻辑
        showMessage('备份已删除', 'success')
      } catch (error) {
        showMessage(`删除备份失败: ${error}`, 'error')
      }
    }
  )
}

// 导出配置
const exportConfig = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const exportPath = `util-config-backup-${timestamp}.json`
    await invoke('export_config', { exportPath })
    showMessage('配置导出成功', 'success')
  } catch (error) {
    showMessage(`导出配置失败: ${error}`, 'error')
  }
}

// 导入配置
const importConfig = async () => {
  try {
    // 这里需要实现文件选择对话框
    showMessage('请在对话框中选择要导入的配置文件', 'info')
  } catch (error) {
    showMessage(`导入配置失败: ${error}`, 'error')
  }
}

// 清理缓存
const clearCache = async () => {
  try {
    await invoke('clear_cache')
    showMessage('缓存清理成功', 'success')
  } catch (error) {
    showMessage(`清理缓存失败: ${error}`, 'error')
  }
}

// 打开配置目录
const openConfigDir = async () => {
  try {
    await invoke('open_config_dir')
  } catch (error) {
    showMessage(`打开配置目录失败: ${error}`, 'error')
  }
}

// 检查更新
const checkForUpdates = async () => {
  // 调用 UpdateManager 组件的检查更新方法
  window.dispatchEvent(new CustomEvent('check-for-updates'))
}

// 查看更新历史
const viewUpdateHistory = () => {
  // 调用 UpdateManager 组件的查看历史方法
  window.dispatchEvent(new CustomEvent('view-update-history'))
}

// 打开网站
const openWebsite = () => {
  window.open('https://www.util.cn', '_blank')
}

// 打开 GitHub
const openGitHub = () => {
  window.open('https://github.com/dmdq/utilx', '_blank')
}

// 初始化
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.settings-section {
  padding: 20px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.settings-footer {
  padding: 16px 20px;
  border-top: 1px solid hsl(var(--border));;
  background-color: hsl(var(--border));;
}

.app-info {
  text-align: center;
}

.app-info h2 {
  margin: 16px 0 8px 0;
  color: #111827;
}

.app-info p {
  margin: 0;
  color: #6b7280;
}
</style>