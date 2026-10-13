<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">艾宾浩斯复习排期器 - 按遗忘曲线自动生成复习计划</h1>
      <p class="text-muted-foreground">
        免费在线艾宾浩斯记忆复习计划表生成工具，输入学习条目与起始日期，自动按 1/2/4/7/15 天（可选 30 天）遗忘曲线节点生成复习日历，支持逐条勾选打卡、今日待复习提醒，打卡进度保存在本地浏览器。
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">学习条目与排期设置</label>
        </div>

        <div class="space-y-4">
          <!-- 起始学习日期 -->
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">统一起始学习日期</label>
            <input
              v-model="startDate"
              type="date"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
            <p class="text-xs text-muted-foreground mt-1">所有条目默认从这一天开始学习，复习节点按此日期顺推</p>
          </div>

          <!-- 条目列表 -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-medium text-foreground">学习条目列表</label>
              <button
                @click="addEntry"
                class="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus class="w-4 h-4" /> 添加条目
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="(entry, index) in entries"
                :key="entry.id"
                class="flex items-center gap-2"
              >
                <span class="text-xs text-muted-foreground w-6 text-right">{{ index + 1 }}.</span>
                <input
                  v-model="entry.name"
                  type="text"
                  class="flex-1 px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="如：List 1 单词 / 第3章公式"
                >
                <button
                  @click="removeEntry(entry.id)"
                  class="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                  title="删除该条目"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 复习节点开关 -->
          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">复习节点（按艾宾浩斯遗忘曲线）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="node in offsetOptions"
                :key="node.days"
                @click="toggleOffset(node.days)"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  offsetChecked[node.days]
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                D+{{ node.days }}（{{ node.label }}）
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">默认勾选 1/2/4/7/15 天节点，D+30 为拓展节点，可按需开关</p>
          </div>
        </div>
      </div>

      <!-- 结果区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">复习排期结果</label>
        </div>

        <!-- 今日待复习醒目区 -->
        <div
          v-if="todayItems.length > 0"
          class="p-4 mb-4 bg-primary/10 border border-primary/30 rounded-lg"
        >
          <div class="flex items-center gap-2 mb-2">
            <Clock class="w-5 h-5 text-primary" />
            <span class="text-lg font-bold text-foreground">今日待复习 {{ todayItems.length }} 条</span>
          </div>
          <div class="space-y-1">
            <p
              v-for="item in todayItems"
              :key="item.key"
              class="text-sm text-muted-foreground"
            >
              • {{ item.name }}（D+{{ item.offset }} 节点）
            </p>
          </div>
        </div>
        <div
          v-else-if="schedule.length > 0"
          class="p-4 mb-4 bg-muted rounded-lg text-sm text-muted-foreground"
        >
          今日无待复习内容，共 {{ totalTaskCount }} 个复习任务，已完成 {{ doneTaskCount }} 个。
        </div>

        <div v-if="schedule.length > 0" class="space-y-4">
          <!-- 进度卡片 -->
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">复习任务总数</p>
              <p class="text-lg font-bold text-foreground">{{ totalTaskCount }}</p>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">已完成</p>
              <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ doneTaskCount }}</p>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">完成率</p>
              <p class="text-lg font-bold text-primary">{{ donePercent }}%</p>
            </div>
          </div>

          <!-- 复习日历表 -->
          <div class="overflow-x-auto border border-border rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted text-left">
                  <th class="px-3 py-2 font-medium text-foreground whitespace-nowrap">日期</th>
                  <th class="px-3 py-2 font-medium text-foreground">到期条目（点击勾选打卡）</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="group in schedule"
                  :key="group.date"
                  :class="[
                    'border-t border-border',
                    group.date === todayKey ? 'bg-primary/5' : ''
                  ]"
                >
                  <td class="px-3 py-2 align-top whitespace-nowrap">
                    <span class="font-medium text-foreground">{{ formatMonthDay(group.date) }}</span>
                    <span class="block text-xs text-muted-foreground">周{{ weekdayCN(group.date) }}</span>
                    <span
                      v-if="group.date === todayKey"
                      class="inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded bg-primary text-primary-foreground"
                    >今天</span>
                  </td>
                  <td class="px-3 py-2">
                    <div class="space-y-1.5">
                      <label
                        v-for="item in group.items"
                        :key="item.key"
                        class="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          :checked="!!checkedMap[item.key]"
                          class="w-4 h-4 rounded border-border accent-primary"
                          @change="toggleCheck(item.key)"
                        >
                        <span :class="checkedMap[item.key] ? 'line-through text-muted-foreground' : 'text-foreground'">
                          {{ item.name }}
                        </span>
                        <span class="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground whitespace-nowrap">
                          D+{{ item.offset }}
                        </span>
                      </label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请填写起始日期和至少一个条目名称，自动生成复习日历
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="isSeoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是艾宾浩斯复习排期器？
        </h2>
        <p class="text-muted-foreground mb-4">
          艾宾浩斯复习排期器是一款基于艾宾浩斯遗忘曲线的在线复习计划生成工具。心理学研究表明，遗忘在学习之后立即开始，且先快后慢，
          因此在遗忘临界点（学习后第 1、2、4、7、15 天）及时复习，可以用最少的时间把短期记忆转化为长期记忆。
          本工具正是把这一规律落成一张可勾选打卡的复习日历表，适合背单词、背诵知识点、备考刷书等场景。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">遗忘曲线复习节点是怎么定的</h3>
        <p class="text-muted-foreground mb-4">
          常用的复习周期为学习后第 1 天、第 2 天、第 4 天、第 7 天、第 15 天，记忆保持率随复习次数递增而下降变缓；
          对于需要长期保持的内容（如考研单词），可以额外勾选 D+30 节点做一次月度巩固。本工具按自然日顺推：例如 2026-10-13 学习「第1章」，
          复习节点自动落在 10-14（D+1）、10-15（D+2）、10-17（D+4）、10-20（D+7）、10-28（D+15）。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">如何使用本工具排复习计划</h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择统一的起始学习日期（一般是今天）</li>
          <li>逐条添加学习条目，如「List 1 单词」「第3章公式」</li>
          <li>按需勾选复习节点，默认 1/2/4/7/15 天，可加 30 天</li>
          <li>查看自动生成的复习日历表，当天到期的条目会在顶部醒目提示</li>
          <li>每完成一次复习就勾选打卡，进度自动保存在本地浏览器</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-lg font-semibold text-foreground">不同条目可以有不同的起始日期吗？</h4>
            <p class="text-muted-foreground mt-1">
              本工具采用「统一起始日期」的简化设计：所有条目共用一个起始学习日，复习节点统一顺推。
              如果各条目学习进度不同，可以为每一批学习内容分别生成一张排期表，或把同一批开始的内容放在一组管理。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">打卡记录会丢失吗？</h4>
            <p class="text-muted-foreground mt-1">
              打卡状态以「条目 + 复习节点」为键保存在浏览器 localStorage 中，刷新页面或下次打开不会丢失；
              但清除浏览器缓存、使用无痕模式或更换设备后记录不会同步，重要计划建议配合打印留存。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">一天到期条目太多怎么办？</h4>
            <p class="text-muted-foreground mt-1">
              艾宾浩斯排期的常态是越往后积压越多，建议控制每日新学条目数量（如每天 1-2 个 List），
              或适当减少复习节点（例如只保留 D+1/D+7/D+15），把复习量控制在可完成范围内——完不成的计划比没有计划更伤坚持。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ebbinghaus-planner'" :category="'time'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Trash2, Clock, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '艾宾浩斯复习排期器 - 遗忘曲线复习计划表生成',
  description: '在线艾宾浩斯复习排期器，输入学习条目与起始日期，按遗忘曲线自动排 1/2/4/7/15（可选30）天复习节点，生成可勾选打卡的复习日历表，今日待复习醒目提醒，数据本地保存',
  keywords: '艾宾浩斯计划表, 遗忘曲线复习, 复习计划生成, 背诵排期, 考研复习计划, 复习打卡表',
  author: 'Util工具箱',
  ogTitle: '艾宾浩斯复习排期器 - 有条工具',
  ogDescription: '按遗忘曲线自动排复习节点，生成可打卡的复习日历表',
  ogUrl: 'https://www.util.cn/tools/ebbinghaus-planner',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '艾宾浩斯复习排期器',
          url: 'https://www.util.cn/tools/ebbinghaus-planner',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['遗忘曲线节点自动排期', '复习日历表', '逐条勾选打卡', '今日待复习提醒', '本地保存进度']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间工具', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '艾宾浩斯复习排期器', item: 'https://www.util.cn/tools/ebbinghaus-planner/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '遗忘曲线复习节点是怎么定的？',
              acceptedAnswer: { '@type': 'Answer', text: '常用周期为学习后第 1、2、4、7、15 天，长期记忆内容可加第 30 天，节点按自然日从起始学习日期顺推。' }
            },
            {
              '@type': 'Question',
              name: '不同条目可以有不同的起始日期吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具采用统一起始日期的简化设计，进度不同的批次建议分别生成排期表管理。' }
            },
            {
              '@type': 'Question',
              name: '打卡记录会丢失吗？',
              acceptedAnswer: { '@type': 'Answer', text: '打卡状态保存在浏览器 localStorage 中，刷新或重开不丢失，但清缓存、无痕模式或换设备不同步。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ebbinghaus-planner')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 日期工具（纯函数，可在 setup 顶层定义） ----------
const pad2 = (n) => String(n).padStart(2, '0')
const toDateStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (dateStr, n) => {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}
const weekdayCN = (s) => '日一二三四五六'[parseDate(s).getDay()]
const formatMonthDay = (s) => {
  const d = parseDate(s)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// ---------- 状态 ----------
const startDate = ref('')
const entries = ref([
  { id: 1, name: 'List 1 单词' }
])
let entryIdSeed = 2

const offsetOptions = [
  { days: 1, label: '次日初记' },
  { days: 2, label: '短期巩固' },
  { days: 4, label: '中期强化' },
  { days: 7, label: '周复习' },
  { days: 15, label: '半月巩固' },
  { days: 30, label: '月度巩固' }
]
const offsetChecked = ref({ 1: true, 2: true, 4: true, 7: true, 15: true, 30: false })

const checkedMap = ref({})
const todayKey = ref('')
const STORAGE_KEY = 'ebbinghaus-checked-v1'

const isSeoContentVisible = ref(true)
const toggleSeoContent = () => { isSeoContentVisible.value = !isSeoContentVisible.value }

// ---------- 条目增删 ----------
const addEntry = () => {
  entries.value.push({ id: entryIdSeed++, name: '' })
}
const removeEntry = (id) => {
  entries.value = entries.value.filter(e => e.id !== id)
}
const toggleOffset = (days) => {
  offsetChecked.value[days] = !offsetChecked.value[days]
}

// ---------- 打卡（localStorage 仅在客户端事件/onMounted 中访问） ----------
const loadChecked = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) checkedMap.value = JSON.parse(raw) || {}
  } catch (e) {
    checkedMap.value = {}
  }
}
const saveChecked = () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedMap.value))
  } catch (e) { /* 忽略存储异常 */ }
}
const toggleCheck = (key) => {
  checkedMap.value[key] = !checkedMap.value[key]
  saveChecked()
}

onMounted(() => {
  todayKey.value = toDateStr(new Date())
  if (!startDate.value) startDate.value = todayKey.value
  loadChecked()
})

// ---------- 排期计算 ----------
const validEntries = computed(() => entries.value.filter(e => e.name.trim() !== ''))

const schedule = computed(() => {
  if (!startDate.value || validEntries.value.length === 0) return []
  const activeOffsets = offsetOptions.filter(o => offsetChecked.value[o.days]).map(o => o.days)
  const byDate = new Map()
  for (const entry of validEntries.value) {
    for (const days of activeOffsets) {
      const date = addDays(startDate.value, days)
      if (!byDate.has(date)) byDate.set(date, [])
      byDate.get(date).push({
        key: `${entry.id}-${days}`,
        name: entry.name.trim(),
        offset: days
      })
    }
  }
  return Array.from(byDate.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, items]) => ({ date, items }))
})

const todayItems = computed(() => {
  if (!todayKey.value) return []
  const group = schedule.value.find(g => g.date === todayKey.value)
  return group ? group.items : []
})

const totalTaskCount = computed(() => schedule.value.reduce((sum, g) => sum + g.items.length, 0))
const doneTaskCount = computed(() =>
  schedule.value.reduce((sum, g) => sum + g.items.filter(i => checkedMap.value[i.key]).length, 0)
)
const donePercent = computed(() => {
  if (totalTaskCount.value === 0) return 0
  return Math.round(doneTaskCount.value / totalTaskCount.value * 100)
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
