<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronRight, Home } from 'lucide-vue-next'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'

const props = defineProps({
  category: {
    type: Object,
    default: null
  },
  tool: {
    type: Object,
    default: null
  }
})

const router = useRouter()
const route = useRoute()

// 面包屑路径
const breadcrumbs = computed(() => {
  const paths = [
    {
      name: '首页',
      path: '/'
    }
  ]

  const pathSegments = route.path.split('/').filter(Boolean)

  // 解析工具页面路径 /tools/tool-id/
  if (pathSegments.length >= 2 && pathSegments[0] === 'tools') {
    const toolId = pathSegments[1]
    const tool = tools.find(t => t.id === toolId)

    if (tool) {
      // 查找工具所属的分类
      const category = categories.find(c => c.id === tool.category)
      if (category) {
        paths.push({
          name: category.name,
          path: `/${category.id}/`
        })
      }

      paths.push({
        name: tool.name,
        path: `/tools/${toolId}/`
      })
    }
  }

  // 解析分类页面路径 /category-id
  else if (pathSegments.length === 1) {
    const categoryId = pathSegments[0]
    const category = categories.find(c => c.id === categoryId)

    if (category) {
      paths.push({
        name: category.name,
        path: `/${categoryId}/`
      })
    }
    // 处理特殊页面
    else if (pathSegments[0] === 'all') {
      paths.push({
        name: '全部工具',
        path: '/all/'
      })
    }
    else if (pathSegments[0] === 'explore') {
      paths.push({
        name: '工具探索',
        path: '/explore/'
      })
    }
    else if (pathSegments[0] === 'favorites') {
      paths.push({
        name: '我的收藏',
        path: '/favorites/'
      })
    }
    else if (pathSegments[0] === 'recent') {
      paths.push({
        name: '最近使用',
        path: '/recent/'
      })
    }
    else if (pathSegments[0] === 'about') {
      paths.push({
        name: '关于我们',
        path: '/about/'
      })
    }
    else if (pathSegments[0] === 'privacy') {
      paths.push({
        name: '隐私政策',
        path: '/privacy/'
      })
    }
    else if (pathSegments[0] === 'terms') {
      paths.push({
        name: '服务条款',
        path: '/terms/'
      })
    }
    else if (pathSegments[0] === 'feedback') {
      paths.push({
        name: '提交反馈',
        path: '/feedback/'
      })
    }
    else if (pathSegments[0] === 'ai') {
      paths.push({
        name: 'AI 导航',
        path: '/ai/'
      })
    }
    else if (pathSegments[0] === 'faq') {
      paths.push({
        name: '常见问题',
        path: '/faq/'
      })
    }
    else if (pathSegments[0] === 'cookie') {
      paths.push({
        name: 'Cookie政策',
        path: '/cookie/'
      })
    }
    else if (pathSegments[0] === 'sitemap') {
      paths.push({
        name: '站点地图',
        path: '/sitemap/'
      })
    }
  }

  // 兼容props方式（用于静态页面）
  else if (props.category) {
    paths.push({
      name: props.category.name,
      path: `/`
    })
  }

  else if (props.tool) {
    paths.push({
      name: props.tool.name,
      path: `/tools/${props.tool.id}/`
    })
  }

  return paths
})

const goToPath = (path) => {
  router.push(path)
}
</script>

<template>
  <nav class="flex items-center text-sm text-muted-foreground">
    <ol class="flex items-center">
      <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
        <button
          v-if="index < breadcrumbs.length - 1"
          @click="goToPath(crumb.path)"
          class="text-muted-foreground hover:text-foreground transition-colors flex items-center max-w-[120px] truncate"
          :title="crumb.name"
        >
          {{ crumb.name }}
        </button>
        <span v-else class="text-foreground flex items-center max-w-[120px] truncate" :title="crumb.name">
          {{ crumb.name }}
        </span>
        <ChevronRight v-if="index < breadcrumbs.length - 1" class="w-4 h-4 mx-2" />
      </li>
    </ol>
  </nav>
</template>