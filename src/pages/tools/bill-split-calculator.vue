<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Users class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">AA分账计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">记录谁付了钱、谁参与了消费，算出最少笔数的转账方案</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        添加参与者与每笔支出（金额、付款人、参与人），自动计算每人已付、应摊与净差额，并用贪心算法得出「A → B ¥xx」的最小转账方案，比两两直接结清少跑好几趟。数据暂存在本机浏览器 localStorage，清空浏览器数据前请先导出。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：参与者与支出录入 -->
      <div class="space-y-6">
        <!-- 参与者 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Users class="w-5 h-5 mr-2 text-primary" /> 参与者（{{ people.length }} 人）
          </h2>
          <div class="flex gap-2">
            <input
              v-model="newPerson"
              type="text"
              placeholder="输入姓名，如：张三"
              class="flex-1 min-w-0 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              @keyup.enter="addPerson"
            />
            <button
              @click="addPerson"
              :disabled="!newPerson.trim()"
              class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
            >
              <Plus class="w-4 h-4" /> 添加
            </button>
          </div>
          <div v-if="people.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="p in people"
              :key="p"
              class="inline-flex items-center gap-1.5 bg-muted text-foreground text-xs px-2.5 py-1.5 rounded-full"
            >
              {{ p }}
              <button @click="removePerson(p)" class="text-muted-foreground hover:text-destructive transition-colors" title="移除">
                <Trash2 class="w-3 h-3" />
              </button>
            </span>
          </div>
          <p v-else class="text-xs text-muted-foreground">先添加参与分账的成员，再加支出记录</p>

          <div class="flex gap-2 pt-1">
            <button
              @click="loadSample"
              class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <List class="w-3.5 h-3.5" /> 载入示例数据
            </button>
            <button
              @click="clearAll"
              class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 class="w-3.5 h-3.5" /> 清空全部
            </button>
          </div>
        </div>

        <!-- 添加支出 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Receipt class="w-5 h-5 mr-2 text-primary" /> 添加支出
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">描述</label>
            <input
              v-model="form.desc"
              type="text"
              placeholder="例如：晚餐 / 打车 / 门票"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">金额（元）</label>
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">付款人</label>
              <select
                v-model="form.payer"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>请选择</option>
                <option v-for="p in people" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-foreground">参与人（均摊）</label>
              <div class="flex gap-2 text-xs">
                <button @click="form.participants = [...people]" class="text-muted-foreground hover:text-primary transition-colors">全选</button>
                <button @click="form.participants = []" class="text-muted-foreground hover:text-primary transition-colors">清空</button>
              </div>
            </div>
            <div v-if="people.length" class="flex flex-wrap gap-1.5">
              <button
                v-for="p in people"
                :key="p"
                @click="toggleParticipant(p)"
                :class="form.participants.includes(p) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1"
              >
                <CheckSquare v-if="form.participants.includes(p)" class="w-3 h-3" />
                {{ p }}
              </button>
            </div>
            <p v-else class="text-xs text-muted-foreground">请先添加参与者</p>
          </div>
          <button
            @click="addExpense"
            :disabled="!canAdd"
            class="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
          >
            添加支出
          </button>
        </div>
      </div>

      <!-- 右侧：记录与结算 -->
      <div class="space-y-6">
        <!-- 支出记录 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <List class="w-5 h-5 mr-2 text-primary" /> 支出记录（{{ expenses.length }} 笔）
            </h2>
          </div>
          <div v-if="expenses.length === 0" class="py-12 text-center">
            <Receipt class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">还没有支出记录，从左侧添加第一笔</p>
          </div>
          <div v-else class="divide-y divide-border/50">
            <div v-for="e in expenses" :key="e.id" class="flex items-center gap-3 px-6 py-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground truncate">{{ e.desc }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {{ e.payer }} 付款 · {{ (e.participants || []).length }} 人均摊（{{ (e.participants || []).join('、') }}）
                </p>
              </div>
              <span class="text-sm font-semibold text-foreground flex-shrink-0">¥{{ fmtYuan(e.amount) }}</span>
              <button
                @click="removeExpense(e.id)"
                class="p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                title="删除"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- 结算结果 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 结算结果
          </h2>

          <div v-if="!people.length" class="py-8 text-center">
            <Users class="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">添加参与者与支出后，这里会显示结算方案</p>
          </div>
          <template v-else>
            <!-- 每人明细 -->
            <div class="space-y-0.5 text-sm mb-5">
              <div class="flex items-center justify-between py-2 border-b border-border/50 text-xs text-muted-foreground">
                <span class="w-16">成员</span>
                <span class="w-24 text-right">已付</span>
                <span class="w-24 text-right">应摊</span>
                <span class="w-28 text-right">净差额</span>
              </div>
              <div v-for="r in settlement.rows" :key="r.name" class="flex items-center justify-between py-2 border-b border-border/50">
                <span class="w-16 text-foreground font-medium truncate">{{ r.name }}</span>
                <span class="w-24 text-right text-muted-foreground">¥{{ fmtCents(r.paid) }}</span>
                <span class="w-24 text-right text-muted-foreground">¥{{ fmtCents(r.should) }}</span>
                <span class="w-28 text-right font-medium" :class="netClass(r.net)">
                  {{ netLabel(r.net) }}
                </span>
              </div>
            </div>

            <!-- 最小转账方案 -->
            <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
              <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 最小转账方案（贪心）
            </h3>
            <div v-if="settlement.transfers.length === 0" class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-sm font-medium text-primary">账目已两清，无需转账</p>
            </div>
            <div v-else class="space-y-2 mb-3">
              <div
                v-for="(t, i) in settlement.transfers"
                :key="i"
                class="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5"
              >
                <span class="text-sm text-foreground">
                  <span class="font-medium">{{ t.from }}</span>
                  <span class="text-muted-foreground mx-2">→</span>
                  <span class="font-medium">{{ t.to }}</span>
                </span>
                <span class="text-sm font-semibold text-foreground">¥{{ fmtCents(t.amount) }}</span>
              </div>
            </div>
            <p v-if="settlement.transfers.length > 0" class="text-xs text-muted-foreground leading-relaxed">
              共 <span class="text-primary font-medium">{{ settlement.transfers.length }}</span> 笔转账即可全部结清
              <template v-if="settlement.naiveCount > settlement.transfers.length">
                ；若两两直接结清需要 {{ settlement.naiveCount }} 笔，本方案少跑 {{ settlement.naiveCount - settlement.transfers.length }} 趟。
              </template>
              <template v-else>；已经是理论最少笔数。</template>
            </p>
          </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于AA分账</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            旅行、聚餐、合租、团建……多人共同消费后「谁该给谁转多少钱」往往算成一锅粥。AA分账的核心思路是：每个人只关心两个数——实际付出了多少、应该承担多少，两者之差就是净差额（正数代表别人欠你，负数代表你欠别人）。只要按净差额完成转账，所有人账目即两清。
          </p>
          <h3 class="text-lg font-semibold text-foreground">最小转账方案是怎么算的</h3>
          <p>
            直观做法是两两直接结清，n 个人最多需要 n(n-1)/2 笔转账。本工具采用贪心算法压缩笔数：每一步都让「欠得最多的人」向「应得最多的人」转账尽可能大的金额，直到所有净差额归零。数学上可以证明，n 个人的净差额结算最少不需要超过 n-1 笔，贪心方案即可达到这个下界。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">一笔支出只有部分人参与怎么办？</span>添加支出时勾选参与人即可，金额只在参与人之间均摊，未参与者不承担。</li>
            <li><span class="text-foreground font-medium">为什么总额会有几分的出入？</span>均摊金额按分取整，除不尽的零头会归入该笔支出的付款人，保证总账守恒。</li>
            <li><span class="text-foreground font-medium">数据保存在哪里？</span>保存在本机浏览器 localStorage，不上传任何服务器；清除浏览器数据会一并清除，请先备份。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'bill-split-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Users, Plus, Trash2, Receipt, CheckSquare, CheckCircle, Calculator, List,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'AA分账计算器 - 多人聚会拼账与最小转账方案',
  description: '在线AA分账工具，记录多人消费的付款人与参与人，自动计算每人已付应摊与净差额，用贪心算法生成最少笔数的转账方案（A→B ¥xx），支持示例数据与本地暂存',
  keywords: 'aa分账, 分账计算器, 聚会记账, 团费分摊, 最小转账, 多人拼单结算, 差旅分账',
  author: 'Util工具箱',
  ogTitle: 'AA分账计算器 - 有条工具',
  ogDescription: '谁付了钱、谁参与消费一目了然，算出最少笔数的转账方案',
  ogUrl: 'https://www.util.cn/tools/bill-split-calculator',
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
          name: 'AA分账计算器',
          url: 'https://www.util.cn/tools/bill-split-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['参与者管理', '多付款人支出记录', '净差额计算', '最小转账方案', '本地暂存']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: 'AA分账计算器', item: 'https://www.util.cn/tools/bill-split-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '最小转账方案是怎么计算的？',
              acceptedAnswer: { '@type': 'Answer', text: '采用贪心算法：每一步让欠款最多的人向应收最多的人转账尽可能大的金额，n 个人的账目最多 n-1 笔即可结清。' }
            },
            {
              '@type': 'Question',
              name: '一笔支出只有部分人参与怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '添加支出时勾选参与人，金额只在参与人之间均摊，未勾选的成员不承担该笔费用。' }
            },
            {
              '@type': 'Question',
              name: '分账数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，全部数据只保存在本机浏览器 localStorage，计算也在本地完成。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'bill-split-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  loadData()
})

// ---------- 状态 ----------
const STORAGE_KEY = 'bill-split-calculator-data'

const people = ref([])
const expenses = ref([])
const newPerson = ref('')
const form = ref({ desc: '', amount: null, payer: '', participants: [] })
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const canAdd = computed(() =>
  form.value.amount > 0 && form.value.payer && form.value.participants.length > 0 && people.value.length > 0
)

// ---------- 存储 ----------
const persist = () => {
  if (!process.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ people: people.value, expenses: expenses.value }))
  } catch (e) { /* 忽略 */ }
}

const loadData = () => {
  if (!process.client) return
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (data && Array.isArray(data.people) && Array.isArray(data.expenses)) {
      people.value = data.people
      expenses.value = data.expenses
    }
  } catch (e) { /* 忽略 */ }
  syncFormDefaults()
}

const syncFormDefaults = () => {
  if (!form.value.payer && people.value.length) form.value.payer = people.value[0]
  form.value.participants = form.value.participants.filter(p => people.value.includes(p))
}

// ---------- 参与者 ----------
const addPerson = () => {
  const name = newPerson.value.trim()
  if (!name) return
  if (people.value.includes(name)) {
    alert('该成员已存在')
    return
  }
  people.value.push(name)
  if (!form.value.payer) form.value.payer = name
  newPerson.value = ''
  persist()
}

const removePerson = (name) => {
  if (!confirm('确定移除「' + name + '」？其参与的支出记录会同步清理。')) return
  people.value = people.value.filter(p => p !== name)
  expenses.value = expenses.value
    .map(e => ({ ...e, participants: (e.participants || []).filter(p => p !== name) }))
    .filter(e => e.payer !== name && (e.participants || []).length > 0)
  syncFormDefaults()
  persist()
}

// ---------- 支出 ----------
const toggleParticipant = (name) => {
  const idx = form.value.participants.indexOf(name)
  if (idx > -1) form.value.participants.splice(idx, 1)
  else form.value.participants.push(name)
}

const addExpense = () => {
  if (!canAdd.value) return
  expenses.value.push({
    id: Date.now(),
    desc: form.value.desc.trim() || '未命名支出',
    amount: form.value.amount,
    payer: form.value.payer,
    participants: [...form.value.participants]
  })
  form.value.desc = ''
  form.value.amount = null
  form.value.participants = [...people.value]
  persist()
}

const removeExpense = (id) => {
  expenses.value = expenses.value.filter(e => e.id !== id)
  persist()
}

// ---------- 示例与清空 ----------
const loadSample = () => {
  people.value = ['张三', '李四', '王五']
  expenses.value = [
    { id: 1, desc: '周末聚餐', amount: 480, payer: '张三', participants: ['张三', '李四', '王五'] },
    { id: 2, desc: '打车', amount: 60, payer: '李四', participants: ['张三', '李四'] },
    { id: 3, desc: '电影票', amount: 189, payer: '王五', participants: ['张三', '王五'] }
  ]
  form.value.payer = '张三'
  form.value.participants = [...people.value]
  persist()
}

const clearAll = () => {
  if (!confirm('确定清空所有参与者和支出记录吗？')) return
  people.value = []
  expenses.value = []
  form.value = { desc: '', amount: null, payer: '', participants: [] }
  if (process.client) {
    try { localStorage.removeItem(STORAGE_KEY) } catch (e) { /* 忽略 */ }
  }
}

// ---------- 结算（以分为单位计算，避免浮点误差） ----------
const settlement = computed(() => {
  if (!people.value.length) return { rows: [], transfers: [], naiveCount: 0 }

  const paid = {}, should = {}
  people.value.forEach(p => { paid[p] = 0; should[p] = 0 })

  for (const e of expenses.value) {
    const cents = Math.round((Number(e.amount) || 0) * 100)
    if (paid[e.payer] !== undefined) paid[e.payer] += cents
    const ps = (e.participants || []).filter(p => paid[p] !== undefined)
    if (!ps.length || cents <= 0) continue
    const share = Math.floor(cents / ps.length)
    const remainder = cents - share * ps.length
    ps.forEach(p => { should[p] += share })
    // 除不尽的零头归付款人，保证总账守恒
    if (should[e.payer] !== undefined) should[e.payer] += remainder
    else should[ps[0]] += remainder
  }

  const rows = people.value.map(p => ({ name: p, paid: paid[p], should: should[p], net: paid[p] - should[p] }))

  // 贪心求最小转账：欠款最多者 → 应收最多者
  const creditors = rows.filter(r => r.net > 0).map(r => ({ name: r.name, amt: r.net })).sort((a, b) => b.amt - a.amt)
  const debtors = rows.filter(r => r.net < 0).map(r => ({ name: r.name, amt: -r.net })).sort((a, b) => b.amt - a.amt)
  const transfers = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt)
    if (pay > 0) transfers.push({ from: debtors[i].name, to: creditors[j].name, amount: pay })
    debtors[i].amt -= pay
    creditors[j].amt -= pay
    if (debtors[i].amt <= 0) i++
    if (creditors[j].amt <= 0) j++
  }

  const n = people.value.length
  return { rows, transfers, naiveCount: n > 1 ? (n * (n - 1)) / 2 : 0 }
})

// ---------- 展示 ----------
const fmtYuan = (v) => (Number(v) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCents = (cents) => (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const netLabel = (net) => {
  if (net > 0) return '+' + fmtCents(net) + ' 应收'
  if (net < 0) return '−' + fmtCents(-net) + ' 应付'
  return '¥0.00 已结清'
}

const netClass = (net) => {
  if (net > 0) return 'text-destructive' // 应收为正，红色
  if (net < 0) return 'text-green-600'   // 应付为负，绿色
  return 'text-muted-foreground'
}
</script>
