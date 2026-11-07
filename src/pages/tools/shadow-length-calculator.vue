<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sun class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">太阳高度角影子计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">日期 + 时刻 + 城市 → 太阳高度角 / 方位角与影子长度（NOAA 算法），附日出日落时刻、黄金时刻提示与太阳轨迹示意图</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线太阳影子计算器：想拍照避开影子、盖房算日照间距、户外活动看太阳位置——输入日期时刻与城市（北京/上海/广州/成都预设，支持自定义经纬度），
        按 NOAA 太阳位置算法（儒略日 → 太阳赤纬 + 均时差 → 时角）算出太阳高度角与方位角，影子长度 = 物体高度 ÷ tan(高度角)：
        北京冬至正午太阳高度角约 26.7°，1.7m 的人影长约 3.4m；高度角 45° 时影长恰好等于身高。
        同页给出当日日出 / 太阳正午 / 日落时刻、影子方位（太阳方位 + 180°）、黄金时刻区间提示（高度角 −4°~6°，摄影界常用口径）与太阳轨迹弧线示意图。
        时区统一按东八区（UTC+8），全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Compass class="w-5 h-5 mr-2 text-primary" /> 位置与时间
        </h2>

        <!-- 城市预设 -->
        <div>
          <label for="sl-city" class="block text-sm font-medium text-foreground mb-1.5">城市（内置预设，可改经纬度）</label>
          <select
            id="sl-city"
            v-model="cityId"
            class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            @change="applyCity"
          >
            <option v-for="c in CITIES" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </div>

        <!-- 经纬度 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="sl-lat" class="block text-sm font-medium text-foreground mb-1.5">纬度（°，北正南负）</label>
            <input id="sl-lat" v-model.number="lat" type="number" min="-90" max="90" step="0.01" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40">
          </div>
          <div>
            <label for="sl-lon" class="block text-sm font-medium text-foreground mb-1.5">经度（°，东正西负）</label>
            <input id="sl-lon" v-model.number="lon" type="number" min="-180" max="180" step="0.01" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40">
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground -mt-2">时刻按东八区（UTC+8）口径计算；国外坐标请自行换算成北京时间，或按当地时间估算（每差 1 小时约 15° 经度）。</p>

        <!-- 日期时刻 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="sl-date" class="block text-sm font-medium text-foreground mb-1.5">日期</label>
            <input id="sl-date" v-model="dateStr" type="date" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
          </div>
          <div>
            <label for="sl-time" class="block text-sm font-medium text-foreground mb-1.5">时刻（北京时间）</label>
            <input id="sl-time" v-model="timeStr" type="time" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
          </div>
        </div>

        <!-- 快捷时刻 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">快捷时刻</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="q in QUICK_TIMES" :key="q.id"
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="timeStr === q.time ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="applyQuick(q)"
            >{{ q.label }}</button>
          </div>
        </div>

        <!-- 物体高度 -->
        <div>
          <label for="sl-h" class="block text-sm font-medium text-foreground mb-1.5">物体高度（m）</label>
          <div class="flex items-center gap-2">
            <input id="sl-h" v-model.number="objHeight" type="number" min="0.1" max="500" step="0.1" class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono w-28 focus:outline-none focus:ring-2 focus:ring-primary/40">
            <span class="text-xs text-muted-foreground">常见：人 1.7 / 一层楼 3 / 电线杆 8 / 旗杆 12</span>
          </div>
        </div>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>

        <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult">
          <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制太阳与影子数据
        </button>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center justify-between">
            <span class="flex items-center"><Sun class="w-5 h-5 mr-2 text-primary" /> 太阳位置与影子</span>
            <span v-if="result" class="px-2.5 py-1 rounded-full text-[11px] font-semibold border" :class="phaseBadgeClass">{{ phaseBadgeText }}</span>
          </h2>
          <div v-if="result" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">太阳高度角</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ result.altText }}°</p>
                <p class="text-[11px] text-muted-foreground mt-1">{{ result.altHint }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">太阳方位角（罗盘）</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.azText }}°</p>
                <p class="text-[11px] text-muted-foreground mt-1">{{ result.azName }}（从正北顺时针）</p>
              </div>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-xs text-muted-foreground mb-1">影子长度（物体高 {{ heightText }}m）</p>
              <template v-if="result.shadow">
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.shadow.text }} <span class="text-sm font-normal text-muted-foreground">m</span></p>
                <p class="text-[11px] text-muted-foreground mt-1 font-mono">{{ heightText }} ÷ tan({{ result.altText }}°)；影子方位 {{ result.shadowAzText }}°（{{ result.shadowAzName }}，太阳方位 +180°）</p>
              </template>
              <p v-else class="text-xl font-semibold text-muted-foreground mt-1">太阳在地平线以下，无影</p>
            </div>
            <!-- 时刻表 -->
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="bg-muted/50 rounded-xl p-3">
                <p class="text-[11px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><Sunrise class="w-3.5 h-3.5" /> 日出</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ result.riseText }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-3">
                <p class="text-[11px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><Clock class="w-3.5 h-3.5" /> 太阳正午</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ result.noonText }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-3">
                <p class="text-[11px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><Sunset class="w-3.5 h-3.5" /> 日落</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ result.setText }}</p>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">日出日落按太阳中心过地平线下 0.833°（折射 + 视半径的通行口径）计算；高度角 / 方位角与 NOAA 官方计算器对齐（含均时差修正，典型偏差 &lt;0.1°）。</p>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">请选择有效的日期、时刻与经纬度</p>
        </div>

        <!-- SVG 示意图 -->
        <div v-if="svg" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-2">
            <Compass class="w-5 h-5 mr-2 text-primary" /> 太阳轨迹示意（东升西落侧视）
          </h2>
          <svg viewBox="0 0 420 220" class="w-full" role="img" aria-label="太阳轨迹与影子示意图">
            <!-- 天空底 -->
            <rect x="0" y="0" width="420" height="220" class="fill-muted/30" rx="8" />
            <!-- 地平线 -->
            <line x1="20" y1="180" x2="400" y2="180" class="stroke-border" stroke-width="2" />
            <!-- 太阳轨迹弧 -->
            <path :d="svg.arcPath" fill="none" class="stroke-primary/50" stroke-width="2" stroke-dasharray="6 5" />
            <!-- 当前太阳 -->
            <g v-if="svg.sunVisible">
              <circle :cx="svg.sunX" :cy="svg.sunY" r="9" class="fill-amber-400" />
              <circle :cx="svg.sunX" :cy="svg.sunY" r="14" class="stroke-amber-400/60" fill="none" stroke-width="1.5" />
            </g>
            <!-- 杆与其影子 -->
            <line x1="210" y1="180" x2="210" y2="138" class="stroke-foreground" stroke-width="4" stroke-linecap="round" />
            <line v-if="svg.shadowVisible" :x1="210" :y1="180" :x2="svg.shadowX2" :y2="180" class="stroke-foreground/60" stroke-width="3" stroke-linecap="round" />
            <text x="30" y="196" class="fill-muted-foreground" font-size="11">东</text>
            <text x="386" y="196" class="fill-muted-foreground" font-size="11">西</text>
            <text x="212" y="132" class="fill-muted-foreground" font-size="10">{{ heightText }}m 杆</text>
            <text v-if="svg.shadowVisible" :x="svg.shadowLabelX" y="172" class="fill-muted-foreground" font-size="10">影子</text>
            <text v-if="svg.sunVisible" :x="svg.sunX - 12" :y="svg.sunY - 18" class="fill-amber-500" font-size="11" font-weight="600">{{ svg.altText }}°</text>
          </svg>
          <p class="text-[11px] text-muted-foreground mt-1">示意图按当日太阳轨迹简化投影，影子线方向按太阳方位取东西分量（太阳在南时影子朝向观察者）；长度以计算结果为准。</p>
        </div>
      </div>
    </div>

    <!-- 可折叠 SEO 区：FAQ + 公式 + 来源 -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6" open>
      <summary class="text-base font-semibold text-foreground cursor-pointer select-none mb-4">计算公式、算法来源与常见问题</summary>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-1.5">核心公式（NOAA 太阳位置算法）</h3>
          <ul class="text-sm text-muted-foreground space-y-1 leading-relaxed list-disc list-inside font-mono text-[13px]">
            <li>儒略日 JD → 儒略世纪数 T =（JD − 2451545）/ 36525</li>
            <li>太阳赤纬 δ = asin( sin ε · sin λ )，ε 为黄赤交角、λ 为太阳视黄经（含地心黄经级数与章动近似项）</li>
            <li>均时差 EqT = 4·( y·sin2L₀ − 2e·sinM + 4ey·sinM·cos2L₀ − 0.5y²·sin4L₀ − 1.25e²·sin2M )（分钟）</li>
            <li>真太阳时 = 北京时刻 + EqT + 4·经度 − 480（分钟）；时角 H = 真太阳时/4 − 180°</li>
            <li>高度角 alt = asin( sinφ·sinδ + cosφ·cosδ·cosH )</li>
            <li>方位角 az（正北顺时针）= atan2( −cosδ·sinH, cosφ·sinδ − sinφ·cosδ·cosH )</li>
            <li>影子长度 = 物体高度 ÷ tan(alt)；影子方位 = 太阳方位 + 180°</li>
            <li>日出日落：cos H₀ = cos(90.833°)/(cosφ·cosδ) − tanφ·tanδ</li>
          </ul>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground mb-1.5">算法来源与精度说明</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            本页采用 NOAA（美国国家海洋和大气管理局）Global Monitoring Laboratory 公布的太阳位置算法（基于 Jean Meeus《Astronomical Algorithms》的截断级数，
            见 NOAA Solar Calculator / General Solar Position Calculations 说明页）：含太阳赤纬级数、均时差与视黄经修正，与 NOAA 官方在线计算器结果典型偏差在 0.1° 以内。
            时区统一按东八区（UTC+8）；国外经纬度请换算时区后使用。黄金时刻按摄影界通行口径取高度角 −4° ~ 6° 区间（晨昏光比正午暖，
            不同摄影流派对区间端点略有出入），日照间距等工程应用请以现行标准（如 GB 50180 建筑日照标准）与专业软件为准。
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

    <RelatedTools :currentToolId="'shadow-length-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Sun, Compass, Copy, TriangleAlert, Sunrise, Sunset, Clock } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '太阳高度角影子计算器 - 影子长度/方位角/日出日落时刻 | 有条工具',
  description: '免费在线太阳影子计算器：按 NOAA 算法由日期时刻与城市（北京/上海/广州/成都预设+自定义经纬度）计算太阳高度角、方位角、影子长度 = 高度÷tan(高度角)与影子方位，附当日日出/太阳正午/日落时刻表、黄金时刻（-4°~6°）提示与太阳轨迹示意图，东八区口径，纯浏览器本地计算不上传',
  keywords: '太阳高度角计算,影子长度计算,太阳方位角,日出日落时间,黄金时刻,NOAA太阳位置,日照间距',
  author: '有条工具',
  ogTitle: '太阳高度角影子计算器 - 影子长度/方位角/日出日落时刻 | 有条工具',
  ogDescription: '输入日期、时刻与城市，NOAA 算法即时算太阳高度角、方位角与影子长度，附日出日落时刻与黄金时刻提示。',
  ogUrl: 'https://www.util.cn/tools/shadow-length-calculator',
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
          name: '太阳高度角影子计算器',
          url: 'https://www.util.cn/tools/shadow-length-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'NOAA 太阳位置算法（赤纬+均时差+时角）',
            '太阳高度角与方位角（罗盘方位名）',
            '影子长度 = 高度 ÷ tan(高度角) 与影子方位',
            '北京/上海/广州/成都预设与自定义经纬度',
            '当日日出/太阳正午/日落时刻表',
            '黄金时刻（高度角 -4°~6°）提示',
            '太阳轨迹弧线 SVG 示意图',
            '东八区 UTC+8 口径，本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '太阳高度角影子计算器', item: 'https://www.util.cn/tools/shadow-length-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '影子长度怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '影子长度 = 物体高度 ÷ tan(太阳高度角)。例如太阳高度角 45° 时影长恰好等于物体高度；1.7m 的人在高度角 30° 时影长约 2.94m。太阳高度角 ≤0 时无影。' }
            },
            {
              '@type': 'Question',
              name: '北京冬至正午太阳高度角是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '约 26.6°。冬至太阳直射南回归线（赤纬约 -23.44°），北京纬度 39.9°，正午高度角 = 90° − 39.9° − 23.44° ≈ 26.6°，此时 1.7m 的人影长约 3.4m。' }
            },
            {
              '@type': 'Question',
              name: '黄金时刻是什么时间段？',
              acceptedAnswer: { '@type': 'Answer', text: '摄影界通行口径：太阳高度角在 -4° ~ 6° 之间的时段（日出后与日落前约 20~40 分钟，随纬度季节变化），光线暖、角度低、影子长，是人像与风光摄影的黄金光线。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// PURE-LOGIC-START
const RAD = Math.PI / 180

function clampNum(v, lo, hi) {
  const n = Number(v)
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

// 格里历 → 儒略日（dayFrac 为该日 UTC 小时/24）
function julianDay(y, mo, dayFrac) {
  let Y = Math.floor(y)
  let M = Math.floor(mo)
  if (M <= 2) { Y -= 1; M += 12 }
  const A = Math.floor(Y / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + dayFrac + B - 1524.5
}

// NOAA/Meeus 太阳赤纬与均时差（jd 为儒略日；返回 {declRad, eqtMin}）
function calcSolar(jd) {
  const T = (jd - 2451545) / 36525
  const L0 = (280.46646 + T * (36000.76983 + 0.0003032 * T)) % 360
  const M = (357.52911 + T * (35999.05029 - 0.0001537 * T)) * RAD
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
  const C =
    Math.sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M) * 0.000289
  const trueLong = L0 + C
  const omega = (125.04 - 1934.136 * T) * RAD
  const lambda = (trueLong - 0.00569 - 0.00478 * Math.sin(omega)) * RAD
  const seconds = 21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))
  const e0 = 23 + (26 + seconds / 60) / 60
  const eps = (e0 + 0.00256 * Math.cos(omega)) * RAD
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda))
  const y = Math.tan(eps / 2) * Math.tan(eps / 2)
  const eqt =
    4 * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M) + 4 * e * y * Math.sin(M) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M))
  return { declRad: decl, eqtMin: eqt }
}

// 太阳位置：输入当地日期时刻（tz 时区，东八区=8）；返回 {altDeg, azDeg, declDeg, eqtMin, tstMin, haDeg}，非法返回 null
function solarPosition(y, mo, d, hh, mi, lat, lon, tz) {
  const la = Number(lat)
  const lo = Number(lon)
  const hour = Number(hh)
  const minute = Number(mi)
  if (![y, mo, d, hour, minute, la, lo].every(Number.isFinite)) return null
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return null
  const jd = julianDay(y, mo, d + (hour + minute / 60 - tz) / 24)
  const { declRad, eqtMin } = calcSolar(jd)
  const minutes = hour * 60 + minute
  const tst = minutes + eqtMin + 4 * lo - 60 * tz
  let ha = tst / 4 - 180
  if (ha < -180) ha += 360
  if (ha > 180) ha -= 360
  const latR = la * RAD
  const cosZ = Math.sin(latR) * Math.sin(declRad) + Math.cos(latR) * Math.cos(declRad) * Math.cos(ha * RAD)
  const alt = Math.asin(clampNum(cosZ, -1, 1)) / RAD
  let az = Math.atan2(
    -Math.cos(declRad) * Math.sin(ha * RAD),
    Math.cos(latR) * Math.sin(declRad) - Math.sin(latR) * Math.cos(declRad) * Math.cos(ha * RAD)
  )
  az = (az / RAD + 360) % 360
  return { altDeg: alt, azDeg: az, declDeg: declRad / RAD, eqtMin, tstMin: tst, haDeg: ha }
}

// 当日日出/正午/日落（分钟，当地时钟时刻；polar: 'day' 极昼 / 'night' 极夜 / null）
function sunTimes(y, mo, d, lat, lon, tz) {
  const la = Number(lat)
  const lo = Number(lon)
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null
  const { declRad, eqtMin } = calcSolar(julianDay(y, mo, d))
  const cosH0 = Math.cos(90.833 * RAD) / (Math.cos(la * RAD) * Math.cos(declRad)) - Math.tan(la * RAD) * Math.tan(declRad)
  const noon = 720 - eqtMin - 4 * lo + 60 * tz
  if (cosH0 < -1) return { noon, rise: null, set: null, polar: 'day' }
  if (cosH0 > 1) return { noon, rise: null, set: null, polar: 'night' }
  const ha0 = Math.acos(cosH0) / RAD
  return { noon, rise: noon - 4 * ha0, set: noon + 4 * ha0, polar: null }
}

// 分钟数 → 'HH:MM'（负值/超24h 显示 '--:--'）
function fmtMinutes(min) {
  if (!Number.isFinite(min) || min < 0 || min >= 1440) return '--:--'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  const mm = m === 60 ? 0 : m
  const hh = m === 60 ? h + 1 : h
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

// 罗盘方位名（8 方位，45° 一区）
function compassName(azDeg) {
  const az = ((Number(azDeg) % 360) + 360) % 360
  const names = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return names[Math.round(az / 45) % 8]
}

// 影子长度 = h / tan(alt)；alt ≤ 0 或非法返回 null
function shadowLengthM(heightM, altDeg) {
  const h = Number(heightM)
  const a = Number(altDeg)
  if (!Number.isFinite(h) || h <= 0 || !Number.isFinite(a) || a <= 0 || a >= 90) return null
  return h / Math.tan(a * RAD)
}

// 影子方位 = 太阳方位 + 180°
function shadowAzimuth(azDeg) {
  const az = Number(azDeg)
  if (!Number.isFinite(az)) return null
  return ((az + 180) % 360 + 360) % 360
}
// PURE-LOGIC-END

// ---------- 静态数据 ----------
const CITIES = [
  { id: 'beijing', label: '北京（39.90°N, 116.41°E）', lat: 39.904, lon: 116.407 },
  { id: 'shanghai', label: '上海（31.23°N, 121.47°E）', lat: 31.23, lon: 121.47 },
  { id: 'guangzhou', label: '广州（23.13°N, 113.26°E）', lat: 23.13, lon: 113.26 },
  { id: 'chengdu', label: '成都（30.57°N, 104.07°E）', lat: 30.57, lon: 104.07 },
  { id: 'custom', label: '自定义（手动填经纬度）', lat: null, lon: null }
]

const QUICK_TIMES = [
  { id: 'now', label: '现在', time: null },
  { id: 'morning', label: '上午 09:00', time: '09:00' },
  { id: 'noon', label: '正午 12:00', time: '12:00' },
  { id: 'afternoon', label: '下午 15:00', time: '15:00' },
  { id: 'golden', label: '傍晚 18:00', time: '18:00' }
]

const FAQS = [
  {
    q: '为什么冬至影子最长、夏至影子最短？',
    a: '太阳高度角决定影子长短。北半球冬至太阳直射南回归线（赤纬约 -23.44°），中纬度地区正午高度角一年最低（北京约 26.6°），影长约是夏至（正午约 73°）的 3.7 倍。楼间距、采光设计都以冬至日有效日照为最不利工况。'
  },
  {
    q: '影子方位和太阳方位是什么关系？',
    a: '正好相反：影子方位 = 太阳方位 + 180°。上午太阳在东南、影子指向西北；正午（地方时）太阳在正南、影子朝正北；傍晚太阳在西偏北、影子指向东偏南。拍照想顺光/逆光、场地想留阴影区，用本页方位角即可规划。'
  },
  {
    q: '「太阳正午」和手表 12:00 为什么不是一回事？',
    a: '太阳正午是真太阳时 12:00（太阳过当地子午线、影子最短、指向正北的时刻），它 = 12:00 经均时差与经度相对东八区中央经线（120°E）的修正。北京在 116.4°E，比 120°E 偏西约 14 分钟，所以北京太阳正午常发生在 12:14 前后，全年还在 ±16 分钟均时差内摆动。'
  },
  {
    q: '计算精度怎么样？能用于工程吗？',
    a: '本页采用 NOAA 公布的 Meeus 截断级数算法，与 NOAA 官方计算器典型偏差小于 0.1°，方位角/影子长度对摄影、户外、晾晒、光伏倾角估算完全够用；但高层建筑日照分析、日照间距审批等法定场景须使用经审定的专业软件并按现行标准（GB 50180 等）执行。'
  },
  {
    q: '什么是黄金时刻和蓝调时刻？',
    a: '摄影界通行口径：太阳高度角 -4° ~ 6° 为黄金时刻（光线金黄柔和、影子拉长）；日落后高度角 -4° ~ -6° 为蓝调时刻（天空深蓝、城市灯光与天光平衡）。两者每天各出现一次，时长随纬度与季节变化——纬度越高黄金时刻越长，赤道附近可能只有十几分钟。'
  }
]

// ---------- 响应式参数 ----------
const cityId = ref('beijing')
const lat = ref(39.904)
const lon = ref(116.407)
const dateStr = ref('')
const timeStr = ref('12:00')
const objHeight = ref(1.7)

// SSR 安全：默认日期在 onMounted 填充为今天
onMounted(() => {
  addRecentTool('shadow-length-calculator')
  if (!dateStr.value) {
    const now = new Date()
    dateStr.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    timeStr.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }
})

const heightText = computed(() => (Number.isFinite(Number(objHeight.value)) ? Number(objHeight.value) : 0).toFixed(1))

const dateParts = computed(() => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.value || '')
  if (!m) return null
  return { y: +m[1], mo: +m[2], d: +m[3] }
})
const timeParts = computed(() => {
  const m = /^(\d{1,2}):(\d{2})/.exec(timeStr.value || '')
  if (!m) return null
  return { hh: +m[1], mi: +m[2] }
})

const validationIssues = computed(() => {
  const list = []
  if (!dateParts.value) list.push('请选择有效日期')
  if (!timeParts.value) list.push('请选择有效时刻')
  const la = Number(lat.value)
  const lo = Number(lon.value)
  if (!Number.isFinite(la) || la < -90 || la > 90) list.push('纬度限 -90 ~ 90°')
  if (!Number.isFinite(lo) || lo < -180 || lo > 180) list.push('经度限 -180 ~ 180°')
  const h = Number(objHeight.value)
  if (!Number.isFinite(h) || h <= 0) list.push('物体高度需为大于 0 的数值（m）')
  return list
})

const pos = computed(() => {
  const dp = dateParts.value
  const tp = timeParts.value
  if (!dp || !tp) return null
  return solarPosition(dp.y, dp.mo, dp.d, tp.hh, tp.mi, lat.value, lon.value, 8)
})

const times = computed(() => {
  const dp = dateParts.value
  if (!dp) return null
  return sunTimes(dp.y, dp.mo, dp.d, lat.value, lon.value, 8)
})

const result = computed(() => {
  if (validationIssues.value.length) return null
  const p = pos.value
  if (!p) return null
  const alt = p.altDeg
  const az = p.azDeg
  const shadow = shadowLengthM(objHeight.value, alt)
  const sAz = shadowAzimuth(az)
  const t = times.value
  return {
    altDeg: alt,
    azDeg: az,
    altText: alt.toFixed(1),
    azText: az.toFixed(0),
    azName: compassName(az),
    altHint: alt <= 0 ? '太阳在地平线以下' : alt < 15 ? '低角度（影子很长）' : alt > 60 ? '高角度（影子很短）' : '常规角度',
    shadow,
    shadowText: shadow === null ? '' : shadow > 999 ? '极长（太阳贴地平）' : shadow.toFixed(2),
    shadowAzText: sAz === null ? '—' : sAz.toFixed(0),
    shadowAzName: sAz === null ? '' : compassName(sAz),
    riseText: t && t.rise !== null ? fmtMinutes(t.rise) : t && t.polar === 'day' ? '极昼' : t && t.polar === 'night' ? '极夜' : '--:--',
    noonText: t ? fmtMinutes(t.noon) : '--:--',
    setText: t && t.set !== null ? fmtMinutes(t.set) : t && t.polar === 'day' ? '极昼' : t && t.polar === 'night' ? '极夜' : '--:--'
  }
})

const phaseBadgeText = computed(() => {
  const r = result.value
  if (!r) return ''
  if (r.altDeg > 6) return '白天 · 常规光线'
  if (r.altDeg > -4) return '黄金时刻（-4°~6°）'
  if (r.altDeg > -6) return '蓝调时刻'
  return '夜间 · 日落后无影'
})
const phaseBadgeClass = computed(() => {
  const r = result.value
  if (!r) return ''
  if (r.altDeg > 6) return 'bg-sky-500/10 text-sky-600 border-sky-500/20'
  if (r.altDeg > -4) return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  if (r.altDeg > -6) return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
  return 'bg-muted text-muted-foreground border-border'
})

// SVG 示意图几何
const svg = computed(() => {
  const r = result.value
  if (!r) return null
  const t = times.value
  const dp = dateParts.value
  if (!t || !dp || t.polar) return null
  const pos2 = pos.value
  const noonPos = solarPosition(dp.y, dp.mo, dp.d, Math.floor(t.noon / 60), t.noon % 60, lat.value, lon.value, 8)
  const maxAlt = Math.max(5, noonPos ? noonPos.altDeg : 45)
  const frac = clampNum((pos2.tstMin - t.rise) / (t.set - t.rise), 0, 1)
  const sunX = 30 + 360 * frac
  const sunY = 180 - clampNum(r.altDeg / maxAlt, 0, 1) * 140
  const peakY = 40
  const ctrlY = 2 * peakY - 180
  const sunVisible = r.altDeg > 0
  const ratio = r.shadow === null ? 0 : clampNum(r.shadow / Math.max(0.1, Number(objHeight.value)), 0, 1.6)
  const shadowX2 = 210 - Math.sin(r.azDeg * RAD) * (ratio * 36)
  const shadowVisible = sunVisible && r.shadow !== null
  return {
    arcPath: `M 30 180 Q 210 ${ctrlY} 390 180`,
    sunX: +sunX.toFixed(1),
    sunY: +sunY.toFixed(1),
    sunVisible,
    shadowVisible,
    shadowX2: +shadowX2.toFixed(1),
    shadowLabelX: +clampNum((210 + shadowX2) / 2, 60, 380).toFixed(0),
    altText: r.altText
  }
})

// ---------- 交互动作 ----------
function applyCity() {
  const c = CITIES.find((x) => x.id === cityId.value)
  if (c && c.lat !== null && c.lon !== null) {
    lat.value = c.lat
    lon.value = c.lon
  }
}

function applyQuick(q) {
  if (q.time === null) {
    const now = new Date()
    timeStr.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    dateStr.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  } else {
    timeStr.value = q.time
  }
}

async function copyResult() {
  const r = result.value
  if (!r) return
  const lines = [
    `太阳与影子数据（${dateStr.value} ${timeStr.value} 北京时间 · ${lat.value.toFixed(2)}°N ${lon.value.toFixed(2)}°E）`,
    `太阳高度角：${r.altText}°（${r.altHint}）`,
    `太阳方位角：${r.azText}°（${r.azName}）`,
    r.shadow === null ? '影子：太阳在地平线以下，无影' : `影子长度：${r.shadowText} m（物体高 ${heightText.value}m）`,
    r.shadow === null ? '' : `影子方位：${r.shadowAzText}°（${r.shadowAzName}）`,
    `日出 ${r.riseText} · 太阳正午 ${r.noonText} · 日落 ${r.setText}`,
    `时段：${phaseBadgeText.value}（NOAA 算法，东八区口径）`
  ].filter(Boolean)
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制')
  } catch {
    alert('复制失败，请手动选择文本复制')
  }
}
</script>
