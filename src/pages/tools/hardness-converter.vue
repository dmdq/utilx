<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gem class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">硬度换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">HRC / HV / HB / HRB / HS 五标尺互转，内置 GB/T 1172 黑色金属硬度换算核心段（HRC 20-68）</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线硬度换算工具：任选一个硬度标尺输入实测值，按 GB/T 1172 黑色金属硬度换算表（HRC 20-68 逐级数据）线性插值换算其余四个标尺。
        布氏（HB）、洛氏B（HRB）超出适用范围的区段自动留空并提示；低于 HRC 20 的低硬度段提示改用 HRB/HV 标尺。
        所有换算值均为近似值，仲裁以实测为准。全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入卡 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center text-foreground">
          <ListFilter class="w-5 h-5 mr-2 text-primary" /> 输入硬度值
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">源标尺</label>
          <select
            v-model="sourceScale"
            class="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option v-for="s in scaleDefs" :key="s.id" :value="s.id">{{ s.label }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">硬度值</label>
          <input
            v-model.number="inputValue"
            type="number"
            step="any"
            :placeholder="`如 ${activeScale.example}`"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          >
          <p class="text-xs text-muted-foreground mt-1.5">
            本表覆盖 {{ activeScale.label }}：{{ activeScale.rangeText }}
          </p>
        </div>

        <!-- 快捷示例 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">快捷示例</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ex in examples"
              :key="ex.scale"
              @click="applyExample(ex)"
              :class="sourceScale === ex.scale && inputValue === ex.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition font-mono"
            >{{ ex.scale }} {{ ex.value }}</button>
          </div>
        </div>

        <!-- 低硬度 / 超范围提示 -->
        <div v-if="warning" class="rounded-lg border p-3 flex items-start gap-2" :class="warning.tone === 'low' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted border-border'">
          <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" :class="warning.tone === 'low' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'" />
          <p class="text-xs leading-relaxed" :class="warning.tone === 'low' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'">{{ warning.text }}</p>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          换算原理：在 GB/T 1172 逐级换算表的相邻两行之间做线性插值。换算结果均为近似值，仲裁以实测为准。
        </p>
      </div>

      <!-- 结果卡 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold flex items-center text-foreground">
            <ArrowRightLeft class="w-5 h-5 mr-2 text-primary" /> 换算结果
          </h2>
          <button
            v-if="conversion && conversion.ok"
            @click="copyResults"
            class="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition flex items-center gap-1.5"
          >
            <Check v-if="copied" class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <Copy v-else class="w-3.5 h-3.5" />
            {{ copied ? '已复制' : '复制结果' }}
          </button>
        </div>

        <template v-if="conversion && conversion.ok">
          <div class="space-y-2">
            <div
              v-for="s in scaleDefs"
              :key="s.id"
              class="flex items-center justify-between p-3 rounded-lg"
              :class="s.id === sourceScale ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'"
            >
              <div>
                <p class="text-sm font-medium text-foreground">{{ s.label }}</p>
                <p v-if="s.id === sourceScale" class="text-[10px] text-primary mt-0.5">输入值</p>
                <p v-else-if="result(s.id) === null" class="text-[10px] text-muted-foreground mt-0.5">超出该标尺适用范围</p>
                <p v-else class="text-[10px] text-muted-foreground mt-0.5">≈ 由 {{ activeScale.label }} 插值</p>
              </div>
              <p class="text-2xl font-bold font-mono" :class="s.id === sourceScale ? 'text-primary' : 'text-foreground'">
                {{ s.id === sourceScale ? fmt(sourceScale, Number(inputValue)) : fmt(s.id, result(s.id)) }}
              </p>
            </div>
          </div>

          <div class="mt-4 bg-muted/50 rounded-lg p-3 flex items-start gap-2">
            <Info class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">
              以上为近似参考值：不同标尺测量原理不同，换算存在系统误差，且仅适用于组织均匀的黑色金属（碳钢、合金钢）。
              <span class="text-foreground font-medium">近似值，仲裁以实测为准。</span>
            </p>
          </div>
        </template>

        <div v-else class="p-8 text-center text-muted-foreground text-sm">
          <BookOpen class="w-8 h-8 mx-auto mb-3 opacity-40" />
          请选择标尺并输入硬度值开始换算
        </div>
      </div>
    </div>

    <!-- 内置换算表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 class="text-lg font-semibold flex items-center text-foreground">
          <BookOpen class="w-5 h-5 mr-2 text-primary" /> GB/T 1172 黑色金属硬度换算表（HRC 20-68 核心段）
        </h2>
        <p class="text-xs text-muted-foreground">"—" 表示该标尺超出适用范围</p>
      </div>
      <div class="overflow-auto max-h-96 -mx-2 px-2">
        <table class="w-full text-sm min-w-[28rem]">
          <thead class="sticky top-0 bg-card">
            <tr class="text-left text-muted-foreground border-b border-border">
              <th class="py-2 pr-3 font-medium">HRC</th>
              <th class="py-2 pr-3 font-medium text-right">维氏 HV</th>
              <th class="py-2 pr-3 font-medium text-right">布氏 HB</th>
              <th class="py-2 pr-3 font-medium text-right">洛氏B HRB</th>
              <th class="py-2 font-medium text-right">肖氏 HS</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in HARDNESS_TABLE"
              :key="row.hrc"
              class="border-b border-border/50 transition-colors font-mono"
              :class="activeHrcRows.has(row.hrc) ? 'bg-primary/10' : 'hover:bg-muted/50'"
            >
              <td class="py-1.5 pr-3 font-semibold text-foreground">{{ row.hrc }}</td>
              <td class="py-1.5 pr-3 text-right text-foreground">{{ fmt('HV', row.hv) }}</td>
              <td class="py-1.5 pr-3 text-right" :class="row.hb === null ? 'text-muted-foreground/50' : 'text-foreground'">{{ fmt('HB', row.hb) }}</td>
              <td class="py-1.5 pr-3 text-right" :class="row.hrb === null ? 'text-muted-foreground/50' : 'text-foreground'">{{ fmt('HRB', row.hrb) }}</td>
              <td class="py-1.5 text-right text-foreground">{{ fmt('HS', row.hs) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground leading-relaxed">
        <p class="bg-muted/50 rounded-lg p-3"><span class="text-foreground font-medium">布氏 HB 适用上限：</span>约 500HB（≈ HRC 52）。更高硬度下钢球/硬质合金球压头不再适用，表中留空。</p>
        <p class="bg-muted/50 rounded-lg p-3"><span class="text-foreground font-medium">洛氏B HRB 适用上限：</span>100HRB（≈ HRC 23）。HRC 24 以上超出 HRB 量程，表中留空。</p>
        <p class="bg-muted/50 rounded-lg p-3"><span class="text-foreground font-medium">低硬度段：</span>HRC &lt; 20 时本表不适用，退火/正火钢等低硬度材料请改用 HRB 或 HV 标尺，并查 GB/T 1172 低碳钢换算表。</p>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：本工具换算数据依据 GB/T 1172《黑色金属硬度及强度换算值》（现行版本 1999）及与其同系的通用硬度换算表整理，仅适用于组织均匀的黑色金属；
        不同标准（GB/T 1172、ASTM E140、ISO 18265、DIN 50150）之间可能有 1~2 HRC 的差异。所有换算结果均为近似值，仅供工艺参考，
        <span class="text-foreground font-medium">近似值，仲裁以实测为准</span>；奥氏体不锈钢、有色金属及表面硬化件不适用本表。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是硬度换算器？</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            硬度换算器用于在洛氏（HRC/HRB）、维氏（HV）、布氏（HB）、肖氏（HS）等硬度标尺之间互相换算。
            生产现场往往只有一种硬度计，而图纸、验收规范或材料手册可能标注另一种标尺，这时就需要换算。本工具依据 GB/T 1172《黑色金属硬度及强度换算值》核心段（HRC 20-68 逐级数据）做线性插值，适用于机修、质检、热处理等场景。
          </p>

          <h3 class="text-lg font-semibold text-foreground">如何使用本工具</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>选择实测所用的源标尺（如 HRC）</li>
            <li>输入硬度值（如 45），结果区即时给出其余标尺的近似值</li>
            <li>低于 HRC 20 的低硬度材料，改选 HRB 或 HV 标尺</li>
            <li>需要留档时可一键复制换算结果</li>
          </ol>

          <h3 class="text-lg font-semibold text-foreground">各标尺适用范围</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">HRC（洛氏C）</span>：20-68，适合淬火、调质钢等较硬材料</li>
            <li><span class="text-foreground font-medium">HV（维氏）</span>：覆盖全段（约 238-940），压痕小，适合薄层与显微硬度</li>
            <li><span class="text-foreground font-medium">HB（布氏）</span>：适用上限约 500HB（≈ HRC 52），更高硬度下压头不适用，表中留空</li>
            <li><span class="text-foreground font-medium">HRB（洛氏B）</span>：量程上限 100HRB（≈ HRC 23），适合退火、正火等较软钢材</li>
            <li><span class="text-foreground font-medium">HS（肖氏）</span>：回跳式硬度，常用于大型轧辊、机床导轨的现场检测</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">换算原理与误差</h3>
          <p>
            硬度标尺之间没有理论换算公式，各国标准都是通过大量对比试验给出的经验换算表。本工具在 GB/T 1172 换算表的相邻两级之间做线性插值，
            因此半级输入值（如 HRC 45.5）也能得到连续结果。需要注意的是：GB/T 1172、ASTM E140、ISO 18265、DIN 50150 等标准之间的换算值可能有 1~2 HRC 的差异，
            且换算精度受材料组织均匀性影响。<span class="text-foreground font-medium">所有结果均为近似值，仲裁以实测为准。</span>
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">换算结果可以作为验收依据吗？</span>不能。换算值仅供工艺参考，供需双方有争议时应按图纸规定的标尺实测，仲裁以实测为准。</li>
            <li><span class="text-foreground font-medium">HB 列为什么 HRC 53 以上是空的？</span>布氏硬度用钢球/硬质合金球压痕，材料太硬时压头本身会变形失效，适用上限约 500HB（≈ HRC 52），故高硬度段留空。</li>
            <li><span class="text-foreground font-medium">低于 HRC 20 怎么换算？</span>本表不适用。退火、正火等低硬度材料请改用 HRB 或 HV 标尺实测，并查 GB/T 1172 的低碳钢换算表。</li>
            <li><span class="text-foreground font-medium">HRC 45 大概是多少 HV 和 HB？</span>按本表换算 HRC 45 ≈ HV 446 ≈ HB 421 ≈ HS 60，均为近似值。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'hardness-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Gem, ListFilter, ArrowRightLeft, Info, AlertTriangle, BookOpen, ChevronUp, ChevronDown, Copy, Check } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '硬度换算器 - HRC/HV/HB/HRB/HS 硬度单位换算表',
  description: '在线硬度换算器：洛氏HRC、维氏HV、布氏HB、洛氏B HRB、肖氏HS 五标尺互转，内置 GB/T 1172 黑色金属硬度换算表核心段（HRC 20-68）线性插值，布氏/洛氏B 适用范围自动留空，低于 HRC 20 提示改用 HRB/HV，近似值仲裁以实测为准，纯本地计算。',
  keywords: '硬度换算表, HRC HV HB 对照, 洛氏布氏维氏换算, hardness conversion calculator, 硬度单位换算, 肖氏硬度, 热处理质检',
  author: '有条工具',
  ogTitle: '硬度换算器 - HRC/HV/HB/HRB/HS 硬度单位换算',
  ogDescription: '五标尺硬度互转，内置 GB/T 1172 换算核心段，适用范围自动标注',
  ogUrl: 'https://www.util.cn/tools/hardness-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '硬度换算器 - HRC HV HB 换算',
  twitterDescription: 'GB/T 1172 黑色金属硬度换算，五标尺线性插值互转'
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
          name: '硬度换算器',
          url: 'https://www.util.cn/tools/hardness-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'HRC/HV/HB/HRB/HS 五标尺互转',
            'GB/T 1172 换算表核心段（HRC 20-68）线性插值',
            '布氏/洛氏B 适用范围自动留空标注',
            '低硬度段改用 HRB/HV 提示',
            '换算表内置查询与结果复制'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '硬度换算器', item: 'https://www.util.cn/tools/hardness-converter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '硬度换算结果可以作为验收依据吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。换算值仅供工艺参考，不同标尺测量原理不同且各标准间存在 1~2 HRC 差异，仲裁以实测为准。' }
            },
            {
              '@type': 'Question',
              name: 'HB 列为什么 HRC 53 以上是空的？',
              acceptedAnswer: { '@type': 'Answer', text: '布氏硬度适用上限约 500HB（≈ HRC 52），材料太硬时球压头不再适用，表中该区段留空。' }
            },
            {
              '@type': 'Question',
              name: '低于 HRC 20 怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '淬火钢换算表不适用，退火/正火等低硬度材料请改用 HRB 或 HV 标尺实测，并查 GB/T 1172 低碳钢换算表。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'hardness-converter'

// 交互记录（SSR 安全：localStorage 仅在客户端执行）
const trackUse = () => { addRecentTool(TOOL_ID) }
onMounted(() => { trackUse() })

// ---------- GB/T 1172 黑色金属硬度换算表核心段（HRC 20-68） ----------
// 数据来源：GB/T 1172 同系通用换算表（与 ASTM E140 / DIN 50150 / SAE J417 钢换算关系一致）。
// hb：布氏适用上限约 500HB（≈HRC 52），更高硬度留 null；hrb：量程上限 100HRB（≈HRC 23），更高留 null。
// >>> PURE-BEGIN
const HARDNESS_TABLE = [
  { hrc: 20, hv: 238, hb: 226, hrb: 97.8, hs: 34 },
  { hrc: 21, hv: 243, hb: 231, hrb: 98.5, hs: 35 },
  { hrc: 22, hv: 248, hb: 237, hrb: 99.0, hs: 36 },
  { hrc: 23, hv: 254, hb: 243, hrb: 100.0, hs: 37 },
  { hrc: 24, hv: 260, hb: 247, hrb: null, hs: 38 },
  { hrc: 25, hv: 266, hb: 253, hrb: null, hs: 39 },
  { hrc: 26, hv: 272, hb: 258, hrb: null, hs: 40 },
  { hrc: 27, hv: 279, hb: 264, hrb: null, hs: 41 },
  { hrc: 28, hv: 286, hb: 271, hrb: null, hs: 42 },
  { hrc: 29, hv: 294, hb: 279, hrb: null, hs: 43 },
  { hrc: 30, hv: 302, hb: 286, hrb: null, hs: 44 },
  { hrc: 31, hv: 310, hb: 294, hrb: null, hs: 45 },
  { hrc: 32, hv: 318, hb: 301, hrb: null, hs: 46 },
  { hrc: 33, hv: 327, hb: 311, hrb: null, hs: 47 },
  { hrc: 34, hv: 336, hb: 319, hrb: null, hs: 48 },
  { hrc: 35, hv: 345, hb: 327, hrb: null, hs: 49 },
  { hrc: 36, hv: 354, hb: 336, hrb: null, hs: 50 },
  { hrc: 37, hv: 363, hb: 344, hrb: null, hs: 51 },
  { hrc: 38, hv: 372, hb: 353, hrb: null, hs: 52 },
  { hrc: 39, hv: 382, hb: 362, hrb: null, hs: 53 },
  { hrc: 40, hv: 392, hb: 371, hrb: null, hs: 54 },
  { hrc: 41, hv: 402, hb: 381, hrb: null, hs: 55 },
  { hrc: 42, hv: 412, hb: 390, hrb: null, hs: 56 },
  { hrc: 43, hv: 423, hb: 400, hrb: null, hs: 57 },
  { hrc: 44, hv: 434, hb: 409, hrb: null, hs: 58 },
  { hrc: 45, hv: 446, hb: 421, hrb: null, hs: 60 },
  { hrc: 46, hv: 458, hb: 432, hrb: null, hs: 62 },
  { hrc: 47, hv: 471, hb: 442, hrb: null, hs: 63 },
  { hrc: 48, hv: 484, hb: 451, hrb: null, hs: 64 },
  { hrc: 49, hv: 498, hb: 464, hrb: null, hs: 66 },
  { hrc: 50, hv: 513, hb: 475, hrb: null, hs: 67 },
  { hrc: 51, hv: 528, hb: 487, hrb: null, hs: 68 },
  { hrc: 52, hv: 544, hb: 500, hrb: null, hs: 69 },
  { hrc: 53, hv: 560, hb: null, hrb: null, hs: 71 },
  { hrc: 54, hv: 577, hb: null, hrb: null, hs: 72 },
  { hrc: 55, hv: 595, hb: null, hrb: null, hs: 74 },
  { hrc: 56, hv: 613, hb: null, hrb: null, hs: 75 },
  { hrc: 57, hv: 633, hb: null, hrb: null, hs: 76 },
  { hrc: 58, hv: 653, hb: null, hrb: null, hs: 78 },
  { hrc: 59, hv: 674, hb: null, hrb: null, hs: 79.5 },
  { hrc: 60, hv: 697, hb: null, hrb: null, hs: 81 },
  { hrc: 61, hv: 720, hb: null, hrb: null, hs: 83 },
  { hrc: 62, hv: 746, hb: null, hrb: null, hs: 85 },
  { hrc: 63, hv: 772, hb: null, hrb: null, hs: 87 },
  { hrc: 64, hv: 800, hb: null, hrb: null, hs: 88 },
  { hrc: 65, hv: 832, hb: null, hrb: null, hs: 91 },
  { hrc: 66, hv: 865, hb: null, hrb: null, hs: 92 },
  { hrc: 67, hv: 900, hb: null, hrb: null, hs: 95 },
  { hrc: 68, hv: 940, hb: null, hrb: null, hs: 97 }
]

const SCALE_IDS = ['HRC', 'HV', 'HB', 'HRB', 'HS']

// 标尺 ID → 表行字段名（表行键为小写）
const SCALE_KEY = { HRC: 'hrc', HV: 'hv', HB: 'hb', HRB: 'hrb', HS: 'hs' }

// 在换算表上做线性插值：源标尺 scale 取 value，返回其余标尺近似值
// 返回 { ok, reason, min, max, results }，results 中不可换算的标尺为 null
function convertHardness(scale, value, table = HARDNESS_TABLE) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return { ok: false, reason: 'empty' }

  const srcKey = SCALE_KEY[scale]
  if (!srcKey) return { ok: false, reason: 'empty' }
  const col = table.map(r => r[srcKey]).filter(v => v !== null)
  const min = Math.min(...col)
  const max = Math.max(...col)
  if (num < min) return { ok: false, reason: 'below', min, max }
  if (num > max) return { ok: false, reason: 'above', min, max }

  const results = {}
  for (const target of SCALE_IDS) {
    if (target === scale) { results[target] = num; continue }
    const tKey = SCALE_KEY[target]
    // 取源列与目标列同时有值的行（两列均严格递增）
    const xs = []
    const ys = []
    for (const r of table) {
      if (r[srcKey] !== null && r[tKey] !== null) { xs.push(r[srcKey]); ys.push(r[tKey]) }
    }
    if (!xs.length || num < xs[0] || num > xs[xs.length - 1]) { results[target] = null; continue }
    let lo = 0
    let hi = xs.length - 1
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= num) lo = mid; else hi = mid }
    const t = xs[hi] === xs[lo] ? 0 : (num - xs[lo]) / (xs[hi] - xs[lo])
    results[target] = ys[lo] + t * (ys[hi] - ys[lo])
  }
  return { ok: true, reason: null, min, max, results }
}
// <<< PURE-END

// ---------- 页面状态 ----------
const sourceScale = ref('HRC')
const inputValue = ref(45)

const scaleDefs = [
  { id: 'HRC', label: '洛氏C (HRC)', rangeText: 'HRC 20–68', example: 45 },
  { id: 'HV', label: '维氏 (HV)', rangeText: 'HV 238–940', example: 600 },
  { id: 'HB', label: '布氏 (HB)', rangeText: 'HB 226–500（≈HRC 52 以下）', example: 250 },
  { id: 'HRB', label: '洛氏B (HRB)', rangeText: 'HRB 97.8–100（≈HRC 20–23）', example: 99 },
  { id: 'HS', label: '肖氏 (HS)', rangeText: 'HS 34–97', example: 60 }
]

const activeScale = computed(() => scaleDefs.find(s => s.id === sourceScale.value) || scaleDefs[0])

const examples = [
  { scale: 'HRC', value: 45 },
  { scale: 'HRC', value: 60 },
  { scale: 'HV', value: 600 },
  { scale: 'HB', value: 250 },
  { scale: 'HRB', value: 99 },
  { scale: 'HS', value: 60 }
]

const applyExample = (ex) => {
  sourceScale.value = ex.scale
  inputValue.value = ex.value
  trackUse()
}

const conversion = computed(() => convertHardness(sourceScale.value, inputValue.value))

const result = (scaleId) => {
  if (!conversion.value || !conversion.value.ok) return null
  return conversion.value.results[scaleId]
}

// 数值格式化：HV/HB 取整，其余保留 1 位小数；空值显示 —
const fmt = (scaleId, v) => {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—'
  const num = Number(v)
  if (scaleId === 'HV' || scaleId === 'HB') return String(Math.round(num))
  return (Math.round(num * 10) / 10).toFixed(1)
}

// 低硬度段 / 超范围提示（v-if 渲染，SSR 安全）
const warning = computed(() => {
  const c = conversion.value
  if (!c || c.reason === 'empty') return null
  if (c.reason === 'below' || (sourceScale.value === 'HRC' && Number(inputValue.value) < 20)) {
    return {
      tone: 'low',
      text: '低于本表下限（≈HRC 20 / HV 238）：淬火钢换算表不适用。退火、正火等低硬度材料请改用 HRB 或 HV 标尺实测，并查 GB/T 1172 低碳钢换算表。'
    }
  }
  if (c.reason === 'above') {
    return {
      tone: 'high',
      text: `超出本表上限（${activeScale.value.label} ${c.max}）：已接近淬硬上限，建议改用 HRC/HRA 或维氏实测并核对厂家数据。`
    }
  }
  return null
})

// 表格中与当前换算结果对应的行高亮
const activeHrcRows = computed(() => {
  const set = new Set()
  const hrc = result('HRC')
  if (hrc !== null && Number.isFinite(hrc)) {
    set.add(Math.floor(hrc))
    set.add(Math.ceil(hrc))
  }
  return set
})

// ---------- 复制结果（浏览器 API 仅在回调中，SSR 安全） ----------
const copied = ref(false)
let copyTimer = null

const copyResults = async () => {
  const c = conversion.value
  if (!c || !c.ok) return
  const line = scaleDefs
    .map(s => `${s.id} ${s.id === sourceScale.value ? fmt(s.id, Number(inputValue.value)) : fmt(s.id, result(s.id))}`)
    .join(' ≈ ')
  try {
    await navigator.clipboard.writeText(`硬度换算（GB/T 1172 近似值，仲裁以实测为准）：${line}`)
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    copied.value = false
  }
  trackUse()
}

// ---------- SEO 折叠 ----------
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
</script>
