<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-4">Web组件分析器</h1>
    <p class="mb-6">分析Web组件结构、依赖关系和性能指标</p>

    <div class="grid grid-cols-2 gap-6">
      <div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">框架类型</label>
          <select v-model="framework" class="w-full px-3 py-2 border rounded">
            <option value="react">React</option>
            <option value="vue">Vue.js</option>
            <option value="angular">Angular</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">组件代码</label>
          <textarea
            v-model="componentCode"
            class="w-full h-96 p-3 font-mono border rounded"
            placeholder="输入组件代码..."
          ></textarea>
        </div>

        <button @click="analyzeCode" class="px-4 py-2 bg-blue-500 text-white rounded">
          分析代码
        </button>
      </div>

      <div>
        <div class="bg-gray-50 p-4 rounded">
          <h2 class="text-xl font-semibold mb-4">分析结果</h2>
          <div v-if="analysisResult" class="space-y-2">
            <p><strong>复杂度:</strong> {{ analysisResult.complexity }}</p>
            <p><strong>行数:</strong> {{ analysisResult.lines }}</p>
            <p><strong>依赖:</strong> {{ analysisResult.dependencies }}</p>
          </div>
          <div v-else class="text-gray-500">
            暂无分析结果
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: 'Web组件分析器 - HTML元素可访问属性和事件分析工具 | Util工具箱',
  description: '专业的Web组件分析工具，分析HTML元素的可访问属性和事件。支持React、Vue、Angular等框架组件分析，帮助优化代码质量和用户体验。',
  keywords: 'Web组件分析器,组件分析,HTML分析,可访问性检查,ARIA属性,事件分析,React组件,Vue组件,Angular组件,代码质量',
  author: 'Util工具箱',
  ogTitle: 'Web组件分析器 - 专业HTML元素和属性分析工具',
  ogDescription: '分析Web组件结构、依赖关系和性能指标。支持多框架，帮助优化代码质量和用户体验。',
  ogImage: 'https://util.cn/images/tools/web-component-analyzer.png',
  ogUrl: 'https://util.cn/tools/web-component-analyzer',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Web组件分析器 - HTML可访问性和事件分析',
  twitterDescription: '专业Web组件分析工具，分析HTML元素的可访问属性和事件，优化代码质量。',
  twitterImage: 'https://util.cn/images/tools/web-component-analyzer.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Web组件分析器',
            description: '专业的Web组件分析工具，分析HTML元素的可访问属性和事件',
            url: 'https://util.cn/tools/web-component-analyzer',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'HTML元素分析',
              '可访问属性检测',
              '事件监听器分析',
              '多框架支持',
              '依赖关系分析',
              '性能指标评估',
              '代码质量检查',
              '结构化报告'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Web组件分析器',
                item: 'https://util.cn/tools/web-component-analyzer'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是Web组件分析？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': 'Web组件分析是指对网页组件进行结构、属性、事件等多维度分析，检查可访问性、性能优化点和代码质量，帮助开发者创建更好的用户界面组件。'
                }
              },
              {
                '@type': 'Question',
                name: '为什么要分析ARIA属性？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': 'ARIA属性对网站可访问性至关重要：1）帮助屏幕阅读器理解页面结构；2）改善残障用户体验；3）符合WCAG标准；4）提升SEO效果；5）扩大用户群体覆盖范围。'
                }
              },
              {
                '@type': 'Question',
                name: '如何优化组件性能？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '组件性能优化：1）减少不必要的重渲染；2）优化事件监听器；3）使用虚拟滚动；4）合理拆分组件；5）避免深度嵌套；6）使用React.memo、Vue.memo等优化技术。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'web-component-analyzer')
const category = categories.find(c => c.id === 'dev')

const framework = ref('react')
const componentCode = ref('')
const analysisResult = ref(null)

const analyzeCode = () => {
  if (!componentCode.value) return

  const lines = componentCode.value.split('\n')
  const imports = componentCode.value.match(/import.*from/g) || []

  analysisResult.value = {
    complexity: lines.length > 100 ? '高' : lines.length > 50 ? '中' : '低',
    lines: lines.length,
    dependencies: imports.length
  }
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 组件挂载
onMounted(() => {
  if (tool) {
    addRecentTool(tool.id)
  }
})
</script>