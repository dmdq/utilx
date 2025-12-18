<template>
  <div class="update-manager">
    <!-- 更新检查按钮 -->
    <n-button
      @click="checkForUpdates"
      :loading="checking"
      type="primary"
      size="small"
    >
      <template #icon>
        <n-icon><Download /></n-icon>
      </template>
      检查更新
    </n-button>

    <!-- 更新状态显示 -->
    <n-modal v-model:show="showUpdateModal" :mask-closable="false">
      <n-card
        style="max-width: 600px"
        title="发现新版本"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <template #header-extra>
          <n-button size="small" @click="ignoreUpdate" v-if="updateInfo && !updateInfo.is_force_update">
            忽略此版本
          </n-button>
        </template>

        <div v-if="updateInfo">
          <!-- 版本信息 -->
          <div class="version-info">
            <h3>版本 {{ updateInfo.latest_version }}</h3>
            <p class="release-date">发布时间：{{ formatDate(updateInfo.release_date) }}</p>
          </div>

          <!-- 更新类型 -->
          <div class="update-type" :class="getUpdateTypeClass()">
            <n-tag :type="getUpdateTypeTagType()" size="large">
              {{ getUpdateTypeText() }}
            </n-tag>
          </div>

          <!-- 更新说明 -->
          <div class="release-notes">
            <h4>更新内容：</h4>
            <div class="notes-content" v-html="formatReleaseNotes(updateInfo.release_notes)"></div>
          </div>

          <!-- 强制更新提示 -->
          <n-alert v-if="updateInfo.is_force_update" type="warning" style="margin-bottom: 16px">
            此版本为强制更新，请立即更新以继续使用应用
          </n-alert>
        </div>

        <!-- 更新进度 -->
        <div v-if="updateStatus" class="update-progress">
          <n-progress
            :percentage="getProgressPercentage()"
            :status="getProgressStatus()"
            :indicator-placement="'inside'"
          >
            {{ getProgressText() }}
          </n-progress>
        </div>

        <template #footer>
          <div class="update-actions">
            <n-button
              v-if="!updateStatus"
              @click="startUpdate"
              type="primary"
              :loading="updating"
              size="large"
            >
              {{ getUpdateButtonText() }}
            </n-button>

            <n-button
              v-if="updateStatus && updateStatus.type === 'Downloading'"
              @click="cancelUpdate"
              type="error"
              size="large"
            >
              取消更新
            </n-button>

            <n-button
              v-if="!updateInfo?.is_force_update && !updateStatus"
              @click="showUpdateModal = false"
              size="large"
            >
              稍后更新
            </n-button>

            <n-button
              v-if="updateStatus?.type === 'Completed'"
              @click="restartApp"
              type="success"
              size="large"
            >
              重启应用
            </n-button>
          </div>
        </template>
      </n-card>
    </n-modal>

    <!-- 设置弹窗 -->
    <n-modal v-model:show="showSettingsModal">
      <n-card
        style="max-width: 500px"
        title="更新设置"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <div class="update-settings">
          <n-form :model="updateConfig" label-placement="left" :label-width="120">
            <n-form-item label="自动检查更新">
              <n-switch v-model:value="updateConfig.auto_check_enabled" />
            </n-form-item>

            <n-form-item label="检查间隔">
              <n-input-number
                v-model:value="updateConfig.check_interval_hours"
                :min="1"
                :max="168"
                :disabled="!updateConfig.auto_check_enabled"
              />
              <span style="margin-left: 8px">小时</span>
            </n-form-item>

            <n-form-item label="自动下载热更新">
              <n-switch v-model:value="updateConfig.auto_download_hotfix" />
            </n-form-item>

            <n-form-item label="自动安装热更新">
              <n-switch v-model:value="updateConfig.auto_install_hotfix" />
            </n-form-item>

            <n-form-item label="发布频道">
              <n-select
                v-model:value="updateConfig.release_channel"
                :options="[
                  { label: '稳定版', value: 'stable' },
                  { label: '测试版', value: 'beta' },
                  { label: '开发版', value: 'dev' }
                ]"
              />
            </n-form-item>

            <n-form-item label="更新服务器">
              <n-input
                v-model:value="updateConfig.update_server"
                placeholder="https://updates.util.cn"
              />
            </n-form-item>
          </n-form>

          <div class="settings-actions">
            <n-button @click="saveSettings" type="primary">保存设置</n-button>
            <n-button @click="showSettingsModal = false">取消</n-button>
          </div>
        </div>
      </n-card>
    </n-modal>

    <!-- 更新历史 -->
    <n-modal v-model:show="showHistoryModal">
      <n-card
        style="max-width: 700px; max-height: 500px"
        title="更新历史"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <div class="update-history" style="max-height: 400px; overflow-y: auto;">
          <n-timeline v-if="updateHistory.length > 0">
            <n-timeline-item
              v-for="history in updateHistory"
              :key="history.version"
              :type="history.success ? 'success' : 'error'"
              :title="`版本 ${history.version}`"
              :content="formatHistoryItem(history)"
              :time="formatDate(history.installed_at)"
            />
          </n-timeline>

          <n-empty v-else description="暂无更新历史" />
        </div>

        <template #footer>
          <div class="history-actions">
            <n-button @click="clearHistory" type="error">清空历史</n-button>
            <n-button @click="showHistoryModal = false">关闭</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>

    <!-- 设置按钮 -->
    <n-button @click="showSettingsModal = true" size="small" quaternary>
      <template #icon>
        <n-icon><Settings /></n-icon>
      </template>
    </n-button>

    <!-- 历史按钮 -->
    <n-button @click="loadHistory" size="small" quaternary>
      <template #icon>
        <n-icon><History /></n-icon>
      </template>
    </n-button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import {
  NButton, NIcon, NModal, NCard, NTag, NAlert, NProgress,
  NForm, NFormItem, NSwitch, NInputNumber, NSelect, NInput,
  NTimeline, NTimelineItem, NEmpty, useMessage
} from 'naive-ui'
import { Download, Settings, History } from 'lucide-vue-next'

const message = useMessage()

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
      message.success('当前已是最新版本')
    }
  } catch (error) {
    message.error(`检查更新失败: ${error}`)
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
    message.error(`更新失败: ${error}`)
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
    message.success('已忽略此版本')
    showUpdateModal.value = false
  } catch (error) {
    message.error(`忽略版本失败: ${error}`)
  }
}

// 取消更新
const cancelUpdate = async () => {
  try {
    await invoke('cancel_update')
    message.success('已取消更新')
    updating.value = false
    updateStatus.value = null
  } catch (error) {
    message.error(`取消更新失败: ${error}`)
  }
}

// 重启应用
const restartApp = async () => {
  try {
    await invoke('restart_app')
  } catch (error) {
    message.error(`重启失败: ${error}`)
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    await invoke('update_update_config', {
      config: updateConfig
    })
    message.success('设置已保存')
    showSettingsModal.value = false
  } catch (error) {
    message.error(`保存设置失败: ${error}`)
  }
}

// 加载历史
const loadHistory = async () => {
  try {
    const history = await invoke('get_update_history', { limit: 20 })
    updateHistory.value = history
    showHistoryModal.value = true
  } catch (error) {
    message.error(`加载历史失败: ${error}`)
  }
}

// 清空历史
const clearHistory = async () => {
  try {
    await invoke('clear_update_history')
    updateHistory.value = []
    message.success('历史已清空')
  } catch (error) {
    message.error(`清空历史失败: ${error}`)
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

const getUpdateTypeClass = () => {
  if (!updateInfo.value?.update_type) return ''
  return updateInfo.value.update_type.type === 'Hotfix' ? 'hotfix' : 'major'
}

const getUpdateTypeTagType = () => {
  if (!updateInfo.value?.update_type) return 'default'
  return updateInfo.value.update_type.type === 'Hotfix' ? 'info' : 'warning'
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

const getProgressStatus = () => {
  if (!updateStatus.value) return 'default'
  switch (updateStatus.value.type) {
    case 'Downloading': return 'default'
    case 'Installing': return 'warning'
    case 'Completed': return 'success'
    case 'Failed': return 'error'
    default: return 'default'
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
        message.success('更新完成！请重启应用')
      } else if (event.payload.type === 'Failed') {
        updating.value = false
        message.error(`更新失败: ${event.payload.message}`)
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

<style scoped>
.update-manager {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-info h3 {
  margin: 0 0 8px 0;
  color: #18a058;
}

.release-date {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.update-type {
  margin: 16px 0;
}

.hotfix {
  color: #2080f0;
}

.major {
  color: #f0a020;
}

.release-notes {
  margin: 16px 0;
}

.release-notes h4 {
  margin: 0 0 8px 0;
}

.notes-content {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  line-height: 1.6;
}

.update-progress {
  margin: 16px 0;
}

.update-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.update-settings {
  padding: 8px 0;
}

.settings-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

.history-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>