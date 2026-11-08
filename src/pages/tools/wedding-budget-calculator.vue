<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Heart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">婚礼预算分配计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">桌数反推酒席实际开销，总预算按占比分配到酒席、首饰、摄影、蜜月，装不下提前报警</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        办婚礼最怕预算失控。输入总预算和嘉宾人数：先按"每桌人数向上取整 × 每桌单价"算出酒席实际要花多少，再把总预算按酒席、首饰戒指、婚纱摄影、蜜月、礼服造型、其他六项占比分配（滑杆可调，总和自动归一化为 100%）；工具会实时校验"占比法"和"实际桌数"两笔酒席账——占比装不下实际桌数时红牌提醒，并给出调占比、减桌或提预算三个方案。所有计算在浏览器本地完成，数据不上传。
      </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Users class="w-5 h-5 mr-2 text-primary" /> 总预算与人数
        </h2>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">婚礼总预算（元）</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <input
                v-model.number="totalInput"
                type="number"
                min="0"
                step="10000"
                class="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="如 150000"
              >
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">嘉宾人数（预计到场）</label>
            <input
              v-model.number="guestsInput"
              type="number"
              min="0"
              step="1"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="如 200"
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">每桌人数（可改）</label>
            <input
              v-model.number="perTableInput"
              type="number"
              min="1"
              step="1"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="默认 10"
            >
            <p class="text-xs text-muted-foreground mt-1">圆桌常见 10 人/桌</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">每桌单价（元/桌，可改）</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <input
                v-model.number="priceInput"
                type="number"
                min="0"
                step="100"
                class="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="如 3000"
              >
            </div>
          </div>
        </div>

        <!-- 分项占比滑杆 -->
        <div class="border-t border-border pt-4">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-foreground">分项占比（滑杆可调）</label>
            <button
              @click="resetShares"
              class="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition"
            >
              恢复默认占比
            </button>
          </div>

          <div class="space-y-4">
            <div v-for="(cat, i) in CATEGORIES" :key="cat.key">
              <div class="flex justify-between items-baseline mb-1">
                <label class="text-sm font-medium text-foreground">
                  {{ cat.name }}
                  <span class="text-xs text-muted-foreground ml-1">{{ cat.hint }}</span>
                </label>
                <span class="text-sm text-foreground">
                  <span :class="alloc.wasNormalized ? 'text-muted-foreground line-through' : ''">{{ fmt1(wedShares[i]) }}%</span>
                  <span v-if="alloc.wasNormalized" class="text-primary ml-1">→ {{ fmt1(alloc.shares[i]) }}%</span>
                </span>
              </div>
              <input
                v-model.number="wedShares[i]"
                type="range"
                min="0"
                max="100"
                step="0.5"
                class="w-full accent-primary"
              >
            </div>
          </div>

          <!-- 归一化提示 -->
          <div v-if="alloc.wasNormalized" class="flex items-start gap-2 p-3 mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Info class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p class="text-xs text-amber-700 dark:text-amber-300">
              六项占比总和为 {{ fmt1(alloc.rawSum) }}%，已按原比例缩回 100%（{{ wedShares.map(s => fmt1(s)).join(' : ') }} → {{ alloc.shares.map(s => fmt1(s)).join(' : ') }}），各项之间的比例关系不变。
            </p>
          </div>
          <p v-else class="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <CheckCircle2 class="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> 占比总和 100%，无需调整
          </p>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Wallet class="w-5 h-5 mr-2 text-primary" /> 预算分配与校验
        </h2>

        <div v-if="isValid" class="space-y-4">
          <!-- 总预算 -->
          <div class="p-6 bg-muted rounded-lg text-center">
            <p class="text-sm text-muted-foreground mb-1">婚礼总预算</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">¥{{ fmtMoney(totalBudget) }}</p>
            <p class="text-sm text-muted-foreground mt-2">
              {{ fmtNum(guestsNum) }} 人 ÷ {{ fmtNum(perTableNum) }} 人/桌 向上取整 = <strong class="text-foreground">{{ tables }} 桌</strong>
            </p>
          </div>

          <!-- 桌数与酒席实际 -->
          <div class="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span class="text-muted-foreground text-sm">酒席实际：{{ tables }} 桌 × ¥{{ fmtMoney(priceNum) }}/桌</span>
            <span class="font-bold text-foreground">¥{{ fmtMoney(banquetActual) }}</span>
          </div>

          <!-- 分项金额表 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted/60">
                  <th class="text-left px-4 py-2.5 font-medium text-muted-foreground">分项</th>
                  <th class="text-right px-4 py-2.5 font-medium text-muted-foreground">占比</th>
                  <th class="text-right px-4 py-2.5 font-medium text-muted-foreground">金额</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cat, i) in CATEGORIES" :key="cat.key" class="border-t border-border">
                  <td class="px-4 py-2.5 text-foreground">
                    {{ cat.name }}
                    <span class="block text-xs text-muted-foreground">{{ cat.hint }}</span>
                    <span v-if="cat.key === 'banquet'" class="block text-xs mt-0.5" :class="check.verdict === 'over' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'">
                      实际 ¥{{ fmtMoney(banquetActual) }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5 text-right text-muted-foreground">{{ fmt1(alloc.shares[i]) }}%</td>
                  <td class="px-4 py-2.5 text-right font-semibold text-foreground">¥{{ fmtMoney(allocAmounts[i]) }}</td>
                </tr>
                <tr class="border-t border-border bg-muted/40">
                  <td class="px-4 py-2.5 font-semibold text-foreground">合计</td>
                  <td class="px-4 py-2.5 text-right text-muted-foreground">100%</td>
                  <td class="px-4 py-2.5 text-right font-bold text-foreground">¥{{ fmtMoney(amountsSum) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground -mt-2">分项金额四舍五入到元，合计与总预算可能相差几元，以总预算为准。</p>

          <!-- 酒席校验 -->
          <div
            v-if="check.verdict === 'over'"
            class="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <h3 class="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle class="w-4 h-4" /> 红牌：酒席占比装不下实际桌数，缺口 ¥{{ fmtMoney(check.diff) }}
            </h3>
            <p class="text-xs text-muted-foreground mb-2">
              占比法给酒席的额度 ¥{{ fmtMoney(check.allocated) }} &lt; 实际酒席 ¥{{ fmtMoney(banquetActual) }}（{{ tables }} 桌 × ¥{{ fmtMoney(priceNum) }}）。三选一：
            </p>
            <ul class="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>把酒席占比调到至少 <strong class="text-foreground">{{ fmt1(check.minPct) }}%</strong>，同步压缩其他分项</li>
              <li v-if="priceNum > 0">减少约 <strong class="text-foreground">{{ Math.ceil(check.diff / priceNum) }} 桌</strong>（少请人或并桌），或降低每桌标准</li>
              <li>把总预算提高到 ¥{{ fmtMoney(totalBudget + check.diff) }}</li>
            </ul>
          </div>
          <div v-else-if="check.verdict === 'under'" class="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <h3 class="text-sm font-semibold text-green-700 dark:text-green-400 mb-1.5 flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4" /> 酒席占比有结余 ¥{{ fmtMoney(-check.diff) }}
            </h3>
            <p class="text-xs text-muted-foreground">
              实际酒席 ¥{{ fmtMoney(banquetActual) }} 低于占比额度 ¥{{ fmtMoney(check.allocated) }}，多出的钱可挪给婚纱摄影、蜜月或留作机动金。
            </p>
          </div>
          <div v-else class="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <h3 class="text-sm font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4" /> 酒席占比正好装下实际桌数（差额 ¥0）
            </h3>
            <p class="text-xs text-muted-foreground">
              占比法 ¥{{ fmtMoney(check.allocated) }} = 实际酒席 ¥{{ fmtMoney(banquetActual) }}，预算闭环。注意旺季每桌单价可能上浮，留点余量更稳。
            </p>
          </div>

          <!-- 诚实卡 -->
          <div class="p-4 bg-muted/50 rounded-lg border border-border">
            <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Gift class="w-4 h-4 text-primary" /> 诚实说：这三件事心里有数
            </h3>
            <ul class="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <li>
                <strong class="text-foreground">份子钱不进预算</strong>：礼金能回多少血取决于人情往来，波动很大，先按自有资金做规划，收的礼金当作事后回血；想估个参考可看<NuxtLink to="/tools/gift-money-reference/" class="text-primary hover:underline">礼金行情参考</NuxtLink>。
              </li>
              <li>
                <strong class="text-foreground">旺季加价</strong>：五一、十一和热门吉日档期，酒席与场地报价普遍上浮（常见 10%–20%），每桌单价请按报价单填，别按平日价脑补。
              </li>
              <li>
                <strong class="text-foreground">婚宴定金不退风险</strong>：行业惯例定金难退，不少场地"改期也算违约"。交定金前确认档期能否改、最低桌数、旺季加价规则，白纸黑字写进合同。
              </li>
            </ul>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground bg-muted/40 rounded-lg border border-dashed border-border">
          请输入总预算和嘉宾人数开始计算
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronDown v-if="!seoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是婚礼预算分配计算器？
        </h2>
        <p class="text-muted-foreground mb-4">
          婚礼预算分配计算器是一款免费在线婚庆预算规划工具。输入总预算与嘉宾人数，先按"每桌人数向上取整 × 每桌单价"算出酒席实际开销，
          再把总预算按酒席、首饰戒指、婚纱摄影、蜜月、礼服造型、其他六项占比分配（预设可编辑，总和自动归一化为 100%）；
          工具的核心是酒席双口径校验：占比法的酒席额度 vs 实际桌数开销，装不下就红牌提醒，并给出调占比、减桌、提预算三个方案。
          另附份子钱不进预算、旺季加价、定金不退三条诚实提醒。所有计算在浏览器本地完成，不上传任何数据。
        </p>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>桌数</strong>：桌数 = ceil(到场人数 ÷ 每桌人数)，向上取整</li>
          <li><strong>酒席实际</strong>：桌数 × 每桌单价（旺季按报价单填，可能上浮 10%–20%）</li>
          <li><strong>分项金额</strong>：总预算 × 分项占比，占比自动归一化为 100%</li>
          <li><strong>酒席校验</strong>：差额 = 酒席实际 − 总预算 × 酒席占比，缺口为正即红牌</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          适用场景与用法
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
          <li>刚定下婚期：先框总预算和到场人数，看默认占比下酒席装不装得下</li>
          <li>拿到酒店报价单：把每桌单价回填，校验占比是否需要调整</li>
          <li>两家商量分项：首饰、摄影、蜜月怎么切，滑杆一调立刻出金额</li>
        </ol>
        <p class="text-muted-foreground mb-6 text-sm">
          用法：填总预算、嘉宾人数、每桌人数与每桌单价 → 拖动六条占比滑杆（总和自动归一化为 100%）→ 右侧同步生成桌数、分项金额表与酒席校验结果；出现红牌就按三个方案选一个落地。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h3 class="text-lg font-semibold text-foreground">{{ faq.q }}</h3>
            <p class="text-muted-foreground mt-1">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools current-tool-id="wedding-budget-calculator" category="calculate" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Heart, Users, Wallet, Gift, AlertTriangle, Info, CheckCircle2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const tool = tools.find(t => t.id === 'wedding-budget-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 纯函数自测（锚点 / 桌数 ceil / 校验差额 / 归一化 / 边界），仅控制台输出
  const results = runWeddingSelfTests()
  const failed = results.filter(r => !r.pass)
  if (failed.length > 0) {
    console.warn(`[wedding-budget-calculator] 自测 ${failed.length}/${results.length} 条未通过`, failed)
  } else {
    console.info(`[wedding-budget-calculator] 自测通过 ${results.length}/${results.length} 条断言`)
  }
})

/* ==== 纯函数（node 自测提取区）begin ==== */

// 分项定义：banquet(0) 是酒席，参与双口径校验
interface WedCategory { key: string; name: string; hint: string; def: number }
const CATEGORIES: WedCategory[] = [
  { key: 'banquet', name: '酒席婚宴', hint: '桌数 × 每桌单价', def: 40 },
  { key: 'ring', name: '首饰戒指', hint: '三金 / 对戒', def: 15 },
  { key: 'photo', name: '婚纱摄影', hint: '拍摄 + 相册产品', def: 12 },
  { key: 'honeymoon', name: '蜜月旅行', hint: '机票酒店行程', def: 15 },
  { key: 'dress', name: '礼服造型', hint: '婚纱礼服 + 跟妆', def: 8 },
  { key: 'other', name: '其他机动', hint: '喜糖请柬司仪布置', def: 10 }
]

const round1 = (v: number): number => Math.round(v * 10) / 10

/**
 * 占比归一化：总和必须 100%。
 * 输入和 ≠ 100 时按原比例缩回（比例关系不变），负数/非数字按 0 处理；
 * 一位小数舍入产生的漂移补到最大分项，保证输出总和恒为 100。
 */
function normalizeShares(raw: Array<number>): { shares: Array<number>; wasNormalized: boolean; rawSum: number } {
  const clamped = raw.map(v => (typeof v === 'number' && isFinite(v) && v > 0 ? v : 0))
  const rawSum = clamped.reduce((a, b) => a + b, 0)
  if (rawSum <= 0) {
    return { shares: raw.map(() => 0), wasNormalized: false, rawSum: 0 }
  }
  const shares = Math.abs(rawSum - 100) < 1e-9
    ? clamped.map(round1)
    : clamped.map(v => round1((v / rawSum) * 100))
  const drift = round1(100 - shares.reduce((a, b) => a + b, 0))
  if (Math.abs(drift) >= 0.1) {
    let maxIdx = 0
    for (let i = 1; i < clamped.length; i++) {
      if (clamped[i] > clamped[maxIdx]) maxIdx = i
    }
    shares[maxIdx] = round1(shares[maxIdx] + drift)
  }
  return { shares, wasNormalized: Math.abs(rawSum - 100) >= 1e-9, rawSum }
}

// 桌数：向上取整；人数或每桌人数非法/为 0 时返回 0（防除零）
function tablesFor(guests: number, perTable: number): number {
  if (!isFinite(guests) || guests <= 0 || !isFinite(perTable) || perTable <= 0) return 0
  return Math.ceil(guests / perTable)
}

// 分项金额：总预算 × 归一化占比（四舍五入到元）
function splitByShares(total: number, shares: Array<number>): Array<number> {
  return shares.map(s => Math.round(total * s / 100))
}

interface BanquetCheck {
  allocated: number
  actual: number
  diff: number
  verdict: 'ok' | 'over' | 'under'
  minPct: number
}

// 酒席双口径校验：占比法额度 vs 实际桌数开销
function checkBanquet(total: number, banquetPct: number, tables: number, pricePerTable: number): BanquetCheck {
  const allocated = Math.round(total * banquetPct / 100)
  const actual = Math.round(tables * Math.max(0, pricePerTable))
  const diff = actual - allocated
  const verdict: BanquetCheck['verdict'] = Math.abs(diff) < 0.5 ? 'ok' : diff > 0 ? 'over' : 'under'
  const minPct = total > 0 ? round1((actual / total) * 100) : 0
  return { allocated, actual, diff, verdict, minPct }
}

function runWeddingSelfTests() {
  const t: Array<{ name: string; got: unknown; want: unknown; pass: boolean }> = []
  const eq = (name: string, got: unknown, want: unknown, tol?: number) => {
    const e = typeof tol === 'number' ? tol : 1e-9
    const ok = typeof got === 'number' && typeof want === 'number'
      ? Math.abs(got - want) <= e
      : got === want
    t.push({ name, got, want, pass: ok })
  }
  // 锚点：15 万预算、200 人、10 人/桌、3000 元/桌 → 20 桌 60,000；占比 40% = 60,000 → 差额 0
  eq('锚点·200人÷10人桌 = 20桌', tablesFor(200, 10), 20)
  eq('锚点·20桌×3000 = 60000', tablesFor(200, 10) * 3000, 60000)
  const anchorAlloc = normalizeShares(CATEGORIES.map(c => c.def))
  const anchorAmounts = splitByShares(150000, anchorAlloc.shares)
  eq('锚点·酒席占比40% = 60000', anchorAmounts[0], 60000)
  const c0 = checkBanquet(150000, anchorAlloc.shares[0], tablesFor(200, 10), 3000)
  eq('锚点·差额 0', c0.diff, 0)
  eq('锚点·判定正好装下', c0.verdict, 'ok')
  // 红牌：单价 3500 → 70,000 vs 60,000 → 超支 10,000
  const c1 = checkBanquet(150000, anchorAlloc.shares[0], tablesFor(200, 10), 3500)
  eq('红牌·实际酒席 70000', c1.actual, 70000)
  eq('红牌·超支 10000', c1.diff, 10000)
  eq('红牌·判定 over', c1.verdict, 'over')
  eq('红牌·最低占比 46.7%', c1.minPct, 46.7, 0.05)
  eq('红牌·减桌建议 ceil(10000/3500)=3', Math.ceil(c1.diff / 3500), 3)
  // 桌数 ceil 边界
  eq('ceil·201人 → 21桌', tablesFor(201, 10), 21)
  eq('ceil·195人 → 20桌', tablesFor(195, 10), 20)
  eq('ceil·10人 → 1桌', tablesFor(10, 10), 1)
  eq('ceil·1人 → 1桌', tablesFor(1, 10), 1)
  eq('边界·0人 → 0桌', tablesFor(0, 10), 0)
  eq('边界·每桌0 → 0桌（防除零）', tablesFor(200, 0), 0)
  // 分配锚点：15 万按默认占比
  eq('分配·首饰戒指 15% = 22500', anchorAmounts[1], 22500)
  eq('分配·婚纱摄影 12% = 18000', anchorAmounts[2], 18000)
  eq('分配·蜜月 15% = 22500', anchorAmounts[3], 22500)
  eq('分配·礼服造型 8% = 12000', anchorAmounts[4], 12000)
  eq('分配·其他机动 10% = 15000', anchorAmounts[5], 15000)
  // 归一化：45/15/12/15/8/10（总和 105）→ 缩回 100
  const n1 = normalizeShares([45, 15, 12, 15, 8, 10])
  eq('归一化·总和105 标记', n1.wasNormalized, true)
  eq('归一化·输出总和 100', n1.shares.reduce((a, b) => a + b, 0), 100, 1e-6)
  eq('归一化·酒席 42.9', n1.shares[0], 42.9, 0.05)
  eq('归一化·比例不变 45/15 = 42.9/14.3', n1.shares[0] / n1.shares[1], 45 / 15, 0.01)
  // 校验边界：占比装不下（预算 10 万、200 人、3000/桌 → 实际 60000 > 占比 40000）
  const c2 = checkBanquet(100000, 40, tablesFor(200, 10), 3000)
  eq('校验·缺口 20000', c2.diff, 20000)
  eq('校验·判定 over', c2.verdict, 'over')
  // 校验边界：结余（单价 2500 → 50000 vs 60000）
  const c3 = checkBanquet(150000, 40, tablesFor(200, 10), 2500)
  eq('校验·结余 10000', c3.diff, -10000)
  eq('校验·判定 under', c3.verdict, 'under')
  // 归一化边界：全 0 / 负数
  const n0 = normalizeShares([0, 0, 0, 0, 0, 0])
  eq('边界·全0不崩溃', n0.shares.reduce((a, b) => a + b, 0), 0)
  const nNeg = normalizeShares([-5, 40, 20, 20, 10, 15])
  eq('边界·负数钳制为0', nNeg.shares[0], 0, 1e-9)
  eq('边界·负数钳制后总和 100', nNeg.shares.reduce((a, b) => a + b, 0), 100, 1e-6)
  return t
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 输入状态 ----------
const totalInput = ref<number>(150000)
const guestsInput = ref<number>(200)
const perTableInput = ref<number>(10)
const priceInput = ref<number>(3000)

// ---------- 占比状态 ----------
const wedShares = ref<Array<number>>(CATEGORIES.map(c => c.def))
const resetShares = () => {
  wedShares.value = CATEGORIES.map(c => c.def)
}

// ---------- 核心计算 ----------
const totalBudget = computed(() => (isFinite(totalInput.value) && totalInput.value > 0 ? totalInput.value : 0))
const guestsNum = computed(() => (isFinite(guestsInput.value) && guestsInput.value > 0 ? guestsInput.value : 0))
const perTableNum = computed(() => (isFinite(perTableInput.value) && perTableInput.value > 0 ? perTableInput.value : 0))
const priceNum = computed(() => (isFinite(priceInput.value) && priceInput.value > 0 ? priceInput.value : 0))

const alloc = computed(() => normalizeShares(wedShares.value))
const tables = computed(() => tablesFor(guestsNum.value, perTableNum.value))
const banquetActual = computed(() => tables.value * priceNum.value)
const allocAmounts = computed(() => splitByShares(totalBudget.value, alloc.value.shares))
const amountsSum = computed(() => allocAmounts.value.reduce((a, b) => a + b, 0))
const check = computed(() => checkBanquet(totalBudget.value, alloc.value.shares[0], tables.value, priceNum.value))
const isValid = computed(() => totalBudget.value > 0 && guestsNum.value > 0 && perTableNum.value > 0 && alloc.value.shares.some(s => s > 0))

// ---------- 格式化 ----------
const fmtMoney = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const fmt1 = (n: number): string => String(round1(n))
const fmtNum = (n: number): string => fmtMoney(n)

// ---------- SEO 内容 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// 常见问题（与页面 SEO 区、JSON-LD FAQPage 保持一致）
const faqs = [
  {
    q: '婚礼预算怎么分配比较合理？',
    a: '常见起步比例：酒席 40%、首饰戒指 15%、蜜月 15%、婚纱摄影 12%、其他机动 10%、礼服造型 8%。酒席是绝对大头，建议先按"桌数 × 每桌单价"算出酒席实际要花多少，再用工具校验占比装不装得下；各分项比例可以按自己的侧重滑动调整，总和自动归一化为 100%。'
  },
  {
    q: '婚宴桌数怎么算？',
    a: '桌数 = 预计到场人数 ÷ 每桌人数，向上取整（ceil）。例如 200 人、每桌 10 人 = 20 桌；195 人也要 20 桌；201 人则要 21 桌。建议按请柬回执留 1 桌余量，临时加人拼桌不如提前多备一桌体面。'
  },
  {
    q: '酒席占比装不下实际桌数怎么办？',
    a: '工具会给出缺口金额并提示三个方案：一、把酒席占比调到最低所需值（工具直接算出），同步压缩首饰、蜜月等其他分项；二、减少邀请人数或并桌，或降低每桌标准；三、上调总预算。按自己的优先级选一个落地，别硬撑着超支。'
  },
  {
    q: '份子钱（礼金）要不要算进婚礼预算？',
    a: '不建议。礼金收入取决于宾客人数和人情往来，波动很大，先按自有资金做预算更稳；收的礼金当作事后"回血"。想估算大概能收多少，可以看看站内的礼金行情参考工具。'
  },
  {
    q: '婚宴定金交了能退吗？',
    a: '行业惯例是定金难退，很多场地"改期也算违约"。交定金前务必确认：档期能否改、最低桌数限制、旺季是否加价、哪些服务项目另收费，并把这些白纸黑字写进合同，再决定交多少。'
  }
]

// ---------- SEO 配置 ----------
useSeoMeta({
  title: '婚礼预算分配计算器 - 婚宴桌数与分项预算分配 | 有条工具',
  description: '免费在线婚礼预算分配计算器：输入总预算与嘉宾人数，桌数反推酒席实际开销，六分项占比分配（酒席/首饰/摄影/蜜月/礼服/其他，自动归一化），占比装不下实际桌数红牌提醒，纯本地计算。',
  keywords: '婚礼预算,婚礼预算分配,办婚礼多少钱,婚宴桌数计算,酒席预算,婚庆预算,婚礼开支',
  author: '有条工具',
  ogTitle: '婚礼预算分配计算器 - 婚宴桌数与分项预算分配',
  ogDescription: '桌数反推酒席实际开销，六分项占比分配自动归一化，装不下提前红牌。',
  ogUrl: 'https://www.util.cn/tools/wedding-budget-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '婚礼预算分配计算器',
  twitterDescription: '桌数反推酒席开销，六分项占比自动归一化，纯本地计算。'
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
            '@type': 'SoftwareApplication',
            name: '婚礼预算分配计算器',
            description: '婚礼总预算按酒席、首饰、摄影、蜜月、礼服、其他六项占比分配，桌数反推酒席实际开销并双口径校验',
            url: 'https://www.util.cn/tools/wedding-budget-calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '桌数向上取整反推酒席开销',
              '六分项占比滑杆自动归一化',
              '占比法 vs 实际桌数双口径校验',
              '缺口红牌提醒与减桌建议',
              '份子钱/旺季加价/定金风险提醒',
              '纯本地计算不上传数据'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
              { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
              { '@type': 'ListItem', position: 3, name: '婚礼预算分配计算器', item: 'https://www.util.cn/tools/wedding-budget-calculator/' }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a
              }
            }))
          }
        ]
      })
    }
  ]
})
</script>
