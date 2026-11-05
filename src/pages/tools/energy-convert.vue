<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">能量单位换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">J / kJ / MJ / cal / kcal / Wh / kWh / BTU 八单位联动互转，1 度电 = 3.6 MJ，食物标签、电池、空调 BTU 场景注记</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线能量单位换算工具：以焦耳（J，SI）为基准的精确系数（1 kcal = 4184 J、1 kWh = 3.6 MJ、1 BTU = 1055.06 J），
        在焦耳、千焦、兆焦、卡路里、大卡、瓦时、千瓦时、英热单位八个能量单位之间实时互转，任一单位输入、其余七个联动更新；
        附 1 度电、一碗米饭、手机电池、烧开 1 L 水、电动车百公里电耗等 8 条场景参考能量（点行即载入换算）、kWh↔MJ 与 kcal↔kJ 常用速换卡，以及「功率 × 时间 → 耗电量」小算。
        空调铭牌的 BTU/h 是功率而非能量，口径提示见下。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 输入能量
        </h2>

        <div class="grid grid-cols-4 gap-1.5">
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
            placeholder="输入数值，如 3.6"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <TriangleAlert class="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入以当前所选单位计；营养学「大卡」按 kcal（1 kcal = 4184 J）计。</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="applyPreset(1, 'kwh')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 1 度电
          </button>
          <button
            @click="applyPreset(2000, 'kcal')"
            class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/15 transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> 预设 2000 kcal
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
          <p class="text-sm font-medium text-foreground mb-2">常用速换（kWh↔MJ · kcal↔kJ）</p>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">kWh → MJ</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickKwhTable"
                  :key="'k' + q.value"
                  @click="applyPreset(q.value, 'kwh')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[10px] text-muted-foreground mb-1.5">kcal → kJ</p>
              <div class="space-y-1">
                <button
                  v-for="q in quickKcalTable"
                  :key="'c' + q.value"
                  @click="applyPreset(q.value, 'kcal')"
                  class="w-full px-2 py-1 rounded-md bg-muted/40 border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition"
                >
                  {{ q.value }} = {{ q.converted }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果大表 + 耗电量小算（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Zap class="w-5 h-5 mr-2 text-primary" /> 八单位换算结果
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
                {{ r.value === null ? '—' : fmtEnergy(r.value) }}
              </p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            基准：1 J ≡ 1 J；1 kcal = 4184 J（营养学大卡，热化学卡路里精确定义 1 cal = 4.184 J）；1 Wh = 3600 J；1 kWh = 3.6 MJ（1 度电）；
            1 BTU = 1055.05585262 J（国际蒸汽表 BTU IT）。锚点：1 kWh ≈ 860 kcal，1 度电 = 3.6 MJ。
          </p>
        </div>

        <!-- 功率 × 时间 → 耗电量 小算 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 功率 × 时间 → 耗电量 小算
          </h2>
          <p class="text-xs text-muted-foreground mb-4">耗电量 = 功率 × 时间。空调、电暖器、热水器按实际工作功率估算；压缩机类设备启停占空比通常 0.4-0.7，不必按满功率乘满小时数。</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <label class="block">
              <span class="text-xs text-muted-foreground">功率（kW）</span>
              <input
                v-model="powerKwInput"
                type="number"
                min="0"
                step="any"
                placeholder="如 1.1"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">运行时长（h）</span>
              <input
                v-model="hoursInput"
                type="number"
                min="0"
                step="any"
                placeholder="如 1"
                class="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <div class="bg-primary/10 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">耗电量</p>
              <p class="text-2xl font-bold text-primary font-mono">{{ consumptionKwhText }}<span class="text-xs font-normal text-muted-foreground ml-0.5">kWh</span></p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center mb-3">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">换算 MJ</p>
              <p class="text-base font-bold text-foreground font-mono">{{ consumptionMjText }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">换算 kcal</p>
              <p class="text-base font-bold text-foreground font-mono">{{ consumptionKcalText }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">换算 BTU</p>
              <p class="text-base font-bold text-foreground font-mono">{{ consumptionBtuText }}</p>
            </div>
          </div>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>空调铭牌上的「BTU」是 BTU/h（制冷量，功率单位），不是能量——1 匹空调制冷量约 9000 BTU/h，1 小时耗电约 0.7-0.9 kWh 电而非 9000 BTU。需要按房间面积算制冷量请用本站<a href="/tools/ac-btu-calculator/" class="text-primary hover:underline">空调 BTU 计算器</a>。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="bg-muted/40 border border-border rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        「卡路里」有多套定义：本工具按食品标签通用的热化学卡（1 cal = 4.184 J、1 kcal = 4184 J）计算；BTU 采用国际蒸汽表 IT 口径（1055.05585262 J），空调行业另用 1 BTU ≈ 1055 J 的整数近似。电池能量 Wh = 电压 × 安时（mAh ÷ 1000 × V），充电宝按额定 Wh 判断能否上飞机（≤100 Wh 免申报）。
      </p>
    </div>

    <!-- 场景参考表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Gauge class="w-5 h-5 mr-2 text-primary" /> 场景参考能量（点击行载入换算）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">「≈ 换算」列由系数自动换算；食物热值因做法与配比差异较大，此处为常见均值。</p>

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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>焦耳、卡路里、千瓦时、BTU 都是什么单位？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          能量的 SI 单位是焦耳（J）＝1 瓦特功率持续 1 秒。日常各领域各用各的口语单位：
          电力用千瓦时 kWh（1 kWh = 3.6 MJ，即「1 度电」）；食品标签用大卡 kcal（1 kcal = 4184 J，欧盟标签同时标 kJ 与 kcal）；
          暖通空调用英热单位 BTU（1 BTU ≈ 1055 J，把 1 磅水升温 1°F 所需热量）；电池用瓦时 Wh（1 Wh = 3600 J）。
          这些单位互相换算只是乘一个固定系数，物理量完全相同。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">食物标签上的 kcal 与 kJ 怎么对读？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          中国与欧盟标签要求同时标注 kJ 和 kcal，换算用 1 kcal = 4.184 kJ：2000 kcal ≈ 8368 kJ ≈ 8.37 MJ。
          「卡路里」口语指的其实是大卡（kcal），运动手环「消耗 300 卡」也是 kcal——按小卡（cal）理解会差一千倍。
          注意食品热值是「消化后的代谢能」，与燃烧热值（如阿特沃特系数折算）不同；蛋白 17 kJ/g、碳水 17 kJ/g、脂肪 37 kJ/g 是国标标签的计算口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">空调 BTU/h 是功率不是能量</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          空调说的「1 匹 = 9000 BTU」实际是 BTU/h（每小时搬走 9000 英热单位的热量），它是功率口径；能量口径的 9000 BTU 等于 9.5 MJ。
          混用会闹「1 小时耗电 9000 BTU」的笑话。制冷量 2324-2600 W（约 1 匹）的空调 1 小时耗电约 0.7-0.9 kWh，
          因为还有能效比（COP/EER）：耗电量 = 制冷量 ÷ 能效比。按面积选型请直接用本站的空调 BTU 计算器，它按面积、层高、朝向给出 BTU/h 制冷量建议再换算匹数。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电池为什么用 Wh 口径？mAh 能直接比吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          mAh 只反映电荷量，不同电压下能量不同：5000 mAh × 3.7 V ≈ 18.5 Wh，同样的 mAh 在 12 V 电池上就是 60 Wh。比较电池能量一律看 Wh（= V × Ah）。
          民航规定充电宝额定能量不超过 100 Wh 可直接携带（100-160 Wh 需航司批准），所以充电宝身上印的是 Wh 而不是 mAh。
          电动车电池从 kWh 口径看更直观：60 kWh ≈ 216 MJ ≈ 14400 kcal，但人体每天只需约 8.4 MJ——别拿电池给「人充电」。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1 度电等于多少 MJ、多少 kcal？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 kWh = 3.6 MJ（精确定义，1 W × 3600 s）≈ 860 kcal。这就是「1 度电 = 3.6 MJ」的由来；反过来 8.368 MJ 才等于 2000 kcal 的每日热量——人一天吃的能量不到 1 度电的一半。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">1 BTU 等于多少 J？BTU 和 BTU/h 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 BTU(IT) = 1055.05585262 J ≈ 1055 J；BTU 是能量单位，BTU/h 是功率单位（1 BTU/h ≈ 0.293 W）。空调铭牌的「9000 BTU」实际指 9000 BTU/h 制冷量，两者不能混用。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">烧一壶 1 L 的水要多少电？</h3>
            <p class="text-sm text-muted-foreground mt-1">从 25°C 烧到 100°C 理论需要 313.8 kJ ≈ 0.087 kWh；电水壶效率约 80%，实际耗电约 0.11 kWh。若水壶标 1800 W，加热约 4 分钟——这也是校验电水壶实际功率的办法。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有换算与耗电量小算都在你的浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'energy-convert'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Zap, Timer, Gauge, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'energy-convert'

// ---------- SEO ----------
useSeoMeta({
  title: '能量单位换算 - 在线J/kJ/kcal/kWh/BTU/Wh能量换算工具',
  description: '免费在线能量单位换算，焦耳、千焦、兆焦、卡路里、大卡、瓦时、千瓦时、BTU 八单位双向精确互转，附食物标签/电池 Wh/空调 BTU 口径注记、1度电=3.6MJ 锚点与场景参考表，纯浏览器本地运行不上传',
  keywords: '能量单位换算,kj kcal换算,kwh mj,BTU 焦耳,大卡换算,度电换算,电池wh',
  author: '有条工具',
  ogTitle: '能量单位换算 - 在线J/kJ/kcal/kWh/BTU/Wh能量换算工具 | 有条工具',
  ogDescription: '八个能量单位精确互转，食物标签/电池/空调 BTU 口径注记，1 度电 = 3.6 MJ，纯本地换算。',
  ogUrl: 'https://www.util.cn/tools/energy-convert',
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
          name: '能量单位换算器',
          url: 'https://www.util.cn/tools/energy-convert',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['J/kJ/MJ/cal/kcal/Wh/kWh/BTU 八单位双向互转', '精确换算系数（1 kcal = 4184 J、1 kWh = 3.6 MJ、1 BTU = 1055.05585262 J）', '度电/米饭/电池/烧水/电动车 8 条场景参考能量', 'kWh↔MJ、kcal↔kJ 常用速换卡', '功率×时间→耗电量小算', '结果一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '能量单位换算器', item: 'https://www.util.cn/tools/energy-convert/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1 度电等于多少 MJ、多少 kcal？',
              acceptedAnswer: { '@type': 'Answer', text: '1 kWh = 3.6 MJ（精确定义）≈ 860 kcal。1 度电 = 3.6 MJ；人一天约需 8.4 MJ（2000 kcal），不到 1 度电的一半。' }
            },
            {
              '@type': 'Question',
              name: '1 BTU 等于多少 J？BTU 和 BTU/h 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '1 BTU(IT) = 1055.05585262 J ≈ 1055 J。BTU 是能量单位，BTU/h 是功率单位（1 BTU/h ≈ 0.293 W）；空调铭牌的「9000 BTU」实际指 9000 BTU/h 制冷量，不能混用。' }
            },
            {
              '@type': 'Question',
              name: '烧一壶 1 L 的水要多少电？',
              acceptedAnswer: { '@type': 'Answer', text: '从 25°C 烧到 100°C 理论需 313.8 kJ ≈ 0.087 kWh；电水壶效率约 80%，实际约 0.11 kWh。1800 W 的水壶约加热 4 分钟。' }
            },
            {
              '@type': 'Question',
              name: '换算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有换算与耗电量小算都在浏览器本地完成，不发送任何网络请求，输入数值不会被存储或上传。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 换算系数以 J（焦耳）为基准：J_PER[unit] = 该单位 1 份对应多少 J
const J_PER = {
  J: 1,               // 焦耳（SI）
  kJ: 1000,           // 千焦
  MJ: 1000000,        // 兆焦
  cal: 4.184,         // 卡路里（热化学卡，精确定义）
  kcal: 4184,         // 大卡/千卡（营养学口径）
  Wh: 3600,           // 瓦时
  kwh: 3600000,       // 千瓦时（度）
  btu: 1055.05585262  // 英热单位（国际蒸汽表 BTU IT）
}

const UNITS = [
  { id: 'J', symbol: 'J', name: '焦耳', systemLabel: '国际单位制 SI' },
  { id: 'kJ', symbol: 'kJ', name: '千焦', systemLabel: '国际单位制 SI' },
  { id: 'MJ', symbol: 'MJ', name: '兆焦', systemLabel: '国际单位制 SI' },
  { id: 'cal', symbol: 'cal', name: '卡路里', systemLabel: '热化学卡' },
  { id: 'kcal', symbol: 'kcal', name: '大卡（千卡）', systemLabel: '营养学标签' },
  { id: 'Wh', symbol: 'Wh', name: '瓦时', systemLabel: '电池·充电宝' },
  { id: 'kwh', symbol: 'kWh', name: '千瓦时（度）', systemLabel: '电力计量' },
  { id: 'btu', symbol: 'BTU', name: '英热单位', systemLabel: '暖通·空调' }
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

// 任意单位 → J
function toJ(value, unitId) {
  const k = J_PER[unitId]
  if (!Number.isFinite(value) || typeof k !== 'number') return NaN
  return cleanFloat(value * k)
}

// J → 任意单位
function fromJ(j, unitId) {
  const k = J_PER[unitId]
  if (!Number.isFinite(j) || typeof k !== 'number') return NaN
  return cleanFloat(j / k)
}

// 通用换算：value 按 fromId 输入，结果按 toId 表达
function convertEnergy(value, fromId, toId) {
  return fromJ(toJ(value, fromId), toId)
}

// 输入解析：空串 / 非数字 / 负数一律视为无效
function parseEnergyInput(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// 展示格式化：按量级自适应小数位
function fmtEnergy(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a < 0.0005) return v.toExponential(2)
  const d = a >= 1000 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4
  return v.toFixed(d)
}

// 耗电量(kWh) = 功率(kW) × 时间(h)
function energyFromPower(kw, hours) {
  if (!Number.isFinite(kw) || !Number.isFinite(hours)) return NaN
  return cleanFloat(kw * hours)
}
// ---------- 纯逻辑结束 ----------

// ---------- 换算状态 ----------
const inputUnit = ref('kwh')
const inputValue = ref('1')

const parsed = computed(() => parseEnergyInput(inputValue.value))
const jValue = computed(() => (parsed.value === null ? null : toJ(parsed.value, inputUnit.value)))
const resultRows = computed(() =>
  UNITS.map((u) => ({ ...u, value: jValue.value === null ? null : fromJ(jValue.value, u.id) }))
)
const canCopy = computed(() => jValue.value !== null)

const copyText = computed(() => {
  if (jValue.value === null) return ''
  const unit = unitById(inputUnit.value)
  const lines = resultRows.value.map((r) => `${r.symbol}: ${fmtEnergy(r.value)}`)
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
  { name: '1 度电（电表 1 格走字）', v: 1, unit: 'kwh', show: 'MJ', note: '1 kWh = 3.6 MJ ≈ 860 kcal，居民电价按此计量' },
  { name: '成人每日摄入参考', v: 2000, unit: 'kcal', show: 'MJ', note: '2000 kcal = 8.368 MJ，营养标签的日参考口径' },
  { name: '一碗米饭（200g 熟重）', v: 232, unit: 'kcal', show: 'kJ', note: '熟米饭约 116 kcal/100g，232 kcal ≈ 971 kJ' },
  { name: '手机电池（5000mAh·3.85V）', v: 19.3, unit: 'Wh', show: 'kJ', note: 'Wh = V × Ah，19.3 Wh ≈ 69.5 kJ，充电效率约 80%' },
  { name: '烧开 1 L 水（25→100°C）', v: 313.8, unit: 'kJ', show: 'Wh', note: '理论 87 Wh；电水壶效率约 80%，实际约 0.11 kWh' },
  { name: '电动车百公里电耗', v: 13, unit: 'kwh', show: 'MJ', note: '13 kWh ≈ 46.8 MJ，市区工况常见 12-15 kWh/100km' },
  { name: '空调 1.5 匹 1 小时电耗', v: 1.1, unit: 'kwh', show: 'MJ', note: '制冷量 3500 W 是 BTU/h 同类的功率口径，耗电看 COP' },
  { name: '1 L 汽油（低热值）', v: 32, unit: 'MJ', show: 'kwh', note: '约 32 MJ ≈ 8.9 kWh，发动机热效率仅 25-40%' }
].map((s) => ({
  name: s.name,
  v: s.v,
  unit: s.unit,
  valueText: `${s.v} ${unitById(s.unit)?.symbol || s.unit}`,
  convertedText: `${fmtEnergy(convertEnergy(s.v, s.unit, s.show))} ${unitById(s.show)?.symbol || s.show}`,
  note: s.note
}))

const quickKwhTable = [0.5, 1, 1.5, 2, 3, 5].map((v) => ({
  value: v,
  converted: fmtEnergy(convertEnergy(v, 'kwh', 'MJ'))
}))
const quickKcalTable = [100, 200, 500, 1000, 2000, 3000].map((v) => ({
  value: v,
  converted: fmtEnergy(convertEnergy(v, 'kcal', 'kJ'))
}))

function loadScenario(row) {
  applyPreset(row.v, row.unit)
}

// ---------- 耗电量小算状态 ----------
const powerKwInput = ref('1.1')
const hoursInput = ref('1')

const powerNum = computed(() => parseEnergyInput(powerKwInput.value))
const hoursNum = computed(() => parseEnergyInput(hoursInput.value))
const consumptionKwh = computed(() => energyFromPower(powerNum.value, hoursNum.value))

const consumptionKwhText = computed(() => (Number.isFinite(consumptionKwh.value) ? fmtEnergy(consumptionKwh.value) : '—'))
const consumptionMjText = computed(() => (Number.isFinite(consumptionKwh.value) ? fmtEnergy(convertEnergy(consumptionKwh.value, 'kwh', 'MJ')) : '—'))
const consumptionKcalText = computed(() => (Number.isFinite(consumptionKwh.value) ? fmtEnergy(convertEnergy(consumptionKwh.value, 'kwh', 'kcal')) : '—'))
const consumptionBtuText = computed(() => (Number.isFinite(consumptionKwh.value) ? fmtEnergy(convertEnergy(consumptionKwh.value, 'kwh', 'btu')) : '—'))

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
    if (typeof s.inputValue === 'string' && parseEnergyInput(s.inputValue) !== null) inputValue.value = s.inputValue
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
