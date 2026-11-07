<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Lightbulb class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">照度计算器（流明法）</h1>
          <p class="text-sm text-muted-foreground mt-1">按面积与目标照度算需要几盏灯：N = E·A /（Φ·UF·MF），附按整盏回算实际照度与 UF/MF 敏感度对照</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线流明法照明计算器：装修选灯前先算「要几盏」——所需灯具数 N = ⌈目标照度(lx) × 面积(㎡) ÷（单灯光通量(lm) × 利用系数 UF × 维护系数 MF)⌉。
        例如 20㎡ 客厅按 100lx、5 盏 1200lm 筒灯（UF 0.5 / MF 0.8）：100×20 ÷（1200×0.5×0.8）= 4.17 → 取 5 盏，装完实际平均照度回算约 120lx。
        本页内置 GB/T 50034-2024《建筑照明设计标准》常用房间照度预设（起居室 100lx / 办公室 300lx / 教室 300lx / 厨房操作台 150lx 等）、
        常见 LED 筒灯/泡灯光通量档位与 UF/MF 敏感度对照表，并可按光效估算总功率。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 照明参数
        </h2>

        <!-- 面积 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">面积输入方式</label>
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
              class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="房间面积"
            >
            <span class="text-xs text-muted-foreground">㎡</span>
          </div>
          <div v-else class="flex items-center gap-2">
            <input v-model.number="roomL" type="number" min="0.1" step="0.1" class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-24 focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="房间长">
            <span class="text-xs text-muted-foreground">m 长 ×</span>
            <input v-model.number="roomW" type="number" min="0.1" step="0.1" class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-24 focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="房间宽">
            <span class="text-xs text-muted-foreground">m 宽 = <span class="font-mono text-foreground">{{ areaFromLWText }}</span>㎡</span>
          </div>
        </div>

        <!-- 目标照度 -->
        <div>
          <label for="ll-lux" class="block text-sm font-medium text-foreground mb-1.5">目标照度 E（lx）</label>
          <div class="flex items-center gap-2">
            <input
              id="ll-lux"
              v-model.number="lux"
              type="number" min="10" max="2000" step="10"
              class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in LUX_PRESETS" :key="p.value"
                type="button"
                :title="p.tip"
                class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
                :class="lux === p.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="lux = p.value"
              >{{ p.label }}</button>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ luxPresetTip }}（GB/T 50034-2024 常用值，以现行标准原文为准）</p>
        </div>

        <!-- 单灯光通量 -->
        <div>
          <label for="ll-flux" class="block text-sm font-medium text-foreground mb-1.5">单灯光通量 Φ（lm）</label>
          <div class="flex items-center gap-2">
            <input
              id="ll-flux"
              v-model.number="flux"
              type="number" min="100" max="20000" step="50"
              class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="f in FLUX_CHIPS" :key="f"
                type="button"
                class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
                :class="flux === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="flux = f"
              >{{ f }}lm</button>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">看灯具包装/规格页的「光通量 lm」，不是「等效 XXW」。常见：筒灯 600lm、吸顶灯珠 800lm、筒灯(大) 1200lm。</p>
        </div>

        <!-- UF / MF -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="ll-uf" class="block text-sm font-medium text-foreground mb-1.5">利用系数 UF</label>
            <input
              id="ll-uf"
              v-model.number="uf"
              type="number" min="0.4" max="0.6" step="0.05"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <p class="text-[11px] text-muted-foreground mt-1.5">到达工作面的光占灯具总光通比例：普通住宅 0.4~0.5，浅色墙顶/反光好取高，深色装修取低；限 0.4~0.6。</p>
          </div>
          <div>
            <label for="ll-mf" class="block text-sm font-medium text-foreground mb-1.5">维护系数 MF</label>
            <input
              id="ll-mf"
              v-model.number="mf"
              type="number" min="0.7" max="0.9" step="0.05"
              class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <p class="text-[11px] text-muted-foreground mt-1.5">计入灰尘衰减与光衰：清洁环境 0.8，一般住宅 0.8，厨房/多尘环境 0.7；限 0.7~0.9。</p>
          </div>
        </div>

        <!-- 光效（可选） -->
        <div>
          <label for="ll-eff" class="block text-sm font-medium text-foreground mb-1.5">灯光效（lm/W，可选，用于估算总功率）</label>
          <input
            id="ll-eff"
            v-model.number="efficacy"
            type="number" min="40" max="220" step="5"
            class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-[11px] text-muted-foreground mt-1.5">主流 LED 灯具 90~130 lm/W（2020 年代产品），吸顶灯约 80~100，高效筒灯可达 120+。不填功率按留空处理。</p>
        </div>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>

        <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult">
          <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制选灯方案
        </button>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 所需灯具数
          </h2>
          <div v-if="result" class="space-y-4">
            <div class="bg-muted/50 rounded-xl p-4">
              <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono">
                <span class="text-xl text-foreground">{{ lux }}lx</span>
                <span class="text-sm text-muted-foreground">×</span>
                <span class="text-xl text-foreground">{{ result.areaText }}㎡</span>
                <span class="text-sm text-muted-foreground">÷（{{ flux }}lm ×{{ uf.toFixed(2) }} ×{{ mf.toFixed(2) }}）=</span>
                <span class="text-3xl lg:text-4xl font-bold text-primary">{{ result.rawText }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-2">取整前 {{ result.rawText }} 盏 → 向上取整装 <span class="font-mono text-foreground font-semibold">{{ result.n }} 盏</span>（灯具只能装整数，取整前后的双显如上）。</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">装 {{ result.n }} 盏后实际平均照度</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.actualLux }} <span class="text-sm font-normal text-muted-foreground">lx</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">{{ result.actualLuxRatio }}（相对目标 {{ lux }}lx）</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">总光通量 / 总功率估算</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ result.totalFlux }} <span class="text-sm font-normal text-muted-foreground">lm</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">{{ result.powerText }}</p>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>流明法算的是「工作面平均照度」的工程概算：实际感受还受灯具配光、安装高度、墙面反射与局部重点照明影响；阅读/操作位建议另加局部光源（台灯/橱柜灯）补足。</span>
            </div>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入有效面积与照度开始计算</p>
        </div>

        <!-- 敏感度表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> UF / MF 敏感度对照
          </h2>
          <p class="text-xs text-muted-foreground mb-3">各格为该 UF/MF 组合下所需盏数（行 = UF 各 ±0.1，列 = MF 各 ±0.1，均限 0.4~0.6 / 0.7~0.9 区间）：装修深浅与灯具积灰的影响一眼可见。</p>
          <div v-if="sensitivity" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-xs text-muted-foreground">
                  <th class="text-left py-2 pr-3 font-medium">UF \ MF</th>
                  <th v-for="c in sensitivity.cols" :key="'h' + c.value" class="text-right py-2 px-3 font-medium font-mono">{{ c.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sensitivity.rows" :key="row.value" class="border-b border-border/50" :class="row.isCurrent ? 'bg-primary/5' : ''">
                  <td class="py-2 pr-3 font-mono" :class="row.isCurrent ? 'text-primary font-semibold' : 'text-foreground'">UF {{ row.label }}</td>
                  <td
                    v-for="c in sensitivity.cols" :key="row.value + '-' + c.value"
                    class="py-2 px-3 text-right font-mono"
                    :class="row.isCurrent && c.isCurrent ? 'text-primary font-bold' : 'text-foreground'"
                  >{{ lampCount(lux, sensitivity.area, flux, row.value, c.value) }} 盏</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 可折叠 SEO 区：FAQ + 公式 + 来源 -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6" open>
      <summary class="text-base font-semibold text-foreground cursor-pointer select-none mb-4">计算公式、标准来源与常见问题</summary>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-1.5">核心公式（流明法 / Lumen Method）</h3>
          <ul class="text-sm text-muted-foreground space-y-1 leading-relaxed list-disc list-inside font-mono text-[13px]">
            <li>所需灯具数 N = ⌈ E × A ÷（Φ × UF × MF）⌉（E 目标照度 lx、A 面积 ㎡、Φ 单灯光通量 lm）</li>
            <li>按整盏回算实际平均照度 E实 = N × Φ × UF × MF ÷ A</li>
            <li>总功率估算 W ≈ N × Φ ÷ 光效(lm/W)</li>
          </ul>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground mb-1.5">标准与来源</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            房间照度预设取自现行《建筑照明设计标准》GB/T 50034-2024（2024-08-01 实施，替代 GB 50034-2013）常用场所照度标准值：
            住宅起居室一般活动 100lx（书写阅读 300lx，宜加局部照明）、卧室一般活动 75lx、餐厅 150lx、厨房一般活动 100lx / 操作台 150lx、
            普通办公室 300lx、教室课桌面 300lx、公共建筑走廊约 100lx。数值为编者整理，工程应用以现行标准原文为准。
            UF/MF 取值为照明设计通用经验区间（利用系数 0.4~0.6、维护系数 0.7~0.9）。
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

    <RelatedTools :currentToolId="'lumen-lighting-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Lightbulb, Calculator, Gauge, Info, Copy, TriangleAlert } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '照度计算器 - 流明法按面积算需要几盏灯 | 有条工具',
  description: '免费在线照度计算器：流明法 N = E·A/(Φ·UF·MF) 按房间面积与目标照度（GB/T 50034-2024 预设：起居室100lx/办公室300lx/教室300lx/厨房操作台150lx）即时算所需灯具数，取整前后双显、按整盏回算实际照度、按光效估算总功率，附 UF/MF 敏感度对照表，纯浏览器本地计算不上传',
  keywords: '照度计算器,流明法,灯具数量计算,勒克斯计算,GB 50034,房间需要几盏灯,光通量换算',
  author: '有条工具',
  ogTitle: '照度计算器 - 流明法按面积算需要几盏灯 | 有条工具',
  ogDescription: '面积 × 目标照度 ÷（光通量 × UF × MF）一键算出需要几盏灯，附实际照度回算与 UF/MF 敏感度对照。',
  ogUrl: 'https://www.util.cn/tools/lumen-lighting-calculator',
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
          name: '照度计算器（流明法）',
          url: 'https://www.util.cn/tools/lumen-lighting-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '流明法 N = E·A/(Φ·UF·MF) 灯具数量计算',
            'GB/T 50034-2024 常用房间照度预设',
            '常见 LED 光通量 600/800/1200lm 快选',
            '取整前后双显与整盏回算实际照度',
            '按 lm/W 估算总功率',
            'UF/MF 各 ±0.1 敏感度对照表',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '照度计算器', item: 'https://www.util.cn/tools/lumen-lighting-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '流明法怎么算需要几盏灯？',
              acceptedAnswer: { '@type': 'Answer', text: '所需灯具数 = 目标照度(lx) × 面积(㎡) ÷（单灯光通量(lm) × 利用系数 UF × 维护系数 MF），向上取整。例如 20㎡ 客厅按 100lx、1200lm 筒灯、UF 0.5、MF 0.8：2000÷480≈4.17，取 5 盏。' }
            },
            {
              '@type': 'Question',
              name: '客厅、办公室、教室的标准照度是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '按 GB/T 50034-2024：住宅起居室一般活动 100lx（书写阅读 300lx 宜加局部照明）、厨房操作台 150lx、普通办公室 300lx、教室课桌面 300lx、公共建筑走廊约 100lx。以现行标准原文为准。' }
            },
            {
              '@type': 'Question',
              name: 'UF 和 MF 应该填多少？',
              acceptedAnswer: { '@type': 'Answer', text: 'UF（利用系数）指到达工作面的光占灯具总光通的比例，普通住宅浅色环境约 0.5，深色装修约 0.4；MF（维护系数）计入积灰与光衰，清洁房间约 0.8，厨房多尘环境约 0.7。两者都偏保守一点，装灯宁多勿少。' }
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

// 流明法核心：N = ceil(E·A/(Φ·UF·MF))；返回 null 表示输入非法
// UF 限 0.4~0.6、MF 限 0.7~0.9，超界按边界值算
function lampCount(E, A, fluxLm, UF, MF) {
  const e = Number(E)
  const a = Number(A)
  const f = Number(fluxLm)
  if (!Number.isFinite(e) || e <= 0 || !Number.isFinite(a) || a <= 0 || !Number.isFinite(f) || f <= 0) return null
  const uf = clampNum(UF, 0.4, 0.6)
  const mf = clampNum(MF, 0.7, 0.9)
  return Math.ceil((e * a) / (f * uf * mf))
}

// 取整前的原始值（用于双显）
function lampRaw(E, A, fluxLm, UF, MF) {
  const e = Number(E)
  const a = Number(A)
  const f = Number(fluxLm)
  if (!Number.isFinite(e) || e <= 0 || !Number.isFinite(a) || a <= 0 || !Number.isFinite(f) || f <= 0) return null
  const uf = clampNum(UF, 0.4, 0.6)
  const mf = clampNum(MF, 0.7, 0.9)
  return (e * a) / (f * uf * mf)
}

// 按整盏回算实际平均照度
function actualLux(nLamps, fluxLm, UF, MF, A) {
  const n = Number(nLamps)
  const f = Number(fluxLm)
  const a = Number(A)
  if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(f) || f <= 0 || !Number.isFinite(a) || a <= 0) return null
  const uf = clampNum(UF, 0.4, 0.6)
  const mf = clampNum(MF, 0.7, 0.9)
  return (n * f * uf * mf) / a
}

// 总功率 W = N × Φ / 光效；光效非法返回 null
function totalPowerW(nLamps, fluxLm, efficacyLmPerW) {
  const n = Number(nLamps)
  const f = Number(fluxLm)
  const eff = Number(efficacyLmPerW)
  if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(f) || f <= 0 || !Number.isFinite(eff) || eff <= 0) return null
  return (n * f) / eff
}

// UF/MF 各 ±0.1 的行列组合（限区间内）
function sensitivityAxes(uf, mf) {
  const baseUf = clampNum(uf, 0.4, 0.6)
  const baseMf = clampNum(mf, 0.7, 0.9)
  const ufSet = [...new Set([clampNum(baseUf - 0.1, 0.4, 0.6), baseUf, clampNum(baseUf + 0.1, 0.4, 0.6)])].sort((x, y) => x - y)
  const mfSet = [...new Set([clampNum(baseMf - 0.1, 0.7, 0.9), baseMf, clampNum(baseMf + 0.1, 0.7, 0.9)])].sort((x, y) => x - y)
  return { ufSet, mfSet, baseUf, baseMf }
}
// PURE-LOGIC-END

// ---------- 静态数据 ----------
const AREA_MODES = [
  { value: 'direct', label: '直接输面积' },
  { value: 'lw', label: '长 × 宽' }
]
// GB/T 50034-2024 常用照度预设（编者整理，以标准原文为准）
const LUX_PRESETS = [
  { value: 100, label: '起居室 100', tip: '住宅起居室一般活动 0 平面照度' },
  { value: 75, label: '卧室 75', tip: '住宅卧室一般活动（床头阅读 150lx 宜局部照明）' },
  { value: 150, label: '餐厅/厨台 150', tip: '餐厅、厨房操作台' },
  { value: 300, label: '办公室/教室 300', tip: '普通办公室、教室课桌面' },
  { value: 500, label: '精细作业 500', tip: '高档办公室、设计绘图等精细视觉作业' },
  { value: 100, label: '走廊 100', tip: '公共建筑走廊（住宅走廊 50~100）' }
]
const FLUX_CHIPS = [400, 600, 800, 1200]

const FAQS = [
  {
    q: '流明法和「几瓦一平米」的老说法有什么区别？',
    a: '「3W/㎡、5W/㎡」是白炽灯/节能灯时代的粗糙经验，LED 光效差异很大（80~130lm/W），同样瓦数亮度差可达五成。流明法直接用光通量 lm 与目标照度 lx 计算，与灯具类型无关，是照明设计的标准做法。买灯认 lm，不认 W。'
  },
  {
    q: '为什么取整后照度会超过目标值？',
    a: '灯具只能装整数盏，ceil 向上取整必然使实际照度 ≥ 目标（例：4.17 盏 → 5 盏，照度从 100lx 提到约 120lx）。这符合照明工程「宁高勿低」的习惯；若超出太多，可选低一档光通量的灯具或减少一盏加局部照明补工作面。'
  },
  {
    q: 'UF/MF 填错一点影响大吗？',
    a: '敏感度表给出答案：UF 或 MF 各变 0.1，盏数通常变 1 盏上下（小房间更敏感）。浅色墙顶、灯具向上照或镜面多取高 UF；厨房油烟灰尘环境 MF 取 0.7。拿不准就按保守值算，多一盏灯的成本远小于房间偏暗的返工。'
  },
  {
    q: '算出来的平均照度为什么和体感不一样？',
    a: '流明法给出的是工作面「平均」照度概算：灯具正下方亮、角落暗；深色墙面吸光、层高高也会拉低实际值。沙发阅读、厨房操作、书桌等固定作业位，请在平均照度基础上叠加局部照明（台灯、吊柜灯带），单独满足 150~300lx 的局部照度要求。'
  },
  {
    q: '教室和办公室为什么要 300lx？',
    a: '300lx 是 GB/T 50034 对普通办公室、教室课桌面的标准照度值，对应长时间阅读书写类视觉作业的舒适与效率下限；同场所精细作业（制图、检验）提到 500lx。教室另有黑板面 ≥500lx 与照度均匀度 ≥0.7 的专项要求，需专项设计而非单靠本页估算。'
  }
]

// ---------- 响应式参数 ----------
const areaMode = ref('direct')
const area = ref(20)
const roomL = ref(5)
const roomW = ref(4)
const lux = ref(100)
const flux = ref(1200)
const uf = ref(0.5)
const mf = ref(0.8)
const efficacy = ref(100)

const areaFromLW = computed(() => {
  const l = Number(roomL.value)
  const w = Number(roomW.value)
  if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0) return null
  return +(l * w).toFixed(2)
})
const areaFromLWText = computed(() => (areaFromLW.value === null ? '—' : areaFromLW.value.toFixed(1)))

const effectiveArea = computed(() => (areaMode.value === 'lw' ? (areaFromLW.value ?? NaN) : Number(area.value)))

const luxPresetTip = computed(() => {
  const p = LUX_PRESETS.find((x) => x.value === lux.value)
  if (p) return `当前命中预设：${p.tip}`
  return '自定义照度'
})

const validationIssues = computed(() => {
  const list = []
  const a = effectiveArea.value
  if (!Number.isFinite(a) || a <= 0) list.push('面积需为大于 0 的数值')
  const e = Number(lux.value)
  if (!Number.isFinite(e) || e < 10 || e > 2000) list.push('目标照度限 10~2000 lx，超出按 0.4~0.6 UF 经验区间口径请复核')
  const f = Number(flux.value)
  if (!Number.isFinite(f) || f < 100) list.push('单灯光通量需 ≥100 lm')
  return list
})

const result = computed(() => {
  const n = lampCount(lux.value, effectiveArea.value, flux.value, uf.value, mf.value)
  const raw = lampRaw(lux.value, effectiveArea.value, flux.value, uf.value, mf.value)
  if (n === null || raw === null) return null
  const e2 = actualLux(n, flux.value, uf.value, mf.value, effectiveArea.value)
  const pw = totalPowerW(n, flux.value, efficacy.value)
  return {
    n,
    rawText: raw.toFixed(2),
    areaText: effectiveArea.value.toFixed(1),
    actualLux: e2 === null ? '—' : Math.round(e2),
    actualLuxRatio: e2 === null ? '' : `${e2 >= lux.value ? '达标' : '偏低'}（${Math.round((e2 / lux.value) * 100)}%）`,
    totalFlux: (n * flux.value).toLocaleString('en-US'),
    powerText: pw === null ? '未填光效' : `约 ${pw.toFixed(0)} W（按 ${efficacy.value} lm/W）`
  }
})

const sensitivity = computed(() => {
  const a = effectiveArea.value
  if (!Number.isFinite(a) || a <= 0) return null
  const ax = sensitivityAxes(uf.value, mf.value)
  return {
    area: a,
    rows: ax.ufSet.map((v) => ({ value: v, label: v.toFixed(2), isCurrent: Math.abs(v - ax.baseUf) < 1e-9 })),
    cols: ax.mfSet.map((v) => ({ value: v, label: v.toFixed(2), isCurrent: Math.abs(v - ax.baseMf) < 1e-9 }))
  }
})

// ---------- 交互动作 ----------
async function copyResult() {
  const r = result.value
  if (!r) return
  const lines = [
    `流明法选灯方案（${r.areaText}㎡ / 目标 ${lux.value}lx）`,
    `单灯 ${flux.value}lm · UF ${uf.value} · MF ${mf.value}`,
    `计算值 ${r.rawText} 盏 → 装 ${r.n} 盏`,
    `实际平均照度约 ${r.actualLux} lx`,
    r.powerText.startsWith('约') ? `总功率${r.powerText}` : '总功率：未填光效'
  ]
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制')
  } catch {
    alert('复制失败，请手动选择文本复制')
  }
}

onMounted(() => {
  addRecentTool('lumen-lighting-calculator')
})
</script>
