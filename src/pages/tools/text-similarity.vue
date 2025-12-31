<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文本相似度计算工具</h1>
      <p class="text-gray-600 dark:text-gray-400">计算两段文本的相似度，基于编辑距离(Levenshtein距离)</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">文本 1</h2>
        <textarea
          v-model="text1"
          class="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入第一段文本..."
          @input="calculate"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">文本 2</h2>
        <textarea
          v-model="text2"
          class="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入第二段文本..."
          @input="calculate"
        ></textarea>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相似度结果</h2>

      <div class="grid md:grid-cols-4 gap-4 mb-6">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <div class="text-3xl font-bold text-blue-600">{{ similarity }}%</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">相似度</div>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <div class="text-3xl font-bold text-green-600">{{ distance }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">编辑距离</div>
        </div>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <div class="text-3xl font-bold text-purple-600">{{ maxLen }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">最大长度</div>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
          <div class="text-3xl font-bold text-orange-600">{{ operation }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">需要操作</div>
        </div>
      </div>

      <!-- 相似度进度条 -->
      <div class="mb-4">
        <div class="flex justify-between text-sm mb-1">
          <span>相似度</span>
          <span>{{ similarity }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
          <div
            class="h-4 rounded-full transition-all"
            :class="similarity >= 80 ? 'bg-green-500' : similarity >= 50 ? 'bg-yellow-500' : 'bg-red-500'"
            :style="{ width: `${similarity}%` }"
          ></div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">计算说明</h2>
      <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p><strong>编辑距离 (Levenshtein距离):</strong> 将一段文本转换为另一段文本所需的最少单字符编辑（插入、删除或替换）操作次数。</p>
        <p><strong>相似度计算:</strong> 相似度 = (1 - 编辑距离 / 最大长度) × 100%</p>
        <p><strong>应用场景:</strong> 内容去重、查重检测、版本对比、模糊匹配等。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '文本相似度计算工具 - 编辑距离算法',
  meta: [{ name: 'description', content: '在线文本相似度计算工具，基于编辑距离(Levenshtein距离)算法计算两段文本的相似度。' }],
  keywords: ['文本相似度', '编辑距离', 'Levenshtein', '文本对比', '模糊匹配', '查重']
})

const text1 = ref('')
const text2 = ref('')

const distance = ref(0)
const maxLen = ref(0)
const similarity = ref(100)
const operation = ref(0)

function calculate() {
  const t1 = text1.value
  const t2 = text2.value

  distance.value = levenshtein(t1, t2)
  maxLen.value = Math.max(t1.length, t2.length)
  similarity.value = maxLen.value > 0
    ? ((1 - distance.value / maxLen.value) * 100).toFixed(2)
    : '100.00'
  operation.value = distance.value
}

// Levenshtein距离算法
function levenshtein(s1: string, s2: string): number {
  const len1 = s1.length
  const len2 = s2.length

  if (len1 === 0) return len2
  if (len2 === 0) return len1

  const matrix: number[][] = []

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // 删除
          matrix[i][j - 1] + 1,    // 插入
          matrix[i - 1][j - 1] + 1  // 替换
        )
      }
    }
  }

  return matrix[len2][len1]
}

text1.value = 'hello world'
text2.value = 'hello word'
calculate()
</script>
