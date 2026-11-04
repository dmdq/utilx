<template>
  <div class="min-h-screen bg-background p-4 md:p-8">
    <div class="max-w-4xl mx-auto">
      <!-- 页面头部 -->
      <div class="mb-8">
        <h1 class="text-display text-foreground mb-2">通知设置</h1>
        <p class="text-muted-foreground">管理您的推送通知偏好设置</p>
      </div>

      <!-- 通知状态卡片 -->
      <div class="grid gap-6 md:grid-cols-2 mb-8">
        <!-- 支持状态 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <CheckCircle v-if="isSupported" class="w-5 h-5 text-primary" />
              <XCircle v-else class="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 class="font-semibold">推送通知支持</h3>
              <p class="text-sm text-muted-foreground">
                {{ isSupported ? '您的浏览器支持推送通知' : '浏览器不支持推送通知' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 订阅状态 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <Bell v-if="isSubscribed" class="w-5 h-5 text-primary" />
              <BellOff v-else class="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 class="font-semibold">订阅状态</h3>
              <p class="text-sm text-muted-foreground">
                {{ getSubscriptionStatusText() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 权限状态 -->
      <div class="bg-card rounded-lg p-6 border mb-8">
        <h3 class="font-semibold mb-4">通知权限</h3>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <Shield class="w-5 h-5 mr-2" :class="getPermissionIconClass()" />
            <span class="capitalize">{{ permission }}</span>
          </div>
          <button
            v-if="permission === 'default'"
            @click="onRequestPermission"
            class="btn-base btn-outline btn-sm"
            :disabled="permissionLoading"
            :class="{ 'btn-loading': permissionLoading }"
          >
            {{ permissionLoading ? '请求中...' : '请求权限' }}
          </button>
          <button
            v-else-if="permission === 'granted'"
            @click="onShowTestNotification"
            class="btn-base btn-outline btn-sm"
            :disabled="testLoading"
            :class="{ 'btn-loading': testLoading }"
          >
            <Bell class="w-4 h-4 mr-2" />
            {{ testLoading ? '发送中...' : '测试通知' }}
          </button>
        </div>
      </div>

      <!-- 推送订阅管理 -->
      <div class="bg-card rounded-lg p-6 border mb-8">
        <h3 class="font-semibold mb-4">推送订阅</h3>

        <div v-if="!isSupported" class="text-muted-foreground text-center py-8">
          <Info class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>您的浏览器不支持推送通知功能</p>
          <p class="text-sm">请使用现代浏览器以获得完整功能</p>
        </div>

        <div v-else-if="!isSubscribed" class="space-y-4">
          <p class="text-muted-foreground">
            订阅推送通知以接收工具更新、新功能发布等重要消息
          </p>

          <div class="bg-muted/50 rounded-lg p-4">
            <h4 class="font-medium mb-2">您将收到以下类型的通知：</h4>
            <ul class="space-y-1 text-sm text-muted-foreground">
              <li>• 新工具发布通知</li>
              <li>• 工具功能更新</li>
              <li>• 系统维护公告</li>
              <li>• 安全相关提醒</li>
            </ul>
          </div>

          <button
            @click="onSubscribeToPush"
            class="btn-base btn-default w-full"
            :disabled="subscribeLoading"
            :class="{ 'btn-loading': subscribeLoading }"
          >
            <Bell class="w-4 h-4 mr-2" />
            {{ subscribeLoading ? '订阅中...' : '订阅推送通知' }}
          </button>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div class="flex items-center">
              <CheckCircle class="w-5 h-5 text-green-600 mr-2" />
              <span class="text-green-700 dark:text-green-300">您已成功订阅推送通知</span>
            </div>
          </div>

          <div class="space-y-3">
            <button
              @click="onShowTestNotification"
              class="btn-base btn-outline w-full"
              :disabled="testLoading"
              :class="{ 'btn-loading': testLoading }"
            >
              <Bell class="w-4 h-4 mr-2" />
              {{ testLoading ? '发送中...' : '发送测试通知' }}
            </button>

            <button
              @click="onUnsubscribeFromPush"
              class="btn-base btn-destructive w-full"
              :disabled="unsubscribeLoading"
              :class="{ 'btn-loading': unsubscribeLoading }"
            >
              <BellOff class="w-4 h-4 mr-2" />
              {{ unsubscribeLoading ? '取消中...' : '取消订阅' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 通知历史 -->
      <div class="bg-card rounded-lg p-6 border">
        <h3 class="font-semibold mb-4">最近通知</h3>

        <div v-if="notificationHistory.length === 0" class="text-muted-foreground text-center py-8">
          <MessageSquare class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无通知历史</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="notification in notificationHistory"
            :key="notification.id"
            class="flex items-start p-3 bg-muted/30 rounded-lg"
          >
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-1">
              <Bell class="w-4 h-4 text-primary" />
            </div>
            <div class="flex-1">
              <h4 class="font-medium">{{ notification.title }}</h4>
              <p class="text-sm text-muted-foreground">{{ notification.body }}</p>
              <p class="text-xs text-muted-foreground mt-1">
                {{ formatTime(notification.timestamp) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePushNotification } from '@/composables/usePushNotification'
import { useNotification } from '@/composables/useNotification'
// import Button from '@/components/ui/button.vue'
import {
  CheckCircle,
  XCircle,
  Bell,
  BellOff,
  Shield,
  Info,
  MessageSquare
} from 'lucide-vue-next'

// 设置页面标题
useHead({
  title: '通知设置 - 有条工具',
  meta: [
    { name: 'description', content: '管理您的推送通知偏好设置' }
  ]
})

// 使用推送通知功能
const {
  isSupported,
  isSubscribed,
  permission,
  subscription,
  requestPermission: requestPermissionFn,
  subscribeToPush: subscribeToPushFn,
  unsubscribeFromPush: unsubscribeFromPushFn,
  showLocalNotification,
  getSubscriptionStatus
} = usePushNotification()

// 使用应用内通知
const { showSuccess, showError, showInfo } = useNotification()

// 加载状态
const permissionLoading = ref(false)
const subscribeLoading = ref(false)
const unsubscribeLoading = ref(false)

// 通知历史
const notificationHistory = ref([
  // 示例数据
  {
    id: 1,
    title: '欢迎使用推送通知',
    body: '现在您可以接收重要更新和提醒了',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  }
])

// 请求权限
const onRequestPermission = async () => {
  if (permissionLoading.value) return

  permissionLoading.value = true
  try {
    await requestPermissionFn()
    showSuccess('通知权限已授予')
  } catch (error) {
    showError(`请求权限失败: ${error.message}`)
  } finally {
    permissionLoading.value = false
  }
}

// 订阅推送
const onSubscribeToPush = async () => {
  if (subscribeLoading.value) return

  subscribeLoading.value = true
  try {
    await subscribeToPushFn()
    showSuccess('推送订阅成功！您将开始接收通知')

    // 添加欢迎通知到历史
    addToHistory({
      title: '订阅成功',
      body: '您已成功订阅推送通知服务',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    showError(`订阅失败: ${error.message}`)
  } finally {
    subscribeLoading.value = false
  }
}

// 取消订阅
const onUnsubscribeFromPush = async () => {
  if (unsubscribeLoading.value) return

  unsubscribeLoading.value = true
  try {
    await unsubscribeFromPushFn()
    showSuccess('已取消推送订阅')

    addToHistory({
      title: '取消订阅',
      body: '您已取消推送通知订阅',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    showError(`取消订阅失败: ${error.message}`)
  } finally {
    unsubscribeLoading.value = false
  }
}

// 发送测试通知
const onShowTestNotification = () => {
  const notification = showLocalNotification('测试通知', {
    body: '这是一条测试推送通知',
    icon: '/logo/logo-192.png',
    badge: '/logo/logo-96.png',
    tag: 'test-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '打开应用'
      },
      {
        action: 'dismiss',
        title: '关闭'
      }
    ]
  })

  if (notification) {
    addToHistory({
      title: '测试通知',
      body: '这是一条测试推送通知',
      timestamp: new Date().toISOString()
    })
    showSuccess('测试通知已发送')
  }
}

// 获取订阅状态文本
const getSubscriptionStatusText = () => {
  if (!isSupported.value) {
    return '浏览器不支持推送通知'
  }

  if (isSubscribed.value) {
    return '已订阅推送通知'
  }

  if (permission.value === 'denied') {
    return '通知权限被拒绝'
  }

  return '未订阅推送通知'
}

// 获取权限图标样式
const getPermissionIconClass = () => {
  switch (permission.value) {
    case 'granted':
      return 'text-green-600'
    case 'denied':
      return 'text-red-600'
    default:
      return 'text-yellow-600'
  }
}

// 添加到通知历史
const addToHistory = (notification) => {
  notificationHistory.value.unshift({
    ...notification,
    id: Date.now()
  })

  // 只保留最近20条记录
  if (notificationHistory.value.length > 20) {
    notificationHistory.value = notificationHistory.value.slice(0, 20)
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes} 分钟前`
  } else if (hours < 24) {
    return `${hours} 小时前`
  } else if (days < 7) {
    return `${days} 天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// Service Worker 事件监听
onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        addToHistory({
          title: event.data.title,
          body: event.data.body,
          timestamp: new Date().toISOString()
        })
      }
    })
  }
})
</script>

<style scoped>
/* 添加一些自定义样式 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>