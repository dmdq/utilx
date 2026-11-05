<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplets class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">流量单位换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">m³/h / m³/s / L/min / L/s / GPM(US) / CFM 六单位联动互转，水泵选型、燃气热负荷、通风换气场景参考</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线流量单位换算工具：以立方米每秒（m³/s，SI）为基准的精确系数（1 m³/h = 16.6667 L/min、1 GPM(US) = 3.7854 L/min、1 CFM = 1.699 m³/h），
        在升每分、立方米每小时、立方米每秒、升每秒、美制加仑每分、立方英尺每分六个流量单位之间实时互转，任一单位输入、其余五个联动更新；
        附花洒、水龙头、水泵、新风机、机箱风扇等 8 条场景参考流量（点行即载入换算）、m³/h↔CFM 常用速换卡，以及通风换气次数小算（风量 = 房间体积 × 换气次数）。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 输入流量
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
            placeholder="输入数值，如 16.6667"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入以当前所选单位计；体积流量不允许为负。GPM 默认按美制加仑（UK gpm ≈ 4.546 L/min）。</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="applyPreset(1, 'm3h')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 1 m³/h
          </button>
          <button
            @click="applyPreset(8, 'Lmin')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 8 L/min 花洒
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
          <p class="text-sm font-medium text-foreground mb-2">常用速换（m³/h ↔ CFM，风机档位）</p>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">m³/h → CFM</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickM3hTable"
                  :key="'m' + q.value"
                  @click="applyPreset(q.value, 'm3h')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">CFM → m³/h</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickCfmTable"
                  :key="'c' + q.value"
                  @click="applyPreset(q.value, 'cfm')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果大表 + 通风换气小算（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Droplets class="w-5 h-5 mr-2 text-primary" /> 六单位换算结果
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
                {{ r.value === null ? '—' : fmtFlow(r.value) }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            基准：1 m³/s ≡ 1 m³/s；1 L/min = 1/60000 m³/s；1 m³/h = 1/3600 m³/s；1 GPM(US) = 3.785411784 L/min（美制加仑精确定义 3.785411784 L）；
            1 CFM = 1 ft³/min = 28.316846592 L/min ≈ 1.699 m³/h（英尺按 0.3048 m 精确定义）。
          </p>
        </div>

        <!-- 通风换气次数小算 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Wind class="w-5 h-5 mr-2 text-primary" /> 通风换气次数小算
          </h2>
          <p class="text-xs text-muted-foreground mb-4">换气次数（ACH）= 风量 ÷ 房间体积。居住空间 0.5-1 次/h、教室办公室 2-4 次/h、厨房卫生间 5-10 次/h、实验室按工艺要求更高。</p>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <label class="block">
              <span class="text-xs text-muted-foreground">房间面积（m²）</span>
              <input
                v-model="roomArea"
                type="number"
                min="0"
                step="any"
                placeholder="如 16"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">层高（m）</span>
              <input
                v-model="roomHeight"
                type="number"
                min="0"
                step="any"
                placeholder="如 2.8"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">换气次数（次/h）</span>
              <input
                v-model="achValue"
                type="number"
                min="0"
                step="any"
                placeholder="如 1"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">所需风量</p>
              <p class="text-2xl font-bold text-primary font-mono">{{ achFlowM3hText }}<span class="text-xs font-normal text-muted-foreground ml-0.5">m³/h</span></p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center mb-3">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">房间体积</p>
              <p class="text-base font-bold text-foreground font-mono">{{ roomVolumeText }} m³</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">换算 L/s</p>
              <p class="text-base font-bold text-foreground font-mono">{{ achFlowLsText }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">换算 CFM</p>
              <p class="text-base font-bold text-foreground font-mono">{{ achFlowCfmText }}</p>
            </div>
          </div>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>水泵选型不能只看流量：还要按管路阻力选扬程（扬程 ≈ 静提升高度 + 管路损失），流量偏大电机易过载。燃气热负荷口径：1 m³ 天然气约放热 34-36 MJ（≈9.5-10 kWh），灶具/热水器铭牌的「kW」除以 9.7 即约需的燃气 m³/h。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        GPM 有美制（3.785 L）与英制（4.546 L）两种加仑口径，本工具按美制（国内水暖、美标卫浴五金均为 US gpm）；CFM 按标准立方英尺（非标态体积）计，风机选型时还需注意供应商标定工况（进气温湿度）。以上为体积流量换算，质量流量请另行乘密度。
      </p>
    </div>

    <!-- 场景参考表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Gauge class="w-5 h-5 mr-2 text-primary" /> 场景参考流量（点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">「≈ 换算」列由系数自动换算；实测流量随水压/静压工况变化，以产品标注为准。</p>

      <div class="overflow-x-auto">
        <div class="min-w-[640px]">
          <div class="grid grid-cols-[1.4fr_0.8fr_0.9fr_1.6fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>场景</span><span>参考值</span><span>≈ 换算</span><span>说明</span>
          </div>
          <button
            v-for="row in scenarioRows"
            :key="row.name"
            @click="loadScenario(row)"
            class="w-full grid grid-cols-[1.4fr_0.8fr_0.9fr_1.6fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center"
          >
            <span class="font-medium text-foreground">{{ row.name }}</span>
            <span class="font-mono text-foreground">{{ row.valueText }}</span>
            <span class="font-mono text-muted-foreground">{{ row.convertedText }}</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>m³/h、L/min、GPM、CFM 都是什么单位？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          体积流量是单位时间流过的体积，SI 基准是立方米每秒（m³/s），但工程上它太大，常用 m³/h（供水、燃气表）、L/min（水泵、医疗、咖啡机）、
          GPM（gallon per minute，美制卫浴与水泵，1 US gal = 3.785411784 L 精确定义）、CFM（cubic feet per minute，风机、空压机、新风行业，1 ft³ = 0.0283168 m³）。
          六者只差换算系数：1 m³/h = 16.6667 L/min = 1.6667 L/s；1 GPM = 3.7854 L/min；1 CFM = 1.699 m³/h ≈ 28.3 L/min。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">水泵选型：流量只是半个参数</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          选水泵要看「流量 + 扬程」双参数：流量决定单位时间送多少水，扬程决定能克服多大阻力（静提升高度 + 管路弯头摩擦损失）。
          同一台泵流量与扬程呈下降曲线——标「1.5 m³/h / 8 m」指工作点，抽到更高扬程时流量会明显缩水。
          家用自吸泵常见 1-3 m³/h、扬程 8-30 m；鱼缸泵按每小时循环 3-5 倍缸水体量选。另外流量偏大管阻也大（损失与流量近似平方关系），不要盲目加大泵。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">燃气 m³/h 与热负荷怎么对应？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          燃气表读的是体积流量（m³/h），灶具热水器标的是热负荷（kW）。两者靠天然气的低热值（约 34-36 MJ/m³ ≈ 9.5-10 kWh/m³）换算：
          16 L 燃气热水器满负荷约 32 kW，对应耗气约 3.3 m³/h；家用双眼灶全开约 2.5-3.5 kW，对应 0.3 m³/h 左右。
          用液化气（瓶装）时口径完全不同：液化气热值约 92-100 MJ/m³（气态）或 46 MJ/kg（液态），同功率耗气体积只有天然气约三分之一，且减压阀口径必须匹配气种。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">通风换气次数怎么算需要多大风量？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          所需风量（m³/h）= 房间体积（m³）× 换气次数（次/h）。一般卧室客厅维持 0.5-1 次/h 即可明显改善 CO₂；
          新风国标按人均 30 m³/h 或换气次数 1-2 次折算；厨房排油烟要 5-10 次/h 以上；卫生间排风 5-8 次/h。
          例：16 m² × 2.8 m 层高 = 44.8 m³，按 1 次/h 需 44.8 m³/h ≈ 12.5 L/s ≈ 26 CFM——这就是选购新风机时「额定风量 ≥ 体积 × 次数」的计算方法。风管越长弯头越多，实际到达房间的风量衰减越大，选型要留余量。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1 m³/h 等于多少 L/min？1 GPM 呢？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 m³/h = 16.6667 L/min（1 立方米 = 1000 L，1 小时 = 60 分）。1 GPM(US) = 3.7854 L/min；反之 10 GPM ≈ 37.85 L/min。英制加仑（UK gpm）= 4.546 L/min，比美制大 20%，进口设备要确认口径。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">CFM 和 m³/h 怎么换？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 CFM = 1 立方英尺每分 = 0.0283168 m³ × 60 = 1.699 m³/h。风机标注 300 CFM ≈ 510 m³/h。国产风机用 m³/h、进口风机常用 CFM，选型对比时按 1.699 折算即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">花洒流量 8 L/min 是多少 GPM？</h3>
            <p class="text-sm text-muted-foreground mt-1">8 L/min ≈ 2.11 GPM。美标节水花洒上限 2.0-2.5 GPM（约 7.6-9.5 L/min），国标节水型要求 ≤ 0.12 L/s·压力档（约 7.2 L/min）。流量过大水压不足时反而洗不痛快，看的是「压力下的实际流量」。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有换算与通风换气小算都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'flow-convert'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Droplets, Wind, Gauge, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'flow-convert'

// ---------- SEO ----------
useSeoMeta({
  title: '流量单位换算 - 在线m³/h/L/min/GPM/CFM流量换算工具',
  description: '免费在线流量单位换算，m³/h、m³/s、L/min、L/s、GPM(US)、CFM 六单位双向精确互转，附水泵选型/燃气热负荷/通风换气次数应用注记与场景参考流量表，纯浏览器本地运行不上传',
  keywords: '流量单位换算,m3h换算,lmin,GPM CFM换算,水泵流量,通风换气次数,立方米每小时',
  author: '有条工具',
  ogTitle: '流量单位换算 - 在线m³/h/L/min/GPM/CFM流量换算工具 | 有条工具',
  ogDescription: '六个流量单位精确互转，水泵选型/燃气热负荷/通风换气场景注记，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/flow-convert',
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
          name: '流量单位换算器',
          url: 'https://www.util.cn/tools/flow-convert',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['m³/h、m³/s、L/min、L/s、GPM(US)、CFM 六单位双向互转', '精确换算系数（1 GPM = 3.785411784 L/min、1 CFM = 1.699 m³/h）', '花洒/水泵/新风机/风扇 8 条场景参考流量', 'm³/h↔CFM 常用速换卡', '通风换气次数小算（面积×层高×ACH→风量）', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '流量单位换算器', item: 'https://www.util.cn/tools/flow-convert/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1 m³/h 等于多少 L/min？1 GPM 呢？',
              acceptedAnswer: { '@type': 'Answer', text: '1 m³/h = 16.6667 L/min。1 GPM(US) = 3.7854 L/min；10 GPM ≈ 37.85 L/min。英制加仑 UK gpm = 4.546 L/min，比美制大 20%，进口设备要确认口径。' }
            },
            {
              '@type': 'Question',
              name: 'CFM 和 m³/h 怎么换？',
              acceptedAnswer: { '@type': 'Answer', text: '1 CFM = 1 立方英尺每分 ≈ 1.699 m³/h。风机标注 300 CFM ≈ 510 m³/h。国产风机用 m³/h、进口风机常用 CFM，按 1.699 折算对比。' }
            },
            {
              '@type': 'Question',
              name: '花洒流量 8 L/min 是多少 GPM？',
              acceptedAnswer: { '@type': 'Answer', text: '8 L/min ≈ 2.11 GPM。美标节水花洒上限 2.0-2.5 GPM（约 7.6-9.5 L/min），国标节水型约 ≤7.2 L/min。实际体验看「压力下的实际流量」。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有换算与通风换气小算都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 换算系数以 m³/s 为基准：M3S_PER[unit] = 该单位 1 份对应多少 m³/s
const M3S_PER = {
  m3s: 1,                     // 立方米每秒（SI 基准）
  m3h: 1 / 3600,              // 立方米每小时
  Ls: 0.001,                  // 升每秒
  Lmin: 1 / 60000,            // 升每分（1 m³ = 1000 L，1 min = 60 s）
  gpm: 3.785411784 / 60000,   // 美制加仑每分（1 US gal = 3.785411784 L 精确定义）
  cfm: 0.028316846592 / 60    // 立方英尺每分（1 ft³ = 0.3048³ m³ = 0.028316846592 m³ 精确定义）
}

const UNITS = [
  { id: 'm3h', symbol: 'm³/h', name: '立方米每小时', systemLabel: '供水·燃气常用' },
  { id: 'm3s', symbol: 'm³/s', name: '立方米每秒', systemLabel: '国际单位制 SI' },
  { id: 'Lmin', symbol: 'L/min', name: '升每分钟', systemLabel: '水泵·医疗常用' },
  { id: 'Ls', symbol: 'L/s', name: '升每秒', systemLabel: '消防·新风常用' },
  { id: 'gpm', symbol: 'GPM', name: '美制加仑每分', systemLabel: '美制卫浴·水泵' },
  { id: 'cfm', symbol: 'CFM', name: '立方英尺每分', systemLabel: '风机·空压机常用' }
]

function unitById(id) {
  return UNITS.find((u) => u.id === id) || null
}

// 浮点尾差清洗：按 12 位有效数字截断；若与更低有效位的舍入值仅差相对 1e-9 以内则吸附到整值，
// 使往返换算（如 bar→psi→bar）精确回到原值，同时不损失常规换算结果的精度
function cleanFloat(v, sig = 12) {
  if (!Number.isFinite(v)) return NaN
  if (v === 0) return 0
  for (const s of [6, 8, 10]) {
    const cand = Number(v.toPrecision(s))
    if (cand !== 0 && Math.abs(v - cand) / Math.abs(v) < 1e-9) return cand
  }
  return Number(v.toPrecision(sig))
}

// 任意单位 → m³/s
function toM3s(value, unitId) {
  const k = M3S_PER[unitId]
  if (!Number.isFinite(value) || typeof k !== 'number') return NaN
  return cleanFloat(value * k)
}

// m³/s → 任意单位
function fromM3s(m3s, unitId) {
  const k = M3S_PER[unitId]
  if (!Number.isFinite(m3s) || typeof k !== 'number') return NaN
  return cleanFloat(m3s / k)
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertFlow(value, fromId, toId) {
  return fromM3s(toM3s(value, fromId), toId)
}

// 输入解析：空串 / 非数字 / 负数一律视为无效
function parseFlowInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// 展示格式化：按量级自适应小数位
function fmtFlow(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 0.0005) return v.toExponential(2)
  const d = a >= 1000 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4
  return v.toFixed(d)
}

// 通风换气：风量(m³/h) = 房间体积(m³) × 换气次数(次/h)
function achFlowM3h(areaM2, heightM, ach) {
  if (!Number.isFinite(areaM2) || !Number.isFinite(heightM) || !Number.isFinite(ach)) return NaN
  return cleanFloat(areaM2 * heightM * ach)
}
// ---------- 纯逻辑结束 ----------

// ---------- 换算状态 ----------
const inputUnit = ref('m3h')
const inputValue = ref('1')

const parsed = computed(() => parseFlowInput(inputValue.value))
const m3sValue = computed(() => (parsed.value === null ? null : toM3s(parsed.value, inputUnit.value)))
const resultRows = computed(() =>
  UNITS.map((u) => ({ ...u, value: m3sValue.value === null ? null : fromM3s(m3sValue.value, u.id) }))
)
const canCopy = computed(() => m3sValue.value !== null)

const copyText = computed(() => {
  if (m3sValue.value === null) return ''
  const unit = unitById(inputUnit.value)
  const lines = resultRows.value.map((r) => `${r.symbol}: ${fmtFlow(r.value)}`)
  return [`输入: ${parsed.value} ${unit ? unit.symbol : ''}`, ...lines].join('\n')
})

function applyPreset(value, unitId) {
  inputUnit.value = unitId
  inputValue.value = String(value)
}

function resetInput() {
  inputValue.value = ''
  copied.value = false
}

// ---------- 静态表（纯常量派生，无浏览器 API） ----------
const scenarioRows = [
  { name: '家用淋浴花洒', v: 8, unit: 'Lmin', show: 'gpm', note: '常见 6-9 L/min（1.6-2.4 GPM），节水型上限按国标/美标更低' },
  { name: '厨房水龙头', v: 6, unit: 'Lmin', show: 'gpm', note: '常见 4-6 L/min（1.1-1.6 GPM），起泡器限制实际出流' },
  { name: '美标节水花洒', v: 1.8, unit: 'gpm', show: 'Lmin', note: '1.8 GPM ≈ 6.8 L/min，美标 WaterSense 认证档' },
  { name: '家用自吸增压泵', v: 1.5, unit: 'm3h', show: 'Lmin', note: '常见 1-3 m³/h、扬程 8-30 m，按工作点曲线选型' },
  { name: '16L 燃气热水器耗气', v: 3.2, unit: 'm3h', show: 'cfm', note: '满负荷约 32 kW，对应天然气约 3.3 m³/h（低热值口径）' },
  { name: '卧室新风（1 次/h）', v: 32, unit: 'm3h', show: 'cfm', note: '按 12 m² × 2.7 m 体积 × 1 次/h，约 18.8 CFM' },
  { name: '家用壁挂新风机', v: 250, unit: 'm3h', show: 'cfm', note: '150-300 m³/h 档常见，覆盖 2-3 居室一次换气' },
  { name: '机箱风扇（12cm）', v: 40, unit: 'cfm', show: 'm3h', note: '30-70 CFM 常见，静音档衰减 30% 以上' }
].map((s) => ({
  name: s.name,
  v: s.v,
  unit: s.unit,
  valueText: `${s.v} ${unitById(s.unit)?.symbol || s.unit}`,
  convertedText: `${fmtFlow(convertFlow(s.v, s.unit, s.show))} ${unitById(s.show)?.symbol || s.show}`,
  note: s.note
}))

const quickM3hTable = [50, 100, 150, 200, 250, 300].map((v) => ({
  value: v,
  converted: fmtFlow(convertFlow(v, 'm3h', 'cfm'))
}))
const quickCfmTable = [50, 100, 150, 200, 300, 400].map((v) => ({
  value: v,
  converted: fmtFlow(convertFlow(v, 'cfm', 'm3h'))
}))

function loadScenario(row) {
  applyPreset(row.v, row.unit)
}

// ---------- 通风换气小算状态 ----------
const roomArea = ref('16')
const roomHeight = ref('2.8')
const achValue = ref('1')

const areaNum = computed(() => parseFlowInput(roomArea.value))
const heightNum = computed(() => parseFlowInput(roomHeight.value))
const achNum = computed(() => parseFlowInput(achValue.value))
const achFlowM3hVal = computed(() => achFlowM3h(areaNum.value, heightNum.value, achNum.value))

const roomVolumeText = computed(() => {
  if (areaNum.value === null || heightNum.value === null) return '—'
  const vol = cleanFloat(areaNum.value * heightNum.value)
  return Number.isFinite(vol) ? fmtFlow(vol) : '—'
})
const achFlowM3hText = computed(() => (Number.isFinite(achFlowM3hVal.value) ? fmtFlow(achFlowM3hVal.value) : '—'))
const achFlowLsText = computed(() => (Number.isFinite(achFlowM3hVal.value) ? fmtFlow(convertFlow(achFlowM3hVal.value, 'm3h', 'Ls')) : '—'))
const achFlowCfmText = computed(() => (Number.isFinite(achFlowM3hVal.value) ? fmtFlow(convertFlow(achFlowM3hVal.value, 'm3h', 'cfm')) : '—'))

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
    if (typeof s.inputValue === 'string' && parseFlowInput(s.inputValue) !== null) inputValue.value = s.inputValue
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
