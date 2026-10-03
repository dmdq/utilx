<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Star, ArrowRight, GripVertical
} from 'lucide-vue-next'
import { isFavorite, toggleFavorite as toggleFavoriteTool } from '~/composables/useTools'
import { getCategoryColor } from '~/utils/categoryColors'
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

const iconComponent = computed(() => {
  return resolveToolIcon(props.icon, props.category)
})

// 分类徽章的配色与短标签：键与 categories.js 的 id 一一对应
const categoryBadgeMap = {
  'dev': { class: 'bg-red-500/10 text-red-500', label: '开发' },
  'design': { class: 'bg-indigo-500/10 text-indigo-500', label: '设计' },
  'encode': { class: 'bg-blue-500/10 text-blue-500', label: '编码' },
  'crypto': { class: 'bg-green-500/10 text-green-500', label: '加密' },
  'security': { class: 'bg-emerald-500/10 text-emerald-500', label: '安全' },
  'time': { class: 'bg-purple-500/10 text-purple-500', label: '时间' },
  'text': { class: 'bg-pink-500/10 text-pink-500', label: '文本' },
  'network': { class: 'bg-cyan-500/10 text-cyan-500', label: '网络' },
  'image': { class: 'bg-yellow-500/10 text-yellow-500', label: '图像' },
  'calculate': { class: 'bg-sky-500/10 text-sky-500', label: '计算' },
  'format': { class: 'bg-orange-500/10 text-orange-500', label: '格式' },
  'random': { class: 'bg-fuchsia-500/10 text-fuchsia-500', label: '随机' },
  'health': { class: 'bg-rose-500/10 text-rose-500', label: '健康' },
  'finance': { class: 'bg-lime-500/10 text-lime-500', label: '金融' },
  'others': { class: 'bg-slate-500/10 text-slate-500', label: '其他' },
  'file': { class: 'bg-teal-500/10 text-teal-500', label: '文件' }
}

const getCategoryColorClass = (category) => {
  return categoryBadgeMap[category]?.class || 'bg-purple-500/10 text-purple-500'
}

const getCategoryBadgeClass = (category) => {
  return categoryBadgeMap[category]?.class || 'bg-purple-500/10 text-purple-500'
}

const getCategoryLabel = (category) => {
  return categoryBadgeMap[category]?.label || '工具'
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
          class="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0"
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