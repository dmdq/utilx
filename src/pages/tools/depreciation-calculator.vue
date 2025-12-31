<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">折旧计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">直线法、双倍余额递减法、年数总和法</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">资产信息</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">原值</label>
            <input v-model.number="cost" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">残值</label>
            <input v-model.number="salvage" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">使用年限 (年)</label>
            <input v-model.number="life" type="number" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">折旧方法</label>
            <select v-model="method" class="w-full px-4 py-2 border rounded dark:bg-gray-700">
              <option value="straight">直线法</option>
              <option value="ddb">双倍余额递减法</option>
              <option value="syd">年数总和法</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">折旧表</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">年份</th>
                <th class="text-right py-2">折旧额</th>
                <th class="text-right py-2">累计折旧</th>
                <th class="text-right py-2">账面价值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in schedule" :key="row.year" class="border-b">
                <td class="py-2">{{ row.year }}</td>
                <td class="text-right">{{ row.depreciation.toFixed(2) }}</td>
                <td class="text-right">{{ row.accumulated.toFixed(2) }}</td>
                <td class="text-right">{{ row.bookValue.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '折旧计算器 - 资产折旧计算工具',
  meta: [{ name: 'description', content: '在线折旧计算器，支持直线法、双倍余额递减法、年数总和法三种折旧方法。生成固定资产折旧表。' }],
  keywords: ['折旧计算', '直线法', '双倍余额递减法', '年数总和法', '固定资产折旧', '折旧表']
})

const cost = ref(100000)
const salvage = ref(5000)
const life = ref(5)
const method = ref('straight')

const schedule = computed(() => {
  const result = []
  let bookValue = cost.value
  let accumulated = 0

  if (method.value === 'straight') {
    const annualDep = (cost.value - salvage.value) / life.value
    for (let i = 1; i <= life.value; i++) {
      accumulated += annualDep
      bookValue -= annualDep
      result.push({
        year: i,
        depreciation: annualDep,
        accumulated,
        bookValue: Math.max(salvage.value, bookValue)
      })
    }
  } else if (method.value === 'ddb') {
    const rate = 2 / life.value
    for (let i = 1; i <= life.value; i++) {
      let dep = bookValue * rate
      const remaining = cost.value - accumulated - salvage.value
      dep = Math.min(dep, remaining)
      accumulated += dep
      bookValue -= dep
      result.push({
        year: i,
        depreciation: dep,
        accumulated,
        bookValue: Math.max(salvage.value, bookValue)
      })
    }
  } else {
    let sumYears = (life.value * (life.value + 1)) / 2
    for (let i = 1; i <= life.value; i++) {
      const dep = (cost.value - salvage.value) * (life.value - i + 1) / sumYears
      accumulated += dep
      bookValue -= dep
      result.push({
        year: i,
        depreciation: dep,
        accumulated,
        bookValue: Math.max(salvage.value, bookValue)
      })
    }
  }

  return result
})
</script>
