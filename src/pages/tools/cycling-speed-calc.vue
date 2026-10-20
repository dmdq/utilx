<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gauge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">骑行配速换算表</h1>
          <p class="text-sm text-muted-foreground mt-1">速度/配速/时间距离互算，踏频×齿比×轮径推算时速，通勤与训练配速参考</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        骑友常用的三组换算并排呈现：① 记录的距离与用时反推平均时速和每公里配速；② 给定目标速度推算完成指定距离需要多久；
        ③ 从传动原理正推时速——踏频（rpm）× 齿比（前齿片÷后飞轮）× 轮周长（按轮径 π×D 估算，700c/26/27.5/29 寸预设）
        直接得出理论 km/h，帮你确认踏频档位该踩多少。页尾附常见轮径周长速查表，配码表设定周长参考，全部本地计算。
      </p>
    </div>

    <!-- 三卡并排 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- ① 距离/时长 → 速度/配速 -->
      <div class="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
          <Route class="w-4 h-4 text-primary" /> ① 距离时长 → 速度配速
        </h2>
        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">骑行距离（km）</label>
          <input
            v-model.number="distA"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 30"
          >
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">用时（小时）</label>
            <input
              v-model.number="hoursA"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 1.5"
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">或分钟</label>
            <input
              v-model.number="minsA"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 90"
            >
          </div>
        </div>
        <div v-if="speedA > 0" class="space-y-2 pt-2 border-t border-border">
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">平均速度</span>
            <span class="text-xl font-bold text-primary">{{ speedA.toFixed(2) }} km/h</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">每公里配速</span>
            <span class="text-lg font-semibold text-foreground">{{ paceText(speedA) }}</span>
          </div>
          <p class="text-xs text-muted-foreground">配速 = 60 ÷ 时速（分钟/公里）</p>
        </div>
        <div v-else class="pt-2 text-sm text-muted-foreground">输入距离与用时后显示</div>
      </div>

      <!-- ② 速度 → 完成时间 -->
      <div class="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
          <Timer class="w-4 h-4 text-primary" /> ② 目标速度 → 完成用时
        </h2>
        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">目标速度（km/h）</label>
          <input
            v-model.number="speedB"
            type="number"
            min="0"
            step="0.5"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 25"
          >
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="p in speedPresets"
              :key="p"
              @click="speedB = p"
              :class="[
                'px-2.5 py-1 rounded text-xs transition',
                speedB === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              {{ p }} km/h
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">目标距离（km）</label>
          <input
            v-model.number="distB"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 100"
          >
        </div>
        <div v-if="speedB > 0 && distB > 0" class="space-y-2 pt-2 border-t border-border">
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">预计用时</span>
            <span class="text-xl font-bold text-primary">{{ timeText(hoursB) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">对应配速</span>
            <span class="text-lg font-semibold text-foreground">{{ paceText(speedB) }}</span>
          </div>
          <p class="text-xs text-muted-foreground">用时 = 距离 ÷ 速度；适合通勤/拉练时间规划</p>
        </div>
        <div v-else class="pt-2 text-sm text-muted-foreground">输入速度与距离后显示</div>
      </div>

      <!-- ③ 踏频齿比轮径 → 速度 -->
      <div class="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
          <Cog class="w-4 h-4 text-primary" /> ③ 踏频×齿比×轮径 → 时速
        </h2>
        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">踏频（rpm，转/分）</label>
          <input
            v-model.number="cadence"
            type="number"
            min="0"
            max="200"
            step="1"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 90"
          >
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">前齿片（T）</label>
            <input
              v-model.number="frontTeeth"
              type="number"
              min="1"
              max="99"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">后飞轮（T）</label>
            <input
              v-model.number="rearTeeth"
              type="number"
              min="1"
              max="99"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">轮径预设（含外胎近似）</label>
          <select
            v-model="rimPreset"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="custom">自定义轮径</option>
            <option v-for="r in rimPresets" :key="r.name" :value="r.name">{{ r.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-foreground">轮外径（mm，含胎）</label>
          <input
            v-model.number="rimMm"
            :disabled="rimPreset !== 'custom'"
            type="number"
            min="100"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          >
          <p class="text-xs text-muted-foreground mt-1">轮周长 = π × 轮外径 mm ÷ 1000 ≈ {{ circumference.toFixed(3) }} m</p>
        </div>
        <div v-if="cadence > 0 && frontTeeth > 0 && rearTeeth > 0" class="space-y-2 pt-2 border-t border-border">
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">理论时速</span>
            <span class="text-xl font-bold text-primary">{{ speedC.toFixed(2) }} km/h</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">每曲柄转前进</span>
            <span class="text-sm font-semibold text-foreground">{{ development.toFixed(2) }} m/转</span>
          </div>
          <p class="text-xs text-muted-foreground">
            时速 = 踏频 × (前齿÷后齿) × 轮周长 × 60 ÷ 1000；齿比 {{ (frontTeeth / rearTeeth).toFixed(2) }}
          </p>
        </div>
        <div v-else class="pt-2 text-sm text-muted-foreground">输入踏频与齿比后显示</div>
      </div>
    </div>

    <!-- 轮径周长速查表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
        <CircleDot class="w-4 h-4 text-primary" /> 常见轮径周长速查（配码表参考）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">
        周长 = π × 轮外径（含外胎）估算，胎高按约等于胎宽近似；精确设定请以外胎侧壁 ETRTO 标注实测滚动一周为准。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-muted/60 text-foreground">
              <th class="border border-border px-3 py-2 text-left">轮组规格</th>
              <th class="border border-border px-3 py-2 text-left">常见用途</th>
              <th class="border border-border px-3 py-2 text-right">圈径 BSD (mm)</th>
              <th class="border border-border px-3 py-2 text-left">典型外胎</th>
              <th class="border border-border px-3 py-2 text-right">估算外径 (mm)</th>
              <th class="border border-border px-3 py-2 text-right">估算周长 (m)</th>
              <th class="border border-border px-3 py-2 text-left">选择</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rimPresets" :key="r.name" class="text-foreground">
              <td class="border border-border px-3 py-2 font-medium">{{ r.name }}</td>
              <td class="border border-border px-3 py-2 text-muted-foreground">{{ r.usage }}</td>
              <td class="border border-border px-3 py-2 text-right">{{ r.bsd }}</td>
              <td class="border border-border px-3 py-2 text-muted-foreground">{{ r.tire }}</td>
              <td class="border border-border px-3 py-2 text-right">{{ r.diameterMm }}</td>
              <td class="border border-border px-3 py-2 text-right font-semibold">{{ circumferenceOf(r.diameterMm).toFixed(3) }}</td>
              <td class="border border-border px-3 py-2">
                <button
                  @click="pickRim(r)"
                  class="px-2 py-1 rounded text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
                >
                  用于③
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>骑行速度与配速怎么互相换算</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            骑行圈常说「均速多少码」「配速几分几秒一公里」，两者互为倒数关系：平均速度(km/h) = 距离(km) ÷ 时间(h)；
            每公里配速(min/km) = 60 ÷ 平均速度。均速 20 km/h 对应 3 分 00 秒/公里，均速 30 km/h 对应 2 分 00 秒/公里。
            通勤党关心「这段路要骑多久」，训练党关心「这个速度配速几何」，本页三张卡片把这两类问题一次覆盖。
          </p>
          <h3 class="text-lg font-semibold text-foreground">踏频、齿比、轮径如何决定时速</h3>
          <p>
            时速由传动系统推算：曲柄每分钟转 踏频 圈，每圈通过齿比（前齿片齿数÷后飞轮齿数）带动后轮转相应圈数，
            后轮每转一圈前进一个轮胎周长。因此 时速(km/h) = 踏频(rpm) × (前齿÷后齿) × 轮周长(m) × 60 ÷ 1000。
            例如踏频 90、齿比 50/17≈2.94、周长 2.10 m 时，理论时速约 33.35 km/h。想提速要么提高踏频、要么加大齿比，
            这也是「90 踏频巡航」「大盘带小飞」等说法的由来。
          </p>
          <h3 class="text-lg font-semibold text-foreground">轮径周长怎么设才准（700c / 26 / 27.5 / 29）</h3>
          <p>
            码表、骑行台与本页公式都依赖「外胎滚动周长」：周长 ≈ π × 轮外径，轮外径 = 圈径 BSD（700c/29 为 622mm、27.5 为 584mm、26 为 559mm）+ 两倍胎高。
            胎高工程上近似取胎宽：700×25c 估算周长约 2.11 m，26×1.95 约 2.07 m，27.5×2.10 约 2.17 m，29×2.25 约 2.31 m（均为含胎近似值）。
            同一轮组换光头胎与齿胎周长可差 3-5%，最可靠方法是气门对地面标记后直线滚动一周量距离，再按毫米填入自定义轮径。
          </p>
          <h3 class="text-lg font-semibold text-foreground">换算公式速查</h3>
          <p>
            平均速度(km/h) = 距离(km) ÷ 时间(h)；每公里配速(min/km) = 60 ÷ 均速；完成时间 = 距离 ÷ 目标速度。
            传动侧：轮周长(m) ≈ π × 轮外径(mm) ÷ 1000；理论时速(km/h) = 踏频(rpm) × (前齿÷后齿) × 轮周长(m) × 60 ÷ 1000；
            每曲柄转前进距离（齿轮前进量）= (前齿÷后齿) × 轮周长。记住「踏频90 + 齿比2.9 + 周长2.1m ≈ 33 km/h」这组数，
            路上即可心算大致均速。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">算出的时速和码表不一致？</span>本页③给的是无滑动无风阻的理论值；实际均速受路况、刹车、逆风影响通常低于理论值。码表若装了错周长会整体偏差，可对照速查表校准。</li>
            <li><span class="text-foreground font-medium">配速 3 分/公里算什么水平？</span>折算均速 20 km/h，是城市通勤带红灯停走的典型水平；纯巡航 3 分配在休闲骑行中已属流畅，训练者多追求 2 分以内（均速 30+）。</li>
            <li><span class="text-foreground font-medium">踏频多少最护膝？</span>普遍建议维持 80-100 rpm，用较低齿比踩高踏频比「重齿比硬蹬」更省膝关节。在③里输入你常用齿比即可反推该档位对应的巡航速度。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'cycling-speed-calc'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Gauge, Route, Timer, Cog, CircleDot, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '骑行配速换算表 - 速度/踏频齿比轮径/时间距离互算',
  description: '在线骑行配速换算表：距离用时反推均速与配速，目标速度推算完成时间，踏频×齿比×轮径正推理论时速，附700c/26/27.5/29寸轮径周长速查，通勤训练纯本地计算',
  keywords: '骑行速度计算, 骑行配速, 踏频换算速度, 齿比速度, 轮径周长, 码表周长设定, km/h换算',
  author: 'Util工具箱',
  ogTitle: '骑行配速换算表 - 有条工具',
  ogDescription: '速度/踏频/齿比/轮径/时间距离互算，通勤与训练配速参考',
  ogUrl: 'https://www.util.cn/tools/cycling-speed-calc',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '骑行配速换算表',
          url: 'https://www.util.cn/tools/cycling-speed-calc',
          applicationCategory: 'SportsApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['距离用时求均速配速', '速度推算完成时间', '踏频齿比轮径推时速', '轮径周长速查表', '纯本地计算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '骑行配速换算表', item: 'https://www.util.cn/tools/cycling-speed-calc/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '算出的时速和码表不一致？',
              acceptedAnswer: { '@type': 'Answer', text: '③给出的是无滑动无风阻的理论值，实际均速受路况与逆风影响通常更低；码表周长设定错误会导致整体偏差，可对照轮径速查表校准。' }
            },
            {
              '@type': 'Question',
              name: '配速3分/公里算什么水平？',
              acceptedAnswer: { '@type': 'Answer', text: '折算均速20km/h，是城市通勤带红灯的典型水平；休闲骑行3分配已属流畅，训练者多以均速30+（2分内）为目标。' }
            },
            {
              '@type': 'Question',
              name: '轮径周长怎么设才准？',
              acceptedAnswer: { '@type': 'Answer', text: '周长≈π×轮外径（BSD圈径加两倍胎高），速查表为含胎近似值；最可靠做法是气门贴地标记后直线滚动一周实测距离。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ===== PURE-BEGIN ===== */
// 轮外径(mm，含胎) → 滚动周长(m)：π × D ÷ 1000
function circumferenceOf(diameterMm) {
  const d = Number(diameterMm)
  if (!isFinite(d) || d <= 0) return 0
  return Math.PI * d / 1000
}

// ③ 踏频rpm × 齿比(前/后) × 轮周长m → 理论时速 km/h
function speedFromCadence(cadence, frontTeeth, rearTeeth, circumferenceM) {
  const c = Number(cadence); const f = Number(frontTeeth); const r = Number(rearTeeth); const circ = Number(circumferenceM)
  if (!(c > 0) || !(f > 0) || !(r > 0) || !(circ > 0)) return 0
  return c * (f / r) * circ * 60 / 1000
}

// 每曲柄转前进距离（米）= 齿比 × 周长
function gearDevelopment(frontTeeth, rearTeeth, circumferenceM) {
  const f = Number(frontTeeth); const r = Number(rearTeeth); const circ = Number(circumferenceM)
  if (!(f > 0) || !(r > 0) || !(circ > 0)) return 0
  return (f / r) * circ
}

// ① 距离/时长 → 均速 km/h
function speedFromDistanceTime(distKm, hours) {
  const d = Number(distKm); const h = Number(hours)
  if (!(d > 0) || !(h > 0)) return 0
  return d / h
}

// ② 速度 → 完成距离用时（小时）
function hoursForDistance(speedKmh, distKm) {
  const v = Number(speedKmh); const d = Number(distKm)
  if (!(v > 0) || !(d > 0)) return 0
  return d / v
}

// 均速 km/h → 每公里配速（秒/km）
function paceSeconds(speedKmh) {
  const v = Number(speedKmh)
  if (!(v > 0)) return 0
  return 3600 / v
}

// 配速文本 m'ss"
function paceText(speedKmh) {
  const s = paceSeconds(speedKmh)
  if (s <= 0) return '—'
  const mm = Math.floor(s / 60)
  const ss = Math.round(s % 60)
  if (ss === 60) return `${mm + 1}'00"`
  return `${mm}'${String(ss).padStart(2, '0')}"`
}

// 用时文本 h小时m分（保留到分）
function timeText(hours) {
  const h = Number(hours)
  if (!(h > 0)) return '—'
  const totalMin = Math.round(h * 60)
  const hh = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (hh === 0) return `${m} 分钟`
  return `${hh} 小时 ${m} 分`
}
/* ===== PURE-END ===== */

// ---------- 状态 ----------
const distA = ref(30)
const hoursA = ref(0)
const minsA = ref(75)
const speedB = ref(25)
const distB = ref(100)
const speedPresets = [15, 20, 25, 30, 35, 40]

const cadence = ref(90)
const frontTeeth = ref(50)
const rearTeeth = ref(17)
const rimPresets = [
  { name: '700c 公路（25-28c）', usage: '公路车/砾石', bsd: 622, tire: '25-622 ~ 28-622', diameterMm: 672 },
  { name: '26 寸山地', usage: '传统山地车', bsd: 559, tire: '1.95-559 (50-559)', diameterMm: 660 },
  { name: '27.5 寸山地（650b）', usage: '主流山地', bsd: 584, tire: '2.10-584 (53-584)', diameterMm: 690 },
  { name: '29 寸山地', usage: '竞赛/长途山地', bsd: 622, tire: '2.25-622 (57-622)', diameterMm: 736 }
]
const rimPreset = ref(rimPresets[0].name)
const customRimMm = ref(700)

const currentRim = computed(() => {
  if (rimPreset.value === 'custom') return { diameterMm: Math.max(100, Number(customRimMm.value) || 700) }
  const found = rimPresets.find(r => r.name === rimPreset.value)
  return found || rimPresets[0]
})
const rimMm = computed({
  get: () => currentRim.value.diameterMm,
  set: (v) => { customRimMm.value = v }
})
const circumference = computed(() => circumferenceOf(rimMm.value))
const speedC = computed(() => speedFromCadence(cadence.value, frontTeeth.value, rearTeeth.value, circumference.value))
const development = computed(() => gearDevelopment(frontTeeth.value, rearTeeth.value, circumference.value))

const totalHoursA = computed(() => {
  const h = Number(hoursA.value) || 0
  const m = Number(minsA.value) || 0
  if (h > 0) return h
  return m / 60
})
const speedA = computed(() => speedFromDistanceTime(distA.value, totalHoursA.value))
const hoursB = computed(() => hoursForDistance(speedB.value, distB.value))

const pickRim = (r) => {
  rimPreset.value = r.name
}

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
</script>

<style scoped>
/* 本页为计算工具，无打印版式 */
</style>
