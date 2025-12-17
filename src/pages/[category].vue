<template>
  <component :is="categoryComponent" v-if="categoryComponent" />
  <div v-else class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-destructive mb-4">分类不存在</h1>
      <p class="text-muted-foreground">该分类页面不存在，请检查链接是否正确</p>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

const route = useRoute()
const category = route.params.category

// 定义分类映射
const categoryMap = {
  'ai': () => import('~/pages/category/ai/index.vue'),
  'all': () => import('~/pages/category/all/index.vue'),
  'crypto': () => import('~/pages/category/crypto/index.vue'),
  'data': () => import('~/pages/category/data/index.vue'),
  'design': () => import('~/pages/category/design/index.vue'),
  'dev': () => import('~/pages/category/dev/index.vue'),
  'encode': () => import('~/pages/category/encode/index.vue'),
  'format': () => import('~/pages/category/format/index.vue'),
  'image': () => import('~/pages/category/image/index.vue'),
  'network': () => import('~/pages/category/network/index.vue'),
  'productivity': () => import('~/pages/category/productivity/index.vue'),
  'security': () => import('~/pages/category/security/index.vue'),
  'text': () => import('~/pages/category/text/index.vue'),
  'time': () => import('~/pages/category/time/index.vue'),
  'visualization': () => import('~/pages/category/visualization/index.vue')
}

// 获取对应的分类组件
const categoryComponent = computed(() => {
  if (categoryMap[category]) {
    return defineAsyncComponent(categoryMap[category])
  }
  return null
})

// 设置页面元数据
definePageMeta({
  layout: 'default'
})
</script>