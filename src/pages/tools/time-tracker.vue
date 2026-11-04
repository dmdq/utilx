<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">时间跟踪器 - 在线计时工具与番茄钟工时统计</h1>
      <p class="text-muted-foreground">一款免费的时间跟踪工具，支持任务计时、工时统计、番茄钟工作法，可记录和导出时间日志。纯本地计算，帮助提升时间管理和生产力，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：计时器和番茄钟 -->
      <div class="space-y-4">
        <!-- 任务计时器 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock :size="20" class="text-primary" />
            任务计时器
          </h3>

          <div class="mb-4">
            <input
              v-model="currentTask.name"
              type="text"
              :disabled="isRunning"
              class="w-full px-4 py-3 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              :class="{ 'bg-muted/50': isRunning }"
              placeholder="输入任务名称..."
            />
          </div>

          <div class="mb-4">
            <select
              v-model="currentTask.category"
              :disabled="isRunning"
              class="w-full px-4 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              :class="{ 'bg-muted/50': isRunning }"
            >
              <option v-for="cat in taskCategories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div class="text-center mb-6">
            <div class="text-6xl font-bold text-foreground font-mono mb-2">
              {{ formatTime(elapsedSeconds) }}
            </div>
            <div v-if="isRunning" class="text-sm text-primary">
              计时中...
            </div>
          </div>

          <div class="flex gap-2">
            <button
              v-if="!isRunning"
              @click="startTimer"
              :disabled="!currentTask.name.trim()"
              class="flex-1 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition flex items-center justify-center gap-2"
            >
              <Play :size="20" />
              开始
            </button>
            <button
              v-else
              @click="pauseTimer"
              class="flex-1 px-4 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Pause :size="20" />
              暂停
            </button>
            <button
              v-if="isRunning"
              @click="stopTimer"
              class="px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition"
              title="保存"
            >
              <Target :size="20" />
            </button>
            <button
              v-if="elapsedSeconds > 0"
              @click="discardTimer"
              class="px-4 py-3 bg-muted hover:bg-muted/80 text-destructive rounded-lg transition"
              title="重置"
            >
              <RotateCcw :size="20" />
            </button>
          </div>
        </div>

        <!-- 番茄钟 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target :size="20" class="text-primary" />
            番茄钟
          </h3>

          <div class="flex gap-2 mb-4">
            <div class="flex-1">
              <label class="text-xs text-muted-foreground mb-1 block">工作时长(分钟)</label>
              <input
                v-model.number="pomodoroWorkTime"
                type="number"
                :disabled="pomodoroIsRunning"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                min="1"
                max="60"
              />
            </div>
            <div class="flex-1">
              <label class="text-xs text-muted-foreground mb-1 block">休息时长(分钟)</label>
              <input
                v-model.number="pomodoroBreakTime"
                type="number"
                :disabled="pomodoroIsRunning"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                min="1"
                max="30"
              />
            </div>
          </div>

          <div class="text-center mb-4">
            <div
              class="text-5xl font-bold font-mono mb-2"
              :class="pomodoroIsWork ? 'text-primary' : 'text-secondary'"
            >
              {{ formatTime(pomodoroSeconds) }}
            </div>
            <div
              class="text-sm font-medium"
              :class="pomodoroIsWork ? 'text-primary' : 'text-secondary'"
            >
              {{ pomodoroIsWork ? '工作时间' : '休息时间' }}
            </div>
          </div>

          <div class="flex gap-2">
            <button
              v-if="!pomodoroIsRunning"
              @click="startPomodoro"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition flex items-center justify-center gap-1"
            >
              <Play :size="16" />
              开始
            </button>
            <button
              v-else
              @click="pausePomodoro"
              class="flex-1 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg transition flex items-center justify-center gap-1"
            >
              <Pause :size="16" />
              暂停
            </button>
            <button
              @click="resetPomodoro"
              class="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition"
              title="重置"
            >
              <RotateCcw :size="16" />
            </button>
            <button
              @click="skipPomodoroPhase"
              class="px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg transition"
            >
              跳过
            </button>
          </div>
        </div>

        <!-- 今日统计 -->
        <div class="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h3 class="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar :size="20" class="text-primary" />
            今日统计
          </h3>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-foreground">{{ formatTime(todayStats.totalSeconds) }}</div>
              <div class="text-xs text-muted-foreground">总时长</div>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-foreground">{{ todayStats.taskCount }}</div>
              <div class="text-xs text-muted-foreground">完成任务</div>
            </div>
          </div>
          <div v-if="Object.keys(todayStats.byCategory).length > 0" class="space-y-2">
            <div
              v-for="(stat, cat) in todayStats.byCategory"
              :key="cat"
              class="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2"
            >
              <span class="text-foreground">{{ getCategoryInfo(cat).label }}</span>
              <span class="font-mono text-foreground">{{ formatTime(stat.duration) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：时间日志 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 统计概览 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-muted rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <TrendingUp :size="18" class="text-primary" />
                <span class="text-sm text-muted-foreground">本周总计</span>
              </div>
              <div class="text-2xl font-bold text-foreground">
                {{ formatTime(weekStats.totalSeconds) }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ weekStats.logCount }} 条记录
              </div>
            </div>
            <div class="bg-muted rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <Clock :size="18" class="text-primary" />
                <span class="text-sm text-muted-foreground">今日总计</span>
              </div>
              <div class="text-2xl font-bold text-foreground">
                {{ formatTime(todayStats.totalSeconds) }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ todayStats.taskCount }} 个任务
              </div>
            </div>
            <div class="bg-muted rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <Calendar :size="18" class="text-primary" />
                <span class="text-sm text-muted-foreground">平均时长</span>
              </div>
              <div class="text-2xl font-bold text-foreground">
                {{ todayStats.taskCount > 0 ? formatTime(Math.round(todayStats.totalSeconds / todayStats.taskCount)) : '00:00' }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">每任务平均</div>
            </div>
          </div>
        </div>

        <!-- 时间日志列表 -->
        <div class="bg-card border border-border rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-border bg-muted/30">
            <h3 class="text-lg font-semibold text-foreground">时间日志</h3>
          </div>

          <div v-if="groupedLogs.length > 0" class="divide-y divide-border">
            <div
              v-for="group in groupedLogs"
              :key="group.date"
              class="p-5"
            >
              <div class="flex items-center gap-2 mb-3">
                <Calendar :size="16" class="text-muted-foreground" />
                <h4 class="font-semibold text-foreground">{{ group.date }}</h4>
                <span class="text-sm text-muted-foreground">
                  ({{ group.logs.reduce((sum, log) => sum + log.duration, 0) / 3600 | 0 }}小时{{ Math.round((group.logs.reduce((sum, log) => sum + log.duration, 0) % 3600) / 60) }}分钟)
                </span>
              </div>
              <div class="space-y-2">
                <div
                  v-for="log in group.logs"
                  :key="log.id"
                  class="flex items-center justify-between bg-muted hover:bg-muted/80 rounded-lg p-3 transition group"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        class="px-2 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground"
                      >
                        {{ getCategoryInfo(log.category).label }}
                      </span>
                      <h5 class="font-medium text-foreground truncate">{{ log.taskName }}</h5>
                    </div>
                    <div class="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock :size="12" />
                      <span class="font-mono">{{ formatTime(log.duration) }}</span>
                      <span>{{ new Date(log.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
                      <span>→</span>
                      <span>{{ new Date(log.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</span>
                    </div>
                  </div>
                  <button
                    @click="deleteLog(log.id)"
                    class="ml-2 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-else
            class="p-12 text-center text-muted-foreground"
          >
            <Timer :size="48" class="mx-auto mb-3 opacity-50" />
            <p>暂无时间记录</p>
            <p class="text-sm mt-1">开始计时来记录你的时间吧</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-center gap-4 mb-12">
      <button
        @click="exportCSV"
        :disabled="timeLogs.length === 0"
        class="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition font-medium flex items-center gap-2"
      >
        <Download :size="20" />
        导出时间日志
      </button>
      <button
        @click="clearAllLogs"
        :disabled="timeLogs.length === 0"
        class="px-6 py-3 bg-muted text-destructive hover:bg-muted/80 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition font-medium"
      >
        清空所有日志
      </button>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
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
          什么是时间跟踪器？
        </h2>
        <p class="text-muted-foreground mb-4">
          时间跟踪器（Time Tracker）是一种帮助记录和管理时间的工具，它可以精确记录您在各项任务上花费的时间。
          通过时间跟踪，您可以更好地了解自己的时间分配，找出效率低下的环节，从而提升整体工作效率。
          时间跟踪不仅适用于工作场景，也适用于学习、运动、阅读等各种活动的时间管理。
        </p>
        <p class="text-muted-foreground">
          本工具采用纯前端技术实现，所有数据都存储在您的浏览器本地，不会上传到任何服务器，
          确保您的隐私和数据安全。支持任务分类、时间日志导出、统计分析等功能。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在任务计时器中输入任务名称，选择任务分类</li>
          <li>点击"开始"按钮启动计时，开始工作或学习</li>
          <li>任务完成后，点击保存按钮记录时间日志</li>
          <li>查看时间日志和统计数据，分析时间分配</li>
          <li>可使用番茄钟功能，按照番茄工作法提高专注力</li>
          <li>导出时间日志，用于进一步分析或报告</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>任务计时</strong>：精确记录每个任务的实际用时，支持暂停和继续</li>
          <li><strong>任务分类</strong>：支持工作、学习、运动等多种分类，便于统计分析</li>
          <li><strong>番茄钟</strong>：内置番茄工作法计时器，可自定义工作和休息时长</li>
          <li><strong>时间日志</strong>：自动记录所有任务的时间日志，按日期分组展示</li>
          <li><strong>数据统计</strong>：提供今日统计、本周统计等多维度数据分析</li>
          <li><strong>数据导出</strong>：支持导出CSV格式，方便进一步处理和分析</li>
          <li><strong>本地安全</strong>：所有数据存储在浏览器本地，保护隐私安全</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          番茄工作法介绍
        </h2>
        <p class="text-muted-foreground mb-4">
          番茄工作法（Pomodoro Technique）是一种时间管理方法，由 Francesco Cirillo 在1980年代创立。
          该方法使用定时器将工作分解为25分钟的时间段，称为"番茄时间"，每个时间段之间有短暂的休息。
        </p>
        <p class="text-muted-foreground mb-4">
          <strong>基本步骤：</strong>
        </p>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择一个要完成的任务</li>
          <li>设置番茄钟（通常为25分钟）</li>
          <li>专注于任务，直到番茄钟响起</li>
          <li>短暂休息（通常为5分钟）</li>
          <li>每完成4个番茄时间，进行一次较长休息（通常为15-30分钟）</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线时间跟踪器安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的时间跟踪器采用纯前端技术实现，所有时间数据都存储在您的浏览器本地存储中，
              不会上传到任何服务器。您可以放心使用，不用担心隐私泄露问题。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何正确使用番茄工作法？</h3>
            <p class="text-muted-foreground mt-1">
              番茄工作法的核心是专注和休息的循环。建议工作时间为25分钟，休息时间为5分钟。
              完成四个番茄时间后，进行一次15-30分钟的长休息。在工作期间，要避免所有干扰，
              专注于单一任务。休息时可以起身活动，远离屏幕，让大脑放松。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">时间跟踪有什么好处？</h3>
            <p class="text-muted-foreground mt-1">
              时间跟踪可以帮助您：1) 了解时间的实际分配情况；2) 识别效率低下的环节；3)
              提高工作专注度；4) 为项目管理和报价提供依据；5) 培养良好的时间管理习惯。
              通过长期跟踪，您可以发现时间利用的模式，持续优化工作方式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">数据会丢失吗？</h3>
            <p class="text-muted-foreground mt-1">
              所有数据都保存在浏览器的本地存储中。只要不清除浏览器数据，数据就会一直保留。
              建议定期使用导出功能备份数据，以防意外丢失。导出的CSV文件可以在Excel或其他工具中打开。
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Timer, Play, Pause, RotateCcw, Trash2, Download, Calendar, Clock, TrendingUp, Target, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '时间跟踪器 - 在线计时工具与番茄钟工时统计 | Util工具箱',
  description: '免费在线时间跟踪工具，支持任务计时、工时统计、番茄钟工作法，可记录和导出时间日志。纯本地计算，帮助提升时间管理和生产力，数据隐私绝对安全。',
  keywords: '时间跟踪,计时器,番茄钟,工时统计,时间管理,生产力,任务计时,在线计时',
  author: 'Util工具箱',
  ogTitle: '时间跟踪器 - 免费在线计时工具',
  ogDescription: '专业的时间跟踪工具，支持任务计时、番茄钟工作法、工时统计和数据导出。纯前端处理，数据安全可靠。',
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
            name: '时间跟踪器',
            description: '免费在线时间跟踪工具，支持任务计时和番茄钟工作法',
            applicationCategory: 'ProductivityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '任务计时',
              '番茄钟',
              '时间日志',
              '数据统计',
              'CSV导出',
              '本地安全存储'
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '在线时间跟踪器安全吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '绝对安全。所有数据都存储在您的浏览器本地，不会上传到任何服务器。'
                }
              },
              {
                '@type': 'Question',
                name: '如何正确使用番茄工作法？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '番茄工作法的核心是专注和休息的循环。建议工作时间为25分钟，休息时间为5分钟。完成四个番茄时间后，进行一次长休息。'
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

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 计时器状态
const isRunning = ref(false)
const elapsedSeconds = ref(0)
const timerInterval = ref(null)

// 当前任务
const currentTask = ref({
  name: '',
  category: 'work',
  startTime: null
})

// 任务列表
const tasks = ref([])

// 时间日志
const timeLogs = ref([])

// 分类
const taskCategories = [
  { value: 'work', label: '工作', color: 'blue' },
  { value: 'study', label: '学习', color: 'purple' },
  { value: 'exercise', label: '运动', color: 'green' },
  { value: 'reading', label: '阅读', color: 'yellow' },
  { value: 'coding', label: '编程', color: 'indigo' },
  { value: 'other', label: '其他', color: 'gray' }
]

// 番茄钟设置
const pomodoroWorkTime = ref(25)
const pomodoroBreakTime = ref(5)
const pomodoroIsWork = ref(true)
const pomodoroSeconds = ref(25 * 60)
const pomodoroIsRunning = ref(false)
const pomodoroInterval = ref(null)

// 格式化时间显示
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// 开始计时
const startTimer = () => {
  if (!currentTask.value.name.trim()) {
    alert('请输入任务名称')
    return
  }

  if (!isRunning.value) {
    currentTask.value.startTime = new Date()
    isRunning.value = true
    timerInterval.value = setInterval(() => {
      elapsedSeconds.value++
    }, 1000)
  }
}

// 暂停计时
const pauseTimer = () => {
  isRunning.value = false
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// 停止并保存
const stopTimer = () => {
  if (elapsedSeconds.value === 0) return

  pauseTimer()

  // 保存到时间日志
  const log = {
    id: Date.now(),
    taskName: currentTask.value.name,
    category: currentTask.value.category,
    duration: elapsedSeconds.value,
    startTime: currentTask.value.startTime,
    endTime: new Date(),
    date: new Date().toISOString().split('T')[0]
  }

  timeLogs.value.unshift(log)

  // 重置
  elapsedSeconds.value = 0
  currentTask.value = {
    name: '',
    category: 'work',
    startTime: null
  }

  saveToStorage()
}

// 放弃当前计时
const discardTimer = () => {
  pauseTimer()
  elapsedSeconds.value = 0
  currentTask.value = {
    name: '',
    category: 'work',
    startTime: null
  }
}

// 删除时间日志
const deleteLog = (logId) => {
  if (confirm('确定要删除这条记录吗？')) {
    timeLogs.value = timeLogs.value.filter(l => l.id !== logId)
    saveToStorage()
  }
}

// 获取分类信息
const getCategoryInfo = (categoryValue) => {
  return taskCategories.find(c => c.value === categoryValue) || taskCategories[taskCategories.length - 1]
}

// 按日期分组的时间日志
const groupedLogs = computed(() => {
  const groups = {}

  timeLogs.value.forEach(log => {
    if (!groups[log.date]) {
      groups[log.date] = []
    }
    groups[log.date].push(log)
  })

  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, logs]) => ({ date, logs }))
})

// 今日统计
const todayStats = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todayLogs = timeLogs.value.filter(l => l.date === today)

  const totalSeconds = todayLogs.reduce((sum, log) => sum + log.duration, 0)
  const taskCount = todayLogs.length

  // 按分类统计
  const byCategory = {}
  todayLogs.forEach(log => {
    if (!byCategory[log.category]) {
      byCategory[log.category] = { duration: 0, count: 0 }
    }
    byCategory[log.category].duration += log.duration
    byCategory[log.category].count++
  })

  return { totalSeconds, taskCount, byCategory }
})

// 本周统计
const weekStats = computed(() => {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const weekLogs = timeLogs.value.filter(l => new Date(l.date) >= weekAgo)
  const totalSeconds = weekLogs.reduce((sum, log) => sum + log.duration, 0)

  return { totalSeconds, logCount: weekLogs.length }
})

// 番茄钟
const startPomodoro = () => {
  pomodoroIsRunning.value = true
  pomodoroInterval.value = setInterval(() => {
    if (pomodoroSeconds.value > 0) {
      pomodoroSeconds.value--
    } else {
      // 时间到
      pausePomodoro()
      alert(pomodoroIsWork.value ? '工作时间结束，休息一下吧！' : '休息时间结束，开始工作！')

      // 切换工作/休息
      pomodoroIsWork.value = !pomodoroIsWork.value
      pomodoroSeconds.value = (pomodoroIsWork.value ? pomodoroWorkTime.value : pomodoroBreakTime.value) * 60
    }
  }, 1000)
}

const pausePomodoro = () => {
  pomodoroIsRunning.value = false
  if (pomodoroInterval.value) {
    clearInterval(pomodoroInterval.value)
    pomodoroInterval.value = null
  }
}

const resetPomodoro = () => {
  pausePomodoro()
  pomodoroIsWork.value = true
  pomodoroSeconds.value = pomodoroWorkTime.value * 60
}

const skipPomodoroPhase = () => {
  pausePomodoro()
  pomodoroIsWork.value = !pomodoroIsWork.value
  pomodoroSeconds.value = (pomodoroIsWork.value ? pomodoroWorkTime.value : pomodoroBreakTime.value) * 60
}

// 导出CSV
const exportCSV = () => {
  if (timeLogs.value.length === 0) {
    alert('暂无数据可导出')
    return
  }

  const headers = ['日期', '任务', '分类', '时长(秒)', '时长(时:分:秒)', '开始时间', '结束时间']
  const rows = timeLogs.value.map(log => [
    log.date,
    log.taskName,
    getCategoryInfo(log.category).label,
    log.duration,
    formatTime(log.duration),
    new Date(log.startTime).toLocaleString('zh-CN'),
    new Date(log.endTime).toLocaleString('zh-CN')
  ])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `时间跟踪_${new Date().toLocaleDateString('zh-CN')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// 清空所有日志
const clearAllLogs = () => {
  if (confirm('确定要清空所有时间日志吗？')) {
    timeLogs.value = []
    saveToStorage()
  }
}

// 保存到本地存储
const saveToStorage = () => {
  localStorage.setItem('time-tracker-logs', JSON.stringify(timeLogs.value))
}

// 从本地存储加载
const loadFromStorage = () => {
  const saved = localStorage.getItem('time-tracker-logs')
  if (saved) {
    try {
      timeLogs.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载失败', e)
    }
  }
}

// 图标映射
const iconMap = {
  Calendar, Clock, Timer, Target, TrendingUp
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'todo-list-generator'),
    tools.find(t => t.id === 'quick-notes'),
    tools.find(t => t.id === 'mind-map'),
    tools.find(t => t.id === 'kanban-board')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 组件卸载时清理
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  if (pomodoroInterval.value) {
    clearInterval(pomodoroInterval.value)
  }
})

onMounted(() => {
  loadFromStorage()
})
</script>
