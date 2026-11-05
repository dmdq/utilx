<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Activity class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">LDO压差与功耗计算</h1>
          <p class="text-sm text-muted-foreground mt-1">LDO 压差校验、功耗与结温简算：Vin/Vout/Iout 一填即判，含 θJA 预设与 DC-DC 改造提示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按压差校验（Vin−Vout ≥ Dropout@Iout）、功耗 P = (Vin−Vout)×Iout、结温 Tj = Ta + P×θJA 三步快速判定 LDO 方案是否成立：压差不足时红警提示输出将跌落，结温超 125℃ 设计红线时给出改用 DC-DC 的建议。内置 AMS1117 / LP5907 压差预设与 SOT-23 / SOT-89 / TO-252 热阻预设，全部计算在浏览器本地完成，最终以器件数据手册为准。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> LDO 压差 / 功耗 / 结温判定
        </h2>

        <!-- 工况输入 -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">输入电压 Vin（V）</label>
            <input
              v-model.number="vin"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">输出电压 Vout（V）</label>
            <input
              v-model.number="vout"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">输出电流 Iout（A）</label>
            <input
              v-model.number="iout"
              type="number"
              min="0"
              step="0.05"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <!-- LDO 预设 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">LDO 型号 / 压差预设</label>
          <select
            v-model="ldoPreset"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="(p, key) in LDO_PRESETS" :key="key" :value="key">{{ p.label }}</option>
          </select>
          <div v-if="ldoPreset === 'custom'" class="mt-2">
            <input
              v-model.number="customDropout"
              type="number"
              min="0"
              step="0.05"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="自定义 Dropout 压差（V）"
            />
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">{{ activeLdo.note }}</p>
        </div>

        <!-- 热参数 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">环境温度 Ta（℃）</label>
            <input
              v-model.number="taVal"
              type="number"
              step="5"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">密闭机壳夏季工况建议按 40~50℃ 取</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">热阻 θJA（℃/W）</label>
            <select
              v-model="thetaPreset"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="(t, key) in THETA_PRESETS" :key="key" :value="key">{{ t.label }}</option>
            </select>
            <div v-if="thetaPreset === 'custom'" class="mt-2">
              <input
                v-model.number="customTheta"
                type="number"
                min="0"
                step="5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="自定义 θJA（℃/W）"
              />
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">预设为无散热焊盘、标准 JEDEC 测试板的典型量级，务必以器件手册为准</p>
          </div>
        </div>

        <!-- 结果 -->
        <div v-if="res" class="space-y-3">
          <!-- 压差校验 -->
          <div :class="['rounded-lg p-4', res.verdict.cls === 'drop' ? 'bg-red-500/10' : res.verdict.cls === 'tight' ? 'bg-yellow-500/10' : 'bg-green-500/10']">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <XCircle v-if="res.verdict.cls === 'drop'" class="w-5 h-5 text-red-600 dark:text-red-400" />
                <AlertTriangle v-else-if="res.verdict.cls === 'tight'" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <CheckCircle2 v-else class="w-5 h-5 text-green-600 dark:text-green-400" />
                <p :class="['font-semibold', res.verdict.cls === 'drop' ? 'text-red-600 dark:text-red-400' : res.verdict.cls === 'tight' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400']">{{ res.verdict.label }}</p>
              </div>
              <p class="text-sm text-muted-foreground">裕量 {{ fmt(res.margin, 2) }} V</p>
            </div>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ res.verdict.note }}</p>
          </div>

          <!-- 功耗与结温 -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">功耗 P = (Vin−Vout)×Iout</p>
              <p class="text-3xl font-bold text-foreground">{{ fmt(res.p, 2) }} <span class="text-base">W</span></p>
              <p class="text-[10px] text-muted-foreground mt-1">全部变成热的压差损耗</p>
            </div>
            <div :class="['rounded-lg p-4 text-center', res.tier.bg]">
              <p class="text-xs text-muted-foreground mb-1">结温 Tj = Ta + P×θJA</p>
              <p :class="['text-3xl font-bold', res.tier.cls]">{{ fmt(res.tj, 1) }} <span class="text-base">℃</span></p>
              <p class="text-[10px] text-muted-foreground mt-1">ΔT = {{ fmt(res.dt, 1) }}℃（Ta={{ fmt(taVal, 0) }}℃ + P×θJA）</p>
            </div>
          </div>

          <!-- 判定 -->
          <div :class="['rounded-lg p-4', res.tier.bg]">
            <p :class="['text-sm font-semibold', res.tier.cls]">结温判定：{{ res.tier.label }}</p>
            <p class="text-xs text-muted-foreground mt-1 leading-relaxed">{{ res.tier.note }}</p>
          </div>

          <!-- DC-DC 建议（超限时显示） -->
          <NuxtLink
            v-if="res.tier.key === 'dcde'"
            to="/tools/buck-inductor-calculator"
            class="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm text-foreground hover:bg-primary/15 transition-colors"
          >
            <TrendingDown class="w-4 h-4 text-primary flex-shrink-0" />
            <span>该工况建议改用开关电源（DC-DC），电感选型可配合 <span class="text-primary font-medium">BUCK电感选型计算器</span> →</span>
          </NuxtLink>

          <!-- 效率对比 -->
          <div class="p-4 bg-muted/50 rounded-lg space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">LDO 效率 = Vout / Vin</span>
              <span class="text-foreground font-medium">{{ fmt(res.eff * 100, 1) }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">理想 Buck 效率（注记基准）</span>
              <span class="text-foreground font-medium">90%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">同工况理想 Buck 损耗 ≈ Vout×Iout×(1/0.9−1)</span>
              <span class="text-foreground font-medium">{{ fmt(res.buckLoss, 2) }} W</span>
            </div>
            <p class="text-xs text-muted-foreground pt-1">LDO 的输入电流近似等于输出电流，效率上限就是 Vout/Vin；与 Buck 的损耗差距正是 LDO 发烫的根源。Buck 换来效率要付出开关噪声与外围复杂度的代价，小电流（&lt;300mA 量级）时 LDO 仍常是正解。</p>
          </div>

          <button
            @click="copyResult"
            class="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <Clipboard class="w-3.5 h-3.5" /> 复制计算结果
          </button>
        </div>
        <div v-else class="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          请输入 Vin &gt; Vout ≥ 0、Iout &gt; 0，以及有效的压差与热阻参数。
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 判定档位 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Gauge class="w-4 h-4 mr-2 text-primary" /> 结温判定档位
          </h2>
          <div class="space-y-2.5 text-sm">
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
              <div>
                <p class="text-green-600 dark:text-green-400 font-medium">Tj &lt; 105℃ · 安心</p>
                <p class="text-xs text-muted-foreground">留有寿命与环温裕量，可长期可靠工作。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0"></span>
              <div>
                <p class="text-yellow-600 dark:text-yellow-400 font-medium">105 ~ 125℃ · 需降额</p>
                <p class="text-xs text-muted-foreground">检查手册降额曲线与最高环温工况，优先加大铺铜或换大封装。</p>
              </div>
            </div>
            <div class="flex gap-2.5 items-start">
              <span class="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
              <div>
                <p class="text-red-600 dark:text-red-400 font-medium">&gt; 125℃ · 换 DC-DC</p>
                <p class="text-xs text-muted-foreground">超过设计红线：压差 × 电流太大，LDO 不适合，改开关电源或降负载。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- θJA 参考 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <Thermometer class="w-4 h-4 mr-2 text-primary" /> 典型封装 θJA 参考
          </h2>
          <div class="text-sm space-y-1.5">
            <div v-for="(t, key) in thetaRows" :key="key" class="flex justify-between items-center py-1 border-b border-border/50">
              <span class="text-muted-foreground">{{ t.label }}</span>
              <span class="text-foreground font-medium">{{ fmt(t.value, 0) }} ℃/W</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3">以上为无散热焊盘、标准 JEDEC 测试板的典型量级，同一封装不同厂家/铺铜差异可达数倍，务必以器件手册为准。SOT-23 这类小封装 θJA 高达 250℃/W：0.5W 就要升温 125℃，是 LDO 发烫的头号原因。</p>
        </div>

        <!-- 快速自核示例 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-base font-semibold text-foreground mb-3 flex items-center">
            <FlaskConical class="w-4 h-4 mr-2 text-primary" /> 快速自核示例
          </h2>
          <div class="space-y-2">
            <button
              @click="loadExample('classic')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              发烫案例：5V→3.3V@0.3A、θJA=250、Ta=40℃ → P = 1.7×0.3 = <span class="text-foreground font-medium">0.51W</span>，ΔT = 127.5℃，Tj = <span class="text-foreground font-medium">167.5℃ 超限</span>
            </button>
            <button
              @click="loadExample('battery')"
              class="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition text-xs text-muted-foreground leading-relaxed"
            >
              压差案例：3.7V 锂电→3.3V@0.3A（AMS1117）→ 折算压差 ≈0.33V，裕量仅 <span class="text-foreground font-medium">0.07V，接近跌落</span>
            </button>
          </div>
        </div>

        <!-- 免责声明 -->
        <div class="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            本工具按线性折算与一维热阻模型快速估算：压差预设按手册典型值线性内插，θJA 预设为标准测试板量级，均未计入静态电流、铺铜并联散热与邻近热源。关键设计请以器件数据手册与实测温升为准。
          </p>
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>LDO压差与功耗计算原理</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h3 class="text-lg font-semibold text-foreground">LDO vs DC-DC：怎么选</h3>
          <p>
            LDO 把多余的电压全部变成热，效率上限 = Vout/Vin：5V 转 3.3V 只有 66%，5V 转 1.8V 只有 36%，压差越大、电流越大，发热越离谱。DC-DC（Buck）靠开关+电感搬运能量，效率普遍 85~95%，代价是开关噪声、纹波、外围器件（电感/二极管/补偿）与成本。经验法则：小电流（几百 mA 内）、压差小、对噪声敏感（模拟/射频供电）选 LDO；大电流、大压差、电池供电追求续航选 DC-DC；常见组合是 Buck 先降到略高于目标值，再用 LDO 收尾滤噪。压差大时的电感选型可配合 <NuxtLink to="/tools/buck-inductor-calculator" class="text-primary hover:underline">BUCK电感选型计算器</NuxtLink>。
          </p>
          <h3 class="text-lg font-semibold text-foreground">Dropout（压差）的定义</h3>
          <p>
            Dropout 是"LDO 还能稳住"的最小 Vin−Vout：低于它，调整管进入饱和失控区，输出 = Vin − Dropout 随输入一起跌落。手册通常标注为某电流下的值，如 AMS1117 为 1.1V@1A——压差随负载电流近似线性增大，小电流时明显更小，所以本页按线性折算估算 dropout@Iout ≈ 1.1V×Iout/1A（0.3A 约 0.33V）。校验公式：Vin_min ≥ Vout + Dropout@Iout + 裕量（建议 ≥100mV）；锂电供电场景要按放电截止电压（3.6~3.7V）而非满电 4.2V 校验。
          </p>
          <h3 class="text-lg font-semibold text-foreground">θJA 为什么这么差</h3>
          <p>
            θJA 是结到环境的热阻，SOT-23 这类小封装高达 250℃/W，原因有三：一是封装本身太小，散热面积只有引脚那一点；二是 JEDEC 标准测试板铺铜很少（低有效层、小铜箔），而实际板子铺铜会好一些但密布器件时又更差；三是塑料封装导热差，热量几乎全靠"引脚→焊盘→铺铜→空气"这条链。所以 0.5W 在 SOT-23 上就是 125℃ 温升——不是芯片差，是它根本没有散热路径。θJA 只适合"无散热措施"的粗估，需要装散热器核算时请用 <NuxtLink to="/tools/heatsink-calculator" class="text-primary hover:underline">散热热阻计算器</NuxtLink>的 θJC+散热器模型（两套口径不要混用）。
          </p>
          <h3 class="text-lg font-semibold text-foreground">散热焊盘（Thermal Pad）的作用</h3>
          <p>
            带裸露焊盘（EP/thermal pad）的封装（SOT-223、TO-252、QFN 等）把芯片衬底直接引到板面，θJA 可从 250℃/W 降到 60~90℃/W 甚至更低——前提是 PCB 上必须对应铺铜并打过孔阵列接地：典型做法是 3×3 以上 0.3mm 过孔阵列连到内层/底层大面积铺铜。漏打散热过孔是 LDO"按手册选型却仍烫"的常见原因。更精细的结温与散热器核算可用 <NuxtLink to="/tools/heatsink-calculator" class="text-primary hover:underline">散热热阻计算器</NuxtLink>（θJC + 界面 + 散热器串联模型）。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">LDO 和 DC-DC 怎么选？</span>小电流、小压差、低噪声场合选 LDO；大电流、大压差、电池续航敏感场合选 DC-DC；也可以 Buck 粗降 + LDO 精滤组合。</li>
            <li><span class="text-foreground font-medium">Dropout 是什么意思？</span>LDO 维持稳压所需的最小输入输出电压差；输入低于 Vout+Dropout 时输出将跟随输入跌落、纹波抑制失效。</li>
            <li><span class="text-foreground font-medium">为什么 SOT-23 封装的 LDO 特别烫？</span>θJA 高达约 250℃/W，封装几乎没有散热路径，0.5W 功耗就要升温约 125℃；降负载、换大封装或加铺铜是仅有的手段。</li>
            <li><span class="text-foreground font-medium">散热焊盘一定要接 PCB 铺铜吗？</span>是。裸露焊盘必须焊到铺铜区并用过孔阵列连接到地平面，否则封装的低热阻优势完全发挥不出来。</li>
          </ul>
          <p class="text-xs pt-2 border-t border-border/50">压差与热阻参数以器件数据手册为准，本工具为快速估算。</p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ldo-dropout'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Activity, Calculator, Gauge, Thermometer, FlaskConical, AlertTriangle, Clipboard, ChevronUp, ChevronDown, CheckCircle2, XCircle, TrendingDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'LDO压差与功耗计算 - 结温判定与DC-DC对比 | Util工具箱',
  description: '在线 LDO 压差与功耗计算器：压差校验（Vin−Vout ≥ Dropout@Iout，不足红警）、功耗 P=(Vin−Vout)×Iout、结温 Tj=Ta+P×θJA 判定（安心/降额/换DC-DC），内置 AMS1117/LP5907 压差与 SOT-23 等热阻预设，纯本地计算',
  keywords: 'LDO压差, LDO功耗计算, dropout电压, LDO结温, LDO发热, θJA, 线性稳压, AMS1117, LP5907, LDO vs DC-DC, ldo calculator',
  author: 'Util工具箱',
  ogTitle: 'LDO压差与功耗计算 - 结温判定与DC-DC对比',
  ogDescription: '压差校验、功耗与结温简算，θJA 预设，超限自动提示改用 DC-DC',
  ogUrl: 'https://www.util.cn/tools/ldo-dropout',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'LDO压差与功耗计算',
          url: 'https://www.util.cn/tools/ldo-dropout',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['压差校验与跌落红警', '功耗 P=(Vin−Vout)×Iout', '结温 Tj=Ta+P×θJA 判定', 'AMS1117/LP5907 压差预设', 'SOT-23/SOT-89/TO-252 热阻预设', 'LDO 与 Buck 效率对比']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'LDO压差与功耗计算', item: 'https://www.util.cn/tools/ldo-dropout' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'LDO 和 DC-DC 应该怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '小电流、小压差、低噪声场合选 LDO；大电流、大压差、电池续航敏感场合选 DC-DC；也可以 Buck 粗降压差后用 LDO 收尾滤噪。' }
            },
            {
              '@type': 'Question',
              name: 'LDO 的 Dropout 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: 'Dropout 是 LDO 维持稳压所需的最小输入输出电压差，随负载电流近似线性增大；输入低于 Vout+Dropout 时输出将跟随输入跌落。' }
            },
            {
              '@type': 'Question',
              name: '为什么 SOT-23 封装的 LDO 特别烫？',
              acceptedAnswer: { '@type': 'Answer', text: 'SOT-23 的 θJA 高达约 250℃/W，封装几乎没有散热路径，0.5W 功耗就要升温约 125℃，只能降负载、换大封装或加大铺铜。' }
            },
            {
              '@type': 'Question',
              name: 'LDO 的散热焊盘要不要接 PCB 铺铜？',
              acceptedAnswer: { '@type': 'Answer', text: '必须接。裸露焊盘要焊到铺铜区并用过孔阵列连到地平面，否则封装的低热阻优势完全发挥不出来。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'ldo-dropout'
const STORE_KEY = TOOL_ID + ':inputs'
const tool = tools.find(t => t.id === TOOL_ID)

// ===== PURE-FNS-START（节点单测按标记抽取本段执行；保持自包含，勿引用外部变量）=====
// LDO 压差预设：dropout 为手册典型值，iRef 为对应电流；linear=true 时按线性折算到实际负载
const LDO_PRESETS = {
  ams1117: { label: 'AMS1117（1.1V@1A · 线性折算）', dropout: 1.1, iRef: 1, linear: true, note: '手册典型压差 1.1V@1A，本页按线性折算 dropout@Iout ≈ 1.1V×Iout/1A（0.3A ≈ 0.33V）；实测曲线随批次略高，仅作粗估。' },
  lp5907: { label: 'LP5907（0.12V@250mA · 线性折算）', dropout: 0.12, iRef: 0.25, linear: true, note: '超低压差 LDO，手册 120mV@250mA，按线性折算；适合 3.3V→3.0V 等小压差低噪声场合。' },
  custom: { label: '自定义（固定压差）', dropout: 0.5, iRef: 0, linear: false, note: '填入手册给出的 Dropout（如 0.5V@200mA），本页按固定值校验，不随负载折算。' }
}

// 封装 θJA 预设（℃/W）：无散热焊盘、标准 JEDEC 测试板量级，以手册为准
const THETA_PRESETS = {
  sot23: { label: 'SOT-23（250℃/W）', value: 250 },
  sot89: { label: 'SOT-89（125℃/W）', value: 125 },
  to252: { label: 'TO-252 / DPAK（60℃/W）', value: 60 },
  sot223: { label: 'SOT-223（90℃/W）', value: 90 },
  custom: { label: '自定义 θJA…', value: null }
}

// 有效压差：线性预设按 Iout/Iref 折算，自定义按固定值
const dropoutEffV = (presetKey, ioutA, customV) => {
  const p = LDO_PRESETS[presetKey] || LDO_PRESETS.custom
  if (p.linear) {
    if (!(ioutA > 0) || !isFinite(ioutA)) return NaN
    return p.dropout * ioutA / p.iRef
  }
  const v = typeof customV === 'number' && isFinite(customV) ? customV : NaN
  return v
}

// 压差裕量与校验结论
const dropoutMarginV = (vin, vout, dropoutEff) => {
  if (!isFinite(vin) || !isFinite(vout) || !isFinite(dropoutEff)) return NaN
  return vin - vout - dropoutEff
}
const dropoutVerdict = (margin) => {
  if (!isFinite(margin)) {
    return { cls: 'drop', label: '输入无效', note: '请检查 Vin、Vout 与压差参数。' }
  }
  if (margin < 0) {
    return { cls: 'drop', label: '输出将跌落', note: 'Vin−Vout 小于该负载下的压差需求：输出将随输入跌落、纹波抑制失效，电路可能欠压复位。需抬高 Vin、降低 Vout，或换低压差型号。' }
  }
  if (margin < 0.1) {
    return { cls: 'tight', label: '裕量偏小', note: '压差裕量不足 100mV：输入电压再跌一点（电池放电、负载浪涌）就会跌破压差，建议换低压差型号或抬高输入。' }
  }
  return { cls: 'ok', label: '压差校验通过', note: 'Vin−Vout 大于该负载下的压差需求且留有裕量，LDO 可正常稳压。' }
}

// 功耗 P = (Vin−Vout)×Iout，返回 W
const ldoPowerW = (vin, vout, iout) => {
  if (!isFinite(vin) || !isFinite(vout) || !(iout > 0)) return NaN
  if (vin <= vout) return NaN
  return (vin - vout) * iout
}

// 结温 Tj = Ta + P×θJA
const junctionTemp = (taC, pW, theta) => {
  if (!isFinite(taC) || !(pW >= 0) || !(theta > 0)) return NaN
  return taC + pW * theta
}

// 结温判定档：105℃ 安心 / 105~125℃ 降额 / >125℃ 换 DC-DC
const tempTier = (tj) => {
  if (!isFinite(tj)) {
    return { key: 'invalid', label: '输入无效', cls: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', note: '请检查输入。' }
  }
  if (tj < 105) {
    return { key: 'ok', label: '安心', cls: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', note: '低于 105℃，留有寿命与环温裕量，可长期可靠工作。' }
  }
  if (tj <= 125) {
    return { key: 'derate', label: '需降额', cls: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', note: '进入降额区：核对手册降额曲线与最高环温工况，优先加大铺铜、换大封装或降低功耗。' }
  }
  return { key: 'dcde', label: '超限 · 建议换 DC-DC', cls: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', note: '超过 125℃ 设计红线：压差 × 电流的发热 LDO 扛不住，改用开关电源（DC-DC）、降压差或降负载。' }
}

// LDO 效率 = Vout/Vin（输入电流近似等于输出电流）
const ldoEfficiency = (vout, vin) => {
  if (!isFinite(vout) || !isFinite(vin) || !(vin > 0)) return NaN
  return vout / vin
}

// 同工况理想 Buck（90% 效率）的损耗 ≈ Pout×(1/0.9−1)
const buckLossW = (vout, iout) => {
  if (!isFinite(vout) || !isFinite(iout) || !(iout > 0)) return NaN
  return vout * iout * (1 / 0.9 - 1)
}
// ===== PURE-FNS-END =====

// ---------- 状态 ----------
const vin = ref(5)
const vout = ref(3.3)
const iout = ref(0.3)
const ldoPreset = ref('ams1117')
const customDropout = ref(0.5)
const taVal = ref(40)
const thetaPreset = ref('sot23')
const customTheta = ref(150)

const activeLdo = computed(() => LDO_PRESETS[ldoPreset.value] || LDO_PRESETS.custom)
const thetaRows = computed(() => ['sot23', 'sot89', 'sot223', 'to252'].map(k => THETA_PRESETS[k]))

// 交互记录与输入持久化（SSR 安全：localStorage 仅在客户端执行）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.vin === 'number') vin.value = s.vin
      if (typeof s.vout === 'number') vout.value = s.vout
      if (typeof s.iout === 'number') iout.value = s.iout
      if (typeof s.ldoPreset === 'string' && LDO_PRESETS[s.ldoPreset]) ldoPreset.value = s.ldoPreset
      if (typeof s.customDropout === 'number') customDropout.value = s.customDropout
      if (typeof s.ta === 'number') taVal.value = s.ta
      if (typeof s.thetaPreset === 'string' && THETA_PRESETS[s.thetaPreset]) thetaPreset.value = s.thetaPreset
      if (typeof s.customTheta === 'number') customTheta.value = s.customTheta
    }
  } catch (e) { /* 忽略恢复失败 */ }
})

const persist = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      vin: vin.value, vout: vout.value, iout: iout.value,
      ldoPreset: ldoPreset.value, customDropout: customDropout.value,
      ta: taVal.value, thetaPreset: thetaPreset.value, customTheta: customTheta.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}
watch([vin, vout, iout, ldoPreset, customDropout, taVal, thetaPreset, customTheta], persist)

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : NaN)

// ---------- 数字格式化（避免浮点尾差） ----------
const fmt = (v, digits = 2) => {
  if (typeof v !== 'number' || !isFinite(v)) return '—'
  return Number(v.toFixed(digits)).toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

// ---------- 主计算 ----------
const res = computed(() => {
  const vi = num(vin.value), vo = num(vout.value), io = num(iout.value)
  const vd = dropoutEffV(ldoPreset.value, io, customDropout.value)
  if (!isFinite(vi) || !isFinite(vo) || !(io > 0) || !isFinite(vd) || vi <= vo) return null
  const p = ldoPowerW(vi, vo, io)
  const theta = thetaPreset.value === 'custom' ? num(customTheta.value) : THETA_PRESETS[thetaPreset.value].value
  if (!isFinite(p) || !isFinite(theta) || !(theta > 0)) return null
  const margin = dropoutMarginV(vi, vo, vd)
  const dt = p * theta
  const tj = junctionTemp(taVal.value, p, theta)
  return {
    vd,
    margin,
    verdict: dropoutVerdict(margin),
    p,
    dt,
    tj,
    tier: tempTier(tj),
    eff: ldoEfficiency(vo, vi),
    buckLoss: buckLossW(vo, io)
  }
})

// ---------- 交互 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (kind) => {
  if (kind === 'classic') {
    vin.value = 5
    vout.value = 3.3
    iout.value = 0.3
    ldoPreset.value = 'ams1117'
    taVal.value = 40
    thetaPreset.value = 'sot23'
  } else {
    vin.value = 3.7
    vout.value = 3.3
    iout.value = 0.3
    ldoPreset.value = 'ams1117'
    taVal.value = 40
    thetaPreset.value = 'sot89'
  }
}

const copyResult = async () => {
  if (!res.value) { alert('当前输入不完整，无法复制'); return }
  const lines = []
  lines.push('【LDO压差与功耗】')
  lines.push('Vin=' + fmt(vin.value, 2) + 'V, Vout=' + fmt(vout.value, 2) + 'V, Iout=' + fmt(iout.value, 2) + 'A, LDO：' + activeLdo.value.label)
  lines.push('压差校验：需求 ' + fmt(res.value.vd, 2) + 'V，实际 Vin−Vout=' + fmt(vin.value - vout.value, 2) + 'V，裕量 ' + fmt(res.value.margin, 2) + 'V（' + res.value.verdict.label + '）')
  lines.push('功耗 P=' + fmt(res.value.p, 2) + 'W，θJA=' + (thetaPreset.value === 'custom' ? fmt(customTheta.value, 0) : fmt(THETA_PRESETS[thetaPreset.value].value, 0)) + '℃/W')
  lines.push('结温 Tj=' + fmt(res.value.tj, 1) + '℃（ΔT=' + fmt(res.value.dt, 1) + '℃，Ta=' + fmt(taVal.value, 0) + '℃）→ ' + res.value.tier.label)
  lines.push('LDO 效率 ' + fmt(res.value.eff * 100, 1) + '%（理想 Buck 90%，同工况损耗 ≈' + fmt(res.value.buckLoss, 2) + 'W）')
  lines.push('—— 来自 Util工具箱·LDO压差与功耗计算')
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}
</script>
