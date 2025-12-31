<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-4 mb-4">
        <div class="p-3 bg-primary/10 rounded-lg">
          <Globe class="h-8 w-8 text-primary" />
        </div>
        <h1 class="text-3xl font-bold text-foreground">GoDaddy 域名解析管理工具</h1>
      </div>
      <p class="text-muted-foreground">
        在线管理 GoDaddy 域名的 DNS 解析记录，支持添加、修改、删除 A、AAAA、CNAME、MX、TXT 等记录类型。所有操作直接通过 GoDaddy API 完成，无需登录控制面板。
      </p>
    </div>

    <!-- CORS 警告提示 -->
    <div class="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <div class="flex items-start gap-3">
        <Info class="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div class="flex-1">
          <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-1">关于 API 调用方式</h3>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            本工具直接在浏览器中调用 GoDaddy API，每个请求会自动生成对应的 curl 命令并输出到浏览器控制台。
            如果遇到 CORS 跨域限制，您可以复制控制台中的 curl 命令在终端中执行。
          </p>
        </div>
      </div>
    </div>

    <!-- 警告提示 -->
    <div class="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div class="flex-1">
          <h3 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">安全提示</h3>
          <p class="text-sm text-yellow-700 dark:text-yellow-300">
            您的 API Key 和 Secret 将仅在浏览器本地使用，直接发送至 GoDaddy 官方 API，不会存储在任何服务器上。
            请妥善保管您的 API 凭证，不要在公共场合分享。
          </p>
        </div>
      </div>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- 左侧配置面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- API 配置 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Settings class="h-5 w-5 mr-2 text-primary" />
            API 配置
          </h2>

          <div class="space-y-4">
            <!-- 域名输入 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                域名 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="config.domain"
                type="text"
                placeholder="example.com"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <!-- API Key -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                API Key <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="config.apiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  placeholder="your API key"
                  class="w-full px-4 py-2 pr-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  @click="showApiKey = !showApiKey"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye v-if="!showApiKey" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- API Secret -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                API Secret <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="config.apiSecret"
                  :type="showApiSecret ? 'text' : 'password'"
                  placeholder="your API secret"
                  class="w-full px-4 py-2 pr-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  @click="showApiSecret = !showApiSecret"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye v-if="!showApiSecret" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- 连接测试按钮 -->
            <button
              @click="testConnection"
              :disabled="loading.test || !isConfigValid"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading.test" class="h-4 w-4 animate-spin" />
              {{ loading.test ? '测试中...' : '测试连接' }}
            </button>

            <!-- 获取记录按钮 -->
            <button
              @click="fetchRecords"
              :disabled="loading.fetch || !isConfigValid"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw v-if="loading.fetch" class="h-4 w-4 animate-spin" />
              {{ loading.fetch ? '获取中...' : '获取解析记录' }}
            </button>
          </div>
        </div>

        <!-- 添加记录 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Plus class="h-5 w-5 mr-2 text-primary" />
            添加解析记录
          </h2>

          <div class="space-y-3">
            <!-- 记录类型 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">记录类型</label>
              <select
                v-model="newRecord.type"
                class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="A">A (IPv4地址)</option>
                <option value="AAAA">AAAA (IPv6地址)</option>
                <option value="CNAME">CNAME (别名)</option>
                <option value="MX">MX (邮件)</option>
                <option value="TXT">TXT (文本)</option>
                <option value="NS">NS (域名服务器)</option>
                <option value="SRV">SRV (服务)</option>
              </select>
            </div>

            <!-- 主机记录 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">主机记录</label>
              <input
                v-model="newRecord.name"
                type="text"
                placeholder="@ 或子域名"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p class="text-xs text-muted-foreground mt-1">使用 @ 表示根域名</p>
            </div>

            <!-- 记录值 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">记录值</label>
              <input
                v-model="newRecord.data"
                type="text"
                placeholder="例如: 192.168.1.1"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <!-- TTL -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">TTL (秒)</label>
              <select
                v-model="newRecord.ttl"
                class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option :value="600">10分钟 (600)</option>
                <option :value="1800">30分钟 (1800)</option>
                <option :value="3600">1小时 (3600)</option>
                <option :value="14400">4小时 (14400)</option>
                <option :value="86400">1天 (86400)</option>
                <option :value="604800">1周 (604800)</option>
              </select>
            </div>

            <!-- 优先级 (仅MX/SRV) -->
            <div v-if="['MX', 'SRV'].includes(newRecord.type)">
              <label class="block text-sm font-medium text-foreground mb-2">优先级</label>
              <input
                v-model.number="newRecord.priority"
                type="number"
                min="0"
                max="65535"
                placeholder="10"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <!-- 端口 (仅SRV) -->
            <div v-if="newRecord.type === 'SRV'">
              <label class="block text-sm font-medium text-foreground mb-2">端口</label>
              <input
                v-model.number="newRecord.port"
                type="number"
                min="0"
                max="65535"
                placeholder="443"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <!-- 协议 (仅SRV) -->
            <div v-if="newRecord.type === 'SRV'">
              <label class="block text-sm font-medium text-foreground mb-2">协议</label>
              <input
                v-model="newRecord.protocol"
                type="text"
                placeholder="_tcp"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <!-- 服务 (仅SRV) -->
            <div v-if="newRecord.type === 'SRV'">
              <label class="block text-sm font-medium text-foreground mb-2">服务</label>
              <input
                v-model="newRecord.service"
                type="text"
                placeholder="_https"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <!-- 权重 (仅SRV) -->
            <div v-if="newRecord.type === 'SRV'">
              <label class="block text-sm font-medium text-foreground mb-2">权重</label>
              <input
                v-model.number="newRecord.weight"
                type="number"
                min="0"
                max="65535"
                placeholder="5"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              @click="addRecord"
              :disabled="loading.add || !isConfigValid || !isNewRecordValid"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading.add" class="h-4 w-4 animate-spin" />
              {{ loading.add ? '添加中...' : '添加记录' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧记录列表 -->
      <div class="lg:col-span-3 space-y-6">
        <!-- 状态消息 -->
        <div v-if="message.show" :class="[
          'p-4 rounded-lg border flex items-start gap-3',
          message.type === 'success' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
        ]">
          <CheckCircle v-if="message.type === 'success'" class="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <XCircle v-else class="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div class="flex-1">
            <p :class="[
              'text-sm font-medium',
              message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            ]">
              {{ message.text }}
            </p>
          </div>
          <button @click="message.show = false" class="text-current opacity-70 hover:opacity-100">
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="!records.length && !loading.fetch" class="bg-card border border-border rounded-lg p-12 text-center">
          <Globe class="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-foreground mb-2">暂无解析记录</h3>
          <p class="text-muted-foreground mb-4">
            请先配置 API 信息并获取解析记录
          </p>
        </div>

        <!-- 记录列表 -->
        <div v-if="records.length > 0" class="bg-card border border-border rounded-lg">
          <div class="p-6 border-b border-border">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-foreground flex items-center">
                <List class="h-5 w-5 mr-2 text-primary" />
                DNS 解析记录
                <span class="ml-2 text-sm font-normal text-muted-foreground">({{ records.length }} 条)</span>
              </h2>
              <button
                @click="fetchRecords"
                :disabled="loading.fetch"
                class="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
              >
                <RefreshCw :class="['h-4 w-4', loading.fetch ? 'animate-spin' : '']" />
                刷新
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-muted/50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">类型</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">主机记录</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">记录值</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">TTL</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">附加</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="(record, index) in records"
                  :key="index"
                  :class="['hover:bg-muted/30 transition-colors', editingIndex === index ? 'bg-primary/5' : '']"
                >
                  <!-- 编辑模式 -->
                  <template v-if="editingIndex === index">
                    <td colspan="6" class="px-6 py-4">
                      <div class="space-y-4">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <!-- 记录类型 -->
                          <div>
                            <label class="block text-xs text-muted-foreground mb-1">类型</label>
                            <select
                              v-model="editRecord.type"
                              class="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                            >
                              <option value="A">A</option>
                              <option value="AAAA">AAAA</option>
                              <option value="CNAME">CNAME</option>
                              <option value="MX">MX</option>
                              <option value="TXT">TXT</option>
                              <option value="NS">NS</option>
                              <option value="SRV">SRV</option>
                            </select>
                          </div>

                          <!-- 主机记录 -->
                          <div>
                            <label class="block text-xs text-muted-foreground mb-1">主机记录</label>
                            <input
                              v-model="editRecord.name"
                              type="text"
                              class="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                            />
                          </div>

                          <!-- 记录值 -->
                          <div>
                            <label class="block text-xs text-muted-foreground mb-1">记录值</label>
                            <input
                              v-model="editRecord.data"
                              type="text"
                              class="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                            />
                          </div>

                          <!-- TTL -->
                          <div>
                            <label class="block text-xs text-muted-foreground mb-1">TTL</label>
                            <select
                              v-model="editRecord.ttl"
                              class="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                            >
                              <option :value="600">600</option>
                              <option :value="1800">1800</option>
                              <option :value="3600">3600</option>
                              <option :value="14400">14400</option>
                              <option :value="86400">86400</option>
                              <option :value="604800">604800</option>
                            </select>
                          </div>
                        </div>

                        <!-- MX/SRV 优先级 -->
                        <div v-if="['MX', 'SRV'].includes(editRecord.type)" class="grid grid-cols-2 gap-4">
                          <div>
                            <label class="block text-xs text-muted-foreground mb-1">优先级</label>
                            <input
                              v-model.number="editRecord.priority"
                              type="number"
                              min="0"
                              class="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                            />
                          </div>
                        </div>

                        <!-- SRV 特殊字段 -->
                        <div v-if="editRecord.type === 'SRV'" class="grid grid-cols-4 gap-4">
                          <div>
                            <label class="block text-xs text-muted-foreground mb-1">端口</label>
                            <input
                              v-model.number="editRecord.port"
                              type="number"
                              min="0"
                              class="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label class="block text-xs text-muted-foreground mb-1">权重</label>
                            <input
                              v-model.number="editRecord.weight"
                              type="number"
                              min="0"
                              class="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                            />
                          </div>
                        </div>

                        <!-- 操作按钮 -->
                        <div class="flex items-center justify-end gap-3 pt-2">
                          <button
                            @click="cancelEdit"
                            class="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                          >
                            取消
                          </button>
                          <button
                            @click="saveEdit"
                            :disabled="loading.update"
                            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
                          >
                            <Loader2 v-if="loading.update" class="h-4 w-4 animate-spin" />
                            {{ loading.update ? '保存中...' : '保存' }}
                          </button>
                        </div>
                      </div>
                    </td>
                  </template>

                  <!-- 显示模式 -->
                  <template v-else>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {{ record.type }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <code class="text-sm bg-muted px-2 py-1 rounded">{{ record.name || '@' }}</code>
                    </td>
                    <td class="px-6 py-4">
                      <code class="text-sm text-foreground break-all">{{ record.data }}</code>
                    </td>
                    <td class="px-6 py-4 text-sm text-muted-foreground">
                      {{ formatTTL(record.ttl) }}
                    </td>
                    <td class="px-6 py-4 text-sm text-muted-foreground">
                      <div v-if="record.type === 'MX' || record.type === 'SRV'">
                        优先级: {{ record.priority }}
                      </div>
                      <div v-if="record.type === 'SRV'" class="text-xs">
                        <div>端口: {{ record.port }}</div>
                        <div>权重: {{ record.weight }}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          @click="startEdit(index)"
                          class="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 class="h-4 w-4" />
                        </button>
                        <button
                          @click="deleteRecord(index)"
                          :disabled="loading.delete"
                          class="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading.fetch" class="bg-card border border-border rounded-lg p-12 text-center">
          <Loader2 class="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p class="text-muted-foreground">正在获取解析记录...</p>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-8 bg-card border border-border rounded-lg p-6">
      <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
        <BookOpen class="h-5 w-5 mr-2 text-primary" />
        使用说明
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium text-foreground mb-2">如何获取 GoDaddy API Key？</h3>
          <ol class="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>登录 GoDaddy 开发者中心 (developer.godaddy.com)</li>
            <li>进入 API Keys 页面</li>
            <li>创建新的 API Key 和 Secret</li>
            <li>选择所需的权限（至少需要 DNS 管理权限）</li>
            <li>复制 Key 和 Secret 到本工具</li>
          </ol>
        </div>
        <div>
          <h3 class="font-medium text-foreground mb-2">注意事项</h3>
          <ul class="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>修改 DNS 记录后，全球生效时间通常为 10 分钟至 48 小时</li>
            <li>TTL 值越小，DNS 更新生效越快，但查询服务器负载越高</li>
            <li>CNAME 记录不能与其他记录同时存在</li>
            <li>MX 记录的优先级数字越小，优先级越高</li>
            <li>建议在修改前备份现有 DNS 记录</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useHead } from '#imports'
import {
  Globe, Settings, Plus, RefreshCw, Loader2, AlertTriangle, CheckCircle, XCircle,
  List, Edit2, Trash2, X, BookOpen, Info, Eye, EyeOff
} from 'lucide-vue-next'

// SEO 设置
useHead({
  title: 'GoDaddy DNS管理工具 - 在线管理域名DNS解析记录',
  meta: [
    {
      name: 'description',
      content: '免费在线GoDaddy域名DNS管理工具，支持添加、修改、删除A、AAAA、CNAME、MX、TXT、NS、SRV等DNS解析记录。直接通过GoDaddy API操作，无需登录控制面板。'
    },
    {
      name: 'keywords',
      content: 'GoDaddy,DNS管理,域名解析,DNS记录,A记录,CNAME,MX记录,在线工具,免费'
    }
  ]
})

// 生成 curl 命令
const generateCurlCommand = (method: string, url: string, headers: Record<string, string>, data?: any): string => {
  let curl = `curl -X ${method} '${url}' \\\n`

  // 添加 headers
  for (const [key, value] of Object.entries(headers)) {
    curl += `  -H '${key}: ${value}' \\\n`
  }

  // 添加 body (如果有)
  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    const bodyStr = JSON.stringify(data)
    curl += `  -d '${bodyStr}'`
  } else {
    // 移除最后的 \\\n
    curl = curl.slice(0, -3)
  }

  return curl
}

// GoDaddy API 请求 - 客户端直接调用，输出 curl 命令
const callGoDaddyAPI = async (method: string, endpoint: string, data?: any) => {
  const apiUrl = `https://api.godaddy.com/v1${endpoint}`

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `sso-key ${config.apiKey}:${config.apiSecret}`
  }

  // 生成并输出 curl 命令到控制台
  const curlCommand = generateCurlCommand(method, apiUrl, headers, data)
  console.log('%c=== GoDaddy API 请求 ===', 'color: #6366f1; font-weight: bold; font-size: 14px;')
  console.log('%cURL:', 'color: #10b981; font-weight: bold;', curlCommand)
  console.log('%c方法:', 'color: #f59e0b; font-weight: bold;', method)
  console.log('%c端点:', 'color: #f59e0b; font-weight: bold;', endpoint)
  if (data) {
    console.log('%c数据:', 'color: #f59e0b; font-weight: bold;', JSON.stringify(data, null, 2))
  }
  console.log('='.repeat(50))

  try {
    const response = await $fetch.raw(apiUrl, {
      method: method as RequestInit['method'] || 'GET',
      headers,
      body: data ? JSON.stringify(data) : undefined
    }) as any

    console.log('%c=== 响应成功 ===', 'color: #10b981; font-weight: bold;', {
      status: response.status,
      data: response._data
    })

    return {
      ok: response.status >= 200 && response.status < 300,
      data: response._data,
      status: response.status
    }
  } catch (error: any) {
    console.error('%c=== 请求失败 ===', 'color: #ef4444; font-weight: bold;', error)

    // CORS 错误提示
    if (error.message?.includes('CORS') || error.message?.includes('fetch failed')) {
      console.warn('%c注意: 由于浏览器 CORS 限制，直接请求可能失败。您可以使用上面的 curl 命令在终端中测试。', 'color: #f59e0b; font-size: 12px;')
    }

    return {
      ok: false,
      error: error.message || '网络错误'
    }
  }
}

// 配置状态 - 使用 reactive 对象
const config = reactive({
  domain: '',
  apiKey: '',
  apiSecret: ''
})

// 记录列表
const records = ref<any[]>([])

// 新记录模板
const newRecord = ref({
  type: 'A',
  name: '',
  data: '',
  ttl: 600,
  priority: 10,
  port: 443,
  protocol: '_tcp',
  service: '',
  weight: 5
})

// 编辑记录
const editingIndex = ref<number | null>(null)
const editRecord = ref<any>({})

// 加载状态
const loading = ref({
  test: false,
  fetch: false,
  add: false,
  update: false,
  delete: false
})

// 消息提示
const message = ref({
  show: false,
  type: 'success' as 'success' | 'error',
  text: ''
})

// 是否显示高级选项
const showAdvanced = ref(false)

// 密码可见性状态
const showApiKey = ref(false)
const showApiSecret = ref(false)

// 计算属性
const isConfigValid = computed(() => {
  return config.domain.trim().length > 0 &&
         config.apiKey.trim().length > 0 &&
         config.apiSecret.trim().length > 0
})

const isNewRecordValid = computed(() => {
  return newRecord.value.type &&
         newRecord.value.data &&
         (newRecord.value.type === 'CNAME' || newRecord.value.name !== '')
})

// 显示消息
const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { show: true, type, text }
  setTimeout(() => {
    message.value.show = false
  }, 5000)
}

// 格式化 TTL
const formatTTL = (ttl: number) => {
  const hours = Math.floor(ttl / 3600)
  const minutes = Math.floor((ttl % 3600) / 60)
  if (hours >= 24) {
    return `${Math.floor(hours / 24)}天`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return `${minutes}分钟`
  }
}

// 测试连接
const testConnection = async () => {
  loading.value.test = true
  try {
    const result = await callGoDaddyAPI('GET', `/domains/${config.domain}/records?type=A&limit=1`)

    if (result.ok) {
      showMessage('success', '连接成功！API 凭证有效')
    } else {
      showMessage('error', `连接失败: ${result.error || '请检查域名和API凭证'}`)
    }
  } catch (error: any) {
    showMessage('error', `网络错误: ${error.message}`)
  } finally {
    loading.value.test = false
  }
}

// 获取所有 DNS 记录
const fetchRecords = async () => {
  loading.value.fetch = true
  try {
    const result = await callGoDaddyAPI('GET', `/domains/${config.domain}/records`)

    if (result.ok) {
      records.value = result.data || []
      showMessage('success', `成功获取 ${result.data?.length || 0} 条解析记录`)
    } else {
      showMessage('error', `获取失败: ${result.error || '请检查域名和API凭证'}`)
    }
  } catch (error: any) {
    showMessage('error', `网络错误: ${error.message}`)
  } finally {
    loading.value.fetch = false
  }
}

// 添加记录
const addRecord = async () => {
  loading.value.add = true
  try {
    // 构建请求数据
    const recordData: any = {
      type: newRecord.value.type,
      name: newRecord.value.name || '@',
      data: newRecord.value.data,
      ttl: newRecord.value.ttl
    }

    // MX 和 SRV 记录的额外字段
    if (newRecord.value.type === 'MX') {
      recordData.priority = newRecord.value.priority
    } else if (newRecord.value.type === 'SRV') {
      recordData.priority = newRecord.value.priority
      recordData.weight = newRecord.value.weight
      recordData.port = newRecord.value.port
      recordData.protocol = newRecord.value.protocol
      recordData.service = newRecord.value.service
    }

    const result = await callGoDaddyAPI('POST', `/domains/${config.domain}/records`, [recordData])

    if (result.ok) {
      showMessage('success', 'DNS 记录添加成功')
      // 重置表单
      newRecord.value = {
        type: 'A',
        name: '',
        data: '',
        ttl: 600,
        priority: 10,
        port: 443,
        protocol: '_tcp',
        service: '',
        weight: 5
      }
      // 刷新记录列表
      await fetchRecords()
    } else {
      showMessage('error', `添加失败: ${result.error || '未知错误'}`)
    }
  } catch (error: any) {
    showMessage('error', `网络错误: ${error.message}`)
  } finally {
    loading.value.add = false
  }
}

// 开始编辑
const startEdit = (index: number) => {
  editingIndex.value = index
  editRecord.value = { ...records.value[index] }
}

// 取消编辑
const cancelEdit = () => {
  editingIndex.value = null
  editRecord.value = {}
}

// 保存编辑
const saveEdit = async () => {
  if (editingIndex.value === null) return

  loading.value.update = true
  try {
    const originalRecord = records.value[editingIndex.value]
    const recordData: any = {
      type: editRecord.value.type,
      name: editRecord.value.name || '@',
      data: editRecord.value.data,
      ttl: editRecord.value.ttl
    }

    // MX 和 SRV 记录的额外字段
    if (editRecord.value.type === 'MX') {
      recordData.priority = editRecord.value.priority
    } else if (editRecord.value.type === 'SRV') {
      recordData.priority = editRecord.value.priority
      recordData.weight = editRecord.value.weight
      recordData.port = editRecord.value.port
      recordData.protocol = editRecord.value.protocol
      recordData.service = editRecord.value.service
    }

    const result = await callGoDaddyAPI(
      'PUT',
      `/domains/${config.domain}/records/${originalRecord.type}/${originalRecord.name}`,
      recordData
    )

    if (result.ok) {
      showMessage('success', 'DNS 记录更新成功')
      editingIndex.value = null
      editRecord.value = {}
      // 刷新记录列表
      await fetchRecords()
    } else {
      showMessage('error', `更新失败: ${result.error || '未知错误'}`)
    }
  } catch (error: any) {
    showMessage('error', `网络错误: ${error.message}`)
  } finally {
    loading.value.update = false
  }
}

// 删除记录
const deleteRecord = async (index: number) => {
  const record = records.value[index]

  if (!confirm(`确定要删除这条 ${record.type} 记录吗？\n主机记录: ${record.name || '@'}\n记录值: ${record.data}`)) {
    return
  }

  loading.value.delete = true
  try {
    const result = await callGoDaddyAPI(
      'DELETE',
      `/domains/${config.domain}/records/${record.type}/${record.name}`
    )

    if (result.ok) {
      showMessage('success', 'DNS 记录删除成功')
      // 刷新记录列表
      await fetchRecords()
    } else {
      showMessage('error', `删除失败: ${result.error || '未知错误'}`)
    }
  } catch (error: any) {
    showMessage('error', `网络错误: ${error.message}`)
  } finally {
    loading.value.delete = false
  }
}
</script>
