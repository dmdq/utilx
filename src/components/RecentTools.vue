<template>
  <div class="bg-card rounded-lg p-6 border">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">最近使用</h3>
      <button
        @click="clearHistory"
        class="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        清除历史
      </button>
    </div>

    <div v-if="recentTools.length === 0" class="text-center py-8 text-muted-foreground">
      <Icon name="Clock" class="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>暂无使用历史</p>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <NuxtLink
        v-for="tool in recentTools"
        :key="tool.name"
        :to="tool.url"
        class="group p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
      >
        <div class="flex flex-col items-center text-center">
          <Icon :name="tool.icon" class="w-6 h-6 mb-2 text-primary" />
          <div class="text-sm font-medium group-hover:text-primary transition-colors">
            {{ tool.name }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ formatDate(tool.lastUsed) }}
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Clock, Trash2 } from 'lucide-vue-next'

const recentTools = ref([])

const loadRecentTools = () => {
  const history = JSON.parse(localStorage.getItem('recentTools') || '[]')
  recentTools.value = history.slice(0, 8) // 只显示最近8个
}

const clearHistory = () => {
  localStorage.removeItem('recentTools')
  recentTools.value = []
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    return diffHours === 0 ? '刚刚' : `${diffHours}小时前`
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString()
  }
}

onMounted(() => {
  loadRecentTools()
})
</script>