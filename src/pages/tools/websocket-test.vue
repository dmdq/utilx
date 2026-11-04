<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">WebSocket测试工具 - 在线WebSocket连接调试工具</h1>
      <p class="text-muted-foreground">一款专业的在线WebSocket测试工具。支持实时连接测试、消息收发、心跳检测等功能，帮助开发者快速调试WebSocket应用，纯前端实现，数据安全可靠。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧配置面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 连接配置 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings class="h-5 w-5 mr-2 text-primary" />
            连接配置
          </h2>

          <div class="space-y-4">
            <!-- WebSocket URL -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">WebSocket URL</label>
              <input
                v-model="wsUrl"
                type="text"
                placeholder="wss://echo.websocket.org"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                :disabled="isConnected"
              />
            </div>

            <!-- 协议 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">子协议（可选）</label>
              <input
                v-model="protocol"
                type="text"
                placeholder="chat"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                :disabled="isConnected"
              />
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速示例</label>
              <select
                @change="loadExample"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                :disabled="isConnected"
              >
                <option value="">选择示例...</option>
                <option value="echo">WebSocket Echo</option>
                <option value="test">测试服务器</option>
              </select>
            </div>

            <!-- 连接按钮 -->
            <button
              @click="toggleConnection"
              :disabled="!wsUrl || connecting"
              class="w-full py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              :class="isConnected
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed'"
            >
              <Loader2 v-if="connecting" class="h-5 w-5 mr-2 animate-spin" />
              <X v-else-if="isConnected" class="h-5 w-5 mr-2" />
              <Wifi v-else class="h-5 w-5 mr-2" />
              {{ connecting ? '连接中...' : (isConnected ? '断开连接' : '连接') }}
            </button>

            <!-- 连接状态 -->
            <div class="flex items-center justify-between p-3 rounded-lg" :class="getStatusClass()">
              <span class="text-sm font-medium">{{ getStatusText() }}</span>
              <component :is="getStatusIcon()" class="h-5 w-5" />
            </div>
          </div>
        </div>

        <!-- 发送消息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Send class="h-5 w-5 mr-2 text-primary" />
            发送消息
          </h2>

          <div class="space-y-4">
            <!-- 消息类型 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">消息类型</label>
              <select
                v-model="messageType"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="text">文本</option>
                <option value="json">JSON</option>
                <option value="binary">二进制</option>
              </select>
            </div>

            <!-- 消息内容 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">消息内容</label>
              <textarea
                v-model="messageContent"
                :placeholder="getMessagePlaceholder()"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
                rows="4"
              ></textarea>
            </div>

            <!-- 发送按钮 -->
            <button
              @click="sendMessage"
              :disabled="!isConnected || !messageContent"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send class="h-5 w-5 mr-2" />
              发送消息
            </button>

            <!-- 心跳检测 -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">心跳检测</span>
              <button
                @click="sendPing"
                :disabled="!isConnected"
                class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                发送 Ping
              </button>
            </div>
          </div>
        </div>

        <!-- 连接信息 -->
        <div v-if="connectionInfo" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Info class="h-5 w-5 mr-2 text-primary" />
            连接信息
          </h2>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">连接时间:</span>
              <span class="font-medium text-foreground">{{ connectionInfo.connectedAt }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">持续时间:</span>
              <span class="font-medium text-foreground">{{ connectionInfo.duration }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">发送消息:</span>
              <span class="font-medium text-foreground">{{ connectionInfo.messagesSent }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">接收消息:</span>
              <span class="font-medium text-foreground">{{ connectionInfo.messagesReceived }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧消息记录 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 操作按钮 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <MessageSquare class="h-5 w-5 mr-2 text-primary" />
              消息记录
            </h2>
            <div class="flex space-x-2">
              <button
                @click="autoScroll = !autoScroll"
                :class="[
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  autoScroll ? 'bg-primary/10 text-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                <ArrowDown class="h-4 w-4 mr-1" />
                自动滚动
              </button>
              <button
                @click="clearMessages"
                class="px-3 py-1 text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
              >
                <Trash2 class="h-4 w-4 mr-1" />
                清空
              </button>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div ref="messageContainer" class="bg-card border border-border rounded-lg p-6 h-[600px] overflow-y-auto">
          <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Inbox class="h-16 w-16 mb-4" />
            <p class="text-lg">暂无消息</p>
            <p class="text-sm mt-2">连接 WebSocket 后开始发送和接收消息</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="flex items-start space-x-3"
              :class="{ 'flex-row-reverse space-x-reverse': msg.type === 'sent' }"
            >
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="msg.type === 'sent' ? 'bg-primary/10' : 'bg-green-100 dark:bg-green-900/20'">
                  <component :is="msg.type === 'sent' ? Send : Download"
                    class="h-4 w-4"
                    :class="msg.type === 'sent' ? 'text-primary' : 'text-green-600 dark:text-green-400'" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-sm font-medium"
                    :class="msg.type === 'sent' ? 'text-primary' : 'text-green-600 dark:text-green-400'">
                    {{ msg.type === 'sent' ? '发送' : '接收' }}
                  </span>
                  <span class="text-xs text-muted-foreground">{{ formatTime(msg.timestamp) }}</span>
                  <span v-if="msg.messageType" class="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                    {{ msg.messageType.toUpperCase() }}
                  </span>
                </div>
                <div class="p-3 rounded-lg text-sm"
                  :class="msg.type === 'sent' ? 'bg-primary/5 dark:bg-primary/10' : 'bg-green-50 dark:bg-green-900/10'">
                  <pre v-if="msg.messageType === 'json'" class="whitespace-pre-wrap">{{ formatJsonMessage(msg.data) }}</pre>
                  <p v-else class="whitespace-pre-wrap break-all">{{ msg.data }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 WebSocket？
        </h2>
        <p class="text-muted-foreground mb-4">
          WebSocket 是一种在单个TCP连接上进行全双工通信的协议。WebSocket使得客户端和服务器之间的数据交换变得更加简单，
          允许服务端主动向客户端推送数据。在WebSocket API中，浏览器和服务器只需要完成一次握手，
          两者之间就直接可以创建持久性的连接，并进行双向数据传输。
        </p>
        <p class="text-muted-foreground mb-6">
          相较于传统的HTTP轮询方式，WebSocket具有更低的延迟和更高的效率，特别适合需要实时通信的应用场景，
          如在线聊天、实时数据推送、股票行情、在线游戏等。使用WebSocket测试工具可以帮助开发者快速验证WebSocket服务器的功能，
          调试通信问题，确保应用的稳定性和可靠性。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入WebSocket服务器的URL地址（支持ws://和wss://协议）</li>
          <li>可选填子协议，如chat、soap等</li>
          <li>点击"连接"按钮建立WebSocket连接</li>
          <li>连接成功后，可以选择消息类型（文本、JSON、二进制）并发送消息</li>
          <li>实时查看服务器返回的消息和连接状态</li>
          <li>使用心跳检测功能保持连接活跃</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>实时通信</strong>: 支持WebSocket的实时双向通信，立即查看消息收发情况</li>
          <li><strong>多种消息格式</strong>: 支持文本、JSON和二进制消息的发送和接收</li>
          <li><strong>连接状态监控</strong>: 实时显示连接状态、连接时长和消息统计</li>
          <li><strong>心跳检测</strong>: 支持发送Ping帧保持连接活跃，防止连接超时</li>
          <li><strong>消息历史记录</strong>: 保存完整的消息收发记录，支持自动滚动和清空功能</li>
          <li><strong>安全可靠</strong>: 纯前端实现，所有数据在本地处理，确保隐私安全</li>
          <li><strong>快速示例</strong>: 内置常用WebSocket服务器示例，方便快速测试</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">WebSocket 和 HTTP 轮询有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              WebSocket是全双工通信协议，客户端和服务器可以同时发送数据，而HTTP轮询需要客户端不断发起请求。
              WebSocket连接建立后可以持久保持，减少了握手开销，延迟更低，效率更高。
              对于需要频繁通信的应用，WebSocket是更好的选择。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么 WebSocket 连接失败？</h3>
            <p class="text-muted-foreground mt-1">
              可能的原因包括：URL格式错误、服务器不支持WebSocket、防火墙阻止连接、SSL证书问题（对于wss://）等。
              请检查URL是否正确，确保服务器正常运行，如果是wss连接，检查证书是否有效。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何保持 WebSocket 连接活跃？</h3>
            <p class="text-muted-foreground mt-1">
              可以使用心跳检测机制，定期发送Ping帧，服务器会响应Pong帧。
              本工具提供了"发送Ping"按钮，可以手动发送心跳。在实际应用中，建议实现自动心跳机制，
              例如每30秒发送一次心跳，防止连接因超时而断开。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">WebSocket 支持哪些消息类型？</h3>
            <p class="text-muted-foreground mt-1">
              WebSocket协议支持两种消息类型：文本消息和二进制消息。
              文本消息可以包含任何UTF-8编码的文本，如普通字符串、JSON数据等。
              二进制消息可以传输任何二进制数据，如图片、音频、视频、Protocol Buffers等。
              本工具提供了便捷的选项来发送不同类型的消息。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch, computed } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import {
  Settings, Send, Wifi, X, Loader2, Info, MessageSquare,
  ArrowDown, Trash2, Inbox, Download, HelpCircle, ChevronUp,
  Globe, Code, Lock, Shield, Clock, Hash, Terminal,
  FileText, Zap, Radio, Server
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'



// SEO配置
useSeoMeta({
  title: 'WebSocket测试工具 - 在线WebSocket连接调试工具',
  meta: [
    { name: 'description', content: '专业的在线WebSocket测试工具，支持实时连接测试、消息收发、心跳检测等功能，帮助开发者快速调试WebSocket应用，纯前端实现，数据安全可靠。' },
    { name: 'keywords', content: 'WebSocket测试,WebSocket客户端,实时通信,WebSocket调试,WSS,WS,在线工具' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'websocket-test')
const category = categories.find(c => c.id === 'network')

// 响应式数据
const wsUrl = ref('wss://echo.websocket.org')
const protocol = ref('')
const messageType = ref('text')
const messageContent = ref('')
const isConnected = ref(false)
const connecting = ref(false)
const autoScroll = ref(true)
const messages = ref([])
const connectionInfo = ref(null)
const ws = ref(null)
const messageContainer = ref(null)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 定时器
let durationTimer = null

// 图标映射
const iconMap = {
  Globe, Code, Lock, Shield, Clock, Hash, Terminal,
  FileText, Zap, Radio, Server, Wifi
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'websocket-test'
  ).slice(0, 2)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'http-client'),
    tools.find(t => t.id === 'api-doc'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'base64-encoder')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 监听消息变化，自动滚动
watch(messages, () => {
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}, { deep: true })

// 方法
const toggleConnection = () => {
  if (isConnected.value) {
    disconnect()
  } else {
    connect()
  }
}

const connect = () => {
  if (!wsUrl.value || connecting.value) return

  connecting.value = true

  try {
    // 创建WebSocket连接
    ws.value = protocol.value
      ? new WebSocket(wsUrl.value, protocol.value)
      : new WebSocket(wsUrl.value)

    // 设置事件监听器
    ws.value.onopen = (event) => {
      isConnected.value = true
      connecting.value = false
      connectionInfo.value = {
        connectedAt: new Date().toLocaleTimeString(),
        duration: '0秒',
        messagesSent: 0,
        messagesReceived: 0
      }

      addMessage({
        type: 'system',
        data: '已连接到 WebSocket 服务器',
        timestamp: new Date()
      })

      // 开始计算连接时长
      startDurationTimer()
    }

    ws.value.onclose = (event) => {
      isConnected.value = false
      connecting.value = false
      stopDurationTimer()

      addMessage({
        type: 'system',
        data: `连接已关闭 (${event.code}: ${event.reason || '未知原因'})`,
        timestamp: new Date()
      })

      connectionInfo.value = null
    }

    ws.value.onerror = (event) => {
      connecting.value = false
      addMessage({
        type: 'error',
        data: '连接错误：' + (event.message || '未知错误'),
        timestamp: new Date()
      })
    }

    ws.value.onmessage = (event) => {
      // 更新接收消息计数
      if (connectionInfo.value) {
        connectionInfo.value.messagesReceived++
      }

      // 判断消息类型
      let msgType = 'text'
      let data = event.data

      if (data instanceof Blob) {
        msgType = 'binary'
        // 这里可以处理二进制数据
        data = '[二进制数据]'
      } else {
        try {
          const parsed = JSON.parse(data)
          msgType = 'json'
          data = parsed
        } catch {
          // 保持原始文本
        }
      }

      addMessage({
        type: 'received',
        data: data,
        messageType: msgType,
        timestamp: new Date()
      })
    }

  } catch (error) {
    connecting.value = false
    addMessage({
      type: 'error',
      data: '创建连接失败：' + error.message,
      timestamp: new Date()
    })
  }
}

const disconnect = () => {
  if (ws.value) {
    ws.value.close()
    ws.value = null
  }
  stopDurationTimer()
}

const sendMessage = () => {
  if (!isConnected.value || !messageContent.value || !ws.value) return

  try {
    let data = messageContent.value
    let msgType = messageType.value

    // 根据类型处理消息
    if (msgType === 'json') {
      try {
        JSON.parse(data) // 验证JSON格式
      } catch {
        addMessage({
          type: 'error',
          data: 'JSON 格式错误',
          timestamp: new Date()
        })
        return
      }
    } else if (msgType === 'binary') {
      // 模拟二进制数据
      data = new TextEncoder().encode(data)
    }

    // 发送消息
    ws.value.send(data)

    // 更新发送计数
    if (connectionInfo.value) {
      connectionInfo.value.messagesSent++
    }

    // 添加到消息记录
    addMessage({
      type: 'sent',
      data: messageType.value === 'binary' ? '[二进制数据]' : messageContent.value,
      messageType: messageType.value,
      timestamp: new Date()
    })

    // 清空输入框
    messageContent.value = ''

  } catch (error) {
    addMessage({
      type: 'error',
      data: '发送失败：' + error.message,
      timestamp: new Date()
    })
  }
}

const sendPing = () => {
  if (!isConnected.value || !ws.value) return

  try {
    // 发送心跳
    ws.value.send('ping')

    addMessage({
      type: 'system',
      data: '发送 Ping',
      timestamp: new Date()
    })
  } catch (error) {
    addMessage({
      type: 'error',
      data: '发送 Ping 失败：' + error.message,
      timestamp: new Date()
    })
  }
}

const loadExample = (event) => {
  const examples = {
    echo: {
      url: 'wss://echo.websocket.org',
      protocol: ''
    },
    test: {
      url: 'wss://websocket-echo.com',
      protocol: ''
    }
  }

  const example = examples[event.target.value]
  if (example) {
    wsUrl.value = example.url
    protocol.value = example.protocol
  }
  event.target.value = ''
}

const addMessage = (msg) => {
  messages.value.push(msg)

  // 限制消息数量
  if (messages.value.length > 100) {
    messages.value = messages.value.slice(-100)
  }
}

const clearMessages = () => {
  messages.value = []
}

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

const getStatusClass = () => {
  if (connecting.value) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
  if (isConnected.value) return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
  return 'bg-muted text-muted-foreground'
}

const getStatusText = () => {
  if (connecting.value) return '连接中'
  if (isConnected.value) return '已连接'
  return '未连接'
}

const getStatusIcon = () => {
  if (connecting.value) return Loader2
  if (isConnected.value) return Wifi
  return X
}

const getMessagePlaceholder = () => {
  switch (messageType.value) {
    case 'json':
      return '{"type": "message", "content": "Hello WebSocket!"}'
    case 'binary':
      return '二进制数据内容'
    default:
      return '输入要发送的消息...'
  }
}

const formatJsonMessage = (data) => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return data
  }
}

const formatTime = (time) => {
  return time.toLocaleTimeString()
}

const startDurationTimer = () => {
  let seconds = 0
  durationTimer = setInterval(() => {
    seconds++
    if (connectionInfo.value) {
      if (seconds < 60) {
        connectionInfo.value.duration = `${seconds}秒`
      } else if (seconds < 3600) {
        connectionInfo.value.duration = `${Math.floor(seconds / 60)}分${seconds % 60}秒`
      } else {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        connectionInfo.value.duration = `${hours}小时${minutes}分`
      }
    }
  }, 1000)
}

const stopDurationTimer = () => {
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 生命周期
onUnmounted(() => {
  disconnect()
})
</script>