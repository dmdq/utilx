<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gauge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">速度单位换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">km/h、m/s、mph、节（kn）、ft/s、马赫六向精确换算，1 m/s = 3.6 km/h、1 节 = 1.852 km/h</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线速度单位换算工具：以米/秒（m/s，SI 导出单位）为基准的精确系数（1 m/s = 3.6 km/h、1 mph = 1.609344 km/h、
        1 knot = 1.852 km/h（国际海里 1852 m 精确定义）、1 ft/s = 0.3048 m/s），马赫按海平面 15 °C 声速 340.29 m/s 近似折算
        （声速随气温与高度变化，非固定单位，口径注记见下）。任一单位输入、其余五个联动更新；
        附 km/h↔mph 与 m/s↔km/h 常用速换卡、km/h↔mph 一键互换，以及步行/市区/高速/高铁 350/民航巡航/声速等场景速度对照表（点行即载入换算）。
        「迈」为什么不是 km/h、节是什么单位、马赫数怎么理解，见下方说明。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 输入速度
        </h2>

        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="u in UNITS"
            :key="u.id"
            @click="inputUnit = u.id"
            class="px-1 py-2 rounded-lg border text-[11px] font-semibold transition"
            :class="inputUnit === u.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40'"
            :title="u.name"
          >
            {{ u.symbol }}
          </button>
        </div>

        <div>
          <input
            v-model="inputValue"
            type="number"
            min="0"
            step="any"
            placeholder="输入数值，如 100"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入以当前所选单位计；马赫按海平面 15 °C 声速 340.29 m/s 近似，跨音速飞行请以当地声速为准。</span>
          </p>
        </div>

        <p v-if="parsed === null" class="text-xs text-muted-foreground p-2.5 rounded bg-muted/40">
          请输入非负数值，六单位换算结果将实时联动。
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            @click="swapUnits"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition flex items-center gap-1.5"
          >
            <ArrowLeftRight class="w-3 h-3" /> 互换 {{ currentUnit.symbol }} ⇄ {{ swapTargetUnit.symbol }}
          </button>
          <button
            @click="applyPreset(100, 'kmh')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 100 km/h
          </button>
          <button
            @click="applyPreset(350, 'kmh')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 350 km/h
          </button>
          <button
            @click="applyPreset(1, 'mach')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 1 马赫
          </button>
          <button
            @click="resetInput"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition"
          >
            <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" /> 清空
          </button>
        </div>

        <!-- 常用速换卡 -->
        <div class="border-t border-border pt-4">
          <p class="text-sm font-medium text-foreground mb-2">常用速换（km/h↔mph · m/s↔km/h）</p>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">km/h → mph</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickKmhTable"
                  :key="'k' + q.value"
                  @click="applyPreset(q.value, 'kmh')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">m/s → km/h</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickMpsTable"
                  :key="'m' + q.value"
                  @click="applyPreset(q.value, 'mps')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果大表（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Gauge class="w-5 h-5 mr-2 text-primary" /> 六单位换算结果
            </h2>
            <button
              @click="copyResults"
              :disabled="!canCopy"
              class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle v-if="copied" class="w-3.5 h-3.5 text-green-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copied ? '已复制' : '复制结果' }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="r in resultRows"
              :key="r.id"
              class="flex items-center justify-between px-4 py-3 rounded-lg border"
              :class="r.id === inputUnit ? 'bg-primary/10 border-primary/40' : 'bg-muted/40 border-border'"
            >
              <div>
                <p class="text-sm font-semibold text-foreground">{{ r.symbol }}
                  <span v-if="r.id === inputUnit" class="ml-1.5 text-[10px] font-normal text-primary">当前输入单位</span>
                </p>
                <p class="text-[11px] text-muted-foreground">{{ r.name }}（{{ r.systemLabel }}）</p>
              </div>
              <p class="text-2xl font-bold font-mono" :class="r.id === inputUnit ? 'text-primary' : 'text-foreground'">
                {{ r.value === null ? '—' : fmtSpeed(r.value) }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            基准与因子：1 m/s = 3.6 km/h；1 mph = 1.609344 km/h（1 英里 = 1609.344 m 精确定义）；1 knot = 1.852 km/h（国际海里 1852 m）；
            1 ft/s = 0.3048 m/s；1 Mach = 340.29 m/s（海平面 15 °C 声速近似值，随温度高度变化）。
            锚点：100 km/h = 27.777778 m/s = 62.137119 mph = 53.99568 knot；1 m/s = 1.943844 knot。
          </p>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground mt-3 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>马赫不是固定单位：Mach = 物体速度 ÷ 当地声速。本工具按海平面 15 °C 国际标准大气声速 340.29 m/s 折算；
            声速随气温升高而增大（约 +0.6 m/s·°C），11 km 巡航高度约 295-300 m/s——同为 0.85 Mach，高空实际地速比海平面低。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        各领域口径速记：中国及全球多数国家道路用 km/h；美国、英国道路用 mph；航海、航空与气象（风速、洋流）用节 kn；
        航空给出飞行器速度与声速的比值时用马赫。1 mph = 1.609344 km/h、1 节 = 1.852 km/h 均为国际精确定义，
        日常口语的「迈」「码」混用问题见下方科普。
      </p>
    </div>

    <!-- 场景参考表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Gauge class="w-5 h-5 mr-2 text-primary" /> 场景速度对照（点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">换算列由系数自动计算；步行/骑行速度因人而异，高铁按运营最高时速，声速按海平面 15 °C 口径。</p>

      <div class="overflow-x-auto">
        <div class="min-w-[640px]">
          <div class="grid grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr_1.6fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>场景</span><span>参考值</span><span>≈ m/s</span><span>≈ mph</span><span>说明</span>
          </div>
          <button
            v-for="row in scenarioRows"
            :key="row.name"
            @click="loadScenario(row)"
            class="w-full grid grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr_1.6fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
          >
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="font-mono text-foreground">{{ row.valueText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.mpsText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.mphText }}</span>
            <span class="text-muted-foreground leading-snug">{{ row.note }}</span>
          </button>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>km/h、mph、节、马赫都是什么单位？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          速度 = 距离 ÷ 时间，各行业选了自己的「距离 + 时间」组合：
          千米每小时 km/h（公里时速）是中国等多数国家的道路法定口径；
          英里每小时 mph 用于美英道路；节 knot = 国际海里每小时 = 1852 m/h，航海航空通用来配海里导航；
          米每秒 m/s 是 SI 导出单位，物理与工程计算的标准口径；马赫是无量纲比值（速度 ÷ 当地声速），航空用来说明与声速的相对关系。
          它们之间只差固定系数，本工具按国际精确定义换算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">「迈」和公里每小时是一回事吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不是。「迈」本是英里（mile）的音译，「120 迈」按本义是 120 mph = 193.12 km/h——在国内道路这已是严重超速。
          但中文口语说「跑 120 迈」时，绝大多数人真正想表达的就是 120 km/h，所以日常语境里「迈」已被约定俗成为 km/h。
          看美国车速表、读英文资料时 mph 才是本义（1 mph = 1.609344 km/h）。
          顺带纠正另一个高频误用：「时速 80 码」——码（yard）是长度单位（1 码 = 0.9144 m），与速度无关，这是「迈」误用的二次传播。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">节（knot）是什么单位？1 节等于多少 km/h？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1 节（1 kn）= 1 国际海里/小时 = 1852 m/h ≈ 0.514444 m/s ≈ 1.852 km/h（1929 年国际水文会议将海里精确定为 1852 m）。
          名字源自帆船时代测速法：把带等距绳结的测速绳抛入海中，数固定时间内滑出的绳结数。
          今天航海（货轮 20-25 节 ≈ 37-46 km/h）、航空（民航巡航 450-480 节 ≈ 830-890 km/h）与气象（风力、洋流）都用节——
          因为导航坐标以经纬度计，1 海里恰好等于纬度 1 分对应的弧长，用节与海里计算航程最直接。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">马赫数怎么理解？为什么随高度变化？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Mach = 物体速度 ÷ 当地声速，无量纲。声速取决于空气温度（约 20.05 × √T m/s，T 为热力学温度）：
          海平面 15 °C 约 340.29 m/s（≈ 1225.04 km/h），11 km 平流层底部降到约 295-300 m/s。
          所以同样是 0.85 Mach，民航在万米高空的实际速度比海平面低约 15%。常用区间：亚音速 < 0.8、跨音速 0.8-1.2、超音速 1.2-5、高超音速 > 5。
          本工具按海平面 15 °C 的 340.29 m/s 固定折算，适合日常估算；精确气动计算请按当地气温修正。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1 m/s 等于多少 km/h？</h3>
            <p class="text-sm text-muted-foreground mt-1">3.6 km/h。1 小时 = 3600 秒，1 m/s 的物体 1 小时走 3600 m = 3.6 km。反之 1 km/h = 1/3.6 ≈ 0.277778 m/s。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">100 km/h 等于多少 mph、多少节？</h3>
            <p class="text-sm text-muted-foreground mt-1">100 km/h = 62.137119 mph = 53.99568 knot = 27.777778 m/s。美国高速 65 mph ≈ 104.6 km/h，所以国内 120 km/h 限速约合 74.6 mph。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">「迈」和公里每小时一样吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">口语里已被当作 km/h 使用，但「迈」本义是英里 mph（1 mph = 1.609344 km/h）。120 mph = 193 km/h，两种理解差 60%，看英文资料时务必按 mph 理解。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有速度换算都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="TOOL_ID" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Gauge, ArrowLeftRight, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'speed-unit-converter'

// ---------- SEO ----------
useSeoMeta({
  title: '速度单位换算 - km/h、m/s、mph、节、马赫在线换算工具',
  description: '免费在线速度单位换算：km/h、m/s、mph、节（knot）、ft/s、马赫六向精确互转（1 m/s=3.6 km/h、1 节=1.852 km/h、1 mph=1.609344 km/h、马赫=340.29 m/s），附步行/高速/高铁 350/民航巡航/声速场景对照表与「迈」「节」「马赫」科普，纯浏览器本地运行不上传',
  keywords: '速度单位换算,kmh转mph,米每秒换算,马赫数,节换算,速度换算器,kmh mps',
  author: '有条工具',
  ogTitle: '速度单位换算 - km/h、m/s、mph、节、马赫在线换算工具 | 有条工具',
  ogDescription: '六速度单位精确互转，马赫口径注记，高铁/民航/声速场景对照表，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/speed-unit-converter',
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
          name: '速度单位换算器',
          url: 'https://www.util.cn/tools/speed-unit-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['km/h、m/s、mph、节、ft/s、马赫六向精确互转', '精确因子 1 m/s=3.6 km/h、1 knot=1.852 km/h、1 mph=1.609344 km/h', '马赫按海平面 15 °C 声速 340.29 m/s 折算并注明口径', '步行/市区/高速/高铁/民航巡航/声速场景对照表', 'km/h↔mph 与 m/s↔km/h 常用速换卡', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '速度单位换算器', item: 'https://www.util.cn/tools/speed-unit-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1 m/s 等于多少 km/h？',
              acceptedAnswer: { '@type': 'Answer', text: '3.6 km/h。1 小时 = 3600 秒，1 m/s 一小时走 3600 m = 3.6 km；反之 1 km/h ≈ 0.277778 m/s。' }
            },
            {
              '@type': 'Question',
              name: '100 km/h 等于多少 mph、多少节？',
              acceptedAnswer: { '@type': 'Answer', text: '100 km/h = 62.137119 mph = 53.99568 knot = 27.777778 m/s（1 mph = 1.609344 km/h、1 knot = 1.852 km/h 精确定义）。' }
            },
            {
              '@type': 'Question',
              name: '「迈」和公里每小时一样吗？',
              acceptedAnswer: { '@type': 'Answer', text: '口语中「迈」已被当作 km/h 使用，但本义是英里 mph（1 mph = 1.609344 km/h）。120 mph = 193 km/h，两种理解差 60%。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有速度换算都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- PURE-FNS-START ----------
// 换算系数以 m/s（米/秒，SI）为基准：MPS_PER[unit] = 该单位 1 份对应多少 m/s
const MPS_PER = {
  kmh: 1 / 3.6,          // 千米/小时（1 m/s = 3.6 km/h）
  mps: 1,                // 米/秒（SI）
  mph: 1.609344 / 3.6,   // 英里/小时（1 mi = 1609.344 m 精确定义）
  knot: 1.852 / 3.6,     // 节（1 knot = 1.852 km/h，国际海里 1852 m）
  fps: 0.3048,           // 英尺/秒（1 ft = 0.3048 m 精确定义）
  mach: 340.29           // 马赫（海平面 15 °C 声速近似值，随温度高度变化）
}

const UNITS = [
  { id: 'kmh', symbol: 'km/h', name: '千米/小时', systemLabel: '道路·中国法定' },
  { id: 'mps', symbol: 'm/s', name: '米/秒', systemLabel: 'SI 导出单位' },
  { id: 'mph', symbol: 'mph', name: '英里/小时', systemLabel: '美英道路' },
  { id: 'knot', symbol: 'kn', name: '节（knot）', systemLabel: '航海·航空' },
  { id: 'fps', symbol: 'ft/s', name: '英尺/秒', systemLabel: '英制·弹道' },
  { id: 'mach', symbol: 'Mach', name: '马赫', systemLabel: '声速倍数·航空' }
]

// 浮点尾差清洗：按 12 位有效数字截断；若与更低有效位的舍入值仅差相对 1e-9 以内则吸附，
// 使往返换算（如 km/h→mph→km/h）精确回到原值
function cleanFloat(v, sig = 12) {
  if (!Number.isFinite(v)) return NaN
  if (v === 0) return 0
  for (const s of [6, 8, 10]) {
    const cand = Number(v.toPrecision(s))
    if (cand !== 0 && Math.abs(v - cand) / Math.abs(v) < 1e-9) return cand
  }
  return Number(v.toPrecision(sig))
}

// 任意单位 → m/s
function toMps(value, unitId) {
  const k = MPS_PER[unitId]
  if (!Number.isFinite(value) || typeof k !== 'number') return NaN
  return cleanFloat(value * k)
}

// m/s → 任意单位
function fromMps(mps, unitId) {
  const k = MPS_PER[unitId]
  if (!Number.isFinite(mps) || typeof k !== 'number') return NaN
  return cleanFloat(mps / k)
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertSpeed(value, fromId, toId) {
  return fromMps(toMps(value, fromId), toId)
}

// 输入解析：空串/非数字/负数一律视为无效（速度非负）
function parseSpeedInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// 展示格式化：6 位小数并去尾零；极小/超大值用科学计数
function fmtSpeed(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 1e-4 || a >= 1e15) {
    let s = v.toExponential(6)
    s = s.replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e')
    return s
  }
  const s = v.toFixed(6)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}

// 互换/预设载入时回填输入框的紧凑字符串（10 位有效数字）
function toInputString(v) {
  if (!Number.isFinite(v)) return ''
  return String(Number(v.toPrecision(10)))
}

// 场景参考速度（unit 为输入单位）
const SPEED_SCENARIOS = [
  { name: '成人步行', v: 5, unit: 'kmh', note: '散步 4-6 km/h ≈ 1.4 m/s，快走可达 6.5 km/h' },
  { name: '市区驾车', v: 50, unit: 'kmh', note: '城市道路常见限速 50-60 km/h ≈ 31 mph' },
  { name: '高速公路上限', v: 120, unit: 'kmh', note: '中国高速最高限速 120 km/h ≈ 74.6 mph' },
  { name: '高铁运营速度', v: 350, unit: 'kmh', note: '复兴号 350 km/h ≈ 97.2 m/s ≈ 217.5 mph' },
  { name: '民航巡航', v: 900, unit: 'kmh', note: '约 0.73-0.78 Mach、450-480 节，万米高空' },
  { name: '声速（海平面 15 °C）', v: 1, unit: 'mach', note: '340.29 m/s ≈ 1225.04 km/h，随温度高度变化' }
]
// ---------- PURE-FNS-END ----------

// ---------- 换算状态 ----------
const SWAP_PAIR = { kmh: 'mph', mph: 'kmh', mps: 'fps', fps: 'mps', knot: 'mach', mach: 'knot' }

const inputUnit = ref('kmh')
const inputValue = ref('100')

function unitById(id) {
  return UNITS.find((u) => u.id === id) || null
}

const currentUnit = computed(() => unitById(inputUnit.value) || UNITS[0])
const swapTargetUnit = computed(() => unitById(SWAP_PAIR[inputUnit.value]) || UNITS[1])

const parsed = computed(() => parseSpeedInput(inputValue.value))
const mpsValue = computed(() => (parsed.value === null ? NaN : toMps(parsed.value, inputUnit.value)))

const resultRows = computed(() =>
  UNITS.map((u) => ({ ...u, value: parsed.value === null ? null : fromMps(mpsValue.value, u.id) }))
)
const canCopy = computed(() => parsed.value !== null)

const copyText = computed(() => {
  if (parsed.value === null) return ''
  const lines = resultRows.value.map((r) => `${r.symbol}: ${fmtSpeed(r.value)}`)
  return [`输入: ${fmtSpeed(parsed.value)} ${currentUnit.value.symbol}`, ...lines].join('\n')
})

function applyPreset(value, unitId) {
  inputUnit.value = unitId
  inputValue.value = String(value)
  trackEvent('工具结果', '载入示例', TOOL_ID)
}

function loadScenario(row) {
  applyPreset(row.v, row.unit)
}

function swapUnits() {
  const target = SWAP_PAIR[inputUnit.value]
  if (!target) return
  if (parsed.value !== null) {
    const converted = convertSpeed(parsed.value, inputUnit.value, target)
    if (Number.isFinite(converted)) inputValue.value = toInputString(converted)
  }
  inputUnit.value = target
  trackEvent('工具使用', '互换单位', TOOL_ID)
}

function resetInput() {
  inputValue.value = ''
  copied.value = false
}

// ---------- 静态表（纯常量派生，无浏览器 API） ----------
const quickKmhTable = [60, 80, 100, 120].map((v) => ({
  value: v,
  converted: fmtSpeed(convertSpeed(v, 'kmh', 'mph'))
}))
const quickMpsTable = [1, 5, 10, 20].map((v) => ({
  value: v,
  converted: fmtSpeed(convertSpeed(v, 'mps', 'kmh'))
}))

const scenarioRows = SPEED_SCENARIOS.map((s) => ({
  name: s.name,
  v: s.v,
  unit: s.unit,
  note: s.note,
  valueText: `${fmtSpeed(s.v)} ${unitById(s.unit)?.symbol || s.unit}`,
  mpsText: `${fmtSpeed(convertSpeed(s.v, s.unit, 'mps'))} m/s`,
  mphText: `${fmtSpeed(convertSpeed(s.v, s.unit, 'mph'))} mph`
}))

// ---------- 复制（浏览器 API 仅在回调中，SSR 安全） ----------
const copied = ref(false)
let copyTimer = null

async function copyResults() {
  if (!canCopy.value) return
  try {
    await navigator.clipboard.writeText(copyText.value)
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (error) {
    console.error('复制失败:', error)
    copied.value = false
  }
}

// ---------- SEO 折叠 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 设置持久化（localStorage，键前缀用工具 id，仅 onMounted/交互回调触达） ----------
const SETTINGS_KEY = `${TOOL_ID}-settings`

function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (UNITS.some(u => u.id === s.inputUnit)) inputUnit.value = s.inputUnit
    if (typeof s.inputValue === 'string' && parseSpeedInput(s.inputValue) !== null) inputValue.value = s.inputValue
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([inputUnit, inputValue], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      inputUnit: inputUnit.value,
      inputValue: inputValue.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})
</script>
