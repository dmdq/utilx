<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">GPA计算器 - 成绩绩点计算工具</h1>
      <p class="text-muted-foreground">在线GPA计算器，支持4.0和5.0绩点标准，计算加权平均GPA、目标GPA规划和成绩分布分析。适用于大学生学业成绩管理。</p>
    </div>

    <!-- GPA设置 -->
    <div class="bg-card rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 text-foreground">GPA设置</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2 text-foreground">绩点标准</label>
          <select v-model="gpaScale" class="w-full px-4 py-2 border border-border rounded-lg bg-muted">
            <option value="4.0">4.0 标准制</option>
            <option value="5.0">5.0 标准制</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div v-if="gpaScale === 'custom'">
          <label class="block text-sm font-medium mb-2 text-foreground">最高绩点</label>
          <input
            v-model.number="customMaxGpa"
            type="number"
            step="0.1"
            min="1"
            max="10"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
          >
        </div>
      </div>

      <!-- 成绩等级对照表 -->
      <div class="mt-4">
        <h3 class="text-sm font-medium mb-2 text-foreground">成绩等级对照表</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-2 text-foreground">等级</th>
                <th class="text-left py-2 text-foreground">分数范围</th>
                <th class="text-left py-2 text-foreground">绩点</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="grade in gradeScale" :key="grade.grade" class="border-b border-border">
                <td class="py-2 font-medium text-foreground">{{ grade.grade }}</td>
                <td class="py-2 text-muted-foreground">{{ grade.min }} - {{ grade.max }}分</td>
                <td class="py-2 text-primary">{{ grade.point }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 课程成绩输入 -->
    <div class="bg-card rounded-xl p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-foreground">课程成绩</h2>
        <button
          @click="addCourse"
          class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          + 添加课程
        </button>
      </div>

      <div v-if="courses.length === 0" class="p-8 text-center text-muted-foreground">
        点击"添加课程"按钮开始添加成绩
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(course, index) in courses"
          :key="index"
          class="flex gap-3 items-start p-3 bg-muted rounded-lg"
        >
          <div class="flex-1">
            <input
              v-model="course.name"
              type="text"
              class="w-full px-3 py-2 border border-border rounded-lg bg-card"
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
              class="w-full px-3 py-2 border border-border rounded-lg bg-card"
              placeholder="学分"
            >
          </div>
          <div class="w-24">
            <input
              v-model.number="course.score"
              type="number"
              min="0"
              max="100"
              class="w-full px-3 py-2 border border-border rounded-lg bg-card"
              placeholder="成绩"
            >
          </div>
          <div class="w-20 px-3 py-2 bg-card rounded-lg text-center">
            <span class="text-sm font-medium" :style="{ color: getGradeColor(course.score) }">
              {{ getGrade(course.score) }}
            </span>
          </div>
          <button
            @click="removeCourse(index)"
            class="px-2 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- 快捷添加 -->
      <div class="mt-4">
        <button
          @click="loadSampleData"
          class="text-sm text-primary hover:underline"
        >
          加载示例数据
        </button>
      </div>
    </div>

    <!-- 计算结果 -->
    <div v-if="courses.length > 0" class="grid md:grid-cols-3 gap-6 mb-6">
      <div class="bg-card rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-2 text-foreground">GPA</h3>
        <p class="text-4xl font-bold text-primary">
          {{ gpa.toFixed(2) }}
        </p>
        <p class="text-sm text-muted-foreground mt-1">满分 {{ maxGpa }}</p>
      </div>

      <div class="bg-card rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-2 text-foreground">总学分</h3>
        <p class="text-4xl font-bold text-primary">
          {{ totalCredits }}
        </p>
        <p class="text-sm text-muted-foreground mt-1">共 {{ courses.length }} 门课程</p>
      </div>

      <div class="bg-card rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-2 text-foreground">加权平均分</h3>
        <p class="text-4xl font-bold text-primary">
          {{ weightedAverage.toFixed(1) }}
        </p>
        <p class="text-sm text-muted-foreground mt-1">百分制</p>
      </div>
    </div>

    <!-- 目标GPA规划 -->
    <div class="bg-card rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 text-foreground">目标GPA规划</h2>

      <div class="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">目标GPA</label>
          <input
            v-model.number="targetGpa"
            type="number"
            step="0.01"
            min="0"
            :max="maxGpa"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">剩余学分</label>
          <input
            v-model.number="remainingCredits"
            type="number"
            min="0"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">预计课程数</label>
          <input
            v-model.number="remainingCourses"
            type="number"
            min="1"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted"
          >
        </div>
      </div>

      <div v-if="targetGpa > 0 && remainingCredits > 0" class="p-4 bg-muted rounded-lg">
        <h3 class="font-medium mb-2 text-foreground">达到目标需要的平均成绩</h3>
        <div class="flex items-center gap-4">
          <div>
            <p class="text-sm text-muted-foreground">所需平均绩点</p>
            <p class="text-2xl font-bold text-primary">
              {{ requiredGpa.toFixed(2) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">所需平均分</p>
            <p class="text-2xl font-bold text-primary">
              {{ requiredScore.toFixed(1) }}分
            </p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">平均等级</p>
            <p class="text-2xl font-bold text-primary">
              {{ getGradeFromScore(requiredScore) }}
            </p>
          </div>
        </div>

        <div v-if="requiredGpa > maxGpa" class="mt-3 p-3 bg-destructive/20 rounded-lg">
          <p class="text-sm text-destructive">
            无法达到目标：所需绩点 {{ requiredGpa.toFixed(2) }} 超过最高绩点 {{ maxGpa }}
          </p>
        </div>
        <div v-else class="mt-3 p-3 bg-primary/20 rounded-lg">
          <p class="text-sm text-primary">
            可以达到目标，剩余课程需要保持 {{ getGradeFromScore(requiredScore) }} 以上
          </p>
        </div>
      </div>
    </div>

    <!-- 成绩分布 -->
    <div v-if="courses.length > 0" class="bg-card rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4 text-foreground">成绩分布</h2>
      <div class="space-y-3">
        <div v-for="item in gradeDistribution" :key="item.grade" class="flex items-center gap-3">
          <div class="w-16 text-sm font-medium text-foreground">{{ item.grade }}</div>
          <div class="flex-1 bg-muted rounded-full h-4 relative">
            <div
              class="h-4 rounded-full transition-all"
              :style="{
                width: item.percentage + '%',
                backgroundColor: item.color
              }"
            ></div>
          </div>
          <div class="w-20 text-sm text-right text-muted-foreground">{{ item.count }}门 ({{ item.percentage.toFixed(0) }}%)</div>
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
          什么是GPA？
        </h2>
        <p class="text-muted-foreground mb-4">
          GPA（Grade Point Average）即平均学分绩点，是衡量学生学习成绩的重要指标。
          它是根据每门课程的成绩和学分计算得出的加权平均值。GPA越高，表示学习成绩越好。
          在申请研究生、奖学金、就业等方面，GPA都是重要的参考依据。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何计算GPA？
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将每门课程的成绩转换为对应的绩点（如90分以上对应4.0）</li>
          <li>用每门课程的绩点乘以该课程的学分，得到课程学分绩点</li>
          <li>将所有课程的学分绩点相加，得到总学分绩点</li>
          <li>将总学分绩点除以总学分，得到GPA</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          GPA标准说明
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>4.0标准制</strong>: 美国最常用的GPA标准，满分为4.0。A=4.0, B=3.0, C=2.0, D=1.0, F=0</li>
          <li><strong>5.0标准制</strong>: 国内部分高校采用的标准，满分为5.0。A=5.0, B=4.0, C=3.0等</li>
          <li><strong>自定义标准</strong>: 部分学校有特殊的GPA计算方式，可以根据学校规定自定义最高绩点</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">GPA和加权平均分有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              GPA是将成绩转换为绩点后计算的加权平均值，而加权平均分直接使用百分制成绩计算。
              GPA可以更好地体现成绩等级，而加权平均分更精确地反映实际分数。
              两者都是学业成绩的重要指标，但在不同场景下可能有不同的参考价值。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何提高GPA？</h3>
            <p class="text-muted-foreground mt-1">
              提高GPA需要努力提高每门课程的成绩，特别是学分较高的课程。
              合理选课、认真完成作业、积极备考都是提高GPA的有效方法。
              使用GPA计算器设定目标GPA，可以帮助你了解需要达到的成绩水平。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">GPA多少算优秀？</h3>
            <p class="text-muted-foreground mt-1">
              一般来说，GPA 3.5以上可以算作良好，3.7以上算优秀，3.9以上算非常优秀。
              但这个标准因学校和专业而异。在申请研究生时，名校通常要求GPA在3.5以上，
              顶尖项目可能要求3.7甚至3.9以上。
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

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Trash2, HelpCircle, ChevronUp } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'GPA计算器 - 成绩绩点计算工具 | Util工具箱',
  description: '在线GPA计算器，支持4.0和5.0绩点标准，计算加权平均GPA、目标GPA规划和成绩分布分析。适用于大学生学业成绩管理。',
  keywords: 'GPA计算,绩点计算,加权平均,成绩计算,目标GPA,大学成绩,学分绩点',
  author: 'Util工具箱',
  ogTitle: 'GPA计算器 - 成绩绩点计算',
  ogDescription: '在线GPA计算器，支持4.0和5.0绩点标准，计算加权平均GPA、目标GPA规划。',
  ogType: 'website'
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
            name: 'GPA计算器',
            description: '在线GPA计算器，支持4.0和5.0绩点标准',
            url: 'https://www.util.cn/tools/gpa-calculator',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多标准GPA计算',
              '目标GPA规划',
              '成绩分布分析',
              '自定义绩点标准'
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'GPA和加权平均分有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'GPA是将成绩转换为绩点后计算的加权平均值，而加权平均分直接使用百分制成绩计算。GPA可以更好地体现成绩等级，而加权平均分更精确地反映实际分数。'
                }
              },
              {
                '@type': 'Question',
                name: '如何提高GPA？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '提高GPA需要努力提高每门课程的成绩，特别是学分较高的课程。合理选课、认真完成作业、积极备考都是提高GPA的有效方法。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

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

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap: Record<string, any> = {
  Calculator: null,
  GraduationCap: null,
}

// 相关工具
const relatedTools = computed(() => {
  return [
    tools.find(t => t.id === 'percentage-calculator'),
    tools.find(t => t.id === 'scientific-calculator'),
    tools.find(t => t.id === 'grade-calculator'),
    tools.find(t => t.id === 'unit-converter')
  ].filter(Boolean)
})
</script>
