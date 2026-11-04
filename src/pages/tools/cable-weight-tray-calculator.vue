<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cable class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">导线重量与桥架填充率计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">电缆每公里重量 / 多行线缆清单解析 / 桥架填充率 40% 红线判定，采购估重与桥架选型快速核对工具</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线导线重量与桥架填充率计算器：选截面（1.5–400mm²）、芯数与铜/铝材质，按 S×密度×芯数×1.02 绞合系数计算导体理论重量（kg/km 与 kg/m）；
        桥架填充率支持多行「截面×根数」清单解析，自动汇总线缆截面积、桥架截面积与填充率百分比，并按 ≤40% 规范红线判定合格或超标（红色提示）。
        内置 YJV-4×25 等常见规格示例一键载入。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 诚实口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        重量为<strong>导体理论值，不含绝缘、护套与钢铠</strong>，绞合系数按 1.02 计，成品电缆实际重量通常还需加上护套（查厂家样本，一般比导体重 20%–60%）；
        填充率按<strong>导体截面之和</strong>估算，未含绝缘外皮——多芯电缆外接圆面积远大于导体截面之和，该估算偏宽松，精确选桥架应按电缆外径计算。
        40% 红线为桥架内电力电缆总截面（含外护层）与桥架横断面之比的规范惯用上限（控制电缆可放宽至 50%），具体以设计文件与当地审图要求为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- ① 导体重量：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Weight class="w-5 h-5 mr-2 text-primary" /> 导体理论重量
        </h2>

        <div>
          <p class="text-sm font-medium text-foreground">导体材质（g·cm⁻³）</p>
          <div class="flex rounded-lg border border-border overflow-hidden mt-1.5" role="group" aria-label="导体材质">
            <button
              type="button"
              @click="material = 'copper'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="material === 'copper' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              铜 8.89
            </button>
            <button
              type="button"
              @click="material = 'aluminum'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="material === 'aluminum' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              铝 2.7
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label :for="uid + '-area'" class="block text-sm font-medium text-foreground">标称截面 S（mm²）</label>
            <select
              :id="uid + '-area'"
              v-model.number="areaMm2"
              class="w-full mt-1.5 px-2.5 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="s in STD_AREAS" :key="s" :value="s">{{ s }} mm²</option>
            </select>
          </div>
          <div>
            <label :for="uid + '-cores'" class="block text-sm font-medium text-foreground">芯数</label>
            <select
              :id="uid + '-cores'"
              v-model.number="cores"
              class="w-full mt-1.5 px-2.5 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="c in [1, 2, 3, 4, 5]" :key="c" :value="c">{{ c }} 芯</option>
            </select>
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">规格预设</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in weightPresets"
              :key="p.name"
              type="button"
              @click="applyWeightPreset(p)"
              class="px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-lg text-xs transition"
              :class="material === p.material && areaMm2 === p.area && cores === p.cores ? 'ring-1 ring-primary' : ''"
            >
              <Play class="w-3 h-3 inline mr-1 text-primary -mt-0.5" />
              <span class="font-medium text-foreground">{{ p.name }}</span>
            </button>
          </div>
        </div>

        <p class="text-xs leading-relaxed text-muted-foreground">
          公式：重量(kg/km) = S(mm²) × 密度(g/cm³) × 芯数 × 1.02。1mm² 导体每米体积恰为 1cm³，故截面×密度即每米克重。
          绞合系数 1.02 计入多股绞合后实际长度略增——本工具统一按 1.02 口径（不绞合系数取 1 时数值约低 2%）。
        </p>
      </div>

      <!-- ① 导体重量：结果 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 重量结果（导体理论值）
        </h2>

        <div v-if="areaMm2 > 0" class="space-y-3">
          <div class="bg-primary/10 rounded-lg p-5 text-center border border-primary/30">
            <p class="text-xs text-muted-foreground mb-1">每公里重量（{{ materialLabel }} · {{ areaMm2 }}mm² · {{ cores }} 芯）</p>
            <p class="text-4xl font-bold leading-tight text-primary">{{ n1(weightPerKm) }}<span class="text-lg"> kg/km</span></p>
            <p class="text-xs text-muted-foreground mt-1.5">折合 {{ n3(weightPerM) }} kg/m</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">单芯每公里</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ n1(singleCorePerKm) }} kg/km</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">单芯每米</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ n3(singleCorePerM) }} kg/m</p>
            </div>
          </div>
          <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/50 border border-border text-foreground">
            采购估重提示：上值为铜/铝导体部分。护套与填充料按厂家样本另加（YJV 系列成品重量常为导体重量的 1.2–1.6 倍），
            盘长按「米标」计价时可直接用本页 kg/m × 采购米数估算铜重核价。
          </p>
        </div>
        <div v-else class="p-8 text-center text-sm text-muted-foreground">请选择截面与芯数</div>
      </div>

      <!-- ② 桥架填充率：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Boxes class="w-5 h-5 mr-2 text-primary" /> 桥架填充率
        </h2>

        <div>
          <label :for="uid + '-w'" class="block text-sm font-medium text-foreground">桥架内宽 × 高（mm）</label>
          <div class="flex items-center gap-2 mt-1.5">
            <input
              :id="uid + '-w'"
              v-model.number="trayWidth"
              type="number"
              min="10"
              max="1200"
              step="5"
              class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="宽 100"
            >
            <span class="text-muted-foreground">×</span>
            <input
              :id="uid + '-h'"
              v-model.number="trayHeight"
              type="number"
              min="10"
              max="300"
              step="5"
              class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="高 50"
            >
            <span class="text-sm text-muted-foreground">mm</span>
          </div>
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="t in TRAY_PRESETS"
              :key="t.label"
              type="button"
              @click="trayWidth = t.w; trayHeight = t.h"
              class="px-2.5 py-1 bg-muted/50 hover:bg-muted border border-border rounded-lg text-xs text-muted-foreground transition"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <label :for="uid + '-list'" class="block text-sm font-medium text-foreground">线缆清单（每行：截面×根数）</label>
            <button
              type="button"
              @click="loadSample"
              class="text-xs text-primary hover:underline"
            >
              示例（YJV-4×25）一键载入
            </button>
          </div>
          <textarea
            :id="uid + '-list'"
            v-model="cableList"
            rows="6"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="每行一条，格式：截面×根数，如&#10;2.5×10&#10;25×8&#10;4×2"
          ></textarea>
          <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
            支持用 × / x / * 分隔；以 # 开头的行视为注释忽略。多芯电缆按「单芯截面 × 总芯数」折算根数，如 YJV-4×25 两根电缆填 25×8。
          </p>
        </div>
      </div>

      <!-- ② 桥架填充率：结果 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 填充率判定（红线 ≤40%）
        </h2>

        <div v-if="trayArea > 0 && parsedRows.length > 0" class="space-y-3">
          <div
            class="rounded-lg p-5 text-center border"
            :class="fillOverLimit ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/20'"
          >
            <p class="text-xs text-muted-foreground mb-1">桥架填充率</p>
            <p class="text-4xl font-bold leading-tight" :class="fillOverLimit ? 'text-destructive' : 'text-green-600 dark:text-green-400'">
              {{ n1(fillPct) }}<span class="text-lg">%</span>
            </p>
            <p class="text-xs mt-1.5" :class="fillOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'">
              {{ fillVerdictText }}
            </p>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">线缆截面积合计</p>
              <p class="text-base font-bold text-foreground font-mono">{{ n1(totalCableArea) }} mm²</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">桥架截面积</p>
              <p class="text-base font-bold text-foreground font-mono">{{ n0(trayArea) }} mm²</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">折合线缆根数</p>
              <p class="text-base font-bold text-foreground font-mono">{{ n0(totalCount) }} 根</p>
            </div>
          </div>

          <!-- 解析明细 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="grid grid-cols-3 gap-2 px-3 py-2 bg-muted/60 text-xs text-muted-foreground">
              <span>清单行</span>
              <span class="text-center">折算</span>
              <span class="text-right">截面积</span>
            </div>
            <div
              v-for="(row, idx) in parsedRows"
              :key="idx"
              class="grid grid-cols-3 gap-2 px-3 py-2 text-xs border-t border-border"
            >
              <span class="font-mono text-foreground">{{ row.raw }}</span>
              <span class="text-center text-muted-foreground">{{ row.s }}mm² × {{ row.n }}</span>
              <span class="text-right font-mono text-foreground">{{ n1(row.area) }} mm²</span>
            </div>
          </div>

          <div v-if="invalidLines.length > 0" class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-foreground">
              有 {{ invalidLines.length }} 行未能解析（仅识别「截面×根数」，如 2.5×10）：<span class="font-mono">{{ invalidLines.join('；') }}</span>
            </p>
          </div>
        </div>

        <div v-else class="p-8 text-center text-sm text-muted-foreground">
          填写桥架宽高并在清单中输入至少一行有效数据（如 2.5×10）后显示判定
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>导线重量怎么算？为什么乘 1.02？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          导体重量按体积×密度计算：1mm² 截面的导体每米长度体积恰为 1cm³，所以单芯每米克重 = 截面×密度（铜 8.89、铝 2.7 g/cm³），
          每公里公斤数再乘 1000。乘 1.02 是绞合系数：多股单线绞合成导体后实际长度比标称长约 2%，实际用量与重量随之增加。
          本页结果为<strong>导体理论值，不含绝缘、护套与钢铠</strong>——YJV 成品电缆的护套与填充料一般再占导体重量的 20%–60%，
          精确重量请查厂家样本；粗略核价时用导体重 ×1.3 左右初估 YJV 常规规格是常用手法。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">桥架填充率的 40% 红线从哪来？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          电缆在桥架（托盘）内敷设时，电力电缆总截面面积与桥架横断面面积之比的惯用上限为 40%（控制电缆可放宽至 50%），
          常见于 GB 50054《低压配电设计规范》、GB 50217《电力工程电缆设计规范》相关条文及设计手册的工程口径。
          留 60% 空隙的目的：一是散热（桥架内电缆集中发热，载流量要打校正系数）；二是施工时能穿得进去、抽得出来；
          三是后期增加回路有裕量。本页按导体截面之和估算，未含护层外径，结果偏宽松——严格判定应按电缆外径计算外接圆面积。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">多芯电缆的清单怎么填？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本页清单口径是「单芯截面×根数（按芯计）」：一根 YJV-4×25 就是 25×4，两根就是 25×8；
          单芯电缆如 BV-2.5 十根就是 2.5×10。这样与「Σ S×根数」的截面积汇总口径一致，便于快速核对。
          示例按钮可一键载入一段含注释行的完整清单，注释行（#开头）不参与计算，方便您在清单里标注回路用途。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">算出的重量和称重差多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              差在护套与绞合：本页只算导体并乘 1.02 绞合系数，成品电缆还含绝缘、填充与护套，YJV 多芯电缆成品重量通常为导体重的 1.2–1.6 倍；
              精确数据以厂家样本「单位长度重量」为准，本页适合快速估重、核铜价与预算毛重。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">填充率超了 40% 怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              优先加大一档桥架宽度或高度、或改双层/并排敷设；动力与控制电缆宜分槽并加隔板；
              也可把部分回路改穿管或走电缆沟。注意超标的另一面是散热：桥架内集中敷设时载流量需乘 0.7–0.9 左右的校正系数，密排电缆更严。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">铜价怎么用这个工具核？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              用导体重量结果换算：每公里铜重（kg）× 当日铜价（元/kg）即得每公里铜材成本，再乘采购米数除以 1000；
              与厂家报价对比可判断报价中铜价部分是否合理，铝芯同理。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">清单里能写型号吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              解析器只识别「截面×根数」的行，其余行（含文字）会列入未解析提示且不参与计算。
              建议型号写在 # 注释行里，例如「# YJV-4×25 空调机房」，下一行写 25×4，既保留台账信息又不影响计算。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'cable-weight-tray-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Cable, Weight, Boxes, CheckCircle, TriangleAlert, Info,
  Play, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '导线重量与桥架填充率计算器 - 电缆每公里重量在线计算',
  description: '免费在线导线重量与桥架填充率计算器：选截面、芯数、铜/铝材质按 S×密度×芯数×1.02 计算导体理论重量 kg/km 与 kg/m，多行「截面×根数」清单解析桥架填充率并按 ≤40% 红线判定合格或超标，YJV-4×25 等示例一键载入，采购估重与桥架选型必备，纯浏览器本地运行不上传',
  keywords: '电缆每米重量,铜排重量计算,桥架填充率计算,cable weight per km,电缆桥架 40%',
  author: '有条工具',
  ogTitle: '导线重量与桥架填充率计算器 - 电缆每公里重量在线计算 | 有条工具',
  ogDescription: '截面×芯数×材质即得导体 kg/km，多行线缆清单自动解析填充率并按 40% 红线判定，本地计算不上传。',
  ogUrl: 'https://www.util.cn/tools/cable-weight-tray-calculator',
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
          name: '导线重量与桥架填充率计算器',
          url: 'https://www.util.cn/tools/cable-weight-tray-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['1.5–400mm² 标准截面铜/铝导体重量 kg/km 与 kg/m', '芯数 1–5 与 1.02 绞合系数口径', '多行「截面×根数」线缆清单解析', '桥架截面积与填充率百分比计算', '40% 规范红线合格/超标判定', 'YJV-4×25 等常见规格示例一键载入', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '导线重量与桥架填充率计算器', item: 'https://www.util.cn/tools/cable-weight-tray-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '算出的重量和称重差多少？',
              acceptedAnswer: { '@type': 'Answer', text: '本页只算导体并乘 1.02 绞合系数，不含绝缘护套；YJV 多芯电缆成品重量通常为导体重的 1.2–1.6 倍，精确值以厂家样本为准。' }
            },
            {
              '@type': 'Question',
              name: '桥架填充率的 40% 红线从哪来？',
              acceptedAnswer: { '@type': 'Answer', text: '桥架内电力电缆总截面与桥架横断面之比的惯用上限为 40%（控制电缆可放宽至 50%），常见于 GB 50054、GB 50217 相关条文及设计手册的工程口径。' }
            },
            {
              '@type': 'Question',
              name: '多芯电缆的清单怎么填？',
              acceptedAnswer: { '@type': 'Answer', text: '按「单芯截面×总芯数」折算根数：一根 YJV-4×25 填 25×4，两根填 25×8；# 开头的注释行不参与计算。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 密度口径 g/cm³：铜 8.89、铝 2.7；绞合系数 1.02
const DENSITY = { copper: 8.89, aluminum: 2.7 }
const STRAND_FACTOR = 1.02
const FILL_LIMIT_PCT = 40 // 桥架填充率规范红线（电力电缆，控制电缆 50%）

const STD_AREAS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400]

// 导体理论重量：kg/km = S(mm²) × 密度(g/cm³) × 芯数 × 1.02（1mm²·m 恰为 1cm³）
function weightPerKmOf(areaMm2, cores, material) {
  const d = DENSITY[material]
  if (!(areaMm2 > 0) || !(cores > 0) || !d) return 0
  return areaMm2 * d * cores * STRAND_FACTOR
}

// 解析「截面×根数」清单：支持 × / x / * 分隔，# 注释行忽略
function parseCableList(text) {
  const rows = []
  const invalid = []
  const lines = String(text || '').split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^(\d+(?:\.\d+)?)\s*[x×*X]\s*(\d+)$/)
    if (m) {
      const s = parseFloat(m[1])
      const n = parseInt(m[2], 10)
      if (s > 0 && n > 0) {
        rows.push({ s, n, area: s * n, raw: line })
        continue
      }
    }
    invalid.push(line)
  }
  return { rows, invalid }
}

// 填充率：Σ S×根数 / (宽×高) × 100；线缆截面积合计、桥架截面积
function fillRateOf(cableArea, trayAreaMm2) {
  if (!(trayAreaMm2 > 0)) return null
  return (cableArea / trayAreaMm2) * 100
}

// ---------- 状态与交互 ----------
const uid = 'cwt'
const DEFAULTS = { material: 'copper', areaMm2: 2.5, cores: 1, trayWidth: 100, trayHeight: 50, cableList: '2.5×10' }

const material = ref(DEFAULTS.material)
const areaMm2 = ref(DEFAULTS.areaMm2)
const cores = ref(DEFAULTS.cores)
const trayWidth = ref(DEFAULTS.trayWidth)
const trayHeight = ref(DEFAULTS.trayHeight)
const cableList = ref(DEFAULTS.cableList)
const seoContentVisible = ref(true)

const TRAY_PRESETS = [
  { label: '100×50', w: 100, h: 50 },
  { label: '150×100', w: 150, h: 100 },
  { label: '200×100', w: 200, h: 100 },
  { label: '300×150', w: 300, h: 150 },
  { label: '400×200', w: 400, h: 200 }
]

const materialLabel = computed(() => (material.value === 'copper' ? '铜' : '铝'))

// 重量结果
const weightPerKm = computed(() => weightPerKmOf(Number(areaMm2.value), Number(cores.value), material.value))
const weightPerM = computed(() => weightPerKm.value / 1000)
const singleCorePerKm = computed(() => weightPerKmOf(Number(areaMm2.value), 1, material.value))
const singleCorePerM = computed(() => singleCorePerKm.value / 1000)

// 清单解析与填充率
const parsed = computed(() => parseCableList(cableList.value))
const parsedRows = computed(() => parsed.value.rows)
const invalidLines = computed(() => parsed.value.invalid)
const totalCableArea = computed(() => parsedRows.value.reduce((sum, r) => sum + r.area, 0))
const totalCount = computed(() => parsedRows.value.reduce((sum, r) => sum + r.n, 0))
const trayArea = computed(() => {
  const w = Number(trayWidth.value), h = Number(trayHeight.value)
  return w > 0 && h > 0 ? w * h : 0
})
const fillPct = computed(() => fillRateOf(totalCableArea.value, trayArea.value))
const fillOverLimit = computed(() => fillPct.value !== null && fillPct.value > FILL_LIMIT_PCT)
const fillVerdictText = computed(() => {
  if (fillPct.value === null) return '请填写有效的桥架宽高'
  if (fillOverLimit.value) {
    return `超标：超过 ≤${FILL_LIMIT_PCT}% 规范红线，请加大桥架规格或分槽/双层敷设（本估算未含护层外径，实际更紧）`
  }
  return `合格：未超过 ≤${FILL_LIMIT_PCT}% 红线（本估算按导体截面，未含护层外径）`
})

// ---------- 规格预设与示例 ----------
const weightPresets = [
  { name: 'YJV-4×25 铜', material: 'copper', areaMm2: 25, cores: 4 },
  { name: 'BV-2.5 铜单芯', material: 'copper', areaMm2: 2.5, cores: 1 },
  { name: 'BLV-2.5 铝 2 芯', material: 'aluminum', areaMm2: 2.5, cores: 2 },
  { name: '240 铜单芯', material: 'copper', areaMm2: 240, cores: 1 }
]

function applyWeightPreset(p) {
  material.value = p.material
  areaMm2.value = p.areaMm2
  cores.value = p.cores
}

function loadSample() {
  trayWidth.value = 200
  trayHeight.value = 100
  cableList.value = [
    '# YJV-4×25 两根（4 芯×25mm² ×2 根电缆）',
    '25×8',
    '# BV-2.5 十根',
    '2.5×10',
    '# YJV-4×6 一根',
    '6×4'
  ].join('\n')
  addRecentTool('cable-weight-tray-calculator')
}

// ---------- 展示格式化 ----------
const n0 = (v) => (Number.isFinite(v) ? Math.round(v).toString() : '—')
const n1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : '—')
const n3 = (v) => (Number.isFinite(v) ? v.toFixed(3) : '—')

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('cable-weight-tray-calculator')
})
</script>
