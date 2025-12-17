<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">CSS布局生成器</h1>
      <p class="text-muted-foreground mb-4">可视化生成Flexbox和Grid布局代码，支持实时预览和导出</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 布局类型选择 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">布局类型</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="type in layoutTypes"
              :key="type.id"
              @click="layoutType = type.id"
              :class="[
                'px-4 py-2 rounded-md transition-colors text-sm font-medium',
                layoutType === type.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              ]"
            >
              {{ type.name }}
            </button>
          </div>
        </div>

        <!-- Flexbox配置 -->
        <div v-if="layoutType === 'flexbox'" class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">Flexbox配置</h3>

          <div class="space-y-4">
            <!-- 方向 -->
            <div>
              <label class="block text-sm font-medium mb-2">flex-direction</label>
              <select v-model="flexConfig.direction" class="w-full px-3 py-2 border rounded-md">
                <option value="row">row (横向)</option>
                <option value="row-reverse">row-reverse (横向反向)</option>
                <option value="column">column (纵向)</option>
                <option value="column-reverse">column-reverse (纵向反向)</option>
              </select>
            </div>

            <!-- 换行 -->
            <div>
              <label class="block text-sm font-medium mb-2">flex-wrap</label>
              <select v-model="flexConfig.wrap" class="w-full px-3 py-2 border rounded-md">
                <option value="nowrap">nowrap (不换行)</option>
                <option value="wrap">wrap (换行)</option>
                <option value="wrap-reverse">wrap-reverse (反向换行)</option>
              </select>
            </div>

            <!-- 主轴对齐 -->
            <div>
              <label class="block text-sm font-medium mb-2">justify-content</label>
              <select v-model="flexConfig.justifyContent" class="w-full px-3 py-2 border rounded-md">
                <option value="flex-start">flex-start (起点对齐)</option>
                <option value="flex-end">flex-end (终点对齐)</option>
                <option value="center">center (居中)</option>
                <option value="space-between">space-between (两端对齐)</option>
                <option value="space-around">space-around (环绕对齐)</option>
                <option value="space-evenly">space-evenly (平均分布)</option>
              </select>
            </div>

            <!-- 交叉轴对齐 -->
            <div>
              <label class="block text-sm font-medium mb-2">align-items</label>
              <select v-model="flexConfig.alignItems" class="w-full px-3 py-2 border rounded-md">
                <option value="stretch">stretch (拉伸)</option>
                <option value="flex-start">flex-start (起点对齐)</option>
                <option value="flex-end">flex-end (终点对齐)</option>
                <option value="center">center (居中)</option>
                <option value="baseline">baseline (基线对齐)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Grid配置 -->
        <div v-if="layoutType === 'grid'" class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">Grid配置</h3>

          <div class="space-y-4">
            <!-- 列数 -->
            <div>
              <label class="block text-sm font-medium mb-2">grid-template-columns</label>
              <input
                v-model="gridConfig.columns"
                placeholder="如: 1fr 2fr 1fr 或 repeat(3, 1fr)"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <!-- 行数 -->
            <div>
              <label class="block text-sm font-medium mb-2">grid-template-rows</label>
              <input
                v-model="gridConfig.rows"
                placeholder="如: 100px auto 1fr"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <!-- 间距 -->
            <div>
              <label class="block text-sm font-medium mb-2">gap</label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model="gridConfig.gapX"
                  placeholder="列间距"
                  class="px-3 py-2 border rounded-md"
                >
                <input
                  v-model="gridConfig.gapY"
                  placeholder="行间距"
                  class="px-3 py-2 border rounded-md"
                >
              </div>
            </div>

            <!-- 预设模板 -->
            <div>
              <label class="block text-sm font-medium mb-2">快速预设</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="template in gridTemplates"
                  :key="template.id"
                  @click="applyGridTemplate(template)"
                  class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm"
                >
                  {{ template.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧预览区域 -->
      <div class="space-y-6">
        <!-- 预览窗口 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">预览</h3>
            <div class="flex gap-2">
              <button
                @click="addItem"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                添加项目
              </button>
              <button
                @click="removeItem"
                :disabled="items.length <= 1"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm disabled:opacity-50"
              >
                移除项目
              </button>
            </div>
          </div>

          <!-- 预览容器 -->
          <div
            class="preview-container min-h-[300px] border-2 border-dashed border-muted-foreground/20 rounded-lg p-4"
            :style="computedStyles"
          >
            <div
              v-for="(item, index) in items"
              :key="index"
              class="preview-item"
            >
              项目 {{ index + 1 }}
            </div>
          </div>
        </div>

        <!-- 生成的代码 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">生成的CSS代码</h3>
            <div class="flex gap-2">
              <button
                @click="copyCode"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                复制代码
              </button>
              <button
                @click="downloadCode"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                下载
              </button>
            </div>
          </div>

          <pre class="bg-muted p-4 rounded-md text-sm overflow-x-auto"><code>{{ generatedCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('CSS布局生成器 - 在线生成Flexbox和Grid布局代码')

// 布局类型
const layoutTypes = [
  { id: 'flexbox', name: 'Flexbox' },
  { id: 'grid', name: 'Grid' }
]

const layoutType = ref('flexbox')

// Flexbox配置
const flexConfig = ref({
  direction: 'row',
  wrap: 'nowrap',
  justifyContent: 'flex-start',
  alignItems: 'stretch'
})

// Grid配置
const gridConfig = ref({
  columns: 'repeat(3, 1fr)',
  rows: 'auto',
  gapX: '16px',
  gapY: '16px'
})

// Grid预设模板
const gridTemplates = [
  { id: 'two-col', name: '两栏', columns: '1fr 1fr', rows: 'auto' },
  { id: 'three-col', name: '三栏', columns: 'repeat(3, 1fr)', rows: 'auto' },
  { id: 'sidebar', name: '侧边栏', columns: '200px 1fr', rows: 'auto' },
  { id: 'holy-grail', name: '圣杯', columns: '150px 1fr 150px', rows: 'auto' }
]

// 预览项目
const items = ref([
  { id: 1, content: '项目 1' },
  { id: 2, content: '项目 2' },
  { id: 3, content: '项目 3' }
])

// 计算样式
const computedStyles = computed(() => {
  if (layoutType.value === 'flexbox') {
    return {
      display: 'flex',
      flexDirection: flexConfig.value.direction,
      flexWrap: flexConfig.value.wrap,
      justifyContent: flexConfig.value.justifyContent,
      alignItems: flexConfig.value.alignItems
    }
  } else {
    return {
      display: 'grid',
      gridTemplateColumns: gridConfig.value.columns,
      gridTemplateRows: gridConfig.value.rows,
      gap: `${gridConfig.value.gapY} ${gridConfig.value.gapX}`
    }
  }
})

// 生成CSS代码
const generatedCode = computed(() => {
  let css = '.container {\n'

  if (layoutType.value === 'flexbox') {
    css += '  display: flex;\n'
    css += `  flex-direction: ${flexConfig.value.direction};\n`
    css += `  flex-wrap: ${flexConfig.value.wrap};\n`
    css += `  justify-content: ${flexConfig.value.justifyContent};\n`
    css += `  align-items: ${flexConfig.value.alignItems};\n`
  } else {
    css += '  display: grid;\n'
    css += `  grid-template-columns: ${gridConfig.value.columns};\n`
    css += `  grid-template-rows: ${gridConfig.value.rows};\n`
    css += `  gap: ${gridConfig.value.gapY} ${gridConfig.value.gapX};\n`
  }

  css += '}\n\n'
  css += '.item {\n'
  css += '  padding: 1rem;\n'
  css += '  background-color: #f3f4f6;\n'
  css += '  border: 1px solid #e5e7eb;\n'
  css += '  border-radius: 0.375rem;\n'
  css += '  text-align: center;\n'
  css += '}'

  return css
})

// 应用Grid模板
const applyGridTemplate = (template) => {
  gridConfig.value.columns = template.columns
  gridConfig.value.rows = template.rows
}

// 添加项目
const addItem = () => {
  const newId = Math.max(...items.value.map(item => item.id)) + 1
  items.value.push({ id: newId, content: `项目 ${items.value.length + 1}` })
}

// 移除项目
const removeItem = () => {
  if (items.value.length > 1) {
    items.value.pop()
  }
}

// 复制代码
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    // 可以添加成功提示
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 下载代码
const downloadCode = () => {
  const blob = new Blob([generatedCode.value], { type: 'text/css' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'layout.css'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.preview-container {
  background-image:
    linear-gradient(45deg, #f9fafb 25%, transparent 25%),
    linear-gradient(-45deg, #f9fafb 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f9fafb 75%),
    linear-gradient(-45deg, transparent 75%, #f9fafb 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.preview-item {
  padding: 1rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  text-align: center;
  font-weight: 500;
}
</style>