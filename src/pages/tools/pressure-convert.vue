<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scale class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">压力单位换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">Pa / kPa / MPa / bar / mbar / psi / atm / mmHg / inHg / kgf/cm² 十单位联动互转，胎压、真空、血压、液压场景参考，表压绝压口径注记</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线压力单位换算工具：以帕斯卡（Pa，SI 导出单位）为基准的精确系数（1 bar = 100 kPa、1 atm = 101325 Pa、1 psi = 6.894757 kPa、1 mmHg = 133.322 Pa、1 kgf/cm² = 98.0665 kPa），
        在十个常用压力单位之间实时互转，任一单位输入、其余九个联动更新；附标准大气压、家用胎压、公路车胎压、血压、真空包装、液压系统等 8 条场景参考压力（点行即载入换算）、
        bar↔psi 常用速换卡，以及表压↔绝压速查。换算系数本身不区分表压/绝压口径（同一单位制下系数一致），口径提示见下方注记。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 输入压力
        </h2>

        <div class="grid grid-cols-5 gap-1.5">
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
            step="any"
            placeholder="输入数值，如 2.3"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入以当前所选单位计；表压可为负（真空），换算系数不区分表压/绝压。</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="applyPreset(1, 'atm')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 1 atm
          </button>
          <button
            @click="applyPreset(2.3, 'bar')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 2.3 bar 胎压
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
          <p class="text-sm font-medium text-foreground mb-2">常用速换（bar ↔ psi，胎压档位）</p>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">bar → psi</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickBarTable"
                  :key="'b' + q.value"
                  @click="applyPreset(q.value, 'bar')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">psi → bar</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickPsiTable"
                  :key="'p' + q.value"
                  @click="applyPreset(q.value, 'psi')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果大表 + 表压绝压速查（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Scale class="w-5 h-5 mr-2 text-primary" /> 十单位换算结果
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
                {{ r.value === null ? '—' : fmtPressure(r.value) }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            基准：1 Pa ≡ 1 N/m²；1 bar = 100 kPa；1 atm = 101325 Pa（精确定义）；1 psi = 6.894757 kPa；1 mmHg = 133.322 Pa（0°C 惯用值，Torr 精确定义为 101325/760 Pa ≈ 133.322368 Pa）；1 inHg = 3386.389 Pa ≈ 25.4 × mmHg；1 kgf/cm² = 98.0665 kPa（工程大气压 at）。
          </p>
        </div>

        <!-- 表压 ↔ 绝压速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Info class="w-5 h-5 mr-2 text-primary" /> 表压 ↔ 绝压速查
          </h2>
          <p class="text-xs text-muted-foreground mb-4">绝压 = 表压 + 大气压。按下海平面标准大气压 1.01325 bar 修正；高原地区按当地气象气压修正（拉萨约 0.65 bar）。</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <label class="block sm:col-span-2">
              <span class="text-xs text-muted-foreground">表压（bar gauge，胎压计/压力表读数）</span>
              <input
                v-model="gaugeBarInput"
                type="number"
                step="any"
                placeholder="如 2.3"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">换算为绝压</p>
              <p class="text-2xl font-bold text-primary font-mono">{{ absBarText }}<span class="text-xs font-normal text-muted-foreground ml-0.5">bar abs</span></p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center mb-3">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">绝压（kPa）</p>
              <p class="text-base font-bold text-foreground font-mono">{{ absKpaText }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">绝压（psi）</p>
              <p class="text-base font-bold text-foreground font-mono">{{ absPsiText }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">相对真空度</p>
              <p class="text-base font-bold text-foreground font-mono">{{ vacuumPctText }}</p>
            </div>
          </div>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>胎压计、压力表读的几乎都是表压（gauge）；科学计算与真空工艺用绝压（absolute）。真空表的「-95 kPa」指低于大气压 95 kPa，绝压 ≈ 6.3 kPa；负压数值越小（越接近 -101.325 kPa）越接近完全真空。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        换算系数为精确/惯用定义值，表压与绝压共用同一套系数（口径只影响零点，不影响倍率）；mmHg 采用 133.322 Pa 惯用值，故 1 atm 换算为 760.002 mmHg 而非整数 760——Torr 的精确定义是 101325/760 Pa，两者相差不到百万分之三。压力仪表读数请以检定证书为准。
      </p>
    </div>

    <!-- 场景参考表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Gauge class="w-5 h-5 mr-2 text-primary" /> 场景参考压力（点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">「≈ 换算」列由系数自动换算；具体设备以铭牌、维修手册或医嘱为准。</p>

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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>Pa、bar、psi、mmHg 都是什么单位？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          压力是单位面积上的力，国际单位制里是帕斯卡（Pa）＝1 牛顿每平方米。Pa 太小，工程上常用 kPa、MPa 与巴（bar，1 bar = 100 kPa，气象学的 mbar 即 hPa）；
          psi（pound-force per square inch，磅力每平方英寸）是美制主流，胎压计、空压机铭牌上常见；atm（标准大气压）精确定义为 101325 Pa；
          mmHg（毫米汞柱）来自水银气压计，医学血压、真空技术仍在使用；inHg（英寸汞柱）见 于美制气象与航空高度表；
          kgf/cm²（千克力每平方厘米，旧称「工程大气压 at」）在国产老设备铭牌和液压行业遗留较多。它们都是同一物理量，只是标尺不同。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">表压（gauge）和绝压（absolute）差一个大气压</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同一个压力状态可以有两种读数：表压以当地大气压为零点（压力表在空气中读 0），绝压以完全真空为零点。换算关系 ≈ 绝压 = 表压 + 1.01325 bar（标准大气压下）。
          所以胎压计读 2.3 bar（表压）时，胎内绝压约 3.31 bar；真空表的「-95 kPa」表示比大气压低 95 kPa，对应绝压约 6.3 kPa。
          采购阀门、真空泵、密封件时务必确认口径：标「PN10」「真空 -0.1 MPa」的通常是表压口径，标「bara」「kPa abs」的是绝压口径。本工具换算倍率对两种口径通用，只读数字即可。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么 1 atm 换算出来是 760.002 mmHg 而不是正好 760？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          因为「标准大气压」与「毫米汞柱」如今是两条独立定义：1 atm 精确定义为 101325 Pa，而 mmHg 常用的 0°C 惯用值是 133.322 Pa（水银 0°C 密度 13595.1 kg/m³ × g 的乘积取整）。
          101325 ÷ 133.322 = 760.002，差在小数点后第三位。真空行业为了消除这个尾巴，把 Torr 精确定义为 1 atm/760 = 101325/760 Pa ≈ 133.322368 Pa，所以「1 atm = 760 Torr」按 Torr 定义恰好成立，
          而按 mmHg 惯用值则出现 760.002。两者相对差约 3 ppm，日常与医学场景完全可忽略；高精度真空工艺请直接按 Torr 或 Pa 口径传递。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">胎压 2.3 bar 到底是多少 psi？真空「负压」怎么读？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1 bar = 14.5038 psi，所以 2.3 bar ≈ 33.4 psi。家用车冷态胎压常见 2.2-2.5 bar（32-36 psi），以 B 柱铭牌为准；美式胎压计只标 psi 时按同一系数反算即可。
          真空口径有三套常见说法：表压负值（-95 kPa）、绝压（6.3 kPa）、相对真空度（-95/101.325 ≈ -93.8%，即「93.8% 真空度」）。
          采购真空泵/真空袋时先问清口径再对照换算，否则会差一个大气压（约 15 psi / 1 bar），密封件选型与吸盘吸附力计算都会出错。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">kgf/cm² 与 bar 为什么几乎相等？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1 kgf/cm² = 98066.5 Pa = 0.980665 bar，与 1 bar 只差约 2%。因为 1 bar 约等于「每平方厘米承受 1 公斤力」，早期工程界把它当作「一个大气压≈1 kgf/cm²」的近似使用，
          后来 bar 被定义为精确的 100 kPa。老液压表、空压机铭牌上的「at」「kgf/cm²」按 0.980665 折算成 bar，切勿按 1:1 直接读数——满量程 250 kgf/cm² 的表按 bar 读会引入 2% 系统偏差。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">胎压 2.3 bar 是多少 psi？2.5 bar 呢？</h3>
            <p class="text-sm text-muted-foreground mt-1">2.3 bar × 14.5038 ≈ 33.4 psi；2.5 bar ≈ 36.3 psi。家用车以 B 柱铭牌标注为准（常见 2.2-2.5 bar / 32-36 psi 冷态），测量应在停车 3 小时以上或行驶不足 2 km 的冷态下进行。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">1 atm、1 bar、1 kgf/cm² 为什么不一样？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 atm 精确定义 101325 Pa；1 bar 定义为精确的 100000 Pa（≈ 1 atm 的 98.7%）；1 kgf/cm² = 98066.5 Pa（≈ 1 bar 的 98.1%）。三者是历史上三种「近似一个大气压」的独立定义，数值接近但互不相等，换算请用精确系数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">mmHg 和 Torr 有区别吗？血压 mmHg 换 kPa 是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">Torr 按 101325/760 Pa 精确定义，mmHg 常用 133.322 Pa 惯用值，相差约 3 ppm，医学上通用。血压 120/80 mmHg ≈ 16.0/10.7 kPa；国内医学教材已推荐 kPa，但临床惯用 mmHg。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有换算与表压/绝压速查都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pressure-convert'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Scale, Gauge, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'pressure-convert'

// ---------- SEO ----------
useSeoMeta({
  title: '压力单位换算 - 在线Pa/kPa/MPa/bar/psi/atm/mmHg压力换算工具',
  description: '免费在线压力单位换算，Pa、kPa、MPa、bar、mbar、psi、atm、mmHg(Torr)、inHg、kgf/cm² 十单位双向精确互转，附胎压/真空/血压/液压场景参考表、bar↔psi 速换卡与表压绝压口径注记，纯浏览器本地运行不上传',
  keywords: '压力单位换算,pa bar psi换算,兆帕换算,mmHg kPa,胎压bar psi,标准大气压,表压绝压',
  author: '有条工具',
  ogTitle: '压力单位换算 - 在线Pa/kPa/MPa/bar/psi/atm/mmHg压力换算工具 | 有条工具',
  ogDescription: '十个压力单位精确互转，胎压/真空/血压场景参考与表压绝压口径注记，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/pressure-convert',
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
          name: '压力单位换算器',
          url: 'https://www.util.cn/tools/pressure-convert',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Pa/kPa/MPa/bar/mbar/psi/atm/mmHg/inHg/kgf/cm² 十单位双向互转', '精确换算系数（1 bar = 100 kPa、1 atm = 101325 Pa）', '胎压/真空/血压/液压 8 条场景参考压力', 'bar↔psi 常用速换卡', '表压↔绝压速查与真空度换算', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '压力单位换算器', item: 'https://www.util.cn/tools/pressure-convert/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '胎压 2.3 bar 是多少 psi？2.5 bar 呢？',
              acceptedAnswer: { '@type': 'Answer', text: '2.3 bar × 14.5038 ≈ 33.4 psi；2.5 bar ≈ 36.3 psi。家用车以 B 柱铭牌为准（常见 2.2-2.5 bar / 32-36 psi 冷态），冷态测量为准。' }
            },
            {
              '@type': 'Question',
              name: '1 atm、1 bar、1 kgf/cm² 为什么不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '1 atm 精确定义 101325 Pa；1 bar 定义为精确的 100000 Pa；1 kgf/cm² = 98066.5 Pa。三者是历史上三种「近似一个大气压」的独立定义，数值接近但互不相等，换算请用精确系数。' }
            },
            {
              '@type': 'Question',
              name: 'mmHg 和 Torr 有区别吗？血压 mmHg 换 kPa 是多少？',
              acceptedAnswer: { '@type': 'Answer', text: 'Torr 按 101325/760 Pa 精确定义，mmHg 常用 133.322 Pa 惯用值，相差约 3 ppm，医学上通用。血压 120/80 mmHg ≈ 16.0/10.7 kPa。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有换算与表压/绝压速查都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 换算系数以 Pa（帕斯卡）为基准：PA_PER[unit] = 该单位 1 份对应多少 Pa
const PA_PER = {
  Pa: 1,                // 帕斯卡：1 N/m²（SI）
  kPa: 1000,            // 千帕
  MPa: 1000000,         // 兆帕
  bar: 100000,          // 巴：1 bar = 100 kPa（精确定义）
  mbar: 100,            // 毫巴（= hPa，气象学常用）
  psi: 6894.757293168,  // 磅力每平方英寸：1 lbf / (1 in)²
  atm: 101325,          // 标准大气压：精确定义
  mmhg: 133.322,        // 毫米汞柱（0°C 惯用值）；Torr 精确定义为 101325/760 Pa
  inhg: 3386.389,       // 英寸汞柱（0°C 惯用值）≈ 25.4 × mmHg
  kgfcm2: 98066.5       // 千克力每平方厘米：1 kgf / (1 cm)²，旧称工程大气压 at
}

const UNITS = [
  { id: 'Pa', symbol: 'Pa', name: '帕斯卡', systemLabel: '国际单位制 SI' },
  { id: 'kPa', symbol: 'kPa', name: '千帕', systemLabel: '国际单位制 SI' },
  { id: 'MPa', symbol: 'MPa', name: '兆帕', systemLabel: '国际单位制 SI' },
  { id: 'bar', symbol: 'bar', name: '巴', systemLabel: '米制·非 SI' },
  { id: 'mbar', symbol: 'mbar', name: '毫巴', systemLabel: '气象学常用' },
  { id: 'psi', symbol: 'psi', name: '磅力/平方英寸', systemLabel: '英制' },
  { id: 'atm', symbol: 'atm', name: '标准大气压', systemLabel: '精确定义' },
  { id: 'mmhg', symbol: 'mmHg', name: '毫米汞柱（Torr）', systemLabel: '医学·真空常用' },
  { id: 'inhg', symbol: 'inHg', name: '英寸汞柱', systemLabel: '英制·航空' },
  { id: 'kgfcm2', symbol: 'kgf/cm²', name: '千克力/平方厘米', systemLabel: '米制工程单位（at）' }
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

// 任意单位 → Pa
function toPa(value, unitId) {
  const k = PA_PER[unitId]
  if (!Number.isFinite(value) || typeof k !== 'number') return NaN
  return cleanFloat(value * k)
}

// Pa → 任意单位
function fromPa(pa, unitId) {
  const k = PA_PER[unitId]
  if (!Number.isFinite(pa) || typeof k !== 'number') return NaN
  return cleanFloat(pa / k)
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertPressure(value, fromId, toId) {
  return fromPa(toPa(value, fromId), toId)
}

// 输入解析：空串 / 非数字视为无效；允许负值（表压真空口径）
function parsePressureInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// 展示格式化：按量级自适应小数位
function fmtPressure(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 0.0005) return v.toExponential(2)
  const d = a >= 1000 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4
  return v.toFixed(d)
}

// 表压 ↔ 绝压（按标准大气压 1.01325 bar 修正，单位均为 bar）
function gaugeToAbs(gaugeBar) {
  if (!Number.isFinite(gaugeBar)) return NaN
  return cleanFloat(gaugeBar + 1.01325)
}
function absToGauge(absBar) {
  if (!Number.isFinite(absBar)) return NaN
  return cleanFloat(absBar - 1.01325)
}

// 场景参考压力（公开常见值；换算列由系数自动生成）
const SCENARIOS = [
  { name: '标准大气压（海平面）', v: 1, unit: 'atm', show: 'bar', note: '1 atm = 101.325 kPa = 1.01325 bar = 14.696 psi = 760 mmHg（Torr 口径）' },
  { name: '家用车冷态胎压', v: 2.3, unit: 'bar', show: 'psi', note: '常见 2.2-2.5 bar（32-36 psi），以 B 柱铭牌为准，冷态测量' },
  { name: '公路自行车胎压', v: 5.5, unit: 'bar', show: 'psi', note: '常见 4-6.5 bar（58-94 psi），以胎侧标注为准' },
  { name: '医学血压·收缩压 120', v: 120, unit: 'mmhg', show: 'kPa', note: '120 mmHg ≈ 16 kPa；舒张压 80 mmHg ≈ 10.7 kPa' },
  { name: '真空包装机（表压）', v: -95, unit: 'kPa', show: 'atm', note: '表压 -95 kPa，绝压 ≈ 6.3 kPa，即约 94% 真空度' },
  { name: '自来水入户水压', v: 3, unit: 'bar', show: 'MPa', note: '典型 2-4 bar（0.2-0.4 MPa），静压夜间偏高' },
  { name: '家用高压锅（表压）', v: 0.9, unit: 'bar', show: 'kPa', note: '70-100 kPa 表压档，绝压约 1.7-2.0 bar，限压阀排气为正常' },
  { name: '工程机械液压系统', v: 16, unit: 'MPa', show: 'psi', note: '16-35 MPa（2300-5000 psi）常见，以液压图与铭牌为准' }
]

// 场景行展示数据：换算列由系数自动换算 + 载入值取参考值
function buildScenarioRows() {
  return SCENARIOS.map((s) => ({
    name: s.name,
    v: s.v,
    unit: s.unit,
    valueText: `${s.v} ${unitById(s.unit)?.symbol || s.unit}`,
    convertedText: `${fmtPressure(convertPressure(s.v, s.unit, s.show))} ${unitById(s.show)?.symbol || s.show}`,
    note: s.note
  }))
}

// 常用速换表：bar ↔ psi，胎压常见档位
function buildQuickTable(unitId, otherId, values) {
  return values.map((v) => ({
    value: v,
    converted: fmtPressure(convertPressure(v, unitId, otherId))
  }))
}
// ---------- 纯逻辑结束 ----------

// ---------- 换算状态 ----------
const inputUnit = ref('bar')
const inputValue = ref('2.3')

const parsed = computed(() => parsePressureInput(inputValue.value))
const paValue = computed(() => (parsed.value === null ? null : toPa(parsed.value, inputUnit.value)))
const resultRows = computed(() =>
  UNITS.map((u) => ({ ...u, value: paValue.value === null ? null : fromPa(paValue.value, u.id) }))
)
const canCopy = computed(() => paValue.value !== null)

const copyText = computed(() => {
  if (paValue.value === null) return ''
  const unit = unitById(inputUnit.value)
  const lines = resultRows.value.map((r) => `${r.symbol}: ${fmtPressure(r.value)}`)
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
const scenarioRows = buildScenarioRows()
const quickBarTable = buildQuickTable('bar', 'psi', [0.5, 1, 1.5, 2, 2.5, 3])
const quickPsiTable = buildQuickTable('psi', 'bar', [10, 20, 30, 35, 40, 60])

function loadScenario(row) {
  applyPreset(row.v, row.unit)
}

// ---------- 表压绝压速查状态 ----------
const gaugeBarInput = ref('2.3')
const gaugeParsed = computed(() => parsePressureInput(gaugeBarInput.value))
const absBar = computed(() => (gaugeParsed.value === null ? NaN : gaugeToAbs(gaugeParsed.value)))
const absBarText = computed(() => (Number.isFinite(absBar.value) ? fmtPressure(absBar.value) : '—'))
const absKpaText = computed(() => (Number.isFinite(absBar.value) ? fmtPressure(convertPressure(absBar.value, 'bar', 'kPa')) : '—'))
const absPsiText = computed(() => (Number.isFinite(absBar.value) ? fmtPressure(convertPressure(absBar.value, 'bar', 'psi')) : '—'))
// 相对真空度：低于大气压部分占大气压的比例（负百分比表示未完全真空）
const vacuumPctText = computed(() => {
  if (gaugeParsed.value === null) return '—'
  const pct = (gaugeParsed.value / 1.01325) * 100
  return Number.isFinite(pct) ? `${fmtPressure(pct)}%` : '—'
})

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
    if (typeof s.inputValue === 'string' && parsePressureInput(s.inputValue) !== null) inputValue.value = s.inputValue
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
