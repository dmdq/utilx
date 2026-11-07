<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BatteryCharging class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">锂电池充电时间计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">CC-CV 分段充电时间估算：0-80% 恒流快充段 + 尾段恒压减速，充电倍率与效率设定</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线锂电池充电时间计算器：按 CC-CV（恒流转恒压）标准充电策略分段估算——恒流段按电荷守恒 t=ΔS·C/(I·η)，
        恒压段按电流指数衰减经验模型（τ=30min 量级，各厂策略不同）。输入容量、充电电流（或倍率 C）、当前电量与目标电量，
        输出总时间 + CC/CV 分段占比条 + 0-80% 快充档对照。结果为估算值，受充电器策略、电池温度与老化影响，请以设备实际表现为准。
      </p>
    </div>

    <!-- 安全提示条 -->
    <div class="bg-amber-500/10 border border-amber-500/25 rounded-lg p-4 mb-6 flex items-start gap-3">
      <TriangleAlert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-foreground font-medium leading-relaxed">
        估算口径提示：本页为数学模型估算（能量效率默认 90%，CC→CV 转折点默认 80%），真实充电器的 CC-CV 策略、涓流预充、温度补偿各不相同；
        充电请使用原装或合规充电器，勿长期用超过电池规格的倍率充电。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <BatteryCharging class="w-5 h-5 mr-2 text-primary" /> 输入参数
        </h2>

        <div>
          <label class="text-sm font-medium text-foreground block mb-1.5">电池容量（mAh）</label>
          <input v-model.number="capacityMah" type="number" step="100" min="100"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <div>
          <label class="text-sm font-medium text-foreground block mb-1.5">充电器输出</label>
          <div class="flex gap-2">
            <select v-model="rateMode" class="w-28 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="ma">电流 mA</option>
              <option value="c">倍率 C</option>
            </select>
            <input v-model.number="rateValue" type="number" step="100" min="0"
              class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <p class="text-[11px] text-muted-foreground mt-1">
            等效充电电流 <span class="font-mono text-foreground">{{ effCurrentMa }} mA</span> ≈
            <span class="font-mono text-foreground">{{ effRate }}C</span>
            <span v-if="rateWarn" class="text-amber-600 ml-1">（超出常规充电倍率，确认电池规格支持）</span>
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-muted-foreground block mb-1">当前电量 %</label>
            <input v-model.number="socStart" type="number" min="0" max="100" step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1">目标电量 %</label>
            <input v-model.number="socTarget" type="number" min="0" max="100" step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-foreground">充电能量效率 η</label>
            <span class="text-sm font-bold text-primary font-mono">{{ effPct }}%</span>
          </div>
          <input v-model.number="effPct" type="range" min="70" max="98" step="1" class="w-full accent-[var(--primary,#2563eb)]" />
          <p class="text-[11px] text-muted-foreground">锂电充电能量效率常用区间 85–95%，默认取 90%。</p>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-foreground">恒流转恒压点</label>
            <span class="text-sm font-bold text-primary font-mono">{{ ccPointPct }}% SoC</span>
          </div>
          <input v-model.number="ccPointPct" type="range" min="50" max="95" step="1" class="w-full accent-[var(--primary,#2563eb)]" />
          <p class="text-[11px] text-muted-foreground">CC-CV 转折点常见 70–80%（默认 80%）；低倍率（≤0.3C）充电时转折点通常更早，可适当调低。</p>
        </div>
      </div>

      <!-- 中右：结果 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Timer class="w-5 h-5 mr-2 text-primary" /> 充电时间估算
        </h2>

        <template v-if="result">
          <!-- 总时间大数字 -->
          <div class="bg-primary/5 rounded-xl p-6 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ socStartClamped }}% → {{ socTargetClamped }}% 预计充电时间</p>
            <p class="text-6xl font-mono font-bold tabular-nums text-primary">{{ result.totalText }}</p>
            <p class="text-[11px] text-muted-foreground mt-2">CC-CV 分段经验模型 · 实际时间受充电器策略/温度/电池老化影响</p>
          </div>

          <!-- 分段占比条 -->
          <div v-if="result.totalHours > 0">
            <p class="text-sm font-medium text-foreground mb-2">分段时长占比</p>
            <div class="w-full h-6 rounded-lg overflow-hidden flex border border-border">
              <div
                class="bg-primary flex items-center justify-center text-[11px] text-primary-foreground font-mono"
                :style="{ width: (result.ccHours / result.totalHours * 100) + '%' }"
              >CC {{ fmtMinutes(result.ccHours) }}</div>
              <div
                v-if="result.cvHours > 0"
                class="bg-amber-500 flex items-center justify-center text-[11px] text-white font-mono"
                :style="{ width: (result.cvHours / result.totalHours * 100) + '%' }"
              >CV {{ fmtMinutes(result.cvHours) }}</div>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
              CC 恒流段：电流恒定（{{ effCurrentMa }} mA）按电荷守恒线性推进；{{ result.cvHours > 0 ? `CV 恒压段（${ccPointPctPct}% 后）：电压恒定、电流指数衰减（τ=30min 经验值），越接近满电越慢。` : '目标未越过恒流转恒压点，全程恒流。' }}
            </p>
          </div>

          <!-- 对照：0-80% 快充档 -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">同倍率 0 → {{ ccPointPctPct }}%（快充档）</p>
              <p class="text-2xl font-mono font-bold text-foreground">{{ result.fastText }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">尾段（CV）额外耗时</p>
              <p class="text-2xl font-mono font-bold text-amber-600">{{ result.cvHours > 0 ? fmtMinutes(result.cvHours) : '—' }}</p>
            </div>
          </div>

          <p v-if="result.impossible" class="text-xs text-amber-600 leading-relaxed">
            提示：按 τ=30min 的 CV 衰减模型，当前倍率与效率下无法在 CV 段补入目标电量（模型不收敛）。
            通常意味着实际充电器会延后转恒压点或延长 CV 时间——请调低恒流转恒压点或把结果视为下限。
          </p>

          <!-- 涓流维持说明 -->
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="text-sm font-semibold text-foreground mb-1">充满后为什么还会「涓流维持」？</p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              锂电池充满后自放电会让电压缓降，充电器会周期性补入微小电流把电压顶回 4.20V/cell（ iPhone 与多数设备插电显示 100% 后仍在涓流维持）。
              长期插电会让电池长时间停在满电高电压状态，加速老化；设备自带的「优化充电/80% 上限」就是为此设计——不赶时间时建议开启。
            </p>
          </div>
        </template>

        <p v-else class="text-xs text-muted-foreground">请检查容量与电流输入（目标电量需大于当前电量）。</p>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 open:pb-8">
      <summary class="text-lg font-semibold text-foreground cursor-pointer select-none flex items-center">
        <Info class="w-5 h-5 mr-2 text-primary" /> 为什么最后 20% 慢、C 倍率是什么（点击展开：模型、公式、FAQ 与来源）
      </summary>

      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">充电时间模型与公式（锚点算例）</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>CC 恒流段：t = ΔS% × 容量 ÷（电流 × η）。锚点：3000mAh、1C（3000mA）、η=90%、20%→80%：t = 0.6×3000/(3000×0.9) = 0.6667h = 40 分钟；0.5C 同容量为 80 分钟。</li>
            <li>CV 恒压段（经验模型）：电流按 I(t) = I_CC·e^(−t/τ) 指数衰减（τ=30min 量级），由电荷平衡解出 t_CV = −τ·ln(1 − ΔS·C/(100·η·I_CC·τ))。锚点：同电池 20%→100%，CV 段约 17.6 分钟，总计 ≈ 57.6 分钟。各厂 CV 策略（截止电流 C/10~C/20）不同，本段为估算。</li>
            <li>0→80% 快充档对照：t = 0.8×3000/(3000×0.9) ≈ 53 分钟——这是日常「急用快充」的常用口径。</li>
            <li>诚实标注：CV 段为经验模型，各厂策略不同；结果为估算，不作工程/安全依据。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">为什么最后 20% 充得慢</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            锂电池充电电压随电量升高而升高，恒流段里电池电压接近 4.20V/cell 上限时（常见在 70–80% SoC），若继续恒流大电流会过充析锂、损伤甚至危险；
            充电器此时切到恒压模式：维持 4.20V 不变，让电流自然衰减（指数式），尾段只能「慢工出细活」。所以厂商宣传的「30 分钟充到 50%/80%」都是恒流段口径，从 80% 到 100% 往往还要一倍以上的时间。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">C 倍率是什么意思</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            C 倍率是「以多大电流相对容量充电/放电」的无量纲口径：1C 表示 1 小时充满/放光标称容量（3000mAh 电池 1C = 3000mA），
            0.5C = 1500mA，2C = 6000mA。普通 18650/手机电芯持续充电规格多在 0.5–1C，高倍率电芯（航模/动力）可到 3–5C；
            倍率越高发热越大、可用容量越低、寿命衰减越快，务必按电池规格充电。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">效率 90% 是怎么来的？</h4>
              <p class="text-sm text-muted-foreground mt-1">锂电充电能量效率常用区间为 85–95%：恒流段损失主要是内阻发热与极化，恒压段电流小但效率略降。默认取区间中值 90%，可按充电器发热情况上下调整（发热大调低）。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">为什么转恒压点设为 80%？</h4>
              <p class="text-sm text-muted-foreground mt-1">CC-CV 转折点常见口径在 70–80% SoC（取决于倍率与内阻）：大倍率充电转折点更早（CC 段更短），小倍率更晚。默认取 80%，滑杆可调；0.5C 以下充电时建议调到 70% 附近。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">结果为什么和手机显示的充电时间不一样？</h4>
              <p class="text-sm text-muted-foreground mt-1">真实充电器有涓流预充（深度放电后）、分段限流（先 18W 后 5W）、温控降功率与厂商私有快充协议，都会改变曲线；本页模型是标准 CC-CV 理想口径，适合横向比较不同倍率/容量组合，不是秒级预报。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">想算电池组串联并联的容量电压怎么办？</h4>
              <p class="text-sm text-muted-foreground mt-1">用站内的 <a href="/tools/battery-pack-calculator/" class="text-primary hover:underline">电池串联并联计算器</a> 先算出组的总容量与电压，再回到本页按组容量估充电时间；两者配合可以覆盖「组 13S4P 用多大充电器、充多久」这类问题。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源（两源交叉核对）</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>CC-CV 两段策略与转折点 60–80%：充电行业科普（Elinta Charge 术语表、stchargers CC/CV 说明）与电池教材口径一致，本页默认取 80% 并注明可调。</li>
            <li>充电能量效率 85–95%：锂电充放电能量效率文献通用区间（恒流段效率高、恒压段下降），本页默认 90% 并注明区间。</li>
            <li>CV 段指数衰减为经验模型（τ=30min 量级）：与主流充电器尾段电流衰减趋势一致的估算口径，页面已诚实标注「各厂策略不同」。</li>
          </ul>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'lithium-charge-time'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { BatteryCharging, TriangleAlert, Info, Timer } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '锂电池充电时间计算器 - CC-CV 分段快充时间估算 | 有条工具',
  description: '在线锂电池充电时间计算器：按 CC-CV 策略分段估算充电时间，恒流段电荷守恒公式 + 恒压段指数衰减经验模型，输入容量/充电电流或倍率C/当前与目标电量/效率，输出总时间与 CC/CV 分段占比、0-80% 快充档对照。',
  keywords: '锂电池充电时间,充电时间计算,CC-CV充电,充电倍率C,电池快充时间',
  author: '有条工具',
  ogTitle: '锂电池充电时间计算器 - CC-CV 分段快充时间估算 | 有条工具',
  ogDescription: 'CC-CV 分段充电时间估算：0-80% 恒流快充段+尾段恒压减速，充电倍率与效率设定。',
  ogUrl: 'https://www.util.cn/tools/lithium-charge-time',
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
          name: '锂电池充电时间计算器',
          url: 'https://www.util.cn/tools/lithium-charge-time',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'CC 恒流段电荷守恒公式（含效率 η）',
            'CV 恒压段指数衰减经验模型（τ=30min 量级）',
            '总时间 + CC/CV 分段占比条',
            '0-80% 快充档对照',
            '电流 mA / 倍率 C 双模式输入',
            '效率与 CC-CV 转折点可调（注明口径）',
            '涓流维持说明'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '锂电池充电时间计算器', item: 'https://www.util.cn/tools/lithium-charge-time' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么最后 20% 充得慢？',
              acceptedAnswer: { '@type': 'Answer', text: '电池电压接近 4.20V/cell 上限时（常见 70-80% SoC）充电器切入恒压模式，电流指数衰减，越接近满电越慢；厂商宣传的快充时间都是恒流段口径。' }
            },
            {
              '@type': 'Question',
              name: 'C 倍率是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: 'C 倍率是相对容量的电流口径：1C = 1 小时充满标称容量，3000mAh 电池 1C=3000mA、0.5C=1500mA。普通电芯持续充电规格多在 0.5-1C，倍率越高发热越大、衰减越快。' }
            },
            {
              '@type': 'Question',
              name: '结果为什么和手机显示的不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '真实充电器有涓流预充、分段限流、温控降功率与私有快充协议；本页是标准 CC-CV 理想口径的估算模型，适合横向比较，不是秒级预报。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数区（node 可独立单测） ----------
const TAU_MIN = 30   // CV 段电流衰减时间常数（经验值，30min 量级）

function clamp(v, min, max) {
  const n = Number(v)
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

// CC 恒流段时间（小时）：ΔS% × 容量 /（电流 × 效率）
function ccHoursFor(deltaSoc, capacityMah, currentMa, eff) {
  if (deltaSoc <= 0 || !(capacityMah > 0) || !(currentMa > 0) || !(eff > 0)) return 0
  return (deltaSoc / 100) * capacityMah / (currentMa * eff)
}

// CV 恒压段（小时）：电流 I(t)=Icc·e^(−t/τ) 指数衰减，电荷平衡解出
//   t_CV = −τ·ln(1 − ΔS·C/(100·η·Icc·τ))
function cvHoursFor(deltaSoc, capacityMah, currentMa, eff, tauMin = TAU_MIN) {
  if (deltaSoc <= 0 || !(capacityMah > 0) || !(currentMa > 0) || !(eff > 0)) return 0
  const tauH = tauMin / 60
  const qCv = (deltaSoc / 100) * capacityMah / eff      // CV 段需补入电荷（mAh）
  const qCap = currentMa * tauH                          // τ 内恒流等效电荷（mAh）
  if (qCv >= qCap) return Infinity                      // 模型不收敛
  return -tauH * Math.log(1 - qCv / qCap)
}

// 分段总估算：返回 CC/CV 小时数、总计与快充档对照
function chargeTimeSegments(capacityMah, currentMa, socStart, socTarget, eff, ccPoint, tauMin = TAU_MIN) {
  const C = Number(capacityMah)
  const I = Number(currentMa)
  const eta = clamp(eff, 0.3, 1)
  const s0 = clamp(socStart, 0, 100)
  const s1 = clamp(socTarget, 0, 100)
  const ccP = clamp(ccPoint, 1, 100)
  if (!(C > 0) || !(I > 0) || s1 <= s0) {
    return { valid: false, ccHours: 0, cvHours: 0, totalHours: 0, fastHours: 0, impossible: false }
  }
  // CC 段：起点到 min(target, 转折点)
  const ccSocStart = s0
  const ccSocEnd = Math.min(s1, ccP)
  const ccH = ccHoursFor(ccSocEnd - ccSocStart, C, I, eta)
  // CV 段：仅当目标越过转折点
  let cvH = 0
  if (s1 > ccP) {
    const cvStart = Math.max(s0, ccP)
    cvH = cvHoursFor(s1 - cvStart, C, I, eta, tauMin)
  }
  // 快充档对照：0 → 转折点（全程 CC 口径）
  const fastH = ccHoursFor(Math.min(ccP, 100), C, I, eta)
  return {
    valid: true,
    ccHours: ccH,
    cvHours: Number.isFinite(cvH) ? cvH : 0,
    cvImpossible: !Number.isFinite(cvH),
    totalHours: ccH + (Number.isFinite(cvH) ? cvH : 0),
    fastHours: fastH,
    impossible: !Number.isFinite(cvH)
  }
}

// 小时 → 「X 分 / X 小时 Y 分」
function fmtHours(h) {
  if (!Number.isFinite(h)) return '—'
  const totalMin = Math.round(h * 60)
  if (totalMin < 60) return `${totalMin} 分钟`
  const hh = Math.floor(totalMin / 60)
  const mm = totalMin % 60
  return mm === 0 ? `${hh} 小时` : `${hh} 小时 ${mm} 分`
}
function fmtMinutes(h) {
  if (!Number.isFinite(h) || h <= 0) return '—'
  return `${Math.max(1, Math.round(h * 60))} 分`
}

// ---------- 状态 ----------
const capacityMah = ref(3000)
const rateMode = ref('ma')          // ma | c
const rateValue = ref(3000)
const socStart = ref(20)
const socTarget = ref(80)
const effPct = ref(90)
const ccPointPct = ref(80)

// ---------- 计算属性 ----------
const effCurrentMa = computed(() => {
  if (rateMode.value === 'c') {
    const c = Number(rateValue.value)
    if (!Number.isFinite(c) || c <= 0 || !(capacityMah.value > 0)) return 0
    return Math.round(c * capacityMah.value)
  }
  const ma = Number(rateValue.value)
  return Number.isFinite(ma) && ma > 0 ? ma : 0
})
const effRate = computed(() => {
  if (!(capacityMah.value > 0) || !(effCurrentMa.value > 0)) return '—'
  return (effCurrentMa.value / capacityMah.value).toFixed(2)
})
const rateWarn = computed(() => {
  const r = Number(effRate.value)
  return Number.isFinite(r) && r > 2
})
const socStartClamped = computed(() => clamp(socStart.value, 0, 100))
const socTargetClamped = computed(() => clamp(socTarget.value, 0, 100))
const ccPointPctPct = computed(() => clamp(ccPointPct.value, 1, 100))

const result = computed(() => {
  const seg = chargeTimeSegments(capacityMah.value, effCurrentMa.value, socStart.value, socTarget.value, effPct.value / 100, ccPointPct.value)
  if (!seg.valid) return null
  return {
    ...seg,
    totalText: fmtHours(seg.totalHours),
    fastText: fmtHours(seg.fastHours)
  }
})

onMounted(() => {
  addRecentTool('lithium-charge-time')
})
</script>
