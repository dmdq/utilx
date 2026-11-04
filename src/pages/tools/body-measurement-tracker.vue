<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">身体围度追踪器</h1>
      <p class="text-muted-foreground">记录身体各部位围度变化，可视化健身塑形效果，科学管理体重和身材</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和记录 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <PlusCircle class="w-5 h-5 text-primary" />
            添加测量记录
          </h2>

          <div class="space-y-4">
            <!-- 测量日期 -->
            <div>
              <label class="text-sm font-medium mb-2 block">测量日期</label>
              <input
                v-model="measurementDate"
                type="date"
                class="w-full px-4 py-3 border border-border rounded-lg text-sm"
                :max="today"
              >
            </div>

            <!-- 单位选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">测量单位</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="unit = 'cm'"
                  :class="['p-2 rounded-lg text-sm transition-colors', unit === 'cm' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  厘米 (cm)
                </button>
                <button
                  @click="unit = 'inch'"
                  :class="['p-2 rounded-lg text-sm transition-colors', unit === 'inch' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  英寸 (inch)
                </button>
              </div>
            </div>

            <!-- 身体围度输入 -->
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium mb-1 block">颈围</label>
                  <input
                    v-model.number="measurements.neck"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">胸围</label>
                  <input
                    v-model.number="measurements.chest"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium mb-1 block">腰围</label>
                  <input
                    v-model.number="measurements.waist"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">臀围</label>
                  <input
                    v-model.number="measurements.hips"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium mb-1 block">大臂围 (左)</label>
                  <input
                    v-model.number="measurements.armLeft"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">大臂围 (右)</label>
                  <input
                    v-model.number="measurements.armRight"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium mb-1 block">大腿围 (左)</label>
                  <input
                    v-model.number="measurements.thighLeft"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">大腿围 (右)</label>
                  <input
                    v-model.number="measurements.thighRight"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium mb-1 block">小腿围 (左)</label>
                  <input
                    v-model.number="measurements.calfLeft"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">小腿围 (右)</label>
                  <input
                    v-model.number="measurements.calfRight"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="cm"
                  >
                </div>
              </div>
            </div>

            <!-- 体重 -->
            <div>
              <label class="text-sm font-medium mb-1 block">体重 (可选)</label>
              <div class="flex gap-2">
                <input
                  v-model.number="weight"
                  type="number"
                  step="0.1"
                  class="flex-1 px-3 py-2 border border-border rounded-lg font-mono text-sm"
                  placeholder="输入体重"
                >
                <select v-model="weightUnit" class="px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>

            <!-- 备注 -->
            <div>
              <label class="text-sm font-medium mb-1 block">备注</label>
              <textarea
                v-model="notes"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                rows="2"
                placeholder="记录运动、饮食或其他备注..."
              ></textarea>
            </div>

            <!-- 保存按钮 -->
            <button
              @click="saveMeasurement"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
            >
              <Save class="w-4 h-4 inline mr-2" />
              保存记录
            </button>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <History class="w-5 h-5 text-purple-500" />
              历史记录
            </h2>
            <button
              v-if="records.length > 0"
              @click="clearAllRecords"
              class="text-xs text-red-600 hover:underline"
            >
              清空全部
            </button>
          </div>

          <div v-if="records.length === 0" class="text-center py-8 text-sm text-muted-foreground">
            暂无测量记录
          </div>

          <div v-else class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="(record, index) in sortedRecords"
              :key="index"
              @click="selectRecord(record)"
              class="p-3 border rounded-lg hover:bg-muted cursor-pointer"
              :class="{ 'border-primary bg-primary/5': selectedRecord === record }"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-sm">{{ formatDate(record.date) }}</p>
                  <p class="text-xs text-muted-foreground mt-1">
                    腰围: {{ record.waist }}cm | 臀围: {{ record.hips }}cm
                  </p>
                </div>
                <button
                  @click.stop="deleteRecord(index)"
                  class="p-1 hover:bg-background rounded"
                >
                  <Trash2 class="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：图表和分析 -->
      <div class="space-y-4">
        <!-- 当前数据展示 -->
        <div v-if="selectedRecord" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <User class="w-5 h-5 text-blue-500" />
            身体数据
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div v-for="(value, key) in displayMeasurements" :key="key" class="p-3 bg-muted rounded">
              <p class="text-xs text-muted-foreground">{{ value.label }}</p>
              <p class="text-lg font-bold">{{ value.value }}{{ value.value ? unit : '' }}</p>
            </div>
          </div>

          <div v-if="selectedRecord.weight" class="mt-3 p-3 bg-primary/10 rounded">
            <p class="text-xs text-muted-foreground">体重</p>
            <p class="text-lg font-bold">{{ selectedRecord.weight }}{{ selectedRecord.weightUnit }}</p>
          </div>

          <div v-if="selectedRecord.notes" class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <p class="text-xs text-muted-foreground mb-1">备注</p>
            <p class="text-sm">{{ selectedRecord.notes }}</p>
          </div>
        </div>

        <!-- 变化趋势 -->
        <div v-if="records.length >= 2" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-green-500" />
            变化趋势
          </h2>

          <div class="space-y-2">
            <div
              v-for="change in changes"
              :key="change.part"
              class="flex items-center justify-between p-2 bg-muted rounded text-sm"
            >
              <span>{{ change.label }}</span>
              <span
                class="font-medium"
                :class="change.value > 0 ? 'text-red-600' : change.value < 0 ? 'text-green-600' : 'text-muted-foreground'"
              >
                {{ change.value > 0 ? '+' : '' }}{{ change.value.toFixed(1) }}{{ unit }}
              </span>
            </div>
          </div>

          <div class="mt-3 text-xs text-muted-foreground">
            <p>对比: {{ formatDate(sortedRecords[0]?.date) }} → {{ formatDate(sortedRecords[sortedRecords.length - 1]?.date) }}</p>
          </div>
        </div>

        <!-- 比例分析 -->
        <div v-if="selectedRecord" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart class="w-5 h-5 text-orange-500" />
            比例分析
          </h2>

          <div class="space-y-3">
            <!-- 腰臀比 -->
            <div class="p-3 bg-muted rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm">腰臀比</span>
                <span class="font-medium">{{ calculateWHR() }}</span>
              </div>
              <div class="w-full bg-background rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="getWHRColor()"
                  :style="{ width: Math.min(calculateWHR() * 100, 100) + '%' }"
                ></div>
              </div>
            </div>

            <!-- 腰高比 -->
            <div class="p-3 bg-muted rounded" v-if="height">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm">腰高比</span>
                <span class="font-medium">{{ calculateWHtR() }}</span>
              </div>
              <div class="w-full bg-background rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="getWHtRColor()"
                  :style="{ width: Math.min(calculateWHtR() * 100, 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 测量指南 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            测量指南
          </h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2 p-2 bg-muted rounded">
              <span class="font-medium text-foreground">颈围</span>
              <span>喉结下方，颈部最细处</span>
            </div>
            <div class="flex items-start gap-2 p-2 bg-muted rounded">
              <span class="font-medium text-foreground">胸围</span>
              <span>乳头水平，呼吸后测量</span>
            </div>
            <div class="flex items-start gap-2 p-2 bg-muted rounded">
              <span class="font-medium text-foreground">腰围</span>
              <span>肚脐上方最细处</span>
            </div>
            <div class="flex items-start gap-2 p-2 bg-muted rounded">
              <span class="font-medium text-foreground">臀围</span>
              <span>臀部最宽处</span>
            </div>
            <div class="flex items-start gap-2 p-2 bg-muted rounded">
              <span class="font-medium text-foreground">大臂围</span>
              <span>手臂放松，最粗处</span>
            </div>
            <div class="flex items-start gap-2 p-2 bg-muted rounded">
              <span class="font-medium text-foreground">大腿围</span>
              <span>大腿根部最粗处</span>
            </div>
            <div class="flex items-start gap-2 p-2 bg-muted rounded">
              <span class="font-medium text-foreground">小腿围</span>
              <span>小腿最粗处</span>
            </div>
          </div>

          <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <p class="text-sm text-green-700 dark:text-green-300">
              <span class="font-medium">建议：</span>每周同一时间测量，如周一早晨起床后
            </p>
          </div>
        </div>

        <!-- 数据导出 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">数据管理</h2>

          <div class="space-y-2">
            <button
              @click="exportData"
              :disabled="records.length === 0"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              <Download class="w-4 h-4 inline mr-2" />
              导出数据 (CSV)
            </button>
            <button
              @click="importData"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm"
            >
              <Upload class="w-4 h-4 inline mr-2" />
              导入数据
            </button>
            <input type="file" @change="handleImport" accept=".csv,.json" class="hidden">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'
import {
  PlusCircle,
  Save,
  History,
  Trash2,
  User,
  TrendingUp,
  PieChart,
  BookOpen,
  Download,
  Upload
} from 'lucide-vue-next'

const today = new Date().toISOString().split('T')[0]
const measurementDate = ref(today)
const unit = ref('cm')
const weightUnit = ref('kg')
const weight = ref(null)
const notes = ref('')

const measurements = ref({
  neck: null,
  chest: null,
  waist: null,
  hips: null,
  armLeft: null,
  armRight: null,
  thighLeft: null,
  thighRight: null,
  calfLeft: null,
  calfRight: null
})

const records = ref([])
const selectedRecord = ref(null)

// 从localStorage加载数据
onMounted(() => {
  const saved = localStorage.getItem('bodyMeasurements')
  if (saved) {
    records.value = JSON.parse(saved)
    if (records.value.length > 0) {
      selectedRecord.value = records.value[records.value.length - 1]
    }
  }
})

// 排序后的记录
const sortedRecords = computed(() => {
  return [...records.value].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// 显示的测量数据
const displayMeasurements = computed(() => {
  if (!selectedRecord.value) return {}
  const r = selectedRecord.value
  return {
    neck: { label: '颈围', value: r.neck },
    chest: { label: '胸围', value: r.chest },
    waist: { label: '腰围', value: r.waist },
    hips: { label: '臀围', value: r.hips },
    armLeft: { label: '左大臂', value: r.armLeft },
    armRight: { label: '右大臂', value: r.armRight },
    thighLeft: { label: '左大腿', value: r.thighLeft },
    thighRight: { label: '右大腿', value: r.thighRight },
    calfLeft: { label: '左小腿', value: r.calfLeft },
    calfRight: { label: '右小腿', value: r.calfRight }
  }
})

// 变化数据
const changes = computed(() => {
  if (records.value.length < 2) return []
  const latest = sortedRecords.value[0]
  const earliest = sortedRecords.value[sortedRecords.value.length - 1]

  const parts = ['waist', 'hips', 'chest', 'neck', 'thighLeft', 'thighRight']
  const labels = {
    waist: '腰围',
    hips: '臀围',
    chest: '胸围',
    neck: '颈围',
    thighLeft: '左大腿',
    thighRight: '右大腿'
  }

  return parts
    .map(part => ({
      part,
      label: labels[part],
      value: (latest[part] || 0) - (earliest[part] || 0)
    }))
    .filter(c => c.value !== 0)
})

// 保存记录
function saveMeasurement() {
  const record = {
    id: Date.now(),
    date: measurementDate.value,
    unit: unit.value,
    weight: weight.value,
    weightUnit: weightUnit.value,
    notes: notes.value,
    ...measurements.value
  }

  records.value.push(record)
  saveToStorage()
  selectedRecord.value = record

  // 重置输入
  weight.value = null
  notes.value = ''
  Object.keys(measurements.value).forEach(key => {
    measurements.value[key] = null
  })
}

// 选择记录
function selectRecord(record) {
  selectedRecord.value = record
}

// 删除记录
function deleteRecord(index) {
  records.value.splice(index, 1)
  saveToStorage()
  if (selectedRecord.value && !records.value.includes(selectedRecord.value)) {
    selectedRecord.value = records.value[records.value.length - 1] || null
  }
}

// 清空全部
function clearAllRecords() {
  if (confirm('确定要清空所有记录吗？')) {
    records.value = []
    selectedRecord.value = null
    saveToStorage()
  }
}

// 保存到localStorage
function saveToStorage() {
  localStorage.setItem('bodyMeasurements', JSON.stringify(records.value))
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 计算腰臀比
function calculateWHR() {
  if (!selectedRecord.value?.waist || !selectedRecord.value?.hips) return '-'
  return (selectedRecord.value.waist / selectedRecord.value.hips).toFixed(2)
}

// 计算腰高比
function calculateWHtR() {
  if (!selectedRecord.value?.waist || !height) return '-'
  // 这里假设身高170作为示例，实际应从用户设置获取
  return (selectedRecord.value.waist / 170).toFixed(2)
}

function getWHRColor() {
  const whr = parseFloat(calculateWHR())
  if (whr === '-') return 'bg-gray-300'
  // 简化判断，实际应根据性别
  return whr < 0.9 ? 'bg-green-500' : whr < 1 ? 'bg-yellow-500' : 'bg-red-500'
}

function getWHtRColor() {
  const whtr = parseFloat(calculateWHtR())
  if (whtr === '-') return 'bg-gray-300'
  return whtr < 0.5 ? 'bg-green-500' : whtr < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
}

// 导出数据
function exportData() {
  const csv = [
    ['日期', '颈围', '胸围', '腰围', '臀围', '左大臂', '右大臂', '左大腿', '右大腿', '左小腿', '右小腿', '体重', '单位', '备注'].join(','),
    ...sortedRecords.value.map(r => [
      r.date,
      r.neck || '',
      r.chest || '',
      r.waist || '',
      r.hips || '',
      r.armLeft || '',
      r.armRight || '',
      r.thighLeft || '',
      r.thighRight || '',
      r.calfLeft || '',
      r.calfRight || '',
      r.weight || '',
      r.unit,
      r.notes || ''
    ].join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `身体围度_${today}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入数据
function importData() {
  document.querySelector('input[type="file"]').click()
}

function handleImport(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (Array.isArray(data)) {
        records.value = [...records.value, ...data]
        saveToStorage()
        alert('导入成功！')
      }
    } catch {
      alert('导入失败，请检查文件格式')
    }
  }
  reader.readAsText(file)
}

useSeoMeta({
  title: '身体围度追踪器 - 在线身材数据记录与分析',
  description: '免费在线身体围度追踪器，记录胸围、腰围、臀围等身体数据，可视化健身塑形效果，支持数据导出。',
  keywords: ['身体围度', '身材追踪', '健身记录', '围度测量', '塑形效果', '身材管理', '数据追踪', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('身体围度追踪器')
</script>
