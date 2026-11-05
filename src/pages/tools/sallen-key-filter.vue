<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Filter class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Sallen-Key 滤波器设计</h1>
          <p class="text-sm text-muted-foreground mt-1">二阶有源低通：截止频率 / Q 值反解元件、E24 与常用容值吸附回验、增益自激预警</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 Sallen-Key 二阶低通滤波器计算器：输入截止频率与 Q 值（Butterworth / Bessel / Chebyshev 预设或自定义），
        按等值电阻方案（R1=R2，电容比定 Q）与标准方案（R1≠R2）两种拓扑反解 R/C 元件，
        自动吸附 E24 电阻档与常用容值档并回验实际 fc/Q 偏差；输入同相增益 K 时按
        Q = √(R1R2C1C2)/[C2(R1+R2)+R1C1(1−K)] 校核 Q 抬升与自激风险（等值等容下 K≥3 自激）。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        计算口径与元件标号：R1 自输入端接到 R1/R2 结点，R2 由结点接到运放同相端；C1 为反馈电容（结点接运放输出），
        C2 为同相端对地电容。特征频率 fc = 1/(2π√(R1R2C1C2))；单位增益下 Q = √(R1R2C1C2)/[C2(R1+R2)]。
        等值方案取 R1=R2=R、C1=mC2，此时 Q = √m/2（m = C1/C2 = 4Q²），约束为必须采用单位增益缓冲接法。
        元件吸附口径：电阻按 E24（±1% 金属膜），电容按常用容值档（E12 口径：1.0/1.2/1.5/1.8/2.2/2.7/3.3/3.9/4.7/5.6/6.8/8.2 × 十进制）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 设计计算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 元件设计
          </h2>

          <!-- 拓扑方案 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">拓扑方案</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="scheme = 'standard'"
                :class="scheme === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >标准方案（R1≠R2，可高 Q）</button>
              <button
                @click="scheme = 'equal'"
                :class="scheme === 'equal' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >等值方案（R1=R2，电容比定 Q）</button>
            </div>
          </div>

          <!-- fc 与 Q -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="sk-fc" class="block text-sm font-medium text-foreground mb-1.5">截止频率 fc（Hz）</label>
              <input
                id="sk-fc"
                v-model.number="fcTarget"
                type="number"
                min="0.1"
                step="100"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1000"
              >
              <div class="flex flex-wrap gap-1.5 mt-2">
                <button
                  v-for="p in FC_PRESETS"
                  :key="p.v"
                  @click="fcTarget = p.v"
                  :class="fcTarget === p.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                >{{ p.label }}</button>
              </div>
            </div>
            <div>
              <label for="sk-q" class="block text-sm font-medium text-foreground mb-1.5">品质因数 Q</label>
              <div class="flex flex-wrap gap-1.5 mb-2">
                <button
                  v-for="p in Q_PRESETS"
                  :key="p.name"
                  @click="qMode = p.q"
                  :class="qMode === p.q ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                >{{ p.name }} {{ p.q }}</button>
                <button
                  @click="qMode = 'custom'"
                  :class="qMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                >自定义</button>
              </div>
              <input
                v-if="qMode === 'custom'"
                id="sk-q"
                v-model.number="qCustom"
                type="number"
                min="0.1"
                max="5"
                step="0.01"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="0.5~2，如 0.707"
              >
              <p v-else class="text-xs text-muted-foreground mt-1">
                {{ qNote(qMode) }}
              </p>
            </div>
          </div>

          <!-- 电容输入 -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-if="scheme === 'standard'">
              <label for="sk-c1" class="block text-sm font-medium text-foreground mb-1.5">C1 反馈电容（nF）</label>
              <input
                id="sk-c1"
                v-model.number="c1StdNf"
                type="number"
                min="0.001"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 22"
              >
              <p class="text-xs text-muted-foreground mt-1">R1/R2 结点接运放输出</p>
            </div>
            <div v-if="scheme === 'standard'">
              <label for="sk-c2" class="block text-sm font-medium text-foreground mb-1.5">C2 对地电容（nF）</label>
              <input
                id="sk-c2"
                v-model.number="c2StdNf"
                type="number"
                min="0.001"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
              <p class="text-xs text-muted-foreground mt-1">同相端对地</p>
            </div>
            <div v-if="scheme === 'equal'">
              <label for="sk-c2e" class="block text-sm font-medium text-foreground mb-1.5">C2 对地电容（nF）</label>
              <input
                id="sk-c2e"
                v-model.number="c2EqNf"
                type="number"
                min="0.001"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 10"
              >
              <p class="text-xs text-muted-foreground mt-1">C1 = 4Q² × C2 自动求出</p>
            </div>
            <div>
              <label for="sk-k" class="block text-sm font-medium text-foreground mb-1.5">同相增益 K（1 = 缓冲）</label>
              <input
                id="sk-k"
                v-model.number="gainK"
                type="number"
                min="1"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="1"
              >
              <p class="text-xs text-muted-foreground mt-1">K = 1 + R4/R3；增益会抬高 Q，过大自激</p>
            </div>
          </div>

          <!-- 无实数解（标准方案约束） -->
          <div v-if="mainResult && mainResult.kind === 'impossible'" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">无实数解：C1/C2 必须不小于 4Q²</p>
              <p class="text-xs text-muted-foreground mt-1">
                当前 C1/C2 = {{ fmt(mainResult.ratio, 2) }}，而 4Q² = {{ fmt(mainResult.needRatio, 3) }}（需要 C1 ≥ {{ fmt(mainResult.needC1Nf, 2) }} nF）。
                单位增益 Sallen-Key 的电阻和 R1+R2 有下限，电容比不足时两电阻无实数解——请增大 C1、减小 C2 或降低 Q 值。
              </p>
            </div>
          </div>

          <!-- 自激红警条 -->
          <div v-if="mainResult && mainResult.oscillates" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border-2 border-red-500/40">
            <AlertTriangle class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-bold text-red-600 dark:text-red-400">自激风险：当前增益 K = {{ fmt(gainK, 2) }} 已达到或超过临界增益</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                回验分母 C2(R1+R2) + R1C1(1−K) ≤ 0，Q 无意义，电路将自激振荡。临界增益 K_crit = {{ fmt(mainResult.kCrit, 2) }}
                （等值等容口径即 K=3）。请减小 K，或减小 R1/C1、增大 C2/R1+R2 后重算。
              </p>
            </div>
          </div>
          <div v-else-if="mainResult && mainResult.kCrit !== null && gainK > 1 && mainResult.qReal !== null && mainResult.qAtUnity !== null && mainResult.qReal > mainResult.qAtUnity * 1.5" class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-600 dark:text-amber-400 font-medium">
              增益把 Q 从 {{ fmt(mainResult.qAtUnity, 3) }} 抬到 {{ fmt(mainResult.qReal, 3) }}（临界增益 K_crit = {{ fmt(mainResult.kCrit, 2) }}），峰值与振铃明显加剧，留距 K_crit 至少 20% 余量。
            </p>
          </div>

          <!-- 结果：标准方案 -->
          <div v-if="mainResult && mainResult.kind === 'standard'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">R1（输入侧，精确值）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.r1Exact, 0) }} <span class="text-sm">Ω</span></p>
                <p class="text-xs mt-1" :class="mainResult.r1Snap.devPct === 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                  E24 吸附 {{ fmt(mainResult.r1Snap.value / 1000, 2) }} kΩ（{{ snapDevText(mainResult.r1Snap.devPct) }}）
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">R2（输出侧，精确值）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.r2Exact, 0) }} <span class="text-sm">Ω</span></p>
                <p class="text-xs mt-1" :class="mainResult.r2Snap.devPct === 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                  E24 吸附 {{ fmt(mainResult.r2Snap.value / 1000, 2) }} kΩ（{{ snapDevText(mainResult.r2Snap.devPct) }}）
                </p>
              </div>
            </div>
            <div class="pt-3 border-t border-primary/20 text-sm">
              <p class="text-muted-foreground">
                回验（吸附元件 + 增益 K={{ fmt(gainK, 2) }}）：fc = {{ fmt(mainResult.fcReal, 1) }} Hz（{{ devText(mainResult.fcDevPct) }}），
                Q = {{ fmt(mainResult.qReal, 3) }}（{{ devText(mainResult.qDevPct) }}）
              </p>
              <p class="mt-1.5 text-xs" :class="verdictCls(mainResult)">{{ verdictText(mainResult) }}</p>
              <p class="mt-1.5 text-xs text-muted-foreground">E24 吸附在最近档 ±1 档共 9 组组合中按"fc/Q 最大偏差最小"择优，避免单只就近取档导致偏差叠加。</p>
            </div>
          </div>

          <!-- 结果：等值方案 -->
          <div v-if="mainResult && mainResult.kind === 'equal'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">C1 = m·C2（m = 4Q² = {{ fmt(mainResult.m, 4) }}，精确值）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.c1ExactNf, 2) }} <span class="text-sm">nF</span></p>
                <p class="text-xs mt-1" :class="mainResult.c1Snap.devPct === 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                  常用容值吸附 {{ fmt(mainResult.c1Snap.value * 1e9, 2) }} nF（{{ snapDevText(mainResult.c1Snap.devPct) }}，取 Q 偏差更小的相邻档）
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">R1 = R2 = R（精确值）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.rExact, 0) }} <span class="text-sm">Ω</span></p>
                <p class="text-xs mt-1" :class="mainResult.rSnap.devPct === 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                  E24 吸附 {{ fmt(mainResult.rSnap.value / 1000, 2) }} kΩ（{{ snapDevText(mainResult.rSnap.devPct) }}）
                </p>
              </div>
            </div>
            <div class="pt-3 border-t border-primary/20 text-sm">
              <p class="text-muted-foreground">
                回验（吸附元件 + 增益 K={{ fmt(gainK, 2) }}）：fc = {{ fmt(mainResult.fcReal, 1) }} Hz（{{ devText(mainResult.fcDevPct) }}），
                Q = {{ fmt(mainResult.qReal, 3) }}（{{ devText(mainResult.qDevPct) }}，等值方案 Q 仅由 C1/C2 比值决定）
              </p>
              <p class="mt-1.5 text-xs" :class="verdictCls(mainResult)">{{ verdictText(mainResult) }}</p>
              <p class="mt-1.5 text-xs text-muted-foreground">等值方案 Q = √(C1/C2)/2：容值吸附对 Q 的偏差无法用电阻弥补，Q 偏差大时请改用标准方案（R1≠R2 可吸收容值误差）。</p>
            </div>
          </div>

          <!-- 参数无效 -->
          <div v-if="!mainResult" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">
              请检查参数：fc &gt; 0、Q 在 0.1~5、电容均大于 0、增益 K ≥ 1。
            </p>
          </div>

          <!-- 响应注记 -->
          <div v-if="mainResult && mainResult.kind !== 'impossible' && mainResult.qReal !== null" class="p-4 rounded-lg border border-border bg-muted/50 text-xs leading-relaxed text-muted-foreground">
            <p>
              幅频注记：这是二阶低通，高频以 <span class="text-foreground font-medium">−40dB/dec（每十倍频 40dB）</span>滚降、相位趋于 −180°。
              特征频率 fc 处的增益为 20·lg(K·Q) = <span class="text-foreground font-medium">{{ fmt(mainResult.atFcDb, 2) }} dB</span>
              ——仅当 Q = 0.707（Butterworth，K=1）时恰为 −3dB；
              <span v-if="mainResult.peakDb !== null">当前 Q &gt; 0.707，约在 {{ fmt(mainResult.peakFreqHz, 0) }} Hz 处出现 <span class="text-foreground font-medium">+{{ fmt(mainResult.peakDb, 2) }} dB</span> 的峰值（峰化），−3dB 点随之上移；</span>
              <span v-else>当前 Q ≤ 0.707 无峰化，通带单调下降。</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 公式卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 设计公式（已核实口径）
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border text-sm space-y-1.5">
            <p class="font-semibold text-foreground">fc = 1 / (2π·√(R1R2C1C2))</p>
            <p class="font-semibold text-foreground">Q(K) = √(R1R2C1C2) / [C2(R1+R2) + R1C1(1−K)]</p>
            <p class="text-xs text-muted-foreground">K=1 时退化为 Q = √(R1R2C1C2)/[C2(R1+R2)]；等值方案 R1=R2、C1=mC2 时 Q = √m/2，m = C1/C2 = 4Q²</p>
            <p class="font-semibold text-foreground pt-1">标准方案反解（K=1）</p>
            <p class="text-xs text-muted-foreground">R1R2 = 1/((2πfc)²·C1C2)，R1+R2 = √(R1R2)·√(C1/C2)/Q，再解二次方程；有实数解的充要条件是 C1/C2 ≥ 4Q²</p>
          </div>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">标号约定：</span>C1 为反馈电容（R1/R2 结点接运放输出），C2 为同相端对地电容；不同资料标号可能相反，以"哪个电容出现在 Q 分母的 (R1+R2) 项"为准。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">自激阈值：</span>K_crit = 1 + C2(R1+R2)/(R1C1)；等值等容时恰为 K=3。增益只改 Q（阻尼项），不改 fc。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">增益位置：</span>K&gt;1 时把较小电阻放输入侧（R1），可减小增益对 Q 的抬升。</span>
            </li>
          </ul>
        </div>

        <!-- 实用提示 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 实用提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">运放选型：</span>增益带宽积建议 ≥ 100×fc（高 Q 时更高），压摆率按 2π·fc·Vpp 估算；否则 fc 处的实际 Q 与增益会低于设计值。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">元件精度：</span>电阻用 ±1% 金属膜，电容用 NP0/C0G（陶瓷）或薄膜；X7R/Y5V 容值随偏压温度漂移，Q 会跟着漂。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">电容优先定值：</span>容值档比阻值档稀疏，先按常用容值定 C 再算 R；两支路等效阻抗尽量接近运放驱动能力（kΩ~百 kΩ 量级）。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">高 Q 风险：</span>Q 越高对元件误差越敏感（灵敏度 ∝ Q），Q &gt; 2 时建议改多重反馈（MFB）拓扑或数字滤波。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页按理想运放模型（输入阻抗无穷大、输出阻抗为零、带宽充足）推导，未计入运放有限带宽、输入电容与元件寄生；
        实际 fc/Q 请以网络分析仪或扫频实测为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是 Sallen-Key 滤波器</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          Sallen-Key 拓扑由 R.P. Sallen 与 E.L. Key 于 1955 年提出，用一只运放（或射极跟随器）加两电阻两电容即可实现二阶有源滤波器，
          是最常用的模拟有源滤波结构：元件少、输入阻抗高、输出阻抗低、可用单位增益缓冲。
          二阶低通的传递函数为 H(s) = K/(1 + s·D + s²·R1R2C1C2)，其中 D = C2(R1+R2) + R1C1(1−K)；
          特征频率 fc = 1/(2π√(R1R2C1C2))，Q = √(R1R2C1C2)/D。fc 由四个元件的"积"决定，Q 由"比与和"决定——
          这也是等值方案能用一个电容比 m 独立控制 Q 的原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么二阶滚降是 −40dB/dec</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          每个实极点在远高于转折频率处提供 −20dB/dec 的幅频斜率和最多 −90° 相移。一阶 RC 只有一个极点；
          二阶低通有两个极点（共轭复极点或两个实极点），远端斜率为 −40dB/dec，相位趋于 −180°。
          直观地说，每十倍频率，一阶把干扰压到 1/10，二阶压到 1/100。这使二阶成为"够陡又不复杂"的甜点位：
          抗混叠、电源纹波滤除、音频分频大多从二阶起步；需要更陡时按二阶节级联到四阶、六阶，
          而不是在单节里堆 Q（高 Q 对元件误差过于敏感且容易振铃）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Butterworth / Bessel / Chebyshev 三族响应</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三者都是二阶低通，区别只在 Q 的取值与极点布置：
          <span class="text-foreground font-medium">Butterworth（Q=0.707）</span>最平坦——通带内无纹波、fc 处恰为 −3dB、阶跃响应有轻度过冲，是"默认选择"；
          <span class="text-foreground font-medium">Bessel（Q=0.577）</span>线性相位——群延迟在通带内最平坦，波形保真最好，过冲最小，但滚降最缓、选择性差，适合脉冲与时域波形传输；
          <span class="text-foreground font-medium">Chebyshev（Q&gt;0.707）</span>等纹波——用通带纹波换取更陡的过渡带，Q 越高越陡但峰化、振铃与元件灵敏度越糟（本页取 0.96，约对应 1dB 纹波二阶口径）。
          选型口诀：要平坦选 Butterworth，要波形选 Bessel，要陡峭选 Chebyshev。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Q 的物理直觉</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Q 是二阶系统"阻尼深浅"的无量纲度量：Q = 1/(2ζ)，ζ 为阻尼比。Q 越小阻尼越重，响应迟缓但无过冲（Q=0.5 为临界阻尼，
          等值等容的单位增益 Sallen-Key 恰好落在这里）；Q = 0.707 是"最平坦"的折中；Q 再大，系统在 fc 附近存储越来越多能量，
          幅频曲线出现峰化（峰值 ≈ Q/√(1−1/4Q²)），时域阶跃响应出现振铃，衰减振荡 e^(−πft/√(1−1/4Q²)) 画出来的正是"欠阻尼弹簧"；
          Q→∞（K≥K_crit）阻尼消失，电路自激。Q 也等于谐振点的储能/耗能比之 2π 倍——同一公式贯通滤波器、弹簧与谐振腔。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">高阶滤波器的级联</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          四阶、六阶滤波器不直接设计，而是拆成多个二阶节串联，每节一个 fc 与一个 Q，
          按归一化表分配（如四阶 Butterworth 为两节 Q=0.54 与 Q=1.31）。级联顺序有讲究：
          把低 Q 节放输入级承受大信号，高 Q 节放末级以免中间级削顶；各级增益分配同理。
          注意每节 Sallen-Key 的同相增益 K 都会按 Q(K) = √(R1R2C1C2)/[C2(R1+R2)+R1C1(1−K)] 修改该节 Q——
          设计高阶级联时每节都要用本页方法按实际 K 回验；运放的增益与带宽核算可用
          <NuxtLink to="/tools/opamp-gain-calculator" class="text-primary hover:underline">运放增益计算器</NuxtLink>。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">R1=R2、C1=C2 时 Q 是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              单位增益下 Q = 0.5：Q = √(R1R2C1C2)/[C2(R1+R2)] = RC/(2RC) = 0.5。
              这是等值等容的"天赋 Q"，接近但不是严格的 Bessel（0.577）。想只改电容比拿高 Q，用等值方案：
              C1 = 4Q²·C2（Butterworth 时 C1 = 2×C2，Q = √2/2 = 0.707）。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么增益 K &gt; 3 会自激？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              增益出现在阻尼项 R1C1(1−K) 里：K&gt;1 时它是负的，抵消正阻尼 C2(R1+R2)。等值等容时阻尼 ∝ (3−K)，
              K≥3 时阻尼归零、Q 无意义，两个电容与运放构成正反馈回路而起振——这正是 Sallen-Key 振荡器的原理。
              一般电路的阈值 K_crit = 1 + C2(R1+R2)/(R1C1)，工程上留 20% 以上余量。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">fc 处的衰减一定是 −3dB 吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不是。fc 是特征频率，fc 处增益为 20·lg(K·Q)：只有 Butterworth（Q=0.707、K=1）才是 −3dB；
              Bessel 约 −4.8dB，Chebyshev（0.96）约 −0.35dB 且在更低频率处已出现峰值、−3dB 点前移。
              "截止频率"的工程含义（−3dB 点）与特征频率只在 Q=0.707 时重合。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">吸附后 Q 偏差太大怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              标准方案优先：R1≠R2 时电阻连续档位（E24）能吸收电容档位的误差，本页在最近档 ±1 档共 9 组组合中择优。
              若电容比落在两档之间（等值方案 Q 偏差 &gt; ±5%），可两只电容并联凑 C1（如 15nF+4.7nF≈19.7nF），
              或直接改用标准方案让电阻去凑。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'sallen-key-filter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Filter, Calculator, Info, CheckCircle, AlertTriangle,
  ChevronUp, ChevronDown, Lightbulb
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// E24 电阻基础档（每十进制位）
const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]
// 常用容值基础档（E12 口径，每十进制位）
const CB = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]

const TWO_PI = Math.PI * 2

function isPos(v) {
  return Number.isFinite(v) && v > 0
}

// 特征频率 fc = 1/(2π√(R1R2C1C2))，R 单位 Ω、C 单位 F → Hz
function fcHz(r1, r2, c1, c2) {
  if (!isPos(r1) || !isPos(r2) || !isPos(c1) || !isPos(c2)) return null
  return 1 / (TWO_PI * Math.sqrt(r1 * r2 * c1 * c2))
}

// 阻尼分母 D = C2(R1+R2) + R1C1(1−K)（C1 反馈电容、C2 对地电容，K 同相增益）
function dampingDen(r1, r2, c1, c2, k) {
  if (!isPos(r1) || !isPos(r2) || !isPos(c1) || !isPos(c2) || !Number.isFinite(k)) return null
  return c2 * (r1 + r2) + r1 * c1 * (1 - k)
}

// Q(K) = √(R1R2C1C2)/D；D ≤ 0 时自激，返回 null
function qFactor(r1, r2, c1, c2, k) {
  const den = dampingDen(r1, r2, c1, c2, k)
  if (den === null || den <= 0) return null
  return Math.sqrt(r1 * r2 * c1 * c2) / den
}

// 自激临界增益 K_crit = 1 + C2(R1+R2)/(R1C1)；等值等容时 = 3
function gainCrit(r1, r2, c1, c2) {
  if (!isPos(r1) || !isPos(r2) || !isPos(c1) || !isPos(c2)) return null
  return 1 + (c2 * (r1 + r2)) / (r1 * c1)
}

// 跨十进制取最近标准档：返回 { value, devPct }（devPct 有符号 %）
function snapSeries(value, base) {
  if (!isPos(value)) return null
  const exp = Math.floor(Math.log10(value))
  let best = null
  for (const e of [exp - 1, exp, exp + 1]) {
    for (const m of base) {
      const v = m * Math.pow(10, e)
      if (best === null || Math.abs(v - value) < Math.abs(best - value)) best = v
    }
  }
  return { value: best, devPct: ((best - value) / value) * 100 }
}

// E24 最近档 ±1 档的三个候选（Ω）
function e24Neighbors(r) {
  const snap = snapSeries(r, E24)
  if (!snap) return null
  const exp = Math.floor(Math.log10(snap.value + 1e-9))
  const mant = snap.value / Math.pow(10, exp)
  const idx = E24.findIndex(m => Math.abs(m - mant) < 1e-9)
  if (idx < 0) return [snap.value, snap.value, snap.value]
  const e = Math.pow(10, exp)
  const lo = (idx > 0 ? E24[idx - 1] : E24[E24.length - 1] * 0.1) * e
  const hi = (idx < E24.length - 1 ? E24[idx + 1] : E24[0] * 10) * e
  return [lo, snap.value, hi]
}

// 回验：给定吸附后元件与增益，返回实际 fc/Q 与相对目标偏差（%）
function verifyNetwork(r1, r2, c1, c2, k, fcTarget, qTarget) {
  const fcReal = fcHz(r1, r2, c1, c2)
  const qReal = qFactor(r1, r2, c1, c2, k)
  if (fcReal === null || qReal === null || !isPos(fcTarget) || !isPos(qTarget)) return null
  return {
    fcReal,
    qReal,
    fcDevPct: ((fcReal - fcTarget) / fcTarget) * 100,
    qDevPct: ((qReal - qTarget) / qTarget) * 100
  }
}

// 标准方案反解（K=1 设计，K 只用于回验）：R1R2 与 R1+R2 二次方程
// 返回 { kind:'ok', r1, r2 } 或 { kind:'impossible', ratio, needRatio, needC1 }
function standardScheme(fcTarget, qTarget, c1, c2) {
  if (!isPos(fcTarget) || !isPos(qTarget) || !isPos(c1) || !isPos(c2)) return null
  const p = 1 / (Math.pow(TWO_PI * fcTarget, 2) * c1 * c2)   // R1R2
  const ratio = c1 / c2
  const needRatio = 4 * qTarget * qTarget
  if (ratio < needRatio) {
    return { kind: 'impossible', ratio, needRatio, needC1: needRatio * c2 }
  }
  const s = Math.sqrt(p) * Math.sqrt(ratio) / qTarget       // R1+R2
  const disc = s * s - 4 * p
  if (!(disc > 0)) return { kind: 'impossible', ratio, needRatio, needC1: needRatio * c2 }
  const rSmall = (s - Math.sqrt(disc)) / 2                   // 较小者放输入侧（增益敏感位）
  const rBig = (s + Math.sqrt(disc)) / 2
  return { kind: 'ok', r1: rSmall, r2: rBig }
}

// 等值方案（K=1 设计）：R1=R2=R，C1 = 4Q²·C2，R = 1/(2πfc·√(C1C2))
function equalScheme(fcTarget, qTarget, c2) {
  if (!isPos(fcTarget) || !isPos(qTarget) || !isPos(c2)) return null
  const m = 4 * qTarget * qTarget
  const c1Exact = m * c2
  const rExact = 1 / (TWO_PI * fcTarget * Math.sqrt(c1Exact * c2))
  return { m, c1Exact, rExact }
}

// 常用容值档相邻两候选（C1 精确值向下/向上取档），等值方案取 Q 偏差更小者
function cbCandidates(cExact) {
  const exp = Math.floor(Math.log10(cExact))
  const mant = cExact / Math.pow(10, exp)
  let loIdx = -1
  let hiIdx = -1
  for (let i = 0; i < CB.length; i++) {
    if (CB[i] <= mant + 1e-12) loIdx = i
    if (hiIdx < 0 && CB[i] >= mant - 1e-12) hiIdx = i
  }
  const out = []
  const add = (mant2, e) => {
    const v = mant2 * Math.pow(10, e)
    if (!out.some(x => Math.abs(x - v) < 1e-18)) out.push(v)
  }
  if (loIdx >= 0) add(CB[loIdx], exp)
  if (hiIdx >= 0) add(CB[hiIdx], exp)
  if (loIdx >= 0 && loIdx === CB.length - 1) add(CB[0], exp + 1)
  if (hiIdx === 0) add(CB[CB.length - 1], exp - 1)
  if (out.length === 0) add(CB[0], exp)
  return out
}

// 等值方案完整求解：C1 相邻档取 Q 偏差最小 → R 取最近 E24 → 回验
function equalSchemeSolve(fcTarget, qTarget, c2, k) {
  const base = equalScheme(fcTarget, qTarget, c2)
  if (!base) return null
  let bestC1 = null
  let bestDev = null
  for (const c1Cand of cbCandidates(base.c1Exact)) {
    const r = 1 / (TWO_PI * fcTarget * Math.sqrt(c1Cand * c2))
    const q = qFactor(r, r, c1Cand, c2, k)
    if (q === null) continue
    const dev = Math.abs(q - qTarget) / qTarget
    if (bestDev === null || dev < bestDev) { bestDev = dev; bestC1 = c1Cand }
  }
  if (bestC1 === null) return { kind: 'oscillates' }
  const rExact = 1 / (TWO_PI * fcTarget * Math.sqrt(bestC1 * c2))
  const rSnap = snapSeries(rExact, E24)
  const v = verifyNetwork(rSnap.value, rSnap.value, bestC1, c2, k, fcTarget, qTarget)
  if (v === null) return { kind: 'oscillates' }
  return {
    kind: 'equal',
    m: base.m,
    c1ExactNf: base.c1Exact * 1e9,
    c1Snap: { value: bestC1, devPct: ((bestC1 - base.c1Exact) / base.c1Exact) * 100 },
    rExact,
    rSnap,
    kCrit: gainCrit(rSnap.value, rSnap.value, bestC1, c2),
    qAtUnity: qFactor(rSnap.value, rSnap.value, bestC1, c2, 1),
    ...v
  }
}

// 标准方案完整求解：反解 R1/R2 → E24 最近档 ±1 档 3×3 组合按最大偏差择优 → 回验
function standardSchemeSolve(fcTarget, qTarget, c1, c2, k) {
  const base = standardScheme(fcTarget, qTarget, c1, c2)
  if (!base) return null
  if (base.kind === 'impossible') {
    return { kind: 'impossible', ratio: base.ratio, needRatio: base.needRatio, needC1Nf: base.needC1 * 1e9 }
  }
  const n1 = e24Neighbors(base.r1)
  const n2 = e24Neighbors(base.r2)
  if (!n1 || !n2) return null
  let best = null
  for (const r1Cand of n1) {
    for (const r2Cand of n2) {
      const v = verifyNetwork(r1Cand, r2Cand, c1, c2, k, fcTarget, qTarget)
      if (v === null) continue
      const score = Math.max(Math.abs(v.fcDevPct), Math.abs(v.qDevPct))
      const cur = { r1Cand, r2Cand, score, ...v }
      if (best === null || cur.score < best.score ||
        (cur.score === best.score && Math.abs(cur.fcDevPct) < Math.abs(best.fcDevPct))) best = cur
    }
  }
  if (!best) return { kind: 'oscillates' }
  return {
    kind: 'standard',
    r1Exact: base.r1,
    r2Exact: base.r2,
    r1Snap: { value: best.r1Cand, devPct: ((best.r1Cand - base.r1) / base.r1) * 100 },
    r2Snap: { value: best.r2Cand, devPct: ((best.r2Cand - base.r2) / base.r2) * 100 },
    kCrit: gainCrit(best.r1Cand, best.r2Cand, c1, c2),
    qAtUnity: qFactor(best.r1Cand, best.r2Cand, c1, c2, 1),
    ...best
  }
}

// fc 处增益（dB）= 20lg(K·Q)
function gainAtFcDb(q, k) {
  if (!isPos(q) || !isPos(k)) return null
  return 20 * Math.log10(k * q)
}

// 峰化（Q > 1/√2）：峰值 dB 与峰值频率
function peaking(q, k, fcTarget) {
  if (!isPos(q) || !isPos(k) || !isPos(fcTarget)) return null
  if (q <= 1 / Math.SQRT2) return null
  const peak = k * q / Math.sqrt(1 - 1 / (4 * q * q))
  return {
    peakDb: 20 * Math.log10(peak),
    peakFreqHz: fcTarget * Math.sqrt(1 - 1 / (2 * q * q))
  }
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: 'Sallen-Key滤波器设计 - 二阶有源低通 fc/Q 与元件计算',
  description: '在线 Sallen-Key 二阶低通滤波器计算器：输入 fc 与 Q 值反解 R/C 元件，等值方案与标准方案双模式，E24 电阻与常用容值吸附回验偏差，增益 K 抬升 Q 与自激（K≥3）预警，Butterworth/Bessel/Chebyshev 预设。',
  keywords: 'sallen key, 有源滤波器, 低通滤波计算, 二阶滤波器, Q值, 巴特沃斯, 贝塞尔, 切比雪夫, E24, 滤波器设计',
  author: '有条工具',
  ogTitle: 'Sallen-Key滤波器设计 - 二阶有源低通 fc/Q 与元件计算 | 有条工具',
  ogDescription: 'fc/Q 反解元件、E24 与容值吸附回验、增益自激预警与三族响应预设。',
  ogUrl: 'https://www.util.cn/tools/sallen-key-filter',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Sallen-Key滤波器设计',
  twitterDescription: 'fc/Q 反解元件、吸附回验、增益自激预警。'
})

// JSON-LD 结构化数据（SoftwareApplication + FAQPage + BreadcrumbList）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Sallen-Key滤波器设计',
          url: 'https://www.util.cn/tools/sallen-key-filter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '标准方案（R1≠R2）与等值方案（R1=R2）双模式',
            'fc = 1/(2π√(R1R2C1C2))、Q = √(R1R2C1C2)/[C2(R1+R2)+R1C1(1−K)]',
            'Butterworth 0.707 / Bessel 0.577 / Chebyshev 0.96 预设',
            'C1/C2 ≥ 4Q² 无实数解预警',
            'E24 电阻 ±1 档 9 组合择优吸附与 fc/Q 回验',
            '常用容值档吸附（取 Q 偏差更小的相邻档）',
            '同相增益 K 抬升 Q 与 K_crit 自激红警',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'R1=R2、C1=C2 时 Q 是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '单位增益下 Q = 0.5。想只改电容比拿高 Q 用等值方案：C1 = 4Q²·C2，Butterworth 时 C1 = 2×C2，Q = √2/2 ≈ 0.707。' }
            },
            {
              '@type': 'Question',
              name: '为什么增益 K > 3 会自激？',
              acceptedAnswer: { '@type': 'Answer', text: '增益以 R1C1(1−K) 进入阻尼项，K≥3（等值等容口径）时阻尼归零、Q 无意义，电路正反馈自激；一般阈值 K_crit = 1 + C2(R1+R2)/(R1C1)。' }
            },
            {
              '@type': 'Question',
              name: 'fc 处的衰减一定是 −3dB 吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。fc 处增益为 20·lg(K·Q)，仅 Butterworth（Q=0.707、K=1）恰为 −3dB；高 Q 时出现峰化，−3dB 点上移。' }
            },
            {
              '@type': 'Question',
              name: '吸附后 Q 偏差太大怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '改用标准方案让 E24 电阻吸收容值档误差；或两只标准电容并联凑 C1；高 Q 对元件误差敏感，必要时改 MFB 拓扑。' }
            }
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: 'Sallen-Key滤波器设计', item: 'https://www.util.cn/tools/sallen-key-filter' }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'sallen-key-filter'
const SETTINGS_KEY = 'sallen-key-filter-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量 ----------
const FC_PRESETS = [
  { v: 100, label: '100Hz' },
  { v: 500, label: '500Hz' },
  { v: 1000, label: '1kHz' },
  { v: 5000, label: '5kHz' },
  { v: 10000, label: '10kHz' },
  { v: 20000, label: '20kHz' }
]
const Q_PRESETS = [
  { name: 'Butterworth', q: '0.707' },
  { name: 'Bessel', q: '0.577' },
  { name: 'Chebyshev', q: '0.96' }
]

// ---------- 状态 ----------
const scheme = ref('standard')    // 'standard' | 'equal'
const fcTarget = ref(1000)        // 截止频率 Hz
const qMode = ref('0.707')        // 预设值或 'custom'
const qCustom = ref(0.707)
const c1StdNf = ref(22)           // 标准方案 C1（nF）
const c2StdNf = ref(10)           // 标准方案 C2（nF）
const c2EqNf = ref(10)            // 等值方案 C2（nF）
const gainK = ref(1)              // 同相增益

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')
const devText = (devPct) => (Number.isFinite(devPct) ? (devPct >= 0 ? '+' : '') + devPct.toFixed(1) + '%' : '—')
const snapDevText = (devPct) => (devPct === 0 ? '精确档' : '偏差 ' + devText(devPct))

const qTarget = computed(() => {
  if (qMode.value === 'custom') return qCustom.value
  return parseFloat(qMode.value)
})

const qNote = (m) => {
  if (m === '0.707') return 'Butterworth：最平坦，fc 处 −3dB，无纹波（默认）'
  if (m === '0.577') return 'Bessel：线性相位群延迟，波形保真最好，滚降最缓'
  if (m === '0.96') return 'Chebyshev：约 1dB 纹波口径，过渡带更陡，峰化与振铃加重'
  return ''
}

// ---------- 主计算 ----------
const mainResult = computed(() => {
  const fc = fcTarget.value
  const q = qTarget.value
  const k = gainK.value
  if (!isPos(fc) || !isPos(q) || q > 5 || !Number.isFinite(k) || k < 1) return null

  let r
  if (scheme.value === 'equal') {
    const c2 = c2EqNf.value * 1e-9
    if (!isPos(c2)) return null
    r = equalSchemeSolve(fc, q, c2, k)
  } else {
    const c1 = c1StdNf.value * 1e-9
    const c2 = c2StdNf.value * 1e-9
    if (!isPos(c1) || !isPos(c2)) return null
    r = standardSchemeSolve(fc, q, c1, c2, k)
  }
  if (!r) return null

  if (r.kind === 'equal' || r.kind === 'standard') {
    const pk = peaking(r.qReal, k, fc)
    r.oscillates = false
    r.atFcDb = gainAtFcDb(r.qReal, k)
    r.peakDb = pk ? pk.peakDb : null
    r.peakFreqHz = pk ? pk.peakFreqHz : null
  } else if (r.kind === 'oscillates') {
    r.oscillates = true
    r.kCrit = null
    r.qReal = null
    r.qAtUnity = null
  } else if (r.kind === 'impossible') {
    r.oscillates = false
  }
  return r
})

const verdictText = (r) => {
  if (!r || r.qReal === null) return ''
  const okFc = Math.abs(r.fcDevPct) <= 5
  const okQ = Math.abs(r.qDevPct) <= 5
  if (okFc && okQ) return '吸附偏差在 ±5% 内，一般可直接采用'
  if (r.kCrit !== null && gainK.value >= r.kCrit) return '增益超过临界值，电路自激，必须调整'
  return '吸附偏差超过 ±5%：可微调至相邻档位、并联电容凑值，或调整 C 取值重算'
}

const verdictCls = (r) => {
  if (!r || r.qReal === null) return ''
  if (Math.abs(r.fcDevPct) <= 5 && Math.abs(r.qDevPct) <= 5) return 'text-green-600 dark:text-green-400'
  return 'text-amber-600 dark:text-amber-400'
}

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.scheme === 'standard' || s.scheme === 'equal') scheme.value = s.scheme
    if (Number.isFinite(s.fcTarget) && s.fcTarget > 0) fcTarget.value = s.fcTarget
    if (typeof s.qMode === 'string' && (s.qMode === 'custom' || Q_PRESETS.some(p => p.q === s.qMode))) qMode.value = s.qMode
    if (Number.isFinite(s.qCustom) && s.qCustom > 0) qCustom.value = s.qCustom
    if (Number.isFinite(s.c1StdNf) && s.c1StdNf > 0) c1StdNf.value = s.c1StdNf
    if (Number.isFinite(s.c2StdNf) && s.c2StdNf > 0) c2StdNf.value = s.c2StdNf
    if (Number.isFinite(s.c2EqNf) && s.c2EqNf > 0) c2EqNf.value = s.c2EqNf
    if (Number.isFinite(s.gainK) && s.gainK >= 1) gainK.value = s.gainK
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([scheme, fcTarget, qMode, qCustom, c1StdNf, c2StdNf, c2EqNf, gainK], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      scheme: scheme.value,
      fcTarget: fcTarget.value,
      qMode: qMode.value,
      qCustom: qCustom.value,
      c1StdNf: c1StdNf.value,
      c2StdNf: c2StdNf.value,
      c2EqNf: c2EqNf.value,
      gainK: gainK.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
