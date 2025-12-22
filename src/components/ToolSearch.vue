<template>
  <div class="relative max-w-2xl mx-auto mb-8">
    <div class="relative">
      <Icon name="Search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
      <input
        v-model="searchQuery"
        @input="handleSearch"
        type="text"
        placeholder="搜索工具..."
        class="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
      />
    </div>

    <!-- 分类过滤 -->
    <div class="flex gap-2 mt-4 overflow-x-auto pb-2">
      <button
        v-for="category in categories"
        :key="category.id"
        @click="selectedCategory = selectedCategory === category.id ? null : category.id"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
          selectedCategory === category.id
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        ]"
      >
        <Icon :name="category.icon" class="w-4 h-4 mr-1" />
        {{ category.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search } from 'lucide-vue-next'

const props = defineProps({
  tools: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['filter'])

const searchQuery = ref('')
const selectedCategory = ref(null)

const categories = [
  { id: 'development', name: '开发工具', icon: 'Code' },
  { id: 'design', name: '设计工具', icon: 'Palette' },
  { id: 'converter', name: '转换工具', icon: 'RefreshCw' },
  { id: 'generator', name: '生成器', icon: 'Wand2' },
  { id: 'utility', name: '实用工具', icon: 'Tool' }
]

const filteredTools = computed(() => {
  let filtered = props.tools

  // 分类过滤
  if (selectedCategory.value) {
    filtered = filtered.filter(tool => tool.category === selectedCategory.value)
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.keywords.some(keyword => keyword.toLowerCase().includes(query))
    )
  }

  return filtered
})

const handleSearch = () => {
  emit('filter', filteredTools.value)
}
</script>