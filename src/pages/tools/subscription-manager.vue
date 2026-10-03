<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CreditCard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">订阅费用管理器</h1>
          <p class="text-sm text-muted-foreground mt-1">管理视频/软件/AI 各类订阅，看清每月真实开销</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        录入你的各类订阅（周期、价格、下次扣费日），自动换算月度成本、汇总年化支出，并在临近扣费时高亮提醒。数据只保存在本机浏览器 localStorage，账单信息不上传任何服务器，支持 JSON 导出备份。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：添加表单 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Plus class="w-5 h-5 mr-2 text-primary" /> {{ editingId ? '编辑订阅' : '添加订阅' }}
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">名称</label>
            <input v-model="form.name" type="text" placeholder="例如：视频会员 / AI 助手"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">价格（元）</label>
              <input v-model.number="form.price" type="number" min="0" step="0.1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">周期</label>
              <select v-model="form.cycle"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="month">每月</option>
                <option value="year">每年</option>
                <option value="week">每周</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">下次扣费日期</label>
            <input v-model="form.nextDate" type="date"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">分类</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="c in categories"
                :key="c"
                @click="form.category = c"
                :class="form.category === c ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >{{ c }}</button>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="saveSubscription" :disabled="!canSave"
              class="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all">
              {{ editingId ? '保存修改' : '添加' }}
            </button>
            <button v-if="editingId" @click="cancelEdit"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2.5 rounded-lg text-sm transition-all">
              取消
            </button>
          </div>
        </div>

        <!-- 备份 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Database class="w-4 h-4 mr-2 text-primary" /> 数据备份
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <button @click="exportData"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5">
              <Download class="w-3.5 h-3.5" /> 导出 JSON
            </button>
            <label
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload class="w-3.5 h-3.5" /> 导入 JSON
              <input type="file" accept=".json" class="hidden" @change="importData" />
            </label>
          </div>
          <p class="text-xs text-muted-foreground mt-2.5">数据仅存于本机浏览器，清除浏览器数据前请先导出备份。</p>
        </div>
      </div>

      <!-- 右侧：统计与列表 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 汇总 -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-foreground">¥{{ monthlyTotal.toFixed(0) }}</p>
            <p class="text-xs text-muted-foreground mt-1">每月合计</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-primary">¥{{ yearlyTotal.toFixed(0) }}</p>
            <p class="text-xs text-muted-foreground mt-1">每年合计</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-foreground">{{ subscriptions.length }}</p>
            <p class="text-xs text-muted-foreground mt-1">订阅数量</p>
          </div>
        </div>

        <!-- 即将扣费提醒 -->
        <div v-if="dueSoon.length > 0" class="bg-card border border-yellow-500/40 rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <BellRing class="w-4 h-4 mr-2 text-yellow-500" /> 7 天内即将扣费
          </h3>
          <div class="space-y-2">
            <div v-for="s in dueSoon" :key="s.id" class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
              <span class="text-sm text-foreground">{{ s.name }}</span>
              <span class="text-sm font-medium text-yellow-500">{{ daysUntil(s.nextDate) }} 天后 ¥{{ s.price }}</span>
            </div>
          </div>
        </div>

        <!-- 列表 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground">我的订阅</h2>
            <span v-if="subscriptions.length > 0" class="text-xs text-muted-foreground">按下次扣费时间排序</span>
          </div>
          <div v-if="subscriptions.length === 0" class="py-14 text-center">
            <CreditCard class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">还没有订阅记录，从左侧添加第一个</p>
          </div>
          <div v-else class="divide-y divide-border/50">
            <div v-for="s in sortedList" :key="s.id" class="flex items-center gap-4 px-6 py-3.5">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground">{{ s.name }}
                  <span class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{{ s.category }}</span>
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  ¥{{ s.price }}/{{ cycleLabel(s.cycle) }} · 下次扣费 {{ s.nextDate }}
                  <span v-if="daysUntil(s.nextDate) <= 7" class="text-yellow-500 ml-1">（{{ daysUntil(s.nextDate) === 0 ? '今天' : daysUntil(s.nextDate) + ' 天后' }}）</span>
                </p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-sm font-medium text-foreground">¥{{ monthlyEquivalent(s).toFixed(0) }}</p>
                <p class="text-[10px] text-muted-foreground">折合/月</p>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button @click="startEdit(s)" class="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="编辑">
                  <PenTool class="w-3.5 h-3.5" />
                </button>
                <button @click="removeSubscription(s.id)" class="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="删除">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么要管理订阅</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>订阅制服务的单笔金额小、扣费周期长，极易被遗忘——调查显示用户普遍低估自己的订阅支出 30% 以上。视频、音乐、云存储、AI 助手、健身应用叠加起来，年化开销常常超过一部手机。把所有订阅集中记录、按月折算，是控制「隐形支出」最直接的办法。</p>
          <h3 class="text-lg font-semibold text-foreground">使用建议</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>每季度盘点一次：连续两个月没用到的订阅果断退订</li>
            <li>年付订阅先算月均价：年付通常省 15%-25%，但前提是你确定用满一年</li>
            <li>临近扣费提醒（7 天内高亮）给了你一个冷静期窗口</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">数据安全吗？</span>全部保存在本机浏览器 localStorage，不注册、不上传；换设备用导出/导入 JSON 迁移。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'subscription-manager'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CreditCard, Plus, Trash2, PenTool, Download, Upload, Database,
  BellRing, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '订阅费用管理器 - 管理订阅服务与续费提醒',
  description: '本地订阅管理工具，记录视频/软件/AI等订阅服务的价格周期与扣费日，自动换算月度年化支出，临近扣费高亮提醒，数据保存在本机不上传',
  keywords: '订阅管理, 订阅提醒, 订阅费用, 续费管理, 订阅记账, 订阅开支',
  author: 'Util工具箱',
  ogTitle: '订阅费用管理器 - 有条工具',
  ogDescription: '管理各类订阅，看清每月真实开销，数据只存本机',
  ogUrl: 'https://www.util.cn/tools/subscription-manager',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: '订阅费用管理器', url: 'https://www.util.cn/tools/subscription-manager', applicationCategory: 'FinanceApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['月度成本折算', '续费提醒', '本地存储', 'JSON导入导出'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
          { '@type': 'ListItem', position: 3, name: '订阅费用管理器', item: 'https://www.util.cn/tools/subscription-manager/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'subscription-manager')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  loadSubscriptions()
})

const STORAGE_KEY = 'subscription-manager-data'
const categories = ['视频', '音乐', 'AI', '软件', '云服务', '其他']

const subscriptions = ref([])
const editingId = ref(null)
const form = ref({ name: '', price: null, cycle: 'month', nextDate: '', category: '视频' })
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const canSave = computed(() => form.value.name.trim() && form.value.price > 0 && form.value.nextDate)

// ---------- 存储 ----------
const persist = () => {
  if (!process.client) return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions.value)) } catch (e) { /* 忽略 */ }
}

const loadSubscriptions = () => {
  if (!process.client) return
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(data)) subscriptions.value = data
  } catch (e) { /* 忽略 */ }
}

// ---------- CRUD ----------
const saveSubscription = () => {
  if (!canSave.value) return
  if (editingId.value) {
    const idx = subscriptions.value.findIndex(s => s.id === editingId.value)
    if (idx > -1) subscriptions.value[idx] = { ...subscriptions.value[idx], ...form.value }
  } else {
    subscriptions.value.push({ id: Date.now(), ...form.value })
  }
  persist()
  cancelEdit()
}

const startEdit = (s) => {
  editingId.value = s.id
  form.value = { name: s.name, price: s.price, cycle: s.cycle, nextDate: s.nextDate, category: s.category }
}

const cancelEdit = () => {
  editingId.value = null
  form.value = { name: '', price: null, cycle: 'month', nextDate: '', category: '视频' }
}

const removeSubscription = (id) => {
  if (!confirm('确定删除该订阅记录吗？')) return
  subscriptions.value = subscriptions.value.filter(s => s.id !== id)
  if (editingId.value === id) cancelEdit()
  persist()
}

// ---------- 计算 ----------
const cycleLabel = (c) => ({ month: '月', year: '年', week: '周' }[c] || c)

const monthlyEquivalent = (s) => {
  if (s.cycle === 'month') return s.price
  if (s.cycle === 'year') return s.price / 12
  return s.price * 12 / 52
}

const monthlyTotal = computed(() => subscriptions.value.reduce((sum, s) => sum + monthlyEquivalent(s), 0))
const yearlyTotal = computed(() => monthlyTotal.value * 12)

const daysUntil = (dateStr) => {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target - now) / 86400000)
}

const sortedList = computed(() => [...subscriptions.value].sort((a, b) => a.nextDate.localeCompare(b.nextDate)))
const dueSoon = computed(() => sortedList.value.filter(s => daysUntil(s.nextDate) >= 0 && daysUntil(s.nextDate) <= 7))

// ---------- 导入导出 ----------
const exportData = () => {
  const blob = new Blob([JSON.stringify(subscriptions.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.json`
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
    const valid = data.filter(s => s.name && s.price > 0 && s.nextDate)
    subscriptions.value = valid.map((s, i) => ({ id: s.id || Date.now() + i, ...s }))
    persist()
    alert(`已导入 ${valid.length} 条订阅`)
  } catch (err) {
    alert('导入失败：文件格式不正确')
  }
  e.target.value = ''
}
</script>
