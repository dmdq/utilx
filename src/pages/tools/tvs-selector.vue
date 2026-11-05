<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Shield class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">TVS选型校验器</h1>
          <p class="text-sm text-muted-foreground mt-1">VRWM / VBR / VC / IPP 四条件逐条判定与浪涌能量估算，钳位裕量一眼看清</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        四条件校验 TVS 二极管选型：① VRWM ≥ 工作电压——常态不导通不漏电；② VBR_max 落在浪涌裕量内——浪涌上升沿钳位提前介入；
        ③ VC@IPP &lt; 被保护件耐受电压——全电流钳位不伤下游；④ 浪涌电流 × VC ≤ 额定 PPP 且不超额定 IPP——脉冲功率余量足够。
        输入电路侧（工作电压、浪涌电流、8/20µs 电流型或 10/1000µs 能量型波形、被保护件耐受电压）与 TVS 侧参数，
        逐条给出通过 / 不通过与裕量，并附 10/1000µs 简化浪涌能量估算。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        页面内 SMAJ 系列为公开 datasheet 整理的示例参数，<span class="text-foreground font-medium">参数以厂商 datasheet 为准</span>；
        8/20µs（电流型）与 10/1000µs（能量型）波形口径的 IPP 差数倍，核算前先确认波形口径。
        自核锚点：V工作 = 24 V、VRWM = 26 V → 条件① 过；V耐受 = 40 V、VC@IPP = 43.9 V → 条件③ 不过。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主流程区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 第一步：电路侧参数 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Zap class="w-5 h-5 mr-2 text-primary" /> 第一步 · 电路侧参数
            </h2>
            <span class="text-xs text-muted-foreground">步骤 1 / 3</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="tvs-vwork" class="block text-sm font-medium text-foreground mb-1.5">工作电压 V工作（V）</label>
              <input
                id="tvs-vwork"
                v-model.number="vWork"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 24"
              >
            </div>
            <div>
              <label for="tvs-isurge" class="block text-sm font-medium text-foreground mb-1.5">浪涌电流 I浪涌（A）</label>
              <input
                id="tvs-isurge"
                v-model.number="iSurge"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">浪涌波形口径</label>
            <div class="grid grid-cols-2 gap-1.5 max-w-md">
              <button
                @click="wave = '820'"
                :class="wave === '820' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >8/20µs 电流型</button>
              <button
                @click="wave = '101000'"
                :class="wave === '101000' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >10/1000µs 能量型</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              {{ wave === '820' ? '8/20µs 为电流型口径，模拟雷击感应与线缆耦合浪涌；厂商 IPP / VC 多按此口径标注。' : '10/1000µs 为能量型口径，模拟电话线与长线缆浪涌；同一颗 TVS 在此口径下 IPP 通常小数倍。' }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="tvs-vw" class="block text-sm font-medium text-foreground mb-1.5">被保护件耐受电压 V耐受（V）</label>
              <input
                id="tvs-vw"
                v-model.number="vWithstand"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 40"
              >
              <p class="text-xs text-muted-foreground mt-1">IC / 后级电路瞬态可承受的最大电压，查绝对最大额定值</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">条件② 浪涌裕量系数</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="k in marginKOptions"
                  :key="k"
                  @click="marginK = k"
                  :class="Number(marginK) === k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >{{ k }}</button>
              </div>
              <p class="text-xs text-muted-foreground mt-1">浪涌裕量上限 = V耐受 × 系数，默认 0.9 为常用工程裕量</p>
            </div>
          </div>
        </div>

        <!-- 第二步：TVS 器件参数 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Activity class="w-5 h-5 mr-2 text-primary" /> 第二步 · TVS 器件参数
            </h2>
            <span class="text-xs text-muted-foreground">步骤 2 / 3</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">SMAJ 系列示例参数（一键填入）</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in smajPresets"
                :key="p.id"
                @click="applyPreset(p)"
                :class="activePresetId === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ p.id }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              示例参数按公开 datasheet 整理（400 W 档、8/20µs 口径；VBR 取标称值，±5% 区间由本工具推算），
              <span class="text-foreground font-medium">参数以厂商 datasheet 为准</span>。双向（CA）型号电气参数与对应单向（A）型号一致。
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="tvs-vrwm" class="block text-sm font-medium text-foreground mb-1.5">VRWM 工作峰值电压（V）</label>
              <input
                id="tvs-vrwm"
                v-model.number="vrwm"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 24"
              >
            </div>
            <div>
              <label for="tvs-vbr" class="block text-sm font-medium text-foreground mb-1.5">VBR 击穿电压标称（V）</label>
              <input
                id="tvs-vbr"
                v-model.number="vbr"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 28.1"
              >
              <p v-if="vbrRangeTxt" class="text-xs text-muted-foreground mt-1">±5% 区间：{{ vbrRangeTxt }} V</p>
            </div>
            <div>
              <label for="tvs-vc" class="block text-sm font-medium text-foreground mb-1.5">VC@IPP 钳位电压（V）</label>
              <input
                id="tvs-vc"
                v-model.number="vc"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 38.9"
              >
            </div>
            <div>
              <label for="tvs-ipp" class="block text-sm font-medium text-foreground mb-1.5">额定峰值电流 IPP（A）</label>
              <input
                id="tvs-ipp"
                v-model.number="ipp"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10.3"
              >
            </div>
            <div>
              <label for="tvs-ppp" class="block text-sm font-medium text-foreground mb-1.5">额定峰值脉冲功率 PPP（W）</label>
              <input
                id="tvs-ppp"
                v-model.number="ppp"
                type="number"
                min="0"
                step="any"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 400"
              >
            </div>
          </div>
        </div>

        <!-- 第三步：四条件逐条判定 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <ListChecks class="w-5 h-5 mr-2 text-primary" /> 第三步 · 四条件逐条判定
            </h2>
            <span class="text-xs text-muted-foreground">步骤 3 / 3</span>
          </div>

          <template v-if="conditions.length">
            <div class="space-y-2.5">
              <div
                v-for="c in conditions"
                :key="c.id"
                class="flex items-start gap-2.5 rounded-lg p-3 border"
                :class="c.pass ? 'bg-muted/50 border-border' : 'bg-red-500/5 border-red-400/30'"
              >
                <CheckCircle v-if="c.pass" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <XCircle v-else class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <p class="text-sm font-medium" :class="c.pass ? 'text-foreground' : 'text-red-600 dark:text-red-400'">
                    {{ c.title }}：{{ c.pass ? '通过' : '不通过' }}
                  </p>
                  <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{{ c.detail }}</p>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            填写电路侧与 TVS 参数（均 &gt; 0）后逐条判定
          </div>
        </div>

        <!-- 附加：浪涌能量估算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Gauge class="w-5 h-5 mr-2 text-primary" /> 附加 · 浪涌能量估算
            </h2>
            <span class="text-xs text-muted-foreground">10/1000µs 简化口径</span>
          </div>

          <template v-if="energyJ !== null">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">简化估算 E = VC × I浪涌 × 1 ms</p>
              <p class="text-2xl font-bold text-primary">{{ fmtJ(energyJ) }} J <span class="text-base font-medium text-muted-foreground">（{{ fmtNum(energyJ * 1000, 4) }} mJ）</span></p>
              <p class="text-xs text-muted-foreground mt-1.5">
                VC = {{ fmtV(vc) }} V × I浪涌 = {{ fmtA(iSurge) }} A × 0.001 s
              </p>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground bg-muted/50 border border-border rounded-lg p-3">
              近似口径注记：以 1 ms 等效宽度做矩形等效，是 10/1000µs 能量型波形的工程简化式，结果偏保守、仅作数量级参考；
              用于 8/20µs 电流型波形会明显高估能量（其等效持续时间在数十 µs 量级）。精确能量按实际波形积分或对照厂商脉冲功率曲线核定，
              并与器件 erlaubt 的峰值脉冲功率曲线（PPP–脉冲宽度）比对。
            </p>
          </template>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            填写 VC 与浪涌电流（均 &gt; 0）后给出能量估算
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 结果汇总卡 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <ClipboardCheck class="w-4 h-4 mr-2 text-primary" /> 校验结果汇总
          </h3>

          <div v-if="conditions.length" class="rounded-lg p-4 text-center" :class="allPass ? 'bg-primary/10' : 'bg-red-500/10'">
            <div class="flex items-center justify-center gap-2">
              <CheckCircle v-if="allPass" class="w-5 h-5 text-primary" />
              <XCircle v-else class="w-5 h-5 text-red-600 dark:text-red-400" />
              <p class="text-lg font-bold" :class="allPass ? 'text-primary' : 'text-red-600 dark:text-red-400'">
                {{ allPass ? '通过' : '不通过' }}
              </p>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              {{ passCount }}/4 条件满足{{ allPass ? '' : '：' + failIds.join('、') + ' 待处理' }}
            </p>
          </div>
          <div v-else class="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            待填写参数
          </div>

          <div class="space-y-2 text-xs">
            <div v-for="c in conditions" :key="c.id" class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{{ c.id }}</span>
              <p class="text-muted-foreground leading-relaxed">{{ c.summary }}</p>
            </div>
            <div v-if="energyJ !== null" class="flex gap-2 items-start">
              <span class="flex-shrink-0 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">能量</span>
              <p class="text-muted-foreground leading-relaxed">浪涌能量估算 ≈ {{ fmtJ(energyJ) }} J（{{ fmtNum(energyJ * 1000, 4) }} mJ，1 ms 等效简化）</p>
            </div>
          </div>

          <div v-if="conditions.length" class="bg-muted/50 rounded-lg p-3">
            <p class="text-xs leading-relaxed text-foreground">{{ advice }}</p>
          </div>

          <button
            @click="copySummary"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground transition"
          >
            <Copy class="w-3.5 h-3.5" /> 复制校验汇总
          </button>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <LinkIcon class="w-4 h-4 mr-2 text-primary" /> 相关工具
          </h3>
          <div class="space-y-2">
            <NuxtLink
              v-for="t in relatedLinks"
              :key="t.id"
              :to="'/tools/' + t.id"
              class="block px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-foreground transition"
            >{{ t.name }}</NuxtLink>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>TVS 选型的四个条件</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          TVS（瞬态抑制二极管）是并联的电压钳位型保护器件：平时呈高阻不参与工作，浪涌到来瞬间雪崩导通把电压钳在安全值。
          选型按四条件逐条核对：① <strong>VRWM ≥ 工作电压</strong>——反向工作峰值电压必须不低于电路最高工作电压，保证常态不导通、不漏电、不发热；
          ② <strong>VBR_max 落在浪涌裕量内</strong>——击穿电压有 ±5%（常见档）制造公差，最坏情形的 VBR_max 必须低于浪涌电压预算
          （本工具按 V耐受 × 裕量系数核算，默认 0.9），浪涌上升沿才能提前把器件推进雪崩导通、钳位尽早介入；
          ③ <strong>VC@IPP &lt; 被保护件耐受电压</strong>——额定峰值电流下的最大钳位电压必须低于下游 IC 的瞬态耐受，
          这是四条里最常卡住的一条；④ <strong>脉冲功率不超额定</strong>——实际浪涌电流 × 钳位电压不超过额定峰值脉冲功率 PPP，
          且浪涌电流不超过器件额定 IPP。四条全部满足才算选型成立。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>双向与单向 TVS 怎么选</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          单向 TVS（型号尾缀 A）只对反向浪涌钳位，正向导通时压降仅 0.3~0.7 V，因此用在直流电源与单极性信号线上时，
          负向浪涌会被正向结「贴地」钳住，反而更彻底；双向 TVS（尾缀 CA）正负对称钳位，用于交流输入、
          正负对称的信号（如音频线、RS-485 A/B 线间）或负向不允许被钳到地的场合。选错方向的典型后果：
          直流线上误用双向，负向钳位电压抬高一倍，防护变差；对称信号线上误用单向，正半周或负半周被钳到地，信号失真。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>8/20µs 与 10/1000µs 波形口径</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          浪涌波形用「视在波前时间 / 半峰值时间」标注，口径决定能量与 IPP 的换算。8/20µs 是电流型口径（8 µs 达峰、20 µs 降至半峰），
          模拟雷击感应与线缆耦合浪涌，电源口与大多数贴片 TVS 的 IPP / VC 按此标注；10/1000µs 是能量型口径
          （10 µs 达峰、1000 µs 降至半峰），持续时间长近百倍，模拟电话线与长线缆浪涌，同一颗 TVS 在此口径下允许的峰值电流通常小数倍。
          核算时先确认 datasheet 参数的波形口径再代入，混用口径会差出数倍裕量。本工具的附加能量估算 E = VC × I浪涌 × 1 ms
          即按 10/1000µs 的 1 ms 等效宽度做的矩形简化，结果为近似值。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>TVS vs 压敏电阻（MOV）：粗细两级分工</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          <NuxtLink to="/wiki/tvs-diode" class="text-primary hover:underline">TVS 瞬态抑制二极管</NuxtLink>
          响应快（皮秒级）、钳位精准、寿命内参数稳定，但能量吞吐小，放板级做精细防护；
          压敏电阻（MOV）能量吞吐大、成本低，但钳位电压离散大、响应慢（纳秒到几十纳秒）、反复浪涌后会老化漏电，放电源输入级做粗防护。
          典型两级配置：输入级 MOV 粗吸能量，级间配合退耦电感 / 电阻，后级 TVS 精细钳位到 IC 可耐受的电压。
          与之配套的上游保护还有
          <NuxtLink to="/tools/fuse-selector" class="text-primary hover:underline">保险丝选型计算器</NuxtLink>
          （过流切断）——TVS 管电压、保险丝管电流，两者配合才是完整的浪涌与过流防护链。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">TVS 选型四条件是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              ① VRWM ≥ 工作电压；② 最坏公差下的 VBR_max 低于浪涌电压预算（V耐受 × 裕量系数）；③ VC@IPP &lt; 被保护件耐受电压；
              ④ 实际浪涌电流 × VC ≤ 额定 PPP 且浪涌电流 ≤ 额定 IPP。四条全过才算成立，任何一条不过都要换档或换系列。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">条件③ 不通过怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              三个方向：换同 VRWM 但钳位更低的系列（同系列功率越大 VC 越低）、放大一档功率（400 W → 600 W / 1500 W，
              同 VRWM 下 VC 显著下降）、或在 TVS 与被保护件之间加串联阻抗（电阻 / 磁珠 / 共模电感）分压限流。
              放大功率后回条件②④复核。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">VRWM 能不能等于工作电压？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              口径上 VRWM ≥ 工作电压即成立，但工程上要按「电路最高工作电压」取值——含电源公差、纹波与感性尖峰。
              24 V 标称电源的实际最高电压可能到 26~28 V，此时应选 VRWM 28 V 以上的档位，
              否则 TVS 长期处于接近击穿的反偏状态，漏电与发热会让钳位点漂移。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">8/20µs 的参数能直接用到 10/1000µs 场景吗？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              不能直接套。10/1000µs 持续时间约为 8/20µs 的 50 倍，同功率等级下允许的峰值电流小数倍；
              应查 datasheet 的脉冲功率–脉宽曲线或厂商给出的 10/1000µs 专用表格，按能量口径重新核算。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'tvs-selector'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Shield, Zap, Activity, Gauge, ListChecks, ClipboardCheck, Info,
  CheckCircle, XCircle, ChevronUp, ChevronDown, Copy, Link as LinkIcon
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'tvs-selector'
const STORAGE_KEY = 'tvs-selector.inputs'

// SEO
useSeoMeta({
  title: 'TVS选型校验器 - VRWM/VBR/VC/IPP四条件判定与浪涌能量估算',
  description: '在线 TVS 二极管选型校验器：四条件判定 VRWM≥工作电压、VBR_max 在浪涌裕量内、VC@IPP<耐受电压、脉冲功率不超额定 PPP，附 8/20µs 与 10/1000µs 口径说明、浪涌能量估算与 SMAJ 系列示例参数，纯本地计算',
  keywords: 'tvs选型, tvs二极管, 钳位电压计算, 浪涌保护, esd防护, tvs calculator, 瞬态抑制二极管',
  author: 'Util工具箱',
  ogTitle: 'TVS选型校验器 - 有条工具',
  ogDescription: 'VRWM / VBR / VC / IPP 四条件逐条判定与浪涌能量估算',
  ogUrl: 'https://www.util.cn/tools/tvs-selector',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'TVS选型校验器',
  twitterDescription: 'TVS 四条件校验、浪涌口径与能量估算，纯本地计算'
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
          name: 'TVS选型校验器',
          url: 'https://www.util.cn/tools/tvs-selector',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'VRWM / VBR / VC / IPP 四条件逐条判定',
            'VBR ±5% 公差区间推算',
            '8/20µs 与 10/1000µs 波形口径说明',
            '浪涌能量简化估算（E=VC×IPP×1ms）',
            'SMAJ 系列公开参数示例与一键填入'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'TVS选型校验器', item: 'https://www.util.cn/tools/tvs-selector/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'TVS 选型四条件是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '① VRWM≥工作电压；② 最坏公差下的 VBR_max 低于浪涌电压预算（V耐受×裕量系数）；③ VC@IPP<被保护件耐受电压；④ 实际浪涌电流×VC≤额定 PPP 且浪涌电流≤额定 IPP。四条全部满足选型才成立。' }
            },
            {
              '@type': 'Question',
              name: '8/20µs 与 10/1000µs 波形口径有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '8/20µs 是电流型口径，模拟雷击感应与线缆耦合浪涌；10/1000µs 是能量型口径，持续时间长约 50 倍，同一颗 TVS 允许的峰值电流小数倍。核算前先确认 datasheet 参数的波形口径，不能混用。' }
            },
            {
              '@type': 'Question',
              name: '双向和单向 TVS 怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '直流电源与单极性信号线选单向（A），负向浪涌由正向结贴地钳住更彻底；交流输入、正负对称信号或负向不允许钳到地的场合选双向（CA）。' }
            },
            {
              '@type': 'Question',
              name: 'TVS 和压敏电阻（MOV）怎么分工？',
              acceptedAnswer: { '@type': 'Answer', text: 'TVS 响应快（皮秒级）、钳位精准但能量小，放板级精细防护；MOV 能量大但钳位粗、会老化，放电源输入级粗防护；两级配合，粗细分工。' }
            }
          ]
        }
      ]
    })
  }]
})

// __PURE_FNS_START__
// ---------- TVS 选型校验纯函数（无外部依赖） ----------
// VBR ±5% 公差区间（常见 TVS 档位公差）
const vbrRange = (vbr) => {
  const v = Number(vbr)
  if (!isFinite(v) || v <= 0) return { min: NaN, max: NaN }
  return { min: v * 0.95, max: v * 1.05 }
}

// 条件①：VRWM ≥ V工作（常态不导通不漏电）；marginPct = VRWM 相对工作电压的裕量
const checkVrwm = (vrwm, vWork) => {
  const a = Number(vrwm), b = Number(vWork)
  if (!isFinite(a) || a <= 0 || !isFinite(b) || b <= 0) return null
  return { pass: a >= b - 1e-9, marginPct: (a / b - 1) * 100 }
}

// 条件②：VBR_max（标称 × 1.05）< 浪涌裕量上限 = V耐受 × 系数；浪涌上升沿提前钳位介入
const checkVbr = (vbr, vWithstand, marginK) => {
  const v = Number(vbr), w = Number(vWithstand), k = Number(marginK)
  if (!isFinite(v) || v <= 0 || !isFinite(w) || w <= 0 || !isFinite(k) || k <= 0 || k > 1) return null
  const vbrMax = v * 1.05
  const limit = w * k
  return { vbrMax, limit, pass: vbrMax < limit, marginPct: (limit / vbrMax - 1) * 100 }
}

// 条件③：VC@IPP < V耐受（全电流钳位不伤下游）；marginPct = 耐受相对钳位的裕量
const checkVc = (vc, vWithstand) => {
  const c = Number(vc), w = Number(vWithstand)
  if (!isFinite(c) || c <= 0 || !isFinite(w) || w <= 0) return null
  return { pass: c < w, marginPct: (w / c - 1) * 100 }
}

// 条件④：脉冲功率 I浪涌 × VC ≤ PPP，且 I浪涌 ≤ 额定 IPP
// （VC@IPP 为额定电流下最大钳位，实际浪涌下钳位更低，口径偏保守）
const checkPower = (iSurge, vc, ippRated, ppp) => {
  const i = Number(iSurge), c = Number(vc), ir = Number(ippRated), p = Number(ppp)
  if (!isFinite(i) || i <= 0 || !isFinite(c) || c <= 0 || !isFinite(ir) || ir <= 0 || !isFinite(p) || p <= 0) return null
  const pImposed = i * c
  const overIp = i > ir
  return { pImposed, overIp, pass: pImposed <= p && !overIp, marginPct: (p / pImposed - 1) * 100 }
}

// 附加：浪涌能量估算（10/1000µs 简化）E = VC × I浪涌 × 1ms
const surgeEnergyJ = (vc, iSurge) => {
  const c = Number(vc), i = Number(iSurge)
  if (!isFinite(c) || c <= 0 || !isFinite(i) || i <= 0) return NaN
  return c * i * 0.001
}

// 展示格式化（避免浮点尾差）
const fmtNum = (v, sig = 4) => (isFinite(v) ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtV = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtA = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtW = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
const fmtJ = (v, sig = 4) => (isFinite(v) && v > 0 ? Number(v.toPrecision(sig)).toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '—')
// __PURE_FNS_END__

// ---------- 状态 ----------
const marginKOptions = [0.8, 0.9, 0.95]
const vWork = ref(24)
const iSurge = ref(10)
const wave = ref('820')
const vWithstand = ref(40)
const marginK = ref(0.9)

const vrwm = ref(24)
const vbr = ref(28.1)
const vc = ref(38.9)
const ipp = ref(10.3)
const ppp = ref(400)

// SMAJ 系列示例参数（公开 datasheet 整理，400W 档、8/20µs 口径；参数以厂商 datasheet 为准）
const smajPresets = [
  { id: 'SMAJ5.0A', vrwm: 5.0, vbr: 5.79, vc: 9.2, ipp: 43.5, ppp: 400 },
  { id: 'SMAJ12A', vrwm: 12, vbr: 14.0, vc: 19.9, ipp: 20.1, ppp: 400 },
  { id: 'SMAJ15A', vrwm: 15, vbr: 17.6, vc: 24.4, ipp: 16.4, ppp: 400 },
  { id: 'SMAJ18A', vrwm: 18, vbr: 21.05, vc: 29.2, ipp: 13.7, ppp: 400 },
  { id: 'SMAJ24A', vrwm: 24, vbr: 28.1, vc: 38.9, ipp: 10.3, ppp: 400 },
  { id: 'SMAJ26A', vrwm: 26, vbr: 30.4, vc: 42.1, ipp: 9.5, ppp: 400 },
  { id: 'SMAJ28A', vrwm: 28, vbr: 32.7, vc: 45.4, ipp: 8.8, ppp: 400 },
  { id: 'SMAJ33A', vrwm: 33, vbr: 38.7, vc: 53.3, ipp: 7.5, ppp: 400 },
  { id: 'SMAJ48A', vrwm: 48, vbr: 56.1, vc: 77.4, ipp: 5.2, ppp: 400 }
]

const applyPreset = (p) => {
  vrwm.value = p.vrwm
  vbr.value = p.vbr
  vc.value = p.vc
  ipp.value = p.ipp
  ppp.value = p.ppp
}

const activePresetId = computed(() => {
  const hit = smajPresets.find(p => p.vrwm === vrwm.value && p.vbr === vbr.value && p.vc === vc.value && p.ipp === ipp.value && p.ppp === ppp.value)
  return hit ? hit.id : null
})

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id）
watch([vWork, iSurge, wave, vWithstand, marginK, vrwm, vbr, vc, ipp, ppp], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      vWork: vWork.value,
      iSurge: iSurge.value,
      wave: wave.value,
      vWithstand: vWithstand.value,
      marginK: marginK.value,
      vrwm: vrwm.value,
      vbr: vbr.value,
      vc: vc.value,
      ipp: ipp.value,
      ppp: ppp.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  // 恢复上次输入
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      const num = (v, min) => (typeof v === 'number' && isFinite(v) && v > (min === undefined ? -Infinity : min) ? v : null)
      const vw = num(s.vWork, 0)
      if (vw !== null) vWork.value = vw
      const is = num(s.iSurge, 0)
      if (is !== null) iSurge.value = is
      if (s.wave === '820' || s.wave === '101000') wave.value = s.wave
      const ws = num(s.vWithstand, 0)
      if (ws !== null) vWithstand.value = ws
      const mk = num(s.marginK, 0)
      if (mk !== null && mk <= 1) marginK.value = mk
      const vr = num(s.vrwm, 0)
      if (vr !== null) vrwm.value = vr
      const vb = num(s.vbr, 0)
      if (vb !== null) vbr.value = vb
      const cv = num(s.vc, 0)
      if (cv !== null) vc.value = cv
      const ip = num(s.ipp, 0)
      if (ip !== null) ipp.value = ip
      const pp = num(s.ppp, 0)
      if (pp !== null) ppp.value = pp
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

// ---------- 判定 ----------
const vbrRangeTxt = computed(() => {
  const r = vbrRange(vbr.value)
  return isFinite(r.min) ? `${fmtNum(r.min)} ~ ${fmtNum(r.max)}` : ''
})

const r1 = computed(() => checkVrwm(vrwm.value, vWork.value))
const r2 = computed(() => checkVbr(vbr.value, vWithstand.value, marginK.value))
const r3 = computed(() => checkVc(vc.value, vWithstand.value))
const r4 = computed(() => checkPower(iSurge.value, vc.value, ipp.value, ppp.value))
const energyJ = computed(() => {
  const e = surgeEnergyJ(vc.value, iSurge.value)
  return isFinite(e) && e > 0 ? e : null
})

const conditions = computed(() => {
  const list = []
  if (r1.value) {
    list.push({
      id: '①',
      pass: r1.value.pass,
      title: 'VRWM ≥ V工作',
      detail: `VRWM = ${fmtV(vrwm.value)} V，V工作 = ${fmtV(vWork.value)} V，裕量 ${fmtNum(r1.value.marginPct, 3)}%。常态下 TVS 不导通、不漏电。`,
      summary: `VRWM ${fmtV(vrwm.value)} V vs V工作 ${fmtV(vWork.value)} V，${r1.value.pass ? '过' : '不过'}`
    })
  }
  if (r2.value) {
    list.push({
      id: '②',
      pass: r2.value.pass,
      title: 'VBR_max < 浪涌裕量上限',
      detail: `VBR_max = 标称 ${fmtV(vbr.value)} V × 1.05 = ${fmtV(r2.value.vbrMax)} V，浪涌裕量上限 = V耐受 ${fmtV(vWithstand.value)} V × ${fmtNum(marginK.value, 3)} = ${fmtV(r2.value.limit)} V，裕量 ${fmtNum(r2.value.marginPct, 3)}%。浪涌上升沿提前推进雪崩导通、钳位尽早介入。`,
      summary: `VBR_max ${fmtV(r2.value.vbrMax)} V vs 上限 ${fmtV(r2.value.limit)} V，${r2.value.pass ? '过' : '不过'}`
    })
  }
  if (r3.value) {
    list.push({
      id: '③',
      pass: r3.value.pass,
      title: 'VC@IPP < V耐受',
      detail: `VC@IPP = ${fmtV(vc.value)} V，V耐受 = ${fmtV(vWithstand.value)} V，裕量 ${fmtNum(r3.value.marginPct, 3)}%。全电流钳位不伤下游。`,
      summary: `VC@IPP ${fmtV(vc.value)} V vs V耐受 ${fmtV(vWithstand.value)} V，${r3.value.pass ? '过' : '不过'}`
    })
  }
  if (r4.value) {
    list.push({
      id: '④',
      pass: r4.value.pass,
      title: r4.value.overIp ? '浪涌电流超额定 IPP' : '脉冲功率不超额定 PPP',
      detail: r4.value.overIp
        ? `I浪涌 = ${fmtA(iSurge.value)} A > 额定 IPP = ${fmtA(ipp.value)} A，超出器件峰值电流能力，需换更大电流档。`
        : `I浪涌 × VC = ${fmtA(iSurge.value)} A × ${fmtV(vc.value)} V = ${fmtW(r4.value.pImposed)} W，额定 PPP = ${fmtW(ppp.value)} W，功率裕量 ${fmtNum(r4.value.marginPct, 3)}%（VC@IPP 口径偏保守）。`,
      summary: r4.value.overIp
        ? `I浪涌 ${fmtA(iSurge.value)} A > IPP ${fmtA(ipp.value)} A，不过`
        : `脉冲功率 ${fmtW(r4.value.pImposed)} W vs PPP ${fmtW(ppp.value)} W，${r4.value.pass ? '过' : '不过'}`
    })
  }
  return list
})

const allPass = computed(() => conditions.value.length === 4 && conditions.value.every(c => c.pass))
const passCount = computed(() => conditions.value.filter(c => c.pass).length)
const failIds = computed(() => conditions.value.filter(c => !c.pass).map(c => c.id).join('、'))

const advice = computed(() => {
  const parts = []
  const fails = conditions.value.filter(c => !c.pass)
  if (!fails.length) {
    parts.push('四条件全部满足，选型成立。')
  } else {
    if (fails.some(f => f.id === '①')) parts.push('条件①不过：换 VRWM 更高的一档，使 VRWM 覆盖含公差与纹波的最高工作电压。')
    if (fails.some(f => f.id === '②')) parts.push('条件②不过：降低 VBR 档位或放宽浪涌裕量系数，保证最坏公差下浪涌沿仍能推进雪崩导通。')
    if (fails.some(f => f.id === '③')) parts.push('条件③不过：换同 VRWM 下钳位更低的更大功率档（400 W → 600 W / 1500 W），或在 TVS 与被保护件之间加串联阻抗分压。')
    if (fails.some(f => f.id === '④')) parts.push('条件④不过：换额定 IPP / PPP 更大的档位，或在电路侧抑制浪涌（串联阻抗、缓启动）。')
  }
  return parts.join(' ') + '参数以厂商 datasheet 为准。'
})

const copySummary = () => {
  const lines = [
    'TVS 选型校验汇总',
    `电路侧：V工作 ${fmtV(vWork.value)} V，I浪涌 ${fmtA(iSurge.value)} A（${wave.value === '820' ? '8/20µs 电流型' : '10/1000µs 能量型'}），V耐受 ${fmtV(vWithstand.value)} V`,
    `TVS：VRWM ${fmtV(vrwm.value)} V，VBR ${fmtV(vbr.value)} V（±5%：${vbrRangeTxt.value}），VC@IPP ${fmtV(vc.value)} V，IPP ${fmtA(ipp.value)} A，PPP ${fmtW(ppp.value)} W`,
    ...conditions.value.map(c => `${c.id} ${c.title}：${c.pass ? '通过' : '不通过'} —— ${c.summary}`),
    energyJ.value !== null ? `能量估算 ≈ ${fmtJ(energyJ.value)} J（10/1000µs 简化口径，近似）` : '',
    `汇总：${conditions.value.length ? (allPass.value ? '通过' : `不通过（${failIds.value} 待处理）`) : '待填写参数'}`,
    '注：参数以厂商 datasheet 为准。'
  ].filter(Boolean)
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      alert('已复制校验汇总到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动选择文本复制')
    })
  } else {
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['fuse-selector', 'relay-driver-calc', 'optocoupler-resistor']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
