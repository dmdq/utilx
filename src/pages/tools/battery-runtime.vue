<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Hourglass class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电池续航估算</h1>
          <p class="text-sm text-muted-foreground mt-1">容量 ÷ 负载电流→工作小时，含 Peukert 修正与温度修正</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电池续航计算器：输入电池容量 Ah 与标称电压 V，负载按电流（A）或功率（W）二选一，
        给出简单口径续航（t = C ÷ I）；铅酸电池额外按 Peukert 定律修正（t = Hr × (C/(I×Hr))^n，标称按 20 小时率口径，n 默认 1.25 可调），
        并做低温容量折减（0℃ 约 80%、-20℃ 约 60%）；锂电池无 Peukert 效应按标称放出。
        结果同时显示小时与天数，附截止电压注记。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径说明：电池标称容量按 <span class="text-foreground font-medium">20 小时率（C20）</span>放电制式给出，
        即以 C÷20 的电流放 20 小时放完；大电流放电时铅酸实际可用容量显著缩水（Peukert 效应），锂电池基本无此效应。
        温度修正针对铅酸：<span class="text-foreground font-medium">0℃ 容量约 80%、-20℃ 约 60%</span>（分段线性近似），
        锂电与镍氢低温衰减曲线各不相同，本工具不修正，低温使用请自行留余量。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入与计算
        </h2>

        <!-- 电池参数 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label for="brt-ah" class="block text-sm font-medium text-foreground mb-1.5">电池容量（Ah）</label>
            <input
              id="brt-ah"
              v-model.number="ah"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 100"
            >
            <p class="text-xs text-muted-foreground mt-1">充电宝可填 mAh÷1000</p>
          </div>
          <div>
            <label for="brt-v" class="block text-sm font-medium text-foreground mb-1.5">标称电压（V）</label>
            <input
              id="brt-v"
              v-model.number="nominalV"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 12"
            >
            <p class="text-xs text-muted-foreground mt-1">铅酸单体 12V，锂电芯 3.7V</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">电池类型</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="c in CHEM_OPTIONS"
                :key="c.value"
                @click="chemistry = c.value"
                :class="chemistry === c.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ c.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">{{ chemistryNote }}</p>
          </div>
        </div>

        <!-- 负载二选一 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">负载（二选一）</label>
          <div class="grid grid-cols-2 gap-1 mb-2">
            <button
              @click="mode = 'current'"
              :class="mode === 'current' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >按负载电流（A）</button>
            <button
              @click="mode = 'power'"
              :class="mode === 'power' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >按负载功率（W）</button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div v-if="mode === 'current'">
              <label for="brt-i" class="block text-sm font-medium text-foreground mb-1.5">负载电流（A）</label>
              <input
                id="brt-i"
                v-model.number="loadA"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 20"
              >
            </div>
            <div v-else>
              <label for="brt-w" class="block text-sm font-medium text-foreground mb-1.5">负载功率（W）</label>
              <input
                id="brt-w"
                v-model.number="loadW"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 60"
              >
            </div>
            <div>
              <label for="brt-t" class="block text-sm font-medium text-foreground mb-1.5">环境温度（℃）</label>
              <input
                id="brt-t"
                v-model.number="tempC"
                type="number"
                min="-40"
                max="50"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="默认 25"
              >
              <p class="text-xs text-muted-foreground mt-1">默认 25℃，铅酸低温按分段线性折减</p>
            </div>
          </div>
        </div>

        <!-- Peukert 指数（铅酸） -->
        <div v-if="chemistry === 'lead'">
          <label class="block text-sm font-medium text-foreground mb-2">
            Peukert 指数 n：<span class="text-primary">{{ fmt(n, 2) }}</span>
          </label>
          <input v-model.number="n" type="range" min="1.1" max="1.4" step="0.01" class="w-full accent-primary" />
          <p class="text-xs text-muted-foreground mt-1">
            默认 1.25，常见 1.1~1.4：AGM 深循环约 1.1~1.25，普通启动电池约 1.2~1.3，管式/旧电池偏高
          </p>
        </div>

        <!-- 计算过程 -->
        <div v-if="inputsValid" class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border font-mono leading-relaxed">
          简单口径：t = C ÷ I = {{ fmt(ahEff, 2) }} ÷ {{ fmt(currentA, 2) }} = {{ fmt(simpleH, 2) }} h（放电 {{ fmt(cRate, 2) }}C）<br>
          <template v-if="chemistry === 'lead'">
            Peukert：t = {{ PEUKERT_HR }} × ({{ fmt(ahEff, 2) }} ÷ ({{ fmt(currentA, 2) }} × {{ PEUKERT_HR }}))^{{ fmt(n, 2) }} = {{ fmt(peukertH, 2) }} h<br>
            温度修正：{{ fmt(tempC, 0) }}℃ → ×{{ fmt(tempF, 2) }}（{{ tempNote }}）
          </template>
          <template v-else>
            {{ chemistry === 'li' ? '锂电' : '镍氢' }}：无 Peukert 修正{{ chemistry === 'li' ? '（电池管理系统截断保护）' : '（Peukert 效应轻微）' }}，本工具不做温度修正
          </template>
        </div>

        <!-- 结果：小时 + 天数双显示 -->
        <div v-if="inputsValid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <p class="text-sm font-medium text-foreground mb-2">推荐参考续航</p>
            <p class="text-3xl font-bold text-primary">{{ fmt(finalH, 2) }} <span class="text-base">小时</span></p>
            <p class="text-xs text-muted-foreground mt-1">{{ hoursText(finalH) }} ≈ {{ fmt(days, 2) }} 天</p>
          </div>
          <div class="p-4 rounded-lg border border-border bg-muted/50 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">简单口径（未修正）</span>
              <span class="text-sm font-semibold text-foreground">{{ fmt(simpleH, 2) }} h</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Peukert 修正后</span>
              <span class="text-sm font-semibold text-foreground">{{ chemistry === 'lead' ? fmt(peukertH, 2) + ' h' : '—（不修正）' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">温度修正系数</span>
              <span class="text-sm font-semibold text-foreground">{{ chemistry === 'lead' ? '×' + fmt(tempF, 2) : '×1.00（未修正）' }}</span>
            </div>
          </div>
        </div>

        <!-- 参数无效 -->
        <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-foreground">暂无法计算</p>
            <p class="text-xs text-muted-foreground mt-1">请检查参数：容量 Ah &gt; 0，标称电压 &gt; 0，负载电流/功率 &gt; 0。</p>
          </div>
        </div>

        <p class="text-xs leading-relaxed text-muted-foreground">
          间歇负载按平均功耗折算：例如 5W 设备每天实际运行 3 小时（日均 15Wh），
          10000mAh（3.7V ≈ 37Wh）充电宝可用约 2 天；连续满 5W 运行则只有约 7 小时。
        </p>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 截止电压注记 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <BatteryLow class="w-5 h-5 mr-2 text-primary" /> 截止电压注记
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">铅酸（12V 电池）：</span>终止电压 10.5V（约 1.75V/格），放到 10.5V 以下深度亏电会不可逆损伤极板。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">锂电芯：</span>终止电压 3.0V/芯（3 串组 9.0V、4 串组 12.0V），通常由保护板/电池管理系统截断，无需人工盯。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">镍氢：</span>终止电压约 1.0V/节，过度放电会引起反极，串联组更要注意。</span>
            </li>
          </ul>
        </div>

        <!-- 使用提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 使用提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>铅酸别放空：<span class="text-foreground font-medium">放电深度越浅寿命越长</span>，日常留 30% 以上余量，循环寿命可成倍延长。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>老电池折算：使用 1~2 年的铅酸按标称容量 ×0.8 代入，结果更接近实际。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>换算充电宝：Wh = mAh × 标称电压 ÷ 1000，10000mAh（3.7V）≈ 37Wh，这是民航口径的计数单位。</span>
            </li>
          </ul>
        </div>

        <!-- 免责 -->
        <div class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
            免责声明：本页为理论估算（Peukert 与温度均为经验近似），未计入电池老化、单体离散与放电截止策略差异，关键场景请以实测放电曲线为准。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>Peukert 定律是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          Peukert 定律描述铅酸电池<span class="text-foreground font-medium">放电电流越大、实际可放出的容量越少</span>的现象，
          常用公式 t = Hr × (C ÷ (I × Hr))^n：C 为标称容量，I 为放电电流，Hr 为标称制式的小时数（常见 20h），
          n 为 Peukert 指数（铅酸约 1.1~1.4，本工具默认 1.25；锂电池 n≈1，即基本无此效应）。
          举例：100Ah 铅酸以 20A 放电，简单口径 100÷20 = 5h；
          按 Peukert 修正 t = 20 × (100 ÷ (20×20))^1.25 = 20 × 0.25^1.25 ≈ 3.54h——少了近三成。
          电流越大偏差越大，这就是为什么按标称容量估算 UPS/逆变器续航总是"虚标"。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>"20 小时率"是什么意思？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          电池容量必须绑定放电制式才有意义。C20（20 小时率）表示<span class="text-foreground font-medium">以 C÷20 的电流连续放电，
          到终止电压恰好能放 20 小时</span>：100Ah 就是 5A 放 20 小时。同一块电池若按 10h 率（10A）标，
          只能标出约 90Ah；按 5h 率标约 82Ah；按 1h 率（1C）标只剩 65Ah 上下——容量数字越小不是电池缩水，
          而是大电流下放不出来。市面上标"启动电流"的车用电池、标"倍率"的锂电、标 C20 的储能电池口径各异，
          对比容量前先看清楚是按什么小时率标的。本工具默认输入为 C20 口径。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>深度放电为什么伤电池？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          铅酸电池放电越深，硫酸铅结晶越多，亏电放置时粗大的硫酸铅晶体难以在充电时还原（硫化），
          有效容量永久下降；放到 0% 再充，一次的伤害可能超过浅放几十次。
          <span class="text-foreground font-medium">放电深度（DOD）100% 的铅酸循环寿命通常只有 150~300 次，50% DOD 可达 500~1000 次，30% DOD 可上千次</span>。
          锂电（磷酸铁锂）对深度放电的耐受好得多，但过放到保护板截断仍会损耗容量，长期存放建议保持在 40%~60% 电量。
          实用建议：铅酸系统按"只用 50%、按 100% 容量买"来选型，即负载需求翻倍配容量。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>充电宝的 Wh 口径与民航 100Wh 红线</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          充电宝/锂电池的"官方身份证"是 Wh（瓦时），换算：<span class="text-foreground font-medium">Wh = mAh × 标称电压 ÷ 1000</span>，
          充电宝电芯标称电压通常 3.6~3.7V：10000mAh ≈ 37Wh，20000mAh ≈ 74Wh，26800mAh ≈ 99Wh（正好卡在红线内）。
          民航现行通行口径：<span class="text-foreground font-medium">≤100Wh 可随身携带无需批准；100~160Wh 需航司批准且一般限带 2 块；&gt;160Wh 不得随身也不得托运</span>；
          充电宝必须随身携带、严禁托运，且要求标识清晰、有额定能量标注。所以买旅行充电宝盯 Wh 而不是 mAh——
          26800mAh 与 20000mAh 差别不大，但 30000mAh（111Wh）就越线了。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么铅酸电池要乘 Peukert 修正，锂电池不用？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              铅酸放电电流大时，硫酸向极板内部扩散来不及，活性物质利用率下降，容量随电流明显缩水（n≈1.25）；
              锂电离子传导机制不同，1C 甚至 2C 放电容量仍接近标称（n≈1），且电池管理系统会在截止电压截断，
              按简单口径计算即可。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">100Ah 电池带 20A 负载能撑多久？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              简单口径 100÷20 = 5h；铅酸按 Peukert（n=1.25，C20 口径）修正后约 3.54h，25℃ 下再考虑实际损耗约 3~3.5h；
              锂电约 5h。低温下铅酸还要再乘温度系数：0℃ ×0.8 ≈ 2.8h。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">0℃ 或 -20℃ 容量打几折？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              铅酸按本工具的分段线性近似：25℃ 100%、0℃ 约 80%、-20℃ 约 60%（比 25℃ 每低 1℃ 约降 0.8~1 个百分点）。
              锂电低温放电衰减各家差异大（0℃ 约 85~90%），且 0℃ 以下充电有析锂风险，本工具不修正，请留余量。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">结果里的"天数"怎么理解？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              天数 = 续航小时 ÷ 24，对应设备 24 小时连续供电的场景。间歇工作的设备应按平均功耗折算：
              如 5W 设备每天运行 3 小时（日均 15Wh），37Wh 的充电宝约可用 2 天。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'battery-runtime'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Hourglass, Calculator, Info, Lightbulb, CheckCircle, AlertTriangle,
  ChevronUp, ChevronDown, BatteryLow
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 标称容量的放电制式：20 小时率（C20）
const PEUKERT_HR = 20

// 简单口径续航：t = C ÷ I（小时，未做任何修正）
function simpleRuntimeH(ah, i) {
  if (!Number.isFinite(ah) || !(ah > 0)) return null
  if (!Number.isFinite(i) || !(i > 0)) return null
  return ah / i
}

// 负载功率折算电流：I = W ÷ V
function currentFromPower(w, v) {
  if (!Number.isFinite(w) || !(w > 0)) return null
  if (!Number.isFinite(v) || !(v > 0)) return null
  return w / v
}

// Peukert 修正续航（铅酸）：t = Hr × (C ÷ (I×Hr))^n，Hr=20（标称 20h 率口径），n 默认 1.25
function peukertRuntimeH(ah, i, n, hr = PEUKERT_HR) {
  if (!Number.isFinite(ah) || !(ah > 0)) return null
  if (!Number.isFinite(i) || !(i > 0)) return null
  if (!Number.isFinite(n) || n <= 1 || n > 2) return null
  if (!Number.isFinite(hr) || !(hr > 0)) return null
  return hr * Math.pow(ah / (i * hr), n)
}

// 铅酸温度修正系数（相对 25℃ 标称容量，分段线性近似）：
// 25℃→1.0，0℃→0.8，-20℃→0.6；低于 -20℃ 按同斜率外推，下限 0.3；高于 25℃ 不增容取 1
function leadTempFactor(tC) {
  if (!Number.isFinite(tC)) return null
  if (tC >= 25) return 1
  if (tC >= 0) return 0.8 + (tC / 25) * 0.2
  if (tC >= -20) return 0.6 + ((tC + 20) / 20) * 0.2
  return Math.max(0.3, 0.6 + (tC + 20) * 0.01)
}

// 推荐口径续航（小时）：铅酸 = Peukert × 温度修正；锂电/镍氢 = 简单口径（不修正）
function finalRuntimeH(ah, i, chemistry, n, tC) {
  if (chemistry === 'lead') {
    const t = peukertRuntimeH(ah, i, n, PEUKERT_HR)
    const f = leadTempFactor(tC)
    if (t === null || f === null) return null
    return t * f
  }
  return simpleRuntimeH(ah, i)
}

// 小时 → "X 小时 Y 分" 文案
function hoursText(h) {
  if (!Number.isFinite(h) || !(h > 0)) return null
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  if (hh === 0) return mm + ' 分钟'
  return hh + ' 小时 ' + String(mm).padStart(2, '0') + ' 分'
}

// 天数 = 小时 ÷ 24
function daysFromHours(h) {
  if (!Number.isFinite(h) || !(h > 0)) return null
  return h / 24
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '电池续航估算 - 电池能用多久在线计算器',
  description: '在线电池续航计算器：容量 Ah ÷ 负载电流或功率得工作小时，铅酸按 Peukert 定律（t=Hr×(C/(I×Hr))^n，n 默认 1.25）修正并做低温容量折减（0℃ 约 80%、-20℃ 约 60%），锂电按标称放出，小时/天数双显示，附截止电压与民航 100Wh 口径注记，纯本地计算。',
  keywords: '电池续航计算,电池能用多久,Peukert定律,放电时间计算,充电宝续航,电池容量换算,20小时率',
  author: '有条工具',
  ogTitle: '电池续航估算 - 有条工具',
  ogDescription: '容量÷负载电流→工作小时，Peukert 修正与温度修正，小时/天数双显示',
  ogUrl: 'https://www.util.cn/tools/battery-runtime',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '电池续航估算',
  twitterDescription: 'Ah、负载与温度→电池工作小时，含 Peukert 修正与截止电压注记'
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
          name: '电池续航估算',
          url: 'https://www.util.cn/tools/battery-runtime',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '容量÷负载电流简单口径续航',
            '负载电流/功率二选一输入',
            '铅酸 Peukert 修正（n 默认 1.25 可调 1.1~1.4）',
            '温度分段线性修正（0℃ 约 80%、-20℃ 约 60%）',
            '锂电/镍氢不修正口径',
            '小时与天数双显示',
            '截止电压注记（铅酸 10.5V、锂电 3.0V/芯）'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '电池续航估算', item: 'https://www.util.cn/tools/battery-runtime' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么铅酸电池要乘 Peukert 修正，锂电池不用？',
              acceptedAnswer: { '@type': 'Answer', text: '铅酸大电流放电容量随电流明显缩水（n≈1.25）；锂电 1C~2C 放电容量仍接近标称（n≈1），由电池管理系统截断保护，按简单口径即可。' }
            },
            {
              '@type': 'Question',
              name: '100Ah 电池带 20A 负载能撑多久？',
              acceptedAnswer: { '@type': 'Answer', text: '简单口径 5h；铅酸按 Peukert（n=1.25，20h 率口径）修正后约 3.54h，0℃ 再乘 0.8 约 2.8h；锂电约 5h。' }
            },
            {
              '@type': 'Question',
              name: '"20 小时率"是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '以 C÷20 的电流连续放电到终止电压能放 20 小时，即 100Ah = 5A×20h；大电流放电实际容量低于此标称。' }
            },
            {
              '@type': 'Question',
              name: '充电宝的 Wh 怎么算？民航有什么限制？',
              acceptedAnswer: { '@type': 'Answer', text: 'Wh = mAh × 标称电压 ÷ 1000（3.7V 电芯：10000mAh ≈ 37Wh）；≤100Wh 可随身携带，100~160Wh 需航司批准，超 160Wh 禁带，充电宝严禁托运。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'battery-runtime'
const SETTINGS_KEY = 'battery-runtime-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const ah = ref(100)
const nominalV = ref(12)
const mode = ref('current')   // 'current' 按电流 | 'power' 按功率
const loadA = ref(20)
const loadW = ref(60)
const chemistry = ref('lead')
const n = ref(1.25)
const tempC = ref(25)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const CHEM_OPTIONS = [
  { value: 'lead', label: '铅酸' },
  { value: 'li', label: '锂电' },
  { value: 'nimh', label: '镍氢' }
]
const CHEM_NOTES = {
  lead: '铅酸：Peukert + 温度双修正',
  li: '锂电：无 Peukert 效应，温度不修正',
  nimh: '镍氢：Peukert 效应轻微，温度不修正'
}
const chemistryNote = computed(() => CHEM_NOTES[chemistry.value] || '')
const TEMP_NOTES = {
  warm: '高于 25℃，不增容',
  mild: '轻度低温折减',
  cold: '明显低温折减',
  severe: '重度低温折减'
}
const tempNote = computed(() => {
  if (!Number.isFinite(tempC.value)) return ''
  if (tempC.value >= 25) return TEMP_NOTES.warm
  if (tempC.value >= 0) return TEMP_NOTES.mild
  if (tempC.value >= -20) return TEMP_NOTES.cold
  return TEMP_NOTES.severe
})

// ---------- 计算联动 ----------
const currentA = computed(() => {
  if (mode.value === 'current') return Number(loadA.value)
  return currentFromPower(Number(loadW.value), Number(nominalV.value))
})
const ahEff = computed(() => (Number.isFinite(ah.value) && ah.value > 0 ? Number(ah.value) : null))
const inputsValid = computed(() => {
  if (ahEff.value === null) return false
  if (!Number.isFinite(currentA.value) || currentA.value <= 0) return false
  return true
})

const simpleH = computed(() => (inputsValid.value ? simpleRuntimeH(ahEff.value, currentA.value) : null))
const peukertH = computed(() => (inputsValid.value && chemistry.value === 'lead' ? peukertRuntimeH(ahEff.value, currentA.value, Number(n.value), PEUKERT_HR) : null))
const tempF = computed(() => (chemistry.value === 'lead' ? leadTempFactor(Number(tempC.value)) : null))
const finalH = computed(() => {
  if (!inputsValid.value) return null
  return finalRuntimeH(ahEff.value, currentA.value, chemistry.value, Number(n.value), Number(tempC.value))
})
const days = computed(() => (finalH.value === null ? null : daysFromHours(finalH.value)))
const cRate = computed(() => {
  if (ahEff.value === null || !Number.isFinite(currentA.value) || currentA.value <= 0) return null
  return currentA.value / ahEff.value
})

// ---------- 格式化 ----------
function fmt(v, d = 2) {
  return Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—'
}

// ---------- 设置持久化（localStorage，键前缀用工具 id，仅 onMounted/交互回调触达） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (Number.isFinite(s.ah) && s.ah > 0) ah.value = s.ah
    if (Number.isFinite(s.nominalV) && s.nominalV > 0) nominalV.value = s.nominalV
    if (s.mode === 'current' || s.mode === 'power') mode.value = s.mode
    if (Number.isFinite(s.loadA) && s.loadA > 0) loadA.value = s.loadA
    if (Number.isFinite(s.loadW) && s.loadW > 0) loadW.value = s.loadW
    if (CHEM_OPTIONS.some(o => o.value === s.chemistry)) chemistry.value = s.chemistry
    if (Number.isFinite(s.n) && s.n >= 1.1 && s.n <= 1.4) n.value = s.n
    if (Number.isFinite(s.tempC) && s.tempC >= -40 && s.tempC <= 50) tempC.value = s.tempC
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([ah, nominalV, mode, loadA, loadW, chemistry, n, tempC], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      ah: ah.value,
      nominalV: nominalV.value,
      mode: mode.value,
      loadA: loadA.value,
      loadW: loadW.value,
      chemistry: chemistry.value,
      n: n.value,
      tempC: tempC.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
