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
import { ref } from 'vue'
import { useSEO } from '~/composables/useSEO'

setPageTitle('Web组件分析器')

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
</script>