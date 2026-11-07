<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Activity class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">正态分布计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">区间概率、单尾/双尾概率、逆 CDF 分位数与 PDF 曲线可视化，附实时标准分 z 换算与完整 Z 表（Φ 值 erf 精确计算）</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线正态分布计算器：输入均值 μ 与标准差 σ，算区间概率 P(a≤X≤b)、单尾概率 P(X≤x) / P(X≥x)、
        双尾概率 P(|X−μ|≥d) 与逆模式（P(X≤x)=p 反解 x，逆 erf 牛顿精化）；
        PDF 曲线 SVG 可视化并把所求区间涂色，原始值 ↔ 标准分 z = (X−μ)/σ 实时联动。
        附 0.0~3.9 步进 0.1 的完整 Z 表（Φ 值由 erf 级数 + 连分式精确计算而非抄表）与 68-95-99.7 法则卡。
        Φ(1)=0.841344746、P(−1.96≤X≤1.96)=0.950004、逆 p=0.975 → x=1.959964 等锚点双精度复现。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">先标准化再看表</span>：Z 表只给标准正态 N(0,1) 的 Φ(z)。
          一般正态 N(μ,σ²) 先换 z = (X−μ)/σ 再查表，本页已自动完成这步换算；
          直接拿原始值查 Z 表是最常见的出错点。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主交互区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 参数 + 模式 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="nd-mu" class="block text-sm font-medium text-foreground mb-1.5">均值 μ</label>
              <input id="nd-mu" v-model.number="mu" type="number" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label for="nd-sigma" class="block text-sm font-medium text-foreground mb-1.5">标准差 σ &gt; 0</label>
              <input id="nd-sigma" v-model.number="sigma" type="number" min="0" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <p class="text-sm font-medium text-foreground mb-1.5">快捷示例</p>
              <button type="button" @click="loadIqExample" class="w-full py-2 px-3 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition">
                IQ 例（μ=100, σ=15）
              </button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="m in MODES"
              :key="m.id"
              @click="mode = m.id"
              :class="mode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
            >{{ m.label }}</button>
          </div>

          <!-- 区间模式 -->
          <div v-if="mode === 'interval'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="nd-a" class="block text-sm font-medium text-foreground mb-1.5">下限 a</label>
              <input id="nd-a" v-model.number="intervalA" type="number" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 90" />
            </div>
            <div>
              <label for="nd-b" class="block text-sm font-medium text-foreground mb-1.5">上限 b</label>
              <input id="nd-b" v-model.number="intervalB" type="number" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 130" />
            </div>
          </div>

          <!-- 单尾/双尾模式 -->
          <div v-else-if="mode === 'tail'" class="space-y-3">
            <div class="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                @click="tailKind = 'left'"
                class="py-2 rounded-lg border text-xs font-medium transition"
                :class="tailKind === 'left' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
              >左尾 P(X ≤ x)</button>
              <button
                type="button"
                @click="tailKind = 'right'"
                class="py-2 rounded-lg border text-xs font-medium transition"
                :class="tailKind === 'right' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
              >右尾 P(X ≥ x)</button>
              <button
                type="button"
                @click="tailKind = 'two'"
                class="py-2 rounded-lg border text-xs font-medium transition"
                :class="tailKind === 'two' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
              >双尾 P(|X−μ| ≥ d)</button>
            </div>
            <div>
              <label for="nd-tailx" class="block text-sm font-medium text-foreground mb-1.5">{{ tailKind === 'two' ? '偏离距离 d（≥ 0，X 到 μ 的距离）' : '临界值 x' }}</label>
              <input id="nd-tailx" v-model.number="tailX" type="number" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 130" />
            </div>
          </div>

          <!-- 逆模式 -->
          <div v-else class="space-y-3">
            <div>
              <label for="nd-p" class="block text-sm font-medium text-foreground mb-1.5">累积概率 p = P(X ≤ x)（0 ~ 1）</label>
              <input id="nd-p" v-model.number="invP" type="number" min="0" max="1" step="0.001" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 0.975" />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="a in P_ANCHORS" :key="a.p" type="button" @click="invP = a.p" class="px-2.5 py-1 rounded-md bg-muted/40 border border-border text-xs font-medium text-muted-foreground hover:border-primary/40 transition font-mono">
                p = {{ a.p }} {{ a.hint }}
              </button>
            </div>
          </div>
        </div>

        <!-- 结果 + 曲线 -->
        <div v-if="validParams" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <p class="text-sm text-muted-foreground mb-1">{{ resultLabel }}</p>
            <p class="text-3xl font-bold text-primary font-mono">{{ resultMain }}</p>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ resultDetail }}</p>
          </div>

          <!-- PDF 曲线 SVG -->
          <div>
            <p class="text-sm font-medium text-foreground mb-2">概率密度曲线（{{ distRangeText }}，涂色区域为所求概率）</p>
            <svg :viewBox="'0 0 640 260'" class="w-full h-auto" role="img" aria-label="正态分布概率密度曲线">
              <!-- 涂色区域 -->
              <path
                v-for="(poly, pi) in shadedPolys"
                :key="'p' + pi"
                :d="poly"
                class="text-primary"
                fill="currentColor"
                opacity="0.22"
              />
              <!-- 基线 -->
              <line :x1="PAD_L" :y1="BASE_Y" :x2="640 - PAD_R" :y2="BASE_Y" class="text-muted-foreground" stroke="currentColor" stroke-width="1" />
              <!-- 密度曲线 -->
              <path :d="curvePath" class="text-primary" fill="none" stroke="currentColor" stroke-width="2" />
              <!-- 均值虚线 -->
              <line :x1="xPix(mu)" :y1="PAD_T" :x2="xPix(mu)" :y2="BASE_Y" class="text-muted-foreground" stroke="currentColor" stroke-width="1" stroke-dasharray="4 3" />
              <!-- 刻度 -->
              <text v-for="(tk, ti) in ticks" :key="'t' + ti" :x="tk.x" :y="BASE_Y + 18" text-anchor="middle" class="fill-current text-muted-foreground" font-size="11" font-family="monospace">{{ tk.label }}</text>
            </svg>
          </div>

          <button
            type="button"
            @click="copyResult"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition flex items-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" /> 复制计算结果
          </button>
        </div>
        <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-sm text-muted-foreground">{{ inputError }}</p>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 标准分联动 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 标准分 z 联动
          </h2>
          <div>
            <label for="nd-raw" class="block text-sm font-medium text-foreground mb-1.5">原始值 X</label>
            <input id="nd-raw" v-model.number="rawX" type="number" step="any" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="如 130" />
          </div>
          <div v-if="zLink" class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs leading-relaxed">
            <p><span class="text-muted-foreground">标准分</span> <span class="font-mono text-foreground font-semibold">z = (X−μ)/σ = {{ fmtNum(zLink.z, 4) }}</span></p>
            <p><span class="text-muted-foreground">Φ(z) = P(X ≤ {{ fmtNum(rawX, 2) }}) =</span> <span class="font-mono text-foreground font-semibold">{{ fmtProb(zLink.cdf) }}</span></p>
            <p><span class="text-muted-foreground">P(X ≥ {{ fmtNum(rawX, 2) }}) =</span> <span class="font-mono text-foreground font-semibold">{{ fmtProb(zLink.sf) }}</span></p>
          </div>
        </div>

        <!-- 68-95-99.7 法则 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 68-95-99.7 法则
          </h2>
          <div class="space-y-1.5 text-xs">
            <div class="flex justify-between p-2 rounded bg-muted/40 border border-border">
              <span class="text-muted-foreground">μ ± 1σ</span>
              <span class="font-mono text-foreground font-semibold">{{ rule1 }}</span>
            </div>
            <div class="flex justify-between p-2 rounded bg-muted/40 border border-border">
              <span class="text-muted-foreground">μ ± 2σ</span>
              <span class="font-mono text-foreground font-semibold">{{ rule2 }}</span>
            </div>
            <div class="flex justify-between p-2 rounded bg-muted/40 border border-border">
              <span class="text-muted-foreground">μ ± 3σ</span>
              <span class="font-mono text-foreground font-semibold">{{ rule3 }}</span>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            约 68% 数据落在均值 ±1σ 内、95% 在 ±2σ 内、99.7% 在 ±3σ 内（精确值 68.27% / 95.45% / 99.73%）。
            记住这组数能秒估大多数「离均值几个 σ」的问题；σ 下方的 0.13% / 2.35% 尾巴常被忽略但很关键。
          </p>
          <NuxtLink to="/tools/confidence-interval-calculator" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition">
            <BarChart class="w-4 h-4" /> 用置信区间计算器算 x̄ ± MOE →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Z 表（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6">
      <summary class="cursor-pointer text-xl font-bold text-foreground select-none"><span class="text-primary mr-2">#</span>标准正态 Z 表（z = 0.0 ~ 3.9，Φ 值 erf 精确计算）</summary>
      <div class="mt-4">
        <p class="text-xs text-muted-foreground mb-3 leading-relaxed">
          表值 Φ(z) = P(Z ≤ z)，z = 行号 + 列号。例如 z=1.96 → 行 1.9 + 列 0.06 → 0.9750。
          本表 Φ 值由双精度误差函数（erf 级数 + 连分式）逐格计算，非抄表，可直接用于插值核对。
        </p>
        <div class="overflow-x-auto">
          <table class="text-xs min-w-[680px]">
            <thead>
              <tr class="text-muted-foreground">
                <th class="py-1.5 px-2 text-left font-medium">z</th>
                <th v-for="j in 10" :key="j" class="py-1.5 px-1.5 font-medium font-mono">+0.0{{ j - 1 }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in Z_TABLE" :key="i" :class="i % 2 ? 'bg-muted/30' : ''">
                <td class="py-1 px-2 font-semibold text-foreground font-mono">{{ (i / 10).toFixed(1) }}</td>
                <td v-for="(v, j) in row" :key="j" class="py-1 px-1.5 text-center font-mono text-foreground">{{ v.toFixed(4) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </details>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12">
      <summary class="cursor-pointer text-xl font-bold text-foreground select-none"><span class="text-primary mr-2">#</span>正态分布公式、FAQ 与参考</summary>
      <div class="mt-4">
        <h2 class="text-2xl font-bold text-foreground mb-4">正态分布计算器说明</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          正态分布 N(μ, σ²) 的概率密度 f(x) = exp(−(x−μ)²/(2σ²)) / (σ√(2π))，累积分布 Φ(z) 经误差函数
          erf(t) = (2/√π)∫₀ᵗ e^(−u²)du 计算：Φ(z) = (1 + erf(z/√2))/2。本页 erf 用 Maclaurin 级数（t 较小）
          与 DLMF 7.9 连分式（远尾）双段实现，双精度误差 ~1e-15；逆 CDF 对 erf 基 Φ 做二分定界 + 牛顿精化，
          95% 分位 z = 1.959963984 逐位复现。全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">公式汇总</h3>
        <div class="bg-muted/50 rounded-lg p-4 border border-border space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p><span class="font-mono text-foreground font-semibold">密度</span>：f(x) = exp(−(x−μ)²/(2σ²)) / (σ√(2π))</p>
          <p><span class="font-mono text-foreground font-semibold">标准化</span>：z = (X − μ)/σ ~ N(0,1)</p>
          <p><span class="font-mono text-foreground font-semibold">区间</span>：P(a≤X≤b) = Φ((b−μ)/σ) − Φ((a−μ)/σ)</p>
          <p><span class="font-mono text-foreground font-semibold">单尾</span>：P(X≤x) = Φ((x−μ)/σ)；P(X≥x) = 1 − Φ((x−μ)/σ)</p>
          <p><span class="font-mono text-foreground font-semibold">双尾</span>：P(|X−μ|≥d) = 2·(1 − Φ(d/σ))</p>
          <p><span class="font-mono text-foreground font-semibold">逆 CDF</span>：P(X≤x)=p → x = μ + σ·Φ⁻¹(p)，Φ⁻¹ 经逆 erf 牛顿精化</p>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">Z 表怎么查？</h3>
            <p class="text-sm text-muted-foreground mt-1">先标准化 z=(X−μ)/σ，再用「行 + 列」定位：z=1.96 → 行 1.9、列 0.06 → Φ=0.9750。反过来给概率找 z 用逆模式（本页已内置）。超过 3.9 的 z：Φ(4)≈0.9999683，再远的尾巴一般用 1−Φ 表或直接交给本页计算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">68-95-99.7 法则准吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">对正态分布是精确值的近似口诀：±1σ = 68.27%、±2σ = 95.45%、±3σ = 99.73%。它只对正态（或近似正态）成立；偏态或厚尾分布会明显偏离，切比雪夫不等式的 1−1/k² 是任何分布的兜底。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">IQ 130 超过多少人？</h3>
            <p class="text-sm text-muted-foreground mt-1">IQ 定义 μ=100、σ=15，z=(130−100)/15=2，P(X≥130)=1−Φ(2)=0.02275，即约超过 97.7% 的人、每 44 人约有 1 人。这就是「两个标准差」在真实量表上的含义。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">P(X≤x)=0.975 对应的 x 怎么求？</h3>
            <p class="text-sm text-muted-foreground mt-1">标准正态下 x = Φ⁻¹(0.975) = 1.959964（逆 erf 牛顿精化）；一般正态再乘 σ 加 μ。这正是 95% 置信区间临界值 1.96 的来历——与置信区间计算器联动使用。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。μ、σ 与概率全部在你的浏览器本地计算，不发送任何网络请求，输入数值不被存储或上传。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">参考来源</h3>
        <ul class="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Gauss, C. F. (1809) 正态误差律；Laplace 中心极限定理传统</li>
          <li>DLMF §7.2 / §7.9：误差函数 erf 级数与连分式表达</li>
          <li>Acklam, P. (2021). An algorithm for computing the inverse normal cumulative distribution function（逆 CDF 初值 + 牛顿精化）</li>
          <li>NIST/SEMATECH e-Handbook §1.3.6「Normal Distribution」</li>
        </ul>
      </div>
    </details>

    <RelatedTools :currentToolId="'normal-distribution-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Activity, Info, AlertTriangle, CheckCircle, Copy, BarChart } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// ---------- 高精度标准正态（erf 级数 + 连分式） ----------
function erfSeries(t) {
  const t2 = t * t
  let term = t
  let sum = t
  for (let n = 1; n < 300; n++) {
    term *= -t2 * (2 * n - 1) / (n * (2 * n + 1))
    sum += term
    if (Math.abs(term) < 1e-19 * (Math.abs(sum) + 1)) break
  }
  return sum * 1.1283791670955126 // 2/√π
}

function erfcCf(t) {
  const N = 300
  let f = 0
  for (let n = N; n >= 1; n--) {
    f = (n / 2) / (t + f)
  }
  return (Math.exp(-t * t) / Math.sqrt(Math.PI)) / (t + f)
}

function normSf(x) {
  if (!Number.isFinite(x)) return x > 0 ? 0 : (x < 0 ? 1 : 0.5)
  if (x < 0) return 1 - normSf(-x)
  const t = x / Math.SQRT2
  if (t < 2.6) return 0.5 * (1 - erfSeries(t))
  return 0.5 * erfcCf(t)
}

function normCdf(x) {
  return 1 - normSf(x)
}

function normPdf(x) {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
}

// 逆 CDF：对 erf 基 Φ 二分定界 + 牛顿精化
function normQuant(p) {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) return NaN
  const upper = p >= 0.5
  const tail = upper ? 1 - p : p
  let lo = 0
  let hi = 2
  while (normSf(hi) > tail && hi < 45) hi *= 2
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (normSf(mid) > tail) lo = mid
    else hi = mid
    if (hi - lo < 1e-13) break
  }
  let x = (lo + hi) / 2
  for (let i = 0; i < 3; i++) {
    const e = normSf(x) - tail
    const d = normPdf(x)
    if (d > 0) x -= e / d
  }
  return upper ? x : -x
}

// 一般正态 N(μ,σ) 的密度 / CDF / 上尾 / 逆 CDF
function pdfAt(x, mu, sigma) {
  return normPdf((x - mu) / sigma) / sigma
}
function cdfAt(x, mu, sigma) {
  return normCdf((x - mu) / sigma)
}
function sfAt(x, mu, sigma) {
  return normSf((x - mu) / sigma)
}
function quantileAt(p, mu, sigma) {
  return mu + sigma * normQuant(p)
}

// ---------- Z 表（0.0~3.9 步进 0.1，列 0.00~0.09） ----------
function buildZTable() {
  const rows = []
  for (let i = 0; i < 40; i++) {
    const row = []
    for (let j = 0; j < 10; j++) row.push(normCdf(i / 10 + j / 100))
    rows.push(row)
  }
  return rows
}
const Z_TABLE = buildZTable()

// ---------- 展示格式化 ----------
function fmtNum(v, d = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toFixed(d)
}

function fmtProb(p) {
  if (p === null || p === undefined || !Number.isFinite(p)) return '—'
  if (p < 1e-12) return p.toExponential(2)
  if (p > 1 - 1e-12) return '≈ 1'
  return p.toFixed(6)
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '正态分布计算器 - 区间/单尾/双尾概率与逆CDF、PDF曲线、Z表在线工具',
  description: '在线正态分布计算器：输入μ与σ算区间概率P(a≤X≤b)、单尾P(X≤x)/P(X≥x)、双尾P(|X−μ|≥d)与逆CDF分位数(逆erf牛顿精化)；PDF曲线SVG涂色可视化，原始值↔标准分z实时联动，附0.0~3.9完整Z表(erf精确计算)与68-95-99.7法则卡；Φ(1)=0.841345、z=1.959964等锚点双精度复现，纯浏览器本地计算。',
  keywords: '正态分布计算器,normal distribution,正态分布概率,z分数计算,正态分布查表,逆正态分布,标准正态分布表,68-95-99.7法则,正态分布曲线',
  author: '有条工具',
  ogTitle: '正态分布计算器 - 概率/分位数/PDF曲线/Z表 | 有条工具',
  ogDescription: '区间、单尾、双尾概率与逆 CDF，PDF 涂色可视化，完整 Z 表与 68-95-99.7 法则卡。',
  ogUrl: 'https://www.util.cn/tools/normal-distribution-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '正态分布计算器',
  twitterDescription: '正态分布概率、分位数、PDF 曲线与完整 Z 表。'
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
          name: '正态分布计算器',
          url: 'https://www.util.cn/tools/normal-distribution-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '区间概率 P(a≤X≤b)、单尾 P(X≤x)/P(X≥x)、双尾 P(|X−μ|≥d)',
            '逆 CDF：P(X≤x)=p 反解 x（逆 erf 牛顿精化，双精度）',
            'PDF 曲线 SVG 可视化，所求区间自动涂色',
            '原始值 ↔ 标准分 z = (X−μ)/σ 实时联动换算',
            '完整 Z 表 z=0.0~3.9 步进 0.1（Φ 值 erf 精确计算）',
            '68-95-99.7 法则精确值卡片（68.27%/95.45%/99.73%）',
            'IQ 量表等快捷示例，本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '正态分布计算器', item: 'https://www.util.cn/tools/normal-distribution-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Z 表怎么查？',
              acceptedAnswer: { '@type': 'Answer', text: '先标准化 z=(X−μ)/σ，再按「行+列」定位：z=1.96 → 行 1.9、列 0.06 → Φ=0.9750。给概率反查 z 用逆 CDF（本页逆模式）。' }
            },
            {
              '@type': 'Question',
              name: '68-95-99.7 法则准吗？',
              acceptedAnswer: { '@type': 'Answer', text: '对正态分布是精确值的近似口诀：±1σ=68.27%、±2σ=95.45%、±3σ=99.73%。只对正态或近似正态分布成立，偏态/厚尾分布会明显偏离。' }
            },
            {
              '@type': 'Question',
              name: 'IQ 130 超过多少人？',
              acceptedAnswer: { '@type': 'Answer', text: 'IQ 定义 μ=100、σ=15，z=2，P(X≥130)=1−Φ(2)=0.02275，约超过 97.7% 的人。' }
            },
            {
              '@type': 'Question',
              name: 'P(X≤x)=0.975 对应的 x 怎么求？',
              acceptedAnswer: { '@type': 'Answer', text: '标准正态 x=Φ⁻¹(0.975)=1.959964（逆 erf 牛顿精化）；一般正态再乘 σ 加 μ。这正是 95% 置信区间临界值 1.96 的来历。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'normal-distribution-calculator'
const SETTINGS_KEY = `${TOOL_ID}-settings`

const MODES = [
  { id: 'interval', label: '区间 P(a≤X≤b)' },
  { id: 'tail', label: '单尾 / 双尾' },
  { id: 'inverse', label: '逆 CDF 求 x' }
]

const P_ANCHORS = [
  { p: 0.9, hint: '(z=1.2816)' },
  { p: 0.95, hint: '(z=1.6449)' },
  { p: 0.975, hint: '(z=1.95996)' },
  { p: 0.995, hint: '(z=2.5758)' }
]

// SVG 布局常量
const W = 640
const H = 260
const PAD_L = 42
const PAD_R = 16
const PAD_T = 14
const BASE_Y = H - 30
const ZSPAN = 4 // 显示 μ±4σ

// ---------- 状态 ----------
const mode = ref('interval')
const mu = ref(0)
const sigma = ref(1)
const intervalA = ref(-1.96)
const intervalB = ref(1.96)
const tailKind = ref('right')
const tailX = ref(1.645)
const invP = ref(0.975)
const rawX = ref(1)

const validParams = computed(() => Number.isFinite(mu.value) && Number.isFinite(sigma.value) && sigma.value > 0)

const inputError = computed(() => {
  if (!Number.isFinite(mu.value) || !Number.isFinite(sigma.value)) return '请输入数值型的 μ 与 σ。'
  if (!(sigma.value > 0)) return '标准差 σ 必须大于 0。'
  if (mode.value === 'interval' && !(Number.isFinite(intervalA.value) && Number.isFinite(intervalB.value))) return '请输入区间下限 a 与上限 b。'
  if (mode.value === 'tail' && !Number.isFinite(tailX.value)) return '请输入临界值 x（双尾模式输入偏离距离 d）。'
  if (mode.value === 'inverse' && !(Number.isFinite(invP.value) && invP.value > 0 && invP.value < 1)) return '累积概率 p 需在 0 ~ 1 之间（不含边界）。'
  return ''
})

// ---------- 结果 ----------
const resultLabel = computed(() => {
  if (!validParams.value) return ''
  if (mode.value === 'interval') return `P(${fmtNum(intervalA.value, 4)} ≤ X ≤ ${fmtNum(intervalB.value, 4)})，X ~ N(${fmtNum(mu.value, 2)}, ${fmtNum(sigma.value, 2)}²)`
  if (mode.value === 'tail') {
    if (tailKind.value === 'left') return `P(X ≤ ${fmtNum(tailX.value, 4)})`
    if (tailKind.value === 'right') return `P(X ≥ ${fmtNum(tailX.value, 4)})`
    return `P(|X − μ| ≥ ${fmtNum(Math.abs(tailX.value), 4)})`
  }
  return `P(X ≤ x) = ${invP.value} 的分位数 x`
})

const resultMain = computed(() => {
  if (!validParams.value) return '—'
  if (mode.value === 'interval') return fmtProb(probInterval())
  if (mode.value === 'tail') return fmtProb(probTail())
  return fmtNum(quantileAt(invP.value, mu.value, sigma.value), 6)
})

const resultDetail = computed(() => {
  if (!validParams.value) return ''
  if (mode.value === 'interval') {
    const za = (intervalA.value - mu.value) / sigma.value
    const zb = (intervalB.value - mu.value) / sigma.value
    return `z_a = ${fmtNum(za, 4)}，z_b = ${fmtNum(zb, 4)}；P = Φ(${fmtNum(zb, 4)}) − Φ(${fmtNum(za, 4)}) = ${fmtProb(cdfAt(intervalB.value, mu.value, sigma.value))} − ${fmtProb(cdfAt(intervalA.value, mu.value, sigma.value))}`
  }
  if (mode.value === 'tail') {
    const z = (tailX.value - mu.value) / sigma.value
    if (tailKind.value === 'left') return `z = ${fmtNum(z, 4)}，P = Φ(z) = ${fmtProb(cdfAt(tailX.value, mu.value, sigma.value))}`
    if (tailKind.value === 'right') return `z = ${fmtNum(z, 4)}，P = 1 − Φ(z) = ${fmtProb(sfAt(tailX.value, mu.value, sigma.value))}`
    const d = Math.abs(tailX.value)
    return `d/σ = ${fmtNum(d / sigma.value, 4)}，P = 2·(1 − Φ(d/σ)) = ${fmtProb(2 * normSf(d / sigma.value))}`
  }
  const z = normQuant(invP.value)
  return `标准分 z = Φ⁻¹(p) = ${fmtNum(z, 6)}（逆 erf 牛顿精化），x = μ + σ·z`
})

function probInterval() {
  return cdfAt(intervalB.value, mu.value, sigma.value) - cdfAt(intervalA.value, mu.value, sigma.value)
}
function probTail() {
  const x = tailX.value
  if (tailKind.value === 'left') return cdfAt(x, mu.value, sigma.value)
  if (tailKind.value === 'right') return sfAt(x, mu.value, sigma.value)
  return 2 * normSf(Math.abs(x) / sigma.value)
}

// ---------- 标准分联动 ----------
const zLink = computed(() => {
  if (!validParams.value || !Number.isFinite(rawX.value)) return null
  const z = (rawX.value - mu.value) / sigma.value
  return { z, cdf: normCdf(z), sf: normSf(z) }
})

// ---------- 68-95-99-7 ----------
const rule1 = computed(() => fmtProb(cdfAt(1, mu.value, sigma.value) - cdfAt(-1, mu.value, sigma.value)))
const rule2 = computed(() => fmtProb(cdfAt(2, mu.value, sigma.value) - cdfAt(-2, mu.value, sigma.value)))
const rule3 = computed(() => fmtProb(cdfAt(3, mu.value, sigma.value) - cdfAt(-3, mu.value, sigma.value)))

// ---------- SVG 几何 ----------
const distRangeText = computed(() => validParams.value ? `μ ± ${ZSPAN}σ = [${fmtNum(mu.value - ZSPAN * sigma.value, 2)}, ${fmtNum(mu.value + ZSPAN * sigma.value, 2)}]` : '')

function xPix(x) {
  const lo = mu.value - ZSPAN * sigma.value
  const hi = mu.value + ZSPAN * sigma.value
  return PAD_L + (x - lo) / (hi - lo) * (W - PAD_L - PAD_R)
}
function yPix(x) {
  const ymax = normPdf(0) / sigma.value
  const y = pdfAt(x, mu.value, sigma.value)
  return PAD_T + (1 - y / ymax) * (BASE_Y - PAD_T)
}

const ticks = computed(() => {
  if (!validParams.value) return []
  const out = []
  for (let k = -ZSPAN; k <= ZSPAN; k += 2) {
    const x = mu.value + k * sigma.value
    out.push({ x: xPix(x), label: fmtNum(x, sigma.value >= 1 ? 1 : 2) })
  }
  return out
})

const curvePath = computed(() => {
  if (!validParams.value) return ''
  const lo = mu.value - ZSPAN * sigma.value
  const hi = mu.value + ZSPAN * sigma.value
  const steps = 160
  const parts = []
  for (let i = 0; i <= steps; i++) {
    const x = lo + (hi - lo) * i / steps
    parts.push(`${i === 0 ? 'M' : 'L'} ${xPix(x).toFixed(2)},${yPix(x).toFixed(2)}`)
  }
  return parts.join(' ')
})

// 涂色区间（裁剪到显示范围）
function shadedPoly(x1, x2) {
  const lo = mu.value - ZSPAN * sigma.value
  const hi = mu.value + ZSPAN * sigma.value
  const a = Math.max(x1, lo)
  const b = Math.min(x2, hi)
  if (!(b > a)) return ''
  const steps = 80
  const parts = [`M ${xPix(a).toFixed(2)},${BASE_Y}`]
  for (let i = 0; i <= steps; i++) {
    const x = a + (b - a) * i / steps
    parts.push(`L ${xPix(x).toFixed(2)},${yPix(x).toFixed(2)}`)
  }
  parts.push(`L ${xPix(b).toFixed(2)},${BASE_Y}`, 'Z')
  return parts.join(' ')
}

const shadedPolys = computed(() => {
  if (!validParams.value) return []
  if (mode.value === 'interval') return [shadedPoly(intervalA.value, intervalB.value)]
  if (mode.value === 'tail') {
    if (tailKind.value === 'left') return [shadedPoly(mu.value - ZSPAN * sigma.value, tailX.value)]
    if (tailKind.value === 'right') return [shadedPoly(tailX.value, mu.value + ZSPAN * sigma.value)]
    const d = Math.abs(tailX.value)
    return [shadedPoly(mu.value - ZSPAN * sigma.value, mu.value - d), shadedPoly(mu.value + d, mu.value + ZSPAN * sigma.value)]
  }
  return [shadedPoly(mu.value - ZSPAN * sigma.value, quantileAt(invP.value, mu.value, sigma.value))]
})

// ---------- 交互 ----------
function loadIqExample() {
  mu.value = 100
  sigma.value = 15
  intervalA.value = 85
  intervalB.value = 130
  tailKind.value = 'right'
  tailX.value = 130
  invP.value = 0.975
  rawX.value = 130
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

async function copyResult() {
  const text = `${resultLabel.value} = ${resultMain.value}（${resultDetail.value}）`
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    alert('复制失败：浏览器未授权剪贴板，请手动选择结果复制。')
  }
}

// ---------- 设置持久化（localStorage 仅 onMounted / 用户交互回调触达，SSR 安全） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (MODES.some((m) => m.id === s.mode)) mode.value = s.mode
    if (Number.isFinite(s.mu)) mu.value = s.mu
    if (Number.isFinite(s.sigma) && s.sigma > 0) sigma.value = s.sigma
    if (Number.isFinite(s.rawX)) rawX.value = s.rawX
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, mu, sigma, rawX], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode: mode.value, mu: mu.value, sigma: sigma.value, rawX: rawX.value }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
