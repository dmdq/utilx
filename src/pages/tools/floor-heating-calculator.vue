<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Waves class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">地暖盘管计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按采暖面积与管间距估算地暖盘管总长、回路数与分水器路数，附五档间距速查表与 JGJ 142 间距选型口径</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线地暖盘管长度计算器：铺地暖前先算管——总管长(m) = 采暖面积(㎡) ÷ 管间距(m) ×（1 + 弯头余量%）。
        例如 20㎡、间距 150mm、余量 6%：20 ÷ 0.15 × 1.06 ≈ 141.3m，按单回路最长 120m 需 2 个回路、分水器选 2 路。
        本页内置 100/150/200/250/300mm 五档常用间距与 DN16/DN20 管径口径，一键得出每平米管长、回路划分与整屋用管量，
        并给出间距-热负荷选型提示（JGJ 142《辐射供暖供冷技术规程》口径）。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Ruler class="w-5 h-5 mr-2 text-primary" /> 铺设参数
        </h2>

        <!-- 面积输入模式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">采暖面积输入方式</label>
          <div class="flex flex-wrap gap-1.5 mb-2.5">
            <button
              v-for="m in AREA_MODES"
              :key="m.value"
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="areaMode === m.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="areaMode = m.value"
            >{{ m.label }}</button>
          </div>
          <div v-if="areaMode === 'direct'" class="flex items-center gap-2">
            <input
              v-model.number="area"
              type="number" min="1" step="0.1"
              class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-32 focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="采暖面积"
            >
            <span class="text-xs text-muted-foreground">㎡（有效散热的铺设面积，不含柜下与无地暖区域）</span>
          </div>
          <div v-else class="flex items-center gap-2">
            <input v-model.number="roomL" type="number" min="0.1" step="0.1" class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-24 focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="房间长">
            <span class="text-xs text-muted-foreground">m 长 ×</span>
            <input v-model.number="roomW" type="number" min="0.1" step="0.1" class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-24 focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="房间宽">
            <span class="text-xs text-muted-foreground">m 宽 = <span class="font-mono text-foreground">{{ areaFromLWText }}</span>㎡</span>
          </div>
        </div>

        <!-- 管间距 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">管间距（mm）</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="g in GAP_PRESETS"
              :key="g"
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="gap === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="gap = g"
            >{{ g }}mm</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">常用 100~300mm：负荷大（外窗多、顶层、寒冷地区）取小间距，负荷小（内区、保温好）取大间距。</p>
        </div>

        <!-- 余量 -->
        <div>
          <label for="fh-waste" class="block text-sm font-medium text-foreground mb-1.5">弯头与损耗余量（%）</label>
          <input
            id="fh-waste"
            v-model.number="waste"
            type="number" min="0" max="30" step="0.5"
            class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-[11px] text-muted-foreground mt-1.5">盘管拐弯弧段展开与施工损耗，经验默认 6%；现场复杂、障碍多可取 8%~10%。</p>
        </div>

        <!-- 单回路最大管长 -->
        <div>
          <label for="fh-maxloop" class="block text-sm font-medium text-foreground mb-1.5">单回路最大管长（m，100~150 可调）</label>
          <input
            id="fh-maxloop"
            v-model.number="maxLoopInput"
            type="number" min="100" max="150" step="5"
            class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-[11px] text-muted-foreground mt-1.5">回路过长水阻大、流量不足、前后地面温差明显。经验口径：DN16 建议 ≤80~100m，DN20 建议 ≤100~120m；本输入限 100~150m，超出按边界值计算。</p>
        </div>

        <!-- 管径 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">管径</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="p in PIPE_SIZES"
              :key="p.id"
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="pipe === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="pipe = p.id"
            >{{ p.label }}</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ pipeTip }}</p>
        </div>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>

        <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult">
          <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制算料结果
        </button>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 用管估算结果
          </h2>
          <div v-if="result" class="space-y-4">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-xs text-muted-foreground mb-1">盘管总长（含余量）</p>
              <p class="text-4xl font-bold text-primary font-mono">{{ result.totalText }} <span class="text-lg font-normal text-muted-foreground">m</span></p>
              <p class="text-[11px] text-muted-foreground mt-1 font-mono">{{ area.toFixed(1) }}㎡ ÷ {{ gap }}mm ×（1 + {{ wasteText }}%）= {{ result.formulaText }}</p>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">回路数</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.loops }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">≤{{ result.maxLoop }}m/回路</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">分水器路数</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.loops }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">与回路数一致</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">每平米管长</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.perSqmText }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">1 ÷ {{ (gap / 1000).toFixed(2) }}m</p>
              </div>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-xs text-muted-foreground">每回路平均管长约 <span class="font-mono text-foreground font-semibold">{{ result.perLoopText }} m</span>；实际划分时各回路长度宜接近、不宜相差过大，靠外墙 / 窗下区域优先单独成环。买管按整卷规格（DN16 常见 300m/卷，DN20 常见 200m/卷）向上取整。</p>
            </div>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入有效面积开始计算</p>
        </div>

        <!-- 间距速查表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> 每平米用管速查表
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-xs text-muted-foreground">
                  <th class="text-left py-2 pr-3 font-medium">管间距</th>
                  <th class="text-right py-2 px-3 font-medium">每平米用管</th>
                  <th class="text-right py-2 px-3 font-medium">当前面积总长（不含余量）</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in gapTable" :key="row.gap"
                  class="border-b border-border/50"
                  :class="row.gap === gap ? 'bg-primary/5' : ''"
                >
                  <td class="py-2 pr-3 font-mono" :class="row.gap === gap ? 'text-primary font-semibold' : 'text-foreground'">{{ row.gap }}mm</td>
                  <td class="py-2 px-3 text-right font-mono text-foreground">{{ row.perSqm }} m/㎡</td>
                  <td class="py-2 px-3 text-right font-mono text-muted-foreground">{{ row.totalText }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2">速查表为纯间距倒数（1 ÷ 间距），不含余量；含余量总长以上方计算结果为准。</p>
        </div>

        <!-- 间距-热负荷提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 间距怎么选？——间距与热负荷
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            依据 JGJ 142-2012《辐射供暖供冷技术规程》第 3.5.4 条：加热管敷设间距应根据<strong class="text-foreground">地面散热量、室内计算温度、平均水温及地面传热热阻</strong>通过计算确定，也可按该规程附录 A 选用。经验规律：
            间距越小（如 100~150mm）单位地面面积散热量越大，适合热负荷大的房间（顶层、外窗多、寒冷地区、落地窗客厅）；
            间距越大（如 250~300mm）散热量越小，适合热负荷小的内区与保温好的房间。加密间距同时受「人员经常停留区地面表面温度不宜过高（约 29℃ 上限的通行口径）」约束，并非越密越好——加密与提水温都要校核地面温度。具体工程以现行标准原文与设计计算为准。
          </p>
        </div>
      </div>
    </div>

    <!-- 可折叠 SEO 区：FAQ + 公式 + 来源 -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6" open>
      <summary class="text-base font-semibold text-foreground cursor-pointer select-none mb-4">计算公式、标准来源与常见问题</summary>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-1.5">核心公式</h3>
          <ul class="text-sm text-muted-foreground space-y-1 leading-relaxed list-disc list-inside font-mono text-[13px]">
            <li>总管长(m) = 采暖面积(㎡) ÷ 管间距(m) ×（1 + 余量%）</li>
            <li>回路数 = ⌈总管长 ÷ 单回路最大管长⌉（向上取整）</li>
            <li>分水器路数 = 回路数</li>
            <li>每平米管长(m/㎡) = 1 ÷ 管间距(m)</li>
          </ul>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground mb-1.5">标准与来源</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            管长估算为盘管几何展开的通行经验算法；间距与散热量关系引自 JGJ 142-2012《辐射供暖供冷技术规程》（行业标准）第 3.5.4 条及附录 A 口径。
            单回路最大管长（DN16 ≤80~100m、DN20 ≤100~120m）与弯头余量 6% 为行业经验值，非标准强制条文。工程设计与验收请以现行标准原文为准。
          </p>
        </div>
        <div class="space-y-4 pt-2 border-t border-border/60">
          <div v-for="faq in FAQS" :key="faq.q">
            <h4 class="text-sm font-semibold text-foreground">{{ faq.q }}</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'floor-heating-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Waves, Ruler, Calculator, BookOpen, Info, Copy, TriangleAlert } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '地暖盘管计算器 - 地暖管长度/回路数/分水器路数估算 | 有条工具',
  description: '免费在线地暖盘管计算器：输入采暖面积与管间距（100/150/200/250/300mm）即时估算地暖管总长、回路数、分水器路数与每平米用管量，含弯头余量与单回路管长上限（DN16/DN20），附每平米用管速查表与 JGJ 142 间距-热负荷选型提示，纯浏览器本地计算不上传',
  keywords: '地暖盘管计算,地暖管长度计算,地暖回路数,分水器路数,盘管间距,JGJ 142,地暖用管量',
  author: '有条工具',
  ogTitle: '地暖盘管计算器 - 地暖管长度/回路数/分水器路数估算 | 有条工具',
  ogDescription: '面积 ÷ 间距 ×（1+余量）一键算出地暖总管长、回路数与分水器路数，附五档间距速查表。',
  ogUrl: 'https://www.util.cn/tools/floor-heating-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '地暖盘管计算器',
          url: 'https://www.util.cn/tools/floor-heating-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '按采暖面积或房间长宽估算盘管总长',
            '100/150/200/250/300mm 五档间距预设',
            '弯头余量与单回路最大管长可调',
            '回路数与分水器路数一键得出',
            '每平米用管速查表',
            'JGJ 142 间距-热负荷选型提示',
            'DN16/DN20 管径口径',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '地暖盘管计算器', item: 'https://www.util.cn/tools/floor-heating-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '地暖盘管总长怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '总管长(m) = 采暖面积(㎡) ÷ 管间距(m) ×（1 + 余量%）。如 20㎡、间距 150mm、余量 6%：20 ÷ 0.15 × 1.06 ≈ 141.3m。' }
            },
            {
              '@type': 'Question',
              name: '地暖需要几个回路、分水器选几路？',
              acceptedAnswer: { '@type': 'Answer', text: '回路数 = 总管长 ÷ 单回路最大管长后向上取整，分水器路数与回路数一致。例如总长 141.3m、单回路上限 120m，需 ceil(141.3/120)=2 个回路，分水器选 2 路（实际选购常预留 1 路备用）。' }
            },
            {
              '@type': 'Question',
              name: '盘管间距一般选多少？',
              acceptedAnswer: { '@type': 'Answer', text: '常用 100~300mm。按 JGJ 142-2012 第 3.5.4 条，间距应根据地面散热量、室内计算温度、平均水温与地面传热热阻计算或查附录 A 确定：热负荷大取 100~150mm，热负荷小取 200~300mm，同时校核人员经常停留区地面温度不超限。' }
            },
            {
              '@type': 'Question',
              name: '单回路最长能做多长？',
              acceptedAnswer: { '@type': 'Answer', text: '行业经验：DN16 单回路宜 ≤80~100m，DN20 宜 ≤100~120m。回路过长水阻大、流量不足，地面前后温差明显；本计算器默认 120m 上限，可在 100~150m 间调整。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// PURE-LOGIC-START
function clampNum(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

// 核心：总管长 = 面积 ÷ 间距(m) × (1+余量%)；回路数 = ceil(总管长/单回路上限)
// 返回 null 表示输入非法；maxLoop 限 100~150，waste 限 0~30
function calcFloorHeating(areaSqm, gapMm, wastePct, maxLoopM) {
  const a = Number(areaSqm)
  const g = Number(gapMm)
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(g) || g <= 0) return null
  const waste = clampNum(wastePct, 0, 30)
  const maxLoop = clampNum(maxLoopM, 100, 150)
  const gapM = g / 1000
  const perSqm = 1 / gapM
  const total = (a / gapM) * (1 + waste / 100)
  const loops = Math.ceil(total / maxLoop)
  return {
    perSqm,
    total,
    maxLoop,
    loops,
    perLoop: total / loops,
    baseLen: a / gapM
  }
}

// 每平米用管速查：1/间距；totalAtArea = 面积 × 每平米（不含余量）
function gapTableRows(areaSqm) {
  return [100, 150, 200, 250, 300].map((g) => {
    const perSqm = 1 / (g / 1000)
    return {
      gap: g,
      perSqm: +perSqm.toFixed(2),
      totalAtArea: Number.isFinite(Number(areaSqm)) && areaSqm > 0 ? +(perSqm * areaSqm).toFixed(1) : null
    }
  })
}
// PURE-LOGIC-END

// ---------- 静态数据 ----------
const AREA_MODES = [
  { value: 'direct', label: '直接输面积' },
  { value: 'lw', label: '房间长 × 宽' }
]
const GAP_PRESETS = [100, 150, 200, 250, 300]
const PIPE_SIZES = [
  { id: 'dn16', label: 'DN16（外径 16mm）', tip: 'DN16（外径 16mm、壁厚 2.0mm 的 PE-RT/PE-Xa 最常用）：散热量与柔软性好，单回路经验上限 80~100m，适合 120㎡ 以下住宅主流场景。' },
  { id: 'dn20', label: 'DN20（外径 20mm）', tip: 'DN20（外径 20mm）：流量大、水阻低、散热稍强，单回路经验上限 100~120m，适合大空间与入户间距较大的场合，但弯曲半径大、占层高略多。' }
]

const FAQS = [
  {
    q: '采暖面积和建筑面积有什么区别？',
    a: '采暖面积指实际铺盘管的地面面积：扣除固定柜体、无地暖的阳台/卫生间（若不铺）与墙体占位，一般约为建筑面积的 70%~80%。算料用采暖面积，不是建筑面积，否则会多算一到两成管。'
  },
  {
    q: '弯头余量 6% 是怎么来的？',
    a: '回字型/S 型盘管每个 180° 弯的展开长度比直线投影略长，加上起点引至分水器、终点回分水器的引管与裁切损耗，通行经验取 5%~8%，本工具默认 6%。现场障碍多、分水器远时可取 8%~10%。'
  },
  {
    q: '各回路长度必须一样吗？',
    a: '不必严格一样，但宜尽量接近（经验上相差不超过 15%~20%）。同一分水器各回路水阻悬殊会导致流量失衡：短环路流量过大、长环路流量不足，出现局部不热。划分时把朝外窗、外墙的低温区单独成环并适当加密。'
  },
  {
    q: '算完管长怎么买管？',
    a: '盘管按整卷供货（DN16 常见 300m/卷、DN20 常见 200m/卷，具体以厂家规格为准）。买管量 = 回路数 × 每回路长度向上取整到铺法可裁剪的整卷组合，另留 1~2 根短管备用即可，不必按总长 1:1 囤货。'
  },
  {
    q: '分水器路数要不要预留？',
    a: '分水器路数与回路数一致即可，实际选购时常见做法是比计算值多留 1 路（装堵头备用），方便后期分区改造或某环路损坏时借用。路数宜为偶数（如 2/4/6 路），与常见产品规格对齐。'
  }
]

// ---------- 响应式参数 ----------
const areaMode = ref('direct')
const area = ref(20)
const roomL = ref(5)
const roomW = ref(4)
const gap = ref(150)
const waste = ref(6)
const maxLoopInput = ref(120)
const pipe = ref('dn16')

const pipeTip = computed(() => {
  const p = PIPE_SIZES.find((x) => x.id === pipe.value)
  return p ? p.tip : ''
})

const areaFromLW = computed(() => {
  const l = Number(roomL.value)
  const w = Number(roomW.value)
  if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0) return null
  return +(l * w).toFixed(2)
})
const areaFromLWText = computed(() => (areaFromLW.value === null ? '—' : areaFromLW.value.toFixed(1)))

const effectiveArea = computed(() => (areaMode.value === 'lw' ? (areaFromLW.value ?? NaN) : Number(area.value)))

const wasteText = computed(() => (Number.isFinite(Number(waste.value)) ? Number(waste.value) : 0))

const validationIssues = computed(() => {
  const list = []
  const a = effectiveArea.value
  if (!Number.isFinite(a) || a <= 0) list.push('采暖面积需为大于 0 的数值')
  else if (a > 1000) list.push('面积超 1000㎡，大型工程请按房间分区分别计算再汇总')
  const w = Number(waste.value)
  if (Number.isFinite(w) && (w < 0 || w > 30)) list.push('余量限 0~30%，超出部分按边界值计算')
  return list
})

const result = computed(() => {
  const r = calcFloorHeating(effectiveArea.value, gap.value, waste.value, maxLoopInput.value)
  if (!r) return null
  return {
    ...r,
    totalText: r.total.toFixed(1),
    perSqmText: r.perSqm.toFixed(2),
    perLoopText: r.perLoop.toFixed(1),
    formulaText: `${r.baseLen.toFixed(1)} × ${(1 + wasteText.value / 100).toFixed(2)}`
  }
})

const gapTable = computed(() =>
  gapTableRows(Number.isFinite(effectiveArea.value) ? effectiveArea.value : null).map((row) => ({
    ...row,
    totalText: row.totalAtArea === null ? '—' : `${row.totalAtArea} m`
  }))
)

// ---------- 交互动作 ----------
async function copyResult() {
  const r = result.value
  if (!r) return
  const lines = [
    `地暖盘管算料（${effectiveArea.value.toFixed(1)}㎡ / 间距${gap.value}mm / 余量${wasteText.value}% / 管径${pipe.value.toUpperCase()}）`,
    `盘管总长：${r.total.toFixed(1)} m`,
    `回路数：${r.loops}（单回路 ≤${r.maxLoop}m）`,
    `分水器路数：${r.loops}`,
    `每平米管长：${r.perSqm.toFixed(2)} m/㎡`,
    `每回路平均：${r.perLoop.toFixed(1)} m`
  ]
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制')
  } catch {
    alert('复制失败，请手动选择文本复制')
  }
}

onMounted(() => {
  addRecentTool('floor-heating-calculator')
})
</script>
