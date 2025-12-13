<template>

  <teleport to="body">
    <div
      class="fixed top-4 right-4 space-y-2"
      style="z-index: 2147483646"
    >
      <transition-group
        name="notification"
        tag="div"
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-300 ease-in"
        enter-from-class="opacity-0 translate-x-full"
        enter-to-class="opacity-100 translate-x-0"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-full"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'p-4 rounded-lg shadow-lg border max-w-sm',
            'flex items-start gap-3',
            getNotificationClasses(notification.type)
          ]"
        >
          <!-- 图标 -->
          <div class="flex-shrink-0 mt-0.5">
            <CheckCircle v-if="notification.type === 'success'" class="w-5 h-5" />
            <AlertCircle v-else-if="notification.type === 'error'" class="w-5 h-5" />
            <AlertTriangle v-else-if="notification.type === 'warning'" class="w-5 h-5" />
            <Info v-else class="w-5 h-5" />
          </div>

          <!-- 消息内容 -->
          <div class="flex-1">
            <p class="text-sm font-medium">{{ notification.message }}</p>
          </div>

          <!-- 关闭按钮 -->
          <button
            @click="removeNotification(notification.id)"
            class="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useNotification } from '~/composables/useNotification'

const { notifications, removeNotification } = useNotification()

const getNotificationClasses = (type) => {
  const baseClasses = 'text-white'

  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-500 border-green-600`
    case 'error':
      return `${baseClasses} bg-red-500 border-red-600`
    case 'warning':
      return `${baseClasses} bg-yellow-500 border-yellow-600`
    case 'info':
    default:
      return `${baseClasses} bg-blue-500 border-blue-600`
  }
}
</script>

<style scoped>
.notification-move,
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-active {
  position: absolute;
  right: 0;
}

/* 确保 z-index 足够高以在其他内容之上显示 */
.fixed.top-4.right-4 {
  z-index: 9999 !important;
}
</style>