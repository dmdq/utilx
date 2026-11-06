<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scissors class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">染膏调配计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">染膏与双氧奶按比例用量速算，双氧浓度档与色度变化引导</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入目标总量与混合比（1:1 / 1:1.5 / 1:2 / 自定义），即刻算出染膏与双氧奶各需多少克、多少毫升；
        可选加入基色/工具色第三组分（按总量百分比从染膏份额中扣除，三项之和恒等于总量）。
        附双氧浓度 3%/6%/9%/12% 档位与用途引导、vol↔% 换算注记、重量比称量提醒。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">使用前请先做 48 小时皮肤敏感测试</span>（耳后或肘内侧涂少量调配物，48 小时内无红肿瘙痒再使用）；
          本工具仅计算用量，不构成操作指导，调配与施术请按所用品牌产品说明与专业人员指导执行。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 卡片A：比例用量计算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 比例用量计算
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="hdm-total" class="block text-sm font-medium text-foreground mb-1.5">目标总量（g）</label>
              <input
                id="hdm-total"
                v-model.number="totalG"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 150"
              >
              <p class="text-xs text-muted-foreground mt-1.5">染膏与双氧奶密度相近，1 ml ≈ 1 g，克与毫升按同一数值双显</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">混合比（染膏 : 双氧，重量比）</label>
              <div class="grid grid-cols-3 gap-1.5 mb-2">
                <button
                  v-for="p in RATIO_PRESETS"
                  :key="p.key"
                  @click="setPreset(p)"
                  class="py-2 rounded-lg border text-xs font-medium transition"
                  :class="activePreset === p.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
                >{{ p.label }}</button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model.number="ratioA"
                  @input="activePreset = 'custom'"
                  type="number"
                  min="0"
                  step="0.1"
                  aria-label="染膏份额 a"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="a"
                >
                <input
                  v-model.number="ratioB"
                  @input="activePreset = 'custom'"
                  type="number"
                  min="0"
                  step="0.1"
                  aria-label="双氧份额 b"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="b"
                >
              </div>
            </div>
          </div>

          <!-- 第三组分 -->
          <div class="p-3 rounded-lg bg-muted/50 border border-border">
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
              <input v-model="thirdEnabled" type="checkbox" class="accent-primary w-4 h-4">
              加入第三组分（基色 / 工具色）
            </label>
            <div v-if="thirdEnabled" class="mt-3">
              <label for="hdm-third" class="block text-xs font-medium text-muted-foreground mb-1.5">
                第三组分占总量百分比（%），从染膏份额中扣除
              </label>
              <input
                id="hdm-third"
                v-model.number="thirdPct"
                type="number"
                min="0"
                max="100"
                step="1"
                class="w-full sm:w-48 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
              <p v-if="result.ok" class="text-xs text-muted-foreground mt-1.5">
                本配比下上限 {{ maxThirdPct }}%（超出会挤占双氧份额，三项之和不再等于总量）
              </p>
            </div>
          </div>

          <!-- 结果 -->
          <div v-if="result.ok" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-2">调配用量（{{ ratioLabel }}，重量比口径）</p>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-foreground font-medium">染膏</span>
                  <span class="text-2xl font-bold text-primary">{{ fmt1(result.dyeG) }} g <span class="text-sm font-normal text-muted-foreground">≈ {{ fmt1(result.dyeG) }} ml</span></span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-foreground font-medium">双氧奶</span>
                  <span class="text-2xl font-bold text-primary">{{ fmt1(result.developerG) }} g <span class="text-sm font-normal text-muted-foreground">≈ {{ fmt1(result.developerG) }} ml</span></span>
                </div>
                <div v-if="thirdActive" class="flex items-center justify-between border-t border-border pt-2">
                  <span class="text-sm text-foreground font-medium">第三组分（基色/工具色）</span>
                  <span class="text-2xl font-bold text-primary">{{ fmt1(result.thirdG) }} g <span class="text-sm font-normal text-muted-foreground">≈ {{ fmt1(result.thirdG) }} ml</span></span>
                </div>
              </div>
              <p v-if="thirdActive" class="text-xs text-muted-foreground mt-3">
                三项合计 {{ fmt1(result.dyeG + result.developerG + result.thirdG) }} g，恒等于目标总量 {{ fmt1(totalNum) }} g
              </p>
            </div>
            <button
              @click="copyReport"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
              {{ copyStatus === 'ok' ? '已复制' : '复制调配单' }}
            </button>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">{{ result.error }}</p>
            </div>
          </div>
        </div>

        <!-- 卡片B：双氧浓度面板 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Percent class="w-5 h-5 mr-2 text-primary" /> 双氧奶浓度选择
          </h2>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="lv in DEV_LEVELS"
              :key="lv.vol"
              @click="selectedVol = lv.vol"
              class="py-2.5 rounded-lg border text-center transition"
              :class="selectedVol === lv.vol ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
            >
              <span class="block text-sm font-semibold">{{ lv.pct }}%</span>
              <span class="block text-[10px] font-normal opacity-75">{{ lv.vol }} vol</span>
            </button>
          </div>
          <div class="p-3 rounded-lg bg-muted/50 border border-border text-sm">
            <p class="text-foreground font-medium">{{ devPct }}%（{{ selectedVol }} vol）→ {{ devLevel ? devLevel.use : '—' }}</p>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              换算注记：% ≈ vol × 0.3（10 vol = 3%）。反向：{{ selectedVol }} vol ≈ {{ fmt1(pctFromVol(selectedVol)) }}%；
              {{ devPct }}% ≈ {{ fmt1(volFromPct(devPct)) }} vol。各品牌实际标注略有差异，以瓶身标称为准。
            </p>
          </div>
          <div class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
              显著提示：上述「染浅几度」的色度变化为行业通识经验档，仅作选档引导，实际提浅效果受发质、底色、
              品牌配方与停留时间影响，以所用品牌厂商指引为准。
            </p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 重量比警示卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Scale class="w-5 h-5 mr-2 text-amber-500" /> 重量比，不是量杯比
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            行业惯例的 1:1、1:1.5、1:2 <span class="text-foreground font-medium">多为重量比而非体积比</span>——
            染膏与双氧奶稠度差异大，用量杯/按压泵按体积取料误差可到 10%~20%，直接影响显色深浅。
            建议用电子秤称量（精确到 1 g）：先去皮称染膏，再按比例加双氧奶。
          </p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            本页按重量比口径计算。克与毫升双显仅因两者密度相近（1 ml ≈ 1 g）便于估读，不代表可互换称量方式。
          </p>
        </div>

        <!-- vol↔% 速记 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> vol ↔ % 速记表
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs">
            <div v-for="lv in DEV_LEVELS" :key="'mini-' + lv.vol" class="flex items-center justify-between">
              <span class="font-mono text-foreground font-semibold">{{ lv.vol }} vol</span>
              <span class="text-muted-foreground">≈</span>
              <span class="font-mono text-foreground">{{ pctFromVol(lv.vol) }}%</span>
              <span class="text-muted-foreground text-right">{{ lv.use }}</span>
            </div>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            记一条就够：<span class="font-mono text-foreground font-semibold">% ≈ vol × 0.3</span>。
            双氧浓度越高提浅力越强、对头发氧化损伤也越大，受损发质建议降档。
          </p>
        </div>

        <!-- 使用步骤 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">三步用完</h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>按目标发量估总量（短发 30~50 g，中长发 60~100 g，长发 100~150 g，仅经验参考）。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>按目标色度选双氧浓度档，再按品牌要求定混合比，得到染膏/双氧各多少克。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>加基色/工具色时填第三组分百分比，工具自动从染膏份额中扣减，总量不变。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>染膏调配计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          染膏调配计算器解决染发前最常问的一个问题：「150 克膏体，1:1.5 该各挤多少？」。
          它按重量比把目标总量拆成染膏与双氧奶两份（染膏 = 总量 × a/(a+b)，双氧 = 总量 × b/(a+b)），
          克与毫升双显；需要加入基色或工具色时，按占总量百分比从染膏份额中扣除，三项之和恒等于总量，不超量也不缺量。
          页面同时给出 3%/6%/9%/12%（10/20/30/40 vol）双氧浓度档的用途引导与 vol↔% 换算，全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">双氧奶浓度怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          双氧奶（显色剂）浓度决定提浅能力与氧化强度，行业通识经验档为：
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li><span class="text-foreground font-medium">3%（10 vol）</span>：同度染或染深，覆盖白发、补色护色首选，损伤最小；</li>
          <li><span class="text-foreground font-medium">6%（20 vol）</span>：染浅 1-2 度，最常用的日常档，白发覆盖也适用；</li>
          <li><span class="text-foreground font-medium">9%（30 vol）</span>：染浅 2-3 度，深发染浅棕/棕黄档；</li>
          <li><span class="text-foreground font-medium">12%（40 vol）</span>：染浅 3-4 度或配合漂后色调，氧化损伤最大，非必要不选。</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed mt-2">
          换算记法：% ≈ vol × 0.3，10 vol = 3%、20 vol = 6%，以此类推。
          再次强调：色度变化为行业通识经验档，受发质与品牌配方影响很大，以所用品牌厂商指引为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">染膏比例科普：重量比 vs 体积比</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          厂商给出的 1:1、1:1.5、1:2 默认指重量比（g : g）。染膏密度与双氧奶接近但不完全相同（1 ml ≈ 1 g 是近似），
          用量杯、按压泵按体积取料时，气泡与膏体稠度会带来 10%~20% 的偏差——比例错了最先体现在爆顶、
          显色偏深或偏浅。所以专业操作用电子秤称量：容器去皮 → 称染膏 → 按比例称双氧奶 → 搅拌均匀。
          常见比例的适用场景（经验参考）：1:1 多用于同度覆盖与白发覆盖；1:1.5 兼顾显色与双氧流动性；
          1:2 常用于染浅与免接触头皮的涂抹操作。具体以所用品牌的说明为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">150 克总量按 1:1.5 调，各要多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">染膏 = 150 × 1/(1+1.5) = 60 g，双氧 = 150 × 1.5/(1+1.5) = 90 g。按重量比用电子秤称量即可，密度近似下也约为 60 ml 与 90 ml。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">双氧浓度越高染得越浅吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">提浅能力随浓度增加（3% 同度/加深 → 12% 染浅 3-4 度，行业经验档），但氧化损伤也同步增大。选档原则是「够用就好」：只覆盖白发选 3%~6%，染浅 2 度以上再考虑 9%~12%，受损发质降档或分次处理。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">基色/工具色怎么算进总量？</h3>
            <p class="text-sm text-muted-foreground mt-1">把第三组分设为占总量的百分比（例如 10%），工具会先按混合比分好染膏与双氧，再从染膏份额中扣除第三组分的量——双氧不变，三项之和恒等于目标总量，不会多调出膏体。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">调配前还要做什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">使用前 48 小时做皮肤敏感测试（耳后或肘内侧少量涂抹，观察红肿瘙痒）；佩戴手套避免直接接触；现调现用，调好的膏体不要存放。本工具仅计算用量，不构成操作指导。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'hair-dye-mixer'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Scissors, Info, AlertTriangle, ChevronUp, ChevronDown,
  Copy, CheckCircle, Calculator, Percent, Scale
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 口径：混合比为重量比（g:g）；染膏与双氧奶密度相近，1 ml ≈ 1 g，克与毫升按同一数值双显。
// 分配公式：染膏 = 总量 × a/(a+b)；双氧 = 总量 × b/(a+b)。
// 第三组分（基色/工具色）= 总量 × c%，从染膏份额中扣除，三项之和恒等于总量。
// 锚点：总量 150g 比例 1:1.5 → 染膏 60g、双氧 90g；总量 180g 比例 1:2 → 60g/120g。
function fmtNum(x, digits = 1) {
  if (x === null || x === undefined || !Number.isFinite(x)) return '—'
  const p = Math.pow(10, digits)
  return String(Math.round(x * p) / p)
}
function fmt1(x) {
  return fmtNum(x, 1)
}

// vol ↔ % 注记：% ≈ vol × 0.3（10 vol = 3%）
function pctFromVol(vol) {
  if (!Number.isFinite(vol) || vol <= 0) return null
  return vol * 0.3
}
function volFromPct(pct) {
  if (!Number.isFinite(pct) || pct <= 0) return null
  return pct / 0.3
}

// 比例分配（含非法输入拒绝：总量/比例非正数、第三组分负数或超出染膏份额）
function mixSplit(totalG, a, b, cPct) {
  if (!Number.isFinite(totalG) || totalG <= 0) {
    return { ok: false, error: '目标总量必须为正数（g）' }
  }
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(b) || b <= 0) {
    return { ok: false, error: '混合比 a:b 必须为两个正数，不能为 0、负数或留空' }
  }
  const c = cPct === undefined || cPct === null || cPct === '' ? 0 : Number(cPct)
  if (!Number.isFinite(c) || c < 0) {
    return { ok: false, error: '第三组分占比必须为不小于 0 的百分数' }
  }
  const dyeShare = (totalG * a) / (a + b)
  const developerG = (totalG * b) / (a + b)
  const thirdG = (totalG * c) / 100
  if (thirdG > dyeShare + 1e-9) {
    return { ok: false, error: `第三组分占比过高：本配比下最多占总量 ${fmtNum((100 * a) / (a + b), 1)}%（不能超过染膏份额）` }
  }
  const dyeG = dyeShare - thirdG
  return { ok: true, dyeG, developerG, thirdG }
}

// 双氧浓度档（用途引导为行业通识经验档，页面已显著标注以品牌厂商指引为准）
const DEV_LEVELS = [
  { vol: 10, pct: 3, use: '同度覆盖或加深' },
  { vol: 20, pct: 6, use: '染浅 1-2 度' },
  { vol: 30, pct: 9, use: '染浅 2-3 度' },
  { vol: 40, pct: 12, use: '染浅 3-4 度' }
]

const RATIO_PRESETS = [
  { key: '1:1', a: 1, b: 1, label: '1 : 1' },
  { key: '1:1.5', a: 1, b: 1.5, label: '1 : 1.5' },
  { key: '1:2', a: 1, b: 2, label: '1 : 2' }
]

// 调配单文本（复制导出用）
function buildMixReport(totalG, a, b, cPct) {
  const r = mixSplit(totalG, a, b, cPct)
  if (!r.ok) return null
  const lines = [
    '染膏调配单（有条工具 · 本地计算）',
    `目标总量：${fmtNum(totalG, 1)} g（重量比口径，建议电子秤称量）`,
    `混合比：${fmtNum(a, 2)} : ${fmtNum(b, 2)}`
  ]
  if (r.thirdG > 0) {
    lines.push(
      `染膏：${fmtNum(r.dyeG, 1)} g`,
      `双氧奶：${fmtNum(r.developerG, 1)} g`,
      `第三组分（基色/工具色）：${fmtNum(r.thirdG, 1)} g`,
      `三项合计：${fmtNum(r.dyeG + r.developerG + r.thirdG, 1)} g`
    )
  } else {
    lines.push(
      `染膏：${fmtNum(r.dyeG, 1)} g（≈ ${fmtNum(r.dyeG, 1)} ml）`,
      `双氧奶：${fmtNum(r.developerG, 1)} g（≈ ${fmtNum(r.developerG, 1)} ml）`
    )
  }
  lines.push('提醒：使用前 48 小时皮肤敏感测试；本工具仅计算用量，不构成操作指导。')
  return lines.join('\n')
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '染膏调配计算器 - 染膏与双氧奶比例用量速算',
  description: '在线染膏调配计算器：按 1:1 / 1:1.5 / 1:2 或自定义重量比计算染膏与双氧奶用量，克与毫升双显，支持基色/工具色第三组分按占比从染膏份额扣除；附双氧浓度 3%/6%/9%/12% 档用途引导与 vol↔% 换算注记，纯本地计算。',
  keywords: '染膏调配计算器,双氧奶浓度怎么选,染膏比例,1:1.5比例,染发调配,双氧奶vol换算,基色工具色用量,染膏用量计算',
  author: '有条工具',
  ogTitle: '染膏调配计算器 - 染膏与双氧奶比例用量速算 | 有条工具',
  ogDescription: '按重量比速算染膏与双氧奶用量，浓度档选型引导，第三组分自动扣减。',
  ogUrl: 'https://www.util.cn/tools/hair-dye-mixer',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '染膏调配计算器',
  twitterDescription: '染膏与双氧奶比例用量速算，双氧浓度档引导，纯本地计算。'
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
          name: '染膏调配计算器',
          url: 'https://www.util.cn/tools/hair-dye-mixer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '按 1:1 / 1:1.5 / 1:2 / 自定义重量比计算染膏与双氧奶用量',
            '克与毫升双显（1 ml ≈ 1 g 密度近似）',
            '第三组分（基色/工具色）按占比从染膏份额扣除，三项之和恒等于总量',
            '双氧 3%/6%/9%/12% 浓度档与用途引导',
            'vol ↔ % 换算注记（% ≈ vol × 0.3）',
            '重量比称量提醒与 48 小时敏感测试提示',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '染膏调配计算器', item: 'https://www.util.cn/tools/hair-dye-mixer' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '150 克总量按 1:1.5 调，各要多少？',
              acceptedAnswer: { '@type': 'Answer', text: '染膏 = 150 × 1/(1+1.5) = 60 g，双氧 = 150 × 1.5/(1+1.5) = 90 g。按重量比用电子秤称量；密度近似下约 60 ml 与 90 ml。' }
            },
            {
              '@type': 'Question',
              name: '双氧浓度越高染得越浅吗？',
              acceptedAnswer: { '@type': 'Answer', text: '提浅能力随浓度增加（3% 同度或加深、6% 染浅 1-2 度、9% 染浅 2-3 度、12% 染浅 3-4 度，行业经验档），氧化损伤同步增大。选档原则是够用就好，受损发质降档。色度变化以所用品牌厂商指引为准。' }
            },
            {
              '@type': 'Question',
              name: '基色/工具色怎么算进总量？',
              acceptedAnswer: { '@type': 'Answer', text: '把第三组分设为占总量的百分比，先按混合比分好染膏与双氧，再从染膏份额中扣除第三组分的量，双氧不变，三项之和恒等于目标总量。' }
            },
            {
              '@type': 'Question',
              name: '调配前还要做什么？',
              acceptedAnswer: { '@type': 'Answer', text: '使用前 48 小时做皮肤敏感测试；佩戴手套；现调现用。本工具仅计算用量，不构成操作指导。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'hair-dye-mixer'
onMounted(() => {
  addRecentTool(TOOL_ID)
})

// ---------- 状态 ----------
const totalG = ref(150)
const ratioA = ref(1)
const ratioB = ref(1.5)
const activePreset = ref('1:1.5')
const thirdEnabled = ref(false)
const thirdPct = ref(0)
const selectedVol = ref(20)
const copyStatus = ref('idle')
const seoContentVisible = ref(true)

const setPreset = (p) => {
  ratioA.value = p.a
  ratioB.value = p.b
  activePreset.value = p.key
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 计算结果 ----------
const totalNum = computed(() => (Number.isFinite(totalG.value) ? totalG.value : null))
const thirdPctInput = computed(() => (thirdEnabled.value ? thirdPct.value : 0))
const result = computed(() => mixSplit(totalG.value, ratioA.value, ratioB.value, thirdPctInput.value))
const thirdActive = computed(() => result.value.ok && result.value.thirdG > 0)
const maxThirdPct = computed(() => {
  if (!Number.isFinite(ratioA.value) || ratioA.value <= 0 || !Number.isFinite(ratioB.value) || ratioB.value <= 0) return '—'
  return fmtNum((100 * ratioA.value) / (ratioA.value + ratioB.value), 1)
})
const ratioLabel = computed(() => {
  const p = RATIO_PRESETS.find((x) => x.key === activePreset.value)
  return p ? p.label : `${fmtNum(ratioA.value, 2)} : ${fmtNum(ratioB.value, 2)}（自定义）`
})
const devPct = computed(() => pctFromVol(selectedVol.value) ?? 0)
const devLevel = computed(() => DEV_LEVELS.find((lv) => lv.vol === selectedVol.value) || null)

// ---------- 复制调配单（clipboard + alert） ----------
let copyTimer = null
async function copyReport() {
  const text = buildMixReport(totalG.value, ratioA.value, ratioB.value, thirdPctInput.value)
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = 'ok'
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    copyStatus.value = 'fail'
    alert('复制失败：浏览器未授权剪贴板，请手动记录调配数据。')
  }
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyStatus.value = 'idle'; copyTimer = null }, 1600)
}
</script>
