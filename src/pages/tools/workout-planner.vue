<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">运动计划生成器</h1>
      <p class="text-muted-foreground">根据你的健身目标生成科学的运动训练计划，支持减脂、增肌、塑形等多种目标</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和生成 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target class="w-5 h-5 text-primary" />
            设定健身目标
          </h2>

          <div class="space-y-4">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">性别</label>
                <select v-model="gender" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">年龄</label>
                <input v-model.number="age" type="number" min="10" max="80" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="岁">
              </div>
            </div>

            <!-- 经验水平 -->
            <div>
              <label class="text-sm font-medium mb-2 block">训练经验</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="experience = 'beginner'"
                  :class="['p-2 rounded-lg text-sm transition-colors', experience === 'beginner' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  新手
                  <span class="block text-xs opacity-75">&lt;6个月</span>
                </button>
                <button
                  @click="experience = 'intermediate'"
                  :class="['p-2 rounded-lg text-sm transition-colors', experience === 'intermediate' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  中级
                  <span class="block text-xs opacity-75">6-24个月</span>
                </button>
                <button
                  @click="experience = 'advanced'"
                  :class="['p-2 rounded-lg text-sm transition-colors', experience === 'advanced' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  高级
                  <span class="block text-xs opacity-75">&gt;24个月</span>
                </button>
              </div>
            </div>

            <!-- 健身目标 -->
            <div>
              <label class="text-sm font-medium mb-2 block">健身目标</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="goal = 'fat-loss'"
                  :class="['p-3 rounded-lg text-sm transition-colors', goal === 'fat-loss' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  <Zap class="w-4 h-4 mx-auto mb-1" />
                  减脂瘦身
                </button>
                <button
                  @click="goal = 'muscle-gain'"
                  :class="['p-3 rounded-lg text-sm transition-colors', goal === 'muscle-gain' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  <Dumbbell class="w-4 h-4 mx-auto mb-1" />
                  增肌壮体
                </button>
                <button
                  @click="goal = 'endurance'"
                  :class="['p-3 rounded-lg text-sm transition-colors', goal === 'endurance' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  <Activity class="w-4 h-4 mx-auto mb-1" />
                  耐力提升
                </button>
                <button
                  @click="goal = 'strength'"
                  :class="['p-3 rounded-lg text-sm transition-colors', goal === 'strength' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  <Trophy class="w-4 h-4 mx-auto mb-1" />
                  力量提升
                </button>
              </div>
            </div>

            <!-- 训练频率 -->
            <div>
              <label class="text-sm font-medium mb-2 block">每周训练天数</label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="days in [3, 4, 5, 6]"
                  :key="days"
                  @click="trainingDays = days"
                  :class="['p-2 rounded-lg text-sm transition-colors', trainingDays === days ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  {{ days }}天/周
                </button>
              </div>
            </div>

            <!-- 训练时长 -->
            <div>
              <label class="text-sm font-medium mb-2 block">每次训练时长</label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="mins in [30, 45, 60, 90]"
                  :key="mins"
                  @click="duration = mins"
                  :class="['p-2 rounded-lg text-sm transition-colors', duration === mins ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  {{ mins }}分钟
                </button>
              </div>
            </div>

            <!-- 可用设备 -->
            <div>
              <label class="text-sm font-medium mb-2 block">可用设备</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                  <input type="checkbox" v-model="equipment.gym" class="rounded">
                  <span class="text-sm">健身房设备</span>
                </label>
                <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                  <input type="checkbox" v-model="equipment.dumbbell" class="rounded">
                  <span class="text-sm">哑铃</span>
                </label>
                <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                  <input type="checkbox" v-model="equipment.barbell" class="rounded">
                  <span class="text-sm">杠铃</span>
                </label>
                <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                  <input type="checkbox" v-model="equipment.bodyweight" class="rounded">
                  <span class="text-sm">自重训练</span>
                </label>
              </div>
            </div>

            <!-- 生成按钮 -->
            <button
              @click="generatePlan"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
            >
              <Calendar class="w-4 h-4 inline mr-2" />
              生成训练计划
            </button>
          </div>
        </div>

        <!-- 生成结果 -->
        <div v-if="workoutPlan" class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <FileText class="w-5 h-5 text-purple-500" />
              您的训练计划
            </h2>
            <button
              @click="downloadPlan"
              class="text-xs text-primary hover:underline"
            >
              下载计划
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(day, index) in workoutPlan.schedule"
              :key="index"
              class="p-3 border rounded-lg"
              :class="{ 'bg-primary/5 border-primary': day.type === 'training', 'bg-green-50 dark:bg-green-900/20 border-green-200': day.type === 'rest' }"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">{{ day.name }}</span>
                <span class="text-xs px-2 py-1 rounded"
                  :class="day.type === 'training' ? 'bg-primary text-primary-foreground' : 'bg-green-600 text-white'">
                  {{ day.type === 'training' ? '训练日' : '休息日' }}
                </span>
              </div>
              <div v-if="day.exercises" class="space-y-1">
                <div
                  v-for="(exercise, exIndex) in day.exercises"
                  :key="exIndex"
                  class="flex items-center justify-between text-sm p-2 bg-background dark:bg-black/50 rounded"
                >
                  <span>{{ exercise.name }}</span>
                  <span class="text-muted-foreground text-xs">{{ exercise.sets }}x{{ exercise.reps }}</span>
                </div>
              </div>
              <div v-if="day.cardio" class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <span class="font-medium">有氧运动：</span>{{ day.cardio }}
              </div>
            </div>
          </div>

          <!-- 计划摘要 -->
          <div v-if="workoutPlan.summary" class="mt-4 p-4 bg-muted rounded-lg">
            <h3 class="font-medium text-sm mb-2">计划摘要</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">训练周期:</span>
                <span>{{ workoutPlan.summary.duration }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">每周训练:</span>
                <span>{{ workoutPlan.summary.frequency }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">主要目标:</span>
                <span>{{ getGoalName(goal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">训练重点:</span>
                <span>{{ workoutPlan.summary.focus }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：说明和建议 -->
      <div class="space-y-4">
        <!-- 训练原则 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            训练原则
          </h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium text-foreground mb-1">渐进超负荷</p>
              <p class="text-muted-foreground">逐渐增加训练强度，才能持续进步</p>
            </div>
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="font-medium text-foreground mb-1">充分恢复</p>
              <p class="text-muted-foreground">肌肉在休息时生长，保证充足睡眠</p>
            </div>
            <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p class="font-medium text-foreground mb-1">营养配合</p>
              <p class="text-muted-foreground">根据目标调整蛋白质和碳水化合物摄入</p>
            </div>
            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <p class="font-medium text-foreground mb-1">持之以恒</p>
              <p class="text-muted-foreground">至少坚持8-12周才能看到明显效果</p>
            </div>
          </div>
        </div>

        <!-- 热身和拉伸 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">热身和拉伸</h2>

          <div class="space-y-3 text-sm">
            <div>
              <p class="font-medium text-foreground mb-2">训练前热身 (5-10分钟)</p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                <li>慢跑或快走</li>
                <li>关节活动（肩、髋、膝、踝）</li>
                <li>动态拉伸（摆腿、绕肩等）</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-2">训练后拉伸 (5-10分钟)</p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                <li>静态拉伸，保持15-30秒</li>
                <li>重点拉伸训练过的肌群</li>
                <li>避免弹震式拉伸</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 注意事项 -->
        <div class="bg-card rounded-lg p-6 border border-red-200 dark:border-red-800">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
            <AlertTriangle class="w-5 h-5" />
            安全提示
          </h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <X class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>开始前咨询医生，特别是有基础疾病</p>
            </div>
            <div class="flex items-start gap-2">
              <X class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>动作标准优先于重量和次数</p>
            </div>
            <div class="flex items-start gap-2">
              <X class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>感到疼痛立即停止，区分酸痛和疼痛</p>
            </div>
            <div class="flex items-start gap-2">
              <X class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>保证充分热身，避免运动损伤</p>
            </div>
          </div>
        </div>

        <!-- 饮食建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">饮食建议</h2>

          <div class="space-y-2 text-sm">
            <div v-if="goal === 'fat-loss'" class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <p class="font-medium text-foreground">减脂饮食</p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-muted-foreground text-xs">
                <li>控制总热量，制造300-500大卡缺口</li>
                <li>蛋白质1.6-2g/kg体重</li>
                <li>减少精制碳水和糖</li>
                <li>增加蔬菜和膳食纤维</li>
              </ul>
            </div>

            <div v-if="goal === 'muscle-gain'" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium text-foreground">增肌饮食</p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-muted-foreground text-xs">
                <li>热量盈余200-300大卡</li>
                <li>蛋白质1.6-2.2g/kg体重</li>
                <li>训练前后补充碳水</li>
                <li>保证优质脂肪摄入</li>
              </ul>
            </div>

            <div v-if="goal === 'endurance'" class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="font-medium text-foreground">耐力训练饮食</p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-muted-foreground text-xs">
                <li>碳水化合物占50-60%</li>
                <li>蛋白质1.2-1.4g/kg体重</li>
                <li>训练前补充适量碳水</li>
                <li>注意电解质和水分补充</li>
              </ul>
            </div>

            <div v-if="goal === 'strength'" class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p class="font-medium text-foreground">力量训练饮食</p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-muted-foreground text-xs">
                <li>蛋白质1.6-2.0g/kg体重</li>
                <li>足够的碳水支持训练强度</li>
                <li>训练后30分钟内补充营养</li>
                <li>保证充足的微量元素</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSeoMeta } from '#app'
import {
  Target,
  Zap,
  Dumbbell,
  Activity,
  Trophy,
  Calendar,
  FileText,
  BookOpen,
  AlertTriangle,
  X
} from 'lucide-vue-next'

const gender = ref('male')
const age = ref(25)
const experience = ref('beginner')
const goal = ref('fat-loss')
const trainingDays = ref(4)
const duration = ref(45)
const equipment = ref({
  gym: false,
  dumbbell: false,
  barbell: false,
  bodyweight: true
})

const workoutPlan = ref(null)

function getGoalName(id) {
  const names = {
    'fat-loss': '减脂瘦身',
    'muscle-gain': '增肌壮体',
    'endurance': '耐力提升',
    'strength': '力量提升'
  }
  return names[id] || id
}

function generatePlan() {
  const plans = {
    'beginner-fat-loss': {
      focus: '全身训练 + 有氧',
      schedule: [
        { name: '周一', type: 'training', exercises: [
          { name: '深蹲', sets: 3, reps: '12-15' },
          { name: '俯卧撑', sets: 3, reps: '8-12' },
          { name: '箭步蹲', sets: 3, reps: '10/侧' },
          { name: '平板支撑', sets: 3, reps: '30秒' }
        ], cardio: '快走20分钟' },
        { name: '周二', type: 'rest', exercises: [], cardio: '轻度活动' },
        { name: '周三', type: 'training', exercises: [
          { name: '高脚杯深蹲', sets: 3, reps: '12' },
          { name: '臀桥', sets: 3, reps: '15' },
          { name: '超人式', sets: 3, reps: '12' },
          { name: '侧平板支撑', sets: 2, reps: '20秒/侧' }
        ], cardio: '慢跑15分钟' },
        { name: '周四', type: 'rest', exercises: [], cardio: '拉伸放松' },
        { name: '周五', type: 'training', exercises: [
          { name: '保加利亚深蹲', sets: 3, reps: '10' },
          { name: '俯卧撑', sets: 3, reps: '最大次数' },
          { name: '臀桥', sets: 3, reps: '12' },
          { name: '卷腹', sets: 3, reps: '15' }
        ], cardio: '跳绳10分钟' },
        { name: '周六', type: 'training', exercises: [
          { name: '登山者', sets: 3, reps: '20' },
          { name: '波比跳', sets: 3, reps: '10' },
          { name: '深蹲跳', sets: 3, reps: '12' },
          { name: '平板支撑', sets: 3, reps: '45秒' }
        ], cardio: '快走30分钟' },
        { name: '周日', type: 'rest', exercises: [], cardio: '完全休息' }
      ]
    },
    'intermediate-fat-loss': {
      focus: '上下肢分化 + HIIT',
      schedule: [
        { name: '周一', type: 'training', exercises: [
          { name: '杠铃深蹲', sets: 4, reps: '8-10' },
          { name: '罗马尼亚硬拉', sets: 4, reps: '10' },
          { name: '腿举', sets: 3, reps: '12' },
          { name: '提踵', sets: 3, reps: '15' }
        ], cardio: 'HIIT 15分钟' },
        { name: '周二', type: 'training', exercises: [
          { name: '卧推', sets: 4, reps: '8-10' },
          { name: '划船', sets: 4, reps: '10' },
          { name: '肩推', sets: 3, reps: '12' },
          { name: '引体向上', sets: 3, reps: '最大' }
        ], cardio: '慢跑20分钟' },
        { name: '周三', type: 'training', exercises: [
          { name: '高脚杯深蹲', sets: 3, reps: '12' },
          { name: '臀桥', sets: 3, reps: '15' },
          { name: '单腿硬拉', sets: 3, reps: '10/腿' }
        ], cardio: '椭圆机20分钟' },
        { name: '周四', type: 'rest', exercises: [], cardio: '轻度活动' },
        { name: '周五', type: 'training', exercises: [
          { name: '上斜哑铃卧推', sets: 3, reps: '12' },
          { name: '哑铃划船', sets: 3, reps: '12' },
          { name: '侧平举', sets: 3, reps: '15' },
          { name: '二头弯举', sets: 3, reps: '12' },
          { name: '三头臂屈伸', sets: 3, reps: '12' }
        ], cardio: 'HIIT 20分钟' },
        { name: '周六', type: 'training', exercises: [
          { name: '深蹲', sets: 4, reps: '15' },
          { name: '俯卧撑', sets: 4, reps: '15' },
          { name: '箭步蹲', sets: 3, reps: '15' },
          { name: '平板支撑', sets: 3, reps: '60秒' }
        ], cardio: '有氧30分钟' },
        { name: '周日', type: 'rest', exercises: [], cardio: '完全休息' }
      ]
    },
    'beginner-muscle-gain': {
      focus: '全身训练',
      schedule: [
        { name: '周一', type: 'training', exercises: [
          { name: '深蹲', sets: 3, reps: '10-12' },
          { name: '俯卧撑', sets: 3, reps: '8-10' },
          { name: '哑铃划船', sets: 3, reps: '10-12' },
          { name: '肩推', sets: 3, reps: '10' },
          { name: '平板支撑', sets: 3, reps: '30秒' }
        ] },
        { name: '周二', type: 'rest', exercises: [] },
        { name: '周三', type: 'training', exercises: [
          { name: '罗马尼亚硬拉', sets: 3, reps: '10' },
          { name: '上斜哑铃卧推', sets: 3, reps: '10' },
          { name: '哑铃拉力器', sets: 3, reps: '12' },
          { name: '二头弯举', sets: 3, reps: '12' }
        ] },
        { name: '周四', type: 'rest', exercises: [] },
        { name: '周五', type: 'training', exercises: [
          { name: '深蹲', sets: 3, reps: '12' },
          { name: '俯卧撑', sets: 3, reps: '最大' },
          { name: '箭步蹲', sets: 3, reps: '10' },
          { name: '侧平举', sets: 3, reps: '12' },
          { name: '卷腹', sets: 3, reps: '15' }
        ] },
        { name: '周六', type: 'rest', exercises: [] },
        { name: '周日', type: 'rest', exercises: [] }
      ]
    },
    'intermediate-muscle-gain': {
      focus: '推拉腿分化',
      schedule: [
        { name: '周一', type: 'training', exercises: [
          { name: '卧推', sets: 4, reps: '8-10' },
          { name: '上斜哑铃卧推', sets: 3, reps: '10' },
          { name: '侧平举', sets: 3, reps: '12' },
          { name: '三头臂屈伸', sets: 3, reps: '10' },
          { name: '二头弯举', sets: 3, reps: '10' }
        ] },
        { name: '周二', type: 'training', exercises: [
          { name: '杠铃划船', sets: 4, reps: '8-10' },
          { name: '引体向上', sets: 4, reps: '最大' },
          { name: '面拉', sets: 3, reps: '12' },
          { name: '单臂哑铃划船', sets: 3, reps: '10' }
        ] },
        { name: '周三', type: 'rest', exercises: [] },
        { name: '周四', type: 'training', exercises: [
          { name: '深蹲', sets: 4, reps: '8-10' },
          { name: '罗马尼亚硬拉', sets: 4, reps: '8' },
          { name: '腿举', sets: 3, reps: '12' },
          { name: '提踵', sets: 3, reps: '15' }
        ] },
        { name: '周五', type: 'training', exercises: [
          { name: '上斜哑铃卧推', sets: 3, reps: '12' },
          { name: '哑铃肩推', sets: 3, reps: '10' },
          { name: '拉力器', sets: 3, reps: '12' },
          { name: '侧平举', sets: 3, reps: '15' }
        ] },
        { name: '周六', type: 'rest', exercises: [] },
        { name: '周日', type: 'rest', exercises: [] }
      ]
    },
    'beginner-endurance': {
      focus: '有氧基础',
      schedule: [
        { name: '周一', type: 'training', exercises: [], cardio: '慢跑20分钟 + 快走10分钟' },
        { name: '周二', type: 'rest', exercises: [], cardio: '拉伸或轻度活动' },
        { name: '周三', type: 'training', exercises: [
          { name: '深蹲', sets: 2, reps: '15' },
          { name: '平板支撑', sets: 2, reps: '30秒' }
        ], cardio: '快走30分钟' },
        { name: '周四', type: 'rest', exercises: [], cardio: '休息' },
        { name: '周五', type: 'training', exercises: [], cardio: '慢跑25分钟' },
        { name: '周六', type: 'training', exercises: [], cardio: '长距离快走40分钟' },
        { name: '周日', type: 'rest', exercises: [], cardio: '完全休息' }
      ]
    },
    'beginner-strength': {
      focus: '基础力量',
      schedule: [
        { name: '周一', type: 'training', exercises: [
          { name: '深蹲', sets: 3, reps: '10' },
          { name: '俯卧撑', sets: 3, reps: '8' },
          { name: '平板支撑', sets: 3, reps: '30秒' }
        ] },
        { name: '周二', type: 'rest', exercises: [] },
        { name: '周三', type: 'training', exercises: [
          { name: '硬拉', sets: 3, reps: '8' },
          { name: '肩推', sets: 3, reps: '10' },
          { name: '划船', sets: 3, reps: '10' }
        ] },
        { name: '周四', type: 'rest', exercises: [] },
        { name: '周五', type: 'training', exercises: [
          { name: '深蹲', sets: 3, reps: '12' },
          { name: '俯卧撑', sets: 3, reps: '最大' }
        ] },
        { name: '周六', type: 'rest', exercises: [] },
        { name: '周日', type: 'rest', exercises: [] }
      ]
    }
  }

  // 根据用户输入选择合适的计划
  let planKey = `${experience}-${goal}`

  // 简化：如果匹配不到就用默认计划
  if (!plans[planKey]) {
    planKey = 'beginner-fat-loss'
  }

  const selectedPlan = plans[planKey]

  workoutPlan.value = {
    ...selectedPlan,
    summary: {
      duration: '8-12周',
      frequency: `${trainingDays.value}天/周`,
      focus: selectedPlan.focus
    }
  }
}

function downloadPlan() {
  if (!workoutPlan.value) return

  let content = `健身训练计划\n${'='.repeat(50)}\n\n`
  content += `目标: ${getGoalName(goal)}\n`
  content += `经验: ${experience === 'beginner' ? '新手' : experience === 'intermediate' ? '中级' : '高级'}\n`
  content += `频率: ${trainingDays.value}天/周\n\n`

  workoutPlan.value.schedule.forEach(day => {
    content += `\n${day.name}\n${'-'.repeat(20)}\n`
    content += `类型: ${day.type === 'training' ? '训练日' : '休息日'}\n`

    if (day.exercises && day.exercises.length > 0) {
      content += `\n训练动作:\n`
      day.exercises.forEach(ex => {
        content += `  - ${ex.name}: ${ex.sets}组 x ${ex.reps}\n`
      })
    }

    if (day.cardio) {
      content += `\n有氧运动: ${day.cardio}\n`
    }
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `训练计划_${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

useSeoMeta({
  title: '运动计划生成器 - 在线健身训练计划制定工具',
  description: '免费在线运动计划生成器，根据健身目标科学制定减脂、增肌、耐力、力量训练计划，支持自定义训练频率和时长。',
  keywords: ['运动计划', '健身计划', '训练计划', '减脂计划', '增肌计划', '健身教程', 'workout plan', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('运动计划生成器')
</script>
