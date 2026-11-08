<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PaintBucket class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">装修预算分配计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按面积与档次反推总预算，硬装、主材、软装、家电四分项占比拆分，预留应急金</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        装修要花多少钱、钱怎么分，不用凭感觉。输入建筑面积选档次（简装 / 精装 / 高端，每平米单价可改），先框出总预算；再按硬装施工、主材、软装家具、家电四项滑动分配占比，总和不必手凑 100%，工具会自动按比例归一化并提示；同时给出每平米综合造价与"先砍软装、不砍水电"的 10% 应急金预留建议。所有计算在浏览器本地完成，数据不上传。
      </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Ruler class="w-5 h-5 mr-2 text-primary" /> 面积、档次与占比
        </h2>

        <!-- 计算模式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">计算模式</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="switchMode('A')"
              :class="[
                'px-4 py-2 rounded-lg transition text-sm',
                mode === 'A'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              按面积档次反推
            </button>
            <button
              @click="switchMode('B')"
              :class="[
                'px-4 py-2 rounded-lg transition text-sm',
                mode === 'B'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              直接输入总预算
            </button>
          </div>
        </div>

        <!-- 模式 A：面积 + 档次 -->
        <div v-if="mode === 'A'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">建筑面积（㎡）</label>
            <input
              v-model.number="areaInput"
              type="number"
              min="0"
              step="1"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="如 100"
            >
            <p class="text-xs text-muted-foreground mt-1">按房产证建筑面积填；想更贴近施工量可改用套内面积</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">装修档次</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="g in GRADES"
                :key="g.key"
                @click="selectGrade(g.key)"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  grade === g.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ g.name }}（默认 {{ g.def }} 元/㎡）
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">每平米单价（元/㎡，可编辑）</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <input
                v-model.number="unitPriceInput"
                type="number"
                min="0"
                step="50"
                class="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="如 1500"
              >
            </div>
            <div class="flex items-start gap-2 p-3 mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <strong>单价为经验参考区间，各地人工材料价差大，以当地报价为准</strong>。默认值仅按全包口径粗估：简装约 600–1,000、精装约 1,200–2,000、高端 2,500+ 元/㎡；一线或县城、老房翻新与新房差异都很大，请按本地装修公司报价单回填。
              </p>
            </div>
          </div>
        </div>

        <!-- 模式 B：直接输总预算 -->
        <div v-else class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">装修总预算（元）</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <input
                v-model.number="budgetInput"
                type="number"
                min="0"
                step="1000"
                class="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="如 150000"
              >
            </div>
          </div>
          <button
            v-if="modeATotal > 0"
            @click="budgetInput = Math.round(modeATotal)"
            class="px-4 py-2 rounded-lg text-sm bg-muted hover:bg-muted/80 text-muted-foreground transition"
          >
            填入按面积档次算出的 ¥{{ fmtMoney(modeATotal) }}
          </button>
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
                  <span :class="renAlloc.wasNormalized ? 'text-muted-foreground line-through' : ''">{{ fmt1(renShares[i]) }}%</span>
                  <span v-if="renAlloc.wasNormalized" class="text-primary ml-1">→ {{ fmt1(renAlloc.shares[i]) }}%</span>
                </span>
              </div>
              <input
                v-model.number="renShares[i]"
                type="range"
                min="0"
                max="100"
                step="0.5"
                class="w-full accent-primary"
              >
            </div>
          </div>

          <!-- 归一化提示 -->
          <div v-if="renAlloc.wasNormalized" class="flex items-start gap-2 p-3 mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Info class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p class="text-xs text-amber-700 dark:text-amber-300">
              四项占比总和为 {{ fmt1(renAlloc.rawSum) }}%，已按原比例缩回 100%（{{ renShares.map(s => fmt1(s)).join(' : ') }} → {{ renAlloc.shares.map(s => fmt1(s)).join(' : ') }}），各项之间的比例关系不变。
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
          <Wallet class="w-5 h-5 mr-2 text-primary" /> 预算分配结果
        </h2>

        <div v-if="isValid" class="space-y-4">
          <!-- 总预算 -->
          <div class="p-6 bg-muted rounded-lg text-center">
            <p class="text-sm text-muted-foreground mb-1">装修总预算</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">¥{{ fmtMoney(totalBudget) }}</p>
            <p class="text-sm text-muted-foreground mt-2">
              <template v-if="mode === 'A'">
                {{ fmtNum(areaNum) }}㎡ × ¥{{ fmtMoney(unitPriceNum) }}/㎡
              </template>
              <template v-else>按你输入的总预算拆分</template>
              <template v-if="areaNum > 0"> · 每平米综合造价 ¥{{ fmtMoney(perSqm) }}</template>
            </p>
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
                  </td>
                  <td class="px-4 py-2.5 text-right text-muted-foreground">{{ fmt1(renAlloc.shares[i]) }}%</td>
                  <td class="px-4 py-2.5 text-right font-semibold text-foreground">¥{{ fmtMoney(renAmounts[i]) }}</td>
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

          <!-- 应急金预留 -->
          <div class="p-4 bg-muted rounded-lg border border-border">
            <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-primary" /> 预留 10% 应急金：从哪个分项抠
            </h3>
            <p class="text-sm text-muted-foreground mb-2">
              应急金 <strong class="text-foreground">¥{{ fmtMoney(emergency.fund) }}</strong>（总预算 × 10%），扣减顺序：软装家具 → 家电 → 主材。
            </p>
            <ul class="space-y-1 text-sm">
              <li v-for="(cat, i) in CATEGORIES" :key="cat.key" v-show="emergency.cuts[i] > 0" class="flex justify-between">
                <span class="text-muted-foreground">{{ cat.name }}：预留 ¥{{ fmtMoney(emergency.cuts[i]) }}</span>
                <span class="text-foreground font-medium">实际可用 ¥{{ fmtMoney(emergency.after[i]) }}（约占 {{ fmt1(totalBudget > 0 ? emergency.after[i] / totalBudget * 100 : 0) }}%）</span>
              </li>
              <li v-if="emergency.fund > 0 && !emergency.cuts.some(c => c > 0)" class="text-muted-foreground">
                软装家具占比为 0，应急金建议从家电或主材里抠。
              </li>
            </ul>
            <p v-if="emergency.deficit > 0" class="text-xs text-red-600 dark:text-red-400 mt-2">
              软装、家电、主材全部砍完仍差 ¥{{ fmtMoney(emergency.deficit) }}——说明总预算偏紧，建议上调预算或降低档次，而不是动硬装施工里的水电防水。
            </p>
          </div>

          <!-- 原则卡 -->
          <div class="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h3 class="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
              <Lightbulb class="w-4 h-4 text-primary" /> 原则卡：先砍软装，不砍水电
            </h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              水电改造、防水、墙面基层等隐蔽工程一旦返工，砸墙刨地的代价远超省下的几千块，预算再紧也不要动；软装家具弹性最大、随时能补，应急金优先从这里抠。开工前把分项比例和增项上限写进合同，比事后砍预算有用得多。
            </p>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground bg-muted/40 rounded-lg border border-dashed border-border">
          请输入建筑面积与单价（或直接填总预算）开始计算
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
          什么是装修预算分配计算器？
        </h2>
        <p class="text-muted-foreground mb-4">
          装修预算分配计算器是一款免费在线装修预算规划工具，解决"装修到底要花多少钱、钱该怎么分"两个问题：
          先按建筑面积与装修档次（简装 / 精装 / 高端，每平米单价可编辑）反推总预算，再按硬装施工、主材、软装家具、家电四个分项拆分金额，
          并给出每平米综合造价与 10% 应急金预留建议。占比滑杆随便调，总和不需要手凑 100%，工具会自动按比例归一化。所有计算在浏览器本地完成，不上传任何数据。
        </p>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>总预算</strong>：建筑面积 × 每平米单价（单价为经验区间，以当地报价为准）</li>
          <li><strong>分项金额</strong>：总预算 × 分项占比，占比自动归一化为 100%</li>
          <li><strong>每平米综合造价</strong>：总预算 ÷ 建筑面积（按套内面积估更贴近实际施工量）</li>
          <li><strong>应急金</strong>：总预算 × 10%，优先从软装家具扣减，硬装隐蔽工程不动</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          适用场景与用法
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
          <li>交房准备开工：输入面积、选档次先框总预算，心里有底再约装修公司</li>
          <li>拿到报价单核对：把报价单里硬装 / 主材 / 软装 / 家电的占比滑进来，看结构是否失衡</li>
          <li>预算有限倒推：直接填能拿出的总价，反向滑占比看各分项能压到多少</li>
        </ol>
        <p class="text-muted-foreground mb-6 text-sm">
          用法：模式一切换"按面积档次反推"或"直接输入总预算"→ 拖动四条占比滑杆（总和会自动归一化为 100%）→ 右侧同步生成分项金额表、每平米造价与应急金扣减建议。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          装修工具链：分项算完接着算
        </h2>
        <p class="text-muted-foreground mb-3 text-sm">
          预算框出来之后，硬装和主材的几个大头可以接着用这些工具细算用量与费用：
        </p>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <NuxtLink
            v-for="link in renovationLineLinks"
            :key="link.id"
            :to="`/tools/${link.id}/`"
            class="p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <span class="font-medium text-foreground text-sm">{{ link.name }}</span>
            <span class="block text-xs text-muted-foreground mt-0.5">{{ link.desc }}</span>
          </NuxtLink>
        </div>

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

    <RelatedTools current-tool-id="renovation-budget-calculator" category="calculate" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  PaintBucket, Ruler, Wallet, Lightbulb, ShieldCheck,
  AlertTriangle, Info, CheckCircle2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const tool = tools.find(t => t.id === 'renovation-budget-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 纯函数自测（锚点 / 归一化 / 边界 / 应急金），仅控制台输出
  const results = runRenovationSelfTests()
  const failed = results.filter(r => !r.pass)
  if (failed.length > 0) {
    console.warn(`[renovation-budget-calculator] 自测 ${failed.length}/${results.length} 条未通过`, failed)
  } else {
    console.info(`[renovation-budget-calculator] 自测通过 ${results.length}/${results.length} 条断言`)
  }
})

/* ==== 纯函数（node 自测提取区）begin ==== */

// 分项定义：扣减顺序 soft(2) → appliance(3) → material(1)，hard(0) 永不动
interface RenCategory { key: string; name: string; hint: string; def: number }
const CATEGORIES: RenCategory[] = [
  { key: 'hard', name: '硬装施工', hint: '水电、瓦木油、防水等', def: 40 },
  { key: 'material', name: '主材', hint: '瓷砖、地板、洁具、门窗', def: 30 },
  { key: 'soft', name: '软装家具', hint: '沙发、床、窗帘、灯具', def: 18 },
  { key: 'appliance', name: '家电', hint: '空调、冰箱、洗衣机', def: 12 }
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

// 模式 A：面积 × 每平米单价 → 总预算；非法输入返回 0
function estimateTotalBudget(area: number, unitPrice: number): number {
  if (!isFinite(area) || area <= 0 || !isFinite(unitPrice) || unitPrice <= 0) return 0
  return area * unitPrice
}

// 总预算 × 归一化占比 → 各分项金额（四舍五入到元）
function splitByShares(total: number, shares: Array<number>): Array<number> {
  return shares.map(s => Math.round(total * s / 100))
}

const EMERGENCY_RATE = 0.10

// 应急金预留：按 软装家具(2) → 家电(3) → 主材(1) 顺序扣，硬装施工(0) 不动
function emergencyPlan(total: number, amounts: Array<number>): {
  fund: number; cuts: Array<number>; after: Array<number>; deficit: number
} {
  const fund = Math.max(0, Math.round(total * EMERGENCY_RATE))
  const cuts = [0, 0, 0, 0]
  let remaining = fund
  for (const idx of [2, 3, 1]) {
    const cut = Math.min(remaining, Math.max(0, amounts[idx] ?? 0))
    cuts[idx] = cut
    remaining -= cut
    if (remaining <= 0) break
  }
  const after = amounts.map((a, i) => a - cuts[i])
  return { fund, cuts, after, deficit: remaining }
}

function runRenovationSelfTests() {
  const t: Array<{ name: string; got: unknown; want: unknown; pass: boolean }> = []
  const eq = (name: string, got: unknown, want: unknown, tol?: number) => {
    const e = typeof tol === 'number' ? tol : 1e-9
    const ok = typeof got === 'number' && typeof want === 'number'
      ? Math.abs(got - want) <= e
      : got === want
    t.push({ name, got, want, pass: ok })
  }
  // 锚点：100㎡ 精装（1500 元/㎡）→ 150,000
  eq('锚点·100㎡×1500 总预算', estimateTotalBudget(100, 1500), 150000)
  const anchorShares = normalizeShares([40, 30, 18, 12]).shares
  const anchorAmounts = splitByShares(150000, anchorShares)
  eq('锚点·硬装施工 40% = 60000', anchorAmounts[0], 60000)
  eq('锚点·主材 30% = 45000', anchorAmounts[1], 45000)
  eq('锚点·软装家具 18% = 27000', anchorAmounts[2], 27000)
  eq('锚点·家电 12% = 18000', anchorAmounts[3], 18000)
  eq('锚点·每平米综合造价 1500', 150000 / 100, 1500)
  // 归一化：45/35/18/12（总和 110）→ 40.9/31.8/16.4/10.9，比例不变总和 100
  const n1 = normalizeShares([45, 35, 18, 12])
  eq('归一化·硬装 40.9', n1.shares[0], 40.9, 0.05)
  eq('归一化·主材 31.8', n1.shares[1], 31.8, 0.05)
  eq('归一化·软装 16.4', n1.shares[2], 16.4, 0.05)
  eq('归一化·家电 10.9', n1.shares[3], 10.9, 0.05)
  eq('归一化·输出总和 100', n1.shares.reduce((a, b) => a + b, 0), 100, 1e-6)
  eq('归一化·rawSum=110 标记', n1.wasNormalized, true)
  eq('归一化·比例不变 40.9/31.8 ≈ 45/35', n1.shares[0] / n1.shares[1], 45 / 35, 0.01)
  // 已是 100 不动
  const n2 = normalizeShares([40, 30, 18, 12])
  eq('已归一·不缩放', n2.wasNormalized, false)
  eq('已归一·数值不变', n2.shares[0], 40, 1e-9)
  // 边界：全 0 / 负数 / 面积与单价非法
  const n0 = normalizeShares([0, 0, 0, 0])
  eq('边界·全0不崩溃', n0.shares.reduce((a, b) => a + b, 0), 0)
  const nNeg = normalizeShares([-10, 60, 30, 20])
  eq('边界·负数钳制为0', nNeg.shares[0], 0, 1e-9)
  eq('边界·负数钳制后归一化', nNeg.shares[1], 54.5, 0.05)
  eq('边界·面积0 → 总预算0', estimateTotalBudget(0, 1500), 0)
  eq('边界·单价0 → 总预算0', estimateTotalBudget(100, 0), 0)
  eq('边界·NaN → 总预算0', estimateTotalBudget(NaN, 1500), 0)
  // 应急金：150,000 × 10% = 15,000，全从软装抠，硬装不动
  const e1 = emergencyPlan(150000, anchorAmounts)
  eq('应急金·150000×10% = 15000', e1.fund, 15000)
  eq('应急金·软装扣 15000', e1.cuts[2], 15000)
  eq('应急金·软装剩 12000', e1.after[2], 12000)
  eq('应急金·硬装不动', e1.after[0], 60000)
  eq('应急金·无缺口', e1.deficit, 0)
  // 应急金缺口：占比 94/4/1/1 @ 10 万 → 软装+家电+主材全砍仍差 4000
  const tight = splitByShares(100000, normalizeShares([94, 4, 1, 1]).shares)
  const e2 = emergencyPlan(100000, tight)
  eq('应急金·紧预算缺口 4000', e2.deficit, 4000)
  eq('应急金·缺口场景硬装仍不动', e2.after[0], 94000)
  return t
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 档次与单价 ----------
interface Grade { key: string; name: string; def: number }
const GRADES: Grade[] = [
  { key: 'simple', name: '简装', def: 800 },
  { key: 'fine', name: '精装', def: 1500 },
  { key: 'high', name: '高端', def: 2500 }
]

const mode = ref<'A' | 'B'>('A')
const grade = ref<'simple' | 'fine' | 'high'>('fine')
const areaInput = ref<number>(100)
const unitPriceInput = ref<number>(1500)
const budgetInput = ref<number>(150000)

const selectGrade = (key: 'simple' | 'fine' | 'high') => {
  grade.value = key
  const g = GRADES.find(x => x.key === key)
  if (g) unitPriceInput.value = g.def
}

// ---------- 占比状态 ----------
const renShares = ref<Array<number>>(CATEGORIES.map(c => c.def))
const resetShares = () => {
  renShares.value = CATEGORIES.map(c => c.def)
}

// ---------- 核心计算 ----------
const areaNum = computed(() => (isFinite(areaInput.value) && areaInput.value > 0 ? areaInput.value : 0))
const unitPriceNum = computed(() => (isFinite(unitPriceInput.value) && unitPriceInput.value > 0 ? unitPriceInput.value : 0))
const modeATotal = computed(() => estimateTotalBudget(areaNum.value, unitPriceNum.value))

const switchMode = (m: 'A' | 'B') => {
  mode.value = m
  // 切到模式 B 时，若预算为空则用模式 A 的结果预填
  if (m === 'B' && !(budgetInput.value > 0) && modeATotal.value > 0) {
    budgetInput.value = Math.round(modeATotal.value)
  }
}

const totalBudget = computed(() => {
  if (mode.value === 'A') return modeATotal.value
  return isFinite(budgetInput.value) && budgetInput.value > 0 ? budgetInput.value : 0
})

const renAlloc = computed(() => normalizeShares(renShares.value))
const renAmounts = computed(() => splitByShares(totalBudget.value, renAlloc.value.shares))
const amountsSum = computed(() => renAmounts.value.reduce((a, b) => a + b, 0))
const perSqm = computed(() => (areaNum.value > 0 ? totalBudget.value / areaNum.value : 0))
const emergency = computed(() => emergencyPlan(totalBudget.value, renAmounts.value))
const isValid = computed(() => totalBudget.value > 0 && renAlloc.value.shares.some(s => s > 0))

// ---------- 格式化 ----------
const fmtMoney = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const fmt1 = (n: number): string => String(round1(n))
const fmtNum = (n: number): string => fmtMoney(n)

// ---------- 装修工具链（站内链接，id 均已核对存在） ----------
const renovationLineLinks = [
  { id: 'floor-heating-calculator', name: '地暖计算器', desc: '地暖管间距与用量估算' },
  { id: 'fresh-air-calculator', name: '新风计算器', desc: '新风量与风管选型参考' },
  { id: 'lumen-lighting-calculator', name: '流明计算器', desc: '各房间照度与灯具流明' },
  { id: 'tile-calculator', name: '瓷砖用量计算器', desc: '瓷砖片数与损耗计算' },
  { id: 'flooring-material-calculator', name: '地板用量计算器', desc: '地板面积与损耗估算' },
  { id: 'curtain-fabric-calculator', name: '窗帘面料计算器', desc: '窗帘用料米数计算' }
]

// ---------- SEO 内容 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// 常见问题（与页面 SEO 区、JSON-LD FAQPage 保持一致）
const faqs = [
  {
    q: '100 平米装修大概要多少钱？',
    a: '按经验单价粗算：简装约 8 万（800 元/㎡ × 100㎡）、精装约 15 万（1500 元/㎡）、高端 25 万起（2500 元/㎡ 起）。注意这些是全包口径的经验区间，各地人工与材料价差大，请以当地装修公司实际报价为准，工具里的单价可以直接改成你的报价。'
  },
  {
    q: '装修预算怎么分配比较合理？',
    a: '常见起步比例：硬装施工 40%、主材 30%、软装家具 18%、家电 12%。可以按自己的侧重滑动调整（比如老房改造水电全换，就把硬装施工调高些），占比总和不必手凑 100%，工具会自动按比例归一化并提示。'
  },
  {
    q: '为什么要预留 10% 应急金？从哪里扣？',
    a: '拆改后发现墙体问题、水电增量、材料损耗超预期都很常见，建议按总预算 10% 预留。原则是"先砍软装，不砍水电"：应急金优先从软装家具里抠，不够再砍家电、主材；水电、防水等隐蔽工程返工代价最高，不要省。'
  },
  {
    q: '每平米综合造价是怎么算的？',
    a: '总预算 ÷ 面积。注意建筑面积不等于套内面积：按建筑面积算出的单价偏低，用套内面积估算更贴近实际施工量。本工具默认按建筑面积，面积一栏你可以自己换成套内面积。'
  },
  {
    q: '三档单价可以修改吗？',
    a: '可以。800 / 1500 / 2500 元/㎡ 只是经验参考值，直接改单价数字即可按本地行情反推总预算；改完后分项分配、每平米造价与应急金建议都会同步刷新。'
  }
]

// ---------- SEO 配置 ----------
useSeoMeta({
  title: '装修预算分配计算器 - 100平装修要多少钱与分项预算 | 有条工具',
  description: '免费在线装修预算分配计算器：按面积与档次（简装/精装/高端，单价可改）反推总预算，硬装施工、主材、软装家具、家电四分项占比拆分，自动归一化，预留 10% 应急金建议，纯本地计算。',
  keywords: '装修预算,装修预算分配,100平装修多少钱,装修每平米造价,装修档次,硬装主材软装,装修应急金',
  author: '有条工具',
  ogTitle: '装修预算分配计算器 - 100平装修要多少钱与分项预算',
  ogDescription: '按面积档次反推装修总预算，硬装主材软装家电四分项占比拆分，自动归一化。',
  ogUrl: 'https://www.util.cn/tools/renovation-budget-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '装修预算分配计算器',
  twitterDescription: '按面积档次反推装修总预算，四分项占比自动归一化，纯本地计算。'
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
            name: '装修预算分配计算器',
            description: '按面积与档次反推装修总预算，硬装、主材、软装、家电四分项占比分配，自动归一化并预留应急金',
            url: 'https://www.util.cn/tools/renovation-budget-calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '按面积档次反推总预算',
              '每平米单价可编辑',
              '四分项占比滑杆自动归一化',
              '每平米综合造价',
              '10% 应急金扣减建议',
              '纯本地计算不上传数据'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
              { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
              { '@type': 'ListItem', position: 3, name: '装修预算分配计算器', item: 'https://www.util.cn/tools/renovation-budget-calculator/' }
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
