<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Dumbbell class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">1RM 力量计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">输入重量与次数，四公式对照估算单次极限重量（1RM），生成百分比训练表与力量区间建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 1RM 计算器：输入卧推、深蹲、硬拉等动作的一组「重量 × 次数」成绩，同时用 Epley、Brzycki、Lombardi、O'Conner 四个经典公式外推单次极限重量并取均值，
        再基于 1RM 生成 95%-60% 八档百分比训练表、力量/肥大/耐力三区间重量建议与 3RM/5RM/8RM/10RM 换算重量，支持 kg/lb 双单位与本地训练记录（PR 标记）。
        全部计算在浏览器本地完成，不上传任何数据，无需直接冲极限就能科学安排训练计划。
      </p>
    </div>

    <!-- 固定安全提示条 -->
    <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 mb-6 flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-foreground leading-relaxed">1RM 公式是估算——新手直接冲极限重量风险高，建议用 3-5RM 换算并留有余量；大重量请有人保护。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左面板：输入 + 历史记录 -->
      <div class="space-y-6">
        <!-- 输入卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入训练成绩
          </h2>

          <!-- 动作（仅标签，公式通用） -->
          <div>
            <label class="text-sm font-medium text-foreground mb-1.5 block">动作（仅作标签，公式通用）</label>
            <select
              v-model="exercise"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground"
            >
              <option v-for="ex in exercises" :key="ex.id" :value="ex.id">{{ ex.name }}</option>
            </select>
          </div>

          <!-- 单位切换（内部统一 kg 计算） -->
          <div>
            <label class="text-sm font-medium text-foreground mb-1.5 block">单位</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="unit = 'kg'"
                class="px-3 py-2 rounded-lg text-sm font-medium border transition"
                :class="unit === 'kg' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70'"
              >kg（公斤）</button>
              <button
                type="button"
                @click="unit = 'lb'"
                class="px-3 py-2 rounded-lg text-sm font-medium border transition"
                :class="unit === 'lb' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70'"
              >lb（磅）</button>
            </div>
          </div>

          <!-- 重量 -->
          <div>
            <label class="text-sm font-medium text-foreground mb-1.5 block">重量（{{ unit }}）</label>
            <input
              v-model.number="weightInput"
              type="number"
              min="0.5"
              max="500"
              step="2.5"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono text-foreground"
            >
            <p v-if="!weightValid" class="text-xs text-red-500 mt-1 flex items-start gap-1">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 重量需在 0.5-500 {{ unit }} 之间
            </p>
            <p v-else class="text-xs text-muted-foreground mt-1 flex items-start gap-1">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 按 2.5 {{ unit }} 步进输入（杠铃杆 + 杠铃片的常见配重组合）
            </p>
          </div>

          <!-- 次数 -->
          <div>
            <label class="text-sm font-medium text-foreground mb-1.5 block">完成次数（1-12）</label>
            <input
              v-model.number="repsInput"
              type="number"
              min="1"
              max="12"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono text-foreground"
            >
            <p v-if="repsTooHigh" class="text-xs text-red-500 mt-1 flex items-start gap-1 font-medium">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 次数过多公式失真，请用更重重量
            </p>
            <p v-else-if="!repsComputable" class="text-xs text-red-500 mt-1 flex items-start gap-1">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 请输入不小于 1 的次数
            </p>
            <p v-else class="text-xs text-muted-foreground mt-1 flex items-start gap-1">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> 次数越少估算越准，3-5 次最可靠
            </p>
          </div>

          <!-- 操作 -->
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="loadExample"
              class="px-4 py-2.5 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-lg text-sm font-medium text-primary transition"
            >
              <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
            </button>
            <button
              type="button"
              @click="resetAll"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
            </button>
          </div>
          <button
            type="button"
            :disabled="!canCompute"
            @click="saveRecord"
            class="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-primary-foreground transition"
          >
            <CheckCircle class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 保存本次记录
          </button>
          <p v-if="saveTip" class="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle class="w-3.5 h-3.5" /> {{ saveTip }}
          </p>
        </div>

        <!-- 历史记录 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 训练记录
            </h2>
            <button
              v-if="history.length"
              type="button"
              @click="clearHistory"
              class="text-xs text-muted-foreground hover:text-red-500 transition"
            >清空</button>
          </div>
          <p v-if="!history.length" class="text-sm text-muted-foreground leading-relaxed">
            暂无记录：输入成绩后点击「保存本次记录」，最近 10 条会保存在本地浏览器（仅本机可见），同动作最高 1RM 会标记为 PR。
          </p>
          <ul v-else class="space-y-2">
            <li
              v-for="rec in history"
              :key="rec.id"
              class="flex items-center justify-between gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground flex items-center gap-1.5">
                  {{ exerciseName(rec.exercise) }}
                  <span
                    v-if="isPR(rec)"
                    class="inline-flex items-center text-green-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20"
                  >
                    <CheckCircle class="w-3 h-3 mr-0.5" /> PR
                  </span>
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">{{ rec.weight }} {{ rec.unit }} × {{ rec.reps }} 次 · {{ formatTs(rec.ts) }}</p>
              </div>
              <p class="font-mono text-sm font-semibold text-primary flex-shrink-0">{{ fmtKg(rec.oneRm) }} {{ unit }}</p>
            </li>
          </ul>
        </div>
      </div>

      <!-- 右面板：结果展示 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 结论卡：共识 1RM + 四公式对照 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Dumbbell class="w-5 h-5 mr-2 text-primary" /> 极限重量（1RM）估算
          </h2>
          <template v-if="consensus !== null">
            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">
                共识 1RM（四公式均值）· {{ exerciseName(exercise) }} {{ fmtKg(weightKg) }} {{ unit }} × {{ repsInput }} 次
              </p>
              <p class="text-5xl font-bold text-primary">
                {{ fmtKg(consensus) }}<span class="text-lg font-medium text-muted-foreground ml-1.5">{{ unit }}</span>
              </p>
              <p class="text-xs text-muted-foreground mt-2">≈ {{ otherUnitText }}</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div v-for="f in formulaRows" :key="f.id" class="bg-muted/50 border border-border rounded-lg p-3 text-center">
                <p class="text-xs text-muted-foreground mb-1">{{ f.name }}</p>
                <p class="text-base font-bold text-foreground font-mono">{{ fmtKg(f.value) }} <span class="text-[10px] font-normal text-muted-foreground">{{ unit }}</span></p>
                <p class="text-[10px] text-muted-foreground mt-0.5">{{ f.note }}</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              四个公式结果越接近，说明估算越可信；差距较大时建议以更保守（更低）的值作为计划依据。
            </p>
          </template>
          <p v-else class="text-sm text-muted-foreground">请先在左侧输入 0.5-500 之间的重量与不小于 1 的次数，查看估算结果。</p>
        </div>

        <!-- 百分比训练表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 百分比训练表（基于共识 1RM）
          </h2>
          <table v-if="percentRows.length" class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-muted-foreground border-b border-border">
                <th class="py-2 font-medium">%1RM</th>
                <th class="py-2 font-medium">重量（{{ unit }}）</th>
                <th class="py-2 font-medium">估算次数</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in percentRows"
                :key="row.pct"
                class="border-b border-border/60 last:border-b-0"
                :class="[85, 80, 70].includes(row.pct) ? 'bg-primary/5' : ''"
              >
                <td class="py-2 font-mono text-foreground">{{ row.pct }}%<span v-if="[85, 80, 70].includes(row.pct)" class="ml-1.5 text-[10px] text-primary">常用</span></td>
                <td class="py-2 font-mono font-semibold text-foreground">{{ fmtKg(row.weight) }} {{ unit }}</td>
                <td class="py-2 text-muted-foreground">约 {{ row.estReps }} 次</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-sm text-muted-foreground">输入有效成绩后，这里会生成 95%-60% 八档的训练重量表。</p>
          <p v-if="percentRows.length" class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            「估算次数」由 Epley 公式反解得出，仅供安排组数参考；高百分比下实际可完成次数因动作、状态与个体差异而不同。
          </p>
        </div>

        <!-- 三区间卡：力量 / 肥大 / 耐力 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 训练强度区间
          </h2>
          <div v-if="zones.length" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div v-for="zone in zones" :key="zone.key" class="bg-muted/40 border border-border rounded-lg p-4 space-y-1.5">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-foreground">{{ zone.name }}</p>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{{ zone.pctLabel }} 1RM</span>
              </div>
              <p class="text-lg font-bold text-primary font-mono">{{ zone.weightLabel }} {{ unit }}</p>
              <p class="text-xs text-foreground">每组 {{ zone.reps }}</p>
              <p class="text-xs text-muted-foreground leading-relaxed">{{ zone.desc }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">输入有效成绩后，这里会给出力量 / 肥大 / 耐力三区间的重量与次数建议。</p>
        </div>

        <!-- 换算卡：3RM / 5RM / 8RM / 10RM -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 常用次数重量换算
          </h2>
          <template v-if="repMaxRows.length">
            <p class="text-xs text-muted-foreground leading-relaxed">
              按当前成绩（{{ fmtKg(weightKg) }} {{ unit }} × {{ repsInput }} 次）用 Epley 链式换算，以下重量训练时可直接拿去用：
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="row in repMaxRows" :key="row.reps" class="bg-muted/50 border border-border rounded-lg p-3 text-center">
                <p class="text-xs text-muted-foreground mb-1">{{ row.reps }}RM</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmtKg(row.weight) }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">{{ unit }}</p>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-muted-foreground">输入有效成绩后，这里会换算出 3RM / 5RM / 8RM / 10RM 的对应重量。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>1RM 力量计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          1RM（One Rep Max，单次极限重量）指某个动作能以标准姿势一次完成的最高重量，是衡量绝对力量最常用的指标，也是百分比训练法的基准。
          本工具输入一组「重量 × 次数」成绩，同时用 Epley、Brzycki、Lombardi、O'Conner 四个经典公式外推 1RM 并取均值作为共识值，
          再生成 95%-60% 八档百分比训练表、力量/肥大/耐力三区间建议与 3RM/5RM/8RM/10RM 换算重量。全部计算在浏览器本地完成，训练记录只保存在你自己的设备上。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">1RM 是什么、怎么测？直接测 vs 公式估</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          直接测：充分热身后从较轻重量递增，每次只做 1 下，直到只能标准完成 1 次。结果最真实，但对动作技术、保护与经验要求高，一般只建议有训练基础且有人保护时进行。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          公式估：用一组 3-8RM 的成绩代入 Epley 等公式推算，误差通常在 5% 以内，安全省事，适合绝大多数训练者与新手，也是本页的默认方式。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">1RM 公式哪个准？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          业内通用的说法是：Epley 公式在低次数（1-5 次）区间与实测更接近，Brzycki 公式在高次数（8-12 次）时给出的结果更保守，Lombardi 与 O'Conner 介于两者之间。
          不同动作与个体存在差异，所以本页同时列出四个公式的结果并给出均值：四者越接近说明估算越可信；差距大时建议以更保守（更低）的值安排计划。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">多少次数估算最可靠？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          次数越少越可靠：≤5RM（尤其 3-5RM）的估算误差最小；6-12 次尚可参考；超过 12 次后力量与耐力成分混杂，公式基本失真——页面会给出红字提示，此时应换更重的重量再测一组。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">百分比训练怎么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          百分比训练把计划重量写成 %1RM，力量增长后只需重测 1RM 即可同步上调全部重量。力量区间用 85-95% 1RM、每组 1-5 次、组间休息 3-5 分钟，发展神经适应与绝对力量；
          肥大区间用 67-85% 1RM、每组 6-12 次、组间休息 60-90 秒，是增肌的主战场；耐力区间用 ≤65% 1RM、每组 12 次以上、组间休息 30-60 秒，打磨动作模式与肌耐力。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">新手要不要测 1RM？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不建议新手直接冲极限：技术未定型、缺乏保护经验，受伤风险高。更稳妥的做法是用一组 5RM（能标准完成 5 次的重量）换算 1RM，再在此基础上留 5-10% 余量安排训练；
          等动作熟练、有同伴保护后，再考虑在安全架或保护下真测。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1RM 是什么、怎么测？</h3>
            <p class="text-sm text-muted-foreground mt-1">1RM 是某动作能一次完成的最高重量。直接测最真实但风险高，需要充分热身、有人保护；公式估用 3-8RM 成绩推算，误差约 5% 以内，更安全，适合大多数人。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">1RM 公式哪个准？</h3>
            <p class="text-sm text-muted-foreground mt-1">通用说法：Epley 在低次数（≤5 次）时更接近实测，Brzycki 在高次数时更保守，Lombardi 与 O'Conner 居中。本页取四公式均值作为共识值，四者差距越小说明估算越可信。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">用多少次数的成绩估算最可靠？</h3>
            <p class="text-sm text-muted-foreground mt-1">≤5RM 最可靠，3-5 次误差最小；6-12 次尚可参考；超过 12 次公式基本失真，页面会红字提示换更重的重量。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">百分比训练表怎么用？</h3>
            <p class="text-sm text-muted-foreground mt-1">按目标选区间：力量 85-95% 1RM、每组 1-5 次；肥大 67-85% 1RM、每组 6-12 次；耐力 ≤65% 1RM、每组 12 次以上。按表中重量安排正式组，力量增长后重测 1RM 同步上调。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">新手要不要直接测 1RM？</h3>
            <p class="text-sm text-muted-foreground mt-1">不建议。新手建议用 5RM 成绩换算 1RM 并留 5-10% 余量安排计划，等动作熟练、有同伴保护后再考虑真测；大重量训练务必有人保护。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'one-rep-max-calculator'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Dumbbell, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, TrendingUp
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '1RM 力量计算器 - 卧推/深蹲/硬拉极限重量估算与百分比训练表',
  description: '免费在线 1RM 计算器：输入卧推、深蹲、硬拉等动作的重量与次数，用 Epley、Brzycki、Lombardi、O\'Conner 四公式对照估算极限重量，生成 95%-60% 百分比训练表、力量/肥大/耐力区间与 3-10RM 换算，支持 kg/lb 双单位与本地训练记录，纯浏览器本地运行',
  keywords: '1RM计算器,极限重量,力量训练,卧推极限,硬拉1rm',
  author: '有条工具',
  ogTitle: '1RM 力量计算器 - 极限重量估算与百分比训练表 | 有条工具',
  ogDescription: '四公式对照估算 1RM，生成百分比训练表与力量/肥大/耐力区间建议，安全科学安排训练。',
  ogUrl: 'https://www.util.cn/tools/one-rep-max-calculator',
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
          name: '1RM 力量计算器',
          url: 'https://www.util.cn/tools/one-rep-max-calculator',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['四公式对照估算 1RM（Epley/Brzycki/Lombardi/O\'Conner）', '共识 1RM 与 kg/lb 双单位换算', '95%-60% 八档百分比训练表', '力量/肥大/耐力三区间建议', '3RM/5RM/8RM/10RM 链式换算', '本地训练记录与 PR 标记']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '1RM 力量计算器', item: 'https://www.util.cn/tools/one-rep-max-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1RM 是什么、怎么测？',
              acceptedAnswer: { '@type': 'Answer', text: '1RM 是某动作能一次完成的最高重量。直接测最真实但风险高，需要充分热身、有人保护；公式估用一组 3-8RM 的成绩代入 Epley 等公式推算，误差约 5% 以内，更安全，适合大多数人。' }
            },
            {
              '@type': 'Question',
              name: '1RM 公式哪个准？',
              acceptedAnswer: { '@type': 'Answer', text: '通用说法：Epley 在低次数（≤5 次）时更接近实测，Brzycki 在高次数时更保守，Lombardi 与 O\'Conner 居中。本页同时列出四个公式结果并取均值作为共识值，四者差距越小说明估算越可信。' }
            },
            {
              '@type': 'Question',
              name: '用多少次数的成绩估算最可靠？',
              acceptedAnswer: { '@type': 'Answer', text: '次数越少越可靠：≤5RM 最可靠，3-5 次误差最小；6-12 次尚可参考；超过 12 次后力量与耐力成分混杂，公式基本失真，应换更重的重量再测一组。' }
            },
            {
              '@type': 'Question',
              name: '百分比训练表怎么用？',
              acceptedAnswer: { '@type': 'Answer', text: '按目标选区间：力量区间用 85-95% 1RM、每组 1-5 次、休息 3-5 分钟；肥大区间用 67-85% 1RM、每组 6-12 次、休息 60-90 秒；耐力区间用 ≤65% 1RM、每组 12 次以上。按表中重量安排正式组，力量增长后重测 1RM 同步上调。' }
            },
            {
              '@type': 'Question',
              name: '新手要不要直接测 1RM？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议。新手建议用一组 5RM 成绩换算 1RM，并留 5-10% 余量安排训练计划；等动作熟练、有同伴保护后再考虑真测，大重量务必有人保护。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const KG_PER_LB = 2.20462                    // kg 与 lb 换算系数
const WEIGHT_MIN = 0.5                       // 重量输入下限
const WEIGHT_MAX = 500                       // 重量输入上限
const REPS_MAX_SANE = 12                     // 超过该次数公式失真
const PERCENTS = [95, 90, 85, 80, 75, 70, 65, 60] // 百分比训练表八档

// 保留 1 位小数
function round1(x) {
  return Math.round(x * 10) / 10
}

// Epley 公式：1RM = w×(1+r/30)；r<=1 时成绩即为 1RM 本身，不做外推
function epleyOf(w, r) {
  if (r <= 1) return w
  return w * (1 + r / 30)
}

// Brzycki 公式：1RM = w×36/(37-r)；高次数时比 Epley 更保守
function brzyckiOf(w, r) {
  if (r <= 1) return w
  return (w * 36) / (37 - r)
}

// Lombardi 公式：1RM = w×r^0.10（幂函数，介于 Epley 与 Brzycki 之间）
function lombardiOf(w, r) {
  if (r <= 1) return w
  return w * Math.pow(r, 0.10)
}

// O'Conner 公式：1RM = w×(1+0.025r)（线性，增长最温和）
function oConnerOf(w, r) {
  if (r <= 1) return w
  return w * (1 + 0.025 * r)
}

// 按公式名求 1RM；r=1 直接返回 w（此时四个公式均应等于 w）
function oneRmOf(w, r, formula) {
  if (r <= 1) return w
  if (formula === 'epley') return epleyOf(w, r)
  if (formula === 'brzycki') return brzyckiOf(w, r)
  if (formula === 'lombardi') return lombardiOf(w, r)
  if (formula === 'oconner') return oConnerOf(w, r)
  return w
}

// 四公式均值作为共识 1RM，保留 1 位小数
function consensusOf(w, r) {
  const vals = ['epley', 'brzycki', 'lombardi', 'oconner'].map((f) => oneRmOf(w, r, f))
  return round1(vals.reduce((s, v) => s + v, 0) / vals.length)
}

// 百分比训练表：给定 1RM，输出 95%-60% 八档的重量与估算次数
// estReps 由 Epley 反解 round(30×(1RM/w−1)) 得出，仅是公式估算次数，非保证值
function percentTableOf(oneRm) {
  return PERCENTS.map((pct) => {
    const weight = round1((oneRm * pct) / 100)
    const estReps = weight > 0 ? Math.round(30 * (oneRm / weight - 1)) : 0
    return { pct, weight, estReps }
  })
}

// 三大训练区间：力量(85-95%) / 肥大(67-85%) / 耐力(≤65%) 的重量区间与次数建议
function trainingZonesOf(oneRm) {
  return [
    {
      key: 'strength', name: '力量', pctLow: 85, pctHigh: 95, reps: '1-5 次',
      min: round1(oneRm * 0.85), max: round1(oneRm * 0.95),
      desc: '发展神经适应与绝对力量，组间休息 3-5 分钟'
    },
    {
      key: 'hypertrophy', name: '肥大', pctLow: 67, pctHigh: 85, reps: '6-12 次',
      min: round1(oneRm * 0.67), max: round1(oneRm * 0.85),
      desc: '增肌主战场，组间休息 60-90 秒'
    },
    {
      key: 'endurance', name: '耐力', pctLow: 0, pctHigh: 65, reps: '12 次以上',
      min: 0, max: round1(oneRm * 0.65),
      desc: '打磨动作模式与肌耐力，控制动作节奏'
    }
  ]
}

// 由 w×r 成绩按 Epley 链式换算目标次数对应重量：
// 先求 1RM = w×(1+r/30)，再除以 (1+targetReps/30) 反推目标次数的重量
function repMaxOf(w, r, targetReps) {
  const oneRm = epleyOf(w, r)
  if (targetReps <= 1) return round1(oneRm)
  return round1(oneRm / (1 + targetReps / 30))
}

// 重量校验：0.5-500 之间才可计算
function isWeightValid(w) {
  return typeof w === 'number' && Number.isFinite(w) && w >= WEIGHT_MIN && w <= WEIGHT_MAX
}

// 次数校验：≥1 才可计算；>12 只给失真提示，不阻断计算
function isRepsComputable(r) {
  return typeof r === 'number' && Number.isFinite(r) && r >= 1
}

function isRepsTooHigh(r) {
  return typeof r === 'number' && Number.isFinite(r) && r > REPS_MAX_SANE
}

// ---------- 页面常量 ----------
const exercises = [
  { id: 'bench', name: '卧推' },
  { id: 'squat', name: '深蹲' },
  { id: 'deadlift', name: '硬拉' },
  { id: 'press', name: '推举' },
  { id: 'row', name: '划船' }
]

const formulaDefs = [
  { id: 'epley', name: 'Epley', note: '低次数更准' },
  { id: 'brzycki', name: 'Brzycki', note: '高次数更保守' },
  { id: 'lombardi', name: 'Lombardi', note: '幂函数折中' },
  { id: 'oconner', name: "O'Conner", note: '线性温和' }
]

const HISTORY_KEY = 'one-rep-max-calculator' // localStorage 记录键
const HISTORY_LIMIT = 10                     // 最多保留条数

// ---------- 页面状态 ----------
const unit = ref('kg')          // 显示单位：'kg' | 'lb'（内部统一按 kg 计算）
const exercise = ref('bench')
const weightInput = ref(80)     // 当前单位下的重量
const repsInput = ref(5)        // 完成次数
const seoContentVisible = ref(true)
const history = ref([])
const saveTip = ref('')
let saveTimer = null

// ---------- 输入校验与换算 ----------
const weightValid = computed(() => isWeightValid(weightInput.value))
const repsComputable = computed(() => isRepsComputable(repsInput.value))
const repsTooHigh = computed(() => isRepsTooHigh(repsInput.value))
const canCompute = computed(() => weightValid.value && repsComputable.value)

// 输入重量统一换算为 kg 参与计算
const weightKg = computed(() => {
  if (!weightValid.value) return 0
  return unit.value === 'kg' ? weightInput.value : weightInput.value / KG_PER_LB
})

// ---------- 结果（全部由纯函数派生） ----------
const consensus = computed(() => (canCompute.value ? consensusOf(weightKg.value, repsInput.value) : null))

const formulaRows = computed(() => {
  if (!canCompute.value) return []
  return formulaDefs.map((f) => ({
    ...f,
    value: round1(oneRmOf(weightKg.value, repsInput.value, f.id))
  }))
})

const percentRows = computed(() => (consensus.value !== null ? percentTableOf(consensus.value) : []))

const zones = computed(() => {
  if (consensus.value === null) return []
  return trainingZonesOf(consensus.value).map((z) => ({
    ...z,
    pctLabel: z.key === 'endurance' ? `≤${z.pctHigh}%` : `${z.pctLow}-${z.pctHigh}%`,
    weightLabel: z.key === 'endurance' ? `≤ ${fmtKg(z.max)}` : `${fmtKg(z.min)} - ${fmtKg(z.max)}`
  }))
})

const repMaxRows = computed(() => {
  if (!canCompute.value) return []
  return [3, 5, 8, 10].map((n) => ({ reps: n, weight: repMaxOf(weightKg.value, repsInput.value, n) }))
})

// 结论卡双单位：kg/lb 互为对照显示
const otherUnitText = computed(() => {
  if (consensus.value === null) return ''
  if (unit.value === 'kg') return `${round1(consensus.value * KG_PER_LB).toFixed(1)} lb`
  return `${round1(consensus.value).toFixed(1)} kg`
})

// ---------- 显示辅助 ----------
// 把内部 kg 数值按当前显示单位格式化（1 位小数）
function fmtKg(kg) {
  const v = unit.value === 'kg' ? kg : kg * KG_PER_LB
  return round1(v).toFixed(1)
}

function exerciseName(id) {
  const found = exercises.find((e) => e.id === id)
  return found ? found.name : id
}

function formatTs(ts) {
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// ---------- 历史记录（localStorage，全部 try/catch 兜底） ----------
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r) => r && typeof r.oneRm === 'number' && typeof r.ts === 'number')
      .slice(0, HISTORY_LIMIT)
  } catch (e) {
    return []
  }
}

function persistHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch (e) {
    // 隐私模式 / 存储已满时静默失败，不影响计算
  }
}

function saveRecord() {
  if (!canCompute.value || consensus.value === null) return
  const record = {
    id: Date.now(),
    ts: Date.now(),
    exercise: exercise.value,
    weight: weightInput.value,
    unit: unit.value,
    reps: repsInput.value,
    oneRm: consensus.value // 统一存 kg，便于跨单位比较
  }
  history.value = [record, ...history.value].slice(0, HISTORY_LIMIT)
  persistHistory(history.value)
  saveTip.value = '已保存到本地训练记录'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { saveTip.value = '' }, 2000)
}

function clearHistory() {
  history.value = []
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (e) {
    // 忽略移除失败
  }
}

// 同动作历史最高 1RM 标记为 PR（至少两条同动作记录时才判定）
function isPR(rec) {
  const same = history.value.filter((r) => r.exercise === rec.exercise)
  if (same.length < 2) return false
  const max = Math.max(...same.map((r) => r.oneRm))
  return rec.oneRm >= max
}

// ---------- 操作 ----------
function loadExample() {
  exercise.value = 'bench'
  weightInput.value = 80
  repsInput.value = 5
  unit.value = 'kg'
}

function resetAll() {
  exercise.value = 'bench'
  weightInput.value = 80
  repsInput.value = 5
  unit.value = 'kg'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  history.value = loadHistory()
  addRecentTool('one-rep-max-calculator')
})
</script>
