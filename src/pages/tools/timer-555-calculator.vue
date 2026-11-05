<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <AlarmClock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">555定时器计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">NE555 无稳态/单稳态正反算、E12 标准电阻吸附回验、SVG 电路图随参数重绘</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 555 定时器计算器：无稳态按 t<sub>H</sub> = 0.693(R1+R2)C、t<sub>L</sub> = 0.693·R2·C 计算 f = 1.44/((R1+2R2)C) 与占空比，
        支持给定目标频率和占空比反向求解 R1/R2（逐档尝试标准电容、吸附 E12 标准电阻并回验偏差，占空比 &lt; 50% 自动提示二极管旁路接法）；
        单稳态按 T = 1.1×R×C 正反算。附 DIP-8 引脚图与随参数实时重绘的无稳态/单稳态接法 SVG 电路图、参数取值指引与 555 内部原理科普。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        计算口径：采用 NE555 经典近似公式——高电平时间 t<sub>H</sub> = 0.693(R1+R2)C，低电平时间 t<sub>L</sub> = 0.693·R2·C，
        周期 T = t<sub>H</sub> + t<sub>L</sub>，频率 f = 1/T ≈ 1.44/((R1+2R2)C)，占空比 D = t<sub>H</sub>/T = (R1+R2)/(R1+2R2)；
        单稳态 T = 1.1×R×C。0.693 = ln2、1.44 ≈ 1/0.693 为手册常用近似值，本页全部结果由 t<sub>H</sub>/t<sub>L</sub> 精确推得，
        f 与 T 严格互为倒数。双极型 NE555 与 CMOS 7555 的实际阈值/输出压降略有差异，精密应用以原厂 datasheet 实测为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模式 Tab -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <Timer class="w-5 h-5 mr-2 text-primary" /> 计算模式
            </h2>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="mode = 'astable'"
                :class="mode === 'astable' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >无稳态（方波振荡）</button>
              <button
                @click="mode = 'mono'"
                :class="mode === 'mono' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >单稳态（定时延时）</button>
            </div>
          </div>

          <!-- ===== 无稳态模式 ===== -->
          <div v-if="mode === 'astable'">
            <!-- 正算 / 反算 子切换 -->
            <div class="grid grid-cols-2 gap-1.5 mb-5">
              <button
                @click="astSub = 'fwd'"
                :class="astSub === 'fwd' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >正向：R1/R2/C → f、占空比</button>
              <button
                @click="astSub = 'rev'"
                :class="astSub === 'rev' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >反向：目标 f、占空比 → R1/R2</button>
            </div>

            <!-- 无稳态正向 -->
            <div v-if="astSub === 'fwd'" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label for="t555-r1" class="block text-sm font-medium text-foreground mb-1.5">R1（VCC→7脚）</label>
                  <div class="flex gap-1.5">
                    <input
                      id="t555-r1"
                      v-model.number="r1Fwd"
                      type="number"
                      min="0"
                      step="0.1"
                      class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="如 1"
                    >
                    <select
                      v-model="r1FwdUnit"
                      aria-label="R1 单位"
                      class="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="1">Ω</option>
                      <option value="1000">kΩ</option>
                      <option value="1000000">MΩ</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label for="t555-r2" class="block text-sm font-medium text-foreground mb-1.5">R2（7脚→6脚）</label>
                  <div class="flex gap-1.5">
                    <input
                      id="t555-r2"
                      v-model.number="r2Fwd"
                      type="number"
                      min="0"
                      step="0.1"
                      class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="如 6.8"
                    >
                    <select
                      v-model="r2FwdUnit"
                      aria-label="R2 单位"
                      class="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="1">Ω</option>
                      <option value="1000">kΩ</option>
                      <option value="1000000">MΩ</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label for="t555-c" class="block text-sm font-medium text-foreground mb-1.5">C（6脚→地）</label>
                  <div class="flex gap-1.5">
                    <input
                      id="t555-c"
                      v-model.number="cFwd"
                      type="number"
                      min="0"
                      step="0.01"
                      class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="如 0.1"
                    >
                    <select
                      v-model="cFwdUnit"
                      aria-label="C 单位"
                      class="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="1e-12">pF</option>
                      <option value="1e-9">nF</option>
                      <option value="1e-6">µF</option>
                    </select>
                  </div>
                </div>
              </div>

              <div v-if="astFwdResult" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">频率 f</p>
                    <p class="text-xl font-bold text-primary">{{ fmtFreq(astFwdResult.freq) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">占空比 D</p>
                    <p class="text-xl font-bold text-primary">{{ fmt(astFwdResult.duty * 100, 2) }}%</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">周期 T</p>
                    <p class="text-xl font-bold text-foreground">{{ fmtDur(astFwdResult.period) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">高/低电平</p>
                    <p class="text-sm font-bold text-foreground pt-1.5">{{ fmtDur(astFwdResult.tHigh) }} / {{ fmtDur(astFwdResult.tLow) }}</p>
                  </div>
                </div>
                <div class="pt-3 border-t border-primary/20 text-xs text-muted-foreground leading-relaxed">
                  t<sub>H</sub> = 0.693×(R1+R2)×C = 0.693×{{ fmt(r1FwdAbs, 4) }}Ω×{{ fmt(cFwdAbs, 9) }}F → {{ fmtDur(astFwdResult.tHigh) }}；
                  t<sub>L</sub> = 0.693×R2×C → {{ fmtDur(astFwdResult.tLow) }}。
                  快算式 f ≈ 1.44/((R1+2R2)×C) = 1.44/({{ fmt(r1FwdAbs + 2 * r2FwdAbs, 4) }}Ω × {{ fmt(cFwdAbs, 9) }}F) ≈ {{ fmtFreq(1.44 / ((r1FwdAbs + 2 * r2FwdAbs) * cFwdAbs)) }}（与本页精确值差 &lt;0.3%，源于 1.44 对 1/ln2 的取整）。
                </div>
                <!-- 占空比波形条（随参数重绘） -->
                <svg viewBox="0 0 360 78" class="w-full max-w-md mx-auto" role="img" aria-label="输出方波占空比示意">
                  <template v-for="p in wavePhases" :key="p.key">
                    <rect v-if="p.high" :x="p.x" y="14" :width="p.w" height="36" class="fill-current text-primary/70" />
                    <rect v-else :x="p.x" y="38" :width="p.w" height="12" class="fill-current text-muted-foreground/50" />
                    <line :x1="p.x" y1="14" :x2="p.x" y2="50" class="stroke-border" stroke-width="1" />
                  </template>
                  <text x="180" y="66" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">
                    高电平 tH {{ fmt(waveHiPct, 1) }}% / 低电平 tL {{ fmt(100 - waveHiPct, 1) }}%（两个周期示意）
                  </text>
                </svg>
                <p class="text-xs" :class="astFwdResult.duty >= 0.5 ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400 font-medium'">
                  <span v-if="astFwdResult.duty >= 0.5">占空比 ≥ 50%，标准 R1/R2 接法可直接实现。</span>
                  <span v-else>占空比 &lt; 50%：标准接法无法实现（D = (R1+R2)/(R1+2R2) 恒 &gt; 50%），需二极管旁路 R2 的充电回路，见下方提示。</span>
                </p>
              </div>
              <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-foreground">暂无法计算</p>
                  <p class="text-xs text-muted-foreground mt-1">请检查参数：R1、R2、C 均须大于 0。推荐 R 取 1kΩ~1MΩ、C 取 500pF~10µF。</p>
                </div>
              </div>
            </div>

            <!-- 无稳态反向 -->
            <div v-else class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="t555-frev" class="block text-sm font-medium text-foreground mb-1.5">目标频率 f</label>
                  <div class="flex gap-1.5">
                    <input
                      id="t555-frev"
                      v-model.number="fTarget"
                      type="number"
                      min="0"
                      step="1"
                      class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="如 1"
                    >
                    <select
                      v-model="fTargetUnit"
                      aria-label="目标频率单位"
                      class="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="1">Hz</option>
                      <option value="1000">kHz</option>
                      <option value="1000000">MHz</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label for="t555-drev" class="block text-sm font-medium text-foreground mb-1.5">目标占空比 D（%）</label>
                  <input
                    id="t555-drev"
                    v-model.number="dTargetPct"
                    type="number"
                    min="1"
                    max="99"
                    step="1"
                    class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="如 60"
                  >
                  <p class="text-xs text-muted-foreground mt-1">标准 R1/R2 接法仅支持 50%~接近 100%（&lt;50% 需二极管旁路接法）</p>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="p in FREQ_PRESETS" :key="p.value"
                  @click="fTarget = p.value; fTargetUnit = String(p.unit)"
                  :class="Number(fTargetUnit) === p.unit && fTarget === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >{{ p.label }}</button>
              </div>

              <!-- 占空比 < 50% 黄条提示 -->
              <div v-if="dTargetPct < 50 && Number.isFinite(dTargetPct)" class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div class="space-y-2">
                  <p class="text-sm font-medium text-foreground">标准 R1/R2 结构无法达到 D &lt; 50%，需二极管旁路充电回路</p>
                  <p class="text-xs text-muted-foreground leading-relaxed">
                    标准接法中充电走 R1+R2、放电只走 R2，故 D = (R1+R2)/(R1+2R2) 恒大于 50%。
                    要得到更低占空比，可在 <span class="text-foreground font-medium">R2 两端并联一只二极管（阳极接 7 脚侧、阴极接 6 脚侧，如 1N4148）</span>：
                    充电电流绕过 R2 只经 R1（t<sub>H</sub> ≈ 0.693×R1×C），放电仍走 R2（t<sub>L</sub> ≈ 0.693×R2×C）。
                    此时取 R1 ≈ D·T/(0.693C)、R2 ≈ (1−D)·T/(0.693C)，各自吸附 E12 即可；再串联一只小电阻（如 1kΩ）于 R1 支路可避免放电初期灌入大电流。
                  </p>
                  <svg viewBox="0 0 420 120" class="w-full max-w-md" role="img" aria-label="二极管旁路 R2 接法示意">
                    <line x1="40" y1="20" x2="380" y2="20" class="stroke-border" stroke-width="2" />
                    <text x="40" y="14" font-size="11" class="fill-current text-muted-foreground">+VCC</text>
                    <rect x="54" y="40" width="14" height="36" rx="2" class="fill-muted stroke-border" stroke-width="1.4" />
                    <line x1="61" y1="20" x2="61" y2="40" class="stroke-border" stroke-width="1.6" />
                    <text x="76" y="62" font-size="11" class="fill-current text-foreground">R1 → 7脚</text>
                    <!-- 二极管并联在 R2 两端 -->
                    <rect x="54" y="76" width="14" height="36" rx="2" class="fill-muted stroke-border" stroke-width="1.4" />
                    <text x="76" y="98" font-size="11" class="fill-current text-foreground">R2 → 6脚</text>
                    <line x1="40" y1="62" x2="61" y2="62" class="stroke-border" stroke-width="1.6" />
                    <line x1="40" y1="62" x2="40" y2="104" class="stroke-border" stroke-width="1.6" />
                    <!-- diode triangle pointing right (anode left @7脚侧, cathode right @6脚侧) -->
                    <line x1="26" y1="62" x2="40" y2="62" class="stroke-border" stroke-width="1.6" />
                    <line x1="61" y1="62" x2="86" y2="62" class="stroke-border" stroke-width="1.6" />
                    <path d="M 88 52 L 88 72 L 108 62 Z" class="fill-current text-primary" />
                    <line x1="108" y1="52" x2="108" y2="72" class="stroke-border" stroke-width="2" />
                    <line x1="108" y1="62" x2="126" y2="62" class="stroke-border" stroke-width="1.6" />
                    <text x="130" y="66" font-size="11" class="fill-current text-foreground">1N4148 并联于 R2 两端（旁路充电）</text>
                    <text x="40" y="116" font-size="10" class="fill-current text-muted-foreground">tH ≈ 0.693×R1×C（充电绕过 R2），tL ≈ 0.693×R2×C</text>
                  </svg>
                </div>
              </div>

              <!-- 反算结果 -->
              <div v-if="astRevResult && astRevResult.ok" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">选定电容 C</p>
                    <p class="text-xl font-bold text-primary">{{ fmt(astRevResult.cUf, 4) }} <span class="text-sm">µF</span></p>
                    <p class="text-[11px] text-muted-foreground mt-0.5">标准档逐档尝试</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">R1（E12 吸附）</p>
                    <p class="text-xl font-bold text-foreground">{{ fmtRes(astRevResult.r1) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">R2（E12 吸附）</p>
                    <p class="text-xl font-bold text-foreground">{{ fmtRes(astRevResult.r2) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">实际占空比</p>
                    <p class="text-xl font-bold text-foreground">{{ fmt(astRevResult.fwd.duty * 100, 1) }}%</p>
                  </div>
                </div>
                <div class="pt-3 border-t border-primary/20 text-sm text-muted-foreground space-y-1.5">
                  <p>
                    回验实际频率：<span class="font-semibold text-foreground">{{ fmtFreq(astRevResult.fwd.freq) }}</span>
                    （目标 {{ fmtFreq(fTargetAbs) }}，偏差 <span :class="devCls(astRevResult.fDev)">{{ devText(astRevResult.fDev) }}</span>）；
                    实际占空比 {{ fmt(astRevResult.fwd.duty * 100, 2) }}%
                    （目标 {{ fmt(dTargetPct, 1) }}%，偏差 <span :class="devCls(astRevResult.dDev)">{{ devText(astRevResult.dDev) }}</span>）。
                  </p>
                  <p class="text-xs">
                    求解过程：对 {{ C_TRIALS.length }} 个标准电容档逐一解 R2 = S(1−D)、R1 = S(2D−1)（S = T/(0.693C)），
                    仅保留两电阻均落 1kΩ~1MΩ 合理区的档位，吸附 E12 后按正向公式回验，取 f 与 D 综合偏差最小的一组。
                    下方电路图与引脚标注已随本组解重绘。
                  </p>
                  <p v-if="Math.abs(astRevResult.fDev) <= 5 && Math.abs(astRevResult.dDev) <= 5" class="text-xs text-green-600 dark:text-green-400">
                    两项偏差均在 ±5% 内，可直接按此取值；要求更准时可微调并实测（占空比精度受 R1/R2 档位差限制）。
                  </p>
                </div>
              </div>
              <div v-else-if="astRevResult && astRevResult.error === 'nosol'" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-foreground">无 1kΩ~1MΩ 区间的标准解</p>
                  <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                    在 {{ C_TRIALS.length }} 个标准电容档下，满足目标频率所需的 R1/R2 均超出 1kΩ~1MΩ 合理区。
                    常见原因：目标频率过高（电容档偏大、电阻被压到 1k 以下）或过低（电阻超过 1M）。可尝试：换更小/更大目标频率、
                    接受旁路档电容自行试凑，或改用 7555（CMOS 版允许更大电阻、更小电流）。
                  </p>
                </div>
              </div>
              <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-muted-foreground">
                  <span v-if="astRevResult && astRevResult.error === 'duty'">
                    目标占空比低于 50%：标准 R1/R2 结构无法直接实现，请采用上方黄条提示的二极管旁路充电回路接法（R1 ≈ D·T/(0.693C)、R2 ≈ (1−D)·T/(0.693C)），或把占空比调到 50% 以上再反算。
                  </span>
                  <span v-else>请检查参数：目标频率须大于 0，目标占空比填 1~99 的数字。</span>
                </p>
              </div>
            </div>
          </div>

          <!-- ===== 单稳态模式 ===== -->
          <div v-else class="space-y-4">
            <div class="grid grid-cols-2 gap-1.5 mb-2">
              <button
                @click="monoSub = 'fwd'"
                :class="monoSub === 'fwd' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >正向：R、C → 定时 T</button>
              <button
                @click="monoSub = 'rev'"
                :class="monoSub === 'rev' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >反向：目标 T、C → R</button>
            </div>

            <div v-if="monoSub === 'fwd'" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="t555-rm" class="block text-sm font-medium text-foreground mb-1.5">R（VCC→6/7脚）</label>
                  <div class="flex gap-1.5">
                    <input
                      id="t555-rm"
                      v-model.number="rMono"
                      type="number"
                      min="0"
                      step="0.1"
                      class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="如 10"
                    >
                    <select
                      v-model="rMonoUnit"
                      aria-label="R 单位"
                      class="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="1">Ω</option>
                      <option value="1000">kΩ</option>
                      <option value="1000000">MΩ</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label for="t555-cm" class="block text-sm font-medium text-foreground mb-1.5">C（6/7脚→地）</label>
                  <div class="flex gap-1.5">
                    <input
                      id="t555-cm"
                      v-model.number="cMono"
                      type="number"
                      min="0"
                      step="0.01"
                      class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="如 10"
                    >
                    <select
                      v-model="cMonoUnit"
                      aria-label="C 单位"
                      class="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="1e-12">pF</option>
                      <option value="1e-9">nF</option>
                      <option value="1e-6">µF</option>
                    </select>
                  </div>
                </div>
              </div>

              <div v-if="monoFwdResult" class="p-4 rounded-lg border border-primary/30 bg-primary/10">
                <div class="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">定时宽度 T = 1.1×R×C</p>
                    <p class="text-2xl font-bold text-primary">{{ fmtDur(monoFwdResult.period) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">对应重复频率（1/T）</p>
                    <p class="text-2xl font-bold text-foreground">{{ fmtFreq(1 / monoFwdResult.period) }}</p>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
                  示例口径：R = 10kΩ、C = 10µF → T = 1.1×10×10 ms = <span class="text-foreground font-medium">0.11 s</span>。
                  触发脉冲宽度必须明显小于 T（通常 &lt; T/4），否则输出脉宽会被触发信号"顶住"而失真；触发端不用时建议经 10kΩ 上拉到 VCC 防误触发。
                </p>
              </div>
              <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-muted-foreground">请检查参数：R、C 均须大于 0。推荐 R 取 1kΩ~1MΩ、C 取 500pF~10µF。</p>
              </div>
            </div>

            <div v-else class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="t555-trev" class="block text-sm font-medium text-foreground mb-1.5">目标定时宽度 T</label>
                  <div class="flex gap-1.5">
                    <input
                      id="t555-trev"
                      v-model.number="tTarget"
                      type="number"
                      min="0"
                      step="0.1"
                      class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="如 100"
                    >
                    <select
                      v-model="tTargetUnit"
                      aria-label="目标定时单位"
                      class="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="1e-6">µs</option>
                      <option value="1e-3">ms</option>
                      <option value="1">s</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label for="t555-cmr" class="block text-sm font-medium text-foreground mb-1.5">选定电容 C</label>
                  <div class="flex gap-1.5">
                    <input
                      id="t555-cmr"
                      v-model.number="cMonoRev"
                      type="number"
                      min="0"
                      step="0.01"
                      class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="如 1"
                    >
                    <select
                      v-model="cMonoRevUnit"
                      aria-label="C 单位"
                      class="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="1e-12">pF</option>
                      <option value="1e-9">nF</option>
                      <option value="1e-6">µF</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="p in T_PRESETS" :key="p.value"
                  @click="tTarget = p.value; tTargetUnit = String(p.unit)"
                  :class="Number(tTargetUnit) === p.unit && tTarget === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >{{ p.label }}</button>
              </div>

              <div v-if="monoRevResult && monoRevResult.ok" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-2">
                <div class="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">精确值 R = T/(1.1×C)</p>
                    <p class="text-xl font-bold text-muted-foreground">{{ fmtRes(monoRevResult.rExact) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">E12 标准电阻吸附</p>
                    <p class="text-2xl font-bold text-primary">{{ fmtRes(monoRevResult.rSnap) }}</p>
                  </div>
                </div>
                <div class="pt-2 border-t border-primary/20 text-sm">
                  <p class="text-muted-foreground">
                    回验实际定时：T = 1.1×R×C = <span class="font-semibold text-foreground">{{ fmtDur(monoRevResult.period) }}</span>
                    （目标 {{ fmtDur(tTargetAbs) }}，偏差 <span :class="devCls(monoRevResult.dev)">{{ devText(monoRevResult.dev) }}</span>）
                  </p>
                  <p v-if="Math.abs(monoRevResult.dev) <= 5" class="text-xs text-green-600 dark:text-green-400 mt-1">吸附偏差在 ±5% 内，可直接采用；要求更准可用电位器微调 R。</p>
                </div>
              </div>
              <div v-else-if="monoRevResult && monoRevResult.error === 'range'" class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-foreground">所需电阻超出常规区（1kΩ~1MΩ）</p>
                  <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                    精确值 R = {{ fmtRes(monoRevResult.rExact) }}。R 太小会灌入过大电流（且电解电容漏电流占比上升），R 太大则易受漏电与噪声干扰。
                    请换更小（要更长定时）/更大（要更短定时）的电容档位再求 R。
                  </p>
                </div>
              </div>
              <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-muted-foreground">请检查参数：目标 T &gt; 0，C &gt; 0。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- SVG 电路图（随参数重绘） -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CircuitBoard class="w-5 h-5 mr-2 text-primary" /> 接法电路图（随上方参数实时重绘）
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            元件旁标注为当前输入值（正向模式）或反算吸附结果（反向模式）。引脚编号为 DIP-8 顶视定义：
            1 GND · 2 TRIG · 3 OUT · 4 RST · 5 CTRL · 6 THR · 7 DIS · 8 VCC。
          </p>

          <!-- DIP-8 引脚图 -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-muted/40 border border-border rounded-lg p-4">
              <p class="text-sm font-medium text-foreground mb-2">DIP-8 顶视引脚图（NE555 / 7555 引脚兼容）</p>
              <svg viewBox="0 0 280 216" class="w-full max-w-xs mx-auto" role="img" aria-label="555 DIP-8 顶视引脚图">
                <rect x="76" y="26" width="128" height="160" rx="7" class="fill-muted stroke-border" stroke-width="1.6" />
                <path d="M 128 26 A 12 12 0 0 1 152 26" class="fill-card stroke-border" stroke-width="1.6" />
                <circle cx="90" cy="40" r="4" class="fill-current text-muted-foreground" />
                <text x="140" y="116" font-size="13" text-anchor="middle" font-family="monospace" font-weight="bold" class="fill-current text-foreground">NE555</text>
                <!-- 左侧 1-4 -->
                <template v-for="p in DIP8_LEFT" :key="p.n">
                  <rect x="44" :y="p.y" width="32" height="12" rx="2.5" class="fill-muted stroke-border" stroke-width="1.2" />
                  <text x="38" :y="p.y + 9.5" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">{{ p.n }}</text>
                  <text x="116" :y="p.y + 9.5" font-size="10" text-anchor="end" :class="pinNameCls(p.name)">{{ p.name }}</text>
                </template>
                <!-- 右侧 8-5 -->
                <template v-for="p in DIP8_RIGHT" :key="p.n">
                  <rect x="204" :y="p.y" width="32" height="12" rx="2.5" class="fill-muted stroke-border" stroke-width="1.2" />
                  <text x="242" :y="p.y + 9.5" font-size="10" class="fill-current text-muted-foreground">{{ p.n }}</text>
                  <text x="164" :y="p.y + 9.5" font-size="10" :class="pinNameCls(p.name)">{{ p.name }}</text>
                </template>
              </svg>
              <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
                红色为电源相关脚（8 VCC / 1 GND）。CMOS 版 7555/ICM7555/TLC555 引脚完全兼容，可直接代换。
              </p>
            </div>

            <!-- 无稳态接法 -->
            <div class="bg-muted/40 border border-border rounded-lg p-4">
              <p class="text-sm font-medium text-foreground mb-2">无稳态接法（模式：{{ svgModeText }}）</p>
              <svg viewBox="0 0 560 330" class="w-full" role="img" aria-label="555 无稳态接法电路图">
                <!-- 电源轨 -->
                <line x1="50" y1="28" x2="510" y2="28" class="stroke-border" stroke-width="2" />
                <text x="50" y="20" font-size="12" class="fill-current text-foreground">+VCC</text>
                <line x1="50" y1="300" x2="510" y2="300" class="stroke-border" stroke-width="2" />
                <text x="468" y="316" font-size="12" class="fill-current text-muted-foreground">GND</text>
                <line x1="58" y1="300" x2="42" y2="300" class="stroke-border" stroke-width="2" />
                <line x1="54" y1="305" x2="46" y2="305" class="stroke-border" stroke-width="2" />
                <line x1="50" y1="310" x2="50" y2="310" class="stroke-border" stroke-width="2" />

                <!-- R1 -->
                <line x1="90" y1="28" x2="90" y2="48" class="stroke-border" stroke-width="1.8" />
                <rect x="82" y="48" width="16" height="44" rx="2" class="fill-muted stroke-border" stroke-width="1.5" />
                <text x="106" y="66" font-size="12" class="fill-current text-foreground font-medium">R1</text>
                <text x="106" y="80" font-size="11" class="fill-current text-primary font-bold">{{ svgLabels.r1 }}</text>
                <line x1="90" y1="92" x2="90" y2="120" class="stroke-border" stroke-width="1.8" />

                <!-- R2 -->
                <rect x="82" y="132" width="16" height="44" rx="2" class="fill-muted stroke-border" stroke-width="1.5" />
                <line x1="90" y1="120" x2="90" y2="132" class="stroke-border" stroke-width="1.8" />
                <text x="106" y="150" font-size="12" class="fill-current text-foreground font-medium">R2</text>
                <text x="106" y="164" font-size="11" class="fill-current text-primary font-bold">{{ svgLabels.r2 }}</text>
                <line x1="90" y1="176" x2="90" y2="204" class="stroke-border" stroke-width="1.8" />

                <!-- C -->
                <line x1="90" y1="204" x2="90" y2="224" class="stroke-border" stroke-width="1.8" />
                <line x1="76" y1="224" x2="104" y2="224" class="stroke-border" stroke-width="2.4" />
                <line x1="76" y1="232" x2="104" y2="232" class="stroke-border" stroke-width="2.4" />
                <line x1="90" y1="232" x2="90" y2="300" class="stroke-border" stroke-width="1.8" />
                <text x="106" y="226" font-size="12" class="fill-current text-foreground font-medium">C</text>
                <text x="106" y="240" font-size="11" class="fill-current text-primary font-bold">{{ svgLabels.c }}</text>
                <text x="106" y="256" font-size="10" class="fill-current text-muted-foreground">（+ → 6脚）</text>

                <!-- 节点 A (7脚) 与节点 B (6/2脚) -->
                <circle cx="90" cy="120" r="3.5" class="fill-current text-foreground" />
                <circle cx="250" cy="204" r="3.5" class="fill-current text-foreground" />
                <circle cx="270" cy="28" r="3.5" class="fill-current text-foreground" />
                <circle cx="470" cy="28" r="3.5" class="fill-current text-foreground" />

                <!-- 节点 A → 7脚 -->
                <line x1="90" y1="120" x2="300" y2="120" class="stroke-border" stroke-width="1.8" />

                <!-- 节点 B → 6脚 / 2脚 -->
                <line x1="90" y1="204" x2="300" y2="204" class="stroke-border" stroke-width="1.8" />
                <line x1="250" y1="204" x2="250" y2="228" class="stroke-border" stroke-width="1.8" />
                <line x1="250" y1="228" x2="300" y2="228" class="stroke-border" stroke-width="1.8" />

                <!-- IC 本体 -->
                <rect x="300" y="92" width="130" height="180" rx="4" class="fill-card stroke-border" stroke-width="1.8" />
                <text x="365" y="186" font-size="14" text-anchor="middle" font-family="monospace" font-weight="bold" class="fill-current text-foreground">NE555</text>
                <text x="310" y="86" font-size="10" class="fill-current text-muted-foreground">（引脚按功能布置）</text>

                <!-- 左侧引脚 -->
                <line x1="300" y1="104" x2="270" y2="104" class="stroke-border" stroke-width="1.8" />
                <line x1="270" y1="104" x2="270" y2="28" class="stroke-border" stroke-width="1.8" />
                <text x="294" y="108" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">8</text>
                <text x="310" y="108" font-size="10" class="fill-current" :class="pinNameCls('VCC')">VCC</text>

                <line x1="300" y1="120" x2="292" y2="120" class="stroke-border" stroke-width="1.8" />
                <text x="294" y="124" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">7</text>
                <text x="310" y="124" font-size="10" class="fill-current" :class="pinNameCls('DIS')">DIS</text>

                <line x1="300" y1="204" x2="292" y2="204" class="stroke-border" stroke-width="1.8" />
                <text x="294" y="208" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">6</text>
                <text x="310" y="208" font-size="10" class="fill-current" :class="pinNameCls('THR')">THR</text>

                <line x1="300" y1="228" x2="292" y2="228" class="stroke-border" stroke-width="1.8" />
                <text x="294" y="232" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">2</text>
                <text x="310" y="232" font-size="10" class="fill-current" :class="pinNameCls('TRIG')">TRIG</text>

                <!-- 5脚 CTRL + 0.01µF -->
                <line x1="300" y1="252" x2="240" y2="252" class="stroke-border" stroke-width="1.8" />
                <line x1="240" y1="252" x2="240" y2="266" class="stroke-border" stroke-width="1.8" />
                <line x1="228" y1="266" x2="252" y2="266" class="stroke-border" stroke-width="2.2" />
                <line x1="228" y1="274" x2="252" y2="274" class="stroke-border" stroke-width="2.2" />
                <line x1="240" y1="274" x2="240" y2="300" class="stroke-border" stroke-width="1.8" />
                <text x="258" y="266" font-size="10" class="fill-current text-muted-foreground">0.01µF</text>
                <text x="294" y="256" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">5</text>
                <text x="310" y="256" font-size="10" class="fill-current" :class="pinNameCls('CTRL')">CTRL</text>

                <!-- 右侧引脚 -->
                <line x1="430" y1="104" x2="470" y2="104" class="stroke-border" stroke-width="1.8" />
                <line x1="470" y1="104" x2="470" y2="28" class="stroke-border" stroke-width="1.8" />
                <text x="436" y="108" font-size="10" class="fill-current text-muted-foreground">4</text>
                <text x="420" y="108" font-size="10" text-anchor="end" class="fill-current" :class="pinNameCls('RST')">RST</text>

                <line x1="430" y1="170" x2="494" y2="170" class="stroke-border" stroke-width="1.8" />
                <circle cx="500" cy="170" r="5" fill="none" class="stroke-border" stroke-width="1.8" />
                <text x="436" y="174" font-size="10" class="fill-current text-muted-foreground">3</text>
                <text x="420" y="174" font-size="10" text-anchor="end" class="fill-current" :class="pinNameCls('OUT')">OUT</text>
                <text x="500" y="158" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">输出</text>

                <line x1="430" y1="240" x2="460" y2="240" class="stroke-border" stroke-width="1.8" />
                <line x1="460" y1="240" x2="460" y2="300" class="stroke-border" stroke-width="1.8" />
                <text x="436" y="244" font-size="10" class="fill-current text-muted-foreground">1</text>
                <text x="420" y="244" font-size="10" text-anchor="end" class="fill-current" :class="pinNameCls('GND')">GND</text>
              </svg>
              <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
                充电经 R1+R2（7→6），放电经 R2（6→7）。2 脚 TRIG 与 6 脚 THR 相连实现自激振荡；4 脚 RST 上拉到 VCC 防误复位；
                5 脚 CTRL 经 0.01µF 旁路到地抗干扰（要求不高时可省略）。
              </p>
            </div>
          </div>

          <!-- 单稳态接法 -->
          <div class="bg-muted/40 border border-border rounded-lg p-4">
            <p class="text-sm font-medium text-foreground mb-2">单稳态接法（元件标注：{{ svgLabels.monoR }} / {{ svgLabels.monoC }}）</p>
            <svg viewBox="0 0 560 330" class="w-full max-w-3xl mx-auto" role="img" aria-label="555 单稳态接法电路图">
              <line x1="50" y1="28" x2="510" y2="28" class="stroke-border" stroke-width="2" />
              <text x="50" y="20" font-size="12" class="fill-current text-foreground">+VCC</text>
              <line x1="50" y1="300" x2="510" y2="300" class="stroke-border" stroke-width="2" />
              <text x="468" y="316" font-size="12" class="fill-current text-muted-foreground">GND</text>

              <!-- R -->
              <line x1="90" y1="28" x2="90" y2="48" class="stroke-border" stroke-width="1.8" />
              <rect x="82" y="48" width="16" height="44" rx="2" class="fill-muted stroke-border" stroke-width="1.5" />
              <text x="106" y="66" font-size="12" class="fill-current text-foreground font-medium">R</text>
              <text x="106" y="80" font-size="11" class="fill-current text-primary font-bold">{{ svgLabels.monoR }}</text>
              <line x1="90" y1="92" x2="90" y2="120" class="stroke-border" stroke-width="1.8" />
              <circle cx="90" cy="120" r="3.5" class="fill-current text-foreground" />

              <!-- 节点 → 7脚 与 6脚 -->
              <line x1="90" y1="120" x2="300" y2="120" class="stroke-border" stroke-width="1.8" />
              <line x1="250" y1="120" x2="250" y2="160" class="stroke-border" stroke-width="1.8" />
              <line x1="250" y1="160" x2="300" y2="160" class="stroke-border" stroke-width="1.8" />
              <circle cx="250" cy="120" r="3.5" class="fill-current text-foreground" />

              <!-- C -->
              <line x1="90" y1="120" x2="90" y2="224" class="stroke-border" stroke-width="1.8" />
              <line x1="76" y1="224" x2="104" y2="224" class="stroke-border" stroke-width="2.4" />
              <line x1="76" y1="232" x2="104" y2="232" class="stroke-border" stroke-width="2.4" />
              <line x1="90" y1="232" x2="90" y2="300" class="stroke-border" stroke-width="1.8" />
              <text x="106" y="226" font-size="12" class="fill-current text-foreground font-medium">C</text>
              <text x="106" y="240" font-size="11" class="fill-current text-primary font-bold">{{ svgLabels.monoC }}</text>

              <!-- IC 本体 -->
              <rect x="300" y="92" width="130" height="180" rx="4" class="fill-card stroke-border" stroke-width="1.8" />
              <text x="365" y="186" font-size="14" text-anchor="middle" font-family="monospace" font-weight="bold" class="fill-current text-foreground">NE555</text>

              <line x1="300" y1="104" x2="270" y2="104" class="stroke-border" stroke-width="1.8" />
              <line x1="270" y1="104" x2="270" y2="28" class="stroke-border" stroke-width="1.8" />
              <circle cx="270" cy="28" r="3.5" class="fill-current text-foreground" />
              <text x="294" y="108" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">8</text>
              <text x="310" y="108" font-size="10" class="fill-current" :class="pinNameCls('VCC')">VCC</text>

              <line x1="300" y1="120" x2="292" y2="120" class="stroke-border" stroke-width="1.8" />
              <text x="294" y="124" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">7</text>
              <text x="310" y="124" font-size="10" class="fill-current" :class="pinNameCls('DIS')">DIS</text>

              <line x1="300" y1="160" x2="292" y2="160" class="stroke-border" stroke-width="1.8" />
              <text x="294" y="164" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">6</text>
              <text x="310" y="164" font-size="10" class="fill-current" :class="pinNameCls('THR')">THR</text>

              <line x1="300" y1="252" x2="240" y2="252" class="stroke-border" stroke-width="1.8" />
              <line x1="240" y1="252" x2="240" y2="266" class="stroke-border" stroke-width="1.8" />
              <line x1="228" y1="266" x2="252" y2="266" class="stroke-border" stroke-width="2.2" />
              <line x1="228" y1="274" x2="252" y2="274" class="stroke-border" stroke-width="2.2" />
              <line x1="240" y1="274" x2="240" y2="300" class="stroke-border" stroke-width="1.8" />
              <text x="258" y="266" font-size="10" class="fill-current text-muted-foreground">0.01µF</text>
              <text x="294" y="256" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">5</text>
              <text x="310" y="256" font-size="10" class="fill-current" :class="pinNameCls('CTRL')">CTRL</text>

              <!-- 触发输入 2脚（下拉） -->
              <line x1="60" y1="228" x2="300" y2="228" class="stroke-border" stroke-width="1.8" />
              <path d="M 60 222 h 18 v 12 h 18" fill="none" class="stroke-border" stroke-width="1.6" />
              <text x="58" y="218" font-size="10" text-anchor="start" class="fill-current text-muted-foreground">触发脉冲</text>
              <text x="294" y="232" font-size="10" text-anchor="end" class="fill-current text-muted-foreground">2</text>
              <text x="310" y="232" font-size="10" class="fill-current" :class="pinNameCls('TRIG')">TRIG</text>

              <!-- 输出 3 / 复位 4 / 地 1 -->
              <line x1="430" y1="104" x2="470" y2="104" class="stroke-border" stroke-width="1.8" />
              <line x1="470" y1="104" x2="470" y2="28" class="stroke-border" stroke-width="1.8" />
              <circle cx="470" cy="28" r="3.5" class="fill-current text-foreground" />
              <text x="436" y="108" font-size="10" class="fill-current text-muted-foreground">4</text>
              <text x="420" y="108" font-size="10" text-anchor="end" class="fill-current" :class="pinNameCls('RST')">RST</text>

              <line x1="430" y1="170" x2="494" y2="170" class="stroke-border" stroke-width="1.8" />
              <circle cx="500" cy="170" r="5" fill="none" class="stroke-border" stroke-width="1.8" />
              <text x="436" y="174" font-size="10" class="fill-current text-muted-foreground">3</text>
              <text x="420" y="174" font-size="10" text-anchor="end" class="fill-current" :class="pinNameCls('OUT')">OUT</text>
              <text x="500" y="158" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">输出</text>

              <line x1="430" y1="204" x2="460" y2="204" class="stroke-border" stroke-width="1.8" />
              <line x1="460" y1="204" x2="460" y2="300" class="stroke-border" stroke-width="1.8" />
              <text x="436" y="208" font-size="10" class="fill-current text-muted-foreground">1</text>
              <text x="420" y="208" font-size="10" text-anchor="end" class="fill-current" :class="pinNameCls('GND')">GND</text>
            </svg>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
              R 上接 VCC、下接 6+7 脚与定时电容；2 脚 TRIG 需下拉脉冲触发（静止时上拉到 VCC），触发脉冲宽度必须 &lt; T（建议 &lt; T/4）；
              输出 3 脚输出宽度为 T = 1.1×R×C 的高电平脉冲。电容正极接 6 脚（电解电容时）。
            </p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 参数取值指引 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Sliders class="w-5 h-5 mr-2 text-primary" /> 参数取值指引
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">R 取 1kΩ~1MΩ：</span>下限保护放电端（7 脚灌电流），上限避免漏电流/噪声把定时"拖歪"。想要更长定时优先加大 C 而不是加大 R。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">C 取 500pF~10µF：</span>小于 500pF 时杂散电容与阈值电流误差占比过大；10µF 以上则充放电电流大、且电解电容漏电明显。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">电解电容慎用于定时：</span>漏电流随温度、老化和耐压裕量变化，会造成分钟级定时的显著漂移；长定时建议改用小电容 + 大电阻 + CMOS 版 7555，或直接用数字/RC+MCU 方案。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">7555 / ICM7555 / TLC555（CMOS）：</span>引脚完全兼容、静态电流 µA 级（双极型 NE555 约 3~10mA）、可在 2V 左右低压工作、允许更大的 R（漏电更小）；但输出驱动能力弱（约 ±10~100mA 视型号），直接驱动继电器/扬声器时不如双极型有力。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">PCB 与退耦：</span>VCC 就近放 0.1µF 退耦；输出端大电流负载与地回路的噪声会让阈值抖动，定时精度要求高时把 5 脚 0.01µF 一定焊上。</span>
            </li>
          </ul>
        </div>

        <!-- 常用组合速查 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Table class="w-5 h-5 mr-2 text-primary" /> 常用定时组合速查（单稳态 T = 1.1RC）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground border-b border-border">
                  <th class="text-left py-2 pr-2 font-medium">R</th>
                  <th class="text-left py-2 pr-2 font-medium">C</th>
                  <th class="text-left py-2 font-medium">T</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in MONO_QUICK" :key="row.r + '-' + row.c" class="border-b border-border/50 last:border-0">
                  <td class="py-2 pr-2 text-foreground whitespace-nowrap">{{ row.r }}</td>
                  <td class="py-2 pr-2 text-foreground whitespace-nowrap">{{ row.c }}</td>
                  <td class="py-2 text-primary font-medium whitespace-nowrap">{{ fmtDur(1.1 * row.rF * row.cF) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            表内数值由同一公式实时生成，与计算器口径一致。电容为电解时注意极性（正极接 6/7 脚侧）与漏电影响。
          </p>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 相关工具
          </h2>
          <ul class="space-y-2 text-sm">
            <li>
              <NuxtLink to="/tools/rc-time-constant" class="text-primary hover:underline">RC时间常数计算器</NuxtLink>
              <span class="text-muted-foreground text-xs"> — τ=RC 充放电曲线与延时口径，理解 0.693 从哪来</span>
            </li>
            <li>
              <NuxtLink to="/tools/logic-ic-truth-table" class="text-primary hover:underline">74/4000系列速查</NuxtLink>
              <span class="text-muted-foreground text-xs"> — 常用逻辑芯片引脚图与真值表，与 555 搭配搭建定时逻辑</span>
            </li>
            <li>
              <NuxtLink to="/tools/ic-marking-decoder" class="text-primary hover:underline">IC丝印解读器</NuxtLink>
              <span class="text-muted-foreground text-xs"> — 芯片丝印 date code 解读，验货排查翻新件</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页按 NE555 经典近似公式计算，实际器件的阈值电压偏差、输出饱和压降、电容容差与漏电流会带来额外误差，
        长定时与精密应用请以原厂 datasheet 参数并实测校准；供电超出器件范围会损坏器件。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>555 定时器原理与公式详解</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          555 定时器（NE555/SE555 及 CMOS 版 7555）内部由<span class="text-foreground font-medium">三个 5kΩ 电阻组成的分压器 + 两个电压比较器 + 一个 SR 触发器 + 放电三极管</span>构成。
          三个电阻把 VCC 分压出 2/3·VCC 与 1/3·VCC 两个基准：上比较器同相端接 6 脚 THR，阈值 2/3·VCC；
          下比较器反相端接 2 脚 TRIG，阈值 1/3·VCC。THR 电压超过 2/3·VCC 时触发器复位（输出低、放电管导通）；
          TRIG 电压低于 1/3·VCC 时触发器置位（输出高、放电管截止）。正是"充到 2/3 放、放到 1/3 充"的滞回，
          决定了充放电时间都按 ln2 ≈ 0.693 计算——这也是 RC 时间常数工具里 0.693 的出处。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">无稳态公式怎么来的</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          电容 C 从 1/3·VCC 充到 2/3·VCC 走的是 R1+R2（充电），从 2/3·VCC 放回 1/3·VCC 只走 R2（放电）。
          RC 充放电到 1/2 满幅差所需时间为 ln2·RC ≈ 0.693·RC，所以：
          t<sub>H</sub> = 0.693(R1+R2)C、t<sub>L</sub> = 0.693·R2·C、T = t<sub>H</sub>+t<sub>L</sub> = 0.693(R1+2R2)C，
          频率 f = 1/T ≈ 1.44/((R1+2R2)C)，占空比 D = (R1+R2)/(R1+2R2)。注意 1.44 = 1/1.443… 是 1/0.693 的取整，
          所以用 1.44 快算与按 t<sub>H</sub>/t<sub>L</sub> 精算会差约 0.2%——本页所有结果统一由 t<sub>H</sub>/t<sub>L</sub> 推出，内部自洽。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么标准接法的占空比不能低于 50%</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          因为充电必须经过 R1+R2 而放电只经过 R2，充电时间天然大于放电时间，D = (R1+R2)/(R1+2R2) 恒大于 50%。
          想要 D &lt; 50% 的标准做法是在 <span class="text-foreground font-medium">R2 两端并联二极管（阳极朝 7 脚、阴极朝 6 脚）</span>，
          让充电电流绕过 R2 只经 R1，此时 t<sub>H</sub> ≈ 0.693·R1·C、t<sub>L</sub> ≈ 0.693·R2·C，占空比就由 R1:R2 任意设定。
          更精细的做法是用一只电位器 + 两只导向二极管分别给充放电分配不同的电阻段，实现占空比独立可调。
          另外提醒：D 接近 100% 时 R2 会非常小，注意放电电流上限；D 接近 0% 时 R1 会非常小，注意充电电流上限。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">5 脚 CTRL 是干什么的</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          5 脚直接引出内部分压器的 2/3·VCC 节点。外部给 5 脚加电压即可同时改变两个比较器的阈值，从而调制频率或脉宽（压控振荡/调光）；
          不使用时按惯例接 0.01µF 到地——作用是旁路电源噪声，防止阈值抖动导致输出毛刺，要求不高的场合可以悬空，
          但继电器、电机等大电流负载共板时建议保留。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">单稳态的触发条件与脉宽要求</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          2 脚 TRIG 检测到低于 1/3·VCC 的下降沿时输出翻高、放电管截止，C 经 R 充电；充到 2/3·VCC 时输出翻低、放电管把 C 放空，等待下一次触发。
          由此有两条硬性要求：<span class="text-foreground font-medium">触发脉冲宽度必须小于 T</span>（否则输出被输入"顶住"，脉宽失真），
          且触发端静止电平必须高于 1/3·VCC（不用时经 10kΩ 上拉到 VCC，按键触发用微分电容耦合）。
          上电时电容从 0 充电会产生一个"假输出"，需要上电即定时的场合要在 2 脚加上电强制触发网络。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">555 vs 7555（CMOS）怎么选</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          双极型 NE555：驱动强（约 200mA 灌/拉，可直接驱动继电器、小喇叭），但静态电流 3~10mA、最低电压约 4.5V，
          且内部阈值电流较大，电阻上限受限。CMOS 版（ICM7555/7556、TLC555、LMC555）：引脚兼容、静态电流几十 µA、可工作在 2~3V、
          输入阻抗高允许 1MΩ 甚至更大的 R（长定时更友好）、开关尖峰小；代价是输出驱动弱（约 ±10~100mA 视型号），
          大电流负载需要加驱动管。电池供电与长定时优先 7555，直接驱动负载优先 NE555。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">555 的频率怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              无稳态：f ≈ 1.44/((R1+2×R2)×C)，其中 R1 是 VCC 到 7 脚的电阻、R2 是 7 脚到 6 脚的电阻、C 是 6 脚对地的定时电容（注意单位：Ω、F）。
              例：R1=1kΩ、R2=6.8kΩ、C=0.1µF → f ≈ 1.44/(14600×10⁻⁷) ≈ 986Hz（精确按 t<sub>H</sub>/t<sub>L</sub> 算约 988Hz），
              占空比 D = (R1+R2)/(R1+2R2) = 7800/14600 ≈ 53.4%。用本页输入数值即可自动算出并画出电路标注。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么调 555 的占空比？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              占空比只由 R1:R2 的比例决定（D = (R1+R2)/(R1+2R2)），所以改比例不改总量即可保持频率近似不变。
              50%~100% 之间直接调比例；低于 50% 必须在 R2 上并二极管（或用双二极管 + 电位器做独立充放电调节）。
              要"频率不变只调占空比"，可把 R1、R2 换成一只电位器加两只导向二极管的对角接法。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">电解电容能用作 555 定时吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              能用，但有代价：铝电解的漏电流大且随温度、老化、实际压降变化，充电电流小时（大电阻长定时）漏电会明显拖长定时甚至停振；
              容量误差通常 ±20%，定时精度差。秒级以内、精度要求不高（如闪光灯延时、玩具）可以用；
              分钟级或需要可重复精度的定时，建议改用小容量薄膜/陶瓷电容 + 大电阻 + CMOS 版 7555，或用 MCU/数字定时方案。
              使用时电解正极必须接 6/7 脚侧（充电方向）。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么我的 555 输出频率和计算差很多？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              常见原因按概率排：电容实际容值偏差（尤其电解 ±20% 甚至更大）＞ 1.44 近似公式本身的 0.2% 偏差 ＞
              电解漏电拖慢充电 ＞ 5 脚悬空受噪声干扰使阈值漂移 ＞ 负载拉低 VCC 造成电源纹波 ＞ 4 脚未上拉被干扰复位。
              排查顺序：先用数字表/万用表电容档核实 C，再焊上 5 脚 0.01µF 与 VCC 0.1µF 退耦，最后核对 4 脚上拉与 2 脚接法。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'timer-555-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  AlarmClock, Timer, CircuitBoard, Sliders, Table, Info, CheckCircle,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 555 计算纯函数区：node 单测直接复用本段，勿混入 Vue 响应式或浏览器 API

const K = 0.693          // ln2 手册近似值（与 NE555 datasheet 口径一致）
const R_MIN = 1000       // 合理电阻区下限（Ω）
const R_MAX = 1000000    // 合理电阻区上限（Ω）

// E12 电阻标准档基数（1.0~8.2）× 十进位 → 1kΩ~1MΩ 覆盖
const E12_BASE = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]

// 无稳态反向求解用标准电容档（µF）
const C_TRIALS = [0.001, 0.0022, 0.0047, 0.01, 0.022, 0.047, 0.1, 0.22, 0.47, 1, 2.2, 4.7, 10]

// E12 电阻吸附：返回 1kΩ~1MΩ 内最近的 E12 档值（Ω）
function snapE12R(r) {
  if (!Number.isFinite(r) || !(r > 0)) return null
  let best = null
  for (const exp of [3, 4, 5, 6]) {
    for (const m of E12_BASE) {
      const v = m * Math.pow(10, exp)
      if (v < R_MIN || v > R_MAX) continue
      if (best === null || Math.abs(v - r) < Math.abs(best - r)) best = v
    }
  }
  return best
}

// 无稳态正向：tH/tL/T/f/D，全部由 0.693 常数精确推得，f 与 T 严格互为倒数
function astableForward(r1, r2, c) {
  if (!Number.isFinite(r1) || !Number.isFinite(r2) || !Number.isFinite(c)) return null
  if (!(r1 > 0) || !(r2 > 0) || !(c > 0)) return null
  const tHigh = K * (r1 + r2) * c
  const tLow = K * r2 * c
  const period = tHigh + tLow
  return {
    tHigh,
    tLow,
    period,
    freq: 1 / period,
    duty: tHigh / period,
    sumR: r1 + 2 * r2
  }
}

// 单稳态正向：T = 1.1×R×C
function monostableForward(r, c) {
  if (!Number.isFinite(r) || !Number.isFinite(c)) return null
  if (!(r > 0) || !(c > 0)) return null
  return { period: 1.1 * r * c }
}

// 无稳态反向求解：目标 f(Hz) 与占空比 D(0~1)
// 对每个标准电容档解 S = T/(0.693C) → R2 = S(1−D)、R1 = S(2D−1)，
// 两电阻均落 1k~1M 才候选；吸附 E12 后回验 f/D 偏差，取综合偏差最小的一组
function solveAstableReverse(fTargetHz, dTarget) {
  if (!Number.isFinite(fTargetHz) || !(fTargetHz > 0)) return { error: 'invalid' }
  if (!Number.isFinite(dTarget) || !(dTarget > 0) || !(dTarget < 1)) return { error: 'invalid' }
  if (dTarget < 0.5) return { error: 'duty', dTarget }
  const cands = []
  for (const cUf of C_TRIALS) {
    const c = cUf * 1e-6
    const s = 1 / (K * c * fTargetHz) // s = R1 + 2R2（Ω）
    const r1 = s * (2 * dTarget - 1)
    const r2 = s * (1 - dTarget)
    if (!(r1 >= R_MIN) || !(r1 <= R_MAX) || !(r2 >= R_MIN) || !(r2 <= R_MAX)) continue
    const rs1 = snapE12R(r1)
    const rs2 = snapE12R(r2)
    if (!rs1 || !rs2) continue
    const fwd = astableForward(rs1, rs2, c)
    if (!fwd) continue
    const fDev = (fwd.freq - fTargetHz) / fTargetHz * 100
    const dDev = (fwd.duty - dTarget) / dTarget * 100
    cands.push({ ok: true, cUf, r1: rs1, r2: rs2, r1Exact: r1, r2Exact: r2, fwd, fDev, dDev, score: Math.max(Math.abs(fDev), Math.abs(dDev)) })
  }
  if (!cands.length) return { error: 'nosol' }
  cands.sort((a, b) => a.score - b.score)
  return cands[0]
}

// 单稳态反向求解：目标 T(s) 与电容 C(F) → R 精确值 + E12 吸附 + 回验
function solveMonostableReverse(tTargetS, cF) {
  if (!Number.isFinite(tTargetS) || !(tTargetS > 0) || !Number.isFinite(cF) || !(cF > 0)) return { error: 'invalid' }
  const rExact = tTargetS / (1.1 * cF)
  const inRange = rExact >= R_MIN && rExact <= R_MAX
  if (!inRange) return { error: 'range', rExact, inRange }
  const rSnap = snapE12R(rExact)
  if (!rSnap) return { error: 'nosol', rExact }
  const period = 1.1 * rSnap * cF
  return { ok: true, rExact, rSnap, period, dev: (period - tTargetS) / tTargetS * 100 }
}

// 频率自动单位显示（返回 { v, unit } 已格式化字符串）
function fmtFreqStr(hz) {
  if (!Number.isFinite(hz) || !(hz > 0)) return '—'
  if (hz >= 1e6) return trimNum(hz / 1e6) + ' MHz'
  if (hz >= 1e3) return trimNum(hz / 1e3) + ' kHz'
  return trimNum(hz) + ' Hz'
}

// 时长自动单位显示（s / ms / µs / ns）
function fmtDurStr(sec) {
  if (!Number.isFinite(sec) || !(sec > 0)) return '—'
  if (sec >= 1) return trimNum(sec) + ' s'
  if (sec >= 1e-3) return trimNum(sec * 1e3) + ' ms'
  if (sec >= 1e-6) return trimNum(sec * 1e6) + ' µs'
  return trimNum(sec * 1e9) + ' ns'
}

// 去尾零数字（避免浮点尾差上屏）
function trimNum(v, maxDigits = 4) {
  if (!Number.isFinite(v)) return '—'
  const s = v.toFixed(maxDigits)
  return String(parseFloat(s))
}

// 电阻显示：≥1MΩ 用 MΩ，≥1kΩ 用 kΩ，否则 Ω
function fmtResStr(r) {
  if (!Number.isFinite(r) || !(r > 0)) return '—'
  if (r >= 1e6) return trimNum(r / 1e6) + ' MΩ'
  if (r >= 1e3) return trimNum(r / 1e3) + ' kΩ'
  return trimNum(r) + ' Ω'
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '555定时器计算器 - 无稳态/单稳态频率占空比计算与电路图',
  description: '在线 NE555 计算器：无稳态 f=1.44/((R1+2R2)C) 与占空比正反算、目标频率占空比反解 R1/R2（E12 标准电阻吸附回验、占空比<50% 二极管旁路提示）、单稳态 T=1.1RC，DIP-8 引脚图与随参数重绘的 SVG 电路图，纯本地计算。',
  keywords: '555定时器计算,ne555频率计算,555占空比,555方波,单稳态电路,555电路图,7555,astable 555 calculator',
  author: '有条工具',
  ogTitle: '555定时器计算器 - 无稳态/单稳态频率占空比计算 | 有条工具',
  ogDescription: '无稳态/单稳态正反算、E12 电阻吸附回验、SVG 电路图随参数重绘。',
  ogUrl: 'https://www.util.cn/tools/timer-555-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '555定时器计算器',
  twitterDescription: 'NE555 频率、占空比与定时正反算，E12 吸附回验与电路图。'
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
          name: '555定时器计算器',
          url: 'https://www.util.cn/tools/timer-555-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '无稳态 f=1.44/((R1+2R2)C)、tH/tL/周期/占空比全套正算',
            '目标频率+占空比反向求解 R1/R2（13 档标准电容逐档尝试）',
            'E12 标准电阻吸附并回验频率/占空比偏差',
            '占空比 <50% 自动提示二极管旁路充电回路接法',
            '单稳态 T=1.1RC 正反算与 E12 吸附回验',
            'DIP-8 引脚图与随参数重绘的无稳态/单稳态 SVG 电路图',
            '7555/ICM7555 代换与电解电容漏电提示',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '555定时器计算器', item: 'https://www.util.cn/tools/timer-555-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '555 的频率怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '无稳态 f ≈ 1.44/((R1+2R2)×C)。例：R1=1kΩ、R2=6.8kΩ、C=0.1µF → 约 986Hz，占空比 = (R1+R2)/(R1+2R2) ≈ 53.4%。精确值按 tH=0.693(R1+R2)C、tL=0.693·R2·C 推得约 988Hz。' }
            },
            {
              '@type': 'Question',
              name: '怎么调 555 的占空比？',
              acceptedAnswer: { '@type': 'Answer', text: '占空比 D = (R1+R2)/(R1+2R2) 由 R1:R2 比例决定。50%~100% 直接调比例；低于 50% 需在 R2 两端并联二极管旁路充电回路（tH≈0.693·R1·C），或用双二极管加电位器独立调节充放电。' }
            },
            {
              '@type': 'Question',
              name: '电解电容能用作 555 定时吗？',
              acceptedAnswer: { '@type': 'Answer', text: '秒级低精度场合可用，但铝电解漏电流大且随温度老化变化、容差 ±20%，长定时会明显漂移；分钟级或高精度建议小容量薄膜/陶瓷电容 + 大电阻 + CMOS 版 7555。电解正极接 6/7 脚侧。' }
            },
            {
              '@type': 'Question',
              name: '为什么 555 输出频率和计算差很多？',
              acceptedAnswer: { '@type': 'Answer', text: '主因是电容实际容值偏差（电解可达 ±20%），其后依次为漏电、5 脚悬空噪声、电源纹波、4 脚未上拉。先核实电容容值，再焊 5 脚 0.01µF 与 VCC 0.1µF 退耦，最后核对 4 脚上拉。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'timer-555-calculator'
const SETTINGS_KEY = 'timer-555-calculator-settings'

onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量与静态数据 ----------
const R_UNITS = { '1': 1, '1000': 1e3, '1000000': 1e6 }
const C_UNITS = { '1e-12': 1e-12, '1e-9': 1e-9, '1e-6': 1e-6 }
const FREQ_PRESETS = [
  { label: '1 Hz', value: 1, unit: 1 },
  { label: '1 kHz', value: 1, unit: 1000 },
  { label: '10 kHz', value: 10, unit: 1000 },
  { label: '100 kHz', value: 100, unit: 1000 },
  { label: '1 MHz', value: 1, unit: 1000000 }
]
const T_PRESETS = [
  { label: '100 µs', value: 100, unit: 1e-6 },
  { label: '1 ms', value: 1, unit: 1e-3 },
  { label: '10 ms', value: 10, unit: 1e-3 },
  { label: '1 s', value: 1, unit: 1 },
  { label: '10 s', value: 10, unit: 1 }
]
const MONO_QUICK = [
  { r: '1 kΩ', rF: 1000, c: '1 µF', cF: 1e-6 },
  { r: '10 kΩ', rF: 1e4, c: '10 µF', cF: 1e-5 },
  { r: '100 kΩ', rF: 1e5, c: '10 µF', cF: 1e-5 },
  { r: '1 MΩ', rF: 1e6, c: '10 µF', cF: 1e-5 },
  { r: '470 kΩ', rF: 4.7e5, c: '1 µF', cF: 1e-6 },
  { r: '1 MΩ', rF: 1e6, c: '1 µF', cF: 1e-6 }
]

const DIP8_LEFT = [
  { n: 1, y: 52, name: 'GND' },
  { n: 2, y: 88, name: 'TRIG' },
  { n: 3, y: 124, name: 'OUT' },
  { n: 4, y: 160, name: 'RST' }
]
const DIP8_RIGHT = [
  { n: 8, y: 52, name: 'VCC' },
  { n: 7, y: 88, name: 'DIS' },
  { n: 6, y: 124, name: 'THR' },
  { n: 5, y: 160, name: 'CTRL' }
]

// ---------- 状态 ----------
const mode = ref('astable')        // 'astable' | 'mono'
const astSub = ref('fwd')          // 'fwd' | 'rev'
const monoSub = ref('fwd')

// 无稳态正向
const r1Fwd = ref(1)
const r1FwdUnit = ref('1000')
const r2Fwd = ref(6.8)
const r2FwdUnit = ref('1000')
const cFwd = ref(0.1)
const cFwdUnit = ref('1e-6')

// 无稳态反向
const fTarget = ref(1)
const fTargetUnit = ref('1000')
const dTargetPct = ref(60)

// 单稳态
const rMono = ref(10)
const rMonoUnit = ref('1000')
const cMono = ref(10)
const cMonoUnit = ref('1e-6')
const tTarget = ref(100)
const tTargetUnit = ref('1e-3')
const cMonoRev = ref(1)
const cMonoRevUnit = ref('1e-6')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 换算辅助 ----------
const toOhms = (v, u) => (Number.isFinite(v) && v > 0 ? v * (R_UNITS[u] || 1) : null)
const toFarads = (v, u) => (Number.isFinite(v) && v > 0 ? v * (C_UNITS[u] || 1) : null)
const fTargetAbs = computed(() => (Number.isFinite(fTarget.value) && fTarget.value > 0 ? fTarget.value * (Number(fTargetUnit.value) || 1) : null))
const tTargetAbs = computed(() => (Number.isFinite(tTarget.value) && tTarget.value > 0 ? tTarget.value * (Number(tTargetUnit.value) || 1) : null))

const r1FwdAbs = computed(() => toOhms(r1Fwd.value, r1FwdUnit.value) || 0)
const r2FwdAbs = computed(() => toOhms(r2Fwd.value, r2FwdUnit.value) || 0)
const cFwdAbs = computed(() => toFarads(cFwd.value, cFwdUnit.value) || 0)

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')
const fmtFreq = (hz) => fmtFreqStr(hz)
const fmtDur = (sec) => fmtDurStr(sec)
const fmtRes = (r) => fmtResStr(r)
const devText = (devPct) => (Number.isFinite(devPct) ? (devPct >= 0 ? '+' : '') + devPct.toFixed(1) + '%' : '—')
const devCls = (devPct) => {
  if (!Number.isFinite(devPct)) return ''
  return Math.abs(devPct) <= 5
    ? 'text-green-600 dark:text-green-400'
    : 'text-amber-600 dark:text-amber-400'
}
const pinNameCls = (name) => (name === 'VCC' || name === 'GND' ? 'text-red-500 dark:text-red-400 font-medium' : 'text-foreground')

// ---------- 主计算 ----------
const astFwdResult = computed(() => astableForward(r1FwdAbs.value, r2FwdAbs.value, cFwdAbs.value))

const astRevResult = computed(() => {
  const f = fTargetAbs.value
  const d = Number(dTargetPct.value)
  if (f === null || !Number.isFinite(d)) return { error: 'invalid' }
  return solveAstableReverse(f, d / 100)
})

const monoFwdResult = computed(() => {
  const r = toOhms(rMono.value, rMonoUnit.value)
  const c = toFarads(cMono.value, cMonoUnit.value)
  if (r === null || c === null) return null
  return monostableForward(r, c)
})

const monoRevResult = computed(() => {
  const t = tTargetAbs.value
  const c = toFarads(cMonoRev.value, cMonoRevUnit.value)
  if (t === null || c === null) return { error: 'invalid' }
  return solveMonostableReverse(t, c)
})

// ---------- SVG 随参数重绘的标注 ----------
const svgModeText = computed(() => (astSub.value === 'rev' ? '反向求解结果' : '正向输入值'))

const svgLabels = computed(() => {
  const rev = astSub.value === 'rev' && astRevResult.value && astRevResult.value.ok
    ? astRevResult.value
    : null
  if (rev) {
    return {
      r1: fmtRes(rev.r1),
      r2: fmtRes(rev.r2),
      c: fmt(rev.cUf, 4) + ' µF',
      monoR: fmtRes(rMono.value !== null ? toOhms(rMono.value, rMonoUnit.value) : null),
      monoC: fmt(cMono.value, 2) + unitCn(cMonoUnit.value)
    }
  }
  return {
    r1: fmtRes(r1FwdAbs.value),
    r2: fmtRes(r2FwdAbs.value),
    c: fmt(cFwd.value, 2) + unitCn(cFwdUnit.value),
    monoR: fmtRes(toOhms(rMono.value, rMonoUnit.value)),
    monoC: fmt(cMono.value, 2) + unitCn(cMonoUnit.value)
  }
})

function unitCn(u) {
  if (u === '1e-12') return ' pF'
  if (u === '1e-9') return ' nF'
  return ' µF'
}

// 占空比波形条几何（两个周期）
const WAVE_W = 360
const waveHiPct = computed(() => {
  const r = astFwdResult.value
  return r ? r.duty * 100 : 50
})
const wavePhases = computed(() => {
  const hi = Math.min(Math.max(waveHiPct.value, 2), 98)
  const lo = 100 - hi
  const phases = []
  const half = WAVE_W / 2
  let x = 0
  for (let i = 0; i < 2; i++) {
    const wh = half * hi / 100
    const wl = half * lo / 100
    phases.push({ key: 'h' + i, x, w: wh, high: true })
    x += wh
    phases.push({ key: 'l' + i, x, w: wl, high: false })
    x += wl
  }
  return phases
})

// ---------- 设置持久化（localStorage 仅在客户端访问，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.mode === 'astable' || s.mode === 'mono') mode.value = s.mode
    if (s.astSub === 'fwd' || s.astSub === 'rev') astSub.value = s.astSub
    if (s.monoSub === 'fwd' || s.monoSub === 'rev') monoSub.value = s.monoSub
    if (Number.isFinite(s.r1Fwd) && s.r1Fwd > 0) r1Fwd.value = s.r1Fwd
    if (String(s.r1FwdUnit) in R_UNITS) r1FwdUnit.value = String(s.r1FwdUnit)
    if (Number.isFinite(s.r2Fwd) && s.r2Fwd > 0) r2Fwd.value = s.r2Fwd
    if (String(s.r2FwdUnit) in R_UNITS) r2FwdUnit.value = String(s.r2FwdUnit)
    if (Number.isFinite(s.cFwd) && s.cFwd > 0) cFwd.value = s.cFwd
    if (String(s.cFwdUnit) in C_UNITS) cFwdUnit.value = String(s.cFwdUnit)
    if (Number.isFinite(s.fTarget) && s.fTarget > 0) fTarget.value = s.fTarget
    if (Number.isFinite(Number(s.fTargetUnit))) fTargetUnit.value = String(s.fTargetUnit)
    if (Number.isFinite(s.dTargetPct) && s.dTargetPct > 0 && s.dTargetPct < 100) dTargetPct.value = s.dTargetPct
    if (Number.isFinite(s.rMono) && s.rMono > 0) rMono.value = s.rMono
    if (String(s.rMonoUnit) in R_UNITS) rMonoUnit.value = String(s.rMonoUnit)
    if (Number.isFinite(s.cMono) && s.cMono > 0) cMono.value = s.cMono
    if (String(s.cMonoUnit) in C_UNITS) cMonoUnit.value = String(s.cMonoUnit)
    if (Number.isFinite(s.tTarget) && s.tTarget > 0) tTarget.value = s.tTarget
    if (Number.isFinite(Number(s.tTargetUnit))) tTargetUnit.value = String(s.tTargetUnit)
    if (Number.isFinite(s.cMonoRev) && s.cMonoRev > 0) cMonoRev.value = s.cMonoRev
    if (String(s.cMonoRevUnit) in C_UNITS) cMonoRevUnit.value = String(s.cMonoRevUnit)
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, astSub, monoSub, r1Fwd, r1FwdUnit, r2Fwd, r2FwdUnit, cFwd, cFwdUnit,
  fTarget, fTargetUnit, dTargetPct, rMono, rMonoUnit, cMono, cMonoUnit,
  tTarget, tTargetUnit, cMonoRev, cMonoRevUnit], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      astSub: astSub.value,
      monoSub: monoSub.value,
      r1Fwd: r1Fwd.value,
      r1FwdUnit: r1FwdUnit.value,
      r2Fwd: r2Fwd.value,
      r2FwdUnit: r2FwdUnit.value,
      cFwd: cFwd.value,
      cFwdUnit: cFwdUnit.value,
      fTarget: fTarget.value,
      fTargetUnit: fTargetUnit.value,
      dTargetPct: dTargetPct.value,
      rMono: rMono.value,
      rMonoUnit: rMonoUnit.value,
      cMono: cMono.value,
      cMonoUnit: cMonoUnit.value,
      tTarget: tTarget.value,
      tTargetUnit: tTargetUnit.value,
      cMonoRev: cMonoRev.value,
      cMonoRevUnit: cMonoRevUnit.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
