<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplets class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">露点湿度计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">温度 + 相对湿度 → 露点、绝对湿度、水汽分压与湿球温度，支持由露点反算湿度，附结露判断与场景参考</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线露点计算器：输入空气温度与相对湿度，用 Magnus 公式（a=17.62、b=243.12）算露点温度——例如 25℃ / 60%RH 露点约 16.7℃，
        任何低于 16.7℃ 的表面（冷水管、外墙角、镜面）都会结露。同页给出绝对湿度（g/m³）、水汽分压（hPa）与湿球温度（Stull 2011 经验式），
        支持反算模式（已知温度与露点求相对湿度），并可输入表面温度即时判断「会不会结露」。烘干、地下室防潮、乐器与相机保养的湿度口径一次看全。
        全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Thermometer class="w-5 h-5 mr-2 text-primary" /> 空气参数
        </h2>

        <!-- 模式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">计算模式</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="m in MODES"
              :key="m.value"
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="mode === m.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="mode = m.value"
            >{{ m.label }}</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ modeTip }}</p>
        </div>

        <!-- 温度 -->
        <div>
          <label for="dp-t" class="block text-sm font-medium text-foreground mb-1.5">空气温度 T（℃，-40 ~ 100）</label>
          <div class="flex items-center gap-3">
            <input
              id="dp-t"
              v-model.number="tempC"
              type="number" min="-40" max="100" step="0.1"
              class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <input v-model.number="tempC" type="range" min="-40" max="100" step="0.5" class="flex-1 accent-primary" aria-label="温度滑块">
          </div>
        </div>

        <!-- RH 或 Td -->
        <div v-if="mode === 'forward'">
          <label for="dp-rh" class="block text-sm font-medium text-foreground mb-1.5">相对湿度 RH（%，1 ~ 100）</label>
          <div class="flex items-center gap-3">
            <input
              id="dp-rh"
              v-model.number="rh"
              type="number" min="1" max="100" step="1"
              class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <input v-model.number="rh" type="range" min="1" max="100" step="1" class="flex-1 accent-primary" aria-label="湿度滑块">
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">常用舒适区 40%~60%RH；低于 30% 干燥（静电、木器开裂），高于 70% 潮湿（霉菌风险）。</p>
        </div>
        <div v-else>
          <label for="dp-td" class="block text-sm font-medium text-foreground mb-1.5">露点温度 Td（℃，需 ≤ 当前温度）</label>
          <div class="flex items-center gap-3">
            <input
              id="dp-td"
              v-model.number="tdInput"
              type="number" min="-40" max="100" step="0.1"
              class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <input v-model.number="tdInput" type="range" :min="-40" :max="Math.max(-40, tempC)" step="0.5" class="flex-1 accent-primary" aria-label="露点滑块">
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">露点高于当前温度在物理上不成立，此时代入 Magnus 反算会得到 &gt;100% 的名义值，页面会提示。</p>
        </div>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>

        <!-- 结露判断 -->
        <div class="border-t border-border pt-4">
          <label for="dp-surface" class="block text-sm font-medium text-foreground mb-1.5">表面温度（℃，可选：判断该表面会不会结露）</label>
          <div class="flex items-center gap-3">
            <input
              id="dp-surface"
              v-model.number="surfaceC"
              type="number" min="-40" max="100" step="0.1"
              class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <div v-if="condensation" class="flex-1 px-3 py-2 rounded-lg text-xs font-medium border" :class="condensation.willCondense ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20'">
              {{ condensation.willCondense ? '会结露' : '不会结露' }}：表面 {{ condensation.surfaceText }}℃ vs 露点 {{ condensation.dpText }}℃，{{ condensation.msg }}
            </div>
          </div>
        </div>

        <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult">
          <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制计算结果
        </button>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Droplets class="w-5 h-5 mr-2 text-primary" /> 湿度指标结果
          </h2>
          <div v-if="result" class="space-y-4">
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">露点温度 Td（{{ result.dpFormulaHint }}）</p>
              <p class="text-4xl font-bold text-primary font-mono">{{ result.tdText }} <span class="text-lg font-normal text-muted-foreground">℃</span></p>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">绝对湿度</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ result.ahText }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">g/m³</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">水汽分压</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ result.eText }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">hPa</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">湿球温度</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ result.twText }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">℃（Stull 式）</p>
              </div>
            </div>
            <div v-if="mode === 'forward'" class="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>饱和水汽压 e_s({{ tempC }}℃) ≈ {{ result.esText }} hPa，实际水汽压 = e_s × RH% = {{ result.eText }} hPa；Magnus 公式与饱和水汽压标准表（如 25℃ 标准值约 31.7 hPa）相差约 0.3%，属公式口径差异，以标准表原文为准。</span>
            </div>
            <div v-else class="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs leading-relaxed">
              <p class="text-foreground">反算结果：RH = 100 × exp(a·Td/(b+Td) − a·T/(b+T)) = <span class="font-mono font-semibold text-primary">{{ result.reverseRhText }}</span></p>
            </div>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入有效温度与湿度开始计算</p>
        </div>

        <!-- 场景卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> 常见场景湿度口径
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">衣物烘干</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">升温是最有效的除湿：同样含湿量下 20℃/70%RH 的空气加热到 30℃，RH 降到约 35%，吸湿能力翻倍——烘干机加热排湿就是这个原理。关注绝对湿度比 RH 更直观。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">地下室防潮</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">夏秋季节风险最高：墙面温度低于空气露点即结露「淌水」。对策顺序——先通风降湿/除湿机把露点压到墙面温度以下（判断就用本页结露卡），再做墙面保温抬高表面温度，单纯密封反而加重凝结。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">乐器 / 相机保养</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">木吉他、钢琴、提琴适宜 45%~55%RH（湿度骤变会开裂或变形）；镜头与相机防霉要求 RH 低于 60%（霉菌孢子在 60%RH 以上萌发）。用本页把目标 RH 换算成露点，判断琴房/防潮柜所处环境是否达标。</p>
            </div>
          </div>
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
            <li>Magnus 露点：γ = ln(RH/100) + aT/(b+T)，Td = b·γ/(a − γ)，a=17.62、b=243.12（T 单位 ℃）</li>
            <li>饱和水汽压：e_s = 6.112 × exp(a·T/(b+T)) hPa；水汽分压 e = e_s × RH/100</li>
            <li>绝对湿度：AH = 216.7 × e /(273.15 + T) g/m³</li>
            <li>反算湿度：RH = 100 × exp( a·Td/(b+Td) − a·T/(b+T) )</li>
            <li>湿球温度（Stull 2011）：Tw = T·atan[0.151977(RH+8.313659)^½] + atan(T+RH) − atan(RH−1.676331) + 0.00391838·RH^1.5·atan(0.023101·RH) − 4.686035</li>
          </ul>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground mb-1.5">公式来源与口径说明</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            露点与饱和水汽压采用 Magnus-Tetens 近似（a=17.62、b=243.12 为 WMO/Magnus 常用系数组，适用于 0~60℃ 区间，误差典型 &lt;0.4℃）；
            湿球温度经验式引自 R. Stull《Wet-Bulb Temperature from Relative Humidity and Air Temperature》(J. Appl. Meteor. Climatol., 2011)，
            在标准气压、−20~50℃ 与 5%~99%RH 范围内误差约 ±1℃。
            Magnus 饱和汽压与标准表存在约 0.3% 的系统差（25℃ 时 Magnus 31.59 hPa vs 标准表约 31.69 hPa），属公式口径差异；
            湿球为标准海平面气压经验式，高海拔会偏低 1~2℃。工程与计量应用以现行标准原文（如 GB/T 11605 湿度测量方法）为准。
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

    <RelatedTools :currentToolId="'dew-point-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Droplets, Thermometer, BookOpen, Info, Copy, TriangleAlert } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '露点湿度计算器 - 露点/绝对湿度/湿球温度换算与结露判断 | 有条工具',
  description: '免费在线露点计算器：输入温度与相对湿度，Magnus 公式即时算露点（25℃/60%RH→16.7℃）、绝对湿度 g/m³、水汽分压 hPa 与湿球温度（Stull 2011），支持由露点反算 RH，输入表面温度即时判断会不会结露，附烘干/地下室防潮/乐器保养场景湿度口径，纯浏览器本地计算不上传',
  keywords: '露点计算器,绝对湿度,水汽分压,湿球温度,结露判断,Magnus公式,相对湿度换算',
  author: '有条工具',
  ogTitle: '露点湿度计算器 - 露点/绝对湿度/湿球温度换算与结露判断 | 有条工具',
  ogDescription: '温度 + 相对湿度一键算出露点、绝对湿度、水汽分压与湿球温度，并可判断表面结露风险。',
  ogUrl: 'https://www.util.cn/tools/dew-point-calculator',
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
          name: '露点湿度计算器',
          url: 'https://www.util.cn/tools/dew-point-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'Magnus 公式露点计算（a=17.62 b=243.12）',
            '绝对湿度 g/m³ 与水汽分压 hPa',
            '湿球温度（Stull 2011 经验式）',
            '由温度与露点反算相对湿度',
            '表面温度结露风险判断（会/不会结露徽章）',
            '烘干/地下室/乐器保养场景口径',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '露点湿度计算器', item: 'https://www.util.cn/tools/dew-point-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '露点是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '露点是空气冷却到水汽饱和开始凝结的温度。25℃/60%RH 的空气露点约 16.7℃：任何低于 16.7℃ 的表面（冷水管、单层玻璃、墙角）都会在其上结露。' }
            },
            {
              '@type': 'Question',
              name: '温度 25℃ 湿度 60% 的露点和绝对湿度是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '露点约 16.7℃，绝对湿度约 13.8 g/m³，水汽分压约 19.0 hPa，湿球温度约 19.5℃（Magnus 与 Stull 公式口径）。' }
            },
            {
              '@type': 'Question',
              name: '怎么判断墙面或水管会不会结露？',
              acceptedAnswer: { '@type': 'Answer', text: '比较表面温度与空气露点：表面温度 ≤ 露点就会结露。用本页输入空气温度与湿度得露点，再输入表面温度即可得到会/不会结露的判断与温差提示。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// PURE-LOGIC-START
const MAG_A = 17.62
const MAG_B = 243.12

function clampNum(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

// 饱和水汽压 hPa（Magnus）：e_s = 6.112·exp(aT/(b+T))
function satVaporPressureHpa(tempC) {
  const t = Number(tempC)
  if (!Number.isFinite(t) || t <= -243.12) return null
  return 6.112 * Math.exp((MAG_A * t) / (MAG_B + t))
}

// 露点：γ = ln(RH/100)+aT/(b+T)，Td = bγ/(a−γ)；RH 限 1~100
function dewPointC(tempC, rhPct) {
  const t = Number(tempC)
  const rh = clampNum(rhPct, 1, 100)
  if (!Number.isFinite(t) || t <= -MAG_B) return null
  const gamma = Math.log(rh / 100) + (MAG_A * t) / (MAG_B + t)
  return (MAG_B * gamma) / (MAG_A - gamma)
}

// 水汽分压 hPa = e_s × RH/100
function vaporPressureHpa(tempC, rhPct) {
  const es = satVaporPressureHpa(tempC)
  if (es === null) return null
  return es * (clampNum(rhPct, 1, 100) / 100)
}

// 绝对湿度 g/m³ = 216.7·e/(273.15+T)
function absHumidityGm3(tempC, rhPct) {
  const e = vaporPressureHpa(tempC, rhPct)
  if (e === null) return null
  return (216.7 * e) / (273.15 + Number(tempC))
}

// 反算：由 T 与 Td 求 RH = 100·exp(a·Td/(b+Td) − a·T/(b+T))；Td>T 时返回 >100 的名义值
function rhFromDewPoint(tempC, tdC) {
  const t = Number(tempC)
  const td = Number(tdC)
  if (!Number.isFinite(t) || !Number.isFinite(td) || t <= -MAG_B || td <= -MAG_B) return null
  return 100 * Math.exp((MAG_A * td) / (MAG_B + td) - (MAG_A * t) / (MAG_B + t))
}

// 湿球温度（Stull 2011，标准海平面气压，RH% 为百分数）
function wetBulbC(tempC, rhPct) {
  const t = Number(tempC)
  const rh = clampNum(rhPct, 1, 100)
  if (!Number.isFinite(t)) return null
  return (
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035
  )
}

// 结露判断：表面温度 ≤ 露点 → 会结露
function condensationCheck(surfaceC, dewPoint) {
  const s = Number(surfaceC)
  const dp = Number(dewPoint)
  if (!Number.isFinite(s) || !Number.isFinite(dp)) return null
  const will = s <= dp
  const diff = +(s - dp).toFixed(1)
  return {
    willCondense: will,
    diff,
    msg: will
      ? `表面比露点低 ${Math.abs(diff).toFixed(1)}℃，表面将凝结水珠`
      : `表面比露点高 ${diff.toFixed(1)}℃，余量${diff < 2 ? '偏小（<2℃），安全裕度有限' : '充足'}`
  }
}
// PURE-LOGIC-END

// ---------- 静态数据 ----------
const MODES = [
  { value: 'forward', label: '正算：T + RH', tip: '已知温度与相对湿度 → 露点、绝对湿度、水汽分压、湿球温度' },
  { value: 'reverse', label: '反算：T + 露点', tip: '已知温度与露点 → 相对湿度（其余指标按反算出的 RH 一并给出）' }
]

const FAQS = [
  {
    q: '露点温度越低说明空气越干燥吗？',
    a: '对同一环境温度下是的：露点越低，空气含湿量越少。冬季室内供暖时常见 20℃/25%RH，露点约 -2℃——绝对含湿量很低，所以会感到干燥、静电多；而南方梅雨季 26℃/85%RH 露点约 23℃，含湿量高，除湿才是关键。跨温度比较湿度时看露点或绝对湿度，比看 RH 更公平。'
  },
  {
    q: '冬天窗户上为什么总是结露甚至结冰？',
    a: '单层玻璃或铝框内表面温度常低于室内空气露点：室内 22℃/50%RH 露点约 11℃，单层玻璃内表面在寒夜可低到 0℃ 上下，水汽直接凝结甚至冻结。改善顺序：降低室内湿度（厨房卫浴排风）、中空玻璃/断桥铝抬高内表面温度、窗帘留缝让空气流过玻璃面。'
  },
  {
    q: '湿球温度有什么用，和露点什么区别？',
    a: '湿球温度是包裹湿纱布的温度计在通风下测得的温度，代表「蒸发制冷的极限」：湿球 28℃ 以上人体几乎无法靠排汗散热，工业上也用它衡量冷却塔极限。关系上永远满足 Td ≤ Tw ≤ T：露点衡量「何时凝结」，湿球衡量「蒸发降温能到多低」，RH=100% 时三者相等。本页湿球用 Stull 2011 经验式（海平面气压，±1℃ 级精度）。'
  },
  {
    q: '公式算的露点准不准？和高精度仪器一致吗？',
    a: 'Magnus 近似（a=17.62、b=243.12）在 0~60℃、常压下露点误差典型小于 0.4℃，绝对湿度误差在 1% 量级，足够日常与工程研判；但精密计量（实验室、标定）请用 IAPWS-IF97/科学级饱和汽压公式与现行标准（如 GB/T 11605）原文。高海拔（&gt;2000m）湿球经验式偏差会增大到 1~2℃。'
  },
  {
    q: '除湿机开到多少湿度合适？',
    a: '居住空间建议维持 45%~55%RH：低于 40% 偏干，高于 60% 霉菌风险上升。梅雨季优先设 55%~60% 避免压缩机频繁启停；地下室存物可压到 50%。判断目标是否达到，可把目标 RH 用本页换算成对应露点，与除湿机显示的温湿度交叉核验。'
  }
]

// ---------- 响应式参数 ----------
const mode = ref('forward')
const tempC = ref(25)
const rh = ref(60)
const tdInput = ref(16.7)
const surfaceC = ref(18)

const modeTip = computed(() => {
  const m = MODES.find((x) => x.value === mode.value)
  return m ? m.tip : ''
})

const validationIssues = computed(() => {
  const list = []
  const t = Number(tempC.value)
  if (!Number.isFinite(t) || t < -40 || t > 100) list.push('温度限 -40 ~ 100℃')
  if (mode.value === 'forward') {
    const r = Number(rh.value)
    if (!Number.isFinite(r) || r < 1 || r > 100) list.push('相对湿度限 1% ~ 100%')
  } else {
    const td = Number(tdInput.value)
    if (!Number.isFinite(td)) list.push('露点需为有效数值')
    else if (td > t) list.push('露点高于当前温度不成立（空气早已过饱和），请调低露点')
  }
  return list
})

// 反算模式下的名义 RH（>100 视为无效提示）
const effectiveRh = computed(() => {
  if (mode.value === 'forward') return clampNum(rh.value, 1, 100)
  const v = rhFromDewPoint(tempC.value, tdInput.value)
  return v === null ? null : v
})

// 统一结果：都按 T + RH 走 Magnus 全套
const result = computed(() => {
  if (validationIssues.value.length) return null
  const eRh = effectiveRh.value
  if (eRh === null || !Number.isFinite(eRh) || eRh <= 0) return null
  const td = dewPointC(tempC.value, eRh)
  const e = vaporPressureHpa(tempC.value, eRh)
  const es = satVaporPressureHpa(tempC.value)
  const ah = absHumidityGm3(tempC.value, eRh)
  const tw = wetBulbC(tempC.value, eRh)
  if (td === null || e === null || es === null || ah === null || tw === null) return null
  return {
    td: +td.toFixed(2),
    tdText: td.toFixed(1),
    tdFormulaHint: mode.value === 'forward' ? '正算 Magnus' : '由输入露点回代',
    ahText: ah.toFixed(2),
    eText: e.toFixed(2),
    esText: es.toFixed(2),
    twText: tw.toFixed(1),
    reverseRhText: eRh.toFixed(1) + '%'
  }
})

const condensation = computed(() => {
  if (!result.value) return null
  const c = condensationCheck(surfaceC.value, result.value.td)
  if (!c) return null
  return {
    ...c,
    surfaceText: Number(surfaceC.value).toFixed(1),
    dpText: result.value.tdText
  }
})

// ---------- 交互动作 ----------
async function copyResult() {
  const r = result.value
  if (!r) return
  const lines = [
    `湿度指标（${Number(tempC.value).toFixed(1)}℃ / ${effectiveRh.value.toFixed(0)}%RH）`,
    `露点：${r.tdText} ℃`,
    `绝对湿度：${r.ahText} g/m³`,
    `水汽分压：${r.eText} hPa（饱和 ${r.esText} hPa）`,
    `湿球温度：${r.twText} ℃`,
    condensation.value ? `表面 ${condensation.value.surfaceText}℃：${condensation.value.willCondense ? '会结露' : '不会结露'}` : ''
  ].filter(Boolean)
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制')
  } catch {
    alert('复制失败，请手动选择文本复制')
  }
}

onMounted(() => {
  addRecentTool('dew-point-calculator')
})
</script>
