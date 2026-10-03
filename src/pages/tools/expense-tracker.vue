<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Receipt class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">记账流水本</h1>
          <p class="text-sm text-muted-foreground mt-1">记下每一笔收支，看清本月花了多少、花在哪里</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        本地记账工具：记录每日收入与支出（分类、备注），自动汇总本月支出、收入与结余，并用条形图展示分类占比。数据只保存在本机浏览器 localStorage，不上传任何服务器，支持 JSON 导出备份与导入迁移。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：添加表单 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Plus class="w-5 h-5 mr-2 text-primary" /> 记一笔
          </h2>

          <!-- 类型切换 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">类型</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="t in ['支出', '收入']"
                :key="t"
                @click="switchType(t)"
                :class="form.type === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ t }}</button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">日期</label>
              <input
                v-model="form.date"
                type="date"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">金额（元）</label>
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">分类</label>
            <div class="grid grid-cols-5 gap-1.5">
              <button
                v-for="c in categories"
                :key="c"
                @click="form.category = c"
                :class="form.category === c ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >{{ c }}</button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">备注（可选）</label>
            <input
              v-model="form.note"
              type="text"
              placeholder="例如：午餐 / 打车 / 工资到账"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              @keyup.enter="addEntry"
            />
          </div>

          <button
            @click="addEntry"
            :disabled="!canSave"
            class="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
          >
            {{ form.type === '支出' ? '记一笔支出' : '记一笔收入' }}
          </button>
        </div>

        <!-- 备份 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Download class="w-4 h-4 mr-2 text-primary" /> 数据备份
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="exportData"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Download class="w-3.5 h-3.5" /> 导出 JSON
            </button>
            <label
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload class="w-3.5 h-3.5" /> 导入 JSON
              <input type="file" accept=".json" class="hidden" @change="importData" />
            </label>
          </div>
          <p class="text-xs text-muted-foreground mt-2.5 leading-relaxed">
            账目数据仅存于本机浏览器 localStorage，不上传任何服务器；清除浏览器数据前请先导出备份，换设备可用导入迁移。
          </p>
        </div>
      </div>

      <!-- 右侧：汇总 / 占比 / 流水 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 本月汇总 -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-foreground">¥{{ monthExpense.toFixed(2) }}</p>
            <p class="text-xs text-muted-foreground mt-1">本月支出</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-primary">¥{{ monthIncome.toFixed(2) }}</p>
            <p class="text-xs text-muted-foreground mt-1">本月收入</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold" :class="monthBalance < 0 ? 'text-destructive' : 'text-foreground'">¥{{ monthBalance.toFixed(2) }}</p>
            <p class="text-xs text-muted-foreground mt-1">本月结余</p>
          </div>
        </div>

        <!-- 分类占比（本月支出） -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center">
            <Calendar class="w-4 h-4 mr-2 text-primary" /> 本月支出分类占比
          </h3>
          <div v-if="categoryStats.length === 0" class="py-6 text-center">
            <p class="text-xs text-muted-foreground">本月还没有支出记录</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="s in categoryStats" :key="s.category" class="flex items-center gap-3">
              <span class="w-12 text-xs text-muted-foreground flex-shrink-0">{{ s.category }}</span>
              <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all" :style="{ width: s.pct + '%' }"></div>
              </div>
              <span class="w-24 text-right text-xs text-foreground flex-shrink-0">¥{{ s.value.toFixed(2) }} · {{ s.pct }}%</span>
            </div>
          </div>
        </div>

        <!-- 流水列表 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground">收支流水</h2>
            <select
              v-model="monthFilter"
              class="px-3 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">全部月份</option>
              <option v-for="m in monthOptions" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div v-if="filteredEntries.length === 0" class="py-14 text-center">
            <Receipt class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">还没有记账记录，从左侧添加第一笔</p>
          </div>
          <div v-else class="divide-y divide-border/50">
            <div v-for="e in filteredEntries" :key="e.id" class="flex items-center gap-4 px-6 py-3.5">
              <div class="w-11 text-center flex-shrink-0">
                <p class="text-[10px] text-muted-foreground leading-none">{{ (e.date || '').slice(5, 7) }}月</p>
                <p class="text-base font-bold text-foreground leading-tight">{{ (e.date || '').slice(8, 10) || '?' }}</p>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground truncate">
                  {{ e.note || e.category }}
                  <span class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{{ e.category }}</span>
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">{{ e.date }} · {{ e.type }}</p>
              </div>
              <span class="text-sm font-semibold flex-shrink-0" :class="e.type === '收入' ? 'text-primary' : 'text-foreground'">
                {{ e.type === '收入' ? '+' : '−' }}¥{{ (Number(e.amount) || 0).toFixed(2) }}
              </span>
              <button
                @click="removeEntry(e.id)"
                class="p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                title="删除"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么要记账</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            记账的意义不在于节省每一分钱，而在于让钱「可见」：多数人低估自己的非必要开支 20% 以上。把每笔收支按日期与分类记录下来，月底看一眼分类占比，钱去了哪里一目了然——奶茶、打车、订阅这些「小额高频」支出往往才是结余的真正杀手。
          </p>
          <h3 class="text-lg font-semibold text-foreground">使用建议</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>当天账当天记，拖到第二天回忆成本会翻倍</li>
            <li>备注写清用途，月底复盘时才想得起这笔钱买了什么</li>
            <li>关注「分类占比」里前三名，每次削减 10% 就是不小的结余</li>
            <li>收入也照实记录，结余率（结余/收入）比省下的绝对金额更值得关注</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">数据安全吗？</span>全部保存在本机浏览器 localStorage，不注册、不上传，账目信息不出设备。</li>
            <li><span class="text-foreground font-medium">换手机或换浏览器怎么办？</span>先「导出 JSON」备份，再到新设备「导入 JSON」即可完整迁移。</li>
            <li><span class="text-foreground font-medium">汇总和图表的统计口径？</span>顶部汇总与分类占比固定统计当前自然月，流水列表可按月份筛选查看全部历史。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'expense-tracker'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Receipt, Plus, Trash2, Download, Upload, Calendar,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '记账流水本 - 本地收支记录与分类占比统计',
  description: '在线记账工具，记录每日收入支出流水，自动汇总本月支出收入结余，条形图展示分类占比，支持按月筛选与 JSON 导出导入，数据保存在本机不上传',
  keywords: '记账工具, 收支记录, 记账本, 支出统计, 分类占比, 月度账单, 本地记账, 流水账',
  author: 'Util工具箱',
  ogTitle: '记账流水本 - 有条工具',
  ogDescription: '记下每一笔收支，看清本月花了多少、花在哪里，数据只存本机',
  ogUrl: 'https://www.util.cn/tools/expense-tracker',
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
          name: '记账流水本',
          url: 'https://www.util.cn/tools/expense-tracker',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['收支记录', '本月汇总', '分类占比条形图', '按月筛选', '本地存储', 'JSON导入导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '记账流水本', item: 'https://www.util.cn/tools/expense-tracker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '记账数据会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，全部数据保存在本机浏览器 localStorage，账目信息不出设备。' }
            },
            {
              '@type': 'Question',
              name: '如何迁移到其他设备？',
              acceptedAnswer: { '@type': 'Answer', text: '使用「导出 JSON」生成备份文件，在新设备的「导入 JSON」中选择该文件即可完整恢复。' }
            },
            {
              '@type': 'Question',
              name: '汇总和占比的统计范围是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '顶部汇总与分类占比统计当前自然月，流水列表可通过下拉框按月份筛选查看。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'expense-tracker')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  loadEntries()
})

// ---------- 状态 ----------
const STORAGE_KEY = 'expense-tracker-data'
const categories = ['餐饮', '交通', '购物', '居住', '娱乐', '医疗', '工资', '理财', '其他']

const entries = ref([])
const form = ref({ date: '', amount: null, type: '支出', category: '餐饮', note: '' })
const monthFilter = ref('all')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const todayStr = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const canSave = computed(() => form.value.amount > 0 && form.value.date && form.value.category)

// ---------- 存储 ----------
const persist = () => {
  if (!process.client) return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value)) } catch (e) { /* 忽略 */ }
}

const loadEntries = () => {
  if (!process.client) return
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(data)) entries.value = data
  } catch (e) { /* 忽略 */ }
  form.value.date = todayStr()
}

// ---------- CRUD ----------
const switchType = (t) => {
  if (form.value.type === t) return
  form.value.type = t
  form.value.category = t === '支出' ? '餐饮' : '工资'
}

const addEntry = () => {
  if (!canSave.value) return
  entries.value.push({
    id: Date.now(),
    date: form.value.date,
    amount: form.value.amount,
    type: form.value.type,
    category: form.value.category,
    note: form.value.note.trim()
  })
  form.value.amount = null
  form.value.note = ''
  persist()
}

const removeEntry = (id) => {
  if (!confirm('确定删除这条记录吗？')) return
  entries.value = entries.value.filter(e => e.id !== id)
  persist()
}

// ---------- 本月汇总 ----------
const currentMonth = computed(() => todayStr().slice(0, 7))

const monthEntries = computed(() => entries.value.filter(e => (e.date || '').startsWith(currentMonth.value)))

const monthExpense = computed(() => monthEntries.value.filter(e => e.type === '支出').reduce((s, e) => s + (Number(e.amount) || 0), 0))
const monthIncome = computed(() => monthEntries.value.filter(e => e.type === '收入').reduce((s, e) => s + (Number(e.amount) || 0), 0))
const monthBalance = computed(() => monthIncome.value - monthExpense.value)

// ---------- 分类占比（本月支出，div 宽度百分比条形图） ----------
const categoryStats = computed(() => {
  const map = {}
  monthEntries.value
    .filter(e => e.type === '支出')
    .forEach(e => { map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0) })
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1
  return Object.entries(map)
    .map(([category, value]) => ({ category, value, pct: Math.round((value / total) * 100) }))
    .sort((a, b) => b.value - a.value)
})

// ---------- 按月筛选的流水 ----------
const monthOptions = computed(() => {
  return [...new Set(entries.value.map(e => (e.date || '').slice(0, 7)).filter(Boolean))]
    .sort()
    .reverse()
})

const filteredEntries = computed(() => {
  let list = [...entries.value]
  if (monthFilter.value !== 'all') list = list.filter(e => (e.date || '').startsWith(monthFilter.value))
  return list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || 0) - (a.id || 0))
})

// ---------- 导入导出 ----------
const exportData = () => {
  const blob = new Blob([JSON.stringify(entries.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'expenses-' + new Date().toISOString().slice(0, 10) + '.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const importData = async (e) => {
  const f = e.target.files?.[0]
  if (!f) return
  try {
    const data = JSON.parse(await f.text())
    if (!Array.isArray(data)) throw new Error('格式错误')
    const valid = data.filter(item => item.date && Number(item.amount) > 0 && (item.type === '支出' || item.type === '收入'))
    entries.value = valid.map((item, i) => ({
      id: item.id || Date.now() + i,
      date: item.date,
      amount: Number(item.amount),
      type: item.type,
      category: categories.includes(item.category) ? item.category : '其他',
      note: item.note || ''
    }))
    persist()
    alert('已导入 ' + valid.length + ' 条记录')
  } catch (err) {
    alert('导入失败：文件格式不正确')
  }
  e.target.value = ''
}
</script>
