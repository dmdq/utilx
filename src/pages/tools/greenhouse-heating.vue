<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Flame class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">温室加热估算</h1>
          <p class="text-sm text-muted-foreground mt-1">围护面积×温差×保温系数算加热功率，燃料日耗一键换算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线温室加热功率估算工具：输入温室内部尺寸、内外温差 ΔT 与围护结构保温系数 K（单层膜 6.0、双层充气膜 4.0、阳光板 3.5、5mm 玻璃 5.5、墙体 2.5 W/m²·K 预设，均可改），
        按 Q = K × 围护面积 × ΔT × 1.2（冷风渗透余量）估算加热功率，并换算电、天然气、液化气、柴油的连续运行日耗。
        围护面积按地面以外表面积近似，支持手动覆盖。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        K 值为<span class="text-foreground font-medium">经验传热系数</span>口径（W/m²·K，含内外表面换热阻），非实验室导热系数，
        与膜的新旧、密封质量、风况有关，结果仅供选型估算；围护面积 = 地面以外表面积近似（不含地面），
        实际有山墙斜面、天沟等差异时可手动覆盖。冷风渗透余量统一按 ×1.2 计。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 温室参数
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label for="gh-len" class="block text-sm font-medium text-foreground mb-1.5">内部长（米）</label>
            <input
              id="gh-len"
              v-model.number="lengthM"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 6"
            >
          </div>
          <div>
            <label for="gh-wid" class="block text-sm font-medium text-foreground mb-1.5">内部宽（米）</label>
            <input
              id="gh-wid"
              v-model.number="widthM"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 3"
            >
          </div>
          <div>
            <label for="gh-h" class="block text-sm font-medium text-foreground mb-1.5">平均高（米）</label>
            <input
              id="gh-h"
              v-model.number="heightM"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 2.5"
            >
            <p class="text-xs text-muted-foreground mt-1">屋脊与檐口高的平均值得出</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="gh-dt" class="block text-sm font-medium text-foreground mb-1.5">内外温差 ΔT（°C）</label>
            <input
              id="gh-dt"
              v-model.number="deltaT"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 15"
            >
            <p class="text-xs text-muted-foreground mt-1">目标内温 − 当地最低外温，如目标 18°C、最低 3°C 则填 15</p>
          </div>
          <div>
            <label for="gh-k" class="block text-sm font-medium text-foreground mb-1.5">保温系数 K（W/m²·K）</label>
            <input
              id="gh-k"
              v-model.number="kValue"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 6.0"
            >
          </div>
        </div>

        <!-- K 预设 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">围护结构预设（经验传热系数，可改）</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in kPresets"
              :key="p.id"
              @click="selectK(p)"
              :class="isKActive(p) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              {{ p.name }} {{ p.k }}
            </button>
          </div>
        </div>

        <!-- 围护面积覆盖 -->
        <div class="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input v-model="overrideArea" type="checkbox" class="w-4 h-4 rounded border border-border">
            手动覆盖围护面积（有山墙斜面、天沟、隔断等按实测填写）
          </label>
          <div v-if="overrideArea">
            <label for="gh-area" class="block text-sm font-medium text-foreground mb-1.5">围护面积（平方米）</label>
            <input
              id="gh-area"
              v-model.number="areaOverride"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 63"
            >
          </div>
        </div>

        <!-- 计算结果 -->
        <div v-if="isValid && result" class="space-y-4 pt-2">
          <!-- 核心结果：加热功率 -->
          <div class="p-6 bg-muted/50 rounded-lg text-center border border-border">
            <p class="text-sm text-muted-foreground mb-1">估算加热功率（含 ×1.2 冷风渗透余量）</p>
            <p class="text-4xl font-bold text-orange-600 dark:text-orange-400">
              {{ fmt(result.qKw, 2) }} <span class="text-lg font-medium">kW</span>
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              ≈ {{ fmt(result.qW, 0) }} W · 按连续满负荷运行计
            </p>
          </div>

          <!-- 明细 -->
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">温室体积（{{ fmt(lengthM, 1) }} × {{ fmt(widthM, 1) }} × {{ fmt(heightM, 1) }} m）</span>
              <span class="font-semibold text-foreground font-mono">{{ fmt(result.volume, 1) }} m³</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">围护面积（地面以外近似{{ overrideArea ? '，已手动覆盖' : '' }}）</span>
              <span class="font-semibold text-foreground font-mono">{{ fmt(result.area, 1) }} m²</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">理论功率 K × A × ΔT（不含渗透余量）</span>
              <span class="font-semibold text-foreground font-mono">{{ fmt(result.qTheoryKw, 2) }} kW</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span class="text-muted-foreground">冷风渗透余量</span>
              <span class="font-semibold text-foreground font-mono">× {{ INFILTRATION }}</span>
            </div>
          </div>

          <!-- 公式回放 -->
          <p class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border font-mono">
            Q = K × A × ΔT × {{ INFILTRATION }} = {{ fmt(kValue, 1) }} × {{ fmt(result.area, 1) }} × {{ fmt(deltaT, 1) }} × {{ INFILTRATION }} = {{ fmt(result.qW, 0) }} W
          </p>
        </div>

        <div v-else class="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-foreground">暂无法计算</p>
            <p class="text-xs text-muted-foreground mt-1">请检查：长/宽/高 &gt; 0，ΔT &gt; 0，K &gt; 0；如勾选了手动覆盖，围护面积需 &gt; 0。</p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 燃料日耗 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Fuel class="w-5 h-5 mr-2 text-primary" /> 连续运行日耗
          </h2>
          <table v-if="result" class="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr class="bg-muted/60 text-xs text-muted-foreground">
                <th class="px-3 py-2 text-left font-medium">燃料</th>
                <th class="px-3 py-2 text-right font-medium">热值口径</th>
                <th class="px-3 py-2 text-right font-medium">日耗</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in fuelRows" :key="f.id" class="border-t border-border">
                <td class="px-3 py-2 font-medium text-foreground">{{ f.name }}</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ f.rate }} kWh/{{ f.unit }}</td>
                <td class="px-3 py-2 text-right font-mono font-semibold text-primary">{{ fmt(f.amount, 1) }} {{ f.unit }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-sm text-muted-foreground">输入有效参数后显示日耗换算。</p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            口径注记：按连续 24 小时满负荷运行估算，日耗 = 功率 × 24 ÷ 热值（电 1 kWh、天然气 10 kWh/m³、液化气 12.8 kWh/kg、柴油 10 kWh/L）。
            实际按启停与保温措施会有明显出入，建议再乘 0.6~0.8 的运行系数估月耗。
          </p>
        </div>

        <!-- 保温提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 保温与设备提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">夜间辐射失温：</span>晴夜膜/玻璃外表面向天空辐射散热，膜下温度可比外气温还低 2~5°C，
              单层膜棚尤其明显——ΔT 不妨按最冷夜加几度余量，或加二层幕/保温被。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">先保温后加温：</span>堵缝、密封门、双层幕每省 1°C 温差，功率直接省约 6%，
              保温改造的性价比通常高于加大锅炉。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">地暖 vs 热风：</span>地暖（热水管/电热）均匀、贴地作物友好、节能但投资高；
              热风炉升温快、投资低，但上下温差大、易干燥，注意出风口不要直吹苗。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么温室加热按围护面积算，而不是按地面面积？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          温室失热的物理路径是热量穿过<span class="text-foreground font-medium">围护面</span>（膜、玻璃、阳光板、墙体）散到室外，
          失热量与围护面积成正比，所以功率估算用 Q = K × 围护面积 × ΔT。地面面积只间接决定围护面积的大小：
          同样 18 m² 地面，又高又长的棚比低矮的棚围护面大得多、失热也多。体积本身不直接参与导热公式，
          但它决定空气量与换气热负荷——换气次数大的棚（育苗、高湿场景）冷风渗透余量就要从 ×1.2 往上提。
          本工具围护面积按"地面以外表面积"近似：两长侧 + 两短侧 + 屋顶投影，不含地面（土壤蓄热、向上散热远小于围护面）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">保温系数 K 是怎么来的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          K 是<span class="text-foreground font-medium">总传热系数</span>，单位 W/m²·K，含义是"每平方米围护面、内外每差 1°C，
          每秒散失多少焦耳热量"。它综合了材料导热与内外表面换热阻，工程上由实测与经验归纳得到：
          <span class="text-foreground font-medium">单层 PE 膜约 6.0</span>（薄膜薄、辐射透过率高）、
          <span class="text-foreground font-medium">双层充气膜约 4.0</span>（两层膜间的静止空气层是主要热阻）、
          <span class="text-foreground font-medium">阳光板约 3.5</span>、<span class="text-foreground font-medium">5mm 单玻约 5.5</span>、
          <span class="text-foreground font-medium">砖墙复合体约 2.5</span>。这些都是经验口径：膜老化、密封漏风、大风天会显著拉高实际 K 值，
          所以结果要留余量，选设备宁大勿小一档。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">夜间辐射失温是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          白天覆盖材料吸收的太阳能，夜间会以长波辐射向天空散发——晴朗夜空像一台"红外散热器"，
          膜/玻璃外表面温度可以降到比外气温还低 2~5°C（结露结霜就是证据）。这意味着按气温差算出的功率在晴夜会不够用，
          单层膜棚尤其明显。缓解手段：内加二层幕或铝箔保温幕（同时阻断辐射与对流）、双层充气膜、
          面北侧设挡风障；ΔT 取值时不妨在最冷夜基础上再加 2~3°C 余量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">地暖和热风炉怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <span class="text-foreground font-medium">热水地暖/地加温线</span>：热量贴地、根区温度稳、上下温差小，对苗期与地栽作物友好，
          长期运行节能（可配生物质/空气源热泵），但初投资高、升温慢，适合固定生产棚。
          <span class="text-foreground font-medium">热风炉</span>：投资低、升温快、可兼通风除湿，但棚内上下温差可达 5°C 以上、
          空气易干燥，出风口直吹易烤苗。常见组合是"热风炉保底 + 二层幕保温"，观赏与育苗棚再辅局部地暖。
          无论哪种，先按本工具估算功率档位，再按当地最低气温年的连续阴雪天校核燃料储备。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>温室加热估算公式</h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>体积</strong>: 体积 = 长 × 宽 × 平均高（m³）</li>
          <li><strong>围护面积</strong>: A ≈ 2×(长×高) + 2×(宽×高) + 长×宽（地面以外表面积，可手动覆盖）</li>
          <li><strong>理论功率</strong>: Q 理论 = K × A × ΔT（W）</li>
          <li><strong>估算功率</strong>: Q = K × A × ΔT × 1.2（含冷风渗透余量）</li>
          <li><strong>日耗</strong>: 电 kWh/日 = Q × 24 ÷ 1000；燃料量 = 日耗 kWh ÷ 热值（天然气 10 kWh/m³、液化气 12.8 kWh/kg、柴油 10 kWh/L）</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">6×3×2.5 米的单层膜小棚要多少加热功率？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              围护面积 ≈ 2×(6×2.5) + 2×(3×2.5) + 6×3 = 63 m²；温差 15°C、K=6 时，
              Q = 6 × 63 × 15 × 1.2 = 6804 W ≈ 6.8 kW，电加热连续运行日耗约 163.3 kWh（折天然气约 16.3 m³/日）。
              实际可按夜间使用时段折减，不必 24 小时全开。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">K 值选大一点还是小一点？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              K 反映保温好坏，越小越保温。同结构下膜越旧、密封越差 K 越大；大风口径可比静风上浮 10%~20%。
              拿不准时按预设值算，再在设备选型上留一档余量，宁可能力略富余，也不要最冷夜掉温。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么还要乘 1.2 的冷风渗透余量？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              温室不可能完全密封，缝隙渗风、开门与植物蒸腾换气都会带入冷空气，这部分热负荷与围护导热叠加。
              一般棚取 ×1.2；高换气需求（育苗、高湿除雾）或大风口棚建议上调至 ×1.3~1.5。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">日耗怎么从功率换算成天然气方数？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              功率 × 24 得到日需热量（kWh），再除以燃料热值：天然气约 10 kWh/m³、液化气约 12.8 kWh/kg、柴油约 10 kWh/L。
              如 6.8 kW 棚日耗 163.3 kWh，折天然气约 16.3 m³、液化气约 12.8 kg、柴油约 16.3 L，这是连续满负荷口径。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'greenhouse-heating'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Flame, Calculator, Fuel, Lightbulb, Info,
  CheckCircle, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 温室加热估算纯函数：围护面积 -> 功率 -> 日耗 -> 燃料换算
const INFILTRATION = 1.2 // 冷风渗透余量
const FUEL_RATES = { electric: 1, gas: 10, lpg: 12.8, diesel: 10 } // kWh / 每单位

// K 预设（经验传热系数 W/m²·K，含内外表面换热阻）
const kPresets = [
  { id: 'film1', name: '单层膜', k: 6.0 },
  { id: 'film2', name: '双层充气膜', k: 4.0 },
  { id: 'pc', name: '阳光板', k: 3.5 },
  { id: 'glass5', name: '5mm玻璃', k: 5.5 },
  { id: 'wall', name: '墙体', k: 2.5 }
]

// 数值四舍五入（+Number.EPSILON 修正二进制表示误差）
function roundTo(v, d = 2) {
  if (!Number.isFinite(v)) return null
  const shift = Math.pow(10, d)
  return Math.round((v + Number.EPSILON) * shift) / shift
}

// 温室体积 = 长 × 宽 × 平均高
function greenhouseVolume(l, w, h) {
  if (!Number.isFinite(l) || l <= 0 || !Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) return null
  return l * w * h
}

// 围护面积（地面以外表面积近似）：两长侧面 + 两短侧面 + 屋顶（按地面投影）
function envelopeArea(l, w, h) {
  if (!Number.isFinite(l) || l <= 0 || !Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) return null
  return 2 * (l * h) + 2 * (w * h) + l * w
}

// 理论功率 = K × 围护面积 × ΔT（W）
function theoryPowerW(k, area, dt) {
  if (!Number.isFinite(k) || k <= 0 || !Number.isFinite(area) || area <= 0 || !Number.isFinite(dt) || dt <= 0) return null
  return k * area * dt
}

// 估算功率 = 理论功率 × 冷风渗透余量
function heatingPowerW(k, area, dt, infiltration) {
  const base = theoryPowerW(k, area, dt)
  if (base === null || !Number.isFinite(infiltration) || infiltration <= 0) return null
  return base * infiltration
}

// 连续运行日耗电量（kWh/日）= 功率(W) × 24 ÷ 1000
function dailyKwh(powerW) {
  if (!Number.isFinite(powerW) || powerW <= 0) return null
  return (powerW * 24) / 1000
}

// 燃料日耗 = 日耗 kWh ÷ 热值（kWh/每单位）
function fuelDailyAmount(dailyKwhVal, rateKwhPerUnit) {
  if (!Number.isFinite(dailyKwhVal) || dailyKwhVal <= 0 || !Number.isFinite(rateKwhPerUnit) || rateKwhPerUnit <= 0) return null
  return dailyKwhVal / rateKwhPerUnit
}

// 汇总：一次算全体积/围护/功率/日耗/燃料
function calcHeating({ l, w, h, k, dt, area }) {
  const volume = greenhouseVolume(l, w, h)
  const qW = heatingPowerW(k, area, dt, INFILTRATION)
  const qTheory = theoryPowerW(k, area, dt)
  if (volume === null || qW === null || qTheory === null) return null
  const kwh = dailyKwh(qW)
  return {
    volume,
    area,
    qTheoryW: qTheory,
    qTheoryKw: qTheory / 1000,
    qW,
    qKw: qW / 1000,
    dailyKwh: kwh,
    fuels: {
      electric: fuelDailyAmount(kwh, FUEL_RATES.electric),
      gas: fuelDailyAmount(kwh, FUEL_RATES.gas),
      lpg: fuelDailyAmount(kwh, FUEL_RATES.lpg),
      diesel: fuelDailyAmount(kwh, FUEL_RATES.diesel)
    }
  }
}
// ==== PURE-FNS-END ====

const TOOL_ID = 'greenhouse-heating'
const SETTINGS_KEY = 'greenhouse-heating-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- SEO ----------
useSeoMeta({
  title: '温室加热估算 - 大棚加热功率与燃料日耗计算工具 | Util工具箱',
  description: '在线温室加热功率估算工具：按 Q = K×围护面积×ΔT×1.2 估算大棚加热功率，内置单层膜 6.0、双层充气膜 4.0、阳光板 3.5、5mm 玻璃 5.5、墙体 2.5 W/m²·K 经验传热系数预设（可改），围护面积支持手动覆盖，附电/天然气/液化气/柴油连续运行日耗换算，纯本地计算。',
  keywords: '温室加热计算,大棚取暖功率,加热功率估算,保温系数K值,温室热负荷,greenhouse heating,大棚加温设备选型',
  author: 'Util工具箱',
  ogTitle: '温室加热估算 - 大棚加热功率与燃料日耗计算 | Util工具箱',
  ogDescription: '围护面积×温差×保温系数估算加热功率，燃料日耗一键换算，K 值预设可改。',
  ogUrl: 'https://www.util.cn/tools/greenhouse-heating',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '温室加热估算工具',
  twitterDescription: '围护面积×温差×保温系数估算加热功率，燃料日耗一键换算。'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
const faqs = [
  {
    q: '6×3×2.5 米的单层膜小棚要多少加热功率？',
    a: '围护面积 ≈ 2×(6×2.5)+2×(3×2.5)+6×3 = 63 m²；温差 15°C、K=6 时 Q = 6×63×15×1.2 = 6804 W ≈ 6.8 kW，电加热日耗约 163.3 kWh。'
  },
  {
    q: 'K 值选大一点还是小一点？',
    a: 'K 反映保温好坏，越小越保温。膜旧、密封差、大风天 K 会拉高；拿不准按预设算，设备选型再留一档余量。'
  },
  {
    q: '为什么还要乘 1.2 的冷风渗透余量？',
    a: '缝隙渗风、开门与蒸腾换气都会带入冷空气，与围护导热叠加；一般棚取 ×1.2，高换气或大风口棚可上调至 ×1.3~1.5。'
  },
  {
    q: '日耗怎么从功率换算成天然气方数？',
    a: '功率 × 24 得日需热量（kWh），除以热值即可：天然气约 10 kWh/m³、液化气约 12.8 kWh/kg、柴油约 10 kWh/L。'
  }
]

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '温室加热估算',
          url: 'https://www.util.cn/tools/greenhouse-heating',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '内部尺寸转体积与围护面积（地面以外近似，可覆盖）',
            'K 值经验传热系数预设：单层膜 6.0 / 双层充气膜 4.0 / 阳光板 3.5 / 5mm 玻璃 5.5 / 墙体 2.5',
            'Q = K×A×ΔT×1.2 冷风渗透余量估算功率',
            '电/天然气/液化气/柴油连续运行日耗换算',
            '夜间辐射失温与地暖/热风选型提示',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '温室加热估算', item: 'https://www.util.cn/tools/greenhouse-heating' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a }
          }))
        }
      ]
    })
  }]
})

// ---------- 状态 ----------
const lengthM = ref(6)
const widthM = ref(3)
const heightM = ref(2.5)
const deltaT = ref(15)
const kValue = ref(6.0)
const selectedK = ref('film1')
const overrideArea = ref(false)
const areaOverride = ref(63)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => {
  const r = roundTo(Number(v), d)
  return r === null ? '—' : String(r)
}

// ---------- 计算 ----------
const autoArea = computed(() => envelopeArea(Number(lengthM.value), Number(widthM.value), Number(heightM.value)))

const effectiveArea = computed(() => {
  if (overrideArea.value) return Number(areaOverride.value)
  return autoArea.value
})

const isValid = computed(() =>
  effectiveArea.value !== null && effectiveArea.value > 0 &&
  (!overrideArea.value || (Number.isFinite(Number(areaOverride.value)) && Number(areaOverride.value) > 0))
)

const result = computed(() => {
  if (!isValid.value) return null
  return calcHeating({
    l: Number(lengthM.value),
    w: Number(widthM.value),
    h: Number(heightM.value),
    k: Number(kValue.value),
    dt: Number(deltaT.value),
    area: effectiveArea.value
  })
})

// 燃料日耗表行
const fuelRows = computed(() => {
  if (!result.value) return []
  const f = result.value.fuels
  return [
    { id: 'electric', name: '电', rate: FUEL_RATES.electric, unit: 'kWh', amount: f.electric },
    { id: 'gas', name: '天然气', rate: FUEL_RATES.gas, unit: 'm³', amount: f.gas },
    { id: 'lpg', name: '液化气', rate: FUEL_RATES.lpg, unit: 'kg', amount: f.lpg },
    { id: 'diesel', name: '柴油', rate: FUEL_RATES.diesel, unit: 'L', amount: f.diesel }
  ]
})

// ---------- K 预设选择 ----------
function selectK(p) {
  selectedK.value = p.id
  kValue.value = p.k
}
function isKActive(p) {
  return Number(kValue.value) === p.k
}

// ---------- 设置持久化（localStorage，键前缀用工具 id；仅 onMounted 与交互回调触达） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (Number.isFinite(s.lengthM) && s.lengthM > 0) lengthM.value = s.lengthM
    if (Number.isFinite(s.widthM) && s.widthM > 0) widthM.value = s.widthM
    if (Number.isFinite(s.heightM) && s.heightM > 0) heightM.value = s.heightM
    if (Number.isFinite(s.deltaT) && s.deltaT > 0) deltaT.value = s.deltaT
    if (Number.isFinite(s.kValue) && s.kValue > 0) kValue.value = s.kValue
    if (typeof s.selectedK === 'string') selectedK.value = s.selectedK
    if (typeof s.overrideArea === 'boolean') overrideArea.value = s.overrideArea
    if (Number.isFinite(s.areaOverride) && s.areaOverride > 0) areaOverride.value = s.areaOverride
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([lengthM, widthM, heightM, deltaT, kValue, selectedK, overrideArea, areaOverride], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      lengthM: lengthM.value,
      widthM: widthM.value,
      heightM: heightM.value,
      deltaT: deltaT.value,
      kValue: kValue.value,
      selectedK: selectedK.value,
      overrideArea: overrideArea.value,
      areaOverride: areaOverride.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
