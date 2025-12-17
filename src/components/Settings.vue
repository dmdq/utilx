<template>
  <div class="settings-container">
    <n-tabs type="line" animated>
      <!-- 常规设置 -->
      <n-tab-pane name="general" tab="常规设置">
        <div class="settings-section">
          <n-form :model="userSettings" label-placement="left" :label-width="120">
            <n-form-item label="主题">
              <n-select
                v-model:value="userSettings.theme"
                :options="[
                  { label: '自动', value: 'auto' },
                  { label: '亮色', value: 'light' },
                  { label: '暗色', value: 'dark' }
                ]"
              />
            </n-form-item>

            <n-form-item label="语言">
              <n-select
                v-model:value="userSettings.language"
                :options="[
                  { label: '简体中文', value: 'zh-CN' },
                  { label: 'English', value: 'en-US' }
                ]"
              />
            </n-form-item>

            <n-form-item label="开机启动">
              <n-switch v-model:value="userSettings.auto_start" />
            </n-form-item>

            <n-form-item label="最小化到托盘">
              <n-switch v-model:value="userSettings.minimize_to_tray" />
            </n-form-item>

            <n-form-item label="显示通知">
              <n-switch v-model:value="userSettings.show_notifications" />
            </n-form-item>

            <n-divider />

            <n-form-item label="记住窗口大小">
              <n-switch v-model:value="userSettings.window_settings.remember_size" />
            </n-form-item>

            <n-form-item label="记住窗口位置">
              <n-switch v-model:value="userSettings.window_settings.remember_position" />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>

      <!-- 更新设置 -->
      <n-tab-pane name="update" tab="更新设置">
        <div class="settings-section">
          <n-form :model="updateConfig" label-placement="left" :label-width="140">
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

          <n-divider style="margin: 24px 0" />

          <div class="update-actions">
            <n-button @click="checkForUpdates" type="primary">
              <template #icon>
                <n-icon><Download /></n-icon>
              </template>
              检查更新
            </n-button>

            <n-button @click="viewUpdateHistory">
              <template #icon>
                <n-icon><History /></n-icon>
              </template>
              更新历史
            </n-button>
          </div>
        </div>
      </n-tab-pane>

      <!-- 工具设置 -->
      <n-tab-pane name="tools" tab="工具设置">
        <div class="settings-section">
          <n-form :model="toolsConfig" label-placement="left" :label-width="140">
            <!-- 端口检查器 -->
            <n-collapse>
              <n-collapse-item title="端口检查器" name="port-checker">
                <n-form-item label="默认端口">
                  <n-dynamic-tags
                    v-model:value="toolsConfig.port_checker.default_ports"
                    :max="10"
                  />
                </n-form-item>

                <n-form-item label="超时时间">
                  <n-input-number
                    v-model:value="toolsConfig.port_checker.timeout"
                    :min="1000"
                    :max="30000"
                    :step="1000"
                  />
                  <span style="margin-left: 8px">毫秒</span>
                </n-form-item>
              </n-collapse-item>

              <!-- WHOIS 查询 -->
              <n-collapse-item title="WHOIS 查询" name="whois">
                <n-form-item label="默认服务器">
                  <n-dynamic-tags
                    v-model:value="toolsConfig.whois_lookup.default_servers"
                    :max="5"
                  />
                </n-form-item>

                <n-form-item label="超时时间">
                  <n-input-number
                    v-model:value="toolsConfig.whois_lookup.timeout"
                    :min="5000"
                    :max="60000"
                    :step="1000"
                  />
                  <span style="margin-left: 8px">毫秒</span>
                </n-form-item>
              </n-collapse-item>

              <!-- 二维码生成器 -->
              <n-collapse-item title="二维码生成器" name="qr-code">
                <n-form-item label="默认尺寸">
                  <n-slider
                    v-model:value="toolsConfig.qr_code.default_size"
                    :min="100"
                    :max="500"
                    :step="10"
                  />
                  <span style="margin-left: 8px">{{ toolsConfig.qr_code.default_size }}px</span>
                </n-form-item>

                <n-form-item label="纠错级别">
                  <n-select
                    v-model:value="toolsConfig.qr_code.error_correction"
                    :options="[
                      { label: '低 (L)', value: 'L' },
                      { label: '中 (M)', value: 'M' },
                      { label: '高 (Q)', value: 'Q' },
                      { label: '最高 (H)', value: 'H' }
                    ]"
                  />
                </n-form-item>

                <n-form-item label="默认格式">
                  <n-select
                    v-model:value="toolsConfig.qr_code.default_format"
                    :options="[
                      { label: 'PNG', value: 'png' },
                      { label: 'JPEG', value: 'jpeg' },
                      { label: 'SVG', value: 'svg' }
                    ]"
                  />
                </n-form-item>
              </n-collapse-item>
            </n-collapse>
          </n-form>
        </div>
      </n-tab-pane>

      <!-- 配置管理 -->
      <n-tab-pane name="config" tab="配置管理">
        <div class="settings-section">
          <n-space vertical size="large">
            <!-- 配置备份 -->
            <n-card title="配置备份" size="small">
              <template #header-extra>
                <n-button @click="createBackup" size="small">
                  <template #icon>
                    <n-icon><Save /></n-icon>
                  </template>
                  创建备份
                </n-button>
              </template>

              <div v-if="configBackups.length > 0">
                <n-list>
                  <n-list-item v-for="backup in configBackups" :key="backup">
                    <n-thing>
                      <template #header>{{ backup }}</template>
                      <template #action>
                        <n-space>
                          <n-button @click="restoreBackup(backup)" size="small" type="primary">
                            恢复
                          </n-button>
                          <n-button @click="deleteBackup(backup)" size="small" type="error">
                            删除
                          </n-button>
                        </n-space>
                      </template>
                    </n-thing>
                  </n-list-item>
                </n-list>
              </div>
              <n-empty v-else description="暂无备份" />
            </n-card>

            <!-- 配置导入导出 -->
            <n-card title="配置导入导出" size="small">
              <n-space>
                <n-button @click="exportConfig" type="primary">
                  <template #icon>
                    <n-icon><Upload /></n-icon>
                  </template>
                  导出配置
                </n-button>

                <n-button @click="importConfig" type="success">
                  <template #icon>
                    <n-icon><Download /></n-icon>
                  </template>
                  导入配置
                </n-button>

                <n-button @click="resetConfig" type="error">
                  <template #icon>
                    <n-icon><RefreshCw /></n-icon>
                  </template>
                  重置配置
                </n-button>
              </n-space>
            </n-card>

            <!-- 缓存管理 -->
            <n-card title="缓存管理" size="small">
              <n-space>
                <n-button @click="clearCache" type="warning">
                  <template #icon>
                    <n-icon><Trash2 /></n-icon>
                  </template>
                  清理缓存
                </n-button>

                <n-button @click="openConfigDir">
                  <template #icon>
                    <n-icon><Folder /></n-icon>
                  </template>
                  打开配置目录
                </n-button>
              </n-space>
            </n-card>
          </n-space>
        </div>
      </n-tab-pane>

      <!-- 关于 -->
      <n-tab-pane name="about" tab="关于">
        <div class="settings-section">
          <n-space vertical align="center" size="large">
            <div class="app-info">
              <img src="/icon.png" alt="Logo" style="width: 64px; height: 64px" />
              <h2>有条工具</h2>
              <p>开发者效率工具箱</p>
            </div>

            <n-descriptions :column="1" size="small">
              <n-descriptions-item label="版本">
                {{ appInfo.version }}
              </n-descriptions-item>
              <n-descriptions-item label="构建时间">
                {{ appInfo.build_time }}
              </n-descriptions-item>
              <n-descriptions-item label="Git 提交">
                {{ appInfo.git_commit }}
              </n-descriptions-item>
              <n-descriptions-item label="Rust 版本">
                {{ appInfo.rust_version }}
              </n-descriptions-item>
            </n-descriptions>

            <n-space>
              <n-button @click="openWebsite" type="primary">
                官方网站
              </n-button>
              <n-button @click="openGitHub">
                GitHub
              </n-button>
              <n-button @click="checkForUpdates" type="success">
                <template #icon>
                  <n-icon><Download /></n-icon>
                </template>
                检查更新
              </n-button>
            </n-space>
          </n-space>
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- 底部操作按钮 -->
    <div class="settings-footer">
      <n-space>
        <n-button @click="saveSettings" type="primary" :loading="saving">
          保存设置
        </n-button>
        <n-button @click="resetSettings">
          重置设置
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import {
  NTabs, NTabPane, NForm, NFormItem, NSelect, NSwitch, NInputNumber,
  NDivider, NButton, NIcon, NDynamicTags, NSlider, NCollapse,
  NCollapseItem, NSpace, NCard, NList, NListItem, NThing,
  NDescriptions, NDescriptionsItem, NEmpty, useMessage, useDialog
} from 'naive-ui'
import {
  Download, History, Save, Upload, RefreshCw, Trash2, Folder
} from 'lucide-vue-next'

const message = useMessage()
const dialog = useDialog()

// 响应式数据
const saving = ref(false)
const configBackups = ref([])

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
    message.error(`加载设置失败: ${error}`)
  }
}

// 保存设置
const saveSettings = async () => {
  saving.value = true
  try {
    await invoke('save_user_settings', { settings: userSettings })
    await invoke('update_update_config', { config: updateConfig })
    await invoke('save_tools_config', { config: toolsConfig })

    message.success('设置保存成功')
  } catch (error) {
    message.error(`保存设置失败: ${error}`)
  } finally {
    saving.value = false
  }
}

// 重置设置
const resetSettings = async () => {
  dialog.warning({
    title: '确认重置',
    content: '确定要重置所有设置到默认值吗？此操作无法撤销。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await invoke('reset_config')
        await loadSettings()
        message.success('设置已重置')
      } catch (error) {
        message.error(`重置设置失败: ${error}`)
      }
    }
  })
}

// 创建备份
const createBackup = async () => {
  try {
    await invoke('backup_config')
    configBackups.value = await invoke('list_config_backups')
    message.success('备份创建成功')
  } catch (error) {
    message.error(`创建备份失败: ${error}`)
  }
}

// 恢复备份
const restoreBackup = (backup) => {
  dialog.warning({
    title: '确认恢复',
    content: `确定要恢复备份 "${backup}" 吗？这将覆盖当前设置。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await invoke('restore_config_backup', { backupName: backup })
        await loadSettings()
        message.success('备份恢复成功')
      } catch (error) {
        message.error(`恢复备份失败: ${error}`)
      }
    }
  })
}

// 删除备份
const deleteBackup = (backup) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除备份 "${backup}" 吗？此操作无法撤销。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      // 这里需要实现删除备份的逻辑
      message.success('备份已删除')
    }
  })
}

// 导出配置
const exportConfig = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const exportPath = `util-config-backup-${timestamp}.json`
    await invoke('export_config', { exportPath })
    message.success('配置导出成功')
  } catch (error) {
    message.error(`导出配置失败: ${error}`)
  }
}

// 导入配置
const importConfig = async () => {
  try {
    // 这里需要实现文件选择对话框
    message.info('请在对话框中选择要导入的配置文件')
  } catch (error) {
    message.error(`导入配置失败: ${error}`)
  }
}

// 清理缓存
const clearCache = async () => {
  try {
    await invoke('clear_cache')
    message.success('缓存清理成功')
  } catch (error) {
    message.error(`清理缓存失败: ${error}`)
  }
}

// 打开配置目录
const openConfigDir = async () => {
  try {
    await invoke('open_config_dir')
  } catch (error) {
    message.error(`打开配置目录失败: ${error}`)
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
  height: 100%;
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
  border-top: 1px solid var(--n-border-color);
  background-color: var(--n-card-color);
}

.app-info {
  text-align: center;
}

.app-info h2 {
  margin: 16px 0 8px 0;
  color: var(--n-text-color);
}

.app-info p {
  margin: 0;
  color: var(--n-text-color-3);
}

.update-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>