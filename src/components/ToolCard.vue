<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Star, ArrowRight, GripVertical
} from 'lucide-vue-next'
import { isFavorite, toggleFavorite as toggleFavoriteTool } from '~/composables/useTools'
import { resolveToolIcon } from '~/utils/toolIcons'

const props = defineProps({
  tool: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  usageCount: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  },
  isDraggable: {
    type: Boolean,
    default: false
  },
  disableLink: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const isFavoriteRef = ref(false)

const iconComponent = computed(() => {
  return resolveToolIcon(props.icon, props.category)
})

// 分类短标签：键与 categories.js 的 id 一一对应（不再使用彩色徽章）
const categoryLabels = {
  dev: '开发', design: '设计', encode: '编码', crypto: '加密',
  security: '安全', time: '时间', text: '文本', network: '网络',
  image: '图像', calculate: '计算', format: '格式', random: '随机',
  health: '健康', finance: '金融', others: '其他', file: '文件'
}

const getCategoryLabel = (category) => categoryLabels[category] || '工具'

const toggleFavorite = () => {
  isFavoriteRef.value = toggleFavoriteTool(props.tool.id)
}

// 获取工具URL
const getToolUrl = (tool) => {
  // 统一使用目录结构格式
  return `/tools/${tool.id}/`
}

// 处理卡片点击事件
const handleCardClick = () => {
  emit('select', props.tool)
}

// 在组件挂载时检查工具是否已被收藏
onMounted(() => {
  isFavoriteRef.value = isFavorite(props.tool.id)
})
</script>

<template>
  <component
    :is="disableLink ? 'div' : 'NuxtLink'"
    :to="disableLink ? null : getToolUrl(tool)"
    class="tool-card group relative bg-transparent border-0 border-b border-border/40 rounded-none p-5 hover:bg-muted/25 transition-colors duration-200 cursor-pointer block h-full"
    :data-category="category"
    @click="!disableLink && handleCardClick"
  >
    <!-- 拖拽句柄 -->
    <div
      v-if="isDraggable"
      class="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors z-10 cursor-grab active:cursor-grabbing"
      title="拖拽调整顺序"
      @mousedown.stop
    >
      <GripVertical class="w-4 h-4" />
    </div>

    <!-- 收藏按钮 -->
    <button
      class="absolute top-4 right-4 text-muted-foreground hover:text-yellow-500 transition-colors z-10"
      @click.stop.prevent="toggleFavorite"
    >
      <Star
        class="w-4 h-4"
        :fill="isFavoriteRef ? 'currentColor' : 'none'"
        :class="{ 'text-yellow-500': isFavoriteRef, 'text-muted-foreground': !isFavoriteRef }"
      />
    </button>
    
    <div class="flex items-center gap-4 mb-4" :class="{ 'ml-8': isDraggable }">
      <div
        class="w-6 h-6 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0"
      >
        <component :is="iconComponent" class="w-5 h-5" />
      </div>
      <div class="flex items-center gap-1.5 min-w-0">
        <NuxtLink
          :to="getToolUrl(tool)"
          class="font-semibold text-foreground group-hover:text-primary transition-colors hover:underline truncate"
          :title="title"
          @click.stop
        >
          {{ title }}
        </NuxtLink>
        <span
          class="text-xs text-muted-foreground/70 whitespace-nowrap flex-shrink-0"
        >
          {{ getCategoryLabel(category) }}
        </span>
      </div>
    </div>
    <p class="text-sm text-muted-foreground line-clamp-2 mb-4">
      {{ description }}
    </p>
    <div class="flex items-center justify-between text-xs text-muted-foreground pt-3">
      <span class="inline-flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full" :class="tool.local === false ? 'bg-amber-500' : 'bg-emerald-500'"></span>
        {{ tool.local === false ? '在线服务' : '纯本地计算' }}
      </span>
      <NuxtLink
        :to="getToolUrl(tool)"
        class="group-hover:text-primary flex items-center gap-1 hover:text-primary transition-colors"
        @click.stop
      >
        打开
        <ArrowRight class="w-3 h-3" />
      </NuxtLink>
    </div>
  </component>
</template>