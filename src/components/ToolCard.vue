<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileJson, Clock, Lock, Regex, Database, Image as ImageIcon,
  Star, ArrowRight, GripVertical
} from 'lucide-vue-next'
import { isFavorite, toggleFavorite as toggleFavoriteTool } from '~/composables/useTools'
import { getCategoryColor } from '~/utils/categoryColors'

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
    required: true
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

const iconMap = {
  'file-json': FileJson,
  'clock': Clock,
  'lock': Lock,
  'regex': Regex,
  'database': Database,
  'image': ImageIcon
}

const iconComponent = computed(() => {
  return iconMap[props.icon] || FileJson
})

const getCategoryColorClass = (category) => {
  const colorMap = {
    'dev': 'bg-orange-500/10 text-orange-500',
    'ops': 'bg-blue-500/10 text-blue-500',
    'crypto': 'bg-green-500/10 text-green-500',
    'image': 'bg-cyan-500/10 text-cyan-500'
  }
  return colorMap[category] || 'bg-purple-500/10 text-purple-500'
}

const getCategoryBadgeClass = (category) => {
  const colorMap = {
    'dev': 'bg-orange-500/10 text-orange-500',
    'ops': 'bg-blue-500/10 text-blue-500',
    'crypto': 'bg-green-500/10 text-green-500',
    'image': 'bg-cyan-500/10 text-cyan-500'
  }
  return colorMap[category] || 'bg-purple-500/10 text-purple-500'
}

const getCategoryLabel = (category) => {
  const labelMap = {
    'dev': 'Dev',
    'ops': 'Time',
    'crypto': 'Sec',
    'image': 'Img'
  }
  return labelMap[category] || 'DB'
}

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
    class="tool-card group relative bg-card/40 backdrop-blur-sm border-0 rounded-xl p-5 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/8 transition-all duration-300 cursor-pointer block h-full"
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
        class="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
        :class="getCategoryColorClass(category)"
      >
        <component :is="iconComponent" class="w-6 h-6" :style="{ color: getCategoryColor(category).icon }" />
      </div>
      <div>
        <NuxtLink
          :to="getToolUrl(tool)"
          class="font-semibold text-foreground group-hover:text-primary transition-colors hover:underline"
          :title="title"
          @click.stop
        >
          {{ title }}
        </NuxtLink>
        <span 
          class="text-[10px] px-1.5 py-0.5 rounded"
          :class="getCategoryBadgeClass(category)"
        >
          {{ getCategoryLabel(category) }}
        </span>
      </div>
    </div>
    <p class="text-sm text-muted-foreground line-clamp-2 mb-4">
      {{ description }}
    </p>
    <div class="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
      <span>使用: {{ usageCount }}</span>
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