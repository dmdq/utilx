<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">向量计算器 - 向量运算点积叉积角度计算</h1>
      <p class="text-muted-foreground">在线向量计算器，支持2D和3D向量运算。计算向量加减、点积、叉积、夹角、投影等，适用于数学、物理、工程等领域。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="mb-8">
      <!-- 维度选择 -->
      <div class="bg-card border border-border rounded-xl p-6 mb-6">
        <div class="flex gap-4 items-center">
          <label class="text-sm font-medium text-foreground">向量维度:</label>
          <button
            @click="dimension = 2"
            :class="['px-4 py-2 rounded-lg transition-colors', dimension === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80']"
          >
            2D
          </button>
          <button
            @click="dimension = 3"
            :class="['px-4 py-2 rounded-lg transition-colors', dimension === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80']"
          >
            3D
          </button>
        </div>
      </div>

      <!-- 向量输入 -->
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div class="bg-card border border-border rounded-xl p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">向量 A</h2>
          <div class="flex gap-2 items-center">
            <span class="text-muted-foreground">(</span>
            <input v-model.number="vectorA.x" type="number" step="0.01" class="flex-1 px-3 py-2 border border-border rounded bg-muted" placeholder="x">
            <span v-if="dimension === 3" class="text-muted-foreground">,</span>
            <input v-if="dimension === 3" v-model.number="vectorA.y" type="number" step="0.01" class="flex-1 px-3 py-2 border border-border rounded bg-muted" placeholder="y">
            <span class="text-muted-foreground">,</span>
            <input v-model.number="vectorA.z" type="number" step="0.01" class="flex-1 px-3 py-2 border border-border rounded bg-muted" placeholder="z">
            <span class="text-muted-foreground">)</span>
          </div>
          <p class="text-sm text-primary mt-2">|A| = {{ magnitudeA.toFixed(4) }}</p>
        </div>

        <div class="bg-card border border-border rounded-xl p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">向量 B</h2>
          <div class="flex gap-2 items-center">
            <span class="text-muted-foreground">(</span>
            <input v-model.number="vectorB.x" type="number" step="0.01" class="flex-1 px-3 py-2 border border-border rounded bg-muted" placeholder="x">
            <span v-if="dimension === 3" class="text-muted-foreground">,</span>
            <input v-if="dimension === 3" v-model.number="vectorB.y" type="number" step="0.01" class="flex-1 px-3 py-2 border border-border rounded bg-muted" placeholder="y">
            <span class="text-muted-foreground">,</span>
            <input v-model.number="vectorB.z" type="number" step="0.01" class="flex-1 px-3 py-2 border border-border rounded bg-muted" placeholder="z">
            <span class="text-muted-foreground">)</span>
          </div>
          <p class="text-sm text-primary mt-2">|B| = {{ magnitudeB.toFixed(4) }}</p>
        </div>
      </div>

      <!-- 运算结果 -->
      <div class="grid md:grid-cols-3 gap-4 mb-6">
        <div class="bg-card border border-border rounded-xl p-4">
          <h3 class="font-medium text-foreground mb-2">A + B</h3>
          <p class="text-lg font-semibold text-green-600">{{ vectorSum }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-4">
          <h3 class="font-medium text-foreground mb-2">A - B</h3>
          <p class="text-lg font-semibold text-red-600">{{ vectorDiff }}</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-4">
          <h3 class="font-medium text-foreground mb-2">点积 A·B</h3>
          <p class="text-lg font-semibold text-blue-600">{{ dotProduct }}</p>
        </div>
      </div>

      <div v-if="dimension === 3" class="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 class="font-medium text-foreground mb-2">叉积 A × B</h3>
        <p class="text-lg font-semibold text-purple-600">{{ crossProduct }}</p>
      </div>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="bg-card border border-border rounded-xl p-4">
          <h3 class="font-medium text-foreground mb-2">夹角</h3>
          <p class="text-lg font-semibold text-orange-600">{{ angle }}°</p>
          <p class="text-sm text-muted-foreground">{{ (angle * Math.PI / 180).toFixed(4) }} rad</p>
        </div>
        <div class="bg-card border border-border rounded-xl p-4">
          <h3 class="font-medium text-foreground mb-2">投影</h3>
          <p class="text-sm text-muted-foreground">A在B上的投影: {{ projectionAonB }}</p>
          <p class="text-sm text-muted-foreground">B在A上的投影: {{ projectionBonA }}</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是向量计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          向量是既有大小又有方向的量，在数学、物理、工程等领域有广泛应用。向量计算包括向量的加减、点积（内积）、叉积（外积）、夹角计算、投影等基本运算。
          这些运算在计算机图形学、物理学、工程学、机器学习等领域都是基础且重要的数学工具。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择向量维度（2D或3D）</li>
          <li>输入两个向量的坐标值</li>
          <li>实时查看运算结果，包括加减、点积、叉积等</li>
          <li>查看向量夹角和投影结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          向量运算说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>向量加法</strong>: 对应分量相加，结果仍为向量</li>
          <li><strong>向量减法</strong>: 对应分量相减，结果仍为向量</li>
          <li><strong>点积 (内积)</strong>: 对应分量相乘再相加，结果为标量</li>
          <li><strong>叉积 (外积)</strong>: 仅3D向量，结果为垂直于两向量的新向量</li>
          <li><strong>向量夹角</strong>: 通过点积公式计算，结果以度数和弧度显示</li>
          <li><strong>向量投影</strong>: 一个向量在另一个向量上的投影长度和方向</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是向量的模（长度）？</h3>
            <p class="text-muted-foreground mt-1">
              向量的模是向量的大小，通过勾股定理计算。对于2D向量(x, z)，模为√(x² + z²)；对于3D向量(x, y, z)，模为√(x² + y² + z²)。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">点积和叉积有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              点积的结果是一个标量（数值），表示两个向量的相似程度；叉积的结果是一个向量，新向量垂直于原来的两个向量。
              点积可以计算夹角，叉积可以计算法向量。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">向量投影在实际中有什么用？</h3>
            <p class="text-muted-foreground mt-1">
              向量投影在物理、工程等领域有广泛应用，例如计算力在某个方向的分量、计算机图形学中的光照计算、
              机器学习中的特征降维等。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp, Calculator, Hash, Globe, FileText } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '向量计算器 - 向量运算点积叉积角度计算 | Util工具箱',
  description: '在线向量计算器，支持2D和3D向量运算。计算向量加减、点积、叉积、夹角、投影等。适用于数学、物理、工程等领域，实时计算结果。',
  keywords: '向量计算,向量运算,点积,叉积,向量夹角,2D向量,3D向量,向量投影',
  author: 'Util工具箱',
  ogTitle: '向量计算器 - 在线向量运算工具',
  ogDescription: '专业的向量计算工具，支持2D/3D向量加减、点积、叉积、夹角、投影计算。实时结果，适用于数学、物理、工程领域。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '向量计算器 - 在线向量运算工具',
  twitterDescription: '专业的向量计算工具，支持2D/3D向量加减、点积、叉积、夹角、投影计算。'
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
            name: '向量计算器',
            description: '在线向量计算工具，支持2D和3D向量运算',
            url: 'https://www.util.cn/tools/vector-calculator',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '2D向量运算',
              '3D向量运算',
              '向量加减法',
              '点积计算',
              '叉积计算',
              '夹角计算',
              '向量投影'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '向量计算器',
                item: 'https://www.util.cn/tools/vector-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是向量的模（长度）？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '向量的模是向量的大小，通过勾股定理计算。对于2D向量，模为√(x² + z²)；对于3D向量，模为√(x² + y² + z²)。'
                }
              },
              {
                '@type': 'Question',
                name: '点积和叉积有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '点积的结果是一个标量（数值），表示两个向量的相似程度；叉积的结果是一个向量，新向量垂直于原来的两个向量。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const dimension = ref(2)
const vectorA = ref({ x: 1, y: 0, z: 0 })
const vectorB = ref({ x: 0, y: 1, z: 0 })

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Calculator, Hash, Globe, FileText
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'matrix-calculator'),
    tools.find(t => t.id === 'scientific-calculator'),
    tools.find(t => t.id === 'unit-converter'),
    tools.find(t => t.id === 'big-number-calculator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

const magnitudeA = computed(() => {
  if (dimension.value === 2) {
    return Math.sqrt(vectorA.value.x ** 2 + vectorA.value.z ** 2)
  }
  return Math.sqrt(vectorA.value.x ** 2 + vectorA.value.y ** 2 + vectorA.value.z ** 2)
})

const magnitudeB = computed(() => {
  if (dimension.value === 2) {
    return Math.sqrt(vectorB.value.x ** 2 + vectorB.value.z ** 2)
  }
  return Math.sqrt(vectorB.value.x ** 2 + vectorB.value.y ** 2 + vectorB.value.z ** 2)
})

const vectorSum = computed(() => {
  if (dimension.value === 2) {
    return `(${(vectorA.value.x + vectorB.value.x).toFixed(2)}, ${(vectorA.value.z + vectorB.value.z).toFixed(2)})`
  }
  return `(${(vectorA.value.x + vectorB.value.x).toFixed(2)}, ${(vectorA.value.y + vectorB.value.y).toFixed(2)}, ${(vectorA.value.z + vectorB.value.z).toFixed(2)})`
})

const vectorDiff = computed(() => {
  if (dimension.value === 2) {
    return `(${(vectorA.value.x - vectorB.value.x).toFixed(2)}, ${(vectorA.value.z - vectorB.value.z).toFixed(2)})`
  }
  return `(${(vectorA.value.x - vectorB.value.x).toFixed(2)}, ${(vectorA.value.y - vectorB.value.y).toFixed(2)}, ${(vectorA.value.z - vectorB.value.z).toFixed(2)})`
})

const dotProduct = computed(() => {
  if (dimension.value === 2) {
    return (vectorA.value.x * vectorB.value.x + vectorA.value.z * vectorB.value.z).toFixed(4)
  }
  return (vectorA.value.x * vectorB.value.x + vectorA.value.y * vectorB.value.y + vectorA.value.z * vectorB.value.z).toFixed(4)
})

const crossProduct = computed(() => {
  if (dimension.value === 2) return 'N/A'
  const x = vectorA.value.y * vectorB.value.z - vectorA.value.z * vectorB.value.y
  const y = vectorA.value.z * vectorB.value.x - vectorA.value.x * vectorB.value.z
  const z = vectorA.value.x * vectorB.value.y - vectorA.value.y * vectorB.value.x
  return `(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`
})

const angle = computed(() => {
  const dot = parseFloat(dotProduct.value)
  const ang = Math.acos(dot / (magnitudeA.value * magnitudeB.value)) * 180 / Math.PI
  return isNaN(ang) ? 0 : ang.toFixed(2)
})

const projectionAonB = computed(() => {
  const dot = parseFloat(dotProduct.value)
  const magB2 = magnitudeB.value ** 2
  if (magB2 === 0) return 'N/A'
  const scalar = dot / magB2
  if (dimension.value === 2) {
    return `${scalar.toFixed(4)} × (${vectorB.value.x.toFixed(2)}, ${vectorB.value.z.toFixed(2)})`
  }
  return `${scalar.toFixed(4)} × (${vectorB.value.x.toFixed(2)}, ${vectorB.value.y.toFixed(2)}, ${vectorB.value.z.toFixed(2)})`
})

const projectionBonA = computed(() => {
  const dot = parseFloat(dotProduct.value)
  const magA2 = magnitudeA.value ** 2
  if (magA2 === 0) return 'N/A'
  const scalar = dot / magA2
  if (dimension.value === 2) {
    return `${scalar.toFixed(4)} × (${vectorA.value.x.toFixed(2)}, ${vectorA.value.z.toFixed(2)})`
  }
  return `${scalar.toFixed(4)} × (${vectorA.value.x.toFixed(2)}, ${vectorA.value.y.toFixed(2)}, ${vectorA.value.z.toFixed(2)})`
})

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
