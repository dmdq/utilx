<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">向量计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">向量运算、点积叉积、角度计算、2D/3D支持</p>
    </div>

    <!-- 维度选择 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex gap-4 items-center">
        <label class="text-sm font-medium">向量维度:</label>
        <button
          @click="dimension = 2"
          :class="['px-4 py-2 rounded-lg', dimension === 2 ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700']"
        >
          2D
        </button>
        <button
          @click="dimension = 3"
          :class="['px-4 py-2 rounded-lg', dimension === 3 ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700']"
        >
          3D
        </button>
      </div>
    </div>

    <!-- 向量输入 -->
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">向量 A</h2>
        <div class="flex gap-2 items-center">
          <span class="text-gray-500">(</span>
          <input v-model.number="vectorA.x" type="number" step="0.01" class="flex-1 px-3 py-2 border rounded dark:bg-gray-700" placeholder="x">
          <span v-if="dimension === 3" class="text-gray-500">,</span>
          <input v-if="dimension === 3" v-model.number="vectorA.y" type="number" step="0.01" class="flex-1 px-3 py-2 border rounded dark:bg-gray-700" placeholder="y">
          <span class="text-gray-500">,</span>
          <input v-model.number="vectorA.z" type="number" step="0.01" class="flex-1 px-3 py-2 border rounded dark:bg-gray-700" placeholder="z">
          <span class="text-gray-500">)</span>
        </div>
        <p class="text-sm text-blue-600 mt-2">|A| = {{ magnitudeA.toFixed(4) }}</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">向量 B</h2>
        <div class="flex gap-2 items-center">
          <span class="text-gray-500">(</span>
          <input v-model.number="vectorB.x" type="number" step="0.01" class="flex-1 px-3 py-2 border rounded dark:bg-gray-700" placeholder="x">
          <span v-if="dimension === 3" class="text-gray-500">,</span>
          <input v-if="dimension === 3" v-model.number="vectorB.y" type="number" step="0.01" class="flex-1 px-3 py-2 border rounded dark:bg-gray-700" placeholder="y">
          <span class="text-gray-500">,</span>
          <input v-model.number="vectorB.z" type="number" step="0.01" class="flex-1 px-3 py-2 border rounded dark:bg-gray-700" placeholder="z">
          <span class="text-gray-500">)</span>
        </div>
        <p class="text-sm text-purple-600 mt-2">|B| = {{ magnitudeB.toFixed(4) }}</p>
      </div>
    </div>

    <!-- 运算结果 -->
    <div class="grid md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <h3 class="font-medium mb-2">A + B</h3>
        <p class="text-lg font-semibold text-green-600">{{ vectorSum }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <h3 class="font-medium mb-2">A - B</h3>
        <p class="text-lg font-semibold text-red-600">{{ vectorDiff }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <h3 class="font-medium mb-2">点积 A·B</h3>
        <p class="text-lg font-semibold text-blue-600">{{ dotProduct }}</p>
      </div>
    </div>

    <div v-if="dimension === 3" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
      <h3 class="font-medium mb-2">叉积 A × B</h3>
      <p class="text-lg font-semibold text-purple-600">{{ crossProduct }}</p>
    </div>

    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <h3 class="font-medium mb-2">夹角</h3>
        <p class="text-lg font-semibold text-orange-600">{{ angle }}°</p>
        <p class="text-sm text-gray-500">{{ (angle * Math.PI / 180).toFixed(4) }} rad</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <h3 class="font-medium mb-2">投影</h3>
        <p class="text-sm">A在B上的投影: {{ projectionAonB }}</p>
        <p class="text-sm">B在A上的投影: {{ projectionBonA }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '向量计算器 - 向量运算点积叉积',
  meta: [{ name: 'description', content: '在线向量计算器，支持2D和3D向量运算。计算向量加减、点积、叉积、夹角、投影等。' }],
  keywords: ['向量计算', '向量运算', '点积', '叉积', '向量夹角', '2D向量', '3D向量']
})

const dimension = ref(2)
const vectorA = ref({ x: 1, y: 0, z: 0 })
const vectorB = ref({ x: 0, y: 1, z: 0 })

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
</script>
