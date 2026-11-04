<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gauge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">三相功率因数补偿计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">无功补偿电容容量 / 补偿后电流 / 三组均分投切，电机配电、配电柜改造常用的功率因数核对工具</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线功率因数补偿计算器：输入三相线电压、线电流与当前、目标功率因数，按 P = √3·U·I·cosφ 计算有功功率，
        用 Q = P×(tanφ₁ − tanφ₂) 精确求出所需无功补偿容量（kvar），并给出补偿后线电流与电流下降幅度；
        补偿容量按三组均分，附投切方式建议。cosφ 与 tanφ 全程用 acos/atan 精确换算，不用近似表。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 诚实口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        本工具按工频稳态三相平衡工况计算，所得 kvar 为「需要在电机端口并接的电容器组容量」；实际选型请对照电容器标准规格（如 5/10/15/20/30/40 kvar）就近取档，
        并避免过补偿（cosφ₂ 建议 ≤0.95 即可，盲目补到 1 轻载时易过补偿抬升电压）。变压器与线路自身的无功、谐波放大问题不在本工具范围内。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 运行参数
        </h2>

        <div>
          <label :for="uid + '-u'" class="block text-sm font-medium text-foreground">线电压 U（V）</label>
          <input
            :id="uid + '-u'"
            v-model.number="voltage"
            type="number"
            min="100"
            max="10000"
            step="1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="如 380"
          >
          <p class="text-xs text-muted-foreground mt-1">380V 低压最常见，也可填 660、6kV 等高压口径（线电压，非相电压）</p>
        </div>

        <div>
          <label :for="uid + '-i'" class="block text-sm font-medium text-foreground">线电流 I（A）</label>
          <input
            :id="uid + '-i'"
            v-model.number="currentA"
            type="number"
            min="0.1"
            max="10000"
            step="0.1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="如 100"
          >
          <p class="text-xs text-muted-foreground mt-1">用钳形表实测或电机铭牌额定电流；三相平衡按任一相线电流填写</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label :for="uid + '-cos1'" class="block text-sm font-medium text-foreground">当前功率因数 cosφ₁</label>
            <input
              :id="uid + '-cos1'"
              v-model.number="cosPhi1"
              type="number"
              min="0.1"
              max="1"
              step="0.01"
              class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 0.7"
            >
            <p class="text-xs text-muted-foreground mt-1">实测有功/视在之比，或功率因数表读数</p>
          </div>
          <div>
            <label :for="uid + '-cos2'" class="block text-sm font-medium text-foreground">目标功率因数 cosφ₂</label>
            <input
              :id="uid + '-cos2'"
              v-model.number="cosPhi2"
              type="number"
              min="0.1"
              max="1"
              step="0.01"
              class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 0.95"
            >
            <p class="text-xs text-muted-foreground mt-1">力调电费考核一般 ≥0.9，建议取 0.92–0.95</p>
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">场景预设（期望值已手算核对）</p>
          <div class="space-y-2">
            <button
              v-for="p in presets"
              :key="p.name"
              type="button"
              @click="applyPreset(p)"
              class="w-full text-left px-3 py-2 bg-muted/50 hover:bg-muted border border-border rounded-lg text-xs transition"
            >
              <Play class="w-3.5 h-3.5 inline mr-1.5 text-primary -mt-0.5" />
              <span class="font-medium text-foreground">{{ p.name }}</span>
              <span class="text-muted-foreground"> · {{ p.desc }} · 预期 {{ p.expect }}</span>
            </button>
          </div>
        </div>

        <button
          @click="onCompute"
          class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 计算补偿容量
        </button>

        <button
          @click="resetInputs"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          重置默认参数
        </button>
      </div>

      <!-- 右：结果区 -->
      <div class="space-y-4">
        <!-- 核心结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 补偿容量与电流变化
          </h2>

          <div v-if="inputsValid" class="space-y-4">
            <!-- 无需补偿提示 -->
            <div v-if="noNeedCompensation" class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <TriangleAlert class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-foreground">目标低于当前（或相等），无需补偿</p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                  当前 cosφ₁={{ n2(cosPhi1) }} 已不低于目标 cosφ₂={{ n2(cosPhi2) }}，投入电容只会过补偿。若想进一步提质，请把目标调到高于 {{ n2(cosPhi1) }}。
                </p>
              </div>
            </div>

            <template v-else>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-primary/10 rounded-lg p-4 text-center border border-primary/30">
                  <p class="text-xs text-muted-foreground mb-1">所需补偿容量 Q</p>
                  <p class="text-5xl font-bold leading-tight text-primary">{{ n1(reactiveKvar) }}<span class="text-xl"> kvar</span></p>
                  <p class="text-xs text-muted-foreground mt-1.5">Q = P × (tanφ₁ − tanφ₂)</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">补偿后线电流 I₂</p>
                  <p class="text-2xl font-bold text-foreground mt-2">{{ n1(afterCurrent) }} A</p>
                  <p class="text-xs text-muted-foreground mt-1.5">
                    由 {{ n1(currentA) }} A 降至 {{ n1(afterCurrent) }} A，<span class="text-green-600 dark:text-green-400 font-semibold">下降 {{ n1(currentDropPct) }}%</span>
                  </p>
                </div>
              </div>

              <!-- 三组均分 -->
              <div class="p-4 bg-muted/50 rounded-lg border border-border">
                <p class="text-sm font-medium text-foreground flex items-center mb-2">
                  <Boxes class="w-4 h-4 mr-1.5 text-primary" /> 按三组均分投切
                </p>
                <div class="grid grid-cols-3 gap-2 mb-2">
                  <div class="bg-card border border-border rounded-lg p-2 text-center">
                    <p class="text-[10px] text-muted-foreground">第 1 组</p>
                    <p class="text-base font-bold text-foreground font-mono">{{ n1(groupKvar) }} kvar</p>
                  </div>
                  <div class="bg-card border border-border rounded-lg p-2 text-center">
                    <p class="text-[10px] text-muted-foreground">第 2 组</p>
                    <p class="text-base font-bold text-foreground font-mono">{{ n1(groupKvar) }} kvar</p>
                  </div>
                  <div class="bg-card border border-border rounded-lg p-2 text-center">
                    <p class="text-[10px] text-muted-foreground">第 3 组</p>
                    <p class="text-base font-bold text-foreground font-mono">{{ n1(groupKvar) }} kvar</p>
                  </div>
                </div>
                <p class="text-xs leading-relaxed text-muted-foreground">
                  {{ switchingAdvice }}
                </p>
              </div>
            </template>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查参数：电压 &gt;0，电流 &gt;0，cosφ₁、cosφ₂ 均在 0.1–1 之间。</p>
            </div>
          </div>
        </div>

        <!-- 中间量明细卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 计算过程明细
          </h2>
          <div v-if="inputsValid" class="space-y-2">
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-muted-foreground">tanφ₁（acos/atan 精确换算）</span>
              <span class="font-mono font-semibold text-foreground">{{ n4(tan1) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-muted-foreground">tanφ₂（acos/atan 精确换算）</span>
              <span class="font-mono font-semibold text-foreground">{{ n4(tan2) }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-muted-foreground">有功功率 P = √3·U·I·cosφ₁</span>
              <span class="font-mono font-semibold text-foreground">{{ n2(activeKw) }} kW</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-muted-foreground">视在功率 S = √3·U·I</span>
              <span class="font-mono font-semibold text-foreground">{{ n2(apparentKva) }} kVA</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-sm text-muted-foreground">需补偿的无功差 ΔQ = P×(tanφ₁−tanφ₂)</span>
              <span class="font-mono font-semibold text-foreground">{{ n2(reactiveKvar) }} kvar</span>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground mt-2">
              有功 P 不变是补偿的前提：电容器只就地提供感性负载消耗的无功，电动机轴上出力不变，线路电流因此从
              {{ n1(currentA) }} A 降到 {{ n1(afterCurrent) }} A（I₂ = P / (√3·U·cosφ₂)）。
            </p>
          </div>
          <div v-else class="p-4 text-center text-sm text-muted-foreground">输入有效参数后展示计算过程</div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>功率因数补偿的公式怎么来的？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          三相平衡负载中，线电压 U、线电流 I 与功率因数 cosφ 的关系是 P = √3·U·I·cosφ（P 为有功功率，单位 W；本工具换算为 kW）。
          无功 Q = P·tanφ，补偿就是在负载两端并接电容器，让电容器发出的容性无功抵消感性负载吸收的无功：
          所需补偿容量 Q<sub>C</sub> = P×(tanφ₁ − tanφ₂)，其中 φ₁、φ₂ 分别是补偿前、后的功率因数角。
          本工具用 tanφ = tan(acos(cosφ)) 精确换算，不使用工程手册里的近似系数表，二者在常用区间误差很小，但精确式在 cosφ 接近 1 时更稳。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么补偿后电流会变小？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          电动机需要的有功功率没变（轴上出力不变），但无功改由就近的电容器供给后，不再从电网远距离输送，
          线路只需要承载与有功对应的电流：I₂ = P / (√3·U·cosφ₂)。cosφ 从 0.7 提到 0.95 时，电流约降到原来的 73.7%（下降约 26%），
          线路损耗按 I²R 算更是降到约 54%——「省电」主要体现在降损和释放变压器容量，而不是电机本身少耗电。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">补偿容量为什么要分三组投切？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          负载是波动的：满载和空载需要的补偿量不同。把 Q<sub>C</sub> 按三组均分（每组 Q<sub>C</sub>/3），
          配合 JKW 系列功率因数自动补偿控制器按 1→2→3 顺序延时逐级投入、先投先切，轻载时只投部分组即可贴合实际需求，
          避免一次性全投入导致过补偿（cosφ 越前、母线电压抬升、电容器与变压器承受额外应力）。
          单台电机就地补偿场景也可以把三组简化为一级固定投切，随电机启停。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">目标功率因数取多少合适？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          国内电网对用户功率因数的考核线一般是 0.9（力调电费奖惩口径），工程上通常补到 0.92–0.95 留一点余量即可，
          不建议补到 1.0：负载低谷时容易过补偿，轻载电机还会因自激产生过电压风险。本工具在 cosφ₂ ≤ cosφ₁ 时会明确提示「目标低于当前，无需补偿」。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">补偿后的电流下降，电费会少吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              有功电量基本不变，电度电费不会因此下降；收益来自三处：一是功率因数达标后的力调电费奖励（或免罚），
              二是线路与变压器损耗下降，三是变压器释放了容量——原 100A 线路补到 0.95 后只需约 74A，同一台变压器可以多带负载。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算出来的 kvar 怎么变成实际电容配置？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              就近取电容器标准规格（BSMJ 自愈式并联电容器常见 5/10/15/20/30/40 kvar），三组均分时每组取最接近的规格再核对总容量，
              误差 ±10% 以内通常可接受；宁小勿大，过补偿比欠补偿危害更大。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">单相与三相场景可以用本工具吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              本工具按三相平衡口径（√3·U·I·cosφ）计算，适合三相电机与三相配电柜。单相小功率场景请用 P = U·I·cosφ 与 Q = P×(tanφ₁−tanφ₂) 自行换算，U、I 取单相值。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">cosφ₁ 和 cosφ₂ 填反了会怎样？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              本工具会检测到「目标低于当前，无需补偿」并给出提示，不会输出负的补偿容量；请确认 φ₁ 是当前值、φ₂ 是目标值后重新计算。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'motor-power-factor-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Gauge, Calculator, CheckCircle, TriangleAlert, Info,
  RefreshCw, Play, ChevronUp, ChevronDown, Boxes, ListChecks
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '三相功率因数补偿计算器 - 无功补偿电容容量 kvar 在线计算',
  description: '免费在线三相功率因数补偿计算器：输入线电压、线电流与当前/目标 cosφ，按 √3·U·I·cosφ 求有功功率，用 tanφ 精确计算所需无功补偿容量 kvar、补偿后线电流与电流下降百分比，补偿容量按三组均分并给出投切建议，电机配电与电容柜改造必备，纯浏览器本地运行不上传',
  keywords: '功率因数补偿计算,无功补偿电容容量,cosφ tanφ 计算,power factor correction calculator,三相电机补偿 kvar',
  author: '有条工具',
  ogTitle: '三相功率因数补偿计算器 - 无功补偿电容容量 kvar 在线计算 | 有条工具',
  ogDescription: '输入 U、I、cosφ 即得所需补偿 kvar、补偿后电流与三组均分投切方案，acos/atan 精确换算，本地计算。',
  ogUrl: 'https://www.util.cn/tools/motor-power-factor-calculator',
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
          name: '三相功率因数补偿计算器',
          url: 'https://www.util.cn/tools/motor-power-factor-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['有功功率 P=√3·U·I·cosφ 计算', '补偿容量 Q=P×(tanφ₁−tanφ₂) 精确计算', '补偿后线电流与电流下降百分比', '补偿容量三组均分与投切方式建议', '目标低于当前时无需补偿提示', '场景预设一键载入', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '三相功率因数补偿计算器', item: 'https://www.util.cn/tools/motor-power-factor-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '补偿后的电流下降，电费会少吗？',
              acceptedAnswer: { '@type': 'Answer', text: '有功电量基本不变，收益来自力调电费奖惩、线路与变压器损耗下降、以及变压器释放容量三处。' }
            },
            {
              '@type': 'Question',
              name: '目标功率因数取多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '考核线一般为 0.9，工程上补到 0.92–0.95 留余量即可，不建议补到 1.0，避免轻载过补偿与自激过电压。' }
            },
            {
              '@type': 'Question',
              name: '补偿容量为什么要分三组投切？',
              acceptedAnswer: { '@type': 'Answer', text: '负载波动时按三组均分配合自动补偿控制器逐级投入、先投先切，可贴合实际需求并避免过补偿。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const SQRT3 = Math.sqrt(3)

// 有功功率：P = √3·U·I·cosφ，返回 kW
function activePowerKw(u, i, cosPhi) {
  if (!(u > 0) || !(i > 0) || !(cosPhi > 0) || cosPhi > 1) return 0
  return (SQRT3 * u * i * cosPhi) / 1000
}

// tanφ = tan(acos(cosφ))，精确换算，不用近似表
function tanOfCos(cosPhi) {
  if (!(cosPhi > 0) || cosPhi > 1) return null
  return Math.tan(Math.acos(cosPhi))
}

// 所需补偿容量：Q = P×(tanφ₁ − tanφ₂)，kvar（P 为 kW）
function compensationKvar(pKw, cosPhi1, cosPhi2) {
  const t1 = tanOfCos(cosPhi1), t2 = tanOfCos(cosPhi2)
  if (t1 === null || t2 === null || !(pKw > 0)) return 0
  return pKw * (t1 - t2)
}

// 补偿后线电流：I₂ = P / (√3·U·cosφ₂)，P 为 kW → 返回 A
function afterCompensationCurrent(pKw, u, cosPhi2) {
  if (!(u > 0) || !(cosPhi2 > 0) || cosPhi2 > 1) return 0
  return (pKw * 1000) / (SQRT3 * u * cosPhi2)
}

// ---------- 状态与交互 ----------
const DEFAULTS = { voltage: 380, currentA: 100, cosPhi1: 0.7, cosPhi2: 0.95 }

const uid = 'pfc'
const voltage = ref(DEFAULTS.voltage)
const currentA = ref(DEFAULTS.currentA)
const cosPhi1 = ref(DEFAULTS.cosPhi1)
const cosPhi2 = ref(DEFAULTS.cosPhi2)
const seoContentVisible = ref(true)

const inputsValid = computed(() =>
  Number(voltage.value) > 0 &&
  Number(currentA.value) > 0 &&
  Number(cosPhi1.value) > 0 && Number(cosPhi1.value) <= 1 &&
  Number(cosPhi2.value) > 0 && Number(cosPhi2.value) <= 1
)

// 目标低于当前（或相等）→ 无需补偿
const noNeedCompensation = computed(() =>
  inputsValid.value && Number(cosPhi2.value) <= Number(cosPhi1.value)
)

const activeKw = computed(() => activePowerKw(Number(voltage.value), Number(currentA.value), Number(cosPhi1.value)))
const apparentKva = computed(() =>
  Number(voltage.value) > 0 && Number(currentA.value) > 0
    ? (SQRT3 * Number(voltage.value) * Number(currentA.value)) / 1000
    : 0
)
const tan1 = computed(() => tanOfCos(Number(cosPhi1.value)))
const tan2 = computed(() => tanOfCos(Number(cosPhi2.value)))
const reactiveKvar = computed(() => (noNeedCompensation.value ? 0 : compensationKvar(activeKw.value, Number(cosPhi1.value), Number(cosPhi2.value))))
const groupKvar = computed(() => reactiveKvar.value / 3)
const afterCurrent = computed(() => afterCompensationCurrent(activeKw.value, Number(voltage.value), Number(cosPhi2.value)))
const currentDropPct = computed(() =>
  Number(currentA.value) > 0 ? ((Number(currentA.value) - afterCurrent.value) / Number(currentA.value)) * 100 : 0
)

const switchingAdvice = computed(() => {
  const q = n1(reactiveKvar.value)
  const g = n1(groupKvar.value)
  return `总容量 ${q} kvar 按三组均分，每组 ${g} kvar：建议采用「一组固定常投承担基础无功 + 两组经功率因数自动控制器延时逐级投入（先投先切）」的方式，轻载只投部分组，避免过补偿。`
})

// ---------- 场景预设（期望值为 acos/atan 精确口径手算值） ----------
const presets = [
  {
    name: '① 45kW 电机实测',
    desc: '380V · 100A · cosφ₁ 0.7 → 0.95',
    expect: 'P≈46.07kW / Q≈31.9kvar / I₂≈73.7A',
    values: { voltage: 380, currentA: 100, cosPhi1: 0.7, cosPhi2: 0.95 }
  },
  {
    name: '② 风机轻微欠补',
    desc: '380V · 60A · cosφ₁ 0.8 → 0.92',
    expect: 'P≈31.6kW / Q≈10.2kvar / I₂≈52.2A',
    values: { voltage: 380, currentA: 60, cosPhi1: 0.8, cosPhi2: 0.92 }
  },
  {
    name: '③ 目标低于当前（演示提示）',
    desc: '380V · 50A · cosφ₁ 0.9 → 0.85',
    expect: '提示「无需补偿」',
    values: { voltage: 380, currentA: 50, cosPhi1: 0.9, cosPhi2: 0.85 }
  }
]

function applyPreset(p) {
  voltage.value = p.values.voltage
  currentA.value = p.values.currentA
  cosPhi1.value = p.values.cosPhi1
  cosPhi2.value = p.values.cosPhi2
}

function resetInputs() {
  voltage.value = DEFAULTS.voltage
  currentA.value = DEFAULTS.currentA
  cosPhi1.value = DEFAULTS.cosPhi1
  cosPhi2.value = DEFAULTS.cosPhi2
}

// 主计算按钮：本地即时重算 + 记录最近使用
function onCompute() {
  addRecentTool('motor-power-factor-calculator')
}

// ---------- 展示格式化 ----------
const n4 = (v) => (Number.isFinite(v) ? v.toFixed(4) : '—')
const n2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : '—')
const n1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : '—')

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('motor-power-factor-calculator')
})
</script>
