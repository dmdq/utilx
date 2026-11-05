<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Timer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">RC时间常数计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">τ=RC 正反算、充放电指数曲线与时间游标、阈值延时换算与标准档吸附回验</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 RC 时间常数计算器：τ = RC 正算与反向求解（给 τ 和 C 求 R / 给 τ 和 R 求 C），标准阻值容值吸附回验；
        充电 V(t) = Vs(1−e^(−t/τ)) 与放电 V(t) = Vs·e^(−t/τ) 双曲线 SVG 可视化，横轴 0~5τ 标注 1τ=63.2%、2τ=86.5%、
        3τ=95.0%、5τ=99.3% 锚点，时间游标拖动或输入任意 t 查看瞬时百分比与实际伏值；阈值延时 t = −τ·ln(1−Vth/Vs)
        正反算并吸附标准档；附上电复位、按键消抖、PWM 滤波等应用注记。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        计算口径：一阶 RC 电路（V=IR 与 i=C·dV/dt 代入 KVL）的指数解，τ = RC 为唯一时间尺度；
        曲线横轴以 τ 归一化，与 τ 的绝对大小无关。电源电压 Vs 仅用于把百分比换算成实际伏值；
        阈值延时公式 t = −τ·ln(1−Vth/Vs) 适用于充电过程（0 &lt; Vth &lt; Vs）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 模块①：τ 正反算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 时间常数计算（τ = RC）
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">计算方向</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="m in MODES"
                :key="m.k"
                @click="mode = m.k"
                :class="mode === m.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >{{ m.label }}</button>
            </div>
          </div>

          <!-- 正算输入 -->
          <div v-if="mode === 'fwd'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="rc-r" class="block text-sm font-medium text-foreground mb-1.5">电阻 R</label>
              <div class="flex gap-1.5">
                <input id="rc-r" v-model.number="rVal" type="number" min="0" step="1"
                  class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <select v-model="rUnit" aria-label="电阻单位"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option v-for="u in R_UNITS" :key="u.k" :value="u.k">{{ u.k }}</option>
                </select>
              </div>
            </div>
            <div>
              <label for="rc-c" class="block text-sm font-medium text-foreground mb-1.5">电容 C</label>
              <div class="flex gap-1.5">
                <input id="rc-c" v-model.number="cVal" type="number" min="0" step="1"
                  class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <select v-model="cUnit" aria-label="电容单位"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option v-for="u in C_UNITS" :key="u.k" :value="u.k">{{ u.k }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 反算 R 输入 -->
          <div v-else-if="mode === 'revR'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="rc-tau-r" class="block text-sm font-medium text-foreground mb-1.5">目标时间常数 τ</label>
              <div class="flex gap-1.5">
                <input id="rc-tau-r" v-model.number="tauVal" type="number" min="0" step="0.1"
                  class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <select v-model="tauUnit" aria-label="时间单位"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option v-for="u in T_UNITS" :key="u.k" :value="u.k">{{ u.k }}</option>
                </select>
              </div>
            </div>
            <div>
              <label for="rc-c-rev" class="block text-sm font-medium text-foreground mb-1.5">电容 C</label>
              <div class="flex gap-1.5">
                <input id="rc-c-rev" v-model.number="cVal" type="number" min="0" step="1"
                  class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <select v-model="cUnit" aria-label="电容单位"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option v-for="u in C_UNITS" :key="u.k" :value="u.k">{{ u.k }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 反算 C 输入 -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="rc-tau-c" class="block text-sm font-medium text-foreground mb-1.5">目标时间常数 τ</label>
              <div class="flex gap-1.5">
                <input id="rc-tau-c" v-model.number="tauVal" type="number" min="0" step="0.1"
                  class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <select v-model="tauUnit" aria-label="时间单位"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option v-for="u in T_UNITS" :key="u.k" :value="u.k">{{ u.k }}</option>
                </select>
              </div>
            </div>
            <div>
              <label for="rc-r-rev" class="block text-sm font-medium text-foreground mb-1.5">电阻 R</label>
              <div class="flex gap-1.5">
                <input id="rc-r-rev" v-model.number="rVal" type="number" min="0" step="1"
                  class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <select v-model="rUnit" aria-label="电阻单位"
                  class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option v-for="u in R_UNITS" :key="u.k" :value="u.k">{{ u.k }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 正算结果 -->
          <div v-if="mode === 'fwd' && tauSec !== null" class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">时间常数 τ = R × C</p>
                <p class="text-2xl font-bold text-primary">{{ tauText }}</p>
                <p class="text-xs text-muted-foreground mt-1">= {{ fmtNum(tauSec, 6) }} s</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">截止频率 fc = 1/(2πRC)</p>
                <p class="text-2xl font-bold text-foreground">{{ fcText }}</p>
                <p class="text-xs text-muted-foreground mt-1">一阶低通口径：τ = 1/(2π·fc)</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3 pt-3 border-t border-primary/20">
              5τ ≈ {{ fiveTauText }}（工程上视为充满/放完）；充电到 50% 需 0.693τ、到 90% 需 2.303τ。
            </p>
          </div>

          <!-- 反算 R 结果 -->
          <div v-else-if="mode === 'revR' && revRResult" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">R = τ / C（精确值）</p>
                <p class="text-2xl font-bold text-primary">{{ fmtR(revRResult.rExact) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">E24 标准阻值吸附</p>
                <p class="text-2xl font-bold text-foreground">{{ fmtR(revRResult.snap) }}</p>
              </div>
            </div>
            <p class="text-sm text-muted-foreground pt-2 border-t border-primary/20">
              回验：τ_real = {{ fmtR(revRResult.snap) }} × {{ fmtFarad(revRResult.c) }} =
              <span class="font-semibold text-foreground">{{ fmtTimeSmart(revRResult.tauReal).text }}</span>
              （目标 {{ tauText }}，偏差 <span :class="revRResult.devCls">{{ revRResult.devText }}</span>）
            </p>
          </div>

          <!-- 反算 C 结果 -->
          <div v-else-if="mode === 'revC' && revCResult" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">C = τ / R（精确值）</p>
                <p class="text-2xl font-bold text-primary">{{ fmtFarad(revCResult.cExact) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">E12 标准容值吸附</p>
                <p class="text-2xl font-bold text-foreground">{{ fmtFarad(revCResult.snap) }}</p>
              </div>
            </div>
            <p class="text-sm text-muted-foreground pt-2 border-t border-primary/20">
              回验：τ_real = {{ fmtR(revCResult.r) }} × {{ fmtFarad(revCResult.snap) }} =
              <span class="font-semibold text-foreground">{{ fmtTimeSmart(revCResult.tauReal).text }}</span>
              （目标 {{ tauText }}，偏差 <span :class="revCResult.devCls">{{ revCResult.devText }}</span>）
            </p>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">
                请检查参数：R 在 0.1 Ω ~ 100 MΩ、C 在 0.1 pF ~ 100000 µF、τ 在 1 ns ~ 10 Ms 且均大于 0。
              </p>
            </div>
          </div>
        </div>

        <!-- 模块②：充放电曲线 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Activity class="w-5 h-5 mr-2 text-primary" /> 充放电曲线（0 ~ 5τ，带时间游标）
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">曲线模式</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="curveMode = 'charge'"
                  :class="curveMode === 'charge' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >充电 V = Vs(1−e^(−t/τ))</button>
                <button
                  @click="curveMode = 'discharge'"
                  :class="curveMode === 'discharge' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >放电 V = Vs·e^(−t/τ)</button>
              </div>
            </div>
            <div>
              <label for="rc-vs" class="block text-sm font-medium text-foreground mb-1.5">电源电压 Vs（V，仅用于伏值换算）</label>
              <input id="rc-vs" v-model.number="vs" type="number" min="0" step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
          </div>

          <template v-if="tauSec !== null">
            <div class="text-muted-foreground">
              <svg viewBox="0 0 560 320" class="w-full" role="img" aria-label="RC 充放电指数曲线图">
                <!-- 网格 -->
                <g stroke="currentColor" stroke-width="1" opacity="0.22">
                  <line v-for="g in yGrid" :key="'yg' + g.p" :x1="CH_X0" :y1="g.y" :x2="CH_X0 + CH_W" :y2="g.y" />
                  <line v-for="g in xGrid" :key="'xg' + g.f" :x1="g.x" :y1="CH_Y0" :x2="g.x" :y2="CH_Y1" />
                </g>
                <!-- 坐标轴 -->
                <g class="text-foreground" stroke="currentColor" stroke-width="1.5">
                  <line :x1="CH_X0" :y1="CH_Y1" :x2="CH_X0 + CH_W" :y2="CH_Y1" />
                  <line :x1="CH_X0" :y1="CH_Y0" :x2="CH_X0" :y2="CH_Y1" />
                </g>
                <!-- τ 锚点线 -->
                <g stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" opacity="0.7">
                  <line v-for="a in anchors" :key="'a' + a.f" :x1="xOf(a.f)" :y1="CH_Y0" :x2="xOf(a.f)" :y2="CH_Y1" />
                </g>
                <!-- 曲线 -->
                <path :d="curvePath" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="text-primary" />
                <!-- 时间游标 -->
                <g class="text-amber-500">
                  <line :x1="cursorX" :y1="CH_Y0" :x2="cursorX" :y2="CH_Y1" stroke="currentColor" stroke-width="1.5" />
                  <circle :cx="cursorX" :cy="cursorY" r="4.5" fill="currentColor" />
                  <text :x="cursorLabelX" :y="cursorLabelY" :text-anchor="cursorAnchor" font-size="12" font-weight="600" fill="currentColor">
                    {{ cursorPctText }}
                  </text>
                  <text :x="cursorLabelX" :y="cursorLabelY + 16" :text-anchor="cursorAnchor" font-size="11" fill="currentColor">
                    {{ cursorVoltText }}
                  </text>
                </g>
                <!-- 刻度与标注 -->
                <g fill="currentColor" font-size="11">
                  <text v-for="g in yGrid" :key="'yl' + g.p" :x="CH_X0 - 6" :y="g.y + 4" text-anchor="end">{{ g.p }}%</text>
                  <text v-for="g in xGrid" :key="'xl' + g.f" :x="g.x" :y="CH_Y1 + 18" text-anchor="middle">{{ g.label }}</text>
                  <text v-for="a in anchors" :key="'al' + a.f" :x="xOf(a.f)" :y="CH_Y0 - 8" text-anchor="middle">{{ a.label }} {{ a.pctText }}%</text>
                  <text :x="CH_X0 + CH_W" :y="CH_Y1 + 32" text-anchor="end">t（×τ）</text>
                  <text :x="CH_X0" :y="CH_Y0 - 24" text-anchor="start">V / Vs</text>
                </g>
              </svg>
            </div>

            <!-- 时间游标控制 -->
            <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label for="rc-cursor" class="block text-sm font-medium text-foreground mb-1.5">
                  时间游标 t：<span class="text-primary">{{ fmtNum(cursorTau, 2) }} τ</span>
                </label>
                <input id="rc-cursor" v-model.number="cursorTau" type="range" min="0" max="5" step="0.01"
                  class="w-full border border-border rounded-lg accent-primary">
              </div>
              <div class="w-28">
                <label for="rc-cursorn" class="block text-sm font-medium text-foreground mb-1.5">t（×τ）</label>
                <input id="rc-cursorn" v-model.number="cursorTau" type="number" min="0" max="5" step="0.01"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <p class="text-xs text-muted-foreground mb-1">时间 t</p>
                <p class="font-bold text-foreground">{{ cursor.tText }}</p>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <p class="text-xs text-muted-foreground mb-1">瞬时 V(t)/Vs</p>
                <p class="font-bold text-primary">{{ cursorPctText }}</p>
              </div>
              <div class="bg-muted/50 border border-border rounded-lg p-3">
                <p class="text-xs text-muted-foreground mb-1">实际电压（Vs = {{ fmtNum(vs, 3) }} V）</p>
                <p class="font-bold text-foreground">{{ cursorVoltText }}</p>
              </div>
            </div>

            <p class="text-xs leading-relaxed text-muted-foreground">
              锚点口径：{{ curveMode === 'charge' ? '充电' : '放电' }}曲线在 1τ = {{ anchors[0].pctText }}%、2τ = {{ anchors[1].pctText }}%、
              3τ = {{ anchors[2].pctText }}%、5τ = {{ anchors[3].pctText }}%（精确值由 e^(−t/τ) 计算，标注保留 1 位小数）。
              横轴 0 ~ 5τ，5τ = {{ fiveTauText }}；曲线形状与 τ、Vs 无关，仅横轴刻度与伏值随之换算。
            </p>
          </template>
          <div v-else class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            请先在上方完成 τ 计算，曲线与游标将按当前 τ 换算实际时间与伏值
          </div>
        </div>

        <!-- 模块③：阈值延时 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 延时应用（阈值判断点）
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label for="rc-vth" class="block text-sm font-medium text-foreground mb-1.5">阈值电压 Vth（V）</label>
              <input id="rc-vth" v-model.number="vth" type="number" min="0" step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <p class="text-xs text-muted-foreground mt-1">默认 0.6Vs ≈ 逻辑高电平判断点</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">当前 τ（上方模块）</label>
              <div class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm font-mono text-foreground">
                {{ tauText }}
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">阈值比例 Vth/Vs</label>
              <div class="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm font-mono text-foreground">
                {{ vthRatioText }}
              </div>
            </div>
          </div>

          <div v-if="delayResult" class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <p class="text-xs text-muted-foreground mb-1">到达阈值时间 t = −τ·ln(1 − Vth/Vs)</p>
            <p class="text-2xl font-bold text-primary">
              {{ delayResult.tText }}
              <span class="text-sm font-medium text-muted-foreground">（{{ delayResult.ratioText }}）</span>
            </p>
            <p class="text-xs text-muted-foreground mt-2">
              锚点：Vth = 0.5Vs → t = 0.693τ；Vth = 0.9Vs → t = 2.303τ；Vth 越接近 Vs 所需时间越长（指数尾部渐近）。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请检查参数：须有有效 τ，且 0 &lt; Vth &lt; Vs（充电过程阈值必须在电源范围内）。</p>
          </div>

          <!-- 反向：给 t 求所需 RC -->
          <div class="pt-4 border-t border-border space-y-3">
            <h3 class="text-sm font-semibold text-foreground">反向：给定延时 t，求所需 RC 组合（吸附标准档）</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="rc-revt" class="block text-sm font-medium text-foreground mb-1.5">目标延时 t</label>
                <div class="flex gap-1.5">
                  <input id="rc-revt" v-model.number="revTVal" type="number" min="0" step="1"
                    class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <select v-model="revTUnit" aria-label="延时单位"
                    class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option v-for="u in T_UNITS" :key="u.k" :value="u.k">{{ u.k }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label for="rc-revc" class="block text-sm font-medium text-foreground mb-1.5">固定电容 C</label>
                <div class="flex gap-1.5">
                  <input id="rc-revc" v-model.number="delayCVal" type="number" min="0" step="1"
                    class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <select v-model="delayCUnit" aria-label="电容单位"
                    class="w-20 px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option v-for="u in C_UNITS" :key="u.k" :value="u.k">{{ u.k }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="delayRevResult" class="p-4 rounded-lg border border-border bg-muted/50 space-y-2">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div>
                  <p class="text-xs text-muted-foreground mb-1">所需 τ = t / ln系数（k = {{ delayRevResult.k }}）</p>
                  <p class="font-bold text-foreground">{{ fmtTimeSmart(delayRevResult.tauReq).text }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">R 精确值（τ/C）</p>
                  <p class="font-bold text-foreground">{{ fmtR(delayRevResult.rExact) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">E24 吸附推荐</p>
                  <p class="font-bold text-primary">{{ fmtR(delayRevResult.snap) }}</p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground pt-2 border-t border-border/50">
                回验：t_real = {{ fmtR(delayRevResult.snap) }} × {{ fmtFarad(delayRevResult.c) }} × ln 系数 =
                <span class="font-semibold text-foreground">{{ fmtTimeSmart(delayRevResult.tReal).text }}</span>
                （目标 {{ delayRevTargetText }}，偏差 <span :class="delayRevResult.devCls">{{ delayRevResult.devText }}</span>）
              </p>
            </div>
            <div v-else class="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
              输入目标延时与手头电容，按当前阈值比例（{{ vthRatioText }}）反算 τ 并吸附 E24 标准阻值回验实际延时。
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <Lightbulb class="w-4 h-4 mr-2 text-primary" /> 应用场景速览
          </h3>
          <div class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <div class="bg-muted/50 border border-border rounded-lg p-3">
              <p class="text-foreground font-medium mb-1">上电复位</p>
              RC 延时让 MCU 复位脚在电源稳定后再释放：如 10 kΩ + 1 µF → τ = 10 ms，0.693τ ≈ 6.9 ms 到 50% 阈值；
              常并联二极管实现断电快速放电，复位脚带施密特触发器可消除中间电平抖动。
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3">
              <p class="text-foreground font-medium mb-1">按键消抖</p>
              机械触点抖动典型 1~20 ms，RC 滤波常数取 <span class="text-foreground font-medium">10~100 ms 区间</span>
              （如 10 kΩ + 4.7 µF → τ = 47 ms）可有效吸收；τ 过大则响应迟钝，过小消抖不彻底。
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3">
              <p class="text-foreground font-medium mb-1">PWM → 直流滤波</p>
              一阶低通截止频率 <span class="font-mono">fc = 1/(2πRC)</span>，要把 PWM 载波滤成直流量，取 fc 远低于载波频率：
              例 R = 10 kΩ、C = 100 nF → τ = 1 ms、fc ≈ 159.2 Hz，可平滑 1 kHz 以上的 PWM。
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-3">
              <p class="text-foreground font-medium mb-1">闪烁 LED 周期估算</p>
              无源 RC 闪烁 LED（内置 IC 的闪灯）的闪烁周期由外接 RC 设定，量级约为 τ 的若干倍（随芯片阈值不同而异，
              以器件手册为准）；需要精确可调周期与占空比时改用 555 定时器方案。
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 口径与自检锚点
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• R = 10 kΩ、C = 100 nF → τ = 1.000 ms；fc = 1/(2πRC) = 159.2 Hz</li>
            <li>• 充电锚点：1τ = 63.2%、2τ = 86.5%、3τ = 95.0%、5τ = 99.3%（放电 36.8% / 13.5% / 5.0% / 0.7%）</li>
            <li>• 阈值延时：Vth = 0.5Vs → t = 0.693τ；Vth = 0.9Vs → t = 2.303τ</li>
            <li>• 反算：τ = 1 ms、C = 100 nF → R = 10.0 kΩ（E24 精确档，偏差 0%）</li>
            <li>• 时间游标：t = 1τ、Vs = 5V 时充电 3.16 V（63.2%）</li>
          </ul>
        </div>

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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>时间常数 τ 的物理含义</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          τ（tau）是 RC 电路唯一的时间尺度：τ = R×C，单位秒。它回答的问题是"这个电路过渡过程有多快"——
          充电开始后经过一个 τ，电容电压从 0 爬到电源电压的 63.2%；放电时经过一个 τ，电压衰减到原来的 36.8%。
          τ 越大过渡越慢：电阻限流越狠（R 大）或电容储量越大（C 大），电压变化都需要更长时间。
          工程上 1τ、2τ、3τ、5τ 对应 63.2%、86.5%、95.0%、99.3%，这组锚点在示波器上快速估算 τ 时非常好用——
          量出电压爬到 63.2% 的时间就是 τ。电路中的电流同样按指数衰减：起始 i = Vs/R，一个 τ 后剩 36.8%。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>为什么 5τ 就算"充满"</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          指数充放电在数学上永远到不了 100%，但残余部分衰减极快：3τ 后只剩 5%，4τ 后 1.8%，5τ 后 0.7%。
          而 0.7% 的偏差已经低于普通电阻（±5%/±1%）与电解电容（±20%）的容差、以及电容漏电流带来的实际误差——
          再等下去的时间都被元件容差"淹没"了。所以工程口径把 5τ（99.3%）视为充满/放完，
          这也是数据手册中复位延时、去耦恢复时间普遍按 5τ 计算的原因。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>指数解是怎么来的（一句话推导）</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          把欧姆定律 V=IR 与电容定义 i = C·dV/dt 代入回路 KVL：Vs = iR + V = RC·dV/dt + V，
          得一阶微分方程 dV/dt = (Vs − V)/(RC)，分离变量积分即得充电 V(t) = Vs(1 − e^(−t/τ))；
          放电时令 Vs = 0 得 V(t) = V₀·e^(−t/τ)。阈值延时是它的反函数：t = −τ·ln(1 − Vth/Vs)。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>上电复位电路实例</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          典型 MCU 上电复位：复位脚经 RC 从电源拉起（或拉低），如 10 kΩ 上拉 + 1 µF 对地，上电瞬间电容电压为 0（复位有效），
          电压按 τ = 10 ms 指数爬升，到 50% 阈值需 6.9 ms、到 90% 需 23 ms，期间 MCU 保持复位；
          电容上并联一只二极管（阳极接地）可在断电时把电荷快速放掉，保证频繁掉电上电也能可靠复位。
          注意复位脚多为施密特输入，阈值在 0.5~0.8Vdd 之间，按本工具的阈值延时公式换算即可；
          要求更精确复位门限与掉电检测时，可换专用复位芯片。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>RC 延时 vs 555 定时器怎么选</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          一句话：<span class="text-foreground font-medium">毫秒级的"凑合延时"用 RC，讲究的定时用 555</span>。
          RC 的优势是零芯片成本、静态无功耗、两颗料搞定，适合上电复位、按键消抖、指示灯缓启这类对精度不敏感的场景；
          但它的延时受电阻容差 ±5%/电容 −20%~+20% 与漏电流影响，误差可能超过 ±20%，且没有整形输出（阈值附近缓慢穿越会抖动）。
          需要精确周期、可调占空比、秒级以上长延时、或施密特整形输出的方波时，用
          <NuxtLink to="/tools/timer-555-calculator" class="text-primary hover:underline">555定时器计算器</NuxtLink>
          配合 NE555 更合适——555 内部两个阈值（1/3、2/3 Vcc）把指数段"切"成明确定时窗口，
          精度只取决于 R、C 本身而不依赖逻辑阈值。开关电源侧的电感选型则可参考
          <NuxtLink to="/tools/buck-inductor-calculator" class="text-primary hover:underline">BUCK电感选型计算器</NuxtLink>。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">τ = 1 ms 的 RC，充到 90% 要多久？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              t = −τ·ln(1 − 0.9) = 2.303τ ≈ 2.3 ms。充电到 50% 需 0.693τ ≈ 0.69 ms，到 63.2% 恰好 1τ，
              到 99.3% 需 5τ = 5 ms。把 2.303 记成"十倍时间常数"口诀：充到 90% 约等于 2.3 个 τ。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么说 5τ 之后电容就"充满了"？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              5τ 时电压已达 99.3%，残余 0.7% 比电阻电容的容差（±5%/±20%）、漏电流造成的实际偏差还要小，
              继续等待在工程上没有意义；这也是复位延时等参数普遍按 5τ 设计的原因。数学上指数永不到 100%，
              "充满"是工程截断口径。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">RC 延时和 555 定时器怎么选？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              毫秒级、对精度不敏感的复位/消抖/缓启用 RC（零成本、低功耗）；需要精确周期、可调占空比、
              长延时或整形输出的方波用 555。RC 延时误差主要来自电容容差（电解 −20%~+20%），
              555 的阈值窗口由内部电阻链决定，精度只取决于外接 RC 本身。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">10 kΩ + 100 nF 的滤波截止频率是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              fc = 1/(2πRC) = 1/(2π×10⁴×10⁻⁷) ≈ 159.2 Hz，对应 τ = 1 ms。τ 与 fc 是同一个时间尺度的两种表达
              （τ = 1/(2π·fc)）：τ 视角看时域充放电，fc 视角看频域衰减（每十倍频 −20 dB）。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'rc-time-constant'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Timer, Calculator, Activity, Zap, Info, Lightbulb,
  CheckCircle, Link as LinkIcon, ChevronUp, ChevronDown, AlertTriangle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'rc-time-constant'
const STORAGE_KEY = 'rc-time-constant.inputs'

// SEO
useSeoMeta({
  title: 'RC时间常数计算器 - τ=RC 正反算与充放电曲线可视化',
  description: '在线 RC 时间常数计算器：τ=RC 正反算（s/ms/µs 智能单位）、充放电指数曲线 SVG 与时间游标、1τ~5τ 锚点标注、阈值延时正反算与标准阻值容值吸附回验，纯本地计算',
  keywords: 'rc时间常数, tau计算, 电容充放电时间, rc延时计算, rc滤波截止频率, 充放电曲线, rc time constant calculator, 63.2%',
  author: 'Util工具箱',
  ogTitle: 'RC时间常数计算器 - 有条工具',
  ogDescription: 'τ=RC 正反算、充放电指数曲线与时间游标、阈值延时换算与标准档吸附回验',
  ogUrl: 'https://www.util.cn/tools/rc-time-constant',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'RC时间常数计算器',
  twitterDescription: 'τ=RC 正反算、充放电曲线 0~5τ 可视化、阈值延时与标准档吸附'
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
          name: 'RC时间常数计算器',
          url: 'https://www.util.cn/tools/rc-time-constant',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'τ=RC 正算与反向求 R / 求 C',
            's/ms/µs/ns 智能单位显示',
            '充电与放电指数曲线 SVG 可视化',
            '时间游标查看任意 t 的瞬时百分比与伏值',
            '1τ=63.2% ~ 5τ=99.3% 锚点标注',
            '阈值延时 t=−τ·ln(1−Vth/Vs) 正反算',
            'E24 阻值 / E12 容值标准档吸附回验',
            'fc=1/(2πRC) 截止频率换算'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'RC时间常数计算器', item: 'https://www.util.cn/tools/rc-time-constant/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'τ = 1 ms 的 RC，充到 90% 要多久？',
              acceptedAnswer: { '@type': 'Answer', text: 't = −τ·ln(1−0.9) = 2.303τ ≈ 2.3 ms；充到 50% 需 0.693τ ≈ 0.69 ms，到 99.3% 需 5τ = 5 ms。' }
            },
            {
              '@type': 'Question',
              name: '为什么说 5τ 之后电容就充满了？',
              acceptedAnswer: { '@type': 'Answer', text: '5τ 时电压已达 99.3%，残余 0.7% 低于电阻电容容差与漏电流带来的实际偏差，工程上视为充满。' }
            },
            {
              '@type': 'Question',
              name: 'RC 延时和 555 定时器怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '毫秒级、精度不敏感的复位/消抖用 RC（零成本低功耗）；需要精确周期、占空比、长延时或整形输出用 555 定时器。' }
            },
            {
              '@type': 'Question',
              name: '10 kΩ + 100 nF 的滤波截止频率是多少？',
              acceptedAnswer: { '@type': 'Answer', text: 'fc = 1/(2πRC) = 1/(2π×10⁴×10⁻⁷) ≈ 159.2 Hz，对应 τ = 1 ms，二者满足 τ = 1/(2π·fc)。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === TOOL_ID)
onMounted(() => {
  addRecentTool(TOOL_ID)
  restoreInputs()
})

// ==== PURE-FNS-START ====
// ---------- 标准档基准表（IEC 60063） ----------
// 电阻 E24（每 decade，Ω 口径）
const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]
// 电容 E12（每 decade，pF 口径）
const E12_C = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]
const R_DEC_MIN = -1
const R_DEC_MAX = 7
const C_DEC_MIN = 0
const C_DEC_MAX = 10

// 浮点清理（1.2×10³ → 1200）
const norm = (v) => Number(v.toPrecision(12))

// 最近标准值：标准档为等比数列，按对数（几何）距离取最近，同距取较低档
const snapE24Ohm = (targetOhm) => {
  if (!Number.isFinite(targetOhm) || !(targetOhm > 0)) return null
  let best = null
  let bestDist = Infinity
  for (let k = R_DEC_MIN; k <= R_DEC_MAX; k++) {
    const f = Math.pow(10, k)
    for (const m of E24) {
      const v = norm(m * f)
      const dist = Math.abs(Math.log(v / targetOhm))
      if (dist < bestDist) {
        best = v
        bestDist = dist
      }
    }
  }
  return best
}
// 电容吸附（pF 域计算，返回法拉）
const snapE12Farad = (targetFarad) => {
  if (!Number.isFinite(targetFarad) || !(targetFarad > 0)) return null
  const targetPf = targetFarad * 1e12
  let best = null
  let bestDist = Infinity
  for (let k = C_DEC_MIN; k <= C_DEC_MAX; k++) {
    const f = Math.pow(10, k)
    for (const m of E12_C) {
      const v = norm(m * f)
      const dist = Math.abs(Math.log(v / targetPf))
      if (dist < bestDist) {
        best = v
        bestDist = dist
      }
    }
  }
  return best * 1e-12
}

// ---------- 一阶 RC 公式 ----------
// τ = RC（r: Ω，c: F → s）
const tauRC = (r, c) => {
  if (!Number.isFinite(r) || !Number.isFinite(c) || !(r > 0) || !(c > 0)) return null
  return r * c
}
// 反算：R = τ / C
const rFromTau = (tau, c) => {
  if (!Number.isFinite(tau) || !Number.isFinite(c) || !(tau > 0) || !(c > 0)) return null
  return tau / c
}
// 反算：C = τ / R
const cFromTau = (tau, r) => rFromTau(tau, r)
// 截止频率 fc = 1/(2πRC)
const cutoffHz = (r, c) => {
  if (!Number.isFinite(r) || !Number.isFinite(c) || !(r > 0) || !(c > 0)) return null
  return 1 / (2 * Math.PI * r * c)
}

// ---------- 曲线函数（x = t/τ，返回百分比 0~100） ----------
const chargePct = (x) => {
  if (!Number.isFinite(x) || x < 0) return null
  return (1 - Math.exp(-x)) * 100
}
const dischargePct = (x) => {
  if (!Number.isFinite(x) || x < 0) return null
  return Math.exp(-x) * 100
}
// 百分比 → 实际电压
const pctToVolt = (pct, vs) => {
  if (!Number.isFinite(pct) || !Number.isFinite(vs) || !(vs > 0)) return null
  return (pct / 100) * vs
}

// ---------- 阈值延时 ----------
// ln 系数 k = −ln(1 − Vth/Vs)，0 < ratio < 1
const delayFactor = (ratio) => {
  if (!Number.isFinite(ratio) || !(ratio > 0) || !(ratio < 1)) return null
  return -Math.log(1 - ratio)
}
// t = −τ·ln(1 − Vth/Vs)
const delaySeconds = (tau, vth, vs) => {
  if (!Number.isFinite(tau) || !(tau > 0) || !Number.isFinite(vs) || !(vs > 0) || !Number.isFinite(vth)) return null
  const k = delayFactor(vth / vs)
  return k === null ? null : k * tau
}
// 反算：τ = t / k
const tauForDelay = (tSec, vth, vs) => {
  const t = Number.isFinite(tSec) ? tSec : null
  if (t === null || !(t > 0) || !Number.isFinite(vs) || !(vs > 0) || !Number.isFinite(vth)) return null
  const k = delayFactor(vth / vs)
  return k === null ? null : t / k
}

// ---------- 智能单位与格式化（避免浮点尾差） ----------
const trimZeros = (s) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)
const fmtNum = (v, sig = 4) => {
  if (!Number.isFinite(v)) return '—'
  return trimZeros(parseFloat(v.toPrecision(sig)).toString())
}
// 时间智能单位：s / ms / µs / ns
const fmtTimeSmart = (sec) => {
  if (!Number.isFinite(sec) || !(sec > 0)) return null
  let v
  let u
  if (sec >= 1) { v = sec; u = 's' }
  else if (sec >= 1e-3) { v = sec * 1e3; u = 'ms' }
  else if (sec >= 1e-6) { v = sec * 1e6; u = 'µs' }
  else { v = sec * 1e9; u = 'ns' }
  return { v, u, text: fmtNum(v, 4) + ' ' + u }
}
const fmtR = (v) => {
  if (!Number.isFinite(v) || v <= 0) return '—'
  if (v >= 1e6) return trimZeros((v / 1e6).toPrecision(4)) + ' MΩ'
  if (v >= 1e3) return trimZeros((v / 1e3).toPrecision(4)) + ' kΩ'
  return trimZeros(v.toPrecision(4)) + ' Ω'
}
const fmtFarad = (c) => {
  if (!Number.isFinite(c) || c <= 0) return '—'
  if (c >= 1e-6) return trimZeros((c * 1e6).toPrecision(4)) + ' µF'
  if (c >= 1e-9) return trimZeros((c * 1e9).toPrecision(4)) + ' nF'
  return trimZeros((c * 1e12).toPrecision(4)) + ' pF'
}
const fmtFreq = (hz) => {
  if (!Number.isFinite(hz) || hz <= 0) return '—'
  if (hz >= 1e6) return trimZeros((hz / 1e6).toPrecision(4)) + ' MHz'
  if (hz >= 1e3) return trimZeros((hz / 1e3).toPrecision(4)) + ' kHz'
  return trimZeros(hz.toPrecision(4)) + ' Hz'
}
const fmtDevPct = (p) => (!Number.isFinite(p) ? '—' : (p >= 0 ? '+' : '') + p.toFixed(2) + '%')
const devClsOf = (p) => {
  if (!Number.isFinite(p)) return ''
  const abs = Math.abs(p)
  if (abs <= 1) return 'text-green-600 dark:text-green-400'
  if (abs <= 5) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}
// ==== PURE-FNS-END ====

// ---------- 状态 ----------
const MODES = [
  { k: 'fwd', label: '正算 τ = RC' },
  { k: 'revR', label: '反算 R = τ/C' },
  { k: 'revC', label: '反算 C = τ/R' }
]
const R_UNITS = [
  { k: 'Ω', f: 1 },
  { k: 'kΩ', f: 1e3 },
  { k: 'MΩ', f: 1e6 }
]
const C_UNITS = [
  { k: 'pF', f: 1e-12 },
  { k: 'nF', f: 1e-9 },
  { k: 'µF', f: 1e-6 }
]
const T_UNITS = [
  { k: 's', f: 1 },
  { k: 'ms', f: 1e-3 },
  { k: 'µs', f: 1e-6 }
]

const mode = ref('fwd')
const rVal = ref(10)
const rUnit = ref('kΩ')
const cVal = ref(100)
const cUnit = ref('nF')
const tauVal = ref(1)
const tauUnit = ref('ms')
const vs = ref(5)
const curveMode = ref('charge')
const cursorTau = ref(1)
const vth = ref(3)
const revTVal = ref(1)
const revTUnit = ref('ms')
const delayCVal = ref(100)
const delayCUnit = ref('nF')

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const unitF = (list, k) => {
  const u = list.find((x) => x.k === k)
  return u ? u.f : 1
}

// 校验范围
const R_MIN = 0.1
const R_MAX = 1e8
const C_MIN = 1e-13
const C_MAX = 0.1
const TAU_MIN = 1e-9
const TAU_MAX = 1e7

const rOk = (x) => Number.isFinite(x) && x >= R_MIN && x <= R_MAX
const cOk = (x) => Number.isFinite(x) && x >= C_MIN && x <= C_MAX
const tauOk = (x) => Number.isFinite(x) && x >= TAU_MIN && x <= TAU_MAX

const rOhm = computed(() => rVal.value * unitF(R_UNITS, rUnit.value))
const cFarad = computed(() => cVal.value * unitF(C_UNITS, cUnit.value))
const tauInputSec = computed(() => tauVal.value * unitF(T_UNITS, tauUnit.value))

// ---------- 当前 τ（三种模式下都有定义） ----------
const tauSec = computed(() => {
  if (mode.value === 'fwd') {
    if (!rOk(rOhm.value) || !cOk(cFarad.value)) return null
    return tauRC(rOhm.value, cFarad.value)
  }
  if (!tauOk(tauInputSec.value)) return null
  return tauInputSec.value
})

const tauText = computed(() => (tauSec.value !== null ? fmtTimeSmart(tauSec.value).text : '—'))
const fiveTauText = computed(() => (tauSec.value !== null ? fmtTimeSmart(tauSec.value * 5).text : '—'))
const fcText = computed(() => {
  if (mode.value !== 'fwd' || tauSec.value === null) return '—'
  return fmtFreq(cutoffHz(rOhm.value, cFarad.value))
})

// ---------- 反算结果（含吸附回验） ----------
const revRResult = computed(() => {
  if (mode.value !== 'revR' || tauSec.value === null || !cOk(cFarad.value)) return null
  const rExact = rFromTau(tauSec.value, cFarad.value)
  if (rExact === null) return null
  const snap = snapE24Ohm(rExact)
  if (snap === null) return null
  const tauReal = tauRC(snap, cFarad.value)
  const devPct = (tauReal / tauSec.value - 1) * 100
  return { rExact, snap, c: cFarad.value, tauReal, devPct, devText: fmtDevPct(devPct), devCls: devClsOf(devPct) }
})

const revCResult = computed(() => {
  if (mode.value !== 'revC' || tauSec.value === null || !rOk(rOhm.value)) return null
  const cExact = cFromTau(tauSec.value, rOhm.value)
  if (cExact === null) return null
  const snap = snapE12Farad(cExact)
  if (snap === null) return null
  const tauReal = tauRC(rOhm.value, snap)
  const devPct = (tauReal / tauSec.value - 1) * 100
  return { cExact, snap, r: rOhm.value, tauReal, devPct, devText: fmtDevPct(devPct), devCls: devClsOf(devPct) }
})

// ---------- 曲线与游标 ----------
// 图表几何常量（viewBox 0 0 560 320）
const CH_X0 = 56
const CH_W = 480
const CH_TAU = 96
const CH_Y0 = 36
const CH_Y1 = 280
const CH_H = CH_Y1 - CH_Y0

const xOf = (f) => CH_X0 + CH_TAU * f
const yOf = (p) => CH_Y1 - (CH_H / 100) * p

const yGrid = [0, 25, 50, 75, 100].map((p) => ({ p, y: yOf(p) }))
const xGrid = [0, 1, 2, 3, 4, 5].map((f) => ({ f, x: xOf(f), label: f === 0 ? '0' : f + 'τ' }))

const CHARGE_ANCHORS = [
  { f: 1, label: '1τ', pct: 63.2, pctText: '63.2' },
  { f: 2, label: '2τ', pct: 86.5, pctText: '86.5' },
  { f: 3, label: '3τ', pct: 95.0, pctText: '95.0' },
  { f: 5, label: '5τ', pct: 99.3, pctText: '99.3' }
]
const DISCHARGE_ANCHORS = [
  { f: 1, label: '1τ', pct: 36.8, pctText: '36.8' },
  { f: 2, label: '2τ', pct: 13.5, pctText: '13.5' },
  { f: 3, label: '3τ', pct: 5.0, pctText: '5.0' },
  { f: 5, label: '5τ', pct: 0.7, pctText: '0.7' }
]
const anchors = computed(() => (curveMode.value === 'charge' ? CHARGE_ANCHORS : DISCHARGE_ANCHORS))

const pctAt = (f) => {
  const p = curveMode.value === 'charge' ? chargePct(f) : dischargePct(f)
  return p === null ? 0 : p
}

const curvePath = computed(() => {
  const N = 240
  const pts = []
  for (let i = 0; i <= N; i++) {
    const f = (i / N) * 5
    pts.push(xOf(f).toFixed(1) + ',' + yOf(pctAt(f)).toFixed(1))
  }
  return 'M' + pts.join(' L')
})

// 游标（0~5 τ）
const cursorTauClamped = computed(() => {
  const v = Number(cursorTau.value)
  if (!Number.isFinite(v)) return 1
  return Math.min(5, Math.max(0, v))
})
const cursorPct = computed(() => pctAt(cursorTauClamped.value))
const cursorPctText = computed(() => cursorPct.value.toFixed(2) + '%')
const cursorVolt = computed(() => pctToVolt(cursorPct.value, vs.value))
const cursorVoltText = computed(() => (cursorVolt.value === null ? '—' : fmtNum(cursorVolt.value, 4) + ' V'))
const cursorX = computed(() => xOf(cursorTauClamped.value))
const cursorY = computed(() => yOf(cursorPct.value))
const cursorAnchor = computed(() => (cursorTauClamped.value > 3 ? 'end' : 'start'))
const cursorLabelX = computed(() => (cursorTauClamped.value > 3 ? cursorX.value - 8 : cursorX.value + 8))
const cursorLabelY = computed(() => Math.max(cursorY.value - 12, CH_Y0 + 16))
const cursorTText = computed(() => {
  if (tauSec.value === null) return '—'
  const t = cursorTauClamped.value * tauSec.value
  const s = fmtTimeSmart(t)
  return s ? s.text : '—'
})
const cursor = computed(() => ({ tText: cursorTText.value }))

// ---------- 阈值延时 ----------
const vthRatio = computed(() => {
  const v = vth.value
  const s = vs.value
  if (!Number.isFinite(v) || !Number.isFinite(s) || !(s > 0) || !(v > 0) || !(v < s)) return null
  return v / s
})
const vthRatioText = computed(() => (vthRatio.value === null ? '—' : fmtNum(vthRatio.value, 4)))

const delayResult = computed(() => {
  if (tauSec.value === null || vthRatio.value === null) return null
  const k = delayFactor(vthRatio.value)
  if (k === null) return null
  const t = k * tauSec.value
  const s = fmtTimeSmart(t)
  return { tText: s ? s.text : '—', ratioText: fmtNum(k, 4) + ' × τ' }
})

const delayRevTargetText = computed(() => {
  const t = revTVal.value * unitF(T_UNITS, revTUnit.value)
  const s = fmtTimeSmart(t)
  return s ? s.text : '—'
})

const delayRevResult = computed(() => {
  const t = revTVal.value * unitF(T_UNITS, revTUnit.value)
  const c = delayCVal.value * unitF(C_UNITS, delayCUnit.value)
  if (!Number.isFinite(t) || !(t > 0) || !cOk(c) || vthRatio.value === null) return null
  const tauReq = tauForDelay(t, vth.value, vs.value)
  if (tauReq === null) return null
  const rExact = rFromTau(tauReq, c)
  if (rExact === null) return null
  const snap = snapE24Ohm(rExact)
  if (snap === null) return null
  const k = delayFactor(vthRatio.value)
  const tauReal = tauRC(snap, c)
  const tReal = tauReal * k
  const devPct = (tReal / t - 1) * 100
  return { tauReq, rExact, snap, c, tReal, k: fmtNum(k, 4), devPct, devText: fmtDevPct(devPct), devCls: devClsOf(devPct) }
})

// ---------- 输入持久化（键前缀为工具 id） ----------
const restoreInputs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    const num = (v) => (Number.isFinite(v) ? v : null)
    if (MODES.some((m) => m.k === s.mode)) mode.value = s.mode
    if (R_UNITS.some((u) => u.k === s.rUnit)) rUnit.value = s.rUnit
    if (C_UNITS.some((u) => u.k === s.cUnit)) cUnit.value = s.cUnit
    if (T_UNITS.some((u) => u.k === s.tauUnit)) tauUnit.value = s.tauUnit
    if (T_UNITS.some((u) => u.k === s.revTUnit)) revTUnit.value = s.revTUnit
    if (C_UNITS.some((u) => u.k === s.delayCUnit)) delayCUnit.value = s.delayCUnit
    if (s.curveMode === 'charge' || s.curveMode === 'discharge') curveMode.value = s.curveMode
    for (const [key, refv, lo, hi] of [
      ['rVal', rVal, 0, 1e9], ['cVal', cVal, 0, 1e9], ['tauVal', tauVal, 0, 1e9],
      ['vs', vs, 0.1, 1000], ['cursorTau', cursorTau, 0, 5],
      ['vth', vth, 0, 1000], ['revTVal', revTVal, 0, 1e9], ['delayCVal', delayCVal, 0, 1e9]
    ]) {
      const v = num(s[key])
      if (v !== null && v >= lo && v <= hi) refv.value = v
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
}

watch([mode, rVal, rUnit, cVal, cUnit, tauVal, tauUnit, vs, curveMode, cursorTau, vth, revTVal, revTUnit, delayCVal, delayCUnit], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: mode.value, rVal: rVal.value, rUnit: rUnit.value,
      cVal: cVal.value, cUnit: cUnit.value, tauVal: tauVal.value, tauUnit: tauUnit.value,
      vs: vs.value, curveMode: curveMode.value, cursorTau: cursorTau.value,
      vth: vth.value, revTVal: revTVal.value, revTUnit: revTUnit.value,
      delayCVal: delayCVal.value, delayCUnit: delayCUnit.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

// ---------- 相关工具 ----------
const relatedLinks = computed(() => ['timer-555-calculator', 'buck-inductor-calculator', 'crystal-load-calculator']
  .map((id) => tools.find((t) => t.id === id))
  .filter(Boolean))
</script>
