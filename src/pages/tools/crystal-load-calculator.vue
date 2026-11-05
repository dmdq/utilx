<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Timer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">晶振负载电容计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">外接电容匹配计算、E12 标准容值吸附回验、频偏 ppm 估算与常见 CL 速查表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线晶振负载电容计算器：按 CL = C1×C2/(C1+C2) + Cs 计算无源晶振两端对地外接电容，支持 C1=C2 对称与给定 C1 反求 C2 两种模式；
        计算值自动吸附贴片陶瓷电容 E12 标准档并回验实际 CL 与偏差、标注频偏方向；附频偏 ppm 线性估算（输入实际/标称 CL 与动态电容 C1m）、
        实焊电容反推杂散电容上限、常见 CL 速查表。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        计算口径：皮尔斯振荡器负载电容公式 CL = C1×C2/(C1+C2) + Cs，两只外接电容对地、串联后再与杂散电容并联；
        Cs 为 PCB 走线 + 芯片引脚 + 焊盘杂散，典型 3~5pF。频偏估算为线性近似（牵引模型），大幅偏离标称时误差增大，
        精确牵引特性以晶振厂商手册为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器列 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 正算外接电容 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 外接电容计算
          </h2>

          <!-- 模式二选一 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">计算模式</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="mode = 'sym'"
                :class="mode === 'sym' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >C1=C2 对称（每只等值）</button>
              <button
                @click="mode = 'asym'"
                :class="mode === 'asym' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >非对称（给定 C1 求 C2）</button>
            </div>
          </div>

          <!-- CL 规格 -->
          <div>
            <label for="clc-cl" class="block text-sm font-medium text-foreground mb-1.5">晶振规格负载电容 CL（pF）</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button
                v-for="p in CL_PRESETS"
                :key="p"
                @click="clTarget = p"
                :class="clTarget === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >{{ p }}</button>
            </div>
            <input
              id="clc-cl"
              v-model.number="clTarget"
              type="number"
              min="0.5"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 12.5"
            >
            <p class="text-xs text-muted-foreground mt-1">晶振规格书标注的 CL 值，可直接输入预设之外的值</p>
          </div>

          <!-- Cs 滑杆 -->
          <div>
            <label for="clc-cs" class="block text-sm font-medium text-foreground mb-1.5">
              杂散电容 Cs：<span class="text-primary">{{ fmt(csStray, 1) }} pF</span>
            </label>
            <input
              id="clc-cs"
              v-model.number="csStray"
              type="range"
              min="1"
              max="8"
              step="0.1"
              class="w-full border border-border rounded-lg accent-primary"
            >
            <p class="text-xs text-muted-foreground mt-1">PCB 走线 + 芯片引脚 + 焊盘杂散，典型 3~5pF；短走线四层板约 3pF，长走线或大封装可到 5pF 以上</p>
          </div>

          <!-- 非对称 C1 输入 -->
          <div v-if="mode === 'asym'">
            <label for="clc-c1" class="block text-sm font-medium text-foreground mb-1.5">给定 C1（pF，必须大于 CL−Cs）</label>
            <input
              id="clc-c1"
              v-model.number="c1Asym"
              type="number"
              min="0.5"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 22"
            >
            <p class="text-xs text-muted-foreground mt-1">C1 为实焊（或拟用）容值，工具反求满足 CL 的 C2</p>
          </div>

          <!-- 对称模式结果 -->
          <div v-if="mainResult && mainResult.kind === 'sym'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">每只外接电容（精确值）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.cExact, 2) }} <span class="text-sm">pF</span></p>
                <p class="text-xs text-muted-foreground mt-1">C = 2×(CL − Cs) = 2×({{ fmt(clTarget, 1) }} − {{ fmt(csStray, 1) }})</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">E12 标准容值吸附</p>
                <p class="text-2xl font-bold text-foreground">{{ mainResult.snap }} <span class="text-sm">pF</span></p>
                <p class="text-xs mt-1" :class="mainResult.snapDevPct === 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                  {{ mainResult.snapDevPct === 0 ? '精确档，无需凑值' : '容值偏差 ' + devText(mainResult.snapDevPct) }}
                </p>
              </div>
            </div>
            <div class="pt-3 border-t border-primary/20 text-sm">
              <p class="text-muted-foreground">
                回验实际负载电容：CL_real = C²/(2×C) + Cs =
                <span class="font-semibold text-foreground">{{ fmt(mainResult.clReal, 2) }} pF</span>
                （目标 {{ fmt(clTarget, 1) }} pF，偏差 <span :class="devCls(mainResult.clDevPct)">{{ devText(mainResult.clDevPct) }}</span>）
              </p>
              <p v-if="clDirection" class="mt-1.5 text-xs" :class="clDirection.cls">{{ clDirection.text }}</p>
              <p v-if="clAcceptable" class="mt-1 text-xs text-green-600 dark:text-green-400">吸附偏差在 ±5% 内，一般可直接采用</p>
            </div>
          </div>

          <!-- 非对称模式结果 -->
          <div v-else-if="mainResult && mainResult.kind === 'asym'" class="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">C2 精确值（C1 = {{ fmt(mainResult.c1, 1) }} pF）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(mainResult.c2Exact, 2) }} <span class="text-sm">pF</span></p>
                <p class="text-xs text-muted-foreground mt-1">C2 = C1×(CL−Cs)/(C1−(CL−Cs))，其中 CL−Cs = {{ fmt(mainResult.k, 2) }} pF</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-0.5">C2 E12 标准容值吸附</p>
                <p class="text-2xl font-bold text-foreground">{{ mainResult.snap }} <span class="text-sm">pF</span></p>
                <p class="text-xs mt-1" :class="mainResult.snapDevPct === 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                  {{ mainResult.snapDevPct === 0 ? '精确档，无需凑值' : '容值偏差 ' + devText(mainResult.snapDevPct) }}
                </p>
              </div>
            </div>
            <div class="pt-3 border-t border-primary/20 text-sm">
              <p class="text-muted-foreground">
                回验（C1 保持实焊值、仅吸附 C2）：CL_real = C1×C2/(C1+C2) + Cs =
                <span class="font-semibold text-foreground">{{ fmt(mainResult.clReal, 2) }} pF</span>
                （目标 {{ fmt(clTarget, 1) }} pF，偏差 <span :class="devCls(mainResult.clDevPct)">{{ devText(mainResult.clDevPct) }}</span>）
              </p>
              <p v-if="clDirection" class="mt-1.5 text-xs" :class="clDirection.cls">{{ clDirection.text }}</p>
              <p v-if="clAcceptable" class="mt-1 text-xs text-green-600 dark:text-green-400">吸附偏差在 ±5% 内，一般可直接采用</p>
            </div>
          </div>

          <!-- 非对称无解 -->
          <div v-else-if="mainResult && mainResult.kind === 'asym-unsolvable'" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">无解：C1 必须大于 CL−Cs</p>
              <p class="text-xs text-muted-foreground mt-1">
                目标串联等效 CL−Cs = {{ fmt(mainResult.k, 2) }} pF，而 C1 = {{ fmt(c1Asym, 1) }} pF 不大于该值。
                两只电容串联的等效值总是小于任何一只，C1 太小时无论 C2 取多大都达不到目标 CL——请换更小的 C1 或减小 Cs。
              </p>
            </div>
          </div>

          <!-- CL ≤ Cs 无解 -->
          <div v-else-if="mainResult && mainResult.kind === 'asym-no-k'" class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">无解：CL ≤ Cs</p>
              <p class="text-xs text-muted-foreground mt-1">
                杂散电容 Cs = {{ fmt(csStray, 1) }} pF 已不低于目标 CL = {{ fmt(clTarget, 1) }} pF，
                串联外接电容需要为正值而无解。请选择 CL 更大的晶振规格，或缩短走线降低 Cs。
              </p>
            </div>
          </div>

          <!-- 参数无效 -->
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查参数：CL &gt; 0，Cs 在 1~8 pF；非对称模式下 C1 &gt; 0。</p>
            </div>
          </div>

          <p class="text-xs leading-relaxed text-muted-foreground">
            容值吸附说明：贴片陶瓷电容只有 E12 等标准档位，按最近档取用即可；吸附后已自动回验实际 CL，
            并标注频偏方向——<span class="text-foreground font-medium">实际 CL 偏大则振荡频率偏低（偏慢），偏小则偏高（偏快）</span>。
            相邻两档都可接受时，宁可选实际 CL 更接近目标的一档。
          </p>
        </div>

        <!-- 频偏估算（进阶） -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Activity class="w-5 h-5 mr-2 text-primary" /> 频偏估算（进阶）
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label for="clc-cla" class="block text-sm font-medium text-foreground mb-1.5">实际 CL（pF）</label>
              <input
                id="clc-cla"
                v-model.number="clActual"
                type="number"
                min="0.5"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div>
              <label for="clc-cln" class="block text-sm font-medium text-foreground mb-1.5">标称 CL（pF）</label>
              <input
                id="clc-cln"
                v-model.number="clNominalAdv"
                type="number"
                min="0.5"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div>
              <label for="clc-c1m" class="block text-sm font-medium text-foreground mb-1.5">动态电容 C1m（pF）</label>
              <input
                id="clc-c1m"
                v-model.number="c1mPf"
                type="number"
                min="0.001"
                step="0.001"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">典型 0.003~0.015pF（3~15fF），默认 5fF，以手册为准</p>
            </div>
            <div>
              <label for="clc-freq" class="block text-sm font-medium text-foreground mb-1.5">标称频率（MHz）</label>
              <input
                id="clc-freq"
                v-model.number="freqMhz"
                type="number"
                min="0.032768"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">默认 8MHz，可改</p>
            </div>
          </div>

          <div v-if="freqResult" class="p-4 rounded-lg border border-border bg-muted/50">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Δf/f（相对频偏）</p>
                <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {{ freqResult.ppm >= 0 ? '+' : '' }}{{ fmt(freqResult.ppm, 1) }} ppm
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">方向</p>
                <p class="text-sm font-medium text-foreground pt-1.5">
                  <span v-if="freqResult.ppm > 0">实际 CL 偏小 → 频率偏高（偏快）</span>
                  <span v-else-if="freqResult.ppm < 0">实际 CL 偏大 → 频率偏低（偏慢）</span>
                  <span v-else>无频偏</span>
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">{{ fmt(freqMhz, 2) }} MHz 下的偏移</p>
                <p class="text-2xl font-bold text-foreground">{{ freqResult.hz >= 0 ? '+' : '' }}{{ fmt(freqResult.hz, 1) }} <span class="text-sm">Hz</span></p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
              Δf/f ≈ (C1m/2)×(1/CL_actual − 1/CL_nominal)，符号约定：结果为正表示实际频率高于标称。
              此为线性近似估算（牵引电容模型），CL 偏离标称较大时误差增大，精确牵引曲线以晶振手册为准。
            </p>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-muted-foreground">请检查参数：实际 CL、标称 CL、C1m 均须大于 0。</p>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 反算 Cs 上限 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 反算杂散电容上限
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="clc-cinst" class="block text-sm font-medium text-foreground mb-1.5">实焊每只 C（pF）</label>
              <input
                id="clc-cinst"
                v-model.number="cInstalled"
                type="number"
                min="0.5"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div>
              <label for="clc-clrev" class="block text-sm font-medium text-foreground mb-1.5">目标 CL（pF）</label>
              <input
                id="clc-clrev"
                v-model.number="clReverse"
                type="number"
                min="0.5"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
          </div>

          <div v-if="reverseResult && !reverseResult.negative" class="bg-muted/50 rounded-lg p-3 border border-border">
            <p class="text-xs text-muted-foreground">允许杂散上限 Cs_max = CL − C/2</p>
            <p class="text-xl font-bold text-primary mt-1">≤ {{ fmt(reverseResult.csMax, 2) }} pF</p>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
              C/2 = {{ fmt(reverseResult.half, 1) }} pF。板上实际杂散（走线+引脚+焊盘）只要不超过此值，
              实际 CL 就不会超过目标；典型板杂散 3~5pF，若上限低于 3pF 需缩短走线或换更小容值。
            </p>
          </div>
          <div v-else-if="reverseResult && reverseResult.negative" class="rounded-lg p-3 bg-red-500/10 border border-red-500/20">
            <p class="text-sm font-medium text-foreground flex items-center gap-1.5">
              <AlertTriangle class="w-4 h-4 text-red-500" /> 超标：无法达到目标 CL
            </p>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              C/2 = {{ fmt(reverseResult.half, 1) }} pF 已超过目标 CL = {{ fmt(clReverse, 1) }} pF，
              Cs_max = {{ fmt(reverseResult.csMax, 2) }} pF 为负——即使零杂散也超标：
              PCB 布局杂散过大或选错电容，应换更小一档容值。
            </p>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            用途：手头只有 22pF 等固定档位时，反查它对目标 CL 还留有多少杂散余量；余量为负说明该档电容偏大，实装必然频偏。
          </p>
        </div>

        <!-- 经验提示卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 实用提示
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">Cs 怎么取：</span>先用 3.5pF 试算，装上后若频率明显偏低说明杂散比预估小，可减小外接电容微调。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">买不到算出的容值：</span>用两只标准档并联/串联凑，如 15pF 串 100pF ≈ 13.0pF。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">方向口诀：</span>容大频低、容小频高——微调频率时按此方向增减电容。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">有源晶振免算：</span>内部振荡电路出厂已按晶体 CL 匹配，外部无需接负载电容。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 常见 CL 速查表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <Table class="w-5 h-5 mr-2 text-primary" /> 常见 CL × Cs 推荐外接电容速查（C1=C2 对称）
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground">
              <th class="text-left py-2 pr-3 font-medium">CL ↓ / Cs →</th>
              <th v-for="cs in QUICK_CS" :key="cs" class="text-right py-2 px-3 font-medium">{{ cs }} pF</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in quickTable" :key="row.cl" class="border-t border-border/50">
              <td class="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">{{ row.cl }} pF</td>
              <td v-for="cell in row.cells" :key="cell.cs" class="py-2.5 px-3 text-right">
                <p class="font-semibold" :class="cell.devPct === 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground'">
                  {{ cell.snap }} pF
                </p>
                <p class="text-[11px] text-muted-foreground mt-0.5">
                  精确 {{ fmt(cell.exact, 1) }}pF{{ cell.devPct === 0 ? ' · 精确档' : ' · 偏 ' + devText(cell.devPct) }}
                </p>
                <p class="text-[11px]" :class="devCls(cell.clDevPct)">CL_real {{ fmt(cell.real, 2) }}pF（{{ devText(cell.clDevPct) }}）</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
        表内全部数值由与上方计算器同一组函数生成：精确值 C = 2×(CL−Cs)，再吸附 E12 标准档并回验实际 CL。
        例如 12.5pF / 3.5pF → 18pF 为精确档（CL_real 恰为 12.5pF，零偏差）；绿色为 E12 精确命中档。
      </p>
    </div>

    <!-- 免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页按皮尔斯振荡器负载电容公式与线性牵引模型估算，晶振的动态电容 C1m、ESR、驱动功率与温度牵引特性以厂商手册为准；
        批量产品请以频率计实测为准微调。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是负载电容</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          负载电容 CL（Load Capacitance）是石英谐振器规格书规定的<span class="text-foreground font-medium">振荡电路交流负载条件</span>：
          从晶振两个引脚向电路看进去的总等效电容。无源晶振的标称频率不是"裸晶体"频率，而是在规定 CL（如 12.5pF、18pF）下
          与振荡电路联测标定的频率——电路实际呈现的电容等于 CL 时，振荡频率才落在标称值上；偏大则频率偏低、偏小则偏高。
          在皮尔斯（Pierce）振荡器里，这个负载由晶振两端各接一只对地电容（C1、C2）串联，再叠加电路杂散电容 Cs 构成：
          CL = C1×C2/(C1+C2) + Cs。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么通常取 C1 = C2 对称</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两只电容串联的等效值为 C1×C2/(C1+C2)。C1=C2 时，相同元件数下串联值达到"每只容量的一半"这一最大可能组合，
          用较小容值即可满足较大的 CL，同时两支路对地直流对称、PCB 可对称布线，有利于起振裕度与 EMC。
          非对称配置多用于精细微调频率（改变比值改变串联等效值）或兼顾输入/输出引脚不同的杂散条件；
          数学上要求给定的一只（C1）必须大于 CL−Cs，否则另一只无论取多大都无解。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">杂散电容 Cs 怎么估</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Cs 由三部分组成：MCU 的 OSC_IN/OSC_OUT 引脚电容（手册通常给 3~5pF/脚，两只脚串联后约一半）、
          PCB 走线对地电容（典型 1~3pF，取决于长度与层结构）以及焊盘/外壳杂散。工程上常按<span class="text-foreground font-medium">典型 3~5pF</span> 取值：
          短走线四层板取 3pF 左右，走线较长或封装偏大取 5pF 上下。精确测法是把外接电容拆下、
          在焊盘处用 LCR 表（或带电容测量的示波器方案）测对地杂散；多数场景用 3.5pF 试算再实测微调已足够。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">CL 选错的常见症状</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><span class="text-foreground font-medium">频率偏差：</span>外接电容选大 → 实际 CL 偏大 → 频率偏低；选小则偏高。皮尔斯电路的牵引灵敏度约为每 pF 数十 ppm 量级（与 C1m 有关）。</li>
          <li><span class="text-foreground font-medium">不起振 / 起振慢：</span>CL 选得过大时环路增益不足，低温或低压下可能完全不起振，常温下表现为启动时间明显变长。</li>
          <li><span class="text-foreground font-medium">裕度与温漂变差：</span>实际 CL 偏离设计值会让振荡更接近临界状态，对温度、电压波动的敏感度上升，等效串联电阻表现恶化。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">有源晶振为什么不用算</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          有源晶振（XO/TCXO/OCXO）内部已集成了完整的振荡电路，晶振与匹配电容在出厂前已按标称频率调好，
          外部只需供电、使能与输出匹配，不需要也不应该再在输入端接负载电容。本工具只针对<span class="text-foreground font-medium">无源晶体谐振器</span>
          （两引脚贴片/直插晶体）的外接电容匹配。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">12.5pF 晶振配多大电容？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              取决于杂散电容 Cs。按 Cs = 3.5pF 计：每只 C = 2×(12.5−3.5) = 18pF，恰好是 E12 精确档，直接取两只 18pF 即可；
              Cs 取 3pF 时约 19pF（吸附 18pF），Cs 取 5pF 时为 15pF（精确档）。
              不确定 Cs 时按 3.5pF 起算，实测频率偏低则减小电容、偏高则增大。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">22pF 是万能值吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不是。两只 22pF 对 C1=C2 对称电路的实际 CL = 22/2 + Cs = 11 + Cs pF：按典型 Cs 3.5pF 算实际 CL ≈ 14.5pF，
              比 12.5pF 晶振偏大约 16%，频率会偏低（典型数十 ppm）。很多板子"能跑"是因为主控对频偏容忍度高（如 UART 波动几 %），
              但 USB、CAN、RTC 等对精度敏感的外设就会出问题。按 CL 与实际 Cs 计算并吸附标准档更可靠。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">不起振和负载电容有关吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              有关。外接电容取值过大（实际 CL 远超晶振规格）会显著降低环路增益，典型表现是常温起振缓慢、
              低温下完全不起振；电容取值过小则频率偏高、裕度差。但不起振也可能是晶体破损/受潮、
            焊接不良、驱动功率不匹配或限流电阻取值问题，需按"先查焊接与器件、再核电容匹配"的顺序排查。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算出来的容值买不到怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              实物只有 E12 等标准档位。优先取本工具吸附后的最近档并看回验偏差（±5% 内一般可接受）；
              偏差过大时用两只标准档凑：并联相加、串联取积除以和，例如 15pF 串 100pF ≈ 13.0pF。
              注意凑值会增加焊盘数量、略微增大杂散，按新杂散复核一遍。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'crystal-load-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Timer, Calculator, Activity, Search, Table, Info, CheckCircle,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 贴片陶瓷电容 E12 标准容值档（pF）
const E12_PF = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2, 10, 12, 15, 18, 22, 27, 33, 39, 47]

// 两只电容串联等效：C_series = C1×C2/(C1+C2)（pF）
function seriesEq(c1, c2) {
  if (!Number.isFinite(c1) || !Number.isFinite(c2) || !(c1 > 0) || !(c2 > 0)) return null
  return (c1 * c2) / (c1 + c2)
}

// 对称模式：C1=C2=C → CL = C/2 + Cs → 每只 C = 2×(CL−Cs)（pF）
function symmetricCap(cl, cs) {
  if (!Number.isFinite(cl) || !Number.isFinite(cs) || !(cl > 0) || !(cs >= 0)) return null
  const need = cl - cs
  if (!(need > 0)) return null
  return 2 * need
}

// 非对称模式：给定 C1 求满足 CL 的 C2 = C1×(CL−Cs)/(C1−(CL−Cs))，要求 C1 > CL−Cs（pF）
function asymmetricCap2(c1, cl, cs) {
  if (!Number.isFinite(c1) || !Number.isFinite(cl) || !Number.isFinite(cs) || !(c1 > 0) || !(cl > 0) || !(cs >= 0)) return null
  const k = cl - cs
  if (!(k > 0) || !(c1 > k)) return null
  return (c1 * k) / (c1 - k)
}

// 最近 E12 档吸附：返回档位与相对偏差 %（有符号）
function nearestE12(c) {
  if (!Number.isFinite(c) || !(c > 0)) return null
  let best = E12_PF[0]
  for (const s of E12_PF) {
    if (Math.abs(s - c) < Math.abs(best - c)) best = s
  }
  return { step: best, devPct: ((best - c) / c) * 100 }
}

// 吸附后实际负载电容回验：CL_real = C²/(2×C) + Cs（pF）
function clAfterSnap(c, cs) {
  if (!Number.isFinite(c) || !Number.isFinite(cs) || !(c > 0) || !(cs >= 0)) return null
  return (c * c) / (2 * c) + cs
}

// 频偏线性近似：Δf/f ≈ (C1m/2)×(1/CL_actual − 1/CL_nominal)，输入 pF，返回 ppm（正 = 频率偏高）
function freqOffsetPpm(clActual, clNominal, c1m) {
  if (!Number.isFinite(clActual) || !Number.isFinite(clNominal) || !Number.isFinite(c1m)) return null
  if (!(clActual > 0) || !(clNominal > 0) || !(c1m > 0)) return null
  return (c1m / 2) * (1 / clActual - 1 / clNominal) * 1e6
}

// ppm → 指定频率（MHz）下的 Hz 偏移：ppm×1e-6 × freqMhz×1e6 = ppm×freqMhz
function ppmToHz(ppm, freqMhz) {
  if (!Number.isFinite(ppm) || !Number.isFinite(freqMhz) || !(freqMhz > 0)) return null
  return ppm * 1e-6 * freqMhz * 1e6
}

// 反算杂散电容上限：C1=C2=C 实焊时允许的 Cs 上限 = CL − C/2（pF，负值 = 无法达标）
function strayCapLimit(cInstalled, cl) {
  if (!Number.isFinite(cInstalled) || !Number.isFinite(cl) || !(cInstalled > 0) || !(cl > 0)) return null
  return cl - cInstalled / 2
}
// ==== PURE-FNS-END ====

// SEO
useSeoMeta({
  title: '晶振负载电容计算器 - 外接电容匹配与频偏估算',
  description: '在线晶振负载电容计算器：按 CL = C1×C2/(C1+C2)+Cs 计算无源晶振外接电容，E12 标准容值吸附回验、频偏 ppm 线性估算、实焊电容反推杂散上限与常见 CL 速查表，纯本地计算。',
  keywords: '晶振负载电容, 晶振匹配电容, cl计算, 晶振电容选型, 频偏计算, 晶振外接电容, 12.5pF电容, ppm计算',
  author: '有条工具',
  ogTitle: '晶振负载电容计算器 - 外接电容匹配与频偏估算 | 有条工具',
  ogDescription: '无源晶振外接电容计算、E12 吸附回验、频偏 ppm 估算与常见 CL 速查表。',
  ogUrl: 'https://www.util.cn/tools/crystal-load-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '晶振负载电容计算器',
  twitterDescription: '无源晶振外接电容计算、E12 吸附回验、频偏 ppm 估算。'
})

// JSON-LD 结构化数据（SoftwareApplication + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '晶振负载电容计算器',
          url: 'https://www.util.cn/tools/crystal-load-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '对称 C1=C2 与非对称给定 C1 求 C2 两种模式',
            'CL = C1×C2/(C1+C2)+Cs 负载电容公式',
            '杂散电容 Cs 1~8pF 滑杆输入',
            'E12 标准容值吸附与实际 CL 回验',
            '频偏 ppm 线性估算与 Hz 偏移换算',
            '实焊电容反推杂散电容上限',
            '常见 CL × Cs 推荐容值速查表',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '12.5pF 晶振配多大电容？',
              acceptedAnswer: { '@type': 'Answer', text: '按 Cs=3.5pF 计每只 C = 2×(12.5−3.5) = 18pF，为 E12 精确档；Cs 取 5pF 时为 15pF，按实际杂散调整。' }
            },
            {
              '@type': 'Question',
              name: '22pF 是万能值吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。两只 22pF 的实际 CL ≈ 11+Cs ≈ 14.5pF，比 12.5pF 晶振偏大约 16%，频率偏低；应按 CL 与实际 Cs 计算取档。' }
            },
            {
              '@type': 'Question',
              name: '不起振和负载电容有关吗？',
              acceptedAnswer: { '@type': 'Answer', text: '有关。外接电容过大使环路增益不足，低温低压下可能不起振；但也需排查焊接、晶体破损与驱动功率匹配。' }
            },
            {
              '@type': 'Question',
              name: '算出来的容值买不到怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '取最近的 E12 标准档并回验偏差（±5% 内可接受），偏差大时用两只标准档串/并联凑值。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'crystal-load-calculator'
const SETTINGS_KEY = 'crystal-load-calculator-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 常量 ----------
const CL_PRESETS = [7, 8, 9, 12.5, 18, 20]
const QUICK_CL = [7, 8, 9, 12.5, 18, 20]
const QUICK_CS = [3, 3.5, 5]

// ---------- 状态 ----------
const mode = ref('sym')            // 'sym' 对称 | 'asym' 非对称
const clTarget = ref(12.5)         // 晶振规格 CL（pF）
const csStray = ref(3.5)           // 杂散电容（pF）
const c1Asym = ref(22)             // 非对称模式给定 C1（pF）

// 频偏估算（进阶）
const clActual = ref(9.5)
const clNominalAdv = ref(12.5)
const c1mPf = ref(0.005)
const freqMhz = ref(8)

// 反算 Cs 上限
const cInstalled = ref(18)
const clReverse = ref(12.5)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
const fmt = (v, d = 2) => (Number.isFinite(v) ? String(parseFloat(v.toFixed(d))) : '—')
const devText = (devPct) => (Number.isFinite(devPct) ? (devPct >= 0 ? '+' : '') + devPct.toFixed(1) + '%' : '—')
const devCls = (devPct) => {
  if (!Number.isFinite(devPct)) return ''
  return Math.abs(devPct) <= 5
    ? 'text-green-600 dark:text-green-400'
    : 'text-amber-600 dark:text-amber-400'
}

// ---------- 主计算 ----------
const mainResult = computed(() => {
  const cl = clTarget.value
  const cs = csStray.value
  if (!Number.isFinite(cl) || !(cl > 0) || !Number.isFinite(cs) || !(cs >= 0)) return null

  if (mode.value === 'sym') {
    const exact = symmetricCap(cl, cs)
    if (exact === null) return null
    const snap = nearestE12(exact)
    const real = clAfterSnap(snap.step, cs)
    return {
      kind: 'sym',
      cExact: exact,
      snap: snap.step,
      snapDevPct: snap.devPct,
      clReal: real,
      clDevPct: ((real - cl) / cl) * 100
    }
  }

  // 非对称
  const c1 = c1Asym.value
  if (!Number.isFinite(c1) || !(c1 > 0)) return null
  const k = cl - cs
  if (!(k > 0)) return { kind: 'asym-no-k' }
  const c2 = asymmetricCap2(c1, cl, cs)
  if (c2 === null) return { kind: 'asym-unsolvable', k }
  const snap = nearestE12(c2)
  const real = seriesEq(c1, snap.step) + cs
  return {
    kind: 'asym',
    c1,
    k,
    c2Exact: c2,
    snap: snap.step,
    snapDevPct: snap.devPct,
    clReal: real,
    clDevPct: ((real - cl) / cl) * 100
  }
})

// 频偏方向注记：实际 CL 偏大 → 频率偏低；偏小 → 偏高
const clDirection = computed(() => {
  const r = mainResult.value
  if (!r || !Number.isFinite(r.clDevPct)) return null
  if (r.clDevPct === 0) return { text: '吸附后实际 CL 与目标精确一致', cls: 'text-green-600 dark:text-green-400' }
  return r.clDevPct > 0
    ? { text: '实际 CL 偏大 → 振荡频率将偏低（偏慢）', cls: 'text-amber-600 dark:text-amber-400' }
    : { text: '实际 CL 偏小 → 振荡频率将偏高（偏快）', cls: 'text-amber-600 dark:text-amber-400' }
})

const clAcceptable = computed(() => {
  const r = mainResult.value
  return !!r && Number.isFinite(r.clDevPct) && Math.abs(r.clDevPct) <= 5
})

// ---------- 频偏估算 ----------
const freqResult = computed(() => {
  const ppm = freqOffsetPpm(clActual.value, clNominalAdv.value, c1mPf.value)
  if (ppm === null) return null
  const hz = ppmToHz(ppm, freqMhz.value)
  return { ppm, hz: Number.isFinite(hz) ? hz : null }
})

// ---------- 反算 Cs ----------
const reverseResult = computed(() => {
  const csMax = strayCapLimit(cInstalled.value, clReverse.value)
  if (csMax === null) return null
  return { csMax, negative: csMax < 0, half: cInstalled.value / 2 }
})

// ---------- 常见 CL 速查表（与主计算同一组函数生成） ----------
const quickTable = QUICK_CL.map(cl => ({
  cl,
  cells: QUICK_CS.map(cs => {
    const exact = symmetricCap(cl, cs)
    const snap = nearestE12(exact)
    const real = clAfterSnap(snap.step, cs)
    return {
      cs,
      exact,
      snap: snap.step,
      devPct: snap.devPct,
      real,
      clDevPct: ((real - cl) / cl) * 100
    }
  })
}))

// ---------- 设置持久化（localStorage，键前缀用工具 id） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.mode === 'sym' || s.mode === 'asym') mode.value = s.mode
    if (Number.isFinite(s.clTarget) && s.clTarget > 0) clTarget.value = s.clTarget
    if (Number.isFinite(s.csStray) && s.csStray >= 1 && s.csStray <= 8) csStray.value = s.csStray
    if (Number.isFinite(s.c1Asym) && s.c1Asym > 0) c1Asym.value = s.c1Asym
    if (Number.isFinite(s.clActual) && s.clActual > 0) clActual.value = s.clActual
    if (Number.isFinite(s.clNominalAdv) && s.clNominalAdv > 0) clNominalAdv.value = s.clNominalAdv
    if (Number.isFinite(s.c1mPf) && s.c1mPf > 0) c1mPf.value = s.c1mPf
    if (Number.isFinite(s.freqMhz) && s.freqMhz > 0) freqMhz.value = s.freqMhz
    if (Number.isFinite(s.cInstalled) && s.cInstalled > 0) cInstalled.value = s.cInstalled
    if (Number.isFinite(s.clReverse) && s.clReverse > 0) clReverse.value = s.clReverse
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, clTarget, csStray, c1Asym, clActual, clNominalAdv, c1mPf, freqMhz, cInstalled, clReverse], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      clTarget: clTarget.value,
      csStray: csStray.value,
      c1Asym: c1Asym.value,
      clActual: clActual.value,
      clNominalAdv: clNominalAdv.value,
      c1mPf: c1mPf.value,
      freqMhz: freqMhz.value,
      cInstalled: cInstalled.value,
      clReverse: clReverse.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
