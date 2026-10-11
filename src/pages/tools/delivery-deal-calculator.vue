<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Percent class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">外卖满减凑单计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">动态规划求最优凑单组合，自动对比各档位实付并给出"凑单不划算"警示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入商家的满减档位、购物车已有菜品和可加购菜品，工具会对每个档位用子集和动态规划（金额按分取整）找出加购金额最小的凑单组合，再对比"凑到各档实付"与"直接下单实付"（含配送费），给出真正省钱的方案。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <!-- 满减档位 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground flex items-center">
              <BadgePercent class="w-4 h-4 mr-1.5 text-primary" /> 满减档位
            </label>
            <button @click="addTier" class="text-xs px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition flex items-center">
              <Plus class="w-3.5 h-3.5 mr-1" /> 加档位
            </button>
          </div>
          <div v-for="(t, i) in dealTiers" :key="i" class="flex items-center gap-2 mb-2">
            <span class="text-sm text-muted-foreground">满</span>
            <input v-model.number="t.full" type="number" min="0" step="1" class="w-24 px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <span class="text-sm text-muted-foreground">减</span>
            <input v-model.number="t.off" type="number" min="0" step="1" class="w-24 px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <button @click="removeTier(i)" :disabled="dealTiers.length <= 1" class="p-1.5 text-muted-foreground hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed" title="删除该档位">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 购物车已有菜品 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground flex items-center">
              <ShoppingCart class="w-4 h-4 mr-1.5 text-primary" /> 购物车已有菜品
            </label>
            <button @click="addCartItem" class="text-xs px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition flex items-center">
              <Plus class="w-3.5 h-3.5 mr-1" /> 加菜品
            </button>
          </div>
          <div v-for="(it, i) in cartItems" :key="i" class="flex items-center gap-2 mb-2">
            <input v-model="it.name" type="text" placeholder="菜品名称" class="flex-1 px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <input v-model.number="it.price" type="number" min="0" step="0.1" placeholder="单价" class="w-24 px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <button @click="removeCartItem(i)" :disabled="cartItems.length <= 1" class="p-1.5 text-muted-foreground hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed" title="删除">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <p class="text-xs text-muted-foreground">购物车小计：<span class="text-foreground font-medium">¥{{ fmtFen(cartFen) }}</span></p>
        </div>

        <!-- 候选凑单菜品 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground flex items-center">
              <UtensilsCrossed class="w-4 h-4 mr-1.5 text-primary" /> 候选凑单菜品（可加购）
            </label>
            <button @click="addAddItem" class="text-xs px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition flex items-center">
              <Plus class="w-3.5 h-3.5 mr-1" /> 加菜品
            </button>
          </div>
          <div v-for="(it, i) in addItems" :key="i" class="flex items-center gap-2 mb-2">
            <input v-model="it.name" type="text" placeholder="菜品名称" class="flex-1 px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <input v-model.number="it.price" type="number" min="0" step="0.1" placeholder="单价" class="w-24 px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <button @click="removeAddItem(i)" :disabled="addItems.length <= 1" class="p-1.5 text-muted-foreground hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed" title="删除">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <p class="text-xs text-muted-foreground">最多参与枚举前 30 个候选菜品；每个菜品最多加购一份</p>
        </div>

        <!-- 配送费 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">配送费（元，可选）</label>
          <input v-model.number="deliveryFee" type="number" min="0" step="0.5" class="w-40 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <p class="text-xs text-muted-foreground mt-1.5">凑单与直接下单都按同一配送费对比</p>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 最优方案
        </h2>

        <div v-if="result" class="space-y-4">
          <!-- 直接下单基准 -->
          <div class="p-4 bg-muted/50 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">不凑单直接下单（用满已有档位）</span>
              <span class="font-semibold text-foreground">¥{{ fmtFen(result.baselinePay) }}</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1">购物车小计 ¥{{ fmtFen(result.cartFen) }}<span v-if="result.baselineOff > 0"> − 满减 ¥{{ fmtFen(result.baselineOff) }}</span> + 配送 ¥{{ fmtFen(result.deliveryFen) }}</p>
          </div>

          <!-- 最优方案卡片 -->
          <div class="p-4 rounded-lg" :class="result.directBetter ? 'bg-muted/50' : 'bg-primary/10'">
            <p class="text-xs text-muted-foreground mb-1">推荐方案</p>
            <template v-if="result.directBetter">
              <p class="text-lg font-bold text-foreground">直接下单，不凑单</p>
              <p class="text-sm text-muted-foreground mt-1">加购凑单后实付不会更低，或候选菜品凑不到任何更高档位</p>
            </template>
            <template v-else>
              <p class="text-lg font-bold text-primary">
                凑「满{{ fenYuan(result.best.tier.fullFen) }}减{{ fenYuan(result.best.tier.offFen) }}」档
              </p>
              <p class="text-sm text-muted-foreground mt-1">
                加购：<span class="text-foreground font-medium">{{ result.best.items.map(i => `${i.name}（¥${fmtFen(i.priceFen)}）`).join(' + ') }}</span>
              </p>
              <p class="text-sm text-muted-foreground mt-0.5">
                凑单后小计 ¥{{ fmtFen(result.cartFen + result.best.addFen) }} − 减 ¥{{ fmtFen(result.best.tier.offFen) }} + 配送 ¥{{ fmtFen(result.deliveryFen) }} = 实付
                <span class="text-primary font-bold">¥{{ fmtFen(result.best.pay) }}</span>
              </p>
              <p class="text-sm mt-1" :class="result.saving > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-muted-foreground'">
                相比直接下单{{ result.saving > 0 ? `省 ¥${fmtFen(result.saving)}` : '不省钱' }}
              </p>
            </template>
          </div>

          <!-- 凑单不划算警示 -->
          <div v-if="result.notWorthIt" class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-amber-700 dark:text-amber-300">
              凑单不划算：最优加购金额（¥{{ fmtFen(result.best.addFen) }}）已贴近档位差额（¥{{ fmtFen(result.best.needFen) }}）+1 元，且省额（¥{{ fmtFen(Math.max(0, result.saving)) }}）小于加购额，多花的钱买来的折扣不值回票价，建议直接下单或换更便宜的小菜。
            </p>
          </div>

          <!-- 各档位对比表 -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th class="py-2 pr-2 font-medium">档位</th>
                  <th class="py-2 pr-2 font-medium">还差</th>
                  <th class="py-2 pr-2 font-medium">最小加购组合</th>
                  <th class="py-2 pr-2 font-medium">凑单实付</th>
                  <th class="py-2 font-medium">相比直接下单</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in result.plans" :key="i" class="border-b border-border/50" :class="result.best && p.tierIdx === result.best.tierIdx ? 'bg-primary/5' : ''">
                  <td class="py-2 pr-2 text-foreground whitespace-nowrap">满{{ fenYuan(p.tier.fullFen) }}减{{ fenYuan(p.tier.offFen) }}</td>
                  <td class="py-2 pr-2 text-muted-foreground whitespace-nowrap">{{ p.needFen > 0 ? '¥' + fmtFen(p.needFen) : '已达成' }}</td>
                  <td class="py-2 pr-2 text-foreground">
                    <template v-if="!p.reachable"><span class="text-muted-foreground">候选菜品总额不够，凑不到</span></template>
                    <template v-else-if="p.addFen === 0"><span class="text-muted-foreground">无需加购</span></template>
                    <template v-else>{{ p.items.map(i2 => `${i2.name} ¥${fmtFen(i2.priceFen)}`).join(' + ') }}（共 ¥{{ fmtFen(p.addFen) }}）</template>
                  </td>
                  <td class="py-2 pr-2 font-medium text-foreground whitespace-nowrap">{{ p.reachable ? '¥' + fmtFen(p.pay) : '—' }}</td>
                  <td class="py-2 whitespace-nowrap" :class="p.pay < result.baselinePay ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                    {{ p.reachable ? ((result.baselinePay - p.pay > 0 ? '省 ¥' + fmtFen(result.baselinePay - p.pay) : '不省钱')) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground">实付 = 凑单后小计 − 满减金额 + 配送费；金额按分取整，避免浮点误差。</p>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请先填写满减档位和购物车金额
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        提示：本工具假设满减与配送费规则如你输入所示，未考虑红包、会员折扣、配送费满免等叠加优惠；不同平台"凑单后退款"规则不同，凑单菜品请在确认订单前想好是否真的需要。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于外卖满减凑单</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            外卖平台的"满30减10、满50减25"式满减是叠加在整单小计上的优惠。凑单的本质是一道优化题：在候选菜品中挑出一个加购组合，使小计刚好越过某个档位，同时加购金额尽量小、凑单后的实付尽量低。凑得不好，反而会"为了省10块多花20块"。
          </p>
          <h3 class="text-lg font-semibold text-foreground">怎样算出最优凑单组合</h3>
          <p>
            本工具把金额换算成"分"避免浮点误差，对每个满减档位计算还差多少钱，再用 0/1 子集和动态规划在候选菜品中枚举所有加购组合，找出达到该档位的最小加购金额组合；随后把"凑到每一档的实付（小计 − 满减 + 配送费）"与"直接下单实付"逐一对比，取最小者作为推荐方案。
          </p>
          <h3 class="text-lg font-semibold text-foreground">什么时候凑单不划算</h3>
          <p>
            常见的有两种情况：一是加购金额已贴近档位差额（例如还差5元却最低要加6元），且省下的钱小于加购花的钱，等于白花钱；二是候选菜品太贵，凑到高档位后实付反而高于"用满低档直接下单"。本工具会在最优方案命中第一种情况时给出醒目警示，第二种情况则直接建议"直接下单，不凑单"。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">菜品可以加购多份吗？</span>目前按每个菜品最多一份做子集枚举，如需多份可以把同一菜品分行填入，效果等同。</li>
            <li><span class="text-foreground font-medium">配送费怎么参与计算？</span>凑单与不凑单按同一配送费对比；若平台"满额免配送费"，可把免配额当成一个"满X减配送费"的档位另行心算。</li>
            <li><span class="text-foreground font-medium">为什么结果和平台优惠不一样？</span>平台可能叠加红包、会员折扣、神券等，本工具只按你输入的满减档位与配送费做纯数学比较，结果供下单前参考。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'delivery-deal-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Percent, BadgePercent, ShoppingCart, UtensilsCrossed, Plus, Trash2,
  Lightbulb, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '外卖满减凑单计算器 - 最优凑单组合一键算出',
  description: '输入满减档位与购物车菜品，动态规划找出最小加购组合，对比各档位凑单实付与直接下单，附凑单不划算警示，纯本地计算',
  keywords: '外卖凑单计算器, 满减凑单, 满减最优解, 凑单神器, 外卖省钱, 满减计算',
  author: 'Util工具箱',
  ogTitle: '外卖满减凑单计算器 - 有条工具',
  ogDescription: '动态规划求最优凑单组合，自动对比各档位实付并给出凑单不划算警示',
  ogUrl: 'https://www.util.cn/tools/delivery-deal-calculator',
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
          name: '外卖满减凑单计算器',
          url: 'https://www.util.cn/tools/delivery-deal-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['满减档位自定义', 'DP最小加购组合', '各档位实付对比', '凑单不划算警示', '含配送费对比']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '外卖满减凑单计算器', item: 'https://www.util.cn/tools/delivery-deal-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎样算出最优凑单组合？',
              acceptedAnswer: { '@type': 'Answer', text: '金额按分取整后，对每个满减档位用 0/1 子集和动态规划枚举候选菜品的加购组合，取达到该档位的最小加购金额，再对比各档凑单实付与直接下单实付取最低。' }
            },
            {
              '@type': 'Question',
              name: '什么时候凑单不划算？',
              acceptedAnswer: { '@type': 'Answer', text: '当最优加购金额已贴近档位差额加1元，且省额小于加购额时，凑单等于白花钱，工具会给出警示。' }
            },
            {
              '@type': 'Question',
              name: '菜品可以加购多份吗？',
              acceptedAnswer: { '@type': 'Answer', text: '按每个菜品最多一份枚举，如需多份可把同一菜品分行填入候选列表，效果等同。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'delivery-deal-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const dealTiers = ref([
  { full: 20, off: 4 },
  { full: 30, off: 10 }
])
const cartItems = ref([
  { name: '主菜', price: 15 }
])
const addItems = ref([
  { name: '可乐', price: 6 },
  { name: '鸡翅', price: 8 }
])
const deliveryFee = ref(0)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const addTier = () => { dealTiers.value.push({ full: 0, off: 0 }) }
const removeTier = (i) => { dealTiers.value.splice(i, 1) }
const addCartItem = () => { cartItems.value.push({ name: '', price: 0 }) }
const removeCartItem = (i) => { cartItems.value.splice(i, 1) }
const addAddItem = () => { addItems.value.push({ name: '', price: 0 }) }
const removeAddItem = (i) => { addItems.value.splice(i, 1) }

// ---------- 工具函数（金额按分取整） ----------
const toFen = (v) => {
  const n = Number(v)
  if (!isFinite(n) || n <= 0) return 0
  return Math.round(n * 100)
}
const fmtFen = (f) => ((isFinite(f) ? f : 0) / 100).toFixed(2)
const fenYuan = (f) => String((isFinite(f) ? f : 0) / 100)

// 0/1 子集和 DP：在候选菜品中找 加购金额最小 且 >= needFen 的组合
const minAddCombo = (candidates, needFen) => {
  if (needFen <= 0) return { addFen: 0, items: [] }
  const cands = candidates.filter(c => c.priceFen > 0).slice(0, 30)
  if (!cands.length) return null
  const total = cands.reduce((s, c) => s + c.priceFen, 0)
  if (total < needFen) return null
  const maxP = cands.reduce((m, c) => Math.max(m, c.priceFen), 0)
  const cap = needFen + maxP
  const dp = new Array(cap + 1).fill(-1)
  dp[0] = 0
  for (let i = 0; i < cands.length; i++) {
    const p = cands[i].priceFen
    for (let s = cap; s >= p; s--) {
      if (dp[s] === -1 && dp[s - p] !== -1) dp[s] = dp[s - p] | (1 << i)
    }
  }
  let best = -1
  for (let s = needFen; s <= cap; s++) {
    if (dp[s] !== -1) { best = s; break }
  }
  if (best === -1) return null
  const items = []
  const mask = dp[best]
  for (let i = 0; i < cands.length; i++) {
    if (mask & (1 << i)) items.push(cands[i])
  }
  return { addFen: best, items }
}

const solveDealPlans = (cartFen, deliveryFen, tiers, candidates) => {
  const baselineOff = tiers.reduce((m, t) => (t.fullFen <= cartFen ? Math.max(m, t.offFen) : m), 0)
  const baselinePay = cartFen - baselineOff + deliveryFen
  const plans = []
  tiers.forEach((t, idx) => {
    if (t.offFen <= 0 || t.fullFen <= 0 || t.offFen >= t.fullFen) return
    const needFen = t.fullFen - cartFen
    if (needFen <= 0) {
      plans.push({ tier: t, tierIdx: idx, needFen: 0, addFen: 0, items: [], pay: cartFen - t.offFen + deliveryFen, reachable: true })
      return
    }
    const combo = minAddCombo(candidates, needFen)
    if (!combo) {
      plans.push({ tier: t, tierIdx: idx, needFen, addFen: 0, items: [], pay: Infinity, reachable: false })
      return
    }
    plans.push({ tier: t, tierIdx: idx, needFen, addFen: combo.addFen, items: combo.items, pay: cartFen + combo.addFen - t.offFen + deliveryFen, reachable: true })
  })
  let best = null
  for (const p of plans) {
    if (p.reachable && (!best || p.pay < best.pay)) best = p
  }
  const saving = best ? baselinePay - best.pay : 0
  // 凑单不划算警示：最优加购金额 <= 档位差 + 1 元 且 省额 < 加购额
  let notWorthIt = false
  if (best && best.addFen > 0 && best.addFen <= best.needFen + 100 && saving < best.addFen) notWorthIt = true
  return { baselineOff, baselinePay, plans, best, saving, directBetter: !best || best.pay >= baselinePay, notWorthIt }
}

// ---------- 主计算 ----------
const cartFen = computed(() => cartItems.value.reduce((s, it) => s + toFen(it.price), 0))

const result = computed(() => {
  if (cartFen.value <= 0) return null
  const tiers = dealTiers.value
    .filter(t => toFen(t.full) > 0 && toFen(t.off) > 0)
    .map(t => ({ fullFen: toFen(t.full), offFen: toFen(t.off) }))
  if (!tiers.length) return null
  const cands = addItems.value
    .filter(it => String(it.name || '').trim() !== '' && toFen(it.price) > 0)
    .map(it => ({ name: String(it.name).trim(), priceFen: toFen(it.price) }))
  return {
    ...solveDealPlans(cartFen.value, toFen(deliveryFee.value), tiers, cands),
    cartFen: cartFen.value,
    deliveryFen: toFen(deliveryFee.value)
  }
})
</script>
