<script setup>
import { computed } from 'vue'
import { Tag, TrendingUp, Eye } from 'lucide-vue-next'

const props = defineProps({
  tag: {
    type: Object,
    required: true
  },
  showStats: {
    type: Boolean,
    default: true
  },
  showCategories: {
    type: Boolean,
    default: true
  },
  showTools: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  hover: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click'])

// 计算属性
const getCategoryName = (category) => {
  const categoryNames = {
    'ai': 'AI智能',
    'calculate': '计算工具',
    'crypto': '加密解密',
    'data': '数据处理',
    'design': '设计辅助',
    'dev': '开发工具',
    'encode': '编码解码',
    'finance': '金融计算',
    'format': '格式化工具',
    'health': '健康工具',
    'image': '图像处理',
    'network': '网络工具',
    'productivity': '效率工具',
    'random': '随机生成',
    'security': '安全工具',
    'text': '文本处理',
    'time': '时间工具',
    'visualization': '可视化工具'
  }
  return categoryNames[category] || category
}

const getCategoryColor = (category) => {
  const colors = {
    'ai': 'bg-purple-100 text-purple-800',
    'calculate': 'bg-blue-100 text-blue-800',
    'crypto': 'bg-red-100 text-red-800',
    'data': 'bg-green-100 text-green-800',
    'design': 'bg-pink-100 text-pink-800',
    'dev': 'bg-indigo-100 text-indigo-800',
    'encode': 'bg-yellow-100 text-yellow-800',
    'finance': 'bg-emerald-100 text-emerald-800',
    'format': 'bg-cyan-100 text-cyan-800',
    'health': 'bg-orange-100 text-orange-800',
    'image': 'bg-teal-100 text-teal-800',
    'network': 'bg-violet-100 text-violet-800',
    'productivity': 'bg-amber-100 text-amber-800',
    'random': 'bg-lime-100 text-lime-800',
    'security': 'bg-rose-100 text-rose-800',
    'text': 'bg-sky-100 text-sky-800',
    'time': 'bg-slate-100 text-slate-800',
    'visualization': 'bg-fuchsia-100 text-fuchsia-800'
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

const cardClasses = computed(() => {
  const baseClasses = 'bg-white border border-gray-200 rounded-lg transition-all duration-200'
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  }
  const hoverClasses = props.hover ? 'hover:shadow-md hover:border-blue-300' : ''

  return `${baseClasses} ${sizeClasses[props.size]} ${hoverClasses}`
})

const titleClasses = computed(() => {
  const baseClasses = 'font-semibold text-gray-900'
  const sizeClasses = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl'
  }

  return `${baseClasses} ${sizeClasses[props.size]}`
})

const descriptionClasses = computed(() => {
  const baseClasses = 'text-gray-700'
  const sizeClasses = {
    small: 'text-xs line-clamp-2',
    medium: 'text-sm line-clamp-2',
    large: 'text-base line-clamp-3'
  }

  return `${baseClasses} ${sizeClasses[props.size]}`
})

const handleClick = () => {
  emit('click', props.tag)
}
</script>

<template>
  <div :class="cardClasses" @click="handleClick">
    <!-- 标签头部 -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <component :is="tag.icon || Tag" class="w-5 h-5 text-blue-600" />
          <h3 :class="titleClasses">
            {{ tag.displayName }}
          </h3>
          <div v-if="tag.hot" class="flex-shrink-0">
            <TrendingUp class="w-4 h-4 text-red-500" />
          </div>
        </div>
        <p v-if="tag.description" :class="descriptionClasses">
          {{ tag.description }}
        </p>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="showStats" class="flex items-center gap-4 mb-4">
      <div class="flex items-center gap-1 text-sm text-gray-600">
        <Tag class="w-4 h-4" />
        <span>{{ tag.toolCount }} 个工具</span>
      </div>
      <div v-if="tag.popularity" class="flex items-center gap-1 text-sm text-gray-600">
        <TrendingUp class="w-4 h-4" />
        <span>{{ Math.round(tag.popularity) }} 热度</span>
      </div>
      <div v-if="tag.totalViews" class="flex items-center gap-1 text-sm text-gray-600">
        <Eye class="w-4 h-4" />
        <span>{{ tag.totalViews.toLocaleString() }} 访问</span>
      </div>
    </div>

    <!-- 分类标签 -->
    <div v-if="showCategories && tag.categories && tag.categories.length > 0" class="mb-4">
      <div class="flex flex-wrap gap-1">
        <span
          v-for="category in tag.categories.slice(0, size === 'small' ? 2 : size === 'medium' ? 3 : 5)"
          :key="category"
          :class="[
            'inline-block px-2 py-1 text-xs rounded-full',
            getCategoryColor(category)
          ]"
        >
          {{ getCategoryName(category) }}
        </span>
        <span
          v-if="tag.categories.length > (size === 'small' ? 2 : size === 'medium' ? 3 : 5)"
          class="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
        >
          +{{ tag.categories.length - (size === 'small' ? 2 : size === 'medium' ? 3 : 5) }}
        </span>
      </div>
    </div>

    <!-- 工具预览 -->
    <div v-if="showTools && tag.tools && tag.tools.length > 0" class="border-t pt-4">
      <div class="text-xs text-gray-500 mb-2">热门工具:</div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tool in tag.tools.slice(0, size === 'small' ? 2 : size === 'medium' ? 3 : 4)"
          :key="tool.id"
          class="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded"
        >
          {{ tool.name }}
        </span>
        <span
          v-if="tag.tools.length > (size === 'small' ? 2 : size === 'medium' ? 3 : 4)"
          class="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded"
        >
          +{{ tag.tools.length - (size === 'small' ? 2 : size === 'medium' ? 3 : 4) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>