<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">GPA计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">成绩绩点计算、加权平均、目标GPA规划</p>
    </div>

    <!-- GPA设置 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">GPA设置</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">绩点标准</label>
          <select v-model="gpaScale" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="4.0">4.0 标准制</option>
            <option value="5.0">5.0 标准制</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div v-if="gpaScale === 'custom'">
          <label class="block text-sm font-medium mb-2">最高绩点</label>
          <input
            v-model.number="customMaxGpa"
            type="number"
            step="0.1"
            min="1"
            max="10"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
        </div>
      </div>

      <!-- 成绩等级对照表 -->
      <div class="mt-4">
        <h3 class="text-sm font-medium mb-2">成绩等级对照表</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b dark:border-gray-700">
                <th class="text-left py-2">等级</th>
                <th class="text-left py-2">分数范围</th>
                <th class="text-left py-2">绩点</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="grade in gradeScale" :key="grade.grade" class="border-b dark:border-gray-700">
                <td class="py-2 font-medium">{{ grade.grade }}</td>
                <td class="py-2">{{ grade.min }} - {{ grade.max }}分</td>
                <td class="py-2 text-blue-600 dark:text-blue-400">{{ grade.point }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 课程成绩输入 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">课程成绩</h2>
        <button
          @click="addCourse"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          + 添加课程
        </button>
      </div>

      <div v-if="courses.length === 0" class="p-8 text-center text-gray-400">
        点击"添加课程"按钮开始添加成绩
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(course, index) in courses"
          :key="index"
          class="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="flex-1">
            <input
              v-model="course.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="课程名称"
            >
          </div>
          <div class="w-24">
            <input
              v-model.number="course.credit"
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="学分"
            >
          </div>
          <div class="w-24">
            <input
              v-model.number="course.score"
              type="number"
              min="0"
              max="100"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="成绩"
            >
          </div>
          <div class="w-20 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-center">
            <span class="text-sm font-medium" :class="getGradeColor(course.score)">
              {{ getGrade(course.score) }}
            </span>
          </div>
          <button
            @click="removeCourse(index)"
            class="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- 快捷添加 -->
      <div class="mt-4">
        <button
          @click="loadSampleData"
          class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          加载示例数据
        </button>
      </div>
    </div>

    <!-- 计算结果 -->
    <div v-if="courses.length > 0" class="grid md:grid-cols-3 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-semibold mb-2">GPA</h3>
        <p class="text-4xl font-bold text-blue-600 dark:text-blue-400">
          {{ gpa.toFixed(2) }}
        </p>
        <p class="text-sm text-gray-500 mt-1">满分 {{ maxGpa }}</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-semibold mb-2">总学分</h3>
        <p class="text-4xl font-bold text-green-600 dark:text-green-400">
          {{ totalCredits }}
        </p>
        <p class="text-sm text-gray-500 mt-1">共 {{ courses.length }} 门课程</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-semibold mb-2">加权平均分</h3>
        <p class="text-4xl font-bold text-purple-600 dark:text-purple-400">
          {{ weightedAverage.toFixed(1) }}
        </p>
        <p class="text-sm text-gray-500 mt-1">百分制</p>
      </div>
    </div>

    <!-- 目标GPA规划 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">目标GPA规划</h2>

      <div class="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-1">目标GPA</label>
          <input
            v-model.number="targetGpa"
            type="number"
            step="0.01"
            min="0"
            :max="maxGpa"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">剩余学分</label>
          <input
            v-model.number="remainingCredits"
            type="number"
            min="0"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">预计课程数</label>
          <input
            v-model.number="remainingCourses"
            type="number"
            min="1"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
        </div>
      </div>

      <div v-if="targetGpa > 0 && remainingCredits > 0" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 class="font-medium mb-2">达到目标需要的平均成绩</h3>
        <div class="flex items-center gap-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">所需平均绩点</p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ requiredGpa.toFixed(2) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">所需平均分</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ requiredScore.toFixed(1) }}分
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">平均等级</p>
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ getGradeFromScore(requiredScore) }}
            </p>
          </div>
        </div>

        <div v-if="requiredGpa > maxGpa" class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">
            ⚠️ 无法达到目标：所需绩点 {{ requiredGpa.toFixed(2) }} 超过最高绩点 {{ maxGpa }}
          </p>
        </div>
        <div v-else class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p class="text-sm text-green-600 dark:text-green-400">
            ✓ 可以达到目标，剩余课程需要保持 {{ getGradeFromScore(requiredScore) }} 以上
          </p>
        </div>
      </div>
    </div>

    <!-- 成绩分布 -->
    <div v-if="courses.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">成绩分布</h2>
      <div class="space-y-3">
        <div v-for="item in gradeDistribution" :key="item.grade" class="flex items-center gap-3">
          <div class="w-16 text-sm font-medium">{{ item.grade }}</div>
          <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
            <div
              class="h-4 rounded-full transition-all"
              :style="{
                width: item.percentage + '%',
                backgroundColor: item.color
              }"
            ></div>
          </div>
          <div class="w-20 text-sm text-right">{{ item.count }}门 ({{ item.percentage.toFixed(0) }}%)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'

useHead({
  title: 'GPA计算器 - 成绩绩点计算工具',
  meta: [{ name: 'description', content: '在线GPA计算器，支持4.0和5.0绩点标准，计算加权平均GPA、目标GPA规划和成绩分布分析。适用于大学生学业成绩管理。' }],
  keywords: ['GPA计算', '绩点计算', '加权平均', '成绩计算', '目标GPA', '大学成绩']
})

interface Course {
  name: string
  credit: number
  score: number
}

const gpaScale = ref<'4.0' | '5.0' | 'custom'>('4.0')
const customMaxGpa = ref<number>(4.0)
const courses = ref<Course[]>([])
const targetGpa = ref<number>(3.5)
const remainingCredits = ref<number>(30)
const remainingCourses = ref<number>(10)

const maxGpa = computed(() => {
  if (gpaScale.value === 'custom') return customMaxGpa.value
  return parseFloat(gpaScale.value)
})

const gradeScale = computed(() => {
  if (gpaScale.value === '5.0') {
    return [
      { grade: 'A', min: 90, max: 100, point: 5.0 },
      { grade: 'A-', min: 85, max: 89, point: 4.5 },
      { grade: 'B+', min: 80, max: 84, point: 4.0 },
      { grade: 'B', min: 75, max: 79, point: 3.5 },
      { grade: 'B-', min: 70, max: 74, point: 3.0 },
      { grade: 'C+', min: 65, max: 69, point: 2.5 },
      { grade: 'C', min: 60, max: 64, point: 2.0 },
      { grade: 'D', min: 50, max: 59, point: 1.0 },
      { grade: 'F', min: 0, max: 49, point: 0 }
    ]
  }
  return [
    { grade: 'A', min: 90, max: 100, point: 4.0 },
    { grade: 'B', min: 80, max: 89, point: 3.0 },
    { grade: 'C', min: 70, max: 79, point: 2.0 },
    { grade: 'D', min: 60, max: 69, point: 1.0 },
    { grade: 'F', min: 0, max: 59, point: 0 }
  ]
})

const totalCredits = computed(() => {
  return courses.value.reduce((sum, course) => sum + (course.credit || 0), 0)
})

const totalPoints = computed(() => {
  return courses.value.reduce((sum, course) => {
    const point = getPointFromScore(course.score)
    return sum + point * (course.credit || 0)
  }, 0)
})

const gpa = computed(() => {
  if (totalCredits.value === 0) return 0
  return totalPoints.value / totalCredits.value
})

const weightedAverage = computed(() => {
  if (totalCredits.value === 0) return 0
  const totalScore = courses.value.reduce((sum, course) => {
    return sum + (course.score || 0) * (course.credit || 0)
  }, 0)
  return totalScore / totalCredits.value
})

const requiredGpa = computed(() => {
  if (remainingCredits.value === 0) return 0
  const currentPoints = totalPoints.value
  const currentCredits = totalCredits.value
  const targetPoints = targetGpa.value * (currentCredits + remainingCredits.value)
  const remainingPoints = targetPoints - currentPoints
  return remainingPoints / remainingCredits.value
})

const requiredScore = computed(() => {
  const scale = gradeScale.value
  const maxPoint = scale[0].point
  const minPoint = scale[scale.length - 1].point

  if (requiredGpa.value >= maxPoint) return 100
  if (requiredGpa.value <= minPoint) return 0

  // 简单线性映射
  const ratio = (requiredGpa.value - minPoint) / (maxPoint - minPoint)
  return 60 + ratio * 40
})

const gradeDistribution = computed(() => {
  const distribution: Record<string, { count: number; color: string }> = {}

  courses.value.forEach(course => {
    const grade = getGrade(course.score)
    if (!distribution[grade]) {
      distribution[grade] = { count: 0, color: getGradeColor(course.score) }
    }
    distribution[grade].count++
  })

  return Object.entries(distribution)
    .map(([grade, data]) => ({
      grade,
      count: data.count,
      percentage: (data.count / courses.value.length) * 100,
      color: data.color
    }))
    .sort((a, b) => b.count - a.count)
})

function addCourse() {
  courses.value.push({
    name: '',
    credit: 3,
    score: 85
  })
}

function removeCourse(index: number) {
  courses.value.splice(index, 1)
}

function loadSampleData() {
  courses.value = [
    { name: '高等数学', credit: 4, score: 92 },
    { name: '大学英语', credit: 3, score: 88 },
    { name: '程序设计', credit: 4, score: 95 },
    { name: '数据结构', credit: 3, score: 85 },
    { name: '线性代数', credit: 3, score: 78 }
  ]
}

function getGrade(score: number): string {
  if (isNaN(score) || score === null) return 'N/A'
  const scale = gradeScale.value
  for (const item of scale) {
    if (score >= item.min && score <= item.max) {
      return item.grade
    }
  }
  return 'F'
}

function getPointFromScore(score: number): number {
  if (isNaN(score) || score === null) return 0
  const scale = gradeScale.value
  for (const item of scale) {
    if (score >= item.min && score <= item.max) {
      return item.point
    }
  }
  return 0
}

function getGradeColor(score: number): string {
  if (isNaN(score) || score === null) return '#9CA3AF'
  if (score >= 90) return '#10B981' // green
  if (score >= 80) return '#3B82F6' // blue
  if (score >= 70) return '#F59E0B' // yellow
  if (score >= 60) return '#F97316' // orange
  return '#EF4444' // red
}

function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 85) return gpaScale.value === '5.0' ? 'A-' : 'A'
  if (score >= 80) return gpaScale.value === '5.0' ? 'B+' : 'B'
  if (score >= 75) return 'B'
  if (score >= 70) return gpaScale.value === '5.0' ? 'B-' : 'C'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}
</script>
