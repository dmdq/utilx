<template>
  <div class="update-manager flex items-center gap-2">
    <!-- 更新检查按钮 -->
    <button
      @click="checkForUpdates"
      :disabled="checking"
      class="inline-flex items-center px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
    >
      <Download class="w-4 h-4 mr-2" />
      <span v-if="checking">检查中...</span>
      <span v-else>检查更新</span>
    </button>

    <!-- 更新状态模态框 -->
    <div v-if="showUpdateModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>

        <div class="relative bg-background border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <!-- 模态框头部 -->
          <div class="flex items-center justify-between p-6 border-b border-border">
            <h2 class="text-xl font-semibold text-foreground">发现新版本</h2>
            <div class="flex items-center gap-2">
              <button
                v-if="updateInfo && !updateInfo.is_force_update"
                @click="ignoreUpdate"
                class="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                忽略此版本
              </button>
              <button
                @click="closeModal"
                class="p-2 hover:bg-accent rounded-md transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 模态框内容 -->
          <div class="p-6">
            <div v-if="updateInfo">
              <!-- 版本信息 -->
              <div class="mb-4">
                <h3 class="text-lg font-semibold text-green-600 mb-2">版本 {{ updateInfo.latest_version }}</h3>
                <p class="text-sm text-muted-foreground">发布时间：{{ formatDate(updateInfo.release_date) }}</p>
              </div>

              <!-- 更新类型 -->
              <div class="mb-4">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                    updateInfo.update_type?.type === 'Hotfix'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ getUpdateTypeText() }}
                </span>
              </div>

              <!-- 更新说明 -->
              <div class="mb-4">
                <h4 class="font-semibold mb-2">更新内容：</h4>
                <div
                  class="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed"
                  v-html="formatReleaseNotes(updateInfo.release_notes)"
                ></div>
              </div>

              <!-- 强制更新提示 -->
              <div v-if="updateInfo.is_force_update" class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex">
                  <svg class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p class="text-sm text-yellow-800">此版本为强制更新，请立即更新以继续使用应用</p>
                </div>
              </div>
            </div>

            <!-- 更新进度 -->
            <div v-if="updateStatus" class="mb-6">
              <div class="mb-2">
                <div class="flex justify-between text-sm mb-1">
                  <span>{{ getProgressText() }}</span>
                  <span>{{ getProgressPercentage() }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-300"
                    :class="getProgressColorClass()"
                    :style="{ width: getProgressPercentage() + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end gap-3">
              <button
                v-if="!updateStatus"
                @click="startUpdate"
                :disabled="updating"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <span v-if="updating">处理中...</span>
                <span v-else>{{ getUpdateButtonText() }}</span>
              </button>

              <button
                v-if="updateStatus && updateStatus.type === 'Downloading'"
                @click="cancelUpdate"
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
              >
                取消更新
              </button>

              <button
                v-if="!updateInfo?.is_force_update && !updateStatus"
                @click="closeModal"
                class="px-4 py-2 border border-border rounded-md hover:bg-accent font-medium transition-colors"
              >
                稍后更新
              </button>

              <button
                v-if="updateStatus?.type === 'Completed'"
                @click="restartApp"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
              >
                重启应用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置模态框 -->
    <div v-if="showSettingsModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showSettingsModal = false"></div>

        <div class="relative bg-background border border-border rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between p-6 border-b border-border">
            <h2 class="text-xl font-semibold text-foreground">更新设置</h2>
            <button
              @click="showSettingsModal = false"
              class="p-2 hover:bg-accent rounded-md transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6">
            <form @submit.prevent="saveSettings" class="space-y-4">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-foreground">自动检查更新</label>
                <input
                  type="checkbox"
                  v-model="updateConfig.auto_check_enabled"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-2">检查间隔</label>
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    v-model.number="updateConfig.check_interval_hours"
                    :min="1"
                    :max="168"
                    :disabled="!updateConfig.auto_check_enabled"
                    class="w-24 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                  />
                  <span class="text-sm text-muted-foreground">小时</span>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-foreground">自动下载热更新</label>
                <input
                  type="checkbox"
                  v-model="updateConfig.auto_download_hotfix"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
              </div>

              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-foreground">自动安装热更新</label>
                <input
                  type="checkbox"
                  v-model="updateConfig.auto_install_hotfix"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-2">发布频道</label>
                <select
                  v-model="updateConfig.release_channel"
                  class="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="stable">稳定版</option>
                  <option value="beta">测试版</option>
                  <option value="dev">开发版</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-2">更新服务器</label>
                <input
                  type="text"
                  v-model="updateConfig.update_server"
                  placeholder="https://updates.util.cn"
                  class="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="submit"
                  class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors"
                >
                  保存设置
                </button>
                <button
                  type="button"
                  @click="showSettingsModal = false"
                  class="px-4 py-2 border border-border rounded-md hover:bg-accent font-medium transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- 更新历史模态框 -->
    <div v-if="showHistoryModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showHistoryModal = false"></div>

        <div class="relative bg-background border border-border rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between p-6 border-b border-border">
            <h2 class="text-xl font-semibold text-foreground">更新历史</h2>
            <button
              @click="showHistoryModal = false"
              class="p-2 hover:bg-accent rounded-md transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 max-h-96 overflow-y-auto">
            <div v-if="updateHistory.length > 0" class="space-y-4">
              <div
                v-for="history in updateHistory"
                :key="history.version"
                class="relative pl-8 pb-4 border-l-2"
                :class="history.success ? 'border-green-500' : 'border-red-500'"
              >
                <div
                  class="absolute w-4 h-4 rounded-full -left-2.5 top-0"
                  :class="history.success ? 'bg-green-500' : 'bg-red-500'"
                ></div>

                <div class="mb-1">
                  <span class="font-semibold text-foreground">版本 {{ history.version }}</span>
                  <span
                    class="ml-2 text-xs px-2 py-1 rounded-full"
                    :class="history.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ history.success ? '成功' : '失败' }}
                  </span>
                </div>

                <p class="text-sm text-muted-foreground mb-1">
                  {{ formatHistoryItem(history) }}
                </p>

                <p class="text-xs text-muted-foreground">
                  {{ formatDate(history.installed_at) }}
                </p>
              </div>
            </div>

            <div v-else class="text-center py-12">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-muted-foreground">暂无更新历史</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 p-6 border-t border-border">
            <button
              @click="clearHistory"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
            >
              清空历史
            </button>
            <button
              @click="showHistoryModal = false"
              class="px-4 py-2 border border-border rounded-md hover:bg-accent font-medium transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置按钮 -->
    <button
      @click="showSettingsModal = true"
      class="p-2 hover:bg-accent rounded-md transition-colors"
      title="更新设置"
    >
      <Settings class="w-4 h-4" />
    </button>

    <!-- 历史按钮 -->
    <button
      @click="loadHistory"
      class="p-2 hover:bg-accent rounded-md transition-colors"
      title="更新历史"
    >
      <History class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { Download, Settings, History } from 'lucide-vue-next'

// 消息提示函数
const showMessage = (message, type = 'info') => {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }

  const notification = document.createElement('div')
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center`
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.opacity = '0'
    notification.style.transition = 'opacity 0.3s'
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

// 响应式数据
const checking = ref(false)
const updating = ref(false)
const showUpdateModal = ref(false)
const showSettingsModal = ref(false)
const showHistoryModal = ref(false)
const updateInfo = ref(null)
const updateStatus = ref(null)
const updateHistory = ref([])
const currentVersion = ref('')

const updateConfig = reactive({
  auto_check_enabled: true,
  check_interval_hours: 24,
  auto_download_hotfix: true,
  auto_install_hotfix: false,
  release_channel: 'stable',
  update_server: 'https://updates.util.cn'
})

// 关闭模态框
const closeModal = () => {
  if (!updateInfo.value?.is_force_update) {
    showUpdateModal.value = false
  }
}

// 检查更新
const checkForUpdates = async () => {
  checking.value = true
  try {
    const result = await invoke('check_for_updates')
    if (result.latest_version !== currentVersion.value) {
      updateInfo.value = result
      showUpdateModal.value = true

      // 如果是热更新且启用了自动下载
      if (result.update_type?.type === 'Hotfix' && updateConfig.auto_download_hotfix) {
        await startUpdate()
      }
    } else {
      showMessage('当前已是最新版本', 'success')
    }
  } catch (error) {
    showMessage(`检查更新失败: ${error}`, 'error')
  } finally {
    checking.value = false
  }
}

// 开始更新
const startUpdate = async () => {
  if (!updateInfo.value) return

  updating.value = true
  try {
    if (updateInfo.value.update_type?.type === 'Hotfix') {
      // 热更新
      await invoke('apply_hotfix_update', {
        updateFiles: updateInfo.value.update_type.files
      })
    } else {
      // 大版本更新
      await invoke('download_major_update', {
        downloadUrl: updateInfo.value.update_type.download_url
      })
    }
  } catch (error) {
    showMessage(`更新失败: ${error}`, 'error')
    updating.value = false
  }
}

// 忽略更新
const ignoreUpdate = async () => {
  if (!updateInfo.value) return

  try {
    await invoke('ignore_version', {
      version: updateInfo.value.latest_version
    })
    showMessage('已忽略此版本', 'success')
    showUpdateModal.value = false
  } catch (error) {
    showMessage(`忽略版本失败: ${error}`, 'error')
  }
}

// 取消更新
const cancelUpdate = async () => {
  try {
    await invoke('cancel_update')
    showMessage('已取消更新', 'success')
    updating.value = false
    updateStatus.value = null
  } catch (error) {
    showMessage(`取消更新失败: ${error}`, 'error')
  }
}

// 重启应用
const restartApp = async () => {
  try {
    await invoke('restart_app')
  } catch (error) {
    showMessage(`重启失败: ${error}`, 'error')
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    await invoke('update_update_config', {
      config: updateConfig
    })
    showMessage('设置已保存', 'success')
    showSettingsModal.value = false
  } catch (error) {
    showMessage(`保存设置失败: ${error}`, 'error')
  }
}

// 加载历史
const loadHistory = async () => {
  try {
    const history = await invoke('get_update_history', { limit: 20 })
    updateHistory.value = history
    showHistoryModal.value = true
  } catch (error) {
    showMessage(`加载历史失败: ${error}`, 'error')
  }
}

// 清空历史
const clearHistory = async () => {
  if (!confirm('确定要清空所有更新历史吗？')) return

  try {
    await invoke('clear_update_history')
    updateHistory.value = []
    showMessage('历史已清空', 'success')
  } catch (error) {
    showMessage(`清空历史失败: ${error}`, 'error')
  }
}

// 工具函数
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatReleaseNotes = (notes) => {
  return notes.replace(/\n/g, '<br>')
}

const formatHistoryItem = (history) => {
  let text = `${history.update_type === 'hotfix' ? '热更新' : '大版本更新'}`
  if (!history.success) {
    text += ` - ${history.error_message || '未知错误'}`
  }
  return text
}

const getUpdateTypeText = () => {
  if (!updateInfo.value?.update_type) return '未知'
  return updateInfo.value.update_type.type === 'Hotfix' ? '热更新' : '大版本更新'
}

const getProgressPercentage = () => {
  if (!updateStatus.value) return 0
  if (updateStatus.value.type === 'Downloading') {
    return updateStatus.value.progress || 0
  }
  return 100
}

const getProgressColorClass = () => {
  if (!updateStatus.value) return 'bg-gray-500'
  switch (updateStatus.value.type) {
    case 'Downloading': return 'bg-blue-500'
    case 'Installing': return 'bg-yellow-500'
    case 'Completed': return 'bg-green-500'
    case 'Failed': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getProgressText = () => {
  if (!updateStatus.value) return '准备中...'
  switch (updateStatus.value.type) {
    case 'Checking': return '检查中...'
    case 'Downloading': return `下载中... ${Math.round(updateStatus.value.progress || 0)}%`
    case 'Installing': return '安装中...'
    case 'Completed': return '完成'
    case 'Failed': return `失败: ${updateStatus.value.message}`
    default: return '处理中...'
  }
}

const getUpdateButtonText = () => {
  if (!updateInfo.value?.update_type) return '开始更新'
  if (updateInfo.value.update_type.type === 'Hotfix') {
    return '应用热更新'
  } else {
    return '下载更新'
  }
}

// 监听更新事件
let unlistenUpdateStatus = null

onMounted(async () => {
  try {
    // 获取当前版本
    currentVersion.value = await invoke('get_current_version')

    // 加载配置
    const config = await invoke('get_update_config')
    Object.assign(updateConfig, config)

    // 监听更新状态
    unlistenUpdateStatus = await listen('update-status', (event) => {
      updateStatus.value = event.payload

      if (event.payload.type === 'Completed') {
        updating.value = false
        showMessage('更新完成！请重启应用', 'success')
      } else if (event.payload.type === 'Failed') {
        updating.value = false
        showMessage(`更新失败: ${event.payload.message}`, 'error')
      }
    })

    // 监听可用更新
    const unlistenUpdateAvailable = await listen('update-available', (event) => {
      updateInfo.value = event.payload
      showUpdateModal.value = true
    })

    // 清理函数
    onUnmounted(() => {
      if (unlistenUpdateStatus) unlistenUpdateStatus()
      if (unlistenUpdateAvailable) unlistenUpdateAvailable()
    })
  } catch (error) {
    console.error('Failed to initialize update manager:', error)
  }
})
</script>